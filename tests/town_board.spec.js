/* TB-1 town boards. Behavior runs on the 320 project. 375 and 390 skip.
   PixelPets.townBoard is read-only. Save v stays 2. See TOWN_BOARD.md. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, shot } = require('./helpers');

const EMPTY_SLIPS = 'No slips are pinned up.';
const EMPTY_BOUNTIES = 'No creature is named today.';
const LANTERN = 'THE LANTERN POST';
const BRIGHT = 'BRIGHT NOTICE';
const BOARD_TOWNS = ['hearthmoor', 'fernbrook', 'cobblecrest', 'highcharity', 'mahopac'];

trackErrors(test, expect);

test.describe('town board', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== '320', 'town-board behavior is checked at 320');
  });

  test('at 320, the Hearthmoor phone board stays the Lantern Post and the piles are empty', async ({ page }) => {
    await boot(page);
    let board = await requireBoard(page);
    assertPaper(board, 'hearthmoor', LANTERN);
    await expectReadOnly(page);

    await page.waitForFunction(() => {
      const btn = document.querySelector('#phoneBtn');
      return btn && !btn.hidden;
    });
    await page.locator('#phoneBtn').click();
    await expect(page.locator('#ovPhone')).toBeVisible();
    const boardBtn = page.locator('#phoneHome [data-app="board"]');
    const jobsBtn = page.locator('#phoneHome [data-app="jobs"]');
    await expect(boardBtn).toBeVisible();
    await expect(boardBtn).toHaveText('BOARD');
    await expect(jobsBtn).toBeVisible();
    await expect(jobsBtn).toHaveText('KEEPERUAV');
    await boardBtn.click();
    const phone = page.locator('#ovPhone');
    await expect(phone).toContainText('TOWN BOARD');
    await expect(phone).toContainText(LANTERN);
    await expect(phone).toContainText(EMPTY_SLIPS);
    await expect(phone).toContainText(EMPTY_BOUNTIES);
    await expect(phone).not.toContainText('PLACEHOLDER');
    await shot(page, 'town-board-phone');
    expectEmptyLines(linesOf(await phone.innerText()));
    await expect(page.locator('#phoneHome [data-app="jobs"]')).toHaveCount(1);

    await page.locator('#phoneClose').click();
    await expect(page.locator('#ovPhone')).toBeHidden();
    expect(await page.evaluate(() => PixelPets.setSide('glimmer'))).toBe('glimmer');
    board = await requireBoard(page);
    assertPaper(board, 'hearthmoor', LANTERN);

    await page.locator('#phoneBtn').click();
    await expect(page.locator('#phoneHome [data-app="jobs"]')).toHaveCount(1);
    await page.locator('#phoneHome [data-app="board"]').click();
    await expect(phone).toContainText('TOWN BOARD');
    await expect(phone).toContainText(LANTERN);
    expectEmptyLines(linesOf(await phone.innerText()));
    expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
  });

  test('at 320, Cobblecrest, Mahopac, High Charity, and the roads follow the town list @w1', async ({ page }) => {
    await boot(page);

    let board = await hop(page, 'cobblecrest', 5, 6);
    assertPaper(board, 'cobblecrest', LANTERN);
    expect(await page.evaluate(() => !!PixelPets.state.flags['story.quarry_bought'])).toBe(false);

    await page.evaluate(() => PixelPets.setFlag('story.quarry_bought', true));
    board = await requireBoard(page);
    assertPaper(board, 'cobblecrest', BRIGHT);
    board = await hop(page, 'cobblecrest', 5, 6);
    assertPaper(board, 'cobblecrest', BRIGHT);

    board = await hop(page, 'mahopac', 9, 14);
    assertPaper(board, 'mahopac', '');

    board = await hop(page, 'highcharity', 32, 20);
    assertPaper(board, 'highcharity', LANTERN);

    board = await hop(page, 'fernbrook', 5, 5);
    assertPaper(board, 'fernbrook', LANTERN);

    board = await hop(page, 'hearthmoor', 8, 9);
    assertPaper(board, 'hearthmoor', LANTERN);

    const noBoard = [
      { id: 'route1', x: 8, y: 8, name: 'Route 1' },
      { id: 'route2_glen', x: 12, y: 17, name: 'Wickerglen' },
      { id: 'proto', x: 3, y: 3, name: 'Old Meadow' },
      { id: 'cobble_quarry', x: 16, y: 17, name: 'the quarry' },
      { id: 'fb_heights', x: 11, y: 13, name: 'Fernbrook Heights' },
    ];
    for (const place of noBoard) {
      board = await hop(page, place.id, place.x, place.y);
      expect(board.map === 'hearthmoor' || board.lastTown === 'hearthmoor', place.name).toBe(true);
      expect(shownTown(board), place.name).toBe('hearthmoor');
      expect(shownTown(board), place.name).not.toBe(place.id);
      expect(board.masthead, place.name).toBe(LANTERN);
      expectEmptyPiles(board);
      expectPlaceholderReports(board);
    }
    expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
  });

  test('at 320, the Hearthmoor post shows the same empty board', async ({ page }) => {
    await boot(page);
    await requireBoard(page);
    const stood = await page.evaluate(() => {
      const objs = window.PixelPets.mapObjs || [];
      const hit = objs.find((o) => /board|bulletin/i.test([o.id, o.sprite, o.kind].filter(Boolean).join(' ')));
      if (!hit) return { error: 'no-prop' };
      const spots = [
        { x: hit.x, y: hit.y + 1, facing: 'up' },
        { x: hit.x, y: hit.y - 1, facing: 'down' },
        { x: hit.x + 1, y: hit.y, facing: 'left' },
        { x: hit.x - 1, y: hit.y, facing: 'right' },
      ];
      window.PixelPets.showTab('walk');
      for (const spot of spots) {
        const at = window.PixelPets.goto('hearthmoor', spot.x, spot.y, spot.facing);
        if (!at || at.map !== 'hearthmoor' || at.x !== spot.x || at.y !== spot.y) continue;
        if (window.PixelPets.clearWild) window.PixelPets.clearWild();
        return { error: null, id: hit.id, x: hit.x, y: hit.y };
      }
      return { error: 'no-stand', id: hit.id };
    });
    expect(stood.error, 'Hearthmoor physical board').toBeNull();
    await expect.poll(async () => page.evaluate(() => {
      const tb = document.querySelector('#talkBtn');
      return !!(tb && tb.classList.contains('ready'));
    })).toBe(true);
    await page.locator('#talkBtn').click();
    await expect.poll(async () => visibleBoardText(page)).toContain(LANTERN);
    const text = await visibleBoardText(page);
    await shot(page, 'town-board-physical');
    expect(text).toContain(LANTERN);
    expect(text).not.toContain('PLACEHOLDER');
    expectEmptyLines(linesOf(text));
    const board = await requireBoard(page);
    assertPaper(board, 'hearthmoor', LANTERN);
    expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
  });
});

function phoneSave() {
  const save = starterSave();
  save.flags['story.phone_got'] = true;
  save.world = { map: 'hearthmoor', x: 8, y: 9, facing: 'down', respawn: 'hearthmoor' };
  return save;
}

async function boot(page) {
  await installSave(page.context(), phoneSave(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true && window.PixelPets.state && window.PixelPets.state.v === 2);
  const seeded = await page.evaluate(() => ({
    v: PixelPets.state.v,
    partner: PixelPets.state.partnerId,
    lead: PixelPets.state.party[0] && PixelPets.state.party[0].id,
    phone: PixelPets.state.flags['story.phone_got'] === true,
  }));
  expect(seeded).toEqual({ v: 2, partner: 'petsmoke1', lead: 'petsmoke1', phone: true });
  await page.evaluate(() => PixelPets.showTab('walk'));
}

async function readBoard(page) {
  return page.evaluate(() => {
    const pp = window.PixelPets;
    if (!pp || !('townBoard' in pp) || !pp.townBoard) return null;
    const b = pp.townBoard;
    return {
      map: b.map ?? null,
      masthead: b.masthead ?? null,
      slogan: b.slogan ?? null,
      reports: b.reports,
      slips: b.slips,
      bounties: b.bounties,
      lastTown: b.lastTown ?? null,
      here: pp.mapInfo && pp.mapInfo.id,
      v: pp.state && pp.state.v,
    };
  });
}

async function requireBoard(page) {
  const board = await readBoard(page);
  expect(board, 'PixelPets.townBoard').toBeTruthy();
  return board;
}

async function hop(page, map, x, y, facing = 'down') {
  const landed = await page.evaluate(({ map, x, y, facing }) => {
    const pp = window.PixelPets;
    if (pp.scene) return { error: 'scene' };
    pp.showTab('walk');
    const at = pp.goto(map, x, y, facing);
    if (pp.clearWild) pp.clearWild();
    return { error: at ? null : 'goto', id: pp.mapInfo && pp.mapInfo.id };
  }, { map, x, y, facing });
  expect(landed.error, map).toBeNull();
  expect(landed.id, map).toBe(map);
  const board = await requireBoard(page);
  expect(board.here, map).toBe(map);
  expect(board.v).toBe(2);
  return board;
}

function shownTown(board) {
  if (!board) return '';
  if (BOARD_TOWNS.includes(board.map)) return board.map;
  if (BOARD_TOWNS.includes(board.lastTown)) return board.lastTown;
  return board.map || board.lastTown || '';
}

function assertPaper(board, town, masthead) {
  expect(shownTown(board)).toBe(town);
  if (masthead === '') expect((board.masthead || '').trim()).toBe('');
  else expect(board.masthead).toBe(masthead);
  expectEmptyPiles(board);
  expectPlaceholderReports(board);
  expect(board.v).toBe(2);
}

function expectEmptyPiles(board) {
  expect(Array.isArray(board.slips)).toBe(true);
  expect(Array.isArray(board.bounties)).toBe(true);
  expect(board.slips).toEqual([]);
  expect(board.bounties).toEqual([]);
}

function reportString(line) {
  if (typeof line === 'string') return line;
  if (line && typeof line.text === 'string') return line.text;
  return '';
}

function expectPlaceholderReports(board) {
  expect(Array.isArray(board.reports)).toBe(true);
  expect(board.reports.length).toBeGreaterThan(0);
  for (const line of board.reports) {
    const text = reportString(line);
    expect(text).toEqual(expect.any(String));
    expect(text).not.toContain('PLACEHOLDER');
  }
}

function linesOf(text) {
  return String(text || '').replace(/\u00a0/g, ' ').split('\n').map((s) => s.trim()).filter(Boolean);
}

function expectEmptyLines(lines) {
  expect(lines.filter((l) => l === EMPTY_SLIPS)).toEqual([EMPTY_SLIPS]);
  expect(lines.filter((l) => l === EMPTY_BOUNTIES)).toEqual([EMPTY_BOUNTIES]);
}

async function expectReadOnly(page) {
  const again = await page.evaluate(() => {
    const a = window.PixelPets.townBoard;
    try { a.slips.push('nope'); } catch (e) { /* frozen copy */ }
    try { a.bounties.push('nope'); } catch (e) { /* frozen copy */ }
    try { a.masthead = 'NOPE'; } catch (e) { /* frozen copy */ }
    try { a.reports.push('NOPE PLACEHOLDER'); } catch (e) { /* frozen copy */ }
    const b = window.PixelPets.townBoard;
    return {
      slips: b.slips.slice(),
      bounties: b.bounties.slice(),
      masthead: b.masthead,
      reports: b.reports.slice(),
    };
  });
  expect(again.slips).toEqual([]);
  expect(again.bounties).toEqual([]);
  expect(again.masthead).toBe(LANTERN);
  expect(again.reports.map(reportString)).not.toContain('NOPE PLACEHOLDER');
  expect(again.reports.some((line) => reportString(line).includes('PLACEHOLDER'))).toBe(false);
  expect(again.reports.length > 0).toBe(true);
}

async function visibleBoardText(page) {
  return page.evaluate(() => {
    const nodes = [...document.querySelectorAll('.overlay, #ovScene')];
    const open = nodes.filter((el) => !el.hidden && el.getClientRects().length);
    return open.map((el) => el.innerText || '').join('\n');
  });
}
