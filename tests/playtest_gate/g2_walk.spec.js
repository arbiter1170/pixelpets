/* PLAYTEST_GATE v0.1 §5 (tests/playtest_gate/PACKET.md): per-kind reads at load and the four walk steps, under ?debug=1.
   W1 the Act 1 Keeper join (the old-save move; SF-JOIN), W2 one town changing hands (SF-E6), W3 the Kilnmouth arrival on a
   frozen clock (SF-KM), W4 the Cabinet stair in the live city (SF-CAB; HC_CITY_V2 on since Fri Nov 6, 2026). PG-9 to PG-13 and PG-18. 320 and 390, reduced
   motion; 375 skipped. Save stays pixelpets.save.v2, v 2; zero console and page errors. */
const { test, expect } = require('@playwright/test');
const path = require('path');
const { execFileSync } = require('child_process');
const F = require('./gate_fixtures');
const L = require('./gate_lib');

test.beforeEach(async ({}, testInfo) => {
  test.skip(testInfo.project.name === '375', 'PLAYTEST_GATE runs at 320 and 390 only');
});
L.gateGuard(test, expect);
test.use({ reducedMotion: 'reduce' });

const DEBUG_URL = './?debug=1';
const CITY_URL = './?debug=1';   // the city is live: no ?hccity
const flags = page => page.evaluate(() => Object.assign({}, PixelPets.state.flags));
const quest = page => page.evaluate(() => { const q = PixelPets.quest; return q && { id: q.id, target: q.target || null }; });
const sceneId = page => page.evaluate(() => PixelPets.scene && PixelPets.scene.id);
const world = page => page.evaluate(() => { const w = PixelPets.state.world; return { map: w.map, x: w.x, y: w.y }; });
const storedNow = page => page.evaluate(k => { window.dispatchEvent(new Event('pagehide')); return JSON.parse(localStorage.getItem(k)); }, L.SAVE_KEY);
async function goto(page, map, x, y, facing) {
  await page.evaluate(([m, x, y, f]) => PixelPets.goto(m, x, y, f), [map, x, y, facing || 'down']);
  await page.waitForFunction(m => PixelPets.mapInfo.id === m && !PixelPets.fading, map);
}
// Seeds per §3.1 (never installSave), boots under ?debug=1 and checks reduced motion once.
async function bootDebug(page, save, url = DEBUG_URL) {
  const raw = L.seedRaw(save);
  await L.seed(page.context(), raw);
  await L.boot(page, url);
  expect(await L.reducedMotion(page)).toBe(true);
  return raw;
}
const said = lines => lines.filter(l => l[0] !== '>').map(l => l[1]);

