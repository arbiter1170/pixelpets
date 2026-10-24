/* TUTORIAL_ORDER v0.1.2 (D678-D682, D705-D709). Care walk in the Lodge, nav tour, Rook's fight, befriend lesson. */
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, artifactsDir } = require('./helpers');

trackErrors(test, expect);

const C4E = 'Need NRG? REST fills it for 10 FOOD. So do an Energy Sip and a Lantern House bed.';
const T3 = 'NRG is energy. PLAY uses some, and REST brings it back. Walking and battling are free.';

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

function inLodge(s) {
  s.world = { map: 'hm_lodge_in', x: 5, y: 6, facing: 'up', respawn: 'hearthmoor' };
  return s;
}

async function boot(page, save) {
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
}

async function lesson(page) {
  return page.evaluate(() => PixelPets.lesson());
}

async function clickCard(page, label) {
  await page.locator('#tutActs button', { hasText: label }).click();
}

async function finishStarter(page) {
  // One in-page pass. Each beat waits until that control is on screen, then a DOM click
  // answers it. The lesson layer is measured by its box the whole time.
  const result = await page.evaluate(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const layerBox = () => {
      const layer = document.querySelector('#tutLayer');
      if (!layer) return { up: false, w: 0, h: 0 };
      const r = layer.getBoundingClientRect();
      const s = getComputedStyle(layer);
      const up = !layer.hidden && s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0' && r.width > 0 && r.height > 0;
      return { up, w: r.width, h: r.height };
    };
    const started = PixelPets.runScene('starter');
    if (!started) return { started: false, done: false, saw: false };
    let saw = null;
    const t0 = Date.now();
    while (Date.now() - t0 < 20000) {
      const box = layerBox();
      if (box.up) saw = box;
      if (!PixelPets.scene) return { started: true, done: true, saw };
      const geo = document.querySelector('#ovGeo');
      if (geo && !geo.hidden) geo.hidden = true;
      const basket = document.querySelector('#ovBasket');
      if (basket && !basket.hidden) {
        const card = document.querySelector('#bkCard');
        const btn = card && !card.hidden ? document.querySelector('#bkYes') : document.querySelector('#bkRow button');
        if (btn) btn.click();
        await sleep(30);
        continue;
      }
      const name = document.querySelector('#sbName');
      if (name && !name.hidden) {
        const skip = document.querySelector('#sbNameSkip');
        const ok = document.querySelector('#sbOk');
        if (skip && !skip.hidden) skip.click();
        else if (ok) ok.click();
        await sleep(30);
        continue;
      }
      const mode = PixelPets.scene.mode;
      if (mode === 'choice') {
        const b = document.querySelector('#sbChoices button');
        if (b) b.click();
        await sleep(30);
        continue;
      }
      if (mode === 'say') {
        const b = document.querySelector('#sbSkip');
        if (b && !b.hidden) b.click();
        await sleep(20);
        continue;
      }
      await sleep(20);
    }
    return { started: true, done: !PixelPets.scene, saw, mode: PixelPets.scene && PixelPets.scene.mode };
  });
  expect(result.started, 'starter scene started').toBe(true);
  expect(result.saw, 'lesson layer during the starter').toBe(null);
  expect(result.done, 'starter scene ended').toBe(true);
}

async function openWild(page, form, level) {
  await page.evaluate(({ form, level }) => {
    PixelPets.battle.textMs = 0;
    PixelPets.battle.animMs = 0;
    PixelPets.forceBattle(form, level || 3);
  }, { form, level });
  await page.waitForFunction(() => PixelPets.battle && PixelPets.battle.state === 'CHOOSE', null, { timeout: 8000 });
}

async function tapVisible(page, selectors) {
  for (const sel of selectors) {
    const loc = page.locator(sel).first();
    if (await loc.isVisible().catch(() => false)) { await loc.click(); return; }
  }
  throw new Error('none visible: ' + selectors.join(', '));
}

