/* PARTNER_CARE D534-D547 and the two SHOP_LAYOUT follow-ups.
   Widths are the Playwright projects (320, 375, 390). Save v stays 2. */
const path = require('path');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, boxesOverlap, artifactsDir } = require('./helpers');

trackErrors(test, expect);

const LINE_A = 'Your team rests up and feels full of energy. This Lantern House will remember you.';
const LINE_B = 'Your team is already rested. This Lantern House will remember you.';
const K = [0x1a, 0x1c, 0x2c];
const R = [0xb1, 0x3e, 0x53];

function save(extra) {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.follower = true;
  s.money = 55;
  s.party[0].hunger = 80;
  s.party[0].energy = 90;
  s.party[0].happy = 70;
  if (extra) Object.assign(s, extra);
  return s;
}

function secondPet(hunger) {
  return {
    id: 'petsmoke2', species: 'tide', stage: 0, xp: 10,
    hunger: hunger == null ? 80 : hunger, happy: 70, energy: 90,
    nick: null, origin: 'wild',
  };
}

async function boot(page, s, search) {
  await installSave(page.context(), s || save(), { quietDay: true });
  await gotoGame(page, search || '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await frame(page);
}

async function frame(page) {
  await page.evaluate(() => new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res))));
}

async function bubble(page) {
  await frame(page);
  return page.evaluate(() => PixelPets.needBubble());
}

async function rim(page) {
  return page.evaluate(() => {
    const b = PixelPets.needBubble();
    const bub = b && b.bubble;
    if (!bub || !bub.shown) return null;
    const d = document.querySelector('#mapCanvas').getContext('2d').getImageData(bub.x + 1, bub.y, 1, 1).data;
    return [d[0], d[1], d[2]];
  });
}

async function tileCss(page, tx, ty) {
  return page.evaluate(({ tx, ty }) => {
    const c = document.querySelector('#mapCanvas');
    const cam = PixelPets.walk.cam;
    const k = c.getBoundingClientRect().width / c.width;
    return { x: (tx * 16 - cam.x + 8) * k, y: (ty * 16 - cam.y + 8) * k };
  }, { tx, ty });
}

async function tapTile(page, tx, ty) {
  const spot = await tileCss(page, tx, ty);
  await page.locator('#mapCanvas').click({ position: { x: spot.x, y: spot.y } });
}

async function reachChoice(page) {
  for (let i = 0; i < 30; i++) {
    const sc = await page.evaluate(() => {
      const s = window.PixelPets.scene;
      return s && { mode: s.mode, waiting: s.waiting };
    });
    if (!sc) throw new Error('scene ended before a choice');
    if (sc.mode === 'choice') {
      await page.waitForFunction(() => window.PixelPets.optionsReady === true);
      return;
    }
    if (sc.waiting) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(40);
      continue;
    }
    await page.waitForTimeout(30);
  }
  throw new Error('no choice');
}

test('food, hurt and tired balloons follow the priority and the rim', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.setCare({ hunger: 22, energy: 90 }));
  await page.waitForTimeout(200);
  let nb = await bubble(page);
  expect(nb.bubble).toMatchObject({ shown: true, glyph: 'emote_hungry', level: 1, shift: 0 });
  expect(await rim(page)).toEqual(K);

  await page.evaluate(() => PixelPets.setCare({ hunger: 15 }));
  await page.waitForTimeout(200);
  nb = await bubble(page);
  expect(nb.bubble).toMatchObject({ shown: true, glyph: 'emote_hungry', level: 2 });
  expect(await rim(page)).toEqual(R);
  if (page.viewportSize().width === 390) {
    await page.screenshot({ path: path.join(artifactsDir(), 'partner_need_390.png') });
  }

  await page.evaluate(() => {
    PixelPets.setCare({ hunger: 70, energy: 90 });
    PixelPets.state.party[0].hpNow = 3;
  });
  await frame(page);
  nb = await bubble(page);
  expect(nb.bubble.glyph).toBe('emote_hurt');
  expect(nb.bubble.shown).toBe(true);

  await page.evaluate(() => {
    delete PixelPets.state.party[0].hpNow;
    PixelPets.setCare({ hunger: 70, energy: 15 });
  });
  await frame(page);
  expect((await bubble(page)).bubble.glyph).toBe('emote_tired');

  await page.evaluate(() => PixelPets.setCare({ hunger: 15, energy: 5 }));
  await frame(page);
  nb = await bubble(page);
  expect(nb.bubble).toMatchObject({ glyph: 'emote_hungry', level: 2 });
});

