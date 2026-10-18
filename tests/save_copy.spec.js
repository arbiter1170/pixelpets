/* Build 7: download the v2 save before Start over, wipe, and read the file back. */
const fs = require('fs');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, shot } = require('./helpers');

trackErrors(test, expect);

async function bootRoundTrip(page) {
  const save = starterSave();
  save.flags['story.side'] = 'glimmer';
  await page.addInitScript((seed) => {
    if (sessionStorage.getItem('pp-copy-seed')) return;
    sessionStorage.setItem('pp-copy-seed', '1');
    const d = new Date();
    const day = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    seed.flags['daily.hello'] = day;
    seed.flags['daily.warm_bowl'] = day;
    seed.last = Date.now();
    localStorage.setItem('pixelpets.save.v2', JSON.stringify(seed));
    localStorage.setItem('pixelpets.geo', 'deny');
    localStorage.setItem('pixelpets.mute', '1');
  }, save);
  await gotoGame(page);
  await page.waitForFunction(() => window.PixelPets.state && window.PixelPets.state.party.length === 1);
}

test('a copy survives Start over and comes back as the same game', async ({ page }) => {
  test.setTimeout(60000);
  await bootRoundTrip(page);
  await page.locator('#settingsBtn').click();
  await expect(page.locator('#setCopy')).toBeVisible();
  await expect(page.locator('#setRead')).toBeVisible();
  await expect(page.locator('#setBuild')).toBeInViewport();
  await shot(page, 'save-copy-settings');
  await page.locator('#startOver').click();
  await expect(page.locator('#resetCopy')).toBeVisible();
  await expect(page.locator('#resetHint')).toHaveText('Save a copy first. Hold START OVER to erase this game.');
  await shot(page, 'save-copy-reset');

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#resetCopy').click(),
  ]);
  const text = await fs.promises.readFile(await download.path(), 'utf8');
  const file = JSON.parse(text);
  expect(file.v).toBe(2);
  expect(file.party[0].id).toBe('petsmoke1');
  expect(file.flags['story.side']).toBe('glimmer');
  expect(file.uid).toBe('smoketest0001');
  const hooked = await page.evaluate(() => PixelPets.exportSave());
  expect(JSON.parse(hooked).uid).toBe('smoketest0001');

  await page.locator('#resetGo').hover();
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'load' }),
    page.mouse.down(),
  ]);
  await page.mouse.up().catch(() => {});

  await page.waitForFunction(() => window.PixelPets.scene && window.PixelPets.scene.id === 'intro');
  const fresh = await page.evaluate(() => ({
    pets: PixelPets.state.party.length,
    side: PixelPets.state.flags['story.side'] || null,
    v: PixelPets.state.v,
  }));
  expect(fresh.pets).toBe(0);
  expect(fresh.side).toBe(null);
  expect(fresh.v).toBe(2);

  await page.locator('#settingsBtn').click();
  await expect(page.locator('#ovSettings')).toBeVisible();
  await page.locator('#setRead').click();
  await shot(page, 'save-copy-read');
  await page.locator('#copyFile').setInputFiles({
    name: 'walklings-save.json',
    mimeType: 'application/json',
    buffer: Buffer.from(text),
  });
  await expect(page.locator('#copyMsg')).toHaveText("Bring back Tester's game? 1 Walkling.");
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'load' }),
    page.locator('#copyYes').click(),
  ]);
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.state && window.PixelPets.state.party[0] && window.PixelPets.state.party[0].id === 'petsmoke1');
  const restored = await page.evaluate(() => ({
    v: PixelPets.state.v,
    id: PixelPets.state.party[0].id,
    side: PixelPets.state.flags['story.side'],
    name: PixelPets.state.player.name,
    mute: localStorage.getItem('pixelpets.mute'),
  }));
  expect(restored.v).toBe(2);
  expect(restored.id).toBe('petsmoke1');
  expect(restored.side).toBe('glimmer');
  expect(restored.name).toBe('Tester');
  expect(restored.mute).toBe('1');
});

test('a bad file is refused and the current game stays', async ({ page }) => {
  const save = starterSave();
  save.flags['story.side'] = 'keepers';
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page);
  await page.waitForFunction(() => window.PixelPets.state && window.PixelPets.state.party.length === 1);
  await page.locator('#settingsBtn').click();
  await page.locator('#setRead').click();
  await page.locator('#copyFile').setInputFiles({
    name: 'newer.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"v":3}'),
  });
  await expect(page.locator('#toast')).toHaveText('That save is from a newer Walklings.');
  await expect(page.locator('#copyYes')).toBeHidden();
  const still = await page.evaluate(() => ({ uid: PixelPets.state.uid, v: PixelPets.state.v, side: PixelPets.state.flags['story.side'] }));
  expect(still.uid).toBe('smoketest0001');
  expect(still.v).toBe(2);
  expect(still.side).toBe('keepers');

  await page.locator('#copyFile').setInputFiles({
    name: 'nope.json',
    mimeType: 'application/json',
    buffer: Buffer.from('not json'),
  });
  await expect(page.locator('#toast')).toHaveText("That file isn't a Walklings save.");
  expect(await page.evaluate(() => PixelPets.state.uid)).toBe('smoketest0001');

  await page.locator('#copyFile').setInputFiles({
    name: 'old.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"v":1,"pets":[]}'),
  });
  await expect(page.locator('#toast')).toHaveText("That file isn't a Walklings save.");

  await page.locator('#copyFile').setInputFiles({
    name: 'huge.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"v":2' + ' '.repeat(2000001) + '}'),
  });
  await expect(page.locator('#toast')).toHaveText('That file is too big to read.');
  expect(await page.evaluate(() => PixelPets.state.uid)).toBe('smoketest0001');
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});
