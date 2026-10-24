/* Opening tour (D157–D160). First run, skip, replay, and an older save that skips it. */
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, playScene, artifactsDir } = require('./helpers');

trackErrors(test, expect);

function tourArtDir() {
  if (process.env.PP_ART) return process.env.PP_ART;
  return artifactsDir('walklings-tour');
}

function tourSave() {
  const s = starterSave();
  delete s.flags['story.tutorial_done'];
  s.steps = 0;
  s.world = { map: 'hm_lodge_in', x: 5, y: 6, facing: 'up', respawn: 'hearthmoor' };
  s.party[0].hunger = 80;
  s.party[0].happy = 80;
  s.party[0].energy = 90;
  delete s.party[0].cd;
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

async function layout(page) {
  return page.evaluate(() => {
    const card = document.querySelector('#tutCard');
    const line = document.querySelector('#tutLine');
    const btns = [...card.querySelectorAll('#tutActs button, #tutSkip:not([hidden])')];
    const cr = card.getBoundingClientRect();
    const ring = document.querySelector('#tutRing');
    let overlap = false;
    if (ring && !ring.hidden) {
      const rr = ring.getBoundingClientRect();
      const t = { l: rr.left + 6, t: rr.top + 6, r: rr.right - 6, b: rr.bottom - 6 };
      overlap = cr.left < t.r - 1 && cr.right > t.l + 1 && cr.top < t.b - 1 && cr.bottom > t.t + 1;
    }
    const vw = window.innerWidth, vh = window.innerHeight;
    return {
      overlap,
      inside: cr.left >= 5 && cr.top >= 5 && cr.right <= vw - 5 && cr.bottom <= vh - 5,
      buttons: btns.map(b => ({ h: b.getBoundingClientRect().height, w: b.getBoundingClientRect().width })),
      overflow: line.scrollWidth > line.clientWidth + 2 || line.scrollHeight > line.clientHeight + 2,
      text: line.textContent,
      step: document.querySelector('#tutLayer').dataset.step,
    };
  });
}

function expectLayout(box) {
  expect(box.overlap, box.step + ' card covers its target').toBe(false);
  expect(box.inside, box.step + ' card off screen').toBe(true);
  expect(box.overflow, box.step + ' text overflow').toBe(false);
  for (const b of box.buttons) expect(b.h).toBeGreaterThanOrEqual(44);
}

test('a first run walks the tour and the care buttons are real', async ({ page }) => {
  test.setTimeout(60000);
  await openTour(page, tourSave());
  await expect(page.locator('#tutLine')).toHaveText('Pipkit is your partner now! Want a quick tour of how to look after them?');
  const where = await page.evaluate(() => ({ map: PixelPets.state.world.map, steps: PixelPets.state.steps, v: PixelPets.state.v }));
  expect(where).toEqual({ map: 'hm_lodge_in', steps: 0, v: 2 });
  expectLayout(await layout(page));
  await shot390(page, 'tutorial-t0');

  await page.locator('#tutActs button', { hasText: 'SHOW ME' }).click();
  await expect(page.locator('#tutLine')).toContainText('Hold the pad to move');
  expectLayout(await layout(page));
  await shot390(page, 'tutorial-t10');
  await page.locator('#tutActs button', { hasText: 'NEXT' }).click();
  await expect(page.locator('#tutLine')).toContainText('QUEST shows');
  await page.locator('#tutActs button', { hasText: 'NEXT' }).click();
  await expect(page.locator('#tutLine')).toContainText('WALKLINGS opens your Party');
  await page.locator('#tutActs button', { hasText: 'NEXT' }).click();
  await expect(page.locator('#tutLine')).toContainText('This compass lists everyone you meet');
  expectLayout(await layout(page));
  await shot390(page, 'tutorial-t12r');
  await page.locator('#tutActs button', { hasText: 'NEXT' }).click();
  await expect(page.locator('#tutLine')).toContainText('This is the PARTNER screen');
  await page.locator('#tabs button[data-tab="pet"]').click();
  await expect(page.locator('#tutLine')).toContainText('FOOD drops slowly');
  expectLayout(await layout(page));
  await page.locator('#tutActs button', { hasText: 'NEXT' }).click();
  await expect(page.locator('#tutLine')).toContainText('NRG is energy');
  await expect(page.locator('#tutLine')).toContainText('Walking and battling are free');
  await expect(page.locator('#tutLine')).not.toContainText('battles use it');
  await page.locator('#tutActs button', { hasText: 'NEXT' }).click();
  await expect(page.locator('#tutLine')).toContainText('GROW fills');
  await page.locator('#tutActs button', { hasText: 'NEXT' }).click();

  await expect(page.locator('#tutLine')).toContainText('Tap FEED');
  expectLayout(await layout(page));
  await shot390(page, 'tutorial-t5');
  const before = await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    return { hunger: p.hunger, happy: p.happy, energy: p.energy, xp: p.xp };
  });
  await page.locator('#scr-pet [data-act="feed"]').click();
  await expect(page.locator('#toast')).toContainText('crunches the first bite');
  await expect(page.locator('#tutLine')).toContainText('Tap PLAY');
  await page.locator('#scr-pet [data-act="play"]').click();
  await expect(page.locator('#toast')).toContainText('bounces in a little circle');
  await expect(page.locator('#tutLine')).toContainText('Tap REST');
  await page.locator('#scr-pet [data-act="rest"]').click();
  await expect(page.locator('#toast')).toContainText('curls up for the first nap');
  await expect(page.locator('#tutLine')).toContainText('These hearts fill as your bond grows with Pipkit.');
  expectLayout(await layout(page));
  await shot390(page, 'tutorial-t8');
  await page.locator('#tutActs button', { hasText: 'NEXT' }).click();

  await expect(page.locator('#tutLine')).toContainText('Tap WALK');
  await page.locator('#tabs button[data-tab="walk"]').click();
  await expect(page.locator('#tutLine')).toContainText("That's the tour!");
  await expect(page.locator('#tutSkip')).toBeHidden();
  expectLayout(await layout(page));
  await shot390(page, 'tutorial-t13');
  await page.locator('#tutActs button', { hasText: "LET'S GO" }).click();
  await expect(page.locator('#tutLayer')).toBeHidden();

  const after = await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    const d = new Date();
    const day = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    return {
      v: PixelPets.state.v,
      done: PixelPets.state.flags['story.tutorial_done'] === true,
      step: PixelPets.state.flags['story.tutorial_step'] || null,
      hello: PixelPets.state.flags['daily.hello'] === day,
      helloDue: PixelPets.hello.due,
      steps: PixelPets.state.steps,
      hunger: p.hunger, happy: p.happy, energy: p.energy,
      fed: p.hunger !== 80, played: p.happy !== 80, rested: !!p.cd && !!p.cd.feed && !!p.cd.play && !!p.cd.rest,
      care: PixelPets.state.flags['story.care_feed'] === true && PixelPets.state.flags['story.care_play'] === true && PixelPets.state.flags['story.care_rest'] === true,
      xp: p.xp,
      quest: PixelPets.questCheck,
    };
  });
  expect(after.v).toBe(2);
  expect(after.done).toBe(true);
  expect(after.step).toBeNull();
  expect(after.hello).toBe(true);
  expect(after.helloDue).toBe(false);
  expect(after.steps).toBe(0);
  expect(after.fed).toBe(true);
  expect(after.played).toBe(true);
  expect(after.rested).toBe(true);
  expect(after.care).toBe(true);
  expect(after.xp).toBeGreaterThan(before.xp);
  expect(after.hunger).not.toBe(before.hunger);
  expect(after.quest).toEqual([]);
});

