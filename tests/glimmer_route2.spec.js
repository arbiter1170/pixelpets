/* Build 4: Glimmerwell Route 2 and Wickerglen. Keepers scenes stay the base. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, playScene } = require('./helpers');

trackErrors(test, expect);

function routeSave() {
  const save = starterSave();
  Object.assign(save.flags, {
    'story.side': 'glimmer',
    'story.side_pick_done': true,
    'story.seal1': true,
    'story.slice_end': true,
    'story.reached_route2': true,
  });
  save.world = { map: 'route2', x: 8, y: 8, facing: 'right', respawn: 'fernbrook' };
  return save;
}

async function boot(page, save) {
  await installSave(page.context(), save || routeSave(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets.debug === true && typeof window.PixelPets.runScene === 'function');
}

test('the quiet Census log gives Rook one bond and opens the glen @w1', async ({ page }) => {
  await boot(page);
  expect(await page.evaluate(() => PixelPets.glimmerCheck)).toEqual([]);
  expect(await page.evaluate(() => PixelPets.sceneFor('lead_intro'))).toBe('lead_intro@glimmer');
  expect(await page.evaluate(() => PixelPets.runScene('lead_intro'))).toBe(true);
  await playScene(page, ['Keep it quiet']);
  const after = await page.evaluate(() => ({
    lead: PixelPets.state.flags['story.met_lead'],
    bond: PixelPets.state.flags['story.rook_bond'],
  }));
  expect(after.lead).toBe(true);
  expect(after.bond).toBe(1);
});

test('Wickerglen still gives three treats and the same gates @w1', async ({ page }) => {
  await boot(page);
  expect(await page.evaluate(() => PixelPets.runScene('glen_cleared'))).toBe(true);
  await playScene(page, []);
  const after = await page.evaluate(() => ({
    glen: PixelPets.state.flags['story.glen_cleared'],
    lamps: PixelPets.state.flags['story.rook_saw_lamps'],
    treats: PixelPets.state.bag.befriend_treat || 0,
    got: PixelPets.state.flags['standing.got.glen_g'],
    points: PixelPets.standing.glimmer.points,
  }));
  expect(after.glen).toBe(true);
  expect(after.lamps).toBe(true);
  expect(after.treats).toBe(3);
  expect(after.got).toBe(true);
  expect(after.points).toBe(5);
});

test('going along does not give Rook a bond point @w1', async ({ page }) => {
  await boot(page);
  expect(await page.evaluate(() => PixelPets.runScene('lead_intro'))).toBe(true);
  await playScene(page, ['Go along']);
  const after = await page.evaluate(() => ({
    lead: PixelPets.state.flags['story.met_lead'],
    bond: PixelPets.state.flags['story.rook_bond'] || 0,
  }));
  expect(after.lead).toBe(true);
  expect(after.bond).toBe(0);
});

test('the grey Pebblit scene is the glimmer framing @w1', async ({ page }) => {
  await boot(page);
  expect(await page.evaluate(() => PixelPets.sceneFor('faded2'))).toBe('faded2@glimmer');
  expect(await page.evaluate(() => PixelPets.runScene('faded2'))).toBe(true);
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
  const line = await page.evaluate(() => PixelPets.scene.text);
  expect(line).toContain('grey Pebblit');
  expect(line.toLowerCase()).toContain('census');
});

test('the gate still writes together or race @w1', async ({ page }) => {
  await boot(page);
  expect(await page.evaluate(() => PixelPets.runScene('route2_end'))).toBe(true);
  await playScene(page, ['Together.']);
  const after = await page.evaluate(() => ({
    end: PixelPets.state.flags['story.route2_end'],
    pact: PixelPets.state.flags['story.rook_pact'],
  }));
  expect(after.end).toBe(true);
  expect(after.pact).toBe('together');
});

test('the race choice still writes race @w1', async ({ page }) => {
  await boot(page);
  expect(await page.evaluate(() => PixelPets.runScene('route2_end'))).toBe(true);
  await playScene(page, ['Race you!']);
  expect(await page.evaluate(() => PixelPets.state.flags['story.rook_pact'])).toBe('race');
  expect(await page.evaluate(() => PixelPets.state.flags['story.route2_end'])).toBe(true);
});

test('keepers Route 2 does not use the glimmer scenes @w1', async ({ page }) => {
  const save = routeSave();
  save.flags['story.side'] = 'keepers';
  await boot(page, save);
  expect(await page.evaluate(() => PixelPets.sceneFor('lead_intro'))).toBe('lead_intro');
  expect(await page.evaluate(() => PixelPets.sceneFor('glen_cleared'))).toBe('glen_cleared');
  expect(await page.evaluate(() => PixelPets.trainerFor('rival2_rook').lines.intro)).not.toContain('Colleague');
});
