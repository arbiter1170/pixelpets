/* CABINET_AND_COUNCILS v0.2.2 (design repo, private), phase 1a: Kilnmouth's empty seat, as folded into the cabinet build after
   #318 (KILNMOUTH) built the town and K1-K5. This file covers what 1a adds: K6, the report-back to Governor Merriden
   (tools/build_hc_city.py, the ?debug=1&hccity=2 city preview); K7, the council sits (data/detail_zzzzz_kilnmouth.json); the sway
   and the hold it settles (§3.6); the Act 3 switch on a settled town; R4, Ilse's letter through a Lantern House Host; and the
   repeat lines (CABINET_LINES, settled by Vincent Wed Nov 4, 2026). K1-K4 (the Reeve, the asks, the pitches, the permit) are
   #318's and stay in tests/kilnmouth.spec.js. §7 K-T4 to K-T7 (K-T8 is PT2, phase 2). Runs at 320, 375 and 390 (@w1 rows at 320
   only); reduced motion on by default (one run with motion); zero console errors; the save stays pixelpets.save.v2, v 2. */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const ROOT = path.join(__dirname, '..');
const KM = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'detail_zzzzz_kilnmouth.json'), 'utf8'));
const HC = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'hc_city_v2.json'), 'utf8'));
const GM = 'Governor Merriden', RA = 'Reeve Agna', ILSE = 'Warden Ilse';
const K6 = ["In default of the council? I stamped that. It was in order. It was also a tie.",
  'Two names were on my desk before you left. One came down from upstairs.',
  'A seat is confirmed at the cabinet, Cadet, not in an office. Bring the name to the table.'];
const K7 = { open: "Seven chairs. Seven hands. First matter: the tower's lease.", ended: 'Four to three. The lease ends at term. The tower goes quiet.',
  renewed: 'Four to three. The lease stands.', contract: 'And a works contract. The bathhouse will be heated by machine.',
  kiln: "Second matter: fuel for the Hall's kiln. Seven to none. Light it." };
const HOLD = { keepers: 'Kilnmouth sits its own seat. The Keepers walk its lanes.', glimmer: "Glimmerwell holds the town. The water's warm again.",
  split: 'Kilnmouth sits its seat. Both sides wait at the springs.' };
const R4 = { open: "Ilse's letter asks one thing: what did you see? Nothing else.",
  town: 'You write it plain: the cold springs, the tower\'s paper, the words "in default". The bathhouse knows.',
  warden: 'You write it plain: the cold springs, the tower\'s paper, the words "in default". Only she knows.',
  seat: { town: "And the seventh chair: the Bathkeeper. The town's own name.", commander: "And the seventh chair: Edwin Garth, with a Commander's letter.",
          company: 'And the seventh chair: Foreman Dray. His name came down from upstairs.' },
  answer: "A permit in default of a council. I'll write it down. Watch who signs the next one.",
  chair: 'A chair at his table. Sit in it. Remember whose Cadet you are.', kept: 'You fold the letter with half of it left out.',
  host: "A letter for you, sealed with the Warden's lantern. She wants one back." };

