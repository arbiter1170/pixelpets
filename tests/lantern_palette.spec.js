/* Lantern rooms: Hearthmoor and High Charity use the warm floor. Cobblecrest stays dark stone.
   The check reads the drawn map, so a missing tile cannot pass by name alone. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const OLD_PAL = {
  k: '#1a1c2c', p: '#5d275d', r: '#b13e53', o: '#ef7d57', y: '#ffcd75', l: '#a7f070', g: '#38b764', t: '#257179',
  n: '#29366f', b: '#3b5dc9', c: '#41a6f6', s: '#73eff7', w: '#f4f4f4', h: '#94b0c2', m: '#566c86', d: '#333c57',
  1: '#f9dcc0', 2: '#efbb8e', 3: '#d4955f', 4: '#a96e43', 5: '#7d4b2c', 6: '#5a3520',
};
const WARM = { A: '#c9925e', B: '#a8674a', C: '#e3d3ac', D: '#9fae86', E: '#5f6e4f', F: '#5c4033', G: '#b5845a' };
const FILL = {
  floor_lantern: WARM.A, floor_lantern_b: WARM.A, floor_lantern_c: WARM.G,
  floor_clinic_warm: WARM.A, floor_clinic_warm_b: WARM.A, floor_clinic_warm_c: WARM.C,
};

function save() {
  const s = starterSave();
  s.settings.follower = false;
  return s;
}

test('both lantern rooms render the warm floor, and Cobblecrest stays dark', async ({ page }) => {
  await installSave(page.context(), save(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));

  const setup = await page.evaluate(({ oldPal, warm }) => {
    const kept = {};
    Object.keys(oldPal).forEach(k => { kept[k] = PAL[k]; });
    const added = {};
    Object.keys(warm).forEach(k => { added[k] = PAL[k]; });
    const tiles = buildTiles();
    const missing = (skin) => skinNames(skin).filter(n => !tiles[n]);
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
    const px = (tile, x, y) => {
      const d = tiles[tile].getContext('2d').getImageData(x, y, 1, 1).data;
      return '#' + [d[0], d[1], d[2]].map(n => n.toString(16).padStart(2, '0')).join('');
    };
    const shares = ['hm_lantern_in', 'cc_lantern_in', 'hc_lantern_in'].map(id => {
      const s = PixelPets.floorShare(id);
      return { id, tile: s.tile, share: s.share };
    });
    return {
      kept, added, v: PixelPets.state.v, cap: PixelPets.devChecks().floorCap, shares,
      hm: HOUSE_SKINS.house_lantern, hc: HOUSE_SKINS.hc_lantern, cc: HOUSE_SKINS.house_cc_lantern,
      missingHm: missing(HOUSE_SKINS.house_lantern),
      missingHc: missing(HOUSE_SKINS.hc_lantern),
      missingCc: missing(HOUSE_SKINS.house_cc_lantern),
      oldTiles: {
        wall: px('wall_white', 4, 8),
        birch: px('house_birch', 4, 4),
        clinic: px('floor_clinic', 2, 2),
        grout: px('floor_clinic', 0, 0),
      },
    };
  }, { oldPal: OLD_PAL, warm: WARM });

  expect(setup.v).toBe(2);
  expect(setup.kept).toEqual(OLD_PAL);
  expect(setup.added).toEqual(WARM);
  expect(setup.cap).toEqual([]);
  for (const row of setup.shares) expect(row.share, row.id + ' ' + row.tile).toBeLessThanOrEqual(0.7);
  expect(setup.missingHm).toEqual([]);
  expect(setup.missingHc).toEqual([]);
  expect(setup.missingCc).toEqual([]);
  expect(setup.hm.remap).toEqual({ '#': 'wall_lantern', W: 'wall_lantern_face', W2: 'wall_lantern_win', '.': 'floor_lantern', '=': 'rug_lantern', m: 'mat_lantern_warm' });
  expect(setup.hm.decal).toEqual({ v: 'wall_shadow_warm', u: 'window_light_warm' });
  expect(setup.hm.variants.floor_lantern.map(row => row[0])).toEqual(['floor_lantern_b', 'floor_lantern_c']);
  expect(setup.hc.remap['.']).toBe('floor_clinic_warm');
  expect(setup.hc.remap['#']).toBe('wall_sage');
  expect(setup.hc.remap.W).toBe('wall_sage_face');
  expect(setup.hc.remap.W2).toBe('wall_sage_win');
  expect(setup.hc.remap.m).toBe('mat_clinic_warm');
  expect(setup.hc.remap.j).toBe('floor_clinic_warm_b');
  expect(setup.hc.decal.v).toBe('wall_shadow_warm');
  expect(setup.hc.decal.u).toBe('window_light_warm');
  expect(setup.hc.variants.floor_clinic_warm.map(row => row[0])).toEqual(['floor_clinic_warm_b', 'floor_clinic_warm_c']);
  expect(setup.cc.remap['.']).toBe('floor_cobble');
  expect(setup.cc.remap['#']).toBe('wall_rough');
  expect(setup.cc.decal).toEqual({ v: 'wall_shadow', u: 'window_light' });
  expect(setup.oldTiles).toEqual({ wall: '#f4f4f4', birch: '#f4f4f4', clinic: '#f4f4f4', grout: '#41a6f6' });

  const drawn = await page.evaluate(async () => {
    const hex = (x, y) => {
      const c = document.querySelector('#mapCanvas');
      const d = c.getContext('2d').getImageData(x, y, 1, 1).data;
      return '#' + [d[0], d[1], d[2]].map(n => n.toString(16).padStart(2, '0')).join('');
    };
    const at = (tx, ty, ox, oy) => {
      const x = tx * 16 - PixelPets.walk.cam.x + ox;
      const y = ty * 16 - PixelPets.walk.cam.y + oy;
      return hex(x, y);
    };
    const rooms = [
      { id: 'hm_lantern_in', x: 4, y: 5, face: 'wall_lantern_face', faceHex: '#e3d3ac', wain: '#5f6e4f', grout: '#a8674a' },
      { id: 'hc_lantern_in', x: 4, y: 5, face: 'wall_sage_face', faceHex: '#9fae86', wain: '#257179', grout: '#5f6e4f' },
      { id: 'cc_lantern_in', x: 4, y: 5 },
    ];
    const out = [];
    for (const room of rooms) {
      PixelPets.goto(room.id, room.x, room.y, 'up');
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const info = PixelPets.mapInfo;
      const blocked = new Set(PixelPets.mapObjs.map(o => o.x + ',' + o.y));
      blocked.add(room.x + ',' + room.y);
      blocked.add(room.x + ',' + (room.y - 1));
      const floors = [];
      const white = [];
      for (let y = 0; y < info.h; y++) for (let x = 0; x < info.w; x++) {
        const t = PixelPets.tileInfo(x, y);
        if (t.ch !== '.' || blocked.has(x + ',' + y)) continue;
        const got = at(x, y, 2, 2);
        floors.push({ x, y, tile: t.tile, got });
        if (got === '#f4f4f4') white.push(x + ',' + y + ' ' + t.tile);
      }
      const face = PixelPets.tileInfo(2, 1);
      const win = PixelPets.tileInfo(3, 1);
      const row = {
        id: room.id, floors, white,
        face: face.tile, faceHex: at(2, 1, 8, 3), wain: at(2, 1, 8, 12), foot: at(2, 1, 8, 15),
        win: win.tile, glow: at(3, 1, 7, 4),
        grout: (() => {
          const open = floors.find(f => !PixelPets.tileInfo(f.x, f.y).shade);
          return open ? at(open.x, open.y, 0, 0) : null;
        })(),
        decal: PixelPets.tileInfo(2, 2).decal,
      };
      out.push(row);
    }
    return out;
  }, FILL);

  const hm = drawn.find(r => r.id === 'hm_lantern_in');
  const hc = drawn.find(r => r.id === 'hc_lantern_in');
  const cc = drawn.find(r => r.id === 'cc_lantern_in');
  expect(hm.floors.length).toBeGreaterThan(0);
  expect(hc.floors.length).toBeGreaterThan(0);
  expect(hm.white).toEqual([]);
  expect(hc.white).toEqual([]);
  for (const cell of hm.floors.concat(hc.floors)) expect(cell.got, cell.tile).toBe(FILL[cell.tile]);
  expect(hm.face).toBe('house_lantern__face');
  expect(hm.faceHex).toBe('#e3d3ac');
  expect(hm.wain).toBe(WARM.C);
  expect(hm.foot).toBe(WARM.D);
  expect(hm.win).toBe('house_lantern__face');
  expect(hm.glow).toBe(WARM.C);
  expect(hm.grout).toBe('#a8674a');
  expect(hm.decal).toBe('wall_shadow_warm');
  expect(hc.face).toBe('hc_lantern__face');
  expect(hc.faceHex).toBe('#9fae86');
  expect(hc.wain).toBe(WARM.D);
  expect(hc.foot).toBe(WARM.E);
  expect(hc.win).toBe('hc_lantern__face');
  expect(hc.glow).toBe(WARM.D);
  expect(hc.grout).toBe('#5f6e4f');
  expect(hc.decal).toBe('wall_shadow_warm');
  expect(cc.floors.length).toBeGreaterThan(0);
  for (const cell of cc.floors) {
    expect(['floor_cobble', 'floor_cobble_b', 'floor_cobble_c']).toContain(cell.tile);
    expect(cell.got).not.toBe(WARM.A);
    expect(cell.got).not.toBe(WARM.G);
    expect(cell.got).not.toBe(WARM.C);
  }
  expect(cc.face).toBe('house_cc_lantern__face');
  expect(cc.decal).toBe('wall_shadow');
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});
