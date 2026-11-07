/* WAR_MUSEUM v0.1.1 (design repo, private; settled by Vincent Thu Nov 5, 2026, all defaults: D2300-D2318, rule 9 previews approved):
   the Muster Road Museum on Charter Hill's old corner (hc_civic box 2,38-14,43, door 8,44) and its room hc_museum_in (14x16).
   tools/build_hc_city.py (the city is live since Fri Nov 6, 2026: HC_CITY_V2 on), sprites.js (WAR_MUSEUM_ART and the
   hc_museum_in skin), game.js (the `pay` and `glow` steps, `partner:out`, the keepsake), quests.js (the Stamp Trail side chain).
   §8 tests 1-10: the door and the mat, every exhibit reachable and tappable, the act gates (K2 on story.wb_cut, K5's card on
   story.hc_trial_called, K6, K7, K11), the Stamp Trail and its reward once, the donation lantern (10 and 50, the name at 100, the
   plaque at 500, a short purse; each gift a "Museum gift" line in the bank's ledger through moneyDelta), rule 10 (D2314), no INSIGN (D2317), the palette (no mint, no wine west of the seam) and the three
   looks against data/look_lock.json. Runs at 320, 375 and 390 (@w1 rows at 320 only); one run in reduced motion; Modern controls;
   zero console errors. The city is live and writes the save: pixelpets.save.v2 keeps the same keys and v 2. */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const ROOT = path.join(__dirname, '..');
const HC = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'hc_city_v2.json'), 'utf8'));
const CIV = HC.maps.hc_civic, ROOM = HC.rooms.hc_museum_in;
const LOCK = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'look_lock.json'), 'utf8'));
const CUR = 'Curator Edda Lorne', DOC = 'Associate Tansy', REG = 'Bench regular';

// §5.2 placement, cell for cell (sprite: the art each id draws; the library v0.2 pieces stand where the packet says "if it lands").
const PLACE = [
  ['wm_lanterns_old_a', 1, 1, 'pu_lantern_shelf'], ['wm_notice', 2, 1, 'wm_notice'], ['wm_chapter', 5, 1, 'wm_chapter'],
  ['wm_lanterns_old_b', 6, 1, 'pu_lantern_shelf'], ['wm_lanterns_new_a', 7, 1, 'wm_lanterns_new'], ['wm_wing_panel', 8, 1, 'wm_wing_panel'],
  ['wm_photo', 9, 1, 'photo_wall'], ['wm_sponsor', 10, 1, 'wm_sponsor'], ['wm_banner_glim', 11, 1, 'pg_banner'], ['wm_clock', 12, 1, 'pt_station'],
  ['wm_fern_k', 1, 2, 'pv_fern'], ['wm_glim_planter', 12, 2, 'pg_planter'], ['wm_sea_lantern', 1, 4, 'wm_road_lantern'],
  ['wm_lectern_stone', 2, 4, 'pc_lectern'], ['wm_mapcase_0', 3, 4, 'wm_mapcase_0'], ['wm_mapcase_1', 4, 4, 'wm_mapcase_1'],
  ['wm_rope_w', 5, 4, 'wm_rope_post'], ['wm_case_empty_0', 6, 4, 'wm_case_empty_0'], ['wm_case_empty_1', 7, 4, 'wm_case_empty_1'],
  ['wm_rope_e', 8, 4, 'wm_rope_post'], ['npc_docent', 11, 4, null], ['wm_glim_case', 10, 6, 'pg_display_case'], ['wm_kiosk', 12, 6, 'pg_kiosk'],
  ['wm_cart_0', 1, 7, 'wm_cart_0'], ['wm_cart_1', 2, 7, 'wm_cart_1'], ['wm_scout_lamp', 4, 7, 'wm_scout_lamp'],
  ['wm_bench_0', 3, 9, 'pq_bench_wood_0'], ['wm_bench_1', 4, 9, 'pq_bench_wood_1'], ['wm_drum', 9, 9, 'wm_drum'],
  ['wm_lectern_drum', 10, 9, 'pc_lectern'], ['wm_tree_w', 12, 9, 'pv_potted_tree'], ['wm_letters', 1, 10, 'wm_letters'], ['npc_elder', 2, 10, null],
  ['wm_easel', 1, 12, 'easel'], ['npc_curator', 8, 12, null], ['wm_desk_0', 9, 12, 'pf_front_counter_civic_0'],
  ['wm_desk_1', 10, 12, 'pf_front_counter_civic_1'], ['wm_records', 11, 12, 'pc_records'], ['wm_friends', 12, 12, 'wm_friends'],
  ['wm_stamp_table', 3, 13, 'wm_stamp_table'], ['wm_stool_b', 4, 13, 'wm_stool'], ['wm_cubbies', 1, 14, 'walkling_cubbies'],
  ['wm_stool_a', 3, 14, 'wm_stool'], ['wm_donation', 11, 14, 'wm_donation'], ['wm_flag', 12, 14, 'pc_flag_stand'],
];
// The §5.1 grid in the engine's chars: . oak parquet (x 1-7), , Wing stone (x 8-12), : ; the runner (x 6-7, rows 5-14), ~ the kids' rug.
const GRID = ['##############', '#WWWWWWWWWWWW#', '#.......,,,,,#', '#.......,,,,,#', '#.......,,,,,#']
  .concat(Array.from({ length: 7 }, () => '#.....:;,,,,,#'), Array.from({ length: 3 }, () => '#~~~~.:;,,,,,#'), ['#######m######']);
