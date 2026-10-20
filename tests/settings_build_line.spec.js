/* Settings build line stays one line tall and unclipped (D380, PLAYTEST_FIX_1020).
   Widths come from the Playwright projects. The 390 project is opened at 390x664. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const VIEW = { '320': { width: 320, height: 568 }, '375': { width: 375, height: 667 }, '390': { width: 390, height: 664 } };

test('settings build line is 14 px and the close button stays in the panel', async ({ page }, info) => {
  const view = VIEW[info.project.name];
  await page.setViewportSize(view);
  await page.addInitScript(() => {
    localStorage.setItem('pp_reload_last', JSON.stringify([{ at: Date.UTC(2026, 9, 20, 16, 0), reason: 'boot' }]));
  });
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page);
  await page.locator('#settingsBtn').click();
  await expect(page.locator('#ovSettings')).toBeVisible();
  await expect(page.locator('#setBuild')).toBeVisible();
  await expect(page.locator('#setReload')).toBeVisible();
  const box = await page.evaluate(() => {
    const line = (el) => ({ h: el.offsetHeight, s: el.scrollHeight });
    const inner = document.querySelector('.settings-inner');
    const close = document.querySelector('#setClose').getBoundingClientRect();
    const panel = inner.getBoundingClientRect();
    return {
      build: line(document.querySelector('#setBuild')),
      reload: line(document.querySelector('#setReload')),
      scrollWidth: inner.scrollWidth,
      clientWidth: inner.clientWidth,
      close: { x: close.x, y: close.y, r: close.right, b: close.bottom },
      panel: { x: panel.x, y: panel.y, r: panel.right, b: panel.bottom },
    };
  });
  expect(box.build.h).toBe(14);
  expect(box.build.h).toBe(box.build.s);
  expect(box.reload.h).toBe(14);
  expect(box.reload.h).toBe(box.reload.s);
  expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth);
  expect(box.close.x).toBeGreaterThanOrEqual(box.panel.x);
  expect(box.close.y).toBeGreaterThanOrEqual(box.panel.y);
  expect(box.close.r).toBeLessThanOrEqual(box.panel.r);
  expect(box.close.b).toBeLessThanOrEqual(box.panel.b);
});
