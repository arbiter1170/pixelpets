/* GOVERNOR_MEETING v0.2.1 (design repo, private; D1469-D1475): Act 2 opens with Warden Ilse's Keeper1 call, the posting at the
   Lodge, the meeting with Governor Merriden in the Governor's House (hc_gov_meet, tools/build_hc_city.py; the city is the
   ?debug=1&hccity=2 preview until HC_CITY_V2 ships) and the optional report at the Lodge. Every new line is PLACEHOLDER.
   data/detail_zzz_act2_opener.json, quests.js, tools/build_hc_city.py. Save stays pixelpets.save.v2, v 2, new story.* keys only.
   §8 T1-T10; runs at 320, 375 and 390 (@w1 rows at 320 only); reduced motion; zero console errors. */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { starterSave, installSave, trackErrors, gotoGame, shot } = require('./helpers');

trackErrors(test, expect);
// KILNMOUTH lands on this branch when its maps are in the data: the chain then points at Claybank Road after the meeting.
const KILN = /"km_road":\{/.test(require('fs').readFileSync(require('path').join(__dirname, '..', 'data', 'mapdata.js'), 'utf8'));

const ROOT = path.join(__dirname, '..');
const OPENER = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'detail_zzz_act2_opener.json'), 'utf8'));
const HC = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'hc_city_v2.json'), 'utf8'));
// HC_PARADE (#296) plays the parade on the first coach arrival after the meeting. It is not on this branch yet.
const PARADE = /hc_parade_start/.test(fs.readFileSync(path.join(ROOT, 'data', 'mapdata.js'), 'utf8'));

// Act 1 done the new way (the crackdown, the Wickerglen shifts with the ledger, the lean, the enrolment, the Halls).
const ACT1 = {
  'story.reached_route1': true, 'story.rival1_done': true, 'story.reached_fernbrook': true, 'story.met_glimmerwell': true,
  'story.met_fen': true, 'story.crate_a': true, 'story.crate_b': true, 'story.crate_c': true, 'story.tally_done': true,
  'story.tl_amos': true, 'story.tl_juniper': true, 'story.tl_done': true, 'story.crates_seen': true, 'story.fen_sent_home': true,
  'story.mom_met': true, 'story.mom_chore': true, 'story.mom_sent': true, 'story.reached_mahopac': true, 'story.dream_woke': true,
  'story.class_sent': true, 'story.lizzy_met': true, 'story.lizzy_class': true, 'trainer.h1_cadet': true,
  'trainer.h1_challenger': true, 'trainer.h1_local': true, 'trainer.hall1_fen': true, 'story.seal1': true,
  'story.crackdown': true, 'story.hall1_shut': true, 'story.post_trial_done': true, 'story.fen_lean': 2, 'story.phone_got': true,
  'story.warden_called': true, 'story.warden_met': true, 'story.chi_met': true, 'story.chi_jars': 6, 'story.reached_route2': true,
  'story.met_census': true, 'story.reached_glen': true, 'story.shift_g': true, 'story.shift_k': true, 'story.met_lead': true,
  'story.chi_done': true, 'story.orchard_lean': 'pack', 'story.orchard_cleared': true, 'story.sway_fernbrook': -2,
  'story.ilse_call2': true, 'story.keeper_cadet': true, 'story.cover': 'glimmer', 'story.side': 'glimmer', 'story.side_pick_done': true,
  'story.tour1_s1': true, 'story.slice_end': true, 'story.heights_done': true, 'story.seal2': true, 'story.cobble_end': true,
  'story.rpt_1': 'told', 'story.gb_done': true, 'story.rpt_2': 'kept', 'story.route3_open': true, 'story.reached_brinewick': true,
  'story.brine_depot': true, 'story.brine_freed': true, 'story.brine_dorian': true, 'story.seal3': true,
};
const EP1 = Object.assign({}, ACT1, { 'story.ep1_end': true });
// After the recall (D1518, D1562) and the Lantern Council: a Keeper in public; the recall call stood in for Ilse's call.
const RECALLED = Object.assign({}, EP1, { 'story.ilse_call3': true, 'story.a2_called': true, 'story.side': 'keepers',
  'story.cover_done': true, 'story.rpt_3': 'told', 'story.hc_council_done': true });
