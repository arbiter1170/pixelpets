/* FERNBROOK_HOMES (D1248-D1252, handoff/maps/FERNBROOK_HOMES.md). Fernbrook grows south from 32x20 to 32x32: a gate in the old
   south tree line (row 19, x17-18) opens onto a lane with three enterable homes (Press House, Picker's Cottage, Stitcher's Loft)
   and two lane neighbours. The only change above the old edge is row 18 x18 (tree -> grass). Each room has its own skin and wall
   row, meets D85 and the detail standard. Runs at 320, 375 and 390; reduced motion; save stays pixelpets.save.v2 with v 2. */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { starterSave, installSave, trackErrors, gotoGame, shot } = require('./helpers');

const GAME_JS = fs.readFileSync(path.join(__dirname, '..', 'game.js'), 'utf8');

trackErrors(test, expect);

const ROOMS = [
  { id: 'fbh_press_in', door: 'fbh_press', dx: 4, w: 12, h: 14, mat: [5, 13], arrive: [5, 12], skin: 'fbh_press', floor: 'floor_press', name: 'Press House' },
  { id: 'fbh_picker_in', door: 'fbh_picker', dx: 12, w: 14, h: 12, mat: [6, 11], arrive: [6, 10], skin: 'fbh_picker', floor: 'floor_picker', name: "Picker's Cottage" },
  { id: 'fbh_stitch_in', door: 'fbh_stitch', dx: 24, w: 11, h: 15, mat: [5, 14], arrive: [5, 13], skin: 'fbh_stitch', floor: 'floor_stitch', name: "Stitcher's Loft" },
];
const PEOPLE = [
  { id: 'fbh_presser', map: 'fbh_press_in', name: 'Cider Presser', line: 'First pressing of the day. Mind the floor, it gets sticky by noon.' },
  { id: 'fbh_picker_res', map: 'fbh_picker_in', name: 'Apple Picker', line: 'Up the ladder at dawn, home by supper. The baskets never stay empty for long.' },
  { id: 'fbh_young_picker', map: 'fbh_picker_in', name: 'Young Picker', line: 'I picked up forty apples today! They were on the ground, but it still counts.' },
  { id: 'fbh_stitcher', map: 'fbh_stitch_in', name: 'Quilt Stitcher', line: 'Every square in that rug was a shirt once. Sit if you like, just not on the pins.' },
  { id: 'fbh_hedger', map: 'fernbrook', name: 'Hedge Trimmer', line: 'One snip too many and the whole hedge sulks. I go slow.' },
  { id: 'fbh_gatherer', map: 'fernbrook', name: 'Windfall Gatherer', line: 'Windfalls go to the press. The bruised ones go to the Walklings. Nobody minds.' },
];
// Merged Fernbrook rows 0-17 before this build (maps_slice plus every earlier overlay). This build must not move any of them. Rows 10-17 carry FERNBROOK_PLAZA (#266).
const OLD_ROWS = [
  'TTTTTTpTTTTTTTTTTTTTTTTTTTTTTTTT', 'TTggggggggggTTgggggRRRRRRRRggggT', 'TggRRRRRRggggggggggRRRRRRRRgTTgT', 'TggRRRRRRggfgggggggRRRRRRRRggTgT',
  'TggHHHHHHggggggfgggRRRRRRRRggggT', 'TggggpgggggggggggggHHHHHHHHggggT', 'TggggpppppfgggggggggggpggggggggT', 'TggggpppppgggggggfggggpggggfgggT',
  'pppppppppppppppppppppppppppppppp', 'TggggggggggggggggggggggggggggggT', 'TgFFFFFFFgFFFFFFFgPPPPPPPPPPPPTT', 'TgFtttttttttttttFgPccccccPPPPPgT',
  'TgFtTtTtTtTtTtTtFgPcwwwwcPPPPPgT', 'TgFtttttttttttttFgPcwwwwcPPPPPgT', 'TgFtttttttttttttFgPcwwwwcPPPPPgT', 'TgFtTtTtTtTtTtTtFgPcwwwwcPPPPPgT',
  'TgFtttttttttttttFgPccccccPPPPPgT', 'TgFtttttttttttttFTPPPPPPPPPPPTgT',
];

