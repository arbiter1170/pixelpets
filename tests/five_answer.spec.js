/* ARBITER_UNITS Build C: the "Five that answer" side chain (D843, D848-D853). Mo (Keepers) or Quinn (Glimmerwell)
   opens it once you reach Route 3. Five clues on both paths, five boss lairs on Route 3, a close that pays 500 Acorns.
   Save v stays 2. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, shot, playScene } = require('./helpers');

trackErrors(test, expect);

const FOUR = ['story.ans_tallybat', 'story.ans_dimlamp', 'story.ans_filecrow', 'story.ans_cordhound'];
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
  test('every clue sets its flag on the ' + side + ' path', async ({ page }) => {
    await boot(page, save(side, { 'story.ans_open': true }));
    const clues = [
      ['route2', 22, 9, 'story.ans_tallybat_clue'],
      ['hw_cut', 10, 11, 'story.ans_dimlamp_clue'],
      side === 'glimmer' ? ['rx_f3', 3, 14, 'story.ans_filecrow_clue'] : ['hm_hq_f1', 2, 3, 'story.ans_filecrow_clue'],
      ['cobblecrest', 30, 9, 'story.ans_cordhound_clue'],
    ];
    for (const [map, x, y, f] of clues) {
      expect(await talkTo(page, map, x, y), map).toBe(true);
      await playScene(page);
      expect(await flag(page, f), f).toBe(true);
    }
    // The fifth clue only answers once the four are befriended.
    await page.evaluate(four => four.forEach(f => PixelPets.setFlag(f, true)), FOUR);
    const last = side === 'glimmer' ? ['rx_f4', 6, 3] : ['mahopac', 9, 5];
    expect(await talkTo(page, ...last)).toBe(true);
    await playScene(page);
    expect(await flag(page, 'story.ans_humwisp_clue')).toBe(true);
    expect(await page.evaluate(() => PixelPets.sideActive.map(a => a.id))).toContain('ans_last');
  });
}

test('a boss shows after its clue, hides while it rests, and joins at Quiet when befriended', async ({ page }) => {
  await boot(page, save('keepers', { 'story.ans_open': true }, s => {
    s.party[0] = Object.assign(s.party[0], { species: 'ember', stage: 2, bx: 4 * 44 * 44 });
  }));
  const seen = () => page.evaluate(() => { PixelPets.goto('route3', 11, 10, 'right'); return PixelPets.mapObjs.some(o => o.id === 'ans_tallybat'); });
  expect(await seen()).toBe(false);
  await page.evaluate(() => PixelPets.setFlag('story.ans_tallybat_clue', true));
  expect(await seen()).toBe(true);
  await page.evaluate(() => PixelPets.setFlag('story.ans_tallybat_rest', true));
  expect(await seen()).toBe(false);
  await page.evaluate(() => PixelPets.setFlag('story.ans_tallybat_rest', false));
  expect(await seen()).toBe(true);
  await shot(page, 'five-tally-gate');

  // Talk to it: the lead-in line, then the boss battle.
  await page.evaluate(() => PixelPets.goto('route3', 12, 10, 'right'));
  await page.keyboard.press('Space');
  await page.waitForFunction(() => !!PixelPets.scene);
  for (let i = 0; i < 20 && !(await page.evaluate(() => PixelPets.battle && PixelPets.battle.on)); i++) { await page.keyboard.press('Space'); await page.waitForTimeout(80); }
  await page.waitForFunction(() => PixelPets.battle.on && PixelPets.battle.state === 'CHOOSE', null, { timeout: 15000 });
  const b = await page.evaluate(() => PixelPets.bossState());
  expect(b).toMatchObject({ boss: true, stage: 1 });
  await page.evaluate(() => { PixelPets.battle.textMs = 1; PixelPets.forceBefriend(); });
  await page.waitForFunction(() => PixelPets.battle.state === 'END');
  await page.click('#btOk');
  await page.waitForFunction(() => !PixelPets.battle.on);
  await playScene(page);
  const joined = await page.evaluate(() => { const p = [...PixelPets.state.party, ...PixelPets.state.box].find(q => q.species === 'tallybat'); return p && { stage: p.stage, hum: p.hum }; });
  expect(joined).toEqual({ stage: 0, hum: 0 });
  expect(await flag(page, 'story.ans_tallybat')).toBe(true);
  expect(await seen()).toBe(false);
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
  await boot(page, save('keepers', on(['story.ans_open', ...FOUR, 'story.ans_humwisp_clue', 'story.ans_humwisp'])));
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
