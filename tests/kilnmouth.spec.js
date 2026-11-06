/* KILNMOUTH v0.1.1 (design repo, private; D1820-D1849 settled Wed Nov 4, 2026): Claybank Road (km_road) and the town of
   Kilnmouth with its six rooms; Route 4's east warps; the wild tables, the holders and the placed first sightings of S1
   `dipper` and S4 `jugwasp`; rule 10; B2-B4 on their tiles (K1-K5, the storm, the crew, the permit, the hill path's walk-beside
   stop, D1990); the eight town states and two road states; the coach gate (D1845); the Hall 5 door and its Seal 5 gate.
   data/detail_zzzzz_kilnmouth.json, game.js (the KILNMOUTH block), sprites.js, battle_bg.js, quests.js. Every new line is
   PLACEHOLDER. §12.3 K-T1..K-T11, at 320, 375 and 390 (@w1 rows are data checks, at 320 only); Modern controls; reduced motion;
   zero console errors; the save stays pixelpets.save.v2, v 2, additive story.* flags only. */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { starterSave, installSave, trackErrors, gotoGame, shot } = require('./helpers');

trackErrors(test, expect);

const ROOT = path.join(__dirname, '..');
const KM = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'detail_zzzzz_kilnmouth.json'), 'utf8'));
// The build lands by packet slice (§12.4); a test whose slice is not in the data yet skips with that note.
const HAS = { rooms4: !!KM.maps.km_council_in, beats: !!(KM.scenes && KM.scenes.km_k1), states: !!(KM.maps.km_road.tilePatch), hall: !!KM.maps.km_hall_in };
const needs = (k, slice) => test.skip(!HAS[k], 'lands with ' + slice);

// Act 1 done and Ep 1 closed, a plain Keeper Cadet, posted and met (as tests/route_to_governor.spec.js seeds it).
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
const POSTED = Object.assign({}, ACT1, { 'story.a2_called': true, 'story.gov_posted': true, 'story.cv_mom': 'told', 'story.cv_mom_walk': true,
  'story.reached_route4': true, 'story.r4_fork': true, 'story.r4_walked': true, 'story.r4_adder_met': true, 'story.r4_heron_met': true });
const MET = Object.assign({}, POSTED, { 'story.hc_gov_met': true, 'story.km_assigned': true });
const IN_TOWN = Object.assign({}, MET, { 'story.reached_kilnmouth': true });
const ARRIVED = Object.assign({}, IN_TOWN, { 'story.km_arrived': true });
const STORMED = Object.assign({}, ARRIVED, { 'story.km_storm': true });
const CURFEW = Object.assign({}, STORMED, { 'story.km_crew': true, 'story.km_permit_seen': true, 'story.km_twin_lead': true, 'story.km_seat_filled': true });
const MORNING = Object.assign({}, CURFEW, { 'story.km_council': true, 'story.km_settled': true });

function save(flags, world, mut) {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.textSpeed = 'fast';
  s.settings.follower = false;
  s.settings.tips = false;
  Object.assign(s.flags, flags || {});
  s.world = Object.assign({ map: 'kilnmouth', x: 27, y: 37, facing: 'up', respawn: 'hearthmoor' }, world || {});
  s.seals = { seal_fernbrook: 1700000000000, seal_cobblecrest: 1700000000000, seal_brinewick: 1700000000000 };
  s.party[0].xp = 4000; s.party[0].bx = 4 * 28 * 28;
  if (mut) mut(s);
  return s;
}
async function boot(page, s, opts = {}) {
  test.setTimeout(opts.long || 60000);
  await page.emulateMedia({ reducedMotion: opts.motion ? 'no-preference' : 'reduce' });
  await installSave(page.context(), s, { quietDay: true, oldSave: !!opts.oldSave });
  await gotoGame(page, opts.plain ? '' : '?debug=1');
  if (opts.plain) { await page.waitForFunction(() => window.PixelPets && PixelPets.state); return; }
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && typeof PixelPets.talkTo === 'function' && PixelPets.state);
  await page.evaluate(() => { PixelPets.showTab('walk'); if (PixelPets.clearWild) PixelPets.clearWild(); });
}
const flags = page => page.evaluate(() => Object.assign({}, PixelPets.state.flags));
const stored = page => page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
const sceneId = page => page.evaluate(() => PixelPets.scene && PixelPets.scene.id);
const where = page => page.evaluate(() => ({ map: PixelPets.mapInfo.id, x: PixelPets.state.world.x, y: PixelPets.state.world.y, facing: PixelPets.state.world.facing }));
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
      const state = await page.evaluate(() => { const b = PixelPets.battle; b.textMs = 1; b.animMs = 0; return b.state; });
      if (state === 'CHOOSE') { await page.evaluate(() => PixelPets.winBattle()); await page.waitForFunction(() => !PixelPets.battle.on || PixelPets.battle.state === 'END', null, { timeout: 15000 }); }
      if (await page.evaluate(() => PixelPets.battle.on && PixelPets.battle.state === 'END')) await page.evaluate(() => { const b = document.querySelector('#btOk'); if (b) b.click(); });
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
async function talk(page, id, picks) { expect(await page.evaluate(i => PixelPets.talkTo(i), id), 'talk ' + id).toBe(true); return drive(page, picks); }
// The holder's battle: walk into the sight line, win, close.
async function beatHolder(page, map, id, from, dir) {
  await goto(page, map, from[0], from[1], dir);
  await step(page, dir);
  await expect.poll(() => page.evaluate(() => !!(PixelPets.battle && PixelPets.battle.on) || !!PixelPets.scene), { timeout: 10000 }).toBe(true);
  await drive(page);
  expect((await flags(page))['trainer.' + id], id).toBe(true);
}

