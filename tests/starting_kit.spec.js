/* STORES_AND_TOWN_LIFE P2a. A new save earns the first five adornments.
   An old save keeps them. Each source grants once. Save stays v2. */
const path = require('path');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, playScene, artifactsDir } = require('./helpers');

trackErrors(test, expect);

const FIVE = ['bell', 'ribbon', 'scarf', 'leaf', 'star'];
const FIVE_NAMES = ['Lodge bell', 'Hall ribbon', 'Hearth scarf', 'Orchard sprig', 'Amber star'];

function kitSave() {
  const s = starterSave();
  s.flags['acc.kit'] = 2;
  s.party[0].nick = 'Pipkit';
  return s;
}

async function boot(page, save) {
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true && window.PixelPets.state);
  await page.evaluate(() => PixelPets.showTab('walk'));
}

async function clearToast(page) {
  await page.evaluate(() => {
    const t = document.querySelector('#toast');
    t.textContent = '';
    t.classList.remove('show');
  });
}

async function shot390(page, locator, name) {
  if (!page.viewportSize() || page.viewportSize().width !== 390) return;
  const dir = artifactsDir('p2a');
  await locator.screenshot({ path: path.join(dir, name + '.png') });
}

test('a brand-new save owns none of the five', async ({ page }) => {
  await page.context().addInitScript(() => {
    localStorage.removeItem('pixelpets.save.v2');
    localStorage.removeItem('pixelpets.save.v1');
    localStorage.setItem('pixelpets.geo', 'deny');
    localStorage.setItem('pixelpets.mute', '1');
  });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.state && window.PixelPets.state.flags);
  await page.waitForFunction(() => {
    const raw = localStorage.getItem('pixelpets.save.v2');
    if (!raw) return false;
    const flags = JSON.parse(raw).flags || {};
    return flags['acc.kit'] === 2;
  }, null, { timeout: 8000 });
  const got = await page.evaluate((ids) => {
    const s = PixelPets.state;
    const raw = JSON.parse(localStorage.getItem('pixelpets.save.v2'));
    return {
      v: s.v,
      kit: s.flags['acc.kit'],
      savedKit: raw.flags['acc.kit'],
      owned: ids.filter(id => raw.flags['wardrobe.' + id] === true),
      keys: Object.keys(raw).sort(),
    };
  }, FIVE);
  expect(got.v).toBe(2);
  expect(got.kit).toBe(2);
  expect(got.savedKit).toBe(2);
  expect(got.owned).toEqual([]);
  expect(got.keys).not.toContain('acc');
  expect(got.keys).not.toContain('wardrobe');
});

test('the ADORN picker lists only owned looks, and an old save keeps the five', async ({ page }) => {
  await boot(page, kitSave());
  await page.locator('#tabs button[data-tab="pet"]').click();
  await page.locator('#petKitBtn').click();
  await expect(page.locator('#ovWalkling')).toBeVisible();
  await expect(page.locator('#ovWalkling [data-acc]')).toHaveText(['None']);
  const none = page.locator('#ovWalkling [data-acc]');
  await none.scrollIntoViewIfNeeded();
  const gear = await none.boundingBox();
  expect(gear.height).toBeGreaterThanOrEqual(44);
  expect(gear.width).toBeGreaterThanOrEqual(44);

  const old = starterSave();
  old.party[0].accessory = 'star';
  old.party[0].nick = 'Pipkit';
  await installSave(page.context(), old, { quietDay: true });
  await page.reload({ waitUntil: 'commit' });
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.state && window.PixelPets.state.party[0]);
  await page.evaluate(() => PixelPets.showTab('pet'));
  const kept = await page.evaluate(() => ({
    kit: PixelPets.state.flags['acc.kit'] || null,
    worn: PixelPets.state.party[0].accessory,
    v: PixelPets.state.v,
  }));
  expect(kept.kit).toBeNull();
  expect(kept.worn).toBe('star');
  expect(kept.v).toBe(2);
  await page.locator('#petKitBtn').click();
  await expect(page.locator('#ovWalkling [data-acc]')).toHaveText(['None'].concat(FIVE_NAMES));
});