test('worn out shows Zz only, and FEED clears a hungry balloon', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    PixelPets.setCare({ hunger: 10, energy: 10 });
    PixelPets.setFaint(12);
  });
  await frame(page);
  const nap = await page.evaluate(() => ({
    sleep: PixelPets.emotes.sleep,
    bubble: PixelPets.needBubble().bubble,
  }));
  expect(nap.sleep).toBe(true);
  expect(nap.bubble).toBeNull();

  await page.evaluate(() => PixelPets.setFaint(0));
  await page.evaluate(() => PixelPets.setCare({ hunger: 22, energy: 90 }));
  await page.locator('#petStrip').click();
  await page.locator('#careTray [data-act="feed"]').click();
  await expect.poll(() => page.evaluate(() => PixelPets.state.party[0].hunger)).toBeGreaterThanOrEqual(40);
  await expect.poll(() => page.evaluate(() => PixelPets.needBubble().bubble), { timeout: 2000 }).toBeNull();
});

test('a quest arrow on the follower tile moves the balloon and stays put', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const s = save();
  s.settings.controls = 'arcade';
  await boot(page, s);
  const step = await page.evaluate(() => {
    const x0 = PixelPets.state.world.x, y0 = PixelPets.state.world.y;
    for (const [dx, dy] of [[0, 2], [2, 0], [0, -2], [-2, 0]]) {
      const x = x0 + dx, y = y0 + dy;
      const info = PixelPets.tileInfo(x, y);
      if (!info || !info.walk || info.blocked) continue;
      const path = PixelPets.findPath([{ x, y }]);
      if (path && path.length) return { x, y };
    }
    return null;
  });
  expect(step).toBeTruthy();
  await tapTile(page, step.x, step.y);
  await expect.poll(() => page.evaluate((step) => PixelPets.state.world.x === step.x && PixelPets.state.world.y === step.y, step)).toBe(true);
  await frame(page);
  await page.evaluate(() => PixelPets.setCare({ hunger: 80, energy: 100 }));
  const fol = await page.evaluate(() => ({
    x: PixelPets.follower.x, y: PixelPets.follower.y,
    px: PixelPets.state.world.x, py: PixelPets.state.world.y,
  }));
  expect(fol.x !== fol.px || fol.y !== fol.py).toBe(true);
  await page.evaluate((fol) => PixelPets.cueForce({ x: fol.x, y: fol.y }), fol);
  await frame(page);
  const before = await page.evaluate(() => PixelPets.cuePass());
  expect(before).toBeTruthy();
  await page.evaluate(() => PixelPets.setCare({ hunger: 22 }));
  await page.waitForTimeout(220);
  const after = await page.evaluate(() => PixelPets.cuePass());
  expect(after).toEqual(before);
  const bub = (await bubble(page)).bubble;
  expect(bub.glyph).toBe('emote_hungry');
  expect(bub.shown === false || bub.shift === -10 || bub.shift === 10).toBe(true);
});

test('reduced motion holds the balloon still while the follower bobs', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await boot(page);
  await page.evaluate(() => PixelPets.setCare({ hunger: 22, energy: 90 }));
  await frame(page);
  const first = await page.evaluate(() => ({
    y: PixelPets.needBubble().bubble.y,
    bob: PixelPets.follower.bob,
  }));
  let bobChanged = false;
  const t0 = Date.now();
  while (Date.now() - t0 < 1200) {
    const now = await page.evaluate(() => ({
      y: PixelPets.needBubble().bubble.y,
      bob: PixelPets.follower.bob,
    }));
    expect(now.y).toBe(first.y);
    if (now.bob !== first.bob) bobChanged = true;
    await page.waitForTimeout(80);
  }
  expect(bobChanged).toBe(true);
});

test('the early heart steps aside while a need balloon would show', async ({ page }) => {
  const s = save();
  s.flags['story.early_steps'] = 5;
  await boot(page, s);
  await page.evaluate(() => PixelPets.setCare({ hunger: 22, energy: 90 }));
  await frame(page);
  expect((await bubble(page)).heartSkipped).toBe(true);
  await page.evaluate(() => PixelPets.setCare({ hunger: 80, energy: 90 }));
  await frame(page);
  expect((await bubble(page)).heartSkipped).toBe(false);
});

