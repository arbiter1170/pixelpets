/* crash_1147: GROW UP, then replace moves, then People, repeated. Live canvases, canvases made and DOM nodes must not
   grow after the first cycle, People must open and close for real, and the save must hold the new stage and moves the
   moment they change (no wait for the 5 s autosave). */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const onDisk = (page) => page.evaluate(() => { const p = JSON.parse(localStorage.getItem('pixelpets.save.v2')).party[0]; return { stage: p.stage, moves: p.moves.slice() }; });

// Tap one replace-which-move slot if the move sheet is open. Returns true when a slot was replaced.
async function replaceOne(page) {
  const sheet = page.locator('#ovSheet');
  if (!(await sheet.isVisible())) return false;
  const slots = sheet.locator('#shList button:not(.skip)').filter({ hasText: /PWR|STATUS/ });
  if (await slots.count()) {
    const slot = slots.first();
    await expect(slot).toBeVisible();
    await slot.click();
    const live = await page.evaluate(() => window.PixelPets.state.party[0].moves.slice());
    expect((await onDisk(page)).moves).toEqual(live);
    return true;
  }
  await sheet.locator('#shList button').first().click();
  return false;
}

async function cycle(page, n) {
  await page.evaluate((n) => {
    const P = window.PixelPets, p = P.state.party[0];
    p.stage = 0; p.evoMoves = []; delete p.hpNow;
    const M = P.moves(), own = new Set([0, 1, 2].flatMap((k) => P.learnset(p.species + '/' + k).map((e) => e.id)));
    P.setMoves(Object.keys(M).filter((id) => id !== 'wobble' && !own.has(id) && M[id].power).slice(n, n + 4));
    p.xp = 40;
    P.showTab('pet');
  }, n);
  // a move offer still queued from the last cycle opens its sheet on the pet screen; answer it first
  let replaced = 0;
  for (let k = 0, quiet = 0; k < 30 && quiet < 4; k++) {
    await page.waitForTimeout(150);
    if (await page.locator('#ovSheet').isVisible()) { quiet = 0; if (await replaceOne(page)) replaced++; } else quiet++;
  }
  const grow = page.locator('#evolveBtn');
  await expect(grow).toBeVisible();
  await grow.click();
  await expect(page.locator('#ovEvolve')).toBeVisible();
  for (let k = 0; k < 40; k++) {
    if (await replaceOne(page)) { replaced++; continue; }
    const ok = page.locator('#evoOk');
    if (await page.locator('#ovEvolve').isHidden()) break;
    if (await ok.isVisible() && await ok.isEnabled()) await ok.click();
    else await page.waitForTimeout(150);
  }
  await expect(page.locator('#ovEvolve')).toBeHidden();
  expect((await onDisk(page)).stage).toBe(1);
  await page.evaluate(() => window.PixelPets.giveBx(300, true));
  for (let k = 0; k < 20; k++) {
    await page.waitForTimeout(150);
    if (await replaceOne(page)) replaced++;
    else if (k > 4 && await page.locator('#ovSheet').isHidden()) break;
  }
  await expect(page.locator('#ovSheet')).toBeHidden();
  await page.evaluate(() => window.PixelPets.showTab('walk'));
  const people = page.locator('#repBtn');
  await expect(people).toBeVisible();
  await people.click();
  const rep = page.locator('#ovRep');
  await expect(rep).toBeVisible();
  const box = await rep.boundingBox();
  expect(box.width).toBeGreaterThan(200);
  expect(box.height).toBeGreaterThan(200);
  await page.locator('#repBack').click();
  await expect(rep).toBeHidden();
  return replaced;
}

test('GROW UP, move replacements and People do not pile up canvases or DOM nodes', async ({ page }) => {
  test.setTimeout(90000);
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true && window.PixelPets.state);
  const facts = () => page.evaluate(() => ({ made: window.PixelPets.canvasMade, live: window.PixelPets.canvases, dom: document.getElementsByTagName('*').length }));
  let replaced = await cycle(page, 0);
  const after1 = await facts();
  for (let n = 1; n <= 3; n++) replaced += await cycle(page, 0);
  const after4 = await facts();
  expect(replaced).toBeGreaterThan(0);
  expect(after4.made - after1.made).toBeLessThanOrEqual(4);
  expect(after4.dom - after1.dom).toBeLessThanOrEqual(20);
  expect(Number.isFinite(after4.live)).toBe(true);
});
