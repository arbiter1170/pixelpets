/* Walklings - Standing (GLIMMER_PATH v0.2 BS, NEXT_PLAN WP-B "Standing and switching"). Pure data plus small resolvers;
   no DOM, no game state of its own. game.js owns S.standing, the `standing` step, Rook's offer and the STANDING tab;
   save.js clamps the saved points with the same min/max.

   SINGLE SOURCE: every tier name, blurb, toast, threshold, cap, grant amount, switch cost and cooldown rule lives in
   STANDING_CFG below and nowhere else. The yellow decisions Q2 (tier names and numbers) and Q3 (how switching works) are
   built against the spec's defaults; a changed answer is an edit here only. UI, scenes and tests read from this object.

   Meter: integers min..max per side, both sides always tracked. Tier = the highest threshold reached (index into tiers).
   Chapter (one switch per chapter; D16, extended by D132): the number of Seals earned so far
   (story.seal1, story.seal2, and story.seal3 once Brinewick writes it), derived in chapterOf() only.
   Side changes go through Rook after his crate quest (D127). Pledge desks are retired.
   Act (D915, D977): derived in actOf() only, never stored; the switch opens at openAct (Act 3, one way to Glimmerwell:
   D1536, D1513; ACT1_KEEPER_JOIN §8). */
