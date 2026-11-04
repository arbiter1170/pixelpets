/* GLIMMERWELL_VEHICLES_BUILDINGS v0.1 (handoff/specs/GLIMMERWELL_VEHICLES_BUILDINGS.md, D1333-D1347).
   The Courtesy Cruiser, the Sky Concierge and four Glimmerwell buildings, on the ?debug=1 preview lot only (D1342).
   Widths are the Playwright projects (320, 375, 390). Reduced motion, zero console errors (trackErrors), and the save:
   nothing is written while the lot is open, and leaving puts the state back as it was (pixelpets.save.v2, v 2, no field). */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');
const { stubCloudSdk } = require('./cloud_stub');

trackErrors(test, expect);

const HOLDS = ['split', 'keepers', 'glimmer'];
const KEEPER_MARKS = ['gw_badge_slip', 'gw_door_shut', 'gw_relay_mast_off', 'gw_swap_stall_shut'];
const BANNED = /\b(chips?|tuning|tuned|implants?|trainers?|coins?|gyms?|fainted|evolve[sd]?|appeared|bellgold)\b|dex\b/i;

async function boot(page, search) {
  const save = starterSave();
  save.settings.follower = false;
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page, search == null ? '?debug=1' : search);
  await page.waitForTimeout(300);
  return save;
}
const open = (page, hold) => page.evaluate(h => window.PixelPets.fleetPreview(h), hold);
const state = page => page.evaluate(() => window.PixelPets.fleetState());

// Breadth-first walk on the lot: walkable tiles, minus every blocking object (npc, sign, prop).
function reach(layout, from) {
  const walk = ch => 'gp'.indexOf(ch) >= 0, block = new Set(layout.objs.filter(o => ['npc', 'sign', 'prop'].includes(o.kind)).map(o => o.x + ',' + o.y));
  const H = layout.grid.length, W = layout.grid[0].length, seen = new Set([from.x + ',' + from.y]), q = [from];
  while (q.length) {
    const c = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = c.x + dx, y = c.y + dy, k = x + ',' + y;
      if (x < 0 || y < 0 || x >= W || y >= H || seen.has(k) || !walk(layout.grid[y][x]) || block.has(k)) continue;
      seen.add(k); q.push({ x, y });
    }
  }
  return seen;
}

test('off in normal play: no preview, no art, no lot without ?debug=1', async ({ page }) => {
  await boot(page, '');
  const r = await page.evaluate(() => ({
    debug: window.PixelPets.debug,
    open: window.PixelPets.fleetPreview ? window.PixelPets.fleetPreview('split') : 'none',
    st: window.PixelPets.fleetState ? window.PixelPets.fleetState() : 'none',
    fleet: window.PPFleet.state().open,
    faction: window.PixelPets.townFaction('gw_preview'),
    map: JSON.parse(localStorage.getItem('pixelpets.save.v2')).world.map,
  }));
  expect(r.debug).toBe(false);
  expect(r.open).toBe(false);
  expect(r.st).toBe(null);
  expect(r.fleet).toBe(false);
  expect(r.faction).toBe(null);
  expect(r.map).toBe('hearthmoor');
});

