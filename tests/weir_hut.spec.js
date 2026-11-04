/* WEIR_HUT v0.1.1 (D1590-D1599): the weir hut at Hushwater's Old Weir. A 4x2 hut on hw_cut's south bank (x 22-25, y 11-12),
   door step (23,13), towpath and porch props; the room hw_weir_hut_in (10x12, skin weir_hut); the jar counter on
   story.chi_jars; the Act 1 access patch (Wickerglen > Falls > Cut at story.warden_met, Rim shut, two holders and the high
   wilds wait for story.cobble_end); the door barred until story.warden_met | story.cobble_end; the first-step trigger is a
   stub until the chi_meet scene exists. Runs at 320, 375 and 390; reduced motion; save stays pixelpets.save.v2 with v 2. */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { starterSave, installSave, trackErrors, gotoGame, shot } = require('./helpers');

const OVERLAY = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'detail_zz_weir_hut.json'), 'utf8'));
const ROOM = 'hw_weir_hut_in';
const ROOM_OBJS = OVERLAY.maps[ROOM].objs;
const CUT = OVERLAY.slicePatch.maps.hw_cut;
const DENY = CUT.addObjs.find(o => o.id === 'hw_weir_hut').deny;
const lineOf = id => {
  const o = ROOM_OBJS.concat(CUT.addObjs).find(x => x.id === id);
  return o.lines.else;
};

trackErrors(test, expect);

function save(flags, world) {
  const s = starterSave();
  s.settings.follower = false;
  s.settings.controls = 'modern';
  s.settings.textSpeed = 'fast';
  s.steps = 40;
  Object.assign(s.flags, { 'story.early_done': true, 'story.phone_got': true, 'story.reached_glen': true, 'story.hw_reached': true }, flags || {});
  if (world) s.world = Object.assign({ facing: 'down', respawn: 'hearthmoor' }, world);
  return s;
}

async function boot(page, s, opts = {}) {
  if (opts.reduce) await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), s || save({ 'story.warden_met': true }), { quietDay: true });
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

const where = page => page.evaluate(() => ({ map: PixelPets.state.world.map, x: PixelPets.state.world.x, y: PixelPets.state.world.y, facing: PixelPets.state.world.facing }));
const settle = page => expect.poll(() => page.evaluate(() => !PixelPets.fading && !PixelPets.scene && !PixelPets.walk.path), { timeout: 15000 }).toBe(true);
async function jump(page, map, x, y, facing) {
  await page.evaluate(a => { PixelPets.goto(a.map, a.x, a.y, a.facing || 'down'); PixelPets.clearWild(); }, { map, x, y, facing });
  await expect.poll(() => page.evaluate(() => !PixelPets.fading)).toBe(true);
}

// A real tap on the map canvas over tile (x, y), the way a finger lands (pointerdown + pointerup at its CSS point).
async function tapTile(page, x, y) {
  // the camera eases after a jump; tap once it has stopped, so the finger lands where the tile is drawn
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
    return { cx, cy, onCanvas: cx >= b.left && cx <= b.right && cy >= b.top && cy <= b.bottom, vw: innerWidth, vh: innerHeight };
  }, { x, y });
  expect(r.onCanvas && r.cx >= 0 && r.cx <= r.vw && r.cy >= 0 && r.cy <= r.vh, 'tile ' + x + ',' + y + ' on screen').toBe(true);
}

// One-step walk along a debug path (no timers), as tests/hushwater.spec.js does.
async function walkTo(page, x, y) {
  const r = await page.evaluate(({ x, y }) => {
    PixelPets.clearWild();
    const p = PixelPets.findPath([{ x, y }]);
    if (!p) return { error: 'no path' };
    const tiles = [];
    for (const step of p) {
      const w = PixelPets.state.world;
      const dir = step.x > w.x ? 'right' : step.x < w.x ? 'left' : step.y > w.y ? 'down' : step.y < w.y ? 'up' : null;
      if (!dir) continue;
      PixelPets.clearWild();
      const s = PixelPets.walkStep(dir);
      tiles.push(s.x + ',' + s.y);
      if (!s.ok || s.scene || s.battle) return { error: 'stopped', s };
    }
    return { tiles };
  }, { x, y });
  expect(r.error || '', JSON.stringify(r)).toBe('');
  return r.tiles;
}

