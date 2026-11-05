/* PARTNER_DAY (Vincent, Nov 2, 2026): the house morning.
   A new game wakes in your room upstairs (hm_home_room). Lizzy and Buddy burst in: it's partner day, get dressed and look
   sharp. The walk lesson happens in the house (walk to the mirror); the mirror is the first look pick. Then the hallway,
   the stairs, and Mom (with Maze, her calico Walkling) says good luck and offers tips for later. Outside, Lizzy waits at
   her old spot (9,20) with a nudge, and her scene after the starter is a reunion. After the starter the tab tour no longer
   auto-starts; Mom's tips open the tutorial chooser. Warden Ilse's talk gains two lore hints after the "armour" line. */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { starterSave, installSave, trackErrors, gotoGame, artifactsDir, tapFacing } = require('./helpers');

trackErrors(test, expect);
test.use({ serviceWorkers: 'block' });   // the read hook below must reach game.js on every load

const shotDir = () => { const d = artifactsDir('partner-day'); fs.mkdirSync(d, { recursive: true }); return d; };
const st = (page) => page.evaluate(() => {
  const s = PixelPets.scene;
  return { id: s && s.id, mode: s && s.mode, waiting: !!(s && s.waiting), full: !!(s && s.full), text: (s && s.text) || '',
    map: PixelPets.mapInfo.id, look: !document.querySelector('#ovLook').hidden, pos: [PixelPets.state.world.x, PixelPets.state.world.y] };
});
// Taps through say boxes; answers choices with pick(text); closes the look picker with DONE. Records every line seen.
async function drive(page, until, { pick = () => 0, seen = [], shots = [] } = {}) {
  for (let i = 0; i < 300; i++) {
    const s = await st(page);
    if (s.text && seen[seen.length - 1] !== s.text) seen.push(s.text);
    for (const sh of shots) if (!sh.done && sh.re.test(s.text)) { sh.done = true; await page.waitForTimeout(350); await page.screenshot({ path: path.join(shotDir(), sh.name + '-' + page.viewportSize().width + '.png') }); }
    if (await page.evaluate(until)) return seen;
    if (s.look) await page.locator('#lookDone').click();
    else if (s.mode === 'choice' && s.full && await page.evaluate(() => PixelPets.optionsReady === true)) await page.locator('#sbChoices button').nth(pick(s.text)).click();
    else if (s.waiting) await page.keyboard.press('Space');
    await page.waitForTimeout(40);
  }
  throw new Error('drive: stuck at ' + JSON.stringify(await st(page)));
}
const flags = (page) => page.evaluate(() => PixelPets.state.flags);
const objIds = (page) => page.evaluate(() => PixelPets.mapInfo.objs.map(o => o.id));
async function talk(page) {
  await expect.poll(() => page.evaluate(() => document.querySelector('#talkBtn').classList.contains('ready'))).toBe(true);
  await tapFacing(page);   // Modern: tap the person you face
}
async function stepTo(page, map, x, y, facing, dir) {
  await page.evaluate(([m, x, y, f]) => PixelPets.goto(m, x, y, f), [map, x, y, facing]);
  await page.evaluate((d) => PixelPets.walkStep(d), dir);
}
// New game: ARCADE is picked so the TALK button can use the mirror (modern is covered in P-2).
async function wake(page, { pick = (t) => (/walk/.test(t) ? 1 : 0), shots = [] } = {}) {
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.id === 'intro', null, { timeout: 10000 });
  expect(await page.evaluate(() => [PixelPets.mapInfo.id, PixelPets.state.world.x, PixelPets.state.world.y])).toEqual(['hm_home_room', 1, 3]);
  return drive(page, () => !PixelPets.scene, { pick, shots });
}
async function dress(page) {
  await page.evaluate(() => PixelPets.goto('hm_home_room', 4, 3, 'up'));
  await talk(page);
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.id === 'home_dress', null, { timeout: 8000 });
  await drive(page, () => !document.querySelector('#ovLook').hidden);
  // First look of a new holder: "WHO ARE YOU?" and no CANCEL.
  expect(await page.locator('#lookTitle').textContent()).toContain('WHO ARE YOU');
  expect(await page.locator('#lookCancel').isVisible()).toBe(false);
  return drive(page, () => !PixelPets.scene);
}

