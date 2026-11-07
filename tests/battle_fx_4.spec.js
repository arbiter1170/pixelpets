/* BATTLE_FX_4 (D2050-D2059): frame-sprite impacts, one big and one pop per type, a super ring, a signature crest and a crit sparkle.
   v0.2 (D2061-D2069): the sprites are tiered by the user's stage (early rects, mid a pop on strong moves, final as v0.1, a signature always
   wears the crest) and every rect hit is cleaned up (C1-C8). T1-T8 boot a final-stage holder (the v0.1 rule); T9-T12 test the tiers.
   Players never load this file. Every test runs at 320, 375 and 390 in Modern controls; one describe runs with reduced motion.
   The holder fights a Lv 2 foe (HP set to 400). */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

// a big (50+ power) and a pop (under 50) move per type
const BIG = { EMBER: 'kiln_rush', TIDE: 'undertow', BLOOM: 'thorn_lash', STONE: 'boulder_drop', VOLT: 'arc_bolt', FROST: 'sleet_pelt', GUST: 'gale_slice', SHADE: 'dusk_fang' };
const POP = { EMBER: 'flick_flame', TIDE: 'ripple_jab', BLOOM: 'seed_toss', STONE: 'pebble_flick', VOLT: 'zap_tap', FROST: 'frost_nip', GUST: 'puff_shot', SHADE: 'gloom_poke' };

// BATTLE_FX_4 v0.2: the tier table, copied from the design packet's battle_fx_4_tiers.json (cells and clean)
const TIERS = {"0|basic|normal":{"impact":"rect","extra":null,"crit":null},"0|basic|super":{"impact":"rect","extra":"rect_ring","crit":null},"0|basic|crit":{"impact":"rect","extra":null,"crit":"rect_plus"},"0|basic|super+crit":{"impact":"rect","extra":"rect_ring","crit":"rect_plus"},"0|strong|normal":{"impact":"rect","extra":null,"crit":null},"0|strong|super":{"impact":"rect","extra":"rect_ring","crit":null},"0|strong|crit":{"impact":"rect","extra":null,"crit":"rect_plus"},"0|strong|super+crit":{"impact":"rect","extra":"rect_ring","crit":"rect_plus"},"0|signature|normal":{"impact":"pop","extra":"sig_crest","crit":null},"0|signature|super":{"impact":"pop","extra":"sig_crest","crit":null},"0|signature|crit":{"impact":"pop","extra":"sig_crest","crit":"crit_spark"},"0|signature|super+crit":{"impact":"pop","extra":"sig_crest","crit":"crit_spark"},"1|basic|normal":{"impact":"rect","extra":null,"crit":null},"1|basic|super":{"impact":"rect","extra":"rect_ring","crit":null},"1|basic|crit":{"impact":"rect","extra":null,"crit":"rect_plus"},"1|basic|super+crit":{"impact":"rect","extra":"rect_ring","crit":"rect_plus"},"1|strong|normal":{"impact":"pop","extra":null,"crit":null},"1|strong|super":{"impact":"pop","extra":"super_ring","crit":null},"1|strong|crit":{"impact":"pop","extra":null,"crit":"crit_spark"},"1|strong|super+crit":{"impact":"pop","extra":"super_ring","crit":"crit_spark"},"1|signature|normal":{"impact":"big","extra":"sig_crest","crit":null},"1|signature|super":{"impact":"big","extra":"sig_crest","crit":null},"1|signature|crit":{"impact":"big","extra":"sig_crest","crit":"crit_spark"},"1|signature|super+crit":{"impact":"big","extra":"sig_crest","crit":"crit_spark"},"2|basic|normal":{"impact":"pop","extra":null,"crit":null},"2|basic|super":{"impact":"big","extra":"super_ring","crit":null},"2|basic|crit":{"impact":"pop","extra":null,"crit":"crit_spark"},"2|basic|super+crit":{"impact":"big","extra":"super_ring","crit":"crit_spark"},"2|strong|normal":{"impact":"big","extra":null,"crit":null},"2|strong|super":{"impact":"big","extra":"super_ring","crit":null},"2|strong|crit":{"impact":"big","extra":null,"crit":"crit_spark"},"2|strong|super+crit":{"impact":"big","extra":"super_ring","crit":"crit_spark"},"2|signature|normal":{"impact":"big","extra":"sig_crest","crit":null},"2|signature|super":{"impact":"big","extra":"sig_crest","crit":null},"2|signature|crit":{"impact":"big","extra":"sig_crest","crit":"crit_spark"},"2|signature|super+crit":{"impact":"big","extra":"sig_crest","crit":"crit_spark"}};
const CLEAN = {"min_px":2,"flare_r":8,"core":4,"core_after":100,"box":[13,15,11],"end":360,"ring_r":[6,13],"plus":{"dy":-13,"b":2,"col":"y","ms":240}};

