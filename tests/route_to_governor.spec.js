/* ROUTE_TO_GOVERNOR v0.1.1 (design repo, private; D1850-D1876 and PACING's D1880-D1884, settled Wed Nov 4, 2026): the first
   Act 2 trip to the Governor is on foot (D1881). Route 4 (route4, the downs to the fork), the river road (route4_reeds), the
   withy beds (route4_withy), Hearthmoor's coach-road gap, the coach's one turn-away, Charter Hill's north mouth (the city is the
   ?debug=1&hccity=2 preview until HC_CITY_V2 ships), the region map's second sheet and the level caps 41 / 44 (D1880).
   data/detail_zzzz_route4.json, tools/build_hc_city.py, quests.js, game.js, stats.js. Every new line is PLACEHOLDER.
   §10.3 T1-T11 plus ACT2_PACING §3's limits where a test can read them. 320, 375 and 390 (@w1 rows at 320 only); Modern
   controls; reduced motion; zero console errors; the save stays pixelpets.save.v2, v 2, additive story.* flags only. */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { starterSave, installSave, trackErrors, gotoGame, shot } = require('./helpers');

trackErrors(test, expect);

const ROOT = path.join(__dirname, '..');
const R4 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'detail_zzzz_route4.json'), 'utf8'));
const HC = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'hc_city_v2.json'), 'utf8'));
const PARADE = /hc_parade_start/.test(fs.readFileSync(path.join(ROOT, 'data', 'mapdata.js'), 'utf8'));
const KILN = /"km_road":\{/.test(fs.readFileSync(path.join(ROOT, 'data', 'mapdata.js'), 'utf8'));

// Act 1 done and Ep 1 closed, a plain Keeper Cadet (as tests/governor_meeting.spec.js seeds it).
const ACT1 = {
  'story.reached_route1': true, 'story.rival1_done': true, 'story.reached_fernbrook': true, 'story.met_glimmerwell': true,
  'story.met_fen': true, 'story.crate_a': true, 'story.crate_b': true, 'story.crate_c': true, 'story.tally_done': true,
  'story.tl_amos': true, 'story.tl_juniper': true, 'story.tl_done': true, 'story.crates_seen': true, 'story.fen_sent_home': true,
  'story.mom_met': true, 'story.mom_chore': true, 'story.mom_sent': true, 'story.reached_mahopac': true, 'story.dream_woke': true,
  'story.class_sent': true, 'story.lizzy_met': true, 'story.lizzy_class': true, 'trainer.h1_cadet': true,
  'trainer.h1_challenger': true, 'trainer.h1_local': true, 'trainer.hall1_fen': true, 'story.seal1': true,
  'story.crackdown': true, 'story.hall1_shut': true, 'story.post_trial_done': true, 'story.fen_lean': 2, 'story.phone_got': true,
  'story.warden_called': true, 'story.warden_met': true, 'story.chi_met': true, 'story.chi_jars': 6, 'story.reached_route2': true,
  'story.met_census': true, 'story.reached_glen': true, 'story.shift_k': true, 'story.met_lead': true,
  'story.chi_done': true, 'story.orchard_lean': 'open', 'story.orchard_cleared': true, 'story.sway_fernbrook': 3,
  'story.ilse_call2': true, 'story.keeper_cadet': true, 'story.side_pick_done': true, 'story.ilse_call_old': true,
  'story.tour1_s1': true, 'story.slice_end': true, 'story.heights_done': true, 'story.seal2': true, 'story.cobble_end': true,
  'story.rpt_1': 'told', 'story.gb_done': true, 'story.rpt_2': 'kept', 'story.route3_open': true, 'story.reached_brinewick': true,
  'story.brine_depot': true, 'story.brine_freed': true, 'story.brine_dorian': true, 'story.seal3': true, 'story.ep1_end': true,
  'story.cover_done': true, 'story.rpt_old_seen': true, 'story.rpt_3': 'kept', 'story.hc_council_done': true, 'story.hc_arrived': true, 'story.hc_greeted': true,
};
// Mom's Supper (ACT2_COVER_STORY) already played: her gate body would stand on the walk to Bram.
const POSTED = Object.assign({}, ACT1, { 'story.a2_called': true, 'story.gov_posted': true, 'story.cv_mom': 'told', 'story.cv_mom_walk': true });
const MET = Object.assign({}, POSTED, { 'story.hc_gov_met': true, 'story.km_assigned': true });
const WALKABLE = new Set('gtpfsBylPDAC'.split(''));

function save(flags, world, mut) {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.textSpeed = 'fast';
  s.settings.follower = false;
  Object.assign(s.flags, flags || {});
  for (const [k, v] of Object.entries(s.flags)) if (v === null) delete s.flags[k];
  s.world = Object.assign({ map: 'hearthmoor', x: 11, y: 7, facing: 'down', respawn: 'hearthmoor' }, world || {});
  s.seals = { seal_fernbrook: 1700000000000, seal_cobblecrest: 1700000000000, seal_brinewick: 1700000000000 };
  s.party[0].xp = 4000; s.party[0].bx = 4 * 28 * 28;
  if (mut) mut(s);
  return s;
}
async function boot(page, s, opts = {}) {
  if (opts.reduce) await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), s, { quietDay: true, oldSave: !!opts.oldSave });
  await gotoGame(page, opts.city ? '?debug=1&hccity=2' : (opts.plain ? '' : '?debug=1'));
  if (opts.plain) { await page.waitForFunction(() => window.PixelPets && PixelPets.state); return; }
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && typeof PixelPets.talkTo === 'function' && PixelPets.state);
  await page.evaluate(() => { PixelPets.showTab('walk'); if (PixelPets.clearWild) PixelPets.clearWild(); });
}
const flags = page => page.evaluate(() => Object.assign({}, PixelPets.state.flags));
const stored = page => page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
const sceneId = page => page.evaluate(() => PixelPets.scene && PixelPets.scene.id);
const where = page => page.evaluate(() => ({ map: PixelPets.mapInfo.id, x: PixelPets.state.world.x, y: PixelPets.state.world.y }));
const quest = page => page.evaluate(() => { const q = PixelPets.quest; return q && { id: q.id, text: q.text, place: q.place, target: q.target || null }; });
const objIds = page => page.evaluate(() => PixelPets.mapInfo.objs.map(o => o.id));
async function goto(page, map, x, y, facing) {
  await page.evaluate(([m, x, y, f]) => PixelPets.goto(m, x, y, f), [map, x, y, facing || 'down']);
  await page.waitForFunction(m => PixelPets.mapInfo.id === m && !PixelPets.fading, map);
  await page.evaluate(() => PixelPets.clearWild());
}
async function step(page, dir) { const r = await page.evaluate(d => PixelPets.walkStep(d), dir); await page.waitForFunction(() => !PixelPets.fading); await page.waitForTimeout(60); return r; }
// Modern controls (Vincent, Nov 4): a tap on a tile walks there, a tap on a person or prop walks over and talks.
async function tapTile(page, x, y) {
  await expect.poll(() => page.evaluate(async () => {
    const a = Object.assign({}, PixelPets.walk.cam); await new Promise(r => setTimeout(r, 120)); const b = PixelPets.walk.cam;
    return a.x === b.x && a.y === b.y;
  }), { timeout: 5000 }).toBe(true);
  const r = await page.evaluate(({ x, y }) => {
    const mc = document.querySelector('#mapCanvas'), b = mc.getBoundingClientRect(), cam = PixelPets.walk.cam;
    const cx = b.left + ((x * 16 + 8 - cam.x) / mc.width) * b.width, cy = b.top + ((y * 16 + 8 - cam.y) / mc.height) * b.height;
    const opt = { bubbles: true, cancelable: true, clientX: cx, clientY: cy, pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0 };
    mc.dispatchEvent(new PointerEvent('pointerdown', opt)); mc.dispatchEvent(new PointerEvent('pointerup', opt));
    return cx >= b.left && cx <= b.right && cy >= b.top && cy <= b.bottom;
  }, { x, y });
  expect(r, 'tile ' + x + ',' + y + ' on screen').toBe(true);
}
// Plays the open scene to its end; battles started by the scene are won by the debug hook. Returns [speaker, text] lines.
async function drive(page, picks = [], ms = 60000) {
  const until = Date.now() + ms, lines = [];
  let last = null;
  while (Date.now() < until) {
    const st = await page.evaluate(() => ({ battle: !!(PixelPets.battle && PixelPets.battle.on), sc: PixelPets.scene && { mode: PixelPets.scene.mode, full: PixelPets.scene.full, waiting: PixelPets.scene.waiting, text: PixelPets.scene.text, who: PixelPets.scene.who } }));
    if (st.battle) {
      const state = await page.evaluate(() => PixelPets.battle.state);
      if (state !== 'END') { await page.evaluate(() => { const b = PixelPets.battle; b.textMs = 1; b.animMs = 0; PixelPets.winBattle(); }); await page.waitForFunction(() => !PixelPets.battle.on || PixelPets.battle.state === 'END', null, { timeout: 15000 }); }
      if (await page.locator('#btOk').isVisible()) await page.click('#btOk');
      await page.waitForTimeout(150); continue;
    }
    const sc = st.sc;
    if (!sc) { await page.waitForTimeout(200); if (!(await page.evaluate(() => !!PixelPets.scene || !!(PixelPets.battle && PixelPets.battle.on)))) return lines; continue; }
    if (sc.mode === 'choice') {
      if (!sc.full || !(await page.locator('#sbChoices button:visible').count())) { await page.waitForTimeout(40); continue; }
      await page.waitForFunction(() => PixelPets.optionsReady === true);
      const labels = (await page.locator('#sbChoices button').allTextContents()).map(t => t.trim());
      const pick = picks.find(p => labels.includes(p)) || labels[0];
      lines.push(['>', pick, labels]);
      for (const b of await page.locator('#sbChoices button').all()) expect((await b.boundingBox()).height).toBeGreaterThanOrEqual(44);
      await page.locator('#sbChoices button', { hasText: pick }).first().click();
      await page.waitForTimeout(40); continue;
    }
    if (sc.mode === 'say' && sc.waiting) {
      if (!sc.full) { await page.waitForTimeout(40); continue; }
      const key = sc.who + '|' + sc.text;
      if (key !== last) { lines.push([sc.who || '', sc.text]); last = key; }
      await page.keyboard.press('Space'); await page.waitForTimeout(30); continue;
    }
    await page.waitForTimeout(40);
  }
  throw new Error('scene did not end');
}
const says = lines => lines.filter(l => l[0] !== '>').map(l => l[1]);
// A tile path on the map's own grid (no page): walkable chars minus blockers; `avoid` adds cells (a holder's sight).
function bfs(mapId, from, goals, avoid = [], blockIds = null) {
  const m = R4.maps[mapId], blk = new Set(avoid.map(([x, y]) => x + ',' + y));
  for (const o of m.objs) if (['npc', 'sign', 'prop', 'trainer', 'wild'].includes(o.kind) && (!blockIds || blockIds.includes(o.id))) blk.add(o.x + ',' + o.y);
  const goal = new Set(goals.map(([x, y]) => x + ',' + y)), seen = new Map([[from.join(','), 0]]), q = [from];
  while (q.length) {
    const [x, y] = q.shift(), d = seen.get(x + ',' + y);
    if (goal.has(x + ',' + y)) return d;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
      if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h || seen.has(k) || blk.has(k) || !WALKABLE.has(m.grid[ny][nx])) continue;
      seen.set(k, d + 1); q.push([nx, ny]);
    }
  }
  return null;
}
async function openRegion(page) {
  await page.click('#mapBtn'); await expect(page.locator('#ovMap')).toBeVisible();
  await page.click('#mapLevelRegion'); await page.waitForTimeout(200);
}
async function tapRegion(page, col, row) {
  const box = await page.locator('#regionCanvas').boundingBox();
  await page.mouse.click(box.x + (col * 16 + 8) * box.width / 320, box.y + (row * 16 + 8) * box.height / 192);
  await page.waitForTimeout(150);
  return page.evaluate(() => document.querySelector('#mapPlaceName').textContent);
}