test('the balloon is absent in a scene, a battle, and when the follower is off', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page);
  await page.evaluate(() => PixelPets.setCare({ hunger: 22, energy: 90 }));
  await frame(page);
  expect((await bubble(page)).bubble.shown).toBe(true);

  await page.evaluate(() => PixelPets.probeScene([['say', '', 'Hello there.']]));
  await frame(page);
  expect((await bubble(page)).bubble).toBeNull();
  await page.evaluate(() => PixelPets.endScene());
  await frame(page);

  await page.evaluate(() => { PixelPets.state.settings.follower = false; });
  await frame(page);
  expect((await bubble(page)).bubble).toBeNull();
  await page.evaluate(() => { PixelPets.state.settings.follower = true; });
  await frame(page);
  expect((await bubble(page)).bubble.shown).toBe(true);

  const started = await page.evaluate(() => PixelPets.spawnEncounter({ species: 'tide', stage: 0, level: 3, hpFrac: 1 }));
  expect(started).not.toBe(false);
  await frame(page);
  expect((await bubble(page)).bubble).toBeNull();
  for (let i = 0; i < 8; i++) {
    const on = await page.evaluate(() => !!(PixelPets.debugSnapshot().battle));
    if (!on) break;
    const run = page.locator('#btRun');
    if (await run.isVisible()) await run.click();
    await page.waitForTimeout(400);
  }
});

test('tap-to-walk, the edge cue, and a standing partner tap', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page);
  const here = await page.evaluate(() => ({ x: PixelPets.state.world.x, y: PixelPets.state.world.y }));
  const dest = await page.evaluate(() => {
    const x0 = PixelPets.state.world.x, y0 = PixelPets.state.world.y;
    for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
      const x = x0 + dx * 3, y = y0 + dy * 3;
      const info = PixelPets.tileInfo(x, y);
      if (!info || !info.walk || info.blocked) continue;
      const path = PixelPets.findPath([{ x, y }]);
      if (path && path.length) return { x, y };
    }
    return null;
  });
  expect(dest).toBeTruthy();
  await tapTile(page, dest.x, dest.y);
  await expect.poll(() => page.evaluate(() => ({ x: PixelPets.state.world.x, y: PixelPets.state.world.y }))).toEqual(dest);
  expect(await page.locator('#careTray').isHidden()).toBe(true);

  await page.evaluate(() => PixelPets.goto('hearthmoor', 12, 8, 'down'));
  await page.waitForFunction(() => !window.PixelPets.fading);
  await frame(page);
  const before = await page.evaluate(() => ({ x: PixelPets.state.world.x, y: PixelPets.state.world.y }));
  await page.evaluate(() => PixelPets.cueForce({ x: 1, y: 48 }));
  await frame(page);
  const spot = await page.evaluate(() => {
    const ch = PixelPets.cueChip();
    return { x: ch.box.x + ch.box.w / 2, y: ch.box.y + ch.box.h / 2 };
  });
  await page.locator('#mapCanvas').click({ position: spot });
  await frame(page);
  await expect(page.locator('#ovQuest')).toBeVisible();
  expect(await page.locator('#careTray').isHidden()).toBe(true);
  const after = await page.evaluate(() => ({ x: PixelPets.state.world.x, y: PixelPets.state.world.y }));
  expect(after).toEqual(before);
  await page.waitForFunction(() => window.PixelPets.optionsReady === true);
  await page.locator('#questClose').click();
  await expect(page.locator('#ovQuest')).toBeHidden();

  await frame(page);
  const fol = await page.evaluate(() => ({ x: PixelPets.follower.x, y: PixelPets.follower.y, sx: PixelPets.state.world.x, sy: PixelPets.state.world.y }));
  expect(await page.evaluate(() => PixelPets.standingStill())).toBe(true);
  await tapTile(page, fol.x, fol.y);
  await expect(page.locator('#careTray')).toBeVisible();
  const stayed = await page.evaluate(() => ({ x: PixelPets.state.world.x, y: PixelPets.state.world.y, path: PixelPets.walk.path }));
  expect(stayed).toEqual({ x: fol.sx, y: fol.sy, path: null });
});

test('a second follower tap closes the open care tray', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 modern only');
  await boot(page);
  await frame(page);
  expect(await page.evaluate(() => PixelPets.standingStill())).toBe(true);
  const fol = await page.evaluate(() => ({ x: PixelPets.follower.x, y: PixelPets.follower.y }));
  await tapTile(page, fol.x, fol.y);
  await expect(page.locator('#careTray')).toBeVisible();
  await tapTile(page, fol.x, fol.y);
  await expect(page.locator('#careTray')).toBeHidden();
});

