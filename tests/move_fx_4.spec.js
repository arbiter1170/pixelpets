/* MOVE_FX_4 (D934-D938): the remaining 78 moves, the Answerer hum on shared moves, and a bespoke super ring that is never white.
   Players never load this file. Real turns run at 390; T3 and T7 run at every width. The holder fights a Lv 2 foe (HP set to 400). */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

// move id: a line that learns it (a plain Walkling where one does; Wobble is everyone's fallback)
const HOLDER = {
  bump: 'ember', tumble_charge: 'ember', wobble: 'ember', kiln_rush: 'ember', undertow: 'tide', thorn_lash: 'bloom', pebble_flick: 'bloom',
  brace_rock: 'stone', boulder_drop: 'tide', zap_tap: 'volt', neon_flash: 'volt', arc_bolt: 'ember', frost_nip: 'tide', cold_snap: 'frost',
  sleet_pelt: 'stone', puff_shot: 'volt', updraft: 'ember', gale_slice: 'bloom', gloom_poke: 'shade', night_veil: 'shade',
  dusk_fang: 'ember', full_tilt: 'ember', kindle_burst: 'ember', breaker_wave: 'tide', briar_volley: 'bloom', quarry_crash: 'stone',
  neon_burst: 'volt', rime_rush: 'frost', tempest_dive: 'gust', nightfall: 'shade', cinder_pounce: 'ember', puddle_stomp: 'tide',
  petal_hop: 'bloom', scree_slide: 'stone', whisker_spark: 'volt', flurry_fluff: 'frost', kite_swoop: 'gust', gloam_swipe: 'shade',
  shell_roll: 'beetle', burrow_bash: 'mole', shard_pinch: 'crab', lantern_waltz: 'moth', pinwheel_peck: 'vane', lullaby_hum: 'dormouse',
  torch_tail: 'ember', riptide_howl: 'tide', bramble_kick: 'bloom', summit_slam: 'stone', static_lunge: 'volt', glacier_press: 'frost',
  crest_cyclone: 'gust', eclipse_rush: 'shade', windfall: 'beetle', hedgerow_crash: 'mole', mosaic_clamp: 'crab', halo_surge: 'moth',
  squall_line: 'vane', moon_cloak: 'dormouse', cursor_tap: 'byte', screen_glow: 'byte', hover_hum: 'byte', bit_burst: 'byte',
  archive_surge: 'byte', fetch_dash: 'fetch', steadfast_paw: 'fetch', gravel_skid: 'stone', fizz_jolt: 'volt', hoarfrost_tap: 'frost',
  dandelion_dart: 'gust', gloomstep: 'shade', smoulder_stare: 'ember', tidepool_rest: 'tide', burr_tangle: 'bloom', whetstone: 'stone',
  circuit_hum: 'volt', frost_coat: 'frost', dander_drift: 'gust', dusk_shroud: 'shade',
};
const STATUS = ['brace_rock', 'neon_flash', 'updraft', 'night_veil', 'lantern_waltz', 'lullaby_hum', 'screen_glow', 'smoulder_stare', 'tidepool_rest',
  'burr_tangle', 'whetstone', 'circuit_hum', 'frost_coat', 'dander_drift', 'dusk_shroud'];
// the 18 shared moves an Answerer learns (moves.js LEARNSETS); they wear the hum when an Answerer uses them (D936)
const SHARED = ['zap_tap', 'neon_flash', 'arc_bolt', 'gloom_poke', 'night_veil', 'dusk_fang', 'full_tilt', 'neon_burst', 'nightfall', 'whisker_spark',
  'gloam_swipe', 'lullaby_hum', 'static_lunge', 'eclipse_rush', 'moon_cloak', 'cursor_tap', 'screen_glow', 'hover_hum'];

