/* Hearthmoor movement polish: Officer Bren walks a short west-yard beat and waits when the keeper is close, the Flats
   sign and lantern post sit off column 18, every Hearthmoor sign reads from a reachable tile, and walk toasts never
   stop a held walk. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const ROUTE = [[1, 7], [1, 8], [1, 9]];

async function boot(page, world) {
  const s = starterSave();
  s.flags['story.rival1_done'] = true;
  s.flags['story.side_pick_done'] = true;
  s.flags['story.unlock_sides'] = true;   // the D180 tip card stays out of the way
  if (world) s.world = Object.assign({ facing: 'down', respawn: 'hearthmoor' }, world);
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => { PixelPets.clock.set('tue', 10, 0); PixelPets.showTab('walk'); });
}

// Reachable cells from the arrival tile, with `extra` cells treated as blocked and Bren's own tile treated as open.
const REACH = `(extra) => {
  const info = PixelPets.mapInfo, W = info.w, H = info.h, safe = PixelPets.exteriors(info.id).safe;
  const bren = PixelPets.objPos('hm_patrol');
  const blocked = (x, y) => (extra || []).some(([a, b]) => a === x && b === y) || (PixelPets.tileInfo(x, y).blocked && !(bren && bren.x === x && bren.y === y));
  const seen = new Set([safe.x + ',' + safe.y]), q = [[safe.x, safe.y]];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen.has(k) || blocked(nx, ny)) continue;
      seen.add(k); q.push([nx, ny]);
    }
  }
  return [...seen];
}`;

test('Officer Bren keeps a short beat off paths, doorways and sign tiles, and never boxes the keeper in', async ({ page }) => {
  await boot(page, { map: 'hearthmoor', x: 12, y: 19 });
  const r = await page.evaluate(([route, src]) => {
    const reach = eval(src), info = PixelPets.mapInfo;
    const bren = info.objs.find(o => o.id === 'hm_patrol');
    const base = reach([]);
    const talk = info.objs.filter(o => ['sign', 'npc', 'trainer', 'door'].includes(o.kind) && o.id !== 'hm_patrol');
    const fronts = new Set();
    for (const o of talk) {
      if (o.kind === 'door') fronts.add(o.x + ',' + (PixelPets.tileInfo(o.x, o.y).ch === 'H' ? o.y + 1 : o.y));
      else [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => fronts.add((o.x + dx) + ',' + (o.y + dy)));
    }
    const bad = [];
    for (const [x, y] of route) {
      const t = PixelPets.tileInfo(x, y);
      if (t.ch === 'p' || t.ch === 's') bad.push(x + ',' + y + ' on a path');
      if (fronts.has(x + ',' + y)) bad.push(x + ',' + y + ' on a door front or talk tile');
      const cut = reach([[x, y]]);
      if (cut.length !== base.length - 1) bad.push(x + ',' + y + ' cuts off ' + (base.length - 1 - cut.length));
    }
    return { at: [bren.x, bren.y], bad };
  }, [ROUTE, REACH]);
  expect(r.at).toEqual([1, 8]);
  expect(r.bad).toEqual([]);

  const seen = new Set();
  for (let i = 0; i < 10; i++) {
    const p = await page.evaluate(() => PixelPets.objPos('hm_patrol'));
    seen.add(p.x + ',' + p.y);
    await page.waitForTimeout(300);
  }
  expect(seen.size).toBeGreaterThan(1);
  for (const k of seen) expect(ROUTE.map(([x, y]) => x + ',' + y)).toContain(k);
});

test('Officer Bren waits and faces the keeper when the keeper is beside him', async ({ page }) => {
  await boot(page, { map: 'hearthmoor', x: 12, y: 19 });
  await page.waitForFunction(() => { const p = PixelPets.objPos('hm_patrol'); return p.x === 1 && p.y === 8; }, null, { timeout: 8000 });
  await page.evaluate(() => PixelPets.goto('hearthmoor', 2, 8, 'left'));
  await page.waitForTimeout(150);
  const stay = [];
  for (let i = 0; i < 6; i++) { stay.push(await page.evaluate(() => PixelPets.objPos('hm_patrol'))); await page.waitForTimeout(300); }
  for (const p of stay) expect([p.x, p.y]).toEqual([1, 8]);
  expect(stay[stay.length - 1].facing).toBe('right');
  await page.evaluate(() => PixelPets.goto('hearthmoor', 8, 12, 'down'));
  const moved = await page.waitForFunction(() => { const p = PixelPets.objPos('hm_patrol'); return !(p.x === 1 && p.y === 8); }, null, { timeout: 5000 }).then(() => true, () => false);
  expect(moved).toBe(true);
});

test('the Flats sign and lantern post sit apart, and every Hearthmoor sign reads from a reachable tile', async ({ page }) => {
  await boot(page, { map: 'hearthmoor', x: 12, y: 19 });
  const r = await page.evaluate((src) => {
    const reach = new Set(eval(src)([])), info = PixelPets.mapInfo;
    const at = id => { const o = info.objs.find(q => q.id === id); return o && [o.x, o.y]; };
    const signs = info.objs.filter(o => o.kind === 'sign').map(o => ({ id: o.id,
      from: [[0, 1], [0, -1], [1, 0], [-1, 0]].map(([dx, dy]) => (o.x + dx) + ',' + (o.y + dy)).filter(k => reach.has(k)) }));
    return { sign: at('hm_flats_sign'), post: at('hm_lantern_post'), leaf: at('hm_leaf_17_15'), unread: signs.filter(s => !s.from.length).map(s => s.id),
      flatsFrom: signs.find(s => s.id === 'hm_flats_sign').from, path: PixelPets.tileInfo(14, 19).ch, reach: reach.size };
  }, REACH);
  expect(r.sign).toEqual([14, 18]);
  expect(r.post).toEqual([18, 19]);
  expect(r.leaf).toEqual([18, 15]);
  expect(r.unread).toEqual([]);
  expect(r.path).toBe('p');
  expect(r.flatsFrom).toContain('14,19');

  await page.evaluate(() => { PixelPets.goto('hearthmoor', 14, 19, 'up'); if (PixelPets.clearWild) PixelPets.clearWild(); });
  await page.waitForTimeout(200);
  await page.keyboard.press('Space');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
  expect(await page.evaluate(() => PixelPets.scene.text)).toContain('AMBERHILL FLATS');
  await page.keyboard.press('Space');
  await page.waitForFunction(() => !PixelPets.scene);
});

test('walk toasts show while a held walk keeps going: no dialog and no stop', async ({ page }) => {
  await boot(page, { map: 'hearthmoor', x: 3, y: 19, facing: 'right' });
  await page.evaluate(() => { PixelPets.goto('hearthmoor', 3, 19, 'right'); if (PixelPets.clearWild) PixelPets.clearWild(); PixelPets.state.steps = 48; });
  await page.waitForTimeout(200);
  await page.keyboard.down('ArrowRight');
  const xs = [], toasts = new Set(); let sceneSeen = false;
  for (let i = 0; i < 24; i++) {
    await page.waitForTimeout(100);
    const s = await page.evaluate(() => ({ x: PixelPets.state.world.x, sc: !!PixelPets.scene, t: document.querySelector('#toast').classList.contains('show') ? document.querySelector('#toast').textContent : '' }));
    xs.push(s.x); if (s.t) toasts.add(s.t); if (s.sc) sceneSeen = true;
  }
  await page.keyboard.up('ArrowRight');
  expect([...toasts]).toContain('50 steps! Nice walk.');
  expect(sceneSeen).toBe(false);
  expect(xs[xs.length - 1]).toBeGreaterThanOrEqual(13);   // ten tiles or more in 2.4 s: the toast never paused the walk
});
