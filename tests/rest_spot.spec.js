/* A rest spot is an exact bed or bench art key. A flowerbed is not a bed. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const BEDS = ['apt_bed', 'bed', 'bed_quilt_o', 'bed_single_b', 'bed_single_g', 'bed_single_p', 'rest_bed'];
const BENCHES = ['bench_long', 'bench_short', 'bloom_bench', 'keep_bench', 'lab_bench_wait', 'mall_bench'];
const NOT_REST = ['flowerbed', 'dog_bed_big', 'lab_bench', 'lab_workbench'];

test('a flowerbed is not a rest spot and each bed key is @w1', async ({ page }) => {
  const save = starterSave();
  save.settings.follower = false;
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && PixelPets.isRestSpot);
  const r = await page.evaluate(({ BEDS, BENCHES, NOT_REST }) => {
    const spot = (sprite) => PixelPets.isRestSpot({ kind: 'prop', sprite });
    return {
      beds: BEDS.map(sprite => [sprite, spot(sprite)]),
      benches: BENCHES.map(sprite => [sprite, spot(sprite)]),
      no: NOT_REST.map(sprite => [sprite, spot(sprite)]),
      v: PixelPets.state.v,
    };
  }, { BEDS, BENCHES, NOT_REST });
  for (const [sprite, ok] of r.beds) expect(ok, sprite).toBe(true);
  for (const [sprite, ok] of r.benches) expect(ok, sprite).toBe(true);
  for (const [sprite, ok] of r.no) expect(ok, sprite).toBe(false);
  expect(r.v).toBe(2);
});
