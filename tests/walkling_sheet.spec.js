/* Walkling sheet (WALKLINGS tab). Players never load this file. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

// ember/0 already learns bump plus more at starter level. brace is not a MOVES id
// (the stone move is brace_rock), so the seed pins two real ids.
function sheetSave() {
  const save = starterSave();
  save.party = [
    {
      id: 'petsmoke1',
      species: 'ember',
      stage: 0,
      xp: 10,
      bx: 64,
      hunger: 80,
      happy: 60,
      energy: 90,
      nick: null,
      origin: 'starter',
      hpNow: 12,
      moves: ['bump', 'flick_flame'],
    },
    {
      id: 'petsmoke2',
      species: 'tide',
      stage: 0,
      xp: 0,
      bx: 64,
      hunger: 80,
      happy: 70,
      energy: 80,
      nick: null,
      origin: 'wild',
    },
  ];
  save.partnerId = 'petsmoke1';
  save.bag = { heal_snack: 1 };
  save.dex.seen['tide/0'] = true;
  save.dex.caught['tide/0'] = true;
  return save;
}

test('walkling sheet opens from the collection, heals, renames, reorders moves, and closes', async ({ page }) => {
  await installSave(page.context(), sheetSave(), { quietDay: true });
  await gotoGame(page);
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.state && window.PixelPets.state.party.length === 2);

  const api = await page.evaluate(() => ({
    open: typeof openWalklingSheet,
    moves: window.PixelPets.state.party[0].moves.slice(),
    hp: window.PixelPets.state.party[0].hpNow,
    snacks: window.PixelPets.state.bag.heal_snack,
  }));
  expect(api.open).toBe('function');
  expect(api.moves.length).toBeGreaterThanOrEqual(2);
  expect(api.hp).toBeLessThan(30);
  expect(api.snacks).toBe(1);

  await page.locator('#tabs button[data-tab="col"]').click();
  await expect(page.locator('#dexCount')).toContainText('Out there 57');
  await page.locator('#partyBoard .slot-main').first().click();
  await expect(page.locator('#ovWalkling')).toBeVisible();
  await expect(page.locator('#ovStats')).toBeHidden();
  await expect(page.locator('#wlName')).toHaveText('Pipkit');
  const heal = page.locator('#wlUse .wl-item', { hasText: 'Heal Snack' });
  await expect(heal).toBeVisible();
  const use = heal.locator('button', { hasText: 'USE' });
  await expect(use).toBeVisible();

  const targets = await page.evaluate(() => {
    const box = (el) => {
      const r = el.getBoundingClientRect();
      return { w: r.width, h: r.height };
    };
    const ov = document.querySelector('#ovWalkling .ov-inner');
    return {
      use: box(document.querySelector('#wlUse .wl-item button')),
      close: box(document.querySelector('#wlClose')),
      down: box(document.querySelector('#wlMoves button')),
      overflow: ov.scrollWidth > ov.clientWidth + 1,
    };
  });
  expect(targets.use.h).toBeGreaterThanOrEqual(44);
  expect(targets.use.w).toBeGreaterThanOrEqual(44);
  expect(targets.close.h).toBeGreaterThanOrEqual(44);
  expect(targets.down.h).toBeGreaterThanOrEqual(44);
  expect(targets.down.w).toBeGreaterThanOrEqual(44);
  expect(targets.overflow).toBe(false);

  const beforeHp = await page.evaluate(() => window.PixelPets.state.party[0].hpNow);
  await use.click();
  const healed = await page.evaluate(() => ({
    hp: window.PixelPets.state.party[0].hpNow,
    bag: window.PixelPets.state.bag.heal_snack || 0,
  }));
  expect(healed.bag).toBe(0);
  expect(healed.hp == null || healed.hp > beforeHp).toBe(true);

  await page.locator('#wlNick').fill('Pip');
  await page.locator('#wlNickSet').click();
  expect(await page.evaluate(() => window.PixelPets.state.party[0].nick)).toBe('Pip');

  const beforeMoves = await page.evaluate(() => window.PixelPets.state.party[0].moves.slice());
  await page.getByRole('button', { name: 'Move Bump down' }).click();
  const afterMoves = await page.evaluate(() => window.PixelPets.state.party[0].moves.slice());
  expect(afterMoves[0]).toBe(beforeMoves[1]);
  expect(afterMoves[1]).toBe(beforeMoves[0]);

  await page.keyboard.press('Escape');
  await expect(page.locator('#ovWalkling')).toBeHidden();

  const sil = page.locator('#dexGrid .cell:not(button)').first();
  await sil.click({ force: true });
  await expect(page.locator('#ovWalkling')).toBeHidden();

  await page.locator('#dexGrid button.dex-cell').first().click();
  await expect(page.locator('#ovJournal')).toBeVisible();
  await expect(page.locator('#ovWalkling')).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(page.locator('#ovJournal')).toBeHidden();

  await page.locator('#tabs button[data-tab="pet"]').click();
  await page.locator('#petStatsBtn').click();
  await expect(page.locator('#ovStats')).toBeVisible();
  await expect(page.locator('#ovWalkling')).toBeHidden();
  await expect(page.locator('#scName')).toHaveText('Pip');
});