test.describe('KILNMOUTH: the road, the town and the rooms are built to the packet (K-T1, K-T11)', () => {
  test('K-T1 @w1: the layout checker on the game data: sizes, mouths, doors, reach, chokes, anchors, zones, rule 10, the rooms, the budgets', async ({ page }) => {
    await boot(page, save(MET, { map: 'route4', x: 20, y: 2, facing: 'right' }));
    const r = await page.evaluate(() => {
      const bad = [], walkOf = m => { const sk = m.skin && SKINS[m.skin]; return ch => (sk && sk.walk && sk.walk[ch] != null) ? !!sk.walk[ch] : !!(PPKm.TILE_DEF[ch] || {}).walk; };
      const solidKinds = { npc: 1, sign: 1, prop: 1, trainer: 1, wild: 1 };
      const reach = (m, start, extra = new Set()) => {
        const W = walkOf(m), seen = new Set([start.join(',')]), q = [start];
        while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
          if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h || seen.has(k) || extra.has(k) || !W(m.grid[ny][nx])) continue; seen.add(k); q.push([nx, ny]); } }
        return seen;
      };
      const blocks = m => new Set(m.objs.filter(o => solidKinds[o.kind] && !o.when).map(o => o.x + ',' + o.y));
      for (const id of ['km_road', 'kilnmouth']) {
        const m = WORLD[id], W = walkOf(m);
        if (m.w > 64 || m.h > 48 || m.grid.length !== m.h || m.grid.some(r => r.length !== m.w)) bad.push(id + ' size');
        if (m.w * m.h > 3072) bad.push(id + ' tiles');
        const warps = m.objs.filter(o => o.kind === 'warp'), arr = id === 'km_road' ? [1, 25] : [27, 38];
        for (let x = 0; x < m.w; x++) for (const y of [0, m.h - 1]) if (W(m.grid[y][x]) && !warps.some(w => w.x === x && w.y === y) && !m.objs.some(o => o.x === x && o.y === y && solidKinds[o.kind])) bad.push(id + ' border open ' + x + ',' + y);
        for (let y = 0; y < m.h; y++) for (const x of [0, m.w - 1]) if (W(m.grid[y][x]) && !warps.some(w => w.x === x && w.y === y)) bad.push(id + ' border open ' + x + ',' + y);
        for (const w of warps) { const t = WORLD[w.to]; if (!t) { bad.push(id + ' warp to ' + w.to); continue; }
          if (!walkOf(t)(t.grid[w.ty][w.tx])) bad.push(id + ' warp lands solid ' + w.id); }
        const seen = reach(m, arr), blk = blocks(m), seenB = reach(m, arr, blk);
        for (const d of m.objs.filter(o => o.kind === 'door')) {
          if (m.grid[d.y - 1][d.x] !== 'H') bad.push(id + ' door ' + d.id + ' no facade');
          if (!W(m.grid[d.y][d.x])) bad.push(id + ' door step ' + d.id);
          if (!seenB.has(d.x + ',' + d.y)) bad.push(id + ' door unreachable ' + d.id);
          if (d.to && !WORLD[d.to]) bad.push(id + ' door to ' + d.to);
        }
        for (const w of warps) if (!seenB.has(w.x + ',' + w.y) && !(w.when || w.need)) bad.push(id + ' warp unreachable ' + w.id);
        for (const [k, r] of Object.entries(m.roofs || {})) for (let y = r.y0; y <= r.y1; y++) for (let x = r.x0; x <= r.x1; x++) if (!'RH'.includes(m.grid[y][x])) bad.push(id + ' roof ' + k + ' not all R/H at ' + x + ',' + y);
        // the checker's two reach rules: no one-wide choke of the grid strands a door or a mouth (articulation on the walk grid,
        // a door's own one-wide lane excepted), and the standing bodies together cut nothing off
        const targets = m.objs.filter(o => o.kind === 'door' || (o.kind === 'warp' && !o.when)).map(o => o.x + ',' + o.y);
        for (const t of targets) if (!seenB.has(t)) bad.push(id + ' bodies cut off ' + t);
        for (const k of seen) { if (k === arr.join(',') || targets.includes(k)) continue;
          const s2 = reach(m, arr, new Set([k])); const lost = targets.filter(t => !s2.has(t) && seen.has(t));
          const lane = lost.every(t => { const [tx, ty] = t.split(',').map(Number), [kx, ky] = k.split(',').map(Number); return ky === ty && m.grid[ty - 1][kx] === 'H'; });
          if (lost.length && !lane) { bad.push(id + ' choke at ' + k + ' strands ' + lost.join(' ')); break; } }
        // anchors and landmarks never stand on a door, a mouth or the arrival
        for (const o of m.objs.filter(o => solidKinds[o.kind])) if (targets.includes(o.x + ',' + o.y) || (o.x === arr[0] && o.y === arr[1])) bad.push(id + ' ' + o.id + ' on a door, mouth or the arrival');
        for (const z of m.zones || []) { let t = 0, n = 0; for (let y = z.y; y < z.y + z.h; y++) for (let x = z.x; x < z.x + z.w; x++) { if (W(m.grid[y][x])) { n++; if (m.grid[y][x] === 't') t++; } } if (n < z.w * z.h * 0.5 || t < n * 0.6) bad.push(id + ' zone not tall grass ' + JSON.stringify(z)); }
        if (m.objs.length > 240) bad.push(id + ' objects ' + m.objs.length);
        if (m.objs.filter(o => o.kind === 'npc' || o.kind === 'trainer').length > 24) bad.push(id + ' people');
      }
      // rule 10: one Lantern House, one store; heal_lantern at door x-1 and acorn_board at x+1 on the facade row; no other marks
      const t = WORLD.kilnmouth, lan = t.objs.filter(o => o.sprite === 'heal_lantern'), sto = t.objs.filter(o => o.sprite === 'acorn_board');
      if (lan.length !== 1 || lan[0].x !== 30 || lan[0].y !== 35) bad.push('heal_lantern ' + JSON.stringify(lan.map(o => [o.x, o.y])));
      if (sto.length !== 1 || sto[0].x !== 25 || sto[0].y !== 35) bad.push('acorn_board ' + JSON.stringify(sto.map(o => [o.x, o.y])));
      // rooms: the cap, closed walls but the mat, every floor reachable from the arrival, the Seal 5 gate shuts the stair
      for (const id of ['km_lantern_in', 'km_store_in', 'km_bath_in', 'km_council_in', 'km_hall_in', 'km_stone_in'].filter(id => WORLD[id])) {
        const m = WORLD[id], W = walkOf(m);
        if (m.w > 16 || m.h > 24) bad.push(id + ' over the cap');
        const mat = m.objs.find(o => o.kind === 'warp' && o.y === m.h - 1);
        if (!mat || m.grid[mat.y][mat.x] !== 'm') bad.push(id + ' mat');
        for (let x = 0; x < m.w; x++) for (let y = 0; y < m.h; y++) if ((x === 0 || y === 0 || x === m.w - 1 || y === m.h - 1) && W(m.grid[y][x]) && !(mat && mat.x === x && mat.y === y)) bad.push(id + ' wall open ' + x + ',' + y);
        const s = reach(m, [m.safe.x, m.safe.y]);
        for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (W(m.grid[y][x]) && m.grid[y][x] !== '^' && !s.has(x + ',' + y)) bad.push(id + ' unreachable ' + x + ',' + y);
      }
      const hall = WORLD.km_hall_in, shut = hall && reach(hall, [7, 22], new Set(['14,2'])), open = hall && reach(hall, [7, 22]);
      if (hall && (shut.has('14,1') || !open.has('14,1'))) bad.push('the Seal 5 gate');
      for (const d of WORLD.kilnmouth.objs.filter(o => o.kind === 'door' && o.to)) if (!WORLD[d.to]) bad.push('door to an unbuilt room ' + d.id);
      return { bad, counts: Object.fromEntries(['km_road', 'kilnmouth'].map(id => [id, WORLD[id].objs.length])) };
    });
    expect(r.bad).toEqual([]);
    test.info().annotations.push({ type: 'note', description: 'objects: ' + JSON.stringify(r.counts) });
    expect(await page.evaluate(() => PixelPets.devChecks())).toEqual(expect.objectContaining({ map: [], quest: [], floorCap: [] }));
    expect(await page.evaluate(() => PixelPets.questCheck)).toEqual([]);
  });
});