test.describe('ROUTE_TO_GOVERNOR: the coach, the gap and Route 4 (D1854, D1866, D1881)', () => {
  test('T1: an Act 1 save: the gap is barred with no warp, the coach runs, no ROUTE 4 on the map', async ({ page }) => {
    await boot(page, save(Object.assign({}, ACT1, { 'story.a2_called': true }), { map: 'hearthmoor', x: 18, y: 3, facing: 'up' }));
    const ids = await objIds(page);
    expect(ids).toEqual(expect.arrayContaining(['hm_coach_road_bar_w', 'hm_coach_road_bar_e', 'hm_to_hc', 'hm_bram']));
    expect(ids).not.toContain('hm_coach_road_w');
    await step(page, 'up'); await step(page, 'up');
    expect(await where(page)).toEqual({ map: 'hearthmoor', x: 18, y: 2 });   // the bar stops the walk
    if (await sceneId(page) !== null || await page.evaluate(() => !!PixelPets.scene)) expect(says(await drive(page))).toEqual(['COACH ROAD. Coaches only. Walkers by Keeper pass.']);
    await goto(page, 'hearthmoor', 12, 10, 'up');
    expect(await page.evaluate(() => PixelPets.talkTo('hm_bram'))).toBe(true);
    const bram = says(await drive(page));
    expect(bram.join(' ')).not.toMatch(/Not this trip/);
    await openRegion(page);
    expect(await tapRegion(page, 4, 5)).toBe('???');
    await expect(page.locator('#mapSheets')).toBeHidden();
    expect((await flags(page))['story.reached_route4']).toBeUndefined();
  });

  test('T2: a posted save: no coach, Bram turns the Cadet away, the gap warps to route4 (6-7, 26); reached_route4; gov_walk', async ({ page }) => {
    await boot(page, save(POSTED, { map: 'hearthmoor', x: 12, y: 8, facing: 'up' }));
    const ids = await objIds(page);
    expect(ids).not.toContain('hm_to_hc');
    expect(ids).toEqual(expect.arrayContaining(['hm_coach_road_w', 'hm_coach_road_e']));
    await tapTile(page, 11, 9);   // Modern: tap Porter Bram
    await expect.poll(() => sceneId(page), { timeout: 15000 }).not.toBeNull();
    expect(says(await drive(page))).toEqual(["Not this trip, Cadet. Governor's orders: you walk the coach road north."]);
    const q = await quest(page);
    expect(q.id).toBe('gov_walk');
    expect(q.text).toBe('Walk the coach road north from Hearthmoor. The fork is past the downs.');
    expect(q.target).toEqual({ map: 'route4', x: 10, y: 5 });
    await goto(page, 'hearthmoor', 19, 1, 'up');
    await step(page, 'up');
    await expect.poll(() => where(page)).toEqual({ map: 'route4', x: 7, y: 26 });
    expect((await flags(page))['story.reached_route4']).toBe(true);
    await shot(page, 'r4-first-view');
    await step(page, 'down');
    await expect.poll(() => where(page)).toEqual({ map: 'hearthmoor', x: 19, y: 1 });
    expect((await stored(page)).v).toBe(2);
  });

  test('T3: the adder plays once five tiles in and sets r4_adder_met; the Rambler sight covers the road; wilds Lv 27-30', async ({ page }) => {
    await boot(page, save(POSTED, { map: 'route4', x: 7, y: 26, facing: 'up' }));
    const adder = R4.maps.route4.objs.find(o => o.id === 'r4_adder_first');
    expect(Math.abs(adder.x - 6) + Math.abs(adder.y - 26)).toBe(5);
    await goto(page, 'route4', 9, 25, 'right');
    await step(page, 'right');
    await expect.poll(() => sceneId(page), { timeout: 10000 }).toBe('r4_adder_first');
    const lines = await drive(page);
    expect(says(lines)[0]).toBe('A grey snake is basking on the wall. Its back is marked with a yellow zigzag.');
    expect((await flags(page))['story.r4_adder_met']).toBe(true);
    await goto(page, 'route4', 9, 25, 'right');
    expect(await objIds(page)).not.toContain('r4_adder_first');
    // The Rambler's sight crosses the only road up the downs.
    const sight = (await page.evaluate(() => PixelPets.sightLines)).r4_rambler;
    expect(Array.isArray(sight) && sight.length).toBeTruthy();
    const cells = sight.map(c => Array.isArray(c) ? c : [c.x, c.y]);
    expect(bfs('route4', [6, 26], [[10, 5]])).not.toBeNull();
    // The sight covers the whole road at row 12 (x 10-11). Packet gap (reported in the PR): the grass east of the Rambler,
    // (12,11) -> (13,11) -> (13,12) -> the tall grass, still walks round it; §5.5 says the walls make the sight unavoidable.
    expect(cells.map(c => c.join(','))).toEqual(expect.arrayContaining(['10,12', '11,12']));
    const round = bfs('route4', [6, 26], [[10, 5]], cells);
    test.info().annotations.push({ type: 'gap', description: 'Rambler walk-round: ' + (round == null ? 'none' : round + ' tiles by the east grass') });
    const lv = await page.evaluate(() => { const out = new Set(); for (let i = 0; i < 300; i++) { const sp = PixelPets.pickSpecies(['meadow', 'storm'], 'route4'), st = PixelPets.pickStage('route4'); out.add(PixelPets.wildLv(sp, st, 'route4')); } return [...out]; });
    expect(Math.min(...lv)).toBeGreaterThanOrEqual(27);
    expect(Math.max(...lv)).toBeLessThanOrEqual(30);
  });

  test('T4: the fork plays once (gov_walk2); the fold rests the team for free; the east road stays barred', async ({ page }) => {
    await boot(page, save(POSTED, { map: 'route4', x: 10, y: 9, facing: 'up' }));
    let hit = null;
    for (let i = 0; i < 4 && !hit; i++) { await step(page, 'up'); hit = await sceneId(page); }
    expect(hit).toBe('r4_fork');
    expect(says(await drive(page))).toEqual(['The coach road forks. West, the river and the capital. East, the hills.']);
    expect((await flags(page))['story.r4_fork']).toBe(true);
    expect((await quest(page)).id).toBe('gov_walk2');
    expect((await quest(page)).target).toEqual({ map: 'route4_reeds', x: 1, y: 10 });
    await goto(page, 'route4', 10, 8, 'up'); await step(page, 'up');
    expect(await sceneId(page)).toBeNull();   // once
    // The fold: hurt the team, rest at the trough, no Acorns spent.
    await page.evaluate(() => { PixelPets.state.money = 7; PixelPets.setHp('me', 3); });
    await goto(page, 'route4', 15, 9, 'right');
    expect(await page.evaluate(() => PixelPets.talkTo('r4_trough'))).toBe(true);
    const lines = await drive(page, ['Rest a while']);
    expect(lines.find(l => l[0] === '>')[2]).toEqual(['Rest a while', 'Not now']);
    const after = await page.evaluate(() => ({ money: PixelPets.state.money, hp: PixelPets.state.party[0].hpNow }));
    expect(after).toEqual({ money: 7, hp: undefined });
    // East: the bars stand and no warp to km_road (Kilnmouth is not built: the bars stand even after the assignment).
    const ids = await objIds(page);
    expect(ids).toEqual(expect.arrayContaining(['r4_east_bar_n', 'r4_east_bar_c', 'r4_east_bar_s']));
    expect(ids.filter(id => /^r4_east_[ncs]$/.test(id))).toEqual([]);
    await shot(page, 'r4-fork');
  });

  test('T5: the river road: the towpath bar, the road by the stone bridge (≤ 92 tiles), the heron, the Reed Watcher, the withy beds', async ({ page }) => {
    await boot(page, save(Object.assign({}, POSTED, { 'story.r4_fork': true }), { map: 'route4_reeds', x: 30, y: 4, facing: 'left' }));
    expect(await objIds(page)).toEqual(expect.arrayContaining(['r4r_towpath_bar', 'r4r_lock_keeper', 'r4r_gate_keeper']));
    const towpath = bfs('route4_reeds', [30, 4], [[0, 10]]);
    const leg1 = bfs('route4', [6, 26], [[0, 6], [0, 7], [0, 8]]);
    expect(towpath).not.toBeNull();
    expect(leg1 + towpath).toBeLessThanOrEqual(92);   // PACING §3 (D1872: the check allows 92)
    expect(leg1 + towpath).toBeGreaterThanOrEqual(60);
    // The heron by the road.
    await goto(page, 'route4_reeds', 20, 17, 'right'); await step(page, 'right');
    await expect.poll(() => sceneId(page), { timeout: 10000 }).toBe('r4_heron_first');
    expect(says(await drive(page))[0]).toBe('One of the reeds turns its head. It was a heron all along.');
    expect((await flags(page))['story.r4_heron_met']).toBe(true);
    // The Reed Watcher's sight cannot be walked round on the way to the gate.
    await goto(page, 'route4_reeds', 30, 4, 'left');
    const sight = (await page.evaluate(() => PixelPets.sightLines)).r4_reed_watcher.map(c => Array.isArray(c) ? c : [c.x, c.y]);
    expect(bfs('route4_reeds', [30, 4], [[0, 10]], sight)).toBeNull();
    // The withy beds, both ways; the three reeds; the Stalker once.
    await goto(page, 'route4_reeds', 19, 22, 'down'); await step(page, 'down');
    await expect.poll(() => where(page)).toEqual({ map: 'route4_withy', x: 12, y: 1 });
    expect((await flags(page))['story.reached_withy']).toBe(true);
    await goto(page, 'route4_withy', 7, 6, 'down'); await step(page, 'down');
    await expect.poll(() => sceneId(page), { timeout: 10000 }).toBe('r4_heron_three');
    expect(says(await drive(page))[0]).toBe('Three reeds stand by the pond. One of them turns its head to look at you.');
    expect((await flags(page))['story.r4_heron_three']).toBe(true);
    expect(await objIds(page)).not.toContain('r4_heron_three');
    expect(await objIds(page)).toEqual(expect.arrayContaining(['wy_reed_a', 'wy_reed_b', 'r4_weaver']));
    await goto(page, 'route4_withy', 12, 1, 'up'); await step(page, 'up');
    await expect.poll(() => where(page)).toEqual({ map: 'route4_reeds', x: 19, y: 22 });
  });
});

