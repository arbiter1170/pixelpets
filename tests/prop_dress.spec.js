/* PROP_DRESS (PROP_LIBRARY v0.1 §5 A, B, C and D; D2032-D2035, red, Vincent's yes on the previews, Wed Nov 4, 2026): the
   Hearthmoor home (hm_home_in), Fernbrook's south lane and plaza edge, the Kilnmouth bathhouse (km_bath_in) and the
   Brightgate HQ lobby (bg_hq_lobby), dressed with the prop library art through the overlay data/detail_zzzzzz_prop_dress.json.
   The lobby also gives its own planters, front desk and sofa cells the library art in place (replaceObjs: same id, cell and
   name; none of them is tappable). Checks: both maps load and every piece draws; no piece on a warp, door,
   trigger, sign, NPC, mat or path, nor on the step inside a door; every tap keeps an open side and no walkable cell is cut
   off; the critical paths walk with real steps; nothing new is tappable; reduced motion; old saves (one standing where a
   piece now stands) load and walk off; the save stays pixelpets.save.v2, v 2, with no new field. Runs at 320, 375 and 390. */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

const OVERLAY = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'detail_zzzzzz_prop_dress.json'), 'utf8'));
const ADD = {};
for (const [id, pt] of Object.entries(OVERLAY.slicePatch.maps)) ADD[id] = pt.addObjs;
const MAPS = Object.keys(ADD);
// where each map's checks start (the mat or arrival side)
const START = { hm_home_in: [4, 6], fernbrook: [18, 25], km_bath_in: [7, 12], bg_hq_lobby: [7, 14] };
// D2034: the lobby's own non-tappable pieces, re-drawn with the library art on the same cell (Brightgate's data is the before)
const RESKIN = OVERLAY.slicePatch.maps.bg_hq_lobby.replaceObjs;
const BG_LOBBY = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'detail_zzzzz_brightgate.json'), 'utf8')).maps.bg_hq_lobby.objs;
const OURS = /^dress_(hm|fb|km|bg)_/;

trackErrors(test, expect);

function save(world, flags) {
  const s = starterSave();
  s.settings.follower = false;
  s.settings.controls = 'modern';
  s.settings.textSpeed = 'fast';
  s.flags['story.early_done'] = true;
  Object.assign(s.flags, flags || {});
  if (world) s.world = Object.assign({ facing: 'down', respawn: 'hearthmoor' }, world);
  return s;
}

async function boot(page, s, opts = {}) {
  if (opts.reduce) await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), s || save(), { quietDay: true });
  await page.addInitScript(() => {
    const arm = () => {
      if (!window.PixelPets || typeof PixelPets.clearWild !== 'function') { setTimeout(arm, 20); return; }
      setInterval(() => PixelPets.clearWild(), 15);
    };
    arm();
  });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && PixelPets.state && PixelPets.state.party[0]);
  await page.evaluate(() => { PixelPets.showTab('walk'); PixelPets.clearWild(); });
}

const where = page => page.evaluate(() => ({ map: PixelPets.state.world.map, x: PixelPets.state.world.x, y: PixelPets.state.world.y }));
async function jump(page, map, x, y, facing) {
  await page.evaluate(a => { PixelPets.goto(a.map, a.x, a.y, a.facing || 'down'); PixelPets.clearWild(); }, { map, x, y, facing });
  await expect.poll(() => page.evaluate(() => !PixelPets.fading && !PixelPets.scene)).toBe(true);
}

// Real one-tile steps along the game's own path (findPath honours every blocker), as tests/weir_hut.spec.js does.
async function walkTo(page, x, y) {
  const r = await page.evaluate(({ x, y }) => {
    PixelPets.clearWild();
    const p = PixelPets.findPath([{ x, y }]);
    if (!p) return { error: 'no path to ' + x + ',' + y };
    const tiles = [];
    for (const step of p) {
      const w = PixelPets.state.world;
      const dir = step.x > w.x ? 'right' : step.x < w.x ? 'left' : step.y > w.y ? 'down' : step.y < w.y ? 'up' : null;
      if (!dir) continue;
      PixelPets.clearWild();
      const s = PixelPets.walkStep(dir);
      tiles.push(s.x + ',' + s.y);
      if (!s.ok || s.scene || s.battle) return { error: 'stopped at ' + tiles.length, s };
    }
    const w = PixelPets.state.world;
    return { tiles, at: [w.x, w.y] };
  }, { x, y });
  expect(r.error || '', JSON.stringify(r)).toBe('');
  expect(r.at).toEqual([x, y]);
  return r.tiles;
}

