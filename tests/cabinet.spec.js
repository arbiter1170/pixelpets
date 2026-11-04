/* CABINET_AND_COUNCILS v0.2.2 (design repo, private), phase 1b: the Cabinet Room hc_gov_2, Lumen's lead-in, the stair and S1.
   tools/build_hc_city.py (the city is the ?debug=1&hccity=2 preview until HC_CITY_V2 ships), sprites.js (CABINET_ROOM_ART), quests.js.
   §7 C-T1 to C-T3 and the 1b parts of C-T7. Kilnmouth (1a, story.km_reported) and K2a (story.pres_cabinet_first, after the parade)
   are not built on this branch, so the saves here carry the flags they would set. Save stays pixelpets.save.v2, v 2, story.* keys only.
   Runs at 320, 375 and 390 (@w1 rows at 320 only); one run in reduced motion; zero console errors. */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const HC = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'hc_city_v2.json'), 'utf8'));
const ROOM = HC.rooms.hc_gov_2, GOV1 = HC.rooms.hc_gov_1;
const GM = 'Governor Merriden';
const LEAD = [   // CHIP_HINTS thr_cabinet_lead, SIGNED (D1470: unchanged); {name} is the holder's name
  'Sit a moment, Tester. A new report on the lamps came in this morning. Half of it was gone by noon.',
  "People tell us their Walklings come home quiet. A week later, the same people won't say a word.",
  'The Governor wants you at the cabinet table in High Charity. Take the seat. Keep your ears open.',
  'Every case on those lamps reaches the Court empty. Ask yourself who empties them.'];
const ASK = "First matter. Kilnmouth's empty seat. Our Cadet went and listened. Cadet, whose name?";
const CONFIRM = "Then it's confirmed. Take the letter to the Reeve, Cadet.";
const PICKS = {   // CABINET v0.1 §4.5 S1 3a-3c, settled; CABINET_LINES KEEP
  town: ['The Bathkeeper', "The town's own name. Well. Order will follow, I'm sure."],
  commander: ["The Commander's pick", "A Keeper's man. Good. Order first."],
  company: ['The works foreman', 'A sensible name. Kilnmouth will be warm by spring.'],
};

// The Act 1 fixtures as governor_meeting.spec.js has them.
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
// Act 2, Keepers path, after the meeting and the parade; Kilnmouth reached and reported (1a's K1 and K6). story.act is read as
// stored under ?debug=1.
const A2 = Object.assign({}, RECALLED, {
  'story.intro_seen': true, 'story.starter_received': true, 'story.hc_invite': true, 'story.hc_arrived': true, 'story.hc_greeted': true,
  'story.act': 2, 'story.gov_posted': true, 'story.gov_told': 'told', 'story.hc_gov_met': true, 'story.km_assigned': true,
  'story.r4_fork': true, 'story.r4_walked': true, 'story.hc_parade_seen': true, 'story.km_arrived': true, 'story.km_reported': true,
  'story.unlock_sides': true, 'story.unlock_letter': true,
});
const SEAT = Object.assign({}, A2, { 'story.thr_chip_rumour': true });
const K2A = Object.assign({}, SEAT, { 'story.pres_cabinet_first': true, 'story.km_names': 3 });