test('a moving tap on the follower walks, and an edge box over the partner opens QUEST', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page);
  const dest = await page.evaluate(() => {
    const x0 = PixelPets.state.world.x, y0 = PixelPets.state.world.y;
    for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
      const x = x0 + dx * 4, y = y0 + dy * 4;
      const info = PixelPets.tileInfo(x, y);
      if (!info || !info.walk || info.blocked) continue;
      const path = PixelPets.findPath([{ x, y }]);
      if (path && path.length >= 3) return { x, y };
    }
    return null;
  });
  expect(dest).toBeTruthy();
  await tapTile(page, dest.x, dest.y);
  await page.waitForFunction(() => !!(PixelPets.walk.path || PixelPets.walk.to));
  const fol = await page.evaluate(() => ({ x: PixelPets.follower.x, y: PixelPets.follower.y }));
  await tapTile(page, fol.x, fol.y);
  expect(await page.locator('#careTray').isHidden()).toBe(true);
  await expect.poll(() => page.evaluate((fol) => PixelPets.state.world.x === fol.x && PixelPets.state.world.y === fol.y, fol), { timeout: 8000 }).toBe(true);

  const hit = await page.evaluate(() => {
    const info = PixelPets.mapInfo;
    const cands = [];
    const push = (x, y, facing, cue) => {
      const t = PixelPets.tileInfo(x, y);
      if (t && t.walk && !t.blocked) cands.push({ x, y, facing, cue });
    };
    for (let y = 0; y < info.h && cands.length < 6; y++) push(1, y, 'right', { x: -4, y });
    for (let y = 0; y < info.h && cands.length < 12; y++) push(info.w - 2, y, 'left', { x: info.w + 4, y });
    for (let x = 0; x < info.w && cands.length < 18; x++) push(x, 1, 'down', { x, y: -4 });
    for (let x = 0; x < info.w && cands.length < 24; x++) push(x, info.h - 2, 'up', { x, y: info.h + 4 });
    return cands;
  });
  let opened = false;
  for (const spot of hit) {
    await page.evaluate((spot) => PixelPets.goto('hearthmoor', spot.x, spot.y, spot.facing), spot);
    await page.waitForFunction(() => !window.PixelPets.fading);
    await page.evaluate((spot) => PixelPets.cueForce(spot.cue), spot);
    await frame(page);
    const box = await page.evaluate(() => {
      const fol = PixelPets.follower;
      const ch = PixelPets.cueChip();
      if (!fol || fol.x == null || !ch || !ch.box) return null;
      const c = document.querySelector('#mapCanvas');
      const cam = PixelPets.walk.cam;
      const k = c.getBoundingClientRect().width / c.width;
      const fx = (fol.x * 16 - cam.x) * k, fy = (fol.y * 16 - cam.y) * k;
      const b = ch.box;
      const overlap = fx < b.x + b.w && fx + 16 * k > b.x && fy < b.y + b.h && fy + 16 * k > b.y;
      if (!overlap) return null;
      return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
    });
    if (!box) continue;
    const at = await page.evaluate(() => ({ x: PixelPets.state.world.x, y: PixelPets.state.world.y }));
    await page.locator('#mapCanvas').click({ position: box });
    await frame(page);
    await expect(page.locator('#ovQuest')).toBeVisible();
    expect(await page.locator('#careTray').isHidden()).toBe(true);
    expect(await page.evaluate(() => ({ x: PixelPets.state.world.x, y: PixelPets.state.world.y }))).toEqual(at);
    opened = true;
    break;
  }
  expect(opened).toBe(true);
});

