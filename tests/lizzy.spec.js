/* Lizzy part B (packet P3 v2): Hearthmoor Schoolhouse, Amberhill Flats, and the intro on the south grass.
   D111 placement A. D118 six floors on the panel, only 5B is a map. D119 names. Save v stays 2. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, playScene, shot } = require('./helpers');

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

test('Hearthmoor keeps its size, moves five props, and adds two buildings', async ({ page }) => {
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
      ['hm_lantern_post', 18, 18, 'lm_lantern_post'],
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
      w: info.w, h: info.h, v: live.state.v,
      changed, rows: Object.keys(rows).sort(),
      rowMatch: [15, 16, 17].every(y => grid[y] === after[y]),
      otherSame: grid.every((row, y) => y === 15 || y === 16 || y === 17 || row.length === m.grid[y].length),
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
  expect(r.h).toBe(20);
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
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const rooms = [
      { id: 'hm_school_in', props: 13, npcs: ['Pip', 'Wren', 'Lizzy'] },
      { id: 'hm_flats_lobby', props: 5, signs: 1, npcs: ['Mr. Gristle'] },
      { id: 'hm_flats_5', props: 11, npcs: ['Lizzy', 'Ossabell', 'Morelou'] },
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
  expect(byId.hm_flats_5).toMatchObject({ w: 14, h: 12, skin: 'flats_home', props: 11 });
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

test('the lift stays shut until Lizzy has met you', async ({ page }) => {
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
  expect(text).toContain("You don't know anyone up there yet.");
  await page.keyboard.press('Space');
});

test('lizzy_intro plays once, covers Rook, and gives two snacks', async ({ page }) => {
  await boot(page, save({}, { map: 'hearthmoor', x: 8, y: 18, facing: 'left' }));
  const before = await page.evaluate(() => {
    const steps = MAPDATA.detail_lizzy.scenes.lizzy_intro;
    const blob = JSON.stringify(steps);
    const objs = PixelPets.mapInfo.objs.filter(o => o.id === 'hm_lizzy' || o.id === 'hm_buddy');
    return {
      present: objs.map(o => o.id).sort(),
      v: PixelPets.state.v,
      mira: blob.includes('¡Mira quién es!'),
      heart: blob.includes('corazón'),
      road: blob.includes("Pa' que no pases hambre"),
      place: /puerto rico/i.test(blob),
      buddyLook: PixelPets.spriteLook('hm_buddy'),
      lizzy: PixelPets.spriteLook('hm_lizzy'),
      picker: KEEPER_LOOKS.accessory.slice(),
      clip: !!KEEPER_ACCESSORIES.flower_clip,
    };
  });
  expect(before.present).toEqual(['hm_buddy', 'hm_lizzy']);
  expect(before.v).toBe(2);
  expect(before.mira).toBe(true);
  expect(before.heart).toBe(true);
  expect(before.road).toBe(true);
  expect(before.place).toBe(false);
  expect(before.buddyLook).toBe(null);
  expect(before.lizzy.accessory).toBe('flower_clip');
  expect(before.lizzy.hair).toBe('curls');
  expect(before.picker).toEqual(['none', 'glasses', 'bow', 'cap', 'scarf']);
  expect(before.clip).toBe(true);

  await page.keyboard.press('ArrowLeft');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.id === 'lizzy_intro' && PixelPets.scene.full);
  const first = await page.evaluate(() => PixelPets.scene.text);
  expect(first).toContain('¡Mira quién es!');
  if (phoneShots(page)) await shot(page, 'lizzy-scene');
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
    return { doors, warps };
  });
  expect(reach.doors.filter(d => !d.ok).map(d => d.id)).toEqual([]);
  expect(reach.warps.filter(w => !w.ok)).toEqual([]);
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

test('the intro branches on Rook, and Buddy is not a battle', async ({ page }) => {
  await boot(page, save({ 'story.rival1_done': true, 'story.rival1_result': 'won' }, { map: 'hearthmoor', x: 5, y: 18, facing: 'right' }));
  await page.keyboard.press('ArrowRight');
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
