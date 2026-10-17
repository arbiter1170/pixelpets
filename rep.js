/* Walklings reputation (LIZZY_REP v0.2 LR5, D174, D175, D178). Pure data plus small resolvers.
   No DOM. game.js owns S.rep, the scene step, cond(), the join penalty and the PEOPLE list.
   save.js clamps the saved numbers. Loaded after standing.js. MAPDATA.reputation is the table.

   Lizzy C calls this API. Keep the names stable:
     PPRep.bind({ state: () => S, side: () => side() })
     PPRep.repGet(name)        raw number (fixed, else S.rep[key], else base). Unknown names return the table base.
     PPRep.repAdd(name, n, why) clamp 0..100, sparse (a value that returns to base is deleted). Fixed names no-op.
                               The first real change sets S.flags['unlock.rep'] once and, if present, calls
                               window.PPRepUnlock(name, value, why). That hook is the LR9 stub. A join penalty
                               goes through repAdd, so it counts as a change.
     PPRep.repTier(name)       tier id of the effective value (raw + alignment).
     PPRep.repEffective(name)  raw + 10 if the NPC's faction is your side, -10 if it is the other side, 0 for none or fixed.
     PPRep.sources()           live array MAPDATA.reputation.sources. Lizzy C only appends entries.
     PPRep.entry(name) / key(name) / tierRank(id) / devCheck(names)

   A source entry (empty in this packet; the leak rows arrive with Lizzy C):
     { who: name or "*", flag, eq?: value the flag must equal (omit = any truthy value),
       delta: signed int, line: text without the sign,
       open?: text for a "?" row while the flag is unset, when?: cond string }
   The card writes (delta > 0 ? "+" : "") + delta + " " + line when the flag matches, and "? " + open otherwise.
   Do not invent those lines here. */
(function (root) {
  'use strict';
  let stateFn = function () { return null; };
  let sideFn = function () { return 'keepers'; };

  const cfg = () => (typeof MAPDATA === 'object' && MAPDATA && MAPDATA.reputation) || null;
  const rangeOf = () => { const c = cfg(), r = c && c.range; return (r && r.length === 2) ? r : [0, 100]; };
  const baseOf = () => { const c = cfg(); return (c && Number.isFinite(c.base)) ? c.base : 50; };
  const clamp = n => { const r = rangeOf(); return Math.max(r[0], Math.min(r[1], Math.round(n))); };

  function key(name) {
    if (typeof name !== 'string') return '';
    return name.replace(/[<>{}]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40);
  }

  let castCache = null;
  function byKey() {
    if (castCache) return castCache;
    const m = new Map();
    const list = (cfg() && cfg().cast) || [];
    for (const e of list) {
      if (!e || typeof e.name !== 'string') continue;
      const k = key(e.name);
      if (k && !m.has(k)) m.set(k, e);
    }
    castCache = m;
    return m;
  }
  const entry = name => byKey().get(key(name)) || null;
  const isFixed = e => !!(e && e.fixed != null && Number.isFinite(+e.fixed));

  function bind(opts) {
    if (opts && typeof opts.state === 'function') stateFn = opts.state;
    if (opts && typeof opts.side === 'function') sideFn = opts.side;
  }
  function sideNow() {
    const s = sideFn();
    return s === 'glimmer' ? 'glimmer' : 'keepers';
  }

  function repGet(name) {
    const e = entry(name);
    if (!e) return baseOf();
    if (isFixed(e)) return clamp(e.fixed);
    const S = stateFn();
    const k = key(name);
    if (S && S.rep && typeof S.rep === 'object' && Number.isFinite(S.rep[k])) return clamp(S.rep[k]);
    return clamp(e.base != null ? e.base : baseOf());
  }

  // +10 same faction, -10 the other faction, 0 for none or a fixed NPC. Dialog tiers use this. The compass number does not.
  function align(e) {
    if (!e || isFixed(e) || e.faction === 'none' || !e.faction) return 0;
    const sd = sideNow();
    if (e.faction === sd) return 10;
    if (e.faction === 'keepers' || e.faction === 'glimmer') return -10;
    return 0;
  }
  const repEffective = name => clamp(repGet(name) + align(entry(name)));

  function tierAt(n) {
    const tiers = (cfg() && cfg().tiers) || [];
    for (const t of tiers) if (n >= t.min && n <= t.max) return t.id;
    return tiers.length ? tiers[0].id : 'neutral';
  }
  const repTier = name => tierAt(repEffective(name));
  function tierRank(id) {
    const tiers = (cfg() && cfg().tiers) || [];
    for (let i = 0; i < tiers.length; i++) if (tiers[i].id === id) return i;
    return -1;
  }

  function repAdd(name, n, why) {
    const e = entry(name);
    const cur = repGet(name);
    if (!e || isFixed(e)) return cur;
    n = Number(n);
    if (!Number.isFinite(n) || n === 0) return cur;
    const S = stateFn();
    if (!S) return cur;
    if (!S.rep || typeof S.rep !== 'object' || Array.isArray(S.rep)) S.rep = {};
    const after = clamp(cur + n);
    if (after === cur) return after;
    const k = key(name);
    const base = clamp(e.base != null ? e.base : baseOf());
    if (after === base) delete S.rep[k];
    else S.rep[k] = after;
    if (!S.flags || typeof S.flags !== 'object') S.flags = {};
    if (!S.flags['unlock.rep']) {
      S.flags['unlock.rep'] = true;
      if (typeof root.PPRepUnlock === 'function') {
        try { root.PPRepUnlock(name, after, why || ''); } catch (err) {}
      }
    }
    return after;
  }

  function sources() {
    const c = cfg();
    return (c && Array.isArray(c.sources)) ? c.sources : [];
  }

  function devCheck(names) {
    const problems = [];
    const seen = new Set();
    for (const n of names || []) {
      const k = key(n);
      if (!k || seen.has(k)) continue;
      seen.add(k);
      if (!entry(n)) problems.push('no cast entry: ' + n);
    }
    const c = cfg();
    if (!c) problems.push('reputation data missing');
    else if (!Array.isArray(c.tiers) || c.tiers.length !== 5) problems.push('reputation tiers');
    return problems;
  }

  root.PPRep = {
    bind, key, entry, isFixed: name => isFixed(typeof name === 'string' ? entry(name) : name),
    repGet, repAdd, repTier, repEffective, tierAt, tierRank, alignOf: name => align(entry(name)),
    sources, devCheck,
  };
})(window);
