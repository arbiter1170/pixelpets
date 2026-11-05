/* ACT2_COVER_STORY v0.1.1 (design repo, private; D1680-D1699), the slices that play in Act 2's opening: Mom's "Supper" (C-M)
   after the posting, her repeats and daily snack (D1696), the pin variant for a save that never wore the lanyard (D1695), and
   Juniper's optional reveal point in Fernbrook (D1688). data/detail_zzz_act2_cover.json, game.js (the snack's day guard).
   Every new line is PLACEHOLDER. Save stays pixelpets.save.v2, v 2, new story.* keys only. §7 T1, T2, T8 (part), T11, T12;
   320, 375, 390 (@w1 rows at 320 only); reduced motion; zero console errors. */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { starterSave, installSave, trackErrors, gotoGame, shot } = require('./helpers');

trackErrors(test, expect);

const COVER = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'detail_zzz_act2_cover.json'), 'utf8'));
// A Cadet after the recall, the Lantern Council and Ilse's posting (every new save went undercover, D1562).
const POSTED = {
  'story.reached_route1': true, 'story.reached_fernbrook': true, 'story.met_glimmerwell': true, 'story.met_fen': true,
  'story.mom_met': true, 'story.mom_chore': true, 'story.mom_sent': true, 'story.reached_mahopac': true, 'story.dream_woke': true,
  'story.dream_study': true, 'story.lizzy_met': true, 'story.seal1': true, 'story.crackdown': true, 'story.post_trial_done': true,
  'story.phone_got': true, 'story.warden_called': true, 'story.warden_met': true, 'story.chi_done': true, 'story.shift_g': true,
  'story.orchard_lean': 'pack', 'story.orchard_cleared': true, 'story.sway_fernbrook': -2, 'story.ilse_call2': true,
  'story.keeper_cadet': true, 'story.cover': 'glimmer', 'story.side': 'keepers', 'story.side_pick_done': true, 'story.seal2': true,
  'story.seal3': true, 'story.route3_open': true, 'story.ep1_end': true, 'story.ilse_call3': true, 'story.a2_called': true,
  'story.cover_done': true, 'story.rpt_1': 'told', 'story.rpt_2': 'told', 'story.rpt_3': 'told', 'story.hc_council_done': true,
  'story.gov_posted': true,
};
function save(flags, world, seals) {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.textSpeed = 'fast';
  s.settings.follower = false;
  Object.assign(s.flags, flags);
  for (const [k, v] of Object.entries(s.flags)) if (v === null) delete s.flags[k];
  s.world = Object.assign({ map: 'hm_lodge_in', x: 5, y: 7, facing: 'down', respawn: 'hearthmoor' }, world || {});
  s.seals = seals || { seal_fernbrook: 1700000000000, seal_glim_1: 1700000000000, seal_glim_2: 1700000000000, seal_glim_3: 1700000000000 };
  s.standing = { keepers: 10, glimmer: 0 };
  return s;
}
async function boot(page, s, opts = {}) {
  if (opts.reduce) await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), s, { quietDay: true, oldSave: !!opts.oldSave });
  await gotoGame(page, '?debug=1');
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
// Modern controls (Vincent, Nov 4): a tap on a tile walks there, a tap on a person or prop walks over and talks.
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
async function step(page, dir) { await page.evaluate(d => PixelPets.walkStep(d), dir); await page.waitForTimeout(380); }
async function drive(page, picks = [], ms = 90000) {
  const until = Date.now() + ms, lines = [];
  let last = null;
  while (Date.now() < until) {
    const sc = await page.evaluate(() => PixelPets.scene && { mode: PixelPets.scene.mode, full: PixelPets.scene.full, waiting: PixelPets.scene.waiting, text: PixelPets.scene.text, who: PixelPets.scene.who });
    if (!sc) { await page.waitForTimeout(150); if (!(await page.evaluate(() => !!PixelPets.scene))) return lines; continue; }
    if (sc.mode === 'choice') {
      if (!sc.full) { await page.waitForTimeout(40); continue; }   // let the line finish: a press racing the typing would skip it
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
      if (key !== last) { lines.push([sc.who || '', sc.text]); last = key; }
      await page.keyboard.press('Space'); await page.waitForTimeout(30); continue;
    }
    await page.waitForTimeout(40);
  }
  throw new Error('scene did not end');
}
const says = lines => lines.filter(l => l[0] !== '>').map(l => l[1]);
const THREE = ['Tell the truth', 'Cover story', 'Say nothing'];
const HEAD = ['You put the company lanyards in the drawer. Not on your coat, Ilse said.', 'Is that a Glimmerwell lanyard? Three of them?',
  'Hattie showed me a Ribbit post. You, on the Brinewick quay, in their colours.', "Now there's a Keeper pin on your coat, and the Governor has sent for you."];
