/* After a full wipe the town force blocks the road until a Lantern House rest, and MY WALKLINGS shows care statuses. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, playScene } = require('./helpers');

trackErrors(test, expect);

async function gotoDebug(page) {
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets.debug === true && typeof window.PixelPets.setFlag === 'function');
  await page.locator('#tabs button[data-tab="walk"]').click();
}

test('MY WALKLINGS shows drowsy, hungry and the other care statuses', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoDebug(page);
  await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    p.energy = 10;
    p.hunger = 10;
    p.happy = 90;
  });
  await page.locator('#tabs button[data-tab="col"]').click();
  const badges = await page.locator('#ownedList .statuses .pc-badge').allTextContents();
  expect(badges).toContain('DROWSY');
  expect(badges).toContain('HUNGRY');
  expect(badges).toContain('SPIRITED');
  expect(badges.join(' ')).not.toMatch(/faint/i);
});

test('a wipe locks the town exit until a Lantern House rest, and the quest points there', async ({ page }) => {
  test.setTimeout(60000);
  const save = starterSave();
  save.world = { map: 'hearthmoor', x: 22, y: 8, facing: 'right', respawn: 'hearthmoor' };
  await installSave(page.context(), save, { quietDay: true });
  await gotoDebug(page);
  await page.evaluate(() => PixelPets.setFlag('story.must_rest', true));
  const quest = await page.evaluate(() => PixelPets.quest);
  expect(quest.id).toBe('must_rest');
  expect(quest.place).toBe('Lantern House');
  expect(quest.target).toEqual({ map: 'hearthmoor', x: 16, y: 13 });
  await expect(page.locator('#walkTip')).toContainText('Lantern House');
  await page.evaluate(() => {
    PixelPets.setFlag('story.rival1_done', true);
    PixelPets.goto('hearthmoor', 22, 8, 'right');
  });

  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(() => window.PixelPets.scene && window.PixelPets.scene.who === 'Town Watch');
  await page.keyboard.up('ArrowRight');
  const held = await page.evaluate(() => ({ map: PixelPets.state.world.map, text: PixelPets.scene.text }));
  expect(held.map).toBe('hearthmoor');
  expect(held.text).toContain('Lantern House');
  await playScene(page, []);

  await page.evaluate(() => PixelPets.goto('cobblecrest', 1, 8, 'left'));
  await page.keyboard.down('ArrowLeft');
  await page.waitForFunction(() => window.PixelPets.scene && window.PixelPets.scene.who === 'Patrol Unit');
  await page.keyboard.up('ArrowLeft');
  expect(await page.evaluate(() => PixelPets.state.world.map)).toBe('cobblecrest');
  const glimmerQuest = await page.evaluate(() => {
    PixelPets.state.world.respawn = 'cobblecrest';
    return PixelPets.quest.target;
  });
  expect(glimmerQuest).toEqual({ map: 'cobblecrest', x: 5, y: 5 });
  await playScene(page, []);

  expect(await page.evaluate(() => PixelPets.runScene('lantern_rest'))).toBe(true);
  await playScene(page, ['Rest a while']);
  const freed = await page.evaluate(() => ({
    rest: PixelPets.state.flags['story.must_rest'],
    quest: PixelPets.quest && PixelPets.quest.id,
  }));
  expect(freed.rest).toBeUndefined();
  expect(freed.quest).not.toBe('must_rest');

  await page.evaluate(() => PixelPets.goto('hearthmoor', 22, 8, 'right'));
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(() => PixelPets.state.world.map === 'route1');
  await page.keyboard.up('ArrowRight');
});
