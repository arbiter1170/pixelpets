// Phone apps part 2 (Vincent, Oct 28, 2026; D864-D869): Watch Desk / gigs, Census leak, signal by place, Ribbit presets,
// the step log and the BOTNET shelf. Save stays v2; stepLog and chirps are additive and cleaned by normalizeV2.
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const EXTRA = [[{ id: 't_lamp', label: 'Lamp count', when: ['story.starter_received'], done: ['story.t_lamp'], text: 'Test chain three.', place: 'Hearthmoor', target: { map: 'hearthmoor', x: 5, y: 5 } }]];

function readySave(extra, patch) {
  const s = starterSave();
  s.settings.tips = false;
  Object.assign(s.flags, { 'story.tutorial_done': true, 'story.phone_got': true, 'story.reached_route1': true, 'story.rival1_done': true }, extra || {});
  s.world = { map: 'hearthmoor', x: 8, y: 9, facing: 'down', respawn: 'hearthmoor' };
  if (patch) patch(s);
  return s;
}
async function boot(page, extra, patch) {
  await installSave(page.context(), readySave(extra, patch), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
}
async function openApp(page, app) {
  if (await page.locator('#ovPhone').isHidden()) await page.locator('#phoneBtn').click();
  else await page.locator('#phoneBack').click();
  await page.locator(`.phone-app[data-app="${app}"]`).click();
  await expect(page.locator('#phonePane')).toBeVisible();
}
async function hack(page) {
  await page.evaluate(() => { PixelPets.giveItem('cracked_phone', 1); PixelPets.setSide('glimmer'); PixelPets.showTab('walk'); });
}
const bars = page => page.locator('#phoneSignal').getAttribute('data-bars');

test('Watch Desk lists real open errands and TRACK follows one; the cracked handset calls them gigs', async ({ page }) => {
  await boot(page);
  const real = await page.evaluate(() => PixelPets.sideActive.map(a => a.chain));
  await openApp(page, 'jobs');
  expect(await page.locator('.phone-job[data-chain]').evaluateAll(els => els.map(e => e.dataset.chain))).toEqual(real);   // every open side chain, in order
  await page.evaluate(x => PixelPets.debugSideChains(x), EXTRA);
  await openApp(page, 'jobs');
  const row = page.locator('.phone-job[data-chain="t_lamp"]');
  await expect(row.locator('.phone-job-title')).toHaveText('Patrol: Lamp count');
  await expect(row.locator('.phone-job-text')).toHaveText('Test chain three. (Hearthmoor)');
  await page.evaluate(() => PixelPets.trackSide('none'));
  await openApp(page, 'jobs');
  const box = await row.locator('.phone-job-track').boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(44);
  await row.locator('.phone-job-track').click();
  await expect(row.locator('.phone-job-track')).toHaveText('TRACKING');
  expect(await page.evaluate(() => PixelPets.state.ui.sideTracked)).toBe('t_lamp');
  await page.locator('#phoneClose').click();
  await hack(page);
  await openApp(page, 'jobs');
  await expect(page.locator('.phone-job[data-chain="t_lamp"] .phone-job-title')).toHaveText('Gig: Lamp count');
  await page.evaluate(() => PixelPets.debugSideChains(null));
});

test('Census leak: the cracked handset reads a count while the lamps burn, then dead air; the Keeper1 never shows it', async ({ page }) => {
  await boot(page, { 'story.met_census': true });
  await openApp(page, 'jobs');
  await expect(page.locator('#phoneBody')).not.toContainText('Census feed');
  await page.locator('#phoneClose').click();
  await hack(page);
  await openApp(page, 'jobs');
  await expect(page.locator('#phoneBody')).toContainText(/Census feed {2}Units logged on Route 2 today: \d+\./);
  await page.evaluate(() => PixelPets.setFlag('story.glen_cleared', true));
  await openApp(page, 'jobs');
  await expect(page.locator('#phoneBody')).toContainText('Census feed  No signal since the glen was cleared.');
});

test('BOTNET shelf: three care goods at their usual prices in the shop sheet, cracked handset only', async ({ page }) => {
  await boot(page);
  await openApp(page, 'jobs');
  await expect(page.locator('.phone-shelf')).toHaveCount(0);
  await page.locator('#phoneClose').click();
  await hack(page);
  await openApp(page, 'jobs');
  await page.locator('.phone-shelf').click();
  await expect(page.locator('#ovPhone')).toBeHidden();
  await expect(page.locator('#ovShop')).toBeVisible();
  await expect(page.locator('#shopTitle')).toHaveText('BOTNET Shelf');
  const rows = await page.locator('#shopList .shop-row').evaluateAll(els => els.map(e => e.dataset.id));
  expect(rows).toHaveLength(3);
  for (const id of rows) expect(['energy_sip', 'joy_crumb', 'heal_snack', 'soft_berry', 'kin_ribbon', 'bracer_band']).toContain(id);
});

test('Signal by place: towns 4, routes 2, deep places 1; the cracked handset rides the lamps; one bar thins Ribbit @w1', async ({ page }) => {
  await boot(page);
  await page.locator('#phoneBtn').click();
  expect(await bars(page)).toBe('4');
  await page.locator('#phoneClose').click();
  await page.evaluate(() => PixelPets.goto('route1'));
  await page.locator('#phoneBtn').click();
  expect(await bars(page)).toBe('2');
  await page.locator('#phoneClose').click();
  await page.evaluate(() => PixelPets.goto('route2_glen'));
  await openApp(page, 'ribbit');
  expect(await bars(page)).toBe('1');
  await expect(page.locator('.ribbit-foot')).toHaveText('Ribbit rides the Keeper wires. One bar: the feed is thin here.');
  const thin = await page.locator('.ribbit-post').count();
  await page.locator('#phoneClose').click();
  await hack(page);
  await page.evaluate(() => PixelPets.goto('route2_glen'));
  await openApp(page, 'ribbit');
  expect(await bars(page)).toBe('4');
  expect(await page.locator('.ribbit-post').count()).toBeGreaterThan(thin);
});

test('Ribbit presets: one set chirp per finished step, it stays posted after a reload, and no text box exists', async ({ page }) => {
  await boot(page);
  await openApp(page, 'ribbit');
  await expect(page.locator('.ribbit-compose input, .ribbit-compose textarea')).toHaveCount(0);
  const presets = page.locator('.ribbit-preset');
  await expect(presets).toHaveCount(3);
  const text = await presets.nth(1).textContent();
  await presets.nth(1).click();
  await expect(page.locator('.ribbit-preset')).toHaveCount(0);
  await expect(page.locator('.ribbit-mine .ribbit-text').first()).toHaveText(text);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  expect(saved.v).toBe(2);
  expect(Object.values(saved.chirps)).toEqual([1]);
  // installSave re-runs on every load: hand it this save (with the chirp) so the reload reads what the game wrote.
  await installSave(page.context(), Object.assign(saved, { flags: Object.assign(saved.flags, { 'daily.hello': '', 'daily.warm_bowl': '' }) }), { quietDay: true });
  await page.reload();
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await openApp(page, 'ribbit');
  await expect(page.locator('.ribbit-mine')).toHaveCount(1);
  await expect(page.locator('.ribbit-preset')).toHaveCount(0);
});

test('Step log: GLOW counts today\'s steps with a kind line, keeps 7 days, and junk in the save is dropped', async ({ page }) => {
  await boot(page, null, s => {
    s.stepLog = { '2026-01-01': 10, '2026-01-02': 20, '2026-01-03': 30, '2026-01-04': 40, '2026-01-05': 50, '2026-01-06': 60, '2026-01-07': 70, '2026-01-08': 80, bad: 5, '2026-01-09': -3 };
    s.chirps = { wake: 9, lodge: 'x', rival1: 2 };
  });
  const st = await page.evaluate(() => ({ log: PixelPets.state.stepLog, chirps: PixelPets.state.chirps }));
  expect(Object.keys(st.log)).toHaveLength(7);
  expect(st.log['2026-01-01']).toBeUndefined();
  expect(st.log.bad).toBeUndefined();
  expect(st.chirps).toEqual({ rival1: 2 });
  await page.evaluate(() => PixelPets.goto('route1'));
  for (const d of ['down', 'down', 'up', 'up', 'down', 'up']) { await page.evaluate(x => PixelPets.walkStep(x), d); await page.waitForTimeout(260); }
  await openApp(page, 'glow');
  const today = await page.locator('.step-today').textContent();
  const n = Number(/Today: (\d+)/.exec(today)[1]);
  expect(n).toBeGreaterThan(0);
  await expect(page.locator('.step-note')).toBeVisible();
  await expect(page.locator('.step-note')).toHaveText(n < 50 ? 'A few steps today.' : 'A little walk today.');
  const log = await page.evaluate(() => PixelPets.state.stepLog);
  expect(Object.keys(log)).toHaveLength(7);
  expect(Object.values(log)).toContain(n);
});

test('GLOW keeps the empty-day line at 0 steps and a shorter line from 1 to 49', async ({ page }) => {
  await boot(page);
  const few = 'A few steps today.';
  const none = 'No walk yet today. Any time is fine.';
  const little = 'A little walk today.';
  const want = { 0: none, 1: few, 8: few, 49: few, 50: little };
  for (const n of [0, 1, 8, 49, 50]) {
    await page.evaluate(steps => {
      const S = PixelPets.state;
      if (!S.care || typeof S.care !== 'object') S.care = {};
      S.care.d = PixelPets.wildAcorns.day;
      S.care.steps = steps;
    }, n);
    await openApp(page, 'glow');
    await expect(page.locator('.step-today')).toBeVisible();
    await expect(page.locator('.step-today')).toHaveText(n === 1 ? 'Today: 1 step' : 'Today: ' + n + ' steps');
    await expect(page.locator('.step-note')).toBeVisible();
    await expect(page.locator('.step-note')).toHaveText(want[n]);
  }
});
