/* Map pass B4, phase 1 (handoff/maps/B4_exteriors_variety.md, BUILDING_VARIETY.md rows 1-27): data/detail_b4.json gives every
   building on the outdoor maps its own roof, wall, door, windows, trim and porch props (E11 keys on `roofs`), adds landmarks
   and outdoor props, and the engine draws a grass fringe along outdoor paths (E7). */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, shot } = require('./helpers');

trackErrors(test, expect);

const TOWNS = { hearthmoor: 5, fernbrook: 2, cobblecrest: 4, highcharity: 15, mahopac: 1, fb_heights: 2 };
const OUTDOOR = Object.keys(TOWNS).concat(['route1', 'route2', 'route2_glen', 'proto', 'cobble_quarry']);

async function boot(page, world) {
  const s = starterSave();
  if (world) s.world = Object.assign({ facing: 'down', respawn: 'hearthmoor' }, world);
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
}

test('the B4 overlay lands: roofs entries and new props are on the merged maps, nothing else is patched', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    const P = MAPDATA.detail_b4.slicePatch.maps, out = { maps: Object.keys(P).sort(), bad: [], props: 0 };
    for (const [id, pt] of Object.entries(P)) {
      const v = PixelPets.exteriors(id);
      const ops = Object.keys(pt).filter(k => k !== 'set' && k !== 'addObjs');
      if (ops.length) out.bad.push(id + ' ops ' + ops);
      if (pt.set) {
        if (Object.keys(pt.set).join() !== 'roofs') out.bad.push(id + ' set ' + Object.keys(pt.set));
        if (JSON.stringify(v.roofs) !== JSON.stringify(pt.set.roofs)) out.bad.push(id + ' roofs differ');
      }
      for (const o of pt.addObjs || []) {
        const k = v.props.filter(x => x.id === o.id); out.props++;
        if (o.kind !== 'prop' || k.length !== 1 || k[0].x !== o.x || k[0].y !== o.y || k[0].sprite !== o.sprite) out.bad.push(id + ' ' + o.id);
        else if (!k[0].art) out.bad.push('no art ' + o.sprite);
      }
    }
    return out;
  });
  expect(r.bad).toEqual([]);
  expect(r.maps).toEqual([...OUTDOOR].sort());
  expect(r.props).toBeGreaterThan(150);

  await page.evaluate(() => PixelPets.goto('hearthmoor', 13, 16, 'right'));
  const lp = await page.evaluate(() => ({ obj: PixelPets.mapObjs.find(o => o.id === 'hm_lantern_post'), at: PixelPets.tileInfo(14, 16) }));
  expect(lp.obj).toMatchObject({ kind: 'prop', x: 14, y: 16, sprite: 'lm_lantern_post', art: true });
  expect(lp.at).toMatchObject({ solid: false, blocked: true });

  const keep = await page.evaluate(() => ({ hall: PixelPets.exteriors('cobblecrest').roofs.hall,
    hc: ['airport', 'command', 'barracks', 'chapel', 'hall'].map(k => { const e = PixelPets.exteriors('highcharity').roofs[k]; return [k, e.col, e.x0, e.y0]; }) }));
  expect(keep.hall).toMatchObject({ x0: 21, y0: 1, x1: 28, y1: 3, col: 'm' });
  expect(keep.hc).toEqual([['airport', 'b', 26, 1], ['command', 'b', 26, 6], ['barracks', 'b', 4, 8], ['chapel', 'b', 46, 5], ['hall', 'b', 26, 26]]);
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});