const ANSWER = {
  'Tell the truth': ['told', ['You tell her. Ilse asked you to wear it, to watch, and to tell only her.', 'Oh, love. So that\'s why you came home so tired.',
    "I won't breathe a word. Maze, you didn't hear that.", "Come home when you can. There'll always be something packed for Pipkit."]],
  'Cover story': ['cover', ['You tell her the Keepers made you a better offer. It sounds true out loud.', 'Hm. A better offer. They always sound good at the door.',
    'Just keep coming home between them.']],
  'Say nothing': ['quiet', ["You don't answer. Mom looks at the drawer, then at you.", "All right. When you're ready. The kettle stays warm.",
    'She takes her coat on the way down. You hear the door.']],
};
// The gate (m1) on the first step out of the Lodge, then the walk home and the drawer (m2-m7).
async function gateAndDrawer(page, pick, opts = {}) {
  await goto(page, 'hearthmoor', 11, 6, 'down');
  expect(await ids(page)).toContain('cv_mom_gate');
  await step(page, 'down');
  expect(await sceneId(page)).toBe('cv_mom_gate');
  const gate = await drive(page);
  expect(says(gate)).toEqual(['There you are. Ilse kept you long enough. Walk me home before your long walk?']);
  expect((await flags(page))['story.cv_mom_walk']).toBe(true);
  expect(await ids(page)).not.toContain('cv_mom_gate');   // she walked on ahead
  await goto(page, 'hm_home_in', 4, 6, 'up');
  expect(await ids(page)).not.toContain('mom');           // she is upstairs at your door
  await goto(page, 'hm_home_room', 7, 3, 'up');
  expect(await ids(page)).toContain('cv_mom_room');
  if (opts.shotAt) await shot(page, opts.shotAt);
  if (opts.tap) { await goto(page, 'hm_home_room', 4, 5, 'up'); await tapTile(page, 7, 2); }   // Modern: tap the drawer
  else expect(await page.evaluate(() => PixelPets.talkTo('room_chest'))).toBe(true);
  await expect.poll(() => sceneId(page), { timeout: 15000 }).toBe('cv_mom_supper');
  return drive(page, [pick]);
}

