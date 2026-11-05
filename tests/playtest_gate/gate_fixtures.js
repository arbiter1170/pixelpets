/* PLAYTEST_GATE v0.1 (tests/playtest_gate/PACKET.md): the gate's fixtures and expected tables. Players never load this file.
   The seven Act 1 save kinds are imported from tests/fixtures/or_gate_kinds.js (§2.1), never copied. The stage fixtures of §4
   are copied verbatim from the spec lines named above each block. Every save here is synthetic: starterSave() plus flags. */
const { starterSave } = require('../helpers');
const { KINDS, SEVEN, OBJ_GATES, BOARD_SLIPS, TELLS, readGates } = require('../fixtures/or_gate_kinds');

// §2.1: a kind is starterSave() with the kind's flags on top and its own seals.
function kindSave(kind) {
  const k = KINDS[kind];
  if (!k) throw new Error('unknown save kind ' + kind);
  const s = starterSave();
  Object.assign(s.flags, k.flags);
  s.seals = { ...k.seals };
  return s;
}
const PICKED = ['a1', 'a2', 'c'];
const GLIMMER_CUTS = ['a1_glimmer', 'c_glimmer'];
const picked = kind => PICKED.includes(kind) || GLIMMER_CUTS.includes(kind);

/* ---------- §4 stage fixtures ---------- */

// SF-JOIN: tests/act1_keeper_join.spec.js 14-36 (AFTER_NIGHT, joinSave), verbatim.
const JOIN = (() => {
// A new-flow save after the crackdown night (Day 1, Lizzy's class, the three holders, Fen's Seal, the dawn release).
const AFTER_NIGHT = {
  'story.reached_route1': true, 'story.rival1_done': true, 'story.reached_fernbrook': true, 'story.met_glimmerwell': true,
  'story.met_fen': true, 'story.crate_a': true, 'story.crate_b': true, 'story.crate_c': true, 'story.tally_done': true,
  'story.tl_amos': true, 'story.tl_juniper': true, 'story.tl_done': true, 'story.crates_seen': true, 'story.fen_sent_home': true,
  'story.mom_met': true, 'story.mom_chore': true, 'story.mom_sent': true, 'story.reached_mahopac': true, 'story.dream_woke': true,
  'story.class_sent': true, 'story.lizzy_met': true, 'story.lizzy_class': true, 'trainer.h1_cadet': true,
  'trainer.h1_challenger': true, 'trainer.h1_local': true, 'trainer.hall1_fen': true, 'story.seal1': true,
  'story.crackdown': true, 'story.hall1_shut': true, 'story.post_trial_done': true, 'story.fen_lean': 2, 'story.phone_got': true,
};
const MET = { 'story.warden_called': true, 'story.warden_met': true };
function joinSave(extra, world) {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.textSpeed = 'fast';
  Object.assign(s.flags, AFTER_NIGHT, extra || {});
  for (const [k, v] of Object.entries(s.flags)) if (v === null) delete s.flags[k];
  s.world = Object.assign({ map: 'fernbrook', x: 12, y: 8, facing: 'down', respawn: 'fernbrook' }, world || {});
  s.standing = { keepers: 0, glimmer: 0 };
  s.seals = { seal_fernbrook: 1700000000000 };
  s.party[0].xp = 4000;
  s.money = 40;
  return s;
}
return { AFTER_NIGHT, MET, joinSave };
})();

// SF-KM and SF-E6: tests/kilnmouth_seat.spec.js 37-61 and save() 63-72, verbatim. MORNING is tests/kilnmouth.spec.js 46 (its
// lines 22-45 are byte-identical to 37-60 here), for the manual-only km_* states of §7 M1.
const KS = (() => {
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
// tests/kilnmouth.spec.js 46:
const MORNING = Object.assign({}, CURFEW, { 'story.km_council': true, 'story.km_settled': true });

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
return { ACT1, POSTED, MET, IN_TOWN, ARRIVED, STORMED, CURFEW, SEATED, MORNING, save };
})();

// SF-CAB-OPEN and SF-CAB-DENY: tests/cabinet.spec.js 31-59 and save() 62-72, verbatim.
const CAB = (() => {
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
return { A2, SEAT, save };
})();

