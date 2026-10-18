/* Region map: faction claims, the key, and reading a place without leaving the parchment. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, shot } = require('./helpers');

trackErrors(test, expect);

function walkedSave(extra) {
  const save = starterSave();
  Object.assign(save.flags, extra || {});
  save.world = { map: 'hearthmoor', x: 8, y: 8, facing: 'down', respawn: 'hearthmoor' };
  return save;
}

async function boot(page, save, search) {
  await installSave(page.context(), save || walkedSave(), { quietDay: true });
  await gotoGame(page, search || '');
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForFunction(() => !document.querySelector('#mapBtn').classList.contains('off'));
}

async function openMap(page) {
  await page.locator('#mapBtn').click();
  await page.waitForSelector('#ovMap:not([hidden])');
}

test('the key names factions, and a new place stays hidden', async ({ page }) => {
  await boot(page);
  await openMap(page);
  const card = await page.evaluate(() => ({
    name: document.querySelector('#mapPlaceName').textContent,
    hold: document.querySelector('#mapHold').dataset.hold,
    line: document.querySelector('#mapHold').textContent,
    here: document.querySelector('#mapHere').hidden,
    key: document.querySelector('#mapKey').innerText,
    pledge: document.querySelector('#mapPledge').hidden,
  }));
  expect(card.name).toBe('HEARTHMOOR');
  expect(card.hold).toBe('keepers');
  expect(card.line).toContain('Keepers');
  expect(card.here).toBe(false);
  expect(card.pledge).toBe(true);
  // MAP_LEGEND: a new save shows PLACES and QUESTS without Seal; SIDES waits for the pledge (D109).
  for (const word of ['PLACES', 'Town', 'Route', 'Side place', 'Not visited', 'Coach', 'QUESTS', 'You', 'Next step', 'Side task']) expect(card.key).toContain(word);
  for (const word of ['SIDES', 'Keepers', 'Glimmerwell', 'Both sides', 'Wild', 'Seal']) expect(card.key).not.toContain(word);
  await shot(page, 'region-map-home');
  const box = await page.locator('#regionCanvas').boundingBox();
  await page.mouse.click(box.x + (104 / 320) * box.width, box.y + (120 / 192) * box.height);
  const hidden = await page.evaluate(() => ({
    name: document.querySelector('#mapPlaceName').textContent,
    hold: document.querySelector('#mapHold').hidden,
    open: !document.querySelector('#ovMap').hidden,
  }));
  expect(hidden.name).toBe('???');
  expect(hidden.hold).toBe(true);
  expect(hidden.open).toBe(true);
  const at = await page.evaluate(() => ({ x: PixelPets.state.x, y: PixelPets.state.y }));
  await page.keyboard.press('ArrowRight');
  const nudged = await page.evaluate(() => ({
    name: document.querySelector('#mapPlaceName').textContent,
    open: !document.querySelector('#ovMap').hidden,
  }));
  expect(nudged.open).toBe(true);
  expect(nudged.name).not.toBe('HEARTHMOOR');
  await page.keyboard.down('ArrowDown');
  await page.locator('#mapClose').click();
  await page.waitForTimeout(450);
  const stayed = await page.evaluate(() => ({ x: PixelPets.state.x, y: PixelPets.state.y }));
  await page.keyboard.up('ArrowDown');
  expect(stayed).toEqual(at);
  await page.waitForSelector('#ovMap', { state: 'hidden' });
});

test('claims follow the story, and the capital wears Keeper colors', async ({ page }) => {
  await boot(page, walkedSave({ 'story.side_pick_done': true, 'story.side': 'keepers' }), '?debug=1');
  const early = await page.evaluate(() => ({
    check: PixelPets.mapCheck(),
    home: PixelPets.mapHold('hearthmoor'),
    fern: PixelPets.mapHold('fernbrook'),
    road: PixelPets.mapHold('route2'),
    glen: PixelPets.mapHold('route2_glen'),
    cobble: PixelPets.mapHold('cobblecrest'),
    quarry: PixelPets.mapHold('cobble_quarry'),
    heights: PixelPets.mapHold('fb_heights'),
    meadow: PixelPets.mapHold('proto'),
    woods: PixelPets.mapHold('mahopac'),
    capital: PixelPets.mapHold('highcharity'),
    town: PixelPets.townFaction('highcharity'),
    hall: PixelPets.townFaction('hc_hall_in'),
    ridge: PixelPets.townFaction('fb_heights'),
  }));
  expect(early.check).toEqual([]);
  expect(early.home).toBe('keepers');
  expect(early.fern).toBe('split');
  expect(early.road).toBe('split');
  expect(early.glen).toBe('glimmer');
  expect(early.cobble).toBe('keepers');
  expect(early.quarry).toBe('keepers');
  expect(early.heights).toBe('glimmer');
  expect(early.meadow).toBe('wild');
  expect(early.woods).toBe('wild');
  expect(early.capital).toBe('keepers');
  expect(early.town).toBe('keepers');
  expect(early.hall).toBe('keepers');
  expect(early.ridge).toBe(null);

  await page.evaluate(() => {
    PixelPets.setFlag('story.quarry_bought', true);
    PixelPets.setFlag('story.sm_done', true);
    PixelPets.setFlag('story.seal1', true);
    PixelPets.setFlag('story.seal2', true);
    const seen = {};
    ['hearthmoor', 'route1', 'proto', 'fernbrook', 'route2', 'route2_glen', 'cobblecrest', 'cobble_quarry', 'mahopac', 'highcharity', 'fb_heights'].forEach(id => { seen[id] = 1; });
    PixelPets.state.mapSeen = seen;
  });
  const later = await page.evaluate(() => ({
    cobble: PixelPets.mapHold('cobblecrest'),
    quarry: PixelPets.mapHold('cobble_quarry'),
    heights: PixelPets.mapHold('fb_heights'),
    town: PixelPets.townFaction('cobblecrest'),
  }));
  expect(later).toEqual({ cobble: 'glimmer', quarry: 'glimmer', heights: 'split', town: 'glimmer' });

  await openMap(page);
  const card = await page.evaluate(() => ({
    pledge: document.querySelector('#mapPledge').textContent,
    fern: null,
  }));
  expect(card.pledge).toContain('Keepers');
  const box = await page.locator('#regionCanvas').boundingBox();
  await page.mouse.click(box.x + (168 / 320) * box.width, box.y + (104 / 192) * box.height);
  const fern = await page.evaluate(() => ({
    name: document.querySelector('#mapPlaceName').textContent,
    hold: document.querySelector('#mapHold').dataset.hold,
    line: document.querySelector('#mapHold').textContent,
  }));
  expect(fern.name).toBe('FERNBROOK');
  expect(fern.hold).toBe('split');
  expect(fern.line).toContain('Glimmerwell');
  const wide = await page.evaluate(() => {
    const inner = document.querySelector('.map-inner');
    const past = [...inner.querySelectorAll('li, p, .map-pname, .map-hold')].filter(el => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && (r.left < -1 || r.right > window.innerWidth + 1);
    }).map(el => (el.id || el.className || el.textContent || '').slice(0, 40));
    return { past, scroll: inner.scrollWidth <= inner.clientWidth + 1 };
  });
  expect(wide.past).toEqual([]);
  expect(wide.scroll).toBe(true);
  await shot(page, 'region-map-claims');
  await page.locator('#mapKey').scrollIntoViewIfNeeded();
  await shot(page, 'region-map-key');
});

test('the card names the room you are standing in', async ({ page }) => {
  await boot(page, walkedSave(), '?debug=1');
  await page.evaluate(() => PixelPets.goto('hm_home_in', 4, 6, 'up'));
  await openMap(page);
  const name = await page.locator('#mapPlaceName').textContent();
  expect(name).toContain('HEARTHMOOR');
  expect(name).toContain('YOUR HOME');
  expect(await page.locator('#mapHold').getAttribute('data-hold')).toBe('keepers');
  await page.keyboard.press('Escape');
  await page.waitForSelector('#ovMap', { state: 'hidden' });
});

test('upstairs shares the Hearthmoor node and the card names that room', async ({ page }) => {
  await boot(page, walkedSave(), '?debug=1');
  expect(await page.evaluate(() => PixelPets.mapCheck())).toEqual([]);
  await page.evaluate(() => PixelPets.goto('hm_home_up', 4, 5, 'down'));
  await openMap(page);
  const name = await page.locator('#mapPlaceName').textContent();
  expect(name).toContain('HEARTHMOOR');
  expect(name).toContain('UPSTAIRS');
  expect(await page.locator('#mapHold').getAttribute('data-hold')).toBe('keepers');
  await page.keyboard.press('Escape');
  await page.waitForSelector('#ovMap', { state: 'hidden' });
});
