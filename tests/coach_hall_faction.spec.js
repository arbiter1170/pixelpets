/* Two fixes, one spec. Runs at 320, 375 and 390 in Modern controls (Arcade only for the pad check), one reduced-motion run,
   zero console errors, save pixelpets.save.v2 with v 2 and no new keys.
   1. The Lantern Coach in Hearthmoor can be boarded. data/civic.json puts the Keeper House roof on row 9 columns 10-13, so the
      coach tile (12,9), Porter Bram and the coach sign stood on roof tiles. The coach now sits at (16,9) on a path tile, in the
      grass nook above the Lantern House roof, with Bram at (15,9) and the sign at (17,9). hc_south still lands on (12,8) (D122).
   2. The battle faction table calls Hall Masters faction `none`, not `keepers` (D1437); their battles keep the trial loop. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const COACH = { x: 16, y: 9 };

function citySave(controls, world) {
  const s = starterSave();
  s.settings.controls = controls || 'modern';
  s.settings.follower = false;
  Object.assign(s.flags, {
    'story.side_pick_done': true, 'story.side': 'keepers', 'story.hc_invite': true, 'story.cobble_end': true,
    'story.seal1': true, 'story.heights_done': true, 'story.hc_council_done': true,
    'story.hc_greeted': true,   // the city is live: a first coach arrival plays the parade; these tests are about the ride, so the holder was greeted already
  });
  s.standing = { keepers: 10, glimmer: 0 };
  s.world = Object.assign({ map: 'hearthmoor', x: COACH.x, y: COACH.y - 1, facing: 'down', respawn: 'hearthmoor' }, world || {});
  return s;
}

async function boot(page, s, opts = {}) {
  if (opts.reduce) await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && PixelPets.state && PixelPets.state.party[0]);
  await page.evaluate(() => { PixelPets.showTab('walk'); PixelPets.clearWild(); });
}

// The live state plus the stored copy's v (the stored copy is written on the next save, so compare the live state).
const stored = page => page.evaluate(() => {
  const raw = localStorage.getItem('pixelpets.save.v2');
  return Object.assign(JSON.parse(JSON.stringify(PixelPets.state)), { storedV: raw ? JSON.parse(raw).v : null });
});
const where = page => page.evaluate(() => ({ map: PixelPets.state.world.map, x: PixelPets.state.world.x, y: PixelPets.state.world.y }));

// A real tap on the map canvas over tile (x, y), once the camera has stopped easing.
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
    return { cx, cy, onCanvas: cx >= b.left && cx <= b.right && cy >= b.top && cy <= b.bottom, vw: innerWidth, vh: innerHeight };
  }, { x, y });
  expect(r.onCanvas && r.cx >= 0 && r.cx <= r.vw && r.cy >= 0 && r.cy <= r.vh, 'tile ' + x + ',' + y + ' on screen').toBe(true);
}

// The save after boarding: v 2, no key removed, and the only story flag added is story.hc_arrived. `care` and `stepLog` are the
// existing day-care and step bookkeeping every walk writes (already in normalizeV2), not new fields.
const WALK_KEYS = ['care', 'stepLog'];
function sameSaveBut(before, after) {
  expect(after.v).toBe(2);
  expect(after.storedV).toBe(2);
  const keys = o => Object.keys(o).filter(k => !WALK_KEYS.includes(k)).sort();
  expect(keys(after)).toEqual(keys(before));
  // story.early_steps (the step counter) and story.unlock_* (an unlock card seen) are bookkeeping any step can write.
  const added = Object.keys(after.flags).filter(k => !(k in before.flags) && /^story\./.test(k) && !/^story\.(early_steps|unlock_)/.test(k));
  expect(added).toEqual(['story.hc_arrived']);
  for (const k of Object.keys(before.flags)) if (/^story\./.test(k) && k !== 'story.early_steps') expect(after.flags[k], k).toEqual(before.flags[k]);
  expect(after.party.map(p => p.id)).toEqual(before.party.map(p => p.id));
}

test('the coach, Porter Bram and the coach sign stand on open ground, and only the road steps onto the coach', async ({ page }) => {
  await boot(page, citySave('modern'));
  const r = await page.evaluate(({ x, y }) => {
    const ids = ['hm_to_hc', 'hm_bram', 'hm_sign_coach'];
    const objs = Object.fromEntries(PixelPets.mapObjs.filter(o => ids.includes(o.id)).map(o => [o.id, [o.x, o.y]]));
    const tile = (tx, ty) => { const t = PixelPets.tileInfo(tx, ty); return { ch: t.ch, walk: t.walk }; };
    return {
      objs, coach: tile(x, y), bram: tile(x - 1, y), sign: tile(x + 1, y), road: PixelPets.tileInfo(x, y - 1).blocked,
      below: PixelPets.tileInfo(x, y + 1).solid, keeperRoof: [10, 11, 12, 13].map(c => PixelPets.tileInfo(c, 9).ch).join(''),
      gaps: PixelPets.auditTaps().reachGaps.filter(g => g.indexOf('hearthmoor:') === 0),
    };
  }, COACH);
  expect(r.objs).toEqual({ hm_to_hc: [16, 9], hm_bram: [15, 9], hm_sign_coach: [17, 9] });
  expect(r.coach).toEqual({ ch: 'p', walk: true });   // the lantern mark is a path tile
  expect(r.bram.walk).toBe(true);
  expect(r.sign.walk).toBe(true);
  expect(r.road).toBe(false);
  expect(r.below).toBe(true);                          // the Lantern House roof: the coach is a nook off the road
  expect(r.keeperRoof).toBe('RRRR');                   // the Keeper House is unchanged
  expect(r.gaps).toEqual([]);
  expect(await page.evaluate(() => PixelPets.questCheck)).toEqual([]);
});

test('a Modern tap on the coach boards it and lands on the south gate', async ({ page }) => {
  await boot(page, citySave('modern'));
  const before = await stored(page);
  expect(await page.evaluate(() => PixelPets.controls.mode)).toBe('modern');
  await tapTile(page, COACH.x, COACH.y);
  await expect.poll(() => where(page), { timeout: 10000 }).toEqual({ map: 'highcharity', x: 32, y: 37 });
  expect(await page.evaluate(() => PixelPets.state.flags['story.hc_arrived'])).toBe(true);
  await expect.poll(() => page.evaluate(() => !PixelPets.fading)).toBe(true);
  sameSaveBut(before, await stored(page));
});

test('reduced motion: a Modern tap still boards the coach', async ({ page }) => {
  await boot(page, citySave('modern', { x: 14, y: 8, facing: 'right' }), { reduce: true });
  const before = await stored(page);
  await tapTile(page, COACH.x, COACH.y);
  await expect.poll(() => where(page), { timeout: 10000 }).toEqual({ map: 'highcharity', x: 32, y: 37 });
  sameSaveBut(before, await stored(page));
});

test('Arcade: the pad steps down onto the coach and boards it', async ({ page }) => {
  await boot(page, citySave('arcade'));
  const before = await stored(page);
  await expect(page.locator('#dpad')).toBeVisible();
  await page.waitForTimeout(300);
  const b = await page.locator('.dp[data-dir="down"]').boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await expect.poll(() => where(page), { timeout: 10000 }).toEqual({ map: 'highcharity', x: 32, y: 37 });
  await page.mouse.up();
  sameSaveBut(before, await stored(page));
});

test('the way back lands on the road, and the coach is one step away (D122) @w1', async ({ page }) => {
  await boot(page, citySave('modern'));
  const r = await page.evaluate(() => {
    PixelPets.goto('highcharity', 32, 37, 'down');
    const south = PixelPets.mapObjs.find(o => o.id === 'hc_south');
    return { south: south && [south.x, south.y] };
  });
  expect(r.south).toEqual([32, 38]);
  await page.evaluate(() => PixelPets.walkStep('down'));
  await expect.poll(() => where(page), { timeout: 10000 }).toEqual({ map: 'hearthmoor', x: 12, y: 8 });
  expect(await page.evaluate(() => PixelPets.tileInfo(12, 8).blocked)).toBe(false);
});

test('D1437: Hall Masters are faction none in the battle table and keep the trial loop, on both sides', async ({ page }) => {
  await boot(page, citySave('modern'));
  const before = await stored(page);
  const read = () => page.evaluate(() => {
    const ids = ['hall1_fen', 'hall2_hale', 'hall3_marisol'];
    return {
      hall: ids.map(id => [id, PixelPets.trainerFaction(id), PixelPets.battleTrack('trainer', id)]),
      glimmer: ['fern_associate', 'gb_imogen', 'bw_dorian'].map(id => PixelPets.trainerFaction(id)),
      keepers: PixelPets.debugCatalog().trainers.filter(id => PixelPets.trainerFaction(id) === 'keepers'),
    };
  });
  const keeper = await read();
  expect(keeper.hall).toEqual([['hall1_fen', 'none', 'trial'], ['hall2_hale', 'none', 'trial'], ['hall3_marisol', 'none', 'trial']]);
  expect(keeper.glimmer).toEqual(['glimmer', 'glimmer', 'glimmer']);
  expect(keeper.keepers).toEqual([]);   // no holder in the table is a Keeper now
  await page.evaluate(() => PixelPets.setSide('glimmer'));
  const glim = await read();
  expect(glim.hall).toEqual(keeper.hall);
  const after = await stored(page);
  expect(after.v).toBe(2);
  expect(after.storedV).toBe(2);
  expect(Object.keys(after).sort()).toEqual(Object.keys(before).sort());
  const f = o => { const c = Object.assign({}, o.flags); delete c['story.side']; delete c['story.unlock_sides']; return c; };   // what setSide writes
  expect(f(after)).toEqual(f(before));
});
