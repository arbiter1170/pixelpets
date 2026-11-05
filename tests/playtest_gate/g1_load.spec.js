/* PLAYTEST_GATE v0.1 §3 (tests/playtest_gate/PACKET.md): every Act 1 save kind loads as a real old save, settles and reloads
   clean, without ?debug=1, as a holder's save does. PG-3 to PG-8. 320 (reduced motion) and 390 (motion on); 375 skipped.
   Save stays pixelpets.save.v2, v 2; nothing written at load beyond the §3.3 list; zero console and page errors. */
const { test, expect } = require('@playwright/test');
const F = require('./gate_fixtures');
const L = require('./gate_lib');

test.beforeEach(async ({}, testInfo) => {
  test.skip(testInfo.project.name === '375', 'PLAYTEST_GATE runs at 320 and 390 only');
});
L.gateGuard(test, expect);
// §2.2: both motion paths load every kind.
test.use({ reducedMotion: async ({}, use, testInfo) => use(testInfo.project.name === '320' ? 'reduce' : 'no-preference') });

test.describe('PLAYTEST_GATE g1: load, settle, reload (§3)', () => {
  for (const kind of F.SEVEN) {
    test(`kind ${kind}: boots, writes only the §3.3 list, settles and reloads clean`, async ({ page }, testInfo) => {
      test.setTimeout(60000);
      const raw = L.seedRaw(F.kindSave(kind));
      await L.seed(page.context(), raw);
      await L.loadSettleReload(page, expect, kind, raw, './');
      expect(await L.reducedMotion(page)).toBe(testInfo.project.name === '320');
    });
  }

  test('the cloud stays off: no Firebase request, PPCloud disabled (PG-3)', async ({ page }) => {
    await L.seed(page.context(), L.seedRaw(F.kindSave('n')));
    await L.boot(page, './');
    expect(await page.evaluate(() => PPCloud.info().enabled)).toBe(false);
    expect(new URL(page.url()).search).not.toMatch(/cloud=/);
  });
});
