// Review fixes (Oct 28, 2026): an error in one frame no longer stops the main loop; a failed save is told once; the
// service worker keeps one copy of each file (no ?v=<build> copies) and precaches clock.js, mv_fx.js and net.js.
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

async function boot(page) {
  const s = starterSave();
  s.settings.tips = false;
  s.flags['story.tutorial_done'] = true;
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
}

test('an error inside a frame is reported, and the next frames still run', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await boot(page);
  const before = await page.evaluate(() => PixelPets.frameCount());
  await page.evaluate(() => PixelPets.breakFrames(3));
  await page.waitForTimeout(800);
  const after = (await page.evaluate(() => PixelPets.frameCount())) - before;
  expect(errors.filter(m => /debug: broken frame/.test(m))).toHaveLength(3);
  expect(errors.filter(m => !/debug: broken frame/.test(m))).toEqual([]);
  expect(after).toBeGreaterThan(10);   // the loop kept going (~45 frames in 800 ms)
  const logged = await page.evaluate(() => JSON.parse(localStorage.getItem('pp_errors') || '[]').map(e => e.message));
  expect(logged.some(m => /debug: broken frame/.test(m))).toBe(true);
});

test.describe(() => {
  trackErrors(test, expect);

  test('a save the browser refuses is told once, and the game keeps playing @w1', async ({ page }) => {
    await boot(page);
    await page.evaluate(() => {
      const real = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) { if (k === 'pixelpets.save.v2') throw new DOMException('full', 'QuotaExceededError'); return real.call(this, k, v); };
    });
    await page.evaluate(() => PixelPets.setFlag('story.test_save_fail', true));
    await page.evaluate(() => PixelPets.save && PixelPets.save());
    await page.waitForTimeout(5600);   // past one 5 s autosave
    const seen = await page.evaluate(() => document.body.innerText.includes("Couldn't save."));
    expect(seen).toBe(true);
    expect(await page.evaluate(() => !!PixelPets.state.flags['story.test_save_fail'])).toBe(true);
  });

  test('the worker keeps one plain copy per file and precaches clock, move effects and net @w1', async ({ page }) => {
    await boot(page);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15000 });
    await page.evaluate(async () => { await fetch('game.js?v=test-a'); await fetch('game.js?v=test-b'); await fetch('sprites.js?v=test-a'); });
    const keys = await page.evaluate(async () => { const c = await caches.open('walklings-shell'); return (await c.keys()).map(r => new URL(r.url)); });
    expect(keys.filter(u => u.search)).toEqual([]);
    const paths = keys.map(u => u.pathname.split('/').pop());
    expect(paths.filter(p => p === 'game.js')).toHaveLength(1);
    for (const f of ['clock.js', 'mv_fx.js', 'net.js']) expect(paths).toContain(f);
  });
});