test('no two buildings on a town map share roof, wall, door, windows and porch prop (BUILDING_VARIETY 1-27)', async ({ page }) => {
  await boot(page);
  for (const [id, n] of Object.entries(TOWNS)) {
    const r = await page.evaluate((id) => {
      PixelPets.goto(id, null, null, 'down');
      const v = PixelPets.exteriors(id), info = PixelPets.mapInfo, bad = [], seen = {}, roofCells = new Set(), doors = new Set();
      for (const b of v.buildings) {
        for (let y = b.y0; y <= b.ry1; y++) for (let x = b.x0; x <= b.x1; x++) roofCells.add(x + ',' + y);
        b.doors.forEach(d => doors.add(d.id));
        const porch = b.porch.map(pid => v.props.find(o => o.id === pid)).filter(Boolean);
        if (!porch.length || porch.length !== b.porch.length) bad.push(b.name + ': porch prop missing');
        for (const o of porch) {
          if (o.x < b.x0 - 3 || o.x > b.x1 + 3 || o.y < b.y0 - 1 || o.y > b.y1 + 3) bad.push(b.name + ': porch prop far away ' + o.id);
          if (!o.art) bad.push('no art ' + o.sprite);
        }
        [b.roof, b.wall].forEach(t => { if (t && !v.tiles[t]) bad.push('no tile ' + t); });
        [b.door].concat(b.win).forEach(a => { if (a && !v.wart[a]) bad.push('no art ' + a); });
        if (!b.wall) bad.push(b.name + ': default wall');
        const look = [b.roof || 'R' + (b.col || ''), (b.shape || '') + b.feats.map(f => '+' + f).join(''), b.wall || 'H', b.door || 'door',
          b.win.join('+'), porch.map(o => o.sprite).sort().join('+')].join('|');
        if (seen[look]) bad.push(b.name + ' looks like ' + seen[look]);
        seen[look] = b.name;
      }
      for (let y = 0; y < info.h; y++) for (let x = 0; x < info.w; x++) if (PixelPets.tileInfo(x, y).ch === 'R' && !roofCells.has(x + ',' + y)) bad.push('unstyled roof ' + x + ',' + y);
      info.objs.filter(o => o.kind === 'door' && PixelPets.tileInfo(o.x, o.y - 1).ch === 'H' && !doors.has(o.id)).forEach(o => bad.push('door outside a building ' + o.id));
      return { map: info.id, n: v.buildings.length, bad };
    }, id);
    expect(r.map).toBe(id);
    expect(r.bad, id).toEqual([]);
    expect(r.n, id).toBe(n);
  }
  await page.evaluate(() => PixelPets.goto('highcharity', 34, 9, 'down'));
  await page.waitForTimeout(300);
  await shot(page, 'b4-highcharity-exteriors');
});

test('every outdoor map loads clean, and the new props cut nobody off from the arrival tile', async ({ page }) => {
  await boot(page);
  for (const id of OUTDOOR) {
    const r = await page.evaluate((id) => {
      const safe = PixelPets.exteriors(id).safe;
      PixelPets.goto(id, safe.x, safe.y, 'down');
      if (PixelPets.clearWild) PixelPets.clearWild();
      const info = PixelPets.mapInfo, W = info.w, H = info.h, key = (x, y) => y * W + x;
      const mine = new Map((MAPDATA.detail_b4.slicePatch.maps[id].addObjs || []).map(o => [key(o.x, o.y), o.id]));
      const reach = ignoreMine => {
        const open = (x, y) => x >= 0 && y >= 0 && x < W && y < H && (!PixelPets.tileInfo(x, y).blocked || (ignoreMine && mine.has(key(x, y))));
        const seen = new Set([key(safe.x, safe.y)]), q = [[safe.x, safe.y]];
        while (q.length) {
          const [x, y] = q.shift();
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx, ny = y + dy;
            if (open(nx, ny) && !seen.has(key(nx, ny))) { seen.add(key(nx, ny)); q.push([nx, ny]); }
          }
        }
        const near = o => seen.has(key(o.x, o.y)) || [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has(key(o.x + dx, o.y + dy)));
        return info.objs.filter(o => !mine.has(key(o.x, o.y)) && ['npc', 'trainer', 'sign', 'pickup', 'warp', 'door'].includes(o.kind) && near(o)).map(o => o.id).sort();
      };
      const onSolid = [...mine.entries()].filter(([k]) => PixelPets.tileInfo(k % W, Math.floor(k / W)).solid).map(([, pid]) => pid);
      return { id: info.id, safe: !PixelPets.tileInfo(safe.x, safe.y).blocked, without: reach(true), with: reach(false), onSolid, props: mine.size };
    }, id);
    expect(r.id).toBe(id);
    expect(r.safe, id).toBe(true);
    expect(r.onSolid, id).toEqual([]);
    expect(r.props, id).toBeGreaterThan(5);
    expect(r.without.length, id).toBeGreaterThan(0);
    expect(r.with, id).toEqual(r.without);
    await page.waitForTimeout(150);
  }
  await page.evaluate(() => PixelPets.goto('mahopac', 9, 9, 'up'));
  await page.waitForTimeout(300);
  await shot(page, 'b4-mahopac');
});

