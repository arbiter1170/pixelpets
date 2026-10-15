/* Modern tap-to-walk: 4-direction search around solids. Widths are the Playwright projects (320, 375, 390). */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, shot } = require('./helpers');

trackErrors(test, expect);

function pathSave(flags = {}) {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.follower = false;
  s.flags['story.phone_got'] = true;
  s.flags['story.early_done'] = true;
  s.flags['story.rival1_done'] = true;
  Object.assign(s.flags, flags);
  return s;
}

async function boot(page, flags) {
  await installSave(page.context(), pathSave(flags), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForFunction(() => document.querySelector('#mapCanvas').width > 0);
}

async function place(page, map, x, y, facing) {
  await page.evaluate(({ map, x, y, facing }) => PixelPets.goto(map, x, y, facing), { map, x, y, facing });
  await page.waitForTimeout(80);
}

async function tapTile(page, tx, ty) {
  await page.evaluate(({ tx, ty }) => {
    const mc = document.querySelector('#mapCanvas');
    const cam = PixelPets.walk.cam;
    const r = mc.getBoundingClientRect();
    const cx = tx * 16 + 8 - cam.x, cy = ty * 16 + 8 - cam.y;
    const opt = { bubbles: true, cancelable: true, clientX: r.left + (cx / mc.width) * r.width, clientY: r.top + (cy / mc.height) * r.height, pointerId: 1, pointerType: 'touch', isPrimary: true };
    mc.dispatchEvent(new PointerEvent('pointerdown', opt));
    mc.dispatchEvent(new PointerEvent('pointerup', opt));
  }, { tx, ty });
}

async function at(page) {
  return page.evaluate(() => {
    const w = PixelPets.state.world;
    return { x: w.x, y: w.y, map: w.map };
  });
}

test('a free-tile tap walks around a person to the tile behind them', async ({ page }) => {
  await boot(page);
  await place(page, 'hm_rook_in', 1, 4, 'up');
  const path = await page.evaluate(() => PixelPets.findPath([{ x: 1, y: 2 }]));
  expect(path.length).toBeGreaterThan(1);
  expect(path.some(p => p.x === 1 && p.y === 3)).toBe(false);
  expect(path[path.length - 1]).toEqual({ x: 1, y: 2 });
  await tapTile(page, 1, 2);
  await expect.poll(() => at(page), { timeout: 8000 }).toEqual({ x: 1, y: 2, map: 'hm_rook_in' });
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
  await expect(page.locator('#ovScene')).toBeHidden();
  await shot(page, 'tap-path-around');
});

test('an unreachable tap stays put and says so', async ({ page }) => {
  await boot(page);
  await place(page, 'hm_rook_in', 3, 4, 'up');
  await tapTile(page, 0, 0);
  await expect(page.locator('#toast')).toHaveText("Can't get there from here.");
  const msg = await page.locator('#toast').textContent();
  expect(msg.length).toBeLessThanOrEqual(40);
  await page.waitForTimeout(400);
  expect(await at(page)).toEqual({ x: 3, y: 4, map: 'hm_rook_in' });
});

test('tapping a person still opens talk and does not walk through them', async ({ page }) => {
  await boot(page);
  await place(page, 'hm_rook_in', 3, 4, 'left');
  await tapTile(page, 1, 3);
  await expect.poll(() => page.evaluate(() => (PixelPets.scene && PixelPets.scene.text) || ''), { timeout: 8000 }).toContain('Rook');
  const pos = await at(page);
  expect(pos.x === 1 && pos.y === 3).toBe(false);
  expect(pos.map).toBe('hm_rook_in');
});

test('tapping a silent prop walks to the nearest open tile beside it', async ({ page }) => {
  await boot(page, { 'story.met_glimmerwell': true, 'story.faded_fuzzwick': true });
  await place(page, 'fernbrook', 13, 8, 'up');
  expect(await page.evaluate(() => PixelPets.tileInfo(13, 6).blocked)).toBe(true);
  await tapTile(page, 13, 6);
  await expect.poll(() => at(page), { timeout: 8000 }).toEqual({ x: 13, y: 7, map: 'fernbrook' });
  await expect(page.locator('#ovScene')).toBeHidden();
});

test('tapping a door still walks to the step and enters', async ({ page }) => {
  await boot(page);
  await place(page, 'hearthmoor', 3, 7, 'up');
  await tapTile(page, 3, 5);
  await expect.poll(() => at(page), { timeout: 8000 }).toEqual({ x: 4, y: 6, map: 'hm_home_in' });
});

test('tapping an open warp walks onto it', async ({ page }) => {
  await boot(page);
  await place(page, 'hm_rook_in', 3, 4, 'down');
  await tapTile(page, 3, 5);
  await expect.poll(() => at(page), { timeout: 8000 }).toEqual({ x: 16, y: 5, map: 'hearthmoor' });
});

test('a wild tap still chases on a straight line', async ({ page }) => {
  await boot(page);
  await place(page, 'hm_rook_in', 2, 4, 'right');
  const got = await page.evaluate(() => {
    PixelPets.clearWild();
    const w = PixelPets.spawnWild(0, 0, 5, 4);
    const mc = document.querySelector('#mapCanvas');
    const cam = PixelPets.walk.cam, r = mc.getBoundingClientRect();
    const cx = 5 * 16 + 8 - cam.x, cy = 4 * 16 + 8 - cam.y;
    const opt = { bubbles: true, cancelable: true, clientX: r.left + (cx / mc.width) * r.width, clientY: r.top + (cy / mc.height) * r.height, pointerId: 1, pointerType: 'touch', isPrimary: true };
    mc.dispatchEvent(new PointerEvent('pointerdown', opt));
    mc.dispatchEvent(new PointerEvent('pointerup', opt));
    const out = { spawned: !!w, path: PixelPets.walk.path, target: PixelPets.walk.target && { x: PixelPets.walk.target.x, y: PixelPets.walk.target.y } };
    PixelPets.clearWild();
    PixelPets.walk.target = null;
    return out;
  });
  expect(got.spawned).toBe(true);
  expect(got.path).toBeFalsy();
  expect(got.target).toEqual({ x: 5, y: 4 });
});

test('a blocked next step is walked around', async ({ page }) => {
  await boot(page);
  await place(page, 'hm_rook_in', 2, 4, 'right');
  await page.evaluate(() => {
    PixelPets.clearWild();
    PixelPets.spawnWild(0, 0, 4, 4);
    const w = PixelPets.walk;
    w.path = [{ x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 }];
    w.aim = { x: 5, y: 4, soft: false };
    w.target = null;
    w.arrive = null;
    w.repath = null;
  });
  const seen = [];
  await expect.poll(async () => {
    const p = await page.evaluate(() => {
      const w = PixelPets.state.world;
      return { x: w.x, y: w.y, map: w.map, battle: !!(PixelPets.battle && PixelPets.battle.on) };
    });
    seen.push(p);
    return p.map === 'hm_rook_in' && p.x === 5 && p.y === 4 && !p.battle;
  }, { timeout: 8000 }).toBe(true);
  expect(seen.some(p => p.x === 4 && p.y === 4)).toBe(false);
  expect(seen.some(p => p.battle)).toBe(false);
});

test('findPath stays inert without debug', async ({ page }) => {
  await installSave(page.context(), pathSave(), { quietDay: true });
  await gotoGame(page);
  const got = await page.evaluate(() => ({ v: PixelPets.state.v, path: PixelPets.findPath([{ x: 1, y: 2 }]) }));
  expect(got.v).toBe(2);
  expect(got.path).toBeUndefined();
});
