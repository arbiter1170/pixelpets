/* Rook's House and the Warden's Lodge: the drawn floors and walls use the new tiles.
   Keys A–G stay the lantern values. H, I and J are defined once. The Keeper House uses the slate key K. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const WARM = { A: '#c9925e', B: '#a8674a', C: '#e3d3ac', D: '#9fae86', E: '#5f6e4f', F: '#5c4033', G: '#b5845a' };
const ROOM = { H: '#b9877a', I: '#9c9382', J: '#2f5a3e' };
const RED = '#b13e53';
const ORANGE = '#ef7d57';
const FILL = {
  floor_honey: WARM.G, floor_honey_b: WARM.A, floor_honey_c: WARM.G,
  floor_warden: ROOM.I, floor_warden_b: ROOM.I, floor_warden_c: WARM.G,
  floor_calloway: WARM.G, floor_calloway_b: WARM.G, floor_calloway_c: WARM.G,
  floor_wardstone: ROOM.I, floor_wardstone_b: ROOM.I, floor_wardstone_c: ROOM.I,
};
const SLATE = '#7a8aa0';
const HQ_FILL = {
  floor_keep: SLATE, floor_keep_b: SLATE, floor_keep_c: SLATE,
};

function save() {
  const s = starterSave();
  s.settings.follower = false;
  return s;
}

test('Rook\'s House and the Warden\'s Lodge render their new floors', async ({ page }) => {
  await installSave(page.context(), save(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));

  const setup = await page.evaluate(({ warm, room }) => {
    const added = {};
    Object.keys(warm).forEach(k => { added[k] = PAL[k]; });
    const shared = {};
    Object.keys(room).forEach(k => { shared[k] = PAL[k]; });
    const tiles = buildTiles();
    function skinNames(skin) {
      const names = [];
      Object.values(skin.remap || {}).forEach(n => names.push(n));
      Object.values(skin.decal || {}).forEach(n => names.push(n));
      Object.entries(skin.variants || {}).forEach(([base, vars]) => {
        names.push(base);
        vars.forEach(row => names.push(row[0]));
      });
      return names;
    }
    const missing = (skin) => skinNames(skin).filter(n => !tiles[n]);
    const px = (tile, x, y) => {
      const d = tiles[tile].getContext('2d').getImageData(x, y, 1, 1).data;
      return '#' + [d[0], d[1], d[2]].map(n => n.toString(16).padStart(2, '0')).join('');
    };
    const shares = ['hm_rook_in', 'hm_lodge_in', 'hm_hq_f1', 'hm_hq_f2'].map(id => {
      const s = PixelPets.floorShare(id);
      return { id, tile: s.tile, share: s.share };
    });
    return {
      added, shared, v: PixelPets.state.v, cap: PixelPets.devChecks().floorCap, shares,
      rook: HOUSE_SKINS.house_rook, lodge: HOUSE_SKINS.house_lodge,
      hq: HOUSE_SKINS.house_hq, up: HOUSE_SKINS.house_hq_up,
      missingRook: missing(HOUSE_SKINS.house_rook),
      missingLodge: missing(HOUSE_SKINS.house_lodge),
      oldTiles: {
        brick: px('wall_brick', 4, 8),
        rookFloor: px('house_rook', 2, 2),
        log: px('wall_log', 2, 1),
        logFloor: px('house_log', 3, 2),
        rug: px('rug_calloway', 0, 0),
        mat: px('mat_calloway', 8, 8),
        runner: px('rug_warden', 4, 4),
        edge: px('rug_warden', 0, 4),
        lodgeMat: px('mat_warden', 8, 8),
      },
    };
  }, { warm: WARM, room: ROOM });

  expect(setup.v).toBe(2);
  expect(setup.added).toEqual(WARM);
  expect(setup.shared).toEqual(ROOM);
  expect(setup.cap).toEqual([]);
  for (const row of setup.shares) expect(row.share, row.id + ' ' + row.tile).toBeLessThanOrEqual(0.7);
  expect(setup.missingRook).toEqual([]);
  expect(setup.missingLodge).toEqual([]);
  expect(setup.rook.remap).toEqual({ '#': 'wall_rose', W: 'wall_rose_face', W2: 'wall_rose_win', '.': 'floor_calloway', '=': 'rug_calloway', m: 'mat_calloway' });
  expect(setup.rook.decal).toEqual({ v: 'wall_shadow_rose', u: 'window_light_rose' });
  expect(setup.rook.variants.floor_calloway.map(row => row[0])).toEqual(['floor_calloway_b', 'floor_calloway_c']);
  expect(setup.lodge.remap).toEqual({ '#': 'wall_warden', W: 'wall_warden_face', W2: 'wall_warden_win', '.': 'floor_wardstone', '=': 'rug_warden', m: 'mat_warden' });
  expect(setup.lodge.decal).toEqual({ v: 'wall_shadow_warden', u: 'window_light_warden' });
  expect(setup.lodge.variants.floor_wardstone.map(row => row[0])).toEqual(['floor_wardstone_b', 'floor_wardstone_c']);
  expect(setup.hq.remap).toEqual(setup.up.remap);
  expect(setup.hq.remap['.']).toBe('floor_keep');
  expect(setup.hq.remap['#']).toBe('wall_keep');
  expect(setup.hq.remap[',']).toBe('floor_keep_tile');
  expect(setup.hq.remap[';']).toBe('floor_keep_ops');
  expect(setup.hq.remap.i).toBe('floor_keep_carpet');
  expect(setup.hq.decal).toEqual({ v: 'wall_shadow_keep', u: 'window_light_keep' });
  expect(setup.up.decal).toEqual({ v: 'wall_shadow_keep', u: 'window_light_keep' });
  expect(setup.oldTiles).toEqual({
    brick: RED, rookFloor: RED, log: ORANGE, logFloor: ORANGE,
    rug: WARM.E, mat: WARM.G, runner: ROOM.J, edge: '#ffcd75', lodgeMat: '#ffcd75',
  });

  const drawn = await page.evaluate(async () => {
    const hex = (x, y) => {
      const c = document.querySelector('#mapCanvas');
      const d = c.getContext('2d').getImageData(x, y, 1, 1).data;
      return '#' + [d[0], d[1], d[2]].map(n => n.toString(16).padStart(2, '0')).join('');
    };
    const at = (tx, ty, ox, oy) => hex(tx * 16 - PixelPets.walk.cam.x + ox, ty * 16 - PixelPets.walk.cam.y + oy);
    const settle = () => new Promise(r => {
      const tick = () => {
        if (PixelPets.fading) requestAnimationFrame(tick);
        else requestAnimationFrame(() => requestAnimationFrame(r));
      };
      tick();
    });
    const rooms = [
      { id: 'hm_rook_in', x: 3, y: 4 },
      { id: 'hm_lodge_in', x: 5, y: 7 },
      { id: 'hm_hq_f1', x: 4, y: 6 },
      { id: 'hm_hq_f2', x: 4, y: 6 },
    ];
    const out = [];
    for (const room of rooms) {
      PixelPets.goto(room.id, room.x, room.y, 'up');
      await settle();
      const info = PixelPets.mapInfo;
      const blocked = new Set(PixelPets.mapObjs.map(o => o.x + ',' + o.y));
      blocked.add(room.x + ',' + room.y);
      blocked.add(room.x + ',' + (room.y - 1));
      const on = (tx, ty, ox, oy) => {
        const c = document.querySelector('#mapCanvas');
        const px = tx * 16 - PixelPets.walk.cam.x + ox;
        const py = ty * 16 - PixelPets.walk.cam.y + oy;
        return px >= 0 && py >= 0 && px < c.width && py < c.height;
      };
      const floors = [];
      const banned = [];
      for (let y = 0; y < info.h; y++) for (let x = 0; x < info.w; x++) {
        const t = PixelPets.tileInfo(x, y);
        if (t.ch !== '.' || blocked.has(x + ',' + y) || !on(x, y, 2, 2)) continue;
        const got = at(x, y, 2, 2);
        floors.push({ x, y, tile: t.tile, got });
        if (got === '#b13e53' || got === '#ef7d57') banned.push(x + ',' + y + ' floor ' + t.tile);
      }
      for (let y = 0; y < info.h; y++) for (let x = 0; x < info.w; x++) {
        const t = PixelPets.tileInfo(x, y);
        if (t.ch === '#' && on(x, y, 8, 8) && (at(x, y, 8, 8) === '#b13e53' || at(x, y, 8, 8) === '#ef7d57')) banned.push(x + ',' + y + ' wall ' + t.tile);
      }
      const face = PixelPets.tileInfo(2, 1);
      const win = PixelPets.tileInfo(3, 1);
      out.push({
        id: room.id, floors, banned,
        face: face.tile,
        plaster: at(2, 1, 8, 3),
        timber: at(2, 1, 2, 3),
        rail: at(2, 1, 8, 8),
        gold: at(2, 1, 2, 9),
        wain: at(2, 1, 8, 12),
        green: at(2, 1, 2, 12),
        foot: at(2, 1, 8, 15),
        win: win.tile,
        glow: at(3, 1, 6, 4),
        cap: at(4, 0, 4, 8),
        beam: at(6, 0, 8, 8),
        decal: PixelPets.tileInfo(2, 2).decal,
        shade: at(2, 2, 0, 0),
        runner: room.id === 'hm_lodge_in' ? { tile: PixelPets.tileInfo(3, 5).tile, fill: at(3, 5, 4, 4) } : null,
        hqFloor: floors[0] || null,
        lamps: PixelPets.mapObjs.filter(o => o.sprite === 'keep_lamp' || o.sprite === 'keep_lamp_wall' || o.sprite === 'keep_radio' || o.sprite === 'keep_radio_rack').map(o => ({ x: o.x, y: o.y, sprite: o.sprite })),
      });
    }
    return out;
  });

  const rook = drawn.find(r => r.id === 'hm_rook_in');
  const lodge = drawn.find(r => r.id === 'hm_lodge_in');
  const hq = drawn.find(r => r.id === 'hm_hq_f1');
  const up = drawn.find(r => r.id === 'hm_hq_f2');

  expect(rook.floors.length).toBeGreaterThan(0);
  expect(rook.banned).toEqual([]);
  for (const cell of rook.floors) expect(cell.got, cell.tile).toBe(FILL[cell.tile]);
  expect(rook.face).toBe('house_rook__face');
  expect(rook.plaster).toBe(ROOM.H);
  expect(rook.rail).toBe(ROOM.H);
  expect(rook.wain).toBe(ROOM.H);
  expect(rook.foot).toBe(WARM.B);
  expect(rook.win).toBe('house_rook__face_win');
  expect(rook.glow).toBe('#41a6f6');
  expect(rook.cap).toBe(WARM.B);
  expect(rook.decal).toBe('wall_shadow_rose');
  expect(rook.shade).toBe(WARM.F);

  expect(lodge.floors.length).toBeGreaterThan(0);
  expect(lodge.banned).toEqual([]);
  for (const cell of lodge.floors) expect(cell.got, cell.tile).toBe(FILL[cell.tile]);
  expect(lodge.face).toBe('house_lodge__face');
  expect(lodge.timber).toBe(WARM.C);
  expect(lodge.gold).toBe(ROOM.J);
  expect(lodge.green).toBe(WARM.C);
  expect(lodge.foot).toBe(ROOM.I);
  expect(lodge.win).toBe('house_lodge__face');
  expect(lodge.glow).toBe(WARM.C);
  expect(lodge.beam).toBe(WARM.F);
  expect(lodge.decal).toBe('wall_shadow_warden');
  expect(lodge.shade).toBe(WARM.F);
  expect(lodge.runner).toEqual({ tile: 'rug_warden', fill: ROOM.J });

  const clearOfGlow = (cell, lamps) => lamps.every(l => {
    const r = ((l.sprite === 'keep_lamp' || l.sprite === 'keep_lamp_wall') ? 22 : 12) + 8;
    const dx = cell.x * 16 + 2 - (l.x * 16 + 8);
    const dy = cell.y * 16 + 2 - (l.y * 16 + 8);
    return dx * dx + dy * dy > r * r;
  });
  const hqFloors = hq.floors.filter(cell => clearOfGlow(cell, hq.lamps));
  const upFloors = up.floors.filter(cell => clearOfGlow(cell, up.lamps));
  expect(hqFloors.length).toBeGreaterThan(0);
  expect(upFloors.length).toBeGreaterThan(0);
  for (const cell of hqFloors) expect(cell.got, cell.tile).toBe(HQ_FILL[cell.tile]);
  for (const cell of upFloors) expect(cell.got, cell.tile).toBe(HQ_FILL[cell.tile]);
  expect(hq.face).toBe('house_hq__face');
  expect(up.face).toBe('house_hq_up__face');
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});

test('the lodge shade stays the timber brown at day and at night', async ({ page }) => {
  await installSave(page.context(), save(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
  const shades = await page.evaluate(async () => {
    const hexOf = (data) => '#' + [data[0], data[1], data[2]].map(n => n.toString(16).padStart(2, '0')).join('');
    const settle = () => new Promise(r => {
      const tick = () => {
        if (PixelPets.fading) requestAnimationFrame(tick);
        else requestAnimationFrame(() => requestAnimationFrame(r));
      };
      tick();
    });
    const sample = async (day, hh) => {
      PixelPets.clock.set(day, hh, 0);
      PixelPets.goto('hm_lodge_in', 5, 4, 'up');
      await settle();
      const c = document.querySelector('#mapCanvas');
      const d = c.getContext('2d').getImageData(2 * 16 - PixelPets.walk.cam.x, 2 * 16 - PixelPets.walk.cam.y, 1, 1).data;
      return { phase: PixelPets.clock.now().phase, lamps: window.PPClock.lampsOn(), shade: hexOf(d), room: PixelPets.mapInfo.room };
    };
    return { day: await sample('tue', 12), night: await sample('sun', 21) };
  });
  expect(shades.day.phase).toBe('day');
  expect(shades.day.lamps).toBe(false);
  expect(shades.day.room).toBe(true);
  expect(shades.day.shade).toBe(WARM.F);
  expect(shades.night.phase).toBe('night');
  expect(shades.night.lamps).toBe(true);
  expect(shades.night.room).toBe(true);
  expect(shades.night.shade).toBe(WARM.F);
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});
