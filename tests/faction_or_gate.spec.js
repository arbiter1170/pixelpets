/* FACTION_PICK_TIMING v0.2.4 §7 step 1 (design ffada0b): the live-save OR-gate check.
   - T-ORDER: all four readers (cond(), evalCond, the boot validator's condKeyOk, the checkpoints' plainStoryFlag) split
     `|` first, then `&`, then `!`, so `a | b & c` reads as a, or (b and c).
   - The gate matrix: every §7.1 gate on this build, for every save kind in §7.4, reads exactly as it did on origin/main
     8bdb485 (tests/fixtures/or_gate_before.json). Zero diffs.
   - §7.3: on a CLEAN build (no ?debug=1) the save key is byte-identical after load, and after one save it only gains keys
     (plus the time and care-fade fields every save writes); v stays 2.
   Fixtures are flags only (tests/fixtures/or_gate_kinds.js). */
const { test, expect } = require('@playwright/test');
const { starterSave, trackErrors, gotoGame } = require('./helpers');
const K = require('./fixtures/or_gate_kinds');
const BEFORE = require('./fixtures/or_gate_before.json');

trackErrors(test, expect);

const KEY = 'pixelpets.save.v2';
// The flags step 1 reads but nothing sets yet. None may appear in any save.
const NEW_FLAGS = ['story.crates_seen', 'story.pitch_k', 'story.pitch_g', 'story.know_us_cut'];

function kindSave(kind) {
  const fx = K.KINDS[kind], save = starterSave();
  Object.assign(save.flags, fx.flags);
  save.seals = { ...fx.seals };
  return save;
}

// Writes the raw save once per page (a reload keeps what the game wrote), logs every write to the save key with whether
// boot had finished, and snapshots the raw save at the moment boot ends (game.js sets window.PixelPets last in boot()).
async function seedRaw(context, raw) {
  await context.addInitScript((raw) => {
    if (!sessionStorage.getItem('pp_or_seeded')) {
      sessionStorage.setItem('pp_or_seeded', '1');
      localStorage.setItem('pixelpets.save.v2', raw);
      localStorage.setItem('pixelpets.geo', 'deny');
      localStorage.setItem('pixelpets.mute', '1');
    }
    window.ppSaveWrites = [];
    window.ppAtBoot = undefined;
    let api;
    Object.defineProperty(window, 'PixelPets', {
      configurable: true,
      get() { return api; },
      set(v) { if (window.ppAtBoot === undefined) window.ppAtBoot = localStorage.getItem('pixelpets.save.v2'); api = v; },
    });
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (k === 'pixelpets.save.v2') window.ppSaveWrites.push({ booted: window.ppAtBoot !== undefined });
      return set.call(this, k, v);
    };
  }, raw);
}

async function bootKind(page, context, kind, search) {
  const save = kindSave(kind);
  save.last = Date.now();
  const raw = JSON.stringify(save);
  await seedRaw(context, raw);
  await gotoGame(page, search);
  return raw;
}

// ---------- T-ORDER: the four readers agree on the precedence ----------

test('T-ORDER: evalCond splits | first, then &, then ! (a | b & c reads as a, or (b and c))', async ({ page, context }) => {
  await bootKind(page, context, 'n', '?debug=1');
  const got = await page.evaluate(() => {
    const E = (c, flags) => PPQuests.evalCond(c, { flags, seals: {}, pets: 1 });
    const s = 'story.or_a | story.or_b & story.or_c';
    return {
      onlyA: E(s, { 'story.or_a': true }),
      onlyC: E(s, { 'story.or_c': true }),
      onlyB: E(s, { 'story.or_b': true }),
      bAndC: E(s, { 'story.or_b': true, 'story.or_c': true }),
      none: E(s, {}),
      negAlt: E('!story.or_a | story.or_b', { 'story.or_a': true }),
      negAnd: E('!story.or_a & !story.or_b', {}),
      eqAlt: E('story.heights_path=lab | story.or_a', { 'story.heights_path': 'lab' }),
      sealAlt: PPQuests.evalCond('seal:seal_fernbrook | story.or_a', { flags: {}, seals: { seal_fernbrook: true }, pets: 1 }),
      emptyAlt: E('story.or_a | ', {}),
      // The `heights` skipIf: Cobblecrest reached with crates seen still skips. If `&` split first it would read
      // (Cobblecrest or Seal 1) and not crates seen, and this would be false.
      heightsOrder: E('story.reached_cobblecrest | story.seal1 & !story.crates_seen', { 'story.reached_cobblecrest': true, 'story.seal1': true, 'story.crates_seen': true }),
      heightsNew: E('story.reached_cobblecrest | story.seal1 & !story.crates_seen', { 'story.seal1': true, 'story.crates_seen': true }),
      // Old strings with no | or & read exactly as before.
      plain: [E('story.or_a', { 'story.or_a': true }), E('!story.or_a', {}), E('pets>=1', {}), E('else', {})],
    };
  });
  expect(got).toEqual({
    onlyA: true, onlyC: false, onlyB: false, bAndC: true, none: false,
    negAlt: false, negAnd: true, eqAlt: true, sealAlt: true, emptyAlt: false,
    heightsOrder: true, heightsNew: false,
    plain: [true, true, true, true],
  });
});