function unitSave(effects, stage) {
  const s = starterSave();
  const st = stage == null ? 2 : stage;   // v0.2: T1-T8 test v0.1's rule, the final-stage row (D2061); evoMoves as newPet, so no stage-move sheet opens
  s.party = [{ id: 'unit1', species: 'ember', stage: st, xp: 0, bx: 4 * 8 * 8, hunger: 90, happy: 90, energy: 95, nick: null, origin: 'wild', moves: [], evoMoves: Array.from({ length: st }, (_, i) => i + 1) }];
  s.partnerId = 'unit1';
  s.settings.effects = effects || 'full';
  s.settings.textSpeed = 'fast';
  s.settings.controls = 'modern';
  return s;
}
async function boot(page, effects, stage) {
  await installSave(page.context(), unitSave(effects, stage), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && PixelPets.state && PixelPets.state.party[0]);
  await page.evaluate(() => PixelPets.showTab('walk'));
}
async function open(page, mid, textMs = 0, foeForm = null) {
  await page.evaluate(([mid, foeForm]) => {
    const b = PixelPets.battle; if (b.on) b.close();
    PixelPets.healTeam(); PixelPets.setMoves([mid]);
    // a foe the move hits for 1x, so the tier is the move's own (a super hit always draws big)
    const mt = PixelPets.moves()[mid].type, row = TYPE_CHART[mt] || {};
    const foe = SPECIES.find((sp) => sp.type && !sp.attune && !sp.tableOnly && (row[sp.type] == null || row[sp.type] === 1));
    return PixelPets.forceBattle(foeForm || (foe.id + '/0'), 2);
  }, [mid, foeForm]);
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
      let total = 0;
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
        if (effects === 'off') expect(fs.every((f) => f === r.off), mid).toBe(true);
        else expect(fs.every((f) => r.calm.includes(f) && f < r.after), mid).toBe(true);
        total += shown.length;   // a 240 ms mark can fall between two paints on a stalled machine; T3b pins every frame on a frozen clock
        if (effects !== 'off') expect(frames.some((f) => f.white), mid + ' no white frame in ' + name).toBe(false);
      }
      expect(total, name + ' the mark drew').toBeGreaterThan(0);
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
  // frame gaps are logged, not asserted: on a shared test box they swing by more than the lane costs
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

// ---- BATTLE_FX_4 v0.2 (D2061-D2069): tiers by stage, and the cleaned rects ----

test('T9 D2061, D2063, D2064, D2065, D2068: every pick follows the tier table (each type and PLAIN x stage x kind x outcome)', async ({ page }) => {
  await boot(page, 'full');
  const bad = await page.evaluate((cells) => {
    const out = [], pw = { basic: 30, strong: 70, signature: 30 };
    for (const [key, cell] of Object.entries(cells)) {
      const [stg, kind, oc] = key.split('|');
      for (const ty of Object.keys(MV_SPR.types).concat(['PLAIN'])) {
        const p = mvSprPick(ty, pw[kind], oc, kind === 'signature', +stg), plain = ty === 'PLAIN', spr = cell.impact !== 'rect';
        const want = { main: plain || !spr ? null : MV_SPR.types[ty][cell.impact],
          extra: plain ? null : (cell.extra === 'sig_crest' || cell.extra === 'super_ring' ? cell.extra : null),
          crit: cell.crit === 'crit_spark' ? 'crit_spark' : null };
        const got = { main: p ? p.main : null, extra: p ? p.extra : null, crit: p ? p.crit : null };
        if (JSON.stringify(got) !== JSON.stringify(want)) out.push(key + ' ' + ty + ' ' + JSON.stringify(got));
        if (mvTier(+stg, pw[kind], kind === 'signature', oc) !== cell.impact) out.push(key + ' tier');
      }
    }
    // a missing stage reads as final (v0.1's rule), so the CALM and OFF picks are unchanged (D2067)
    for (const ty of Object.keys(MV_SPR.types)) for (const [pw, oc] of [[30, 'normal'], [70, 'normal'], [30, 'super'], [30, 'crit']]) {
      if (mvSprPick(ty, pw, oc, false) !== mvSprPick(ty, pw, oc, false, 2)) out.push(ty + ' ' + pw + ' ' + oc + ' default');
    }
    return out;
  }, TIERS);
  expect(bad).toEqual([]);
  const r = await page.evaluate(() => ({
    weak: mvTier(1, 70, false, 'weak'), edge: mvTier(1, 50, false, 'normal'), under: mvTier(1, 49, false, 'normal'),
    crest: Object.values(SIGNATURES).filter((m) => { const p = mvSprPick(MOVES[m].type, MOVES[m].power, 'normal', true, 0); return p && p.extra === 'sig_crest'; }).length,
    plain: Object.values(SIGNATURES).filter((m) => MOVES[m].type === 'PLAIN').sort(),
  }));
  expect(r.weak, 'a weak hit reads as normal').toBe('pop');
  expect(r.edge, '50 power is strong').toBe('pop');
  expect(r.under).toBe('rect');
  expect(r.crest, 'every typed signature wears the crest, at stage 0 too (D2065)').toBe(27);
  expect(r.plain).toEqual(['neon_zip', 'ping_pulse']);
});

