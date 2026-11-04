/* ACT1_KEEPER_JOIN slices K1 and K2 (design specs/ACT1_KEEPER_JOIN.md v0.1.1 §7, §8, §10 E1, E2, E5, E6, E10).
   K1, town control: the map `hold:` reader (holdCond) reads `|`, `&`, `!`, `=` and numeric checks the way cond() does
   (D1505); Fernbrook is contested (`sway: true`) and, once a save holds story.keeper_cadet with a face set, settles by
   story.sway_fernbrook (-3..3): >= 2 Keepers, <= -2 Glimmerwell, else the new split line (D1504). The plaza cast follows the
   town's hold (fbPlazaPhase reads mapHold, D1505). The whole read is inert until story.keeper_cadet exists: a pre-pick save,
   a Keepers pick save and a Glimmer pick save show the same hold, place chip, map line and plaza cast as main.
   K2, the Act 3 switch hooks: canSwitch opens at Act 3 (story.ep1_end plus Seal 5), one way Keepers -> Glimmerwell (D1513,
   D1536), through Rook's offer (D1558); a switch moves every story.sway_* by -2, clamped (D1506, D1559); the loyalist's
   explicit Act 3 choice is a reserved flag, story.warden_cut, that closes the reports (D1514).
   Runs at 320, 375 and 390 with reduced motion; zero console errors; save v2, nothing written at load, keys additive only. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, withOverlay, shot, playScene } = require('./helpers');

trackErrors(test, expect);

const KEEPERS = ['fbp_constable', 'fbp_sergeant', 'fbp_cadet'];
const GLIMMER = ['fbp_associate', 'fbp_bright_lead', 'fbp_junior_bright'];
const K_SET = KEEPERS.concat(KEEPERS.map((id) => id + '_pet'));
const G_SET = GLIMMER.concat(GLIMMER.map((id) => id + '_pet'));
const TOWNSFOLK = ['fbp_orchard_hand', 'fbp_weaver', 'fbp_stall_hand', 'fbp_elder'];
const ALL = K_SET.concat(G_SET, TOWNSFOLK);

const LINE = {
  split_old: 'Keepers keep the town. Glimmerwell keeps a stand.',
  split_new: 'Keepers walk the lanes. Glimmerwell keeps the gate.',
  keepers: 'The Keepers hold the town now. The orchard stays rooted.',
  glimmer: 'Glimmerwell holds the town now. Lanterns on every gate.',
};
const WORD = { keepers: 'KEEPERS', glimmer: 'GLIMMERWELL', split: 'BOTH SIDES' };
// Who stands in the plaza for each phase (tests/fernbrook_plaza.spec.js holds the full phase rules).
const CAST = {
  argue: ALL, after: ALL, curfew: [],
  held_keepers: K_SET.concat(TOWNSFOLK), held_glimmer: G_SET.concat(TOWNSFOLK),
};

// The three save kinds that exist today (no story.keeper_cadet anywhere), plus the crackdown curfew. The expected rows are
// what game main reads for them (590bf6a); this branch must read the same.
const SEAL1 = { 'story.lizzy_class': true, 'story.seal1': true, 'story.post_trial_done': true };
const TODAY = {
  pre_pick: { flags: {}, hold: 'split', line: LINE.split_old, phase: 'argue' },
  pre_pick_curfew: { flags: Object.assign({}, SEAL1, { 'story.crackdown': true }), hold: 'split', line: LINE.split_old, phase: 'curfew' },
  keepers_pick: { flags: Object.assign({}, SEAL1, { 'story.side_pick_done': true, 'story.orchard_cleared': true }), hold: 'keepers', line: LINE.keepers, phase: 'held_keepers' },
  glimmer_pick: { flags: Object.assign({}, SEAL1, { 'story.side_pick_done': true, 'story.side': 'glimmer', 'story.orchard_cleared': true }), hold: 'glimmer', line: LINE.glimmer, phase: 'held_glimmer' },
};

// The four new-save results (§7 "What results on a new save"): lean +-2 then face +-1.
const CADET = { 'story.keeper_cadet': true, 'story.side_pick_done': true, 'story.orchard_cleared': true, 'story.orchard_lean': 'open' };
const MATRIX = {
  open_pin: { flags: Object.assign({}, SEAL1, CADET, { 'story.sway_fernbrook': 3 }), hold: 'keepers', line: LINE.keepers, phase: 'held_keepers' },
  // D1561: a Cadet's Glimmerwell-held Fernbrook keeps one Keeper post, the Constable (no Walkling, no patrol)
  pack_lanyard: { flags: Object.assign({}, SEAL1, CADET, { 'story.orchard_lean': 'pack', 'story.side': 'glimmer', 'story.cover': 'glimmer', 'story.sway_fernbrook': -3 }), hold: 'glimmer', line: LINE.glimmer, phase: 'held_glimmer', cast: G_SET.concat(TOWNSFOLK, ['fbp_constable']) },
  open_lanyard: { flags: Object.assign({}, SEAL1, CADET, { 'story.side': 'glimmer', 'story.cover': 'glimmer', 'story.sway_fernbrook': 1 }), hold: 'split', line: LINE.split_new, phase: 'after' },
  pack_pin: { flags: Object.assign({}, SEAL1, CADET, { 'story.orchard_lean': 'pack', 'story.sway_fernbrook': -1 }), hold: 'split', line: LINE.split_new, phase: 'after' },
};

const ACT3 = { 'story.ep1_end': true, 'story.seal5': true };
const EP1_SEALS = { seal_fernbrook: true, seal_cobblecrest: true, seal_brinewick: true };

const overlay = {
  scenes: {
    zz_sway_up: [['inc', 'story.sway_fernbrook', 5]],
    zz_sway_down: [['inc', 'story.sway_fernbrook', -9]],
    // a live read: the scene's own pending inc counts for the hold and the plaza before it commits
    zz_sway_live: [['inc', 'story.sway_fernbrook', 4], ['if', 'fbplaza:held_keepers', [['say', '', 'LIVE held']], [['say', '', 'LIVE not']]]],
  },
};

function save(flags, extra) {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.textSpeed = 'fast';
  s.settings.follower = false;
  s.settings.tips = false;
  Object.assign(s.flags, {
    'story.reached_fernbrook': true, 'story.met_glimmerwell': true, 'story.met_fen': true,
    'story.unlock_sides': true, 'story.unlock_rep': true, 'story.unlock_phone': true,
  }, flags || {});
  s.world = { map: 'fernbrook', x: 27, y: 12, facing: 'down', respawn: 'hearthmoor' };
  if (extra) Object.assign(s, extra);
  return s;
}

async function boot(page, s, q = '?debug=1') {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await withOverlay(page, overlay);
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, q);
  await page.waitForFunction(() => window.PixelPets && PixelPets.state && PixelPets.state.party[0]);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForFunction(() => document.querySelector('#mapCanvas').width > 0);
  await expect(page.locator('#thChip')).toBeVisible();
}

const stored = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));

// Everything the town's hold feeds: the hold id, the place chip (stripe and aria line), the region map's hold line,
// the plaza phase and who stands in the plaza.
async function readTown(page) {
  // the chip repaints on the next frame after a flag change; give it a moment to catch up before reading
  await page.waitForFunction(() => PixelPets.sideBadge().hold === PixelPets.mapHold('fernbrook'), null, { timeout: 3000 }).catch(() => {});
  const r = await page.evaluate((ids) => ({
    hold: PixelPets.mapHold('fernbrook'),
    chip: PixelPets.sideBadge().hold,
    label: PixelPets.sideBadge().label,
    phase: PixelPets.fbPlazaPhase(),
    present: ids.filter((id) => !!(PixelPets.objPos(id) || {}).present).sort(),
  }), ALL);
  await page.locator('#mapBtn').click();
  await page.waitForSelector('#ovMap:not([hidden])');
  await page.locator('#mapLevelRegion').click();
  r.map = await page.evaluate(() => { const h = document.querySelector('#mapHold'); return { name: document.querySelector('#mapPlaceName').textContent, hold: h.dataset.hold, line: h.textContent }; });
  await page.locator('#mapClose').click();
  await page.waitForSelector('#ovMap', { state: 'hidden' });
  return r;
}

// Walk out to Route 1 and back in: the chip repaints its stripe on arrival (SIDE_BADGE), as in play.
async function reenter(page) {
  for (const [m, x, y] of [['route1', 5, 5], ['fernbrook', 27, 12]]) {
    expect(await page.evaluate(([mm, xx, yy]) => PixelPets.goto(mm, xx, yy, 'down'), [m, x, y])).toBeTruthy();
    await page.waitForFunction(() => !window.PixelPets.fading && !window.PixelPets.sideBadge().pending, null, { timeout: 6000 });
  }
}

function expectTown(r, want, tag) {
  expect(r.hold, tag).toBe(want.hold);
  expect(r.chip, tag).toBe(want.hold);
  expect(r.label, tag).toContain('. ' + want.line + ' Tap for today.');
  expect(r.map, tag).toEqual({ name: 'FERNBROOK', hold: want.hold, line: want.line });
  expect(r.phase, tag).toBe(want.phase);
  expect(r.present, tag).toEqual((want.cast || CAST[want.phase]).slice().sort());
}

for (const [kind, want] of Object.entries(TODAY)) {
  test(`K1 inert: a ${kind} save reads Fernbrook exactly as main (hold, chip, map line, plaza cast); nothing is written`, async ({ page }) => {
    const s = save(want.flags);
    await boot(page, s);
    await page.evaluate(() => PixelPets.clock.set('tue', 10, 0));
    expectTown(await readTown(page), want, kind);
    const after = await stored(page);
    expect(after.v).toBe(2);
    for (const k of Object.keys(s.flags)) expect(after.flags, k).toHaveProperty([k]);
    expect(Object.keys(after.flags).filter((k) => /^story\.(sway_|keeper_cadet|warden_cut)/.test(k))).toEqual([]);
    if (kind === 'glimmer_pick') await shot(page, 'k1-inert-glimmer');
  });
}

test('K1 inert: a stray story.sway_fernbrook without story.keeper_cadet changes nothing (the built D1171 flip reads)', async ({ page }) => {
  test.setTimeout(60000);   // three town reads and two walks out and back; ~28 s on main in a slow sandbox, over 30 s once #288 adds the curfew objects
  await boot(page, save(Object.assign({}, TODAY.keepers_pick.flags, { 'story.sway_fernbrook': -3 })));
  expectTown(await readTown(page), TODAY.keepers_pick, 'keepers pick, sway -3');
  await page.evaluate(() => { PixelPets.setSide('glimmer'); PixelPets.setFlag('story.sway_fernbrook', 3); });
  await reenter(page);
  expectTown(await readTown(page), TODAY.glimmer_pick, 'glimmer pick, sway 3');
  await page.evaluate(() => { PixelPets.setFlag('story.seal1', null); PixelPets.setFlag('story.side_pick_done', null); PixelPets.setFlag('story.lizzy_class', null); PixelPets.setFlag('story.post_trial_done', null); });
  await reenter(page);
  expectTown(await readTown(page), TODAY.pre_pick, 'pre pick, sway 3');
  expect(await page.evaluate(() => PixelPets.devChecks().map)).toEqual([]);
});

for (const [kind, want] of Object.entries(MATRIX)) {
  test(`K1 Cadet matrix (D1504): ${kind} reads ${want.hold} in the chip, the map line and the plaza`, async ({ page }) => {
    await boot(page, save(want.flags));
    await page.evaluate(() => PixelPets.clock.set('tue', 10, 0));
    expectTown(await readTown(page), want, kind);
    expect(await page.evaluate(() => PixelPets.sway('fernbrook'))).toBe(want.flags['story.sway_fernbrook']);
    // arriving from Route 1 lays the hold word over the place line
    await reenter(page);
    const b = await page.evaluate(() => PixelPets.sideBadge());
    expect(b.hold).toBe(want.hold);
    if (b.open) expect(b.word).toBe(WORD[want.hold]);
    if (kind === 'open_lanyard') await shot(page, 'k1-split');
    // the Cadet read wins over the face: the curfew is over once the face is set
    await page.evaluate(() => PixelPets.setFlag('story.crackdown', true));
    expect(await page.evaluate(() => PixelPets.fbPlazaPhase())).toBe(want.phase);
    expect((await stored(page)).v).toBe(2);
  });
}

test('K1 Keeper post (D1561): a Cadet\'s Glimmerwell-held Fernbrook keeps the Constable at his post, standing still; nowhere else', async ({ page }) => {
  await boot(page, save(MATRIX.pack_lanyard.flags));
  await page.evaluate(() => PixelPets.clock.set('tue', 10, 0));
  expect(await page.evaluate(() => PixelPets.fbPlazaPhase())).toBe('held_glimmer');
  const at = () => page.evaluate(() => {
    const o = PixelPets.objPos('fbp_constable') || {}, pet = PixelPets.objPos('fbp_constable_pet') || {}, flag = PixelPets.objPos('fbp_banner_n') || {};
    return { present: !!o.present, x: o.x, y: o.y, moving: !!o.moving, hold: !!o.hold, pet: !!pet.present, banner: !!flag.present, post: PixelPets.condRead('fbplaza:post').cond };
  });
  const first = await at();
  expect(first).toEqual({ present: true, x: 25, y: 11, moving: false, hold: true, pet: false, banner: false, post: true });
  await page.waitForTimeout(1500);
  expect(await at()).toEqual(first);   // no patrol: he keeps his tile
  await shot(page, 'k1-keeper-post');
  // the same save before the Cadet read (a Glimmer pick today): no post, as on main
  await page.evaluate(() => PixelPets.setFlag('story.keeper_cadet', null));
  expect(await at()).toMatchObject({ present: false, pet: false, banner: false, post: false });
  // Keepers- and split-held Cadet towns: the post token is off and the casts are the built ones
  await page.evaluate(() => { PixelPets.setFlag('story.keeper_cadet', true); PixelPets.setFlag('story.sway_fernbrook', 3); });
  expect(await at()).toMatchObject({ present: true, pet: true, banner: true, post: false });
  await page.evaluate(() => PixelPets.setFlag('story.sway_fernbrook', 0));
  expect(await page.evaluate(() => PixelPets.fbPlazaPhase())).toBe('after');
  expect(await at()).toMatchObject({ present: true, pet: true, post: false });
  expect(await page.evaluate(() => PixelPets.devChecks().map)).toEqual([]);
});

test('K1 sway: inc clamps to -3..3, the hold and the plaza read a scene\'s pending sway live, and the map check is clean', async ({ page }) => {
  await boot(page, save(Object.assign({}, SEAL1, CADET)));
  expect(await page.evaluate(() => PixelPets.devChecks().map)).toEqual([]);
  expect(await page.evaluate(() => PixelPets.sway('fernbrook'))).toBe(0);
  expect(await page.evaluate(() => PixelPets.mapHold('fernbrook'))).toBe('split');
  expect(await page.evaluate(() => PixelPets.fbPlazaPhase())).toBe('after');
  expect(await page.evaluate(() => PixelPets.runScene('zz_sway_live'))).toBe(true);
  await expect(page.locator('#sbText')).toHaveText('LIVE held');
  await playScene(page);
  expect(await page.evaluate(() => PixelPets.state.flags['story.sway_fernbrook'])).toBe(3);   // 0 + 4, clamped
  expect(await page.evaluate(() => PixelPets.runScene('zz_sway_up'))).toBe(true);
  await playScene(page);
  expect(await page.evaluate(() => PixelPets.state.flags['story.sway_fernbrook'])).toBe(3);
  expect(await page.evaluate(() => PixelPets.fbPlazaPhase())).toBe('held_keepers');
  expect(await page.evaluate(() => PixelPets.runScene('zz_sway_down'))).toBe(true);
  await playScene(page);
  expect(await page.evaluate(() => PixelPets.state.flags['story.sway_fernbrook'])).toBe(-3);
  expect(await page.evaluate(() => PixelPets.mapHold('fernbrook'))).toBe('glimmer');
  expect(await page.evaluate(() => PixelPets.fbPlazaPhase())).toBe('held_glimmer');
  const s = await stored(page);
  expect(s.v).toBe(2);
  expect(s.flags['story.sway_fernbrook']).toBe(-3);
});

test('K1 holdCond (E1): plain flag objects read |, &, !, = and numbers; other towns keep their built holds', async ({ page }) => {
  await boot(page, save({}));
  const r = await page.evaluate(() => {
    const H = (f) => PixelPets.mapHold('fernbrook', f);
    const c = { 'story.keeper_cadet': true, 'story.side_pick_done': true };
    return {
      k2: H(Object.assign({ 'story.sway_fernbrook': 2 }, c)), g2: H(Object.assign({ 'story.sway_fernbrook': -2 }, c)),
      s1: H(Object.assign({ 'story.sway_fernbrook': 1 }, c)), s0: H(c), sStr: H(Object.assign({ 'story.sway_fernbrook': '3' }, c)),
      noFace: H({ 'story.keeper_cadet': true, 'story.sway_fernbrook': 3 }),
      cobble: [PixelPets.mapHold('cobblecrest', {}), PixelPets.mapHold('cobblecrest', { 'story.quarry_bought': true })],
      heights: [PixelPets.mapHold('fb_heights', {}), PixelPets.mapHold('fb_heights', { 'story.sm_done': true })],
      glen: PixelPets.mapHold('route2_glen', c), home: PixelPets.mapHold('hearthmoor', c),
      line: PixelPets.holdLine('fernbrook', Object.assign({ 'story.sway_fernbrook': 0 }, c)),
    };
  });
  expect(r).toEqual({ k2: 'keepers', g2: 'glimmer', s1: 'split', s0: 'split', sStr: 'keepers', noFace: 'split',
    cobble: ['keepers', 'glimmer'], heights: ['glimmer', 'split'], glen: 'glimmer', home: 'keepers', line: LINE.split_new });
  expect(Array.from(LINE.split_new).length).toBeLessThanOrEqual(70);
});

test('K2 switch (D1536, D1513, D1558): locked in Act 2, opens in Act 3 to Glimmerwell only, through Rook; sway -2 (D1506, D1559)', async ({ page }) => {
  const flags = Object.assign({}, SEAL1, CADET, { 'story.seal2': true, 'story.seal3': true, 'story.ep1_end': true, 'story.rc_climax': true,
    'story.sway_fernbrook': 3, 'story.sway_kilnmouth': -2 });
  await boot(page, save(flags, { seals: EP1_SEALS, standing: { keepers: 40, glimmer: 6 } }));
  expect(await page.evaluate(() => PixelPets.act)).toBe(2);
  expect(await page.evaluate(() => PixelPets.standing.canSwitch)).toBe(false);
  const cfg = await page.evaluate(() => PixelPets.standingCfg());
  expect(cfg.switch.openAct).toBe(3);
  expect(cfg.switch.oneWay).toBe('glimmer');
  expect(await page.evaluate(() => PixelPets.rookOffer('glimmer'))).toBe(true);
  await page.waitForFunction(() => { const s = window.PixelPets.scene; return s && s.mode === 'say' && s.full; });
  expect(await page.evaluate(() => PixelPets.scene.text)).toBe(cfg.switch.rook.wait);
  await playScene(page);
  expect(await page.evaluate(() => PixelPets.reportsOpen)).toBe(true);
  expect(await page.evaluate(() => PixelPets.loyalistOpen)).toBe(false);   // D1514: the choice waits for Act 3

  await page.evaluate(() => PixelPets.setFlag('story.seal5', true));   // Act 3 (Seal 5)
  expect(await page.evaluate(() => PixelPets.act)).toBe(3);
  expect(await page.evaluate(() => PixelPets.standing.canSwitch)).toBe(true);
  expect(await page.evaluate(() => PixelPets.loyalistOpen)).toBe(true);
  expect(await page.evaluate(() => PixelPets.mapHold('fernbrook'))).toBe('keepers');
  expect(await page.evaluate(() => PixelPets.rookOffer('glimmer'))).toBe(true);
  const prompts = await playScene(page, [cfg.switch.yes]);
  expect(prompts[0]).toContain(cfg.switch.confirm);
  const after = await page.evaluate(() => ({ side: PixelPets.side, f: PixelPets.state.flags, st: PixelPets.standing, reports: PixelPets.reportsOpen, loyal: PixelPets.loyalistOpen }));
  expect(after.side).toBe('glimmer');
  expect(after.f['story.switches']).toBe(1);
  expect(after.f['story.switch_via']).toBe('rook');
  expect(after.f['story.sway_fernbrook']).toBe(1);    // 3 - 2
  expect(after.f['story.sway_kilnmouth']).toBe(-3);   // -2 - 2, clamped
  expect(after.f['story.keeper_cadet']).toBe(true);   // nothing clears the oath
  expect(after.st.keepers.points).toBe(Math.floor(40 / cfg.switch.costDiv));
  expect(after.st.canSwitch).toBe(false);             // one way: never back
  expect(after.reports).toBe(false);                  // the reports stop (story.switches >= 1)
  expect(after.loyal).toBe(false);
  expect(await page.evaluate(() => PixelPets.mapHold('fernbrook'))).toBe('split');   // the town saw you turn
  // Rook's answer to a move back is the same wait line
  expect(await page.evaluate(() => PixelPets.rookOffer('keepers'))).toBe(true);
  await page.waitForFunction(() => { const s = window.PixelPets.scene; return s && s.mode === 'say' && s.full; });
  expect(await page.evaluate(() => PixelPets.scene.text)).toBe(cfg.switch.rook.wait);
  await playScene(page);
  const s = await stored(page);
  expect(s.v).toBe(2);
  for (const k of Object.keys(flags)) expect(s.flags, k).toHaveProperty([k]);
  await shot(page, 'k2-after-switch');
});

test('K2 loyalist (D1514): story.warden_cut closes the reports and leaves the holds alone; a pre-Cadet save has no reports', async ({ page }) => {
  const flags = Object.assign({}, SEAL1, CADET, ACT3, { 'story.rc_climax': true, 'story.sway_fernbrook': 3 });
  await boot(page, save(flags, { seals: EP1_SEALS }));
  expect(await page.evaluate(() => PixelPets.act)).toBe(3);
  expect(await page.evaluate(() => ({ r: PixelPets.reportsOpen, l: PixelPets.loyalistOpen }))).toEqual({ r: true, l: true });
  await page.evaluate(() => PixelPets.setFlag('story.warden_cut', true));
  expect(await page.evaluate(() => ({ r: PixelPets.reportsOpen, l: PixelPets.loyalistOpen, h: PixelPets.mapHold('fernbrook'), can: PixelPets.standing.canSwitch })))
    .toEqual({ r: false, l: false, h: 'keepers', can: true });
  await page.evaluate(() => PixelPets.setFlag('story.keeper_cadet', null));
  expect(await page.evaluate(() => ({ r: PixelPets.reportsOpen, l: PixelPets.loyalistOpen }))).toEqual({ r: false, l: false });
  expect(await page.evaluate(() => PixelPets.standingCheck())).toEqual([]);
});

test('K2 a Glimmerwell face in Act 3 reads one_way, and Rook says wait; a free debug switch back moves no sway', async ({ page }) => {
  const flags = Object.assign({}, TODAY.glimmer_pick.flags, ACT3, { 'story.rc_climax': true, 'story.sway_fernbrook': -1 });
  await boot(page, save(flags, { seals: EP1_SEALS }));
  expect(await page.evaluate(() => PixelPets.standing.canSwitch)).toBe(false);
  expect(await page.evaluate(() => PixelPets.rookOffer())).toBe(true);
  await page.waitForFunction(() => { const s = window.PixelPets.scene; return s && s.mode === 'say' && s.full; });
  expect(await page.evaluate(() => PixelPets.scene.text)).toBe(await page.evaluate(() => PixelPets.standingCfg().switch.rook.wait));
  await playScene(page);
  expect(await page.evaluate(() => PixelPets.switchSide('keepers', true))).toBe(true);
  expect(await page.evaluate(() => PixelPets.state.flags['story.sway_fernbrook'])).toBe(-1);
});
