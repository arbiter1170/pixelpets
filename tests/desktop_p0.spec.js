/* Desktop P0: a stale focused button, fight-list keys, and battle keys before debug keys.
   Phone projects keep their own viewport. The 390 project also opens a 1280x800 window with no touch.
   Save stays pixelpets.save.v2 with v 2. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

function baseURL() {
  return process.env.PP_URL || ('http://127.0.0.1:' + (process.env.PP_PORT || '8080'));
}

function talkSave() {
  const s = starterSave();
  s.party[0].nick = 'Pipkit';
  Object.assign(s.flags, {
    'story.mom_met': true,
    'story.mom_chore': true,
    'story.mom_sent': true,
    'story.dream_woke': true,
    'story.dream_study': true,
  });
  return s;
}

async function boot(page, search, save) {
  await installSave(page.context(), save || starterSave(), { quietDay: true });
  await gotoGame(page, search);
  await page.waitForFunction(() => window.PixelPets && window.BUILD && window.PixelPets.state && window.PixelPets.state.v === 2);
}

async function onWalk(page) {
  await page.locator('#tabs button[data-tab="walk"]').click();
  await expect(page.locator('#walkBagBtn')).toBeVisible();
}

async function saveV(page) {
  const save = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  expect(save.v).toBe(2);
  return save;
}

async function runBoth(page, browser, info, fn) {
  await fn(page);
  if (!page.viewportSize() || page.viewportSize().width !== 390) return;
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    isMobile: false,
    hasTouch: false,
    deviceScaleFactor: 1,
    baseURL: baseURL(),
  });
  const desk = await ctx.newPage();
  const errors = [];
  desk.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  desk.on('pageerror', (err) => errors.push(err.message));
  try {
    await fn(desk);
    expect(errors, 'desktop console errors:\n' + errors.join('\n')).toEqual([]);
  } finally {
    await ctx.close();
  }
}

test('a click on BAG, then Escape, then Space or Enter, does not reopen the bag', async ({ page, browser }, info) => {
  test.setTimeout(60000);
  const touch = !!(info.project.use && info.project.use.hasTouch);
  await runBoth(page, browser, info, async (p) => {
    await boot(p, '');
    await onWalk(p);
    if (touch && p === page) {
      await p.locator('#walkBagBtn').tap();
      await expect(p.locator('#ovBag')).toBeVisible();
      await p.keyboard.press('Escape');
      await expect(p.locator('#ovBag')).toBeHidden();
    }
    await p.locator('#walkBagBtn').click();
    await expect(p.locator('#ovBag')).toBeVisible();
    expect(await p.evaluate(() => document.activeElement && document.activeElement.id)).not.toBe('walkBagBtn');
    await p.keyboard.press('Escape');
    await expect(p.locator('#ovBag')).toBeHidden();
    await p.keyboard.press('Space');
    await expect(p.locator('#ovBag')).toBeHidden();
    await p.keyboard.press('Enter');
    await expect(p.locator('#ovBag')).toBeHidden();
    await expect(p.locator('#ovScene')).toBeHidden();
    const save = await saveV(p);
    expect(save.debugSave).not.toBe(true);
  });
});

test('Space and Enter still talk to the person you face', async ({ page, browser }, info) => {
  test.setTimeout(90000);
  await runBoth(page, browser, info, async (p) => {
    await boot(p, '?debug=1', talkSave());
    await p.waitForFunction(() => window.PixelPets.debug === true && typeof window.PixelPets.goto === 'function');
    await p.evaluate(() => PixelPets.showTab('walk'));
    const at = await p.evaluate(() => PixelPets.goto('hm_home_up', 5, 2, 'down'));
    expect(at).toMatchObject({ map: 'hm_home_up', x: 5, y: 2 });
    await expect(p.locator('#talkBtn')).toHaveAttribute('aria-disabled', 'false');
    const line = () => p.waitForFunction(() => {
      const s = window.PixelPets.scene;
      return !!(s && s.mode === 'say' && s.full && /trusts you/.test(s.text || ''));
    });
    const closeLine = async (key) => {
      await p.keyboard.press(key);
      await p.waitForFunction(() => !window.PixelPets.scene);
    };
    await p.locator('#talkBtn').click();
    await line();
    await closeLine('Space');
    await p.keyboard.press('Space');
    await line();
    await closeLine('Enter');
    await p.keyboard.press('Enter');
    await line();
    await closeLine('Space');
    expect((await saveV(p)).v).toBe(2);
  });
});

async function openChoose(page) {
  const opened = await page.evaluate(() => {
    PixelPets.setMoves(['bump']);
    PixelPets.battle.textMs = 0;
    PixelPets.battle.animMs = 0;
    PixelPets.healTeam();
    return PixelPets.forceBattle('tide/0', 4);
  });
  expect(opened).toBe(true);
  await page.waitForFunction(() => {
    const b = window.PixelPets.battle;
    return !!(b && b.on && b.state === 'CHOOSE' && b.panel === 'acts');
  }, null, { timeout: 15000 });
  await page.evaluate(() => {
    const b = PixelPets.battle;
    const f = b.foes && b.foes[0];
    if (f) {
      f.hp = 999; f.maxHp = 999; f.stats.atk = 1;
      f.moves = [{ id: 'bump', uses: 40 }];
    }
    b.foePlan = { move: 'bump' };
    b.animMs = 0;
    b.textMs = 0;
  });
}

test('fight keys pick a move, a missing slot does nothing, and Escape goes back', async ({ page, browser }, info) => {
  test.setTimeout(120000);
  await runBoth(page, browser, info, async (p) => {
    await boot(p, '?debug=1');
    await p.waitForFunction(() => window.PixelPets.debug === true && typeof window.PixelPets.forceBattle === 'function');
    expect(await p.evaluate(() => window.PixelPets.fast)).toBe(false);
    await p.keyboard.press('f');
    expect(await p.evaluate(() => window.PixelPets.fast)).toBe(true);
    await p.keyboard.press('f');
    expect(await p.evaluate(() => window.PixelPets.fast)).toBe(false);
    await p.evaluate(() => { PixelPets.state.party[0].hpNow = 1; });
    await p.keyboard.press('h');
    await expect(p.locator('#toast')).toHaveText('Team healed (debug)');
    expect(await p.evaluate(() => PixelPets.state.party[0].hpNow)).toBeUndefined();

    const pos = await p.evaluate(() => ({ x: PixelPets.state.world.x, y: PixelPets.state.world.y }));
    await openChoose(p);
    expect(await p.evaluate(() => window.PixelPets.fast)).toBe(false);
    await p.keyboard.press('f');
    await expect.poll(() => p.evaluate(() => PixelPets.battle.panel)).toBe('fight');
    expect(await p.evaluate(() => window.PixelPets.fast)).toBe(false);
    await expect(p.locator('#fastTag')).toBeHidden();
    await p.keyboard.press('2');
    await p.keyboard.press('4');
    expect(await p.evaluate(() => ({
      panel: PixelPets.battle.panel,
      state: PixelPets.battle.state,
      turn: PixelPets.battle.turn,
    }))).toEqual({ panel: 'fight', state: 'CHOOSE', turn: 0 });
    await p.keyboard.press('Escape');
    await expect.poll(() => p.evaluate(() => PixelPets.battle.panel)).toBe('acts');
    await p.keyboard.press('f');
    await expect.poll(() => p.evaluate(() => PixelPets.battle.panel)).toBe('fight');
    await p.keyboard.press('Backspace');
    await expect.poll(() => p.evaluate(() => PixelPets.battle.panel)).toBe('acts');

    await p.keyboard.press('s');
    await expect(p.locator('#ovSheet')).toBeVisible();
    expect(await p.evaluate(() => ({ x: PixelPets.state.world.x, y: PixelPets.state.world.y }))).toEqual(pos);
    await p.keyboard.press('Escape');
    await expect(p.locator('#ovSheet')).toBeHidden();
    await expect.poll(() => p.evaluate(() => PixelPets.battle.panel)).toBe('acts');

    await p.locator('[data-bact="fight"]').click();
    await expect.poll(() => p.evaluate(() => PixelPets.battle.panel)).toBe('fight');
    await p.locator('#btFightBack').click();
    await expect.poll(() => p.evaluate(() => PixelPets.battle.panel)).toBe('acts');
    await p.locator('[data-bact="fight"]').click();
    await expect.poll(() => p.evaluate(() => PixelPets.battle.panel)).toBe('fight');
    const turn = await p.evaluate(() => PixelPets.battle.turn);
    await p.locator('#btMoves button').first().click();
    await expect.poll(() => p.evaluate(() => PixelPets.battle.turn)).toBeGreaterThan(turn);
    await p.waitForFunction(() => {
      const b = window.PixelPets.battle;
      return !!(b && b.on && b.state === 'CHOOSE' && b.panel === 'acts');
    }, null, { timeout: 15000 });
    await p.keyboard.press('f');
    await expect.poll(() => p.evaluate(() => PixelPets.battle.panel)).toBe('fight');
    const turn2 = await p.evaluate(() => PixelPets.battle.turn);
    await p.keyboard.press('1');
    await expect.poll(() => p.evaluate(() => PixelPets.battle.turn)).toBeGreaterThan(turn2);
    expect((await saveV(p)).v).toBe(2);
  });
});

test('without ?debug=1 the debug keys do nothing', async ({ page, browser }, info) => {
  test.setTimeout(60000);
  await runBoth(page, browser, info, async (p) => {
    await boot(p, '');
    await onWalk(p);
    expect(await p.evaluate(() => window.PixelPets.debug)).toBe(false);
    await p.keyboard.press('f');
    await p.keyboard.press('h');
    await p.keyboard.press('e');
    expect(await p.evaluate(() => window.PixelPets.fast)).toBe(false);
    await expect(p.locator('#ovEvolve')).toBeHidden();
    await expect(p.locator('#fastTag')).toBeHidden();
    await expect(p.locator('#ovBag')).toBeHidden();
    const toast = await p.locator('#toast').textContent();
    expect(toast || '').not.toContain('healed');
    expect(toast || '').not.toContain('FAST');
    const save = await saveV(p);
    expect(save.debugSave).not.toBe(true);
  });
});