test('T-ORDER: cond(), condKeyOk and plainStoryFlag read a | b & c the same way', async ({ page, context }) => {
  await bootKind(page, context, 'n', '?debug=1');
  const s = 'story.or_a | story.or_b & story.or_c';
  const read = (flags) => page.evaluate(({ s, flags }) => {
    for (const k of ['story.or_a', 'story.or_b', 'story.or_c', 'story.reached_cobblecrest', 'story.seal1', 'story.crates_seen']) PixelPets.setFlag(k, null);
    for (const k of flags) PixelPets.setFlag(k, true);
    return PixelPets.condRead(s).cond;
  }, { s, flags });
  expect(await read(['story.or_a'])).toBe(true);
  expect(await read(['story.or_c'])).toBe(false);
  expect(await read(['story.or_b'])).toBe(false);
  expect(await read(['story.or_b', 'story.or_c'])).toBe(true);
  expect(await read([])).toBe(false);
  const heights = await page.evaluate(() => {
    PixelPets.setFlag('story.or_a', null); PixelPets.setFlag('story.or_b', null); PixelPets.setFlag('story.or_c', null);
    PixelPets.setFlag('story.reached_cobblecrest', true); PixelPets.setFlag('story.seal1', true); PixelPets.setFlag('story.crates_seen', true);
    const r = PixelPets.condRead('story.reached_cobblecrest | story.seal1 & !story.crates_seen').cond;
    for (const k of ['story.reached_cobblecrest', 'story.seal1', 'story.crates_seen']) PixelPets.setFlag(k, null);
    return r;
  });
  expect(heights).toBe(true);
  const keys = await page.evaluate(() => {
    const R = c => PixelPets.condRead(c);
    return {
      // The boot validator accepts the OR forms (and spaces round | and &, which cond() trims).
      or: R('story.or_a | story.or_b & story.or_c').key,
      orNeg: R('!story.seal1 | !story.side_pick_done & !story.orchard_cleared').key,
      orEq: R('story.heights_path=tunnels & story.know_us_cut | story.heights_path=tunnels & story.know_us').key,
      orSeal: R('seal:seal_fernbrook | standing.keepers>=2').key,
      // ...and still rejects a broken part on either side of a |.
      badAlt: R('story.or_a | story bad').key,
      emptyAlt: R('story.or_a |').key,
      // plainStoryFlag never hands the checkpoints a literal "a|b" (or "a&b") key.
      plainOr: R('story.or_a | story.or_b').plain,
      plainAnd: R('story.or_a & story.or_b').plain,
      plainOne: R('story.or_a').plain,
      plainNeg: R('!story.or_a').plain,
    };
  });
  expect(keys).toEqual({
    or: true, orNeg: true, orEq: true, orSeal: true, badAlt: false, emptyAlt: false,
    plainOr: null, plainAnd: null, plainOne: 'story.or_a', plainNeg: null,
  });
  // The boot validator itself is clean on this build (no console error from it; trackErrors also checks).
  expect(await page.evaluate(() => PixelPets.glimmerCheck)).toEqual([]);
});

