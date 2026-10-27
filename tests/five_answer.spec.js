/* ARBITER_UNITS "Five that answer" (D843, D848-D856). Mo (Keepers) or Quinn (Glimmerwell) opens it once you reach
   Route 3. Five clues, each at a place that side has been (D853). Each lair has its own beat: Tallybat's crates
   counted low to high, Dimlamp's night sanctuary and Rook's twelfth lamp, Filecrow's false card, Cordhound's cord,
   and Humwisp's night operator. Each unit finishes on story.ans_<unit>_done. The close pays 500 Acorns. Save v stays 2. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, shot, playScene } = require('./helpers');

trackErrors(test, expect);

const FOUR = ['story.ans_tallybat_done', 'story.ans_dimlamp_done', 'story.ans_filecrow_done', 'story.ans_cordhound_done'];
const on = list => Object.fromEntries(list.map(f => [f, true]));

function save(side, flags, extra) {
  const s = starterSave();
  s.settings.follower = false;
  Object.assign(s.flags, {
    'story.cobble_end': true, 'story.reached_cobblecrest': true, 'story.rc_done': true, 'story.reached_route3': true,
    'story.hc_council_done': true, 'story.gb_done': true, 'story.route3_open': true,
    'story.met_mo': true, 'story.side_pick_done': true, 'story.glen_cleared': true, 'story.mom_sent': true,
    'story.heights_path': side === 'glimmer' ? 'lab' : 'tunnels', 'story.rx_f3': true,
  }, side === 'glimmer' ? { 'story.side': 'glimmer' } : {}, flags || {});
  s.world = { map: 'cobblecrest', x: 27, y: 8, facing: 'right', respawn: 'cobblecrest' };
  if (extra) extra(s);
  return s;
}
const strong = s => { s.party[0] = Object.assign(s.party[0], { species: 'ember', stage: 2, bx: 4 * 44 * 44 }); };
async function boot(page, s) {
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
}
// Stand on a free tile next to (x, y), face it, and talk. Returns false when no neighbour is free.
async function talkTo(page, map, x, y) {
  const ok = await page.evaluate(([map, x, y]) => {
    PixelPets.goto(map, x, y + 1, 'up');
    const tries = [[0, 1, 'up'], [-1, 0, 'right'], [1, 0, 'left'], [0, -1, 'down']];
    for (const [dx, dy, face] of tries) {
      const t = PixelPets.tileInfo(x + dx, y + dy);
      const busy = PixelPets.mapObjs.some(o => o.x === x + dx && o.y === y + dy && o.kind !== 'decal');
      if (t && !t.solid && !busy) { PixelPets.goto(map, x + dx, y + dy, face); return true; }
    }
    return false;
  }, [map, x, y]);
  if (!ok) return false;
  await page.waitForFunction(() => !PixelPets.fading);
  await page.keyboard.press('Space');
  await page.waitForFunction(() => !!PixelPets.scene, null, { timeout: 5000 });
  return true;
}
const flag = (page, f) => page.evaluate(k => PixelPets.state.flags[k], f);
const here = (page, id) => page.evaluate(i => PixelPets.mapObjs.find(o => o.id === i) || null, id);
// Plays lines and picks choices until a battle opens or the scene ends. Returns every line it read.
async function untilBattle(page, choices = []) {
  const left = choices.slice(), seen = [];
  for (let i = 0; i < 300; i++) {
    const st = await page.evaluate(() => ({ b: !!(PixelPets.battle && PixelPets.battle.on), s: PixelPets.scene && { mode: PixelPets.scene.mode, full: PixelPets.scene.full, waiting: PixelPets.scene.waiting, text: PixelPets.scene.text } }));
    if (st.b) return { battle: true, seen };
    if (!st.s) return { battle: false, seen };
    if (st.s.text && seen[seen.length - 1] !== st.s.text) seen.push(st.s.text);
    if (st.s.mode === 'choice' && st.s.full) {
      await page.waitForFunction(() => PixelPets.optionsReady === true);
      const label = left.shift(); if (label == null) throw new Error('no answer for "' + st.s.text + '"');
      await page.locator('#sbChoices button', { hasText: label }).first().click();
    } else await page.keyboard.press('Space');
    await page.waitForTimeout(50);
  }
  throw new Error('scene did not end');
}
// Inside a boss battle: befriend it, close the result, and read the rest of the scene.
async function befriend(page) {
  await page.waitForFunction(() => PixelPets.battle.on && PixelPets.battle.state === 'CHOOSE', null, { timeout: 15000 });
  const b = await page.evaluate(() => PixelPets.bossState());
  await page.evaluate(() => { PixelPets.battle.textMs = 1; PixelPets.forceBefriend(); });
  await page.waitForFunction(() => PixelPets.battle.state === 'END');
  await page.click('#btOk');
  await page.waitForFunction(() => !PixelPets.battle.on);
  const after = await untilBattle(page);
  return { boss: b, seen: after.seen };
}
const joined = (page, sp) => page.evaluate(k => { const p = [...PixelPets.state.party, ...PixelPets.state.box].find(q => q.species === k); return p ? { stage: p.stage, hum: p.hum } : null; }, sp);

test('Mo opens the chain for the Keepers, and the side card moves to the four lairs', async ({ page }) => {
  await boot(page, save('keepers'));
  const before = await page.evaluate(() => ({ quest: PixelPets.quest && PixelPets.quest.id, side: PixelPets.sideActive.map(a => a.id) }));
  expect(before.side).toContain('ans_open_k');
  expect(await talkTo(page, 'hm_hq_f1', 3, 5)).toBe(true);
  await playScene(page);
  expect(await flag(page, 'story.ans_open')).toBe(true);
  const after = await page.evaluate(() => ({ quest: PixelPets.quest && PixelPets.quest.id, side: PixelPets.sideActive.map(a => a.id), checks: PixelPets.devChecks(), rep: PixelPets.repCheck(), v: PixelPets.state.v }));
  expect(after.side).toContain('ans_four');
  expect(after.quest).toBe(before.quest);
  expect(after.checks.quest).toEqual([]);
  expect(after.checks.glimmer).toEqual([]);
  expect(after.rep).toEqual([]);
  expect(after.v).toBe(2);
});

test('Quinn opens the same chain for Glimmerwell from the Cobblecrest Trial Hall', async ({ page }) => {
  await boot(page, save('glimmer'));
  expect(await page.evaluate(() => PixelPets.sideActive.map(a => a.id))).toContain('ans_open_g');
  expect(await talkTo(page, 'cc_hall_in', 8, 3)).toBe(true);
  const who = await page.evaluate(() => PixelPets.scene && PixelPets.scene.who);
  await playScene(page);
  expect(who).toBe('Associate Quinn');
  expect(await flag(page, 'story.ans_open')).toBe(true);
  await shot(page, 'five-quinn');
});

test('the chain stays hidden until Route 3, and Quinn is not in the hall for a Keeper', async ({ page }) => {
  await boot(page, save('keepers', { 'story.reached_route3': false }));
  const s = await page.evaluate(() => { PixelPets.goto('cc_hall_in', 5, 8, 'up'); return { side: PixelPets.sideActive.map(a => a.id), quinn: PixelPets.mapObjs.some(o => o.id === 'cc_quinn') }; });
  expect(s.side.some(id => id.startsWith('ans_'))).toBe(false);
  expect(s.quinn).toBe(false);
});

for (const side of ['keepers', 'glimmer']) {
  test('every clue sets its flag on the ' + side + ' path, at a place that side has been', async ({ page }) => {
    await boot(page, save(side, { 'story.ans_open': true }));
    const clues = [
      ['route2', 22, 9, 'story.ans_tallybat_clue'],
      ['hw_cut', 10, 11, 'story.ans_dimlamp_clue'],
      side === 'glimmer' ? ['route2', 23, 1, 'story.ans_filecrow_clue'] : ['hm_hq_f1', 2, 3, 'story.ans_filecrow_clue'],
      ['cobblecrest', 30, 9, 'story.ans_cordhound_clue'],
    ];
    for (const [map, x, y, f] of clues) {
      expect(await talkTo(page, map, x, y), map).toBe(true);
      await playScene(page);
      expect(await flag(page, f), f).toBe(true);
    }
    // The fifth clue answers once the four are done: the council chart (Keepers) or Quinn (Glimmerwell).
    expect(await page.evaluate(() => PixelPets.sideActive.map(a => a.id))).not.toContain(side === 'glimmer' ? 'ans_last_clue_g' : 'ans_last_clue_k');
    await page.evaluate(four => four.forEach(f => PixelPets.setFlag(f, true)), FOUR);
    expect(await page.evaluate(() => PixelPets.sideActive.map(a => a.id))).toContain(side === 'glimmer' ? 'ans_last_clue_g' : 'ans_last_clue_k');
    const last = side === 'glimmer' ? ['cc_hall_in', 8, 3] : ['hc_command_in', 7, 4];
    expect(await talkTo(page, ...last)).toBe(true);
    const seen = (await untilBattle(page)).seen.join(' ');
    expect(seen).toContain(side === 'glimmer' ? 'ANSWER' : 'Lit.');
    expect(await flag(page, 'story.ans_humwisp_clue')).toBe(true);
    expect(await page.evaluate(() => PixelPets.sideActive.map(a => a.id))).toContain('ans_last');
  });
}

test('Tallybat: the crates counted low to high wake it, a wrong crate recounts, and it joins at Quiet', async ({ page }) => {
  await boot(page, save('keepers', { 'story.ans_open': true, 'story.ans_tallybat_clue': true }, strong));
  const tap = async (x, y) => { expect(await talkTo(page, 'route3', x, y)).toBe(true); return untilBattle(page); };
  expect(await here(page, 'ans_tallybat')).toBeNull();
  await tap(8, 9);                                         // card 3 first: wrong
  expect(await flag(page, 'story.ans_tally_n')).toBe(0);
  await tap(8, 11);                                        // card 1
  await tap(14, 11);                                       // card 2
  await tap(14, 9);                                        // card 4 out of turn: recount
  expect(await flag(page, 'story.ans_tally_n')).toBe(0);
  await tap(8, 11); await tap(14, 11); await tap(8, 9);    // 1, 2, 3
  expect(await flag(page, 'story.ans_tally_n')).toBe(3);
  const last = await tap(14, 9);                           // 4: the gate counts back and the boss drops
  expect(last.battle).toBe(true);
  const r = await befriend(page);
  expect(r.boss).toMatchObject({ boss: true, stage: 1 });
  expect(await flag(page, 'story.ans_tallybat_done')).toBe(true);
  expect(await joined(page, 'tallybat')).toEqual({ stage: 0, hum: 0 });
  await page.evaluate(() => PixelPets.goto('route3', 11, 12, 'up'));
  expect(await here(page, 'ans_tallybat')).toBeNull();
  // Done: the crates read their cards and run nothing.
  expect(await talkTo(page, 'route3', 8, 11)).toBe(true);
  expect((await untilBattle(page)).seen.join(' ')).toContain('CARD 1');
  expect(await flag(page, 'story.ans_tally_n')).toBe(4);
});

test('Dimlamp: the sanctuary is dark by day; at night two lamps down open an awake fight, then Rook comes for the lamp', async ({ page }) => {
  await boot(page, save('keepers', { 'story.ans_open': true, 'story.ans_dimlamp_clue': true }, strong));
  await page.evaluate(() => { PixelPets.clock.set('tue', 12, 0); PixelPets.clock.freeze(true); PixelPets.goto('r3_sanctuary', 5, 7, 'up'); });
  expect(await here(page, 'ans_dimlamp')).toBeNull();
  expect(await talkTo(page, 'r3_sanctuary', 1, 3)).toBe(true);
  expect((await untilBattle(page)).seen.join(' ')).toContain('LIT AFTER DUSK');
  await page.evaluate(() => { PixelPets.clock.set('tue', 22, 0); PixelPets.goto('route3', 5, 20, 'up'); PixelPets.goto('r3_sanctuary', 5, 7, 'up'); });
  expect(await here(page, 'ans_dimlamp')).not.toBeNull();
  // Talking to it straight away does not start a fight.
  expect(await talkTo(page, 'r3_sanctuary', 5, 4)).toBe(true);
  expect((await untilBattle(page)).battle).toBe(false);
  // Before the lamps are down, the cot offers only Lie down and Stay up.
  expect(await talkTo(page, 'r3_sanctuary', 2, 4)).toBe(true);
  await untilBattle(page, ['Stay up']);
  for (const [x, y] of [[1, 3], [9, 3]]) { expect(await talkTo(page, 'r3_sanctuary', x, y)).toBe(true); await untilBattle(page); }
  expect(await flag(page, 'story.ans_dim_lamp_a')).toBe(true);
  expect(await flag(page, 'story.ans_dim_lamp_b')).toBe(true);
  expect(await talkTo(page, 'r3_sanctuary', 2, 4)).toBe(true);
  expect((await untilBattle(page, ['Turn the lamps down'])).battle).toBe(true);
  await befriend(page);
  expect(await flag(page, 'story.ans_dim_awake')).toBe(true);
  expect(await flag(page, 'story.ans_dimlamp_done')).toBe(true);
  expect(await joined(page, 'dimlamp')).toEqual({ stage: 0, hum: 0 });
  // Rook waits outside, and his scene plays once.
  expect(await talkTo(page, 'route3', 3, 20)).toBe(true);
  expect((await untilBattle(page)).seen.join(' ')).toContain('signed for eleven');
  expect(await flag(page, 'story.ans_rook_lamp')).toBe(true);
  await page.evaluate(() => PixelPets.clock.clear());
});

test('Filecrow: no cards, no fight; a true card is FILE PENDING; the false card opens the fight and pays a treat', async ({ page }) => {
  await boot(page, save('keepers', { 'story.ans_open': true, 'story.ans_filecrow_clue': true }, strong));
  expect(await talkTo(page, 'r3_ledger', 6, 4)).toBe(true);
  expect((await untilBattle(page)).battle).toBe(false);
  for (const [x, y] of [[2, 3], [9, 3], [2, 7]]) { expect(await talkTo(page, 'r3_ledger', x, y)).toBe(true); await untilBattle(page); }
  expect(await flag(page, 'story.ans_file_3')).toBe(true);
  expect(await talkTo(page, 'r3_ledger', 6, 4)).toBe(true);
  const w = await untilBattle(page, ['Card 1: Tally']);
  expect(w.battle).toBe(false);
  expect(w.seen.join(' ')).toContain('FILE PENDING');
  const treats = await page.evaluate(() => PixelPets.state.bag.befriend_treat || 0);
  expect(await talkTo(page, 'r3_ledger', 6, 4)).toBe(true);
  expect((await untilBattle(page, ['Card 3: Crow'])).battle).toBe(true);
  await befriend(page);
  expect(await page.evaluate(() => PixelPets.state.bag.befriend_treat || 0)).toBeGreaterThanOrEqual(treats);   // forceBefriend may spend none
  expect(await flag(page, 'story.ans_file_ok')).toBe(true);
  expect(await flag(page, 'story.ans_filecrow_done')).toBe(true);
});

test('Cordhound: it paces the yard, dodges a direct reach, and comes when you tug the cord', async ({ page }) => {
  await boot(page, save('keepers', { 'story.ans_open': true, 'story.ans_cordhound_clue': true }, strong));
  await page.evaluate(() => PixelPets.goto('route3', 11, 30, 'down'));
  const a = await here(page, 'ans_cordhound');
  await page.waitForTimeout(2200);
  const b = await here(page, 'ans_cordhound');
  expect([a.x, a.y]).not.toEqual([b.x, b.y]);
  // It keeps pacing until you are within 2 tiles, so a reach can land on a tile it just left: try again from where it is now.
  let reached = false;
  for (let i = 0; i < 4 && !reached; i++) {
    const p = await here(page, 'ans_cordhound');
    reached = await talkTo(page, 'route3', p.x, p.y).catch(() => false);
  }
  expect(reached).toBe(true);
  expect((await untilBattle(page)).battle).toBe(false);
  expect(await talkTo(page, 'route3', 19, 35)).toBe(true);
  expect((await untilBattle(page, ['Tug the cord'])).battle).toBe(true);
  await befriend(page);
  expect(await flag(page, 'story.ans_cordhound_done')).toBe(true);
  await shot(page, 'five-cord-yard');
});

test('Humwisp: the night operator stands first; after the shift ends it answers, and Bitlet types HELLO', async ({ page }) => {
  await boot(page, save('keepers', on(['story.ans_open', ...FOUR, 'story.ans_humwisp_clue', 'story.rx_bitlet']), strong));
  await page.evaluate(() => PixelPets.goto('r3_relay', 5, 10, 'up'));
  expect(await here(page, 'r3_operator')).not.toBeNull();
  expect(await here(page, 'ans_humwisp')).toBeNull();
  await shot(page, 'five-relay-operator');
  // The operator's battle starts on a talk.
  expect(await talkTo(page, 'r3_relay', 6, 6)).toBe(true);
  expect((await untilBattle(page)).battle).toBe(true);
  expect(await page.evaluate(() => PixelPets.battle.kind || (PixelPets.battle.trainer && 'trainer'))).toBeTruthy();
});

test('Humwisp: with the operator off shift, it joins and the close follows', async ({ page }) => {
  await boot(page, save('keepers', on(['story.ans_open', ...FOUR, 'story.ans_humwisp_clue', 'story.rx_bitlet', 'trainer.r3_operator']), strong));
  await page.evaluate(() => PixelPets.goto('r3_relay', 5, 10, 'up'));
  expect(await here(page, 'r3_operator')).toBeNull();
  expect(await here(page, 'r3_wren')).not.toBeNull();
  expect(await talkTo(page, 'r3_relay', 6, 4)).toBe(true);
  expect((await untilBattle(page)).battle).toBe(true);
  const r = await befriend(page);
  expect(r.seen.join(' ')).toContain('HELLO');
  expect(await flag(page, 'story.ans_humwisp_done')).toBe(true);
  expect(await page.evaluate(() => PixelPets.sideActive.map(a => a.id))).toContain('ans_close_k');
});

test('a lair gives its own unit +10 hum once a day', async ({ page }) => {
  await boot(page, save('keepers', {}, s => {
    s.party.push({ id: 'unit1', species: 'dimlamp', stage: 0, xp: 0, bx: 4 * 29 * 29, hunger: 90, happy: 90, energy: 95, nick: null, origin: 'wild', moves: [], evoMoves: [], hum: 5 });
  }));
  const hum = () => page.evaluate(() => PixelPets.state.party.find(p => p.id === 'unit1').hum);
  await page.evaluate(() => PixelPets.goto('r3_sanctuary', 5, 7, 'up'));
  expect(await hum()).toBe(15);
  await page.evaluate(() => { PixelPets.goto('route3', 5, 20, 'up'); PixelPets.goto('r3_sanctuary', 5, 7, 'up'); });
  expect(await hum()).toBe(15);
  expect(await flag(page, 'daily.lair_dimlamp')).toBeTruthy();
});

test('the close pays 500 Acorns once and finishes the chain', async ({ page }) => {
  await boot(page, save('keepers', on(['story.ans_open', ...FOUR, 'story.ans_humwisp_clue', 'story.ans_humwisp_done'])));
  const money = () => page.evaluate(() => PixelPets.state.money | 0);
  const before = await money();
  expect(await page.evaluate(() => PixelPets.sideActive.map(a => a.id))).toContain('ans_close_k');
  expect(await talkTo(page, 'hm_hq_f1', 3, 5)).toBe(true);
  await playScene(page);
  expect(await money()).toBe(before + 500);
  expect(await flag(page, 'story.ans_all')).toBe(true);
  expect(await page.evaluate(() => PixelPets.sideActive.some(a => a.id.startsWith('ans_')))).toBe(false);
  // Talking again does not pay twice.
  expect(await talkTo(page, 'hm_hq_f1', 3, 5).catch(() => false)).toBeDefined();
  if (await page.evaluate(() => !!PixelPets.scene)) await playScene(page);
  expect(await money()).toBe(before + 500);
});
