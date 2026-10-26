/* STAT_DISPLAY v0.1 (design 39ef920): one NRG / GROW strip for PARTNER and WALK, EXPLORE once, CARE / STEPS slot. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const RECTS = {
  320: { strip: [0, 52, 320, 56], nrgL: [24, 58, 36, 24], nrgB: [66, 62, 50, 16], nrgV: [120, 58, 28, 24], growL: [172, 58, 40, 24], growB: [218, 62, 50, 16], growV: [272, 58, 36, 24], ex: [12, 84, 140, 20], slot: [168, 84, 140, 20] },
  390: { strip: [0, 52, 390, 56], nrgL: [24, 58, 36, 24], nrgB: [66, 62, 85, 16], nrgV: [155, 58, 28, 24], growL: [207, 58, 40, 24], growB: [253, 62, 85, 16], growV: [342, 58, 36, 24], ex: [12, 84, 180, 20], slot: [198, 84, 180, 20] },
};
const SEL = { strip: '#statStrip', nrgL: '.ss-nrg-l', nrgB: '.ss-nrg-b', nrgV: '.ss-nrg-v', growL: '.ss-grow-l', growB: '.ss-grow-b', growV: '.ss-grow-v', ex: '.ss-ex' };
async function boot(page, extra = {}, settings = {}) {
  const s = starterSave(); Object.assign(s.party[0], { energy: 72, xp: 140 }, extra); Object.assign(s.settings, settings); s.steps = 340;
  const pinToday = s.party[0].ex && s.party[0].ex.d === 'TODAY';
  if (pinToday) s.party[0].ex.d = 'PENDING';
  await installSave(page.context(), s, { quietDay: true });
  if (pinToday) {
    // The day key is the browser's local date. A stamp from the test runner can be the day before.
    await page.addInitScript(() => {
      const raw = localStorage.getItem('pixelpets.save.v2');
      if (!raw) return;
      const save = JSON.parse(raw);
      const pet = save.party && save.party[0];
      if (!pet || !pet.ex || pet.ex.d !== 'PENDING') return;
      const d = new Date();
      pet.ex.d = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      localStorage.setItem('pixelpets.save.v2', JSON.stringify(save));
    });
  }
  await gotoGame(page);
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.state);
}
const box = (page, sel) => page.evaluate(sel => { const e = document.querySelector(sel); if (!e || !e.offsetWidth) return null; const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(Math.round); }, sel);
async function waitForSave(page) {
  const last = await page.evaluate(() => {
    const raw = localStorage.getItem('pixelpets.save.v2');
    return raw ? (JSON.parse(raw).last || 0) : 0;
  });
  await page.waitForFunction(prev => {
    const raw = localStorage.getItem('pixelpets.save.v2');
    if (!raw) return false;
    return (JSON.parse(raw).last || 0) > prev;
  }, last, { timeout: 8000 });
}

test('criteria 1-4: the strip stays on WALK; PARTNER hides it and mirrors NRG, GROW, EXPLORE and CARE', async ({ page }) => {
  await boot(page);
  const W = page.viewportSize().width, want = RECTS[W];
  expect(await page.evaluate(() => document.querySelectorAll('#statStrip').length)).toBe(1);
  await page.evaluate(() => PixelPets.showTab('walk')); await page.waitForTimeout(150);
  if (want) {
    for (const [k, sel] of Object.entries(SEL)) { const b = await box(page, '#statStrip ' + (k === 'strip' ? '' : sel)).catch(() => null) || await box(page, sel);
      b.forEach((v, i) => expect(Math.abs(v - want[k][i]), `walk ${k} [${i}] ${b} vs ${want[k]}`).toBeLessThanOrEqual(1)); }
    const slot = await box(page, '.ss-steps');
    slot.forEach((v, i) => expect(Math.abs(v - want.slot[i]), 'walk slot').toBeLessThanOrEqual(1));
    const main = await box(page, 'main'); expect(main[1]).toBe(108);
  }
  const walk = await page.evaluate(() => ({ nrg: document.querySelector('#valEnergy').textContent, grow: document.querySelector('#valXp').textContent,
    ex: [...document.querySelectorAll('body *')].filter(e => e.offsetWidth && e.children.length <= 1 && /EXPLORE|TODAY|explore XP/i.test(e.textContent) && !e.querySelector('span')).length,
    care: !!document.querySelector('.ss-care').offsetWidth, steps: !!document.querySelector('.ss-steps').offsetWidth, exTxt: document.querySelector('.ss-ex').textContent,
    slotTxt: document.querySelector('.ss-steps').textContent,
    gone: ['#dExp', '#wExp', '#dailyXp', '.walk-hud', '#wXp', '#wBarEnergy'].filter(s => document.querySelector(s)) }));
  expect(walk.nrg).toBe('72'); expect(walk.grow).toBe('10');
  expect(walk.ex).toBe(1); expect(walk.exTxt).toMatch(/^EXPLORE \d+\/30$/);
  expect(walk.gone).toEqual([]);
  expect([walk.care, walk.steps]).toEqual([false, true]);
  expect(walk.slotTxt).toBe('STEPS 340');

  await page.evaluate(() => PixelPets.showTab('pet')); await page.waitForTimeout(150);
  await expect(page.locator('#statStrip')).toBeHidden();
  const pet = await page.evaluate(() => ({
    nrg: document.querySelector('#valEnergyPet').textContent,
    grow: document.querySelector('#valXpPet').textContent,
    ex: document.querySelector('#petExp').textContent,
    care: document.querySelector('#petCare').textContent,
    strip: document.querySelector('#statStrip').offsetWidth,
  }));
  expect(pet.nrg).toBe('72'); expect(pet.grow).toBe('10');
  expect(pet.ex).toMatch(/^\d+\/30$/); expect(pet.care).toBe('0/25');
  expect(pet.strip).toBe(0);
});

test('criterion 5: hidden on WALKLINGS, on PARTNER, and on WALK in modern; shown on arcade WALK @w1', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.showTab('col')); await expect(page.locator('#statStrip')).toBeHidden();
  await page.locator('#tabs button[data-tab="walk"]').click(); await expect(page.locator('#statStrip')).toBeVisible();
  await boot(page, {}, { controls: 'modern' });
  await page.evaluate(() => PixelPets.showTab('walk')); await expect(page.locator('#statStrip')).toBeHidden();
  await page.evaluate(() => PixelPets.showTab('pet')); await expect(page.locator('#statStrip')).toBeHidden();
});

test('criteria 6-7: no new save fields, maxed counter turns lime, nothing wraps at this width', async ({ page }) => {
  await boot(page);
  await waitForSave(page);
  const before = await page.evaluate(() => (o => JSON.stringify(Object.keys(o).sort()) + JSON.stringify(Object.keys(o.party[0]).sort()))(JSON.parse(localStorage.getItem('pixelpets.save.v2'))));
  await page.evaluate(() => PixelPets.showTab('walk'));
  const fit = await page.evaluate(() => [...document.querySelectorAll('#statStrip > span, #statStrip > b')].filter(e => e.offsetWidth).map(e => [e.className, e.scrollWidth <= e.clientWidth + 1, e.getBoundingClientRect().height <= 25]));
  for (const f of fit) expect(f.slice(1), f[0]).toEqual([true, true]);
  await waitForSave(page);
  const after = await page.evaluate(() => (o => JSON.stringify(Object.keys(o).sort()) + JSON.stringify(Object.keys(o.party[0]).sort()))(JSON.parse(localStorage.getItem('pixelpets.save.v2'))));
  expect(after).toBe(before);
  await boot(page, { ex: { d: 'TODAY', xp: 30 } });
  await page.evaluate(() => PixelPets.showTab('walk'));
  await expect(page.locator('#ssExp')).toHaveText('30/30');
  await expect(page.locator('#ssExp')).toHaveClass(/maxed/);
});