test('P-1 a new game wakes in your room; Lizzy and Buddy burst in for partner day', async ({ page }) => {
  const seen = await wake(page, { shots: [{ re: /partner day!/, name: 'wake' }] });
  expect(seen.some(t => /It's partner day!/.test(t))).toBe(true);
  expect(seen.some(t => /Get dressed and look sharp/.test(t))).toBe(true);
  expect(seen.some(t => /How do you like to walk\?/.test(t))).toBe(true);      // controls are picked before the walk lesson
  expect(seen.some(t => /walk to the mirror|Tap the mirror/.test(t))).toBe(true);
  const ids = await objIds(page);
  expect(ids).toEqual(expect.arrayContaining(['room_lizzy', 'room_buddy', 'home_bed', 'home_mirror']));
  expect(ids.filter(id => /_wake$/.test(id))).toEqual([]);                    // the walking casts left with the scene
  const f = await flags(page);
  expect(f['story.lizzy_wake']).toBe(true);
  expect(f['story.intro_seen']).toBeUndefined();                              // set by Mom, so a reload replays the morning
  await page.screenshot({ path: path.join(shotDir(), 'room-' + page.viewportSize().width + '.png') });
});

test('P-2 the door waits for the mirror; the mirror is the first look, then Lizzy and Buddy run ahead', async ({ page }) => {
  await wake(page, { pick: () => 0 });                                       // MODERN
  expect(await page.evaluate(() => PixelPets.state.settings.controls)).toBe('modern');
  // Before the mirror the quest arrow points at the mirror.
  expect(await page.evaluate(() => { const q = PixelPets.quest; return [q.id, q.target]; })).toEqual(['dress', { map: 'hm_home_room', x: 4, y: 3 }]);
  // Leaving undressed: Lizzy stops you and you step back.
  await stepTo(page, 'hm_home_room', 4, 4, 'down', 'down');
  await page.waitForFunction(() => PixelPets.scene && /pyjamas/.test(PixelPets.scene.text || ''), null, { timeout: 5000 });
  await drive(page, () => !PixelPets.scene);
  expect(await page.evaluate(() => [PixelPets.mapInfo.id, PixelPets.state.world.y])).toEqual(['hm_home_room', 4]);
  // The walk lesson, modern: tap the mirror on the map; the holder walks over and uses it.
  const spot = await page.evaluate(() => {
    const c = document.querySelector('#mapCanvas'), cam = PixelPets.walk.cam, k = c.getBoundingClientRect().width / c.width;
    return { x: (4 * 16 - cam.x + 8) * k, y: (2 * 16 - cam.y + 8) * k };
  });
  await page.locator('#mapCanvas').click({ position: spot });
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.id === 'home_dress', null, { timeout: 10000 });
  await drive(page, () => !document.querySelector('#ovLook').hidden);
  expect(await page.locator('#lookTitle').textContent()).toContain('WHO ARE YOU');
  await drive(page, () => !PixelPets.scene);
  const f = await flags(page);
  expect(f['story.home_dressed']).toBe(true);
  expect(await page.evaluate(() => !!PixelPets.state.player.look)).toBe(true);
  // Once dressed, the quest arrow leaves the mirror and points downstairs: the step targets Mom's spot at the foot of the
  // stairs, and on this map the cue points at the bedroom door (Vincent's bug, Nov 2, 2026).
  const q = await page.evaluate(() => { const q = PixelPets.quest; return { id: q.id, target: q.target, point: q.point }; });
  expect(q.id).toBe('wake');
  expect(q.target).toEqual({ map: 'hm_home_in', x: 2, y: 6 });
  expect(q.point).toEqual({ x: 4, y: 6, here: false });
  const ids = await objIds(page);
  expect(ids).not.toContain('room_lizzy');
  expect(ids).not.toContain('room_buddy');
  await page.screenshot({ path: path.join(shotDir(), 'dressed-' + page.viewportSize().width + '.png') });
});

test('P-3 room, hallway, stairs: Mom and Maze say good luck; outside Lizzy waits at her old spot', async ({ page }) => {
  await wake(page);
  await dress(page);
  await stepTo(page, 'hm_home_room', 4, 5, 'down', 'down');
  await page.waitForFunction(() => PixelPets.mapInfo.id === 'hm_home_hall' && !PixelPets.fading, null, { timeout: 5000 });
  expect(await page.evaluate(() => [PixelPets.state.world.x, PixelPets.state.world.y])).toEqual([2, 2]);
  await page.screenshot({ path: path.join(shotDir(), 'hall-' + page.viewportSize().width + '.png') });
  // Mom's room is through the other door; she is no longer in it.
  await stepTo(page, 'hm_home_hall', 6, 2, 'up', 'up');
  await page.waitForFunction(() => PixelPets.mapInfo.id === 'hm_home_up' && !PixelPets.fading, null, { timeout: 5000 });
  expect(await objIds(page)).not.toContain('mom');
  await page.screenshot({ path: path.join(shotDir(), 'momroom-' + page.viewportSize().width + '.png') });
  await stepTo(page, 'hm_home_up', 4, 6, 'down', 'down');
  await page.waitForFunction(() => PixelPets.mapInfo.id === 'hm_home_hall' && !PixelPets.fading, null, { timeout: 5000 });
  await stepTo(page, 'hm_home_hall', 4, 3, 'down', 'down');
  await page.waitForFunction(() => PixelPets.mapInfo.id === 'hm_home_in' && !PixelPets.fading, null, { timeout: 5000 });
  expect(await objIds(page)).toEqual(expect.arrayContaining(['mom', 'maze']));
  expect(await objIds(page)).not.toContain('home_bed');
  await page.evaluate(() => PixelPets.walkStep('right'));
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.id === 'mom_luck', null, { timeout: 5000 });
  const seen = await drive(page, () => !PixelPets.scene, { shots: [{ re: /Good luck at the Lodge/, name: 'mom' }] });
  expect(seen.some(t => /Good luck at the Lodge/.test(t))).toBe(true);
  expect(seen.some(t => /tips for you and your new Walkling/.test(t))).toBe(true);
  expect(seen.some(t => /Maze/.test(t))).toBe(true);
  const f = await flags(page);
  expect(f['story.intro_seen']).toBe(true);
  expect(f['story.home_walk']).toBe(true);
  await stepTo(page, 'hm_home_in', 4, 6, 'down', 'down');
  await page.waitForFunction(() => PixelPets.mapInfo.id === 'hearthmoor' && !PixelPets.fading, null, { timeout: 5000 });
  const out = await objIds(page);
  expect(out).toEqual(expect.arrayContaining(['hm_lizzy_pre', 'hm_buddy_pre']));
  expect(out).not.toContain('hm_lizzy');
  const at = await page.evaluate(() => PixelPets.mapInfo.objs.find(o => o.id === 'hm_lizzy_pre'));
  expect([at.x, at.y]).toEqual([9, 20]);
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});