function save(flags) {
  const s = starterSave();
  s.settings.controls = 'modern'; s.settings.textSpeed = 'fast'; s.settings.follower = false;
  Object.assign(s.flags, flags);
  for (const [k, v] of Object.entries(s.flags)) if (v === null) delete s.flags[k];
  s.world = { map: 'hearthmoor', x: 11, y: 7, facing: 'down', respawn: 'hearthmoor' };
  s.standing = { keepers: 10, glimmer: 0 };
  s.seals = { seal_fernbrook: 1700000000000, seal_cobblecrest: 1700000000000, seal_brinewick: 1700000000000, seal_glim_1: 1700000000000 };
  s.party[0].xp = 4000;
  return s;
}
async function boot(page, flags, opts = {}) {
  if (opts.reduce) await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), save(flags), { quietDay: true });
  await gotoGame(page, '?debug=1&hccity=2');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && typeof PixelPets.talkTo === 'function' && PixelPets.state);
  await page.evaluate(() => { PixelPets.showTab('walk'); if (PixelPets.clearWild) PixelPets.clearWild(); });
  if (opts.reduce) expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
}
const flags = page => page.evaluate(() => Object.assign({}, PixelPets.state.flags));
const stored = page => page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
const sceneId = page => page.evaluate(() => PixelPets.scene && PixelPets.scene.id);
const quest = page => page.evaluate(() => { const q = PixelPets.quest; return q && { id: q.id, text: q.text, target: q.target || null }; });
const where = page => page.evaluate(() => ({ map: PixelPets.mapInfo.id, x: PixelPets.state.world.x, y: PixelPets.state.world.y }));
const present = (page, id) => page.evaluate(i => !!(PixelPets.objPos(i) || {}).present, id);
async function goto(page, map, x, y, facing) {
  await page.evaluate(([m, x, y, f]) => PixelPets.goto(m, x, y, f), [map, x, y, facing || 'down']);
  await page.waitForFunction(m => PixelPets.mapInfo.id === m && !PixelPets.fading, map);
}
async function step(page, dir) {
  await page.evaluate(d => PixelPets.walkStep(d), dir);
  await page.waitForFunction(() => !PixelPets.fading && !(PixelPets.walk && PixelPets.walk.to));
  await page.waitForTimeout(120);
}
// Plays the open scene to its end; a choice takes the first label in `picks` that is offered. Lines are [speaker, text];
// a choice is ['>', label, [labels offered], prompt].
async function drive(page, picks = [], ms = 60000) {
  const until = Date.now() + ms, lines = [];
  let last = null;
  while (Date.now() < until) {
    const sc = await page.evaluate(() => PixelPets.scene && { mode: PixelPets.scene.mode, full: PixelPets.scene.full, waiting: PixelPets.scene.waiting, text: PixelPets.scene.text, who: PixelPets.scene.who });
    if (!sc) { await page.waitForTimeout(150); if (!(await page.evaluate(() => !!PixelPets.scene))) return lines; continue; }
    if (sc.mode === 'choice') {
      if (!sc.full || !(await page.locator('#sbChoices button:visible').count())) { await page.waitForTimeout(40); continue; }
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
      if (key !== last) { lines.push([sc.who || '', sc.text]); last = key; }
      await page.keyboard.press('Space'); await page.waitForTimeout(30); continue;
    }
    await page.waitForTimeout(40);
  }
  throw new Error('scene did not end: ' + JSON.stringify(lines.slice(-3)));
}
const says = lines => lines.filter(l => l[0] !== '>').map(l => l[1]);
// The holder's own walk from the stair head to the twelfth chair, on the runner (D1985: ten steps).
const TO_SEAT = ['right', 'right', 'down', 'down', 'down', 'down', 'down', 'right', 'right', 'right'];
async function walkToSeat(page) {
  await goto(page, 'hc_gov_2', 1, 3, 'down');
  for (const d of TO_SEAT) { if (await page.evaluate(() => !!PixelPets.scene)) break; await step(page, d); }
}
// Story keys that changed; the engine's own scene-beat and step marks are not this packet's writes.
const diff = (a, b) => Object.keys(Object.assign({}, a, b)).filter(k => !/^story\.beat\.|^story\.early_steps$/.test(k))
  .filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k])).sort();

