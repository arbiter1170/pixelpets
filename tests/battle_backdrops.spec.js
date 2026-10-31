// BATTLE_BACKDROPS (D1009, red, settled by Vincent Oct 31, 2026; supersedes D167): every map draws its own battle scene
// from its own tiles, props and PAL. The flag is on; ?debug=1 can force the old backdrop (setBattleBg(false)) to compare.
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

// Every map where a battle can start in normal play: wild spawns, holders, story and boss encounters, group battles.
const BATTLE_MAPS = ['route1', 'hearthmoor', 'fernbrook', 'proto', 'route2', 'route2_glen', 'cobble_quarry', 'hw_rim', 'hw_cut',
  'hw_falls', 'route3', 'brinewick', 'cc_hall_in', 'fb_hall_in', 'bw_hall_in', 'hc_arena_in', 'rx_f1', 'rx_f2', 'rx_f3', 'rx_f4',
  'sm_yard', 'sm_hold', 'sm_den', 'r3_sanctuary', 'r3_ledger', 'r3_relay', 'bw_depot_in'];

async function boot(page, search = '?debug=1') {
  const s = starterSave();
  s.settings.tips = false;
  s.flags['story.tutorial_done'] = true;
  s.flags['story.phone_got'] = true;
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, search);
  if (search.includes('debug=1')) await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
}
async function openWildOn(page, map) {
  const ok = await page.evaluate((map) => {
    if (PixelPets.battle.on) PixelPets.battle.close();
    return !!PixelPets.goto(map);
  }, map);
  expect(ok, 'goto ' + map).toBe(true);
  await page.evaluate(() => {
    PixelPets.battle.textMs = 0; PixelPets.battle.animMs = 0;
    PixelPets.showTab('walk'); PixelPets.healTeam();
    return PixelPets.forceBattle('tide/0', 5);
  });
  await page.waitForFunction(() => PixelPets.battle.state === 'CHOOSE');
}
async function closeBattle(page) {
  await page.evaluate(() => PixelPets.battle.close());
  await page.waitForFunction(() => !PixelPets.battle.on);
}
// A sprite-free patch of the live battle canvas (right of the partner, below the foe), as a string.
function patch(page, x0, y0, w, h) {
  return page.evaluate(({ x0, y0, w, h }) => {
    const c = document.getElementById('battleCanvas');
    return Array.from(c.getContext('2d').getImageData(x0, y0, w, h).data).join(',');
  }, { x0, y0, w, h });
}

test('the flag is on: a battle draws its map\'s scene, and debug can still show the old backdrop', async ({ page }) => {
  await boot(page);
  await openWildOn(page, 'brinewick');
  const sc = await page.evaluate(() => PixelPets.battleScene);
  expect(sc.on).toBe(true);
  expect(sc.id).toBe('brinewick');
  const size = await page.evaluate(() => { const c = document.getElementById('battleCanvas'); return { W: c.width, H: c.height }; });
  const x0 = 34, y0 = size.H - 8, w = size.W - 34, h = 8;
  const on = await patch(page, x0, y0, w, h);
  await page.evaluate(() => PixelPets.setBattleBg(false));
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => PixelPets.battleScene.id)).toBe(null);
  const off = await patch(page, x0, y0, w, h);
  expect(off, 'the old backdrop draws').not.toBe(on);
  await page.evaluate(() => PixelPets.setBattleBg(null));
  await page.waitForTimeout(150);
  expect(await patch(page, x0, y0, w, h), 'back to the build flag: the map\'s scene').toBe(on);
  await closeBattle(page);
});

test('the debug hooks are inert without ?debug=1, and players get the scene', async ({ page }) => {
  await boot(page, '');
  // a hook that is missing or returns null is inert either way
  const r = await page.evaluate(() => {
    const call = (f, ...a) => (typeof f === 'function' ? f(...a) : null);
    return { set: call(PixelPets.setBattleBg, false), art: call(PixelPets.battleSceneArt, 'route1', 60, 83), ids: call(PixelPets.battleSceneIds), sc: PixelPets.battleScene };
  });
  expect(r.set == null, 'setBattleBg').toBe(true);
  expect(r.art == null, 'battleSceneArt').toBe(true);
  expect(r.ids == null, 'battleSceneIds').toBe(true);
  expect(r.sc.on, 'setBattleBg(false) did nothing').toBe(true);
  expect(r.sc.id, 'the current map has its scene').toBe(r.sc.map);
});