test('P-4 a reload mid-morning replays it from your bed, without a second Lizzy', async ({ page }) => {
  await wake(page);
  await page.reload();
  await page.waitForFunction(() => window.PixelPets && PixelPets.scene && PixelPets.scene.id === 'intro', null, { timeout: 10000 });
  expect(await page.evaluate(() => PixelPets.mapInfo.id)).toBe('hm_home_room');
  const seen = await drive(page, () => !PixelPets.scene);
  expect(seen.some(t => /Still in your pyjamas/.test(t))).toBe(true);
  expect((await objIds(page)).filter(id => /lizzy/.test(id))).toEqual(['room_lizzy']);
});

test('P-5 after the starter: no auto tour; Mom\'s tips open the chooser; Lizzy greets you as an old friend', async ({ page }) => {
  const s = starterSave();
  Object.assign(s.flags, { 'story.home_walk': true, 'story.intro_seen': true, 'story.tut_care': 'done' });
  delete s.flags['story.tutorial_done']; delete s.flags['story.early_done'];
  s.world = Object.assign({}, s.world, { map: 'hm_home_in', x: 4, y: 4, facing: 'right' });
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForFunction(() => PixelPets.state.flags['story.tutorial_done'] === true, null, { timeout: 5000 });
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => document.querySelector('#tutLayer').hidden)).toBe(true);   // no tab tour
  await page.evaluate(() => PixelPets.runScene('mom_tips'));
  const seen = await drive(page, () => !PixelPets.scene);
  expect(seen).toContain('Ask Mom for tips?');
  await expect(page.locator('#ovSheet')).toBeVisible();
  await expect(page.locator('#shTitle')).toHaveText('Tutorial');
  await page.screenshot({ path: path.join(shotDir(), 'tips-' + page.viewportSize().width + '.png') });
  await page.locator('#shCancel').click();
  await page.evaluate(() => PixelPets.runScene('lizzy_intro'));
  const lz = await drive(page, () => !PixelPets.scene);
  expect(lz[0]).toContain('You made it back');
  expect(lz.join(' ')).not.toContain("It's been forever");
  expect(lz.join(' ')).not.toContain('where you vanished');
  expect((await flags(page))['story.lizzy_met']).toBe(true);
});

