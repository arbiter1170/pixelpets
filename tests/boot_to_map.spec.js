/* BOOT_TO_MAP (Oct 23, 2026; Supervisor-settled, Vincent's call). Every boot lands on the map (WALK), never the PARTNER
   care screen (#scr-pet): a first load, a refresh, a reload with a battle or an overlay open, and the boot-retry URL.
   Nothing about the screen is saved; the save stays pixelpets.save.v2, v 2. A player with no Walklings keeps the
   existing boot branch (walk screen, tabs locked, "Ilse is waiting inside."). See tests/README.md. */
const { test, expect } = require('@playwright/test');
const { starterSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

// Seeds the save only when none is stored, so a reload boots from what the game itself wrote (like a phone does).
async function seedOnce(context, save) {
  await context.addInitScript((save) => {
    if (localStorage.getItem('pixelpets.save.v2')) return;
    const d = new Date();
    const day = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    save.flags['daily.hello'] = day; save.flags['daily.warm_bowl'] = day;
    save.last = Date.now();
    localStorage.setItem('pixelpets.save.v2', JSON.stringify(save));
    localStorage.setItem('pixelpets.geo', 'deny');
    localStorage.setItem('pixelpets.mute', '1');
  }, save);
}
async function ready(page) { await page.waitForFunction(() => window.PixelPets && window.PixelPets.state); }
async function where(page) {
  return page.evaluate(() => {
    const vis = (sel) => { const el = document.querySelector(sel); return !!el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0; };
    const tab = document.querySelector('#tabs button.active');
    return {
      screen: document.body.dataset.screen,
      walkActive: document.querySelector('#scr-walk').classList.contains('active'),
      petActive: document.querySelector('#scr-pet').classList.contains('active'),
      walkVisible: vis('#scr-walk'), mapVisible: vis('#mapCanvas'), petVisible: vis('#scr-pet'),
      tab: tab ? tab.dataset.tab : null,
      battle: !!(window.PixelPets.battle && window.PixelPets.battle.on),
      v: JSON.parse(localStorage.getItem('pixelpets.save.v2')).v,
    };
  });
}
function expectMap(w, label) {
  expect(w.screen, label + ': body data-screen').toBe('walk');
  expect(w.walkActive, label + ': #scr-walk active').toBe(true);
  expect(w.petActive, label + ': #scr-pet not active').toBe(false);
  expect(w.walkVisible && w.mapVisible, label + ': map visible').toBe(true);
  expect(w.petVisible, label + ': #scr-pet hidden').toBe(false);
  expect(w.tab, label + ': WALK tab highlighted').toBe('walk');
  expect(w.battle, label + ': no battle restored').toBe(false);
  expect(w.v, label + ': save stays v 2').toBe(2);
}

test('a player with Walklings boots onto the map, and a refresh from the PARTNER screen lands on the map again', async ({ page }) => {
  await seedOnce(page.context(), starterSave());
  await gotoGame(page); await ready(page);
  expectMap(await where(page), 'first load');
  await page.evaluate(() => PixelPets.showTab('pet'));
  await expect(page.locator('#scr-pet')).toHaveClass(/active/);
  await page.reload({ waitUntil: 'commit' }); await ready(page);
  expectMap(await where(page), 'refresh from PARTNER');
  // The game's own reload paths (cloud adopt, bfcache erase check, boot retry) all call location.reload/replace, so boot runs again.
  await page.evaluate(() => PixelPets.showTab('pet'));
  await page.evaluate(() => location.reload()); await page.waitForTimeout(300); await ready(page);
  expectMap(await where(page), 'script reload');
  await page.goto('/?b=boot.20991231-0000', { waitUntil: 'commit' }); await ready(page);
  expectMap(await where(page), 'boot-retry URL');
});

test('a reload with an overlay open on the PARTNER screen lands on the map with no overlay', async ({ page }) => {
  await seedOnce(page.context(), starterSave());
  await gotoGame(page); await ready(page);
  await page.evaluate(() => PixelPets.showTab('pet'));
  await page.locator('#settingsBtn').click();
  await expect(page.locator('#ovSettings')).toBeVisible();
  await page.reload({ waitUntil: 'commit' }); await ready(page);
  expectMap(await where(page), 'reload with Settings open');
  await expect(page.locator('#ovSettings')).toBeHidden();
});

test('a reload during a trainer battle lands on the map, with no battle restored', async ({ page }) => {
  await seedOnce(page.context(), starterSave());
  await gotoGame(page, '?debug=1'); await ready(page);
  expect(await page.evaluate(() => PixelPets.forceTrainer('route1_pia'))).toBe(true);
  await expect(page.locator('#ovBattle')).toBeVisible();
  await page.evaluate(() => PixelPets.showTab('pet'));   // refused under the battle; the boot must not care either way
  await page.reload({ waitUntil: 'commit' }); await ready(page);
  expectMap(await where(page), 'reload mid-battle');
  await expect(page.locator('#ovBattle')).toBeHidden();
});

test('a player with no Walklings keeps the existing boot branch (walk screen, Ilse nudge)', async ({ page }) => {
  const s = starterSave();
  s.party = []; s.partnerId = null;
  s.flags = { 'story.intro_seen': true };
  s.dex = { seen: {}, caught: {}, legacy: [], hits: {} };
  await seedOnce(page.context(), s);
  await gotoGame(page); await ready(page);
  await expect(page.locator('#toast')).toContainText('Ilse is waiting inside.');
  const w = await page.evaluate(() => ({ screen: document.body.dataset.screen, walk: document.querySelector('#scr-walk').classList.contains('active'), pet: document.querySelector('#scr-pet').classList.contains('active'), n: PixelPets.state.party.length }));
  expect(w).toEqual({ screen: 'walk', walk: true, pet: false, n: 0 });
});
