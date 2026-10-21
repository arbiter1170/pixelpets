/* FLOOR_FIX: 18 interiors get calm floors. Walls, walk, props and 5B stay. Save v stays 2. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');
const grids = require('./floor_fix_grids.json');
const expectRooms = require('./floor_fix_expect.json');

trackErrors(test, expect);

const SM = ['sm_den', 'sm_hold', 'sm_tunnel', 'sm_yard'];

function save() {
  const s = starterSave();
  s.settings.follower = false;
  return s;
}

test('the 18 calm floors match the grids, stay under the cap, and leave walk and 5B alone @w1', async ({ page }) => {
  await installSave(page.context(), save(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));

  const report = await page.evaluate(async (rooms) => {
    const settle = () => new Promise(r => {
      const tick = () => {
        if (PixelPets.fading) requestAnimationFrame(tick);
        else requestAnimationFrame(() => requestAnimationFrame(r));
      };
      tick();
    });
    const bad = [];
    const shares = {};
    const walks = {};
    const mains = {};
    for (const [id, room] of Object.entries(rooms)) {
      PixelPets.goto(id, null, null, 'up');
      await settle();
      const info = PixelPets.mapInfo;
      const names = new Set([room.floor, room.floor + '_b', room.floor + '_c']);
      const chars = new Set(room.chars);
      let floorCells = 0;
      const bits = [];
      for (let y = 0; y < info.h; y++) for (let x = 0; x < info.w; x++) {
        const t = PixelPets.tileInfo(x, y);
        bits.push(t.walk ? '1' : '0');
        if (!chars.has(t.ch)) continue;
        floorCells++;
        if (!names.has(t.tile)) bad.push(id + ' ' + x + ',' + y + ' ' + t.ch + ' ' + t.tile);
      }
      if (!floorCells) bad.push(id + ' has no floor cells');
      const share = PixelPets.floorShare(id);
      shares[id] = share && { tile: share.tile, share: share.share, walk: share.walk };
      if (!share || share.share > 0.70) bad.push(id + ' share ' + (share && share.share));
      walks[id] = bits.join('');
      mains[id] = share && share.tile;
    }
    PixelPets.goto('hm_flats_5', null, null, 'up');
    await settle();
    const info = PixelPets.mapInfo;
    let flatTile = null;
    for (let y = 0; y < info.h && !flatTile; y++) for (let x = 0; x < info.w; x++) {
      const t = PixelPets.tileInfo(x, y);
      if (t.ch === '.') { flatTile = t.tile; break; }
    }
    const honey = HOUSE_SKINS.flats_home.remap['.'];
    return {
      v: PixelPets.state.v,
      cap: PixelPets.devChecks().floorCap,
      grids: FLOOR_FIX_TILES,
      bad, shares, walks, mains,
      flat: { tile: flatTile, honey },
    };
  }, expectRooms);

  expect(report.v).toBe(2);
  expect(report.cap).toEqual([]);
  expect(report.bad).toEqual([]);
  expect(report.grids).toEqual(grids);
  for (const [id, room] of Object.entries(expectRooms)) {
    expect(report.walks[id], id).toBe(room.walk);
    expect(report.shares[id].share, id + ' ' + report.shares[id].tile).toBeLessThanOrEqual(0.70);
  }
  const smFloors = SM.map(id => report.mains[id].replace(/_[bc]$/, ''));
  expect(new Set(smFloors).size).toBe(4);
  expect(smFloors).toEqual(['floor_den', 'floor_hold', 'floor_rock', 'floor_yard']);
  expect(report.flat.honey).toBe('floor_honey');
  expect(report.flat.tile.startsWith('floor_honey')).toBe(true);
});
