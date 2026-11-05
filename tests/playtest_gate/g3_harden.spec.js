/* PLAYTEST_GATE v0.1 §6.1-§6.2 (tests/playtest_gate/PACKET.md): two towns flipping at the same moment (E6) and sway on old
   saves. PG-14 and PG-15. §6.3 (the SEALS kill switch) is g4_seals.spec.js (§8 step 1). 320 and 390, reduced motion; 375
   skipped. Save stays pixelpets.save.v2, v 2; zero console and page errors. */
const { test, expect } = require('@playwright/test');
const F = require('./gate_fixtures');
const L = require('./gate_lib');

test.beforeEach(async ({}, testInfo) => {
  test.skip(testInfo.project.name === '375', 'PLAYTEST_GATE runs at 320 and 390 only');
});
const G = L.gateGuard(test, expect);
test.use({ reducedMotion: 'reduce' });

const DEBUG_URL = './?debug=1';
const swayKeys = f => Object.keys(f).filter(k => k.startsWith('story.sway_')).sort();
const opt = (f, k) => (Object.prototype.hasOwnProperty.call(f, k) ? f[k] : null);
async function bootDebug(page, save, opts) {
  const raw = L.seedRaw(save);
  await L.seed(page.context(), raw);
  await L.boot(page, DEBUG_URL, opts);
  expect(await L.reducedMotion(page)).toBe(true);
  return raw;
}
const readTowns = page => page.evaluate(() => {
  const P = PixelPets, f = Object.assign({}, P.state.flags);
  return { flags: f, fb: P.mapHold('fernbrook'), km: P.mapHold('kilnmouth'), fbLine: P.holdLine('fernbrook'), kmLine: P.holdLine('kilnmouth'),
    tfFb: P.townFaction('fernbrook'), tfKm: P.townFaction('kilnmouth'), act: P.act, side: P.side,
    swayFb: P.sway('fernbrook'), swayKm: P.sway('kilnmouth'), quest: P.quest && P.quest.id,
    seal: P.hasSeal('seal_fernbrook'), held: P.sealsHeld() };
});

test.describe('PLAYTEST_GATE g3: two towns flipping at once, E6 (§6.1, PG-14)', () => {
  for (const row of F.E6) {
    const tag = row.before.map(v => (v === null ? 'absent' : v)).join(', ');
    test(`E6 (${tag}): switchSide moves every sway key by -2 and creates none`, async ({ page }) => {
      await bootDebug(page, F.sfE6(row.before[0], row.before[1]));
      const a = await readTowns(page);
      expect([opt(a.flags, 'story.sway_fernbrook'), opt(a.flags, 'story.sway_kilnmouth')]).toEqual(row.before);
      expect([a.fb, a.km, a.tfKm]).toEqual([row.fb[0], row.km[0], row.tf[0]]);
      expect([a.fbLine, a.kmLine]).toEqual([F.HOLD_FB[row.fb[0]], F.HOLD_KM[row.km[0]]]);
      expect([a.tfFb, a.act, a.side, opt(a.flags, 'story.switched_a3')]).toEqual(['keepers', 3, 'keepers', null]);
      expect(await page.evaluate(() => PixelPets.switchSide('glimmer', true))).toBe(true);
      const b = await readTowns(page);
      expect([opt(b.flags, 'story.sway_fernbrook'), opt(b.flags, 'story.sway_kilnmouth')]).toEqual(row.after);
      expect([b.fb, b.km, b.tfKm]).toEqual([row.fb[1], row.km[1], row.tf[1]]);
      expect([b.fbLine, b.kmLine]).toEqual([F.HOLD_FB[row.fb[1]], F.HOLD_KM[row.km[1]]]);
      expect([b.tfFb, b.act, b.side, b.flags['story.switched_a3']]).toEqual(['keepers', 3, 'glimmer', true]);
      expect(swayKeys(b.flags)).toEqual(swayKeys(a.flags));
      const stored = await page.evaluate(k => { window.dispatchEvent(new Event('pagehide')); return JSON.parse(localStorage.getItem(k)); }, L.SAVE_KEY);
      expect(stored.v).toBe(2);
      expect([opt(stored.flags, 'story.sway_fernbrook'), opt(stored.flags, 'story.sway_kilnmouth')]).toEqual(row.after);
    });
  }
});

