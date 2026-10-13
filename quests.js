/* Walklings - quest chain (NEXT_PLAN WP-C). Pure data plus a resolver; no DOM, no game state of its own.
   The current objective is derived entirely from the save's flags, so there is nothing to migrate: an old save lands on
   the right step the moment it loads. game.js reads PPQuests.current(state) and draws the button, the panel and the cues.

   state = { flags, seals, pets }  (S.flags, S.seals, number of owned Walklings)
   entry = { id, when?: [cond], done: [cond], text, place, target?: { map, x, y } }
   Entries are in story order. The first entry that is not done (its own `done` flags, or any later entry's) and whose
   optional `when` holds is the current objective; `when` is only for skips (the first-wild meet when a second Walkling
   already joined). Conditions use the scene `cond()` syntax subset: 'flag', '!flag', 'flag=value', 'seal:id', plus 'pets>=N'. */
(function (root) {
  'use strict';
  const LINE_MAX = 110;   // same as interiors.json dialog.lineMax

  // Story flags written by the design data that are deliberately not chain steps (branch inputs, puzzle bits, values).
  const NOT_STEPS = ['story.starter_line', 'story.rook_pact', 'story.rook_saw_lamps', 'story.h2_seam_a', 'story.h2_seam_b'];

  const CHAIN = [
    { id: 'wake', done: ['story.intro_seen'],
      text: 'Morning. Look around your room, then read the note on the door.', place: 'Hearthmoor \u00b7 your home',
      target: { map: 'hm_home_in', x: 4, y: 7 } },
    { id: 'lodge', done: ['story.starter_received'],
      text: "Someone small is waiting at the Warden's Lodge. Ilse has a Walkling for you.", place: "Hearthmoor \u00b7 the Warden's Lodge",
      target: { map: 'hm_lodge_in', x: 5, y: 3 } },
    { id: 'rival1', done: ['story.rival1_done'],
      text: 'Rook is waiting by the east gate. Go and say hello.', place: 'Hearthmoor \u00b7 east gate',
      target: { map: 'hearthmoor', x: 22, y: 8 } },
    { id: 'first_wild', when: ['!pets>=2'], done: ['story.first_wild_met'],
      text: 'A wild Walkling waits in the grass by the east path. Walk up to it.', place: 'Hearthmoor \u00b7 by the east path',
      target: { map: 'hearthmoor', x: 18, y: 9 }, follow: 'guide' },   // game.js moves the cue onto the live guide wild when it is out
    { id: 'route1', done: ['story.reached_route1'],
      text: 'Take the east path out of town. Route 1 starts past the gate.', place: 'Hearthmoor \u00b7 east path',
      target: { map: 'hearthmoor', x: 23, y: 8 } },
    { id: 'fernbrook', done: ['story.reached_fernbrook'],
      text: 'Follow Route 1 east, by the stream. Fernbrook is at the far end.', place: 'Route 1 \u00b7 east end',
      target: { map: 'route1', x: 47, y: 8 } },
    { id: 'glimmer', done: ['story.met_glimmerwell'],
      text: 'A bright new stand sits in the square. See what the fuss is about.', place: 'Fernbrook \u00b7 the square',
      target: { map: 'fernbrook', x: 13, y: 8 } },
    { id: 'fen', done: ['story.met_fen'],
      text: 'Master Fen is in the orchard, west of the square. Go and talk to her.', place: 'Fernbrook \u00b7 the orchard',
      target: { map: 'fernbrook', x: 10, y: 9 } },
    { id: 'orchard', done: ['story.orchard_cleared'],
      text: 'Tobin is minding the crates in the orchard. Battle him to open them.', place: 'Fernbrook \u00b7 orchard, south-west',
      target: { map: 'fernbrook', x: 9, y: 14 } },
    { id: 'hall1', done: ['story.seal1'],
      text: 'The Trial Hall is open. Challenge Master Fen for the Fernbrook Seal.', place: 'Fernbrook \u00b7 Trial Hall, east side',
      target: { map: 'fernbrook', x: 22, y: 6 } },
    { id: 'teaser', done: ['story.slice_end'],
      text: 'Rook has news outside the Trial Hall.', place: 'Fernbrook \u00b7 Trial Hall doorstep',
      target: { map: 'fernbrook', x: 22, y: 8 } },
    { id: 'route2', done: ['story.reached_route2'],
      text: 'The rubble east of Fernbrook is cleared. Head east to Route 2.', place: 'Fernbrook \u00b7 east edge',
      target: { map: 'fernbrook', x: 31, y: 8 } },
    { id: 'census', done: ['story.met_census'],
      text: 'Follow Route 2 east. Glimmerwell has set something up halfway along.', place: 'Route 2 \u00b7 halfway',
      target: { map: 'route2', x: 24, y: 8 } },
    { id: 'glen', done: ['story.reached_glen'],
      text: 'A path leads north off Route 2, into Wickerglen.', place: 'Route 2 \u00b7 north path',
      target: { map: 'route2', x: 24, y: 0 } },
    { id: 'lead', done: ['story.met_lead'],
      text: 'Find Field Lead Imogen among the lamps in Wickerglen.', place: 'Wickerglen',
      target: { map: 'route2_glen', x: 12, y: 10 } },
    { id: 'glen_cleared', done: ['story.glen_cleared'],
      text: 'Battle Field Lead Imogen under the Comfort Lamps.', place: 'Wickerglen \u00b7 the lamps',
      target: { map: 'route2_glen', x: 12, y: 5 } },
    { id: 'route2_end', done: ['story.route2_end'],
      text: 'Rook waits by the Glimmerwell gate at the east end of Route 2.', place: 'Route 2 \u00b7 east gate',
      target: { map: 'route2', x: 44, y: 8 } },
    { id: 'cobblecrest', done: ['story.reached_cobblecrest'],
      text: 'The gate is open. Head east to Cobblecrest.', place: 'Route 2 \u00b7 east gate',
      target: { map: 'route2', x: 47, y: 8 } },
    { id: 'cobble_arrive', done: ['story.cobble_arrived'],
      text: 'Rook is waiting just inside Cobblecrest.', place: 'Cobblecrest \u00b7 west gate',
      target: { map: 'cobblecrest', x: 3, y: 7 } },
    { id: 'quarry', done: ['story.reached_quarry'],
      text: 'The open house is at the quarry, up the road north of town.', place: 'Cobblecrest \u00b7 north road',
      target: { map: 'cobblecrest', x: 16, y: 0 } },
    { id: 'buyout', done: ['story.quarry_bought'],
      text: "Walk up to the stage. Rook's supervisor is about to speak.", place: 'Cobblecrest Quarry \u00b7 the stage',
      target: { map: 'cobble_quarry', x: 16, y: 4 } },
    { id: 'hall2', done: ['story.seal2'],
      text: 'The Cobblecrest Trial Hall is open. Challenge Master Hale for the Seal.', place: 'Cobblecrest \u00b7 Trial Hall, east side',
      target: { map: 'cc_hall_in', x: 5, y: 2 } },
    { id: 'hook', done: ['story.cobble_end'],
      text: 'Rook is outside the Trial Hall with news from the quarry.', place: 'Cobblecrest \u00b7 outside the Hall',
      target: { map: 'cobblecrest', x: 25, y: 7 } },
    { id: 'end', done: [],
      text: 'That is all for now. Explore, fill the Journal, grow your friends.', place: 'The Amberwild' },
  ];

  function evalCond(c, st){
    if (c === 'else') return true;
    let neg = false; if (c[0] === '!') { neg = true; c = c.slice(1); }
    let v;
    const ge = c.match(/^pets>=(\d+)$/);
    if (ge) v = (st.pets | 0) >= +ge[1];
    else if (c.startsWith('seal:')) v = !!(st.seals && st.seals[c.slice(5)]);
    else { const k = c.indexOf('='), F = st.flags || {}; v = k >= 0 ? String(F[c.slice(0, k)]) === c.slice(k + 1) : !!F[c]; }
    return neg ? !v : v;
  }
  const all = (cs, st) => (cs || []).every(c => evalCond(c, st));
  const ownDone = (e, st) => e.done.length > 0 && all(e.done, st);
  const eligible = (e, st) => all(e.when, st);
  // Progress implies the steps before it: a step counts as done when its own flags hold or any later step's do. Saves made
  // before a flag existed (story.reached_route1 is newer than Route 2) would otherwise pin the chain on a stale step.
  function doneMask(st){
    const m = CHAIN.map(e => ownDone(e, st));
    for (let i = m.length - 2; i >= 0; i--) m[i] = m[i] || m[i + 1];
    return m;
  }

  // The current objective, or null when nothing applies (never happens with the chain above: `end` has no done).
  function current(st){
    const m = doneMask(st);
    for (let i = 0; i < CHAIN.length; i++) if (!m[i] && eligible(CHAIN[i], st)) return CHAIN[i];
    return null;
  }
  // Completed steps before the current one, most recent first (for the panel's dimmed list). Steps that were skipped
  // (not eligible) or only implied by later progress still count: the player is past them.
  function completed(st, n){
    const cur = current(st), m = doneMask(st), out = [];
    for (let i = 0; i < CHAIN.length; i++) { const e = CHAIN[i]; if (cur && e.id === cur.id) break; if (m[i] && eligible(e, st)) out.push(e); }
    return out.reverse().slice(0, n == null ? out.length : n);
  }
  const byId = id => CHAIN.find(e => e.id === id) || null;

  // Dev check (NEXT_PLAN WP-C task 8): every story.* flag written by the design data (scene setFlag steps, warp/door
  // setFlag fields) is a `done` condition of some entry or on NOT_STEPS, so new content cannot silently fall off the chain.
  // Also: text fits lineMax, no tokens, ids unique, done flags reachable. Returns a list of problems (empty = pass).
  function devCheck(MD){
    const bad = [], written = new Set();
    const scanSteps = node => {                                   // deep walk: if/choice branches are nested arrays too
      if (!Array.isArray(node)) return;
      if (node[0] === 'setFlag' && typeof node[1] === 'string') written.add(node[1]);
      for (const x of node) scanSteps(x);
    };
    const scanScenes = sc => { for (const steps of Object.values(sc || {})) scanSteps(steps); };
    const scanMaps = maps => { for (const m of Object.values(maps || {})) for (const o of (m && m.objs) || []) if (typeof o.setFlag === 'string') written.add(o.setFlag); };
    const scanPatch = p => { if (!p) return; scanScenes(p.scenes); for (const pt of Object.values(p.maps || {})) for (const o of [].concat(pt.addObjs || [], pt.replaceObjs || [])) if (typeof o.setFlag === 'string') written.add(o.setFlag); };
    for (const src of Object.values(MD || {})) { if (!src) continue; scanScenes(src.scenes); scanMaps(src.maps); scanMaps(src.rooms); scanPatch(src.slicePatch); scanPatch(src.route2Patch); }
    const doneFlags = new Set(); for (const e of CHAIN) for (const c of e.done) doneFlags.add(c.replace(/^!/, '').split('=')[0]);
    for (const f of written) if (f.startsWith('story.') && !doneFlags.has(f) && !NOT_STEPS.includes(f)) bad.push('flag not on the chain: ' + f);
    const ids = new Set();
    for (const e of CHAIN) {
      if (ids.has(e.id)) bad.push('duplicate id: ' + e.id); ids.add(e.id);
      if (Array.from(e.text).length > LINE_MAX) bad.push('text over ' + LINE_MAX + ': ' + e.id);
      if (/\{|\}|  /.test(e.text) || /\{|\}|  /.test(e.place)) bad.push('token or double space: ' + e.id);
      if (e.target && !(typeof e.target.map === 'string' && Number.isInteger(e.target.x) && Number.isInteger(e.target.y))) bad.push('bad target: ' + e.id);
    }
    if (CHAIN[CHAIN.length - 1].done.length) bad.push('the last entry must never be done');
    return bad;
  }

  const api = { CHAIN, NOT_STEPS, LINE_MAX, evalCond, current, completed, byId, devCheck };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.PPQuests = api;
})(typeof window !== 'undefined' ? window : globalThis);
