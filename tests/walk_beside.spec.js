/* WALK_BESIDE v0.1 (design repo, private; D1960-D1979): the Keepers' first word. The Act 1 lines (the Weir Hut lantern, Jacob
   Chi's and the dusk-watch Scout's one-step runs), the four hold lines and the STANDING card's long word, the "walk beside"
   mechanic on the built wild roaming, and the scenes whose triggers wait on unbuilt beats (proved here on seeded saves).
   data/detail_zz_walk_beside.json, game.js, standing.js, quests.js. Modern controls. Save stays pixelpets.save.v2, v 2:
   additive story.* flags and the daily.walk_beside day stamp; no new field. */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const OVERLAY = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'detail_zz_walk_beside.json'), 'utf8'));
const WEIR = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'detail_zz_weir_hut.json'), 'utf8'));
const LANTERN_BUILT = WEIR.maps.hw_weir_hut_in.objs.find(o => o.id === 'weir_keeper_lantern').lines.else;

function save(flags, world) {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.textSpeed = 'fast';
  s.steps = 40;
  Object.assign(s.flags, { 'story.early_done': true, 'story.phone_got': true }, flags || {});
  s.world = Object.assign({ map: 'hearthmoor', x: 8, y: 8, facing: 'down', respawn: 'hearthmoor' }, world || {});
  s.standing = { keepers: 0, glimmer: 0 };
  s.party[0].xp = 4000;
  return s;
}
async function boot(page, s, opts = {}) {
  if (opts.reduce) await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), s || save(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && PixelPets.state && PixelPets.state.party[0]);
  await page.evaluate(() => PixelPets.showTab('walk'));
  if (opts.reduce) expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
}
const flags = page => page.evaluate(() => Object.assign({}, PixelPets.state.flags));
const stored = page => page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
// The save as the game writes it (setFlag saves): a baseline whose keys the game's own save already has.
const savedNow = page => page.evaluate(() => { PixelPets.setFlag('story.early_done', true); return JSON.parse(localStorage.getItem('pixelpets.save.v2')); });
async function goto(page, map, x, y, facing) {
  await page.evaluate(([m, x, y, f]) => PixelPets.goto(m, x, y, f), [map, x, y, facing || 'down']);
  await page.waitForFunction(m => PixelPets.mapInfo.id === m && !PixelPets.fading, map);
}
// Plays the open scene to its end; choices take the first label in `picks` that is offered (else the first). Returns
// [speaker, text] per line and ['>', label] per pick. `onChoice(labels, boxes)` may read the buttons while they show.
async function drive(page, picks = [], onChoice = null, ms = 60000) {
  const until = Date.now() + ms, lines = [];
  let last = null;
  while (Date.now() < until) {
    const sc = await page.evaluate(() => PixelPets.scene && { mode: PixelPets.scene.mode, full: PixelPets.scene.full, waiting: PixelPets.scene.waiting, text: PixelPets.scene.text, who: PixelPets.scene.who });
    if (!sc) { await page.waitForTimeout(120); if (!(await page.evaluate(() => !!PixelPets.scene))) return lines; continue; }
    if (sc.mode === 'choice') {
      if (!sc.full) { await page.keyboard.press('Space'); continue; }
      if (!(await page.locator('#sbChoices button:visible').count())) { await page.waitForTimeout(40); continue; }
      await page.waitForFunction(() => PixelPets.optionsReady === true);
      const labels = (await page.locator('#sbChoices button').allTextContents()).map(t => t.trim());
      if (onChoice) await onChoice(labels, await page.locator('#sbChoices button').evaluateAll(els => els.map(e => e.getBoundingClientRect().height)));
      lines.push([sc.who || '', sc.text]);
      const pick = picks.find(p => labels.includes(p)) || labels[0];
      lines.push(['>', pick]);
      await page.locator('#sbChoices button', { hasText: pick }).first().click();
      await page.waitForTimeout(40); continue;
    }
    if (sc.mode === 'say' && sc.text) {   // the box's line is recorded the first time it shows, typed out or not
      const key = sc.who + '|' + sc.text;
      if (key !== last) { lines.push([sc.who || '', sc.text]); last = key; }
    }
    if (sc.mode === 'say' && sc.waiting) {
      await page.keyboard.press('Space'); await page.waitForTimeout(sc.full ? 30 : 60); continue;
    }
    await page.waitForTimeout(40);
  }
  throw new Error('scene did not end');
}
async function playScene(page, id, picks) {
  expect(await page.evaluate(i => PixelPets.runScene(i), id), id).toBe(true);
  return drive(page, picks || []);
}

