/* Walk cadence (QA Oct 23 walk_smooth): a held walk moves the same distance every frame and takes STEP_MS per tile.
   The old code dropped each step's overshoot, so one frame per tile moved ~0.3 px and a tile took 183 ms (200 ms at 30 fps).
   requestAnimationFrame runs on a manual clock here (fixed dt), so the numbers don't depend on the machine.
   Also: the camera follows the keeper's drawn whole-pixel spot, so the keeper never wobbles 1 px against the screen. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

async function boot(page) {
  await page.context().addInitScript(() => {
    const real = window.requestAnimationFrame.bind(window);
    let manual = false, q = [], id = 1e6, clock = 0;
    window.requestAnimationFrame = cb => manual ? (q.push(cb), ++id) : real(cb);
    window.__raf = {
      start() { manual = true; clock = performance.now() + 50; },
      pump(n, dt) {
        const rows = [];
        for (let i = 0; i < n; i++) {
          clock += dt; const cbs = q; q = []; for (const cb of cbs) cb(clock);
          const k = PixelPets.keeper, c = PixelPets.walk.cam;
          rows.push({ fx: k.fx, fy: k.fy, mv: k.moving, steps: PixelPets.state.steps, cx: c.x, cy: c.y });
        }
        return rows;
      },
    };
  });
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForTimeout(300);
  await page.evaluate(() => window.__raf.start());
  await page.waitForTimeout(100);   // the real rAF callbacks already queued run once, then re-queue on the manual clock
}

// Holds each key in turn for its ms; returns every frame's sample.
async function walk(page, fps, plan) {
  const dt = 1000 / fps, rows = [];
  rows.push(...await page.evaluate(([n, d]) => window.__raf.pump(n, d), [Math.round(fps / 5), dt]));
  for (const [key, ms] of plan) {
    await page.keyboard.down(key);
    rows.push(...await page.evaluate(([n, d]) => window.__raf.pump(n, d), [Math.round(ms * fps / 1000), dt]));
    await page.keyboard.up(key);
  }
  rows.push(...await page.evaluate(([n, d]) => window.__raf.pump(n, d), [Math.round(fps / 3), dt]));
  return rows;
}

function check(rows, fps, label) {
  const dt = 1000 / fps, px = [];
  let tiles = 0;
  for (let i = 1; i < rows.length; i++) {
    const a = rows[i - 1], b = rows[i];
    const ds = b.steps - a.steps;
    expect(ds, label + ': at most one tile arrival per frame').toBeLessThanOrEqual(1);
    tiles += ds;
    // continuous walking: moving on the frames before and after (leaves out the first frame and the stop)
    if (a.mv && b.mv && rows[i + 1] && rows[i + 1].mv) px.push((Math.abs(b.fx - a.fx) + Math.abs(b.fy - a.fy)) * 16);
  }
  const sorted = px.slice().sort((x, y) => x - y), med = sorted[sorted.length >> 1];
  const mean = px.reduce((s, v) => s + v, 0) / px.length, tileMs = 16 * dt / mean;
  expect(px.length, label + ': walked').toBeGreaterThan(40);
  expect(sorted[0], label + ': slowest frame ' + sorted[0].toFixed(3) + ' px vs median ' + med.toFixed(3)).toBeGreaterThan(0.9 * med);
  expect(Math.abs(tileMs - 170), label + ': ms per tile ' + tileMs.toFixed(2)).toBeLessThan(3);
  // each arrival fires once: the step count went up by exactly the tiles walked
  // (the walk starts and ends on a tile, so the grid distance travelled is a whole number of tiles)
  let dist = 0;
  for (let i = 1; i < rows.length; i++) dist += Math.abs(rows[i].fx - rows[i - 1].fx) + Math.abs(rows[i].fy - rows[i - 1].fy);
  const last = rows[rows.length - 1];
  expect(Number.isInteger(last.fx) && Number.isInteger(last.fy) && !last.mv, label + ': stopped on a tile').toBe(true);
  expect(tiles, label + ': one arrival per tile').toBe(Math.round(dist));
  expect(Math.abs(dist - Math.round(dist))).toBeLessThan(1e-6);
  // camera wobble: while the camera follows on an axis, the keeper's drawn spot on that axis never changes
  for (const ax of ['x', 'y']) {
    const spots = new Set();
    for (let i = 1; i < rows.length; i++) {
      const a = rows[i - 1], b = rows[i], c = 'c' + ax, f = 'f' + ax;
      if (b.mv && a[c] !== b[c] && a[c] > 0 && b[c] > 0) spots.add(Math.round(b[f] * 16 - b[c]));
    }
    expect(spots.size, label + ': keeper screen ' + ax + ' while the camera follows: ' + [...spots].join(',')).toBeLessThanOrEqual(1);
  }
  return { tiles, tileMs, min: sorted[0], med };
}

for (const fps of [60, 30]) {
  test(`held walk keeps an even cadence at ${fps} fps (straight and with turns)`, async ({ page }) => {
    await boot(page);
    await page.evaluate(() => PixelPets.goto('hearthmoor', 1, 8, 'right'));
    const straight = check(await walk(page, fps, [['ArrowRight', 1800]]), fps, 'straight');
    expect(straight.tiles).toBeGreaterThanOrEqual(8);
    await page.evaluate(() => PixelPets.goto('hearthmoor', 9, 8, 'up'));
    const turns = check(await walk(page, fps, [['ArrowUp', 400], ['ArrowLeft', 400], ['ArrowDown', 600], ['ArrowRight', 400], ['ArrowUp', 400]]), fps, 'turns');
    expect(turns.tiles).toBeGreaterThanOrEqual(8);
    expect(await page.evaluate(() => [PixelPets.state.v, JSON.parse(localStorage.getItem('pixelpets.save.v2')).v])).toEqual([2, 2]);
  });
}
