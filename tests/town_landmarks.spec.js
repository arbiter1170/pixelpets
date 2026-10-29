/* TOWN_LANDMARKS T1-T16. Widths are the Playwright projects (320, 375, 390).
   Save stays pixelpets.save.v2 with v 2. The only new flag is lantern.guide_heard. */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, artifactsDir, boxesOverlap } = require('./helpers');

trackErrors(test, expect);

const G1 = 'Welcome in. Talk to a bed and your whole team rests and heals, for 5 Acorns.';
const G2 = 'Lose a battle and you wake at the closest Lantern House. Tap me any time to hear this again.';
const HOUSE = 'LANTERN HOUSE · Rest and recover. 5 Acorns, or what you have.';
const HC_NOTE = 'Rest the whole party. 5 Acorns. The city can wait. — High Charity';
// The High Charity wall sign is not the patched marker. Its line was not in this copy pass.
const HC_WALL = 'LANTERN HOUSE · Rest the whole party. 5 Acorns.';
const ARTS = {
  heal_lantern: ['................', '................', '..dddddddddd....', '..md......m.....', '..md.....ooo....', '..md....ddddd...', '..md....dyyyd...', '..md....dywyd...', '..md....dyyyd...', '..md....ddddd...', '..md...ddddddd..', '..md...dwrwrwd..', '..md...drrrrrd..', '..md...dwrrrwd..', '.ddddd.dwwrwwd..', '.ddddd.ddddddd..'],
  acorn_board: ['................', '................', '....dddddddddd..', '.....m......dm..', '.....m......dm..', '..nnnnnnnnn.dm..', '..nbbbbbbbn.dm..', '..nbbbdbbbn.dm..', '..nbboooobn.dm..', '..nbddddddn.dm..', '..nbyoooybn.dm..', '..nbyoooybn.dm..', '..nbbyyybbn.dm..', '..nnnnnnnnn.dm..', '..........ddddd.', '..........ddddd.'],
};
const PAL = { d: '#333c57', m: '#566c86', o: '#ef7d57', y: '#ffcd75', w: '#f4f4f4', r: '#b13e53', n: '#29366f', b: '#3b5dc9' };
const HOUSES = [
  { town: 'hearthmoor', room: 'hm_lantern_in', door: [16, 13], marker: ['hm_lantern_sign', 15, 13], guide: ['hm_lantern_host', 'Host Della', 4, 2], stand: [16, 14], bed: 'lantern_bed_a' },
  { town: 'cobblecrest', room: 'cc_lantern_in', door: [5, 5], marker: ['cc_lantern_sign', 4, 5], guide: ['cc_lantern_host', 'Host Garnet', 4, 2], stand: [5, 6], bed: 'cc_bed_a' },
  { town: 'fernbrook', room: 'fb_lantern_in', door: [5, 5], marker: ['fb_lantern_sign', 4, 5], guide: ['amos', 'Keeper Amos', 6, 3], stand: [5, 6], bed: 'fb_bed_a' },
  { town: 'highcharity', room: 'hc_lantern_in', door: [22, 34], marker: ['hc_lantern_sign', 21, 34], guide: ['hc_lantern_host', 'Host Ines', 4, 2], stand: [22, 35], bed: 'hc_bed_a' },
];
const STORES = [
  { town: 'hearthmoor', id: 'hm_store', x: 4, y: 26, stand: [4, 27], board: ['hm_store_board', 5, 26], see: [5, 27], from: [3, 6] },
  { town: 'cobblecrest', id: 'dottie', x: 12, y: 6, stand: [12, 7], board: ['cc_store_board', 14, 6], see: [14, 7], from: [5, 6] },
  { town: 'highcharity', id: 'hc_shop', x: 30, y: 22, stand: [30, 23], board: ['hc_store_board', 32, 23], see: [32, 24], from: [32, 37] },
];

function saveAt(extra) {
  const s = starterSave();
  Object.assign(s.flags, extra || {});
  s.settings.follower = false;
  s.settings.textSpeed = 'fast';
  return s;
}

async function boot(page, extra, controls) {
  const s = saveAt(extra);
  if (controls) s.settings.controls = controls;
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
}

function clipInView(box, vp) {
  const x = Math.max(0, Math.floor(box.x));
  const y = Math.max(0, Math.floor(box.y));
  const right = Math.min(vp.width, Math.ceil(box.x + box.width));
  const bottom = Math.min(vp.height, Math.ceil(box.y + box.height));
  if (right - x < 8 || bottom - y < 8) return null;
  return { x, y, width: right - x, height: bottom - y };
}

