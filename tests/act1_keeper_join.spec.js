/* ACT1_KEEPER_JOIN v0.1.1 (design repo, private; D1545-D1560): after the crackdown's dawn release Ilse sends the holder to
   Vincent Chi; a day shift with Imogen's lamp crew and a dusk watch with a Keeper Scout in Wickerglen; the orchard lean; Ilse's
   second call and the enrolment (the Cadet pin, or Glimmerwell's lanyard and Juniper's step); the report letters, the recall
   after Brinewick; and the one-time old-save move at load (D1546 B). Every new line is PLACEHOLDER (Story).
   data/detail_zz_keeper_join.json, quests.js, game.js. Save stays pixelpets.save.v2, v 2, new story.* keys only. */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { starterSave, installSave, trackErrors, gotoGame, withOverlay } = require('./helpers');

trackErrors(test, expect);

// A new-flow save after the crackdown night (Day 1, Lizzy's class, the three holders, Fen's Seal, the dawn release).
const AFTER_NIGHT = {
  'story.reached_route1': true, 'story.rival1_done': true, 'story.reached_fernbrook': true, 'story.met_glimmerwell': true,
  'story.met_fen': true, 'story.crate_a': true, 'story.crate_b': true, 'story.crate_c': true, 'story.tally_done': true,
  'story.tl_amos': true, 'story.tl_juniper': true, 'story.tl_done': true, 'story.crates_seen': true, 'story.fen_sent_home': true,
  'story.mom_met': true, 'story.mom_chore': true, 'story.mom_sent': true, 'story.reached_mahopac': true, 'story.dream_woke': true,
  'story.class_sent': true, 'story.lizzy_met': true, 'story.lizzy_class': true, 'trainer.h1_cadet': true,
  'trainer.h1_challenger': true, 'trainer.h1_local': true, 'trainer.hall1_fen': true, 'story.seal1': true,
  'story.crackdown': true, 'story.hall1_shut': true, 'story.post_trial_done': true, 'story.fen_lean': 2, 'story.phone_got': true,
};
const MET = { 'story.warden_called': true, 'story.warden_met': true };
function joinSave(extra, world) {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.textSpeed = 'fast';
  Object.assign(s.flags, AFTER_NIGHT, extra || {});
  for (const [k, v] of Object.entries(s.flags)) if (v === null) delete s.flags[k];
  s.world = Object.assign({ map: 'fernbrook', x: 12, y: 8, facing: 'down', respawn: 'fernbrook' }, world || {});
  s.standing = { keepers: 0, glimmer: 0 };
  s.seals = { seal_fernbrook: 1700000000000 };
  s.party[0].xp = 4000;
  s.money = 40;
  return s;
}
// The weir hut is WEIR_HUT's room (data/detail_zz_weir_hut.json, a parallel build). Until it lands, the scene tests stand Vincent
// Chi in a test-only stand-in room (a copy of a built room's floor, same object ids), so his scenes and keys are checked now.
const HUT_BUILT = fs.existsSync(path.join(__dirname, '..', 'data', 'detail_zz_weir_hut.json'));
function hutStandIn() {
  const rooms = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'fernbrook_rooms.json'), 'utf8')).maps;
  const r = JSON.parse(JSON.stringify(rooms.fb_lantern_in));
  Object.assign(r, { name: 'Weir Hut', outdoor: 'route2_glen', door: null });
  r.objs = [
    { kind: 'warp', id: 'weir_hut_mat', x: 5, y: 15, to: 'route2_glen', tx: 21, ty: 4, facing: 'left' },
    { kind: 'npc', id: 'chi_hut', name: 'Vincent Chi', look: 'chi', x: 5, y: 4, facing: 'up', when: ['story.warden_met'], lines: { else: 'Boots on the sack, please.' } },
    { kind: 'trigger', id: 'chi_hut_first', x: 5, y: 13, r: 0, when: ['story.warden_met', '!story.chi_met'], scene: 'chi_meet' },
  ];
  return { maps: { hw_weir_hut_in: r } };
}
const HUT = HUT_BUILT ? { map: 'hw_weir_hut_in', x: 4, y: 10, first: 'up' } : { map: 'hw_weir_hut_in', x: 5, y: 14, first: 'up' };
async function boot(page, save, opts = {}) {
  if (!HUT_BUILT) await withOverlay(page, hutStandIn(), 'detail_zy_test_hut');
  if (opts.reduce) await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), save, { quietDay: true, oldSave: !!opts.oldSave });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && typeof PixelPets.talkTo === 'function');
  await page.evaluate(() => PixelPets.showTab('walk'));
  if (opts.reduce) expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
}
const flags = page => page.evaluate(() => Object.assign({}, PixelPets.state.flags));
const stored = page => page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
const sceneId = page => page.evaluate(() => PixelPets.scene && PixelPets.scene.id);
const quest = page => page.evaluate(() => { const q = PixelPets.quest; return q && { id: q.id, text: q.text, target: q.target || null }; });
const ids = page => page.evaluate(() => PixelPets.mapObjs.map(o => o.id));
const gate = (page, map, id) => page.evaluate(([m, i]) => PixelPets.gateRead(m, i), [map, id]);
async function goto(page, map, x, y, facing) {
  await page.evaluate(([m, x, y, f]) => PixelPets.goto(m, x, y, f), [map, x, y, facing || 'down']);
  await page.waitForFunction(m => PixelPets.mapInfo.id === m && !PixelPets.fading, map);
}
async function step(page, dir) { await page.evaluate(d => PixelPets.walkStep(d), dir); await page.waitForTimeout(380); }
// Plays the open scene to its end: lines advance, choices take the first label in `picks` that is offered (else the first);
// returns every line as [speaker, text]. `onLine` may read the stage while a line shows.
async function drive(page, picks = [], onLine = null, ms = 120000) {
  const until = Date.now() + ms, lines = [];
  let last = null;
  while (Date.now() < until) {
    const sc = await page.evaluate(() => PixelPets.scene && { mode: PixelPets.scene.mode, full: PixelPets.scene.full, waiting: PixelPets.scene.waiting, text: PixelPets.scene.text, who: PixelPets.scene.who });
    if (!sc) {
      if (await page.locator('#ovBattle.seal-only').isVisible().catch(() => false)) { await page.locator('#btOk').click(); continue; }
      await page.waitForTimeout(150); if (!(await page.evaluate(() => !!PixelPets.scene))) return lines; continue;
    }
    if (await page.locator('#ovBattle.seal-only').isVisible().catch(() => false)) { await page.locator('#btOk').click(); await page.waitForTimeout(40); continue; }
    if (sc.mode === 'choice') {
      if (!sc.full) { await page.keyboard.press('Space'); continue; }
      if (!(await page.locator('#sbChoices button:visible').count())) { await page.waitForTimeout(40); continue; }
      await page.waitForFunction(() => PixelPets.optionsReady === true);
      const labels = (await page.locator('#sbChoices button').allTextContents()).map(t => t.trim());
      const pick = picks.find(p => labels.includes(p)) || labels[0];
      lines.push(['>', pick]);
      await page.locator('#sbChoices button', { hasText: pick }).first().click();
      await page.waitForTimeout(40); continue;
    }
    if (sc.mode === 'say' && sc.waiting) {
      // Let the line finish typing (text speed fast) rather than tapping: under load a tap sent while the line types can land
      // after it is full and skip it unread.
      if (!sc.full) { await page.waitForTimeout(30); continue; }
      const key = sc.who + '|' + sc.text;
      if (key !== last) { lines.push([sc.who || '', sc.text]); last = key; if (onLine) await onLine(sc.text, sc.who || ''); }
      await page.keyboard.press('Space'); await page.waitForTimeout(30); continue;
    }
    await page.waitForTimeout(40);
  }
  throw new Error('scene did not end');
}
const said = (lines, re) => lines.some(l => re.test(l[1]));

