/* QUEST_MULTI (D106): several active side quests. SIDE card = tracked chain, TRACK rows, row cap, folded DONE, ring and dots. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, playScene } = require('./helpers');

trackErrors(test, expect);

const MODES = ['arcade', 'modern'];

function save(extra = {}, mode = 'arcade', patch) {
  const s = starterSave();
  Object.assign(s.flags, extra);
  s.world = { map: 'hearthmoor', x: 8, y: 8, facing: 'down', respawn: 'hearthmoor' };
  s.settings = Object.assign(s.settings || {}, { controls: mode });
  if (patch) patch(s);
  return s;
}
async function boot(page, s) {
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForFunction(() => !document.querySelector('#questBtn').classList.contains('off'));
}
async function openPanel(page) {
  await page.locator('#questBtn').click();
  await page.waitForSelector('#ovQuest:not([hidden])');
  await page.waitForFunction(() => PixelPets.optionsReady);
}
async function closePanel(page) {
  await page.locator('#questClose').click();
  await page.waitForSelector('#ovQuest', { state: 'hidden' });
}
const panel = (page) => page.evaluate(() => ({
  kicker: document.querySelector('#questSideLabel').textContent,
  status: document.querySelector('#questSideStatus').textContent,
  side: document.querySelector('#questSide').textContent,
  sideHidden: document.querySelector('#questSideCard').hidden,
  rows: [...document.querySelectorAll('#questSideRows .q-row')].map((r) => r.querySelector('.q-row-label').textContent),
  rowsHidden: document.querySelector('#questSideRows').hidden,
  track: [...document.querySelectorAll('#questSideRows .q-track')].map((b) => b.textContent),
  more: document.querySelector('#questSideMore').hidden ? null : document.querySelector('#questSideMore').textContent,
  doneToggle: document.querySelector('#questDoneToggle').hidden ? null : document.querySelector('#questDoneToggle').textContent,
  doneListHidden: document.querySelector('#questDone').hidden,
  main: document.querySelector('#questText').textContent,
  mainStatus: document.querySelector('#questStatus').textContent,
}));
async function openMap(page) {
  await page.locator('#mapBtn').click();
  await page.waitForSelector('#ovMap:not([hidden])');
  await page.waitForFunction(() => PixelPets.regionMapMarks);
}
const sideText = (page, id) => page.evaluate((id) => PPQuests.SIDE.find((e) => e.id === id).text, id);
const mainSnap = (page) => page.evaluate(() => { const q = PixelPets.quest; return { id: q.id, text: q.text, place: q.place, point: q.point, seen: q.seen }; });

for (const mode of MODES) {
  test(`AC1 + AC2 (${mode}): two side chains, TRACK switches, survives reload`, async ({ page }) => {
    await boot(page, save({}, mode));
    await openPanel(page);
    let p = await panel(page);
    expect(p.kicker).toBe('SIDE \u00b7 2');
    expect(p.status).toBe('TRACKED');
    expect(p.side).toBe(await sideText(page, 'phone'));
    expect(p.rows).toEqual(["Mom's trip"]);
    expect(p.track).toEqual(['TRACK']);
    await expect(page.locator('#questSideRows .q-track')).toHaveAttribute('aria-label', "Track Mom's trip");
    await closePanel(page);
    await openMap(page);
    let marks = await page.evaluate(() => PixelPets.regionMapMarks);
    expect(marks.ring).toBe('route1');
    expect(marks.dots).toContain('hearthmoor');
    await page.locator('#mapClose').click().catch(() => page.keyboard.press('Escape'));
    await page.waitForSelector('#ovMap', { state: 'hidden' });

    await openPanel(page);
    await page.locator('#questSideRows .q-track').click();
    p = await panel(page);
    expect(p.side).toBe(await sideText(page, 'mom'));
    expect(p.rows).toEqual(['Explore Route 1']);
    expect(await page.evaluate(() => document.activeElement && document.activeElement.id)).toBe('questSideLabel');
    expect(await page.evaluate(() => PixelPets.state.ui.sideTracked)).toBe('mom');
    await closePanel(page);
    // installSave's init script would put the seed back on reload; carry the real stored save across instead.
    const stored = await page.evaluate(() => localStorage.getItem('pixelpets.save.v2'));
    await page.context().addInitScript((v) => localStorage.setItem('pixelpets.save.v2', v), stored);
    await page.reload();
    await page.waitForFunction(() => window.PixelPets && window.BUILD);
    await page.evaluate(() => PixelPets.showTab('walk'));
    const after = await page.evaluate(() => ({ t: PixelPets.state.ui.sideTracked, sq: PixelPets.sideQuest, stored: JSON.parse(localStorage.getItem('pixelpets.save.v2')).ui }));
    expect(after.t).toBe('mom');
    expect(after.stored.sideTracked).toBe('mom');
    expect(after.sq.id).toBe('mom');                                // walk cue follows the tracked chain
    expect(after.sq.target.map).toBe('hm_home_up');
    await openMap(page);
    marks = await page.evaluate(() => PixelPets.regionMapMarks);
    expect(marks.ring).toBe('hearthmoor');                          // Mom shares the main node: outer side ring around the main ring
    expect(marks.ringShared).toBe(true);
    expect(marks.dots).toEqual(['route1']);
    expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
  });
}

test('AC3: talking to Mom first still starts her chain, and her step advances on the card', async ({ page }) => {
  await boot(page, save());
  await page.evaluate(() => PixelPets.runScene('mom_hello'));
  await playScene(page, ["I'll clear the table"]);
  const st = await page.evaluate(() => ({ met: PixelPets.state.flags['story.mom_met'], active: PixelPets.sideActive.map((a) => a.id) }));
  expect(st.met).toBe(true);
  expect(st.active).toEqual(['phone', 'mom_chore']);
  await page.evaluate(() => PixelPets.trackSide('mom'));
  await openPanel(page);
  expect((await panel(page)).side).toBe(await sideText(page, 'mom_chore'));
  expect(await page.evaluate(() => PixelPets.state.ui.sideTracked)).toBe('mom');
});

test('AC4: finishing the tracked phone chain auto-tracks Mom with a toast', async ({ page }) => {
  await boot(page, save());
  await page.waitForTimeout(100);
  await page.evaluate(() => PixelPets.setFlag('story.phone_got', true));
  await page.waitForFunction(() => document.querySelector('#toast').textContent.startsWith('Now tracking'));
  expect(await page.locator('#toast').textContent()).toBe("Now tracking: Mom's trip");
  expect(await page.evaluate(() => PixelPets.state.ui.sideTracked)).toBe('mom');
  await openPanel(page);
  const p = await panel(page);
  expect(p.kicker).toBe('SIDE');
  expect(p.status).toBe('ACTIVE');
  expect(p.rows).toEqual([]);
  expect(p.rowsHidden).toBe(true);
  expect(p.doneToggle).toBeNull();
});

test('AC5: an old save without ui loads, phone tracked, nothing written until TRACK', async ({ page }) => {
  const s = save(); delete s.ui;
  await boot(page, s);
  const st = await page.evaluate(() => ({ ui: PixelPets.state.ui, sq: PixelPets.sideQuest.id, v: PixelPets.state.v, stored: JSON.parse(localStorage.getItem('pixelpets.save.v2')).ui }));
  expect(st.ui).toEqual({});
  expect(st.sq).toBe('phone');
  expect(st.v).toBe(2);
  expect(st.stored === undefined || (st.stored && st.stored.sideTracked === undefined)).toBe(true);
});

test('AC6: an unknown tracked id falls back to the first active chain', async ({ page }) => {
  await boot(page, save({}, 'arcade', (s) => { s.ui = { sideTracked: 'nope' }; }));
  expect(await page.evaluate(() => PixelPets.sideQuest.id)).toBe('phone');
  await openPanel(page);
  expect((await panel(page)).side).toBe(await sideText(page, 'phone'));
  expect(await page.evaluate(() => PixelPets.state.ui.sideTracked)).toBe('nope');   // replaced only by TRACK or auto-track
});

const EXTRA = [
  [{ id: 't_lamp', label: 'Lamp count', when: ['story.starter_received'], done: ['story.t_lamp'], text: 'Test chain three.', place: 'Hearthmoor', target: { map: 'hearthmoor', x: 5, y: 5 } }],
  [{ id: 't_well', label: 'Well check', when: ['story.starter_received'], done: ['story.t_well'], text: 'Test chain four.', place: 'Hearthmoor', target: { map: 'hearthmoor', x: 6, y: 6 } }],
];
const rect = (page, sel) => page.locator(sel).first().evaluate((el) => { const r = el.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; });

for (const mode of MODES) {
  test(`AC7 (${mode}): row cap, +N more expands in place, tap targets at least 44 px`, async ({ page }, info) => {
    const narrow = page.viewportSize().width < 360;
    await page.setViewportSize({ width: page.viewportSize().width, height: narrow ? 568 : 844 });
    await boot(page, save({}, mode));
    await page.evaluate((x) => PixelPets.debugSideChains(x), EXTRA);
    await openPanel(page);
    let p = await panel(page);
    expect(p.kicker).toBe('SIDE \u00b7 4');
    if (narrow) {
      expect(p.rows).toEqual(["Mom's trip", 'Lamp count']);
      expect(p.more).toBe('+1 more');
      await page.locator('#questSideMore').click();
      p = await panel(page);
      expect(p.rows).toEqual(["Mom's trip", 'Lamp count', 'Well check']);
      expect(p.more).toBe('Show less');
      await page.locator('#questSideMore').click();
      expect((await panel(page)).rows.length).toBe(2);
    } else {
      expect(p.rows).toEqual(["Mom's trip", 'Lamp count', 'Well check']);
      expect(p.more).toBeNull();
    }
    const heights = await page.evaluate(() => [...document.querySelectorAll('#ovQuest button')].filter((b) => !b.hidden && b.offsetParent).map((b) => [b.id || b.className, b.getBoundingClientRect().height]));
    for (const [id, h] of heights) expect(h, id).toBeGreaterThanOrEqual(44);
    // §5 rects (±2 px), measured at 320x568 and 390x844 with a one-line MAIN and two-line SIDE text.
    const W = page.viewportSize().width;
    if (W === 320 || W === 390) {
      const x = W === 320 ? 26 : 27, w = W === 320 ? 268 : 336;
      const near = (a, b) => a.forEach((v, i) => expect(Math.abs(v - b[i]), JSON.stringify([a, b])).toBeLessThanOrEqual(2));
      const r1 = await rect(page, '#questSideRows .q-row');
      const t1 = await rect(page, '#questSideRows .q-track');
      const side = await rect(page, '#questSideCard');
      near([r1[0], r1[2], r1[3]], [x, w, 44]);
      near([t1[0], t1[2], t1[3]], [x + w - 80, 80, 44]);
      expect(Math.abs(r1[1] - (side[1] + side[3] + 8))).toBeLessThanOrEqual(2);   // 8 px under the SIDE card
      const r2 = await page.locator('#questSideRows .q-row').nth(1).evaluate((el) => el.getBoundingClientRect().y);
      expect(Math.abs(r2 - (r1[1] + 48))).toBeLessThanOrEqual(2);                    // rows 4 px apart
      if (narrow) { const m = await rect(page, '#questSideMore'); near([m[0], m[1], m[2], m[3]], [x, r1[1] + 96, w, 44]); }
      const close = await rect(page, '#questClose');
      expect(close[1] + close[3]).toBeLessThanOrEqual(W === 320 ? 568 : 844);
    }
  });
}

test('AC8: with two side chains DONE folds into one row that toggles', async ({ page }) => {
  await boot(page, save());
  await openPanel(page);
  let p = await panel(page);
  const n = await page.evaluate(() => PixelPets.quest.done.length);
  expect(p.doneToggle).toBe('DONE \u00b7 ' + n + '  >');
  expect(p.doneListHidden).toBe(true);
  expect(await page.locator('#questDoneToggle').evaluate((b) => b.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  await page.locator('#questDoneToggle').click();
  p = await panel(page);
  expect(p.doneListHidden).toBe(false);
  await page.locator('#questDoneToggle').click();
  expect((await panel(page)).doneListHidden).toBe(true);
});

test('AC9: no side quest, no SIDE card and no Side task in the map key (D110)', async ({ page }) => {
  await boot(page, save({ 'story.phone_got': true, 'story.dream_study': true }));
  await openPanel(page);
  const p = await panel(page);
  expect(p.sideHidden).toBe(true);
  expect(p.rowsHidden).toBe(true);
  expect(p.doneToggle).toBeNull();
  await closePanel(page);
  await openMap(page);
  expect(await page.locator('#keySideTask').isHidden()).toBe(true);
  const marks = await page.evaluate(() => PixelPets.regionMapMarks);
  expect(marks.ring).toBeNull();
  expect(marks.dots).toEqual([]);
});

test('AC9b: the Side task key entry shows while a side quest exists', async ({ page }) => {
  await boot(page, save());
  await openMap(page);
  expect(await page.locator('#keySideTask').isVisible()).toBe(true);
});

test('AC10: QUEST pulses once when Mom\'s chain first becomes active', async ({ page }) => {
  await boot(page, save({}, 'arcade', (s) => { s.questSeen = 'rival1'; s.ui = { sideSeen: ['phone'] }; }));
  expect(await page.evaluate(() => PixelPets.quest.id)).toBe('rival1');
  await page.waitForFunction(() => document.querySelector('#questBtn').classList.contains('pulse'));
  await openPanel(page);
  await closePanel(page);
  await page.waitForTimeout(100);
  expect(await page.locator('#questBtn').evaluate((b) => b.classList.contains('pulse'))).toBe(false);
  expect(await page.evaluate(() => PixelPets.state.ui.sideSeen)).toEqual(['phone', 'mom']);
});

test('AC11: the main card, main cue, red ring and NEXT line do not change with tracking', async ({ page }) => {
  await boot(page, save());
  const grab = async () => {
    await openPanel(page);
    const p = await panel(page); await closePanel(page);
    await openMap(page);
    const m = await page.evaluate(() => ({ next: document.querySelector('#mapQuest').textContent, nh: document.querySelector('#mapQuest').hidden }));
    await page.locator('#mapClose').click();
    await page.waitForSelector('#ovMap', { state: 'hidden' });
    return { main: p.main, status: p.mainStatus, ...m, q: await mainSnap(page) };
  };
  const a = await grab();
  await page.evaluate(() => PixelPets.trackSide('mom'));
  const b = await grab();
  expect(b).toEqual(a);
  await page.evaluate(() => PixelPets.debugSideChains(null));
});

test('AC12: devCheck passes, chains carry labels, sideQuest is the tracked step, sideActive lists all', async ({ page }) => {
  await boot(page, save());
  const r = await page.evaluate(() => ({
    check: PixelPets.questCheck,
    labels: PPQuests.SIDE_CHAINS.map((c) => c[0].label),
    max: PPQuests.LABEL_MAX,
    all: PixelPets.sideActive.map((a) => a.chain),
    sq: PixelPets.sideQuest.id,
  }));
  expect(r.check).toEqual([]);
  expect(r.labels).toEqual(['Explore Route 1', "Mom's trip"]);
  for (const l of r.labels) expect(Array.from(l).length).toBeLessThanOrEqual(r.max);
  expect(r.all).toEqual(['phone', 'mom']);
  expect(r.sq).toBe('phone');
  await page.evaluate(() => PixelPets.trackSide('mom'));
  expect(await page.evaluate(() => PixelPets.sideQuest.id)).toBe('mom');
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});

test('debug hooks stay inert without ?debug=1', async ({ page }) => {
  await installSave(page.context(), save(), { quietDay: true });
  await gotoGame(page, '');
  const r = await page.evaluate(() => ({ a: PixelPets.debugSideChains && PixelPets.debugSideChains([]), b: PixelPets.trackSide && PixelPets.trackSide('mom') }));
  expect(r.a).toBeFalsy();
  expect(r.b).toBeFalsy();
});

test('dim dots: 1 px navy outline, dim side-blue fill, 6x6 at 390 px and up, 4x4 below', async ({ page }) => {
  await boot(page, save());
  await openMap(page);
  const r = await page.evaluate(() => {
    const m = PixelPets.regionMapMarks, c = document.querySelector('#regionCanvas'), g = c.getContext('2d');
    const k = c.width / 320;
    const d = m.dotRects.find((x) => x.node === 'hearthmoor');
    const px = (x, y) => Array.from(g.getImageData(Math.floor(x * k), Math.floor(y * k), 1, 1).data.slice(0, 3));
    return { size: m.dotSize, outline: m.dotOutline, o1: px(d.x - 0.5, d.y + 1), o2: px(d.x + m.dotSize + 0.5, d.y + 1), o3: px(d.x + 1, d.y - 0.5), fill: px(d.x + m.dotSize / 2, d.y + m.dotSize / 2) };
  });
  const W = page.viewportSize().width;
  expect(r.size).toBe(W >= 390 ? 6 : 4);
  expect(r.outline).toBe('k');
  for (const o of [r.o1, r.o2, r.o3]) expect(o).toEqual([0x1a, 0x1c, 0x2c]);
  expect(r.fill).not.toEqual([0x1a, 0x1c, 0x2c]);
  expect(r.fill[2]).toBeGreaterThan(r.fill[0]);                 // blue-leaning dim c, not the 0.5 alpha of plain navy
});

test('tracked side in the main area: two rings on one centre, no dot there, Side line from 360 px', async ({ page }) => {
  await boot(page, save());
  await page.evaluate((x) => { PixelPets.debugSideChains(x); PixelPets.trackSide('mom'); }, EXTRA);   // t_lamp / t_well also sit in Hearthmoor
  await openMap(page);
  const read = () => page.evaluate(() => {
    const m = PixelPets.regionMapMarks, c = document.querySelector('#regionCanvas'), g = c.getContext('2d'), k = c.width / 320;
    return { m, k, w: c.width };
  });
  const a = await read();
  expect(a.m.ring).toBe('hearthmoor');
  expect(a.m.ringShared).toBe(true);
  expect(a.m.ringR).toBe(a.m.mainR + 3);
  expect(a.m.dots).not.toContain('hearthmoor');
  expect(a.m.dots).toContain('route1');
  // Solid, no blink: the side-blue pixel at the outer radius is there on several frames.
  const samples = [];
  for (let i = 0; i < 4; i++) {
    samples.push(await page.evaluate(() => {
      const c = document.querySelector('#regionCanvas'), g = c.getContext('2d'), k = c.width / 320, m = PixelPets.regionMapMarks;
      const node = PixelPets.mapNodeCenter ? PixelPets.mapNodeCenter('hearthmoor') : null;
      if (!node) return null;
      const d = g.getImageData(Math.floor((node[0] + m.ringR) * k), Math.floor(node[1] * k), 1, 1).data;
      return [d[0], d[1], d[2]];
    }));
    await page.waitForTimeout(260);
  }
  for (const px of samples) expect(px).toEqual([0x41, 0xa6, 0xf6]);
  const W = page.viewportSize().width;
  const side = await page.evaluate(() => ({ h: document.querySelector('#mapSide').hidden, t: document.querySelector('#mapSide').textContent }));
  if (W >= 360) expect(side).toEqual({ h: false, t: "Side: Mom's trip" });
  else expect(side.h).toBe(true);
});