// Every exhibit and person, the cell it is tapped on, and the first words a tap shows (§3.2, §7). Wall pieces are tapped from row 2.
const TAPS = [
  ['wm_tap_k1', 6, 1, 'Lanterns of the war years, lent by the towns.'], ['wm_tap_k2', 2, 1, 'A Keeper notice, from the war.'],
  ['wm_tap_k4a', 3, 1, 'Rubbings of the Hall plates, lent by holders.'], ['wm_tap_k4b', 4, 1, 'Rubbings of the Hall plates, lent by holders.'],
  ['wm_tap_k3', 5, 1, 'THE LANTERN MUSTER. Chapter four.'], ['wm_tap_w1_7', 7, 1, 'The Bright Years. New light for every roof.'],
  ['wm_tap_w1_8', 8, 1, 'The Bright Years. New light for every roof.'], ['wm_tap_w1_9', 9, 1, 'The Bright Years. New light for every roof.'],
  ['wm_tap_sponsor', 10, 1, 'THE BRIGHT YEARS WING. Given by Glimmerwell Co.'],
  ['wm_sea_lantern', 1, 4, 'The lanterns stayed lit on every road.'], ['wm_lectern_stone', 2, 4, 'ONE STONE. WHOLE.'],
  ['wm_mapcase_0', 3, 4, 'The Duskwater Stone, carried to safety.'], ['wm_case_empty_0', 6, 4, 'THE ROLL. First page.'],
  ['wm_glim_case', 10, 6, 'Our first lamp. It lit the hard years.'], ['wm_kiosk', 12, 6, 'Touch to learn more!'],
  ['wm_cart_0', 1, 7, 'Walklings served.'], ['wm_scout_lamp', 4, 7, "A Keeper Scout's lamp."], ['wm_drum', 9, 9, 'The drum turns. Nothing falls out.'],
  ['wm_lectern_drum', 10, 9, 'The first Picking Day drum. The peace\'s gift.'], ['wm_letters', 1, 10, 'Letters home.'],
  ['wm_easel', 1, 12, 'Drawings by visiting kids. One Walkling has a lantern tail.'], ['wm_stamp_table', 3, 13, "Kids' corner. Stamps are free."],
  ['wm_friends', 12, 12, 'FRIENDS OF THE MUSEUM.'], ['wm_donation', 11, 14, 'Gifts keep the lamps lit. Give?'],
  ['npc_curator', 8, 12, 'Welcome, colleague. Both halves are open, both are free. I wrote the cards on this side.'],
  ['npc_docent', 11, 4, 'Welcome to the Bright Years Wing! Hard years, new partners, brighter by nature!'],
  ['npc_elder', 2, 10, "I come for the letters. I don't read them. I just sit with them."],
];
// §5.3: the talk or tap cell of every target, from the arrival (7,14), and the packet's step count.
const REACH = { curator: [8, 13, 2], donation: [10, 14, 3], friends: [12, 13, 6], drum: [8, 9, 6], stamp_table: [3, 12, 6], easel: [2, 12, 7],
  elder: [3, 10, 8], empty_case: [7, 5, 9], letters: [1, 11, 9], scout: [4, 8, 9], first_lamp: [10, 5, 10], cart: [1, 8, 11], map_case: [3, 5, 12],
  kiosk: [11, 6, 12], docent: [10, 4, 13], face_row: [9, 2, 14], road_lantern: [1, 5, 15] };

// The museum's own words: every scene it owns and every text on its room and forecourt.
const MUSEUM_SCENES = Object.keys(HC.scenes).filter(k => /^wm_/.test(k));
const MUSEUM_OBJS = ROOM.objs.concat(CIV.objs.filter(o => /^wm_|^hc_museum$/.test(o.id)));
function texts() {
  const says = [], labels = [], toasts = [], all = [];
  const walk = st => {
    if (!Array.isArray(st)) return;
    if (st[0] === 'say' && typeof st[2] === 'string') { says.push(st[2]); all.push(st[2]); }
    if (st[0] === 'toast') { toasts.push(st[1]); all.push(st[1]); }
    if (st[0] === 'choice') { says.push(st[1]); all.push(st[1]); for (const o of st[2]) { labels.push(o[0]); all.push(o[0]); walk(o[1]); } return; }
    for (const x of st) walk(x);
  };
  for (const k of MUSEUM_SCENES) walk(HC.scenes[k]);
  for (const o of MUSEUM_OBJS) {
    for (const v of [o.text, o.name].concat(Object.values(o.lines || {}))) if (typeof v === 'string' && v[0] !== '@') { says.push(v); all.push(v); }
  }
  return { says, labels, toasts, all };
}