test('SKIP and SKIP TOUR mark the tour done', async ({ page }) => {
  await openTour(page, tourSave());
  await page.locator('#tutActs button', { hasText: 'SKIP', exact: true }).click();
  await expect(page.locator('#tutLayer')).toBeHidden();
  const skipped = await page.evaluate(() => {
    const d = new Date();
    const day = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const p = PixelPets.state.party[0];
    return {
      v: PixelPets.state.v,
      done: PixelPets.state.flags['story.tutorial_done'] === true,
      step: PixelPets.state.flags['story.tutorial_step'] || null,
      hello: PixelPets.state.flags['daily.hello'] === day,
      hunger: p.hunger, cd: p.cd || null,
    };
  });
  expect(skipped.v).toBe(2);
  expect(skipped.done).toBe(true);
  expect(skipped.step).toBeNull();
  expect(skipped.hello).toBe(true);
  expect(skipped.cd).toBeNull();
  expect(skipped.hunger).toBeGreaterThan(79);
  expect(skipped.hunger).toBeLessThanOrEqual(80);

  const again = tourSave();
  await installSave(page.context(), again, { quietDay: false });
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
  expect(await page.evaluate(() => PixelPets.runSteps([['say', '', 'The baskets are quiet now.']]))).toBe(true);
  await playScene(page, []);
  await expect(page.locator('#tutLine')).toContainText('Want a quick tour');
  await page.locator('#tutActs button', { hasText: 'SHOW ME' }).click();
  await expect(page.locator('#tutSkip')).toHaveText('SKIP TOUR');
  const mid = await layout(page);
  expect(mid.buttons.every(b => b.h >= 44)).toBe(true);
  await page.locator('#tutSkip').click();
  await expect(page.locator('#tutSkip')).toHaveText('TAP AGAIN TO SKIP');
  await expect(page.locator('#tutLayer')).toBeVisible();
  await page.locator('#tutSkip').click();
  await expect(page.locator('#tutLayer')).toBeHidden();
  const midDone = await page.evaluate(() => ({
    v: PixelPets.state.v,
    done: PixelPets.state.flags['story.tutorial_done'] === true,
    step: PixelPets.state.flags['story.tutorial_step'] || null,
  }));
  expect(midDone).toEqual({ v: 2, done: true, step: null });
});

