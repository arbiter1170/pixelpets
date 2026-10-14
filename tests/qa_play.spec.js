/* Phone QA regressions from the evil-faction playthrough.
   Widths come from the Playwright projects (320, 375, 390). */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const HEIGHTS_TIP = 'Get to know us. RegenX in the Heights brews Atten. Stock up, then bring samples and plans.';
const FEN_AGAIN = 'The crates are by the gate. The Hall can wait.';

function glimmerSave() {
  const save = starterSave();
  Object.assign(save.flags, {
    'story.reached_route1': true,
    'story.reached_fernbrook': true,
    'story.met_glimmerwell': true,
    'story.met_fen': true,
    'story.side_pick_done': true,
    'story.side': 'glimmer',
    'story.phone_got': true,
    'story.orchard_cleared': true,
    'story.know_us': true,
    'story.heights_path': 'lab',
  });
  save.bag = { heal_snack: 1, keeper1: 1, cracked_phone: 1 };
  save.world = { map: 'fernbrook', x: 10, y: 10, facing: 'down', respawn: 'fernbrook' };
  save.standing = { keepers: 0, glimmer: 17 };
  return save;
}

async function gotoDebug(page) {
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
}

test('look DONE stays on screen and the name row stays hidden', async ({ page }) => {
  await gotoDebug(page);
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.id === 'intro');
  for (let i = 0; i < 20; i++) {
    const st = await page.evaluate(() => ({
      look: !document.querySelector('#ovLook').hidden,
      waiting: !!(PixelPets.scene && PixelPets.scene.waiting),
    }));
    if (st.look) break;
    if (st.waiting) await page.keyboard.press('Space');
    await page.waitForTimeout(50);
  }
  await expect(page.locator('#ovLook')).toBeVisible();
  await expect(page.locator('#lookNameRow')).toBeHidden();
  const box = await page.locator('#lookDone').boundingBox();
  const vh = page.viewportSize().height;
  expect(box).toBeTruthy();
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(vh + 1);
});

test('the bag shows both handsets, and the walk tip follows Heights', async ({ page }) => {
  await installSave(page.context(), glimmerSave(), { quietDay: true });
  await gotoDebug(page);
  await page.locator('#tabs button[data-tab="walk"]').click();
  const tip = await page.locator('#walkTip').innerText();
  expect(tip).toBe(HEIGHTS_TIP);
  expect(tip).not.toContain('east gate');
  await page.locator('#walkBagBtn').click();
  await expect(page.locator('#ovBag')).toBeVisible();
  await expect(page.locator('#bagList')).toContainText('Keeper1');
  await expect(page.locator('#bagList')).toContainText('Cracked Handset');
  await expect(page.locator('#bagList')).toContainText('Open PHONE');
  await expect(page.locator('#bagEmpty')).toBeHidden();
  await expect(page.locator('.bag-row[data-id="keeper1"] .bag-use')).toHaveCount(0);
  await expect(page.locator('.bag-row[data-id="cracked_phone"] .bag-use')).toHaveCount(0);
  await page.locator('#bagClose').click();
  await page.locator('#phoneBtn').click();
  await expect(page.locator('#ovPhone')).toBeVisible();
  const shell = await page.locator('#ovPhone .phone-shell').boundingBox();
  expect(shell.y + shell.height).toBeLessThanOrEqual(page.viewportSize().height + 1);
  await page.locator('.phone-app[data-app="notes"]').click();
  const notes = await page.locator('#phoneBody').innerText();
  expect(notes).toContain('Handset');
  expect(notes).toContain('The crest phone copies every note.');
  expect(notes.toLowerCase()).not.toContain('unnamed');
  const end = await page.evaluate(() => ({ v: PixelPets.state.v, quest: PixelPets.questCheck }));
  expect(end.v).toBe(2);
  expect(end.quest).toEqual([]);
});

test('Fen does not replay her intro after she has asked', async ({ page }) => {
  const save = glimmerSave();
  delete save.flags['story.orchard_cleared'];
  save.world = { map: 'fernbrook', x: 10, y: 10, facing: 'up', respawn: 'fernbrook' };
  await installSave(page.context(), save, { quietDay: true });
  await gotoDebug(page);
  const line = await page.evaluate(() => PixelPets.npcLine('fen_orchard'));
  expect(line).toBe(FEN_AGAIN);
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});