test('every battle map opens on its own scene, and the cache stays capped', async ({ page }) => {
  test.setTimeout(180000);
  await boot(page);
  await page.evaluate(() => PixelPets.setBattleBg(true));
  for (const map of BATTLE_MAPS) {
    await openWildOn(page, map);
    const sc = await page.evaluate(() => PixelPets.battleScene);
    expect(sc.id, map).toBe(map);
    expect(sc.room, map + ' room').toBe(map.endsWith('_in') || /^(rx_|sm_|r3_)/.test(map));
    const lit = await page.evaluate(() => {
      const c = document.getElementById('battleCanvas'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, seen = new Set();
      for (let i = 0; i < d.length; i += 4) seen.add(d[i] + ',' + d[i + 1] + ',' + d[i + 2]);
      return seen.size;
    });
    expect(lit, map + ' draws a real scene').toBeGreaterThan(8);
    await closeBattle(page);
  }
  expect(await page.evaluate(() => PixelPets.bdCacheSize)).toBeLessThanOrEqual(8);
});

test('every map has a scene: PAL only, each one different, landmarks clear of the Walklings', async ({ page }) => {
  test.setTimeout(120000);
  await boot(page);
  const r = await page.evaluate((battleMaps) => {
    const ids = PixelPets.battleSceneIds(), world = Object.keys(window.WORLD);
    const pal = new Set(Object.values(PAL).map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(',')));
    const out = { missing: world.filter((id) => !ids.includes(id)), missingBattle: battleMaps.filter((id) => !ids.includes(id)),
      offPal: [], clear: [], dupes: [], count: ids.length };
    // the real canvas sizes (fitBattle) at 320 / 375 / 390, plus a short and a tall extreme
    for (const [W, H] of [[61, 100], [60, 83], [63, 83], [56, 70], [70, 110]]) for (const mode of ['day', 'night', 'day-dull']) {
      const seen = new Map();
      for (const id of ids) {
        const c = PixelPets.battleSceneArt(id, W, H, mode), d = c.getContext('2d').getImageData(0, 0, W, H).data;
        let bad = 0, h = 2166136261;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] !== 255 || !pal.has(d[i] + ',' + d[i + 1] + ',' + d[i + 2])) bad++;
          h = Math.imul(h ^ (d[i] * 65536 + d[i + 1] * 256 + d[i + 2]), 16777619);
        }
        if (bad) out.offPal.push(id + ' ' + W + 'x' + H + ' ' + mode + ': ' + bad);
        if (seen.has(h)) out.dupes.push(id + ' = ' + seen.get(h) + ' ' + W + 'x' + H + ' ' + mode); else seen.set(h, id);
        if (mode !== 'day') continue;
        const deco = PixelPets.battleSceneArt(id, W, H, mode, 'deco'), dd = deco.getContext('2d').getImageData(0, 0, W, H).data;
        for (const [bx, by, bw, bh] of BattleBG.boxes(W, H, BattleBG.scenes[id].group)) {
          let hit = 0;
          for (let y = Math.max(0, by); y < Math.min(H, by + bh); y++) for (let x = Math.max(0, bx); x < Math.min(W, bx + bw); x++) if (dd[(y * W + x) * 4 + 3]) hit++;
          if (hit) out.clear.push(id + ' ' + W + 'x' + H + ' box ' + [bx, by, bw, bh].join(',') + ': ' + hit + ' px');
        }
      }
    }
    return out;
  }, BATTLE_MAPS);
  expect(r.missing, 'maps without a scene').toEqual([]);
  expect(r.missingBattle, 'battle maps without a scene').toEqual([]);
  expect(r.count).toBeGreaterThanOrEqual(67);
  expect(r.offPal, 'pixels outside PAL (or not opaque)').toEqual([]);
  expect(r.dupes, 'two maps with the same scene').toEqual([]);
  expect(r.clear, 'landmark or prop pixels inside a sprite box').toEqual([]);
});

test('water moves in FULL motion and holds still with reduced motion', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.setBattleBg(true));
  const size = async () => page.evaluate(() => { const c = document.getElementById('battleCanvas'); return { W: c.width, H: c.height }; });
  // Route 2's creek runs down the middle: x 34-45, below the foe box and right of the partner's
  const creek = async () => { const { H } = await size(); const fy = Math.max(4, Math.round(H * 0.18)); return patch(page, 34, fy + 23, 12, 14); };
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openWildOn(page, 'route2');
  const a = await creek(); await page.waitForTimeout(600); const b = await creek(); await page.waitForTimeout(600); const c = await creek();
  expect(a, 'reduced motion: still').toBe(b);
  expect(b, 'reduced motion: still').toBe(c);
  await closeBattle(page);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await openWildOn(page, 'route2');
  const frames = new Set();
  for (let i = 0; i < 5; i++) { frames.add(await creek()); await page.waitForTimeout(260); }
  expect(frames.size, 'full motion: the water takes its second frame').toBeGreaterThan(1);
  await closeBattle(page);
});

test('the save is unchanged: no new fields, v stays 2', async ({ page }) => {
  await boot(page);
  // the same battle with the flag off, then on: the save after each has the same fields
  await openWildOn(page, 'cc_hall_in');
  await closeBattle(page);
  const before = await page.evaluate(() => ({ keys: Object.keys(localStorage).sort(), save: Object.keys(JSON.parse(localStorage.getItem('pixelpets.save.v2'))).sort() }));
  await page.evaluate(() => PixelPets.setBattleBg(true));
  await openWildOn(page, 'cc_hall_in');
  await closeBattle(page);
  await page.evaluate(() => PixelPets.setBattleBg(null));
  const after = await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('pixelpets.save.v2')); return { keys: Object.keys(localStorage).sort(), save: Object.keys(s).sort(), v: s.v }; });
  expect(after.keys).toEqual(before.keys);
  expect(after.save).toEqual(before.save);
  expect(after.v).toBe(2);
});
