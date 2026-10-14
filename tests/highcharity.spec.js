/* High Charity: the Keeper capital, Ilse's letter, and the five Event Hall games. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, shot, playScene } = require('./helpers');

trackErrors(test, expect);

function citySave(flags, world) {
  const save = starterSave();
  Object.assign(save.flags, {
    'story.side_pick_done': true,
    'story.side': 'keepers',
    'story.hc_invite': true,
    'story.cobble_end': true,
  }, flags || {});
  save.world = world || { map: 'hearthmoor', x: 8, y: 8, facing: 'down', respawn: 'hearthmoor' };
  save.standing = { keepers: 10, glimmer: 0 };
  return save;
}

async function boot(page, save) {
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
}

test('the city stays shut until a side is picked', async ({ page }) => {
  const save = starterSave();
  save.world = { map: 'hearthmoor', x: 8, y: 8, facing: 'down', respawn: 'hearthmoor' };
  await boot(page, save);
  const ids = await page.evaluate(() => PixelPets.mapObjs.map(o => o.id));
  expect(ids).not.toContain('hm_to_hc');
  expect(await page.evaluate(() => PixelPets.charityCheck())).toEqual([]);
});

test('the coach appears after the pledge and the city is the large map', async ({ page }) => {
  await boot(page, citySave({ 'story.hc_invite': false, 'story.cobble_end': false }));
  await page.evaluate(() => PixelPets.goto('hearthmoor', 8, 8, 'down'));
  const ids = await page.evaluate(() => PixelPets.mapObjs.map(o => o.id));
  expect(ids).toContain('hm_to_hc');
  expect(ids).toContain('hm_bram');
  const info = await page.evaluate(() => {
    PixelPets.showTab('walk');
    return PixelPets.goto('highcharity', 32, 20, 'down');
  });
  expect(info).toEqual({ map: 'highcharity', x: 32, y: 20 });
  const map = await page.evaluate(() => PixelPets.mapInfo);
  expect(map.w).toBe(64);
  expect(map.h).toBe(40);
  expect(map.id).toBe('highcharity');
  const hall = await page.evaluate(() => PixelPets.mapObjs.find(o => o.id === 'hc_hall'));
  expect(hall).toBeTruthy();
  await page.waitForTimeout(200);
  if (page.viewportSize().width === 390) await shot(page, 'highcharity-plaza');
});

test('clears pay once, then the replay, and bond stops at 3', async ({ page }) => {
  await boot(page, citySave());
  const first = await page.evaluate(() => {
    const lines = PixelPets.applyPlay('lantern', { clear: true, score: 12 });
    return {
      lines,
      bag: PixelPets.state.bag,
      bond: PixelPets.state.party[0].bond,
      flag: PixelPets.state.flags['story.hc_clear_lantern'],
      games: PixelPets.state.flags['story.hc_games'],
      mg: PixelPets.state.care.mg.lantern,
      dayBond: PixelPets.state.care.minigameBond,
    };
  });
  expect(first.bag.hearty_snack).toBe(1);
  expect(first.bond).toBe(1);
  expect(first.flag).toBe(true);
  expect(first.games).toBe(1);
  expect(first.mg).toBe(1);
  expect(first.dayBond).toBe(1);
  expect(first.lines.some(l => /Hearty Snack/.test(l[1]))).toBe(true);

  const second = await page.evaluate(() => {
    PixelPets.applyPlay('lantern', { clear: true, score: 12 });
    return { bag: PixelPets.state.bag, bond: PixelPets.state.care.minigameBond, mg: PixelPets.state.care.mg.lantern };
  });
  expect(second.bag.hearty_snack).toBe(1);
  expect(second.bag.heal_snack).toBe(1);
  expect(second.bond).toBe(2);
  expect(second.mg).toBe(2);

  await page.evaluate(() => PixelPets.applyPlay('lantern', { clear: true, score: 12 }));
  const capped = await page.evaluate(() => {
    const before = PixelPets.state.bag.heal_snack;
    const lines = PixelPets.applyPlay('lantern', { clear: true, score: 12 });
    return { before, after: PixelPets.state.bag.heal_snack, mg: PixelPets.state.care.mg.lantern, lines };
  });
  expect(capped.mg).toBe(3);
  expect(capped.after).toBe(capped.before);
  expect(capped.lines[0][1]).toMatch(/tomorrow/);

  const rest = await page.evaluate(() => {
    PixelPets.applyPlay('shells', { clear: true });
    PixelPets.applyPlay('chirp', { clear: true });
    PixelPets.applyPlay('dash', { clear: true });
    PixelPets.applyPlay('pairs', { clear: true });
    const s = PixelPets.state;
    return {
      bond: s.care.minigameBond,
      pet: s.party[0].bond,
      treats: s.bag.befriend_treat,
      tonic: s.bag.wake_tonic,
      tonicFlag: s.flags['story.hc_tonic'],
      money: s.money,
      joy: s.bag.joy_crumb,
      games: s.flags['story.hc_games'],
      chirp: s.flags['story.hc_clear_chirp'],
    };
  });
  expect(rest.bond).toBe(3);
  expect(rest.pet).toBe(3);
  expect(rest.treats).toBe(2);
  expect(rest.tonic).toBe(1);
  expect(rest.tonicFlag).toBe(true);
  expect(rest.money).toBe(80);
  expect(rest.joy).toBe(2);
  expect(rest.games).toBe(5);
  expect(rest.chirp).toBe(true);

  const replay = await page.evaluate(() => {
    PixelPets.applyPlay('chirp', { clear: false });
    const missed = PixelPets.state.bag.energy_sip;
    PixelPets.applyPlay('chirp', { clear: true });
    return { missed, sip: PixelPets.state.bag.energy_sip, bond: PixelPets.state.care.minigameBond };
  });
  expect(replay.missed).toBeUndefined();
  expect(replay.sip).toBe(1);
  expect(replay.bond).toBe(3);
});

test('a quit spends nothing', async ({ page }) => {
  await boot(page, citySave());
  const r = await page.evaluate(() => {
    const lines = PixelPets.applyPlay('dash', { quit: true, clear: true, score: 20 });
    return { lines, money: PixelPets.state.money, mg: PixelPets.state.care && PixelPets.state.care.mg };
  });
  expect(r.money).toBe(0);
  expect((r.mg && r.mg.lantern) || 0).toBe(0);
  expect(r.lines[0][1]).toMatch(/seat/);
});

test('the side quest replaces only the idle end card', async ({ page }) => {
  await boot(page, citySave({ 'story.cobble_end': false }));
  const early = await page.evaluate(() => PixelPets.quest.id);
  expect(early).not.toBe('hc_games');

  await boot(page, citySave());
  const council = await page.evaluate(() => PixelPets.quest.id);
  expect(council).toBe('hc_council');

  await boot(page, citySave({ 'story.hc_council_done': true }));
  const side = await page.evaluate(() => ({ id: PixelPets.quest.id, place: PixelPets.quest.place, text: PixelPets.quest.text }));
  expect(side.id).toBe('hc_games');
  expect(side.place).toBe('High Charity Event Hall');
  expect(side.text.length).toBeLessThanOrEqual(110);

  await boot(page, citySave({ 'story.side': 'glimmer' }));
  const glim = await page.evaluate(() => PixelPets.quest.text);
  expect(glim).toMatch(/Ilse wrote anyway/);

  const done = citySave({ 'story.hc_council_done': true });
  for (const id of ['lantern', 'shells', 'chirp', 'dash', 'pairs']) done.flags['story.hc_clear_' + id] = true;
  await boot(page, done);
  expect(await page.evaluate(() => PixelPets.quest.id)).toBe('end');
});

test('week prize key is the local Monday', async ({ page }) => {
  await boot(page, citySave());
  const key = await page.evaluate(() => PixelPets.weekKey(new Date(2026, 9, 14, 12).getTime()));
  expect(key).toBe('2026-10-12');
});

test('a booth opens Lantern Catch and Stop puts the seat back', async ({ page }) => {
  await boot(page, citySave());
  await page.evaluate(() => {
    PixelPets.showTab('walk');
    PixelPets.goto('hc_hall_in', 5, 9, 'up');
  });
  await page.waitForTimeout(200);
  if (page.viewportSize().width === 390) await shot(page, 'highcharity-hall');
  expect(await page.evaluate(() => PixelPets.openBooth('lantern'))).toBe(true);
  await page.waitForFunction(() => {
    const s = window.PixelPets.scene;
    return s && s.mode === 'say' && s.full && s.waiting;
  });
  await page.keyboard.press('Space');
  await page.waitForFunction(() => {
    const s = window.PixelPets.scene;
    return s && s.mode === 'choice' && s.full && window.PixelPets.optionsReady;
  });
  await page.locator('#sbChoices button', { hasText: 'Play' }).click();
  await page.waitForSelector('#ovPlay:not([hidden])');
  await page.waitForTimeout(250);
  if (page.viewportSize().width === 390) await shot(page, 'highcharity-lantern');
  await page.click('#playStop');
  await page.waitForFunction(() => {
    const s = window.PixelPets.scene;
    return s && s.mode === 'say';
  });
  await playScene(page, []);
  const after = await page.evaluate(() => ({
    scene: PixelPets.scene,
    mg: PixelPets.state.care && PixelPets.state.care.mg && PixelPets.state.care.mg.lantern,
    bond: PixelPets.state.party[0].bond || 0,
  }));
  expect(after.scene).toBeFalsy();
  expect(after.mg || 0).toBe(0);
  expect(after.bond).toBe(0);
});
