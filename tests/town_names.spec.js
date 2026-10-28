/* TOWN map names (Vincent, Oct 28, 2026: "Map is missing some store/location names"). A building name too wide for one line
   wraps to two instead of turning into a numbered pin, and Lanternball Court is named on Hearthmoor's map. */
const path = require('path');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, artifactsDir } = require('./helpers');

trackErrors(test, expect);

test('Hearthmoor TOWN names Lamplight Provisions and Lanternball Court, no numbered pins', async ({ page }) => {
  const s = starterSave();
  s.world = { map: 'hearthmoor', x: 8, y: 8, facing: 'down', respawn: 'hearthmoor' };
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '');
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForFunction(() => !document.querySelector('#mapBtn').classList.contains('off'));
  await page.locator('#mapBtn').click();
  await page.waitForSelector('#ovMap:not([hidden])');
  await page.locator('#mapLevelTown').click();
  await page.waitForFunction(() => PixelPets.mapLayer() && PixelPets.mapLayer().level === 'town');
  const layer = await page.evaluate(() => PixelPets.mapLayer());
  const shown = layer.names.join(' ');
  expect(layer.pins).toEqual([]);
  expect(shown).toContain('LAMPLIGHT');
  expect(shown).toContain('PROVISIONS');
  expect(shown).toContain('LANTERNBALL');
  expect(shown).toContain('COURT');
  // Every door building's name is drawn whole, on one line or two.
  for (const b of layer.buildings.filter(x => x.label)) expect(shown).toContain(b.label.split(' ')[0]);
  await page.locator('#regionCanvas').screenshot({ path: path.join(artifactsDir('town-names'), 'hearthmoor-' + page.viewportSize().width + '.png') });
});