test.describe('CABINET 1b C-T1: the lead-in, thr_cabinet_lead (§4.3, D1470)', () => {
  test('C-T1: not before the report-back; then Lumen in the lobby plays the four SIGNED lines once and sets only the rumour', async ({ page }) => {
    test.setTimeout(120000);
    await boot(page, Object.assign({}, A2, { 'story.km_reported': null }));
    await goto(page, 'hc_gov_1', 4, 5, 'up');
    expect(await present(page, 'cab_lumen_lobby')).toBe(false);
    // Lumen's own Act 2 talk at the Keeper House never plays it (CHIP_SECRECY ruling 5 moved to the seat)
    await goto(page, 'hm_hq_f2', 8, 5, 'up');
    expect(await page.evaluate(() => PixelPets.talkTo('hq_lumen'))).toBe(true);
    await drive(page);
    expect((await flags(page))['story.thr_chip_rumour']).toBeUndefined();
    // after the report-back
    await page.evaluate(() => PixelPets.setFlag('story.km_reported', true));
    await goto(page, 'hc_gov_1', 4, 5, 'up');
    expect(await present(page, 'cab_lumen_lobby')).toBe(true);
    expect(await quest(page)).toMatchObject({ id: 'cab_lead', target: { map: 'hc_gov_1', x: 4, y: 3 } });
    const before = await flags(page);
    expect(await page.evaluate(() => PixelPets.talkTo('cab_lumen_lobby'))).toBe(true);
    expect(await sceneId(page)).toBe('thr_cabinet_lead');   // ahead of the High Charity letter's lines (this save holds story.hc_invite)
    const lines = await drive(page);
    expect(lines).toEqual(LEAD.map(l => ['Captain Lumen', l]));
    const after = await flags(page);
    expect(diff(before, after)).toEqual(['story.thr_chip_rumour']);
    expect(after['story.thr_chip_rumour']).toBe(true);
    expect(await present(page, 'cab_lumen_lobby')).toBe(false);   // once
    expect(await quest(page)).toMatchObject({ id: 'cab_seat', target: { map: 'hc_gov_2', x: 6, y: 8 } });
    expect((await stored(page)).v).toBe(2);
  });

  test('C-T1: a Glimmer-side holder never meets the lead-in @w1', async ({ page }) => {
    await boot(page, Object.assign({}, A2, { 'story.side': 'glimmer' }));
    await goto(page, 'hc_gov_1', 4, 5, 'up');
    expect(await present(page, 'cab_lumen_lobby')).toBe(false);
    expect((await quest(page) || {}).id).not.toBe('cab_lead');
  });
});

test.describe('CABINET 1b C-T2: the stair to hc_gov_2 (§4.3, D1465 moved here)', () => {
  const cases = [
    { name: 'no rumour', f: A2, open: false },
    { name: 'no parade', f: Object.assign({}, SEAT, { 'story.hc_parade_seen': null }), open: false },
    { name: 'Glimmer side', f: Object.assign({}, SEAT, { 'story.side': 'glimmer' }), open: false },
    { name: 'rumour and parade', f: SEAT, open: true },
  ];
  for (const c of cases) {
    test(`C-T2: ${c.name}: the stair ${c.open ? 'opens' : 'denies'}`, async ({ page }) => {
      await boot(page, c.f);
      await goto(page, 'hc_gov_1', 2, 2, 'down');
      expect(await page.evaluate(() => PixelPets.talkTo('hc_gov_keeper_b'))).toBe(true);
      expect(says(await drive(page))[0] === 'Go on up, holder.').toBe(c.open);
      await goto(page, 'hc_gov_1', 2, 2, 'left');
      await page.evaluate(() => PixelPets.walkStep('left'));
      if (c.open) {
        await expect.poll(() => where(page)).toEqual({ map: 'hc_gov_2', x: 1, y: 3 });
      } else {
        await expect.poll(() => sceneId(page).then(s => s !== null || null)).toBe(true);
        expect(says(await drive(page))).toEqual(['Cabinet in session. Members only.']);
        expect(await where(page)).toEqual({ map: 'hc_gov_1', x: 2, y: 2 });
      }
    });
  }

  test('C-T2: an Act 5 save from before the cabinet climbs through floor 2 to the President; floor 3 comes back down to floor 2', async ({ page }) => {
    await boot(page, Object.assign({}, A2, { 'story.km_reported': null, 'story.act': 5 }));
    await goto(page, 'hc_gov_1', 2, 2, 'left');
    await page.evaluate(() => PixelPets.walkStep('left'));
    await expect.poll(() => where(page)).toEqual({ map: 'hc_gov_2', x: 1, y: 3 });
    await goto(page, 'hc_gov_2', 1, 9, 'down');
    await page.evaluate(() => PixelPets.walkStep('down'));
    await expect.poll(() => where(page)).toMatchObject({ map: 'hc_gov_3' });
    await goto(page, 'hc_gov_3', 2, 12, 'left');
    await page.evaluate(() => PixelPets.walkStep('left'));
    await expect.poll(() => where(page)).toEqual({ map: 'hc_gov_2', x: 1, y: 9 });
  });

  test('C-T2: in Act 2 the stair up from floor 2 stays shut and says nothing @w1', async ({ page }) => {
    await boot(page, SEAT);
    await goto(page, 'hc_gov_2', 1, 9, 'down');
    await page.evaluate(() => PixelPets.walkStep('down'));
    await page.waitForTimeout(600);
    expect(await where(page)).toEqual({ map: 'hc_gov_2', x: 1, y: 9 });
    expect(await sceneId(page)).toBeNull();
  });
});

