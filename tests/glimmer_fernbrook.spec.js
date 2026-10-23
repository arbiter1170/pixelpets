/* Build 3: Glimmerwell Fernbrook path and the Bright Pavilion Tour.
   Widths come from the Playwright projects (320, 375, 390). */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, shot, playScene } = require('./helpers');

trackErrors(test, expect);

const WALK_AWAY = [
  "The crates aren't going anywhere. Yet.",
  'Fen watches the apple trees.',
  'Juniper waves. "Still deciding?"',
  'A Pomlet peeks out of a crate slat.',
  'Tobin restacks the same crate. Again.',
];

async function gotoDebug(page) {
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets.debug === true && typeof window.PixelPets.runScene === 'function');
}

function fernSave(extraFlags, world) {
  const save = starterSave();
  Object.assign(save.flags, {
    'story.reached_fernbrook': true,
    'story.met_glimmerwell': true,
    'story.met_fen': true,
  }, extraFlags || {});
  save.world = world || { map: 'fernbrook', x: 9, y: 9, facing: 'down', respawn: 'fernbrook' };
  save.standing = { keepers: 0, glimmer: 0 };
  return save;
}

async function runAndShot(page, id, name) {
  expect(await page.evaluate((sceneId) => PixelPets.runScene(sceneId), id)).toBe(true);
  await page.waitForFunction((sceneId) => {
    const s = window.PixelPets.scene;
    return s && s.id === sceneId && s.mode === 'say' && s.full;
  }, id);
  await page.evaluate(() => {
    const t = document.querySelector('#toast');
    t.classList.remove('show');
    t.style.transition = 'none';
  });
  if (page.viewportSize().width !== 375) await shot(page, name);
}

test('keepers pick leaves Fernbrook on the old path @w1', async ({ page }) => {
  await installSave(page.context(), fernSave(), { quietDay: true });
  await gotoDebug(page);
  expect(await page.evaluate(() => PixelPets.runScene('side_pick'))).toBe(true);
  await playScene(page, ['Open the crates with Fen', 'Yes, the Keepers']);
  const after = await page.evaluate(() => ({
    side: PixelPets.side,
    flags: PixelPets.state.flags,
    standing: PixelPets.standing,
    orchard: PixelPets.sceneFor('orchard'),
    seal: PixelPets.trainerFor('hall1_fen').seal,
    checks: PixelPets.glimmerCheck.concat(PixelPets.questCheck),
  }));
  expect(after.side).toBe('keepers');
  expect(after.flags['story.side']).toBe('keepers');
  expect(after.flags['story.side_pick_done']).toBe(true);
  expect(after.flags['story.met_fen']).toBe(true);
  expect(after.flags['story.orchard_cleared']).toBeUndefined();
  expect(after.orchard).toBe('orchard');
  expect(after.seal).toBe('seal_fernbrook');
  expect(after.standing.keepers.points).toBe(12);
  expect(after.standing.glimmer.points).toBe(0);
  expect(after.checks).toEqual([]);
});

test('an old save past the orchard never sees the side pick @w1', async ({ page }) => {
  await installSave(page.context(), fernSave(
    { 'story.orchard_cleared': true, 'story.side': 'keepers' },
    { map: 'fernbrook', x: 9, y: 10, facing: 'down', respawn: 'fernbrook' },
  ), { quietDay: true });
  await gotoDebug(page);
  const ids = await page.evaluate(() => PixelPets.mapObjs.map((o) => o.id));
  expect(ids).not.toContain('fb_side_pick');
  expect(await page.evaluate(() => PixelPets.scene)).toBeFalsy();
});

