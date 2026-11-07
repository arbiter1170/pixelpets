/* HC_CITY_V2 switched on (Fri Nov 6, 2026; Vincent: "Act 2 fix: A: switch-on now, top priority"). The flag-on spec: every check here runs on
   the real live boot, plain ?debug=1 for the hooks (the only extra is debug=1; ?hccity is never passed) or no query at all.
   Why: on build 20261106-0301 the Keepers Act 2 rows gov_meet, km_report and cab_lead pointed at hc_gov_1, a room that existed only in the
   city, so every Keepers holder was stuck (Nina's write-up, reports/chief-of-staff/2026-11-06-QA_ACT2_HC_POINTER_from_nina.md).
   Covers: the Act 2 rows reach live rooms (Nina's proposed check), save.js sizes every city map so a save made in a new chunk or room
   reloads in place, old-city saves load safely (all 15 old door tiles, grass, all 13 moved rooms, the retired hc_apt_c and hc_buoy),
   the cut placeholder lines and the settled parade speech (D2130/D1428), save unchanged (key pixelpets.save.v2, v 2, no new key),
   reduced motion, and zero console errors. Runs at 320, 375 and 390. Never signs in or touches Firebase. */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { starterSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'hc_city_v2.json'), 'utf8'));
const CHUNKS = ['highcharity', 'hc_civic', 'hc_exchange', 'hc_waterfront', 'hc_college'];
const CITY_ROOMS = ['hc_lantern_in', 'hc_news_1', 'hc_news_2', 'hc_gov_1', 'hc_gov_2', 'hc_gov_3', 'hc_museum_in'];
const NEW_MAPS = ['hc_civic', 'hc_exchange', 'hc_waterfront', 'hc_college', 'hc_news_1', 'hc_news_2', 'hc_gov_1', 'hc_gov_2', 'hc_gov_3', 'hc_museum_in'];
// Today's 15 door tiles and five grass tiles of the old Lantern Square (data/highcharity.json), plus the retired hc_buoy's tile.
const OLD_DOORS = [[32, 4], [32, 9], [9, 11], [52, 9], [22, 13], [18, 17], [45, 15], [8, 25], [17, 25], [25, 25], [11, 29], [32, 29], [49, 29], [22, 34], [55, 35]];
const OLD_GRASS = [[3, 3], [60, 3], [40, 20], [5, 35], [60, 36], [10, 18]];
// The settled parade speech, design story/STORY_LINES_2026-11-04.md §2.1 (D2130, Vincent Nov 4; S2 is D1428's words), word for word.
const SPEECH = [
  'Citizens of High Charity. You were afraid, and you asked me for order. Today you will see it.',
  'From today, a Keeper stands on every road and at every Hall. Look up, and you will see us.',
  'Picking Day has run since the Great War. From today, it is closed to civilians, until order returns.',
  'Our schools will begin again at the first page. Every lesson will serve the lantern.',
  'Stand with Glimmerwell in our streets, and you will be fined. Stand there again, and you will be jailed.',
  'And to those in wine vests among us today: we see you.',
  'Keepers. Into the crowd.',
];

