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
  // Adding ids keeps the save at v2; never remove, rename or reorder one. 14 lines x 3 stages = 42 form ids.
  const SPECIES_IDS = Object.freeze([...V1_SPECIES, 'beetle', 'mole', 'crab', 'moth', 'vane', 'dormouse']);
  const FORM_IDS = Object.freeze(SPECIES_IDS.flatMap(id => [0, 1, 2].map(k => id + '/' + k)));
  const PARTY_MAX = 6;
  // MAPS_SLICE §10 / INTERIORS §5 / ACT1_ROUTE2 §0.2 / COBBLECREST mapdata: ids and sizes from data/mapdata.js.
  const MD = typeof MAPDATA === 'object' ? MAPDATA : null;
  const MAP_SIZE = {};
  const addMaps = bag => { if (bag) for (const [id, m] of Object.entries(bag)) if (m && m.w && m.h) MAP_SIZE[id] = [m.w, m.h]; };
  if (MD) { addMaps(MD.maps_slice.maps); addMaps(MD.act1_route2 && MD.act1_route2.maps); addMaps(MD.interiors.maps); addMaps(MD.cobblecrest && MD.cobblecrest.maps); addMaps(MD.cobblecrest && MD.cobblecrest.rooms); }
  else MAP_SIZE.proto = [24, 20];
  const MAPS = Object.keys(MAP_SIZE);
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
      bag: {}, money: 0, seals: {}, flags: {}, eggs: { incubators: [{ egg: null }], held: [] },
      settings: { textSpeed: 'normal', battleAnims: true, follower: true, music: true, musicVol: 0.5 },
      player: { name: null, look: null },
      meta: { migratedFrom: null, migratedAt: null, backup: null, legacy: {} } };
  }

  // §5 step 2.4: field fixes for one pet (also used by normalizeV2). `used` = ids already taken.
  // Later specs add their per-pet defaults here (additive fields, no version bump).
  function fixPet(q, used, created, originDefault){
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
    // TYPES_STATS §5: battle XP. Missing/invalid -> the old display level (1 + floor(xp/10)) kept within Lv 5..10.
    if (!(Number.isInteger(q.bx) && q.bx >= 0)) q.bx = STAT_RULES.bxForLevel(migratedLevel(q.xp));
    else if (q.bx > BX_CAP) q.bx = BX_CAP;
    // TYPES_STATS §7: current HP, optional (absent = full). Bad values or full HP -> absent.
    if (has(q, 'hpNow') && (!fin(q.hpNow) || q.hpNow < 0 || q.hpNow >= maxHpOf(q))) delete q.hpNow;
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
    fill(w, 'facing', x => FACINGS.includes(x), 'down'); fill(w, 'respawn', x => x === null || x === 'hearthmoor' || x === 'fernbrook' || x === 'cobblecrest', null);
    for (const k of ['bag', 'seals', 'flags']) fill(s, k, isObj, {});
    // INVENTORY §7: bag counts are ints >= 1 (drop anything else); unknown item ids are kept; caps apply on grant, not on load.
    for (const k of Object.keys(s.bag)) if (!Number.isInteger(s.bag[k]) || s.bag[k] < 1) delete s.bag[k];
    fill(s, 'money', x => Number.isInteger(x) && x >= 0, 0);
    // ONLINE_SAVES: optional cloud sync fields, additive (no version bump). Absent stays absent (= rev 0, no real change yet).
    if (has(s, 'rev') && !(Number.isInteger(s.rev) && s.rev >= 0)) s.rev = 0;
    if (has(s, 'updatedAt') && !(fin(s.updatedAt) && s.updatedAt > 0)) delete s.updatedAt;
    fill(s, 'eggs', isObj, d.eggs);
    fill(s.eggs, 'incubators', x => Array.isArray(x) && x.length > 0, [{ egg: null }]); fill(s.eggs, 'held', Array.isArray, []);
    fill(s, 'settings', isObj, d.settings);
    fill(s.settings, 'textSpeed', x => TEXT_SPEEDS.includes(x), 'normal'); fill(s.settings, 'battleAnims', x => typeof x === 'boolean', true);
    fill(s.settings, 'follower', x => typeof x === 'boolean', true);                 // MAPS_SLICE K.3, additive
    fill(s.settings, 'music', x => typeof x === 'boolean', true);                    // MUSIC v0.1 Q2: in the save, default on
    fill(s.settings, 'musicVol', x => typeof x === 'number' && x >= 0 && x <= 1, 0.5); // Q3: no slider yet; the key is ready
    fill(s, 'mapSeen', isObj, {});
    // CARE_LOOP cheap slice: today's player care record { d, steps, finds, stepBond, battleBond, firstCare } (additive; bad -> dropped).
    if (has(s, 'care')) { if (!(isObj(s.care) && typeof s.care.d === 'string')) delete s.care;
      else { for (const k of ['steps', 'finds', 'stepBond', 'battleBond']) s.care[k] = fin(s.care[k]) && s.care[k] >= 0 ? Math.floor(s.care[k]) : 0; s.care.firstCare = s.care.firstCare === true; } }                                                // MAP_V0 §5 (Q2): visited region-map nodes, additive
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
      if (!isSpecies(p.species)) { s.orphans.push({ reason: 'unknown-species', from: 'v2.' + name + '[' + i + ']', at: now, raw: p }); return false; }
      fixPet(p, used, s.created, 'v1'); return true;
    });
    s.party = keep(s.party, 'party'); s.box = keep(s.box, 'box');
    // recovery: orphans whose species id is known again go back to the box (v1-shaped orphans with raw.sp stay)
    s.orphans = s.orphans.filter(o => {
      if (isObj(o) && isObj(o.raw) && !has(o.raw, 'sp') && isSpecies(o.raw.species)) { s.box.push(fixPet(o.raw, used, s.created, 'v1')); return false; }
      return true;
    });
    if (s.party.length > PARTY_MAX) s.box.push(...s.party.splice(PARTY_MAX));
    if (!s.party.length && s.box.length) s.party.push(s.box.shift());
    if (!s.party.some(p => p.id === s.partnerId)) s.partnerId = s.party[0] ? s.party[0].id : null;
    placeWorld(s);
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
    if (raw1 === null) return { state: defaultStateV2(now), readOnly: false, notice };
    let o = null; try { o = JSON.parse(raw1); } catch(e) { o = null; }
    if (!isObj(o) || o.v !== 1 || !Array.isArray(o.pets)) {
      writeCorrupt(V1_KEY, raw1);
      if (ls.get(BAK_KEY) === null) ls.set(BAK_KEY, raw1);
      return { state: defaultStateV2(now), readOnly: false, notice };
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
  const CLOUD_KEYS = ['pixelpets.cloud', 'pixelpets.cloud.backup'];   // ONLINE_SAVES: device sync bookkeeping + the "game not kept" backup
  function startOver(){
    detached = true;
    GAME_KEYS.concat(CLOUD_KEYS).forEach(k => { try { localStorage.removeItem(k); } catch(e) {} });
    return GAME_KEYS.every(k => ls.get(k) === null);
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

  return Object.freeze({ PLAYER_NAME_MAX, V1_KEY, V2_KEY, BAK_KEY, CORRUPT_KEY, GAME_KEYS, startOver, V1_SPECIES, SPECIES_IDS, FORM_IDS, PARTY_MAX, formId, isSpecies,
    defaultStateV2, startWorld, MAPS, MAP_SIZE, migrateV1toV2, normalizeV2, loadSave, writeV2, devCheck });
})();