// In-page: the map as composed (every overlay and patch applied), with and without the dress pieces.
function mapFacts(mapId) {
  const m = WORLD[mapId], objs = m.objs || [], W = m.w || m.grid[0].length, H = m.h || m.grid.length;
  const ours = o => /^dress_(hm|fb|km|bg)_/.test(o.id);
  const BLOCK = { prop: 1, npc: 1, sign: 1, trainer: 1 };
  const tile = [];
  for (let y = 0; y < H; y++) { tile.push([]); for (let x = 0; x < W; x++) { const t = PixelPets.tileInfo(x, y); tile[y].push({ ch: t.ch, name: t.tile, walk: !!t.walk }); } }
  const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const blockSet = withOurs => new Set(objs.filter(o => BLOCK[o.kind] && !o.walkable && (withOurs || !ours(o))).map(o => o.x + ',' + o.y));
  const N4 = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  const reach = block => {
    const free = (x, y) => inb(x, y) && tile[y][x].walk && !block.has(x + ',' + y);
    const seen = new Set(), q = [];
    const seed = (x, y) => { const k = x + ',' + y; if (!seen.has(k) && free(x, y)) { seen.add(k); q.push([x, y]); } };
    for (const s of [m.safe, m.start, m.respawn]) if (s) seed(s.x, s.y);
    for (const o of objs) if (o.kind === 'warp' || o.kind === 'door') { seed(o.x, o.y); seed(o.x, o.y + 1); }
    while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of N4) seed(x + dx, y + dy); }
    return { seen, free };
  };
  const before = reach(blockSet(false)), after = reach(blockSet(true));
  // every interactable that is not ours: the open sides a tap can stand on, before and after
  const taps = [];
  for (const o of objs) {
    if (ours(o)) continue;
    const talky = o.kind === 'npc' || o.kind === 'sign' || o.kind === 'trainer' || o.kind === 'door' || o.kind === 'warp' || (o.kind === 'prop' && (o.lines || o.scene || o.shop || o.run));
    if (!talky) continue;
    const cells = (o.kind === 'warp') ? [[o.x, o.y]] : (o.kind === 'door' ? [[o.x, o.y + 1], [o.x, o.y]] : N4.map(([dx, dy]) => [o.x + dx, o.y + dy]));
    const open = r => cells.filter(([x, y]) => r.seen.has(x + ',' + y)).length;
    taps.push({ id: o.id, kind: o.kind, x: o.x, y: o.y, before: open(before), after: open(after) });
  }
  const mine = objs.filter(ours).map(o => ({ id: o.id, kind: o.kind, x: o.x, y: o.y, sprite: o.sprite, lines: !!o.lines, tile: tile[o.y][o.x] }));
  const others = objs.filter(o => !ours(o)).map(o => ({ id: o.id, kind: o.kind, x: o.x, y: o.y, r: o.r || 0, when: !!o.when, sprite: o.sprite || null }));
  const lost = [...before.seen].filter(k => !after.seen.has(k) && !blockSet(true).has(k));
  return { W, H, mine, others, taps, lost, beforeN: before.seen.size, afterN: after.seen.size };
}

test('the home, Fernbrook, the bathhouse and the lobby load with every dress piece placed and drawn', async ({ page }) => {
  await boot(page);
  for (const map of MAPS) {
    const [x, y] = START[map];
    await jump(page, map, x, y, 'up');
    const r = await page.evaluate(() => ({ id: PixelPets.mapInfo.id, objs: PixelPets.mapObjs, v: PixelPets.state.v }));
    expect(r.id).toBe(map);
    const shown = r.objs.filter(o => OURS.test(o.id));
    expect(shown.map(o => [o.id, o.kind, o.x, o.y, o.sprite]).sort()).toEqual(ADD[map].map(o => [o.id, o.kind, o.x, o.y, o.sprite]).sort());
    for (const o of shown) expect(o.art, o.id + ' (' + o.sprite + ') has art').toBe(true);
    expect(r.v).toBe(2);
  }
  // the counts the previews were approved on: 7 pieces in the home, 15 pieces and 14 decals in Fernbrook (38 cells)
  expect(ADD.hm_home_in.length).toBe(7);
  expect(ADD.fernbrook.filter(o => o.kind === 'prop').length).toBe(24);
  expect(ADD.fernbrook.filter(o => o.kind === 'decal').length).toBe(14);
  // D2033: 15 pieces in the bathhouse (16 prop cells: the two benches are 2 wide) and the bath mat rug (2 decal cells)
  expect(ADD.km_bath_in.filter(o => o.kind === 'prop').length).toBe(16);
  expect(ADD.km_bath_in.filter(o => o.kind === 'decal').length).toBe(2);
  // D2034: 14 new lobby pieces, and 16 of the lobby's own cells re-drawn in place
  expect(ADD.bg_hq_lobby.length).toBe(14);
  expect(RESKIN.length).toBe(16);
});

