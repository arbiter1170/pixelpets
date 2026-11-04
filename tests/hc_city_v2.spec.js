/* HIGH_CHARITY_LAYOUT v0.2.1 phase 1, "the capital, day one" (design specs/HIGH_CHARITY_LAYOUT.md; D1268, D1270-D1281,
   handoff/maps/HC_CITY_V2.md). Five walkable chunks (Lantern Square, Charter Hill, Exchange Quarter, Lantern Quay, College
   Green) and five new rooms, behind HC_CITY_V2 (false) and the ?debug=1&hccity=2 preview. Normal play, plain ?debug=1
   included, is unchanged; the preview never writes the save. Runs at 320, 375 and 390; reduced motion; zero console errors. */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');
const { stubCloudSdk } = require('./cloud_stub');

trackErrors(test, expect);

const CHUNKS = ['highcharity', 'hc_civic', 'hc_exchange', 'hc_waterfront', 'hc_college'];
const NEW_ROOMS = ['hc_lantern_in', 'hc_news_1', 'hc_news_2', 'hc_gov_1', 'hc_gov_3'];
const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'hc_city_v2.json'), 'utf8'));
// Today's 15 door tiles and five grass tiles (data/highcharity.json), for the old-save check (§13 test 3).
const OLD_DOORS = [[32, 4], [32, 9], [9, 11], [52, 9], [22, 13], [18, 17], [45, 15], [8, 25], [17, 25], [25, 25], [11, 29], [32, 29], [49, 29], [22, 34], [55, 35]];
const OLD_GRASS = [[3, 3], [60, 3], [40, 20], [5, 35], [60, 36]];

function save(opts = {}) {
  const s = starterSave();
  s.settings.follower = false;
  s.settings.controls = 'modern';
  s.settings.textSpeed = 'fast';
  s.settings.tips = false;
  s.money = 20;
  Object.assign(s.flags, { 'story.side_pick_done': true, 'story.hc_invite': true, 'story.hc_arrived': true, 'story.hc_greeted': true });
  if (opts.side === 'glimmer') s.flags['story.side'] = 'glimmer';
  if (opts.act) s.flags['story.act'] = opts.act;
  if (opts.govMet) s.flags['story.hc_gov_met'] = true;
  if (opts.posted) s.flags['story.gov_posted'] = true;   // GOVERNOR_MEETING D1473: the door opens on Ilse's posting
  s.world = Object.assign({ map: 'highcharity', x: 32, y: 37, facing: 'up', respawn: 'hearthmoor' }, opts.world || {});
  return s;
}
async function boot(page, s, q = '?debug=1&hccity=2') {
  await installSave(page.context(), s || save(), { quietDay: true });
  await gotoGame(page, q);
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && PixelPets.state && PixelPets.state.party[0]);
  await page.evaluate(() => { PixelPets.showTab('walk'); if (PixelPets.clearWild) PixelPets.clearWild(); });
}
async function settle(page) { await expect.poll(() => page.evaluate(() => !PixelPets.fading)).toBe(true); }
const where = page => page.evaluate(() => ({ map: PixelPets.mapInfo.id, x: PixelPets.state.world.x, y: PixelPets.state.world.y }));
async function endScene(page) {
  for (let i = 0; i < 60; i++) {
    const on = await page.evaluate(() => !!PixelPets.scene);
    if (!on) return;
    await page.keyboard.press('Space'); await page.waitForTimeout(60);
  }
}

