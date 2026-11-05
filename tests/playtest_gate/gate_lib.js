/* PLAYTEST_GATE v0.1 (tests/playtest_gate/PACKET.md): the seeder (§3.1), the settle (§3.2), the save diff (§3.3), the error and
   network guard (§3.4), the scene driver (§4) and the game.js splice (§6.3). Players never load this file. */
const F = require('./gate_fixtures');

const SAVE_KEY = 'pixelpets.save.v2';
const FIREBASE = /gstatic\.com\/firebasejs|googleapis\.com|firebaseio\.com|firebaseapp\.com/;
const AUTOSAVE_MS = 5000;

/* ---------- §3.1 seeding ---------- */

function localDay() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
// The seed string, made in Node. JSON.parse(raw) is the before copy.
function seedRaw(s) {
  const day = localDay();
  s.last = Date.now();
  s.flags['daily.hello'] = day;
  s.flags['daily.warm_bowl'] = day;
  return JSON.stringify(s);
}
// Runs in the page on every load of the tab. The seed lands once per tab, so a reload reads what the game stored.
function seedScript(raw) {
  if (!sessionStorage.getItem('pp_gate_seeded')) {
    sessionStorage.setItem('pp_gate_seeded', '1');
    localStorage.setItem('pixelpets.save.v2', raw);
    localStorage.setItem('pixelpets.geo', 'deny');
    localStorage.setItem('pixelpets.mute', '1');
  }
  window.ppGateWrites = [];
  window.ppAtBoot = undefined;
  window.ppSeedRaw = raw;
  // The game sets window.PixelPets last in boot, after the load, the old-save move and the load-time saves.
  let api;
  Object.defineProperty(window, 'PixelPets', {
    configurable: true,
    get() { return api; },
    set(v) {
      if (window.ppAtBoot === undefined) { window.ppAtBoot = localStorage.getItem('pixelpets.save.v2'); window.ppBootT = performance.now(); }
      api = v;
    },
  });
  const setItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) {
    if (k === 'pixelpets.save.v2') window.ppGateWrites.push({ booted: window.ppAtBoot !== undefined, t: performance.now(), raw: String(v) });
    return setItem.apply(this, arguments);
  };
}
async function seed(context, raw) {
  await context.addInitScript(seedScript, raw);
}

// Boot wait: gotoGame()'s check, then the PixelPets set; under ?debug=1 also the debug state. `splice` (§6.3) fails the boot
// at once if the served game.js could not be spliced.
async function boot(page, url, { splice } = {}) {
  const debug = /[?&]debug=1\b/.test(url);
  const ready = (async () => {
    await page.goto(url, { waitUntil: 'commit' });
    await page.waitForFunction(() => window.PixelPets && window.BUILD);
    await page.waitForFunction(() => window.ppAtBoot !== undefined);
    if (debug) await page.waitForFunction(() => PixelPets.debug === true && PixelPets.state);
  })();
  await (splice ? Promise.race([ready, splice.failed]) : ready);
}
async function reloadBoot(page, url, opts) {
  const ready = (async () => {
    await page.reload({ waitUntil: 'commit' });
    await page.waitForFunction(() => window.PixelPets && window.BUILD);
    await page.waitForFunction(() => window.ppAtBoot !== undefined);
    if (/[?&]debug=1\b/.test(url)) await page.waitForFunction(() => PixelPets.debug === true && PixelPets.state);
  })();
  await (opts && opts.splice ? Promise.race([ready, opts.splice.failed]) : ready);
}
const gateState = page => page.evaluate(() => ({ writes: window.ppGateWrites.slice(), atBoot: window.ppAtBoot, bootT: window.ppBootT, seed: window.ppSeedRaw }));
const storedRaw = page => page.evaluate(k => localStorage.getItem(k), SAVE_KEY);
const reducedMotion = page => page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);

/* ---------- §3.2 settle ---------- */

// Waits for `n` writes after boot (1: the autosave; 2 for a picked save: the tip write, then the autosave), then the
// pagehide save, and returns the stored copy (a string).
async function settle(page, n) {
  await page.waitForFunction(n => window.ppGateWrites.filter(w => w.booted).length >= n, n, { timeout: 10000 });
  return page.evaluate(k => { window.dispatchEvent(new Event('pagehide')); return localStorage.getItem(k); }, SAVE_KEY);
}

/* ---------- §3.3 the save diff ---------- */

