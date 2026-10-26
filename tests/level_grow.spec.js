/* LEVEL_GROW v0.1.2: level gates grow-up, Seals cap the level, held battle XP. */
const path = require('path');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, artifactsDir } = require('./helpers');

trackErrors(test, expect);

function petSave(extra, flags) {
  const s = starterSave();
  if (extra) Object.assign(s.party[0], extra);
  if (flags) Object.assign(s.flags, flags);
  return s;
}

async function boot(page, extra, flags) {
  await installSave(page.context(), petSave(extra, flags), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true && window.PixelPets.state && window.PixelPets.state.v === 2);
}

// Seeds only when the browser has no save, so a reload boots from what the game wrote.
async function seedOnce(context, save) {
  await context.addInitScript((save) => {
    if (localStorage.getItem('pixelpets.save.v2')) return;
    const d = new Date();
    const day = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    save.flags['daily.hello'] = day;
    save.flags['daily.warm_bowl'] = day;
    save.last = Date.now();
    localStorage.setItem('pixelpets.save.v2', JSON.stringify(save));
    localStorage.setItem('pixelpets.geo', 'deny');
    localStorage.setItem('pixelpets.mute', '1');
  }, save);
}

test('Lv 11 cannot grow and Lv 12 with care can @w1', async ({ page }) => {
  await boot(page, { bx: 400, xp: 0, hunger: 80, happy: 80, energy: 90 });
  await page.evaluate(() => PixelPets.showTab('pet'));
  await expect(page.locator('#evolveBtn')).toBeHidden();
  await expect(page.locator('#evoHint')).toHaveText('Next form at Lv 12. Now Lv 11.');
  await page.evaluate(() => PixelPets.setLevel(12));
  await expect(page.locator('#evolveBtn')).toBeVisible();
  await expect(page.locator('#evoHint')).toHaveText('Pipkit is ready to grow up!');
  const st = await page.evaluate(() => ({ v: PixelPets.state.v, stage: PixelPets.state.party[0].stage }));
  expect(st).toEqual({ v: 2, stage: 0 });
});

test('the final form stays shut at one Seal and opens at two @w1', async ({ page }) => {
  await boot(page, { stage: 1, bx: 484, xp: 40, hunger: 80, happy: 80, energy: 90 });
  await page.evaluate(() => {
    PixelPets.setLevel(24);
    PixelPets.setFlag('story.seal1', true);
    PixelPets.showTab('pet');
  });
  await expect(page.locator('#evolveBtn')).toBeVisible();
  await expect(page.locator('#evoHint')).toHaveText('Next form: Lv 24 and 2 Seals.');
  await page.locator('#evolveBtn').click();
  await expect(page.locator('#toast')).toHaveText('Emberfox is ready. A Seal opens it!');
  expect(await page.evaluate(() => PixelPets.state.party[0].stage)).toBe(1);
  await page.evaluate(() => PixelPets.setFlag('story.seal2', true));
  await expect(page.locator('#evoHint')).toHaveText('Pipkit is ready to grow up!');
  await expect(page.locator('#evolveBtn')).toBeVisible();
});

test('the Lv 15 cap holds battle XP and a Seal pays it out @w1', async ({ page }) => {
  await seedOnce(page.context(), petSave({ bx: 782, xp: 0, hunger: 50, happy: 50, energy: 50 }));
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true && window.PixelPets.state && window.PixelPets.state.v === 2);
  await page.evaluate(() => PixelPets.showTab('pet'));
  await page.evaluate(() => PixelPets.careAct('feed'));
  const after = await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    return { bx: p.bx, held: p.bxHeld || 0, xp: p.xp, toast: document.querySelector('#toast').textContent, v: PixelPets.state.v };
  });
  expect(after).toEqual({ bx: 784, held: 2, xp: 2, toast: 'Lv 15 for now. A Seal lifts the cap!', v: 2 });
  await page.reload();
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug && window.PixelPets.state && window.PixelPets.state.v === 2);
  const kept = await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('pixelpets.save.v2'));
    const p = PixelPets.state.party[0];
    return { bx: p.bx, held: p.bxHeld || 0, v: raw.v };
  });
  expect(kept).toEqual({ bx: 784, held: 2, v: 2 });
  const paid = await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    p.bxHeld = 980;
    PixelPets.setFlag('story.seal1', true);
    return { bx: p.bx, held: p.bxHeld || 0, cap: PixelPets.levelCap(), toast: document.querySelector('#toast').textContent, v: PixelPets.state.v };
  });
  expect(paid).toEqual({ bx: 1764, held: 0, cap: 22, toast: 'New Seal! Level cap is now Lv 22.', v: 2 });
});