// §4 table. SF-E6(f, k): f and k are the Fernbrook and Kilnmouth sway; null deletes the key (absent), as the source save() does.
const STAGE = {
  sf_join: () => JOIN.joinSave({}, { map: 'fb_lantern_in', x: 5, y: 13 }),
  sf_km: () => KS.save(KS.MET, { map: 'km_road', x: 27, y: 2, facing: 'up' }),
  sf_cab_open: () => CAB.save(CAB.SEAT),
  sf_cab_deny: () => CAB.save(CAB.A2),
  // §7 M1, manual only: tests/kilnmouth.spec.js 42-46's states at kilnmouth 27,37.
  km_in_town: () => KS.save(KS.IN_TOWN),
  km_stormed: () => KS.save(KS.STORMED),
  km_curfew: () => KS.save(KS.CURFEW),
  km_morning: () => KS.save(KS.MORNING),
};
function sfE6(f, k) {
  return KS.save(Object.assign({}, KS.SEATED, { 'story.act': 3, 'story.km_seat_pick': 'town', 'story.km_permit_to': 'warden',
    'story.km_council': true, 'story.km_settled': true, 'story.km_lease': 'ended', 'story.km_springs': 'warm', 'story.km_hall_lit': true,
    'story.sway_fernbrook': f, 'story.sway_kilnmouth': k }));
}

/* ---------- §3.3 the allowed-change list (pinned; never a wildcard) ---------- */

const MOVES = ['foxfire_flick', 'flick_flame', 'stoke_up'];
// Top-level and nested keys normalizeV2 adds at load, with this build's value. `debugSave` depends on the URL (§3.3).
const ADDED = {
  'party[].met': 1700000000000,
  'party[].bx': 64,
  'party[].moves': MOVES,
  'party[].evoMoves': [],
  'player.look.accessory': 'none',
  'settings.effects': null,   // 'full', or 'calm' when the page asks for reduced motion (save.js normalizeV2, P3a D424)
  'settings.joystick': false,
  'settings.mapZoom': 2,
  'settings.tips': true,
  'settings.showOthers': 'on',
  'steps': 0,
  'standing': { keepers: 0, glimmer: 0 },
  'board': { lastTown: 'hearthmoor' },
  'phoneBook': { met: {}, fav: {} },
  'rep': {},
  'repJoins': 0,
  'ui': {},
  'eggs': { incubators: [{ egg: null }], held: [] },
  'debugSave': null,   // false without ?debug=1, true with it
  'mapSeen': { hearthmoor: 1 },
  'meta': { migratedFrom: null, migratedAt: null, backup: null, legacy: {} },
};
const CARE = ['hunger', 'happy', 'energy'];

// The old-save move's flags (§3.3 second table, §6.2 for the Glimmer cuts). The first six land in the move's write before
// boot; story.unlock_sides is the "sides" tip card's write after boot. story.side changes only for a Glimmer pick.
const MOVE_KEEPERS = {
  'story.keeper_cadet': true, 'story.orchard_lean': 'open', 'story.fen_lean': 1, 'story.sway_fernbrook': 3,
  'story.cover_done': true, 'story.ilse_call_old': true,
};
const MOVE_GLIMMER = {
  'story.keeper_cadet': true, 'story.orchard_lean': 'pack', 'story.fen_lean': -1, 'story.sway_fernbrook': -2,
  'story.cover_done': true, 'story.ilse_call_old': true,
};
const moveFlags = kind => (GLIMMER_CUTS.includes(kind) ? MOVE_GLIMMER : MOVE_KEEPERS);
const TIP_FLAG = 'story.unlock_sides';
// Seeded value -> stored value the move may assign (by assignment, not switchSide: story.switches stays absent).
const MOVE_CHANGED = { a1_glimmer: { 'story.side': ['glimmer', 'keepers'] }, c_glimmer: { 'story.side': ['glimmer', 'keepers'] } };

/* ---------- §5.0 per-kind reads ---------- */