async function shotClip(page, name, box) {
  if (page.viewportSize().width !== 390) return;
  const mode = await page.evaluate(() => PixelPets.state.settings.controls || 'arcade');
  if (mode !== 'modern' || !box) return;
  const clip = clipInView(box, page.viewportSize());
  if (!clip) return;
  await page.screenshot({ path: path.join(artifactsDir('town-landmarks'), name), clip });
}

async function shotBox(page, name, sel) {
  const box = await page.locator(sel).boundingBox();
  await shotClip(page, name, box);
}

async function shotChoice(page, name) {
  const box = await page.evaluate(() => {
    const rects = ['#sbChoices', '#sbox'].map((s) => document.querySelector(s)).filter(Boolean).map((el) => el.getBoundingClientRect());
    if (!rects.length) return null;
    const left = Math.min(...rects.map((r) => r.left));
    const top = Math.min(...rects.map((r) => r.top));
    const right = Math.max(...rects.map((r) => r.right));
    const bottom = Math.max(...rects.map((r) => r.bottom));
    return { x: left, y: top, width: right - left, height: bottom - top };
  });
  await shotClip(page, name, box);
}

async function shotTiles(page, name, dx, dy, w, h) {
  if (page.viewportSize().width !== 390) return;
  await page.waitForFunction(() => PixelPets.cuePass());
  const box = await page.evaluate(({ dx, dy, w, h }) => {
    const pass = PixelPets.cuePass();
    const origin = pass && pass.dir === 'down'
      ? { x: pass.x - 5, y: pass.y + 12 }
      : pass && pass.dir === 'up' ? { x: pass.x - 5, y: pass.y - 17 } : null;
    if (!origin) return null;
    const c = document.querySelector('#mapCanvas');
    const r = c.getBoundingClientRect();
    const k = c.width / r.width;
    return { x: r.left + (origin.x + dx) / k, y: r.top + (origin.y + dy) / k, width: w / k, height: h / k };
  }, { dx, dy, w, h });
  await shotClip(page, name, box);
}

async function advanceSay(page) {
  await page.waitForFunction(() => {
    const s = PixelPets.scene;
    return s && s.mode === 'say' && s.full && s.waiting;
  });
  await page.keyboard.press('Space');
}

function artRows(name) {
  const src = fs.readFileSync('sprites.js', 'utf8');
  const at = src.indexOf(name + ': [');
  expect(at, name).toBeGreaterThan(0);
  const body = src.slice(at, src.indexOf('],', at));
  return [...body.matchAll(/"([\.a-z]{16})"/g)].map((m) => m[1]);
}

function overlap(a, b) {
  return boxesOverlap(
    { x: a.x, y: a.y, width: a.w, height: a.h },
    { x: b.x, y: b.y, width: b.w, height: b.h },
  );
}

test('T1 every Lantern House has one heal_lantern on the door row', async ({ page }) => {
  await boot(page, null, page.viewportSize().width === 390 ? 'modern' : null);
  const rows = await page.evaluate((houses) => houses.map((h) => {
    PixelPets.goto(h.town, h.stand[0], h.stand[1], 'up');
    const marks = PixelPets.mapObjs.filter((o) => o.sprite === 'heal_lantern');
    return { town: h.town, marks, door: h.door, marker: h.marker };
  }), HOUSES);
  for (const row of rows) {
    expect(row.marks, row.town).toHaveLength(1);
    expect(row.marks[0].id).toBe(row.marker[0]);
    expect(row.marks[0].x).toBe(row.marker[1]);
    expect(row.marks[0].y).toBe(row.marker[2]);
    expect(row.marks[0].y).toBe(row.door[1]);
    expect(Math.abs(row.marks[0].x - row.door[0])).toBe(1);
  }
  await page.evaluate(() => {
    PixelPets.goto('hearthmoor', 16, 14, 'up');
    PixelPets.cueForce({ x: 16, y: 13 });
  });
  await shotTiles(page, 'hearthmoor-lantern-door.png', -18, -8, 52, 36);
});

