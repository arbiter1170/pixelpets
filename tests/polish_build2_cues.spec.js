/* QUEST_CUE QA clearance (D467, D469). Edge boxes stay off the joystick, the d-pad and a slip chip. */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const HUD = '#floatCtl button, #clockChip, #envBadge, #fcAcorns, #joyRing, #walkTip, #petStrip, #dpad';
const LIME = [167, 240, 112];
const LOW_LEFT = { main: { x: 0, y: 48 }, side: { x: 1, y: 46 }, board: { x: 0, y: 20 }, mainTracked: false };

function modernSave(extra) {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.follower = false;
  s.settings.joystick = !!(extra && extra.joystick);
  Object.assign(s.flags, { 'story.mom_sent': true, 'story.early_done': true });
  return s;
}

async function frame(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function openSettings(page) {
  const gear = page.locator('#gearFloat');
  if (await gear.isVisible()) await gear.click();
  else await page.locator('#settingsBtn').click();
  await expect(page.locator('#ovSettings')).toBeVisible();
}

async function boot(page, save) {
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.evaluate(() => {
    PixelPets.showTab('walk');
    PixelPets.goto('hearthmoor', 12, 27, 'down');
  });
  await frame(page);
}

async function layout(page, spec) {
  await page.evaluate((spec) => {
    PixelPets.cueLayout({ main: spec.main, side: spec.side, board: spec.board, mainTracked: !!spec.mainTracked });
  }, spec);
  await frame(page);
}

async function read(page) {
  return page.evaluate((hud) => {
    const chips = PixelPets.cueChips() || [];
    const c = document.querySelector('#mapCanvas');
    const r = c.getBoundingClientRect();
    const scale = r.width / c.width;
    const live = (sel) => [...document.querySelectorAll(sel)].filter(e => !e.hidden && e.offsetParent).map(e => {
      const b = e.getBoundingClientRect();
      return { id: e.id || e.className, l: b.left, t: b.top, r: b.right, b: b.bottom };
    });
    const sep = (a, b) => Math.max(Math.max(b.l - a.r, a.l - b.r), Math.max(b.t - a.b, a.t - b.b));
    const edges = chips.filter(ch => ch.box).map(ch => ({
      tracked: !!ch.tracked,
      box: { l: r.left + ch.box.x, t: r.top + ch.box.y, r: r.left + ch.box.x + ch.box.w, b: r.top + ch.box.y + ch.box.h },
      w: ch.box.w, h: ch.box.h,
      inside: ch.box.x >= -0.01 && ch.box.y >= -0.01 && ch.box.x + ch.box.w <= r.width + 0.01 && ch.box.y + ch.box.h <= r.height + 0.01,
    }));
    const rails = chips.filter(ch => !ch.box).map(ch => ({
      l: r.left + (ch.x - 8) * scale, t: r.top + (ch.y - 8) * scale,
      r: r.left + (ch.x + 10) * scale, b: r.top + (ch.y + 18) * scale,
    }));
    let pair = null;
    for (let i = 0; i < edges.length; i++) for (let j = i + 1; j < edges.length; j++) {
      const g = sep(edges[i].box, edges[j].box);
      if (pair == null || g < pair) pair = g;
    }
    const nearest = (rects) => {
      let best = null;
      for (const edge of edges) for (const h of rects) {
        const g = sep(edge.box, h);
        if (!best || g < best.gap) best = { id: h.id, gap: g };
      }
      return best;
    };
    const g = c.getContext('2d');
    const face = chips.filter(ch => ch.tracked).map(ch => {
      const d = g.getImageData(ch.x - 5, ch.y, 1, 1).data;
      return [d[0], d[1], d[2]];
    });
    return {
      n: edges.length, rails: rails.length, pair, inside: edges.every(e => e.inside),
      size: edges.map(e => [e.w, e.h]),
      hud: nearest(live(hud)),
      joy: nearest(live('#joyRing')),
      dpad: nearest(live('#dpad')),
      d435: nearest(rails.map((h, i) => Object.assign({ id: 'd435-' + i }, h))),
      face, v: PixelPets.state.v,
    };
  }, HUD);
}

test('edge boxes clear the joystick, the d-pad and a slip chip', async ({ page }, testInfo) => {
  await boot(page, modernSave());
  await layout(page, LOW_LEFT);
  const off = await read(page);
  expect(off.v).toBe(2);
  expect(off.n).toBe(2);
  expect(off.rails).toBeGreaterThan(0);
  expect(off.pair).toBeGreaterThanOrEqual(4);
  expect(off.inside).toBe(true);
  expect(off.size).toEqual([[44, 44], [44, 44]]);
  expect(off.hud.gap, 'hud ' + off.hud.id).toBeGreaterThanOrEqual(6);
  expect(off.d435.gap, 'slip').toBeGreaterThanOrEqual(6);
  expect(off.joy).toBeNull();
  if (testInfo.project.name === '390' || testInfo.project.name === '320') {
    fs.mkdirSync('/opt/cursor/artifacts', { recursive: true });
    await page.locator('#mapCanvas').screenshot({ path: '/opt/cursor/artifacts/quest-cue-edge-' + testInfo.project.name + '.png' });
  }

  await openSettings(page);
  await page.locator('#setJoystick').click();
  await page.locator('#setClose').click();
  await expect(page.locator('#ovSettings')).toBeHidden();
  await expect(page.locator('#joyRing')).toBeVisible();
  await frame(page);
  const joy = await read(page);
  expect(joy.n).toBe(2);
  expect(joy.inside).toBe(true);
  expect(joy.pair).toBeGreaterThanOrEqual(4);
  expect(joy.joy.gap, 'joy').toBeGreaterThanOrEqual(6);
  expect(joy.hud.gap).toBeGreaterThanOrEqual(6);
  expect(joy.d435.gap, 'slip with joystick').toBeGreaterThanOrEqual(6);
  expect(joy.dpad).toBeNull();

  await openSettings(page);
  await page.locator('#setControls').click();
  await page.locator('#setClose').click();
  await expect(page.locator('#ovSettings')).toBeHidden();
  await frame(page);
  const arcade = await read(page);
  expect(arcade.n).toBe(2);
  expect(arcade.rails).toBe(0);
  expect(arcade.inside).toBe(true);
  expect(arcade.pair).toBeGreaterThanOrEqual(4);
  expect(arcade.size).toEqual([[44, 44], [44, 44]]);
  expect(arcade.hud.gap, 'arcade hud ' + arcade.hud.id).toBeGreaterThanOrEqual(6);
  expect(arcade.dpad.gap, 'dpad').toBeGreaterThanOrEqual(6);
  expect(arcade.d435).toBeNull();
  expect(arcade.joy).toBeNull();
});

test('a tracked main story is lime and draws no side cue', async ({ page }) => {
  await boot(page, modernSave());
  await layout(page, { main: { x: 11, y: 0 }, side: null, board: null, mainTracked: true });
  const got = await read(page);
  expect(got.n).toBe(1);
  expect(got.face.length).toBe(1);
  expect(got.face[0]).toEqual(LIME);
  expect(got.inside).toBe(true);
  expect(got.size).toEqual([[44, 44]]);
  expect(got.v).toBe(2);
});
