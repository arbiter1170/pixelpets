/* PixelPets save format v2 + v1 -> v2 migration (design spec SAVE_V2).
   - v2 lives in `pixelpets.save.v2`. The v1 key is read only for migration and never written or deleted.
   - Before the first v2 write, the raw v1 string is copied once to `pixelpets.save.v1.bak` (only if absent).
   - Unreadable saves are copied to `pixelpets.save.corrupt` ({at, from, raw}; latest wins).
   - Unknown fields survive everywhere; unknown v1 top-level fields go to meta.legacy.
   - Device prefs (pixelpets.fast/debug/mute/geo/env/envOverride) are never read, moved or deleted here.
   Needs SPECIES (sprites.js) and EVO_XP/STAT_RULES/levelOf/maxHpOf (stats.js). Pure functions + loadSave(); game.js owns save() timing. */
'use strict';
const PPSave = (() => {
  const V1_KEY = 'pixelpets.save.v1', V2_KEY = 'pixelpets.save.v2', BAK_KEY = 'pixelpets.save.v1.bak', CORRUPT_KEY = 'pixelpets.save.corrupt';
  // Frozen forever: v1 stored species by array index. Never derive this from SPECIES order.
  const V1_SPECIES = Object.freeze(['ember', 'tide', 'bloom', 'stone', 'volt', 'frost', 'gust', 'shade']);
  const PARTY_MAX = 6;
  const MAPS = ['proto'];                       // the only map today (the 24x20 Walk map)
  const MAP_W = 24, MAP_H = 20;
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
  const warnOnce = (msg, e) => { if (!warned) { warned = true; console.warn('PixelPets: ' + msg, e && e.message ? e.message : ''); } };
  const ls = {
    get(k){ try { return localStorage.getItem(k); } catch(e) { return null; } },
    set(k, v){ try { localStorage.setItem(k, v); return true; } catch(e) { warnOnce("couldn't write the save (storage full or blocked); playing in memory.", e); return false; } },
  };
  function writeCorrupt(from, raw){ ls.set(CORRUPT_KEY, JSON.stringify({ at: Date.now(), from, raw })); }

  function defaultStateV2(now = Date.now()){
    return { v: 2, uid: rid(12), created: now, last: now, party: [], box: [], partnerId: null, orphans: [],
      dex: { seen: {}, caught: {}, legacy: [] }, steps: 0, world: { map: 'proto', x: 3, y: 3, facing: 'down', respawn: null },
      bag: {}, money: 0, seals: {}, flags: {}, eggs: { incubators: [{ egg: null }], held: [] },
      settings: { textSpeed: 'normal', battleAnims: true },
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
    if (has(q, 'sr')) q.sr = fin(q.sr) ? Math.max(0, Math.floor(q.sr)) : 0;
    if (!has(q, 'nick') || (q.nick !== null && typeof q.nick !== 'string')) q.nick = null;
    if (!has(q, 'origin') || typeof q.origin !== 'string') q.origin = originDefault;
    // TYPES_STATS §5: battle XP. Missing/invalid -> the old display level (1 + floor(xp/10)) kept within Lv 5..10.
    if (!(Number.isInteger(q.bx) && q.bx >= 0)) q.bx = STAT_RULES.bxForLevel(migratedLevel(q.xp));
    else if (q.bx > BX_CAP) q.bx = BX_CAP;
    // TYPES_STATS §7: current HP, optional (absent = full). Bad values or full HP -> absent.
    if (has(q, 'hpNow') && (!fin(q.hpNow) || q.hpNow < 0 || q.hpNow >= maxHpOf(q))) delete q.hpNow;
    return q;
  }
  const formId = (species, stage) => species + '/' + stage;

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
    fill(s, 'steps', x => Number.isInteger(x) && x >= 0, fin(s.steps) && s.steps >= 0 ? Math.floor(s.steps) : 0);
    fill(s, 'world', isObj, d.world);
    const w = s.world;
    fill(w, 'map', x => typeof x === 'string', 'proto');
    if (!MAPS.includes(w.map)) { w.map = 'proto'; w.x = 3; w.y = 3; }
    fill(w, 'x', Number.isInteger, 3); fill(w, 'y', Number.isInteger, 3);
    fill(w, 'facing', x => FACINGS.includes(x), 'down'); fill(w, 'respawn', x => x === null || typeof x === 'string', null);
    for (const k of ['bag', 'seals', 'flags']) fill(s, k, isObj, {});
    fill(s, 'money', x => Number.isInteger(x) && x >= 0, 0);
    fill(s, 'eggs', isObj, d.eggs);
    fill(s.eggs, 'incubators', x => Array.isArray(x) && x.length > 0, [{ egg: null }]); fill(s.eggs, 'held', Array.isArray, []);
    fill(s, 'settings', isObj, d.settings);
    fill(s.settings, 'textSpeed', x => TEXT_SPEEDS.includes(x), 'normal'); fill(s.settings, 'battleAnims', x => typeof x === 'boolean', true);
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
  // In both cases stop writing until the next load. Same-version writes from another tab: last writer wins, as in v1.
  let owned = false, detached = false, lastWritten = null;
  function outsideChange(){
    const cur = ls.get(V2_KEY);
    if (cur === lastWritten) return null;
    if (cur === null) return owned ? 'removed' : null;
    let o = null; try { o = JSON.parse(cur); } catch(e) {}
    return isObj(o) && Number.isInteger(o.v) && o.v > 2 ? 'newer' : null;
  }
  function writeV2(state){
    if (detached) return false;
    const why = outsideChange();
    if (why) { detached = true; console.info('PixelPets: the save was ' + (why === 'newer' ? 'replaced by a newer version' : 'removed from storage') + '; not saving again until you reload.'); return false; }
    const str = JSON.stringify(state);
    if (!ls.set(V2_KEY, str)) return false;
    owned = true; lastWritten = str; return true;
  }

  // Dev check (§2): the frozen v1 table must match sprites.js, and species ids must be unique.
  function devCheck(){
    const ids = SPECIES.map(s => s.id), bad = V1_SPECIES.filter((id, i) => ids[i] !== id);
    if (bad.length) console.error('PixelPets: SPECIES order/ids no longer match the frozen V1_SPECIES table:', bad.join(', '));
    if (new Set(ids).size !== ids.length) console.error('PixelPets: duplicate species ids in SPECIES');
  }

  return Object.freeze({ V1_KEY, V2_KEY, BAK_KEY, CORRUPT_KEY, V1_SPECIES, PARTY_MAX, formId, isSpecies,
    defaultStateV2, migrateV1toV2, normalizeV2, loadSave, writeV2, devCheck });
})();
