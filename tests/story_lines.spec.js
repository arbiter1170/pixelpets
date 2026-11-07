/* STORY_LINES (Story, Nov 4, 2026; Vincent: "Round two: all defaults"; D2132-D2146). Copy only, plus one new choice and one
   new narration step: Juniper's Seal log (3b, D2132), the Hall door (D2133), Fen's orchard lines (D2134) and crackdown line
   (D2135), Rook's teaser (D2136), the Wickerglen slips and the Constable (D2137), the Governor (D2138), Ilse's calls, reminders
   and reports (D2139, D2140), Jacob Chi and his six jars (D2141, D2142), the Host before Ilse's letter (D2143), and the unease
   choice in glen_cleared@glimmer after Rook's "looked... empty" (D2144): "They did look empty." adds the second point of
   story.tour_unease (capped at 2), so a new save can hear Quinn's softer Tuning line and Rook's aside (D2145) at Testing;
   "Imogen says they're fine." adds nothing. The threshold stays 2. Narration says Host Amos (D2146).
   Save stays pixelpets.save.v2, v 2; story.tour_unease already ships; no new flag. Modern controls; reduced motion. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, shot } = require('./helpers');

trackErrors(test, expect);
test.use({ reducedMotion: 'reduce' });

const PROMPT = 'Rook looks at you.';
const AGREE = 'They did look empty.';
const COVER = "Imogen says they're fine.";
const ROOK_AGREE = "...Yeah. Empty. Okay. So it's not just me.";
const ROOK_COVER = 'Right. Imogen knows lamps. ...Sure she does.';
const QUINN_SOFT = "You look worried, sweetie. Some holders feel a flutter after. That's the bond. Nothing sharp. Nothing cold.";
const ROOK_ASIDE = "Nothing sharp? Who said anything about sharp? ...It's fine. They'll get stronger. I want that. I do.";
const QUINN_BASE = 'We call it increasing the bond between a holder and their Walkling. Nothing sharp. Nothing cold.';

// A lanyard Cadet on Route 2 (Glimmerwell cover, D1562), who has not yet cleared Wickerglen. `extra` adds Cobblecrest's flags
// so the same save can walk on to Testing.
function glenSave(extra) {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.textSpeed = 'fast';
  Object.assign(s.flags, {
    'story.side': 'glimmer', 'story.side_pick_done': true, 'story.seal1': true, 'story.slice_end': true,
    'story.reached_route2': true, 'story.keeper_cadet': true, 'story.cover': 'glimmer',
  }, extra || {});
  for (const [k, v] of Object.entries(s.flags)) if (v === null) delete s.flags[k];
  s.world = { map: 'route2', x: 8, y: 8, facing: 'right', respawn: 'fernbrook' };
  s.standing = { keepers: 0, glimmer: 10 };
  return s;
}
const COBBLE = { 'story.quarry_bought': true, 'story.reached_cobblecrest': true };

async function boot(page, save, search = '?debug=1', opts = {}) {
  await installSave(page.context(), save, { quietDay: true, oldSave: !!opts.oldSave });
  await gotoGame(page, search);
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && typeof PixelPets.runScene === 'function');
  await page.evaluate(() => PixelPets.showTab('walk'));
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
}
const flags = page => page.evaluate(() => Object.assign({}, PixelPets.state.flags));
const stored = page => page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
async function goto(page, map, x, y, facing) {
  await page.evaluate(([m, x, y, f]) => PixelPets.goto(m, x, y, f), [map, x, y, facing || 'down']);
  await page.waitForFunction(m => PixelPets.mapInfo.id === m && !PixelPets.fading, map);
}
// Plays the open scene to its end; a choice takes the first label in `picks` that is offered (else the first); returns every
// line as [speaker, text] and each choice as ['?', prompt, labels] then ['>', pick]. `onChoice` may read the box first.
async function drive(page, picks = [], onChoice = null, ms = 120000) {
  const until = Date.now() + ms, lines = [];
  let last = null;
  while (Date.now() < until) {
    const sc = await page.evaluate(() => PixelPets.scene && { mode: PixelPets.scene.mode, full: PixelPets.scene.full, waiting: PixelPets.scene.waiting, text: PixelPets.scene.text, who: PixelPets.scene.who });
    if (await page.locator('#ovBattle.seal-only').isVisible().catch(() => false)) { await page.locator('#btOk').click(); await page.waitForTimeout(40); continue; }
    if (!sc) { await page.waitForTimeout(150); if (!(await page.evaluate(() => !!PixelPets.scene))) return lines; continue; }
    if (sc.mode === 'choice') {
      if (!sc.full) { await page.keyboard.press('Space'); continue; }
      if (!(await page.locator('#sbChoices button:visible').count())) { await page.waitForTimeout(40); continue; }
      await page.waitForFunction(() => PixelPets.optionsReady === true);
      const labels = (await page.locator('#sbChoices button').allTextContents()).map(t => t.trim());
      lines.push(['?', sc.text, labels]);
      if (onChoice) await onChoice(sc.text, labels);
      const pick = picks.find(p => labels.includes(p)) || labels[0];
      lines.push(['>', pick]);
      await page.locator('#sbChoices button', { hasText: pick }).first().click();
      await page.waitForTimeout(40); continue;
    }
    if (sc.mode === 'say' && sc.waiting) {
      if (!sc.full) { await page.waitForTimeout(30); continue; }
      const key = sc.who + '|' + sc.text;
      if (key !== last) { lines.push([sc.who || '', sc.text]); last = key; }
      await page.keyboard.press('Space'); await page.waitForTimeout(30); continue;
    }
    await page.waitForTimeout(40);
  }
  throw new Error('scene did not end');
}
// The first line an object shows when tapped (a door's deny line, an NPC's keyed line), then plays it out.
async function firstLine(page, id) {
  expect(await page.evaluate(() => PixelPets.scene && PixelPets.scene.id), 'no scene is open before ' + id).toBeFalsy();
  expect(await page.evaluate(i => PixelPets.talkTo(i), id), id).toBe(true);
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
  const r = await page.evaluate(() => ({ who: PixelPets.scene.who || '', text: PixelPets.scene.text }));
  await drive(page);
  return r;
}
// Checks the choice box: two buttons, each at least 44 px tall and on screen, and a review shot at 390 and 320.
async function checkChoice(page, name) {
  const boxes = await page.locator('#sbChoices button').evaluateAll(bs => bs.map(b => { const r = b.getBoundingClientRect(); return { h: r.height, top: r.top, bottom: r.bottom, left: r.left, right: r.right }; }));
  const vp = page.viewportSize();
  expect(boxes.length).toBe(2);
  for (const b of boxes) {
    expect(b.h).toBeGreaterThanOrEqual(44);
    expect(b.top).toBeGreaterThanOrEqual(0);
    expect(b.bottom).toBeLessThanOrEqual(vp.height);
    expect(b.left).toBeGreaterThanOrEqual(0);
    expect(b.right).toBeLessThanOrEqual(vp.width);
  }
  if (vp.width === 390 || vp.width === 320) await shot(page, name);
}
async function playGlen(page, pick, shotName) {
  expect(await page.evaluate(() => PixelPets.sceneFor('glen_cleared'))).toBe('glen_cleared@glimmer');
  expect(await page.evaluate(() => PixelPets.runScene('glen_cleared'))).toBe(true);
  return drive(page, [pick], async (prompt) => { if (prompt === PROMPT && shotName) await checkChoice(page, shotName); });
}
async function playTesting(page) {
  await goto(page, 'cobblecrest', 4, 8, 'right');
  expect(await page.evaluate(() => PixelPets.runScene('hale_trial'))).toBe(true);
  return drive(page, ['Tune my partner']);
}
const rows = lines => lines.filter(l => l[0] !== '?' && l[0] !== '>');

test.describe('D2144: the unease choice in glen_cleared@glimmer', () => {
  for (const [pick, reply, gain] of [[AGREE, ROOK_AGREE, 1], [COVER, ROOK_COVER, 0]]) {
    test(`"${pick}" right after Rook's "looked... empty": Rook answers, unease +${gain}, the scene sets every flag`, async ({ page }) => {
      test.setTimeout(90000);
      await boot(page, glenSave({ 'story.tour_unease': 1 }));
      const before = await flags(page);
      const lines = await playGlen(page, pick, pick === AGREE ? 'story-lines-unease-choice' : null);
      const ask = lines.findIndex(l => l[0] === '?');
      expect(lines[ask]).toEqual(['?', PROMPT, [AGREE, COVER]]);
      expect(lines[ask - 1]).toEqual(['Rook', 'Proud. They looked... empty, Imogen.']);
      expect(lines[ask + 1]).toEqual(['>', pick]);
      expect(lines[ask + 2]).toEqual(['Rook', reply]);
      expect(lines[ask + 3]).toEqual(['Rook', 'They gave me treats to calm the units. You take them. You will use them.']);
      const f = await flags(page);
      expect(f['story.tour_unease']).toBe(1 + gain);
      expect(f['story.glen_cleared']).toBe(true);
      expect(f['story.rook_saw_lamps']).toBe(true);
      expect(await page.evaluate(() => PixelPets.state.bag.befriend_treat || 0)).toBe(3);
      // Only the glen's own flags and the unease point move; no new key.
      const added = Object.keys(f).filter(k => !(k in before)).sort();
      for (const k of added) expect(k, k).toMatch(/^(story\.(glen_cleared|rook_saw_lamps|tour_unease|beat\.glen_cleared)|standing\.got\.glen_g|daily\..+|journal\..+|seen\..+)$/);
      expect(await page.evaluate(() => PixelPets.questCheck)).toEqual([]);
      expect(await page.evaluate(() => PixelPets.glimmerCheck)).toEqual([]);
      expect((await stored(page)).v).toBe(2);
    });
  }

  test('a save already at 2 stays at 2 when it agrees (the cap)', async ({ page }) => {
    test.setTimeout(90000);
    await boot(page, glenSave({ 'story.tour_unease': 2 }));
    const lines = await playGlen(page, AGREE);
    expect(rows(lines)).toContainEqual(['Rook', ROOK_AGREE]);
    expect((await flags(page))['story.tour_unease']).toBe(2);
    expect((await stored(page)).flags['story.tour_unease']).toBe(2);
  });

  test('a new save: Juniper\'s log gives 1, agreeing with Rook gives 2, and Testing plays Quinn\'s softer line and Rook\'s aside', async ({ page }) => {
    test.setTimeout(150000);
    await boot(page, glenSave(COBBLE));
    expect((await flags(page))['story.tour_unease']).toBeFalsy();
    // D2132: the Seal log, with its new narration step before the flag.
    expect(await page.evaluate(() => PixelPets.runScene('pick_log'))).toBe(true);
    const pet = await page.evaluate(() => PixelPets.state.party[0].name || PixelPets.state.party[0].nick || '');
    const log = rows(await drive(page));
    expect(log.map(l => l[1])).toEqual([
      'Hold still, partner! Your Tier 1 Lanyard clips right onto your Fernbrook Seal. Snap!',
      'Now I log your Seal for the partnership file. One tap... done! Every single Seal counts, you know.',
      'A flash! Your photo goes up on the Pavilion wall, right beside the Sanctuary crate list.',
      log[3][1],
      "Gorgeous! You'll be the first face on the wall. Have a bright day!",
    ]);
    expect(log[3][0]).toBe('');
    expect(log[3][1]).toMatch(/^\S.* won't look at the camera\.$/);
    expect(log[3][1]).not.toContain('{pet}');
    if (pet) expect(log[3][1]).toContain(pet);
    expect((await flags(page))['story.tour_unease']).toBe(1);
    await playGlen(page, AGREE);
    expect((await flags(page))['story.tour_unease']).toBe(2);
    const testing = rows(await playTesting(page));
    const at = testing.findIndex(l => l[1] === QUINN_SOFT);
    expect(at, JSON.stringify(testing)).toBeGreaterThan(0);
    expect(testing[at][0]).toBe('Associate Quinn');
    expect(testing[at + 1]).toEqual(['Rook', ROOK_ASIDE]);
    expect(testing.some(l => l[1] === QUINN_BASE)).toBe(false);
    expect((await stored(page)).v).toBe(2);
  });

  test('a new save that holds its cover keeps 1 and hears Quinn\'s base line at Testing', async ({ page }) => {
    test.setTimeout(150000);
    await boot(page, glenSave(Object.assign({ 'story.tour1_s1': true, 'story.tour_unease': 1 }, COBBLE)));
    await playGlen(page, COVER);
    expect((await flags(page))['story.tour_unease']).toBe(1);
    const testing = rows(await playTesting(page));
    expect(testing).toContainEqual(['Associate Quinn', QUINN_BASE]);
    expect(testing.some(l => l[1] === QUINN_SOFT || l[1] === ROOK_ASIDE)).toBe(false);
  });

  test('old saves load unchanged: past the glen, a Tour save at 1 and at 2, and a Keepers save', async ({ page }) => {
    const kinds = [
      glenSave({ 'story.glen_cleared': true, 'story.rook_saw_lamps': true, 'story.tour_unease': 1 }),
      glenSave({ 'story.tour1_s1': true, 'story.tour1_s2': true, 'story.tour1_s3': true, 'story.tour_unease': 2, 'story.keeper_cadet': null, 'story.cover': null }),
      glenSave({ 'story.side': null, 'story.cover': null, 'story.keeper_cadet': null }),
    ];
    for (const s of kinds) {
      const ctx = await page.context().browser().newContext({ viewport: page.viewportSize(), reducedMotion: 'reduce' });
      const p = await ctx.newPage();
      const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
      await installSave(ctx, JSON.parse(JSON.stringify(s)), { quietDay: true, oldSave: true });
      await gotoGame(p, '?debug=1');
      await p.waitForFunction(() => window.PixelPets && PixelPets.debug === true);
      const f = await p.evaluate(() => Object.assign({}, PixelPets.state.flags));
      for (const k of ['story.tour_unease', 'story.glen_cleared', 'story.rook_saw_lamps', 'story.tour1_s1']) expect(f[k], k).toEqual(s.flags[k]);
      expect(await p.evaluate(() => PixelPets.state.v)).toBe(2);
      expect(await p.evaluate(() => PixelPets.questCheck)).toEqual([]);
      expect(errs).toEqual([]);
      await ctx.close();
    }
  });
});

test.describe('the lines show on their flags', () => {
  // A new-flow save after the crackdown night (as act1_keeper_join.spec.js seeds it).
  const NIGHT = {
    'story.reached_route1': true, 'story.rival1_done': true, 'story.reached_fernbrook': true, 'story.met_glimmerwell': true,
    'story.met_fen': true, 'story.crate_a': true, 'story.crate_b': true, 'story.crate_c': true, 'story.tally_done': true,
    'story.tl_amos': true, 'story.tl_juniper': true, 'story.tl_done': true, 'story.crates_seen': true, 'story.fen_sent_home': true,
    'story.mom_met': true, 'story.mom_chore': true, 'story.mom_sent': true, 'story.reached_mahopac': true, 'story.dream_woke': true,
    'story.class_sent': true, 'story.lizzy_met': true, 'story.lizzy_class': true, 'trainer.h1_cadet': true,
    'trainer.h1_challenger': true, 'trainer.h1_local': true, 'trainer.hall1_fen': true, 'story.seal1': true,
    'story.crackdown': true, 'story.hall1_shut': true, 'story.post_trial_done': true, 'story.fen_lean': 2, 'story.phone_got': true,
  };
  function nightSave(extra, world) {
    const s = starterSave();
    s.settings.controls = 'modern';
    s.settings.textSpeed = 'fast';
    Object.assign(s.flags, NIGHT, extra || {});
    for (const [k, v] of Object.entries(s.flags)) if (v === null) delete s.flags[k];
    s.world = Object.assign({ map: 'fernbrook', x: 12, y: 8, facing: 'down', respawn: 'fernbrook' }, world || {});
    s.standing = { keepers: 0, glimmer: 0 };
    s.seals = { seal_fernbrook: 1700000000000 };
    return s;
  }
  const set = (page, o) => page.evaluate(o => { for (const [k, v] of Object.entries(o)) PixelPets.setFlag(k, v); }, o);

  test('D2133, D2134: the Hall door and Fen at the orchard gate', async ({ page }) => {
    test.setTimeout(120000);
    await boot(page, nightSave());
    const before = await stored(page);
    // The door during the curfew (cordon up), then once the face is set (cordon gone).
    await goto(page, 'fernbrook', 22, 7, 'up');
    expect((await firstLine(page, 'fb_hall')).text).toBe('Shut by order of High Charity. A Keeper cordon blocks the door.');
    // Fen at the gate, each key in turn (first match wins).
    await goto(page, 'fernbrook', 10, 10, 'up');
    expect((await firstLine(page, 'fen_dawn')).text).toBe('The roots held through the night. So did we.');
    await set(page, { 'story.warden_called': true });
    expect((await firstLine(page, 'fen_dawn')).text).toBe('The Warden wants you home? Go. The gate will keep.');
    await set(page, { 'story.warden_met': true });
    expect((await firstLine(page, 'fen_dawn')).text).toBe("The Warden sent you east? Go on. The crates aren't going anywhere today.");
    await set(page, { 'story.chi_done': true });
    expect((await firstLine(page, 'fen_dawn')).text).toBe("Back from Wickerglen. Good. Step up to the gate, and we'll settle these crates.");
    await set(page, { 'story.orchard_lean': 'open' });
    expect((await firstLine(page, 'fen_dawn')).text).toBe("Tobin's by the cart. Show him what a strong team looks like.");
    // After the pick: the cordon is gone and the notice curls.
    await set(page, { 'story.side_pick_done': true, 'story.orchard_cleared': true });
    await goto(page, 'fernbrook', 22, 7, 'up');
    expect((await firstLine(page, 'fb_hall')).text).toBe('Shut by order of High Charity. The notice on the door has started to curl.');
    expect((await stored(page)).v).toBe(before.v);
  });

  test('D2133: old saves without story.hall1_shut read the High Charity line, and Fen\'s note while she is away', async ({ page }) => {
    test.setTimeout(90000);
    await boot(page, nightSave({ 'story.crackdown': null, 'story.hall1_shut': null, 'story.side_pick_done': true, 'story.orchard_cleared': true }), '?debug=1', { oldSave: true });
    await goto(page, 'fernbrook', 22, 7, 'up');
    expect((await firstLine(page, 'fb_hall')).text).toBe("Shut by order of High Charity. Master Fen's Hall stays closed for now.");
    // Before Seal 1 and before the class (Fen away, D1433): the door's note. Then June's line while the crates wait.
    await set(page, { 'story.seal1': null, 'story.side_pick_done': null, 'story.orchard_cleared': null, 'story.lizzy_class': null });
    expect((await firstLine(page, 'fb_hall')).text).toBe("The Hall is shut. A note on the door: 'Gone to see the Keepers. Back soon. Mind the roots. — Fen'");
    await set(page, { 'story.crates_seen': null });
    expect((await firstLine(page, 'fb_hall')).text).toBe('The Hall is shut for now. Tobin could use a hand with his crates first.');   // June's, kept
  });

  test('D2137, D2139: the Wickerglen slips, the Constable and Ilse\'s Lodge reminders', async ({ page }) => {
    test.setTimeout(120000);
    await boot(page, nightSave({ 'story.warden_called': true, 'story.warden_met': true, 'story.chi_met': true, 'story.ilse_call2': true, 'story.reached_route2': true, 'story.met_census': true, 'story.reached_glen': true }));
    await goto(page, 'route2_glen', 12, 17, 'up');
    expect((await firstLine(page, 'glen_lamp_w')).text).toBe('A Keeper slip on the post: LAMP CLOSED FOR REVIEW. The lamp still hums.');
    expect((await firstLine(page, 'glen_lamp_n')).text).toBe('The same Keeper slip: CLOSED FOR REVIEW. Someone has wiped the lens anyway.');
    expect((await firstLine(page, 'glen_lamp_e')).text).toBe('A Keeper slip, already curling at the corners: CLOSED FOR REVIEW.');
    expect((await firstLine(page, 'glen_constable')).text).toBe("Orders came down. The lamps are under review. Don't ask me how long.");
    await set(page, { 'story.keeper_cadet': true, 'story.heights_done': true });
    await goto(page, 'route2_glen', 12, 17, 'up');
    for (const id of ['glen_lamp_w', 'glen_lamp_n', 'glen_lamp_e']) expect((await firstLine(page, id)).text).toBe('The slip is gone. Fresh paint, and a brass plate: BY PERMIT OF HIGH CHARITY.');
    // The Lodge, between beats.
    await set(page, { 'story.keeper_cadet': null, 'story.heights_done': null, 'story.ilse_call2': null });
    await goto(page, 'hm_lodge_in', 5, 5);
    expect((await firstLine(page, 'ilse_lodge_after')).text).toBe('Jacob Chi will want both shifts: the day crew and the dusk watch. Go and look.');
    await set(page, { 'story.orchard_lean': 'pack' });
    expect((await firstLine(page, 'ilse_lodge_after')).text).toBe("Not yet. Mind the orchard, and I'll send for you when it's time.");
  });

  test('D2139, D2146: with no Keeper1, Host Amos brings the second call and a runner brings the recall', async ({ page }) => {
    test.setTimeout(90000);
    await boot(page, nightSave({ 'story.phone_got': null, 'story.warden_called': true, 'story.warden_met': true, 'story.chi_done': true }, { map: 'fernbrook', x: 12, y: 8 }));
    expect(await page.evaluate(() => PixelPets.runScene('ilse_call2'))).toBe(true);
    let lines = rows(await drive(page));
    expect(lines[0]).toEqual(['', 'Host Amos hurries up from the Lantern House, out of breath.']);
    expect(lines.some(l => /Keeper Amos/.test(l[1]))).toBe(false);
    expect(await page.evaluate(() => PixelPets.runScene('ilse_recall_call'))).toBe(true);
    lines = rows(await drive(page));
    expect(lines[0]).toEqual(['', 'A Lantern House runner finds you with a folded note. Two words: COME HOME. And an I.']);
  });

  test('D2142: six, not eleven; D2135, D2134, D2138, D2139-D2141, D2143 sit in their branches', async ({ page }) => {
    await boot(page, nightSave());
    const r = await page.evaluate(() => {
      const says = id => { const out = []; const walk = n => { if (Array.isArray(n)) { if (n[0] === 'say') out.push(n[2]); n.forEach(walk); } }; walk(PixelPets.sceneScript(id)); return out; };
      const branch = (id, cond, yes) => { let hit = null; const walk = n => { if (!Array.isArray(n)) return; if (n[0] === 'if' && n[1] === cond) hit = (yes ? n[2] : n[3]) || []; n.forEach(walk); }; walk(PixelPets.sceneScript(id)); return hit && JSON.stringify(hit); };
      const all = []; const walk = n => { if (Array.isArray(n)) { if (n[0] === 'say' && typeof n[2] === 'string') all.push(n[2]); n.forEach(walk); } else if (n && typeof n === 'object') Object.values(n).forEach(walk); };
      walk(MAPDATA.detail_zz_keeper_join);
      const hub = JSON.stringify(PixelPets.sceneScript('chi_hub'));
      return {
        chi: says('chi_meet'), report: says('chi_report')[0], hub,
        eleven: all.filter(t => /\beleven\b/i.test(t)),
        seal1: PixelPets.sceneScript('seal1').filter(s => s[0] === 'say' && s[1] === 'Master Fen').map(s => s[2]),
        orchard: JSON.stringify(PixelPets.sceneScript('orchard@glimmer')),
        enrol: branch('enrol', 'enrol:ask', false),
        rpt1: says('rpt_1')[0], rpt2: says('rpt_2')[0],
        host: MAPDATA.detail_zz_walk_beside.hostNotes[0].line,
        jarsMax: MAPDATA.detail_zz_keeper_join.flags && MAPDATA.detail_zz_keeper_join.flags['story.chi_jars'],
      };
    });
    expect(r.chi).toContain('Six glass jars on the sill. He drops a pressed leaf into the first one.');
    expect(r.chi).toContain('Six Walklings gone from Wickerglen this month. A jar for each. I fill one when I can prove it.');
    expect(r.eleven).toEqual([]);
    expect(r.report).toBe("Well? Tell me what you saw. All of it. I'll log it.");
    expect(r.hub).toContain('["if","story.lean_keep>=2",[["say","Vincent Chi","You kept your hands steady and your eyes open. That\'s the whole job."]],[["say","Vincent Chi","You asked where they didn\'t want you asking. That\'s the whole job."]]]');
    expect(r.seal1).toContain("Go on out, {name}. Let Fernbrook see that Seal. I'll put the roots to bed and follow you.");
    expect(r.seal1.some(t => /get some air/.test(t))).toBe(false);
    expect(r.orchard).toContain('"story.seal1",[["say","","Fen turns back to her trees without a word. The cart rolls off toward the east road."]]');
    expect(r.enrol).toContain("So. You'll wear their lanyard where everyone can see it, and you'll tell me what they do.");
    expect(r.rpt1).toBe("Ilse's letter asks one thing, in her small, exact hand: what did you see?");
    expect(r.rpt2).toBe(r.rpt1);
    expect(r.host).toBe("A letter for you, sealed with the Warden's lantern. No reply wanted, this time.");
  });

  test('D2138: the Governor\'s line 6 and his line for a holder with no posting (city preview)', async ({ page }) => {
    await boot(page, nightSave(), '?debug=1');
    const g = await page.evaluate(() => {
      const V = window.PP_HC_V2;
      const gov = V.rooms.hc_gov_1.objs.find(o => o.id === 'hc_governor');
      return { meet: V.scenes.hc_gov_meet.filter(s => s[0] === 'say').map(s => s[2]), lines: gov.lines };
    });
    expect(g.meet).toContain('Go and look. Listen more than you talk. Then come back and tell me what you found, in plain words.');
    expect(g.lines.else).toBe("Without an appointment? I'm afraid even I need one of those, most days.");
    expect(g.lines['story.km_assigned']).toBe("Kilnmouth's springs, and the empty seat. Come back when you know more.");
    expect(JSON.stringify(g)).not.toMatch(/PLACEHOLDER|\bSit\b/);
  });

  test('every new line fits: say 110, choice labels 30, straight quotes, no double space, no banned words', async ({ page }) => {
    await boot(page, nightSave());
    const NEW = [ROOK_AGREE, ROOK_COVER, QUINN_SOFT, ROOK_ASIDE, PROMPT,
      'Now I log your Seal for the partnership file. One tap... done! Every single Seal counts, you know.', "{pet} won't look at the camera.",
      "Gorgeous! You'll be the first face on the wall. Have a bright day!", 'Shut by order of High Charity. The notice on the door has started to curl.',
      "Shut by order of High Charity. Master Fen's Hall stays closed for now.", "The Hall is shut. A note on the door: 'Gone to see the Keepers. Back soon. Mind the roots. — Fen'",
      "Tobin's by the cart. Show him what a strong team looks like.", "Back from Wickerglen. Good. Step up to the gate, and we'll settle these crates.",
      'The Warden wants you home? Go. The gate will keep.', "The Warden sent you east? Go on. The crates aren't going anywhere today.",
      'Fen turns back to her trees without a word. The cart rolls off toward the east road.',
      "Go on out, {name}. Let Fernbrook see that Seal. I'll put the roots to bed and follow you.",
      "Yeah, I'm in too. Since spring. Late on Partner Day, the jingle, the wine sticker: that was all them.",
      'The same Keeper slip: CLOSED FOR REVIEW. Someone has wiped the lens anyway.', 'A Keeper slip, already curling at the corners: CLOSED FOR REVIEW.',
      'The slip is gone. Fresh paint, and a brass plate: BY PERMIT OF HIGH CHARITY.', "Orders came down. The lamps are under review. Don't ask me how long.",
      'Go and look. Listen more than you talk. Then come back and tell me what you found, in plain words.',
      "Without an appointment? I'm afraid even I need one of those, most days.", 'Host Amos hurries up from the Lantern House, out of breath.',
      'A Lantern House runner finds you with a folded note. Two words: COME HOME. And an I.',
      'Jacob Chi will want both shifts: the day crew and the dusk watch. Go and look.', "Not yet. Mind the orchard, and I'll send for you when it's time.",
      "So. You'll wear their lanyard where everyone can see it, and you'll tell me what they do.",
      "Ilse's letter asks one thing, in her small, exact hand: what did you see?",
      'Six glass jars on the sill. He drops a pressed leaf into the first one.',
      'Six Walklings gone from Wickerglen this month. A jar for each. I fill one when I can prove it.',
      "Well? Tell me what you saw. All of it. I'll log it.", "You kept your hands steady and your eyes open. That's the whole job.",
      "You asked where they didn't want you asking. That's the whole job.", "A letter for you, sealed with the Warden's lantern. No reply wanted, this time."];
    for (const t of NEW) {
      expect(Array.from(t).length, t).toBeLessThanOrEqual(110);
      expect(t, t).not.toMatch(/\s{2}|[‘’“”]|\b(faint(ed)?|evolv\w*|coins?|appeared|trainers?|rivals?|chips?|implant|subject|specimen)\b|go, [a-z]+!|[a-z]+dex\b/i);
      expect((t.match(/\{(\w+)\}/g) || []).every(k => k === '{name}' || k === '{pet}'), t).toBe(true);
    }
    for (const label of [AGREE, COVER]) expect(label.length).toBeLessThanOrEqual(30);
    // Each line is in the merged game data exactly once or more (none was lost on the way in).
    const blob = await page.evaluate(() => JSON.stringify(MAPDATA) + JSON.stringify(window.PP_HC_V2 || {}));
    for (const t of NEW) expect(blob.includes(JSON.stringify(t).slice(1, -1)), t).toBe(true);
  });
});
