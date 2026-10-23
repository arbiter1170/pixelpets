/* Lizzy part B (packet P3 v2): Hearthmoor Schoolhouse, Amberhill Flats, and the intro on the south grass.
   D111 placement A. D118 six floors on the panel, only 5B is a map. D119 names. Save v stays 2. */
const { test, expect } = require('@playwright/test');
const path = require('path');
const { starterSave, installSave, trackErrors, gotoGame, playScene, shot, artifactsDir } = require('./helpers');

trackErrors(test, expect);

const BEFORE = {
  15: 'TgFFFFFFgswwwsggggggTTTT',
  16: 'TggggggggsssssgggTggTTTT',
  17: 'TTgggfggggggfgggggTgTTTT',
};
const AFTER = {
  15: 'TgFFFFFFgswwwsRRRRggTTTT',
  16: 'TgRRRRRRgsssssHHHHggTTTT',
  17: 'TTHHHHHHggggfgHHHHTgTTTT',
};

function save(flags, world) {
  const s = starterSave();
  s.settings.follower = false;
  if (flags) Object.assign(s.flags, flags);
  if (world) s.world = Object.assign({ facing: 'down', respawn: 'hearthmoor' }, world);
  return s;
}

async function boot(page, s) {
  await installSave(page.context(), s || save(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
}

function phoneShots(page) {
  const w = page.viewportSize().width;
  return w === 320 || w === 390;
}

async function tap(page, key, x, y) {
  await page.keyboard.press(key);
  await page.waitForFunction(({ x, y }) => {
    const k = PixelPets.keeper;
    return k.x === x && k.y === y && !k.moving;
  }, { x, y });
}

test('Hearthmoor keeps the Lizzy rows at 24 wide, and the live map is 24 by 34', async ({ page }) => {
  await boot(page, save());
  const r = await page.evaluate(({ before, after }) => {
    const m = MAPDATA.maps_slice.maps.hearthmoor;
    const live = PixelPets;
    live.goto('hearthmoor', 3, 5, 'down');
    const info = live.mapInfo;
    const grid = [];
    for (let y = 0; y < info.h; y++) {
      let row = '';
      for (let x = 0; x < info.w; x++) row += live.tileInfo(x, y).ch;
      grid.push(row);
    }
    let changed = 0;
    for (const y of [15, 16, 17]) {
      const a = before[y], b = grid[y];
      for (let x = 0; x < a.length; x++) if (a[x] !== b[x]) changed++;
    }
    const rows = MAPDATA.detail_lizzy.slicePatch.maps.hearthmoor.gridRows;
    const moved = [
      ['hm_big_tree', 1, 16, 'lm_big_tree'],
      ['hm_flowers', 11, 17, 'flower_clump'],
      ['hm_lantern_post', 18, 19, 'lm_lantern_post'],
      ['hm_puddle_6_16', 9, 18, 'puddle'],
      ['hm_leaf_17_15', 18, 15, 'leaf_litter'],
    ].map(([id, x, y, sprite]) => {
      const o = info.objs.find(q => q.id === id);
      return { id, ok: !!(o && o.x === x && o.y === y), sprite: (MAPDATA.detail_lizzy.slicePatch.maps.hearthmoor.replaceObjs.find(q => q.id === id) || {}).sprite === sprite };
    });
    const roofs = live.exteriors('hearthmoor').roofs;
    const b4 = Object.keys(MAPDATA.detail_b4.slicePatch.maps.hearthmoor.set.roofs);
    const school = roofs.school, flats = roofs.flats;
    const door = id => info.objs.find(o => o.id === id);
    return {
      w: info.w, h: info.h, v: live.state.v, grid,
      changed, rows: Object.keys(rows).sort(),
      rowMatch: [15, 16, 17].every(y => grid[y] === after[y]),
      otherSame: grid.every((row, y) => y >= m.grid.length ? row.length === m.w : (y === 15 || y === 16 || y === 17 || row.length === m.grid[y].length)),
      moved,
      b4kept: b4.every(k => roofs[k]),
      school, flats,
      lantern: door('hm_lantern'),
      step: live.tileInfo(16, 14).ch,
      sliceStep: m.grid[14][16],
    };
  }, { before: BEFORE, after: AFTER });
  expect(r.v).toBe(2);
  expect(r.w).toBe(24);
  expect(r.h).toBe(34);
  expect(r.grid[18]).toBe('TgTggggggggggggggggTTTTT');
  expect(r.grid.slice(19, 23)).toEqual([
    'TggpppppppppppppppggTTTT',
    'TgfggggggggggggggfggTTTT',
    'TggggfggggggggggfgggTTTT',
    'TTggggggggggggggggTTTTTT',
  ]);
  expect(r.grid[23]).toBe('TTTTTTTTTppTTTTTTTTTTTTT');
  expect(r.changed).toBe(24);
  expect(r.rows).toEqual(['15', '16', '17']);
  expect(r.rowMatch).toBe(true);
  expect(r.otherSame).toBe(true);
  expect(r.moved.every(o => o.ok && o.sprite)).toBe(true);
  expect(r.b4kept).toBe(true);
  expect(r.school).toMatchObject({
    x0: 2, y0: 16, x1: 7, y1: 16, roof: 'roof_hip_t', wall: 'wall_batten_w', door: 'door_double_r',
    win: 'win_tall_pane', trim: 'c', shape: 'gable+vane',
  });
  expect(r.flats).toMatchObject({
    x0: 14, y0: 15, x1: 17, y1: 15, roof: 'roof_flat_tank', wall: 'wall_stucco_o_tall', door: 'door_glass_awning',
    win: 'win_stack', trim: 'n', shape: 'flat+tank',
  });
  expect(r.school.porch).toEqual(['hm_school_bowl', 'hm_school_hop']);
  expect(r.flats.porch).toEqual(['hm_flats_planter']);
  expect(r.lantern).toMatchObject({ x: 16, y: 13 });
  expect(r.step).toBe(r.sliceStep);
  if (phoneShots(page)) {
    await page.evaluate(() => PixelPets.goto('hearthmoor', 10, 16, 'down'));
    await page.waitForTimeout(200);
    await shot(page, 'lizzy-town');
  }
});

test('the three rooms have their own skins, stay under the floor cap, and connect', async ({ page }) => {
  await boot(page, save({ 'story.lizzy_met': true, 'story.side_pick_done': true }));
  const r = await page.evaluate(() => {
    PixelPets.clock.set('sun', 21, 0);
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const rooms = [
      { id: 'hm_school_in', props: 13, npcs: ['Pip', 'Wren', 'Lizzy'] },
      { id: 'hm_flats_lobby', props: 5, signs: 1, npcs: ['Mr. Gristle'] },
      { id: 'hm_flats_5', props: 19, npcs: ['Lizzy', 'Ossabell', 'Morelou'] },
    ];
    const out = [];
    const remaps = {};
    for (const name of Object.keys(HOUSE_SKINS)) remaps[name] = JSON.stringify(HOUSE_SKINS[name].remap);
    for (const room of rooms) {
      PixelPets.goto(room.id, null, null, 'down');
      const info = PixelPets.mapInfo;
      const share = PixelPets.floorShare(room.id);
      const props = info.objs.filter(o => o.kind === 'prop');
      const signs = info.objs.filter(o => o.kind === 'sign');
      const npcs = info.objs.filter(o => o.kind === 'npc').map(o => o.id);
      const names = {};
      for (const o of PixelPets.mapObjs) if (o.kind === 'npc') names[o.id] = true;
      const missingArt = props.filter(o => {
        const src = MAPDATA.detail_lizzy.maps[room.id].objs.find(q => q.id === o.id);
        return src && src.sprite && !PixelPets.mapObjs.find(q => q.id === o.id).art;
      });
      const seen = new Set(), q = [[PixelPets.state.world.x, PixelPets.state.world.y]];
      seen.add(q[0][0] + ',' + q[0][1]);
      const warps = new Set(info.objs.filter(o => o.kind === 'warp').map(o => o.x + ',' + o.y));
      while (q.length) {
        const [x, y] = q.shift();
        if (warps.has(x + ',' + y) && !(x === PixelPets.state.world.x && y === PixelPets.state.world.y)) continue;
        for (const [dx, dy] of dirs) {
          const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
          if (seen.has(k) || PixelPets.tileInfo(nx, ny).solid) continue;
          const block = info.objs.find(o => o.block && o.x === nx && o.y === ny);
          if (block) continue;
          seen.add(k); q.push([nx, ny]);
        }
      }
      const adj = (x, y) => dirs.some(([dx, dy]) => seen.has((x + dx) + ',' + (y + dy))) || seen.has(x + ',' + y);
      const far = info.objs.filter(o => (o.kind === 'npc' || o.kind === 'prop' || o.kind === 'sign' || o.kind === 'warp') && !adj(o.x, o.y)).map(o => o.id);
      const skin = MAPDATA.detail_lizzy.maps[room.id].skin;
      const sk = SKINS[skin];
      let bare = 0;
      for (let y = 0; y < info.h; y++) for (let x = 0; x < info.w; x++) {
        const ch = PixelPets.tileInfo(x, y).ch;
        const key = ch === 'W' && x % 2 ? 'W2' : ch;
        if (!sk.remap[key]) bare++;
        const walk = sk.walk && sk.walk[key] != null ? sk.walk[key] : (sk.walk && sk.walk[ch] != null ? sk.walk[ch] : null);
        if (walk == null && !['#', 'W', 'm', '.', '='].includes(ch) && !(sk.walk && (sk.walk[ch] != null || sk.walk[key] != null))) bare += 0;
      }
      out.push({
        id: room.id, w: info.w, h: info.h, skin, share: share && share.share, tile: share && share.tile,
        props: props.length, signs: signs.length, npcs, missingArt, far, bare,
        unique: Object.keys(remaps).filter(n => n !== skin && remaps[n] === remaps[skin]),
      });
    }
    const schoolDoor = () => {
      PixelPets.goto('hearthmoor', 4, 18, 'up');
      return { at: PixelPets.state.world, door: PixelPets.mapInfo.objs.find(o => o.id === 'hm_school') };
    };
    return { out, v: PixelPets.state.v, schoolDoor: schoolDoor() };
  });
  expect(r.v).toBe(2);
  const byId = Object.fromEntries(r.out.map(row => [row.id, row]));
  expect(byId.hm_school_in).toMatchObject({ w: 16, h: 14, skin: 'school', props: 13 });
  expect(byId.hm_flats_lobby).toMatchObject({ w: 10, h: 12, skin: 'flats_lobby', props: 5, signs: 1 });
  expect(byId.hm_flats_5).toMatchObject({ w: 18, h: 16, skin: 'flats_home', props: 19 });
  for (const row of r.out) {
    expect(row.share, row.id + ' ' + row.tile).toBeLessThanOrEqual(0.7);
    expect(row.missingArt, row.id).toEqual([]);
    expect(row.far, row.id).toEqual([]);
    expect(row.bare, row.id).toBe(0);
    expect(row.unique, row.id).toEqual([]);
  }
  expect(new Set(r.out.map(row => row.skin)).size).toBe(3);
  expect(r.schoolDoor.door).toMatchObject({ x: 4, y: 17 });

  await page.keyboard.press('ArrowUp');
  await page.waitForFunction(() => window.PixelPets.state.world.map === 'hm_school_in');
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
  if (phoneShots(page)) await shot(page, 'lizzy-school');

  await page.evaluate(() => PixelPets.goto('hm_flats_lobby', 4, 10, 'up'));
  await page.waitForTimeout(300);
  if (phoneShots(page)) await shot(page, 'lizzy-lobby');
  await page.evaluate(() => PixelPets.goto('hm_flats_lobby', 5, 2, 'up'));
  await page.keyboard.press('ArrowUp');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
  const panelText = await page.evaluate(() => PixelPets.scene.text);
  expect(panelText).toContain('LIFT: 1 2 3 4 5 6');
  expect(panelText).toContain('Only 5 lights up');
  await page.keyboard.press('Space');
  await page.waitForFunction(() => !PixelPets.scene);

  await page.evaluate(() => PixelPets.goto('hm_flats_lobby', 3, 2, 'up'));
  await page.keyboard.press('ArrowUp');
  await page.waitForFunction(() => PixelPets.state.world.map === 'hm_flats_5');
  await page.waitForTimeout(300);
  const back = await page.evaluate(() => ({ x: PixelPets.state.world.x, y: PixelPets.state.world.y, v: PixelPets.state.v }));
  expect(back).toMatchObject({ x: 1, y: 6, v: 2 });
  if (phoneShots(page)) await shot(page, 'lizzy-5b');
  await page.evaluate(() => PixelPets.goto('hm_flats_5', 1, 6, 'left'));
  await page.keyboard.press('ArrowLeft');
  await page.waitForFunction(() => PixelPets.state.world.map === 'hm_flats_lobby');
  expect(await page.evaluate(() => [PixelPets.state.world.x, PixelPets.state.world.y, PixelPets.state.v])).toEqual([3, 2, 2]);
});

test('the lift stays shut until Lizzy has met you @w1', async ({ page }) => {
  await boot(page, save());
  await page.evaluate(() => PixelPets.goto('hm_flats_lobby', 3, 2, 'up'));
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(400);
  const shut = await page.evaluate(() => PixelPets.state.world.map);
  expect(shut).toBe('hm_flats_lobby');
  await page.evaluate(() => PixelPets.goto('hm_flats_lobby', 5, 2, 'up'));
  await page.keyboard.press('ArrowUp');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
  const text = await page.evaluate(() => PixelPets.scene.text);
  expect(text).toContain('1 2 3 4 5 6');
  expect(text).toContain("You haven't been up in ages.");
  await page.keyboard.press('Space');
});

test('lizzy_intro plays once, covers Rook, and gives two snacks', async ({ page }) => {
  const s = save({ 'story.early_done': true }, { map: 'hearthmoor', x: 8, y: 18, facing: 'left' });
  s.settings.controls = 'modern';
  await boot(page, s);
  const before = await page.evaluate(() => {
    const steps = MAPDATA.detail_lizzy.scenes.lizzy_intro;
    const blob = JSON.stringify(steps);
    const objs = PixelPets.mapInfo.objs.filter(o => o.id === 'hm_lizzy' || o.id === 'hm_buddy');
    const at = id => PixelPets.objPos(id);
    return {
      present: objs.map(o => o.id).sort(),
      h: PixelPets.mapInfo.h,
      lizzyAt: { x: at('hm_lizzy').x, y: at('hm_lizzy').y, facing: at('hm_lizzy').facing },
      buddyAt: { x: at('hm_buddy').x, y: at('hm_buddy').y, facing: at('hm_buddy').facing },
      v: PixelPets.state.v,
      mira: blob.includes('¡Mira quién es!'),
      heart: blob.includes('corazón'),
      road: blob.includes("Pa' que no pases hambre"),
      english: blob.includes('Look who it is!'),
      place: /puerto rico/i.test(blob),
      buddyLook: PixelPets.spriteLook('hm_buddy'),
      lizzy: PixelPets.spriteLook('hm_lizzy'),
      picker: KEEPER_LOOKS.accessory.slice(),
      clip: !!KEEPER_ACCESSORIES.flower_clip,
    };
  });
  expect(before.present).toEqual(['hm_buddy', 'hm_lizzy']);
  expect(before.h).toBe(34);
  expect(before.lizzyAt).toEqual({ x: 9, y: 20, facing: 'up' });
  expect(before.buddyAt).toEqual({ x: 10, y: 20, facing: 'up' });
  expect(before.v).toBe(2);
  expect(before.mira).toBe(false);
  expect(before.heart).toBe(false);
  expect(before.road).toBe(false);
  expect(before.english).toBe(true);
  expect(before.place).toBe(false);
  expect(before.buddyLook).toBe(null);
  expect(before.lizzy.accessory).toBe('flower_clip');
  expect(before.lizzy.hair).toBe('curls');
  expect(before.picker).toEqual(['none', 'glasses', 'bow', 'cap', 'scarf', 'sash', 'satchel', 'goggles', 'beanie', 'lanyard']);
  expect(before.clip).toBe(true);

  await tap(page, 'ArrowDown', 8, 19);
  await tap(page, 'ArrowRight', 9, 19);
  await page.keyboard.press('ArrowDown');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.id === 'lizzy_intro' && PixelPets.scene.full);
  const first = await page.evaluate(() => PixelPets.scene.text);
  expect(first).toContain('Look who it is!');
  const clear = await page.evaluate(() => {
    const c = document.querySelector('#mapCanvas');
    const cr = c.getBoundingClientRect();
    const k = cr.width / c.width;
    const cam = PixelPets.walk.cam;
    const o = PixelPets.mapInfo.objs.find(q => q.id === 'hm_lizzy');
    const tileX = o.x * 16 - cam.x, tileY = o.y * 16 - cam.y;
    const margin = 8, head = 6;
    const left = cr.left + (tileX - margin) * k;
    const top = cr.top + (tileY - margin - head) * k;
    const width = (16 + margin * 2) * k;
    const height = (16 + margin * 2 + head) * k;
    const box = document.querySelector('#sbox').getBoundingClientRect();
    const hit = left < box.right && left + width > box.left && top < box.bottom && top + height > box.top;
    return { hit, v: PixelPets.state.v, y: PixelPets.keeper.y };
  });
  expect(clear.v).toBe(2);
  expect(clear.y).toBe(19);
  expect(clear.hit).toBe(false);
  if (page.viewportSize().width === 390) await shot(page, 'lizzy-school-lane');
  await playScene(page, ['Hi, Lizzy!', "He's so annoying."]);
  const after = await page.evaluate(() => ({
    met: PixelPets.state.flags['story.lizzy_met'],
    hug: PixelPets.state.flags['story.lizzy_hug'] || false,
    snacks: PixelPets.state.bag.heal_snack || 0,
    gone: PixelPets.mapInfo.objs.filter(o => o.id === 'hm_lizzy' || o.id === 'hm_buddy').map(o => o.id),
    buddyCard: PixelPets.contacts().some(c => c.name === 'Buddy'),
    lizzyCard: PixelPets.contacts().some(c => c.name === 'Lizzy'),
    v: PixelPets.state.v,
    map: PixelPets.state.world.map,
  }));
  expect(after.met).toBe(true);
  expect(after.hug).toBe(false);
  expect(after.snacks).toBe(2);
  expect(after.gone).toEqual([]);
  expect(after.buddyCard).toBe(false);
  expect(after.lizzyCard).toBe(true);
  expect(after.v).toBe(2);
  expect(after.map).toBe('hearthmoor');

  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => PixelPets.scene)).toBe(null);

  const reach = await page.evaluate(() => {
    PixelPets.setFlag('story.rival1_done', true);
    PixelPets.setFlag('story.side_pick_done', true);
    PixelPets.goto('hearthmoor', 3, 5, 'down');
    const info = PixelPets.mapInfo, W = info.w, H = info.h;
    const seen = new Set(['3,5']), q = [[3, 5]];
    while (q.length) {
      const [x, y] = q.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen.has(k)) continue;
        if (PixelPets.tileInfo(nx, ny).blocked) continue;
        seen.add(k); q.push([nx, ny]);
      }
    }
    const stepOf = o => {
      const ch = PixelPets.tileInfo(o.x, o.y).ch;
      return ch === 'H' ? o.x + ',' + (o.y + 1) : o.x + ',' + o.y;
    };
    const doors = info.objs.filter(o => o.kind === 'door').map(o => ({ id: o.id, step: stepOf(o), ok: seen.has(stepOf(o)) }));
    const warps = ['hm_east', 'hm_north', 'hm_to_hc'].map(id => {
      const o = info.objs.find(q => q.id === id);
      if (!o) return { id, ok: false };
      const spot = o.x + ',' + o.y;
      const open = !PixelPets.tileInfo(o.x, o.y).blocked;
      const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has((o.x + dx) + ',' + (o.y + dy)));
      return { id, ok: open ? seen.has(spot) : near };
    });
    const open = (x, y) => !PixelPets.tileInfo(x, y).solid;
    const seenSouth = new Set(), qSouth = [];
    for (let x = 0; x < W; x++) if (open(x, 18)) { seenSouth.add(x + ',18'); qSouth.push([x, 18]); }
    while (qSouth.length) {
      const [x, y] = qSouth.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || seenSouth.has(k) || !open(nx, ny)) continue;
        seenSouth.add(k); qSouth.push([nx, ny]);
      }
    }
    return { doors, warps, lane: seenSouth.has('9,20') };
  });
  expect(reach.doors.filter(d => !d.ok).map(d => d.id)).toEqual([]);
  expect(reach.warps.filter(w => !w.ok)).toEqual([]);
  expect(reach.lane).toBe(true);
});