test('the room loads whole at every width, wears the weir_hut skin, and every prop draws', async ({ page }) => {
  await boot(page);
  await jump(page, ROOM, 4, 10, 'up');
  const r = await page.evaluate((room) => {
    const info = PixelPets.mapInfo, m = WORLD[room];
    const roles = ['c', 'C', 'L', 'f', 'F', 'T', 'B', 'S', 'R', 'G', 'W', 'D'];
    const rowOf = sk => roles.map(k => (sk.wall || {})[k] || '').join('');
    const mine = rowOf(SKINS.weir_hut);
    const mc = document.querySelector('#mapCanvas'), b = mc.getBoundingClientRect(), cam = PixelPets.walk.cam;
    const corner = (x, y) => ({ x: b.left + ((x * 16 - cam.x) / mc.width) * b.width, y: b.top + ((y * 16 - cam.y) / mc.height) * b.height });
    const tl = corner(0, 0), br = corner(info.w, info.h);
    const tiles = {}, kit = [];
    for (let y = 0; y < info.h; y++) for (let x = 0; x < info.w; x++) {
      const t = PixelPets.tileInfo(x, y);
      if (t.part) kit.push(t.tile); else tiles[t.ch + ':' + t.tile] = (tiles[t.ch + ':' + t.tile] || 0) + 1;
    }
    return {
      id: info.id, w: info.w, h: info.h, room: info.room, scale: info.scale, name: m.name, kind: m.kind, outdoor: m.outdoor, skin: m.skin,
      mine, others: Object.entries(SKINS).filter(([id, s]) => id !== 'weir_hut' && s.wall && rowOf(s) === mine).map(([id]) => id),
      tl, br, vw: innerWidth, vh: innerHeight, canvas: { l: b.left, t: b.top, r: b.right, b: b.bottom },
      tiles, kitOk: kit.length > 0 && kit.every(n => n.startsWith('weir_hut__')),
      objs: PixelPets.mapObjs.map(o => ({ id: o.id, kind: o.kind, sprite: o.sprite, art: o.art })),
      mapDev: PixelPets.mapCheck(), v: PixelPets.state.v,
      hud: document.body.textContent.includes('Weir Hut'),
    };
  }, ROOM);
  expect(r.id).toBe(ROOM);
  expect([r.w, r.h]).toEqual([10, 12]);
  expect(r.room).toBe(true);
  expect(Number.isInteger(r.scale)).toBe(true);
  expect(r).toMatchObject({ name: 'Weir Hut', kind: 'interior', outdoor: 'hw_cut', skin: 'weir_hut' });
  expect(r.hud, 'HUD place name').toBe(true);
  expect(r.mine).toBe('ICFKmFFFFcsB');
  expect(r.others).toEqual([]);
  // the whole room is on screen (D1591, INTERIOR_SCALE §9)
  expect(r.tl.x).toBeGreaterThanOrEqual(Math.max(0, r.canvas.l) - 1);
  expect(r.tl.y).toBeGreaterThanOrEqual(Math.max(0, r.canvas.t) - 1);
  expect(r.br.x).toBeLessThanOrEqual(Math.min(r.vw, r.canvas.r) + 1);
  expect(r.br.y).toBeLessThanOrEqual(Math.min(r.vh, r.canvas.b) + 1);
  // floors, rug, mat, trough and planks from the skin; walls from the weir_hut wall kit
  expect(r.kitOk).toBe(true);
  const kinds = Object.keys(r.tiles);
  expect(kinds).toEqual(expect.arrayContaining(['.:weir_flag', '=:rug_sacking', 'm:mat_sacking', 'w:weir_trough', 'B:weir_plank']));
  expect(kinds.some(k => k === '.:weir_flag_b' || k === '.:weir_flag_c')).toBe(true);
  expect(r.tiles['w:weir_trough']).toBe(6);
  expect(r.tiles['B:weir_plank']).toBe(2);
  const props = r.objs.filter(o => o.kind === 'prop');
  expect(props.length).toBe(16);   // 14 props plus one jar shelf per sill tile
  expect(props.filter(o => !o.art).map(o => o.id)).toEqual([]);
  expect(r.objs.some(o => o.id === 'chi_hut' && o.kind === 'npc')).toBe(true);
  expect(r.mapDev).toEqual([]);
  expect(r.v).toBe(2);
  await shot(page, 'weir-hut-room');
});

