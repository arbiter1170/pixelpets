/* NEW SPECIES, Act 2 (design repo, private: ROUTE_TO_GOVERNOR v0.1.1 §7, D1855-D1858, D1862, D1871; KILNMOUTH v0.1.1 §4.4):
   four new lines appended to SPECIES in landing order: S8 wall adder `adder` (VOLT), S10 reed-heron `heron` (TIDE), S1
   stream-walker `dipper` (TIDE), S4 jug wasp `jugwasp` (STONE). Shown names are the PLACEHOLDER stage names only; the seed codes (S8...) stay in comments and ids. S11 and S12 stay parked (not built).
   N1-N8 of ROUTE_TO_GOVERNOR §10.3. Runs at 320, 375 and 390 (@w1 rows at 320 only); Modern controls; reduced motion where it
   matters; zero console errors; the save stays pixelpets.save.v2, v 2. */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
// The SPECIES order on main when this branch was cut (indices are save-relevant: v2 keeps a position table).
const MAIN_IDS = ['ember', 'tide', 'bloom', 'stone', 'volt', 'frost', 'gust', 'shade', 'beetle', 'mole', 'crab', 'moth', 'vane',
  'dormouse', 'byte', 'fetch', 'skink', 'otter', 'owl', 'snail', 'tallybat', 'dimlamp', 'filecrow', 'cordhound', 'humwisp'];
const NEW = { adder: { type: 'VOLT', sig: 'zigzag_strike', names: ['Adderlet', 'Walladder', 'Zigzag'], full: false },
  heron: { type: 'TIDE', sig: 'reed_still', names: ['Reedling', 'Stalker', 'Boomer'], full: true },
  dipper: { type: 'TIDE', sig: 'dip_bob', names: ['Chick', 'Walker', 'Diver'], full: false },
  jugwasp: { type: 'STONE', sig: 'jug_toss', names: ['Bearer', 'Potter', 'Cluster'], full: false } };
const IDS = Object.keys(NEW);
const ACT1_MAPS = ['proto', 'route1', 'fernbrook', 'route2', 'route2_glen', 'hw_cut', 'hw_rim', 'hw_falls', 'cobble_quarry', 'route3'];

function save(mut) {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.textSpeed = 'fast';
  s.settings.follower = false;
  if (mut) mut(s);
  return s;
}
async function boot(page, s, opts = {}) {
  if (opts.reduce) await page.emulateMedia({ reducedMotion: 'reduce' });
  // game.js keeps SP_INDEX to itself; the page reads SPECIES (sprites.js) by position.
  await page.addInitScript(() => { window.SPX = id => SPECIES.findIndex(s => s.id === id); });
  await installSave(page.context(), s || save(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && PixelPets.state && PixelPets.state.party[0]);
  await page.evaluate(() => { PixelPets.showTab('walk'); if (PixelPets.clearWild) PixelPets.clearWild(); });
}

test('N1 @w1: every index on main is kept; the four lines are appended with three stages and totals 192 / 256 / 320', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate((ids) => ({
    ids: SPECIES.map(s => s.id), save: PPSave.SPECIES_IDS.slice(), v: PixelPets.state.v,
    lines: ids.map(id => { const sp = SPECIES[SPX(id)]; return { id, type: sp.type, names: sp.stages.map(s => s.name), tableOnly: !!sp.tableOnly,
      totals: [0, 1, 2].map(k => { const b = BASE_STATS[id + '/' + k]; return b.hp + b.atk + b.def + b.spd; }) }; }),
    parked: ['glider', 'tidier'].map(id => SPX(id) < 0 && !BASE_STATS[id + '/0']),
  }), IDS);
  expect(r.v).toBe(2);
  expect(r.ids.slice(0, 25)).toEqual(MAIN_IDS);
  expect(r.ids.slice(25)).toEqual(IDS);
  expect(r.save).toEqual(r.ids);
  expect(r.parked).toEqual([true, true]);   // S11 and S12 stay parked (D1856)
  // Shown names never carry a design seed code ("S8 "): every stage name of every line, as the battle, party, journal and
  // befriend text read it.
  expect(await page.evaluate(() => SPECIES.flatMap(sp => sp.stages.map(st => st.name)).filter(n => /^S\d+ /.test(n)))).toEqual([]);
  for (const l of r.lines) {
    expect(l.type, l.id).toBe(NEW[l.id].type);
    expect(l.names, l.id).toEqual(NEW[l.id].names);
    expect(l.totals, l.id).toEqual([192, 256, 320]);
    expect(l.tableOnly, l.id).toBe(true);
  }
});

