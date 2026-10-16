/* Map pass B4, phase 1 (handoff/maps/B4_exteriors_variety.md, BUILDING_VARIETY.md rows 1-27): data/detail_b4.json gives every
   building on the outdoor maps its own roof, wall, door, windows, trim and porch props (E11 keys on `roofs`), adds landmarks
   and outdoor props, and the engine draws a grass fringe along outdoor paths (E7).
   Phase 2: the same overlay opts every outdoor map into E5 seeded grass (`"variants": true`), lays puddle and leaf-litter
   decals, and fills screens toward 6 props; the D88 70 % floor check now covers those maps. */
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

test('the B4 overlay lands: roofs, variants, new props and decals are on the merged maps, nothing else is patched', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    const P = MAPDATA.detail_b4.slicePatch.maps, out = { maps: Object.keys(P).sort(), bad: [], props: 0, decals: 0 };
    for (const [id, pt] of Object.entries(P)) {
      const v = PixelPets.exteriors(id);
      const ops = Object.keys(pt).filter(k => k !== 'set' && k !== 'addObjs');
      if (ops.length) out.bad.push(id + ' ops ' + ops);
      if (!pt.set || pt.set.variants !== true || Object.keys(pt.set).some(k => k !== 'roofs' && k !== 'variants')) out.bad.push(id + ' set ' + Object.keys(pt.set || {}));
      else if (pt.set.roofs && JSON.stringify(v.roofs) !== JSON.stringify(pt.set.roofs)) out.bad.push(id + ' roofs differ');
      for (const o of pt.addObjs || []) {
        const k = (o.kind === 'decal' ? v.decals : o.kind === 'prop' ? v.props : []).filter(x => x.id === o.id);
        if (o.kind === 'decal') out.decals++; else out.props++;
        if (k.length !== 1 || k[0].x !== o.x || k[0].y !== o.y || k[0].sprite !== o.sprite) out.bad.push(id + ' ' + o.id);
        else if (!k[0].art) out.bad.push('no art ' + o.sprite);
      }
    }
    return out;
  });
  expect(r.bad).toEqual([]);
  expect(r.maps).toEqual([...OUTDOOR].sort());
  expect(r.props).toBeGreaterThan(300);
  expect(r.decals).toBeGreaterThan(200);

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
      const allow = new Set(Object.keys(PAL).concat('.'));
      if (rows.length !== n || rows.some(row => row.length !== n || [...row].some(ch => !allow.has(ch)))) bad.push(k);
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

const GRASS = { g: 'g', grass_b: 'b', grass_c: 'c', flower_patch: 'f' };
const readGrass = page => page.evaluate(([ids, GRASS]) => ids.map(id => {
  PixelPets.goto(id, null, null, 'down');
  const info = PixelPets.mapInfo, n = {}, bad = [];
  let sig = '';
  for (let y = 0; y < info.h; y++) for (let x = 0; x < info.w; x++) {
    const t = PixelPets.tileInfo(x, y);
    if (t.ch === 'g') { if (!GRASS[t.tile]) bad.push(x + ',' + y + ' ' + t.tile); n[t.tile] = (n[t.tile] || 0) + 1; sig += GRASS[t.tile] || '?'; }
    else if (t.tile !== t.ch) bad.push(x + ',' + y + ' ' + t.ch + ' drawn as ' + t.tile);
  }
  return { id: info.id, n, bad, sig };
}), [OUTDOOR, GRASS]);

test('phase 2: outdoor maps take seeded grass, the same after a reload; hand-placed tiles never vary and nothing is saved', async ({ page }) => {
  await boot(page);
  const first = await readGrass(page);
  for (const m of first) {
    expect(m.bad, m.id).toEqual([]);
    expect(m.n.grass_b, m.id).toBeGreaterThan(0);
    expect(m.n.grass_c, m.id).toBeGreaterThan(0);
  }
  expect(first.reduce((s, m) => s + (m.n.flower_patch || 0), 0)).toBeGreaterThan(20);
  await page.reload();
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
  const again = await readGrass(page);
  expect(again.map(m => m.sig)).toEqual(first.map(m => m.sig));
  const saved = await page.evaluate(() => ({ raw: localStorage.getItem('pixelpets.save.v2') || '', v: PixelPets.state.v }));
  expect(saved.v).toBe(2);
  expect(saved.raw).toContain('"v":2');
  expect(saved.raw).not.toMatch(/grass_b|grass_c|flower_patch|puddle|leaf_litter|variants/);
});