function save(opts = {}) {
  const s = starterSave();
  Object.assign(s.settings, { follower: false, controls: 'modern', textSpeed: 'fast', tips: false });
  s.money = 20;
  Object.assign(s.flags, { 'story.side_pick_done': true, 'story.hc_invite': true, 'story.hc_arrived': true, 'story.hc_greeted': true }, opts.flags || {});
  if (opts.act2) Object.assign(s.flags, { 'story.side': 'keepers', 'story.keeper_cadet': true, 'story.ilse_call_old': true, 'story.act': 2, 'story.gov_posted': true });
  s.world = Object.assign({ map: 'highcharity', x: 32, y: 37, facing: 'up', respawn: 'hearthmoor' }, opts.world || {});
  return s;
}
// Seeds the save once per tab (sessionStorage guards it), so a page.reload() reads what the game itself wrote.
async function boot(page, s, q = '?debug=1', opts = {}) {
  if (opts.reduce) await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(({ s }) => {
    if (!sessionStorage.getItem('pp_seeded')) {
      const d = new Date();
      const day = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      s.flags['daily.hello'] = day; s.flags['daily.warm_bowl'] = day; s.last = Date.now();
      localStorage.setItem('pixelpets.save.v2', JSON.stringify(s));
      sessionStorage.setItem('pp_seeded', '1');
    }
    localStorage.setItem('pixelpets.geo', 'deny'); localStorage.setItem('pixelpets.mute', '1');
  }, { s });
  await gotoGame(page, q);
  await page.waitForFunction(() => window.PixelPets && PixelPets.state && PixelPets.state.party[0]);
  await page.evaluate(() => { PixelPets.showTab('walk'); if (PixelPets.clearWild) PixelPets.clearWild(); });
}
async function settle(page) { await expect.poll(() => page.evaluate(() => !PixelPets.fading)).toBe(true); }
const where = page => page.evaluate(() => ({ map: PixelPets.state.world.map, x: PixelPets.state.world.x, y: PixelPets.state.world.y }));
// A fresh tab for each seeded save: its own sessionStorage, so its seed runs. Errors flow into the test's own error list.
async function boot2(page, s, q = '?debug=1') {
  const p = await page.context().newPage();
  p.on('console', m => { if (m.type() === 'error') page.ppErrors.push(m.text()); });
  p.on('pageerror', e => page.ppErrors.push(e.message));
  await boot(p, s, q);
  return p;
}

test('live boot, plain ?debug=1: the city is on, not a preview, and save.js sizes every city map to its real size (hc_lantern_in is 16x22)', async ({ page }) => {
  await boot(page, save());
  const r = await page.evaluate(({ maps, rooms }) => {
    const out = { hc: PixelPets.hcCity(), bad: [], seen: null };
    for (const id of maps.concat(rooms)) {
      const w = WORLD[id], z = PPSave.MAP_SIZE[id];
      if (!w) out.bad.push(id + ': not in WORLD');
      else if (!z || z[0] !== w.w || z[1] !== w.h) out.bad.push(id + ': MAP_SIZE ' + JSON.stringify(z) + ' vs ' + w.w + 'x' + w.h);
      if (!PPSave.MAPS.includes(id)) out.bad.push(id + ': not in PPSave.MAPS');
    }
    out.lantern = PPSave.MAP_SIZE.hc_lantern_in;
    // D224: floorSeen keys are real map ids; the city's rooms must survive normalizeV2
    const raw = JSON.parse(localStorage.getItem('pixelpets.save.v2')); raw.floorSeen = {};
    for (const id of rooms) raw.floorSeen[id] = 1;
    out.seen = Object.keys(PPSave.normalizeV2(raw).floorSeen || {}).sort();
    out.v = PPSave.normalizeV2(raw).v;
    return out;
  }, { maps: CHUNKS, rooms: CITY_ROOMS });
  expect(r.hc.on && r.hc.ship && !r.hc.preview).toBe(true);
  expect(r.bad).toEqual([]);
  expect(r.lantern).toEqual([16, 22]);
  expect(r.seen).toEqual(CITY_ROOMS.slice().sort());
  expect(r.v).toBe(2);
});

test('live boot with no query at all: the holder stays in the Governor\'s House on reload, the hooks stay inert, and the new maps are in the save sizes', async ({ page }) => {
  await boot(page, save({ world: { map: 'hc_gov_1', x: 7, y: 12, facing: 'up' } }), '');
  const r = await page.evaluate(() => ({ debug: PixelPets.debug, hc: typeof PixelPets.hcCity === 'function' ? PixelPets.hcCity() : null, world: typeof window.WORLD,
    city: !!window.PP_HC_V2, size: PPSave.MAP_SIZE.hc_gov_1, map: PixelPets.mapInfo.id, at: [PixelPets.state.world.x, PixelPets.state.world.y], v: PixelPets.state.v }));
  expect(r).toEqual({ debug: false, hc: null, world: 'undefined', city: true, size: [16, 16], map: 'hc_gov_1', at: [7, 12], v: 2 });
});