test('T2 the marker art is 16x16 PAL keys and glows at night', async ({ page }) => {
  for (const [name, rows] of Object.entries(ARTS)) {
    const got = artRows(name);
    expect(got, name).toEqual(rows);
    const keys = new Set(got.join('').replace(/\./g, ''));
    for (const k of keys) expect(PAL[k], name + ' ' + k).toBeTruthy();
  }
  await boot(page);
  await page.evaluate(() => {
    PixelPets.goto('hearthmoor', 16, 14, 'up');
    PixelPets.clock.set('mon', 12, 0);
    PixelPets.clock.freeze(true);
  });
  await page.waitForTimeout(80);
  // Samples sit on the camera, not on the cue arrow: the arrow bobs, so arrow-relative pixels moved 2 px between widths.
  // near: 2 px above the marker, inside the lamp disc (centre x+8, y+6, r 12). far: the same row 20 px right, outside it.
  const read = () => page.evaluate(() => {
    const c = document.querySelector('#mapCanvas');
    const g = c.getContext('2d');
    const cam = PixelPets.walk.cam;
    const px = (wx, wy) => {
      const x = Math.round(wx - cam.x), y = Math.round(wy - cam.y);
      if (x < 0 || y < 0 || x >= c.width || y >= c.height) return null;
      const d = g.getImageData(x, y, 1, 1).data;
      return [d[0], d[1], d[2]];
    };
    return { near: px(15 * 16 + 8, 13 * 16 - 2), far: px(15 * 16 + 28, 13 * 16 - 2) };
  });
  const day = await read();
  await page.evaluate(() => PixelPets.clock.set('mon', 21, 0));
  await page.waitForTimeout(80);
  const night = await read();
  expect(day.near, 'day sample ' + JSON.stringify(day)).toBeTruthy();
  expect(night.near, 'night sample ' + JSON.stringify(night)).toBeTruthy();
  expect(day.far, 'day sample ' + JSON.stringify(day)).toBeTruthy();
  expect(night.far, 'night sample ' + JSON.stringify(night)).toBeTruthy();
  const warm = (rgb) => rgb[0] - rgb[2];
  expect(warm(night.near) - warm(night.far)).toBeGreaterThan(warm(day.near) - warm(day.far) + 12);
});

test('T3 tapping the marker opens the house sign text', async ({ page }) => {
  await boot(page);
  for (const h of HOUSES) {
    await page.evaluate(({ town, stand, id }) => {
      PixelPets.goto(town, stand[0], stand[1], 'up');
      PixelPets.talkTo(id);
    }, { town: h.town, stand: h.stand, id: h.marker[0] });
    await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.text);
    expect(await page.evaluate(() => PixelPets.scene.text), h.town).toBe(HOUSE);
    await page.evaluate(() => PixelPets.endScene());
  }
});

test('T4 every General Store has one acorn_board and no Lantern House does', async ({ page }) => {
  await boot(page, null, page.viewportSize().width === 390 ? 'modern' : null);
  const got = await page.evaluate(({ stores, houses }) => {
    const boards = stores.map((s) => {
      PixelPets.goto(s.town, s.stand[0], s.stand[1], 'up');
      return { town: s.town, list: PixelPets.mapObjs.filter((o) => o.sprite === 'acorn_board') };
    });
    const housesBoards = houses.map((h) => {
      PixelPets.goto(h.town, h.stand[0], h.stand[1], 'up');
      return PixelPets.mapObjs.filter((o) => o.sprite === 'acorn_board' && o.y === h.door[1] && Math.abs(o.x - h.door[0]) <= 1).length;
    });
    PixelPets.goto('fernbrook', 5, 6, 'up');
    return { boards, housesBoards, fern: PixelPets.mapObjs.filter((o) => o.sprite === 'acorn_board').length };
  }, { stores: STORES, houses: HOUSES });
  got.boards.forEach((row, i) => {
    expect(row.list, row.town).toHaveLength(1);
    expect(row.list[0].id).toBe(STORES[i].board[0]);
    expect(row.list[0].x).toBe(STORES[i].board[1]);
    expect(row.list[0].y).toBe(STORES[i].board[2]);
  });
  expect(got.housesBoards).toEqual([0, 0, 0, 0]);
  expect(got.fern).toBe(0);
  await page.evaluate(() => {
    PixelPets.goto('hearthmoor', 4, 27, 'up');
    PixelPets.cueForce({ x: 4, y: 26 });
  });
  await shotTiles(page, 'lamplight-provisions-door.png', -4, -8, 40, 36);
});