test('a corner tap on the follower opens the tray, and the d-pad swaps places', async ({ page }) => {
  test.skip(page.viewportSize().width === 375, '390 and 320');
  test.setTimeout(60000);
  const s = save();
  s.settings.controls = 'arcade';
  await boot(page, s);
  const corners = await page.evaluate(() => {
    const info = PixelPets.mapInfo, out = [];
    for (let y = 0; y < info.h; y++) for (let x = 0; x < info.w; x++) {
      if (x > 2 && y > 2 && x < info.w - 3 && y < info.h - 3) continue;
      const t = PixelPets.tileInfo(x, y);
      if (t && t.walk && !t.blocked) out.push([x, y]);
    }
    return out.slice(0, 12);
  });
  let tapped = false;
  for (const [x, y] of corners) {
    await page.evaluate(({ x, y }) => PixelPets.goto('hearthmoor', x, y, 'down'), { x, y });
    await page.waitForFunction(() => !window.PixelPets.fading);
    await frame(page);
    const fol = await page.evaluate(() => {
      const f = PixelPets.follower;
      if (!f || f.x == null) return null;
      const c = document.querySelector('#mapCanvas');
      const cam = PixelPets.walk.cam;
      const k = c.getBoundingClientRect().width / c.width;
      const px = (f.x * 16 - cam.x + 8) * k, py = (f.y * 16 - cam.y + 8) * k;
      if (px < 8 || py < 8 || px > c.getBoundingClientRect().width - 8 || py > c.getBoundingClientRect().height - 8) return null;
      return { x: f.x, y: f.y, px, py, sx: PixelPets.state.world.x, sy: PixelPets.state.world.y };
    });
    if (!fol) continue;
    await page.locator('#mapCanvas').click({ position: { x: fol.px, y: fol.py } });
    await expect(page.locator('#careTray')).toBeVisible();
    const stayed = await page.evaluate(() => ({ x: PixelPets.state.world.x, y: PixelPets.state.world.y, path: PixelPets.walk.path }));
    expect(stayed).toEqual({ x: fol.sx, y: fol.sy, path: null });
    tapped = true;
    break;
  }
  expect(tapped).toBe(true);
  await page.locator('#ctClose').click();
  await expect(page.locator('#careTray')).toBeHidden();

  await page.evaluate(() => PixelPets.goto('hearthmoor', 8, 8, 'down'));
  await page.waitForFunction(() => !window.PixelPets.fading);
  await frame(page);
  const pair = await page.evaluate(() => ({
    hx: PixelPets.state.world.x, hy: PixelPets.state.world.y,
    fx: PixelPets.follower.x, fy: PixelPets.follower.y,
  }));
  const dir = pair.fx > pair.hx ? 'right' : pair.fx < pair.hx ? 'left' : pair.fy > pair.hy ? 'down' : 'up';
  await page.locator('#dpad .dp.' + dir).click();
  await expect.poll(() => page.evaluate(() => ({ x: PixelPets.state.world.x, y: PixelPets.state.world.y }))).toEqual({ x: pair.fx, y: pair.fy });
  await expect.poll(() => page.evaluate(() => ({ x: PixelPets.follower.x, y: PixelPets.follower.y }))).toEqual({ x: pair.hx, y: pair.hy });
});

test('arcade at 390 opens the tray from a still partner and walks when moving', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  test.setTimeout(60000);
  const s = save();
  s.settings.controls = 'arcade';
  await boot(page, s);
  const fol = await page.evaluate(() => ({ x: PixelPets.follower.x, y: PixelPets.follower.y, sx: PixelPets.state.world.x, sy: PixelPets.state.world.y }));
  await tapTile(page, fol.x, fol.y);
  await expect(page.locator('#careTray')).toBeVisible();
  expect(await page.evaluate(() => ({ x: PixelPets.state.world.x, y: PixelPets.state.world.y, path: PixelPets.walk.path }))).toEqual({ x: fol.sx, y: fol.sy, path: null });
  await page.locator('#ctClose').click();

  const dest = await page.evaluate(() => {
    const x0 = PixelPets.state.world.x, y0 = PixelPets.state.world.y;
    for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
      const x = x0 + dx * 4, y = y0 + dy * 4;
      const info = PixelPets.tileInfo(x, y);
      if (!info || !info.walk || info.blocked) continue;
      const path = PixelPets.findPath([{ x, y }]);
      if (path && path.length >= 3) return { x, y };
    }
    return null;
  });
  expect(dest).toBeTruthy();
  await tapTile(page, dest.x, dest.y);
  await page.waitForFunction(() => !!(PixelPets.walk.path || PixelPets.walk.to));
  const mid = await page.evaluate(() => ({ x: PixelPets.follower.x, y: PixelPets.follower.y }));
  await tapTile(page, mid.x, mid.y);
  expect(await page.locator('#careTray').isHidden()).toBe(true);
  await expect.poll(() => page.evaluate((mid) => PixelPets.state.world.x === mid.x && PixelPets.state.world.y === mid.y, mid), { timeout: 8000 }).toBe(true);
});

