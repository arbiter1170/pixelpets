/* Dream 2004 (Mahopac quest): the pop-toy answers a bump from any side, Mom cooks and Dad watches TV in a bigger room,
   and the keeper's own Walkling is not there yet (no follower in this memory). */
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, playScene } = require('./helpers');

trackErrors(test, expect);

async function boot(page, controls) {
  const s = starterSave();
  s.settings.follower = true;
  s.settings.controls = controls || 'arcade';
  Object.assign(s.flags, { 'story.mom_met': true, 'story.mom_chore': true, 'story.mom_sent': true, 'story.reached_mahopac': true, 'story.dream_started': true });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
}
const state = (page) => page.evaluate(() => ({
  at: [PixelPets.state.world.x, PixelPets.state.world.y],
  roll: +PixelPets.state.flags['story.dream_roll'] || 0,
  toy: (({ x, y }) => [x, y])(PixelPets.mapInfo.objs.find((o) => o.id === 'pop_toy')),
  fol: PixelPets.follower,
  map: PixelPets.mapInfo.id,
}));
async function tap(page, key) { await page.keyboard.down(key); await page.waitForTimeout(60); await page.keyboard.up(key); await page.waitForTimeout(250); }
async function talk(page, x, y, f) {
  await page.evaluate(([x, y, f]) => PixelPets.goto('dream_2004', x, y, f), [x, y, f]);
  await tap(page, 'Space');
  const text = await page.evaluate(() => PixelPets.scene && PixelPets.scene.text);
  await playScene(page);
  return text;
}

test('walk from the spawn to the toy, push it from the near side, and finish the circuit', async ({ page }, info) => {
  test.setTimeout(60000);
  await boot(page);
  await page.evaluate(() => PixelPets.goto('dream_2004', 4, 6, 'up'));
  let s = await state(page);
  expect(s.map).toBe('dream_2004');
  expect(s.toy).toEqual([3, 3]);
  expect(s.fol.on).toBe(false);
  expect(s.fol.shown).toBe(false);

  // The natural route: straight up over the rug to (4,3), then bump the toy on the left. This used to do nothing.
  for (let i = 0; i < 3; i++) await tap(page, 'ArrowUp');
  s = await state(page);
  expect(s.at).toEqual([4, 3]);
  await tap(page, 'ArrowLeft');
  s = await state(page);
  expect(s.roll).toBe(1);
  expect(s.toy).toEqual([4, 3]);
  expect(s.at[1]).toBe(3); expect(s.at[0]).toBeLessThanOrEqual(3);   // swapped onto the toy's old tile (a held key may walk on)
  expect(s.fol.shown).toBe(false);
  if (info.project.name === '390') {
    const dir = path.join(__dirname, '..', 'test-results', 'shots');
    fs.mkdirSync(dir, { recursive: true });
    await page.screenshot({ path: path.join(dir, 'dream_toy_push_390.png') });
  }

  // Leaving and coming back keeps the toy where it stopped.
  await page.evaluate(() => PixelPets.goto('dream_2004', 4, 6, 'up'));
  s = await state(page);
  expect(s.toy).toEqual([4, 3]);

  // Round the rest of the circuit, bumping from wherever the keeper stands next to it.
  const circuit = [[3, 3], [4, 3], [5, 3], [5, 4], [5, 5], [4, 5], [3, 5], [3, 4]];
  const sides = { ArrowUp: [0, 1], ArrowDown: [0, -1], ArrowLeft: [1, 0], ArrowRight: [-1, 0] };
  for (let step = 1; step < circuit.length; step++) {
    const [tx, ty] = circuit[step];
    let done = false;
    for (const [key, [dx, dy]] of Object.entries(sides)) {
      const sx = tx + dx, sy = ty + dy;
      if (sx < 1 || sy < 2 || sx > 8 || sy > 7) continue;
      const f = key.replace('Arrow', '').toLowerCase();
      await page.evaluate(([x, y, f]) => PixelPets.goto('dream_2004', x, y, f), [sx, sy, f]);
      const before = (await state(page)).roll;
      await tap(page, key);
      if ((await state(page)).roll === before + 1) { done = true; break; }
    }
    expect(done, 'push at step ' + step).toBe(true);
  }
  await page.waitForFunction(() => PixelPets.scene);
  await playScene(page);
  const end = await page.evaluate(() => ({ toy: PixelPets.state.flags['story.dream_toy'], map: PixelPets.mapInfo.id, fol: PixelPets.follower }));
  expect(end.toy).toBe(true);
  expect(end.map).toBe('dream_party');
  expect(end.fol.on).toBe(true);   // the partner is back after the 2004 memory
});

