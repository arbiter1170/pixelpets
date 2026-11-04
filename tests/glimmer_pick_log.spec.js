/* D1436 (STORY v0.7.15 §8 row 7): a new-flow save never takes the Bright Pavilion Tour, so at a Glimmer pick, right after
   the Tier 1 lanyard is handed over, Associate Juniper clips it to the Fernbrook Seal, logs the Seal and takes the holder's
   photo for the wall beside the Sanctuary crate list (data/detail_zz_pick_log.json, PLACEHOLDER copy). The beat sets
   story.tour1_s1 (the flag the photo news reads) and adds 1 to story.tour_unease. The "Bright Pavilion Tour ends with..."
   news needs story.tour1_s3, so only a save that took the Tour sees it. A save with Tour flags never plays the beat and
   never gains a second point; a Keepers pick never reaches it. Save stays pixelpets.save.v2, flags additive only. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, shot } = require('./helpers');

trackErrors(test, expect);

const BEAT = [
  ['Associate Juniper', 'Hold still, partner! Your Tier 1 Lanyard clips right onto your Fernbrook Seal. Snap!'],
  ['Associate Juniper', 'Now I just log your Seal for the partnership file. One tap... done! Every Seal counts.'],
  ['', 'A flash! Your photo goes up on the Pavilion wall, right beside the Sanctuary crate list.'],
  ['Associate Juniper', 'Gorgeous! Brighter by nature. Have a bright day!'],
];
const WELCOME = /^Yay! Welcome to the partnership, .+! Brighter by nature\.$/;
// ACT1_KEEPER_JOIN (D1553): the beat moved from the Glimmer pick to Juniper's lanyard step (enrol_lanyard), after Ilse's
// enrolment on the lanyard face. The line after the beat is the handset (the old pick's Tobin line is retired).
const TOBIN = 'Juniper presses a thin handset into your hand. No crest. It still sits on their wires.';
const GLIMMER = [];
const KEEPERS = [];   // D1562: the enrolment asks nothing
const LANYARD = { 'story.orchard_lean': 'pack', 'story.orchard_cleared': true, 'story.sway_fernbrook': -2, 'story.ilse_call2': true, 'story.keeper_cadet': true, 'story.cover': 'glimmer' };

// A new-flow save standing at the orchard gate: Day 1, Lizzy's class, the three holders, Fen's Seal and the post-Trial slot.
const AT_PICK = {
  'story.reached_route1': true, 'story.rival1_done': true, 'story.reached_fernbrook': true, 'story.met_glimmerwell': true,
  'story.met_fen': true, 'story.crate_a': true, 'story.crate_b': true, 'story.crate_c': true, 'story.tally_done': true,
  'story.tl_amos': true, 'story.tl_juniper': true, 'story.tl_done': true, 'story.crates_seen': true, 'story.fen_sent_home': true,
  'story.mom_met': true, 'story.mom_chore': true, 'story.mom_sent': true, 'story.reached_mahopac': true, 'story.dream_woke': true,
  'story.class_sent': true, 'story.lizzy_met': true, 'story.lizzy_class': true, 'trainer.h1_cadet': true,
  'trainer.h1_challenger': true, 'trainer.h1_local': true, 'trainer.hall1_fen': true, 'story.seal1': true,
  'story.post_trial_done': true,
};
function pickSave(extra) {
  const s = starterSave();
  s.settings.controls = 'modern';
  Object.assign(s.flags, AT_PICK, extra || {});
  s.world = { map: 'fernbrook', x: 9, y: 9, facing: 'down', respawn: 'fernbrook' };
  s.standing = { keepers: 0, glimmer: 0 };
  s.seals = { seal_fernbrook: 1700000000000 };
  s.money = 40;
  return s;
}
async function boot(page, save) {
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && typeof PixelPets.talkTo === 'function');
  await page.evaluate(() => PixelPets.showTab('walk'));
}
const flags = page => page.evaluate(() => Object.assign({}, PixelPets.state.flags));
const stored = page => page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));

// Plays the open scene to its end like helpers.playScene, and records every line as [speaker, text]. `onLine` runs once
// per line while it is fully shown (screenshots).
async function playLogged(page, choices, onLine) {
  const lines = [], left = choices.slice();
  for (let i = 0; i < 300; i++) {
    const sc = await page.evaluate(() => { const s = PixelPets.scene; return s && { mode: s.mode, full: s.full, waiting: s.waiting, text: s.text, who: s.who }; });
    if (!sc) return lines;
    const sealUp = await page.locator('#ovBattle.seal-only').isVisible().catch(() => false);
    if (sealUp) { await page.locator('#btOk').click(); await page.waitForTimeout(40); continue; }
    if (sc.mode === 'choice') {
      if (!sc.full) { await page.keyboard.press('Space'); continue; }
      if (!(await page.locator('#sbChoices button:visible').count())) { await page.waitForTimeout(40); continue; }
      await page.waitForFunction(() => PixelPets.optionsReady === true);
      const label = left.shift();
      if (label == null) throw new Error('scene asked "' + sc.text + '" with no answer left');
      await page.locator('#sbChoices button', { hasText: label }).first().click();
      await page.waitForTimeout(40);
      continue;
    }
    if (sc.mode === 'say') {
      if (!sc.waiting) { await page.waitForTimeout(40); continue; }
      if (!sc.full) { await page.keyboard.press('Space'); await page.waitForTimeout(40); continue; }
      lines.push([sc.who || '', sc.text]);
      if (onLine) await onLine(sc.who || '', sc.text);
      await page.keyboard.press('Space');
      await page.waitForTimeout(40);
      continue;
    }
    await page.waitForTimeout(60);
  }
  throw new Error('scene did not end');
}
// Which of the named news stories this save's flags let through (the same reader news.js uses).
const newsOpen = (page, ids) => page.evaluate((ids) => {
  const f = PixelPets.state.flags, side = f['story.side'] === 'glimmer' ? 'glimmer' : 'keepers';
  const all = [].concat(MAPDATA.news.stories || [], MAPDATA.news.you || []);
  return Object.fromEntries(ids.map(id => { const x = all.find(s => s.id === id); return [id, !!x && PPRibbit.passes(x.when, f, side)]; }));
}, ids);
const beatAt = (lines) => lines.findIndex(l => l[1] === BEAT[0][1]);

for (const reduce of [false, true]) {
  test(`new save, Glimmer pick: Juniper logs the Seal, the photo goes up, unease +1${reduce ? ' (reduced motion)' : ''}`, async ({ page }) => {
    test.setTimeout(90000);
    if (reduce) await page.emulateMedia({ reducedMotion: 'reduce' });
    const save = pickSave(LANYARD);
    await boot(page, save);
    if (reduce) expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
    const before = await flags(page);
    expect(before['story.tour1_s1']).toBeFalsy();
    expect(before['story.tour_unease']).toBeFalsy();
    // The real body: Juniper by her stand (no crackdown on this save), keyed on the lanyard face.
    await page.evaluate(() => PixelPets.goto('fernbrook', 14, 7, 'up'));
    expect(await page.evaluate(() => PixelPets.talkTo('juniper'))).toBe(true);
    await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.id === 'enrol_lanyard');
    const w = page.viewportSize().width;
    const lines = await playLogged(page, GLIMMER, async (who, text) => {
      if (reduce || (w !== 390 && w !== 320)) return;
      if (text === BEAT[0][1]) await shot(page, 'pick-log-lanyard');
      if (text === BEAT[2][1]) await shot(page, 'pick-log-photo');
      if (text === TOBIN) await shot(page, 'pick-log-tobin');
    });
    // The beat plays once, in order, right after the welcome (where the lanyard is handed over) and before Tobin's line.
    const at = beatAt(lines);
    expect(at).toBeGreaterThan(0);
    expect(lines.slice(at, at + BEAT.length)).toEqual(BEAT);
    expect(lines[at - 1][0]).toBe('Associate Juniper');
    expect(lines[at - 1][1]).toMatch(WELCOME);
    expect(lines[at + BEAT.length]).toEqual(['', TOBIN]);
    expect(lines.filter(l => l[1] === BEAT[2][1]).length).toBe(1);
    // Flags: the photo flag and one point of unease; the lanyard sits beside the Seal.
    const f = await flags(page);
    expect(f['story.side']).toBe('glimmer');
    expect(f['story.tour1_s1']).toBe(true);
    expect(f['story.tour_unease']).toBe(1);
    expect(f['story.tour1_s2']).toBeFalsy();
    expect(f['story.tour1_s3']).toBeFalsy();
    expect(await page.evaluate(() => Object.keys(PixelPets.state.seals).sort())).toEqual(['seal_fernbrook', 'seal_glim_1']);
    // The photo news is eligible; the Tour news is not. The Tour's later stops stay off on this save.
    expect(await newsOpen(page, ['nw-fernbrook-wall', 'yo-pavilionwall', 'nw-fernbrook-seal-g']))
      .toEqual({ 'nw-fernbrook-wall': true, 'yo-pavilionwall': true, 'nw-fernbrook-seal-g': false });
    for (const id of ['fb_tour1', 'fb_tour2', 'fb_tour3']) expect(await page.evaluate(i => PixelPets.gateRead('fernbrook', i).whenOk, id)).toBe(false);
    // Replaying the beat adds nothing.
    expect(await page.evaluate(() => PixelPets.runScene('pick_log'))).toBe(true);
    expect(await playLogged(page, [])).toEqual([]);
    expect((await flags(page))['story.tour_unease']).toBe(1);
    // Save: v 2, every flag the save had is still there with its value or the pick's, and nothing was removed.
    const s = await stored(page);
    expect(s.v).toBe(2);
    for (const k of Object.keys(save.flags)) expect(s.flags, k).toHaveProperty([k]);
    expect(s.flags['story.tour1_s1']).toBe(true);
    expect(s.flags['story.tour_unease']).toBe(1);
    for (const k of Object.keys(save)) expect(s, k).toHaveProperty([k]);
    expect(await page.evaluate(() => PixelPets.questCheck)).toEqual([]);
  });
}

test('a save that already took the Tour: no beat at the pick and no second point of unease', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page, pickSave(Object.assign({ 'story.tour1_s1': true, 'story.tour1_s2': true, 'story.tour1_s3': true, 'story.tour_unease': 2 }, LANYARD)));
  expect(await page.evaluate(() => PixelPets.runScene('enrol_lanyard'))).toBe(true);
  const lines = await playLogged(page, GLIMMER);
  expect(beatAt(lines)).toBe(-1);
  expect(lines.some(l => l[1] === BEAT[2][1])).toBe(false);
  const iw = lines.findIndex(l => WELCOME.test(l[1]));
  expect(iw).toBeGreaterThanOrEqual(0);
  expect(lines[iw + 1]).toEqual(['', TOBIN]);
  const f = await flags(page);
  expect(f['story.tour_unease']).toBe(2);
  expect(f['story.side']).toBe('glimmer');
  // The Tour news and the photo news both still read on a Tour save.
  expect(await newsOpen(page, ['nw-fernbrook-wall', 'nw-fernbrook-seal-g'])).toEqual({ 'nw-fernbrook-wall': true, 'nw-fernbrook-seal-g': true });
  expect((await stored(page)).v).toBe(2);
});

test('an old Tour save (the photo already raised unease) keeps its count if the beat ever runs', async ({ page }) => {
  const s = pickSave({ 'story.side': 'glimmer', 'story.side_pick_done': true, 'story.orchard_cleared': true, 'story.heights_done': true,
    'story.tour1_s1': true, 'story.tour1_s2': true, 'story.tour1_s3': true, 'story.tour_unease': 1 });
  s.seals.seal_glim_1 = 1700000000000;
  await boot(page, s);
  expect(await page.evaluate(() => PixelPets.runScene('pick_log'))).toBe(true);
  expect(await playLogged(page, [])).toEqual([]);
  expect((await flags(page))['story.tour_unease']).toBe(1);
  expect(await newsOpen(page, ['nw-fernbrook-wall', 'yo-pavilionwall', 'nw-fernbrook-seal-g']))
    .toEqual({ 'nw-fernbrook-wall': true, 'yo-pavilionwall': true, 'nw-fernbrook-seal-g': true });
});

test('the enrolment alone: no Juniper beat, no photo flag, no unease (the beat is Juniper\'s step only)', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page, pickSave({ 'story.orchard_lean': 'open', 'story.orchard_cleared': true, 'story.ilse_call2': true }));
  expect(await page.evaluate(() => PixelPets.runScene('enrol'))).toBe(true);
  const lines = await playLogged(page, KEEPERS);
  expect(beatAt(lines)).toBe(-1);
  expect(lines.some(l => BEAT.some(b => b[1] === l[1]))).toBe(false);
  const f = await flags(page);
  expect(f['story.keeper_cadet']).toBe(true);
  expect(f['story.side_pick_done']).toBeFalsy();
  expect(f['story.side']).not.toBe('glimmer');
  expect(f['story.tour1_s1']).toBeFalsy();
  expect(f['story.tour_unease']).toBeFalsy();
  expect(await page.evaluate(() => Object.keys(PixelPets.state.seals))).toEqual(['seal_fernbrook']);
  expect((await stored(page)).v).toBe(2);
});

test('copy: the beat is PLACEHOLDER, fits 110, keeps the Glimmerwell voice and no banned words', async ({ page }) => {
  await boot(page, pickSave());
  const d = await page.evaluate(() => ({ file: MAPDATA.detail_zz_pick_log }));
  expect(d.file._placeholders.note).toMatch(/^PLACEHOLDER/);
  expect(d.file._placeholders.paths).toEqual(['scenes.pick_log']);
  const says = [];
  const walk = n => { if (Array.isArray(n)) { if (n[0] === 'say') says.push([n[1], n[2]]); n.forEach(walk); } };
  walk(d.file.scenes.pick_log);
  expect(says).toEqual(BEAT);
  for (const [, text] of says) {
    expect(text.length).toBeLessThanOrEqual(110);
    expect(text).not.toMatch(/\b(chips?|chipped|relays?|melt\w*|why|fainted|evolv\w*|coins?|appeared|trainer|alien)\b|dex\b|\s{2}/i);
  }
  // The hook sits inside the Seal branch of Juniper's lanyard step, right after the lanyard (D1553).
  const hook = await page.evaluate(() => MAPDATA.detail_zz_keeper_join.scenes.enrol_lanyard);
  expect(JSON.stringify(hook)).toContain('["if","story.seal1",[["seal","seal_glim_1"],["run","pick_log"]]]');
});