// Act 1 done and Ep 1 closed, a plain Keeper Cadet, posted and met (as tests/route_to_governor.spec.js seeds it).
const ACT1 = {
  'story.reached_route1': true, 'story.rival1_done': true, 'story.reached_fernbrook': true, 'story.met_glimmerwell': true,
  'story.met_fen': true, 'story.crate_a': true, 'story.crate_b': true, 'story.crate_c': true, 'story.tally_done': true,
  'story.tl_amos': true, 'story.tl_juniper': true, 'story.tl_done': true, 'story.crates_seen': true, 'story.fen_sent_home': true,
  'story.mom_met': true, 'story.mom_chore': true, 'story.mom_sent': true, 'story.reached_mahopac': true, 'story.dream_woke': true,
  'story.class_sent': true, 'story.lizzy_met': true, 'story.lizzy_class': true, 'trainer.h1_cadet': true,
  'trainer.h1_challenger': true, 'trainer.h1_local': true, 'trainer.hall1_fen': true, 'story.seal1': true,
  'story.crackdown': true, 'story.hall1_shut': true, 'story.post_trial_done': true, 'story.fen_lean': 2, 'story.phone_got': true,
  'story.warden_called': true, 'story.warden_met': true, 'story.chi_met': true, 'story.chi_jars': 6, 'story.reached_route2': true,
  'story.met_census': true, 'story.reached_glen': true, 'story.shift_k': true, 'story.met_lead': true,
  'story.chi_done': true, 'story.orchard_lean': 'open', 'story.orchard_cleared': true, 'story.sway_fernbrook': 3,
  'story.ilse_call2': true, 'story.keeper_cadet': true, 'story.side_pick_done': true, 'story.ilse_call_old': true,
  'story.tour1_s1': true, 'story.slice_end': true, 'story.heights_done': true, 'story.seal2': true, 'story.cobble_end': true,
  'story.rpt_1': 'told', 'story.gb_done': true, 'story.rpt_2': 'kept', 'story.route3_open': true, 'story.reached_brinewick': true,
  'story.brine_depot': true, 'story.brine_freed': true, 'story.brine_dorian': true, 'story.seal3': true, 'story.ep1_end': true,
  'story.cover_done': true, 'story.rpt_old_seen': true, 'story.rpt_3': 'kept', 'story.hc_council_done': true, 'story.hc_arrived': true, 'story.hc_greeted': true,
};
const POSTED = Object.assign({}, ACT1, { 'story.a2_called': true, 'story.gov_posted': true, 'story.cv_mom': 'told', 'story.cv_mom_walk': true,
  'story.reached_route4': true, 'story.r4_fork': true, 'story.r4_walked': true, 'story.r4_adder_met': true, 'story.r4_heron_met': true });
const MET = Object.assign({}, POSTED, { 'story.hc_gov_met': true, 'story.km_assigned': true });
const IN_TOWN = Object.assign({}, MET, { 'story.reached_kilnmouth': true });
const ARRIVED = Object.assign({}, IN_TOWN, { 'story.km_arrived': true });
const STORMED = Object.assign({}, ARRIVED, { 'story.km_storm': true });
const CURFEW = Object.assign({}, STORMED, { 'story.km_crew': true, 'story.km_permit_seen': true, 'story.km_twin_lead': true, 'story.km_seat_filled': true });
const SEATED = Object.assign({}, CURFEW, { 'story.act': 2, 'story.cab_seat': true, 'story.km_names': 3, 'story.reached_brightgate': true });

