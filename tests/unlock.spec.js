/* Unlock tips (D180) and tour step T12r. */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, playScene } = require('./helpers');

trackErrors(test, expect);

function tourArtDir() {
  if (process.env.PP_ART) return process.env.PP_ART;
  if (!tourArtDir._tmp) tourArtDir._tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'walklings-tour-'));
  return tourArtDir._tmp;
}

function tourSave(step) {
  const s = starterSave();
  delete s.flags['story.tutorial_done'];
  s.steps = 0;
  s.world = { map: 'hm_lodge_in', x: 5, y: 6, facing: 'up', respawn: 'hearthmoor' };
  s.party[0].hunger = 80;
  s.party[0].happy = 80;
  s.party[0].energy = 90;
  delete s.party[0].cd;
  if (step) s.flags['story.tutorial_step'] = step;
  return s;
}

async function shot390(page, name) {
  if (!page.viewportSize() || page.viewportSize().width !== 390) return;
  const dir = tourArtDir();
  fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, name + '.png') });
}

async function openTour(page, save) {
  await installSave(page.context(), save, { quietDay: false });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  if (save.flags['story.tutorial_step']) {
    await expect(page.locator('#tutLine')).toContainText('Finish the tour?');
    return;
  }
  await page.evaluate(() => {
    const d = new Date();
    const day = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    PixelPets.state.flags['daily.warm_bowl'] = day;
    PixelPets.showTab('walk');
  });
  expect(await page.evaluate(() => PixelPets.runSteps([['say', '', 'The baskets are quiet now.']]))).toBe(true);
  await playScene(page, []);
  await expect(page.locator('#tutCard')).toBeVisible();
}

async function walkTour(page) {
  await page.locator('#tutActs button', { hasText: 'SHOW ME' }).click();
  const opened = await page.locator('#tutLine').textContent();
  if (opened && opened.indexOf('PARTNER screen') >= 0) {
    await page.locator('#tabs button[data-tab="pet"]').click();
  }
  await expect(page.locator('#tutLine')).toContainText('FOOD drops slowly');
  for (let i = 0; i < 3; i++) await page.locator('#tutActs button', { hasText: 'NEXT' }).click();
  await expect(page.locator('#tutLine')).toContainText('Tap FEED');
  await page.locator('#scr-pet [data-act="feed"]').click();
  await expect(page.locator('#tutLine')).toContainText('Tap PLAY');
  await page.locator('#scr-pet [data-act="play"]').click();
  await expect(page.locator('#tutLine')).toContainText('Tap REST');
  await page.locator('#scr-pet [data-act="rest"]').click();
  await expect(page.locator('#tutLine')).toContainText('These hearts fill');
  await page.locator('#tutActs button', { hasText: 'NEXT' }).click();
  await expect(page.locator('#tutLine')).toContainText('Tap WALK');
  await page.locator('#tabs button[data-tab="walk"]').click();
  let compass = false;
  for (let n = 0; n < 8; n++) {
    const text = await page.locator('#tutLine').textContent();
    if (text && text.indexOf('This compass lists') >= 0) compass = true;
    const label = await page.locator('#tutActs button').first().textContent();
    if (label && label.indexOf("LET'S GO") >= 0) return compass;
    await page.locator('#tutActs button', { hasText: 'NEXT' }).click();
  }
  return compass;
}

test('setting phone_got on WALK shows the phone tip once', async ({ page }) => {
  const s = starterSave();
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.evaluate(() => { PixelPets.state.flags['story.phone_got'] = true; });
  await expect(page.locator('#unlockCard')).toBeVisible({ timeout: 4000 });
  await expect(page.locator('#unlockTitle')).toHaveText('Your phone');
  await expect(page.locator('#unlockBody')).toHaveText('Your phone has your contacts, Ribbit and the town board. Tap it any time.');
  await expect(page.locator('#unlockShow')).toHaveText('SHOW ME');
  await expect(page.locator('#unlockSkip')).toHaveText('SKIP');
  const box = await page.locator('#unlockSkip').boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(44);
  await shot390(page, 'unlock-phone');
  await page.locator('#unlockSkip').click();
  await expect(page.locator('#unlockCard')).toBeHidden();
  const seen = await page.evaluate(() => ({
    v: PixelPets.state.v,
    flag: PixelPets.state.flags['story.unlock_phone'] === true,
  }));
  expect(seen).toEqual({ v: 2, flag: true });
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForTimeout(1200);
  await expect(page.locator('#unlockCard')).toBeHidden();
});