test('D2034: the lobby keeps every one of its own pieces; the re-drawn ones keep id, cell and name, and none is tappable', async ({ page }) => {
  await boot(page);
  await jump(page, 'bg_hq_lobby', 7, 14, 'up');
  const r = await page.evaluate(() => ({ objs: WORLD.bg_hq_lobby.objs.map(o => ({ id: o.id, kind: o.kind, x: o.x, y: o.y, sprite: o.sprite || null, name: o.name || null, talk: !!(o.lines || o.scene || o.shop || o.run || o.text) })),
    shown: PixelPets.mapObjs.map(o => ({ id: o.id, sprite: o.sprite, art: o.art })) }));
  // every object Brightgate built is still there, on its cell; only the 16 re-drawn ones changed, and only their art
  const now = new Map(r.objs.map(o => [o.id, o]));
  const re = new Map(RESKIN.map(o => [o.id, o]));
  for (const o of BG_LOBBY) {
    const n = now.get(o.id);
    expect(n, o.id).toBeTruthy();
    expect([n.kind, n.x, n.y, n.name], o.id).toEqual([o.kind, o.x, o.y, o.name || null]);
    expect(n.sprite, o.id).toBe(re.has(o.id) ? re.get(o.id).sprite : (o.sprite || null));
  }
  for (const o of RESKIN) {
    const b = BG_LOBBY.find(x => x.id === o.id);
    expect(Object.keys(o).sort(), o.id + ': a whole copy of the built object').toEqual(Object.keys(b).sort());
    expect(now.get(o.id).talk, o.id + ' is not tappable').toBe(false);
    expect(/^(pg_|pa_)/.test(o.sprite), o.id + ' uses the Glimmerwell (or wall) set').toBe(true);
    const sh = r.shown.find(x => x.id === o.id);
    expect(sh && sh.art, o.id + ' draws').toBe(true);
  }
  // the tappable pieces keep their own art: the lanyard racks (the empty hook is the holder's), the INSIGN plaque, the gate
  for (const id of ['bg_lobby_k_1_5', 'bg_lobby_k_1_6', 'bg_insign_plaque', 'bg_lanyard_gate_7', 'bg_lanyard_gate_8'])
    expect([id, now.get(id).sprite, now.get(id).talk]).toEqual([id, BG_LOBBY.find(o => o.id === id).sprite, true]);
  expect(RESKIN.some(o => /k_1_|insign|gate|lift/.test(o.id))).toBe(false);
});

test('no piece on a warp, door, trigger, sign, NPC, mat or path; every tap keeps its open side; nothing is cut off', async ({ page }) => {
  await boot(page);
  for (const map of MAPS) {
    await jump(page, map, START[map][0], START[map][1], 'up');
    const r = await page.evaluate(mapFacts, map);
    const key = new Map();
    for (const o of r.others) {
      if (o.kind === 'trigger') { for (let dy = -o.r; dy <= o.r; dy++) for (let dx = -o.r; dx <= o.r; dx++) if (Math.abs(dx) + Math.abs(dy) <= o.r) key.set((o.x + dx) + ',' + (o.y + dy), o.kind + ' ' + o.id); }
      else key.set(o.x + ',' + o.y, (key.get(o.x + ',' + o.y) ? key.get(o.x + ',' + o.y) + ' + ' : '') + o.kind + ' ' + o.id);
    }
    const steps = new Set();
    for (const o of r.others) if (o.kind === 'warp' || o.kind === 'door') for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) steps.add((o.x + dx) + ',' + (o.y + dy));
    const clash = [];
    for (const o of r.mine) {
      const k = o.x + ',' + o.y;
      if (key.has(k)) clash.push(o.id + ' on ' + key.get(k));
      if (o.kind !== 'prop') continue;
      if (o.tile.walk && steps.has(k)) clash.push(o.id + ' on the step by a door or warp at ' + k);
      if (/mat|path|pav|road|plaza|step/i.test(o.tile.name || '') || o.tile.ch === 'p' || o.tile.ch === 'P' || o.tile.ch === 'm') clash.push(o.id + ' on ' + o.tile.ch + '/' + o.tile.name + ' at ' + k);
      expect(o.lines, o.id + ' has no lines (not tappable)').toBe(false);
    }
    expect(clash, map).toEqual([]);
    // rule 10: the Lantern House and General Store markers keep clear ground round them (no piece within 2 tiles)
    const markers = r.others.filter(o => /^(heal_lantern|acorn_board)/.test(o.sprite || ''));
    for (const mk of markers) expect(r.mine.filter(o => Math.max(Math.abs(o.x - mk.x), Math.abs(o.y - mk.y)) <= 2).map(o => o.id), mk.id).toEqual([]);
    if (map === 'fernbrook') expect(markers.map(o => o.id)).toContain('fb_lantern_sign');
    // every interactable reachable before the dressing is reachable after, from as many sides or fewer but never none
    const lostTap = r.taps.filter(t => t.before > 0 && t.after === 0).map(t => t.kind + ' ' + t.id + ' ' + t.x + ',' + t.y);
    expect(lostTap, map).toEqual([]);
    // no walkable cell is cut off (only the cells the pieces stand on leave the walkable set)
    expect(r.lost, map).toEqual([]);
    const blocking = r.mine.filter(o => o.kind === 'prop' && o.tile.walk).length;
    expect(r.afterN, map).toBe(r.beforeN - blocking);
  }
});

