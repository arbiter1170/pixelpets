/* B-2: the post-Trial crackdown follows Vincent's lore rulings of Tue Nov 3, 2026 (handoff/specs/POST_TRIAL_CRACKDOWN.md, "B-2" rows).
   D1431: Glimmerwell's permit stands ("Permit's in order."); Juniper moves her stand by her own choice; nobody orders the company out.
   D1442: one supporter (the plaza's Junior Bright, an existing crowd actor) is led away on screen, off the west edge; no new art.
   D1443: the curfew post says "The order stands until the pick."  D1433: Fen asked the authorities about the Amberwild, not crates.
   Fen's Glimmer-pick line keeps "After last night," only once the crackdown has happened (story.crackdown), else the plain line.
   Saves stay pixelpets.save.v2, v 2; no new flag or save field. */
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const PERMIT = "Permit's in order. Your stand can stay. The square still closes.";
const BY_CHOICE = "A curfew's no good for business. We'll set up out on the east road tonight.";
const LED_AWAY = 'A Keeper leads the Junior Bright away down the west road. Their Walkling trots close behind.';
const ORDER = 'The order stands until the pick.';
const FEN_DAWN = "I asked them for help with the Amberwild. They sent boots. I won't forget it.";
const AFTER_NIGHT = "Go on, then. You won my Seal fairly. After last night, I can't say you're wrong.";

function fernSave() {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.textSpeed = 'fast';
  Object.assign(s.flags, { 'story.reached_route1': true, 'story.rival1_done': true, 'story.reached_fernbrook': true, 'story.met_glimmerwell': true, 'story.met_fen': true, 'story.phone_got': true });
  s.world = { map: 'fernbrook', x: 12, y: 8, facing: 'down', respawn: 'fernbrook' };
  s.standing = { keepers: 0, glimmer: 0 };
  return s;
}
async function boot(page, checkpoint, opts = {}) {
  await installSave(page.context(), fernSave(), { quietDay: true });
  if (opts.reduce) await page.emulateMedia({ reducedMotion: 'reduce' });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && typeof PixelPets.talkTo === 'function');
  await page.evaluate(() => PixelPets.showTab('walk'));
  if (checkpoint) expect((await page.evaluate(id => PixelPets.checkpoint(id), checkpoint)).ok).toBe(true);
}
const ids = page => page.evaluate(() => PixelPets.mapObjs.map(o => o.id));
const objAt = (page, id) => page.evaluate(i => { const o = PixelPets.mapObjs.find(q => q.id === i); return o ? [o.x, o.y] : null; }, id);
// Plays the open scene to its end (first choice unless `picks` names one); `onLine(text)` reads the stage on each new line.
async function drive(page, picks = [], onLine = null, ms = 150000) {
  const until = Date.now() + ms, seen = new Set();
  while (Date.now() < until) {
    const sc = await page.evaluate(() => PixelPets.scene && { mode: PixelPets.scene.mode, full: PixelPets.scene.full, waiting: PixelPets.scene.waiting, text: PixelPets.scene.text });
    if (!sc) { await page.waitForTimeout(150); if (!(await page.evaluate(() => !!PixelPets.scene))) return; continue; }
    if (sc.mode === 'choice') {
      if (!sc.full) { await page.keyboard.press('Space'); continue; }
      if (!(await page.locator('#sbChoices button:visible').count())) { await page.waitForTimeout(40); continue; }
      await page.waitForFunction(() => PixelPets.optionsReady === true);
      const labels = (await page.locator('#sbChoices button').allTextContents()).map(t => t.trim());
      const pick = labels.find(l => picks.includes(l)) || labels[0];
      await page.locator('#sbChoices button', { hasText: pick }).first().click();
      await page.waitForTimeout(40); continue;
    }
    if (sc.mode === 'say' && sc.waiting) {
      if (onLine && sc.full && !seen.has(sc.text)) { seen.add(sc.text); await onLine(sc.text); }
      await page.keyboard.press('Space'); await page.waitForTimeout(30); continue;
    }
    await page.waitForTimeout(40);
  }
  throw new Error('scene did not end');
}
async function leaveHall(page) {
  await page.evaluate(() => PixelPets.goto('fb_hall_in', 7, 20));
  await page.waitForFunction(() => PixelPets.mapInfo.id === 'fb_hall_in' && !PixelPets.fading);
  for (let i = 0; i < 8 && !(await page.evaluate(() => !!PixelPets.scene)); i++) {
    await page.evaluate(() => PixelPets.walkStep('down')); await page.waitForTimeout(260);
    await page.waitForFunction(() => !PixelPets.fading);
  }
}
async function gotoMap(page, map, x, y) {
  await page.evaluate(({ map, x, y }) => PixelPets.goto(map, x, y), { map, x, y });
  await page.waitForFunction(m => PixelPets.mapInfo.id === m && !PixelPets.fading, map);
}