test('walkability: every walkable cell joins up, the planks are the only way in, and the trough blocks', async ({ page }) => {
  await boot(page);
  await jump(page, ROOM, 4, 10, 'up');
  const r = await page.evaluate(() => {
    const info = PixelPets.mapInfo, block = new Set(info.objs.filter(o => o.block).map(o => o.x + ',' + o.y));
    const free = (x, y) => x >= 0 && y >= 0 && x < info.w && y < info.h && PixelPets.tileInfo(x, y).walk && !block.has(x + ',' + y);
    const bfs = (sx, sy, skip) => {
      const seen = new Set([sx + ',' + sy]), q = [[sx, sy]];
      while (q.length) {
        const [x, y] = q.shift();
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
          if (seen.has(k) || !free(nx, ny) || (skip && skip.has(k))) continue;
          seen.add(k); q.push([nx, ny]);
        }
      }
      return seen;
    };
    const all = bfs(4, 10);
    let walkable = 0;
    for (let y = 0; y < info.h; y++) for (let x = 0; x < info.w; x++) if (free(x, y)) walkable++;
    const noPlanks = bfs(4, 10, new Set(['4,8', '5,8']));
    const stuck = PixelPets.mapObjs.filter(o => o.kind !== 'warp' && o.kind !== 'trigger')
      .filter(o => ![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => all.has((o.x + dx) + ',' + (o.y + dy)))).map(o => o.id);
    const trough = [1, 2, 3, 6, 7, 8].map(x => PixelPets.tileInfo(x, 8).walk);
    return { reach: all.size, walkable, mat: all.has('4,11'), back: all.has('4,3'), cutOff: !noPlanks.has('4,7'), stuck, trough };
  });
  expect(r.walkable).toBe(51);
  expect(r.reach).toBe(51);
  expect(r.mat).toBe(true);
  expect(r.back).toBe(true);
  expect(r.cutOff).toBe(true);
  expect(r.trough).toEqual([false, false, false, false, false, false]);
  // weir_desk_l (3,2) is boxed in by Vincent Chi at (3,3); its twin weir_desk_r (4,2) carries the same line (next test)
  expect(r.stuck).toEqual(['weir_desk_l']);
});

test('door and mat: from the Falls landing the holder walks the towpath into the hut, and the mat walks back out', async ({ page }) => {
  test.setTimeout(90000);
  await boot(page, save({ 'story.warden_met': true }, { map: 'hw_cut', x: 1, y: 5 }));
  expect(await where(page)).toMatchObject({ map: 'hw_cut', x: 1, y: 5 });
  await walkTo(page, 23, 13);
  expect(await where(page)).toMatchObject({ map: 'hw_cut', x: 23, y: 13 });
  // the towpath (D1597): from the weir's last board (21,10) down the bank to the step
  await jump(page, 'hw_cut', 21, 10, 'down');
  expect(await walkTo(page, 23, 13)).toEqual(['21,11', '21,12', '21,13', '22,13', '23,13']);
  await page.evaluate(() => PixelPets.walkStep('up'));
  await expect.poll(() => where(page), { timeout: 8000 }).toEqual({ map: ROOM, x: 4, y: 10, facing: 'up' });
  await settle(page);
  // mat (D1598): one step down onto (4,11) lands on the door step facing down
  await page.evaluate(() => PixelPets.walkStep('down'));
  await expect.poll(() => where(page), { timeout: 8000 }).toEqual({ map: 'hw_cut', x: 23, y: 13, facing: 'down' });
  await settle(page);
  // a tap on the door art (the wall cell above the step), from the weir's last board, walks over and enters
  await jump(page, 'hw_cut', 21, 10, 'down');
  await tapTile(page, 23, 12);
  await expect.poll(() => where(page), { timeout: 15000 }).toEqual({ map: ROOM, x: 4, y: 10, facing: 'up' });
  await settle(page);
  // and a tap on the mat walks back out
  await tapTile(page, 4, 11);
  await expect.poll(() => where(page), { timeout: 15000 }).toEqual({ map: 'hw_cut', x: 23, y: 13, facing: 'down' });
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});