test('N1 @w1: species and move ids collide with nothing (one definition each in the source)', async () => {
  const sp = read('sprites.js'), mv = read('moves.js'), st = read('stats.js'), fx = read('mv_fx.js');
  for (const id of IDS) {
    expect((sp.match(new RegExp("\\bid:'" + id + "'", 'g')) || []).length, id).toBe(1);
    for (let k = 0; k < 3; k++) {
      expect((st.match(new RegExp("'" + id + '/' + k + "':", 'g')) || []).length, id + '/' + k).toBe(1);
      expect((mv.match(new RegExp('"' + id + '/' + k + '":', 'g')) || []).length, id + '/' + k).toBe(1);
    }
    const sig = NEW[id].sig;
    expect((mv.match(new RegExp('"' + sig + '": \\{', 'g')) || []).length, sig).toBe(1);
    expect((mv.match(new RegExp('"' + id + '": "' + sig + '"', 'g')) || []).length, sig).toBe(1);
    expect((fx.match(new RegExp('^"' + sig + '": ', 'gm')) || []).length, sig).toBe(1);
  }
});

test('N2: the stages draw 16x16 in PAL with an outline; the half grids blink, the heron profiles do not; no console error', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate((ids) => {
    const pal = new Set(Object.values(PAL).map(h => h.toLowerCase()));
    const hex = (d, i) => '#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('');
    return ids.map(id => [0, 1, 2].map(k => {
      const st0 = SPECIES[SPX(id)].stages[k], src0 = st0.grid || st0.half, col0 = st0.grid ? null : st0.col;
      const set = { n: buildSprite(src0, col0, 'normal'), b: buildSprite(src0, col0, 'blink') }, c = document.createElement('canvas'); c.width = 18; c.height = 18;
      const g = c.getContext('2d'); g.drawImage(set.n, 0, 0);
      const d = g.getImageData(0, 0, 18, 18).data;
      let n = 0, offPal = 0, outline = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i + 3]) { n++; if (!pal.has(hex(d, i))) offPal++; if (hex(d, i) === PAL.k) outline++; }
      const b = document.createElement('canvas'); b.width = 18; b.height = 18; const gb = b.getContext('2d'); gb.drawImage(set.b, 0, 0);
      const blink = gb.getImageData(0, 0, 18, 18).data.join(',') !== d.join(',');
      const st = SPECIES[SPX(id)].stages[k], src = st.grid || st.half;
      return { w: set.n.width, h: set.n.height, n, offPal, outline, blink, rows: src.length, cols: src[0].length, full: !!st.grid };
    }));
  }, IDS);
  IDS.forEach((id, i) => r[i].forEach((s, k) => {
    expect(s.w, id + k).toBe(18); expect(s.h, id + k).toBe(18);
    expect(s.rows, id + k).toBe(16); expect(s.cols, id + k).toBe(NEW[id].full ? 16 : 8);
    expect(s.full, id + k).toBe(NEW[id].full);
    expect(s.n, id + k).toBeGreaterThan(40);
    expect(s.offPal, id + k).toBe(0);
    expect(s.outline, id + k).toBeGreaterThan(10);
    expect(s.blink, id + k).toBe(!NEW[id].full);
  }));
  // The journal lists them (as unknown until met) in the grid.
  await page.evaluate(() => PixelPets.showTab('col'));
  await page.waitForSelector('#dexGrid .cell');
  const grid = await page.evaluate(() => ({ n: document.querySelectorAll('#dexGrid .cell').length, head: document.querySelector('#dexCount').textContent }));
  expect(grid.n).toBe(69);
  expect(grid.head).toContain('Out there 69');
});

test('N3 @w1: defaultMoves at Lv 1, 22 and 29 put the signature first; the effects are one stage', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate((ids) => {
    const out = {};
    for (const id of ids) for (const k of [0, 1, 2]) for (const L of [1, 22, 29]) out[id + '/' + k + '@' + L] = defaultMoves(id + '/' + k, L);
    return { dm: out, sig: Object.fromEntries(ids.map(id => [id, SIGNATURES[id]])),
      fx: ['zigzag_strike', 'reed_still', 'dip_bob', 'jug_toss'].map(m => [MOVES[m].power, MOVES[m].effect, !!MV_MOVE[m], LEARNSETS[{ zigzag_strike: 'adder', reed_still: 'heron', dip_bob: 'dipper', jug_toss: 'jugwasp' }[m] + '/0'][0]]) };
  }, IDS);
  for (const id of IDS) {
    expect(r.sig[id]).toBe(NEW[id].sig);
    for (const [k, v] of Object.entries(r.dm)) if (k.startsWith(id + '/')) { expect(v[0], k).toBe(NEW[id].sig); expect(v.length, k).toBeGreaterThanOrEqual(3); }
  }
  expect(r.dm['heron/1@29']).toEqual(['reed_still', 'pinwheel_peck', 'gale_slice', 'puddle_stomp']);   // the Reed Watcher's heron (§5.5)
  expect(r.fx[0]).toEqual([30, { target: 'foe', stat: 'spd', stages: -1 }, true, [1, 'zigzag_strike']]);
  expect(r.fx[1]).toEqual([30, { target: 'self', stat: 'def', stages: 1 }, true, [1, 'reed_still']]);
  expect(r.fx[2]).toEqual([30, { target: 'self', stat: 'spd', stages: 1 }, true, [1, 'dip_bob']]);
  expect(r.fx[3]).toEqual([35, { target: 'foe', stat: 'def', stages: -1 }, true, [1, 'jug_toss']]);
});

