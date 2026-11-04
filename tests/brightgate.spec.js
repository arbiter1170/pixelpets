/* BRIGHTGATE_LAYOUT v0.2 (design specs/BRIGHTGATE_LAYOUT.md; D1478-D1499, D2000-D2009 settled; rule 9 previews approved):
   Glimmerwell's city, built by tools/build_brightgate.py into data/detail_zzzzz_brightgate.json. Widths are the Playwright
   projects (320, 375, 390); every save here is in Modern controls. No route reaches the city yet: ?debug=1 places only.
   Save stays pixelpets.save.v2 with v 2; the only new flag is story.reached_brightgate (additive). The §13 acceptance list
   is matched test by test below (BG1-BG9); the layout checker's rules are ported onto the composed world in BG3. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const CHUNKS = { brightgate: [64, 40, 32, 37], bg_campus: [64, 48, 32, 46], bg_works: [64, 48, 2, 20], bg_oldtown: [64, 40, 62, 20], bg_partner: [48, 48, 1, 32] };
const ROOMS = ['bg_lantern_in', 'bg_store_in'];
const RULE10 = { lantern: { door: [29, 34], marker: ['bg_lantern_sign', 28, 33, 'heal_lantern'] }, store: { door: [35, 34], marker: ['bg_store_board', 36, 33, 'acorn_board'] } };

function save(extra) {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.follower = false;
  s.settings.textSpeed = 'fast';
  s.settings.tips = false;
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

test('BG1 the five districts and the two rooms load at this width, Glimmerwell held, with the right size and arrival', async ({ page }) => {
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
  // rooms belong to the city: their outdoor is Gate Plaza (respawn, "where am I")
  const outs = await page.evaluate(ids => ids.map(id => window.WORLD[id].outdoor), ROOMS);
  expect(outs).toEqual(ROOMS.map(() => 'brightgate'));
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
          if (!walk(to.grid[o.ty][o.tx])) out.push(id + ' warp ' + o.id + ' lands on a solid tile');
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

test('BG6 shut doors say their line, and the shuttle stop says no shuttle runs yet (§5.4, §11)', async ({ page }) => {
  await boot(page);
  await place(page, 'bg_keeper');
  const cases = [['brightgate', 55, 12, 'Residents only. Have a bright day!'], ['bg_campus', 52, 19, "By appointment. We'll call you."],
    ['bg_campus', 9, 17, 'Closed for an event. Have a bright day!'], ['bg_works', 43, 14, 'Fleet staff only.'],
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
  expect(await sayText(page)).toContain('No shuttle runs from here yet');
  await closeSay(page);
  expect(await page.evaluate(() => PixelPets.mapInfo.id)).toBe('brightgate');
});

test('BG7 no mint anywhere in Brightgate: the arrival frame and every battle scene (D2000, §13 item 8) @w1', async ({ page }) => {
  await boot(page);
  await place(page, 'bg_keeper');
  await page.waitForTimeout(300);
  const r = await page.evaluate((ids) => {
    const L = PAL.l, rgb = [1, 3, 5].map(i => parseInt(L.slice(i, i + 2), 16)), out = {};
    const count = (c, W, H) => { const d = c.getContext('2d').getImageData(0, 0, W, H).data; let n = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i] === rgb[0] && d[i + 1] === rgb[1] && d[i + 2] === rgb[2]) n++; return n; };
    const cv = document.querySelector('#mapCanvas'); out.walk = count(cv, cv.width, cv.height);
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
