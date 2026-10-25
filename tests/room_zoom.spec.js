/* ROOM_ZOOM v0.1 (D231–D239). Modern interiors use a whole-number scale. Tap-to-walk hits the tile under the finger. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

function zoomSave() {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.follower = false;
  s.flags['story.phone_got'] = true;
  s.flags['story.early_done'] = true;
  s.flags['story.tutorial_done'] = true;
  return s;
}

function expectScale(info, W, H) {
  const s = Math.max(2, Math.floor(W / 176));
  const slack = info.slack;
  const byW = Math.floor(W / ((info.w - slack) * 16));
  const byH = Math.floor((H - 112) / (info.h * 16));
  const S = Math.max(s, Math.min(2 * s, byW, byH));
  expect(info.baseScale).toBe(s);
  expect(info.scale).toBe(S);
  expect(Number.isInteger(info.scale)).toBe(true);
  expect(info.scale).toBeGreaterThanOrEqual(s);
  expect(info.scale).toBeLessThanOrEqual(s * 2);
}

test('small interiors zoom, and every walkable tile hits', async ({ page }) => {
  test.setTimeout(60000);
  await installSave(page.context(), zoomSave(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForFunction(() => document.querySelector('#mapCanvas').width > 0);
  const outdoor = await page.evaluate(() => {
    const info = PixelPets.mapInfo;
    const w = document.querySelector('#mapWrap');
    // Map zoom defaults to 2x, which is today's outdoor scale.
    return Object.assign({ want: info.baseScale, wrapW: w.clientWidth }, info);
  });
  expect(outdoor.id).toBe('hearthmoor');
  expect(outdoor.room).toBe(false);
  expect(outdoor.scale).toBe(2);   // modern outdoors is 2x at 320, 375 and 390, as live
  expect(outdoor.baseScale).toBe(2);
  expect(outdoor.slack).toBe(0);
  expect(outdoor.edge).toBe(null);

  const rooms = ['hm_home_in', 'hm_home_up', 'hm_rook_in'];
  for (const id of rooms) {
    await page.evaluate(async (id) => {
      PixelPets.goto(id);
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (PixelPets.scene) PixelPets.endScene();
      const t = document.querySelector('#toast');
      if (t) t.classList.remove('show');
    }, id);
    const report = await page.evaluate(async (id) => {
      const info = PixelPets.mapInfo;
      const mc = document.querySelector('#mapCanvas');
      const wrap = document.querySelector('#mapWrap').getBoundingClientRect();
      const cr = mc.getBoundingClientRect();
      const g = mc.getContext('2d');
      const cam0 = PixelPets.walk.cam;
      const px = g.getImageData(0, 0, 1, 1).data;
      const voidPx = cam0.y < 0 ? [px[0], px[1], px[2]] : null;
      const bad = [];
      const stand = { x: PixelPets.state.world.x, y: PixelPets.state.world.y };
      for (let y = 0; y < info.h; y++) for (let x = 0; x < info.w; x++) {
        const tile = PixelPets.tileInfo(x, y);
        if (!tile.walk) continue;
        const cam = PixelPets.walk.cam;
        const r = mc.getBoundingClientRect();
        const cx = x * 16 + 8 - cam.x, cy = y * 16 + 8 - cam.y;
        const opt = { bubbles: true, cancelable: true, clientX: r.left + (cx / mc.width) * r.width, clientY: r.top + (cy / mc.height) * r.height, pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0 };
        mc.dispatchEvent(new PointerEvent('pointerdown', opt));
        mc.dispatchEvent(new PointerEvent('pointerup', opt));
        const hit = PixelPets.walk.hit;
        if (!hit || hit.x !== x || hit.y !== y) bad.push({ x, y, hit: hit ? { x: hit.x, y: hit.y } : null });
        PixelPets.walk.path = null;
        PixelPets.walk.arrive = null;
        PixelPets.walk.target = null;
        PixelPets.walk.to = null;
        if (PixelPets.scene) PixelPets.endScene();
      }
      const gear = document.querySelector('#gearFloat').getBoundingClientRect();
      return {
        id: info.id, w: info.w, h: info.h, scale: info.scale, baseScale: info.baseScale, slack: info.slack,
        edge: info.edge, fitWidth: info.fitWidth, W: wrap.width, H: wrap.height, cssH: cr.height, topGap: cr.top - wrap.top, voidPx, bad, n: bad.length ? 0 : null,
        walked: { w: info.w, h: info.h }, smooth: g.imageSmoothingEnabled, gearH: gear.height,
        stand, v: PixelPets.state.v,
        count: (() => { let n = 0; for (let y = 0; y < info.h; y++) for (let x = 0; x < info.w; x++) if (PixelPets.tileInfo(x, y).walk) n++; return n; })(),
      };
    }, id);
    expect(report.bad, id + ' miss ' + JSON.stringify(report.bad.slice(0, 6))).toEqual([]);
    expect(report.count).toBeGreaterThan(8);
    expect(report.fitWidth).toBe(false);
    expect(report.slack).toBe(1);
    expect(report.edge).toBe(null);
    expect(report.voidPx).toEqual([0x1a, 0x1c, 0x2c]);
    expect(report.cssH).toBeLessThanOrEqual(report.H - 112 + 1);
    expect(report.topGap).toBeLessThanOrEqual(2);
    expect(report.smooth).toBe(false);
    expect(report.gearH).toBeGreaterThanOrEqual(44);
    expect(report.gearH).toBeLessThan(80);
    expect(report.v).toBe(2);
    expectScale(report, report.W, report.H);
  }

  const wide = await page.evaluate(async () => {
    PixelPets.goto('rx_f4', 6, 10, 'down');
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const info = PixelPets.mapInfo;
    const wrap = document.querySelector('#mapWrap').getBoundingClientRect();
    const mc = document.querySelector('#mapCanvas');
    const t = document.querySelector('#toast');
    if (t) t.classList.remove('show');
    return { id: info.id, w: info.w, h: info.h, scale: info.scale, base: info.baseScale, fit: info.fitWidth, slack: info.slack, edge: info.edge, W: wrap.width, css: mc.getBoundingClientRect().width };
  });
  expect(wide.fit).toBe(true);
  expect(wide.slack).toBe(0);
  expect(wide.edge).toBe(null);
  expect(wide.scale).toBeCloseTo(wide.W / (wide.w * 16), 4);
  expect(wide.css).toBeCloseTo(wide.W, 0);
});

test('Your Room at 320 stays scale 2 so the left buttons clear the bed', async ({ page }) => {
  test.skip(page.viewportSize().width !== 320, '320 only');
  await installSave(page.context(), zoomSave(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForFunction(() => document.querySelector('#mapCanvas').width > 0);
  const report = await page.evaluate(async () => {
    PixelPets.goto('hc_apt_in');
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    if (PixelPets.scene) PixelPets.endScene();
    const info = PixelPets.mapInfo;
    const mc = document.querySelector('#mapCanvas');
    const cam = PixelPets.walk.cam;
    const r = mc.getBoundingClientRect();
    const s = r.width / mc.width;
    const tile = (tx, ty) => ({
      left: r.left + (tx * 16 - cam.x) * s,
      top: r.top + (ty * 16 - cam.y) * s,
      right: r.left + ((tx + 1) * 16 - cam.x) * s,
      bottom: r.top + ((ty + 1) * 16 - cam.y) * s,
    });
    const col = document.querySelector('#fcTL').getBoundingClientRect();
    const bed = tile(1, 2);
    const wall = tile(0, 0);
    const hit = (a, b) => a.left < b.right - 0.5 && a.right > b.left + 0.5 && a.top < b.bottom - 0.5 && a.bottom > b.top + 0.5;
    return {
      id: info.id, scale: info.scale, base: info.baseScale, slack: info.slack, v: PixelPets.state.v,
      bedClear: !hit(bed, col),
      wallClear: wall.left >= col.right - 0.5,
      bedLeft: bed.left, wallLeft: wall.left, colRight: col.right, colH: col.height,
    };
  });
  expect(report.id).toBe('hc_apt_in');
  expect(report.scale).toBe(2);
  expect(report.scale).toBeGreaterThanOrEqual(report.base);
  expect(report.bedClear).toBe(true);
  expect(report.wallClear).toBe(true);
  expect(report.bedLeft).toBeGreaterThan(report.colRight - 1);
  expect(report.colH).toBeGreaterThanOrEqual(44);
  expect(report.v).toBe(2);
});