test('T-ORDER: cond() and evalCond agree on every §7.1 gate string, for every save kind', async ({ page, context }) => {
  await bootKind(page, context, 'n', '?debug=1');
  const strings = await page.evaluate(({ objs }) => {
    const out = new Set();
    for (const [map, id] of objs) { const g = PixelPets.gateRead(map, id); if (!g) continue; (g.when || []).forEach(c => out.add(c)); if (g.need) out.add(g.need); }
    for (const r of MAPDATA.town_board.towns.fernbrook.reports) if (/^fb_hall_/.test(r.id)) (r.when || []).forEach(c => out.add(c));
    (PPQuests.CHAIN.find(e => e.id === 'heights').skipIf || []).forEach(c => out.add(c));
    out.add(PixelPets.standingTab.when);
    return [...out];
  }, { objs: K.OBJ_GATES });
  // The OR forms are really there (one entry each, never glued to an AND in one string except where | splits first).
  expect(strings).toEqual(expect.arrayContaining([
    'story.side_pick_done | story.orchard_cleared',
    '!story.seal1 | !story.side_pick_done & !story.orchard_cleared',
    // DAY1_TRIAL1_FLOW D1169 (was story.crates_seen | story.orchard_cleared), and D1432: shut once Seal 1 and the pick are in.
    'story.lizzy_class & !story.seal1 | story.orchard_cleared & !story.seal1 | story.seal1 & !story.side_pick_done',
    'story.reached_cobblecrest | story.seal1 & !story.crates_seen',
    'story.side_pick_done | story.pitch_k & story.pitch_g',
  ]));
  // evalCond knows no seal:/standing terms beyond seal:, so compare on the flag and seal strings both readers take.
  const shared = strings.filter(c => !/standing\.|away:|win:|time:|day:|phase:|has:|chip:|talked|rep/.test(c));
  // SEALS_BOTH_PATHS §4.3: both readers share hasSeal/sealsHeld, so the held-Seal terms and the old-save alias agree too.
  shared.push('seals>=1', 'seals>=3', 'seal:seal_cobblecrest', '!seal:seal_cobblecrest', 'seal:seal_fernbrook');
  const kinds = Object.assign({}, K.KINDS, {
    alias_hale: { flags: { 'story.side': 'glimmer', 'story.seal2': true, 'trainer.hall2_hale': true }, seals: { seal_fernbrook: true, seal_glim_1: true, seal_glim_2: true } },
    alias_tag_only: { flags: { 'story.side': 'glimmer', 'story.seal2': true }, seals: { seal_glim_1: true, seal_glim_2: true } },
  });
  for (const kind of Object.keys(kinds)) {
    const fx = kinds[kind];
    const diff = await page.evaluate(({ shared, fx }) => {
      const S = PixelPets.state, keep = { flags: S.flags, seals: S.seals };
      S.flags = Object.assign({}, fx.flags); S.seals = Object.assign({}, fx.seals);
      const bad = [];
      try {
        for (const c of shared) {
          const a = PixelPets.condRead(c).cond, b = PPQuests.evalCond(c, { flags: S.flags, seals: S.seals, pets: 1 });
          if (a !== b) bad.push(c + ' cond=' + a + ' evalCond=' + b);
          if (!PixelPets.condRead(c).key) bad.push(c + ' rejected by the boot validator');
        }
      } finally { S.flags = keep.flags; S.seals = keep.seals; }
      return bad;
    }, { shared, fx });
    expect(diff, 'kind ' + kind).toEqual([]);
  }
});

// ---------- The gate matrix: zero diffs against origin/main, except the cells DAY1_TRIAL1_FLOW moves on purpose ----------

// DAY1_TRIAL1_FLOW v0.4 (Vincent, Nov 2, 2026): a save that never picked and never cleared the orchard (p, n) now gets the
// new flow. The old pick trigger waits for Seal 1, the class and the post-Trial slot (D1172 no, D1175), Tobin is the tally
// until the pick (his battle waits for it), and the chain resumes at the crates; b' meets the three Hall holders (D1170).
// Every other cell of every kind still reads exactly as recorded.
const NEW_FLOW = { 'fernbrook:fb_side_pick': false, 'fernbrook:fern_associate': false };
const DAY1_DELTA = {
  p: Object.assign({ 'quest:current': 'crates' }, NEW_FLOW), n: NEW_FLOW, p_fen_only: Object.assign({ 'quest:current': 'crates' }, NEW_FLOW),
  p_glimmer_only: NEW_FLOW, p_fernbrook_only: NEW_FLOW, "b'": { 'quest:current': 'hall1_holders' },
};
// D1432 (Vincent, Nov 3, 2026): a save with Seal 1 and the pick finds the Hall shut on both paths until Fen's Act 2 turn.
for (const k of ['c', 'c_glimmer', 'c_cobble', 'c_escort']) DAY1_DELTA[k] = Object.assign({}, DAY1_DELTA[k], { 'fernbrook:fb_hall': false });
for (const kind of Object.keys(K.KINDS)) {
  test(`gate matrix: kind ${kind} reads every §7.1 gate as before the OR change`, async ({ page, context }) => {
    await bootKind(page, context, kind, '?debug=1');
    const now = await page.evaluate(K.readGates, { objs: K.OBJ_GATES, slips: K.BOARD_SLIPS, tells: K.TELLS });
    expect(BEFORE.kinds[kind], 'recorded before-matrix for ' + kind).toBeTruthy();
    expect(now).toEqual(Object.assign({}, BEFORE.kinds[kind], DAY1_DELTA[kind] || {}));
  });
}

