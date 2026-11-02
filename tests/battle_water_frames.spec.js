// Battle scene water (BATTLE_BACKDROPS, D1009). The second water frame is the whole scene drawn again, not the water
// rects repainted on top, so a bridge, dock or prop drawn over the water never blinks out (Route 1's bridge and Fernbrook's
// apple crate did, every other half second, Nov 2, 2026). Runs at 320, 375 and 390.
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

// Bridges drawn over water, as battle_bg.js places them (x, y from the horizon hz, w, h).
const BRIDGES = {
  route1: (W, hz) => [W - 26, hz + 19, 14, 14],
  route2: (W, hz) => [29, hz + 30, 22, 10],
  hw_cut: (W, hz) => [28, hz + 16, 14, 16],
};

async function boot(page) {
  const s = starterSave();
  s.settings.tips = false;
  s.flags['story.tutorial_done'] = true;
  s.flags['story.phone_got'] = true;
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.setBattleBg(true));
}
async function openWildOn(page, map) {
  expect(await page.evaluate((map) => { if (PixelPets.battle.on) PixelPets.battle.close(); return !!PixelPets.goto(map); }, map)).toBe(true);
  await page.evaluate(() => {
    PixelPets.battle.textMs = 0; PixelPets.battle.animMs = 0;
    PixelPets.showTab('walk'); PixelPets.healTeam();
    return PixelPets.forceBattle('tide/0', 5);
  });
  await page.waitForFunction(() => PixelPets.battle.state === 'CHOOSE');
}
const patch = (page, [x0, y0, w, h]) => page.evaluate(({ x0, y0, w, h }) => {
  const c = document.getElementById('battleCanvas');
  return Array.from(c.getContext('2d').getImageData(x0, y0, w, h).data).join(',');
}, { x0, y0, w, h });

test('the two water frames differ only inside the water; every bridge and prop is the same in both', async ({ page }) => {
  test.setTimeout(90000);
  await boot(page);
  const r = await page.evaluate((bridges) => {
    const out = { wet: 0, outside: [], bridge: [], props: [], still: [] };
    const bridgeAt = Object.fromEntries(Object.entries(bridges).map(([k, f]) => [k, new Function('W', 'hz', 'return (' + f + ')(W, hz)')]));
    for (const [W, H] of [[61, 100], [60, 83], [63, 83], [56, 70], [70, 110]]) for (const mode of ['day', 'night']) {
      for (const id of PixelPets.battleSceneIds()) {
        const a = PixelPets.battleSceneArt(id, W, H, mode, undefined, 0), b = PixelPets.battleSceneArt(id, W, H, mode, undefined, 1);
        const da = a.getContext('2d').getImageData(0, 0, W, H).data, db = b.getContext('2d').getImageData(0, 0, W, H).data;
        const inWet = (x, y) => a.wet.some(([wx, wy, ww, wh]) => x >= wx && x < wx + ww && y >= wy && y < wy + wh);
        let outside = 0, moved = 0;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4;
          if (da[i] === db[i] && da[i + 1] === db[i + 1] && da[i + 2] === db[i + 2]) continue;
          moved++;
          if (!inWet(x, y)) outside++;
        }
        if (a.wet.length) { out.wet++; if (!moved) out.still.push(id + ' ' + W + 'x' + H + ' ' + mode); }
        if (outside) out.outside.push(id + ' ' + W + 'x' + H + ' ' + mode + ': ' + outside + ' px');
        // landmarks and props (the deco layer, e.g. Fernbrook's apple crate on the pond) hold in both frames
        // (a landmark's own water, Hushwater Falls' fall and pool, is meant to move and is left out)
        const dc = PixelPets.battleSceneArt(id, W, H, mode, 'deco'), deco = dc.getContext('2d').getImageData(0, 0, W, H).data;
        const decoWet = (x, y) => dc.wet.some(([wx, wy, ww, wh]) => x >= wx && x < wx + ww && y >= wy && y < wy + wh);
        let propDiff = 0;
        for (let i = 0; i < deco.length; i += 4) {
          const x = (i / 4) % W, y = (i / 4 / W) | 0;
          if (deco[i + 3] && !decoWet(x, y) && (da[i] !== db[i] || da[i + 1] !== db[i + 1] || da[i + 2] !== db[i + 2])) propDiff++;
        }
        if (propDiff) out.props.push(id + ' ' + W + 'x' + H + ' ' + mode + ': ' + propDiff + ' px');
        if (bridgeAt[id]) {
          const hz = BattleBG.lay(W, H).hz, [bx, by, bw, bh] = bridgeAt[id](W, hz);
          let diff = 0;
          for (let y = by; y < Math.min(H, by + bh); y++) for (let x = Math.max(0, bx); x < Math.min(W, bx + bw); x++) {
            const i = (y * W + x) * 4;
            if (da[i] !== db[i] || da[i + 1] !== db[i + 1] || da[i + 2] !== db[i + 2]) diff++;
          }
          if (diff) out.bridge.push(id + ' ' + W + 'x' + H + ' ' + mode + ': ' + diff + ' px');
        }
      }
    }
    return out;
  }, Object.fromEntries(Object.entries(BRIDGES).map(([k, f]) => [k, f.toString()])));
  expect(r.wet, 'scenes with water').toBeGreaterThan(0);
  expect(r.outside, 'pixels that change outside the water').toEqual([]);
  expect(r.bridge, 'bridge pixels that change between the frames').toEqual([]);
  expect(r.props, 'landmark or prop pixels that change between the frames').toEqual([]);
  expect(r.still, 'water that never moves').toEqual([]);
});

