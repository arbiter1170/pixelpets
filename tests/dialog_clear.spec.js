/* D171: the dialog box never covers the speaker. A test map puts Cass on the bottom row,
   Pip in the top third, and Wren in the middle for the camera nudge. Wren stands at y 16
   so both boxes still cover her once an outdoor Modern camera sits above the partner strip.
   All three names are in data/reputation.json, so the strict cast check stays quiet. Save v stays 2. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, withOverlay, shot } = require('./helpers');

trackErrors(test, expect);

function grid(w, h) {
  const rows = [];
  for (let y = 0; y < h; y++) {
    let row = '';
    for (let x = 0; x < w; x++) row += (x === 0 || y === 0 || x === w - 1 || y === h - 1) ? 'T' : 'g';
    rows.push(row);
  }
  return rows;
}

const W = 16, H = 30;
const overlay = {
  maps: {
    zz_clear: {
      name: 'Box Clearing', backdrop: 'meadow', w: W, h: H,
      start: { x: 8, y: 27, facing: 'down' },
      safe: { x: 8, y: 27 },
      grid: grid(W, H),
      objs: [
        { kind: 'npc', id: 'zz_fern', name: 'Cass', x: 8, y: 28, facing: 'up' },
        { kind: 'npc', id: 'zz_pip', name: 'Pip', x: 8, y: 2, facing: 'down' },
        { kind: 'npc', id: 'zz_wren', name: 'Wren', x: 8, y: 16, facing: 'down' },
      ],
    },
  },
  scenes: {
    zz_fern_two: [
      ['say', 'Cass', 'The box should sit clear of me.\nA tall line reaches the last row.\nThese words would cover a person.\nSo the box moves up above them.\nYou can still see who is talking.\nThe grass stays in view below.\nThat is the whole idea.'],
      ['say', 'Cass', 'This second line stays on the same side.'],
    ],
    zz_fern_bottom: [
      ['say', 'Cass', 'Stay at the bottom even if the box covers me.', { box: 'bottom' }],
    ],
    zz_pip_high: [
      ['say', 'Pip', 'I stand up high, so the box can stay at the bottom.'],
    ],
    zz_wren_nudge: [
      ['say', 'Wren', 'This line is long on purpose so both the top box and the bottom box can reach a speaker who stands in the middle of a short screen.'],
    ],
  },
};

function save(mode) {
  const s = starterSave();
  s.settings.follower = false;
  s.settings.controls = mode;
  s.settings.textSpeed = 'fast';
  s.world = { map: 'zz_clear', x: 8, y: 27, facing: 'down', respawn: 'hearthmoor' };
  return s;
}

async function boot(page, mode) {
  await withOverlay(page, overlay);
  await installSave(page.context(), save(mode), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
}

async function overlap(page, id) {
  return page.evaluate((id) => {
    const c = document.querySelector('#mapCanvas');
    const cr = c.getBoundingClientRect();
    const k = cr.width / c.width;
    const cam = PixelPets.walk.cam;
    const o = PixelPets.mapInfo.objs.find(q => q.id === id);
    const tileX = o.x * 16 - cam.x, tileY = o.y * 16 - cam.y;
    const margin = 8, head = 6;
    const left = cr.left + (tileX - margin) * k;
    const top = cr.top + (tileY - margin - head) * k;
    const width = (16 + margin * 2) * k;
    const height = (16 + margin * 2 + head) * k;
    const s = document.querySelector('#sbox').getBoundingClientRect();
    const hit = left < s.right && left + width > s.left && top < s.bottom && top + height > s.top;
    const sc = PixelPets.scene;
    return {
      hit, top: document.querySelector('#ovScene').classList.contains('top'),
      mode: sc && sc.box, who: sc && sc.who,
      bias: PixelPets.walk.camBias,
      v: PixelPets.state.v,
      quest: PixelPets.questCheck,
    };
  }, id);
}

async function openScene(page, id, x, y, facing) {
  await page.evaluate(({ id, x, y, facing }) => {
    PixelPets.goto('zz_clear', x, y, facing);
    PixelPets.runScene(id);
  }, { id, x, y, facing });
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
}

for (const mode of ['modern', 'arcade']) {
  test(`a bottom-row speaker stays clear of the box (${mode})`, async ({ page }) => {
    await boot(page, mode);
    await openScene(page, 'zz_fern_two', 8, 27, 'down');
    const first = await overlap(page, 'zz_fern');
    expect(first.v).toBe(2);
    expect(first.quest).toEqual([]);
    expect(first.who).toBe('Cass');
    expect(first.hit).toBe(false);
    expect(first.top).toBe(true);
    if (page.viewportSize().width === 390) await shot(page, 'dialog-clear-' + mode);
    await page.keyboard.press('Space');
    await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full && PixelPets.scene.text.includes('second line'));
    const second = await overlap(page, 'zz_fern');
    expect(second.hit).toBe(false);
    expect(second.top).toBe(first.top);
  });

  test(`a speaker in the top third keeps the bottom box (${mode})`, async ({ page }) => {
    await boot(page, mode);
    await openScene(page, 'zz_pip_high', 8, 3, 'up');
    const r = await overlap(page, 'zz_pip');
    expect(r.v).toBe(2);
    expect(r.hit).toBe(false);
    expect(r.top).toBe(false);
    expect(r.mode).toBe('bottom');
  });

  test(`box bottom forces the bottom box (${mode})`, async ({ page }) => {
    await boot(page, mode);
    await openScene(page, 'zz_fern_bottom', 8, 27, 'down');
    const r = await overlap(page, 'zz_fern');
    expect(r.v).toBe(2);
    expect(r.mode).toBe('bottom');
    expect(r.top).toBe(false);
    const low = await page.evaluate(() => {
      const s = document.querySelector('#sbox').getBoundingClientRect();
      return s.top > window.innerHeight * 0.45;
    });
    expect(low).toBe(true);
  });
}

// The nudge needs a short map where both boxes cover Wren. Under the Modern dock (156 px, outside #mapWrap, D789,
// #199/#200) a 320 x 360 window leaves a 204 px map that the 134 px box covers almost whole, so nothing can clear
// her. 320 x 480 leaves a 324 px map: still short enough that the top and the bottom box both cover her.
const NUDGE_VIEW = { width: 320, height: 480 };

test('reduced motion applies camBias without the ease', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize(NUDGE_VIEW);
  await boot(page, 'modern');
  await openScene(page, 'zz_wren_nudge', 8, 14, 'down');
  const b = await overlap(page, 'zz_wren');
  expect(b.v).toBe(2);
  expect(b.hit).toBe(false);
  expect(b.bias.to).not.toBe(0);
  expect(b.bias.jumped).toBe(true);
  expect(b.bias.ease).toBe(false);
  expect(b.bias.y).toBe(b.bias.to);
});

test('camBias eases in when motion is allowed', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize(NUDGE_VIEW);
  await boot(page, 'modern');
  const early = await page.evaluate(() => {
    PixelPets.goto('zz_clear', 8, 14, 'down');
    PixelPets.runScene('zz_wren_nudge');
    const b = PixelPets.walk.camBias;
    return { to: b.to, from: b.from, y: b.y, ease: b.ease, jumped: b.jumped, v: PixelPets.state.v };
  });
  expect(early.v).toBe(2);
  expect(early.to).not.toBe(0);
  expect(early.jumped).toBe(false);
  expect(early.ease).toBe(true);
  expect(early.y).toBe(early.from);
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full && !PixelPets.walk.camBias.ease);
  const done = await overlap(page, 'zz_wren');
  expect(done.hit).toBe(false);
  expect(done.bias.y).toBe(done.bias.to);
});
