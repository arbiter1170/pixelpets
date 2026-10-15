/* Fernbrook Heights: the "get to know us" quest before the first trial, and group battles. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, playScene, shot } = require('./helpers');

trackErrors(test, expect);

async function gotoDebug(page) {
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets.debug === true && typeof window.PixelPets.runScene === 'function');
}

test('keepers offer points at the Heights tunnels and holds the trial', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoDebug(page);
  expect(await page.evaluate(() => PixelPets.heightsCheck.concat(PixelPets.questCheck))).toEqual([]);
  expect(await page.evaluate(() => PixelPets.runScene('side_pick'))).toBe(true);
  await playScene(page, ['Open the crates with Fen', 'Yes, the Keepers']);
  const after = await page.evaluate(() => ({
    path: PixelPets.heights.path,
    know: PixelPets.heights.know,
    quest: PixelPets.quest && PixelPets.quest.id,
    trial: PixelPets.trialReady,
  }));
  expect(after.path).toBe('tunnels');
  expect(after.know).toBe(true);
  expect(after.quest).toBe('heights');
  expect(after.trial).toBe(false);
  await page.evaluate(() => PixelPets.setFlag('story.heights_done', true));
  expect(await page.evaluate(() => PixelPets.trialReady)).toBe(true);
});

test('glimmer offer points at the RegenX lab', async ({ page }) => {
  test.setTimeout(60000);
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoDebug(page);
  expect(await page.evaluate(() => PixelPets.runScene('side_pick'))).toBe(true);
  await playScene(page, ['Pack crates with Tobin', 'Yes, Glimmerwell', 'Pat the crate', "They'll be comfy"]);
  const after = await page.evaluate(() => ({
    path: PixelPets.heights.path,
    side: PixelPets.side,
    cleared: PixelPets.state.flags['story.orchard_cleared'],
    quest: PixelPets.quest && PixelPets.quest.id,
    trial: PixelPets.trialReady,
  }));
  expect(after.side).toBe('glimmer');
  expect(after.path).toBe('lab');
  expect(after.cleared).toBe(true);
  expect(after.quest).toBe('heights');
  expect(after.trial).toBe(false);
});

test('a group battle fields two foes and a target control', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoDebug(page);
  expect(await page.evaluate(() => PixelPets.forceTrainer('rx_wardens'))).toBe(true);
  await page.waitForFunction(() => window.PixelPets.battle && window.PixelPets.battle.state === 'CHOOSE');
  const view = await page.evaluate(() => {
    const B = PixelPets.battle;
    return {
      group: B.group,
      n: B.slots.length,
      aim: document.querySelector('#btAim') && !document.querySelector('#btAim').hidden,
      second: document.querySelector('#btFoe2Row') && !document.querySelector('#btFoe2Row').hidden,
      name: document.querySelector('#btFoeName').textContent,
      other: document.querySelector('#btFoe2Name').textContent,
    };
  });
  expect(view.group).toBe(true);
  expect(view.n).toBe(2);
  expect(view.aim).toBe(true);
  expect(view.second).toBe(true);
  expect(view.name.length).toBeGreaterThan(0);
  expect(view.other.length).toBeGreaterThan(0);
  expect(view.other === view.name).toBe(false);
  await page.locator('#btAim').click();
  const swapped = await page.evaluate(() => document.querySelector('#btFoeName').textContent);
  expect(swapped).not.toBe(view.name);
});

test('a Bitlet floats in the RegenX bay and stays out of the wild', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoDebug(page);
  const info = await page.evaluate(() => {
    const i = SPECIES.findIndex(s => s.id === 'byte');
    const sp = SPECIES[i];
    PixelPets.goto('rx_f4', 9, 8, 'up');
    const objs = PixelPets.mapObjs;
    return {
      i,
      type: sp && sp.type,
      lab: !!(sp && sp.labOnly),
      names: sp ? sp.stages.map(s => s.name) : [],
      lastId: PPSave.SPECIES_IDS[PPSave.SPECIES_IDS.length - 1],
      forms: PPSave.FORM_IDS.length,
      learn: PixelPets.learnset('byte/2').map(e => e.id),
      moves: PixelPets.defaultMoves('byte/0', 5),
      odd: PixelPets.spawnOdds(['city', 'storm', 'meadow', 'night'], 'proto')[i],
      route: PixelPets.spawnOdds(['meadow'], 'route1')[i],
      v: PixelPets.state.v,
      quest: PixelPets.quest && PixelPets.quest.id,
      checks: PixelPets.heightsCheck.concat(PixelPets.questCheck),
      bay: PixelPets.mapInfo.id,
      wild: objs.find(o => o.id === 'rx_bitlet') || null,
      art: objs.filter(o => o.sprite).map(o => o.sprite + (o.art ? ':ok' : ':missing')),
      window: MAPDATA.heights.maps.rx_f4.grid[1],
      nia: MAPDATA.heights.looks.nia.hair,
    };
  });
  expect(info.i).toBe(14);
  expect(info.type).toBe('VOLT');
  expect(info.lab).toBe(true);
  expect(info.names).toEqual(['Bitlet', 'Hoverbyte', 'Archivolt']);
  expect(info.lastId).toBe('byte');
  expect(info.forms).toBe(45);
  expect(info.learn).toEqual(expect.arrayContaining(['cursor_tap', 'bit_burst', 'archive_surge']));
  expect(info.moves).toEqual(expect.arrayContaining(['bump', 'screen_glow', 'cursor_tap']));
  expect(info.odd).toBe(0);
  expect(info.route).toBe(0);
  expect(info.v).toBe(2);
  expect(info.checks).toEqual([]);
  expect(info.bay).toBe('rx_f4');
  expect(info.wild).toMatchObject({ id: 'rx_bitlet', kind: 'wild', x: 6, y: 5 });
  expect(info.art).toEqual(expect.arrayContaining(['arbiter:ok', 'rx_terminal:ok']));
  expect(info.window).toBe('#WWW##########WWW#');
  expect(info.nia).toBe('bob');
  expect(info.quest).not.toBe('end');
  await page.evaluate(() => PixelPets.showTab('walk'));
  await shot(page, 'regenx-bay');
  const opened = await page.evaluate(() => PixelPets.forceBattle('byte/0', 5));
  expect(opened).toBe(true);
  await page.waitForFunction(() => window.PixelPets.battle && window.PixelPets.battle.state === 'CHOOSE');
  await expect(page.locator('#btFoeName')).toContainText('Bitlet');
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});

test('an old Seal still opens the trial without the Heights quest', async ({ page }) => {
  const save = starterSave();
  save.flags['story.seal1'] = true;
  save.flags['story.side_pick_done'] = true;
  await installSave(page.context(), save, { quietDay: true });
  await gotoDebug(page);
  const q = await page.evaluate(() => ({ trial: PixelPets.trialReady, id: PixelPets.quest && PixelPets.quest.id }));
  expect(q.trial).toBe(true);
  expect(q.id).not.toBe('heights');
});
