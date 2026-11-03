/* LANTERN_HOUSE_FERNBROOK (handoff/specs/LANTERN_HOUSE_FERNBROOK.md, rule 9 room redesign): the Fernbrook Lantern House as the
   town's wire station. Ids kept, 12x16 kept, the curfew crowd and the live wire set during the crackdown night only (D1333: the
   curfew ends at dawn, story.post_trial_done). Draft art for Pia; the checks read data and the `art` flag, never pixels. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

async function boot(page, flags) {
  const s = starterSave();
  s.settings.controls = 'modern';
  Object.assign(s.flags, { 'story.reached_route1': true, 'story.rival1_done': true, 'story.reached_fernbrook': true, 'story.met_glimmerwell': true, 'story.met_fen': true });
  s.world = { map: 'fernbrook', x: 12, y: 8, facing: 'down', respawn: 'fernbrook' };
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
  expect((await page.evaluate(() => PixelPets.checkpoint('post_trial'))).ok).toBe(true);
  await page.evaluate(f => { for (const [k, v] of Object.entries(f)) PixelPets.setFlag(k, v); }, flags || {});
  await page.evaluate(() => PixelPets.goto('fb_lantern_in', 5, 14));
  await page.waitForFunction(() => PixelPets.mapInfo.id === 'fb_lantern_in' && !PixelPets.fading);
}
const room = page => page.evaluate(() => ({ w: PixelPets.mapInfo.w, h: PixelPets.mapInfo.h, objs: Object.fromEntries(PixelPets.mapObjs.map(o => [o.id, { x: o.x, y: o.y, kind: o.kind, art: o.art }])) }));

test.describe('Fernbrook Lantern House: the wire station', () => {
  test('a normal day: ids, size, props and their art', async ({ page }) => {
    await boot(page, { 'story.post_trial_done': true });   // after the night: the curfew has lifted
    const r = await room(page);
    expect([r.w, r.h]).toEqual([12, 16]);
    expect(r.objs.amos).toMatchObject({ x: 6, y: 3 });
    expect(r.objs.fb_lantern_mat).toMatchObject({ x: 5, y: 15 });
    for (const id of ['fb_bed_a', 'fb_bed_b', 'fb_bed_c', 'fb_heal_counter', 'fb_herb_rack', 'fb_apple_a', 'fb_apple_b', 'fb_table', 'fb_jug', 'fb_stool', 'fb_basket', 'fb_lantern_note']) expect(r.objs[id], id).toBeTruthy();
    expect(r.objs.fb_lamp).toMatchObject({ x: 10, y: 9 });
    const props = { fb_wire_set: [5, 2], fb_relay_w: [3, 2], fb_relay_e: [7, 2], fb_lamp_w: [2, 2], fb_lamp_e: [8, 2], fb_switchboard: [10, 2], fb_wire_desk: [7, 3],
      fb_bench_a: [2, 8], fb_bench_b: [3, 8], fb_bench_c: [7, 8], fb_bench_d: [8, 8], fb_callbox: [9, 13] };
    for (const [id, [x, y]] of Object.entries(props)) expect(r.objs[id], id).toMatchObject({ x, y, art: true });
    expect(r.objs.fb_wire_set_live).toBeUndefined();
    for (const id of ['lh_res_kid', 'lh_odile', 'lh_res_b', 'lh_wynne', 'lh_res_c', 'lh_tobin']) expect(r.objs[id], id).toBeUndefined();
  });

  test('the crackdown night: the live set and six townsfolk facing it', async ({ page }) => {
    await boot(page);   // the post_trial checkpoint has story.crackdown and no post_trial_done
    const r = await room(page);
    expect(r.objs.fb_wire_set).toBeUndefined();
    expect(r.objs.fb_wire_set_live).toMatchObject({ x: 5, y: 2, art: true });
    const crowd = { lh_res_kid: [4, 4], lh_odile: [3, 4], lh_res_b: [7, 4], lh_wynne: [6, 5], lh_res_c: [6, 6], lh_tobin: [9, 5] };
    for (const [id, [x, y]] of Object.entries(crowd)) expect(r.objs[id], id).toMatchObject({ x, y });
  });

  test('walk mask and paths (spec §9), in both states', async ({ page }) => {
    for (const flags of [{ 'story.post_trial_done': true }, {}]) {
      await boot(page, flags);
      const t = await page.evaluate(() => ({ plinth: PixelPets.tileInfo(5, 2).solid, below: PixelPets.tileInfo(5, 3).walk, cable: PixelPets.tileInfo(8, 3).walk,
        runner: PixelPets.tileInfo(5, 12).walk, rug: PixelPets.tileInfo(5, 9).walk, mat: PixelPets.tileInfo(5, 15).ch }));
      expect(t).toEqual({ plinth: true, below: true, cable: true, runner: true, rug: true, mat: 'm' });
      // Every crackdown actor tile and the talk tiles (the set 5,3, Amos 6,4, the beds) stay reachable from the arrival tile.
      const miss = await page.evaluate(() => [[5, 10], [6, 10], [4, 13], [6, 13], [5, 13], [5, 6], [6, 7], [6, 4], [5, 3], [1, 7], [2, 7], [3, 7], [10, 3]]
        .filter(([x, y]) => !PixelPets.findPath([{ x, y }])).map(p => p.join(',')));
      expect(miss).toEqual([]);
    }
  });
});