test('the tray switches partner, cares with today\'s rules, and keeps save v2', async ({ page }) => {
  test.setTimeout(60000);
  const s = save();
  s.settings.tips = false;
  s.party.push(secondPet(40));
  s.bag = { heal_snack: 1 };
  await boot(page, s);
  await page.locator('#petStrip').click();
  await expect(page.locator('#careTray')).toBeVisible();
  await expect(page.locator('#ctParty')).toBeVisible();
  const fit = await page.evaluate(() => {
    const tray = document.querySelector('#careTray').getBoundingClientRect();
    const slots = [...document.querySelectorAll('.ct-slot')].map((el) => el.getBoundingClientRect());
    const cares = [...document.querySelectorAll('#careTray .ct-care .btn')].map((el) => el.getBoundingClientRect());
    const small = [...document.querySelectorAll('#careTray .ct-small')].map((el) => el.getBoundingClientRect());
    const strip = document.querySelector('#petStrip').getBoundingClientRect();
    const pet = document.querySelector('#petFloat').getBoundingClientRect();
    const col = document.querySelector('#colFloat').getBoundingClientRect();
    const overlap = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    return {
      trayH: tray.height,
      slots: slots.map((r) => ({ w: r.width, h: r.height })),
      cares: cares.map((r) => ({ w: r.width, h: r.height })),
      small: small.map((r) => r.height),
      clear: !overlap(tray, strip) && !overlap(tray, pet) && !overlap(tray, col),
    };
  });
  expect(fit.slots.every((r) => r.w >= 44 && r.h >= 44)).toBe(true);
  expect(fit.cares.every((r) => r.w >= 44 && r.h >= 44)).toBe(true);
  expect(fit.small.every((h) => h >= 44)).toBe(true);
  expect(fit.clear).toBe(true);
  expect(fit.trayH).toBeGreaterThan(160);
  expect(fit.trayH).toBeLessThan(200);
  if (page.viewportSize().width === 320) {
    await page.screenshot({ path: path.join(artifactsDir(), 'partner_tray_320.png') });
  }

  const other = page.locator('.ct-slot:not(.on)');
  await other.click();
  await expect(page.locator('#toast')).toContainText('is your partner now!');
  await expect(page.locator('#careTray')).toBeVisible();
  expect(await page.evaluate(() => PixelPets.state.partnerId)).toBe('petsmoke2');
  const head = await page.locator('#ctName').textContent();
  expect(head).toContain('Lv');

  await page.locator('.ct-slot.on').click();
  await page.evaluate(() => PixelPets.makePartner('petsmoke1'));
  await frame(page);
  const beforeKeys = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('pixelpets.save.v2'))).sort());
  await page.evaluate(() => PixelPets.setCare({ hunger: 100, energy: 100 }));
  await page.locator('#careTray [data-act="feed"]').click();
  await expect(page.locator('#toast')).toHaveText('Too full to eat!');
  await page.locator('#careTray [data-act="rest"]').click();
  await expect(page.locator('#toast')).toHaveText('Not sleepy right now.');

  await page.evaluate(() => PixelPets.setCare({ hunger: 80, energy: 90 }));
  const hungerOther = await page.evaluate(() => PixelPets.state.party.find((p) => p.id === 'petsmoke2').hunger);
  await page.locator('#careTray [data-act="feed"]').click();
  await expect.poll(() => page.evaluate(() => PixelPets.state.party.find((p) => p.id === 'petsmoke1').hunger)).toBeGreaterThan(80);
  const hungerAfter = await page.evaluate(() => PixelPets.state.party.find((p) => p.id === 'petsmoke2').hunger);
  expect(hungerAfter).toBeLessThanOrEqual(hungerOther);
  expect(hungerOther - hungerAfter).toBeLessThan(1);
  const cd = await page.evaluate(() => ({
    tray: document.querySelector('#careTray [data-act="feed"]').textContent,
    pet: document.querySelector('#scr-pet [data-act="feed"]').textContent,
  }));
  expect(cd.tray).toBe(cd.pet);
  expect(cd.tray).toContain('FEED');
  const saved = await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('pixelpets.save.v2'));
    return { v: raw.v, keys: Object.keys(raw).sort() };
  });
  expect(saved.v).toBe(2);
  const added = saved.keys.filter((k) => beforeKeys.indexOf(k) < 0);
  expect(added.every((k) => k === 'care' || k === 'debugSave')).toBe(true);
  await expect.poll(() => page.evaluate(() => PixelPets.careReply().left)).toBe(0);
  await page.waitForTimeout(400);

  await page.evaluate(() => PixelPets.setCare({ hunger: 40, energy: 40, happy: 40 }));
  await page.locator('#careTray [data-act="play"]').click();
  const reply = await page.evaluate(() => PixelPets.careReply());
  expect(reply.glyph).toBe('emote_heart');
  expect(reply.hop).toBe(true);
  expect(reply.left).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => PixelPets.careReply().left)).toBe(0);
  await page.waitForTimeout(400);

  await page.locator('#careTray [data-act="rest"]').click();
  await expect.poll(() => page.evaluate(() => PixelPets.careReply().glyph)).toBe('emote_sleep');
  await expect.poll(() => page.evaluate(() => PixelPets.careReply().left), { timeout: 4000 }).toBe(0);

  await page.evaluate(() => {
    PixelPets.state.party[0].hpNow = 4;
    PixelPets.setCare({ hunger: 40, energy: 40 });
  });
  await page.locator('#careTray [data-act="heal"]').click();
  await page.locator('#shList .sh-item', { hasText: 'Heal Snack' }).click();
  await expect.poll(() => page.evaluate(() => PixelPets.careReply().sparks)).toBe(true);
});