test.describe('ACT1_KEEPER_JOIN: Ilse sends the holder to Vincent Chi (K3)', () => {
  test('T1: the call, the Lodge, story.warden_met; fb_east opens; chi_meet points at the trunk', async ({ page }) => {
    test.setTimeout(120000);
    await boot(page, joinSave({}, { map: 'fb_lantern_in', x: 5, y: 13 }));
    const before = await stored(page);
    // Route 2 is still shut: the order stands and nobody has sent the holder anywhere.
    expect((await gate(page, 'fernbrook', 'fb_east')).whenOk).toBe(false);
    await goto(page, 'fernbrook', 5, 6); await step(page, 'down');
    expect(await sceneId(page)).toBe('ilse_call');
    await drive(page, ['Answer']);
    expect((await flags(page))['story.warden_called']).toBe(true);
    await goto(page, 'hm_lodge_in', 5, 5);
    expect(await page.evaluate(() => PixelPets.talkTo('ilse_lodge_after'))).toBe(true);
    expect(await sceneId(page)).toBe('warden_meet');
    const lines = await drive(page);
    // 4.1, 1c-1e: the debrief's last lines send the holder to Vincent Chi (PLACEHOLDER).
    expect(lines.slice(-3).map(l => l[1])).toEqual([
      "Fen wrote to me before they shut her door. Walklings walking off at night, near Wickerglen.",
      "Glimmerwell's tents are shut to a Warden. I know someone who walks where I can't.",   // D1700
      "Jacob Chi. No phone, no side. Past the fallen trunk at Wickerglen's east edge. Say I sent you.",
    ]);
    for (const l of lines) expect(Array.from(l[1]).length, l[1]).toBeLessThanOrEqual(110);
    const f = await flags(page);
    expect(f['story.warden_met']).toBe(true);
    expect(f['story.side_pick_done']).toBeUndefined();
    const q = await quest(page);
    expect(q.id).toBe('chi_meet');
    expect(q.target).toEqual({ map: 'route2_glen', x: 22, y: 4 });
    // D1551: Route 2 opens on story.warden_met; the rubble is gone; Juniper stands beside the road, not on it.
    expect((await gate(page, 'fernbrook', 'fb_east')).open).toBe(true);
    await goto(page, 'fernbrook', 29, 8, 'right');
    expect(await ids(page)).toEqual(expect.arrayContaining(['juniper_east', 'fb_sign_route2_open']));
    expect(await ids(page)).not.toContain('fb_rubble');
    await step(page, 'right'); await step(page, 'right');
    await page.waitForFunction(() => PixelPets.mapInfo.id === 'route2' && !PixelPets.fading);
    expect((await flags(page))['story.reached_route2']).toBe(true);
    // Save v2, nothing removed.
    const after = await stored(page);
    expect(after.v).toBe(2);
    for (const k of Object.keys(before.flags)) expect(after.flags, k).toHaveProperty([k]);
  });

  test('T3 (gate) and T14: Imogen waits for the enrolment; the Wickerglen slip and the Constable', async ({ page }) => {
    test.setTimeout(90000);
    await boot(page, joinSave(MET), { reduce: false });
    // Before Vincent Chi: no Imogen battle, no Imogen body, no intro trigger.
    await goto(page, 'route2_glen', 12, 17, 'up');
    let o = await ids(page);
    expect(o).not.toContain('r2_lead');
    expect(o).not.toContain('glen_imogen');
    expect(o).not.toContain('glen_intro');
    expect(o).toEqual(expect.arrayContaining(['glen_lamp_w', 'glen_lamp_n', 'glen_lamp_e']));   // the lamps stay lit
    // After the meeting: her body on the battle tile; still no battle.
    await page.evaluate(() => PixelPets.setFlag('story.chi_met', true));
    await goto(page, 'route2_glen', 12, 17, 'up');
    o = await ids(page);
    expect(o).toContain('glen_imogen');
    expect(o).not.toContain('r2_lead');
    // D1555: the slip goes up with Ilse's second call; a Constable stands by; the hold stays Glimmerwell.
    const holdBefore = await page.evaluate(() => PixelPets.mapHold ? PixelPets.mapHold('route2') : null);
    await page.evaluate(() => PixelPets.setFlag('story.ilse_call2', true));
    await goto(page, 'route2_glen', 12, 17, 'up');
    expect(await ids(page)).toContain('glen_constable');
    expect(await page.evaluate(() => PixelPets.talkTo('glen_lamp_w'))).toBe(true);
    let lines = await drive(page);
    expect(lines[0][1]).toBe('A Keeper slip on the post: LAMP CLOSED FOR REVIEW. The lamp still hums.');   // glen_lamp_w (D2137 signed)
    expect(await page.evaluate(() => PixelPets.talkTo('glen_constable'))).toBe(true);
    lines = await drive(page);
    expect(lines[0]).toEqual(['Keeper Constable', "Orders came down. The lamps are under review. Don't ask me how long."]);
    // After the enrolment Imogen's battle is back; once the Heights are done the slip is a brass plate and the Constable goes.
    await page.evaluate(() => { PixelPets.setFlag('story.keeper_cadet', true); PixelPets.setFlag('story.heights_done', true); });
    await goto(page, 'route2_glen', 12, 17, 'up');
    o = await ids(page);
    expect(o).toContain('r2_lead');
    expect(o).not.toContain('glen_imogen');
    expect(o).not.toContain('glen_constable');
    expect(await page.evaluate(() => PixelPets.talkTo('glen_lamp_n'))).toBe(true);
    lines = await drive(page);
    expect(lines[0][1]).toBe('The slip is gone. Fresh paint, and a brass plate: BY PERMIT OF HIGH CHARITY.');   // D2137
    if (holdBefore != null) expect(await page.evaluate(() => PixelPets.mapHold('route2'))).toBe(holdBefore);
  });

  test('old saves read every gate as before (no crackdown): r2_lead and the intro as built @w1', async ({ page }) => {
    const s = joinSave({ 'story.crackdown': null, 'story.hall1_shut': null, 'story.side_pick_done': true, 'story.orchard_cleared': true });
    await boot(page, s);
    expect((await gate(page, 'fernbrook', 'fb_east')).open).toBe(true);
    await goto(page, 'route2_glen', 12, 17, 'up');
    const o = await ids(page);
    expect(o).toEqual(expect.arrayContaining(['r2_lead', 'glen_intro']));
    expect(o).not.toContain('glen_imogen');
  });
});

test.describe('ACT1_KEEPER_JOIN: Vincent Chi in the weir hut (K4)', () => {
  test('T2 / 4.2: the first step in plays chi_meet once; story.chi_met; one jar', async ({ page }) => {
    test.setTimeout(90000);
    await boot(page, joinSave(MET));
    await goto(page, HUT.map, HUT.x, HUT.y, 'up');
    expect(await ids(page)).toContain('chi_hut');
    expect(await page.evaluate(() => !!PixelPets.lookGrid('chi'))).toBe(true);   // the chi look draws (PAL only)
    await step(page, HUT.first);
    expect(await sceneId(page)).toBe('chi_meet');
    const lines = await drive(page);
    expect(lines[1]).toEqual(['Vincent Chi', "Ilse sent you. Good. No poles out here. The wire can't hear the water."]);
    expect(lines[lines.length - 1]).toEqual(['Vincent Chi', "Imogen's crew needs hands by day. A Keeper Scout keeps watch at dusk. I'll be here."]);
    for (const l of lines) expect(Array.from(l[1]).length, l[1]).toBeLessThanOrEqual(110);
    let f = await flags(page);
    expect(f['story.chi_met']).toBe(true);
    expect(f['story.chi_jars']).toBe(1);
    expect((await quest(page)).id).toBe('chi_shifts');
    // Once is enough: the trigger is gone, and his talk repeats the shifts.
    await goto(page, HUT.map, HUT.x, HUT.y, 'up'); await step(page, HUT.first);
    expect(await sceneId(page)).toBeNull();
    expect(await page.evaluate(() => PixelPets.talkTo('chi_hut'))).toBe(true);
    expect((await drive(page))[0][1]).toBe("Imogen's crew needs hands by day. A Keeper Scout keeps watch at dusk. I'll be here.");
    // Without Ilse's word the hut has no Vincent Chi.
    await page.evaluate(() => PixelPets.setFlag('story.warden_met', null));
    await goto(page, HUT.map, HUT.x, HUT.y, 'up');
    expect(await ids(page)).not.toContain('chi_hut');
    f = await stored(page);
    expect(f.v).toBe(2);
  });

  test('4.5: the report needs both shifts; the hub takes each thing once; story.chi_done; six jars', async ({ page }) => {
    test.setTimeout(90000);
    await boot(page, joinSave(Object.assign({ 'story.chi_met': true, 'story.chi_jars': 1, 'story.shift_g': true, 'story.met_lead': true }, MET)));
    await goto(page, HUT.map, HUT.x, HUT.y, 'up');
    // One shift is not enough.
    expect(await page.evaluate(() => PixelPets.talkTo('chi_hut'))).toBe(true);
    expect(await sceneId(page)).not.toBe('chi_report');
    await drive(page);
    await page.evaluate(() => { PixelPets.setFlag('story.shift_k', true); PixelPets.setFlag('story.chi_jars', 3); });
    expect((await quest(page)).id).toBe('chi_report');
    expect(await page.evaluate(() => PixelPets.talkTo('chi_hut'))).toBe(true);
    expect(await sceneId(page)).toBe('chi_report');
    const lines = await drive(page, ['The ledger', 'The lamps', 'The list', "That's all"]);
    const picks = lines.filter(l => l[0] === '>').map(l => l[1]);
    expect(picks).toEqual(['The ledger', 'The lamps', 'The list', "That's all"]);
    expect(said(lines, /^Six Seals, held by permit\./)).toBe(true);
    expect(said(lines, /one story: the Seals, the lamps, the tanks\.$/)).toBe(true);
    // WALK_BESIDE D1970: Jacob Chi's one-step run (the old lantern) follows the built report's last line.
    expect(lines[lines.length - 3][1]).toBe("Go home by the orchard. Fen's crates are still at the gate.");
    expect(lines.slice(-2).map(l => l[1])).toEqual(['Jacob Chi lifts the cloth off the old lantern on the shelf.', 'Scouts learned the long version once. Nobody asks for it now.']);
    for (const l of lines) expect(Array.from(l[1]).length, l[1]).toBeLessThanOrEqual(110);
    const f = await flags(page);
    expect(f['story.chi_done']).toBe(true);
    expect(f['story.chi_jars']).toBe(6);
    // The lean is next (K6 keys the gate on story.chi_done).
    expect(await page.evaluate(() => PixelPets.talkTo('chi_hut'))).toBe(true);
    expect((await drive(page))[0][1]).toBe("Go home by the orchard. Fen's crates are still at the gate.");
  });
});