test('the bookshelf keeps its reach cell: the reading chair stands at (7,4), not (7,3) (preview note)', async ({ page }) => {
  await boot(page);
  await jump(page, 'hm_home_in', 4, 6, 'up');
  const r = await page.evaluate(mapFacts, 'hm_home_in');
  expect(r.mine.find(o => o.id === 'dress_hm_armchair')).toMatchObject({ x: 7, y: 4, sprite: 'ph_armchair' });
  for (const id of ['home_bookshelf', 'home_table', 'home_terminal', 'home_glowbox', 'home_pegs', 'home_plant', 'mom', 'maze'])
    expect(r.taps.find(t => t.id === id).after, id).toBeGreaterThan(0);
});

test('D2033: the poolside bucket stands at (12,5), not (13,5), so the east walk to the notches and the mural stays open', async ({ page }) => {
  await boot(page);
  await jump(page, 'km_bath_in', 7, 12, 'up');
  const r = await page.evaluate(mapFacts, 'km_bath_in');
  const buckets = r.mine.filter(o => o.sprite === 'pw_bath_bucket').map(o => [o.x, o.y]).sort();
  expect(buckets).toEqual([[1, 5], [12, 10], [12, 5]].sort());
  // #318 put km_notches on the basin's end (13,2) and the mural's tap on the face (14,1): both are tapped from (14,2) only,
  // and (14,2) is reached by the one-wide walk down x 14 from (14,5). At (13,5) the bucket and the bench (14,6) sealed (14,5).
  expect(r.others.filter(o => ['km_notches', 'km_mural_wall', 'km_bath_bench_14'].includes(o.id)).map(o => [o.id, o.x, o.y]).sort())
    .toEqual([['km_bath_bench_14', 14, 6], ['km_mural_wall', 14, 1], ['km_notches', 13, 2]]);
  for (const id of ['km_notches', 'km_mural_wall']) expect(r.taps.find(t => t.id === id), id).toMatchObject({ before: 1, after: 1 });
  for (const k of ['13,5', '13,6', '14,5', '14,4', '14,3', '14,2']) expect(r.mine.some(o => o.x + ',' + o.y === k), k + ' stays free').toBe(false);
  // the one tap that gives up a side is the first bench (1,6): the preview's bucket takes (1,5); it keeps (2,6) and (1,7)
  expect(r.taps.filter(t => t.after < t.before).map(t => [t.id, t.before, t.after])).toEqual([['km_bath_bench_1', 3, 2]]);
  // the walk with real steps: from the mat side to the east end, then up x 14 to the tap cell under the mural and beside
  // the notches (tests/kilnmouth.spec.js K-T taps both from there and reads their lines)
  await walkTo(page, 14, 5);
  await walkTo(page, 14, 2);
});