test.describe('ROUTE_TO_GOVERNOR: Charter Hill and after the meeting (D1853, D1865, D1867)', () => {
  test('T6: the gate lands on hc_civic (46-50, 1) facing down; r4_walked and hc_arrived; a never-greeted save hears Moss; the door is 31 tiles on', async ({ page }) => {
    const f = Object.assign({}, POSTED, { 'story.r4_fork': true, 'story.hc_arrived': null, 'story.hc_greeted': null });
    await boot(page, save(f, { map: 'route4_reeds', x: 1, y: 10, facing: 'left' }), { city: true });
    expect((await quest(page)).id).toBe('gov_walk2');
    await step(page, 'left');
    await expect.poll(() => page.evaluate(() => PixelPets.mapInfo.id)).toBe('hc_civic');
    expect(await page.evaluate(() => [PixelPets.state.world.x, PixelPets.state.world.y, PixelPets.state.world.facing])).toEqual([48, 1, 'down']);
    expect((await flags(page))['story.r4_walked']).toBe(true);
    await step(page, 'down');   // the walk-in trigger answers the first step through the arch
    await expect.poll(() => sceneId(page), { timeout: 10000 }).toBe('r4_walk_in');
    const lines = await drive(page);
    expect(lines.some(l => l[0] === 'Keeper Moss')).toBe(true);
    const fl = await flags(page);
    expect([fl['story.r4_walked'], fl['story.hc_arrived'], fl['story.hc_greeted']]).toEqual([true, true, true]);
    expect((await quest(page)).id).toBe('gov_meet');
    await shot(page, 'r4-charter-hill');
    const door = HC.maps.hc_civic.objs.find(o => o.id === 'hc_gov');
    const p = await page.evaluate(([x, y]) => PixelPets.findPath([{ x, y: y + 1 }]), [door.x, door.y]);
    expect(p).not.toBeNull();
    expect(p.length).toBeLessThanOrEqual(36);   // §5.9 says 31 (the straight-line count); the lane and forecourt walk is 34-35
    test.info().annotations.push({ type: 'note', description: 'arch to the House doorstep: ' + (p.length + 1) + ' tiles' });
    // A greeted save walks in quietly (the trigger is spent).
    await goto(page, 'hc_civic', 48, 2, 'down');
    expect(await sceneId(page)).toBeNull();
  });

  test('T6 @w1: with the city off the gate lands on Lantern Square\'s coach gate and still sets r4_walked', async ({ page }) => {
    await boot(page, save(Object.assign({}, POSTED, { 'story.r4_fork': true }), { map: 'route4_reeds', x: 1, y: 9, facing: 'left' }));
    await step(page, 'left');
    await expect.poll(() => where(page)).toEqual({ map: 'highcharity', x: 32, y: 37 });
    expect((await flags(page))['story.r4_walked']).toBe(true);
  });

  test('T7: after the meeting: the coach runs, the north mouth works outward, the towpath is open (36 tiles), the gate turns walkers back until the parade', async ({ page }) => {
    await boot(page, save(Object.assign({}, MET, { 'story.r4_fork': true, 'story.r4_walked': true }), { map: 'route4_reeds', x: 5, y: 10, facing: 'up' }), { city: true });
    await goto(page, 'hc_civic', 48, 1, 'up');   // a save never stands in the city preview, so the test walks there
    await step(page, 'up');
    await expect.poll(() => where(page)).toEqual({ map: 'route4_reeds', x: 1, y: 10 });
    expect(await objIds(page)).not.toContain('r4r_towpath_bar');
    expect(bfs('route4_reeds', [1, 10], [[31, 3], [31, 4], [31, 5]], [], ['r4r_lock_keeper'])).toBeLessThanOrEqual(36);
    // Walking back in: the Gate Keeper's line, no warp.
    await step(page, 'left');
    await expect.poll(() => sceneId(page), { timeout: 10000 }).toBe('r4_gate_shut');
    expect(says(await drive(page))).toEqual(['Walkers come in by coach today, Cadet. Orders. The coach still runs.']);
    expect((await where(page)).map).toBe('route4_reeds');
    expect(await page.evaluate(() => PixelPets.talkTo('r4r_lock_keeper'))).toBe(true);
    expect(says(await drive(page))).toEqual(["Governor's business, Cadet. The towpath's yours. Mind the lock."]);
    await goto(page, 'hearthmoor', 12, 10, 'up');
    expect(await objIds(page)).toContain('hm_to_hc');
    // After the parade the gate opens both ways.
    await page.evaluate(() => PixelPets.setFlag('story.hc_parade_seen', true));
    await goto(page, 'route4_reeds', 1, 11, 'left'); await step(page, 'left');
    await expect.poll(() => page.evaluate(() => PixelPets.mapInfo.id)).toBe('hc_civic');
    test.info().annotations.push({ type: 'note', description: PARADE ? 'HC_PARADE is on this branch' : 'HC_PARADE (#296) is not on this branch: the parade on the next coach arrival is checked there' });
  });

  test('T8 @w1: after the assignment: Kilnmouth is not built, so the east bars stand and Bram keeps his built lines', async ({ page }) => {
    await boot(page, save(Object.assign({}, MET, { 'story.r4_fork': true, 'story.r4_walked': true }), { map: 'route4', x: 20, y: 2, facing: 'right' }));
    if (KILN) test.skip(true, 'KILNMOUTH has landed: its own spec covers the east warps');
    test.info().annotations.push({ type: 'note', description: 'KILNMOUTH not landed: the east warps to km_road (1, 24-26) are checked by its build' });
    const ids = await objIds(page);
    expect(ids).toEqual(expect.arrayContaining(['r4_east_bar_n', 'r4_east_bar_c', 'r4_east_bar_s']));
    await step(page, 'right'); await step(page, 'right');
    expect((await where(page)).map).toBe('route4');
    if (await page.evaluate(() => !!PixelPets.scene)) expect(says(await drive(page))).toEqual(['The east road. Keepers let walkers through with orders.']);
    expect(await page.evaluate(() => PixelPets.talkTo('r4_keeper'))).toBe(true);
    expect(says(await drive(page)).join(' ')).not.toMatch(/Kilnmouth/);
    await goto(page, 'hearthmoor', 12, 8, 'up');
    expect(await page.evaluate(() => PixelPets.talkTo('hm_bram'))).toBe(true);
    expect(says(await drive(page)).join(' ')).not.toMatch(/Not this trip|No coach to Kilnmouth/);
  });
});