function save(flags, world) {
  const s = starterSave();
  s.settings.controls = 'modern'; s.settings.textSpeed = 'fast'; s.settings.follower = false; s.settings.tips = false;
  Object.assign(s.flags, flags || {});
  for (const [k, v] of Object.entries(s.flags)) if (v === null) delete s.flags[k];
  s.world = Object.assign({ map: 'kilnmouth', x: 27, y: 37, facing: 'up', respawn: 'hearthmoor' }, world || {});
  s.seals = { seal_fernbrook: 1700000000000, seal_cobblecrest: 1700000000000, seal_brinewick: 1700000000000 };
  s.party[0].xp = 4000; s.party[0].bx = 4 * 28 * 28;
  return s;
}
async function boot(page, flags, opts = {}) {
  test.setTimeout(opts.long || 120000);
  await page.emulateMedia({ reducedMotion: opts.motion ? 'no-preference' : 'reduce' });
  await installSave(page.context(), save(flags), { quietDay: true });
  await gotoGame(page, opts.city ? '?debug=1&hccity=2' : '?debug=1');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && typeof PixelPets.talkTo === 'function' && PixelPets.state);
  await page.evaluate(() => { PixelPets.showTab('walk'); if (PixelPets.clearWild) PixelPets.clearWild(); });
}
const flags = page => page.evaluate(() => Object.assign({}, PixelPets.state.flags));
const stored = page => page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
const sceneId = page => page.evaluate(() => PixelPets.scene && PixelPets.scene.id);
const quest = page => page.evaluate(() => { const q = PixelPets.quest; return q && { id: q.id, text: q.text, place: q.place, target: q.target || null }; });
async function goto(page, map, x, y, facing) {
  await page.evaluate(([m, x, y, f]) => PixelPets.goto(m, x, y, f), [map, x, y, facing || 'down']);
  await page.waitForFunction(m => PixelPets.mapInfo.id === m && !PixelPets.fading, map);
  await page.evaluate(() => PixelPets.clearWild());
}
async function setFlags(page, f) {
  await page.evaluate(f => { for (const [k, v] of Object.entries(f)) { if (v === null) delete PixelPets.state.flags[k]; else PixelPets.state.flags[k] = v; } }, f);
}
// Plays the open scene to its end; battles started by the scene are won by the debug hook. Returns [speaker, text] lines.
async function drive(page, picks = [], ms = 60000) {
  const until = Date.now() + ms, lines = [];
  let last = null;
  while (Date.now() < until) {
    const st = await page.evaluate(() => ({ battle: !!(PixelPets.battle && PixelPets.battle.on), sc: PixelPets.scene && { mode: PixelPets.scene.mode, full: PixelPets.scene.full, waiting: PixelPets.scene.waiting, text: PixelPets.scene.text, who: PixelPets.scene.who } }));
    if (st.battle) {
      const state = await page.evaluate(() => { const b = PixelPets.battle; b.textMs = 1; b.animMs = 0; return b.state; });
      if (state === 'CHOOSE') { await page.evaluate(() => PixelPets.winBattle()); await page.waitForFunction(() => !PixelPets.battle.on || PixelPets.battle.state === 'END', null, { timeout: 15000 }); }
      if (await page.evaluate(() => PixelPets.battle.on && PixelPets.battle.state === 'END')) await page.evaluate(() => { const b = document.querySelector('#btOk'); if (b) b.click(); });
      await page.waitForTimeout(150); continue;
    }
    const sc = st.sc;
    if (!sc) { await page.waitForTimeout(200); if (!(await page.evaluate(() => !!PixelPets.scene || !!(PixelPets.battle && PixelPets.battle.on)))) return lines; continue; }
    if (sc.mode === 'choice') {
      if (!sc.full || !(await page.locator('#sbChoices button:visible').count())) { await page.waitForTimeout(40); continue; }
      await page.waitForFunction(() => PixelPets.optionsReady === true);
      const labels = (await page.locator('#sbChoices button').allTextContents()).map(t => t.trim());
      const pick = picks.find(p => labels.includes(p)) || labels[0];
      lines.push(['>', pick, labels]);
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
  throw new Error('scene did not end');
}
const says = lines => lines.filter(l => l[0] !== '>').map(l => l[1]);
async function talk(page, id, picks) { expect(await page.evaluate(i => PixelPets.talkTo(i), id), 'talk ' + id).toBe(true); return drive(page, picks); }
// Story keys a beat wrote; the engine's own scene-beat, step and unlock-tip marks are not this packet's writes.
const diff = (a, b) => Object.keys(Object.assign({}, a, b)).filter(k => !/^story\.beat\.|^story\.early_steps$|^story\.unlock_/.test(k))
  .filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k])).sort();
const holdLine = page => page.evaluate(() => PPKm.holdLine('kilnmouth'));

test.describe('CABINET 1a K-T4: the report-back, K6 (§3.5)', () => {
  test('K-T4: his old repeat before the permit; after it K6 plays once, sets only story.km_reported and opens the lead-in; the chain follows', async ({ page }) => {
    await boot(page, Object.assign({}, MET, { 'story.act': 2, 'story.hc_parade_seen': true }), { city: true });
    await goto(page, 'hc_gov_1', 12, 5, 'up');
    expect(says(await talk(page, 'hc_governor'))).toEqual(["Kilnmouth's springs, and the empty seat. Come back when you know more."]);
    await setFlags(page, { 'story.km_arrived': true, 'story.km_storm': true, 'story.km_crew': true, 'story.km_permit_seen': true, 'story.km_permit_to': 'town' });
    expect((await quest(page)).id).toBe('a2_hold');   // Brightgate (B5) comes first in the beat order
    await setFlags(page, { 'story.reached_brightgate': true });
    expect(await quest(page)).toMatchObject({ id: 'km_report', target: { map: 'hc_gov_1', x: 12, y: 3 } });
    const before = await flags(page);
    expect(await page.evaluate(() => PixelPets.talkTo('hc_governor'))).toBe(true);
    expect(await sceneId(page)).toBe('km_report');
    const lines = await drive(page);
    expect(lines).toEqual(K6.map(l => [GM, l]));
    expect(diff(before, await flags(page))).toEqual(['story.km_reported']);
    expect(says(await talk(page, 'hc_governor'))).toEqual(["Kilnmouth's springs, and the empty seat. Come back when you know more."]);   // once
    expect((await quest(page)).id).toBe('cab_lead');
    await goto(page, 'hc_gov_1', 4, 5, 'up');
    expect(await page.evaluate(() => !!(PixelPets.objPos('cab_lumen_lobby') || {}).present)).toBe(true);
    expect((await stored(page)).v).toBe(2);
  });
});