async function walkNav(page) {
  const seen = [];
  await page.locator('#tutActs button', { hasText: 'SHOW ME' }).click();
  for (let n = 0; n < 24; n++) {
    const step = await page.evaluate(() => document.querySelector('#tutLayer').dataset.step || '');
    if (!seen.length || seen[seen.length - 1] !== step) seen.push(step);
    const text = await page.locator('#tutLine').textContent();
    if (text && text.indexOf('PARTNER screen') >= 0) {
      await tapVisible(page, ['#tabs button[data-tab="pet"]', '#petFloat']);
      continue;
    }
    if (text && text.indexOf('Tap WALK') >= 0) {
      await tapVisible(page, ['#tabs button[data-tab="walk"]', '#scr-pet .scr-back']);
      continue;
    }
    if (text && text.indexOf('Tap FEED') >= 0) {
      const next = page.locator('#tutActs button', { hasText: 'NEXT' });
      if (await next.isVisible()) await next.click();
      else {
        await page.locator('#scr-pet [data-act="feed"]').click();
        await page.waitForFunction(() => (document.querySelector('#tutLine').textContent || '').indexOf('Tap FEED') < 0);
      }
      continue;
    }
    if (text && text.indexOf('Tap PLAY') >= 0) {
      const next = page.locator('#tutActs button', { hasText: 'NEXT' });
      if (await next.isVisible()) await next.click();
      else {
        await page.locator('#scr-pet [data-act="play"]').click();
        await page.waitForFunction(() => (document.querySelector('#tutLine').textContent || '').indexOf('Tap PLAY') < 0);
      }
      continue;
    }
    if (text && text.indexOf('Tap REST') >= 0) {
      const next = page.locator('#tutActs button', { hasText: 'NEXT' });
      if (await next.isVisible()) await next.click();
      else {
        await page.locator('#scr-pet [data-act="rest"]').click();
        await page.waitForFunction(() => (document.querySelector('#tutLine').textContent || '').indexOf('Tap REST') < 0);
      }
      continue;
    }
    const label = await page.locator('#tutActs button').first().textContent();
    if (label && label.indexOf("LET'S GO") >= 0) return seen;
    await page.locator('#tutActs button', { hasText: 'NEXT' }).click();
  }
  return seen;
}

test('T-O1 the act waits for the toast and the location ask, then starts in the Lodge', async ({ page }) => {
  test.setTimeout(60000);
  const s = inLodge(saveAt());
  delete s.flags['story.tutorial_done'];
  await boot(page, s);
  await page.evaluate(() => localStorage.removeItem('pixelpets.geo'));
  await finishStarter(page);
  await expect(page.locator('#ovGeo')).toBeVisible();
  await expect(page.locator('#tutLayer')).toBeHidden();
  await expect(page.locator('#toast')).toContainText('joined you');
  await page.locator('#geoLater').click();
  await expect(page.locator('#ovGeo')).toBeHidden();
  await page.waitForFunction(() => !document.querySelector('#toast').classList.contains('show'));
  await page.waitForFunction(() => PixelPets.lesson().card === 'C1', null, { timeout: 12000 });
  const where = await page.evaluate(() => ({ map: PixelPets.mapInfo.id, v: PixelPets.state.v }));
  expect(where.map).toBe('hm_lodge_in');
  expect(where.v).toBe(2);
  await expect(page.locator('#tutLayer')).toBeVisible();
});

test('T-O2 the starter scene draws no lesson card', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page, inLodge(saveAt()));
  await finishStarter(page);
  await expect(page.locator('#tutCard')).toBeHidden();
});