const BASE = {
  'story.side_pick_done': true, 'story.keeper_cadet': true, 'story.side': 'keepers', 'story.hc_invite': true, 'story.hc_arrived': true,
  'story.hc_greeted': true, 'story.act': 2, 'story.gov_posted': true, 'story.hc_gov_met': true,
  'story.wm_runner': true,   // the runner's walk-on line has played (WM-T4b plays it); taps that cross row 6 are not stopped by it
};
const BLOCKED = new Set(ROOM.objs.filter(o => ['npc', 'prop', 'sign'].includes(o.kind)).map(o => o.x + ',' + o.y));
// A free floor cell two or three steps from (x, y), on the runner side, so the piece is on screen at every width.
function nearCell(x, y) {
  const free = (a, b) => ROOM.grid[b] && ',.:;~'.includes(ROOM.grid[b][a]) && !BLOCKED.has(a + ',' + b);
  const c = [];
  for (let b = 2; b <= 14; b++) for (let a = 1; a <= 12; a++) {
    const dist = Math.abs(a - x) + Math.abs(b - y);
    if (free(a, b) && dist >= 2 && dist <= 3) c.push([dist * 10 + Math.abs(a - 7), a, b]);
  }
  c.sort((p, q) => p[0] - q[0]);
  return c[0].slice(1);
}
function save(flags, money) {
  const s = starterSave();
  s.settings.controls = 'modern'; s.settings.textSpeed = 'fast'; s.settings.follower = false; s.settings.tips = false;
  Object.assign(s.flags, BASE, flags || {});
  for (const [k, v] of Object.entries(s.flags)) if (v === null) delete s.flags[k];
  s.world = { map: 'highcharity', x: 32, y: 37, facing: 'up', respawn: 'hearthmoor' };
  s.money = money == null ? 600 : money;
  return s;
}
async function boot(page, flags, opts = {}) {
  if (opts.reduce) await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.setFixedTime(new Date('2026-11-05T11:00:00-05:00'));
  const s = save(flags, opts.money);
  if (opts.follower) s.settings.follower = true;
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && typeof PixelPets.talkTo === 'function' && PixelPets.state);
  await page.evaluate(() => { PixelPets.showTab('walk'); if (PixelPets.clearWild) PixelPets.clearWild(); PixelPets.clock.freeze(true); PixelPets.clock.set('thu', 11, 0); });
  if (opts.reduce) expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  return page.evaluate(() => localStorage.getItem('pixelpets.save.v2'));
}
const flags = page => page.evaluate(() => Object.assign({}, PixelPets.state.flags));
const where = page => page.evaluate(() => ({ map: PixelPets.mapInfo.id, x: PixelPets.state.world.x, y: PixelPets.state.world.y, facing: PixelPets.state.world.facing }));
async function goto(page, map, x, y, facing) {
  await page.evaluate(([m, x, y, f]) => PixelPets.goto(m, x, y, f), [map, x, y, facing || 'down']);
  await page.waitForFunction(m => PixelPets.mapInfo.id === m && !PixelPets.fading, map);
}
// Modern controls: a tap on a tile walks there; a tap on a person or prop walks over and talks.
async function tapTile(page, x, y) {
  await expect.poll(() => page.evaluate(async () => {
    const a = Object.assign({}, PixelPets.walk.cam);
    await new Promise(r => setTimeout(r, 120));
    const b = PixelPets.walk.cam;
    return a.x === b.x && a.y === b.y;
  }), { timeout: 5000 }).toBe(true);
  const r = await page.evaluate(({ x, y }) => {
    const mc = document.querySelector('#mapCanvas'), b = mc.getBoundingClientRect(), cam = PixelPets.walk.cam;
    const cx = b.left + ((x * 16 + 8 - cam.x) / mc.width) * b.width, cy = b.top + ((y * 16 + 8 - cam.y) / mc.height) * b.height;
    const opt = { bubbles: true, cancelable: true, clientX: cx, clientY: cy, pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0 };
    mc.dispatchEvent(new PointerEvent('pointerdown', opt));
    mc.dispatchEvent(new PointerEvent('pointerup', opt));
    return cx >= b.left + 4 && cx <= b.right - 4 && cy >= b.top + 4 && cy <= b.bottom - 4;
  }, { x, y });
  return r;
}
// Plays the open scene to its end; a choice takes the first label in `picks` that is offered. Lines are [speaker, text];
// a choice is ['>', label, [labels offered], prompt].
async function drive(page, picks = [], ms = 30000) {
  const until = Date.now() + ms, lines = [];
  let last = null;
  while (Date.now() < until) {
    const sc = await page.evaluate(() => PixelPets.scene && { mode: PixelPets.scene.mode, full: PixelPets.scene.full, waiting: PixelPets.scene.waiting, text: PixelPets.scene.text, who: PixelPets.scene.who });
    if (!sc) { await page.waitForTimeout(150); if (!(await page.evaluate(() => !!PixelPets.scene))) return lines; continue; }
    if (sc.mode === 'choice') {
      if (!sc.full || !(await page.locator('#sbChoices button:visible').count())) { await page.waitForTimeout(40); continue; }
      await page.waitForFunction(() => PixelPets.optionsReady === true);
      const labels = (await page.locator('#sbChoices button').allTextContents()).map(t => t.trim());
      const pick = picks.find(p => labels.includes(p)) || labels[0];
      lines.push(['>', pick, labels, sc.text]);
      for (const b of await page.locator('#sbChoices button').all()) expect((await b.boundingBox()).height).toBeGreaterThanOrEqual(44);
      await page.locator('#sbChoices button', { hasText: pick }).first().click();
      await page.waitForTimeout(40); continue;
    }
    if (sc.mode === 'say' && sc.waiting) {
      if (!sc.full) { await page.waitForTimeout(40); continue; }
      const key = sc.who + '|' + sc.text;
      if (key !== last) { lines.push([sc.who || '', sc.text]); last = key; }
      await page.keyboard.press('Space'); await page.waitForTimeout(30); continue;
    }
    await page.waitForTimeout(40);
  }
  throw new Error('scene did not end: ' + JSON.stringify(lines.slice(-3)));
}
const says = lines => lines.filter(l => l[0] !== '>').map(l => l[1]);
async function talk(page, id, picks) {
  await page.waitForFunction(() => !PixelPets.scene && !PixelPets.fading);
  expect(await page.evaluate(i => PixelPets.talkTo(i), id), 'talk ' + id).toBe(true);
  return drive(page, picks);
}
function bfs(grid, blocked, start) {
  const walk = new Set(['.', ',', ':', ';', '~', 'm']), d = new Map([[start.join(','), 0]]), q = [start];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
      if (d.has(k) || !grid[ny] || !walk.has(grid[ny][nx]) || blocked.has(k)) continue;
      d.set(k, d.get(x + ',' + y) + 1); q.push([nx, ny]);
    }
  }
  return d;
}

