/* BED_TUCK (Vincent, Nov 3, 2026): every Lantern House rest, the first one included, walks the partner to a bed. The holder
   walks over, the partner lies in the bed with its eyes shut and a "z", wakes with a heart and hops back out, healed. The
   bed path (talk to a bed, pick Rest) and a scene's `rest` step (Rook's first-loss walk, #249) both do it; a rest outside a
   Lantern House does not. Reduced motion keeps the beats (still "z", no hop). Save stays v2; zero console errors. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, withOverlay } = require('./helpers');

trackErrors(test, expect);

function hurtSave(world) {
  const s = starterSave();
  s.money = 20;
  s.flags['story.early_done'] = true;
  s.party[0].hpNow = 3;
  s.world = Object.assign({ map: 'hm_lantern_in', x: 5, y: 6, facing: 'up', respawn: 'hearthmoor' }, world || {});
  return s;
}
async function boot(page, s) {
  await withOverlay(page, { scenes: { zz_rest: [['say', '', 'Time for a nap.'], ['rest']] } });
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && typeof PixelPets.bedRest === 'function');
  await page.evaluate(() => PixelPets.showTab('walk'));
}
// Plays the open scene, answering choices in order, and samples the bed state while it runs.
async function play(page, choices) {
  const left = choices.slice(), seen = [];
  for (let i = 0; i < 400; i++) {
    const st = await page.evaluate(() => {
      const s = PixelPets.scene, b = PixelPets.bedRest(), w = PixelPets.state.world;
      return { s: s && { mode: s.mode, full: s.full, waiting: s.waiting }, b, x: w.x, y: w.y, facing: w.facing, hp: PixelPets.state.party[0].hpNow, ready: PixelPets.optionsReady };
    });
    if (st.b.on) seen.push(st);
    if (!st.s) return seen;
    if (st.s.mode === 'choice') {
      if (!st.s.full || !st.ready) { await page.waitForTimeout(30); continue; }
      // After a pick the mode stays 'choice' while the walk to the bed plays; only a box with buttons is a new choice.
      const btns = await page.locator('#sbChoices button:visible').allTextContents();
      if (!btns.length) { await page.waitForTimeout(30); continue; }
      if (!left.length) throw new Error('unexpected choice: ' + JSON.stringify(btns));
      await page.locator('#sbChoices button', { hasText: left.shift() }).first().click();
    } else if (st.s.mode === 'say' && st.s.full && st.s.waiting) await page.keyboard.press('Space');
    await page.waitForTimeout(30);
  }
  throw new Error('scene did not end');
}
const beside = (st) => Math.abs(st.x - st.b.x) + Math.abs(st.y - st.b.y) === 1;

test('talking to a bed and resting walks the partner to the bed: it sleeps, wakes, and the party is healed', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page, hurtSave());
  expect(await page.evaluate(() => PixelPets.talkTo('lantern_bed_c'))).toBe(true);
  const seen = await play(page, [/^Rest/]);
  const sleep = seen.filter(s => s.b.phase === 'sleep'), wake = seen.filter(s => s.b.phase === 'wake');
  expect(sleep.length, 'the partner napped in a bed').toBeGreaterThan(0);
  expect(wake.length, 'then woke in it').toBeGreaterThan(0);
  expect(beside(sleep[0]), JSON.stringify(sleep[0])).toBe(true);           // the holder stands beside that bed
  expect(sleep[0].b.map).toBe('hm_lantern_in');
  expect(sleep.every(s => s.hp != null), 'not healed until it wakes').toBe(true);   // hpNow clears on the full heal (it regens a little meanwhile)
  const after = await page.evaluate(() => ({ b: PixelPets.bedRest(), hp: PixelPets.state.party[0].hpNow, money: PixelPets.state.money, v: JSON.parse(localStorage.getItem('pixelpets.save.v2')).v }));
  expect(after.b.on).toBe(false);                                         // back out of the bed
  expect(after.b.beds).toBe(1);
  expect(after.hp).toBeUndefined();                                       // healed
  expect(after.money).toBe(15);
  expect(after.v).toBe(2);
});

test('a scene rest at a Lantern House (as on Rook\'s first-loss walk) tucks the partner in too; a home rest does not', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page, hurtSave({ map: 'fb_lantern_in', x: 5, y: 13 }));
  expect(await page.evaluate(() => PixelPets.runScene('zz_rest'))).toBe(true);
  const seen = await play(page, []);
  expect(seen.some(s => s.b.phase === 'sleep' && s.b.map === 'fb_lantern_in' && beside(s))).toBe(true);
  expect(await page.evaluate(() => PixelPets.bedRest().beds)).toBe(1);
  expect(await page.evaluate(() => PixelPets.state.party[0].hpNow)).toBeUndefined();
  // Outside a Lantern House the rest step is unchanged.
  await page.evaluate(() => { PixelPets.state.party[0].hpNow = 3; PixelPets.goto('hm_home_in', 3, 4, 'down'); });
  expect(await page.evaluate(() => PixelPets.runScene('zz_rest'))).toBe(true);
  const home = await play(page, []);
  expect(home.length).toBe(0);
  expect(await page.evaluate(() => PixelPets.bedRest().beds)).toBe(1);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('the bed rest keeps its beats with reduced motion', async ({ page }) => {
    test.setTimeout(60000);
    await boot(page, hurtSave({ map: 'cc_lantern_in', x: 5, y: 6 }));
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
    expect(await page.evaluate(() => PixelPets.talkTo('cc_bed_a'))).toBe(true);
    const seen = await play(page, [/^Rest/]);
    expect(seen.some(s => s.b.phase === 'sleep')).toBe(true);
    expect(await page.evaluate(() => PixelPets.state.party[0].hpNow)).toBeUndefined();
  });
});
