/* HC_PARADE v0.2 (design specs/HC_PARADE.md, D1353-D1369; handoff/maps/HC_PARADE.md): the first arrival in High Charity. Part 1
   the parade on Lantern Square, Part 2 the President's speech on Charter Hill, Part 3 three street battles with an ally and two
   foes picked at random. City only (HC_CITY_V2 is false; the preview is ?debug=1&hccity=2 and never writes the save); normal play
   and plain ?debug=1 keep hc_gate. Runs at 320, 375 and 390; reduced motion; zero console errors (trackErrors). §11 T1-T11. */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);
test.setTimeout(150000);

const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'hc_city_v2.json'), 'utf8'));
const FLAGS = ['story.hc_parade_square', 'story.hc_sf_1', 'story.hc_sf_2', 'story.hc_sf_3', 'story.hc_parade_seen', 'story.hc_greeted'];

function save(opts = {}) {
  const s = starterSave();
  s.settings.follower = false; s.settings.controls = 'modern'; s.settings.textSpeed = 'fast'; s.settings.tips = false;
  s.party[0].xp = 4000;                     // a lead around Lv 15, so the level match is visible
  s.money = 120;
  Object.assign(s.flags, { 'story.side_pick_done': true, 'story.hc_invite': true, 'story.hc_arrived': true }, opts.flags || {});
  if (opts.side === 'glimmer') s.flags['story.side'] = 'glimmer';
  s.world = Object.assign({ map: 'highcharity', x: 32, y: 37, facing: 'up', respawn: 'hearthmoor' }, opts.world || {});
  return s;
}
async function boot(page, s, q = '?debug=1&hccity=2', reduced = true) {
  if (reduced) await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, q);
  await page.waitForFunction(() => window.PixelPets && PixelPets.state && PixelPets.state.party[0]);
}
const probe = page => page.evaluate(() => PixelPets.hcParade());
const sceneNow = page => page.evaluate(() => PixelPets.scene);
async function waitScene(page, id) { await expect.poll(async () => { const s = await sceneNow(page); return s && s.id; }, { timeout: 15000 }).toBe(id); }

// Plays the scene to its end: taps through lines (SKIP when asked), wins every battle (or loses battle `lose` once first).
// Samples the budgets on every beat and records each line and each battle it saw.
async function playThrough(page, o = {}) {
  const seen = { lines: [], battles: [], peak: { people: 0, tanks: 0 }, frac: [], picks: [], skipped: false };
  let lost = false, quiet = 0;
  for (let i = 0; i < 3000; i++) {
    const st = await page.evaluate(() => { const h = PixelPets.hcParade(), sc = PixelPets.scene, box = document.querySelector('#sbox');
      return { h, sc, boxOn: !!(sc && box && !box.hidden && !document.querySelector('#ovScene').hidden), skip: !document.querySelector('#sbSkip').hidden,
        trainer: h.battle ? PixelPets.battle && PixelPets.battle.trainerId : null, money: PixelPets.state.money, flags: { ...PixelPets.state.flags } }; });
    seen.peak.people = Math.max(seen.peak.people, st.h.people); seen.peak.tanks = Math.max(seen.peak.tanks, st.h.tanksInView);
    if (o.reduced) for (const c of st.h.cast) if (!Number.isInteger(c.x) || !Number.isInteger(c.y)) seen.frac.push(c.id + '@' + c.x + ',' + c.y);
    if (st.h.last) { const k = JSON.stringify(st.h.last); if (!seen.picks.includes(k)) seen.picks.push(k); }
    if (st.h.battle) {
      if (seen.battles.some(b => b.id === st.h.battleId)) { await page.click('#btOk', { timeout: 150 }).catch(() => {}); await page.keyboard.press('Space'); await page.waitForTimeout(80); continue; }
      seen.battles.push({ id: st.h.battleId, money: st.money, flags: FLAGS.filter(f => st.flags[f]) });
      await page.waitForTimeout(300);
      if (o.lose && !lost) { lost = true; await page.evaluate(() => PixelPets.loseBattle()); }
      else await page.evaluate(() => PixelPets.winBattle());
      for (let k = 0; k < 80 && (await probe(page)).battle; k++) { await page.click('#btOk', { timeout: 150 }).catch(() => {}); await page.keyboard.press('Space'); await page.waitForTimeout(80); }
      continue;
    }
    if (!st.sc) { if (++quiet > 12) break; await page.waitForTimeout(120); continue; }
    quiet = 0;
    if (st.sc.text && seen.lines[seen.lines.length - 1] !== st.sc.who + ': ' + st.sc.text) seen.lines.push(st.sc.who + ': ' + st.sc.text);
    if (o.skip && st.skip && !seen.skipped) { seen.skipped = true; await page.click('#sbSkip'); await page.waitForTimeout(100); continue; }
    if (st.boxOn) await page.keyboard.press('Space');
    await page.waitForTimeout(o.reduced ? 40 : 110);
  }
  seen.end = await page.evaluate(() => ({ map: PixelPets.mapInfo.id, x: PixelPets.state.world.x, y: PixelPets.state.world.y, scene: !!PixelPets.scene,
    flags: { ...PixelPets.state.flags }, money: PixelPets.state.money, v: PixelPets.state.v, h: PixelPets.hcParade() }));
  return seen;
}
const lineOf = (seen, re) => seen.lines.find(l => re.test(l));