test('every prop answers its line by tap (the desk from beside Vincent Chi), and the cot does not rest the party', async ({ page }) => {
  test.setTimeout(150000);
  await boot(page, null, { reduce: true });
  const before = await page.evaluate(() => ({ respawn: PixelPets.state.world.respawn }));
  await jump(page, ROOM, 4, 7, 'up');
  const props = await page.evaluate(() => PixelPets.mapObjs.filter(o => o.kind === 'prop' || o.kind === 'npc').map(o => ({ id: o.id, x: o.x, y: o.y })));
  const seen = [];
  for (const p of props) {
    if (p.id === 'weir_desk_l') continue;   // boxed in by Vincent Chi; weir_desk_r answers for the desk
    await jump(page, ROOM, 4, p.y >= 9 ? 10 : 7, 'up');
    await settle(page);
    await tapTile(page, p.x, p.y);
    await expect.poll(() => page.evaluate(() => (PixelPets.scene && PixelPets.scene.full && PixelPets.scene.text) || ''), { timeout: 15000, message: p.id }).not.toBe('');
    const got = await page.evaluate(() => ({ text: PixelPets.scene.text, who: PixelPets.scene.who, at: { x: PixelPets.state.world.x, y: PixelPets.state.world.y } }));
    const want = p.id === 'chi_hut' ? lineOf('chi_hut') : (ROOM_OBJS.find(o => o.id === p.id).lines.else);
    expect(got.text, p.id).toBe(want);
    expect(got.text.length, p.id).toBeLessThanOrEqual(110);
    expect(got.text, p.id).not.toMatch(/[{}]/);
    if (p.id === 'chi_hut') expect(String(got.who)).toContain('Vincent Chi');
    if (p.id === 'weir_desk_r') expect(got.at).toEqual({ x: 4, y: 3 });
    seen.push(p.id);
    await page.evaluate(() => PixelPets.endScene());
    await settle(page);
  }
  expect(seen.length).toBe(16);   // 13 room props (desk_l skipped), two jar shelves, Vincent Chi
  expect(lineOf('weir_desk_l')).toBe(lineOf('weir_desk_r'));
  // D1596: the cot is a line, not a rest. No scene follows and the respawn does not move here.
  const after = await page.evaluate(() => ({ respawn: PixelPets.state.world.respawn, scene: PixelPets.scene }));
  expect(after.scene).toBeNull();
  expect(after.respawn).toEqual(before.respawn);

  // exterior: the porch props and the weir's south stones
  const from = { hw_hut_lamp: [22, 13], hw_hut_barrel: [27, 13], hw_hut_nets: [27, 11], hw_weir_s: [21, 11] };
  for (const [id, [fx, fy]] of Object.entries(from)) {
    await jump(page, 'hw_cut', fx, fy, 'down');
    const o = await page.evaluate(id => PixelPets.mapObjs.find(x => x.id === id), id);
    expect(o, id).toBeTruthy();
    if (id !== 'hw_weir_s') expect(o.art, id).toBe(true);
    await tapTile(page, o.x, o.y);
    await expect.poll(() => page.evaluate(() => (PixelPets.scene && PixelPets.scene.full && PixelPets.scene.text) || ''), { timeout: 15000, message: id }).not.toBe('');
    const text = await page.evaluate(() => PixelPets.scene.text);
    expect(text, id).toBe(id === 'hw_weir_s' ? OVERLAY.objPatch.hw_weir_s.linesFirst.else : lineOf(id));
    await page.evaluate(() => PixelPets.endScene());
    await settle(page);
  }
});