test('one party member hides the row, and a map tap or a tab closes the tray', async ({ page }) => {
  await boot(page);
  await page.locator('#petStrip').click();
  await expect(page.locator('#ctParty')).toBeHidden();
  await page.locator('#ctStats').click();
  await expect(page.locator('#ovStats')).toBeVisible();
  await expect(page.locator('#careTray')).toBeVisible();
  await page.locator('#scClose').click();
  const dest = await page.evaluate(() => {
    const c = document.querySelector('#mapCanvas');
    const tray = document.querySelector('#careTray').getBoundingClientRect();
    const cr = c.getBoundingClientRect();
    const cam = PixelPets.walk.cam;
    const k = cr.width / c.width;
    const x0 = PixelPets.state.world.x, y0 = PixelPets.state.world.y;
    for (const [dx, dy] of [[0, -3], [-3, 0], [3, 0], [0, 3], [0, -2], [2, 0], [-2, 0], [0, 2]]) {
      const x = x0 + dx, y = y0 + dy;
      const info = PixelPets.tileInfo(x, y);
      if (!info || !info.walk || info.blocked) continue;
      const fol = PixelPets.follower;
      if (fol && fol.x === x && fol.y === y) continue;
      const px = cr.left + (x * 16 - cam.x + 8) * k;
      const py = cr.top + (y * 16 - cam.y + 8) * k;
      if (px < cr.left + 12 || py < cr.top + 12 || px > cr.right - 12 || py > cr.bottom - 12) continue;
      if (py >= tray.top - 4) continue;
      const top = document.elementFromPoint(px, py);
      if (!top || top.id !== 'mapCanvas') continue;
      return { x, y, px: px - cr.left, py: py - cr.top };
    }
    return null;
  });
  expect(dest).toBeTruthy();
  await page.locator('#mapCanvas').click({ position: { x: dest.px, y: dest.py } });
  await expect(page.locator('#careTray')).toBeHidden();

  await page.evaluate(() => { PixelPets.walk.path = null; PixelPets.walk.to = null; });
  await page.locator('#petStrip').click();
  await expect(page.locator('#careTray')).toBeVisible();
  await page.locator('#petFloat').click();
  await expect(page.locator('#careTray')).toBeHidden();
});

test('desktop keeps the tray in the frame, clear of the nav buttons, with no new key', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, 'one width');
  test.setTimeout(60000);
  const s = save();
  s.settings.tips = false;
  s.party.push(secondPet(50));
  await boot(page, s);
  await page.setViewportSize({ width: 1280, height: 800 });
  await frame(page);
  await page.keyboard.press('q');
  await frame(page);
  expect(await page.locator('#careTray').isHidden()).toBe(true);
  const fol = await page.evaluate(() => ({ x: PixelPets.follower.x, y: PixelPets.follower.y }));
  await tapTile(page, fol.x, fol.y);
  await expect(page.locator('#careTray')).toBeVisible();
  const box = await page.evaluate(() => {
    const app = document.querySelector('#app').getBoundingClientRect();
    const tray = document.querySelector('#careTray').getBoundingClientRect();
    const pet = document.querySelector('#petFloat').getBoundingClientRect();
    const col = document.querySelector('#colFloat').getBoundingClientRect();
    const overlap = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    return {
      inside: tray.left >= app.left - 1 && tray.right <= app.right + 1 && tray.top >= app.top - 1 && tray.bottom <= app.bottom + 1,
      clear: !overlap(tray, pet) && !overlap(tray, col),
    };
  });
  expect(box.inside).toBe(true);
  expect(box.clear).toBe(true);
  await page.locator('.ct-slot:not(.on)').click();
  expect(await page.evaluate(() => PixelPets.state.partnerId)).toBe('petsmoke2');
  await expect(page.locator('#careTray')).toBeVisible();
  await page.locator('#careTray [data-act="feed"]').click();
  const cd = await page.evaluate(() => ({
    tray: document.querySelector('#careTray [data-act="feed"]').textContent,
    pet: document.querySelector('#scr-pet [data-act="feed"]').textContent,
  }));
  expect(cd.tray).toBe(cd.pet);
  await page.keyboard.press('q');
  await expect(page.locator('#careTray')).toBeVisible();
});

