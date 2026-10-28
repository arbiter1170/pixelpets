/* MAP_EDGE_TAPS P2 (D722-D725) and LANDSCAPE P0 (D727-D729).
   Modern headroom, the bigger upright outdoor scale, the Map size row, and the arcade area chip. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

function save(mode) {
  const s = starterSave();
  s.settings.controls = mode;
  s.settings.follower = false;
  s.settings.tips = false;
  s.settings.textSpeed = 'fast';
  s.flags['story.phone_got'] = true;
  s.flags['story.early_done'] = true;
  s.flags['story.tutorial_done'] = true;
  s.money = 40;
  return s;
}

async function boot(page, mode) {
  await installSave(page.context(), save(mode), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForFunction(() => document.querySelector('#mapCanvas').width > 0);
}

test('T7 edge rows and columns clear the HUD, including Fernbrook row 0', async ({ page }) => {
  test.setTimeout(180000);
  await boot(page, 'modern');
  const width = page.viewportSize().width;
  const report = await page.evaluate(async () => {
    const GAP = 4;
    const overlap = (a, b) => {
      const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      return ox > GAP && oy > GAP;
    };
    // Under mhc-frame the dock sits outside #mapWrap, so only measure dock controls (nothing over the map).
    const hudBoxes = () => [...document.querySelectorAll('#fcDock button, #fcDock #thChip, #fcDock #fcAcorns, #joyRing')]
      .map(n => n.getBoundingClientRect())
      .filter(r => r.width >= 8 && r.height >= 8);
    const tileRect = (tx, ty) => {
      const mc = document.querySelector('#mapCanvas');
      const r = mc.getBoundingClientRect();
      const cam = PixelPets.walk.cam;
      const s = r.width / mc.width;
      return {
        left: r.left + (tx * 16 - cam.x) * s,
        top: r.top + (ty * 16 - cam.y) * s,
        right: r.left + ((tx + 1) * 16 - cam.x) * s,
        bottom: r.top + ((ty + 1) * 16 - cam.y) * s,
      };
    };
    const onScreen = (rect) => {
      const mc = document.querySelector('#mapCanvas').getBoundingClientRect();
      const ox = Math.min(rect.right, mc.right) - Math.max(rect.left, mc.left);
      const oy = Math.min(rect.bottom, mc.bottom) - Math.max(rect.top, mc.top);
      return ox > GAP && oy > GAP;
    };
    const stand = async (map, x, y) => {
      PixelPets.goto(map, x, y, 'down');
      if (PixelPets.scene) PixelPets.endScene();
      const t = document.querySelector('#toast');
      if (t) t.classList.remove('show');
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    };
    const walkable = (x, y, info) => {
      if (x < 0 || y < 0 || x >= info.w || y >= info.h) return false;
      const t = PixelPets.tileInfo(x, y);
      return t.walk && !t.blocked;
    };
    const nearest = (info, tx, ty) => {
      let best = null, bestD = 1e9;
      for (let y = 0; y < info.h; y++) for (let x = 0; x < info.w; x++) {
        if (!walkable(x, y, info)) continue;
        const d = Math.abs(x - tx) + Math.abs(y - ty);
        if (d < bestD) { bestD = d; best = { x, y }; }
      }
      return best;
    };
    const ids = PixelPets.debugCatalog().maps.slice();
    const bad = [];
    let fernRow = null;
    for (const id of ids) {
      if (!PixelPets.goto(id)) continue;
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const info = PixelPets.mapInfo;
      if (info.fitWidth) continue;
      const mc0 = document.querySelector('#mapCanvas');
      const mapCss = info.w * 16 * (mc0.getBoundingClientRect().width / mc0.width);
      const tight = Math.abs(mapCss - mc0.getBoundingClientRect().width) <= 2;
      const spots = [
        ['n', nearest(info, Math.floor(info.w / 2), 0)],
        ['s', nearest(info, Math.floor(info.w / 2), info.h - 1)],
        ['w', tight ? null : nearest(info, 0, Math.floor(info.h / 2))],
        ['e', tight ? null : nearest(info, info.w - 1, Math.floor(info.h / 2))],
      ];
      for (const [edge, spot] of spots) {
        if (!spot) continue;
        await stand(id, spot.x, spot.y);
        const boxes = hudBoxes();
        const wrap = document.querySelector('#mapWrap').getBoundingClientRect();
        // Dock is outside the map: the free map rect is the whole wrap.
        const inFreeX = rect => rect.left >= wrap.left - GAP && rect.right <= wrap.right + GAP;
        const inFreeY = rect => rect.top >= wrap.top - GAP && rect.bottom <= wrap.bottom + GAP;
        const line = (edge === 'n' || edge === 'nw' || edge === 'ne') ? 0 : edge === 's' ? info.h - 1 : null;
        const col = edge === 'w' ? 0 : edge === 'e' ? info.w - 1 : (edge === 'nw' ? 0 : edge === 'ne' ? info.w - 1 : null);
        const tiles = [];
        if (line != null) for (let x = 0; x < info.w; x++) tiles.push([x, line, 'x']);
        if (col != null && edge !== 'n' && edge !== 's') for (let y = 0; y < info.h; y++) tiles.push([col, y, 'y']);
        let shown = 0;
        for (const [tx, ty, axis] of tiles) {
          if (Math.max(Math.abs(tx - spot.x), Math.abs(ty - spot.y)) > 2 && !(id === 'fernbrook' && edge === 'n')) continue;
          const rect = tileRect(tx, ty);
          if (!onScreen(rect)) continue;
          if (axis === 'x' && !inFreeX(rect)) continue;
          if (axis === 'y' && !inFreeY(rect)) continue;
          shown++;
          if (boxes.some(b => overlap(rect, b))) bad.push(id + ' ' + edge + ' ' + tx + ',' + ty);
        }
        if (id === 'fernbrook' && edge === 'n') fernRow = { shown, w: info.w };
      }
      const mid = nearest(info, Math.floor(info.w / 2), Math.floor(info.h / 2));
      if (mid) await stand(id, mid.x, mid.y);
      if (id === 'hm_flats_lobby' && window.innerWidth <= 320) continue;
      const objs = info.objs.filter(o => o.kind === 'warp' || o.kind === 'sign' || o.kind === 'prop' || o.kind === 'board');
      for (const o of objs) {
        if (tight && (o.x === 0 || o.x === info.w - 1)) continue;
        const spot = walkable(o.x, o.y, info) ? { x: o.x, y: o.y, d: 0 } : nearest(info, o.x, o.y);
        if (!spot || Math.abs(spot.x - o.x) + Math.abs(spot.y - o.y) > 2) continue;
        await stand(id, spot.x, spot.y);
        const rect = tileRect(o.x, o.y);
        const mc = document.querySelector('#mapCanvas').getBoundingClientRect();
        const full = rect.left >= mc.left + GAP && rect.right <= mc.right - GAP && rect.top >= mc.top + GAP && rect.bottom <= mc.bottom - GAP;
        if (!full) continue;
        const boxes = hudBoxes();
        if (boxes.some(b => overlap(rect, b))) bad.push(id + ' obj ' + o.kind + ' ' + (o.id || '') + ' ' + o.x + ',' + o.y);
      }
    }
    return { bad: bad.slice(0, 24), n: bad.length, fernRow, v: PixelPets.state.v };
  });
  expect(report.v).toBe(2);
  expect(report.fernRow, 'fernbrook row 0').toBeTruthy();
  expect(report.fernRow.shown, 'fernbrook row 0 on screen').toBeGreaterThan(0);
  if (width === 320) expect(report.fernRow.shown).toBeGreaterThan(2);
  expect(report.bad, report.n + ' covered\n' + report.bad.join('\n')).toEqual([]);
});

test('T8 rooms that fit sit low, and Your Home clears the column and the bottom band', async ({ page }) => {
  test.setTimeout(120000);
  await boot(page, 'modern');
  const width = page.viewportSize().width;
  const report = await page.evaluate(async () => {
    const ids = PixelPets.debugCatalog().maps.slice().sort();
    const rows = [];
    for (const id of ids) {
      if (!PixelPets.goto(id)) continue;
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (PixelPets.scene) PixelPets.endScene();
      const info = PixelPets.mapInfo;
      if (!info.room || info.fitWidth) continue;
      const mc = document.querySelector('#mapCanvas');
      const wrap = document.querySelector('#mapWrap').getBoundingClientRect();
      const cr = mc.getBoundingClientRect();
      const z = cr.width / mc.width;
      const mapCssH = info.h * 16 * z;
      // Dock outside the map: pads are 0, so a fitting room centres in the full wrap (D785).
      const padT = 0, bot = 0, col = 0;
      const fits = mapCssH <= cr.height + 0.5 && mapCssH <= wrap.height - bot - padT + 0.5;
      if (!fits) continue;
      const cam = PixelPets.walk.cam;
      const mapTop = cr.top + (0 - cam.y) * z;
      let yCss = Math.max(padT, Math.floor((wrap.height - bot - mapCssH) / 2));
      const oy = cr.top - wrap.top;
      if (yCss + mapCssH > oy + cr.height) yCss = Math.max(padT, oy + cr.height - mapCssH);
      const wantTop = wrap.top + yCss;
      const door = info.objs.filter(o => o.kind === 'warp' || o.kind === 'door').sort((a, b) => b.y - a.y)[0];
      const doorBottom = door ? cr.top + ((door.y + 1) * 16 - cam.y) * z : null;
      rows.push({
        id, top: Math.round(mapTop), want: Math.round(wantTop),
        doorBottom: doorBottom == null ? null : Math.round(doorBottom),
        band: Math.round(wrap.bottom - bot),
        scale: info.scale, base: info.baseScale,
      });
    }
    return rows;
  });
  expect(report.length).toBeGreaterThan(3);
  const off = report.filter(r => Math.abs(r.top - r.want) > 2);
  expect(off, JSON.stringify(off.slice(0, 8))).toEqual([]);
  if (width === 320) {
    await page.evaluate(async () => {
      PixelPets.goto('hc_apt_in');
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (PixelPets.scene) PixelPets.endScene();
    });
    const home = await page.evaluate(() => {
      const mc = document.querySelector('#mapCanvas');
      const cr = mc.getBoundingClientRect();
      const cam = PixelPets.walk.cam;
      const z = cr.width / mc.width;
      const info = PixelPets.mapInfo;
      const door = info.objs.filter(o => o.kind === 'warp' || o.kind === 'door').sort((a, b) => b.y - a.y)[0];
      const wallTop = cr.top + (0 - cam.y) * z;
      const doorBottom = cr.top + ((door.y + 1) * 16 - cam.y) * z;
      // Dock buttons are outside the map; the left wall cannot sit under them.
      const dock = document.querySelector('#fcDock').getBoundingClientRect();
      const wall = { left: cr.left + (0 - cam.x) * z, right: cr.left + (16 - cam.x) * z, top: wallTop, bottom: wallTop + 16 * z };
      const hit = wall.left < dock.right - 4 && wall.right > dock.left + 4 && wall.top < dock.bottom - 4 && wall.bottom > dock.top - 4;
      return { wallTop, doorBottom, band: cr.top + cr.height, hit, scale: info.scale, doorY: door.y };
    });
    expect(home.scale).toBe(2);
    expect(home.doorBottom).toBeLessThan(home.band);
    expect(home.hit, 'left wall still under the dock').toBe(false);
  }
});

test('T9 shop sheet and speaker bias still frame', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page, 'modern');
  await page.evaluate(() => PixelPets.clock.set('tue', 12, 0));
  await page.evaluate(() => PixelPets.goto('hm_diner', 4, 2, 'left'));
  await page.waitForFunction(() => !PixelPets.fading);
  expect(await page.evaluate(() => PixelPets.talkTo('hm_hesper'))).toBe(true);
  for (let i = 0; i < 30; i++) {
    const sc = await page.evaluate(() => {
      const s = window.PixelPets.scene;
      return s && { mode: s.mode, waiting: s.waiting };
    });
    if (sc && sc.mode === 'choice') break;
    if (sc && sc.waiting) await page.keyboard.press('Space');
    await page.waitForTimeout(40);
  }
  await page.waitForSelector('#ovShop:not([hidden])');
  await page.waitForTimeout(400);
  const shop = await page.evaluate(() => {
    const ov = document.querySelector('#ovShop');
    const sheet = ov && ov.querySelector('.shop-sheet');
    const c = document.querySelector('#mapCanvas');
    const cr = c.getBoundingClientRect();
    const cam = PixelPets.walk.cam;
    const z = cr.width / c.width;
    let y = 0;
    const g = c.getContext('2d'), w = c.width, h = c.height, data = g.getImageData(0, 0, w, h).data;
    for (; y < h; y++) {
      let ink = false;
      for (let px = 0; px < w; px++) {
        const i = (y * w + px) * 4;
        if (data[i] !== 0x1a || data[i + 1] !== 0x1c || data[i + 2] !== 0x2c) { ink = true; break; }
      }
      if (ink) break;
    }
    return {
      open: sheet && !ov.hidden && sheet.getBoundingClientRect().height > 40,
      zoom: PixelPets.mapInfo.scale,
      roomTop: cr.top + y * z,
      camY: cam.y,
    };
  });
  expect(shop.open).toBe(true);
  expect(shop.zoom).toBe(2);
  const w = page.viewportSize().width;
  // Oct 28, 2026: the shop sheet now sits above the Modern dock, so the room frames higher (was 185 / 56).
  const roomWant = w === 390 ? 102 : w === 320 ? 12 : null;
  if (roomWant != null) expect(Math.abs(shop.roomTop - roomWant), 'room top ' + shop.roomTop).toBeLessThanOrEqual(16);
  await page.locator('#shopClose').click();
  await page.waitForSelector('#ovShop', { state: 'hidden' });
  await page.evaluate(() => PixelPets.goto('hearthmoor', 4, 14, 'up'));
  await page.waitForFunction(() => !PixelPets.fading && !PixelPets.scene);
  await page.evaluate(() => PixelPets.probeScene([['say', 'Hattie', 'This line is long on purpose so both the top box and the bottom box can reach a speaker who stands in the middle of a short screen.']]));
  await page.waitForTimeout(250);
  const frame = await page.evaluate(() => {
    const c = document.querySelector('#mapCanvas');
    const cr = c.getBoundingClientRect();
    const k = cr.width / c.width;
    const cam = PixelPets.walk.cam;
    const o = PixelPets.mapInfo.objs.find(q => q.id === 'hattie');
    const margin = 8, head = 6;
    const left = cr.left + (o.x * 16 - cam.x - margin) * k;
    const top = cr.top + (o.y * 16 - cam.y - margin - head) * k;
    const spr = { left, top, right: left + (16 + margin * 2) * k, bottom: top + (16 + margin * 2 + head) * k };
    const box = document.querySelector('#sbox').getBoundingClientRect();
    const ox = Math.min(spr.right, box.right) - Math.max(spr.left, box.left);
    const oy = Math.min(spr.bottom, box.bottom) - Math.max(spr.top, box.top);
    const bias = PixelPets.walk.camBias ? PixelPets.walk.camBias.y : 0;
    return { cover: ox > 4 && oy > 4, bias, shown: box.height > 20 && !document.querySelector('#ovScene').hidden };
  });
  expect(frame.shown).toBe(true);
  expect(frame.cover, 'box covers the speaker').toBe(false);
});

test('P0 the default 2x map zoom is today\'s scale outdoors, and rooms keep today\'s scale', async ({ page }) => {
  test.setTimeout(90000);
  for (const mode of ['modern', 'arcade']) {
    await boot(page, mode);
    const outdoor = await page.evaluate(() => {
      const info = PixelPets.mapInfo;
      return { scale: info.scale, base: info.baseScale, room: info.room, z: PixelPets.state.settings.mapZoom };
    });
    expect(outdoor.room).toBe(false);
    expect(outdoor.z).toBe(2);
    // Live on main (measured on main): modern is 2x at every width; arcade is floor(map wrap width / 176)
    // and its wrap is 36 px narrower than the window (284, 339, 354), so 1x at 320 and 375 and 2x at 390.
    const live = mode === 'modern' ? 2 : ({ 320: 1, 375: 1, 390: 2 })[page.viewportSize().width];
    expect(outdoor.scale, mode).toBe(live);
    expect(outdoor.base, mode).toBe(live);
    const rooms = await page.evaluate(async (modeName) => {
      const out = [];
      for (const id of ['hm_home_in', 'hm_rook_in', 'hc_apt_in']) {
        PixelPets.goto(id);
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const info = PixelPets.mapInfo;
        const wrap = document.querySelector('#mapWrap').getBoundingClientRect();
        const mc = document.querySelector('#mapCanvas');
        const W = wrap.width, H = wrap.height, s = info.baseScale;
        const frame = document.body.classList.contains('mhc-frame');
        const hud = (modeName === 'modern' && !frame) ? 112 : 0;
        const byW = Math.floor(W / ((info.w - info.slack) * 16));
        const byH = Math.floor((H - hud) / (info.h * 16));
        let expected = Math.max(s, Math.min(2 * s, byW, byH));
        if (id === 'hc_apt_in' && window.innerWidth <= 320 && !frame) expected = Math.min(expected, Math.max(s, 2));
        out.push({ id, scale: info.scale, base: info.baseScale, expected, cssH: mc.getBoundingClientRect().height, H, hud });
      }
      return out;
    }, mode);
    if (mode === 'modern') {
      for (const r of rooms) {
        expect(r.scale, r.id).toBe(r.expected);
        expect(r.scale, r.id).toBeGreaterThanOrEqual(r.base);
        expect(r.cssH, r.id).toBeLessThanOrEqual(r.H - r.hud + 1);
      }
    }
  }
});

test('arcade place chip is a 44 px target in the area row', async ({ page }) => {
  await boot(page, 'arcade');
  const badge = page.locator('#thChip');
  await expect(badge).toBeVisible();
  const box = await badge.boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
  const place = await page.evaluate(() => {
    const b = document.querySelector('#thChip');
    const scr = document.querySelector('#scr-walk');
    return { pos: getComputedStyle(b).position, parent: b.parentNode.id, inScr: scr.contains(b) };
  });
  expect(place.pos).not.toBe('absolute');
  expect(place.parent).toBe('scr-walk');
  expect(place.inScr).toBe(true);
});
