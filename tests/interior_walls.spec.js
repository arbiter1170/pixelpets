/* Interior wall kit: every interior uses it. Your Home keeps its two windows.
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
  expect(report.opted).toContain('house_home');
  expect(report.opted.length).toBe(37);
  expect(report.lists).toEqual({ home: [2, 6], up: [3, 5] });
  expect(report.parts).toEqual([
    'house_home__cap_n', 'house_home__cap_ne', 'house_home__cap_nw', 'house_home__cap_s', 'house_home__cap_se', 'house_home__cap_sw',
    'house_home__face', 'house_home__face_door', 'house_home__face_l', 'house_home__face_r', 'house_home__face_win',
    'house_home__jamb_l', 'house_home__jamb_n', 'house_home__jamb_n_e', 'house_home__jamb_r', 'house_home__jamb_s', 'house_home__jamb_s_e',
    'house_home__shadow_e', 'house_home__shadow_n', 'house_home__shadow_ne', 'house_home__shadow_nw', 'house_home__shadow_w',
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
  expect(report.loftWin).toEqual({ tile: 'house_loft__face_win', part: 'face_win', shade: null });
  expect(report.loftGlass).toBe(C);
});

const ROOMS = [
  { id: 'hm_home_in', skin: 'house_home', windows: [2, 6], doors: [], jambs: [[3, 7, 'jamb_l'], [5, 7, 'jamb_r']] },
  { id: 'cc_hall_in', skin: 'house_hall', windows: [4, 8], doors: [], jambs: [[4, 12, 'jamb_l'], [6, 12, 'jamb_r']] },
  { id: 'cc_lantern_in', skin: 'house_cc_lantern', windows: [4], doors: [], jambs: [[3, 6, 'jamb_l'], [5, 6, 'jamb_r']] },
  { id: 'dream_2004', skin: 'dream_2004', windows: [4, 8], doors: [], jambs: [] },
  { id: 'dream_drive', skin: 'dream_drive', windows: [3, 6], doors: [], jambs: [] },
  { id: 'dream_party', skin: 'dream_party', windows: [4, 7], doors: [], jambs: [] },
  { id: 'fb_hall_in', skin: 'fb_hall', windows: [4, 7, 11], doors: [], jambs: [[6, 23, 'jamb_l'], [8, 23, 'jamb_r']] },
  { id: 'fb_lantern_in', skin: 'fb_lantern', windows: [4, 7], doors: [], jambs: [[4, 15, 'jamb_l'], [6, 15, 'jamb_r']] },
  { id: 'hc_airport_in', skin: 'hc_airport', windows: [3, 6], doors: [], jambs: [[3, 6, 'jamb_l'], [5, 6, 'jamb_r']] },
  { id: 'hc_apt_in', skin: 'hc_apt', windows: [3], doors: [], jambs: [[2, 5, 'jamb_l'], [4, 5, 'jamb_r']] },
  { id: 'hc_arena_in', skin: 'hc_arena', windows: [4, 7], doors: [], jambs: [[4, 8, 'jamb_l'], [6, 8, 'jamb_r']] },
  { id: 'hc_bank_in', skin: 'hc_bank', windows: [3], doors: [], jambs: [[3, 6, 'jamb_l'], [5, 6, 'jamb_r']] },
  { id: 'hc_barracks_in', skin: 'hc_barracks', windows: [3], doors: [], jambs: [[3, 6, 'jamb_l'], [5, 6, 'jamb_r']] },
  { id: 'hc_church_in', skin: 'hc_church', windows: [4, 7], doors: [], jambs: [[4, 10, 'jamb_l'], [6, 10, 'jamb_r']] },
  { id: 'hc_command_in', skin: 'hc_command', windows: [3], doors: [], jambs: [[3, 6, 'jamb_l'], [5, 6, 'jamb_r']] },
  { id: 'hc_gym_in', skin: 'hc_gym', windows: [3, 6], doors: [], jambs: [[3, 6, 'jamb_l'], [5, 6, 'jamb_r']] },
  { id: 'hc_hall_in', skin: 'hc_hall', windows: [4, 7], doors: [], jambs: [[4, 10, 'jamb_l'], [6, 10, 'jamb_r']] },
  { id: 'hc_lantern_in', skin: 'hc_lantern', windows: [4], doors: [], jambs: [[3, 6, 'jamb_l'], [5, 6, 'jamb_r']] },
  { id: 'hc_mall_1', skin: 'hc_mall', windows: [4, 7], doors: [], jambs: [[4, 10, 'jamb_l'], [6, 10, 'jamb_r']] },
  { id: 'hc_mall_2', skin: 'hc_mall_up', windows: [4, 8], doors: [], jambs: [[4, 10, 'jamb_l'], [6, 10, 'jamb_r']] },
  { id: 'hc_marina_in', skin: 'hc_marina', windows: [3, 6], doors: [], jambs: [[3, 6, 'jamb_l'], [5, 6, 'jamb_r']] },
  { id: 'hc_school_in', skin: 'hc_school', windows: [3, 6], doors: [], jambs: [[3, 6, 'jamb_l'], [5, 6, 'jamb_r']] },
  { id: 'hm_flats_5', skin: 'flats_home', windows: [3, 9, 15], doors: [], jambs: [[0, 5, 'jamb_n'], [0, 7, 'jamb_s']] },
  { id: 'hm_flats_lobby', skin: 'flats_lobby', windows: [], doors: [3, 4, 7, 8], jambs: [[3, 11, 'jamb_l'], [5, 11, 'jamb_r']] },
  { id: 'hm_home_up', skin: 'house_loft', windows: [3, 5], doors: [], jambs: [] },
  { id: 'hm_hq_f1', skin: 'house_hq', windows: [4], doors: [], jambs: [[5, 15, 'jamb_l'], [7, 15, 'jamb_r']] },
  { id: 'hm_hq_f2', skin: 'house_hq_up', windows: [5], doors: [], jambs: [] },
  { id: 'hm_lantern_in', skin: 'house_lantern', windows: [4], doors: [], jambs: [[3, 6, 'jamb_l'], [5, 6, 'jamb_r']] },
  { id: 'hm_lodge_in', skin: 'house_lodge', windows: [4, 8], doors: [], jambs: [[4, 8, 'jamb_l'], [6, 8, 'jamb_r']] },
  { id: 'hm_rook_in', skin: 'house_rook', windows: [3], doors: [], jambs: [[2, 5, 'jamb_l'], [4, 5, 'jamb_r']] },
  { id: 'hm_school_in', skin: 'school', windows: [3, 7], doors: [], jambs: [[6, 13, 'jamb_l'], [8, 13, 'jamb_r']] },
  { id: 'mahopac_obs', skin: 'obs', windows: [3, 6], doors: [], jambs: [[3, 6, 'jamb_l'], [5, 6, 'jamb_r']] },
  { id: 'rx_f1', skin: 'lab', windows: [4, 7], doors: [], jambs: [] },
  { id: 'rx_f2', skin: 'lab', windows: [4, 7], doors: [], jambs: [] },
  { id: 'rx_f3', skin: 'lab', windows: [3, 7, 11], doors: [], jambs: [] },
  { id: 'rx_f4', skin: 'lab', windows: [4, 9], doors: [12], jambs: [] },
  { id: 'sm_den', skin: 'tunnel', windows: [], doors: [], jambs: [] },
  { id: 'sm_hold', skin: 'tunnel', windows: [], doors: [], jambs: [] },
  { id: 'sm_tunnel', skin: 'tunnel', windows: [], doors: [], jambs: [] },
  { id: 'sm_yard', skin: 'tunnel', windows: [3, 10], doors: [], jambs: [] },
  { id: 'hm_store', skin: 'house_store', windows: [3, 8], doors: [], jambs: [[5, 9, 'jamb_l'], [7, 9, 'jamb_r']] },
  { id: 'hm_wardrobe', skin: 'house_wardrobe', windows: [2, 9], doors: [], jambs: [[5, 9, 'jamb_l'], [7, 9, 'jamb_r']] },
  { id: 'hm_diner', skin: 'house_diner', windows: [2, 5, 8], doors: [], jambs: [[4, 7, 'jamb_l'], [6, 7, 'jamb_r']] },
];

test('every interior uses its own wall row, windows, doors and jambs', async ({ page }) => {
  test.setTimeout(120000);
  await boot(page);
  const report = await page.evaluate((rooms) => {
    const roles = ['c', 'C', 'L', 'f', 'F', 'T', 'B', 'S', 'R', 'G', 'W', 'D'];
    const pal = new Set(Object.keys(PAL));
    const detailKeys = Object.keys(MAPDATA).filter(k => k.startsWith('detail_')).sort();
    const tileDef = Object.assign({}, MAPDATA.maps_slice.tiles, MAPDATA.interiors.tiles,
      (MAPDATA.cobblecrest && MAPDATA.cobblecrest.tiles) || {},
      (MAPDATA.cobblecrest && MAPDATA.cobblecrest.roomTiles) || {},
      (MAPDATA.highcharity && MAPDATA.highcharity.tiles) || {},
      ...detailKeys.map(k => (MAPDATA[k] && MAPDATA[k].tiles) || {}));
    const problems = [];
    const rows = {};
    const sigs = {};
    const shares = [];
    for (const room of rooms) {
      const sk = SKINS[room.skin];
      if (!sk || !sk.wall) { problems.push(room.id + ' missing wall block'); continue; }
      const row = roles.map(k => sk.wall[k] || '').join('');
      if (row.length !== 12 || [...row].some(ch => !pal.has(ch))) problems.push(room.id + ' bad row ' + row);
      if (sk.wall.c === sk.wall.f) problems.push(room.id + ' cap equals face');
      rows[room.skin] = row;
      if (!PixelPets.goto(room.id)) { problems.push(room.id + ' goto failed'); continue; }
      const info = PixelPets.mapInfo;
      if (info.id !== room.id) problems.push(room.id + ' landed on ' + info.id);
      const wins = [], doors = [], walkBad = [], kitFloor = [];
      let grid = '';
      for (let y = 0; y < info.h; y++) {
        let line = '';
        for (let x = 0; x < info.w; x++) {
          const t = PixelPets.tileInfo(x, y);
          line += t.ch;
          const rule = sk.walk && sk.walk[t.ch] != null ? !!sk.walk[t.ch] : !!(tileDef[t.ch] || {}).walk;
          if (t.walk !== rule) walkBad.push(x + ',' + y + ' ' + t.ch);
          if (t.part) {
            if (!String(t.tile).startsWith(room.skin + '__')) kitFloor.push(x + ',' + y + ' tile ' + t.tile);
            if (y === 1 && t.part === 'face_win') wins.push(x);
            else if (t.part === 'face_win') problems.push(room.id + ' window off the face ' + x + ',' + y);
            if (y === 1 && t.part === 'face_door') doors.push(x);
          } else if (String(t.tile).indexOf('__') >= 0) kitFloor.push(x + ',' + y + ' ' + t.ch + ' ' + t.tile);
        }
        grid += line + '/';
      }
      if (walkBad.length) problems.push(room.id + ' walk ' + walkBad.slice(0, 4).join(' '));
      if (kitFloor.length) problems.push(room.id + ' kit on floor ' + kitFloor.slice(0, 3).join(' '));
      if (wins.join(',') !== room.windows.join(',')) problems.push(room.id + ' windows ' + wins + ' wanted ' + room.windows);
      if (doors.join(',') !== room.doors.join(',')) problems.push(room.id + ' doors ' + doors + ' wanted ' + room.doors);
      for (const [x, y, part] of room.jambs) {
        const t = PixelPets.tileInfo(x, y);
        if (t.part !== part) problems.push(room.id + ' jamb ' + x + ',' + y + ' ' + t.part + ' wanted ' + part);
      }
      const props = PixelPets.mapObjs.map(o => o.sprite || o.id).sort().join(',');
      const sig = row + '|' + grid + '|' + wins.join(',') + '|' + props;
      if (sigs[sig]) problems.push(room.id + ' matches ' + sigs[sig]);
      else sigs[sig] = room.id;
      const share = PixelPets.floorShare(room.id);
      if (share) shares.push({ id: room.id, tile: share.tile, share: share.share });
    }
    const byRow = {};
    Object.entries(rows).forEach(([skin, row]) => { (byRow[row] = byRow[row] || []).push(skin); });
    Object.entries(byRow).forEach(([row, skins]) => {
      if (skins.length > 1 && skins.slice().sort().join(',') !== 'house_hq,house_hq_up') problems.push('shared row ' + skins.join(','));
    });
    const opted = Object.keys(SKINS).filter(id => SKINS[id].wall).sort();
    const need = [...new Set(rooms.map(r => r.skin))].sort();
    if (opted.join(',') !== need.join(',')) problems.push('opted ' + opted.join(',') + ' need ' + need.join(','));
    const spot = (id, x, y) => { PixelPets.goto(id); const t = PixelPets.tileInfo(x, y); return { ch: t.ch, part: t.part, tile: t.tile, walk: t.walk, shade: t.shade }; };
    return {
      problems, shares,
      v: PixelPets.state.v,
      cap: PixelPets.devChecks().floorCap,
      n: rooms.length,
      spots: {
        vFace: spot('rx_f1', 2, 1),
        vWin: spot('rx_f1', 4, 1),
        nFace: spot('rx_f2', 2, 1),
        locked: spot('rx_f4', 12, 1),
        lift: spot('hm_flats_lobby', 3, 1),
        stair: spot('hm_flats_lobby', 7, 1),
        jambN: spot('hm_flats_5', 0, 5),
        jambS: spot('hm_flats_5', 0, 7),
        yieldY: spot('hc_lantern_in', 4, 0),
        keepY: spot('hc_bank_in', 4, 0),
        sideY: spot('hc_bank_in', 0, 3),
        shade: spot('cc_lantern_in', 4, 2),
      },
    };
  }, ROOMS);

  expect(report.v).toBe(2);
  expect(report.n).toBe(43);
  expect(report.problems).toEqual([]);
  expect(report.cap).toEqual([]);
  for (const row of report.shares) expect(row.share, row.id + ' ' + row.tile).toBeLessThanOrEqual(0.7);
  expect(report.spots.vFace).toMatchObject({ ch: 'V', part: 'face', tile: 'lab__face', walk: false });
  expect(report.spots.vWin).toMatchObject({ ch: 'W', part: 'face_win', walk: false });
  expect(report.spots.nFace).toMatchObject({ ch: 'n', part: 'face', tile: 'lab__face', walk: false });
  expect(report.spots.locked).toMatchObject({ ch: 'L', part: 'face_door', tile: 'lab__face_door', walk: false });
  expect(report.spots.lift).toMatchObject({ ch: 'E', part: 'face_door', walk: true });
  expect(report.spots.stair).toMatchObject({ ch: 'S', part: 'face_door', walk: false });
  expect(report.spots.jambN.part).toBe('jamb_n');
  expect(report.spots.jambS.part).toBe('jamb_s');
  expect(report.spots.yieldY).toMatchObject({ ch: 'Y', part: 'cap_n' });
  expect(report.spots.keepY).toMatchObject({ ch: 'Y', part: null, tile: 'wall_mark' });
  expect(report.spots.sideY).toMatchObject({ ch: 'Y', part: null, tile: 'wall_mark' });
  expect(report.spots.shade.shade).toBe('shadow_n');
});
