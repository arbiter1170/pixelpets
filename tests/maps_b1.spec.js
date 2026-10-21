/* Map pass B1 (handoff/maps/B1_rx_f4.md): the acceptance items tests/rx_f4_pilot.spec.js does not cover. Quinn's fight and
   Bitlet's befriend started from the bay itself, the Arbiter's lines by flag, floor variants on a second device, the camera
   in modern controls, and a map resized by a data/detail_*.json overlay keeping a saved spot past its old size. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, withOverlay } = require('./helpers');

trackErrors(test, expect);

function labSave(flags = {}, world = {}, settings = {}) {
  const s = starterSave();
  Object.assign(s.flags, { 'story.side': 'glimmer', 'story.side_pick_done': true, 'story.rx_f1': true, 'story.rx_f3': true }, flags);
  s.world = Object.assign({ map: 'rx_f4', x: 6, y: 19, facing: 'up', respawn: 'fernbrook' }, world);
  Object.assign(s.settings, settings);
  return s;
}
async function boot(page, save) {
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
}
async function at(page, x, y, facing = 'up') {
  await page.evaluate(([x, y, f]) => { PixelPets.goto('rx_f4', x, y, f); if (PixelPets.clearWild) PixelPets.clearWild(); }, [x, y, facing]);
  await page.waitForTimeout(80);
}
async function tapTalk(page) {
  await expect.poll(() => page.evaluate(() => document.querySelector('#talkBtn').classList.contains('ready'))).toBe(true);
  await page.locator('#talkBtn').click();
  await expect.poll(() => page.evaluate(() => PixelPets.scene && PixelPets.scene.full ? PixelPets.scene.text : null), { timeout: 5000 }).not.toBeNull();
  return page.evaluate(() => PixelPets.scene.text);
}
async function talk(page) {
  const t = await tapTalk(page);
  for (let i = 0; i < 12 && await page.evaluate(() => !!PixelPets.scene); i++) { await page.keyboard.press('Space'); await page.waitForTimeout(80); }
  return t;
}
// Steps through say boxes, battle messages and result cards until `until` (a page function) is true.
async function advance(page, until, arg) {
  for (let i = 0; i < 300; i++) {
    if (await page.evaluate(until, arg)) return;
    const st = await page.evaluate(() => {
      const B = PixelPets.battle, s = PixelPets.scene, vis = sel => { const e = document.querySelector(sel); return !!e && !e.hidden && e.offsetParent !== null; };
      return { battle: !!(B && B.on), state: B && B.state, ok: vis('#btOk'), msg: vis('#btMsg'), say: !!(s && s.mode === 'say' && s.waiting), choice: !!(s && s.mode === 'choice' && s.full) };
    });
    if (st.ok) await page.locator('#btOk').click();
    else if (st.battle && st.state !== 'CHOOSE' && st.msg) await page.locator('#btMsg').click();
    else if (st.say) await page.keyboard.press('Space');
    else if (st.choice && await page.evaluate(() => PixelPets.optionsReady === true)) await page.locator('#sbChoices button').first().click();
    await page.waitForTimeout(40);
  }
  throw new Error('advance: gave up waiting');
}

test('Quinn still fights from the bay; the win plays rx_done and sets its flags @w1', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page, labSave({ 'story.saw_arbiter': true }));
  await page.evaluate(() => PixelPets.healTeam());
  await at(page, 7, 7, 'right');
  await tapTalk(page);
  await advance(page, () => !!(PixelPets.battle && PixelPets.battle.on && PixelPets.battle.state === 'CHOOSE'));
  const fight = await page.evaluate(() => ({ group: PixelPets.battle.group, foes: PixelPets.battle.foes.length, ally: !!PixelPets.battle.ally, name: document.querySelector('#btFoeName').textContent }));
  expect(fight.group).toBe(true);
  expect(fight.foes).toBe(2);
  expect(fight.ally).toBe(true);
  expect(fight.name.length).toBeGreaterThan(0);
  await page.evaluate(() => PixelPets.winBattle());
  await advance(page, () => !PixelPets.battle.on && !PixelPets.scene);
  const flags = await page.evaluate(() => ({ done: PixelPets.state.flags['story.rx_done'], heights: PixelPets.state.flags['story.heights_done'], map: PixelPets.mapInfo.id }));
  expect(flags).toEqual({ done: true, heights: true, map: 'rx_f4' });
});

test("Bitlet's scene plays from the bay and befriending it sets story.rx_bitlet @w1", async ({ page }) => {
  test.setTimeout(60000);
  await boot(page, labSave({ 'story.saw_arbiter': true }));
  await page.evaluate(() => PixelPets.healTeam());
  await at(page, 4, 5, 'up');
  expect(await tapTalk(page)).toContain('The top bay is white and quiet.');
  await advance(page, () => !!(PixelPets.battle && PixelPets.battle.on && PixelPets.battle.state === 'CHOOSE' && PixelPets.battle.panel === 'acts'));
  await expect(page.locator('#btFoeName')).toContainText('Bitlet');
  await page.locator('#btBefriendAct').click();
  await page.waitForFunction(() => PixelPets.enc && PixelPets.enc.open);
  await page.evaluate(() => { PixelPets.enc.zone = [0, 1]; });   // any mark lands: the test checks the flag, not the timing
  await page.locator('#encGo').click();
  await advance(page, () => !PixelPets.battle.on && !PixelPets.scene);
  const after = await page.evaluate(() => ({ flag: PixelPets.state.flags['story.rx_bitlet'], byte: PixelPets.state.party.concat(PixelPets.state.box).some(p => p.species === 'byte'),
    onMap: PixelPets.mapInfo.objs.some(o => o.id === 'rx_bitlet'), v: PixelPets.state.v }));
  expect(after).toEqual({ flag: true, byte: true, onMap: false, v: 2 });
});

test('the Arbiter keeps its four lines by flag @w1', async ({ page }) => {
  const s = labSave(); delete s.flags['story.rx_f1'];
  await boot(page, s);
  const said = [];
  for (const flag of [null, 'story.rx_f1', 'story.saw_arbiter', 'story.heights_done']) {
    if (flag) await page.evaluate(f => PixelPets.setFlag(f, true), flag);
    await at(page, 6, 4, 'up');
    said.push(await talk(page));
  }
  expect(said).toEqual(['It emits slowly. The screen is dark.', 'The hum was here before you.', 'A cursor answers the hum.', 'Still emitting. Slow. Unnamed.']);
});

test('floor variants are the same on a second device @w1', async ({ page, browser }) => {
  const read = p => p.evaluate(() => { const out = []; for (let y = 0; y < 22; y++) for (let x = 0; x < 14; x++) out.push(PixelPets.tileInfo(x, y).tile); return out; });
  await boot(page, labSave());
  const one = await read(page);
  const other = await browser.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p2 = await other.newPage(), errs = [];
  p2.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p2.on('pageerror', e => errs.push(e.message));
  await installSave(other, labSave(), { quietDay: true });
  await p2.goto(new URL(page.url()).origin + '/?debug=1', { waitUntil: 'load' });
  await p2.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true && PixelPets.mapInfo.id === 'rx_f4');
  expect(await read(p2)).toEqual(one);
  expect(errs).toEqual([]);
  await other.close();
  expect(one.filter(t => t === 'lab_floor_scuff').length).toBeGreaterThan(20);
  expect(new Set(one).size).toBeGreaterThan(8);
});

test('E1 in modern controls: whole width visible, centred when the bay fits the view, clamped when it does not', async ({ page }) => {
  await boot(page, labSave({}, {}, { controls: 'modern' }));
  expect(await page.evaluate(() => PixelPets.controls.mode)).toBe('modern');
  for (const y of [2, 11, 20]) {
    await at(page, 6, y);
    await page.waitForTimeout(150);
    const c = await page.evaluate(() => { const cv = document.querySelector('#mapCanvas'), r = cv.getBoundingClientRect(), wr = document.querySelector('#mapWrap').getBoundingClientRect();
      return { x: PixelPets.walk.cam.x, y: PixelPets.walk.cam.y, w: cv.width, h: cv.height, cssW: r.width, wrapW: wr.width, ky: PixelPets.state.world.y }; });
    expect(c.w, 'canvas holds the whole 14-tile width').toBe(14 * 16);
    expect(c.x + 0).toBe(0);
    expect(Math.abs(c.cssW - c.wrapW)).toBeLessThanOrEqual(1);
    if (c.h >= 22 * 16) expect(c.y + 0).toBe(-Math.floor((c.h - 22 * 16) / 2));
    else { expect(c.y).toBeGreaterThanOrEqual(0); expect(c.y).toBeLessThanOrEqual(22 * 16 - c.h); }
    const top = c.ky * 16 - c.y;
    expect(top).toBeGreaterThanOrEqual(0);
    expect(top + 16).toBeLessThanOrEqual(c.h);
  }
});

test('E2: a map resized by a data/detail_*.json overlay keeps a saved spot past its old size @w1', async ({ page }) => {
  const old = await (await page.request.get('/data/heights.json')).json();
  const f2 = old.maps.rx_f2, last = f2.grid.length - 1, floor = '#' + '.'.repeat(f2.w - 2) + '#';
  const grid = f2.grid.slice(0, last).concat(Array(8).fill(floor), [f2.grid[last]]);
  await withOverlay(page, { slicePatch: { maps: { rx_f2: { set: { w: f2.w, h: grid.length, grid } } } } });
  await boot(page, labSave({}, { map: 'rx_f2', x: 9, y: 17 }));
  const r = await page.evaluate(() => ({ size: PPSave.MAP_SIZE.rx_f2, h: PixelPets.mapInfo.h, map: PixelPets.mapInfo.id, x: PixelPets.state.world.x, y: PixelPets.state.world.y, look: PixelPets.devChecks().floorCap }));
  expect(r).toEqual({ size: [f2.w, f2.h + 8], h: f2.h + 8, map: 'rx_f2', x: 9, y: 17, look: [] });
});
