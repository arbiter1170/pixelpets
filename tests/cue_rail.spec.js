/* QUEST_CUE (D461-D469). Edge cues are today's small arrow in a 44 px box. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const HUD = '#floatCtl button, #clockChip, #envBadge, #fcAcorns, #joyRing, #walkTip, #petStrip, #dpad';
const DIRS = ['right', 'downRight', 'down', 'downLeft', 'left', 'upLeft', 'up', 'upRight'];
const GOLD = [255, 205, 117];
const LIME = [167, 240, 112];
const INK = [26, 28, 44];
const WHITE = [244, 244, 244];

function modernSave() {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.follower = false;
  s.flags['story.mom_sent'] = true;
  s.flags['story.early_done'] = true;
  return s;
}

async function frame(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function openSettings(page) {
  const gear = page.locator('#gearFloat');
  if (await gear.isVisible()) await gear.click();
  else await page.locator('#settingsBtn').click();
  await expect(page.locator('#ovSettings')).toBeVisible();
}

async function boot(page) {
  await installSave(page.context(), modernSave(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.evaluate(() => {
    PixelPets.showTab('walk');
    PixelPets.goto('hearthmoor', 12, 27, 'down');
  });
  await frame(page);
}

async function readEdges(page) {
  return page.evaluate((hud) => {
    const chips = PixelPets.cueChips() || [];
    const c = document.querySelector('#mapCanvas');
    const r = c.getBoundingClientRect();
    const scale = r.width / c.width;
    const rectOf = (el) => {
      const b = el.getBoundingClientRect();
      return { id: el.id || el.className, l: b.left, t: b.top, r: b.right, b: b.bottom };
    };
    const hudRects = [...document.querySelectorAll(hud)].filter(e => !e.hidden && e.offsetParent).map(rectOf);
    const boxOf = (ch) => ({ l: r.left + ch.box.x, t: r.top + ch.box.y, r: r.left + ch.box.x + ch.box.w, b: r.top + ch.box.y + ch.box.h });
    const sep = (a, b) => {
      const dx = Math.max(b.l - a.r, a.l - b.r);
      const dy = Math.max(b.t - a.b, a.t - b.b);
      return Math.max(dx, dy);
    };
    const edges = chips.filter(ch => ch.box).map(ch => {
      const box = boxOf(ch);
      const gaps = hudRects.map(h => ({ id: h.id, gap: sep(box, h) })).sort((a, b) => a.gap - b.gap);
      const cx = r.left + ch.box.x + ch.box.w / 2, cy = r.top + ch.box.y + ch.box.h / 2;
      let el = document.elementFromPoint(cx, cy);
      while (el && el.id !== 'mapCanvas' && el.parentElement) el = el.parentElement;
      return {
        dir: ch.dir, dist: ch.dist, shown: ch.shown, tracked: !!ch.tracked,
        w: ch.box.w, h: ch.box.h, box, gaps, hit: el ? el.id : null,
        inside: ch.box.x >= -0.01 && ch.box.y >= -0.01 && ch.box.x + ch.box.w <= r.width + 0.01 && ch.box.y + ch.box.h <= r.height + 0.01,
      };
    });
    let pair = null;
    for (let i = 0; i < edges.length; i++) for (let j = i + 1; j < edges.length; j++) {
      const g = sep(edges[i].box, edges[j].box);
      if (pair == null || g < pair) pair = g;
    }
    return { edges, rails: chips.filter(ch => !ch.box).length, pair, v: PixelPets.state.v, pass: PixelPets.cuePass() };
  }, HUD);
}

function sector(dx, dy) {
  const q = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) & 7;
  return DIRS[q];
}

test('edge boxes are 44 px, clear the HUD, and point in 8 directions', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.cueLayout({
    main: { x: 0, y: 40 }, side: { x: 23, y: 2 }, board: null, mainTracked: false,
  }));
  await frame(page);
  const modern = await readEdges(page);
  expect(modern.v).toBe(2);
  expect(modern.edges.length).toBe(2);
  expect(modern.pair).toBeGreaterThanOrEqual(4);
  for (const edge of modern.edges) {
    expect(edge.w).toBe(44);
    expect(edge.h).toBe(44);
    expect(edge.inside).toBe(true);
    expect(edge.hit).toBe('mapCanvas');
    expect(edge.gaps[0].gap, edge.dir + ' ' + edge.gaps[0].id).toBeGreaterThanOrEqual(6);
    expect(typeof edge.shown).toBe('number');
    expect(edge.shown).toBeLessThanOrEqual(99);
  }
  const caps = await page.evaluate(() => {
    PixelPets.cueForce({ x: 12 + 80, y: 27 + 40 });
    return null;
  });
  await frame(page);
  const far = await page.evaluate(() => {
    const ch = PixelPets.cueChip();
    return ch && { dist: ch.dist, shown: ch.shown, w: ch.box && ch.box.w, h: ch.box && ch.box.h };
  });
  expect(caps).toBeNull();
  expect(far.dist).toBe(120);
  expect(far.shown).toBe(99);
  expect(far.w).toBe(44);
  expect(far.h).toBe(44);

  const aims = [
    [40, 27], [40, 50], [12, 50], [0, 50], [0, 27], [0, 0], [12, 0], [40, 0],
  ];
  for (const [x, y] of aims) {
    await page.evaluate(({ x, y }) => PixelPets.cueForce({ x, y }), { x, y });
    await frame(page);
    const got = await page.evaluate(({ x, y }) => {
      const ch = PixelPets.cueChip();
      return { dir: ch && ch.dir, want: null, dx: x - 12, dy: y - 27 };
    }, { x, y });
    expect(got.dir, x + ',' + y).toBe(sector(got.dx, got.dy));
  }

  await openSettings(page);
  await page.locator('#setControls').click();
  await page.locator('#setClose').click();
  await expect(page.locator('#ovSettings')).toBeHidden();
  await frame(page);
  await page.evaluate(() => PixelPets.cueLayout({
    main: { x: 0, y: 40 }, side: { x: 23, y: 2 }, board: null, mainTracked: false,
  }));
  await frame(page);
  const arcade = await readEdges(page);
  expect(arcade.edges.length).toBe(2);
  expect(arcade.rails).toBe(0);
  expect(arcade.pair).toBeGreaterThanOrEqual(4);
  for (const edge of arcade.edges) {
    expect(edge.w).toBe(44);
    expect(edge.h).toBe(44);
    expect(edge.inside).toBe(true);
    expect(edge.hit).toBe('mapCanvas');
    expect(edge.gaps[0].gap, edge.dir + ' ' + (edge.gaps[0] && edge.gaps[0].id)).toBeGreaterThanOrEqual(6);
  }
});

test('reduced motion holds the arrow still, and nothing blinks white', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.cueForce({ x: 1, y: 2 }));
  await frame(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  await frame(page);
  const mask = () => page.evaluate(() => {
    const ch = (PixelPets.cueChips() || []).find(c => c.box);
    const c = document.querySelector('#mapCanvas');
    const g = c.getContext('2d');
    const k = c.width / c.getBoundingClientRect().width;
    const x0 = Math.max(0, Math.floor(ch.box.x * k));
    const y0 = Math.max(0, Math.floor(ch.box.y * k));
    const x1 = Math.min(c.width, Math.ceil((ch.box.x + ch.box.w) * k));
    const y1 = Math.min(c.height, Math.ceil((ch.box.y + ch.box.h) * k));
    const d = g.getImageData(x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0)).data;
    const w = Math.max(1, x1 - x0);
    const pts = [];
    for (let y = 0; y < y1 - y0; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = d[i], gc = d[i + 1], b = d[i + 2];
      const cue = (r === 255 && gc === 205 && b === 117) || (r === 167 && gc === 240 && b === 112);
      const ink = r === 26 && gc === 28 && b === 44;
      if (cue || ink) pts.push(x + ',' + y + ',' + r);
    }
    const face = g.getImageData(ch.x - 5, ch.y, 1, 1).data;
    return { pts: pts.join('|'), face: [face[0], face[1], face[2]] };
  });
  const still = [];
  for (let i = 0; i < 4; i++) {
    still.push(await mask());
    await page.waitForTimeout(350);
  }
  expect(still[1].pts).toBe(still[0].pts);
  expect(still[2].pts).toBe(still[0].pts);
  expect(still[3].pts).toBe(still[0].pts);
  expect(still[0].face).toEqual(GOLD);

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await frame(page);
  const seen = new Set();
  const t0 = Date.now();
  while (Date.now() - t0 < 1200) {
    const face = await page.evaluate(() => {
      const ch = PixelPets.cueChip();
      const d = document.querySelector('#mapCanvas').getContext('2d').getImageData(ch.x - 5, ch.y, 1, 1).data;
      return d[0] + ',' + d[1] + ',' + d[2];
    });
    seen.add(face);
    expect(face).not.toBe(WHITE.join(','));
    await page.waitForTimeout(80);
  }
  expect([...seen].some(s => s === GOLD.join(','))).toBe(true);
  expect(LIME.join(',')).not.toBe(WHITE.join(','));
});

test('a tap on the edge box opens QUEST and does not walk', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.cueForce({ x: 1, y: 48 }));
  await frame(page);
  const before = await page.evaluate(() => ({ x: PixelPets.state.world.x, y: PixelPets.state.world.y }));
  const spot = await page.evaluate(() => {
    const ch = PixelPets.cueChip();
    return { x: ch.box.x + ch.box.w / 2, y: ch.box.y + ch.box.h / 2 };
  });
  await page.locator('#mapCanvas').click({ position: spot });
  await frame(page);
  await expect(page.locator('#ovQuest')).toBeVisible();
  const after = await page.evaluate(() => ({ x: PixelPets.state.world.x, y: PixelPets.state.world.y }));
  expect(after).toEqual(before);
  await expect.poll(() => page.evaluate(() => PixelPets.optionsReady)).toBe(true);
  await page.locator('#questClose').click();
  await expect(page.locator('#ovQuest')).toBeHidden();
});

test('a tap on the on-screen arrow walks, and the 4 key opens QUEST', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.cueForce({ x: 12, y: 30 }));
  await frame(page);
  const pass = await page.evaluate(() => {
    const p = PixelPets.cuePass();
    const chip = PixelPets.cueChip();
    const c = document.querySelector('#mapCanvas');
    const css = c.getBoundingClientRect().width / c.width;
    return { dir: p && p.dir, chip, x: p ? (p.x + 3) * css : 0, y: p ? (p.y + 3) * css : 0 };
  });
  expect(pass.chip).toBeNull();
  expect(pass.dir).toBe('down');
  const before = await page.evaluate(() => ({ x: PixelPets.state.world.x, y: PixelPets.state.world.y }));
  await page.locator('#mapCanvas').click({ position: { x: pass.x, y: pass.y } });
  await expect.poll(() => page.evaluate(() => {
    const s = PixelPets.state.world;
    return s.x !== 12 || s.y !== 27;
  })).toBe(true);
  expect(await page.locator('#ovQuest').isHidden()).toBe(true);
  const moved = await page.evaluate(() => ({ x: PixelPets.state.world.x, y: PixelPets.state.world.y }));
  expect(moved).not.toEqual(before);

  await page.evaluate(() => PixelPets.goto('hearthmoor', 12, 2, 'down'));
  await frame(page);
  let up = null;
  for (let x = 0; x < 24; x++) {
    await page.evaluate(x => PixelPets.cueForce({ x, y: 0 }), x);
    await frame(page);
    up = await page.evaluate(() => { const p = PixelPets.cuePass(); return p && p.dir; });
    if (up === 'up') break;
  }
  expect(up).toBe('up');

  await page.keyboard.press('4');
  await expect(page.locator('#ovQuest')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#ovQuest')).toBeHidden();
});

test('cue hooks stay inert without debug @w1', async ({ page }) => {
  await installSave(page.context(), modernSave(), { quietDay: true });
  await gotoGame(page);
  const got = await page.evaluate(() => ({
    v: PixelPets.state.v,
    force: PixelPets.cueForce({ x: 1, y: 2 }),
    chip: PixelPets.cueChip(),
    chips: PixelPets.cueChips(),
    pass: PixelPets.cuePass(),
    debug: PixelPets.debug,
  }));
  expect(got).toEqual({ v: 2, force: undefined, chip: undefined, chips: undefined, pass: undefined, debug: false });
});

function trailSave(extra) {
  const s = modernSave();
  s.flags['story.phone_got'] = true;
  s.flags['story.unlock_phone'] = true;
  s.flags['story.mom_met'] = true;
  s.flags['story.mom_chore'] = true;
  s.flags['story.mom_sent'] = true;
  if (extra && extra.joystick) s.settings.joystick = true;
  if (extra && extra.arcade) s.settings.controls = 'arcade';
  return s;
}

async function bootTrail(page, extra) {
  await installSave(page.context(), trailSave(extra), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.evaluate(() => {
    PixelPets.showTab('walk');
    PixelPets.goto('hearthmoor', 9, 8, 'up');
    PixelPets.cueLayout({ main: null, side: { x: -6, y: 1 }, board: null });
  });
  await frame(page);
}

async function tileCss(page, tx, ty) {
  return page.evaluate(({ tx, ty }) => {
    const c = document.querySelector('#mapCanvas');
    const cam = PixelPets.walk.cam;
    const k = c.getBoundingClientRect().width / c.width;
    return { x: (tx * 16 - cam.x + 8) * k, y: (ty * 16 - cam.y + 8) * k, w: c.getBoundingClientRect().width, h: c.getBoundingClientRect().height };
  }, { tx, ty });
}

async function tapTile(page, tx, ty) {
  const spot = await tileCss(page, tx, ty);
  expect(spot.x).toBeGreaterThan(2);
  expect(spot.y).toBeGreaterThan(2);
  expect(spot.x).toBeLessThan(spot.w - 2);
  expect(spot.y).toBeLessThan(spot.h - 2);
  await page.locator('#mapCanvas').click({ position: { x: spot.x, y: spot.y } });
}

async function edgeClear(page) {
  return page.evaluate(() => {
    const c = document.querySelector('#mapCanvas');
    const cam = PixelPets.walk.cam;
    const k = c.getBoundingClientRect().width / c.width;
    const chips = (PixelPets.cueChips() || []).filter((ch) => ch.box);
    const dest = (PixelPets.mapInfo.objs || []).filter((o) => o.kind === 'warp' || o.kind === 'door');
    const hit = [];
    for (const o of dest) {
      const cx = (o.x * 16 - cam.x + 8) * k;
      const cy = (o.y * 16 - cam.y + 8) * k;
      if (cx < 0 || cy < 0 || cx > c.getBoundingClientRect().width || cy > c.getBoundingClientRect().height) continue;
      for (const ch of chips) {
        const b = ch.box;
        if (cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h) hit.push(o.id);
      }
    }
    return { hit, n: chips.length };
  });
}

test('the north trail and the Lodge door stay tappable beside an edge box', async ({ page }) => {
  await bootTrail(page);
  const clear = await edgeClear(page);
  expect(clear.n).toBeGreaterThan(0);
  expect(clear.hit).toEqual([]);
  // At 3x, row 2 is under the area chip from y 8. Step one tile north so the tap lands on the map.
  await page.evaluate(() => PixelPets.goto('hearthmoor', 9, 7, 'up'));
  await frame(page);
  await tapTile(page, 10, 2);
  await page.waitForFunction(() => PixelPets.mapInfo.id === 'mahopac' && !PixelPets.fading);
  expect(await page.evaluate(() => ({ map: PixelPets.mapInfo.id, x: PixelPets.keeper.x, y: PixelPets.keeper.y, quest: document.querySelector('#ovQuest').hidden }))).toEqual({ map: 'mahopac', x: 9, y: 14, quest: true });

  await page.evaluate(() => {
    PixelPets.goto('hearthmoor', 9, 7, 'up');
    PixelPets.cueLayout({ main: null, side: { x: -6, y: 1 }, board: null });
  });
  await frame(page);
  await tapTile(page, 9, 2);
  await page.waitForFunction(() => PixelPets.mapInfo.id === 'mahopac' && !PixelPets.fading);
  expect(await page.locator('#ovQuest').isHidden()).toBe(true);

  await page.evaluate(() => {
    PixelPets.goto('hearthmoor', 9, 7, 'up');
    PixelPets.cueLayout({ main: null, side: { x: -6, y: 1 }, board: null });
  });
  await frame(page);
  await tapTile(page, 8, 2);
  await page.waitForFunction(() => PixelPets.mapInfo.id === 'mahopac' && !PixelPets.fading);
  expect(await page.locator('#ovQuest').isHidden()).toBe(true);

  await page.evaluate(() => {
    PixelPets.goto('hearthmoor', 12, 6, 'right');
    PixelPets.cueLayout({ main: null, side: { x: -6, y: 1 }, board: null });
  });
  await frame(page);
  const door = await page.evaluate(() => {
    const o = PixelPets.mapInfo.objs.find((q) => q.id === 'hm_lodge');
    return o && { x: o.x, y: o.y };
  });
  expect(door).toEqual({ x: 15, y: 6 });
  expect((await edgeClear(page)).hit).toEqual([]);
  await tapTile(page, door.x, door.y);
  await page.waitForFunction(() => PixelPets.mapInfo.id === 'hm_lodge_in' || (PixelPets.keeper.x === 15 && PixelPets.keeper.y === 6));
  expect(await page.locator('#ovQuest').isHidden()).toBe(true);
  expect(await page.evaluate(() => PixelPets.mapInfo.id === 'hm_lodge_in' || (PixelPets.keeper.x === 15 && PixelPets.keeper.y === 6))).toBe(true);
});

test('edge boxes keep their clearance and still miss warp and door centres', async ({ page }) => {
  await bootTrail(page);
  const modes = [
    { arcade: false, joystick: false },
    { arcade: false, joystick: true },
    { arcade: true, joystick: false },
  ];
  for (const mode of modes) {
    await page.evaluate((mode) => {
      PixelPets.applyCtl(mode.arcade ? 'arcade' : 'modern', !!mode.joystick);
      PixelPets.showTab('walk');
      PixelPets.goto('hearthmoor', 9, 8, 'up');
      PixelPets.cueLayout({ main: { x: 0, y: 40 }, side: { x: 23, y: 2 }, board: null, mainTracked: false });
    }, mode);
    await frame(page);
    const laid = await readEdges(page);
    expect(laid.edges.length, JSON.stringify(mode)).toBe(2);
    expect(laid.pair).toBeGreaterThanOrEqual(4);
    for (const edge of laid.edges) {
      expect(edge.w).toBe(44);
      expect(edge.h).toBe(44);
      expect(edge.inside).toBe(true);
      expect(edge.gaps[0].gap).toBeGreaterThanOrEqual(6);
    }
    expect((await edgeClear(page)).hit).toEqual([]);
    const spot = await page.evaluate(() => {
      const ch = (PixelPets.cueChips() || []).find((c) => c.box);
      return { x: ch.box.x + ch.box.w / 2, y: ch.box.y + ch.box.h / 2 };
    });
    await page.locator('#mapCanvas').click({ position: spot });
    await expect(page.locator('#ovQuest')).toBeVisible();
    await expect.poll(() => page.evaluate(() => PixelPets.optionsReady)).toBe(true);
    await page.locator('#questClose').click();
    await expect(page.locator('#ovQuest')).toBeHidden();
  }
});