test('T10 D2061, D2062: real FULL turns draw by the user\'s stage, the holder\'s and a foe\'s', async ({ page }) => {
  test.setTimeout(300000);
  const cases = [
    [0, 'flick_flame', 'mvTierRect', []],
    [0, 'kiln_rush', 'mvTierRect', []],
    [0, 'foxfire_flick', 'mvTierPop', ['ember_pop', 'sig_crest']],
    [1, 'flick_flame', 'mvTierRect', []],
    [1, 'kiln_rush', 'mvTierPop', ['ember_pop']],
    [1, 'foxfire_flick', 'mvTierBig', ['ember_bloom', 'sig_crest']],
    [2, 'flick_flame', 'mvTierPop', ['ember_pop']],
    [2, 'kiln_rush', 'mvTierBig', ['ember_bloom']],
  ];
  let cur = -1;
  for (const [stage, mid, tag, want] of cases) {
    if (stage !== cur) { await boot(page, 'full', stage); cur = stage; }
    await open(page, mid, 600);
    await putLog(page);
    const log = await tap(page, mid);
    await page.waitForTimeout(500);
    const drawn = [...new Set((await puts(page)).map((x) => x[0]))].sort();
    expect(log, stage + ' ' + mid).toContain(tag);
    expect(log, stage + ' ' + mid).toContain('mvHit');
    if (!want.length) expect(log, stage + ' ' + mid + ' draws no sprite').not.toContain('mvSpr');
    expect(drawn, stage + ' ' + mid).toEqual(want.slice().sort());
  }
  // a final-stage foe's strong move on an early-stage holder: the holder's hit is rects, the foe's the big impact
  await boot(page, 'full', 0);
  await open(page, 'flick_flame', 600, 'ember/2');
  await page.evaluate(() => { PixelPets.battle.foePlan = { move: 'kiln_rush' }; });
  await putLog(page);
  const log = await tap(page, 'flick_flame');
  await page.waitForTimeout(600);
  const drawn = new Set((await puts(page)).map((x) => x[0]));
  expect(log.filter((x) => /^mvTier/.test(x))).toEqual(['mvTierRect', 'mvTierBig']);
  expect(drawn.has('ember_bloom'), 'the foe draws big').toBe(true);
  expect(drawn.has('ember_pop')).toBe(false);
});