test('the jar counter shows story.chi_jars 0-6: one jar shelf per sill tile, that many jars filled', async ({ page }) => {
  await boot(page);
  const rows = [];
  for (const n of [null, 0, 1, 2, 3, 4, 5, 6]) {
    const r = await page.evaluate((n) => {
      PixelPets.setFlag('story.chi_jars', n);
      PixelPets.goto('hw_weir_hut_in', 4, 7, 'up');
      const jars = PixelPets.mapObjs.filter(o => o.id.startsWith('weir_jars_'));
      return {
        n, a: jars.filter(o => o.x === 5 && o.y === 2).map(o => o.sprite), b: jars.filter(o => o.x === 6 && o.y === 2).map(o => o.sprite),
        art: jars.every(o => o.art), filled: jars.reduce((s, o) => s + Number(o.sprite.slice(-1)), 0),
      };
    }, n);
    rows.push(r);
  }
  for (const r of rows) {
    expect(r.a.length, 'sill a at ' + r.n).toBe(1);
    expect(r.b.length, 'sill b at ' + r.n).toBe(1);
    expect(r.art).toBe(true);
    expect(r.filled, 'jars at ' + r.n).toBe(r.n || 0);
  }
  expect(rows.find(r => r.n === 4)).toMatchObject({ a: ['weir_jars_3'], b: ['weir_jars_1'] });
});

test('access (D1594, D1595): the walk opens at story.warden_met, the Rim and the two holders wait, and the door is barred until either flag', async ({ page }) => {
  test.setTimeout(90000);
  await boot(page, save({}));
  const ids = async (map, x, y) => { await jump(page, map, x, y); return page.evaluate(() => PixelPets.mapObjs.map(o => o.id)); };
  const rimWarps = await page.evaluate(() => WORLD.hw_rim.objs.filter(o => o.kind === 'warp').map(o => o.id));
  expect(rimWarps.length).toBeGreaterThan(0);

  // neither flag: the log is back, the walk is shut, the door is barred
  let glen = await ids('route2_glen', 22, 4);
  expect(glen).toContain('glen_east_log');
  expect(glen).not.toContain('glen_east');
  let falls = await ids('hw_falls', 2, 10);
  expect(falls).not.toContain('hw_falls_west');
  expect(falls).not.toContain('hw_falls_east');
  let cut = await ids('hw_cut', 23, 13);
  expect(cut).not.toContain('hw_cut_west');
  await page.evaluate(() => { PixelPets.state.world.facing = 'up'; PixelPets.walkStep('up'); });
  await expect.poll(() => page.evaluate(() => (PixelPets.scene && PixelPets.scene.full && PixelPets.scene.text) || '')).toBe(DENY);
  await page.evaluate(() => PixelPets.endScene());
  expect((await where(page)).map).toBe('hw_cut');

  // story.warden_met alone: Wickerglen > Falls > Cut open, the Rim and the quarry shut, Ottilie and Nils away
  await page.evaluate(() => PixelPets.setFlag('story.warden_met', true));
  glen = await ids('route2_glen', 22, 4);
  expect(glen).toContain('glen_east');
  expect(glen).not.toContain('glen_east_log');
  falls = await ids('hw_falls', 2, 10);
  expect(falls).toEqual(expect.arrayContaining(['hw_falls_west', 'hw_falls_east']));
  expect(falls).not.toContain('hw_owlwatch');
  cut = await ids('hw_cut', 23, 13);
  expect(cut).toContain('hw_cut_west');
  expect(cut).not.toContain('hw_cut_east');
  expect(cut).not.toContain('hw_angler');
  const rim = await ids('hw_rim', 21, 12);
  for (const id of rimWarps) expect(rim, id).not.toContain(id);
  await jump(page, 'hw_cut', 23, 13, 'up');
  await page.evaluate(() => PixelPets.walkStep('up'));
  await expect.poll(() => where(page), { timeout: 8000 }).toMatchObject({ map: ROOM, x: 4, y: 10 });
  await settle(page);
  // the first step (4,9) is a stub until the chi_meet scene exists (D1598): no scene, the walk goes on, nothing is written
  const flags0 = await page.evaluate(() => Object.keys(PixelPets.state.flags).sort());
  const step = await page.evaluate(() => PixelPets.walkStep('up'));
  expect(step).toMatchObject({ ok: true, x: 4, y: 9, scene: false });
  expect(await page.evaluate(() => PixelPets.debugCatalog().scenes.includes('chi_meet'))).toBe(false);
  expect(await page.evaluate(() => PixelPets.mapObjs.some(o => o.id === 'chi_hut_first'))).toBe(true);
  expect(await page.evaluate(() => Object.keys(PixelPets.state.flags).sort())).toEqual(flags0);

  // story.cobble_end alone (main today: after Hall 2): everything open as built, the holders back, the door opens
  await page.evaluate(() => { PixelPets.setFlag('story.warden_met', null); PixelPets.setFlag('story.cobble_end', true); });
  glen = await ids('route2_glen', 22, 4);
  expect(glen).toContain('glen_east');
  cut = await ids('hw_cut', 23, 13);
  expect(cut).toEqual(expect.arrayContaining(['hw_cut_west', 'hw_cut_east', 'hw_angler']));
  falls = await ids('hw_falls', 2, 10);
  expect(falls).toContain('hw_owlwatch');
  await jump(page, 'hw_cut', 23, 13, 'up');
  await page.evaluate(() => PixelPets.walkStep('up'));
  await expect.poll(() => where(page), { timeout: 8000 }).toMatchObject({ map: ROOM, x: 4, y: 10 });
  expect(await page.evaluate(() => PixelPets.mapObjs.some(o => o.id === 'chi_hut'))).toBe(false);   // whether he is in is the meeting build's call
});