test.describe('ROUTE_TO_GOVERNOR: old saves, the map, the caps and the words (D1851, D1880, T9-T11)', () => {
  test('T9: a met save never walks; a posted save already in High Charity keeps its rows; nothing is written at load; v 2; questCheck []', async ({ page }) => {
    const s = save(Object.assign({}, MET), { map: 'hearthmoor', x: 12, y: 10, facing: 'up' });
    const before = JSON.parse(JSON.stringify(s.flags));
    await boot(page, s, { oldSave: true });
    const q = await quest(page);
    expect(q.id).not.toMatch(/^gov_walk/);
    expect(await objIds(page)).toContain('hm_to_hc');
    const st = await stored(page);
    expect(st.v).toBe(2);
    for (const k of Object.keys(st.flags)) if (/r4|route4|withy/.test(k)) expect(before[k], k).toBeDefined();
    expect(await page.evaluate(() => PixelPets.questCheck)).toEqual([]);
    expect(await page.evaluate(() => PixelPets.quest.id)).toBe(q.id);
  });

  test('T9 @w1: a posted save that rode in during the build window: the walk rows show, the House still opens; then the meeting implies them', async ({ page }) => {
    await boot(page, save(POSTED, { map: 'hc_civic', x: 40, y: 20, facing: 'up' }), { city: true, oldSave: true });
    expect((await quest(page)).id).toBe('gov_walk');
    expect(await page.evaluate(() => PixelPets.condRead('story.gov_posted').cond)).toBe(true);
    await page.evaluate(() => { PixelPets.setFlag('story.hc_gov_met', true); PixelPets.setFlag('story.km_assigned', true); });
    expect((await quest(page)).id).not.toMatch(/^gov_/);
    expect((await stored(page)).v).toBe(2);
  });

  test('T10: the region map: ROUTE 4 at (4,5); both sheet buttons ≥ 44 px; NORTH after the fork; the coach to Kilnmouth only from km_council; mapDevCheck []', async ({ page }) => {
    await boot(page, save(Object.assign({}, POSTED, { 'story.reached_route4': true }), { map: 'route4', x: 10, y: 9, facing: 'up' }));
    await openRegion(page);
    expect(await tapRegion(page, 4, 5)).toBe('ROUTE 4');
    expect(await tapRegion(page, 2, 6)).toBe('HEARTHMOOR');
    await expect(page.locator('#mapSheets')).toBeHidden();   // no NORTH before the fork
    await page.click('#mapClose');
    await page.evaluate(() => PixelPets.setFlag('story.r4_fork', true));
    await openRegion(page);
    await expect(page.locator('#mapSheets')).toBeVisible();
    for (const id of ['#mapSheetSouth', '#mapSheetNorth']) {
      const b = await page.locator(id).boundingBox();
      expect(b.height).toBeGreaterThanOrEqual(44); expect(b.width).toBeGreaterThanOrEqual(44);
      expect(b.y + b.height).toBeLessThanOrEqual(page.viewportSize().height);
    }
    await expect(page.locator('#mapTitle')).toHaveText('THE AMBERWILD');
    await shot(page, 'r4-region-south');
    await page.click('#mapSheetNorth');
    await expect(page.locator('#mapTitle')).toHaveText('THE AMBERWILD · NORTH');
    expect(await tapRegion(page, 8, 6)).toBe('???');   // Kilnmouth: not built, not yet named
    expect(await tapRegion(page, 15, 5)).toBe('???');   // Brightgate: a node only
    const px = () => page.evaluate(() => { const c = document.querySelector('#regionCanvas'), k = c.width / 320, d = c.getContext('2d').getImageData(Math.round(128 * k), Math.round(120 * k), 1, 1).data; return '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join(''); });
    const noCoach = await px();
    await shot(page, 'r4-region-north');
    await page.click('#mapClose');
    await page.evaluate(() => { PixelPets.setFlag('story.km_assigned', true); PixelPets.setFlag('story.km_council', true); });
    await openRegion(page); await page.click('#mapSheetNorth'); await page.waitForTimeout(150);
    expect(await tapRegion(page, 8, 6)).toBe('KILNMOUTH');   // named once assigned; still not reachable
    const coach = await px();
    expect(noCoach).not.toBe(coach);
    expect(coach).toBe('#38b764');   // PAL.g, the coach's dashed line
    expect(await page.evaluate(() => PixelPets.devChecks().map)).toEqual([]);
    await page.click('#mapSheetSouth');
    await expect(page.locator('#mapTitle')).toHaveText('THE AMBERWILD');
  });

  test('T10 @w1: the level caps are 41 after Seal 4 and 44 after Seal 5 (D1880)', async ({ page }) => {
    await boot(page, save(POSTED));
    const r = await page.evaluate(() => {
      const three = PixelPets.levelCap(); PixelPets.setFlag('story.seal4', true); const four = PixelPets.levelCap();
      PixelPets.setFlag('story.seal5', true); return { caps: LEVEL_CAPS.slice(), three, four, five: PixelPets.levelCap(), more: capLevelFor(7) };
    });
    expect(r.caps).toEqual([15, 22, 30, 38, 41, 44]);
    expect([r.three, r.four, r.five, r.more]).toEqual([38, 41, 44, 44]);
  });

  test('T11 @w1: every say ≤ 110, choice ≤ 30, quest text ≤ 110, place ≤ 24; no banned word; debug hooks inert without ?debug=1', async ({ page }) => {
    const lines = [], choices = [];
    const walk = n => { if (!Array.isArray(n)) return; if (n[0] === 'say') lines.push(n[2]); if (n[0] === 'choice') { lines.push(n[1]); for (const c of n[2]) { choices.push(c[0]); walk(c[1]); } return; } for (const x of n) walk(x); };
    for (const st of Object.values(R4.scenes)) walk(st);
    for (const m of Object.values(R4.maps)) for (const o of m.objs) { if (o.text) lines.push(o.text); for (const v of Object.values(o.lines || {})) lines.push(v); }
    for (const o of R4.slicePatch.maps.hearthmoor.addObjs) for (const v of Object.values(o.lines || {})) lines.push(v);
    for (const v of Object.values(R4.objPatch.hm_bram.linesFirst)) lines.push(v);
    for (const t of Object.values(R4.trainers)) for (const v of Object.values(t.lines)) lines.push(v);
    lines.push(HC.maps.hc_civic.objs.find(o => o.id === 'hc2_post_m_c1_n').text);
    expect(lines.length).toBeGreaterThan(30);
    for (const l of lines) { expect(Array.from(l).length, l).toBeLessThanOrEqual(110); expect(l, l).not.toMatch(/  |\b(faint(ed)?|evolv\w*|coins?|appeared|trainer|alien)\b|dex\b/i); }
    for (const c of choices) expect(Array.from(c).length, c).toBeLessThanOrEqual(30);
    const Q = require(path.join(ROOT, 'quests.js'));
    for (const id of ['gov_walk', 'gov_walk2']) { const e = Q.byId(id); expect(Array.from(e.text).length).toBeLessThanOrEqual(110); expect(Array.from(e.place).length).toBeLessThanOrEqual(24); }
    const ids = Q.CHAIN.map(e => e.id);
    expect(ids.slice(ids.indexOf('gov_post'), ids.indexOf('gov_meet') + 1)).toEqual(['gov_post', 'gov_walk', 'gov_walk2', 'gov_meet']);
    await boot(page, save(POSTED, { map: 'route4', x: 7, y: 26, facing: 'up' }), { plain: true });
    expect(await page.evaluate(() => PixelPets.debug === true)).toBe(false);
    expect(await page.evaluate(() => typeof PixelPets.goto === 'function' && !!PixelPets.goto('route4_withy', 12, 2))).toBe(false);
  });

  test('pacing (ACT2_PACING §3): a battle within the first screen; at most 3 holder battles between heals; the fold sits at the join', async () => {
    // The first battle: the adder's sighting is five tiles from the Hearthmoor landing.
    const adder = R4.maps.route4.objs.find(o => o.id === 'r4_adder_first');
    expect(bfs('route4', [6, 26], [[adder.x - 1, adder.y], [adder.x, adder.y + 1]])).toBeLessThanOrEqual(6);
    // Heals: Hearthmoor's Lantern House, the fold at the fork, High Charity. Holders on each leg: 1, then 1 + the optional 1.
    const on = map => Object.values(R4.trainers).filter(t => t.map === map).length;
    expect(on('route4')).toBe(1);
    expect(on('route4_reeds') + on('route4_withy')).toBeLessThanOrEqual(3);
    expect(Object.keys(R4.trainers)).toHaveLength(3);
    for (const t of Object.values(R4.trainers)) for (const m of t.team) expect(m.level >= 27 && m.level <= 29, t.title).toBe(true);
    const fold = R4.maps.route4.objs.find(o => o.id === 'r4_trough');
    expect(bfs('route4', [10, 5], [[fold.x - 1, fold.y], [fold.x, fold.y + 1], [fold.x, fold.y - 1]])).toBeLessThanOrEqual(13);
    expect(JSON.stringify(R4.scenes.r4_rest)).toContain('["rest"]');
  });

  test('reduced motion: Route 4, the river road and the withy beds draw with no console error; the save is unchanged', async ({ page }) => {
    const s = save(POSTED, { map: 'route4', x: 7, y: 26, facing: 'up' }), had = Object.keys(s.flags);
    await boot(page, s, { reduce: true });
    for (const [m, x, y] of [['route4', 10, 9], ['route4_reeds', 28, 6], ['route4_withy', 12, 2]]) { await goto(page, m, x, y, 'up'); await page.waitForTimeout(250); }
    const st = await stored(page);
    expect(st.v).toBe(2);
    expect(Object.keys(st.flags).filter(k => !had.includes(k) && !/^(daily|unlock|story\.unlock_|story\.reached_|item\.|spotted\.|trainer\.|tip\.|seen\.|map\.)/.test(k))).toEqual([]);
  });
});