test.describe('CABINET 1b C-T3: S1 at the twelfth chair (§4.5 v0.1, settled), behind K2a\'s flag', () => {
  test('C-T3: before K2a the room is empty, S1 does not play, the board reads 6 OF 7; the plate tap', async ({ page }) => {
    await boot(page, SEAT);
    await walkToSeat(page);
    expect(await where(page)).toEqual({ map: 'hc_gov_2', x: 6, y: 8 });
    expect(await sceneId(page)).toBeNull();
    for (const id of ['cab_governor', 'cab_lumen', 'cab_president']) expect(await present(page, id), id).toBe(false);
    expect(await present(page, 'cab_board_6')).toBe(true);
    expect(await present(page, 'cab_board_7')).toBe(false);
    expect(await page.evaluate(() => PixelPets.talkTo('cab_table_13'))).toBe(true);
    expect(says(await drive(page))).toEqual(['A brass plate: FOR A HOLDER OF THE ROLL.']);
    expect(await page.evaluate(() => PixelPets.talkTo('cab_board_6'))).toBe(true);
    expect(says(await drive(page))).toEqual(['KILNMOUTH: 6 OF 7']);
  });

  test('C-T3: three names (km_names 3), the Bathkeeper: ten steps to the chair; flags, the President\'s line, 7 OF 7; reduced motion', async ({ page }) => {
    test.setTimeout(120000);
    await boot(page, K2A, { reduce: true });
    await goto(page, 'hc_gov_2', 1, 3, 'down');
    for (const id of ['cab_governor', 'cab_lumen', 'cab_president']) expect(await present(page, id), id).toBe(true);
    const before = await flags(page);
    let n = 0;
    for (const d of TO_SEAT) { if (await page.evaluate(() => !!PixelPets.scene)) break; await step(page, d); n++; }
    expect(n).toBe(10);
    await expect.poll(() => sceneId(page)).toBe('cab_s1');
    const lines = await drive(page, ['The Bathkeeper']);
    const ch = lines.find(l => l[0] === '>');
    expect(ch[2]).toEqual(['The Bathkeeper', "The Commander's pick", 'The works foreman']);
    expect(ch[3]).toBe(ASK);
    expect(lines.filter(l => l[0] !== '>')).toEqual([['The President', PICKS.town[1]], [GM, CONFIRM]]);
    const after = await flags(page);
    expect(diff(before, after)).toEqual(['story.cab_seat', 'story.km_seat_filled', 'story.km_seat_pick']);
    expect([after['story.cab_seat'], after['story.km_seat_pick'], after['story.km_seat_filled']]).toEqual([true, 'town', true]);
    await goto(page, 'hc_gov_2', 1, 3, 'down');
    for (const id of ['cab_governor', 'cab_lumen', 'cab_president']) expect(await present(page, id), id).toBe(false);
    expect(await present(page, 'cab_board_7')).toBe(true);
    expect(await present(page, 'cab_board_6')).toBe(false);
    expect((await quest(page) || {}).id).not.toBe('cab_seat');
    expect((await stored(page)).v).toBe(2);
  });

  for (const pick of ['commander', 'company']) {
    test(`C-T3: two names (km_names 2): "Not yet" writes nothing and replays; then ${pick}`, async ({ page }) => {
      test.setTimeout(120000);
      await boot(page, Object.assign({}, K2A, { 'story.km_names': 2 }));
      await walkToSeat(page);
      await expect.poll(() => sceneId(page)).toBe('cab_s1');
      const before = await flags(page);
      let lines = await drive(page, ['Not yet']);
      expect(lines.find(l => l[0] === '>')[2]).toEqual(["The Commander's pick", 'The works foreman', 'Not yet']);
      expect(says(lines)).toEqual(['Then go back and listen. The matter waits for you.']);
      expect(diff(before, await flags(page))).toEqual([]);
      await step(page, 'down'); await step(page, 'up');   // off the chair and back: the sitting replays
      await expect.poll(() => sceneId(page)).toBe('cab_s1');
      lines = await drive(page, [PICKS[pick][0]]);
      expect(says(lines)).toEqual([PICKS[pick][1], CONFIRM]);
      const f = await flags(page);
      expect([f['story.cab_seat'], f['story.km_seat_pick'], f['story.km_seat_filled']]).toEqual([true, pick, true]);
      await step(page, 'down'); await step(page, 'up');
      await page.waitForTimeout(400);
      expect(await sceneId(page)).toBeNull();   // once
    });
  }
});

