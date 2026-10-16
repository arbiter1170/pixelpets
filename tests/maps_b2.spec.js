/* B2: RegenX lobby, Focus Wing, and Records expand 18x12 to 14x22.
   Old object ids stay. Accents, signature props, D88 after variants, and the safe-spot snap. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const OLD = {
  rx_f1: ['rx1_out', 'rx1_up', 'rx1_in', 'rx_nia', 'rx_wardens', 'rx1_desk', 'rx_f1_plaque'],
  rx_f2: ['rx2_down', 'rx2_up', 'rx_cal', 'rx_ivo', 'rx_techs', 'rx2_heal', 'rx2_bench_a', 'rx2_bench_b', 'rx2_rack', 'rx_f2_plaque'],
  rx_f3: ['rx3_down', 'rx3_up', 'rx3_term', 'rx_records', 'rx3_heal', 'rx3_shelf_a', 'rx3_shelf_b', 'rx3_screen', 'rx_f3_plaque'],
};

function labSave(flags = {}, world) {
  const s = starterSave();
  Object.assign(s.flags, {
    'story.side': 'glimmer', 'story.side_pick_done': true, 'story.rx_enter': true, 'story.saw_arbiter': true,
    'story.rx_f1': true, 'story.rx_f2': true, 'story.rx_f3': true,
  }, flags);
  if (world) s.world = Object.assign({ facing: 'up', respawn: 'fernbrook' }, world);
  return s;
}
async function boot(page, save) {
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
}
async function at(page, map, x, y, facing = 'up') {
  await page.evaluate(([map, x, y, f]) => PixelPets.goto(map, x, y, f), [map, x, y, facing]);
  await page.waitForTimeout(80);
}
async function talk(page) {
  await expect.poll(() => page.evaluate(() => document.querySelector('#talkBtn').classList.contains('ready'))).toBe(true);
  await page.locator('#talkBtn').click();
  await expect.poll(() => page.evaluate(() => PixelPets.scene && PixelPets.scene.full ? PixelPets.scene.text : null), { timeout: 5000 }).not.toBeNull();
  const t = await page.evaluate(() => PixelPets.scene.text);
  for (let i = 0; i < 8 && await page.evaluate(() => !!PixelPets.scene); i++) { await page.keyboard.press('Space'); await page.waitForTimeout(40); }
  return t;
}
const pos = page => page.evaluate(() => ({ map: PixelPets.mapInfo.id, x: PixelPets.state.world.x, y: PixelPets.state.world.y, facing: PixelPets.state.world.facing }));

test('the three floors are 14x22, old ids stay, and the stair landings match', async ({ page }) => {
  await boot(page, labSave());
  const r = await page.evaluate(() => {
    const m = MAPDATA.heights.maps;
    const floor = id => {
      const map = m[id];
      return { w: map.w, h: map.h, variants: !!map.variants, fitWidth: !!map.fitWidth, safe: map.safe, ids: map.objs.map(o => o.id),
        up: map.objs.find(o => o.id.endsWith('_up')), down: map.objs.find(o => o.kind === 'warp') };
    };
    const f4 = m.rx_f4;
    return {
      floors: { rx_f1: floor('rx_f1'), rx_f2: floor('rx_f2'), rx_f3: floor('rx_f3') },
      up3: m.rx_f3.objs.find(o => o.id === 'rx3_up'),
      down4: f4.objs.filter(o => o.id === 'rx4_down' || o.id === 'rx4_down_b').map(o => [o.id, o.x, o.y, o.tx, o.ty, o.facing]),
      lab: m.fb_heights.objs.find(o => o.id === 'ht_lab'),
      grid4: f4.grid[0],
      checks: PixelPets.devChecks(),
      v: PixelPets.state.v,
    };
  });
  expect(r.v).toBe(2);
  expect(r.checks.floorCap).toEqual([]);
  expect(r.grid4).toBe('##############');
  expect([r.up3.tx, r.up3.ty, r.up3.facing, r.up3.need]).toEqual([6, 19, 'up', 'story.rx_f3']);
  expect(r.down4).toEqual([['rx4_down', 6, 20, 6, 4, 'up'], ['rx4_down_b', 7, 20, 6, 4, 'up']]);
  expect([r.lab.tx, r.lab.ty, r.lab.facing]).toEqual([6, 19, 'up']);
  for (const id of ['rx_f1', 'rx_f2', 'rx_f3']) {
    const f = r.floors[id];
    expect([f.w, f.h, f.variants, f.fitWidth]).toEqual([14, 22, true, true]);
    expect(f.safe).toEqual({ x: 6, y: 19 });
    for (const old of OLD[id]) expect(f.ids).toContain(old);
    expect([f.up.x, f.up.y]).toEqual([6, 2]);
    expect([f.down.x, f.down.y]).toEqual([6, 20]);
  }
  expect(r.floors.rx_f1.up.tx).toBe(6);
  expect(r.floors.rx_f1.up.ty).toBe(19);
  expect(r.floors.rx_f2.down.tx).toBe(6);
  expect(r.floors.rx_f2.down.ty).toBe(4);
});

test('each floor is walkable, under the floor cap, and its accent is its own', async ({ page }) => {
  await boot(page, labSave());
  const r = await page.evaluate(() => {
    const out = {};
    for (const id of ['rx_f1', 'rx_f2', 'rx_f3']) {
      PixelPets.goto(id, 6, 19, 'up');
      const share = PixelPets.floorShare(id);
      const seen = new Set(['6,19']); const q = [[6, 19]];
      const ok = (x, y) => !PixelPets.tileInfo(x, y).blocked;
      while (q.length) {
        const [x, y] = q.shift();
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
          if (nx < 0 || ny < 0 || nx >= 14 || ny >= 22 || seen.has(k) || !ok(nx, ny)) continue;
          seen.add(k); q.push([nx, ny]);
        }
      }
      const objs = PixelPets.mapInfo.objs;
      const lonely = objs.filter(o => o.block).filter(o => ![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has((o.x + dx) + ',' + (o.y + dy)))).map(o => o.id);
      const miss = objs.filter(o => !o.block && (o.kind === 'warp' || o.kind === 'door' || o.kind === 'pickup' || o.kind === 'trigger')).filter(o => !seen.has(o.x + ',' + o.y)).map(o => o.id);
      const cells = [];
      for (let y = 0; y < 22; y++) for (let x = 0; x < 14; x++) cells.push(PixelPets.tileInfo(x, y));
      const cam = { w: document.querySelector('#mapCanvas').width, h: document.querySelector('#mapCanvas').height };
      out[id] = { share, lonely, miss, n: seen.size, cam,
        mint: cells.filter(c => c.ch === 'i').map(c => c.tile)[0] || null,
        blue: cells.filter(c => c.ch === 'b').map(c => c.tile)[0] || null,
        amber: cells.filter(c => c.ch === 'y').map(c => c.tile)[0] || null,
        panel: cells.filter(c => c.ch === 'n').map(c => [c.tile, c.solid])[0] || null,
        scuff: cells.filter(c => c.ch === ',').every(c => c.tile === 'lab_floor_scuff'),
        stair: cells.filter(c => c.ch === '^').map(c => [c.tile, c.blocked])[0],
        decals: cells.filter(c => c.decal).length,
        art: PixelPets.mapObjs.filter(o => o.sprite && !o.art).map(o => o.id) };
    }
    return out;
  });
  expect(r.rx_f1.mint).toBe('lab_inlay_mint');
  expect(r.rx_f1.blue).toBeNull();
  expect(r.rx_f1.amber).toBeNull();
  expect(r.rx_f1.panel).toBeNull();
  expect(r.rx_f2.blue).toBe('lab_stripe_blue');
  expect(r.rx_f2.mint).toBeNull();
  expect(r.rx_f2.panel[0]).toBe('lab_wall_panel');
  expect(r.rx_f2.panel[1]).toBe(true);
  expect(r.rx_f3.amber).toBe('lab_stripe_amber');
  expect(r.rx_f3.blue).toBeNull();
  for (const id of ['rx_f1', 'rx_f2', 'rx_f3']) {
    expect(r[id].share.share).toBeLessThanOrEqual(0.7);
    expect(r[id].share.walk).toBeGreaterThan(0);
    expect(r[id].lonely).toEqual([]);
    expect(r[id].miss).toEqual([]);
    expect(r[id].scuff).toBe(true);
    expect(r[id].stair).toEqual(['lab_stair', false]);
    expect(r[id].decals).toBeGreaterThanOrEqual(8);
    expect(r[id].art).toEqual([]);
    expect(r[id].cam.w).toBe(14 * 16);
    expect(r[id].cam.h).toBeLessThan(22 * 16);
  }
});

test('signature props say their lines, and a locked stair stays shut', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page, labSave());
  const cases = [
    ['rx_f1', 2, 12, 'up', 'A white bench.'],
    ['rx_f1', 1, 4, 'up', 'A white planter.'],
    ['rx_f1', 10, 7, 'up', 'A visitor screen.'],
    ['rx_f1', 11, 6, 'up', 'REGENX LOBBY.'],
    ['rx_f2', 10, 6, 'up', 'A whiteboard.'],
    ['rx_f2', 2, 13, 'up', 'A quiet booth.'],
    ['rx_f2', 2, 6, 'up', 'FOCUS WING.'],
    ['rx_f3', 4, 11, 'up', 'A sorting table.'],
    ['rx_f3', 1, 15, 'up', 'A file cart.'],
    ['rx_f3', 8, 9, 'up', 'A dim lamp.'],
    ['rx_f3', 1, 10, 'up', 'A shelf of folders.'],
    ['rx_f3', 2, 5, 'up', 'RECORDS.'],
  ];
  for (const [map, x, y, f, line] of cases) {
    await at(page, map, x, y, f);
    expect(await talk(page), map + ' ' + x + ',' + y).toContain(line);
  }
  await boot(page, labSave({ 'story.rx_f1': false }));
  await at(page, 'rx_f1', 6, 3, 'up');
  const pt = await page.evaluate(() => {
    const c = document.querySelector('#mapCanvas'), r = c.getBoundingClientRect(), k = r.width / c.width;
    return { x: r.left + (6 * 16 + 8 - PixelPets.walk.cam.x) * k, y: r.top + (2 * 16 + 8 - PixelPets.walk.cam.y) * k };
  });
  await page.mouse.click(pt.x, pt.y);
  await expect.poll(() => page.evaluate(() => PixelPets.scene && PixelPets.scene.text)).toContain('The stair lock is still on.');
  expect(await pos(page)).toMatchObject({ map: 'rx_f1' });
});

test('the climb lands on each south mat, and the lobby mat leaves for the Heights', async ({ page }) => {
  await boot(page, labSave());
  const clickDoor = async () => {
    const pt = await page.evaluate(() => {
      const c = document.querySelector('#mapCanvas'), r = c.getBoundingClientRect(), k = r.width / c.width;
      const door = PixelPets.mapInfo.objs.find(o => o.kind === 'door');
      return { x: r.left + (door.x * 16 + 8 - PixelPets.walk.cam.x) * k, y: r.top + (door.y * 16 + 8 - PixelPets.walk.cam.y) * k };
    });
    await page.mouse.click(pt.x, pt.y);
  };
  const settled = () => page.waitForFunction(() => !PixelPets.fading);
  await at(page, 'rx_f1', 6, 3, 'up');
  await settled();
  await clickDoor();
  await expect.poll(() => pos(page)).toEqual({ map: 'rx_f2', x: 6, y: 19, facing: 'up' });
  await settled();
  await at(page, 'rx_f2', 6, 3, 'up');
  await clickDoor();
  await expect.poll(() => pos(page)).toEqual({ map: 'rx_f3', x: 6, y: 19, facing: 'up' });
  await settled();
  await at(page, 'rx_f3', 6, 3, 'up');
  await clickDoor();
  await expect.poll(() => pos(page)).toEqual({ map: 'rx_f4', x: 6, y: 19, facing: 'up' });
  await settled();
  await at(page, 'rx_f1', 6, 19, 'down');
  await page.keyboard.press('ArrowDown');
  await expect.poll(() => pos(page)).toMatchObject({ map: 'fb_heights', x: 4, y: 6, facing: 'down' });
});

test('floor variants stay seeded, and an old save on a solid tile snaps to safe', async ({ page }) => {
  await boot(page, labSave({}, { map: 'rx_f1', x: 7, y: 19 }));
  const read = () => page.evaluate(() => {
    const out = [];
    for (let y = 0; y < 22; y++) for (let x = 0; x < 14; x++) out.push(PixelPets.tileInfo(x, y).tile);
    return out;
  });
  const one = await read();
  expect(one.filter(t => t === 'lab_floor_glint').length).toBeGreaterThan(0);
  expect(one.filter(t => t === 'lab_floor_stain').length).toBeGreaterThan(0);
  await page.reload();
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
  expect(await read()).toEqual(one);
  expect(await page.evaluate(() => JSON.stringify(PixelPets.state).includes('lab_floor_glint'))).toBe(false);
  expect(await pos(page)).toMatchObject({ map: 'rx_f1', x: 7, y: 19 });
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);

  await boot(page, labSave({}, { map: 'rx_f1', x: 16, y: 6 }));
  expect(await pos(page)).toMatchObject({ map: 'rx_f1', x: 6, y: 19 });
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
  await boot(page, labSave({}, { map: 'rx_f2', x: 2, y: 8 }));
  expect(await pos(page)).toMatchObject({ map: 'rx_f2', x: 6, y: 19 });
  await boot(page, labSave({}, { map: 'rx_f3', x: 9, y: 8 }));
  const stayed = await pos(page);
  expect(stayed.map).toBe('rx_f3');
  expect(await page.evaluate(([x, y]) => PixelPets.tileInfo(x, y).blocked, [stayed.x, stayed.y])).toBe(false);
});