test('Think about it sets nothing, and stepping off the gate toasts once @w1', async ({ page }) => {
  await installSave(page.context(), fernSave(), { quietDay: true });
  await gotoDebug(page);
  await page.locator('#tabs button[data-tab="walk"]').click();
  await page.keyboard.down('ArrowDown');
  await page.waitForFunction(() => {
    const s = window.PixelPets.scene;
    return s && s.id === 'side_pick';
  });
  await page.keyboard.up('ArrowDown');
  await playScene(page, ['Think about it']);
  const mid = await page.evaluate(() => ({
    done: PixelPets.state.flags['story.side_pick_done'],
    side: PixelPets.state.flags['story.side'],
    x: PixelPets.state.world.x,
    y: PixelPets.state.world.y,
  }));
  expect(mid.done).toBeUndefined();
  expect(mid.side).toBeUndefined();
  expect(mid.x).toBe(9);
  expect(mid.y).toBe(10);
  await page.evaluate(() => {
    const t = document.querySelector('#toast');
    t.classList.remove('show');
    t.textContent = '';
  });
  await page.keyboard.down('ArrowUp');
  await page.waitForFunction(() => PixelPets.state.world.y === 9);
  await page.keyboard.up('ArrowUp');
  await page.waitForFunction((lines) => {
    const t = document.querySelector('#toast');
    return t && t.classList.contains('show') && lines.includes(t.textContent);
  }, WALK_AWAY);
  await page.keyboard.down('ArrowDown');
  await page.waitForFunction(() => {
    const s = window.PixelPets.scene;
    return s && s.id === 'side_pick';
  });
  await page.keyboard.up('ArrowDown');
});

test('glimmer path: orchard, tour stops, skippable match, lanyard, teaser', async ({ page }) => {
  test.setTimeout(90000);
  await installSave(page.context(), fernSave(), { quietDay: true });
  await gotoDebug(page);
  const cfg = await page.evaluate(() => PixelPets.standingCfg());
  expect(await page.evaluate(() => PixelPets.runScene('side_pick'))).toBe(true);
  await playScene(page, ['Pack crates with Tobin', 'Yes, Glimmerwell', 'Pat the crate', "They'll be comfy"], async (prompt) => {
    if (page.viewportSize().width === 375) return;
    if (prompt === 'Who do you help?') await shot(page, 'side_pick');
    if (prompt === 'The Pomlet blinks at you.') await shot(page, 'orchard_glimmer');
  });
  const packed = await page.evaluate(() => ({
    side: PixelPets.side,
    cleared: PixelPets.state.flags['story.orchard_cleared'],
    points: PixelPets.standing.glimmer.points,
  }));
  expect(packed.side).toBe('glimmer');
  expect(packed.cleared).toBe(true);
  expect(packed.points).toBe(cfg.grants.sp_pick + 2 + cfg.grants.orchard_g);

  await runAndShot(page, 'tour1_s1', 'tour_stop1');
  await playScene(page, ['Hand a lantern', 'Hand a lantern', 'Hand a lantern']);
  await runAndShot(page, 'tour1_s2', 'tour_stop2');
  await playScene(page, ['Question it']);
  await runAndShot(page, 'tour1_s3', 'tour_stop3');
  await playScene(page, ['Brighter by nature.']);
  await runAndShot(page, 'tour1_s4', 'tour_stop4');
  let sealed = false;
  await playScene(page, ['Skip the match'], null, async () => {
    if (sealed || page.viewportSize().width === 375) return;
    sealed = true;
    const card = await page.evaluate(() => {
      const c = document.querySelector('#btSealArt');
      const name = document.querySelector('#btSealName').textContent;
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      const colors = new Set();
      for (let i = 0; i < d.length; i += 4) if (d[i + 3]) colors.add([d[i], d[i + 1], d[i + 2]].join(','));
      return { name, colors: [...colors] };
    });
    expect(card.name).toBe('Bright Tier 1 Lanyard');
    expect(card.colors).toContain('255,205,117');
    expect(card.colors).not.toContain('65,166,246');
    await shot(page, 'lanyard_card');
  });

  expect(await page.evaluate(() => PixelPets.runScene('teaser'))).toBe(true);
  await playScene(page, []);
  const done = await page.evaluate(() => ({
    flags: PixelPets.state.flags,
    seal: PixelPets.state.seals.seal_glim_1,
    snacks: PixelPets.state.bag.heal_snack || 0,
    points: PixelPets.standing.glimmer.points,
    got: PixelPets.state.flags['standing.got.seal1_g'],
    match: PixelPets.state.flags['standing.got.tour1_match'],
    quest: PixelPets.quest && PixelPets.quest.id,
    rubble: PixelPets.mapObjs.some((o) => o.id === 'fb_rubble'),
    east: PixelPets.mapObjs.some((o) => o.id === 'fb_east'),
    doubt: PixelPets.state.flags['story.tour_unease'],
    oldDoubt: PixelPets.state.flags['tour.doubt'],
  }));
  expect(done.flags['story.tour1_s1']).toBe(true);
  expect(done.flags['story.tour1_s2']).toBe(true);
  expect(done.flags['story.tour1_s3']).toBe(true);
  expect(done.flags['story.seal1']).toBe(true);
  expect(done.flags['story.slice_end']).toBe(true);
  expect(done.seal).toBeTruthy();
  expect(done.snacks).toBe(2);
  expect(done.got).toBe(true);
  expect(done.match).toBeUndefined();
  expect(done.points).toBe(cfg.grants.sp_pick + 2 + cfg.grants.orchard_g + cfg.grants.seal1_g);
  expect(done.doubt).toBe(2);
  expect(done.oldDoubt).toBeUndefined();
  expect(done.rubble).toBe(false);
  expect(done.east).toBe(true);
  expect(done.quest).toBe('route2');
});