test('every Lizzy line on main is English and within 110 characters @w1', async ({ page }) => {
  await boot(page, save());
  const lines = await page.evaluate(() => {
    const out = [];
    const walk = (n) => {
      if (!Array.isArray(n)) return;
      if (n[0] === 'say' && n[1] === 'Lizzy' && typeof n[2] === 'string') out.push(n[2]);
      n.forEach(walk);
    };
    const takeObj = (o) => {
      if (!o || o.name !== 'Lizzy' || !o.lines) return;
      for (const v of Object.values(o.lines)) if (typeof v === 'string' && v[0] !== '@') out.push(v);
    };
    for (const src of Object.values(MAPDATA)) {
      if (!src || typeof src !== 'object') continue;
      if (src.scenes) for (const steps of Object.values(src.scenes)) walk(steps);
      const maps = Object.assign({}, src.maps || {}, (src.slicePatch && src.slicePatch.maps) || {});
      for (const m of Object.values(maps)) {
        for (const o of [].concat(m.objs || [], m.addObjs || [], m.replaceObjs || [])) takeObj(o);
      }
    }
    return { lines: out, v: PixelPets.state.v };
  });
  expect(lines.v).toBe(2);
  expect(lines.lines.length).toBeGreaterThan(0);
  const words = ['corazón', 'corazon', 'mira', 'bendito', 'provecho', 'wepa', 'gracias', "pa'", 'ay', 'fuera', 'buenas', 'noches'];
  const hasWord = (line, word) => {
    const s = line.toLowerCase(), w = word.toLowerCase();
    let i = 0;
    while ((i = s.indexOf(w, i)) >= 0) {
      const before = i === 0 || !/[a-záéíóúñ]/i.test(s[i - 1]);
      const after = i + w.length >= s.length || !/[a-záéíóúñ]/i.test(s[i + w.length]);
      if (before && after) return true;
      i += w.length;
    }
    return false;
  };
  const marks = /[¡¿ñáéíóúÑÁÉÍÓÚ]/;
  for (const line of lines.lines) {
    for (const word of words) expect(hasWord(line, word), line + ' / ' + word).toBe(false);
    expect(line, line).not.toMatch(marks);
    expect(Array.from(line).length, line).toBeLessThanOrEqual(110);
  }
});