test('Mom cooks, Dad watches TV, and the whole room fits', async ({ page }, info) => {
  await boot(page);
  await page.evaluate(() => PixelPets.goto('dream_2004', 4, 6, 'up'));
  const room = await page.evaluate(() => {
    const m = PixelPets.mapInfo, by = (id) => m.objs.find((o) => o.id === id);
    return { w: m.w, h: m.h, mom: by('dream04_mom'), dad: by('dream04_dad'), stove: by('dream_stove'), tv: by('dream_tv'), couch: by('dream_couch') };
  });
  expect([room.w, room.h]).toEqual([13, 9]);
  expect(room.mom).toMatchObject({ x: 10, y: 3 });
  expect(room.stove).toMatchObject({ x: 10, y: 2 });
  expect(room.dad).toMatchObject({ x: 10, y: 6 });
  expect(room.tv).toMatchObject({ x: 10, y: 5 });
  expect(room.couch).toMatchObject({ x: 10, y: 7 });
  if (info.project.name === '390') {
    const dir = path.join(__dirname, '..', 'test-results', 'shots');
    fs.mkdirSync(dir, { recursive: true });
    await page.screenshot({ path: path.join(dir, 'dream_room_390.png') });
  }
  expect(await talk(page, 10, 4, 'up')).toContain('Dinner');
  expect(await talk(page, 11, 6, 'left')).toContain('toy');
  // Outside the memory the partner walks again.
  await page.evaluate(() => PixelPets.goto('mahopac_obs', 4, 5, 'up'));
  expect((await page.evaluate(() => PixelPets.follower)).shown).toBe(true);
});

// From the spawn (4,6) the camera x stays 0 at every width while the keeper is on that column (map 13 wide).
// Vertically the room is centred when it fits.
const tilePoint = (page, tx, ty) => page.evaluate(([tx, ty]) => {
  const c = document.querySelector('#mapCanvas'), r = c.getBoundingClientRect(), k = r.width / c.width, TS = 16, m = PixelPets.mapInfo;
  const cx = m.w * TS <= c.width ? -Math.floor((c.width - m.w * TS) / 2) : 0, cy = m.h * TS <= c.height ? -Math.floor((c.height - m.h * TS) / 2) : 0;
  return { x: r.left + ((tx + 0.5) * TS - cx) * k, y: r.top + ((ty + 0.5) * TS - cy) * k };
}, [tx, ty]);
const SHOTS = '/opt/cursor/artifacts/screenshots';

test('the only roll prop is the popping toy @w1', () => {
  const dir = path.join(__dirname, '..', 'data');
  const hits = [];
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (node.roll === true && node.kind === 'prop') hits.push(node.id);
    for (const v of Object.values(node)) walk(v);
  };
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.json')) continue;
    walk(JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')));
  }
  expect(hits).toEqual(['pop_toy']);
});

