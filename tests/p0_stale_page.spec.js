/* P0 (build 20261015-1305, Vincent's iPhone): after a reload the game showed the bare page (PARTNER, Lv 1, FOOD/JOY/NRG/GROW 0,
   no pet). Cause: GitHub Pages ignores ?v=, so a cached older index.html (here the real 20261015-1158 page) loads the newest
   scripts; boot() hit DOM ids the old page lacks and threw before the first HUD paint. Fix: null-safe binds, one
   cache-busting reload if boot still throws, and the service worker revalidates pages. The save must stay untouched.
   See tests/README.md. */
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave } = require('./helpers');

const OLD_PAGE = fs.readFileSync(path.join(__dirname, 'fixtures', 'index_1158.html'), 'utf8');

test('an old cached index.html with new scripts still boots the saved partner (P0 stale page)', async ({ page }) => {
  const save = starterSave();
  save.party[0].xp = 300;
  await installSave(page.context(), save, { quietDay: true });
  let served = 0;
  // Only the first page load gets the stale page, as a cache would; the recovery reload (fresh ?b=) gets the live one.
  await page.route(/\/(index\.html)?(\?.*)?$/, (route) => {
    if (route.request().resourceType() !== 'document' || served++ > 0) return route.continue();
    return route.fulfill({ contentType: 'text/html', body: OLD_PAGE });
  });
  await page.goto('/', { waitUntil: 'load' });
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.state && document.querySelector('#hdrLv').textContent !== 'Lv 1', null, { timeout: 15000 });
  const v = await page.evaluate(() => ({
    lv: document.querySelector('#hdrLv').textContent,
    food: document.querySelector('#valHunger').textContent,
    id: window.PixelPets.state.party[0].id,
    saved: JSON.parse(localStorage.getItem('pixelpets.save.v2')).party[0].id,
  }));
  expect(served).toBeGreaterThan(0);
  expect(v.lv).not.toBe('Lv 1');
  expect(v.food).not.toBe('0');
  expect(v.id).toBe('petsmoke1');
  expect(v.saved).toBe('petsmoke1');
});