test('T5 store boards and store targets stay reachable', async ({ page }) => {
  await boot(page);
  const reach = await page.evaluate((stores) => {
    const gaps = PixelPets.auditTaps().reachGaps;
    return stores.map((s) => {
      PixelPets.goto(s.town, s.from[0], s.from[1], 'down');
      const hit = gaps.filter((g) => g.indexOf(s.id) >= 0 || g.indexOf(s.board[0]) >= 0);
      return {
        town: s.town,
        hit,
        stand: PixelPets.findPath([{ x: s.stand[0], y: s.stand[1] }]),
        see: PixelPets.findPath([{ x: s.see[0], y: s.see[1] }]),
      };
    });
  }, STORES);
  for (const row of reach) {
    expect(row.hit, row.town).toEqual([]);
    expect(row.stand, row.town + ' stand').toBeTruthy();
    expect(row.see, row.town + ' board').toBeTruthy();
  }
});

test('T6 every Lantern House has a rest bed', async ({ page }) => {
  const md = fs.readFileSync('data/mapdata.js', 'utf8');
  for (const h of HOUSES) expect(md, h.bed).toContain(h.bed);
  expect(md).toContain('@lantern_rest');
  await boot(page);
  const beds = await page.evaluate((houses) => houses.map((h) => {
    PixelPets.goto(h.room, 4, 5, 'up');
    return PixelPets.mapObjs.some((o) => o.id === h.bed);
  }), HOUSES);
  expect(beds).toEqual([true, true, true, true]);
});

test('T7 each guide stands on a free tile and closes no side', async ({ page }) => {
  await boot(page);
  const rows = await page.evaluate((houses) => {
    const gaps = PixelPets.auditTaps().reachGaps;
    return houses.map((h) => {
      PixelPets.goto(h.room, 4, 5, 'up');
      const g = PixelPets.mapObjs.find((o) => o.id === h.guide[0]);
      const tile = g && PixelPets.tileInfo(g.x, g.y);
      const side = PixelPets.findPath([{ x: g.x, y: g.y + 1 }]);
      const roomGaps = gaps.filter((s) => s.indexOf(h.room + ':') === 0);
      return { id: h.guide[0], g, walk: !!(tile && tile.walk), side: !!side, roomGaps };
    });
  }, HOUSES);
  for (const row of rows) {
    expect(row.g, row.id).toBeTruthy();
    expect(row.walk, row.id).toBe(true);
    expect(row.side, row.id).toBe(true);
    expect(row.roomGaps, row.id).toEqual([]);
  }
});

test('T8 the first visit plays once and the save stays v2', async ({ page }) => {
  const fixture = saveAt();
  expect(fixture.v).toBe(2);
  expect(fixture.flags['lantern.guide_heard']).toBeUndefined();
  await boot(page);
  const before = await page.evaluate(() => Object.keys(PixelPets.state.flags).sort());
  await page.evaluate(() => {
    PixelPets.goto('hearthmoor', 16, 13, 'up');
    PixelPets.walkStep('up');
  });
  await page.waitForFunction(() => PixelPets.mapInfo.id === 'hm_lantern_in' && PixelPets.scene && PixelPets.scene.text === 'Welcome in. Talk to a bed and your whole team rests and heals, for 5 Acorns.');
  await advanceSay(page);
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.text && PixelPets.scene.text.indexOf('Lose a battle') === 0);
  await advanceSay(page);
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.mode === 'choice' && PixelPets.optionsReady === true);
  expect(await page.evaluate(() => PixelPets.scene.text)).toBe('Got all that?');
  await page.locator('#sbChoices button', { hasText: 'Got it' }).click();
  await page.waitForFunction(() => !PixelPets.scene);
  const raw = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  expect(raw.v).toBe(2);
  expect(raw.flags['lantern.guide_heard']).toBe(true);
  const added = Object.keys(raw.flags).filter((k) => before.indexOf(k) < 0).sort();
  expect(added).toEqual(['lantern.guide_heard']);
  await page.evaluate(() => {
    PixelPets.goto('cobblecrest', 5, 5, 'up');
    PixelPets.walkStep('up');
  });
  await page.waitForFunction(() => PixelPets.mapInfo.id === 'cc_lantern_in' && !PixelPets.fading);
  expect(await page.evaluate(() => !!PixelPets.scene)).toBe(false);
});

