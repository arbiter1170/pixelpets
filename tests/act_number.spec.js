/* B-11, the act number in normal play (D915, re-issued for seven acts as D977; D1426 needs it for the Governor's Act 2 door).
   The act is derived from flags the game already writes (PPStanding.actOf: 1 plus one for each of story.ep1_end,
   story.seal5, story.seal7, story.skyloom_done, story.climb_open, story.summit_open; Acts 3 and 4 also start at 5 and 7
   Seals held). Nothing writes story.act. cond() reads story.act through it; a stored story.act (debug places, old seeded
   saves) counts only under ?debug=1. Runs at 320, 375 and 390 with reduced motion; zero console errors; the save is never
   given an act. A test map (overlay) holds one NPC whose tap line is keyed on story.act, so the read is checked through
   the real talk path with no debug hooks. */
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, withOverlay, shot } = require('./helpers');

trackErrors(test, expect);

const ACT_FLAGS = ['story.ep1_end', 'story.seal5', 'story.seal7', 'story.skyloom_done', 'story.climb_open', 'story.summit_open'];
const EP1 = { 'story.seal1': true, 'story.seal2': true, 'story.seal3': true };
const EP1_SEALS = { seal_fernbrook: true, seal_cobblecrest: true, seal_brinewick: true };
const LINE = { 1: 'ACT TEST: one.', 2: 'ACT TEST: two.', 5: 'ACT TEST: five.' };

function grid(w, h) {
  const rows = [];
  for (let y = 0; y < h; y++) {
    let row = '';
    for (let x = 0; x < w; x++) row += (x === 0 || y === 0 || x === w - 1 || y === h - 1) ? 'T' : 'g';
    rows.push(row);
  }
  return rows;
}
const overlay = {
  maps: {
    zz_act: {
      name: 'Act Clearing', backdrop: 'meadow', w: 12, h: 12,
      start: { x: 5, y: 5, facing: 'down' }, safe: { x: 5, y: 5 }, grid: grid(12, 12),
      // Pip is in data/reputation.json, so the strict cast check stays quiet
      objs: [{ kind: 'npc', id: 'zz_act_pip', name: 'Pip', x: 5, y: 6, facing: 'up',
        lines: { 'story.act>=5': LINE[5], 'story.act>=2': LINE[2], 'else': LINE[1] } }],
    },
  },
  scenes: {
    // a live read: the scene's own pending setFlag counts before it commits
    zz_act_live: [['setFlag', 'story.ep1_end', true], ['if', 'story.act>=2', [['say', '', 'LIVE two']], [['say', '', 'LIVE one']]]],
  },
};

function save(flags, seals) {
  const s = starterSave();
  s.settings.follower = false;
  s.settings.textSpeed = 'fast';
  s.settings.tips = false;
  Object.assign(s.flags, flags || {});
  s.seals = Object.assign({}, seals || {});
  s.world = { map: 'zz_act', x: 5, y: 5, facing: 'down', respawn: 'hearthmoor' };
  return s;
}
async function boot(page, s, q = '') {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await withOverlay(page, overlay);
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, q);
  await page.waitForFunction(() => window.PixelPets && PixelPets.act != null);
  await page.evaluate(() => PixelPets.showTab('walk'));
}
// Talk to Pip with the A key (no debug hook) and read the line the box shows.
async function pipSays(page) {
  await page.waitForTimeout(150);
  await page.keyboard.press('Space');
  await expect(page.locator('#sbText')).toBeVisible();
  await expect.poll(() => page.locator('#sbText').textContent()).toMatch(/^ACT TEST: \w+\.$/);   // the whole line has typed
  const t = await page.locator('#sbText').textContent();
  // the first press may only finish the typing; press until the box closes
  for (let i = 0; i < 10 && await page.locator('#sbText').isVisible(); i++) {
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);
  }
  await expect(page.locator('#sbText')).toBeHidden();
  return t;
}
const stored = page => page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));

test('a fresh save is Act 1; Pip reads the Act 1 line; the save gains no act', async ({ page }) => {
  await boot(page, save());
  expect(await page.evaluate(() => PixelPets.debug)).toBe(false);
  expect(await page.evaluate(() => PixelPets.act)).toBe(1);
  expect(await pipSays(page)).toBe(LINE[1]);
  await shot(page, 'act_number_fresh');
  const s = await stored(page);
  expect(s.v).toBe(2);
  expect('story.act' in s.flags).toBe(false);
});

test('Seals 1-3 alone stay Act 1 until the Episode 1 card plays', async ({ page }) => {
  await boot(page, save(EP1, EP1_SEALS));
  expect(await page.evaluate(() => PixelPets.act)).toBe(1);
  expect(await pipSays(page)).toBe(LINE[1]);
});

test('Seals 1-3 and the Episode 1 card (story.ep1_end) read Act 2 with no act seeded; the save gains no act', async ({ page }) => {
  await boot(page, save(Object.assign({}, EP1, { 'story.ep1_end': true }), EP1_SEALS));
  expect(await page.evaluate(() => PixelPets.debug)).toBe(false);
  expect(await page.evaluate(() => PixelPets.act)).toBe(2);
  expect(await pipSays(page)).toBe(LINE[2]);
  await shot(page, 'act_number_act2');
  const s = await stored(page);
  expect(s.v).toBe(2);
  expect('story.act' in s.flags).toBe(false);
});