test.describe('CABINET 1a K-T5: the council sits, K7 (§3.5, §3.6)', () => {
  // seat pick x the K4 answer: K7's lines, its flags, the settled sway and the hold (+2 / +1 / -2, and +1 for telling the bathhouse)
  const CASES = [['town', 'town', 3, 'keepers'], ['town', 'warden', 2, 'keepers'], ['commander', 'town', 2, 'keepers'],
                 ['commander', 'warden', 1, 'split'], ['company', 'town', -1, 'split'], ['company', 'warden', -2, 'glimmer']];
  test('K-T5: each pick and K4 answer: the lines, lease, springs, the lit kiln, the settled sway and hold; once; the repeat; the chain moves on', async ({ page }) => {
    test.setTimeout(240000);
    await boot(page, SEATED);
    for (const [pick, to, sway, hold] of CASES) {
      const tag = pick + '/' + to;
      await setFlags(page, { 'story.km_seat_pick': pick, 'story.km_permit_to': to, 'story.sway_kilnmouth': to === 'town' ? 1 : null,
        'story.km_council': null, 'story.km_settled': null, 'story.km_lease': null, 'story.km_springs': null, 'story.km_hall_lit': null });
      await goto(page, 'km_council_in', 11, 5, 'up');
      expect((await quest(page)).id, tag).toBe('km_council');
      expect(await holdLine(page), tag).toBe('Both sides keep a claim.');   // rule 4: split until the council settles it (#318's line)
      const before = await flags(page);
      expect(await page.evaluate(() => PixelPets.talkTo('km_reeve'))).toBe(true);
      expect(await sceneId(page), tag).toBe('km_k7');
      const lines = await drive(page);
      const mid = pick === 'town' ? [K7.ended] : pick === 'company' ? [K7.renewed, K7.contract] : [K7.renewed];
      expect(lines, tag).toEqual([K7.open, ...mid, K7.kiln].map(l => [RA, l]));
      const f = await flags(page);
      expect(diff(before, f), tag).toEqual(['story.km_council', 'story.km_hall_lit', 'story.km_lease', 'story.km_settled', 'story.km_springs', 'story.sway_kilnmouth']);
      expect([f['story.km_lease'], f['story.km_springs'], f['story.sway_kilnmouth']], tag).toEqual([pick === 'town' ? 'ended' : 'renewed', pick === 'town' ? 'warm' : 'cold', sway]);
      expect(await holdLine(page), tag).toBe(HOLD[hold]);
      expect(says(await talk(page, 'km_reeve')), tag).toEqual(['Seven hands. It feels like a town.']);   // once, then the repeat
      expect((await quest(page) || {}).id, tag).not.toBe('km_council');
    }
    expect((await stored(page)).v).toBe(2);
  });

  test('K-T5: after K7: the Hall door opens, the coach runs; the Commander\'s plaza line; the company\'s pipe in the bathhouse @w1', async ({ page }) => {
    const door = KM.maps.kilnmouth.objs.find(o => o.id === 'km_hall5');
    expect([door.need, door.deny]).toEqual(['story.km_hall_lit', "The kiln's cold. No fuel vote, no fire."]);   // K8 (#318)
    await boot(page, Object.assign({}, SEATED, { 'story.km_seat_pick': 'commander', 'story.km_council': true, 'story.km_settled': true,
      'story.km_lease': 'renewed', 'story.km_springs': 'cold', 'story.km_hall_lit': true, 'story.sway_kilnmouth': 2 }));
    await goto(page, 'kilnmouth', 21, 31, 'up');
    expect(says(await talk(page, 'km_kid'))).toEqual(["The new councillor salutes the Keepers. The town doesn't."]);
    await goto(page, 'km_bath_in', 13, 4, 'up');
    expect(says(await talk(page, 'km_notches'))).toEqual(['Notches in red paint, each one dated in a neat hand. The newest is the lowest.']);
    await setFlags(page, { 'story.km_seat_pick': 'company', 'story.sway_kilnmouth': -2 });
    await goto(page, 'km_bath_in', 13, 4, 'up');
    expect(says(await talk(page, 'km_notches'))).toEqual(["The pipe hums and the water's warm. Outside, the springs are still cold."]);
  });

  test('K-T5: K7 waits for the seat: before S1 the Reeve repeats, and an interrupted sitting writes nothing @w1', async ({ page }) => {
    await boot(page, Object.assign({}, STORMED, { 'story.km_permit_seen': true, 'story.act': 2 }));
    await goto(page, 'km_council_in', 11, 5, 'up');
    expect(says(await talk(page, 'km_reeve'))).toEqual(['Six hands. Still six. Ask around.']);
    expect((await flags(page))['story.km_council']).toBeUndefined();
    const sc = KM.scenes.km_k7, last = sc.slice(-3);
    expect(last).toEqual([['setFlag', 'story.km_hall_lit', true], ['setFlag', 'story.km_council', true], ['setFlag', 'story.km_settled', true]]);
    expect(sc.findIndex(s => s[0] === 'setFlag' || s[0] === 'inc' || (s[0] === 'if' && JSON.stringify(s).includes('setFlag')))).toBeGreaterThan(sc.findIndex(s => s[0] === 'say' && s[2] === K7.kiln));
  });
});