test('Mom grants the Hearth scarf once', async ({ page }) => {
  const s = kitSave();
  Object.assign(s.flags, {
    'story.mom_met': true,
    'story.mom_chore': true,
    'story.mom_sent': true,
    'story.dream_woke': true,
    'story.dream_study': true,
    'story.rival1_done': true,
  });
  await boot(page, s);
  await page.evaluate(() => PixelPets.goto('hm_home_up', 5, 4, 'up'));
  await page.keyboard.press('Space');
  await expect(page.locator('#toast')).toHaveText('New adornment: Hearth scarf.');
  await shot390(page, page.locator('#toast'), 'hearth_scarf_toast');
  expect(await page.evaluate(() => PixelPets.state.flags['wardrobe.scarf'] === true)).toBe(true);
  await page.keyboard.press('Space');
  await clearToast(page);
  await page.keyboard.press('Space');
  await page.waitForTimeout(400);
  const again = await page.evaluate(() => ({
    toast: document.querySelector('#toast').textContent,
    flag: PixelPets.state.flags['wardrobe.scarf'] === true,
    v: PixelPets.state.v,
  }));
  expect(again.toast).toBe('');
  expect(again.flag).toBe(true);
  expect(again.v).toBe(2);
});

test('the Lodge bell is granted once when the tour ends', async ({ page }) => {
  const s = kitSave();
  delete s.flags['story.tutorial_done'];
  s.world = { map: 'hm_lodge_in', x: 5, y: 6, facing: 'up', respawn: 'hearthmoor' };
  await installSave(page.context(), s, { quietDay: false });
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
  await page.locator('#tutActs button', { hasText: 'SKIP', exact: true }).click();
  await expect(page.locator('#toast')).toHaveText('New adornment: Lodge bell.');
  expect(await page.evaluate(() => PixelPets.state.flags['wardrobe.bell'] === true)).toBe(true);
  await clearToast(page);
  await page.evaluate(() => PixelPets.replayTour());
  await expect(page.locator('#tutSkip')).toHaveText('SKIP TOUR');
  await page.locator('#tutSkip').click();
  await page.locator('#tutSkip').click();
  await expect(page.locator('#tutLayer')).toBeHidden();
  await page.waitForTimeout(300);
  const again = await page.evaluate(() => ({
    toast: document.querySelector('#toast').textContent,
    bell: PixelPets.state.flags['wardrobe.bell'] === true,
    done: PixelPets.state.flags['story.tutorial_done'] === true,
  }));
  expect(again.toast).toBe('');
  expect(again.bell).toBe(true);
  expect(again.done).toBe(true);
});

test('the orchard grants the Orchard sprig once', async ({ page }) => {
  await boot(page, kitSave());
  expect(await page.evaluate(() => PixelPets.runScene('orchard'))).toBe(true);
  await playScene(page, []);
  await expect(page.locator('#toast')).toHaveText('New adornment: Orchard sprig.');
  expect(await page.evaluate(() => PixelPets.state.flags['wardrobe.leaf'] === true)).toBe(true);
  await clearToast(page);
  expect(await page.evaluate(() => PixelPets.runScene('orchard'))).toBe(true);
  await playScene(page, []);
  await page.waitForTimeout(300);
  const again = await page.evaluate(() => document.querySelector('#toast').textContent);
  expect(again).toBe('');
});

