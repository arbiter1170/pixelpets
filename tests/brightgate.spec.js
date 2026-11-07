/* BRIGHTGATE_LAYOUT v0.2 (design specs/BRIGHTGATE_LAYOUT.md; D1478-D1499, D2000-D2009 settled; rule 9 previews approved):
   Glimmerwell's city, built by tools/build_brightgate.py into data/detail_zzzzz_brightgate.json. Widths are the Playwright
   projects (320, 375, 390); every save here is in Modern controls. The Bright Shuttle (§17.1, D2090/D2091) is the way in; it
   has its own spec (tests/bright_shuttle.spec.js), so these city saves have already ridden it once (story.bg_shuttle) and
   ?debug=1 places them. Save stays pixelpets.save.v2 with v 2; the only new flag is story.reached_brightgate (additive). The §13 acceptance list
   is matched test by test below (BG1-BG9); the layout checker's rules are ported onto the composed world in BG3. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const CHUNKS = { brightgate: [64, 40, 32, 37], bg_campus: [64, 48, 32, 46], bg_works: [64, 48, 2, 20], bg_oldtown: [64, 40, 62, 20], bg_partner: [48, 48, 1, 32] };
const ROOMS = ['bg_lantern_in', 'bg_store_in', 'bg_hq_lobby', 'bg_review_in', 'bg_gala_in', 'bg_hall_in'];
const RULE10 = { lantern: { door: [29, 34], marker: ['bg_lantern_sign', 28, 33, 'heal_lantern'] }, store: { door: [35, 34], marker: ['bg_store_board', 36, 33, 'acorn_board'] } };

function save(extra) {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.follower = false;
  s.settings.textSpeed = 'fast';
  s.settings.tips = false;
  s.flags['story.bg_shuttle'] = true;   // the first-ride narration on 32,37 is the shuttle spec's (BS1)
  Object.assign(s.flags, extra || {});
  return s;
}
async function boot(page, extra) {
  const s = save(extra);
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true && PixelPets.state);
  await page.evaluate(() => PixelPets.showTab('walk'));
  return s;
}
const settled = (page, id) => page.waitForFunction(m => PixelPets.mapInfo.id === m && !PixelPets.fading, id);
async function place(page, id) {
  const r = await page.evaluate(k => PixelPets.checkpoint(k), id);
  expect(r.ok, id + ' ' + r.reason).toBe(true);
  await settled(page, r.map);
  return r;
}
async function sayText(page) {
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.mode === 'say' && PixelPets.scene.full);
  return page.evaluate(() => PixelPets.scene.text);
}
async function closeSay(page) {
  for (let i = 0; i < 12 && await page.evaluate(() => !!PixelPets.scene); i++) { await page.keyboard.press('Space'); await page.waitForTimeout(80); }
}

test('BG1 the five districts and the rooms load at this width, Glimmerwell held, with the right size and arrival', async ({ page }) => {
  await boot(page);
  for (const [id, [w, h, x, y]] of Object.entries(CHUNKS)) {
    const ok = await page.evaluate(([m, x, y]) => !!PixelPets.goto(m, x, y, 'up'), [id, x, y]);
    expect(ok, id).toBe(true);
    await settled(page, id);
    const info = await page.evaluate(() => ({ id: PixelPets.mapInfo.id, w: PixelPets.mapInfo.w, h: PixelPets.mapInfo.h, safe: PixelPets.mapInfo.safe }));
    expect([info.w, info.h], id).toEqual([w, h]);
    const at = await page.evaluate(() => [PixelPets.state.world.x, PixelPets.state.world.y]);
    expect(at, id + ' arrival').toEqual([x, y]);
  }
  for (const id of ROOMS) {
    expect(await page.evaluate(m => !!PixelPets.goto(m), id), id).toBe(true);
    await settled(page, id);
  }
  // rooms belong to the city: their outdoor is the district their door stands in (respawn, "where am I")
  const outs = await page.evaluate(ids => ids.map(id => window.WORLD[id].outdoor), ROOMS);
  expect(outs).toEqual(['brightgate', 'brightgate', 'bg_campus', 'bg_campus', 'bg_campus', 'bg_oldtown']);
});

test('BG2 rule 10: a fresh arrival on 32,37 shows both doors and both markers with no scroll (D2001, D613, D615)', async ({ page }) => {
  const s = await boot(page);
  expect(s.flags['story.reached_brightgate']).toBeUndefined();
  const r = await place(page, 'bg_keeper');
  expect([r.map, r.x, r.y]).toEqual(['brightgate', 32, 37]);
  expect(await page.evaluate(() => PixelPets.state.flags['story.reached_brightgate'])).toBe(true);
  await page.waitForTimeout(250);
  const got = await page.evaluate((R) => {
    const v = PixelPets.viewTiles(), objs = PixelPets.mapObjs;
    const inView = (x, y) => x >= v.x - 0.01 && x + 1 <= v.x + v.w + 0.01 && y >= v.y - 0.01 && y + 1 <= v.y + v.h + 0.01;
    const rows = Object.values(R).map(k => {
      const m = objs.find(o => o.id === k.marker[0]);
      return { door: inView(...k.door), marker: inView(k.marker[1], k.marker[2]), at: m && [m.x, m.y, m.sprite] };
    });
    return { v, rows, heal: objs.filter(o => o.sprite === 'heal_lantern').map(o => o.id), acorn: objs.filter(o => o.sprite === 'acorn_board').map(o => o.id),
      doors: window.WORLD.brightgate.objs.filter(o => o.kind === 'door' && (o.id === 'bg_lantern' || o.id === 'bg_store')).map(o => [o.id, o.x, o.y, o.to]) };
  }, RULE10);
  for (const [i, k] of Object.values(RULE10).entries()) {
    expect(got.rows[i].door, k.marker[0] + ' door in view ' + JSON.stringify(got.v)).toBe(true);
    expect(got.rows[i].marker, k.marker[0] + ' marker in view ' + JSON.stringify(got.v)).toBe(true);
    expect(got.rows[i].at).toEqual([k.marker[1], k.marker[2], k.marker[3]]);
  }
  expect(got.heal).toEqual(['bg_lantern_sign']);       // no other Brightgate building carries the heart lantern
  expect(got.acorn).toEqual(['bg_store_board']);       // Bright Swap gives lanterns away; it is not a store
  expect(got.doors).toEqual([['bg_lantern', 29, 34, 'bg_lantern_in'], ['bg_store', 35, 34, 'bg_store_in']]);
});

test('BG3 the layout checker on the game data: sizes, mouths paired, doors under facades, every door and mouth reachable, no one-wide choke @w1', async ({ page }) => {
  test.setTimeout(90000);
  await boot(page);
  const problems = await page.evaluate((CH) => {
    const out = [], W = window.WORLD, MD = MAPDATA;
    const defs = Object.assign({}, MD.maps_slice.tiles, MD.interiors.tiles, MD.cobblecrest.tiles, MD.highcharity.tiles,
      ...Object.keys(MD).filter(k => k.startsWith('detail_')).sort().map(k => MD[k].tiles || {}));
    const walk = ch => !!(defs[ch] && defs[ch].walk);
    for (const [id, [w, h, ax, ay]] of Object.entries(CH)) {
      const m = W[id], g = m.grid;
      if (m.w > 64 || m.h > 48) out.push(id + ' over the town cap');
      if (g.length !== h || g.some(r => r.length !== w)) out.push(id + ' grid size');
      const block = new Set(m.objs.filter(o => (o.kind === 'npc' || o.kind === 'prop' || o.kind === 'sign') && walk(g[o.y][o.x]) && o.id !== 'bg_south').map(o => o.x + ',' + o.y));
      const bfs = (extra) => { const seen = new Set([ax + ',' + ay]), q = [[ax, ay]];
        while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h || seen.has(k) || block.has(k) || k === extra || !walk(g[ny][nx])) continue; seen.add(k); q.push([nx, ny]); } }
        return seen; };
      const seen = bfs(null), targets = [];
      for (const o of m.objs) {
        if (o.kind === 'door') {
          if (!walk(g[o.y][o.x])) out.push(id + ' door ' + o.id + ' on a solid tile');
          if (g[o.y - 1][o.x] !== 'H') out.push(id + ' door ' + o.id + ' has no facade above');
          targets.push(o);
        }
        if (o.kind === 'warp') {
          const to = W[o.to];
          if (!to) { out.push(id + ' warp ' + o.id + ' to a missing map'); continue; }
          // a skinned map (Kilnmouth's km_town, the works line's landing) reads its chars through its skin's walk table, as the game does
          const sk = to.skin && typeof SKINS !== 'undefined' && SKINS[to.skin], ch = to.grid[o.ty][o.tx];
          if (!((sk && sk.walk && sk.walk[ch] != null) ? sk.walk[ch] : walk(ch))) out.push(id + ' warp ' + o.id + ' lands on a solid tile');
          // paired: the landing has a warp back to this map within one tile
          const back = to.objs.some(b => b.kind === 'warp' && b.to === id && Math.abs(b.x - o.tx) + Math.abs(b.y - o.ty) === 1);
          if (!back) out.push(id + ' warp ' + o.id + ' has no warp back');
          targets.push(o);
        }
      }
      for (const t of targets) if (!seen.has(t.x + ',' + t.y)) out.push(id + ' ' + t.id + ' not reachable from the arrival');
      // one-wide choke: no articulation cell of the walk graph (off doors, warps and the arrival) cuts a door or warp off
      const key = (x, y) => x + ',' + y, ok = (x, y) => x >= 0 && y >= 0 && x < w && y < h && !block.has(key(x, y)) && walk(g[y][x]);
      const disc = {}, low = {}, par = {}, aps = new Set(); let t = 0;
      const stack = [[ax, ay, 0]]; disc[key(ax, ay)] = low[key(ax, ay)] = t++; par[key(ax, ay)] = null; let rootKids = 0;
      const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      while (stack.length) {
        const top = stack[stack.length - 1], [x, y, i] = top, k = key(x, y);
        if (i < 4) {
          top[2]++;
          const nx = x + D4[i][0], ny = y + D4[i][1], nk = key(nx, ny);
          if (!ok(nx, ny)) continue;
          if (disc[nk] === undefined) { disc[nk] = low[nk] = t++; par[nk] = k; if (k === key(ax, ay)) rootKids++; stack.push([nx, ny, 0]); }
          else if (nk !== par[k]) low[k] = Math.min(low[k], disc[nk]);
        } else {
          stack.pop();
          const p = par[k];
          if (p != null) { low[p] = Math.min(low[p], low[k]); if (par[p] != null && low[k] >= disc[p]) aps.add(p); }
        }
      }
      const tset = new Set(targets.map(t => key(t.x, t.y)).concat([key(ax, ay)]));
      for (const a of aps) {
        if (tset.has(a)) continue;
        const cut = bfs(a), lost = targets.filter(t => !cut.has(key(t.x, t.y)));
        if (lost.length) { out.push(id + ' one-wide choke at ' + a + ' strands ' + lost[0].id); break; }
      }
      // every R/H cell is painted by one roof-kit entry
      const own = {};
      for (const [nm, r] of Object.entries(m.roofs || {})) for (let y = r.y0; y <= r.y1; y++) for (let x = r.x0; x <= r.x1; x++) {
        if (own[x + ',' + y]) out.push(id + ' roof entries overlap at ' + x + ',' + y); own[x + ',' + y] = nm; }
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (g[y][x] === 'R' && !own[x + ',' + y]) out.push(id + ' roof cell ' + x + ',' + y + ' unpainted');
      if (m.objs.length > 240) out.push(id + ' over the 240 object budget');
      if (m.objs.filter(o => o.kind === 'npc').length > 24) out.push(id + ' over the 24 people budget');
    }
    const area = Object.keys(CH).reduce((a, id) => a + W[id].w * W[id].h, 0);
    if (area !== 13568) out.push('area ' + area);
    return out;
  }, CHUNKS);
  expect(problems).toEqual([]);
});

test('BG4 the Lantern House: twelve beds, the host at the alcove mouth explains healing on first entry, respawn 6,11 (D2009)', async ({ page }) => {
  await boot(page);
  await place(page, 'bg_keeper');
  await page.evaluate(() => PixelPets.goto('brightgate', 29, 34, 'up'));
  await settled(page, 'brightgate');
  await page.evaluate(() => PixelPets.walkStep('up'));
  await settled(page, 'bg_lantern_in');
  const first = await sayText(page);
  expect(first).toContain('Talk to a bed');
  for (let i = 0; i < 20 && await page.evaluate(() => !!PixelPets.scene); i++) {   // G1, G2, then "Got it"
    const got = page.locator('#sbChoices button', { hasText: 'Got it' });
    if (await got.count()) { await got.first().click(); } else { await page.keyboard.press('Space'); }
    await page.waitForTimeout(100);
  }
  const room = await page.evaluate(() => {
    const objs = window.WORLD.bg_lantern_in.objs, host = objs.find(o => o.id === 'bg_lantern_host');
    return { beds: objs.filter(o => o.sprite === 'rest_bed' && o.lines && o.lines.else === '@lantern_rest').length, host: host && [host.x, host.y, host.name],
      heard: PixelPets.state.flags['lantern.guide_heard'], spot: window.WORLD.bg_lantern_in.respawnSpot, note: (objs.find(o => o.id === 'bg_lantern_note') || {}).text,
      x: PixelPets.state.world.x, y: PixelPets.state.world.y };
  });
  expect(room.beds).toBe(12);
  expect(room.host).toEqual([4, 6, 'Lantern Host']);
  expect(room.heard).toBe(true);
  expect([room.x, room.y]).toEqual([6, 12]);
  expect(room.spot).toEqual({ x: 6, y: 11, facing: 'up' });
  expect(room.note).toContain('5 Acorns, or what you have');
  // a bed rests the whole party (the built lantern_rest flow), and this town becomes the respawn
  await page.evaluate(() => { PixelPets.setMoney(50); PixelPets.goto('bg_lantern_in', 2, 2, 'left'); });
  await settled(page, 'bg_lantern_in');
  await page.evaluate(() => PixelPets.walkStep('left'));
  await page.waitForFunction(() => PixelPets.scene);
  await closeSay(page);
  expect(await page.evaluate(() => PixelPets.state.world.respawn)).toBe('brightgate');
});

test('BG5 Bright Mart: the door leads in, the clerk runs the shop, and the mat leads back to the stop', async ({ page }) => {
  await boot(page);
  await place(page, 'bg_keeper');
  await page.evaluate(() => PixelPets.goto('brightgate', 35, 34, 'up'));
  await settled(page, 'brightgate');
  await page.evaluate(() => PixelPets.walkStep('up'));
  await settled(page, 'bg_store_in');
  const clerk = await page.evaluate(() => { const o = window.WORLD.bg_store_in.objs.find(x => x.id === 'bg_store_clerk'); return o && { shop: o.shop.length, title: o.shopTitle }; });
  expect(clerk).toEqual({ shop: 6, title: 'BRIGHT MART' });
  await page.evaluate(() => PixelPets.walkStep('down'));
  await settled(page, 'brightgate');
  expect(await page.evaluate(() => [PixelPets.state.world.x, PixelPets.state.world.y])).toEqual([35, 34]);
});

test('BG6 shut doors say their line, and the shuttle stop at 32,38 rides home to Hearthmoor (§5.4, §11, §17.1)', async ({ page }) => {
  await boot(page);
  await place(page, 'bg_keeper');
  const cases = [['brightgate', 55, 12, 'Residents only. Have a bright day!'], ['bg_campus', 52, 19, "By appointment. We'll call you."],
    ['bg_campus', 9, 17, 'Closed for an event. Have a bright day!'], ['bg_works', 43, 14, 'Fleet staff only.'], ['bg_campus', 11, 45, 'Staff only. Have a bright day!'],
    ['bg_oldtown', 46, 31, 'Closed. Lanterns are free at the Plaza now.'], ['bg_partner', 36, 29, 'Term starts soon. Have a bright day!']];
  for (const [m, x, y, line] of cases) {
    await page.evaluate(([m, x, y]) => PixelPets.goto(m, x, y, 'up'), [m, x, y]);
    await settled(page, m);
    await page.evaluate(() => PixelPets.walkStep('up'));
    expect(await sayText(page), m + ' ' + x + ',' + y).toBe(line);
    await closeSay(page);
    expect(await page.evaluate(() => PixelPets.mapInfo.id)).toBe(m);
  }
  await page.evaluate(() => PixelPets.goto('brightgate', 32, 37, 'down'));
  await settled(page, 'brightgate');
  await page.evaluate(() => PixelPets.walkStep('down'));
  await settled(page, 'hearthmoor');   // D2091: the bar is gone; the home mark lands beside the Lantern Coach
  expect(await page.evaluate(() => [PixelPets.state.world.x, PixelPets.state.world.y])).toEqual([18, 8]);
});

test('BG7 no mint anywhere in Brightgate: the arrival frame and every battle scene (D2000, §13 item 8) @w1', async ({ page }) => {
  await boot(page);
  await place(page, 'bg_keeper');
  await page.waitForTimeout(300);
  const r = await page.evaluate((ids) => {
    const L = PAL.l, rgb = [1, 3, 5].map(i => parseInt(L.slice(i, i + 2), 16)), out = {};
    const count = (c, W, H) => { const d = c.getContext('2d').getImageData(0, 0, W, H).data; let n = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i] === rgb[0] && d[i + 1] === rgb[1] && d[i + 2] === rgb[2]) n++; return n; };
    // the arrival frame, less the holder's own tile and the one beside it: the tracked-quest cue (D436) is UI drawn in PAL.l
    const cv = document.querySelector('#mapCanvas'), v = PixelPets.viewTiles(), me = PixelPets.state.world;
    const g = cv.getContext('2d'), mx = Math.round((me.x - v.x) * 16) - 16, my = Math.round((me.y - v.y) * 16) - 16;
    const d0 = g.getImageData(0, 0, cv.width, cv.height).data; let n0 = 0;
    for (let i = 0; i < d0.length; i += 4) { const p = i / 4, x = p % cv.width, y = (p / cv.width) | 0;
      if (x >= mx && x < mx + 64 && y >= my && y < my + 48) continue;
      if (d0[i] === rgb[0] && d0[i + 1] === rgb[1] && d0[i + 2] === rgb[2]) n0++; }
    out.walk = n0;
    for (const id of ids) for (const mode of ['day', 'night']) out[id + ' ' + mode] = count(PixelPets.battleSceneArt(id, 63, 83, mode), 63, 83);
    return out;
  }, Object.keys(CHUNKS).concat(ROOMS));
  for (const [k, n] of Object.entries(r)) expect(n, k).toBe(0);
});

test('BG8 the region map: Brightgate is one node for every district and room, on the north sheet', async ({ page }) => {
  await boot(page);
  const before = await page.evaluate(() => PixelPets.state.flags['story.reached_brightgate'] || false);
  expect(before).toBe(false);
  await place(page, 'bg_keeper');
  for (const id of ['bg_campus', 'bg_oldtown', 'bg_lantern_in']) {
    await page.evaluate(m => PixelPets.goto(m), id);
    await settled(page, id);
    const seen = await page.evaluate(() => Object.assign({}, PixelPets.state.mapSeen));
    expect(seen.brightgate, id).toBe(1);
  }
});

test('BG9 reduced motion and the save: v 2, keys additive, only story.reached_brightgate is new from the walk', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const s = await boot(page, { 'story.act': 2 });
  const keys0 = Object.keys(s).sort();
  await page.evaluate(() => PixelPets.goto('brightgate', 32, 37, 'up'));
  await settled(page, 'brightgate');
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  expect(after.v).toBe(2);
  for (const k of keys0) expect(Object.keys(after), k).toContain(k);
  const added = Object.keys(after.flags).filter(k => !(k in s.flags) && k.startsWith('story.'));
  expect(added).toEqual(['story.reached_brightgate']);
});

// §5.3-§5.4 and §13 items 5-6 (D1483, D1493, D2006, D2008): five saves at the lanyard gate. Debug act values stand in for the
// derived act. The gate is a pair of props that stand while it is shut; the west lift is floor 2's only way up.
const HOLDS = [
  ['a Keeper in Act 2', { 'story.act': 2 }, 'shut', "Visitors' hours end at five. It's five."],
  ['a Keeper with the undercover lanyard', { 'story.act': 2 }, 'shut', "Your name isn't on today's list.", { seal_glim_1: 1 }],
  ['an unswitched Keeper in Act 3', { 'story.act': 3 }, 'shut', "Visitors' hours end at five. It's five."],
  ['an open offer in Act 3 (Rook\'s guest)', { 'story.act': 3, 'story.a3_offer': true }, 'open'],
  ['an open offer after the Spire', { 'story.act': 3, 'story.a3_offer': true, 'story.solvane_met': true }, 'shut', "Visitors' hours end at five. It's five."],
  ['a switcher', { 'story.act': 3, 'story.side': 'glimmer', 'story.switched_a3': true }, 'open'],
];
for (const [who, flags, want, line, seals] of HOLDS) {
  test(`BG10 the lanyard gate for ${who}: ${want} (§5.4)`, async ({ page }) => {
    const s = save(flags); if (seals) s.seals = Object.assign({}, s.seals, seals);
    await installSave(page.context(), s, { quietDay: true });
    await gotoGame(page, '?debug=1');
    await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && PixelPets.state);
    await page.evaluate(() => { PixelPets.showTab('walk'); PixelPets.goto('bg_campus', 32, 18, 'up'); });
    await settled(page, 'bg_campus');
    await page.evaluate(() => PixelPets.walkStep('up'));          // every holder may enter the lobby
    await settled(page, 'bg_hq_lobby');
    expect(await page.evaluate(() => [PixelPets.state.world.x, PixelPets.state.world.y])).toEqual([7, 14]);
    const juniper = await page.evaluate(() => PixelPets.mapObjs.some(o => o.id === 'bg_juniper_desk'));
    expect(juniper, 'Juniper only while the offer is open').toBe(!!flags['story.a3_offer'] && !flags['story.switched_a3']);
    expect(await page.evaluate(() => PixelPets.mapObjs.some(o => o.x === 5 && o.y === 6)), 'no body at 5,6 (D1491)').toBe(false);
    await page.evaluate(() => PixelPets.goto('bg_hq_lobby', 7, 5, 'up'));
    await settled(page, 'bg_hq_lobby');
    const lift = await page.evaluate(() => !!PixelPets.findPath([{ x: 3, y: 1 }]));
    if (want === 'shut') {
      expect(lift, 'no lift with the gate shut').toBe(false);
      await page.evaluate(() => PixelPets.walkStep('up'));
      expect(await sayText(page)).toBe(line);
      await closeSay(page);
      expect(await page.evaluate(() => PixelPets.state.world.y)).toBe(5);
    } else {
      expect(lift, 'the west lift is reachable').toBe(true);
      await page.evaluate(() => PixelPets.goto('bg_hq_lobby', 3, 2, 'up'));
      await settled(page, 'bg_hq_lobby');
      await page.evaluate(() => PixelPets.walkStep('up'));
      await settled(page, 'bg_review_in');
      const floor2 = await page.evaluate(() => ({ at: [PixelPets.state.world.x, PixelPets.state.world.y],
        bodies: PixelPets.mapObjs.filter(o => o.kind === 'npc').map(o => [o.id, o.x, o.y]).sort() }));
      expect(floor2.at).toEqual([7, 12]);
      expect(floor2.bodies).toEqual([['bg_dorian_review', 11, 8], ['bg_quinn_review', 2, 1], ['bg_rook_review', 5, 2]]);
      // the one desk (6-7,3) stays empty: no body on any tile beside it (D2007); the stair to the wing is shut
      for (const [, x, y] of floor2.bodies) expect([[5, 3], [8, 3], [6, 2], [7, 2], [6, 4], [7, 4]].some(([a, b]) => a === x && b === y), 'beside the one desk').toBe(false);
      await page.evaluate(() => PixelPets.goto('bg_review_in', 13, 2, 'up'));
      await settled(page, 'bg_review_in');
      expect(await page.evaluate(() => PixelPets.state.world.y)).toBe(2);
    }
  });
}

test('BG11 the HQ floors and the gala carry no chip, Tuning or implant word, and Glow Care stays shut for a switcher (§13 item 5) @w1', async ({ page }) => {
  await boot(page, { 'story.act': 3, 'story.side': 'glimmer', 'story.switched_a3': true });
  const words = await page.evaluate(() => {
    const out = [], re = /\b(chip(ped|s)?|microchip\w*|tuning|implant\w*|mint)\b/i;
    for (const [id, m] of Object.entries(window.WORLD)) if (id === 'brightgate' || id.indexOf('bg_') === 0)
      for (const o of m.objs) for (const v of [o.text, o.deny, o.name].concat(Object.values(o.lines || {}))) if (typeof v === 'string' && re.test(v)) out.push(id + ':' + o.id);
    return out;
  });
  expect(words).toEqual([]);
  await page.evaluate(() => PixelPets.goto('bg_campus', 52, 19, 'up'));
  await settled(page, 'bg_campus');
  await page.evaluate(() => PixelPets.walkStep('up'));
  expect(await sayText(page)).toBe("By appointment. We'll call you.");
});

// §4.2-§4.5, §8 (D1488, D1489, D1492, D1494, D1498): the fleet, the staff and the tells. Art checks run on every sprite a
// Brightgate map names, so a mint pixel anywhere in the city's dressing fails (D2000).
test('BG12 the city is dressed: parked and gliding Cruisers, Concierges over the Campus only, Courtesy beats, the tells, no mint in any sprite @w1', async ({ page }) => {
  test.setTimeout(90000);
  await boot(page);
  const r = await page.evaluate(() => {
    const W = window.WORLD, ids = Object.keys(W).filter(id => id === 'brightgate' || id.indexOf('bg_') === 0);
    const L = [1, 3, 5].map(i => parseInt(PAL.l.slice(i, i + 2), 16)), minty = [];
    const sprites = new Set(); for (const id of ids) for (const o of W[id].objs) if (o.sprite) { sprites.add(o.sprite); sprites.add(o.sprite + '_l'); sprites.add(o.sprite + '_move'); sprites.add(o.sprite + '_move_l'); }
    for (const k of sprites) for (const img of [].concat(WART[k] || [])) {
      if (!img || !img.width) continue;
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      for (let i = 0; i < d.length; i += 4) if (d[i + 3] && d[i] === L[0] && d[i + 1] === L[1] && d[i + 2] === L[2]) { minty.push(k); break; }
    }
    const of = (id, f) => W[id].objs.filter(f);
    return {
      minty: [...new Set(minty)],
      parked: ids.map(id => of(id, o => /^bg_cs_/.test(o.id)).length),
      keeperSlot: of('brightgate', o => o.x >= 44 && o.x <= 46 && o.y === 36).length,
      glides: ids.map(id => of(id, o => o.kind === 'glide').map(o => [o.id, o.glide.x0, o.glide.x1, o.y])),
      concierge: ids.filter(id => of(id, o => /concierge/.test(o.sprite || '')).length),
      beats: ids.map(id => of(id, o => o.patrol).length),
      keeperPatrols: ids.reduce((a, id) => a + of(id, o => o.patrol && /keeper|officer/i.test(o.look || '')).length, 0),
      litter: ids.reduce((a, id) => a + of(id, o => /leaf_litter|puddle/.test(o.sprite || '')).length, 0),
      lamps: ids.map(id => of(id, o => o.sprite === 'bg_lamp_ring').length),
      lanterns: ['brightgate', 'bg_oldtown', 'bg_campus'].map(id => of(id, o => /^bg_flame_lantern_\d$/.test(o.id)).map(o => [o.x, o.y])[0]),
      budget: ids.filter(id => W[id].kind !== 'interior').map(id => [W[id].objs.length, W[id].objs.filter(o => o.kind === 'npc').length]),
    };
  });
  expect(r.minty, 'sprites with mint pixels').toEqual([]);
  expect(r.parked.slice(0, 5)).toEqual([2, 3, 2, 0, 0]);   // Gate Plaza 2, Campus 3, Works 2 (§4.3), in WORLD order
  expect(r.keeperSlot, 'the Keeper slot stays empty (D1498)').toBe(0);
  const lanes = r.glides.flat().filter(g => /^bg_cr_/.test(g[0]));
  expect(lanes.map(g => g.slice(1))).toEqual([[4, 26, 20], [4, 59, 23], [4, 26, 20]]);   // east-west, on the lane rows
  expect(r.concierge).toEqual(['bg_campus']);
  expect(r.keeperPatrols, 'no Keeper patrols in Brightgate (D1489)').toBe(0);
  expect(r.beats.slice(0, 5).every(n => n >= 1)).toBe(true);
  expect(r.litter).toBe(0);
  expect(r.lamps.slice(0, 5).map(n => n > 0)).toEqual([true, true, true, false, true]);   // Old Wick keeps its flame lanterns: no ring posts (§4.2)
  expect(r.lanterns).toEqual([[30, 25], [32, 27], [16, 16]]);   // D1492's three tiles
  for (const [n, people] of r.budget) { expect(n).toBeLessThanOrEqual(240); expect(people).toBeLessThanOrEqual(24); }
});

test('BG13 a Cruiser glides its lane and parks at the west end under reduced motion; it never blocks; the plaque sets its first-read flag', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.goto('brightgate', 14, 21, 'up'));
  await settled(page, 'brightgate');
  const xs = [];
  for (let i = 0; i < 4; i++) { xs.push(await page.evaluate(() => PixelPets.objPos('bg_cr_bg0_line').fx)); await page.waitForTimeout(700); }
  expect(new Set(xs.map(x => x.toFixed(1))).size, 'it moves').toBeGreaterThan(1);
  expect(await page.evaluate(() => PixelPets.findPath([{ x: 14, y: 19 }])), 'its lane stays walkable').toBeTruthy();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => [PixelPets.objPos('bg_cr_bg0_line').fx, PixelPets.objPos('bg_cr_bg0_line').moving])).toEqual([4, false]);
  await page.evaluate(() => PixelPets.goto('bg_campus', 30, 19, 'up'));
  await settled(page, 'bg_campus');
  await page.evaluate(() => PixelPets.walkStep('up'));
  expect(await sayText(page)).toBe('Founded as INSIGN. Brighter by nature.');
  await closeSay(page);
  expect(await page.evaluate(() => PixelPets.state.flags['story.bg_insign'])).toBe(true);
});

// Hall 4 (§5.2, §7; D1484 Act 2, D2005 the storm tower). Teams are PLACEHOLDER (marked placeholderTeam) at the beat sheet's
// levels until Design specs them; the room, the gating and the plinth lights are the build.
// Plays the open scene (and any battle it opens) to its end. `wild` befriends a scene encounter; trainers are won.
async function run(page, choices = []) {
  const left = choices.slice(), says = [];
  let won = false;
  for (let i = 0; i < 400; i++) {
    const st = await page.evaluate(() => {
      const s = window.PixelPets.scene, b = window.PixelPets.battle;
      return { scene: !!s, mode: s && s.mode, full: s && s.full, waiting: s && s.waiting, text: s && s.text,
        battle: !!(b && b.on), panel: b && b.panel, kind: b && b.kind };
    });
    if (!st.scene && !st.battle) return says;
    if (await page.locator('#btOk').isVisible().catch(() => false)) { await page.locator('#btOk').click(); await page.waitForTimeout(30); continue; }
    if (st.battle) {
      if (!won) {
        if (st.panel !== 'acts' && st.panel !== 'end') {
          if (await page.locator('#btMsg').isVisible().catch(() => false)) await page.locator('#btMsg').click();
          await page.waitForTimeout(30); continue;
        }
        await page.evaluate(k => { PixelPets.battle.textMs = 0; if (k === 'wild') PixelPets.forceBefriend(); else PixelPets.winBattle(); }, st.kind);
        won = true; await page.waitForTimeout(40); continue;
      }
      if (await page.locator('#btMsg').isVisible().catch(() => false)) await page.locator('#btMsg').click();
      await page.waitForTimeout(30); continue;
    }
    won = false;
    if (st.mode === 'choice' && st.full) {
      await page.waitForFunction(() => window.PixelPets.optionsReady === true);
      const label = left.shift();
      if (!label) throw new Error('choice "' + st.text + '" but the test had no answer left');
      await page.locator('#sbChoices button', { hasText: label }).first().click();
      await page.waitForTimeout(30); continue;
    }
    if (st.mode === 'say' && st.waiting) {
      if (!says.length || says[says.length - 1] !== st.text) says.push(st.text);
      await page.keyboard.press('Space'); await page.waitForTimeout(25); continue;
    }
    await page.waitForTimeout(30);
  }
  throw new Error('scene did not finish');
}

async function talk(page, map, x, y, facing) {
  await page.evaluate(([m, x, y, f]) => PixelPets.goto(m, x, y, f), [map, x, y, facing]);
  await settled(page, map);
  await page.keyboard.press('Space');
  await page.waitForFunction(() => !!PixelPets.scene || (PixelPets.battle && PixelPets.battle.on));
}
const ACT2 = { 'story.act': 2 };
test('BG14 Hall 4: shut before Act 2, the storm tower from Act 2, the crew before the Master, each win lights its rod, the dead rod stays dark', async ({ page }) => {
  test.setTimeout(120000);
  await boot(page, { 'story.act': 1 });
  await page.evaluate(() => PixelPets.goto('bg_oldtown', 32, 15, 'up')); await settled(page, 'bg_oldtown');
  await page.evaluate(() => PixelPets.walkStep('up'));
  expect(await sayText(page)).toBe('Closed for now.');
  await closeSay(page);
  await page.evaluate(() => PixelPets.setFlag('story.act', 2));
  await page.evaluate(() => PixelPets.walkStep('up'));
  await settled(page, 'bg_hall_in');
  expect(await page.evaluate(() => [PixelPets.state.world.x, PixelPets.state.world.y])).toEqual([7, 22]);
  const rods = () => page.evaluate(() => PixelPets.mapObjs.filter(o => /^bg_(rod|dead_rod)/.test(o.id)).map(o => o.id + ':' + o.sprite).sort());
  expect((await rods()).filter(r => r.endsWith(':bg_rod_lit'))).toEqual([]);
  const trainers = await page.evaluate(() => ['h4_crew_a', 'h4_crew_b', 'h4_crew_c', 'hall4_master'].map(id => { const o = window.WORLD.bg_hall_in.objs.find(x => x.id === id); return [id, o.x, o.y]; }));
  expect(trainers).toEqual([['h4_crew_a', 3, 12], ['h4_crew_b', 12, 12], ['h4_crew_c', 7, 7], ['hall4_master', 7, 2]]);
  // the Master waits for the crew
  await talk(page, 'bg_hall_in', 7, 3, 'up');
  expect(await sayText(page)).toContain('Light the three rods first');
  await closeSay(page);
  // each crew win lights its own rod, and only that one
  const lit = [];
  for (const id of ['h4_crew_a', 'h4_crew_b', 'h4_crew_c']) {
    await page.evaluate(id => PixelPets.forceTrainer(id), id);
    await run(page);
    lit.push(id);
    const now = (await rods()).filter(r => r.endsWith(':bg_rod_lit')).map(r => r.split(':')[0].replace('bg_rod_lit_', ''));
    expect(now.sort()).toEqual(lit.slice().sort());
  }
  expect((await rods()).filter(r => r.startsWith('bg_dead_rod'))).toEqual(['bg_dead_rod_7:bg_rod', 'bg_dead_rod_8:bg_rod']);
  // the Master: the Seal to whoever wins, Seal 4 and the quiet tail
  await talk(page, 'bg_hall_in', 7, 3, 'up');
  const says = await run(page);
  expect(says.join(' | ')).toContain("Storms aren't stopped, Cadet. They're moved.");
  const after = await page.evaluate(() => ({ seal: !!PixelPets.state.seals.seal_brightgate, f4: PixelPets.state.flags['story.seal4'], sky: PixelPets.state.flags['story.ada_sky'], v: PixelPets.state.v }));
  expect(after).toEqual({ seal: true, f4: true, sky: true, v: 2 });
  expect((await rods()).filter(r => r.startsWith('bg_dead_rod')).every(r => r.endsWith(':bg_rod'))).toBe(true);
});

test('BG15 Hall 4 teams are v0.2.1 §17.2: two Walklings per crew at Lv 32-33, Ada 33-35, moves explicit, no TIDE or BLOOM move @w1', async ({ page }) => {
  await boot(page, ACT2);
  const t = await page.evaluate(() => { const T = MAPDATA.detail_zzzzz_brightgate.trainers;
    return Object.fromEntries(['h4_crew_a', 'h4_crew_b', 'h4_crew_c', 'hall4_master'].map(id => [id, { n: T[id].team.length, lv: T[id].team.map(m => m.level),
      moves: T[id].team.every(m => Array.isArray(m.moves) && m.moves.length === 4), sight: T[id].sight, crew: T[id].crew || null, seal: T[id].seal || null }])); });
  for (const id of ['h4_crew_a', 'h4_crew_b', 'h4_crew_c']) { expect(t[id].n).toBe(2); expect(t[id].lv.every(l => l >= 32 && l <= 33)).toBe(true); expect(t[id].moves).toBe(true); expect(t[id].sight).toBe(8); }
  expect(t.hall4_master.lv).toEqual([33, 34, 35]);
  expect(t.hall4_master.crew).toEqual(['h4_crew_a', 'h4_crew_b', 'h4_crew_c']);
  expect(t.hall4_master.seal).toBe('seal_brightgate');
  // the Hall's foes load (an unknown form or move would drop the row at boot)
  expect(await page.evaluate(() => ['h4_crew_a', 'h4_crew_b', 'h4_crew_c', 'hall4_master'].every(id => PixelPets.forceTrainer && window.WORLD.bg_hall_in.objs.some(o => o.id === id)))).toBe(true);
});

// v0.2.1 §17.3-§17.5 (D2092-D2106 on their defaults): four optional holders, one placed dipper and no wild table; the bench
// rest; the missing lines; and the Bright Shuttle's legs, live since D2090/D2091 (tests/bright_shuttle.spec.js plays them).
test('BG16 v0.2.1: holders talk to battle, no wild rolls, the dipper once, the bench rests, the shuttle legs stand @w1', async ({ page }) => {
  test.setTimeout(90000);
  await boot(page, ACT2);
  const r = await page.evaluate(() => { const W = window.WORLD, T = MAPDATA.detail_zzzzz_brightgate.trainers;
    const ids = ['brightgate', 'bg_campus', 'bg_works', 'bg_oldtown', 'bg_partner'];
    return { holders: ids.map(id => W[id].objs.filter(o => o.kind === 'trainer').map(o => [o.id, o.x, o.y, T[o.id].sight])),
      spawns: ids.map(id => W[id].spawns), wilds: ids.map(id => W[id].objs.filter(o => o.kind === 'wild').map(o => [o.id, o.x, o.y, o.form, o.level])),
      shuttle: W.brightgate.objs.filter(o => /^bs_/.test(o.id)).map(o => [o.id, o.when]), hm: W.hearthmoor.objs.filter(o => /^(bs_|hs_)/.test(o.id)).map(o => o.id),
      bar: W.brightgate.objs.filter(o => o.id === 'bg_south').map(o => o.id) }; });
  expect(r.holders).toEqual([[['bg_h_board', 50, 27, 0]], [], [['bg_h_quay', 20, 36, 0]], [['bg_h_potter', 40, 32, 0]], [['bg_h_partner', 15, 39, 0]]]);
  expect(r.spawns).toEqual([null, null, null, null, null]);
  expect(r.wilds).toEqual([[], [], [], [['bg_wild_dipper', 17, 35, 'dipper/1', 32]], []]);
  expect(r.shuttle).toEqual([['bs_gate_home', ['story.reached_brightgate']], ['bs_gate_works', ['story.km_council']], ['bs_first_ride', ['!story.bg_shuttle']]]);
  expect(r.hm.sort()).toEqual(['bs_hearthmoor', 'hs_first_drop', 'hs_sign']);
  expect(r.bar).toEqual([]);   // the "no shuttle yet" bar left 32,38 when the shuttle went live
  // Hearthmoor's mark stands once a first visit is made (the arrival sets story.reached_brightgate)
  await page.evaluate(() => PixelPets.goto('brightgate', 32, 36, 'down')); await settled(page, 'brightgate');
  await page.evaluate(() => PixelPets.goto('hearthmoor', 16, 10, 'up')); await settled(page, 'hearthmoor');
  expect(await page.evaluate(() => PixelPets.mapObjs.some(o => o.id === 'bs_hearthmoor'))).toBe(true);
  // the bench by Hall 4's door rests the team (the built rest step)
  await page.evaluate(() => PixelPets.goto('bg_hall_in', 6, 22, 'left')); await settled(page, 'bg_hall_in');
  await page.evaluate(() => PixelPets.walkStep('left'));
  expect(await sayText(page)).toContain('You sit on the bench by the door.');
  await closeSay(page);
  // a district holder battles only on talk (sight 0): standing beside her starts nothing
  await page.evaluate(() => PixelPets.goto('brightgate', 49, 27, 'right')); await settled(page, 'brightgate');
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => !!(PixelPets.battle && PixelPets.battle.on))).toBe(false);
});

test('BG17 v0.2.1 lines: the clerk, the clock, and floor 2 as Rook\'s guest (§17.5)', async ({ page }) => {
  await boot(page, { 'story.act': 3, 'story.a3_offer': true });
  await page.evaluate(() => PixelPets.goto('bg_lantern_in', 6, 2, 'up')); await settled(page, 'bg_lantern_in');
  await page.evaluate(() => PixelPets.walkStep('up'));
  expect(await sayText(page)).toBe('A wall clock that ticks. The only one in Brightgate that does.');
  await closeSay(page);
  await page.evaluate(() => PixelPets.goto('bg_review_in', 7, 12, 'up')); await settled(page, 'bg_review_in');
  await page.evaluate(() => PixelPets.walkStep('up'));
  expect(await sayText(page)).toBe('Floor two. Rows of desks face one board. Every chair is pushed in.');
  await closeSay(page);
  expect(await page.evaluate(() => PixelPets.state.flags['story.bg_f2_guest'])).toBe(true);
  await page.evaluate(() => PixelPets.goto('bg_review_in', 6, 1, 'up')); await settled(page, 'bg_review_in');
  await page.evaluate(() => PixelPets.walkStep('up'));
  expect(await sayText(page)).toBe('The Outcomes Board. Every card is turned face down. Guests see the backs.');
  await closeSay(page);
  await page.evaluate(() => PixelPets.goto('bg_review_in', 13, 2, 'up')); await settled(page, 'bg_review_in');
  await page.evaluate(() => PixelPets.walkStep('up'));
  expect(await sayText(page)).toBe('The stair is roped off. A card on the rope: Staff only. Have a bright day!');
  await closeSay(page);
});
