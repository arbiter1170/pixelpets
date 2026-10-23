/* ART_PASS v0.2 (D548-D563) plus the hop-branch tray close.
   Save stays pixelpets.save.v2 with v 2. The hall hop is fb_hall only. */
const path = require('path');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, artifactsDir } = require('./helpers');

trackErrors(test, expect);

const PROPS = [
  [13, 8, 13, 7, "A lamp in the top hedge. Fen's dais is one more step up."],
  [3, 10, 3, 9, 'Tall blooms, staked one by one.'],
  [12, 12, 12, 11, 'A little spout keeps the lily trough full.'],
  [4, 14, 4, 13, 'Herbs drying on a rack. Sage, mint and something sharp.'],
  [9, 16, 9, 15, 'Rose cuttings, potted to grow on.'],
  [6, 18, 6, 17, 'A basket of seed packets. Each row is labelled by hand.'],
];

function save(world) {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.follower = true;
  s.flags['story.early_done'] = true;
  s.world = Object.assign({ map: 'fb_hall_in', x: 7, y: 22, facing: 'up', respawn: 'fernbrook' }, world || {});
  return s;
}

async function boot(page, s) {
  await installSave(page.context(), s || save(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => { PixelPets.showTab('walk'); PixelPets.clearWild(); });
  await page.waitForFunction(() => !window.PixelPets.fading);
}

async function at(page) {
  return page.evaluate(() => ({ x: PixelPets.state.world.x, y: PixelPets.state.world.y, facing: PixelPets.state.world.facing, steps: PixelPets.state.steps, map: PixelPets.state.world.map }));
}

function pathHops(start, path) {
  let prev = start, hops = 0;
  for (const p of path) {
    const man = Math.abs(p.x - prev.x) + Math.abs(p.y - prev.y);
    if (man === 2) hops++;
    else if (man !== 1) return { hops: -1, bad: man };
    prev = p;
  }
  return { hops, steps: path.length };
}

test('the hall climb, the drop, and the walk mask', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390');
  test.setTimeout(60000);
  await boot(page);
  const mask = await page.evaluate(() => {
    const info = PixelPets.mapInfo;
    const rows = [];
    let walk = 0, blocked = 0;
    for (let y = 0; y < info.h; y++) {
      let s = '';
      for (let x = 0; x < info.w; x++) {
        const t = PixelPets.tileInfo(x, y);
        s += t.walk ? '1' : '0';
        if (t.walk) walk++; else blocked++;
        if (t.ch === 'V') {
          if (t.walk) return { bad: 'V walks' };
        }
      }
      rows.push(s);
    }
    const up = PixelPets.findPath([{ x: 7, y: 5 }]);
    PixelPets.goto('fb_hall_in', 7, 5, 'down');
    const down = PixelPets.findPath([{ x: 7, y: 22 }]);
    const mat = PixelPets.findPath([{ x: 7, y: 23 }]);
    const upLand = PixelPets.goto('fb_hall_in', 7, 22, 'up') && PixelPets.findPath([{ x: 7, y: 8 }]);
    const share = PixelPets.floorShare('fb_hall_in');
    const diner = PixelPets.floorShare('hm_diner');
    const cap = PixelPets.devChecks().floorCap;
    const skins = Object.entries(SKINS).filter(([, sk]) => sk.hop).map(([id]) => id);
    const keys = Object.keys(PixelPets.state).sort();
    return { rows, walk, blocked, up, down, mat, upLand, share, diner, cap, skins, keys, v: PixelPets.state.v };
  });
  expect(mask.v).toBe(2);
  expect(mask.cap).toEqual([]);
  expect(mask.share.share).toBeLessThanOrEqual(0.7);
  expect(mask.diner.share).toBeLessThanOrEqual(0.7);
  expect(mask.skins).toEqual(['fb_hall']);
  expect(mask.up.length).toBe(59);
  expect(pathHops({ x: 7, y: 22 }, mask.up)).toEqual({ hops: 0, steps: 59 });
  expect(mask.down.length).toBe(11);
  expect(pathHops({ x: 7, y: 5 }, mask.down)).toEqual({ hops: 6, steps: 11 });
  expect(mask.mat.length).toBe(12);
  expect(pathHops({ x: 7, y: 5 }, mask.mat).hops).toBe(6);
  expect(mask.upLand.length).toBe(50);
  expect(pathHops({ x: 7, y: 22 }, mask.upLand).hops).toBe(0);
  const reached = await page.evaluate(() => {
    PixelPets.goto('fb_hall_in', 7, 22, 'up');
    const key = (x, y) => x + ',' + y;
    const step = (x, y, dx, dy) => {
      const nx = x + dx, ny = y + dy;
      const t = PixelPets.tileInfo(nx, ny);
      if (t.ch === 'V' && dx === 0 && dy === 1) {
        const L = PixelPets.tileInfo(nx, ny + 1);
        if (L.walk && !L.blocked) return [nx, ny + 1];
        return null;
      }
      if (t.walk && !t.blocked) return [nx, ny];
      return null;
    };
    const from = (sx, sy) => {
      const seen = new Set([key(sx, sy)]);
      const q = [[sx, sy]];
      while (q.length) {
        const [x, y] = q.shift();
        for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
          const land = step(x, y, dx, dy);
          if (!land) continue;
          const k = key(land[0], land[1]);
          if (seen.has(k)) continue;
          seen.add(k);
          q.push(land);
        }
      }
      return seen;
    };
    const door = from(7, 22);
    let stuck = 0;
    for (const k of door) {
      const [x, y] = k.split(',').map(Number);
      const got = from(x, y);
      if (!got.has('7,5') || !got.has('7,22')) stuck++;
    }
    return { n: door.size, stuck };
  });
  expect(reached.stuck).toBe(0);
  expect(reached.n).toBeGreaterThan(40);
});

