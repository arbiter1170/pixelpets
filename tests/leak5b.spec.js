/* The leak in 5B (D177, D182). Both paths, a replay, and Not now. Save v stays 2. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, playScene } = require('./helpers');

trackErrors(test, expect);

function save(flags, world) {
  const s = starterSave();
  s.settings.follower = false;
  if (flags) Object.assign(s.flags, flags);
  if (world) s.world = Object.assign({ facing: 'down', respawn: 'hearthmoor' }, world);
  return s;
}

async function boot(page, s) {
  await installSave(page.context(), s || save(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
}

async function talk(page, map, x, y, facing, choices) {
  await page.evaluate(({ map, x, y, facing }) => PixelPets.goto(map, x, y, facing), { map, x, y, facing });
  await page.keyboard.press('Space');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
  return playScene(page, choices || []);
}

function read(page) {
  return page.evaluate(() => ({
    v: PixelPets.state.v,
    check: PixelPets.questCheck,
    moral: PixelPets.moralCheck ? PixelPets.moralCheck() : [],
    flag: PixelPets.state.flags['story.moral_leak5b'] || null,
    fixed: !!PixelPets.state.flags['story.leak_fixed'],
    filed: !!PixelPets.state.flags['story.leak5b_filed'],
    served: !!PixelPets.state.flags['story.leak5b_served'],
    seen: !!PixelPets.state.flags['story.leak5b_seen'],
    yes: !!PixelPets.state.flags['story.leak5b_yes'],
    keepers: PixelPets.standing.keepers.points,
    glimmer: PixelPets.standing.glimmer.points,
    lizzy: PixelPets.repGet('Lizzy'),
    gristle: PixelPets.repGet('Mr. Gristle'),
    snacks: PixelPets.state.bag.hearty_snack || 0,
    drip: PixelPets.mapInfo.id === 'hm_flats_5' && PixelPets.mapInfo.objs.some(o => o.id === 'f5_drip'),
    step: (() => {
      const rows = PPQuests.sideActive({ flags: PixelPets.state.flags, seals: {}, pets: 1 });
      const hit = rows.find(r => r.chain === 'leak_ask');
      return hit ? hit.step.id : null;
    })(),
  }));
}

test('before you have met Lizzy the bucket only drips', async ({ page }) => {
  await boot(page, save());
  await page.evaluate(() => PixelPets.goto('hm_flats_5', 10, 4, 'right'));
  await page.keyboard.press('Space');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
  const text = await page.evaluate(() => PixelPets.scene.text);
  expect(text).toBe('Drip. Drip. Drip.');
  await page.keyboard.press('Space');
  await page.waitForFunction(() => !PixelPets.scene);
  const r = await read(page);
  expect(r.seen).toBe(false);
  expect(r.v).toBe(2);
  expect(r.check).toEqual([]);
});

test('the court path files the claim, serves it, and grants once', async ({ page }) => {
  const s = save({ 'story.lizzy_met': true });
  s.standing = { keepers: 0, glimmer: 10 };
  await boot(page, s);
  await talk(page, 'hm_flats_5', 10, 4, 'right');
  let r = await read(page);
  expect(r.seen).toBe(true);
  expect(r.step).toBe('leak_ask');

  await talk(page, 'hm_flats_5', 14, 3, 'left', ["I'll talk to him"]);
  r = await read(page);
  expect(r.yes).toBe(true);
  expect(r.step).toBe('leak_gristle');

  await talk(page, 'hm_flats_lobby', 8, 9, 'left', ['Take it to the Keepers']);
  r = await read(page);
  expect(r.flag).toBe('court');
  expect(r.keepers).toBe(3);
  expect(r.glimmer).toBe(9);
  expect(r.lizzy).toBe(60);
  expect(r.step).toBe('leak_file');

  const again = await page.evaluate(() => PixelPets.runScene('leak_gristle'));
  expect(again).toBe(true);
  await playScene(page, ['Take it to the Keepers']);
  r = await read(page);
  expect(r.keepers).toBe(3);
  expect(r.glimmer).toBe(9);
  expect(r.lizzy).toBe(60);

  await talk(page, 'hm_hq_f1', 3, 11, 'up');
  await talk(page, 'hm_hq_f1', 3, 11, 'up');
  r = await read(page);
  expect(r.filed).toBe(true);
  expect(r.step).toBe('leak_serve');

  await talk(page, 'fernbrook', 4, 10, 'up');
  await page.evaluate(() => PixelPets.goto('hm_flats_5', 10, 4, 'right'));
  r = await read(page);
  expect(r.fixed).toBe(true);
  expect(r.served).toBe(true);
  expect(r.snacks).toBe(2);
  expect(r.drip).toBe(false);
  expect(r.step).toBe(null);
  expect(r.v).toBe(2);
  expect(r.check).toEqual([]);
});

test('the force path drops Mr. Gristle to 30 and does not grant twice', async ({ page }) => {
  const s = save({ 'story.lizzy_met': true, 'story.leak5b_seen': true, 'story.leak5b_yes': true });
  s.standing = { keepers: 10, glimmer: 0 };
  await boot(page, s);
  await talk(page, 'hm_flats_lobby', 8, 9, 'left', ['Make him fix it']);
  let r = await read(page);
  expect(r.flag).toBe('force');
  expect(r.glimmer).toBe(3);
  expect(r.keepers).toBe(8);
  expect(r.gristle).toBe(30);
  expect(r.lizzy).toBe(45);
  expect(r.fixed).toBe(true);
  expect(r.snacks).toBe(2);
  expect(r.v).toBe(2);
  expect(r.check).toEqual([]);

  await page.evaluate(() => PixelPets.runScene('leak_gristle'));
  await playScene(page, ['Make him fix it']);
  r = await read(page);
  expect(r.glimmer).toBe(3);
  expect(r.gristle).toBe(30);
});

test('Not now sets nothing', async ({ page }) => {
  await boot(page, save({ 'story.lizzy_met': true, 'story.leak5b_seen': true, 'story.leak5b_yes': true }));
  await talk(page, 'hm_flats_lobby', 8, 9, 'left', ['Not now']);
  const r = await read(page);
  expect(r.flag).toBe(null);
  expect(r.keepers).toBe(0);
  expect(r.glimmer).toBe(0);
  expect(r.gristle).toBe(50);
  expect(r.fixed).toBe(false);
  expect(r.v).toBe(2);
  expect(r.check).toEqual([]);
});
