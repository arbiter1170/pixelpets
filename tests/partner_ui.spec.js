/* PARTNER_UI D245–D257: icons, GROW fill, HOLDER badge, Friends wording, INTERACT / GEAR returns. */
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

function saveWith(extra) {
  const s = starterSave();
  s.player.name = 'Wayfarer';
  s.flags['story.phone_got'] = true;
  if (extra) Object.assign(s.party[0], extra);
  return s;
}

async function boot(page, extra, search, settings) {
  const save = saveWith(extra);
  if (settings) Object.assign(save.settings, settings);
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page, search || '');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.state && window.PixelPets.state.party[0]);
}

const rgbAt = (page, sel, x, y) => page.evaluate(({ sel, x, y }) => {
  const c = document.querySelector(sel);
  const d = c.getContext('2d').getImageData(x, y, 1, 1).data;
  return { w: c.width, h: c.height, glyph: c.dataset.glyph || '', rgb: [d[0], d[1], d[2], d[3]] };
}, { sel, x, y });

test('D245 icons: apple on FOOD, cyan bolt on NRG and REST, heart and star stay, badges stay', async ({ page }) => {
  await boot(page);
  const food = await rgbAt(page, '.stats .ico-food', 2, 0);
  const foodRed = await rgbAt(page, '.stats .ico-food', 1, 1);
  const joy = await rgbAt(page, '.stats .ico-joy', 1, 0);
  const nrg = await rgbAt(page, '#statStrip .ico-bolt', 0, 0);
  const rest = await rgbAt(page, '.btn-rest .ico-bolt', 0, 0);
  const grow = await rgbAt(page, '#statStrip .ico-grow', 3, 1);
  expect(food).toMatchObject({ w: 7, h: 7, glyph: 'apple7', rgb: [37, 113, 121, 255] });
  expect(foodRed.rgb).toEqual([177, 62, 83, 255]);
  expect(joy).toMatchObject({ w: 5, h: 5, glyph: 'heart', rgb: [177, 62, 83, 255] });
  expect(nrg).toMatchObject({ w: 5, h: 5, glyph: 'bolt', rgb: [115, 239, 247, 255] });
  expect(rest).toMatchObject({ w: 5, h: 5, glyph: 'bolt', rgb: [115, 239, 247, 255] });
  expect(grow.glyph).toBe('star');
  expect(grow.w).toBe(8);
  expect(grow.h).toBe(8);
  expect(grow.rgb[3]).toBeGreaterThan(0);
  const glyphs = await page.evaluate(() => ({
    apple: GLYPH.apple.slice(),
    heart: GLYPH.heart.slice(),
    badge_food: GLYPH.badge_food.slice(),
    badge_rest: GLYPH.badge_rest.slice(),
  }));
  expect(glyphs.apple).toEqual(['..t..', '.rrr.', 'rrrwr', 'rrrrr', '.rrr.']);
  expect(glyphs.heart).toEqual(['.r.r.', 'rrrrr', 'rrrrr', '.rrr.', '..r..']);
  expect(glyphs.badge_food).toEqual(['.....', 'y.y.y', 'ooooo', '.ooo.', '..o..']);
  expect(glyphs.badge_rest).toEqual(['wwww.', '..w..', '.w...', 'wwww.', '.....']);
});

test('D245 bolt falls back to z when it will not render', async ({ page }) => {
  await boot(page, null, '?debug=1');
  const painted = await page.evaluate(() => {
    GLYPH.bolt = ['.....', '.....', '.....', '.....', '.....'];
    const ok = PixelPets.repaintStats();
    return { ok, glyph: document.querySelector('#statStrip .ico-bolt').dataset.glyph };
  });
  expect(painted.ok).toBe(true);
  expect(painted.glyph).toBe('z');
});

test('D248 GROW bar is total over goal, and a full form stays full', async ({ page }) => {
  await boot(page, { stage: 1, xp: 40 });
  const mid = await page.evaluate(() => {
    const bar = document.querySelector('#barXp');
    const box = bar.parentNode;
    return {
      width: parseFloat(bar.style.width),
      text: document.querySelector('#valXp').textContent,
      now: box.getAttribute('aria-valuenow'),
      max: box.getAttribute('aria-valuemax'),
    };
  });
  expect(mid.width).toBeCloseTo(40 / 120 * 100, 2);
  expect(mid.text).toBe('40');
  expect(mid.now).toBe('33');
  expect(mid.max).toBe('100');
  await boot(page, { stage: 2, xp: 200 });
  const full = await page.evaluate(() => {
    const bar = document.querySelector('#barXp');
    return { width: parseFloat(bar.style.width), text: document.querySelector('#valXp').textContent, now: bar.parentNode.getAttribute('aria-valuenow') };
  });
  expect(full.width).toBe(100);
  expect(full.text).toBe('200');
  expect(full.now).toBe('100');
});

test('D256 the pet-scene badge reads HOLDER and keeps its element', async ({ page }) => {
  await boot(page);
  const badge = await page.evaluate(() => {
    const k = document.querySelector('#petKeeper');
    const scene = document.querySelector('.pet-scene').getBoundingClientRect();
    const r = k.getBoundingClientRect();
    return {
      id: k.id,
      title: k.querySelector('b') && k.querySelector('b').textContent,
      name: k.childNodes[1] && k.childNodes[1].textContent,
      aria: k.getAttribute('aria-label'),
      inside: r.left >= scene.left - 1 && r.top >= scene.top - 1 && r.right <= scene.right + 1 && r.bottom <= scene.bottom + 1,
    };
  });
  expect(badge).toEqual({ id: 'petKeeper', title: 'HOLDER', name: 'Wayfarer', aria: 'Holder Wayfarer', inside: true });
});

