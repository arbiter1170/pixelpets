/* SEALS_BOTH_PATHS v0.1.1 (design specs/SEALS_BOTH_PATHS.md; D1323-D1331; June's v1.0 final copy).
   A Seal is a Hall's Seal on both paths; Glimmerwell's Bright Tier is a tag clipped to it. Glimmer holders win the Seal by the
   Hall match; the quota, the Tuning and the review give the tag and close the chapter; the Master offers the match again until
   it is won. Old saves read through the tag aliases (no write). Widths come from the Playwright projects; save v stays 2. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const COBBLE_G = {
  'story.side': 'glimmer', 'story.side_pick_done': true, 'story.seal1': true, 'story.rook_pact': 'race', 'story.route2_end': true,
  'story.reached_cobblecrest': true, 'story.quarry_bought': true,
};
const ROAD = {
  'story.seal1': true, 'story.seal2': true, 'story.cobble_end': true, 'story.reached_cobblecrest': true, 'story.rc_done': true,
  'story.route3_open': true, 'story.reached_route3': true, 'story.quarry_bought': true,
};
const BRINE_G = Object.assign({}, ROAD, {
  'story.side': 'glimmer', 'story.side_pick_done': true, 'story.rook_end': 'stays', 'story.gb_invited': true, 'story.gb_relay_done': true,
  'story.gb_hollis': true, 'story.gb_done': true, 'story.reached_brinewick': true, 'story.brine_arrived': true, 'story.brine_dorian': true,
  'story.brine_freed': true, 'story.brine_depot': true, 'story.brine_manifest': 'signed',
});
const BRINE_K = Object.assign({}, ROAD, {
  'story.hc_council_done': true, 'story.rook_end': 'ally', 'story.rook_quit': 'r5', 'story.reached_brinewick': true, 'story.brine_arrived': true,
});

function mkSave(flags, seals, world) {
  const s = starterSave();
  s.settings.follower = false;
  Object.assign(s.flags, flags || {});
  s.seals = Object.assign({}, seals || {});
  s.world = Object.assign({ map: 'cobblecrest', x: 4, y: 8, facing: 'right', respawn: 'cobblecrest' }, world || {});
  return s;
}
async function boot(page, save, query) {
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page, query == null ? '?debug=1' : query);
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true && typeof window.PixelPets.runScene === 'function');
  // Every Seal card shown from here on is named in window.__cards (D1327: one card per win).
  await page.evaluate(() => {
    window.__cards = [];
    const el = document.querySelector('#btSeal');
    new MutationObserver(() => { if (!el.hidden) window.__cards.push(document.querySelector('#btSealName').textContent); })
      .observe(el, { attributes: true, attributeFilter: ['hidden'] });
  });
}

// Plays the open scene and any battle it opens. `outcome` 'win' or 'lose' settles the first battle. Returns the say lines
// ({ who, text }) and the choice prompts with their option labels.
async function play(page, choices = [], outcome = 'win') {
  const left = choices.slice(), says = [], asks = [];
  let done = false, last = '';
  for (let i = 0; i < 400; i++) {
    const st = await page.evaluate(() => {
      const s = window.PixelPets.scene, b = window.PixelPets.battle;
      return { scene: !!s, mode: s && s.mode, full: s && s.full, waiting: s && s.waiting, text: s && s.text, who: s && s.who,
        battle: !!(b && b.on), panel: b && b.panel };
    });
    if (!st.scene && !st.battle) return { says, asks };
    if (await page.locator('#btOk').isVisible().catch(() => false)) { await page.locator('#btOk').click(); await page.waitForTimeout(40); continue; }
    if (st.battle && !done) {
      if (st.panel !== 'acts' && st.panel !== 'end') {
        if (await page.locator('#btMsg').isVisible().catch(() => false)) await page.locator('#btMsg').click();
        await page.waitForTimeout(40);
        continue;
      }
      await page.evaluate((o) => { PixelPets.battle.textMs = 0; if (o === 'win') PixelPets.winBattle(); else PixelPets.loseBattle(); }, outcome);
      done = true;
      await page.waitForTimeout(40);
      continue;
    }
    if (st.battle) { if (await page.locator('#btMsg').isVisible().catch(() => false)) await page.locator('#btMsg').click(); await page.waitForTimeout(40); continue; }
    if (st.mode === 'choice' && st.full) {
      const open = await page.locator('#sbChoices button:visible').count();
      if (!open) { await page.waitForTimeout(40); continue; }
      await page.waitForFunction(() => window.PixelPets.optionsReady === true);
      const labels = await page.locator('#sbChoices button:visible').allTextContents();
      asks.push({ text: st.text, labels: labels.map(s => s.trim()) });
      const label = left.shift();
      if (label == null) throw new Error('scene asked "' + st.text + '" and the test had no answer left');
      await page.locator('#sbChoices button', { hasText: label }).first().click();
      await page.waitForTimeout(40);
      continue;
    }
    if (st.mode === 'say' && st.full && st.text !== last) { says.push({ who: st.who || '', text: st.text }); last = st.text; }
    if (st.mode === 'say' && st.waiting) { await page.keyboard.press('Space'); await page.waitForTimeout(30); continue; }
    if (st.mode === 'say' && !st.full) { await page.keyboard.press('Space'); await page.waitForTimeout(30); continue; }
    await page.waitForTimeout(40);
  }
  throw new Error('scene did not finish');
}
const texts = r => r.says.map(s => s.text);
const state = page => page.evaluate(() => ({
  seals: Object.keys(PixelPets.state.seals).filter(k => PixelPets.state.seals[k]).sort(),
  flags: PixelPets.state.flags, held: PixelPets.sealsHeld(), cards: window.__cards.slice(),
  points: PixelPets.standing.glimmer.points, snacks: PixelPets.state.bag.hearty_snack || 0, tonic: PixelPets.state.bag.wake_tonic || 0,
  v: PixelPets.state.v,
}));

const J7 = "Hale's Seal, on your Tier 2 cord at last. Logged! Have a bright day!";
const J8 = "Review closed. Tier 2 on your cord, clipped to Hale's Seal. Logged!";
const J9 = "Review closed. Tier 2 on your cord. Hale still holds your Seal. His floor's open.";
const J24 = "Marisol's Seal, on your Tier 3 cord at last. Logged! Have a bright day!";
const J25 = 'Quarter closed. Bright Tier 3 Lanyard. Three marks, one cord.';

test('1. Glimmer, Hall 3: beating Marisol gives the Brinewick Seal and Tier 3, one card', async ({ page }) => {
  test.setTimeout(90000);
  await boot(page, mkSave(BRINE_G, { seal_fernbrook: 1, seal_glim_1: 1, seal_glim_2: 1 }, { map: 'bw_hall_in', x: 5, y: 5, facing: 'up' }));
  expect(await page.evaluate(() => PixelPets.sceneFor('marisol_trial'))).toBe('marisol_trial@glimmer');
  expect(await page.evaluate(() => PixelPets.runScene('marisol_trial'))).toBe(true);
  const r = await play(page, ['Face Marisol']);
  expect(texts(r)).toContain("Quarter close, partner. Dorian passed your review. Tier 3 is yours. The Seal is Marisol's.");
  expect(r.asks[0].labels).toContain('Face Marisol');   // the first-visit option keeps its label
  expect(texts(r)).toContain(J25);
  const s = await state(page);
  expect(s.seals).toEqual(['seal_brinewick', 'seal_fernbrook', 'seal_glim_1', 'seal_glim_2', 'seal_glim_3']);
  expect(s.cards).toEqual(['Brinewick Seal']);
  expect(s.flags['story.seal3']).toBe(true);
  expect(s.held).toBe(2);
  expect(s.v).toBe(2);
});

test('2, 3, 11. Hale: quota close, re-offer, a loss keeps it open, the late win gives the Seal once', async ({ page }) => {
  test.setTimeout(120000);
  await boot(page, mkSave(COBBLE_G, { seal_fernbrook: 1, seal_glim_1: 1 }));
  expect(await page.evaluate(() => PixelPets.runScene('hale_trial'))).toBe(true);
  let r = await play(page, ['Meet the quota instead']);
  expect(texts(r)).toContain(J9);
  expect(texts(r)).not.toContain(J8);
  let s = await state(page);
  expect(s.seals).toEqual(['seal_fernbrook', 'seal_glim_1', 'seal_glim_2']);
  expect(s.cards).toEqual(['Bright Tier 2 Lanyard']);   // the tag card shows on a tag close
  expect(s.flags['story.seal2']).toBe(true);
  const after = { points: s.points, snacks: s.snacks, tonic: s.tonic };
  expect(after.points).toBe(5);

  // The re-offer (D1328), then a loss: the match stays offered.
  expect(await page.evaluate(() => PixelPets.runScene('hale_trial'))).toBe(true);
  r = await play(page, ['Face Hale for the Seal'], 'lose');
  expect(r.says[0]).toEqual({ who: 'Master Hale', text: 'You have their cord. The Seal is still mine to give.' });
  expect(r.asks[0]).toEqual({ text: 'One match on the stone. Ready?', labels: ['Face Hale for the Seal', 'Not today'] });
  s = await state(page);
  expect(s.seals).not.toContain('seal_cobblecrest');

  // "Not today" leaves it open.
  expect(await page.evaluate(() => PixelPets.runScene('hale_trial'))).toBe(true);
  r = await play(page, ['Not today']);
  expect(r.asks[0].labels).toEqual(['Face Hale for the Seal', 'Not today']);

  // The late win: the Seal and its card, one Quinn line, no second snack, tonic, Standing or flag write.
  await page.evaluate(() => { window.__cards = []; });
  expect(await page.evaluate(() => PixelPets.runScene('hale_trial'))).toBe(true);
  r = await play(page, ['Face Hale for the Seal'], 'win');
  expect(texts(r).filter(t => t === J7)).toHaveLength(1);
  expect(texts(r)).not.toContain(J8);
  expect(texts(r)).not.toContain(J9);
  s = await state(page);
  expect(s.seals).toContain('seal_cobblecrest');
  expect(s.cards).toEqual(['Cobblecrest Seal']);
  expect({ points: s.points, snacks: s.snacks, tonic: s.tonic }).toEqual(after);
  expect(s.held).toBe(2);

  // Won: the "on file" arm reads, the re-offer is gone.
  expect(await page.evaluate(() => PixelPets.runScene('hale_trial'))).toBe(true);
  r = await play(page, []);
  expect(texts(r)).toEqual(['Tier 2 is on file. The cradle can wait. Have a bright day!']);
  expect(s.v).toBe(2);
});

test('3. Marisol: quarter close, re-offer, late win', async ({ page }) => {
  test.setTimeout(120000);
  await boot(page, mkSave(BRINE_G, { seal_fernbrook: 1, seal_glim_1: 1, seal_glim_2: 1 }, { map: 'bw_hall_in', x: 5, y: 5, facing: 'up' }));
  expect(await page.evaluate(() => PixelPets.runScene('marisol_trial'))).toBe(true);
  let r = await play(page, ['Close the quarter']);
  expect(texts(r)).toContain(J25);
  let s = await state(page);
  expect(s.seals).not.toContain('seal_brinewick');
  expect(s.flags['story.seal3']).toBe(true);
  const after = { points: s.points, snacks: s.snacks, tonic: s.tonic };

  expect(await page.evaluate(() => PixelPets.runScene('marisol_trial'))).toBe(true);
  r = await play(page, ['Face Marisol for the Seal'], 'lose');
  expect(r.says[0]).toEqual({ who: 'Master Marisol', text: 'Quinn closed your quarter. The Seal is still mine to give.' });
  expect(r.asks[0]).toEqual({ text: 'One match on the deck. Ready?', labels: ['Face Marisol for the Seal', 'Not today'] });

  await page.evaluate(() => { window.__cards = []; });
  expect(await page.evaluate(() => PixelPets.runScene('marisol_trial'))).toBe(true);
  r = await play(page, ['Face Marisol for the Seal'], 'win');
  expect(texts(r).filter(t => t === J24)).toHaveLength(1);
  expect(texts(r)).not.toContain(J25);
  s = await state(page);
  expect(s.seals).toContain('seal_brinewick');
  expect(s.cards).toEqual(['Brinewick Seal']);
  expect({ points: s.points, snacks: s.snacks, tonic: s.tonic }).toEqual(after);

  expect(await page.evaluate(() => PixelPets.runScene('marisol_trial'))).toBe(true);
  r = await play(page, []);
  expect(texts(r)).toEqual(['Tier 3 is on file. The tide can keep its own schedule.']);
});

test('4. old saves read through the aliases and nothing is written @w1', async ({ page }) => {
  const cases = [
    { name: 'A', seals: { seal_glim_1: 1 }, flags: {}, held: 1, has: { seal_fernbrook: true, seal_cobblecrest: false } },
    { name: 'B', seals: { seal_fernbrook: 1, seal_glim_1: 1, seal_glim_2: 1 }, flags: { 'trainer.hall2_hale': true }, held: 2, has: { seal_fernbrook: true, seal_cobblecrest: true } },
    { name: 'C', seals: { seal_fernbrook: 1, seal_glim_1: 1, seal_glim_2: 1 }, flags: {}, held: 1, has: { seal_fernbrook: true, seal_cobblecrest: false } },
  ];
  for (const c of cases) {
    await boot(page, mkSave(Object.assign({}, COBBLE_G, c.flags), c.seals));
    const r = await page.evaluate(() => ({
      held: PixelPets.sealsHeld(), fern: PixelPets.hasSeal('seal_fernbrook'), cobble: PixelPets.hasSeal('seal_cobblecrest'),
      tag: PixelPets.hasSeal('seal_glim_2'), seals: Object.keys(PixelPets.state.seals).sort(), v: PixelPets.state.v,
      stored: Object.keys(JSON.parse(localStorage.getItem('pixelpets.save.v2')).seals).sort(),
    }));
    expect(r.held, c.name).toBe(c.held);
    expect(r.fern, c.name).toBe(c.has.seal_fernbrook);
    expect(r.cobble, c.name).toBe(c.has.seal_cobblecrest);
    expect(r.seals, c.name).toEqual(Object.keys(c.seals).sort());
    expect(r.stored, c.name).toEqual(Object.keys(c.seals).sort());
    expect(r.v).toBe(2);
  }
  // C has the tag but never beat Hale: the re-offer reads.
  expect(await page.evaluate(() => PixelPets.runScene('hale_trial'))).toBe(true);
  const r = await play(page, ['Not today']);
  expect(r.says[0].text).toBe('You have their cord. The Seal is still mine to give.');
});

test('4b. an old save that beat Hale on the Glimmer path reads the "on file" line, not the re-offer @w1', async ({ page }) => {
  await boot(page, mkSave(Object.assign({}, COBBLE_G, { 'story.seal2': true, 'trainer.hall2_hale': true }),
    { seal_fernbrook: 1, seal_glim_1: 1, seal_glim_2: 1 }));
  expect(await page.evaluate(() => PixelPets.runScene('hale_trial'))).toBe(true);
  const r = await play(page, []);
  expect(texts(r)).toEqual(['Tier 2 is on file. The cradle can wait. Have a bright day!']);
});

test('5. the online count is Seals held, not tags @w1', async ({ page }) => {
  // H.seals (net.js "SEALS n/8", titles, the cloud card) is sealsHeld() since this build.
  await boot(page, mkSave(Object.assign({}, BRINE_G, { 'story.seal3': true }),
    { seal_fernbrook: 1, seal_glim_1: 1, seal_glim_2: 1, seal_glim_3: 1 }, { map: 'bw_hall_in', x: 5, y: 5, facing: 'up' }));
  expect(await page.evaluate(() => PixelPets.sealsHeld())).toBe(1);
  await boot(page, mkSave(Object.assign({}, BRINE_G, { 'story.seal3': true, 'trainer.hall2_hale': true, 'trainer.hall3_marisol': true }),
    { seal_fernbrook: 1, seal_glim_1: 1, seal_cobblecrest: 1, seal_glim_2: 1, seal_brinewick: 1, seal_glim_3: 1 }, { map: 'bw_hall_in', x: 5, y: 5, facing: 'up' }));
  expect(await page.evaluate(() => PixelPets.sealsHeld())).toBe(3);
  expect(await page.evaluate(() => PixelPets.condRead('seals>=3').cond)).toBe(true);
  expect(await page.evaluate(() => PixelPets.condRead('seals>=4').cond)).toBe(false);
});

test('6. Keepers: counts, Hale rematch and the town lines are unchanged @w1', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page, mkSave(Object.assign({}, BRINE_K, { 'trainer.hall2_hale': true, 'rematch.hall2_hale': true }),
    { seal_fernbrook: 1, seal_cobblecrest: 1 }, { map: 'cobblecrest', x: 4, y: 8, facing: 'right' }));
  expect(await page.evaluate(() => PixelPets.sealsHeld())).toBe(2);
  expect(await page.evaluate(() => PixelPets.sceneFor('hale_trial'))).toBe('hale_trial');
  const lines = await page.evaluate(() => ({
    tobin: PixelPets.npcLine('tobin_gate'), miner: PixelPets.npcLine('cc_miner'), tamsin: PixelPets.npcLine('tamsin'), ferry: PixelPets.npcLine('bw_ferryhand'),
  }));
  expect(lines.miner).toBe("Hale says you moved stone the right way. Patient. That's high praise from him.");
  expect(lines.tamsin).toBe("A Seal from Hale! He doesn't hand those out to just anyone. Well done.");
  expect(lines.tobin).toBe("Hale's Seal, huh? Doesn't open this gate, sorry. Nothing does. Have a bright day!");
  // The Keepers Hale rematch is still wired into hale_trial's seal:seal_cobblecrest arm (wireHaleRematch): with the rematch flag
  // Hale opens with his rematch offer, and the Glimmer scene was never walked.
  expect(await page.evaluate(() => PixelPets.runScene('hale_trial'))).toBe(true);
  const first = await page.evaluate(async () => { for (let i = 0; i < 50 && !(PixelPets.scene && PixelPets.scene.full); i++) await new Promise(r => setTimeout(r, 40)); return { who: PixelPets.scene.who, text: PixelPets.scene.text }; });
  expect(first.who).toBe('Master Hale');
  expect(first.text).toMatch(/Stone's patient|again|rematch|stone/i);
});

test('7. the Seal card art: plain on Keepers, Seal plus cord only inside the cord box on Glimmer @w1', async ({ page }) => {
  await boot(page, mkSave(COBBLE_G, { seal_fernbrook: 1 }));
  const g = await page.evaluate(() => ['seal_fernbrook', 'seal_cobblecrest', 'seal_brinewick'].map(id => ({ raw: PixelPets.sealArt(id), card: PixelPets.sealCardArt(id) })));
  for (const { raw, card } of g) {
    expect(card).toHaveLength(16);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (raw[y][x] !== card[y][x]) expect(y, 'cord pixel above the lower Seal').toBeGreaterThanOrEqual(6);
  }
  await page.evaluate(() => PixelPets.setSide('keepers'));
  const k = await page.evaluate(() => ['seal_fernbrook', 'seal_cobblecrest', 'seal_brinewick'].map(id => ({ raw: PixelPets.sealArt(id), card: PixelPets.sealCardArt(id) })));
  for (const { raw, card } of k) expect(card).toEqual(raw);
});

test('8. debug checkpoints: Seal 3 on a Glimmer save writes the Seal and the tag, and clears both @w1', async ({ page }) => {
  await boot(page, mkSave(BRINE_G, { seal_fernbrook: 1, seal_glim_1: 1, seal_cobblecrest: 1, seal_glim_2: 1 }, { map: 'bw_hall_in', x: 5, y: 5, facing: 'up' }));
  const ids = await page.evaluate(() => PixelPets.checkpoints().filter(c => c.chain === 'main').map(c => c.id));
  const at = ids.indexOf('hall3');
  expect(at).toBeGreaterThan(0);
  const go = id => page.evaluate((i) => { const out = PixelPets.checkpoint(i); return { ok: out && out.ok, side: PixelPets.state.flags['story.side'], s3: !!PixelPets.state.flags['story.seal3'], seals: Object.keys(PixelPets.state.seals).filter(k => PixelPets.state.seals[k]).sort() }; }, id);
  let r = await go(ids[at + 1]);
  expect(r.side).toBe('glimmer');
  expect(r.s3).toBe(true);
  expect(r.seals).toEqual(expect.arrayContaining(['seal_brinewick', 'seal_glim_3', 'seal_cobblecrest', 'seal_glim_2']));
  r = await go('hall3');
  expect(r.s3).toBe(false);
  expect(r.seals).not.toContain('seal_brinewick');
  expect(r.seals).not.toContain('seal_glim_3');
});

test('9. kill switch: with both off, the helpers read the raw map @w1', async ({ page }) => {
  await boot(page, mkSave(COBBLE_G, { seal_glim_1: 1, seal_glim_2: 1 }));
  const r = await page.evaluate(() => {
    const seals = { seal_glim_1: 1, seal_glim_2: 1 }, flags = { 'trainer.hall2_hale': true };
    return {
      off: [PPStanding.hasSealIn(seals, flags, 'seal_fernbrook', false), PPStanding.hasSealIn(seals, flags, 'seal_glim_2', false), PPStanding.sealsHeldIn(seals, flags, false)],
      on: [PPStanding.hasSealIn(seals, flags, 'seal_fernbrook', true), PPStanding.hasSealIn(seals, flags, 'seal_glim_2', true), PPStanding.sealsHeldIn(seals, flags, true)],
      quests: PPQuests.evalCond('seal:seal_fernbrook', { flags, seals, both: false }),
    };
  });
  expect(r.off).toEqual([false, true, 2]);
  expect(r.on).toEqual([true, true, 2]);
  expect(r.quests).toBe(false);
});

test('10. town lines after a quota close, then after beating Hale; the Ferry Hand after a quarter close @w1', async ({ page }) => {
  await boot(page, mkSave(Object.assign({}, COBBLE_G, { 'story.seal2': true }), { seal_fernbrook: 1, seal_glim_1: 1, seal_glim_2: 1 }));
  let l = await page.evaluate(() => ({ tobin: PixelPets.npcLine('tobin_gate'), miner: PixelPets.npcLine('cc_miner'), tamsin: PixelPets.npcLine('tamsin') }));
  expect(l.miner).toBe("Hale says your cord's from the company, not him. His floor's still open, patient as stone.");
  expect(l.tamsin).toBe("A Bright Tier from the company. Hale's Seal still waits on his floor.");
  expect(['A Tier 2 cord, huh? Doesn\'t open this gate, sorry. Nothing does. Have a bright day!', 'Cord and vest. Gate stays shut, partner.']).toContain(l.tobin);
  await boot(page, mkSave(Object.assign({}, COBBLE_G, { 'story.seal2': true, 'trainer.hall2_hale': true }), { seal_fernbrook: 1, seal_glim_1: 1, seal_cobblecrest: 1, seal_glim_2: 1 }));
  l = await page.evaluate(() => ({ miner: PixelPets.npcLine('cc_miner'), tamsin: PixelPets.npcLine('tamsin') }));
  expect(l.miner).toBe("Hale says you moved stone the right way. Patient. That's high praise from him.");
  expect(l.tamsin).toBe("A Seal from Hale! He doesn't hand those out to just anyone. Well done.");
  await boot(page, mkSave(Object.assign({}, BRINE_G, { 'story.seal3': true }), { seal_fernbrook: 1, seal_glim_1: 1, seal_glim_2: 1, seal_glim_3: 1 }, { map: 'brinewick', x: 10, y: 3, facing: 'down' }));
  expect(await page.evaluate(() => PixelPets.npcLine('bw_ferryhand'))).toBe("The captain hasn't hummed yet. Her deck's still open to you, she says.");
  expect(await page.evaluate(() => PixelPets.npcLine('bw_quinn'))).toBe('Tier 3 is filed. Have a calm tide.');
  await boot(page, mkSave(Object.assign({}, BRINE_K, { 'story.seal3': true }), { seal_fernbrook: 1, seal_cobblecrest: 1, seal_brinewick: 1 }, { map: 'brinewick', x: 10, y: 3, facing: 'down' }));
  expect(await page.evaluate(() => PixelPets.npcLine('bw_ferryhand'))).toBe("The captain hums when she's pleased. She's been humming since your match.");
});

test('12. Hale\'s live Glimmer lines come from loyalty; the row fallback stays true @w1', async ({ page }) => {
  await boot(page, mkSave(COBBLE_G, { seal_fernbrook: 1, seal_glim_1: 1 }));
  const r = await page.evaluate(() => ({ win: PixelPets.trainerLine('hall2_hale', 'win'), lose: PixelPets.trainerLine('hall2_hale', 'lose'), row: PixelPets.trainerFor('hall2_hale') }));
  expect(r.win).toBe('You moved the hill. Gently, even in that vest. The Seal is yours, Tester.');
  expect(r.lose).toBe("Stone's patient. Rest a while, and come back for the Seal, Tester.");
  expect(r.row.seal).toBe('seal_cobblecrest');
  expect(r.row.lines.win).toBe('Noted. You moved stone without a lamp. The Seal is yours. Quinn can have the paperwork.');
  expect(r.row.lines.lose).toBe('Stone is patient. My floor stays open. Come back for the Seal.');
  // Marisol has no loyalty row, so her @glimmer row lines are live (J26, J27).
  const m = await page.evaluate(() => PixelPets.trainerFor('hall3_marisol'));
  expect(m.seal).toBe('seal_brinewick');
  expect(m.onWin).toBe('seal3');
  expect(m.lines.win).toBe('You read the tide. The Seal is yours. Let Quinn do the filing.');
  expect(m.lines.lose).toBe("The tide's in. My deck stays open. The Seal waits for a match.");
});
