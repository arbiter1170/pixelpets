/* SHOP P0: the modern Acorn chip stays up on a priced prompt, and a spend ticks down.
   Widths are the Playwright projects (320, 375, 390). Save v stays 2. */
const path = require('path');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, boxesOverlap, artifactsDir } = require('./helpers');

trackErrors(test, expect);

function pricedSave(controls) {
  const s = starterSave();
  s.money = 55;
  s.settings.controls = controls;
  s.settings.follower = false;
  s.party[0].hunger = 40;
  return s;
}

async function boot(page, controls) {
  await installSave(page.context(), pricedSave(controls), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => {
    PixelPets.showTab('walk');
    PixelPets.clock.set('tue', 12, 0);
  });
}

async function stand(page, map, x, y, facing) {
  await page.evaluate(({ map, x, y, facing }) => PixelPets.goto(map, x, y, facing), { map, x, y, facing });
  await page.waitForFunction(() => !window.PixelPets.fading);
}

async function talk(page, id) {
  const ok = await page.evaluate((oid) => PixelPets.talkTo(oid), id);
  expect(ok, id).toBe(true);
  await page.waitForFunction(() => {
    const s = window.PixelPets.scene;
    return s && (s.mode === 'choice' || s.full);
  });
}

async function reachChoice(page) {
  for (let i = 0; i < 30; i++) {
    const sc = await page.evaluate(() => {
      const s = window.PixelPets.scene;
      return s && { mode: s.mode, waiting: s.waiting, text: s.text };
    });
    if (!sc) throw new Error('scene ended before a choice');
    if (sc.mode === 'choice') {
      await page.waitForFunction(() => window.PixelPets.optionsReady === true);
      return sc.text;
    }
    if (sc.waiting) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(40);
      continue;
    }
    await page.waitForTimeout(30);
  }
  throw new Error('no choice');
}

async function finishScene(page) {
  for (let i = 0; i < 24; i++) {
    const sc = await page.evaluate(() => {
      const s = window.PixelPets.scene;
      return s && { mode: s.mode, waiting: s.waiting };
    });
    if (!sc) return;
    if (sc.mode === 'choice') throw new Error('a choice is still open');
    if (sc.waiting) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(40);
      continue;
    }
    await page.waitForTimeout(30);
  }
  throw new Error('scene did not end');
}

async function chipBox(page) {
  return page.evaluate(() => {
    const chip = document.querySelector('#fcAcorns');
    const cs = getComputedStyle(chip);
    const cr = chip.getBoundingClientRect();
    const box = document.querySelector('#sbox').getBoundingClientRect();
    const buttons = [...document.querySelectorAll('#sbChoices button')].map((b) => {
      const r = b.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, text: b.textContent };
    });
    const hdr = document.querySelector('#hdrAcorns');
    const hs = getComputedStyle(hdr);
    const hr = hdr.getBoundingClientRect();
    return {
      opacity: Number(cs.opacity),
      pe: cs.pointerEvents,
      price: document.body.classList.contains('price-on'),
      modern: document.body.classList.contains('ctl-modern'),
      text: document.querySelector('#fcAcornN').textContent,
      label: chip.getAttribute('aria-label'),
      hdrText: document.querySelector('#hdrAcornN').textContent,
      hdrLabel: hdr.getAttribute('aria-label'),
      hdr: { display: hs.display, opacity: Number(hs.opacity), x: hr.x, y: hr.y, width: hr.width, height: hr.height },
      chip: { x: cr.x, y: cr.y, width: cr.width, height: cr.height },
      box: { x: box.x, y: box.y, width: box.width, height: box.height },
      buttons,
    };
  });
}

async function expectChip(page, on) {
  await expect.poll(async () => (await chipBox(page)).opacity, { timeout: 1000 }).toBe(on ? 1 : 0);
  const box = await chipBox(page);
  expect(box.price).toBe(on);
  expect(box.pe).toBe('none');
  if (!on) return box;
  expect(Math.round(box.chip.height)).toBeGreaterThanOrEqual(44);
  expect(boxesOverlap(box.chip, box.box)).toBe(false);
  expect(box.buttons.length).toBeGreaterThan(0);
  for (const b of box.buttons) {
    expect(Math.round(b.height)).toBeGreaterThanOrEqual(44);
    expect(boxesOverlap(box.chip, b)).toBe(false);
  }
  return box;
}

async function setHurt(page, on) {
  await page.evaluate((hurt) => {
    const p = PixelPets.state.party[0];
    if (hurt) {
      p.hpNow = 4;
      PixelPets.state.world.restDue = true;
    } else {
      delete p.hpNow;
      delete p.faintUntil;
      delete PixelPets.state.world.restDue;
    }
  }, on);
}