async function saidLines(page, choices) {
  const said = [];
  const left = choices.slice();
  for (let i = 0; i < 200; i++) {
    const sc = await page.evaluate(() => {
      const s = window.PixelPets.scene;
      return s && { mode: s.mode, full: s.full, waiting: s.waiting, text: s.text };
    });
    if (!sc) return said;
    if (sc.mode === 'choice') {
      if (!sc.full) { await page.waitForTimeout(40); continue; }
      await page.waitForFunction(() => window.PixelPets.optionsReady === true);
      const label = left.shift();
      await page.locator('#sbChoices button', { hasText: label }).first().click();
      await page.waitForTimeout(40);
      continue;
    }
    if (sc.mode === 'say') {
      if (!sc.waiting) { await page.waitForTimeout(40); continue; }
      if (said[said.length - 1] !== sc.text) said.push(sc.text);
      await page.keyboard.press('Space');
      await page.waitForTimeout(40);
      continue;
    }
    await page.waitForTimeout(60);
  }
  throw new Error('scene did not end');
}

test('the intro branches on Rook, and Buddy is not a battle @w1', async ({ page }) => {
  await boot(page, save({ 'story.rival1_done': true, 'story.rival1_result': 'won' }, { map: 'hearthmoor', x: 5, y: 18, facing: 'right' }));
  await tap(page, 'ArrowRight', 6, 18);
  await tap(page, 'ArrowRight', 7, 18);
  await tap(page, 'ArrowRight', 8, 18);
  await tap(page, 'ArrowDown', 8, 19);
  await tap(page, 'ArrowRight', 9, 19);
  await page.keyboard.press('ArrowDown');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
  const lines = await saidLines(page, ['Hug Buddy', 'Is Rook okay?']);
  const flags = await page.evaluate(() => ({
    hug: PixelPets.state.flags['story.lizzy_hug'],
    rook: PixelPets.state.flags['story.lizzy_rook'],
    met: PixelPets.state.flags['story.lizzy_met'],
    v: PixelPets.state.v,
    battle: !!(PixelPets.battle && PixelPets.battle.on),
  }));
  expect(lines.join(' ')).toContain('you beat him');
  expect(flags).toMatchObject({ hug: true, rook: true, met: true, v: 2, battle: false });

  const kids = await page.evaluate(() => ({
    pip: PixelPets.spriteLook('pip'),
    wren: PixelPets.spriteLook('wren'),
    morolow: PixelPets.spriteLook('morolow'),
    landlord: PixelPets.spriteLook('landlord'),
  }));
  expect(kids.pip.hair).toBe('buzz');
  expect(kids.wren.hair).toBe('pony');
  expect(kids.morolow.hair).toBe('short');
  expect(kids.landlord.outfit).toBe('coat');
});

