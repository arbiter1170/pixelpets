/* POLISH_BUILD2 P5 (D443). The Junior Bright lanyard is a Glimmerwell holder card. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

function save(side, look) {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.textSpeed = 'fast';
  s.flags['story.phone_got'] = true;
  s.flags['story.side'] = side;
  s.flags['story.side_pick_done'] = true;
  if (look) s.player.look = Object.assign({}, s.player.look, look);
  s.world = { map: 'hm_wardrobe', x: 9, y: 4, facing: 'up', respawn: 'hearthmoor' };
  return s;
}

async function boot(page, s) {
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.evaluate(() => PixelPets.showTab('walk'));
}

async function openHolder(page) {
  await page.evaluate(() => PixelPets.goto('hm_wardrobe', 9, 3, 'up'));
  await page.keyboard.press('Space');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
  await page.keyboard.press('Space');
  await page.waitForSelector('#ovWardrobe:not([hidden])');
  await page.waitForFunction(() => PixelPets.optionsReady);
  await page.locator('#ovWardrobe .ward-tabs button[data-tab="holder"]').click();
  await page.waitForFunction(() => document.querySelector('#wardGrid .ward-item'));
}

test('a Glimmerwell holder wears the lanyard on the map', async ({ page }) => {
  await boot(page, save('glimmer'));
  await openHolder(page);
  const card = page.locator('.ward-item[data-id="lanyard"]');
  await expect(card.locator('.ward-name')).toHaveText('Junior Bright lanyard');
  await expect(card.locator('.ward-state')).toHaveText('Free');
  await expect(card.locator('.ward-act')).toHaveText('WEAR');
  const box = await card.locator('.ward-act').boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(box.width).toBeGreaterThanOrEqual(44);
  await card.locator('.ward-act').click();
  await expect(card.locator('.ward-act')).toHaveText('WORN');
  expect(await page.evaluate(() => PixelPets.holderDrawn())).toBe('lanyard');
  const stored = await page.evaluate(() => {
    const row = JSON.parse(localStorage.getItem('pixelpets.save.v2'));
    return { v: row.v, acc: row.player.look.accessory };
  });
  expect(stored.v).toBe(2);
  expect(stored.acc).toBe('lanyard');
  await page.locator('#wardDone').click();
  await page.waitForSelector('#ovWardrobe', { state: 'hidden' });
  expect(await page.evaluate(() => PixelPets.holderDrawn())).toBe('lanyard');
});

test('a Keepers holder never sees the card, and a saved lanyard waits for Glimmerwell', async ({ page }) => {
  await boot(page, save('keepers'));
  await openHolder(page);
  await expect(page.locator('.ward-item[data-id="lanyard"]')).toHaveCount(0);
  await expect(page.locator('.ward-item[data-id="scarf"]')).toHaveCount(1);
  await page.locator('#wardDone').click();

  await boot(page, save('keepers', { accessory: 'lanyard' }));
  const kept = await page.evaluate(() => {
    const row = JSON.parse(localStorage.getItem('pixelpets.save.v2'));
    return { drawn: PixelPets.holderDrawn(), v: row.v, acc: row.player.look.accessory };
  });
  expect(kept.drawn).toBe('none');
  expect(kept.v).toBe(2);
  expect(kept.acc).toBe('lanyard');
  await page.evaluate(() => {
    PixelPets.state.flags['story.side'] = 'glimmer';
    PixelPets.state.flags['story.side_pick_done'] = true;
  });
  expect(await page.evaluate(() => PixelPets.holderDrawn())).toBe('lanyard');
  const still = await page.evaluate(() => {
    const row = JSON.parse(localStorage.getItem('pixelpets.save.v2'));
    return { v: row.v, acc: row.player.look.accessory };
  });
  expect(still.v).toBe(2);
  expect(still.acc).toBe('lanyard');
});
