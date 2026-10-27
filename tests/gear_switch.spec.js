/* GEAR_SWITCH v0.1.3. Care-screen GEAR opens the Walkling sheet. STATS keeps INTERACT and CLOSE.
   A party row beside the back arrow switches the shown Walkling. Save stays v2. */
const path = require('path');
const fs = require('fs');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, artifactsDir } = require('./helpers');

trackErrors(test, expect);

const LINES = ['ember', 'tide', 'bloom', 'stone', 'volt', 'frost'];
const NICKS = ['Pip', 'Brook', 'Moss', 'Peb', 'Zip', 'Chill'];

function partySave(n, opt) {
  const s = starterSave();
  opt = opt || {};
  s.player.name = 'Wayfarer';
  s.settings.controls = opt.controls || 'modern';
  s.party = [];
  for (let i = 0; i < n; i++) {
    s.party.push({
      id: 'p' + i, species: LINES[i], stage: 0, xp: 10,
      hunger: i === 1 ? 10 : 80, happy: 60, energy: 90,
      nick: NICKS[i], origin: 'starter',
    });
  }
  s.partnerId = 'p0';
  if (opt.box) {
    s.box = [{
      id: 'boxed', species: 'shade', stage: 0, xp: 10,
      hunger: 80, happy: 60, energy: 90, nick: 'Dusk', origin: 'wild',
    }];
  }
  return s;
}

async function boot(page, save, search) {
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page, search || '');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.state && window.PixelPets.state.party[0]);
  await page.evaluate(() => PixelPets.showTab('pet'));
}

function near(got, want) {
  expect(Math.abs(got - want), 'got ' + Math.round(got) + ' want ' + want).toBeLessThanOrEqual(1.5);
}

async function saveKeys(page) {
  return page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('pixelpets.save.v2'));
    return { v: raw.v, keys: Object.keys(raw).sort(), key: 'pixelpets.save.v2' };
  });
}

test('GEAR opens the sheet for the shown Walkling and CLOSE stays on the care screen', async ({ page }) => {
  await boot(page, partySave(1));
  const before = await saveKeys(page);
  expect(before.v).toBe(2);
  expect(before.key).toBe('pixelpets.save.v2');
  const gear = await page.locator('#petKitBtn').boundingBox();
  const stats = await page.locator('#petStatsBtn').boundingBox();
  expect(gear.height).toBeGreaterThanOrEqual(44);
  expect(gear.width).toBeGreaterThanOrEqual(44);
  expect(stats.height).toBeGreaterThanOrEqual(44);
  expect(stats.width).toBeGreaterThanOrEqual(44);
  expect(await page.locator('#petKitBtn').getAttribute('aria-label')).toBe('Gear for Pip');
  await page.locator('#petKitBtn').click();
  await expect(page.locator('#ovWalkling')).toBeVisible();
  await expect(page.locator('#wlMoves')).toBeVisible();
  await expect(page.locator('#wlUse')).toBeVisible();
  await expect(page.locator('#wlName')).toHaveText('Pip');
  expect(await page.evaluate(() => document.body.dataset.screen)).toBe('pet');
  const close = await page.locator('#wlClose').boundingBox();
  expect(close.height).toBeGreaterThanOrEqual(44);
  expect(close.width).toBeGreaterThanOrEqual(44);
  if (page.viewportSize().width === 390) {
    const box = await page.locator('#ovWalkling .sc-head').boundingBox();
    await page.screenshot({
      path: path.join(artifactsDir('gear-switch'), 'sheet-390.png'),
      clip: { x: 0, y: Math.max(0, box.y - 8), width: 390, height: Math.min(220, 844 - box.y) },
    });
  }
  await page.locator('#wlClose').click();
  await expect(page.locator('#ovWalkling')).toBeHidden();
  await expect(page.locator('#scr-pet')).toBeVisible();
  expect(await page.evaluate(() => document.body.dataset.screen)).toBe('pet');
  const after = await saveKeys(page);
  expect(after.v).toBe(2);
  expect(after.keys).toEqual(before.keys);
});

