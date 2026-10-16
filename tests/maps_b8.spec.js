/* B8 Fernbrook rooms: Lantern House and Bloom Trial Hall.
   Doors keep their panel ids and also warp. Amos and Fen still run those panels.
   New skins only. Palette keys A–K and P stay as they are. Save v stays 2. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, shot } = require('./helpers');

trackErrors(test, expect);

const ROOMS = [
  { id: 'fb_lantern_in', w: 12, h: 16, ax: 5, ay: 14, safe: [5, 14], floor: '.', wall: 'wall_orchard', face: 'wall_orchard_face', skin: 'fb_lantern' },
  { id: 'fb_hall_in', w: 16, h: 24, ax: 7, ay: 22, safe: [7, 22], floor: ':', wall: 'wall_bloom', face: 'wall_bloom_face', skin: 'fb_hall' },
];

const PAL_KEEP = {
  A: '#c9925e', B: '#a8674a', C: '#e3d3ac', D: '#9fae86', E: '#5f6e4f', F: '#5c4033', G: '#b5845a',
  H: '#b9877a', I: '#9c9382', J: '#2f5a3e', P: '#9686a8', K: '#7a8aa0',
};

const LINES = [
  ['fb_lantern_in', 3, 4, 'up', 'A wooden counter. A bowl of water sits on it.'],
  ['fb_lantern_in', 10, 4, 'up', 'A small lamp. The shade is warm.'],
  ['fb_lantern_in', 8, 4, 'right', 'Herbs hang here to dry.'],
  ['fb_lantern_in', 9, 8, 'up', 'A crate of orchard apples.'],
  ['fb_lantern_in', 7, 10, 'right', 'A low table. The top is clear.'],
  ['fb_lantern_in', 9, 11, 'left', 'A jug of pressed apples. The lid is on.'],
  ['fb_lantern_in', 2, 12, 'left', 'A basket lined with leaves.'],
  ['fb_hall_in', 4, 4, 'up', 'A lamp by the flower dais.'],
  ['fb_hall_in', 2, 7, 'up', 'A stand of pale ribbons.'],
  ['fb_hall_in', 3, 8, 'left', 'A hedge in a low planter.'],
  ['fb_hall_in', 3, 18, 'left', 'A tall urn. It holds cut stems.'],
  ['fb_hall_in', 13, 18, 'right', 'A round pot of cut blooms.'],
  ['fb_hall_in', 4, 21, 'up', 'A bowl of loose petals.'],
  ['fb_hall_in', 9, 22, 'up', 'A basket of pink blooms.'],
  ['fb_hall_in', 2, 22, 'up', 'A bench along the path.'],
  ['fb_hall_in', 1, 22, 'up', 'A jar of dried petals.'],
  ['fb_hall_in', 14, 22, 'up', 'A stool pulled off the path.'],
  ['fb_hall_in', 4, 21, 'down', 'A flat cushion off the mat.'],
];

function save(world) {
  const s = starterSave();
  s.settings.follower = false;
  if (world) s.world = Object.assign({ facing: 'down', respawn: 'fernbrook' }, world);
  return s;
}

async function boot(page, s) {
  await installSave(page.context(), s || save(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
}

async function say(page) {
  await page.keyboard.press('Space');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
  const text = await page.evaluate(() => PixelPets.scene.text);
  await page.keyboard.press('Space');
  await page.waitForFunction(() => !PixelPets.scene);
  return text;
}

test('each room has its own skin, the floor cap, and a clear path', async ({ page }) => {
  await boot(page);
  const report = await page.evaluate((rooms) => {
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
    const out = [];
    for (const room of rooms) {
      PixelPets.goto(room.id, room.ax, room.ay, 'up');
      const info = PixelPets.mapInfo;
      const share = PixelPets.floorShare(room.id);
      const floors = {}, walls = {}, faces = {};
      let shadow = 0, badShadow = 0, decals = 0;
      const painted = [];
      for (let y = 0; y < info.h; y++) {
        const row = [];
        for (let x = 0; x < info.w; x++) {
          const t = PixelPets.tileInfo(x, y);
          row.push(t.tile + '|' + (t.decal || ''));
          if (t.ch === room.floor) floors[t.tile] = (floors[t.tile] || 0) + 1;
          if (t.ch === '#') walls[t.tile] = (walls[t.tile] || 0) + 1;
          if (t.ch === 'W' && x % 2 === 0) faces[t.tile] = (faces[t.tile] || 0) + 1;
          if (t.decal) decals++;
          if (t.ch === 'W') {
            const south = PixelPets.tileInfo(x, y + 1);
            if (south.ch === '#' || south.ch === 'X') continue;
            shadow++;
            if (x % 2 === 1 && south.ch !== 'u') badShadow++;
            if (x % 2 === 0 && south.ch !== 'v') badShadow++;
          }
        }
        painted.push(row);
      }
      const runs = [];
      for (let y = 0; y < info.h; y++) {
        let run = 1;
        for (let x = 1; x < info.w; x++) {
          if (painted[y][x] === painted[y][x - 1]) { run++; if (run > 6) runs.push(room.id + ' h ' + x + ',' + y); }
          else run = 1;
        }
      }
      for (let x = 0; x < info.w; x++) {
        let run = 1;
        for (let y = 1; y < info.h; y++) {
          if (painted[y][x] === painted[y - 1][x]) { run++; if (run > 6) runs.push(room.id + ' v ' + x + ',' + y); }
          else run = 1;
        }
      }
      const mode = bag => Object.entries(bag).sort((a, b) => b[1] - a[1])[0][0];
      const props = PixelPets.mapObjs.filter(o => o.kind === 'prop' || o.kind === 'sign' || o.kind === 'pickup');
      const skin = HOUSE_SKINS[room.skin];
      out.push({
        id: room.id, w: info.w, h: info.h,
        share: share && { walk: share.walk, tile: share.tile, share: share.share },
        floor: mode(floors), wall: mode(walls), face: mode(faces),
        shadow, badShadow, decals, runs,
        props: props.length, need: Math.ceil(share.walk / 12),
        art: props.filter(o => o.sprite && !o.art).map(o => o.id),
        missing: skinNames(skin).filter(n => !tiles[n]),
        pair: [skin.remap['.'] || skin.remap[':'], skin.remap['#'], skin.remap.W].join('|'),
      });
    }
    const pairs = {};
    Object.entries(HOUSE_SKINS).forEach(([k, skin]) => {
      pairs[k] = [skin.remap['.'] || skin.remap[':'], skin.remap['#'], skin.remap.W].join('|');
    });
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const stuck = [];
    for (const room of rooms) {
      PixelPets.goto(room.id, room.ax, room.ay, 'up');
      const info = PixelPets.mapInfo;
      const objs = info.objs;
      const block = new Set(objs.filter(o => o.block).map(o => o.x + ',' + o.y));
      const warps = new Set(objs.filter(o => o.kind === 'warp').map(o => o.x + ',' + o.y));
      const seen = new Set([room.ax + ',' + room.ay]);
      const q = [[room.ax, room.ay]];
      while (q.length) {
        const [x, y] = q.shift();
        if (warps.has(x + ',' + y) && !(x === room.ax && y === room.ay)) continue;
        for (const [dx, dy] of dirs) {
          const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
          if (nx < 0 || ny < 0 || nx >= info.w || ny >= info.h || seen.has(k)) continue;
          if (PixelPets.tileInfo(nx, ny).solid || block.has(k)) continue;
          seen.add(k); q.push([nx, ny]);
        }
      }
      const adj = (x, y) => dirs.some(([dx, dy]) => seen.has((x + dx) + ',' + (y + dy)));
      for (const o of objs) {
        if (o.kind === 'warp' && !seen.has(o.x + ',' + o.y)) stuck.push(room.id + ' warp ' + o.id);
        if ((o.kind === 'npc' || o.kind === 'sign' || o.kind === 'prop') && !adj(o.x, o.y)) stuck.push(room.id + ' ' + o.id);
      }
    }
    const doors = PixelPets.goto('fernbrook', 5, 6, 'down') && {
      lantern: PixelPets.mapInfo.objs.find(o => o.id === 'fb_lantern'),
      hall: PixelPets.mapInfo.objs.find(o => o.id === 'fb_hall'),
    };
    const sizes = {};
    ['hm_home_in', 'hm_lantern_in', 'hm_rook_in', 'hm_lodge_in', 'hm_hq_f1', 'hm_hq_f2', 'rx_f1', 'rx_f2', 'rx_f3', 'rx_f4'].forEach(id => {
      PixelPets.goto(id, 1, 1, 'down');
      sizes[id] = PixelPets.mapInfo.w + 'x' + PixelPets.mapInfo.h;
    });
    const pal = {};
    Object.keys(PAL).forEach(k => { if ('ABCDEFGHIJKP'.includes(k)) pal[k] = PAL[k]; });
    return {
      out, stuck, pairs, doors, sizes, pal,
      noFifth: PixelPets.goto('rx_f5', 1, 1, 'up') === false,
      floorCap: PixelPets.devChecks().floorCap,
      v: PixelPets.state.v,
    };
  }, ROOMS);
  expect(report.v).toBe(2);
  expect(report.floorCap).toEqual([]);
  expect(report.stuck).toEqual([]);
  expect(report.noFifth).toBe(true);
  expect(report.sizes).toEqual({
    hm_home_in: '9x8', hm_lantern_in: '9x7', hm_rook_in: '7x6', hm_lodge_in: '11x9',
    hm_hq_f1: '14x16', hm_hq_f2: '12x14', rx_f1: '14x22', rx_f2: '14x22', rx_f3: '14x22', rx_f4: '14x22',
  });
  expect(report.pal).toEqual(PAL_KEEP);
  expect(report.doors.lantern).toMatchObject({ id: 'fb_lantern', x: 5, y: 5 });
  expect(report.doors.hall).toMatchObject({ id: 'fb_hall', x: 22, y: 6 });
  for (const row of report.out) {
    const room = ROOMS.find(r => r.id === row.id);
    expect(row.w, row.id).toBe(room.w);
    expect(row.h, row.id).toBe(room.h);
    expect(row.share.share, row.id + ' ' + row.share.tile).toBeLessThanOrEqual(0.7);
    expect(row.props, row.id).toBeGreaterThanOrEqual(row.need);
    expect(row.badShadow, row.id).toBe(0);
    expect(row.shadow, row.id).toBeGreaterThan(0);
    expect(row.decals, row.id).toBeGreaterThanOrEqual(4);
    expect(row.art, row.id).toEqual([]);
    expect(row.missing, row.id).toEqual([]);
    expect(row.runs, row.id).toEqual([]);
    expect(row.wall.startsWith(room.wall), row.id + ' ' + row.wall).toBe(true);
    expect(row.face, row.id).toBe(room.face);
    expect(row.floor.startsWith(room.id === 'fb_hall_in' ? 'floor_moss' : 'floor_orchard'), row.id + ' ' + row.floor).toBe(true);
  }
  expect(report.out[0].pair).not.toBe(report.out[1].pair);
  for (const [id, pair] of Object.entries(report.pairs)) {
    if (id === 'fb_lantern' || id === 'fb_hall') continue;
    expect(pair, id).not.toBe(report.pairs.fb_lantern);
    expect(pair, id).not.toBe(report.pairs.fb_hall);
  }
});

test('doors warp in and back, and the hall stays latched until the orchard is clear', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.goto('fernbrook', 22, 6, 'up'));
  await page.keyboard.press('ArrowUp');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
  expect(await page.evaluate(() => PixelPets.scene.text)).toContain('latched');
  await page.keyboard.press('Space');
  await page.waitForFunction(() => !PixelPets.scene);
  expect(await page.evaluate(() => PixelPets.mapInfo.id)).toBe('fernbrook');

  await page.evaluate(() => PixelPets.setFlag('story.orchard_cleared', true));
  await page.keyboard.press('ArrowUp');
  await page.waitForFunction(() => PixelPets.mapInfo.id === 'fb_hall_in' && !PixelPets.fading);
  const hallIn = await page.evaluate(() => ({ x: PixelPets.state.world.x, y: PixelPets.state.world.y, face: PixelPets.state.world.facing }));
  expect(hallIn).toEqual({ x: 7, y: 22, face: 'up' });
  await page.evaluate(() => PixelPets.goto('fb_hall_in', 7, 22, 'down'));
  await page.keyboard.press('ArrowDown');
  await page.waitForFunction(() => PixelPets.mapInfo.id === 'fernbrook' && !PixelPets.fading);
  expect(await page.evaluate(() => ({ x: PixelPets.state.world.x, y: PixelPets.state.world.y, face: PixelPets.state.world.facing }))).toEqual({ x: 22, y: 6, face: 'down' });

  await page.evaluate(() => PixelPets.goto('fernbrook', 5, 5, 'up'));
  await page.keyboard.press('ArrowUp');
  await page.waitForFunction(() => PixelPets.mapInfo.id === 'fb_lantern_in' && !PixelPets.fading);
  expect(await page.evaluate(() => ({ x: PixelPets.state.world.x, y: PixelPets.state.world.y, face: PixelPets.state.world.facing }))).toEqual({ x: 5, y: 14, face: 'up' });
  await page.evaluate(() => PixelPets.goto('fb_lantern_in', 5, 14, 'down'));
  await page.keyboard.press('ArrowDown');
  await page.waitForFunction(() => PixelPets.mapInfo.id === 'fernbrook' && !PixelPets.fading);
  expect(await page.evaluate(() => ({ x: PixelPets.state.world.x, y: PixelPets.state.world.y }))).toEqual({ x: 5, y: 5 });
});

test('Amos rests the party and Fen starts the trial', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.goto('fb_lantern_in', 6, 4, 'up'));
  await page.keyboard.press('Space');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full && PixelPets.scene.waiting);
  await page.keyboard.press('Space');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.mode === 'choice');
  await page.waitForFunction(() => window.PixelPets.optionsReady === true);
  const amos = await page.locator('#sbChoices button').allTextContents();
  expect(amos).toContain('Rest a while');
  await page.locator('#sbChoices button', { hasText: 'Leave' }).click();
  await page.waitForFunction(() => !PixelPets.scene);

  await page.evaluate(() => { PixelPets.setFlag('story.side_pick_done', true); PixelPets.setSide('glimmer'); PixelPets.goto('fb_lantern_in', 6, 4, 'up'); });
  await page.keyboard.press('Space');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full && PixelPets.scene.waiting);
  await page.keyboard.press('Space');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.mode === 'choice');
  await page.waitForFunction(() => window.PixelPets.optionsReady === true);
  const desk = await page.locator('#sbChoices button').allTextContents();
  expect(desk).toContain('Rest a while');
  expect(desk).toContain('Pledge desk');
  await page.locator('#sbChoices button', { hasText: 'Leave' }).click();
  await page.waitForFunction(() => !PixelPets.scene);

  await page.evaluate(() => PixelPets.goto('fb_lantern_in', 1, 7, 'up'));
  await page.keyboard.press('Space');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
  expect(await page.evaluate(() => PixelPets.scene.text)).toContain('beds');
  await page.keyboard.press('Space');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.mode === 'choice');
  await page.waitForFunction(() => window.PixelPets.optionsReady === true);
  await page.locator('#sbChoices button', { hasText: 'Not now' }).click();
  await page.waitForFunction(() => !PixelPets.scene);

  await page.evaluate(() => PixelPets.goto('fb_lantern_in', 9, 12, 'right'));
  expect(await say(page)).toContain('5 Acorns');

  await page.evaluate(() => { PixelPets.setFlag('story.heights_done', true); PixelPets.setSide('keepers'); PixelPets.goto('fb_hall_in', 7, 5, 'up'); });
  await page.keyboard.press('Space');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full && PixelPets.scene.waiting);
  await page.keyboard.press('Space');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.mode === 'choice');
  await page.waitForFunction(() => window.PixelPets.optionsReady === true);
  const fen = await page.locator('#sbChoices button').allTextContents();
  expect(fen).toContain('Begin trial');
  await page.locator('#sbChoices button', { hasText: 'Leave' }).click();
  await page.waitForFunction(() => !PixelPets.scene);

  await page.evaluate(() => { PixelPets.setFlag('trainer.hall1_fen', true); PixelPets.goto('fb_hall_in', 7, 5, 'up'); });
  const again = await say(page);
  expect(again).toContain('orchard remembers');

  await page.evaluate(() => { PixelPets.setSide('glimmer'); PixelPets.goto('fb_hall_in', 7, 5, 'up'); });
  const glimmer = await say(page);
  expect(glimmer).toContain('Census');
  expect(glimmer).not.toContain('Begin trial');
});

test('new props say their lines, and the camera clamps', async ({ page }) => {
  await boot(page);
  for (const [map, x, y, facing, line] of LINES) {
    await page.evaluate((at) => PixelPets.goto(at[0], at[1], at[2], at[3]), [map, x, y, facing]);
    expect(await say(page), map + ' ' + x + ',' + y).toBe(line);
  }
  const cam = [];
  for (const [id, x, y] of [['fb_lantern_in', 1, 3], ['fb_lantern_in', 10, 14], ['fb_hall_in', 2, 4], ['fb_hall_in', 14, 22]]) {
    await page.evaluate((at) => PixelPets.goto(at[0], at[1], at[2], 'down'), [id, x, y]);
    await page.waitForTimeout(150);
    cam.push(await page.evaluate(() => {
      const cv = document.querySelector('#mapCanvas');
      return {
        id: PixelPets.mapInfo.id, x: PixelPets.walk.cam.x, y: PixelPets.walk.cam.y, w: cv.width, h: cv.height,
        mw: PixelPets.mapInfo.w * 16, mh: PixelPets.mapInfo.h * 16,
        kx: PixelPets.state.world.x, ky: PixelPets.state.world.y,
      };
    }));
  }
  for (const c of cam) {
    if (c.w >= c.mw) expect(c.x, c.id).toBe(-Math.floor((c.w - c.mw) / 2));
    else {
      expect(c.x, c.id).toBeGreaterThanOrEqual(0);
      expect(c.x, c.id).toBeLessThanOrEqual(c.mw - c.w);
    }
    if (c.h >= c.mh) expect(c.y, c.id).toBe(-Math.floor((c.h - c.mh) / 2));
    else {
      expect(c.y, c.id).toBeGreaterThanOrEqual(0);
      expect(c.y, c.id).toBeLessThanOrEqual(c.mh - c.h);
    }
    expect(c.kx * 16 - c.x, c.id).toBeGreaterThanOrEqual(0);
    expect(c.kx * 16 - c.x + 16, c.id).toBeLessThanOrEqual(c.w);
    expect(c.ky * 16 - c.y, c.id).toBeGreaterThanOrEqual(0);
    expect(c.ky * 16 - c.y + 16, c.id).toBeLessThanOrEqual(c.h);
  }
  const width = page.viewportSize().width;
  if (width === 320 || width === 390) {
    await page.evaluate(() => PixelPets.goto('fb_lantern_in', 5, 8, 'up'));
    await page.waitForTimeout(200);
    await shot(page, 'b8-lantern');
    await page.evaluate(() => PixelPets.goto('fb_hall_in', 7, 6, 'up'));
    await page.waitForTimeout(200);
    await shot(page, 'b8-hall-dais');
    await page.evaluate(() => PixelPets.goto('fb_hall_in', 7, 20, 'down'));
    await page.waitForTimeout(200);
    await shot(page, 'b8-hall-door');
  }
});

test('a save on a wall snaps to safe, and a clear tile stays put', async ({ page }) => {
  await boot(page, save({ map: 'fb_lantern_in', x: 0, y: 0 }));
  expect(await page.evaluate(() => ({ map: PixelPets.mapInfo.id, x: PixelPets.state.world.x, y: PixelPets.state.world.y, v: PixelPets.state.v }))).toEqual({ map: 'fb_lantern_in', x: 5, y: 14, v: 2 });
});

test('a save already inside the hall keeps its tile', async ({ page }) => {
  await boot(page, save({ map: 'fb_hall_in', x: 7, y: 22, facing: 'up' }));
  expect(await page.evaluate(() => ({ map: PixelPets.mapInfo.id, x: PixelPets.state.world.x, y: PixelPets.state.world.y, v: PixelPets.state.v }))).toEqual({ map: 'fb_hall_in', x: 7, y: 22, v: 2 });
});