test.describe('WAR_MUSEUM data: the corner, the room, the words (§5, §8 tests 3, 8, 9; D2300, D2301, D2314, D2317)', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== '390', 'data checks run once, at 390'));

  test('WM-T8a: Charter Hill old corner: roof, facade, forecourt, door 8,44, prints, the planter gone; rule 10 cells bare (D2300, D2314)', () => {
    for (let y = 38; y <= 44; y++) for (let x = 2; x <= 14; x++)
      expect(CIV.grid[y][x], `cell ${x},${y}`).toBe(y <= 41 ? 'R' : y <= 43 ? 'H' : 'P');
    for (let y = 38; y <= 44; y++) for (const x of [1, 15]) expect(CIV.grid[y][x], `the corner's edges stay lawn ${x},${y}`).toBe('g');
    expect(CIV.roofs.museum).toEqual({ roof: 'roof_shingle_g', wall: 'wall_ashlar_w', door: 'door_double', win: ['win_arch'], trim: 'J', shape: 'gable', x0: 2, y0: 38, x1: 14, y1: 41 });
    const by = id => CIV.objs.find(o => o.id === id);
    expect(by('hc_museum')).toEqual({ kind: 'door', id: 'hc_museum', x: 8, y: 44, to: 'hc_museum_in', tx: 7, ty: 14, facing: 'up', need: 'story.hc_arrived', setFlag: 'story.wm_visited' });
    expect(by('hc2_plant_hc_civic_5')).toBeUndefined();                 // §5.2: the round planter at 15,41 goes
    expect(by('hc2_plant_hc_civic_3')).toMatchObject({ x: 10, y: 37 });   // the hedge planter stays behind the roof
    const at = (x, y) => CIV.objs.filter(o => o.x === x && o.y === y).map(o => [o.id, o.sprite || o.kind]);
    expect(at(8, 38)).toEqual([['hc2_finial_museum', 'hc_finial']]);
    expect(at(8, 42)).toEqual([['wm_lintel', 'wm_x_lintel']]);
    expect(at(4, 43)).toEqual([['wm_ban_k', 'wm_x_banner_keeper']]);
    expect(at(12, 43)).toEqual([['wm_ban_w', 'wm_x_banner_wing']]);
    const fore = { 2: 'stone_urn', 3: 'hc_lamp_box', 5: 'poster_stand', 6: 'sign', 11: 'bench_long', 13: 'hc_lamp_box', 14: 'stone_urn' };
    for (let x = 2; x <= 14; x++) expect(at(x, 44).map(o => o[1]), `forecourt ${x},44`).toEqual(fore[x] ? [fore[x]] : x === 8 ? ['door'] : []);
    expect(by('wm_sign').text).toBe('MUSTER ROAD MUSEUM. Open every day. Free.');
    for (let x = 8; x <= 18; x += 2) expect(at(x, 45)).toEqual([['wm_prints_' + x, 'wm_x_prints']]);
    // Rule 10 (D2314): the facade cells either side of the door hold nothing; no heal lantern or acorn board on the front;
    // the town map door mark is the plain one (TOWN_DOOR_ART names no museum door).
    expect(at(7, 43)).toEqual([]); expect(at(9, 43)).toEqual([]);
    expect(CIV.objs.filter(o => o.x >= 1 && o.x <= 15 && o.y >= 37 && o.y <= 46 && /heal_lantern|acorn_board|badge/.test(o.sprite || ''))).toEqual([]);
    const game = fs.readFileSync(path.join(ROOT, 'game.js'), 'utf8');
    const tda = game.slice(game.indexOf('const TOWN_DOOR_ART = {'), game.indexOf('};', game.indexOf('const TOWN_DOOR_ART = {')));
    expect(tda).not.toMatch(/museum/);
  });

  test('WM-T3: the room is §5.1 and §5.2 cell for cell, and every §5.3 target is reachable with every body and prop in place', () => {
    expect([ROOM.w, ROOM.h, ROOM.skin, ROOM.outdoor, ROOM.door]).toEqual([14, 16, 'hc_museum_in', 'hc_civic', 'hc_museum']);
    expect(ROOM.grid).toEqual(GRID);
    for (const [id, x, y, sprite] of PLACE) {
      const o = ROOM.objs.find(q => q.id === id);
      expect(o, id).toBeTruthy();
      expect([o.x, o.y], id).toEqual([x, y]);
      if (sprite) expect(o.sprite, id).toBe(sprite);
    }
    const mat = ROOM.objs.find(o => o.id === 'hc_museum_in_mat');
    expect(mat).toMatchObject({ kind: 'warp', x: 7, y: 15, to: 'hc_civic', tx: 8, ty: 45, facing: 'down' });
    // The game's BFS blocks every body, prop and sign at once (§8 test 3). The runner's line is a walk-on, so it blocks nothing.
    const blocked = new Set(ROOM.objs.filter(o => ['npc', 'prop', 'sign'].includes(o.kind)).map(o => o.x + ',' + o.y));
    const d = bfs(ROOM.grid, blocked, [7, 14]);
    for (const [k, [x, y, steps]] of Object.entries(REACH)) {
      expect(d.has(x + ',' + y), k + ' reachable').toBe(true);
      expect(d.get(x + ',' + y), k + ' steps').toBeLessThanOrEqual(steps + 2);
    }
    const floor = []; ROOM.grid.forEach((r, y) => [...r].forEach((c, x) => { if (',.:;~'.includes(c) && !blocked.has(x + ',' + y)) floor.push(x + ',' + y); }));
    expect(floor.filter(k => !d.has(k)), 'no unreachable floor').toEqual([]);
    // Every exhibit and person has a free neighbour to be tapped from.
    for (const [id, x, y] of TAPS) expect([[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].some(([a, b]) => d.has(a + ',' + b)), id + ' tap cell').toBe(true);
    // The Charter Hill walk: from the Square's north mouth (m_c1_s) along the south sidewalk to the doorstep, about 47 steps.
    const cb = new Set(CIV.objs.filter(o => ['npc', 'prop', 'sign'].includes(o.kind) && 'gPCZADsf'.includes(CIV.grid[o.y][o.x])).map(o => o.x + ',' + o.y));
    const W = new Set([...'gPCZADsf']), seen = new Map([['54,46', 0]]), q = [[54, 46]];
    while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = (x + dx) + ',' + (y + dy); if (seen.has(k) || !CIV.grid[y + dy] || !W.has(CIV.grid[y + dy][x + dx]) || cb.has(k)) continue;
      seen.set(k, seen.get(x + ',' + y) + 1); q.push([x + dx, y + dy]); } }
    expect(seen.get('8,44'), 'doorstep from m_c1_s').toBeLessThanOrEqual(50);
  });

  test('WM-T9: every line within its limit; no banned word, no INSIGN, no year, no call-up, chip, relay or bellgold (D2317, §3.3)', () => {
    const { says, labels, toasts, all } = texts();
    expect(all.length).toBeGreaterThan(80);
    expect(says.filter(t => t.length > 110)).toEqual([]);
    expect(labels.filter(t => t.length > 30)).toEqual([]);
    expect(toasts.filter(t => t.length > 40)).toEqual([]);
    expect(all.filter(t => /  |[‘’“”]/.test(t))).toEqual([]);
    const banned = new RegExp('\\b(' + ['fa' + 'int(ed)?', 'ev' + 'olv\\w*', 'co' + 'ins?', 'app' + 'eared', 'tr' + 'ainer', '\\w+' + 'dex'].join('|') + ')\\b|go, [a-z]+!', 'i');
    expect(all.filter(t => banned.test(t))).toEqual([]);
    expect(all.filter(t => /insign/i.test(t)), 'D2317: INSIGN stays out of the museum, Wing included').toEqual([]);
    expect(all.filter(t => /\b(1[5-9]|20)\d\d\b|\byears? ago\b|\bcall-?up\b|\bconscri|\bdraft(ed)?\b|\bchips?\b|\brelays?\b|bellgold|\btuning\b|solvane/i.test(t))).toEqual([]);
    // D2318: the empty case's card names the Warden of the Roll before the call and the Muster Hall after it, and nothing else.
    expect(HC.scenes.wm_k5.flat(3)).toContain('Kept by the Warden of the Roll. Not shown here.');
    expect(HC.scenes.wm_k5.flat(3)).toContain('On view in the Muster Hall.');
    // Held for D2332's rework: K6's optional third tap is not built.
    expect(all.filter(t => /inked back in/i.test(t))).toEqual([]);
    // Every museum flag is off the quest chain (hcCityCheck reads notStepFlags in the game).
    expect(HC.notStepFlags).toEqual(expect.arrayContaining(['story.wm_visited', 'story.wm_card', 'story.wm_trail', 'story.wm_trail_pick', 'story.wm_given', 'story.wm_plaque']));
  });
});