test('modern: tapping the pop-toy walks up and pushes it, all the way round', async ({ page }, info) => {
  test.setTimeout(90000);
  await boot(page, 'modern');
  expect(await page.evaluate(() => PixelPets.trackSide('mom'))).toBe(true);
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
  expect(await page.evaluate(() => PixelPets.questCheck)).toEqual([]);
  for (let step = 0; step < 8; step++) {
    await page.evaluate(() => PixelPets.goto('dream_2004', 4, 6, 'up'));
    await page.waitForTimeout(300);
    const before = await state(page);
    const cue = await page.evaluate(() => PixelPets.sideQuest && PixelPets.sideQuest.point);
    expect(cue).toMatchObject({ x: before.toy[0], y: before.toy[1], here: true });
    const p = await tilePoint(page, before.toy[0], before.toy[1]);
    if (step === 0 && info.project.name === '390') {
      fs.mkdirSync(SHOTS, { recursive: true });
      await page.screenshot({ path: path.join(SHOTS, 'dream_toy_tap_before_390.png') });
    }
    await page.touchscreen.tap(p.x, p.y);
    await expect.poll(async () => (await state(page)).roll, { message: 'tap push ' + step, timeout: 5000 }).toBe(step + 1);
    const after = await state(page);
    if (step < 7) expect(after.toy).not.toEqual(before.toy);
    if (step < 7) {
      const moved = await page.evaluate(() => PixelPets.sideQuest && PixelPets.sideQuest.point);
      expect(moved).toMatchObject({ x: after.toy[0], y: after.toy[1], here: true });
    }
    if (step === 0 && info.project.name === '390') await page.screenshot({ path: path.join(SHOTS, 'dream_toy_tap_after_390.png') });
  }
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full && String(PixelPets.scene.text).indexOf('finishes its circle') >= 0);
  if (info.project.name === '390') await page.screenshot({ path: path.join(SHOTS, 'dream_toy_tap_end_390.png') });
  await playScene(page);
  expect(await page.evaluate(() => PixelPets.mapInfo.id)).toBe('dream_party');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  expect(saved.v).toBe(2);
  expect(saved.flags['story.dream_roll']).toBe(8);
  expect(saved.flags['story.dream_toy']).toBe(true);
});

test('modern: tapping a birthday balloon walks up and pops it', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page, 'modern');
  await page.evaluate(() => PixelPets.goto('dream_party', 5, 6, 'up'));
  await page.waitForTimeout(300);
  const before = await page.evaluate(() => ({
    n: PixelPets.mapInfo.objs.filter((o) => String(o.id).startsWith('balloon_')).length,
    red: !!PixelPets.state.flags['story.dream_red'],
    v: PixelPets.state.v,
  }));
  expect(before.n).toBe(3);
  expect(before.red).toBe(false);
  expect(before.v).toBe(2);
  const p = await page.evaluate(() => {
    const o = PixelPets.mapInfo.objs.find((x) => x.id === 'balloon_red');
    const c = document.querySelector('#mapCanvas'), r = c.getBoundingClientRect(), k = r.width / c.width, cam = PixelPets.walk.cam, TS = 16;
    return { x: r.left + ((o.x + 0.5) * TS - cam.x) * k, y: r.top + ((o.y + 0.5) * TS - cam.y) * k };
  });
  await page.touchscreen.tap(p.x, p.y);
  await page.waitForFunction(() => PixelPets.scene && String(PixelPets.scene.text).indexOf('red balloon') >= 0);
  await playScene(page);
  const after = await page.evaluate(() => ({
    n: PixelPets.mapInfo.objs.filter((o) => String(o.id).startsWith('balloon_')).length,
    red: PixelPets.state.flags['story.dream_red'],
    map: PixelPets.mapInfo.id,
    v: PixelPets.state.v,
    rollKey: Object.prototype.hasOwnProperty.call(PixelPets.state.flags, 'story.dream_roll'),
  }));
  expect(after.red).toBe(true);
  expect(after.n).toBe(2);
  expect(after.map).toBe('dream_party');
  expect(after.v).toBe(2);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  expect(saved.v).toBe(2);
  expect(saved.flags['story.dream_red']).toBe(true);
});

test('arcade: the Talk button lights up beside the pop-toy and pushes it', async ({ page }) => {
  await boot(page, 'arcade');
  await page.evaluate(() => PixelPets.goto('dream_2004', 3, 4, 'up'));
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => document.querySelector('#talkBtn').getAttribute('aria-disabled'))).toBe('false');
  const bb = await page.locator('#talkBtn').boundingBox();
  await page.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await expect.poll(async () => (await state(page)).roll).toBe(1);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  expect(saved.v).toBe(2);
  expect(saved.flags['story.dream_roll']).toBe(1);
});
