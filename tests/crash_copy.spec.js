/* Copy crash info. Visible for ?debug=1 or when the NEWEST reload entry is a crash, even when Debug is off.
   The clipboard gets pp_diag plus the reload list. Nothing is sent. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

async function openSettings(page) {
  await page.locator('#settingsBtn').click();
  await expect(page.locator('#ovSettings')).toBeVisible();
}

test('the copy button stays hidden with no crash and no debug', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page);
  await openSettings(page);
  await expect(page.locator('#setCrashCopy')).toBeHidden();
  const sv = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  expect(sv.v).toBe(2);
});

test('a crash line shows the button with debug off, and the copy has the diag fields', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.addInitScript(() => {
    localStorage.setItem('pp_reload_last', JSON.stringify([
      { reason: 'crash', at: 1760000000000, screen: 'Walk', build: 'test' },
    ]));
  });
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page);
  await openSettings(page);
  const btn = page.locator('#setCrashCopy');
  await expect(btn).toBeVisible();
  await expect(btn).toHaveText('Copy crash info');
  const box = await btn.boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(box.width).toBeGreaterThanOrEqual(44);
  await btn.click();
  await expect(page.locator('#toast')).toHaveText('Copied.');
  const raw = await page.evaluate(() => navigator.clipboard.readText());
  const payload = JSON.parse(raw);
  expect(payload.diag).toEqual(expect.objectContaining({ live: expect.any(Number) }));
  expect(payload.reloads.some((e) => e && e.reason === 'crash')).toBe(true);
  expect(payload.build).toBe(await page.evaluate(() => window.BUILD));
  const sv = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  expect(sv.v).toBe(2);
});

test('?debug=1 shows the button with no crash, and a rejected clipboard still copies', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await openSettings(page);
  const btn = page.locator('#setCrashCopy');
  await expect(btn).toBeVisible();
  const box = await btn.boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(box.width).toBeGreaterThanOrEqual(44);
  await page.evaluate(() => {
    window.__copied = '';
    navigator.clipboard.writeText = () => Promise.reject(new Error('denied'));
    const orig = document.execCommand.bind(document);
    document.execCommand = (cmd) => {
      if (cmd === 'copy') {
        const ta = document.activeElement;
        window.__copied = ta && ta.value ? ta.value : '';
        return true;
      }
      return orig(cmd);
    };
  });
  await btn.click();
  await expect(page.locator('#toast')).toHaveText('Copied.');
  const raw = await page.evaluate(() => window.__copied);
  const payload = JSON.parse(raw);
  expect(payload.diag.live).toEqual(expect.any(Number));
  expect(Array.isArray(payload.reloads)).toBe(true);
});

async function bootWithReloads(page, list) {
  await page.addInitScript((list) => {
    if (sessionStorage.getItem('__reloadsSeeded')) return;
    sessionStorage.setItem('__reloadsSeeded', '1');
    localStorage.setItem('pp_reload_last', JSON.stringify(list));
  }, list);
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page);
  await openSettings(page);
}
// Really on screen: rendered (not hidden by an ancestor or CSS), a real box, inside the viewport.
const onScreen = (page, sel) => page.evaluate((sel) => {
  const el = document.querySelector(sel);
  if (!el || (el.checkVisibility && !el.checkVisibility({ checkVisibilityCSS: true }))) return null;
  const r = el.getBoundingClientRect();
  if (r.width <= 0 || r.height <= 0 || r.right <= 0 || r.bottom <= 0 || r.left >= innerWidth || r.top >= innerHeight) return null;
  return { w: r.width, h: r.height };
}, sel);

test('an older crash followed by a newer normal reload hides the button', async ({ page }) => {
  await bootWithReloads(page, [
    { reason: 'crash', at: 1760000000000, screen: 'Walk', build: 'test' },
    { reason: 'build', at: 1760000600000, screen: 'Walk', build: 'test' },
  ]);
  await expect(page.locator('#setReload')).toBeVisible();
  await expect(page.locator('#setReload')).toContainText('new build');
  await expect(page.locator('#setCrashCopy')).toBeHidden();
  expect(await onScreen(page, '#setCrashCopy')).toBeNull();
  expect(await page.locator('#setCrashCopy').boundingBox()).toBeNull();
});

test('the newest reload being a crash shows the button at 44 px or more', async ({ page }) => {
  await bootWithReloads(page, [
    { reason: 'build', at: 1760000000000, screen: 'Walk', build: 'test' },
    { reason: 'crash', at: 1760000600000, screen: 'Walk', build: 'test' },
  ]);
  await expect(page.locator('#setReload')).toContainText('crash?');
  const btn = page.locator('#setCrashCopy');
  await expect(btn).toBeVisible();
  await btn.scrollIntoViewIfNeeded();
  const box = await onScreen(page, '#setCrashCopy');
  expect(box).not.toBeNull();
  expect(box.h).toBeGreaterThanOrEqual(44);
  expect(box.w).toBeGreaterThanOrEqual(44);
});