test('the first Fernbrook win names the Hall ribbon, and a rematch does not', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page, kitSave());
  const opened = await page.evaluate(() => {
    PixelPets.battle.textMs = 0;
    PixelPets.showTab('walk');
    return PixelPets.forceTrainer('hall1_fen');
  });
  expect(opened).toBe(true);
  await page.waitForFunction(() => {
    const b = PixelPets.battle;
    return b && (b.state === 'CHOOSE' || b.panel === 'end');
  }, null, { timeout: 15000 });
  await page.evaluate(() => { if (PixelPets.battle.panel !== 'end') PixelPets.winBattle(); });
  await page.waitForFunction(() => PixelPets.battle.panel === 'end', null, { timeout: 20000 });
  await expect(page.locator('#btEndLine')).toHaveText('New adornment: Hall ribbon.');
  await expect(page.locator('#toast')).toHaveText('New adornment: Hall ribbon.');
  const lineFit = await page.evaluate(() => {
    const n = document.querySelector('#btEndLine');
    const cs = getComputedStyle(n);
    const ok = document.querySelector('#btOk').getBoundingClientRect();
    return { fs: cs.fontSize, sw: n.scrollWidth, cw: n.clientWidth, ellipsis: cs.textOverflow, ws: cs.whiteSpace, okH: ok.height, ribbon: PixelPets.state.flags['wardrobe.ribbon'] === true, v: PixelPets.state.v };
  });
  expect(lineFit.fs).toBe('16px');
  expect(lineFit.sw).toBeLessThanOrEqual(lineFit.cw + 1);
  expect(lineFit.ellipsis).not.toBe('ellipsis');
  expect(lineFit.ws).toBe('pre-line');
  expect(lineFit.okH).toBeGreaterThanOrEqual(44);
  expect(lineFit.ribbon).toBe(true);
  expect(lineFit.v).toBe(2);
  await page.locator('#btOk').click();
  await page.waitForFunction(() => !PixelPets.battle.on);
  await clearToast(page);
  const rematch = await page.evaluate(() => {
    PixelPets.battle.textMs = 0;
    return PixelPets.openTrainer('hall1_fen');
  });
  expect(rematch).toBe(true);
  await page.waitForFunction(() => {
    const b = PixelPets.battle;
    return b && (b.state === 'CHOOSE' || b.panel === 'end');
  }, null, { timeout: 15000 });
  await page.evaluate(() => { if (PixelPets.battle.panel !== 'end') PixelPets.winBattle(); });
  await page.waitForFunction(() => PixelPets.battle.panel === 'end', null, { timeout: 20000 });
  await expect(page.locator('#btEndLine')).toBeHidden();
  await page.waitForTimeout(300);
  const second = await page.evaluate(() => ({
    toast: document.querySelector('#toast').textContent,
    ribbon: PixelPets.state.flags['wardrobe.ribbon'] === true,
  }));
  expect(second.toast).toBe('');
  expect(second.ribbon).toBe(true);
});

test('Amber star is bought once at Stitch & Lantern for 90 Acorns', async ({ page }) => {
  const s = kitSave();
  s.money = 89;
  await boot(page, s);
  await page.evaluate(() => PixelPets.goto('hm_wardrobe', 9, 3, 'up'));
  await page.keyboard.press('Space');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
  await page.keyboard.press('Space');
  await page.waitForSelector('#ovWardrobe:not([hidden])');
  await page.waitForTimeout(400);
  const row = page.locator('.ward-item[data-id="star"]');
  await expect(row.locator('.ward-act')).toHaveText('BUY');
  const buy = await row.locator('.ward-act').boundingBox();
  expect(buy.height).toBeGreaterThanOrEqual(44);
  await shot390(page, row, 'amber_star_row');
  await row.locator('.ward-act').click();
  await expect(page.locator('#toast')).toHaveText('Not enough Acorns.');
  expect(await page.evaluate(() => PixelPets.state.money)).toBe(89);
  await page.evaluate(() => { PixelPets.state.money = 90; });
  await row.locator('.ward-act').click();
  await expect(page.locator('#toast')).toHaveText('Amber star is yours.');
  const bought = await page.evaluate(() => ({
    money: PixelPets.state.money,
    flag: PixelPets.state.flags['wardrobe.star'] === true,
    btn: document.querySelector('.ward-item[data-id="star"] .ward-act').textContent,
    v: JSON.parse(localStorage.getItem('pixelpets.save.v2')).v,
  }));
  expect(bought.money).toBe(0);
  expect(bought.flag).toBe(true);
  expect(bought.btn).toBe('WEAR');
  expect(bought.v).toBe(2);
  await row.locator('.ward-act').click();
  expect(await page.evaluate(() => PixelPets.state.money)).toBe(0);
});
