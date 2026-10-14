/* After a party wipe the Lantern House has to rest the whole party before anyone leaves.
   A rest costs a few Acorns. A home nap stays free. See tests/README.md. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, shot } = require('./helpers');

trackErrors(test, expect);

function partySave() {
  const save = starterSave();
  save.money = 20;
  save.flags['story.early_done'] = true;
  save.party.push({
    id: 'petsmoke2', species: 'tide', stage: 0, xp: 10, hunger: 80, happy: 60, energy: 90, nick: null, origin: 'wild',
  });
  save.box = [{
    id: 'petbox1', species: 'bloom', stage: 0, xp: 0, hunger: 80, happy: 60, energy: 90, nick: null, origin: 'wild',
    hpNow: 5, faintUntil: Date.now() + 10 * 60000,
  }];
  return save;
}

async function gotoDebug(page) {
  await gotoGame(page, '?debug=1');
}

// Plays the open scene, recording every full line and choice prompt. `choices` are button labels, in order.
async function playCollect(page, choices, onChoice) {
  const says = [], prompts = [];
  const left = choices.slice();
  for (let i = 0; i < 200; i++) {
    const sc = await page.evaluate(() => {
      const s = window.PixelPets.scene;
      return s && { mode: s.mode, full: s.full, waiting: s.waiting, text: s.text };
    });
    if (!sc) return { says, prompts };
    if (sc.mode === 'choice') {
      if (!sc.full) { await page.waitForTimeout(30); continue; }
      await page.waitForFunction(() => window.PixelPets.optionsReady === true);
      prompts.push(sc.text);
      if (onChoice) await onChoice();
      const label = left.shift();
      if (label == null) throw new Error('scene asked "' + sc.text + '" but the test had no answer left');
      await page.locator('#sbChoices button', { hasText: label }).click();
      await page.waitForTimeout(40);
      continue;
    }
    if (sc.mode === 'say') {
      if (!sc.full || !sc.waiting) { await page.waitForTimeout(30); continue; }
      if (says[says.length - 1] !== sc.text) says.push(sc.text);
      await page.keyboard.press('Space');
      await page.waitForTimeout(40);
      continue;
    }
    await page.waitForTimeout(30);
  }
  throw new Error('scene did not end');
}

async function wipeParty(page) {
  const opened = await page.evaluate(() => {
    PixelPets.battle.textMs = 1;
    PixelPets.showTab('walk');
    return PixelPets.forceBattle('tide/0', 3);
  });
  expect(opened).toBe(true);
  await page.waitForFunction(() => {
    const b = window.PixelPets.battle;
    return b && b.on && b.state === 'CHOOSE';
  }, null, { timeout: 15000 });
  await page.evaluate(() => {
    const now = Date.now();
    for (const p of PixelPets.state.party) { p.hpNow = 0; p.faintUntil = now + 20 * 60000; }
    PixelPets.loseBattle();
  });
  await page.waitForFunction(() => window.PixelPets.battle && window.PixelPets.battle.panel === 'end', null, { timeout: 15000 });
  await page.locator('#btOk').click();
  await page.waitForFunction(() => {
    const s = window.PixelPets.scene;
    return s && s.full && (s.mode === 'say' || s.mode === 'choice');
  }, null, { timeout: 15000 });
}

async function stepOnce(page, dir) {
  const key = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }[dir];
  const before = await page.evaluate(() => ({
    x: PixelPets.keeper.x, y: PixelPets.keeper.y, map: PixelPets.mapInfo.id, scene: !!PixelPets.scene,
  }));
  if (before.scene) throw new Error('cannot step while a scene is open');
  await page.keyboard.down(key);
  await page.waitForTimeout(50);
  await page.keyboard.up(key);
  await page.waitForFunction((b) => {
    const k = window.PixelPets.keeper;
    return k.x !== b.x || k.y !== b.y || window.PixelPets.mapInfo.id !== b.map || !!window.PixelPets.scene;
  }, before, { timeout: 5000 });
  await page.waitForFunction(() => !window.PixelPets.keeper.moving && !window.PixelPets.fading, null, { timeout: 5000 });
}

test('a wipe keeps the party inside until they rest, and the rest costs 5 Acorns', async ({ page }) => {
  await installSave(page.context(), partySave(), { quietDay: true });
  await gotoDebug(page);
  await wipeParty(page);
  await shot(page, 'lantern-rest-due');
  const woke = await playCollect(page, [/^Not yet$/]);
  expect(woke.says.join(' ')).toContain('5 Acorns');
  expect(woke.says.join(' ')).toContain('beds');
  expect(woke.prompts).toContain('Rest the whole party?');
  expect(woke.says.join(' ')).toContain('door stays shut');

  const held = await page.evaluate(() => ({
    map: PixelPets.mapInfo.id, x: PixelPets.keeper.x, y: PixelPets.keeper.y,
    rest: PixelPets.lanternRest, money: PixelPets.state.money,
    party: PixelPets.state.party.map((p) => ({ id: p.id, hp: p.hpNow, faint: !!p.faintUntil })),
    tip: document.querySelector('#walkTip').textContent,
    stuck: window.PPQuests.STUCK[0],
  }));
  expect(held.map).toBe('hm_lantern_in');
  expect(held.x).toBe(2);
  expect(held.y).toBe(3);
  expect(held.rest).toEqual({ cost: 5, due: true, hurt: true });
  expect(held.money).toBe(20);
  expect(held.party.every((p) => p.faint && p.hp < 15)).toBe(true);
  expect(held.tip).toContain('Face a bed');
  expect(held.tip).toContain('5 Acorns');
  expect(held.stuck).toContain('few Acorns');

  await stepOnce(page, 'right');
  await stepOnce(page, 'right');
  await stepOnce(page, 'down');
  await stepOnce(page, 'down');
  await stepOnce(page, 'down');
  const blocked = await page.evaluate(() => ({ map: PixelPets.mapInfo.id, x: PixelPets.keeper.x, y: PixelPets.keeper.y }));
  expect(blocked).toEqual({ map: 'hm_lantern_in', x: 4, y: 6 });
  let labels = [];
  const left = await playCollect(page, [/^Rest \(5 Acorns\)$/], async () => {
    labels = await page.locator('#sbChoices button').allTextContents();
  });
  expect(labels).toContain('Rest (5 Acorns)');
  expect(labels).not.toContain('Leave');
  expect(left.says.join(' ')).toContain('You leave 5 Acorns');
  await page.waitForFunction(() => PixelPets.mapInfo.id === 'hearthmoor' && !PixelPets.fading);
  const out = await page.evaluate(() => ({
    map: PixelPets.mapInfo.id, money: PixelPets.state.money, rest: PixelPets.lanternRest,
    party: PixelPets.state.party.map((p) => ({ hp: Number.isFinite(p.hpNow) ? p.hpNow : null, faint: !!p.faintUntil })),
    box: PixelPets.state.box.map((p) => ({ hp: p.hpNow, faint: !!p.faintUntil })),
  }));
  expect(out.map).toBe('hearthmoor');
  expect(out.money).toBe(15);
  expect(out.rest.due).toBe(false);
  expect(out.rest.hurt).toBe(false);
  expect(out.party).toEqual([{ hp: null, faint: false }, { hp: null, faint: false }]);
  expect(out.box[0].faint).toBe(true);
  expect(out.box[0].hp).toBeLessThan(15);

  await stepOnce(page, 'right');
  await page.waitForFunction(() => {
    const s = window.PixelPets.scene;
    return s && s.full && s.mode === 'say';
  });
  const sign = await page.evaluate(() => PixelPets.scene.text);
  expect(sign).toContain('5 Acorns');
  expect(sign).not.toContain('Free');
});

test('with no Acorns the keeper still rests the party', async ({ page }) => {
  const save = partySave();
  save.money = 0;
  await installSave(page.context(), save, { quietDay: true });
  await gotoDebug(page);
  await wipeParty(page);
  const seen = await playCollect(page, [/^Rest \(5 Acorns\)$/]);
  expect(seen.says.join(' ')).toContain('keeper covers the fee');
  const after = await page.evaluate(() => ({
    map: PixelPets.mapInfo.id, money: PixelPets.state.money, rest: PixelPets.lanternRest,
    party: PixelPets.state.party.map((p) => ({ hp: p.hpNow, faint: !!p.faintUntil })),
  }));
  expect(after.map).toBe('hm_lantern_in');
  expect(after.money).toBe(0);
  expect(after.rest).toEqual({ cost: 5, due: false, hurt: false });
  expect(after.party.every((p) => p.hp == null && !p.faint)).toBe(true);
});

test('Fernbrook will not let a wiped party walk away from the lantern door', async ({ page }) => {
  const save = partySave();
  save.money = 12;
  save.world = { map: 'fernbrook', x: 8, y: 8, facing: 'down', respawn: 'fernbrook' };
  await installSave(page.context(), save, { quietDay: true });
  await gotoDebug(page);
  await wipeParty(page);
  const at = await page.evaluate(() => ({ map: PixelPets.mapInfo.id, x: PixelPets.keeper.x, y: PixelPets.keeper.y }));
  expect(at).toEqual({ map: 'fernbrook', x: 5, y: 5 });
  const woke = await playCollect(page, [/^Not yet$/]);
  expect(woke.says.join(' ')).toContain('5 Acorns');
  expect(woke.says.join(' ')).toContain('door stays shut');
  await page.evaluate(() => PixelPets.clearWild());
  await stepOnce(page, 'down');
  const stuckAt = await page.evaluate(() => ({ x: PixelPets.keeper.x, y: PixelPets.keeper.y }));
  expect(stuckAt).toEqual({ x: 5, y: 5 });
  let stuckLabels = [];
  const paid = await playCollect(page, [/^Rest \(5 Acorns\)$/], async () => {
    stuckLabels = await page.locator('#sbChoices button').allTextContents();
  });
  expect(stuckLabels).toContain('Rest (5 Acorns)');
  expect(stuckLabels).not.toContain('Leave');
  expect(paid.says.join(' ')).toContain('You leave 5 Acorns');
  await page.evaluate(() => PixelPets.clearWild());
  await stepOnce(page, 'down');
  const free = await page.evaluate(() => ({
    x: PixelPets.keeper.x, y: PixelPets.keeper.y, money: PixelPets.state.money, due: PixelPets.lanternRest.due,
  }));
  expect(free.x).toBe(5);
  expect(free.y).toBe(6);
  expect(free.money).toBe(7);
  expect(free.due).toBe(false);
});

test('a home nap is free, and only a hurt lantern rest costs Acorns', async ({ page }) => {
  const save = starterSave();
  save.money = 20;
  save.flags['story.early_done'] = true;
  await installSave(page.context(), save, { quietDay: true });
  await gotoDebug(page);
  expect(await page.evaluate(() => PixelPets.runScene('home_bed'))).toBe(true);
  const nap = await playCollect(page, [/^Nap a while$/]);
  expect(nap.says.join(' ')).toContain('rested');
  expect(await page.evaluate(() => PixelPets.state.money)).toBe(20);

  await page.evaluate(() => { PixelPets.state.party[0].hpNow = 4; });
  expect(await page.evaluate(() => PixelPets.runScene('lantern_rest'))).toBe(true);
  const paid = await playCollect(page, [/^Rest \(5 Acorns\)$/]);
  expect(paid.prompts).toContain('Let your team rest?');
  expect(paid.says.join(' ')).toContain('You leave 5 Acorns');
  const mid = await page.evaluate(() => ({ money: PixelPets.state.money, hurt: PixelPets.lanternRest.hurt }));
  expect(mid).toEqual({ money: 15, hurt: false });

  expect(await page.evaluate(() => PixelPets.runScene('lantern_rest'))).toBe(true);
  const free = await playCollect(page, [/^Rest a while$/]);
  expect(free.says.join(' ')).toContain('already rested');
  expect(await page.evaluate(() => PixelPets.state.money)).toBe(15);
});