test('T-O3 GOT IT closes the tray before the tour asks', async ({ page }) => {
  test.setTimeout(45000);
  const s = saveAt({ 'story.tut_care': 'wait', 'story.tut_care_step': 'C7' });
  delete s.flags['story.tutorial_done'];
  delete s.flags['story.early_done'];
  s.flags['story.early_steps'] = 0;
  await boot(page, s);
  await page.evaluate(() => PixelPets.applyCtl('modern', false));
  await page.locator('#petStrip').click();
  await page.waitForFunction(() => PixelPets.lesson().card === 'C7');
  await clickCard(page, 'GOT IT');
  let sawEarly = false;
  await page.waitForFunction(() => {
    const layer = document.querySelector('#tutLayer');
    const step = layer && layer.dataset.step;
    const tray = document.querySelector('#careTray');
    const toast = document.querySelector('#toast').classList.contains('show');
    if (step === 'T0' && !layer.hidden && (!tray.hidden || toast)) window.__torEarly = true;
    return step === 'T0' && layer && !layer.hidden;
  }, null, { timeout: 8000 });
  sawEarly = await page.evaluate(() => !!window.__torEarly);
  expect(sawEarly).toBe(false);
  await expect(page.locator('#careTray')).toBeHidden();
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('#toast')).opacity)).toBe('0');
  await expect(page.locator('#tutLine')).toBeVisible();
});

test('T-O4 SHOW ME runs the nav order and drops T5-T7 after a done walk', async ({ page }) => {
  test.setTimeout(90000);
  for (const mode of ['arcade', 'modern']) {
    const s = saveAt({ 'story.tut_care': 'done' });
    delete s.flags['story.tutorial_done'];
    delete s.flags['story.early_done'];
    s.flags['story.early_steps'] = 0;
    s.settings.controls = mode;
    await boot(page, s);
    await page.evaluate(() => PixelPets.runSteps([['say', '', 'The baskets are quiet now.']]));
    await page.locator('#sbSkip').click();
    await page.waitForFunction(() => document.querySelector('#tutLayer').dataset.step === 'T0');
    const seen = await walkNav(page);
    expect(seen[0]).toBe(mode === 'modern' ? 'T10m' : 'T10a');
    expect(seen).toContain('T11');
    expect(seen).toContain('T12');
    expect(seen).toContain('T12r');
    expect(seen).toContain('T1');
    expect(seen).toContain('T13');
    expect(seen.includes('T5') || seen.includes('T6') || seen.includes('T7')).toBe(false);
    const t1 = seen.indexOf('T1');
    const t12 = seen.indexOf('T12');
    expect(t12).toBeGreaterThanOrEqual(0);
    expect(t1).toBeGreaterThan(t12);
  }
});

test('T-O5 SKIP on C1 and C3 shuts the tray and the tour taps are real', async ({ page }) => {
  test.setTimeout(90000);
  const fresh = () => {
    const s = inLodge(saveAt({ 'story.tut_care': 'armed' }));
    delete s.flags['story.tutorial_done'];
    delete s.flags['story.early_done'];
    s.flags['story.early_steps'] = 0;
    return s;
  };
  await boot(page, fresh());
  await page.waitForFunction(() => PixelPets.lesson().card === 'C1', null, { timeout: 8000 });
  await page.locator('#tutSkip').click();
  await page.locator('#tutSkip').click();
  expect((await lesson(page)).care).toBe('skipped');
  await expect(page.locator('#careTray')).toBeHidden();
  await page.waitForFunction(() => document.querySelector('#tutLayer').dataset.step === 'T0', null, { timeout: 8000 });
  const seen = await walkNav(page);
  expect(seen).toContain('T5');
  const hunger = await page.evaluate(() => PixelPets.state.party[0].hunger);
  expect(hunger).not.toBe(80);

  await boot(page, fresh());
  await page.waitForFunction(() => PixelPets.lesson().card === 'C1', null, { timeout: 8000 });
  const spot = await page.evaluate(() => {
    const c = document.querySelector('#mapCanvas');
    const cam = PixelPets.walk.cam;
    const f = PixelPets.follower;
    const k = c.getBoundingClientRect().width / c.width;
    return { x: (f.fx * 16 - cam.x + 8) * k, y: (f.fy * 16 - cam.y + 8) * k };
  });
  await page.locator('#mapCanvas').click({ position: spot });
  await page.waitForFunction(() => (PixelPets.lesson().card || '').indexOf('C2') === 0);
  await page.locator('#careTray [data-act="feed"]').click();
  await page.waitForFunction(() => (PixelPets.lesson().card || '').indexOf('C3') === 0);
  await page.locator('#tutSkip').click();
  await page.locator('#tutSkip').click();
  expect((await lesson(page)).care).toBe('skipped');
  await expect(page.locator('#careTray')).toBeHidden();
  await page.waitForFunction(() => document.querySelector('#tutLayer').dataset.step === 'T0', null, { timeout: 8000 });
});

