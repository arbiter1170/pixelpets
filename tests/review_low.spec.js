// Review fixes, medium/low (Oct 28, 2026): the battle/pet backdrop cache stays capped through many resizes, and taps
// still work after a pagehide clears the open guard's pointer list.
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

async function boot(page) {
  const s = starterSave();
  s.settings.tips = false;
  s.flags['story.tutorial_done'] = true;
  s.flags['story.phone_got'] = true;
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
}

test('the backdrop cache keeps at most 8 canvases however often the screen resizes @w1', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.showTab('pet'));
  for (let h = 560; h <= 760; h += 20) {
    await page.setViewportSize({ width: 320 + ((h / 20) % 3) * 20, height: h });
    await page.waitForTimeout(120);
  }
  const n = await page.evaluate(() => PixelPets.bdCacheSize);
  expect(n).toBeGreaterThan(0);
  expect(n).toBeLessThanOrEqual(8);
});

test('after a pagehide the phone still opens and closes with taps @w1', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  await page.locator('#phoneBtn').tap();
  await expect(page.locator('#ovPhone')).toBeVisible();
  await page.waitForTimeout(200);
  await page.locator('#phoneClose').tap();
  await expect(page.locator('#ovPhone')).toBeHidden();
});