async function linesUntilChoice(page, limit) {
  const says = [];
  for (let i = 0; i < limit; i++) {
    await page.waitForFunction(() => {
      const s = PixelPets.scene;
      return s && (s.mode === 'choice' || (s.mode === 'say' && s.full && s.waiting));
    });
    const sc = await page.evaluate(() => ({ mode: PixelPets.scene.mode, text: PixelPets.scene.text }));
    if (sc.mode === 'choice') return says;
    says.push(sc.text);
    await page.keyboard.press('Space');
  }
  return says;
}

test('T9 Say it again replays, Got it closes, and a later tap replays', async ({ page }) => {
  await boot(page, { 'lantern.guide_heard': true });
  await page.evaluate(() => {
    PixelPets.goto('hm_lantern_in', 4, 3, 'up');
    PixelPets.talkTo('hm_lantern_host');
  });
  expect(await linesUntilChoice(page, 4)).toEqual([G1, G2]);
  await page.waitForFunction(() => PixelPets.optionsReady === true);
  await page.locator('#sbChoices button', { hasText: 'Say it again' }).click();
  expect(await linesUntilChoice(page, 4)).toEqual([G1, G2]);
  await page.waitForFunction(() => PixelPets.optionsReady === true);
  await page.locator('#sbChoices button', { hasText: 'Got it' }).click();
  await page.waitForFunction(() => !PixelPets.scene);
  await page.evaluate(() => PixelPets.talkTo('hm_lantern_host'));
  await page.waitForFunction((line) => PixelPets.scene && PixelPets.scene.text === line, G1);
  await page.evaluate(() => PixelPets.endScene());
  await page.evaluate(() => {
    PixelPets.goto('fb_lantern_in', 6, 4, 'up');
    PixelPets.talkTo('amos');
  });
  const amos = await linesUntilChoice(page, 6);
  expect(amos[0].length).toBeGreaterThan(0);
  expect(amos[0]).not.toBe(G1);
  expect(amos.slice(1, 3)).toEqual([G1, G2]);
  await page.waitForFunction(() => PixelPets.optionsReady === true);
  await page.locator('#sbChoices button', { hasText: 'Say it again' }).click();
  expect(await linesUntilChoice(page, 4)).toEqual([G1, G2]);
  await page.waitForFunction(() => PixelPets.optionsReady === true);
  await page.locator('#sbChoices button', { hasText: 'Got it' }).click();
  await page.waitForFunction(() => !PixelPets.scene);
});

test('T10 guide lines stay within the limits and the cost matches the bed', async ({ page }) => {
  await boot(page);
  const cost = await page.evaluate(() => PixelPets.lanternRest.cost);
  expect(G1.length).toBeLessThanOrEqual(110);
  expect(G2.length).toBeLessThanOrEqual(110);
  expect('Got all that?'.length).toBeLessThanOrEqual(110);
  expect('Got it'.length).toBeLessThanOrEqual(30);
  expect('Say it again'.length).toBeLessThanOrEqual(30);
  expect(G1).toBe('Welcome in. Talk to a bed and your whole team rests and heals, for ' + cost + ' Acorns.');
  expect(G1).not.toMatch(/  /);
  await page.evaluate(() => {
    PixelPets.goto('cc_lantern_in', 4, 3, 'up');
    PixelPets.talkTo('cc_lantern_host');
  });
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.text);
  expect(await page.evaluate(() => PixelPets.scene.text)).toBe(G1);
});

