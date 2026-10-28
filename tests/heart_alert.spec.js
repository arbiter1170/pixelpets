/* HEART_ALERT v0.2 (D154–D156): the modern heart button pulses when food or rest is low. */
const path = require('path');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, artifactsDir } = require('./helpers');

trackErrors(test, expect);

function modernSave(pet, flags) {
  const s = starterSave();
  Object.assign(s.party[0], pet || {});
  s.settings.controls = 'modern';
  if (flags) Object.assign(s.flags, flags);
  return s;
}

async function boot(page, pet, flags, search) {
  await installSave(page.context(), modernSave(pet, flags), { quietDay: true });
  await gotoGame(page, search == null ? '?debug=1' : search);
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.state && window.PixelPets.state.party[0]);
  await page.evaluate(() => PixelPets.showTab('walk'));
}

async function shot(page, name) {
  const handle = await page.waitForFunction(() => {
    const s = getComputedStyle(document.querySelector('#petFloat')).boxShadow;
    return /239,\s*125,\s*87|65,\s*166,\s*246/.test(s) ? s : null;
  });
  const shadow = await handle.jsonValue();
  if (page.viewportSize().width === 390) {
    const dir = artifactsDir('screenshots/heart');
    await page.screenshot({ path: path.join(dir, name + '-390.png') });
  }
  return shadow;
}

async function face(page) {
  return page.evaluate(() => {
    const b = document.querySelector('#petFloat');
    const c = b.querySelector('canvas.nav-art');
    const d = c.getContext('2d').getImageData(0, 0, 44, 44).data;
    const at = (x, y) => { const i = (y * 44 + x) * 4; return d[i] + ',' + d[i + 1] + ',' + d[i + 2]; };
    const cs = getComputedStyle(b);
    const h = b.getBoundingClientRect(), paw = document.querySelector('#colFloat').getBoundingClientRect(), strip = document.querySelector('#petStrip').getBoundingClientRect();
    // HEART_ALERT §6: the 2 px ring keeps >= 4 px from the paw and the partner card. In the Modern dock (D780, #199/#200)
    // the card is the full-width row under the heart, so its gap is measured down, not to the left.
    const stripBelow = strip.top >= h.bottom - 0.5;
    return {
      cls: b.className, label: b.getAttribute('aria-label'), live: document.querySelector('#careAlert').textContent,
      care: PixelPets.care(), anim: cs.animationName, dur: cs.animationDuration, shadow: cs.boxShadow, play: cs.animationPlayState,
      food: at(32, 6), restTop: at(32, 2), restBot: at(32, 28),
      gapPaw: paw.left - (h.right + 2), gapStrip: stripBelow ? strip.top - (h.bottom + 2) : (h.left - 2) - strip.right, w: h.width, h: h.height,
      hunger: PixelPets.state.party[0].hunger, energy: PixelPets.state.party[0].energy, v: PixelPets.state.v,
      toast: document.querySelector('#toast').textContent,
    };
  });
}

