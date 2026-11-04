/* BATTLE_FX_4 (D2050-D2059): frame-sprite impacts, one big and one pop per type, a super ring, a signature crest and a crit sparkle.
   Players never load this file. Every test runs at 320, 375 and 390 in Modern controls; one describe runs with reduced motion.
   The holder fights a Lv 2 foe (HP set to 400). */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

// a big (50+ power) and a pop (under 50) move per type
const BIG = { EMBER: 'kiln_rush', TIDE: 'undertow', BLOOM: 'thorn_lash', STONE: 'boulder_drop', VOLT: 'arc_bolt', FROST: 'sleet_pelt', GUST: 'gale_slice', SHADE: 'dusk_fang' };
const POP = { EMBER: 'flick_flame', TIDE: 'ripple_jab', BLOOM: 'seed_toss', STONE: 'pebble_flick', VOLT: 'zap_tap', FROST: 'frost_nip', GUST: 'puff_shot', SHADE: 'gloom_poke' };

function unitSave(effects) {
  const s = starterSave();
  s.party = [{ id: 'unit1', species: 'ember', stage: 0, xp: 0, bx: 4 * 8 * 8, hunger: 90, happy: 90, energy: 95, nick: null, origin: 'wild', moves: [], evoMoves: [] }];
  s.partnerId = 'unit1';
  s.settings.effects = effects || 'full';
  s.settings.textSpeed = 'fast';
  s.settings.controls = 'modern';
  return s;
}
async function boot(page, effects) {
  await installSave(page.context(), unitSave(effects), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && PixelPets.state && PixelPets.state.party[0]);
  await page.evaluate(() => PixelPets.showTab('walk'));
}
async function open(page, mid, textMs = 0) {
  await page.evaluate((mid) => {
    const b = PixelPets.battle; if (b.on) b.close();
    PixelPets.healTeam(); PixelPets.setMoves([mid]);
    // a foe the move hits for 1x, so the tier is the move's own (a super hit always draws big)
    const mt = PixelPets.moves()[mid].type, row = TYPE_CHART[mt] || {};
    const foe = SPECIES.find((sp) => sp.type && !sp.attune && !sp.tableOnly && (row[sp.type] == null || row[sp.type] === 1));
    return PixelPets.forceBattle(foe.id + '/0', 2);
  }, mid);
  await page.waitForFunction(() => PixelPets.battle.on && PixelPets.battle.state === 'CHOOSE', null, { timeout: 20000 });
  await page.evaluate((textMs) => {
    const b = PixelPets.battle; b.animMs = null; b.textMs = textMs; b.rng = () => 0.2; b.fxLog = []; b.whites = []; b.flashAt = null;
    const f = b.foes && b.foes[0]; if (f) { f.hp = 400; f.maxHp = 400; }
    b.foePlan = { move: 'wobble' };
  }, textMs);
}
async function tap(page, mid) {
  await page.locator('[data-bact="fight"]').click();
  await page.locator(`#btMoves button[data-move="${mid}"]`).click();
  await page.waitForFunction(() => PixelPets.battle.state === 'CHOOSE' || !PixelPets.battle.on, null, { timeout: 20000 });
  return page.evaluate(() => PixelPets.battle.fxLog.slice());
}
// record the sprite lane and the rect pool on every animation frame for ms
function record(page, ms) {
  return page.evaluate((ms) => {
    window.__bfRec = new Promise((done) => {
      const B = PixelPets.battle, t0 = performance.now(), out = [];
      const tick = () => {
        const now = performance.now(), spr = [];
        for (let i = 0; i < mvSprCount(); i++) { const s = MV_SPOOL[i]; if (s.on) spr.push([s.id, s.f]); }
        out.push({ t: now, spr, pool: B.view ? B.view.pool : 0, lane: B.view ? B.view.spr : 0, white: !!(B.view && B.view.white) });
        if (now - t0 < ms) requestAnimationFrame(tick); else done(out);
      };
      requestAnimationFrame(tick);
    });
  }, ms);
}
const recorded = (page) => page.evaluate(() => window.__bfRec);
// every sprite frame drawBattle puts in the lane, logged at the source (no rAF sampling, so a busy machine can't skip a frame)
async function putLog(page) {
  await page.evaluate(() => {
    if (!window.__bfPut0) window.__bfPut0 = window.mvSprPut;
    window.__bfPuts = [];
    window.mvSprPut = function (id, f, P, type) { if (f >= 0) window.__bfPuts.push([id, f]); return window.__bfPut0(id, f, P, type); };
  });
}
const puts = (page) => page.evaluate(() => window.__bfPuts.slice());
// freeze every effect fx at an exact age (its held clock), as the preview shots do, and read the lane after the game draws
async function frozenLane(page, age) {
  await page.evaluate((age) => {
    const b = PixelPets.battle, t = performance.now();
    for (const e of b.fx) { e.t0 = t - age; e.hold0 = t; e.hold1 = t + 1e7; e.dur = 1e8; }
  }, age);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r)))));
  return page.evaluate(() => { const out = []; for (let i = 0; i < mvSprCount(); i++) out.push([MV_SPOOL[i].id, MV_SPOOL[i].f]);
    if (!out.length && window.__bfDiag) out.push(['diag', JSON.stringify({ fx: PixelPets.battle.fx.map((e) => [e.kind, !!e.spr, e.sm, Math.round(performance.now() - e.t0), e.dur]), on: PixelPets.battle.on, st: PixelPets.battle.state, ov: document.querySelector('#ovBattle').hidden, view: PixelPets.battle.view && PixelPets.battle.view.t, now: performance.now() })]);
    return out; });
}
// a scripted hit through the real step queue (show, stop, drawBattle), as moves_v2 test 22 does
async function burst(page, hits, gapMs) {
  return page.evaluate(async ([hits, gapMs]) => {
    const b = PixelPets.battle, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    b.textMs = 0; b.animMs = null; b.whites = []; b.fxLog = []; b.flashAt = null;
    for (const h of hits) {
      b.shown = { who: 'foe:0', hpFrom: 400, hpTo: 390, max: 400 };
      b.step('windup', { who: 'me', type: h.type, variant: h.variant, tgt: 'foe:0', mid: h.mid });
      b.step('contact', { who: 'foe:0', atk: 'me', type: h.type, mult: h.variant.indexOf('super') >= 0 ? 2 : 1, crit: h.variant.indexOf('crit') >= 0,
        variant: h.variant, mid: h.mid, pw: h.pw, sig: !!h.sig });
      b.step('stop', { ms: typeof mvScaled === 'function' ? mvScaled(h.type, h.variant).stop : 80 });
      b.step('hp', { who: 'foe:0' });
      b.step('num', { who: 'foe:0', n: 10, look: h.variant.indexOf('crit') >= 0 ? 'lucky' : 'super' });
      const p = b.play(b.id);
      if (gapMs) await sleep(gapMs); else await p;
    }
    await b.play(b.id);
    await sleep(700);
    return { whites: (b.whites || []).map((w) => w.t0), log: b.fxLog.slice() };
  }, [hits, gapMs]);
}

