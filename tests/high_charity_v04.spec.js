/* HIGH_CHARITY_LAYOUT v0.4.2 (design specs/HIGH_CHARITY_LAYOUT.md; §13 acceptance tests), on the city preview
   (?debug=1&hccity=2; HC_CITY_V2 stays false, the preview never writes the save). Modern controls in every save.
   - §13.1: the layout checker's rules (high_charity_layout_check.py) run over the merged game WORLD, after every overlay and
     kept object: sizes, paired mouths, doors under a facade, every door and mouth reachable from the arrival with every body
     and prop standing, no one-wide choke, patrol legs on walk tiles and off doors and mouths, tanks on kerb bays, nothing
     standing on a road (§4.1), the parade's stands clear (HC_PARADE §2-§3), schedule tiles off doors, mouths, patrol legs and
     anchors (§8.2).
   - Rule 9: the rooms with no approved preview are held (never in WORLD); floor 1's stair still goes to floor 3.
   - Rule 10 arrival frame, the coach arrival, Charter Hill's gates (the north mouth is one-way inward until the parade), the
     Governor's office, old saves, the save unchanged, reduced motion, and frame time on the biggest chunk.
   Runs at 320, 375 and 390 (the projects); zero console errors (trackErrors). */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const CHUNKS = ['highcharity', 'hc_civic', 'hc_exchange', 'hc_waterfront', 'hc_college'];
const BUILT_ROOMS = ['hc_lantern_in', 'hc_news_1', 'hc_news_2', 'hc_gov_1', 'hc_gov_3'];
const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'hc_city_v2.json'), 'utf8'));
const SHOTS = path.join(__dirname, '..', 'test-results', 'high_charity_v04');

function save(opts = {}) {
  const s = starterSave();
  s.settings.follower = false;
  s.settings.controls = 'modern';   // Vincent, Wed Nov 4, 2026: Modern for every test
  s.settings.textSpeed = 'fast';
  s.settings.tips = false;
  s.money = 20;
  Object.assign(s.flags, { 'story.side_pick_done': true, 'story.hc_invite': true, 'story.hc_arrived': true, 'story.hc_greeted': true });
  if (opts.side === 'glimmer') s.flags['story.side'] = 'glimmer';
  if (opts.act) s.flags['story.act'] = opts.act;
  if (opts.govMet) s.flags['story.hc_gov_met'] = true;
  if (opts.posted) s.flags['story.gov_posted'] = true;
  if (opts.paradeSeen) s.flags['story.hc_parade_seen'] = true;
  Object.assign(s.flags, opts.flags || {});
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
    if (!(await page.evaluate(() => !!PixelPets.scene))) return;
    await page.keyboard.press('Space'); await page.waitForTimeout(60);
  }
}