test.describe('KILNMOUTH: the walk in (K-T2, K-T3; D1821, D1822, D1837-D1839)', () => {
  test('K-T2: the east bars until the assignment; the east fork to Claybank Road; three holders; the gate view with story.reached_kilnmouth', async ({ page }) => {
    await boot(page, save(POSTED, { map: 'route4', x: 21, y: 2, facing: 'right' }), { long: 120000 });
    expect(await objIds(page)).toEqual(expect.arrayContaining(['r4_east_bar_n', 'r4_east_bar_c', 'r4_east_bar_s', 'r4_east_n']));
    await step(page, 'right');
    expect((await where(page)).map).toBe('route4');   // barred until story.km_assigned (ROUTE_TO_GOVERNOR K2)
    if (await page.evaluate(() => !!PixelPets.scene)) await drive(page);
    await page.evaluate(() => { PixelPets.setFlag('story.hc_gov_met', true); PixelPets.setFlag('story.km_assigned', true); });
    await goto(page, 'route4', 21, 2, 'right');
    expect(await objIds(page)).not.toContain('r4_east_bar_c');
    expect((await quest(page)).id).toBe('km_walk');
    await step(page, 'right'); await step(page, 'right');
    expect(await where(page)).toEqual({ map: 'km_road', x: 1, y: 25, facing: 'right' });
    await shot(page, 'km-road-west');
    // The three road holders, at most three battles between the fork's trough and the Lantern House (PA, D1838).
    await beatHolder(page, 'km_road', 'kr_holder_1', [11, 24], 'right');
    await beatHolder(page, 'km_road', 'kr_holder_2', [23, 25], 'right');
    await beatHolder(page, 'km_road', 'kr_holder_3', [27, 9], 'up');
    // North mouth: the gate, facing north, with the arrival flag; the next step is the Reeve.
    await goto(page, 'km_road', 27, 1, 'up');
    await step(page, 'up');
    expect(await where(page)).toEqual({ map: 'kilnmouth', x: 27, y: 38, facing: 'up' });
    expect((await flags(page))['story.reached_kilnmouth']).toBe(true);
    expect((await quest(page)).id).toBe('km_reeve');
    // Modern: a tap walks up Runnel Street.
    await tapTile(page, 27, 33);
    await expect.poll(() => where(page).then(w => w.y), { timeout: 8000 }).toBe(33);
    expect((await stored(page)).v).toBe(2);
  });

  test('K-T3: the road rolls only its table inside its zones at Lv 29-32; from story.km_seat_filled the B10 table at 34-37; the first sightings show once', async ({ page }) => {
    await boot(page, save(MET, { map: 'km_road', x: 1, y: 25, facing: 'right' }));
    const roll = () => page.evaluate(() => {
      const out = [], zones = PixelPets.mapInfo.id === 'km_road' ? WORLD.km_road.zones : [];
      for (let i = 0; i < 20; i++) { PixelPets.clearWild(); PixelPets.spawnWild(); for (const w of PixelPets.wild) out.push({ sp: SPECIES[w.sp] ? SPECIES[w.sp].id : w.sp, lv: w.lv, x: w.x, y: w.y,
        inZone: zones.some(z => w.x >= z.x && w.x < z.x + z.w && w.y >= z.y && w.y < z.y + z.h) }); }
      return { key: PPKm.spawnKey(), out };
    });
    const a = await roll();
    expect(a.key).toBe('km_road');
    expect(a.out.length).toBeGreaterThan(10);
    const rows = KM.spawnTables.km_road.table.map(r => r[0]);
    for (const w of a.out) { expect(rows).toContain(w.sp); expect(w.lv).toBeGreaterThanOrEqual(29); expect(w.lv).toBeLessThanOrEqual(32); expect(w.inZone).toBe(true); }
    if (KM.spawnTables.km_road_b10) {
    await page.evaluate(() => PixelPets.setFlag('story.km_seat_filled', true));
    const b = await roll();
    expect(b.key).toBe('km_road_b10');
    for (const w of b.out) { expect(KM.spawnTables.km_road_b10.table.map(r => r[0])).toContain(w.sp); expect(w.lv).toBeGreaterThanOrEqual(34); expect(w.lv).toBeLessThanOrEqual(37); }
    await page.evaluate(() => PixelPets.setFlag('story.km_seat_filled', false));
    }
    // S1 at the ford bank and S4 at the clay cut: one placed body each, a one-shot.
    expect(await objIds(page)).toEqual(expect.arrayContaining(['kr_s1_first', 'kr_s4_first']));
    await goto(page, 'km_road', 22, 25, 'down');
    expect(await page.evaluate(() => PixelPets.talkTo('kr_s1_first'))).toBe(true);
    const lines = says(await drive(page));
    expect(lines[0]).toMatch(/slate bird/);
    expect((await flags(page))['story.kr_s1_met']).toBe(true);
    await goto(page, 'km_road', 9, 14, 'down');
    expect(await page.evaluate(() => PixelPets.talkTo('kr_s4_first'))).toBe(true);
    await drive(page);
    expect((await flags(page))['story.kr_s4_met']).toBe(true);
    await goto(page, 'km_road', 9, 14, 'down');
    expect(await objIds(page)).not.toEqual(expect.arrayContaining(['kr_s1_first']));
    expect((await objIds(page)).filter(id => /^kr_s[14]_first$/.test(id)).length).toBe(0);
  });
});

