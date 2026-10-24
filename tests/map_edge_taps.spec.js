/* MAP_EDGE_TAPS P1. A tap past an outdoor edge with an exit walks to that exit.
   Widths are the Playwright projects (320, 375, 390). Modern and arcade both run.
   Players never load this file. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, playScene } = require('./helpers');

trackErrors(test, expect);

const OPEN = {
  'story.phone_got': true,
  'story.early_done': true,
  'story.rival1_done': true,
  'story.hw_reached': true,
  'story.met_glimmerwell': true,
  'story.faded_fuzzwick': true,
  'story.orchard_cleared': true,
  'story.seal1': true,
  'story.route2_end': true,
  'story.cobble_end': true,
  'story.mom_sent': true,
  'story.reached_route1': true,
  'story.reached_route2': true,
  'story.reached_mahopac': true,
  'story.slice_end': true,
  'story.heights_done': true,
  'lantern.guide_heard': true,
};

function edgeSave(flags, follower) {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.follower = !!follower;
  s.settings.music = false;
  s.settings.tips = false;
  Object.assign(s.flags, flags);
  return s;
}

function bundle() {
  function pastOf(ex, edge, p) {
    const along = (edge === 'up' || edge === 'down') ? (ex.x + 0.5) * 16 : (ex.y + 0.5) * 16;
    if (edge === 'up') return { x: along, y: -p };
    if (edge === 'down') return { x: along, y: ex.h * 16 + p };
    if (edge === 'left') return { x: -p, y: along };
    return { x: ex.w * 16 + p, y: along };
  }
  function listExits() {
    const out = [];
    for (const map of Object.keys(window.WORLD)) {
      const m = window.WORLD[map];
      if (!m || m.kind === 'interior' || !m.objs) continue;
      for (const o of m.objs) {
        if (!o || o.kind !== 'warp' || !o.to) continue;
        const edges = [];
        if (o.y <= 2) edges.push('up');
        if (m.h - 1 - o.y <= 2) edges.push('down');
        if (o.x <= 2) edges.push('left');
        if (m.w - 1 - o.x <= 2) edges.push('right');
        if (!edges.length) continue;
        const safe = m.safe || m.start || { x: 4, y: 4 };
        out.push({ id: o.id, map, x: o.x, y: o.y, to: o.to, tx: o.tx, ty: o.ty, edges, w: m.w, h: m.h, sx: safe.x, sy: safe.y });
      }
    }
    return out;
  }
  function ownPast(ex) {
    const hits = [];
    for (const edge of ex.edges) {
      const pt = pastOf(ex, edge, 8);
      hits.push({ edge, pt, hit: PixelPets.exitIntent(pt.x, pt.y) });
    }
    return hits;
  }
  function standFor(ex) {
    const step = { up: [0, 1], down: [0, -1], left: [1, 0], right: [-1, 0] };
    const order = ['down', 'up', 'right', 'left'].filter(e => ex.edges.indexOf(e) >= 0);
    for (const edge of order) {
      const d = step[edge];
      for (let n = 2; n <= 6; n++) {
        const x = ex.x + d[0] * n, y = ex.y + d[1] * n;
        const info = PixelPets.tileInfo(x, y);
        if (!info || info.blocked) continue;
        const busy = PixelPets.mapInfo.objs.some(o => o.x === x && o.y === y && o.kind !== 'decal' && o.kind !== 'trigger');
        if (busy) continue;
        return { x, y };
      }
    }
    return null;
  }
  function canvasPoint(mx, my) {
    const mc = document.querySelector('#mapCanvas');
    const cam = PixelPets.walk.cam;
    const r = mc.getBoundingClientRect();
    const vx = mx - cam.x, vy = my - cam.y;
    if (vx < 2 || vy < 2 || vx > mc.width - 2 || vy > mc.height - 2) return null;
    const clientX = r.left + (vx / mc.width) * r.width;
    const clientY = r.top + (vy / mc.height) * r.height;
    if (clientX < 1 || clientY < 1 || clientX > window.innerWidth - 1 || clientY > window.innerHeight - 1) return null;
    const hit = document.elementFromPoint(clientX, clientY);
    if (!hit || hit.id !== 'mapCanvas') return null;
    return { mx, my, clientX, clientY };
  }
  function findTap(ex) {
    const W = PixelPets.mapInfo.w, H = PixelPets.mapInfo.h;
    function screen(mx, my) {
      const spot = canvasPoint(mx, my);
      if (!spot) return null;
      const aim = PixelPets.exitIntent(mx, my);
      if (!aim || aim.id !== ex.id) return null;
      const tx = Math.floor(mx / 16), ty = Math.floor(my / 16);
      const onMap = tx >= 0 && ty >= 0 && tx < W && ty < H;
      if (onMap && !PixelPets.tileInfo(tx, ty).blocked) return null;
      if (onMap && PixelPets.mapInfo.objs.some(o => o.x === tx && o.y === ty && o.kind !== 'warp' && o.kind !== 'decal' && o.kind !== 'trigger' && o.kind !== 'pickup')) return null;
      return Object.assign(spot, { tx, ty });
    }
    for (const edge of ex.edges) {
      for (const p of [4, 8, 12]) {
        const pt = pastOf(ex, edge, p);
        const s = screen(pt.x, pt.y);
        if (s) return Object.assign(s, { kind: 'past' });
      }
    }
    for (let ty = ex.y - 2; ty <= ex.y + 2; ty++) {
      for (let tx = ex.x - 3; tx <= ex.x + 3; tx++) {
        for (const oy of [8, 14, 2]) {
          const s = screen(tx * 16 + 8, ty * 16 + oy);
          if (s) return Object.assign(s, { kind: 'solid' });
        }
      }
    }
    return null;
  }
  window.__met = { listExits, ownPast, standFor, canvasPoint, findTap };
}

async function boot(page, flags, follower) {
  await installSave(page.context(), edgeSave(flags, follower), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForFunction(() => document.querySelector('#mapCanvas').width > 0);
  await page.evaluate(bundle);
}

async function setMode(page, mode) {
  await page.evaluate(m => PixelPets.applyCtl(m, false), mode);
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
}

async function place(page, map, x, y, facing) {
  const res = await page.evaluate(({ map, x, y, facing }) => {
    if (PixelPets.scene) return { ok: false, why: 'scene', text: PixelPets.scene.text };
    PixelPets.clearWild();
    const g = PixelPets.goto(map, x, y, facing || 'down');
    PixelPets.clearWild();
    const sc = PixelPets.scene;
    const w = PixelPets.state.world;
    return { ok: !!g, why: g ? '' : 'goto', text: sc && sc.text, map: w.map, x: w.x, y: w.y };
  }, { map, x, y, facing });
  if (!res.ok || res.text) throw new Error('place ' + map + ' ' + x + ',' + y + ' ' + JSON.stringify(res));
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
}

async function snap(page) {
  return page.evaluate(() => {
    const w = PixelPets.state.world, k = PixelPets.walk;
    const toast = document.querySelector('#toast');
    return {
      map: w.map, x: w.x, y: w.y,
      fade: !!PixelPets.fading,
      scene: (PixelPets.scene && PixelPets.scene.text) || '',
      battle: !!(PixelPets.battle && PixelPets.battle.on),
      moving: !!(k.path || k.target || k.to),
      toast: (toast && toast.textContent) || '',
    };
  });
}

async function until(page, pred, ms) {
  const t0 = Date.now();
  let last;
  while (Date.now() - t0 < ms) {
    last = await snap(page);
    if (last.battle) throw new Error('battle ' + JSON.stringify(last));
    if (pred(last)) return last;
    await page.waitForTimeout(40);
  }
  throw new Error('timeout ' + JSON.stringify(last));
}

async function fire(page, tap) {
  await page.evaluate(tap => {
    const mc = document.querySelector('#mapCanvas');
    const opt = { bubbles: true, cancelable: true, clientX: tap.clientX, clientY: tap.clientY, pointerId: 1, pointerType: 'touch', isPrimary: true };
    mc.dispatchEvent(new PointerEvent('pointerdown', opt));
    mc.dispatchEvent(new PointerEvent('pointerup', opt));
  }, tap);
}

test('T1 a tap aimed at an edge exit takes that exit', async ({ page }) => {
  test.setTimeout(300000);
  await boot(page, OPEN);
  const exits = await page.evaluate(() => window.__met.listExits());
  expect(exits.length).toBeGreaterThanOrEqual(29);
  for (const mode of ['modern', 'arcade']) {
    await setMode(page, mode);
    const half = await page.evaluate(() => {
      const z = PixelPets.mapInfo.scale || 1;
      return Math.max(2.5 * 16, 22 / z) * z;
    });
    expect(half, mode + ' funnel half').toBeGreaterThanOrEqual(22);
    let real = 0;
    const liveIds = [];
    for (const ex of exits) {
      await place(page, ex.map, ex.sx, ex.sy);
      const hits = await page.evaluate(ex => window.__met.ownPast(ex), ex);
      const owned = hits.filter(h => h.hit && h.hit.id === ex.id && h.hit.x === ex.x && h.hit.y === ex.y);
      if (!owned.length) continue;
      expect(owned.length, mode + ' ' + ex.id + ' ' + JSON.stringify(hits)).toBe(ex.edges.length);
      liveIds.push(ex.id);
      const stand = await page.evaluate(ex => window.__met.standFor(ex), ex);
      if (!stand) continue;
      await place(page, ex.map, stand.x, stand.y);
      const path = await page.evaluate(ex => PixelPets.findPath([{ x: ex.x, y: ex.y }]), ex);
      if (!path) continue;
      const tap = await page.evaluate(ex => window.__met.findTap(ex), ex);
      if (!tap) continue;
      await fire(page, tap);
      const end = await until(page, s => s.map === ex.to && !s.fade && !s.moving && !s.scene, 12000);
      expect(end.map, mode + ' ' + ex.id).toBe(ex.to);
      real++;
    }
    expect(liveIds.length, mode).toBeGreaterThanOrEqual(29);
    expect(real, mode + ' on-screen warps').toBeGreaterThan(0);

    await page.evaluate(() => PixelPets.setFlag('story.mom_sent', false));
    await place(page, 'hearthmoor', 9, 6, 'up');
    const gateRead = await page.evaluate(() => {
      const pt = { x: (9 + 0.5) * 16, y: -8 };
      return PixelPets.exitIntent(pt.x, pt.y);
    });
    expect(gateRead, mode + ' gated read').toEqual({ id: 'hm_north', x: 9, y: 2 });
    const gateTap = await page.evaluate(() => {
      const ids = ['hm_north', 'hm_north_w', 'hm_north_e'];
      for (const id of ids) {
        const hit = window.__met.findTap({ id, x: id === 'hm_north_w' ? 8 : id === 'hm_north_e' ? 10 : 9, y: 2, edges: ['up'], w: 24, h: 24 });
        if (hit) return hit;
      }
      return null;
    });
    if (gateTap) {
      await fire(page, gateTap);
      const end = await until(page, s => s.map === 'hearthmoor' && !s.fade && s.scene.indexOf('Not today') >= 0, 12000);
      expect(end.map).toBe('hearthmoor');
      expect(end.x).toBe(9);
      expect(end.y).toBe(3);
      await playScene(page);
    }
    await page.evaluate(() => PixelPets.setFlag('story.mom_sent', true));
  }
  const save = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  expect(save.v).toBe(2);
  expect(save.exitIntent).toBeUndefined();
});

test('T2 a free tile beside an exit is still that tile', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page, OPEN);
  for (const mode of ['modern', 'arcade']) {
    await setMode(page, mode);
    await place(page, 'fernbrook', 5, 8, 'left');
    // The right side of the tile stays off the quest cue. At 3x the cue covers the tile's left pixels.
    const tap = await page.evaluate(() => window.__met.canvasPoint(2 * 16 + 14, 8 * 16 + 8) || window.__met.canvasPoint(2 * 16 + 8, 8 * 16 + 8));
    expect(tap, mode).toBeTruthy();
    await fire(page, tap);
    const end = await until(page, s => !s.fade && !s.moving && s.x === 2 && s.y === 8, 8000);
    expect(end).toMatchObject({ map: 'fernbrook', x: 2, y: 8, scene: '' });
    await page.keyboard.press('ArrowRight');
    const stepped = await until(page, s => s.x === 3 && s.y === 8 && !s.moving, 4000);
    expect(stepped.map).toBe('fernbrook');
    expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
  }
});

test('T3 an edge with no exit walks to a nearby free tile', async ({ page }) => {
  test.setTimeout(90000);
  await boot(page, OPEN);
  for (const mode of ['modern', 'arcade']) {
    await setMode(page, mode);
    await place(page, 'hw_falls', 11, 1, 'up');
    const read = await page.evaluate(() => PixelPets.exitIntent((11 + 0.5) * 16, -8));
    expect(read, mode).toBeNull();
    let top = await page.evaluate(() => {
      for (const p of [4, 8, 12]) {
        const hit = window.__met.canvasPoint((11 + 0.5) * 16, -p);
        if (hit) return hit;
      }
      return null;
    });
    if (!top) {
      await place(page, 'hw_falls', 11, 0, 'down');
      top = await page.evaluate(() => {
        for (let ty = 0; ty <= 2; ty++) for (let tx = 8; tx <= 14; tx++) {
          const info = PixelPets.tileInfo(tx, ty);
          if (!info || !info.blocked) continue;
          if (PixelPets.mapInfo.objs.some(o => o.x === tx && o.y === ty && o.kind !== 'decal')) continue;
          const hit = window.__met.canvasPoint(tx * 16 + 8, ty * 16 + 8) || window.__met.canvasPoint(tx * 16 + 8, ty * 16 + 14);
          if (hit) return hit;
        }
        return null;
      });
    }
    expect(top, mode + ' top edge').toBeTruthy();
    await fire(page, top);
    const end = await until(page, s => !s.fade && !s.moving && s.map === 'hw_falls' && (s.y === 0 || s.y === 1), 8000);
    expect(end.map).toBe('hw_falls');
    expect(end.scene).toBe('');

    const pocket = await page.evaluate(() => {
      const w = PixelPets.mapInfo.w, h = PixelPets.mapInfo.h;
      for (let y = 3; y < h - 3; y++) for (let x = 3; x < w - 3; x++) {
        if (!PixelPets.tileInfo(x, y).blocked) continue;
        const neigh = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        if (!neigh.every(([dx, dy]) => PixelPets.tileInfo(x + dx, y + dy).blocked)) continue;
        return { x, y };
      }
      return null;
    });
    expect(pocket, mode).toBeTruthy();
    let stood = false;
    for (let dy = -6; dy <= 6 && !stood; dy++) for (let dx = -6; dx <= 6 && !stood; dx++) {
      const x = pocket.x + dx, y = pocket.y + dy;
      const free = await page.evaluate(({ x, y }) => {
        const info = PixelPets.tileInfo(x, y);
        return !!(info && !info.blocked);
      }, { x, y });
      if (!free) continue;
      await place(page, 'hw_falls', x, y, 'down');
      const tap = await page.evaluate(p => window.__met.canvasPoint(p.x * 16 + 8, p.y * 16 + 8), pocket);
      if (!tap) continue;
      const before = await snap(page);
      await fire(page, tap);
      await page.waitForTimeout(200);
      const after = await snap(page);
      expect(after.toast, mode).toBe("Can't get there from here.");
      expect(after.map).toBe('hw_falls');
      expect(after.x).toBe(before.x);
      expect(after.y).toBe(before.y);
      stood = true;
    }
    expect(stood, mode + ' interior wall').toBe(true);
  }
});

test('T4 rubble on the east edge stops on the tile in front', async ({ page }) => {
  test.setTimeout(60000);
  const flags = Object.assign({}, OPEN);
  delete flags['story.seal1'];
  await boot(page, flags);
  for (const mode of ['modern', 'arcade']) {
    await setMode(page, mode);
    await place(page, 'fernbrook', 28, 8, 'right');
    const read = await page.evaluate(() => PixelPets.exitIntent(32 * 16 + 8, 8 * 16 + 8));
    expect(read, mode).toBeNull();
    const tap = await page.evaluate(() => window.__met.canvasPoint(31 * 16 + 8, 8 * 16 + 8) || window.__met.canvasPoint(31 * 16 + 4, 8 * 16 + 8));
    expect(tap, mode).toBeTruthy();
    await fire(page, tap);
    const end = await until(page, s => !s.fade && !s.moving && s.x === 30 && s.y === 8, 8000);
    expect(end).toMatchObject({ map: 'fernbrook', x: 30, y: 8, scene: '' });
  }
});

test('T5 the nearer exit wins, and an equal tap uses the tie break', async ({ page }) => {
  test.setTimeout(90000);
  await boot(page, OPEN);
  for (const mode of ['modern', 'arcade']) {
    await setMode(page, mode);
    await place(page, 'cobble_quarry', 8, 16, 'down');
    const picked = await page.evaluate(() => {
      let nearer = null, tie = null, bestGap = Infinity, best = null;
      const west = { x: 0.5 * 16, y: 17.5 * 16 }, south = { x: 16.5 * 16, y: 19.5 * 16 };
      for (let y = 16 * 16; y <= 28 * 16; y += 4) {
        for (let x = -32; x <= 24 * 16; x += 4) {
          const hit = PixelPets.exitIntent(x, y);
          if (!hit || (hit.id !== 'q_west' && hit.id !== 'q_south')) continue;
          const dw = Math.hypot(x - west.x, y - west.y);
          const ds = Math.hypot(x - south.x, y - south.y);
          const gap = Math.abs(dw - ds);
          if (gap < bestGap) { bestGap = gap; best = { x, y, id: hit.id, dw, ds, gap }; }
          if (gap <= 2 && !tie) tie = { x, y, id: hit.id, dw, ds, gap };
          if (!nearer && Math.min(dw, ds) + 16 < Math.max(dw, ds)) nearer = { x, y, id: hit.id, dw, ds };
        }
      }
      return { nearer, tie, best, bestGap };
    });
    expect(picked.nearer, mode + ' nearer').toBeTruthy();
    expect(picked.nearer.id === 'q_west' || picked.nearer.id === 'q_south').toBe(true);
    const nearerIsWest = picked.nearer.dw < picked.nearer.ds;
    expect(picked.nearer.id, mode).toBe(nearerIsWest ? 'q_west' : 'q_south');
    expect(picked.tie, mode + ' ' + JSON.stringify(picked.best)).toBeTruthy();
    expect(picked.tie.id, mode + ' residual tie').toBe('q_west');
    const aim = picked.nearer.id === 'q_west'
      ? { id: 'q_west', x: 0, y: 17, to: 'hw_rim', edges: ['left', 'down'] }
      : { id: 'q_south', x: 16, y: 19, to: 'cobblecrest', edges: ['down'] };
    let stand = await page.evaluate(ex => window.__met.standFor(ex), { id: aim.id, x: aim.x, y: aim.y, edges: aim.edges, w: 32, h: 20 });
    if (!stand) stand = { x: 8, y: 16 };
    await place(page, 'cobble_quarry', stand.x, stand.y);
    const tap = await page.evaluate(ex => window.__met.findTap(ex), { id: aim.id, x: aim.x, y: aim.y, edges: aim.edges, w: 32, h: 20 });
    if (tap) {
      const aimNow = await page.evaluate(pt => PixelPets.exitIntent(pt.x, pt.y), picked.nearer);
      expect(aimNow.id).toBe(aim.id);
      await fire(page, tap);
      const end = await until(page, s => s.map === aim.to && !s.fade && !s.moving && !s.scene, 12000);
      expect(end.map, mode).toBe(aim.to);
    }
  }
});

test('T6 a chip, a person, a sign, the follower and a wild still win', async ({ page }) => {
  test.setTimeout(120000);
  await boot(page, OPEN, true);
  for (const mode of ['modern', 'arcade']) {
    await setMode(page, mode);
    await place(page, 'fernbrook', 8, 8, 'left');
    await page.evaluate(() => PixelPets.cueForce({ x: 40, y: 8 }));
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    const chip = await page.evaluate(() => {
      const ch = PixelPets.cueChip();
      if (!ch || !ch.box) return null;
      const mc = document.querySelector('#mapCanvas');
      const r = mc.getBoundingClientRect();
      const clientX = r.left + ch.box.x + ch.box.w / 2;
      const clientY = r.top + ch.box.y + ch.box.h / 2;
      const hit = document.elementFromPoint(clientX, clientY);
      if (!hit || hit.id !== 'mapCanvas') return null;
      return { clientX, clientY };
    });
    if (!chip) {
      const why = await page.evaluate(() => {
        const ch = PixelPets.cueChip();
        return { ch, id: PixelPets.mapInfo.id, x: PixelPets.state.world.x, y: PixelPets.state.world.y };
      });
      throw new Error(mode + ' cue ' + JSON.stringify(why));
    }
    const before = await snap(page);
    await fire(page, chip);
    await expect(page.locator('#ovQuest')).toBeVisible();
    const after = await snap(page);
    expect(after.x).toBe(before.x);
    expect(after.y).toBe(before.y);
    expect(after.map).toBe('fernbrook');
    await expect.poll(() => page.evaluate(() => PixelPets.optionsReady)).toBe(true);
    await page.locator('#questClose').click();
    await expect(page.locator('#ovQuest')).toBeHidden();

    await place(page, 'fernbrook', 4, 7, 'left');
    const sign = await page.evaluate(() => window.__met.canvasPoint(2 * 16 + 8, 7 * 16 + 8) || window.__met.canvasPoint(2 * 16 + 12, 7 * 16 + 12));
    expect(sign, mode + ' sign').toBeTruthy();
    await fire(page, sign);
    const signEnd = await until(page, s => s.scene.indexOf('FERNBROOK') >= 0, 8000);
    expect(signEnd.map).toBe('fernbrook');
    await playScene(page);

    await place(page, 'fernbrook', 25, 9, 'right');
    const npc = await page.evaluate(() => window.__met.canvasPoint(27 * 16 + 8, 9 * 16 + 8));
    expect(npc, mode + ' person').toBeTruthy();
    await fire(page, npc);
    const talk = await until(page, s => s.scene.indexOf('brighter today') >= 0, 8000);
    expect(talk.map).toBe('fernbrook');
    await playScene(page);

    await place(page, 'fernbrook', 2, 7, 'down');
    const fol = await page.evaluate(() => {
      const f = PixelPets.follower;
      return f && f.x != null ? { x: f.x, y: f.y, tap: window.__met.canvasPoint(f.x * 16 + 8, f.y * 16 + 8) } : null;
    });
    expect(fol && fol.tap, mode + ' follower').toBeTruthy();
    expect(Math.abs(fol.x - 0) + Math.abs(fol.y - 8)).toBeLessThanOrEqual(4);
    const held = await snap(page);
    await fire(page, fol.tap);
    await expect(page.locator('#careTray')).toBeVisible();
    const still = await snap(page);
    expect(still.x).toBe(held.x);
    expect(still.y).toBe(held.y);
    expect(still.map).toBe('fernbrook');
    await page.locator('#ctClose').click();
    await expect(page.locator('#careTray')).toBeHidden();

    await place(page, 'fernbrook', 3, 8, 'left');
    const wild = await page.evaluate(() => {
      PixelPets.clearWild();
      const w = PixelPets.spawnWild(0, 0, 1, 8);
      const tap = window.__met.canvasPoint(1 * 16 + 8, 8 * 16 + 8);
      if (!tap) return { spawned: !!w, on: false, path: null, target: null, map: PixelPets.state.world.map };
      const mc = document.querySelector('#mapCanvas');
      const opt = { bubbles: true, cancelable: true, clientX: tap.clientX, clientY: tap.clientY, pointerId: 1, pointerType: 'touch', isPrimary: true };
      mc.dispatchEvent(new PointerEvent('pointerdown', opt));
      mc.dispatchEvent(new PointerEvent('pointerup', opt));
      const out = { spawned: !!w, on: !!tap, path: PixelPets.walk.path, target: PixelPets.walk.target && { x: PixelPets.walk.target.x, y: PixelPets.walk.target.y }, map: PixelPets.state.world.map };
      PixelPets.clearWild();
      PixelPets.walk.target = null;
      return out;
    });
    expect(wild.spawned, mode).toBe(true);
    expect(wild.on, mode).toBe(true);
    expect(wild.path).toBeFalsy();
    expect(wild.target).toEqual({ x: 1, y: 8 });
    expect(wild.map).toBe('fernbrook');

    await place(page, 'fernbrook', 6, 7, 'up');
    const door = await page.evaluate(() => window.__met.canvasPoint(5 * 16 + 8, 5 * 16 + 8) || window.__met.canvasPoint(5 * 16 + 8, 6 * 16 + 8));
    expect(door, mode + ' door').toBeTruthy();
    await fire(page, door);
    const doorEnd = await until(page, s => !s.fade && !s.moving && s.map !== 'fernbrook', 8000);
    expect(doorEnd.map, mode).toBe('fb_lantern_in');
    expect(doorEnd.scene).toBe('');
  }
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});
