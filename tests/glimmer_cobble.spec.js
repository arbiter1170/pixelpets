/* Builds 5 and 6: Cobblecrest glimmer, the Sacrifice quota, and Rook's R5. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, playScene } = require('./helpers');

trackErrors(test, expect);

function cobbleSave(extra) {
  const save = starterSave();
  Object.assign(save.flags, {
    'story.side': 'glimmer',
    'story.side_pick_done': true,
    'story.seal1': true,
    'story.rook_pact': 'race',
    'story.route2_end': true,
    'story.reached_cobblecrest': true,
  }, extra || {});
  save.world = { map: 'cobblecrest', x: 4, y: 8, facing: 'right', respawn: 'fernbrook' };
  return save;
}

async function boot(page, save) {
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets.debug === true && typeof window.PixelPets.runScene === 'function');
}

test('arrival still reads the race pact', async ({ page }) => {
  await boot(page, cobbleSave());
  expect(await page.evaluate(() => PixelPets.sceneFor('cobble_arrive'))).toBe('cobble_arrive@glimmer');
  expect(await page.evaluate(() => PixelPets.runScene('cobble_arrive'))).toBe(true);
  await playScene(page, []);
  const after = await page.evaluate(() => ({
    arrived: PixelPets.state.flags['story.cobble_arrived'],
    respawn: PixelPets.state.world.respawn,
  }));
  expect(after.arrived).toBe(true);
  expect(after.respawn).toBe('cobblecrest');
});

test('Rook battle lines change and the quarry flag is the same', async ({ page }) => {
  await boot(page, cobbleSave());
  const lines = await page.evaluate(() => PixelPets.trainerFor('rival2_rook').lines);
  expect(lines.intro).toContain('Colleague');
  expect(lines.win).toContain('speech');
  expect(lines.lose).toContain('Junior Bright');
});

test('the Sacrifice quota grants Tier 2 without a battle', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page, cobbleSave({ 'story.quarry_bought': true }));
  expect(await page.evaluate(() => PixelPets.sceneFor('hale_trial'))).toBe('hale_trial@glimmer');
  expect(await page.evaluate(() => PixelPets.runScene('hale_trial'))).toBe(true);
  await playScene(page, ['Meet the quota']);
  const after = await page.evaluate(() => ({
    seal2: PixelPets.state.flags['story.seal2'],
    lanyard: PixelPets.state.seals.seal_glim_2,
    snacks: PixelPets.state.bag.hearty_snack || 0,
    tonic: PixelPets.state.bag.wake_tonic || 0,
    points: PixelPets.standing.glimmer.points,
    keepers: PixelPets.standing.keepers.points,
    hale: PixelPets.trainerFor('hall2_hale').seal,
  }));
  expect(after.seal2).toBe(true);
  expect(after.lanyard).toBeTruthy();
  expect(after.snacks).toBe(2);
  expect(after.tonic).toBe(1);
  expect(after.points).toBe(5);
  expect(after.keepers).toBe(0);
  expect(after.hale).toBe('seal_glim_2');
  await page.evaluate(() => PixelPets.setSide('keepers'));
  expect(await page.evaluate(() => PixelPets.trainerFor('hall2_hale').seal)).toBe('seal_cobblecrest');
});

test('keepers Rook leaves and glimmer Rook stays', async ({ page }) => {
  const save = cobbleSave({ 'story.side': 'keepers', 'story.seal2': true });
  await boot(page, save);
  expect(await page.evaluate(() => PixelPets.sceneFor('brinewick_hook'))).toBe('brinewick_hook');
  expect(await page.evaluate(() => PixelPets.runScene('brinewick_hook'))).toBe(true);
  await playScene(page, []);
  const keepers = await page.evaluate(() => ({
    end: PixelPets.state.flags['story.rook_end'],
    card: PixelPets.state.flags['story.cobble_end'],
    points: PixelPets.standing.keepers.points,
  }));
  expect(keepers.end).toBe('ally');
  expect(keepers.card).toBe(true);
  expect(keepers.points).toBe(5);

  await page.evaluate(() => {
    PixelPets.setSide('glimmer');
    PixelPets.setFlag('story.cobble_end', false);
    PixelPets.setFlag('story.rook_end', false);
  });
  expect(await page.evaluate(() => PixelPets.sceneFor('brinewick_hook'))).toBe('brinewick_hook@glimmer');
  expect(await page.evaluate(() => PixelPets.runScene('brinewick_hook'))).toBe(true);
  await playScene(page, []);
  const glimmer = await page.evaluate(() => ({
    end: PixelPets.state.flags['story.rook_end'],
    card: PixelPets.state.flags['story.cobble_end'],
    points: PixelPets.standing.glimmer.points,
  }));
  expect(glimmer.end).toBe('stays');
  expect(glimmer.card).toBe(true);
  expect(glimmer.points).toBe(5);
});
