/* A trainer keeps their sight line until you win. A worn-out party does not start that battle. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

async function gotoDebug(page) {
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets.debug === true && typeof window.PixelPets.goto === 'function');
  await page.locator('#tabs button[data-tab="walk"]').click();
}

function routeSave() {
  const save = starterSave();
  save.world = { map: 'route1', x: 10, y: 10, facing: 'up', respawn: 'hearthmoor' };
  save.flags['story.reached_route1'] = true;
  return save;
}

async function stepIntoPia(page) {
  await page.evaluate(() => PixelPets.goto('route1', 10, 10, 'up'));
  await page.keyboard.down('ArrowUp');
  for (let i = 0; i < 100; i++) {
    const on = await page.evaluate(() => !!(PixelPets.battle && PixelPets.battle.on));
    if (on) break;
    const saying = await page.evaluate(() => {
      const s = window.PixelPets.scene;
      return !!(s && s.mode === 'say' && s.waiting);
    });
    if (saying) await page.keyboard.press('Space');
    await page.waitForTimeout(40);
  }
  await page.keyboard.up('ArrowUp');
  await page.waitForFunction(() => {
    const b = window.PixelPets.battle;
    return b && b.on && b.state === 'CHOOSE' && b.trainerId === 'route1_pia';
  }, null, { timeout: 15000 });
}

async function finishBattle(page, how) {
  await page.evaluate((kind) => (kind === 'win' ? PixelPets.winBattle() : PixelPets.loseBattle()), how);
  for (let i = 0; i < 50; i++) {
    const st = await page.evaluate(() => ({
      battle: !!(PixelPets.battle && PixelPets.battle.on),
      panel: PixelPets.battle && PixelPets.battle.panel,
      scene: !!PixelPets.scene,
    }));
    if (!st.battle && !st.scene) break;
    if (st.battle && st.panel === 'end') await page.locator('#btOk').click();
    else if (st.battle) await page.locator('#btMsg').click();
    else await page.keyboard.press('Space');
    await page.waitForTimeout(70);
  }
  await page.waitForFunction(() => !(PixelPets.battle && PixelPets.battle.on) && !PixelPets.scene);
}

test('a loss re-arms the sight line after a rest, and a win retires it', async ({ page }) => {
  test.setTimeout(60000);
  await installSave(page.context(), routeSave(), { quietDay: true });
  await gotoDebug(page);
  await stepIntoPia(page);
  await finishBattle(page, 'lose');
  const lost = await page.evaluate(() => ({
    trainer: PixelPets.state.flags['trainer.route1_pia'],
    spotted: PixelPets.state.flags['spotted.route1_pia'],
    map: PixelPets.state.world.map,
  }));
  expect(lost.trainer).toBeUndefined();
  expect(lost.spotted).toBeUndefined();
  expect(lost.map).toBe('hm_lantern_in');

  await page.evaluate(() => PixelPets.healTeam());
  await stepIntoPia(page);
  const again = await page.evaluate(() => PixelPets.battle.trainerId);
  expect(again).toBe('route1_pia');
  await finishBattle(page, 'win');
  const won = await page.evaluate(() => ({
    trainer: PixelPets.state.flags['trainer.route1_pia'],
    spotted: PixelPets.state.flags['spotted.route1_pia'],
  }));
  expect(won.trainer).toBe(true);
  expect(won.spotted).toBe(true);

  await page.evaluate(() => PixelPets.healTeam());
  await page.evaluate(() => PixelPets.goto('route1', 10, 10, 'up'));
  await page.keyboard.down('ArrowUp');
  await page.waitForFunction(() => PixelPets.state.world.y === 9);
  await page.keyboard.up('ArrowUp');
  await page.waitForTimeout(500);
  const quiet = await page.evaluate(() => ({
    battle: !!(PixelPets.battle && PixelPets.battle.on),
    scene: !!PixelPets.scene,
    y: PixelPets.state.world.y,
  }));
  expect(quiet.battle).toBe(false);
  expect(quiet.scene).toBeFalsy();
  expect(quiet.y).toBe(9);
});

test('a worn-out party walks through a sight line without a battle', async ({ page }) => {
  await installSave(page.context(), routeSave(), { quietDay: true });
  await gotoDebug(page);
  await page.evaluate(() => PixelPets.setFaint(20));
  await page.evaluate(() => PixelPets.goto('route1', 10, 10, 'up'));
  await page.keyboard.down('ArrowUp');
  await page.waitForFunction(() => PixelPets.state.world.y === 9);
  await page.keyboard.up('ArrowUp');
  await page.waitForTimeout(500);
  const st = await page.evaluate(() => ({
    battle: !!(PixelPets.battle && PixelPets.battle.on),
    scene: !!PixelPets.scene,
    spotted: PixelPets.state.flags['spotted.route1_pia'],
    trainer: PixelPets.state.flags['trainer.route1_pia'],
    y: PixelPets.state.world.y,
  }));
  expect(st.battle).toBe(false);
  expect(st.scene).toBeFalsy();
  expect(st.spotted).toBeUndefined();
  expect(st.trainer).toBeUndefined();
  expect(st.y).toBe(9);
});