test.describe('CABINET 1a K-T6: the Act 3 switch on a settled town (§3.6, D1559)', () => {
  test('K-T6: a switch drops story.sway_kilnmouth by 2 (a Keepers town at 2 falls to split); the town\'s ended lease stays', async ({ page }) => {
    await boot(page, Object.assign({}, SEATED, { 'story.act': 3, 'story.km_seat_pick': 'town', 'story.km_permit_to': 'warden', 'story.km_council': true,
      'story.km_settled': true, 'story.km_lease': 'ended', 'story.km_springs': 'warm', 'story.km_hall_lit': true, 'story.sway_kilnmouth': 2, 'story.rpt_4': 'told' }));
    await goto(page, 'kilnmouth', 27, 37, 'up');
    expect(await holdLine(page)).toBe(HOLD.keepers);
    expect(await page.evaluate(() => PixelPets.switchSide('glimmer', true))).toBe(true);
    const f = await flags(page);
    expect([f['story.sway_kilnmouth'], f['story.km_lease'], f['story.km_springs'], f['story.switched_a3']]).toEqual([0, 'ended', 'warm', true]);
    expect(await holdLine(page)).toBe(HOLD.split);
  });
});

test.describe('CABINET 1a K-T7: R4, Ilse\'s letter (§3.5; D1512 shape, D1725 key)', () => {
  test('K-T7: told: the Host hands it over after the council; the told lines follow the K4 answer and the seat; Ilse answers; once', async ({ page }) => {
    await boot(page, Object.assign({}, SEATED, { 'story.km_seat_pick': 'commander', 'story.km_permit_to': 'town', 'story.km_council': true, 'story.km_settled': true,
      'story.km_lease': 'renewed', 'story.km_springs': 'cold', 'story.km_hall_lit': true, 'story.sway_kilnmouth': 2 }), { motion: true });
    await goto(page, 'km_lantern_in', 5, 8, 'up');
    const before = await flags(page);
    const lines = await talk(page, 'km_lantern_host', ['Tell her all of it']);
    expect(lines.filter(l => l[0] !== '>')).toEqual([['Lantern Host', R4.host], ['', R4.open], ['', R4.town], ['', R4.seat.commander], [ILSE, R4.answer], [ILSE, R4.chair]]);
    expect(lines.find(l => l[0] === '>')[2]).toEqual(['Tell her all of it', 'Keep some back']);
    expect(diff(before, await flags(page))).toEqual(['story.rpt_4']);
    expect((await flags(page))['story.rpt_4']).toBe('told');
    const again = await talk(page, 'km_lantern_host', ['Leave', 'Not now']);
    expect(again.some(l => l[1] === R4.host)).toBe(false);
    expect((await stored(page)).v).toBe(2);
  });

  for (const [pick, to] of [['town', 'warden'], ['company', 'town']]) {
    test(`K-T7: told for ${pick} / ${to}, and kept @w1`, async ({ page }) => {
      await boot(page, Object.assign({}, SEATED, { 'story.km_seat_pick': pick, 'story.km_permit_to': to, 'story.km_council': true, 'story.km_settled': true }));
      await goto(page, 'km_lantern_in', 5, 8, 'up');
      let lines = await talk(page, 'km_lantern_host', ['Tell her all of it']);
      expect(says(lines).slice(2, 4)).toEqual([R4[to], R4.seat[pick]]);
      await setFlags(page, { 'story.rpt_4': null });
      lines = await talk(page, 'km_lantern_host', ['Keep some back']);
      expect(says(lines)).toEqual([R4.host, R4.open, R4.kept, R4.chair]);
      expect((await flags(page))['story.rpt_4']).toBe('kept');
    });
  }

  test('K-T7: no letter before the council, after an Act 3 switch, or after the loyalist\'s choice @w1', async ({ page }) => {
    await boot(page, Object.assign({}, SEATED, { 'story.km_seat_pick': 'town', 'story.km_permit_to': 'town' }));
    await goto(page, 'km_lantern_in', 5, 8, 'up');
    for (const extra of [{}, { 'story.km_council': true, 'story.switched_a3': true }, { 'story.km_council': true, 'story.switched_a3': null, 'story.warden_cut': true }]) {
      await setFlags(page, extra);
      const lines = await talk(page, 'km_lantern_host', ['Leave', 'Not now']);
      expect(lines.some(l => l[1] === R4.host), JSON.stringify(extra)).toBe(false);
      expect((await flags(page))['story.rpt_4']).toBeUndefined();
    }
  });
});

