/* Tutorial cards hold still, and a battle opened from a scene keeps its buttons in view (Vincent, Oct 28, 2026).
   Before: a step with two targets (the HP bars, the type badges) moved its card between them every 600 ms, and the
   Modern dock (z 12 during scenes) covered MOVES and the move list in a scene battle. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, artifactsDir } = require('./helpers');
const path = require('path');

trackErrors(test, expect);

function saveAt(extra) {
  const s = starterSave();
  s.steps = 0;
  s.flags['story.early_done'] = true;
  s.flags['story.tutorial_done'] = true;
  s.settings.tips = true;
  Object.assign(s.flags, extra || {});
  return s;
}

async function boot(page) {
  await installSave(page.context(), saveAt({ 'story.tut_moves': 'armed' }), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.evaluate(() => PixelPets.applyCtl('modern', false));
}

// A real scene battle: the rival's intro lines, then the battle, with scene-on still set underneath.
async function sceneBattle(page) {
  await page.evaluate(() => { PixelPets.battle.textMs = 0; PixelPets.battle.animMs = 0; });
  expect(await page.evaluate(() => PixelPets.runSteps([['battle', 'rival1_rook']]))).toBe(true);
  for (let i = 0; i < 60; i++) {
    const st = await page.evaluate(() => ({ on: PixelPets.battle.on, card: PixelPets.lesson().card, sc: PixelPets.scene && PixelPets.scene.waiting }));
    if (st.card) break;
    if (!st.on && st.sc) await page.keyboard.press('Space');
    await page.waitForTimeout(80);
  }
  await page.waitForFunction(() => PixelPets.lesson().card === 'F1', null, { timeout: 8000 });
  expect(await page.evaluate(() => document.body.classList.contains('scene-on'))).toBe(true);
}

function places(page) {
  return page.evaluate(() => {
    const r = el => { const b = el.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)].join(','); };
    const rings = [...document.querySelectorAll('#tutLayer .tut-ring')].filter(e => !e.hidden).map(r);
    return { card: r(document.querySelector('#tutCard')), rings: rings.join(' ') };
  });
}

test('a two-target step lights both and its card holds still', async ({ page }) => {
  await boot(page);
  await sceneBattle(page);
  const first = await places(page);
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(250);
    expect(await places(page)).toEqual(first);
  }
  const lit = await page.evaluate(() => {
    const hit = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const rings = [...document.querySelectorAll('#tutLayer .tut-ring')].filter(e => !e.hidden);
    const foe = document.querySelector('#btFoeHp').parentElement.getBoundingClientRect();
    const me = document.querySelector('#btMeHp').parentElement.getBoundingClientRect();
    return {
      n: rings.length,
      foe: rings.some(e => hit(e.getBoundingClientRect(), foe)),
      me: rings.some(e => hit(e.getBoundingClientRect(), me)),
      still: rings.every(e => getComputedStyle(e).animationName === 'none'),
      cardStill: getComputedStyle(document.querySelector('#tutCard')).animationName === 'none',
    };
  });
  expect(lit).toEqual({ n: 2, foe: true, me: true, still: true, cardStill: true });
});

test('MOVES and the move list stay in view in a scene battle', async ({ page }) => {
  await boot(page);
  await sceneBattle(page);
  for (let i = 0; i < 5 && (await page.evaluate(() => PixelPets.lesson().card)) !== 'M3'; i++) {
    await page.locator('#tutActs button', { hasText: 'NEXT' }).click();
    await page.waitForTimeout(60);
  }
  await page.waitForFunction(() => PixelPets.lesson().card === 'M3');
  // Nothing outside the battle may paint over its buttons: the dock sits under the battle overlay.
  const covered = sel => page.evaluate(sel => {
    const b = document.querySelector(sel).getBoundingClientRect();
    const ov = +getComputedStyle(document.querySelector('#ovBattle')).zIndex;
    return [...document.querySelectorAll('.float-ctl')].filter(d => {
      const r = d.getBoundingClientRect(), z = +getComputedStyle(d).zIndex;
      return d.offsetParent && z >= ov && r.top < b.bottom && r.bottom > b.top && r.left < b.right && r.right > b.left;
    }).length;
  }, sel);
  expect(await covered('[data-bact="fight"]')).toBe(0);
  const dir = artifactsDir('tutorial-steady');
  await page.screenshot({ path: path.join(dir, 'scene-m3-' + page.viewportSize().width + '.png') });
  await page.locator('[data-bact="fight"]').click();
  await page.waitForFunction(() => /^M4/.test(PixelPets.lesson().card || ''));
  expect(await covered('#btMoves')).toBe(0);
  await page.screenshot({ path: path.join(dir, 'scene-m4-' + page.viewportSize().width + '.png') });
});
