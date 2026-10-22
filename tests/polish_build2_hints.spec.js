/* POLISH_BUILD2 P3 (D440, D441). Stuck lines from the third open, and the side-task count. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const STUCK = [
  'Your team is worn out. Rest the whole party at a Lantern House. A rest costs a few Acorns.',
  'Lost? Open the map. The blinking dot is you.',
  'No rush. A walk with your Walkling helps you think.',
];

function save() {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.textSpeed = 'fast';
  return s;
}

async function boot(page, s) {
  await installSave(page.context(), s || save(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForFunction(() => !document.querySelector('#questBtn').classList.contains('off'));
}

async function openPanel(page) {
  await page.locator('#questBtn').click();
  await page.waitForSelector('#ovQuest:not([hidden])');
  await page.waitForFunction(() => PixelPets.optionsReady);
}

async function closePanel(page) {
  await page.locator('#questClose').click();
  await page.waitForSelector('#ovQuest', { state: 'hidden' });
}

test('the third open names the map, and BLOCKED still wins', async ({ page }) => {
  await boot(page);
  expect(await page.evaluate(() => PPQuests.devCheck())).toEqual([]);
  await page.evaluate(() => PixelPets.goto('hm_home_in', 4, 6, 'up'));
  await openPanel(page);
  await expect(page.locator('#questNote')).toBeHidden();
  await closePanel(page);
  await openPanel(page);
  await expect(page.locator('#questNote')).toBeHidden();
  await closePanel(page);
  await openPanel(page);
  await expect(page.locator('#questNote')).toHaveText(STUCK[1]);
  await expect(page.locator('#questStatus')).toHaveText('ACTIVE');
  await closePanel(page);
  await page.evaluate(() => PixelPets.goto('hearthmoor', 8, 8, 'down'));
  await openPanel(page);
  await expect(page.locator('#questNote')).toHaveText(STUCK[2]);
  await closePanel(page);

  await page.evaluate(() => { PixelPets.state.party.forEach(p => { p.energy = 0; }); });
  await openPanel(page);
  await expect(page.locator('#questNote')).toHaveText(STUCK[0]);
  await expect(page.locator('#questStatus')).toHaveText('BLOCKED');
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});

test('Fernbrook counts the Faded Fuzzwick until it is met', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.goto('fernbrook', 10, 10, 'down'));
  await openPanel(page);
  await expect(page.locator('#questTasks')).toHaveText('1 side task nearby');
  await closePanel(page);
  await page.evaluate(() => PixelPets.setFlag('story.faded_fuzzwick', true));
  await openPanel(page);
  await expect(page.locator('#questTasks')).toBeHidden();
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});
