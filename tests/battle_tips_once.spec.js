/* Battle tips show once (Vincent, Nov 2, 2026). Three bugs from his iPhone run of the Rook match and the first wild
   battles after it:
   1. Tapping a move from the M4 card never ended part 1 (the check read tut.id === 'M4'; the ids are M4p and M4n),
      so F1 (HP), M1 (types) and M2 (matchup) came back on every turn and every battle until the 4-battle cap.
   2. Each look-only card now shows at most once: story.tut_moves_seen (additive flag) keeps the furthest card seen.
   3. A look-only hole keeps its real size: the HP ring hugs the bar, not a 44 px box over the rows around it. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

function saveAt(extra) {
  const s = starterSave();
  s.steps = 0;
  s.flags['story.early_done'] = true;
  s.flags['story.tutorial_done'] = true;
  s.settings.tips = true;
  s.party[0].hunger = 80;
  s.party[0].happy = 80;
  s.party[0].energy = 90;
  delete s.party[0].cd;
  Object.assign(s.flags, extra || {});
  return s;
}

async function boot(page, save) {
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
}

const card = (page) => page.evaluate(() => PixelPets.lesson().card || '');
const flag = (page, k) => page.evaluate((key) => PixelPets.state.flags[key], k);
const next = (page, label) => page.locator('#tutActs button', { hasText: label || 'NEXT' }).click();
async function waitCard(page, id) {
  await page.waitForFunction((c) => (PixelPets.lesson().card || '').indexOf(c) === 0, id, { timeout: 8000 });
}
async function openWild(page, form) {
  await page.evaluate((f) => { PixelPets.battle.textMs = 0; PixelPets.battle.animMs = 0; PixelPets.forceBattle(f, 3); }, form);
  await page.waitForFunction(() => PixelPets.battle && PixelPets.battle.state === 'CHOOSE', null, { timeout: 8000 });
}
async function closeBattle(page) {
  await page.evaluate(() => PixelPets.battle.close());
  await page.waitForFunction(() => !PixelPets.battle.on);
}

test('B-T1 tapping a move from M4 ends part 1: the next choose is M5, not HP again', async ({ page }) => {
  await boot(page, saveAt({ 'story.tut_moves': 'armed', 'story.tut_moves_n': 0 }));
  expect(await page.evaluate(() => {
    PixelPets.battle.textMs = 0; PixelPets.battle.animMs = 0;
    return PixelPets.forceTrainer('rival1_rook');
  })).toBe(true);
  await page.waitForFunction(() => PixelPets.battle.state === 'CHOOSE', null, { timeout: 8000 });
  await waitCard(page, 'F1');
  await next(page); await waitCard(page, 'M1');
  await next(page); await waitCard(page, 'M2');
  await next(page); await waitCard(page, 'M3');
  await page.locator('[data-bact="fight"]').click();
  await waitCard(page, 'M4');
  // Vincent's path: no GOT IT, straight onto a move.
  await page.locator('#btMoves button').first().click();
  expect(await flag(page, 'story.tut_moves')).toBe('p1');
  await page.waitForFunction(() => PixelPets.battle.state === 'CHOOSE' || !PixelPets.battle.on, null, { timeout: 15000 });
  if (await page.evaluate(() => PixelPets.battle.on)) {
    await page.waitForFunction(() => PixelPets.lesson().card !== '' , null, { timeout: 4000 }).catch(() => {});
    const c = await card(page);
    expect(['F1', 'M1', 'M2s', 'M2sx', 'M2h', 'M2e', 'M2z']).not.toContain(c);
  }
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});

test('B-T2 HP, type and matchup cards each show once across battles', async ({ page }) => {
  await boot(page, saveAt({ 'story.tut_moves': 'armed' }));
  await openWild(page, 'bloom/0');
  await waitCard(page, 'F1');
  await next(page); await waitCard(page, 'M1');
  // The player leaves on M1 (closing the battle mid-lesson).
  await closeBattle(page);
  expect(await flag(page, 'story.tut_moves_seen')).toBe(2);
  await openWild(page, 'bloom/0');
  await waitCard(page, 'M2');           // resumes after M1, never F1 again
  await next(page); await waitCard(page, 'M3');
  await closeBattle(page);
  await openWild(page, 'bloom/0');
  await waitCard(page, 'M3');           // F1, M1 and M2 are all done
  expect(await flag(page, 'story.tut_moves')).toBe('armed');
  await closeBattle(page);
});

test('B-T3 part 2 seen once is not played again', async ({ page }) => {
  await boot(page, saveAt({ 'story.tut_moves': 'p1', 'story.tut_moves_seen': 7 }));
  await openWild(page, 'bloom/0');
  await page.waitForTimeout(300);
  expect(await card(page)).toBe('');
  expect(await flag(page, 'story.tut_moves')).toBe('p2');
  await closeBattle(page);
});

test('B-T4 Settings replay starts again at F1', async ({ page }) => {
  await boot(page, saveAt({ 'story.tut_moves': 'done', 'story.tut_moves_seen': 7 }));
  await page.locator('#settingsBtn').click();
  await page.locator('#setTutorial').click();
  await page.locator('#shList .sh-item', { hasText: 'Moves and types' }).click();
  await page.locator('#setClose').click();
  expect(await flag(page, 'story.tut_moves_seen')).toBeUndefined();
  await openWild(page, 'bloom/0');
  await waitCard(page, 'F1');
  await closeBattle(page);
});

test('B-T5 the HP ring hugs the bar and the type rings hug the chips', async ({ page }) => {
  await boot(page, saveAt({ 'story.tut_moves': 'armed' }));
  await openWild(page, 'bloom/0');
  await waitCard(page, 'F1');
  const hp = await page.evaluate(() => {
    const bar = document.querySelector('#btFoeHp').parentElement.getBoundingClientRect();
    const ring = document.querySelector('#tutRing').getBoundingClientRect();
    return { bar: bar.height, ring: ring.height, top: ring.top, barTop: bar.top };
  });
  // The ring adds 6 px a side to the hole; a 44 px pad would make it 56 px tall.
  expect(hp.ring).toBeLessThanOrEqual(hp.bar + 12 + 1);
  expect(Math.abs(hp.top - (hp.barTop - 6))).toBeLessThanOrEqual(1);
  await next(page); await waitCard(page, 'M1');
  const chip = await page.evaluate(() => {
    const c = document.querySelector('#btFoeType').getBoundingClientRect();
    const ring = document.querySelector('#tutRing').getBoundingClientRect();
    return { chip: c.height, ring: ring.height, ringTop: ring.top, vw: window.innerWidth };
  });
  expect(chip.ring).toBeLessThanOrEqual(chip.chip + 12 + 1);
  expect(chip.ringTop).toBeGreaterThanOrEqual(0);
  await closeBattle(page);
});

test('B-T6 reduced motion: the same once-only order holds', async ({ page, context }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await boot(page, saveAt({ 'story.tut_moves': 'armed', 'story.tut_moves_seen': 3 }));
  await openWild(page, 'bloom/0');
  await waitCard(page, 'M3');
  await closeBattle(page);
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});

test('B-T7 the first Rook match: holder hits never miss, and the matchup card is honest', async ({ page }) => {
  await boot(page, saveAt({ 'story.tut_moves': 'armed' }));
  expect(await page.evaluate(() => {
    PixelPets.battle.textMs = 0; PixelPets.battle.animMs = 0;
    return PixelPets.forceTrainer('rival1_rook');
  })).toBe(true);
  await page.waitForFunction(() => PixelPets.battle.state === 'CHOOSE', null, { timeout: 8000 });
  await waitCard(page, 'F1');
  await next(page); await waitCard(page, 'M1');
  await next(page); await waitCard(page, 'M2');
  const c = await card(page);
  // The starter only knows its own type; if that is resisted, the card must not say "Try another kind of move".
  if (c === 'M2sx' || c === 'M2s') {
    expect(c).toBe('M2sx');
    await expect(page.locator('#tutLine')).not.toContainText('Try another kind');
  }
  await page.locator('#tutSkip').click(); await page.locator('#tutSkip').click();
  // Force every accuracy roll to fail: a damaging move must still land in this match.
  await page.evaluate(() => { PixelPets.battle.rng = () => 0.999; });
  const before = await page.evaluate(() => PixelPets.battle.foes[0].hp);
  await page.locator('[data-bact="fight"]').click();
  await page.locator('#btMoves button').first().click();
  await page.waitForFunction(() => PixelPets.battle.state === 'CHOOSE' || !PixelPets.battle.on, null, { timeout: 15000 });
  const after = await page.evaluate(() => PixelPets.battle.foes[0].hp);
  expect(after).toBeLessThan(before);
});


test('B-T8 the befriend odds card rings the hearts and the odds word once, inside the screen', async ({ page }) => {
  await boot(page, saveAt({ 'story.tut_moves': 'done', 'story.tut_bef': 'b1' }));
  await openWild(page, 'bloom/0');
  await page.evaluate(() => document.querySelector('#btBefriendAct').click());
  await waitCard(page, 'W5');
  const r = await page.evaluate(() => {
    const box = q => { const b = document.querySelector(q).getBoundingClientRect(); return { x: b.left, y: b.top, r: b.right, b: b.bottom, w: b.width }; };
    const extra = [...document.querySelectorAll('.tut-ring-x')].filter(e => !e.hidden && e.offsetParent !== null).length;
    return { ring: box('#tutRing'), odds: box('#encOdds'), tries: box('#encTries'), extra, vw: window.innerWidth };
  });
  // One ring, far narrower than the full-width rows, wholly on screen, and covering both rows.
  expect(r.extra).toBe(0);
  expect(r.ring.w).toBeLessThan(r.odds.w / 2);
  expect(r.ring.x).toBeGreaterThanOrEqual(0);
  expect(r.ring.r).toBeLessThanOrEqual(r.vw);
  expect(r.ring.y).toBeLessThanOrEqual(r.tries.y + 6);
  expect(r.ring.b).toBeGreaterThanOrEqual(r.odds.b - 6);
  await closeBattle(page);
});
