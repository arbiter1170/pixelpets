/* Fernbrook Heights: the "get to know us" quest before the first trial, and group battles. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, playScene } = require('./helpers');

trackErrors(test, expect);

async function gotoDebug(page) {
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets.debug === true && typeof window.PixelPets.runScene === 'function');
}

test('keepers offer points at the Heights tunnels and holds the trial', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoDebug(page);
  expect(await page.evaluate(() => PixelPets.heightsCheck.concat(PixelPets.questCheck))).toEqual([]);
  expect(await page.evaluate(() => PixelPets.runScene('side_pick'))).toBe(true);
  await playScene(page, ['Open the crates with Fen', 'Yes, the Keepers']);
  const after = await page.evaluate(() => ({
    path: PixelPets.heights.path,
    know: PixelPets.heights.know,
    quest: PixelPets.quest && PixelPets.quest.id,
    trial: PixelPets.trialReady,
  }));
  expect(after.path).toBe('tunnels');
  expect(after.know).toBe(true);
  expect(after.quest).toBe('heights');
  expect(after.trial).toBe(false);
  await page.evaluate(() => PixelPets.setFlag('story.heights_done', true));
  expect(await page.evaluate(() => PixelPets.trialReady)).toBe(true);
});

test('glimmer offer points at the RegenX lab', async ({ page }) => {
  test.setTimeout(60000);
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoDebug(page);
  expect(await page.evaluate(() => PixelPets.runScene('side_pick'))).toBe(true);
  await playScene(page, ['Pack crates with Tobin', 'Yes, Glimmerwell', 'Pat the crate', "They'll be comfy"]);
  const after = await page.evaluate(() => ({
    path: PixelPets.heights.path,
    side: PixelPets.side,
    cleared: PixelPets.state.flags['story.orchard_cleared'],
    quest: PixelPets.quest && PixelPets.quest.id,
    trial: PixelPets.trialReady,
  }));
  expect(after.side).toBe('glimmer');
  expect(after.path).toBe('lab');
  expect(after.cleared).toBe(true);
  expect(after.quest).toBe('heights');
  expect(after.trial).toBe(false);
});

test('a group battle fields two foes and a target control', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoDebug(page);
  expect(await page.evaluate(() => PixelPets.forceTrainer('rx_wardens'))).toBe(true);
  await page.waitForFunction(() => window.PixelPets.battle && window.PixelPets.battle.state === 'CHOOSE');
  const view = await page.evaluate(() => {
    const B = PixelPets.battle;
    return {
      group: B.group,
      n: B.slots.length,
      aim: document.querySelector('#btAim') && !document.querySelector('#btAim').hidden,
      second: document.querySelector('#btFoe2Row') && !document.querySelector('#btFoe2Row').hidden,
      name: document.querySelector('#btFoeName').textContent,
      other: document.querySelector('#btFoe2Name').textContent,
    };
  });
  expect(view.group).toBe(true);
  expect(view.n).toBe(2);
  expect(view.aim).toBe(true);
  expect(view.second).toBe(true);
  expect(view.name.length).toBeGreaterThan(0);
  expect(view.other.length).toBeGreaterThan(0);
  expect(view.other === view.name).toBe(false);
  await page.locator('#btAim').click();
  const swapped = await page.evaluate(() => document.querySelector('#btFoeName').textContent);
  expect(swapped).not.toBe(view.name);
});

test('an old Seal still opens the trial without the Heights quest', async ({ page }) => {
  const save = starterSave();
  save.flags['story.seal1'] = true;
  save.flags['story.side_pick_done'] = true;
  await installSave(page.context(), save, { quietDay: true });
  await gotoDebug(page);
  const q = await page.evaluate(() => ({ trial: PixelPets.trialReady, id: PixelPets.quest && PixelPets.quest.id }));
  expect(q.trial).toBe(true);
  expect(q.id).not.toBe('heights');
});
