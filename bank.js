/* Walklings - the Acorn Account's book and ledger (BANK_AND_HOMES v0.1, design repo, private; D2220-D2249; first slice).
   No DOM and no save of its own. game.js writes every change to the bag (S.money) through moneyDelta(src, n, ref), which calls
   PPBank.add on S.bank; the account sheet #ovBank reads PPBank.days / summary / remark and paints them.

   S.bank.led   [[d, src, n, ref?]]  d 'YYYY-MM-DD' (the real local day), src one of SRC, n a signed integer, ref an id of 24 or less.
                                     Oldest first. A new line with the same day, src and ref as a line already on that day adds into
                                     it and becomes the newest (D2234: thirty wild wins make one "Wild walks" line).
   S.bank.fold  [[ym, in, out]]      'YYYY-MM' and two integers of 0 or more. Past 60 lines, the oldest lines fold into their month's
                                     row; past 12 rows the oldest row drops.
   The bag is never touched here, and nothing here can make a balance go below 0 (moneyDelta clamps; §2 rule 1).
   Save stays pixelpets.save.v2, v 2; save.js normalizeV2 fills and cleans these fields (§12). */
(function (root) {
  'use strict';

  // §3.5 memo sources. Later slices write jar_in .. exch; `open` is the "Brought forward" line; `debug` is ?debug=1 only.
  const SRC = Object.freeze(['hall', 'holder', 'wild', 'find', 'event', 'tourney', 'clip', 'scene', 'shop', 'look', 'meal', 'rest',
    'dawn', 'jar_in', 'jar_out', 'tin', 'home', 'pass', 'plate', 'share', 'seed', 'goods', 'exch', 'debug', 'open']);
  const LED_MAX = 60, FOLD_MAX = 12, REF_MAX = 24;
  // Sources that are not income or spending: left out of the Yesterday card and the month folds' totals.
  const NOT_PLAY = Object.freeze(['open', 'debug']);

  // §3.7 (D2231): the dawn dividend. Flat with a small step and a cap, paid into the bag, so it never compounds; days away earn
  // nothing extra and lose nothing. PLACEHOLDER numbers (Q-BANK-12).
  const DAWN = Object.freeze({ base: 5, per: 200, cap: 12 });
  const dividend = inJars => Math.min(DAWN.cap, DAWN.base + Math.floor(Math.max(0, inJars | 0) / DAWN.per));

  const isDay = d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
  const isRef = r => typeof r === 'string' && r.length >= 1 && r.length <= REF_MAX;
  const refOf = row => (row.length > 3 && isRef(row[3]) ? row[3] : '');

  // The shape every write needs, made on first write (never at load).
  function ensure(S){
    if (!S.bank || typeof S.bank !== 'object' || Array.isArray(S.bank)) S.bank = {};
    const b = S.bank;
    if (!Array.isArray(b.led)) b.led = [];
    if (!Array.isArray(b.fold)) b.fold = [];
    if (!Array.isArray(b.jars)) b.jars = [];
    if (!b.shares || typeof b.shares !== 'object' || Array.isArray(b.shares)) b.shares = {};
    return b;
  }

  function foldLine(b, row){
    const ym = row[0].slice(0, 7), n = row[2] | 0;
    if (NOT_PLAY.indexOf(row[1]) >= 0) return;   // "Brought forward" and debug writes are not income or spending
    let f = b.fold.length ? b.fold[b.fold.length - 1] : null;
    if (!f || f[0] !== ym) { f = b.fold.find(x => x[0] === ym) || null; }
    if (!f) { f = [ym, 0, 0]; b.fold.push(f); b.fold.sort((x, y) => (x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : 0)); }
    if (n > 0) f[1] += n; else f[2] += -n;
    while (b.fold.length > FOLD_MAX) b.fold.shift();
  }

  // One memo line. Returns the line written or merged into.
  function add(b, d, src, n, ref){
    n = Math.trunc(Number(n)) || 0;
    if (!n || !isDay(d) || SRC.indexOf(src) < 0) return null;
    const r = isRef(ref) ? ref : '';
    let i = -1;
    for (let k = b.led.length - 1; k >= 0; k--) {
      const row = b.led[k];
      if (row[0] !== d) { if (row[0] < d) break; continue; }
      if (row[1] === src && refOf(row) === r) { i = k; break; }
    }
    let row;
    if (i >= 0) { row = b.led.splice(i, 1)[0]; row[2] += n; }
    else row = r ? [d, src, n, r] : [d, src, n];
    b.led.push(row);
    while (b.led.length > LED_MAX) foldLine(b, b.led.shift());
    return row;
  }

  const inJars = b => ((b && Array.isArray(b.jars)) ? b.jars : []).reduce((t, j) => t + (j && Number.isInteger(j.saved) && j.saved > 0 ? j.saved : 0), 0);

  // The ledger by day, newest day first, each day's lines newest first: [{ d, rows: [[d, src, n, ref?]] }].
  function days(b){
    const out = [], led = (b && b.led) || [];
    for (let k = led.length - 1; k >= 0; k--) {
      const row = led[k];
      let g = out.length ? out[out.length - 1] : null;
      if (!g || g.d !== row[0]) { g = out.find(x => x.d === row[0]) || null; if (!g) { g = { d: row[0], rows: [] }; out.push(g); } }
      g.rows.push(row);
    }
    out.sort((x, y) => (x.d < y.d ? 1 : x.d > y.d ? -1 : 0));
    return out;
  }
  const lately = (b, n) => { const led = (b && b.led) || []; return led.slice(Math.max(0, led.length - (n || 4))).reverse(); };

  // Whole days between two YYYY-MM-DD keys (b after a).
  function dayGap(a, b){
    if (!isDay(a) || !isDay(b)) return 0;
    const t = s => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
    return Math.round((t(b) - t(a)) / 86400000);
  }

  // §3.7 the Yesterday card: the totals of the last day played before today, or null when the book has no earlier day.
  // `gap` is how far back that day is (1 = yesterday). The card never shows the gap as a count (no "days away", D867).
  function summary(b, today){
    const led = (b && b.led) || [];
    let last = null;
    for (let k = led.length - 1; k >= 0; k--) {
      const row = led[k];
      if (row[0] < today && NOT_PLAY.indexOf(row[1]) < 0) { last = row[0]; break; }
    }
    if (!last) return null;
    let cameIn = 0, wentOut = 0, hall = false, n = 0;
    for (const row of led) {
      if (row[0] !== last || NOT_PLAY.indexOf(row[1]) >= 0) continue;
      n++;
      if (row[2] > 0) cameIn += row[2]; else wentOut += -row[2];
      if (row[1] === 'hall') hall = true;
    }
    let dawn = 0;
    for (const row of led) if (row[0] === today && row[1] === 'dawn') dawn += row[2];
    return { day: last, gap: dayGap(last, today), cameIn, wentOut, lines: n, hall, dawn };
  }

  // §3.7 one teller remark keyed to what happened. Story writes the 30-line pool (PLACEHOLDER; OPEN_DECISIONS D2231-copy);
  // these are the packet's two examples, first match wins, '' for none.
  const REMARKS = Object.freeze([
    Object.freeze({ when: s => s.hall, line: 'A Hall win. The Masters will talk.' }),
    Object.freeze({ when: s => s.cameIn + s.wentOut < 50, line: 'A quiet day. Quiet days count too.' }),
  ]);
  function remark(s){
    if (!s) return '';
    const r = REMARKS.find(x => x.when(s));
    return r ? r.line : '';
  }

  // Memo text for one line. `R` resolves ids against the game's data (game.js passes it):
  // { place(ref), holder(ref), item(ref), look(ref), meal(ref), store(ref), scene(ref), event(ref) }, each returning '' when unknown.
  const SCENE_MEMO = Object.freeze({ ans_close: 'The Answerers', juniper_bonus: "Juniper's bonus",
    museum_gift: 'Museum gift' });   // §3.5 `scene` labels; museum_gift: WAR_MUSEUM §2.2 (D2308), the donation lantern
  function memo(row, R){
    const src = row[1], ref = refOf(row), r = R || {};
    const call = (k, v) => (typeof r[k] === 'function' ? (r[k](v) || '') : '');
    const pair = (a, b) => (a && b ? a + ', ' + b : a || b);
    switch (src) {
      case 'hall': return pair('Hall win', call('place', ref));
      case 'holder': return pair('Holder win', call('place', ref));
      case 'wild': return 'Wild walks';
      case 'find': return 'Walk finds';
      case 'event': return 'Event Hall';
      case 'tourney': return 'Tourney ribbon';
      case 'clip': return 'Scrapbook clips';
      case 'scene': return SCENE_MEMO[ref] || call('scene', ref) || 'Acorns received';   // PLACEHOLDER fallback (D2234-copy)
      case 'shop': { const [st, it] = ref.indexOf('.') > 0 ? ref.split('.') : ['', ref]; return pair(call('store', st), call('item', it) || it); }
      case 'look': { const [st, it] = ref.indexOf('.') > 0 ? ref.split('.') : ['', ref]; return pair(call('store', st), call('look', it) || it); }
      case 'meal': return call('meal', ref) || 'A meal';
      case 'rest': return 'Lantern House rest';
      case 'dawn': return 'Dawn dividend';
      case 'debug': return 'Debug';
      case 'open': return 'Brought forward';
      default: return src;
    }
  }
  // The optional 14 px sub-line (§3.4 LEDGER): who, for a win; the stamp, for the dividend.
  function subline(row, R){
    const src = row[1], ref = refOf(row), r = R || {};
    if ((src === 'hall' || src === 'holder') && typeof r.holder === 'function') return r.holder(ref) || '';
    if (src === 'dawn') return 'stamped at first open';
    return '';
  }

  function devCheck(){
    const bad = [], b = { led: [], fold: [], jars: [], shares: {} };
    for (let i = 0; i < 30; i++) add(b, '2026-11-04', 'wild', 2);
    if (b.led.length !== 1 || b.led[0][2] !== 60) bad.push('same-day same-source lines did not merge');
    for (let i = 0; i < 70; i++) add(b, '2026-10-' + String(1 + (i % 28)).padStart(2, '0'), 'shop', -1, 'x' + i);
    if (b.led.length > LED_MAX) bad.push('ledger over ' + LED_MAX);
    if (!b.fold.length) bad.push('no fold row after overflow');
    if (dividend(0) !== 5 || dividend(1400) !== 12 || dividend(99999) !== 12) bad.push('dividend math');
    return bad;
  }

  const api = { SRC, LED_MAX, FOLD_MAX, REF_MAX, DAWN, NOT_PLAY, ensure, add, inJars, days, lately, summary, remark, memo, subline, dividend,
    dayGap, isDay, isRef, devCheck };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.PPBank = Object.freeze(api);
})(typeof window !== 'undefined' ? window : globalThis);