function unitSave(line, stage, effects) {
  const s = starterSave();
  s.party = [{ id: 'unit1', species: line, stage: stage || 0, xp: 0, bx: 4 * 8 * 8, hunger: 90, happy: 90, energy: 95, nick: null, origin: 'wild', moves: [], evoMoves: [] }];
  s.partnerId = 'unit1';
  s.settings.effects = effects || 'full';
  s.settings.textSpeed = 'fast';
  return s;
}
async function boot(page, line, stage, effects) {
  await installSave(page.context(), unitSave(line, stage, effects), { quietDay: true });
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
function record(page, ms) {
  return page.evaluate((ms) => {
    window.__mfRec = new Promise((done) => {
      const B = PixelPets.battle, t0 = performance.now(), out = [];
      const tick = () => {
        const now = performance.now(), rects = [];
        for (let i = 0; i < mvPoolCount(); i++) { const p = MV_POOL[i]; if (p.on) rects.push([p.x, p.y, p.w, p.h, p.col, p.sh | 0]); }
        out.push({ t: now, rects, contact: B.punch && B.punch.contactAt, view: Object.assign({}, B.view),
          fx: B.fx.map((e) => ({ kind: e.kind, mid: e.mid || null, t0: e.t0, dur: e.dur, st: e.st, hm: e.hm })) });
        if (now - t0 < ms) requestAnimationFrame(tick); else done(out);
      };
      requestAnimationFrame(tick);
    });
  }, ms);
}
const recorded = (page) => page.evaluate(() => window.__mfRec);
const ids = (log) => log.filter((x) => x.indexOf(':') >= 0);

test('T1 D934: each of the 78 moves logs its ids after main\'s words; the save is unchanged', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  test.setTimeout(900000);
  let cur = null, keys = null;
  const order = Object.entries(HOLDER).sort((a, b) => a[1].localeCompare(b[1]));
  for (const [mid, line] of order) {
    if (cur !== line) { await boot(page, line, 0); cur = line; keys = null; }
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
});

test('T2 D934: every move in the game has a row', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  await boot(page, 'ember', 0);
  const r = await page.evaluate(() => {
    const all = Object.keys(PixelPets.moves());
    return { n: all.length, missing: all.filter((m) => !mvMoveRow(m)), rows: Object.keys(MV_MOVE).length };
  });
  expect(r.missing).toEqual([]);
  expect(r.n).toBe(122);
  expect(r.rows).toBe(122);
});

