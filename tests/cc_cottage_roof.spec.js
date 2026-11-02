/* CC_COTTAGE_ROOF. Cobblecrest cottage_e uses roof_slate_b and keeps the arch (D910).
   Widths are the Playwright projects (320, 375, 390). Save stays pixelpets.save.v2 with v 2.
   This build adds no save field. */
const path = require('path');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, artifactsDir } = require('./helpers');

trackErrors(test, expect);

const NAVY = '#29366f';
const GRASS = '#38b764';
const TAN = '#ffcd75';
const MINT = '#a7f070';
const WINE = '#960e16';
const SOOT = '#18140f';
const CORNERS = new Set(['21,11', '24,11']);

function save() {
  const s = starterSave();
  s.settings.follower = false;
  s.settings.tips = false;
  s.flags['story.early_done'] = true;
  s.world = { map: 'cobblecrest', x: 22, y: 15, facing: 'up', respawn: 'cobblecrest' };
  return s;
}

async function boot(page, flags) {
  const s = save();
  if (flags) Object.assign(s.flags, flags);
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true && window.BUILD);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.evaluate(() => PixelPets.goto('cobblecrest', 22, 15, 'up'));
}

async function roofView(page) {
  return page.evaluate(({ NAVY, GRASS, TAN, MINT, WINE, SOOT }) => {
    const b = PixelPets.exteriors('cobblecrest').buildings.find((x) => x.name === 'cottage_e');
    const cells = [];
    for (let y = 11; y <= 12; y++) {
      for (let x = 21; x <= 24; x++) {
        const c = PixelPets.exteriorCell(x, y);
        const cell = c.cell || {};
        cells.push({
          x, y, painted: c.painted, cut: c.cut,
          navy: cell[NAVY] || 0, grass: cell[GRASS] || 0, tan: cell[TAN] || 0, mint: cell[MINT] || 0,
          wine: cell[WINE] || 0, soot: cell[SOOT] || 0,
        });
      }
    }
    const turf = [];
    for (const id of PixelPets.debugCatalog().maps) {
      const v = PixelPets.exteriors(id);
      if (!v || !v.buildings) continue;
      for (const building of v.buildings) {
        if (building.roof === 'roof_turf') turf.push(id + '.' + building.name);
      }
    }
    const rows = EXTERIOR_ART.tiles.roof_turf;
    return {
      building: b,
      cells,
      fac: PixelPets.townFaction('cobblecrest'),
      turf,
      tile: rows ? { n: rows.length, wide: rows.every((row) => row.length === 16), grass: rows.some((row) => row.indexOf('g') >= 0) } : null,
      keeper: { x: PixelPets.keeper.x, y: PixelPets.keeper.y, map: PixelPets.mapInfo.id },
    };
  }, { NAVY, GRASS, TAN, MINT, WINE, SOOT });
}

function assertSlateReads(cells) {
  expect(cells).toHaveLength(8);
  for (const c of cells) {
    const key = c.x + ',' + c.y;
    expect(c.painted, key).toBe(true);
    expect(c.cut, key).toBe(true);
    if (CORNERS.has(key)) expect(c.grass, key + ' clipped corner').toBeGreaterThan(c.navy);
    else expect(c.navy, key).toBeGreaterThan(c.grass);
  }
}

async function saveShape(page) {
  return page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('pixelpets.save.v2'));
    return { v: raw.v, key: 'pixelpets.save.v2', keys: Object.keys(raw).sort() };
  });
}

async function shotAt(page, name, width) {
  if (page.viewportSize().width !== width) return;
  await page.screenshot({ path: path.join(artifactsDir('cc-cottage-roof'), name) });
}

test('cottage_e keeps the arch and the slate roof reads over the lawn', async ({ page }) => {
  await boot(page);
  const before = await saveShape(page);
  const view = await roofView(page);
  expect(view.keeper).toEqual({ x: 22, y: 15, map: 'cobblecrest' });
  expect(view.fac).toBe('keepers');
  expect(view.building).toMatchObject({
    name: 'cottage_e', x0: 21, y0: 11, x1: 24, y1: 13, ry1: 12,
    roof: 'roof_slate_b', wall: 'wall_brick', win: ['win_shutter'], trim: 'd', shape: 'arch',
    door: null, doors: [], feats: [], porch: ['cc_barrel'],
  });
  assertSlateReads(view.cells);
  const tan = view.cells.reduce((n, c) => n + c.tan, 0);
  const crown = view.cells.filter((c) => c.y === 11 && (c.x === 22 || c.x === 23));
  expect(tan).toBeGreaterThan(0);
  expect(crown.every((c) => c.mint === 0 && c.wine === 0 && c.soot === 0)).toBe(true);
  expect(view.turf).toEqual([]);
  expect(view.tile).toEqual({ n: 16, wide: true, grass: true });
  const after = await saveShape(page);
  expect(after).toEqual(before);
  expect(after.v).toBe(2);
  expect(after.key).toBe('pixelpets.save.v2');
  await shotAt(page, 'keepers-390.png', 390);
  await shotAt(page, 'keepers-320.png', 320);
});

test('the Glimmerwell ridge draws over the slate once the quarry is bought', async ({ page }) => {
  await boot(page, { 'story.quarry_bought': true });
  const before = await saveShape(page);
  const view = await roofView(page);
  expect(view.fac).toBe('glimmer');
  expect(view.building.roof).toBe('roof_slate_b');
  expect(view.building.shape).toBe('arch');
  assertSlateReads(view.cells);
  expect(view.cells.every((c) => c.tan === 0)).toBe(true);
  const crown = view.cells.filter((c) => c.y === 11 && (c.x === 22 || c.x === 23));
  expect(crown.every((c) => c.mint === 0 && c.wine > 0 && c.soot > 0)).toBe(true);
  const after = await saveShape(page);
  expect(after.v).toBe(2);
  expect(after.keys).toEqual(before.keys);
  await shotAt(page, 'glimmer-390.png', 390);
});

test('reduced motion still paints the slate roof', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await boot(page);
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  const view = await roofView(page);
  expect(view.building.roof).toBe('roof_slate_b');
  expect(view.building.shape).toBe('arch');
  assertSlateReads(view.cells);
  expect(view.cells.reduce((n, c) => n + c.tan, 0)).toBeGreaterThan(0);
});