// Phones size the battle canvas differently (Fernbrook's crate sat on the pond on an iPhone, not at 390 x 844), so sweep
// canvas sizes: wherever a landmark, prop or bridge lands on water, it must look the same in both water frames.
test('props and bridges over water hold in both frames at every canvas size', async ({ page }) => {
  test.setTimeout(90000);
  await boot(page);
  const r = await page.evaluate(() => {
    let over = 0; const bad = [];
    const inR = (rs, x, y) => rs.some(([wx, wy, ww, wh]) => x >= wx && x < wx + ww && y >= wy && y < wy + wh);
    for (const id of PixelPets.battleSceneIds()) for (let W = 56; W <= 72; W += 4) for (let H = 50; H <= 120; H += 4) {
      const a = PixelPets.battleSceneArt(id, W, H, 'day', undefined, 0); if (!a.wet.length) continue;
      const b = PixelPets.battleSceneArt(id, W, H, 'day', undefined, 1), base = PixelPets.battleSceneArt(id, W, H, 'day', 'base', 0);
      const dc = PixelPets.battleSceneArt(id, W, H, 'day', 'deco');
      const da = a.getContext('2d').getImageData(0, 0, W, H).data, db = b.getContext('2d').getImageData(0, 0, W, H).data;
      const dd = dc.getContext('2d').getImageData(0, 0, W, H).data;
      let diff = 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        if (!dd[i + 3] || inR(dc.wet, x, y) || !inR(a.wet, x, y)) continue;   // a prop pixel (not the landmark's own water) over water
        over++;
        if (da[i] !== db[i] || da[i + 1] !== db[i + 1] || da[i + 2] !== db[i + 2]) diff++;
      }
      if (diff) bad.push(id + ' ' + W + 'x' + H + ': ' + diff + ' px');
    }
    return { over, bad };
  });
  expect(r.over, 'the sweep finds props over water (Fernbrook\'s crate and others)').toBeGreaterThan(0);
  expect(r.bad, 'prop pixels over water that change between the frames').toEqual([]);
});

test('Route 1 in battle: the water moves and the bridge holds on every frame in FULL motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await boot(page);
  await openWildOn(page, 'route1');
  const { W, H } = await page.evaluate(() => { const c = document.getElementById('battleCanvas'); return { W: c.width, H: c.height }; });
  const hz = await page.evaluate(([W, H]) => BattleBG.lay(W, H).hz, [W, H]);
  const bridge = BRIDGES.route1(W, hz);
  const water = [30, hz + 22, bridge[0] - 30, 8];   // the stream band right of the partner's box, left of the bridge
  const bridges = new Set(), waters = new Set();
  for (let i = 0; i < 6; i++) { bridges.add(await patch(page, bridge)); waters.add(await patch(page, water)); await page.waitForTimeout(260); }
  expect(waters.size, 'the stream takes its second frame').toBeGreaterThan(1);
  expect(bridges.size, 'the bridge never blinks').toBe(1);
  const st = await page.evaluate(() => ({ cache: PixelPets.bdCacheSize, v: JSON.parse(localStorage.getItem('pixelpets.save.v2')).v }));
  expect(st.cache).toBeLessThanOrEqual(8);
  expect(st.v).toBe(2);
});

test('reduced motion: Route 1 stays on one frame, bridge and water alike', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await boot(page);
  await openWildOn(page, 'route1');
  const { W, H } = await page.evaluate(() => { const c = document.getElementById('battleCanvas'); return { W: c.width, H: c.height }; });
  const hz = await page.evaluate(([W, H]) => BattleBG.lay(W, H).hz, [W, H]);
  const area = [34, hz + 18, W - 34 - 10, 16];
  const seen = new Set();
  for (let i = 0; i < 4; i++) { seen.add(await patch(page, area)); await page.waitForTimeout(300); }
  expect(seen.size).toBe(1);
});
