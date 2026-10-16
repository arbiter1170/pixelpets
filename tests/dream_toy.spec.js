/* Dream 2004 (Mahopac quest): the pop-toy answers a bump from any side, Mom cooks and Dad watches TV in a bigger room,
   and the keeper's own Walkling is not there yet (no follower in this memory). */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, playScene } = require('./helpers');

trackErrors(test, expect);

async function boot(page) {
  const s = starterSave();
  s.settings.follower = true;
  s.settings.controls = 'arcade';
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
  if (info.project.name === '390') await page.screenshot({ path: '/workspace/shots/dream_toy_push_390.png' });

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
  if (info.project.name === '390') await page.screenshot({ path: '/workspace/shots/dream_room_390.png' });
  expect(await talk(page, 10, 4, 'up')).toContain('Dinner');
  expect(await talk(page, 11, 6, 'left')).toContain('toy');
  // Outside the memory the partner walks again.
  await page.evaluate(() => PixelPets.goto('mahopac_obs', 4, 5, 'up'));
  expect((await page.evaluate(() => PixelPets.follower)).shown).toBe(true);
});
