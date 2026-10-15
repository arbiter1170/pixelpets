/* Keeper1 home icons, contacts, and the bag with a handset in it. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, playScene, shot } = require('./helpers');

trackErrors(test, expect);

function readySave() {
  const save = starterSave();
  Object.assign(save.flags, {
    'story.reached_route1': true,
    'story.phone_got': true,
    'story.met_bram': true,
  });
  save.world = { map: 'hearthmoor', x: 8, y: 9, facing: 'down', respawn: 'hearthmoor' };
  return save;
}

async function boot(page) {
  await installSave(page.context(), readySave(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets.debug === true && typeof window.PixelPets.contacts === 'function');
}

test('the phone home is icons, contacts are people you have met, and the bag opens with a handset', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.locator('#phoneBtn').click();
  await expect(page.locator('#ovPhone')).toBeVisible();
  await expect(page.locator('#phoneTitle')).toHaveText('KEEPER1');

  const apps = await page.locator('#phoneHome .phone-app').evaluateAll((els) => els.map((el) => ({
    app: el.dataset.app,
    label: el.querySelector('.phone-lab') && el.querySelector('.phone-lab').textContent,
  })));
  expect(apps).toEqual([
    { app: 'contacts', label: 'CONTACTS' },
    { app: 'notes', label: 'NOTES' },
    { app: 'walklings', label: 'WALKLINGS' },
    { app: 'friends', label: 'FRIENDS' },
    { app: 'jobs', label: 'KEEPERUAV' },
    { app: 'ribbit', label: 'RIBBIT' },
    { app: 'board', label: 'BOARD' },
  ]);
  await expect(page.locator('#phoneHome')).not.toContainText(/journal/i);
  const painted = await page.evaluate(() => [...document.querySelectorAll('#phoneHome .phone-glyph canvas')].map((c) => {
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    return d.some((v, i) => i % 4 === 3 && v > 0);
  }));
  expect(painted).toEqual([true, true, true, true, true, true, true]);
  const fit = await page.evaluate(() => {
    const shell = document.querySelector('#ovPhone .phone-shell');
    const home = document.querySelector('#phoneHome');
    return shell.scrollWidth <= shell.clientWidth + 1 && home.scrollWidth <= home.clientWidth + 1;
  });
  expect(fit).toBe(true);
  await shot(page, 'phone-icons');

  await page.locator('.phone-app[data-app="walklings"]').click();
  await expect(page.locator('#ovPhone')).toBeHidden();
  await expect(page.locator('#scr-col')).toHaveClass(/active/);

  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.locator('#phoneBtn').click();
  await page.locator('.phone-app[data-app="contacts"]').click();
  const people = await page.evaluate(() => PixelPets.contacts());
  const names = people.map((p) => p.name);
  expect(names).toEqual(['Officer Ness', 'Rook', 'Sergeant Bram', 'Warden Ilse']);
  expect(people.every((p) => p.quest)).toBe(true);
  expect(names).not.toContain('Hattie');
  await expect(page.locator('.contact-row')).toHaveCount(4);
  await expect(page.locator('.contact-row[data-quest="1"]')).toHaveCount(4);
  const rowFit = await page.evaluate(() => {
    const body = document.querySelector('#phoneBody');
    return body.scrollWidth <= body.clientWidth + 1;
  });
  expect(rowFit).toBe(true);

  await page.locator('.contact-main[data-who="Officer Ness"]').click();
  const card = page.locator('.contact-card');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Officer Ness');
  await expect(card).toContainText('QUEST');
  await expect(card).toContainText('Hearthmoor');
  await expect(card).toContainText('The House is for the watch');
  await page.locator('.contact-card .contact-star').click();
  await expect(page.locator('.contact-card .contact-star')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.contact-card .contact-star')).toHaveText('ON');
  await page.locator('[data-contact-back]').click();
  await page.locator('[data-contact-filter="fav"]').click();
  await expect(page.locator('.contact-row')).toHaveCount(1);
  await expect(page.locator('.contact-name')).toHaveText('Officer Ness');
  await shot(page, 'phone-contacts');

  await page.locator('#phoneClose').click();
  expect(await page.evaluate(() => PixelPets.runSteps([['say', 'Hattie', 'Route 1 has shy crabs by the stream.']]))).toBe(true);
  await playScene(page, []);
  const afterTalk = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('pixelpets.save.v2'));
    return { v: s.v, fav: s.phoneBook && s.phoneBook.fav, hattie: !!(s.phoneBook && s.phoneBook.met && s.phoneBook.met.Hattie) };
  });
  expect(afterTalk.v).toBe(2);
  expect(afterTalk.fav['Officer Ness']).toBe(true);
  expect(afterTalk.hattie).toBe(true);

  await page.locator('#phoneBtn').click();
  await page.locator('.phone-app[data-app="contacts"]').click();
  const hattie = page.locator('.contact-row', { hasText: 'Hattie' });
  await expect(hattie).toHaveAttribute('data-quest', '0');
  await hattie.locator('.contact-main').click();
  await expect(page.locator('.contact-card')).toContainText('Hattie');
  await expect(page.locator('.contact-card')).not.toContainText('QUEST');
  await page.locator('#phoneClose').click();

  await page.evaluate(() => {
    PixelPets.giveItem('keeper1', 1);
    PixelPets.giveItem('cracked_phone', 1);
    PixelPets.showTab('walk');
  });
  await expect(page.locator('#walkBagBtn')).toBeVisible();
  await page.locator('#walkBagBtn').click();
  await expect(page.locator('#ovBag')).toBeVisible();
  await expect(page.locator('#bagList')).toContainText('Keeper1');
  await expect(page.locator('#bagList')).toContainText('Cracked Handset');
  await shot(page, 'bag-handsets');
  await page.locator('#bagClose').click();
  await expect(page.locator('#ovBag')).toBeHidden();

  await page.evaluate(() => { PixelPets.setSide('glimmer'); PixelPets.showTab('walk'); });
  await page.locator('#phoneBtn').click();
  await expect(page.locator('#phoneTitle')).toHaveText('CRACK//HAND');
  await expect(page.locator('#phoneJobs .phone-lab')).toHaveText('BOTNET');
  await expect(page.locator('.phone-app[data-app="walklings"] .phone-lab')).toHaveText('WALKLINGS');
  const hackPainted = await page.evaluate(() => [...document.querySelectorAll('#phoneHome .phone-glyph canvas')].every((c) => {
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    return d.some((v, i) => i % 4 === 3 && v > 0);
  }));
  expect(hackPainted).toBe(true);
});
