/* TB-3: Cald's gate count, the first town-board slip. 390 only.
   Pin, talk, yes, and decline. The main chain id stays put. Save v stays 2. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, playScene, shot } = require('./helpers');

trackErrors(test, expect);

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== '390', 'the gate-count slip is checked at 390');
});

function save(flags) {
  const s = starterSave();
  s.settings.follower = false;
  s.world = { map: 'hearthmoor', x: 8, y: 9, facing: 'up', respawn: 'hearthmoor' };
  if (flags) Object.assign(s.flags, flags);
  return s;
}

async function boot(page, s) {
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true && window.PixelPets.state && window.PixelPets.state.v === 2);
  await page.evaluate(() => PixelPets.showTab('walk'));
}

async function face(page, id) {
  const stood = await page.evaluate((id) => {
    const o = (PixelPets.mapObjs || []).find((x) => x.id === id);
    if (!o) return null;
    const spots = [
      { x: o.x, y: o.y + 1, facing: 'up' },
      { x: o.x, y: o.y - 1, facing: 'down' },
      { x: o.x + 1, y: o.y, facing: 'left' },
      { x: o.x - 1, y: o.y, facing: 'right' },
    ];
    PixelPets.showTab('walk');
    for (const spot of spots) {
      const at = PixelPets.goto('hearthmoor', spot.x, spot.y, spot.facing);
      if (at && at.map === 'hearthmoor' && at.x === spot.x && at.y === spot.y) return { id, x: spot.x, y: spot.y, facing: spot.facing };
    }
    return null;
  }, id);
  expect(stood, id).toBeTruthy();
  return stood;
}

async function talkHere(page, choices, onChoice) {
  await page.keyboard.press('Space');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
  return playScene(page, choices || [], onChoice || null);
}

function read(page) {
  return page.evaluate(() => ({
    v: PixelPets.state.v,
    check: PixelPets.questCheck,
    quest: PixelPets.quest && PixelPets.quest.id,
    side: (PixelPets.sideActive || []).map((a) => a.chain),
    pins: PixelPets.boardPins,
    slips: PixelPets.townBoard.slips,
    bounties: PixelPets.townBoard.bounties,
    pinned: !!PixelPets.state.flags['story.board_gate_pinned'],
    yes: !!PixelPets.state.flags['story.board_gate_yes'],
    sign: !!PixelPets.state.flags['story.board_gate_sign'],
    done: !!PixelPets.state.flags['story.board_gate_done'],
    bond: PixelPets.state.party[0] ? PixelPets.state.party[0].bond || 0 : null,
    keepers: PixelPets.standing.keepers.points,
    glimmer: PixelPets.standing.glimmer.points,
    money: PixelPets.state.money,
  }));
}

test('the slip stays off until Rook\'s battle, and a pin does not accept it', async ({ page }) => {
  await boot(page, save({ 'story.phone_got': true }));
  let r = await read(page);
  expect(r.quest).toBe('rival1');
  expect(r.slips).toEqual([]);
  expect(r.bounties).toEqual([]);
  expect(r.pins).toEqual([]);
  expect(r.check).toEqual([]);
  expect(r.v).toBe(2);

  await page.evaluate(() => PixelPets.setFlag('story.rival1_done', true));
  r = await read(page);
  const quest = r.quest;
  expect(quest).toBe('first_wild');
  expect(r.slips.map((s) => s.id)).toEqual(['gate']);
  expect(r.slips[0].title).toBe('Gate count');
  expect(r.slips[0].who).toBe('Officer Cald');
  expect(r.slips[0].pinned).toBe(false);
  expect(r.bounties).toEqual([]);

  await page.locator('#phoneBtn').click();
  await page.locator('#phoneHome [data-app="board"]').click();
  const slip = page.locator('.board-slip');
  await expect(slip).toContainText('Gate count');
  await expect(slip).toContainText('Officer Cald');
  await expect(slip).toContainText('still standing');
  const go = slip.locator('button', { hasText: 'Go see them.' });
  await expect(go).toBeVisible();
  const box = await go.boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(box.width).toBeGreaterThanOrEqual(44);
  await slip.scrollIntoViewIfNeeded();
  await shot(page, 'tb3-slip');
  await page.locator('#phoneClose').click();

  await page.locator('#phoneBtn').click();
  await page.locator('#phoneHome [data-app="jobs"]').click();
  const jobs = await page.locator('#phoneBody').innerText();
  expect(jobs).toContain('Lantern check, Fernbrook. Reward later.');
  expect(jobs).toContain('Count the Route 2 lamps. Not live yet.');
  expect(jobs).toContain('No jobs are open. The desk is warming up.');
  await page.locator('#phoneClose').click();

  await face(page, 'hm_board');
  await page.keyboard.press('Space');
  await expect(page.locator('#ovPhone')).toBeVisible();
  await expect(page.locator('.board-slip button')).toHaveText('Go see them.');
  await page.locator('.board-slip button').click();
  r = await read(page);
  expect(r.pinned).toBe(true);
  expect(r.yes).toBe(false);
  expect(r.sign).toBe(false);
  expect(r.done).toBe(false);
  expect(r.quest).toBe(quest);
  expect(r.side).not.toContain('gate');
  expect(r.pins.map((p) => p.step)).toEqual(['gate']);
  expect(r.pins[0].point).toMatchObject({ x: 17, y: 7, here: true });
  await expect(page.locator('.board-pinned')).toHaveText('Pinned.');
  await expect(page.locator('.board-slip button')).toHaveCount(0);
  await page.locator('#phoneClose').click();

  await face(page, 'hm_sign_town');
  await page.keyboard.press('Space');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
  expect(await page.evaluate(() => PixelPets.scene.text)).toContain('HEARTHMOOR');
  await page.keyboard.press('Space');
  await page.waitForFunction(() => !PixelPets.scene);
  r = await read(page);
  expect(r.sign).toBe(false);
  expect(r.yes).toBe(false);

  const hops = { fernbrook: [5, 5], mahopac: [9, 14], cobblecrest: [5, 6], highcharity: [32, 20] };
  for (const [map, xy] of Object.entries(hops)) {
    const board = await page.evaluate(({ map, xy }) => {
      const at = PixelPets.goto(map, xy[0], xy[1], 'down');
      return { ok: !!(at && at.map === map), slips: PixelPets.townBoard.slips, bounties: PixelPets.townBoard.bounties, v: PixelPets.state.v };
    }, { map, xy });
    expect(board.ok, map).toBe(true);
    expect(board.slips, map).toEqual([]);
    expect(board.bounties, map).toEqual([]);
    expect(board.v).toBe(2);
  }
  r = await read(page);
  expect(r.check).toEqual([]);
  expect(r.quest).toBe(quest);
});

test('decline sets nothing, and yes then the sign then Cald finishes the count', async ({ page }) => {
  await boot(page, save({ 'story.phone_got': true, 'story.rival1_done': true, 'story.board_gate_pinned': true }));
  const before = await read(page);
  expect(before.quest).toBeTruthy();
  expect(before.yes).toBe(false);
  expect(before.keepers).toBe(0);
  expect(before.glimmer).toBe(0);
  expect(before.bond).toBe(0);

  await face(page, 'hm_cald');
  const declined = await talkHere(page, ['Not now'], async () => { await shot(page, 'tb3-cald-ask'); });
  expect(declined).toEqual(['Count the east sign?']);
  let r = await read(page);
  expect(r.yes).toBe(false);
  expect(r.pinned).toBe(true);
  expect(r.done).toBe(false);
  expect(r.bond).toBe(0);
  expect(r.quest).toBe(before.quest);
  expect(r.keepers).toBe(0);
  expect(r.glimmer).toBe(0);

  await face(page, 'hm_cald');
  const accepted = await talkHere(page, ["I'll look"]);
  expect(accepted).toEqual(['Count the east sign?']);
  r = await read(page);
  expect(r.yes).toBe(true);
  expect(r.sign).toBe(false);
  expect(r.done).toBe(false);
  expect(r.pins.map((p) => p.step)).toEqual(['gate_look']);
  expect(r.pins[0].point).toMatchObject({ x: 19, y: 10, here: true });
  expect(r.quest).toBe(before.quest);

  await face(page, 'hm_sign_town');
  await page.keyboard.press('Space');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
  const firstSign = await page.evaluate(() => PixelPets.scene.text);
  if (!firstSign.includes('still standing')) {
    await page.keyboard.press('Space');
    await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full && PixelPets.scene.text.includes('still standing'));
  }
  await shot(page, 'tb3-sign');
  await playScene(page, []);
  r = await read(page);
  expect(r.sign).toBe(true);
  expect(r.done).toBe(false);
  expect(r.pins.map((p) => p.step)).toEqual(['gate_tell']);
  expect(r.pins[0].point).toMatchObject({ x: 17, y: 7, here: true });

  await face(page, 'hm_cald');
  await page.keyboard.press('Space');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
  await shot(page, 'tb3-report');
  await playScene(page, []);
  r = await read(page);
  expect(r.done).toBe(true);
  expect(r.bond).toBe(2);
  expect(r.money).toBe(0);
  expect(r.keepers).toBe(0);
  expect(r.glimmer).toBe(0);
  expect(r.pins).toEqual([]);
  expect(r.slips).toEqual([]);
  expect(r.bounties).toEqual([]);
  expect(r.quest).toBe(before.quest);
  expect(r.side).not.toContain('gate');
  expect(r.check).toEqual([]);
  expect(r.v).toBe(2);

  await face(page, 'hm_cald');
  await page.keyboard.press('Space');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
  const again = await page.evaluate(() => PixelPets.scene.text);
  expect(again).not.toContain('gate count');
  await page.keyboard.press('Space');
  await page.waitForFunction(() => !PixelPets.scene);
  r = await read(page);
  expect(r.bond).toBe(2);
  expect(r.keepers).toBe(0);
  expect(r.v).toBe(2);
});
