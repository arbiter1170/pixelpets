/* Q26 modern and arcade controls (NEXT_PLAN §3 Q26). Arcade is the old layout; modern is a full-screen map with floating buttons. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, boxesOverlap } = require('./helpers');

trackErrors(test, expect);

function modernSave(extra = {}) {
  const s = starterSave();
  s.flags['story.phone_got'] = true;
  Object.assign(s.settings, { controls: 'modern' }, extra);
  return s;
}

test('a save with no settings.controls stays arcade', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await expect(page.locator('#dpad')).toBeVisible();
  await expect(page.locator('#talkBtn')).toBeVisible();
  await expect(page.locator('#tabs')).toBeVisible();
  await expect(page.locator('#floatCtl')).toBeHidden();
  const st = await page.evaluate(() => ({ c: PixelPets.controls, v: PixelPets.state.v, q: document.querySelector('#questBtn').parentNode.id }));
  expect(st).toEqual({ c: { mode: 'arcade', joystick: false, dpad: null }, v: 2, q: 'tabs' });
});

test('modern fills the screen and every floating button works', async ({ page }) => {
  await installSave(page.context(), modernSave(), { quietDay: true });
  await gotoGame(page);
  await page.evaluate(() => PixelPets.showTab('walk'));
  for (const s of ['#top', '#tabs', '.walk-hud', '#dpad', '#talkBtn']) await expect(page.locator(s)).toBeHidden();
  const h = await page.evaluate(() => [document.querySelector('#app').getBoundingClientRect().height, document.querySelector('#mapWrap').getBoundingClientRect().height]);
  expect(Math.abs(h[0] - h[1])).toBeLessThanOrEqual(2);
  const ids = ['#questBtn', '#walkBagBtn', '#mapBtn', '#gearFloat', '#phoneBtn', '#colFloat', '#petFloat', '#petStrip'];
  const boxes = [];
  for (const id of ids) { const b = await page.locator(id).boundingBox(); expect(b.width).toBeGreaterThanOrEqual(44); expect(b.height).toBeGreaterThanOrEqual(44); boxes.push(b); }
  boxes.push(await page.locator('#envBadge').boundingBox(), await page.locator('#walkTip').boundingBox());
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) expect(boxesOverlap(boxes[i], boxes[j])).toBe(false);
  const pairs = [['#questBtn', '#ovQuest', '#questClose'], ['#walkBagBtn', '#ovBag', '#bagClose'], ['#mapBtn', '#ovMap', '#mapClose'],
    ['#gearFloat', '#ovSettings', '#setClose'], ['#phoneBtn', '#ovPhone', '#phoneClose'], ['#petStrip', '#ovStats', '#scClose']];
  for (const [btn, ov, close] of pairs) {
    await page.locator(btn).click();
    await expect(page.locator(ov)).toBeVisible();
    await page.waitForFunction(() => PixelPets.optionsReady !== false);
    await page.waitForTimeout(600);
    await page.locator(close).click();
    await expect(page.locator(ov)).toBeHidden();
  }
  await page.locator('#colFloat').click();
  await expect(page.locator('#scr-col')).toHaveClass(/active/);
  await page.locator('#scr-col .scr-back').click();
  await expect(page.locator('#scr-walk')).toHaveClass(/active/);
  await page.locator('#petFloat').click();
  await expect(page.locator('#scr-pet')).toHaveClass(/active/);
  await expect(page.locator('#settingsBtn')).toBeVisible();
  await page.locator('#scr-pet .scr-back').click();
  await expect(page.locator('#scr-walk')).toHaveClass(/active/);
});

test('Settings switches both ways, survives a reload, and puts nodes home', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.locator('#settingsBtn').click();
  await expect(page.locator('#setJoystick')).toBeHidden();
  await page.locator('#setControls').click();
  await expect(page.locator('#setControlsVal')).toHaveText('MODERN');
  await expect(page.locator('#setJoystick')).toBeVisible();
  await page.locator('#setClose').click();
  await expect(page.locator('#gearFloat')).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')).settings.controls);
  expect(saved).toBe('modern');
  await page.locator('#gearFloat').click();
  await page.locator('#setControls').click();
  await page.locator('#setClose').click();
  const home = await page.evaluate(() => ['#questBtn', '#phoneBtn', '#walkBagBtn', '#mapBtn'].map(s => document.querySelector(s).parentNode.id));
  expect(home).toEqual(['tabs', 'dpad', 'dpad', 'dpad']);
  await expect(page.locator('#dpad')).toBeVisible();
});

test('the joystick walks like a held arrow and ignores a tap', async ({ page }) => {
  await installSave(page.context(), modernSave({ joystick: true }), { quietDay: true });
  await gotoGame(page);
  await page.evaluate(() => PixelPets.showTab('walk'));
  const r = await page.locator('#joyRing').boundingBox();
  const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
  const x0 = await page.evaluate(() => PixelPets.state.world.x);
  await page.mouse.move(cx, cy); await page.mouse.down(); await page.mouse.up();
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => PixelPets.state.world.x)).toBe(x0);
  await page.mouse.move(cx, cy); await page.mouse.down(); await page.mouse.move(cx + 30, cy, { steps: 3 });
  expect(await page.evaluate(() => PixelPets.controls.dpad)).toBe('right');
  await page.waitForTimeout(600);
  await page.mouse.up();
  expect(await page.evaluate(() => PixelPets.controls.dpad)).toBe(null);
  expect(await page.evaluate(() => PixelPets.state.world.x)).toBeGreaterThan(x0);
});

test('Space advances every line of Ness\'s phone_grant, the last one too, and does not re-press a focused button', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.locator('#tabs button[data-tab="walk"]').click();
  expect(await page.evaluate(() => PixelPets.runScene('phone_grant'))).toBe(true);
  await page.focus('#talkBtn');
  for (let i = 0; i < 12 && !(await page.locator('#ovScene').isHidden()); i++) { await page.keyboard.press(' '); await page.waitForTimeout(350); }
  await expect(page.locator('#ovScene')).toBeHidden();
  expect(await page.evaluate(() => PixelPets.state.flags['story.phone_got'])).toBe(true);
  await page.waitForTimeout(300);
  await expect(page.locator('#ovScene')).toBeHidden();
  await expect(page.locator('#ovQuest')).toBeHidden();
});

// Design green calls (Oct 15): tip band 28 px / 44 px (2-line clamp), joystick 8 px above the band, toasts above the ring.
async function bandAt(page, html) {
  await page.evaluate(h => { window.PP_TIP_TEST = h; }, html);
  await expect.poll(() => page.evaluate(() => document.querySelector('#walkTip').textContent)).toContain(html.slice(0, 20));
  await page.evaluate(() => window.dispatchEvent(new Event('resize'))); await page.waitForTimeout(150);
  return page.evaluate(() => {
    const r = s => document.querySelector(s).getBoundingClientRect(), t = document.querySelector('#toast');
    t.textContent = 'Test toast'; t.classList.add('show');
    const tip = r('#fcTip'), strip = r('#petStrip'), joy = document.querySelector('#joyRing'), tw = document.querySelector('#walkTip');
    const out = { tipH: Math.round(tip.height), tipTop: tip.top, tipBottom: tip.bottom, stripTop: strip.top, lines: Math.round(tw.clientHeight / parseFloat(getComputedStyle(tw).lineHeight)),
      clamped: tw.scrollHeight > tw.clientHeight + 1 || tw.scrollWidth > tw.clientWidth + 1, joy: joy.hidden ? null : r('#joyRing'), toast: r('#toast') };
    t.classList.remove('show'); return out;
  });
}
for (const joystick of [false, true]) {
  test(`tip band heights, ring and toast placement (joystick ${joystick ? 'on' : 'off'})`, async ({ page }) => {
    await installSave(page.context(), modernSave({ joystick }), { quietDay: true });
    await gotoGame(page, '?debug=1');
    await page.evaluate(() => PixelPets.showTab('walk')); await page.waitForTimeout(300);
    const short = await bandAt(page, 'Tap the ground to walk.');
    expect(short.tipH).toBe(28);
    const long = await bandAt(page, 'A very long objective line that will not fit on one line at any phone width, so the band grows to two lines and then clamps the rest with an ellipsis at the end.');
    expect(long.tipH).toBe(44);
    expect(long.lines).toBeLessThanOrEqual(2);
    expect(long.clamped).toBe(true);
    for (const b of [short, long]) {
      expect(b.tipBottom).toBeLessThanOrEqual(b.stripTop + 0.5);           // never covers the partner strip
      if (joystick) {
        expect(Math.abs(b.joy.bottom - (b.tipTop - 8))).toBeLessThanOrEqual(1);   // ring 8 px above the band, moves with it
        expect(b.toast.bottom).toBeLessThanOrEqual(b.joy.top + 0.5);      // toast above the ring
      } else {
        expect(b.joy).toBeNull();
        expect(b.toast.bottom).toBeLessThanOrEqual(b.tipTop + 0.5);       // toast above the band
      }
      expect(b.toast.top).toBeGreaterThan(60);                             // in the free map area, below the top buttons' row
    }
  });
}

// QA Oct 15 (PR #48) fixes.
test('arcade hides the WALK back button on PARTNER and WALKLINGS', async ({ page }) => {
  const s = starterSave(); s.settings = Object.assign(s.settings || {}, { controls: 'arcade' });
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page);
  for (const tab of ['pet', 'col']) {
    await page.evaluate(t => PixelPets.showTab(t), tab);
    await expect(page.locator(`#scr-${tab} .scr-back`)).toBeHidden();
  }
});

test('modern gear: locked look and no action during a scene once you have a partner; works again after', async ({ page }) => {
  await installSave(page.context(), modernSave(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.evaluate(() => PixelPets.showTab('walk'));
  expect(await page.evaluate(() => PixelPets.runScene('phone_grant'))).toBe(true);
  await expect(page.locator('body')).toHaveClass(/gear-locked/);
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('#gearFloat')).pointerEvents)).toBe('none');
  await page.locator('#gearFloat').click({ force: true });
  await expect(page.locator('#ovSettings')).toBeHidden();
  for (let i = 0; i < 12 && !(await page.locator('#ovScene').isHidden()); i++) { await page.keyboard.press(' '); await page.waitForTimeout(300); }
  await expect(page.locator('body')).not.toHaveClass(/gear-locked/);
  await page.waitForTimeout(700);
  await page.locator('#gearFloat').click();
  await expect(page.locator('#ovSettings')).toBeVisible();
});

for (const controls of ['arcade', 'modern']) {
  test(`the area badge is a 44 px tap target (${controls})`, async ({ page }) => {
    await installSave(page.context(), controls === 'modern' ? modernSave() : starterSave(), { quietDay: true });
    await gotoGame(page);
    await page.evaluate(() => PixelPets.showTab('walk'));
    const b = await page.locator('#envBadge').boundingBox();
    expect(b.height).toBeGreaterThanOrEqual(44);
    await page.locator('#envBadge').click();
    await expect(page.locator('#ovEnv')).toBeVisible();
  });
}

test('the real Route 1 walk tip grows to two lines instead of an ellipsis (modern)', async ({ page }) => {
  const s = modernSave();
  Object.assign(s.flags, { 'story.early_done': true, 'spotted.rival1_rook': true, 'story.rival1_done': true, 'story.rival1_result': 'lost', 'story.reached_route1': true });
  delete s.flags['story.phone_got'];
  s.world = { map: 'route1', x: 4, y: 8, facing: 'right', respawn: 'hearthmoor' };
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  const r = await page.evaluate(() => {
    const el = document.querySelector('#walkTip'), cs = getComputedStyle(el), rg = document.createRange(); let w = 0;
    el.childNodes.forEach(n => { if (n.nodeName !== 'CANVAS') { rg.selectNodeContents(n); w += rg.getBoundingClientRect().width; } });
    return { txt: el.textContent, two: document.querySelector('#fcTip').classList.contains('two'), h: document.querySelector('#fcTip').getBoundingClientRect().height,
      clipped: el.scrollHeight > el.clientHeight + 1, oneLineFits: w <= el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) };
  });
  expect(r.txt).toContain("Fernbrook's orchards");      // QA's line: too long for one line at 320, 375 and 390
  expect(r.two).toBe(true); expect(r.h).toBe(44); expect(r.clipped).toBe(false);
});

test('DEBUG SAVE shows in Settings straight after a ?debug=1 load', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.locator('#settingsBtn').click();
  await expect(page.locator('#setBuild')).toContainText('DEBUG SAVE', { timeout: 500 });
});