test('flat 5B keeps Buddy home after you meet Lizzy, and a pat lands once a day', async ({ page }) => {
  await boot(page, save());
  const hidden = await page.evaluate(() => {
    PixelPets.goto('hm_flats_5', 15, 4, 'right');
    const ids = PixelPets.mapInfo.objs.map(o => o.id);
    return {
      buddy: ids.includes('f5_buddy'),
      lizzy: ids.includes('f5_lizzy'),
      school: (() => { PixelPets.goto('hm_school_in'); return PixelPets.mapInfo.objs.some(o => o.id === 'school_buddy'); })(),
    };
  });
  expect(hidden).toEqual({ buddy: false, lizzy: false, school: false });

  await boot(page, save({ 'story.lizzy_met': true }));
  const shown = await page.evaluate(() => {
    PixelPets.clock.set('sun', 21, 0);
    PixelPets.goto('hm_flats_5', 15, 4, 'right');
    const ids = PixelPets.mapInfo.objs.map(o => o.id);
    const props = PixelPets.mapInfo.objs.filter(o => o.kind === 'prop').map(o => o.id);
    const dataProps = MAPDATA.detail_lizzy.maps.hm_flats_5.objs.filter(o => o.kind === 'prop').length;
    return {
      buddy: ids.includes('f5_buddy'),
      lizzy: ids.includes('f5_lizzy'),
      morolow: ids.includes('f5_morolow'),
      drip: ids.includes('f5_drip'),
      pipe: ids.includes('f5_pipe_new'),
      leak: ids.includes('f5_leak'),
      props: props.length,
      dataProps,
      home: JSON.stringify(MAPDATA.detail_lizzy.scenes.buddy_home),
      bond: PixelPets.state.party[0].bond || 0,
    };
  });
  expect(shown.buddy).toBe(true);
  expect(shown.lizzy).toBe(true);
  expect(shown.morolow).toBe(true);
  expect(shown.drip).toBe(true);
  expect(shown.pipe).toBe(false);
  expect(shown.leak).toBe(true);
  expect(shown.props).toBe(19);
  expect(shown.dataProps).toBe(20);
  expect(shown.home).toContain('pet');
  expect(shown.home).toContain('Buddy thumps his tail');

  const sample = () => page.evaluate(() => {
    const c = document.querySelector('#mapCanvas');
    const g = c.getContext('2d');
    const cam = PixelPets.walk.cam;
    const x = Math.round(10 * 16 - cam.x), y = Math.round(2 * 16 - cam.y);
    return Array.from(g.getImageData(Math.max(0, x), Math.max(0, y), 16, 16).data);
  });
  await page.waitForTimeout(200);
  const a = await sample();
  await page.waitForTimeout(500);
  const b = await sample();
  expect(a.join(',')).not.toBe(b.join(','));

  await page.keyboard.press('Space');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
  await page.keyboard.press('Space');
  await page.waitForFunction(() => !PixelPets.scene);
  const once = await page.evaluate(() => ({
    bond: PixelPets.state.party[0].bond || 0,
    pat: !!PixelPets.state.flags['story.buddy_pat_today'],
  }));
  expect(once.pat).toBe(true);
  expect(once.bond).toBe(shown.bond + 1);

  await page.keyboard.press('Space');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
  await page.keyboard.press('Space');
  await page.waitForFunction(() => !PixelPets.scene);
  const twice = await page.evaluate(() => PixelPets.state.party[0].bond || 0);
  expect(twice).toBe(once.bond);

  const fixed = await page.evaluate(() => {
    PixelPets.state.flags['story.leak_fixed'] = true;
    PixelPets.goto('hm_flats_5', 15, 4, 'right');
    const ids = PixelPets.mapInfo.objs.map(o => o.id);
    const props = PixelPets.mapInfo.objs.filter(o => o.kind === 'prop');
    return { drip: ids.includes('f5_drip'), pipe: ids.includes('f5_pipe_new'), leak: ids.includes('f5_leak'), props: props.length };
  });
  expect(fixed).toEqual({ drip: false, pipe: true, leak: false, props: 19 });
});

