/* ROOK_LANTERN_WALK (Vincent, Nov 2, 2026): after losing Rook's first match, Rook walks the holder to the Hearthmoor
   Lantern House so healing makes sense, instead of the wipe teleport. Host Della's guide plays, Rook covers the rest,
   then heads for Fernbrook. rival1 is one-shot, so this is the first loss only. A win keeps the old ending. */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { starterSave, installSave, trackErrors, gotoGame, artifactsDir } = require('./helpers');

trackErrors(test, expect);

function gateSave() {
  const s = starterSave();
  s.flags['story.early_done'] = true;
  s.flags['story.tutorial_done'] = true;
  s.flags['story.tut_moves'] = 'done';
  s.flags['story.tut_care'] = 'done';
  s.flags['story.tut_bef'] = 'done';
  delete s.flags['story.rival1_done'];
  delete s.flags['lantern.guide_heard'];
  s.world = Object.assign({}, s.world, { map: 'hearthmoor', x: 21, y: 8, facing: 'right' });
  s.party[0].energy = 90; s.party[0].hunger = 80; s.party[0].happy = 80;
  return s;
}

async function boot(page, save) {
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
}

// Steps through say boxes, battle messages and result cards until `until` (a page function) is true.
async function advance(page, until, seen) {
  for (let i = 0; i < 400; i++) {
    if (await page.evaluate(until)) return;
    const st = await page.evaluate(() => {
      const B = PixelPets.battle, s = PixelPets.scene, vis = sel => { const e = document.querySelector(sel); return !!e && !e.hidden && e.offsetParent !== null; };
      return { battle: !!(B && B.on), state: B && B.state, ok: vis('#btOk'), msg: vis('#btMsg'), say: !!(s && s.mode === 'say' && s.waiting),
        choice: !!(s && s.mode === 'choice' && s.full), text: s && s.text, map: PixelPets.mapInfo.id, cast: !!(PixelPets.state && document && window.PixelPets) };
    });
    if (seen) seen.push({ map: st.map, text: st.text || '' });
    if (st.ok) await page.locator('#btOk').click();
    else if (st.battle && st.state !== 'CHOOSE' && st.msg) await page.locator('#btMsg').click();
    else if (st.say) await page.keyboard.press('Space');
    else if (st.choice && await page.evaluate(() => PixelPets.optionsReady === true)) await page.locator('#sbChoices button').first().click();
    await page.waitForTimeout(40);
  }
  throw new Error('advance: gave up waiting');
}

async function playMatch(page, result) {
  expect(await page.evaluate(() => PixelPets.runScene('rival1'))).toBe(true);
  await advance(page, () => !!(PixelPets.battle && PixelPets.battle.on && PixelPets.battle.state === 'CHOOSE'));
  await page.evaluate((r) => (r === 'win' ? PixelPets.winBattle() : PixelPets.loseBattle()), result);
}

test('R-L1 the first loss: Rook walks the holder to the Lantern House, Della explains, the team rests', async ({ page }) => {
  test.setTimeout(90000);
  await boot(page, gateSave());
  await playMatch(page, 'lose');
  const seen = [];
  // On Hearthmoor, Rook's walking cast stands beside the holder after the match.
  await advance(page, () => !!(PixelPets.scene && PixelPets.mapInfo.id === 'hearthmoor' && PixelPets.state.world.y === 14), seen);
  const shot = artifactsDir('rook-lantern-walk');
  fs.mkdirSync(shot, { recursive: true });
  await page.screenshot({ path: path.join(shot, 'walk-' + page.viewportSize().width + '.png') });
  // Rook's walking cast trails the holder on the way.
  expect(await page.evaluate(() => PixelPets.mapInfo.objs.some(o => o.id === 'rook_walk'))).toBe(true);
  await advance(page, () => !!(PixelPets.scene && PixelPets.mapInfo.id === 'hm_lantern_in' && PixelPets.mapInfo.objs.some(o => o.id === 'rook_walk_in')), seen);
  expect(seen.some(s => s.map === 'hearthmoor' && /walk you to the Lantern House/.test(s.text))).toBe(true);
  await page.screenshot({ path: path.join(shot, 'inside-' + page.viewportSize().width + '.png') });
  await advance(page, () => !PixelPets.scene, seen);
  // Della's guide played, the team is rested, and no teleport toast fired.
  expect(seen.some(s => /Talk to a bed/.test(s.text))).toBe(true);
  expect(seen.some(s => /Race you to Fernbrook/.test(s.text))).toBe(true);
  const after = await page.evaluate(() => ({
    map: PixelPets.mapInfo.id, flags: PixelPets.state.flags, v: PixelPets.state.v,
    hp: PixelPets.state.party.map(p => p.hpNow == null), respawn: PixelPets.state.world.respawn,
    rook: !!document && (window.PixelPets.state && true),
    toast: (document.querySelector('#toast') || {}).textContent || '',
  }));
  expect(after.map).toBe('hm_lantern_in');
  expect(after.flags['story.rival1_result']).toBe('lost');
  expect(after.flags['lantern.guide_heard']).toBe(true);
  expect(after.hp.every(Boolean)).toBe(true);
  expect(after.respawn).toBe('hearthmoor');
  expect(after.toast).not.toContain('Back at the');
  // The lesson is taught once: Della's guide, no Lanterns card after it, and "Your team is rested." only as the toast.
  expect(after.flags['story.unlock_lantern']).toBe(true);
  expect(seen.filter(s => /Your team is rested/.test(s.text)).length).toBe(0);
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => { const c = document.querySelector('#unlockCard'); return !!c && !c.hidden && c.offsetParent !== null; })).toBe(false);
  expect(after.v).toBe(2);
  // Rook left with the scene: no cast is left behind in the room.
  expect(await page.evaluate(() => PixelPets.mapInfo.objs.some(o => /rook_walk/.test(o.id)))).toBe(false);
});

test('R-L2 a win keeps the old ending: no walk, the gate lines play', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page, gateSave());
  await playMatch(page, 'win');
  const seen = [];
  await advance(page, () => !PixelPets.scene, seen);
  expect(seen.some(s => /road is yours/.test(s.text))).toBe(true);
  expect(seen.some(s => /walk you to the Lantern House/.test(s.text))).toBe(false);
  expect(await page.evaluate(() => PixelPets.mapInfo.id)).toBe('hearthmoor');
});

test('R-L3 reduced motion: the walk still lands in the Lantern House with no console errors', async ({ page }) => {
  test.setTimeout(90000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await boot(page, gateSave());
  await playMatch(page, 'lose');
  await advance(page, () => !PixelPets.scene);
  expect(await page.evaluate(() => PixelPets.mapInfo.id)).toBe('hm_lantern_in');
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});
