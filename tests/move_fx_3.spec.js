/* MOVE_FX_3 (D903-D909): the Answerers' hum, the other 17 signatures and Echo flourishes. Players never load this file.
   Real turns run at 390; T2 and T8 run at every width. The holder fights a Lv 2 foe (HP set to 400) so it moves first. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

// move id: [line, the tier that teaches it]
const ANSWERER = {
  tally_tick: ['tallybat', 0], head_count: ['tallybat', 1], census_dive: ['tallybat', 2],
  dim_glow: ['dimlamp', 0], dim_hours: ['dimlamp', 1], lights_out: ['dimlamp', 2],
  file_peck: ['filecrow', 0], stamp_out: ['filecrow', 1], final_entry: ['filecrow', 2],
  cord_nip: ['cordhound', 0], cord_lash: ['cordhound', 1], grid_howl: ['cordhound', 2],
  hum_flicker: ['humwisp', 0], cradle_pulse: ['humwisp', 1], deep_hum: ['humwisp', 2],
};
const SIGS = {
  hilltop_huff: 'stone', neon_zip: 'volt', chill_nibble: 'frost', puff_pirouette: 'gust', mote_blink: 'shade', pomme_bonk: 'beetle',
  loam_tunnel: 'mole', clink_pinch: 'crab', wick_flutter: 'moth', vane_spin: 'vane', doze_drift: 'dormouse', ping_pulse: 'byte',
  seed_fetch: 'fetch', basking_lash: 'skink', spray_slide: 'otter', hush_glide: 'owl', lichen_lob: 'snail',
};
const STATUS = ['head_count', 'dim_hours'];
const ALL = Object.assign({}, ANSWERER, Object.fromEntries(Object.entries(SIGS).map(([m, l]) => [m, [l, 0]])));
// Echo cases: [species, foe form, foe level, holder level, setup, action] played through the debug hooks
const ECHOES = [
  ['tallybat', 'volt/0', 30, 30, null, () => PixelPets.stageNow('foe', 'spd', 1)],
  ['dimlamp', 'volt/0', 30, 30, () => PixelPets.setHp('me', 10), () => PixelPets.moveNow('me', 'gloom_poke')],
  ['filecrow', 'volt/0', 12, 40, () => PixelPets.moveNow('foe', 'zap_tap'), () => PixelPets.moveNow('foe', 'zap_tap')],
  ['cordhound', 'tide/2', 50, 30, null, () => PixelPets.moveNow('me', 'zap_tap')],
  ['humwisp', 'volt/0', 30, 30, null, () => PixelPets.stageNow('foe', 'atk', 2)],
];

function unitSave(line, stage, level, effects) {
  const s = starterSave();
  s.party = [{ id: 'unit1', species: line, stage: stage || 0, xp: 0, bx: 4 * ((level || 9) - 1) ** 2, hunger: 90, happy: 90, energy: 95,
    nick: null, origin: 'wild', moves: [], evoMoves: [] }];
  s.partnerId = 'unit1';
  s.settings.effects = effects || 'full';
  s.settings.textSpeed = 'fast';
  return s;
}
async function boot(page, line, stage, { level, effects } = {}) {
  await installSave(page.context(), unitSave(line, stage, level, effects), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && PixelPets.state && PixelPets.state.party[0]);
  await page.evaluate(() => PixelPets.showTab('walk'));
}
async function open(page, mid, { foe = 'beetle/0', textMs = 0 } = {}) {
  await page.evaluate(([mid, foe]) => {
    const b = PixelPets.battle; if (b.on) b.close();
    PixelPets.healTeam(); PixelPets.setMoves([mid]);
    return PixelPets.forceBattle(foe, 2);
  }, [mid, foe]);
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
async function turn(page, mid, opts) { await open(page, mid, opts); return tap(page, mid); }
// Every animation frame until `ms` later: pool rects (x, y, w, h, col, shadow), the fx list, clocks and the battle log length.
function record(page, ms) {
  return page.evaluate((ms) => {
    window.__mfRec = new Promise((done) => {
      const B = PixelPets.battle, t0 = performance.now(), out = [];
      const tick = () => {
        const now = performance.now(), rects = [];
        for (let i = 0; i < mvPoolCount(); i++) { const p = MV_POOL[i]; if (p.on) rects.push([p.x, p.y, p.w, p.h, p.col, p.sh | 0]); }
        out.push({ t: now, rects, contact: B.punch && B.punch.contactAt, view: Object.assign({}, B.view),
          fx: B.fx.map((e) => ({ kind: e.kind, mid: e.mid || null, sp: e.sp || null, t0: e.t0, dur: e.dur, st: e.st, sig: !!e.sig })),
          echoLine: (B.log || []).some((l) => /Echo:/.test(l)) });
        if (now - t0 < ms) requestAnimationFrame(tick); else done(out);
      };
      requestAnimationFrame(tick);
    });
  }, ms);
}
const recorded = (page) => page.evaluate(() => window.__mfRec);
const ids = (log) => log.filter((x) => x.indexOf(':') >= 0);

test('T1 D903 D908: each of the 32 moves logs its ids after main\'s words; a move without a row logs only main\'s words; the save is unchanged', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  test.setTimeout(600000);
  let cur = null, keys = null;
  for (const [mid, [line, st]] of Object.entries(ALL)) {
    if (cur !== line + st) { await boot(page, line, st); cur = line + st; keys = null; }
    const log = await turn(page, mid);
    expect(log.indexOf('mvGo'), mid).toBeGreaterThanOrEqual(0);
    expect(log.indexOf('mvGo:' + mid), mid).toBeGreaterThan(log.indexOf('mvGo'));
    if (!STATUS.includes(mid)) {
      expect(log.indexOf('mvTravel:' + mid), mid).toBeGreaterThan(log.indexOf('mvGo:' + mid));
      expect(log.indexOf('mvHit:' + mid), mid).toBeGreaterThan(log.indexOf('mvHit'));
    }
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
    expect(saved.v).toBe(2);
    const now = Object.keys(saved).sort();
    expect(now.filter((k) => /^mv|fx|hum_?fx/i.test(k)), mid).toEqual([]);
    if (keys) expect(now, mid).toEqual(keys); else keys = now;
  }
  const log = await turn(page, 'tumble_charge');
  expect(log).toContain('mvGo');
  expect(ids(log)).toEqual([]);
});

for (const [mid, shape] of [['hilltop_huff', 'tumble'], ['puff_pirouette', 'spiral'], ['mote_blink', 'blink'], ['chill_nibble', 'snap'], ['neon_zip', 'dash'], ['cord_lash', 'zig']]) {
  test(`T2 D907: ${shape} (${mid}) ends within one frame of contact with its head on the target`, async ({ page }) => {
    test.setTimeout(90000);
    const [line, st] = ALL[mid];
    await boot(page, line, st);
    await open(page, mid, { textMs: 600 });
    await record(page, 1900);
    await tap(page, mid);
    const frames = await recorded(page);
    const contact = frames.map((f) => f.contact).find((x) => x != null);
    const tr = frames.flatMap((f) => f.fx).find((e) => e.kind === 'mvTravel' && e.mid === mid);
    expect(contact).toBeTruthy();
    expect(tr).toBeTruthy();
    const gap = Math.max(...frames.slice(1).map((f, i) => f.t - frames[i].t));
    expect(Math.abs(tr.t0 + tr.dur - contact)).toBeLessThanOrEqual(Math.max(17, gap) + 1);
    const last = frames.filter((f) => f.t < tr.t0 + tr.dur && f.fx.some((e) => e.kind === 'mvTravel')).pop();
    expect(last).toBeTruthy();
    const T = last.view.tc, S = last.view.sc, left = Math.hypot(T[0] - S[0], T[1] - S[1]) * Math.max(0, tr.t0 + tr.dur - last.t) / tr.dur;
    expect(last.rects.some((r) => Math.hypot(r[0] + r[2] / 2 - T[0], r[1] + r[3] / 2 - T[1]) <= 8 + left), 'a travel rect near the target on the last travel frame').toBe(true);
  });
}

test('T3 D905: the hum grows with the tier and the timing does not', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  test.setTimeout(120000);
  await boot(page, 'tallybat', 2);
  const r = await page.evaluate(() => {
    const out = [];
    for (let st = 0; st < 3; st++) {
      const row = mvMoveRow('tally_tick', st), halo = row.go.find((s) => s.hum === 'halo');
      const answers = row.hit.filter((s) => s.shape === 'ring' && s.hum !== 'answer' && s.col[0] === 'y');
      const tally = row.hit.find((s) => s.shape === 'tally'), fall = row.hit.find((s) => s.shape === 'fall');
      out.push({ y: halo.col.filter((c) => c === 'y').length, echo: answers.length, tallyB: tally.b, fallN: fall.n,
        ms: [row.go, row.travel, row.hit].map((l) => l.filter((s) => !(s.shape === 'ring' && s.col[0] === 'y' && s.hum == null)).map((s) => s.ms.join('-')).join(',')) });
    }
    return { out, same: mvMoveRow('tally_tick', 1) === mvMoveRow('tally_tick', 1), base: mvMoveRow('tally_tick', 0) === MV_MOVE.tally_tick };
  });
  expect(r.out.map((x) => x.y)).toEqual([1, 2, 4]);
  expect(r.out.map((x) => x.echo)).toEqual([0, 0, 1]);
  expect(r.out.map((x) => x.tallyB)).toEqual([1, 1, 2]);
  expect(r.out[1].fallN).toBe(r.out[0].fallN + 2);
  expect(r.out[1].ms).toEqual(r.out[0].ms);
  expect(r.out[2].ms).toEqual(r.out[0].ms);
  expect(r.same).toBe(true);   // grown rows are made once and kept
  expect(r.base).toBe(true);
  // in a real turn at Answering every bespoke fx carries tier 2
  await open(page, 'tally_tick', { textMs: 300 });
  await record(page, 1400);
  await tap(page, 'tally_tick');
  const fx = (await recorded(page)).flatMap((f) => f.fx).filter((e) => e.mid === 'tally_tick');
  expect(fx.length).toBeGreaterThan(0);
  expect(fx.every((e) => e.st === 2)).toBe(true);
});

test('T4 D905: a non-Answerer holder at stage 2 draws its row exactly as at stage 0', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  await boot(page, 'stone', 2);
  await open(page, 'hilltop_huff', { textMs: 300 });
  await record(page, 1400);
  const log = await tap(page, 'hilltop_huff');
  expect(log).toContain('mvHit:hilltop_huff');
  const fx = (await recorded(page)).flatMap((f) => f.fx).filter((e) => e.mid === 'hilltop_huff');
  expect(fx.length).toBeGreaterThan(0);
  expect(fx.every((e) => e.st === 0)).toBe(true);
});

for (const [sp, foe, flvl, lvl, setup, action] of ECHOES) {
  test(`T5 D906: ${sp}'s Echo plays one flourish of 8 blocks or fewer when its line shows`, async ({ page }) => {
    test.skip(page.viewportSize().width !== 390, '390 only');
    test.setTimeout(90000);
    await boot(page, sp, 0, { level: lvl });
    await page.evaluate(([f, l]) => PixelPets.forceBattle(f, l), [foe, flvl]);
    await page.waitForFunction(() => PixelPets.battle.on && PixelPets.battle.state === 'CHOOSE', null, { timeout: 20000 });
    await page.evaluate(() => {
      const b = PixelPets.battle; b.animMs = null; b.textMs = 600; b.rng = () => 0.5; b.fxLog = [];
      window.__echoMax = 0;
      const draw = window.mvEchoDraw;   // count the blocks each flourish frame asks for
      window.mvEchoDraw = function (e, age, U, O, put) { let n = 0; const r = draw.call(this, e, age, U, O, function () { n++; return put.apply(this, arguments); }); window.__echoMax = Math.max(window.__echoMax, n); return r; };
    });
    if (setup) { await page.evaluate(`(${setup.toString()})()`); await page.waitForTimeout(300); }
    await record(page, 2600);
    await page.evaluate(`(${action.toString()})()`);
    const frames = await recorded(page);
    const r = await page.evaluate(() => ({ log: PixelPets.battle.fxLog.filter((x) => x.indexOf('mvEcho') === 0), max: window.__echoMax }));
    expect(r.log).toEqual(['mvEcho:' + sp]);
    expect(r.max).toBeGreaterThan(0);
    expect(r.max).toBeLessThanOrEqual(8);
    const e = frames.flatMap((f) => f.fx).find((x) => x.kind === 'mvEcho');
    const line = frames.find((f) => f.echoLine);
    expect(e && line).toBeTruthy();
    const d = e.t0 - line.t;   // the beat starts the frame its line shows (140 ms later when the line follows a hit)
    expect(d).toBeGreaterThanOrEqual(-40);
    expect(d).toBeLessThanOrEqual(200);
    expect(Math.max(...frames.map((f) => f.view.pool || 0))).toBeLessThanOrEqual(24);
  });
}

test('T6 D903: every bespoke row stays at 24 slots or under at every tier, variant and side', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  test.setTimeout(120000);
  await boot(page, 'tallybat', 0);
  await open(page, 'tally_tick');
  const r = await page.evaluate(() => {
    const v = PixelPets.battle.view, C = [[v.sc, v.tc], [v.tc, v.sc]];
    let peak = 0, worst = '';
    const sweep = (mid, st) => {
      const row = mvMoveRow(mid, st);
      for (const [S, T] of C) for (const sup of [false, true]) for (let vv = 0; vv < 3; vv++) {
        mvVarSet(vv);
        for (let a = 0; a < 560; a += 10) {   // the hit with its clock paused through a 120 ms stop, plus the super ring
          const age = a < 120 ? 0 : a - 120; let n = 0; const put = () => { n++; };
          for (const s of row.hit || []) { const k = mvSegK(s, age); if (k >= 0) mvShape(s, k, age, S, T, put); }
          if (sup && age < 200) { const rk = age / 200, rr = 6 + 12 * rk; mvShape({ shape: 'ring', r: [rr, rr], col: 'y', ms: [0, 200], b: 2, n: 8, at: 'target' }, rk, age, S, T, put); }
          if (n > peak) { peak = n; worst = mid + '@' + st; }
        }
        for (const part of ['go', 'travel', 'status']) for (let a = 0; a <= (part === 'go' ? 1600 : 420); a += 10) {
          let n = 0; const put = () => { n++; };
          if (part === 'go' && row.tier === 1 && a < 120) mvShape({ shape: 'sparkle', col: 'y', at: 'user', ms: [0, 120], b: 2 }, 1, a, S, T, put);
          for (const s of row[part] || []) { const k = mvSegK(s, a); if (k >= 0) mvShape(s, k, a, S, T, put); }
          if (n > peak) { peak = n; worst = mid + '@' + st + ' ' + part; }
        }
      }
      mvVarSet(0);
    };
    for (const mid of Object.keys(MV_MOVE)) for (let st = 0; st < 3; st++) sweep(mid, st);
    return { peak, worst, n: Object.keys(MV_MOVE).length };
  });
  expect(r.n).toBe(44);
  expect(r.peak, r.worst).toBeLessThanOrEqual(24);
});

test('T7 D908: Stoke Up\'s and Sap Sip\'s sparks sit on the user; no main row asks a target-only shape for the user', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  await boot(page, 'ember', 0);
  const r = await page.evaluate(() => {
    const S = [15, 64], T = [46, 24], near = (mid) => {
      const seg = MV_MOVE[mid].status.find((s) => s.shape === 'rise'), pts = [];
      mvShape(seg, 0.5, seg.ms[0] + 50, S, T, (x, y, w, h) => pts.push([x, y]));
      return pts.length > 0 && pts.every(([x, y]) => Math.abs(x - S[0]) <= 12 && Math.abs(y - S[1]) <= 16);
    };
    const T_ONLY = ['drop', 'burst', 'star', 'cross', 'ring', 'crescent', 'rise', 'fall', 'dust', 'speck', 'crackle', 'streaks'], bad = [];
    for (const [type, a] of Object.entries(MV_ANIM)) for (const s of [].concat(a.go || [], a.hit || [])) if (s.at === 'user' && T_ONLY.includes(s.shape)) bad.push(type + ' ' + s.shape);
    for (const [type, p] of Object.entries(MV_PUNCH.types)) for (const s of p.hit_v2 || []) if (s.at === 'user' && T_ONLY.includes(s.shape)) bad.push(type + ' hit_v2 ' + s.shape);
    return { stoke: near('stoke_up'), sap: near('sap_sip'), bad };
  });
  expect(r.stoke).toBe(true);
  expect(r.sap).toBe(true);
  expect(r.bad).toEqual([]);
});

for (const [name, effects, reduce] of [['CALM', 'calm', false], ['reduced motion', 'full', true], ['OFF', 'off', false]]) {
  test.describe(`T8 D906 ${name}`, () => {
    if (reduce) test.use({ reducedMotion: 'reduce' });
    test(`${name}: no bespoke id and no Echo flourish`, async ({ page }) => {
      test.setTimeout(90000);
      await boot(page, 'tallybat', 0, { effects });
      const log = await turn(page, 'tally_tick');
      expect(ids(log)).toEqual([]);
      expect(log).not.toContain('mvGo');
      await boot(page, 'cordhound', 0, { level: 30, effects });
      await page.evaluate(() => PixelPets.forceBattle('tide/2', 50));
      await page.waitForFunction(() => PixelPets.battle.on && PixelPets.battle.state === 'CHOOSE', null, { timeout: 20000 });
      await page.evaluate(() => { const b = PixelPets.battle; b.textMs = 300; b.rng = () => 0.5; b.fxLog = []; });
      await page.evaluate(() => PixelPets.moveNow('me', 'zap_tap'));
      const r = await page.evaluate(() => ({ log: PixelPets.battle.fxLog.slice(), lines: (PixelPets.battle.log || []).filter((l) => /Echo:/.test(l)) }));
      expect(r.lines.length).toBeGreaterThan(0);   // the Echo still happens and its line still shows
      expect(r.log.filter((x) => x.indexOf('mvEcho') === 0)).toEqual([]);
    });
  });
}

test('T9 D907: the signature beat plays for the new signatures, and no bespoke block is white', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  test.setTimeout(180000);
  for (const mid of ['tally_tick', 'cord_nip', 'hilltop_huff', 'ping_pulse', 'mote_blink', 'lichen_lob']) {
    const [line, st] = ALL[mid];
    await boot(page, line, st);
    await open(page, mid, { textMs: 300 });
    await record(page, 1400);
    await tap(page, mid);
    const frames = await recorded(page);
    expect(frames.flatMap((f) => f.fx).some((e) => e.kind === 'mvGo' && e.mid === mid && e.sig), mid).toBe(true);
    expect(frames.flatMap((f) => f.rects).filter((r) => r[5] === 1 && r[4] === 'w'), mid).toEqual([]);
  }
});

test('T10 all: MV_MOVE holds the 12 pilot rows and the 32 new ones, MV_ECHO the five Answerers', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  await boot(page, 'ember', 0);
  const r = await page.evaluate((all) => ({ n: Object.keys(MV_MOVE).length, missing: all.filter((m) => !MV_MOVE[m]), echo: Object.keys(MV_ECHO).sort() }), Object.keys(ALL));
  expect(r.n).toBe(44);
  expect(r.missing).toEqual([]);
  expect(r.echo).toEqual(['cordhound', 'dimlamp', 'filecrow', 'humwisp', 'tallybat']);
});
