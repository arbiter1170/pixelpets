/* Keeper House command centre: both floors, every person, sign and warp, and old saves.
   Save v stays 2. The six enclosed props are inner pieces of a group and are not a path. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const ART = ['keep_desk', 'keep_desk_cpt', 'keep_cabinet', 'keep_wallmap_a', 'keep_wallmap_b', 'keep_wallmap_c', 'keep_radio', 'keep_radio_rack', 'keep_insignia', 'keep_trophy', 'keep_evidence', 'keep_locker', 'keep_bunk', 'keep_table_tl', 'keep_table_tr', 'keep_table_bl', 'keep_table_br', 'keep_chair', 'keep_maptable', 'keep_lamp', 'keep_lamp_wall', 'keep_counter_l', 'keep_counter_r', 'keep_standing', 'keep_notice', 'keep_crate', 'keep_crate_stack', 'keep_plant', 'keep_kettle', 'keep_coat', 'keep_bench', 'keep_stair'];
const ENCLOSED = ['hq_table_tl', 'hq_evid_a', 'hq_locker_b', 'hq2_radio_b', 'hq2_banner_b', 'hq2_crate'];
const WARM = { A: '#c9925e', B: '#a8674a', C: '#e3d3ac', D: '#9fae86', E: '#5f6e4f', F: '#5c4033', G: '#b5845a', H: '#b9877a', I: '#9c9382', J: '#2f5a3e', P: '#9686a8' };

function save(world) {
  const s = starterSave();
  s.settings.follower = false;
  if (world) s.world = Object.assign({ facing: 'down', respawn: 'hearthmoor' }, world);
  return s;
}

async function boot(page, s) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), s || save(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
}

test('both floors keep their ids, their cap, and a path to every person @w1', async ({ page }) => {
  await boot(page);
  const report = await page.evaluate(({ art, enclosed }) => {
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const rooms = [
      { id: 'hm_hq_f1', ax: 6, ay: 14, safe: [6, 13], props: 41, npcs: ['hq_bram', 'hq_mo', 'hq_wynn', 'hq_corwin', 'hq_orrin'] },
      { id: 'hm_hq_f2', ax: 10, ay: 4, safe: [5, 9], props: 28, npcs: ['hq_lumen', 'hq_rue', 'hq_tamm', 'hq_linnea'] },
    ];
    const out = [];
    for (const room of rooms) {
      PixelPets.goto(room.id, room.ax, room.ay, 'up');
      const info = PixelPets.mapInfo;
      const objs = info.objs;
      const block = new Set(objs.filter(o => o.block).map(o => o.x + ',' + o.y));
      const seen = new Set([room.ax + ',' + room.ay]);
      const q = [[room.ax, room.ay]];
      while (q.length) {
        const [x, y] = q.shift();
        for (const [dx, dy] of dirs) {
          const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
          if (nx < 0 || ny < 0 || nx >= info.w || ny >= info.h || seen.has(k)) continue;
          if (PixelPets.tileInfo(nx, ny).solid || block.has(k)) continue;
          seen.add(k); q.push([nx, ny]);
        }
      }
      const adj = (x, y) => dirs.some(([dx, dy]) => seen.has((x + dx) + ',' + (y + dy)));
      const need = objs.filter(o => o.kind === 'npc' || o.kind === 'sign' || o.kind === 'warp');
      const missed = need.filter(o => o.kind === 'warp' ? !seen.has(o.x + ',' + o.y) : !adj(o.x, o.y)).map(o => o.id);
      const share = PixelPets.floorShare(room.id);
      const props = PixelPets.mapObjs.filter(o => o.kind === 'prop');
      out.push({
        id: room.id, w: info.w, h: info.h,
        missed, share: { walk: share.walk, tile: share.tile, share: share.share },
        props: props.length, npcs: PixelPets.mapObjs.filter(o => o.kind === 'npc').map(o => o.id),
        bare: props.filter(o => !o.art).map(o => o.sprite || o.id),
        enclosed: enclosed.filter(id => (room.id === 'hm_hq_f1' ? !id.startsWith('hq2_') : id.startsWith('hq2_')) && !props.some(o => o.id === id)),
        safeGot: PixelPets.exteriors(room.id).safe,
        mat: room.id === 'hm_hq_f1' ? PixelPets.tileInfo(6, 15).ch : null,
      });
    }
    const wart = PixelPets.exteriors('hm_hq_f1').wart;
    return {
      out, v: PixelPets.state.v, cap: PixelPets.devChecks().floorCap, quests: PixelPets.questCheck,
      keys: Object.fromEntries(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'P', 'K'].map(k => [k, PAL[k]])),
      art: art.map(name => [name, wart[name] || null]),
      skins: [HOUSE_SKINS.house_hq.remap, HOUSE_SKINS.house_hq_up.remap],
    };
  }, { art: ART, enclosed: ENCLOSED });

  expect(report.v).toBe(2);
  expect(report.cap).toEqual([]);
  expect(report.quests).toEqual([]);
  expect(report.keys).toEqual(Object.assign({ K: '#7a8aa0' }, WARM));
  expect(report.skins[0]).toEqual(report.skins[1]);
  for (const [name, dim] of report.art) expect(dim, name).toEqual([16, 16]);
  expect(report.out[0]).toMatchObject({
    id: 'hm_hq_f1', w: 14, h: 16, safeGot: { x: 6, y: 13 }, missed: [], props: 41, npcs: ['hq_bram', 'hq_mo', 'hq_wynn', 'hq_corwin', 'hq_orrin'], bare: [], enclosed: [], mat: 'm',
  });
  expect(report.out[1]).toMatchObject({
    id: 'hm_hq_f2', w: 12, h: 14, safeGot: { x: 5, y: 9 }, missed: [], props: 28, npcs: ['hq_lumen', 'hq_rue', 'hq_tamm', 'hq_linnea'], bare: [], enclosed: [],
  });
  expect(report.out[0].share).toMatchObject({ walk: 157, tile: 'floor_keep_tile' });
  expect(report.out[1].share).toMatchObject({ walk: 110, tile: 'floor_keep_carpet' });
  expect(report.out[0].share.share).toBeLessThanOrEqual(0.55);
  expect(report.out[1].share.share).toBeLessThanOrEqual(0.55);


});

test('a lamp glow holds still, and an old save on a blocked tile snaps to safe', async ({ page }) => {
  await boot(page, save({ map: 'hm_hq_f1', x: 0, y: 0 }));
  expect(await page.evaluate(() => ({ map: PixelPets.mapInfo.id, x: PixelPets.state.world.x, y: PixelPets.state.world.y, v: PixelPets.state.v }))).toEqual({ map: 'hm_hq_f1', x: 6, y: 13, v: 2 });

  await boot(page, save({ map: 'hm_hq_f1', x: 7, y: 5 }));
  expect(await page.evaluate(() => ({ x: PixelPets.state.world.x, y: PixelPets.state.world.y }))).toEqual({ x: 6, y: 13 });

  await boot(page, save({ map: 'hm_hq_f2', x: 8, y: 4 }));
  expect(await page.evaluate(() => ({ map: PixelPets.mapInfo.id, x: PixelPets.state.world.x, y: PixelPets.state.world.y }))).toEqual({ map: 'hm_hq_f2', x: 5, y: 9 });

  await boot(page, save({ map: 'hm_hq_f1', x: 4, y: 6 }));
  const stayed = await page.evaluate(() => ({ x: PixelPets.state.world.x, y: PixelPets.state.world.y, v: PixelPets.state.v }));
  expect(stayed).toEqual({ x: 4, y: 6, v: 2 });

  const glow = await page.evaluate(async () => {
    PixelPets.goto('hm_hq_f1', 6, 13, 'up');
    const settle = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    await settle();
    const read = () => {
      const c = document.querySelector('#mapCanvas');
      const x = 10 * 16 + 2 - PixelPets.walk.cam.x;
      const y = 9 * 16 + 2 - PixelPets.walk.cam.y;
      if (x < 0 || y < 0 || x >= c.width || y >= c.height) return { ok: false, x, y, w: c.width, h: c.height };
      const d = c.getContext('2d').getImageData(x, y, 1, 1).data;
      const tile = buildTiles().floor_keep.getContext('2d').getImageData(2, 2, 1, 1).data;
      const hex = n => '#' + [n[0], n[1], n[2]].map(v => v.toString(16).padStart(2, '0')).join('');
      return { ok: true, hex: hex(d), plain: hex(tile) };
    };
    const a = read();
    await settle();
    const b = read();
    return { a, b, reduce: matchMedia('(prefers-reduced-motion: reduce)').matches };
  });
  expect(glow.reduce).toBe(true);
  expect(glow.a.ok, JSON.stringify(glow.a)).toBe(true);
  expect(glow.a.hex).toBe(glow.b.hex);
  expect(glow.a.plain).toBe('#7a8aa0');
  expect(glow.a.hex).not.toBe(glow.a.plain);
});
