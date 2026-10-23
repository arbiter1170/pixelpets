/* Every authored interactable must answer a Modern tap: object taps select it and have a free
   neighbour on the walk region; pickups, warps and triggers stay walk-on. Arcade TALK stays off
   for scene-only and shop-only props (birthday balloons, the Heights crate). */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

test('every interactable tap resolves to its action @w1', async ({ page }) => {
  test.setTimeout(60000);
  const s = starterSave();
  s.settings.controls = 'modern';
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  const audit = await page.evaluate(() => PixelPets.auditTaps());
  expect(audit.predicateGaps).toEqual([]);
  expect(audit.counts).toEqual({
    // sign is 74: the authored signs plus the runtime "Back at 3. - L." note on 5B.
    // P4 adds eight shops and fourteen stall lines. The lamp-oil counter moves from talk to shop.
    // talk is 565: the Bloom Trial Hall adds six terrace props.
    door: 38, warp: 76, sign: 77, talk: 565, scene: 36, trigger: 31, board: 6,
    trainer: 23, pickup: 17, wild: 3, shop: 13, roll: 1, booth: 6, panel: 2,
  });
  // Pre-existing tiles a tap cannot stand on. None of these are the dream toy, the balloons, or the crate.
  expect(audit.reachGaps).toEqual([
    'hearthmoor:hm_to_hc walk-on tile is solid or blocked',
    'fernbrook:fb_east walk-on tile is solid or blocked',
    'fernbrook:fb_tour2 walk-on tile is solid or blocked',
    'route2:r2_east walk-on tile is solid or blocked',
    'cc_hall_in:hale neighbour is off the safe region',
    'cc_hall_in:h2_lamp_l neighbour is off the safe region',
    'cc_hall_in:h2_cairn neighbour is off the safe region',
    'cc_hall_in:h2_seam_b neighbour is off the safe region',
    'cc_hall_in:h2_sweeper neighbour is off the safe region',
    'hm_hq_f1:hq_table_tl has no free neighbour',
    'hm_hq_f1:hq_evid_a has no free neighbour',
    'hm_hq_f1:hq_locker_b neighbour is off the safe region',
    'hm_hq_f2:hq2_radio_b has no free neighbour',
    'hm_hq_f2:hq2_banner_b has no free neighbour',
    'hm_hq_f2:hq2_crate has no free neighbour',
  ]);
  expect(audit.n).toBeGreaterThan(100);
  const sceneOnly = audit.rows.filter((r) => r.kind === 'prop' && r.act === 'scene' && !r.talkable).map((r) => r.id).sort();
  expect(sceneOnly).toEqual(['balloon_blue', 'balloon_red', 'balloon_yellow']);
  for (const id of sceneOnly) {
    const row = audit.rows.find((r) => r.id === id);
    expect(row.tappable).toBe(true);
    expect(row.talkable).toBe(false);
    expect(row.reached).toBeGreaterThan(0);
  }
  for (const id of ['rc_crate_1', 'rc_crate_2', 'rc_crate_3']) {
    const row = audit.rows.find((r) => r.id === id);
    expect(row).toMatchObject({ act: 'scene', tappable: true, talkable: true });
    expect(row.reached).toBeGreaterThan(0);
  }
  const shopOnly = audit.rows.filter((r) => r.act === 'shop' && r.talkable === false);
  expect(shopOnly.map((r) => r.id)).toEqual(['ht_stock']);
  expect(shopOnly[0].tappable).toBe(true);
  expect(shopOnly[0].reached).toBeGreaterThan(0);
  const toy = audit.rows.find((r) => r.id === 'pop_toy');
  expect(toy).toMatchObject({ act: 'roll', tappable: true, talkable: true });
  expect(toy.reached).toBeGreaterThan(0);
  for (const act of ['pickup', 'warp', 'trigger']) {
    const rows = audit.rows.filter((r) => r.act === act);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) expect(row.tappable).toBe(false);
  }
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
  expect(await page.evaluate(() => PixelPets.questCheck)).toEqual([]);
});