const CHI = Object.assign({ 'story.chi_met': true, 'story.chi_jars': 1, 'story.reached_route2': true, 'story.met_census': true, 'story.reached_glen': true }, MET);
async function talk(page, id, picks) {
  expect(await page.evaluate(i => PixelPets.talkTo(i), id), id).toBe(true);
  return drive(page, picks || []);
}
async function dayShift(page, ask) {
  await goto(page, 'route2_glen', 12, 6, 'up');
  let lines = await talk(page, 'glen_imogen');
  expect(lines[0]).toEqual(['Field Lead Imogen', 'New hands? Lovely. Lenses, sweetie. Three lamps. Quarterly review is Friday.']);
  const all = lines.slice();
  for (const [id, x, y] of [['glen_lamp_w', 8, 5], ['glen_lamp_n', 12, 3], ['glen_lamp_e', 16, 5]]) {
    await goto(page, 'route2_glen', x, y, 'up');
    lines = await talk(page, id);
    expect(lines[0][1]).toBe('You wipe the glass. The lamp hums under your hand, slow as a heartbeat.');
    all.push(...lines);
    // A wiped lamp is not wiped twice.
    expect(await page.evaluate(i => PixelPets.talkTo(i), id)).toBe(true);
    expect(await sceneId(page)).toBeNull();
    await drive(page);
  }
  expect((await flags(page))['story.shift_g']).toBeUndefined();   // the ledger is still to read
  await goto(page, 'route2_glen', 17, 8, 'up');
  lines = await talk(page, 'glen_crate_a', [ask ? 'Ask about the stock' : 'Keep wiping']);
  all.push(...lines);
  expect(lines[0][1]).toBe('A ledger on the lid. LAMP STOCK. FERNBROOK ALLOTMENT: 6 SEALS. HELD BY PERMIT.');
  expect(lines[lines.length - 1]).toEqual(['Field Lead Imogen', "Good shift! Have a bright day. Come back once you've got a team worth showing me."]);
  return all;
}
async function nightWatch(page, ask) {
  await goto(page, 'route2_glen', 12, 15, 'right');
  expect(await ids(page)).toContain('glen_scout');
  return talk(page, 'glen_scout', [ask ? 'Ask about the list' : 'Say nothing']);
}

test.describe('ACT1_KEEPER_JOIN: the two shifts in Wickerglen (K5)', () => {
  test('T3, T4, T5: day shift then dusk watch; the report needs both; lean counters move', async ({ page }) => {
    test.setTimeout(150000);
    await boot(page, joinSave(CHI));
    const f0 = await flags(page);
    expect((await quest(page)).id).toBe('chi_shifts');
    const day = await dayShift(page, true);
    expect(said(day, /^Stock is stock\./)).toBe(true);
    let f = await flags(page);
    expect(f['story.shift_g']).toBe(true);
    expect(f['story.met_lead']).toBe(true);
    expect(f['story.lean_fix'] | 0).toBe((f0['story.lean_fix'] | 0) + 1);
    expect(f['story.chi_jars']).toBe(2);
    expect((await quest(page)).id).toBe('chi_shifts');   // one shift is half the job
    expect(await ids(page)).not.toContain('r2_lead');     // T3: the battle waits for the enrolment
    // T4: the dusk watch is a curtain and narration; its scene never reads the hour.
    const script = JSON.stringify(await page.evaluate(() => PixelPets.sceneScript('night_watch')));
    expect(script).toContain('["curtain","on"]');
    expect(script).not.toMatch(/waitUntil|clock|hour|time\./);
    const night = await nightWatch(page, true);
    expect(night[0]).toEqual(['Keeper Scout', "Captain's orders: watch the glen, touch nothing. It's their ground, by permit."]);
    expect(said(night, /^Dusk\. The lamps come up/)).toBe(true);
    expect(said(night, /^Morning\. The crates are gone\./)).toBe(true);
    expect(said(night, /^Above me\. Above my Captain too/)).toBe(true);
    for (const l of day.concat(night)) expect(Array.from(l[1]).length, l[1]).toBeLessThanOrEqual(110);
    f = await flags(page);
    expect(f['story.shift_k']).toBe(true);
    expect(f['story.lean_keep'] | 0).toBe((f0['story.lean_keep'] | 0) + 1);
    expect(f['story.chi_jars']).toBe(3);
    expect(await ids(page)).not.toContain('glen_scout');
    expect((await quest(page)).id).toBe('chi_report');
    const s = await stored(page);
    expect(s.v).toBe(2);
    for (const k of Object.keys(f0)) expect(s.flags, k).toHaveProperty([k]);
  });

  test('T5: the dusk watch first, then the day shift (reduced motion)', async ({ page }) => {
    test.setTimeout(150000);
    await boot(page, joinSave(CHI), { reduce: true });
    await nightWatch(page, false);
    let f = await flags(page);
    expect(f['story.shift_k']).toBe(true);
    expect(f['story.shift_g']).toBeUndefined();
    expect((await quest(page)).id).toBe('chi_shifts');
    await dayShift(page, false);
    f = await flags(page);
    expect(f['story.shift_g']).toBe(true);
    expect(f['story.chi_jars']).toBe(3);
    expect((await quest(page)).id).toBe('chi_report');
  });
});

