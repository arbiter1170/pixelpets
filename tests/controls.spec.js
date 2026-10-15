/* Q26 modern and arcade controls (NEXT_PLAN §3 Q26). Arcade is the old layout; modern is a full-screen map with floating buttons. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, boxesOverlap } = require('./helpers');

trackErrors(test, expect);

function modernSave(extra = {}) {
  const s = starterSave();
  s.flags['story.phone_got'] = true;
  Object.assign(s.settings, { controls: 'modern' }, extra);
  return s;
}

test('a save with no settings.controls stays arcade', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await expect(page.locator('#dpad')).toBeVisible();
  await expect(page.locator('#talkBtn')).toBeVisible();
  await expect(page.locator('#tabs')).toBeVisible();
  await expect(page.locator('#floatCtl')).toBeHidden();
  const st = await page.evaluate(() => ({ c: PixelPets.controls, v: PixelPets.state.v, q: document.querySelector('#questBtn').parentNode.id }));
  expect(st).toEqual({ c: { mode: 'arcade', joystick: false, dpad: null }, v: 2, q: 'tabs' });
});

test('modern fills the screen and every floating button works', async ({ page }) => {
  await installSave(page.context(), modernSave(), { quietDay: true });
  await gotoGame(page);
  await page.evaluate(() => PixelPets.showTab('walk'));
  for (const s of ['#top', '#tabs', '.walk-hud', '#dpad', '#talkBtn']) await expect(page.locator(s)).toBeHidden();
  const h = await page.evaluate(() => [document.querySelector('#app').getBoundingClientRect().height, document.querySelector('#mapWrap').getBoundingClientRect().height]);
  expect(Math.abs(h[0] - h[1])).toBeLessThanOrEqual(2);
  const ids = ['#questBtn', '#walkBagBtn', '#mapBtn', '#gearFloat', '#phoneBtn', '#colFloat', '#petFloat', '#petStrip'];
  const boxes = [];
  for (const id of ids) { const b = await page.locator(id).boundingBox(); expect(b.width).toBeGreaterThanOrEqual(44); expect(b.height).toBeGreaterThanOrEqual(44); boxes.push(b); }
  boxes.push(await page.locator('#envBadge').boundingBox(), await page.locator('#walkTip').boundingBox());
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) expect(boxesOverlap(boxes[i], boxes[j])).toBe(false);
  const pairs = [['#questBtn', '#ovQuest', '#questClose'], ['#walkBagBtn', '#ovBag', '#bagClose'], ['#mapBtn', '#ovMap', '#mapClose'],
    ['#gearFloat', '#ovSettings', '#setClose'], ['#phoneBtn', '#ovPhone', '#phoneClose'], ['#petStrip', '#ovStats', '#scClose']];
  for (const [btn, ov, close] of pairs) {
    await page.locator(btn).click();
    await expect(page.locator(ov)).toBeVisible();
    await page.waitForFunction(() => PixelPets.optionsReady !== false);
    await page.waitForTimeout(600);
    await page.locator(close).click();
    await expect(page.locator(ov)).toBeHidden();
  }
  await page.locator('#colFloat').click();
  await expect(page.locator('#scr-col')).toHaveClass(/active/);
  await page.locator('#scr-col .scr-back').click();
  await expect(page.locator('#scr-walk')).toHaveClass(/active/);
  await page.locator('#petFloat').click();
  await expect(page.locator('#scr-pet')).toHaveClass(/active/);
  await expect(page.locator('#settingsBtn')).toBeVisible();
  await page.locator('#scr-pet .scr-back').click();
  await expect(page.locator('#scr-walk')).toHaveClass(/active/);
});

test('Settings switches both ways, survives a reload, and puts nodes home', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.locator('#settingsBtn').click();
  await expect(page.locator('#setJoystick')).toBeHidden();
  await page.locator('#setControls').click();
  await expect(page.locator('#setControlsVal')).toHaveText('MODERN');
  await expect(page.locator('#setJoystick')).toBeVisible();
  await page.locator('#setClose').click();
  await expect(page.locator('#gearFloat')).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')).settings.controls);
  expect(saved).toBe('modern');
  await page.locator('#gearFloat').click();
  await page.locator('#setControls').click();
  await page.locator('#setClose').click();
  const home = await page.evaluate(() => ['#questBtn', '#phoneBtn', '#walkBagBtn', '#mapBtn'].map(s => document.querySelector(s).parentNode.id));
  expect(home).toEqual(['tabs', 'dpad', 'dpad', 'dpad']);
  await expect(page.locator('#dpad')).toBeVisible();
});

test('the joystick walks like a held arrow and ignores a tap', async ({ page }) => {
  await installSave(page.context(), modernSave({ joystick: true }), { quietDay: true });
  await gotoGame(page);
  await page.evaluate(() => PixelPets.showTab('walk'));
  const r = await page.locator('#joyRing').boundingBox();
  const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
  const x0 = await page.evaluate(() => PixelPets.state.world.x);
  await page.mouse.move(cx, cy); await page.mouse.down(); await page.mouse.up();
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => PixelPets.state.world.x)).toBe(x0);
  await page.mouse.move(cx, cy); await page.mouse.down(); await page.mouse.move(cx + 30, cy, { steps: 3 });
  expect(await page.evaluate(() => PixelPets.controls.dpad)).toBe('right');
  await page.waitForTimeout(600);
  await page.mouse.up();
  expect(await page.evaluate(() => PixelPets.controls.dpad)).toBe(null);
  expect(await page.evaluate(() => PixelPets.state.world.x)).toBeGreaterThan(x0);
});