test('flag off: plain ?debug=1 keeps today\'s High Charity and never loads the city into WORLD or the save maps', async ({ page }) => {
  await boot(page, save(), '?debug=1');
  const r = await page.evaluate(() => ({
    hc: PixelPets.hcCity(), check: PixelPets.charityCheck(),
    chunks: ['hc_civic', 'hc_exchange', 'hc_waterfront', 'hc_college', 'hc_news_1', 'hc_gov_3'].filter(id => !!WORLD[id]),
    grid: WORLD.highcharity.grid.join('\n') === MAPDATA.highcharity.maps.highcharity.grid.join('\n'),
    apt_c: WORLD.highcharity.objs.some(o => o.id === 'hc_apt_c'), lantern: [WORLD.hc_lantern_in.w, WORLD.hc_lantern_in.h],
    inMapdata: Object.keys(MAPDATA).filter(k => /hc_city/.test(k)), saveMaps: PPSave.MAPS.filter(id => /^hc_(civic|exchange|waterfront|college|news|gov)/.test(id)),
    data: !!window.PP_HC_V2,
  }));
  expect(r.hc.on).toBe(false);
  expect(r.check).toEqual([]);
  expect(r.chunks).toEqual([]);
  expect(r.grid).toBe(true);
  expect(r.apt_c).toBe(true);
  expect(r.lantern).toEqual([9, 7]);
  expect(r.inMapdata).toEqual([]);
  expect(r.saveMaps).toEqual([]);
  expect(r.data).toBe(true);   // the file loads, but nothing reads it without the flag
});

test('the city loads: five chunks and five rooms, the in-game check passes, and every chunk keeps the perf budget', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => ({ hc: PixelPets.hcCity(), check: PixelPets.charityCheck(), rooms: ['hc_lantern_in', 'hc_news_1', 'hc_news_2', 'hc_gov_1', 'hc_gov_3'].map(id => WORLD[id] && [WORLD[id].w, WORLD[id].h]) }));
  expect(r.hc.on && r.hc.preview && !r.hc.ship).toBe(true);
  expect(r.check).toEqual([]);
  // NPC_RANKS: every city Keeper body carries the D1374 flag (ranks are Story's), so none is missing a rank
  const ranks = await page.evaluate(() => PixelPets.rankCheck());
  const cityNames = DATA.cast.map(e => e.name);
  expect(ranks.missing.filter(n => cityNames.includes(n))).toEqual([]);
  expect(ranks.bad.filter(b => cityNames.some(n => b.startsWith(n + ':')))).toEqual([]);
  expect(r.hc.chunks.map(c => c.id)).toEqual(['highcharity', 'hc_civic', 'hc_exchange', 'hc_waterfront', 'hc_college']);
  expect(r.hc.chunks.map(c => [c.w, c.h])).toEqual([[64, 40], [64, 48], [64, 48], [64, 40], [48, 48]]);
  for (const c of r.hc.chunks) {
    expect(c.objs, c.id).toBeLessThanOrEqual(240);
    expect(c.people, c.id).toBeLessThanOrEqual(24);
    expect(c.tanks, c.id).toBeLessThanOrEqual(3);
  }
  expect(r.hc.chunks.reduce((n, c) => n + c.tanks, 0)).toBe(9);
  expect(r.hc.chunks.reduce((n, c) => n + c.cars, 0)).toBe(48);
  expect(r.rooms).toEqual([[16, 22], [14, 16], [14, 14], [16, 16], [12, 14]]);
  // §6.4: the city data stays well inside the 180 KB budget
  expect(fs.statSync(path.join(__dirname, '..', 'data', 'hc_city_v2.js')).size).toBeLessThan(180 * 1024);
});

test('every mouth warps to its partner one tile inward, and back (tap-walk on the edge cell)', async ({ page }) => {
  test.setTimeout(90000);
  await boot(page);
  const mouths = await page.evaluate(() => {
    const out = [];
    for (const id of ['highcharity', 'hc_civic', 'hc_exchange', 'hc_waterfront', 'hc_college'])
      for (const o of WORLD[id].objs) if (o.kind === 'warp' && /_2$/.test(o.id) && /^m_c/.test(o.id) && o.to !== 'route4_reeds') out.push({ map: id, id: o.id, x: o.x, y: o.y, to: o.to, tx: o.tx, ty: o.ty, w: WORLD[id].w, h: WORLD[id].h });
    return out;
  });
  expect(mouths.length).toBe(12);   // six paired mouths, both ends (the river road's north mouth m_c1_n: route_to_governor.spec.js)
  for (const m of mouths) {
    // stand one tile inside the middle cell and step onto it
    const dir = m.y === 0 ? 'up' : m.y === m.h - 1 ? 'down' : m.x === 0 ? 'left' : 'right';
    const step = { up: [0, 1], down: [0, -1], left: [1, 0], right: [-1, 0] }[dir];
    await page.evaluate(([mp, x, y, f]) => PixelPets.goto(mp, x, y, f), [m.map, m.x + step[0], m.y + step[1], dir]);
    await settle(page);
    await page.evaluate(d => PixelPets.walkStep(d), dir);
    await settle(page);
    await expect.poll(() => where(page), m.id).toEqual({ map: m.to, x: m.tx, y: m.ty });
  }
});