test('T11 D2066: every rect hit is cleaned (2 px pieces, on the target, face clear, over by 360 ms; ring and plus in the canvas)', async ({ page }) => {
  test.setTimeout(120000);
  await boot(page, 'full', 0);
  await open(page, 'kiln_rush');
  const r = await page.evaluate((CLEAN) => {
    const v = PixelPets.battle.view, cv = document.getElementById('battleCanvas'), W = cv.width, H = cv.height;
    const bad = []; let pieces = 0, peak = 0;
    for (const mid of Object.keys(MOVES)) {
      if (!(MOVES[mid].power > 0)) continue;
      const rows = mvCleanRow(mvHitRows(MOVES[mid].type, mid, 0, 0));
      for (const [S, T] of [[v.sc, v.tc], [v.tc, v.sc]]) for (let age = 0; age < 420; age += 10) {
        mvPoolReset(); mvShadowSet(true); mvCleanSet(T, age);
        for (const sg of rows) { const k = mvSegK(sg, age); if (k >= 0) mvShape(sg, k, mvCleanT(sg), S, T, mvCleanPut); }
        peak = Math.max(peak, mvPoolCount());
        for (let i = 0; i < mvPoolCount(); i++) {
          const p = MV_POOL[i], dx = p.x + p.w / 2 - T[0], dy = p.y + p.h / 2 - T[1]; pieces++;
          if (p.w < CLEAN.min_px || p.h < CLEAN.min_px) bad.push(mid + ' C1 size at ' + age);
          if (dx < -CLEAN.box[0] || dx > CLEAN.box[0] || dy < -CLEAN.box[1] || dy > CLEAN.box[2]) bad.push(mid + ' C4 box at ' + age);
          const c = CLEAN.core;   // C3: no piece touches the 9x9 core once the impact frame is over
          if (age >= CLEAN.core_after && p.x <= T[0] + c && p.x + p.w > T[0] - c && p.y <= T[1] + c && p.y + p.h > T[1] - c) bad.push(mid + ' C3 core at ' + age);
          if (age >= CLEAN.end) bad.push(mid + ' C6 late at ' + age);
          if (p.x < 0 || p.y < 0 || p.x + p.w > W || p.y + p.h > H) bad.push(mid + ' canvas at ' + age);
          if (p.col === 'w') bad.push(mid + ' white');
        }
        for (const sg of rows) if (sg.shape === 'flare' && sg.r < CLEAN.flare_r) bad.push(mid + ' C2 flare');
      }
    }
    // C5: a blink shape draws the same pieces wherever its segment is (its clock holds the segment's start)
    let blinks = 0;
    for (const mid of Object.keys(MV_MOVE)) for (const sg of mvCleanRow((MV_MOVE[mid].hit || []))) {
      if (['speck', 'crackle', 'leaves'].indexOf(sg.shape) < 0) continue;
      const a = [], b = [];
      mvShape(sg, 0.2, mvCleanT(sg), v.sc, v.tc, (x, y, w, h, c) => a.push([x, y, w, h, c].join()));
      mvShape(sg, 0.8, mvCleanT(sg), v.sc, v.tc, (x, y, w, h, c) => b.push([x, y, w, h, c].join()));
      blinks++;
      if (sg.shape !== 'leaves' && a.join('|') !== b.join('|')) bad.push(mid + ' C5 ' + sg.shape);
      if (sg.shape === 'leaves' && a.map((s) => s.split(',').slice(2).join()).join('|') !== b.map((s) => s.split(',').slice(2).join()).join('|')) bad.push(mid + ' C5 leaves');
    }
    mvPoolReset(); mvShadowSet(false);
    return { same: JSON.stringify(MV_CLEAN) === JSON.stringify(CLEAN), bad: bad.slice(0, 10), nbad: bad.length, pieces, peak, blinks };
  }, CLEAN);
  expect(r.same, 'MV_CLEAN is the packet\'s').toBe(true);
  expect(r.bad, r.nbad + ' problems').toEqual([]);
  expect(r.pieces).toBeGreaterThan(1000);
  expect(r.peak).toBeLessThanOrEqual(24);
  expect(r.blinks).toBeGreaterThan(5);
  // C7 and C8 through drawBattle itself: a rect-tier super + crit hit, frozen 100 ms after contact
  const live = await page.evaluate(async () => {
    const B = PixelPets.battle, out = [];
    for (const [type, mid] of [['EMBER', 'kiln_rush'], ['GUST', 'gale_slice'], ['PLAIN', 'full_tilt'], ['SHADE', 'deep_hum']]) {
      B.fx.length = 0;
      const t = performance.now();
      B.fx.push({ who: 'foe', kind: 'mvHit', type, variant: 'super+crit', mid, v: 0, st: 0, hm: 0, spr: null, t0: t - 100, hold0: t, hold1: t + 1e7, dur: 1e8 });
      await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(res))));
      const cv = document.getElementById('battleCanvas'), rects = [];
      for (let i = 0; i < mvPoolCount(); i++) { const p = MV_POOL[i]; if (p.on) rects.push([p.x, p.y, p.w, p.h, p.col]); }
      out.push({ type, mid, W: cv.width, H: cv.height, T: B.view.tc, light: mvLightFx(type), rects });
    }
    B.fx.length = 0;
    return out;
  });
  for (const L of live) {
    expect(L.rects.length, L.mid).toBeGreaterThanOrEqual(13);
    expect(L.rects.slice(0, 8).every((p) => p[4] === L.light), L.mid + ' C7 ring first, in the light').toBe(true);
    expect(L.rects.slice(8, 13).every((p) => p[4] === 'y'), L.mid + ' C8 plus next, in y').toBe(true);
    expect(L.rects.every((p) => p[0] >= 0 && p[1] >= 0 && p[0] + p[2] <= L.W && p[1] + p[3] <= L.H), L.mid + ' inside the canvas').toBe(true);
    expect(L.rects.some((p) => p[4] === 'w'), L.mid + ' no white').toBe(false);
  }
});

for (const [name, effects, reduce, tag] of [['CALM', 'calm', false, 'mvSprCalm'], ['reduced motion', 'full', true, 'mvSprCalm'], ['OFF', 'off', false, 'mvSprOff']]) {
  test.describe(`T12 D2067 ${name}`, () => {
    if (reduce) test.use({ reducedMotion: 'reduce' });
    test(`${name} at stage 0: the v0.1 mark, not tiered`, async ({ page }) => {
      test.setTimeout(120000);
      await boot(page, effects, 0);
      for (const mid of ['flick_flame', 'kiln_rush']) {
        await open(page, mid, 600);
        const log = await tap(page, mid);
        expect(log, mid).toContain(tag);
        expect(log.filter((x) => /^mvTier/.test(x)), mid).toEqual([]);
        expect(log, mid).not.toContain('mvGo');
      }
    });
  });
}