const kindOf = v => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);
const IDENT = /^[A-Za-z_$][\w$]*$/;
const seg = (path, key, arr) => (arr ? path + '[' + key + ']' : IDENT.test(key) ? (path ? path + '.' : '') + key : path + '[' + JSON.stringify(key) + ']');
// Every difference: objects by key, arrays by position, JSON.stringify for leaves.
function diffSave(a, b, path = '', out = []) {
  const ka = kindOf(a), kb = kindOf(b);
  if (ka !== kb) { out.push({ path, op: 'type', from: a, to: b }); return out; }
  if (ka === 'object' || ka === 'array') {
    const arr = ka === 'array';
    const keys = arr ? [...Array(Math.max(a.length, b.length)).keys()].map(String) : [...new Set([...Object.keys(a), ...Object.keys(b)])];
    for (const k of keys) {
      const p = seg(path, k, arr), inA = arr ? +k < a.length : Object.prototype.hasOwnProperty.call(a, k);
      const inB = arr ? +k < b.length : Object.prototype.hasOwnProperty.call(b, k);
      if (inA && !inB) out.push({ path: p, op: 'removed', from: a[k] });
      else if (!inA && inB) out.push({ path: p, op: 'added', to: b[k] });
      else diffSave(a[k], b[k], p, out);
    }
    return out;
  }
  if (JSON.stringify(a) !== JSON.stringify(b)) out.push({ path, op: 'changed', from: a, to: b });
  return out;
}
const canon = v => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.keys(x).sort().reduce((o, key) => (o[key] = x[key], o), {}) : x));
const flagPath = k => 'flags[' + JSON.stringify(k) + ']';
const tablePath = p => p.replace(/^party\[\d+\]/, 'party[]');
const underTable = p => Object.keys(F.ADDED).some(t => tablePath(p) === t || tablePath(p).startsWith(t + '.') || tablePath(p).startsWith(t + '['));
const careFade = (d, ref) => {
  const m = /^party\[(\d+)\]\.(hunger|happy|energy)$/.exec(d.path);
  if (!m || d.op !== 'changed' || typeof d.to !== 'number') return false;
  const seedV = ref.party[+m[1]][m[2]];
  return d.to <= seedV && d.to >= seedV - 1;
};
const lastOk = (d, ref) => d.path === 'last' && d.op === 'changed' && typeof d.to === 'number' && d.to >= ref.last;

/* Checks `after` against `ref` and returns the problems ([] = pass).
   mode 'stored': the stored copy against the before copy, with the §3.3 table values.
   mode 'move': the old-save move's write before boot; table paths may be added with any value.
   mode 'tip': the write after boot and before the autosave, against what boot read; no new key except the given flags.
   mode 'same': only `last` and the care fade may change.
   flags: flag -> value the save may add; changed: flag -> [from, to] the save may change. */
function checkSave(ref, after, { mode, debug = false, reduced = false, flags = {}, changed = {} }) {
  const bad = [];
  if (after.v !== 2) bad.push('v is ' + JSON.stringify(after.v));
  for (const d of diffSave(ref, after)) {
    if (lastOk(d, ref) || careFade(d, ref)) continue;
    const flag = Object.keys(flags).find(k => flagPath(k) === d.path);
    if (d.op === 'added' && flag && canon(d.to) === canon(flags[flag])) continue;
    const ch = Object.keys(changed).find(k => flagPath(k) === d.path);
    if (d.op === 'changed' && ch && d.from === changed[ch][0] && d.to === changed[ch][1]) continue;
    if (d.op === 'added' && mode === 'stored' && Object.prototype.hasOwnProperty.call(F.ADDED, tablePath(d.path))) {
      const t = tablePath(d.path);
      const want = t === 'debugSave' ? debug : t === 'settings.effects' ? (reduced ? 'calm' : 'full') : F.ADDED[t];
      if (canon(d.to) === canon(want)) continue;
    }
    if (d.op === 'added' && mode === 'move' && Object.prototype.hasOwnProperty.call(F.ADDED, tablePath(d.path))) continue;
    if (mode === 'tip' && d.op !== 'removed' && d.op !== 'type' && underTable(d.path)) continue;
    bad.push(d.op + ' ' + d.path + (d.op === 'added' ? ' = ' + JSON.stringify(d.to) : d.op === 'removed' ? '' : ': ' + JSON.stringify(d.from) + ' -> ' + JSON.stringify(d.to)));
  }
  return bad;
}
// The flags a kind's stored copy may add (§3.3 second table; §6.2 for the Glimmer cuts) and change.
const storedFlags = kind => (F.picked(kind) ? Object.assign({}, F.moveFlags(kind), { [F.TIP_FLAG]: true }) : {});
const storedChanged = kind => F.MOVE_CHANGED[kind] || {};

/* ---------- §3.4 errors and network ---------- */