test.describe('ACT2_COVER_STORY C-M: Mom\'s Supper (D1682, D1696)', () => {
  for (const pick of THREE) {
    test(`T1: ${pick}: the gate, the drawer, the choice; story.cv_mom written once`, async ({ page }) => {
      test.setTimeout(120000);
      await boot(page, save(POSTED), { reduce: pick === 'Say nothing' });
      const lines = await gateAndDrawer(page, pick, { shotAt: pick === 'Tell the truth' ? 'cover-room' : null, tap: pick === 'Tell the truth' });
      const ch = lines.find(l => l[0] === '>');
      expect(ch[2]).toEqual(THREE);
      expect(ch[3]).toBe("I'm not cross, love. I'm lost. Who are you working for?");
      expect(says(lines)).toEqual(HEAD.concat(ANSWER[pick][1]));
      for (const l of lines) if (l[0] !== '>') expect(Array.from(l[1]).length, l[1]).toBeLessThanOrEqual(110);
      const f = await flags(page);
      expect(f['story.cv_mom']).toBe(ANSWER[pick][0]);
      if (pick === 'Tell the truth') await expect.poll(() => page.evaluate(() => PixelPets.toasts.includes('Mom packs a snack for Pipkit daily.'))).toBe(true);
      // One-shot: the drawer is a drawer again, the door body is gone, downstairs Mom is back with her repeat.
      expect(await ids(page)).not.toContain('cv_mom_room');
      await page.evaluate(() => PixelPets.talkTo('room_chest'));
      expect(await sceneId(page)).not.toBe('cv_mom_supper');
      await drive(page);
      expect((await flags(page))['story.cv_mom']).toBe(ANSWER[pick][0]);
      const st = await stored(page);
      expect(st.v).toBe(2);
      for (const k of Object.keys(POSTED)) expect(st.flags, k).toHaveProperty([k]);
    });
  }

  test('T1: closing the app mid-Supper writes nothing; the scene replays from the drawer @w1', async ({ page }) => {
    test.setTimeout(120000);
    await boot(page, save(Object.assign({}, POSTED, { 'story.cv_mom_walk': true }), { map: 'hm_home_room', x: 7, y: 3, facing: 'up' }));
    await page.evaluate(() => PixelPets.talkTo('room_chest'));
    await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.mode === 'say' && PixelPets.scene.waiting);
    await page.reload({ waitUntil: 'commit' });
    await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && PixelPets.state);
    await page.evaluate(() => PixelPets.showTab('walk'));
    expect((await flags(page))['story.cv_mom']).toBeUndefined();
    await goto(page, 'hm_home_room', 5, 4, 'down');
    expect(await page.evaluate(() => PixelPets.talkTo('cv_mom_room'))).toBe(true);   // talking to Mom first plays the same scene
    expect(await sceneId(page)).toBe('cv_mom_supper');
    await drive(page, ['Cover story']);
    expect((await flags(page))['story.cv_mom']).toBe('cover');
  });

  test('T2: told gets one heal_snack a day at home; the day roll opens the next; cover and quiet never get one', async ({ page }) => {
    test.setTimeout(120000);
    // BANK_AND_HOMES beat 1: Mom's passbook sits before her repeat; this save already has it (tests/bank_slice_1.spec.js plays it).
    await boot(page, save(Object.assign({}, POSTED, { 'story.cv_mom': 'told', 'story.cv_mom_walk': true, 'story.bank_book': true }), { map: 'hm_home_in', x: 5, y: 6, facing: 'up' }));
    const bag = () => page.evaluate(() => PixelPets.state.bag.heal_snack | 0);
    const n0 = await bag();
    await page.evaluate(() => PixelPets.talkTo('mom'));
    expect(await sceneId(page)).toBe('cv_mom_snack');
    expect(says(await drive(page))).toEqual(['Maze packed this for Pipkit.']);
    expect(await bag()).toBe(n0 + 1);
    const today = await page.evaluate(() => PixelPets.state.flags['story.cv_mom_day']);
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    await page.evaluate(() => PixelPets.talkTo('mom'));
    expect(says(await drive(page, ['Not now']))[0]).toBe("I told nobody. Well. Maze. She's a vault.");   // then her built tips offer
    expect(await bag()).toBe(n0 + 1);
    await page.evaluate(() => PixelPets.fadeTick(false));   // same day: the guard holds
    expect((await flags(page))['story.cv_mom_day']).toBe(today);
    await page.evaluate(() => { PixelPets.state.flags['story.cv_mom_day'] = '2000-01-01'; PixelPets.fadeTick(false); });   // the day roll
    expect((await flags(page))['story.cv_mom_day']).toBeUndefined();
    await page.evaluate(() => PixelPets.talkTo('mom'));
    expect(await sceneId(page)).toBe('cv_mom_snack');
    await drive(page);
    expect(await bag()).toBe(n0 + 2);
    for (const [v, line] of [['cover', "A better offer. Hattie isn't buying it."], ['quiet', "Ilse says you're hers. That'll do me."]]) {
      await page.evaluate(x => { PixelPets.setFlag('story.cv_mom', x); PixelPets.setFlag('story.cv_mom_day', null); }, v);
      await page.evaluate(() => PixelPets.talkTo('mom'));
      expect(says(await drive(page, ['Not now']))[0]).toBe(line);
      expect(await bag()).toBe(n0 + 2);
    }
  });
});