test('STATS keeps INTERACT at full width and CLOSE, with no gear box', async ({ page }) => {
  await boot(page, partySave(1));
  await page.locator('#petStatsBtn').click();
  await expect(page.locator('#ovStats')).toBeVisible();
  await expect(page.locator('#scRename')).toBeVisible();
  await expect(page.locator('#scClose')).toBeVisible();
  expect(await page.locator('#scGear').count()).toBe(0);
  expect(await page.locator('#scGearBox').count()).toBe(0);
  const row = await page.evaluate(() => {
    const a = document.querySelector('#scRename');
    const c = document.querySelector('#scClose');
    const acts = document.querySelector('#scActs').getBoundingClientRect();
    const ab = a.getBoundingClientRect(), cb = c.getBoundingClientRect();
    return { ah: ab.height, aw: ab.width, bw: acts.width, ch: cb.height, cw: cb.width, text: a.textContent.trim() };
  });
  expect(row.text).toBe('INTERACT');
  expect(row.ah).toBeGreaterThanOrEqual(44);
  expect(row.aw).toBeGreaterThan(row.bw * 0.8);
  expect(row.ch).toBeGreaterThanOrEqual(44);
  expect(row.cw).toBeGreaterThanOrEqual(44);
  if (page.viewportSize().width === 390) {
    const box = await page.locator('#ovStats .ov-inner').boundingBox();
    await page.screenshot({
      path: path.join(artifactsDir('gear-switch'), 'stats-390.png'),
      clip: { x: Math.max(0, box.x), y: Math.max(0, box.y), width: Math.min(box.width, 390), height: Math.min(box.height, 844 - box.y) },
    });
  }
  await page.locator('#scClose').click();
  await expect(page.locator('#ovStats')).toBeHidden();
  await expect(page.locator('#scr-pet')).toBeVisible();
});