test('the coach still lands on 32,37 facing north and sets hc_arrived; the Event Hall door (the quest target) stays 32,29', async ({ page }) => {
  // This checks the warp's data and its landing on the rebuilt Lantern Square. Stepping onto the Hearthmoor coach (now at 16,9,
  // off the Keeper House roof) is tests/coach_hall_faction.spec.js.
  await boot(page);
  const r = await page.evaluate(() => {
    const o = WORLD.hearthmoor.objs.find(o => o.id === 'hm_to_hc');
    PixelPets.goto('highcharity', 32, 37, 'up');
    const land = PixelPets.tileInfo(32, 37), m = WORLD.highcharity;
    return { coach: o && { to: o.to, tx: o.tx, ty: o.ty, facing: o.facing, setFlag: o.setFlag },
      land: land.walk && !land.blocked, hall: m.objs.filter(o => o.id === 'hc_hall').map(o => [o.x, o.y, o.to]),
      south: m.objs.filter(o => o.id === 'hc_south').map(o => [o.x, o.y, o.to]), moss: m.objs.filter(o => o.id === 'hc_moss').map(o => [o.x, o.y]),
      gate: m.objs.filter(o => o.id === 'hc_gate').map(o => [o.x, o.y]) };
  });
  expect(r.coach).toEqual({ to: 'highcharity', tx: 32, ty: 37, facing: 'up', setFlag: 'story.hc_arrived' });
  expect(r.land).toBe(true);
  expect(r.hall).toEqual([[32, 29, 'hc_hall_in']]);
  expect(r.south).toEqual([[32, 38, 'hearthmoor']]);
  expect(r.moss).toEqual([[30, 36]]);
  expect(r.gate).toEqual([[32, 36]]);
  // walk the five tiles up Gate Avenue to the Event Hall's doorstep row: nothing on the avenue stops the holder
  for (let i = 0; i < 7; i++) { await page.evaluate(() => PixelPets.walkStep('up')); await page.waitForTimeout(60); }
  await settle(page);
  expect((await where(page)).y).toBeLessThanOrEqual(31);
});

test('old saves: a save on any of today\'s door tiles or grass loads onto a walk tile (safeSpot to 32,37 where needed)', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(([doors, grass]) => {
    PixelPets.goto('highcharity', 32, 37, 'up');
    const m = WORLD.highcharity, walk = (x, y) => PixelPets.tileInfo(x, y).walk;
    const warpAt = (x, y) => m.objs.some(o => o.kind === 'warp' && o.x === x && o.y === y);
    return doors.concat(grass).map(([x, y]) => ({ x, y, lands: walk(x, y) && !warpAt(x, y) ? [x, y] : [m.safe.x, m.safe.y] }))
      .map(t => ({ ...t, ok: walk(t.lands[0], t.lands[1]) }));
  }, [OLD_DOORS, OLD_GRASS]);
  expect(r.filter(t => !t.ok)).toEqual([]);
  // and for real: today's Lantern House door (22,34, now the Square's roofs), Apartments A (8,25) and a corner of grass boot onto a walk tile
  for (const [x, y] of [[22, 34], [8, 25], [3, 3]]) {
    await boot(page, save({ world: { x, y } }));
    const w = await page.evaluate(() => { const s = PixelPets.state.world; return { map: PixelPets.mapInfo.id, walk: PixelPets.tileInfo(s.x, s.y).walk }; });
    expect(w, `${x},${y}`).toEqual({ map: 'highcharity', walk: true });
  }
});