test('T-O6 leaving the Lodge during C1 waits, then the tray resumes at C2', async ({ page }) => {
  test.setTimeout(45000);
  const s = saveAt({ 'story.tut_care': 'armed' });
  s.world = { map: 'hm_lodge_in', x: 5, y: 7, facing: 'down', respawn: 'hearthmoor' };
  delete s.flags['story.tutorial_done'];
  delete s.flags['story.early_done'];
  s.flags['story.early_steps'] = 0;
  await boot(page, s);
  await page.waitForFunction(() => PixelPets.lesson().card === 'C1', null, { timeout: 8000 });
  await page.evaluate(() => PixelPets.walkStep('down'));
  await page.waitForFunction(() => PixelPets.lesson().care === 'wait');
  await expect(page.locator('#toast')).toContainText('any time');
  await page.waitForFunction(() => !document.querySelector('#toast').classList.contains('show'));
  await page.waitForFunction(() => document.querySelector('#tutLayer').dataset.step === 'T0', null, { timeout: 8000 });
  await page.locator('#tutActs button', { hasText: 'SKIP', exact: true }).click();
  await page.evaluate(() => PixelPets.applyCtl('modern', false));
  await page.locator('#petStrip').click();
  await page.waitForFunction(() => (PixelPets.lesson().card || '').indexOf('C2') === 0);
});

test('T-O7 a reload with care armed starts the walk, and a finished one does not', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page, saveAt({ 'story.tut_care': 'armed' }));
  await page.waitForFunction(() => {
    const p = PixelPets.lesson().phase;
    return p === 'calm' || p === 'act' || p === 'c1';
  }, null, { timeout: 8000 });
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.waitForFunction(() => PixelPets.lesson().card === 'C1', null, { timeout: 8000 });
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')).v)).toBe(2);
  for (const how of ['done', 'skipped', 'quiet']) {
    await boot(page, saveAt({ 'story.tut_care': how }));
    await page.reload({ waitUntil: 'load' });
    await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
    await page.waitForTimeout(1500);
    const L = await lesson(page);
    expect(L.phase, how).toBe('');
    expect(L.card, how).toBe('');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')).v)).toBe(2);
  }
});

