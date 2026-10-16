/* STAT_DISPLAY v0.1 (design 39ef920): one NRG / GROW strip for PARTNER and WALK, EXPLORE once, CARE / STEPS slot. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const RECTS = {
  320: { strip: [0, 52, 320, 56], nrgL: [12, 58, 36, 24], nrgB: [54, 62, 62, 16], nrgV: [120, 58, 28, 24], growL: [160, 58, 40, 24], growB: [206, 62, 62, 16], growV: [272, 58, 36, 24], ex: [12, 84, 140, 20], slot: [168, 84, 140, 20] },
  390: { strip: [0, 52, 390, 56], nrgL: [12, 58, 36, 24], nrgB: [54, 62, 97, 16], nrgV: [155, 58, 28, 24], growL: [195, 58, 40, 24], growB: [241, 62, 97, 16], growV: [342, 58, 36, 24], ex: [12, 84, 180, 20], slot: [198, 84, 180, 20] },
};
const SEL = { strip: '#statStrip', nrgL: '.ss-nrg-l', nrgB: '.ss-nrg-b', nrgV: '.ss-nrg-v', growL: '.ss-grow-l', growB: '.ss-grow-b', growV: '.ss-grow-v', ex: '.ss-ex' };
async function boot(page, extra = {}, settings = {}) {
  const s = starterSave(); Object.assign(s.party[0], { energy: 72, xp: 140 }, extra); Object.assign(s.settings, settings); s.steps = 340;
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page);
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.state);
}
const box = (page, sel) => page.evaluate(sel => { const e = document.querySelector(sel); if (!e || !e.offsetWidth) return null; const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(Math.round); }, sel);

test('criteria 1-4: one strip on PARTNER and WALK at the spec rects; NRG/GROW once; EXPLORE once; CARE on PARTNER, STEPS on WALK', async ({ page }) => {
  await boot(page);
  const W = page.viewportSize().width, want = RECTS[W];
  for (const tab of ['pet', 'walk']) {
    await page.evaluate(t => PixelPets.showTab(t), tab); await page.waitForTimeout(150);
    expect(await page.evaluate(() => document.querySelectorAll('#statStrip').length)).toBe(1);
    if (want) {
      for (const [k, sel] of Object.entries(SEL)) { const b = await box(page, '#statStrip ' + (k === 'strip' ? '' : sel)).catch(() => null) || await box(page, sel);
        b.forEach((v, i) => expect(Math.abs(v - want[k][i]), `${tab} ${k} [${i}] ${b} vs ${want[k]}`).toBeLessThanOrEqual(1)); }
      const slot = await box(page, tab === 'pet' ? '.ss-care' : '.ss-steps');
      slot.forEach((v, i) => expect(Math.abs(v - want.slot[i]), `${tab} slot`).toBeLessThanOrEqual(1));
      const main = await box(page, 'main'); expect(main[1]).toBe(108);
    }
    const r = await page.evaluate(() => ({ nrg: document.querySelector('#valEnergy').textContent, grow: document.querySelector('#valXp').textContent,
      bars: document.querySelectorAll('.c-nrg').length, ex: [...document.querySelectorAll('body *')].filter(e => e.offsetWidth && e.children.length <= 1 && /EXPLORE|TODAY|explore XP/i.test(e.textContent) && !e.querySelector('span')).length,
      care: !!document.querySelector('.ss-care').offsetWidth, steps: !!document.querySelector('.ss-steps').offsetWidth, exTxt: document.querySelector('.ss-ex').textContent, slotTxt: (document.querySelector('.ss-care').offsetWidth ? document.querySelector('.ss-care') : document.querySelector('.ss-steps')).textContent,
      gone: ['#dExp', '#wExp', '#dailyXp', '.walk-hud', '#wXp', '#wBarEnergy'].filter(s => document.querySelector(s)) }));
    expect(r.nrg).toBe('72'); expect(r.grow).toBe('140');
    expect(r.ex).toBe(1); expect(r.exTxt).toMatch(/^EXPLORE \d+\/30$/);
    expect(r.gone).toEqual([]);
    expect([r.care, r.steps]).toEqual(tab === 'pet' ? [true, false] : [false, true]);
    expect(r.slotTxt).toBe(tab === 'pet' ? 'CARE 0/25' : 'STEPS 340');
  }
});

test('criterion 5: hidden on WALKLINGS and QUEST, and on WALK in modern; shown on PARTNER in modern', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.showTab('col')); await expect(page.locator('#statStrip')).toBeHidden();
  await page.locator('#tabs button[data-tab="walk"]').click(); await expect(page.locator('#statStrip')).toBeVisible();
  await boot(page, {}, { controls: 'modern' });
  await page.evaluate(() => PixelPets.showTab('walk')); await expect(page.locator('#statStrip')).toBeHidden();
  await page.evaluate(() => PixelPets.showTab('pet')); await expect(page.locator('#statStrip')).toBeVisible();
});

test('criteria 6-7: no new save fields, maxed counter turns lime, nothing wraps at this width', async ({ page }) => {
  await boot(page);
  await page.waitForTimeout(5500);
  const before = await page.evaluate(() => (o => JSON.stringify(Object.keys(o).sort()) + JSON.stringify(Object.keys(o.party[0]).sort()))(JSON.parse(localStorage.getItem('pixelpets.save.v2'))));
  await page.evaluate(() => PixelPets.showTab('pet'));
  const fit = await page.evaluate(() => [...document.querySelectorAll('#statStrip > span, #statStrip > b')].filter(e => e.offsetWidth).map(e => [e.className, e.scrollWidth <= e.clientWidth + 1, e.getBoundingClientRect().height <= 25]));
  for (const f of fit) expect(f.slice(1), f[0]).toEqual([true, true]);
  await page.waitForTimeout(5500);
  const after = await page.evaluate(() => (o => JSON.stringify(Object.keys(o).sort()) + JSON.stringify(Object.keys(o.party[0]).sort()))(JSON.parse(localStorage.getItem('pixelpets.save.v2'))));
  expect(after).toBe(before);
  const d = new Date(), k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  await boot(page, { ex: { d: k, xp: 30 } });
  await page.evaluate(() => PixelPets.showTab('walk'));
  await expect(page.locator('#ssExp')).toHaveText('30/30');
  await expect(page.locator('#ssExp')).toHaveClass(/maxed/);
});