test('Tips OFF shows nothing', async ({ page }) => {
  const s = starterSave();
  s.settings.tips = false;
  s.flags['story.phone_got'] = true;
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForTimeout(1200);
  const st = await page.evaluate(() => ({
    v: PixelPets.state.v,
    tips: PixelPets.state.settings.tips,
    up: !document.querySelector('#unlockCard').hidden,
    flag: PixelPets.state.flags['story.unlock_phone'] === true,
  }));
  expect(st).toEqual({ v: 2, tips: false, up: false, flag: false });
});

test('a cleared tour reaches T12r before T13', async ({ page }) => {
  test.setTimeout(60000);
  await openTour(page, tourSave());
  const compass = await walkTour(page);
  expect(compass).toBe(true);
  await expect(page.locator('#tutLine')).toContainText("That's the tour!");
  if (page.viewportSize() && page.viewportSize().width === 390) await shot390(page, 'tutorial-t12r-end');
});

test('a save already on T13 skips the compass step', async ({ page }) => {
  test.setTimeout(60000);
  await openTour(page, tourSave('T13'));
  const compass = await walkTour(page);
  expect(compass).toBe(false);
  await expect(page.locator('#tutLine')).toContainText("That's the tour!");
});

function carePet(id, species, extra) {
  return Object.assign({
    id,
    species,
    stage: 0,
    xp: 10,
    hunger: 80,
    happy: 80,
    energy: 90,
    nick: null,
    origin: 'wild',
    moves: ['bump'],
    evoMoves: [],
  }, extra);
}

function readySave() {
  const s = starterSave();
  s.party = [carePet('petsmoke1', 'ember', { origin: 'starter', xp: 40 })];
  s.partnerId = 'petsmoke1';
  return s;
}

async function bootSave(page, save) {
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true && window.PixelPets.state.v === 2);
}

async function finishGrowUp(page) {
  await expect(page.locator('#evolveBtn')).toBeVisible();
  await page.locator('#evolveBtn').click();
  await expect(page.locator('#evoMsg')).toContainText('grew into', { timeout: 8000 });
  for (let i = 0; i < 6; i++) {
    if (await page.locator('#ovEvolve').isHidden()) break;
    await page.locator('#evoOk').click();
    await page.waitForTimeout(40);
  }
  await expect(page.locator('#ovEvolve')).toBeHidden();
}

async function walkQuiet(page) {
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForTimeout(1500);
}

test('growing up on the Pet tab does not show the tip back on WALK', async ({ page }) => {
  test.setTimeout(60000);
  await bootSave(page, readySave());
  await expect(page.locator('#unlockCard')).toBeHidden();
  await finishGrowUp(page);
  await walkQuiet(page);
  await expect(page.locator('#unlockCard')).toBeHidden();
  await expect(page.locator('#tutLayer')).toBeHidden();
  await expect(page.locator('#evolveBtn')).toBeHidden();
  const st = await page.evaluate(() => ({
    v: PixelPets.state.v,
    flag: PixelPets.state.flags['story.unlock_growup'] === true,
    stage: PixelPets.state.party[0].stage,
    card: document.querySelector('#unlockCard').hidden === false,
  }));
  expect(st).toEqual({ v: 2, flag: true, stage: 1, card: false });
  if (page.viewportSize() && page.viewportSize().width === 390) {
    const dir = process.env.PP_ART || path.join('review-growup-tip');
    fs.mkdirSync(dir, { recursive: true });
    await page.screenshot({ path: path.join(dir, 'walk-after-growup-390.png') });
  }
});

