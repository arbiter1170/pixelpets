/* Partner tab: STATS and KIT above FEED, no BAG, adornments sit on every Walkling. Save stays v2. */
const path = require('path');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, artifactsDir } = require('./helpers');

function saveShot(page, name) {
  const w = page.viewportSize().width;
  if (w === 375) return Promise.resolve();
  const dir = artifactsDir('screenshots/partner');
  return page.screenshot({ path: path.join(dir, name + '-' + w + '.png') });
}

trackErrors(test, expect);

async function boot(page) {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page);
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.state && window.PixelPets.state.party[0]);
  await page.evaluate(() => PixelPets.showTab('pet'));   // BOOT_TO_MAP: the game boots on WALK; these checks are on the PARTNER screen
}

test('STATS and KIT sit above FEED, and the partner tab has no bag', async ({ page }) => {
  await boot(page);
  const lay = await page.evaluate(() => {
    const stats = document.querySelector('#petStatsBtn').getBoundingClientRect();
    const kit = document.querySelector('#petKitBtn').getBoundingClientRect();
    const feed = document.querySelector('#scr-pet [data-act="feed"]').getBoundingClientRect();
    const scr = document.querySelector('#scr-pet').getBoundingClientRect();
    const statsEl = document.querySelector('#petStatsBtn');
    const kitEl = document.querySelector('#petKitBtn');
    const feedEl = document.querySelector('#scr-pet [data-act="feed"]');
    return {
      statsAbove: stats.bottom <= feed.top + 1,
      kitAbove: kit.bottom <= feed.top + 1,
      sideBySide: Math.abs(stats.top - kit.top) < 6 && kit.left >= stats.right - 8,
      onScreen: stats.top >= scr.top - 1 && feed.bottom <= scr.bottom + 2,
      tall: stats.height >= 44 && kit.height >= 44 && feed.height >= 44,
      chrome: statsEl.classList.contains('btn') && kitEl.classList.contains('btn') && feedEl.classList.contains('btn'),
      notScene: !statsEl.classList.contains('scene-btn') && !kitEl.classList.contains('scene-btn'),
      bag: !!document.querySelector('#petBagBtn'),
      label: kitEl.getAttribute('aria-label'),
      text: kitEl.textContent.trim(),
    };
  });
  expect(lay.statsAbove).toBe(true);
  expect(lay.kitAbove).toBe(true);
  expect(lay.sideBySide).toBe(true);
  expect(lay.onScreen).toBe(true);
  expect(lay.tall).toBe(true);
  expect(lay.chrome).toBe(true);
  expect(lay.notScene).toBe(true);
  expect(lay.bag).toBe(false);
  expect(lay.label).toBe('Gear for Pipkit');
  expect(lay.text).toBe('GEAR');
  await saveShot(page, 'partner');

  await page.locator('#tabs button[data-tab="walk"]').click();
  await expect(page.locator('#walkBagBtn')).toBeVisible();
  await page.locator('#walkBagBtn').click();
  await expect(page.locator('#ovBag')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#ovBag')).toBeHidden();
});

test('GEAR opens on the partner screen and a Lodge bell stays on the save', async ({ page }) => {
  await boot(page);
  expect(await page.locator('#ovKit').count()).toBe(0);
  await page.locator('#petKitBtn').click();
  await expect(page.locator('#ovStats')).toBeVisible();
  await expect(page.locator('#scGearBox')).toBeVisible();
  await expect(page.locator('#scNameBtn')).toBeVisible();
  const names = await page.locator('#scGearBox [data-acc]').allTextContents();
  expect(names).toEqual(['None', 'Lodge bell', 'Hall ribbon', 'Hearth scarf', 'Orchard sprig', 'Amber star']);
  const wide = await page.evaluate(() => {
    const box = document.querySelector('#scGearBox');
    const top = box.getBoundingClientRect().top;
    const view = document.querySelector('#ovStats .ov-inner').getBoundingClientRect();
    return box.scrollWidth <= box.clientWidth + 1 && top >= view.top - 1;
  });
  expect(wide).toBe(true);
  await saveShot(page, 'kit');
  await page.locator('#scGearBox [data-acc="bell"]').click();
  await expect(page.locator('#toast')).toHaveText('Pipkit wears the Lodge bell.');
  const saved = await page.evaluate(() => ({
    v: PixelPets.state.v,
    accessory: PixelPets.state.party[0].accessory,
  }));
  expect(saved.v).toBe(2);
  expect(saved.accessory).toBe('bell');
  await page.keyboard.press('Escape');
  await expect(page.locator('#ovStats')).toBeHidden();
  await expect(page.locator('#scr-pet')).toBeVisible();
  await expect(page.locator('#tabs')).not.toHaveClass(/locked/);
});

test('every adornment sits on every Walkling, faded ones in grey', async ({ page }) => {
  await boot(page);
  const problems = await page.evaluate(() => PixelPets.adornCheck());
  expect(problems).toEqual([]);
  if (page.viewportSize().width === 320) {
    await page.evaluate(() => PixelPets.adornSheet());
    const dir = artifactsDir('screenshots/partner');
    await page.locator('#accSheet').screenshot({ path: path.join(dir, 'adornments-320.png') });
  }
});
