/* B3 tunnel rooms: rock skin on the same 18x12 grids (D87), seeded floor variants (D88), dressing props. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const ROOMS = ['sm_yard', 'sm_tunnel', 'sm_hold', 'sm_den'];
const OLD = {
  sm_yard: [['smy_out', 9, 10], ['smy_down', 9, 3], ['smy_in', 9, 8], ['sm_lookouts', 13, 6]],
  sm_tunnel: [['smt_up', 9, 10], ['smt_on', 14, 3], ['sm_jed', 5, 6], ['smt_heal', 7, 8]],
  sm_hold: [['smh_back', 9, 10], ['smh_den', 14, 3], ['smh_free', 8, 5], ['sm_crate', 6, 6], ['sm_haulers', 12, 7], ['sm_ken', 7, 7]],
  sm_den: [['smd_back', 9, 10], ['sm_mara', 9, 6]],
};
const LINES = {
  tunnel_cart: 'A wooden cart. Nothing in it.',
  crate_stack: 'Crates stacked against the rock.',
  barrel: 'A sealed barrel.',
  rope_coil: 'A coil of rope.',
  tunnel_brace: 'A timber brace in the rock.',
  lantern_hook: 'An empty lantern hook.',
  tunnel_desk: 'A plain desk.',
  tunnel_ledger: 'A shut ledger.',
  tunnel_lamp: 'A small lamp. The flame is still.',
};

function tunnelSave(world, flags) {
  const s = starterSave();
  Object.assign(s.flags, {
    'story.side_pick_done': true,
    'story.heights_path': 'tunnels',
    'story.sm_yard': true,
    'story.early_done': true,
  }, flags || {});
  s.settings.follower = false;
  if (world) s.world = Object.assign({ facing: 'down', respawn: 'fernbrook' }, world);
  return s;
}
async function boot(page, save) {
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
}
const pos = page => page.evaluate(() => ({ map: PixelPets.mapInfo.id, x: PixelPets.state.world.x, y: PixelPets.state.world.y, facing: PixelPets.state.world.facing }));

async function clickTile(page, x, y) {
  await page.waitForFunction(() => !window.PixelPets.fading && document.querySelector('#mapCanvas').width > 0);
  await page.evaluate(([x, y]) => {
    const c = document.querySelector('#mapCanvas'), r = c.getBoundingClientRect(), k = r.width / c.width;
    const cx = r.left + (x * 16 + 8 - PixelPets.walk.cam.x) * k, cy = r.top + (y * 16 + 8 - PixelPets.walk.cam.y) * k;
    const ev = type => c.dispatchEvent(new PointerEvent(type, { clientX: cx, clientY: cy, pointerId: 1, bubbles: true, pointerType: 'mouse', button: 0 }));
    ev('pointerdown'); ev('pointerup');
  }, [x, y]);
}
async function talk(page) {
  await expect.poll(() => page.evaluate(() => document.querySelector('#talkBtn').classList.contains('ready'))).toBe(true);
  await page.locator('#talkBtn').click();
  await expect.poll(() => page.evaluate(() => PixelPets.scene && PixelPets.scene.full ? PixelPets.scene.text : null), { timeout: 5000 }).not.toBeNull();
  const t = await page.evaluate(() => PixelPets.scene.text);
  for (let i = 0; i < 8 && await page.evaluate(() => !!PixelPets.scene); i++) { await page.keyboard.press('Space'); await page.waitForTimeout(40); }
  return t;
}

test('the four rooms keep 18x12, old ids, rock tiles, and a floor under 70%', async ({ page }) => {
  await boot(page, tunnelSave({ map: 'sm_yard', x: 9, y: 9 }, { 'story.sm_freed': true, 'story.sm_look': true, 'story.met_jed': true, 'story.sm_haul': true }));
  const data = await page.evaluate(() => {
    const out = {};
    for (const id of ['sm_yard', 'sm_tunnel', 'sm_hold', 'sm_den']) {
      const m = MAPDATA.heights.maps[id];
      out[id] = { w: m.w, h: m.h, skin: m.skin, variants: m.variants, safe: m.safe, ids: m.objs.map(o => [o.id, o.x, o.y, o.sprite || null]) };
    }
    return { out, cap: PixelPets.devChecks().floorCap, v: PixelPets.state.v, rx: [MAPDATA.heights.maps.rx_f4.w, MAPDATA.heights.maps.rx_f4.h, MAPDATA.heights.maps.rx_f4.skin] };
  });
  expect(data.v).toBe(2);
  expect(data.cap).toEqual([]);
  expect(data.rx).toEqual([14, 22, 'lab']);
  for (const id of ROOMS) {
    expect(data.out[id].w).toBe(18);
    expect(data.out[id].h).toBe(12);
    expect(data.out[id].skin).toBe('tunnel');
    expect(data.out[id].variants).toBe(true);
    expect(data.out[id].safe).toEqual({ x: 9, y: 8 });
    for (const [oid, x, y] of OLD[id]) {
      const hit = data.out[id].ids.find(r => r[0] === oid);
      expect(hit, oid).toEqual([oid, x, y, hit[3]]);
    }
  }
  // lab math is unchanged: the bay still walks 216 cells and stays under the cap
  await page.evaluate(() => PixelPets.goto('rx_f4', 6, 19, 'up'));
  const lab = await page.evaluate(() => ({ share: PixelPets.floorShare('rx_f4'), scuff: PixelPets.tileInfo(2, 2).tile, win: PixelPets.tileInfo(1, 1).tile }));
  expect(lab.share.walk).toBe(216);
  expect(lab.share.share).toBeLessThanOrEqual(0.7);
  expect(lab.scuff).toBe('lab_floor_scuff');
  expect(lab.win).toBe('lab_wall_face');

  for (const id of ROOMS) {
    const r = await page.evaluate((id) => {
      PixelPets.goto(id, 9, 9, 'down');
      const seen = new Set(['9,9']), q = [[9, 9]];
      while (q.length) {
        const [x, y] = q.shift();
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
          if (nx < 0 || ny < 0 || nx >= 18 || ny >= 12 || seen.has(k)) continue;
          if (PixelPets.tileInfo(nx, ny).blocked) continue;
          seen.add(k); q.push([nx, ny]);
        }
      }
      const miss = [];
      for (const o of PixelPets.mapInfo.objs) {
        const k = o.x + ',' + o.y;
        const neigh = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has((o.x + dx) + ',' + (o.y + dy)));
        if (o.block ? !neigh : !seen.has(k)) miss.push(o.id);
      }
      const names = [];
      let bad = null, runs = [];
      const vis = [];
      for (let y = 0; y < 12; y++) {
        const row = [];
        for (let x = 0; x < 18; x++) {
          const t = PixelPets.tileInfo(x, y);
          row.push(t.decal || t.tile);
          if (!String(t.decal || t.tile).startsWith('tunnel_')) bad = (t.decal || t.tile) + ' @' + x + ',' + y;
          if (t.ch === '.' || t.ch === 'Y' || t.ch === '~' || t.ch === '=' || t.ch === 'm') names.push(t.decal || t.tile);
        }
        vis.push(row);
      }
      const scan = (cells) => {
        let n = 1;
        for (let i = 1; i <= cells.length; i++) {
          if (i < cells.length && cells[i] === cells[i - 1]) n++;
          else { if (n > 6) runs.push(n + ' ' + cells[i - 1]); n = 1; }
        }
      };
      vis.forEach(scan);
      for (let x = 0; x < 18; x++) scan(vis.map(row => row[x]));
      const share = PixelPets.floorShare(id);
      const lines = {};
      for (const o of MAPDATA.heights.maps[id].objs) if (o.kind === 'prop' && o.lines && o.lines.else) lines[o.sprite] = o.lines.else;
      return { miss, bad, runs, share, lines, props: PixelPets.mapObjs.filter(o => o.kind === 'prop' && o.art === false).map(o => o.id) };
    }, id);
    expect(r.miss, id).toEqual([]);
    expect(r.bad, id).toBeNull();
    expect(r.runs, id).toEqual([]);
    expect(r.share.share, id).toBeLessThanOrEqual(0.7);
    expect(r.share.walk, id).toBe(144);
    expect(r.props, id).toEqual([]);
    for (const [sprite, line] of Object.entries(r.lines)) {
      expect(LINES[sprite], sprite).toBe(line);
      expect(line.length).toBeLessThanOrEqual(110);
    }
  }
});

test('doors and warps still connect the four rooms, and a shut door keeps its line', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page, tunnelSave({ map: 'sm_yard', x: 9, y: 4, facing: 'up' }));
  await clickTile(page, 9, 3);
  await expect.poll(() => page.evaluate(() => PixelPets.scene && PixelPets.scene.full ? PixelPets.scene.text : '')).toBe('The lookouts are still on the stair.');
  for (let i = 0; i < 6 && await page.evaluate(() => !!PixelPets.scene); i++) { await page.keyboard.press('Space'); await page.waitForTimeout(40); }
  expect(await pos(page)).toMatchObject({ map: 'sm_yard' });
  await page.evaluate(() => {
    PixelPets.setFlag('story.sm_look', true);
    PixelPets.setFlag('story.met_jed', true);
    PixelPets.setFlag('story.sm_haul', true);
    PixelPets.setFlag('story.sm_freed', true);
  });
  await page.evaluate(() => PixelPets.goto('sm_yard', 9, 4, 'up'));
  await clickTile(page, 9, 3);
  await expect.poll(() => pos(page)).toMatchObject({ map: 'sm_tunnel', x: 9, y: 9 });
  await page.evaluate(() => PixelPets.goto('sm_tunnel', 9, 9, 'down'));
  await page.waitForFunction(() => !window.PixelPets.fading);
  await page.keyboard.press('ArrowDown');
  await expect.poll(() => pos(page)).toMatchObject({ map: 'sm_yard', x: 9, y: 4 });
  await page.evaluate(() => PixelPets.goto('sm_yard', 9, 9, 'down'));
  await page.waitForFunction(() => !window.PixelPets.fading);
  await page.keyboard.press('ArrowDown');
  await expect.poll(() => pos(page)).toMatchObject({ map: 'fb_heights', x: 16, y: 6 });
  await page.evaluate(() => PixelPets.goto('sm_tunnel', 14, 4, 'up'));
  await clickTile(page, 14, 3);
  await expect.poll(() => pos(page)).toMatchObject({ map: 'sm_hold', x: 9, y: 9 });
  await page.evaluate(() => PixelPets.goto('sm_hold', 9, 9, 'down'));
  await page.waitForFunction(() => !window.PixelPets.fading);
  await page.keyboard.press('ArrowDown');
  await expect.poll(() => pos(page)).toMatchObject({ map: 'sm_tunnel', x: 14, y: 4 });
  await page.evaluate(() => PixelPets.goto('sm_hold', 14, 4, 'up'));
  await clickTile(page, 14, 3);
  await expect.poll(() => pos(page)).toMatchObject({ map: 'sm_den', x: 9, y: 9 });
  await page.evaluate(() => PixelPets.goto('sm_den', 9, 9, 'down'));
  await page.waitForFunction(() => !window.PixelPets.fading);
  await page.keyboard.press('ArrowDown');
  await expect.poll(() => pos(page)).toMatchObject({ map: 'sm_hold', x: 14, y: 4 });
});

test('each new prop says its line, and an old save on a prop snaps to safe', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page, tunnelSave({ map: 'sm_yard', x: 6, y: 2 }));
  expect(await pos(page)).toMatchObject({ map: 'sm_yard', x: 9, y: 8 });
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
  await boot(page, tunnelSave({ map: 'sm_yard', x: 9, y: 9 }));
  expect(await pos(page)).toMatchObject({ map: 'sm_yard', x: 9, y: 9 });
  const spots = [
    ['sm_yard', 6, 8, 'up', 'A wooden cart. Nothing in it.'],
    ['sm_yard', 6, 3, 'up', 'Crates stacked against the rock.'],
    ['sm_tunnel', 4, 5, 'up', 'A sealed barrel.'],
    ['sm_tunnel', 1, 6, 'up', 'A coil of rope.'],
    ['sm_tunnel', 2, 3, 'up', 'A timber brace in the rock.'],
    ['sm_yard', 1, 3, 'up', 'An empty lantern hook.'],
    ['sm_den', 8, 5, 'up', 'A plain desk.'],
    ['sm_den', 9, 5, 'up', 'A shut ledger.'],
    ['sm_den', 10, 5, 'up', 'A small lamp. The flame is still.'],
  ];
  for (const [map, x, y, f, line] of spots) {
    await page.evaluate(([map, x, y, f]) => PixelPets.goto(map, x, y, f), [map, x, y, f]);
    expect(await talk(page), line).toBe(line);
  }
});
