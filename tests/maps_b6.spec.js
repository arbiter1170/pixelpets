/* B6 High Charity interiors: own floor and wall per room, wall-shadow row, signature props.
   highcharity.json stays untouched. Lab and house skins stay as they were. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const ROOMS = [
  { id: 'hc_airport_in', w: 9, h: 7, ax: 4, ay: 5, safe: [4, 5], floor: '.',
    old: ['hc_airport_in_mat', 'hc_quin', 'hc_airship_in'],
    exit: { x: 4, y: 5, dir: 'down', to: 'highcharity', tx: 32, ty: 4 } },
  { id: 'hc_command_in', w: 9, h: 7, ax: 4, ay: 5, safe: [4, 5], floor: '.',
    old: ['hc_command_in_mat', 'hc_lumen', 'hc_council_trig', 'hc_console'],
    exit: { x: 4, y: 5, dir: 'down', to: 'highcharity', tx: 32, ty: 9 } },
  { id: 'hc_barracks_in', w: 9, h: 7, ax: 4, ay: 5, safe: [4, 5], floor: '.',
    old: ['hc_barracks_in_mat', 'hc_rowan', 'hc_banner'],
    exit: { x: 4, y: 5, dir: 'down', to: 'highcharity', tx: 9, ty: 11 } },
  { id: 'hc_marina_in', w: 9, h: 7, ax: 4, ay: 5, safe: [4, 5], floor: '.',
    old: ['hc_marina_in_mat', 'hc_ness', 'hc_buoy_in'],
    exit: { x: 4, y: 5, dir: 'down', to: 'highcharity', tx: 18, ty: 17 } },
  { id: 'hc_school_in', w: 9, h: 7, ax: 4, ay: 5, safe: [4, 5], floor: '.',
    old: ['hc_school_in_mat', 'hc_mae', 'hc_desk'],
    exit: { x: 4, y: 5, dir: 'down', to: 'highcharity', tx: 11, ty: 29 } },
  { id: 'hc_bank_in', w: 9, h: 7, ax: 4, ay: 5, safe: [4, 5], floor: '.',
    old: ['hc_bank_in_mat', 'hc_ivo', 'hc_counter'],
    exit: { x: 4, y: 5, dir: 'down', to: 'highcharity', tx: 49, ty: 29 } },
  { id: 'hc_gym_in', w: 9, h: 7, ax: 4, ay: 5, safe: [4, 5], floor: '.',
    old: ['hc_gym_in_mat', 'hc_sol', 'hc_gym_note'],
    exit: { x: 4, y: 5, dir: 'down', to: 'highcharity', tx: 22, ty: 13 } },
  { id: 'hc_lantern_in', w: 9, h: 7, ax: 4, ay: 5, safe: [4, 5], floor: '.',
    old: ['hc_lantern_in_mat', 'hc_bed_a', 'hc_bed_b', 'hc_bed_c', 'hc_lantern_light', 'hc_lantern_note'],
    exit: { x: 4, y: 5, dir: 'down', to: 'highcharity', tx: 22, ty: 34 } },
  { id: 'hc_church_in', w: 11, h: 11, ax: 5, ay: 9, safe: [5, 9], floor: '.',
    old: ['hc_church_in_mat', 'hc_vesper', 'hc_altar', 'hc_pew_w', 'hc_pew_e', 'hc_pew_w2', 'hc_pew_e2'],
    exit: { x: 5, y: 9, dir: 'down', to: 'highcharity', tx: 52, ty: 9 } },
  { id: 'hc_hall_in', w: 11, h: 11, ax: 5, ay: 9, safe: [5, 9], floor: '.',
    old: ['hc_hall_in_mat', 'hc_nim', 'hc_sera', 'hc_otto', 'hc_bramble', 'hc_willa', 'hc_brin', 'hc_booth_l', 'hc_booth_s', 'hc_booth_c', 'hc_booth_d', 'hc_hall_note'],
    exit: { x: 5, y: 9, dir: 'down', to: 'highcharity', tx: 32, ty: 29 } },
  { id: 'hc_arena_in', w: 11, h: 9, ax: 5, ay: 7, safe: [5, 7], floor: '.',
    old: ['hc_arena_in_mat', 'hc_nia', 'hc_rope_l', 'hc_rope_r'],
    exit: { x: 5, y: 7, dir: 'down', to: 'highcharity', tx: 45, ty: 15 } },
  { id: 'hc_apt_in', w: 7, h: 6, ax: 3, ay: 4, safe: [3, 4], floor: '.',
    old: ['hc_apt_in_mat', 'hc_oren', 'hc_apt_bed'],
    exit: { x: 3, y: 4, dir: 'down', to: 'highcharity', tx: 8, ty: 25 } },
  { id: 'hc_mall_1', w: 11, h: 11, ax: 5, ay: 9, safe: [5, 9], floor: '.',
    old: ['hc_mall_1_mat', 'hc_tess', 'hc_mann_a', 'hc_mann_b', 'hc_mall_up', 'hc_mall_stairs'],
    exit: { x: 5, y: 9, dir: 'down', to: 'highcharity', tx: 55, ty: 35 } },
  { id: 'hc_mall_2', w: 11, h: 11, ax: 9, ay: 6, safe: [5, 9], floor: '.',
    old: ['hc_mall_down', 'hc_mall_up_sign', 'hc_mann_c', 'hc_penn'],
    exit: { x: 9, y: 6, dir: 'up', to: 'hc_mall_1', tx: 9, ty: 6 } },
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
    PixelPets.setFlag('story.cobble_end', true);
    const out = [];
    for (const room of rooms) {
      PixelPets.goto(room.id, room.ax, room.ay, 'up');
      const info = PixelPets.mapInfo;
      const ids = PixelPets.mapObjs.map(o => o.id);
      const share = PixelPets.floorShare(room.id);
      const floors = {}, walls = {}, faces = {};
      let shadow = 0, wallFaces = 0, badShadow = 0;
      const seen = [];
      const nameAt = (x, y) => {
        const t = PixelPets.tileInfo(x, y);
        if (t.solid) return 'solid:' + (t.tile || t.ch);
        return t.decal || t.tile;
      };
      const noteRun = (axis, x, y, n, tile) => { if (n > 6 && !String(tile).startsWith('solid:')) seen.push(room.id + ' ' + axis + ' ' + x + ',' + y + ' ' + tile + ' x' + n); };
      for (let y = 0; y < info.h; y++) {
        let run = 0, prev = null;
        for (let x = 0; x < info.w; x++) {
          const t = PixelPets.tileInfo(x, y);
          const tile = nameAt(x, y);
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
          if (tile === prev) run++;
          else { noteRun('row', x - 1, y, run, prev); run = 1; prev = tile; }
        }
        noteRun('row', info.w - 1, y, run, prev);
      }
      for (let x = 0; x < info.w; x++) {
        let run = 0, prev = null;
        for (let y = 0; y < info.h; y++) {
          const tile = nameAt(x, y);
          if (tile === prev) run++;
          else { noteRun('col', x, y - 1, run, prev); run = 1; prev = tile; }
        }
        noteRun('col', x, info.h - 1, run, prev);
      }
      const mode = bag => Object.entries(bag).sort((a, b) => b[1] - a[1])[0][0];
      const props = PixelPets.mapObjs.filter(o => o.kind === 'prop' || o.kind === 'sign' || o.kind === 'pickup');
      const decals = PixelPets.mapObjs.filter(o => o.kind === 'decal' && o.sprite && !o.art).map(o => o.id);
      out.push({
        id: room.id, w: info.w, h: info.h, ids, missing: room.old.filter(id => !ids.includes(id)),
        share: share && { walk: share.walk, tile: share.tile, share: share.share },
        floor: mode(floors), wall: mode(walls), face: mode(faces),
        shadow, wallFaces, badShadow, runs: seen,
        props: props.length, need: Math.ceil(share.walk / 12),
        art: props.filter(o => o.sprite && !o.art).map(o => o.id),
        decals,
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
    expect(row.props, row.id + ' props ' + row.props + ' need ' + row.need).toBeGreaterThanOrEqual(row.need);
    expect(row.badShadow, row.id).toBe(0);
    expect(row.shadow, row.id).toBeGreaterThan(0);
    expect(row.art, row.id).toEqual([]);
    expect(row.decals, row.id).toEqual([]);
    expect(row.runs, row.id).toEqual([]);
    floors.add(row.floor); walls.add(row.wall + '|' + row.face);
  }
  expect(floors.size).toBe(ROOMS.length);
  expect(walls.size).toBe(ROOMS.length);
});

test('exits and the mall stair still use the old landing tiles @w1', async ({ page }) => {
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
  await page.evaluate(() => PixelPets.goto('hc_mall_1', 9, 6, 'up'));
  const from = await page.evaluate(() => ({ map: PixelPets.mapInfo.id, x: PixelPets.state.world.x, y: PixelPets.state.world.y }));
  await page.evaluate(() => { PixelPets.walk.queued = [0, -1]; });
  await page.waitForFunction((prev) => {
    if (PixelPets.fading || PixelPets.keeper.moving) return false;
    return PixelPets.mapInfo.id !== prev.map;
  }, from);
  expect(await page.evaluate(() => ({ map: PixelPets.mapInfo.id, x: PixelPets.state.world.x, y: PixelPets.state.world.y }))).toEqual({ map: 'hc_mall_2', x: 9, y: 6 });
});

test('a save standing on a wall snaps to safe, and the lab bay is unchanged @w1', async ({ page }) => {
  await boot(page, save(null, { map: 'hc_airport_in', x: 0, y: 0 }));
  expect(await page.evaluate(() => ({ map: PixelPets.mapInfo.id, x: PixelPets.state.world.x, y: PixelPets.state.world.y, v: PixelPets.state.v }))).toEqual({ map: 'hc_airport_in', x: 4, y: 5, v: 2 });
  const kept = await page.evaluate(() => {
    PixelPets.goto('hc_church_in', 5, 9, 'up');
    return { x: PixelPets.state.world.x, y: PixelPets.state.world.y, solid: PixelPets.tileInfo(5, 9).solid };
  });
  expect(kept).toEqual({ x: 5, y: 9, solid: false });
  const lab = await page.evaluate(() => {
    PixelPets.goto('rx_f1', 8, 9, 'up');   // (9, 8) is a mint inlay since B2
    const plain = PixelPets.tileInfo(8, 9).tile;
    const share = PixelPets.floorShare('rx_f4');
    PixelPets.goto('hm_home_in', 4, 6, 'up');
    const home = PixelPets.tileInfo(4, 3).tile;
    return { plain, walk: share.walk, share: share.share, home, cap: PixelPets.devChecks().floorCap };
  });
  expect(lab.plain).toBe('lab_floor');
  expect(lab.walk).toBe(216);
  expect(lab.share).toBeLessThanOrEqual(0.7);
  expect(['floor_pine', 'floor_pine_b', 'floor_pine_c']).toContain(lab.home);
  expect(lab.cap).toEqual([]);
});
