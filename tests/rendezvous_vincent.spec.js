/* RENDEZVOUS_VINCENT v0.1 (handoff/specs/RENDEZVOUS_VINCENT.md, D1396-D1410), beats 3-5 on top of POST_TRIAL_CRACKDOWN's call and
   debrief (beats 1-2, played in post_trial_crackdown.spec.js). Ilse sends the holder to Vincent at the Route 1 stream bank; one shift
   with each side, in either order; the report sets story.rdv_done, and only then does the built side pick open (D1403).
   Every test runs at 320, 375 and 390 with reduced motion and the console-error tracker. Saves stay pixelpets.save.v2, v 2. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);
test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });

function fernSave(extra) {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.textSpeed = 'fast';
  Object.assign(s.flags, { 'story.reached_route1': true, 'story.rival1_done': true, 'story.reached_fernbrook': true, 'story.met_glimmerwell': true, 'story.met_fen': true, 'story.phone_got': true }, extra || {});
  s.world = { map: 'fernbrook', x: 12, y: 8, facing: 'down', respawn: 'fernbrook' };
  s.standing = { keepers: 0, glimmer: 0 };
  return s;
}
async function boot(page, checkpoint, extra) {
  await installSave(page.context(), fernSave(extra), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && typeof PixelPets.talkTo === 'function');
  await page.evaluate(() => PixelPets.showTab('walk'));
  if (checkpoint) expect((await page.evaluate(id => PixelPets.checkpoint(id), checkpoint)).ok).toBe(true);
  // A checkpoint writes only done flags; the street scene also writes these beside story.crackdown.
  if (checkpoint) await page.evaluate(() => { PixelPets.setFlag('story.hall1_shut', true); PixelPets.setFlag('story.fen_lean', 2); });
}
const flags = page => page.evaluate(() => Object.assign({}, PixelPets.state.flags));
const sceneId = page => page.evaluate(() => PixelPets.scene && PixelPets.scene.id);
const questId = page => page.evaluate(() => PixelPets.quest && PixelPets.quest.id);
const objIds = page => page.evaluate(() => PixelPets.mapObjs.map(o => o.id));
async function go(page, map, x, y, dir) {
  await page.evaluate(({ map, x, y, dir }) => PixelPets.goto(map, x, y, dir), { map, x, y, dir });
  await page.waitForFunction(m => PixelPets.mapInfo.id === m && !PixelPets.fading, map);
}
// Plays the open scene to its end: taps through lines, answers choices from `picks` (else the first). Returns every line shown.
async function drive(page, picks = [], ms = 120000) {
  const until = Date.now() + ms, lines = [];
  while (Date.now() < until) {
    const sc = await page.evaluate(() => PixelPets.scene && { mode: PixelPets.scene.mode, full: PixelPets.scene.full, waiting: PixelPets.scene.waiting, text: PixelPets.scene.text });
    if (!sc) { await page.waitForTimeout(150); if (!(await page.evaluate(() => !!PixelPets.scene))) return lines; continue; }
    if (sc.mode === 'choice') {
      if (!sc.full) { await page.keyboard.press('Space'); continue; }
      if (!(await page.locator('#sbChoices button:visible').count())) { await page.waitForTimeout(40); continue; }
      await page.waitForFunction(() => PixelPets.optionsReady === true);
      const labels = (await page.locator('#sbChoices button').allTextContents()).map(t => t.trim());
      const pick = labels.find(l => picks.includes(l)) || labels[0];
      // Tap targets are 44 px or more and inside the viewport (rule 6).
      const box = await page.locator('#sbChoices button', { hasText: pick }).first().boundingBox();
      const vw = page.viewportSize().width;
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.x >= 0 && box.x + box.width <= vw + 0.5).toBe(true);
      lines.push('> ' + pick);
      await page.locator('#sbChoices button', { hasText: pick }).first().click();
      await page.waitForTimeout(40); continue;
    }
    if (sc.mode === 'say' && sc.waiting) {
      if (sc.full && lines[lines.length - 1] !== sc.text) lines.push(sc.text);
      await page.keyboard.press('Space'); await page.waitForTimeout(30); continue;
    }
    await page.waitForTimeout(40);
  }
  throw new Error('scene did not end');
}
// A real reload: installSave's init script re-seeds the first save on every load, so a later init script puts the game's own
// latest save back first (init scripts run in order). The game then loads exactly what it last wrote.
async function reloadKeeping(page) {
  const saved = await page.evaluate(() => localStorage.getItem('pixelpets.save.v2'));
  await page.context().addInitScript(sv => localStorage.setItem('pixelpets.save.v2', sv), saved);
  await page.reload();
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && typeof PixelPets.talkTo === 'function');
  await page.evaluate(() => PixelPets.showTab('walk'));
}
async function talk(page, id) {
  expect(await page.evaluate(i => PixelPets.talkTo(i), id), id).toBe(true);
}
async function meetVincent(page) {
  await go(page, 'route1', 29, 13, 'up');
  expect(await objIds(page)).toContain('rdv_vincent');
  await talk(page, 'rdv_vincent');
  expect(await sceneId(page)).toBe('rdv_meet');
  return drive(page);
}
async function shiftG(page, pick) {
  await go(page, 'fernbrook', 29, 8, 'right');
  await talk(page, 'juniper_east');
  expect(await sceneId(page)).toBe('shift_g');
  return drive(page, [pick]);
}
async function shiftK(page, pick) {
  await go(page, 'fb_lantern_in', 6, 5, 'up');
  await talk(page, 'amos');
  return drive(page, ['Walk the round', pick]);
}

test('debrief → Vincent → both shifts (Keeper first) → report → the built pick', async ({ page }) => {
  test.setTimeout(240000);
  await boot(page, 'warden_summons');
  const before = await page.evaluate(() => ({ keys: Object.keys(PixelPets.state).sort(), v: PixelPets.state.v, lean: PixelPets.state.flags['story.fen_lean'] }));
  expect(await questId(page)).toBe('warden_summons');
  // Beat 2's end: Ilse names Vincent and the stream bank.
  await go(page, 'hm_lodge_in', 5, 5, 'up');
  await talk(page, 'ilse_lodge_after');
  expect(await sceneId(page)).toBe('warden_meet');
  const ilse = await drive(page);
  expect(ilse.join(' ')).toMatch(/Vincent/);
  expect(ilse.join(' ')).toMatch(/stream bank/);
  expect((await flags(page))['story.warden_met']).toBe(true);
  expect(await questId(page)).toBe('rdv_meet');
  // The pick stays closed, and Fernbrook stays contested.
  expect(await page.evaluate(() => PixelPets.gateRead('fernbrook', 'fb_side_pick').whenOk)).toBe(false);
  expect(await page.evaluate(() => PixelPets.mapHold('fernbrook'))).toBe('split');
  // Beat 3: Vincent, reachable from both ends of Route 1.
  for (const [x, y] of [[2, 8], [46, 8]]) {
    await go(page, 'route1', x, y, 'down');
    const path = await page.evaluate(() => PixelPets.findPath([{ x: 29, y: 13 }, { x: 28, y: 12 }, { x: 29, y: 11 }]));
    expect(path && path.length, 'from ' + x).toBeGreaterThan(0);
  }
  await meetVincent(page);
  expect((await flags(page))['story.rdv_met']).toBe(true);
  expect(await questId(page)).toBe('rdv_shifts');
  // Off the wire (D1398): Vincent never becomes a phone contact.
  expect((await page.evaluate(() => PixelPets.contacts())).map(c => c.name)).not.toContain('Vincent');
  // He waits while the shifts are open.
  await talk(page, 'rdv_vincent');
  expect(await sceneId(page)).toBe('rdv_wait');
  await drive(page);
  // Beat 4b first (D1406: either order): the Keeper night shift with Amos. The roll, with the holder's own name.
  const k = await shiftK(page, 'Tell Amos');
  expect(k.join(' ')).toMatch(/FERNBROOK ROLL/);
  expect(k.join(' ')).toMatch(/Tester/);
  let f = await flags(page);
  expect([f['story.shift_k'], f['story.pitch_k'], f['story.shift_g']]).toEqual([true, true, undefined]);
  expect(await page.evaluate(() => PixelPets.gateRead('fernbrook', 'fb_side_pick').whenOk)).toBe(false);
  // Beat 4a: Juniper's crew. The ledger, the beat-late Walkling, the Partners-only door.
  const g = await shiftG(page, 'Ask about the cart');
  expect(g.join(' ')).toMatch(/OLD SEALS/);
  expect(g.join(' ')).toMatch(/PARTNERS ONLY/);
  f = await flags(page);
  expect([f['story.shift_g'], f['story.pitch_g']]).toEqual([true, true]);
  expect(await questId(page)).toBe('rdv_report');
  expect(await page.evaluate(() => PixelPets.gateRead('fernbrook', 'fb_side_pick').whenOk)).toBe(false);
  // Beat 5: the report. Then he leaves, and the built pick opens.
  await go(page, 'route1', 29, 13, 'up');
  await talk(page, 'rdv_vincent');
  expect(await sceneId(page)).toBe('rdv_report');
  const r = await drive(page, ['The ledger']);
  expect(r.join(' ')).toMatch(/orchard gate/);
  f = await flags(page);
  expect(f['story.rdv_done']).toBe(true);
  expect(await objIds(page)).not.toContain('rdv_vincent');
  expect(await questId(page)).toBe('pick');
  expect(await page.evaluate(() => PixelPets.gateRead('fernbrook', 'fb_side_pick').whenOk)).toBe(true);
  expect(await page.evaluate(() => PixelPets.mapHold('fernbrook'))).toBe('split');   // the hold flips only at the pick result (D1171)
  // Save: same key, v 2, no new top-level key; Fen's lean is not moved by the rendezvous (D1407).
  const after = await page.evaluate(() => { PixelPets.goto('route1', 29, 13); return JSON.parse(localStorage.getItem('pixelpets.save.v2')); });
  expect(after.v).toBe(2);
  expect(Object.keys(after).every(k => before.keys.includes(k))).toBe(true);
  expect(after.flags['story.fen_lean']).toBe(before.lean);
  // The built pick runs at the orchard gate.
  await go(page, 'fernbrook', 9, 9, 'down');
  await page.evaluate(() => PixelPets.walkStep('down')); await page.waitForTimeout(400);
  expect(await sceneId(page)).toBe('side_pick');
});

test('Glimmerwell shift first, then Keeper; Fen and Ilse point the right way at each step', async ({ page }) => {
  test.setTimeout(180000);
  await boot(page, 'rdv_meet');
  expect(await questId(page)).toBe('rdv_meet');
  // Fen at the gate and Ilse's repeat line both send the holder on to Vincent.
  await go(page, 'fernbrook', 12, 8, 'down');
  expect(JSON.stringify(await page.evaluate(() => PixelPets.npcLine('fen_dawn')))).toMatch(/Ilse sent you on/);
  await go(page, 'hm_lodge_in', 5, 5, 'up');
  await talk(page, 'ilse_lodge_after');
  expect(await sceneId(page)).toBe('warden_after');
  expect((await drive(page)).join(' ')).toMatch(/Vincent is waiting/);
  await meetVincent(page);
  await shiftG(page, 'Keep packing');
  expect(await questId(page)).toBe('rdv_shifts');
  // Juniper's shift doesn't repeat; Vincent now points at Amos.
  await go(page, 'route1', 29, 13, 'up');
  await talk(page, 'rdv_vincent');
  expect((await drive(page)).join(' ')).toMatch(/Now Amos/);
  await shiftK(page, 'Keep it quiet');
  const f = await flags(page);
  expect([f['story.shift_g'], f['story.shift_k']]).toEqual([true, true]);
  expect(await questId(page)).toBe('rdv_report');
  // Reload at this boundary: the report is next, and the state survives.
  await reloadKeeping(page);
  expect(await questId(page)).toBe('rdv_report');
  await go(page, 'route1', 29, 13, 'up');
  await talk(page, 'rdv_vincent');
  expect(await sceneId(page)).toBe('rdv_report');
});

test('reloads mid-way resume at the right step', async ({ page }) => {
  test.setTimeout(120000);
  // Met Vincent, no shift yet: he waits; Juniper offers her shift; Amos offers the round.
  await boot(page, 'rdv_shifts');
  await go(page, 'fernbrook', 12, 8, 'down');   // the game writes its save on a map change
  await reloadKeeping(page);
  expect(await questId(page)).toBe('rdv_shifts');
  await go(page, 'route1', 29, 13, 'up');
  await talk(page, 'rdv_vincent');
  expect(await sceneId(page)).toBe('rdv_wait');
  await drive(page);
  await go(page, 'fernbrook', 29, 8, 'right');
  await talk(page, 'juniper_east');
  expect(await sceneId(page)).toBe('shift_g');
  await page.evaluate(() => PixelPets.endScene());
});

test('guards: picked saves and #261 placeholder saves never see the rendezvous', async ({ page }) => {
  test.setTimeout(120000);
  // #261 placeholder: post_trial_done with no crackdown keeps today's pick and never meets Vincent.
  await boot(page, null, { 'story.seal1': true, 'story.lizzy_class': true, 'story.post_trial_done': true });
  expect(await questId(page)).toBe('pick');
  expect(await page.evaluate(() => PixelPets.gateRead('fernbrook', 'fb_side_pick').whenOk)).toBe(true);
  await go(page, 'route1', 29, 13, 'up');
  expect(await objIds(page)).not.toContain('rdv_vincent');
  // A save that already picked: no Vincent, no shift offers.
  await page.evaluate(() => { PixelPets.setFlag('story.crackdown', true); PixelPets.setFlag('story.warden_met', true); PixelPets.setFlag('story.rdv_met', true); PixelPets.setFlag('story.side', 'keepers'); PixelPets.setFlag('story.side_pick_done', true); });
  await go(page, 'route1', 29, 13, 'up');
  expect(await objIds(page)).not.toContain('rdv_vincent');
  // The chain still checks clean.
  expect(await page.evaluate(() => PixelPets.questCheck)).toEqual([]);
});

test('player text: line limits, no chip words, no banned words', async ({ page }) => {
  await boot(page, null);
  const scan = await page.evaluate(() => {
    const ids = ['rdv_meet', 'rdv_wait', 'shift_g', 'shift_k', 'rdv_report', 'warden_meet', 'warden_after'];
    const out = { say: [], choice: [], text: [] };
    const walk = steps => { for (const s of steps || []) {
      if (s[0] === 'say') out.say.push(s[2]);
      if (s[0] === 'choice') { out.say.push(s[1]); for (const o of s[2]) { out.choice.push(o[0]); walk(o[1]); } }
      if (s[0] === 'if') { walk(s[2]); walk(s[3]); }
    } };
    for (const k of Object.keys(MAPDATA)) { const sc = MAPDATA[k] && MAPDATA[k].scenes; if (sc) for (const id of ids) if (sc[id]) walk(sc[id]); }
    return out;
  });
  expect(scan.say.length).toBeGreaterThan(30);
  for (const t of scan.say) expect(t.length, t).toBeLessThanOrEqual(110);
  for (const t of scan.choice) expect(t.length, t).toBeLessThanOrEqual(30);
  const all = scan.say.concat(scan.choice).join('\n');
  expect(all).not.toMatch(/\b(chip|tuning|implant|relay)\b|under the fur/i);
  expect(all).not.toMatch(/\b(faint\w*|evolv\w*|coins?|appeared|\w+dex|gym|tv|rival|trainer)\b|go, \w+!/i);
});
