/* DAY1_TRIAL1_FLOW §5 and §7 (Vincent, Nov 2, 2026; D1169, D1171, D1172 no, D1175; R10: the simplest save-safe reading).
   Every save kind of FACTION_PICK_TIMING §7.4 (tests/fixtures/or_gate_kinds.js) plus this flow's own kinds: where the chain
   resumes, the Hall door (story.lizzy_class | story.orchard_cleared | story.seal1), its keyed deny line, the pick trigger,
   Tobin (tally before the pick, battle after), Fen's two bodies, Fernbrook's hold, the contested signs and the town board.
   Then the no-save-change proof: on a CLEAN build the save key is byte-identical after load; v stays 2. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');
const K = require('./fixtures/or_gate_kinds');

trackErrors(test, expect);

const FLOW = { 'story.crate_a': true, 'story.crate_b': true, 'story.crate_c': true, 'story.tally_done': true, 'story.tl_amos': true, 'story.tl_juniper': true, 'story.tl_done': true };
const KINDS = Object.assign({}, K.KINDS, {
  a1_after_heights: { flags: { ...K.KINDS.a1.flags, 'story.heights_done': true }, seals: {} },
  mahopac_done: { flags: { ...K.KINDS.p.flags, 'story.dream_woke': true, 'story.dream_study': true }, seals: {} },
  lizzy_opening_only: { flags: { ...K.KINDS.p.flags, 'story.lizzy_wake': true }, seals: {} },
  day1_done: { flags: { ...K.KINDS.p.flags, ...FLOW, 'story.crates_seen': true }, seals: {} },
  fen_away: { flags: { ...K.KINDS.p.flags, ...FLOW, 'story.crates_seen': true, 'story.fen_sent_home': true }, seals: {} },
  class_done: { flags: { ...K.KINDS.p.flags, ...FLOW, 'story.crates_seen': true, 'story.fen_sent_home': true, 'story.dream_woke': true, 'story.class_sent': true, 'story.lizzy_met': true, 'story.lizzy_class': true }, seals: {} },
  seal_new: { flags: { ...K.KINDS.p.flags, ...FLOW, 'story.crates_seen': true, 'story.fen_sent_home': true, 'story.dream_woke': true, 'story.class_sent': true, 'story.lizzy_met': true, 'story.lizzy_class': true, 'story.seal1': true, 'story.post_trial_done': true, 'trainer.h1_cadet': true, 'trainer.h1_challenger': true, 'trainer.h1_local': true }, seals: { seal_fernbrook: true } },
});
// kind -> what this build reads. door: open; deny: which deny line shows when shut; pick: the orchard-gate trigger is live.
const WANT = {
  a1: { quest: 'heights', door: false, deny: 'latched', pick: false, tally: false, battle: true, fenOrchard: true, hold: 'split', contest: true },
  // a1 after the Heights still points at the orchard (Tobin's battle): no new row may count as done on an old save.
  // ACT1_KEEPER_JOIN §6: `orchard` is re-keyed to the Pack lean, so an old-order save's pointer is `orchard_old`.
  a1_after_heights: { quest: 'orchard_old', door: false, deny: 'latched', pick: false, tally: false, battle: true, fenOrchard: true, hold: 'split', contest: true },
  a2: { quest: 'heights', door: true, pick: false, tally: false, battle: true, fenOrchard: false, hold: 'split', contest: true },
  b: { quest: 'teaser', door: true, pick: false, tally: false, battle: true, fenOrchard: false, hold: 'split', contest: true },
  "b'": { quest: 'hall1_holders', door: true, pick: false, tally: false, battle: true, fenOrchard: false, hold: 'split', contest: true },
  // D1432: Seal 1 and the pick are both in, so the Hall is shut (both paths) and Fen is not inside.
  c: { quest: 'teaser', door: false, deny: 'shut', pick: false, tally: false, battle: true, fenOrchard: false, fenHall: false, hold: 'keepers', contest: false },
  c_glimmer: { quest: 'teaser', door: false, deny: 'shut', pick: false, tally: false, battle: false, fenOrchard: false, fenHall: false, hold: 'glimmer', contest: false },
  p: { quest: 'crates', door: false, deny: 'latched', pick: false, tally: true, battle: false, fenOrchard: true, hold: 'split', contest: true },
  n: { quest: 'rival1', door: false, deny: 'latched', pick: false, tally: true, battle: false, fenOrchard: true, hold: 'split', contest: true },
  mahopac_done: { quest: 'crates', door: false, deny: 'latched', pick: false, tally: true, battle: false, fenOrchard: true, hold: 'split', contest: true },
  lizzy_opening_only: { quest: 'crates', door: false, deny: 'latched', pick: false, tally: true, battle: false, fenOrchard: true, hold: 'split', contest: true },
  day1_done: { quest: 'fen_home', door: false, deny: 'away', pick: false, tally: true, battle: false, fenOrchard: true, hold: 'split', contest: true },
  fen_away: { quest: 'home_trip', door: false, deny: 'away', pick: false, tally: true, battle: false, fenOrchard: false, fenHall: false, hold: 'split', contest: true },
  class_done: { quest: 'hall1_holders', door: true, pick: false, tally: true, battle: false, fenOrchard: false, fenHall: true, hold: 'split', contest: true },
  seal_new: { quest: 'pick', door: true, pick: true, tally: true, battle: false, fenOrchard: false, fenHall: true, hold: 'split', contest: true },
};
const LINES = { shut: "Shut by Keeper order. Master Fen's Hall stays closed for now.", latched: 'The Hall is shut for now. Tobin could use a hand with his crates first.', away: "The Hall is shut. A note on the door: 'Away on Keeper business. Back soon. — Fen'" };

function kindSave(kind) {
  const fx = KINDS[kind], s = starterSave();
  Object.assign(s.flags, fx.flags);
  s.seals = { ...fx.seals };
  return s;
}
async function read(page) {
  return page.evaluate(() => {
    const P = window.PixelPets, g = (m, id) => { const x = P.gateRead(m, id); return x ? x.open : 'missing'; };
    const door = WORLD_DOOR();
    function WORLD_DOOR() { const x = P.gateRead('fernbrook', 'fb_hall'); return x; }
    const reports = MAPDATA.town_board.towns.fernbrook.reports, slip = id => (reports.find(r => r.id === id).when || []).every(c => P.condRead(c).cond);
    return {
      quest: P.quest && P.quest.id, door: door.needOk, pick: g('fernbrook', 'fb_side_pick'), tally: g('fernbrook', 'fb_tobin'), battle: g('fernbrook', 'fern_associate'),
      fenOrchard: g('fernbrook', 'fen_orchard'), fenHall: g('fb_hall_in', 'fen_hall'), hold: P.mapHold('fernbrook'), contest: g('fernbrook', 'fb_sign_meeting'),
      slips: ['fb_hall_latched', 'fb_hall_away', 'fb_hall_open'].filter(slip), tour: g('fernbrook', 'fb_tour1'),
    };
  });
}

for (const kind of Object.keys(WANT)) {
  test(`save kind ${kind}: chain, Hall door, pick, Tobin, Fen, hold and slips read as the spec says`, async ({ page }) => {
    await installSave(page.context(), kindSave(kind), { quietDay: true });
    await gotoGame(page, '?debug=1');
    await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && typeof PixelPets.gateRead === 'function');
    const got = await read(page), want = WANT[kind];
    for (const k of Object.keys(want)) if (k !== 'deny') expect(got[k], kind + '.' + k).toBe(want[k]);
    // The slips: latched and away are the exact opposite of open before Seal 1; none after it.
    const seal = !!kindSave(kind).flags['story.seal1'];
    if (seal) expect(got.slips, kind).toEqual([]);
    else expect(got.slips.length, kind + ' ' + got.slips).toBe(1);
    if (!got.door && !seal) expect(got.slips[0]).toBe(want.deny === 'away' ? 'fb_hall_away' : 'fb_hall_latched');
    // The deny line the holder hears at the shut door.
    if (want.deny) {
      await page.evaluate(() => { PixelPets.showTab('walk'); PixelPets.goto('fernbrook', 22, 7, 'up'); PixelPets.talkTo('fb_hall'); });
      await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
      expect(await page.evaluate(() => PixelPets.scene.text)).toBe(LINES[want.deny]);
    }
    // The Tour never runs on a save past Day 1 of the new flow.
    if (kindSave(kind).flags['story.crates_seen']) expect(got.tour).toBe(false);
    expect(await page.evaluate(() => PixelPets.questCheck)).toEqual([]);
  });
}

// §7.3 on a CLEAN build (no ?debug=1): nothing is written at load.
async function seedRaw(context, raw) {
  await context.addInitScript((raw) => {
    if (!sessionStorage.getItem('pp_d1_seeded')) {
      sessionStorage.setItem('pp_d1_seeded', '1');
      localStorage.setItem('pixelpets.save.v2', raw);
      localStorage.setItem('pixelpets.geo', 'deny');
      localStorage.setItem('pixelpets.mute', '1');
    }
    window.ppAtBoot = undefined;
    let api;
    Object.defineProperty(window, 'PixelPets', { configurable: true, get() { return api; },
      set(v) { if (window.ppAtBoot === undefined) window.ppAtBoot = localStorage.getItem('pixelpets.save.v2'); api = v; } });
  }, raw);
}
for (const kind of ['p', 'mahopac_done', 'fen_away', 'seal_new', 'c']) {
  test(`save kind ${kind}: byte-identical after load on a clean build, v 2`, async ({ page, context }) => {
    const s = kindSave(kind); s.last = Date.now();
    const raw = JSON.stringify(s);
    await seedRaw(context, raw);
    await gotoGame(page);
    await page.waitForFunction(() => window.ppAtBoot !== undefined);
    const atBoot = await page.evaluate(() => window.ppAtBoot);
    if (!s.flags['story.side_pick_done']) expect(atBoot).toBe(raw);
    else {   // ACT1_KEEPER_JOIN §9.1 (D1546 B): a picked save is moved once at load, additive keys only
      const moved = JSON.parse(atBoot);
      for (const k of Object.keys(s.flags)) if (k !== 'story.side') expect(moved.flags[k], k).toEqual(s.flags[k]);
      expect(moved.flags['story.keeper_cadet']).toBe(true);
      expect(moved.flags['story.ilse_call_old']).toBe(true);
    }
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')).v)).toBe(2);
  });
}

test('debug checkpoints build new-flow saves: hall1 has the class and the three holders, no pick; teaser has the pick', async ({ page }) => {
  await installSave(page.context(), kindSave('p'), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true);
  const at = id => page.evaluate(i => { const r = PixelPets.checkpoint(i); const f = PixelPets.state.flags; return { ok: r.ok, quest: r.quest, pick: !!f['story.side_pick_done'], orchard: !!f['story.orchard_cleared'], heights: !!f['story.heights_done'], cls: !!f['story.lizzy_class'], crew: !!f['trainer.h1_cadet'] && !!f['trainer.h1_challenger'] && !!f['trainer.h1_local'], door: PixelPets.gateRead('fernbrook', 'fb_hall').needOk, ready: PixelPets.trialReady }; }, id);
  expect(await at('hall1')).toEqual({ ok: true, quest: 'hall1', pick: false, orchard: false, heights: false, cls: true, crew: true, door: true, ready: true });
  expect(await at('lizzy_class')).toMatchObject({ ok: true, quest: 'lizzy_class', pick: false, orchard: false, cls: false, crew: false, door: false });
  expect(await at('pick')).toMatchObject({ ok: true, quest: 'pick', pick: false, orchard: false });
  expect(await at('teaser')).toMatchObject({ ok: true, pick: true, orchard: true });
});
