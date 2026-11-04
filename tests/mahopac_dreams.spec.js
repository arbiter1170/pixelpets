/* MAHOPAC_DREAMS v0.1 (design repo, private; D1940-D1951): the two built-drift fixes (G1, G2), Mom's walk north (§4), the
   lens moment (§3), the loyalist's echo at the lens (§5.2) and the Mahopac epilogue card (§4.5).
   data/mahopac.json, data/detail_zzzz_mahopac_dreams.json, game.js, standing.js, quests.js, sfx.js.
   Every new line is PLACEHOLDER. Save stays pixelpets.save.v2, v 2, four additive story.* keys; nothing written at load.
   Gates nothing in the game sets yet (story.seal4/5, story.ilse_ledger, story.solvane_met, the endings) are seeded here.
   Modern controls; 320, 375, 390 (@w1 rows at 320 only); reduced motion; zero console errors. §11 T1-T12. */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { starterSave, installSave, trackErrors, gotoGame, shot } = require('./helpers');

trackErrors(test, expect);

const DATA = path.join(__dirname, '..', 'data');
const MAH = JSON.parse(fs.readFileSync(path.join(DATA, 'mahopac.json'), 'utf8'));

// Act 1 done through the dream and Ilse; a Keepers Cadet who went undercover (D1562), posted in Act 2.
const DREAMED = {
  'story.reached_route1': true, 'story.reached_fernbrook': true, 'story.met_glimmerwell': true, 'story.met_fen': true,
  'story.mom_met': true, 'story.mom_chore': true, 'story.mom_sent': true, 'story.reached_mahopac': true, 'story.dream_started': true,
  'story.dream_toy': true, 'story.dream_party': true, 'story.dream_dad': true, 'story.dream_woke': true, 'story.dream_study': true,
  'story.lizzy_met': true, 'story.seal1': true, 'story.phone_got': true,
};
const POSTED = Object.assign({}, DREAMED, {
  'story.crackdown': true, 'story.post_trial_done': true, 'story.warden_called': true, 'story.warden_met': true, 'story.chi_done': true,
  'story.shift_g': true, 'story.orchard_lean': 'pack', 'story.orchard_cleared': true, 'story.sway_fernbrook': -2, 'story.ilse_call2': true,
  'story.keeper_cadet': true, 'story.cover': 'glimmer', 'story.side': 'keepers', 'story.side_pick_done': true, 'story.seal2': true,
  'story.seal3': true, 'story.route3_open': true, 'story.ep1_end': true, 'story.ilse_call3': true, 'story.a2_called': true,
  'story.cover_done': true, 'story.rpt_1': 'told', 'story.rpt_2': 'told', 'story.rpt_3': 'told', 'story.hc_council_done': true,
  'story.gov_posted': true, 'story.cv_mom_walk': true, 'story.cv_mom': 'told', 'story.cv_mom_day': null,
});
// Between Seal 4 and Seal 5 (nothing in the game sets story.seal4 yet: seeded).
const SEAL4 = Object.assign({}, POSTED, { 'story.seal4': true });
// Act 5, after the Ledger Night and the Spire (story.ilse_ledger and story.solvane_met: later builds, seeded).
const ACT5 = Object.assign({}, POSTED, { 'story.seal4': true, 'story.seal5': true, 'story.ilse_ledger': true, 'story.solvane_met': true });

