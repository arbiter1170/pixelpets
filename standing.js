/* Walklings - Standing (GLIMMER_PATH v0.2 BS, NEXT_PLAN WP-B "Standing and switching"). Pure data plus small resolvers;
   no DOM, no game state of its own. game.js owns S.standing, the `standing` step, Rook's offer and the STANDING tab;
   save.js clamps the saved points with the same min/max.

   SINGLE SOURCE: every tier name, blurb, toast, threshold, cap, grant amount, switch cost and cooldown rule lives in
   STANDING_CFG below and nowhere else. The yellow decisions Q2 (tier names and numbers) and Q3 (how switching works) are
   built against the spec's defaults; a changed answer is an edit here only. UI, scenes and tests read from this object.

   Meter: integers min..max per side, both sides always tracked. Tier = the highest threshold reached (index into tiers).
   Chapter (one switch per chapter; D16, extended by D132): the number of Seals earned so far
   (story.seal1, story.seal2, and story.seal3 once Brinewick writes it), derived in chapterOf() only.
   Side changes go through Rook after his crate quest (D127). Pledge desks are retired. */
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
        asks: 'Glimmerwell asks for output: log the Census, pack the crates, hit quarterly targets, smile on stage. In return you get the mint lanyard, Acorn bonuses, early looks at new gear, and a company that is always delighted to see you. Brighter by nature, as long as the numbers are.',
        tiers: [
          { name: 'Guest',          blurb: 'Free lantern, free smile.',      toast: 'Welcome! Have a bright day!' },
          { name: 'Associate',      blurb: 'Mint vest, first targets.',      toast: "Associate! Vest's in the mail." },
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
      openAct: 5,                                   // D161 (Vincent, Oct 28, 2026): no switching until Act 5 (story.act >= 5; nothing writes it yet)
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
          glimmer: 'A mint envelope arrives. Your file is closed. Thank you for exploring other opportunities!',
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
      explain: 'Standing is how much a side trusts you.',   // D161: no switching before Act 5
      marker: 'PLEDGED',
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
      emblem_glimmer: ['..ssss..', '.slllls.', 'sllwllls', 'slwwwlls', 'sllwllls', '.slllls.', '..dhhd..', '...dd...'],
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
  // Can the pledge change right now? `flags` is S.flags; `standing` is S.standing; `to` the side being joined.
  // Returns { ok, why } with why in: 'no_pick', 'same_side', 'locked' (before Act 5, D161), 'no_rook', 'cooldown', 'join_tier'.
  // no_rook is checked before the cooldown so a quest that has not finished yet says "not yet", not "refused".
  // Scenes and battles are the caller's check.
  function canSwitch(flags, standing, from, to){
    const F = flags || {}, cfg = STANDING_CFG.switch;
    if (!F['story.side_pick_done']) return { ok: false, why: 'no_pick' };
    if (to != null && to === from) return { ok: false, why: 'same_side' };
    if (cfg.openAct && !(Number(F['story.act']) >= cfg.openAct)) return { ok: false, why: 'locked' };
    if (!F['story.rc_climax']) return { ok: false, why: 'no_rook' };
    if (cfg.cooldown === 'perChapter' && F['story.switch_chapter'] != null && Number(F['story.switch_chapter']) === chapterOf(F)) return { ok: false, why: 'cooldown' };
    if (to != null && cfg.joinMinTier > 0 && tierOf((standing || {})[to]) < cfg.joinMinTier) return { ok: false, why: 'join_tier' };
    return { ok: true, why: null };
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
    const R = C.switch.rook;
    if (!R) bad.push('switch.rook missing');
    else {
      for (const k of ['letter', 'review', 'welcome']) for (const s of SIDES) if (!R[k] || typeof R[k][s] !== 'string') bad.push('switch.rook.' + k + '.' + s + ' missing');
      for (const k of ['wait', 'refused', 'notYet']) if (typeof R[k] !== 'string') bad.push('switch.rook.' + k + ' missing');
    }
    return bad;
  }

  const api = { CFG: STANDING_CFG, SIDES, isSide, clampPts, tierOf, tierInfo, switchCost, chapterOf, canSwitch, fill, devCheck };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.STANDING_CFG = STANDING_CFG;
  root.PPStanding = api;
})(typeof window !== 'undefined' ? window : globalThis);
