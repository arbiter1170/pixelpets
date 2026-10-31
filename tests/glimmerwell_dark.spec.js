/* GLIMMERWELL_PALETTE v0.4 option (b). Wine V, soot N, crimson Q.
   The devCheck fails above 10% Q or a soot band under 6 px (horizontal runs of 2 or more).
   Pia's outlined figures stay at or under 3.5% Q (Associate, 6 px) and 1.5% on Rook's card (3 px).
   Widths are the Playwright projects (320, 375, 390). Save stays pixelpets.save.v2 with v 2 and gains no field. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const WINE = 'rgb(150, 14, 22)';
const ICE = 'rgb(115, 239, 247)';

async function boot(page, save, search) {
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page, search || '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true && window.BUILD);
}

test('locked looks stay under the crimson cap and the soot band, and the save is unchanged', async ({ page }) => {
  const save = starterSave();
  save.settings.follower = false;
  const beforeKeys = Object.keys(save).sort();
  await boot(page, save);
  const report = await page.evaluate(() => {
    const pal = PixelPets.glimmerPalette();
    const look = PixelPets.keeper.look;
    const frames = PixelPets.artTally('comfort_lamp');
    const board = PixelPets.artTally('bulletin_glimmer')[0];
    const flyer = PixelPets.artTally('flyer_glimmer')[0];
    const desk = PixelPets.artTally('switch_desk_glimmer')[0];
    const ring = PixelPets.artTally('relay_ring');
    const raw = JSON.parse(localStorage.getItem('pixelpets.save.v2'));
    return {
      problems: PixelPets.devChecks().palette,
      pal,
      look: { outfitCol: look.outfitCol, accent: look.accent, accessory: look.accessory, hem: look.hem || null },
      frames, board, flyer, desk, ring,
      v: raw.v,
      keys: Object.keys(raw).sort(),
      savedLook: raw.player.look,
      holderSet: PixelPets.spriteLook('holder_glimmer_set'),
    };
  });
  expect(report.problems).toEqual([]);
  expect(report.pal.problems).toEqual([]);
  const qCap = { associate: 6, 'rook-lanyard': 3, holder_glimmer_set: 3 };
  for (const name of [...new Set(report.pal.frames.map(fr => fr.name))]) {
    const rows = report.pal.frames.filter(fr => fr.name === name);
    const min = Math.min(...rows.map(fr => fr.band));
    const maxQ = Math.max(...rows.map(fr => fr.q));
    expect(min, name + ' soot band').toBeGreaterThanOrEqual(6);
    expect(maxQ, name + ' Q px').toBeLessThanOrEqual(qCap[name] || 0);
  }
  expect(report.look).toEqual({ outfitCol: 't', accent: 'r', accessory: 'none', hem: null });
  expect(report.pal.defaults).toEqual({ outfitCol: 't', accent: 'r', accessory: 'none' });
  expect(report.pal.outfitCol).not.toContain('V');
  expect(report.pal.accent).not.toContain('Q');
  expect(report.pal.accent).not.toContain('N');
  expect(report.pal.holderOutfit).toBe('c');
  expect(report.holderSet).toEqual({ skin: '3', hair: 'short', hairCol: 'p', outfit: 'coat', outfitCol: 'V', accent: 'N', accessory: 'lanyard' });
  expect(report.savedLook).toEqual(save.player.look);
  expect(report.v).toBe(2);
  expect(report.keys).toEqual(beforeKeys);
  for (const frame of report.frames) {
    expect(frame['#c81818']).toBe(4);
    expect(frame['#a7f070']).toBeGreaterThan(0);
    expect(frame['#f4f4f4']).toBeGreaterThan(0);
    expect(frame['#ffcd75']).toBeGreaterThan(0);
  }
  expect(report.board['#960e16']).toBeGreaterThan(0);
  expect(report.board['#c81818'] || 0).toBe(0);
  expect(report.board['#ffcd75']).toBeGreaterThan(0);
  expect(report.flyer['#c81818'] || 0).toBe(0);
  expect(report.flyer['#960e16']).toBeGreaterThan(0);
  expect(report.desk['#c81818'] || 0).toBe(0);
  expect(report.desk['#960e16']).toBeGreaterThan(0);
  expect(report.desk['#18140f']).toBeGreaterThan(0);
  for (const frame of report.ring) {
    expect(frame['#c81818']).toBeGreaterThan(0);
    expect(frame['#ffcd75']).toBeGreaterThan(0);
  }
});

test('phase 2 props, the depot room and the lanyard icons use wine and soot', async ({ page }) => {
  const save = starterSave();
  save.settings.follower = false;
  await boot(page, save);
  const got = await page.evaluate(() => {
    const one = (name) => PixelPets.artTally(name)[0];
    const count = (rows, ch) => rows.reduce((n, row) => n + [...row].filter((c) => c === ch).length, 0);
    const tier = (id) => {
      const rows = PixelPets.sealArt(id);
      return { l: count(rows, 'l'), s: count(rows, 's'), V: count(rows, 'V'), N: count(rows, 'N'), w: count(rows, 'w'), y: count(rows, 'y'), o: count(rows, 'o'), len: rows.length, width: rows.every((r) => r.length === 16) };
    };
    return {
      screen: one('capital_screen'),
      loan: one('loan_crate'),
      cell: PixelPets.artTally('cell_crate'),
      open: one('cell_crate_open'),
      depot: one('depot_crate'),
      bunting: one('stage_bunting'),
      stand: one('glimmer_stand'),
      gate: one('glimmer_gate'),
      tent: one('census_tent'),
      crate: one('rc_crate'),
      mat: one('mat_depot'),
      line: one('depot_line'),
      wall: one('wall_depot'),
      face: one('wall_depot_face'),
      win: one('wall_depot_win'),
      kit: one('bw_depot__face_win'),
      lamps: one('miner_lamps'),
      t1: tier('seal_glim_1'),
      t2: tier('seal_glim_2'),
      t3: tier('seal_glim_3'),
    };
  });
  const wine = '#960e16', soot = '#18140f', crimson = '#c81818', mint = '#a7f070', ice = '#73eff7', white = '#f4f4f4';
  const noOld = (frame, name) => {
    expect(frame[mint] || 0, name + ' mint').toBe(0);
    expect(frame[ice] || 0, name + ' ice').toBe(0);
  };
  expect(got.screen[wine]).toBeGreaterThan(0);
  expect(got.screen[white]).toBeGreaterThan(0);
  expect(got.screen[crimson] || 0).toBe(0);
  noOld(got.screen, 'screen');
  expect(got.loan[wine]).toBeGreaterThan(0);
  noOld(got.loan, 'loan');
  for (const frame of got.cell) {
    expect(frame[crimson]).toBe(3);
    expect(frame[wine]).toBeGreaterThan(0);
    noOld(frame, 'cell');
  }
  expect(got.open[wine]).toBeGreaterThan(0);
  expect(got.open[crimson] || 0).toBe(0);
  noOld(got.open, 'open');
  expect(got.depot[wine]).toBe(4);
  expect(got.depot[soot]).toBe(1);
  expect(got.depot['#38b764'] || 0).toBe(0);
  noOld(got.depot, 'depot');
  expect(got.bunting[wine]).toBeGreaterThan(0);
  expect(got.bunting[white]).toBeGreaterThan(0);
  noOld(got.bunting, 'bunting');
  for (const [name, frame] of [['stand', got.stand], ['gate', got.gate], ['tent', got.tent], ['crate', got.crate]]) {
    expect(frame[wine], name).toBeGreaterThan(0);
    noOld(frame, name);
  }
  expect(got.stand[soot]).toBeGreaterThan(0);
  for (const [name, frame] of [['mat', got.mat], ['line', got.line], ['wall', got.wall], ['face', got.face], ['kit', got.kit]]) {
    expect(frame[wine], name).toBeGreaterThan(0);
    noOld(frame, name);
  }
  expect(got.wall[soot]).toBeGreaterThan(0);
  expect(got.face[soot]).toBeGreaterThan(0);
  expect(got.kit[soot]).toBeGreaterThan(0);
  expect(got.win[wine]).toBeGreaterThan(0);
  expect(got.win[soot]).toBeGreaterThan(0);
  expect(got.win[ice]).toBe(4);
  expect(got.win[mint] || 0).toBe(0);
  expect(got.lamps[wine] || 0).toBe(0);
  expect(got.lamps[soot] || 0).toBe(0);
  for (const tier of [got.t1, got.t2, got.t3]) {
    expect(tier.len).toBe(16);
    expect(tier.width).toBe(true);
    expect(tier.l).toBe(0);
    expect(tier.s).toBe(0);
    expect(tier.o).toBeGreaterThan(0);
    expect(tier.y).toBeGreaterThan(0);
  }
  expect(got.t1.V).toBeGreaterThan(0);
  expect(got.t1.N).toBeGreaterThan(0);
  expect(got.t2.w).toBeGreaterThan(got.t1.w);
  expect(got.t3.w).toBeGreaterThan(got.t1.w);
});

test('the legend is two sentences, each on its own line, and the hold label stays ice', async ({ page }) => {
  const save = starterSave();
  save.flags['story.side_pick_done'] = true;
  save.settings.follower = false;
  await boot(page, save, '');
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForFunction(() => !document.querySelector('#mapBtn').classList.contains('off'));
  await page.locator('#mapBtn').click();
  await page.waitForSelector('#ovMap:not([hidden])');
  await page.locator('#mapLevelRegion').click();
  const note = await page.evaluate(() => {
    const el = document.querySelector('.map-key-note');
    const lines = [];
    for (const n of el.childNodes) {
      if (n.nodeType !== 3) continue;
      const text = n.textContent.trim();
      if (!text) continue;
      const r = document.createRange();
      r.selectNodeContents(n);
      lines.push({ text, w: r.getBoundingClientRect().width });
    }
    const probe = document.createElement('p');
    probe.className = 'map-hold hold-glimmer';
    probe.textContent = 'Glimmerwell';
    document.body.appendChild(probe);
    const hold = getComputedStyle(probe).color;
    const sw = getComputedStyle(document.querySelector('.sw-glimmer'));
    probe.remove();
    return { lines, box: el.clientWidth, h: el.getBoundingClientRect().height, hold, sw: sw.backgroundColor, ring: sw.boxShadow };
  });
  expect(note.lines.map(l => l.text)).toEqual(['Gold and green: Keeper roofs.', 'Red and black: Glimmerwell ground.']);
  for (const line of note.lines) expect(line.w).toBeLessThanOrEqual(note.box);
  expect(note.h).toBeLessThanOrEqual(40);
  expect(note.hold).toBe(ICE);
  expect(note.sw).toBe(WINE);
  expect(note.ring).toContain('26, 28, 44');
});

test('a lanyard accent clamps on screen only and standing tint still wins', async ({ page }) => {
  const save = starterSave();
  save.settings.follower = false;
  save.player.look = { skin: '3', hair: 'short', hairCol: 'p', outfit: 'coat', outfitCol: 't', accent: 'r', accessory: 'lanyard' };
  save.flags['story.side'] = 'glimmer';
  save.flags['story.side_pick_done'] = true;
  save.standing = { keepers: 0, glimmer: 0 };
  const before = JSON.parse(JSON.stringify(save));
  await boot(page, save);
  const got = await page.evaluate(() => {
    const tier0 = PixelPets.keeper.look.accent;
    PixelPets.state.standing.glimmer = 10;
    const tier1 = PixelPets.keeper.look.accent;
    const raw = JSON.parse(localStorage.getItem('pixelpets.save.v2'));
    return { tier0, tier1, saved: raw.player.look, keys: Object.keys(raw).sort(), v: raw.v };
  });
  expect(got.tier0).toBe('N');
  expect(got.tier1).toBe('c');
  expect(got.saved.accent).toBe('r');
  expect(got.saved.accessory).toBe('lanyard');
  expect(got.saved.outfitCol).toBe('t');
  expect(got.v).toBe(2);
  expect(got.keys.sort()).toEqual(Object.keys(before).sort());
});

test('reduced motion still passes the palette check', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const save = starterSave();
  save.settings.follower = false;
  await boot(page, save);
  const got = await page.evaluate(() => ({
    reduce: matchMedia('(prefers-reduced-motion: reduce)').matches,
    palette: PixelPets.devChecks().palette,
  }));
  expect(got.reduce).toBe(true);
  expect(got.palette).toEqual([]);
});