test('T-O8 Tips off is one toast and reduced motion does not hop', async ({ page }) => {
  test.setTimeout(45000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const s = saveAt({ 'story.tut_care': 'armed' });
  s.settings.tips = false;
  delete s.flags['story.tutorial_done'];
  delete s.flags['story.early_done'];
  s.flags['story.early_steps'] = 0;
  await boot(page, s);
  let sawAct = false;
  for (let i = 0; i < 40; i++) {
    const L = await lesson(page);
    if (L.phase === 'act') sawAct = true;
    expect(L.hop).toBe(0);
    if (L.care === 'quiet') break;
    await page.waitForTimeout(100);
  }
  expect(sawAct).toBe(true);
  expect((await lesson(page)).care).toBe('quiet');
  await expect(page.locator('#tutCard')).toBeHidden();
  await expect(page.locator('#toast')).toContainText('any time');
  await page.waitForFunction(() => document.querySelector('#tutLayer').dataset.step === 'T0', null, { timeout: 8000 });
});

test('T-O9 C4e rings REST and T3 drops the old energy line', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page, saveAt({ 'story.tut_care': 'wait', 'story.tut_care_step': 'C4' }));
  await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    p.hunger = 40; p.energy = 40; delete p.cd;
    PixelPets.applyCtl('modern', false);
  });
  await page.locator('#petStrip').click();
  await page.waitForFunction(() => (PixelPets.lesson().card || '').indexOf('C4') === 0);
  if ((await lesson(page)).card === 'C4') await page.locator('#careTray [data-act="rest"]').click();
  await page.waitForFunction(() => PixelPets.lesson().card === 'C4e', null, { timeout: 8000 });
  await expect(page.locator('#tutLine')).toHaveText(C4E);
  await expect(page.locator('#tutActs button', { hasText: 'NEXT' })).toBeVisible();
  const ring = await page.evaluate(() => {
    const a = document.querySelector('#tutRing').getBoundingClientRect();
    const b = document.querySelector('#careTray [data-act="rest"]').getBoundingClientRect();
    const hit = a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    return { hit, rw: a.width, rh: a.height, bw: b.width, bh: b.height };
  });
  expect(ring.hit).toBe(true);
  expect(ring.bh).toBeGreaterThanOrEqual(44);
  if (page.viewportSize() && page.viewportSize().width === 390) {
    const dir = artifactsDir('tutorial-order');
    fs.mkdirSync(dir, { recursive: true });
    await page.locator('#tutCard').screenshot({ path: path.join(dir, 'c4e-390.png') });
  }
  await clickCard(page, 'NEXT');
  await page.waitForFunction(() => PixelPets.lesson().card === 'C5');
  await page.locator('#ctClose').click();
  await page.locator('#gearFloat').click().catch(async () => { await page.locator('#settingsBtn').click(); });
  await page.locator('#setTutorial').click();
  await page.locator('#shList .sh-item', { hasText: 'Opening tour' }).click();
  for (let i = 0; i < 12; i++) {
    const text = await page.locator('#tutLine').textContent();
    if (text && text.indexOf('NRG is energy') >= 0) break;
    const partner = text && text.indexOf('PARTNER screen') >= 0;
    const walk = text && text.indexOf('Tap WALK') >= 0;
    if (partner) await tapVisible(page, ['#tabs button[data-tab="pet"]', '#petFloat']);
    else if (walk) await tapVisible(page, ['#tabs button[data-tab="walk"]', '#scr-pet .scr-back']);
    else await page.locator('#tutActs button', { hasText: 'NEXT' }).click();
  }
  await expect(page.locator('#tutLine')).toContainText(T3);
  await expect(page.locator('#tutLine')).not.toContainText('battles use it');
});