// Nina's proposed check (QA_ACT2_HC_POINTER): every quest row that points somewhere points at a map that exists on the live boot, each npcId
// stands on that map, and a holder can walk there from Hearthmoor through doors and warps. The Act 2 rows are asserted by name.
test('the Keepers Act 2 rows (gov_meet, km_report, cab_lead and the rows after) point at live rooms: target maps exist, npcIds stand there, doors reach them', async ({ page }) => {
  await boot(page, save({ act2: true }), '?debug=1');
  const r = await page.evaluate(() => {
    const rows = PPQuests.CHAIN.concat(PPQuests.SIDE || []);
    const out = { missing: [], npcMissing: [], act2: {}, unreachable: [], from: null, firstAct2: PPQuests.CHAIN.findIndex(e => e.id === 'gov_meet') };
    // map graph: every door and warp with a `to` (a `city` override is applied by the game when the city is on)
    const edges = {};
    for (const [id, m] of Object.entries(WORLD)) for (const o of m.objs || []) if (o.to && WORLD[o.to]) (edges[id] = edges[id] || new Set()).add(o.to);
    const seen = new Set(['hearthmoor']), q = ['hearthmoor'];
    while (q.length) { const m = q.shift(); for (const t of edges[m] || []) if (!seen.has(t)) { seen.add(t); q.push(t); } }
    out.from = seen.size;
    const from = PPQuests.CHAIN.findIndex(e => e.id === 'gov_meet');
    for (const e of rows) {
      const act2on = PPQuests.CHAIN.indexOf(e) >= from;   // npcIds are checked from gov_meet on (earlier rows name scheduled people placed by the clock, e.g. fen_hall)
      const ent = [e].concat(e.glimmer ? [e.glimmer] : []);
      for (const x of ent) {
        const t = x.target || e.target;
        if (!t) continue;
        if (!WORLD[t.map]) { out.missing.push(e.id + ' -> ' + t.map); continue; }
        if (act2on) for (const nid of (x.npcIds || e.npcIds || [])) if (!WORLD[t.map].objs.some(o => o.id === nid)) out.npcMissing.push(e.id + ': ' + nid + ' not on ' + t.map);
      }
      if (act2on && e.target && WORLD[e.target.map] && !seen.has(e.target.map)) out.unreachable.push(e.id + ' -> ' + e.target.map);
      if (['gov_meet', 'km_report', 'cab_lead', 'cab_seat'].includes(e.id)) out.act2[e.id] = { map: e.target.map, npcIds: e.npcIds || [] };
    }
    return out;
  });
  expect(r.missing, 'target maps that do not exist on the live boot').toEqual([]);
  expect(r.npcMissing, 'npcIds not on their target map').toEqual([]);
  expect(r.unreachable, 'Act 2 target maps no door or warp reaches from Hearthmoor (the dream rooms are reached by scenes, earlier in the chain)').toEqual([]);
  expect(r.firstAct2).toBeGreaterThan(0);
  expect(Object.keys(r.act2).sort()).toEqual(['cab_lead', 'cab_seat', 'gov_meet', 'km_report']);
  expect(r.act2.gov_meet).toEqual({ map: 'hc_gov_1', npcIds: ['hc_governor'] });
  expect(r.act2.km_report.map).toBe('hc_gov_1');
  expect(r.act2.cab_lead.map).toBe('hc_gov_1');
  expect(r.act2.cab_lead.npcIds).toContain('cab_lumen_lobby');
});