// An old Keepers-pick save after the move and its Lodge talk: a plain Cadet who never wore the lanyard.
const PLAIN = Object.assign({}, EP1, { 'story.cover': null, 'story.side': null, 'story.shift_g': null, 'story.ilse_call_old': true,
  'story.cover_done': true, 'story.rpt_old_seen': true, 'story.rpt_3': 'kept', 'story.hc_council_done': true, 'story.orchard_lean': 'open', 'story.sway_fernbrook': 3 });

function a2Save(flags, world) {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.textSpeed = 'fast';
  s.settings.follower = false;
  Object.assign(s.flags, flags);
  for (const [k, v] of Object.entries(s.flags)) if (v === null) delete s.flags[k];
  s.world = Object.assign({ map: 'hearthmoor', x: 11, y: 7, facing: 'down', respawn: 'hearthmoor' }, world || {});
  s.standing = { keepers: 10, glimmer: 0 };
  s.seals = { seal_fernbrook: 1700000000000, seal_cobblecrest: 1700000000000, seal_brinewick: 1700000000000, seal_glim_1: 1700000000000 };
  s.party[0].xp = 4000;
  return s;
}
async function boot(page, save, opts = {}) {
  if (opts.reduce) await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), save, { quietDay: true, oldSave: !!opts.oldSave });
  await gotoGame(page, opts.city ? '?debug=1&hccity=2' : '?debug=1');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && typeof PixelPets.talkTo === 'function' && PixelPets.state);
  await page.evaluate(() => { PixelPets.showTab('walk'); if (PixelPets.clearWild) PixelPets.clearWild(); });
  if (opts.reduce) expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
}
const flags = page => page.evaluate(() => Object.assign({}, PixelPets.state.flags));
const stored = page => page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
const sceneId = page => page.evaluate(() => PixelPets.scene && PixelPets.scene.id);
const quest = page => page.evaluate(() => { const q = PixelPets.quest; return q && { id: q.id, text: q.text, target: q.target || null }; });
const condOk = (page, c) => page.evaluate(x => PixelPets.condRead(x).cond, c);
const DOOR = HC.maps.hc_civic.objs.find(o => o.id === 'hc_gov');
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
// Plays the open scene to its end; choices take the first label in `picks` that is offered (else the first); returns
// every line as [speaker, text] and every choice as ['>', label, [labels offered]]. `onLine` may read the stage per line.
async function drive(page, picks = [], onLine = null, ms = 90000) {
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
      const pick = picks.find(p => labels.includes(p)) || labels[0];
      lines.push(['>', pick, labels, sc.text]);
      for (const b of await page.locator('#sbChoices button').all()) expect((await b.boundingBox()).height).toBeGreaterThanOrEqual(44);
      await page.locator('#sbChoices button', { hasText: pick }).first().click();
      await page.waitForTimeout(40); continue;
    }
    if (sc.mode === 'say' && sc.waiting) {
      if (!sc.full) { await page.waitForTimeout(40); continue; }
      const key = sc.who + '|' + sc.text;
      if (key !== last) { lines.push([sc.who || '', sc.text]); last = key; if (onLine) await onLine(sc.text, sc.who || ''); }
      await page.keyboard.press('Space'); await page.waitForTimeout(30); continue;
    }
    await page.waitForTimeout(40);
  }
  throw new Error('scene did not end');
}
const says = lines => lines.filter(l => l[0] !== '>').map(l => l[1]);
const len110 = lines => { for (const l of lines) if (l[0] !== '>') expect(Array.from(l[1]).length, l[1]).toBeLessThanOrEqual(110); };
async function talkIlse(page) {
  await goto(page, 'hm_lodge_in', 5, 5, 'up');
  expect(await page.evaluate(() => PixelPets.talkTo('ilse_lodge_after'))).toBe(true);
}
// The House door (in the city data) read against the live flags.
const doorOpen = page => condOk(page, DOOR.need);