test('D257 Friends still says HOLDER and YOUR HOLDER CODE', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.locator('#phoneBtn').click();
  await page.locator('[data-app="friends"]').click();
  await expect(page.locator('#phoneFriends')).toBeVisible();
  const text = await page.locator('#phoneFriends').innerText();
  expect(text).toContain('HOLDER');
  expect(text).toContain('YOUR HOLDER CODE');
  expect(text.toLowerCase()).not.toContain('keeper');
  expect(await page.locator('#keeperName').textContent()).toBe('Wayfarer');
  const v = await page.evaluate(() => PixelPets.state.v);
  expect(v).toBe(2);
});

test('INTERACT, GEAR and the returns stay on the screen they came from', async ({ page }) => {
  await boot(page, null, '', { controls: 'modern' });
  await page.locator('#petStatsBtn').click();
  await expect(page.locator('#ovStats')).toBeVisible();
  const taps = await page.evaluate(() => ['#scRename', '#petKitBtn', '#scr-pet [data-act="feed"]', '#scr-pet [data-act="rest"]'].map(sel => {
    const r = document.querySelector(sel).getBoundingClientRect();
    return { sel, w: r.width, h: r.height };
  }));
  for (const t of taps) {
    expect(t.h, t.sel).toBeGreaterThanOrEqual(44);
    expect(t.w, t.sel).toBeGreaterThanOrEqual(44);
  }
  expect(await page.locator('#ovKit').count()).toBe(0);
  expect(await page.locator('#scRename').textContent()).toBe('INTERACT');

  await expect(page.locator('#tabs')).toHaveClass(/locked/);
  const card = await page.locator('#ovStats').innerText();
  expect(card).toContain('INTERACT');
  expect(card).not.toMatch(/RENAME/);

  await page.locator('#scRename').click();
  await expect(page.locator('#scNick')).toBeVisible();
  await expect(page.locator('label[for="scNickIn"]')).toHaveText('NAME');
  await page.locator('#scNickIn').fill('Nope');
  await page.locator('#scNickCancel').click();
  await expect(page.locator('#scNick')).toBeHidden();
  await expect(page.locator('#scActs')).toBeVisible();
  await expect(page.locator('#ovStats')).toBeVisible();
  expect(await page.evaluate(() => PixelPets.state.party[0].nick)).toBeFalsy();

  await page.locator('#scRename').click();
  await page.locator('#scNickIn').fill('Later');
  await page.keyboard.press('Escape');
  await expect(page.locator('#scNick')).toBeHidden();
  await expect(page.locator('#ovStats')).toBeVisible();
  expect(await page.evaluate(() => PixelPets.state.party[0].nick)).toBeFalsy();

  await page.locator('#scRename').click();
  await page.locator('#scNickIn').fill('Nib');
  await page.locator('#scNickOk').click();
  await expect(page.locator('#scNick')).toBeHidden();
  await expect(page.locator('#ovStats')).toBeVisible();
  expect(await page.evaluate(() => PixelPets.state.party[0].nick)).toBe('Nib');

  await page.locator('#scClose').click();
  await expect(page.locator('#ovStats')).toBeHidden();
  await expect(page.locator('#tabs')).not.toHaveClass(/locked/);
  await expect(page.locator('#scr-pet')).toBeVisible();

  await page.locator('#petStatsBtn').click();
  await page.locator('#scRename').click();
  await page.locator('#scNickIn').fill('Drop');
  const outside = await page.evaluate(() => {
    const ov = document.querySelector('#ovStats');
    const spots = [[4, 4], [4, window.innerHeight - 4], [window.innerWidth - 4, 4], [window.innerWidth - 4, window.innerHeight - 4]];
    for (const [x, y] of spots) if (document.elementFromPoint(x, y) === ov) return { x, y };
    return null;
  });
  expect(outside).toBeTruthy();
  await page.mouse.click(outside.x, outside.y);
  await expect(page.locator('#ovStats')).toBeHidden();
  expect(await page.evaluate(() => PixelPets.state.party[0].nick)).toBe('Nib');
  await expect(page.locator('#tabs')).not.toHaveClass(/locked/);

  await page.locator('#petStatsBtn').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#ovStats')).toBeHidden();
  await expect(page.locator('#scr-pet')).toBeVisible();

  await page.locator('#petKitBtn').click();
  await expect(page.locator('#petGear')).toBeVisible();
  await expect(page.locator('#tabs')).not.toHaveClass(/locked/);
  await expect(page.locator('#ovKit')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.locator('#petGear')).toBeHidden();
  await expect(page.locator('#scr-pet')).toBeVisible();
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);

  await page.locator('#petKitBtn').click();
  await page.locator('#scr-pet .scr-back').click();
  await expect(page.locator('#scr-walk')).toBeVisible();
  await expect(page.locator('#petGear')).toBeHidden();
});

test('390 crops of the lower card, the STATS popup and the PARTNER screen', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  await boot(page, { stage: 1, xp: 40 });
  const dir = path.join('test-results', 'partner-ui');
  fs.mkdirSync(dir, { recursive: true });
  await page.locator('.stats.lower-card').screenshot({ path: path.join(dir, 'lower-card.png') });
  await page.locator('#petStatsBtn').click();
  await expect(page.locator('#ovStats')).toBeVisible();
  await page.locator('#ovStats .ov-inner').screenshot({ path: path.join(dir, 'stats-popup.png') });
  await page.locator('#scClose').click();
  await page.locator('#scr-pet').screenshot({ path: path.join(dir, 'partner-screen.png') });
});