test('D2034: the lobby keeps its scene tiles, the walk to the gate, the desk and the lifts clear', async ({ page }) => {
  await boot(page);
  await jump(page, 'bg_hq_lobby', 7, 14, 'up');
  const r = await page.evaluate(mapFacts, 'bg_hq_lobby');
  const at = new Set(r.mine.map(o => o.x + ',' + o.y).concat(RESKIN.map(o => o.x + ',' + o.y)));
  // BRIGHTGATE_LAYOUT §5.3 and ACT3_SWITCH §3.2: the clip-on tile 2,5, Rook's scene tile 3,5, Juniper's 2,6; 5,9 (the Act 5
  // lobby tile); 5,6 (no body or piece where rook_bg was, D1491 dropped; brightgate BG10); 11,8 (the desk's talk side)
  for (const k of ['2,5', '3,5', '2,6', '5,9', '5,6', '11,8', '12,5', '13,6', '11,5', '10,6']) expect(at.has(k), k + ' stays free').toBe(false);
  // the door-to-gate line, columns 7 and 8 from the mat to the gate front, stays two wide
  for (let y = 5; y <= 14; y++) for (const x of [7, 8]) expect(at.has(x + ',' + y), x + ',' + y + ' on the door-to-gate line').toBe(false);
  // wall pieces hang on the built face (row 0), never on the lift doors' row 1; the lifts and their steps stay free
  const wall = r.mine.filter(o => !o.tile.walk);
  expect(wall.map(o => [o.y, o.tile.ch])).toEqual(wall.map(() => [0, 'W']));
  for (const k of ['3,1', '12,1', '2,1', '4,1', '3,2', '11,1', '13,1', '12,2']) expect(at.has(k), k + ' by a lift').toBe(false);
  // the face reads dressed: banners and a clock at 5, 8 and 10, the lift doors under 3 and 12; no bare run over 2 (S2: 3 or less)
  const dressed = new Set(wall.map(o => o.x).concat([3, 12]));
  let run = 0, longest = 0;
  for (let x = 1; x <= 14; x++) { run = dressed.has(x) ? 0 : run + 1; longest = Math.max(longest, run); }
  expect(longest).toBeLessThanOrEqual(2);
  // S1 for a big public room: 1 piece per 7 walkable tiles or better
  const walkable = (await page.evaluate(() => { let n = 0; const m = WORLD.bg_hq_lobby; for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (PixelPets.tileInfo(x, y).walk) n++; return n; }));
  const pieces = new Set(r.mine.concat(r.others.filter(o => o.kind === 'prop' || o.kind === 'sign')).map(o => (o.sprite && /_\d$/.test(o.sprite) && /^p[a-z]_/.test(o.sprite) ? o.sprite.replace(/_\d$/, '') + '@' + o.y : o.id)));
  expect(pieces.size / walkable).toBeGreaterThanOrEqual(1 / 7);
});

test('D2034: a holder who has switched walks through the gate to the west lift; one with an open offer meets Juniper from her side', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page, save(null, { 'story.act': 3, 'story.side': 'glimmer', 'story.switched_a3': true }));
  await jump(page, 'bg_hq_lobby', 7, 14, 'up');
  for (const [x, y] of [[11, 5], [10, 6], [2, 5], [2, 6], [2, 8], [5, 9], [13, 6], [14, 13], [7, 5], [7, 3], [3, 2]]) await walkTo(page, x, y);
  await page.evaluate(() => PixelPets.walkStep('up'));
  await expect.poll(() => where(page).then(p => p.map), { timeout: 8000 }).toBe('bg_review_in');
  // an open offer: Juniper stands at 12,6; she keeps (12,5) and (13,6), and the walk from her desk to the clip tile 2,6 is open
  await page.evaluate(() => { PixelPets.setFlag('story.switched_a3', false); PixelPets.setFlag('story.a3_offer', true); });
  await jump(page, 'bg_hq_lobby', 7, 14, 'up');
  expect(await page.evaluate(() => PixelPets.mapObjs.some(o => o.id === 'bg_juniper_desk'))).toBe(true);
  await walkTo(page, 13, 6);
  await walkTo(page, 12, 5);
  const clip = await page.evaluate(() => {
    const blocked = new Set(PixelPets.mapObjs.filter(o => ['prop', 'npc', 'sign', 'trainer'].includes(o.kind) && !o.walkable && o.id !== 'bg_juniper_desk').map(o => o.x + ',' + o.y));
    const seen = new Set(['12,6']), q = [[12, 6]];
    while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = x + dx, b = y + dy, k = a + ',' + b;
      if (!seen.has(k) && PixelPets.tileInfo(a, b).walk && !blocked.has(k)) { seen.add(k); q.push([a, b]); } } }
    return ['2,6', '2,5', '3,5'].filter(k => !seen.has(k));
  });
  expect(clip).toEqual([]);
});