async function endTalk(page) {
  for (let i = 0; i < 24; i++) {
    const open = await page.evaluate(() => !!PixelPets.scene);
    if (!open) return;
    await page.keyboard.press('Space');
    await page.waitForTimeout(40);
  }
  throw new Error('talk did not end');
}

test('flat 5B shows Caleb and Marilou, and the save keys stay Morolow and Morelou', async ({ page }) => {
  const s = save({ 'story.lizzy_met': true, 'story.phone_got': true });
  await boot(page, s);
  await page.evaluate(() => {
    PixelPets.goto('hm_flats_5', 2, 6, 'down');
    PixelPets.setFlag('story.lizzy_met', true);
  });
  const beforeKeys = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('pixelpets.save.v2'))).sort());

  expect(await page.evaluate(() => PixelPets.talkTo('f5_morolow'))).toBe(true);
  await page.waitForFunction(() => document.querySelector('#sbWho').textContent === 'Caleb');
  expect(await page.evaluate(() => PixelPets.scene.who)).toBe('Morolow');
  if (page.viewportSize().width === 390) {
    const dir = artifactsDir('caleb-fix');
    const clip = await page.evaluate(() => {
      const a = document.querySelector('#sbWho').getBoundingClientRect();
      const b = document.querySelector('#sbox').getBoundingClientRect();
      const x = Math.max(0, Math.min(a.left, b.left) - 4);
      const y = Math.max(0, Math.min(a.top, b.top) - 4);
      const right = Math.min(window.innerWidth, Math.max(a.right, b.right) + 4);
      const bottom = Math.min(window.innerHeight, Math.max(a.bottom, b.bottom) + 4);
      return { x, y, width: right - x, height: bottom - y };
    });
    await page.screenshot({ path: path.join(dir, 'caleb-textbox-390.png'), clip });
  }
  await endTalk(page);

  expect(await page.evaluate(() => PixelPets.talkTo('f5_morelou'))).toBe(true);
  await page.waitForFunction(() => document.querySelector('#sbWho').textContent === 'Marilou');
  expect(await page.evaluate(() => PixelPets.scene.who)).toBe('Morelou');
  await endTalk(page);

  const rep = await page.evaluate(() => {
    const n = PixelPets.repAdd('Morolow', 5);
    const raw = JSON.parse(localStorage.getItem('pixelpets.save.v2'));
    return {
      n,
      morolow: PixelPets.repGet('Morolow'),
      caleb: PixelPets.repGet('Caleb'),
      base: MAPDATA.reputation.base,
      keys: Object.keys(PixelPets.state.rep || {}),
      v: raw.v,
      top: Object.keys(raw).sort(),
      saved: raw.rep,
    };
  });
  expect(rep.n).toBe(55);
  expect(rep.morolow).toBe(55);
  expect(rep.caleb).toBe(rep.base);
  expect(rep.keys).toContain('Morolow');
  expect(rep.keys).not.toContain('Caleb');
  expect(rep.saved.Morolow).toBe(55);
  expect(rep.saved.Caleb).toBeUndefined();
  expect(rep.v).toBe(2);
  const added = rep.top.filter(k => beforeKeys.indexOf(k) < 0);
  expect(added.filter(k => ['phoneBook', 'rep', 'repJoins', 'phoneOpened', 'debugSave'].indexOf(k) < 0)).toEqual([]);

  await page.locator('#repBtn').click();
  await expect(page.locator('#ovRep')).toBeVisible();
  const people = await page.evaluate(() => [...document.querySelectorAll('#repList .rep-name')].map(n => n.textContent));
  expect(people).toContain('Caleb');
  expect(people).toContain('Marilou');
  expect(people).not.toContain('Morolow');
  expect(people).not.toContain('Morelou');
  if (page.viewportSize().width === 390) {
    const dir = artifactsDir('caleb-fix');
    const clip = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('#repList .rep-row')].filter(r => {
        const n = r.querySelector('.rep-name').textContent;
        return n === 'Marilou' || n === 'Caleb';
      });
      rows.forEach(r => r.scrollIntoView({ block: 'center' }));
      const boxes = rows.map(r => r.getBoundingClientRect());
      const top = Math.max(0, Math.min(...boxes.map(b => b.top)));
      const bottom = Math.min(window.innerHeight, Math.max(...boxes.map(b => b.bottom)));
      const left = Math.max(0, Math.min(...boxes.map(b => b.left)));
      const right = Math.min(window.innerWidth, Math.max(...boxes.map(b => b.right)));
      return { x: left, y: top, width: Math.max(1, right - left), height: Math.max(1, bottom - top) };
    });
    await page.screenshot({ path: path.join(dir, 'people-marilou-caleb-390.png'), clip });
  }
  await page.locator('#repBack').click();

  await page.locator('#phoneBtn').click();
  await page.locator('.phone-app[data-app="contacts"]').click();
  const contacts = await page.evaluate(() => [...document.querySelectorAll('.contact-name')].map(n => n.textContent));
  expect(contacts).toContain('Caleb');
  expect(contacts).toContain('Marilou');
  expect(contacts).not.toContain('Morolow');
  expect(contacts).not.toContain('Morelou');
  expect(contacts.indexOf('Caleb')).toBeLessThan(contacts.indexOf('Marilou'));

  const lines = await page.evaluate(() => {
    const line = (map, id) => {
      const o = MAPDATA.detail_lizzy.maps[map].objs.find(q => q.id === id);
      return o && o.lines && o.lines.else;
    };
    return [
      line('hm_school_in', 'school_teacher_desk'),
      line('hm_flats_lobby', 'flats_mailboxes'),
      line('hm_flats_5', 'f5_table'),
      line('hm_flats_5', 'f5_photo'),
      line('hm_flats_5', 'f5_dominoes'),
    ];
  });
  expect(lines).toEqual([
    "Lizzy's desk. A mug that says MAESTRA and a photo of three sisters laughing.",
    'Mailboxes. 5B has four names on tape: Lizzy, Ossabell, Marilou, Caleb, and a paw doodle.',
    'A kitchen table with five chairs: four for the family, one always for a guest.',
    'A photo: three sisters, an abuela, and a much smaller Buddy in a party hat.',
    'A domino table mid-game. Nobody touch it. Marilou and Caleb mean it.',
  ]);
});
