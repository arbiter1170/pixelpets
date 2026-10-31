// WILD_FOLLOW + WILD_GUARD (first-area wild balance). Route 1 and Fernbrook wilds roll between lead - 2 and the lead's
// level, held under a map cap (Route 1: 9, Fernbrook: 13) and never below the table's own range. A full-HP wild keeps
// 1 HP from one holder hit unless the holder is 10+ levels above it. Battles with other holders, bosses and other maps are unchanged.
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

async function boot(page) {
  const s = starterSave();   // an Ember starter
  s.settings.textSpeed = 'fast';
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && PixelPets.state && PixelPets.state.party[0]);
  await page.evaluate(() => PixelPets.showTab('walk'));
}

// Opens a battle with the lead at `lv`, knowing only `mid`. The foe only wobbles; rng 0.2 = a hit, no crit.
async function openFight(page, lv, mid, open) {
  await page.evaluate(([lv, mid]) => { PixelPets.setLevel(lv); PixelPets.healTeam(); PixelPets.setMoves([mid]); }, [lv, mid]);
  expect(await page.evaluate(open)).toBeTruthy();
  await page.waitForFunction(() => PixelPets.battle.on && PixelPets.battle.state === 'CHOOSE', null, { timeout: 20000 });
  await page.evaluate(() => { const b = PixelPets.battle; b.animMs = 0; b.textMs = 0; b.rng = () => 0.2; b.foePlan = { move: 'wobble' }; });
}
async function tap(page, mid) {
  await page.locator('[data-bact="fight"]').click();
  await page.locator(`#btMoves button[data-move="${mid}"]`).click();
  await page.waitForFunction(() => !PixelPets.battle.on || PixelPets.battle.state === 'CHOOSE' || PixelPets.battle.panel === 'end', null, { timeout: 20000 });
  return page.evaluate(() => { const f = PixelPets.battle.foes[0]; return { hp: f.hp, maxHp: f.maxHp }; });
}

test('T1 WILD_FOLLOW: Route 1 / Fernbrook ranges follow the lead, held by the cap and the table floor', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    const R = (id, st, key, lead) => PixelPets.wildLvRange(id, st, key, lead);
    return {
      r1low: R('beetle', 0, 'route1', 2), r1lead5: R('beetle', 0, 'route1', 5), r1lead8: R('beetle', 0, 'route1', 8),
      r1lead15: R('beetle', 0, 'route1', 15), r1stage1: R('beetle', 1, 'route1', 12), r1vane: R('vane', 0, 'route1', 3),
      fbLead9: R('mole', 0, 'fernbrook', 9), fbLead15: R('mole', 0, 'fernbrook', 15),
      r2: R('beetle', 0, 'route2', 30), proto: R('beetle', 0, 'proto', 30),
      r2row: [12, 14],                     // data/act1_route2.json beetle row
    };
  });
  expect(r.r1low).toEqual([2, 4]);        // a low lead never drops below the table
  expect(r.r1lead5).toEqual([3, 5]);
  expect(r.r1lead8).toEqual([6, 8]);
  expect(r.r1lead15).toEqual([8, 9]);     // Route 1 cap 9
  expect(r.r1stage1).toEqual([8, 9]);     // a rare second form follows too, same cap
  expect(r.r1vane).toEqual([4, 6]);       // a row above the lead keeps its own range
  expect(r.fbLead9).toEqual([7, 10]);
  expect(r.fbLead15).toEqual([12, 13]);   // Fernbrook cap 13
  expect(r.r2).toEqual(r.r2row);          // maps outside the first area: unchanged
  expect(r.proto).toEqual([2, 4]);        // Old Meadow: unchanged (WILD_LEVELS_SPECIES)
});

test('T2 WILD_FOLLOW: a wild spawned on Route 1 rolls inside the lead-based range', async ({ page }) => {
  await boot(page);
  const lvs = await page.evaluate(() => {
    PixelPets.setLevel(8);
    if (PixelPets.goto('route1') === false) return null;
    const out = [];
    for (let i = 0; i < 30; i++) { const w = PixelPets.spawnWild(SPECIES.findIndex(x => x.id === 'beetle'), 0); if (w) out.push(w.lv); }
    return out;
  });
  expect(lvs && lvs.length).toBeGreaterThan(0);
  for (const lv of lvs) { expect(lv).toBeGreaterThanOrEqual(6); expect(lv).toBeLessThanOrEqual(8); }
});

test('T3 WILD_GUARD: pure rule (full HP only, gap 10 lifts it)', async ({ page }) => {
  await boot(page);
  const g = await page.evaluate(() => [
    PixelPets.wildGuard(80, 27, 27, 12, 3),   // full HP, gap 9: kept on 1
    PixelPets.wildGuard(80, 27, 27, 13, 3),   // gap 10: a one-shot is allowed
    PixelPets.wildGuard(80, 20, 27, 5, 5),    // already hurt: no guard
    PixelPets.wildGuard(10, 27, 27, 5, 5),    // not a knock-out: unchanged
  ]);
  expect(g).toEqual([26, 80, 80, 10]);
});

for (const reduce of [false, true]) {
  test.describe(reduce ? 'reduced motion' : 'full motion', () => {
    if (reduce) test.use({ reducedMotion: 'reduce' });

    test('T4 WILD_GUARD: a Lv12 Ember leaves a full-HP Lv3 wild on 1 HP, then the next hit lands; save stays v2', async ({ page }) => {
      await boot(page);
      await page.evaluate(() => PixelPets.setFlag('story.tutorial_done', true));
      const keysOf = () => page.evaluate(() => { const s = JSON.parse(localStorage.getItem('pixelpets.save.v2')); return { top: Object.keys(s).sort() }; });
      const before = await keysOf();
      await openFight(page, 12, 'kiln_rush', () => PixelPets.forceBattle('beetle/0', 3));
      const first = await tap(page, 'kiln_rush');
      expect(first.hp).toBe(1);
      expect(await page.evaluate(() => PixelPets.battle.on)).toBe(true);
      await page.evaluate(() => { PixelPets.battle.foePlan = { move: 'wobble' }; });
      const second = await tap(page, 'kiln_rush');
      expect(second.hp).toBe(0);
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
      expect(saved.v).toBe(2);
      const after = await keysOf();
      // No new save field. WILD_FOLLOW / WILD_GUARD write nothing; `care` is the existing day record a wild win writes (D815).
      expect(after.top.filter(k => !before.top.includes(k) && k !== 'care')).toEqual([]);
    });
  });
}

test('T5 WILD_GUARD: a big gap (Lv13 vs Lv3) still knocks out in one hit', async ({ page }) => {
  await boot(page);
  await openFight(page, 13, 'kiln_rush', () => PixelPets.forceBattle('beetle/0', 3));
  expect((await tap(page, 'kiln_rush')).hp).toBe(0);
});

test('T6 WILD_GUARD: battles with other holders are unchanged (Pia\'s Lv4 Gust falls to one Lv12 hit)', async ({ page }) => {
  await boot(page);
  await openFight(page, 12, 'kiln_rush', () => PixelPets.openTrainer('route1_pia'));
  expect((await tap(page, 'kiln_rush')).hp).toBe(0);
});
