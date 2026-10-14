/* Mom's upstairs tasks, the look picker, and the Mahopac dream. See tests/README.md. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, playScene } = require('./helpers');

trackErrors(test, expect);

async function gotoDebug(page) {
  await gotoGame(page, '?debug=1');
  await page.evaluate(() => PixelPets.showTab('walk'));
}

test('look picker offers more hair, clothes, and accessories', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoDebug(page);
  const counts = await page.evaluate(() => {
    const old = normalizeLook({ skin: '3', hair: 'p', coat: 't', scarf: 'r' });
    const grids = [];
    for (const hair of KEEPER_LOOKS.hair) {
      for (const outfit of KEEPER_LOOKS.outfit) {
        for (const accessory of KEEPER_LOOKS.accessory) {
          const rows = keeperGrid({ hair, outfit, accessory }, 'down', 0);
          grids.push(rows.length === 16 && rows.every((r) => r.length === 16));
        }
      }
    }
    return {
      hair: KEEPER_LOOKS.hair.length,
      hairCol: KEEPER_LOOKS.hairCol.length,
      outfit: KEEPER_LOOKS.outfit.length,
      accessory: KEEPER_LOOKS.accessory.length,
      migrated: old && old.hair === 'short' && old.hairCol === 'p' && old.accessory === 'none',
      gridsOk: grids.every(Boolean),
    };
  });
  expect(counts.hair).toBeGreaterThanOrEqual(8);
  expect(counts.hairCol).toBeGreaterThanOrEqual(14);
  expect(counts.outfit).toBeGreaterThanOrEqual(6);
  expect(counts.accessory).toBe(5);
  expect(counts.migrated).toBe(true);
  expect(counts.gridsOk).toBe(true);

  await page.locator('#settingsBtn').click();
  await page.locator('#setLook').click();
  await page.waitForSelector('#ovLook:not([hidden])');
  const buttons = await page.evaluate(() => ({
    hair: document.querySelectorAll('#lookHair button').length,
    hairCol: document.querySelectorAll('#lookHairCol button').length,
    outfit: document.querySelectorAll('#lookOutfit button').length,
    accessory: document.querySelectorAll('#lookAccessory button').length,
  }));
  expect(buttons).toEqual({ hair: 8, hairCol: 14, outfit: 6, accessory: 5 });
  await page.locator('#lookAccessory button[data-opt="glasses"]').click();
  await page.locator('#lookHair button[data-opt="pony"]').click();
  await page.locator('#lookOutfit button[data-opt="dress"]').click();
  await page.locator('#lookDone').click();
  await page.waitForSelector('#ovLook', { state: 'hidden' });
  const look = await page.evaluate(() => PixelPets.keeper.look);
  expect(look.accessory).toBe('glasses');
  expect(look.hair).toBe('pony');
  expect(look.outfit).toBe('dress');
});

test('Mom is upstairs, and the side quest shows beside the main step', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoDebug(page);
  await page.locator('#questBtn').tap();
  await expect(page.locator('#questSide')).toHaveText(/Mom is upstairs/);
  await expect(page.locator('#questSidePlace')).toHaveText('Your home, upstairs');
  await page.keyboard.press('Escape');

  const home = await page.evaluate(() => {
    PixelPets.goto('hm_home_up', 4, 6, 'up');
    const info = PixelPets.mapInfo;
    return { id: info.id, mom: info.objs.find((o) => o.id === 'mom'), stairs: info.objs.some((o) => o.id === 'home_stairs_down') };
  });
  expect(home.id).toBe('hm_home_up');
  expect(home.mom).toBeTruthy();
  expect(home.stairs).toBe(true);

  const before = await page.evaluate(() => PixelPets.bond.pts);
  await page.evaluate(() => { PixelPets.setFlag('story.mom_met', true); PixelPets.runScene('mom_tidy'); });
  await playScene(page);
  const after = await page.evaluate(() => ({
    bond: PixelPets.bond.pts,
    chore: PixelPets.state.flags['story.mom_chore'],
    side: PPQuests.sideCurrent({ flags: PixelPets.state.flags, seals: {}, pets: 1 }).id,
  }));
  expect(after.chore).toBe(true);
  expect(after.bond).toBe(before + 4);
  expect(after.side).toBe('mom_sent');
});

test('Mahopac is quiet, and the dream toy pops into the next memory', async ({ page }) => {
  test.setTimeout(60000);
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoDebug(page);

  const town = await page.evaluate(() => {
    PixelPets.goto('mahopac', 9, 14, 'up');
    const info = PixelPets.mapInfo;
    return {
      dream: info.dream,
      frozen: info.objs.filter((o) => o.frozen).map((o) => o.id).sort(),
      trainers: info.objs.filter((o) => o.kind === 'trainer').length,
    };
  });
  expect(town.dream).toBeNull();
  expect(town.frozen).toEqual(['bess', 'cal', 'nora']);
  expect(town.trainers).toBe(0);

  const pushed = await page.evaluate(() => {
    PixelPets.goto('dream_2004', 3, 4, 'up');
    return { dream: PixelPets.mapInfo.dream, id: PixelPets.mapInfo.id };
  });
  expect(pushed.dream).toBe('young');
  expect(pushed.id).toBe('dream_2004');
  await page.keyboard.down('ArrowUp');
  await page.waitForFunction(() => PixelPets.state.flags['story.dream_roll'] === 1);
  await page.keyboard.up('ArrowUp');
  const toy = await page.evaluate(() => PixelPets.mapInfo.objs.find((o) => o.id === 'pop_toy'));
  expect(toy).toMatchObject({ x: 4, y: 3 });

  const bondBefore = await page.evaluate(() => PixelPets.bond.pts);
  await page.evaluate(() => PixelPets.runScene('dream_to_party'));
  await playScene(page);
  const party = await page.evaluate(() => ({
    map: PixelPets.mapInfo.id,
    dream: PixelPets.mapInfo.dream,
    toy: PixelPets.state.flags['story.dream_toy'],
    bond: PixelPets.bond.pts,
    balloons: PixelPets.mapInfo.objs.filter((o) => String(o.id).startsWith('balloon_')).length,
  }));
  expect(party.map).toBe('dream_party');
  expect(party.dream).toBe('child');
  expect(party.toy).toBe(true);
  expect(party.bond).toBe(bondBefore + 6);
  expect(party.balloons).toBe(3);

  await page.evaluate(() => PixelPets.runScene('dream_balloon_red'));
  await playScene(page);
  await page.evaluate(() => PixelPets.runScene('dream_balloon_yellow'));
  await playScene(page);
  await page.evaluate(() => PixelPets.runScene('dream_balloon_blue'));
  await playScene(page, ['School is fun', 'To see the stars', 'A toy, then Dad']);
  // The last balloon folds into the drive-through, which starts Dad on arrival.
  await page.waitForFunction(() => {
    const s = PixelPets.scene;
    return !s || s.id === 'dream_dad' || s.id === 'mom_wake' || PixelPets.state.flags['story.dream_woke'];
  });
  if (await page.evaluate(() => PixelPets.scene && PixelPets.scene.id === 'dream_dad')) {
    await playScene(page, ['School is fun', 'To see the stars']);
  }
  await page.waitForFunction(() => {
    const s = PixelPets.scene;
    return !s || s.id === 'mom_wake' || PixelPets.state.flags['story.dream_woke'];
  });
  if (await page.evaluate(() => PixelPets.scene && PixelPets.scene.id === 'mom_wake')) {
    await playScene(page, ['A toy, then Dad']);
  }
  await page.waitForFunction(() => PixelPets.state.flags['story.dream_woke'] === true);
  const woke = await page.evaluate(() => ({
    map: PixelPets.mapInfo.id,
    dream: PixelPets.mapInfo.dream,
    woke: PixelPets.state.flags['story.dream_woke'],
    side: PPQuests.sideCurrent({ flags: PixelPets.state.flags, seals: {}, pets: 1 }).id,
  }));
  expect(woke.map).toBe('hm_home_up');
  expect(woke.dream).toBeNull();
  expect(woke.woke).toBe(true);
  expect(woke.side).toBe('dream_study');
});