test.describe('PLAYTEST_GATE g2: per-kind reads at load and the walk checks each kind can reach (§5)', () => {
  for (const kind of F.SEVEN) {
    test(`kind ${kind}: §5.0 reads; W1 ${F.PICKED.includes(kind) ? 'the move once' : 'skip'}; W3 and W4 negative checks`, async ({ page }) => {
      test.setTimeout(60000);
      const r = F.READS[kind], pk = F.PICKED.includes(kind);
      await bootDebug(page, F.kindSave(kind));
      await page.evaluate(() => PixelPets.showTab('walk'));
      if (r.toast) await page.waitForFunction(t => (PixelPets.toasts || []).includes(t), F.OLD_MOVE_TOAST, { timeout: 6000 });
      else await page.waitForTimeout(4000);
      // §5.0
      const got = await page.evaluate(() => {
        const P = PixelPets;
        return {
          quest: P.quest && P.quest.id, hold: P.mapHold('fernbrook'), line: P.holdLine('fernbrook'), sway: P.sway('fernbrook'),
          seal: P.hasSeal('seal_fernbrook'), held: P.sealsHeld(), toasts: P.toasts, act: P.act, scene: P.scene, map: P.mapInfo.id,
          questCheck: P.questCheck, glimmerCheck: P.glimmerCheck,
          tf: [P.townFaction('fernbrook'), P.townFaction('cobblecrest'), P.townFaction('kilnmouth')],
          km: [P.mapHold('kilnmouth'), P.holdLine('kilnmouth'), P.sway('kilnmouth')],
        };
      });
      expect(got.quest).toBe(r.quest);
      expect(got.hold).toBe(r.hold);
      expect(got.line).toBe(F.FB_LINE[r.hold]);
      expect(got.sway).toBe(r.sway);
      expect(got.seal).toBe(r.seal);
      expect(got.held).toBe(r.held);
      expect(got.toasts.includes(F.OLD_MOVE_TOAST), 'old-save toast').toBe(r.toast);
      expect(got.toasts.filter(t => t === F.OLD_MOVE_TOAST).length).toBe(r.toast ? 1 : 0);
      expect(got.act).toBe(1);
      expect(got.scene).toBeNull();
      expect(got.map).toBe('hearthmoor');
      expect(got.questCheck).toEqual([]);
      expect(got.glimmerCheck).toEqual([]);
      expect(got.tf).toEqual(['keepers', 'keepers', null]);
      expect(got.km).toEqual([F.KM_ACT1.hold, F.KM_ACT1.line, F.KM_ACT1.sway]);
      // W1 (§5.1): a picked save joined at load, with the six move flags; no scene.
      const f = await flags(page);
      if (pk) for (const [k, v] of Object.entries(F.MOVE_KEEPERS)) expect(f[k], k).toEqual(v);
      else expect(f['story.keeper_cadet']).toBeUndefined();
      // W4 (§5.4): the city is live, so the Governor's House exists on a plain boot (it was false while the city was a preview);
      // the Cabinet stair's own gate (story flags) is what W4's steps below check.
      expect(await page.evaluate(() => PixelPets.goto('hc_gov_1', 2, 2, 'left'))).toMatchObject({ map: 'hc_gov_1', x: 2, y: 2 });
      // W3 (§5.3): after the settle, no Kilnmouth key in the stored save.
      const stored = JSON.parse(await L.settle(page, pk ? 2 : 1));
      expect(stored.v).toBe(2);
      expect(Object.keys(stored.flags).filter(k => k.startsWith('story.km_'))).toEqual([]);
      expect(stored.flags).not.toHaveProperty(['story.reached_kilnmouth']);
      expect(stored.mapSeen).not.toHaveProperty('kilnmouth');
      expect(stored.mapSeen).not.toHaveProperty('km_road');
      if (!pk) return;
      // W1: a reload in the same tab does not move the save again or show the toast.
      const seven = Object.keys(L.storedFlags(kind));
      for (const k of seven) expect(stored.flags, k).toHaveProperty([k]);
      await L.reloadBoot(page, DEBUG_URL);
      await page.evaluate(() => PixelPets.showTab('walk'));
      await page.waitForTimeout(4000);
      const again = await page.evaluate(() => ({ toasts: PixelPets.toasts, scene: PixelPets.scene, flags: Object.assign({}, PixelPets.state.flags) }));
      expect(again.toasts).not.toContain(F.OLD_MOVE_TOAST);
      expect(again.scene).toBeNull();
      for (const k of seven) expect(again.flags[k], k).toEqual(stored.flags[k]);
      expect((await L.gateState(page)).writes.filter(w => !w.booted)).toEqual([]);
    });
  }
});

