// NPC_LIFE: short walking routes, idle glances, and talk reactions for the people the holder meets.
// Debug reads: PixelPets.npcLife() (route, position, reaction, draw offset per present npc) and PixelPets.wanderNow() (skip the waits).
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

function save(flags, textSpeed = 'fast') {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.textSpeed = textSpeed;
  s.settings.follower = false;
  Object.assign(s.flags, flags || {});
  return s;
}

async function boot(page, opts = {}) {
  if (opts.reduce) await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), save(opts.flags, opts.textSpeed), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && PixelPets.state && PixelPets.state.party[0]);
  await page.evaluate(() => { PixelPets.showTab('walk'); PixelPets.clearWild(); });
  await page.waitForFunction(() => document.querySelector('#mapCanvas').width > 0);
}

const life = page => page.evaluate(() => PixelPets.npcLife());
const one = async (page, id) => (await life(page)).find(n => n.id === id) || null;

// The first walker on a map, plus a free tile at Manhattan distance >= far from every tile of its route (for the holder).
async function walkerAndSpot(page, map, far) {
  await page.evaluate(m => PixelPets.goto(m), map);
  return page.evaluate(far => {
    const w = PixelPets.npcLife().find(n => n.route);
    if (!w) return null;
    const { w: W, h: H } = PixelPets.mapInfo, taken = new Set(PixelPets.mapObjs.map(o => o.x + ',' + o.y));
    const dist = (x, y) => Math.min(...w.route.map(([a, b]) => Math.abs(a - x) + Math.abs(b - y)));
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!PixelPets.tileInfo(x, y).walk || taken.has(x + ',' + y) || dist(x, y) < far || dist(x, y) > far + 6) continue;
      return { w, spot: { x, y } };
    }
    return null;
  }, far);
}

// Plays ad-hoc steps as Hattie (on Hearthmoor), holder two tiles off her route so she stands still.
async function hattieScene(page, steps) {
  const r = await walkerAndSpot(page, 'hearthmoor', 3);
  const hat = (await life(page)).find(n => n.name === 'Hattie');
  expect(hat, 'Hattie is on Hearthmoor').toBeTruthy();
  const nb = await page.evaluate(([hx, hy]) => {
    const taken = new Set(PixelPets.mapObjs.map(o => o.x + ',' + o.y));
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { const x = hx + dx, y = hy + dy; if (PixelPets.tileInfo(x, y).walk && !taken.has(x + ',' + y)) return [x, y]; }
    return null;
  }, hat.home);
  expect(nb, 'a free tile beside Hattie').toBeTruthy();
  await page.evaluate(([x, y]) => PixelPets.goto('hearthmoor', x, y), nb);
  await expect.poll(() => page.evaluate(s => { if (!PixelPets.scene) PixelPets.runSteps(s); return !!PixelPets.scene; }, steps)).toBe(true);
  return { r, hat };
}

async function pick(page, label) {
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.mode === 'choice' && document.querySelectorAll('#sbChoices button').length > 0 && PixelPets.optionsReady);
  await page.locator('#sbChoices button', { hasText: label }).first().click();
}