test('a save inside a moved building exits through its mat to the new door, in its new chunk', async ({ page }) => {
  const rooms = await (async () => { await boot(page); return page.evaluate(() => Object.entries(PP_HC_V2.matMoves).map(([rid, mv]) => ({ rid, ...mv }))); })();
  expect(rooms.length).toBe(13);
  // every mat points at a door with the same id on its new tile
  const bad = await page.evaluate(list => list.filter(mv => {
    const r = WORLD[mv.rid], mat = r && r.objs.find(o => o.id === mv.mat);
    if (!mat) return mv.rid !== 'hc_mall_2';   // the mall's upper floor has no mat
    const door = WORLD[mv.to].objs.find(o => o.kind === 'door' && o.id === r.door);
    return !(door && door.x === mat.tx && door.y === mat.ty && r.outdoor === mv.to);
  }).map(mv => mv.rid), rooms);
  expect(bad).toEqual([]);
  for (const [rid, to, x, y] of [['hc_bank_in', 'hc_exchange', 8, 13], ['hc_command_in', 'hc_civic', 7, 26]]) {
    await boot(page, save({ world: { map: rid, x: 4, y: 5, facing: 'down' } }));
    await page.evaluate(() => PixelPets.walkStep('down'));
    await settle(page);
    await expect.poll(() => where(page), rid).toEqual({ map: to, x, y });
  }
});

test('the grand Lantern House: twelve beds that rest, Ines and the 5-Acorn note, and every chunk respawns on 8,19', async ({ page }) => {
  test.setTimeout(60000);
  const s = save({ world: { map: 'hc_lantern_in', x: 2, y: 16, facing: 'up' } });
  s.party[0].hpNow = 3;
  await boot(page, s);
  const r = await page.evaluate(() => {
    const m = WORLD.hc_lantern_in, beds = m.objs.filter(o => o.sprite === 'rest_bed');
    return { beds: beds.length, rest: beds.every(b => b.lines && b.lines.else === '@lantern_rest'), spot: m.respawnSpot,
      ines: m.objs.filter(o => o.id === 'hc_lantern_host').map(o => [o.x, o.y]), note: m.objs.some(o => o.id === 'hc_lantern_note' && /5 Acorns/.test(o.text)),
      respawn: ['highcharity', 'hc_civic', 'hc_exchange', 'hc_waterfront', 'hc_college'].map(id => WORLD[id].respawnIn),
      sign: WORLD.highcharity.objs.some(o => o.id === 'hc_lantern_sign' && o.sprite === 'heal_lantern') };
  });
  expect(r.beds).toBe(12);
  expect(r.rest).toBe(true);
  expect(r.spot).toEqual({ x: 8, y: 19, facing: 'up' });
  expect(r.ines).toEqual([[7, 16]]);
  expect(r.note).toBe(true);
  expect(r.sign).toBe(true);   // rule 10: the healing mark stays beside the door
  for (const sp of r.respawn) expect(sp).toEqual({ map: 'hc_lantern_in', x: 8, y: 19, facing: 'up' });
  // rest from a bed in the second column (the far one from the door)
  expect(await page.evaluate(() => PixelPets.talkTo('hc2_bed_l'))).toBe(true);
  for (let i = 0; i < 400; i++) {
    const st = await page.evaluate(() => ({ s: PixelPets.scene && { mode: PixelPets.scene.mode, full: PixelPets.scene.full, waiting: PixelPets.scene.waiting }, ready: PixelPets.optionsReady }));
    if (!st.s) break;
    if (st.s.mode === 'choice' && st.s.full && st.ready) {
      const btns = await page.locator('#sbChoices button:visible').allTextContents();
      if (btns.length) await page.locator('#sbChoices button', { hasText: /^Rest/ }).first().click();
    } else if (st.s.mode === 'say' && st.s.full && st.s.waiting) await page.keyboard.press('Space');
    await page.waitForTimeout(30);
  }
  await expect.poll(() => page.evaluate(() => PixelPets.state.party[0].hpNow)).toBeUndefined();
});