test('low food, low rest, both, and one FEED or one REST clears it', async ({ page }) => {
  test.setTimeout(45000);
  await boot(page, { hunger: 26, energy: 90 });
  let f = await face(page);
  expect(f.cls).not.toMatch(/care-food|care-rest|care-very/);
  expect(f.care).toEqual({ food: 0, rest: 0 });
  expect(f.label).toBe('Partner');
  expect(f.live).toBe('');
  expect(f.v).toBe(2);

  await page.evaluate(() => PixelPets.setCare({ hunger: 24 }));
  f = await face(page);
  expect(f.care).toEqual({ food: 1, rest: 0 });
  expect(f.cls).toMatch(/care-food/);
  expect(f.cls).not.toMatch(/care-rest|care-very|\bpulse\b/);
  expect(f.label).toBe('Partner. Pipkit is hungry.');
  expect(f.live).toBe('Pipkit is hungry.');
  expect(f.anim).toBe('care-low');
  expect(f.dur).toBe('8.4s');
  expect(f.food).toBe('239,125,87');
  expect(f.restTop).not.toBe('244,244,244');
  expect(f.gapPaw).toBeGreaterThanOrEqual(3.5);
  expect(f.gapStrip).toBeGreaterThanOrEqual(3.5);
  expect(f.w).toBeGreaterThanOrEqual(44);
  expect(f.h).toBeGreaterThanOrEqual(44);
  expect(f.toast).not.toMatch(/hungry|sleepy|napping/);
  const foodRing = await shot(page, 'food-low');
  expect(foodRing).toMatch(/239,\s*125,\s*87/);
  expect(foodRing).toMatch(/0px 0px 0px 2px/);

  await page.locator('#petFloat').click();
  await expect(page.locator('#scr-pet')).toHaveClass(/active/);
  const rows = await page.evaluate(() => [...document.querySelectorAll('#scr-pet .care-block .stat-lab')].map(e => e.textContent.trim()));
  expect(rows[1]).toBe('FOOD');
  expect(rows[2]).toBe('JOY');
  await page.locator('#scr-pet button[data-act="feed"]').click();
  // FEED keeps the care row busy for a little over a second. A REST tap in that window is ignored.
  await page.waitForTimeout(1600);
  await expect.poll(() => page.evaluate(() => PixelPets.state.party[0].hunger)).toBeGreaterThanOrEqual(25);
  await expect(page.locator('#petFloat')).not.toHaveClass(/care-food/);
  expect(await page.locator('#petFloat').getAttribute('aria-label')).toBe('Partner');

  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.evaluate(() => PixelPets.setCare({ energy: 24 }));
  f = await face(page);
  expect(f.care).toEqual({ food: 0, rest: 1 });
  expect(f.cls).toMatch(/care-rest/);
  expect(f.cls).not.toMatch(/care-food|care-very/);
  expect(f.label).toBe('Partner. Pipkit is sleepy.');
  expect(f.live).toBe('Pipkit is sleepy.');
  expect(f.anim).toBe('care-low');
  expect(f.restTop).toBe('244,244,244');
  expect(f.food).not.toBe('239,125,87');
  const restRing = await shot(page, 'rest-low');
  expect(restRing).toMatch(/65,\s*166,\s*246/);
  expect(restRing).toMatch(/0px 0px 0px 2px/);

  await page.locator('#petFloat').click();
  await expect(page.locator('#scr-pet')).toHaveClass(/active/);
  await page.locator('#scr-pet button[data-act="rest"]').click();
  await expect.poll(() => page.evaluate(() => PixelPets.state.party[0].energy)).toBeGreaterThanOrEqual(25);
  await expect(page.locator('#petFloat')).not.toHaveClass(/care-rest/);
  expect(await page.evaluate(() => PixelPets.state.party[0].hunger)).toBeGreaterThanOrEqual(25);
  // REST holds the ring for 3s. The both-low pulse starts once that hold ends.
  await page.waitForTimeout(3200);

  await page.evaluate(() => { PixelPets.showTab('walk'); PixelPets.setCare({ hunger: 24, energy: 24 }); });
  f = await face(page);
  expect(f.care).toEqual({ food: 1, rest: 1 });
  expect(f.cls).toMatch(/care-food/);
  expect(f.cls).toMatch(/care-rest/);
  expect(f.cls).not.toMatch(/care-very/);
  expect(f.label).toBe('Partner. Pipkit is hungry and sleepy.');
  expect(f.live).toBe('Pipkit is hungry and sleepy.');
  expect(f.anim).toBe('care-both-low');
  expect(f.dur).toBe('16.8s');
  expect(f.food).toBe('239,125,87');
  expect(f.restBot).toBe('244,244,244');
  expect(f.v).toBe(2);
  await shot(page, 'both');
});

test('food at 26 is quiet, 20 is very low, and a load that is already low does not speak', async ({ page }) => {
  await boot(page, { hunger: 24, energy: 90 });
  let f = await face(page);
  expect(f.live).toBe('');
  expect(f.cls).toMatch(/care-food/);
  expect(f.label).toBe('Partner. Pipkit is hungry.');
  await page.evaluate(() => PixelPets.setCare({ hunger: 80 }));
  expect(await page.locator('#careAlert').textContent()).toBe('');
  await page.evaluate(() => PixelPets.setCare({ hunger: 24 }));
  await expect(page.locator('#careAlert')).toHaveText('Pipkit is hungry.');
  await page.evaluate(() => PixelPets.setCare({ hunger: 20 }));
  f = await face(page);
  expect(f.care).toEqual({ food: 2, rest: 0 });
  expect(f.cls).toMatch(/care-very/);
  expect(f.anim).toBe('care-very');
  expect(f.dur).toBe('4.8s');
  expect(f.live).toBe('Pipkit is hungry.');
  expect(f.food).toBe('239,125,87');
  await shot(page, 'food-very');
});

test('very low rest and a nap, and one REST clears the nap', async ({ page }) => {
  await boot(page, { hunger: 80, energy: 9 });
  let f = await face(page);
  expect(f.care).toEqual({ food: 0, rest: 2 });
  expect(f.cls).toMatch(/care-rest/);
  expect(f.cls).toMatch(/care-very/);
  expect(f.label).toBe('Partner. Pipkit is sleepy.');
  expect(f.anim).toBe('care-very');
  expect(f.restTop).toBe('244,244,244');
  await shot(page, 'rest-very');

  await page.evaluate(() => { PixelPets.setCare({ energy: 90 }); PixelPets.setFaint(20); });
  f = await face(page);
  expect(f.care.rest).toBe(2);
  expect(f.label).toBe('Partner. Pipkit is napping.');
  expect(f.live).toBe('Pipkit is napping.');
  expect(f.cls).toMatch(/care-very/);
  await shot(page, 'napping');

  await page.locator('#petFloat').click();
  await page.locator('#scr-pet button[data-act="rest"]').click();
  await expect.poll(() => page.evaluate(() => PixelPets.state.party[0].faintUntil || 0)).toBe(0);
  await expect(page.locator('#petFloat')).not.toHaveClass(/care-rest|care-very/);
  expect(await page.locator('#petFloat').getAttribute('aria-label')).toBe('Partner');
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});

