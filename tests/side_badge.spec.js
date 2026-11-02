/* SIDE_BADGE (Vincent, Nov 2, 2026): the Standing icon is always on the walk screen beside the place chip. Its stripe is who
   holds the place (REGION_MAP hold); arriving at a new town or route opens a bar ("FERNBROOK" / "BOTH SIDES"). Before the
   side pick the icon is a neutral emblem and opens a card with no points (decision A); the bar shows from the start (B);
   no controller reads UNCLAIMED (C); rooms never open the bar but keep the town's stripe (D). Nothing is saved. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, shot, boxesOverlap } = require('./helpers');

trackErrors(test, expect);

const PICK_K = { 'story.side_pick_done': true };
const PICK_G = { 'story.side_pick_done': true, 'story.side': 'glimmer' };

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
  await page.emulateMedia({ reducedMotion: o.motion ? 'no-preference' : 'reduce' });
  await installSave(page.context(), save(flags, o.extra, o.controls), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await expect(page.locator('#sideBtn')).toBeVisible();
}

const badge = (page) => page.evaluate(() => PixelPets.sideBadge());
async function arrive(page, map, x, y) {
  expect(await page.evaluate(([m, xx, yy]) => PixelPets.goto(m, xx, yy, 'down'), [map, x, y])).toBeTruthy();
  // A toast on arrival holds the bar back until it clears (flushSideBar); wait for that.
  await page.waitForFunction(() => !window.PixelPets.sideBadge().pending, null, { timeout: 6000 });
  return badge(page);
}

for (const controls of ['modern', 'arcade']) {
  test(`the icon is always there, 44 px, beside the place chip (${controls})`, async ({ page }) => {
    await boot(page, {}, { controls });
    const b = await badge(page);
    expect(b.side).toBe('none');
    expect(b.hold).toBe('keepers');            // Hearthmoor
    expect(b.open).toBe(false);                // loading a save is not an arrival
    expect(b.label).toBe("Standing. You haven't picked a side yet. Hearthmoor: Home. The Keepers hold this town.");
    const btn = await page.locator('#sideBtn').boundingBox();
    const chip = await page.locator('#thChip').boundingBox();
    expect(btn.width).toBeGreaterThanOrEqual(44);
    expect(btn.height).toBeGreaterThanOrEqual(44);
    expect(btn.x).toBeGreaterThanOrEqual(chip.x + chip.width - 1);   // to the right of the chip
    expect(btn.x + btn.width).toBeLessThanOrEqual(page.viewportSize().width);
    expect(boxesOverlap(btn, chip)).toBe(false);
    await shot(page, 'side-badge-' + controls);
    // Still there after the pick, with the pledged side's face.
    await page.evaluate(() => PixelPets.setFlag('story.side_pick_done', true));
    await page.evaluate(() => PixelPets.setSide('glimmer'));
    await arrive(page, 'route1', 5, 5);
    expect((await badge(page)).side).toBe('glimmer');
    await expect(page.locator('#sideBtn')).toBeVisible();
  });
}

test('before the pick the icon opens a card with both pitches and no points (A)', async ({ page }) => {
  await boot(page);
  await page.locator('#sideBtn').click();
  await expect(page.locator('#ovSide')).toBeVisible();
  await expect(page.locator('#sideTitle')).toHaveText("You haven't picked a side yet");
  const rows = await page.locator('#sideRows .side-row').evaluateAll((els) => els.map((e) => ({ side: e.dataset.side, text: e.textContent })));
  expect(rows.map((r) => r.side)).toEqual(['keepers', 'glimmer']);
  expect(rows[0].text).toContain('The Keepers ask you to walk beside wild Walklings, not ahead of them.');
  expect(rows[1].text).toContain('Glimmerwell asks for output: log the Census, pack the crates, hit quarterly targets, smile on stage.');
  for (const r of rows) expect(r.text).not.toMatch(/\d/);   // no points before the pick
  await expect(page.locator('#questPaneStanding')).toBeHidden();
  await shot(page, 'side-badge-unpledged-card');
  const close = await page.locator('#sideClose').boundingBox();
  expect(close.height).toBeGreaterThanOrEqual(44);
  await page.locator('#sideClose').click();
  await expect(page.locator('#ovSide')).toBeHidden();
});

test('after the pick the icon opens STANDING', async ({ page }) => {
  await boot(page, PICK_K, { extra: { standing: { keepers: 12, glimmer: 0 } } });
  expect((await badge(page)).side).toBe('keepers');
  await page.locator('#sideBtn').click();
  await expect(page.locator('#ovQuest')).toBeVisible();
  await expect(page.locator('#questPaneStanding')).toBeVisible();
  await expect(page.locator('#questTitle')).toHaveText('STANDING');
});

test('arriving opens the bar with who holds the place: keepers, both sides, glimmer, unclaimed (B, C)', async ({ page }) => {
  await boot(page);   // no pick yet: the bar still shows (B)
  let b = await arrive(page, 'route1', 5, 5);
  expect([b.open, b.place, b.word, b.hold]).toEqual([true, 'ROUTE 1', 'KEEPERS', 'keepers']);
  await expect(page.locator('#sideBar')).toBeVisible();
  const bar = await page.locator('#sideBar').boundingBox();
  expect(bar.x + bar.width).toBeLessThanOrEqual(page.viewportSize().width);
  b = await arrive(page, 'fernbrook', 10, 12);
  expect([b.place, b.word, b.hold]).toEqual(['FERNBROOK', 'BOTH SIDES', 'split']);
  await shot(page, 'side-badge-bar-fernbrook');
  b = await arrive(page, 'route2_glen', 5, 5);
  expect([b.word, b.hold]).toEqual(['GLIMMERWELL', 'glimmer']);
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

test('reduced motion: the bar has no tween; the save gains nothing', async ({ page }) => {
  await boot(page);
  await arrive(page, 'hm_lantern_in', 4, 4);   // an arrival that saves but opens no bar: the baseline shape
  const keys = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('pixelpets.save.v2'))).sort());
  await arrive(page, 'route1', 5, 5);
  await expect(page.locator('#sideBar')).toBeVisible();
  expect(await page.locator('#sideBar').evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  expect(after.v).toBe(2);
  expect(Object.keys(after).sort()).toEqual(keys);
  expect(JSON.stringify(after)).not.toMatch(/sideBar|sideBadge/);
});

test('with motion allowed the bar slides open', async ({ page }) => {
  await boot(page, {}, { motion: true });
  await arrive(page, 'route1', 5, 5);
  expect(await page.locator('#sideBar').evaluate((el) => getComputedStyle(el).animationName)).toBe('sbOpen');
});

test('a toast beside the chip starts after the icon, not on top of it', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.debugToast('Saved.'));
  await expect(page.locator('#toast')).toBeVisible();
  const t = await page.locator('#toast').boundingBox(), b = await page.locator('#sideBtn').boundingBox(), c = await page.locator('#thChip').boundingBox();
  // D782's wide toast covers the whole chip slot for its life (chip and icon alike); a toast beside the chip must clear the icon.
  if (t && t.width > 0 && !boxesOverlap(t, c)) expect(boxesOverlap(t, b)).toBe(false);
});

test('the map overlay still hides the hold line before the pick (D109 unchanged)', async ({ page }) => {
  await boot(page);
  await page.locator('#mapBtn').click();
  await expect(page.locator('#ovMap')).toBeVisible();
  await expect(page.locator('#mapHold')).toBeHidden();
});