test('T-O10 Rook teaches HP, types, NRG and SWAP, then the hit card', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page, saveAt({ 'story.tut_moves': 'armed' }));
  await page.evaluate(() => PixelPets.setMoves(['stoke_up', 'flick_flame']));
  const started = await page.evaluate(() => {
    PixelPets.battle.textMs = 0;
    PixelPets.battle.animMs = 0;
    return PixelPets.forceTrainer('rival1_rook');
  });
  expect(started).toBe(true);
  await page.waitForFunction(() => PixelPets.battle.state === 'CHOOSE', null, { timeout: 8000 });
  await page.evaluate(() => {
    const f = PixelPets.battle.foes && PixelPets.battle.foes[0];
    if (f) { f.maxHp = 500; f.hp = 500; if (f.stats) f.stats.atk = 1; }
    const p = PixelPets.state.party[0];
    if (p) p.hpNow = p.hpNow == null ? 31 : Math.max(p.hpNow, 31);
  });
  await page.waitForFunction(() => PixelPets.lesson().card === 'F1');
  if (page.viewportSize() && page.viewportSize().width === 390) {
    const dir = artifactsDir('tutorial-order');
    fs.mkdirSync(dir, { recursive: true });
    await page.locator('#tutCard').screenshot({ path: path.join(dir, 'rook-f1-390.png') });
  }
  await clickCard(page, 'NEXT');
  await page.waitForFunction(() => PixelPets.lesson().card === 'M1');
  await clickCard(page, 'NEXT');
  await page.waitForFunction(() => PixelPets.lesson().card === 'M2s');
  await clickCard(page, 'NEXT');
  await page.waitForFunction(() => PixelPets.lesson().card === 'M3');
  await page.locator('[data-bact="fight"]').click();
  await page.waitForFunction(() => (PixelPets.lesson().card || '').indexOf('M4') === 0);
  await clickCard(page, 'GOT IT');
  // A neutral foe move keeps this turn from counting as the 2x or half hit. M7 waits for Flick Flame.
  await page.evaluate(() => { PixelPets.battle.foePlan = { move: 'bump' }; });
  await page.locator('#btMoves button', { hasText: 'Stoke Up' }).click();
  await page.waitForFunction(() => PixelPets.battle.state === 'CHOOSE' && PixelPets.lesson().card === 'M5', null, { timeout: 8000 });
  await clickCard(page, 'NEXT');
  await page.waitForFunction(() => PixelPets.lesson().card === 'M6');
  await clickCard(page, 'NEXT');
  await page.waitForFunction(() => PixelPets.lesson().card === 'F2');
  await clickCard(page, 'NEXT');
  await page.waitForFunction(() => PixelPets.lesson().card === 'F3');
  await clickCard(page, 'GOT IT');
  await page.locator('[data-bact="fight"]').click();
  await page.locator('#btMoves button', { hasText: 'Flick Flame' }).click();
  await page.waitForFunction(() => PixelPets.battle.state === 'CHOOSE' && PixelPets.lesson().card === 'M7', null, { timeout: 8000 });
  await page.evaluate(() => PixelPets.battle.close());
  const other = await page.evaluate(() => PixelPets.forceTrainer('rival2_rook'));
  expect(other).toBe(true);
  await page.waitForFunction(() => PixelPets.battle.state === 'CHOOSE', null, { timeout: 8000 });
  expect((await lesson(page)).card).toBe('');
});

test('T-O11 a carried fight part waits for the choose after befriending', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page, saveAt({ 'story.tut_moves': 'armed', 'story.tut_bef': 'armed' }));
  await page.evaluate(() => {
    PixelPets.battle.textMs = 0;
    PixelPets.battle.animMs = 0;
    PixelPets.setMoves(['stoke_up']);
    PixelPets.forceTrainer('rival1_rook');
  });
  await page.waitForFunction(() => PixelPets.lesson().card === 'F1', null, { timeout: 8000 });
  await clickCard(page, 'NEXT');
  await clickCard(page, 'NEXT');
  await clickCard(page, 'NEXT');
  await page.locator('[data-bact="fight"]').click();
  await page.waitForFunction(() => (PixelPets.lesson().card || '').indexOf('M4') === 0);
  await clickCard(page, 'GOT IT');
  await page.evaluate(() => PixelPets.battle.close());
  await page.waitForFunction(() => !PixelPets.battle.on);
  expect((await lesson(page)).moves).toBe('p1');
  await openWild(page, 'tide/0', 3);
  await page.waitForFunction(() => PixelPets.lesson().card === 'W1');
  await clickCard(page, 'NEXT');
  await clickCard(page, 'NEXT');
  await clickCard(page, 'NEXT');
  await clickCard(page, 'GOT IT');
  expect((await lesson(page)).bef).toBe('b1');
  await page.evaluate(() => { PixelPets.battle.foePlan = { move: 'bump' }; });
  await page.locator('[data-bact="fight"]').click();
  await page.locator('#btMoves button').first().click();
  await page.waitForFunction(() => PixelPets.battle.state === 'CHOOSE' && PixelPets.lesson().card === 'M5', null, { timeout: 8000 });
});