test('nothing new is tappable and no tap on any dressed map loses its reach (tap audit) @w1', async ({ page }) => {
  await boot(page);
  const audit = await page.evaluate(() => PixelPets.auditTaps());
  expect(audit.rows.filter(r => OURS.test(r.id))).toEqual([]);
  // only the two older Fernbrook gaps PROP_LIBRARY §2.3 logged (fb_rubble on fb_east, the east-road gate; fb_crate_a on fb_tour2)
  expect(audit.reachGaps.filter(g => /dress_|hm_home_in|fernbrook\b|home_|fbh_|km_bath|bg_hq_lobby|bg_lobby|bg_lift|bg_insign|bg_lanyard|bg_juniper|bg_receptionist/.test(JSON.stringify(g))).sort()).toEqual([
    'fernbrook:fb_east walk-on tile is solid or blocked',
    'fernbrook:fb_tour2 walk-on tile is solid or blocked',
  ]);
  // Re-pinned for D2033 and D2034 (tap_interact's counts do not move: no dress piece talks). Each tap in the two rooms with
  // the cells it can be tapped from, from the same audit on the tree before this build. Only km_bath_bench_1 changes, 3 -> 2:
  // the preview's poolside bucket takes (1,5); the bench keeps (2,6) and (1,7).
  const stands = Object.fromEntries(audit.rows.filter(r => r.map === 'km_bath_in' || r.map === 'bg_hq_lobby').map(r => [r.id, [r.act, r.stands, r.reached]]));
  expect(stands).toEqual({
    km_bath_mat: ['warp', 1, 1], km_mural_wall: ['talk', 1, 1], km_notches: ['talk', 1, 1], km_orla: ['talk', 2, 2],
    km_ticket_seat: ['talk', 2, 2], km_bath_kid_a: ['talk', 4, 4], km_bath_kid_b: ['talk', 4, 4], km_bath_bench_1: ['talk', 2, 2],
    bg_hq_lobby_mat: ['warp', 1, 1], bg_lift_w: ['warp', 1, 1], bg_lift_e: ['sign', 3, 3], bg_lanyard_gate_7: ['talk', 2, 2],
    bg_lanyard_gate_8: ['talk', 2, 2], bg_lobby_k_1_5: ['talk', 1, 1], bg_lobby_k_1_6: ['talk', 2, 2], bg_insign_plaque: ['talk', 3, 3],
    bg_receptionist: ['talk', 2, 2], bg_juniper_desk: ['talk', 2, 2], bg_lobby_guard: ['talk', 4, 4],
  });
});

test('the critical paths walk with real steps: the home mat, stairs and taps; the south lane, the stitcher door and the plaza edge', async ({ page }) => {
  test.setTimeout(90000);
  await boot(page);
  // Your Home: in from the mat, to Mom's side, the bookshelf, the table, the pegs, then the stairs (a warp to the hall)
  await jump(page, 'hm_home_in', 4, 6, 'up');
  for (const [x, y] of [[5, 5], [7, 3], [6, 5], [2, 2], [3, 3], [1, 4]]) await walkTo(page, x, y);
  await page.evaluate(() => PixelPets.walkStep('down'));
  await expect.poll(() => where(page).then(p => p.map), { timeout: 8000 }).toBe('hm_home_hall');
  // Fernbrook: the south lane to the stitcher's door step and in; back out to the lane, the plaza edge, the pond benches, the stall side
  await jump(page, 'fernbrook', 18, 25, 'up');
  await walkTo(page, 24, 24);
  await page.evaluate(() => PixelPets.walkStep('up'));
  await expect.poll(() => where(page).then(p => p.map), { timeout: 8000 }).toBe('fbh_stitch_in');
  await jump(page, 'fernbrook', 18, 25, 'up');
  for (const [x, y] of [[18, 19], [18, 18], [20, 18], [17, 25], [20, 29], [19, 28], [26, 28], [27, 28], [29, 24], [28, 23], [19, 23], [13, 29], [12, 24]]) await walkTo(page, x, y);
  // the grass the preview's spots would have shut off stays open: behind the stitcher's roof (row 20, down x 28), behind
  // the cart (via 21,24) and under the wood bench (15,29); then back to the lane
  for (const [x, y] of [[28, 20], [24, 20], [28, 23], [21, 22], [20, 20], [15, 29], [18, 25]]) await walkTo(page, x, y);
});