test('a stored story.act=5 without ?debug=1 is ignored and kept: the derived act wins, the switch stays locked', async ({ page }) => {
  // an old save that holds story.act (a debug place once wrote it), past Rook's crates, Episode 1 done
  const flags = Object.assign({}, EP1, { 'story.ep1_end': true, 'story.act': 5, 'story.side_pick_done': true, 'story.side': 'keepers', 'story.rc_climax': true });
  await boot(page, save(flags, EP1_SEALS));
  expect(await page.evaluate(() => PixelPets.debug)).toBe(false);
  expect(await page.evaluate(() => PixelPets.act)).toBe(2);
  expect(await pipSays(page)).toBe(LINE[2]);
  expect(await page.evaluate(() => PixelPets.standing.canSwitch)).toBe(false);   // D161: switching opens in Act 5
  const s = await stored(page);
  expect(s.v).toBe(2);
  expect(s.flags['story.act']).toBe(5);   // the old save loads as it was; nothing renames or removes the key
});

test('with ?debug=1 a stored act still counts (debug places), and the derived act is read when none is stored', async ({ page }) => {
  await boot(page, save({ 'story.act': 5, 'story.side_pick_done': true, 'story.rc_climax': true }), '?debug=1');
  expect(await page.evaluate(() => PixelPets.debug)).toBe(true);
  expect(await page.evaluate(() => PixelPets.act)).toBe(5);
  expect(await page.evaluate(() => PixelPets.condRead('story.act>=5').cond)).toBe(true);
  expect(await pipSays(page)).toBe(LINE[5]);
  expect(await page.evaluate(() => PixelPets.standing.canSwitch)).toBe(true);
  // clear the stored value: back to the derived act; then the act flags, one at a time
  await page.evaluate(() => PixelPets.setFlag('story.act', null));
  expect(await page.evaluate(() => PixelPets.act)).toBe(1);
  expect(await page.evaluate(() => PixelPets.standing.canSwitch)).toBe(false);
  for (let i = 0; i < ACT_FLAGS.length; i++) {
    await page.evaluate((k) => PixelPets.setFlag(k, true), ACT_FLAGS[i]);
    expect(await page.evaluate(() => PixelPets.act), ACT_FLAGS[i]).toBe(i + 2);
  }
  expect(await page.evaluate(() => PixelPets.condRead('story.act>=7').cond)).toBe(true);
  expect(await page.evaluate(() => 'story.act' in PixelPets.state.flags)).toBe(false);
});

test('the debug places still work: the main-chain end is Act 2, the city preview Act 5 place reads Act 5', async ({ page }) => {
  await boot(page, save(), '?debug=1&hccity=2');
  const end = await page.evaluate(() => { const r = PixelPets.checkpoint('end'); return { ok: r.ok, act: PixelPets.act, stored: 'story.act' in PixelPets.state.flags, ep1: !!PixelPets.state.flags['story.ep1_end'] }; });
  expect(end).toEqual({ ok: true, act: 2, stored: false, ep1: true });
  await expect.poll(() => page.evaluate(() => !PixelPets.fading)).toBe(true);
  const pres = await page.evaluate(() => { const r = PixelPets.checkpoint('hc2_pres'); return { ok: r.ok, act: PixelPets.act }; });
  expect(pres).toEqual({ ok: true, act: 5 });
});

test('a scene reads its own pending act flag (live read)', async ({ page }) => {
  await boot(page, save(EP1, EP1_SEALS), '?debug=1');
  expect(await page.evaluate(() => PixelPets.act)).toBe(1);
  expect(await page.evaluate(() => PixelPets.runScene('zz_act_live'))).toBe(true);
  await expect(page.locator('#sbText')).toHaveText('LIVE two');
  await page.evaluate(() => PixelPets.endScene());
  expect(await page.evaluate(() => PixelPets.act)).toBe(2);
});

test('actOf: Seals held start Acts 3 and 4 (5 and 7, tags never count); a stored story.act never counts', async ({ page }) => {
  await boot(page, save());
  const r = await page.evaluate(() => {
    const A = PPStanding.actOf, e = { 'story.ep1_end': true };
    return {
      list: PPStanding.ACT_FLAGS.slice(), none: A(), fresh: A({}), ep1: A(e), four: A(e, 4), five: A(e, 5), six: A(e, 6), seven: A(e, 7),
      eight: A(e, 8), flag5: A(Object.assign({ 'story.seal5': true }, e)), storedOnly: A({ 'story.act': 5 }),
      all: A({ 'story.ep1_end': 1, 'story.seal5': 1, 'story.seal7': 1, 'story.skyloom_done': 1, 'story.climb_open': 1, 'story.summit_open': 1 }, 8),
      // D1329: Bright Tier tags do not count as Seals (three tags + no wins = 1 Seal held through the alias)
      tags: A(e, PPStanding.sealsHeldIn({ seal_glim_1: true, seal_glim_2: true, seal_glim_3: true }, {}, true)),
    };
  });
  expect(r.list).toEqual(ACT_FLAGS);
  expect([r.none, r.fresh, r.ep1, r.four, r.five, r.six, r.seven, r.eight, r.flag5, r.storedOnly, r.all]).toEqual([1, 1, 2, 2, 3, 3, 4, 4, 3, 1, 7]);
  expect(r.tags).toBe(2);
});

test('nothing writes story.act: no data file or script sets it (CHIP_SECRECY §7 checker)', async () => {
  const root = path.join(__dirname, '..');
  const files = fs.readdirSync(path.join(root, 'data')).filter(f => f.endsWith('.json')).map(f => path.join('data', f))
    .concat(fs.readdirSync(root).filter(f => f.endsWith('.js')), ['tools/build_hc_city.py']);
  const bad = [];
  const re = /setFlag["']?\s*[,(:]\s*["']story\.act["']|flags\[["']story\.act["']\]\s*=[^=]/;
  for (const f of files) {
    const txt = fs.readFileSync(path.join(root, f), 'utf8').replace(/\s+/g, ' ');
    if (re.test(txt)) bad.push(f);
  }
  expect(bad).toEqual([]);
});
