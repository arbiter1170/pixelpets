/* STORES_AND_TOWN_LIFE P0 (D416, D417). Modern edge arrows sit on the rail, on the map canvas, with a tile count. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const CUES = [
  { name: 'nw', x: 1, y: 2, dist: 36 },
  { name: 'ne', x: 23, y: 8, dist: 30 },
  { name: 'w', x: 1, y: 21, dist: 17 },
  { name: 'e', x: 23, y: 20, dist: 18 },
];
const HUD = '#floatCtl button, #clockChip, #envBadge, #fcAcorns, #joyRing, #walkTip, #petStrip';
const DIGITS = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001001001001', '111101111101111', '111101111001111'];

function modernSave() {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.flags['story.mom_sent'] = true;
  s.flags['story.early_done'] = true;
  return s;
}

async function frame(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function place(page, x, y) {
  await page.evaluate(({ x, y }) => {
    PixelPets.showTab('walk');
    PixelPets.goto('hearthmoor', 12, 27, 'down');
    PixelPets.cueForce({ x, y });
  }, { x, y });
  await frame(page);
}

async function readChip(page) {
  return page.evaluate(({ hud, digits }) => {
    const chip = PixelPets.cueChip();
    const c = document.querySelector('#mapCanvas');
    const r = c.getBoundingClientRect();
    const k = r.width / c.width;
    if (!chip) return { chip: null, v: PixelPets.state.v };
    const sx = r.left + chip.x * k, sy = r.top + chip.y * k;
    const hits = [[0, 0], [-7, -7], [7, -7], [-7, 7], [7, 7]].map(([dx, dy]) => {
      let el = document.elementFromPoint(sx + dx, sy + dy);
      while (el && !el.id) el = el.parentElement;
      return el ? el.id : null;
    });
    const gaps = [...document.querySelectorAll(hud)].filter(e => !e.hidden && e.offsetParent).map(e => {
      const b = e.getBoundingClientRect();
      const dx = Math.max(b.left - sx, 0, sx - b.right);
      const dy = Math.max(b.top - sy, 0, sy - b.bottom);
      return { id: e.id || e.className, gap: Math.round(Math.hypot(dx, dy)) };
    }).sort((a, b) => a.gap - b.gap);
    const s = String(chip.shown);
    let x0 = chip.x - ((s.length * 4 - 1) / 2 | 0);
    const y0 = chip.y + 10;
    const img = c.getContext('2d').getImageData(x0, y0, s.length * 4, 5);
    let digitsOk = true;
    for (let ci = 0; ci < s.length && digitsOk; ci++) {
      const d = digits[s.charCodeAt(ci) - 48];
      for (let i = 0; i < 15; i++) {
        const ix = ((((i / 3) | 0) * img.width + ci * 4 + (i % 3)) * 4);
        const white = img.data[ix] > 200 && img.data[ix + 1] > 200 && img.data[ix + 2] > 200;
        if ((d[i] === '1') !== white) digitsOk = false;
      }
    }
    const ring = c.getContext('2d').getImageData(chip.x + 8, chip.y, 1, 1).data;
    return {
      chip, sx: Math.round(sx), sy: Math.round(sy), hits, gaps, digitsOk, v: PixelPets.state.v,
      ring: ring[0] + ',' + ring[1] + ',' + ring[2],
    };
  }, { hud: HUD, digits: DIGITS });
}

test('modern edge arrows sit on the rail, on the map, with a capped tile count', async ({ page }) => {
  await installSave(page.context(), modernSave(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.evaluate(() => PixelPets.showTab('walk'));
  const width = page.viewportSize().width;
  for (const cue of CUES) {
    await place(page, cue.x, cue.y);
    const got = await readChip(page);
    expect(got.v, cue.name).toBe(2);
    expect(got.chip, cue.name + ' chip').toBeTruthy();
    expect(got.chip.dist, cue.name + ' tiles').toBe(cue.dist);
    expect(got.chip.shown, cue.name + ' shown').toBe(cue.dist);
    expect(got.hits, cue.name + ' hits ' + got.sx + ',' + got.sy).toEqual(['mapCanvas', 'mapCanvas', 'mapCanvas', 'mapCanvas', 'mapCanvas']);
    expect(got.gaps[0].gap, cue.name + ' nearest ' + (got.gaps[0] && got.gaps[0].id)).toBeGreaterThanOrEqual(6);
    expect(got.digitsOk, cue.name + ' digits ' + cue.dist).toBe(true);
    if (cue.name === 'nw' || cue.name === 'w') expect(Math.abs(got.sx - 73), cue.name + ' x ' + got.sx).toBeLessThanOrEqual(2);
    if (cue.name === 'ne' || cue.name === 'e') expect(Math.abs(got.sx - (width - 73)), cue.name + ' x ' + got.sx).toBeLessThanOrEqual(2);
    if (cue.name === 'nw' || cue.name === 'ne') expect(Math.abs(got.sy - 73), cue.name + ' y ' + got.sy).toBeLessThanOrEqual(2);
  }
  await place(page, 12 + 80, 27 + 40);
  const cap = await readChip(page);
  expect(cap.chip.dist).toBe(120);
  expect(cap.chip.shown).toBe(99);
  expect(cap.digitsOk).toBe(true);
  expect(cap.hits).toEqual(['mapCanvas', 'mapCanvas', 'mapCanvas', 'mapCanvas', 'mapCanvas']);
  expect(cap.gaps[0].gap).toBeGreaterThanOrEqual(6);

  const seen = new Set();
  const t0 = Date.now();
  while (Date.now() - t0 < 1400 && seen.size < 2) {
    seen.add((await readChip(page)).ring);
    await page.waitForTimeout(70);
  }
  expect(seen.size, 'ring blink ' + [...seen].join(' | ')).toBe(2);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const still = new Set();
  const t1 = Date.now();
  while (Date.now() - t1 < 1400 && still.size < 2) {
    still.add((await readChip(page)).ring);
    await page.waitForTimeout(70);
  }
  expect(still.size, 'ring still blinks in reduced motion ' + [...still].join(' | ')).toBe(2);
  await page.emulateMedia({ reducedMotion: 'no-preference' });

  await page.locator('#gearFloat').click();
  await page.locator('#setJoystick').click({ trial: true });
  await page.locator('#setJoystick').click();
  await page.locator('#setClose').click();
  await expect(page.locator('#joyRing')).toBeVisible();
  await page.evaluate(() => { PixelPets.goto('hearthmoor', 12, 27, 'down'); PixelPets.cueForce({ x: 1, y: 48 }); });
  await frame(page);
  const joy = await readChip(page);
  const joyGap = joy.gaps.find(g => g.id === 'joyRing');
  expect(joy.chip, 'joystick cue').toBeTruthy();
  expect(joy.hits.every(id => id === 'mapCanvas')).toBe(true);
  expect(joyGap && joyGap.gap, 'joy gap').toBeGreaterThanOrEqual(6);
  expect(joy.gaps[0].gap).toBeGreaterThanOrEqual(6);
  await page.locator('#gearFloat').click();
  await page.locator('#setJoystick').click({ trial: true });
  await page.locator('#setJoystick').click();
  await page.locator('#setClose').click();
  await expect(page.locator('#joyRing')).toBeHidden();

  await page.evaluate(() => PixelPets.cueForce({ x: 12, y: 24 }));
  await frame(page);
  expect(await page.evaluate(() => PixelPets.cueChip())).toBeNull();

  await page.evaluate(() => PixelPets.cueForce({ x: 1, y: 2 }));
  await frame(page);
  const a = await page.evaluate(() => PixelPets.cueChip());
  await page.evaluate(() => { PixelPets.goto('route1', 6, 10, 'down'); PixelPets.cueForce({ x: 1, y: 2 }); });
  await frame(page);
  const b = await page.evaluate(() => PixelPets.cueChip());
  await page.waitForTimeout(180);
  const c = await page.evaluate(() => PixelPets.cueChip());
  expect(b).toBeTruthy();
  expect(c).toEqual(b);
  expect(a).not.toEqual(b);

  await page.locator('#gearFloat').click();
  await page.locator('#setControls').click({ trial: true });
  await page.locator('#setControls').click();
  await page.locator('#setClose').click();
  await frame(page);
  expect(await page.evaluate(() => PixelPets.cueChip())).toBeNull();
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});

test('cue hooks stay inert without debug @w1', async ({ page }) => {
  await installSave(page.context(), modernSave(), { quietDay: true });
  await gotoGame(page);
  const got = await page.evaluate(() => ({
    v: PixelPets.state.v,
    force: PixelPets.cueForce({ x: 1, y: 2 }),
    chip: PixelPets.cueChip(),
    debug: PixelPets.debug,
  }));
  expect(got).toEqual({ v: 2, force: undefined, chip: undefined, debug: false });
});