function save(flags, world, seals) {
  const s = starterSave();
  s.settings.controls = 'modern';   // Vincent, Nov 4: Modern for every test
  s.settings.textSpeed = 'fast';
  s.settings.follower = false;
  Object.assign(s.flags, flags);
  for (const [k, v] of Object.entries(s.flags)) if (v === null) delete s.flags[k];
  s.world = Object.assign({ map: 'hm_home_in', x: 5, y: 6, facing: 'up', respawn: 'hearthmoor' }, world || {});
  s.seals = seals || { seal_fernbrook: 1700000000000, seal_glim_1: 1700000000000, seal_glim_2: 1700000000000, seal_glim_3: 1700000000000 };
  s.standing = { keepers: 10, glimmer: 0 };
  return s;
}
async function boot(page, s, opts = {}) {
  if (opts.reduce) await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), s, { quietDay: true, oldSave: !!opts.oldSave });
  await gotoGame(page, opts.search != null ? opts.search : '?debug=1');
  if (opts.search != null) return;
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && typeof PixelPets.talkTo === 'function' && PixelPets.state);
  await page.evaluate(() => { PixelPets.showTab('walk'); if (PixelPets.clearWild) PixelPets.clearWild(); });
}
const flags = page => page.evaluate(() => Object.assign({}, PixelPets.state.flags));
const stored = page => page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
const sceneId = page => page.evaluate(() => PixelPets.scene && PixelPets.scene.id);
const ids = page => page.evaluate(() => PixelPets.mapObjs.map(o => o.id));
async function goto(page, map, x, y, facing) {
  await page.evaluate(([m, x, y, f]) => PixelPets.goto(m, x, y, f), [map, x, y, facing || 'down']);
  await page.waitForFunction(m => PixelPets.mapInfo.id === m && !PixelPets.fading, map);
}
// Modern controls: a tap on a person or prop walks over and talks.
async function tapTile(page, x, y) {
  await expect.poll(() => page.evaluate(async () => {
    const a = Object.assign({}, PixelPets.walk.cam);
    await new Promise(r => setTimeout(r, 120));
    const b = PixelPets.walk.cam;
    return a.x === b.x && a.y === b.y;
  }), { timeout: 5000 }).toBe(true);
  const r = await page.evaluate(({ x, y }) => {
    const mc = document.querySelector('#mapCanvas'), b = mc.getBoundingClientRect(), cam = PixelPets.walk.cam;
    const cx = b.left + ((x * 16 + 8 - cam.x) / mc.width) * b.width, cy = b.top + ((y * 16 + 8 - cam.y) / mc.height) * b.height;
    const opt = { bubbles: true, cancelable: true, clientX: cx, clientY: cy, pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0 };
    mc.dispatchEvent(new PointerEvent('pointerdown', opt));
    mc.dispatchEvent(new PointerEvent('pointerup', opt));
    return cx >= b.left && cx <= b.right && cy >= b.top && cy <= b.bottom;
  }, { x, y });
  expect(r, 'tile ' + x + ',' + y + ' on screen').toBe(true);
}
// Plays the open scene to its end; records each line [who, text] and each choice ['>', pick, labels, prompt].
async function drive(page, picks = [], ms = 90000, onLine = null) {
  const until = Date.now() + ms, lines = [];
  let last = null;
  while (Date.now() < until) {
    const sc = await page.evaluate(() => PixelPets.scene && { mode: PixelPets.scene.mode, full: PixelPets.scene.full, waiting: PixelPets.scene.waiting, text: PixelPets.scene.text, who: PixelPets.scene.who });
    if (!sc) { await page.waitForTimeout(150); if (!(await page.evaluate(() => !!PixelPets.scene))) return lines; continue; }
    if (sc.mode === 'choice') {
      if (!sc.full) { await page.waitForTimeout(40); continue; }
      if (!(await page.locator('#sbChoices button:visible').count())) { await page.waitForTimeout(40); continue; }
      await page.waitForFunction(() => PixelPets.optionsReady === true);
      const labels = (await page.locator('#sbChoices button').allTextContents()).map(t => t.trim());
      for (const b of await page.locator('#sbChoices button').all()) expect((await b.boundingBox()).height).toBeGreaterThanOrEqual(44);
      const pick = picks.find(p => labels.includes(p)) || labels[0];
      lines.push(['>', pick, labels, sc.text]);
      await page.locator('#sbChoices button', { hasText: pick }).first().click();
      await page.waitForTimeout(40); continue;
    }
    if (sc.mode === 'say' && sc.waiting) {
      if (!sc.full) { await page.waitForTimeout(40); continue; }
      const key = sc.who + '|' + sc.text;
      if (key !== last) { lines.push([sc.who || '', sc.text]); last = key; if (onLine) await onLine(sc, lines.length - 1); }
      await page.keyboard.press('Space'); await page.waitForTimeout(30); continue;
    }
    await page.waitForTimeout(40);
  }
  throw new Error('scene did not end');
}
const says = lines => lines.filter(l => l[0] !== '>').map(l => l[1]);
// The day's hello and the built unlock bookkeeping (story.unlock_*, written at boot by the phone and panels) are not this packet's.
const noDaily = f => Object.fromEntries(Object.entries(f).filter(([k]) => !/^daily\.|^story\.unlock_/.test(k)));
const MD_FLAGS = ['story.mom_mah_ask', 'story.mom_mahopac', 'story.lens_note', 'story.lens_seen'];

