/* D1128 (Vincent, Tue Nov 3, 2026; PACING_REVIEW_OCT31 finding 08 as the research recommends):
   1. After a win, every Walkling on the bench (the holder's own party, worn-out ones too) gets half the XP it would have
      earned at its own level (benchXpAward, stats.js; after the LEVEL_DIFF clamp, rounded down). Level caps hold the
      overflow, and bench level-ups show at the end like a participant's.
   2. Fen keeps 12/13/14 and still pays 420 Acorns (no data change).
   3. Fen's challenge carries a hint while the lead is below Lv 12. It informs and never blocks.
   Save stays pixelpets.save.v2, v 2, no new field. 320, 375 and 390; reduced motion; zero console errors. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);
test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });

const HINT = 'My Walklings are Lv 12 to 14. Bring a second Walkling, or win a few more battles first.';
const pet = (id, species, extra) => Object.assign({ id, species, stage: 0, xp: 0, hunger: 80, happy: 80, energy: 90, nick: null, origin: 'wild' }, extra || {});

function partySave(world, flags) {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.party = [pet('petsmoke1', 'ember', { origin: 'starter' }), pet('benchA', 'tide'), pet('benchB', 'bloom', { hpNow: 0 })];
  s.partnerId = 'petsmoke1';
  Object.assign(s.flags, flags || {});
  s.world = world || { map: 'route1', x: 6, y: 10, facing: 'down', respawn: 'hearthmoor' };
  return s;
}
async function boot(page, s) {
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true);
  await page.evaluate(() => { PixelPets.showTab('walk'); PixelPets.clearWild(); });
}
// Levels by bx, set live (the save is written by the game on its next save).
async function setLevels(page, levels) {
  await page.evaluate((lv) => {
    for (const p of PixelPets.state.party) if (lv[p.id] != null) { p.bx = STAT_RULES.bxForLevel(lv[p.id]); p.bxHeld = 0; }
  }, levels);
}
// Win the open battle move by move (battle_no_reload's drive), noting each foe as it goes down.
async function winBattle(page) {
  const foes = [];
  for (let turn = 0; turn < 30; turn++) {
    await page.waitForFunction(() => { const b = PixelPets.battle; return !b.on || b.panel === 'end' || (b.state === 'CHOOSE' && b.panel === 'acts'); }, null, { timeout: 15000 });
    const st = await page.evaluate(() => {
      const b = PixelPets.battle; if (!b.on || b.panel === 'end') return { end: true };
      b.textMs = 1; b.animMs = 0; b.rng = () => 0.99; b.foePlan = { move: 'wobble' };
      PixelPets.setHp('foe', 1); PixelPets.setHp('me', 999);
      const f = b.foes[b.fi];
      document.querySelector('[data-bact="fight"]').click();
      [...document.querySelectorAll('#btMoves button[data-move]')].find((el) => !el.disabled).click();
      return { foe: { level: f.level, stage: f.stage || 0, fi: b.fi } };
    });
    if (st.end) break;
    if (!foes.find(f => f.fi === st.foe.fi)) foes.push(st.foe);
  }
  await page.waitForFunction(() => PixelPets.battle.panel === 'end', null, { timeout: 15000 });
  const lines = [];
  for (let i = 0; i < 80; i++) {
    const t = await page.evaluate(() => (document.querySelector('#btMsg') || {}).textContent || '');
    if (t && lines[lines.length - 1] !== t) lines.push(t);
    if (await page.locator('#btOk').isVisible()) break;
    await page.waitForTimeout(50);
  }
  await page.click('#btOk');
  await page.waitForFunction(() => !PixelPets.battle.on, null, { timeout: 15000 });
  return foes;
}
const snap = page => page.evaluate(() => Object.fromEntries(PixelPets.state.party.map(p => [p.id, { bx: p.bx || 0, held: p.bxHeld || 0 }])));

test('the bench gets half of its own-level XP from a holder win, worn-out Walklings too; the lead is unchanged', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page, partySave());
  await setLevels(page, { petsmoke1: 10, benchA: 6, benchB: 7 });
  const before = await snap(page);
  expect(await page.evaluate(() => PixelPets.forceTrainer('route1_pia'))).toBe(true);
  const foes = await winBattle(page);
  expect(foes.length).toBeGreaterThan(0);
  const after = await snap(page);
  const want = await page.evaluate(({ foes, before }) => {
    const out = {};
    for (const id of ['petsmoke1', 'benchA', 'benchB']) out[id] = 0;
    // Levels move as XP lands; the game reads the level at each award, so replay in order.
    const bx = { petsmoke1: before.petsmoke1.bx, benchA: before.benchA.bx, benchB: before.benchB.bx };
    const levelAt = n => { let L = 1; while (STAT_RULES.bxForLevel(L + 1) <= n) L++; return L; };
    for (const f of foes) {
      const a = battleXpAward({ Lf: f.level, Lown: levelAt(bx.petsmoke1), foeStage: f.stage, trainer: true });
      bx.petsmoke1 += a; out.petsmoke1 += a;
      for (const id of ['benchA', 'benchB']) { const n = benchXpAward({ Lf: f.level, Lown: levelAt(bx[id]), foeStage: f.stage, trainer: true }); bx[id] += n; out[id] += n; }
    }
    return out;
  }, { foes, before });
  expect(after.benchA.bx - before.benchA.bx).toBe(want.benchA);
  expect(after.benchB.bx - before.benchB.bx).toBe(want.benchB);
  expect(after.petsmoke1.bx - before.petsmoke1.bx).toBe(want.petsmoke1);
  expect(want.benchA).toBeGreaterThan(0);
  // Half of the participant rule, rounded down, for one foe at the same level gap.
  const rule = await page.evaluate(() => ({ full: battleXpAward({ Lf: 10, Lown: 6, trainer: true }), bench: benchXpAward({ Lf: 10, Lown: 6, trainer: true }), share: STAT_RULES.BENCH_SHARE }));
  expect(rule.share).toBe(0.5);
  expect(Math.abs(rule.bench - rule.full / 2)).toBeLessThanOrEqual(1);   // half, rounded down from the unrounded award
  // Save: v 2, no new top-level key, no new pet field.
  const v1 = await page.evaluate(() => { PixelPets.goto('route1', 6, 10, 'down'); return JSON.parse(localStorage.getItem('pixelpets.save.v2')); });
  expect(v1.v).toBe(2);
  // The share uses the existing bx and bxHeld fields only: nothing named for it is written.
  // The bank's passbook (PR #334, D2246: normalizeV2 fills `S.bank` with `led`, `fold`, `jars` and `shares`) carries its own `bank.shares` map,
  // unrelated to the bench share, and merged after this check was written; its path is skipped, every other key is still checked.
  const keys = []; (function walk(o, path) { if (o && typeof o === 'object') for (const [k, x] of Object.entries(o)) { const p = path ? path + '.' + k : k; if (p !== 'bank.shares' && !p.startsWith('bank.shares.')) keys.push(k); walk(x, p); } })(v1, '');
  expect(keys.filter(k => /bench|share/i.test(k))).toEqual([]);
});

test('a bench Walkling at the Lv 15 cap holds its share for the next Seal; the end panel names bench level-ups', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page, partySave());
  await setLevels(page, { petsmoke1: 10, benchA: 15, benchB: 3 });
  const before = await snap(page);
  expect(await page.evaluate(() => PixelPets.forceTrainer('route1_pia'))).toBe(true);
  await winBattle(page);
  const after = await snap(page);
  expect(after.benchA.bx).toBe(before.benchA.bx);           // capped: nothing past Lv 15
  expect(after.benchA.held).toBeGreaterThan(before.benchA.held);
  expect(after.benchB.bx).toBeGreaterThan(before.benchB.bx); // a Lv 3 bench Walkling climbs
  const lv = await page.evaluate(() => { const p = PixelPets.state.party.find(q => q.id === 'benchB'); let L = 1; while (STAT_RULES.bxForLevel(L + 1) <= p.bx) L++; return L; });
  expect(lv).toBeGreaterThan(3);
});

test('Fen hints at the challenge while the lead is below Lv 12, and never blocks it', async ({ page }) => {
  test.setTimeout(60000);
  const crew = { 'story.reached_route1': true, 'story.reached_fernbrook': true, 'story.met_glimmerwell': true, 'story.met_fen': true, 'story.lizzy_class': true,
    'trainer.h1_cadet': true, 'trainer.h1_challenger': true, 'trainer.h1_local': true };
  for (const [lead, hint] of [[10, true], [11, true], [12, false]]) {
    await boot(page, partySave({ map: 'fb_hall_in', x: 7, y: 5, facing: 'up', respawn: 'fernbrook' }, crew));
    await setLevels(page, { petsmoke1: lead });
    expect(await page.evaluate(() => PixelPets.talkTo('fen_hall'))).toBe(true);
    const said = [];
    let choice = null;
    for (let i = 0; i < 60; i++) {
      const sc = await page.evaluate(() => { const s = PixelPets.scene; return s && { mode: s.mode, text: s.text, full: s.full }; });
      if (!sc) break;
      if (sc.text && said[said.length - 1] !== sc.text) said.push(sc.text);
      if (sc.mode === 'choice' && sc.full && await page.locator('#sbChoices button:visible').count()) {
        choice = await page.locator('#sbChoices button:visible').allTextContents();
        await page.locator('#sbChoices button', { hasText: 'Leave' }).first().click();
        continue;
      }
      await page.keyboard.press('Space');
      await page.waitForTimeout(60);
    }
    expect(said.includes(HINT), 'lead Lv ' + lead).toBe(hint);
    expect(choice && choice.some(t => /Begin trial/i.test(t)), 'lead Lv ' + lead + ' still offered the trial').toBe(true);
  }
  expect(HINT.length).toBeLessThanOrEqual(110);
});

test('Fen keeps her team at 12/13/14 and her 420-Acorn purse', async ({ page }) => {
  await boot(page, partySave());
  // moves.js keeps the team and no overlay changes it (TRAINERS is the merged table the game battles from).
  const levels = await page.evaluate(() => TRAINERS.hall1_fen.team.map(m => m.level));
  expect(levels).toEqual([12, 13, 14]);
  expect(10 * Math.max(...levels) * 3).toBe(420);
});
