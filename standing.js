/* Walklings - Standing (GLIMMER_PATH v0.2 BS, NEXT_PLAN WP-B "Standing and switching"). Pure data plus small resolvers;
   no DOM, no game state of its own. game.js owns S.standing, the `standing` step, the Pledge desks and the STANDING tab;
   save.js clamps the saved points with the same min/max.

   SINGLE SOURCE: every tier name, blurb, toast, threshold, cap, grant amount, switch cost and cooldown rule lives in
   STANDING_CFG below and nowhere else. The yellow decisions Q2 (tier names and numbers) and Q3 (how switching works) are
   built against the spec's defaults; a changed answer is an edit here only. UI, scenes and tests read from this object.

   Meter: integers min..max per side, both sides always tracked. Tier = the highest threshold reached (index into tiers).
   Chapter (for the "one switch per chapter" cooldown; "chapter" is not defined in any spec, see OPEN_DECISIONS D16):
   the number of Seals earned so far (story.seal1, story.seal2), derived in chapterOf() only. */
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
    grants: { sp_pick: 10, orchard_k: 5, orchard_g: 5, seal1_k: 10, seal1_g: 10 },
    // Switching (Q3 default): the side you leave keeps floor(points / costDiv); the side you join is unchanged.
    switch: {
      costDiv: 2,
      cooldown: 'perChapter',                       // one switch per chapter (chapterOf); 'none' = never refused
      joinMinTier: 0,                               // NEXT_PLAN proposed 1 (tier 1 with the side you join); spec v0.2 drops it. Default: not required
      desks: {                                      // where the Pledge desk option appears (existing NPC panels; no new map objects)
        keepers: { who: 'Keeper Amos', panel: 'lantern' },      // the Fernbrook Lantern House door panel
        glimmer: { who: 'Associate Juniper', npc: 'juniper' },  // Juniper at the Fernbrook stand
      },
      option: 'Pledge desk', ask: 'Anything else?', confirm: 'Really?', yes: 'Yes', no: 'Think about it',
      costLine: '{side} Standing {from} \u2192 {to}',
      // Bridging lines. PLACEHOLDER: the spec lists the reference letter and performance review as later-phase content
      // with no lines written; these follow the glossary voice and need copy from Vincent. Narration ('' speaker) except
      // the desk's own greeting, so no new character is invented.
      letter: {   // from the side you are joining, read at its desk (flavor)
        keepers: 'Keeper Amos unfolds a letter: the Lantern Houses would be glad to count you among friends.',          /* PLACEHOLDER: needs copy from Vincent */
        glimmer: 'Juniper slides a glossy letter across the counter: Glimmerwell would be delighted to welcome a partner!', /* PLACEHOLDER: needs copy from Vincent */
      },
      review: {   // from the side you are leaving ("performance review"), right after the switch
        keepers: 'Word travels along the lanterns. Nobody says anything unkind, but the waves are slower now.',        /* PLACEHOLDER: needs copy from Vincent */
        glimmer: 'A mint envelope arrives. Your file is closed. Thank you for exploring other opportunities!',           /* PLACEHOLDER: needs copy from Vincent */
      },
      welcome: {  // the desk's own line once the pledge is made
        keepers: 'Welcome, {name}. Rest when you need to. The lantern is lit for you.',                                 /* PLACEHOLDER: needs copy from Vincent */
        glimmer: 'Welcome to the partnership, {name}! Have a bright day!',                                               /* PLACEHOLDER: needs copy from Vincent */
      },
      wait: 'No rush. The desk is here when you want it.',                                                              /* PLACEHOLDER: needs copy from Vincent */
      refused: 'One change of heart per Seal. Earn your next Seal first, then come back.',   // cooldown line (matches chapterOf)
    },
    tab: {
      label: 'STANDING',
      empty: 'Nobody knows you yet. Go say hello!',
      pledged: 'Pledged to {faction}',
      explain: 'Standing is how much a side trusts you. Tiers open shops and new lines, never the story.',
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
  // Chapter = Seals earned so far. The only place the "chapter" of the cooldown rule is derived.
  const chapterOf = flags => ['story.seal1', 'story.seal2'].filter(k => !!(flags || {})[k]).length;
  // Can the pledge change right now? `flags` is S.flags; `standing` is S.standing; `to` the side being joined.
  // Returns { ok, why } with why in: 'no_pick', 'same_side', 'cooldown', 'join_tier'. Scenes/battles are the caller's check.
  function canSwitch(flags, standing, from, to){
    const F = flags || {}, cfg = STANDING_CFG.switch;
    if (!F['story.side_pick_done']) return { ok: false, why: 'no_pick' };
    if (to != null && to === from) return { ok: false, why: 'same_side' };
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
    for (const k of ['letter', 'review', 'welcome']) for (const s of SIDES) if (typeof C.switch[k][s] !== 'string') bad.push('switch.' + k + '.' + s + ' missing');
    return bad;
  }

  const api = { CFG: STANDING_CFG, SIDES, isSide, clampPts, tierOf, tierInfo, switchCost, chapterOf, canSwitch, fill, devCheck };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.STANDING_CFG = STANDING_CFG;
  root.PPStanding = api;
})(typeof window !== 'undefined' ? window : globalThis);
