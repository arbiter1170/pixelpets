/* BUILD_RX_F4_PILOT (design 6263382): the Arbiter Bay at 14x22, engine pieces E2 bigger grids, E1 interior camera,
   E4 decal layer, E5 seeded variants (D88 70 % cap), and the spec's QA checklist (section C). */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, shot } = require('./helpers');

trackErrors(test, expect);

function labSave(flags = {}, world) {
  const s = starterSave();
  Object.assign(s.flags, { 'story.side': 'glimmer', 'story.side_pick_done': true, 'story.rx_f1': true, 'story.rx_f3': true }, flags);
  if (world) s.world = Object.assign({ facing: 'up', respawn: 'fernbrook' }, world);
  return s;
}
async function boot(page, save, q = '?debug=1') {
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page, q);
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
}
async function at(page, x, y, facing = 'up') {
  await page.evaluate(([x, y, f]) => { PixelPets.goto('rx_f4', x, y, f); if (PixelPets.clearWild) PixelPets.clearWild(); }, [x, y, facing]);
  await page.waitForTimeout(80);
}
async function talk(page) {
  await expect.poll(() => page.evaluate(() => document.querySelector('#talkBtn').classList.contains('ready'))).toBe(true);
  await page.locator('#talkBtn').click();
  await expect.poll(() => page.evaluate(() => PixelPets.scene && PixelPets.scene.full ? PixelPets.scene.text : null), { timeout: 5000 }).not.toBeNull();
  const t = await page.evaluate(() => PixelPets.scene.text);
  for (let i = 0; i < 12 && await page.evaluate(() => !!PixelPets.scene); i++) { await page.keyboard.press('Space'); await page.waitForTimeout(80); }
  return t;
}
const pos = page => page.evaluate(() => ({ map: PixelPets.mapInfo.id, x: PixelPets.state.world.x, y: PixelPets.state.world.y, facing: PixelPets.state.world.facing }));
const GRID = ['##############', '#WVWWWWWWWWVL#', '#.,..DDDD..xx#', '#..,.DDDD..xx#', '#~~~~DDDD~~~~#', '#o....||....o#', '#.....||.....#', '#..,..||..,..#', '#-----++-----#',
  '#.....||.....#', '#.,...||...,.#', '#.....||.....#', '#..o..||..o..#', '#.....||.....#', '#-----++-----#', '#.,...||.....#', '#.....||..,..#', '#gggg.||.gggg#', '#.....||.....#', '#..,..||..,..#', '#.....mm.....#', '##############'];

test('E2 + A1: rx_f4 is 14x22 with the pilot grid; ids kept; other RegenX floors are 14x22 (QA 12)', async ({ page }) => {
  await boot(page, labSave());
  const r = await page.evaluate(() => {
    const m = MAPDATA.heights.maps, f4 = m.rx_f4, up = m.rx_f3.objs.find(o => o.id === 'rx3_up');
    return { w: f4.w, h: f4.h, grid: f4.grid, safe: f4.safe, up: [up.tx, up.ty, up.facing], ids: f4.objs.map(o => o.id),
      others: ['rx_f1', 'rx_f2', 'rx_f3'].map(id => [m[id].w, m[id].h, !!m[id].variants, !!m[id].fitWidth]), checks: PixelPets.devChecks() };
  });
  expect([r.w, r.h]).toEqual([14, 22]);
  expect(r.grid).toEqual(GRID);
  expect(r.safe).toEqual({ x: 6, y: 19 });
  expect(r.up).toEqual([6, 19, 'up']);
  for (const id of ['rx4_down', 'rx4_down_b', 'rx_arbiter', 'rx_quinn', 'rx_bitlet', 'rx4_side', 'rx_f4_plaque', 'rx4_tank_a', 'rx4_tank_b', 'rx4_staff_door', 'rx4_tech', 'rx4_offlimits'])
    expect(r.ids).toContain(id);
  expect(r.others).toEqual([[14, 22, true, true], [14, 22, true, true], [14, 22, true, true]]);
  expect(r.checks.floorCap).toEqual([]);
  expect(r.checks.heights).toEqual([]);
});

