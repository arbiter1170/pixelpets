/* A party wipe wakes you at this region's Lantern House, healed, with the way out open.
   A hurt party still pays 5 Acorns to rest at the beds. A home nap stays free. See tests/README.md. */
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
    PixelPets.battle.textMs = 1; PixelPets.battle.animMs = 0;
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
    const b = window.PixelPets.battle;
    return b && !b.on && !window.PixelPets.fading;
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

test('a wipe heals the party at the Lantern House and leaves the way out open', async ({ page }) => {
  await installSave(page.context(), partySave(), { quietDay: true });
  await gotoDebug(page);
  const money = await page.evaluate(() => PixelPets.state.money | 0);
  await wipeParty(page);
  await page.evaluate(() => { if (PixelPets.scene) PixelPets.endScene(); });
  await page.waitForFunction(() => !PixelPets.scene && !PixelPets.fading && PixelPets.mapInfo.id === 'hm_lantern_in');
  await shot(page, 'lantern-rest-due');
  const woke = await page.evaluate(() => ({
    map: PixelPets.mapInfo.id, x: PixelPets.keeper.x, y: PixelPets.keeper.y,
    rest: PixelPets.lanternRest, money: PixelPets.state.money,
    respawn: PixelPets.state.world.respawn,
    party: PixelPets.state.party.map((p) => ({ hp: Number.isFinite(p.hpNow) ? p.hpNow : null, faint: !!p.faintUntil })),
    toast: document.querySelector('#toast').textContent,
  }));
  expect(woke.map).toBe('hm_lantern_in');
  expect(woke.x).toBe(2);
  expect(woke.y).toBe(3);
  expect(woke.rest).toEqual({ cost: 5, due: false, hurt: false });
  expect(woke.money).toBe(money);
  expect(woke.respawn).toBe('hearthmoor');
  expect(woke.party).toEqual([{ hp: null, faint: false }, { hp: null, faint: false }]);
  expect(woke.toast).toContain('Back at the Hearthmoor Lantern House.');
  await page.evaluate(() => PixelPets.goto('hm_lantern_in', 4, 5, 'down'));
  await page.evaluate(() => PixelPets.walkStep('down'));
  await page.waitForFunction(() => PixelPets.mapInfo.id === 'hearthmoor' && !PixelPets.fading);
  expect(await page.evaluate(() => PixelPets.state.money)).toBe(money);
});

test('with no Acorns a wipe still heals the party and charges nothing @w1', async ({ page }) => {
  const save = partySave();
  save.money = 0;
  await installSave(page.context(), save, { quietDay: true });
  await gotoDebug(page);
  await wipeParty(page);
  await page.evaluate(() => { if (PixelPets.scene) PixelPets.endScene(); });
  await page.waitForFunction(() => !PixelPets.scene && !PixelPets.fading);
  const after = await page.evaluate(() => ({
    map: PixelPets.mapInfo.id, money: PixelPets.state.money, rest: PixelPets.lanternRest,
    party: PixelPets.state.party.map((p) => ({ hp: p.hpNow, faint: !!p.faintUntil })),
  }));
  expect(after.map).toBe('hm_lantern_in');
  expect(after.money).toBe(0);
  expect(after.rest).toEqual({ cost: 5, due: false, hurt: false });
  expect(after.party.every((p) => p.hp == null && !p.faint)).toBe(true);
});

test('a Fernbrook wipe wakes the party inside the Lantern House @w1', async ({ page }) => {
  const save = partySave();
  save.money = 12;
  save.world = { map: 'fernbrook', x: 8, y: 8, facing: 'down', respawn: 'fernbrook' };
  save.flags['story.reached_fernbrook'] = true;
  await installSave(page.context(), save, { quietDay: true });
  await gotoDebug(page);
  await wipeParty(page);
  await page.evaluate(() => { if (PixelPets.scene) PixelPets.endScene(); });
  await page.waitForFunction(() => PixelPets.mapInfo.id === 'fb_lantern_in' && !PixelPets.fading && !PixelPets.scene);
  const at = await page.evaluate(() => ({
    map: PixelPets.mapInfo.id, x: PixelPets.keeper.x, y: PixelPets.keeper.y,
    money: PixelPets.state.money, due: PixelPets.lanternRest.due,
    hurt: PixelPets.state.party.some((p) => Number.isFinite(p.hpNow)),
  }));
  expect(at).toEqual({ map: 'fb_lantern_in', x: 5, y: 14, money: 12, due: false, hurt: false });
  await page.evaluate(() => PixelPets.walkStep('down'));
  await page.waitForFunction(() => PixelPets.mapInfo.id === 'fernbrook' && !PixelPets.fading);
  expect(await page.evaluate(() => PixelPets.state.money)).toBe(12);
});

test('a home nap is free, and only a hurt lantern rest costs Acorns @w1', async ({ page }) => {
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
  // The hurt rest just filled energy. Math.round treats a crumb under 100 as full, so the line is the already-rested one.
  expect(free.says.join(' ')).toContain('already rested');
  expect(await page.evaluate(() => PixelPets.state.money)).toBe(15);
});

test('D875: a holder short of 5 Acorns pays what they have, and only 0 Acorns rests free @w1', async ({ page }) => {
  const save = starterSave();
  save.money = 3;
  save.flags['story.early_done'] = true;
  await installSave(page.context(), save, { quietDay: true });
  await gotoDebug(page);
  await page.evaluate(() => { PixelPets.state.party[0].hpNow = 4; });
  expect(await page.evaluate(() => PixelPets.runScene('lantern_rest'))).toBe(true);
  const short = await playCollect(page, [/^Rest \(5 Acorns\)$/]);
  expect(short.says.join(' ')).toContain('You leave 3 Acorns');
  expect(await page.evaluate(() => ({ money: PixelPets.state.money, hurt: PixelPets.lanternRest.hurt }))).toEqual({ money: 0, hurt: false });

  await page.evaluate(() => { PixelPets.state.party[0].hpNow = 4; });
  expect(await page.evaluate(() => PixelPets.runScene('lantern_rest'))).toBe(true);
  const broke = await playCollect(page, [/^Rest \(5 Acorns\)$/]);
  expect(broke.says.join(' ')).toContain("You're out of Acorns. The Keeper covers the fee");
  expect(await page.evaluate(() => ({ money: PixelPets.state.money, hurt: PixelPets.lanternRest.hurt }))).toEqual({ money: 0, hurt: false });
});
