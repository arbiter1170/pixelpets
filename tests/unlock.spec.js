/* Unlock tips (D180) and tour step T12r. */
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, playScene } = require('./helpers');

trackErrors(test, expect);

const ART = process.env.PP_ART || '/opt/cursor/artifacts/screenshots';

function tourSave(step) {
  const s = starterSave();
  delete s.flags['story.tutorial_done'];
  s.steps = 0;
  s.world = { map: 'hm_lodge_in', x: 5, y: 6, facing: 'up', respawn: 'hearthmoor' };
  s.party[0].hunger = 80;
  s.party[0].happy = 80;
  s.party[0].energy = 90;
  delete s.party[0].cd;
  if (step) s.flags['story.tutorial_step'] = step;
  return s;
}

async function shot390(page, name) {
  if (!page.viewportSize() || page.viewportSize().width !== 390) return;
  fs.mkdirSync(ART, { recursive: true });
  await page.screenshot({ path: path.join(ART, name + '.png') });
}

async function openTour(page, save) {
  await installSave(page.context(), save, { quietDay: false });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  if (save.flags['story.tutorial_step']) {
    await expect(page.locator('#tutLine')).toContainText('Finish the tour?');
    return;
  }
  await page.evaluate(() => {
    const d = new Date();
    const day = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    PixelPets.state.flags['daily.warm_bowl'] = day;
    PixelPets.showTab('walk');
  });
  expect(await page.evaluate(() => PixelPets.runSteps([['say', '', 'The baskets are quiet now.']]))).toBe(true);
  await playScene(page, []);
  await expect(page.locator('#tutCard')).toBeVisible();
}

async function walkTour(page) {
  await page.locator('#tutActs button', { hasText: 'SHOW ME' }).click();
  const opened = await page.locator('#tutLine').textContent();
  if (opened && opened.indexOf('PARTNER screen') >= 0) {
    await page.locator('#tabs button[data-tab="pet"]').click();
  }
  await expect(page.locator('#tutLine')).toContainText('FOOD drops slowly');
  for (let i = 0; i < 3; i++) await page.locator('#tutActs button', { hasText: 'NEXT' }).click();
  await expect(page.locator('#tutLine')).toContainText('Tap FEED');
  await page.locator('#scr-pet [data-act="feed"]').click();
  await expect(page.locator('#tutLine')).toContainText('Tap PLAY');
  await page.locator('#scr-pet [data-act="play"]').click();
  await expect(page.locator('#tutLine')).toContainText('Tap REST');
  await page.locator('#scr-pet [data-act="rest"]').click();
  await expect(page.locator('#tutLine')).toContainText('These hearts fill');
  await page.locator('#tutActs button', { hasText: 'NEXT' }).click();
  await expect(page.locator('#tutLine')).toContainText('Tap WALK');
  await page.locator('#tabs button[data-tab="walk"]').click();
  let compass = false;
  for (let n = 0; n < 8; n++) {
    const text = await page.locator('#tutLine').textContent();
    if (text && text.indexOf('This compass lists') >= 0) compass = true;
    const label = await page.locator('#tutActs button').first().textContent();
    if (label && label.indexOf("LET'S GO") >= 0) return compass;
    await page.locator('#tutActs button', { hasText: 'NEXT' }).click();
  }
  return compass;
}

test('setting phone_got on WALK shows the phone tip once', async ({ page }) => {
  const s = starterSave();
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.evaluate(() => { PixelPets.state.flags['story.phone_got'] = true; });
  await expect(page.locator('#unlockCard')).toBeVisible({ timeout: 4000 });
  await expect(page.locator('#unlockTitle')).toHaveText('Your phone');
  await expect(page.locator('#unlockBody')).toHaveText('Your phone has your contacts, Ribbit and the town board. Tap it any time.');
  await expect(page.locator('#unlockShow')).toHaveText('SHOW ME');
  await expect(page.locator('#unlockSkip')).toHaveText('SKIP');
  const box = await page.locator('#unlockSkip').boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(44);
  await shot390(page, 'unlock-phone');
  await page.locator('#unlockSkip').click();
  await expect(page.locator('#unlockCard')).toBeHidden();
  const seen = await page.evaluate(() => ({
    v: PixelPets.state.v,
    flag: PixelPets.state.flags['story.unlock_phone'] === true,
  }));
  expect(seen).toEqual({ v: 2, flag: true });
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForTimeout(1200);
  await expect(page.locator('#unlockCard')).toBeHidden();
});

test('Tips OFF shows nothing', async ({ page }) => {
  const s = starterSave();
  s.settings.tips = false;
  s.flags['story.phone_got'] = true;
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForTimeout(1200);
  const st = await page.evaluate(() => ({
    v: PixelPets.state.v,
    tips: PixelPets.state.settings.tips,
    up: !document.querySelector('#unlockCard').hidden,
    flag: PixelPets.state.flags['story.unlock_phone'] === true,
  }));
  expect(st).toEqual({ v: 2, tips: false, up: false, flag: false });
});

test('a cleared tour reaches T12r before T13', async ({ page }) => {
  test.setTimeout(60000);
  await openTour(page, tourSave());
  const compass = await walkTour(page);
  expect(compass).toBe(true);
  await expect(page.locator('#tutLine')).toContainText("That's the tour!");
  if (page.viewportSize() && page.viewportSize().width === 390) await shot390(page, 'tutorial-t12r-end');
});

test('a save already on T13 skips the compass step', async ({ page }) => {
  test.setTimeout(60000);
  await openTour(page, tourSave('T13'));
  const compass = await walkTour(page);
  expect(compass).toBe(false);
  await expect(page.locator('#tutLine')).toContainText("That's the tour!");
});