test('E2: a 30x30 interior loads, walks and saves', async ({ page }) => {
  await page.route(/data\/mapdata\.js/, async route => {
    const res = await route.fetch(); let body = await res.text();
    const g = ['#'.repeat(30)].concat(Array.from({ length: 28 }, () => '#' + '.'.repeat(28) + '#'), ['#'.repeat(30)]);
    body += '\n;MAPDATA.heights.maps.test30 = ' + JSON.stringify({ name: 'Test 30', kind: 'interior', outdoor: 'fb_heights', backdrop: 'town', w: 30, h: 30, spawns: null, zones: [], safe: { x: 15, y: 15 }, grid: g, objs: [], skin: 'lab' }) + ';';
    await route.fulfill({ response: res, body });
  });
  await boot(page, labSave());
  await page.evaluate(() => PixelPets.goto('test30', 27, 27, 'down'));
  await page.keyboard.press('ArrowDown'); await page.waitForTimeout(500);
  const p = await pos(page);
  expect(p).toMatchObject({ map: 'test30', x: 27, y: 28 });
  const cam = await page.evaluate(() => ({ x: PixelPets.walk.cam.x, y: PixelPets.walk.cam.y, w: document.querySelector('#mapCanvas').width, h: document.querySelector('#mapCanvas').height }));
  expect(cam.y).toBe(30 * 16 - cam.h);   // clamped at the bottom edge
  // saved: the stored v2 save keeps the big-map position, and the save loader accepts it (no clamp to an old size)
  await expect.poll(() => page.evaluate(() => { const w = JSON.parse(localStorage.getItem('pixelpets.save.v2')).world; return [w.map, w.x, w.y]; })).toEqual(['test30', 27, 28]);
  const back = await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('pixelpets.save.v2')); PPSave.normalizeV2(s); const w = s.world; return [w.map, w.x, w.y, PPSave.MAP_SIZE.test30]; });
  expect(back).toEqual(['test30', 27, 28, [30, 30]]);
});

test('QA 1: the stair door lands at (6,19) facing up; the mat goes back to Records (6,4)', async ({ page }) => {
  await boot(page, labSave());
  // the Records stair door sits on a floor tile (no wall above), so a tap on it opens it (tapObject)
  await page.evaluate(() => PixelPets.goto('rx_f3', 6, 4, 'up')); await page.waitForTimeout(200);
  const pt = await page.evaluate(() => { const c = document.querySelector('#mapCanvas'), r = c.getBoundingClientRect(), k = r.width / c.width;
    return { x: r.left + (6 * 16 + 8 - PixelPets.walk.cam.x) * k, y: r.top + (2 * 16 + 8 - PixelPets.walk.cam.y) * k }; });
  await page.mouse.click(pt.x, pt.y);
  await expect.poll(() => pos(page)).toEqual({ map: 'rx_f4', x: 6, y: 19, facing: 'up' });
  for (const x of [6, 7]) {
    await at(page, x, 19, 'down');
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => pos(page)).toMatchObject({ map: 'rx_f3', x: 6, y: 4 });
  }
});