test('T1: a first arrival plays hc_parade, not hc_gate; a greeted save plays nothing', async ({ page }) => {
  await boot(page, save());
  await waitScene(page, 'hc_parade');
  await expect.poll(async () => (await sceneNow(page)).text).toMatch(/Bells ring across the roofs/);
  const p = await probe(page);
  expect(p.hidden).toBeGreaterThan(0);                  // the Square's own people (Moss, the patrols, the townsfolk) are off
  await page.close();
});
test('T1b: a save with story.hc_greeted sees no parade', async ({ page }) => {
  await boot(page, save({ flags: { 'story.hc_greeted': true } }));
  await page.waitForTimeout(1500);
  expect(await sceneNow(page)).toBeNull();
});

for (const side of ['keepers', 'glimmer']) {
  test(`T2-T4, T6, T7: the ${side} path plays to its end (reduced motion): lines, placement, flags, exit, cleanup, budgets`, async ({ page }) => {
    await boot(page, save({ side }));
    await waitScene(page, 'hc_parade');
    const seen = await playThrough(page, { reduced: true });
    // T2: each side's own Officer line and spot
    expect(lineOf(seen, side === 'glimmer' ? /Guest\. The street is closed\. Stand at the back\./ : /Citizen\. The street is closed\. Step back\./)).toBeTruthy();
    expect(seen.lines.filter(l => /^The President: /.test(l))).toHaveLength(7);
    expect(lineOf(seen, side === 'glimmer' ? /You're with us\? Then stand with me\./ : /Holder\. With me\./)).toBeTruthy();
    // T3: all five flags and story.hc_greeted; the exit per path; control back
    for (const f of FLAGS) expect(seen.end.flags[f], f).toBe(true);
    expect(seen.end.scene).toBe(false);
    if (side === 'glimmer') { expect(seen.end.map).toBe('hc_waterfront'); expect(seen.end.y).toBeLessThanOrEqual(2); }
    else { expect(seen.end.map).toBe('hc_civic'); expect(seen.end.y).toBeGreaterThanOrEqual(30); expect(seen.end.y).toBeLessThanOrEqual(34); }
    expect(seen.battles.length).toBe(3);
    // T4: every scene actor gone, every hidden body back, on both maps
    const left = await page.evaluate(() => ['highcharity', 'hc_civic'].map(id => ({ id, cast: WORLD[id].objs.filter(o => o.cast).length,
      hidden: WORLD[id].objs.filter(o => o._cutHide).length, child: WORLD[id].objs.some(o => o.id === 'hc_child') })));
    for (const m of left) { expect(m.cast, m.id).toBe(0); expect(m.hidden, m.id).toBe(0); }
    expect(left[0].child).toBe(true);
    // T6 (reduced motion): no fractional cast tile at any sampled beat; T7: people and tanks within budget
    expect(seen.frac).toEqual([]);
    expect(seen.peak.people).toBeLessThanOrEqual(24);
    expect(seen.peak.tanks).toBeLessThanOrEqual(2);
    // D1361: three battles, a fresh ally and two fresh foes each, never the same actor twice
    const picks = seen.picks.map(k => JSON.parse(k)), ids = picks.flatMap(p => [p.ally, ...p.foes]);
    expect(picks.length).toBe(3);
    expect(new Set(ids).size).toBe(ids.length);
    // §10: save v2, no new field (the preview holds the save: nothing written)
    expect(seen.end.v).toBe(2);
  });
}

test('T6: SKIP finishes with the same flags as a full play', async ({ page }) => {
  await boot(page, save(), '?debug=1&hccity=2', false);
  await waitScene(page, 'hc_parade');
  const seen = await playThrough(page, { skip: true });
  expect(seen.skipped).toBe(true);
  for (const f of FLAGS) expect(seen.end.flags[f], f).toBe(true);
  expect(seen.battles.length).toBe(3);   // SKIP still stops at each battle (D1359)
});

test('T8: a loss in a street battle restarts the same battle, loses no Acorns and sets no flag', async ({ page }) => {
  await boot(page, save());
  await waitScene(page, 'hc_parade');
  const seen = await playThrough(page, { reduced: true, lose: true });
  expect(seen.battles.length).toBe(4);
  expect(seen.battles[1].money).toBe(seen.battles[0].money);       // nothing lost
  expect(seen.battles[1].flags).not.toContain('story.hc_sf_1');    // the loss set nothing
  expect(lineOf(seen, /Get up\. Again\./)).toBeTruthy();
  expect(Object.keys(seen.end.flags).filter(k => /^rematch\.hc_sf/.test(k))).toEqual([]);
  for (const f of FLAGS) expect(seen.end.flags[f], f).toBe(true);
});

test('T5: reloads: Part 1 replays from the gate; after the warp Part 2 replays; between battles the next battle resumes', async ({ page }) => {
  // Part 1: the app closed with the holder in the crowd on the Square
  await boot(page, save({ world: { x: 21, y: 23 } }));
  await waitScene(page, 'hc_parade');
  await expect.poll(async () => (await sceneNow(page)).text).toMatch(/Bells ring/);
  expect(await page.evaluate(() => [PixelPets.state.world.x, PixelPets.state.world.y])).toEqual([32, 36]);
});
// The preview cannot boot a save on a city chunk yet (save.js sizes the city's maps when HC_CITY_V2 ships), so these two walk
// from the Square through its north mouth: arriving on Charter Hill is the same E10 `load` check a boot runs (game.js boot path).
async function walkToHill(page) {
  await page.evaluate(() => { PixelPets.state.settings.controls = 'arcade'; });
  await page.keyboard.down('ArrowUp');
  await expect.poll(() => page.evaluate(() => PixelPets.mapInfo.id), { timeout: 15000 }).toBe('hc_civic');
  await page.keyboard.up('ArrowUp');
}
test('T5b: arriving on Charter Hill after the warp (a reload) replays Part 2 from the curtain', async ({ page }) => {
  await boot(page, save({ flags: { 'story.hc_parade_square': true }, world: { x: 54, y: 2 } }));
  await page.waitForTimeout(600);
  expect(await sceneNow(page)).toBeNull();                 // the Square does not replay Part 1 once the warp has saved
  await walkToHill(page);
  await waitScene(page, 'hc_parade_hill');
  await expect.poll(async () => { const s = await sceneNow(page); return s && s.text; }, { timeout: 30000 }).toMatch(/Citizen\. Back\.|crossed every line/);
});
test('T5c: between battles the one-line re-stage plays, then battle 2', async ({ page }) => {
  await boot(page, save({ flags: { 'story.hc_parade_square': true, 'story.hc_sf_1': true }, world: { x: 54, y: 2 } }));
  await walkToHill(page);
  await waitScene(page, 'hc_parade_hill');
  const seen = await playThrough(page, { reduced: true });
  expect(seen.lines[0]).toMatch(/PLACEHOLDER\] Muster Road is still packed/);
  expect(seen.lines.some(l => /^The President: /.test(l))).toBe(false);
  expect(seen.battles.length).toBe(2);
  for (const f of FLAGS) expect(seen.end.flags[f], f).toBe(true);
});

test('T9: an old v2 save from before this packet loads unchanged; normal play and plain ?debug=1 keep hc_gate', async ({ page }) => {
  const s = save({ flags: { 'story.hc_greeted': true } });
  await boot(page, s, '?debug=1');
  await page.waitForTimeout(800);
  const r = await page.evaluate(() => ({ scene: PixelPets.scene, v: PixelPets.state.v, map: PixelPets.mapInfo.id, city: PixelPets.hcCity().on,
    trig: WORLD.highcharity.objs.filter(o => o.kind === 'trigger').map(o => o.id + ':' + o.scene),
    stored: JSON.parse(localStorage.getItem('pixelpets.save.v2')).flags['story.hc_greeted'] }));
  expect(r.scene).toBeNull(); expect(r.v).toBe(2); expect(r.city).toBe(false); expect(r.stored).toBe(true);
  expect(r.trig).toContain('hc_gate:hc_gate');
  expect(r.trig.some(t => /hc_parade/.test(t))).toBe(false);
});
test('T9b: the preview never writes the save during the parade', async ({ page }) => {
  await boot(page, save());
  const before = await page.evaluate(() => localStorage.getItem('pixelpets.save.v2'));
  await waitScene(page, 'hc_parade');
  await playThrough(page, { reduced: true });
  expect(await page.evaluate(() => localStorage.getItem('pixelpets.save.v2'))).toBe(before);
});

test('T10: debug hooks do nothing without ?debug=1', async ({ page }) => {
  await boot(page, save({ flags: { 'story.hc_greeted': true } }), '');
  const off = await page.evaluate(() => ({ p: typeof PixelPets.hcParade === 'function' ? PixelPets.hcParade() : null, rng: PixelPets.hcParadeRng ? PixelPets.hcParadeRng([0]) : undefined, city: !!window.PP_HC_V2 && PixelPets.hcCity && PixelPets.hcCity() }));
  expect(off.p).toBeNull(); expect(off.rng).toBeUndefined(); expect(off.city || null).toBeNull();
});
test('T10b: the city check is clean and the scenes and casts are in place', async ({ page }) => {
  await boot(page, save({ flags: { 'story.hc_greeted': true } }));
  const on = await page.evaluate(() => ({ check: PixelPets.charityCheck(), cast: Object.keys(window.PP_HC_V2.castAt).length }));
  expect(on.check).toEqual([]);
  expect(on.cast).toBeGreaterThan(40);
});

test('T11: every parade line passes the wording rules and fits 110', async () => {
  const BANNED = new RegExp('\\b(' + ['fa' + 'int(ed)?', 'ev' + 'olv\\w*', 'co' + 'ins?', 'app' + 'eared', 'tr' + 'ainer', 'riv' + 'al', '\\w+' + 'dex'].join('|') + ')\\b|go, [a-z]+!', 'i');
  const lines = [];
  const walk = n => { if (!Array.isArray(n)) { if (n && typeof n === 'object') Object.values(n).forEach(walk); return; } if (n[0] === 'say') lines.push(n[2]); n.forEach(walk); };
  walk(DATA.scenes.hc_parade); walk(DATA.scenes.hc_parade_hill);
  const pools = JSON.stringify(DATA.scenes.hc_parade_hill);
  expect(lines.length).toBeGreaterThan(15);
  for (const l of lines) { expect(l.length, l).toBeLessThanOrEqual(110); expect(BANNED.test(l), l).toBe(false); expect(/  /.test(l), l).toBe(false); }
  expect(BANNED.test(pools)).toBe(false);
  expect(lines.filter(l => /President/.test(l)).every(l => !/\b(Vance|Merriden)\b/.test(l))).toBe(true);   // "The President", never a name
  expect(JSON.stringify(DATA)).not.toMatch(/\bgun|rifle|cannon|turret\b/i);
});

test('D1354: the Keeper High Court stands on the Parade\'s south half, its door facing Muster Road; the old corner is open', async () => {
  const civ = DATA.maps.hc_civic, door = civ.objs.find(o => o.id === 'hc_court');
  expect([door.x, door.y]).toEqual([32, 27]);
  expect(civ.grid[26][32]).toBe('H'); expect(civ.grid[28][32]).toBe('P');
  expect(civ.roofs.court).toMatchObject({ x0: 26, x1: 38 });
  for (let y = 38; y <= 44; y++) expect(civ.grid[y].slice(2, 15)).not.toMatch(/[RH]/);
  expect(civ.objs.find(o => o.id === 'hc2_sign_court').text).toBe('KEEPER HIGH COURT.');
});