test('the hut stands on hw_cut as previewed: roof, wall, towpath, porch, the trimmed zone, and no reachable tile lost', async ({ page }) => {
  await boot(page, save({ 'story.warden_met': true }));
  await jump(page, 'hw_cut', 1, 5);
  const r = await page.evaluate(() => {
    const info = PixelPets.mapInfo, m = WORLD.hw_cut, base = MAPDATA.detail_hushwater.maps.hw_cut;
    const rows = []; for (let y = 0; y < info.h; y++) { let s = ''; for (let x = 0; x < info.w; x++) s += PixelPets.tileInfo(x, y).ch; rows.push(s); }
    const TD = Object.assign({}, MAPDATA.maps_slice.tiles, MAPDATA.interiors.tiles);
    const added = new Set(['hw_hut_lamp', 'hw_hut_barrel', 'hw_hut_nets', 'hw_weir_hut']);
    const solidKinds = { prop: 1, npc: 1, trainer: 1, sign: 1 };
    const objs = PixelPets.mapObjs;
    const blk1 = new Set(objs.filter(o => solidKinds[o.kind]).map(o => o.x + ',' + o.y));
    const blk0 = new Set(objs.filter(o => solidKinds[o.kind] && !added.has(o.id)).map(o => o.x + ',' + o.y));
    const bfs = (walk) => {
      const seen = new Set(['1,5']), q = [[1, 5]];
      while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (nx < 0 || ny < 0 || nx >= info.w || ny >= info.h || seen.has(k) || !walk(nx, ny)) continue; seen.add(k); q.push([nx, ny]); } }
      return seen;
    };
    const before = bfs((x, y) => !!(TD[base.grid[y][x]] || {}).walk && !blk0.has(x + ',' + y));
    const after = bfs((x, y) => PixelPets.tileInfo(x, y).walk && !blk1.has(x + ',' + y));
    const hut = new Set(); for (let x = 22; x <= 25; x++) for (const y of [11, 12]) hut.add(x + ',' + y);
    const lost = [...before].filter(k => !after.has(k) && !hut.has(k) && !blk1.has(k));
    const v = PixelPets.exteriors('hw_cut'), b = v.buildings.find(x => x.name === 'weir_hut');
    return {
      rows: rows.slice(10, 14), base10: base.grid[10], lost, door: after.has('23,13'), rim: after.has('38,12'),
      roof: JSON.parse(JSON.stringify(m.roofs.weir_hut)), building: b && { doors: b.doors.map(d => d.id), roof: b.roof, wall: b.wall, door: b.door, win: b.win, trim: b.trim, porch: b.porch.map(id => { const o = v.props.find(p => p.id === id); return o ? (o.art ? 'ok' : 'no art') : 'missing'; }) },
      zones: m.zones, nets: objs.find(o => o.id === 'hw_hut_nets'),
    };
  });
  expect(r.rows[0]).toBe(r.base10);   // row 10, the sand bank, is unchanged (the nets are an object, not a tile)
  expect(r.rows.slice(1)).toEqual([
    'KgggttttggggggttttgggpRRRRttggggggggggKK',
    'KgTtttttgggfggtttttggpHHHHtttTggggggpppp',
    'KggtttttgggggggttttggpppggtttttggggggggK',
  ]);
  expect(r.lost).toEqual([]);
  expect(r.door).toBe(true);
  expect(r.rim).toBe(true);
  expect(r.roof).toMatchObject({ x0: 22, y0: 11, x1: 25, y1: 11, roof: 'roof_turf', wall: 'wall_rock', door: 'door_barn', win: 'win_slit', trim: 'F', shape: 'gable' });
  expect(r.building).toMatchObject({ doors: ['hw_weir_hut'], porch: ['ok', 'ok'] });
  expect(r.zones.length).toBe(5);
  expect(r.zones[4]).toEqual({ x: 26, y: 11, w: 8, h: 3 });
  expect(r.nets).toMatchObject({ x: 28, y: 10, art: true });
  await jump(page, 'hw_cut', 23, 13, 'down');
  await shot(page, 'weir-hut-exterior');
});

