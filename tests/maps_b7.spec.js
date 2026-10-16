/* B7 observatory and dream rooms: own skins, wall-shadow row, decals, D88 after variants.
   The outdoor mahopac map and the dream scenes stay as they were. Party adds decals only. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const ROOMS = [
  { id: 'mahopac_obs', w: 9, h: 7, ax: 4, ay: 5, safe: [4, 5], floor: '.', wall: 'wall_obs_dome', face: 'wall_obs_face',
    variants: true, dream: null,
    old: ['obs_out', 'obs_scope'],
    exit: { x: 4, y: 5, dir: 'down', to: 'mahopac', tx: 5, ty: 8 } },
  { id: 'dream_2004', w: 9, h: 8, ax: 4, ay: 6, safe: [4, 6], floor: '.', wall: 'wall_mist', face: 'wall_mist_face',
    variants: true, dream: 'young',
    old: ['pop_toy', 'dream_toy_sign'] },
  { id: 'dream_party', w: 11, h: 8, ax: 5, ay: 6, safe: [5, 6], floor: '.', wall: 'wall_fest', face: 'wall_fest_face',
    variants: false, dream: 'child',
    old: ['pins', 'balloon_red', 'balloon_yellow', 'balloon_blue', 'dream_party_sign'] },
  { id: 'dream_drive', w: 9, h: 7, ax: 5, ay: 3, safe: [5, 3], floor: '.', wall: 'wall_night', face: 'wall_night_face',
    variants: true, dream: 'child',
    old: ['dream_dad', 'fry_tray'] },
];

const LINES = [
  ['mahopac_obs', 2, 5, 'up', 'A desk under the dome. A blank page waits.'],
  ['mahopac_obs', 6, 5, 'up', 'A stool pulled up to the desk.'],
  ['mahopac_obs', 1, 4, 'down', 'A small lamp. The shade is warm.'],
  ['mahopac_obs', 6, 3, 'right', 'A rolled star chart. The ink is pale.'],
  ['mahopac_obs', 6, 5, 'right', 'A small case. The lid is shut.'],
  ['dream_2004', 2, 6, 'left', 'Wooden blocks, stacked and still.'],
  ['dream_2004', 6, 6, 'right', 'A low shelf. A round plush sits on it.'],
  ['dream_2004', 2, 2, 'left', 'A small lamp by the wall.'],
  ['dream_2004', 6, 4, 'right', 'A soft cushion on the floor.'],
  ['dream_party', 5, 4, 'up', 'Bowling pins, waiting. The balloons are the ones asking.'],
  ['dream_2004', 7, 3, 'up', 'You are very small. Push the toy. It pops as it rolls.'],
  ['dream_drive', 4, 3, 'up', 'A menu board. The pictures are plain shapes.'],
  ['dream_drive', 2, 4, 'left', 'A short post by the lane. No name on it.'],
];

function save(world) {
  const s = starterSave();
  s.settings.follower = false;
  if (world) s.world = Object.assign({ facing: 'down', respawn: 'hearthmoor' }, world);
  return s;
}

async function boot(page, s) {
  await installSave(page.context(), s || save(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
}

async function say(page) {
  await page.keyboard.press('Space');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
  const text = await page.evaluate(() => PixelPets.scene.text);
  await page.keyboard.press('Space');
  await page.waitForFunction(() => !PixelPets.scene);
  return text;
}

test('each room keeps its size, its old ids, its own skin, and the floor cap', async ({ page }) => {
  await boot(page);
  const report = await page.evaluate((rooms) => {
    const out = [];
    for (const room of rooms) {
      PixelPets.goto(room.id, room.ax, room.ay, 'up');
      const info = PixelPets.mapInfo;
      const ids = PixelPets.mapObjs.map(o => o.id);
      const share = PixelPets.floorShare(room.id);
      const floors = {}, walls = {}, faces = {};
      let shadow = 0, badShadow = 0, decals = 0, edge = 0;
      for (let y = 0; y < info.h; y++) for (let x = 0; x < info.w; x++) {
        const t = PixelPets.tileInfo(x, y);
        if (x === 0 || x === info.w - 1 || y === 0 || y === info.h - 1) {
          if (t.ch === '#') edge++;
        }
        if (t.ch === room.floor) floors[t.tile] = (floors[t.tile] || 0) + 1;
        if (t.ch === '#') walls[t.tile] = (walls[t.tile] || 0) + 1;
        if (t.ch === 'W' && x % 2 === 0) faces[t.tile] = (faces[t.tile] || 0) + 1;
        if (t.decal) decals++;
        if (t.ch === 'W') {
          const south = PixelPets.tileInfo(x, y + 1);
          if (south.ch === '#' || south.ch === 'X') continue;
          shadow++;
          if (x % 2 === 1 && south.ch !== 'u') badShadow++;
          if (x % 2 === 0 && south.ch !== 'v') badShadow++;
        }
      }
      const mode = bag => Object.entries(bag).sort((a, b) => b[1] - a[1])[0][0];
      const props = PixelPets.mapObjs.filter(o => o.kind === 'prop' || o.kind === 'sign' || o.kind === 'pickup');
      out.push({
        id: room.id, w: info.w, h: info.h, dream: info.dream, ids,
        missing: room.old.filter(id => !ids.includes(id)),
        share: share && { walk: share.walk, tile: share.tile, share: share.share },
        floor: mode(floors), wall: mode(walls), face: mode(faces),
        shadow, badShadow, decals, edge, floorKinds: Object.keys(floors).length,
        props: props.length, need: Math.ceil(share.walk / 12),
        art: props.filter(o => o.sprite && !o.art).map(o => o.id),
        safe: [PixelPets.tileInfo(room.safe[0], room.safe[1]).solid, PixelPets.tileInfo(room.ax, room.ay).blocked],
      });
    }
    PixelPets.goto('mahopac', 9, 14, 'up');
    const town = PixelPets.mapInfo;
    const door = town.objs.find(o => o.id === 'mah_obs');
    const outdoor = {
      w: town.w, h: town.h, dream: town.dream,
      step: PixelPets.tileInfo(9, 14).ch,
      roof: PixelPets.tileInfo(4, 4).ch,
      door: door && { x: door.x, y: door.y },
    };
    const skins = {
      n: Object.keys(HOUSE_SKINS).length,
      home: HOUSE_SKINS.house_home.remap['.'],
      lab: LAB_SKIN.remap['.'],
      labVar: Object.keys(LAB_SKIN.variants).join(','),
    };
    return { out, outdoor, skins, floorCap: PixelPets.devChecks().floorCap, v: PixelPets.state.v };
  }, ROOMS);
  expect(report.v).toBe(2);
  expect(report.floorCap).toEqual([]);
  expect(report.outdoor).toEqual({ w: 20, h: 16, dream: null, step: 'p', roof: 'R', door: { x: 5, y: 7 } });
  // 9 house rooms + 4 dream rooms + 14 High Charity rooms + the schoolhouse, the lobby, and flat 5B.
  expect(report.skins).toEqual({ n: 30, home: 'house_floor_a', lab: 'lab_floor', labVar: 'lab_floor_bay,lab_floor,lab_floor_focus,lab_floor_records' });
  const floors = new Set(), walls = new Set();
  for (const row of report.out) {
    const room = ROOMS.find(r => r.id === row.id);
    expect(row.w, row.id).toBe(room.w);
    expect(row.h, row.id).toBe(room.h);
    expect(row.dream, row.id).toBe(room.dream);
    expect(row.missing, row.id).toEqual([]);
    expect(row.share.share, row.id + ' ' + row.share.tile).toBeLessThanOrEqual(0.7);
    expect(row.props, row.id).toBeGreaterThanOrEqual(row.need);
    expect(row.badShadow, row.id).toBe(0);
    expect(row.shadow, row.id).toBeGreaterThan(0);
    expect(row.decals, row.id).toBeGreaterThanOrEqual(4);
    expect(row.edge, row.id).toBeGreaterThan(0);
    expect(row.art, row.id).toEqual([]);
    expect(row.safe, row.id).toEqual([false, false]);
    expect(row.wall, row.id).toBe(room.wall);
    expect(row.face, row.id).toBe(room.face);
    floors.add(row.floor); walls.add(row.wall + '|' + row.face);
  }
  expect(floors.size).toBe(ROOMS.length);
  expect(walls.size).toBe(ROOMS.length);
  const party = report.out.find(r => r.id === 'dream_party');
  expect(party.floor).toBe('floor_party');
  expect(party.floorKinds).toBe(1);
  const trig = await page.evaluate(() => {
    PixelPets.setFlag('story.dream_party', true);
    PixelPets.goto('dream_drive', 4, 4, 'up');
    const hit = PixelPets.mapObjs.some(o => o.id === 'dream_dad_at' && o.x === 5 && o.y === 3);
    PixelPets.setFlag('story.dream_party', null);
    return hit;
  });
  expect(trig).toBe(true);
});

test('arrival reaches every person and prop, and new lines play', async ({ page }) => {
  await boot(page);
  const reach = await page.evaluate((rooms) => {
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const bad = [];
    for (const room of rooms) {
      PixelPets.goto(room.id, room.ax, room.ay, 'up');
      const info = PixelPets.mapInfo;
      const objs = info.objs;
      const block = new Set(objs.filter(o => o.block).map(o => o.x + ',' + o.y));
      const warps = new Set(objs.filter(o => o.kind === 'warp').map(o => o.x + ',' + o.y));
      const seen = new Set([room.ax + ',' + room.ay]);
      const q = [[room.ax, room.ay]];
      while (q.length) {
        const [x, y] = q.shift();
        if (warps.has(x + ',' + y) && !(x === room.ax && y === room.ay)) continue;
        for (const [dx, dy] of dirs) {
          const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
          if (nx < 0 || ny < 0 || nx >= info.w || ny >= info.h || seen.has(k)) continue;
          if (PixelPets.tileInfo(nx, ny).solid || block.has(k)) continue;
          seen.add(k); q.push([nx, ny]);
        }
      }
      const adj = (x, y) => dirs.some(([dx, dy]) => seen.has((x + dx) + ',' + (y + dy)));
      for (const o of objs) {
        if (o.kind === 'warp' && !seen.has(o.x + ',' + o.y)) bad.push(room.id + ' warp ' + o.id);
        if ((o.kind === 'npc' || o.kind === 'trainer' || o.kind === 'sign' || o.kind === 'prop') && !adj(o.x, o.y)) bad.push(room.id + ' ' + o.id);
      }
    }
    return bad;
  }, ROOMS);
  expect(reach).toEqual([]);

  for (const [map, x, y, facing, line] of LINES) {
    await page.evaluate(([map, x, y, facing]) => PixelPets.goto(map, x, y, facing), [map, x, y, facing]);
    expect(await say(page), map + ' ' + x + ',' + y).toBe(line);
  }
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});

test('the observatory door still leaves, and a save on the new desk snaps to safe', async ({ page }) => {
  await boot(page, save({ map: 'mahopac_obs', x: 2, y: 4 }));
  expect(await page.evaluate(() => ({ map: PixelPets.mapInfo.id, x: PixelPets.state.world.x, y: PixelPets.state.world.y, v: PixelPets.state.v }))).toEqual({ map: 'mahopac_obs', x: 4, y: 5, v: 2 });

  await page.evaluate(() => {
    PixelPets.showTab('walk');
    PixelPets.goto('mahopac_obs', 4, 5, 'down');
  });
  const before = await page.evaluate(() => ({ map: PixelPets.mapInfo.id, x: PixelPets.state.world.x, y: PixelPets.state.world.y }));
  await page.evaluate(() => { PixelPets.walk.queued = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }.down; });
  await page.waitForFunction((prev) => {
    if (PixelPets.fading || PixelPets.keeper.moving) return false;
    const s = PixelPets.state.world;
    return PixelPets.mapInfo.id !== prev.map || s.x !== prev.x || s.y !== prev.y;
  }, before);
  expect(await page.evaluate(() => ({ map: PixelPets.mapInfo.id, x: PixelPets.state.world.x, y: PixelPets.state.world.y }))).toEqual({ map: 'mahopac', x: 5, y: 8 });

  const lab = await page.evaluate(() => {
    PixelPets.goto('rx_f4', 6, 19, 'up');
    const share = PixelPets.floorShare('rx_f4');
    PixelPets.goto('hm_home_in', 4, 6, 'up');
    const home = PixelPets.tileInfo(3, 3).tile;
    return { walk: share.walk, share: share.share, cap: PixelPets.devChecks().floorCap, home, v: PixelPets.state.v };
  });
  expect(lab.walk).toBe(216);
  expect(lab.share).toBeLessThanOrEqual(0.7);
  expect(lab.cap).toEqual([]);
  expect(lab.home === 'house_floor_a' || lab.home === 'house_floor_b' || lab.home === 'house_honey_c').toBe(true);
  expect(lab.v).toBe(2);
});
