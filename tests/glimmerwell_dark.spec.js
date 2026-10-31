/* GLIMMERWELL_PALETTE v0.4 option (b). Steps 2-4 follow v0.4.2 (design 6f3eeff).
   Step 6 and the bay gate follow v0.4.4 (design 130b176). Wine V, soot N, crimson Q.
   The devCheck fails above 10% Q or a soot band under 6 px (horizontal runs of 2 or more).
   Pia's outlined figures stay at or under 3.5% Q (Associate, 6 px) and 1.5% on Rook's card (3 px).
   Widths are the Playwright projects (320, 375, 390). Save stays pixelpets.save.v2 with v 2 and gains no field. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const WINE = 'rgb(150, 14, 22)';

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
    expect(frame['#960e16']).toBeGreaterThan(0);
    expect(frame['#ffcd75']).toBeGreaterThan(0);
    expect(frame['#c81818'] || 0).toBe(0);
  }
});

test('phase 2 props, the depot room and the lanyard icons use wine and soot', async ({ page }) => {
  const save = starterSave();
  save.settings.follower = false;
  await boot(page, save);
  const got = await page.evaluate(async () => {
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
      t1rows: PixelPets.sealArt('seal_glim_1'),
      t3rows: PixelPets.sealArt('seal_glim_3'),
      emblem: PixelPets.standingCfg().art.emblem_glimmer,
      wallRow: (await (await fetch('sprites.js')).text()).includes("wallRow('dmdmdVVddswV')"),
      winGlass: (await (await fetch('sprites.js')).text()).includes("wallFace('w', 'V', 'h', [], [4, 2, 8, 7, 'h', 's'])"),
      ringPlaced: (await (await fetch('data/mapdata.js')).text()).includes('relay_ring'),
      tierMark: (await (await fetch('game.js')).text()).includes("'VN'.includes(ch)"),
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
  expect(got.bunting[mint]).toBeGreaterThan(0);
  expect(got.bunting[white]).toBeGreaterThan(0);
  expect(got.bunting[wine] || 0).toBe(0);
  expect(got.stand[wine]).toBeGreaterThan(0);
  expect(got.stand[mint]).toBeGreaterThan(0);
  expect(got.stand[ice]).toBeGreaterThan(0);
  expect(got.stand[soot] || 0).toBe(0);
  expect(got.stand[crimson] || 0).toBe(0);
  for (const [name, frame] of [['gate', got.gate], ['tent', got.tent], ['crate', got.crate]]) {
    expect(frame[wine], name).toBeGreaterThan(0);
    noOld(frame, name);
  }
  for (const [name, frame] of [['mat', got.mat], ['line', got.line], ['wall', got.wall], ['face', got.face]]) {
    expect(frame[wine], name).toBeGreaterThan(0);
    noOld(frame, name);
  }
  expect(got.wall[soot]).toBeGreaterThan(0);
  expect(got.face[soot]).toBeGreaterThan(0);
  expect(got.kit[wine]).toBeGreaterThan(0);
  expect(got.kit[ice]).toBeGreaterThan(0);
  expect(got.kit[soot] || 0).toBe(0);
  expect(got.kit[mint] || 0).toBe(0);
  expect(got.win[wine]).toBeGreaterThan(0);
  expect(got.win[soot] || 0).toBe(0);
  expect(got.win[ice]).toBeGreaterThan(4);
  expect(got.win[mint] || 0).toBe(0);
  expect(got.winGlass).toBe(true);
  expect(got.wallRow).toBe(true);
  expect(got.ringPlaced).toBe(false);
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
  expect(got.tierMark).toBe(true);
  const marked = got.t3rows.slice(2, 13).map((row) => [4, 7, 10].filter((x) => row[x] === 'w').length);
  expect(marked.every((n) => n > 0)).toBe(true);
  expect(got.t3rows).toEqual(got.t1rows.map((row, y) => (y < 2 || y > 12) ? row
    : [...row].map((ch, x) => ((x === 4 || x === 7 || x === 10) && 'VN'.includes(ch)) ? 'w' : ch).join('')));
  expect(got.emblem).toEqual(['..NNNN..', '.NVVVVN.', 'NVVwVVVN', 'NVwwwVVN', 'NVVwVVVN', '.NVVVVN.', '..dhhd..', '...dd...']);
});

test('the legend stays the voted two lines, and the Glimmerwell hold line is white', async ({ page }) => {
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
    const paint = (cls) => {
      const el = document.createElement('p');
      el.className = 'map-hold ' + cls;
      el.textContent = 'line';
      document.body.appendChild(el);
      const color = getComputedStyle(el).color;
      el.remove();
      return color;
    };
    const css = (name) => {
      const el = document.createElement('span');
      el.style.color = 'var(' + name + ')';
      document.body.appendChild(el);
      const color = getComputedStyle(el).color;
      el.remove();
      return color;
    };
    const parse = (c) => String(c).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/).slice(1, 4).map(Number);
    const lum = (rgb) => {
      const lin = (c) => { const x = c / 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
    };
    const ratio = (a, b) => {
      const hi = Math.max(lum(parse(a)), lum(parse(b))), lo = Math.min(lum(parse(a)), lum(parse(b)));
      return (hi + 0.05) / (lo + 0.05);
    };
    const bg = getComputedStyle(document.querySelector('.map-place')).backgroundColor;
    const white = css('--w'), honey = css('--y'), crimson = css('--Q');
    const sw = getComputedStyle(document.querySelector('.sw-glimmer'));
    return {
      lines, box: el.clientWidth, h: el.getBoundingClientRect().height,
      hold: paint('hold-glimmer'), keepers: paint('hold-keepers'),
      white, honey, crimson, bg,
      qOnCard: ratio(crimson, bg), wOnCard: ratio(white, bg), yOnCard: ratio(honey, bg),
      sw: sw.backgroundColor, ring: sw.boxShadow,
    };
  });
  expect(note.lines.map(l => l.text)).toEqual(['Gold and green: Keeper roofs.', 'Red and black: Glimmerwell ground.']);
  for (const line of note.lines) expect(line.w).toBeLessThanOrEqual(note.box);
  expect(note.h).toBeLessThanOrEqual(40);
  // Q #c81818 on the place card --n #29366f is under 4.5:1, so the line is white. Honey is the Keepers' colour.
  expect(note.qOnCard).toBeLessThan(4.5);
  expect(note.qOnCard).toBeCloseTo(1.944, 2);
  expect(note.wOnCard).toBeGreaterThanOrEqual(4.5);
  expect(note.wOnCard).toBeCloseTo(10.312, 2);
  expect(note.yOnCard).toBeGreaterThanOrEqual(4.5);
  expect(note.hold).toBe(note.white);
  expect(note.hold).not.toBe(note.honey);
  expect(note.hold).not.toBe(note.crimson);
  expect(note.keepers).toBe(note.honey);
  expect(note.sw).toBe(WINE);
  expect(note.ring).toContain('26, 28, 44');
});

test('the bay goes dark on the same test as the capital screen', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const save = starterSave();
  save.settings.follower = false;
  await boot(page, save);
  const beforeKeys = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('pixelpets.save.v2'))).sort());
  const got = await page.evaluate(() => {
    const set = (flags) => {
      PixelPets.setFlag('story.gb_escort', null);
      PixelPets.setFlag('story.gb_done', null);
      PixelPets.setFlag('story.side', null);
      for (const [k, v] of Object.entries(flags)) PixelPets.setFlag(k, v);
    };
    const guides = () => {
      const info = PixelPets.mapInfo, out = [];
      for (let y = 0; y < info.h; y++) for (let x = 0; x < info.w; x++) {
        const t = PixelPets.tileInfo(x, y);
        if (t.ch === '|' || t.ch === '-' || t.ch === '+') out.push(t.decal);
      }
      return out;
    };
    const snap = () => {
      const bay = PixelPets.glimmerBay();
      return {
        escort: bay.escort, dark: bay.dark, map: bay.map, screen: bay.screen,
        tanks: bay.tanks.map(t => t.art), ids: bay.tanks.map(t => t.id), guides: guides(),
        cable: PixelPets.tileInfo(1, 4).decal, glass: PixelPets.tileInfo(1, 17).tile,
      };
    };
    PixelPets.goto('rx_f4', 6, 6, 'up');
    const off = snap();
    set({ 'story.gb_escort': true, 'story.side': 'glimmer' });
    const on = snap();
    set({ 'story.gb_escort': true, 'story.gb_done': true, 'story.side': 'glimmer' });
    const done = snap();
    set({ 'story.gb_escort': true, 'story.side': 'keepers' });
    const keepers = snap();
    set({ 'story.gb_escort': true, 'story.side': 'glimmer' });
    PixelPets.goto('r3_relay', 4, 4, 'down');
    const elsewhere = snap();
    const raw = JSON.parse(localStorage.getItem('pixelpets.save.v2'));
    return {
      off, on, done, keepers, elsewhere,
      tankArt: PixelPets.artTally('lab_tank_dark') != null,
      guideArt: PixelPets.artTally('lab_guide_v_dark_decal') != null,
      reduce: matchMedia('(prefers-reduced-motion: reduce)').matches,
      v: raw.v, keys: Object.keys(raw).sort(),
    };
  });
  expect(got.reduce).toBe(true);
  expect(got.off.dark).toBe(false);
  expect(got.off.screen).toBe('rx_terminal');
  expect(got.off.tanks).toEqual(['lab_tank', 'lab_tank', 'lab_tank', 'lab_tank', 'lab_tank', 'lab_tank']);
  expect(got.off.ids).toEqual(['rx4_tank_a', 'rx4_tank_b', 'rx4_tank_c', 'rx4_tank_d', 'rx4_tank_e', 'rx4_tank_f']);
  expect(got.off.guides.length).toBeGreaterThan(0);
  expect(got.off.guides.every((n) => n === 'lab_guide_v' || n === 'lab_guide_h' || n === 'lab_guide_x')).toBe(true);
  expect(got.on.escort).toBe(true);
  expect(got.on.dark).toBe(true);
  expect(got.on.screen).toBe('capital_screen');
  expect(got.on.tanks).toEqual(['lab_tank_dark', 'lab_tank_dark', 'lab_tank_dark', 'lab_tank_dark', 'lab_tank_dark', 'lab_tank_dark']);
  expect(got.on.guides).toEqual(got.off.guides.map((n) => n + '_dark'));
  expect(got.on.cable).toBe('lab_floor_cable');
  expect(got.on.glass).toBe('lab_glass');
  expect(got.done.dark).toBe(false);
  expect(got.done.escort).toBe(false);
  expect(got.done.screen).toBe('rx_terminal');
  expect(got.done.tanks.every((n) => n === 'lab_tank')).toBe(true);
  expect(got.keepers.screen).toBe('rx_terminal');
  expect(got.keepers.dark).toBe(false);
  expect(got.elsewhere.map).toBe('r3_relay');
  expect(got.elsewhere.escort).toBe(true);
  expect(got.elsewhere.dark).toBe(false);
  expect(got.elsewhere.screen).toBe('capital_screen');
  expect(got.elsewhere.tanks.length).toBeGreaterThan(0);
  expect(got.elsewhere.tanks.every((n) => n === 'lab_tank')).toBe(true);
  // Names resolve so the room still draws. The N/Q guide ticks and the V/N tube rims are pending.
  expect(got.tankArt).toBe(true);
  expect(got.guideArt).toBe(true);
  expect(got.v).toBe(2);
  expect(got.keys).not.toContain('glimmerBay');
  expect(got.keys).not.toContain('bayDark');
  for (const k of beforeKeys) expect(got.keys).toContain(k);
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