test('a Walkling already past the cap keeps its level and form @w1', async ({ page }) => {
  await boot(page, { stage: 2, bx: 1444, xp: 120, hunger: 50, happy: 50, energy: 50 });
  await page.evaluate(() => PixelPets.careAct('feed'));
  const got = await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    return { bx: p.bx, held: p.bxHeld || 0, stage: p.stage, v: PixelPets.state.v };
  });
  expect(got).toEqual({ bx: 1444, held: 4, stage: 2, v: 2 });
});

test('a second grow up waits for the first Seal @w1', async ({ page }) => {
  await boot(page, { bx: 484, xp: 0, hunger: 80, happy: 80, energy: 90 }, { 'story.unlock_growup': true });
  await page.evaluate(() => PixelPets.showTab('pet'));
  await expect(page.locator('#evoHint')).toHaveText('One grow up before your first Seal.');
  await expect(page.locator('#evolveBtn')).toBeVisible();
  await page.evaluate(() => PixelPets.openStats(PixelPets.state.partnerId));
  await expect(page.locator('#scGrow')).toHaveText('After your first Seal');
  await expect(page.locator('#scLv')).toHaveText('Cap Lv 15 · next Seal: Lv 22');
  await page.locator('#scClose').click();
  await page.locator('#evolveBtn').click();
  await expect(page.locator('#toast')).toHaveText('Earn a Seal to grow more Walklings.');
  expect(await page.evaluate(() => PixelPets.state.party[0].stage)).toBe(0);
});

test('care short of the floor keeps GROW UP hidden @w1', async ({ page }) => {
  await boot(page, { bx: 484, hunger: 49, happy: 49, energy: 49 });
  await page.evaluate(() => PixelPets.showTab('pet'));
  await expect(page.locator('#evolveBtn')).toBeHidden();
  await expect(page.locator('#evoHint')).toHaveText('CARE 49/50');
});

test('a bad held value is dropped and a load pays held battle XP with no toast @w1', async ({ page }) => {
  await boot(page, { bx: 784, bxHeld: 100 }, { 'story.seal1': true });
  const loaded = await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    const toast = document.querySelector('#toast');
    const raw = JSON.parse(JSON.stringify(PixelPets.state));
    raw.party[0].bxHeld = -3;
    const bad = PPSave.normalizeV2(raw);
    const raw2 = JSON.parse(JSON.stringify(PixelPets.state));
    raw2.party[0].bxHeld = 12.9;
    const ok = PPSave.normalizeV2(raw2);
    return {
      bx: p.bx, held: p.bxHeld, v: PixelPets.state.v,
      shown: toast.classList.contains('show'),
      bad: bad.party[0].bxHeld, floored: ok.party[0].bxHeld, nv: bad.v,
    };
  });
  expect(loaded.bx).toBe(884);
  expect(loaded.held).toBeUndefined();
  expect(loaded.v).toBe(2);
  expect(loaded.shown).toBe(false);
  expect(loaded.bad).toBeUndefined();
  expect(loaded.floored).toBe(12);
  expect(loaded.nv).toBe(2);
});

test('GROW UP stays a 44px target at phone widths', async ({ page }) => {
  await boot(page, { bx: 400, xp: 0, hunger: 80, happy: 80, energy: 90 });
  await page.evaluate(() => PixelPets.showTab('pet'));
  await expect(page.locator('#evolveBtn')).toBeHidden();
  const W = page.viewportSize().width;
  if (W === 390) {
    const dir = artifactsDir('level-grow');
    await page.locator('#evoHint').screenshot({ path: path.join(dir, 'hint-level-gate-390.png') });
  }
  await page.evaluate(() => PixelPets.setLevel(12));
  const btn = page.locator('#evolveBtn');
  await expect(btn).toBeVisible();
  const box = await btn.boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(box.width).toBeGreaterThanOrEqual(44);
  if (W === 390) {
    const dir = artifactsDir('level-grow');
    await page.evaluate(() => PixelPets.openStats(PixelPets.state.partnerId));
    await expect(page.locator('#scLv')).toHaveText('Cap Lv 15 · next Seal: Lv 22');
    await page.locator('#scLv').screenshot({ path: path.join(dir, 'stats-cap-line-390.png') });
    await page.locator('#scClose').click();
    await page.evaluate(() => {
      const p = PixelPets.state.party[0];
      p.bx = 782;
      p.xp = 0;
      delete p.cd;
      delete p.cx;
      PixelPets.careAct('feed');
    });
    await expect(page.locator('#toast')).toBeVisible();
    await expect(page.locator('#toast')).toHaveText('Lv 15 for now. A Seal lifts the cap!');
    await page.locator('#toast').screenshot({ path: path.join(dir, 'cap-toast-390.png') });
  }
});