test.describe('WAR_MUSEUM in the game (§8 tests 1, 2, 4)', () => {
  test('WM-T1/T2: the doorstep, the door into 7,14 facing up, the mat back to 8,45 facing down; zero console errors, save unchanged', async ({ page }) => {
    test.setTimeout(90000);
    const before = await boot(page, {});
    await goto(page, 'hc_civic', 11, 45, 'left');
    const objs = await page.evaluate(() => PixelPets.mapObjs.filter(o => o.x >= 6 && o.x <= 10 && o.y >= 42 && o.y <= 44).map(o => o.id).sort());
    expect(objs).toEqual(['hc_museum', 'wm_lintel', 'wm_sign']);
    expect(await page.evaluate(() => PixelPets.hcCity().check)).toEqual([]);
    expect(await tapTile(page, 8, 44), 'door on screen').toBe(true);   // Modern: tap the door, the holder walks to the step and goes in
    await page.waitForFunction(() => PixelPets.mapInfo.id === 'hc_museum_in' && !PixelPets.fading, null, { timeout: 15000 });
    expect(await where(page)).toEqual({ map: 'hc_museum_in', x: 7, y: 14, facing: 'up' });
    expect((await flags(page))['story.wm_visited']).toBe(true);
    await expect(page.locator('body')).toContainText('Muster Road Museum');   // the place line names the room
    await page.evaluate(() => PixelPets.walkStep('down'));
    await page.waitForFunction(() => PixelPets.mapInfo.id === 'hc_civic' && !PixelPets.fading, null, { timeout: 15000 });
    expect(await where(page)).toEqual({ map: 'hc_civic', x: 8, y: 45, facing: 'down' });
    const after = JSON.parse(await page.evaluate(() => localStorage.getItem('pixelpets.save.v2')));
    expect(after.v).toBe(2);   // the city is live, so the save is written (no hold); the key and v are as before
    expect(after.world.map).toBe('hc_civic');
    expect(after.flags['story.wm_visited']).toBe(true);
    for (const k of Object.keys(JSON.parse(before))) expect(Object.keys(after), 'no save key is removed: ' + k).toContain(k);   // fields only ever added, by normalizeV2
  });

  test('WM-T4b: the runner\'s line plays once on the first walk up the seam (§5.2) @w1', async ({ page }) => {
    await boot(page, { 'story.wm_runner': null });
    await goto(page, 'hc_museum_in', 7, 8, 'up');
    await page.evaluate(() => PixelPets.walkStep('up'));
    await page.waitForFunction(() => !PixelPets.fading && !(PixelPets.walk && PixelPets.walk.to));
    await page.evaluate(() => PixelPets.walkStep('up'));
    await page.waitForFunction(() => !!PixelPets.scene, null, { timeout: 5000 });
    expect(says(await drive(page))).toEqual(['Walk the middle. Both sides are yours.']);
    expect((await flags(page))['story.wm_runner']).toBe(true);
    await goto(page, 'hc_museum_in', 6, 7, 'up');
    await page.evaluate(() => PixelPets.walkStep('up'));
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => !!PixelPets.scene)).toBe(false);
  });

  test('WM-T1b: before story.hc_arrived the door stays shut (D2305) @w1', async ({ page }) => {
    await boot(page, { 'story.hc_arrived': null });
    await goto(page, 'hc_civic', 8, 45, 'up');
    await page.evaluate(() => PixelPets.talkTo('hc_museum'));
    const lines = await drive(page);
    expect(says(lines)).toEqual(['The door is locked.']);
    expect((await where(page)).map).toBe('hc_civic');
  });

  test('WM-T4: every exhibit and person answers a Modern tap with its own words (§3.2, §7)', async ({ page }, info) => {
    test.setTimeout(240000);
    await boot(page, {});
    await goto(page, 'hc_museum_in', 7, 14, 'up');
    const fails = [];
    for (const [id, x, y, first] of TAPS) {
      await page.waitForFunction(() => !PixelPets.scene && !PixelPets.fading);
      // stand near the piece so it is on screen at every width (the walk from the arrival is WM-T3's BFS)
      const [nx, ny] = nearCell(x, y);
      await goto(page, 'hc_museum_in', nx, ny, 'up');
      if (!(await tapTile(page, x, y))) { fails.push(id + ': off screen'); continue; }
      await page.waitForFunction(() => !!PixelPets.scene, null, { timeout: 15000 }).catch(() => fails.push(id + ': no scene'));
      const lines = await drive(page, ['Leave', 'Not now']);
      const shown = says(lines).concat(lines.filter(l => l[0] === '>').map(l => l[3]));
      if (!shown.includes(first)) fails.push(id + ': ' + JSON.stringify(shown.slice(0, 2)));
    }
    expect(fails).toEqual([]);
  });
});