// D1426, D1439 (layout v0.4 §5.3): the Governor's House floor 1 and Governor Merriden open on the Keepers path from Act 2;
// the President's rooms keep Act 5 and the Governor met. Before Act 2 the door says "By appointment." on both paths.
test('§5.3 gates: the Governor\'s House opens on the Keepers path in Act 2, the President\'s rooms in Act 5; Block News House is open to both', async ({ page }) => {
  test.setTimeout(120000);
  const cases = [
    { side: 'keepers', govMet: false, lobby: false, top: false },
    { side: 'keepers', act: 1, govMet: false, lobby: false, top: false },
    { side: 'glimmer', govMet: false, lobby: false, top: false },
    { side: 'glimmer', act: 2, govMet: false, lobby: false, top: false },
    { side: 'glimmer', act: 5, govMet: true, lobby: false, top: false },
    { side: 'keepers', act: 2, govMet: false, lobby: false, top: false },   // D1473: Act 2 alone is not enough
    { side: 'glimmer', act: 2, govMet: false, posted: true, lobby: false, top: false },
    { side: 'keepers', act: 2, govMet: false, posted: true, lobby: true, top: false },
    { side: 'keepers', act: 2, govMet: true, posted: true, lobby: true, top: false },
    { side: 'keepers', act: 5, govMet: false, posted: true, lobby: true, top: false },
    { side: 'keepers', act: 5, govMet: true, posted: true, lobby: true, top: true },
  ];
  for (const c of cases) {
    await boot(page, save(c));
    const tag = JSON.stringify(c);
    // Governor Merriden stands at his desk from Act 2 on (checked in the room itself, whatever the door says)
    await page.evaluate(() => PixelPets.goto('hc_gov_1', 7, 14, 'up'));
    await settle(page);
    expect(await page.evaluate(() => !!(PixelPets.objPos('hc_governor') || {}).present), tag).toBe((c.act || 0) >= 2);
    await page.evaluate(() => PixelPets.goto('hc_civic', 32, 16, 'up'));
    await settle(page);
    await page.evaluate(() => PixelPets.walkStep('up'));
    await settle(page);
    if (c.lobby) await expect.poll(() => where(page), tag).toMatchObject({ map: 'hc_gov_1' });
    else {
      await expect(page.locator('#sbText'), tag).toContainText('By appointment.');
      await endScene(page);
      expect((await where(page)).map, tag).toBe('hc_civic');
    }
    // the stair to floor 3 (a warp with a need: solid until it holds)
    const up = await page.evaluate(() => { PixelPets.goto('hc_gov_1', 2, 2, 'left'); return PixelPets.walkStep('left'); });
    await settle(page);
    const at = await where(page);
    expect(at.map === 'hc_gov_3', tag).toBe(c.top);
    // Block News House: open on both paths
    await page.evaluate(() => PixelPets.goto('hc_exchange', 52, 13, 'up'));
    await settle(page);
    await page.evaluate(() => PixelPets.walkStep('up'));
    await settle(page);
    await expect.poll(() => where(page), tag).toMatchObject({ map: 'hc_news_1' });
  }
});

test('the Muster Hall stands chained north of the Dojo with two duty Keepers; the hooks play once and set their flags', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    const m = WORLD.highcharity, by = id => m.objs.find(o => o.id === id);
    return { trial: by('hc_trial') && [by('hc_trial').x, by('hc_trial').y, by('hc_trial').need, by('hc_trial').to || null],
      gym: [by('hc_gym').x, by('hc_gym').y], duty: ['hc_duty_w', 'hc_duty_e'].map(id => by(id) && [by(id).x, by(id).y]),
      board: by('hc_kindness') && [by('hc_kindness').x, by('hc_kindness').y], finial: m.objs.some(o => o.id === 'hc2_finial_trial') };
  });
  expect(r.trial).toEqual([10, 29, 'story.hc_trial_called', null]);
  expect(r.gym).toEqual([10, 37]);
  expect(r.duty).toEqual([[8, 29], [12, 29]]);
  expect(r.board).toEqual([21, 26]);
  expect(r.finial).toBe(false);   // the one dark roof
  await page.evaluate(() => PixelPets.goto('highcharity', 10, 29, 'up'));
  await settle(page);
  await page.evaluate(() => PixelPets.walkStep('up'));
  await expect(page.locator('#sbText')).toContainText('Chained. The lantern hook is empty.');
  await endScene(page);
  expect((await where(page)).map).toBe('highcharity');
  // §5.2 keyed deny: with seven Seals held (seals>=7, D1329) the door points to the duty Keeper; the call itself is phase 2
  await page.evaluate(() => { const S = PixelPets.state; S.seals = S.seals || {};
    for (const id of ['seal_fernbrook', 'seal_cobblecrest', 'seal_brinewick', 'seal_t4', 'seal_t5', 'seal_t6', 'seal_t7']) S.seals[id] = true; });
  expect(await page.evaluate(() => PixelPets.sealsHeld())).toBeGreaterThanOrEqual(7);
  await page.evaluate(() => PixelPets.goto('highcharity', 10, 29, 'up'));
  await settle(page);
  await page.evaluate(() => PixelPets.walkStep('up'));
  await expect(page.locator('#sbText')).toContainText('Chained. Ask the duty Keeper.');
  await endScene(page);
  expect((await where(page)).map).toBe('highcharity');
  // HB3: the Kindness Board sets story.hc_board on first read
  await page.evaluate(() => PixelPets.talkTo('hc_kindness'));
  await endScene(page);
  expect(await page.evaluate(() => !!PixelPets.state.flags['story.hc_board'])).toBe(true);
});