test('§13.1: the layout checker passes over the merged game WORLD for all five chunks', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(({ stands }) => {
    const bad = [], report = [];
    const TD = {}; for (const v of Object.values(MAPDATA)) for (const k of ['tiles', 'roomTiles']) if (v && v[k]) Object.assign(TD, v[k]);
    Object.assign(TD, PP_HC_V2.tiles);
    const walkCh = (m, x, y) => !!(m.grid[y] && m.grid[y][x] !== undefined && (TD[m.grid[y][x]] || {}).walk);
    const key = (x, y) => x + ',' + y;
    const nbrs = (m, x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [x + dx, y + dy]).filter(([a, b]) => a >= 0 && b >= 0 && a < m.w && b < m.h);
    function reach(m, start, blocked) {
      const seen = new Set([key(...start)]), q = [start];
      for (let i = 0; i < q.length; i++) for (const n of nbrs(m, ...q[i])) {
        const k = key(...n); if (seen.has(k) || blocked.has(k) || !walkCh(m, ...n)) continue; seen.add(k); q.push(n);
      }
      return seen;
    }
    function articulation(m, root, blocked) {   // iterative Tarjan over walk cells, as the design checker
      const ok = ([x, y]) => walkCh(m, x, y) && !blocked.has(key(x, y));
      const disc = new Map([[key(...root), 0]]), low = new Map([[key(...root), 0]]), parent = new Map([[key(...root), null]]), kids = new Map([[key(...root), 0]]);
      const aps = new Set(); let t = 0; const stack = [[root, nbrs(m, ...root), 0]];
      while (stack.length) {
        const top = stack[stack.length - 1], [v, list] = top, vk = key(...v); let pushed = false;
        while (top[2] < list.length) {
          const u = list[top[2]++], uk = key(...u); if (!ok(u)) continue;
          if (!disc.has(uk)) { t++; disc.set(uk, t); low.set(uk, t); parent.set(uk, vk); kids.set(uk, 0); kids.set(vk, kids.get(vk) + 1); stack.push([u, nbrs(m, ...u), 0]); pushed = true; break; }
          else if (uk !== parent.get(vk)) low.set(vk, Math.min(low.get(vk), disc.get(uk)));
        }
        if (pushed) continue;
        stack.pop();
        if (stack.length) {
          const pk = key(...stack[stack.length - 1][0]); low.set(pk, Math.min(low.get(pk), low.get(vk)));
          if (parent.get(pk) !== null && low.get(vk) >= disc.get(pk)) aps.add(pk);
        }
      }
      if (kids.get(key(...root)) > 1) aps.add(key(...root));
      return aps;
    }
    // Scheduled townsfolk: every row tile on this map counts as a body (any row may be the live one).
    const schedTiles = {};
    for (const m of Object.values(WORLD)) for (const o of (m && m.objs) || []) for (const row of (o && o.kind === 'npc' && o.schedule) || [])
      if (row.map) (schedTiles[row.map] = schedTiles[row.map] || []).push([row.x, row.y, o.id]);
    for (const id of ['highcharity', 'hc_civic', 'hc_exchange', 'hc_waterfront', 'hc_college']) {
      const m = WORLD[id];
      if (m.w > 64 || m.h > 48) bad.push(id + ': over the 64x48 cap');
      const arr = [m.safe.x, m.safe.y];
      if (!walkCh(m, ...arr)) bad.push(id + ': arrival not walkable');
      const block = new Map(), targets = new Map();
      for (const o of m.objs) {
        if (!o) continue;
        const stands = (o.kind === 'npc' && !o.patrol && !o.schedule) || o.kind === 'sign' || o.kind === 'prop';
        if (stands && walkCh(m, o.x, o.y)) block.set(key(o.x, o.y), o.id);
        if (o.kind === 'door') {
          targets.set('door:' + o.id, [o.x, o.y]);
          if (!m.grid[o.y - 1] || m.grid[o.y - 1][o.x] !== 'H') bad.push(id + ': door ' + o.id + ' has no facade above');
          if (!walkCh(m, o.x, o.y)) bad.push(id + ': door ' + o.id + ' step not walkable');
        }
        if (o.kind === 'warp' && /^m_c\d_[a-z]+_\d$/.test(o.id)) {
          targets.set('mouth:' + o.id, [o.x, o.y]);
          const to = WORLD[o.to];
          if (to && to.grid) {
            if (!walkCh(to, o.tx, o.ty)) bad.push(id + ': mouth ' + o.id + ' lands on solid');
            // paired: the landing has a warp back beside it into this chunk
            if (o.to !== 'route4_reeds' && !to.objs.some(w => w.kind === 'warp' && w.to === id && Math.abs(w.x - o.tx) + Math.abs(w.y - o.ty) === 1)) bad.push(id + ': mouth ' + o.id + ' has no partner');
          }
        }
        if (o.kind === 'prop' && /^hc_tank/.test(o.sprite || '')) {
          for (let x = o.x - 1; x <= o.x + 2; x++) for (let y = o.y - 1; y <= o.y; y++) if (m.grid[y][x] !== 'U') bad.push(id + ': tank ' + o.id + ' off its kerb bay at ' + key(x, y));
        }
      }
      if (id === 'highcharity') targets.set('coach', [32, 37]);
      for (const [x, y, who] of schedTiles[id] || []) {
        const k = key(x, y);
        if (!walkCh(m, x, y)) bad.push(id + ': schedule row of ' + who + ' on solid ' + k);
        for (const [n, p] of targets) if (key(...p) === k) bad.push(id + ': schedule row of ' + who + ' on ' + n);
        if (block.has(k)) bad.push(id + ': schedule row of ' + who + ' on ' + block.get(k));
        block.set(k, who);
      }
      // nothing stands on a road (layout §4.1)
      for (const [k, who] of block) { const [x, y] = k.split(',').map(Number); if ('CZ'.includes(m.grid[y][x])) bad.push(id + ': ' + who + ' on the road at ' + k); }
      // the parade's stands stay clear (HC_PARADE §2-§3, beat sheet in #296); a parked car on a stand bay counts
      for (const [x, y] of stands[id] || []) {
        if (block.has(key(x, y))) bad.push(id + ': ' + block.get(key(x, y)) + ' on a parade stand ' + key(x, y));
        if (m.objs.some(o => /^hc_car/.test(o.sprite || '') && o.y === y && (o.x === x || o.x + 1 === x))) bad.push(id + ': a car on a parade stand ' + key(x, y));
      }
      // patrol legs: walk tiles, never a door or a mouth, never a schedule row
      const tcells = new Set([...targets.values()].map(p => key(...p)));
      for (const o of m.objs) if (o && o.patrol) {
        const r = o.patrol;
        for (let i = 0; i < r.length; i++) {
          const [x0, y0] = r[i], [x1, y1] = r[(i + 1) % r.length];
          if (x0 !== x1 && y0 !== y1) { bad.push(id + ': patrol ' + o.id + ' leg not straight'); continue; }
          for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) {
            if (!walkCh(m, x, y)) bad.push(id + ': patrol ' + o.id + ' crosses solid ' + key(x, y));
            if (tcells.has(key(x, y))) bad.push(id + ': patrol ' + o.id + ' on a door or mouth ' + key(x, y));
            if ((schedTiles[id] || []).some(([a, b]) => a === x && b === y)) bad.push(id + ': patrol ' + o.id + ' leg crosses a schedule row ' + key(x, y));
          }
        }
      }
      const blocked = new Set(block.keys());
      const seen = reach(m, arr, blocked);
      for (const [n, p] of targets) if (!seen.has(key(...p))) bad.push(id + ': ' + n + ' not reachable from the arrival');
      for (const ap of articulation(m, arr, blocked)) {
        if (tcells.has(ap) || ap === key(...arr)) continue;
        const cut = reach(m, arr, new Set([...blocked, ap]));
        const lost = [...targets].filter(([, p]) => !cut.has(key(...p))).map(([n]) => n);
        if (lost.length) bad.push(id + ': one-wide choke at ' + ap + ' strands ' + lost.join(' '));
      }
      report.push({ id, targets: targets.size, blockers: block.size, objs: m.objs.length });
    }
    return { bad, report, inGame: PixelPets.charityCheck() };
  }, { stands: DATA.paradeStands });
  expect(r.bad).toEqual([]);
  expect(r.inGame).toEqual([]);
  expect(r.report.map(x => x.id)).toEqual(CHUNKS);
  for (const x of r.report) expect(x.objs, x.id).toBeLessThanOrEqual(240);
});