test.describe('WAR_MUSEUM act gates and the empty case (§3.2, §3.3, D2303, D2318)', () => {
  const lines = async (page, id) => says(await talk(page, id, ['Leave', 'Not now', 'Leave it empty']));
  test('WM-T5: Act 2 reads the Warden card; after story.hc_trial_called the card reads the Muster Hall; K2, K6, K7, K11 by their keys @w1', async ({ page }) => {
    test.setTimeout(120000);
    await boot(page, {});
    await goto(page, 'hc_museum_in', 7, 5, 'up');
    expect(await lines(page, 'wm_case_empty_0')).toEqual(['THE ROLL. First page.', 'Kept by the Warden of the Roll. Not shown here.', 'An empty case, dusted every day.']);
    expect(await lines(page, 'wm_tap_k2')).toEqual(['A Keeper notice, from the war.', 'WALK BESIDE THEM, NOT AHEAD. A lot of blank paper under it.']);
    expect(await lines(page, 'wm_mapcase_0')).toEqual(['The Duskwater Stone, carried to safety.', 'The road runs to the capital. Some towns on the map are inked over.']);
    expect(await lines(page, 'wm_cart_0')).toEqual(['Walklings served.', 'A lantern cart. The hook at the front is empty.']);
    expect(await lines(page, 'wm_drum')).toEqual(['The drum turns. Nothing falls out.']);
    expect(await lines(page, 'npc_elder')).toEqual(["I come for the letters. I don't read them. I just sit with them."]);
  });
  test('WM-T5b: the empty-case card flips on story.hc_trial_called; Picking Day after the parade; the cut; the curator has seen the page @w1', async ({ page }) => {
    test.setTimeout(120000);
    await boot(page, { 'story.act': 4, 'story.hc_parade_seen': true, 'story.wb_cut': true, 'story.hc_trial_called': true, 'story.wm_card': true });
    await goto(page, 'hc_museum_in', 7, 5, 'up');
    const k5 = await talk(page, 'wm_case_empty_1', ['Leave it empty']);
    expect(says(k5)).toEqual(['THE ROLL. First page.', 'On view in the Muster Hall.', 'An empty case, dusted every day.', "Ha. You'd make a good curator."]);
    expect(k5.find(l => l[0] === '>')[3]).toBe("That one's a trick. There's no stamp. You fill it yourself. What goes in it?");
    expect(await lines(page, 'wm_tap_k2')).toEqual(['A Keeper notice, from the war.', 'One line, and room for one more.']);
    expect(await lines(page, 'wm_mapcase_1')).toEqual(['The Duskwater Stone, carried to safety.', 'The road runs to the capital. Some towns on the map are inked over.',
      'It went where the roll was kept.']);
    expect(await lines(page, 'wm_cart_1')).toEqual(['Walklings served.', 'A lantern cart. The hook at the front is empty.', 'Hook, no strap.', 'They walked home in these.']);
    expect((await lines(page, 'wm_drum')).slice(0, 3)).toEqual(['The drum turns. Nothing falls out.', 'A card pinned on: PICKING DAY SUSPENDED. BY ORDER.', 'The one Walkling nobody could call.']);
    expect(await lines(page, 'npc_curator')).toEqual(["You've seen the page, then. Don't tell me what's on it. I like my case empty."]);
    expect(await lines(page, 'npc_elder')).toEqual(['They walked home. Some of us walked with them.']);
  });
  test('WM-T5c: a switcher hears the cooler curator and the docent\'s Associate line; the partner looks at the dark lantern @w1', async ({ page }) => {
    await boot(page, { 'story.switched_a3': true, 'story.wm_card': true }, { follower: true });
    await goto(page, 'hc_museum_in', 6, 2, 'up');
    expect(await lines(page, 'npc_curator')).toEqual(["Wine vest or green pin, the cases don't check. Mind the glass."]);
    expect(await lines(page, 'npc_docent')).toEqual(["Associate! You'll love the kiosk. Same slides as the lobby. Have a bright day!"]);
    const k1 = await lines(page, 'wm_tap_k1');
    expect(k1.slice(0, 3)).toEqual(['Lanterns of the war years, lent by the towns.', 'Dented, every one. One has never been lit.', 'Pipkit looks at the dark one.']);
  });
});