test('the preview never writes the save: localStorage is untouched after walking through two chunks', async ({ page }) => {
  await boot(page);
  const before = await page.evaluate(() => localStorage.getItem('pixelpets.save.v2'));
  await page.evaluate(() => { PixelPets.goto('hc_civic', 32, 19, 'up'); });
  await settle(page);
  await page.evaluate(() => { PixelPets.walkStep('down'); PixelPets.goto('hc_exchange', 52, 16, 'up'); });
  await settle(page);
  const after = await page.evaluate(() => localStorage.getItem('pixelpets.save.v2'));
  expect(after).toBe(before);
  expect(JSON.parse(after).v).toBe(2);
});

// The preview holds the cloud save too, not just localStorage: a signed-in debug tester on the Act 5 checkpoint must not
// upload it (a second device would then adopt it). The real cloud.js runs against a stubbed SDK; nothing signs in.
test('the preview never reaches the cloud save: the state hook gives null and no upload fires, even at Act 5', async ({ page }) => {
  test.setTimeout(60000);
  await stubCloudSdk(page);
  await boot(page, save(), '?debug=1&hccity=2&cloud=block');
  await page.waitForFunction(() => PPCloud.enabled && PPCloud.info().fbUid === 'preview-uid' && !!window.__ppCloudHooks, null, { timeout: 25000 });
  const r = await page.evaluate(() => PixelPets.checkpoint('hc2_pres'));
  expect(r.ok).toBe(true);
  await settle(page);
  expect(await page.evaluate(() => [PixelPets.state.flags['story.act'], PixelPets.state.flags['story.hc_gov_met']])).toEqual([5, true]);
  await page.evaluate(() => PPCloud.syncNow());
  await page.evaluate(() => PPCloud.syncNow());
  await page.waitForTimeout(600);
  const out = await page.evaluate(() => ({ state: window.__ppCloudHooks.getState(), uploads: window.__ppUploads || [], inflight: PPCloud.info().inflight }));
  expect(out.state, 'getState gives null while the city preview is open').toBeNull();
  expect(out.uploads, 'no upload during the city preview').toEqual([]);
  expect(out.inflight).toBe(false);
});

test('D1426, D1439: Governor Merriden is Act 2 and civil (cast faction none); the President stays Act 5 and a Keeper', async () => {
  const gov1 = DATA.rooms.hc_gov_1.objs, gov3 = DATA.rooms.hc_gov_3.objs;
  const door = DATA.maps.hc_civic.objs.find(o => o.id === 'hc_gov');
  expect(door.need).toBe('!story.side=glimmer & story.act>=2 & story.gov_posted');   // GOVERNOR_MEETING D1473
  expect(door.deny).toBe('By appointment.');
  const gov = gov1.find(o => o.id === 'hc_governor');
  expect(gov.when).toEqual(['story.act>=2']);
  expect(gov.lines.else).toContain('Act 2');
  expect(gov.lines['story.gov_posted & !story.hc_gov_met']).toBe('@hc_gov_meet');   // GOVERNOR_MEETING §5
  expect(gov.lines.else).not.toContain('Act 5');
  expect(gov1.find(o => o.id === 'hc_gov_up').need).toBe('!story.side=glimmer & story.act>=5 & story.hc_gov_met');
  expect(gov1.find(o => o.id === 'hc_chute_mouth')).toBeTruthy();   // HB12 sits on floor 1, behind the Act 2 door
  expect(gov3.find(o => o.id === 'hc_president')).toBeTruthy();
  const cast = Object.fromEntries(DATA.cast.map(e => [e.name, e]));
  expect(cast['Governor Merriden'].faction).toBe('none');
  expect(cast['Governor Merriden'].rankFlag).toBeUndefined();
  expect(cast['The President'].faction).toBe('keepers');
});