const OLD_MOVE_TOAST = "You're a Keeper Cadet now. See Ilse.";
const FB_LINE = {
  keepers: 'The Keepers hold the town now. The orchard stays rooted.',
  split: 'Keepers keep the town. Glimmerwell keeps a stand.',
};
const READS = {
  a1: { quest: 'heights', hold: 'keepers', sway: 3, seal: false, held: 0, toast: true },
  a2: { quest: 'heights', hold: 'keepers', sway: 3, seal: false, held: 0, toast: true },
  b: { quest: 'teaser', hold: 'split', sway: 0, seal: true, held: 1, toast: false },
  "b'": { quest: 'hall1_holders', hold: 'split', sway: 0, seal: false, held: 0, toast: false },
  c: { quest: 'teaser', hold: 'keepers', sway: 3, seal: true, held: 1, toast: true },
  p: { quest: 'crates', hold: 'split', sway: 0, seal: false, held: 0, toast: false },
  n: { quest: 'rival1', hold: 'split', sway: 0, seal: false, held: 0, toast: false },
};
const KM_ACT1 = { hold: 'split', line: 'Both sides keep a claim.', sway: 0 };

/* ---------- §5.2, §6.1 hold lines and the E6 rows ---------- */

const HOLD_FB = {   // a Cadet's Fernbrook
  keepers: 'The Keepers hold the town now. The orchard stays rooted.',
  split: 'Keepers walk the lanes. Glimmerwell keeps the gate.',
  glimmer: 'Glimmerwell holds the town now. Lanterns on every gate.',
};
const HOLD_KM = {   // Kilnmouth after the council
  keepers: 'Kilnmouth sits its own seat. The Keepers walk its lanes.',
  split: 'Kilnmouth sits its seat. Both sides wait at the springs.',
  glimmer: "Glimmerwell holds the town. The water's warm again.",
};
// [f, k] before -> [f, k] after (null = absent), Fernbrook hold, Kilnmouth hold, townFaction('kilnmouth'), each [before, after].
const E6 = [
  { before: [3, 2], after: [1, 0], fb: ['keepers', 'split'], km: ['keepers', 'split'], tf: ['keepers', null] },
  { before: [2, -1], after: [0, -3], fb: ['keepers', 'split'], km: ['split', 'glimmer'], tf: [null, 'glimmer'] },
  { before: [-2, -3], after: [-3, -3], fb: ['glimmer', 'glimmer'], km: ['glimmer', 'glimmer'], tf: ['glimmer', 'glimmer'] },
  { before: [3, 3], after: [1, 1], fb: ['keepers', 'split'], km: ['keepers', 'split'], tf: ['keepers', null] },
  { before: [1, null], after: [-1, null], fb: ['split', 'split'], km: ['split', 'split'], tf: [null, null] },
  { before: [null, 2], after: [null, 0], fb: ['split', 'split'], km: ['keepers', 'split'], tf: ['keepers', null] },
  { before: [null, null], after: [null, null], fb: ['split', 'split'], km: ['split', 'split'], tf: [null, null] },
];

/* ---------- §6.3 the SEALS kill switch, false path ---------- */

const SEALS_LINE = 'const SEALS_BOTH_PATHS = true;';
const SEALS_OFF = 'const SEALS_BOTH_PATHS = false;';
// kind -> readGates keys that change on -> off, hasSeal('seal_fernbrook') [on, off], sealsHeld() [on, off].
const SEALS_ROWS = {
  a1: { gates: [], seal: [false, false], held: [0, 0] },
  a2: { gates: [], seal: [false, false], held: [0, 0] },
  "b'": { gates: [], seal: [false, false], held: [0, 0] },
  p: { gates: [], seal: [false, false], held: [0, 0] },
  n: { gates: [], seal: [false, false], held: [0, 0] },
  a1_glimmer: { gates: [], seal: [false, false], held: [0, 0] },
  b: { gates: [], seal: [true, true], held: [1, 1] },
  c: { gates: [], seal: [true, true], held: [1, 1] },
  c_glimmer: { gates: ['fernbrook:fb_teaser', 'fernbrook:rook_fb'], seal: [true, false], held: [1, 1], quest: 'teaser' },
};

module.exports = {
  KINDS, SEVEN, OBJ_GATES, BOARD_SLIPS, TELLS, readGates, kindSave, PICKED, GLIMMER_CUTS, picked,
  JOIN, KS, CAB, STAGE, sfE6,
  ADDED, CARE, MOVES, MOVE_KEEPERS, MOVE_GLIMMER, moveFlags, TIP_FLAG, MOVE_CHANGED,
  OLD_MOVE_TOAST, FB_LINE, READS, KM_ACT1, HOLD_FB, HOLD_KM, E6, SEALS_LINE, SEALS_OFF, SEALS_ROWS,
};