test.describe('WAR_MUSEUM the Stamp Trail (§2.1, D2307)', () => {
  test('WM-T6: the card by talk, five stamps in any order, the snag, the reward once, the Journal line; reduced motion @w1', async ({ page }) => {
    test.setTimeout(150000);
    await boot(page, {}, { reduce: true, money: 0 });
    await goto(page, 'hc_museum_in', 7, 14, 'up');
    // a stamp before the card stamps nothing
    expect(says(await talk(page, 'wm_scout_lamp'))).toEqual(["A Keeper Scout's lamp.", "Old Scouts didn't write much down. They said things twice."]);
    expect((await flags(page))['story.wm_trail']).toBeUndefined();
    expect(says(await talk(page, 'npc_curator'))).toEqual(['Welcome, colleague. Both halves are open, both are free. I wrote the cards on this side.',
      'Every visitor gets a card. Five cases, five stamps. Grown-ups are allowed.',
      "Stamp the card at the lantern wall, the map case, the Scout's lamp, the drum, and the empty case."]);
    expect((await flags(page))['story.wm_card']).toBe(true);
    expect(await page.evaluate(() => PixelPets.state.flags['story.wm_trail_done'])).toBeUndefined();
    // the snag first: the empty case asks what goes in it
    const snag = await talk(page, 'wm_case_empty_0', ['A name']);
    expect(snag.find(l => l[0] === '>')).toEqual(['>', 'A name', ['A lantern', 'A name', 'Leave it empty'], "That one's a trick. There's no stamp. You fill it yourself. What goes in it?"]);
    expect(says(snag).slice(-1)).toEqual(['Whose, I wonder.']);
    expect((await flags(page))['story.wm_trail_pick']).toBe('name');
    for (const id of ['wm_scout_lamp', 'wm_drum', 'wm_mapcase_1']) await talk(page, id);
    expect((await flags(page))['story.wm_trail']).toBe(4);
    await talk(page, 'wm_scout_lamp');   // a second tap on a stamped case stamps nothing
    expect((await flags(page))['story.wm_trail']).toBe(4);
    const last = says(await talk(page, 'wm_tap_k1'));
    expect(last.slice(-3)).toEqual(['Tester got an old oil lamp keepsake.', 'Tester got 50 Acorns!', 'Stamped the whole card at the Muster Road Museum.']);
    const f = await flags(page);
    expect([f['story.wm_trail'], f['story.wm_trail_done']]).toEqual([5, true]);
    expect(await page.evaluate(() => [PixelPets.state.money, PixelPets.state.bag.old_oil_lamp])).toEqual([50, 1]);
    expect((await page.evaluate(() => PixelPets.toasts)).filter(t => t === 'Card stamped.').length).toBe(5);
    // the reward never pays twice
    await talk(page, 'wm_drum'); await talk(page, 'wm_case_empty_0');
    expect(await page.evaluate(() => [PixelPets.state.money, PixelPets.state.bag.old_oil_lamp])).toEqual([50, 1]);
    expect(await page.evaluate(() => PixelPets.questCheck)).toEqual([]);
    expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
  });
  test('WM-T6b: the empty pick earns the curator\'s best-curator greeting (§7.1) @w1', async ({ page }) => {
    await boot(page, { 'story.wm_card': true, 'story.wm_trail': 5, 'story.wm_trail_done': true, 'story.wm_trail_pick': 'empty' });
    await goto(page, 'hc_museum_in', 8, 13, 'up');
    expect(says(await talk(page, 'npc_curator'))).toEqual(["My best curator's back. Touch nothing. Look at everything."]);
  });
});

test.describe('WAR_MUSEUM the donation lantern (§2.2, D2308)', () => {
  test('WM-T7: 10 and 50 from the purse, the name at 100, the plaque at 500, the plate on the drum; a short purse gives nothing @w1', async ({ page }) => {
    test.setTimeout(180000);
    await boot(page, { 'story.wm_card': true }, { money: 560 });
    await goto(page, 'hc_museum_in', 10, 14, 'right');
    let l = await talk(page, 'wm_donation', ['10 Acorns']);
    expect(l[0]).toEqual(['>', '10 Acorns', ['10 Acorns', '50 Acorns', 'Not now'], 'Gifts keep the lamps lit. Give?']);
    expect(await page.evaluate(() => [PixelPets.state.money, PixelPets.state.flags['story.wm_given']])).toEqual([550, 10]);
    // D2308 with the bank (#334): the gift is one ledger line through moneyDelta, memo "Museum gift"
    const gift = await page.evaluate(() => { const l = PixelPets.state.bank.led.filter(r => r[3] === 'museum_gift'); return l.map(r => [r[1], r[2], PPBank.memo(r)]); });
    expect(gift).toEqual([['scene', -10, 'Museum gift']]);
    expect(says(await talk(page, 'wm_friends'))).toEqual(['FRIENDS OF THE MUSEUM.']);
    await talk(page, 'wm_donation', ['50 Acorns']);
    expect((await page.evaluate(() => PixelPets.toasts)).includes('Your name is on the Friends board.')).toBe(false);
    await talk(page, 'wm_donation', ['50 Acorns']);
    expect(await page.evaluate(() => [PixelPets.state.money, PixelPets.state.flags['story.wm_given']])).toEqual([450, 110]);
    expect((await page.evaluate(() => PixelPets.toasts)).filter(t => t === 'Your name is on the Friends board.').length).toBe(1);
    expect(says(await talk(page, 'wm_friends'))).toEqual(['FRIENDS OF THE MUSEUM. Tester.']);
    for (let i = 0; i < 7; i++) await talk(page, 'wm_donation', ['50 Acorns']);
    expect(await page.evaluate(() => PixelPets.state.flags['story.wm_given'])).toBe(460);
    l = await talk(page, 'wm_donation', ['50 Acorns', 'The drum']);
    expect(l.find(l2 => l2[0] === '>' && l2[1] === 'The drum')).toEqual(['>', 'The drum', ['The lanterns', 'The drum', 'The letters'], '[PLACEHOLDER] A plaque, then. Which case gets your plate?']);
    expect(await page.evaluate(() => [PixelPets.state.money, PixelPets.state.flags['story.wm_given'], PixelPets.state.flags['story.wm_plaque']])).toEqual([50, 510, 'drum']);
    expect(says(await talk(page, 'wm_drum'))).toContain('A small plate: Lit by Tester.');
    expect(says(await talk(page, 'wm_donation', ['50 Acorns']))).toEqual([]);   // the plaque is chosen once
    expect(await page.evaluate(() => [PixelPets.state.money, PixelPets.state.flags['story.wm_given']])).toEqual([0, 560]);
    expect(says(await talk(page, 'wm_donation', ['10 Acorns']))).toEqual(['Not enough Acorns.']);
    expect(await page.evaluate(() => [PixelPets.state.money, PixelPets.state.flags['story.wm_given']])).toEqual([0, 560]);
    expect((await talk(page, 'wm_donation', ['Not now'])).length).toBe(1);
    expect(await page.evaluate(() => [PixelPets.state.money, PixelPets.state.v])).toEqual([0, 2]);
    // same-day gifts merge into one "Museum gift" line of -560 (D2234); the short purse and "Not now" wrote nothing
    expect(await page.evaluate(() => PixelPets.state.bank.led.filter(r => r[3] === 'museum_gift').map(r => [r[1], r[2], PPBank.memo(r)])))
      .toEqual([['scene', -560, 'Museum gift']]);
  });
});