// One list of console errors and page errors, and every request URL, per page the test opens. No allowlist.
function gateGuard(test, expect) {
  const G = { pages: [], contexts: [] };
  G.watch = page => {
    const w = { page, errors: [], urls: [] };
    page.on('console', msg => { if (msg.type() === 'error') w.errors.push(msg.text()); });
    page.on('pageerror', err => w.errors.push(err.message));
    page.on('request', req => w.urls.push(req.url()));
    G.pages.push(w);
    return page;
  };
  // A fresh context with the project's phone settings (§6.3: the switch-off boot; §6.2: kinds read side by side).
  G.freshPage = async (browser, testInfo, baseURL, reducedMotion = 'reduce') => {
    const u = testInfo.project.use;
    const ctx = await browser.newContext({ baseURL, viewport: u.viewport, deviceScaleFactor: u.deviceScaleFactor,
      isMobile: u.isMobile, hasTouch: u.hasTouch, reducedMotion });
    G.contexts.push(ctx);
    return G.watch(await ctx.newPage());
  };
  test.beforeEach(async ({ page }) => { G.pages = []; G.contexts = []; G.watch(page); });
  test.afterEach(async () => {
    try {
      for (const w of G.pages) {
        expect(w.errors, 'console errors / page errors:\n' + w.errors.join('\n')).toEqual([]);
        expect(w.urls.filter(u => FIREBASE.test(u)), 'Firebase requests').toEqual([]);
      }
    } finally {
      for (const c of G.contexts) await c.close().catch(() => {});
    }
  });
  return G;
}

/* ---------- §3.1-§3.3 one clean load, settle and reload ---------- */

// The whole §3 rule for one kind on `page` (seeded already, not booted): boot at `url`, the writes before and after boot, the
// settle and the stored diff, then a reload in the same tab. Returns { before, stored, atBoot } for extra checks.
async function loadSettleReload(page, expect, kind, raw, url, { splice } = {}) {
  const before = JSON.parse(raw);
  const debug = /[?&]debug=1\b/.test(url);
  const pk = F.picked(kind);
  await boot(page, url, { splice });
  if (splice) expect(await splice.served(), 'the switch-off game.js ran').toEqual([true]);
  // PG-4: booted, the save still under its key, v 2.
  expect(await page.evaluate(() => !!window.PixelPets && !window.PixelPets.readOnly)).toBe(true);
  const atBootRaw = (await gateState(page)).atBoot;
  expect(typeof atBootRaw).toBe('string');
  expect(JSON.parse(atBootRaw).v).toBe(2);

  // PG-5: writes before boot.
  let g = await gateState(page);
  const pre = g.writes.filter(w => !w.booted);
  if (!pk) {
    expect(pre.length, 'writes before boot').toBe(0);
    expect(g.atBoot === g.seed, 'the save at boot is the seed, byte for byte').toBe(true);
  } else {
    expect(pre.length, 'writes before boot (the old-save move)').toBe(1);
    const moved = JSON.parse(pre[0].raw);
    const sixFlags = F.moveFlags(kind);
    expect(checkSave(before, moved, { mode: 'move', debug, flags: sixFlags, changed: storedChanged(kind) }), 'the old-save move write').toEqual([]);
    for (const [k, v] of Object.entries(sixFlags)) expect(moved.flags[k], k).toEqual(v);
  }

  // §3.2 settle, then PG-5 after boot: the tip write (picked) and nothing else before the autosave.
  const storedStr = await settle(page, pk ? 2 : 1);
  g = await gateState(page);
  const post = g.writes.filter(w => w.booted);
  const early = post.filter(w => w.t - g.bootT < AUTOSAVE_MS - 500);
  if (!pk) expect(early.length, 'writes after boot, before the autosave').toBe(0);
  else {
    expect(early.length, 'writes after boot, before the autosave (the tip)').toBe(1);
    const tip = JSON.parse(early[0].raw);
    expect(checkSave(JSON.parse(g.atBoot), tip, { mode: 'tip', debug, flags: { [F.TIP_FLAG]: true } }), 'the tip write').toEqual([]);
    expect(tip.flags[F.TIP_FLAG]).toBe(true);
  }

  // PG-6: the stored copy against the before copy.
  const stored = JSON.parse(storedStr);
  expect(stored.v).toBe(2);
  const reduced = await reducedMotion(page);
  expect(checkSave(before, stored, { mode: 'stored', debug, reduced, flags: storedFlags(kind), changed: storedChanged(kind) }), 'stored copy vs before copy').toEqual([]);

  // PG-7: a reload in the same tab: nothing before boot, the move does not run again, no write in the first 4 s.
  const storedBefore = await storedRaw(page);
  await reloadBoot(page, url, { splice });
  if (splice) expect(await splice.served(), 'the switch-off game.js ran again on the reload').toEqual([true, true]);
  await page.waitForFunction(() => performance.now() - window.ppBootT >= 4000, null, { timeout: 10000 });
  g = await gateState(page);
  expect(g.writes.filter(w => !w.booted).length, 'writes before boot on the reload').toBe(0);
  expect(g.writes.filter(w => w.booted && w.t - g.bootT < 4000).length, 'writes in the first 4 s after the reload').toBe(0);
  const ref = JSON.parse(storedBefore), again = JSON.parse(g.atBoot);
  expect(checkSave(ref, again, { mode: 'same' }), 'the save at the second boot').toEqual([]);
  if (pk) for (const k of Object.keys(storedFlags(kind))) expect(again.flags[k], k).toEqual(stored.flags[k]);
  return { before, stored, atBoot: JSON.parse(atBootRaw) };
}

