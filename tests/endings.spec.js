/* REPORTS_AND_ENDINGS v0.1.1 core (design repo, private; D1620-D1629) with REPORT_FLAGS v0.1 (D1720-D1729): the pure readers in
   standing.js (pathOf, trustOf, presOptions, ilseCanTurn, endingOf), the story.rpt_1-_6 shape, reportsOpen on
   story.switched_a3 / story.warden_cut (D1725), story.switched_a3 written by an Act 3 switch, and the switch window closing at
   the Spire (D1625). No ending scenes yet (E3-E5 are later packets'). §11 T1, T2, T3 (the readers), T12, T13. Save stays v 2. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

async function boot(page, save, opts = {}) {
  save = save || starterSave();
  save.settings.controls = 'modern';   // Modern by default (Vincent, Nov 4)
  if (opts.reduce) await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), save, { quietDay: true, oldSave: !!opts.oldSave });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && PixelPets.state && window.PPStanding);
}
const ENDS = ['k_restored', 'k_court', 'k_desk', 'l_hand', 'l_witness', 'g_turned', 'g_order', 'g_road'];

test('T1: every combination of the deciding flags and the six report values gives one of the eight endings and 2+ office options @w1', async ({ page }) => {
  test.setTimeout(120000);
  await boot(page, null, { reduce: true });
  const r = await page.evaluate(() => {
    const P = window.PPStanding, RV = [undefined, 'told', 'kept'];
    const sides = [undefined, 'keepers', 'glimmer'], bool = [false, true];
    const choices = [undefined, 'cleanup', 'expose', 'convert', 'stand'], yn = [undefined, 'yes', 'no'];
    let n = 0, bad = 0, minOpts = 9, seen = new Set(), tiers = new Set(), convertNotTrusted = 0;
    for (const side of sides) for (const sw of bool) for (const cut of bool) for (const pc of choices) for (const ally of yn)
      for (const turned of yn) for (const decided of bool) for (let r = 0; r < 729; r++) {
        const F = { 'story.side': side, 'story.switched_a3': sw, 'story.warden_cut': cut, 'story.pres_choice': pc,
          'story.pres_ally': ally, 'story.ilse_turned': turned, 'story.keepers_decided': decided };
        let x = r; for (let i = 1; i <= 6; i++) { F['story.rpt_' + i] = RV[x % 3]; x = Math.floor(x / 3); }
        const e = P.endingOf(F), o = P.presOptions(F), t = P.trustOf(F);
        n++; seen.add(e); tiers.add(t.tier);
        if (!['k_restored', 'k_court', 'k_desk', 'l_hand', 'l_witness', 'g_turned', 'g_order', 'g_road'].includes(e)) bad++;
        if (o.length < 2) bad++;
        if (o.includes('convert') && t.tier !== 'trusted') convertNotTrusted++;
        minOpts = Math.min(minOpts, o.length);
      }
    return { n, bad, minOpts, seen: [...seen].sort(), tiers: [...tiers].sort(), convertNotTrusted, rpt: P.RPT.slice(), ends: P.ENDINGS.slice() };
  });
  expect(r.n).toBe(787320);
  expect(r.bad).toBe(0);
  expect(r.minOpts).toBeGreaterThanOrEqual(2);
  expect(r.seen).toEqual(ENDS.slice().sort());   // every ending is reachable
  expect(r.tiers).toEqual(['distant', 'guarded', 'trusted']);
  expect(r.convertNotTrusted).toBe(0);
  expect(r.rpt).toEqual(['story.rpt_1', 'story.rpt_2', 'story.rpt_3', 'story.rpt_4', 'story.rpt_5', 'story.rpt_6']);
  expect(r.ends).toEqual(ENDS);
});

test('T2, T3: tier thresholds; a missing letter counts as kept only with the Warden; guards never count; the office by path @w1', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    const P = window.PPStanding;
    const reps = (told, kept) => { const F = {}; let i = 1; for (; i <= told; i++) F['story.rpt_' + i] = 'told'; for (let j = 0; j < kept; j++, i++) F['story.rpt_' + i] = 'kept'; return F; };
    const tier = F => P.trustOf(F).tier;
    const G = { 'story.side': 'glimmer', 'story.switched_a3': true }, L = { 'story.warden_cut': true };
    return {
      w: [0, 1, 2, 3, 4, 5, 6].map(n => tier(reps(n, 0))),
      wMissing: P.trustOf(reps(2, 0)),                      // four letters never written: kept, with the Warden
      gMissing: P.trustOf(Object.assign(reps(2, 0), G)),    // a switcher counts only written answers
      guards: P.trustOf(Object.assign(reps(1, 0), { 'story.rpt_gov': true, 'story.rpt_old_seen': true, 'story.gov_told': 'told', 'story.cv_mom': 'told' })),
      lanyard: P.pathOf({ 'story.side': 'glimmer', 'story.cover': 'glimmer' }),   // the Act 1 lanyard is not the switch
      oldSwitch: P.pathOf({ 'story.switches': 1 }),
      wOpts: P.presOptions(reps(4, 0)), wTrusted: P.presOptions(Object.assign(reps(4, 0), { 'story.keepers_decided': true })),
      wGuarded: P.presOptions(Object.assign(reps(3, 0), { 'story.keepers_decided': true })),
      lOpts: P.presOptions(Object.assign(reps(6, 0), L, { 'story.keepers_decided': true })),
      ends: [P.endingOf({ 'story.pres_choice': 'convert' }), P.endingOf({ 'story.pres_choice': 'expose' }), P.endingOf({}),
        P.endingOf(Object.assign({ 'story.pres_choice': 'stand' }, L)), P.endingOf(Object.assign({ 'story.pres_choice': 'expose' }, L)),
        P.endingOf(Object.assign({ 'story.pres_ally': 'yes', 'story.ilse_turned': 'yes' }, G)), P.endingOf(Object.assign({ 'story.pres_ally': 'yes' }, G)),
        P.endingOf(Object.assign({ 'story.pres_ally': 'no', 'story.ilse_turned': 'yes' }, G)), P.endingOf(Object.assign({ 'story.pres_choice': 'expose' }, G, L))],
      turn: [P.ilseCanTurn(Object.assign(reps(1, 1), G)), P.ilseCanTurn(Object.assign(reps(1, 2), G)), P.ilseCanTurn(Object.assign(reps(0, 0), G)),
        P.ilseCanTurn(Object.assign(reps(3, 0), G, L)), P.ilseCanTurn(reps(6, 0))],
    };
  });
  expect(r.w).toEqual(['distant', 'distant', 'guarded', 'guarded', 'trusted', 'trusted', 'trusted']);
  expect(r.wMissing).toEqual({ path: 'w', told: 2, kept: 4, tier: 'guarded' });
  expect(r.gMissing).toEqual({ path: 'g', told: 2, kept: 0, tier: 'guarded' });
  expect(r.guards).toMatchObject({ told: 1, tier: 'distant' });
  expect([r.lanyard, r.oldSwitch]).toEqual(['w', 'w']);
  expect(r.wOpts).toEqual(['cleanup', 'expose']);
  expect(r.wTrusted).toEqual(['cleanup', 'expose', 'convert']);
  expect(r.wGuarded).toEqual(['cleanup', 'expose']);
  expect(r.lOpts).toEqual(['stand', 'expose']);
  expect(r.ends).toEqual(['k_restored', 'k_court', 'k_desk', 'l_hand', 'l_witness', 'g_turned', 'g_order', 'g_road', 'g_order']);
  expect(r.turn).toEqual([true, false, false, false, false]);
});

test('T12 (D1725): a pre-#221 save with story.switches 1, moved to the Keepers, keeps its reports and reads the Warden\'s path', async ({ page }) => {
  const s = starterSave();
  Object.assign(s.flags, { 'story.side': 'glimmer', 'story.side_pick_done': true, 'story.switches': 1, 'story.switch_via': 'rook',
    'story.reached_fernbrook': true, 'story.seal1': true, 'story.seal2': true });
  s.seals = { seal_fernbrook: 1700000000000, seal_cobblecrest: 1700000000000 };
  await boot(page, s, { oldSave: true });
  const r = await page.evaluate(() => ({ f: Object.assign({}, PixelPets.state.flags), reports: PixelPets.reportsOpen, path: PPStanding.pathOf(PixelPets.state.flags),
    end: PPStanding.endingOf(PixelPets.state.flags) }));
  expect(r.f['story.keeper_cadet']).toBe(true);
  expect(r.f['story.switches']).toBe(1);
  expect(r.f['story.switched_a3']).toBeUndefined();
  expect(r.reports).toBe(true);   // was false while reportsOpen read story.switches
  expect(r.path).toBe('w');
  expect(ENDS.slice(0, 3)).toContain(r.end);
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  expect(st.v).toBe(2);
  for (const k of Object.keys(s.flags)) expect(st.flags, k).toHaveProperty([k]);
});

test('T13 (D1625) and D1629: an Act 3 switch writes story.switched_a3 and stops the reports; the window shuts at the Spire', async ({ page }) => {
  const s = starterSave();
  Object.assign(s.flags, { 'story.side': 'keepers', 'story.side_pick_done': true, 'story.keeper_cadet': true, 'story.ilse_call_old': true,
    'story.cover_done': true, 'story.rc_climax': true, 'story.ep1_end': true, 'story.seal5': true, 'story.rpt_1': 'told' });
  s.standing = { keepers: 40, glimmer: 6 };
  await boot(page, s);
  expect(await page.evaluate(() => PixelPets.act)).toBe(3);
  const closed = await page.evaluate(() => PPStanding.canSwitch(Object.assign({}, PixelPets.state.flags, { 'story.solvane_met': true }), PixelPets.state.standing, 'keepers', 'glimmer', 5));
  expect(closed).toEqual({ ok: false, why: 'closed' });
  expect(await page.evaluate(() => PPStanding.canSwitch(PixelPets.state.flags, PixelPets.state.standing, 'keepers', 'glimmer', 3))).toEqual({ ok: true, why: null });
  expect(await page.evaluate(() => PixelPets.reportsOpen)).toBe(true);
  expect(await page.evaluate(() => PixelPets.switchSide('glimmer'))).toBeTruthy();
  const f = await page.evaluate(() => Object.assign({}, PixelPets.state.flags));
  expect([f['story.side'], f['story.switched_a3'], f['story.switches']]).toEqual(['glimmer', true, 1]);
  expect(await page.evaluate(() => PixelPets.reportsOpen)).toBe(false);
  expect(await page.evaluate(() => PPStanding.pathOf(PixelPets.state.flags))).toBe('g');
  expect((await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')))).v).toBe(2);
});

test('an Act 2 debug switch is not the Act 3 switch: no story.switched_a3 @w1', async ({ page }) => {
  const s = starterSave();
  Object.assign(s.flags, { 'story.side': 'keepers', 'story.side_pick_done': true, 'story.keeper_cadet': true, 'story.ilse_call_old': true,
    'story.cover_done': true, 'story.ep1_end': true });
  await boot(page, s);
  expect(await page.evaluate(() => PixelPets.act)).toBe(2);
  await page.evaluate(() => PixelPets.switchSide('glimmer'));
  const f = await page.evaluate(() => Object.assign({}, PixelPets.state.flags));
  expect(f['story.side']).toBe('glimmer');
  expect(f['story.switched_a3']).toBeUndefined();
  expect(await page.evaluate(() => PixelPets.reportsOpen)).toBe(true);   // D1725: only an Act 3 switch stops them
});

test('ACT2_COVER_STORY T10 (D1693): trustOf and endingOf never read a reveal flag (every combination of the six story.cv_* values) @w1', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    const P = window.PPStanding, V = [undefined, 'told', 'cover', 'quiet'], K = ['cv_mom', 'cv_lizzy', 'cv_rook', 'cv_lumen', 'cv_fen', 'cv_juniper'];
    const bases = [{}, { 'story.rpt_1': 'told', 'story.rpt_2': 'told', 'story.rpt_3': 'told', 'story.rpt_4': 'told', 'story.pres_choice': 'convert', 'story.keepers_decided': true },
      { 'story.side': 'glimmer', 'story.switched_a3': true, 'story.rpt_1': 'told', 'story.pres_ally': 'yes' }, { 'story.warden_cut': true, 'story.pres_choice': 'expose' }];
    let diff = 0, n = 0;
    for (const B of bases) {
      const t0 = JSON.stringify(P.trustOf(B)), e0 = P.endingOf(B), o0 = JSON.stringify(P.presOptions(B));
      for (let i = 0; i < 4096; i++) {
        const F = Object.assign({}, B, { 'story.lizzy_records': 'took', 'story.lizzy_copy': 'sent', 'story.gov_told': 'told', 'story.rpt_gov': true });
        let x = i; for (const k of K) { F['story.' + k] = V[x % 4]; x = Math.floor(x / 4); }
        n++;
        if (JSON.stringify(P.trustOf(F)) !== t0 || P.endingOf(F) !== e0 || JSON.stringify(P.presOptions(F)) !== o0) diff++;
      }
    }
    return { n, diff };
  });
  expect(r).toEqual({ n: 16384, diff: 0 });
});
