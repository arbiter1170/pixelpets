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
    if (sc.mode === 'say' && sc.waiting) {
      if (!sc.full) { await page.keyboard.press('Space'); await page.waitForTimeout(30); continue; }
      const key = sc.who + '|' + sc.text;
      if (key !== last) { lines.push([sc.who || '', sc.text]); last = key; }
      await page.keyboard.press('Space'); await page.waitForTimeout(30); continue;
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