test.describe('crackdown follows the Nov 3 rulings (B-2)', () => {
  test('permit stands, Juniper moves by choice, one supporter led away, the order stands until the pick', async ({ page }) => {
    test.setTimeout(240000);
    await boot(page, 'crackdown_street');
    const before = await page.evaluate(() => ({ flags: Object.keys(PixelPets.state.flags), seals: JSON.stringify(PixelPets.state.seals), v: PixelPets.state.v }));
    await leaveHall(page);
    expect(await page.evaluate(() => PixelPets.scene && PixelPets.scene.id)).toBe('crackdown_street');
    const lines = [], stage = {};
    await drive(page, ['Keep it'], async text => {
      lines.push(text);
      if (/^Out after my order/.test(text)) stage.shout = { junior: await objAt(page, 'fbp_junior_bright'), pet: await objAt(page, 'fbp_junior_bright_pet') };
      if (text === LED_AWAY) stage.gone = await ids(page);
    });
    // D1431: the Commander checks the permit and lets it stand; Juniper chooses to move; no order against the company.
    expect(lines).toEqual(expect.arrayContaining([PERMIT, BY_CHOICE, FEN_DAWN]));
    expect(lines.indexOf(PERMIT)).toBeLessThan(lines.indexOf(BY_CHOICE));
    for (const gone of [/pack up and leave/, /relocating/i, /somewhere else/, /help with the crates/]) expect(lines.join('\n')).not.toMatch(gone);
    // D1442: the Junior Bright and their Walkling come up to the road, then the officer leads them off the west edge.
    expect(stage.shout).toEqual({ junior: [25, 8], pet: [26, 8] });
    for (const id of ['fbp_junior_bright', 'fbp_junior_bright_pet', 'cd_off_b']) expect(stage.gone, id).not.toContain(id);
    expect(stage.gone).toEqual(expect.arrayContaining(['cd_cmdr', 'cd_off_a', 'juniper']));
    for (const l of lines) expect(l.length, l).toBeLessThanOrEqual(110);
    // Save: the Seal kept, v 2, and no story flag beyond the crackdown's own (B-2 adds none).
    const after = await page.evaluate(() => ({ flags: Object.keys(PixelPets.state.flags), seals: JSON.stringify(PixelPets.state.seals), v: PixelPets.state.v }));
    expect([after.seals, after.v]).toEqual([before.seals, 2]);
    // (story.post_trial_done is day1's quest-slot flag; story.beat.* are the engine's scene marks.)
    const own = Object.keys(JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data/detail_zz_crackdown.json'), 'utf8')).flags).concat(['story.post_trial_done']);
    expect(after.flags.filter(k => !before.flags.includes(k) && /^story\./.test(k) && !/^story\.beat\./.test(k) && !own.includes(k))).toEqual([]);
    // D1443: the curfew post's line.
    await gotoMap(page, 'fernbrook', 9, 9);
    expect(await page.evaluate(() => PixelPets.talkTo('cd_post_lantern'))).toBe(true);
    expect(await page.evaluate(() => PixelPets.scene && PixelPets.scene.text)).toBe(ORDER);
    await drive(page);
    // The supporter was only hidden for the scene, never removed: after a Glimmer pick the plaza has them back on their tile.
    await page.evaluate(() => { PixelPets.setFlag('story.side', 'glimmer'); PixelPets.setFlag('story.side_pick_done', true); PixelPets.setFlag('story.slice_end', true); });
    await gotoMap(page, 'fernbrook', 9, 9);
    expect(await page.evaluate(() => PixelPets.fbPlazaPhase())).toBe('held_glimmer');
    expect(await objAt(page, 'fbp_junior_bright')).toEqual([29, 15]);
    expect(await objAt(page, 'fbp_junior_bright_pet')).toEqual([28, 15]);
    expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
  });

  test('reduced motion: the arrest snaps through on whole tiles @w1', async ({ page }) => {
    test.setTimeout(180000);
    await boot(page, 'crackdown_street', { reduce: true });
    await leaveHall(page);
    let frac = null, gone = null;
    await drive(page, [], async text => {
      if (/^Out after my order/.test(text)) frac = await page.evaluate(() => PixelPets.mapObjs.filter(o => /^cd_|^fbp_junior/.test(o.id)).some(o => o.x % 1 || o.y % 1));
      if (text === LED_AWAY) gone = await ids(page);
    });
    expect(frac).toBe(false);
    expect(gone).not.toContain('fbp_junior_bright');
    expect((await page.evaluate(() => Object.assign({}, PixelPets.state.flags)))['story.post_trial_done']).toBe(true);
  });

  test("Fen's Glimmer-pick line: \"After last night,\" only after the crackdown", async ({ page }) => {
    test.setTimeout(90000);
    const day1 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data/detail_zz_day1.json'), 'utf8'));
    const plain = day1.lineSwaps.find(s => s.scene === 'orchard@glimmer' && s.when === 'story.seal1' && /Come to the Hall if you must/.test(s.text)).to[0][2];
    await boot(page);
    const fenLines = async flags => {
      await page.evaluate(f => { for (const [k, v] of Object.entries(f)) PixelPets.setFlag(k, v); }, flags);
      expect(await page.evaluate(() => PixelPets.runScene('orchard@glimmer'))).toBe(true);
      const out = [];
      await drive(page, [], async text => { if (/^Go on/.test(text)) out.push(text); });
      return out;
    };
    expect(await fenLines({ 'story.seal1': true, 'story.side': 'glimmer' })).toEqual([plain]);
    expect(await fenLines({ 'story.crackdown': true })).toEqual([AFTER_NIGHT]);
    expect(await fenLines({ 'story.seal1': null, 'story.crackdown': null })).toEqual(['Go on. Come to the Hall if you must. I\'ll stand for the orchard there.']);
    expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
  });
});
