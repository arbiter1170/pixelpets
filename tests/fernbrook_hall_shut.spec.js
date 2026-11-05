/* D1432 (Vincent, Tue Nov 3, 2026): the Fernbrook Trial Hall stays shut after the Trial and the pick, on both paths, until
   Fen's own Act 2 turn, and the flagged contested dressing (TRIAL_HALL_FERNBROOK_MAP, behind HALL2_ON) keeps the split
   look until then. The crackdown is not on main, so the shut reads the pick: story.seal1 & story.side_pick_done.
   Before the pick nothing changes: the door opens at Seal 1 and Fen is inside. After the pick Fen waits in the orchard
   (fen_after). The Keeper and Glimmerwell looks also need story.fen_turned (additive; nothing sets it yet). D1434: the
   Glimmerwell banners name no colour. Save stays pixelpets.save.v2, v 2; this build writes no new flag. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, playScene } = require('./helpers');
const K = require('./fixtures/or_gate_kinds');

trackErrors(test, expect);

const SHUT = "Shut by order of High Charity. Master Fen's Hall stays closed for now.";
const FB = { 'story.reached_route1': true, 'story.rival1_done': true, 'story.reached_fernbrook': true, 'story.met_glimmerwell': true, 'story.met_fen': true };
const DAY1 = { 'story.crate_a': true, 'story.crate_b': true, 'story.crate_c': true, 'story.tally_done': true, 'story.tl_amos': true, 'story.tl_juniper': true,
  'story.tl_done': true, 'story.crates_seen': true, 'story.fen_sent_home': true, 'story.dream_woke': true, 'story.class_sent': true, 'story.lizzy_met': true, 'story.lizzy_class': true };
const SEAL = { 'story.seal1': true, 'story.post_trial_done': true, 'trainer.h1_cadet': true, 'trainer.h1_challenger': true, 'trainer.h1_local': true, 'trainer.hall1_fen': true };
// kind -> flags and seals. seal: the Day 1 flow right after the Trial (no pick yet). keepers / glimmer: the same save after
// the pick, as the built side_pick scene leaves it (a Glimmer pick runs the orchard at once; a Keepers save still has Tobin).
const KINDS = {
  seal: { flags: { ...FB, ...DAY1, ...SEAL }, seals: { seal_fernbrook: true } },
  keepers: { flags: { ...FB, ...DAY1, ...SEAL, 'story.side_pick_done': true, 'story.side': 'keepers', 'story.know_us': true, 'story.heights_path': 'tunnels' }, seals: { seal_fernbrook: true } },
  glimmer: { flags: { ...FB, ...DAY1, ...SEAL, 'story.side_pick_done': true, 'story.side': 'glimmer', 'story.know_us': true, 'story.heights_path': 'lab', 'story.orchard_cleared': true }, seals: { seal_fernbrook: true, seal_glim_1: true } },
};
function hallSave(kind, extra) {
  const fx = KINDS[kind] || K.KINDS[kind], s = starterSave();
  s.settings.controls = 'modern';
  Object.assign(s.flags, fx.flags, extra || {});
  s.seals = { ...fx.seals };
  s.world = { map: 'fernbrook', x: 22, y: 7, facing: 'up', respawn: 'fernbrook' };
  return s;
}
async function boot(page, s, search) {
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, search || '?debug=1');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && typeof PixelPets.gateRead === 'function');
  await page.evaluate(() => { PixelPets.showTab('walk'); PixelPets.clearWild(); });
  await page.waitForFunction(() => !window.PixelPets.fading);
}
const saved = page => page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
const gate = (page, map, id) => page.evaluate(([m, i]) => PixelPets.gateRead(m, i), [map, id]);
// Tap the Hall door from its doorstep. Returns the line said at the door, or the map the holder ends up in.
async function tapDoor(page) {
  await page.evaluate(() => PixelPets.goto('fernbrook', 22, 7, 'up'));
  await page.waitForFunction(() => !window.PixelPets.fading);
  expect(await page.evaluate(() => PixelPets.talkTo('fb_hall'))).toBe(true);
  await page.waitForFunction(() => (PixelPets.scene && PixelPets.scene.full) || PixelPets.mapInfo.id === 'fb_hall_in');
  const r = await page.evaluate(() => ({ text: PixelPets.scene ? PixelPets.scene.text : null, map: PixelPets.mapInfo.id }));
  if (r.text != null) await playScene(page, []);
  else await page.waitForFunction(() => !window.PixelPets.fading);
  return r;
}

test('before the pick: the door opens at Seal 1 and Fen is inside', async ({ page }) => {
  await boot(page, hallSave('seal'));
  expect((await gate(page, 'fernbrook', 'fb_hall')).open).toBe(true);
  expect((await gate(page, 'fb_hall_in', 'fen_hall')).whenOk).toBe(true);
  expect(await page.evaluate(() => PixelPets.quest && PixelPets.quest.id)).toBe('pick');
  const r = await tapDoor(page);
  expect(r).toEqual({ text: null, map: 'fb_hall_in' });
  expect(await page.evaluate(() => PixelPets.whoAt('fb_hall_in', 7, 4))).toContain('Master Fen');
  // Fen is not doubled in the orchard before the pick.
  expect((await gate(page, 'fernbrook', 'fen_after')).whenOk).toBe(false);
  expect((await saved(page)).v).toBe(2);
});

test('an old save that picked before Trial 1 still gets in for the Trial, Fen inside', async ({ page }) => {
  // a2: a Keepers pick and the orchard, no Seal yet (FACTION_PICK_TIMING §7.4); the same cut on the Glimmer side.
  for (const kind of ['a2', 'a1_glimmer']) {
    await boot(page, hallSave(kind, { 'story.orchard_cleared': true }));
    expect((await gate(page, 'fernbrook', 'fb_hall')).open, kind).toBe(true);
    expect((await gate(page, 'fb_hall_in', 'fen_hall')).whenOk, kind).toBe(true);
    await page.evaluate(() => localStorage.clear());
  }
});

for (const side of ['keepers', 'glimmer']) {
  test(`after a ${side} pick: the door is shut with the line, Fen is not inside, she waits in the orchard`, async ({ page }) => {
    await boot(page, hallSave(side, { 'story.slice_end': true }));
    expect(await page.evaluate(() => PixelPets.mapHold('fernbrook'))).toBe(side);   // the town hold still flips (D1171)
    expect((await gate(page, 'fernbrook', 'fb_hall')).needOk).toBe(false);
    expect((await gate(page, 'fb_hall_in', 'fen_hall')).whenOk).toBe(false);
    expect((await gate(page, 'fernbrook', 'fen_after')).whenOk).toBe(true);
    expect(await page.evaluate(() => PixelPets.whoAt('fernbrook', 10, 9))).toContain('Master Fen');
    const before = await saved(page);
    const r = await tapDoor(page);
    expect(r).toEqual({ text: SHUT, map: 'fernbrook' });
    // Fen's line in the orchard: a Keepers save that has not beaten Tobin yet gets her nudge.
    await page.evaluate(() => PixelPets.goto('fernbrook', 10, 10, 'up'));
    await page.waitForFunction(() => !window.PixelPets.fading);
    expect(await page.evaluate(() => PixelPets.talkTo('fen_after'))).toBe(true);
    await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
    expect(await page.evaluate(() => PixelPets.scene.text)).toBe(side === 'keepers' ? "Tobin's by the cart. Show him what a strong team looks like." : 'The trees still know your step.');
    await playScene(page, []);
    // No quest row points into the shut Hall.
    const q = await page.evaluate(() => PixelPets.quest && { id: PixelPets.quest.id, map: PixelPets.quest.target && PixelPets.quest.target.map });
    expect(q && q.map).not.toBe('fb_hall_in');
    // Save unchanged: v 2, the same flag keys, no story.fen_turned written.
    const after = await saved(page);
    expect(after.v).toBe(2);
    expect(Object.keys(after.flags).sort()).toEqual(Object.keys(before.flags).sort());
    expect(after.flags['story.fen_turned']).toBeUndefined();
    expect(await page.evaluate(() => PixelPets.questCheck)).toEqual([]);
  });
}

test('an old save that picked first and already has Seal 1 sees the Hall shut too', async ({ page }) => {
  for (const kind of ['c', 'c_glimmer']) {
    await boot(page, hallSave(kind, { 'story.slice_end': true }));
    expect((await gate(page, 'fernbrook', 'fb_hall')).needOk, kind).toBe(false);
    expect((await gate(page, 'fb_hall_in', 'fen_hall')).whenOk, kind).toBe(false);
    expect((await gate(page, 'fernbrook', 'fen_after')).whenOk, kind).toBe(true);
    expect((await tapDoor(page)).text, kind).toBe(SHUT);
    await page.evaluate(() => localStorage.clear());
  }
});

// The flagged dressing (debug plus ?hall2=1): split until Fen's turn on both paths; the turn shows a side's look.
const SPLIT_ONLY = ['fb_hall_banner_half', 'fb_hall_board_k', 'fb_hall_board_g', 'fb_hall_rope', 'fb_hall_grout'];
const GLIM_ONLY = ['fb_hall_banner_k1_g', 'fb_hall_banner_k2_g', 'fb_hall_crest_cover', 'fb_hall_banner_half_g', 'fb_hall_clamp_w', 'fb_hall_board_k_g', 'fb_hall_lampbox'];
const KEEP_ONLY = ['fb_hall_plaque_k', 'fb_hall_banner_half_k', 'fb_hall_clamp_8_off', 'fb_hall_board_k_k', 'fb_hall_tilecrate', 'fb_hall_lamp_e'];
const BOTH_SPLIT = ['fb_hall_plaque', 'fb_hall_banner_g1', 'fb_hall_crest', 'fb_hall_banner_k1'];   // the split's two sides at once
async function look(page) {
  return page.evaluate(ids => Object.fromEntries(ids.map(id => [id, !!(PixelPets.gateRead('fb_hall_in', id) || {}).whenOk])),
    [].concat(SPLIT_ONLY, GLIM_ONLY, KEEP_ONLY, BOTH_SPLIT));
}
const expectLook = (got, want, tag) => {
  for (const id of SPLIT_ONLY) expect(got[id], tag + ' ' + id).toBe(want === 'split');
  for (const id of GLIM_ONLY) expect(got[id], tag + ' ' + id).toBe(want === 'glimmer');
  for (const id of KEEP_ONLY) expect(got[id], tag + ' ' + id).toBe(want === 'keepers');
  if (want === 'split') for (const id of BOTH_SPLIT) expect(got[id], tag + ' ' + id).toBe(true);
};

test('flagged dressing: split before Fen\'s turn on both paths, not rebranded; her turn shows a side\'s look', async ({ page }) => {
  test.setTimeout(90000);
  for (const side of ['keepers', 'glimmer']) {
    await boot(page, hallSave(side, { 'story.slice_end': true }), '?debug=1&hall2=1');
    expect(await page.evaluate(() => PixelPets.hall2())).toBe(true);
    expectLook(await look(page), 'split', side);
    // D1727 (REPORT_FLAGS default, pending Vincent): Fen's own turn picks the look (story.fen_turned=<side>), not the holder's side.
    await page.evaluate(s => PixelPets.setFlag('story.fen_turned', s === 'glimmer' ? 'keepers' : 'glimmer'), side);
    expectLook(await look(page), side === 'glimmer' ? 'keepers' : 'glimmer', side + ' holder, Fen turned the other way');
    await page.evaluate(s => PixelPets.setFlag('story.fen_turned', s), side);
    expectLook(await look(page), side, side + ' turned');
    await page.evaluate(() => localStorage.clear());
  }
  // Before the pick it is the split look too, as built.
  await boot(page, hallSave('seal'), '?debug=1&hall2=1');
  expectLook(await look(page), 'split', 'seal');
});

test('D1434: the Glimmerwell banners in the dressing name no colour; the door line fits', async ({ page }) => {
  await boot(page, hallSave('seal'));
  const r = await page.evaluate(() => {
    const objs = MAPDATA.detail_zz_hall_contested.hallPatch.maps.fb_hall_in.addObjs.filter(o => /^banner_glim/.test(o.sprite));
    const door = MAPDATA.fernbrook_rooms.slicePatch.maps.fernbrook.replaceObjs.find(o => o.id === 'fb_hall');
    const fen = MAPDATA.glimmer_path.slicePatch.maps.fernbrook.addObjs.find(o => o.id === 'fen_after');
    // STORY_LINES D2134: Fen's Open-lean nudge (!story.orchard_cleared) is a talk line under the 110 rule; her side lines stay <= 40.
    return { n: objs.length, banners: objs.map(o => o.lines.else), deny: Object.values(door.deny), fen: Object.values(fen.lines), side: Object.entries(fen.lines).filter(([k]) => k !== '!story.orchard_cleared').map(([, v]) => v) };
  });
  expect(r.n).toBeGreaterThan(0);
  for (const l of r.banners) expect(l, l).not.toMatch(/\b(black|red|wine|mint|soot|crimson|honey|cyan|teal|green|gold)\b/i);
  expect(r.deny[0]).toBe(SHUT);
  for (const l of r.deny.concat(r.fen)) {
    expect(l.length, l).toBeLessThanOrEqual(110);
    expect(l, l).not.toMatch(/\b(trainer|gym|coins?|fainted|evolve|appeared)\b|dex\b|  /i);
  }
  for (const l of r.side) expect(l.length, l).toBeLessThanOrEqual(40);   // fen_after's side lines double as ambient lines
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('the shut door reads the same with reduced motion, with no console errors', async ({ page }) => {
    await boot(page, hallSave('glimmer', { 'story.slice_end': true }));
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
    expect((await tapDoor(page)).text).toBe(SHUT);
    expect((await saved(page)).v).toBe(2);
  });
});