test('Settings replay highlights care and does not spend it', async ({ page }) => {
  test.setTimeout(45000);
  const save = starterSave();
  save.party[0].hunger = 80;
  save.party[0].happy = 80;
  save.party[0].energy = 90;
  delete save.party[0].cd;
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.locator('#settingsBtn').click();
  await expect(page.locator('#setTutorial .set-lab')).toHaveText('Tutorial');
  await expect(page.locator('#setTutorial .set-val')).toHaveText('REPLAY');
  await page.locator('#setTutorial').scrollIntoViewIfNeeded();
  await expect(page.locator('#setBuild')).toBeInViewport();
  await shot390(page, 'tutorial-settings');
  const before = await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    return { hunger: p.hunger, happy: p.happy, energy: p.energy, xp: p.xp, cd: p.cd || null, care: PixelPets.state.flags['story.care_feed'] || null };
  });
  await page.locator('#setTutorial').click();
  await page.locator('#shList .sh-item', { hasText: 'Opening tour' }).click();
  await expect(page.locator('#ovSettings')).toBeHidden();
  await expect(page.locator('#tutLine')).toContainText('Hold the pad to move');
  await expect(page.locator('#tutLine')).not.toContainText('Want a quick tour');
  for (let i = 0; i < 4; i++) await page.locator('#tutActs button', { hasText: 'NEXT' }).click();
  await expect(page.locator('#tutLine')).toContainText('This is the PARTNER screen');
  await page.locator('#tabs button[data-tab="pet"]').click();
  for (let i = 0; i < 3; i++) await page.locator('#tutActs button', { hasText: 'NEXT' }).click();
  await expect(page.locator('#tutLine')).toContainText('Tap FEED');
  await expect(page.locator('#tutActs button', { hasText: 'NEXT' })).toBeVisible();
  expectLayout(await layout(page));
  await shot390(page, 'tutorial-replay-t5');
  for (let n = 0; n < 14 && await page.locator('#tutLayer').isVisible(); n++) {
    const text = await page.locator('#tutLine').textContent();
    if (text && text.indexOf('Tap WALK') >= 0) {
      await page.locator('#tabs button[data-tab="walk"]').click();
      continue;
    }
    const label = await page.locator('#tutActs button').first().textContent();
    if (label && label.indexOf("LET'S GO") >= 0) { await page.locator('#tutActs button').click(); break; }
    await page.locator('#tutActs button', { hasText: 'NEXT' }).click();
  }
  await expect(page.locator('#tutLayer')).toBeHidden();
  const after = await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    return {
      v: PixelPets.state.v,
      hunger: p.hunger, happy: p.happy, energy: p.energy, xp: p.xp,
      cd: p.cd || null,
      care: PixelPets.state.flags['story.care_feed'] || null,
      done: PixelPets.state.flags['story.tutorial_done'] === true,
    };
  });
  expect(after.v).toBe(2);
  expect(after.done).toBe(true);
  expect(Math.abs(after.hunger - before.hunger)).toBeLessThan(2);
  expect(Math.abs(after.happy - before.happy)).toBeLessThan(2);
  expect(Math.abs(after.energy - before.energy)).toBeLessThan(2);
  expect(after.xp).toBe(before.xp);
  expect(after.cd).toBeNull();
  expect(after.care).toBeNull();
});

