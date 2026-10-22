/* POLISH_BUILD2 P1 (D435, D436). Modern rail chips at 320, 375 and 390.
   Holder stands at (12, 27) on Hearthmoor. cueLayout forces the main, tracked and slip tiles. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const LIME = [167, 240, 112];
const INK = [26, 28, 44];
const HUD = '#floatCtl button, #clockChip, #envBadge, #fcAcorns, #walkTip, #petStrip';
const CASES = {
  north: { main: { x: 11, y: 0 }, side: { x: 12, y: 0 }, board: { x: 13, y: 0 }, n: 3 },
  same_tile: { main: { x: 11, y: 0 }, side: { x: 11, y: 0 }, board: null, n: 2 },
  ne_corner: { main: { x: 23, y: 1 }, side: { x: 22, y: 0 }, board: { x: 23, y: 0 }, n: 3 },
  west: { main: { x: 0, y: 26 }, side: { x: 0, y: 27 }, board: { x: 0, y: 25 }, n: 3 },
  east: { main: { x: 23, y: 26 }, side: { x: 23, y: 27 }, board: { x: 23, y: 25 }, n: 3 },
  apart: { main: { x: 12, y: 0 }, side: { x: 0, y: 27 }, board: { x: 23, y: 27 }, n: 3 },
};

function modernSave() {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.follower = false;
  return s;
}

async function boot(page) {
  await installSave(page.context(), modernSave(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.evaluate(() => {
    PixelPets.showTab('walk');
    PixelPets.goto('hearthmoor', 12, 27, 'down');
  });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function layout(page, spec, mainTracked) {
  await page.evaluate(({ spec, mainTracked }) => {
    PixelPets.cueLayout({ main: spec.main, side: spec.side, board: spec.board, mainTracked: !!mainTracked });
  }, { spec, mainTracked });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function readChips(page) {
  return page.evaluate((hud) => {
    const chips = PixelPets.cueChips() || [];
    const c = document.querySelector('#mapCanvas');
    const r = c.getBoundingClientRect();
    const k = r.width / c.width;
    const g = c.getContext('2d');
    const hudRects = [...document.querySelectorAll(hud)].filter(e => !e.hidden && e.offsetParent).map(e => {
      const b = e.getBoundingClientRect();
      return [e.id || e.className, b.left, b.top, b.right, b.bottom];
    });
    const eq = (px, rgb) => px[0] === rgb[0] && px[1] === rgb[1] && px[2] === rgb[2];
    const out = chips.map(ch => {
      const L = r.left + (ch.x - 8) * k, T = r.top + (ch.y - 8) * k, R = r.left + (ch.x + 9) * k, B = r.top + (ch.y + 17) * k;
      const pts = [[ch.x, ch.y], [ch.x - 7, ch.y - 7], [ch.x + 7, ch.y - 7], [ch.x - 7, ch.y + 7], [ch.x + 7, ch.y + 7], [ch.x, ch.y + 13]];
      const hits = pts.map(([x, y]) => {
        let el = document.elementFromPoint(r.left + x * k, r.top + y * k);
        while (el && !el.id) el = el.parentElement;
        return el ? el.id : null;
      });
      const gaps = hudRects.map(([id, l, t, rr, b]) => {
        const dx = Math.max(l - R, 0, L - rr), dy = Math.max(t - B, 0, T - b);
        return { id, gap: Math.round(dx + dy > 0 ? Math.hypot(dx, dy) : 0) };
      }).sort((a, b) => a.gap - b.gap);
      const fill = g.getImageData(ch.x - 5, ch.y, 1, 1).data;
      const rim = g.getImageData(ch.x + 8, ch.y, 1, 1).data;
      return {
        x: ch.x, y: ch.y, tracked: !!ch.tracked, hits, nearest: gaps[0] || null,
        lime: eq(fill, [167, 240, 112]), inkRim: eq(rim, [26, 28, 44]),
        rim: rim[0] + ',' + rim[1] + ',' + rim[2],
        css: [Math.round(L), Math.round(T), Math.round(R), Math.round(B)],
      };
    });
    let minGap = null;
    for (let i = 0; i < out.length; i++) for (let j = i + 1; j < out.length; j++) {
      const [l1, t1, r1, b1] = out[i].css, [l2, t2, r2, b2] = out[j].css;
      const dx = Math.max(l2 - r1, l1 - r2), dy = Math.max(t2 - b1, t1 - b2);
      const gap = Math.max(dx, dy);
      if (minGap == null || gap < minGap) minGap = gap;
    }
    return { chips: out, minGap, v: PixelPets.state.v };
  }, HUD);
}

test('main, tracked and slip chips clear each other and the HUD', async ({ page }) => {
  await boot(page);
  // One-digit and two-digit hours change the clock pill width. Both have to clear (D435).
  for (const clock of [['thu', 9, 30], ['wed', 10, 30]]) {
    await page.evaluate((c) => PixelPets.clock.set(c[0], c[1], c[2]), clock);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const label = await page.locator('#clockLabel').textContent();
    for (const [name, spec] of Object.entries(CASES)) {
      await layout(page, spec, false);
      const got = await readChips(page);
      const tag = label + ' ' + name;
      expect(got.v, tag).toBe(2);
      expect(got.chips.length, tag).toBe(spec.n);
      const tracked = got.chips.filter(c => c.tracked);
      expect(tracked.length, tag + ' tracked').toBe(1);
      expect(tracked[0].lime, tag + ' PAL l').toBe(true);
      for (const ch of got.chips) {
        expect(ch.hits, tag + ' hits').toEqual(['mapCanvas', 'mapCanvas', 'mapCanvas', 'mapCanvas', 'mapCanvas', 'mapCanvas']);
        expect(ch.nearest && ch.nearest.gap, tag + ' HUD ' + (ch.nearest && ch.nearest.id)).toBeGreaterThanOrEqual(6);
      }
      if (got.chips.length > 1) expect(got.minGap, tag + ' chip gap').toBeGreaterThanOrEqual(1);
    }
  }
});

test('a tracked main story is lime and draws no side cue', async ({ page }) => {
  await boot(page);
  await layout(page, { main: { x: 11, y: 0 }, side: null, board: null }, true);
  const got = await readChips(page);
  expect(got.chips.length).toBe(1);
  expect(got.chips[0].tracked).toBe(true);
  expect(got.chips[0].lime).toBe(true);
  expect(got.chips[0].hits.every(id => id === 'mapCanvas')).toBe(true);
  expect(got.v).toBe(2);
});

test('reduced motion keeps the tracked rim steady', async ({ page }) => {
  await boot(page);
  await layout(page, CASES.west, false);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const seen = new Set();
  const t0 = Date.now();
  while (Date.now() - t0 < 1400) {
    const got = await readChips(page);
    const rim = got.chips.find(c => c.tracked);
    expect(rim, 'tracked chip').toBeTruthy();
    expect(rim.inkRim, 'rim ' + rim.rim).toBe(true);
    seen.add(rim.rim);
    await page.waitForTimeout(70);
  }
  expect(seen.size, [...seen].join(' | ')).toBe(1);
  expect([...seen][0]).toBe(INK.join(','));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
});