test.describe('MD-1: the two built-drift fixes (G1 D1951, G2 D1949)', () => {
  test('G1: mahopac.json says the chain is required; the keys stay @w1', async () => {
    expect(MAH.status).toBe('playable story chain. Required on new saves (D1167, quests.js home_trip). Telling Ilse stays optional.');
    expect(MAH.decisions['1_optional']).toBe('Was optional (D27). Since D1167 the dream is a main-chain step on new saves. Old saves that skipped it still load and go on.');
    expect(Object.keys(MAH.decisions)).toEqual(['1_optional', '2_ilse', '3_dream_art', '4_no_conflict']);
    expect(MAH.status).not.toMatch(/optional after|does not gate/i);
  });

  test('T5 (G2): Dad shows no place line on PEOPLE; Mom still reads home · AT HOME', async ({ page }) => {
    const s = save({ 'story.phone_got': true, 'story.lizzy_met': true }, { map: 'hearthmoor', x: 8, y: 8, facing: 'down' }, {});
    s.phoneBook = { met: { Mom: true, Dad: true, Lizzy: true }, fav: {} };
    await boot(page, s);
    expect(await page.evaluate(() => PixelPets.whereNow('Dad'))).toBeNull();
    expect((await page.evaluate(() => PixelPets.whereNow('Mom'))).line).toBe('home · AT HOME');
    await page.locator('#repBtn').click();
    await expect(page.locator('#ovRep')).toBeVisible();
    const row = name => page.locator('.rep-row').filter({ has: page.locator('.rep-name', { hasText: new RegExp('^' + name + '$') }) });
    await expect(row('Dad')).toHaveCount(1);
    await expect(row('Dad').locator('.where-line')).toHaveCount(0);
    await expect(row('Mom').locator('.where-text')).toHaveText('home · AT HOME');
    await shot(page, 'mahopac-dad-people');
    await row('Dad').locator('.rep-face-btn').click();
    await expect(page.locator('#repCard')).toBeVisible();
    await expect(page.locator('#repCard .where-line')).toHaveCount(0);
    await expect(page.locator('#repCard .rep-name')).toHaveText('Dad');
  });

  // T1: old saves of every kind load with v 2, the same flags, nothing written at load; the quest still resolves.
  const OLD = {
    'pre-D1167, skipped Mahopac': [{ 'story.reached_route1': true, 'story.reached_fernbrook': true, 'story.met_fen': true, 'story.seal1': true }, { map: 'fernbrook', x: 12, y: 8, facing: 'down' }],
    'Mahopac done': [DREAMED, { map: 'hm_home_in', x: 5, y: 6, facing: 'up' }],
    'mid-dream (the birthday done)': [{ 'story.mom_met': true, 'story.mom_chore': true, 'story.mom_sent': true, 'story.reached_mahopac': true, 'story.dream_started': true, 'story.dream_toy': true, 'story.dream_party': true }, { map: 'dream_drive', x: 5, y: 3, facing: 'left' }],
    'Act 2 before Seal 4': [POSTED, { map: 'hm_home_in', x: 5, y: 6, facing: 'up' }],
    'Act 5, With the Warden': [Object.assign({}, ACT5, { 'story.rpt_4': 'kept' }), { map: 'mahopac_obs', x: 4, y: 5, facing: 'up' }],
    'Act 5, the loyalist': [Object.assign({}, ACT5, { 'story.warden_cut': true }), { map: 'mahopac_obs', x: 4, y: 5, facing: 'up' }],
    'Act 5, the switcher': [Object.assign({}, ACT5, { 'story.switched_a3': true, 'story.ilse_p0': true }), { map: 'mahopac_obs', x: 4, y: 5, facing: 'up' }],
  };
  for (const [name, [f, world]] of Object.entries(OLD)) {
    test(`T1: ${name} loads unchanged @w1`, async ({ page }) => {
      const s = save(f, world, name.indexOf('pre-D1167') === 0 ? {} : undefined);
      await boot(page, s, { oldSave: true });
      const want = noDaily(Object.assign({}, s.flags));
      await page.waitForTimeout(400);
      const st = await stored(page);
      expect(st.v).toBe(2);
      expect(noDaily(st.flags)).toEqual(want);
      expect(noDaily(await flags(page))).toEqual(want);
      for (const k of MD_FLAGS) expect(st.flags[k] === undefined || st.flags[k] === s.flags[k], k).toBe(true);
      expect(await page.evaluate(() => PixelPets.questCheck)).toEqual([]);
      expect(typeof (await page.evaluate(() => PixelPets.quest && PixelPets.quest.id))).toBe('string');
    });
  }
});