test('the critical paths walk with real steps: the bathhouse mat, the warm corner, the rest group, the east walk; the lobby desk, rack, plaque and mat', async ({ page }) => {
  test.setTimeout(90000);
  // reduced motion holds the bath kids and the lobby staff on their home tiles, so a step never waits on a walker
  await boot(page, null, { reduce: true });
  // Kilnmouth bathhouse: Orla and the ticket seat, the first bench, the warm corner, the bath mat rug, the rest group and the
  // jug and fern, then the east walk to the notches and the mural; back to the mat and out to Kilnmouth
  await jump(page, 'km_bath_in', 7, 12, 'up');
  for (const [x, y] of [[3, 12], [5, 11], [6, 12], [2, 6], [1, 7], [1, 9], [2, 9], [3, 10], [8, 10], [10, 10], [11, 10], [12, 11], [13, 11], [14, 12], [14, 7], [13, 5], [14, 5], [14, 2], [7, 12]]) await walkTo(page, x, y);
  await page.evaluate(() => PixelPets.walkStep('down'));
  await expect.poll(() => where(page).then(p => p.map), { timeout: 8000 }).toBe('kilnmouth');
  // Brightgate HQ lobby (gate shut: a holder with no switch): the receptionist's sides, the rack's one side (the clip-on
  // tile), Juniper's tile, the plaque, the Act 5 tile, the coffee groups, the gate front; back to the mat and out
  await jump(page, 'bg_hq_lobby', 7, 14, 'up');
  for (const [x, y] of [[11, 5], [10, 6], [2, 5], [2, 6], [2, 8], [1, 9], [5, 9], [2, 11], [5, 11], [13, 11], [10, 11], [12, 12], [13, 13], [6, 13], [9, 13], [14, 7], [13, 6], [7, 5], [7, 14]]) await walkTo(page, x, y);
  expect(await page.evaluate(() => !!PixelPets.findPath([{ x: 3, y: 1 }])), 'the gate is still the only way to the lifts').toBe(false);
  await page.evaluate(() => PixelPets.walkStep('down'));
  await expect.poll(() => where(page).then(p => p.map), { timeout: 8000 }).toBe('bg_campus');
});

test('save stays v2 in the bathhouse and the lobby; old saves on a cell a piece now takes load on the safe tile and walk out', async ({ page, browser }) => {
  test.setTimeout(120000);
  await boot(page, save({ map: 'km_bath_in', x: 7, y: 12 }));
  const read = () => page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  await walkTo(page, 7, 11);
  await expect.poll(() => read().then(s => s.world.map + ',' + s.world.x + ',' + s.world.y)).toBe('km_bath_in,7,11');
  await jump(page, 'bg_hq_lobby', 7, 14, 'up');
  await walkTo(page, 7, 13);
  await expect.poll(() => read().then(s => s.world.map + ',' + s.world.y)).toBe('bg_hq_lobby,13');
  const s0 = await read();
  await jump(page, 'km_bath_in', 7, 12, 'up');
  await walkTo(page, 13, 5);
  await expect.poll(() => read().then(s => s.world.map + ',' + s.world.x + ',' + s.world.y)).toBe('km_bath_in,13,5');
  await jump(page, 'bg_hq_lobby', 7, 14, 'up');
  await walkTo(page, 2, 5);
  await expect.poll(() => read().then(s => s.world.map + ',' + s.world.x + ',' + s.world.y)).toBe('bg_hq_lobby,2,5');
  const s1 = await read();
  expect(s1.v).toBe(2);
  expect(Object.keys(s1).sort()).toEqual(Object.keys(s0).sort());
  expect(Object.keys(s1.flags).filter(k => !(k in s0.flags) && !/^(daily|seen|map|visit|contact)/.test(k))).toEqual([]);
  expect(JSON.stringify(s1)).not.toMatch(/dress_(km|bg)_/);
  // Saves made before this build, standing where a piece now stands: the moved bucket, a bench, the stove corner; the lobby's
  // west kiosk, the planter by the desk, a display case and the cooler behind the gate. Each loads on the map's safe tile
  // (safeSpot) and walks out through the mat.
  const cases = [
    { map: 'km_bath_in', x: 12, y: 5, out: 'kilnmouth' }, { map: 'km_bath_in', x: 11, y: 9, out: 'kilnmouth' }, { map: 'km_bath_in', x: 3, y: 9, out: 'kilnmouth' },
    { map: 'bg_hq_lobby', x: 5, y: 7, out: 'bg_campus' }, { map: 'bg_hq_lobby', x: 9, y: 7, out: 'bg_campus' },
    { map: 'bg_hq_lobby', x: 10, y: 13, out: 'bg_campus' }, { map: 'bg_hq_lobby', x: 1, y: 1, out: 'bg_campus' },
  ];
  for (const c of cases) {
    const ctx2 = await browser.newContext({ viewport: page.viewportSize(), reducedMotion: 'no-preference' });
    const p2 = await ctx2.newPage();
    const errs = [];
    p2.on('pageerror', e => errs.push(e.message));
    p2.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await boot(p2, save({ map: c.map, x: c.x, y: c.y }));
    const at = await where(p2);
    const sf = await p2.evaluate(m => { const w = WORLD[m]; const s = w.safe || w.start; return [s.x, s.y]; }, c.map);
    expect([at.map, at.x, at.y], JSON.stringify(c)).toEqual([c.map].concat(sf));
    await p2.evaluate(() => PixelPets.walkStep('down'));
    await expect.poll(() => where(p2).then(p => p.map), { timeout: 8000 }).toBe(c.out);
    expect(await p2.evaluate(() => PixelPets.state.v)).toBe(2);
    expect(errs).toEqual([]);
    await ctx2.close();
  }
});

