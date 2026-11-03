/* DAY1_TRIAL1_FLOW v0.4 (handoff/specs/DAY1_TRIAL1_FLOW.md; Vincent, Nov 2, 2026; D1166-D1171, D1175).
   One new-flow save from the crates to the pick, a tap at a time: FPT Part A (crates, Fen with Russet, Two Lights,
   Fen at dusk), Fen's go-home talk, Mom's trip (the main card mirrors it) and Mom's ask, Lizzy's class, the Hall door,
   the three holders, Fen, the post-Trial slot (D1175), the pick and Fernbrook's flip. Saves stay pixelpets.save.v2. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, playScene } = require('./helpers');

trackErrors(test, expect);

function fernSave(extra, world) {
  const s = starterSave();
  s.settings.controls = 'modern';
  Object.assign(s.flags, { 'story.reached_route1': true, 'story.rival1_done': true, 'story.reached_fernbrook': true, 'story.met_glimmerwell': true, 'story.met_fen': true }, extra || {});
  s.world = world || { map: 'fernbrook', x: 12, y: 8, facing: 'down', respawn: 'fernbrook' };
  s.standing = { keepers: 0, glimmer: 0 };
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
const quest = page => page.evaluate(() => { const q = PixelPets.quest; return q && { id: q.id, target: q.target }; });
async function talk(page, id, choices) {
  expect(await page.evaluate(i => PixelPets.talkTo(i), id)).toBe(true);
  await playScene(page, choices || []);
}
async function stepInto(page, map, x, y, dir, choices) {
  await page.evaluate(({ map, x, y }) => PixelPets.goto(map, x, y), { map, x, y });
  await page.evaluate(d => PixelPets.walkStep(d), dir);
  await page.waitForFunction(() => !!PixelPets.scene);
  await playScene(page, choices || []);
}
// A holder's match from the first tap to the walk screen: lines, an optional panel choice, the battle (won at once), the
// end panel, the Seal card and the win scene.
async function fight(page, id, choices) {
  expect(await page.evaluate(i => PixelPets.talkTo(i), id)).toBe(true);
  const left = (choices || []).slice();
  for (let i = 0; i < 160 && !(await page.evaluate(() => !!(PixelPets.battle && PixelPets.battle.on && PixelPets.battle.state === 'CHOOSE'))); i++) {
    const st = await page.evaluate(() => ({ s: PixelPets.scene && { mode: PixelPets.scene.mode, waiting: PixelPets.scene.waiting, full: PixelPets.scene.full }, ready: PixelPets.optionsReady, b: !!(PixelPets.battle && PixelPets.battle.on) }));
    if (st.s && st.s.mode === 'choice' && st.s.full && st.ready && left.length) await page.locator('#sbChoices button', { hasText: left.shift() }).first().click();
    else if (st.s && st.s.mode === 'choice' && !st.s.full) await page.keyboard.press('Space');
    else if (st.s && st.s.mode === 'say' && st.s.waiting) await page.keyboard.press('Space');
    else if (st.b) await page.locator('#btMsg').click().catch(() => {});
    await page.waitForTimeout(60);
  }
  await page.evaluate(() => PixelPets.winBattle());
  for (let i = 0; i < 120; i++) {
    const st = await page.evaluate(() => ({ b: !!(PixelPets.battle && PixelPets.battle.on), panel: PixelPets.battle && PixelPets.battle.panel, scene: !!PixelPets.scene }));
    const sealUp = await page.locator('#ovBattle.seal-only').isVisible().catch(() => false);
    if (!st.b && !st.scene && !sealUp) break;
    if (sealUp) await page.locator('#btOk').click();
    else if (st.b && st.panel === 'end') await page.locator('#btOk').click();
    else if (st.b) await page.locator('#btMsg').click().catch(() => {});
    else await playScene(page, []);
    await page.waitForTimeout(80);
  }
}
async function saveV(page) { return page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')).v); }

test('Day 1: three crates, Two Lights with the wick, Fen at dusk, then her go-home talk', async ({ page }) => {
  test.setTimeout(120000);
  await boot(page, fernSave());
  expect((await quest(page)).id).toBe('crates');
  // The pick trigger at the orchard gate is off: it waits for Seal 1, the class and the post-Trial slot.
  const gate = await page.evaluate(() => PixelPets.gateRead('fernbrook', 'fb_side_pick'));
  expect(gate.whenOk).toBe(false);
  // Tobin is the tally (no battle before the pick); the Hall door is shut with June's line.
  expect(await page.evaluate(() => PixelPets.gateRead('fernbrook', 'fern_associate').whenOk)).toBe(false);
  expect(await page.evaluate(() => PixelPets.gateRead('fernbrook', 'fb_hall').needOk)).toBe(false);
  await talk(page, 'fb_crate_a', ['Stack it']);
  await talk(page, 'fb_crate_b', ['Listen at it']);
  await talk(page, 'fb_crate_c', ['Stack it']);
  let f = await flags(page);
  expect(f['story.tally_done']).toBe(true);
  expect(f['story.lean_fix']).toBe(2);
  expect(f['story.lean_keep']).toBe(1);
  expect((await quest(page)).id).toBe('tl_amos');
  // TL-2: Amos's dark window, then the cot in the dark.
  await stepInto(page, 'fb_lantern_in', 5, 14, 'up');
  expect((await flags(page))['story.tl_amos']).toBe(true);
  await talk(page, 'fb_burrsnout');
  expect((await flags(page))['story.tl_cot']).toBe(true);
  // TL-3 on the square: Juniper's free lantern.
  await stepInto(page, 'fernbrook', 5, 6, 'down');
  expect((await flags(page))['story.tl_juniper']).toBe(true);
  // No wick yet: the choice offers "I'll fetch a wick first", which leaves the step open.
  await stepInto(page, 'fb_lantern_in', 5, 14, 'up', ["I'll fetch a wick first"]);
  expect((await flags(page))['story.tl_done']).toBeFalsy();
  expect((await quest(page)).id).toBe('tl_light');
  // Wynne sells the wick (8 Acorns). Walking back in plays TL-4 again; hang the wick.
  expect(await page.evaluate(() => PixelPets.buyItem('lantern_wick').ok)).toBe(true);
  await stepInto(page, 'fb_lantern_in', 5, 14, 'up', ["Hang Amos's wick"]);
  f = await flags(page);
  expect(f['story.tl_done']).toBe(true);
  expect(f['story.wick_done']).toBe(true);
  expect(f['story.lean_keep']).toBe(2);
  expect(await page.evaluate(() => (PixelPets.state.bag || {}).lantern_wick || 0)).toBe(0);
  // A6 and A7: Fen at dusk, the night at the Lantern House, then her potential and go-home talk in the morning.
  expect((await quest(page)).id).toBe('fen_dusk');
  await page.evaluate(() => PixelPets.goto('fernbrook', 10, 10, 'up'));
  await talk(page, 'fen_orchard');
  f = await flags(page);
  expect(f['story.crates_seen']).toBe(true);
  expect(f['story.fen_sent_home']).toBe(true);
  expect(f['story.class_sent']).toBeFalsy();
  // Fen is gone from the orchard and the Hall; her whereabouts say she is away; the door says so too.
  expect(await page.evaluate(() => PixelPets.gateRead('fernbrook', 'fen_orchard').whenOk)).toBe(false);
  expect(await page.evaluate(() => PixelPets.gateRead('fb_hall_in', 'fen_hall').whenOk)).toBe(false);
  expect(await page.evaluate(() => PixelPets.whereNow('Master Fen').place)).toBe('away on Keeper business');
  expect(await page.evaluate(() => PixelPets.gateRead('fernbrook', 'fb_hall').needOk)).toBe(false);
  expect((await quest(page)).id).toBe('home_trip');
  expect(await saveV(page)).toBe(2);
  expect(await page.evaluate(() => PixelPets.questCheck)).toEqual([]);
});

const AFTER_FEN = { 'story.crate_a': true, 'story.crate_b': true, 'story.crate_c': true, 'story.tally_done': true, 'story.tl_amos': true, 'story.tl_juniper': true, 'story.tl_done': true, 'story.crates_seen': true, 'story.fen_sent_home': true };

test("Home: the main card mirrors Mom's trip, Mom asks after the dream, Lizzy's class opens the Hall door", async ({ page }) => {
  test.setTimeout(120000);
  await boot(page, fernSave(AFTER_FEN, { map: 'hm_home_up', x: 5, y: 5, facing: 'up', respawn: 'hearthmoor' }));
  let q = await page.evaluate(() => { const q = PixelPets.quest; return { id: q.id, mirrorOf: q.mirrorOf, text: q.text }; });
  expect(q).toMatchObject({ id: 'home_trip', mirrorOf: 'mom' });
  // The Mom's trip side card is not shown twice while the main card mirrors it.
  expect(await page.evaluate(() => PixelPets.sideActive.map(a => a.chain))).not.toContain('mom');
  // Mid-trip (Mahopac reached) Fen's talk does not skip Mom's ask; only the dream does (R8). Jump to the dream's end.
  for (const k of ['story.mom_met', 'story.mom_chore', 'story.mom_sent', 'story.reached_mahopac', 'story.dream_started', 'story.dream_toy', 'story.dream_party', 'story.dream_dad'])
    await page.evaluate(f => PixelPets.setFlag(f), k);
  expect(await page.evaluate(() => PixelPets.quest.mirrorOf)).toBe('dream_wake');
  expect(await page.evaluate(() => PixelPets.runScene('mom_wake'))).toBe(true);
  await playScene(page, ['It felt real']);
  let f = await flags(page);
  expect(f['story.dream_woke']).toBe(true);
  expect(f['story.class_sent']).toBe(true);   // Mom's ask runs at the end of the wake scene (Q13)
  expect((await quest(page)).id).toBe('lizzy_class');
  expect(await page.evaluate(() => PixelPets.gateRead('fernbrook', 'fb_hall').needOk)).toBe(false);
  // The class at a Saturday night hour: Lizzy is pinned at the Schoolhouse (R2).
  await page.evaluate(() => { PixelPets.clock.set('sat', 22, 0); PixelPets.clock.freeze(true); });
  await page.evaluate(() => PixelPets.goto('hm_school_in', 10, 5, 'up'));
  expect(await page.evaluate(() => PixelPets.whoAt('hm_school_in', 10, 3))).toContain('Lizzy');
  await talk(page, 'school_lizzy', ['Hug Buddy', 'Is Rook okay?']);
  f = await flags(page);
  expect(f['story.lizzy_class']).toBe(true);
  expect(f['story.lizzy_met']).toBe(true);   // Q4: the class opens with the built reunion for a save that never met her
  // The Hall door is open (D1169), Fen is back in her Hall, and the board says so.
  expect(await page.evaluate(() => PixelPets.gateRead('fernbrook', 'fb_hall').open)).toBe(true);
  expect(await page.evaluate(() => PixelPets.gateRead('fb_hall_in', 'fen_hall').whenOk)).toBe(true);
  expect((await quest(page)).id).toBe('hall1_holders');
  // The pick is still off: it waits for Seal 1 and the post-Trial slot (D1172 no, D1175).
  expect(await page.evaluate(() => PixelPets.gateRead('fernbrook', 'fb_side_pick').whenOk)).toBe(false);
  expect(await saveV(page)).toBe(2);
});

test('A save that already finished Mahopac gets Fen\'s variant: straight to the class (R8)', async ({ page }) => {
  const pre = Object.assign({}, AFTER_FEN, { 'story.dream_woke': true }); delete pre['story.fen_sent_home'];
  await boot(page, fernSave(pre, { map: 'fernbrook', x: 10, y: 10, facing: 'up', respawn: 'fernbrook' }));
  await talk(page, 'fen_orchard');
  const f = await flags(page);
  expect(f['story.fen_sent_home']).toBe(true);
  expect(f['story.class_sent']).toBe(true);
  expect((await quest(page)).id).toBe('lizzy_class');
});

const AFTER_CLASS = Object.assign({}, AFTER_FEN, { 'story.mom_met': true, 'story.mom_chore': true, 'story.mom_sent': true, 'story.reached_mahopac': true, 'story.dream_woke': true, 'story.class_sent': true, 'story.lizzy_met': true, 'story.lizzy_class': true });

test('Trial 1: three holders before Fen, the Seal, the post-Trial slot, the pick with the lanyard, and the flip', async ({ page }) => {
  test.setTimeout(150000);
  await boot(page, fernSave(AFTER_CLASS, { map: 'fb_hall_in', x: 7, y: 22, facing: 'up', respawn: 'fernbrook' }));
  // Fen turns the holder back until all three are beaten.
  await page.evaluate(() => PixelPets.goto('fb_hall_in', 7, 5, 'up'));
  await talk(page, 'fen_hall');
  expect((await flags(page))['trainer.hall1_fen']).toBeFalsy();
  const roster = await page.evaluate(() => ['h1_cadet', 'h1_challenger', 'h1_local'].map(id => PixelPets.trainerFor(id)));
  expect(roster.map(t => t.name)).toEqual(['Ash', 'Bryn', 'Linden']);
  for (const id of ['h1_local', 'h1_challenger', 'h1_cadet']) {
    await fight(page, id);
    expect((await flags(page))['trainer.' + id]).toBe(true);
  }
  expect((await quest(page)).id).toBe('hall1');
  // Now Fen takes the match. The win gives the Seal; her Seal scene ends with D1175's PLACEHOLDER line (the post-Trial flag).
  await page.evaluate(() => PixelPets.goto('fb_hall_in', 7, 5, 'up'));
  await fight(page, 'fen_hall', ['Begin trial']);
  let f = await flags(page);
  expect(f['story.seal1']).toBe(true);
  expect(f['story.post_trial_done']).toBe(true);
  expect(await page.evaluate(() => PixelPets.mapHold('fernbrook'))).toBe('split');
  expect((await quest(page)).id).toBe('pick');
  // The pick at the orchard gate (built scene, moved trigger). A Glimmer pick also gets the Tier 1 lanyard (D1150).
  expect(await page.evaluate(() => PixelPets.gateRead('fernbrook', 'fb_side_pick').whenOk)).toBe(true);
  await page.evaluate(() => PixelPets.goto('fernbrook', 9, 9, 'down'));
  await page.evaluate(() => PixelPets.walkStep('down'));
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.id === 'side_pick');
  await playScene(page, ['Pack crates with Tobin', 'Yes, Glimmerwell', 'Pat the crate', 'I\'m sorry, Fen']);
  f = await flags(page);
  expect(f['story.side']).toBe('glimmer');
  expect(f['story.side_pick_done']).toBe(true);
  expect(f['story.orchard_cleared']).toBe(true);
  const seals = await page.evaluate(() => Object.keys(PixelPets.state.seals).sort());
  expect(seals).toEqual(['seal_fernbrook', 'seal_glim_1']);
  // Fernbrook flips to the picked side at the pick result (D1171), and the contested signs give way.
  expect(await page.evaluate(() => PixelPets.mapHold('fernbrook'))).toBe('glimmer');
  expect(await page.evaluate(() => PixelPets.gateRead('fernbrook', 'fb_sign_meeting').whenOk)).toBe(false);
  expect(await page.evaluate(() => PixelPets.gateRead('fernbrook', 'fb_sign_held_g').whenOk)).toBe(true);
  // The Tour never runs on a new-flow save; one Rook teaser, the glimmer one.
  expect(await page.evaluate(() => PixelPets.gateRead('fernbrook', 'fb_tour1').whenOk)).toBe(false);
  expect(await page.evaluate(() => PixelPets.gateRead('fernbrook', 'rook_fb').whenOk)).toBe(false);
  expect((await quest(page)).id).toBe('heights');
  expect(await saveV(page)).toBe(2);
  expect(await page.evaluate(() => PixelPets.questCheck)).toEqual([]);
});

test('A Keepers pick: Tobin\'s battle after the pick clears the orchard, and Fernbrook flips to the Keepers', async ({ page }) => {
  test.setTimeout(90000);
  await boot(page, fernSave(Object.assign({}, AFTER_CLASS, { 'trainer.h1_cadet': true, 'trainer.h1_challenger': true, 'trainer.h1_local': true, 'trainer.hall1_fen': true, 'story.seal1': true, 'story.post_trial_done': true }), { map: 'fernbrook', x: 9, y: 9, facing: 'down', respawn: 'fernbrook' }));
  await page.evaluate(() => { PixelPets.state.seals.seal_fernbrook = Date.now(); });
  expect(await page.evaluate(() => PixelPets.runScene('side_pick'))).toBe(true);
  await playScene(page, ['Open the crates with Fen', 'Yes, the Keepers']);
  let f = await flags(page);
  expect(f['story.side_pick_done']).toBe(true);
  expect(f['story.orchard_cleared']).toBeFalsy();
  expect(await page.evaluate(() => Object.keys(PixelPets.state.seals))).toEqual(['seal_fernbrook']);
  expect(await page.evaluate(() => PixelPets.mapHold('fernbrook'))).toBe('keepers');
  expect(await page.evaluate(() => PixelPets.gateRead('fernbrook', 'fern_associate').whenOk)).toBe(true);
  expect(await page.evaluate(() => PixelPets.gateRead('fernbrook', 'fb_tobin').whenOk)).toBe(false);
  // After the Heights the chain points at Tobin's battle (its own row after the pick, D1187).
  await page.evaluate(() => PixelPets.setFlag('story.heights_done', true));
  expect((await quest(page)).id).toBe('tobin_crates');
  expect(await page.evaluate(() => PixelPets.runScene('orchard'))).toBe(true);
  await playScene(page, []);
  expect((await flags(page))['story.orchard_cleared']).toBe(true);
  expect((await quest(page)).id).toBe('teaser');
});

test('copy limits: every new line fits (say <= 110 with tokens, choice labels <= 30, signs <= 110), and no banned words', async ({ page }) => {
  await boot(page, fernSave());
  const bad = await page.evaluate(() => {
    const D = MAPDATA.detail_zz_day1, dl = MAPDATA.interiors.dialog, TOK = dl.tokenLen || {}, out = [];
    const len = s => Array.from(String(s).replace(/\{(\w+)\}/g, (m, k) => 'x'.repeat(TOK[k] || 12))).length;
    const BANNED = /\b(trainer|gym|coins?|rival|fainted|evolve|appeared)\b|dex\b/i;
    const line = (where, s, max) => { if (len(s) > max) out.push(where + ' over ' + max + ': ' + s); if (/  /.test(s)) out.push(where + ' double space'); if (BANNED.test(s)) out.push(where + ' banned word: ' + s); };
    const walk = (where, n) => { if (!Array.isArray(n)) return;
      if (n[0] === 'say') line(where, n[2], 110);
      if (n[0] === 'choice') { line(where, n[1], 110); for (const o of n[2] || []) { line(where, o[0], 30); walk(where, o[1]); } return; }
      n.forEach(x => walk(where, x)); };
    for (const [id, st] of Object.entries(D.scenes)) walk('scene ' + id, st);
    for (const [id, st] of Object.entries(D.sceneTails)) if (id[0] !== '_') walk('tail ' + id, st);
    for (const sw of D.lineSwaps) walk('swap ' + sw.scene, sw.to);
    for (const o of D.slicePatch.maps.fernbrook.addObjs) { if (o.text) line(o.id, o.text, 110); for (const v of Object.values(o.lines || {})) line(o.id, v, 110); }
    for (const o of MAPDATA.fernbrook_rooms.maps.fb_lantern_in.objs) for (const v of Object.values(o.lines || {})) line(o.id, v, 110);
    for (const [id, t] of Object.entries(D.trainers)) for (const v of Object.values(t.lines)) line(id, v, 110);
    for (const v of Object.values(D.lines)) line('lines', v, 110);
    for (const [id, pt] of Object.entries(D.objPatch)) if (id[0] !== '_') for (const v of Object.values(pt.linesFirst || {})) line(id, v, 110);
    for (const r of MAPDATA.town_board.towns.fernbrook.reports) if (/^fb_hall_/.test(r.id)) line(r.id, r.text, 110);
    const door = MAPDATA.fernbrook_rooms.slicePatch.maps.fernbrook.replaceObjs.find(o => o.id === 'fb_hall');
    for (const v of Object.values(door.deny)) line('fb_hall deny', v, 110);
    return out;
  });
  expect(bad).toEqual([]);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('Day 1 crates and Fen\'s go-home talk play with reduced motion and no console errors', async ({ page }) => {
    test.setTimeout(90000);
    await boot(page, fernSave({ 'story.tl_amos': true, 'story.tl_juniper': true, 'story.tl_done': true, 'story.crate_a': true, 'story.crate_b': true }));
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
    await talk(page, 'fb_crate_c', ['Listen at it']);
    expect((await flags(page))['story.tally_done']).toBe(true);
    await page.evaluate(() => PixelPets.goto('fernbrook', 10, 10, 'up'));
    await talk(page, 'fen_orchard');
    expect((await flags(page))['story.fen_sent_home']).toBe(true);
    expect(await saveV(page)).toBe(2);
  });
});