test('each hold builds the lot it specs; vehicles never block a path and every door, sign and person is reachable', async ({ page }) => {
  await boot(page);
  const seen = {};
  for (const hold of HOLDS) {
    const r = await open(page, hold);
    expect(r && r.open, hold).toBe(true);
    await page.waitForTimeout(250);
    const st = await state(page);
    const L = st.layout, ids = L.objs.map(o => o.id);
    seen[hold] = { ids, vehicles: st.vehicles.map(v => v.id), faction: await page.evaluate(() => window.PixelPets.townFaction('gw_preview')) };
    expect(await page.evaluate(() => window.PixelPets.keeper && JSON.parse(JSON.stringify(window.PixelPets.state.world)).map)).toBe('gw_preview');
    // one tile per object (decals sit on walls and may share none)
    const tiles = L.objs.filter(o => o.kind !== 'decal').map(o => o.x + ',' + o.y);
    expect(new Set(tiles).size, hold + ' no shared tiles').toBe(tiles.length);
    // nobody stands on a wall, a roof or a tree
    for (const o of L.objs.filter(o => ['npc', 'sign', 'prop', 'warp', 'door'].includes(o.kind))) expect('gp'.indexOf(L.grid[o.y][o.x]), hold + ' ' + o.id + ' floor').toBeGreaterThanOrEqual(0);
    // reachable: the exit, each door tile, and a neighbour of every person, sign and prop
    const R = reach(L, { x: 12, y: 12 });
    for (const o of L.objs) {
      if (o.kind === 'decal') continue;
      if (o.kind === 'door' || o.kind === 'warp') { expect(R.has(o.x + ',' + o.y), hold + ' ' + o.id).toBe(true); continue; }
      const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => R.has((o.x + dx) + ',' + (o.y + dy)));
      expect(near, hold + ' ' + o.id + ' reachable').toBe(true);
    }
    // the road stays open end to end, and the air units have no blocking cells
    for (let x = 1; x <= 24; x++) expect(R.has(x + ',8'), hold + ' road ' + x).toBe(true);
    // air units add no object at all (they fly over whatever is below); the tile under the hover is open floor
    expect(ids.filter(id => /concierge|air/.test(id)), hold + ' air objects').toEqual([]);
    if (hold !== 'keepers') expect(R.has('16,12'), hold + ' under the hover').toBe(true);
    // faction-aligned civilians: four, no rank in the name
    const people = L.objs.filter(o => o.kind === 'npc' && o.look);
    expect(people.map(o => o.name).sort()).toEqual(['Bay Attendant', 'Mast Tech', 'Receptionist', 'Swap Clerk']);
  }
  expect(seen.split.vehicles).toEqual(['cruiser_a', 'cruiser_b', 'concierge', 'concierge_pass']);
  expect(seen.glimmer.vehicles).toEqual(['cruiser_a', 'cruiser_b', 'concierge', 'concierge_pass']);
  expect(seen.keepers.vehicles).toEqual([]);
  expect(seen.split.faction).toBe('glimmer');
  expect(seen.glimmer.faction).toBe('glimmer');
  expect(seen.keepers.faction).toBe('keepers');
  expect(seen.keepers.ids).toContain('gw_clinic_shut');
  expect(seen.keepers.ids).not.toContain('gw_cruiser_b1');
  expect(seen.split.ids).toContain('gw_cruiser_b1');
  expect(seen.glimmer.ids).toEqual(expect.arrayContaining(['gw_banner_w', 'gw_banner_e', 'gw_queue']));
  expect(seen.split.ids).not.toContain('gw_banner_w');
  await page.evaluate(() => window.PixelPets.fleetExit());
});

test('the save is not written while the lot is open, and leaving restores it (v 2, no new field)', async ({ page }) => {
  await boot(page);
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')).debugSave === true, null, { timeout: 15000 }).catch(() => {});
  const before = await page.evaluate(() => ({ raw: localStorage.getItem('pixelpets.save.v2'), live: JSON.parse(JSON.stringify(window.PixelPets.state)) }));
  for (const hold of HOLDS) { await open(page, hold); await page.waitForTimeout(300); }
  await page.evaluate(() => window.PixelPets.talkTo('gw_receptionist'));
  await page.waitForTimeout(200);
  const during = await page.evaluate(() => localStorage.getItem('pixelpets.save.v2'));
  expect(during).toBe(before.raw);
  await page.keyboard.press('Space'); await page.keyboard.press('Space');
  await page.waitForFunction(() => !window.PixelPets.scene);
  expect(await page.evaluate(() => window.PixelPets.fleetExit())).toBe(true);
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => ({ raw: JSON.parse(localStorage.getItem('pixelpets.save.v2')), open: window.PixelPets.fleetState().open }));
  expect(after.open).toBe(false);
  const strip = s => { const c = JSON.parse(JSON.stringify(s)); delete c.last; for (const p of c.party || []) { delete p.hunger; delete p.happy; delete p.energy; } return c; };
  expect(after.raw.v).toBe(2);
  expect(Object.keys(after.raw).sort()).toEqual(Object.keys(before.live).sort());
  expect(strip(after.raw)).toEqual(strip(before.live));
  expect(after.raw.world.map).toBe('hearthmoor');
  expect(JSON.stringify(after.raw)).not.toContain('gw_preview');
});