for (const [line, mid, who, stat, want] of [['adder', 'zigzag_strike', 'foe', 'spd', -1], ['heron', 'reed_still', 'me', 'def', 1]]) {
  test(`N3: ${mid} in battle moves ${who} ${stat} by ${want} stage`, async ({ page }) => {
    test.skip(page.viewportSize().width !== 390, '390 only');
    await boot(page, save(s => { s.party[0].species = line; s.party[0].stage = 0; s.party[0].bx = 4 * 9 * 9; }));
    await page.evaluate((mid) => { PixelPets.healTeam(); PixelPets.setMoves([mid]); return PixelPets.forceBattle('beetle/0', 2); }, mid);
    await page.waitForFunction(() => PixelPets.battle.on && PixelPets.battle.state === 'CHOOSE', null, { timeout: 20000 });
    await page.evaluate(() => { const b = PixelPets.battle; b.animMs = 0; b.textMs = 0; b.rng = () => 0.2; const f = b.foes && b.foes[0]; if (f) { f.hp = 400; f.maxHp = 400; } b.foePlan = { move: 'wobble' }; });
    await page.locator('[data-bact="fight"]').click();
    await page.locator(`#btMoves button[data-move="${mid}"]`).click();
    await page.waitForFunction(() => PixelPets.battle.state === 'CHOOSE' || !PixelPets.battle.on, null, { timeout: 20000 });
    const got = await page.evaluate(([who, stat]) => { const b = PixelPets.battle, side = who === 'me' ? b.me : b.foes[0]; return (side.stages || {})[stat] || 0; }, [who, stat]);
    expect(got).toBe(want);
    await page.evaluate(() => PixelPets.battle.close());
  });
}

test('N4 @w1: wild only on their own tables, never on an Act 1 table or in the any-species roll; third forms never wild', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(([ids, maps]) => {
    const idx = ids.map(id => SPX(id)), tags = [['meadow'], ['water', 'rain'], ['storm'], ['night', 'fog'], ['hot', 'mountain'], ['cold']];
    const act1 = maps.map(m => tags.map(t => idx.map(i => PixelPets.spawnOdds(t, m)[i])));
    const table = k => Object.fromEntries(ids.map((id, n) => [id, PixelPets.spawnOdds(['meadow'], k)[idx[n]]]));
    // 'proto' (Old Meadow) has no table: its odds are the habitat pick plus the 8% any-species roll.
    const anyRoll = tags.map(t => idx.map(i => PixelPets.spawnOdds(t, 'proto')[i]));
    return { act1, anyRoll,
      r4: table('route4'), reeds: table('route4_reeds'), withy: table('route4_withy'),
      idle: [SPECIES[SPX('heron')].idleMul, SPECIES[SPX('adder')].spawnNear] };
  }, [IDS, ACT1_MAPS]);
  for (const m of r.act1) for (const row of m) expect(row).toEqual([0, 0, 0, 0]);
  for (const row of r.anyRoll) expect(row).toEqual([0, 0, 0, 0]);
  expect(r.r4.adder).toBeGreaterThan(0.15); expect(r.r4.heron).toBe(0);
  expect(r.reeds.heron).toBeGreaterThan(0.15); expect(r.reeds.adder).toBeGreaterThan(0);
  expect(r.withy.heron).toBeGreaterThan(0.15); expect(r.withy.adder).toBe(0);
  for (const k of ['r4', 'reeds', 'withy']) { expect(r[k].dipper).toBe(0); expect(r[k].jugwasp).toBe(0); }
  expect(r.idle).toEqual([3, 'h']);
  const stages = await page.evaluate(() => { const out = new Set(); for (let i = 0; i < 400; i++) out.add(PixelPets.pickStage('route4_withy')); return [...out].sort(); });
  expect(stages).toEqual([0, 1]);
});

