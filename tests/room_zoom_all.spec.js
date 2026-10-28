/* ROOM_ZOOM: every interior, not only the three Hearthmoor houses. Modern, 320 / 375 / 390. */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const { starterSave, installSave, trackErrors, gotoGame, shot } = require('./helpers');

trackErrors(test, expect);

function zoomSave() {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.follower = false;
  s.settings.tips = false;
  s.flags['story.unlock_phone'] = true;
  s.flags['story.phone_got'] = true;
  s.flags['story.early_done'] = true;
  s.flags['story.tutorial_done'] = true;
  return s;
}

test('every interior uses the room scale, and every door can be framed', async ({ page }) => {
  test.setTimeout(90000);
  await installSave(page.context(), zoomSave(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForFunction(() => document.querySelector('#mapCanvas').width > 0);
  // D787 A/B pads are gated off until MHC P1; this check covers the padded camera, so force them on.
  expect(await page.evaluate(() => PixelPets.setHudPads(true))).toBe(true);

  const report = await page.evaluate(async () => {
    const camAt = (tx, ty, mapW, mapH, VW, VH, fit) => {
      if (fit) {
        const px = tx * 16, py = ty * 16;
        const x = mapW <= VW ? -Math.floor((VW - mapW) / 2) : Math.round(Math.min(Math.max(px + 8 - VW / 2, 0), mapW - VW));
        const y = mapH <= VH ? -Math.floor((VH - mapH) / 2) : Math.round(Math.min(Math.max(py + 8 - VH / 2, 0), mapH - VH));
        return { x, y };
      }
      const c = document.querySelector('#mapCanvas');
      const cr = c.getBoundingClientRect(), wrap = document.querySelector('#mapWrap').getBoundingClientRect();
      const z = cr.width / VW;
      const GAP = 6;
      // D787 A: a pad is a HUD rect's overlap with the visible canvas (plus the gap); a hidden HUD, or one that misses
      // the canvas, pads 0, with no 56 / 112 floor. Under the MODERN_HUD_CLEAR dock (#199/#200) nothing sits over the
      // map, so every pad is 0 (D785) and a room is centred in the wrap.
      const vis = { left: Math.max(cr.left, wrap.left), top: Math.max(cr.top, wrap.top), right: Math.min(cr.right, wrap.right), bottom: Math.min(cr.bottom, wrap.bottom) };
      const box = sel => {
        const n = document.querySelector(sel); if (!n) return null;
        const r = n.getBoundingClientRect();
        if (!(r.width >= 8 && r.height >= 8)) return null;
        const cs = getComputedStyle(n);
        if (cs.visibility === 'hidden' || cs.display === 'none') return null;
        return r.right > vis.left && r.left < vis.right && r.bottom > vis.top && r.top < vis.bottom ? r : null;
      };
      const top = box('#fcTop'), left = box('#fcTL'), clock = box('#fcClock'), tip = box('#fcTip'), band = box('#floatCtl .fc-bottom');
      const pad = v => Math.max(0, Math.ceil(v));
      const ox = cr.left - wrap.left, oy = cr.top - wrap.top;
      const padT = oy + (top ? pad(Math.min(top.bottom, vis.bottom) - cr.top + GAP) : 0);
      const padL = left ? pad(Math.min(left.right, vis.right) - cr.left + GAP) : 0;
      const padR = clock ? pad(cr.right - Math.max(clock.left, vis.left) + GAP) : 0;
      const col = left ? oy + pad(Math.min(left.bottom, vis.bottom) - cr.top + GAP) : padT;
      const tops = [tip, band].filter(Boolean).map(r => r.top);
      const bot = Math.max(0, wrap.bottom - cr.bottom) + (tops.length ? pad(cr.bottom - Math.max(Math.min.apply(null, tops), vis.top) + GAP) : 0);
      const H = wrap.height, mapCssH = mapH * z, mapCssW = mapW * z, canvasCssH = VH * z, canvasCssW = VW * z;
      let x;
      if (mapCssW <= canvasCssW + 0.5) x = -Math.floor((VW - mapW) / 2);
      else {
        const aL = Math.ceil(padL / z), aR = Math.ceil(padR / z);
        const xMid = aL + (VW - aL - aR) / 2;
        const lo = -aL, hi = mapW - VW + aR;
        x = Math.round(Math.min(Math.max(tx * 16 + 8 - xMid, Math.min(lo, hi)), Math.max(lo, hi)));
      }
      let y;
      if (mapCssH <= canvasCssH + 0.5 && mapCssH <= H - bot - padT + 0.5) {
        let yCss = (H - bot - mapCssH >= col) ? col + Math.floor((H - bot - col - mapCssH) / 2) : Math.max(padT, H - bot - mapCssH);
        const canvasBottom = oy + canvasCssH;
        if (yCss + mapCssH > canvasBottom) yCss = Math.max(padT, canvasBottom - mapCssH);
        if (yCss < padT) yCss = padT;
        y = -Math.round((yCss - oy) / z);
      } else {
        const topA = Math.ceil(Math.max(0, padT - oy) / z);
        const lo = -topA, hi = mapH - VH, mid = topA + (VH - topA) / 2;
        y = Math.round(Math.min(Math.max(ty * 16 + 8 - mid, Math.min(lo, hi)), Math.max(lo, hi)));
      }
      return { x, y };
    };
    const frames = (cam, o, VW, VH) => {
      const x0 = o.x * 16 - cam.x, y0 = o.y * 16 - cam.y;
      return x0 >= -0.5 && y0 >= -0.5 && x0 + 16 <= VW + 0.5 && y0 + 16 <= VH + 0.5;
    };
    const ids = PixelPets.debugCatalog().maps.slice().sort();
    const rooms = [];
    // H_eff (D232/D237) left 112 px for the modern rows over the map. Under the dock they sit outside #mapWrap: 0 (D785).
    const frame = document.body.classList.contains('mhc-frame');
    const reserve = frame ? 0 : 112;
    for (const id of ids) {
      if (!PixelPets.goto(id)) continue;
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const info = PixelPets.mapInfo;
      if (!info.room) continue;
      const mc = document.querySelector('#mapCanvas');
      const wrap = document.querySelector('#mapWrap').getBoundingClientRect();
      const cr = mc.getBoundingClientRect();
      const W = wrap.width, H = wrap.height, s = Math.max(2, Math.floor(W / 176));
      let solid = true;
      if (!info.fitWidth && info.w >= 3) {
        for (const x of [0, info.w - 1]) {
          for (let y = 0; y < info.h; y++) {
            const t = PixelPets.tileInfo(x, y);
            if (t.part || t.ch === 'Y') continue;
            solid = false;
          }
        }
      } else solid = false;
      const slack = !info.fitWidth && solid ? 1 : 0;
      const byW = Math.floor(W / ((info.w - slack) * 16));
      const byH = Math.floor((H - reserve) / (info.h * 16));
      let expected = info.fitWidth ? null : Math.max(s, Math.min(2 * s, byW, byH));
      // Your Room at 320: scale 3 covers the left buttons. The cap is 2, and never under the outdoor scale.
      if (!info.fitWidth && id === 'hc_apt_in' && window.innerWidth <= 320) expected = Math.min(expected, Math.max(s, 2));
      const VW = mc.width, VH = mc.height, mapW = info.w * 16, mapH = info.h * 16;
      const here = PixelPets.state.world;
      const pred = camAt(here.x, here.y, mapW, mapH, VW, VH, info.fitWidth);
      const live = PixelPets.walk.cam;
      // Your Room at 320 is still centred by the formula, then shifted right so the left wall clears #fcTL.
      let wantX = pred.x;
      // Under the dock the Your Room nudge is 0 (D785): #fcTL is not over the map.
      if (!frame && id === 'hc_apt_in' && window.innerWidth <= 320 && mapW <= VW) {
        const col = document.querySelector('#fcTL');
        const scale = cr.width / mc.width;
        if (col && scale > 0) {
          const wallLeft = cr.left + (0 - pred.x) * scale;
          const need = col.getBoundingClientRect().right - wallLeft;
          if (need > 0.5) wantX = pred.x - Math.ceil((need + 1) / scale);
        }
      }
      const seen = new Set();
      const q = [[here.x, here.y]];
      const open = (x, y) => {
        if (x < 0 || y < 0 || x >= info.w || y >= info.h) return false;
        const t = PixelPets.tileInfo(x, y);
        return t.walk && !t.blocked;
      };
      const reach = [];
      if (open(here.x, here.y)) {
        while (q.length) {
          const [x, y] = q.shift();
          const k = x + ',' + y;
          if (seen.has(k) || !open(x, y)) continue;
          seen.add(k); reach.push([x, y]);
          q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }
      }
      const doors = info.objs.filter(o => o.kind === 'warp' || o.kind === 'door');
      const miss = [];
      for (const o of doors) {
        let ok = frames(pred, o, VW, VH);
        if (!ok) for (const [x, y] of reach) { if (frames(camAt(x, y, mapW, mapH, VW, VH, info.fitWidth), o, VW, VH)) { ok = true; break; } }
        if (!ok) miss.push(o.id + '@' + o.x + ',' + o.y);
      }
      rooms.push({
        id, w: info.w, h: info.h, fit: info.fitWidth, slack: info.slack, slackWant: slack,
        scale: info.scale, base: info.baseScale, expected, edge: info.edge,
        W, H, cssH: Math.round(cr.height), topGap: Math.round(cr.top - wrap.top), reserve,
        underDock: frame && cr.bottom > document.querySelector('#fcDock').getBoundingClientRect().top + 1,
        camLive: live.x === wantX && live.y === pred.y,
        camDelta: live.x + ',' + live.y + ' want ' + wantX + ',' + pred.y,
        miss,
      });
    }
    return { v: PixelPets.state.v, frame, rooms };
  });

  expect(report.v).toBe(2);
  expect(report.frame).toBe(true);   // modern portrait walk runs the dock layout (D789)
  const bad = [];
  for (const row of report.rooms) {
    if (row.edge !== null) bad.push(row.id + ' edge');
    if (row.slack !== row.slackWant) bad.push(row.id + ' slack ' + row.slack + ' want ' + row.slackWant);
    if (row.fit) {
      if (Math.abs(row.scale - row.W / (row.w * 16)) > 0.02) bad.push(row.id + ' fit scale ' + row.scale);
    } else {
      if (row.scale !== row.expected) bad.push(row.id + ' scale ' + row.scale + ' want ' + row.expected);
      if (row.cssH > row.H - row.reserve + 1) bad.push(row.id + ' canvas ' + row.cssH + ' under the HUD');
      if (row.underDock) bad.push(row.id + ' canvas under the dock');
      if (row.topGap > 2) bad.push(row.id + ' top gap ' + row.topGap);
      if (!row.camLive) bad.push(row.id + ' camera ' + row.camDelta);
    }
    if (row.miss.length) bad.push(row.id + ' door ' + row.miss.join(' '));
  }
  expect(bad, bad.join('\n')).toEqual([]);
  const width = page.viewportSize().width;
  fs.writeFileSync('/tmp/room-zoom-after-' + width + '.json', JSON.stringify(report.rooms));

  const samplesOf = async (map, x, y, facing, key) => {
    await page.evaluate(({ map, x, y, facing }) => {
      PixelPets.goto(map, x, y, facing);
      if (PixelPets.scene) PixelPets.endScene();
    }, { map, x, y, facing });
    await page.evaluate(() => {
      window.__rz = [];
      window.__rzT = setInterval(() => {
        const i = PixelPets.mapInfo;
        window.__rz.push({ id: i.id, scale: i.scale, base: i.baseScale, fading: !!PixelPets.fading });
      }, 20);
    });
    await page.keyboard.press(key);
    await page.waitForFunction((from) => PixelPets.mapInfo.id !== from && !PixelPets.fading, map);
    return page.evaluate(() => { clearInterval(window.__rzT); return window.__rz; });
  };

  const stairs = await samplesOf('hm_home_in', 2, 5, 'left', 'ArrowLeft');
  const up = stairs.filter(s => s.id === 'hm_home_up');
  expect(up.length, 'stairs never arrived').toBeGreaterThan(0);
  expect(up.some(s => s.fading), 'upstairs scale waited until the fade ended').toBe(true);
  expect(up[0].scale).toBe(up[up.length - 1].scale);

  const out = await samplesOf('hm_rook_in', 3, 4, 'down', 'ArrowDown');
  const left = out.filter(s => s.id !== 'hm_rook_in');
  expect(left.length, 'the mat never left').toBeGreaterThan(0);
  expect(left.some(s => s.fading), 'outdoor scale waited until the fade ended').toBe(true);
  const fadeOut = left.find(s => s.fading);
  expect(fadeOut.scale).toBeGreaterThanOrEqual(fadeOut.base);
  const done = await page.evaluate(() => {
    const info = PixelPets.mapInfo;
    const w = document.querySelector('#mapWrap');
    // Map zoom defaults to 2x, which is today's outdoor scale.
    return Object.assign({ want: info.baseScale, wrapW: w.clientWidth }, info);
  });
  expect(done.room).toBe(false);
  expect(done.scale).toBe(2);   // modern outdoors is 2x at 320, 375 and 390, as live
  expect(fadeOut.scale).toBe(done.scale);

  if (width === 390) {
    for (const [id, name] of [['hc_airport_in', 'room-zoom-fixed-airport'], ['hm_home_in', 'room-zoom-void-home'], ['fb_hall_in', 'room-zoom-large-hall']]) {
      await page.evaluate((id) => { PixelPets.goto(id); if (PixelPets.scene) PixelPets.endScene(); const t = document.querySelector('#toast'); if (t) t.classList.remove('show'); }, id);
      await page.waitForTimeout(50);
      await shot(page, name);
    }
  }
});