test('Fen still offers the trial from the talk cell', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390');
  await boot(page, save());
  await page.evaluate(() => { PixelPets.setFlag('story.heights_done', true); PixelPets.setSide('keepers'); PixelPets.goto('fb_hall_in', 7, 5, 'up'); });
  await page.keyboard.press('Space');
  for (let i = 0; i < 6; i++) {
    const mode = await page.evaluate(() => PixelPets.scene && PixelPets.scene.mode);
    if (mode === 'choice') break;
    if (await page.evaluate(() => PixelPets.scene && !PixelPets.scene.full)) await page.keyboard.press('Space');
    await page.keyboard.press('Space');
  }
  await expect.poll(() => page.evaluate(() => PixelPets.scene && PixelPets.scene.mode)).toBe('choice');
  await page.waitForFunction(() => window.PixelPets.optionsReady === true);
  const fen = await page.locator('#sbChoices button').allTextContents();
  expect(fen).toContain('Begin trial');
  await page.locator('#sbChoices button', { hasText: 'Leave' }).click();
  await page.waitForFunction(() => !PixelPets.scene);
});

test('the six terrace props say their lines', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390');
  await boot(page);
  for (const [x, y, px, py, line] of PROPS) {
    await page.evaluate(({ x, y }) => PixelPets.goto('fb_hall_in', x, y, 'up'), { x, y });
    await page.waitForFunction(() => !window.PixelPets.fading);
    const face = await page.evaluate(() => {
      const w = PixelPets.state.world;
      const t = PixelPets.tileInfo(w.x, w.y - 1);
      return { x: w.x, y: w.y, ch: t.ch, above: PixelPets.mapObjs.find(o => o.x === w.x && o.y === w.y - 1) };
    });
    expect(face.above && face.above.x).toBe(px);
    expect(face.above.y).toBe(py);
    await page.keyboard.press('Space');
    await expect.poll(() => page.evaluate(() => (PixelPets.scene && PixelPets.scene.text) || '')).toBe(line);
    await page.evaluate(() => PixelPets.endScene());
    await page.waitForFunction(() => !window.PixelPets.scene);
  }
});