test('T-O12 the first wild battle rings BEFRIEND, HP and LEAVE', async ({ page }) => {
  test.setTimeout(45000);
  await boot(page, saveAt({ 'story.tut_moves': 'done', 'story.tut_bef': 'armed' }));
  await openWild(page, 'tide/0', 3);
  await page.waitForFunction(() => PixelPets.lesson().card === 'W1');
  if (page.viewportSize() && page.viewportSize().width === 390) {
    const dir = artifactsDir('tutorial-order');
    fs.mkdirSync(dir, { recursive: true });
    await page.locator('#tutCard').screenshot({ path: path.join(dir, 'wild-w1-390.png') });
  }
  const onBef = await page.evaluate(() => {
    const a = document.querySelector('#tutRing').getBoundingClientRect();
    const b = document.querySelector('#btBefriendAct').getBoundingClientRect();
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top && b.height >= 44;
  });
  expect(onBef).toBe(true);
  await clickCard(page, 'NEXT');
  await page.waitForFunction(() => PixelPets.lesson().card === 'W2');
  await clickCard(page, 'NEXT');
  await page.waitForFunction(() => PixelPets.lesson().card === 'W3');
  const onHp = await page.evaluate(() => {
    const a = document.querySelector('#tutRing').getBoundingClientRect();
    const b = document.querySelector('#btFoeHp').parentElement.getBoundingClientRect();
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  });
  expect(onHp).toBe(true);
  await clickCard(page, 'NEXT');
  await page.waitForFunction(() => PixelPets.lesson().card === 'W4');
  const onLeave = await page.evaluate(() => {
    const a = document.querySelector('#tutRing').getBoundingClientRect();
    const b = document.querySelector('#btRun').getBoundingClientRect();
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top && b.height >= 44;
  });
  expect(onLeave).toBe(true);
  await clickCard(page, 'GOT IT');
  expect((await lesson(page)).bef).toBe('b1');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')).v)).toBe(2);
});

test('T-O13 the bar cards hold the marker and leave the tries', async ({ page }) => {
  await boot(page, saveAt({ 'story.tut_moves': 'done', 'story.tut_bef': 'b1' }));
  await openWild(page, 'tide/0', 3);
  expect((await lesson(page)).card).toBe('');
  await page.locator('#btBefriendAct').click();
  await page.waitForFunction(() => PixelPets.lesson().card === 'W5');
  const mark = await page.evaluate(() => PixelPets.enc.mark);
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => PixelPets.enc.mark)).toBe(mark);
  // The lesson dim sits over the bar. A DOM click still reaches the guard, which keeps the panel up.
  await page.evaluate(() => document.querySelector('#encGo').click());
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => PixelPets.battle.panel)).toBe('bef');
  await clickCard(page, 'NEXT');
  await page.waitForFunction(() => PixelPets.lesson().card === 'W6');
  await clickCard(page, 'GOT IT');
  expect((await lesson(page)).bef).toBe('done');
  expect(await page.evaluate(() => PixelPets.battle.tries)).toBe(3);
});

test('T-O14 SKIP ends befriending only, and Settings arms it again', async ({ page }) => {
  await boot(page, saveAt({ 'story.tut_moves': 'p1', 'story.tut_bef': 'armed' }));
  await openWild(page, 'tide/0', 3);
  await page.waitForFunction(() => PixelPets.lesson().card === 'W1');
  await page.locator('#tutSkip').click();
  await page.locator('#tutSkip').click();
  const mid = await lesson(page);
  expect(mid.bef).toBe('skipped');
  expect(mid.moves).toBe('p1');
  await page.evaluate(() => PixelPets.battle.close());
  await page.waitForFunction(() => !PixelPets.battle.on);
  await page.locator('#settingsBtn').click();
  await page.locator('#setTutorial').click();
  await expect(page.locator('#shList .sh-item', { hasText: 'Befriending' })).toBeVisible();
  await page.locator('#shList .sh-item', { hasText: 'Befriending' }).click();
  await expect(page.locator('#toast')).toContainText('Befriending in your next wild battle.');
  expect((await lesson(page)).bef).toBe('armed');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')).v)).toBe(2);
});
