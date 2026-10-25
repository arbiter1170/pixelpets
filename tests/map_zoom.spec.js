/* Map zoom slider (Settings). Steps are the crisp scales on this phone between 2x and 3x that keep 7 x 8.5 tiles
   in the map rect (D787 C); 2x is today's look.
   Every step keeps Hearthmoor's north exit row (tiles 8-10, y=2) clear of the top chips, and the town square
   spawn never shows the void past the left map edge. Save stays pixelpets.save.v2, settings.mapZoom is additive. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

function save() {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.follower = false;
  s.settings.tips = false;
  s.settings.textSpeed = 'fast';
  s.flags['story.phone_got'] = true;
  s.flags['story.early_done'] = true;
  s.flags['story.tutorial_done'] = true;
  s.money = 40;
  return s;
}

async function boot(page, sv, search = '?debug=1') {
  await installSave(page.context(), sv || save(), { quietDay: true });
  await gotoGame(page, search);
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForFunction(() => document.querySelector('#mapCanvas').width > 0);
}

async function openSettings(page) {
  const gear = page.locator('#gearFloat');
  if (await gear.isVisible()) await gear.click();
  else await page.locator('#settingsBtn').click();
  await expect(page.locator('#ovSettings')).toBeVisible();
}

// Move the slider the way a finger would: set the stop and fire input + change.
async function pickStep(page, i) {
  await page.evaluate((i) => {
    const el = document.querySelector('#setZoomRange');
    el.value = String(i);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, i);
}

// D787 C: a step stays only while #mapWrap shows 7 x 8.5 tiles (112 x 136 art px). The crisp candidates are
// 2, 2.5, 3 at DPR 2 and 2, 7/3, 8/3, 3 at DPR 3. At 320 x 568, 3x drops (106.7 px across), so 2.5x is the top.
const EXPECT_STEPS = { 320: [2, 2.5], 375: [2, 2.5, 3], 390: [2, 7 / 3, 8 / 3, 3] };
function expectedSteps(page) { return EXPECT_STEPS[page.viewportSize().width]; }
function label(z) { return (Math.abs(z - Math.round(z)) < 1e-6 ? String(Math.round(z)) : String(+z.toFixed(2))) + 'x'; }

async function settle(page) {
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
}

test('Map zoom slider: 44 px targets, 2x default, live apply, stored as a number in save v2', async ({ page }) => {
  const old = save();
  delete old.settings.mapZoom;
  old.settings.mapSize = 'big';           // a PR #180 save: BIG must not change the zoom
  await boot(page, old);
  const base = await page.evaluate(() => ({ scale: PixelPets.mapInfo.scale, base: PixelPets.mapInfo.baseScale, z: PixelPets.state.settings.mapZoom }));
  expect(base.z).toBe(2);
  expect(base.scale).toBe(2);   // 2x is the live look at 320, 375 and 390

  await openSettings(page);
  const row = page.locator('#setZoom');
  const range = page.locator('#setZoomRange');
  await expect(row).toBeVisible();
  await expect(range).toBeVisible();
  await expect(page.locator('#setZoom .set-lab')).toHaveText('Map zoom');
  await expect(page.locator('#setZoomVal')).toHaveText('2x');
  const geo = await page.evaluate(() => {
    const el = document.querySelector('#setZoomRange');
    const r = el.getBoundingClientRect();
    const max = +el.max, v = +el.value;
    // The thumb is 44 x 44 css px (style.css .set-zoom). Its centre slides from left+22 to right-22.
    const cx = r.left + 22 + (r.width - 44) * (max ? v / max : 0), cy = r.top + r.height / 2;
    const hit = document.elementFromPoint(cx, cy);
    const mid = document.elementFromPoint(r.left + r.width / 2, cy);
    const thumb = getComputedStyle(el, '::-webkit-slider-thumb');
    const row = document.querySelector('#setZoom').getBoundingClientRect();
    return { w: r.width, h: r.height, left: r.left, right: r.right, vw: innerWidth, rowH: row.height,
      thumbHit: hit === el, midHit: mid === el, thumbW: parseFloat(thumb.width), thumbH: parseFloat(thumb.height), max };
  });
  expect(geo.h).toBeGreaterThanOrEqual(44);
  expect(geo.w).toBeGreaterThanOrEqual(88);
  expect(geo.rowH).toBeGreaterThanOrEqual(44);
  expect(geo.left).toBeGreaterThanOrEqual(0);
  expect(geo.right).toBeLessThanOrEqual(geo.vw);
  expect(geo.thumbHit, 'thumb centre hits the slider').toBe(true);
  expect(geo.midHit, 'track hits the slider').toBe(true);
  if (geo.thumbW) { expect(geo.thumbW).toBeGreaterThanOrEqual(44); expect(geo.thumbH).toBeGreaterThanOrEqual(44); }
  const want = expectedSteps(page);
  expect(geo.max).toBe(want.length - 1);

  const steps = await page.evaluate(() => PixelPets.mapZoomSteps);
  expect(steps.length).toBe(want.length);
  steps.forEach((z, i) => expect(z, 'step ' + i).toBeCloseTo(want[i], 6));
  const top = want[want.length - 1];
  const dpr = await page.evaluate(() => devicePixelRatio);
  for (const z of steps) expect(Math.abs(z * dpr - Math.round(z * dpr)), 'crisp step ' + z).toBeLessThan(1e-6);

  // A real tap near the right end of the track moves to the top step, live.
  const box = await range.boundingBox();
  await page.mouse.click(box.x + box.width - 6, box.y + box.height / 2);
  await expect(page.locator('#setZoomVal')).toHaveText(label(top));
  const live = await page.evaluate(() => ({ scale: PixelPets.mapInfo.scale, z: PixelPets.state.settings.mapZoom }));
  expect(live.z).toBeCloseTo(top, 6);
  expect(live.scale).toBeCloseTo(top, 6);

  await pickStep(page, 1);
  const mid = await page.evaluate(() => ({ scale: PixelPets.mapInfo.scale, z: PixelPets.state.settings.mapZoom, label: document.querySelector('#setZoomVal').textContent }));
  expect(mid.z).toBe(steps[1]);
  expect(mid.scale).toBe(steps[1]);
  expect(mid.label).toMatch(/^2\.\d+x$/);

  const raw = JSON.parse(await page.evaluate(() => localStorage.getItem('pixelpets.save.v2')));
  expect(raw.v).toBe(2);
  expect(typeof raw.settings.mapZoom).toBe('number');
  expect(raw.settings.mapZoom).toBe(steps[1]);

  // Reload keeps the step (re-install what was written, since the boot init script runs on every load).
  await installSave(page.context(), raw, { quietDay: true });
  await page.goto('/?debug=1', { waitUntil: 'commit' });
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForFunction(() => document.querySelector('#mapCanvas').width > 0);
  const kept = await page.evaluate(() => ({ scale: PixelPets.mapInfo.scale, z: PixelPets.state.settings.mapZoom, v: PixelPets.state.v }));
  expect(kept.v).toBe(2);
  expect(kept.z).toBe(steps[1]);
  expect(kept.scale).toBe(steps[1]);

  // Rooms keep their own zoom at every step.
  const room = await page.evaluate(async () => { PixelPets.goto('hm_lodge_in'); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); return PixelPets.mapInfo; });
  expect(room.room).toBe(true);
  expect(room.scale).toBeLessThan(steps[1] + 2);
});

test('Map zoom: a bad or missing mapZoom reads as 2x', async ({ page }) => {
  const s = save();
  s.settings.mapZoom = 'big';
  await boot(page, s);
  const r = await page.evaluate(() => ({ z: PixelPets.state.settings.mapZoom, scale: PixelPets.mapInfo.scale, base: PixelPets.mapInfo.baseScale }));
  expect(r.z).toBe(2);
  expect(r.scale).toBe(2);
});

test('Map zoom: a saved 3x snaps to the top step that keeps 7 x 8.5 tiles (2.5x at 320)', async ({ page }) => {
  const s = save();
  s.settings.mapZoom = 3;
  await boot(page, s);
  const want = expectedSteps(page), top = want[want.length - 1];
  const r = await page.evaluate(() => {
    const w = document.querySelector('#mapWrap'), i = PixelPets.mapInfo;
    return { scale: i.scale, step: PixelPets.mapZoomStep, W: w.clientWidth, H: w.clientHeight };
  });
  expect(r.step).toBeCloseTo(top, 6);
  expect(r.scale).toBeCloseTo(top, 6);
  expect(r.W / r.scale).toBeGreaterThanOrEqual(112);
  expect(r.H / r.scale).toBeGreaterThanOrEqual(136);
  if (page.viewportSize().width === 320) expect(r.scale).toBe(2.5);
  await openSettings(page);
  await expect(page.locator('#setZoom')).toBeVisible();
  await expect(page.locator('#setZoomVal')).toHaveText(label(top));
});

test('Map zoom: with only 2x left the Settings row hides, and it comes back when the map rect grows', async ({ page }) => {
  await boot(page);
  const vp = page.viewportSize();
  // 220 css px across: 220 / 2.33 and 220 / 2.5 are under 112 art px, so only 2x is left.
  await page.setViewportSize({ width: 220, height: vp.height });
  await page.waitForFunction(() => PixelPets.mapZoomSteps.length === 1);
  await openSettings(page);
  await expect(page.locator('#setZoom')).toBeHidden();
  await expect(page.locator('#setZoomRange')).toBeHidden();
  await page.setViewportSize(vp);
  await page.waitForFunction((n) => PixelPets.mapZoomSteps.length === n, expectedSteps(page).length);
  await expect(page.locator('#setZoom')).toBeVisible();
  await expect(page.locator('#setZoomRange')).toBeVisible();
});

test('Map zoom row: the label lines up with the other rows and no thumb position touches the label or the value', async ({ page }) => {
  await boot(page);
  await openSettings(page);
  await expect(page.locator('#setZoom')).toBeVisible();
  await page.locator('#setZoom').scrollIntoViewIfNeeded();
  const n = expectedSteps(page).length;
  for (let i = 0; i < n; i++) {
    await pickStep(page, i);
    const g = await page.evaluate(() => {
      const el = document.querySelector('#setZoomRange'), r = el.getBoundingClientRect(), max = +el.max, v = +el.value;
      const lab = document.querySelector('#setZoom .set-lab').getBoundingClientRect(), val = document.querySelector('#setZoomVal').getBoundingClientRect();
      const row = document.querySelector('#setZoom').getBoundingClientRect();
      const ctl = document.querySelector('#setControls .set-lab').getBoundingClientRect();
      const tl = r.left + (r.width - 44) * (max ? v / max : 0);
      return { tl, tr: tl + 44, labL: lab.left, labR: lab.right, labY: lab.top + lab.height / 2, valL: val.left, valR: val.right, valY: val.top + val.height / 2,
        midY: r.top + r.height / 2, rowR: row.right, ctlL: ctl.left, rangeW: r.width };
    });
    expect(Math.abs(g.labL - g.ctlL), 'label left edge matches Controls').toBeLessThanOrEqual(0.5);
    expect(Math.abs(g.labY - g.midY), 'label centred on the slider').toBeLessThanOrEqual(1);
    expect(Math.abs(g.valY - g.midY), 'value centred on the slider').toBeLessThanOrEqual(1);
    expect(g.tl - g.labR, 'step ' + i + ' thumb clear of the label').toBeGreaterThanOrEqual(8);
    expect(g.valL - g.tr, 'step ' + i + ' thumb clear of the value').toBeGreaterThanOrEqual(8);
    expect(g.valR, 'value inside the row').toBeLessThanOrEqual(g.rowR - 3);
    expect(g.rangeW).toBeGreaterThanOrEqual(88);
  }
});

test('D787: pads are the HUD overlap with the visible canvas; hidden HUD pads 0 and the north lift is off', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => { PixelPets.goto('hearthmoor', 9, 8, 'up'); if (PixelPets.scene) PixelPets.endScene(); });
  await settle(page);
  const on = await page.evaluate(() => {
    const i = PixelPets.mapInfo, cr = document.querySelector('#mapCanvas').getBoundingClientRect();
    const fcTop = document.querySelector('#fcTop').getBoundingClientRect();
    return { pads: i.pads, band: i.band, camY: PixelPets.walk.cam.y, chipBottom: fcTop.bottom - cr.top };
  });
  expect(on.pads.on).toBe(true);
  // Today's HUD sits over the canvas, so the top pad is that overlap plus the 6 px gap, and the lift runs.
  expect(on.pads.top).toBe(Math.ceil(on.chipBottom + 6));
  expect(on.band.topPad).toBeGreaterThan(0);
  // Hide every HUD rect over the map: each pad reads 0, and with no top pad there is no north lift.
  await page.evaluate(() => {
    for (const q of ['#fcTop', '#fcTL', '#fcClock', '#fcTip', '#floatCtl .fc-bottom']) { const n = document.querySelector(q); if (n) n.style.visibility = 'hidden'; }
    window.dispatchEvent(new Event('resize'));
  });
  await settle(page);
  const off = await page.evaluate(() => {
    const i = PixelPets.mapInfo, mc = document.querySelector('#mapCanvas');
    return { pads: i.pads, band: i.band, camY: PixelPets.walk.cam.y, py: Math.round(PixelPets.walk.fy * 16), VH: mc.height, MH: i.h,
      vis: ['#fcTop', '#fcTL'].map(q => { const n = document.querySelector(q); return n ? n.checkVisibility({ visibilityProperty: true }) : false; }) };
  });
  expect(off.vis).toEqual([false, false]);
  expect(off.pads).toEqual({ on: true, top: 0, left: 0, right: 0, bottom: 0, col: 0 });
  expect(off.band.topPad).toBe(0);
  expect(off.band.hudPad).toBe(0);
  // Plain follow, no lift: the holder is centred in the full canvas, clamped to the map.
  const follow = Math.round(Math.min(Math.max(off.py + 8 - off.VH / 2, 0), off.MH * 16 - off.VH));
  expect(off.camY + 0).toBe(follow + 0);   // + 0 folds a -0 from Math.round into 0
});

test('Map zoom: every step keeps the Hearthmoor north exit row clear of the top chips', async ({ page }) => {
  test.setTimeout(90000);
  await boot(page);
  const steps = await page.evaluate(() => PixelPets.mapZoomSteps);
  for (let i = 0; i < steps.length; i++) {
    await pickStep(page, i);
    await page.evaluate(() => { PixelPets.goto('hearthmoor', 9, 8, 'up'); if (PixelPets.scene) PixelPets.endScene(); const t = document.querySelector('#toast'); if (t) t.classList.remove('show'); });
    await settle(page);
    const r = await page.evaluate(() => {
      const mc = document.querySelector('#mapCanvas'), cr = mc.getBoundingClientRect(), cam = PixelPets.walk.cam, k = cr.width / mc.width;
      const chips = ['#fcTop', '#fcTL'].map(q => document.querySelector(q)).filter(Boolean).map(n => n.getBoundingClientRect()).filter(b => b.width >= 8 && b.height >= 8);
      const out = [];
      for (const tx of [8, 9, 10]) {
        const t = { left: cr.left + (tx * 16 - cam.x) * k, top: cr.top + (2 * 16 - cam.y) * k };
        t.right = t.left + 16 * k; t.bottom = t.top + 16 * k;
        const area = chips.reduce((a, b) => a + Math.max(0, Math.min(t.right, b.right) - Math.max(t.left, b.left)) * Math.max(0, Math.min(t.bottom, b.bottom) - Math.max(t.top, b.top)), 0);
        const pts = [[(t.left + t.right) / 2, (t.top + t.bottom) / 2], [t.left + 3, t.top + 3], [t.right - 3, t.top + 3]];
        const hits = pts.map(([x, y]) => document.elementFromPoint(x, y) === mc);
        const onScreen = t.top >= cr.top - 0.5 && t.bottom <= innerHeight && t.left >= 0 && t.right <= innerWidth;
        out.push({ tx, area, hits, onScreen });
      }
      return { scale: PixelPets.mapInfo.scale, chips: chips.length, out };
    });
    expect(r.scale, 'step ' + steps[i]).toBe(steps[i]);   // step 0 is 2x, the live look
    expect(r.chips).toBeGreaterThanOrEqual(2);
    for (const e of r.out) {
      expect(e.onScreen, `step ${steps[i]} tile ${e.tx},2 on screen`).toBe(true);
      expect(e.area, `step ${steps[i]} tile ${e.tx},2 under a chip`).toBe(0);
      expect(e.hits, `step ${steps[i]} tile ${e.tx},2 elementFromPoint`).toEqual([true, true, true]);
    }
  }
});

test('Map zoom: the town square spawn never shows the void past the left map edge', async ({ page }) => {
  test.setTimeout(90000);
  await boot(page);
  const steps = await page.evaluate(() => PixelPets.mapZoomSteps);
  for (let i = 0; i < steps.length; i++) {
    await pickStep(page, i);
    await page.evaluate(() => { PixelPets.goto('hearthmoor'); if (PixelPets.scene) PixelPets.endScene(); });
    await settle(page);
    const r = await page.evaluate(() => {
      const mc = document.querySelector('#mapCanvas'), cr = mc.getBoundingClientRect(), wr = document.querySelector('#mapWrap').getBoundingClientRect();
      const cam = PixelPets.walk.cam, k = cr.width / mc.width, info = PixelPets.mapInfo;
      const mapLeft = cr.left - cam.x * k, mapRight = mapLeft + info.w * 16 * k;
      const viewL = Math.max(cr.left, wr.left), viewR = Math.min(cr.right, wr.right);
      return { camX: cam.x, wide: info.w * 16 > mc.width, mapLeft, mapRight, viewL, viewR, x: PixelPets.walk.fx, map: info.id };
    });
    expect(r.map).toBe('hearthmoor');
    expect(r.x).toBeLessThanOrEqual(4);   // the spawn sits by the west edge (outside Your Home)
    if (r.wide) {
      expect(r.camX, 'step ' + steps[i]).toBeGreaterThanOrEqual(0);
      expect(r.mapLeft, 'step ' + steps[i] + ' left void').toBeLessThanOrEqual(r.viewL + 0.5);
    } else {
      expect(Math.abs((r.mapLeft - r.viewL) - (r.viewR - r.mapRight)), 'narrow map is centred').toBeLessThanOrEqual(1);
    }
  }
});
