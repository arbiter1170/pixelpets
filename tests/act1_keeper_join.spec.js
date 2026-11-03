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
      if (!sc.full) { await page.keyboard.press('Space'); await page.waitForTimeout(30); continue; }
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
      "I can't search my own Commanders' tents. I know someone who searches anything.",
      "Vincent Chi. No phone, no side. Past the fallen trunk at Wickerglen's east edge. Say I sent you.",
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
    expect(lines[0][1]).toBe('A Keeper slip on the post: LAMP CLOSED FOR REVIEW. The lamp still hums.');
    expect(await page.evaluate(() => PixelPets.talkTo('glen_constable'))).toBe(true);
    lines = await drive(page);
    expect(lines[0]).toEqual(['Keeper Constable', "Orders came down. A review. Don't ask me how long."]);
    // After the enrolment Imogen's battle is back; once the Heights are done the slip is a brass plate and the Constable goes.
    await page.evaluate(() => { PixelPets.setFlag('story.keeper_cadet', true); PixelPets.setFlag('story.heights_done', true); });
    await goto(page, 'route2_glen', 12, 17, 'up');
    o = await ids(page);
    expect(o).toContain('r2_lead');
    expect(o).not.toContain('glen_imogen');
    expect(o).not.toContain('glen_constable');
    expect(await page.evaluate(() => PixelPets.talkTo('glen_lamp_n'))).toBe(true);
    lines = await drive(page);
    expect(lines[0][1]).toBe('Fresh paint on the post. A brass plate: BY PERMIT OF HIGH CHARITY.');
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
    expect((await quest(page)).id).not.toBe('chi_meet');
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
    expect(lines[lines.length - 1][1]).toBe("Go home by the orchard. Fen's crates are still at the gate.");
    for (const l of lines) expect(Array.from(l[1]).length, l[1]).toBeLessThanOrEqual(110);
    const f = await flags(page);
    expect(f['story.chi_done']).toBe(true);
    expect(f['story.chi_jars']).toBe(6);
    // The lean is next (K6 keys the gate on story.chi_done).
    expect(await page.evaluate(() => PixelPets.talkTo('chi_hut'))).toBe(true);
    expect((await drive(page))[0][1]).toBe("Go home by the orchard. Fen's crates are still at the gate.");
  });
});