const DONE = Object.assign({}, CHI, { 'story.chi_jars': 6, 'story.shift_g': true, 'story.shift_k': true, 'story.met_lead': true, 'story.chi_done': true });
async function fight(page, id) {
  expect(await page.evaluate(i => PixelPets.talkTo(i), id), id).toBe(true);
  for (let i = 0; i < 160 && !(await page.evaluate(() => !!(PixelPets.battle && PixelPets.battle.on && PixelPets.battle.state === 'CHOOSE'))); i++) {
    const st = await page.evaluate(() => ({ s: PixelPets.scene && { mode: PixelPets.scene.mode, waiting: PixelPets.scene.waiting, full: PixelPets.scene.full }, b: !!(PixelPets.battle && PixelPets.battle.on) }));
    if (st.s && st.s.mode === 'say' && st.s.waiting) await page.keyboard.press('Space');
    else if (st.b) await page.locator('#btMsg').click().catch(() => {});
    await page.waitForTimeout(60);
  }
  await page.evaluate(() => PixelPets.winBattle());
  const lines = [];
  for (let i = 0; i < 120; i++) {
    const st = await page.evaluate(() => ({ b: !!(PixelPets.battle && PixelPets.battle.on), panel: PixelPets.battle && PixelPets.battle.panel, scene: !!PixelPets.scene }));
    const sealUp = await page.locator('#ovBattle.seal-only').isVisible().catch(() => false);
    if (!st.b && !st.scene && !sealUp) break;
    if (sealUp) await page.locator('#btOk').click();
    else if (st.b && st.panel === 'end') await page.locator('#btOk').click();
    else if (st.b) await page.locator('#btMsg').click().catch(() => {});
    else lines.push(...await drive(page));
    await page.waitForTimeout(80);
  }
  return lines;
}
async function lean(page, pick) {
  await goto(page, 'fernbrook', 9, 9, 'down');
  await step(page, 'down');
  expect(await sceneId(page)).toBe('side_pick');
  return drive(page, [pick, 'Pat the crate', "I'm sorry, Fen"]);
}
async function secondCall(page) {
  await goto(page, 'fernbrook', 12, 8, 'down');
  await step(page, 'down');
  expect(await sceneId(page)).toBe('ilse_call2');
  return drive(page, ['Answer']);
}
async function enrolment(page, face) {
  await goto(page, 'hm_lodge_in', 5, 5, 'up');
  expect(await page.evaluate(() => PixelPets.talkTo('ilse_lodge_after'))).toBe(true);
  expect(await sceneId(page)).toBe('enrol');
  return drive(page, [face === 'pin' ? 'Wear the Cadet pin' : 'Wear their lanyard for Ilse']);
}
// D1562: every holder takes the lanyard, so the face is always set at Juniper's step on the east road.
async function juniperStep(page) {
  await goto(page, 'fernbrook', 30, 6, 'down');
  expect(await page.evaluate(() => PixelPets.talkTo('juniper_east'))).toBe(true);
  expect(await sceneId(page)).toBe('enrol_lanyard');
  return drive(page);
}
const len110 = lines => { for (const l of lines) if (l[0] !== '>') expect(Array.from(l[1]).length, l[1]).toBeLessThanOrEqual(110); };