// ---------------------------------------------------------------------------------------------------------------------------
// Slice 1: Act 1 (D1970)
test.describe('WALK_BESIDE Act 1 (D1970)', () => {
  test('WB-T14: the Weir Hut lantern shows the new line on story.chi_done, else the built line byte for byte', async ({ page }) => {
    await boot(page, save({ 'story.warden_met': true, 'story.chi_met': true, 'story.reached_glen': true, 'story.hw_reached': true }));
    await goto(page, 'hw_weir_hut_in', 4, 7, 'up');
    const line = async () => {
      expect(await page.evaluate(() => PixelPets.talkTo('weir_keeper_lantern'))).toBe(true);
      const l = await drive(page); return l[0][1];
    };
    expect(await line()).toBe(LANTERN_BUILT);
    expect(LANTERN_BUILT).toBe('An old Keeper lantern, set apart on the shelf. A cloth is tied over its glass.');
    await page.evaluate(() => PixelPets.setFlag('story.chi_done', true));
    const got = await line();
    expect(got).toBe('The cloth is off the old lantern. Scratched on the base: WHERE THEY STOP, STOP.');
    expect(Array.from(got).length).toBeLessThanOrEqual(110);
    expect(Object.keys(OVERLAY.objPatch.weir_keeper_lantern.linesFirst)).toEqual(['story.chi_done']);   // one key, ahead of the built else
    expect((await stored(page)).v).toBe(2);
  });

  test('D1970: Jacob Chi\'s run follows the report (chi_report), and the Scout\'s line follows the dusk watch', async ({ page }) => {
    test.setTimeout(90000);
    await boot(page, save({ 'story.warden_met': true, 'story.chi_met': true, 'story.chi_jars': 3, 'story.shift_g': true, 'story.shift_k': true, 'story.met_lead': true }));
    const before = await savedNow(page);
    // The report: the built scene runs as before, then the one-step run once story.chi_done is set.
    const report = await playScene(page, 'chi_report', ["That's all"]);
    const texts = report.filter(l => l[0] !== '>').map(l => l[1]);
    const at = texts.indexOf("Go home by the orchard. Fen's crates are still at the gate.");
    expect(at).toBeGreaterThan(0);
    expect(texts.slice(at + 1)).toEqual(['Jacob Chi lifts the cloth off the old lantern on the shelf.', 'Scouts learned the long version once. Nobody asks for it now.']);
    expect(report.find(l => l[1] === 'Scouts learned the long version once. Nobody asks for it now.')[0]).toBe('Vincent Chi');   // raw key, shown as Jacob Chi
    expect((await flags(page))['story.chi_done']).toBe(true);
    // The dusk watch: its last built step, then the Scout.
    const watch = await playScene(page, 'night_watch', ['Say nothing']);
    const w = watch.filter(l => l[0] !== '>');
    expect(w[w.length - 1]).toEqual(['Keeper Scout', 'Walk beside, not ahead. Tonight that meant I stood here and wrote it down.']);
    expect(w[w.length - 2][1]).toBe('Morning. The crates are gone. The lamps hum on, as if nothing walked to them at all.');
    for (const l of report.concat(watch)) if (l[0] !== '>') expect(Array.from(l[1]).length, l[1]).toBeLessThanOrEqual(110);
    // No settled step edited: the scenes end with the run, the rest is the built script.
    const script = await page.evaluate(() => [PixelPets.sceneScript('chi_report'), PixelPets.sceneScript('night_watch')]);
    expect(script[0][script[0].length - 1]).toEqual(['if', 'story.chi_done', [['run', 'wb_chi_lantern']]]);
    expect(script[1][script[1].length - 1]).toEqual(['run', 'wb_scout_watch']);
    const after = await stored(page);
    expect(after.v).toBe(2);
    expect(Object.keys(after).sort()).toEqual(Object.keys(before).sort());
  });
});

// ---------------------------------------------------------------------------------------------------------------------------
// Slice 2: the four hold lines (D1934, D1971) and the STANDING card's long word (D1972)
const HOLD_NEW = {
  route1: 'The Keeper watch holds this road. Walk beside, not ahead.',
  route2: 'Keepers walk beside. Glimmerwell runs the Census.',
  route2_glen: 'Glimmerwell holds the glen. The lamps walk ahead.',
  proto: 'Wild country. Nobody walks ahead here.', hw_cut: 'Wild country. Nobody walks ahead here.', mahopac: 'Wild country. Nobody walks ahead here.',
};
const HOLD_KEPT = {
  hearthmoor: 'Home. The Keepers hold this town.', fernbrook: 'Keepers keep the town. Glimmerwell keeps a stand.',
  cobblecrest: 'The Keepers hold the town.', cobble_quarry: "The quarry is still the town's.", highcharity: 'The Keepers hold the capital.',
  fb_heights: "Glimmerwell's lab sits on the ridge.", route3: "Keepers walk it. Glimmerwell's crates roll down it.",
  brinewick: 'Keepers keep the harbour. Glimmerwell leases the east pier.',
};
const LONG_WORD = 'Walk beside them, not ahead. Where they stop, stop. Where they turn, look.';

