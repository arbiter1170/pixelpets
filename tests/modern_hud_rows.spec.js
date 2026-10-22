/* Modern outdoor maps keep the last walkable row above the partner strip. Arcade does not change. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const OUTDOOR = ['route1', 'route2_glen', 'cobble_quarry', 'fernbrook', 'proto', 'route2', 'cobblecrest', 'mahopac', 'fb_heights'];

function save(mode) {
  const s = starterSave();
  s.settings.controls = mode;
  s.settings.follower = false;
  s.flags['story.phone_got'] = true;
  return s;
}

async function boot(page, mode) {
  await installSave(page.context(), save(mode), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForFunction(() => document.querySelector('#mapCanvas').width > 0);
}

async function stand(page, map, x, y) {
  await page.evaluate(({ map, x, y }) => PixelPets.goto(map, x, y, 'down'), { map, x, y });
  await page.waitForTimeout(200);
}

async function hitAt(page, tx, ty) {
  return page.evaluate(({ tx, ty }) => {
    const mc = document.querySelector('#mapCanvas'), cam = PixelPets.walk.cam, r = mc.getBoundingClientRect();
    const x = r.left + ((tx * 16 + 8 - cam.x) / mc.width) * r.width;
    const y = r.top + ((ty * 16 + 8 - cam.y) / mc.height) * r.height;
    const el = document.elementFromPoint(Math.round(x), Math.round(y));
    return { id: el && el.id, tag: el && el.tagName };
  }, { tx, ty });
}

test('modern keeps hearthmoor (14, 32) on the map canvas', async ({ page }) => {
  await boot(page, 'modern');
  await stand(page, 'hearthmoor', 14, 32);
  const p = await hitAt(page, 14, 32);
  expect(p.id).toBe('mapCanvas');
});

test('modern keeps highcharity row 38 on the map canvas', async ({ page }) => {
  await boot(page, 'modern');
  const x = await page.evaluate(() => {
    PixelPets.goto('highcharity', 32, 30, 'down');
    for (let i = 0; i < PixelPets.mapInfo.w; i++) if (PixelPets.tileInfo(i, 38).walk) return i;
    return -1;
  });
  expect(x).toBeGreaterThanOrEqual(0);
  await stand(page, 'highcharity', x, 38);
  const p = await hitAt(page, x, 38);
  expect(p.id).toBe('mapCanvas');
});

test('modern keeps each outdoor map last walkable row on the canvas @w1', async ({ page }) => {
  await boot(page, 'modern');
  for (const map of OUTDOOR) {
    const spot = await page.evaluate((map) => {
      const landed = PixelPets.goto(map, null, null, 'down');
      if (!landed) return null;
      const info = PixelPets.mapInfo;
      for (let y = info.h - 1; y >= 0; y--) {
        for (let x = 0; x < info.w; x++) if (PixelPets.tileInfo(x, y).walk) return { x, y };
      }
      return null;
    }, map);
    expect(spot, map).toBeTruthy();
    await stand(page, map, spot.x, spot.y);
    const p = await hitAt(page, spot.x, spot.y);
    expect(p.id, map + ' ' + spot.x + ',' + spot.y).toBe('mapCanvas');
  }
});

test('arcade camera does not subtract the partner strip @w1', async ({ page }) => {
  await boot(page, 'arcade');
  await stand(page, 'hearthmoor', 14, 32);
  const r = await page.evaluate(() => {
    const c = document.querySelector('#mapCanvas');
    const VH = c.height, TS = 16, MH = PixelPets.mapInfo.h;
    const py = PixelPets.walk.fy * TS;
    const by = (PixelPets.walk.camBias && PixelPets.walk.camBias.y) || 0;
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const oldY = MH * TS <= VH ? -Math.floor((VH - MH * TS) / 2) : Math.round(clamp(py + 8 - VH / 2 + by, 0, MH * TS - VH));
    return { cam: PixelPets.walk.cam.y, oldY, mode: PixelPets.controls.mode };
  });
  expect(r.mode).toBe('arcade');
  expect(r.cam).toBe(r.oldY);
});