test('an old save standing where a new prop now stands loads on the map safe tile', async ({ page }) => {
  await boot(page, { map: 'mahopac', x: 9, y: 5 });
  const w = await page.evaluate(() => ({ map: PixelPets.state.world.map, x: PixelPets.state.world.x, y: PixelPets.state.world.y, v: PixelPets.state.v }));
  expect(w).toEqual({ map: 'mahopac', x: 9, y: 14, v: 2 });
});

test('E7 path edges and E11 painted cells: grass fringe on paths, faction ridge kept, shaped roofs cut, art grids valid', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    PixelPets.goto('hearthmoor', 3, 7, 'down');
    const c = (x, y) => PixelPets.exteriorCell(x, y), v = PixelPets.exteriors('hearthmoor'), b = n => v.buildings.find(x => x.name === n);
    const lodgeDoor = b('lodge').doors[0], home = [2, 3, 4, 5].map(x => c(x, 2));
    const bad = [];
    for (const [grp, set] of Object.entries(EXTERIOR_ART)) for (const [k, rows] of Object.entries(set)) {
      const n = grp === 'big' ? 32 : 16, size = (grp === 'tiles' ? v.tiles : v.wart)[k];
      if (rows.length !== n || rows.some(row => row.length !== n || /[^kproylgtnbcswhmd.]/.test(row))) bad.push(k);
      if (!size || size[0] !== n || size[1] !== n) bad.push('registry ' + k);
    }
    const out = { bad, edge: c(3, 6), mid: c(8, 8), grass: c(1, 1), rook: c(15, 2), home, lodgeWall: c(9, 5), lodgeDoor: c(lodgeDoor.x, lodgeDoor.y).doorArt,
      y: PAL.y, big: ['lm_lantern_post', 'lm_well', 'lm_statue', 'lm_signal_mast', 'lm_big_tree', 'regenx_facade', 'tunnel_mouth'].map(k => v.wart[k]),
      phase2: ['grass_b', 'grass_c', 'flower_patch', 'puddle', 'leaf_litter'].map(k => v.tiles[k]) };
    PixelPets.goto('fb_heights', null, null, 'down');
    const h = PixelPets.exteriors('fb_heights'), rx = h.buildings.find(x => x.name === 'regenx').doors[0];
    out.regenx = c(rx.x, rx.y).doorArt;
    return out;
  });
  expect(r.bad).toEqual([]);
  expect(r.edge.ch).toBe('p');
  expect(r.edge.edges.length).toBeGreaterThan(0);
  expect(r.mid).toMatchObject({ ch: 'p', edges: [] });
  expect(r.grass.edges).toEqual([]);
  expect(r.rook).toMatchObject({ ch: 'R', painted: true, cut: false });
  expect(r.rook.band[r.y]).toBe(32);
  for (const cell of r.home) {
    expect(cell).toMatchObject({ ch: 'R', painted: true, cut: true, band: {} });
  }
  expect(r.home.reduce((n, cell) => n + (cell.cell[r.y] || 0), 0)).toBeGreaterThan(8);
  expect(r.lodgeWall).toMatchObject({ ch: 'H', painted: true, styled: true });
  expect(r.lodgeDoor).toBe('door_double');
  expect(r.regenx).toBe('regenx_facade');
  expect(r.big).toEqual(Array(7).fill([32, 32]));
  expect(r.phase2).toEqual(Array(5).fill([16, 16]));
  await page.evaluate(() => PixelPets.goto('hearthmoor', 3, 7, 'down'));
  await page.waitForTimeout(300);
  await shot(page, 'b4-hearthmoor');
});

test('the B4 debug views stay inert without ?debug=1', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page);
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.state);
  expect(await page.evaluate(() => [PixelPets.debug, PixelPets.exteriors('hearthmoor'), PixelPets.exteriorCell(2, 2)])).toEqual([false, null, null]);
});