test('N4: on the river road the heron spawns beside water, and the adder on the downs beside a wall', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  await boot(page, save(s => { s.flags['story.gov_posted'] = true; }));
  const near = async (map, x, y, id, ch) => {
    await page.evaluate(([m, x, y]) => PixelPets.goto(m, x, y, 'down'), [map, x, y]);
    await page.waitForFunction(m => PixelPets.mapInfo.id === m && !PixelPets.fading, map);
    return page.evaluate(([id, ch, map]) => {
      const grid = Object.values(MAPDATA).map(d => d && d.maps && d.maps[map]).find(Boolean).grid;
      PixelPets.clearWild(); const out = [];
      for (let i = 0; i < 12; i++) { const w = PixelPets.spawnWild(SPX(id), 0); if (w) out.push([1, 0, -1, 0].some((dx, k) => { const dy = [0, 1, 0, -1][k]; return (grid[w.y + dy] || '')[w.x + dx] === ch; })); PixelPets.clearWild(); }
      return out;
    }, [id, ch, map]);
  };
  const heron = await near('route4_reeds', 16, 9, 'heron', 'w');
  expect(heron.length).toBeGreaterThan(5);
  expect(heron.every(Boolean)).toBe(true);
  const adder = await near('route4', 6, 22, 'adder', 'h');
  expect(adder.length).toBeGreaterThan(5);
  expect(adder.every(Boolean)).toBe(true);
});

test('N5 @w1: grow up at the shared gates (Lv 12, then Lv 24 with 2 Seals); the cap rows are 38, 41, 44', async ({ page }) => {
  await boot(page, save(s => { Object.assign(s.party[0], { species: 'heron', stage: 0, bx: 4 * 12 * 12, hunger: 100, happy: 100, energy: 100, xp: 200 }); }));
  const r = await page.evaluate(() => ({ gates: GROW_GATES.map(g => [g.level, g.seals]), caps: [3, 4, 5, 9].map(capLevelFor), evo: EVO_XP.slice() }));
  expect(r.gates).toEqual([[12, 0], [24, 2]]);
  expect(r.evo).toEqual([40, 120]);
  expect(r.caps).toEqual([38, 41, 44, 44]);
  await page.evaluate(() => PixelPets.forceEvolve());
  await page.waitForFunction(() => PixelPets.state.party[0].stage === 1, null, { timeout: 20000 });
  expect(await page.evaluate(() => [PixelPets.state.party[0].species, PixelPets.state.v])).toEqual(['heron', 2]);
});

test('N6: an old v2 save with 25 lines loads unchanged; a save holding a new line keeps it', async ({ page }) => {
  const s = save(s => {
    s.box = [{ id: 'petold2', species: 'humwisp', stage: 0, xp: 0, hunger: 80, happy: 60, energy: 90, nick: null, origin: 'wild' },
      { id: 'petnew1', species: 'adder', stage: 1, xp: 0, hunger: 80, happy: 60, energy: 90, nick: 'Zig', origin: 'wild' }];
    s.dex.seen['adder/1'] = true;
  });
  await boot(page, s);
  const r = await page.evaluate(() => ({ v: PixelPets.state.v, box: PixelPets.state.box.map(p => p.species + '/' + p.stage + ':' + p.id), orphans: PixelPets.state.orphans.length,
    stored: JSON.parse(localStorage.getItem('pixelpets.save.v2')).v, partner: PixelPets.state.party[0].species }));
  expect(r).toEqual({ v: 2, box: ['humwisp/0:petold2', 'adder/1:petnew1'], orphans: 0, stored: 2, partner: 'ember' });
  // No data names a new line before its species slice: the only tables naming S1 and S4 are their own road's (KILNMOUTH, once it lands).
  const md = read('data/mapdata.js'), km = /"km_road":\{/.test(md) ? read('data/detail_zzzzz_kilnmouth.json') : '';
  const n = (t, id) => (t.match(new RegExp('"' + id + '(/\\d)?"', 'g')) || []).length;
  for (const id of ['dipper', 'jugwasp']) expect(n(md, id), id).toBe(n(km, id));
});

test('N8: reduced motion: no new sprite animation, and a battle with a new line fits at the width', async ({ page }) => {
  await boot(page, save(), { reduce: true });
  await page.evaluate(() => { PixelPets.healTeam(); return PixelPets.forceBattle('heron/2', 30); });
  await page.waitForFunction(() => PixelPets.battle.on && PixelPets.battle.state === 'CHOOSE', null, { timeout: 20000 });
  const r = await page.evaluate(() => {
    const vw = innerWidth, over = [...document.querySelectorAll('#ovBattle *')].filter(e => { const b = e.getBoundingClientRect(); return b.width && (b.right > vw + 1 || b.left < -1); }).map(e => e.id || e.className);
    return { over, name: (document.querySelector('#ovBattle').textContent || '').includes('Boomer'), shown: (document.querySelector('#btFoeName') || {}).textContent || '', anim: !!SPECIES[SPX('heron')].anim };
  });
  expect(r.over).toEqual([]);
  expect(r.name).toBe(true);
  expect(r.shown).not.toMatch(/^S\d+ /);   // no design seed code in a shown name
  expect(r.anim).toBe(false);
  await page.evaluate(() => PixelPets.battle.close());
});
