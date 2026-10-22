/* Walklings save format v2 + v1 -> v2 migration (design spec SAVE_V2).
   - v2 lives in `pixelpets.save.v2`. The v1 key is read only for migration and never written or deleted.
   - Before the first v2 write, the raw v1 string is copied once to `pixelpets.save.v1.bak` (only if absent).
   - Unreadable saves are copied to `pixelpets.save.corrupt` ({at, from, raw}; latest wins).
   - Unknown fields survive everywhere; unknown v1 top-level fields go to meta.legacy.
   - Device prefs (pixelpets.fast/debug/mute/geo/env/envOverride) are never read, moved or deleted here.
   Needs SPECIES (sprites.js) and EVO_XP/STAT_RULES/levelOf/maxHpOf (stats.js). Pure functions + loadSave(); game.js owns save() timing. */
'use strict';
const PPSave = (() => {
  const PLAYER_NAME_MAX = 10;   // MAPS_SLICE §8/§10: player names, code points
  const V1_KEY = 'pixelpets.save.v1', V2_KEY = 'pixelpets.save.v2', BAK_KEY = 'pixelpets.save.v1.bak', CORRUPT_KEY = 'pixelpets.save.corrupt';
  // Frozen forever: v1 stored species by array index. Never derive this from SPECIES order.
  const V1_SPECIES = Object.freeze(['ember', 'tide', 'bloom', 'stone', 'volt', 'frost', 'gust', 'shade']);
  // Save v2 species/form-id table: append-only, in SPECIES order (v1 lines first, then CREATURES_SLICE lines 8-13).
  // Adding ids keeps the save at v2; never remove, rename or reorder one. 20 lines x 3 stages = 60 form ids.
  // npcOnly lines (fetch) are in this table and left out of the journal, which counts 57.
  // HUSHWATER B2 (D347, D357): skink, otter, owl, snail are appended. Save stays pixelpets.save.v2, v: 2.
  const SPECIES_IDS = Object.freeze([...V1_SPECIES, 'beetle', 'mole', 'crab', 'moth', 'vane', 'dormouse', 'byte', 'fetch', 'skink', 'otter', 'owl', 'snail']);
  const FORM_IDS = Object.freeze(SPECIES_IDS.flatMap(id => [0, 1, 2].map(k => id + '/' + k)));
  const PARTY_MAX = 6;
  // MAPS_SLICE §10 / INTERIORS §5 / ACT1_ROUTE2 §0.2 / COBBLECREST mapdata: ids and sizes from data/mapdata.js.
  const MD = typeof MAPDATA === 'object' ? MAPDATA : null;
  const MAP_SIZE = {};
  const addMaps = bag => { if (bag) for (const [id, m] of Object.entries(bag)) if (m && m.w && m.h) MAP_SIZE[id] = [m.w, m.h]; };
  if (MD) { addMaps(MD.maps_slice.maps); addMaps(MD.act1_route2 && MD.act1_route2.maps); addMaps(MD.interiors.maps); addMaps(MD.cobblecrest && MD.cobblecrest.maps); addMaps(MD.cobblecrest && MD.cobblecrest.rooms); addMaps(MD.mahopac && MD.mahopac.maps); addMaps(MD.highcharity && MD.highcharity.maps); addMaps(MD.highcharity && MD.highcharity.rooms); addMaps(MD.heights && MD.heights.maps); addMaps(MD.civic && MD.civic.maps); addMaps(MD.fernbrook_rooms && MD.fernbrook_rooms.maps); }
  else MAP_SIZE.proto = [24, 20];
  // Map-pass overlays (data/detail_*.json, applied last in game.js) may resize a map with `slicePatch.maps[id].set.w/h`.
  if (MD) for (const k of Object.keys(MD).filter(k => k.startsWith('detail_')).sort()) {
    addMaps(MD[k] && MD[k].maps);   // HUSHWATER E3: hw_* sizes, so a reload inside Hushwater stays there
    const pm = MD[k] && MD[k].slicePatch && MD[k].slicePatch.maps;
    if (pm) for (const [id, pt] of Object.entries(pm)) if (MAP_SIZE[id] && pt && pt.set && pt.set.w && pt.set.h) MAP_SIZE[id] = [pt.set.w, pt.set.h];
  }
  const MAPS = Object.keys(MAP_SIZE);
  // D224: floorSeen keys are real map ids. Detail overlays can add rooms that MAPS has not sized yet.
  const FLOOR_SEEN_IDS = new Set(MAPS);
  if (MD) for (const bag of Object.values(MD)) {
    if (!bag || typeof bag !== 'object') continue;
    for (const key of ['maps', 'rooms']) {
      const group = bag[key];
      if (!group || typeof group !== 'object') continue;
      for (const [id, m] of Object.entries(group)) if (m && m.w && m.h) FLOOR_SEEN_IDS.add(id);
    }
  }
  const MAP_W = 24, MAP_H = 20;                 // v1 positions were on the 24x20 proto map
  const NEW_GAME = MD ? MD.interiors.newGame : { map: 'proto', x: 3, y: 3, facing: 'down' };
  const LODGE_STEP = { map: 'hearthmoor', x: 11, y: 6, facing: 'up' };          // mid-starter resume (MAPS_SLICE §10)
  const LANTERN_STEP = { map: 'hearthmoor', x: 16, y: 13, facing: 'down' };     // existing saves / unknown maps (§10)
  const V1_KNOWN = ['v', 'uid', 'created', 'last', 'pets', 'active', 'seen', 'steps', 'pos'];
  const FACINGS = ['up', 'down', 'left', 'right'], TEXT_SPEEDS = ['slow', 'normal', 'fast'], BACKUPS = ['ok', 'existing', 'failed'];

  const isObj = x => x !== null && typeof x === 'object' && !Array.isArray(x);
  const fin = x => Number.isFinite(x);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const rid = n => Array.from({ length: n }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.random() * 36 | 0]).join('');
  const copy = x => JSON.parse(JSON.stringify(x));
  const speciesIndex = () => { const m = {}; SPECIES.forEach((s, i) => { m[s.id] = i; }); return m; };
  const stageCount = id => { const i = speciesIndex()[id]; return i == null ? 3 : SPECIES[i].stages.length; };
  const isSpecies = id => typeof id === 'string' && speciesIndex()[id] != null;

  let warned = false;
  const warnOnce = (msg, e) => { if (!warned) { warned = true; console.warn('Walklings: ' + msg, e && e.message ? e.message : ''); } };
  const ls = {
    get(k){ try { return localStorage.getItem(k); } catch(e) { return null; } },
    set(k, v){ try { localStorage.setItem(k, v); return true; } catch(e) { warnOnce("couldn't write the save (storage full or blocked); playing in memory.", e); return false; } },
  };
  function writeCorrupt(from, raw){ ls.set(CORRUPT_KEY, JSON.stringify({ at: Date.now(), from, raw })); }

  // The fresh-game start: INTERIORS §3.3 newGame = your home room hm_home_in (1,3) facing down. A new object every call.
  const startWorld = () => ({ map: NEW_GAME.map, x: NEW_GAME.x, y: NEW_GAME.y, facing: NEW_GAME.facing, respawn: null });
  function defaultStateV2(now = Date.now()){
    return { v: 2, uid: rid(12), created: now, last: now, party: [], box: [], partnerId: null, orphans: [],
      dex: { seen: {}, caught: {}, legacy: [], hits: {} }, steps: 0, world: startWorld(),
      bag: {}, money: 0, seals: {}, flags: {}, standing: { keepers: 0, glimmer: 0 }, board: { lastTown: '' }, phoneBook: { met: {}, fav: {} }, eggs: { incubators: [{ egg: null }], held: [] },
      settings: { textSpeed: 'normal', battleAnims: true, follower: true, music: true, musicVol: 0.5, tips: true },
      player: { name: null, look: null },
      meta: { migratedFrom: null, migratedAt: null, backup: null, legacy: {} } };
  }

  // Held item, cosmetic accessory, and battle deploy (additive, save stays v2).
  // Invalid values are deleted. Unknown keys on the pet stay. Relief is unique across party then box (keepOneRelief).
  const DEPLOY_CALLS = ['charge', 'brace', 'dart', 'greet'];
  const PET_ACCESSORIES = ['bell', 'ribbon', 'scarf', 'leaf', 'star', 'wick_charm', 'pin_badge', 'fern_scarf', 'clover_crown', 'willow_crown', 'lamp_cap'];
  const PET_AURAS = ['emberwake', 'kilnsmoke', 'lanternfly'];
  const cleanDeployText = v => typeof v === 'string' ? v.replace(/[<>{}]/g, '').trim().slice(0, 40) : '';
  const shortId = v => typeof v === 'string' && v.length >= 1 && v.length <= 24 && /^[a-z0-9_]+$/.test(v);
  function fixHeldAccessoryDeploy(q){
    if (has(q, 'held')) {
      if (typeof ITEMS === 'object' && ITEMS) {
        if (!(typeof q.held === 'string' && ITEMS[q.held] && ITEMS[q.held].hold === true)) delete q.held;
      } else if (!shortId(q.held)) delete q.held;
    }
    if (has(q, 'accessory') && !PET_ACCESSORIES.includes(q.accessory)) delete q.accessory;
    if (has(q, 'aura') && !PET_AURAS.includes(q.aura)) delete q.aura;
    if (!has(q, 'deploy')) return;
    if (!isObj(q.deploy)) { delete q.deploy; return; }
    const d = q.deploy, next = {};
    if (DEPLOY_CALLS.includes(d.call)) next.call = d.call;
    if (typeof MOVES === 'object' && MOVES) {
      if (typeof d.opener === 'string' && Array.isArray(q.moves) && q.moves.includes(d.opener)) next.opener = d.opener;
    } else if (shortId(d.opener)) next.opener = d.opener;
    const line = cleanDeployText(d.line); if (line) next.line = line;
    const note = cleanDeployText(d.note); if (note) next.note = note;
    if (d.relief === true) next.relief = true;
    if (!Object.keys(next).length) delete q.deploy; else q.deploy = next;
  }
  function keepOneRelief(s){
    let kept = false;
    for (const p of s.party.concat(s.box)) {
      if (!p || !p.deploy || p.deploy.relief !== true) continue;
      if (!kept) { kept = true; continue; }
      delete p.deploy.relief;
      if (!Object.keys(p.deploy).length) delete p.deploy;
    }
  }

  // §5 step 2.4: field fixes for one pet (also used by normalizeV2). `used` = ids already taken.
  // Later specs add their per-pet defaults here (additive fields, no version bump).
  function fixPet(q, used, created, originDefault){
    // HUSHWATER B0 (D347, D357): a species id this client does not know stays in place.
    // No stage clamp and no defaultMoves refill. A free string id is reserved so a known pet cannot take it.
    // HUSHWATER B1: if that id is already taken, give this pet a fresh rid(8). Every other field stays. The pet stays.
    if (!isSpecies(q.species)) {
      if (typeof q.id === 'string' && q.id && used.has(q.id)) {
        q.id = rid(8);
        while (used.has(q.id)) q.id = rid(8);
      }
      if (typeof q.id === 'string' && q.id) used.add(q.id);
      return q;
    }
    if (!(typeof q.id === 'string' && q.id && !used.has(q.id))) q.id = rid(8);
    while (used.has(q.id)) q.id = rid(8);
    used.add(q.id);
    q.stage = fin(q.stage) ? clamp(Math.round(q.stage), 0, stageCount(q.species) - 1) : 0;
    if (!(fin(q.xp) && q.xp >= 0)) q.xp = q.stage ? EVO_XP[q.stage - 1] : 0;
    for (const [k, d] of [['hunger', 80], ['happy', 80], ['energy', 90]]) q[k] = fin(q[k]) ? clamp(q[k], 0, 100) : d;
    if (!(fin(q.met) && q.met > 0)) q.met = created;
    if (has(q, 'cd')) { if (!isObj(q.cd)) delete q.cd; else for (const a of ['feed', 'play', 'rest']) if (has(q.cd, a) && !fin(q.cd[a])) delete q.cd[a]; }
    for (const k of ['cx', 'ex']) if (has(q, k) && !isObj(q[k])) delete q[k];
    // CARE_LOOP cheap slice (additive): bond points (never a level; only goes up) and today's pat record.
    if (has(q, 'bond')) { if (!fin(q.bond) || q.bond < 0) delete q.bond; else q.bond = Math.floor(q.bond); }
    if (has(q, 'pat') && !(isObj(q.pat) && typeof q.pat.d === 'string')) delete q.pat;
    else if (has(q, 'pat')) for (const k of ['n', 'joy', 'bond']) q.pat[k] = fin(q.pat[k]) && q.pat[k] >= 0 ? Math.floor(q.pat[k]) : 0;
    if (has(q, 'sr')) q.sr = fin(q.sr) ? Math.max(0, Math.floor(q.sr)) : 0;
    if (!has(q, 'nick') || (q.nick !== null && typeof q.nick !== 'string')) q.nick = null;
    if (!has(q, 'origin') || typeof q.origin !== 'string') q.origin = originDefault;
    if (has(q, 'metPlace')) {
      const place = typeof q.metPlace === 'string' ? q.metPlace.replace(/[<>{}]/g, '').trim().slice(0, 40) : '';
      if (!place) delete q.metPlace; else q.metPlace = place;
    }
    // TYPES_STATS §5: battle XP. Missing/invalid -> the old display level (1 + floor(xp/10)) kept within Lv 5..10.
    if (!(Number.isInteger(q.bx) && q.bx >= 0)) q.bx = STAT_RULES.bxForLevel(migratedLevel(q.xp));
    else if (q.bx > BX_CAP) q.bx = BX_CAP;
    // TYPES_STATS §7: current HP, optional (absent = full). Bad values or full HP -> absent.
    if (has(q, 'hpNow') && (!fin(q.hpNow) || q.hpNow < 0 || q.hpNow >= maxHpOf(q))) delete q.hpNow;
    // D190: optional chip and align. Absent means unchipped. No version bump.
    if (has(q, 'chip')) {
      const okChip = isObj(q.chip) && q.chip.on === true;
      if (!okChip) { delete q.chip; if (has(q, 'align')) delete q.align; }
      else {
        q.chip = { on: true, at: fin(q.chip.at) && q.chip.at > 0 ? q.chip.at : created, locked: q.chip.locked !== false };
        q.align = fin(q.align) ? clamp(Math.round(q.align), 0, 100) : 50;
      }
    } else if (has(q, 'align')) delete q.align;
    // BATTLE v0.3 §7.2 / SAVE_V2 §3.2: the faint nap stamp. Bad -> delete; > 20 min ahead -> now + 20 min; no hpNow -> delete.
    if (has(q, 'faintUntil')) {
      const nap = (typeof STAT_RULES === 'object' && STAT_RULES.FAINT ? STAT_RULES.FAINT.minutes : 20) * 60000, t = Date.now();
      if (!fin(q.faintUntil) || q.faintUntil <= 0 || !has(q, 'hpNow')) delete q.faintUntil;
      else if (q.faintUntil > t + nap) q.faintUntil = t + nap;
    }
    // CREATURES_SLICE §5: faded days left (absent/0 = normal) and that day's care samples. Additive, no version bump.
    if (has(q, 'faded')) { if (!fin(q.faded) || q.faded < 1) delete q.faded; else q.faded = Math.min(9, Math.round(q.faded)); }
    if (has(q, 'fc') && (!has(q, 'faded') || !isObj(q.fc) || typeof q.fc.d !== 'string' || !fin(q.fc.sum) || !fin(q.fc.n) || q.fc.n < 0)) delete q.fc;
    // BATTLE §3.3/§3.4: known moves (<= 4) and the stages whose evolution move was offered. Additive, no version bump.
    if (typeof MOVES === 'object' && typeof defaultMoves === 'function') {
      const ok = Array.isArray(q.moves) && q.moves.length >= 1 && q.moves.length <= 4 && q.moves.every(m => typeof m === 'string' && MOVES[m] && !MOVES[m].fallback) && new Set(q.moves).size === q.moves.length;
      const filled = !ok;
      if (filled) q.moves = defaultMoves(formId(q.species, q.stage), levelOf(q));
      const ev = q.evoMoves;
      if (!(Array.isArray(ev) && ev.every(k => k === 1 || k === 2))) q.evoMoves = filled ? Array.from({ length: q.stage }, (_, i) => i + 1) : [];
      q.evoMoves = [...new Set(q.evoMoves)].filter(k => k <= q.stage).sort();
    }
    fixHeldAccessoryDeploy(q);
    return q;
  }
  const formId = (species, stage) => species + '/' + stage;
  const setWorld = (s, at) => { Object.assign(s.world, { map: at.map, x: at.x, y: at.y, facing: at.facing }); };
  // MAPS_SLICE §10 + INTERIORS §3.3, after pets and flags are normalized (idempotent):
  // - no pets, no story.intro_seen: a new game, always at newGame (home room 1,3): nothing from an old position survives;
  // - no pets but intro_seen: closed mid-`starter` -> the Lodge doorstep (11,6) facing up;
  // - pets on `proto` with no intro_seen (a save from before the maps): skip the opening -> Hearthmoor Lantern doorstep, starter flags set;
  // - pets but intro_seen without starter_received (defensive): the same flags, in place;
  // - unknown map id -> the Lantern doorstep; a position off the map is clamped to its size (Route 1 is 48 wide).
  function placeWorld(s){
    const w = s.world, f = s.flags, pets = s.party.length + s.box.length;
    if (!pets) {
      if (!f['story.intro_seen']) { s.world = startWorld(); return; }
      if (!f['story.starter_received'] || !MAPS.includes(w.map)) setWorld(s, LODGE_STEP);
    } else {
      const old = !f['story.intro_seen'];      // pets but no intro: a save from before Phase M (they all lived in Old Meadow)
      if (old || !f['story.starter_received']) {
        const lead = s.party.find(p => p.id === s.partnerId) || s.party[0];
        const sp = lead && SPECIES[speciesIndex()[lead.species]];
        if (!['ember', 'tide', 'bloom'].includes(f['story.starter_line'])) f['story.starter_line'] = sp && sp.starter ? sp.id : 'ember';
        f['story.intro_seen'] = true; f['story.starter_received'] = true;
        if (old) { setWorld(s, LANTERN_STEP); w.respawn = 'hearthmoor'; }
        if (!w.respawn) w.respawn = 'hearthmoor';
      }
      if (!MAPS.includes(w.map)) { setWorld(s, LANTERN_STEP); if (!w.respawn) w.respawn = 'hearthmoor'; }
    }
    const [mw, mh] = MAP_SIZE[s.world.map] || [24, 20];
    s.world.x = clamp(s.world.x, 0, mw - 1); s.world.y = clamp(s.world.y, 0, mh - 1);
  }

  // §5: pure, `now` injected. `backup` is the result of the .bak write (§4 step 4).
  function migrateV1toV2(o, now, backup = null){
    const s = defaultStateV2(now);
    s.uid = typeof o.uid === 'string' && o.uid ? o.uid : rid(12);
    s.created = fin(o.created) && o.created > 0 ? o.created : now;
    s.last = fin(o.last) && o.last > 0 ? Math.min(o.last, now) : now;
    s.steps = fin(o.steps) && o.steps >= 0 ? Math.floor(o.steps) : 0;
    const used = new Set(), byIndex = new Map(), migrated = [];
    (Array.isArray(o.pets) ? o.pets : []).forEach((p, i) => {
      if (!isObj(p)) { s.orphans.push({ reason: 'not-object', from: 'v1.pets[' + i + ']', at: now, raw: p }); return; }
      if (!Number.isInteger(p.sp) || p.sp < 0 || p.sp >= V1_SPECIES.length) { s.orphans.push({ reason: 'unknown-species', from: 'v1.pets[' + i + ']', at: now, raw: p }); return; }
      const q = copy(p); q.species = V1_SPECIES[p.sp]; delete q.sp;
      fixPet(q, used, s.created, 'v1');
      byIndex.set(i, q); migrated.push(q);
    });
    const partner = (Number.isInteger(o.active) && byIndex.get(o.active)) || migrated[0] || null;
    const ordered = partner ? [partner, ...migrated.filter(q => q !== partner)] : [];
    s.party = ordered.slice(0, PARTY_MAX); s.box = ordered.slice(PARTY_MAX);
    s.partnerId = partner ? partner.id : null;
    if (isObj(o.seen)) for (const [k, v] of Object.entries(o.seen)) {
      if (!v) continue;
      const m = /^(\d+)-(\d+)$/.exec(k);
      if (m && +m[1] < V1_SPECIES.length && +m[2] <= 2) s.dex.seen[formId(V1_SPECIES[+m[1]], +m[2])] = true; else s.dex.legacy.push(k);
    }
    for (const q of migrated) { const f = formId(q.species, q.stage); s.dex.seen[f] = true; s.dex.caught[f] = true; }
    const pos = o.pos;
    if (isObj(pos) && Number.isInteger(pos.x) && Number.isInteger(pos.y) && pos.x >= 0 && pos.x < MAP_W && pos.y >= 0 && pos.y < MAP_H) { s.world.x = pos.x; s.world.y = pos.y; }
    s.meta = { migratedFrom: 1, migratedAt: now, backup, legacy: {} };
    for (const k of Object.keys(o)) if (!V1_KNOWN.includes(k)) s.meta.legacy[k] = o[k];
    s.v = 2;
    return s;
  }

  // §6: runs on every load. Mutates in place, idempotent, never drops unknown keys.
  function normalizeV2(s, now = Date.now()){
    const d = defaultStateV2(now);
    const fill = (obj, key, ok, def) => { if (!ok(obj[key])) obj[key] = def; };
    fill(s, 'uid', x => typeof x === 'string' && x !== '', d.uid);
    fill(s, 'created', x => fin(x) && x > 0, now);
    fill(s, 'last', x => fin(x) && x > 0, now);
    for (const k of ['party', 'box', 'orphans']) fill(s, k, Array.isArray, []);
    fill(s, 'partnerId', x => x === null || typeof x === 'string', null);
    fill(s, 'dex', isObj, d.dex);
    fill(s.dex, 'seen', isObj, {}); fill(s.dex, 'caught', isObj, {}); fill(s.dex, 'legacy', Array.isArray, []);
    fill(s.dex, 'hits', isObj, {});                    // BATTLE type hints: "moveId>TYPE" -> multiplier you have seen
    fill(s, 'steps', x => Number.isInteger(x) && x >= 0, fin(s.steps) && s.steps >= 0 ? Math.floor(s.steps) : 0);
    fill(s, 'world', isObj, d.world);
    const w = s.world;
    fill(w, 'map', x => typeof x === 'string', 'proto');
    fill(w, 'x', Number.isInteger, 3); fill(w, 'y', Number.isInteger, 3);
    fill(w, 'facing', x => FACINGS.includes(x), 'down'); fill(w, 'respawn', x => x === null || x === 'hearthmoor' || x === 'fernbrook' || x === 'cobblecrest' || x === 'highcharity', null);
    // After a party wipe the Lantern House door stays shut until the party rests (additive; absent means no).
    if (w.restDue !== true) delete w.restDue;
    for (const k of ['bag', 'seals', 'flags']) fill(s, k, isObj, {});
    // D127: a switch made at the old desks (before Rook's offer) is marked desk. New switches write rook.
    // Only when the key is absent and a switch was already counted. Never overwrites. v stays 2.
    if ((+s.flags['story.switches'] || 0) > 0 && (s.flags['story.switch_via'] == null || s.flags['story.switch_via'] === ''))
      s.flags['story.switch_via'] = 'desk';
    // D193: read the old tour.doubt key once. Leave it on disk. Do not copy over a saved story.tour_unease.
    if (s.flags['story.tour_unease'] == null && fin(s.flags['tour.doubt']))
      s.flags['story.tour_unease'] = Math.max(0, Math.floor(Number(s.flags['tour.doubt']) || 0));
    // INVENTORY §7: bag counts are ints >= 1 (drop anything else); unknown item ids are kept; caps apply on grant, not on load.
    for (const k of Object.keys(s.bag)) if (!Number.isInteger(s.bag[k]) || s.bag[k] < 1) delete s.bag[k];
    fill(s, 'money', x => Number.isInteger(x) && x >= 0, 0);
    // GLIMMER_PATH v0.2 BS: per-faction Standing {keepers, glimmer}, integers within STANDING_CFG.min..max (additive, no version
    // bump). Missing or not an object -> both 0; a bad or out-of-range number is clamped; unknown keys inside survive.
    fill(s, 'standing', isObj, {});
    { const SC = typeof STANDING_CFG === 'object' && STANDING_CFG ? STANDING_CFG : { min: 0, max: 100 };
      for (const k of ['keepers', 'glimmer']) s.standing[k] = fin(s.standing[k]) ? clamp(Math.round(s.standing[k]), SC.min, SC.max) : 0; }
    // TOWN BOARD: last town whose board you stood in. A missing object becomes { lastTown: "" }. No version bump.
    fill(s, 'board', isObj, { lastTown: '' });
    if (typeof s.board.lastTown !== 'string') s.board.lastTown = '';
    // Phone book: people met, and favorites. Additive. v stays 2. Bad names are dropped.
    fill(s, 'phoneBook', isObj, { met: {}, fav: {} });
    if (!isObj(s.phoneBook.met)) s.phoneBook.met = {};
    if (!isObj(s.phoneBook.fav)) s.phoneBook.fav = {};
    const cleanNames = bag => {
      for (const k of Object.keys(bag)) {
        const key = typeof k === 'string' ? k.replace(/[<>{}]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40) : '';
        if (!key || bag[k] !== true) { delete bag[k]; continue; }
        if (key !== k) { delete bag[k]; bag[key] = true; }
      }
    };
    cleanNames(s.phoneBook.met);
    cleanNames(s.phoneBook.fav);
    // LIZZY_REP LR5 (D174, D175): sparse S.rep, additive, v stays 2. Non-strings and keys over 40 characters are
    // dropped, values clamp to 0..100, and fixed NPCs (Mom, Dad, Warden Ilse, Clerk Wynn) are not stored.
    // S.repJoins counts joins already applied so a reload never runs the penalty twice.
    fill(s, 'rep', isObj, {});
    {
      const fixedKeys = new Set();
      const cast = MD && MD.reputation && Array.isArray(MD.reputation.cast) ? MD.reputation.cast : [];
      for (const e of cast) {
        if (!e || e.fixed == null || typeof e.name !== 'string') continue;
        const key = e.name.replace(/[<>{}]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40);
        if (key) fixedKeys.add(key);
      }
      const range = MD && MD.reputation && Array.isArray(MD.reputation.range) ? MD.reputation.range : [0, 100];
      const lo = Number.isFinite(range[0]) ? range[0] : 0, hi = Number.isFinite(range[1]) ? range[1] : 100;
      for (const k of Object.keys(s.rep)) {
        if (typeof k !== 'string' || k.length > 40) { delete s.rep[k]; continue; }
        const key = k.replace(/[<>{}]/g, '').replace(/\s+/g, ' ').trim();
        const v = s.rep[k];
        if (!key || key.length > 40 || fixedKeys.has(key) || typeof v !== 'number' || !Number.isFinite(v)) { delete s.rep[k]; continue; }
        const n = clamp(Math.round(v), lo, hi);
        if (key !== k) delete s.rep[k];
        s.rep[key] = n;
      }
    }
    fill(s, 'repJoins', x => Number.isInteger(x) && x >= 0, 0);
    // QUEST_MULTI (D106): UI state, additive. ui.sideTracked = tracked side chain id (absent = not chosen); ui.sideSeen = chain
    // ids already shown on the NEXT STEP panel. Unknown keys under ui survive. No version bump.
    fill(s, 'ui', isObj, {});
    if (has(s.ui, 'sideTracked') && typeof s.ui.sideTracked !== 'string') delete s.ui.sideTracked;
    if (has(s.ui, 'sideSeen')) { if (Array.isArray(s.ui.sideSeen)) s.ui.sideSeen = s.ui.sideSeen.filter(x => typeof x === 'string'); else delete s.ui.sideSeen; }
    // ONLINE_SAVES: optional cloud sync fields, additive (no version bump). Absent stays absent (= rev 0, no real change yet).
    if (has(s, 'rev') && !(Number.isInteger(s.rev) && s.rev >= 0)) s.rev = 0;
    if (has(s, 'updatedAt') && !(fin(s.updatedAt) && s.updatedAt > 0)) delete s.updatedAt;
    fill(s, 'eggs', isObj, d.eggs);
    fill(s.eggs, 'incubators', x => Array.isArray(x) && x.length > 0, [{ egg: null }]); fill(s.eggs, 'held', Array.isArray, []);
    fill(s, 'settings', isObj, d.settings);
    fill(s, 'debugSave', x => typeof x === 'boolean', false);                          // set once a debug session has saved; never cleared
    fill(s.settings, 'textSpeed', x => TEXT_SPEEDS.includes(x), 'normal'); fill(s.settings, 'battleAnims', x => typeof x === 'boolean', true);
    fill(s.settings, 'follower', x => typeof x === 'boolean', true);                 // MAPS_SLICE K.3, additive
    fill(s.settings, 'effects', x => x === 'full' || x === 'calm' || x === 'off', (function () {
      try { if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return 'calm'; } catch (e) {}
      return 'full';
    })());                                                                          // P3a D424: full, or calm when the phone asks for reduced motion
    fill(s.settings, 'music', x => typeof x === 'boolean', true);                    // MUSIC v0.1 Q2: in the save, default on
    fill(s.settings, 'musicVol', x => typeof x === 'number' && x >= 0 && x <= 1, 0.5); // Settings volume slider: 0 to 1, default half
    fill(s.settings, 'controls', x => x === 'arcade' || x === 'modern', 'arcade');      // Q26: missing or bad = arcade, so an old save keeps the pad
    fill(s.settings, 'joystick', x => typeof x === 'boolean', false);                 // Q26 / D63: modern joystick, default off
    fill(s.settings, 'tips', x => typeof x === 'boolean', true);                      // D180: unlock tips, default on, additive
    fill(s.settings, 'showOthers', x => x === 'on' || x === 'friends' || x === 'solo', 'on');   // PLAY_TOGETHER_P1, additive, v stays 2
    fill(s, 'mapSeen', isObj, {});
    // D224: optional floorSeen { mapId: 1 }. Absent stays absent. Junk (non-object, non-1, unknown id) is dropped. v stays 2.
    if (has(s, 'floorSeen')) {
      if (!isObj(s.floorSeen)) delete s.floorSeen;
      else for (const k of Object.keys(s.floorSeen)) if (!FLOOR_SEEN_IDS.has(k) || s.floorSeen[k] !== 1) delete s.floorSeen[k];
    }
    // NEXT_PLAN WP-C: id of the last objective the player opened the QUEST panel on (additive; the objective itself is derived from flags).
    if (has(s, 'questSeen') && typeof s.questSeen !== 'string') delete s.questSeen;
    // CARE_LOOP cheap slice: today's player care record { d, steps, finds, stepBond, battleBond, firstCare } (additive; bad -> dropped).
    if (has(s, 'care')) { if (!(isObj(s.care) && typeof s.care.d === 'string')) delete s.care;
      else {
        for (const k of ['steps', 'finds', 'stepBond', 'battleBond']) s.care[k] = fin(s.care[k]) && s.care[k] >= 0 ? Math.floor(s.care[k]) : 0;
        s.care.firstCare = s.care.firstCare === true;
        if (has(s.care, 'minigameBond')) s.care.minigameBond = fin(s.care.minigameBond) && s.care.minigameBond >= 0 ? Math.min(3, Math.floor(s.care.minigameBond)) : 0;
        if (has(s.care, 'mg')) {
          if (!isObj(s.care.mg)) delete s.care.mg;
          else {
            for (const id of ['lantern', 'shells', 'chirp', 'dash', 'pairs', 'hop', 'relay', 'seek']) if (id in s.care.mg) s.care.mg[id] = fin(s.care.mg[id]) && s.care.mg[id] >= 0 ? Math.min(3, Math.floor(s.care.mg[id])) : 0;
            for (const k of Object.keys(s.care.mg)) if (!['lantern', 'shells', 'chirp', 'dash', 'pairs', 'hop', 'relay', 'seek'].includes(k)) delete s.care.mg[k];
          }
        }
      } }                                                // MAP_V0 §5 (Q2): visited region-map nodes, additive
    // MAPS_SLICE K.5 / §10: optional `player` {name, look}. Additive, no version bump; unknown keys inside survive.
    fill(s, 'player', isObj, { name: null, look: null });
    const pl = s.player;
    if (typeof pl.name !== 'string' || !pl.name.trim()) pl.name = null;
    else if (Array.from(pl.name).length > PLAYER_NAME_MAX) pl.name = Array.from(pl.name).slice(0, PLAYER_NAME_MAX).join('');
    pl.look = typeof normalizeLook === 'function' ? normalizeLook(pl.look) : (isObj(pl.look) ? pl.look : null);   // keeper.js
    fill(s, 'meta', isObj, d.meta);
    const m = s.meta;
    fill(m, 'migratedFrom', x => x === null || Number.isInteger(x), null); fill(m, 'migratedAt', x => x === null || fin(x), null);
    fill(m, 'backup', x => x === null || BACKUPS.includes(x), null); fill(m, 'legacy', isObj, {});
    // pets: fix fields, orphan unknown species, unique ids across party + box (the object itself moves)
    const used = new Set();
    const keep = (list, name) => list.filter((p, i) => {
      if (!isObj(p)) { s.orphans.push({ reason: 'not-object', from: 'v2.' + name + '[' + i + ']', at: now, raw: p }); return false; }
      // HUSHWATER B0 (D347, D357): keep the pet in party or box. v1 unknown indexes still use reason: 'unknown-species'.
      if (!isSpecies(p.species)) { fixPet(p, used, s.created, 'v1'); return true; }
      fixPet(p, used, s.created, 'v1'); return true;
    });
    s.party = keep(s.party, 'party'); s.box = keep(s.box, 'box');
    // recovery: orphans whose species id is known again go back to the box (v1-shaped orphans with raw.sp stay)
    s.orphans = s.orphans.filter(o => {
      if (isObj(o) && isObj(o.raw) && !has(o.raw, 'sp') && isSpecies(o.raw.species)) { s.box.push(fixPet(o.raw, used, s.created, 'v1')); return false; }
      return true;
    });
    if (s.party.length > PARTY_MAX) s.box.push(...s.party.splice(PARTY_MAX));
    // D188: a locked Walkling stays in the party. Evict a free party slot first. Never box the locked one to make room.
    {
      const locked = q => !!(q && q.chip && q.chip.locked);
      const held = s.box.filter(locked);
      s.box = s.box.filter(q => !locked(q));
      for (const q of held) {
        while (s.party.length >= PARTY_MAX) {
          const i = s.party.findIndex(p => !locked(p));
          if (i < 0) break;
          s.box.unshift(s.party.splice(i, 1)[0]);
        }
        s.party.push(q);
      }
    }
    if (!s.party.length && s.box.length) s.party.push(s.box.shift());
    if (!s.party.some(p => p.id === s.partnerId)) s.partnerId = s.party[0] ? s.party[0].id : null;
    keepOneRelief(s);
    placeWorld(s);
    markTutorialVeteran(s);
    return s;
  }
  // TUTORIAL D158/D159. Additive flags only. v stays 2. A veteran (past the early walk) is marked done on load
  // and never has the tour pushed on them. A bad step value is dropped. Done clears the step.
  function markTutorialVeteran(s){
    const f = s.flags; if (!f) return;
    if (has(f, 'story.tutorial_done') && f['story.tutorial_done'] !== true) delete f['story.tutorial_done'];
    if (has(f, 'story.tutorial_step') && (typeof f['story.tutorial_step'] !== 'string' || !f['story.tutorial_step'])) delete f['story.tutorial_step'];
    const past = f['story.early_done'] === true || f['story.rival1_done'] === true || (Number.isInteger(s.steps) && s.steps > 16);
    if (f['story.starter_received'] === true && past) f['story.tutorial_done'] = true;
    if (f['story.tutorial_done'] === true) delete f['story.tutorial_step'];
    // D180: a starter who has already grown up has had their grow-up moment. Mark the tip seen on load
    // so it does not pop up afterwards. Wild catches are left out (their move list is filled in ahead of time).
    // Replay tips still clears story.unlock_* and can show the card again while the partner is ready.
    const roster = (s.party || []).concat(s.box || []);
    if (roster.some(p => p && p.origin === 'starter' && p.stage >= 1)) f['story.unlock_growup'] = true;
  }

  // D420. A brand-new game earns the first five adornments. An old save has no acc.kit flag and keeps them.
  function newGameState(now){
    const s = defaultStateV2(now);
    s.flags['acc.kit'] = 2;
    return s;
  }

  // §4. Returns { state, readOnly, notice }.
  function loadSave(now = Date.now()){
    let notice = null;
    const raw2 = ls.get(V2_KEY);
    if (raw2 !== null) {
      let o = null; try { o = JSON.parse(raw2); } catch(e) { o = null; }
      if (!isObj(o) || !Number.isInteger(o.v) || o.v < 2) { writeCorrupt(V2_KEY, raw2); notice = 'recovered'; }
      else if (o.v > 2) return { state: null, readOnly: true, notice: 'newer' };
      else { owned = true; lastWritten = raw2; return { state: normalizeV2(o, now), readOnly: false, notice }; }
    }
    const raw1 = ls.get(V1_KEY);
    if (raw1 === null) return { state: newGameState(now), readOnly: false, notice };
    let o = null; try { o = JSON.parse(raw1); } catch(e) { o = null; }
    if (!isObj(o) || o.v !== 1 || !Array.isArray(o.pets)) {
      writeCorrupt(V1_KEY, raw1);
      if (ls.get(BAK_KEY) === null) ls.set(BAK_KEY, raw1);
      return { state: newGameState(now), readOnly: false, notice };
    }
    let backup;
    if (ls.get(BAK_KEY) === null) backup = ls.set(BAK_KEY, raw1) ? 'ok' : 'failed'; else backup = 'existing';
    const state = normalizeV2(migrateV1toV2(o, now, backup), now);
    const str = JSON.stringify(state);
    if (ls.set(V2_KEY, str)) { owned = true; lastWritten = str; }   // raw write: keeps state.last so boot's catch-up still applies the away-time
    return { state, readOnly: false, notice };
  }
  // Never fight an outside change to the v2 key from an open page:
  // - removed (the README's manual restore: remove the key and reload; the unload/periodic save would put it back),
  // - replaced by a save from a newer build (e.g. another tab), which must never be overwritten (§7.1).
  // - replaced by a different game (another uid: Start over, or a fresh game, in another tab), which this page must not overwrite.
  // In all cases stop writing until the next load. Same-game writes from another tab (same uid): last writer wins, as in v1.
  let owned = false, detached = false, lastWritten = null;
  function outsideChange(state){
    const cur = ls.get(V2_KEY);
    if (cur === lastWritten) return null;
    if (cur === null) return owned ? 'removed' : null;
    let o = null; try { o = JSON.parse(cur); } catch(e) {}
    if (isObj(o) && Number.isInteger(o.v) && o.v > 2) return 'newer';
    return isObj(o) && o.v === 2 && typeof o.uid === 'string' && state && o.uid !== state.uid ? 'other' : null;
  }
  const WHY = { newer: 'replaced by a newer version', removed: 'removed from storage', other: 'replaced by a different game (Start over in another tab?)' };
  function writeV2(state){
    if (detached) return false;
    const why = outsideChange(state);
    if (why) { detached = true; console.info('Walklings: the save was ' + WHY[why] + '; not saving again until you reload.'); return false; }
    const str = JSON.stringify(state);
    if (!ls.set(V2_KEY, str)) return false;
    owned = true; lastWritten = str; return true;
  }

  // Start over (Friends tab): erase the game (v2, v1 and its .bak so migration can't bring old pets back, plus the corrupt-save
  // record) and stop this page from saving; the caller reloads. Device prefs (mute, geo, env, fast, debug) are kept.
  const GAME_KEYS = [V2_KEY, V1_KEY, BAK_KEY, CORRUPT_KEY];
  const CLOUD_KEYS = ['pixelpets.cloud', 'pixelpets.cloud.backup', 'pixelpets.net'];   // ONLINE_SAVES bookkeeping, plus Play together device key
  function startOver(){
    detached = true;
    GAME_KEYS.concat(CLOUD_KEYS).forEach(k => { try { localStorage.removeItem(k); } catch(e) {} });
    return GAME_KEYS.every(k => ls.get(k) === null);
  }

  // A file copy of the live v2 save. v stays 2. Device prefs are not in the file.
  // readCopy accepts only a v2 object. installCopy writes it as the current game (the caller reloads).
  function readCopy(text){
    if (typeof text !== 'string' || !text) return { ok: false, reason: 'bad' };
    if (text.length > 2000000) return { ok: false, reason: 'big' };
    let o = null; try { o = JSON.parse(text); } catch(e) { o = null; }
    if (!isObj(o) || !Number.isInteger(o.v)) return { ok: false, reason: 'bad' };
    if (o.v > 2) return { ok: false, reason: 'newer' };
    if (o.v !== 2) return { ok: false, reason: 'bad' };
    return { ok: true, state: normalizeV2(o, Date.now()) };
  }
  function installCopy(state){
    if (!isObj(state) || state.v !== 2) return false;
    detached = false;
    const str = JSON.stringify(state);
    if (!ls.set(V2_KEY, str)) return false;
    owned = true; lastWritten = str; return true;
  }

  // Dev check (§2): the frozen v1 table and the append-only form-id table must match sprites.js, and species ids must be unique.
  // Returns the list of problems (empty = fine); each one is also logged as a console error.
  function devCheck(){
    const ids = SPECIES.map(s => s.id), out = [], err = m => { out.push(m); console.error('Walklings: ' + m); };
    const bad = V1_SPECIES.filter((id, i) => ids[i] !== id);
    if (bad.length) err('SPECIES order/ids no longer match the frozen V1_SPECIES table: ' + bad.join(', '));
    const off = SPECIES_IDS.filter((id, i) => i >= V1_SPECIES.length && ids[i] !== id), extra = ids.slice(SPECIES_IDS.length);
    if (off.length || extra.length) err('SPECIES order/ids no longer match the save form-id table (append new ids to SPECIES_IDS): ' + off.concat(extra).join(', '));
    const forms = SPECIES.flatMap(sp => sp.stages.map((st, k) => sp.id + '/' + k)).filter(f => !FORM_IDS.includes(f));
    if (forms.length) err('forms missing from the save form-id table: ' + forms.join(', '));
    if (new Set(ids).size !== ids.length) err('duplicate species ids in SPECIES');
    return out;
  }

  return Object.freeze({ PLAYER_NAME_MAX, V1_KEY, V2_KEY, BAK_KEY, CORRUPT_KEY, GAME_KEYS, startOver, readCopy, installCopy, V1_SPECIES, SPECIES_IDS, FORM_IDS, PARTY_MAX, formId, isSpecies,
    defaultStateV2, startWorld, MAPS, MAP_SIZE, migrateV1toV2, normalizeV2, loadSave, writeV2, devCheck });
})();
