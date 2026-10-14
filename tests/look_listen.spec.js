/* Look and listen: glimmer town loop, quarry and grove loops, tier-2 lanyard, Imogen, Hollis, Rook's lanyard. */
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

async function gotoDebug(page) {
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets.debug === true && typeof window.PixelPets.spriteLook === 'function');
}

test('glimmer towns, the quarry, and the grove pick their own loops', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoDebug(page);
  const got = await page.evaluate(() => {
    const ids = ['fernbrook', 'hm_home_in', 'cobble_quarry', 'route2_glen', 'highcharity', 'hc_church_in', 'dream_2004', 'route2'];
    const keepers = {};
    ids.forEach((id) => { keepers[id] = PixelPets.mapTrack(id); });
    PixelPets.setSide('glimmer');
    const glimmer = {};
    ids.forEach((id) => { glimmer[id] = PixelPets.mapTrack(id); });
    return { check: PixelPets.musicCheck(), keepers, glimmer, side: PixelPets.side };
  });
  expect(got.check).toEqual([]);
  expect(got.side).toBe('glimmer');
  expect(got.keepers).toEqual({
    fernbrook: 'town',
    hm_home_in: 'town',
    cobble_quarry: 'quarry',
    route2_glen: 'grove',
    highcharity: 'charity',
    hc_church_in: 'chapel',
    dream_2004: 'route',
    route2: 'route',
  });
  expect(got.glimmer).toEqual({
    fernbrook: 'town_glimmer',
    hm_home_in: 'town_glimmer',
    cobble_quarry: 'quarry',
    route2_glen: 'grove',
    highcharity: 'charity',
    hc_church_in: 'chapel',
    dream_2004: 'route',
    route2: 'route',
  });
});

test('the tier-2 lanyard is a second mark on the tier-1 badge', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page);
  const art = await page.evaluate(() => {
    const count = (rows, ch) => rows.reduce((n, row) => n + [...row].filter((c) => c === ch).length, 0);
    const a = PixelPets.sealArt('seal_glim_1');
    const b = PixelPets.sealArt('seal_glim_2');
    return {
      aLen: a.length,
      bLen: b.length,
      aWidth: a.map((r) => r.length),
      bWidth: b.map((r) => r.length),
      same: a.join('|') === b.join('|'),
      rim: a.every((row, y) => [...row].every((ch, x) => (ch !== 'o' && ch !== 'y' && ch !== '.') || ch === b[y][x])),
      w1: count(a, 'w'),
      w2: count(b, 'w'),
      name: PixelPets.sealName('seal_glim_2'),
    };
  });
  expect(art.aLen).toBe(16);
  expect(art.bLen).toBe(16);
  expect(art.aWidth.every((n) => n === 16)).toBe(true);
  expect(art.bWidth.every((n) => n === 16)).toBe(true);
  expect(art.same).toBe(false);
  expect(art.rim).toBe(true);
  expect(art.w2).toBeGreaterThan(art.w1);
  expect(art.name).toBe('Bright Tier 2 Lanyard');
});

test('Imogen and Hollis are not the generic associate, and Rook\'s lanyard follows the pledge', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoDebug(page);
  const got = await page.evaluate(() => {
    const slim = (id) => PixelPets.spriteLook(id);
    const before = slim('rook');
    PixelPets.setSide('keepers');
    PixelPets.setFlag('story.side_pick_done', true);
    const keepersEarly = slim('rook');
    PixelPets.setSide('glimmer');
    const glimmerPick = slim('rook');
    PixelPets.setSide('keepers');
    PixelPets.setFlag('story.slice_end', true);
    const afterFernbrook = slim('rook');
    PixelPets.setFlag('story.quarry_bought', true);
    PixelPets.setFlag('story.rook_end', 'ally');
    const ally = slim('rook');
    return {
      imogen: slim('r2_lead'),
      hollis: slim('hollis_aside'),
      associate: slim('juniper'),
      speaker: PixelPets.spriteLook('imogen') && PixelPets.spriteLook('imogen').hair,
      hollisName: PixelPets.spriteLook('hollis') && PixelPets.spriteLook('hollis').hair,
      before, keepersEarly, glimmerPick, afterFernbrook, ally,
    };
  });
  expect(got.speaker).toBe('bob');
  expect(got.hollisName).toBe('curls');
  expect(got.imogen).toMatchObject({ hair: 'bob', hairCol: 'y', outfit: 'dress', outfitCol: 'l', accent: 'y' });
  expect(got.hollis).toMatchObject({ hair: 'curls', hairCol: 'c', outfit: 'vest', accessory: 'cap' });
  expect(got.associate.outfit).toBe('coat');
  expect(got.imogen.outfit).not.toBe(got.associate.outfit);
  expect(got.hollis.hair).not.toBe(got.associate.hair);
  expect(got.before.accessory).toBe('none');
  expect(got.keepersEarly.accessory).toBe('none');
  expect(got.glimmerPick).toMatchObject({ accent: 'l', accessory: 'lanyard' });
  expect(got.afterFernbrook).toMatchObject({ accent: 'l', accessory: 'lanyard' });
  expect(got.ally.accessory).toBe('none');
  expect(got.ally.accent).not.toBe('l');
});

test('the badge and the new faces read as separate pictures', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoDebug(page);
  const painted = await page.evaluate(() => {
    PixelPets.setSide('glimmer');
    PixelPets.setFlag('story.side_pick_done', true);
    return PixelPets.paintPreview();
  });
  expect(painted).toBe(true);
  const dir = path.join('screenshots', 'look_listen');
  fs.mkdirSync(dir, { recursive: true });
  await page.locator('#artSheet').screenshot({ path: path.join(dir, 'sheet.png') });
  const box = await page.locator('#artSheet').boundingBox();
  expect(box.width).toBeGreaterThan(400);
});