test('a party of 3 switches in order and the care screen follows', async ({ page }) => {
  await boot(page, partySave(3, { box: true }));
  await expect(page.locator('#petSlots')).toBeVisible();
  await expect(page.locator('.pet-slot')).toHaveCount(3);
  const ids = await page.locator('.pet-slot').evaluateAll(els => els.map(el => el.dataset.id));
  expect(ids).toEqual(['p0', 'p1', 'p2']);
  const back = await page.locator('#petSwitch .scr-back').boundingBox();
  expect(back.width).toBeGreaterThanOrEqual(44);
  expect(back.height).toBeGreaterThanOrEqual(44);
  const slots = page.locator('.pet-slot');
  for (let i = 0; i < 3; i++) {
    const box = await slots.nth(i).boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
  await expect(slots.nth(0)).toHaveAttribute('aria-current', 'true');
  await expect(slots.nth(1)).toHaveAttribute('aria-label', 'Switch to Brook');
  const badge = await slots.nth(1).locator('canvas.bd').boundingBox();
  expect(badge.width).toBeGreaterThanOrEqual(10);
  expect(badge.height).toBeGreaterThanOrEqual(10);
  const before = await page.evaluate(() => {
    const raw = JSON.parse(PixelPets.exportSave());
    return { v: raw.v, keys: Object.keys(raw).sort() };
  });
  expect(before.v).toBe(2);
  const order = ['p1', 'p2', 'p0'];
  const names = ['Brook', 'Moss', 'Pip'];
  for (let i = 0; i < order.length; i++) {
    await slots.nth(order[i] === 'p0' ? 0 : order[i] === 'p1' ? 1 : 2).click();
    await expect(page.locator('#toast')).toHaveText(names[i] + ' is your partner now!');
    await expect(page.locator('#hdrName')).toHaveText(names[i]);
    await expect(page.locator('#petKitBtn')).toHaveAttribute('aria-label', 'Gear for ' + names[i]);
    await expect(page.locator('.pet-slot[data-id="' + order[i] + '"]')).toHaveAttribute('aria-current', 'true');
    const hunger = await page.locator('#valHunger').textContent();
    expect(hunger).toBe(order[i] === 'p1' ? '10' : '80');
    expect(await page.evaluate(() => PixelPets.state.partnerId)).toBe(order[i]);
  }
  const after = await saveKeys(page);
  expect(after.v).toBe(2);
  expect(after.keys).toEqual(before.keys);
  expect(await page.evaluate(() => PixelPets.state.box.map(p => p.nick))).toEqual(['Dusk']);
  await page.locator('#petStatsBtn').click();
  await expect(page.locator('#scName')).toHaveText('Pip');
  const interact = await page.locator('#scRename').boundingBox();
  const close = await page.locator('#scClose').boundingBox();
  expect(interact.height).toBeGreaterThanOrEqual(44);
  expect(interact.width).toBeGreaterThanOrEqual(44);
  expect(close.height).toBeGreaterThanOrEqual(44);
  expect(close.width).toBeGreaterThanOrEqual(44);
  await page.locator('#scClose').click();
  await page.locator('#petKitBtn').click();
  await expect(page.locator('#ovWalkling')).toBeVisible();
  await expect(page.locator('#wlName')).toHaveText('Pip');
  await page.locator('#wlClose').click();
  if (page.viewportSize().width === 390) {
    const row = await page.locator('#petSwitch').boundingBox();
    await page.screenshot({
      path: path.join(artifactsDir('gear-switch'), 'switcher-390.png'),
      clip: { x: 0, y: Math.max(0, row.y - 4), width: 390, height: Math.min(row.height + 12, 80) },
    });
  }
});

test('a party of one shows the back arrow and no slots', async ({ page }) => {
  await boot(page, partySave(1));
  await expect(page.locator('#petSwitch .scr-back')).toBeVisible();
  await expect(page.locator('#petSlots')).toBeHidden();
  expect(await page.locator('.pet-slot').count()).toBe(0);
  const back = await page.locator('#petSwitch .scr-back').boundingBox();
  expect(back.width).toBeGreaterThanOrEqual(44);
  expect(back.height).toBeGreaterThanOrEqual(44);
});

test('a party of 6 stays on one row at 320, 375 and 390', async ({ page }) => {
  await boot(page, partySave(6), '?debug=1');
  const W = page.viewportSize().width;
  const lay = await page.evaluate(() => {
    const scr = document.querySelector('#scr-pet').getBoundingClientRect();
    const back = document.querySelector('#petSwitch .scr-back').getBoundingClientRect();
    const slots = [...document.querySelectorAll('.pet-slot')].map(el => {
      const b = el.getBoundingClientRect();
      const face = getComputedStyle(el, '::before');
      const hit = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
      const who = hit && hit.closest ? hit.closest('.pet-slot') : null;
      return {
        x: b.x, y: b.y, w: b.width, h: b.height, right: b.right,
        id: el.dataset.id, on: el.classList.contains('on'),
        face: face.backgroundColor, frame: face.borderTopColor,
        boxW: parseFloat(face.width),
        hit: who && who.dataset.id,
      };
    });
    const backHit = document.elementFromPoint(back.x + back.width / 2, back.y + back.height / 2);
    const scene = document.querySelector('#petCanvas');
    return {
      scrX: scr.x, scrW: scr.width,
      back: { x: back.x, y: back.y, w: back.width, h: back.height },
      backHit: !!(backHit && backHit.closest && backHit.closest('.scr-back')),
      fit: document.querySelector('#petSwitch').classList.contains('fit'),
      slots,
      scene: parseFloat(scene.style.height) || 0,
      scrollX: document.querySelector('#scr-pet').scrollWidth - document.querySelector('#scr-pet').clientWidth,
      scrollY: document.querySelector('#scr-pet').scrollHeight - document.querySelector('#scr-pet').clientHeight,
    };
  });
  expect(lay.slots).toHaveLength(6);
  expect(lay.scrollX).toBeLessThanOrEqual(1);
  expect(lay.scrollY).toBeLessThanOrEqual(1);
  expect(lay.backHit).toBe(true);
  near(lay.scrX, 0);
  near(lay.scrW, W);
  near(lay.back.w, 44);
  near(lay.back.h, 44);
  lay.slots.forEach(s => {
    near(s.w, 44);
    near(s.h, 44);
    expect(s.hit).toBe(s.id);
    expect(s.boxW).toBeGreaterThan(38);
    expect(s.boxW).toBeLessThan(42);
  });
  const shown = lay.slots[0], other = lay.slots[1];
  expect(shown.on).toBe(true);
  expect(shown.face).toBe('rgb(86, 108, 134)');
  expect(shown.frame).toBe('rgb(255, 205, 117)');
  expect(other.face).toBe('rgb(51, 60, 87)');
  expect(other.frame).toBe('rgb(41, 54, 111)');
  if (W === 320) {
    expect(lay.fit).toBe(true);
    near(lay.back.x, 4);
    near(lay.slots[0].x, 52);
    near(lay.slots[5].right, 316);
    for (let i = 1; i < 6; i++) near(lay.slots[i].x, lay.slots[i - 1].right);
    near(lay.slots[0].x - (lay.back.x + lay.back.w), 4);
  } else {
    expect(lay.fit).toBe(false);
    near(lay.back.x, 12);
    near(lay.slots[0].x, 62);
    near(lay.slots[5].right, 356);
    for (let i = 1; i < 6; i++) near(lay.slots[i].x - lay.slots[i - 1].right, 6);
  }
  const h6 = lay.scene;
  await page.evaluate(() => { PixelPets.state.party.length = 1; PixelPets.showTab('pet'); });
  await expect(page.locator('.pet-slot')).toHaveCount(0);
  const h1 = await page.evaluate(() => parseFloat(document.querySelector('#petCanvas').style.height) || 0);
  expect(h6, 'scene css px ' + h6).toBe(h1);
  expect(h6).toBeGreaterThan(0);
  fs.appendFileSync(path.join(artifactsDir('gear-switch'), 'scene-h.txt'), W + ' ' + h6 + '\n');
});

test('arcade at 320 shows six slots and no back arrow', async ({ page }) => {
  test.skip(page.viewportSize().width !== 320, '320 only');
  await boot(page, partySave(6, { controls: 'arcade' }));
  await expect(page.locator('#petSwitch .scr-back')).toBeHidden();
  await expect(page.locator('#petSlots')).toBeVisible();
  await expect(page.locator('.pet-slot')).toHaveCount(6);
  const lay = await page.evaluate(() => {
    const scr = document.querySelector('#scr-pet');
    const slots = [...document.querySelectorAll('.pet-slot')].map(el => el.getBoundingClientRect());
    return {
      fit: document.querySelector('#petSwitch').classList.contains('fit'),
      x: slots.map(b => b.x),
      w: slots.map(b => b.width),
      h: slots.map(b => b.height),
      gap: slots.slice(1).map((b, i) => b.x - slots[i].right),
      scrollX: scr.scrollWidth - scr.clientWidth,
    };
  });
  expect(lay.fit).toBe(false);
  lay.w.forEach(w => near(w, 44));
  lay.h.forEach(h => near(h, 44));
  lay.gap.forEach(g => near(g, 6));
  near(lay.x[0], 12);
  expect(lay.scrollX).toBeLessThanOrEqual(1);
});

test('guards ignore a switch tap', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, 'one width');
  await boot(page, partySave(3), '?debug=1');
  const slot = page.locator('.pet-slot').nth(1);
  await page.locator('#scr-pet [data-act="play"]').click({ force: true });
  const played = await page.evaluate(() => {
    const slot = document.querySelectorAll('.pet-slot')[1];
    const off = slot.getAttribute('aria-disabled');
    slot.click();
    return { off, id: PixelPets.state.partnerId, toast: document.querySelector('#toast').textContent };
  });
  expect(played.off).toBe('true');
  expect(played.id).toBe('p0');
  expect(played.toast).not.toContain('partner now');
  await page.waitForTimeout(1400);
  await expect(page.locator('.pet-slot').first()).not.toHaveAttribute('aria-disabled', 'true');

  await page.evaluate(() => { PixelPets.state.party[0].hpNow = 1; PixelPets.showTab('pet'); });
  await page.locator('#scr-pet [data-act="heal"]').click();
  await expect(page.locator('#ovSheet')).toBeVisible();
  await expect(page.locator('.pet-slot').first()).toHaveAttribute('aria-disabled', 'true');
  await slot.click({ force: true });
  expect(await page.evaluate(() => PixelPets.state.partnerId)).toBe('p0');
  await page.locator('#shCancel').click();
  await expect(page.locator('#ovSheet')).toBeHidden();
  await expect(page.locator('.pet-slot').first()).not.toHaveAttribute('aria-disabled', 'true');

  await page.locator('#petStatsBtn').click();
  await expect(page.locator('#ovStats')).toBeVisible();
  await expect(page.locator('.pet-slot').first()).toHaveAttribute('aria-disabled', 'true');
  await slot.click({ force: true });
  expect(await page.evaluate(() => PixelPets.state.partnerId)).toBe('p0');
  await page.locator('#scClose').click();
  await expect(page.locator('.pet-slot').first()).not.toHaveAttribute('aria-disabled', 'true');

  await page.evaluate(() => { document.body.classList.add('nav-locked'); PixelPets.showTab('pet'); });
  await expect(page.locator('.pet-slot').first()).toHaveAttribute('aria-disabled', 'true');
  await slot.click();
  expect(await page.evaluate(() => PixelPets.state.partnerId)).toBe('p0');
  await page.evaluate(() => { document.body.classList.remove('nav-locked'); PixelPets.showTab('pet'); });
  await expect(page.locator('.pet-slot').first()).not.toHaveAttribute('aria-disabled', 'true');
});

