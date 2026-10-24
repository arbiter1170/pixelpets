/* Boot and the 5 min timer must not make the browser ask for location again (crash_1147: iPhone Safari forgets the
   grant between page loads, so a boot read re-showed its prompt after every reload). A tap still asks. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

async function bootWithGeo(page, state) {
  const ctx = page.context();
  await installSave(ctx, starterSave(), { quietDay: true });
  await ctx.addInitScript((state) => {
    const now = Date.now();
    localStorage.setItem('pixelpets.geo', 'allow');
    localStorage.setItem('pixelpets.env', JSON.stringify({ key: '40.71,-74.01',
      weather: { at: now - 60e3, temp: 15, code: 1, wind: 5 },
      terrain: { at: now - 60e3, relief: null, elev: null, osm: null, place: { name: 'Test Park' }, partial: false } }));
    window.__geoCalls = 0;
    window.__permCalls = 0;
    const perms = state === 'none' ? undefined : { query: async () => { window.__permCalls++; return { state }; } };
    Object.defineProperty(navigator, 'permissions', { configurable: true, get: () => perms });
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: {
      getCurrentPosition(ok) { window.__geoCalls++; setTimeout(() => ok({ coords: { latitude: 40.71, longitude: -74.01, accuracy: 10 } }), 10); },
      watchPosition() { return 0; }, clearWatch() {},
    } });
  }, state);
  // No real weather or map calls from tests.
  await page.route(/^https:\/\//, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  await gotoGame(page);
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.state);
  await page.waitForTimeout(600);
}

test('allowed but the browser would ask: boot keeps the cached area and does not read the device', async ({ page }) => {
  await bootWithGeo(page, 'prompt');
  expect(await page.evaluate(() => window.__permCalls)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.__geoCalls)).toBe(0);
  await expect(page.locator('#ovGeo')).toBeHidden();
  const env = await page.evaluate(() => window.PixelPets.env);
  expect(env.source).toBe('location');
  expect(env.coords).toBe('40.71,-74.01');
  // A tap on REFRESH is the holder asking, so the device is read.
  const badge = page.locator('#envBadge');
  await expect(badge).toBeVisible();
  await badge.click();
  const use = page.locator('#envUseLoc');
  await expect(use).toBeVisible();
  await expect(use).toHaveText('REFRESH');
  const box = await use.boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(44);
  await use.click();
  await expect(use).toBeHidden();
  await page.waitForFunction(() => window.__geoCalls === 1);
});

test('allowed and already granted: boot reads the device once', async ({ page }) => {
  await bootWithGeo(page, 'granted');
  await page.waitForFunction(() => window.__geoCalls === 1);
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.__geoCalls)).toBe(1);
  await expect(page.locator('#ovGeo')).toBeHidden();
});

test('no Permissions API and fresh cached weather: boot does not read the device', async ({ page }) => {
  await bootWithGeo(page, 'none');
  expect(await page.evaluate(() => window.__geoCalls)).toBe(0);
  expect(await page.evaluate(() => window.PixelPets.env.coords)).toBe('40.71,-74.01');
});