test.describe('WAR_MUSEUM palette and looks (§6, §7, D2315; AGENTS rule 11)', () => {
  // West of the seam is x 1-6, plus x 7 below the face row: the lantern wall turns from old to new at the seam and its new half
  // (7,1, A-W2's wine caps) is the Wing's, as the packet's own palette check counts it (render_room.py: px >= 112 is the Wing side).
  test('WM-T10: a canvas scan of the room finds no mint anywhere and no wine, soot or crimson west of the seam', async ({ page }) => {
    test.setTimeout(90000);
    await boot(page, {});
    const PAL = await page.evaluate(() => ({ s: '#73eff7', V: '#960e16', N: '#18140f', Q: '#c81818' }));
    const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)).join(',');
    const bad = { s: hex(PAL.s), V: hex(PAL.V), N: hex(PAL.N), Q: hex(PAL.Q) };
    const tally = { mint: 0, westWine: 0, eastWine: 0 };
    for (const [x, y] of [[1, 8], [12, 8], [1, 3], [12, 3], [7, 14]]) {
      await goto(page, 'hc_museum_in', x, y, 'up');
      await page.waitForTimeout(250);
      const r = await page.evaluate(b => {
        const mc = document.querySelector('#mapCanvas'), g = mc.getContext('2d'), cam = PixelPets.walk.cam;
        const d = g.getImageData(0, 0, mc.width, mc.height).data, out = { mint: 0, westWine: 0, eastWine: 0 };
        for (let py = 0; py < mc.height; py++) for (let px = 0; px < mc.width; px++) {
          const rx = px + cam.x, ry = py + cam.y; if (rx < 0 || ry < 0 || rx >= 14 * 16 || ry >= 16 * 16) continue;
          const i = (py * mc.width + px) * 4, k = d[i] + ',' + d[i + 1] + ',' + d[i + 2];
          if (k === b.s) out.mint++;
          if (k === b.V || k === b.N || k === b.Q) { if (rx < 7 * 16 || (rx < 8 * 16 && ry >= 2 * 16)) out.westWine++; else out.eastWine++; }
        }
        return out;
      }, bad);
      for (const k of Object.keys(tally)) tally[k] += r[k];
    }
    expect(tally.mint).toBe(0);
    expect(tally.westWine).toBe(0);
    expect(tally.eastWine).toBeGreaterThan(0);   // the Wing does carry the company's wine
  });

  test('WM-T11: the curator, the docent and the bench regular pass look_lock: no locked mark, no lookalike, the docent in Glimmerwell\'s set', async ({ page }, info) => {
    test.skip(info.project.name !== '390', 'look data once, at 390');
    await boot(page, {});
    const keys = ['hc_curator', 'hc_docent', 'hc_bench_regular'];
    const looks = Object.fromEntries(keys.map(k => [k, HC.looks[k]]));
    const acc = l => l.accessory || 'none';
    const fails = [];
    const grids = await page.evaluate(ks => Object.fromEntries(ks.map(k => [k, PixelPets.lookGrid(k)])), keys.concat(LOCK.cast.flatMap(c => c.keys)));
    const sim = (a, b) => { let same = 0, tot = 0; for (let i = 0; i < a.length; i++) for (let j = 0; j < a[i].length; j++) { if (a[i][j] === '.' && b[i][j] === '.') continue; tot++; if (a[i][j] === b[i][j]) same++; } return tot ? same / tot : 0; };
    for (const c of LOCK.cast) for (const lk of c.keys) {
      const a = c.signature[lk]; if (!a) continue;
      for (const k of keys) {
        const b = looks[k];
        if (a.hair === b.hair && a.hairCol === b.hairCol && (a.outfitCol === b.outfitCol || (acc(a) !== 'none' && acc(a) === acc(b)))) fails.push(k + ' hair like ' + c.label);
        if (a.outfit === b.outfit && a.outfitCol === b.outfitCol && a.accent === b.accent && acc(a) === acc(b) && acc(a) !== 'none') fails.push(k + ' outfit like ' + c.label);
        for (const m of c.marks || []) if (Object.entries(m).every(([f, v]) => (f === 'accessory' ? acc(b) : b[f]) === v)) fails.push(k + ' wears ' + c.label + "'s mark");
        if (grids[lk] && grids[k] && sim(grids[lk], grids[k]) >= LOCK.rule.pixel_threshold) fails.push(k + ' pixels like ' + c.label);
      }
    }
    const P = LOCK.palette, g = P.sets.glimmer_dark, d = looks.hc_docent;
    expect(g.top.includes(d.outfitCol) && g.trim.includes(d.accent) && !g.never.includes(acc(d)), 'the docent is in the glimmer_dark set').toBe(true);
    for (const [k, name] of [['hc_curator', CUR], ['hc_bench_regular', REG]]) {
      const l = looks[k];
      for (const u of P.uniform_core) if (Object.entries(u.look).every(([f, v]) => l[f] === v)) fails.push(name + ' wears the ' + u.label);
      if (P.faction_only[acc(l)]) fails.push(name + ' wears a faction-only ' + acc(l));
      for (const side of Object.keys(P.titles)) if (P.titles[side].some(t => new RegExp('\\b' + t + '\\b').test(name))) fails.push(name + ' carries a ' + side + ' title');
    }
    expect(P.titles.glimmer.some(t => new RegExp('\\b' + t + '\\b').test(DOC))).toBe(true);
    expect(fails).toEqual([]);
  });
});
