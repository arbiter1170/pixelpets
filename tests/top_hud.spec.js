/* TOP_HUD option A. The place chip, its TODAY card, and the yields outside the frame. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const COL_Y = { 320: 102, 375: 102, 390: 148 };
const TOPS = [
  ['fernbrook', 'fb_heights', 6, 1],
  ['proto', 'om_north', 3, 1],
  ['route2', 'r2_glen', 24, 1],
  ['cobblecrest', 'cc_north', 16, 1],
  ['hearthmoor', 'hm_north', 9, 3],
];

function save(mode) {
  const s = starterSave();
  s.settings.controls = mode;
  s.settings.follower = false;
  s.settings.tips = false;
  s.flags['story.early_done'] = true;
  s.flags['story.tutorial_done'] = true;
  s.flags['story.mom_sent'] = true;
  s.flags['story.cobble_end'] = true;
  return s;
}

async function boot(page, mode) {
  await installSave(page.context(), save(mode), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForFunction(() => document.querySelector('#mapCanvas').width > 0);
}

async function settled(page) {
  let quiet = 0;
  for (let i = 0; i < 16 && quiet < 2; i++) {
    const n = await page.evaluate(() => {
      return ['#thChip', '#fcTL'].reduce((k, s) => {
        const el = document.querySelector(s);
        return k + (el ? el.getAnimations().length : 0);
      }, 0);
    });
    quiet = n ? 0 : quiet + 1;
    await page.waitForTimeout(70);
  }
}

async function stand(page, map, x, y) {
  await page.evaluate(([map, x, y]) => {
    PixelPets.goto(map, x, y, 'up');
    if (PixelPets.scene) PixelPets.endScene();
  }, [map, x, y]);
  await settled(page);
}

async function tapWalk(page, x, y) {
  return page.evaluate(([x, y]) => {
    const mc = document.querySelector('#mapCanvas');
    const opt = { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'touch', isPrimary: true };
    mc.dispatchEvent(new PointerEvent('pointerdown', opt));
    mc.dispatchEvent(new PointerEvent('pointerup', opt));
    const w = PixelPets.walk;
    const moving = !!(w && ((w.path && w.path.length) || w.target || w.to));
    if (w) { w.path = null; w.to = null; w.target = null; w.aim = null; }
    return moving;
  }, [x, y]);
}

async function layout(page) {
  return page.evaluate(() => {
    const c = document.querySelector('#mapCanvas');
    const cr = c.getBoundingClientRect();
    const k = cr.width / c.width;
    const T = 16 * k;
    const cam = PixelPets.walk.cam;
    const info = PixelPets.mapInfo;
    const X = tx => cr.left + tx * T - cam.x * k;
    const Y = ty => cr.top + ty * T - cam.y * k;
    const clip = [Math.max(cr.left, 0), Math.max(cr.top, 0), Math.min(cr.right, innerWidth), Math.min(cr.bottom, innerHeight)];
    const zones = [];
    for (const o of info.objs) {
      if (o.kind !== 'warp') continue;
      const edges = [];
      if (o.y <= 2) edges.push('up');
      if (info.h - 1 - o.y <= 2) edges.push('down');
      if (o.x <= 2) edges.push('left');
      if (info.w - 1 - o.x <= 2) edges.push('right');
      for (const edge of edges) {
        let z;
        if (edge === 'up') z = [X(o.x - 2.5), -1e9, X(o.x + 3.5), Y(3)];
        else if (edge === 'down') z = [X(o.x - 2.5), Y(info.h - 3), X(o.x + 3.5), 1e9];
        else if (edge === 'left') z = [-1e9, Y(o.y - 2.5), X(3), Y(o.y + 3.5)];
        else z = [X(info.w - 3), Y(o.y - 2.5), 1e9, Y(o.y + 3.5)];
        const box = [Math.max(z[0], clip[0]), Math.max(z[1], clip[1]), Math.min(z[2], clip[2]), Math.min(z[3], clip[3])];
        if (box[2] > box[0] && box[3] > box[1]) zones.push({ id: o.id, edge, x: o.x, y: o.y, box });
      }
    }
    const boxOf = el => {
      if (!el || !el.offsetParent) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, w: r.width, h: r.height, right: r.right, bottom: r.bottom };
    };
    return {
      v: PixelPets.state.v,
      canvas: [cr.left, cr.top, cr.right, cr.bottom],
      zones,
      chip: boxOf(document.querySelector('#thChip')),
      col: boxOf(document.querySelector('#fcTL')),
      colTop: document.querySelector('#fcTL').style.top,
      shift: document.querySelector('#thChip').style.transform || '',
      hour: document.querySelector('#thHour').textContent,
      hourW: Math.round(document.querySelector('#thHour').getBoundingClientRect().width),
      glyph: !document.querySelector('#clockGlyph').hidden,
      temp: !document.querySelector('#thTemp').hidden,
      place: document.querySelector('#thPlace').textContent,
      buttons: [...document.querySelectorAll('#fcTL button')].filter(b => b.offsetParent).map(b => {
        const r = b.getBoundingClientRect();
        return { id: b.id, x: r.left, y: r.top, w: r.width, h: r.height };
      }),
    };
  });
}

function meets(r, z, m) {
  return r.x - m < z[2] && r.x + r.w + m > z[0] && r.y - m < z[3] && r.y + r.h + m > z[1];
}

for (const mode of ['modern', 'arcade']) {
  test(`place chip clears top exits and a tap still walks (${mode})`, async ({ page }) => {
    test.setTimeout(120000);
    await boot(page, mode);
    expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
    for (const [map, id, x, y] of TOPS) {
      await stand(page, map, x, y);
      const lay = await layout(page);
      expect(lay.v, map).toBe(2);
      expect(lay.chip, map).toBeTruthy();
      expect(Math.round(lay.chip.h), map).toBeGreaterThanOrEqual(44);
      expect(Math.round(lay.chip.w), map).toBeGreaterThanOrEqual(44);
      expect(lay.chip.y, map + ' top band').toBeGreaterThanOrEqual(50);
      const zone = lay.zones.find(z => z.id === id) || lay.zones.find(z => z.edge === 'up');
      expect(zone, map + ' zone').toBeTruthy();
      if (mode === 'modern') expect(meets(lay.chip, zone.box, 6), map + ' chip in zone').toBe(false);
      const hits = await page.evaluate(([tx, ty]) => {
        const c = document.querySelector('#mapCanvas');
        const cr = c.getBoundingClientRect();
        const k = cr.width / c.width;
        const T = 16 * k;
        const cam = PixelPets.walk.cam;
        const X = t => cr.left + t * T - cam.x * k;
        const Y = t => cr.top + t * T - cam.y * k;
        const at = (px, py) => {
          const el = document.elementFromPoint(px, py);
          return el && (el.id === 'mapCanvas' || el === c);
        };
        const tile = at((X(tx) + X(tx + 1)) / 2, (Y(ty) + Y(ty + 1)) / 2);
        const pastY = Math.max(cr.top + 2, Y(0) - T * 0.5);
        const past = at((X(tx) + X(tx + 1)) / 2, Math.min(cr.bottom - 2, pastY));
        return { tile, past, px: (X(tx) + X(tx + 1)) / 2, py: (Y(ty) + Y(ty + 1)) / 2, ppx: (X(tx) + X(tx + 1)) / 2, ppy: Math.min(cr.bottom - 2, pastY) };
      }, [zone.x, zone.y]);
      expect(hits.tile, map + ' exit tile').toBe(true);
      expect(hits.past, map + ' past the edge').toBe(true);
      expect(await tapWalk(page, hits.px, hits.py), map + ' walk').toBe(true);
    }
  });
}

// TOP_HUD v0.1.5 section 0 (conflict 9, D793) and MODERN_HUD_CLEAR 0.1: the yield and column checks run with the
// mhc-frame class off. Modern portrait walk now turns it on by default (#199 dock, D789), so force it off here.
async function frameOff(page) {
  expect(await page.evaluate(() => PixelPets.setHudPads(false))).toBe(false);
}

test('proto left column yields, then goes home one step after the zone leaves', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page, 'modern');
  await frameOff(page);
  const w = page.viewportSize().width;
  await stand(page, 'proto', 3, 1);
  const lay = await layout(page);
  const want = COL_Y[w];
  expect(Math.round(lay.col.y), 'column y').toBe(want);
  for (const b of lay.buttons) {
    expect(b.w).toBeGreaterThanOrEqual(44);
    expect(b.h).toBeGreaterThanOrEqual(44);
    const zone = lay.zones.find(z => z.id === 'om_north');
    expect(meets(b, zone.box, 0), b.id).toBe(false);
  }
  const taps = await page.evaluate(() => {
    const ids = [];
    for (const p of [[30, 30], [30, 80]]) {
      const el = document.elementFromPoint(p[0], p[1]);
      ids.push(el && el.id);
    }
    return ids;
  });
  expect(taps).toEqual(['mapCanvas', 'mapCanvas']);
  expect(await tapWalk(page, 30, 30)).toBe(true);
  let left = false;
  for (let i = 0; i < 18; i++) {
    await page.evaluate(() => PixelPets.walkStep('down'));
    await settled(page);
    const step = await layout(page);
    if (!step.zones.some(z => z.id === 'om_north' && z.edge === 'up')) { left = true; break; }
  }
  const home = await layout(page);
  if (left) {
    expect(Math.round(home.col.y)).toBe(6);
    expect(home.colTop).toBe('');
  } else {
    const zone = home.zones.find(z => z.id === 'om_north');
    expect(zone, 'zone stays on a map that fits').toBeTruthy();
    for (const b of home.buttons) expect(meets(b, zone.box, 0), b.id).toBe(false);
  }
});

test('reduced motion jumps the chip and the column with no tween', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await boot(page, 'modern');
  await frameOff(page);
  await stand(page, 'proto', 3, 1);
  const motion = await page.evaluate(() => {
    const chip = document.querySelector('#thChip');
    const col = document.querySelector('#fcTL');
    const cs = getComputedStyle(chip), cc = getComputedStyle(col);
    return { chip: cs.transitionDuration, col: cc.transitionDuration, y: Math.round(col.getBoundingClientRect().top) };
  });
  expect(motion.chip).toBe('0s');
  expect(motion.col).toBe('0s');
  expect(motion.y).toBe(COL_Y[page.viewportSize().width]);
});

test('no weather leaves no blank gap on the chip', async ({ page }) => {
  await boot(page, 'modern');
  await stand(page, 'hearthmoor', 8, 8);
  const g = await page.evaluate(() => {
    const chip = document.querySelector('#thChip').getBoundingClientRect();
    const hour = document.querySelector('#thHour').getBoundingClientRect();
    const glyph = document.querySelector('#clockGlyph');
    const temp = document.querySelector('#thTemp');
    return {
      glyph: glyph.hidden || getComputedStyle(glyph).display === 'none',
      temp: temp.hidden || getComputedStyle(temp).display === 'none',
      gap: hour.left - chip.left,
      place: document.querySelector('#thPlace').textContent,
      hour: document.querySelector('#thHour').textContent,
      hourW: Math.round(hour.width),
    };
  });
  expect(g.glyph).toBe(true);
  expect(g.temp).toBe(true);
  expect(g.gap).toBeLessThan(12);
  expect(g.place.length).toBeGreaterThan(0);
  expect(g.hour).toMatch(/^[A-Z]{3} \d{1,2}:\d{2}$/);
  expect(g.hourW).toBe(52);
});

test('TODAY card buttons are at least 44 px and MAP opens the map', async ({ page }) => {
  await boot(page, 'modern');
  await stand(page, 'hearthmoor', 8, 8);
  await page.locator('#thChip').click();
  await expect(page.locator('#ovEnv')).toBeVisible();
  await expect(page.locator('#ovEnv .ov-title')).toHaveText('TODAY');
  for (const id of ['#envUseLoc', '#thMap', '#envClose']) {
    const b = await page.locator(id).boundingBox();
    expect(b.width, id).toBeGreaterThanOrEqual(44);
    expect(b.height, id).toBeGreaterThanOrEqual(44);
  }
  await expect(page.locator('#envUseLoc')).toHaveText('LOCATION');
  await expect(page.locator('#thMap')).toBeEnabled();
  await page.locator('#thMap').click();
  await expect(page.locator('#ovMap')).toBeVisible();
  await expect(page.locator('#ovEnv')).toBeHidden();
});

test('a tutorial card never covers the chip, and a quest box keeps 6 px', async ({ page }) => {
  await boot(page, 'modern');
  await stand(page, 'hearthmoor', 8, 8);
  expect(await page.evaluate(() => PixelPets.replayTour())).toBe(true);
  await expect(page.locator('#tutCard')).toBeVisible();
  const covered = await page.evaluate(() => {
    const a = document.querySelector('#tutCard').getBoundingClientRect();
    const b = document.querySelector('#thChip').getBoundingClientRect();
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  });
  expect(covered).toBe(false);
  await page.evaluate(() => { if (window.PixelPets.endScene) PixelPets.endScene(); });
  await page.keyboard.press('Escape');
  await page.evaluate(() => PixelPets.cueForce({ x: 0, y: 40 }));
  await page.waitForTimeout(250);
  const gap = await page.evaluate(() => {
    const chips = PixelPets.cueChips() || [];
    const cr = document.querySelector('#mapCanvas').getBoundingClientRect();
    const chip = document.querySelector('#thChip').getBoundingClientRect();
    const sep = (box) => {
      const l = cr.left + box.x, t = cr.top + box.y, r = l + box.w, b = t + box.h;
      const dx = Math.max(chip.left - r, l - chip.right);
      const dy = Math.max(chip.top - b, t - chip.bottom);
      return Math.max(dx, dy);
    };
    return chips.filter(c => c.box).map(c => sep(c.box));
  });
  expect(gap.length).toBeGreaterThan(0);
  for (const g of gap) expect(g).toBeGreaterThanOrEqual(6);
});

test('the frame keeps the chip and the column at home', async ({ page }) => {
  await boot(page, 'modern');
  expect(await page.evaluate(() => PixelPets.setHudPads(true))).toBe(true);
  await stand(page, 'proto', 3, 1);
  // Under the frame the chip's home is the dock's top row and the left column's buttons are the dock's second row
  // (MODERN_HUD_CLEAR D789, D780; built in #199). TOP_HUD section 15: with the class on, the chip and the column never
  // yield, and the pads are the dock packet's, 0 in portrait (D793, D785).
  const g = await page.evaluate(() => {
    const col = document.querySelector('#fcTL');
    const chip = document.querySelector('#thChip');
    const map = document.querySelector('#mapCanvas').getBoundingClientRect();
    const btns = [...document.querySelectorAll('#repBtn, #questBtn, #walkBagBtn, #mapBtn')].filter(b => b.offsetParent);
    const over = el => { const r = el.getBoundingClientRect(); return r.left < map.right && r.right > map.left && r.top < map.bottom && r.bottom > map.top; };
    return {
      shift: chip.style.transform || '',
      colTop: col.style.top,
      chipHome: chip.parentElement.id,
      btnHomes: btns.map(b => b.parentElement.id),
      over: [chip, ...btns].filter(over).map(el => el.id),
      pads: PixelPets.mapInfo.pads,
      v: PixelPets.state.v,
    };
  });
  expect(g.v).toBe(2);
  expect(g.shift).toBe('');
  expect(g.colTop).toBe('');
  expect(g.chipHome).toBe('fcDockChip');
  expect(g.btnHomes.length).toBeGreaterThanOrEqual(3);
  for (const id of g.btnHomes) expect(id).toBe('fcDockR2Left');
  expect(g.over).toEqual([]);
  expect(g.pads).toMatchObject({ on: true, top: 0, left: 0, right: 0, bottom: 0 });
});

test('arcade does not yield the left column', async ({ page }) => {
  await boot(page, 'arcade');
  await stand(page, 'proto', 3, 1);
  const g = await page.evaluate(() => {
    const chip = document.querySelector('#thChip');
    const col = document.querySelector('#fcTL');
    return { shift: chip.style.transform || '', colTop: col.style.top, pos: getComputedStyle(chip).position };
  });
  expect(g.shift).toBe('');
  expect(g.colTop).toBe('');
  expect(g.pos).not.toBe('absolute');
});

test('glen_east: the chip clears the east exit and stays out of the top band', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page, 'modern');
  await stand(page, 'route2_glen', 22, 4);
  let prev = null;
  for (let i = 0; i < 6; i++) {
    const lay = await layout(page);
    expect(lay.chip.y).toBeGreaterThanOrEqual(50);
    const zone = lay.zones.find(z => z.id === 'glen_east');
    if (zone) expect(meets(lay.chip, zone.box, 6), JSON.stringify({ y: lay.chip.y, box: zone.box, tf: lay.shift })).toBe(false);
    if (prev != null) expect(Math.round(lay.chip.y)).toBeGreaterThanOrEqual(prev - 1);
    prev = Math.round(lay.chip.y);
    await page.evaluate(() => PixelPets.walkStep('down'));
    await settled(page);
  }
});

test('a v2 save loads and stays v2', async ({ page }) => {
  const raw = save('modern');
  await boot(page, 'modern');
  const got = await page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem('pixelpets.save.v2'));
    return { v: PixelPets.state.v, stored: stored.v, id: PixelPets.state.party[0].id };
  });
  expect(got.v).toBe(2);
  expect(got.stored).toBe(2);
  expect(got.id).toBe(raw.party[0].id);
  expect(raw.v).toBe(2);
});

test('Hearthmoor north gate: no left-column button sits in an exit zone', async ({ page }) => {
  await boot(page, 'modern');
  await stand(page, 'hearthmoor', 10, 3);
  const lay = await layout(page);
  const ups = lay.zones.filter(z => z.edge === 'up');
  expect(ups.length).toBeGreaterThan(0);
  for (const b of lay.buttons) {
    for (const z of ups) expect(meets({ x: b.x, y: b.y, w: b.w, h: b.h }, z.box, 0), b.id + ' ' + z.id).toBe(false);
  }
});