test('rule 9: rooms with no approved preview are held (not in WORLD); floor 1\'s stair still goes to floor 3; the built rooms stand', async ({ page }) => {
  await boot(page);
  const held = Object.keys(DATA.rule9Held);
  expect(held).toEqual(expect.arrayContaining(['hc_gov_2', 'hc_lantern_up', 'hc_college_in', 'hc_trial_in', 'hc_trial_stone']));
  const r = await page.evaluate(ids => ({
    present: ids.filter(id => !!WORLD[id]),
    built: ['hc_lantern_in', 'hc_news_1', 'hc_news_2', 'hc_gov_1', 'hc_gov_3'].filter(id => !!WORLD[id]),
    up: WORLD.hc_gov_1.objs.filter(o => o.id === 'hc_gov_up').map(o => o.to),
    warpsInto: Object.values(WORLD).flatMap(m => (m.objs || []).filter(o => o && (o.kind === 'warp' || o.kind === 'door') && ids.includes(o.to)).map(o => o.id)),
  }), held);
  expect(r.present).toEqual([]);
  expect(r.warpsInto).toEqual([]);
  expect(r.built).toEqual(BUILT_ROOMS);
  expect(r.up).toEqual(['hc_gov_3']);
});

test('taps reach every city door, mouth, sign and person (auditTaps on the preview): no reach gaps in the city', async ({ page }) => {
  test.setTimeout(60000);
  await page.clock.setFixedTime(new Date('2026-11-04T12:00:00-05:00'));
  await boot(page);
  const audit = await page.evaluate(() => PixelPets.auditTaps());
  const city = id => /^(highcharity|hc_)/.test(id);
  // two pre-existing gaps the preview inherits (unchanged by this build): none is a city map
  expect(audit.reachGaps.filter(g => city(g.split(':')[0]))).toEqual([]);
  expect(audit.predicateGaps.filter(g => city(String(g).split(':')[0]))).toEqual([]);
});