test('wild band (D1594 a): the Falls and the Cut roll Lv 13-16 until story.cobble_end, then Lv 19-23 as built @w1', async ({ page }) => {
  await boot(page, save({ 'story.warden_met': true }));
  const roll = () => page.evaluate(() => {
    const out = {};
    for (const key of ['hw_falls', 'hw_cut', 'hw_rim']) {
      const lv = [];
      for (let i = 0; i < 60; i++) { const sp = PixelPets.pickSpecies([], key); lv.push(PixelPets.wildLv(sp, 0, key), PixelPets.wildLv(sp, 1, key)); }
      out[key] = [Math.min(...lv), Math.max(...lv)];
    }
    return out;
  });
  const early = await roll();
  for (const key of ['hw_falls', 'hw_cut']) {
    expect(early[key][0], key).toBeGreaterThanOrEqual(13);
    expect(early[key][1], key).toBeLessThanOrEqual(16);
  }
  expect(early.hw_rim[0]).toBeGreaterThanOrEqual(19);   // the Rim is shut and keeps its own table
  await page.evaluate(() => PixelPets.setFlag('story.cobble_end', true));
  const late = await roll();
  for (const key of ['hw_falls', 'hw_cut', 'hw_rim']) {
    expect(late[key][0], key).toBeGreaterThanOrEqual(19);
    expect(late[key][1], key).toBeLessThanOrEqual(23);
  }
});

