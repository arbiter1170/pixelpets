// MODERN_HUD_CLEAR dock (D778/D789): portrait modern walk, 156 px dock, no HUD over the map.
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

function save() {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.follower = false;
  s.settings.tips = false;
  s.settings.textSpeed = 'fast';
  s.flags['story.phone_got'] = true;
  s.flags['story.early_done'] = true;
  s.flags['story.tutorial_done'] = true;
  s.money = 40;
  return s;
}

async function boot(page) {
  await installSave(page.context(), save(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForFunction(() => document.querySelector('#mapCanvas').width > 0);
}

test('portrait modern dock: chip in row 1, buttons 44 px, 0 px over the map', async ({ page }, info) => {
  const w = page.viewportSize().width;
  test.skip(w > page.viewportSize().height, 'dock is portrait only');
  await boot(page);
  // Frame class is on automatically in modern portrait walk; force it for certainty.
  await page.evaluate(() => { if (window.PixelPets && PixelPets.setHudPads) PixelPets.setHudPads(true); });
  await page.waitForFunction(() => document.body.classList.contains('mhc-frame') && document.querySelector('#fcDock') && !document.querySelector('#fcDock').hidden);

  const d = await page.evaluate(() => {
    const r = el => {
      if (!el || el.hidden) return null;
      const b = el.getBoundingClientRect();
      if (!(b.width >= 8 && b.height >= 8)) return null;
      return { x: b.left, y: b.top, w: b.width, h: b.height, right: b.right, bottom: b.bottom };
    };
    const mw = r(document.querySelector('#mapCanvas'));
    const dock = r(document.querySelector('#fcDock'));
    const chip = r(document.querySelector('#thChip'));
    const gear = r(document.querySelector('#gearFloat'));
    const phone = r(document.querySelector('#phoneBtn'));
    const quest = r(document.querySelector('#questBtn'));
    const partner = r(document.querySelector('#petFloat'));
    const strip = r(document.querySelector('#petStrip'));
    const tip = document.querySelector('#fcTip');
    const overs = [];
    for (const [id, br] of [['thChip', chip], ['gearFloat', gear], ['phoneBtn', phone], ['questBtn', quest], ['petFloat', partner], ['petStrip', strip]]) {
      if (!br || !mw) continue;
      const ox = Math.max(0, Math.min(br.right, mw.right) - Math.max(br.x, mw.x));
      const oy = Math.max(0, Math.min(br.bottom, mw.bottom) - Math.max(br.y, mw.y));
      if (ox > 1 && oy > 1) overs.push({ id, ox, oy });
    }
    return {
      frame: document.body.classList.contains('mhc-frame'),
      modern: document.body.classList.contains('ctl-modern'),
      map: mw, dock, chip, gear, phone, quest, partner, strip,
      tipShown: !!(tip && tip.offsetParent),
      overs,
      chipParent: document.querySelector('#thChip') && document.querySelector('#thChip').parentElement.id,
      questParent: document.querySelector('#questBtn') && document.querySelector('#questBtn').parentElement.id,
    };
  });

  expect(d.modern).toBe(true);
  expect(d.frame).toBe(true);
  expect(d.dock).toBeTruthy();
  expect(d.dock.h).toBeGreaterThanOrEqual(150);
  expect(d.chipParent).toBe('fcDockChip');
  expect(d.questParent).toBe('fcDockR2Left');
  expect(d.chip.h).toBeGreaterThanOrEqual(44);
  expect(d.chip.w).toBeGreaterThanOrEqual(44);
  expect(d.gear.h).toBeGreaterThanOrEqual(44);
  expect(d.quest.h).toBeGreaterThanOrEqual(44);
  expect(d.partner.h).toBeGreaterThanOrEqual(44);
  expect(d.tipShown).toBe(false);
  expect(d.overs).toEqual([]);
  expect(d.chip.x).toBeLessThan(d.phone.x);
  expect(d.phone.x).toBeLessThan(d.gear.x);
  expect(d.quest.x).toBeLessThan(d.partner.x);
  expect(d.map.bottom).toBeLessThanOrEqual(d.dock.y + 2);
});