const POSTING = [
  'Sit, Cadet. Brinewick reached me before you did. Good work, and quiet work. I like both.',
  "The Governor's office asked for a Cadet. One who can listen. I gave them you.",
  'A civil posting. You answer to his office, and to me. Nobody else signs for you.',
  "Walk the coach road north to High Charity. The Governor's House, Charter Hill. They'll let you in.",   // ROUTE_TO_GOVERNOR §6 re-voice (D1854)
  'And Tester? Come home after. Tell me what he asks. In person, not on the wire.',
];
const MEETING_HEAD = [
  "Warden Ilse's new Cadet. Don't sit. You won't be here long enough to need a chair.",
  "I've work for you. Kilnmouth's springs have gone cold this season. Nobody there can tell me why.",
  'A Calm Tower went up there the same season. Its permit is in order. I checked it myself.',
  "And their council has an empty seat. Everyone has a name for it. I'd like the town's.",
  'Go and look. Listen more than you talk. Then come back and tell me what you found.',
];
// Into the office: the posted Cadet walks through the House door and stands at governor_front (12,5), facing up.
async function toOffice(page) {
  await goto(page, 'hc_civic', 32, 16, 'up');
  await step(page, 'up');
  await page.waitForFunction(() => PixelPets.mapInfo.id === 'hc_gov_1' && !PixelPets.fading);
  expect(await page.evaluate(() => PixelPets.talkTo('hc_gov_keeper_a'))).toBe(true);
  const desk = await drive(page);
  expect(says(desk)).toEqual(['The Governor will see you, Cadet. Go on through.']);
  await goto(page, 'hc_gov_1', 12, 5, 'up');
}