test('gate matrix: the §7.4 asserts hold on the seven kinds', () => {
  const B = BEFORE.kinds;
  for (const k of K.SEVEN) expect(B[k], k).toBeTruthy();
  // a2 keeps Route 2 shut until Seal 1, and the rubble stays up; b is open (no softlock).
  expect([B.a2['fernbrook:fb_east'], B.a2['fernbrook:fb_rubble']]).toEqual([false, true]);
  expect([B.b['fernbrook:fb_east'], B.b['fernbrook:fb_rubble']]).toEqual([true, false]);
  // The warp and the rubble (and the two signs) are exact opposites on every kind.
  for (const k of Object.keys(B)) {
    expect(B[k]['fernbrook:fb_rubble'], k).toBe(!B[k]['fernbrook:fb_east']);
    expect(B[k]['fernbrook:fb_sign_route2'], k).toBe(!B[k]['fernbrook:fb_sign_route2_open']);
  }
  // Hall door: shut for a1, p, n; open for a2, b, b', c (the recorded before-matrix; D1432 then shuts it for c, DAY1_DELTA).
  expect(K.SEVEN.map(k => B[k]['fernbrook:fb_hall'])).toEqual([false, true, true, true, true, false, false]);
  // The heights skipIf: skipped once Seal 1 is in (b, c), live for a1, a2, b', p, n.
  expect(K.SEVEN.map(k => B[k]['quest:heights.skipIf'])).toEqual([false, false, true, false, true, false, false]);
});

// ---------- §7.3: no save change (CLEAN build, no debug) ----------

for (const kind of K.SEVEN) {
  test(`§7.3 save proof: kind ${kind} loads byte-identical, then one save only adds keys; v stays 2`, async ({ page, context }) => {
    const raw = await bootKind(page, context, kind, '');
    expect(await page.evaluate(() => window.PixelPets.debug)).toBe(false);
    // After load: the raw save at the end of boot, before any save the game makes once it runs.
    const afterLoad = await page.evaluate(() => window.ppAtBoot);
    const writes = await page.evaluate(() => window.ppSaveWrites.slice());
    expect(writes.filter(w => !w.booted), 'no save write during load').toEqual([]);
    expect(afterLoad).toBe(raw);
    // One save through a real save path (the pagehide handler); the game may already have saved once after boot.
    await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    await page.waitForFunction(() => window.ppSaveWrites.length > 0);
    const after = JSON.parse(await page.evaluate((k) => localStorage.getItem(k), KEY));
    const before = JSON.parse(raw);
    expect(after.v).toBe(2);
    // Every field the save had keeps its value, except the stamp and the care stats that fade with time.
    const FADE = /^\.last$|^\.party\.\d+\.(hunger|happy|energy)$/;
    const changed = [];
    const walk = (a, b, p) => {
      if (a && typeof a === 'object') {
        if (!b || typeof b !== 'object') { changed.push(p + ' (removed or retyped)'); return; }
        for (const k of Object.keys(a)) walk(a[k], b[k], p + '.' + k);
      } else if (JSON.stringify(a) !== JSON.stringify(b) && !FADE.test(p)) changed.push(p);
    };
    walk(before, after, '');
    expect(changed).toEqual([]);
    const flagKeys = Object.keys(after.flags);
    expect(flagKeys.filter(f => /[|&]/.test(f)), 'no literal a|b flag').toEqual([]);
    expect(flagKeys.filter(f => NEW_FLAGS.includes(f)), 'nothing sets the new flags yet').toEqual([]);
  });
}

// ---------- No visible change, and the overlay restates verbatim objects with only `when` changed ----------