test('the nameless cooler hides its title and Cook Hesper keeps hers', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  test.setTimeout(60000);
  await boot(page);
  await page.evaluate(() => PixelPets.clock.set('tue', 12, 0));
  await page.evaluate(() => PixelPets.goto('hm_store', 10, 4, 'up'));
  await page.waitForFunction(() => !window.PixelPets.fading);
  expect(await page.evaluate(() => PixelPets.talkTo('store_cooler'))).toBe(true);
  await reachChoice(page);
  await expect(page.locator('#ovShop')).toBeVisible();
  expect(await page.locator('#shopTitle').isHidden()).toBe(true);
  const sheet = await page.evaluate(() => ({
    prompt: document.querySelector('#shopFlavour').textContent,
    rows: document.querySelectorAll('#shopList .shop-row').length,
    x: document.querySelector('#shopClose').textContent,
    pill: document.querySelector('#shopMoney').textContent,
  }));
  expect(sheet.prompt.length).toBeGreaterThan(0);
  expect(sheet.rows).toBeGreaterThan(0);
  expect(sheet.x).toBe('X');
  expect(sheet.pill.length).toBeGreaterThan(0);
  await page.locator('#shopClose').click();

  await page.evaluate(() => PixelPets.goto('hm_diner', 4, 2, 'left'));
  await page.waitForFunction(() => !window.PixelPets.fading);
  expect(await page.evaluate(() => PixelPets.talkTo('hm_hesper'))).toBe(true);
  await reachChoice(page);
  await expect(page.locator('#shopTitle')).toBeVisible();
  await expect(page.locator('#shopTitle')).toHaveText('Cook Hesper');
});

test('a free Lantern rest uses the rounded energy check', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  test.setTimeout(60000);
  const s = save();
  s.party[0].energy = 99.9998;
  s.party.push(secondPet(80));
  s.party[1].energy = 99.9998;
  await boot(page, s);
  await page.evaluate(() => {
    PixelPets.state.party.forEach((p) => { p.energy = 99.9998; delete p.hpNow; delete p.faintUntil; });
  });
  await page.evaluate(() => PixelPets.goto('hm_lantern_in', 1, 3, 'up'));
  await page.waitForFunction(() => !window.PixelPets.fading);
  expect(await page.evaluate(() => PixelPets.talkTo('lantern_bed_a'))).toBe(true);
  await reachChoice(page);
  await page.locator('#sbChoices button', { hasText: 'Rest a while' }).click();
  await page.waitForFunction((line) => window.PixelPets.scene && window.PixelPets.scene.text === line, LINE_B);
  expect(await page.evaluate(() => PixelPets.lanternRestFlag())).toBe('full');
  expect(await page.evaluate(() => PixelPets.state.money)).toBe(55);

  await page.evaluate(() => PixelPets.endScene());
  await page.evaluate(() => {
    PixelPets.state.party[0].energy = 60;
    PixelPets.state.party[1].energy = 100;
    delete PixelPets.state.party[0].hpNow;
    delete PixelPets.state.party[1].hpNow;
  });
  expect(await page.evaluate(() => PixelPets.talkTo('lantern_bed_a'))).toBe(true);
  await reachChoice(page);
  await page.locator('#sbChoices button', { hasText: 'Rest a while' }).click();
  await page.waitForFunction((line) => window.PixelPets.scene && window.PixelPets.scene.text === line, LINE_A);
  const filled = await page.evaluate(() => ({
    flag: PixelPets.lanternRestFlag(),
    energy: PixelPets.state.party.map((p) => p.energy),
    money: PixelPets.state.money,
  }));
  expect(filled.flag).toBe('refill');
  expect(filled.energy).toEqual([100, 100]);
  expect(filled.money).toBe(55);
});