test('T11 the town map key gains both rows and the region key stays', async ({ page }) => {
  await boot(page, null, 'modern');
  await page.locator('#mapBtn').click();
  await page.waitForSelector('#ovMap:not([hidden])');
  await page.waitForFunction(() => PixelPets.mapLayer() && PixelPets.mapLayer().level === 'town');
  const town = await page.locator('#mapLayerKey').innerText();
  expect(town).toContain('Lantern House');
  expect(town).toContain('General Store');
  const swatches = await page.evaluate(() => [...document.querySelectorAll('#mapLayerKey canvas.sw')].map((c) => c.width + 'x' + c.height));
  expect(swatches).toEqual(['16x16', '16x16']);
  const mark = await page.evaluate(() => {
    const layer = PixelPets.mapLayer();
    const door = layer.buildings.find((b) => b.door === 'hm_lantern');
    const store = layer.buildings.find((b) => b.door === 'hm_store');
    const c = document.querySelector('#regionCanvas');
    const g = c.getContext('2d');
    const k = c.width / c.getBoundingClientRect().width;
    const px = (x, y) => {
      const d = g.getImageData(Math.floor((x + 0.5) * k), Math.floor((y + 0.5) * k), 1, 1).data;
      return [d[0], d[1], d[2]];
    };
    const p = layer.px;
    const peak = (tx, ty) => {
      let r = 0, b = 0;
      for (let y = 0; y < p; y++) for (let x = 0; x < p; x++) {
        const d = px(tx * p + x, ty * p + y);
        if (d[0] > r) r = d[0];
        if (d[2] > b) b = d[2];
      }
      return [r, b];
    };
    return { heart: peak(door.xy[0], door.xy[1]), board: peak(store.xy[0], store.xy[1]), minimap: !!document.querySelector('#minimap') };
  });
  expect(mark.minimap).toBe(false);
  expect(mark.heart[0]).toBeGreaterThan(140);
  expect(mark.board[1]).toBeGreaterThan(140);
  await page.locator('#mapLevelRegion').click();
  await page.waitForFunction(() => PixelPets.mapLayer().level === 'region');
  const region = await page.locator('#mapKey').innerText();
  expect(region).not.toContain('Lantern House');
  expect(region).not.toContain('General Store');
});

test('T12 quest marks sit clear of the marker and the board', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await boot(page);
  await page.evaluate(() => {
    PixelPets.goto('hearthmoor', 16, 14, 'up');
    PixelPets.cueForce({ x: 16, y: 13 });
  });
  await page.waitForFunction(() => PixelPets.cuePass());
  const boxes = await page.evaluate(() => {
    const pass = PixelPets.cuePass();
    const origin = pass.dir === 'down'
      ? { x: pass.x - 5, y: pass.y + 12 }
      : { x: pass.x - 5, y: pass.y - 17 };
    return {
      dir: pass.dir,
      marker: { x: origin.x - 16, y: origin.y, w: 16, h: 16 },
      arrow: { x: pass.x - 1, y: pass.y - 1, w: 9, h: 9 },
      bang: { x: origin.x + 4, y: origin.y - 15, w: 9, h: 12 },
      bubble: { x: origin.x + 4, y: origin.y - 11, w: 8, h: 8 },
      chips: (PixelPets.cueChips() || []).map((c) => c.box).filter(Boolean),
      at: { x: pass.x, y: pass.y },
    };
  });
  expect(boxes.dir).toBeTruthy();
  expect(overlap(boxes.arrow, boxes.marker)).toBe(false);
  expect(overlap(boxes.bang, boxes.marker)).toBe(false);
  expect(overlap(boxes.bubble, boxes.marker)).toBe(false);
  expect(boxes.arrow.y + boxes.arrow.h).toBeLessThanOrEqual(boxes.marker.y);
  for (const chip of boxes.chips) expect(overlap(chip, boxes.marker)).toBe(false);
  await page.evaluate(() => {
    PixelPets.goto('hearthmoor', 4, 27, 'up');
    PixelPets.cueForce({ x: 4, y: 26 });
  });
  await page.waitForFunction((prev) => {
    const p = PixelPets.cuePass();
    return p && (p.x !== prev.x || p.y !== prev.y);
  }, boxes.at);
  const store = await page.evaluate(() => {
    const pass = PixelPets.cuePass();
    const origin = pass.dir === 'down'
      ? { x: pass.x - 5, y: pass.y + 12 }
      : { x: pass.x - 5, y: pass.y - 17 };
    return {
      board: { x: origin.x + 16, y: origin.y, w: 16, h: 16 },
      arrow: { x: pass.x - 1, y: pass.y - 1, w: 9, h: 9 },
    };
  });
  expect(overlap(store.arrow, store.board)).toBe(false);
});

test('T13 the High Charity sign and note say 5 Acorns', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    PixelPets.goto('highcharity', 22, 35, 'up');
    PixelPets.talkTo('hc_sign_lantern');
  });
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.text);
  expect(await page.evaluate(() => PixelPets.scene.text)).toBe(HC_WALL);
  await page.evaluate(() => {
    PixelPets.endScene();
    PixelPets.goto('hc_lantern_in', 4, 5, 'up');
    PixelPets.talkTo('hc_lantern_note');
  });
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.text);
  expect(await page.evaluate(() => PixelPets.scene.text)).toBe(HC_NOTE);
});

