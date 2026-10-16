/* P0 (build 20261015-1305, Vincent's iPhone): beating a trainer must not crash, reload or wipe the save.
   Wins a real trainer fight move by move, then checks the partner, its level and stats survive, and nothing threw.
   See tests/README.md. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

test('beating a trainer keeps the save and partner (P0 trainer win)', async ({ page }) => {
  const save = starterSave();
  save.party[0].xp = 120;
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets.debug === true && typeof window.PixelPets.forceTrainer === 'function');
  let loads = 0; page.on('load', () => { loads++; });
  const before = await page.evaluate(() => { const p = PixelPets.state.party[0]; return { id: p.id, xp: p.xp, hunger: p.hunger, uid: PixelPets.state.uid }; });
  const opened = await page.evaluate(() => { PixelPets.battle.textMs = 1; PixelPets.showTab('walk'); return PixelPets.forceTrainer('route1_pia'); });
  expect(opened).toBe(true);
  for (let turn = 0; turn < 12; turn++) {
    await page.waitForFunction(() => { const b = PixelPets.battle; return !b.on || b.panel === 'end' || (b.state === 'CHOOSE' && b.panel === 'acts'); }, null, { timeout: 15000 });
    const st = await page.evaluate(() => {
      const b = PixelPets.battle; if (!b.on || b.panel === 'end') return 'end';
      b.rng = () => 0.99; b.foePlan = { move: 'wobble' };
      PixelPets.setHp('foe', 1); PixelPets.setHp('me', 999);
      document.querySelector('[data-bact="fight"]').click();
      const mv = [...document.querySelectorAll('#btMoves button[data-move]')].find(el => !el.disabled);
      mv.click(); return 'go';
    });
    if (st === 'end') break;
  }
  await page.waitForFunction(() => PixelPets.battle.panel === 'end', null, { timeout: 15000 });
  expect(await page.evaluate(() => PixelPets.battle.result)).toBe('win');
  await page.click('#btOk');
  await page.waitForTimeout(800);
  expect(loads).toBe(0);
  const after = await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('pixelpets.save.v2'));
    const p = PixelPets.state.party[0];
    return { id: p.id, xp: p.xp, uid: PixelPets.state.uid, savedUid: raw && raw.uid, savedParty: raw && raw.party.length, beat: !!(raw && raw.flags['trainer.route1_pia']) };
  });
  expect(after.id).toBe(before.id);
  expect(after.uid).toBe(before.uid);
  expect(after.savedUid).toBe(before.uid);
  expect(after.savedParty).toBe(1);
  expect(after.xp).toBeGreaterThanOrEqual(before.xp);
  expect(after.beat).toBe(true);
  await page.reload();
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.state);
  expect(await page.evaluate(() => PixelPets.state.party[0].id)).toBe(before.id);
});