test.describe('CABINET 1b C-T7 (1b parts): data, limits, old saves, debug places', () => {
  test('C-T7: lines and labels in limits; no @glimmer variant; only the stated flags; the room as approved (14x12)', async () => {
    const SC = HC.scenes;
    expect(SC.thr_cabinet_lead.filter(s => s[0] === 'say').map(s => s[2]).map(t => t.replace('{name}', 'Tester'))).toEqual(LEAD);
    expect(Object.keys(SC).filter(k => /^(cab_|thr_cabinet)/.test(k) && /glim/.test(k))).toEqual([]);
    const walk = (steps, out) => { for (const s of steps || []) if (Array.isArray(s)) {
      if (s[0] === 'say') { expect(s[2].length).toBeLessThanOrEqual(110); out.push(s); }
      if (s[0] === 'setFlag') out.push(s);
      if (s[0] === 'choice') { expect(s[1].length).toBeLessThanOrEqual(110); for (const o of s[2]) { expect(o[0].length).toBeLessThanOrEqual(30); walk(o[1], out); } }
    } return out; };
    const set = new Set(walk(SC.cab_s1, []).concat(walk(SC.thr_cabinet_lead, [])).filter(s => s[0] === 'setFlag').map(s => s[1]));
    expect([...set].sort()).toEqual(['story.cab_seat', 'story.km_seat_filled', 'story.km_seat_pick', 'story.thr_chip_rumour']);
    expect([ROOM.w, ROOM.h]).toEqual([14, 12]);
    expect(ROOM.skin).toBe('hc_gov_2');
    expect(ROOM.wall).toEqual({ windows: [10, 12] });
    const up = GOV1.objs.find(o => o.id === 'hc_gov_up');
    expect(up.to).toBe('hc_gov_2');
    expect(up.deny).toBe('Cabinet in session. Members only.');
    // the tells as drawn: seat 4 is the newer chair; the Treasury's folder is on table slice 2 (seat 3's place)
    expect(ROOM.objs.find(o => o.id === 'cab_chair_4').sprite).toBe('cab_chair_r_new');
    expect(ROOM.objs.find(o => o.id === 'cab_table_2').sprite).toBe('cab_table_2');
    for (const o of ROOM.objs) for (const t of [o.text, ...Object.values(o.lines || {})]) if (t) expect(t.length, o.id).toBeLessThanOrEqual(110);
  });

  test('C-T7: an old Act 2 save from before the cabinet loads unchanged; the art and the third floor tile are installed @w1', async ({ page }) => {
    await boot(page, Object.assign({}, A2, { 'story.km_reported': null }));
    const raw = save(Object.assign({}, A2, { 'story.km_reported': null })).flags;
    const now = await flags(page);
    for (const [k, v] of Object.entries(raw)) expect(now[k], k).toEqual(v);
    for (const k of Object.keys(now)) expect(/^story\.(cab_|km_seat|thr_chip)/.test(k), k).toBe(false);
    await goto(page, 'hc_gov_2', 1, 3, 'down');
    const art = await page.evaluate(() => {
      const sk = SKINS.hc_gov_2;
      return { variants: sk.variants.floor_keep.map(v => v[0]), rug: sk.remap['='], runnerWalk: ['=', '-', '+', '*'].map(c => sk.walk[c]),
               seat12: PixelPets.tileInfo(6, 8).walk };
    });
    expect(art).toEqual({ variants: ['floor_keep_b', 'floor_keep_c', 'floor_keep_d'], rug: 'rug_civic_v', runnerWalk: [1, 1, 1, 1], seat12: true });
  });

  test('C-T7: the cabinet debug places are there only with ?debug=1 @w1', async ({ page }) => {
    await installSave(page.context(), save(A2), { quietDay: true });
    await gotoGame(page, '?hccity=2');
    await page.waitForFunction(() => window.PixelPets && PixelPets.state);
    expect(await page.evaluate(() => PixelPets.debug === true)).toBe(false);
    expect(await page.evaluate(() => typeof DEBUG_EXTRAS === 'undefined' || !DEBUG_EXTRAS.hc2_cab_room)).toBe(true);
  });
});
