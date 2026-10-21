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

// Plays a scene that may open a battle. A win is forced once; seal cards and the results button are clicked through.
async function playThrough(page, choices) {
  const left = choices.slice();
  let won = false;
  for (let i = 0; i < 120; i++) {
    const st = await page.evaluate(() => {
      const s = window.PixelPets.scene;
      const b = window.PixelPets.battle;
      return {
        scene: !!(s),
        mode: s && s.mode,
        full: s && s.full,
        waiting: s && s.waiting,
        battle: !!(b && b.on),
        panel: b && b.panel,
      };
    });
    if (!st.scene && !st.battle) return;
    if (await page.locator('#btOk').isVisible().catch(() => false)) {
      await page.locator('#btOk').click();
      await page.waitForTimeout(40);
      continue;
    }
    if (st.battle && !won) {
      if (st.panel !== 'acts' && st.panel !== 'end') {
        if (await page.locator('#btMsg').isVisible().catch(() => false)) await page.locator('#btMsg').click();
        await page.waitForTimeout(40);
        continue;
      }
      await page.evaluate(() => { PixelPets.battle.textMs = 0; PixelPets.winBattle(); });
      won = true;
      await page.waitForTimeout(40);
      continue;
    }
    if (st.mode === 'choice' && st.full) {
      await page.waitForFunction(() => window.PixelPets.optionsReady === true);
      const label = left.shift();
      if (!label) throw new Error('scene asked for a choice the test did not have');
      await page.locator('#sbChoices button', { hasText: label }).first().click();
      await page.waitForTimeout(40);
      continue;
    }
    if (st.mode === 'say' && st.waiting) { await page.keyboard.press('Space'); await page.waitForTimeout(30); continue; }
    await page.waitForTimeout(40);
  }
  throw new Error('scene did not finish');
}

test('arrival still reads the race pact @w1', async ({ page }) => {
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

test('Rook battle lines change and the quarry flag is the same @w1', async ({ page }) => {
  await boot(page, cobbleSave());
  const lines = await page.evaluate(() => PixelPets.trainerFor('rival2_rook').lines);
  expect(lines.intro).toContain('Colleague');
  expect(lines.win).toContain('speech');
  expect(lines.lose).toContain('Junior Bright');
});

test('the Sacrifice quota grants Tier 2 without a battle @w1', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page, cobbleSave({ 'story.quarry_bought': true }));
  expect(await page.evaluate(() => PixelPets.sceneFor('hale_trial'))).toBe('hale_trial@glimmer');
  expect(await page.evaluate(() => PixelPets.runScene('hale_trial'))).toBe(true);
  await playScene(page, ['Meet the quota instead']);
  const after = await page.evaluate(() => ({
    seal2: PixelPets.state.flags['story.seal2'],
    lanyard: PixelPets.state.seals.seal_glim_2,
    snacks: PixelPets.state.bag.hearty_snack || 0,
    tonic: PixelPets.state.bag.wake_tonic || 0,
    points: PixelPets.standing.glimmer.points,
    keepers: PixelPets.standing.keepers.points,
    hale: PixelPets.trainerFor('hall2_hale').seal,
    chip: PixelPets.state.party[0].chip || null,
  }));
  expect(after.seal2).toBe(true);
  expect(after.lanyard).toBeTruthy();
  expect(after.snacks).toBe(2);
  expect(after.tonic).toBe(1);
  expect(after.points).toBe(5);
  expect(after.chip).toBe(null);
  expect(after.keepers).toBe(0);
  expect(after.hale).toBe('seal_glim_2');
  await page.evaluate(() => PixelPets.setSide('keepers'));
  expect(await page.evaluate(() => PixelPets.trainerFor('hall2_hale').seal)).toBe('seal_cobblecrest');
});