test.describe('GOVERNOR_MEETING Part 1: Ilse sends the Cadet (D1469)', () => {
  test('T1: an Act 1 save gets no call, no posting key, a shut House and no Governor', async ({ page }) => {
    test.setTimeout(90000);
    await boot(page, a2Save(ACT1), { city: true });
    await step(page, 'down'); await step(page, 'up');
    expect(await sceneId(page)).toBeNull();
    expect(await condOk(page, 'story.ep1_end & story.keeper_cadet & !story.side=glimmer & !story.gov_posted')).toBe(false);
    expect(await doorOpen(page)).toBe(false);
    await goto(page, 'hc_civic', 32, 16, 'up'); await step(page, 'up');
    await expect(page.locator('#sbText')).toContainText('By appointment.');
    await drive(page);
    expect((await page.evaluate(() => PixelPets.mapInfo.id))).toBe('hc_civic');
    await goto(page, 'hc_gov_1', 7, 14, 'up');
    expect(await page.evaluate(() => !!(PixelPets.objPos('hc_governor') || {}).present)).toBe(false);
    expect(Object.keys(await flags(page)).filter(k => /a2_called|gov_posted|km_assigned|gov_told|rpt_gov/.test(k))).toEqual([]);
  });

  test('T2: a plain Act 2 Cadet: the call rings on the first step out; the door still says By appointment; gov_post; no lead-in on Lumen', async ({ page }) => {
    test.setTimeout(120000);
    await boot(page, a2Save(PLAIN, { map: 'hm_lodge_in', x: 5, y: 7, facing: 'down' }));
    expect(await page.evaluate(() => PixelPets.act)).toBe(2);
    expect((await quest(page)).id).toBe('gov_post');
    expect(await sceneId(page)).toBeNull();   // nothing rings indoors
    await goto(page, 'hearthmoor', 11, 7, 'down'); await step(page, 'down');
    expect(await sceneId(page)).toBe('a2_ilse_call');
    const lines = await drive(page, ['Answer']);
    len110(lines);
    expect(lines.map(l => l[1])).toEqual(['Your Keeper1 buzzes in your pocket. WARDEN ILSE.', 'Answer',
      'Cadet Tester. Well done at Brinewick. Come home to the Lodge. You have a posting.', 'Not on the wire. Come home.']);
    expect((await flags(page))['story.a2_called']).toBe(true);
    await step(page, 'down');
    expect(await sceneId(page)).not.toBe('a2_ilse_call');   // once
    if (await page.evaluate(() => !!PixelPets.scene)) await drive(page);
    expect(await doorOpen(page)).toBe(false);
    const q = await quest(page);
    expect(q).toEqual({ id: 'gov_post', text: 'Warden Ilse wants you home at the Lodge in Hearthmoor. You have a posting.', target: { map: 'hm_lodge_in', x: 5, y: 3 } });
    // D1470: Lumen's lead-in is held for the seat; it is not built and nothing here writes the rumour flag.
    expect(await page.evaluate(() => PixelPets.sceneScript('thr_cabinet_lead'))).toEqual([]);
    await goto(page, 'hm_hq_f2', 8, 5, 'up');
    expect(await page.evaluate(() => PixelPets.talkTo('hq_lumen'))).toBe(true);
    await drive(page);
    expect((await flags(page))['story.thr_chip_rumour']).toBeUndefined();
    expect((await stored(page)).v).toBe(2);
  });

  test('T3: Ilse gives the posting (no Keeper1 too); her repeat line; gov_meet; the door opens; the desk Keeper @w1', async ({ page }) => {
    test.setTimeout(120000);
    const s = a2Save(Object.assign({}, PLAIN, { 'story.phone_got': null }), { map: 'hm_lodge_in', x: 5, y: 5, facing: 'up' });
    await boot(page, s, { city: true });
    await goto(page, 'hearthmoor', 11, 7, 'down'); await step(page, 'down');
    expect(await sceneId(page)).toBeNull();   // no Keeper1, no call: the quest row points home
    expect((await quest(page)).id).toBe('gov_post');
    await goto(page, 'hm_lodge_in', 5, 7, 'up');
    expect(await page.evaluate(() => PixelPets.state.settings.controls)).toBe('modern');
    await tapTile(page, 5, 3);   // Modern: tap Warden Ilse
    await expect.poll(() => sceneId(page), { timeout: 15000 }).toBe('a2_posting');
    const lines = await drive(page);
    len110(lines);
    expect(says(lines)).toEqual(POSTING);
    const f = await flags(page);
    expect(f['story.gov_posted']).toBe(true);
    expect(f['story.a2_called']).toBeUndefined();
    expect(await page.evaluate(() => PixelPets.talkTo('ilse_lodge_after'))).toBe(true);
    expect(says(await drive(page))).toEqual(["The Governor's House, on Charter Hill. Go on, Cadet."]);
    // ROUTE_TO_GOVERNOR §6 (D1854, D1881): the first trip is on foot; the walk rows come first, then gov_meet as built.
    expect((await quest(page)).id).toBe('gov_walk');
    await page.evaluate(() => { PixelPets.setFlag('story.r4_fork', true); PixelPets.setFlag('story.r4_walked', true); });
    const q = await quest(page);
    expect(q.id).toBe('gov_meet');
    expect(q.text).toBe("Report to Governor Merriden at the Governor's House on Charter Hill, High Charity.");
    expect(q.target).toEqual({ map: 'hc_gov_1', x: 12, y: 3 });   // the marker sits on Governor Merriden
    expect(await doorOpen(page)).toBe(true);
    await toOffice(page);
    await shot(page, 'gov-office');
  });
});

