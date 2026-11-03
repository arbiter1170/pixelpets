/* SEALS_BOTH_PATHS v0.1.1 (design specs/SEALS_BOTH_PATHS.md; D1323-D1331): real Seals on both paths, Halls 2-3.
   On a Glimmer save the Hall Master's match gives the Hall's real Seal (plus the Bright Tier tag, written silently: one card,
   the Seal with Glimmerwell's cord). The quota, the Tuning and Dorian's review give only the tag and the chapter flag, and the
   Master offers the match again until it is won. Seals held (hasSeal, sealsHeld, `seals>=N`, the online and cloud count) never
   count a tag; old saves read tag + beaten flag as the Seal, read only. Caps and chapters stay on story.sealN (D1331).
   Runs at 320, 375 and 390 with reduced motion; zero console errors; save stays pixelpets.save.v2, v 2, no new keys. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const COBBLE = {
  'story.side': 'glimmer', 'story.side_pick_done': true, 'story.seal1': true, 'story.rook_pact': 'race',
  'story.route2_end': true, 'story.reached_cobblecrest': true, 'story.quarry_bought': true,
};
const BRINE = {
  'story.side': 'glimmer', 'story.side_pick_done': true, 'story.seal1': true, 'story.seal2': true, 'story.cobble_end': true,
  'story.reached_cobblecrest': true, 'story.rc_done': true, 'story.route3_open': true, 'story.reached_route3': true,
  'story.rook_end': 'stays', 'story.gb_invited': true, 'story.gb_relay_done': true, 'story.gb_hollis': true, 'story.gb_done': true,
  'story.reached_brinewick': true, 'story.brine_arrived': true, 'story.brine_dorian': true,
};
const KEEPERS2 = { 'story.seal1': true, 'story.side_pick_done': true, 'story.route2_end': true, 'story.reached_cobblecrest': true, 'story.quarry_bought': true };

function save(flags, seals, world) {
  const s = starterSave();
  s.settings.follower = false;
  s.settings.textSpeed = 'fast';
  s.party[0].stage = 1; s.party[0].bx = 4 * 27 * 27;
  Object.assign(s.flags, flags);
  s.seals = Object.assign({}, seals || {});
  s.world = Object.assign({ map: 'cobblecrest', x: 4, y: 8, facing: 'right', respawn: 'cobblecrest' }, world || {});
  return s;
}
async function boot(page, s) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true && typeof window.PixelPets.runScene === 'function');
}

// Plays the open scene to its end, answering choices in order. A battle is won (or lost, with { lose: true }); every Seal card
// that shows is recorded by name, and every line the scene says is kept.
async function play(page, choices = [], opts = {}) {
  const left = choices.slice(), says = [], cards = [];
  let forced = false, cardUp = false;
  for (let i = 0; i < 300; i++) {
    const st = await page.evaluate(() => {
      const s = window.PixelPets.scene, b = window.PixelPets.battle;
      return { scene: !!s, mode: s && s.mode, full: s && s.full, waiting: s && s.waiting, text: s && s.text, battle: !!(b && b.on), panel: b && b.panel };
    });
    const sealVis = await page.locator('#btSeal').isVisible().catch(() => false);
    if (sealVis && !cardUp) cards.push(await page.locator('#btSealName').textContent());
    cardUp = sealVis;
    if (!st.scene && !st.battle) return { says, cards };
    if (await page.locator('#btOk').isVisible().catch(() => false)) {
      await page.locator('#btOk').click(); await page.waitForTimeout(40); continue;
    }
    if (st.battle && !forced) {
      if (st.panel !== 'acts' && st.panel !== 'end') {
        if (await page.locator('#btMsg').isVisible().catch(() => false)) await page.locator('#btMsg').click();
        await page.waitForTimeout(40); continue;
      }
      await page.evaluate(lose => { PixelPets.battle.textMs = 0; if (lose) PixelPets.loseBattle(); else PixelPets.winBattle(); }, !!opts.lose);
      forced = true; await page.waitForTimeout(40); continue;
    }
    if (st.mode === 'choice' && st.full) {
      const open = await page.locator('#sbChoices button:visible').count();
      if (!open) { await page.waitForTimeout(40); continue; }
      await page.waitForFunction(() => window.PixelPets.optionsReady === true);
      const label = left.shift();
      if (!label) throw new Error('scene asked "' + st.text + '" but the test had no answer left');
      says.push('? ' + st.text);
      await page.locator('#sbChoices button', { hasText: label }).first().click();
      await page.waitForTimeout(40); continue;
    }
    if (st.mode === 'say' && st.waiting) {
      if (says[says.length - 1] !== st.text) says.push(st.text);
      await page.keyboard.press('Space'); await page.waitForTimeout(30); continue;
    }
    await page.waitForTimeout(40);
  }
  throw new Error('scene did not finish');
}
const state = page => page.evaluate(() => ({
  seals: Object.keys(PixelPets.state.seals).filter(k => PixelPets.state.seals[k]).sort(),
  seal2: !!PixelPets.state.flags['story.seal2'], seal3: !!PixelPets.state.flags['story.seal3'],
  held: PixelPets.sealsHeld(), glimmer: PixelPets.standing.glimmer.points,
  snacks: PixelPets.state.bag.hearty_snack || 0, tonic: PixelPets.state.bag.wake_tonic || 0, v: PixelPets.state.v,
}));
const choiceLabels = page => page.locator('#sbChoices button:visible').allTextContents();
async function openChoice(page, scene) {
  expect(await page.evaluate(s => PixelPets.runScene(s), scene)).toBe(true);
  for (let i = 0; i < 40; i++) {
    const st = await page.evaluate(() => { const s = PixelPets.scene; return s && { mode: s.mode, full: s.full, waiting: s.waiting, text: s.text, who: s.who }; });
    if (!st) return null;
    if (st.mode === 'choice' && st.full && await page.locator('#sbChoices button:visible').count()) return st;
    if (st.mode === 'say' && st.waiting) await page.keyboard.press('Space');
    await page.waitForTimeout(40);
  }
  throw new Error('no choice opened');
}
async function closeScene(page) { await page.evaluate(() => { if (PixelPets.scene) PixelPets.endScene(); }); await page.waitForFunction(() => !PixelPets.scene); }

test('the Hall rows: on a Glimmer save Hale and Marisol give their real Seals, and the Keepers rows are unchanged', async ({ page }) => {
  await boot(page, save(COBBLE));
  expect(await page.evaluate(() => [PixelPets.trainerFor('hall2_hale').seal, PixelPets.trainerFor('hall2_hale').onWin])).toEqual(['seal_cobblecrest', 'seal2']);
  expect(await page.evaluate(() => [PixelPets.trainerFor('hall3_marisol').seal, PixelPets.trainerFor('hall3_marisol').onWin])).toEqual(['seal_brinewick', 'seal3']);
  expect(await page.evaluate(() => PixelPets.sealsBothPaths)).toBe(true);
  await page.evaluate(() => PixelPets.setSide('keepers'));
  expect(await page.evaluate(() => PixelPets.trainerFor('hall2_hale').seal)).toBe('seal_cobblecrest');
  expect(await page.evaluate(() => PixelPets.trainerFor('hall3_marisol').seal)).toBe('seal_brinewick');
});

test('Hall 2, the match: facing Hale gives the Seal and Tier 2 with one card, the Seal with the cord', async ({ page }) => {
  test.setTimeout(90000);
  await boot(page, save(COBBLE, { seal_fernbrook: 1, seal_glim_1: 1 }));
  expect(await page.evaluate(() => PixelPets.runScene('hale_trial'))).toBe(true);
  const r = await play(page, ['Face Hale for the Seal']);
  const st = await state(page);
  expect(st.seals).toEqual(['seal_cobblecrest', 'seal_fernbrook', 'seal_glim_1', 'seal_glim_2']);
  expect(st.seal2).toBe(true);
  expect(st.held).toBe(2);
  expect(st.glimmer).toBe(5);
  expect(r.cards).toEqual(['Cobblecrest Seal']);
  expect(r.says).toContain("Then Hale's floor. Win, and his Seal is yours. Lose, and the quota's still open.");
  expect(r.says).toContain("Review closed. Tier 2 on your cord, clipped to Hale's Seal. Logged!");
  expect(st.v).toBe(2);
});

test('Hall 2, the quota: the tag and the chapter, no Seal; Hale offers the match again; a late win gives the Seal once', async ({ page }) => {
  test.setTimeout(120000);
  await boot(page, save(COBBLE, { seal_fernbrook: 1, seal_glim_1: 1 }));
  expect(await page.evaluate(() => PixelPets.runScene('hale_trial'))).toBe(true);
  const q = await play(page, ['Meet the quota instead']);
  let st = await state(page);
  expect(st.seals).toEqual(['seal_fernbrook', 'seal_glim_1', 'seal_glim_2']);
  expect(st.seal2).toBe(true);
  expect(await page.evaluate(() => PixelPets.hasSeal('seal_cobblecrest'))).toBe(false);
  expect(st.held).toBe(1);
  expect(q.cards).toEqual(['Bright Tier 2 Lanyard']);
  expect(q.says).toContain("Review closed. Tier 2 on your cord. Hale still holds your Seal. His floor's open.");
  const before = st;

  // The re-offer, then a loss: the match stays offered.
  const c = await openChoice(page, 'hale_trial');
  expect([c.who, c.text]).toEqual(['Master Hale', 'One match on the stone. Ready?']);
  expect(await choiceLabels(page)).toEqual(['Face Hale for the Seal', 'Not today']);
  await closeScene(page);
  expect(await page.evaluate(() => PixelPets.runScene('hale_trial'))).toBe(true);
  const lost = await play(page, ['Face Hale for the Seal'], { lose: true });
  expect(lost.says.slice(0, 2)).toEqual(['You have their cord. The Seal is still mine to give.', '? One match on the stone. Ready?']);
  expect(lost.cards).toEqual([]);
  await closeScene(page);
  expect(await page.evaluate(() => PixelPets.hasSeal('seal_cobblecrest'))).toBe(false);

  // Still offered after the loss. The late win: the Seal and one card; Quinn's late-win line once; no second snack, tonic,
  // Standing or flag write.
  expect(await page.evaluate(() => PixelPets.runScene('hale_trial'))).toBe(true);
  const w = await play(page, ['Face Hale for the Seal']);
  expect(w.says).toContain('? One match on the stone. Ready?');
  st = await state(page);
  expect(st.seals).toEqual(['seal_cobblecrest', 'seal_fernbrook', 'seal_glim_1', 'seal_glim_2']);
  expect(st.held).toBe(2);
  expect(w.cards).toEqual(['Cobblecrest Seal']);
  expect(w.says.filter(t => t === "Hale's Seal, on your Tier 2 cord at last. Logged! Have a bright day!")).toHaveLength(1);
  expect(w.says.some(t => /^Review closed\./.test(t))).toBe(false);
  expect([st.snacks, st.tonic, st.glimmer]).toEqual([before.snacks, before.tonic, before.glimmer]);

  // After the win the re-offer is gone: the "on file" branch reads.
  expect(await page.evaluate(() => PixelPets.runScene('hale_trial'))).toBe(true);
  const done = await play(page, []);
  expect(done.says).toEqual(['Tier 2 is on file. The cradle can wait. Have a bright day!']);
});

test('Hall 2, the Tuning: the tag and the chapter, no Seal, Seals held unchanged', async ({ page }) => {
  test.setTimeout(90000);
  const s = save(COBBLE, { seal_fernbrook: 1, seal_glim_1: 1 });
  s.bag = { heal_snack: 2 };
  await boot(page, s);
  expect(await page.evaluate(() => PixelPets.runScene('hale_trial'))).toBe(true);
  await play(page, ['Tune my partner']);
  const st = await state(page);
  expect(st.seal2).toBe(true);
  expect(st.seals).toContain('seal_glim_2');
  expect(st.seals).not.toContain('seal_cobblecrest');
  expect(st.held).toBe(1);
});

test('Hall 3: beating Marisol gives the Brinewick Seal and Tier 3 with one card; the quarter close gives only the tag', async ({ page }) => {
  test.setTimeout(120000);
  const seals = { seal_fernbrook: 1, seal_glim_1: 1, seal_cobblecrest: 1, seal_glim_2: 1 };
  await boot(page, save(BRINE, seals, { map: 'bw_hall_in', x: 5, y: 4, facing: 'up' }));
  expect(await page.evaluate(() => PixelPets.sceneFor('marisol_trial'))).toBe('marisol_trial@glimmer');
  expect(await page.evaluate(() => PixelPets.runScene('marisol_trial'))).toBe(true);
  const r = await play(page, ['Face Marisol']);
  let st = await state(page);
  expect(st.seals).toEqual(['seal_brinewick', 'seal_cobblecrest', 'seal_fernbrook', 'seal_glim_1', 'seal_glim_2', 'seal_glim_3']);
  expect(st.seal3).toBe(true);
  expect(st.held).toBe(3);
  expect(r.cards).toEqual(['Brinewick Seal']);
  expect(r.says).toContain("Quarter close, partner. Dorian passed your review. Tier 3 is yours. The Seal is Marisol's.");
  expect(await page.evaluate(() => PixelPets.trainerFor('hall3_marisol').lines)).toMatchObject({
    win: 'You read the tide. The Seal is yours. Let Quinn do the filing.', lose: "The tide's in. My deck stays open. The Seal waits for a match." });
  expect(r.says).toContain('Quarter closed. Bright Tier 3 Lanyard. Three marks, one cord.');

  // A fresh save that closes the quarter: tag only; Marisol re-offers; a loss keeps it open; a win gives the Seal once.
  await boot(page, save(BRINE, seals, { map: 'bw_hall_in', x: 5, y: 4, facing: 'up' }));
  expect(await page.evaluate(() => PixelPets.runScene('marisol_trial'))).toBe(true);
  const q = await play(page, ['Close the quarter']);
  st = await state(page);
  expect(st.seals).not.toContain('seal_brinewick');
  expect(st.seals).toContain('seal_glim_3');
  expect(q.cards).toEqual(['Bright Tier 3 Lanyard']);
  const c = await openChoice(page, 'marisol_trial');
  expect([c.who, c.text]).toEqual(['Master Marisol', 'One match on the deck. Ready?']);
  expect(await choiceLabels(page)).toEqual(['Face Marisol for the Seal', 'Not today']);
  await closeScene(page);
  expect(await page.evaluate(() => PixelPets.runScene('marisol_trial'))).toBe(true);
  const lost = await play(page, ['Face Marisol for the Seal'], { lose: true });
  expect(lost.says.slice(0, 2)).toEqual(['Quinn closed your quarter. The Seal is still mine to give.', '? One match on the deck. Ready?']);
  await closeScene(page);
  expect(await page.evaluate(() => PixelPets.runScene('marisol_trial'))).toBe(true);
  const w = await play(page, ['Face Marisol for the Seal']);
  expect(w.says).toContain('? One match on the deck. Ready?');
  expect(w.cards).toEqual(['Brinewick Seal']);
  expect(w.says.filter(t => t === "Marisol's Seal, on your Tier 3 cord at last. Logged! Have a bright day!")).toHaveLength(1);
  expect(await page.evaluate(() => PixelPets.hasSeal('seal_brinewick'))).toBe(true);
  expect(await page.evaluate(() => PixelPets.runScene('marisol_trial'))).toBe(true);
  expect((await play(page, [])).says).toEqual(['Tier 3 is on file. The tide can keep its own schedule.']);
});

test('old saves read tag + beaten flag as the Seal, read only: nothing is written, v stays 2', async ({ page }) => {
  const cases = [
    { seals: { seal_glim_1: 1 }, flags: {}, held: 1, has: ['seal_fernbrook'], not: ['seal_cobblecrest'] },
    { seals: { seal_fernbrook: 1, seal_glim_1: 1, seal_glim_2: 1 }, flags: { 'trainer.hall2_hale': true }, held: 2, has: ['seal_fernbrook', 'seal_cobblecrest'], not: ['seal_brinewick'] },
    { seals: { seal_fernbrook: 1, seal_glim_1: 1, seal_glim_2: 1 }, flags: {}, held: 1, has: ['seal_fernbrook'], not: ['seal_cobblecrest'] },
    { seals: { seal_fernbrook: 1, seal_glim_1: 1, seal_glim_2: 1, seal_glim_3: 1 }, flags: { 'trainer.hall2_hale': true, 'trainer.hall3_marisol': true }, held: 3, has: ['seal_brinewick'], not: [] },
  ];
  for (const c of cases) {
    await boot(page, save(Object.assign({}, COBBLE, c.flags), c.seals));
    const r = await page.evaluate(ids => ({
      held: PixelPets.sealsHeld(), has: ids.map(id => PixelPets.hasSeal(id)),
      stored: JSON.parse(localStorage.getItem('pixelpets.save.v2')).seals, v: PixelPets.state.v,
    }), c.has.concat(c.not));
    expect(r.held).toBe(c.held);
    expect(r.has).toEqual(c.has.map(() => true).concat(c.not.map(() => false)));
    expect(Object.keys(r.stored).sort()).toEqual(Object.keys(c.seals).sort());
    expect(r.v).toBe(2);
  }
});

test('the online and cloud count is Seals held: Fernbrook plus three tags reads 1, after Hale and Marisol 3', async ({ page }) => {
  const seals = { seal_fernbrook: 1, seal_glim_1: 1, seal_glim_2: 1, seal_glim_3: 1 };
  await boot(page, save(Object.assign({}, COBBLE, { 'story.seal2': true, 'story.seal3': true }), seals));
  expect(await page.evaluate(() => PixelPets.sealsHeld())).toBe(1);
  expect(await page.evaluate(() => PixelPets.cloudSeals(localStorage.getItem('pixelpets.save.v2')))).toBe(1);
  const after = await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('pixelpets.save.v2'));
    raw.seals.seal_cobblecrest = 1; raw.seals.seal_brinewick = 1;
    return PixelPets.cloudSeals(JSON.stringify(raw));
  });
  expect(after).toBe(3);
  // Caps and chapters stay on the flags (D1331): the chapter count is three here.
  expect(await page.evaluate(() => PixelPets.state.flags['story.seal3'])).toBe(true);
});

test('both condition readers agree on seal: and seals>=N, aliases included', async ({ page }) => {
  await boot(page, save(Object.assign({}, COBBLE, { 'trainer.hall2_hale': true }), { seal_fernbrook: 1, seal_glim_1: 1, seal_glim_2: 1 }));
  const r = await page.evaluate(() => {
    const st = { flags: PixelPets.state.flags, seals: PixelPets.state.seals, pets: 1 };
    const conds = ['seal:seal_cobblecrest', 'seal:seal_brinewick', 'seal:seal_glim_2', 'seals>=1', 'seals>=2', 'seals>=3', '!seals>=3'];
    return conds.map(c => [c, PixelPets.condRead(c).cond, PPQuests.evalCond(c, st), PPQuests.evalCond(c, Object.assign({ both: false }, st))]);
  });
  const want = { 'seal:seal_cobblecrest': true, 'seal:seal_brinewick': false, 'seal:seal_glim_2': true, 'seals>=1': true, 'seals>=2': true, 'seals>=3': false, '!seals>=3': true };
  for (const [c, game, quests] of r) { expect(game, c).toBe(want[c]); expect(quests, c).toBe(want[c]); }
  // The kill switch (both: false) reads the raw map: three entries, no alias.
  const raw = Object.fromEntries(r.map(([c, , , off]) => [c, off]));
  expect(raw).toEqual({ 'seal:seal_cobblecrest': false, 'seal:seal_brinewick': false, 'seal:seal_glim_2': true, 'seals>=1': true, 'seals>=2': true, 'seals>=3': true, '!seals>=3': false });
  const off = await page.evaluate(() => [PPStanding.sealsHeldIn(PixelPets.state.seals, PixelPets.state.flags, false), PPStanding.hasSealIn(PixelPets.state.seals, PixelPets.state.flags, 'seal_cobblecrest', false)]);
  expect(off).toEqual([3, false]);
});

test('the quota-route lines: townsfolk read the tag lines until Hale is beaten, then the Seal lines; Keepers read today\'s', async ({ page }) => {
  test.setTimeout(60000);
  const talkLine = async id => {
    expect(await page.evaluate(n => PixelPets.talkTo(n), id), id).toBe(true);
    await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full, null, { timeout: 5000 });
    const t = await page.evaluate(() => PixelPets.scene.text);
    await closeScene(page);
    return t;
  };
  const tag = Object.assign({}, COBBLE, { 'story.seal2': true });
  await boot(page, save(tag, { seal_fernbrook: 1, seal_glim_1: 1, seal_glim_2: 1 }));
  expect(await talkLine('cc_miner')).toBe("Hale says your cord's from the company, not him. His floor's still open, patient as stone.");
  await page.evaluate(() => PixelPets.state.seals.seal_cobblecrest = 1);
  expect(await talkLine('cc_miner')).toBe("Hale says you moved stone the right way. Patient. That's high praise from him.");
  await boot(page, save(Object.assign({}, KEEPERS2, { 'story.seal2': true }), { seal_fernbrook: 1, seal_cobblecrest: 1 }));
  expect(await talkLine('cc_miner')).toBe("Hale says you moved stone the right way. Patient. That's high praise from him.");
  // The data order rule (J17, J19-J21): the seal: key comes before the story.sealN key in every rekeyed object.
  const order = await page.evaluate(() => {
    const out = {};
    const scan = (maps, ids) => { for (const m of Object.values(maps)) for (const o of (m.objs || [])) if (ids.includes(o.id)) out[o.id] = Object.keys(o.lines || {}); };
    scan(MAPDATA.cobblecrest.maps, ['cc_miner', 'tamsin', 'tobin_gate']);
    scan(MAPDATA.detail_zz_brinewick.maps, ['bw_ferryhand']);
    return out;
  });
  for (const [id, keys] of Object.entries(order)) {
    const sealKey = keys.findIndex(k => k.startsWith('seal:')), flagKey = keys.findIndex(k => /^story\.seal[23]$/.test(k));
    expect(sealKey, id).toBeGreaterThanOrEqual(0);
    expect(sealKey, id).toBeLessThan(flagKey);
  }
  expect(Object.keys(order).sort()).toEqual(['bw_ferryhand', 'cc_miner', 'tamsin', 'tobin_gate']);
});

test('Hale\'s live Glimmer lines come from loyalty; the Keepers rematch still wires', async ({ page }) => {
  await boot(page, save(COBBLE));
  const lines = await page.evaluate(() => ({ row: PixelPets.trainerFor('hall2_hale').lines }));
  expect(lines.row.win).toBe('Noted. You moved stone without a lamp. The Seal is yours. Quinn can have the paperwork.');
  expect(lines.row.lose).toBe('Stone is patient. My floor stays open. Come back for the Seal.');
  const loyal = await page.evaluate(() => MAPDATA.glimmer_path.loyalty.trainers.hall2_hale);
  expect(loyal.win['story.side=glimmer']).toBe('You moved the hill. Gently, even in that vest. The Seal is yours, {player}.');
  expect(loyal.lose['story.side=glimmer']).toBe("Stone's patient. Rest a while, and come back for the Seal, {player}.");
  // Keepers: a beaten Hale with a rematch mark still opens on the rematch line (wireHaleRematch walks the Keepers scene only).
  await boot(page, save(Object.assign({}, KEEPERS2, { 'story.seal2': true, 'trainer.hall2_hale': true, 'rematch.hall2_hale': true }), { seal_fernbrook: 1, seal_cobblecrest: 1 }));
  expect(await page.evaluate(() => PixelPets.sceneFor('hale_trial'))).toBe('hale_trial');
  expect(await page.evaluate(() => PixelPets.runScene('hale_trial'))).toBe(true);
  await page.waitForFunction(() => PixelPets.scene && /Stone's patient/.test(PixelPets.scene.text || ''), null, { timeout: 8000 });
  await closeScene(page);
  expect(await page.evaluate(() => PixelPets.sealsHeld())).toBe(2);
});

test('the card art: a Glimmer save draws the cord over the Seal, only in the cord rows; a Keepers save draws the raw Seal', async ({ page }) => {
  await boot(page, save(COBBLE));
  for (const id of ['seal_fernbrook', 'seal_cobblecrest', 'seal_brinewick']) {
    const r = await page.evaluate(i => ({ card: PixelPets.sealCardArt(i), raw: PixelPets.sealCardArt(i, true) }), id);
    const diffRows = new Set();
    for (let p = 0; p < r.card.length; p += 4) if (r.card[p] !== r.raw[p] || r.card[p + 1] !== r.raw[p + 1] || r.card[p + 2] !== r.raw[p + 2] || r.card[p + 3] !== r.raw[p + 3]) diffRows.add(Math.floor(p / 4 / 18));
    expect(diffRows.size, id).toBeGreaterThan(0);
    for (const y of diffRows) { expect(y, id).toBeGreaterThanOrEqual(9); expect(y, id).toBeLessThanOrEqual(16); }
  }
  // Tag cards keep their lanyard art (no cord on a tag).
  const tag = await page.evaluate(() => ({ card: PixelPets.sealCardArt('seal_glim_2'), raw: PixelPets.sealCardArt('seal_glim_2', true) }));
  expect(tag.card).toEqual(tag.raw);
  await page.evaluate(() => PixelPets.setSide('keepers'));
  const k = await page.evaluate(() => ({ card: PixelPets.sealCardArt('seal_cobblecrest'), raw: PixelPets.sealCardArt('seal_cobblecrest', true) }));
  expect(k.card).toEqual(k.raw);
});

test('debug checkpoints: past Hall 3 on a Glimmer save writes the Seal and the tag; back before it removes both', async ({ page }) => {
  await boot(page, save(BRINE, { seal_fernbrook: 1, seal_glim_1: 1, seal_cobblecrest: 1, seal_glim_2: 1 }, { map: 'brinewick', x: 10, y: 3 }));
  expect((await page.evaluate(() => PixelPets.checkpoint('ep1_end'))).ok).toBe(true);
  const on = await page.evaluate(() => ({ side: PixelPets.state.flags['story.side'], seals: Object.keys(PixelPets.state.seals).sort(), held: PixelPets.sealsHeld() }));
  expect(on.side).toBe('glimmer');
  expect(on.seals).toEqual(['seal_brinewick', 'seal_cobblecrest', 'seal_fernbrook', 'seal_glim_1', 'seal_glim_2', 'seal_glim_3']);
  expect(on.held).toBe(3);
  expect((await page.evaluate(() => PixelPets.checkpoint('hall3'))).ok).toBe(true);
  const off = await page.evaluate(() => Object.keys(PixelPets.state.seals).sort());
  expect(off).toEqual(['seal_cobblecrest', 'seal_fernbrook', 'seal_glim_1', 'seal_glim_2']);
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});
