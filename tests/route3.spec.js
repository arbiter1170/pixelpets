/* ARBITER_UNITS Build C: Route 3, the Brinewick road (D848-D851). The road opens past Cobblecrest's east sign once
   story.route3_open is set: Rook's last crates plus that side's chapter end. Three lair rooms open off it. Its south gate opens onto Brinewick (BRINEWICK). Save v stays 2. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, shot } = require('./helpers');

trackErrors(test, expect);

function save(flags, world) {
  const s = starterSave();
  s.settings.follower = false;
  Object.assign(s.flags, { 'story.cobble_end': true, 'story.reached_cobblecrest': true }, flags || {});
  s.world = Object.assign({ map: 'cobblecrest', x: 27, y: 8, facing: 'right', respawn: 'cobblecrest' }, world || {});
  return s;
}
async function boot(page, s) {
  await installSave(page.context(), s || save(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
}
const here = page => page.evaluate(() => ({ map: PixelPets.mapInfo.id, x: PixelPets.state.world.x, y: PixelPets.state.world.y, face: PixelPets.state.world.facing }));
const settled = (page, id) => page.waitForFunction(m => PixelPets.mapInfo.id === m && !PixelPets.fading, id);

test('the Brinewick road stays shut until the last crates and the chapter end, then opens both ways', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.goto('cobblecrest', 29, 8, 'right'));
  const shut = await page.evaluate(() => ({ warp: PixelPets.mapObjs.some(o => o.id === 'cc_east'), crates: PixelPets.mapObjs.some(o => o.id === 'cc_crates') }));
  expect(shut).toEqual({ warp: false, crates: true });
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(400);
  expect((await here(page)).x).toBe(29);                       // the crates still block the road
  // Bumping the crates reads their verbatim line; close it, or the next debug goto is refused while a scene is open.
  for (let i = 0; i < 6 && await page.evaluate(() => !!PixelPets.scene); i++) { await page.keyboard.press('Space'); await page.waitForTimeout(150); }
  await page.waitForFunction(() => !PixelPets.scene);

  // The last crates alone do not open it: a Keeper also needs the Lantern Council (D848).
  await page.evaluate(() => { PixelPets.setFlag('story.rc_done', true); PixelPets.goto('cobblecrest', 29, 8, 'right'); });
  expect(await page.evaluate(() => PixelPets.mapObjs.some(o => o.id === 'cc_east'))).toBe(false);
  await page.evaluate(() => { PixelPets.setFlag('story.hc_council_done', true); PixelPets.goto('cobblecrest', 29, 8, 'right'); });
  const open = await page.evaluate(() => ({ warp: PixelPets.mapObjs.some(o => o.id === 'cc_east'), crates: PixelPets.mapObjs.some(o => o.id === 'cc_crates'), aside: PixelPets.mapObjs.some(o => o.id === 'cc_crates_aside') }));
  expect(open).toEqual({ warp: true, crates: false, aside: true });
  await page.keyboard.press('ArrowRight');                       // onto the tile the crates used to block
  await expect.poll(() => here(page).then(h => h.x)).toBe(30);
  await page.waitForTimeout(250);
  await page.keyboard.press('ArrowRight');                       // and onto the east warp
  await settled(page, 'route3');
  expect(await here(page)).toEqual({ map: 'route3', x: 1, y: 4, face: 'right' });
  expect(await page.evaluate(() => PixelPets.state.flags['story.reached_route3'])).toBe(true);
  await shot(page, 'route3-arrive');

  await page.keyboard.press('ArrowLeft');
  await settled(page, 'cobblecrest');
  expect(await here(page)).toMatchObject({ map: 'cobblecrest', x: 30, y: 8 });
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});

test('Route 3 is a portrait route with its own music, spawns, hold, floor cap and map node', async ({ page }) => {
  await boot(page, save({ 'story.rc_done': true, 'story.hc_council_done': true, 'story.route3_open': true, 'story.reached_route3': true }, { map: 'route3', x: 2, y: 4 }));
  const info = await page.evaluate(() => {
    const i = id => SPECIES.findIndex(s => s.id === id);
    const odds = PixelPets.spawnOdds(['night', 'fog', 'city', 'storm', 'water'], 'route3');
    return {
      w: PixelPets.mapInfo.w, h: PixelPets.mapInfo.h, music: PixelPets.mapTrack('route3'),
      share: PixelPets.floorShare('route3').share, checks: PixelPets.devChecks(),
      shade: odds[i('shade')], volt: odds[i('volt')], tide: odds[i('tide')], units: ['tallybat', 'dimlamp', 'filecrow', 'cordhound', 'humwisp'].map(id => odds[i(id)]),
      hold: PixelPets.mapHold('route3'), node: !!PixelPets.mapNodeCenter('route3'),
      rooms: ['r3_sanctuary', 'r3_ledger', 'r3_relay'].map(id => PixelPets.mapTrack(id)),
    };
  });
  expect(info).toMatchObject({ w: 24, h: 48, music: 'route3', hold: 'split', node: true, tide: 0 });
  expect(info.h).toBeGreaterThan(info.w);                         // D82: routes are portrait
  expect(info.share).toBeLessThanOrEqual(0.7);                    // D88
  expect(info.checks.floorCap).toEqual([]);
  expect(info.checks.map).toEqual([]);
  expect(info.checks.quest).toEqual([]);
  expect(info.checks.glimmer).toEqual([]);
  expect(info.shade).toBeGreaterThan(0);
  expect(info.volt).toBeGreaterThan(0);
  expect(info.units).toEqual([0, 0, 0, 0, 0]);                    // the five are bosses, never wild
  expect(info.rooms[2]).toBe('lab');
  await shot(page, 'route3-road');
});

test('each lair room opens from its door and its mat leads back to the road', async ({ page }) => {
  await boot(page, save({ 'story.rc_done': true, 'story.hc_council_done': true, 'story.route3_open': true, 'story.reached_route3': true }, { map: 'route3', x: 2, y: 4 }));
  const doors = [
    { id: 'r3_sanctuary', door: [5, 19], in: [5, 7] },
    { id: 'r3_ledger', door: [17, 27], in: [6, 8] },
    { id: 'r3_relay', door: [16, 42], in: [5, 10] },
  ];
  for (const d of doors) {
    await page.evaluate(([x, y]) => PixelPets.goto('route3', x, y, 'up'), d.door);
    await page.keyboard.press('ArrowUp');
    await settled(page, d.id);
    expect(await here(page)).toEqual({ map: d.id, x: d.in[0], y: d.in[1], face: 'up' });
    await page.evaluate(([id, x, y]) => PixelPets.goto(id, x, y, 'down'), [d.id, d.in[0], d.in[1]]);
    await page.keyboard.press('ArrowDown');
    await settled(page, 'route3');
    expect(await here(page)).toMatchObject({ map: 'route3', x: d.door[0], y: d.door[1] });
  }
  await page.evaluate(() => PixelPets.goto('r3_relay', 5, 10, 'up'));
  await shot(page, 'route3-relay');
});

test('the Brinewick gate stands open and the end of the road leads south (BRINEWICK)', async ({ page }) => {
  await boot(page, save({ 'story.rc_done': true, 'story.hc_council_done': true, 'story.route3_open': true, 'story.reached_route3': true }, { map: 'route3', x: 2, y: 4 }));
  expect(await page.evaluate(() => PixelPets.mapObjs.some(o => o.id === 'r3_gate' && o.x === 10 && o.y === 46))).toBe(true);
  await page.evaluate(() => PixelPets.goto('route3', 11, 45, 'down'));
  await page.keyboard.press('ArrowDown');
  await expect.poll(() => here(page).then(h => h.y)).toBe(46);
  await page.waitForTimeout(250);
  await page.keyboard.press('ArrowDown');
  await settled(page, 'brinewick');
  expect(await here(page)).toMatchObject({ map: 'brinewick', x: 10, y: 1 });
  expect(await page.evaluate(() => PixelPets.state.flags['story.reached_brinewick'])).toBe(true);
});
