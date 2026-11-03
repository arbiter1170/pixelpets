/* Every authored interactable must answer a Modern tap: object taps select it and have a free
   neighbour on the walk region; pickups, warps and triggers stay walk-on. Arcade TALK stays off
   for scene-only and shop-only props (birthday balloons, the Heights crate). */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

test('every interactable tap resolves to its action @w1', async ({ page }) => {
  test.setTimeout(60000);
  // Pin the clock to an ET midday so the audit never depends on when the suite runs.
  await page.clock.setFixedTime(new Date('2026-11-03T12:00:00-05:00'));
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
    // talk is 572: the Bloom Trial Hall adds six terrace props, and the four heart lanterns
    // plus Host Della, Host Garnet and Host Ines are talk.
    // Hearthmoor Plaza (#196), Route 3 with its three side rooms and the Answerers (ARBITER_UNITS), and Brinewick
    // with Trial Hall #3 and its rooms (BRINEWICK v0.1) bring door 45, warp 93, sign 89, talk 669, scene 40,
    // trigger 34, board 7, trainer 25, shop 14 and wild 9.
    // FERNBROOK_HOMES (D1248): three home doors and their three mats, the lane sign, and 62 talk taps (six residents plus
    // the props inside the three homes and on the south lane) add door 3, warp 3, sign 1 and talk 62.
    // DAY1_TRIAL1_FLOW adds sign 6 (four contested Fernbrook signs, two held), talk 6 (three crates, Tobin's tally, Burrsnout,
    // Juniper in the Lantern House), trainer 3 (the Trial Hall holders) and trigger 4 (Two Lights x3, Fen's west-road catch).
    // PARTNER_DAY (#258): the new hall and bedroom (hm_home_hall, hm_home_room), Mom (moved down from hm_home_up) and Maze,
    // the home pegs, the up_cushion, and hm_buddy_pre / hm_lizzy_pre in Hearthmoor add talk 12, warp 4 (hall_mom,
    // hall_room, hall_stairs, room_door) and trigger 2 (mom_luck_at, room_not_yet). None of these depend on the clock.
    door: 48, warp: 100, sign: 96, talk: 741, scene: 40, trigger: 40, board: 7,
    trainer: 28, pickup: 17, wild: 9, shop: 14, roll: 1, booth: 6, panel: 2,
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
    // ARBITER_UNITS: Quinn stands behind the hall's gates like Hale and the h2_ props.
    'cc_hall_in:cc_quinn neighbour is off the safe region',
    'hm_hq_f1:hq_table_tl has no free neighbour',
    'hm_hq_f1:hq_evid_a has no free neighbour',
    'hm_hq_f1:hq_locker_b neighbour is off the safe region',
    'hm_hq_f2:hq2_radio_b has no free neighbour',
    'hm_hq_f2:hq2_banner_b has no free neighbour',
    'hm_hq_f2:hq2_crate has no free neighbour',
    // BRINEWICK v0.1: Trial Hall #3 keeps Marisol and its props behind the tide gauge gate, as cc_hall_in does.
    // (The depot's wall-side crates are silent stock, so they are not interactables.)
    'bw_hall_in:marisol neighbour is off the safe region',
    'bw_hall_in:bw_quinn neighbour is off the safe region',
    'bw_hall_in:bw_bell neighbour is off the safe region',
    'bw_hall_in:bw_chart neighbour is off the safe region',
    'bw_hall_in:h3_gauge_b neighbour is off the safe region',
    'bw_hall_in:bw_ringer neighbour is off the safe region',
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