test('reduced motion: every dressed map draws with every piece, no console error', async ({ page }) => {
  await boot(page, null, { reduce: true });
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  for (const [map, x, y] of [['hm_home_in', 4, 6], ['fernbrook', 25, 24], ['km_bath_in', 7, 12], ['bg_hq_lobby', 7, 14]]) {
    await jump(page, map, x, y, 'up');
    await page.waitForTimeout(400);
    const objs = await page.evaluate(() => PixelPets.mapObjs.filter(o => /^dress_(hm|fb|km|bg)_/.test(o.id)));
    expect(objs.length).toBe(ADD[map].length);
    expect(objs.every(o => o.art)).toBe(true);
  }
});

test('save stays v2: a visit writes no new field; old saves on a piece load on the safe tile, and old saves in the opened grass walk out', async ({ page, browser }) => {
  test.setTimeout(120000);
  await boot(page, save({ map: 'fernbrook', x: 18, y: 25 }));
  const read = () => page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  // a step on each map first, so every field a step or a room visit writes is already there
  await walkTo(page, 18, 24);
  await expect.poll(() => read().then(s => s.world.map + ',' + s.world.x + ',' + s.world.y)).toBe('fernbrook,18,24');
  await jump(page, 'hm_home_in', 4, 6, 'up');
  await walkTo(page, 4, 5);
  await expect.poll(() => read().then(s => s.world.map + ',' + s.world.y)).toBe('hm_home_in,5');
  const s0 = await read();
  await walkTo(page, 7, 3);
  await jump(page, 'fernbrook', 18, 25, 'up');
  await walkTo(page, 28, 20);
  await expect.poll(() => read().then(s => s.world.map + ',' + s.world.x + ',' + s.world.y)).toBe('fernbrook,28,20');
  const s1 = await read();
  expect(s1.v).toBe(2);
  expect(Object.keys(s1).sort()).toEqual(Object.keys(s0).sort());
  expect(Object.keys(s1.flags).filter(k => !(k in s0.flags) && !/^(daily|seen|map|visit|contact)/.test(k))).toEqual([]);
  expect(JSON.stringify(s1)).not.toMatch(/dress_(hm|fb)_/);

  // Saves made before this build. On a cell a piece now takes (the chair, the stall, the wood bench): safeSpot loads them on
  // the map's safe tile. In the grass the preview's spots would have shut off (row 20 behind the roof, behind the cart,
  // under the bench): they load where they were and walk back to the lane.
  const cases = [
    { world: { map: 'hm_home_in', x: 7, y: 4 }, safe: true },
    { world: { map: 'fernbrook', x: 29, y: 22 }, safe: true },
    { world: { map: 'fernbrook', x: 15, y: 28 }, safe: true },
    { world: { map: 'fernbrook', x: 26, y: 20 }, to: [18, 25] },
    { world: { map: 'fernbrook', x: 30, y: 20 }, safe: true },          // the sacks' corner
    { world: { map: 'fernbrook', x: 21, y: 22 }, to: [18, 25] },
    { world: { map: 'fernbrook', x: 15, y: 29 }, to: [18, 25] },
  ];
  for (const c of cases) {
    const ctx2 = await browser.newContext({ viewport: page.viewportSize(), reducedMotion: 'no-preference' });
    const p2 = await ctx2.newPage();
    const errs = [];
    p2.on('pageerror', e => errs.push(e.message));
    p2.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await boot(p2, save(c.world));
    const at = await where(p2);
    expect(at.map).toBe(c.world.map);
    if (c.safe) {
      const sf = await p2.evaluate(m => { const w = WORLD[m]; const s = w.safe || w.start; return [s.x, s.y]; }, c.world.map);
      expect([at.x, at.y], JSON.stringify(c.world)).toEqual(sf);
    } else {
      expect([at.x, at.y]).toEqual([c.world.x, c.world.y]);
      await walkTo(p2, c.to[0], c.to[1]);
    }
    expect(await p2.evaluate(() => PixelPets.state.v)).toBe(2);
    expect(errs).toEqual([]);
    await ctx2.close();
  }
});