test('T1 D2051, D2054: every effect has well formed data, inside the budget', async ({ page }) => {
  await boot(page, 'full');
  const r = await page.evaluate(() => {
    const bad = [], ALLOWED = 'kprdolgtnbcshm'.split('').concat(['y']);
    for (const [id, e] of Object.entries(MV_SPR.fx)) {
      const cap = e.tier === 'sig' ? 28 : 24;
      if (e.n > cap) bad.push(id + ' size ' + e.n);
      if (e.frames.length > 8 || e.frames.length !== e.ms.length) bad.push(id + ' frames');
      if (e.frames.some((f) => f.length !== e.n || f.some((row) => row.length !== e.n || /[^.abcde]/.test(row)))) bad.push(id + ' grid');
      if (e.ms.reduce((a, b) => a + b, 0) > 420) bad.push(id + ' over 420 ms');
      if (e.calm.length > 2 || (e.calm.length && e.calm.some((i) => i >= e.after))) bad.push(id + ' calm has an after-shape frame');
      if (e.ramp && e.ramp.some((k) => ALLOWED.indexOf(k) < 0)) bad.push(id + ' ramp');
    }
    for (const [t, row] of Object.entries(MV_SPR.types)) if (row.ramp.some((k) => ALLOWED.indexOf(k) < 0) || !MV_SPR.fx[row.big] || !MV_SPR.fx[row.pop]) bad.push(t);
    return { bad, types: Object.keys(MV_SPR.types).sort(), n: Object.keys(MV_SPR.fx).length };
  });
  expect(r.bad).toEqual([]);
  expect(r.types).toEqual(['BLOOM', 'EMBER', 'FROST', 'GUST', 'SHADE', 'STONE', 'TIDE', 'VOLT']);
  expect(r.n).toBe(19);
});