test('T1 routes: every walker stays on 1-2 open tiles in a line, off doors, warps, sight lines, and never cuts a way through', async ({ page }) => {
  test.setTimeout(120000);
  await boot(page);
  const maps = await page.evaluate(() => Object.keys(WORLD));
  let walkers = 0;
  for (const m of maps) {
    const ok = await page.evaluate(m => { PixelPets.endScene(); return !!PixelPets.goto(m); }, m);
    expect(ok, 'goto ' + m).toBe(true);
    const bad = await page.evaluate(() => {
      const out = [], L = PixelPets.npcLife(), objs = PixelPets.mapObjs, { w: W, h: H } = PixelPets.mapInfo;
      const sight = new Set(Object.values(PixelPets.sightLines).flat().map(c => c.x + ',' + c.y));
      const objAt = new Map(objs.map(o => [o.x + ',' + o.y, o]));
      const block = new Set(objs.filter(o => ['npc', 'trainer', 'sign', 'prop', 'wild'].includes(o.kind)).map(o => o.x + ',' + o.y));
      const walk = (x, y) => x >= 0 && y >= 0 && x < W && y < H && PixelPets.tileInfo(x, y).walk;
      const start = PixelPets.keeper;
      const reach = closed => { const seen = new Set([start.x + ',' + start.y]), q = [[start.x, start.y]];
        while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = (x + dx) + ',' + (y + dy);
          if (seen.has(k) || !walk(x + dx, y + dy) || closed.has(k)) continue; seen.add(k); q.push([x + dx, y + dy]); } }
        return seen; };
      const base = reach(block), claimed = new Map();
      for (const n of L) {
        if (!n.route) continue;
        const [[hx, hy], [ex, ey]] = n.route, len = Math.abs(ex - hx) + Math.abs(ey - hy);
        if (hx !== n.home[0] || hy !== n.home[1]) out.push(n.id + ' route does not start at home');
        if ((hx !== ex && hy !== ey) || len < 1 || len > 2) out.push(n.id + ' route not a 1-2 tile line');
        const dx = Math.sign(ex - hx), dy = Math.sign(ey - hy);
        for (let i = 0; i <= len; i++) {
          const x = hx + dx * i, y = hy + dy * i, k = x + ',' + y;
          if (claimed.has(k)) out.push(n.id + ' shares ' + k + ' with ' + claimed.get(k));
          claimed.set(k, n.id);
          if (!i) continue;
          if (!walk(x, y)) out.push(n.id + ' solid ' + k);
          if (objAt.has(k)) out.push(n.id + ' on object ' + objAt.get(k).id);
          if (objs.some(o => o.kind === 'door' && o.x === x && o.y === y - 1)) out.push(n.id + ' on a doorstep ' + k);
          if (sight.has(k)) out.push(n.id + ' in a sight line ' + k);
          const moved = new Set(block); moved.delete(hx + ',' + hy); moved.add(k);
          const r = reach(moved);
          for (const t of base) if (t !== k && !r.has(t)) { out.push(n.id + ' at ' + k + ' cuts off ' + t); break; }
        }
      }
      return { out, n: L.filter(n => n.route).length };
    });
    walkers += bad.n;
    expect(bad.out, m).toEqual([]);
  }
  expect(walkers, 'some npcs walk').toBeGreaterThan(20);
});

test('T2 counters and guides stand still: shop, Lantern guide and match holders get no route', async ({ page }) => {
  await boot(page);
  const go = m => page.evaluate(m => { PixelPets.endScene(); return PixelPets.goto(m); }, m);
  await go('hm_lantern_in');
  expect((await one(page, 'hm_lantern_host')).route).toBeNull();
  let shops = 0;
  for (const m of ['hm_store', 'cc_store_in', 'bw_store_in', 'highcharity', 'hm_diner', 'hm_wardrobe']) {
    if (!(await page.evaluate(m => !!WORLD[m], m))) continue;
    await go(m);
    const ids = await page.evaluate(() => PixelPets.mapObjs.filter(o => o.kind === 'npc' && o.shop).map(o => o.id));
    for (const id of ids) { shops++; expect((await one(page, id)).route, id).toBeNull(); }
  }
  expect(shops).toBeGreaterThan(0);
  await go('hearthmoor');
  expect((await one(page, 'rook_gate')).route).toBeNull();
});

test('T3 a walker glides along its route and back, then everyone is home on the next visit', async ({ page }) => {
  await boot(page);
  const r = await walkerAndSpot(page, 'hearthmoor', 5);
  expect(r).toBeTruthy();
  await page.evaluate(([x, y]) => PixelPets.goto('hearthmoor', x, y), [r.spot.x, r.spot.y]);
  const [[hx, hy], [ex, ey]] = r.w.route;
  let glided = false;
  await page.evaluate(() => PixelPets.wanderNow());
  await expect.poll(async () => {
    const n = await one(page, r.w.id);
    if (n.moving) glided = true;
    const onLine = (n.x === hx && Math.min(hy, ey) <= n.y && n.y <= Math.max(hy, ey)) || (n.y === hy && Math.min(hx, ex) <= n.x && n.x <= Math.max(hx, ex));
    expect(onLine, 'stays on its route').toBe(true);
    return n.x === ex && n.y === ey;
  }, { timeout: 8000, intervals: [60] }).toBe(true);
  expect(glided, 'walk frames while moving').toBe(true);
  await page.evaluate(() => PixelPets.goto('hearthmoor'));
  const back = await one(page, r.w.id);
  expect([back.x, back.y]).toEqual([hx, hy]);
});