test.describe('WALK_BESIDE hold lines and the STANDING card (D1934, D1971, D1972)', () => {
  test('WB-T1: the four road and wild lines read the new words; every town line and the arrival words are unchanged', async ({ page }) => {
    await boot(page, save());
    const got = await page.evaluate(ids => Object.fromEntries(ids.map(id => [id, PixelPets.holdLine(id, {})])), Object.keys(HOLD_NEW).concat(Object.keys(HOLD_KEPT)));
    for (const [id, line] of Object.entries(HOLD_NEW)) { expect(got[id], id).toBe(line); expect(Array.from(line).length).toBeLessThanOrEqual(110); }
    for (const [id, line] of Object.entries(HOLD_KEPT)) expect(got[id], id).toBe(line);
    // Fernbrook's Cadet split line is a town line and stays.
    expect(await page.evaluate(() => PixelPets.holdLine('fernbrook', { 'story.keeper_cadet': true, 'story.side_pick_done': true }))).toBe('Keepers walk the lanes. Glimmerwell keeps the gate.');
    const words = await page.evaluate(() => STANDING_CFG.bar.words);
    expect(words).toEqual({ keepers: 'KEEPERS', glimmer: 'GLIMMERWELL', split: 'BOTH SIDES', wild: 'UNCLAIMED' });
    // `asks` stays byte for byte (D1937); the long word is its own string.
    const cfg = await page.evaluate(() => ({ asks: STANDING_CFG.sides.keepers.asks, long: STANDING_CFG.sides.keepers.asksLong, g: STANDING_CFG.sides.glimmer.asksLong }));
    expect(cfg.asks.startsWith('The Keepers ask you to walk beside wild Walklings, not ahead of them. Feed, rest, listen, and leave glow where it grows.')).toBe(true);
    expect(cfg.long).toBe(LONG_WORD);
    expect(cfg.g).toBeUndefined();
  });

  for (const reduce of [false, true]) {
    test('WB-T2: the Keepers row adds the whole word under the tier after story.wb_charter' + (reduce ? ' (reduced motion)' : ''), async ({ page }) => {
      // The card opens from the TODAY chip's STANDING row; after the pick that row opens the STANDING tab (built), so both
      // surfaces are read: the card on an unpledged save, the tab on a Cadet.
      await boot(page, save({}), { reduce });
      const card = async () => {
        await page.locator('#thChip').click();
        await page.locator('#envStanding').click();
        await expect(page.locator('#ovSide')).toBeVisible();
        const rows = await page.locator('#sideRows .side-row').evaluateAll(els => els.map(e => ({ side: e.dataset.side, words: [...e.querySelectorAll('.side-word')].map(p => p.textContent) })));
        const doc = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
        return { rows, doc };
      };
      let c = await card();
      expect(c.rows.map(r => r.side)).toEqual(['keepers', 'glimmer']);
      expect(c.rows[0].words).toEqual([]);   // as built, without the charter
      await page.locator('#sideClose').click();
      await page.evaluate(() => PixelPets.setFlag('story.wb_charter', 'read'));
      c = await card();
      expect(c.rows[0].words).toEqual([LONG_WORD]);
      expect(c.rows[1].words).toEqual([]);   // the Glimmerwell row is unchanged
      expect(c.doc.sw).toBeLessThanOrEqual(c.doc.cw);   // no horizontal scroll at 320
      await expect(page.getByText(LONG_WORD)).toBeVisible();   // readable text
      const word = page.locator('#sideRows .side-row[data-side="keepers"] .side-word');
      const box = await word.boundingBox(), line = await page.locator('#sideRows .side-row[data-side="keepers"] .side-line').boundingBox();
      expect(box.y).toBeGreaterThanOrEqual(line.y + line.height - 1);   // its own line, under the row's line
      expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width);
      expect(await word.getAttribute('aria-hidden')).toBeNull();
      const col = await page.evaluate(() => [getComputedStyle(document.querySelector('#sideRows .side-word')).color, getComputedStyle(document.querySelector('#sideRows .side-line')).color]);
      expect(col[0]).toBe(col[1]);
      await page.locator('#sideClose').click();
      // A Cadet: the chip's STANDING row opens the STANDING tab; its Keepers row carries the line under the tier.
      await page.evaluate(() => { PixelPets.setFlag('story.side_pick_done', true); PixelPets.setFlag('story.keeper_cadet', true); PixelPets.setFlag('story.ilse_call_old', true); });
      await page.locator('#thChip').click();
      await page.locator('#envStanding').click();
      await expect(page.locator('#stRows .st-row[data-side="keepers"] .side-word')).toHaveText(LONG_WORD);
      expect(await page.locator('#stRows .st-row[data-side="glimmer"] .side-word').count()).toBe(0);
      const tier = await page.locator('#stRows .st-row[data-side="keepers"] .st-tier').boundingBox(), w2 = await page.locator('#stRows .st-row[data-side="keepers"] .side-word').boundingBox();
      expect(w2.y).toBeGreaterThan(tier.y);
      expect(w2.x + w2.width).toBeLessThanOrEqual(page.viewportSize().width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      expect((await stored(page)).v).toBe(2);
    });
  }
});

