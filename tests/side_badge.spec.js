/* SIDE_BADGE (Vincent, Nov 2, 2026): faction control lives inside the place chip, so it is always on the walk screen and
   takes almost no room (Vincent's follow-up). A 12 px emblem after the hour is your pledge (neutral before the side pick); a
   3 px stripe is who holds the place (REGION_MAP hold). Arriving at a new town or route lays the hold word over the place
   line (KEEPERS, GLIMMERWELL, BOTH SIDES, UNCLAIMED). The chip opens TODAY; its STANDING row opens STANDING after the pick,
   or a card with no points before it (A). The word shows before the pick (B); no controller reads UNCLAIMED (C); rooms
   never show it but keep the town's stripe (D). The map shows who holds every visited place (D1164). Nothing is saved. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, shot } = require('./helpers');

trackErrors(test, expect);

const PICK_K = { 'story.side_pick_done': true };

function save(flags, extra, controls) {
  const s = starterSave();
  s.settings.tips = false;
  s.settings.follower = false;
  s.settings.controls = controls || 'modern';
  Object.assign(s.flags, flags || {});
  if (extra) Object.assign(s, extra);
  return s;
}

async function boot(page, flags, opts) {
  const o = opts || {};
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), save(flags, o.extra, o.controls), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await expect(page.locator('#thChip')).toBeVisible();
}

const badge = (page) => page.evaluate(() => PixelPets.sideBadge());
async function arrive(page, map, x, y) {
  expect(await page.evaluate(([m, xx, yy]) => PixelPets.goto(m, xx, yy, 'down'), [map, x, y])).toBeTruthy();
  // A toast on arrival holds the word back until it clears (flushSideBar); wait for that.
  await page.waitForFunction(() => !window.PixelPets.sideBadge().pending, null, { timeout: 6000 });
  return badge(page);
}
async function openStandingRow(page) {
  await page.locator('#thChip').click();
  await expect(page.locator('#ovEnv')).toBeVisible();
  await expect(page.locator('#envStanding')).toBeVisible();
  const r = await page.locator('#envStanding').boundingBox();
  expect(r.height).toBeGreaterThanOrEqual(44);
  await page.locator('#envStanding').click();
}

for (const controls of ['modern', 'arcade']) {
  test(`faction control sits inside the place chip, takes no extra button, and is always there (${controls})`, async ({ page }) => {
    await boot(page, {}, { controls });
    const b = await badge(page);
    expect(b.side).toBe('none');
    expect(b.hold).toBe('keepers');            // Hearthmoor
    expect(b.open).toBe(false);                // loading a save is not an arrival
    expect(b.label).toContain("You haven't picked a side yet. Home. The Keepers hold this town. Tap for today.");
    expect(b.label).toMatch(/Tap for today\.$/);
    await expect(page.locator('#sideEmblem')).toBeVisible();
    await expect(page.locator('#thStripe')).toBeVisible();
    const chip = await page.locator('#thChip').boundingBox();
    const em = await page.locator('#sideEmblem').boundingBox();
    expect(em.width).toBeLessThanOrEqual(12.5);
    expect(em.x).toBeGreaterThanOrEqual(chip.x);
    expect(em.x + em.width).toBeLessThanOrEqual(chip.x + chip.width);
    expect(await page.locator('#sideBadge, #sideBtn, #sideBar').count()).toBe(0);
    await shot(page, 'side-chip-' + controls);
    await page.evaluate(() => PixelPets.setFlag('story.side_pick_done', true));
    await page.evaluate(() => PixelPets.setSide('glimmer'));
    await arrive(page, 'route1', 5, 5);
    expect((await badge(page)).side).toBe('glimmer');
    await expect(page.locator('#sideEmblem')).toBeVisible();
  });
}

test('before the pick the TODAY card STANDING row opens a card with both pitches and no points (A)', async ({ page }) => {
  await boot(page);
  await page.locator('#thChip').click();
  await expect(page.locator('#envStandingTitle')).toHaveText("STANDING: You haven't picked a side yet");
  await expect(page.locator('#envStandingLine')).toHaveText('Hearthmoor: KEEPERS');
  await shot(page, 'side-chip-today-row');
  await page.locator('#envStanding').click();
  await expect(page.locator('#ovEnv')).toBeHidden();
  await expect(page.locator('#ovSide')).toBeVisible();
  await expect(page.locator('#sideTitle')).toHaveText("You haven't picked a side yet");
  const rows = await page.locator('#sideRows .side-row').evaluateAll((els) => els.map((e) => ({ side: e.dataset.side, text: e.textContent })));
  expect(rows.map((r) => r.side)).toEqual(['keepers', 'glimmer']);
  expect(rows[0].text).toContain('The Keepers ask you to walk beside wild Walklings, not ahead of them.');
  expect(rows[1].text).toContain('Glimmerwell asks for output: log the Census, pack the crates, hit quarterly targets, smile on stage.');
  for (const r of rows) expect(r.text).not.toMatch(/\d/);   // no points before the pick
  await shot(page, 'side-badge-unpledged-card');
  const close = await page.locator('#sideClose').boundingBox();
  expect(close.height).toBeGreaterThanOrEqual(44);
  await page.locator('#sideClose').click();
  await expect(page.locator('#ovSide')).toBeHidden();
});

test('after the pick the STANDING row opens STANDING', async ({ page }) => {
  await boot(page, PICK_K, { extra: { standing: { keepers: 12, glimmer: 0 } } });
  expect((await badge(page)).side).toBe('keepers');
  await openStandingRow(page);
  await expect(page.locator('#ovQuest')).toBeVisible();
  await expect(page.locator('#questPaneStanding')).toBeVisible();
  await expect(page.locator('#questTitle')).toHaveText('STANDING');
});

test('arriving opens the bar with who holds the place: keepers, both sides, glimmer, unclaimed (B, C)', async ({ page }) => {
  await boot(page);   // no pick yet: the bar still shows (B)
  let b = await arrive(page, 'route1', 5, 5);
  expect([b.open, b.word, b.hold, b.live]).toEqual([true, 'KEEPERS', 'keepers', 'ROUTE 1: KEEPERS']);
  await expect(page.locator('#thHold')).toBeVisible();
  const word = await page.locator('#thHold').boundingBox(), chip = await page.locator('#thChip').boundingBox();
  expect(word.x).toBeGreaterThanOrEqual(chip.x);                              // inside the chip: no extra box
  expect(word.x + word.width).toBeLessThanOrEqual(chip.x + chip.width);
  expect(await page.locator('#thHold').evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  b = await arrive(page, 'fernbrook', 10, 12);
  expect([b.word, b.hold]).toEqual(['BOTH SIDES', 'split']);
  await shot(page, 'side-badge-bar-fernbrook');
  b = await arrive(page, 'route2_glen', 5, 5);
  expect([b.word, b.hold]).toEqual(['GLIMMERWELL', 'glimmer']);
  expect(await page.locator('#thHold').evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);   // the longest word fits
  b = await arrive(page, 'proto', 5, 5);
  expect([b.word, b.hold]).toEqual(['UNCLAIMED', 'wild']);
  // The bar folds back to the stripe on its own.
  await page.waitForFunction(() => !window.PixelPets.sideBadge().open, null, { timeout: 5000 });
  expect((await badge(page)).hold).toBe('wild');
});

test('Cobblecrest flips to Glimmerwell once the quarry is bought', async ({ page }) => {
  await boot(page);
  let b = await arrive(page, 'cobblecrest', 10, 10);
  expect([b.word, b.hold]).toEqual(['KEEPERS', 'keepers']);
  await page.evaluate(() => PixelPets.setFlag('story.quarry_bought', true));
  await arrive(page, 'route1', 5, 5);
  b = await arrive(page, 'cobblecrest', 10, 10);
  expect([b.word, b.hold]).toEqual(['GLIMMERWELL', 'glimmer']);
});

test('rooms keep the town stripe and never open the bar; stepping back out is not a new arrival (D)', async ({ page }) => {
  await boot(page);
  let b = await arrive(page, 'hm_lantern_in', 4, 4);
  expect(b.open).toBe(false);
  expect(b.hold).toBe('keepers');
  b = await arrive(page, 'hearthmoor', 8, 8);
  expect(b.open).toBe(false);                 // same town as the save loaded in
  b = await arrive(page, 'route1', 5, 5);
  expect(b.open).toBe(true);
  await page.evaluate(() => PixelPets.sideBadge());
  b = await arrive(page, 'hearthmoor', 8, 8);
  expect([b.open, b.word]).toEqual([true, 'KEEPERS']);
});

test('the save gains nothing from the chip or its word', async ({ page }) => {
  await boot(page);
  await arrive(page, 'hm_lantern_in', 4, 4);   // an arrival that saves but shows no word: the baseline shape
  const keys = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('pixelpets.save.v2'))).sort());
  await arrive(page, 'route1', 5, 5);
  await expect(page.locator('#thHold')).toBeVisible();
  expect(await page.locator('#thHold').evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  expect(after.v).toBe(2);
  expect(Object.keys(after).sort()).toEqual(keys);
  expect(JSON.stringify(after)).not.toMatch(/sideBar|sideBadge|thHold/);
});

test('the map shows who holds every place walked into, before the pick too; an unvisited place stays ??? (D1164)', async ({ page }) => {
  await boot(page);
  await arrive(page, 'route1', 5, 5);
  await arrive(page, 'hearthmoor', 8, 8);
  await page.locator('#mapBtn').click();
  await expect(page.locator('#ovMap')).toBeVisible();
  await page.locator('#mapLevelRegion').click();
  await expect(page.locator('#mapHold')).toBeVisible();
  await expect(page.locator('#mapHold')).toHaveText('Home. The Keepers hold this town.');
  await expect(page.locator('#keySides')).toBeVisible();
  await page.waitForFunction(() => window.PixelPets.mapClaimsDrawn() === 2);   // Hearthmoor and Route 1, nothing unvisited
  const pick = async (id) => {
    const [lx, ly] = await page.evaluate((n) => PixelPets.mapNodeCenter(n), id);
    const box = await page.locator('#regionCanvas').boundingBox();
    await page.mouse.click(box.x + (lx / 320) * box.width, box.y + (ly / 192) * box.height);
    await page.waitForTimeout(60);
  };
  await pick('route1');
  await expect(page.locator('#mapPlaceName')).toHaveText('ROUTE 1');
  await expect(page.locator('#mapHold')).toHaveText('The Keeper watch holds this road. Walk beside, not ahead.');   // WALK_BESIDE D1934, D1971
  await shot(page, 'side-badge-map-visited');
  await pick('fernbrook');
  await expect(page.locator('#mapPlaceName')).toHaveText('???');
  await expect(page.locator('#mapHold')).toBeHidden();
  await expect(page.locator('#mapPledge')).toBeHidden();   // the pledge line still waits for the pick
});
