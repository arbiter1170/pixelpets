/* Keeper House, town officers, and the Keeper1 phone. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, playScene, boxesOverlap } = require('./helpers');

trackErrors(test, expect);

function readySave(extra) {
  const save = starterSave();
  Object.assign(save.flags, {
    'story.reached_route1': true,
    'story.starter_received': true,
  }, extra || {});
  save.world = { map: 'hearthmoor', x: 8, y: 9, facing: 'down', respawn: 'hearthmoor' };
  return save;
}

async function boot(page, save) {
  await installSave(page.context(), save || readySave(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets.debug === true && typeof window.PixelPets.runScene === 'function');
}

test('the phone is a side quest until the officers issue it', async ({ page }) => {
  await boot(page);
  const before = await page.evaluate(() => ({
    id: PixelPets.sideQuest && PixelPets.sideQuest.id,
    town: PixelPets.townFaction('hearthmoor'),
    glen: PixelPets.townFaction('route2_glen'),
    phone: document.querySelector('#phoneBtn').hidden,
    quest: document.querySelector('#questBtn').textContent,
  }));
  expect(before.id).toBe('phone');
  expect(before.town).toBe('keepers');
  expect(before.glen).toBe('glimmer');
  expect(before.phone).toBe(true);
  expect(before.quest).toContain('QUEST');

  expect(await page.evaluate(() => PixelPets.runScene('phone_grant'))).toBe(true);
  await playScene(page, []);
  const after = await page.evaluate(() => ({
    got: PixelPets.state.flags['story.phone_got'],
    item: PixelPets.state.bag.keeper1 || 0,
    side: PixelPets.sideQuest,
    btn: document.querySelector('#phoneBtn').hidden,
  }));
  expect(after.got).toBe(true);
  expect(after.item).toBe(1);
  expect(after.side).toBeFalsy();
  expect(after.btn).toBe(false);

  await page.locator('#phoneBtn').click();
  await expect(page.locator('#phoneTitle')).toHaveText('KEEPER1');
  await expect(page.locator('#phoneFoot')).toContainText('Lantern desk');
  await page.locator('#phoneJobs').click();
  await expect(page.locator('#phoneBody')).toContainText('KEEPERUAV');
  await expect(page.locator('#phoneBody')).toContainText('No jobs are open');
  await page.locator('#phoneBack').click();
  await page.locator('.phone-app[data-app="friends"]').click();
  await expect(page.locator('#friendCode')).toBeVisible();
  await page.locator('#phoneClose').click();
  await expect(page.locator('#ovPhone')).toBeHidden();
});

test('a cracked handset turns the phone into the thin one', async ({ page }) => {
  await boot(page, readySave({ 'story.phone_got': true, 'story.side': 'keepers', 'story.side_pick_done': true }));
  await page.evaluate(() => { PixelPets.giveItem('keeper1', 1); PixelPets.setSide('glimmer'); PixelPets.showTab('walk'); });
  await page.waitForFunction(() => !document.querySelector('#phoneBtn').hidden);
  await page.locator('#phoneBtn').click();
  await expect(page.locator('#phoneTitle')).toHaveText('CRACK//HAND');
  await expect(page.locator('#phoneJobs')).toHaveText('BOTNET');
  await page.locator('#phoneJobs').click();
  await expect(page.locator('#phoneBody')).toContainText('Dark-market parts');
  const bag = await page.evaluate(() => PixelPets.state.bag.cracked_phone || 0);
  expect(bag).toBe(1);
});

test('Keeper House talk depends on the pledge', async ({ page }) => {
  await boot(page);
  expect(await page.evaluate(() => PixelPets.goto('hm_hq_f1', 4, 6, 'up'))).toMatchObject({ map: 'hm_hq_f1' });
  expect(await page.evaluate(() => PixelPets.mapInfo.id)).toBe('hm_hq_f1');
  expect(await page.evaluate(() => PixelPets.runScene('hq_bram'))).toBe(true);
  await playScene(page, []);
  expect(await page.evaluate(() => PixelPets.state.flags['story.met_bram'])).toBe(true);

  await page.evaluate(() => { PixelPets.setFlag('story.met_bram', false); PixelPets.setSide('glimmer'); });
  expect(await page.evaluate(() => PixelPets.runScene('hq_bram'))).toBe(true);
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
  const cold = await page.evaluate(() => PixelPets.scene.text);
  expect(cold).toContain('doorway');
});

test('the road officer actually walks', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.showTab('walk'));
  const seen = new Set();
  for (let i = 0; i < 8; i++) {
    const pos = await page.evaluate(() => PixelPets.objPos('hm_patrol'));
    expect(pos.present).toBe(true);
    seen.add(pos.x + ',' + pos.y);
    await page.waitForTimeout(400);
  }
  expect(seen.size).toBeGreaterThan(1);
});

async function step(page, dir) {
  const before = await page.evaluate(() => ({
    map: PixelPets.mapInfo.id, x: PixelPets.state.world.x, y: PixelPets.state.world.y,
  }));
  await page.evaluate((dir) => {
    PixelPets.showTab('walk');
    PixelPets.walk.queued = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
  }, dir);
  await page.waitForFunction((prev) => {
    if (PixelPets.fading || PixelPets.keeper.moving) return false;
    const s = PixelPets.state.world;
    return PixelPets.mapInfo.id !== prev.map || s.x !== prev.x || s.y !== prev.y;
  }, before, { timeout: 4000 });
  return page.evaluate(() => {
    const s = PixelPets.state.world;
    const blocked = PixelPets.mapInfo.objs.filter((o) => o.block && o.x === s.x && o.y === s.y).map((o) => o.id);
    return { map: PixelPets.mapInfo.id, x: s.x, y: s.y, facing: s.facing, blocked };
  });
}

async function sayFacing(page) {
  await page.keyboard.press('Space');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
  const text = await page.evaluate(() => PixelPets.scene.text);
  await playScene(page, []);
  return text;
}

test('the Keeper House door opens on the floor and the way out is clear', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => { PixelPets.showTab('walk'); PixelPets.goto('hearthmoor', 11, 11, 'up'); });
  const inside = await step(page, 'up');
  expect(inside).toMatchObject({ map: 'hm_hq_f1', x: 4, y: 6, blocked: [] });
  const deeper = await step(page, 'up');
  expect(deeper).toMatchObject({ map: 'hm_hq_f1', x: 4, y: 5, blocked: [] });
  const cue = await page.evaluate(() => PixelPets.sideQuest && PixelPets.sideQuest.point);
  expect(cue).toMatchObject({ x: 4, y: 7, here: false });
  await step(page, 'down');
  const out = await step(page, 'down');
  expect(out).toMatchObject({ map: 'hearthmoor', x: 11, y: 11, blocked: [] });
  const south = await step(page, 'down');
  expect(south).toMatchObject({ map: 'hearthmoor', x: 11, y: 12, blocked: [] });
});

test('stairs down do not drop you inside the stair sign', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => { PixelPets.showTab('walk'); PixelPets.goto('hm_hq_f1', 6, 3, 'right'); });
  const up = await step(page, 'right');
  expect(up).toMatchObject({ map: 'hm_hq_f2', x: 7, y: 3, blocked: [] });
  const aside = await step(page, 'left');
  expect(aside).toMatchObject({ map: 'hm_hq_f2', x: 6, y: 3 });
  const down = await step(page, 'right');
  expect(down.map).toBe('hm_hq_f1');
  expect(down.blocked, 'downstairs warp landed on ' + down.blocked.join(', ')).toEqual([]);
});

test('town officers answer by pledge', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => { PixelPets.showTab('walk'); PixelPets.goto('hearthmoor', 8, 12, 'up'); });
  await page.locator('#tabs button[data-tab="walk"]').click();
  const citizen = await sayFacing(page);
  expect(citizen).toContain('Citizen');
  expect(citizen).not.toContain('mint');

  await page.evaluate(() => { PixelPets.setFlag('story.side', 'keepers'); PixelPets.setStanding('keepers', 0); });
  const pledge = await sayFacing(page);
  expect(pledge).toContain('coat');
  expect(pledge).not.toContain('Citizen');

  await page.evaluate(() => PixelPets.setStanding('keepers', 45));
  const trusted = await sayFacing(page);
  expect(trusted).toContain('asked after you');
  expect(trusted).not.toContain('Citizen');

  await page.evaluate(() => PixelPets.setFlag('story.side', 'glimmer'));
  const mint = await sayFacing(page);
  expect(mint).toContain('not sit');
  expect(mint).not.toContain('Come through');
  expect(mint).not.toContain('good list');

  await page.evaluate(() => {
    PixelPets.setFlag('story.met_bram', true);
    PixelPets.goto('hm_hq_f1', 2, 4, 'up');
  });
  const bram = await sayFacing(page);
  expect(bram).toContain('Doorway only');
  expect(bram).not.toContain('come in');
});

test('walking into the Route 1 officers clears the phone side quest', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    PixelPets.showTab('walk');
    PixelPets.goto('route1', 1, 8, 'right');
    PixelPets.clearWild();
  });
  expect(await page.evaluate(() => PixelPets.sideQuest && PixelPets.sideQuest.id)).toBe('phone');
  await page.evaluate(() => { PixelPets.walk.queued = [1, 0]; });
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.id === 'phone_grant');
  await playScene(page, []);
  const after = await page.evaluate(() => ({
    got: PixelPets.state.flags['story.phone_got'],
    item: PixelPets.state.bag.keeper1 || 0,
    side: PixelPets.sideQuest,
    hidden: document.querySelector('#phoneBtn').hidden,
    quest: PixelPets.quest && PixelPets.quest.id,
  }));
  expect(after.got).toBe(true);
  expect(after.item).toBe(1);
  expect(after.side).toBeFalsy();
  expect(after.hidden).toBe(false);
  expect(after.quest).not.toBe('phone');

  await page.evaluate(() => { PixelPets.goto('route1', 1, 8, 'right'); PixelPets.clearWild(); });
  await page.evaluate(() => { PixelPets.walk.queued = [1, 0]; });
  await page.waitForFunction(() => PixelPets.state.world.x === 2 && !PixelPets.keeper.moving && !PixelPets.fading);
  expect(await page.evaluate(() => PixelPets.scene)).toBeFalsy();
  expect(await page.evaluate(() => PixelPets.sideQuest)).toBeFalsy();

  const boxes = await page.evaluate(() => {
    const box = (el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    };
    return {
      phone: box(document.querySelector('#phoneBtn')),
      up: box(document.querySelector('.dp.up')),
      quest: box(document.querySelector('#questBtn')),
    };
  });
  expect(boxesOverlap(boxes.phone, boxes.up)).toBe(false);
  expect(boxesOverlap(boxes.phone, boxes.quest)).toBe(false);
});

test('a story glimmer pledge cracks the handset in that same session', async ({ page }) => {
  await boot(page, readySave({ 'story.phone_got': true }));
  expect(await page.evaluate(() => PixelPets.runSteps([
    ['give', 'keeper1', 1],
    ['setFlag', 'story.side', 'glimmer'],
    ['setFlag', 'story.side_pick_done', true],
    ['standing', 'glimmer', null, 'sp_pick'],
  ]))).toBe(true);
  await playScene(page, []);
  await page.waitForFunction(() => !PixelPets.scene && PixelPets.state.flags['story.side'] === 'glimmer');
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.locator('#phoneBtn').click();
  await expect(page.locator('#ovPhone')).toBeVisible();
  const got = await page.evaluate(() => ({
    title: document.querySelector('#phoneTitle').textContent,
    jobs: document.querySelector('#phoneJobs').textContent,
    cracked: PixelPets.state.bag.cracked_phone || 0,
    hack: PixelPets.phoneHack(),
    side: PixelPets.state.flags['story.side'],
  }));
  expect(got).toEqual({ title: 'CRACK//HAND', jobs: 'BOTNET', cracked: 1, hack: true, side: 'glimmer' });
});

test('the quest tab opens the next step without leaving the walk map', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.locator('#questBtn').click();
  await expect(page.locator('#ovQuest')).toBeVisible();
  const shown = await page.evaluate(() => ({
    text: document.querySelector('#questText').textContent,
    api: PixelPets.quest && PixelPets.quest.text,
    side: PixelPets.sideQuest && PixelPets.sideQuest.id,
    screens: [...document.querySelectorAll('.screen.active')].map((s) => s.id),
  }));
  expect(shown.text).toBe(shown.api);
  expect(shown.text.length).toBeGreaterThan(0);
  expect(shown.side).toBe('phone');
  expect(shown.screens).toEqual(['scr-walk']);
  await page.waitForFunction(() => PixelPets.optionsReady === true);
  await page.locator('#questClose').click();
  await expect(page.locator('#ovQuest')).toBeHidden();
  expect(await page.evaluate(() => [...document.querySelectorAll('.screen.active')].map((s) => s.id))).toEqual(['scr-walk']);
});

test('the east gate is open and a keeper stands beside it', async ({ page }) => {
  const save = readySave({ 'story.rival1_done': true });
  delete save.flags['story.reached_route1'];
  await boot(page, save);
  await page.evaluate(() => {
    PixelPets.showTab('walk');
    PixelPets.goto('hearthmoor', 16, 8, 'right');
  });
  const gate = await page.evaluate(() => {
    const objs = PixelPets.mapInfo.objs;
    const sign = objs.find((o) => o.id === 'hm_sign_town');
    const cald = objs.find((o) => o.id === 'hm_cald');
    const bren = objs.find((o) => o.id === 'hm_patrol');
    return {
      quest: PixelPets.quest && PixelPets.quest.id,
      point: PixelPets.quest && PixelPets.quest.point,
      sign, cald,
      brenPatrol: !!(bren && bren.x >= 4),
    };
  });
  expect(gate.quest).toBe('first_wild');
  expect(gate.point).toMatchObject({ x: 20, y: 9, here: true });
  expect(gate.sign).toMatchObject({ x: 19, y: 10, block: true });
  expect(gate.cald).toMatchObject({ x: 17, y: 7, block: true });
  expect(gate.brenPatrol).toBe(true);

  await page.evaluate(() => {
    PixelPets.setFlag('story.first_wild_met', true);
    PixelPets.clearWild();
    PixelPets.goto('hearthmoor', 16, 9, 'right');
  });
  for (let x = 17; x <= 20; x++) {
    const landed = await step(page, 'right');
    expect(landed, 'grass beside the east path').toMatchObject({ map: 'hearthmoor', x, y: 9, blocked: [] });
  }

  await page.evaluate(() => PixelPets.goto('hearthmoor', 16, 8, 'right'));
  for (let x = 17; x <= 22; x++) {
    await page.waitForFunction((nx) => {
      return !PixelPets.mapInfo.objs.some((o) => o.block && o.x === nx && o.y === 8);
    }, x);
    const landed = await step(page, 'right');
    expect(landed, 'east path').toMatchObject({ map: 'hearthmoor', x, y: 8, blocked: [] });
  }
  await page.waitForFunction(() => !PixelPets.mapInfo.objs.some((o) => o.block && o.x === 23 && o.y === 8));
  const out = await step(page, 'right');
  expect(out.map).toBe('route1');
  expect(out.blocked).toEqual([]);
});

test('town paint and the glimmer body follow the pledge', async ({ page }) => {
  await boot(page, readySave({ 'story.phone_got': true }));
  const fac = await page.evaluate(() => {
    const bought = () => {
      PixelPets.setFlag('story.quarry_bought', true);
      return { cobble: PixelPets.townFaction('cobblecrest'), hall: PixelPets.townFaction('cc_hall_in') };
    };
    return {
      town: PixelPets.townFaction('hearthmoor'),
      hq: PixelPets.townFaction('hm_hq_f1'),
      glen: PixelPets.townFaction('route2_glen'),
      route2: PixelPets.townFaction('route2'),
      cobble: PixelPets.townFaction('cobblecrest'),
      hall: PixelPets.townFaction('cc_hall_in'),
      bought: bought(),
    };
  });
  expect(fac.town).toBe('keepers');
  expect(fac.hq).toBe('keepers');
  expect(fac.glen).toBe('glimmer');
  expect(fac.route2).toBe('keepers');
  expect(fac.cobble).toBe('keepers');
  expect(fac.hall).toBe('keepers');
  expect(fac.bought).toEqual({ cobble: 'glimmer', hall: 'glimmer' });

  const look = await page.evaluate(() => {
    const saved = PixelPets.state.player.look.accent;
    const coat = PixelPets.state.player.look.outfitCol;
    PixelPets.setSide('glimmer');
    PixelPets.setStanding('glimmer', 0);
    const tier0 = PixelPets.keeper.look.accent;
    PixelPets.setStanding('glimmer', 10);
    const tier1 = { accent: PixelPets.keeper.look.accent, outfit: PixelPets.keeper.look.outfitCol };
    PixelPets.setStanding('glimmer', 25);
    const tier2 = PixelPets.keeper.look.outfitCol;
    PixelPets.setStanding('glimmer', 45);
    const tier3 = PixelPets.keeper.look.hairCol;
    PixelPets.setStanding('glimmer', 70);
    const tier4 = PixelPets.keeper.look.accent;
    return {
      saved, coat, tier0, tier1, tier2, tier3, tier4,
      stillAccent: PixelPets.state.player.look.accent,
      stillCoat: PixelPets.state.player.look.outfitCol,
    };
  });
  expect(look.tier0).toBe(look.saved);
  expect(look.tier1).toEqual({ accent: 'c', outfit: look.coat });
  expect(look.tier2).toBe('s');
  expect(look.tier3).toBe('h');
  expect(look.tier4).toBe('s');
  expect(look.stillAccent).toBe(look.saved);
  expect(look.stillCoat).toBe(look.coat);
});