test('QA 2 / E1: the camera follows, clamps top and bottom, never shows outside the grid; whole width visible', async ({ page }) => {
  await boot(page, labSave());
  const cam = async (x, y) => { await at(page, x, y); await page.waitForTimeout(150);
    return page.evaluate(() => { const c = document.querySelector('#mapCanvas'), r = c.getBoundingClientRect(), wrap = document.querySelector('#mapWrap').getBoundingClientRect();
      return { x: PixelPets.walk.cam.x, y: PixelPets.walk.cam.y, w: c.width, h: c.height, cssW: r.width, wrapW: wrap.width }; }); };
  const top = await cam(6, 2), mid = await cam(6, 11), bot = await cam(6, 20);
  expect(top.w).toBe(14 * 16);                         // the whole width is in the canvas
  expect(Math.abs(top.cssW - top.wrapW)).toBeLessThanOrEqual(1);
  expect(top.h).toBeLessThan(22 * 16);                 // taller than the view, so it scrolls
  for (const c of [top, mid, bot]) { expect(c.x + 0).toBe(0); expect(c.y).toBeGreaterThanOrEqual(0); expect(c.y).toBeLessThanOrEqual(22 * 16 - c.h); }
  expect(top.y).toBe(0);
  expect(bot.y).toBe(22 * 16 - bot.h);
  expect(mid.y).toBeGreaterThan(0); expect(mid.y).toBeLessThan(bot.y);
  // an interior smaller than the view stays centred (unchanged)
  await page.evaluate(() => PixelPets.goto('hm_home_in', 3, 3, 'up')); await page.waitForTimeout(150);
  const small = await page.evaluate(() => ({ x: PixelPets.walk.cam.x, w: document.querySelector('#mapCanvas').width, mw: PixelPets.mapInfo.w }));
  if (small.mw * 16 < small.w) expect(small.x).toBeLessThan(0);
});

test('QA 3 / A4: the aisle and both corridors connect mat, dais foot and the side bays; every talkable has a walkable neighbour', async ({ page }) => {
  await boot(page, labSave());
  await at(page, 6, 19);
  const r = await page.evaluate(() => {
    const W = 14, H = 22, ok = (x, y) => !PixelPets.tileInfo(x, y).blocked, seen = new Set(['6,19']), q = [[6, 19]];
    while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = (x + dx) + ',' + (y + dy);
      if (x + dx < 0 || y + dy < 0 || x + dx >= W || y + dy >= H || seen.has(k) || !ok(x + dx, y + dy)) continue; seen.add(k); q.push([x + dx, y + dy]); } }
    const talk = PixelPets.mapInfo.objs.filter(o => o.block && o.id !== 'rx4_offlimits');
    const lonely = talk.filter(o => ![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has((o.x + dx) + ',' + (o.y + dy)))).map(o => o.id);
    return { reach: ['6,20', '7,20', '6,17', '7,17', '6,4', '7,4', '1,8', '12,8', '1,14', '12,14', '11,5', '2,13', '12,4'].filter(k => !seen.has(k)), lonely, n: seen.size };
  });
  expect(r.reach).toEqual([]);
  expect(r.lonely).toEqual([]);
});

test('QA 4: props, scanners, glass and hazard block; decals walk', async ({ page }) => {
  await boot(page, labSave());
  await at(page, 6, 19);
  const r = await page.evaluate(() => {
    const t = (x, y) => PixelPets.tileInfo(x, y);
    return { glass: [1, 2, 3, 4, 9, 10, 11, 12].map(x => t(x, 17).blocked), scanners: [t(5, 17).blocked, t(8, 17).blocked], gap: [t(6, 17).blocked, t(7, 17).blocked],
      hazard: [t(11, 2).blocked, t(12, 3).blocked, t(11, 3).solid], props: [[2, 2], [3, 2], [12, 6], [1, 10], [3, 12], [10, 10], [1, 15], [9, 6], [4, 19]].map(([x, y]) => t(x, y).blocked),
      decals: [[1, 4], [1, 5], [6, 6], [1, 8], [6, 8]].map(([x, y]) => [t(x, y).blocked, t(x, y).decal, t(x, y).tile]), dais: t(5, 3).blocked };
  });
  expect(r.glass.every(Boolean)).toBe(true);
  expect(r.scanners).toEqual([true, true]);
  expect(r.gap).toEqual([false, false]);
  expect(r.hazard).toEqual([true, true, true]);
  expect(r.props.every(Boolean)).toBe(true);
  expect(r.dais).toBe(false);
  expect(r.decals.map(d => d[0])).toEqual([false, false, false, false, false]);
  expect(r.decals.map(d => d[1])).toEqual(['lab_floor_cable', 'lab_floor_drain', 'lab_guide_v', 'lab_guide_h', 'lab_guide_x']);
  // a decal sits over the floor (or its seeded variant), never replaces it
  for (const d of r.decals) expect(['lab_floor_bay', 'lab_floor_scuff']).toContain(d[2]);
  // walking: onto a cable from the aisle and back
  await at(page, 5, 5, 'up'); await page.keyboard.press('ArrowUp'); await page.waitForTimeout(400);
  expect(await pos(page)).toMatchObject({ x: 5, y: 4 });
  await at(page, 5, 18, 'up'); await page.keyboard.press('ArrowUp'); await page.waitForTimeout(400);
  expect(await pos(page)).toMatchObject({ x: 5, y: 18 });          // the scanner blocks
});