// ---------------------------------------------------------------------------------------------------------------------------
// Slice 3: the "walk beside" mechanic (D1973-D1979)
const R1 = { 'story.reached_route1': true, 'trainer.route1_pia': true, 'trainer.route1_tam': true, 'trainer.route1_ollie': true, 'story.rival1_done': true, 'story.first_wild_met': true };
const r1Save = (extra, bag) => { const s = save(Object.assign({}, R1, extra || {}), { map: 'route1', x: 12, y: 8, facing: 'right', respawn: 'hearthmoor' }); if (bag) s.bag = bag; return s; };
async function r1Boot(page, extra, opts = {}) {
  await boot(page, r1Save(extra, opts.bag), opts);
  await page.evaluate(() => PixelPets.clearWild());
  await expect.poll(() => page.evaluate(() => PixelPets.mapInfo.id === 'route1' && !PixelPets.fading && !PixelPets.scene)).toBe(true);
}
const today = page => page.evaluate(() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); });
const wildNow = page => page.evaluate(() => { const w = PixelPets.wild[0], h = PixelPets.state.world; return w ? { x: w.x, y: w.y, shy: w.shy, d: Math.abs(w.x - h.x) + Math.abs(w.y - h.y), b: w.beside } : null; });
const toasts = page => page.evaluate(() => PixelPets.toasts.slice());
const spawnAt = (page, x, y) => page.evaluate(([x, y]) => PixelPets.spawnWild(0, 0, x, y), [x, y]);
const holder = page => page.evaluate(() => ({ x: PixelPets.state.world.x, y: PixelPets.state.world.y, facing: PixelPets.state.world.facing }));
// The wait, for real: a wild two tiles off and no input until it starts (3 s of wild.clock).
async function startWalk(page) {
  await spawnAt(page, 12, 10);
  await expect.poll(async () => { const w = await wildNow(page); return w && w.b && w.b.left; }, { timeout: 20000 }).toBe(12);
}
async function stepRight(page, n) { for (let i = 0; i < n; i++) { const r = await page.evaluate(() => PixelPets.walkStep('right')); expect(r.ok).toBe(true); await page.waitForTimeout(40); } }
const lookToast = "It stops. Something's in the grass.";
// A real tap on the map canvas over tile (x, y) (pointerdown + pointerup at its CSS point), once the camera has settled.
async function tapTile(page, x, y) {
  await expect.poll(() => page.evaluate(async () => {
    const a = Object.assign({}, PixelPets.walk.cam); await new Promise(r => setTimeout(r, 120)); const b = PixelPets.walk.cam;
    return a.x === b.x && a.y === b.y;
  }), { timeout: 5000 }).toBe(true);
  await page.evaluate(({ x, y }) => {
    const mc = document.querySelector('#mapCanvas'), b = mc.getBoundingClientRect(), cam = PixelPets.walk.cam;
    const cx = b.left + ((x * 16 + 8 - cam.x) / mc.width) * b.width, cy = b.top + ((y * 16 + 8 - cam.y) / mc.height) * b.height;
    const opt = { bubbles: true, cancelable: true, clientX: cx, clientY: cy, pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0 };
    mc.dispatchEvent(new PointerEvent('pointerdown', opt)); mc.dispatchEvent(new PointerEvent('pointerup', opt));
  }, { x, y });
}