test('overlay: restated maps_slice and act1_route2 objects differ only in when; the Hall door only in need', async ({ page, context }) => {
  await bootKind(page, context, 'n', '?debug=1');
  const diffs = await page.evaluate(() => {
    const live = id => WORLD.fernbrook.objs.find(o => o.id === id);
    const slice = id => MAPDATA.maps_slice.maps.fernbrook.objs.find(o => o.id === id);
    const r2 = MAPDATA.act1_route2.slicePatch.maps.fernbrook, route2 = id => [].concat(r2.replaceObjs || [], r2.addObjs || []).find(o => o.id === id);
    const overlay = id => MAPDATA.fernbrook_rooms.slicePatch.maps.fernbrook.replaceObjs.find(o => o.id === id);
    const out = {};
    // The overlay entry equals its verbatim source except `when`, and the live object carries the overlay's `when`
    // (the engine adds other fields at boot, such as Rook's lines, the same before and after).
    const cmp = (id, src, skip) => {
      const a = Object.assign({}, overlay(id)), b = Object.assign({}, src);
      for (const k of skip) { delete a[k]; delete b[k]; }
      out[id] = JSON.stringify(a) === JSON.stringify(b) && JSON.stringify(live(id).when) === JSON.stringify(overlay(id).when);
    };
    for (const id of ['fb_east', 'fb_sign_route2_open', 'fb_rubble', 'fb_sign_route2']) cmp(id, route2(id), ['when']);
    for (const id of ['rook_fb', 'fb_teaser']) cmp(id, slice(id), ['when']);
    cmp('fb_hall', live('fb_hall'), ['shutWhen', 'deny']);   // POST_TRIAL_CRACKDOWN (D1224): objPatch adds the shut read and its deny line first
    // DAY1_TRIAL1_FLOW: Fen's orchard body and the two crates also take Part A's line keys; the Hall sign its new text.
    const sliceSkip = (id, skip) => cmp(id, slice(id), skip);
    sliceSkip('fen_orchard', ['when', 'lines']); sliceSkip('fern_associate', ['when']);
    sliceSkip('fb_crate_a', ['lines']); sliceSkip('fb_crate_b', ['lines']); sliceSkip('fb_sign_hall', ['text']);
    out.hallNeed = live('fb_hall').need;
    out.hallShut = live('fb_hall').shutWhen;
    out.hallDeny = live('fb_hall').deny;
    out.count = WORLD.fernbrook.objs.filter(o => ['fb_east', 'fb_sign_route2_open', 'fb_rubble', 'fb_sign_route2', 'rook_fb', 'fb_teaser', 'fb_hall'].includes(o.id)).length;
    out.slips = MAPDATA.town_board.towns.fernbrook.reports.filter(r => /^fb_hall_/.test(r.id)).map(r => r.text);
    return out;
  });
  expect(diffs).toEqual({
    fb_east: true, fb_sign_route2_open: true, fb_rubble: true, fb_sign_route2: true, rook_fb: true, fb_teaser: true, fb_hall: true,
    fen_orchard: true, fern_associate: true, fb_crate_a: true, fb_crate_b: true, fb_sign_hall: true,
    // D1169, and D1432: shut once Seal 1 and the pick are both in.
    hallNeed: 'story.lizzy_class & !story.seal1 | story.orchard_cleared & !story.seal1 | story.seal1 & !story.side_pick_done',
    hallShut: 'story.hall1_shut',
    // June's line while Day 1 is not done (FPT §2.1); Fen's note while she is away (DAY1_TRIAL1_FLOW §7, PLACEHOLDER).
    hallDeny: { 'story.hall1_shut': 'Shut by order of High Charity. A Keeper cordon blocks the door.', 'story.seal1 & story.side_pick_done': "Shut by Keeper order. Master Fen's Hall stays closed for now.", '!story.crates_seen': 'The Hall is shut for now. Tobin could use a hand with his crates first.', else: "The Hall is shut. A note on the door: 'Away on Keeper business. Back soon. — Fen'" },
    count: 7,
    slips: ['The Trial Hall is latched. Tobin is by the orchard gate, counting crates.', 'The Trial Hall is shut. Master Fen is away on Keeper business.', 'The Trial Hall is open. The steps were swept this morning.'],
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('kind a2 reads the same gates with reduced motion, with no console errors', async ({ page, context }) => {
    await bootKind(page, context, 'a2', '?debug=1');
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
    const now = await page.evaluate(K.readGates, { objs: K.OBJ_GATES, slips: K.BOARD_SLIPS, tells: K.TELLS });
    expect(now).toEqual(BEFORE.kinds.a2);
  });
});