/* ---------- §4 the scene driver ---------- */

// tests/act1_keeper_join.spec.js 74-104, verbatim. Plays the open scene to its end: lines advance, choices take the first label
// in `picks` that is offered (else the first); returns every line as [speaker, text]. `onLine` may read the stage while a line shows.
async function drive(page, picks = [], onLine = null, ms = 120000) {
  const until = Date.now() + ms, lines = [];
  let last = null;
  while (Date.now() < until) {
    const sc = await page.evaluate(() => PixelPets.scene && { mode: PixelPets.scene.mode, full: PixelPets.scene.full, waiting: PixelPets.scene.waiting, text: PixelPets.scene.text, who: PixelPets.scene.who });
    if (!sc) {
      if (await page.locator('#ovBattle.seal-only').isVisible().catch(() => false)) { await page.locator('#btOk').click(); continue; }
      await page.waitForTimeout(150); if (!(await page.evaluate(() => !!PixelPets.scene))) return lines; continue;
    }
    if (await page.locator('#ovBattle.seal-only').isVisible().catch(() => false)) { await page.locator('#btOk').click(); await page.waitForTimeout(40); continue; }
    if (sc.mode === 'choice') {
      if (!sc.full) { await page.keyboard.press('Space'); continue; }
      if (!(await page.locator('#sbChoices button:visible').count())) { await page.waitForTimeout(40); continue; }
      await page.waitForFunction(() => PixelPets.optionsReady === true);
      const labels = (await page.locator('#sbChoices button').allTextContents()).map(t => t.trim());
      const pick = picks.find(p => labels.includes(p)) || labels[0];
      lines.push(['>', pick]);
      await page.locator('#sbChoices button', { hasText: pick }).first().click();
      await page.waitForTimeout(40); continue;
    }
    if (sc.mode === 'say' && sc.waiting) {
      // Let the line finish typing (text speed fast) rather than tapping: under load a tap sent while the line types can land
      // after it is full and skip it unread.
      if (!sc.full) { await page.waitForTimeout(30); continue; }
      const key = sc.who + '|' + sc.text;
      if (key !== last) { lines.push([sc.who || '', sc.text]); last = key; if (onLine) await onLine(sc.text, sc.who || ''); }
      await page.keyboard.press('Space'); await page.waitForTimeout(30); continue;
    }
    await page.waitForTimeout(40);
  }
  throw new Error('scene did not end');
}

/* ---------- §6.3 the SEALS_BOTH_PATHS splice (a served copy; game.js on disk is unchanged) ---------- */

// Returns { hits, failed, served }: `hits` counts spliced fetches; `failed` rejects when the line is not found exactly once, and
// boot() races it, so a renamed or re-worded line fails the test at once. Routed on the context, not the page: after the first
// load the service worker (sw.js) fetches game.js itself, and page.route does not see that fetch, so a reload would run
// unspliced. `served()` reads back every game.js the page itself ran (one per load) and says whether each was the switch-off copy.
async function spliceSealsOff(page) {
  const st = { hits: 0, responses: [] };
  st.failed = new Promise((_, reject) => { st.reject = reject; });
  st.failed.catch(() => {});
  page.on('response', r => {
    if (!/\/game\.js(\?|$)/.test(r.url()) || r.request().resourceType() !== 'script') return;
    st.responses.push(r.text().then(b => b.includes(F.SEALS_OFF) && !b.includes(F.SEALS_LINE), e => 'unread: ' + e.message));
  });
  st.served = () => Promise.all(st.responses);
  await page.context().route('**/game.js*', async (route) => {
    try {
      const res = await route.fetch();
      const body = await res.text();
      const hits = body.split(F.SEALS_LINE).length - 1;
      if (hits !== 1) throw new Error('SEALS_BOTH_PATHS splice: expected 1 match, got ' + hits);
      await route.fulfill({ status: 200, body: body.replace(F.SEALS_LINE, F.SEALS_OFF),
        headers: { 'content-type': 'application/javascript', 'cache-control': 'no-store' } });
      st.hits++;
    } catch (e) {
      st.reject(e);
      await route.abort().catch(() => {});
    }
  });
  return st;
}

module.exports = {
  SAVE_KEY, FIREBASE, seedRaw, seed, boot, reloadBoot, gateState, storedRaw, reducedMotion, settle,
  diffSave, checkSave, storedFlags, storedChanged, gateGuard, loadSettleReload, drive, spliceSealsOff,
};