test('P-6 an older save (no house morning) keeps Lizzy\'s first meeting and the tour', async ({ page }) => {
  const s = starterSave();
  delete s.flags['story.tutorial_done']; delete s.flags['story.early_done']; s.flags['story.tut_care'] = 'done';
  s.flags['story.tutorial_step'] = 'T0';   // a tour that was cut off resumes on load, as before
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForFunction(() => !document.querySelector('#tutLayer').hidden, null, { timeout: 8000 });   // the old tour still runs
  expect((await flags(page))['story.tutorial_done']).toBeUndefined();
  for (let i = 0; i < 3 && await page.evaluate(() => !document.querySelector('#tutLayer').hidden); i++) {
    const skip = page.locator('#tutActs button', { hasText: 'SKIP' });
    if (await skip.isVisible()) await skip.click(); else if (await page.locator('#tutSkip').isVisible()) await page.locator('#tutSkip').click();
    await page.waitForTimeout(150);
  }
  await page.evaluate(() => PixelPets.runScene('lizzy_intro'));
  const lz = await drive(page, () => !PixelPets.scene);
  expect(lz[0]).toContain("It's been forever");
});

test('P-7 Warden Ilse hints at what is ahead, after her armour line', async ({ page }) => {
  await page.route('**/game.js*', async (route) => {
    const res = await route.fetch();
    let body = await res.text();
    const at = body.search(/try \{\r?\n  boot\(\);\r?\n/);   // CRLF-tolerant (Windows core.autocrlf=true)
    if (at >= 0) body = body.slice(0, at) + 'window.__pd = s => eval(s);\n' + body.slice(at);
    await route.fulfill({ status: 200, body, headers: { 'content-type': 'application/javascript', 'cache-control': 'no-store' } });
  });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.__pd);
  const r = await page.evaluate(() => window.__pd(`(() => {
    const st = SCENES.starter, i = st.findIndex(x => x[0] === 'say' && /only armour you have/.test(x[2]));
    return { next: st.slice(i + 1, i + 5), miss: starterMomentMiss.slice(), cut: cutsceneMiss.slice() };
  })()`));
  expect(r.miss).toEqual([]);
  expect(r.cut).toEqual([]);
  expect(r.next[0][2]).toContain('understand far more');
  expect(r.next[1][0]).toBe('choice');
  for (const opt of r.next[1][2]) expect(opt[0].length).toBeLessThanOrEqual(30);
  expect(r.next[2][2]).toContain('brighter');
  expect(r.next[3][2]).toContain('A glow is not always a gift');
});

test('P-8 reduced motion: the morning lands on whole tiles and Maze sits still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await wake(page);
  const pos = await page.evaluate(() => PixelPets.mapInfo.objs.filter(o => /room_/.test(o.id)).map(o => [o.x, o.y]));
  for (const [x, y] of pos) { expect(Number.isInteger(x)).toBe(true); expect(Number.isInteger(y)).toBe(true); }
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});