test.describe('PLAYTEST_GATE g2: the walk steps on stage fixtures (§5.1-§5.4)', () => {
  test('W1 SF-JOIN: ilse_call and warden_meet play to chi_meet; fb_east opens; the save stays additive (PG-10)', async ({ page }) => {
    test.setTimeout(120000);
    const raw = await bootDebug(page, F.STAGE.sf_join());
    const before = JSON.parse(raw);
    await page.evaluate(() => PixelPets.showTab('walk'));
    expect((await quest(page)).id).toBe('ilse_call');
    expect((await page.evaluate(() => PixelPets.gateRead('fernbrook', 'fb_east'))).whenOk).toBe(false);
    await goto(page, 'fernbrook', 5, 6, 'down');
    await page.evaluate(() => PixelPets.walkStep('down'));
    await page.waitForTimeout(380);
    expect(await sceneId(page)).toBe('ilse_call');
    await L.drive(page, ['Answer']);
    expect((await flags(page))['story.warden_called']).toBe(true);
    expect((await quest(page)).id).toBe('warden_summons');
    await goto(page, 'hm_lodge_in', 5, 5, 'down');
    expect(await page.evaluate(() => PixelPets.talkTo('ilse_lodge_after'))).toBe(true);
    expect(await sceneId(page)).toBe('warden_meet');
    await L.drive(page);
    const f = await flags(page);
    expect(f['story.warden_met']).toBe(true);
    expect(f['story.side_pick_done']).toBeUndefined();
    const q = await quest(page);
    expect(q.id).toBe('chi_meet');
    expect(q.target).toEqual({ map: 'route2_glen', x: 22, y: 4 });
    expect((await page.evaluate(() => PixelPets.gateRead('fernbrook', 'fb_east'))).open).toBe(true);
    const stored = await storedNow(page);
    expect(stored.v).toBe(2);
    for (const k of Object.keys(before.flags)) expect(stored.flags, k).toHaveProperty([k]);
    expect(stored.flags['story.warden_called']).toBe(true);
    expect(stored.flags['story.warden_met']).toBe(true);
  });

  test('W2 SF-E6(absent, 2): the switch turns Kilnmouth from keepers to split; stored sway 0 (PG-11)', async ({ page }) => {
    await bootDebug(page, F.sfE6(null, 2));
    const read = () => page.evaluate(() => ({ hold: PixelPets.mapHold('kilnmouth'), tf: PixelPets.townFaction('kilnmouth'), line: PixelPets.holdLine('kilnmouth'), sway: PixelPets.sway('kilnmouth') }));
    expect(await read()).toMatchObject({ hold: 'keepers', tf: 'keepers', line: F.HOLD_KM.keepers });
    expect(await page.evaluate(() => PixelPets.switchSide('glimmer', true))).toBe(true);
    expect(await read()).toEqual({ hold: 'split', tf: null, line: F.HOLD_KM.split, sway: 0 });
    const f = await flags(page);
    expect(f['story.switched_a3']).toBe(true);
    expect(await page.evaluate(() => PixelPets.side)).toBe('glimmer');
    expect(f).not.toHaveProperty(['story.sway_fernbrook']);
    const stored = await storedNow(page);
    expect(stored.v).toBe(2);
    expect(stored.flags['story.sway_kilnmouth']).toBe(0);
    expect(stored.flags).not.toHaveProperty(['story.sway_fernbrook']);
  });

  test('W3 SF-KM: the frozen-clock arrival at Kilnmouth 27,38 writes the visit and saves at once (PG-12)', async ({ page }) => {
    await bootDebug(page, F.STAGE.sf_km());
    const c = await page.evaluate(() => { PixelPets.clock.set('tue', 10, 0); return PixelPets.clock.freeze(true); });
    expect(c.day).toBe('tue');
    expect(c.hh).toBe(10);
    await page.evaluate(() => { PixelPets.showTab('walk'); PixelPets.clearWild(); });
    await goto(page, 'km_road', 27, 1, 'up');
    await page.evaluate(() => { PixelPets.clearWild(); PixelPets.walkStep('up'); });
    await page.waitForFunction(() => PixelPets.mapInfo.id === 'kilnmouth' && !PixelPets.fading, null, { timeout: 10000 });
    const w = await page.evaluate(() => { const w = PixelPets.state.world; return { map: w.map, x: w.x, y: w.y, facing: w.facing }; });
    expect(w).toEqual({ map: 'kilnmouth', x: 27, y: 38, facing: 'up' });
    const f = await flags(page);
    expect(f['story.reached_kilnmouth']).toBe(true);
    expect(f['story.km_visits']).toBe(1);
    expect(f['story.km_visit_day']).toBe((c.week - 1) * 7 + 1);
    expect((await quest(page)).id).toBe('km_reeve');
    expect(await page.evaluate(() => [PixelPets.mapHold('kilnmouth'), PixelPets.townFaction('kilnmouth'), PixelPets.holdLine('kilnmouth'), PixelPets.scene]))
      .toEqual(['split', null, 'Both sides keep a claim.', null]);
    const stored = JSON.parse(await L.storedRaw(page));
    expect(stored.v).toBe(2);
    expect(stored.flags['story.reached_kilnmouth']).toBe(true);
    expect(stored.flags['story.km_visits']).toBe(1);
  });

  for (const open of [true, false]) {
    test(`W4 SF-CAB-${open ? 'OPEN: the stair climbs to hc_gov_2 1,3' : 'DENY: Cabinet in session'}; the live city writes the save, v stays 2 (PG-13)`, async ({ page }) => {
      test.setTimeout(60000);
      await bootDebug(page, open ? F.STAGE.sf_cab_open() : F.STAGE.sf_cab_deny(), CITY_URL);
      const rawBefore = await L.storedRaw(page);
      await page.evaluate(() => { PixelPets.showTab('walk'); PixelPets.clearWild(); });
      await goto(page, 'hc_gov_1', 2, 2, 'down');
      expect(await page.evaluate(() => PixelPets.talkTo('hc_gov_keeper_b'))).toBe(true);
      expect(said(await L.drive(page))[0] === 'Go on up, holder.').toBe(open);
      await goto(page, 'hc_gov_1', 2, 2, 'left');
      await page.evaluate(() => PixelPets.walkStep('left'));
      if (open) {
        await expect.poll(() => world(page)).toEqual({ map: 'hc_gov_2', x: 1, y: 3 });
        expect((await quest(page)).id).toBe('cab_seat');
        expect(await page.evaluate(() => PixelPets.townFaction('hc_gov_2'))).toBe('keepers');
      } else {
        await expect.poll(() => sceneId(page).then(s => s !== null)).toBe(true);
        expect(said(await L.drive(page))).toEqual(['Cabinet in session. Members only.']);
        expect(await world(page)).toEqual({ map: 'hc_gov_1', x: 2, y: 2 });
      }
      await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
      await page.waitForTimeout(5500);
      // the city is live: nothing holds the save, so the last room is written; v and every key stay
      const stored = JSON.parse(await L.storedRaw(page));
      expect(stored.v).toBe(2);
      expect(stored.world.map).toBe(open ? 'hc_gov_2' : 'hc_gov_1');
      for (const k of Object.keys(JSON.parse(rawBefore))) expect(Object.keys(stored), 'no save key is removed: ' + k).toContain(k);
      expect(await page.evaluate(() => PixelPets.toasts)).not.toContain('City preview: not saved');
    });
  }

  test('PG-18: manual_saves.js prints each M1 stage save as JSON the game accepts', async ({ page }) => {
    const M = require('./manual_saves');
    expect(M.IDS).toEqual(['sf_km', 'km_in_town', 'km_stormed', 'km_curfew', 'km_morning']);
    await bootDebug(page, F.kindSave('n'));
    const script = path.join(__dirname, 'manual_saves.js');
    for (const id of M.IDS) {
      const json = execFileSync(process.execPath, [script, id], { encoding: 'utf8' }).trim();
      const s = JSON.parse(json);
      expect(s.v, id).toBe(2);
      expect(s.world, id).toMatchObject(id === 'sf_km' ? { map: 'km_road', x: 27, y: 2 } : { map: 'kilnmouth', x: 27, y: 37 });
      expect(await page.evaluate(t => PPSave.readCopy(t).ok, json), id).toBe(true);
    }
  });
});