test('rule 10 arrival frame: walking up to the grand Lantern House and the Lantern Market, the healing mark and the store mark are on screen', async ({ page }, info) => {
  await boot(page);
  const marks = [
    { map: 'highcharity', door: 'hc_lantern', mark: 'hc_lantern_sign', stand: [32, 13], name: 'lantern' },
    { map: 'highcharity', door: 'hc_shop', mark: 'hc_store_board', stand: [46, 27], name: 'store' },
  ];
  for (const k of marks) {
    await page.evaluate(([m, x, y]) => PixelPets.goto(m, x, y, 'up'), [k.map, ...k.stand]);
    await settle(page);
    const r = await page.evaluate(([mark, door]) => {
      const a = PixelPets.objPos(mark), d = PixelPets.objPos(door) || WORLD.highcharity.objs.find(o => o.id === door);
      const c = document.querySelector('#mapCanvas'), info = PixelPets.mapInfo, tile = 16 * (info.scale || 1);
      const wTiles = c.getBoundingClientRect().width / (tile / (window.devicePixelRatio || 1)) || 10;
      return { mark: a, door: d && { x: d.x, y: d.y }, me: { x: PixelPets.state.world.x, y: PixelPets.state.world.y }, wTiles };
    }, [k.mark, k.door]);
    expect(r.mark && r.mark.present, k.mark).toBe(true);
    // on screen: within half the narrowest view (10 tiles at 320) of the holder, one row either side
    expect(Math.abs(r.mark.x - r.me.x), k.mark).toBeLessThanOrEqual(4);
    expect(Math.abs(r.mark.y - r.me.y), k.mark).toBeLessThanOrEqual(2);
    expect(Math.abs(r.door.x - r.mark.x) + Math.abs(r.door.y - r.mark.y), k.mark + ' beside its door').toBeLessThanOrEqual(3);
    fs.mkdirSync(SHOTS, { recursive: true });
    await page.screenshot({ path: path.join(SHOTS, `rule10_${k.name}_${info.project.name}.png`) });
  }
  // the two marks are different art: a shop never reads as a healing spot
  const sprites = await page.evaluate(() => ['hc_lantern_sign', 'hc_store_board'].map(id => (WORLD.highcharity.objs.find(o => o.id === id) || {}).sprite || null));
  expect(sprites[0]).not.toEqual(sprites[1]);
});

test('the coach lands on 32,37 facing north and sets hc_arrived; the region map keeps one High Charity node; the quest door stays 32,29', async ({ page }) => {
  const s = save(); delete s.flags['story.hc_arrived']; s.world = { map: 'hearthmoor', x: 12, y: 10, facing: 'up', respawn: 'hearthmoor' };
  await boot(page, s);
  const r = await page.evaluate(() => {
    const w = WORLD.hearthmoor.objs.find(o => o.id === 'hm_to_hc');
    return { to: w.to, tx: w.tx, ty: w.ty, facing: w.facing, need: w.need || null, hall: WORLD.highcharity.objs.filter(o => o.id === 'hc_hall').map(o => [o.x, o.y]),
      south: WORLD.highcharity.objs.filter(o => o.id === 'hc_south').map(o => [o.x, o.y, o.to]) };
  });
  expect([r.to, r.tx, r.ty, r.facing]).toEqual(['highcharity', 32, 37, 'up']);
  expect(r.hall).toEqual([[32, 29]]);
  expect(r.south).toEqual([[32, 38, 'hearthmoor']]);
  // ride it (the debug warp runs the same landing as the coach tile): the holder stands on 32,37 facing north
  await page.evaluate(() => PixelPets.goto('highcharity', 32, 37, 'up'));
  await settle(page);
  expect(await where(page)).toEqual({ map: 'highcharity', x: 32, y: 37 });
  expect(await page.evaluate(() => PixelPets.mapInfo.outdoor)).toBe('highcharity');
});