test('a hop is one step, the tray closes, and a lip is a wall the other ways', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390');
  test.setTimeout(60000);
  await boot(page, save({ x: 7, y: 6, facing: 'down' }));
  const keysBefore = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('pixelpets.save.v2'))).sort());
  const steps0 = (await at(page)).steps;
  await page.evaluate(() => {
    const fol = PixelPets.follower;
    window.__fol0 = { x: fol.x, y: fol.y };
  });
  await page.locator('#mapCanvas').click({ position: await followerCss(page) });
  await expect(page.locator('#careTray')).toBeVisible();
  const logP = page.evaluate(() => new Promise((res) => {
    const rows = [];
    const t0 = performance.now();
    const rec = () => {
      const w = PixelPets.walk;
      rows.push({ t: performance.now() - t0, hop: !!w.hop, prog: w.prog, fy: w.fy, y: PixelPets.state.world.y, steps: PixelPets.state.steps, cam: w.cam.y });
      if (performance.now() - t0 < 700) requestAnimationFrame(rec);
      else res(rows);
    };
    requestAnimationFrame(rec);
  }));
  await page.keyboard.press('ArrowDown');
  const rows = await logP;
  const here = await at(page);
  expect(here.y).toBe(8);
  expect(here.x).toBe(7);
  expect(here.steps - steps0).toBe(1);
  expect(await page.locator('#careTray').isHidden()).toBe(true);
  const hopped = rows.filter(r => r.hop);
  expect(hopped.length).toBeGreaterThan(2);
  const tHop = hopped[hopped.length - 1].t - hopped[0].t;
  expect(tHop).toBeGreaterThan(140);
  expect(tHop).toBeLessThan(450);
  const mid = hopped.reduce((a, r) => Math.abs(r.prog - 0.5) < Math.abs(a.prog - 0.5) ? r : a, hopped[0]);
  expect(Math.round(Math.sin(mid.prog * Math.PI) * 4)).toBeGreaterThanOrEqual(3);
  const fys = rows.filter(r => r.t < hopped[hopped.length - 1].t + 30).map(r => r.fy);
  for (let i = 1; i < fys.length; i++) expect(fys[i] + 0.02).toBeGreaterThanOrEqual(fys[i - 1]);
  const cams = rows.map(r => r.cam);
  for (let i = 1; i < cams.length; i++) expect(Math.abs(cams[i] - cams[i - 1])).toBeLessThan(20);
  const fol = await page.evaluate(() => ({ x: PixelPets.follower.x, y: PixelPets.follower.y }));
  expect(fol).toEqual({ x: 7, y: 6 });
  const keysAfter = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('pixelpets.save.v2'))).sort());
  expect(keysAfter).toEqual(keysBefore);
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);

  await page.evaluate(() => PixelPets.goto('fb_hall_in', 7, 8, 'up'));
  await page.waitForFunction(() => !window.PixelPets.fading);
  const up = await page.evaluate(() => { const b = { x: PixelPets.state.world.x, y: PixelPets.state.world.y }; PixelPets.walkStep('up'); return { b, a: { x: PixelPets.state.world.x, y: PixelPets.state.world.y } }; });
  expect(up.a).toEqual(up.b);
  const into = await page.evaluate(() => {
    PixelPets.state.world.x = 6; PixelPets.state.world.y = 7; PixelPets.walk.fx = 6; PixelPets.walk.fy = 7; PixelPets.walk.to = null;
    const right = PixelPets.walkStep('right');
    PixelPets.state.world.x = 8; PixelPets.state.world.y = 7; PixelPets.walk.fx = 8; PixelPets.walk.fy = 7; PixelPets.walk.to = null;
    const left = PixelPets.walkStep('left');
    return { right: { x: right.x, y: right.y }, left: { x: left.x, y: left.y } };
  });
  expect(into.right).toEqual({ x: 6, y: 7 });
  expect(into.left).toEqual({ x: 8, y: 7 });

  await page.evaluate(() => PixelPets.goto('fb_hall_in', 7, 8, 'up'));
  const around = await page.evaluate(() => PixelPets.findPath([{ x: 8, y: 4 }]));
  expect(around && around.length).toBeGreaterThan(4);
  expect(pathHops({ x: 7, y: 8 }, around).hops).toBe(0);
});

async function followerCss(page) {
  return page.evaluate(() => {
    const c = document.querySelector('#mapCanvas');
    const cam = PixelPets.walk.cam;
    const fol = PixelPets.follower;
    const k = c.getBoundingClientRect().width / c.width;
    return { x: (fol.x * 16 - cam.x + 8) * k, y: (fol.y * 16 - cam.y + 8) * k };
  });
}