test('a REST that leaves food low holds the ring still', async ({ page }) => {
  await boot(page, { hunger: 20, energy: 80 });
  await page.locator('#petFloat').click();
  await page.locator('#scr-pet button[data-act="rest"]').click();
  const f = await face(page);
  expect(f.hunger).toBeLessThanOrEqual(20);
  expect(f.cls).toMatch(/care-hold/);
  expect(f.cls).toMatch(/care-food/);
  expect(f.cls).toMatch(/care-very/);
  expect(f.anim).toBe('none');
  expect(f.shadow).toMatch(/239,\s*125,\s*87/);
  expect(f.shadow).not.toMatch(/inset/);
});

test('arcade, a missing starter, and another Walkling do not light the heart', async ({ page }) => {
  const s = starterSave();
  s.party[0].hunger = 10;
  s.party[0].energy = 5;
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.care);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await expect(page.locator('#floatCtl')).toBeHidden();
  const arcade = await face(page);
  expect(arcade.cls).not.toMatch(/care-food|care-rest/);
  expect(arcade.care).toEqual({ food: 2, rest: 2 });
  expect(arcade.label).toBe('Partner');

  await boot(page, { hunger: 10, energy: 5 });
  const early = await page.evaluate(() => {
    delete PixelPets.state.flags['story.starter_received'];
    PixelPets.setCare({ hunger: 10, energy: 5 });
    const b = document.querySelector('#petFloat');
    return { cls: b.className, label: b.getAttribute('aria-label') };
  });
  expect(early.cls).not.toMatch(/care-food|care-rest/);
  expect(early.label).toBe('Partner');

  await boot(page, { hunger: 80, energy: 90 });
  await page.evaluate(() => {
    const q = JSON.parse(JSON.stringify(PixelPets.state.party[0]));
    q.id = 'petbox1'; q.hunger = 10; q.energy = 5;
    PixelPets.state.box.push(q);
    PixelPets.setCare({ hunger: 80, energy: 90 });
  });
  const party = await face(page);
  expect(party.care).toEqual({ food: 0, rest: 0 });
  expect(party.cls).not.toMatch(/care-food|care-rest/);
});

test('the care hook is inert without debug @w1', async ({ page }) => {
  await installSave(page.context(), modernSave({ hunger: 10 }), { quietDay: true });
  await gotoGame(page);
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.state);
  expect(await page.evaluate(() => PixelPets.care())).toBeUndefined();
  await expect(page.locator('#petFloat')).toHaveClass(/care-food/);
});

test('reduced motion keeps a steady ring and the badge', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await boot(page, { hunger: 24, energy: 90 });
  const a = await face(page);
  expect(a.anim).toBe('none');
  expect(a.shadow).toMatch(/239,\s*125,\s*87/);
  expect(a.shadow).not.toMatch(/inset/);
  expect(a.food).toBe('239,125,87');
  await page.waitForTimeout(500);
  const b = await face(page);
  expect(b.shadow).toBe(a.shadow);
  await page.evaluate(() => PixelPets.setCare({ hunger: 20 }));
  const very = await face(page);
  expect(very.anim).toBe('none');
  expect(very.shadow).toMatch(/inset/);
  expect(very.food).toBe('239,125,87');
  await shot(page, 'reduced-motion');
});

test('a hidden tab pauses the pulse and coming back keeps the state', async ({ page }) => {
  await boot(page, { hunger: 24, energy: 90 });
  const hooked = await page.evaluate(() => {
    const desc = Object.getOwnPropertyDescriptor(Document.prototype, 'hidden');
    if (!desc || desc.configurable === false) return false;
    let hidden = false;
    Object.defineProperty(Document.prototype, 'hidden', { configurable: true, get() { return hidden; } });
    window.__setHidden = (v) => { hidden = !!v; document.dispatchEvent(new Event('visibilitychange')); };
    return true;
  });
  expect(hooked).toBe(true);
  await page.evaluate(() => window.__setHidden(true));
  await expect(page.locator('body')).toHaveClass(/hidden-tab/);
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('#petFloat')).animationPlayState)).toBe('paused');
  await page.evaluate(() => window.__setHidden(false));
  await expect(page.locator('body')).not.toHaveClass(/hidden-tab/);
  await expect(page.locator('#petFloat')).toHaveClass(/care-food/);
  const f = await face(page);
  expect(f.care).toEqual({ food: 1, rest: 0 });
  expect(f.play).toBe('running');
});