// The lot holds the cloud save too: while it is open the cloud state hook gives null, no upload fires, and no upload ever
// carries world.map 'gw_preview'. Normal play uploads before and after. The real cloud.js, a stubbed SDK; nothing signs in.
test('the cloud save never sees the lot: the state hook gives null, no upload while open, none with gw_preview', async ({ page }) => {
  test.setTimeout(60000);
  await stubCloudSdk(page);
  await boot(page, '?debug=1&cloud=block');
  await page.waitForFunction(() => (window.__ppUploads || []).length >= 1 && !PPCloud.info().inflight && !!window.__ppCloudHooks, null, { timeout: 25000 });
  const n = await page.evaluate(() => window.__ppUploads.length);
  for (const hold of HOLDS) { expect(await open(page, hold)).toBeTruthy(); await page.waitForTimeout(200); }
  await page.evaluate(() => window.PixelPets.goto('gw_preview', 12, 11, 'up'));
  await page.waitForTimeout(300);
  await page.evaluate(() => PPCloud.syncNow());
  await page.evaluate(() => PPCloud.syncNow());
  await page.waitForTimeout(600);
  const during = await page.evaluate(() => ({ map: window.PixelPets.state.world.map, state: window.__ppCloudHooks.getState(), uploads: window.__ppUploads.slice() }));
  expect(during.map).toBe('gw_preview');
  expect(during.state, 'getState gives null while the lot is open').toBeNull();
  expect(during.uploads.length, 'no upload while the lot is open').toBe(n);
  expect(await page.evaluate(() => window.PixelPets.fleetExit())).toBe(true);
  await page.waitForTimeout(300);
  // Back in normal play the cloud picks up again: a real change uploads, from Hearthmoor.
  await page.evaluate(() => { window.PixelPets.state.money += 7; return PPCloud.syncNow(); });
  await expect.poll(() => page.evaluate(() => window.__ppUploads.length), { timeout: 10000 }).toBeGreaterThan(n);
  const all = await page.evaluate(() => window.__ppUploads);
  expect(all.map(u => u.map)).not.toContain('gw_preview');
  expect(all[all.length - 1].map).toBe('hearthmoor');
});

test('the exit path leaves the lot and restores the save the same way', async ({ page }) => {
  await boot(page);
  await open(page, 'glimmer');
  await page.evaluate(() => window.PixelPets.goto('gw_preview', 12, 13, 'down'));
  await page.waitForTimeout(200);
  await page.evaluate(() => window.PixelPets.walkStep('down'));
  await page.waitForFunction(() => window.PixelPets.state.world.map === 'hearthmoor', null, { timeout: 5000 });
  await page.waitForTimeout(400);
  const r = await page.evaluate(() => ({ open: window.PixelPets.fleetState().open, raw: localStorage.getItem('pixelpets.save.v2') }));
  expect(r.open).toBe(false);
  expect(r.raw).not.toContain('gw_preview');
});

test('reduced motion parks every vehicle on frame 0 and drops the fly-by', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await boot(page);
  await open(page, 'split');
  const a = await state(page);
  await page.waitForTimeout(1200);
  const b = await state(page);
  for (const st of [a, b]) {
    const v = Object.fromEntries(st.vehicles.map(x => [x.id, x]));
    expect(v.cruiser_a).toMatchObject({ x: 3, y: 9, moving: false, shown: true });
    expect(v.cruiser_b).toMatchObject({ x: 20, y: 7, moving: false });
    expect(v.concierge).toMatchObject({ bob: 0, flying: false, shown: true });
    expect(v.concierge_pass.shown).toBe(false);
  }
  await page.evaluate(() => window.PixelPets.fleetExit());
});