test('phase 2: the 70 % floor check covers the outdoor maps; Mahopac and Fernbrook Heights pass, the lab bay is unchanged', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate((ids) => {
    const plain = id => {   // the share plain `g` would have without variants
      PixelPets.goto(id, null, null, 'down');
      const info = PixelPets.mapInfo; let walk = 0, g = 0;
      for (let y = 0; y < info.h; y++) for (let x = 0; x < info.w; x++) { const t = PixelPets.tileInfo(x, y); if (!t.solid) { walk++; if (t.ch === 'g') g++; } }
      return { walk, share: g / walk };
    };
    return { fs: Object.fromEntries(ids.concat(['rx_f4']).map(id => [id, PixelPets.floorShare(id)])), cap: PixelPets.devChecks().floorCap,
      plain: { mahopac: plain('mahopac'), fb_heights: plain('fb_heights') } };
  }, OUTDOOR);
  expect(r.cap).toEqual([]);
  for (const id of OUTDOOR) {
    expect(r.fs[id], id).not.toBeNull();
    expect(r.fs[id].share, id).toBeLessThanOrEqual(0.7);
  }
  for (const [id, walk] of [['mahopac', 232], ['fb_heights', 280]]) {
    expect(r.plain[id].walk, id).toBe(walk);
    expect(r.plain[id].share, id).toBeGreaterThan(0.8);
    expect(r.fs[id], id).toMatchObject({ walk, tile: 'g' });
  }
  expect(r.fs.rx_f4.walk).toBe(216);
  expect(r.fs.rx_f4.share).toBeLessThan(0.7);
});

test('phase 2: puddles and leaf litter are flat decals: drawn, walkable, never talk, off exits, door fronts and paths', async ({ page }) => {
  await boot(page);
  for (const id of OUTDOOR) {
    const r = await page.evaluate((id) => {
      PixelPets.goto(id, null, null, 'down');
      const v = PixelPets.exteriors(id), info = PixelPets.mapInfo, bad = [], key = (x, y) => x + ',' + y;
      const ground = id === 'cobble_quarry' ? 'gc' : 'g', keep = new Set([key(v.safe.x, v.safe.y)]);
      for (const o of info.objs) {
        if (o.kind !== 'decal') keep.add(key(o.x, o.y));
        if (o.kind === 'warp' || o.kind === 'trigger') [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => keep.add(key(o.x + dx, o.y + dy)));
        if (o.kind === 'door') keep.add(key(o.x, o.y + 1));
      }
      for (const d of v.decals) {
        const t = PixelPets.tileInfo(d.x, d.y);
        if (d.sprite !== 'puddle' && d.sprite !== 'leaf_litter') bad.push(d.id + ' sprite ' + d.sprite);
        if (!d.art || d.art[0] !== 16 || d.art[1] !== 16) bad.push(d.id + ' art');
        if (t.blocked || t.solid || t.decal !== d.sprite) bad.push(d.id + ' ' + JSON.stringify(t));
        if (ground.indexOf(t.ch) < 0) bad.push(d.id + ' on ' + t.ch);
        if (keep.has(key(d.x, d.y))) bad.push(d.id + ' on an exit, door front, object or the safe tile');
      }
      return { id: info.id, n: v.decals.length, kinds: [...new Set(v.decals.map(d => d.sprite))].sort(), bad };
    }, id);
    expect(r.id).toBe(id);
    expect(r.bad, id).toEqual([]);
    expect(r.n, id).toBeGreaterThan(5);
  }

  await page.evaluate(() => PixelPets.goto('mahopac', 9, 9, 'down'));
  const d = await page.evaluate(() => PixelPets.exteriors('mahopac').decals.find(d => !PixelPets.tileInfo(d.x - 1, d.y).blocked));
  expect(d).toBeTruthy();
  await page.evaluate(([x, y]) => { PixelPets.goto('mahopac', x, y, 'right'); if (PixelPets.clearWild) PixelPets.clearWild(); }, [d.x - 1, d.y]);
  await page.waitForTimeout(300);
  await page.keyboard.press('Space');
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => PixelPets.scene)).toBeFalsy();
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(([x, y]) => PixelPets.state.world.x === x && PixelPets.state.world.y === y, [d.x, d.y]);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(300);
  await shot(page, 'b4-mahopac-decal');
});