test('the mat warp still fires, and a non-hall step is one cell', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390');
  await boot(page, save({ x: 7, y: 5, facing: 'down' }));
  const steps0 = (await at(page)).steps;
  for (let i = 0; i < 12; i++) {
    const r = await page.evaluate(() => PixelPets.walkStep('down'));
    if (r.map !== 'fb_hall_in') break;
  }
  await page.waitForFunction(() => !window.PixelPets.fading && PixelPets.state.world.map === 'fernbrook');
  const out = await at(page);
  expect(out.map).toBe('fernbrook');
  expect(out.x).toBe(22);
  expect(out.y).toBe(6);
  expect(out.steps - steps0).toBe(12);

  await page.evaluate(() => PixelPets.goto('hm_diner', 5, 6, 'up'));
  await page.waitForFunction(() => !window.PixelPets.fading);
  const d0 = await at(page);
  await page.evaluate(() => PixelPets.walkStep('up'));
  const d1 = await at(page);
  expect(d1).toMatchObject({ map: 'hm_diner', x: d0.x, y: d0.y - 1 });
  expect(d1.steps - d0.steps).toBe(1);
  await page.evaluate(() => PixelPets.goto('hm_diner', 5, 7, 'down'));
  const wall = await at(page);
  await page.evaluate(() => PixelPets.walkStep('down'));
  const wall2 = await at(page);
  expect(wall2.x).toBe(wall.x);
  expect(wall2.y).toBe(wall.y);

  await page.evaluate(() => PixelPets.goto('fernbrook', 22, 6, 'up'));
  await page.keyboard.press('ArrowUp');
  await expect.poll(() => page.evaluate(() => (PixelPets.scene && PixelPets.scene.text) || '')).toContain('latched');
  expect(await page.evaluate(() => PixelPets.state.world.map)).toBe('fernbrook');
});

test('a sheet, a line, and a fade during a hop do not throw', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390');
  test.setTimeout(60000);
  await boot(page, save({ x: 7, y: 6, facing: 'down' }));
  const steps0 = (await at(page)).steps;
  await page.evaluate(() => {
    PixelPets.walk.from = { x: 7, y: 6 };
    PixelPets.walk.to = { x: 7, y: 8 };
    PixelPets.walk.prog = 0.2;
    PixelPets.walk.hop = true;
    PixelPets.walk.fx = 7; PixelPets.walk.fy = 6.2;
    PixelPets.state.world.x = 7; PixelPets.state.world.y = 8; PixelPets.state.world.facing = 'down';
    document.querySelector('#settingsBtn').click();
  });
  await expect(page.locator('#ovSettings')).toBeVisible();
  await page.waitForTimeout(80);
  expect(await page.evaluate(() => ({ y: PixelPets.state.world.y, to: PixelPets.walk.to, hop: PixelPets.walk.hop }))).toEqual({ y: 8, to: null, hop: false });
  expect((await at(page)).steps).toBe(steps0 + 1);
  await page.locator('#setClose').click();
  await expect(page.locator('#ovSettings')).toBeHidden();

  await page.evaluate(() => {
    PixelPets.goto('fb_hall_in', 7, 10, 'down');
  });
  await page.waitForFunction(() => !window.PixelPets.fading && PixelPets.state.world.y === 10);
  const said = await page.evaluate(() => {
    PixelPets.walk.from = { x: 7, y: 10 };
    PixelPets.walk.to = { x: 7, y: 12 };
    PixelPets.walk.prog = 0.2;
    PixelPets.walk.hop = true;
    PixelPets.state.world.x = 7; PixelPets.state.world.y = 12;
    return PixelPets.runSteps([['say', '', 'The terrace holds.']]);
  });
  expect(said).toBe(true);
  await expect.poll(() => page.evaluate(() => ({ y: PixelPets.state.world.y, to: PixelPets.walk.to, text: (PixelPets.scene && PixelPets.scene.text) || '' }))).toMatchObject({ y: 12, to: null, text: 'The terrace holds.' });
  await page.evaluate(() => { if (PixelPets.scene) PixelPets.endScene(); });
  await page.waitForFunction(() => !window.PixelPets.scene);

  const steps1 = (await at(page)).steps;
  await page.evaluate(() => PixelPets.goto('fb_hall_in', 7, 14, 'down'));
  await page.waitForFunction(() => !window.PixelPets.fading && PixelPets.state.world.y === 14);
  await page.evaluate(() => {
    PixelPets.walk.from = { x: 7, y: 14 };
    PixelPets.walk.to = { x: 7, y: 16 };
    PixelPets.walk.prog = 0.2;
    PixelPets.walk.hop = true;
    PixelPets.state.world.x = 7; PixelPets.state.world.y = 16;
    PixelPets.runSteps([['warp', 'fernbrook', 22, 6, 'down']]);
  });
  await page.waitForFunction(() => !window.PixelPets.fading && PixelPets.state.world.map === 'fernbrook');
  const landed = await at(page);
  expect(landed).toMatchObject({ map: 'fernbrook', x: 22, y: 6 });
  expect(landed.steps).toBeGreaterThan(steps1);
});