function save(world, flags) {
  const s = starterSave();
  s.settings.follower = false;
  s.settings.controls = 'modern';
  s.settings.textSpeed = 'fast';
  s.flags['story.reached_fernbrook'] = true;
  if (flags) Object.assign(s.flags, flags);
  if (world) s.world = Object.assign({ facing: 'down', respawn: 'fernbrook' }, world);
  return s;
}

async function boot(page, s, opts = {}) {
  if (opts.reduce) await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), s || save(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true && PixelPets.state && PixelPets.state.party[0]);
  await page.evaluate(() => { PixelPets.showTab('walk'); if (PixelPets.clearWild) PixelPets.clearWild(); });
}

const where = page => page.evaluate(() => ({ map: PixelPets.mapInfo.id, x: PixelPets.state.world.x, y: PixelPets.state.world.y }));

async function settle(page) {
  await expect.poll(() => page.evaluate(() => !PixelPets.fading && !PixelPets.scene)).toBe(true);
}

test('Fernbrook grows south to 32x32 and nothing above the old edge moves', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    const patch = MAPDATA.detail_zzz_fernbrook_homes.slicePatch.maps.fernbrook;
    PixelPets.goto('fernbrook', 5, 6, 'down');
    const info = PixelPets.mapInfo, rows = [];
    for (let y = 0; y < info.h; y++) { let s = ''; for (let x = 0; x < info.w; x++) s += PixelPets.tileInfo(x, y).ch; rows.push(s); }
    const at = id => { const o = WORLD.fernbrook.objs.find(o => o.id === id); return o && [o.x, o.y]; };
    return {
      w: info.w, h: info.h, rows, size: PPSave.MAP_SIZE.fernbrook,
      keys: Object.keys(patch.gridRows).map(Number).sort((a, b) => a - b),
      ops: Object.keys(patch).sort(), set: patch.set,
      ids: (patch.addObjs || []).map(o => o.id).filter(id => !id.startsWith('fbh_')),
      slice18: MAPDATA.maps_slice.maps.fernbrook.grid[18],
      zones: WORLD.fernbrook.zones || null,
      old: { lantern: at('fb_lantern'), hall: at('fb_hall'), west: at('fb_west'), east: at('fb_east'), heights: at('fb_heights'), odile: at('odile'), wynne: at('fb_wynne'), snack: at('fb_snack') },
      safe: WORLD.fernbrook.safe, respawn: WORLD.fernbrook.respawn,
      roofs: Object.keys(WORLD.fernbrook.roofs).sort(),
      v: PixelPets.state.v,
    };
  });
  expect(r.w).toBe(32);
  expect(r.h).toBe(32);
  expect(r.size).toEqual([32, 32]);
  expect(r.ops).toEqual(['addObjs', 'addRoofs', 'gridRows', 'set']);
  expect(r.set).toEqual({ w: 32, h: 32 });        // zones are not set here (the plaza branch owns them)
  expect(r.keys).toEqual([18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]);
  expect(r.ids).toEqual([]);
  expect(r.rows.slice(0, 18)).toEqual(OLD_ROWS);
  for (let x = 0; x < 32; x++) if (x !== 18) expect(r.rows[18][x], 'row 18 x' + x).toBe(r.slice18[x]);
  expect(r.slice18[18]).toBe('T');
  expect(r.rows[18][18]).toBe('g');
  expect(r.rows[19]).toBe('TTgggggggggggggggppTTTTTTTTTTTTT');   // gate x17-18, back gardens x2-16 under the orchard fence
  expect(r.rows[25]).toBe('TgppppppppppppppppppppppppppppgT');
  expect(r.rows[31]).toBe('T'.repeat(32));
  expect(r.rows[23]).toBe('TgHHHHHHggHHHHHHgppgggHHHHHHgggT');
  expect(r.zones).toEqual([{ x: 3, y: 11, w: 13, h: 7 }]);   // FERNBROOK_PLAZA (#266) drops the stream-field zone; the orchard zone stays
  expect(r.old).toEqual({ lantern: [5, 5], hall: [22, 6], west: [0, 8], east: [31, 8], heights: [6, 0], odile: [27, 9], wynne: [25, 7], snack: [28, 16] });
  expect(r.safe).toEqual({ x: 5, y: 6 });
  expect(r.respawn).toMatchObject({ x: 5, y: 5 });
  expect(r.roofs).toEqual(['fbh_picker', 'fbh_press', 'fbh_stitch', 'hall', 'lantern']);
  expect(r.v).toBe(2);
});

