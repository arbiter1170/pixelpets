/* Interior wall kit, PR 1: Your Home opts in. Other rooms keep their tiles.
   Walls stay two tiles tall. Save v stays 2. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const PAL_KEYS = ['k','p','r','o','y','l','g','t','n','b','c','s','w','h','m','d','1','2','3','4','5','6','A','B','C','D','E','F','G','H','I','J','P','K'];
const G = '#b5845a', Y = '#ffcd75', F = '#5c4033', W = '#f4f4f4', H = '#94b0c2', B = '#a8674a', C = '#41a6f6', S = '#73eff7', D = '#333c57';
const HOME_WALL = { c:'G', C:'y', L:'F', f:'w', F:'h', T:'G', B:'B', S:'F', R:'G', G:'c', W:'s', D:'B' };
const KIT_COLOURS = new Set([G, Y, F, W, H, B, C, S]);
const ROW1 = ['side_w','face_l','face_win','face','face','face','face_win','face_r','side_e'];
const OTHERS = [
  { id: 'hm_home_up', x: 4, y: 4 },
  { id: 'hm_lantern_in', x: 4, y: 4 },
  { id: 'hm_rook_in', x: 3, y: 3 },
  { id: 'hm_lodge_in', x: 5, y: 4 },
  { id: 'hm_hq_f1', x: 6, y: 4 },
  { id: 'mahopac_obs', x: 4, y: 4 },
  { id: 'hc_bank_in', x: 4, y: 4 },
  { id: 'sm_yard', x: 9, y: 4 },
  { id: 'rx_f1', x: 8, y: 4 },
];

function save() {
  const s = starterSave();
  s.settings.follower = false;
  return s;
}

async function boot(page) {
  await installSave(page.context(), save(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
}

test('Your Home draws the wall kit, and rooms without it keep their tiles', async ({ page }) => {
  await boot(page);
  const report = await page.evaluate(async ({ others }) => {
    const hexOf = (data) => '#' + [data[0], data[1], data[2]].map(n => n.toString(16).padStart(2, '0')).join('');
    const tileHex = (tile, x, y) => {
      const c = buildTiles()[tile];
      if (!c) return null;
      const d = c.getContext('2d').getImageData(x, y, 1, 1).data;
      return d[3] ? hexOf(d) : 'clear';
    };
    const settle = () => new Promise(r => {
      const tick = () => {
        if (PixelPets.fading) requestAnimationFrame(tick);
        else requestAnimationFrame(() => requestAnimationFrame(r));
      };
      tick();
    });
    const at = (tx, ty, ox, oy) => {
      const c = document.querySelector('#mapCanvas');
      const d = c.getContext('2d').getImageData(tx * 16 - PixelPets.walk.cam.x + ox, ty * 16 - PixelPets.walk.cam.y + oy, 1, 1).data;
      return hexOf(d);
    };
    const cells = () => {
      const info = PixelPets.mapInfo, rows = [];
      for (let y = 0; y < info.h; y++) {
        const row = [];
        for (let x = 0; x < info.w; x++) row.push(PixelPets.tileInfo(x, y));
        rows.push(row);
      }
      return { id: info.id, w: info.w, h: info.h, rows };
    };
    const bakedKit = buildWallKit('house_home', HOUSE_SKINS.house_home.wall);
    const parts = Object.keys(bakedKit).sort();
    const kitPx = [];
    for (const name of parts) {
      const c = bakedKit[name];
      const d = c.getContext('2d').getImageData(0, 0, 16, 16).data;
      const colours = {};
      for (let i = 0; i < d.length; i += 4) {
        if (!d[i + 3]) continue;
        const hex = hexOf(d.subarray(i, i + 3));
        colours[hex] = (colours[hex] || 0) + 1;
      }
      kitPx.push({ name, colours });
    }
    const opted = Object.entries(SKINS).filter(([, sk]) => sk.wall).map(([id]) => id);
    const lists = {
      home: (MAPDATA.detail_b5.slicePatch.maps.hm_home_in.set.wall || {}).windows,
      up: (MAPDATA.detail_b5.slicePatch.maps.hm_home_up.set.wall || {}).windows,
    };
    PixelPets.goto('hm_home_in', 2, 4, 'down');
    await settle();
    const home = cells();
    const drawn = {
      cap: at(0, 0, 0, 0),
      lip: at(0, 0, 15, 15),
      face: at(4, 1, 4, 4),
      trim: at(4, 1, 4, 9),
      board: at(4, 1, 4, 13),
      shine: at(2, 1, 4, 3),
      glass: at(2, 1, 6, 3),
      plain: at(3, 1, 4, 4),
      shade: at(4, 2, 0, 0),
      side: at(1, 3, 0, 4),
      bedShadow: at(1, 2, 0, 0),
      bed: at(1, 2, 2, 0),
    };
    const shares = ['hm_home_in', 'hm_home_up'].map(id => {
      const s = PixelPets.floorShare(id);
      return { id, tile: s.tile, share: s.share };
    });
    const othersOut = [];
    for (const room of others) {
      PixelPets.goto(room.id, room.x, room.y, 'up');
      await settle();
      const info = PixelPets.mapInfo;
      const canvas = document.querySelector('#mapCanvas');
      const on = (tx, ty, ox, oy) => {
        const px = tx * 16 - PixelPets.walk.cam.x + ox;
        const py = ty * 16 - PixelPets.walk.cam.y + oy;
        return px >= 0 && py >= 0 && px < canvas.width && py < canvas.height;
      };
      const blocked = new Set(PixelPets.mapObjs.filter(o => o.block).map(o => o.x + ',' + o.y));
      blocked.add(room.x + ',' + room.y);
      let odd = null, even = null;
      for (let y = 0; y < info.h; y++) for (let x = 0; x < info.w; x++) {
        const t = PixelPets.tileInfo(x, y);
        if (t.ch !== 'W' || blocked.has(x + ',' + y) || !on(x, y, 6, 4)) continue;
        if (x % 2 === 1 && !odd) odd = { x, y, t };
        if (x % 2 === 0 && !even) even = { x, y, t };
      }
      const sample = room.id === 'rx_f1' ? even : odd;
      const px = sample ? at(sample.x, sample.y, 6, 4) : null;
      const baked = sample ? tileHex(sample.t.tile, 6, 4) : null;
      othersOut.push({
        id: info.id, w: info.w, h: info.h,
        odd: odd && { x: odd.x, y: odd.y, tile: odd.t.tile, part: odd.t.part, shade: odd.t.shade, ch: odd.t.ch },
        even: even && { tile: even.t.tile, part: even.t.part },
        px, baked,
      });
    }
    PixelPets.goto('hm_home_up', 4, 5, 'up');
    await settle();
    const loftWin = PixelPets.tileInfo(3, 1);
    const loftGlass = at(3, 1, 6, 4);
    return {
      keys: Object.keys(PAL),
      wall: HOUSE_SKINS.house_home.wall,
      opted, parts, kitPx, lists, home, drawn, shares,
      loftWin: { tile: loftWin.tile, part: loftWin.part, shade: loftWin.shade },
      loftGlass, othersOut,
      v: PixelPets.state.v,
      cap: PixelPets.devChecks().floorCap,
      ids: (() => { PixelPets.goto('hm_home_in', 4, 6, 'up'); return PixelPets.mapObjs.map(o => o.id); })(),
    };
  }, { others: OTHERS });

  expect(report.v).toBe(2);
  expect(report.cap).toEqual([]);
  expect(report.keys.slice().sort()).toEqual(PAL_KEYS.slice().sort());
  expect(report.wall).toEqual(HOME_WALL);
  expect(report.opted).toEqual(['house_home']);
  expect(report.lists).toEqual({ home: [2, 6], up: [3, 5] });
  expect(report.parts).toEqual([
    'house_home__cap_n', 'house_home__cap_ne', 'house_home__cap_nw', 'house_home__cap_s', 'house_home__cap_se', 'house_home__cap_sw',
    'house_home__face', 'house_home__face_door', 'house_home__face_l', 'house_home__face_r', 'house_home__face_win',
    'house_home__jamb_l', 'house_home__jamb_r', 'house_home__shadow_e', 'house_home__shadow_n', 'house_home__shadow_ne', 'house_home__shadow_nw', 'house_home__shadow_w',
    'house_home__side_e', 'house_home__side_w',
  ]);
  for (const part of report.kitPx) {
    expect(Object.keys(part.colours).length, part.name).toBeGreaterThan(0);
    for (const hex of Object.keys(part.colours)) expect(KIT_COLOURS.has(hex), part.name + ' ' + hex).toBe(true);
  }
  expect(report.home.w).toBe(9);
  expect(report.home.h).toBe(8);
  const info = report.home.rows;
  expect(info[0][0].part).toBe('cap_nw');
  expect(info[0][8].part).toBe('cap_ne');
  expect(info[7][0].part).toBe('cap_sw');
  expect(info[7][8].part).toBe('cap_se');
  expect(info[1].map(c => c.part)).toEqual(ROW1);
  expect(info[7][3].part).toBe('jamb_l');
  expect(info[7][5].part).toBe('jamb_r');
  const wins = [];
  for (let y = 0; y < 8; y++) for (let x = 0; x < 9; x++) if (info[y][x].part === 'face_win') wins.push(x + ',' + y);
  expect(wins).toEqual(['2,1', '6,1']);
  expect(info[0][4].tile).toBe('house_home__cap_n');
  expect(info[1][4].tile).toBe('house_home__face');
  for (let y = 0; y < 8; y++) for (let x = 0; x < 9; x++) {
    const t = info[y][x];
    const walk = t.ch !== '#' && t.ch !== 'W';
    expect(t.walk, x + ',' + y + ' ' + t.ch).toBe(walk);
    if (t.ch === '#' || t.ch === 'W' || t.ch === 'm') expect(t.shade, x + ',' + y).toBe(null);
  }
  expect(info[2][1].shade).toBe('shadow_nw');
  for (let x = 2; x <= 6; x++) expect(info[2][x].shade, 'y2 ' + x).toBe('shadow_n');
  expect(info[2][7].shade).toBe('shadow_ne');
  for (let y = 3; y <= 6; y++) {
    expect(info[y][1].shade, 'side ' + y).toBe('shadow_w');
    expect(info[y][7].shade, 'side ' + y).toBe('shadow_e');
  }
  expect(info[7][4].ch).toBe('m');
  expect(info[5][1].ch).toBe('^');
  expect(info[5][1].walk).toBe(true);
  expect(report.drawn).toEqual({
    cap: G, lip: F, face: W, trim: G, board: B, shine: S, glass: C, plain: W,
    shade: F, side: F, bedShadow: F, bed: D,
  });
  for (const row of report.shares) expect(row.share, row.id + ' ' + row.tile).toBeLessThanOrEqual(0.7);
  expect(report.ids).toEqual(expect.arrayContaining(['home_mat', 'home_stairs', 'home_bed']));
  expect(report.loftWin).toEqual({ tile: 'wall_cream_win', part: null, shade: null });
  expect(report.loftGlass).toBe(S);
  for (const room of report.othersOut) {
    expect(room.odd, room.id).toBeTruthy();
    expect(room.odd.part, room.id).toBe(null);
    expect(room.odd.shade, room.id).toBe(null);
    expect(room.odd.tile, room.id).not.toContain('__');
    if (room.id === 'sm_yard') expect(room.odd.tile.startsWith('tunnel_wall'), room.odd.tile).toBe(true);
    else if (room.id !== 'rx_f1') expect(room.odd.tile.endsWith('_win'), room.id + ' ' + room.odd.tile).toBe(true);
    if (room.id !== 'rx_f1') expect(room.px, room.id + ' ' + room.odd.tile).toBe(room.baked);
    else {
      expect(room.even.part).toBe(null);
      expect(room.even.tile, room.id).not.toContain('__');
      expect(room.px, room.even.tile).toBe(room.baked);
    }
  }
  const loft = report.othersOut.find(r => r.id === 'hm_home_up');
  expect(loft.odd.tile).toBe('wall_cream_win');
  expect(loft.odd.y).toBe(1);
});
