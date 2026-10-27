/* Online saves Phase 2: Link Google and Sign out UI (cloud.js). Live Google auth is not exercised in Playwright. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

async function bootOff(page, search) {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page, search);
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.state && window.PixelPets.state.v === 2);
}

test('PPCloud off exposes Phase 2 privacy copy and no-op link hooks', async ({ page }) => {
  await bootOff(page, '?cloud=off');
  const g = await page.evaluate(() => ({
    enabled: PPCloud.enabled,
    privacy: PPCloud.PRIVACY || '',
    link: typeof PPCloud.linkGoogle,
    signOut: typeof PPCloud.signOutGoogle,
  }));
  expect(g.enabled).toBe(false);
  expect(g.privacy).toMatch(/link Google/i);
  expect(g.link).toBe('function');
  expect(g.signOut).toBe('function');
});

test('Cloud save row is hidden when cloud is off', async ({ page }) => {
  await bootOff(page, '?cloud=off');
  expect(await page.locator('#setCloud').count()).toBe(0);
});