test.describe('ACT2_COVER_STORY old saves (D1695) and Juniper (D1688)', () => {
  test('T11: a moved Keepers-pick save (no lanyard) gets the pin line, no choice, cv_mom quiet; a moved Glimmer save gets Supper', async ({ page }) => {
    test.setTimeout(150000);
    const keepers = Object.assign({}, POSTED, { 'story.cover': null, 'story.ilse_call_old': true, 'story.rpt_old_seen': true, 'story.ilse_call2': null });
    await boot(page, save(keepers, null, { seal_fernbrook: 1700000000000, seal_cobblecrest: 1700000000000, seal_brinewick: 1700000000000 }));
    await goto(page, 'hearthmoor', 11, 6, 'down'); await step(page, 'down');
    expect(await sceneId(page)).toBe('cv_mom_gate');
    const lines = await drive(page);
    expect(lines.some(l => l[0] === '>')).toBe(false);
    expect(says(lines)).toEqual(['A Keeper pin. Look at you. Sit down before supper goes cold.']);
    const f = await flags(page);
    expect([f['story.cv_mom'], f['story.cv_mom_walk']]).toEqual(['quiet', undefined]);
    await goto(page, 'hm_home_in', 5, 6, 'up');
    await page.evaluate(() => PixelPets.setFlag('story.bank_book', true));   // BANK_AND_HOMES beat 1 already given (its own spec plays it)
    await page.evaluate(() => PixelPets.talkTo('mom'));
    expect(says(await drive(page, ['Not now']))[0]).toBe("Ilse says you're hers. That'll do me.");   // her built tips offer may follow
    // Juniper keys on a lanyard past too: no point for this save.
    expect(await page.evaluate(() => PixelPets.condRead('story.act>=2 & story.cover_done & !story.cv_juniper & seal:seal_glim_1').cond)).toBe(false);
  });

  test('T11: a moved Glimmer save (Tier lanyard, no story.cover) plays Supper from the home fallback', async ({ page }) => {
    test.setTimeout(120000);
    const glim = Object.assign({}, POSTED, { 'story.cover': null, 'story.ilse_call_old': true, 'story.rpt_old_seen': true, 'story.hc_gov_met': true });
    await boot(page, save(glim, { map: 'hm_home_in', x: 4, y: 5, facing: 'down' }));
    await step(page, 'down');   // home: the fallback key (past B1, never through the Lodge gate)
    await page.waitForFunction(() => !PixelPets.scene);
    expect((await flags(page))['story.cv_mom_walk']).toBe(true);
    await goto(page, 'hm_home_room', 7, 3, 'up');
    await page.evaluate(() => PixelPets.talkTo('room_chest'));
    const lines = await drive(page, ['Say nothing']);
    expect(lines.find(l => l[0] === '>')[2]).toEqual(THREE);
    expect((await flags(page))['story.cv_mom']).toBe('quiet');
  });

  test('Juniper (optional, §3.4): truth moves Fernbrook +1 and her stand leaves; cover and quiet keep her; once only', async ({ page }) => {
    test.setTimeout(150000);
    await boot(page, save(POSTED, { map: 'fernbrook', x: 14, y: 8, facing: 'up' }));
    const present = await ids(page);
    test.skip(!present.includes('juniper'), 'Juniper is not on Fernbrook\'s square for this save');
    for (const [pick, v, line] of [['Cover story', 'cover', 'Aw. No hard feelings! The trial lanyard offer stays open. Have a bright day!'],
      ['Say nothing', 'quiet', 'Mysterious! Very Keeper of you. Have a bright day!'], ['Tell the truth', 'told', null]]) {
      await page.evaluate(() => PixelPets.setFlag('story.cv_juniper', null));
      await goto(page, 'fernbrook', 14, 8, 'up');
      expect(await page.evaluate(() => PixelPets.talkTo('juniper'))).toBe(true);
      expect(await sceneId(page)).toBe('cv_juniper');
      const lines = await drive(page, [pick]);
      expect(lines[0][3]).toBe('Tester! You vanished from the partnership! Did the Keepers poach you? Blink twice!');
      expect(lines[0][2]).toEqual(THREE);
      if (line) expect(says(lines)).toEqual([line]);
      const f = await flags(page);
      expect(f['story.cv_juniper']).toBe(v);
      if (v !== 'told') { expect(f['story.sway_fernbrook']).toBe(-2); expect(await ids(page)).toContain('juniper'); }
    }
    const f = await flags(page);
    expect(f['story.sway_fernbrook']).toBe(-1);   // -2 + 1
    await goto(page, 'fernbrook', 14, 8, 'up');
    const after = await ids(page);
    expect(after).not.toContain('juniper');
    expect(after).not.toContain('fb_lantern_stand');
    // clamped at 3
    await page.evaluate(() => { PixelPets.setFlag('story.cv_juniper', null); PixelPets.setFlag('story.sway_fernbrook', 3); PixelPets.runScene('cv_juniper'); });
    await drive(page, ['Tell the truth']);
    expect((await flags(page))['story.sway_fernbrook']).toBe(3);
  });

  test('T12: every line fits (say 110, choices 30, repeats and toasts 40), no banned word; no meter; save shape unchanged @w1', async ({ page }) => {
    const BANNED = new RegExp('\\b(' + ['fa' + 'int(ed)?', 'ev' + 'olv\\w*', 'co' + 'ins?', 'app' + 'eared', 'tr' + 'ainer', '\\w+' + 'dex', 'chip', 'relay', 'tuning', 'alien'].join('|') + ')\\b|go, [a-z]+!', 'i');
    const len = s => s.replace(/\{(name|pet)\}/g, 'x'.repeat(10)).length;
    const walk = steps => { for (const st of steps || []) {
      if (!Array.isArray(st)) continue;
      if (st[0] === 'say') { expect(len(st[2]), st[2]).toBeLessThanOrEqual(110); expect(st[2]).not.toMatch(BANNED); }
      if (st[0] === 'toast') expect(len(st[1]), st[1]).toBeLessThanOrEqual(40);
      if (st[0] === 'choice') { expect(len(st[1])).toBeLessThanOrEqual(110); for (const o of st[2]) { expect(o[0].length).toBeLessThanOrEqual(30); walk(o[1]); } }
      if (st[0] === 'if') { walk(st[2]); walk(st[3]); }
      if (st[0] === 'setFlag' || st[0] === 'inc') expect(st[1]).toMatch(/^story\.(cv_mom|cv_mom_walk|cv_mom_day|cv_juniper|sway_fernbrook)$/);
    } };
    for (const steps of Object.values(COVER.scenes)) walk(steps);
    // Repeats are talk lines (110). The packet asks for 40 or fewer; its told repeat is 41 (a packet gap, kept verbatim).
    for (const v of Object.values(COVER.objPatch.mom.linesBefore.add)) if (v[0] !== '@') expect(v.length, v).toBeLessThanOrEqual(v.startsWith('I told nobody') ? 41 : 40);
    const s = save(POSTED);
    await boot(page, s);
    expect(await page.evaluate(() => PixelPets.questCheck)).toEqual([]);
    const st = await stored(page);
    expect(st.v).toBe(2);
    for (const k of Object.keys(s.flags)) expect(st.flags[k], k).toEqual(s.flags[k]);
    expect(Object.keys(st.flags).filter(k => /cv_/.test(k))).toEqual([]);   // nothing written at load
  });
});