(function (root) {
  'use strict';
  const deepFreeze = o => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); Object.values(o).forEach(deepFreeze); } return o; };

  const STANDING_CFG = deepFreeze({
    min: 0, max: 100,
    thresholds: [0, 10, 25, 45, 70],              // tier k starts at thresholds[k]; Q2 default
    sides: {
      keepers: {
        name: 'The Keepers', short: 'Keepers',
        earn: 'care and kindness: bond, care streaks, Journal pages, freeing crated Walklings',
        asks: 'The Keepers ask you to walk beside wild Walklings, not ahead of them. Feed, rest, listen, and leave glow where it grows. In return the Lantern Houses and Halls treat you as family: warmer words, a Keepers shelf of care goods, and a Warden who will vouch for you.',
        tiers: [
          { name: 'Stranger',      blurb: 'New in town. Folk are polite.',  toast: 'Welcome, traveller!' },
          { name: 'Friend',        blurb: 'Keepers wave when you pass.',    toast: 'The Keepers call you Friend!' },
          { name: 'Trusted',       blurb: 'Lantern Houses save you a bed.', toast: "You're Trusted now. Nice!" },
          { name: 'Hall Friend',   blurb: 'Hall Masters know your name.',   toast: 'Hall Friend! Masters nod hello.' },
          { name: "Warden's Ally", blurb: 'Ilse vouches for you.',          toast: "Warden's Ally! Ilse is proud." },
        ],
      },
      glimmer: {
        name: 'Glimmerwell Co.', short: 'Glimmerwell',
        earn: 'output and quotas: befriends, battles won, Census logs, crates packed',
        asks: 'Glimmerwell asks for output: log the Census, pack the crates, hit quarterly targets, smile on stage. In return you get the lanyard, Acorn bonuses, early looks at new gear, and a company that is always delighted to see you. Brighter by nature, as long as the numbers are.',
        tiers: [
          { name: 'Guest',          blurb: 'Free lantern, free smile.',      toast: 'Welcome! Have a bright day!' },
          { name: 'Associate',      blurb: 'Wine vest, first targets.',      toast: "Associate! Vest's in the mail." },
          { name: 'Junior Bright',  blurb: "Lanyard holder. Rook's level.",  toast: 'Junior Bright! Clip it on!' },
          { name: 'Bright Lead',    blurb: 'You set the targets now.',       toast: 'Bright Lead! Targets up 10%!' },
          { name: "Founder's Pick", blurb: 'Marlowe knows your name.',       toast: "Founder's Pick! So bright!" },
        ],
      },
    },
    // One-shot grants (spec engineAsks.standingGrants). A `["standing", side, null, id]` step takes its amount from here;
    // `standing.got.<id>` guards each one so a replayed scene never grants twice.
    grants: { sp_pick: 10, orchard_k: 5, orchard_g: 5, seal1_k: 10, seal1_g: 10, tour1_match: 5, hc_council_k: 10,
      rc_stamp1: 2, rc_stamp2: 2, rc_stamp3: 2, rc_loose: 2, rc_freed_k: 10, rc_shipped_g: 10,
      gb_relay_g: 2, gb_callback_k: 2, gb_brief_g: 10 },
    // Switching (D15, D127, D131): the side you leave keeps floor(points / costDiv); the side you join is unchanged.
    // Only Rook offers it, and only after story.rc_climax. A debug switchSide may skip the cost; the scene never does.
    switch: {
      costDiv: 2,
      cooldown: 'perChapter',                       // one switch per chapter (chapterOf); 'none' = never refused
      openAct: 3,                                   // Act 3, one way (D1536, D1513; replaces D161's Act 5 lock): story.act >= 3, read through actOf (D915)
      oneWay: 'glimmer',                            // D1536: Keepers -> Glimmerwell only, never back; canSwitch says 'one_way' (D981's openAfterAny is not built)
      swayShift: -2,                                // D1506, D1559: a public turn to oneWay moves every story.sway_* flag by this, clamped -3..3 (game.js switchSide)
      joinMinTier: 0,                               // NEXT_PLAN proposed 1 (tier 1 with the side you join); spec v0.2 drops it. Default: not required
      confirm: 'Really?', yes: 'Yes', no: 'Not yet',
      costLine: '{side} Standing {from} \u2192 {to}',
      // Rook's offer (ROOK_CROSSROADS). letter/welcome are Rook. review is narration (empty speaker).
      rook: {
        letter: {
          keepers: 'The Lantern Houses will take you. I asked Ilse myself. She said of course.',
          glimmer: "Here's my old lanyard. Dorian will clip it on you. I won't watch.",
        },
        review: {
          keepers: 'Word travels along the lanterns. Nobody says anything unkind, but the waves are slower now.',
          glimmer: 'A wine envelope arrives. Your file is closed. Thank you for exploring other opportunities!',
        },
        welcome: {
          keepers: "Welcome to the slow side, {name}. It's nicer here. Promise.",
          glimmer: 'Okay. Be careful in there. Count the crates. Count the Walklings too.',
        },
        wait: "No rush. I'm not going anywhere. The road's closed anyway.",
        refused: 'One change of heart per Seal. Earn your next Seal, then ask me again.',
        notYet: 'Ask me after the crates. I want you to see them first.',
      },
    },
    tab: {
      label: 'STANDING',
      empty: 'Nobody knows you yet. Go say hello!',
      pledged: 'Pledged to {faction}',
      explain: 'Standing is how much a side trusts you.',   // D1536: no switching before Act 3
      marker: 'PLEDGED',
    },
    // NPC_RANKS / SIDE_BADGE (Vincent, Nov 2, 2026): faction control inside the place chip (emblem, hold stripe) and the hold word
    // that covers the place line when you walk into a new place. hold ids come from REGION_MAP (keepers, glimmer, split, wild). Every word lives here.
    bar: {
      words: { keepers: 'KEEPERS', glimmer: 'GLIMMERWELL', split: 'BOTH SIDES', wild: 'UNCLAIMED' },
      holdMs: 2400,                                   // how long the hold word shows on arrival
      label: 'Standing',                              // the TODAY card row's aria label starts with this
      unpledged: "You haven't picked a side yet",     // the card STANDING opens before the side pick (no points shown)
      close: 'CLOSE',
    },
    // Voice guide for any Glimmerwell placeholder (not UI text).
    glossary: {
      'a Walkling': 'a unit', 'the draining': 'glow sharing', 'relocating': 'giving them a comfier home', 'the player': 'partner',
      'a Trial Hall': 'a review venue', 'Rook': 'our star Junior Bright', 'Standing': 'your performance score', 'a capture': 'a partnership',
      'a tired Walkling': 'relaxed, with bad lighting', 'a sanctuary': 'a Comfort Sanctuary', 'a befriend-net': 'a Comfort Cradle',
      'a quota': 'a quarterly target', 'quitting': 'exploring other opportunities',
    },
    // Designer-delivered 8x8 emblems for the STANDING tab rows (PAL keys, '.' = transparent). Tier icons are not drawn yet.
    art: {
      emblem_keepers: ['....lg..', '...og...', '..oooo..', '.oyywyo.', '.oywyyo.', '.oyyyyo.', '..oooo..', '...oo...'],
      emblem_glimmer: ['..yyyy..', '.yVVVVy.', 'yVVwVVVy', 'yVwwwVVy', 'yVVwVVVy', '.yVVVVy.', '..dhhd..', '...dd...'],
      // SIDE_BADGE: the unpledged emblem. Neutral greys only (no gold and green, no wine and soot).
      emblem_none: ['...hh...', '..hmmh..', '.hm..mh.', 'hm.hh.mh', 'hm.hh.mh', '.hm..mh.', '..hmmh..', '...hh...'],
    },
  });

  const SIDES = Object.freeze(Object.keys(STANDING_CFG.sides));
  const isSide = s => SIDES.includes(s);
  const clampPts = n => { n = Math.round(Number(n)); if (!Number.isFinite(n)) n = STANDING_CFG.min; return Math.max(STANDING_CFG.min, Math.min(STANDING_CFG.max, n)); };
  function tierOf(pts){ const T = STANDING_CFG.thresholds, n = clampPts(pts); let k = 0; for (let i = 0; i < T.length; i++) if (n >= T[i]) k = i; return k; }
  // Everything the UI needs for one side at `pts`: tier index, name, blurb, toast, and the bar toward the next tier.
  function tierInfo(sideId, pts){
    const sd = STANDING_CFG.sides[sideId]; if (!sd) return null;
    const n = clampPts(pts), tier = tierOf(n), T = STANDING_CFG.thresholds, t = sd.tiers[tier], from = T[tier], next = tier + 1 < T.length ? T[tier + 1] : null;
    return { side: sideId, points: n, tier, name: t.name, blurb: t.blurb, toast: t.toast, from, next, frac: next == null ? 1 : Math.max(0, Math.min(1, (n - from) / (next - from))) };
  }
  const switchCost = pts => Math.floor(clampPts(pts) / STANDING_CFG.switch.costDiv);
  // Chapter = Seals earned so far. story.seal3 counts when Brinewick writes it (D132). That chapter is not built yet.
  const chapterOf = flags => ['story.seal1', 'story.seal2', 'story.seal3'].filter(k => !!(flags || {})[k]).length;
  // The act number (D915, re-issued for seven acts as D977): derived, never stored. 1 plus one for each act start reached.
  // Only story.ep1_end is written today (the Episode 1 card); the others are written by the acts that build them.
  // Acts 3 and 4 also start from Seals held (5 and 7, D1329 count, tags never count), the same boundary as their flags.
  // Nothing writes story.act; a stored one is ignored here (game.js honours it only under ?debug=1). Save stays v2.
  const ACT_FLAGS = Object.freeze(['story.ep1_end', 'story.seal5', 'story.seal7', 'story.skyloom_done', 'story.climb_open', 'story.summit_open']);
  const ACT_SEALS = Object.freeze({ 'story.seal5': 5, 'story.seal7': 7 });
  function actOf(flags, sealsHeld){
    const F = flags || {}, n = Number(sealsHeld) || 0;
    return ACT_FLAGS.filter(k => !!F[k] || (ACT_SEALS[k] != null && n >= ACT_SEALS[k])).length + 1;
  }
  // SEALS_BOTH_PATHS: a Seal is a Hall's Seal; a Bright Tier lanyard is Glimmerwell's tag clipped to one (STORY v0.7.13 §9).
  // Tags never count as Seals. Read aliases for old saves (no write, save stays v2, no migrator):
  //   seal_glim_1 alone reads as the Fernbrook Seal (old-flow Hall 1; Fen's Hall is shut after the pick);
  //   seal_glim_2 + trainer.hall2_hale, and seal_glim_3 + trainer.hall3_marisol, read as that Hall's Seal (the match was won).
  const SEAL_TAGS = Object.freeze({ seal_glim_1: 'seal_fernbrook', seal_glim_2: 'seal_cobblecrest', seal_glim_3: 'seal_brinewick' });
  const SEAL_TAG_WIN = Object.freeze({ seal_glim_1: null, seal_glim_2: 'trainer.hall2_hale', seal_glim_3: 'trainer.hall3_marisol' });
  const isTag = id => Object.prototype.hasOwnProperty.call(SEAL_TAGS, id);
  function sealAliasIn(seals, flags, tag){ const w = SEAL_TAG_WIN[tag]; return !!(seals || {})[tag] && (!w || !!(flags || {})[w]); }
  function hasSealIn(seals, flags, id, both){
    const s = seals || {};
    if (s[id]) return true;
    if (!both || isTag(id)) return false;
    for (const t of Object.keys(SEAL_TAGS)) if (SEAL_TAGS[t] === id && sealAliasIn(s, flags, t)) return true;
    return false;
  }
  function sealsHeldIn(seals, flags, both){
    const s = seals || {}, ids = Object.keys(s).filter(k => !!s[k]);
    if (!both) return ids.length;
    const held = new Set(ids.filter(k => !isTag(k)));
    for (const t of Object.keys(SEAL_TAGS)) if (sealAliasIn(s, flags, t)) held.add(SEAL_TAGS[t]);
    return held.size;
  }
  // Can the pledge change right now? `flags` is S.flags; `standing` is S.standing; `to` the side being joined;
  // `act` the act number the caller read (game.js passes its own, so a ?debug=1 stored act counts); default actOf(flags).
  // Returns { ok, why } with why in: 'no_pick', 'same_side', 'one_way' (the join is not cfg.oneWay, D1536), 'locked' (before
  // Act 3, D1536/D1513), 'no_rook', 'cooldown', 'join_tier'. With `to` null the join is the other side of `from` (the
  // STANDING view's "could I switch at all"), so a Glimmerwell face reads one_way.
  // no_rook is checked before the cooldown so a quest that has not finished yet says "not yet", not "refused".
  // Scenes and battles are the caller's check.
  function canSwitch(flags, standing, from, to, act){
    const F = flags || {}, cfg = STANDING_CFG.switch;
    if (!F['story.side_pick_done']) return { ok: false, why: 'no_pick' };
    if (to != null && to === from) return { ok: false, why: 'same_side' };
    if (cfg.oneWay) {
      const at = isSide(from) ? from : (F['story.side'] === 'glimmer' ? 'glimmer' : 'keepers');
      const join = to != null ? to : SIDES.find(sd => sd !== at);
      if (join !== cfg.oneWay) return { ok: false, why: 'one_way' };
    }
    if (cfg.openAct && !((act != null ? Number(act) : actOf(F)) >= cfg.openAct)) return { ok: false, why: 'locked' };
    if (F['story.solvane_met']) return { ok: false, why: 'closed' };   // REPORTS_AND_ENDINGS D1625: the window shuts at the Spire
    if (!F['story.rc_climax']) return { ok: false, why: 'no_rook' };
    if (cfg.cooldown === 'perChapter' && F['story.switch_chapter'] != null && Number(F['story.switch_chapter']) === chapterOf(F)) return { ok: false, why: 'cooldown' };
    if (to != null && cfg.joinMinTier > 0 && tierOf((standing || {})[to]) < cfg.joinMinTier) return { ok: false, why: 'join_tier' };
    return { ok: true, why: null };
  }
  // ACT1_KEEPER_JOIN §8 (D1514, D1559): may Warden Ilse still take this holder's reports? Only a Keeper Cadet
  // (story.keeper_cadet) who has not switched in Act 3 (story.switched_a3) and has not taken the Act 3 loyalist choice
  // (story.warden_cut; the Act 3 packet writes it). REPORT_FLAGS D1725 (REPORTS_AND_ENDINGS §9, D1629): never story.switches,
  // which an old save may carry from Rook's old offer although the move made it a Keeper in public. Pure; reads only.
  function reportsOpen(flags){
    const F = flags || {};
    return !!F['story.keeper_cadet'] && !F['story.warden_cut'] && !F['story.switched_a3'];
  }
  /* REPORTS_AND_ENDINGS v0.1.1 §3.3 (D1620, D1621, D1629) with REPORT_FLAGS v0.1 (D1720): the pure readers the endings use.
     No stored number, no writes: each counts the flags when a scene asks. Six reports, one shape: story.rpt_1 .. story.rpt_6 =
     'told' / 'kept' (R1-R3 Act 1; R4 Kilnmouth; R5 Act 3's turn; R6 after the third sitting, a letter, D1726 B). Only this fixed
     list counts (D1720 rule 2: never a story.rpt_ prefix scan, so story.rpt_gov and story.rpt_old_seen are guards, not reports).
     Paths: 'g' the switcher (story.side glimmer AND story.switched_a3: an Act 1 lanyard or an old switch never counts), 'l' the
     loyalist (story.warden_cut), 'w' with the Warden. Eight ending ids; their scenes are later packets'. */
  const RPT = Object.freeze(['story.rpt_1', 'story.rpt_2', 'story.rpt_3', 'story.rpt_4', 'story.rpt_5', 'story.rpt_6']);
  const ENDINGS = Object.freeze(['k_restored', 'k_court', 'k_desk', 'l_hand', 'l_witness', 'g_turned', 'g_order', 'g_road']);
  function pathOf(flags){
    const F = flags || {};
    if (F['story.side'] === 'glimmer' && F['story.switched_a3']) return 'g';
    if (F['story.warden_cut']) return 'l';
    return 'w';
  }
  // Trusted 4-6 told, Guarded 2-3, Distant 0-1 (D1621). With the Warden a letter never sent counts as kept, at read time only.
  function trustOf(flags){
    const F = flags || {}, p = pathOf(F);
    let told = 0, kept = 0;
    for (const k of RPT) {
      const v = F[k];
      if (v === 'told') told++;
      else if (v === 'kept' || p === 'w') kept++;
    }
    return { path: p, told, kept, tier: told >= 4 ? 'trusted' : told >= 2 ? 'guarded' : 'distant' };
  }
  // What the President's office offers (D1624, D1627, D1728): the loyalist stands or exposes; everyone else may clean up or
  // expose, and convert only when Trusted and the Keepers have decided.
  function presOptions(flags){
    const F = flags || {}, t = trustOf(F);
    if (t.path === 'l') return ['stand', 'expose'];
    const o = ['cleanup', 'expose'];
    if (t.tier === 'trusted' && F['story.keepers_decided']) o.push('convert');
    return o;
  }
  // D1628 gate for Ilse's conversion (the ILSE_ARC packet refines the talks; endingOf reads only story.ilse_turned).
  function ilseCanTurn(flags){ const F = flags || {}, t = trustOf(F); return t.path === 'g' && !F['story.warden_cut'] && t.told >= 1 && t.kept <= 1; }
  // Switcher first, then the loyalist, then with the Warden; inside a path the written choice wins. Fallbacks (never reached in
  // play): W k_desk, L l_hand, G g_order. It trusts the saved choice and never re-checks the gate.
  function endingOf(flags){
    const F = flags || {}, p = pathOf(F), c = F['story.pres_choice'];
    if (p === 'g') return F['story.pres_ally'] === 'no' ? 'g_road' : F['story.ilse_turned'] === 'yes' ? 'g_turned' : 'g_order';
    if (p === 'l') return c === 'expose' ? 'l_witness' : 'l_hand';
    return c === 'convert' ? 'k_restored' : c === 'expose' ? 'k_court' : 'k_desk';
  }
  // D1514: the loyalist's explicit choice ("I answer to the Commander now", Act 3 packet copy) is offered only from Act 3 on,
  // and only while the reports are still open. `act` as in canSwitch (default actOf(flags)).
  function loyalistOpen(flags, act){
    const F = flags || {}, a = act != null ? Number(act) : actOf(F);
    return a >= STANDING_CFG.switch.openAct && reportsOpen(F);
  }
  const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m));

  // Dev check: the config's own shape (every side has one tier per threshold, blurbs and toasts fit 40 chars, grants are positive).
  function devCheck(){
    const bad = [], C = STANDING_CFG;
    if (!(C.min < C.max)) bad.push('min must be below max');
    if (C.thresholds[0] !== C.min) bad.push('first threshold must equal min');
    for (let i = 1; i < C.thresholds.length; i++) if (!(C.thresholds[i] > C.thresholds[i - 1] && C.thresholds[i] <= C.max)) bad.push('thresholds must rise and stay within max');
    for (const [id, sd] of Object.entries(C.sides)) {
      if (sd.tiers.length !== C.thresholds.length) bad.push(id + ': one tier per threshold');
      sd.tiers.forEach((t, i) => { for (const k of ['name', 'blurb', 'toast']) { if (typeof t[k] !== 'string' || !t[k]) bad.push(id + ' tier ' + i + ': missing ' + k); else if (k !== 'name' && Array.from(t[k]).length > 40) bad.push(id + ' tier ' + i + ': ' + k + ' over 40'); } });
    }
    for (const [k, v] of Object.entries(C.grants)) if (!(Number.isInteger(v) && v > 0)) bad.push('grant ' + k + ' must be a positive integer');
    if (!(Number.isInteger(C.switch.costDiv) && C.switch.costDiv >= 1)) bad.push('switch.costDiv must be an integer >= 1');
    if (C.switch.oneWay != null && !isSide(C.switch.oneWay)) bad.push('switch.oneWay must be a side');
    if (!(Number.isInteger(C.switch.swayShift) && Math.abs(C.switch.swayShift) <= 6)) bad.push('switch.swayShift must be a small integer');
    if (!(Number.isInteger(C.switch.openAct) && C.switch.openAct >= 1)) bad.push('switch.openAct must be an act number');
    const R = C.switch.rook;
    if (!R) bad.push('switch.rook missing');
    else {
      for (const k of ['letter', 'review', 'welcome']) for (const s of SIDES) if (!R[k] || typeof R[k][s] !== 'string') bad.push('switch.rook.' + k + '.' + s + ' missing');
      for (const k of ['wait', 'refused', 'notYet']) if (typeof R[k] !== 'string') bad.push('switch.rook.' + k + ' missing');
    }
    return bad;
  }

  const api = { CFG: STANDING_CFG, SIDES, isSide, clampPts, tierOf, tierInfo, switchCost, chapterOf, canSwitch, fill, devCheck,
    SEAL_TAGS, isTag, hasSealIn, sealsHeldIn, ACT_FLAGS, actOf, reportsOpen, loyalistOpen,
    RPT, ENDINGS, pathOf, trustOf, presOptions, ilseCanTurn, endingOf };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.STANDING_CFG = STANDING_CFG;
  root.PPStanding = api;
})(typeof window !== 'undefined' ? window : globalThis);