test('the Governor\'s House is reachable on foot from the Hearthmoor coach: Charter Hill, the door at 32,16, hc_gov_1, and the meeting starts there', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page, save({ act2: true }), '?debug=1');
  const r = await page.evaluate(() => {
    const m = WORLD.hc_civic, door = m.objs.find(o => o.kind === 'door' && o.to === 'hc_gov_1');
    return { door: door && { x: door.x, y: door.y }, gov: !!WORLD.hc_gov_1.objs.find(o => o.id === 'hc_governor'),
      scene: !!(window.PP_HC_V2.scenes && PP_HC_V2.scenes.hc_gov_meet),
      riverWarp: Object.values(WORLD.route4_reeds.objs).filter(o => o.to === 'hc_civic').map(o => ({ x: o.x, y: o.y })) };
  });
  expect(r.door).toEqual({ x: 32, y: 16 });
  expect(r.gov).toBe(true);
  expect(r.scene).toBe(true);
  expect(r.riverWarp.length, 'the river road lands on Charter Hill (ROUTE_TO_GOVERNOR §5.9)').toBeGreaterThan(0);
  await page.evaluate(() => PixelPets.goto('hc_civic', 32, 16, 'up'));   // the door tile; the step up goes in (as tests/governor_meeting.spec.js does)
  await settle(page);
  await page.evaluate(() => PixelPets.walkStep('up'));
  await expect.poll(() => where(page).then(w => w.map), { timeout: 15000 }).toBe('hc_gov_1');
});

test('a save made in each new chunk and room reloads in place (the thing the old preview could not do): five chunks, seven rooms', async ({ page }) => {
  test.setTimeout(150000);
  await boot(page, save());
  const spots = await page.evaluate(ids => ids.map(id => {
    PixelPets.goto(id);
    const info = PixelPets.mapInfo, bad = new Set(info.objs.filter(o => ['warp', 'door', 'mat'].includes(o.kind) || /_mat$/.test(o.id || '')).map(o => o.x + ',' + o.y));
    let best = null;
    for (let y = 1; y < info.h - 1; y++) for (let x = 1; x < info.w - 1; x++) {
      const t = PixelPets.tileInfo(x, y);
      if (t.walk && !t.blocked && !bad.has(x + ',' + y) && (!best || x + y > best.x + best.y)) best = { x, y };
    }
    return { id, w: info.w, h: info.h, ...best };
  }), CHUNKS.concat(CITY_ROOMS));
  expect(spots.filter(s => s.x == null)).toEqual([]);
  for (const sp of spots) {
    await page.evaluate(s => PixelPets.goto(s.id, s.x, s.y, 'down'), sp);
    await settle(page);
    expect(await where(page), 'placed ' + sp.id).toEqual({ map: sp.id, x: sp.x, y: sp.y });
    await page.reload();
    await page.waitForFunction(() => window.PixelPets && PixelPets.state && PixelPets.state.party[0]);
    await expect.poll(() => where(page), 'reloaded in ' + sp.id).toEqual({ map: sp.id, x: sp.x, y: sp.y });
    await page.evaluate(() => { PixelPets.showTab('walk'); });
  }
  // the far corner of the 16x22 Lantern House is outside the old 9x7 room, so the old size would have clamped or reset it
  const lan = spots.find(s => s.id === 'hc_lantern_in');
  expect(lan.x + lan.y).toBeGreaterThan(9 + 7);
});

test('a save written by the game in a new room survives the key and shape rules: key pixelpets.save.v2, v 2, no new top-level key', async ({ page }) => {
  await boot(page, save({ world: { map: 'hc_gov_1', x: 7, y: 12, facing: 'up' } }));
  const before = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('pixelpets.save.v2'))).sort());
  await page.evaluate(() => { PixelPets.goto('hc_museum_in', 7, 8, 'up'); });
  await settle(page);
  await page.reload();
  await page.waitForFunction(() => window.PixelPets && PixelPets.state && PixelPets.state.party[0]);
  const after = await page.evaluate(() => { const o = JSON.parse(localStorage.getItem('pixelpets.save.v2')); return { keys: Object.keys(o).sort(), v: o.v, map: o.world.map, all: Object.keys(localStorage).filter(k => /^pixelpets\.save/.test(k)) }; });
  expect(after.v).toBe(2);
  expect(after.map).toBe('hc_museum_in');
  for (const k of before) expect(after.keys, 'no save key is removed: ' + k).toContain(k);
  expect(after.all).toEqual(['pixelpets.save.v2']);
});