test('tuning the partner chips them and still grants Tier 2 @w1', async ({ page }) => {
  test.setTimeout(60000);
  const save = cobbleSave({ 'story.quarry_bought': true });
  save.bag = { heal_snack: 2 };
  await boot(page, save);
  expect(await page.evaluate(() => PixelPets.runScene('hale_trial'))).toBe(true);
  await playScene(page, ['Tune my partner']);
  const after = await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    return {
      snacks: PixelPets.state.bag.heal_snack || 0,
      seal2: PixelPets.state.flags['story.seal2'],
      lanyard: !!PixelPets.state.seals.seal_glim_2,
      done: PixelPets.state.flags['story.arbiter_test_done'],
      active: PixelPets.state.flags['story.arbiter_test_active'],
      align: p.align,
      locked: !!(p.chip && p.chip.locked && p.chip.on),
      v: PixelPets.state.v,
    };
  });
  expect(after.snacks).toBe(2);
  expect(after.seal2).toBe(true);
  expect(after.lanyard).toBe(true);
  expect(after.done).toBe(true);
  expect(after.active).toBe(false);
  expect(after.align).toBe(50);
  expect(after.locked).toBe(true);
  expect(after.v).toBe(2);
});

test('facing the review still grants Tier 2 @w1', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page, cobbleSave({ 'story.quarry_bought': true }));
  expect(await page.evaluate(() => PixelPets.trainerFor('hall2_hale').onWin)).toBe('seal2');
  expect(await page.evaluate(() => PixelPets.runScene('hale_trial'))).toBe(true);
  await playThrough(page, ['Face the review']);
  const after = await page.evaluate(() => ({
    seal2: PixelPets.state.flags['story.seal2'],
    lanyard: !!PixelPets.state.seals.seal_glim_2,
    points: PixelPets.standing.glimmer.points,
    chip: PixelPets.state.party[0].chip || null,
  }));
  expect(after.seal2).toBe(true);
  expect(after.lanyard).toBe(true);
  expect(after.points).toBe(5);
  expect(after.chip).toBe(null);
});

test('the buyout still sets the quarry flag after the match @w1', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page, cobbleSave());
  expect(await page.evaluate(() => PixelPets.runScene('quarry_buyout'))).toBe(true);
  await playThrough(page, []);
  const after = await page.evaluate(() => ({
    bought: PixelPets.state.flags['story.quarry_bought'],
    got: PixelPets.state.flags['standing.got.quarry_g'],
    points: PixelPets.standing.glimmer.points,
  }));
  expect(after.bought).toBe(true);
  expect(after.got).toBe(true);
  expect(after.points).toBe(5);
});

test('keepers Rook leaves and glimmer Rook stays @w1', async ({ page }) => {
  const save = cobbleSave({ 'story.side': 'keepers', 'story.seal2': true });
  await boot(page, save);
  expect(await page.evaluate(() => PixelPets.sceneFor('brinewick_hook'))).toBe('brinewick_hook');
  expect(await page.evaluate(() => PixelPets.runScene('brinewick_hook'))).toBe(true);
  let heard = '';
  for (let i = 0; i < 8; i++) {
    await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
    const text = await page.evaluate(() => (PixelPets.scene && PixelPets.scene.text) || '');
    heard += '\n' + text;
    if (text.includes('getting off')) break;
    await page.keyboard.press('Space');
    await page.waitForTimeout(30);
  }
  expect(heard).toContain('getting off');
  expect(heard).not.toContain('riding with the cart');
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

test('a high bond does not change the Glimmerwell closer @w1', async ({ page }) => {
  const save = cobbleSave({ 'story.seal2': true, 'story.rook_bond': 3 });
  await boot(page, save);
  expect(await page.evaluate(() => PixelPets.runScene('brinewick_hook'))).toBe(true);
  await playScene(page, []);
  const after = await page.evaluate(() => ({
    end: PixelPets.state.flags['story.rook_end'],
    bond: PixelPets.state.flags['story.rook_bond'],
    card: PixelPets.state.flags['story.cobble_end'],
  }));
  expect(after.end).toBe('stays');
  expect(after.bond).toBe(3);
  expect(after.card).toBe(true);
});