test('T4 a walker waits while the holder is within 2 tiles and turns to face them', async ({ page }) => {
  await boot(page);
  const r = await walkerAndSpot(page, 'hearthmoor', 5);
  const [hx, hy] = r.w.route[0];
  const spot = await page.evaluate(([hx, hy]) => {
    const taken = new Set(PixelPets.mapObjs.map(o => o.x + ',' + o.y));
    for (const [dx, dy] of [[0, 2], [0, -2], [2, 0], [-2, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const x = hx + dx, y = hy + dy; if (PixelPets.tileInfo(x, y).walk && !taken.has(x + ',' + y)) return { x, y };
    }
    return null;
  }, [hx, hy]);
  expect(spot).toBeTruthy();
  await page.evaluate(([x, y]) => PixelPets.goto('hearthmoor', x, y), [spot.x, spot.y]);
  await page.evaluate(() => PixelPets.wanderNow());
  await page.waitForTimeout(1500);
  const n = await one(page, r.w.id);
  expect([n.x, n.y]).toEqual([hx, hy]);
  const f = await page.evaluate(id => PixelPets.objPos(id).facing, r.w.id);
  const dx = spot.x - hx, dy = spot.y - hy;
  expect(f).toBe(Math.abs(dx) >= Math.abs(dy) && dx ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
});

test('T5 talking: the npc hops when spoken to, bobs while its line types, and a question line raises the "?" balloon', async ({ page }) => {
  await boot(page, { textSpeed: 'slow' });
  const { hat } = await hattieScene(page, [['say', 'Hattie', 'Have you seen the crabs by the stream? They came back this morning, all of them, up past the stones and right to the bridge, and the little one is still sitting on my bucket. Is that normal?']]);
  await expect.poll(async () => JSON.stringify((await one(page, hat.id)).last)).toContain('"glyph":"emote_ask"');
  let bobbed = false;
  await expect.poll(async () => { const n = await one(page, hat.id); if (n.speaking && n.dy === -1) bobbed = true; return bobbed; }, { intervals: [30] }).toBe(true);
  await page.keyboard.press('Space'); await page.keyboard.press('Space');
  await page.waitForFunction(() => !PixelPets.scene);
  await page.evaluate(id => PixelPets.talkTo(id), hat.id);
  expect((await one(page, hat.id)).last.move).toBe('hop');
  await page.evaluate(() => PixelPets.endScene());
});

test('T6 answers get reactions: no is dots and a head shake (seen after the scene ends), yes is a heart and a bounce, a battle is the match balloon', async ({ page }) => {
  await boot(page);
  const opts = [['Not now', []], ['Yes, I will help', []], ['Battle me!', []]];
  const { hat } = await hattieScene(page, [['choice', 'Can you help me?', opts, 'Hattie']]);
  await pick(page, 'Not now');
  await page.waitForFunction(() => !PixelPets.scene);
  // The answer ends the scene; its reaction is set by the pick and runs on past the scene's end.
  let n = await one(page, hat.id);
  expect(n.last).toMatchObject({ glyph: 'emote_dots', move: 'shake' });
  expect(n.last.ms).toBeGreaterThanOrEqual(1000);
  await page.waitForTimeout(1200);
  await page.evaluate(s => PixelPets.runSteps(s), [['choice', 'Can you help me?', opts, 'Hattie']]);
  await pick(page, 'Yes, I will help');
  n = await one(page, hat.id);
  expect(n.last).toMatchObject({ glyph: 'emote_heart', move: 'bounce' });
  await page.waitForFunction(() => !PixelPets.scene);
  await page.waitForTimeout(1200);
  await page.evaluate(s => PixelPets.runSteps(s), [['choice', 'Can you help me?', opts, 'Hattie']]);
  await pick(page, 'Battle me!');
  n = await one(page, hat.id);
  expect(n.last.glyph).toBe('emote_match');
});

test('T7 reduced motion: nobody walks or glances, reactions keep the balloon but drop the hop', async ({ page }) => {
  await boot(page, { reduce: true });
  const r = await walkerAndSpot(page, 'hearthmoor', 5);
  await page.evaluate(([x, y]) => PixelPets.goto('hearthmoor', x, y), [r.spot.x, r.spot.y]);
  const before = (await life(page)).filter(n => !n.patrol).map(n => [n.id, n.x, n.y]);   // authored patrols keep their beat
  await page.evaluate(() => PixelPets.wanderNow());
  await page.waitForTimeout(2000);
  const after = await life(page);
  expect(after.filter(n => !n.patrol).map(n => [n.id, n.x, n.y])).toEqual(before);
  expect(after.every(n => !n.glance)).toBe(true);
  const { hat } = await hattieScene(page, [['choice', 'Help?', [['Not now', []]], 'Hattie']]);
  await pick(page, 'Not now');
  const n = await one(page, hat.id);
  expect([n.last.glyph, n.last.move, n.dx, n.dy]).toEqual(['emote_dots', null, 0, 0]);
});

test('T8 save unchanged: walking and reactions write nothing new to the save', async ({ page }) => {
  await boot(page);
  const read = () => page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  const r = await walkerAndSpot(page, 'hearthmoor', 5);
  await page.waitForTimeout(300);
  const s0 = await read();
  await page.evaluate(([x, y]) => PixelPets.goto('hearthmoor', x, y), [r.spot.x, r.spot.y]);
  await page.evaluate(() => PixelPets.wanderNow());
  await page.waitForTimeout(1500);
  await hattieScene(page, [['choice', 'Help?', [['Not now', []]], 'Hattie']]);
  await pick(page, 'Not now');
  await page.waitForFunction(() => !PixelPets.scene);
  const s1 = await read();
  expect(s1.v).toBe(2);
  expect(Object.keys(s1).sort()).toEqual(Object.keys(s0).sort());
  expect(Object.keys(s1.flags).filter(k => !(k in s0.flags) && !/^(daily|seen|map|visit|contact)/.test(k))).toEqual([]);
  expect(JSON.stringify(s1)).not.toMatch(/wander|npcLife|glance|react/i);
});

test('T9 schedules: a clock-placed person walks around their row tile, and a new row gives a new home and walk', async ({ page }) => {
  await boot(page, { flags: { 'story.lizzy_met': true } });   // the flats lobby is staffed once Lizzy's thread opens
  await page.evaluate(() => { PixelPets.clock.set('tue', 10, 0); PixelPets.clock.freeze(true); PixelPets.goto('hm_flats_lobby'); });
  const far = async () => {
    const spot = await page.evaluate(() => {
      const g = PixelPets.npcLife().find(n => n.id === 'flats_landlord'); if (!g) return null;
      const { w: W, h: H } = PixelPets.mapInfo, taken = new Set(PixelPets.mapObjs.map(o => o.x + ',' + o.y));
      const d = (x, y) => Math.abs(g.home[0] - x) + Math.abs(g.home[1] - y);   // 4+ from home is 2+ off any 2-tile route
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (PixelPets.tileInfo(x, y).walk && !taken.has(x + ',' + y) && d(x, y) >= 4) return { x, y };
      return null;
    });
    expect(spot, 'a tile 4+ away from Mr. Gristle').toBeTruthy();
    await page.evaluate(([x, y]) => { PixelPets.goto('hm_flats_lobby', x, y); PixelPets.npcLife(); PixelPets.wanderNow(); }, [spot.x, spot.y]);
  };
  await far();
  let g = await one(page, 'flats_landlord');
  expect(g.sched).toBe(true);
  expect(g.route).toBeTruthy();
  const [h1, e1] = g.route;
  await expect.poll(async () => { const n = await one(page, 'flats_landlord'); return [n.x, n.y].join(','); }, { timeout: 8000, intervals: [80] }).toBe(e1.join(','));
  // The clock moves him: he stands on the new row's tile at once, and his walk starts from there.
  await page.evaluate(() => PixelPets.clock.set('sat', 13, 0));
  await expect.poll(async () => { const n = await one(page, 'flats_landlord'); return n && n.home.join(','); }).not.toBe(h1.join(','));
  g = await one(page, 'flats_landlord');
  const row = await page.evaluate(() => PixelPets.clock.place('Mr. Gristle'));
  expect([g.x, g.y]).toEqual(g.home);
  if (row && row.x != null) expect(g.home).toEqual([row.x, row.y]);
  await far();
  g = await one(page, 'flats_landlord');
  expect(g.route && g.route[0]).toEqual(g.home);
  const e2 = g.route[1];
  await expect.poll(async () => { const n = await one(page, 'flats_landlord'); return [n.x, n.y].join(','); }, { timeout: 8000, intervals: [80] }).toBe(e2.join(','));
  await page.evaluate(() => PixelPets.clock.clear());
});

test('T10 a quest arrow that names a walker\'s home tile follows the walker', async ({ page }) => {
  await boot(page);
  const r = await walkerAndSpot(page, 'hearthmoor', 5);
  const [[hx, hy], [ex, ey]] = r.w.route;
  const chain = [[{ id: 't_walker', label: 'Walker test', when: ['story.starter_received'], done: ['story.t_walker'], text: 'Test chain.', place: 'Hearthmoor', target: { map: 'hearthmoor', x: hx, y: hy } }]];
  await page.evaluate(c => { PixelPets.debugSideChains(c); PixelPets.trackSide('t_walker'); }, chain);
  await page.evaluate(([x, y]) => { PixelPets.goto('hearthmoor', x, y); PixelPets.npcLife(); }, [r.spot.x, r.spot.y]);
  expect(await page.evaluate(() => PixelPets.sideQuest && PixelPets.sideQuest.point)).toMatchObject({ x: hx, y: hy, here: true });
  await page.evaluate(() => PixelPets.wanderNow());
  await expect.poll(async () => { const n = await one(page, r.w.id); return [n.x, n.y].join(','); }, { timeout: 8000, intervals: [80] }).toBe(ex + ',' + ey);
  expect(await page.evaluate(() => PixelPets.sideQuest.point)).toMatchObject({ x: ex, y: ey, here: true });
  await page.evaluate(() => PixelPets.debugSideChains(null));
});