test('the lane is reachable on foot from the town, and the holder can walk through the gate', async ({ page }) => {
  await boot(page);
  const reach = await page.evaluate(() => {
    PixelPets.goto('fernbrook', 5, 6, 'down');
    const info = PixelPets.mapInfo, block = new Set(info.objs.filter(o => o.block).map(o => o.x + ',' + o.y));
    const seen = new Set(['5,6']), q = [[5, 6]];
    while (q.length) {
      const [x, y] = q.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
        if (nx < 0 || ny < 0 || nx >= info.w || ny >= info.h || seen.has(k)) continue;
        const t = PixelPets.tileInfo(nx, ny);
        if (!t.walk || block.has(k)) continue;
        seen.add(k); q.push([nx, ny]);
      }
    }
    const need = [[18, 18], [17, 19], [18, 19], [4, 24], [12, 24], [24, 24], [2, 25], [29, 25], [5, 28], [20, 29]];   // PROP_DRESS (D2035): an urn stands on (20,28); (20,29), between the urns, samples the same grass west of the pond
    return { missing: need.filter(([x, y]) => !seen.has(x + ',' + y)).map(p => p.join(',')), south: [...seen].filter(k => +k.split(',')[1] >= 19).length };
  });
  expect(reach.missing).toEqual([]);
  expect(reach.south).toBeGreaterThan(150);

  await page.evaluate(() => PixelPets.goto('fernbrook', 18, 16, 'down'));
  await settle(page);
  await page.keyboard.down('ArrowDown');
  await expect.poll(() => where(page).then(p => p.y), { timeout: 15000 }).toBeGreaterThanOrEqual(24);
  await page.keyboard.up('ArrowDown');
  const p = await where(page);
  expect(p.map).toBe('fernbrook');
  expect(p.x).toBe(18);
});

test('each door enters its room at the arrival tile, and the mat walks back out to the door step', async ({ page }) => {
  await boot(page);
  for (const room of ROOMS) {
    await page.evaluate(({ x }) => PixelPets.goto('fernbrook', x, 24, 'up'), { x: room.dx });
    await settle(page);
    await page.keyboard.press('ArrowUp');
    await expect.poll(() => where(page), { timeout: 8000 }).toEqual({ map: room.id, x: room.arrive[0], y: room.arrive[1] });
    await settle(page);
    const place = await page.evaluate(() => (WORLD[PixelPets.mapInfo.id] || {}).name);
    expect(place).toBe(room.name);
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => where(page), { timeout: 8000 }).toEqual({ map: 'fernbrook', x: room.dx, y: 24 });
    await settle(page);
  }
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});

