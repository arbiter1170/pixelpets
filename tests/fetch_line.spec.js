/* NPC-only Fetchling line: data, art, wild exclusion, journal count, and grow-up moves. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, shot } = require('./helpers');

trackErrors(test, expect);

const BASE = {
  'fetch/0': { hp: 54, atk: 48, def: 48, spd: 42 },
  'fetch/1': { hp: 72, atk: 64, def: 64, spd: 56 },
  'fetch/2': { hp: 90, atk: 80, def: 80, spd: 70 },
};
const LEARN = {
  'fetch/0': [[1, 'seed_fetch'], [1, 'seed_toss'], [1, 'sap_sip'], [9, 'clover_swat'], [12, 'thorn_lash'], [15, 'mist_veil'], [18, 'burr_tangle'], [20, 'briar_volley'], [25, 'stoke_up'], [30, 'undertow']],
  'fetch/1': [[0, 'fetch_dash'], [22, 'pebble_flick']],
  'fetch/2': [[0, 'steadfast_paw'], [27, 'full_tilt']],
};

async function gotoDebug(page) {
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets.debug === true && typeof window.PixelPets.giveXp === 'function');
}

test('the Fetchling line stays out of the wild and the journal', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoDebug(page);
  const info = await page.evaluate(() => {
    const i = SPECIES.findIndex(s => s.id === 'fetch');
    const sp = SPECIES[i];
    const tags = [['meadow'], ['hot', 'meadow', 'city'], ['forest', 'park', 'meadow'], ['storm', 'snow', 'windy'], ['night', 'fog', 'forest'], ['water', 'rain'], ['city', 'storm']];
    const tablesObj = PixelPets.spawnTables();
    const odds = [];
    for (const key of Object.keys(tablesObj)) for (const t of tags) odds.push(PixelPets.spawnOdds(t, key)[i]);
    odds.push(PixelPets.spawnOdds(['meadow'], 'proto')[i]);
    const tables = Object.entries(tablesObj).filter(([, v]) => (v.table || []).some(row => row[0] === 'fetch')).map(([k]) => k);
    const hex = (r, g, b) => '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
    const art = sp.stages.map(st => {
      const c = buildSprite(st.grid, null, 'normal');
      const d = c.getContext('2d').getImageData(0, 0, 18, 18).data;
      const at = (x, y) => { const p = (y * 18 + x) * 4; return d[p + 3] ? hex(d[p], d[p + 1], d[p + 2]) : ''; };
      const colors = new Set();
      let left = 0, right = 0;
      for (let y = 0; y < 18; y++) for (let x = 0; x < 18; x++) {
        const p = (y * 18 + x) * 4;
        if (!d[p + 3]) continue;
        colors.add(hex(d[p], d[p + 1], d[p + 2]));
        if (x < 9) left++; else right++;
      }
      return { colors: [...colors], left, right, rows: st.grid.length, wide: st.grid.every(r => r.length === 16), sample: at(11, 6) };
    });
    const evoOwners = {};
    SPECIES.forEach(s => s.stages.forEach((st, k) => {
      PixelPets.learnset(s.id + '/' + k).forEach(e => {
        if (e.lv === 0 && e.stage === k) (evoOwners[e.id] = evoOwners[e.id] || []).push(s.id + '/' + k);
      });
    }));
    const scale = 6;
    const sheet = document.createElement('canvas');
    sheet.id = 'fetchSheet';
    sheet.width = sp.stages.length * 18 * scale;
    sheet.height = 18 * scale;
    sheet.style.cssText = 'position:fixed;left:8px;top:8px;z-index:80;background:#1a1c2c;image-rendering:pixelated;border:2px solid #ffcd75';
    document.body.appendChild(sheet);
    const g = sheet.getContext('2d');
    g.imageSmoothingEnabled = false;
    sp.stages.forEach((st, n) => g.drawImage(buildSprite(st.grid, null, 'normal'), n * 18 * scale, 0, 18 * scale, 18 * scale));
    return {
      i,
      type: sp.type,
      npc: !!sp.npcOnly,
      starter: !!sp.starter,
      habitat: sp.habitat,
      tiles: sp.tiles,
      blurb: sp.blurb,
      names: sp.stages.map(s => s.name),
      kit: sp.kit,
      base: Object.fromEntries(['fetch/0', 'fetch/1', 'fetch/2'].map(id => [id, BASE_STATS[id]])),
      learn: Object.fromEntries(['fetch/0', 'fetch/1', 'fetch/2'].map(id => [id, (LEARNSETS[id] || []).map(row => row.slice())])),
      dash: MOVES.fetch_dash,
      paw: MOVES.steadfast_paw,
      evoOwners,
      buddyMoves: ['fetch_dash', 'briar_volley', 'thorn_lash', 'sap_sip'].map(id => !!(MOVES[id] && !MOVES[id].fallback)),
      at18: PixelPets.defaultMoves('fetch/1', 18),
      odds,
      tables,
      starters: SPECIES.filter(s => s.starter).map(s => s.id),
      art,
      forms: PPSave.FORM_IDS.length,
      lastId: PPSave.SPECIES_IDS[PPSave.SPECIES_IDS.length - 1],
      v: PixelPets.state.v,
      species: PixelPets.state.party[0].species,
    };
  });
  expect(info.i).toBe(15);
  expect(info.type).toBe('BLOOM');
  expect(info.npc).toBe(true);
  expect(info.starter).toBe(false);
  expect(info.habitat).toEqual({});
  expect(info.tiles).toBe('grass');
  expect(info.blurb).toBe('A sunny field pup. Fetches seeds and plants them.');
  expect(info.names).toEqual(['Fetchling', 'Harvestail', 'Hearthound']);
  expect(info.base).toEqual(BASE);
  expect(info.learn).toEqual(LEARN);
  expect(info.dash).toEqual({ name: 'Fetch Dash', type: 'BLOOM', power: 60, acc: 95, uses: 10 });
  expect(info.paw).toEqual({ name: 'Steadfast Paw', type: 'BLOOM', power: 70, acc: 95, uses: 5, effect: { target: 'self', stat: 'def', stages: 1 } });
  expect(info.evoOwners.fetch_dash).toEqual(['fetch/1']);
  expect(info.evoOwners.steadfast_paw).toEqual(['fetch/2']);
  expect(info.kit).toEqual({ form: 'fetch/1', level: 18, moves: ['fetch_dash', 'briar_volley', 'thorn_lash', 'sap_sip'], nick: 'Buddy' });
  expect(info.buddyMoves).toEqual([true, true, true, true]);
  expect(info.at18).toContain('fetch_dash');
  expect(info.odds.every(v => v === 0)).toBe(true);
  expect(info.tables).toEqual([]);
  expect(info.starters).toEqual(['ember', 'tide', 'bloom']);
  expect(info.forms).toBe(60);
  expect(info.lastId).toBe('snail');
  expect(info.v).toBe(2);
  expect(info.species).toBe('ember');
  for (const stage of info.art) {
    expect(stage.rows).toBe(16);
    expect(stage.wide).toBe(true);
    expect(stage.colors).toContain('#ffcd75');
    expect(stage.colors).toContain('#ef7d57');
    expect(stage.colors).toContain('#f4f4f4');
    expect(stage.left).not.toBe(stage.right);
  }
  expect(info.art[0].sample).toBe('#ef7d57');
  expect(info.art[1].colors).toContain('#b13e53');
  expect(info.art[2].colors).toContain('#38b764');

  await page.evaluate(() => PixelPets.showTab('col'));
  await page.waitForSelector('#dexGrid .cell');
  const grid = await page.evaluate(() => ({
    n: document.querySelectorAll('#dexGrid .cell').length,
    header: document.querySelector('#dexCount').textContent,
    fetch: document.querySelectorAll('[data-form^="fetch/"]').length,
  }));
  expect(grid.n).toBe(57);
  expect(grid.header).toContain('Out there 57');
  expect(grid.fetch).toBe(0);
  await shot(page, 'fetch-line');
  await page.evaluate(() => PixelPets.openStats(PixelPets.state.partnerId));
  await expect(page.locator('#ovStats')).toBeVisible();
  await expect(page.locator('#scStatsHead')).toContainText('best of 57 forms');
});

function fetchSave() {
  const save = starterSave();
  save.party = [{
    id: 'petfetch1',
    species: 'fetch',
    stage: 0,
    xp: 39,
    bx: 400,
    hunger: 80,
    happy: 80,
    energy: 90,
    nick: null,
    origin: 'wild',
    moves: ['bump', 'sap_sip'],
    evoMoves: [],
  }];
  save.partnerId = 'petfetch1';
  save.dex.seen['fetch/0'] = true;
  save.dex.caught['fetch/0'] = true;
  return save;
}

test('a Fetchling grows up into Harvestail and Hearthound @w1', async ({ page }) => {
  test.setTimeout(60000);
  await installSave(page.context(), fetchSave(), { quietDay: true });
  await gotoDebug(page);
  await page.evaluate(() => PixelPets.showTab('pet'));   // BOOT_TO_MAP: the game boots on WALK; GROW UP is on the PARTNER screen
  await expect(page.locator('#hdrName')).toHaveText('Fetchling');
  await expect(page.locator('#evolveBtn')).toBeHidden();
  await expect(page.locator('#evoHint')).toHaveText('Next form at Lv 12. Now Lv 11.');
  await page.evaluate(() => PixelPets.setLevel(12));
  await expect(page.locator('#evolveBtn')).toBeVisible();
  await expect(page.locator('#evoHint')).toContainText('ready to grow up');
  await page.locator('#evolveBtn').click();
  await expect(page.locator('#evoMsg')).toContainText('Harvestail', { timeout: 8000 });
  await expect(page.locator('#evoOk')).toBeVisible();
  await page.locator('#evoOk').click();
  await expect(page.locator('#evoMsg')).toContainText('Fetch Dash');
  await page.locator('#evoOk').click();
  await expect(page.locator('#ovEvolve')).toBeHidden();
  const mid = await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    return { stage: p.stage, name: document.querySelector('#hdrName').textContent, moves: p.moves.slice(), xp: p.xp, v: PixelPets.state.v };
  });
  expect(mid.stage).toBe(1);
  expect(mid.name).toBe('Harvestail');
  expect(mid.moves).toContain('fetch_dash');
  expect(mid.xp).toBe(40);
  expect(mid.v).toBe(2);
  await expect(page.locator('#evoHint')).toHaveText('Next form at Lv 24. Now Lv 12.');
  await page.evaluate(() => {
    PixelPets.setFlag('story.seal1', true);
    PixelPets.setFlag('story.seal2', true);
    PixelPets.setLevel(24);
  });
  await expect(page.locator('#evolveBtn')).toBeVisible();
  await page.locator('#evolveBtn').click();
  await expect(page.locator('#evoMsg')).toContainText('Hearthound', { timeout: 8000 });
  await page.locator('#evoOk').click();
  await expect(page.locator('#ovSheet')).toBeVisible();
  await page.locator('#shList button:not(.skip)').first().click();
  await expect(page.locator('#evoMsg')).toContainText('Steadfast Paw');
  await page.locator('#evoOk').click();
  await expect(page.locator('#ovEvolve')).toBeHidden();
  const done = await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    return {
      stage: p.stage,
      name: document.querySelector('#hdrName').textContent,
      moves: p.moves.slice(),
      hint: document.querySelector('#evoHint').textContent,
      v: PixelPets.state.v,
      journal: document.querySelector('#dexCount') ? document.querySelector('#dexCount').textContent : '',
    };
  });
  expect(done.stage).toBe(2);
  expect(done.name).toBe('Hearthound');
  expect(done.moves).toEqual(expect.arrayContaining(['fetch_dash', 'steadfast_paw']));
  expect(done.hint).toContain('Fully grown');
  expect(done.v).toBe(2);
  await page.evaluate(() => PixelPets.showTab('col'));
  await page.waitForSelector('#dexCount');
  const journal = await page.evaluate(() => ({
    n: document.querySelectorAll('#dexGrid .cell').length,
    header: document.querySelector('#dexCount').textContent,
    fetch: document.querySelectorAll('[data-form^="fetch/"]').length,
  }));
  expect(journal.n).toBe(57);
  expect(journal.header).toContain('Out there 57');
  expect(journal.fetch).toBe(0);
});