test.describe('WALK_BESIDE the mechanic (D1973-D1979)', () => {
  test('WB-T3: still 3 s within 2 tiles starts it (toast, live line); at 3 tiles it never starts; a tap-to-walk resets the wait', async ({ page }) => {
    test.setTimeout(90000);
    await r1Boot(page);
    // 3 tiles: never a candidate while it stays out there.
    await spawnAt(page, 12, 11);
    let far = 0;
    for (let i = 0; i < 45; i++) {
      const w = await wildNow(page), q = await page.evaluate(() => PixelPets.wbWait);
      if (w.d >= 3) { far++; expect(q.cand).toBeNull(); expect(w.b).toBeNull(); }
      await page.waitForTimeout(100);
    }
    expect(far).toBeGreaterThan(20);
    // 2 tiles, then a tap-to-walk during the wait: the wait resets and nothing starts.
    await page.evaluate(() => PixelPets.clearWild());
    await spawnAt(page, 12, 10);
    await expect.poll(() => page.evaluate(() => PixelPets.wbWait.still), { timeout: 10000 }).toBeGreaterThan(800);
    await tapTile(page, 15, 8);
    await expect.poll(() => holder(page)).toMatchObject({ x: 15, y: 8 });
    expect((await page.evaluate(() => PixelPets.wbWait)).still).toBeLessThan(800);
    expect((await wildNow(page)).b).toBeNull();
    // Back beside it: no input for 3 s starts it.
    await page.evaluate(() => { PixelPets.clearWild(); PixelPets.goto('route1', 12, 8, 'right'); PixelPets.clearWild(); });
    await expect.poll(() => page.evaluate(() => !PixelPets.fading)).toBe(true);
    await startWalk(page);
    const w = await wildNow(page);
    expect(w.b).toMatchObject({ left: 12, phase: 'walk' });
    expect(w.d).toBe(1);   // it stepped next to you
    expect(await toasts(page)).toContain('It walks beside you a while.');
    expect(await page.locator('#wbLive').textContent()).toBe(await page.evaluate(() => PixelPets.wild[0].name) + ': It walks beside you a while.');
    expect(await page.locator('#wbLive').getAttribute('aria-live')).toBe('polite');
  });

  test('WB-T4: twelve tap-to-walk steps with it within 2 tiles after each landing; a bump opens no battle', async ({ page }) => {
    test.setTimeout(90000);
    await r1Boot(page);
    await startWalk(page);
    // A bump into it: blocked, no battle (R5).
    const w0 = await wildNow(page), h0 = await holder(page);
    const dir = w0.y > h0.y ? 'down' : w0.y < h0.y ? 'up' : w0.x > h0.x ? 'right' : 'left';
    await page.evaluate(d => PixelPets.walkStep(d), dir);
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => !!(PixelPets.battle && PixelPets.battle.on))).toBe(false);
    expect(await page.evaluate(() => PixelPets.enc && PixelPets.enc.next)).toBeFalsy();
    expect(await holder(page)).toMatchObject({ x: h0.x, y: h0.y });
    expect((await wildNow(page)).b.left).toBe(12);
    // Twelve real tap-to-walk landings: one tap, twelve tiles east along the path.
    await page.evaluate(() => { PixelPets.state.world.facing = 'right'; });
    await tapTile(page, 24, 8);
    const seen = [];
    for (let i = 0; i < 120; i++) {
      const s = await page.evaluate(() => { const w = PixelPets.wild[0], h = PixelPets.state.world; return { hx: h.x, d: Math.abs(w.x - h.x) + Math.abs(w.y - h.y), left: w.beside && w.beside.left, phase: w.beside && w.beside.phase, moving: PixelPets.keeper.moving }; });
      if (!s.moving) seen.push(s);
      if (s.phase === 'look' && !s.moving) break;
      await page.waitForTimeout(25);
    }
    const last = seen[seen.length - 1];
    expect(last).toMatchObject({ hx: 24, left: 0, phase: 'look' });
    for (const s of seen) expect(s.d, JSON.stringify(s)).toBeLessThanOrEqual(2);
    expect(await toasts(page)).toContain(lookToast);
    expect(await page.evaluate(() => !!(PixelPets.battle && PixelPets.battle.on))).toBe(false);
  });

  test('WB-T5: the look completes after 1.5 s still: Joy Crumb +1, Keepers +1, daily.walk_beside today; the glyph shows', async ({ page }) => {
    test.setTimeout(90000);
    await r1Boot(page);
    // Walking itself writes the built care records (care, stepLog); take the baseline after two plain steps.
    for (const d of ['right', 'left']) { await page.evaluate(d => PixelPets.walkStep(d), d); await page.waitForTimeout(60); }
    const before = await savedNow(page);
    await startWalk(page);
    await stepRight(page, 12);
    const look = await wildNow(page);
    expect(look.b).toMatchObject({ phase: 'look', left: 0, to: 'grass' });
    expect((await holder(page)).facing).toBe(look.b.face);   // the holder turns the same way
    expect(await toasts(page)).toContain(lookToast);
    await expect.poll(() => page.evaluate(() => PixelPets.state.flags['daily.walk_beside'] || null), { timeout: 15000 }).toBe(await today(page));
    const after = await stored(page);
    expect((after.bag.joy_crumb | 0) - (before.bag.joy_crumb | 0)).toBe(1);
    expect(after.standing.keepers - (before.standing.keepers | 0)).toBe(1);
    expect(after.standing.glimmer).toBe(before.standing.glimmer | 0);
    expect(after.money | 0).toBe(before.money | 0);
    expect(await toasts(page)).toContain('It left a Joy Crumb where it stood.');
    const w = await page.evaluate(() => PixelPets.wild[0]);
    expect(w.beside).toBeNull();
    // Full motion draws the notice glyph over it while it turns (WB-T9 checks reduced motion draws none).
    expect(look.b.glyphs > 0 || (await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches))).toBe(true);
    // WB-T10: save unchanged apart from the stamp, the reward and Standing.
    expect(after.v).toBe(2);
    expect(Object.keys(after).sort()).toEqual(Object.keys(before).sort());
    const fk = o => Object.keys(o.flags).filter(k => !/^(daily\.hello|daily\.warm_bowl)$/.test(k)).sort();
    expect(fk(after).filter(k => !fk(before).includes(k))).toEqual(['daily.walk_beside']);
    expect(fk(before).filter(k => !fk(after).includes(k))).toEqual([]);
    expect(Object.keys(after.flags).filter(k => k.startsWith('story.wb_'))).toEqual([]);   // never a story.* flag (§6.6)
  });

  test('WB-T5: a full Joy Crumb stack gives 10 Acorns; a switcher gets the reward and no Standing', async ({ page }) => {
    test.setTimeout(90000);
    await r1Boot(page, { 'story.switched_a3': true }, { bag: { joy_crumb: 99 } });
    const before = await savedNow(page);
    await startWalk(page);
    await stepRight(page, 12);
    await expect.poll(() => page.evaluate(() => PixelPets.state.flags['daily.walk_beside'] || null), { timeout: 15000 }).toBe(await today(page));
    const after = await stored(page);
    expect(after.bag.joy_crumb).toBe(before.bag.joy_crumb);
    expect((after.money | 0) - (before.money | 0)).toBe(10);
    expect(after.standing).toEqual(before.standing);   // none for a switcher (D1974)
    expect(await toasts(page)).toContain('Found 10 Acorns where it stood.');
  });

  test('WB-T6: the turn table per act, with the lamp override in every act', async ({ page }) => {
    await boot(page, save());
    const T = (flags, near) => page.evaluate(([f, n]) => PixelPets.wbTurnOf(f, n), [flags, near]);
    const at = { x: 5, y: 5 }, holderAt = { x: 5, y: 6 };
    expect(await T({}, { act: 1, at, pickup: { x: 9, y: 5 }, grass: { x: 5, y: 2 } })).toEqual({ to: 'pickup', dir: 'right', toast: "It stops. Something's in the grass." });
    expect(await T({}, { act: 1, at, pickup: null, grass: { x: 5, y: 2 } })).toEqual({ to: 'grass', dir: 'up', toast: "It stops. Something's in the grass." });
    expect(await T({}, { act: 2, at })).toEqual({ to: 'north', dir: 'up', toast: 'It stops and looks north. You look too.' });
    expect(await T({}, { act: 3, at })).toEqual({ to: 'north', dir: 'up', toast: 'It stops and looks north. You look too.' });
    expect(await T({}, { act: 4, at })).toEqual({ to: 'sky', dir: 'up', toast: 'It stops and looks up. So do you.' });
    expect(await T({}, { act: 5, at })).toEqual({ to: 'sea', dir: 'down', toast: 'It turns toward the sea. You look.' });
    expect(await T({ 'story.solvane_met': true }, { act: 5, at })).toEqual({ to: 'high', dir: 'up', toast: 'It turns toward the high road.' });
    expect(await T({}, { act: 6, at })).toEqual({ to: 'high', dir: 'up', toast: 'It turns toward the high road.' });
    expect(await T({}, { act: 7, at, holder: holderAt })).toEqual({ to: 'holder', dir: 'down', toast: 'It looks at you a while. Then it goes.' });
    for (let act = 1; act <= 7; act++) expect(await T({}, { act, at, lamp: { x: 2, y: 5 }, holder: holderAt })).toEqual({ to: 'lamp', dir: 'left', toast: "It turns to the lamp's hum. You wait." });
    // The act comes from the save's flags when the caller gives none (PPStanding.actOf).
    expect((await T({ 'story.ep1_end': true }, { at })).to).toBe('north');
    expect((await T({ 'story.ep1_end': true, 'story.seal5': true, 'story.seal7': true }, { at })).to).toBe('sky');
    for (const t of ['It walks beside you a while.', 'It goes on without you.', 'It left a Joy Crumb where it stood.', 'Found 10 Acorns where it stood.', "It turns to the lamp's hum. You wait.", "It stops. Something's in the grass.", 'It stops and looks north. You look too.', 'It stops and looks up. So do you.', 'It turns toward the sea. You look.', 'It turns toward the high road.', 'It looks at you a while. Then it goes.'])
      expect(Array.from(t).length, t).toBeLessThanOrEqual(40);
  });

  test('WB-T6 live: on the glen a Comfort Lamp within 6 tiles wins; in Act 2 the turn is north', async ({ page }) => {
    test.setTimeout(90000);
    await boot(page, save(Object.assign({}, R1, { 'story.reached_route2': true, 'story.reached_glen': true, 'trainer.r2_lead': true }), { map: 'route2_glen', x: 10, y: 7, facing: 'down', respawn: 'hearthmoor' }));
    await page.evaluate(() => PixelPets.clearWild());
    const lamp = await page.evaluate(() => PixelPets.mapObjs.filter(o => o.sprite === 'comfort_lamp').map(o => ({ x: o.x, y: o.y })));
    expect(lamp.length).toBeGreaterThan(0);
    await page.evaluate(() => PixelPets.setFlag('story.act', 2));
    await spawnAt(page, 10, 9);
    await page.evaluate(() => { PixelPets.state.world.facing = 'right'; });   // it takes a side tile, off the line you walk
    expect(await page.evaluate(() => PixelPets.wbSkip())).toBe('wait');
    for (let i = 0; i < 12; i++) { const d = (i % 2) ? 'left' : 'right'; expect((await page.evaluate(d => PixelPets.walkStep(d), d)).ok).toBe(true); await page.waitForTimeout(40); }
    const w = await wildNow(page);
    expect(w.b.phase).toBe('look');
    expect(lamp.some(l => Math.abs(l.x - w.x) + Math.abs(l.y - w.y) <= 6)).toBe(true);
    expect(w.b.to).toBe('lamp');
    expect(await toasts(page)).toContain("It turns to the lamp's hum. You wait.");
    // Away from every lamp (Route 1), Act 2 turns north.
    await page.evaluate(() => { PixelPets.clearWild(); PixelPets.goto('route1', 12, 8, 'right'); PixelPets.clearWild(); PixelPets.setFlag('story.act', 2); });
    await expect.poll(() => page.evaluate(() => !PixelPets.fading && PixelPets.mapInfo.id === 'route1')).toBe(true);
    await spawnAt(page, 12, 10);
    expect(await page.evaluate(() => PixelPets.wbSkip())).toBe('wait');
    await stepRight(page, 12);
    const n = await wildNow(page);
    expect(n.b).toMatchObject({ phase: 'look', to: 'north', face: 'up' });
    expect((await holder(page)).facing).toBe('up');
    expect(await toasts(page)).toContain('It stops and looks north. You look too.');
  });

  test('WB-T7: once a local day; a same-day reload keeps the stamp; the next local day it starts again', async ({ page }) => {
    test.setTimeout(120000);
    await r1Boot(page);
    await spawnAt(page, 12, 10);
    expect(await page.evaluate(() => PixelPets.wbSkip())).toBe('wait');
    await stepRight(page, 12);
    expect(await page.evaluate(() => PixelPets.wbSkip())).toBe('look');
    const day = await today(page);
    expect((await flags(page))['daily.walk_beside']).toBe(day);
    // A second wait the same day never starts.
    await page.evaluate(() => { PixelPets.clearWild(); PixelPets.goto('route1', 12, 8, 'right'); PixelPets.clearWild(); });
    await expect.poll(() => page.evaluate(() => !PixelPets.fading)).toBe(true);
    await spawnAt(page, 12, 10);
    await page.waitForTimeout(4500);
    expect((await wildNow(page)).b).toBeNull();
    expect(await page.evaluate(() => PixelPets.wbWait)).toMatchObject({ spent: true, can: false, still: 0 });
    // Same-day reload: still spent (the stamp is in the save; nothing clears it at load). installSave's init script would put
    // the seeded save back on reload, so the save as it stands now is put back after it.
    const now = await page.evaluate(() => localStorage.getItem('pixelpets.save.v2'));
    await page.addInitScript(s => localStorage.setItem('pixelpets.save.v2', s), now);
    await page.reload({ waitUntil: 'commit' });
    await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && PixelPets.state && PixelPets.state.party[0]);
    expect(await page.evaluate(() => PixelPets.state.flags['daily.walk_beside'])).toBe(day);
    await page.evaluate(() => { PixelPets.showTab('walk'); PixelPets.clearWild(); });
    await spawnAt(page, 12, 10);
    await page.waitForTimeout(3800);
    expect((await wildNow(page)).b).toBeNull();
    // The next local day: the clock moves 24 h ahead (Date.now only); the old stamp no longer matches, nothing cleans it up.
    await page.addInitScript(() => { const real = Date.now.bind(Date); Date.now = () => real() + 86400000; });
    await page.reload({ waitUntil: 'commit' });
    await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && PixelPets.state && PixelPets.state.party[0]);
    await page.evaluate(() => { PixelPets.showTab('walk'); PixelPets.clearWild(); });
    expect(await page.evaluate(() => PixelPets.state.flags['daily.walk_beside'])).toBe(day);
    await startWalk(page);
    expect((await wildNow(page)).b.phase).toBe('walk');
  });

  test('WB-T8: break-offs: a tap scoots it (no battle, no reward, no stamp); walking off plays the line; a warp and a scene end it quietly', async ({ page }) => {
    test.setTimeout(150000);
    await r1Boot(page);
    const before = await savedNow(page);
    const quiet = async () => {
      const f = await flags(page), s = await stored(page);
      expect(f['daily.walk_beside']).toBeUndefined();
      expect(s.bag.joy_crumb | 0).toBe(before.bag.joy_crumb | 0);
      expect(s.standing).toEqual(before.standing);
      expect(await page.evaluate(() => !!(PixelPets.battle && PixelPets.battle.on))).toBe(false);
    };
    const restart = async () => {
      await page.evaluate(() => { PixelPets.clearWild(); PixelPets.goto('route1', 12, 8, 'right'); PixelPets.clearWild(); });
      await expect.poll(() => page.evaluate(() => !PixelPets.fading && PixelPets.mapInfo.id === 'route1')).toBe(true);
      await spawnAt(page, 12, 10);
      expect(await page.evaluate(() => PixelPets.wbSkip())).toBe('wait');
    };
    // (a) a tap mid-walk: the built scoot.
    await restart();
    await stepRight(page, 3);
    const w = await wildNow(page);
    await tapTile(page, w.x, w.y);
    await expect.poll(async () => (await wildNow(page)).shy).toBe(true);
    expect((await wildNow(page)).b).toBeNull();
    await page.waitForTimeout(900);
    expect(await page.evaluate(() => PixelPets.enc && PixelPets.enc.next)).toBeFalsy();
    await quiet();
    // (b) walking 4 tiles away during the look.
    await restart();
    await stepRight(page, 12);
    expect((await wildNow(page)).b.phase).toBe('look');
    const n0 = (await toasts(page)).filter(t => t === 'It goes on without you.').length;
    for (const d of ['left', 'left', 'left', 'left']) { await page.evaluate(d => PixelPets.walkStep(d), d); await page.waitForTimeout(60); }
    await expect.poll(async () => (await toasts(page)).filter(t => t === 'It goes on without you.').length).toBe(n0 + 1);
    expect((await wildNow(page)).b).toBeNull();
    expect(await page.locator('#wbLive').textContent()).toMatch(/: It goes on without you\.$/);
    await page.waitForTimeout(1800);
    await quiet();
    // (c) a warp mid-walk: silent, no error.
    await restart();
    await stepRight(page, 2);
    const t0 = (await toasts(page)).length;
    await goto(page, 'hearthmoor', 8, 8, 'down');
    await goto(page, 'route1', 12, 8, 'right');
    expect(await page.evaluate(() => PixelPets.wild.every(x => !x.beside))).toBe(true);
    expect((await toasts(page)).slice(t0)).not.toContain('It goes on without you.');
    await quiet();
    // (c) a scene mid-walk: silent.
    await page.evaluate(() => PixelPets.clearWild());
    await spawnAt(page, 12, 10);
    expect(await page.evaluate(() => PixelPets.wbSkip())).toBe('wait');
    await stepRight(page, 2);
    expect(await page.evaluate(() => PixelPets.runSteps([['say', '', 'A test line.']]))).toBe(true);
    await drive(page);
    expect((await wildNow(page)).b).toBeNull();
    await page.waitForTimeout(600);
    expect((await toasts(page)).slice(t0)).not.toContain('It goes on without you.');
    await quiet();
  });

  test('WB-T9: reduced motion: the walk completes, every toast plays, the turn glyph is not drawn', async ({ page }) => {
    test.setTimeout(90000);
    await r1Boot(page, {}, { reduce: true });
    await startWalk(page);
    await stepRight(page, 12);
    const look = await wildNow(page);
    expect(look.b.phase).toBe('look');
    await page.waitForTimeout(900);
    expect((await wildNow(page)).b.glyphs).toBe(0);
    await expect.poll(() => page.evaluate(() => PixelPets.state.flags['daily.walk_beside'] || null), { timeout: 15000 }).toBe(await today(page));
    const t = await toasts(page);
    for (const line of ['It walks beside you a while.', lookToast, 'It left a Joy Crumb where it stood.']) expect(t).toContain(line);
  });

  test('WB-T10: an old save loads unchanged: no flag or field written at load; debug hooks inert without ?debug=1', async ({ page }) => {
    const s = r1Save();
    await installSave(page.context(), s, { quietDay: true });
    await gotoGame(page);
    await page.waitForFunction(() => window.PixelPets && PixelPets.state && PixelPets.state.party[0]);
    const f = await page.evaluate(() => Object.keys(PixelPets.state.flags));
    expect(f.filter(k => k === 'daily.walk_beside' || k.startsWith('story.wb_'))).toEqual([]);
    expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
    expect(await page.evaluate(() => [PixelPets.wbSkip() === undefined, PixelPets.wbTurnOf({}, {}) === undefined, PixelPets.wbWait === undefined, PixelPets.debug])).toEqual([true, true, true, false]);
    expect(await page.evaluate(() => PixelPets.wild.every(w => w.beside === null || w.beside === false))).toBe(true);
    const keys = Object.keys(JSON.parse(await page.evaluate(() => localStorage.getItem('pixelpets.save.v2'))));
    expect(keys).toContain('v');
  });
});

