/* Vincent's ruling (Oct 24, crash_1147): "Only check location silently if Safari already allows it; otherwise keep the
   last area until I tap Use my location." Boot, the 5 min timer and REFRESH read the device only when the Permissions
   API says 'granted'. 'prompt', 'denied', no Permissions API and a query that throws keep the cached area (the meadow
   when there is none). Only a USE MY LOCATION tap may call getCurrentPosition without a grant. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const AREA = '40.71,-74.01';

// state: 'granted' | 'prompt' | 'denied' | 'none' (no Permissions API) | 'throw' (query rejects)
// cache: 'fresh' | 'stale' (weather older than the TTL) | 'none'
async function bootWithGeo(page, state, cache = 'fresh', opts = {}) {
  const ctx = page.context();
  await installSave(ctx, starterSave(), { quietDay: true });
  await ctx.addInitScript(({ state, cache, area }) => {
    const now = Date.now(), age = cache === 'stale' ? 3 * 3600e3 : 60e3;
    localStorage.setItem('pixelpets.geo', 'allow');
    if (cache === 'none') localStorage.removeItem('pixelpets.env');
    else localStorage.setItem('pixelpets.env', JSON.stringify({ key: area,
      weather: { at: now - age, temp: 15, code: 1, wind: 5 },
      terrain: { at: now - 60e3, relief: null, elev: null, osm: null, place: { name: 'Test Park' }, partial: false } }));
    window.__geoCalls = 0;
    window.__permCalls = 0;
    const perms = state === 'none' ? undefined : { query: async () => { window.__permCalls++; if (state === 'throw') throw new TypeError('no geolocation'); return { state }; } };
    Object.defineProperty(navigator, 'permissions', { configurable: true, get: () => perms });
    // getCurrentPosition spy: counts every call and answers with the cached area
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: {
      getCurrentPosition(ok) { window.__geoCalls++; setTimeout(() => ok({ coords: { latitude: 40.71, longitude: -74.01, accuracy: 10 } }), 10); },
      watchPosition() { return 0; }, clearWatch() {},
    } });
  }, { state, cache, area: AREA });
  page.__weather = 0;
  // No real weather or map calls from tests.
  await page.route(/^https:\/\//, (route) => {
    if (/open-meteo\.com\/v1\/forecast/.test(route.request().url())) page.__weather++;
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  if (opts.clock) await page.clock.install();
  await gotoGame(page);
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.state);
  if (opts.clock) await page.clock.runFor(600);
  else await page.waitForTimeout(600);
}
const geoCalls = (page) => page.evaluate(() => window.__geoCalls);
const envNow = (page) => page.evaluate(() => window.PixelPets.env);

// Open the location card and return its button after checking it is really visible and at least 44 px.
async function cardButton(page) {
  const badge = page.locator('#envBadge');
  await expect(badge).toBeVisible();
  await badge.click();
  await expect(page.locator('#ovEnv')).toBeVisible();
  const use = page.locator('#envUseLoc');
  await expect(use).toBeVisible();
  const box = await use.boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(box.width).toBeGreaterThanOrEqual(44);
  return use;
}

test('granted: boot reads the device silently, and REFRESH reads it again without asking', async ({ page }) => {
  await bootWithGeo(page, 'granted');
  await page.waitForFunction(() => window.__geoCalls === 1);
  await page.waitForTimeout(300);
  expect(await geoCalls(page)).toBe(1);
  await expect(page.locator('#ovGeo')).toBeHidden();
  expect((await envNow(page)).coords).toBe(AREA);
  const use = await cardButton(page);
  await expect(use).toHaveText('REFRESH');
  await use.click();
  await expect(page.locator('#ovEnv')).toBeHidden();
  await page.waitForFunction(() => window.__geoCalls === 2);
});

test('prompt: boot and the 5 min timer never call getCurrentPosition and keep the cached area', async ({ page }) => {
  await bootWithGeo(page, 'prompt', 'stale', { clock: true });
  expect(await page.evaluate(() => window.__permCalls)).toBeGreaterThan(0);
  expect(await geoCalls(page)).toBe(0);
  await expect(page.locator('#ovGeo')).toBeHidden();
  let env = await envNow(page);
  expect(env.source).toBe('location');
  expect(env.coords).toBe(AREA);
  const permBefore = await page.evaluate(() => window.__permCalls);
  await page.clock.fastForward(5 * 60e3 + 1000);             // jump past one 5 min timer beat
  await page.clock.runFor(200);
  expect(await page.evaluate(() => window.__permCalls)).toBeGreaterThan(permBefore);
  expect(await geoCalls(page)).toBe(0);
  env = await envNow(page);
  expect(env.coords).toBe(AREA);
  expect(page.__weather).toBe(0);
});

test('prompt: the card offers USE MY LOCATION, and only that tap calls getCurrentPosition', async ({ page }) => {
  await bootWithGeo(page, 'prompt');
  expect(await geoCalls(page)).toBe(0);
  const use = await cardButton(page);
  await expect(use).toHaveText('USE MY LOCATION');
  await use.click();
  await expect(page.locator('#ovEnv')).toBeHidden();
  await page.waitForFunction(() => window.__geoCalls === 1);
  expect((await envNow(page)).coords).toBe(AREA);
});

test('prompt with no cached area: the meadow, and no device read', async ({ page }) => {
  await bootWithGeo(page, 'prompt', 'none');
  expect(await geoCalls(page)).toBe(0);
  const env = await envNow(page);
  expect(env.source).toBe('default');
  expect(env.tags).toContain('meadow');
});

test('denied: keeps the cached area, no device read, and the timer leaves it alone', async ({ page }) => {
  await bootWithGeo(page, 'denied');
  expect(await geoCalls(page)).toBe(0);
  let env = await envNow(page);
  expect(env.source).toBe('location');
  expect(env.coords).toBe(AREA);
  await page.evaluate(() => window.PPEnv.refresh());        // the same call the 5 min timer makes
  expect(await geoCalls(page)).toBe(0);
  env = await envNow(page);
  expect(env.coords).toBe(AREA);
});

test('denied with no cached area: falls back to the meadow', async ({ page }) => {
  await bootWithGeo(page, 'denied', 'none');
  expect(await geoCalls(page)).toBe(0);
  const env = await envNow(page);
  expect(env.source).toBe('default');
  expect(env.status).toBe('denied');
  expect(env.tags).toContain('meadow');
});

test('no Permissions API and stale cached weather: still no silent read, cached area kept', async ({ page }) => {
  await bootWithGeo(page, 'none', 'stale');
  expect(await geoCalls(page)).toBe(0);
  expect((await envNow(page)).coords).toBe(AREA);
  await page.evaluate(() => window.PPEnv.refresh());
  expect(await geoCalls(page)).toBe(0);
  const use = await cardButton(page);
  await expect(use).toHaveText('USE MY LOCATION');
});

test('a Permissions query that throws counts as not granted: no silent read', async ({ page }) => {
  await bootWithGeo(page, 'throw', 'stale');
  expect(await page.evaluate(() => window.__permCalls)).toBeGreaterThan(0);
  expect(await geoCalls(page)).toBe(0);
  expect((await envNow(page)).coords).toBe(AREA);
});

test('REFRESH without a grant refetches weather for the cached area and leaves the position alone', async ({ page }) => {
  await bootWithGeo(page, 'prompt');
  const before = page.__weather;
  await page.evaluate(() => window.PPEnv.refresh('refresh'));
  expect(await geoCalls(page)).toBe(0);
  expect(page.__weather).toBe(before + 1);
  expect((await envNow(page)).coords).toBe(AREA);
});