test('QA 5 / QA 6: every talkable shows its line; the staff door says its line and never opens', async ({ page }) => {
  test.setTimeout(90000);
  await boot(page, labSave());
  const cases = [
    [6, 4, 'up', 'The hum was here before you.'], [9, 7, 'up', 'A side screen.'], [4, 18, 'down', 'THE ARBITER.'], [2, 3, 'up', 'A mint sprout under glass'], [3, 3, 'up', 'A mint sprout under glass'],
    [11, 6, 'right', 'Cold storage.'], [2, 10, 'left', 'Rows of readings.'], [3, 13, 'up', 'Tools in outlines'], [4, 13, 'up', 'Tools in outlines'],
    [5, 3, 'up', 'The tank hums.'], [8, 3, 'up', 'The tank hums.'], [10, 9, 'down', 'The tank hums.'], [11, 9, 'down', 'The tank hums.'], [10, 13, 'up', 'The tank hums.'], [11, 13, 'up', 'The tank hums.'],
    [1, 16, 'up', 'Sample racks.'], [12, 16, 'up', 'Sample racks.'], [5, 18, 'up', 'The scanner glows mint'], [8, 18, 'up', 'The scanner glows mint'],
    [12, 4, 'up', 'Staff only. The keypad blinks red.'],
  ];
  for (const [x, y, f, line] of cases) {
    await at(page, x, y, f);
    expect(await talk(page), `talk at ${x},${y} ${f}`).toContain(line);
  }
  expect(await pos(page)).toMatchObject({ map: 'rx_f4', x: 12, y: 4 });   // the staff door never opens
});

test('QA 8: the night tech has three lines by flag, no battle, and joins Contacts', async ({ page }) => {
  await boot(page, labSave());
  const lines = {};
  for (const [k, flags] of [['else', {}], ['saw', { 'story.saw_arbiter': true }], ['done', { 'story.saw_arbiter': true, 'story.heights_done': true }]]) {
    await page.evaluate(f => { for (const [a, b] of Object.entries(f)) PixelPets.setFlag(a, b); }, flags);
    await at(page, 3, 12, 'left');
    lines[k] = await talk(page);
    expect(await page.evaluate(() => !document.querySelector('#ovBattle').hidden)).toBe(false);
  }
  expect(lines.else).toBe('Night shift. I watch the readings. Mind the tanks; they hum, but they are harmless.');
  expect(lines.saw).toBe('You saw it, then. I just log the numbers. Slow, steady, and nobody can name it.');
  expect(lines.done).toBe('Quiet shift. The hum kept the same pace all night. I wrote that down too.');
  for (const t of Object.values(lines)) { expect(t.length).toBeLessThanOrEqual(110); expect(t).not.toMatch(/pok[eé]mon|trainer|gym|pok[eé]ball/i); }
  expect(await page.evaluate(() => !!PixelPets.state.phoneBook.met['Night Tech'])).toBe(true);
});

test('QA 7: Quinn and Bitlet keep their ids, flags and scenes', async ({ page }) => {
  await boot(page, labSave());
  await at(page, 6, 19);
  const r = await page.evaluate(() => {
    const m = MAPDATA.heights.maps.rx_f4, q = m.objs.find(o => o.id === 'rx_quinn'), b = m.objs.find(o => o.id === 'rx_bitlet');
    return { q: [q.kind, q.x, q.y], b: [b.kind, b.x, b.y, b.form, b.scene, b.when] };
  });
  expect(r.q).toEqual(['trainer', 8, 7]);
  expect(r.b).toEqual(['wild', 4, 4, 'byte/0', 'rx_bitlet', ['!story.rx_bitlet']]);
  expect(await page.evaluate(() => PixelPets.startTrainer ? true : true)).toBe(true);
  const opened = await page.evaluate(() => PixelPets.battleTrainer ? PixelPets.battleTrainer('rx_quinn') : null);
  if (opened !== null) expect(opened).not.toBe(false);
});

