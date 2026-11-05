/* PLAYTEST_GATE v0.1 §6.3 (tests/playtest_gate/PACKET.md): the SEALS_BOTH_PATHS kill switch's false path, by a served-copy splice
   of game.js (game.js on disk is unchanged). Split out of g3_harden.spec.js by §8 step 1 (the gate ran over its 240 s budget in
   one file per width). PG-16. 320 and 390, reduced motion; 375 skipped. Save stays pixelpets.save.v2, v 2; zero console and
   page errors. */
const { test, expect } = require('@playwright/test');
const F = require('./gate_fixtures');
const L = require('./gate_lib');

test.beforeEach(async ({}, testInfo) => {
  test.skip(testInfo.project.name === '375', 'PLAYTEST_GATE runs at 320 and 390 only');
});
const G = L.gateGuard(test, expect);
test.use({ reducedMotion: 'reduce' });

async function bootDebug(page, save, opts) {
  await L.seed(page.context(), L.seedRaw(save));
  await L.boot(page, './?debug=1', opts);
  expect(await L.reducedMotion(page)).toBe(true);
}
const read = async page => Object.assign({ gates: await page.evaluate(F.readGates, { objs: F.OBJ_GATES, slips: F.BOARD_SLIPS, tells: F.TELLS }) },
  await page.evaluate(() => {
    const P = PixelPets;
    return { seal: P.hasSeal('seal_fernbrook'), held: P.sealsHeld(), quest: P.quest && P.quest.id, questCheck: P.questCheck, glimmerCheck: P.glimmerCheck };
  }));

test.describe('PLAYTEST_GATE g4: the SEALS kill switch, false path (§6.3, PG-16)', () => {
  for (const [kind, row] of Object.entries(F.SEALS_ROWS)) {
    test(`kind ${kind}: switch on vs off`, async ({ page, browser, baseURL }, testInfo) => {
      // The two boots run side by side, each in its own fresh context.
      const off = await G.freshPage(browser, testInfo, baseURL);
      const splice = await L.spliceSealsOff(off);
      const [on, got] = await Promise.all([
        bootDebug(page, F.kindSave(kind)).then(() => read(page)),
        bootDebug(off, F.kindSave(kind), { splice }).then(() => read(off)),
      ]);
      expect(await splice.served()).toEqual([true]);
      const changed = Object.keys(on.gates).filter(k => on.gates[k] !== got.gates[k]).sort();
      expect(changed).toEqual(row.gates);
      for (const k of row.gates) expect([on.gates[k], got.gates[k]], k).toEqual([true, false]);
      expect([on.seal, got.seal]).toEqual(row.seal);
      expect([on.held, got.held]).toEqual(row.held);
      expect(got.quest).toBe(on.quest);
      if (row.quest) expect([on.quest, got.quest]).toEqual([row.quest, row.quest]);
      if (kind === 'c_glimmer' || kind === 'n') {
        expect(got.questCheck).toEqual([]);
        expect(got.glimmerCheck).toEqual([]);
      }
    });
  }

  for (const kind of ['c_glimmer', 'n']) {
    test(`kind ${kind}: loads, settles and reloads clean with the switch off (no ?debug=1)`, async ({ page }) => {
      test.setTimeout(60000);
      const splice = await L.spliceSealsOff(page);
      const raw = L.seedRaw(F.kindSave(kind));
      await L.seed(page.context(), raw);
      await L.loadSettleReload(page, expect, kind, raw, './', { splice });
    });
  }
});
