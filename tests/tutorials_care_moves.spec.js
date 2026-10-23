/* TUTORIALS_CARE_MOVES (D584-D598). Care walk, moves lesson, type chart, Settings chooser. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, artifactsDir } = require('./helpers');
const fs = require('fs');
const path = require('path');

trackErrors(test, expect);

function saveAt(extra) {
  const s = starterSave();
  s.steps = 0;
  s.flags['story.early_done'] = true;
  s.flags['story.tutorial_done'] = true;
  s.settings.tips = true;
  s.settings.follower = true;
  s.party[0].hunger = 80;
  s.party[0].happy = 80;
  s.party[0].energy = 90;
  delete s.party[0].cd;
  Object.assign(s.flags, extra || {});
  return s;
}

async function boot(page, save, search) {
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page, search || '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
}

async function lesson(page) {
  return page.evaluate(() => PixelPets.lesson());
}

async function exitLodge(page) {
  await page.evaluate(() => PixelPets.goto('hm_lodge_in', 5, 7, 'down'));
  await page.evaluate(() => PixelPets.walkStep('down'));
}

async function tapFollower(page) {
  const spot = await page.evaluate(() => {
    const c = document.querySelector('#mapCanvas');
    const cam = PixelPets.walk.cam;
    const f = PixelPets.follower;
    const k = c.getBoundingClientRect().width / c.width;
    return { x: (f.fx * 16 - cam.x + 8) * k, y: (f.fy * 16 - cam.y + 8) * k };
  });
  await page.locator('#mapCanvas').click({ position: { x: spot.x, y: spot.y } });
}

async function rearmCare(page) {
  const skip = page.locator('#tutSkip');
  if (await skip.isVisible().catch(() => false)) {
    await skip.click();
    await skip.click();
  }
  await page.evaluate(() => {
    const s = PixelPets.state;
    s.flags['story.tut_care'] = 'armed';
    delete s.flags['story.tut_care_step'];
  });
  const close = page.locator('#ctClose');
  if (await close.isVisible().catch(() => false)) await close.click();
}

async function flags(page) {
  return page.evaluate(() => {
    const s = PixelPets.state;
    return { v: s.v, care: s.flags['story.tut_care'] || null, step: s.flags['story.tut_care_step'] || null, moves: s.flags['story.tut_moves'] || null, hit: s.flags['story.tut_moves_hit'] || null, n: s.flags['story.tut_moves_n'] || 0, hunger: s.party[0].hunger, happy: s.party[0].happy, energy: s.party[0].energy };
  });
}

async function finishStarter(page) {
  const started = await page.evaluate(() => PixelPets.runScene('starter'));
  expect(started).toBe(true);
  for (let i = 0; i < 80; i++) {
    const open = await page.evaluate(() => !!PixelPets.scene);
    if (!open) return;
    const basket = await page.locator('#ovBasket').isVisible().catch(() => false);
    if (basket) {
      const card = await page.locator('#bkCard').isVisible().catch(() => false);
      await page.waitForFunction(() => PixelPets.optionsReady === true, { timeout: 3000 }).catch(() => {});
      if (!card) await page.locator('#bkRow button').first().click();
      else await page.locator('#bkYes').click();
      await page.waitForTimeout(100);
      continue;
    }
    if (await page.locator('#sbName').isVisible().catch(() => false)) {
      const skip = page.locator('#sbNameSkip');
      if (await skip.isVisible().catch(() => false)) await skip.click();
      else await page.locator('#sbOk').click();
      await page.waitForTimeout(80);
      continue;
    }
    const mode = await page.evaluate(() => { const s = PixelPets.scene; return s && s.mode; });
    if (mode === 'choice') {
      await page.waitForFunction(() => PixelPets.optionsReady === true, { timeout: 3000 }).catch(() => {});
      await page.locator('#sbChoices button').first().click();
      await page.waitForTimeout(80);
      continue;
    }
    if (mode === 'say') {
      await page.locator('#sbSkip').click().catch(async () => { await page.keyboard.press('Space'); });
      await page.waitForTimeout(40);
      continue;
    }
    await page.waitForTimeout(80);
  }
  throw new Error('starter scene did not end');
}

async function openWild(page, form, level) {
  await page.evaluate(({ form, level }) => {
    PixelPets.battle.textMs = 0;
    PixelPets.battle.animMs = 0;
    PixelPets.forceBattle(form, level || 3);
  }, { form, level });
  await page.waitForFunction(() => PixelPets.battle && PixelPets.battle.state === 'CHOOSE', { timeout: 8000 });
}

async function clickCard(page, label) {
  await page.locator('#tutActs button', { hasText: label }).click();
}

test('T-C1 starter scene arms both lessons and keeps v 2', async ({ page }) => {
  await boot(page, saveAt());
  await finishStarter(page);
  const f = await flags(page);
  expect(f.care).toBe('armed');
  expect(f.moves).toBe('armed');
  expect(f.v).toBe(2);
});

test('T-C2 the act starts on Hearthmoor after the lodge mat, not inside', async ({ page }) => {
  await boot(page, saveAt({ 'story.tut_care': 'armed', 'story.tut_moves': 'armed' }));
  await page.evaluate(() => PixelPets.goto('hm_lodge_in', 5, 7, 'down'));
  await page.waitForTimeout(400);
  expect((await lesson(page)).phase).toBe('');
  expect((await page.evaluate(() => PixelPets.mapInfo.id))).toBe('hm_lodge_in');
  await page.evaluate(() => PixelPets.walkStep('down'));
  await page.waitForFunction(() => PixelPets.lesson().phase === 'c1', { timeout: 8000 });
  const where = await page.evaluate(() => {
    const door = (PixelPets.mapObjs || []).find(o => o.id === 'hm_lodge');
    return { map: PixelPets.mapInfo.id, x: PixelPets.state.world.x, y: PixelPets.state.world.y, doorX: door && door.x, doorY: door && door.y };
  });
  expect(where.map).toBe('hearthmoor');
  expect(where.x).toBe(where.doorX);
  expect(where.y).toBe(where.doorY);
  const L = await lesson(page);
  expect(L.card).toBe('C1');
  expect(L.soft).toBe(true);
});

test('T-C3 a second Walkling does not fire the act', async ({ page }) => {
  await boot(page, saveAt({ 'story.tut_care': 'armed' }));
  await page.evaluate(() => { PixelPets.fillParty(); });
  expect((await page.evaluate(() => PixelPets.state.party.length))).toBeGreaterThan(1);
  expect((await lesson(page)).phase).toBe('');
  await exitLodge(page);
  await page.waitForFunction(() => PixelPets.lesson().phase === 'c1', { timeout: 8000 });
});

test('T-C4 staged balloon and hops leave FOOD alone', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, 'shot is 390');
  await boot(page, saveAt({ 'story.tut_care': 'armed' }));
  await page.evaluate(() => PixelPets.applyCtl('modern', false));
  const before = (await flags(page)).hunger;
  await exitLodge(page);
  await page.waitForFunction(() => PixelPets.lesson().phase === 'act' || PixelPets.lesson().phase === 'c1');
  let sawHop = false, sawBalloon = false;
  for (let i = 0; i < 30; i++) {
    const L = await lesson(page);
    const bub = await page.evaluate(() => PixelPets.needBubble());
    if (L.hop > 0) sawHop = true;
    if (bub && bub.bubble && bub.bubble.glyph === 'emote_hungry') sawBalloon = true;
    if (L.phase === 'c1') break;
    await page.waitForTimeout(80);
  }
  await page.waitForFunction(() => PixelPets.lesson().card === 'C1');
  const L = await lesson(page);
  expect(sawBalloon).toBe(true);
  expect(sawHop).toBe(true);
  expect(L.age).toBeGreaterThanOrEqual(2300);
  expect((await flags(page)).hunger).toBeCloseTo(before, 0);
  const dir = artifactsDir('tutorials-care-moves');
  fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, 'care-c1-390.png') });
});

test('T-C5 reduced motion holds the follower hop at 0', async ({ page, context }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await boot(page, saveAt({ 'story.tut_care': 'armed' }));
  await exitLodge(page);
  await page.waitForFunction(() => PixelPets.lesson().phase === 'c1', { timeout: 8000 });
  const hops = [];
  for (let i = 0; i < 8; i++) {
    hops.push((await lesson(page)).hop);
    await page.waitForTimeout(100);
  }
  expect(hops.every(h => h === 0)).toBe(true);
  const anim = await page.evaluate(() => getComputedStyle(document.querySelector('#tutCard')).animationName);
  expect(anim === 'none' || anim === '').toBe(true);
});

test('T-C6 modern follower and strip taps open C2', async ({ page }) => {
  await boot(page, saveAt({ 'story.tut_care': 'armed' }));
  await page.evaluate(() => PixelPets.applyCtl('modern', false));
  await exitLodge(page);
  await page.waitForFunction(() => PixelPets.lesson().card === 'C1');
  await tapFollower(page);
  await page.waitForFunction(() => (PixelPets.lesson().card || '').indexOf('C2') === 0);
  expect((await lesson(page)).step).toBe('C2');
  await rearmCare(page);
  await exitLodge(page);
  await page.waitForFunction(() => PixelPets.lesson().card === 'C1', { timeout: 8000 });
  await page.locator('#petStrip').click();
  await page.waitForFunction(() => (PixelPets.lesson().card || '').indexOf('C2') === 0);
  expect((await lesson(page)).step).toBe('C2');
});

test('T-C7 arcade rings only the follower', async ({ page }) => {
  await boot(page, saveAt({ 'story.tut_care': 'armed' }));
  await page.evaluate(() => PixelPets.applyCtl('arcade'));
  await exitLodge(page);
  await page.waitForFunction(() => PixelPets.lesson().card === 'C1');
  expect(await page.evaluate(() => document.body.classList.contains('ctl-modern'))).toBe(false);
  const ringOnFollower = await page.evaluate(() => {
    const ring = document.querySelector('#tutRing');
    const c = document.querySelector('#mapCanvas');
    const cam = PixelPets.walk.cam;
    const f = PixelPets.follower;
    const k = c.getBoundingClientRect().width / c.width;
    const fx = (f.fx * 16 - cam.x + 8) * k + c.getBoundingClientRect().left;
    const fy = (f.fy * 16 - cam.y + 8) * k + c.getBoundingClientRect().top;
    const r = ring.getBoundingClientRect();
    const strip = document.querySelector('#petStrip').getBoundingClientRect();
    const onFollower = fx >= r.left && fx <= r.right && fy >= r.top && fy <= r.bottom;
    const onStrip = strip.width > 2 && r.left < strip.right && r.right > strip.left && r.top < strip.bottom && r.bottom > strip.top;
    return { shown: !ring.hidden, onFollower, onStrip };
  });
  expect(ringOnFollower.shown).toBe(true);
  expect(ringOnFollower.onFollower).toBe(true);
  expect(ringOnFollower.onStrip).toBe(false);
  await tapFollower(page);
  await page.waitForFunction(() => (PixelPets.lesson().card || '').indexOf('C2') === 0);
});

test('T-C8 FEED PLAY and REST run and the card waits', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page, saveAt({ 'story.tut_care': 'wait', 'story.tut_care_step': 'C2' }));
  await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    p.hunger = 40; p.happy = 40; p.energy = 40; delete p.cd;
    PixelPets.showTab('walk');
  });
  await page.evaluate(() => { const b = document.querySelector('#petStrip'); if (b && !b.hidden) b.click(); });
  // Arcade: open the tray by tapping isn't easy. Call the same door the strip uses.
  await page.evaluate(() => {
    if (document.querySelector('#careTray').hidden) document.querySelector('#petStrip') && document.querySelector('#petStrip').click();
  });
  if ((await lesson(page)).card !== 'C2') {
    await page.evaluate(() => PixelPets.applyCtl('modern', false));
    await page.locator('#petStrip').click();
  }
  await page.waitForFunction(() => PixelPets.lesson().card === 'C2');
  await page.locator('#careTray [data-act="feed"]').click();
  await page.waitForFunction(() => PixelPets.lesson().card === 'C3', { timeout: 8000 });
  expect(await page.evaluate(() => !!PixelPets.state.flags['story.care_feed'])).toBe(true);
  await page.locator('#careTray [data-act="play"]').click();
  await page.waitForFunction(() => PixelPets.lesson().card === 'C4', { timeout: 8000 });
  await page.locator('#careTray [data-act="rest"]').click();
  await page.waitForFunction(() => PixelPets.lesson().card === 'C5', { timeout: 8000 });
});

test('T-C9 blocked FEED and REST show the x lines', async ({ page }) => {
  await boot(page, saveAt({ 'story.tut_care': 'wait', 'story.tut_care_step': 'C2' }));
  await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    p.hunger = 80; p.energy = 100; p.happy = 80;
    p.cd = { feed: Date.now(), play: Date.now() };
    PixelPets.applyCtl('modern', false);
  });
  const before = await flags(page);
  await page.locator('#petStrip').click();
  await page.waitForFunction(() => PixelPets.lesson().card === 'C2x');
  await clickCard(page, 'NEXT');
  await page.waitForFunction(() => (PixelPets.lesson().card || '').indexOf('C3') === 0);
  await clickCard(page, 'NEXT');
  await page.waitForFunction(() => PixelPets.lesson().card === 'C4x');
  const after = await flags(page);
  expect(after.hunger).toBeCloseTo(before.hunger, 0);
  expect(after.energy).toBeCloseTo(before.energy, 0);
  expect(after.happy).toBeCloseTo(before.happy, 0);
});

test('T-C10 GOT IT leaves the tray open and clears the step', async ({ page }) => {
  await boot(page, saveAt({ 'story.tut_care': 'wait', 'story.tut_care_step': 'C5' }));
  await page.evaluate(() => PixelPets.applyCtl('modern', false));
  await page.locator('#petStrip').click();
  await page.waitForFunction(() => PixelPets.lesson().card === 'C5');
  await clickCard(page, 'NEXT');
  await page.waitForFunction(() => PixelPets.lesson().card === 'C6');
  await clickCard(page, 'NEXT');
  await page.waitForFunction(() => PixelPets.lesson().card === 'C7');
  await clickCard(page, 'GOT IT');
  const f = await flags(page);
  expect(f.care).toBe('done');
  expect(f.step).toBe(null);
  expect(await page.locator('#careTray').isVisible()).toBe(true);
  expect(await page.locator('#tutCard').isVisible()).toBe(false);
});

test('T-C11 nudges at 8s and 20s', async ({ page }) => {
  test.setTimeout(40000);
  await boot(page, saveAt({ 'story.tut_care': 'armed' }));
  await exitLodge(page);
  await page.waitForFunction(() => PixelPets.lesson().card === 'C1');
  await page.waitForFunction(() => PixelPets.lesson().card === 'C1n', { timeout: 15000 });
  const mid = await lesson(page);
  expect(mid.c1).toBeGreaterThanOrEqual(7000);
  await page.waitForTimeout(13000);
  const late = await lesson(page);
  expect(late.card).toBe('C1n');
  expect(late.c1).toBeGreaterThanOrEqual(19000);
});

test('T-C12 24 steps fall back to wait and the next tray starts at C2', async ({ page }) => {
  await boot(page, saveAt({ 'story.tut_care': 'armed' }));
  await page.evaluate(() => PixelPets.applyCtl('modern', false));
  await exitLodge(page);
  await page.waitForFunction(() => PixelPets.lesson().card === 'C1');
  await page.evaluate(() => {
    for (let i = 0; i < 30; i++) PixelPets.walkStep(i % 2 ? 'up' : 'down');
  });
  await page.waitForFunction(() => PixelPets.lesson().care === 'wait');
  expect(await page.locator('#toast').textContent()).toContain('any time');
  await page.locator('#petStrip').click();
  await page.waitForFunction(() => (PixelPets.lesson().card || '').indexOf('C2') === 0);
});

test('T-C13 45 seconds falls back the same way', async ({ page }) => {
  test.setTimeout(70000);
  await boot(page, saveAt({ 'story.tut_care': 'armed' }));
  await exitLodge(page);
  await page.waitForFunction(() => PixelPets.lesson().card === 'C1');
  await page.waitForFunction(() => PixelPets.lesson().care === 'wait', { timeout: 55000 });
  expect((await lesson(page)).card).toBe('');
});

test('T-C14 a scene during C1 falls back and does not cover the scene', async ({ page }) => {
  await boot(page, saveAt({ 'story.tut_care': 'armed' }));
  await exitLodge(page);
  await page.waitForFunction(() => PixelPets.lesson().card === 'C1');
  await page.evaluate(() => PixelPets.runSteps([['say', 'Rook', 'Meet me at the east gate!']]));
  await page.waitForFunction(() => !!PixelPets.scene);
  expect((await lesson(page)).care).toBe('wait');
  expect(await page.locator('#tutCard').isVisible()).toBe(false);
  await page.keyboard.press('Space');
});

test('T-C15 closing the tray keeps the step', async ({ page }) => {
  await boot(page, saveAt({ 'story.tut_care': 'wait', 'story.tut_care_step': 'C3' }));
  await page.evaluate(() => PixelPets.applyCtl('modern', false));
  await page.locator('#petStrip').click();
  await page.waitForFunction(() => (PixelPets.lesson().card || '').indexOf('C3') === 0);
  await page.locator('#ctClose').click();
  expect((await lesson(page)).card).toBe('');
  expect((await flags(page)).step).toBe('C3');
  await page.locator('#petStrip').click();
  await page.waitForFunction(() => (PixelPets.lesson().card || '').indexOf('C3') === 0);
});

test('T-C16 T5 T6 and T7 are look-only while the care walk is armed', async ({ page }) => {
  const s = saveAt({ 'story.tut_care': 'armed' });
  delete s.flags['story.tutorial_done'];
  delete s.flags['story.early_done'];
  s.flags['story.early_steps'] = 0;
  await boot(page, s);
  await page.evaluate(() => PixelPets.runSteps([['say', '', 'The baskets are quiet now.']]));
  await page.locator('#sbSkip').click();
  await page.waitForFunction(() => document.querySelector('#tutLayer').dataset.step === 'T0');
  await page.locator('#tutActs button', { hasText: 'SHOW ME' }).click();
  await page.waitForFunction(() => document.querySelector('#tutLayer').dataset.step === 'T1');
  await page.locator('#tabs button[data-tab="pet"]').click();
  await page.waitForFunction(() => document.querySelector('#tutLayer').dataset.step === 'T2');
  await page.locator('#tutActs button', { hasText: 'NEXT' }).click();
  await page.waitForFunction(() => document.querySelector('#tutLayer').dataset.step === 'T3');
  await page.locator('#tutActs button', { hasText: 'NEXT' }).click();
  await page.waitForFunction(() => document.querySelector('#tutLayer').dataset.step === 'T4');
  await page.locator('#tutActs button', { hasText: 'NEXT' }).click();
  await page.waitForFunction(() => document.querySelector('#tutLayer').dataset.step === 'T5');
  const text = await page.locator('#tutLine').textContent();
  expect(text).toContain('Tap FEED to fill FOOD.');
  expect(await page.locator('#tutActs button', { hasText: 'NEXT' }).count()).toBe(1);
  const cd = await page.evaluate(() => PixelPets.state.party[0].cd || null);
  await page.locator('#tutActs button', { hasText: 'NEXT' }).click();
  await page.waitForFunction(() => document.querySelector('#tutLayer').dataset.step === 'T6');
  expect(await page.locator('#tutActs button', { hasText: 'NEXT' }).count()).toBe(1);
  await page.locator('#tutActs button', { hasText: 'NEXT' }).click();
  await page.waitForFunction(() => document.querySelector('#tutLayer').dataset.step === 'T7');
  expect(await page.locator('#tutActs button', { hasText: 'NEXT' }).count()).toBe(1);
  const cd2 = await page.evaluate(() => PixelPets.state.party[0].cd || null);
  expect(cd2).toEqual(cd);
});

test('T-C17 Tips off plays the act once and stays quiet', async ({ page }) => {
  const s = saveAt({ 'story.tut_care': 'armed' });
  s.settings.tips = false;
  await boot(page, s);
  await exitLodge(page);
  await page.waitForFunction(() => PixelPets.lesson().care === 'quiet', { timeout: 8000 });
  expect(await page.locator('#tutCard').isVisible()).toBe(false);
  expect(await page.locator('#toast').textContent()).toContain('any time');
  await page.evaluate(() => PixelPets.applyCtl('modern', false));
  await page.locator('#petStrip').click();
  await page.waitForTimeout(300);
  expect((await lesson(page)).card).toBe('');
});

test('T-C18 an existing save gains no care key at the door', async ({ page }) => {
  await boot(page, saveAt());
  const before = await page.evaluate(() => Object.keys(PixelPets.state.flags).slice().sort());
  expect(before.includes('story.tut_care')).toBe(false);
  await exitLodge(page);
  await page.waitForTimeout(1200);
  const after = await page.evaluate(() => Object.keys(PixelPets.state.flags));
  expect(after.includes('story.tut_care')).toBe(false);
  expect((await lesson(page)).phase).toBe('');
});

test('T-C19 a party tip waits until the care walk ends', async ({ page }) => {
  await boot(page, saveAt({ 'story.tut_care': 'done' }));
  await page.evaluate(() => { PixelPets.fillParty(); PixelPets.applyCtl('modern', false); });
  await page.evaluate(() => PixelPets.replayTour && null);
  // Settings path is T-S1. Here, open the look-only walk before the party tip's calm ends.
  await page.evaluate(() => {
    PixelPets.showTab('walk');
  });
  await page.locator('#gearFloat').click();
  await page.locator('#setTutorial').click();
  await page.locator('#shList .sh-item', { hasText: 'Care walk' }).click();
  await page.waitForFunction(() => (PixelPets.lesson().card || '').indexOf('C2') === 0);
  expect(await page.locator('#unlockCard').isVisible()).toBe(false);
  for (let i = 0; i < 6; i++) await clickCard(page, i === 5 ? 'GOT IT' : 'NEXT');
  await page.waitForFunction(() => PixelPets.lesson().card === '');
  await page.waitForFunction(() => !document.querySelector('#unlockCard').hidden, { timeout: 4000 });
  expect(await page.locator('#unlockTitle').textContent()).toContain('Your Party');
});

test('T-C20 the desk frame keeps the card inside the game column', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, 'once');
  await page.setViewportSize({ width: 1440, height: 900 });
  await boot(page, saveAt({ 'story.tut_care': 'armed' }));
  await page.evaluate(() => PixelPets.applyCtl('modern', false));
  await exitLodge(page);
  await page.waitForFunction(() => PixelPets.lesson().card === 'C1');
  const box = await page.evaluate(() => {
    const app = document.querySelector('#app').getBoundingClientRect();
    const card = document.querySelector('#tutCard').getBoundingClientRect();
    return { app, card };
  });
  expect(box.card.left).toBeGreaterThanOrEqual(box.app.left - 1);
  expect(box.card.right).toBeLessThanOrEqual(box.app.right + 1);
  expect(box.card.width).toBeLessThanOrEqual(375);
});

test('T-C21 card buttons are at least 44 px', async ({ page }) => {
  await boot(page, saveAt({ 'story.tut_care': 'wait', 'story.tut_care_step': 'C5' }));
  await page.evaluate(() => PixelPets.applyCtl('modern', false));
  await page.locator('#petStrip').click();
  await page.waitForFunction(() => PixelPets.lesson().card === 'C5');
  const box = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('#tutActs button, #tutSkip')].filter(b => !b.hidden);
    return btns.map(b => { const r = b.getBoundingClientRect(); return { w: r.width, h: r.height }; });
  });
  for (const b of box) {
    expect(b.h).toBeGreaterThanOrEqual(44);
    expect(b.w).toBeGreaterThanOrEqual(44);
  }
});

test('T-M1 M1 shows at the first choose and not during the intro', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, 'shot is 390');
  await boot(page, saveAt({ 'story.tut_moves': 'armed' }));
  await page.evaluate(() => { PixelPets.battle.textMs = 0; PixelPets.battle.animMs = 0; PixelPets.forceBattle('tide/0', 3); });
  await page.waitForFunction(() => PixelPets.battle.state === 'INTRO' || PixelPets.battle.state === 'CHOOSE');
  const during = await page.evaluate(() => ({ state: PixelPets.battle.state, card: PixelPets.lesson().card }));
  if (during.state === 'INTRO') expect(during.card).toBe('');
  await page.waitForFunction(() => PixelPets.lesson().card === 'M1');
  expect((await lesson(page)).q).toBe(0);
  const dir = artifactsDir('tutorials-care-moves');
  fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, 'moves-m1-390.png') });
});

test('T-M2 a holder battle shows no card and does not count', async ({ page }) => {
  await boot(page, saveAt({ 'story.tut_moves': 'armed', 'story.tut_moves_n': 0 }));
  const started = await page.evaluate(() => {
    PixelPets.battle.textMs = 0;
    PixelPets.battle.animMs = 0;
    return PixelPets.forceTrainer('rival1_rook');
  });
  expect(started).toBe(true);
  await page.waitForFunction(() => PixelPets.battle.state === 'CHOOSE', { timeout: 8000 });
  const L = await lesson(page);
  expect(L.card).toBe('');
  expect(L.n).toBe(0);
  expect(await page.evaluate(() => PixelPets.battle.kind)).toBe('trainer');
  await page.evaluate(() => PixelPets.battle.close());
});

test('T-M3 the matchup line follows typeMult', async ({ page }) => {
  await boot(page, saveAt({ 'story.tut_moves': 'armed' }));
  const pair = async (species, form, line) => {
    await page.evaluate((sp) => {
      PixelPets.state.party[0].species = sp;
      PixelPets.state.flags['story.tut_moves'] = 'armed';
    }, species);
    await openWild(page, form, 3);
    await page.waitForFunction(() => PixelPets.lesson().card === 'M1');
    await clickCard(page, 'NEXT');
    await page.waitForFunction((id) => PixelPets.lesson().card === id, line);
    await page.evaluate(() => PixelPets.battle.close());
    await page.waitForFunction(() => !PixelPets.battle.on);
  };
  await pair('ember', 'tide/0', 'M2s');
  await pair('tide', 'bloom/0', 'M2s');
  await pair('bloom', 'ember/0', 'M2s');
  await pair('ember', 'bloom/0', 'M2h');
});

test('T-M4 MOVES opens M4 and GOT IT leaves the menu open', async ({ page }) => {
  await boot(page, saveAt({ 'story.tut_moves': 'armed' }));
  await page.evaluate(() => PixelPets.setMoves(['bump', 'flick_flame', 'stoke_up']));
  await openWild(page, 'tide/0', 3);
  await page.waitForFunction(() => PixelPets.lesson().card === 'M1');
  await clickCard(page, 'NEXT');
  await clickCard(page, 'NEXT');
  await page.waitForFunction(() => PixelPets.lesson().card === 'M3');
  await page.locator('[data-bact="fight"]').click();
  await page.waitForFunction(() => PixelPets.lesson().card === 'M4p');
  await clickCard(page, 'GOT IT');
  expect(await page.locator('#btFight').isVisible()).toBe(true);
  expect((await lesson(page)).moves).toBe('p1');
  const before = await page.evaluate(() => PixelPets.battle.log.length);
  await page.locator('#btMoves button').first().click();
  await page.waitForFunction((n) => PixelPets.battle.log.length > n || PixelPets.battle.state !== 'CHOOSE', before);
});

test('T-M5 part 2 and the chart return to choose', async ({ page }) => {
  await boot(page, saveAt({ 'story.tut_moves': 'p1' }));
  await openWild(page, 'tide/0', 3);
  await page.waitForFunction(() => PixelPets.lesson().card === 'M5');
  await clickCard(page, 'NEXT');
  await page.waitForFunction(() => PixelPets.lesson().card === 'M6');
  await clickCard(page, 'CHART');
  await expect(page.locator('#shTitle')).toHaveText('TYPE CHART');
  await page.locator('#shCancel').click();
  await expect(page.locator('#ovSheet')).toBeHidden();
  expect(await page.locator('#btMsg').textContent()).toContain('What should');
});

test('T-M6 the hit card shows once on the next choose', async ({ page }) => {
  await boot(page, saveAt({ 'story.tut_moves': 'p1' }));
  await page.evaluate(() => PixelPets.setMoves(['flick_flame']));
  await openWild(page, 'bloom/0', 12);
  await page.evaluate(() => {
    const f = PixelPets.battle.foes[0];
    f.maxHp = 500; f.hp = 500;
    if (f.stats) f.stats.atk = 1;
  });
  await page.waitForFunction(() => PixelPets.lesson().card === 'M5' || PixelPets.lesson().card === 'M1');
  // Part 1 is already done, so this choose is part 2. Finish it, then land a hard hit.
  if ((await lesson(page)).card === 'M5') {
    await clickCard(page, 'NEXT');
    await clickCard(page, 'GOT IT');
  }
  await page.locator('[data-bact="fight"]').click();
  await page.locator('#btMoves button').first().click();
  await page.waitForFunction(() => PixelPets.battle.state === 'CHOOSE' && PixelPets.lesson().card === 'M7', { timeout: 8000 });
  await clickCard(page, 'GOT IT');
  await page.locator('[data-bact="fight"]').click();
  await page.locator('#btMoves button').first().click();
  await page.waitForFunction(() => PixelPets.battle.state === 'CHOOSE', { timeout: 8000 });
  expect((await lesson(page)).card).not.toBe('M7');
});

test('T-M7 running keeps part 1 for the next wild battle', async ({ page }) => {
  await boot(page, saveAt({ 'story.tut_moves': 'armed' }));
  await openWild(page, 'tide/0', 3);
  await page.waitForFunction(() => PixelPets.lesson().card === 'M1');
  await clickCard(page, 'NEXT');
  await clickCard(page, 'NEXT');
  await page.locator('[data-bact="fight"]').click();
  await page.waitForFunction(() => (PixelPets.lesson().card || '').indexOf('M4') === 0);
  await clickCard(page, 'GOT IT');
  await page.locator('#btFightBack').click();
  await page.locator('[data-bact="run"]').click();
  await page.waitForFunction(() => !PixelPets.battle.on);
  expect(await page.locator('#toast').textContent()).toContain('slipped away');
  expect((await lesson(page)).moves).toBe('p1');
  await openWild(page, 'tide/0', 3);
  await page.waitForFunction(() => PixelPets.lesson().card === 'M5');
});

test('T-M8 a loss keeps the lesson for the next wild battle', async ({ page }) => {
  await boot(page, saveAt({ 'story.tut_moves': 'p1' }));
  await openWild(page, 'tide/0', 3);
  await page.waitForFunction(() => PixelPets.lesson().card === 'M5');
  await page.evaluate(() => PixelPets.loseBattle());
  await page.waitForFunction(() => PixelPets.battle.panel === 'end');
  await page.locator('#btOk').click();
  await page.waitForFunction(() => !PixelPets.battle.on);
  expect((await lesson(page)).moves).toBe('p1');
  await openWild(page, 'tide/0', 3);
  await page.waitForFunction(() => PixelPets.lesson().card === 'M5');
});

test('T-M10 four wild battles end the lesson', async ({ page }) => {
  await boot(page, saveAt({ 'story.tut_moves': 'armed' }));
  for (let i = 0; i < 4; i++) {
    await openWild(page, 'tide/0', 3);
    await page.evaluate(() => PixelPets.battle.close());
    await page.waitForFunction(() => !PixelPets.battle.on);
  }
  expect((await lesson(page)).moves).toBe('done');
  await openWild(page, 'tide/0', 3);
  await page.waitForTimeout(200);
  expect((await lesson(page)).card).toBe('');
});

test('T-M11 skip ends the lesson and leaves choose', async ({ page }) => {
  await boot(page, saveAt({ 'story.tut_moves': 'armed' }));
  await openWild(page, 'tide/0', 3);
  await page.waitForFunction(() => PixelPets.lesson().card === 'M1');
  await page.locator('#tutSkip').click();
  await page.locator('#tutSkip').click();
  expect((await lesson(page)).moves).toBe('skipped');
  expect(await page.evaluate(() => PixelPets.battle.state)).toBe('CHOOSE');
});

test('T-M12 Tips off stays quiet in battle', async ({ page }) => {
  const s = saveAt({ 'story.tut_moves': 'armed' });
  s.settings.tips = false;
  await boot(page, s);
  await openWild(page, 'tide/0', 3);
  await page.waitForTimeout(300);
  const L = await lesson(page);
  expect(L.card).toBe('');
  expect(L.moves).toBe('quiet');
});

test('T-M13 a V2 starter gets M4n and the queue is empty', async ({ page }) => {
  await boot(page, saveAt({ 'story.tut_moves': 'armed' }));
  await openWild(page, 'tide/0', 3);
  await page.waitForFunction(() => PixelPets.lesson().card === 'M1');
  expect((await lesson(page)).q).toBe(0);
  await clickCard(page, 'NEXT');
  await clickCard(page, 'NEXT');
  await page.locator('[data-bact="fight"]').click();
  await page.waitForFunction(() => PixelPets.lesson().card === 'M4n');
  expect((await lesson(page)).q).toBe(0);
});

test('T-M14 reduced motion shows the battle card without a slide', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await boot(page, saveAt({ 'story.tut_moves': 'armed' }));
  await openWild(page, 'tide/0', 3);
  await page.waitForFunction(() => PixelPets.lesson().card === 'M1');
  const anim = await page.evaluate(() => getComputedStyle(document.querySelector('#tutCard')).animationName);
  expect(anim === 'none' || anim === '').toBe(true);
});

test('T-M15 the card stays off the message line', async ({ page }) => {
  const width = page.viewportSize().width;
  const layouts = [{ ctl: 'arcade' }, { ctl: 'modern' }];
  if (width === 390) layouts.push({ ctl: 'arcade', desk: true });
  for (const lay of layouts) {
    if (lay.desk) await page.setViewportSize({ width: 1440, height: 900 });
    await boot(page, saveAt({ 'story.tut_moves': 'armed' }));
    await page.evaluate((ctl) => PixelPets.applyCtl(ctl, false), lay.ctl);
    await openWild(page, 'tide/0', 3);
    await page.waitForFunction(() => PixelPets.lesson().card === 'M1');
    const overlap = await page.evaluate(() => {
      const a = document.querySelector('#tutCard').getBoundingClientRect();
      const b = document.querySelector('#btMsg').getBoundingClientRect();
      return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    });
    expect(overlap).toBe(false);
    await page.evaluate(() => PixelPets.battle.close());
    await page.waitForFunction(() => !PixelPets.battle.on);
  }
});

test('T-S1 the care replay is look-only', async ({ page }) => {
  await boot(page, saveAt());
  await page.evaluate(() => PixelPets.applyCtl('arcade'));
  const before = await flags(page);
  await page.locator('#settingsBtn').click();
  await page.locator('#setTutorial').click();
  await page.locator('#shList .sh-item', { hasText: 'Care walk' }).click();
  await page.waitForFunction(() => (PixelPets.lesson().card || '').indexOf('C2') === 0);
  expect(await page.locator('#careTray').isVisible()).toBe(true);
  for (let i = 0; i < 5; i++) await clickCard(page, 'NEXT');
  await clickCard(page, 'GOT IT');
  const after = await flags(page);
  expect(after.hunger).toBeCloseTo(before.hunger, 0);
  expect(after.energy).toBeCloseTo(before.energy, 0);
  expect(await page.evaluate(() => PixelPets.state.party[0].cd || null)).toBe(null);
});

test('T-S2 moves replay toasts and arms the next wild battle', async ({ page }) => {
  await boot(page, saveAt({ 'story.tut_moves': 'done', 'story.tut_moves_hit': true, 'story.tut_moves_n': 4 }));
  await page.locator('#settingsBtn').click();
  await page.locator('#setTutorial').click();
  await page.locator('#shList .sh-item', { hasText: 'Moves and types' }).click();
  expect(await page.locator('#toast').textContent()).toContain('next wild battle');
  expect((await lesson(page)).moves).toBe('armed');
  await page.locator('#setClose').click();
  await openWild(page, 'tide/0', 3);
  await page.waitForFunction(() => PixelPets.lesson().card === 'M1');
});

test('T-S3 the type chart has nine rows from the chart', async ({ page }) => {
  await boot(page, saveAt());
  await page.locator('#settingsBtn').click();
  await page.locator('#setTutorial').click();
  await page.locator('#shList .sh-item', { hasText: 'Type chart' }).click();
  const rows = await page.evaluate(() => {
    return [...document.querySelectorAll('#shList .sh-item')].map(b => {
      const r = b.getBoundingClientRect();
      return { h: r.height, label: b.querySelector('.sh-l').textContent, sub: b.querySelector('.sh-s').textContent };
    });
  });
  expect(rows.length).toBe(9);
  expect(rows[0].label).toBe('EMBER');
  expect(rows[8].label).toBe('PLAIN');
  expect(rows[8].sub).toBe('Even against every type.');
  for (const row of rows) expect(row.h).toBeGreaterThanOrEqual(44);
  await page.locator('#shCancel').click();
  await expect(page.locator('#ovSheet')).toBeHidden();
});

test('T-S4 a reload keeps v 2 and the five keys', async ({ page }) => {
  await boot(page, saveAt({ 'story.tut_care': 'done', 'story.tut_moves': 'p1', 'story.tut_moves_hit': true, 'story.tut_moves_n': 2, 'story.tut_care_step': 'C4' }));
  await page.reload({ waitUntil: 'commit' });
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  const raw = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  expect(raw.v).toBe(2);
  expect(raw.flags['story.tut_care']).toBe('done');
  expect(raw.flags['story.tut_care_step']).toBe('C4');
  expect(raw.flags['story.tut_moves']).toBe('p1');
  expect(raw.flags['story.tut_moves_hit']).toBe(true);
  expect(raw.flags['story.tut_moves_n']).toBe(2);
});

test('T-M9 befriending early leaves the result panel', async ({ page }) => {
  await boot(page, saveAt({ 'story.tut_moves': 'armed' }));
  await openWild(page, 'tide/0', 3);
  await page.waitForFunction(() => PixelPets.lesson().card === 'M1');
  await page.evaluate(() => document.querySelector('#btBefriendAct').click());
  await page.waitForFunction(() => PixelPets.battle.panel === 'bef');
  await page.evaluate(() => {
    PixelPets.enc.zone = [0, 1];
    PixelPets.enc.mark = 0.5;
    PixelPets.enc.open = true;
  });
  await page.evaluate(() => document.querySelector('#encGo').click());
  await page.waitForFunction(() => PixelPets.battle.panel === 'end', { timeout: 8000 });
  expect(await page.locator('#tutCard').isVisible()).toBe(false);
  expect(await page.locator('#btEndTitle').textContent()).toContain('befriended');
  expect((await lesson(page)).moves).toBe('armed');
  await page.locator('#btOk').click();
  await page.waitForFunction(() => !PixelPets.battle.on);
  const journal = page.locator('#jnClose');
  if (await journal.isVisible().catch(() => false)) await journal.click();
  await openWild(page, 'tide/0', 3);
  await page.waitForFunction(() => PixelPets.lesson().card === 'M1');
});

test('tray feed shot at 320', async ({ page }) => {
  test.skip(page.viewportSize().width !== 320, 'shot is 320');
  await boot(page, saveAt({ 'story.tut_care': 'wait', 'story.tut_care_step': 'C2' }));
  await page.evaluate(() => PixelPets.applyCtl('modern', false));
  await page.locator('#petStrip').click();
  await page.waitForFunction(() => PixelPets.lesson().card === 'C2');
  const dir = artifactsDir('tutorials-care-moves');
  fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, 'care-c2-320.png') });
});