for (const [mid, shape] of [['kiln_rush', 'flicker'], ['undertow', 'skim'], ['thorn_lash', 'hop'], ['boulder_drop', 'tumble'], ['arc_bolt', 'zig'],
  ['sleet_pelt', 'snap'], ['gale_slice', 'spiral'], ['dusk_fang', 'blink'], ['bump', 'dash']]) {
  test(`T3 D935: ${shape} (${mid}) ends within one frame of contact with its head on the target`, async ({ page }) => {
    test.setTimeout(90000);
    await boot(page, HOLDER[mid], 0);
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

test('T4 D936: a shared move wears the hum only for an Answerer, and it grows with the tier', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  test.setTimeout(120000);
  await boot(page, 'volt', 0);
  const r = await page.evaluate(() => {
    const halo = (row) => (row.go || []).find((s) => s.hum === 'halo');
    const answer = (row) => (row.hit || []).filter((s) => s.hum === 'answer').length;
    const plain = mvMoveRow('zap_tap', 0, 0), y = [];
    for (let st = 0; st < 3; st++) y.push(halo(mvMoveRow('zap_tap', st, 1)).col.filter((c) => c === 'y').length);
    const status = mvMoveRow('neon_flash', 0, 1).status;
    return { plainHalo: !!halo(plain), plainAnswer: answer(plain), y, hummedAnswer: answer(mvMoveRow('zap_tap', 0, 1)),
      echo: mvMoveRow('zap_tap', 2, 1).hit.filter((s) => s.shape === 'ring' && s.col[0] === 'y' && s.hum == null).length,
      statusHalo: status[0].hum === 'halo' && status[status.length - 1].hum === 'answer',
      own: mvMoveRow('tally_tick', 0, 1) === MV_MOVE.tally_tick, same: mvMoveRow('zap_tap', 0, 1) === mvMoveRow('zap_tap', 0, 1),
      timing: JSON.stringify(plain.hit.map((s) => s.ms)) === JSON.stringify(mvMoveRow('zap_tap', 0, 1).hit.filter((s) => !s.hum).map((s) => s.ms)) };
  });
  expect(r.plainHalo).toBe(false);
  expect(r.plainAnswer).toBe(0);
  expect(r.y).toEqual([1, 2, 4]);
  expect(r.hummedAnswer).toBe(1);
  expect(r.echo).toBe(1);
  expect(r.statusHalo).toBe(true);
  expect(r.own).toBe(true);   // an Answerer's own move is not hummed twice
  expect(r.same).toBe(true);  // the hummed row is made once and kept
  expect(r.timing).toBe(true);
  // real turns: Zipmite's Zap Tap carries hm 0, Tallybat's (Answering) carries hm 1 and tier 2
  for (const [line, st, hm] of [['volt', 0, 0], ['tallybat', 2, 1]]) {
    await boot(page, line, st);
    await open(page, 'zap_tap', { textMs: 300 });
    await record(page, 1400);
    await tap(page, 'zap_tap');
    const fx = (await recorded(page)).flatMap((f) => f.fx).filter((e) => e.mid === 'zap_tap');
    expect(fx.length, line).toBeGreaterThan(0);
    expect(fx.every((e) => e.hm === hm && e.st === st), line).toBe(true);
  }
});

test('T5 D935: every row stays at 24 slots or under for every user, variant and side', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  test.setTimeout(240000);
  await boot(page, 'ember', 0);
  await open(page, 'kiln_rush');
  const r = await page.evaluate((shared) => {
    const v = PixelPets.battle.view, C = [[v.sc, v.tc], [v.tc, v.sc]];
    // an Answerer's own moves carry their hum already; the shared moves and the fallback wear it for an Answerer
    const ans = new Set(shared.concat(['wobble']).concat(Object.keys(MV_MOVE).filter((m) => ['go', 'hit', 'status'].some((k) => (MV_MOVE[m][k] || []).some((s) => s.hum)))));
    let peak = 0, worst = '';
    for (const mid of Object.keys(MV_MOVE)) {
      const users = [[0, 0]].concat(ans.has(mid) ? [[0, 1], [1, 1], [2, 1]] : []);
      for (const [st, hm] of users) {
        const row = mvMoveRow(mid, st, hm);
        for (const [S, T] of C) for (const sup of [false, true]) for (let vv = 0; vv < 3; vv++) {
          mvVarSet(vv);
          for (let a = 0; a < 560; a += 10) {
            const age = a < 120 ? 0 : a - 120; let n = 0; const put = () => { n++; };
            for (const s of row.hit || []) { const k = mvSegK(s, age); if (k >= 0) mvShape(s, k, age, S, T, put); }
            if (sup && age < 200) { const rk = age / 200, rr = 6 + 12 * rk; mvShape({ shape: 'ring', r: [rr, rr], col: 'h', ms: [0, 200], b: 2, n: 8, at: 'target' }, rk, age, S, T, put); }
            if (n > peak) { peak = n; worst = mid + ' st' + st + ' hm' + hm + ' hit'; }
          }
          for (const part of ['go', 'travel', 'status']) for (let a = 0; a <= (part === 'go' ? 1600 : 420); a += 10) {
            let n = 0; const put = () => { n++; };
            if (part === 'go' && row.tier === 1 && a < 120) mvShape({ shape: 'sparkle', col: 'y', at: 'user', ms: [0, 120], b: 2 }, 1, a, S, T, put);
            for (const s of row[part] || []) { const k = mvSegK(s, a); if (k >= 0) mvShape(s, k, a, S, T, put); }
            if (n > peak) { peak = n; worst = mid + ' st' + st + ' hm' + hm + ' ' + part; }
          }
        }
        mvVarSet(0);
      }
    }
    return { peak, worst };
  }, SHARED);
  expect(r.peak, r.worst).toBeLessThanOrEqual(24);
});

test('T6 D937: a bespoke super ring is never white; no bespoke block is white', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  await boot(page, 'gust', 0);
  await open(page, 'gale_slice');
  const r = await page.evaluate(() => new Promise((done) => {
    const B = PixelPets.battle, cols = [];
    // a super-effective GUST bespoke hit drawn by drawBattle itself
    B.fx.push({ who: 'foe', kind: 'mvHit', type: 'GUST', variant: 'super', mid: 'gale_slice', v: 0, st: 0, hm: 0, t0: performance.now(), dur: 420 });
    let frames = 0;
    const tick = () => {
      for (let i = 0; i < mvPoolCount(); i++) { const p = MV_POOL[i]; if (p.on && p.sh) cols.push(p.col); }
      if (++frames < 8) requestAnimationFrame(tick); else done({ cols, plain: mvLightFx('PLAIN'), gust: mvLightFx('GUST'), ember: mvLightFx('EMBER') });
    };
    requestAnimationFrame(tick);
  }));
  expect(r.plain).toBe('h');
  expect(r.gust).toBe('h');
  expect(r.ember).toBe('y');
  expect(r.cols.length).toBeGreaterThan(0);
  expect(r.cols).not.toContain('w');
  const w = await page.evaluate(() => Object.entries(MV_MOVE).filter(([, row]) => ['go', 'travel', 'hit', 'status'].some((k) => (row[k] || []).some((s) => [].concat(s.col).includes('w')))).map(([k]) => k));
  expect(w).toEqual([]);
});

for (const [name, effects, reduce] of [['CALM', 'calm', false], ['reduced motion', 'full', true], ['OFF', 'off', false]]) {
  test.describe(`T7 D828 ${name}`, () => {
    if (reduce) test.use({ reducedMotion: 'reduce' });
    test(`${name}: no bespoke id`, async ({ page }) => {
      test.setTimeout(90000);
      for (const [mid, line, st] of [['kiln_rush', 'ember', 0], ['zap_tap', 'tallybat', 2]]) {
        await boot(page, line, st, effects);
        const log = await turn(page, mid);
        expect(ids(log), mid).toEqual([]);
        expect(log, mid).not.toContain('mvGo');
      }
    });
  });
}

test('T8 all: every row is well formed (tier, a flare first on every hit, travel ending at 140)', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  await boot(page, 'ember', 0);
  const bad = await page.evaluate(() => Object.entries(MV_MOVE).filter(([, r]) => !(r.tier === 1 || r.tier === 2)
    || (r.hit && r.hit[0].shape !== 'flare') || (r.travel && r.travel[r.travel.length - 1].ms[1] !== 140) || (!r.hit && !r.status)).map(([k]) => k));
  expect(bad).toEqual([]);
});