test.describe('CABINET 1a: words and data (CABINET_LINES §2, settled)', () => {
  test('lines: K6, K7, R4 and the repeats as CABINET_LINES has them; limits; flags on the chain or NOT_STEPS @w1', async () => {
    const L = (map, id) => KM.maps[map].objs.find(o => o.id === id).lines;
    expect(L('km_council_in', 'km_reeve')).toMatchObject({ 'story.km_seat_filled & !story.km_council': '@km_k7', 'story.km_council': 'Seven hands. It feels like a town.',
      'story.km_arrived': 'Six hands. Still six. Ask around.' });
    expect(L('kilnmouth', 'km_ask_yard')['story.km_ask_yard']).toBe('The springs. Ask who keeps them.');
    expect(L('kilnmouth', 'km_ask_market')['story.km_ask_market']).toBe('Never asked a thing back. Not once.');
    expect(L('kilnmouth', 'km_ask_springs')['story.km_ask_springs']).toBe('No vote after dark. So no vote.');
    expect(L('kilnmouth', 'km_dray')['story.km_pitch_f']).toBe("Warm by spring. You'll see.");
    expect(L('kilnmouth', 'km_garth')['story.km_pitch_c']).toBe('Order first. The water can wait.');
    const gov = HC.rooms.hc_gov_1.objs.find(o => o.id === 'hc_governor');
    expect(gov.lines['story.km_permit_seen & !story.km_reported']).toBe('@km_report');
    expect(HC.scenes.km_report.filter(s => s[0] === 'say').map(s => s[2])).toEqual(K6);
    const repeats = ['Six hands. Still six. Ask around.', 'The springs. Ask who keeps them.', 'Never asked a thing back. Not once.', 'No vote after dark. So no vote.',
      "Warm by spring. You'll see.", 'Order first. The water can wait.', 'Seven hands. It feels like a town.'];
    for (const r of repeats) expect(r.length, r).toBeLessThanOrEqual(40);
    const walk = (steps, out) => { for (const s of steps || []) if (Array.isArray(s)) {
      if (s[0] === 'say') { expect(s[2].length, s[2]).toBeLessThanOrEqual(110); expect(s[2]).not.toMatch(/\b(fainted|evolv\w*|coins?|appeared|trainer)\b/i); }
      if (s[0] === 'setFlag' || s[0] === 'inc') out.add(s[1]);
      if (s[0] === 'if') { walk(s[2], out); walk(s[3], out); }
      if (s[0] === 'choice') for (const o of s[2]) { expect(o[0].length).toBeLessThanOrEqual(30); walk(o[1], out); }
    } return out; };
    const set = walk(KM.scenes.km_k7, new Set()); walk(KM.scenes.rpt_4, set); walk(HC.scenes.km_report, set);
    expect([...set].sort()).toEqual(['story.km_council', 'story.km_hall_lit', 'story.km_lease', 'story.km_reported', 'story.km_settled', 'story.km_springs', 'story.rpt_4', 'story.sway_kilnmouth']);
    const note = KM.hostNotes.find(n => n.scene === 'rpt_4');
    expect(note.when).toEqual(['story.keeper_cadet', 'story.km_council', '!story.rpt_4', '!story.switched_a3 & !story.warden_cut']);
  });
});
