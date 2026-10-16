/* Rook's House and the Warden's Lodge: the drawn floors and walls use the new tiles.
   Keys A–G stay the lantern values. H, I and J are defined once. The Keeper House rooms stay grey. */
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
};
const HQ_FILL = {
  floor_flag: '#94b0c2', floor_flag_b: '#566c86', floor_flag_c: '#94b0c2',
  floor_ink: '#257179', floor_ink_b: '#29366f', floor_ink_c: '#257179',
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
  expect(setup.rook.remap).toEqual({ '#': 'wall_rose', W: 'wall_rose_face', W2: 'wall_rose_win', '.': 'floor_honey', '=': 'rug_calloway', m: 'mat_calloway' });
  expect(setup.rook.decal).toEqual({ v: 'wall_shadow_rose', u: 'window_light_rose' });
  expect(setup.rook.variants.floor_honey.map(row => row[0])).toEqual(['floor_honey_b', 'floor_honey_c']);
  expect(setup.lodge.remap).toEqual({ '#': 'wall_warden', W: 'wall_warden_face', W2: 'wall_warden_win', '.': 'floor_warden', '=': 'rug_warden', m: 'mat_warden' });
  expect(setup.lodge.decal).toEqual({ v: 'wall_shadow_warden', u: 'window_light_warden' });
  expect(setup.lodge.variants.floor_warden.map(row => row[0])).toEqual(['floor_warden_b', 'floor_warden_c']);
  expect(setup.hq.remap['.']).toBe('floor_flag');
  expect(setup.hq.remap['#']).toBe('wall_stone');
  expect(setup.hq.decal).toEqual({ v: 'wall_shadow', u: 'window_light' });
  expect(setup.up.remap['.']).toBe('floor_ink');
  expect(setup.up.remap['#']).toBe('wall_panel');
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
  expect(rook.face).toBe('wall_rose_face');
  expect(rook.plaster).toBe(ROOM.H);
  expect(rook.rail).toBe(WARM.G);
  expect(rook.wain).toBe(WARM.A);
  expect(rook.foot).toBe(WARM.F);
  expect(rook.win).toBe('wall_rose_win');
  expect(rook.glow).toBe('#ffcd75');
  expect(rook.cap).toBe(ROOM.H);
  expect(rook.decal).toBe('wall_shadow_rose');
  expect(rook.shade).toBe(WARM.F);

  expect(lodge.floors.length).toBeGreaterThan(0);
  expect(lodge.banned).toEqual([]);
  for (const cell of lodge.floors) expect(cell.got, cell.tile).toBe(FILL[cell.tile]);
  expect(lodge.face).toBe('wall_warden_face');
  expect(lodge.timber).toBe(WARM.G);
  expect(lodge.gold).toBe('#ffcd75');
  expect(lodge.green).toBe(ROOM.J);
  expect(lodge.foot).toBe(WARM.F);
  expect(lodge.win).toBe('wall_warden_win');
  expect(lodge.glow).toBe('#ffcd75');
  expect(lodge.beam).toBe(WARM.F);
  expect(lodge.decal).toBe('wall_shadow_warden');
  expect(lodge.shade).toBe(WARM.F);
  expect(lodge.runner).toEqual({ tile: 'rug_warden', fill: ROOM.J });

  expect(hq.floors.length).toBeGreaterThan(0);
  expect(up.floors.length).toBeGreaterThan(0);
  for (const cell of hq.floors) expect(cell.got, cell.tile).toBe(HQ_FILL[cell.tile]);
  for (const cell of up.floors) expect(cell.got, cell.tile).toBe(HQ_FILL[cell.tile]);
  expect(hq.face).toBe('wall_stone_face');
  expect(up.face).toBe('wall_panel_face');
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});
