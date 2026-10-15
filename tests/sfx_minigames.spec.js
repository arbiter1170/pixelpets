/* Smoke for sfx.js and minigames.js. Sound stays off. Reduced motion stays on.
   Widths come from the Playwright projects. A console error fails the test. */
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

test('muted boot opens and closes every minigame', async ({ page }) => {
  test.setTimeout(60000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page);
  const sound = await page.evaluate(() => ({
    muted: window.PixelPets.muted,
    reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    step: PPSound.play('step'),
    ids: PPMinigames.IDS.slice(),
  }));
  expect(sound.muted).toBe(true);
  expect(sound.reduced).toBe(true);
  expect(sound.step).toBe(false);
  expect(sound.ids.length).toBeGreaterThan(0);

  await page.evaluate(async () => {
    window.__mg = PPMinigames.play('lantern');
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
  await expect(page.locator('#ovPlay')).toBeVisible();
  const dir = '/opt/cursor/artifacts/screenshots';
  fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, 'minigame-' + page.viewportSize().width + '.png') });

  const report = await page.evaluate(async () => {
    PPMinigames.stop();
    await window.__mg;
    const out = [];
    for (const id of PPMinigames.IDS) {
      let opened = false;
      let closed = false;
      const pending = PPMinigames.play(id, {
        onOpen: () => { opened = true; },
        onClose: () => { closed = true; },
      });
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const shown = document.getElementById('ovPlay').hidden === false;
      PPMinigames.stop();
      const res = await pending;
      out.push({
        id: id,
        opened: opened,
        closed: closed,
        shown: shown,
        hidden: document.getElementById('ovPlay').hidden === true,
        quit: !!(res && res.quit),
      });
    }
    return out;
  });
  expect(report.map(r => r.id)).toEqual(sound.ids);
  for (const row of report) {
    expect(row.opened, row.id).toBe(true);
    expect(row.closed, row.id).toBe(true);
    expect(row.shown, row.id).toBe(true);
    expect(row.hidden, row.id).toBe(true);
    expect(row.quit, row.id).toBe(true);
  }
});
