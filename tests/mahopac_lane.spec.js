/* PLAYTEST_FIX_1020 (D381-D383, D388): the Hearthmoor north lane. One Modern tap on the trail mouth walks to Mahopac,
   the exit tiles are never under the HUD, and the lane is at least 3 tiles wide. Widths are the projects (320, 375, 390). */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

function laneSave(flags = {}) {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.follower = false;
  Object.assign(s.flags, { 'story.phone_got': true, 'story.early_done': true, 'story.rival1_done': true,
    'story.mom_met': true, 'story.mom_chore': true, 'story.mom_sent': true }, flags);
  return s;
}
async function boot(page, flags) {
  await installSave(page.context(), laneSave(flags), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForFunction(() => document.querySelector('#mapCanvas').width > 0);
}
// Screen point of a tile centre, and what a real finger would hit there.
async function tilePoint(page, tx, ty) {
  return page.evaluate(({ tx, ty }) => {
    const mc = document.querySelector('#mapCanvas'), cam = PixelPets.walk.cam, r = mc.getBoundingClientRect();
    const x = r.left + ((tx * 16 + 8 - cam.x) / mc.width) * r.width, y = r.top + ((ty * 16 + 8 - cam.y) / mc.height) * r.height;
    const el = document.elementFromPoint(x, y);
    return { x, y, hit: el ? el.id : null };
  }, { tx, ty });
}

test('one tap on the trail mouth walks from the town square into Mahopac', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.goto('hearthmoor', 9, 8, 'up'));
  await page.waitForTimeout(300);
  for (const x of [8, 9, 10]) {
    const p = await tilePoint(page, x, 2);
    expect(p.hit, 'exit tile ' + x + ',2 is not under the HUD').toBe('mapCanvas');
  }
  const p = await tilePoint(page, 9, 2);
  await page.touchscreen.tap(p.x, p.y);
  await expect.poll(() => page.evaluate(() => PixelPets.state.world.map), { timeout: 8000 }).toBe('mahopac');
  const w = await page.evaluate(() => ({ x: PixelPets.state.world.x, y: PixelPets.state.world.y, v: PixelPets.state.v, f: PixelPets.state.flags['story.reached_mahopac'] }));
  expect(w).toEqual({ x: 9, y: 14, v: 2, f: true });
});

test('the way back from Mahopac lands on the lane, below the exits', async ({ page }) => {
  await boot(page, { 'story.reached_mahopac': true });
  await page.evaluate(() => PixelPets.goto('mahopac', 9, 14, 'down'));
  await page.evaluate(() => { PixelPets.walk.queued = [0, 1]; });
  await expect.poll(() => page.evaluate(() => PixelPets.state.world.map), { timeout: 8000 }).toBe('hearthmoor');
  expect(await page.evaluate(() => ({ x: PixelPets.state.world.x, y: PixelPets.state.world.y }))).toEqual({ x: 9, y: 3 });
});

test('every lane start finds a short path, and the lane is 3 tiles wide', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    const out = {};
    for (const [k, x, y] of [['home', 3, 6], ['lantern', 16, 14], ['east_gate', 22, 8], ['keeper', 11, 12], ['school', 4, 19]]) {
      PixelPets.goto('hearthmoor', x, y, 'up');
      const p = PixelPets.findPath([{ x: 9, y: 2 }]); out[k] = p ? p.length : null;
    }
    const open = [];
    for (let y = 3; y <= 7; y++) open.push([8, 9, 10].filter(x => !PixelPets.tileInfo(x, y).blocked).length);
    return { out, open };
  });
  expect(r.out).toEqual({ home: 10, lantern: 19, east_gate: 19, keeper: 18, school: 32 });
  for (const n of r.open.slice(0, 4)) expect(n).toBe(3);   // rows 3-6; row 7 has the town board at (8,7)
});

test('before Mom says go, the gate still holds at the trail mouth', async ({ page }) => {
  await boot(page, { 'story.mom_sent': false });
  await page.evaluate(() => PixelPets.goto('hearthmoor', 9, 4, 'up'));
  await page.evaluate(() => { PixelPets.walk.queued = [0, -1]; });
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.id === 'north_closed');
  expect(await page.evaluate(() => PixelPets.state.flags['story.reached_mahopac'] === true)).toBe(false);
});