test.describe('GOVERNOR_MEETING Part 2: the meeting, hc_gov_meet (D1471, D1472)', () => {
  test('T4: with the ledger, Tell him: he walks round the desk to 14,4; lines in order; told; km_assigned and hc_gov_met; his repeat', async ({ page }) => {
    test.setTimeout(120000);
    await boot(page, a2Save(Object.assign({}, RECALLED, { 'story.gov_posted': true })), { city: true });
    await toOffice(page);
    expect(await page.evaluate(() => PixelPets.talkTo('hc_governor'))).toBe(true);
    expect(await sceneId(page)).toBe('hc_gov_meet');
    let at = null;
    const lines = await drive(page, ['Tell him about the ledger'], async text => {
      if (!at && text === MEETING_HEAD[0]) at = await page.evaluate(() => PixelPets.objPos('hc_governor'));
    });
    len110(lines);
    expect(at).toMatchObject({ x: 14, y: 4 });
    const choice = lines.find(l => l[0] === '>');
    expect(choice[2]).toEqual(['Tell him about the ledger', 'Keep it to myself']);
    expect(choice[3]).toBe("You know where Fernbrook's Seals went.");
    expect(says(lines)).toEqual(MEETING_HEAD.concat([
      'You tell him about the crate ledger: LAMP STOCK, from the Fernbrook allotment. By permit.',
      "Lamp stock. My office signs a hundred permits a week. I'll ask. Kindly, but I'll ask.",
      'Kilnmouth, then. Safe roads, Cadet.']));
    expect(lines.filter(l => l[0] === 'Governor Merriden').length).toBe(7);
    const f = await flags(page);
    expect([f['story.gov_told'], f['story.km_assigned'], f['story.hc_gov_met']]).toEqual(['told', true, true]);
    expect(f['story.hc_cabinet_seat']).toBeUndefined();
    expect(f['story.thr_chip_rumour']).toBeUndefined();
    expect(f['story.cab_seat']).toBeUndefined();
    // KILNMOUTH (X19): once the town is built, its first row takes the holding row's place.
    expect((await quest(page)).id).toBe(KILN ? 'km_walk' : 'a2_hold');
    expect((await quest(page)).text).toBe(KILN ? 'Take the east fork from Route 4 and walk Claybank Road up to Kilnmouth.' : 'Await your next orders.');
    await goto(page, 'hc_gov_1', 12, 5, 'up');
    expect(await page.evaluate(() => PixelPets.talkTo('hc_governor'))).toBe(true);
    expect(says(await drive(page))).toEqual(["Kilnmouth's springs, and the empty seat. Come back when you know more."]);
    await shot(page, 'gov-after');
  });

  test('T5: Keep it to myself writes kept; without the ledger there is no choice; the stair stays shut in Act 2', async ({ page }) => {
    test.setTimeout(150000);
    await boot(page, a2Save(Object.assign({}, RECALLED, { 'story.gov_posted': true })), { city: true });
    await toOffice(page);
    await page.evaluate(() => PixelPets.talkTo('hc_governor'));
    let lines = await drive(page, ['Keep it to myself']);
    expect(says(lines)).toContain("You've the look of someone holding something back. Keep it, then. Bring it when it's ready.");
    let f = await flags(page);
    expect([f['story.gov_told'], f['story.km_assigned'], f['story.hc_gov_met']]).toEqual(['kept', true, true]);
    // An old save that skipped the Act 1 investigation (no story.shift_g): no choice, no story.gov_told.
    await page.evaluate(() => { for (const k of ['story.gov_told', 'story.km_assigned', 'story.hc_gov_met', 'story.shift_g']) PixelPets.setFlag(k, null); });
    await goto(page, 'hc_gov_1', 12, 5, 'up');
    await page.evaluate(() => PixelPets.talkTo('hc_governor'));
    lines = await drive(page);
    expect(lines.some(l => l[0] === '>')).toBe(false);
    expect(says(lines)).toEqual(MEETING_HEAD.concat(['Kilnmouth, then. Safe roads, Cadet.']));
    f = await flags(page);
    expect(f['story.gov_told']).toBeUndefined();
    expect([f['story.km_assigned'], f['story.hc_gov_met']]).toEqual([true, true]);
    // GOV3 still needs Act 5: the stair is solid in Act 2.
    await goto(page, 'hc_gov_1', 2, 2, 'left'); await step(page, 'left');
    expect(await page.evaluate(() => PixelPets.mapInfo.id)).toBe('hc_gov_1');
  });

  test('T9: reduced motion and SKIP snap the walk; the choice still stops; closing mid-scene replays from the start with no flags', async ({ page }) => {
    test.setTimeout(150000);
    await boot(page, a2Save(Object.assign({}, RECALLED, { 'story.gov_posted': true })), { city: true, reduce: true });
    await toOffice(page);
    await page.evaluate(() => PixelPets.talkTo('hc_governor'));
    // Reduced motion: he is on 14,4 by the first line, on a whole tile.
    await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.mode === 'say' && PixelPets.scene.waiting);
    const p = await page.evaluate(() => PixelPets.objPos('hc_governor'));
    expect([p.x, p.y]).toEqual([14, 4]);
    expect(Number.isInteger(p.fx == null ? p.x : p.fx) && Number.isInteger(p.fy == null ? p.y : p.fy)).toBe(true);
    // Close the app mid-scene (a reload): nothing was written; the meeting plays again from its first step.
    await page.reload({ waitUntil: 'commit' });
    await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && PixelPets.state);
    await page.evaluate(() => PixelPets.showTab('walk'));
    let f = await flags(page);
    expect([f['story.km_assigned'], f['story.hc_gov_met'], f['story.gov_told']]).toEqual([undefined, undefined, undefined]);
    // SKIP: the scene skips to its choice, which still stops; the same flags are written.
    await goto(page, 'hc_gov_1', 12, 5, 'up');
    await page.evaluate(() => PixelPets.talkTo('hc_governor'));
    await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.mode === 'say' && PixelPets.scene.waiting);
    await page.locator('#sbSkip').click();
    await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.mode === 'choice');
    const q = await page.evaluate(() => PixelPets.objPos('hc_governor'));
    expect([q.x, q.y]).toEqual([14, 4]);
    await drive(page, ['Tell him about the ledger']);
    f = await flags(page);
    expect([f['story.gov_told'], f['story.km_assigned'], f['story.hc_gov_met']]).toEqual(['told', true, true]);
  });

  test('T8: after the meeting the next coach arrival plays the parade (HC_PARADE, #296)', async ({ page }) => {
    test.skip(!PARADE, 'waits for #296 (HC_PARADE): the parade is not on this branch; the meeting writes story.hc_gov_met for it (T4)');
    await boot(page, a2Save(Object.assign({}, RECALLED, { 'story.gov_posted': true, 'story.hc_gov_met': true, 'story.km_assigned': true })));
  });
});