test('the three rooms meet D85, wear their own skin and wall row, and pass the detail standard', async ({ page }) => {
  await boot(page);
  const report = await page.evaluate((rooms) => {
    const roles = ['c', 'C', 'L', 'f', 'F', 'T', 'B', 'S', 'R', 'G', 'W', 'D'];
    const rowOf = sk => roles.map(k => (sk.wall || {})[k] || '').join('');
    const out = [], dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const room of rooms) {
      PixelPets.goto(room.id, room.arrive[0], room.arrive[1], 'up');
      const info = PixelPets.mapInfo, sk = SKINS[room.skin], mine = rowOf(sk);
      const others = Object.entries(SKINS).filter(([id, s]) => id !== room.skin && s.wall && rowOf(s) === mine).map(([id]) => id);
      const pairs = Object.entries(HOUSE_SKINS).filter(([id, s]) => id !== room.skin && s.remap['.'] === sk.remap['.']).map(([id]) => id);
      const painted = [], floors = {};
      let decals = 0, shadow = 0, badShadow = 0;
      for (let y = 0; y < info.h; y++) {
        const row = [];
        for (let x = 0; x < info.w; x++) {
          const t = PixelPets.tileInfo(x, y);
          row.push(t.solid ? 'wall' : (t.tile + '|' + (t.decal || '')));
          if (t.ch === '.') floors[t.tile] = (floors[t.tile] || 0) + 1;
          if (t.decal) decals++;
          if (t.ch === 'W') {
            const south = PixelPets.tileInfo(x, y + 1);
            if (south.ch === '#') continue;
            shadow++;
            if (x % 2 === 1 && south.ch !== 'u') badShadow++;
            if (x % 2 === 0 && south.ch !== 'v') badShadow++;
          }
        }
        painted.push(row);
      }
      const runs = [];
      for (let y = 0; y < info.h; y++) for (let x = 1, n = 1; x < info.w; x++) {
        if (painted[y][x] === 'wall' || painted[y][x] !== painted[y][x - 1]) { n = 1; continue; }
        if (++n > 6) runs.push('h ' + x + ',' + y);
      }
      for (let x = 0; x < info.w; x++) for (let y = 1, n = 1; y < info.h; y++) {
        if (painted[y][x] === 'wall' || painted[y][x] !== painted[y - 1][x]) { n = 1; continue; }
        if (++n > 6) runs.push('v ' + x + ',' + y);
      }
      const block = new Set(info.objs.filter(o => o.block).map(o => o.x + ',' + o.y));
      const seen = new Set([room.arrive.join(',')]), q = [room.arrive.slice()];
      while (q.length) {
        const [x, y] = q.shift();
        for (const [dx, dy] of dirs) {
          const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
          if (nx < 0 || ny < 0 || nx >= info.w || ny >= info.h || seen.has(k)) continue;
          if (PixelPets.tileInfo(nx, ny).solid || block.has(k)) continue;
          seen.add(k); q.push([nx, ny]);
        }
      }
      const adj = (x, y) => dirs.some(([dx, dy]) => seen.has((x + dx) + ',' + (y + dy)));
      const stuck = info.objs.filter(o => (o.kind === 'warp' && !seen.has(o.x + ',' + o.y)) || ((o.kind === 'npc' || o.kind === 'prop' || o.kind === 'sign') && !adj(o.x, o.y))).map(o => o.id);
      const props = PixelPets.mapObjs.filter(o => o.kind === 'prop' || o.kind === 'sign' || o.kind === 'pickup');
      const share = PixelPets.floorShare(room.id);
      const kinds = {};
      props.forEach(o => { kinds[o.sprite] = (kinds[o.sprite] || 0) + 1; });
      out.push({
        id: room.id, w: info.w, h: info.h, skin: WORLD[room.id].skin, outdoor: WORLD[room.id].outdoor, kind: WORLD[room.id].kind,
        mine, others, pairs, decals, shadow, badShadow, runs, stuck,
        share: share.share, shareTile: share.tile, props: props.length, need: Math.ceil(share.walk / 12),
        noArt: props.filter(o => o.sprite && !o.art).map(o => o.id), maxReuse: Math.max(...Object.values(kinds)),
        floor: Object.entries(floors).sort((a, b) => b[1] - a[1]).map(e => e[0]),
        capOk: sk.wall.c !== sk.wall.f && Object.values(sk.wall).indexOf('k') < 0,
      });
    }
    return { out, cap: PixelPets.devChecks().floorCap, mapDev: PixelPets.mapCheck(), v: PixelPets.state.v };
  }, ROOMS);
  expect(report.v).toBe(2);
  expect(report.cap).toEqual([]);
  expect(report.mapDev).toEqual([]);
  for (const row of report.out) {
    const room = ROOMS.find(r => r.id === row.id);
    expect([row.w, row.h], row.id).toEqual([room.w, room.h]);
    expect(row.w, row.id).toBeGreaterThanOrEqual(10);           // D85 interior minimum 10x12
    expect(row.h, row.id).toBeGreaterThanOrEqual(12);
    expect(row.kind).toBe('interior');
    expect(row.outdoor).toBe('fernbrook');
    expect(GAME_JS.includes(row.id + ": 'fernbrook'"), row.id + ' in REGION_MAP.interiors').toBe(true);
    expect(row.skin).toBe(room.skin);
    expect(row.others, row.id + ' wall row ' + row.mine).toEqual([]);
    expect(row.pairs, row.id + ' floor').toEqual([]);
    expect(row.capOk, row.id).toBe(true);
    expect(row.floor[0].startsWith(room.floor), row.id + ' ' + row.floor).toBe(true);
    expect(row.floor.length, row.id + ' floor variants').toBeGreaterThanOrEqual(2);
    expect(row.share, row.id + ' ' + row.shareTile).toBeLessThanOrEqual(0.7);   // D88
    expect(row.props, row.id).toBeGreaterThanOrEqual(row.need);                 // one prop per 12 floor tiles
    expect(row.props, row.id).toBeGreaterThanOrEqual(6);
    expect(row.decals, row.id).toBeGreaterThanOrEqual(4);
    expect(row.maxReuse, row.id).toBeLessThanOrEqual(4);
    expect(row.noArt, row.id).toEqual([]);
    expect(row.shadow, row.id).toBeGreaterThan(0);
    expect(row.badShadow, row.id).toBe(0);
    expect(row.runs, row.id).toEqual([]);
    expect(row.stuck, row.id).toEqual([]);
  }
});

