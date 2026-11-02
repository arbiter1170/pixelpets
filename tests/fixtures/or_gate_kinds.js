/* FACTION_PICK_TIMING v0.2.4 §7.4 (design ffada0b): the seven kinds of existing save, built from flags only, plus a few
   extra cuts of the same kinds (the other side, Cobblecrest reached, the three kind-p splits, the Signal Review escort).
   Used by tests/faction_or_gate.spec.js. Players never load this file. */

const FB = { 'story.reached_route1': true, 'story.reached_fernbrook': true };
const MET = { 'story.met_glimmerwell': true, 'story.met_fen': true };
const PICK_K = { 'story.side_pick_done': true, 'story.side': 'keepers' };
const PICK_G = { 'story.side_pick_done': true, 'story.side': 'glimmer' };
const PATH_K = { 'story.know_us': true, 'story.heights_path': 'tunnels' };
const PATH_G = { 'story.know_us': true, 'story.heights_path': 'lab' };
const ORCH = { 'story.orchard_cleared': true };
const SEAL1 = { 'story.seal1': true };

// kind -> { flags, seals }. The first seven ids are §7.4's kinds; the rest are extra cuts of them.
const KINDS = {
  a1: { flags: { ...FB, ...MET, ...PICK_K, ...PATH_K }, seals: {} },
  a2: { flags: { ...FB, ...MET, ...PICK_K, ...PATH_K, ...ORCH }, seals: {} },
  b: { flags: { ...FB, ...MET, ...ORCH, ...SEAL1 }, seals: { seal_fernbrook: true } },
  "b'": { flags: { ...FB, ...MET, ...ORCH }, seals: {} },
  c: { flags: { ...FB, ...MET, ...PICK_K, ...PATH_K, ...ORCH, ...SEAL1, 'story.heights_done': true }, seals: { seal_fernbrook: true } },
  p: { flags: { ...FB, ...MET }, seals: {} },
  n: { flags: {}, seals: {} },
  // Extra cuts.
  a1_glimmer: { flags: { ...FB, ...MET, ...PICK_G, ...PATH_G }, seals: {} },
  a1_no_path: { flags: { ...FB, ...MET, ...PICK_K }, seals: {} },
  c_glimmer: { flags: { ...FB, ...MET, ...PICK_G, ...PATH_G, ...ORCH, ...SEAL1, 'story.heights_done': true }, seals: { seal_glim_1: true } },
  c_cobble: { flags: { ...FB, ...MET, ...PICK_K, ...PATH_K, ...ORCH, ...SEAL1, 'story.heights_done': true, 'story.reached_route2': true, 'story.reached_cobblecrest': true }, seals: { seal_fernbrook: true } },
  c_escort: { flags: { ...FB, ...MET, ...PICK_G, ...ORCH, ...SEAL1, 'story.heights_done': true, 'story.gb_escort': true }, seals: { seal_glim_1: true } },
  p_glimmer_only: { flags: { ...FB, 'story.met_glimmerwell': true }, seals: {} },
  p_fen_only: { flags: { ...FB, 'story.met_fen': true }, seals: {} },
  p_fernbrook_only: { flags: { ...FB }, seals: {} },
};
const SEVEN = ['a1', 'a2', 'b', "b'", 'c', 'p', 'n'];

// Every §7.1 gate that exists on this build: map objects (when and need), the town-board slips, the `heights` chain
// pointer, the STANDING tab, trialReady and the two read-only tells.
const OBJ_GATES = [
  ['fernbrook', 'fb_east'], ['fernbrook', 'fb_sign_route2_open'], ['fernbrook', 'fb_rubble'], ['fernbrook', 'fb_sign_route2'],
  ['fernbrook', 'rook_fb'], ['fernbrook', 'fb_teaser'], ['fernbrook', 'fb_hall'], ['fernbrook', 'fern_associate'],
  ['fernbrook', 'fb_crate_a'], ['fernbrook', 'fb_crate_b'], ['fernbrook', 'fb_side_pick'],
  ['fb_heights', 'ht_lab'], ['fb_heights', 'ht_tunnel'],
];
const BOARD_SLIPS = ['fb_hall_latched', 'fb_hall_open'];
const TELLS = ['story.side_pick_done & !story.crates_seen', 'story.orchard_cleared & !story.side_pick_done'];

// Runs in the page (?debug=1). Returns { gate: true/false } for one loaded save.
function readGates(arg) {
  const { objs, slips, tells } = arg;
  const P = window.PixelPets, out = {};
  for (const [map, id] of objs) { const g = P.gateRead(map, id); out[map + ':' + id] = g ? g.open : 'missing'; }
  const reports = (MAPDATA.town_board.towns.fernbrook.reports || []);
  for (const id of slips) {
    const r = reports.find((x) => x.id === id);
    out['board:' + id] = r ? (r.when || []).every((c) => P.condRead(c).cond) : 'missing';
  }
  const S = P.state, st = { flags: S.flags, seals: S.seals, pets: S.party.length + (S.box || []).length };
  const heights = PPQuests.CHAIN.find((e) => e.id === 'heights');
  out['quest:heights.skipIf'] = (heights.skipIf || []).every((c) => PPQuests.evalCond(c, st));
  const cur = PPQuests.current(st);
  out['quest:current'] = cur ? cur.id : null;
  out['standing:tab'] = P.standingTab.on;
  out['trialReady'] = P.trialReady;
  for (const t of tells) out['tell:' + t] = P.condRead(t).cond;
  return out;
}

module.exports = { KINDS, SEVEN, OBJ_GATES, BOARD_SLIPS, TELLS, readGates };
