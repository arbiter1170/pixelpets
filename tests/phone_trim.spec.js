// Phone trim (Vincent, Nov 2, 2026): NOTES, KEEPERUAV and GLOW are gone from the Keeper1. The cracked handset keeps
// BOTNET (gigs, Census feed, the shelf) and also loses NOTES and GLOW. Captain Lumen no longer names KeeperUAV.
// Runs at 320, 375 and 390, in both motion settings. Save stays v2 with the same fields; an old save with a step log loads.
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const KEEPER_APPS = ['contacts', 'walklings', 'friends', 'news', 'ribbit', 'board', 'sky'];
const CRACKED_APPS = ['contacts', 'walklings', 'friends', 'jobs', 'news', 'ribbit', 'board', 'sky'];

function readySave() {
  const s = starterSave();
  s.settings.tips = false;
  Object.assign(s.flags, { 'story.tutorial_done': true, 'story.phone_got': true, 'story.reached_route1': true, 'story.rival1_done': true });
  s.world = { map: 'hearthmoor', x: 8, y: 9, facing: 'down', respawn: 'hearthmoor' };
  s.stepLog = { '2026-10-30': 40, '2026-10-31': 120 };   // written by the old GLOW build: still loads and stays
  return s;
}
async function boot(page) {
  await installSave(page.context(), readySave(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
}
async function hack(page) {
  await page.evaluate(() => { PixelPets.giveItem('cracked_phone', 1); PixelPets.setSide('glimmer'); PixelPets.showTab('walk'); });
}
const home = page => page.evaluate(() => {
  const shell = document.querySelector('#ovPhone .phone-shell'), grid = document.querySelector('#phoneHome');
  const shown = [...grid.querySelectorAll('.phone-app')].filter(b => getComputedStyle(b).display !== 'none');
  return {
    apps: shown.map(b => b.dataset.app),
    labels: shown.map(b => b.querySelector('.phone-lab').textContent),
    small: shown.filter(b => { const r = b.getBoundingClientRect(); return r.width < 44 || r.height < 44; }).map(b => b.dataset.app),
    painted: shown.every(b => { const c = b.querySelector('canvas'); return c.getContext('2d').getImageData(0, 0, 8, 8).data.some((v, i) => i % 4 === 3 && v > 0); }),
    fits: shell.scrollWidth <= shell.clientWidth + 1 && grid.scrollWidth <= grid.clientWidth + 1,
  };
});

for (const motion of ['no-preference', 'reduce']) {
  test(`Keeper1 shows no NOTES, KEEPERUAV or GLOW; the cracked handset keeps BOTNET (${motion} motion)`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: motion });
    await boot(page);
    const keys = () => page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('pixelpets.save.v2'))).sort());

    await page.locator('#phoneBtn').click();
    await expect(page.locator('#phoneTitle')).toHaveText('KEEPER1');
    const k = await home(page);
    expect(k.apps).toEqual(KEEPER_APPS);
    expect(k.labels.join(' ')).not.toMatch(/NOTES|KEEPERUAV|GLOW/);
    expect(k.small).toEqual([]);
    expect(k.painted).toBe(true);
    expect(k.fits).toBe(true);
    await expect(page.locator('#ovPhone')).not.toContainText(/KEEPERUAV|FIELD NOTES/);
    await page.locator('#phoneClose').click();
    // every Keeper1 app opens and closes without adding a save field
    const before = await keys();
    for (const app of ['contacts', 'friends', 'ribbit', 'board', 'sky']) {   // NEWS writes its own read marks (newsSeen)
      await page.locator('#phoneBtn').click();
      await page.locator(`.phone-app[data-app="${app}"]`).click();
      await expect(page.locator('#phonePane')).toBeVisible();
      await page.locator('#phoneClose').click();
    }
    expect(await keys()).toEqual(before);

    await hack(page);
    await page.locator('#phoneBtn').click();
    await expect(page.locator('#phoneTitle')).toHaveText('CRACK//HAND');
    const c = await home(page);
    expect(c.apps).toEqual(CRACKED_APPS);
    expect(c.labels).toContain('BOTNET');
    expect(c.labels.join(' ')).not.toMatch(/NOTES|KEEPERUAV|GLOW/);
    expect(c.small).toEqual([]);
    expect(c.painted).toBe(true);
    expect(c.fits).toBe(true);
    await page.locator('#phoneJobs').click();
    await expect(page.locator('#phoneBody')).toContainText('GIGS');
    await expect(page.locator('#phoneBody')).toContainText('OPEN THE SHELF');
    await page.locator('#phoneClose').click();

    const after = await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('pixelpets.save.v2')); return { keys: Object.keys(s), v: s.v, log: s.stepLog }; });
    expect(after.v).toBe(2);
    expect(after.keys.filter(k => /note|glow|uav/i.test(k))).toEqual([]);
    expect(after.log['2026-10-31']).toBe(120);   // the old step log is kept
  });
}

test('Captain Lumen no longer names KeeperUAV, and no player text does', async ({ page }) => {
  const root = path.resolve(__dirname, '..');
  const civic = JSON.parse(fs.readFileSync(path.join(root, 'data/civic.json'), 'utf8'));
  expect(JSON.stringify(civic)).not.toMatch(/KeeperUAV/i);
  expect(fs.readFileSync(path.join(root, 'index.html'), 'utf8')).not.toMatch(/KEEPERUAV|data-app="(notes|glow)"/);
  await boot(page);
  await page.locator('#phoneBtn').click();
  expect(await page.evaluate(() => document.body.innerText)).not.toMatch(/KEEPERUAV/i);
});