test('an old hall save stays on its tile', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390');
  await boot(page, save({ x: 7, y: 22, facing: 'up' }));
  expect(await at(page)).toMatchObject({ map: 'fb_hall_in', x: 7, y: 22 });
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});

test('terrace bands, the hop lip, and the coach floor read as drawn', async ({ page }) => {
  const width = page.viewportSize().width;
  test.skip(width !== 390 && width !== 320, '320 and 390');
  await boot(page, save({ x: 7, y: 12, facing: 'up' }));
  const look = await page.evaluate(() => {
    const remap = SKINS.fb_hall.remap;
    const bands = ['N', 'O', 'Q', 'L', 'G', 'J'].map(ch => remap[ch]);
    const floors = [':', ',', ';', 'b', 'z', 'k', 'a', 'd', 'f'].map(ch => remap[ch]);
    const T = buildTiles();
    const sample = (canvas) => {
      const d = canvas.getContext('2d').getImageData(0, 0, 16, 16).data;
      const rows = [];
      for (let y = 0; y < 16; y++) {
        const cols = [];
        for (let x = 0; x < 16; x++) {
          const i = (y * 16 + x) * 4;
          cols.push('#' + [d[i], d[i + 1], d[i + 2]].map(n => n.toString(16).padStart(2, '0')).join(''));
        }
        rows.push(cols);
      }
      return rows;
    };
    const lip = sample(T.hall_hop);
    const plank = sample(T.coach_plank);
    const seam = plank[3];
    return {
      bands, floors,
      lipRow11: lip[11][0],
      lipRiser: lip[12][0],
      lipSame11: lip[11].every(c => c === lip[11][0]),
      lipRiserFlat: [12, 13, 14].every(y => lip[y].every(c => c === lip[12][0])),
      sand: lip[0].filter(c => c === '#c9925e').length,
      seamFlat: seam.every(c => c === seam[0]),
      diner: SKINS.house_diner.remap,
    };
  });
  expect(new Set(look.bands).size).toBe(6);
  expect(new Set(look.floors).size).toBe(look.floors.length);
  expect(look.lipSame11).toBe(true);
  expect(look.lipRow11).toBe('#f4f4f4');
  expect(look.lipRiserFlat).toBe(true);
  expect(look.lipRiser).toBe('#5c4033');
  expect(look.sand).toBeGreaterThan(8);
  expect(look.seamFlat).toBe(true);
  expect(look.diner['.']).toBe('coach_plank');
  expect(look.diner[',']).toBe('coach_tile');
  expect(look.diner['=']).toBe('rug_coach');
  if (width === 390) {
    await page.screenshot({ path: path.join(artifactsDir(), 'art_pass_hall_390.png') });
    await page.evaluate(() => PixelPets.goto('fb_hall_in', 7, 6, 'down'));
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(artifactsDir(), 'art_pass_drop_390.png') });
  }
  if (width === 320) {
    await page.evaluate(() => PixelPets.goto('hm_diner', 5, 5, 'up'));
    await page.waitForFunction(() => !window.PixelPets.fading);
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(artifactsDir(), 'art_pass_diner_320.png') });
  }
});