test('priced prompts keep the Acorn chip, and a buy shows the new total before the line closes', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page, 'modern');
  await stand(page, 'hm_diner', 4, 2, 'left');
  await talk(page, 'hm_hesper');
  expect(await reachChoice(page)).toBe('What will they eat?');
  const menu = await expectChip(page, true);
  expect(menu.text).toBe('55');
  expect(menu.label).toBe('55 Acorns');
  const w = page.viewportSize().width;
  if (w === 320 || w === 390) {
    await page.screenshot({ path: path.join(artifactsDir('shop-p0'), 'hesper-menu-' + w + '.png') });
  }
  await page.locator('#sbChoices button', { hasText: 'Coach Stew (30)' }).click();
  await page.waitForFunction(() => {
    const s = window.PixelPets.scene;
    return s && s.mode === 'say' && s.text === 'Coach Stew is gone.' && document.querySelector('#fcAcornN').textContent === '25';
  }, null, { timeout: 3000 });
  const after = await chipBox(page);
  expect(after.text).toBe('25');
  expect(after.hdrText).toBe('25');
  expect(after.label).toBe('25 Acorns');
  expect(after.hdrLabel).toBe('25 Acorns');
  expect(after.opacity).toBe(1);
  expect(after.price).toBe(true);
  const bought = await page.evaluate(() => ({ money: PixelPets.state.money, v: PixelPets.state.v }));
  expect(bought).toEqual({ money: 25, v: 2 });
  await finishScene(page);

  await talk(page, 'diner_ossabell');
  const plain = await expectChip(page, false);
  expect(plain.text).toBe('25');
  await finishScene(page);

  await setHurt(page, true);
  await stand(page, 'hm_lantern_in', 1, 3, 'up');
  await talk(page, 'lantern_bed_a');
  expect(await reachChoice(page)).toBe('Rest the whole party?');
  const bed = await expectChip(page, true);
  expect(bed.buttons.some((b) => b.text.indexOf('Rest (5 Acorns)') === 0)).toBe(true);
  await page.locator('#sbChoices button', { hasText: 'Not yet' }).click();
  await finishScene(page);

  await stand(page, 'fb_lantern_in', 6, 4, 'up');
  await talk(page, 'amos');
  expect(await reachChoice(page)).toBe('Rest the whole party?');
  await expectChip(page, true);
  await page.locator('#sbChoices button', { hasText: 'Not yet' }).click();
  await finishScene(page);

  await setHurt(page, false);
  await stand(page, 'hm_lantern_in', 1, 3, 'up');
  await talk(page, 'lantern_bed_a');
  expect(await reachChoice(page)).toBe('Let your team rest?');
  const free = await expectChip(page, false);
  expect(free.buttons.some((b) => b.text.indexOf('Rest a while') === 0)).toBe(true);
  await page.locator('#sbChoices button', { hasText: 'Not now' }).click();
  await finishScene(page);
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});

test('reduced motion snaps the Acorn count, with no number in between', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await boot(page, 'modern');
  await stand(page, 'hm_diner', 4, 2, 'left');
  await talk(page, 'hm_hesper');
  expect(await reachChoice(page)).toBe('What will they eat?');
  await expectChip(page, true);
  expect(await page.evaluate(() => document.querySelector('#fcAcornN').textContent)).toBe('55');
  await page.evaluate(() => {
    const els = [document.querySelector('#fcAcornN'), document.querySelector('#hdrAcornN')];
    const samples = [els.map((e) => e.textContent).join('|')];
    const rec = () => {
      samples.push(els.map((e) => e.textContent).join('|'));
      window.__acornRaf = requestAnimationFrame(rec);
    };
    window.__acornSamples = samples;
    window.__acornRaf = requestAnimationFrame(rec);
  });
  await page.locator('#sbChoices button', { hasText: 'Coach Stew (30)' }).click();
  await page.waitForFunction(() => {
    const s = window.PixelPets.scene;
    return s && s.text === 'Coach Stew is gone.' && document.querySelector('#fcAcornN').textContent === '25';
  }, null, { timeout: 3000 });
  await page.waitForTimeout(400);
  const samples = await page.evaluate(() => {
    cancelAnimationFrame(window.__acornRaf);
    return window.__acornSamples;
  });
  const seen = new Set();
  for (const row of samples) for (const part of row.split('|')) seen.add(part);
  expect([...seen].sort()).toEqual(['25', '55']);
  const label = await page.evaluate(() => document.querySelector('#fcAcorns').getAttribute('aria-label'));
  expect(label).toBe('25 Acorns');
  await finishScene(page);
});

test('arcade keeps the header Acorn count visible on a meal menu', async ({ page }) => {
  await boot(page, 'arcade');
  await stand(page, 'hm_diner', 4, 2, 'left');
  await talk(page, 'hm_hesper');
  expect(await reachChoice(page)).toBe('What will they eat?');
  const box = await chipBox(page);
  expect(box.modern).toBe(false);
  expect(box.price).toBe(true);
  expect(box.hdr.display).not.toBe('none');
  expect(box.hdr.opacity).toBe(1);
  expect(box.hdr.width).toBeGreaterThan(0);
  expect(box.hdr.height).toBeGreaterThan(0);
  expect(box.hdrText).toBe('55');
  expect(box.hdrLabel).toBe('55 Acorns');
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});