test('a worn-out party can skip the tour match, and a loss resumes at stop 4 @w1', async ({ page }) => {
  test.setTimeout(90000);
  const save = fernSave({
    'story.side': 'glimmer',
    'story.side_pick_done': true,
    'story.orchard_cleared': true,
    'story.tour1_s1': true,
    'story.tour1_s2': true,
    'story.tour1_s3': true,
  }, { map: 'fernbrook', x: 22, y: 6, facing: 'up', respawn: 'fernbrook' });
  await installSave(page.context(), save, { quietDay: true });
  await gotoDebug(page);
  await page.evaluate(() => PixelPets.setFaint(20));
  expect(await page.evaluate(() => PixelPets.runScene('tour1_s4'))).toBe(true);
  await playScene(page, ['Begin review']);
  const aborted = await page.evaluate(() => ({
    seal1: PixelPets.state.flags['story.seal1'],
    s3: PixelPets.state.flags['story.tour1_s3'],
    scene: PixelPets.scene,
  }));
  expect(aborted.scene).toBeFalsy();
  expect(aborted.seal1).toBeUndefined();
  expect(aborted.s3).toBe(true);

  await page.evaluate(() => PixelPets.healTeam());
  expect(await page.evaluate(() => PixelPets.runScene('tour1_s4'))).toBe(true);
  for (let i = 0; i < 40; i++) {
    const mode = await page.evaluate(() => (window.PixelPets.scene && window.PixelPets.scene.mode) || '');
    if (mode === 'choice') break;
    if (mode === 'say') await page.keyboard.press('Space');
    await page.waitForTimeout(40);
  }
  await page.waitForFunction(() => window.PixelPets.scene && window.PixelPets.scene.mode === 'choice' && window.PixelPets.optionsReady);
  await page.locator('#sbChoices button', { hasText: 'Begin review' }).click();
  for (let i = 0; i < 80 && !(await page.evaluate(() => !!(PixelPets.battle && PixelPets.battle.on))); i++) {
    const saying = await page.evaluate(() => {
      const s = window.PixelPets.scene;
      return !!(s && s.mode === 'say' && s.waiting);
    });
    if (saying) await page.keyboard.press('Space');
    await page.waitForTimeout(40);
  }
  await page.waitForFunction(() => {
    const b = window.PixelPets.battle;
    return b && b.on && b.state === 'CHOOSE';
  }, null, { timeout: 15000 });
  await page.evaluate(() => PixelPets.loseBattle());
  for (let i = 0; i < 50; i++) {
    const st = await page.evaluate(() => ({
      battle: !!(PixelPets.battle && PixelPets.battle.on),
      panel: PixelPets.battle && PixelPets.battle.panel,
      scene: !!PixelPets.scene,
    }));
    if (!st.battle && !st.scene) break;
    if (st.battle && st.panel === 'end') await page.locator('#btOk').click();
    else if (st.battle) await page.locator('#btMsg').click();
    else {
      // A wipe opens the Lantern House. Leave if the party is already well, otherwise Not yet (the door still holds them).
      const dismiss = page.locator('#sbChoices button', { hasText: /^(Leave|Not yet)$/ });
      if (await dismiss.count()) {
        await page.waitForFunction(() => window.PixelPets.optionsReady === true);
        await dismiss.first().click();
      } else await page.keyboard.press('Space');
    }
    await page.waitForTimeout(70);
  }
  await page.waitForFunction(() => PixelPets.mapInfo.id === 'fb_lantern_in' && !PixelPets.fading, null, { timeout: 15000 });
  const lost = await page.evaluate(() => ({
    map: PixelPets.mapInfo.id,
    seal1: PixelPets.state.flags['story.seal1'],
    s3: PixelPets.state.flags['story.tour1_s3'],
    trainer: PixelPets.state.flags['trainer.hall1_fen'],
  }));
  expect(lost.map).toBe('fb_lantern_in');
  expect(lost.seal1).toBeUndefined();
  expect(lost.s3).toBe(true);
  expect(lost.trainer).toBeUndefined();

  expect(await page.evaluate(() => PixelPets.runScene('tour1_s4'))).toBe(true);
  await playScene(page, ['Skip the match']);
  const resumed = await page.evaluate(() => ({
    seal1: PixelPets.state.flags['story.seal1'],
    lanyard: PixelPets.state.seals.seal_glim_1,
    match: PixelPets.state.flags['standing.got.tour1_match'],
    grant: PixelPets.state.flags['standing.got.seal1_g'],
  }));
  expect(resumed.seal1).toBe(true);
  expect(resumed.lanyard).toBeTruthy();
  expect(resumed.grant).toBe(true);
  expect(resumed.match).toBeUndefined();
});