const SHORT = { highcharity: 2, route2: 4 };   // 320 screens with no free cell left off paths, zones, sight lines and door fronts
test('phase 2: props reach 6 per 320 screen (10 x 17 tiles) where a free cell is left, and no B4 object shortens a sight line', async ({ page }) => {
  await boot(page);
  for (const id of OUTDOOR) {
    const r = await page.evaluate((id) => {
      PixelPets.goto(id, null, null, 'down');
      const info = PixelPets.mapInfo, v = PixelPets.exteriors(id);
      const things = v.props.concat(info.objs.filter(o => o.kind === 'sign' || o.kind === 'pickup'));
      const vw = Math.min(10, info.w), vh = Math.min(17, info.h), counts = [];
      for (let y = 0; y + vh <= info.h; y++) for (let x = 0; x + vw <= info.w; x++)
        counts.push(things.filter(o => o.x >= x && o.x < x + vw && o.y >= y && o.y < y + vh).length);
      const mine = new Set((MAPDATA.detail_b4.slicePatch.maps[id].addObjs || []).map(o => o.x + ',' + o.y)), T = {};
      for (const k of ['maps_slice', 'act1_route2', 'cobblecrest', 'glimmer_path', 'mahopac', 'highcharity', 'heights', 'civic'])
        if (MAPDATA[k] && MAPDATA[k].trainers) for (const [tid, t] of Object.entries(MAPDATA[k].trainers)) T[tid] = Object.assign({}, T[tid] || {}, t);
      const D = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }, cut = [];
      for (const [tid, line] of Object.entries(PixelPets.sightLines)) {
        const t = T[tid], o = info.objs.find(x => x.id === tid), d = t && D[t.facing || 'down'];
        if (!d || !o || !(t.sight > line.length)) continue;
        if (mine.has((o.x + d[0] * (line.length + 1)) + ',' + (o.y + d[1] * (line.length + 1)))) cut.push(tid);
      }
      return { id: info.id, min: Math.min(...counts), short: counts.filter(n => n < 6).length, screens: counts.length, cut };
    }, id);
    expect(r.id).toBe(id);
    expect(r.cut, id).toEqual([]);
    expect(r.short, id).toBeLessThanOrEqual(SHORT[id] || 0);
    expect(r.min, id).toBeGreaterThanOrEqual(SHORT[id] ? 4 : 6);
  }
});

test('phase 2: ground under a cut roof takes the same seeded grass as the map around it', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate((towns) => towns.map(id => {
    PixelPets.goto(id, null, null, 'down');
    const g = {};
    for (const b of PixelPets.exteriors(id).buildings) for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) {
      const c = PixelPets.exteriorCell(x, y);
      if (c.cut) g[c.ground] = (g[c.ground] || 0) + 1;
    }
    return [id, g];
  }), Object.keys(TOWNS));
  const all = {};
  for (const [id, g] of r) {
    expect(Object.keys(g).length, id).toBeGreaterThan(0);
    for (const [k, n] of Object.entries(g)) all[k] = (all[k] || 0) + n;
  }
  expect(Object.keys(all).filter(k => k !== 'g' && k !== 'P').sort()).toEqual(['flower_patch', 'grass_b', 'grass_c']);
  expect(all.grass_b + all.grass_c).toBeGreaterThan(20);
});

test('the B4 debug views stay inert without ?debug=1', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page);
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.state);
  expect(await page.evaluate(() => [PixelPets.debug, PixelPets.exteriors('hearthmoor'), PixelPets.exteriorCell(2, 2)])).toEqual([false, null, null]);
});
