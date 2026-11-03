/* POST_TRIAL_CRACKDOWN v0.3.1 (handoff/specs/POST_TRIAL_CRACKDOWN.md) plus Vincent's Nov 3, 2026 change (D1395): after Seal 1 the
   Keeper tanks roll in, the night passes in the Lantern House, the holder is let go at dawn under a curfew order that stands until the
   pick (§5), and the only change from the spec: Warden Ilse's wire sends the holder home (WARDEN_SUMMONS placeholder) before the pick. Engine steps E1-E5 (D1204). Saves stay pixelpets.save.v2, v 2. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

function fernSave(extra) {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.textSpeed = 'fast';
  Object.assign(s.flags, { 'story.reached_route1': true, 'story.rival1_done': true, 'story.reached_fernbrook': true, 'story.met_glimmerwell': true, 'story.met_fen': true, 'story.phone_got': true }, extra || {});
  s.world = { map: 'fernbrook', x: 12, y: 8, facing: 'down', respawn: 'fernbrook' };
  s.standing = { keepers: 0, glimmer: 0 };
  return s;
}
async function boot(page, checkpoint, opts = {}) {
  await installSave(page.context(), fernSave(opts.extra), { quietDay: true });
  if (opts.reduce) await page.emulateMedia({ reducedMotion: 'reduce' });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && typeof PixelPets.talkTo === 'function');
  await page.evaluate(() => PixelPets.showTab('walk'));
  if (checkpoint) expect((await page.evaluate(id => PixelPets.checkpoint(id), checkpoint)).ok).toBe(true);
}
const flags = page => page.evaluate(() => Object.assign({}, PixelPets.state.flags));
const sceneId = page => page.evaluate(() => PixelPets.scene && PixelPets.scene.id);
const objs = page => page.evaluate(() => PixelPets.mapObjs.map(o => ({ id: o.id, kind: o.kind, x: o.x, y: o.y, sprite: o.sprite, art: o.art })));
// Plays the open scene to its end: taps through lines, answers choices from `picks` (else the first), and lets auto beats run.
// `onLine(text)` may read the stage while a line is showing.
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
// Walk out of the Trial Hall onto the doorstep; cd_start fires on the first step (r 1 around the door).
async function leaveHall(page) {
  await page.evaluate(() => PixelPets.goto('fb_hall_in', 7, 20));
  await page.waitForFunction(() => PixelPets.mapInfo.id === 'fb_hall_in' && !PixelPets.fading);
  for (let i = 0; i < 8 && !(await page.evaluate(() => !!PixelPets.scene)); i++) {
    await page.evaluate(() => PixelPets.walkStep('down')); await page.waitForTimeout(260);
    await page.waitForFunction(() => !PixelPets.fading);
  }
}
async function stepOnto(page, map, x, y, dir) {
  await page.evaluate(({ map, x, y }) => PixelPets.goto(map, x, y), { map, x, y });
  await page.waitForFunction(m => PixelPets.mapInfo.id === m && !PixelPets.fading, map);
  await page.evaluate(d => PixelPets.walkStep(d), dir); await page.waitForTimeout(400);
}

test.describe('post-Trial crackdown', () => {
  test('Seal 1 → tanks → the night → dawn wire → Warden → the pick', async ({ page }) => {
    test.setTimeout(240000);
    await boot(page, 'crackdown_street');
    const before = await page.evaluate(() => ({ seals: JSON.stringify(PixelPets.state.seals), v: PixelPets.state.v }));
    expect(await page.evaluate(() => PixelPets.quest.id)).toBe('crackdown_street');
    await leaveHall(page);
    expect(await sceneId(page)).toBe('crackdown_street');
    let beat1 = null, art = null;
    await drive(page, ['Keep it', "He's hiding something"], async text => {
      if (!beat1 && /square is closed/.test(text)) { const os = (await objs(page)).filter(o => /^cd_/.test(o.id)); beat1 = Object.fromEntries(os.map(o => [o.id, [o.x, o.y, o.kind]])); art = os.filter(o => o.kind === 'prop').map(o => [o.id, o.art]); }
    });
    // §10a.6 actor tiles at the Commander's first line; tanks and the beam are props (E1).
    expect(beat1).toMatchObject({ cd_beam: [20, 8, 'prop'], cd_tank_a: [19, 8, 'prop'], cd_tank_b: [13, 8, 'prop'], cd_cmdr: [22, 9, 'npc'], cd_off_a: [21, 9, 'npc'], cd_off_b: [24, 8, 'npc'] });
    expect(art).toEqual(expect.arrayContaining([['cd_beam', true], ['cd_tank_a', true], ['cd_tank_b', true], ['cd_dust', true]]));   // draft sprites exist (V1)
    const f = await flags(page);
    expect(f['story.crackdown']).toBe(true);
    expect(f['story.hall1_shut']).toBe(true);
    expect(f['story.post_trial_done']).toBe(true);
    expect(f['story.warden_called']).toBeUndefined();   // Ilse calls on the first step outside (D1404)
    expect(f['story.fen_lean']).toBe(2);   // PLACEHOLDER encoding (D1411): Keep it +1, He's hiding something +1
    expect(f['story.side_pick_done']).toBeUndefined();
    expect(await page.evaluate(() => PixelPets.quest.id)).toBe('ilse_call');
    expect(await page.evaluate(() => PixelPets.mapInfo.id)).toBe('fb_lantern_in');
    // The Seal is never removed (SEALS-N); the save stays v2.
    expect(await page.evaluate(() => ({ seals: JSON.stringify(PixelPets.state.seals), v: PixelPets.state.v }))).toEqual(before);
    // Casts end with the scenes: no tank, beam or Commander stays on either map.
    expect((await objs(page)).filter(o => /^cd_(tank|beam|dust|cmdr|off|fen)/.test(o.id))).toEqual([]);
    // RENDEZVOUS_VINCENT beat 1 (D1395, D1404): the first step out of the Lantern House rings the Keeper1; one tap answers.
    await stepOnto(page, 'fernbrook', 5, 6, 'down');
    expect(await sceneId(page)).toBe('ilse_call');
    await drive(page, ['Answer']);
    expect((await flags(page))['story.warden_called']).toBe(true);
    expect(await page.evaluate(() => PixelPets.quest.id)).toBe('warden_summons');
    const out = (await objs(page)).map(o => o.id);
    expect(out.filter(id => /^cd_(tank|beam|dust|cmdr|off|fen)/.test(id))).toEqual([]);
    // The curfew order stands until the pick (§5, D1405): posts, notice, cordon, Fen at the gate, Juniper on the east road,
    // the plaza indoors; the square's townsfolk are back by day once Ilse has called; Glimmerwell's Juniper and stand stay away.
    expect(out).toEqual(expect.arrayContaining(['cd_post_lantern', 'cd_post_hall', 'cd_cordon', 'cd_notice', 'fen_dawn', 'juniper_east', 'odile', 'fb_wynne']));
    for (const id of ['juniper', 'fb_lantern_stand']) expect(out, id).not.toContain(id);
    expect(await page.evaluate(() => PixelPets.fbPlazaPhase())).toBe('curfew');
    // No pick yet (D1395): the gate stays quiet until the Warden.
    await stepOnto(page, 'fernbrook', 9, 9, 'down');
    expect(await sceneId(page)).toBeNull();
    // Warden Ilse at the Lodge.
    await page.evaluate(() => PixelPets.goto('hm_lodge_in', 5, 5)); await page.waitForFunction(() => PixelPets.mapInfo.id === 'hm_lodge_in' && !PixelPets.fading);
    expect(await page.evaluate(() => PixelPets.talkTo('ilse_lodge_after'))).toBe(true);
    expect(await sceneId(page)).toBe('warden_meet');
    await drive(page);
    expect((await flags(page))['story.warden_met']).toBe(true);
    // RENDEZVOUS_VINCENT (D1403): Ilse sends the holder to Vincent; the rendezvous itself is played in rendezvous_vincent.spec.js.
    expect(await page.evaluate(() => PixelPets.quest.id)).toBe('rdv_meet');
    expect(await page.evaluate(() => PixelPets.talkTo('ilse_lodge_after'))).toBe(true);
    expect(await sceneId(page)).toBe('warden_after');
    await drive(page);
    await page.evaluate(() => { for (const k of ['story.rdv_met', 'story.shift_g', 'story.shift_k', 'story.rdv_done']) PixelPets.setFlag(k, true); });
    expect(await page.evaluate(() => PixelPets.quest.id)).toBe('pick');
    // Now the built pick runs.
    await stepOnto(page, 'fernbrook', 9, 9, 'down');
    expect(await sceneId(page)).toBe('side_pick');
    await drive(page, ['Open the crates with Fen', 'Yes, the Keepers']);
    expect((await flags(page))['story.side_pick_done']).toBe(true);
    // The pick lifts the curfew order: posts and notice go, the townsfolk come back, the Hall stays shut (D1224).
    const after = (await objs(page)).map(o => o.id);
    for (const id of ['cd_post_lantern', 'cd_post_hall', 'cd_cordon', 'cd_notice', 'juniper_east', 'fen_dawn']) expect(after, id).not.toContain(id);
    expect(after).toEqual(expect.arrayContaining(['odile', 'fb_wynne']));
    expect(await page.evaluate(() => PixelPets.fbPlazaPhase())).toBe('held_keepers');
    expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
  });

  test('reduced motion: the street plays through with every actor on a whole tile @w1', async ({ page }) => {
    test.setTimeout(180000);
    await boot(page, 'crackdown_street', { reduce: true });
    await leaveHall(page);
    expect(await sceneId(page)).toBe('crackdown_street');
    let frac = null;
    await drive(page, [], async text => {
      if (frac === null && /square is closed/.test(text)) frac = await page.evaluate(() => PixelPets.mapObjs.filter(o => /^cd_/.test(o.id)).some(o => o.x % 1 || o.y % 1));
    });
    expect(frac).toBe(false);
    expect((await flags(page))['story.post_trial_done']).toBe(true);
  });

  test('the Trial Hall stays shut, before and after the pick (D1224)', async ({ page }) => {
    await boot(page, 'warden_summons');
    // A checkpoint writes only done flags; the street scene writes hall1_shut beside story.crackdown.
    await page.evaluate(() => PixelPets.setFlag('story.hall1_shut', true));
    const tryDoor = async () => {
      await page.evaluate(() => PixelPets.goto('fernbrook', 22, 7)); await page.waitForFunction(() => PixelPets.mapInfo.id === 'fernbrook' && !PixelPets.fading);
      for (let i = 0; i < 3 && !(await page.evaluate(() => !!PixelPets.scene)); i++) { await page.evaluate(() => PixelPets.walkStep('up')); await page.waitForTimeout(350); }
      const text = await page.evaluate(() => PixelPets.scene && PixelPets.scene.text);
      await drive(page);
      return { text, map: await page.evaluate(() => PixelPets.mapInfo.id) };
    };
    expect(await tryDoor()).toEqual({ text: expect.stringContaining('Shut by order of High Charity'), map: 'fernbrook' });
    await page.evaluate(() => { PixelPets.setFlag('story.side', 'keepers'); PixelPets.setFlag('story.side_pick_done', true); PixelPets.setFlag('story.slice_end', true); });   // slice_end: past Rook's doorstep teaser
    expect(await tryDoor()).toEqual({ text: expect.stringContaining('Shut by order of High Charity'), map: 'fernbrook' });
  });

  test('guards: old saves and other orders never see the crackdown', async ({ page }) => {
    test.setTimeout(120000);
    // #261's placeholder save: post_trial_done with no crackdown skips the street and the Warden, and keeps the pick.
    await boot(page, 'crackdown_street', { extra: {} });
    await page.evaluate(() => PixelPets.setFlag('story.post_trial_done', true));
    expect(await page.evaluate(() => PixelPets.quest.id)).toBe('pick');
    await leaveHall(page);
    expect(await sceneId(page)).toBeNull();
    await stepOnto(page, 'fernbrook', 9, 9, 'down');
    expect(await sceneId(page)).toBe('side_pick');
    await page.evaluate(() => PixelPets.endScene());
    // A save that already picked (old order) never sees cd_start.
    await page.evaluate(() => { PixelPets.setFlag('story.post_trial_done', null); PixelPets.setFlag('story.side_pick_done', true); });
    await leaveHall(page);
    expect(await sceneId(page)).not.toBe('crackdown_street');   // Rook's teaser may play here; the crackdown never does
    expect((await flags(page))['story.crackdown']).toBeUndefined();
  });

  test('a save that quits inside the Lantern House replays the night (cd_resume)', async ({ page }) => {
    test.setTimeout(180000);
    await boot(page, 'post_trial');
    const f = await flags(page);
    expect(f['story.crackdown']).toBe(true);
    expect(f['story.post_trial_done']).toBeUndefined();
    await stepOnto(page, 'fb_lantern_in', 5, 14, 'up');
    expect(await sceneId(page)).toBe('crackdown_lantern');
    await drive(page);
    expect((await flags(page))['story.post_trial_done']).toBe(true);
    expect(await page.evaluate(() => PixelPets.quest.id)).toBe('ilse_call');
  });

  test('no phone: Amos passes Ilse\'s message on at the end of the night (D1404)', async ({ page }) => {
    test.setTimeout(180000);
    await boot(page, 'post_trial', { extra: { 'story.phone_got': false } });
    await page.evaluate(() => PixelPets.setFlag('story.phone_got', null));
    await stepOnto(page, 'fb_lantern_in', 5, 14, 'up');
    expect(await sceneId(page)).toBe('crackdown_lantern');
    await drive(page);
    const f = await flags(page);
    expect([f['story.post_trial_done'], f['story.warden_called']]).toEqual([true, true]);
    expect(await page.evaluate(() => PixelPets.quest.id)).toBe('warden_summons');
  });
});
