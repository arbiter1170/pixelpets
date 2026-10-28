// Oct 28, 2026 (Vincent): with TODAY open, no button closed it. mapReadySoon() flipped #ovEnv.hidden every frame to
// grey the MAP button; each flip re-armed the open guard on TODAY, so any tap longer than one frame was swallowed.
// Real fingers stay down ~100 ms. These taps hold for 150 ms, like a phone.
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

async function boot(page) {
  const s = starterSave();
  s.settings.tips = false;
  s.flags['story.tutorial_done'] = true;
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForFunction(() => document.querySelector('#mapCanvas').width > 0);
}

// A finger held 150 ms over the centre of `sel`.
async function slowTap(page, sel) {
  const b = await page.locator(sel).boundingBox();
  const x = b.x + b.width / 2, y = b.y + b.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.waitForTimeout(150);
  await page.mouse.up();
}

async function openToday(page) {
  await page.locator('#thChip').click();
  await expect(page.locator('#ovEnv')).toBeVisible();
  await page.waitForTimeout(300);   // past the opening tap, a few frames of the main loop
}

test('a held tap on OK closes TODAY', async ({ page }) => {
  await boot(page);
  await openToday(page);
  await slowTap(page, '#envClose');
  await expect(page.locator('#ovEnv')).toBeHidden();
});

test('a held tap on MAP leaves TODAY for the map', async ({ page }) => {
  await boot(page);
  await openToday(page);
  await expect(page.locator('#thMap')).toBeEnabled();
  await slowTap(page, '#thMap');
  await expect(page.locator('#ovEnv')).toBeHidden();
  await expect(page.locator('#ovMap')).toBeVisible();
});

test('TODAY stays open the whole time its buttons are being read, and its hidden flag never flickers', async ({ page }) => {
  await boot(page);
  await openToday(page);
  const flips = await page.evaluate(() => new Promise(done => {
    let n = 0;
    const mo = new MutationObserver(() => { n++; });
    mo.observe(document.querySelector('#ovEnv'), { attributes: true, attributeFilter: ['hidden'] });
    setTimeout(() => { mo.disconnect(); done(n); }, 500);
  }));
  expect(flips).toBe(0);
  await expect(page.locator('#thMap')).toBeEnabled();   // the MAP state is still read as if TODAY were shut
});