test('old saves in the old Lantern Square: all 15 old door tiles, grass and the retired hc_buoy tile load onto a walk tile (the same tile, else safeSpot 32,37)', async ({ page }) => {
  test.setTimeout(240000);
  const bad = [];
  for (const [x, y] of OLD_DOORS.concat(OLD_GRASS)) {
    const p = await boot2(page, save({ world: { map: 'highcharity', x, y, facing: 'down' } }));
    const r = await p.evaluate(() => { const w = PixelPets.state.world, t = PixelPets.tileInfo(w.x, w.y); return { map: PixelPets.mapInfo.id, x: w.x, y: w.y, walk: t.walk && !t.blocked }; });
    if (r.map !== 'highcharity' || !r.walk || !((r.x === x && r.y === y) || (r.x === 32 && r.y === 37))) bad.push([x, y, r]);
    await p.close();
  }
  expect(bad).toEqual([]);
});

test('old saves inside the 13 moved rooms: each loads on a walk tile of its own room, a path leads to the exit, and the mat lands on the new door in the new chunk', async ({ page }) => {
  test.setTimeout(300000);
  // (no main tab is booted here: two tabs of one browser share localStorage, and an idle tab's autosave would overwrite the seeded save)
  const rooms = Object.entries(DATA.matMoves).map(([rid, mv]) => ({ rid, ...mv }));
  expect(rooms.length).toBe(13);
  const bad = [];
  for (const mv of rooms) {
    const p = await boot2(page, save({ world: { map: mv.rid, x: 4, y: 5, facing: 'down' } }));
    const r = await p.evaluate(mv => {
      const w = PixelPets.state.world, t = PixelPets.tileInfo(w.x, w.y), room = WORLD[mv.rid];
      const mat = room.objs.find(o => o.id === mv.mat) || room.objs.find(o => o.kind === 'door' || o.kind === 'warp');
      const stand = { x: mat.x, y: mat.y - 1 };
      return { map: PixelPets.mapInfo.id, x: w.x, y: w.y, walk: t.walk && !t.blocked, mat: { x: mat.x, y: mat.y, to: mat.to, tx: mat.tx, ty: mat.ty },
        path: !!PixelPets.findPath([{ x: stand.x, y: stand.y }]) || (w.x === stand.x && w.y === stand.y) };
    }, mv);
    if (r.map !== mv.rid || !r.walk) bad.push([mv.rid, 'loaded off its room or onto a wall', r]);
    if (!r.path) bad.push([mv.rid, 'no path to the exit', r]);
    // the exit: stand on the tile above the mat and step onto it (the mall's upper floor has no mat: its stair door is the exit)
    if (mv.rid !== 'hc_mall_2') {
      await p.evaluate(m => { PixelPets.goto(m.rid, m.matX, m.matY - 1, 'down'); }, { rid: mv.rid, matX: r.mat.x, matY: r.mat.y });
      await settle(p);
      await p.evaluate(() => PixelPets.walkStep('down'));
      await expect.poll(() => p.evaluate(() => PixelPets.state.world.map), mv.rid).toBe(mv.to);
      const at = await p.evaluate(() => ({ x: PixelPets.state.world.x, y: PixelPets.state.world.y }));
      if (at.x !== r.mat.tx || at.y !== r.mat.ty) bad.push([mv.rid, 'landed', at, 'expected', r.mat.tx, r.mat.ty]);
    }
    await p.close();
  }
  expect(bad).toEqual([]);
});

test('retired ids hc_apt_c and hc_buoy strand nobody: no map, quest row, scene, flag or object names them', async ({ page }) => {
  await boot(page, save());
  const hits = await page.evaluate(() => {
    const out = [];
    for (const [id, m] of Object.entries(WORLD)) { if (/hc_apt_c|hc_buoy$/.test(id)) out.push('map ' + id); for (const o of m.objs || []) if (/^(hc_apt_c|hc_buoy)$/.test(o.id) || /^(hc_apt_c|hc_buoy)$/.test(o.to || '')) out.push(id + ':' + o.id); }
    const blob = JSON.stringify(PPQuests.CHAIN) + JSON.stringify(PPQuests.SIDE || []) + JSON.stringify(PP_HC_V2.scenes)
      + JSON.stringify(Object.keys(MAPDATA).map(k => MAPDATA[k] && MAPDATA[k].scenes || null));
    if (/hc_apt_c|"hc_buoy"/.test(blob)) out.push('quest or scene');
    return out;
  });
  expect(hits).toEqual([]);
  // the retired door's old tile (25,25) is covered by the old-door sweep above; here the keep table drops both ids explicitly
  expect(DATA.keep['highcharity:hc_apt_c']).toBeNull();
  expect(DATA.keep['highcharity:hc_buoy']).toBeNull();
});

