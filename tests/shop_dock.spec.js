/* The shop sheet sits above the Modern dock (Vincent, Oct 28, 2026). Before, the dock's opaque band (z 12 during scenes) covered
   the bottom of the sheet (z 11) and the item rows ran under it. Also: no overlay stays open at rest, so the scene-overlay dock
   rule in style.css only fires while something is really open. */
const path = require('path');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, artifactsDir } = require('./helpers');

trackErrors(test, expect);

async function boot(page) {
  const s = starterSave();
  s.money = 40;
  s.settings.follower = false;
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => { PixelPets.showTab('walk'); PixelPets.clock.set('tue', 12, 0); PixelPets.applyCtl('modern', false); });
}

test('Hesper\'s sheet stays clear of the Modern dock', async ({ page }) => {
  await boot(page);
  expect(await page.evaluate(() => document.querySelectorAll('.overlay:not([hidden])').length)).toBe(0);
  await page.evaluate(() => PixelPets.goto('hm_diner', 4, 2, 'left'));
  await page.waitForFunction(() => !window.PixelPets.fading);
  expect(await page.evaluate(() => PixelPets.talkTo('hm_hesper'))).toBe(true);
  for (let i = 0; i < 40 && !(await page.locator('#ovShop').isVisible()); i++) {
    await page.keyboard.press('Space');
    await page.waitForTimeout(60);
  }
  await page.waitForSelector('#ovShop:not([hidden])');
  const box = await page.evaluate(() => {
    const r = el => el.getBoundingClientRect();
    const dock = r(document.querySelector('#scr-walk .float-ctl'));
    const sheet = r(document.querySelector('#ovShop .shop-sheet'));
    const list = r(document.querySelector('#shopList'));
    const buys = [...document.querySelectorAll('#shopList .shop-buy')].map(b => r(b));
    return {
      mhc: document.body.classList.contains('mhc-frame'), scene: document.body.classList.contains('scene-on'),
      dockTop: dock.top, sheetBottom: sheet.bottom, listBottom: list.bottom,
      firstBuy: buys[0] && { top: buys[0].top, bottom: buys[0].bottom },
    };
  });
  expect(box.mhc && box.scene).toBe(true);
  expect(box.sheetBottom).toBeLessThanOrEqual(box.dockTop);
  // The list scrolls inside the sheet; the first row's BUY is whole and above the dock.
  expect(box.firstBuy.bottom).toBeLessThanOrEqual(Math.min(box.listBottom, box.dockTop) + 0.5);
  await page.screenshot({ path: path.join(artifactsDir('shop-dock'), 'hesper-' + page.viewportSize().width + '.png') });
});
