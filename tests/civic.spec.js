/* Keeper House, town officers, and the Keeper1 phone. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, playScene } = require('./helpers');

trackErrors(test, expect);

function readySave(extra) {
  const save = starterSave();
  Object.assign(save.flags, {
    'story.reached_route1': true,
    'story.starter_received': true,
  }, extra || {});
  save.world = { map: 'hearthmoor', x: 8, y: 9, facing: 'down', respawn: 'hearthmoor' };
  return save;
}

async function boot(page, save) {
  await installSave(page.context(), save || readySave(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets.debug === true && typeof window.PixelPets.runScene === 'function');
}

test('the phone is a side quest until the officers issue it', async ({ page }) => {
  await boot(page);
  const before = await page.evaluate(() => ({
    id: PixelPets.sideQuest && PixelPets.sideQuest.id,
    town: PixelPets.townFaction('hearthmoor'),
    glen: PixelPets.townFaction('route2_glen'),
    phone: document.querySelector('#phoneBtn').hidden,
    quest: document.querySelector('#questBtn').textContent,
  }));
  expect(before.id).toBe('phone');
  expect(before.town).toBe('keepers');
  expect(before.glen).toBe('glimmer');
  expect(before.phone).toBe(true);
  expect(before.quest).toContain('QUEST');

  expect(await page.evaluate(() => PixelPets.runScene('phone_grant'))).toBe(true);
  await playScene(page, []);
  const after = await page.evaluate(() => ({
    got: PixelPets.state.flags['story.phone_got'],
    item: PixelPets.state.bag.keeper1 || 0,
    side: PixelPets.sideQuest,
    btn: document.querySelector('#phoneBtn').hidden,
  }));
  expect(after.got).toBe(true);
  expect(after.item).toBe(1);
  expect(after.side).toBeFalsy();
  expect(after.btn).toBe(false);

  await page.locator('#phoneBtn').click();
  await expect(page.locator('#phoneTitle')).toHaveText('KEEPER1');
  await expect(page.locator('#phoneFoot')).toContainText('Lantern desk');
  await page.locator('#phoneJobs').click();
  await expect(page.locator('#phoneBody')).toContainText('KEEPERUAV');
  await expect(page.locator('#phoneBody')).toContainText('No jobs are open');
  await page.locator('#phoneBack').click();
  await page.locator('.phone-app[data-app="friends"]').click();
  await expect(page.locator('#friendCode')).toBeVisible();
  await page.locator('#phoneClose').click();
  await expect(page.locator('#ovPhone')).toBeHidden();
});

test('a cracked handset turns the phone into the thin one', async ({ page }) => {
  await boot(page, readySave({ 'story.phone_got': true, 'story.side': 'keepers', 'story.side_pick_done': true }));
  await page.evaluate(() => { PixelPets.giveItem('keeper1', 1); PixelPets.setSide('glimmer'); PixelPets.showTab('walk'); });
  await page.waitForFunction(() => !document.querySelector('#phoneBtn').hidden);
  await page.locator('#phoneBtn').click();
  await expect(page.locator('#phoneTitle')).toHaveText('CRACK//HAND');
  await expect(page.locator('#phoneJobs')).toHaveText('BOTNET');
  await page.locator('#phoneJobs').click();
  await expect(page.locator('#phoneBody')).toContainText('Dark-market parts');
  const bag = await page.evaluate(() => PixelPets.state.bag.cracked_phone || 0);
  expect(bag).toBe(1);
});

test('Keeper House talk depends on the pledge', async ({ page }) => {
  await boot(page);
  expect(await page.evaluate(() => PixelPets.goto('hm_hq_f1', 4, 6, 'up'))).toMatchObject({ map: 'hm_hq_f1' });
  expect(await page.evaluate(() => PixelPets.mapInfo.id)).toBe('hm_hq_f1');
  expect(await page.evaluate(() => PixelPets.runScene('hq_bram'))).toBe(true);
  await playScene(page, []);
  expect(await page.evaluate(() => PixelPets.state.flags['story.met_bram'])).toBe(true);

  await page.evaluate(() => { PixelPets.setFlag('story.met_bram', false); PixelPets.setSide('glimmer'); });
  expect(await page.evaluate(() => PixelPets.runScene('hq_bram'))).toBe(true);
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
  const cold = await page.evaluate(() => PixelPets.scene.text);
  expect(cold).toContain('doorway');
});

test('the road officer actually walks', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.showTab('walk'));
  const seen = new Set();
  for (let i = 0; i < 8; i++) {
    const pos = await page.evaluate(() => PixelPets.objPos('hm_patrol'));
    expect(pos.present).toBe(true);
    seen.add(pos.x + ',' + pos.y);
    await page.waitForTimeout(400);
  }
  expect(seen.size).toBeGreaterThan(1);
});