test.describe('ACT1_KEEPER_JOIN: the orchard lean and the enrolment (K6)', () => {
  test('T6, T8, T9 (D1562): Open the crates, Tobin\'s battle, the second call, the enrolment with no question', async ({ page }) => {
    test.setTimeout(180000);
    await boot(page, joinSave(DONE));
    const before = await stored(page);
    // The gate waits for Vincent Chi's report (the lean's when); with it, the lean plays.
    expect((await quest(page)).id).toBe('pick');
    const ln = await lean(page, 'Open the crates with Fen');
    len110(ln);
    expect(ln[1]).toEqual(['Master Fen', "You've seen where the crates go. Help me open them, or help them pack."]);
    expect(said(ln, /This decides who you travel with|Really\?|Paths do bend|Welcome to the partnership/)).toBe(false);   // retired lines
    let f = await flags(page);
    expect(f['story.orchard_lean']).toBe('open');
    expect(f['story.sway_fernbrook']).toBe(2);
    expect(f['story.fen_lean']).toBe(3);
    expect(f['story.side']).toBeUndefined();
    expect(f['story.side_pick_done']).toBeUndefined();
    expect(f['story.keeper_cadet']).toBeUndefined();
    // No walk-away line once the lean is made.
    const toasts0 = (await page.evaluate(() => PixelPets.toasts)).length;
    await step(page, 'up');
    expect((await page.evaluate(() => PixelPets.toasts)).length).toBe(toasts0);
    // Tobin's built battle frees the Pomlets (D1187).
    expect((await quest(page)).id).toBe('tobin_crates');
    await goto(page, 'fernbrook', 9, 12, 'down');
    const won = await fight(page, 'fern_associate');
    expect(said(won, /Pomlets tumble out/)).toBe(true);
    f = await flags(page);
    expect(f['story.orchard_cleared']).toBe(true);
    expect(f['story.side_pick_done']).toBeUndefined();
    expect((await quest(page)).id).toBe('enrol');
    // T8: the second call on the first free outdoor step.
    const call = await secondCall(page);
    expect(call.map(l => l[1])).toEqual(expect.arrayContaining(['Things are changing. In the shadows. I can feel it from here.', 'Come home tonight. Before anyone else sends for you.']));
    expect((await flags(page))['story.ilse_call2']).toBe(true);
    // T9 (D1562 "Always undercover"): the enrolment asks no pin-or-lanyard question; every holder takes the lanyard.
    expect(await page.evaluate(() => PixelPets.enrolChoice)).toBe('lanyard');
    const en = await enrolment(page, 'lanyard');
    len110(en);
    expect(en.filter(l => l[0] === '>')).toEqual([]);   // no choice at all
    expect(said(en, /^As of tonight, you're a Keeper Cadet\./)).toBe(true);
    expect(said(en, /^They'll want you more for saying no\./)).toBe(true);
    expect(said(en, /Wear the pin|Then walk tall/)).toBe(false);
    expect(said(en, /^Juniper's offer still stands\. Take it\. Smile\. Remember your home\.$/)).toBe(true);
    expect(await page.evaluate(() => PixelPets.toasts)).toContain("You're a Keeper Cadet.");
    f = await flags(page);
    expect(f['story.keeper_cadet']).toBe(true);
    expect(f['story.cover']).toBe('glimmer');
    expect(f['story.side_pick_done']).toBeUndefined();
    expect((await quest(page)).id).toBe('enrol_lanyard');
    await juniperStep(page);
    f = await flags(page);
    expect(f['story.side']).toBe('glimmer');
    expect(f['story.side_pick_done']).toBe(true);
    expect(f['story.sway_fernbrook']).toBe(2);   // D1674: the face moves no sway; the opened crates settle the Keepers
    expect(f['story.know_us']).toBe(true);
    expect(f['standing.got.sp_pick']).toBe(true);
    expect(await page.evaluate(() => PixelPets.mapHold('fernbrook'))).toBe('keepers');
    // The curfew read ends: posts and notice go.
    expect(await page.evaluate(() => PixelPets.fbPlazaPhase())).not.toBe('curfew');
    await goto(page, 'fernbrook', 12, 8, 'down');
    for (const id of ['cd_post_lantern', 'cd_post_hall', 'cd_notice', 'juniper_east']) expect(await ids(page), id).not.toContain(id);
    expect((await quest(page)).id).toBe('heights');
    expect((await quest(page)).text).toBe('Get to know us. Copy Atten from RegenX. A floating computer woke in the top bay.');
    const after = await stored(page);
    expect(after.v).toBe(2);
    for (const k of Object.keys(before.flags)) expect(after.flags, k).toHaveProperty([k]);
  });

  test('T7, T10, D1561: Pack the crates, the lanyard, Juniper logs the Seal; the Keeper post line', async ({ page }) => {
    test.setTimeout(180000);
    await boot(page, joinSave(DONE));
    const ln = await lean(page, 'Help Tobin pack');
    len110(ln);
    expect(said(ln, /^Grab that crate lid, new hire\.$/)).toBe(true);
    expect(said(ln, /I hoped your hands would know better\./)).toBe(true);
    expect(said(ln, /partnership file is open/)).toBe(false);
    let f = await flags(page);
    expect(f['story.orchard_lean']).toBe('pack');
    expect(f['story.sway_fernbrook']).toBe(-2);
    expect(f['story.fen_lean']).toBe(1);
    expect(f['story.orchard_cleared']).toBe(true);
    expect(f['story.side']).toBeUndefined();
    expect(f['story.side_pick_done']).toBeUndefined();
    expect((await quest(page)).id).toBe('enrol');
    await secondCall(page);
    const en = await enrolment(page, 'lanyard');
    expect(en.filter(l => l[0] === '>')).toEqual([]);
    expect(said(en, /^You've already got their ear\./)).toBe(true);
    expect(said(en, /^Juniper's offer still stands\. Take it\. Smile\. Remember your home\.$/)).toBe(true);
    f = await flags(page);
    expect(f['story.keeper_cadet']).toBe(true);
    expect(f['story.cover']).toBe('glimmer');
    expect(f['story.side_pick_done']).toBeUndefined();
    expect(f['story.side']).toBeUndefined();
    const q = await quest(page);
    expect(q.id).toBe('enrol_lanyard');
    // Juniper's step on the east road (D1553).
    await goto(page, 'fernbrook', 30, 6, 'down');
    expect(await page.evaluate(() => PixelPets.talkTo('juniper_east'))).toBe(true);
    expect(await sceneId(page)).toBe('enrol_lanyard');
    const jn = await drive(page);
    len110(jn);
    expect(said(jn, /^Hold still, partner! Your Tier 1 Lanyard clips right onto your Fernbrook Seal/)).toBe(true);   // pick_log (D1436)
    f = await flags(page);
    expect(f['story.side']).toBe('glimmer');
    expect(f['story.side_pick_done']).toBe(true);
    expect(f['story.sway_fernbrook']).toBe(-2);   // D1674: the lean alone
    expect(f['story.tour1_s1']).toBe(true);
    expect(f['standing.got.sp_pick']).toBe(true);
    expect(Object.keys(await page.evaluate(() => PixelPets.state.seals)).sort()).toEqual(['seal_fernbrook', 'seal_glim_1']);
    expect(await page.evaluate(() => PixelPets.state.bag.cracked_phone | 0)).toBe(1);
    // D1561: when Glimmerwell holds Fernbrook after the enrolment, the Keepers keep one post and say why.
    expect(await page.evaluate(() => PixelPets.mapHold('fernbrook'))).toBe('glimmer');
    expect(await page.evaluate(() => PixelPets.condRead('fbplaza:post').cond)).toBe(true);
    await goto(page, 'fernbrook', 24, 11, 'right');
    expect(await page.evaluate(() => PixelPets.talkTo('fbp_constable'))).toBe(true);
    const rue = await drive(page);
    expect(rue[0][1]).toBe("We pulled back to the post after the curfew. We're still here.");
    expect((await stored(page)).v).toBe(2);
  });

  test('T8: no Keeper1, so Amos passes the second call on (reduced motion) @w1', async ({ page }) => {
    test.setTimeout(90000);
    await boot(page, joinSave(Object.assign({}, DONE, { 'story.phone_got': null, 'story.orchard_lean': 'pack', 'story.orchard_cleared': true, 'story.sway_fernbrook': -2 })), { reduce: true });
    await goto(page, 'fernbrook', 12, 8, 'down');
    await step(page, 'down');
    expect(await sceneId(page)).toBe('ilse_call2');
    const lines = await drive(page);
    expect(lines.some(l => l[0] === 'Keeper Amos')).toBe(true);
    expect((await flags(page))['story.ilse_call2']).toBe(true);
    // Indoors the call never rings.
    await page.evaluate(() => PixelPets.setFlag('story.ilse_call2', null));
    await goto(page, 'fb_lantern_in', 5, 12, 'up'); await step(page, 'up');
    expect(await sceneId(page)).toBeNull();
  });

  test('O10: a #261 placeholder save (no crackdown) leans at once', async ({ page }) => {
    test.setTimeout(90000);
    await boot(page, joinSave({ 'story.crackdown': null, 'story.hall1_shut': null }));
    expect((await quest(page)).id).toBe('pick');
    await lean(page, 'Open the crates with Fen');
    expect((await flags(page))['story.orchard_lean']).toBe('open');
  });
});

test.describe('ACT1_KEEPER_JOIN: Fernbrook settles by lean and face (T11, with K1)', () => {
  test('T11 (D1562, D1674): crates packed settles Glimmerwell, crates opened settles the Keepers: chip, map line, plaza', async ({ page }) => {
    test.setTimeout(150000);
    await boot(page, joinSave(DONE));
    const out = {};
    for (const [lean, face] of [['pack', 'lanyard'], ['open', 'lanyard']]) {
      await page.evaluate(([l]) => { for (const k of ['story.orchard_lean', 'story.sway_fernbrook', 'story.keeper_cadet', 'story.cover', 'story.side', 'story.side_pick_done', 'story.orchard_cleared', 'story.ilse_call2']) PixelPets.setFlag(k, null);
        PixelPets.setFlag('story.orchard_lean', l); PixelPets.setFlag('story.sway_fernbrook', l === 'open' ? 2 : -2); PixelPets.setFlag('story.orchard_cleared', true); PixelPets.setFlag('story.ilse_call2', true); }, [lean]);
      // Before the face is set the town is still split (the hold settles at the face, D1553).
      expect(await page.evaluate(() => PixelPets.mapHold('fernbrook')), lean + ' before').toBe('split');   // settles at the face
      await enrolment(page, face);
      expect(await page.evaluate(() => PixelPets.runScene('enrol_lanyard'))).toBe(true); await drive(page);
      await goto(page, 'fernbrook', 12, 8, 'down');
      out[lean + '+' + face] = await page.evaluate(() => ({ hold: PixelPets.mapHold('fernbrook'), line: PixelPets.holdLine('fernbrook'), chip: PixelPets.sideBadge().hold, plaza: PixelPets.fbPlazaPhase(), sway: PixelPets.sway('fernbrook') }));
    }
    // D1562 (always the lanyard) and D1674 (the face moves no sway): Fernbrook settles from the lean alone at the enrolment.
    expect(out['pack+lanyard']).toMatchObject({ hold: 'glimmer', chip: 'glimmer', plaza: 'held_glimmer', sway: -2 });
    expect(out['open+lanyard']).toMatchObject({ hold: 'keepers', chip: 'keepers', plaza: 'held_keepers', sway: 2 });
    expect(out['open+lanyard'].line).toBe('The Keepers hold the town now. The orchard stays rooted.');
    expect(out['pack+lanyard'].line).toBe('Glimmerwell holds the town now. Lanterns on every gate.');
  });

  test('D1562: the pin-or-lanyard question stays in the data behind enrol:ask, off in play @w1', async ({ page }) => {
    await boot(page, joinSave(DONE));
    expect(await page.evaluate(() => PixelPets.enrolChoice)).toBe('lanyard');
    expect(await page.evaluate(() => PixelPets.condRead('enrol:ask'))).toMatchObject({ cond: false, key: true });
    const s = JSON.stringify(await page.evaluate(() => PixelPets.sceneScript('enrol')));
    expect(s).toContain('["if","enrol:ask"');
    expect(s).toContain('Wear the Cadet pin');   // D1511's branch, kept for ENROL_CHOICE = 'ask'
  });
});

// R1/R2 letters at a Lantern House Host; the recall; the plain Cadet's R3; the STANDING line.
// D1562: a new holder is always undercover, so the public-Keepers Cadet here is an old Keepers-pick save after the move (§9.2)
// that has had its Lodge talk; its letters carry the Keepers-face lines.
const PIN = Object.assign({}, DONE, { 'story.orchard_lean': 'open', 'story.orchard_cleared': true, 'story.sway_fernbrook': 3, 'story.keeper_cadet': true, 'story.side_pick_done': true, 'story.know_us': true, 'story.ilse_call_old': true, 'story.cover_done': true, 'story.rpt_old_seen': true });
const COVER = Object.assign({}, DONE, { 'story.orchard_lean': 'pack', 'story.orchard_cleared': true, 'story.sway_fernbrook': -2, 'story.ilse_call2': true, 'story.keeper_cadet': true, 'story.cover': 'glimmer', 'story.side': 'glimmer', 'story.side_pick_done': true, 'story.tour1_s1': true });
// A chain row is open: its `when` holds and its own `done` does not (the fixtures skip the steps in between).
const rowOpen = (page, id) => page.evaluate(i => { const e = PPQuests.byId(i), st = { flags: PixelPets.state.flags, seals: PixelPets.state.seals, pets: 1 };
  return e.when.every(c => PPQuests.evalCond(c, st)) && !e.done.every(c => PPQuests.evalCond(c, st)); }, id);
async function hostLetter(page, picks) {
  await goto(page, 'cc_lantern_in', 4, 4, 'up');
  expect(await page.evaluate(() => PixelPets.talkTo('cc_lantern_host'))).toBe(true);
  return drive(page, picks);
}

test.describe('ACT1_KEEPER_JOIN: reports, the recall and the STANDING line (K7)', () => {
  test('T12: a public Keepers Cadet gets R1 and R2 by a Host\'s letter; rpt_n written; the guide comes back after', async ({ page }) => {
    test.setTimeout(120000);
    await boot(page, joinSave(Object.assign({}, PIN, { 'story.seal2': true })));
    let lines = await hostLetter(page, ['Tell her all of it']);
    len110(lines);
    expect(lines[0]).toEqual(['Host Garnet', "A letter for you, sealed with the Warden's lantern. She wants one back."]);
    expect(said(lines, /^You think of Hale's Seal, and the quarry vote that passed by three votes\.$/)).toBe(true);
    expect(lines[lines.length - 1]).toEqual(['Warden Ilse', "I'll write it down. The Court will want to see this."]);   // D1700
    expect((await flags(page))['story.rpt_1']).toBe('told');
    // Nothing more is due: the Host is a Host again.
    expect(await page.evaluate(() => PixelPets.talkTo('cc_lantern_host'))).toBe(true);
    lines = await drive(page, ['Got it']);
    expect(said(lines, /^A letter for you/)).toBe(false);
    await page.evaluate(() => PixelPets.setFlag('story.hc_council_done', true));
    lines = await hostLetter(page, ['Keep some back']);
    expect(said(lines, /^You think of the Lantern Council, and the coast road\.$/)).toBe(true);
    expect(said(lines, /^You fold the letter with half of it left out\.$/)).toBe(true);
    expect((await flags(page))['story.rpt_2']).toBe('kept');
    // A plain Cadet after Brinewick: the Host passes Ilse's note on; R3 at the Lodge (9c-9e).
    await page.evaluate(() => PixelPets.setFlag('story.ep1_end', true));
    expect(await rowOpen(page, 'cadet_report')).toBe(true);
    lines = await hostLetter(page, ['Got it']);
    expect(lines[0][1]).toBe('A note from the Warden: come home to the Lodge. She wants the last of it in person.');
    await goto(page, 'hm_lodge_in', 5, 5, 'up');
    expect(await page.evaluate(() => PixelPets.talkTo('ilse_lodge_after'))).toBe(true);
    expect(await sceneId(page)).toBe('cadet_sendoff');
    lines = await drive(page, ['Tell her all of it']);
    expect(said(lines, /^That's their work done\. Don't go yet, Cadet\. Something came for you\.$/)).toBe(true);   // 9e, v0.1.6
    expect(said(lines, /Captain Lumen|capital/)).toBe(false);
    expect((await flags(page))['story.rpt_3']).toBe('told');
    // E8 (D1556): the STANDING line; no bag item (D1557).
    await goto(page, 'hearthmoor', 11, 7, 'down');
    await page.locator('#questBtn').tap();
    await page.waitForTimeout(700);   // the panel's tap guard
    await page.locator('#questTabStanding').click();
    await expect(page.locator('#questTabStanding')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#stCadet')).toHaveText('Keeper Cadet, Hearthmoor Lodge');
    await page.keyboard.press('Escape');
    expect(Object.keys(await page.evaluate(() => PixelPets.state.bag)).filter(k => /pin|cadet/.test(k))).toEqual([]);
    expect((await stored(page)).v).toBe(2);
  });

  test('T12, T13: a lanyard Cadet: R1 with the soft click, then the recall after Brinewick; side keepers, keepsakes kept', async ({ page }) => {
    test.setTimeout(150000);
    const s = joinSave(Object.assign({}, COVER, { 'story.seal2': true, 'story.arbiter_test_done': true }));
    s.seals.seal_glim_1 = 1700000000000; s.seals.seal_glim_2 = 1700000000000;
    await boot(page, s);
    let lines = await hostLetter(page, ['Tell her all of it']);
    expect(said(lines, /^You think of Quinn's back room, and the quota\.$/)).toBe(true);
    expect((await flags(page))['story.rpt_1']).toBe('told');
    // T13: after Brinewick, Ilse calls the undercover Cadet home on the first free outdoor step.
    await page.evaluate(() => { PixelPets.setFlag('story.gb_done', true); PixelPets.setFlag('story.rpt_2', 'kept'); PixelPets.setFlag('story.ep1_end', true); });
    expect(await rowOpen(page, 'recall')).toBe(true);
    await goto(page, 'cobblecrest', 10, 8, 'down'); await step(page, 'down');
    expect(await sceneId(page)).toBe('ilse_recall_call');
    lines = await drive(page, ['Answer']);
    expect(lines.map(l => l[1])).toContain("Come home. You've worn their colours long enough.");
    await goto(page, 'hm_lodge_in', 5, 5, 'up');
    expect(await page.evaluate(() => PixelPets.talkTo('ilse_lodge_after'))).toBe(true);
    expect(await sceneId(page)).toBe('recall');
    lines = await drive(page, ['Keep some back']);
    len110(lines);
    expect(lines[0]).toEqual(['Warden Ilse', 'Take it off. Keep it in a drawer, not on your coat.']);
    const f = await flags(page);
    expect(f['story.side']).toBe('keepers');
    expect(f['story.cover_done']).toBe(true);
    expect(f['story.rpt_3']).toBe('kept');
    expect(f['story.switches'] | 0).toBe(0);   // not a switch
    expect(Object.keys(await page.evaluate(() => PixelPets.state.seals)).sort()).toEqual(['seal_fernbrook', 'seal_glim_1', 'seal_glim_2']);
    expect(await page.evaluate(() => PixelPets.side)).toBe('keepers');
    // 9e (v0.1.6) leads into Ilse's posting; nothing in the recall sends the holder to Captain Lumen or the capital.
    expect(lines[lines.length - 1]).toEqual(['Warden Ilse', "That's their work done. Don't go yet, Cadet. Something came for you."]);
    expect(said(lines, /Captain Lumen|capital|Lantern Council/)).toBe(false);
    // D2020 (default): the Lantern Council waits for the Governor (story.hc_gov_met), so it is not the open row after the recall.
    expect(f['story.hc_council_done']).toBeUndefined();
    await page.evaluate(() => PixelPets.setFlag('story.cobble_end', true));   // the fixture skips Cobblecrest; a real recall has it
    expect(await rowOpen(page, 'hc_council')).toBe(false);
    const after = await quest(page);
    expect(after.id).not.toBe('hc_council');
    expect(after.text).not.toMatch(/Lumen|Lantern Council|Sky-Dock/);
    expect((await gate(page, 'hc_command_in', 'hc_council_trig')).whenOk).toBe(false);
    await goto(page, 'hc_command_in', 4, 5, 'up');
    expect(await page.evaluate(() => PixelPets.npcLine('hc_lumen'))).toBe('Lantern ships. No thunder, no guns.');
    expect(await sceneId(page)).toBeNull();
    // After the Governor, the Council opens in High Charity (the row, the Sky-Dock trigger and Lumen's talk).
    await page.evaluate(() => PixelPets.setFlag('story.hc_gov_met', true));
    expect(await rowOpen(page, 'hc_council')).toBe(true);
    expect((await gate(page, 'hc_command_in', 'hc_council_trig')).whenOk).toBe(true);
    expect(await page.evaluate(() => PixelPets.npcLine('hc_lumen'))).toBe('@hc_council');
    expect(await page.evaluate(() => PixelPets.runScene('hc_council'))).toBe(true);
    const council = await drive(page);
    len110(council);
    expect(said(council, /^You walked the coast in their colours, and came home in ours\./)).toBe(true);
    expect(said(council, /We are opening it|THE ROAD AHEAD/)).toBe(false);   // the road is already walked
    expect((await flags(page))['story.hc_council_done']).toBe(true);
    // The recall rings once: no call after it.
    await goto(page, 'hearthmoor', 11, 7, 'down'); await step(page, 'down');
    expect(await sceneId(page)).toBeNull();
  });

  test('reports stop after an Act 3 switch (D1559, D1629) or the loyalist\'s choice (D1514) @w1', async ({ page }) => {
    await boot(page, joinSave(Object.assign({}, PIN, { 'story.seal2': true, 'story.switched_a3': true })));
    let lines = await hostLetter(page, ['Got it']);
    expect(said(lines, /^A letter for you/)).toBe(false);
    await page.evaluate(() => { PixelPets.setFlag('story.switched_a3', null); PixelPets.setFlag('story.warden_cut', true); });
    lines = await hostLetter(page, ['Got it']);
    expect(said(lines, /^A letter for you/)).toBe(false);
  });
});

// §11.1 (T16): one fixture per old-save kind, loaded as a real old save (no move marker). D1546 B: the move is written once,
// at load, with no call; a toast tells the holder. Every row: no key removed, v 2, zero console errors.
const OLD_BASE = Object.assign({}, AFTER_NIGHT, { 'story.crackdown': null, 'story.hall1_shut': null, 'story.post_trial_done': null, 'story.fen_lean': null });
const G = { 'story.side': 'glimmer', 'story.side_pick_done': true };
const OLD = {
  O1: { flags: Object.assign({}, G, { 'story.post_trial_done': true }), seals: ['seal_fernbrook', 'seal_glim_1'], quest: ['heights', 'tobin_crates'], tobin: true, hold: 'glimmer' },
  O2: { flags: Object.assign({}, G, { 'story.seal1': null, 'story.orchard_cleared': true, 'story.heights_done': true, 'story.heights_path': 'lab', 'story.tour1_s1': true }), seals: [], quest: 'hall1_holders', strip: ['trainer.h1_cadet', 'trainer.h1_challenger', 'trainer.h1_local', 'trainer.hall1_fen', 'story.crates_seen', 'story.fen_sent_home', 'story.tally_done'] },
  O3: { flags: Object.assign({}, G, { 'story.orchard_cleared': true, 'story.heights_done': true, 'story.slice_end': true, 'story.reached_route2': true, 'story.met_census': true, 'story.reached_glen': true, 'story.met_lead': true, 'story.glen_cleared': true, 'story.route2_end': true, 'story.reached_cobblecrest': true, 'story.cobble_arrived': true, 'story.reached_quarry': true, 'story.quarry_bought': true, 'story.gb_tune_asked': true }), seals: ['seal_fernbrook', 'seal_glim_1'], quest: 'hall2' },
  O4: { base: 'O3', flags: { 'story.seal2': true }, seals: ['seal_fernbrook', 'seal_glim_1', 'seal_glim_2'], quest: 'hook', hale: true },
  O5: { base: 'O4', flags: { 'story.cobble_end': true, 'story.rook_end': 'stays', 'story.rc_start': true, 'story.rc_done': true, 'story.rc_climax': true, 'story.gb_invited': true }, seals: ['seal_fernbrook', 'seal_glim_1', 'seal_glim_2'], quest: 'hc_council' },
  O6: { base: 'O5', flags: { 'story.gb_relay_done': true, 'story.gb_hollis': true, 'story.gb_done': true }, quest: 'route3', road: true },   // E4 opens the road on the first map read
  O7: { base: 'O6', flags: { 'story.route3_open': true, 'story.reached_brinewick': true, 'story.brine_depot': true, 'story.brine_manifest': true }, quest: 'brine_crate' },
  O8: { base: 'O7', flags: { 'story.brine_freed': true, 'story.brine_dorian': true, 'story.seal3': true, 'story.ep1_end': true }, seals: ['seal_fernbrook', 'seal_glim_1', 'seal_glim_2', 'seal_glim_3'], quest: 'rpt_lodge', report: ['rpt_1', 'rpt_2', 'rpt_3'] },
  O9: { flags: { 'story.side_pick_done': true, 'story.orchard_cleared': true, 'story.post_trial_done': true }, seals: ['seal_fernbrook'], hold: 'keepers', keepers: true },
};
function oldFixture(kind) {
  const chain = []; for (let k = kind; k; k = OLD[k].base) chain.unshift(OLD[k]);
  const flags = Object.assign({}, OLD_BASE);
  let seals = [];
  for (const row of chain) { Object.assign(flags, row.flags); if (row.seals) seals = row.seals; for (const k of row.strip || []) flags[k] = null; }
  const s = joinSave(flags);
  for (const k of Object.keys(OLD_BASE)) if (flags[k] === null) delete s.flags[k];
  s.seals = Object.fromEntries(seals.map(id => [id, 1700000000000]));
  s.bag = OLD[kind].keepers ? {} : { cracked_phone: 1 };
  const want = {}; for (const r of chain) for (const k of ['quest', 'hold', 'hale', 'road', 'report', 'keepers', 'tobin']) if (r[k] !== undefined) want[k] = r[k];
  if (!OLD[kind].hale) delete want.hale; if (!OLD[kind].road) delete want.road; if (!OLD[kind].tobin) delete want.tobin;
  return { s, want };
}

test.describe('ACT1_KEEPER_JOIN: the old-save move at load (K8, T16)', () => {
  for (const kind of Object.keys(OLD)) {
    test(`${kind}: moved once at load, no call; next step and keepsakes as §9.3 says`, async ({ page }) => {
      test.setTimeout(90000);
      const { s, want } = oldFixture(kind);
      const glim = !want.keepers;
      await boot(page, s, { oldSave: true });
      const f = await flags(page);
      // §9.2, written once at load.
      expect(f['story.keeper_cadet']).toBe(true);
      expect(f['story.ilse_call_old']).toBe(true);
      expect(f['story.cover_done']).toBe(true);
      expect(f['story.side_pick_done']).toBe(true);
      expect(f['story.side'] === 'glimmer').toBe(false);
      if (glim) expect(f['story.side']).toBe('keepers');
      expect(f['story.sway_fernbrook']).toBe(glim ? -2 : 3);
      expect(f['story.fen_lean']).toBe(glim ? -1 : 1);
      if (!s.flags['story.orchard_lean']) expect(f['story.orchard_lean']).toBe(glim ? 'pack' : 'open');
      expect(f['story.switches'] | 0).toBe(0);
      const st = await stored(page);
      expect(st.v).toBe(2);
      expect(st.flags['story.keeper_cadet']).toBe(true);   // on disk at load
      for (const k of Object.keys(s.flags)) expect(st.flags, k).toHaveProperty([k]);
      for (const k of Object.keys(s.seals)) expect(st.seals, k).toHaveProperty([k]);   // Seals and Tier lanyards stay (D1547)
      if (glim) expect(st.bag.cracked_phone | 0).toBe(1);
      expect(await sceneId(page)).toBeNull();   // no call card
      // The one toast, on the first free moment.
      await page.waitForFunction(() => PixelPets.toasts.includes("You're a Keeper Cadet now. See Ilse."), null, { timeout: 8000 });
      if (want.quest) expect([].concat(want.quest)).toContain((await quest(page)).id);
      if (kind === 'O5') {   // D2020 keeps a moved save's Council where it was: cover_done with no story.cover is not a recall
        expect(await rowOpen(page, 'hc_council')).toBe(true);
        expect((await gate(page, 'hc_command_in', 'hc_council_trig')).whenOk).toBe(true);
      }
      if (want.tobin) expect((await gate(page, 'fernbrook', 'fern_associate')).whenOk).toBe(true);   // O1: Tobin's battle, then the Keepers result
      if (want.hold) expect(await page.evaluate(() => PixelPets.mapHold('fernbrook'))).toBe(want.hold);
      if (want.hale) {   // O4: Hale's floor stays open for the real Seal (D1547)
        await goto(page, 'cc_hall_in', 5, 4, 'up');
        expect(await page.evaluate(() => PixelPets.talkTo('hale'))).toBe(true);
        const hl = await drive(page, ['Leave']);
        expect(hl.map(l => l[1])).toContain("Stone stands firm. Show me how you'd move it.");
      }
      if (want.road) {   // O6: either finale opens Route 3 (E4, D1548); the Council is skipped
        await goto(page, 'cobblecrest', 12, 8, 'down');
        expect((await flags(page))['story.route3_open']).toBe(true);
        expect((await quest(page)).id).toBe('route3');
      }
      if (want.report) {   // O8: the old-save Lodge talk fills every passed report point (D1549), then the send-off line
        await goto(page, 'hm_lodge_in', 5, 5, 'up');
        expect(await page.evaluate(() => PixelPets.talkTo('ilse_lodge_after'))).toBe(true);
        expect(await sceneId(page)).toBe('rpt_old');
        const lines = await drive(page, ['Tell her all of it']);
        expect(lines[0]).toEqual(['Warden Ilse', 'What did they show you? What did you show them?']);
        expect(said(lines, /^Someone I trust found Fernbrook's Seals in a lamp ledger\. Remember that\.$/)).toBe(true);
        expect(said(lines, /^That's their work done\. Don't go yet, Cadet\. Something came for you\.$/)).toBe(true);   // 9e, v0.1.6
        expect(said(lines, /Captain Lumen|capital/)).toBe(false);
        const g = await flags(page);
        for (const k of want.report) expect(g['story.' + k], k).toBe('told');
        expect(g['story.rpt_old_seen']).toBe(true);
        expect((await quest(page)).id).toBe('gov_post');   // GOVERNOR_MEETING §6.3: Act 2 opens with Ilse's posting
      }
      // O11 (every kind): reloading never moves twice; nothing new is written.
      const once = JSON.stringify((await stored(page)).flags);
      await page.reload({ waitUntil: 'commit' });
      await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && PixelPets.state);
      const again = await stored(page);
      expect(again.flags['story.ilse_call_old']).toBe(true);
      expect(again.flags['story.sway_fernbrook']).toBe(glim ? -2 : 3);
    });
  }

  test('O9 keepers pick: a keepers save hears its own Lodge line; O10: a placeholder save is not moved', async ({ page }) => {
    test.setTimeout(90000);
    const { s } = oldFixture('O9');
    await boot(page, s, { oldSave: true });
    await goto(page, 'hm_lodge_in', 5, 5, 'up');
    expect(await page.evaluate(() => PixelPets.talkTo('ilse_lodge_after'))).toBe(true);
    const lines = await drive(page, ['Keep some back']);
    expect(lines[0]).toEqual(['Warden Ilse', "Tell me what you've seen on the road."]);
    const f = await flags(page);
    expect(f['story.rpt_old_seen']).toBe(true);
    expect(f['story.rpt_1']).toBeUndefined();   // no report point passed yet
  });

  test('O10: a #261 placeholder save (no pick) is never moved @w1', async ({ page }) => {
    await boot(page, joinSave({ 'story.crackdown': null, 'story.hall1_shut': null }), { oldSave: true });
    const f = await flags(page);
    expect(f['story.keeper_cadet']).toBeUndefined();
    expect(f['story.ilse_call_old']).toBeUndefined();
    expect((await quest(page)).id).toBe('pick');
  });

  test('D1515: a new Keepers Cadet\'s Rook stays with the company at the hook', async ({ page }) => {
    await boot(page, joinSave(Object.assign({}, PIN, { 'story.seal2': true })));
    const script = JSON.stringify(await page.evaluate(() => PixelPets.sceneScript('brinewick_hook')));
    expect(script).toContain('["setFlag","story.rook_end","stays"]');
    expect(script).not.toContain('"ally"');
  });
});

// E9 (checker) and T18: nothing clears story.keeper_cadet; story.side is written only by the lanyard step, the recall, the
// old-save move and switchSide; every new line fits and stays off the banned list.
test('E9 / T18: the join data never clears the Cadet, writes story.side only where allowed, and every line fits @w1', async ({ page }) => {
  await boot(page, joinSave());
  const r = await page.evaluate(() => {
    const out = { cadetCleared: [], sideWriters: [], says: [] };
    const walk = (n, where) => {
      if (!Array.isArray(n)) return;
      if (n[0] === 'setFlag' && n[1] === 'story.keeper_cadet' && !n[2]) out.cadetCleared.push(where);
      if ((n[0] === 'setFlag' && n[1] === 'story.side') || n[0] === 'pledge') out.sideWriters.push(where);
      if (n[0] === 'say' && where.startsWith('join:')) out.says.push(n[2]);
      if (n[0] === 'choice' && where.startsWith('join:')) { out.says.push(n[1]); for (const o of n[2] || []) out.says.push(o[0]); }
      n.forEach(x => walk(x, where));
    };
    for (const [k, src] of Object.entries(MAPDATA)) for (const [id, steps] of Object.entries((src && src.scenes) || {})) walk(steps, (k === 'detail_zz_keeper_join' ? 'join:' : '') + id);
    const J = MAPDATA.detail_zz_keeper_join;
    for (const n of (J.hostNotes || [])) out.says.push(n.line);
    for (const p of Object.values(J.objPatch)) if (p && p.linesFirst) for (const v of Object.values(p.linesFirst)) if (v[0] !== '@') out.says.push(v);
    for (const o of J.slicePatch.maps.route2_glen.addObjs) for (const v of Object.values(o.lines || {})) if (v[0] !== '@') out.says.push(v);
    return out;
  });
  expect(r.cadetCleared).toEqual([]);
  expect(r.sideWriters).toEqual(expect.arrayContaining(['join:enrol_lanyard', 'join:recall']));
  for (const w of r.sideWriters) expect(['join:enrol_lanyard', 'join:recall', 'rook_offer']).toContain(w);
  for (const text of r.says) {
    expect(Array.from(text).length, text).toBeLessThanOrEqual(110);
    expect(text, text).not.toMatch(/\b(chips?|chipped|relays?|tuning|bellgold|arbiter|call-up|alien|fainted|evolv\w*|coins?|appeared|trainer)\b|dex\b|\s{2}/i);
  }
});

test('D1560: one ?debug=1 place per beat; the old-save places run the move on their flags @w1', async ({ page }) => {
  test.setTimeout(90000);
  await boot(page, joinSave());
  const ids0 = (await page.evaluate(() => PixelPets.checkpoints())).map(c => c.id);
  for (const id of ['chi_meet', 'chi_shifts', 'chi_report', 'pick', 'enrol', 'enrol_lanyard', 'kj_hut', 'kj_day', 'kj_night', 'kj_lean', 'kj_lodge', 'kj_recall', 'kj_old_glimmer', 'kj_old_keepers']) expect(ids0, id).toContain(id);
  expect((await page.evaluate(() => PixelPets.checkpoint('kj_recall'))).ok).toBe(true);
  expect(await page.evaluate(() => PixelPets.mapInfo.id)).toBe('brinewick');
  // the recall call is due here (it rings on the next free outdoor step; tests T13 rings it)
  const due = await page.evaluate(() => MAPDATA.detail_zz_keeper_join.calls.find(c => c.id === 'ilse_recall').when.every(c => PixelPets.condRead(c).cond));
  expect(due).toBe(true);
  expect((await page.evaluate(() => PixelPets.checkpoint('kj_old_glimmer'))).ok).toBe(true);
  const f = await flags(page);
  expect([f['story.keeper_cadet'], f['story.side'], f['story.sway_fernbrook'], f['story.ilse_call_old']]).toEqual([true, 'keepers', -2, true]);
  expect((await page.evaluate(() => PixelPets.checkpoint('kj_hut'))).ok).toBe(true);
  expect(await page.evaluate(() => PixelPets.mapInfo.id)).toBe('hw_weir_hut_in');
});

test('T15 (with K2): the switch is locked in Act 2, opens in Act 3 to Glimmerwell only, and drops every sway by 2 @w1', async ({ page }) => {
  await boot(page, joinSave(Object.assign({}, DONE, { 'story.orchard_lean': 'open', 'story.orchard_cleared': true, 'story.sway_fernbrook': 2, 'story.keeper_cadet': true, 'story.side_pick_done': true, 'story.cover': 'glimmer', 'story.cover_done': true, 'story.side': 'keepers', 'story.rc_climax': true })));
  await page.evaluate(() => { PixelPets.state.standing.glimmer = 60; });
  const r = await page.evaluate(() => {
    const F = PixelPets.state.flags, st = PixelPets.state.standing;
    return { a2: PPStanding.canSwitch(F, st, 'keepers', 'glimmer', 2), a3: PPStanding.canSwitch(F, st, 'keepers', 'glimmer', 3), back: PPStanding.canSwitch(F, st, 'glimmer', 'keepers', 3) };
  });
  expect(r.a2).toMatchObject({ ok: false, why: 'locked' });
  expect(r.a3).toMatchObject({ ok: true });
  expect(r.back).toMatchObject({ ok: false, why: 'one_way' });
  expect(await page.evaluate(() => PixelPets.switchSide('glimmer'))).toBe(true);
  const f = await flags(page);
  expect(f['story.side']).toBe('glimmer');
  expect(f['story.sway_fernbrook']).toBe(0);
});
