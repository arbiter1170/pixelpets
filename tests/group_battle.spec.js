/* Group battles: two foes at once, TARGET, both foes act, an ally on the last fight, a win and a loss. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, playScene } = require('./helpers');

trackErrors(test, expect);

async function gotoDebug(page) {
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets.debug === true && typeof window.PixelPets.forceTrainer === 'function');
}

async function openGroup(page, id) {
  await page.evaluate((trainerId) => {
    PixelPets.giveBx(500);
    PixelPets.healTeam();
    PixelPets.battle.textMs = 0;
    PixelPets.battle.rng = () => 0.5;
    PixelPets.forceTrainer(trainerId);
  }, id);
  await page.waitForFunction(() => window.PixelPets.battle && window.PixelPets.battle.state === 'CHOOSE');
}

async function playTurn(page) {
  const turn = await page.evaluate(() => PixelPets.battle.turn);
  // Fight and the move list are ready as soon as the panel says so. A stability wait on the button
  // can spend the whole test while the HP bar is still easing.
  await expect.poll(() => page.evaluate(() => {
    const B = PixelPets.battle;
    const fight = document.querySelector('[data-bact="fight"]');
    return !!(B && B.state === 'CHOOSE' && B.panel === 'acts' && fight && !fight.disabled && fight.offsetWidth);
  })).toBe(true);
  await page.locator('[data-bact="fight"]').click({ force: true });
  await expect.poll(() => page.evaluate(() => {
    const B = PixelPets.battle;
    const mv = document.querySelector('#btMoves button:not([disabled])');
    return !!(B && B.state === 'CHOOSE' && B.panel === 'fight' && mv);
  })).toBe(true);
  await page.locator('#btMoves button:not([disabled])').first().click({ force: true });
  await expect.poll(() => page.evaluate((n) => {
    const B = window.PixelPets.battle;
    return B.turn > n || B.state !== 'CHOOSE';
  }, turn)).toBe(true);
  for (let i = 0; i < 40; i++) {
    const st = await page.evaluate(() => {
      const B = PixelPets.battle;
      return { state: B.state, on: B.on, result: B.result, panel: B.panel };
    });
    // result is set before the win flag. The end panel means those lines have been written.
    if (!st.on || st.state === 'CHOOSE' || st.panel === 'end') return st;
    await page.locator('#btMsg').click({ force: true });
  }
  return page.evaluate(() => ({ state: PixelPets.battle.state, on: PixelPets.battle.on, result: PixelPets.battle.result, panel: PixelPets.battle.panel }));
}

test('a normal trainer is not a group battle', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoDebug(page);
  await openGroup(page, 'route1_pia');
  const view = await page.evaluate(() => ({
    group: PixelPets.battle.group,
    slots: PixelPets.battle.slots,
    aim: document.querySelector('#btAim').hidden,
    second: document.querySelector('#btFoe2Row').hidden,
    ally: document.querySelector('#btAllyRow').hidden,
  }));
  expect(view.group).toBe(false);
  expect(view.slots).toBeNull();
  expect(view.aim).toBe(true);
  expect(view.second).toBe(true);
  expect(view.ally).toBe(true);
});

test('TARGET swaps the aimed foe and wraps back', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoDebug(page);
  await openGroup(page, 'rx_wardens');
  const first = await page.locator('#btFoeName').textContent();
  const other = await page.locator('#btFoe2Name').textContent();
  expect(other).not.toBe(first);
  expect(await page.locator('#btAllyRow').isHidden()).toBe(true);
  await page.locator('#btAim').click();
  const aimed = await page.locator('#btFoeName').textContent();
  expect(aimed).not.toBe(first);
  expect(other.startsWith(aimed)).toBe(true);
  await page.locator('#btAim').click();
  await expect(page.locator('#btFoeName')).toHaveText(first);
});

test('one turn: you hit the aim, then both foes swing', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoDebug(page);
  await openGroup(page, 'rx_wardens');
  const before = await page.evaluate(() => {
    const B = PixelPets.battle;
    return {
      me: PixelPets.state.party[0].hpNow || null,
      max: null,
      foes: B.foes.map((f) => f.hp),
      names: B.foes.map((f) => f.species),
    };
  });
  expect((await playTurn(page)).state).toBe('CHOOSE');
  const after = await page.evaluate(() => {
    const B = PixelPets.battle;
    const tries = B.log.filter((line) => line.includes(' tries '));
    return { turn: B.turn, foes: B.foes.map((f) => f.hp), tries, me: document.querySelector('#btMeHpTxt').textContent };
  });
  expect(after.turn).toBe(1);
  expect(after.foes[0]).toBeLessThan(before.foes[0]);
  expect(after.foes[1]).toBe(before.foes[1]);
  expect(after.tries.filter((line) => line.includes(' tries ')).length).toBeGreaterThanOrEqual(3);
  const foeLines = after.tries.filter((line) => !line.startsWith('Tester'));
  expect(foeLines.length).toBeGreaterThanOrEqual(2);
});

test('the last lab fight brings Cal in beside you', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoDebug(page);
  await openGroup(page, 'rx_quinn');
  await expect(page.locator('#btAllyRow')).toBeVisible();
  await expect(page.locator('#btAllyName')).toContainText("Cal's");
  const before = await page.evaluate(() => PixelPets.battle.foes.map((f) => f.hp));
  expect((await playTurn(page)).state).toBe('CHOOSE');
  const after = await page.evaluate(() => ({
    foes: PixelPets.battle.foes.map((f) => f.hp),
    ally: PixelPets.battle.ally.hp,
    log: PixelPets.battle.log,
  }));
  expect(after.log.some((line) => line.includes("Cal's") && line.includes('Bump'))).toBe(true);
  expect(after.ally).toBeGreaterThan(0);
  expect(after.foes.some((hp, i) => hp < before[i])).toBe(true);
});

test('clearing both foes wins and does not set the story flag from a debug battle', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoDebug(page);
  await openGroup(page, 'rx_wardens');
  for (let n = 0; n < 2; n++) {
    await page.evaluate(() => { if (PixelPets.battle.on && PixelPets.battle.state === 'CHOOSE') PixelPets.setHp('foe', 1); });
    await playTurn(page);
  }
  await page.waitForFunction(() => !PixelPets.battle.on || PixelPets.battle.result === 'win');
  const end = await page.evaluate(() => ({
    result: PixelPets.battle.result,
    beaten: PixelPets.state.flags['trainer.rx_wardens'],
    floor: PixelPets.state.flags['story.rx_f1'],
  }));
  expect(end.result).toBe('win');
  expect(end.beaten).toBe(true);
  expect(end.floor).toBeUndefined();
});

test('a loss does not mark the group trainer beaten', async ({ page }) => {
  const save = starterSave();
  save.party[0].hpNow = 1;
  await installSave(page.context(), save, { quietDay: true });
  await gotoDebug(page);
  await page.evaluate(() => {
    PixelPets.battle.textMs = 0;
    PixelPets.battle.rng = () => 0.5;
    PixelPets.forceTrainer('sm_lookouts');
  });
  await page.waitForFunction(() => PixelPets.battle && PixelPets.battle.state === 'CHOOSE');
  await page.evaluate(() => PixelPets.setHp('me', 1));
  await expect.poll(() => page.evaluate(() => {
    const B = PixelPets.battle;
    const fight = document.querySelector('[data-bact="fight"]');
    return !!(B && B.state === 'CHOOSE' && B.panel === 'acts' && fight && !fight.disabled);
  })).toBe(true);
  await page.locator('[data-bact="fight"]').click({ force: true });
  await expect.poll(() => page.evaluate(() => PixelPets.battle.panel === 'fight' && !!document.querySelector('#btMoves button:not([disabled])'))).toBe(true);
  await page.locator('#btMoves button:not([disabled])').first().click({ force: true });
  await page.waitForFunction(() => PixelPets.battle.result === 'tired' || PixelPets.battle.state === 'IDLE');
  const end = await page.evaluate(() => ({
    result: PixelPets.battle.result,
    beaten: PixelPets.state.flags['trainer.sm_lookouts'],
    yard: PixelPets.state.flags['story.sm_look'],
  }));
  expect(end.result).toBe('tired');
  expect(end.beaten).toBeUndefined();
  expect(end.yard).toBeUndefined();
});

test('Heights beats grant Standing once, and only to that faction', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoDebug(page);
  await page.evaluate(() => PixelPets.setSide('keepers'));
  expect(await page.evaluate(() => PixelPets.runScene('sm_look_clear'))).toBe(true);
  await playScene(page, []);
  const yard = await page.evaluate(() => ({
    k: PixelPets.standing.keepers.points,
    g: PixelPets.standing.glimmer.points,
    got: PixelPets.state.flags['standing.got.heights_yard_k'],
  }));
  expect(yard.k).toBe(2);
  expect(yard.g).toBe(0);
  expect(yard.got).toBe(true);
  expect(await page.evaluate(() => PixelPets.runScene('sm_look_clear'))).toBe(true);
  await playScene(page, []);
  expect(await page.evaluate(() => PixelPets.standing.keepers.points)).toBe(2);

  await page.evaluate(() => PixelPets.setSide('glimmer'));
  expect(await page.evaluate(() => PixelPets.runScene('rx_done'))).toBe(true);
  await playScene(page, []);
  const bay = await page.evaluate(() => ({
    k: PixelPets.standing.keepers.points,
    g: PixelPets.standing.glimmer.points,
    got: PixelPets.state.flags['standing.got.heights_g'],
    done: PixelPets.heights.done,
  }));
  expect(bay.k).toBe(2);
  expect(bay.g).toBe(5);
  expect(bay.got).toBe(true);
  expect(bay.done).toBe(true);
});