test('the three homes look different outside, each with its porch props by the door', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    PixelPets.goto('fernbrook', 18, 25, 'down');
    const v = PixelPets.exteriors('fernbrook');
    return v.buildings.filter(b => b.name.startsWith('fbh_')).map(b => ({
      name: b.name, doors: b.doors.map(d => d.id), look: [b.roof, b.shape + b.feats.map(f => '+' + f).join(''), b.wall, b.door, b.win.join('+'), b.trim].join('|'),
      porch: b.porch.map(id => { const o = v.props.find(p => p.id === id); return o ? (o.art ? 'ok' : 'no art') : 'missing'; }),
    }));
  });
  expect(r.map(b => b.name)).toEqual(['fbh_press', 'fbh_picker', 'fbh_stitch']);
  expect(r.map(b => b.doors)).toEqual([['fbh_press'], ['fbh_picker'], ['fbh_stitch']]);
  expect(new Set(r.map(b => b.look)).size).toBe(3);
  for (const b of r) expect(b.porch, b.name).toEqual(['ok', 'ok']);
});

test('every resident is present and says their line, in reduced motion too', async ({ page }) => {
  await boot(page, null, { reduce: true });
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  for (const who of PEOPLE) {
    const spot = await page.evaluate(({ map, id }) => {
      PixelPets.goto(map);
      const o = WORLD[map].objs.find(o => o.id === id);
      if (!o || !PixelPets.mapObjs.some(x => x.id === id)) return null;
      const taken = new Set(PixelPets.mapObjs.filter(x => x.block || x.kind === 'npc').map(x => x.x + ',' + x.y));
      for (const [dx, dy, facing] of [[0, 1, 'up'], [-1, 0, 'right'], [1, 0, 'left'], [0, -1, 'down']]) {
        const x = o.x + dx, y = o.y + dy;
        if (PixelPets.tileInfo(x, y).walk && !taken.has(x + ',' + y)) return { x, y, facing, name: o.name, look: o.look };
      }
      return { none: true };
    }, who);
    expect(spot, who.id).toBeTruthy();
    expect(spot.none, who.id).toBeFalsy();
    expect(spot.name).toBe(who.name);
    expect(spot.look).toBe(who.id === 'fbh_young_picker' ? 'fbh_young_picker' : who.id);
    await page.evaluate(({ map, s }) => PixelPets.goto(map, s.x, s.y, s.facing), { map: who.map, s: spot });
    await settle(page);
    await page.keyboard.press('Space');
    await expect.poll(() => page.evaluate(() => (PixelPets.scene && PixelPets.scene.full && PixelPets.scene.text) || '')).toBe(who.line);
    const scene = await page.evaluate(() => ({ who: PixelPets.scene.who }));
    expect(String(scene.who || '')).toContain(who.name);
    await page.evaluate(() => PixelPets.endScene());
    await settle(page);
  }
  const looks = await page.evaluate(() => {
    const ids = ['fbh_presser', 'fbh_picker_res', 'fbh_young_picker', 'fbh_stitcher', 'fbh_hedger', 'fbh_gatherer'];
    return ids.map(id => { const l = MAPDATA.detail_zzz_fernbrook_homes.looks[id]; return l.outfit + ':' + l.outfitCol + ':' + l.accent; });
  });
  for (const l of looks) {
    expect(l.startsWith('coat:g'), 'no Keeper coat ' + l).toBe(false);          // AGENTS rule 11 palette lock
    expect(/:(V|N|Q)(:|$)/.test(l), 'no Glimmerwell wine ' + l).toBe(false);
  }
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});