test('a pinned lesson keeps the switcher off until the tour ends', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, 'one width');
  test.setTimeout(60000);
  await boot(page, partySave(3), '?debug=1');
  await page.evaluate(() => PixelPets.showTab('walk'));
  const started = await page.evaluate(() => PixelPets.replayTour());
  expect(started).toBe(true);
  await expect(page.locator('#tutLine')).toContainText('Tap the map to walk');
  for (let i = 0; i < 4; i++) await page.locator('#tutActs button', { hasText: 'NEXT' }).click();
  await expect(page.locator('#tutLine')).toContainText('This is the PARTNER screen');
  await page.locator('#petFloat').click();
  await expect(page.locator('#scr-pet')).toBeVisible();
  await expect(page.locator('.pet-slot').first()).toHaveAttribute('aria-disabled', 'true');
  await page.locator('.pet-slot').nth(1).click({ force: true });
  expect(await page.evaluate(() => PixelPets.state.partnerId)).toBe('p0');
  await page.locator('#tutSkip').click();
  await page.locator('#tutSkip').click();
  await expect(page.locator('#tutLayer')).toBeHidden();
  await expect(page.locator('.pet-slot').first()).not.toHaveAttribute('aria-disabled', 'true');
});

test('reduced motion swaps the partner with no slide', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await boot(page, partySave(3));
  const motion = await page.evaluate(() => ({
    reduce: matchMedia('(prefers-reduced-motion: reduce)').matches,
    dur: getComputedStyle(document.querySelector('.pet-slot')).transitionDuration,
    name: getComputedStyle(document.querySelector('.pet-slot')).animationName,
  }));
  expect(motion.reduce).toBe(true);
  expect(motion.dur).toBe('0s');
  expect(motion.name).toBe('none');
  await page.locator('.pet-slot').nth(1).click();
  expect(await page.evaluate(() => PixelPets.state.partnerId)).toBe('p1');
  await expect(page.locator('.pet-slot').nth(1)).toHaveAttribute('aria-current', 'true');
});
