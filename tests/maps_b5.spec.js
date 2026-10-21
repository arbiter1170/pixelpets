/* B5 house interiors: own floor and wall per room, wall-shadow row, prop paths, D88 after variants.
   Lab results stay on LAB_SKIN. interiors.json and cobblecrest.json stay verbatim. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const ROOMS = [
  { id: 'hm_home_in', w: 9, h: 8, ax: 4, ay: 6, safe: [4, 6], floor: '.',
    old: ['home_mat', 'home_stairs', 'home_bed', 'home_terminal', 'home_glowbox', 'home_bookshelf', 'home_table', 'home_mirror', 'home_note_kept'],
    exit: { x: 4, y: 6, dir: 'down', to: 'hearthmoor', tx: 3, ty: 5 } },
  { id: 'hm_home_up', w: 9, h: 8, ax: 2, ay: 5, safe: [4, 5], floor: '.',
    old: ['home_stairs_down', 'mom', 'up_bed', 'up_shelf'],
    exit: { x: 2, y: 5, dir: 'left', to: 'hm_home_in', tx: 1, ty: 6 } },
  { id: 'hm_lodge_in', w: 11, h: 9, ax: 5, ay: 7, safe: [5, 7], floor: '.',
    old: ['lodge_mat', 'ilse_lodge_after', 'lodge_lantern', 'lodge_empty_a', 'lodge_empty_b', 'lodge_empty_c', 'lodge_ledger'],
    exit: { x: 5, y: 7, dir: 'down', to: 'hearthmoor', tx: 15, ty: 6 } },
  { id: 'hm_lantern_in', w: 9, h: 7, ax: 4, ay: 5, safe: [4, 5], floor: '.',
    old: ['lantern_mat', 'lantern_bed_a', 'lantern_bed_b', 'lantern_bed_c', 'lantern_light', 'lantern_note', 'travel_shelf'],
    exit: { x: 4, y: 5, dir: 'down', to: 'hearthmoor', tx: 16, ty: 13 } },
  { id: 'hm_rook_in', w: 7, h: 6, ax: 3, ay: 4, safe: [3, 4], floor: '.',
    old: ['rook_mat', 'mrs_calloway', 'rook_table', 'rook_shelf'],
    exit: { x: 3, y: 4, dir: 'down', to: 'hearthmoor', tx: 20, ty: 5 } },
  { id: 'hm_hq_f1', w: 14, h: 16, ax: 6, ay: 14, safe: [6, 13], floor: '.',
    old: ['hq_out', 'hq_up', 'hq_stair_sign', 'hq_bram', 'hq_mo', 'hq_wynn', 'hq_corwin', 'hq_orrin'],
    exit: { x: 6, y: 14, dir: 'down', to: 'hearthmoor', tx: 11, ty: 11 } },
  { id: 'hm_hq_f2', w: 12, h: 14, ax: 10, ay: 4, safe: [5, 9], floor: '.',
    old: ['hq_down', 'hq_radio_sign', 'hq_lumen', 'hq_rue', 'hq_tamm', 'hq_linnea'],
    exit: { x: 10, y: 2, dir: 'down', to: 'hm_hq_f1', tx: 12, ty: 4 } },
  { id: 'cc_lantern_in', w: 9, h: 7, ax: 4, ay: 5, safe: [4, 5], floor: '.',
    old: ['cc_lantern_mat', 'cc_bed_a', 'cc_bed_b', 'cc_bed_c', 'cc_lantern_light', 'cc_lamp_rack', 'cc_lantern_note'],
    exit: { x: 4, y: 5, dir: 'down', to: 'cobblecrest', tx: 5, ty: 5 } },
  { id: 'cc_hall_in', w: 11, h: 13, ax: 5, ay: 11, safe: [5, 10], floor: ':',
    old: ['cc_hall_mat', 'hale', 'h2_lamp_l', 'h2_cairn', 'h2_seam_b', 'h2_sweeper', 'h2_seam_a', 'h2_builder', 'h2_sign'],
    exit: { x: 5, y: 11, dir: 'down', to: 'cobblecrest', tx: 24, ty: 6 } },
];

function save(extra) {
  const s = starterSave();
  s.settings.follower = false;
  if (extra) Object.assign(s.flags, extra);
  if (arguments[1]) s.world = Object.assign({ facing: 'down', respawn: 'hearthmoor' }, arguments[1]);
  return s;
}

async function boot(page, s) {
  await installSave(page.context(), s || save(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
}

test('each room keeps its size, its old ids, its own skin, and the floor cap @w1', async ({ page }) => {
  await boot(page);
  const report = await page.evaluate((rooms) => {
    const out = [];
    for (const room of rooms) {
      PixelPets.goto(room.id, room.ax, room.ay, 'up');
      const info = PixelPets.mapInfo;
      const ids = PixelPets.mapObjs.map(o => o.id);
      const share = PixelPets.floorShare(room.id);
      const floors = {}, walls = {}, faces = {};
      let shadow = 0, wallFaces = 0, badShadow = 0;
      for (let y = 0; y < info.h; y++) for (let x = 0; x < info.w; x++) {
        const t = PixelPets.tileInfo(x, y);
        if (t.ch === room.floor) floors[t.tile] = (floors[t.tile] || 0) + 1;
        if (t.ch === '#') walls[t.tile] = (walls[t.tile] || 0) + 1;
        if (t.ch === 'W' && x % 2 === 0) faces[t.tile] = (faces[t.tile] || 0) + 1;
        if (t.ch === 'W') {
          wallFaces++;
          const south = PixelPets.tileInfo(x, y + 1);
          if (south.ch === 'X' || south.ch === '#') continue;
          shadow++;
          if (x % 2 === 1 && south.ch !== 'u') badShadow++;
          if (x % 2 === 0 && south.ch !== 'v') badShadow++;
        }
      }
      const mode = bag => Object.entries(bag).sort((a, b) => b[1] - a[1])[0][0];
      const props = PixelPets.mapObjs.filter(o => o.kind === 'prop' || o.kind === 'sign' || o.kind === 'pickup');
      out.push({
        id: room.id, w: info.w, h: info.h, ids, missing: room.old.filter(id => !ids.includes(id)),
        share: share && { walk: share.walk, tile: share.tile, share: share.share },
        floor: mode(floors), wall: mode(walls), face: mode(faces),
        shadow, wallFaces, badShadow,
        props: props.length, need: Math.ceil(share.walk / 12),
        art: props.filter(o => o.sprite && !o.art).map(o => o.id),
      });
    }
    return { out, floorCap: PixelPets.devChecks().floorCap, v: PixelPets.state.v };
  }, ROOMS);
  expect(report.v).toBe(2);
  expect(report.floorCap).toEqual([]);
  const floors = new Set(), walls = new Set();
  for (const row of report.out) {
    const room = ROOMS.find(r => r.id === row.id);
    expect(row.w, row.id).toBe(room.w);
    expect(row.h, row.id).toBe(room.h);
    expect(row.missing, row.id).toEqual([]);
    expect(row.share.share, row.id + ' ' + row.share.tile).toBeLessThanOrEqual(0.7);
    expect(row.props, row.id).toBeGreaterThanOrEqual(row.need);
    expect(row.badShadow, row.id).toBe(0);
    expect(row.shadow, row.id).toBeGreaterThan(0);
    expect(row.art, row.id).toEqual([]);
    if (row.id === 'hm_hq_f1' || row.id === 'hm_hq_f2') continue;
    floors.add(row.floor); walls.add(row.wall + '|' + row.face);
  }
  // The two Keeper House floors share one skin. The other seven rooms stay unique, and different from that skin.
  expect(floors.size).toBe(ROOMS.length - 2);
  expect(walls.size).toBe(ROOMS.length - 2);
  for (const row of report.out.filter(r => r.id === 'hm_hq_f1' || r.id === 'hm_hq_f2')) {
    const prefix = row.id === 'hm_hq_f2' ? 'house_hq_up__' : 'house_hq__';
    expect(row.wall.startsWith(prefix), row.id + ' ' + row.wall).toBe(true);
    expect(row.face, row.id).toBe(prefix + 'face');
    expect(row.floor.startsWith('floor_keep'), row.id + ' ' + row.floor).toBe(true);
    expect(floors.has(row.floor), row.id).toBe(false);
    expect(walls.has(row.wall + '|' + row.face), row.id).toBe(false);
  }
});

test('exits still use the old landing tiles @w1', async ({ page }) => {
  await boot(page);
  for (const room of ROOMS) {
    await page.evaluate((e) => {
      PixelPets.showTab('walk');
      PixelPets.goto(e.id, e.exit.x, e.exit.y, e.exit.dir);
    }, room);
    const before = await page.evaluate(() => ({ map: PixelPets.mapInfo.id, x: PixelPets.state.world.x, y: PixelPets.state.world.y }));
    await page.evaluate((dir) => {
      PixelPets.walk.queued = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
    }, room.exit.dir);
    await page.waitForFunction((prev) => {
      if (PixelPets.fading || PixelPets.keeper.moving) return false;
      const s = PixelPets.state.world;
      return PixelPets.mapInfo.id !== prev.map || s.x !== prev.x || s.y !== prev.y;
    }, before);
    const landed = await page.evaluate(() => ({ map: PixelPets.mapInfo.id, x: PixelPets.state.world.x, y: PixelPets.state.world.y }));
    expect(landed, room.id).toEqual({ map: room.exit.to, x: room.exit.tx, y: room.exit.ty });
  }
});

test('a save standing on a wall snaps to safe, and the lab bay is unchanged @w1', async ({ page }) => {
  await boot(page, save(null, { map: 'hm_home_in', x: 0, y: 0 }));
  expect(await page.evaluate(() => ({ map: PixelPets.mapInfo.id, x: PixelPets.state.world.x, y: PixelPets.state.world.y, v: PixelPets.state.v }))).toEqual({ map: 'hm_home_in', x: 4, y: 6, v: 2 });
  const lab = await page.evaluate(() => {
    PixelPets.goto('rx_f1', 8, 9, 'up');   // (9,8) is a mint inlay since B2
    const plain = PixelPets.tileInfo(8, 9).tile;
    const share = PixelPets.floorShare('rx_f4');
    return { plain, walk: share.walk, share: share.share, cap: PixelPets.devChecks().floorCap };
  });
  expect(lab.plain).toBe('lab_floor');
  expect(lab.walk).toBe(216);
  expect(lab.share).toBeLessThanOrEqual(0.7);
  expect(lab.cap).toEqual([]);
});