test('player text: wire set, The President, Block News; no banned words; lines fit', async () => {
  const text = [];
  const walk = v => { if (typeof v === 'string') text.push(v); else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') Object.values(v).forEach(walk); };
  for (const m of Object.values(DATA.maps).concat(Object.values(DATA.rooms))) for (const o of m.objs) walk([o.text, o.lines, o.deny, o.name]);
  walk(DATA.scenes);
  const all = text.join('\n');
  expect(all).not.toMatch(/\b(faint(ed)?|evolv\w*|coins?|appeared|trainer|tv|bellgold)\b|go, [a-z]+!|\w+dex\b|blocknews/i);
  expect(all).toMatch(/BLOCK NEWS HOUSE/);
  expect(all).not.toMatch(/President [A-Z]/);   // never named
  for (const t of text) expect(t.length, t).toBeLessThanOrEqual(110);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('tanks, the lantern wall and the wire printers hold frame 0; patrols snap; zero console errors', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await boot(page);
    await page.evaluate(() => PixelPets.goto('highcharity', 32, 37, 'up'));
    await settle(page);
    const r = await page.evaluate(() => ({ reduce: matchMedia('(prefers-reduced-motion: reduce)').matches, check: PixelPets.charityCheck() }));
    expect(r.reduce).toBe(true);
    expect(r.check).toEqual([]);
    await page.waitForTimeout(800);   // a few frames over the animated props
  });
});

// §13 test 7 (perf, @slow, 390 only): walk each chunk's main boulevard with the CPU throttled 4x (a mid phone) and time
// every animation frame. There is no in-game frame meter, so this reads requestAnimationFrame gaps. Measured Tue Nov 3 in
// headless Chromium: unthrottled every chunk holds 17 ms; at 4x the chunks' p95 is 33 ms, the same as today's High Charity
// (p95 33) and better than today's Hearthmoor (p95 67). The gate is p95 <= 50 ms (three frames) so it catches a real
// regression without failing on emulation noise; the spec's 33 ms bar is for a real mid phone (QA, iPhone script).
test('@slow perf: walking every boulevard at 4x CPU throttle keeps p95 frames within three frames', async ({ page }, info) => {
  test.skip(info.project.name !== '390', '390 only');
  test.setTimeout(120000);
  await boot(page);
  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const runs = [['highcharity', 4, 20, 'right'], ['hc_civic', 4, 28, 'right'], ['hc_exchange', 4, 20, 'right'], ['hc_waterfront', 21, 4, 'down'], ['hc_college', 23, 4, 'down']];
  const out = [];
  for (const [map, x, y, dir] of runs) {
    await page.evaluate(([m, x, y, f]) => PixelPets.goto(m, x, y, f), [map, x, y, dir]);
    await settle(page);
    const gaps = await page.evaluate(async d => {
      const gaps = []; let last = performance.now(), stop = false;
      const tick = t => { gaps.push(t - last); last = t; if (!stop) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
      for (let i = 0; i < 24; i++) { PixelPets.walkStep(d); await new Promise(r => setTimeout(r, 180)); }
      stop = true;
      return gaps.slice(3);
    }, dir);
    gaps.sort((a, b) => a - b);
    out.push({ map, frames: gaps.length, p95: Math.round(gaps[Math.floor(gaps.length * 0.95)]), max: Math.round(gaps[gaps.length - 1]) });
  }
  await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  console.log('PP_HC_PERF ' + JSON.stringify(out));
  for (const r of out) expect(r.p95, JSON.stringify(r)).toBeLessThanOrEqual(50);
});