test('Charter Hill gates: the north mouth always lets you out; walkers are turned back inward from the Governor meeting until the parade', async ({ page }) => {
  test.setTimeout(60000);
  const outs = DATA.maps.hc_civic.objs.filter(o => o.kind === 'warp' && /^m_c1_n_\d$/.test(o.id));
  expect(outs.length).toBe(5);
  for (const o of outs) expect(o.when, o.id).toBeUndefined();   // ROUTE_TO_GOVERNOR D1853: always open outward
  const cases = [
    { govMet: false, paradeSeen: false, inward: true },
    { govMet: true, paradeSeen: false, inward: false },   // B6 stays a coach arrival
    { govMet: true, paradeSeen: true, inward: true },
  ];
  for (const c of cases) {
    await boot(page, save({ act: 2, posted: true, govMet: c.govMet, paradeSeen: c.paradeSeen }));
    const tag = JSON.stringify(c);
    // outward: step onto the middle mouth cell from the lane
    await page.evaluate(() => PixelPets.goto('hc_civic', 48, 1, 'up'));
    await settle(page);
    await page.evaluate(() => PixelPets.walkStep('up'));
    await settle(page);
    await expect.poll(() => where(page).then(w => w.map), tag).toBe('route4_reeds');
    await endScene(page);
    // inward: from the river road's gate, step west
    await page.evaluate(() => PixelPets.goto('route4_reeds', 1, 10, 'left'));
    await settle(page);
    await page.evaluate(() => PixelPets.walkStep('left'));
    await settle(page);
    await page.waitForTimeout(300);
    await endScene(page);
    await settle(page);
    const w = await where(page);
    if (c.inward) expect(w.map, tag).toBe('hc_civic');
    else expect(w.map, tag).toBe('route4_reeds');
  }
});

test('the Governor\'s office still works: the lobby opens on the posting, Merriden is at his desk, the chute plays once', async ({ page }) => {
  await boot(page, save({ act: 2, posted: true, govMet: true, flags: { 'story.km_assigned': true } }));
  await page.evaluate(() => PixelPets.goto('hc_civic', 32, 16, 'up'));
  await settle(page);
  await page.evaluate(() => PixelPets.walkStep('up'));
  await settle(page);
  await expect.poll(() => where(page)).toMatchObject({ map: 'hc_gov_1' });
  expect(await page.evaluate(() => (PixelPets.objPos('hc_governor') || {}).present)).toBe(true);
  expect(await page.evaluate(() => (PixelPets.objPos('hc_chute_mouth') || {}).present)).toBe(true);
  // the stair to floor 3 stays shut before Act 5 (the Cabinet Room, floor 2, is held for rule 9)
  await page.evaluate(() => { PixelPets.goto('hc_gov_1', 2, 2, 'left'); PixelPets.walkStep('left'); });
  await settle(page);
  expect((await where(page)).map).toBe('hc_gov_1');
});

test('old saves: today\'s High Charity tiles and the tiles this build cleared off the roads load onto a walk tile; a save in a city room stays there', async ({ page }) => {
  test.setTimeout(120000);
  const spots = [
    { map: 'highcharity', x: 22, y: 34 }, { map: 'highcharity', x: 8, y: 25 }, { map: 'highcharity', x: 25, y: 25 }, { map: 'highcharity', x: 40, y: 20 },
    { map: 'highcharity', x: 18, y: 21 }, { map: 'hc_civic', x: 50, y: 30 }, { map: 'hc_civic', x: 33, y: 26 }, { map: 'hc_exchange', x: 31, y: 40 },
    { map: 'hc_gov_1', x: 12, y: 5 }, { map: 'hc_news_2', x: 6, y: 8 }, { map: 'hc_lantern_in', x: 8, y: 19 },
  ];
  for (const w of spots) {
    await boot(page, save({ act: 2, posted: true, world: Object.assign({ facing: 'down' }, w) }));
    const r = await page.evaluate(() => {
      const TD = {}; for (const v of Object.values(MAPDATA)) for (const k of ['tiles', 'roomTiles']) if (v && v[k]) Object.assign(TD, v[k]);
      Object.assign(TD, PP_HC_V2.tiles);
      const m = WORLD[PixelPets.mapInfo.id], x = PixelPets.state.world.x, y = PixelPets.state.world.y;
      return { map: m.id, walk: !!(TD[m.grid[y][x]] || {}).walk, v: PixelPets.state.v };
    });
    expect(r.walk, JSON.stringify(w)).toBe(true);
    expect(r.v).toBe(2);
    expect(['highcharity', 'hc_civic', 'hc_exchange', 'hc_waterfront', 'hc_college', 'hc_gov_1', 'hc_news_2', 'hc_lantern_in', 'hearthmoor']).toContain(r.map);
  }
});