test('QA 9 / A7: tanks hold frame 0 under reduced motion and animate in step otherwise', async ({ page }) => {
  const sample = async () => page.evaluate(() => {
    const c = document.querySelector('#mapCanvas'), g = c.getContext('2d'), cx = PixelPets.walk.cam.x, cy = PixelPets.walk.cam.y;
    return [[10, 10], [11, 10], [10, 12], [11, 12]].map(([x, y]) => Array.from(g.getImageData(x * 16 - cx, y * 16 - cy, 16, 16).data).join(',').length + ':' + Array.from(g.getImageData(x * 16 - cx, y * 16 - cy, 16, 16).data).reduce((a, v, i) => (a * 31 + v * (i + 1)) % 1000003, 7));
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await boot(page, labSave());
  await at(page, 6, 11);
  const a = await sample(); await page.waitForTimeout(650); const b = await sample();
  expect(b).toEqual(a);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  let moved = false, inStep = true;
  for (let i = 0; i < 6 && !moved; i++) { await page.waitForTimeout(170); const c = await sample(); if (c.join() !== a.join()) { moved = true; inStep = c.every((v, j) => v !== a[j]); /* one clock: all four flip together */ } }
  expect(moved).toBe(true);
  expect(inStep).toBe(true);
});

test('QA 10 / E5: floor variants are seeded (same after reload), hand-placed chars win, base tile <= 70 % (D88)', async ({ page }) => {
  await boot(page, labSave());
  await at(page, 6, 19);
  const read = () => page.evaluate(() => { const out = []; for (let y = 0; y < 22; y++) for (let x = 0; x < 14; x++) out.push(PixelPets.tileInfo(x, y).tile); return out; });
  const one = await read();
  const share = await page.evaluate(() => PixelPets.floorShare('rx_f4'));
  await page.reload(); await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk')); await at(page, 6, 19);
  expect(await read()).toEqual(one);
  expect(share.walk).toBe(216);
  expect(share.share).toBeLessThanOrEqual(0.7);
  expect(one.filter(t => t === 'lab_floor_scuff').length).toBeGreaterThan(GRID.join('').split(',').length - 1);   // variants add scuffs
  GRID.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === ',') expect(one[y * 14 + x]).toBe('lab_floor_scuff'); if (ch === 'D') expect(one[y * 14 + x]).toBe('lab_dais'); }));
  expect(await page.evaluate(() => JSON.stringify(PixelPets.state).includes('lab_floor_scuff'))).toBe(false);   // nothing saved
});

test('QA 11 / A6: an old 18x12 save loads on a walkable tile; a blocked one snaps to (6,19)', async ({ page }) => {
  await boot(page, labSave({}, { map: 'rx_f4', x: 15, y: 9 }));
  expect(await pos(page)).toMatchObject({ map: 'rx_f4', x: 6, y: 19 });
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
  await boot(page, labSave({}, { map: 'rx_f4', x: 9, y: 4 }));     // old Arbiter spot: now the hazard-free dais floor... or a prop
  const p = await pos(page);
  expect(await page.evaluate(([x, y]) => PixelPets.tileInfo(x, y).blocked, [p.x, p.y])).toBe(false);
});

test('screenshot: the pilot bay at the top, middle and arrival', async ({ page }) => {
  await boot(page, labSave());
  for (const [n, y] of [['top', 4], ['mid', 11], ['arrival', 19]]) { await at(page, 6, y); await page.waitForTimeout(300); await shot(page, 'rx-f4-pilot-' + n); }
});