test('the parade speech is the settled D2130 text word for word (S2 is D1428), and "the national draft" is gone', async () => {
  const lines = [];
  const walk = n => { if (!Array.isArray(n)) { if (n && typeof n === 'object') Object.values(n).forEach(walk); return; } if (n[0] === 'say' && n[1] === 'The President') lines.push(n[2]); n.forEach(walk); };
  walk(DATA.scenes.hc_parade_hill);
  expect(lines).toEqual(SPEECH);
  expect(JSON.stringify(DATA)).not.toMatch(/national draft|answer the roll/i);
});

test('no bracket text a holder can read: the three cut groups are fixed, the parade hooks are cut, and only the museum\'s 500-Acorn plaque prompt keeps [PLACEHOLDER]', async () => {
  const hits = [];
  const walk = (n, where) => {
    if (typeof n === 'string') { if (/\[PLACEHOLDER/.test(n)) hits.push(where + ': ' + n); return; }
    if (Array.isArray(n)) n.forEach(x => walk(x, where));
    else if (n && typeof n === 'object') for (const [k, v] of Object.entries(n)) if (k !== 'rankFlag' && k !== '_about' && k !== 'rule9Held') walk(v, where + '/' + k);
  };
  walk(DATA, '');
  // the plaque prompt appears in wm_give and wm_plaque (one string, two scenes); D2307-build item 4 keeps it
  expect(hits.every(h => /A plaque, then\. Which case gets your plate\?/.test(h)), hits.join('\n')).toBe(true);
  expect(hits.length).toBeGreaterThan(0);
  // any "[" in a player-read string (object lines, sign text, scene say/choice text) across all city data: only the plaque prompt may keep one
  const br = [];
  const walk2 = (n, where) => {
    if (typeof n === 'string') { if (/\[/.test(n) && !/A plaque, then\. Which case gets your plate\?/.test(n)) br.push(where + ': ' + n); return; }
    if (Array.isArray(n)) n.forEach((x, i) => walk2(x, where + '/' + i));
    else if (n && typeof n === 'object') for (const [k, v] of Object.entries(n)) walk2(v, where + '/' + k);
  };
  for (const k of ['maps', 'rooms', 'scenes', 'objPatch', 'linesPatch', 'roomPatch']) if (DATA[k]) walk2(DATA[k], k);
  expect(br, br.join('\n')).toEqual([]);
  expect(JSON.stringify(DATA.scenes.hc2_board)).not.toMatch(/FRIEND/);
  // the ten townsfolk else lines read in-world, and the parade's end hooks are gone
  const lines = JSON.stringify(DATA.maps) + JSON.stringify(DATA.rooms);
  expect(lines).not.toMatch(/Story writes it/);
  const hill = JSON.stringify(DATA.scenes.hc_parade_hill);
  expect(hill).not.toMatch(/D1362|D1363|next Keeper quest|next Glimmer quest/);
  expect(hill).toContain("The Event Hall booths stay covered until Ilse's letter arrives.");
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('a holder in the Governor\'s House reloads in place with reduced motion on; zero console errors', async ({ page }) => {
    test.setTimeout(60000);
    await boot(page, save({ act2: true, world: { map: 'hc_gov_1', x: 7, y: 12, facing: 'up' } }), '?debug=1', { reduce: true });
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
    await page.evaluate(() => PixelPets.goto('hc_exchange', 20, 20, 'up'));
    await settle(page);
    await page.reload();
    await page.waitForFunction(() => window.PixelPets && PixelPets.state && PixelPets.state.party[0]);
    await expect.poll(() => where(page)).toEqual({ map: 'hc_exchange', x: 20, y: 20 });
  });
});
