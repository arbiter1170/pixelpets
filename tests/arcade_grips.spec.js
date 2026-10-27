/* ARCADE_GRIPS (Vincent, Oct 27, 2026): arcade held sideways keeps the pad but takes modern's layout, with the pad on a left grip
   and TALK on a right grip outside the game window. Upright arcade keeps its boxes (paint only). Runs once, on the 390 project. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, boxesOverlap } = require('./helpers');

trackErrors(test, expect);
test.beforeEach(async ({}, info) => { test.skip(info.project.name !== '390', 'sideways sizes are set in the test; one project is enough'); });

const SIDE = [{ width: 844, height: 390 }, { width: 667, height: 375 }, { width: 568, height: 320 }];
const inside = (b, w, h) => b.x >= 0 && b.y >= 0 && b.x + b.width <= w + 0.5 && b.y + b.height <= h + 0.5;

for (const vp of SIDE) {
  test(`sideways arcade: grips outside the game window, modern buttons inside (${vp.width}x${vp.height})`, async ({ page }) => {
    await page.setViewportSize(vp);
    await installSave(page.context(), starterSave(), { quietDay: true });
    await gotoGame(page);
    await page.evaluate(() => PixelPets.showTab('walk'));
    await page.waitForTimeout(300);
    const lay = await page.evaluate(() => ({ layout: PixelPets.layout, pick: PixelPets.controls.mode, pad: document.querySelector('#dpad').parentNode.id, talk: document.querySelector('#talkBtn').parentNode.id, mhc: document.body.classList.contains('mhc-frame') }));
    expect(lay).toEqual({ layout: { mode: 'modern', land: true, grips: true }, pick: 'arcade', pad: 'gripPad', talk: 'gripTalk', mhc: false });
    for (const s of ['#gripL', '#gripR', '#dpad', '#talkBtn', '#floatCtl']) await expect(page.locator(s)).toBeVisible();
    for (const s of ['#tabs', '#top', '#statStrip']) await expect(page.locator(s)).toBeHidden();
    const app = await page.locator('#app').boundingBox();
    const pad = await page.locator('#dpad').boundingBox(), talk = await page.locator('#talkBtn').boundingBox();
    expect(pad.x + pad.width).toBeLessThanOrEqual(app.x + 0.5);       // left of the game window
    expect(talk.x).toBeGreaterThanOrEqual(app.x + app.width - 0.5);   // right of it
    expect(Math.abs(app.x - (vp.width - (app.x + app.width)))).toBeLessThanOrEqual(1);   // the column is centred
    // COMPACT: the grips are as narrow as a 44 px pad allows, so the window is the screen less two 148 px grips (no 480 cap).
    expect(Math.abs(app.width - (vp.width - 2 * 148))).toBeLessThanOrEqual(1);
    // 2x, never 3x: the wider window shows more world (the canvas is about half the window in game pixels).
    expect(await page.evaluate(() => document.querySelector('#mapCanvas').width)).toBeGreaterThanOrEqual(Math.floor(app.width / 2) - 16);
    for (const b of [pad, talk]) { expect(inside(b, vp.width, vp.height)).toBe(true); expect(b.width).toBeGreaterThanOrEqual(44); expect(b.height).toBeGreaterThanOrEqual(44); }
    for (const dir of ['up', 'down', 'left', 'right']) { const b = await page.locator(`.dp[data-dir="${dir}"]`).boundingBox(); expect(b.width).toBeGreaterThanOrEqual(44); expect(inside(b, vp.width, vp.height)).toBe(true); }
    const ids = ['#repBtn', '#questBtn', '#walkBagBtn', '#mapBtn', '#gearFloat', '#colFloat', '#petFloat', '#petStrip'];
    const boxes = [];
    for (const id of ids) {
      const b = await page.locator(id).boundingBox();
      expect(b.width).toBeGreaterThanOrEqual(44); expect(b.height).toBeGreaterThanOrEqual(44);
      expect(b.x).toBeGreaterThanOrEqual(app.x - 0.5); expect(b.x + b.width).toBeLessThanOrEqual(app.x + app.width + 0.5);
      boxes.push(b);
    }
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) expect(boxesOverlap(boxes[i], boxes[j])).toBe(false);
  });
}

test('sideways arcade: the pad walks, TALK is the one talk button, and the tip still says pad', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForTimeout(300);
  expect(await page.locator('#talkBtn').count()).toBe(1);
  await expect(page.locator('#walkTip')).not.toContainText('Tap the ground');
  const x0 = await page.evaluate(() => PixelPets.state.world.x);
  const b = await page.locator('.dp[data-dir="right"]').boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down();
  expect(await page.evaluate(() => PixelPets.controls.dpad)).toBe('right');
  await page.waitForTimeout(700);
  await page.mouse.up();
  expect(await page.evaluate(() => PixelPets.controls.dpad)).toBe(null);
  expect(await page.evaluate(() => PixelPets.state.world.x)).toBeGreaterThan(x0);
});

test('turning the phone moves the pad between the grip and the walk screen, and saves nothing', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page);
  await page.evaluate(() => PixelPets.showTab('walk'));
  const home = () => page.evaluate(() => ({ grips: PixelPets.layout.grips, pad: document.querySelector('#dpad').parentNode.className, talk: document.querySelector('#talkBtn').parentNode.id,
    corners: ['#phoneBtn', '#walkBagBtn', '#mapBtn'].map(s => document.querySelector(s).parentNode.id), quest: document.querySelector('#questBtn').parentNode.id }));
  expect(await home()).toEqual({ grips: false, pad: 'walk-ctl', talk: 'dpad', corners: ['dpad', 'dpad', 'dpad'], quest: 'tabs' });
  const saved0 = await page.evaluate(() => localStorage.getItem('pixelpets.save.v2'));
  await page.setViewportSize({ width: 844, height: 390 });
  await expect.poll(() => page.evaluate(() => PixelPets.layout.grips)).toBe(true);
  expect(await page.evaluate(() => document.querySelector('#dpad').parentNode.id)).toBe('gripPad');
  await expect(page.locator('#gripL')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => PixelPets.layout.grips)).toBe(false);
  expect(await home()).toEqual({ grips: false, pad: 'walk-ctl', talk: 'dpad', corners: ['dpad', 'dpad', 'dpad'], quest: 'tabs' });
  await expect(page.locator('#gripL')).toBeHidden();
  await expect(page.locator('#tabs')).toBeVisible();
  const saved1 = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')).settings.controls);
  expect(saved1).toBe(JSON.parse(saved0).settings.controls);
});

test('sideways modern has no grips', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  const s = starterSave(); s.settings.controls = 'modern';
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await expect(page.locator('#gripL')).toBeHidden();
  await expect(page.locator('#gripR')).toBeHidden();
  expect(await page.evaluate(() => PixelPets.layout)).toEqual({ mode: 'modern', land: true, grips: false });
});

test('upright arcade: the 44 px pad gives the map its height back', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForTimeout(200);
  const r = await page.evaluate(() => { const b = document.querySelector('#mapCanvas').getBoundingClientRect(), d = document.querySelector('#dpad').getBoundingClientRect(); return { mw: [Math.round(b.width), Math.round(b.height)], pad: [Math.round(d.width), Math.round(d.height)], arcade: document.body.classList.contains('ctl-arcade') }; });
  expect(r).toEqual({ mw: [354, 450], pad: [136, 136], arcade: true });   // was 354x426 with a 160 pad
});