test('motion on: Cruiser A patrols the road and the fly-by crosses the lot', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await boot(page);
  await open(page, 'split');
  const r = await page.evaluate(() => {
    const vs = window.PPFleet.vehicles('split'), a = vs.find(v => v.id === 'cruiser_a'), p = vs.find(v => v.id === 'concierge_pass');
    const at = t => window.PPFleet.posOf(a, t), pass = t => window.PPFleet.posOf(p, t);
    return { s0: at(0), mid: at(3000), far: at(7400), back: at(12000), p0: pass(100), p1: pass(2900), p2: pass(5000) };
  });
  expect(r.s0).toMatchObject({ x: 1, y: 9, facing: 'right', moving: true });
  expect(r.mid.x).toBeGreaterThan(1); expect(r.mid.x).toBeLessThan(21);
  expect(r.far).toMatchObject({ x: 21, moving: false });
  expect(r.back.facing).toBe('left');
  expect(r.p0.shown && r.p1.shown).toBe(true);
  expect(r.p1.x).toBeGreaterThan(r.p0.x);
  expect(r.p2.shown).toBe(false);
  await page.evaluate(() => window.PixelPets.fleetExit());
});

test('art is PAL only, black and red, crimson under 10% of each figure, and the Cruiser reads unlike a Watch Coach', async ({ page }) => {
  await boot(page);
  await open(page, 'split');
  const r = await page.evaluate(() => {
    const pal = new Set(Object.values(PAL)), out = {};
    for (const name of window.PixelPets.fleetState().art) {
      const fr = window.PixelPets.artTally(name);
      out[name] = fr ? fr.map(t => ({ n: Object.values(t).reduce((a, b) => a + b, 0), q: t['#c81818'] || 0, cols: Object.keys(t), bad: Object.keys(t).filter(h => !pal.has(h)) })) : null;
    }
    const box = rows => { let x0 = 99, x1 = -1, y0 = 99, y1 = -1; rows.forEach((r, y) => [...r].forEach((c, x) => { if (c !== '.') { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } })); return { w: x1 - x0 + 1, h: y1 - y0 + 1 }; };
    return { out, cruiser: box(GW_ART.gw_cruiser[0]), air: box(GW_ART.gw_concierge[0]) };
  });
  for (const [name, frames] of Object.entries(r.out)) {
    expect(frames, name).not.toBe(null);
    for (const f of frames) {
      expect(f.bad, name + ' off-palette').toEqual([]);
      expect(f.q / f.n, name + ' crimson share').toBeLessThan(0.1);
      expect(f.cols, name + ' Keeper green').not.toContain('#38b764');
      // the Keepers-hold pieces (slips, shutter, cloth) are the Keepers' own marks: their green tape is allowed there only
      if (!KEEPER_MARKS.includes(name)) expect(f.cols, name + ' Keeper deep green').not.toContain('#2f5a3e');
    }
  }
  for (const k of ['gw_cruiser', 'gw_cruiser_move', 'gw_concierge', 'gw_swap_stall', 'gw_relay_mast', 'gw_banner', 'gw_badge', 'wall_gw_panel']) {
    expect(r.out[k][0].cols, k + ' soot').toContain('#18140f');
  }
  // Watch Coach draft (POST_TRIAL_CRACKDOWN §10): about 30 wide by 30 tall, on wheels. The Cruiser is long and low.
  expect(r.cruiser.w).toBeGreaterThanOrEqual(40);
  expect(r.cruiser.h).toBeLessThanOrEqual(16);
  expect(r.cruiser.w / r.cruiser.h).toBeGreaterThan(2.5);
  expect(r.air.h).toBeLessThanOrEqual(12);
  await page.evaluate(() => window.PixelPets.fleetExit());
});

