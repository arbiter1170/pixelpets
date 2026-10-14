/* Rename a Walkling you already have, the music volume slider, and the welcome-back line. */
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

function saveShot(page, name) {
  const w = page.viewportSize().width;
  if (w === 375) return Promise.resolve();
  const dir = path.join('screenshots', 'care');
  fs.mkdirSync(dir, { recursive: true });
  return page.screenshot({ path: path.join(dir, name + '-' + w + '.png') });
}

trackErrors(test, expect);

test('a Walkling you already have can be renamed, and the species name clears it', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page);
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.state && window.PixelPets.state.party[0]);
  await page.locator('#petStatsBtn').click();
  await expect(page.locator('#ovStats')).toBeVisible();
  await expect(page.locator('#scName')).toHaveText('Pipkit');
  await page.locator('#scRename').scrollIntoViewIfNeeded();
  await page.locator('#scRename').click();
  await expect(page.locator('#scNick')).toBeVisible();
  await page.locator('#scNickIn').fill('N<ib>  2');
  await saveShot(page, 'rename');
  await page.locator('#scNickOk').click();
  await expect(page.locator('#toast')).toHaveText('Pipkit is now called Nib 2!');
  await expect(page.locator('#scName')).toHaveText('Nib 2');
  await expect(page.locator('#hdrName')).toHaveText('Nib 2');
  const named = await page.evaluate(() => ({
    nick: PixelPets.state.party[0].nick,
    v: PixelPets.state.v,
    card: document.querySelector('#ownedList .slot-main').getAttribute('aria-label'),
  }));
  expect(named.nick).toBe('Nib 2');
  expect(named.v).toBe(2);
  expect(named.card).toBe('Nib 2, open');

  await page.locator('#scRename').click();
  await page.locator('#scNickIn').fill('Nope');
  await page.locator('#scNickIn').press('Escape');
  await expect(page.locator('#scNick')).toBeHidden();
  await expect(page.locator('#ovStats')).toBeVisible();
  expect(await page.evaluate(() => PixelPets.state.party[0].nick)).toBe('Nib 2');

  await page.locator('#scRename').click();
  await page.locator('#scNickIn').fill('Pipkit');
  await page.locator('#scNickOk').click();
  await expect(page.locator('#toast')).toHaveText('Nib 2 goes by Pipkit again.');
  const cleared = await page.evaluate(() => ({
    nick: PixelPets.state.party[0].nick,
    v: JSON.parse(localStorage.getItem('pixelpets.save.v2')).v,
  }));
  expect(cleared.nick).toBeNull();
  expect(cleared.v).toBe(2);
  await expect(page.locator('#scName')).toHaveText('Pipkit');
  await page.locator('#scClose').scrollIntoViewIfNeeded();
  await expect(page.locator('#scClose')).toBeInViewport();
});

test('the music volume slider saves a level and leaves the on/off switch alone', async ({ page }) => {
  const save = starterSave();
  save.settings.music = true;
  save.settings.musicVol = 0.5;
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page);
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.state);
  await page.locator('#settingsBtn').click();
  await expect(page.locator('#setVolRange')).toBeVisible();
  await expect(page.locator('#setVolVal')).toHaveText('50%');
  await expect(page.locator('#setMusicVal')).toHaveText('ON');
  await page.locator('#setVolRange').fill('20');
  await expect(page.locator('#setVolVal')).toHaveText('20%');
  const mid = await page.evaluate(() => ({
    vol: PixelPets.state.settings.musicVol,
    on: PixelPets.state.settings.music,
    heard: PixelPets.musicVol,
    v: PixelPets.state.v,
  }));
  expect(mid.vol).toBeCloseTo(0.2, 5);
  expect(mid.on).toBe(true);
  expect(mid.heard).toBeCloseTo(0.2, 5);
  expect(mid.v).toBe(2);
  await page.locator('#setVolRange').fill('0');
  await expect(page.locator('#setVolVal')).toHaveText('0%');
  await expect(page.locator('#setMusicVal')).toHaveText('ON');
  await saveShot(page, 'volume');
  await expect(page.locator('#setBuild')).toBeInViewport();
  const quiet = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')).settings);
  expect(quiet.musicVol).toBe(0);
  expect(quiet.music).toBe(true);
  expect(quiet.v).toBeUndefined();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')).v)).toBe(2);
  await page.locator('#setMusic').click();
  const off = await page.evaluate(() => ({
    on: PixelPets.state.settings.music,
    vol: PixelPets.state.settings.musicVol,
  }));
  expect(off.on).toBe(false);
  expect(off.vol).toBe(0);
});

test('fourteen hours away says welcome back, and a shorter gap does not', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true && window.PixelPets.state.party[0]);
  const short = await page.evaluate(() => {
    const rows = PixelPets.away(13);
    return { v: PixelPets.state.v, hunger: rows[0].hunger, happy: rows[0].happy, energy: rows[0].energy };
  });
  expect(short.v).toBe(2);
  expect(short.hunger).toBeGreaterThanOrEqual(20);
  expect(short.happy).toBeGreaterThanOrEqual(20);
  expect(short.energy).toBeGreaterThanOrEqual(10);
  await page.waitForTimeout(1600);
  await expect(page.locator('#toast')).not.toHaveClass(/show/);

  const back = await page.evaluate(() => {
    const rows = PixelPets.away(14);
    return { v: PixelPets.state.v, hunger: rows[0].hunger, happy: rows[0].happy, energy: rows[0].energy };
  });
  expect(back.v).toBe(2);
  expect(back.hunger).toBeGreaterThanOrEqual(20);
  expect(back.happy).toBeGreaterThanOrEqual(20);
  expect(back.energy).toBeGreaterThanOrEqual(10);
  await expect(page.locator('#toast')).toHaveText('Pipkit waited while you were away.');
  await expect(page.locator('#toast')).toHaveClass(/show/);
  await page.waitForTimeout(250);
  await saveShot(page, 'welcome');
});