test('an older save is marked done and does not see the tour @w1', async ({ browser }) => {
  const cases = [
    s => { s.steps = 17; },
    s => { s.flags['story.early_done'] = true; },
    s => { s.flags['story.rival1_done'] = true; },
  ];
  for (const tweak of cases) {
    const s = starterSave();
    delete s.flags['story.tutorial_done'];
    s.flags['story.tutorial_step'] = 'T6';
    s.steps = 0;
    tweak(s);
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', err => errors.push(err.message));
    await installSave(context, s, { quietDay: true });
    await gotoGame(page);
    await page.waitForTimeout(700);
    const st = await page.evaluate(() => ({
      v: PixelPets.state.v,
      done: PixelPets.state.flags['story.tutorial_done'] === true,
      step: PixelPets.state.flags['story.tutorial_step'] || null,
      up: !document.querySelector('#tutLayer').hidden,
    }));
    expect(st).toEqual({ v: 2, done: true, step: null, up: false });
    expect(errors).toEqual([]);
    await context.close();
  }
});

test('closing mid-tour offers to finish once @w1', async ({ page }) => {
  const s = tourSave();
  s.flags['story.tutorial_step'] = 'T6';
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page);
  await expect(page.locator('#tutLine')).toHaveText('Finish the tour? It only takes a minute.');
  await page.locator('#tutActs button', { hasText: 'SKIP', exact: true }).click();
  const st = await page.evaluate(() => ({
    v: PixelPets.state.v,
    done: PixelPets.state.flags['story.tutorial_done'] === true,
    step: PixelPets.state.flags['story.tutorial_step'] || null,
  }));
  expect(st).toEqual({ v: 2, done: true, step: null });
});

test('modern replay names the heart glow on the hearts step (D154 shipped)', async ({ page }) => {
  test.setTimeout(45000);
  const save = starterSave();
  save.settings = Object.assign({}, save.settings, { controls: 'modern' });
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.locator('#gearFloat').click();
  await page.locator('#setTutorial').click();
  await page.locator('#shList .sh-item', { hasText: 'Opening tour' }).click();
  await expect(page.locator('#tutLine')).toContainText('Tap the map to walk');
  for (let i = 0; i < 4; i++) await page.locator('#tutActs button', { hasText: 'NEXT' }).click();
  await expect(page.locator('#tutLine')).toContainText('This is the PARTNER screen');
  await page.locator('#petFloat').click();
  for (let i = 0; i < 6; i++) await page.locator('#tutActs button', { hasText: 'NEXT' }).click();
  await expect(page.locator('#tutLine')).toHaveText('These hearts fill as your bond grows. If the heart button glows, Pipkit needs FOOD or REST.');
  expectLayout(await layout(page));
  await shot390(page, 'tutorial-t8-modern');
  await page.locator('#tutSkip').click();
  await page.locator('#tutSkip').click();
  await expect(page.locator('#tutLayer')).toBeHidden();
});

// Oct 19 playtest: after SHOW ME, a tap that missed PARTNER (T1) or landed low on the T2 card hit the full-width
// SKIP TOUR strip and ended the whole tour. One stray tap must not end it; the tour stays on its step.
test('a stray tap on the card after SHOW ME does not end the tour (modern)', async ({ page }) => {
  const s = tourSave();
  s.settings = Object.assign({}, s.settings, { controls: 'modern' });
  await openTour(page, s);
  await page.locator('#tutActs button', { hasText: 'SHOW ME' }).click();
  await expect(page.locator('#tutLine')).toContainText('Tap the map to walk');
  const focused = await page.evaluate(() => document.activeElement && document.activeElement.id);
  expect(focused).not.toBe('tutSkip');
  const tapLow = async () => {
    const c = await page.locator('#tutCard').boundingBox();
    const k = await page.locator('#tutSkip').boundingBox();
    expect(k.width).toBeLessThan(c.width / 2);
    await page.touchscreen.tap(c.x + c.width - 20, c.y + c.height - 8);
    await page.touchscreen.tap(c.x + c.width - 20, k.y + k.height / 2);
  };
  await tapLow();
  await expect(page.locator('#tutLayer')).toBeVisible();
  await expect(page.locator('#tutLine')).toContainText('Tap the map to walk');
  await tapLow();
  await page.locator('#tutSkip').click();   // one deliberate tap only arms it
  await expect(page.locator('#tutSkip')).toHaveText('TAP AGAIN TO SKIP');
  await page.waitForTimeout(3200);
  await expect(page.locator('#tutSkip')).toHaveText('SKIP TOUR');
  const st = await page.evaluate(() => ({
    on: PixelPets.tutorial.on, id: PixelPets.tutorial.id,
    done: PixelPets.state.flags['story.tutorial_done'] === true,
    step: PixelPets.state.flags['story.tutorial_step'] || null,
  }));
  expect(st).toEqual({ on: true, id: 'T10m', done: false, step: 'T10' });
});