test('winning the optional match grants the bonus once @w1', async ({ page }) => {
  test.setTimeout(60000);
  const save = fernSave({
    'story.side': 'glimmer',
    'story.side_pick_done': true,
    'story.orchard_cleared': true,
    'trainer.hall1_fen': true,
  });
  await installSave(page.context(), save, { quietDay: true });
  await gotoDebug(page);
  const cfg = await page.evaluate(() => PixelPets.standingCfg());
  expect(await page.evaluate(() => PixelPets.runScene('seal1'))).toBe(true);
  await playScene(page, []);
  const once = await page.evaluate(() => ({
    points: PixelPets.standing.glimmer.points,
    match: PixelPets.state.flags['standing.got.tour1_match'],
    grant: PixelPets.state.flags['standing.got.seal1_g'],
    seal1: PixelPets.state.flags['story.seal1'],
  }));
  expect(once.points).toBe(cfg.grants.tour1_match + cfg.grants.seal1_g);
  expect(once.match).toBe(true);
  expect(once.grant).toBe(true);
  expect(once.seal1).toBe(true);
  expect(await page.evaluate(() => PixelPets.runScene('seal1'))).toBe(true);
  await playScene(page, []);
  expect(await page.evaluate(() => PixelPets.standing.glimmer.points)).toBe(cfg.grants.tour1_match + cfg.grants.seal1_g);
});
