/* TRIAL_HALL_FERNBROOK_MAP v0.3 (handoff/specs/TRIAL_HALL_FERNBROOK_MAP.md; D1189-D1196, Vincent's rulings of Nov 2, 2026).
   The contested Fernbrook Trial Hall is built behind a flag (AGENTS rule 9: nothing ships until Vincent says yes to the
   previews). Off (every player, and every other spec): fb_hall_in is exactly today's room. On (?debug=1&hall2=1): the east
   half is Glimmerwell's polish, a seam runs down x 7/8, and the props follow Fernbrook's hold (D1171, D1190). Fen stays.
   Also D1192 (live, unflagged): "Fernbrook Trial Hall" everywhere. Spec §12's T1-T12 are named on each check.
   Save stays pixelpets.save.v2, v 2; the flag is never saved. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');
const K = require('./fixtures/or_gate_kinds');

trackErrors(test, expect);

const CREW = ['h1_cadet', 'h1_challenger', 'h1_local'];
const PICK = {
  split: {},
  keepers: { 'story.seal1': true, 'story.side_pick_done': true, 'story.side': 'keepers' },
  glimmer: { 'story.seal1': true, 'story.side_pick_done': true, 'story.side': 'glimmer' },
};
// §7.3: when each object shows. always | split | keepers | glimmer | notK (contested + Glimmerwell) | notG (contested + Keepers).
const SHOWS = {
  fb_hall_mat: 'always', fen_hall: 'always', fb_hall_note: 'always', h1_local: 'always', h1_challenger: 'always', h1_cadet: 'always',
  fb_hall_lamp_w: 'notG', fb_hall_lamp_e: 'keepers', fb_hall_ribbon_w: 'always', fb_hall_ribbon_e: 'keepers',
  fb_hall_hedge_a: 'always', fb_hall_hedge_b: 'keepers', fb_hall_hedge_c: 'always', fb_hall_hedge_d: 'keepers',
  fb_hall_urn: 'always', fb_hall_pot: 'keepers', fb_hall_bowl_w: 'always', fb_hall_bowl_e: 'keepers', fb_hall_basket: 'keepers',
  fb_hall_bench_w: 'always', fb_hall_bench_e: 'keepers', fb_hall_jar: 'always', fb_hall_stool: 'keepers', fb_hall_cushion: 'always',
  fb_hall_t6_lamp: 'keepers', fb_hall_t5_pot: 'always', fb_hall_t4_spout: 'keepers', fb_hall_t3_herbs: 'always', fb_hall_t2_pot: 'keepers',
  fb_hall_t1_basket: 'always',
  fb_hall_banner_k1: 'notG', fb_hall_banner_k2: 'notG', fb_hall_banner_k1_g: 'glimmer', fb_hall_banner_k2_g: 'glimmer',
  fb_hall_sconce_w1: 'notG', fb_hall_honour: 'notG', fb_hall_sconce_w2: 'notG', fb_hall_crest: 'notG', fb_hall_crest_cover: 'glimmer',
  fb_hall_plaque: 'notK', fb_hall_plaque_k: 'keepers', fb_hall_banner_half: 'split', fb_hall_banner_half_g: 'glimmer',
  fb_hall_banner_half_k: 'keepers', fb_hall_banner_g1: 'notK', fb_hall_clamp_w: 'glimmer', fb_hall_clamp_e: 'notK',
  fb_hall_banner_g2: 'notK', fb_hall_clamp_t6: 'notK', fb_hall_clamp_8: 'notK', fb_hall_clamp_8_off: 'keepers',
  fb_hall_planter_g1: 'notK', fb_hall_planter_g2: 'notK', fb_hall_clamp_18: 'notK', fb_hall_board_k: 'split',
  fb_hall_board_k_k: 'keepers', fb_hall_board_k_g: 'glimmer', fb_hall_board_g: 'split', fb_hall_board_g_g: 'glimmer',
  fb_hall_board_g_k: 'keepers', fb_hall_rope: 'split', fb_hall_grout: 'split', fb_hall_tilecrate: 'keepers', fb_hall_lampbox: 'glimmer',
  fb_hall_stand: 'notK', fb_hall_clamp_21: 'notK',
};
const shows = (rule, hold) => rule === 'always' || rule === hold || (rule === 'notK' && hold !== 'keepers') || (rule === 'notG' && hold !== 'glimmer');
const NEW_TILES = ['glim_tile', 'glim_tile_b', 'glim_seam', 'glim_step', 'hall_ledge_glim', 'hall_ledge_glim_b', 'glim_dais', 'glim_dais_lip', 'hall_flag_worn'];
const NEW_ART = ['banner_keeper_old', 'keep_honour_board', 'banner_glim', 'banner_glim_stand', 'banner_glim_half', 'glim_plaque', 'glim_plaque_covered',
  'crest_cover', 'bulletin_keepers_x', 'bulletin_glimmer_x', 'seam_rope', 'grout_bucket', 'tile_crate', 'glim_planter', 'comfort_lamp_off'];

function hallSave(extra, world) {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.follower = true;
  Object.assign(s.flags, { 'story.early_done': true, 'story.reached_route1': true, 'story.reached_fernbrook': true, 'story.met_glimmerwell': true, 'story.met_fen': true, 'story.lizzy_class': true }, extra || {});
  s.world = Object.assign({ map: 'fb_hall_in', x: 7, y: 22, facing: 'up', respawn: 'fernbrook' }, world || {});
  return s;
}
const beaten = () => Object.fromEntries(CREW.map(id => ['trainer.' + id, true]));
async function boot(page, s, search) {
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, search);
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true);
  await page.evaluate(() => { PixelPets.showTab('walk'); PixelPets.clearWild(); });
  await page.waitForFunction(() => !window.PixelPets.fading);
}
const ON = '?debug=1&hall2=1', OFF = '?debug=1';
// The whole room as the engine sees it: walk mask, glyphs, painted tiles and the present objects.
const room = page => page.evaluate(() => {
  const info = PixelPets.mapInfo, walk = [], chars = [], painted = [];
  for (let y = 0; y < info.h; y++) {
    let w = '', c = ''; const p = [];
    for (let x = 0; x < info.w; x++) {
      const t = PixelPets.tileInfo(x, y);
      w += t.walk ? '1' : '0'; c += t.ch; p.push(t.solid ? 'wall' : (t.tile + '|' + (t.decal || '')));
    }
    walk.push(w); chars.push(c); painted.push(p);
  }
  return { id: info.id, name: info.name, walk, chars, painted, objs: PixelPets.mapObjs.map(o => ({ id: o.id, kind: o.kind, x: o.x, y: o.y, sprite: o.sprite, art: o.art })) };
});
async function savedJson(page) { return page.evaluate(() => localStorage.getItem('pixelpets.save.v2')); }

test('flag off: the Hall is exactly today\'s room, and ?hall2=1 does nothing without debug', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page, hallSave(beaten()), OFF);
  expect(await page.evaluate(() => PixelPets.hall2())).toBe(false);
  const off = await room(page);
  const base = await page.evaluate(() => MAPDATA.fernbrook_rooms.maps.fb_hall_in);
  expect(off.chars).toEqual(base.grid);
  expect(off.objs.map(o => o.id).sort()).toEqual(base.objs.map(o => o.id).sort());
  expect(off.objs.find(o => o.id === 'h1_local')).toMatchObject({ x: 13, y: 18 });
  expect(off.objs.find(o => o.id === 'h1_cadet')).toMatchObject({ x: 12, y: 8 });
  // No new art is painted in today's room.
  expect(off.painted.flat().filter(p => /^(glim_|hall_ledge_glim|hall_flag_worn)/.test(p))).toEqual([]);
  // Without ?debug=1 the preview key is inert (rule 7), even if the URL asks for it.
  // A new tab has its own sessionStorage, so debug is off there.
  const p2 = await page.context().newPage();
  await gotoGame(p2, '?hall2=1');
  expect(await p2.evaluate(() => PixelPets.hall2())).toBe(false);
  await p2.close();
});

test('T1 T2 T10: same walk mask, west half untouched, runs of 6 at most, floor cap', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390');
  test.setTimeout(60000);
  await boot(page, hallSave(beaten()), OFF);
  const off = await room(page);
  const p2 = await page.context().newPage();   // a new tab: its own sessionStorage, the same installed save
  await gotoGame(p2, ON);
  await p2.waitForFunction(() => window.PixelPets && PixelPets.debug === true);
  expect(await p2.evaluate(() => PixelPets.hall2())).toBe(true);
  const on = await room(p2);
  // T1: every cell walks as before; the hop column stays at x 7 on rows 7-17.
  expect(on.walk).toEqual(off.walk);
  for (const y of [7, 9, 11, 13, 15, 17]) expect(on.chars[y][7], 'hop ' + y).toBe('V');
  // T2: the west half (x 0-7) and rows 0-2 and 23 are byte-identical.
  for (let y = 0; y < 24; y++) {
    if (y < 3 || y === 23) expect(on.chars[y], 'row ' + y).toBe(off.chars[y]);
    else expect(on.chars[y].slice(0, 8), 'west ' + y).toBe(off.chars[y].slice(0, 8));
  }
  // §5.2: the east half uses the new glyphs, and the seam column x 8 is Z or a planter ledge.
  expect(on.chars[8].slice(8)).toBe('ZPPPPPP#');
  expect(on.chars[4].slice(8)).toBe('IIIIIPP#');
  // T10: painted runs no longer than 6 (hall_step and hall_dais_lip settled stripes excepted, as maps_b8), floor share and cap.
  const stripe = c => c === 'wall' || c.startsWith('hall_step|') || c.startsWith('hall_dais_lip|');
  const runs = [];
  for (let y = 0; y < 24; y++) for (let x = 1, r = 1; x < 16; x++) {
    if (stripe(on.painted[y][x]) || stripe(on.painted[y][x - 1])) { r = 1; continue; }
    r = on.painted[y][x] === on.painted[y][x - 1] ? r + 1 : 1; if (r > 6) runs.push('h ' + x + ',' + y);
  }
  for (let x = 0; x < 16; x++) for (let y = 1, r = 1; y < 24; y++) {
    if (stripe(on.painted[y][x]) || stripe(on.painted[y - 1][x])) { r = 1; continue; }
    r = on.painted[y][x] === on.painted[y - 1][x] ? r + 1 : 1; if (r > 6) runs.push('v ' + x + ',' + y);
  }
  expect(runs).toEqual([]);
  // The planter ledges are solid (painted 'wall' above), so their stamped-logo variant is read straight from the tiles.
  const ledges = await p2.evaluate(() => { const n = {}; for (let y = 0; y < 24; y++) for (let x = 8; x < 15; x++) { const t = PixelPets.tileInfo(x, y); if (t.ch === 'M') n[t.tile] = (n[t.tile] || 0) + 1; } return n; });
  expect(Object.keys(ledges).sort()).toEqual(['hall_ledge_glim', 'hall_ledge_glim_b']);
  expect(on.painted.flat().some(p => p.startsWith('hall_flag_worn|'))).toBe(true);
  const share = await p2.evaluate(() => PixelPets.floorShare('fb_hall_in'));
  expect(share.share).toBeLessThanOrEqual(0.7);
  expect(await p2.evaluate(() => PixelPets.devChecks().floorCap)).toEqual([]);
  await p2.close();
});

for (const hold of ['split', 'keepers', 'glimmer']) {
  test(`T3 T4 T5 (${hold}): paths, every object readable, no shared tiles, objects as §7.3`, async ({ page }) => {
    test.skip(page.viewportSize().width !== 390, '390');
    test.setTimeout(60000);
    await boot(page, hallSave(Object.assign(beaten(), PICK[hold])), ON);
    expect(await page.evaluate(() => PixelPets.mapHold('fernbrook'))).toBe(hold);
    const r = await room(page);
    // T5: the object set per state, and one object per tile.
    const want = Object.keys(SHOWS).filter(id => shows(SHOWS[id], hold)).sort();
    expect(r.objs.map(o => o.id).sort()).toEqual(want);
    const cells = r.objs.map(o => o.x + ',' + o.y);
    expect(cells.length).toBe(new Set(cells).size);
    for (const o of r.objs) if (o.kind === 'prop') expect(o.art, o.id + ' art').toBe(true);
    // T3: art_pass path lengths are unchanged.
    const paths = await page.evaluate(() => {
      const up = PixelPets.findPath([{ x: 7, y: 5 }]);
      PixelPets.goto('fb_hall_in', 7, 5, 'down');
      const down = PixelPets.findPath([{ x: 7, y: 22 }]), mat = PixelPets.findPath([{ x: 7, y: 23 }]);
      PixelPets.goto('fb_hall_in', 7, 22, 'up');
      const land = PixelPets.findPath([{ x: 7, y: 8 }]);
      return { up: up.length, down: down.length, mat: mat.length, land: land.length };
    });
    expect(paths).toEqual({ up: 59, down: 11, mat: 12, land: 50 });
    // T4: from the door, every present object has a reachable floor neighbour. (1,18) is left out, as today. While the Keeper
    // honour board (3,2) hangs, the wall-strip cell (4,2) between it and the old banner (5,2) is a closed pocket above the lamp.
    const reach = await page.evaluate(() => {
      PixelPets.goto('fb_hall_in', 7, 22, 'up');
      const key = (x, y) => x + ',' + y, seen = new Set([key(7, 22)]), q = [[7, 22]];
      const step = (x, y, dx, dy) => {
        const nx = x + dx, ny = y + dy, t = PixelPets.tileInfo(nx, ny);
        if (t.ch === 'V' && dx === 0 && dy === 1) { const L = PixelPets.tileInfo(nx, ny + 1); return L.walk && !L.blocked ? [nx, ny + 1] : null; }
        return t.walk && !t.blocked ? [nx, ny] : null;
      };
      while (q.length) {
        const [x, y] = q.shift();
        for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) { const l = step(x, y, dx, dy); if (l && !seen.has(key(...l))) { seen.add(key(...l)); q.push(l); } }
      }
      const info = PixelPets.mapInfo, left = [];
      for (let y = 0; y < info.h; y++) for (let x = 0; x < info.w; x++) { const t = PixelPets.tileInfo(x, y); if (t.walk && !t.blocked && !seen.has(key(x, y))) left.push(key(x, y)); }
      const lonely = PixelPets.mapObjs.filter(o => o.kind !== 'warp' && ![[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => seen.has(key(o.x + dx, o.y + dy)))).map(o => o.id);
      return { left, lonely };
    });
    expect(reach.left).toEqual(hold === 'glimmer' ? ['1,18'] : ['4,2', '1,18']);
    expect(reach.lonely).toEqual([]);
  });
}

test('T6 + D1191: the props follow mapHold(fernbrook) on every save kind, through the hold: term', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390');
  test.setTimeout(120000);
  const kinds = ['a1', 'a2', 'b', "b'", 'c', 'c_glimmer', 'p', 'n', 'a1_glimmer'];
  for (const kind of kinds) {
    const fx = K.KINDS[kind], s = starterSave();
    Object.assign(s.flags, fx.flags); s.seals = { ...fx.seals };
    s.world = { map: 'fernbrook', x: 12, y: 8, facing: 'down', respawn: 'fernbrook' };
    await installSave(page.context(), s, { quietDay: true });
    await gotoGame(page, ON);
    await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && typeof PixelPets.gateRead === 'function');
    const got = await page.evaluate(ids => ({ hold: PixelPets.mapHold('fernbrook'), on: ids.filter(id => (PixelPets.gateRead('fb_hall_in', id) || {}).whenOk) }), Object.keys(SHOWS));
    const want = Object.keys(SHOWS).filter(id => shows(SHOWS[id], got.hold) && !['fen_hall'].includes(id));
    expect(got.on.filter(id => id !== 'fen_hall').sort(), kind).toEqual(want.sort());
    // D1191: the props' `hold:` term is mapHold itself, negation included.
    const terms = await page.evaluate(() => ['split', 'keepers', 'glimmer'].map(h => [h, PixelPets.condRead('hold:fernbrook=' + h).cond, PixelPets.condRead('!hold:fernbrook=' + h).cond]));
    for (const [h, yes, no] of terms) { expect(yes, kind + ' ' + h).toBe(got.hold === h); expect(no, kind + ' !' + h).toBe(got.hold !== h); }
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
  }
});

test('T7 T8: the holders see from their new spots, and Fen still sends the holder back first', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390');
  test.setTimeout(60000);
  await boot(page, hallSave(), ON);
  const sight = await page.evaluate(() => Object.fromEntries(Object.entries(PixelPets.sightLines).map(([k, v]) => [k, v.map(c => c.x + ',' + c.y)])));
  expect(sight.h1_local).toEqual(['7,20', '6,20', '5,20']);
  expect(sight.h1_challenger).toEqual(['11,12', '10,12', '9,12', '8,12', '7,12']);
  expect(sight.h1_cadet).toEqual(['4,5', '5,5', '6,5', '7,5', '8,5']);
  // T8: Fen turns the holder back while the crew is unbeaten (D1190: she stays in her Hall).
  await page.evaluate(() => PixelPets.goto('fb_hall_in', 7, 5, 'up'));
  expect(await page.evaluate(() => PixelPets.talkTo('fen_hall'))).toBe(true);
  await page.waitForFunction(() => !!PixelPets.scene);
  await page.keyboard.press('Space');
  expect(await page.evaluate(() => PixelPets.scene && PixelPets.scene.text)).toContain('Three holders wait on the path first');
  expect(await page.evaluate(() => !!(PixelPets.battle && PixelPets.battle.on))).toBe(false);
});

for (const at of [{ x: 7, y: 22, n: 'door' }, { x: 7, y: 6, n: 'dais' }]) {
  test(`T9: the seam is on screen from the ${at.n}`, async ({ page }) => {
    test.skip(page.viewportSize().width === 375, '320 and 390');
    await boot(page, hallSave(beaten(), { x: at.x, y: at.y }), ON);
    await page.waitForTimeout(400);
    const v = await page.evaluate(() => {
      const mc = document.querySelector('#mapCanvas'), cam = PixelPets.walk.cam;
      return { l: cam.x / 16, r: (cam.x + mc.width) / 16, t: cam.y / 16, b: (cam.y + mc.height) / 16 };
    });
    expect(v.l).toBeLessThanOrEqual(8);
    expect(v.r).toBeGreaterThanOrEqual(9);
    if (at.n === 'dais') {
      for (const [x, y] of [[7, 4], [3, 5]]) {   // Fen and the cadet, whole tiles
        expect(x >= v.l && x + 1 <= v.r + 0.001 && y >= v.t && y + 1 <= v.b + 0.001, x + ',' + y).toBe(true);
      }
    }
  });
}

test('T11 T12: every new art key exists, no crimson in it, and the east floor reads lighter in greyscale', async ({ page }) => {
  test.skip(page.viewportSize().width !== 320, '320');
  await boot(page, hallSave(beaten()), ON);
  const r = await page.evaluate(({ tiles, art }) => {
    const TILES = buildTiles(), WART = buildWorldArt();   // sprites.js builders (game.js keeps its copies private)
    const missing = tiles.filter(k => !TILES[k]).concat(art.filter(k => !WART[k]));
    const canv = a => Array.isArray(a) ? a : [a];
    let crimson = 0;
    for (const k of tiles.map(k => TILES[k]).concat(art.map(k => WART[k])).flatMap(canv)) {
      if (!k) continue;
      const d = k.getContext('2d').getImageData(0, 0, 16, 16).data;
      for (let i = 0; i < d.length; i += 4) if (d[i + 3] && d[i] === 0xc8 && d[i + 1] === 0x18 && d[i + 2] === 0x18) crimson++;
    }
    // T12: mean luma of the painted floor cells, east (x 9-14) vs west (x 1-6), rows 3-22.
    const luma = name => { const c = TILES[name]; if (!c) return null; const d = c.getContext('2d').getImageData(0, 0, 16, 16).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; return s / 256; };
    const side = (x0, x1) => { let s = 0, n = 0; for (let y = 3; y < 23; y++) for (let x = x0; x <= x1; x++) { const t = PixelPets.tileInfo(x, y); if (!t.walk) continue; const l = luma(t.tile); if (l != null) { s += l; n++; } } return s / n; };
    const seam = []; for (let y = 3; y < 23; y++) seam.push(PixelPets.tileInfo(8, y).tile);
    return { missing, crimson, east: side(9, 14), west: side(1, 6), seam };
  }, { tiles: NEW_TILES, art: NEW_ART });
  expect(r.missing).toEqual([]);
  expect(r.crimson).toBe(0);
  // Mean luma on a 0-255 scale (first build: east about 27 above west). The Glimmerwell half must read lighter.
  expect(r.east - r.west).toBeGreaterThan(20);
  expect(r.seam.filter(t => t === 'glim_seam').length).toBeGreaterThanOrEqual(10);
});

// The save after a Hall visit, flag on vs flag off: the same keys and flags (the flag adds nothing), v 2, nothing named hall2.
async function visitSave(page, hold, search) {
  const p = await page.context().newPage();
  await p.emulateMedia({ reducedMotion: 'reduce' });
  await gotoGame(p, search);
  await p.waitForFunction(() => window.PixelPets && PixelPets.debug === true);
  await p.evaluate(() => { PixelPets.showTab('walk'); PixelPets.clearWild(); PixelPets.goto('fb_hall_in', 7, 22, 'up'); });
  await p.waitForTimeout(300);
  await p.evaluate(() => PixelPets.walkStep('up'));
  await p.waitForTimeout(400);
  await p.evaluate(() => PixelPets.goto('fernbrook', 22, 7, 'down'));
  await p.waitForTimeout(300);
  const out = JSON.parse(await savedJson(p));
  await p.close();
  return out;
}
test('save unchanged in every state, reduced motion on, flag never saved', async ({ page }) => {
  test.setTimeout(90000);
  for (const hold of ['split', 'keepers', 'glimmer']) {
    await page.context().clearCookies();
    await installSave(page.context(), hallSave(Object.assign(beaten(), PICK[hold]), { map: 'fernbrook', x: 22, y: 7, facing: 'up' }), { quietDay: true });
    const off = await visitSave(page, hold, OFF), on = await visitSave(page, hold, ON);
    expect(on.v).toBe(2);
    expect(Object.keys(on).sort(), hold).toEqual(Object.keys(off).sort());
    expect(Object.keys(on.flags).sort(), hold).toEqual(Object.keys(off.flags).sort());
    expect(JSON.stringify(on)).not.toContain('hall2');
  }
});

test('D1192: Fernbrook Trial Hall everywhere (live, flag off)', async ({ page }) => {
  await boot(page, hallSave(beaten()), OFF);
  // The place chip on the walk screen, inside the Hall.
  await expect(page.locator('body')).toContainText('Fernbrook Trial Hall');
  const r = await page.evaluate(async () => ({
    name: MAPDATA.fernbrook_rooms.maps.fb_hall_in.name,
    note: MAPDATA.fernbrook_rooms.maps.fb_hall_in.objs.find(o => o.id === 'fb_hall_note').text,
    blurb: (await (await fetch('game.js?r=' + Date.now())).text()).includes("blurb: 'Orchard village. Fernbrook Trial Hall.'"),
    data: JSON.stringify([MAPDATA.news, MAPDATA.ribbit_posts, MAPDATA.fernbrook_rooms]),
  }));
  expect(r.name).toBe('Fernbrook Trial Hall');
  expect(r.note).toBe('FERNBROOK TRIAL HALL. Master Fen waits on the dais.');
  expect(r.blurb).toBe(true);
  expect(r.data).not.toMatch(/Bloom Trial Hall|BLOOM TRIAL HALL|#BloomHall/);
  // The town sign (verbatim maps_slice.json, overridden by data/detail_zz_hall_contested.json): read it in the game.
  await page.evaluate(() => PixelPets.goto('fernbrook', 2, 8, 'up'));
  expect(await page.evaluate(() => PixelPets.talkTo('fb_sign_town'))).toBe(true);
  await page.waitForFunction(() => !!PixelPets.scene);
  await page.keyboard.press('Space');
  expect(await page.evaluate(() => PixelPets.scene && PixelPets.scene.text)).toBe('FERNBROOK · Orchard village. Home of the Fernbrook Trial Hall.');
});