test('player text: placeholder lines stay short and clean (no chip, Tuning or banned words)', async ({ page }) => {
  await boot(page);
  await open(page, 'split');
  const texts = await page.evaluate(() => {
    const out = [];
    const walk = v => { if (typeof v === 'string') out.push(v); else if (v && typeof v === 'object') Object.values(v).forEach(walk); };
    walk(window.PPFleet.lines());
    for (const hold of ['split', 'keepers', 'glimmer']) {
      window.PixelPets.fleetPreview(hold);
      for (const o of window.PixelPets.fleetState().layout.objs) walk(o.name);
    }
    return out.filter(Boolean);
  });
  expect(texts.length).toBeGreaterThan(20);
  for (const s of texts) {
    expect(s.length, s).toBeLessThanOrEqual(110);
    expect(s, s).not.toMatch(BANNED);
    expect(s, s).not.toMatch(/\bkeeper\b/);   // Keeper takes a capital K
  }
  await page.evaluate(() => window.PixelPets.fleetExit());
});

// D1431: Keeper-hold slips stay, but read as local and temporary, never as an order from the capital; the Keeper yard stays.
// D1440: Bright Swap is its own lamp-swap stall (never the buy-back stall) with no Keeper cover: a Keepers hold leaves it as on split.
test('D1431, D1440: Keeper slips are local, never "by order"; Bright Swap keeps no Keeper cover', async ({ page }) => {
  await boot(page);
  const r = {};
  for (const hold of HOLDS) {
    await open(page, hold);
    r[hold] = await page.evaluate(() => {
      const objs = WORLD.gw_preview.objs, by = id => objs.find(o => o.id === id) || {};
      const say = o => (o.lines && o.lines.else) || o.deny || o.text || '';
      return { clinic: say(by('gw_clinic_door')), mast: say(by('gw_mast')), bay: say(by('gw_bay_door')), attendant: say(by('gw_bay_attendant')),
        stall: say(by('gw_stall')), stallSprite: by('gw_stall').sprite, clerk: say(by('gw_swap_clerk')), sign: say(by('gw_stall_sign')),
        all: objs.map(say).join('\n') };
    });
  }
  const k = r.keepers;
  expect(k.clinic).toContain("'CLOSED PENDING LOCAL REVIEW.'");
  expect(k.mast).toContain("'POWER CUT. LOCAL NOTICE.'");
  expect(k.bay).toContain("'VEHICLES HELD. LOCAL NOTICE.'");
  expect(k.attendant).toContain('yard');   // the Keeper yard behaviour stays
  for (const hold of HOLDS) expect(r[hold].all, hold).not.toMatch(/by order|capital|high charity/i);
  expect(k.stallSprite).toBe('gw_swap_stall');
  expect(k.stall).toBe(r.split.stall);
  expect(k.clerk).toBe(r.split.clerk);
  expect(k.sign).toBe(r.split.sign);
  const lines = JSON.stringify(await page.evaluate(() => window.PPFleet.lines()));
  expect(lines).not.toMatch(/A LAMP IS A LAMP|cream cloth|buy-back/i);
  await page.evaluate(() => window.PixelPets.fleetExit());
});

test('the lot fits the phone: the road and the buildings are on screen from the start tile', async ({ page }) => {
  await boot(page);
  await open(page, 'split');
  await page.waitForTimeout(400);
  const r = await page.evaluate(() => { const c = document.querySelector('#mapCanvas'); return { w: c.width, h: c.height, cam: window.PixelPets.camera || null }; });
  // the canvas shows at least 9 tiles across and 9 down at every width, so the road (row 8-9) and the plaza are in view
  expect(r.w / 16).toBeGreaterThanOrEqual(9);
  expect(r.h / 16).toBeGreaterThanOrEqual(9);
  await page.evaluate(() => window.PixelPets.fleetExit());
});