test('reduced motion holds the lamp shelf and the trough on frame 0; without it they loop', async ({ page, browser }) => {
  test.setTimeout(60000);
  const sample = (p) => p.evaluate(async () => {
    const mc = document.querySelector('#mapCanvas'), g = mc.getContext('2d');
    const hashes = { lamp: new Set(), trough: new Set() };
    const cell = (x, y) => { const cam = PixelPets.walk.cam; const d = g.getImageData(x * 16 - cam.x, y * 16 - cam.y, 16, 16).data; let h = 0; for (let i = 0; i < d.length; i++) h = (h * 31 + d[i]) | 0; return h; };
    for (let i = 0; i < 12; i++) {
      await new Promise(r => setTimeout(r, 130));
      hashes.lamp.add(cell(8, 2)); hashes.trough.add(cell(2, 8));
    }
    return { lamp: hashes.lamp.size, trough: hashes.trough.size };
  });
  await boot(page, null, { reduce: true });
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  await jump(page, ROOM, 4, 10, 'up');
  await settle(page);
  expect(await sample(page)).toEqual({ lamp: 1, trough: 1 });

  const ctx2 = await browser.newContext({ viewport: page.viewportSize(), reducedMotion: 'no-preference' });
  const p2 = await ctx2.newPage();
  const errs = []; p2.on('pageerror', e => errs.push(e.message)); p2.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await boot(p2);
  await jump(p2, ROOM, 4, 10, 'up');
  const moving = await sample(p2);
  expect(moving.lamp).toBeGreaterThan(1);
  expect(moving.trough).toBeGreaterThan(1);
  expect(errs).toEqual([]);
  await ctx2.close();
});

test('save stays v2: a visit writes no new field, an old save loads, and saves inside the hut or past cobble_end load where they were', async ({ page, context }) => {
  test.setTimeout(60000);
  await boot(page, save({ 'story.warden_met': true }, { map: 'hw_cut', x: 23, y: 14 }));
  const read = () => page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  const raw = await page.evaluate(() => localStorage.getItem('pixelpets.save.v2'));
  // an existing room and a step first, so every field a room visit or a step writes is already there
  await jump(page, 'hm_lantern_in', 5, 9, 'down');
  await jump(page, 'hw_cut', 24, 14, 'up');
  await page.evaluate(() => PixelPets.walkStep('left'));
  await expect.poll(() => page.evaluate(r => localStorage.getItem('pixelpets.save.v2') !== r, raw)).toBe(true);
  await expect.poll(() => read().then(s => s.world.map + ',' + s.world.x + ',' + s.world.y)).toBe('hw_cut,23,14');
  const s0 = await read();
  await page.evaluate(() => PixelPets.walkStep('up'));
  await page.evaluate(() => PixelPets.walkStep('up'));
  await expect.poll(() => where(page).then(p => p.map), { timeout: 8000 }).toBe(ROOM);
  await settle(page);
  await page.evaluate(() => PixelPets.walkStep('up'));
  await expect.poll(() => read().then(s => s.world.map)).toBe(ROOM);
  const s1 = await read();
  expect(s1.v).toBe(2);
  expect(Object.keys(s1).sort()).toEqual(Object.keys(s0).sort());
  expect(Object.keys(s1.flags).filter(k => !(k in s0.flags) && !/^(daily|seen|map|visit|contact)/.test(k))).toEqual([]);

  for (const [flags, world] of [
    [{}, { map: 'hw_cut', x: 23, y: 14 }],                                   // an old save with none of the new flags
    [{ 'story.warden_met': true }, { map: ROOM, x: 4, y: 7 }],                // a save inside the hut
    [{ 'story.cobble_end': true }, { map: 'hw_cut', x: 23, y: 13, facing: 'up' }],   // past Hall 2 (main today)
  ]) {
    const p2 = await context.newPage();
    await installSave(context, save(flags, world), { quietDay: true });
    await gotoGame(p2, '?debug=1');
    await p2.waitForFunction(() => window.PixelPets && PixelPets.debug === true && PixelPets.state && PixelPets.state.world);
    expect(await where(p2)).toMatchObject({ map: world.map, x: world.x, y: world.y });
    expect(await p2.evaluate(() => PixelPets.state.v)).toBe(2);
    if (flags['story.cobble_end']) {
      await p2.evaluate(() => { PixelPets.showTab('walk'); PixelPets.clearWild(); PixelPets.walkStep('up'); });
      await expect.poll(() => where(p2).then(p => p.map), { timeout: 8000 }).toBe(ROOM);
    }
    await p2.close();
  }
});