test.describe('PLAYTEST_GATE g3: sway on old saves (§6.2, PG-15)', () => {
  // Several kinds of one row load side by side, each in its own context, so the row waits for one settle, not one per kind.
  async function eachKind(kinds, { page, browser, baseURL }, testInfo, fn) {
    const pages = [page];
    for (let i = 1; i < kinds.length; i++) pages.push(await G.freshPage(browser, testInfo, baseURL));
    await Promise.all(kinds.map((kind, i) => fn(kind, pages[i])));
  }

  test("b, b', p, n: no sway key, Fernbrook split; still none after a switch", async ({ page, browser, baseURL }, testInfo) => {
    test.setTimeout(60000);
    await eachKind(['b', "b'", 'p', 'n'], { page, browser, baseURL }, testInfo, async (kind, p) => {
      await bootDebug(p, F.kindSave(kind));
      const a = await readTowns(p);
      expect(swayKeys(a.flags), kind).toEqual([]);
      expect([a.swayFb, a.fb], kind).toEqual([0, 'split']);
      const stored = JSON.parse(await L.settle(p, 1));
      expect(swayKeys(stored.flags), kind).toEqual([]);
      await p.evaluate(() => PixelPets.switchSide('glimmer', true));
      const b = await readTowns(p);
      expect(swayKeys(b.flags), kind).toEqual([]);
      expect(b.fb, kind).toBe('split');
    });
  });

  test('a1, a2, c: the move writes story.sway_fernbrook 3 once; Fernbrook keepers', async ({ page, browser, baseURL }, testInfo) => {
    test.setTimeout(60000);
    await eachKind(F.PICKED, { page, browser, baseURL }, testInfo, async (kind, p) => {
      await bootDebug(p, F.kindSave(kind));
      const a = await readTowns(p);
      expect(a.flags['story.sway_fernbrook'], kind).toBe(3);
      expect(a.fb, kind).toBe('keepers');
      const pre = (await L.gateState(p)).writes.filter(w => !w.booted);
      expect(pre.length, kind).toBe(1);
      expect(JSON.parse(pre[0].raw).flags['story.sway_fernbrook'], kind).toBe(3);
      const stored = JSON.parse(await L.settle(p, 2));
      expect(stored.flags['story.sway_fernbrook'], kind).toBe(3);
      expect((await L.gateState(p)).writes.filter(w => !w.booted).length, kind).toBe(1);
    });
  });

  for (const [kind, want] of [['a1_glimmer', { quest: 'heights', seal: false, held: 0 }], ['c_glimmer', { quest: 'teaser', seal: true, held: 1 }]]) {
    test(`${kind}: the move's seven writes; Fernbrook glimmer; Seals as held`, async ({ page }) => {
      await bootDebug(page, F.kindSave(kind));
      const a = await readTowns(page);
      const seven = Object.assign({ 'story.side': 'keepers' }, F.MOVE_GLIMMER);
      for (const [k, v] of Object.entries(seven)) expect(a.flags[k], k).toEqual(v);
      expect([a.quest, a.fb, a.seal, a.held]).toEqual([want.quest, 'glimmer', want.seal, want.held]);
      const stored = JSON.parse(await L.settle(page, 2));
      for (const [k, v] of Object.entries(seven)) expect(stored.flags[k], k).toEqual(v);
    });

    test(`${kind}: a clean load (no ?debug=1) changes only story.side and adds the §3.3 list`, async ({ page }) => {
      test.setTimeout(60000);
      const raw = L.seedRaw(F.kindSave(kind));
      await L.seed(page.context(), raw);
      const { before, stored } = await L.loadSettleReload(page, expect, kind, raw, './');
      expect(stored.flags['story.side']).toBe('keepers');
      expect(stored.flags).not.toHaveProperty(['story.switches']);
      expect(stored.bag).not.toHaveProperty('cracked_phone');
      expect(stored.seals).toEqual(before.seals);
    });
  }

  test('SF-E6(absent, absent): an Act 3 Cadet with no sway keys reads 0 and split; the switch creates none', async ({ page }) => {
    test.setTimeout(60000);
    await bootDebug(page, F.sfE6(null, null));
    const a = await readTowns(page);
    expect([a.swayFb, a.swayKm, a.fb, a.km]).toEqual([0, 0, 'split', 'split']);
    expect(swayKeys(JSON.parse(await L.settle(page, 1)).flags)).toEqual([]);
    expect(await page.evaluate(() => PixelPets.switchSide('glimmer', true))).toBe(true);
    expect(swayKeys((await readTowns(page)).flags)).toEqual([]);
  });
});