test('T2 D2054: every drawn pixel of every frame, in every ramp and mode, is a PAL colour (never white)', async ({ page }) => {
  await boot(page, 'full');
  const r = await page.evaluate(() => {
    const keys = 'kprdolgtnbcshmy'.split(''), ok = new Set(keys.map((k) => PAL[k].toLowerCase()));
    const cv = document.createElement('canvas'); cv.width = 32; cv.height = 32;
    const g = cv.getContext('2d', { willReadFrequently: true });
    const bad = [], seen = {}; let frames = 0, empty = [];
    const hex = (d, i) => '#' + [d[i], d[i + 1], d[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('');
    for (const [id, e] of Object.entries(MV_SPR.fx)) {
      const types = e.ramp ? ['EMBER'] : Object.keys(MV_SPR.types);
      for (const ty of types) for (const mode of ['full', 'calm', 'off']) {
        const end = mvSprEndMs(id, mode);
        for (let a = 0; a < end; a += 10) {
          const f = mvSprFrame(id, a, mode); if (f < 0) { bad.push(id + ' ' + mode + ' gap at ' + a); continue; }
          if (seen[id + ty + f]) continue; seen[id + ty + f] = 1; frames++;
          g.clearRect(0, 0, 32, 32); mvPoolReset(); mvSprPut(id, f, [16, 16 - (e.oy | 0)], ty); mvSprDraw(g); mvPoolReset();
          const d = g.getImageData(0, 0, 32, 32).data; let lit = 0;
          for (let i = 0; i < d.length; i += 4) {
            if (d[i + 3] === 0) continue;
            lit++;
            if (d[i + 3] !== 255 || !ok.has(hex(d, i))) { bad.push(id + '/' + ty + ' f' + f + ' ' + hex(d, i)); break; }
          }
          if (!lit) empty.push(id + ' f' + f);
        }
      }
    }
    return { bad: bad.slice(0, 10), frames, empty };
  });
  expect(r.bad).toEqual([]);
  expect(r.empty).toEqual([]);
  expect(r.frames).toBeGreaterThan(150);
});

test('T3 D2053: each type\'s big and pop move draws its own impact in a real FULL turn; PLAIN keeps its rects', async ({ page }) => {
  test.setTimeout(240000);
  await boot(page, 'full');
  for (const [type, set] of [['big', BIG], ['pop', POP]].flatMap(([k, m]) => Object.entries(m).map(([t, mid]) => [t, [k, mid]]))) {
    const [tier, mid] = set;
    await open(page, mid, 600);
    await putLog(page);
    const log = await tap(page, mid);
    await page.waitForTimeout(500);
    const drawnPuts = await puts(page);
    expect(log, mid).toContain('mvSpr');
    const want = tier === 'big' ? (await page.evaluate((t) => MV_SPR.types[t].big, type)) : (await page.evaluate((t) => MV_SPR.types[t].pop, type));
    const drawn = new Set(drawnPuts.filter((s) => s[0] === want).map((s) => s[1]));
    const total = await page.evaluate((id) => MV_SPR.fx[id].frames.length, want);
    // frame-by-frame coverage is T3b's (frozen clock); a real turn on a busy machine can skip frames between paints
    expect(drawn.size, mid + ' draws ' + want).toBeGreaterThan(0);
    expect([...drawn].every((f) => f >= 0 && f < total), mid).toBe(true);
    const other = drawnPuts.filter((x) => x[0] !== want && x[0] !== 'super_ring' && x[0] !== 'sig_crest' && x[0] !== 'crit_spark');
    expect(other, mid + ' no other type\'s impact').toEqual([]);
  }
  await open(page, 'bump');
  const log = await tap(page, 'bump');
  expect(log).toContain('mvHit');
  expect(log).not.toContain('mvSpr');
});

test('T3b D2051, D2053, D2055, D2056: on a frozen clock every frame of every effect draws in FULL, CALM and OFF, in lane order', async ({ page }) => {
  test.setTimeout(480000);
  for (const mode of ['full', 'calm', 'off']) {
    await boot(page, mode);
    await page.evaluate(() => { window.__bfDiag = 1; });
    await open(page, 'kiln_rush');
    for (const type of Object.keys(BIG)) for (const [variant, pw, sig] of [['normal', 70, false], ['normal', 30, false], ['super+crit', 30, false], ['crit', 70, true]]) {
      await page.evaluate(async ([type, variant, pw, sig]) => {
        const b = PixelPets.battle; b.textMs = 0; b.animMs = 0; b.fx.length = 0; b.flashAt = null;
        b.step('contact', { who: 'foe:0', atk: 'me', type, mult: variant.indexOf('super') >= 0 ? 2 : 1, crit: variant.indexOf('crit') >= 0, variant, mid: null, pw, sig });
        await b.play(b.id);
        b.fx = b.fx.filter((e) => e.kind === 'mvSpr' || (e.kind === 'mvMark' && e.spr));
        const t = performance.now();
        for (const e of b.fx) { e.hold0 = t; e.hold1 = t + 1e7; e.dur = 1e8; }   // pinned now, so a busy machine can't let it expire before the freeze
      }, [type, variant, pw, sig]);
      const want = await page.evaluate(([type, variant, pw, sig, mode]) => {
        const p = mvSprPick(type, pw, variant, mode === 'full' ? sig : false), ids = mode === 'full' ? [p.extra, p.main, p.crit] : (mode === 'calm' ? [p.main, p.crit] : [p.main]);
        // FULL: the clock starts lead ms before contact; the main impact reads it as is, the ring, crest and sparkle from contact
        const L = mode === 'full' ? p.lead : 0, at = (id, a) => mvSprFrame(id, id === p.main ? a : a - L, mode);
        const ends = ids.filter(Boolean).map((id) => mvSprEndMs(id, mode) + (id === p.main ? 0 : L));
        const ages = []; for (let a = 0; a < Math.max(...ends); a += 20) ages.push(a);
        return { ids: ids.filter(Boolean), ages, exp: ages.map((a) => ids.filter(Boolean).map((id) => [id, at(id, a)]).filter((x) => x[1] >= 0)) };
      }, [type, variant, pw, sig, mode]);
      const seen = new Set();
      for (let i = 0; i < want.ages.length; i++) {
        const lane = await frozenLane(page, want.ages[i]);
        expect(lane, `${mode} ${type} ${variant} ${pw}${sig ? ' sig' : ''} at ${want.ages[i]} ms`).toEqual(want.exp[i]);
        lane.forEach((x) => seen.add(x.join(':')));
      }
      const all = await page.evaluate(([ids, mode]) => ids.flatMap((id) => {
        const e = MV_SPR.fx[id], fs = mode === 'full' ? e.frames.map((_, i) => i) : (mode === 'calm' ? e.calm : [e.off]);
        return fs.map((f) => id + ':' + f);
      }), [want.ids, mode]);
      expect(all.filter((k) => !seen.has(k)), `${mode} ${type} ${variant} frames never drawn`).toEqual([]);
    }
  }
});

for (const [name, effects, reduce, tag] of [['CALM', 'calm', false, 'mvSprCalm'], ['reduced motion', 'full', true, 'mvSprCalm'], ['OFF', 'off', false, 'mvSprOff']]) {
  test.describe(`T4 D2055, D2056 ${name}`, () => {
    if (reduce) test.use({ reducedMotion: 'reduce' });
    test(`${name}: ${effects === 'off' ? 'one static mark' : 'two frames, no after-shape'}, no ring, crest or charge`, async ({ page }) => {
      test.setTimeout(120000);
      await boot(page, effects);
      for (const type of ['EMBER', 'SHADE', 'STONE']) {
        const mid = BIG[type];
        await open(page, mid, 600);
        await putLog(page);
        await record(page, 3000);
        const log = await tap(page, mid);
        await page.waitForTimeout(400);
        const frames = await recorded(page), drawnPuts = await puts(page);
        expect(log, mid).toContain(tag);
        expect(log, mid).not.toContain('mvGo');
        expect(log, mid).not.toContain('mvSpr');
        expect(log.filter((x) => x.indexOf(':') >= 0), mid).toEqual([]);
        const r = await page.evaluate((t) => { const e = MV_SPR.fx[MV_SPR.types[t].big]; return { id: MV_SPR.types[t].big, calm: e.calm, off: e.off, after: e.after }; }, type);
        const shown = drawnPuts;
        expect(shown.every((s) => s[0] === r.id), mid + ' only the impact draws').toBe(true);
        const fs = [...new Set(shown.map((s) => s[1]))].sort();
        if (effects === 'off') expect(fs, mid).toEqual([r.off]);
        else { expect(fs.length, mid).toBeGreaterThan(0); expect(fs.every((f) => r.calm.includes(f) && f < r.after), mid).toBe(true); }
        if (effects !== 'off') expect(frames.some((f) => f.white), mid + ' no white frame in ' + name).toBe(false);
      }
    });
  });
}

test('T5 D2052, D2057: the lane never holds more than 3 sprites and the rect pool never passes 24 (sweep and live burst)', async ({ page }) => {
  test.setTimeout(120000);
  await boot(page, 'full');
  await open(page, 'kiln_rush');
  const sweep = await page.evaluate(() => {
    let lane = 0, lost = 0;
    for (const t of Object.keys(MV_SPR.types).concat(['PLAIN'])) for (const v of ['normal', 'super', 'crit', 'super+crit', 'weak+crit']) for (const sig of [false, true]) for (const pw of [30, 85]) {
      const p = mvSprPick(t, pw, v, sig);
      for (let a = 0; a < 700; a += 5) {
        mvPoolReset(); mvSprHit(p, a, 'full', [30, 20]);
        const want = p ? [p.extra, p.main, p.crit].filter((id) => id && mvSprFrame(id, id === p.main ? a : a - p.lead, 'full') >= 0).length : 0;
        lane = Math.max(lane, mvSprCount()); if (mvSprCount() < want) lost++;
      }
    }
    mvPoolReset();
    return { lane, lost };
  });
  expect(sweep.lane).toBeLessThanOrEqual(3);
  expect(sweep.lost).toBe(0);
  await record(page, 2600);
  const got = await burst(page, [
    { type: 'EMBER', variant: 'super+crit', mid: 'kindle_burst', pw: 70, sig: true },
    { type: 'VOLT', variant: 'super+crit', mid: 'static_lunge', pw: 80 },
    { type: 'SHADE', variant: 'crit', mid: 'deep_hum', pw: 95, sig: true },
  ], 120);
  const frames = await recorded(page);
  expect(got.log.filter((x) => x === 'mvSpr').length).toBe(3);
  expect(Math.max(...frames.map((f) => f.lane))).toBeLessThanOrEqual(3);
  expect(Math.max(...frames.map((f) => f.lane))).toBeGreaterThanOrEqual(2);
  expect(Math.max(...frames.map((f) => f.pool))).toBeLessThanOrEqual(24);
});

test('T6 D2058: the single flash clock holds: one white frame per 334 ms, sprites never add one', async ({ page }) => {
  test.setTimeout(120000);
  await boot(page, 'full');
  await open(page, 'kiln_rush');
  const hits = [];
  for (const t of Object.keys(BIG)) hits.push({ type: t, variant: 'super+crit', mid: BIG[t], pw: 70, sig: hits.length % 2 === 0 });
  const got = await burst(page, hits, 90);   // a new super hit every 90 ms: far faster than any real turn
  expect(got.log.filter((x) => x === 'mvSpr').length).toBe(8);
  expect(got.whites.length).toBeGreaterThan(0);
  expect(got.whites.length).toBeLessThan(8);
  for (let i = 1; i < got.whites.length; i++) expect(got.whites[i] - got.whites[i - 1]).toBeGreaterThanOrEqual(334);
  // no sprite frame holds a w pixel, so the only white on screen is the gated target flash
  const w = await page.evaluate(() => Object.values(MV_SPR.fx).some((e) => (e.ramp || []).includes('w')) || Object.values(MV_SPR.types).some((t) => t.ramp.includes('w')));
  expect(w).toBe(false);
});

test('T7 D2057: frame time stays in budget during a burst on a 4x slower CPU', async ({ page }) => {
  test.setTimeout(120000);
  await boot(page, 'full');
  await open(page, 'kiln_rush');
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const hits = [];
  for (const t of Object.keys(BIG)) hits.push({ type: t, variant: 'super+crit', mid: BIG[t], pw: 85, sig: true });
  const run = async (lane) => {
    await page.evaluate((lane) => {
      // mvPoolDraw is the whole effect draw (sprite lane plus rects); mvSprDraw is the lane alone; rAF gaps are the whole frame
      if (!window.__bf0) window.__bf0 = { pool: window.mvPoolDraw, spr: window.mvSprDraw, hit: window.mvSprHit };
      const O = window.__bf0, T = window.__bfT = { fx: [], lane: [], gap: [] };
      window.mvSprHit = lane ? O.hit : function () {};
      window.mvPoolDraw = function (g) { const a = performance.now(); O.pool(g); T.fx.push(performance.now() - a); };
      window.mvSprDraw = function (g) { const a = performance.now(); O.spr(g); if (mvSprCount()) T.lane.push(performance.now() - a); };
      let last = performance.now();
      const tick = () => { const n = performance.now(); T.gap.push(n - last); last = n; if (T.gap.length < 120) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }, lane);
    await burst(page, hits, 140);
    return page.evaluate(() => {
      const p = (a, q) => { const s = a.slice().sort((x, y) => x - y); return s.length ? +s[Math.min(s.length - 1, Math.floor(s.length * q))].toFixed(2) : 0; };
      const T = window.__bfT;
      return { frames: T.gap.length, withSprites: T.lane.length, fxP95: p(T.fx, 0.95), laneP95: p(T.lane, 0.95), laneMax: p(T.lane, 1), gapP50: p(T.gap, 0.5), gapP95: p(T.gap, 0.95) };
    });
  };
  const off = await run(false), on = await run(true);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  console.log('BATTLE_FX_4 perf (4x CPU):', JSON.stringify({ without: off, with: on }));
  expect(on.withSprites).toBeGreaterThan(10);
  expect(off.withSprites).toBe(0);
  expect(on.laneP95, 'sprite lane p95 ms').toBeLessThanOrEqual(3);
  expect(on.fxP95, 'effect draw p95 ms (lane + rects)').toBeLessThanOrEqual(4);
  expect(on.gapP50 - off.gapP50, 'the lane moves the median frame by at most 3 ms').toBeLessThanOrEqual(3);
});

test('T8 D2059: the save is unchanged: key, v 2, no new fields after a turn of every type', async ({ page }) => {
  test.setTimeout(240000);
  await boot(page, 'full');
  let keys = null;
  for (const mid of Object.values(BIG)) {
    await open(page, mid);
    await tap(page, mid);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
    expect(saved.v).toBe(2);
    const now = Object.keys(saved).sort();
    expect(now.filter((k) => /^mv|fx|spr/i.test(k)), mid).toEqual([]);
    expect(JSON.stringify(saved.settings), mid).not.toMatch(/spr|fx4/i);
    if (keys) expect(now, mid).toEqual(keys); else keys = now;
  }
});