test.describe('GOVERNOR_MEETING Part 3, one scene for every holder, old saves (D1473, D1474)', () => {
  test('T6: a cover holder: one call (the recall); the recall plays first, the posting on the next talk; then the door opens', async ({ page }) => {
    test.setTimeout(150000);
    await boot(page, a2Save(EP1, { map: 'cobblecrest', x: 10, y: 8, facing: 'down' }));
    await step(page, 'down');
    expect(await sceneId(page)).toBe('ilse_recall_call');
    await drive(page, ['Answer']);
    let f = await flags(page);
    expect([f['story.ilse_call3'], f['story.a2_called']]).toEqual([true, true]);
    await step(page, 'down'); await step(page, 'up');
    expect(await sceneId(page)).toBeNull();   // one call, not two
    await talkIlse(page);
    expect(await sceneId(page)).toBe('recall');
    await drive(page, ['Tell her all of it']);
    expect(await doorOpen(page)).toBe(false);
    expect(await page.evaluate(() => PixelPets.talkTo('ilse_lodge_after'))).toBe(true);
    expect(await sceneId(page)).toBe('a2_posting');
    expect(says(await drive(page))).toEqual(POSTING);
    expect(await doorOpen(page)).toBe(true);
    // D2020 (#322): a recalled cover holder meets the Lantern Council in High Charity after the Governor, so the posting leads
    // straight to the walk; the Council comes up once the Governor is met.
    expect((await quest(page)).id).toBe('gov_walk');   // ROUTE_TO_GOVERNOR §6: on foot first (D1854)
    await page.evaluate(() => PixelPets.setFlag('story.r4_walked', true));
    expect((await quest(page)).id).toBe('gov_meet');
    await page.evaluate(() => PixelPets.setFlag('story.hc_gov_met', true));
    expect((await quest(page)).id).toBe('hc_council');
    expect((await stored(page)).v).toBe(2);
  });

  for (const kind of ['glimmer', 'keepers']) {
    test(`T6 old saves: an old ${kind}-pick save past the Episode 1 card lands as a Cadet and gets the same posting`, async ({ page }) => {
      test.setTimeout(120000);
      const old = Object.assign({}, EP1, { 'story.keeper_cadet': null, 'story.cover': null, 'story.ilse_call2': null, 'story.shift_g': null,
        'story.chi_met': null, 'story.chi_done': null, 'story.shift_k': null, 'story.chi_jars': null, 'story.rpt_1': null, 'story.rpt_2': null,
        'story.orchard_lean': null, 'story.sway_fernbrook': null, 'story.fen_lean': null, 'story.hc_council_done': kind === 'keepers' ? true : null,
        'story.side': kind === 'glimmer' ? 'glimmer' : null });
      const s = a2Save(old, { map: 'hm_lodge_in', x: 5, y: 7, facing: 'down' });
      await boot(page, s, { oldSave: true });
      let f = await flags(page);
      expect([f['story.keeper_cadet'], f['story.ilse_call_old'], f['story.side'] === 'glimmer']).toEqual([true, true, false]);
      await talkIlse(page);
      expect(await sceneId(page)).toBe('rpt_old');   // the join packet's one Lodge talk comes first
      await drive(page, ['Tell her all of it']);
      expect(await page.evaluate(() => PixelPets.talkTo('ilse_lodge_after'))).toBe(true);
      expect(await sceneId(page)).toBe('a2_posting');
      await drive(page);
      f = await flags(page);
      expect(f['story.gov_posted']).toBe(true);
      expect(await doorOpen(page)).toBe(true);
      const st = await stored(page);
      expect(st.v).toBe(2);
      for (const k of Object.keys(s.flags)) expect(st.flags, k).toHaveProperty([k]);
    });
  }

  test('T7: the report plays once with told, kept and unset; sets story.rpt_gov; skipping it blocks nothing', async ({ page }) => {
    test.setTimeout(150000);
    const MET = Object.assign({}, RECALLED, { 'story.gov_posted': true, 'story.hc_gov_met': true, 'story.km_assigned': true });
    await boot(page, a2Save(MET, { map: 'hm_lodge_in', x: 5, y: 5, facing: 'up' }));
    // Skipping it blocks nothing: the main chain is already past the meeting; the report is a side pointer.
    expect((await quest(page)).id).toBe(KILN ? 'km_walk' : 'a2_hold');
    expect(await page.evaluate(() => PixelPets.sideActive.some(a => a.id === 'gov_report'))).toBe(true);
    const ends = {};
    for (const told of ['told', 'kept', null]) {
      await page.evaluate(t => { PixelPets.setFlag('story.gov_told', t); PixelPets.setFlag('story.rpt_gov', null); }, told);
      await talkIlse(page);
      expect(await sceneId(page)).toBe('a2_report_gov');
      const lines = await drive(page);
      len110(lines);
      ends[String(told)] = says(lines);
      expect((await flags(page))['story.rpt_gov']).toBe(true);
    }
    const head = ['Kilnmouth. The springs and the seat. He gave a new Cadet a whole town. Interesting.',
      'The tower\'s permit is in order. I keep hearing that, from people who never ask who signed it.'];
    const tail = 'Go on to Kilnmouth. And come home after. This is still your home.';
    expect(ends.told).toEqual(head.concat(["You told him about the ledger. Then we'll see where his asking goes, and who answers.", tail]));
    expect(ends.kept).toEqual(head.concat(['You kept the ledger back. Good. Paper travels further than people think.', tail]));
    expect(ends.null).toEqual(head.concat([tail]));
    // Once: Ilse is herself again after it, and the side pointer is gone.
    expect(await page.evaluate(() => PixelPets.talkTo('ilse_lodge_after'))).toBe(true);
    expect(await sceneId(page)).not.toBe('a2_report_gov');
    await drive(page);
    expect(await page.evaluate(() => PixelPets.sideActive.some(a => a.id === 'gov_report'))).toBe(false);
    expect((await quest(page)).id).toBe(KILN ? 'km_walk' : 'a2_hold');
  });

  test('T10: data: no @glimmer variant, every line fits, no banned word, no new save field; debug places only with ?debug=1 @w1', async ({ page }) => {
    const scenes = Object.assign({}, OPENER.scenes, { hc_gov_meet: HC.scenes.hc_gov_meet });
    for (const id of ['a2_ilse_call', 'a2_posting', 'a2_report_gov', 'hc_gov_meet']) {
      expect(scenes[id], id).toBeTruthy();
      expect(Object.keys(OPENER.scenes).concat(Object.keys(HC.scenes)).filter(k => k.startsWith(id + '@')), id).toEqual([]);
    }
    const BANNED = new RegExp('\\b(' + ['fa' + 'int(ed)?', 'ev' + 'olv\\w*', 'co' + 'ins?', 'app' + 'eared', 'tr' + 'ainer', '\\w+' + 'dex', 'chip', 'relay', 'alien'].join('|') + ')\\b|go, [a-z]+!', 'i');
    const walk = (steps, id) => { for (const st of steps || []) {
      if (!Array.isArray(st)) continue;
      if (st[0] === 'say') { expect(st[2].replace('{name}', 'x'.repeat(10)).length, st[2]).toBeLessThanOrEqual(110); expect(st[2], id).not.toMatch(BANNED); expect(st[2]).not.toMatch(/ {2}/); }
      if (st[0] === 'choice') { expect(st[1].length).toBeLessThanOrEqual(110); for (const o of st[2]) { expect(o[0].length, o[0]).toBeLessThanOrEqual(30); walk(o[1], id); } }
      if (st[0] === 'if') { walk(st[2], id); walk(st[3], id); }
      if (st[0] === 'setFlag') expect(st[1], id).toMatch(/^story\.(a2_called|gov_posted|gov_told|km_assigned|hc_gov_met|rpt_gov)$/);
    } };
    for (const [id, steps] of Object.entries(scenes)) walk(steps, id);
    for (const v of Object.values(OPENER.objPatch.ilse_lodge_after.linesBefore.add)) if (v[0] !== '@') expect(v.length).toBeLessThanOrEqual(110);
    // The game's own checks pass; an old v2 save loads unchanged (no new field, nothing written at load).
    const s = a2Save(PLAIN);
    await boot(page, s);
    expect(await page.evaluate(() => PixelPets.questCheck)).toEqual([]);
    const st = await stored(page);
    expect(st.v).toBe(2);
    expect(Object.keys(st).sort()).toEqual(Object.keys(s).concat(Object.keys(st).filter(k => !(k in s))).sort());
    for (const k of Object.keys(s.flags)) expect(st.flags[k], k).toEqual(s.flags[k]);
    expect(Object.keys(st.flags).filter(k => !(k in s.flags) && /a2_|gov_|km_|rpt_gov/.test(k))).toEqual([]);
    const ids = (await page.evaluate(() => PixelPets.checkpoints())).map(c => c.id);
    for (const id of ['a2_start', 'a2_posted', 'a2_met', 'gov_post', 'gov_meet', 'a2_hold']) expect(ids, id).toContain(id);
    expect((await page.evaluate(() => PixelPets.checkpoint('a2_start'))).ok).toBe(true);
    expect(await page.evaluate(() => PixelPets.mapInfo.id)).toBe('hm_lodge_in');
    expect(await condOk(page, 'story.ep1_end & story.keeper_cadet & !story.side=glimmer & !story.gov_posted')).toBe(true);
    // Without ?debug=1 the hooks stay inert.
    const ctx = await page.context().browser().newContext({ viewport: page.viewportSize() });
    const plain = await ctx.newPage();
    await installSave(ctx, a2Save(PLAIN), { quietDay: true });
    await gotoGame(plain, '');
    expect(await plain.evaluate(() => PixelPets.debug)).toBeFalsy();
    expect(await plain.evaluate(() => typeof PixelPets.checkpoint === 'function' ? PixelPets.checkpoint('a2_start') : undefined)).toBeFalsy();
    expect(await plain.evaluate(() => PixelPets.state && PixelPets.state.flags['story.gov_posted'])).toBeFalsy();
    await ctx.close();
  });
});