test('a team Walkling who is not the partner does not open the grow up tip', async ({ page }) => {
  const s = starterSave();
  s.party = [
    carePet('petsmoke1', 'ember', { origin: 'starter', xp: 10 }),
    carePet('petready2', 'tide', { origin: 'wild', xp: 40 }),
  ];
  s.partnerId = 'petsmoke1';
  await bootSave(page, s);
  await walkQuiet(page);
  await expect(page.locator('#unlockCard')).toBeHidden();
  const st = await page.evaluate(() => ({
    v: PixelPets.state.v,
    flag: PixelPets.state.flags['story.unlock_growup'] === true,
    partnerReady: PixelPets.state.party[0].xp >= 40,
    mateXp: PixelPets.state.party[1].xp,
  }));
  expect(st).toEqual({ v: 2, flag: false, partnerReady: false, mateXp: 40 });
});

test('an older save with a grown starter marks the grow up tip seen', async ({ page }) => {
  test.setTimeout(60000);
  const s = starterSave();
  s.party = [carePet('petlead', 'tide', { origin: 'wild', xp: 40 })];
  s.partnerId = 'petlead';
  s.box = [carePet('petgrown', 'ember', { origin: 'starter', stage: 1, xp: 40, moves: ['bump', 'cinder_pounce'], evoMoves: [1] })];
  delete s.flags['story.unlock_growup'];
  await bootSave(page, s);
  await walkQuiet(page);
  await expect(page.locator('#unlockCard')).toBeHidden();
  const seen = await page.evaluate(() => ({
    v: PixelPets.state.v,
    flag: PixelPets.state.flags['story.unlock_growup'] === true,
  }));
  expect(seen).toEqual({ v: 2, flag: true });
  const wildOnly = await page.evaluate(() => {
    const raw = JSON.parse(JSON.stringify(PixelPets.state));
    delete raw.flags['story.unlock_growup'];
    raw.party = [{ id: 'wildgrown', species: 'tide', stage: 2, xp: 120, origin: 'wild', evoMoves: [1, 2], hunger: 80, happy: 80, energy: 90, moves: ['bump'] }];
    raw.box = [];
    raw.partnerId = 'wildgrown';
    const n = PPSave.normalizeV2(raw);
    return { flag: n.flags['story.unlock_growup'] === true, v: n.v };
  });
  expect(wildOnly).toEqual({ flag: false, v: 2 });
  await page.locator('#settingsBtn').click();
  await page.locator('#setTipsReplay').click();
  await page.locator('#setClose').click();
  await expect(page.locator('#unlockCard')).toBeVisible({ timeout: 4000 });
  await expect(page.locator('#unlockTitle')).toHaveText('Growing up');
  await expect(page.locator('#unlockBody')).toHaveText('Drizzlet is ready to grow up. You choose when.');
  const again = await page.evaluate(() => PixelPets.state.flags['story.unlock_growup'] === true && PixelPets.state.v === 2);
  expect(again).toBe(true);
});

test('an eligible partner on WALK gets the grow up tip and SHOW ME rings GROW UP', async ({ page }) => {
  await bootSave(page, readySave());
  await walkQuiet(page);
  await expect(page.locator('#unlockCard')).toBeVisible();
  await expect(page.locator('#unlockTitle')).toHaveText('Growing up');
  await expect(page.locator('#unlockBody')).toHaveText('Pipkit is ready to grow up. You choose when.');
  await page.locator('#unlockShow').click();
  await expect(page.locator('#evolveBtn')).toBeVisible();
  const ringed = await page.evaluate(() => {
    const ring = document.querySelector('#tutRing');
    const btn = document.querySelector('#evolveBtn');
    if (!ring || ring.hidden || !btn || btn.hidden) return null;
    const r = ring.getBoundingClientRect();
    const b = btn.getBoundingClientRect();
    return {
      dx: Math.abs(r.left - (b.left - 6)),
      dy: Math.abs(r.top - (b.top - 6)),
      dw: Math.abs(r.width - (b.width + 12)),
      dh: Math.abs(r.height - (b.height + 12)),
      v: PixelPets.state.v,
    };
  });
  expect(ringed).toBeTruthy();
  expect(ringed.dx).toBeLessThan(2);
  expect(ringed.dy).toBeLessThan(2);
  expect(ringed.dw).toBeLessThan(2);
  expect(ringed.dh).toBeLessThan(2);
  expect(ringed.v).toBe(2);
});