test('T14 choices stay tappable at phone widths and inside the desk frame', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page);
  for (const mode of ['modern', 'arcade']) {
    await page.evaluate((m) => PixelPets.applyCtl(m, false), mode);
    await page.evaluate(() => {
      if (PixelPets.scene) PixelPets.endScene();
      PixelPets.goto('hm_lantern_in', 4, 3, 'up');
      PixelPets.talkTo('hm_lantern_host');
    });
    expect(await linesUntilChoice(page, 4)).toEqual([G1, G2]);
    await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.mode === 'choice' && PixelPets.optionsReady === true);
    if (mode === 'modern') await shotChoice(page, 'host-della-choice.png');
    const hits = await page.evaluate(() => [...document.querySelectorAll('#sbChoices button')].map((b) => {
      const r = b.getBoundingClientRect();
      const app = document.querySelector('#app').getBoundingClientRect();
      return { text: b.textContent, w: r.width, h: r.height, left: r.left, right: r.right, appL: app.left, appR: app.right };
    }));
    expect(hits.map((h) => h.text)).toEqual(expect.arrayContaining(['Got it', 'Say it again']));
    for (const h of hits) {
      expect(h.w, mode).toBeGreaterThanOrEqual(44);
      expect(h.h, mode).toBeGreaterThanOrEqual(44);
      expect(h.left).toBeGreaterThanOrEqual(h.appL - 1);
      expect(h.right).toBeLessThanOrEqual(h.appR + 1);
    }
    await page.locator('#sbChoices button', { hasText: 'Got it' }).click();
    await page.waitForFunction(() => !PixelPets.scene);
  }
  if (page.viewportSize().width === 390) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.evaluate(() => {
      PixelPets.applyCtl('modern', false);
      PixelPets.goto('hm_lantern_in', 4, 3, 'up');
      PixelPets.talkTo('hm_lantern_host');
    });
    expect(await linesUntilChoice(page, 4)).toEqual([G1, G2]);
    await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.mode === 'choice' && PixelPets.optionsReady === true);
    const desk = await page.evaluate(() => {
      const app = document.querySelector('#app').getBoundingClientRect();
      const buttons = [...document.querySelectorAll('#sbChoices button')].map((b) => b.getBoundingClientRect());
      return { app, buttons };
    });
    for (const b of desk.buttons) {
      expect(b.left).toBeGreaterThanOrEqual(desk.app.left - 1);
      expect(b.right).toBeLessThanOrEqual(desk.app.right + 1);
      expect(b.width).toBeLessThanOrEqual(desk.app.width + 1);
      expect(b.height).toBeGreaterThanOrEqual(44);
    }
  }
});

test('T15 reduced motion keeps the night glow still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await boot(page);
  await page.evaluate(() => {
    PixelPets.goto('hearthmoor', 16, 14, 'up');
    PixelPets.cueForce({ x: 15, y: 13 });
    PixelPets.clock.set('mon', 21, 0);
    PixelPets.clock.freeze(true);
  });
  await page.waitForTimeout(100);
  const sample = () => page.evaluate(() => {
    const pass = PixelPets.cuePass();
    const c = document.querySelector('#mapCanvas');
    const g = c.getContext('2d');
    const y = pass.dir === 'down' ? pass.y + 12 - 2 : pass.y - 17 - 2;
    const x = (pass.dir === 'down' ? pass.x - 5 : pass.x - 5) + 8;
    const d = g.getImageData(Math.max(0, x), Math.max(0, y), 1, 1).data;
    return [d[0], d[1], d[2], d[3]];
  });
  const a = await sample();
  await page.waitForTimeout(400);
  const b = await sample();
  expect(b).toEqual(a);
});

test('T16 the landmarks checker passes in strict mode', async () => {
  const root = process.env.PP_DESIGN_DIR || '/tmp/design';
  const checker = path.join(root, 'specs', 'town_landmarks_check.py');
  test.skip(!fs.existsSync(checker), 'Design checker is not unpacked at ' + checker + '. Set PP_DESIGN_DIR to the design repo so T16 can run.');
  const out = execFileSync('python3', [checker], {
    env: Object.assign({}, process.env, { GAME_DIR: process.cwd(), GAME_REF: 'HEAD' }),
    encoding: 'utf8',
  });
  expect(out).toContain('ok   strict: every Lantern House has its marker, beds and guide; every store its board');
  expect(out).toMatch(/PASS TOWN_LANDMARKS v0\.1 \(0 problems\)/);
});