test.describe('KILNMOUTH: rule 10, the Lantern House and the store (K-T4; D1825, D1842)', () => {
  test('K-T4: both doors and both markers are on the arrival frame; the Host explains healing; a bed rests; a loss wakes you at 5,10', async ({ page }) => {
    await boot(page, save(IN_TOWN, { map: 'kilnmouth', x: 27, y: 38, facing: 'up' }));
    await page.waitForTimeout(300);
    const frame = await page.evaluate(() => {
      const on = (x, y) => { const b = PPKm.tileBox(x, y), c = document.querySelector('#mapCanvas').getBoundingClientRect(); return !!b && b.x >= c.left - 1 && b.x + b.w <= c.right + 1 && b.y >= c.top - 1 && b.y + b.h <= c.bottom + 1; };
      return { lanternDoor: on(31, 36), storeDoor: on(24, 36), lanternMark: on(30, 35), storeMark: on(25, 35), porch: on(33, 36), awning: on(21, 36) };
    });
    expect(frame).toEqual(expect.objectContaining({ lanternDoor: true, storeDoor: true, lanternMark: true, storeMark: true }));
    test.info().annotations.push({ type: 'note', description: 'silhouettes on the arrival frame (the outdoor zoom frames 13 columns): porch ' + frame.porch + ', awning ' + frame.awning });
    await shot(page, 'km-gate-view');
    expect(await page.evaluate(() => [PPKm.TOWN_DOOR_ART.km_lantern, PPKm.TOWN_DOOR_ART.km_store])).toEqual(['heal_lantern', 'acorn_board']);
    // The Lantern House: the Host's guide on first entry (lantern.guide_heard), eight beds with the rest, the respawn tile.
    await page.evaluate(() => PixelPets.setHp('me', 3));
    await tapTile(page, 31, 36);
    await expect.poll(() => where(page).then(w => w.map), { timeout: 10000 }).toBe('km_lantern_in');
    await expect.poll(() => sceneId(page), { timeout: 5000 }).toBe('lantern_guide');
    expect(says(await drive(page))[0]).toMatch(/Talk to a bed/);
    expect((await flags(page))['lantern.guide_heard']).toBe(true);
    expect((await page.evaluate(() => window.WORLD.km_lantern_in.objs.filter(o => o.lines && o.lines.else === '@lantern_rest').length))).toBe(8);   // the grid's eight (D1842 says nine: a packet gap)
    await page.evaluate(() => { PixelPets.state.money = 20; });
    await goto(page, 'km_lantern_in', 2, 3, 'left');
    expect(await page.evaluate(() => PixelPets.talkTo('km_bed_2'))).toBe(true);
    await drive(page, ['Rest the whole party', 'Rest', 'Let them rest']);
    expect(await page.evaluate(() => PixelPets.state.party[0].hpNow)).toBeUndefined();
    expect(await page.evaluate(() => [WORLD.kilnmouth.respawnIn, WORLD.km_lantern_in.respawnSpot])).toEqual([{ map: 'km_lantern_in', x: 5, y: 10, facing: 'up' }, { x: 5, y: 10, facing: 'up' }]);
    expect(await page.evaluate(() => [PPKm.respawnTown(), PPKm.LANTERN_NEAR.km_road[0][0]])).toEqual(['kilnmouth', 'kilnmouth']);
    // The store: its shop opens on the clerk.
    await goto(page, 'km_store_in', 4, 2, 'right');
    expect(await page.evaluate(() => PixelPets.talkTo('km_clerk'))).toBe(true);
    await expect(page.locator('#ovShop')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('KILNMOUTH round 1: B2-B4 on their tiles (K-T5; CAB K1-K5, D1990)', () => {
  test('K-T5: the Reeve (K1); three asks and the narration (K2); two pitches come over (K3); the storm, the crew, the permit (B4, K4)', async ({ page }) => {
    needs('beats', 'slice 3 (B2-B4)');
    await boot(page, save(IN_TOWN, { map: 'km_council_in', x: 6, y: 10, facing: 'up' }), { long: 120000 });
    expect(says(await talk(page, 'km_reeve'))).toEqual(['Six chairs sit. Six hands. Every vote ends three and three, and the capital signs the rest.',
      "The seventh chair's been empty since the tower went up. Ask anyone why. Then ask me again."]);
    expect((await flags(page))['story.km_arrived']).toBe(true);
    expect((await quest(page)).id).toBe('km_listen');
    // K2: any order; the third adds the one-name line.
    await goto(page, 'kilnmouth', 13, 33, 'left');
    expect(says(await talk(page, 'km_ask_market'))).toEqual(['The Bathkeeper. Kept the water warm for years and never asked a thing back.']);
    await goto(page, 'kilnmouth', 43, 35, 'right');
    expect(says(await talk(page, 'km_ask_yard')).length).toBe(1);
    await goto(page, 'kilnmouth', 32, 28, 'left');
    expect(says(await talk(page, 'km_ask_springs'))).toEqual(["If the town could vote tonight, it'd be the Bathkeeper. It can't. Curfew.", 'Three people, three ways of saying it. One name.']);
    expect((await flags(page))['story.km_names']).toBe(3);
    // K3: walking near each brings the pitch to the Cadet.
    await goto(page, 'kilnmouth', 33, 22, 'left'); await step(page, 'left');
    await expect.poll(() => sceneId(page), { timeout: 8000 }).toBe('km_pitch_f');
    expect(says(await drive(page))[0]).toMatch(/^I grew up in that bathhouse/);
    await goto(page, 'kilnmouth', 40, 20, 'right'); await step(page, 'right');
    await expect.poll(() => sceneId(page), { timeout: 8000 }).toBe('km_pitch_c');
    expect(says(await drive(page))).toEqual(['Years in the watch. This town needs order before it needs warm water.']);
    expect(await flags(page)).toEqual(expect.objectContaining({ 'story.km_pitch_f': true, 'story.km_pitch_c': true }));
    // B4: on the rim; a dusk scene sky and the storm cloud while it plays; then the flat band stays.
    await goto(page, 'kilnmouth', 27, 30, 'up'); await step(page, 'up');
    await expect.poll(() => sceneId(page), { timeout: 8000 }).toBe('km_storm');
    await expect.poll(() => page.evaluate(() => PPKm.forcedSky()), { timeout: 5000 }).toBe('dusk');
    const storm = says(await drive(page));
    expect(storm.slice(0, 3)).toEqual(['Dark cloud rolls in over the hills. Kids run for the bathhouse, laughing.',
      'Over the grey tower the cloud goes flat, like a hand pressed it. Not a drop falls.', "No storm again! The tower's the best thing that ever happened here."]);
    expect(await page.evaluate(() => PPKm.forcedSky())).toBeNull();   // the clock comes back
    expect((await flags(page))['story.km_storm']).toBe(true);
    expect((await quest(page)).id).toBe('km_permit');
    // The crew in the fence gate (sight 1): the battle, then he steps aside.
    await goto(page, 'kilnmouth', 27, 23, 'up'); await step(page, 'up');
    await expect.poll(() => page.evaluate(() => !!(PixelPets.battle && PixelPets.battle.on) || !!PixelPets.scene), { timeout: 10000 }).toBe(true);
    await drive(page);
    expect((await flags(page))['story.km_crew']).toBe(true);
    expect(await objIds(page)).toContain('km_crew_aside');
    // K4: the permit, its choice (tell the bathhouse: +1 sway), the twin lead.
    await goto(page, 'kilnmouth', 27, 20, 'up');
    const permit = await talk(page, 'km_permit', ['Tell the bathhouse']);
    expect(says(permit)[0]).toBe('BY PERMIT OF HIGH CHARITY. Issued in default of the council.');
    expect(permit.find(l => l[0] === '>')[2]).toEqual(['Tell the bathhouse', 'Keep it for the Warden']);
    expect(await flags(page)).toEqual(expect.objectContaining({ 'story.km_permit_seen': true, 'story.km_permit_to': 'town', 'story.sway_kilnmouth': 1,
      'story.km_twin_lead': true, 'story.pres_hint_default': true }));
    await goto(page, 'kilnmouth', 31, 22, 'left');
    expect(says(await talk(page, 'km_dray'))).toEqual(["First one's in Brightgate. Never switched on. Ask them why ours was."]);
    expect((await quest(page)).id).toBe('bg_ride');   // BRIGHT_SHUTTLE (D2106): the twin lead opens B5's row, the works yard shuttle
    expect((await stored(page)).v).toBe(2);
  });

  test('K-T5 @w1: keep it for the Warden: the slip goes on the fence; K5 taps never write; the hill path stops the party once, only after the storm (D1990)', async ({ page }) => {
    needs('beats', 'slice 3 (B2-B4)');
    await boot(page, save(Object.assign({}, STORMED, { 'story.km_crew': true }), { map: 'kilnmouth', x: 27, y: 20, facing: 'up' }));
    await talk(page, 'km_permit', ['Keep it for the Warden']);
    expect(await flags(page)).toEqual(expect.objectContaining({ 'story.km_permit_to': 'warden', 'story.slip_kilnmouth': true }));
    expect((await flags(page))['story.sway_kilnmouth']).toBeUndefined();
    await goto(page, 'kilnmouth', 29, 22, 'up');
    expect(await objIds(page)).toContain('km_fence_slip');
    expect(says(await talk(page, 'km_fence_slip'))).toEqual(['LEASE UNDER REVIEW.']);
    // K5: the basket and the relocated door.
    const noWalk = f => JSON.stringify(Object.assign({}, f, { 'story.early_steps': null }));   // the engine's own step counter is not a tap
    const before = noWalk(await flags(page));
    await goto(page, 'kilnmouth', 18, 18, 'up');
    expect(says(await talk(page, 'km_basket'))).toEqual(['A basket with a wine ribbon. Nobody has opened it.']);
    await goto(page, 'kilnmouth', 17, 18, 'up'); await step(page, 'up'); await step(page, 'up');
    expect(says(await drive(page))).toEqual(['A note on the door: RELOCATED, WITH THANKS. Have a bright day!']);
    expect(noWalk(await flags(page))).toBe(before);
    // The hill path: ws1 and ws2 on 37,9, once.
    await goto(page, 'kilnmouth', 37, 11, 'up'); await step(page, 'up'); await step(page, 'up');
    await expect.poll(() => sceneId(page), { timeout: 8000 }).toBe('km_wb_springs');
    const ws = says(await drive(page));
    expect(ws[0]).toMatch(/stops at the foot of the hill path and won't go on\.$/);
    expect(ws[1]).toBe('You stop with it. Up the hill the cloud sits flat, and nothing moves.');
    expect((await flags(page))['story.wb_springs']).toBe(true);
    await step(page, 'down'); await step(page, 'up');
    expect(await sceneId(page)).toBeNull();
  });

  test('K-T5 @w1: before the storm the hill path is quiet and the permit reads as the fence line', async ({ page }) => {
    needs('beats', 'slice 3 (B2-B4)');
    await boot(page, save(ARRIVED, { map: 'kilnmouth', x: 37, y: 11, facing: 'up' }));
    await step(page, 'up'); await step(page, 'up');
    expect(await sceneId(page)).toBeNull();
    await goto(page, 'kilnmouth', 27, 20, 'up');
    expect(says(await talk(page, 'km_permit'))).toEqual(['Hard hats only past the fence.']);
    expect((await flags(page))['story.km_permit_seen']).toBeUndefined();
  });
});

test.describe('KILNMOUTH: states and holds (K-T6, K-T8; D1831, D1835, D1840, CAB §3.6)', () => {
  test('K-T6: each town state shows its words: normal, flat cloud, curfew (night held on the day), morning; reduced motion holds smoke and cloud still', async ({ page }) => {
    needs('states', 'slices 5 and 7 (states)');
    await boot(page, save(ARRIVED, { map: 'kilnmouth', x: 26, y: 29, facing: 'right' }));
    const words = () => page.evaluate(() => {
      const L = id => { const o = WORLD.kilnmouth.objs.find(x => x.id === id); if (!o) return null; if (o.text) return o.text;
        for (const [k, v] of Object.entries(o.lines || {})) if (k === 'else' || PPKm.cond(k)) return v; return null; };
      const shown = id => PixelPets.mapInfo.objs.some(o => o.id === id);
      return { gate: L('km_springs_gate'), board: L('km_council_board'), works: shown('km_works_order') ? 'order' : shown('km_works_sign') ? 'sign' : null,
        coach: L('km_coach_shelter'), coachWarp: shown('km_coach'), sky: PPKm.forcedSky(), flat: WORLD.kilnmouth.overlays.filter(o => o.when && o.when.every(c => PPKm.cond(c))).map(o => o.id),
        keepers: shown('km_curfew_keeper_a') && shown('km_curfew_keeper_b'), market: shown('km_ask_market'), lit: shown('km_warm_glow'), council: shown('km_council_lit_8'), coal: shown('km_coal_a') };
    });
    const regoto = () => goto(page, 'kilnmouth', 26, 29, 'right');
    const normal = await words();
    expect(normal).toEqual(expect.objectContaining({ gate: 'The springs gate. It stands open; there is nothing to keep in.', works: 'sign', coach: 'LANTERN COACH. No coaches till the council sits.',
      coachWarp: false, sky: null, flat: [], keepers: false, market: true, lit: false }));
    await shot(page, 'km-state-normal');
    await page.evaluate(() => PixelPets.setFlag('story.km_storm', true)); await regoto();
    expect((await words()).flat).toEqual(['km_flat_cloud']);
    await shot(page, 'km-state-flat-cloud');
    for (const [k, v] of Object.entries({ 'story.km_crew': true, 'story.km_permit_seen': true, 'story.km_seat_filled': true })) await page.evaluate(([k, v]) => PixelPets.setFlag(k, v), [k, v]);
    await regoto();
    const curfew = await words();
    expect(curfew).toEqual(expect.objectContaining({ gate: 'BY ORDER. NO GATHERING AFTER DARK.', board: 'BY ORDER. NO GATHERING AFTER DARK.', works: 'order', sky: 'night',
      keepers: true, market: false, lit: true }));
    expect(await page.evaluate(() => { const a = PPClock.now().gameMinute; return Math.abs(PPClock.now().gameMinute - a) <= 1; })).toBe(true);   // the clock never jumps
    await shot(page, 'km-state-curfew');
    await page.evaluate(() => { PixelPets.setFlag('story.km_council', true); PixelPets.setFlag('story.km_settled', true); }); await regoto();
    const morning = await words();
    expect(morning).toEqual(expect.objectContaining({ gate: 'The springs gate. It stands open; there is nothing to keep in.', sky: null, keepers: false, market: true,
      council: true, coal: true, coach: 'LANTERN COACH. The coach stops here for Hearthmoor.', coachWarp: true }));
    await shot(page, 'km-state-morning');
    // Reduced motion: the warm kiln's smoke and the storm edge are one still frame.
    expect(await page.evaluate(() => PPKm.artFrame(PPKm.WART.km_kiln_smoke, 0) === PPKm.artFrame(PPKm.WART.km_kiln_smoke, 700) && PPKm.artFrame(PPKm.WART.km_smoke, 0) === PPKm.artFrame(PPKm.WART.km_smoke, 800))).toBe(true);
  });

  test('K-T6: the road soaks in B10 (mud below the bridge, the creek full, the ford awash, two fresh holders) and dries back after the council', async ({ page }) => {
    needs('states', 'slice 5 (B10)');
    await boot(page, save(CURFEW, { map: 'km_road', x: 1, y: 25, facing: 'right' }), { long: 90000 });
    const look = () => page.evaluate(() => ({ path: PixelPets.tileInfo(5, 25).ch, ford: PixelPets.tileInfo(19, 25).ch, sand: PixelPets.tileInfo(18, 20).ch, upper: PixelPets.tileInfo(30, 5).ch,
      fordWalk: PixelPets.tileInfo(19, 25).walk, holders: PixelPets.mapInfo.objs.filter(o => /^kr_b10_/.test(o.id)).length, mud: PixelPets.mapInfo.objs.some(o => o.id === 'kr_mud'), key: PPKm.spawnKey() }));
    expect(await look()).toEqual({ path: 'm', ford: 'a', sand: 'w', upper: 's', fordWalk: true, holders: 2, mud: true, key: 'km_road_b10' });
    await shot(page, 'km-road-b10');
    await goto(page, 'km_road', 12, 26, 'up');
    expect(says(await talk(page, 'kr_mud'))).toEqual(['Mud to the ankle. The storm came down here, not up the hill.']);
    await beatHolder(page, 'km_road', 'kr_b10_1', [9, 24], 'left');
    await page.evaluate(() => { PixelPets.setFlag('story.km_council', true); });
    await goto(page, 'km_road', 1, 25, 'right');
    expect(await look()).toEqual(expect.objectContaining({ path: 'p', ford: 'o', sand: 's', mud: false, key: 'km_road_b10' }));
  });

  test('K-T8: the hold at sway 3, 0 and -2 with story.km_settled: the Keepers, split and Glimmerwell art and lines', async ({ page }) => {
    needs('states', 'slice 7 (holds)');
    await boot(page, save(Object.assign({}, MORNING, { 'story.sway_kilnmouth': 3 }), { map: 'kilnmouth', x: 27, y: 37, facing: 'up' }));
    const hold = () => page.evaluate(() => ({ fac: PPKm.factionOfMap('kilnmouth'), line: PPKm.holdLine('kilnmouth'), road: PPKm.factionOfMap('km_road'),
      pennant: PixelPets.mapInfo.objs.some(o => o.id === 'km_pennant'), split: PixelPets.mapInfo.objs.some(o => o.id === 'km_split_keeper'),
      pipe: PixelPets.mapInfo.objs.some(o => o.id === 'km_pipe_30'), plate: PixelPets.mapInfo.objs.some(o => o.id === 'km_bath_plate') }));
    expect(await hold()).toEqual({ fac: 'keepers', line: 'Kilnmouth sits its own seat. The Keepers walk its lanes.', road: null, pennant: true, split: false, pipe: false, plate: false });
    await shot(page, 'km-hold-keepers');
    await page.evaluate(() => PixelPets.setFlag('story.sway_kilnmouth', 0)); await goto(page, 'kilnmouth', 27, 37, 'up');
    expect(await hold()).toEqual({ fac: null, line: 'Kilnmouth sits its seat. Both sides wait at the springs.', road: null, pennant: false, split: true, pipe: false, plate: false });
    await shot(page, 'km-hold-split');
    await page.evaluate(() => PixelPets.setFlag('story.sway_kilnmouth', -2)); await goto(page, 'kilnmouth', 27, 37, 'up');
    expect(await hold()).toEqual({ fac: 'glimmer', line: "Glimmerwell holds the town. The water's warm again.", road: null, pennant: false, split: false, pipe: true, plate: true });
    await shot(page, 'km-hold-glimmer');
    expect(await page.evaluate(() => PixelPets.devChecks().map)).toEqual([]);
  });
});

test.describe('KILNMOUTH: Hall 5, the coach and the saves (K-T7, K-T9, D1843, D1845)', () => {
  test('K-T7: the Hall door denies until story.km_hall_lit; the stone gate shuts the stair until story.seal5', async ({ page }) => {
    needs('hall', 'slice 6 (Hall 5)');
    await boot(page, save(STORMED, { map: 'kilnmouth', x: 42, y: 29, facing: 'up' }));
    await step(page, 'up'); await step(page, 'up');
    expect(says(await drive(page))).toEqual(["The kiln's cold. No fuel vote, no fire."]);
    expect((await where(page)).map).toBe('kilnmouth');
    await page.evaluate(() => PixelPets.setFlag('story.km_hall_lit', true));
    await goto(page, 'kilnmouth', 42, 29, 'up'); await step(page, 'up'); await step(page, 'up');
    await expect.poll(() => where(page).then(w => w.map), { timeout: 8000 }).toBe('km_hall_in');
    expect(await page.evaluate(() => PixelPets.mapInfo.objs.filter(o => /^km_vent_lit_/.test(o.id)).length)).toBe(15);
    expect(await page.evaluate(() => !!PixelPets.findPath([{ x: 14, y: 1 }]))).toBe(false);
    await page.evaluate(() => PixelPets.setFlag('story.seal5', true)); await goto(page, 'km_hall_in', 7, 22, 'up');
    expect(await page.evaluate(() => !!PixelPets.findPath([{ x: 14, y: 1 }]))).toBe(true);
    await goto(page, 'km_hall_in', 14, 2, 'up'); await step(page, 'up');
    await expect.poll(() => where(page).then(w => w.map), { timeout: 8000 }).toBe('km_stone_in');
  });

  // Tap sides (merge fix, Wed Nov 4, 2026): the seconds bin, the bath mural and the firebox had lines but no free tile to
  // tap them from. km_seconds_b (no lines) moved one tile east; the mural's tap cell is its east end (14,1) and the gauge
  // notches moved one tile west onto the basin's end (13,2), so (14,2) reads both; the firebox's cell is (7,1) beside the
  // Master, its art unmoved (ox). A Modern tap on each walks to the side and plays the line.
  test('tap sides: the seconds bin, the bath mural and gauge, and the firebox (cold and lit) answer a Modern tap', async ({ page }) => {
    needs('hall', 'slice 6 (Hall 5)');
    await boot(page, save(STORMED, { map: 'km_store_in', x: 5, y: 7, facing: 'up' }));
    const tapReads = async (map, from, tile, side, line) => {
      await goto(page, map, from[0], from[1], 'up');
      await tapTile(page, tile[0], tile[1]);
      await page.waitForFunction(() => !!PixelPets.scene, null, { timeout: 8000 });
      const got = await drive(page, [], 20000);
      expect(says(got), map + ' ' + tile).toContain(line);
      const w = await where(page);
      expect([w.x, w.y], map + ' ' + tile + ' tap side').toEqual(side);
    };
    await tapReads('km_store_in', [5, 7], [1, 7], [2, 7], 'A bin of chipped seconds. Half price, and still good for soup.');
    await tapReads('km_bath_in', [14, 5], [14, 1], [14, 2], 'Kiln tiles: a fire-bird over the water. The glaze is cracked where the steam used to be.');
    await tapReads('km_bath_in', [14, 5], [13, 2], [14, 2], 'Notches in red paint, each one dated in a neat hand. The newest is the lowest.');
    await tapReads('km_hall_in', [7, 5], [7, 1], [7, 2], 'The firebox. Cold.');
    await page.evaluate(() => PixelPets.setFlag('story.km_hall_lit', true));
    await tapReads('km_hall_in', [7, 5], [7, 1], [7, 2], 'The firebox, roaring.');
    const tapGaps = await page.evaluate(() => PixelPets.auditTaps().reachGaps.filter(g => /^km_/.test(g)));
    expect(tapGaps).toEqual([]);
    expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
  });

  test('the coach gate (D1845): no coach before the council sits; after it, the stop takes you to Hearthmoor', async ({ page }) => {
    needs('states', 'slice 7 (the coach stop)');
    await boot(page, save(STORMED, { map: 'kilnmouth', x: 51, y: 26, facing: 'right' }));
    expect(await objIds(page)).not.toContain('km_coach');
    expect(says(await talk(page, 'km_coach_shelter'))).toEqual(['LANTERN COACH. No coaches till the council sits.']);
    await page.evaluate(() => PixelPets.setFlag('story.km_council', true)); await goto(page, 'kilnmouth', 51, 26, 'right');
    expect(says(await talk(page, 'km_coach_shelter'))).toEqual(['LANTERN COACH. The coach stops here for Hearthmoor.']);
    await step(page, 'right');
    await expect.poll(() => where(page).then(w => w.map), { timeout: 8000 }).toBe('hearthmoor');
  });

  test('K-T9: an old pre-Act 2 save loads with no Kilnmouth visit; nothing is written at load; v 2; one visit a game day, from the road only', async ({ page }) => {
    const s = save(ACT1, { map: 'hearthmoor', x: 12, y: 10, facing: 'up' });
    const before = JSON.parse(JSON.stringify(s.flags)), keys = Object.keys(s).sort();
    await boot(page, s, { oldSave: true });
    const st = await stored(page);
    expect(st.v).toBe(2);
    expect(Object.keys(st).filter(k => !keys.includes(k))).toEqual([]);
    for (const k of Object.keys(st.flags)) if (/km_|kr_|kilnmouth/.test(k)) expect(before[k], k).toBeDefined();
    expect(await page.evaluate(() => [PPKm.mapVisited('kilnmouth', 'hearthmoor'), PPKm.mapVisited('km_road', 'hearthmoor')])).toEqual([false, false]);
    // A save already in town: no visit is counted at load; the road's mouth counts one, once a game day.
    await page.evaluate(() => { for (const [k, v] of Object.entries({ 'story.hc_gov_met': true, 'story.km_assigned': true })) PixelPets.setFlag(k, v); });
    await goto(page, 'km_road', 27, 1, 'up'); await step(page, 'up');
    await expect.poll(() => where(page).then(w => w.map)).toBe('kilnmouth');
    expect((await flags(page))['story.km_visits']).toBe(1);
    await goto(page, 'km_road', 27, 1, 'up'); await step(page, 'up');
    await expect.poll(() => where(page).then(w => w.map)).toBe('kilnmouth');
    expect((await flags(page))['story.km_visits']).toBe(1);
    expect((await stored(page)).flags['story.km_visits']).toBe(1);   // saved on arrival
  });
});

test.describe('KILNMOUTH: words and pacing (K-T10, ACT2_PACING §3)', () => {
  test('K-T10 @w1: every new line: 110 characters at most, no banned or franchise words, no "trainer", no chip words, no "mint"', async () => {
    const lines = [];
    const walk = (v, where) => { if (typeof v === 'string') lines.push([where, v]); else if (Array.isArray(v)) v.forEach((x, i) => walk(x, where + '.' + i)); else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, where + '.' + k); };
    for (const m of Object.values(KM.maps)) for (const o of m.objs) { walk(o.lines, o.id); walk(o.text, o.id); walk(o.deny, o.id); }
    walk(KM.scenes, 'scenes'); for (const [id, t] of Object.entries(KM.trainers)) walk(t.lines, id);
    const q = fs.readFileSync(path.join(ROOT, 'quests.js'), 'utf8').match(/id: 'km_[a-z]+'[^}]*\}/g).join('\n');
    expect(lines.length).toBeGreaterThan(60);
    const banned = /\b(fainted|evolve[sd]?|coins?|appeared|trainers?|\w+dex|mint|chip|implant|relay|alien)\b|Go, [A-Z]|poke/i;
    const brand = String.fromCharCode.apply(null, require('../tools/scans/wording').BRAND_CODES);   // never written out (AGENTS rule 1)
    for (const [where, t] of lines) {
      if (t.startsWith('@') || /^!?(chip|map|story|seal|bag):[\w.]+$/.test(t) || /^!?story\./.test(t)) continue;   // a scene key or a condition, not a line
      expect(Array.from(t).length, where + ': ' + t).toBeLessThanOrEqual(110);
      expect(t, where).not.toMatch(banned);
      expect(t.toLowerCase(), where).not.toContain(brand);
      expect(t, where).not.toMatch(/  |’|“/);
    }
    expect(q).not.toMatch(banned);
    expect(q.toLowerCase()).not.toContain(brand);
    expect(q).toMatch(/Kilnmouth/);
  });

  test('pacing @w1: the road is 52 tiles mouth to mouth (16 s), three holders at Lv 29-31, two fresh B10 holders at 35-37, the Lantern House 6 tiles in', async () => {
    const m = KM.maps.km_road, walkable = new Set('gtpsBoyC'.split('').filter(c => c !== 'C'));
    const blk = new Set(m.objs.filter(o => ['npc', 'sign', 'prop', 'trainer', 'wild'].includes(o.kind) && !o.when).map(o => o.x + ',' + o.y));
    const dist = (grid, from, goals, ok) => { const g = new Set(goals.map(p => p.join(','))), seen = new Map([[from.join(','), 0]]), q = [from];
      while (q.length) { const [x, y] = q.shift(), d = seen.get(x + ',' + y); if (g.has(x + ',' + y)) return d;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
          if (ny < 0 || nx < 0 || ny >= grid.length || nx >= grid[0].length || seen.has(k) || !ok(grid[ny][nx], k)) continue; seen.set(k, d + 1); q.push([nx, ny]); } }
      return null; };
    const road = dist(m.grid, [0, 25], [[26, 0], [27, 0], [28, 0], [29, 0]], (ch, k) => walkable.has(ch) && !blk.has(k));
    expect(road).toBeGreaterThanOrEqual(48); expect(road).toBeLessThanOrEqual(56);
    const t = KM.trainers, lv = id => t[id].team.map(x => x.level);
    for (const id of ['kr_holder_1', 'kr_holder_2', 'kr_holder_3']) { expect(Math.min(...lv(id))).toBeGreaterThanOrEqual(29); expect(Math.max(...lv(id))).toBeLessThanOrEqual(31); }
    for (const id of ['kr_b10_1', 'kr_b10_2'].filter(id => t[id])) { expect(Math.min(...lv(id))).toBeGreaterThanOrEqual(35); expect(Math.max(...lv(id))).toBeLessThanOrEqual(37); }
    expect(Object.values(t).filter(x => x.map === 'km_road').length).toBe(HAS.states ? 5 : 3);
    const town = KM.maps.kilnmouth, tw = new Set('gtpsoeuUbvqYhmB'.split(''));
    expect(dist(town.grid, [27, 38], [[31, 36]], ch => tw.has(ch))).toBeLessThanOrEqual(7);
    expect(dist(town.grid, [27, 38], [[24, 36]], ch => tw.has(ch))).toBeLessThanOrEqual(6);
  });
});
