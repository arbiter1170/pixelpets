/* MOVE_FX_2 pilot (D825-D832): bespoke charge, travel, impact and aftermath for the 12 starter moves. Players never load this file.
   Real turns run at 390; T2 and T8 run at every width. The holder fights a Lv 2 foe (HP set to 400) so it moves first. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const PILOT = {
  foxfire_flick: 'ember', flick_flame: 'ember', stoke_up: 'ember', coal_nudge: 'ember',
  droplet_dash: 'tide', ripple_jab: 'tide', mist_veil: 'tide', brook_bop: 'tide',
  burrow_bounce: 'bloom', seed_toss: 'bloom', sap_sip: 'bloom', clover_swat: 'bloom',
};
const STATUS = ['stoke_up', 'mist_veil', 'sap_sip'];
const BEATS = { ember: 'bloom/0', tide: 'ember/0', bloom: 'tide/0' };   // the foe each line hits super-effectively

function lineSave(line, effects) {
  const s = starterSave();
  s.party[0].species = line;
  s.flags['story.starter_line'] = line;
  s.settings.effects = effects || 'full';
  s.settings.textSpeed = 'fast';
  return s;
}
async function boot(page, line, effects) {
  await installSave(page.context(), lineSave(line, effects), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && PixelPets.state && PixelPets.state.party[0]);
  await page.evaluate(() => PixelPets.showTab('walk'));
}
// One turn of `mid` against `foe`, in two halves so a recorder can start between them. textMs: the "tries" line length (0 skips it).
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
// Tap the move; resolves with the fx log once the turn is back to CHOOSE.
async function tap(page, mid) {
  await page.locator('[data-bact="fight"]').click();
  await page.locator(`#btMoves button[data-move="${mid}"]`).click();
  await page.waitForFunction(() => PixelPets.battle.state === 'CHOOSE' || !PixelPets.battle.on, null, { timeout: 20000 });
  return page.evaluate(() => PixelPets.battle.fxLog.slice());
}
async function turn(page, mid, opts) {
  await open(page, mid, opts);
  return tap(page, mid);
}
// Record every animation frame from now until `ms` later: pool rects (x, y, w, h, col, shadow), clocks and a sky pixel.
function record(page, ms) {
  return page.evaluate((ms) => {
    window.__mfRec = new Promise((done) => {
      const B = PixelPets.battle, c = document.querySelector('#battleCanvas'), g = c.getContext('2d'), t0 = performance.now(), out = [];
      const tick = () => {
        const now = performance.now(), rects = [];
        for (let i = 0; i < mvPoolCount(); i++) { const p = MV_POOL[i]; if (p.on) rects.push([p.x, p.y, p.w, p.h, p.col, p.sh | 0]); }
        const sky = g.getImageData(Math.floor(c.width / 2), 1, 1, 1).data;
        out.push({ t: now, rects, hold: B.hold || 0, holdT: B.holdT || 0, contact: B.punch && B.punch.contactAt, W: c.width, H: c.height,
          fx: B.fx.map((e) => ({ kind: e.kind, mid: e.mid || null, t0: e.t0, dur: e.dur, v: e.v, lift: e.lift, sig: !!e.sig })),
          sky: sky[0] + sky[1] + sky[2], view: Object.assign({}, B.view) });
        if (now - t0 < ms) requestAnimationFrame(tick); else done(out);
      };
      requestAnimationFrame(tick);
    });
  }, ms);
}
const recorded = (page) => page.evaluate(() => window.__mfRec);

test('T1 D831: each pilot move logs its id after main\'s words; a tier 3 move logs only main\'s words; the save is unchanged', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  test.setTimeout(240000);
  let line = null, keys = null;
  for (const [mid, l] of Object.entries(PILOT)) {
    if (l !== line) { await boot(page, l); line = l; keys = null; }
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
    expect(now.filter((k) => /^mv|fx/i.test(k)), mid).toEqual([]);
    if (keys) expect(now, mid).toEqual(keys); else keys = now;
  }
  await page.evaluate(() => { delete MV_MOVE.tumble_charge; delete MV_MOVE.wobble; });   // MOVE_FX_4: every move has a row now; take away the holder's move and the foe's answer for this check
  const log = await turn(page, 'tumble_charge');
  expect(log).toContain('mvGo');
  expect(log.filter((x) => x.indexOf(':') >= 0)).toEqual([]);
});

test('T2 D827: the travel ends within one frame of contact, its head on the target on the last frame', async ({ page }) => {
  test.setTimeout(90000);
  await boot(page, 'ember');
  const go = turn(page, 'foxfire_flick', { textMs: 600 });
  await page.waitForFunction(() => PixelPets.battle.fxLog.indexOf('mvGo') >= 0);
  await record(page, 1400);
  await go;
  const frames = await recorded(page);
  const contact = frames.map((f) => f.contact).find((x) => x != null);
  const tr = frames.flatMap((f) => f.fx).find((e) => e.kind === 'mvTravel');
  expect(contact).toBeTruthy();
  expect(tr).toBeTruthy();
  // one frame is the longest gap the recorder saw between two frames (60 Hz unloaded, longer when the workers share a CPU)
  const gap = Math.max(...frames.slice(1).map((f, i) => f.t - frames[i].t));
  expect(Math.abs(tr.t0 + tr.dur - contact)).toBeLessThanOrEqual(Math.max(17, gap) + 1);
  const last = frames.filter((f) => f.t < tr.t0 + tr.dur && f.fx.some((e) => e.kind === 'mvTravel')).pop();
  expect(last).toBeTruthy();
  // by the last travel frame the head has covered all but that frame's share of the S to T path
  const T = last.view.tc, S = last.view.sc, left = Math.hypot(T[0] - S[0], T[1] - S[1]) * Math.max(0, tr.t0 + tr.dur - last.t) / tr.dur;
  const near = last.rects.some((r) => Math.hypot(r[0] + r[2] / 2 - T[0], r[1] + r[3] / 2 - T[1]) <= 8 + left);
  expect(near, 'a travel rect within 8 px of the target centre on the last travel frame').toBe(true);
});

test('T3 D827: a bespoke hit holds its rects still through the hit-stop', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  await boot(page, 'tide');
  const go = turn(page, 'droplet_dash', { textMs: 300 });
  await page.waitForFunction(() => PixelPets.battle.fxLog.indexOf('mvGo') >= 0);
  await record(page, 1200);
  await go;
  const frames = await recorded(page);
  const inHold = frames.filter((f) => f.hold && f.t > f.holdT + 17 && f.t < f.hold - 2 && f.fx.some((e) => e.kind === 'mvHit' && e.mid));
  expect(inHold.length).toBeGreaterThanOrEqual(2);
  const first = JSON.stringify(inHold[0].rects);
  expect(inHold[0].rects.length).toBeGreaterThan(0);
  for (const f of inHold) expect(JSON.stringify(f.rects)).toBe(first);
});

test('T4 D826: variations keep each shape\'s rect count and move its offsets; two uses get different variations', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  await boot(page, 'ember');
  const res = await page.evaluate((ids) => {
    const S = [15, 64], T = [46, 24], out = { counts: [], moved: [] };
    for (const mid of ids) {
      const row = mvMoveRow(mid);
      for (const part of ['go', 'travel', 'hit', 'status']) for (const seg of (row[part] || [])) {
        const got = [];
        for (let v = 0; v < 3; v++) { mvVarSet(v); const r = []; mvShape(seg, 0.5, seg.ms[0] + 30, S, T, (x, y, w, h) => r.push([x, y, w, h])); got.push(r); }
        mvVarSet(0);
        out.counts.push([mid, part, seg.shape, got.map((r) => r.length)]);
        const varies = ['orbit', 'rise', 'fall', 'speck'].includes(seg.shape) || (['flicker', 'hop', 'comet'].includes(seg.shape) && seg.arc);
        if (varies) out.moved.push([mid, part, seg.shape, JSON.stringify(got[0]) !== JSON.stringify(got[1]) && JSON.stringify(got[1]) !== JSON.stringify(got[2])]);
      }
    }
    return out;
  }, Object.keys(PILOT));
  for (const [mid, part, shape, n] of res.counts) expect(new Set(n).size, `${mid} ${part} ${shape} ${n}`).toBe(1);
  expect(res.moved.length).toBeGreaterThan(10);
  for (const [mid, part, shape, moved] of res.moved) expect(moved, `${mid} ${part} ${shape}`).toBe(true);
  // two uses in a row: the GO fx carry different variations
  await turn(page, 'flick_flame');
  const v1 = await page.evaluate(() => PixelPets.battle.mvN);
  await page.evaluate(() => { PixelPets.battle.foePlan = { move: 'wobble' }; });
  await page.locator('[data-bact="fight"]').click();
  await page.locator('#btMoves button[data-move="flick_flame"]').click();
  await page.waitForFunction(() => PixelPets.battle.state === 'CHOOSE' || !PixelPets.battle.on, null, { timeout: 20000 });
  const v2 = await page.evaluate(() => PixelPets.battle.mvN);
  expect(v2).not.toBe(v1);
});

test('T5 D826: a bespoke rect draws a 1 px k shadow down-right and takes no extra slot; main\'s rects take none', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  await boot(page, 'ember');
  const r = await page.evaluate(() => {
    const cv = document.createElement('canvas'); cv.width = 20; cv.height = 20; const g = cv.getContext('2d');
    const px = (x, y) => Array.from(g.getImageData(x, y, 1, 1).data).slice(0, 3).join(',');
    const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(',');
    mvPoolReset(); mvShadowSet(true); mvPoolPut(5, 5, 2, 2, 'y'); mvShadowSet(false); mvPoolDraw(g);
    const on = { n: mvPoolCount(), shadow: px(7, 7), body: px(5, 5) };
    g.clearRect(0, 0, 20, 20); mvPoolReset(); mvPoolPut(5, 5, 2, 2, 'y'); mvPoolDraw(g);
    const off = { n: mvPoolCount(), below: Array.from(g.getImageData(7, 7, 1, 1).data)[3] };
    mvPoolReset();
    return { on, off, k: hex(PAL.k), y: hex(PAL.y) };
  });
  expect(r.on.n).toBe(1);
  expect(r.on.shadow).toBe(r.k);
  expect(r.on.body).toBe(r.y);
  expect(r.off.n).toBe(1);
  expect(r.off.below).toBe(0);
  // in a real turn, every rect of a bespoke hit carries the shadow flag
  const go = turn(page, 'coal_nudge', { textMs: 300 });
  await page.waitForFunction(() => PixelPets.battle.fxLog.indexOf('mvGo') >= 0);
  await record(page, 1200);
  await go;
  const frames = await recorded(page);
  const hitFrames = frames.filter((f) => f.fx.some((e) => e.kind === 'mvHit' && e.mid) && f.rects.length);
  expect(hitFrames.length).toBeGreaterThan(0);
  for (const f of hitFrames) expect(f.rects.every((x) => x[5] === 1)).toBe(true);
});

test('T6 D827: the pool peaks at 24 or under on super-effective hits of all 9 damaging pilot moves', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  test.setTimeout(240000);
  let line = null;
  for (const [mid, l] of Object.entries(PILOT)) {
    if (STATUS.includes(mid)) continue;
    if (l !== line) { await boot(page, l); line = l; }
    const go = turn(page, mid, { foe: BEATS[l], textMs: 300 });
    await page.waitForFunction(() => PixelPets.battle.fxLog.indexOf('mvGo') >= 0);
    await record(page, 1300);
    const log = await go;
    const frames = await recorded(page);
    expect(log, mid).toContain('mvHit:' + mid);
    const peak = Math.max(...frames.map((f) => f.view.pool || 0));
    expect(peak, mid).toBeLessThanOrEqual(24);
    expect(peak, mid).toBeGreaterThan(0);
  }
});

test('T7 D829: a signature dims the backdrop for 200 ms, never white, and main\'s white-frame rule still holds', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  await boot(page, 'ember');
  await open(page, 'foxfire_flick', { textMs: 600 });
  await record(page, 1500);
  await tap(page, 'foxfire_flick');
  const frames = await recorded(page);
  const goFx = frames.flatMap((f) => f.fx).find((e) => e.kind === 'mvGo' && e.sig);
  expect(goFx).toBeTruthy();
  const before = frames.filter((f) => f.t < goFx.t0).map((f) => f.sky);
  const mid = frames.filter((f) => f.t > goFx.t0 + 70 && f.t < goFx.t0 + 130).map((f) => f.sky);
  const after = frames.filter((f) => f.t > goFx.t0 + 260 && f.t < goFx.t0 + 500).map((f) => f.sky);
  expect(before.length && mid.length && after.length).toBeTruthy();
  // k at 0.25 over the sky: expected sum at the peak is sky * 0.75 + k * 0.25; allow the sin ramp (>= 0.85 of peak in 70-130 ms)
  const k = await page.evaluate(() => [1, 3, 5].reduce((a, i) => a + parseInt(PAL.k.slice(i, i + 2), 16), 0));
  const sky = Math.max(...before), want = sky - 0.85 * 0.25 * (sky - k);
  expect(Math.min(...mid)).toBeLessThanOrEqual(Math.ceil(want) + 2);   // darker in the middle of the beat
  expect(Math.max(...frames.map((f) => f.sky))).toBeLessThanOrEqual(sky + 3);   // never lighter (never white)
  expect(Math.max(...after)).toBeGreaterThanOrEqual(sky - 3);   // back to the same sky after
  // main's white rule still holds (moves_v2 test 11): each white run is 80 ms or less and onsets are 334 ms apart; the foe's answer may add its own
  const whites = await page.evaluate(() => (PixelPets.battle.whites || []).map((w) => [w.t0, w.until]));
  for (const [a, b] of whites) expect(b - a).toBeLessThanOrEqual(80);
  for (let i = 1; i < whites.length; i++) expect(whites[i][0] - whites[i - 1][0]).toBeGreaterThanOrEqual(334);
});

for (const [name, effects, reduce] of [['CALM', 'calm', false], ['reduced motion', 'full', true], ['OFF', 'off', false]]) {
  test.describe(`T8 D828 ${name}`, () => {
    if (reduce) test.use({ reducedMotion: 'reduce' });
    test(`${name}: no bespoke id, travel or dim; main's words only`, async ({ page }) => {
      await boot(page, 'ember', effects);
      const log = await turn(page, 'foxfire_flick');
      expect(log.filter((x) => x.indexOf(':') >= 0)).toEqual([]);
      expect(log).not.toContain('mvGo');
      if (effects !== 'off') expect(log).toContain('mvMark');
      else expect(log).not.toContain('mvMark');
    });
  });
}

test('T9 D830: Stoke Up, Mist Veil and Sap Sip draw their own status rows and lift the user 1 px', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  for (const mid of STATUS) {
    await boot(page, PILOT[mid]);
    const go = turn(page, mid, { textMs: 300 });
    await page.waitForFunction(() => PixelPets.battle.fxLog.indexOf('mvGo') >= 0);
    await record(page, 500);
    const log = await go;
    const frames = await recorded(page);
    expect(log, mid).toContain('mvGo:' + mid);
    const e = frames.flatMap((f) => f.fx).find((x) => x.kind === 'mvGo' && x.mid === mid);
    expect(e && e.lift, mid).toBe(1);
    expect(Math.max(...frames.map((f) => f.rects.length)), mid).toBeGreaterThan(0);
  }
});

test('T10 all: a move without a row keeps main\'s rows, no shadow and variation 0', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  await boot(page, 'ember');
  const n = await page.evaluate(() => Object.keys(MV_MOVE).length);
  await page.evaluate(() => { delete MV_MOVE.kiln_rush; delete MV_MOVE.tumble_charge; delete MV_MOVE.wobble; });   // MOVE_FX_4: every move has a row now; take these away (wobble is the foe's answer) for this check
  const r = await page.evaluate(() => ({
    row: mvMoveRow('kiln_rush'), same: mvHitRows('EMBER', 'kiln_rush') === mvPunchType('EMBER').hit_v2,
    anim: mvAnim('EMBER', 'kiln_rush') === mvAnim('EMBER'), pose: mvPose('kiln_rush'), n: Object.keys(MV_MOVE).length,
  }));
  expect(r.row).toBeNull();
  expect(r.same).toBe(true);
  expect(r.anim).toBe(true);
  expect(r.pose).toEqual({ lunge: 6, hop: 0, lift: 0 });
  expect(n).toBe(122);   // the 12 pilot rows, MOVE_FX_3's 32 (D903) and MOVE_FX_4's 78 (D934)
  await turn(page, 'tumble_charge', { textMs: 300 });
  const flags = await page.evaluate(() => { const o = []; for (let i = 0; i < mvPoolCount(); i++) o.push(MV_POOL[i].sh | 0); return o; });
  expect(flags.every((x) => x === 0)).toBe(true);
});