test('an old save standing on Fernbrook loads where it was, and a save inside a new home loads there', async ({ page, context }) => {
  await boot(page, save({ map: 'fernbrook', x: 17, y: 18 }));
  expect(await where(page)).toEqual({ map: 'fernbrook', x: 17, y: 18 });
  await context.clearCookies();
  const page2 = await context.newPage();
  await installSave(context, save({ map: 'fbh_stitch_in', x: 5, y: 8 }), { quietDay: true });
  await gotoGame(page2, '?debug=1');
  await page2.waitForFunction(() => window.PixelPets && PixelPets.debug === true && PixelPets.state && PixelPets.state.world);
  expect(await where(page2)).toEqual({ map: 'fbh_stitch_in', x: 5, y: 8 });
  expect(await page2.evaluate(() => PixelPets.state.v)).toBe(2);
  await page2.close();
});

test('visiting the lane and a home writes no new save field and keeps v 2', async ({ page }) => {
  await boot(page, save({ map: 'fernbrook', x: 5, y: 6 }));
  const read = () => page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  const raw = await page.evaluate(() => localStorage.getItem('pixelpets.save.v2'));
  // First an existing Fernbrook room and back, so every field a room visit normally writes (floorSeen, care...) is already there.
  await page.evaluate(() => PixelPets.goto('fb_lantern_in', 5, 14, 'down'));
  await settle(page);
  await page.evaluate(() => PixelPets.goto('fernbrook', 5, 6, 'down'));
  await settle(page);
  await expect.poll(() => page.evaluate(r => localStorage.getItem('pixelpets.save.v2') !== r, raw)).toBe(true);
  const s0 = await read();
  await page.evaluate(() => PixelPets.goto('fernbrook', 12, 24, 'up'));
  await settle(page);
  await page.keyboard.press('ArrowUp');
  await expect.poll(() => where(page).then(p => p.map)).toBe('fbh_picker_in');
  await settle(page);
  await shot(page, 'fernbrook-homes-picker');
  const s1 = await read();
  expect(s1.v).toBe(2);
  expect(Object.keys(s1).sort()).toEqual(Object.keys(s0).sort());
  expect(Object.keys(s1.flags).filter(k => !(k in s0.flags) && !/^(daily|seen|map|visit|contact)/.test(k))).toEqual([]);
});