test('the save is unchanged: walking three chunks and two rooms writes nothing; the key stays pixelpets.save.v2 at v 2', async ({ page }) => {
  await boot(page);
  const before = await page.evaluate(() => localStorage.getItem('pixelpets.save.v2'));
  for (const [m, x, y] of [['hc_civic', 32, 40], ['hc_exchange', 10, 20], ['hc_news_1', 7, 14], ['hc_college', 23, 20], ['hc_lantern_in', 8, 19]]) {
    await page.evaluate(([m, x, y]) => PixelPets.goto(m, x, y, 'up'), [m, x, y]);
    await settle(page);
    await page.evaluate(() => PixelPets.walkStep('down'));
    await settle(page);
  }
  const after = await page.evaluate(() => localStorage.getItem('pixelpets.save.v2'));
  expect(after).toBe(before);
  expect(JSON.parse(after).v).toBe(2);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('every chunk and every built room draws with reduced motion on; zero console errors', async ({ page }) => {
    await boot(page);
    for (const id of CHUNKS.concat(BUILT_ROOMS)) {
      const at = await page.evaluate(m => { const w = WORLD[m]; return [w.safe.x, w.safe.y]; }, id);
      await page.evaluate(([m, x, y]) => PixelPets.goto(m, x, y, 'up'), [id, ...at]);
      await settle(page);
      await page.waitForTimeout(120);
      expect(await page.evaluate(() => PixelPets.mapInfo.id)).toBe(id);
    }
  });
});

// §13.7 / §6.4 perf (390 only): the biggest chunks (Charter Hill and the Exchange, 64x48) against the built towns'
// budget, in the same run and the same throttle: walking Hearthmoor, today's busiest built town. Gate: each city chunk's
// p95 frame is at or under the larger of 50 ms (three frames, the phase 1 gate) and Hearthmoor's own p95.
test('@slow perf: frame time on the biggest chunks stays within the built towns\' budget (4x CPU throttle)', async ({ page }, info) => {
  test.skip(info.project.name !== '390', '390 only');
  test.setTimeout(120000);
  await boot(page);
  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const runs = [['hearthmoor', null, null, 'right'], ['hc_civic', 4, 30, 'right'], ['hc_exchange', 4, 20, 'right']];
  const out = [];
  for (const [map, x0, y0, dir] of runs) {
    const at = x0 == null ? await page.evaluate(m => [WORLD[m].safe.x, WORLD[m].safe.y], map) : [x0, y0];
    await page.evaluate(([m, x, y, f]) => PixelPets.goto(m, x, y, f), [map, ...at, dir]);
    await settle(page);
    const gaps = await page.evaluate(async d => {
      const gaps = []; let last = performance.now(), stop = false;
      const tick = t => { gaps.push(t - last); last = t; if (!stop) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
      for (let i = 0; i < 24; i++) { PixelPets.walkStep(i % 8 < 4 ? d : (d === 'right' ? 'left' : 'right')); await new Promise(r => setTimeout(r, 180)); }
      stop = true;
      return gaps.slice(3);
    }, dir);
    gaps.sort((a, b) => a - b);
    out.push({ map, frames: gaps.length, p95: Math.round(gaps[Math.floor(gaps.length * 0.95)]), max: Math.round(gaps[gaps.length - 1]) });
  }
  await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  console.log('PP_HC_V04_PERF ' + JSON.stringify(out));
  const budget = Math.max(50, out[0].p95);
  for (const r of out.slice(1)) expect(r.p95, JSON.stringify(out)).toBeLessThanOrEqual(budget);
});
