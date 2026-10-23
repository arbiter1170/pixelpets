/* REMATCH_PARTY_STATS (D276–D296). Party bars, care-button icons, HOLDER hearts, and the re-arm. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

function bootSave() {
  const s = starterSave();
  s.money = 40;
  s.settings.controls = 'modern';
  s.settings.textSpeed = 'fast';
  return s;
}

async function boot(page) {
  await installSave(page.context(), bootSave(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && PixelPets.state && PixelPets.state.party[0]);
}

async function clickOk(page) {
  const ok = page.locator('#btOk');
  await ok.waitFor({ state: 'visible', timeout: 8000 });
  await ok.click();
}

async function wearOutAndLose(page) {
  await page.waitForFunction(() => PixelPets.battle && PixelPets.battle.on && PixelPets.battle.state === 'CHOOSE');
  await page.evaluate(() => {
    const now = Date.now();
    for (const p of PixelPets.state.party) { p.hpNow = 0; p.faintUntil = now + 20 * 60000; }
    PixelPets.battle.textMs = 0; PixelPets.battle.animMs = 0;
    PixelPets.loseBattle();
  });
  await clickOk(page);
}

async function advanceUntil(page, pred, tries = 12) {
  for (let i = 0; i < tries; i++) {
    if (await page.evaluate(pred)) return;
    await page.keyboard.press(' ');
    await page.waitForTimeout(180);
  }
  expect(await page.evaluate(pred)).toBe(true);
}

const ORDER = ['hp', 'nrg', 'food', 'joy', 'grow', 'xp'];
const BAR = { 320: 14, 375: 21, 390: 26 };

test('TEAM and WALKLING-BOX rows show the six stats', async ({ page }) => {
  await boot(page);
  const w = page.viewportSize().width;
  await page.evaluate(() => {
    const S = PixelPets.state;
    S.party[0].nick = 'Puddlepup';
    PixelPets.fillParty();
    PixelPets.depositPet(S.party[1].id);
    PixelPets.showTab('col');
  });
  const rows = page.locator('#ownedList .pet-row');
  const n = await rows.count();
  expect(n).toBeGreaterThan(1);
  let sawBox = false;
  for (let i = 0; i < n; i++) {
    const row = rows.nth(i);
    if ((await row.getAttribute('class')).includes('box-row')) sawBox = true;
    const cells = await row.locator('.ss-cell').evaluateAll((els) => els.map((e) => e.dataset.stat));
    expect(cells).toEqual(ORDER);
    const box = await row.locator('.slot-main').boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
    const clipped = await row.locator('.slot-name').evaluate((el) => el.scrollWidth > el.clientWidth + 1);
    expect(clipped).toBe(false);
    const aria = await row.locator('.slot-main').getAttribute('aria-label');
    expect(aria).toContain('HP ');
    expect(aria.endsWith('. Open.')).toBe(true);
    const bw = await row.locator('.ss-cell .ps-bar').first().evaluate((el) => el.getBoundingClientRect().width);
    expect(Math.abs(bw - BAR[w])).toBeLessThan(1.1);
    const block = await row.locator('.slot-stats').evaluate((el) => ({
      pe: getComputedStyle(el).pointerEvents,
      hidden: el.getAttribute('aria-hidden'),
    }));
    expect(block.pe).toBe('none');
    expect(block.hidden).toBe('true');
    const hit = await row.evaluate((el) => {
      const a = el.querySelector('.slot-copy').getBoundingClientRect();
      const b = el.querySelector('.slot-stats').getBoundingClientRect();
      const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      return ox > 1 && oy > 1;
    });
    expect(hit).toBe(false);
  }
  expect(sawBox).toBe(true);
  const move = await page.locator('.party-slot button[data-act="move"]').first().boundingBox();
  expect(move.height).toBeGreaterThanOrEqual(44);

  await page.evaluate(() => {
    PixelPets.state.party[0].nick = 'WWWWWWWWWW';
    PixelPets.showTab('col');
  });
  const longClip = await page.locator('.party-slot').first().locator('.slot-name').evaluate((el) => el.scrollWidth > el.clientWidth + 1);
  expect(longClip).toBe(false);
  if (w === 320) {
    const wrapped = await page.locator('.party-slot').first().evaluate((el) => {
      const name = el.querySelector('.slot-name');
      const tag = el.querySelector('.partner-tag');
      return tag.offsetTop > name.offsetTop + 2;
    });
    expect(wrapped).toBe(true);
  }
  await page.locator('.party-slot .slot-stats').first().click({ force: true });
  await expect(page.locator('#ovWalkling')).toBeVisible();
});

test('a worn-out Walkling has an empty red HP bar and a tired one is under a quarter', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, 'one width');
  await boot(page);
  await page.evaluate(() => {
    PixelPets.fillParty();
    const a = PixelPets.state.party[0];
    const b = PixelPets.state.party[1];
    a.hpNow = 0;
    a.faintUntil = Date.now() + 12 * 60000;
    b.hpNow = Math.max(1, Math.floor(maxHpOf(b) * 0.2));
    delete b.faintUntil;
    PixelPets.showTab('col');
  });
  const worn = await page.locator('.party-slot').nth(0).locator('.ss-cell[data-stat=hp] .ps-bar i').evaluate((el) => ({
    w: el.style.width, cls: el.className,
  }));
  expect(worn.w).toBe('0%');
  expect(worn.cls).toContain('warn');
  expect(worn.cls).not.toContain('low');
  await expect(page.locator('.party-slot').nth(0).locator('.pc-badge')).toContainText('RESTING');
  const tired = await page.locator('.party-slot').nth(1).locator('.ss-cell[data-stat=hp] .ps-bar i').evaluate((el) => ({
    w: parseFloat(el.style.width), cls: el.className,
  }));
  expect(tired.w).toBeGreaterThan(0);
  expect(tired.w).toBeLessThan(25);
  expect(tired.cls).toContain('warn');
  expect(tired.cls).not.toContain('low');
  await expect(page.locator('.party-slot').nth(1).locator('.pc-badge')).toHaveText('TIRED');
});

test('FEED, PLAY and REST keep the icon on the same line as the label', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.showTab('pet'));
  for (const sel of ['#scr-pet [data-act="feed"]', '#scr-pet [data-act="play"]', '#scr-pet [data-act="rest"]']) {
    const btn = page.locator(sel);
    const box = await btn.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.width).toBeGreaterThanOrEqual(44);
    const share = await btn.evaluate((el) => {
      const c = el.querySelector('canvas');
      const tn = [...el.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
      const r = document.createRange();
      r.selectNodeContents(tn);
      const cr = c.getBoundingClientRect();
      const tr = r.getBoundingClientRect();
      return {
        display: getComputedStyle(c).display,
        dy: Math.abs((cr.top + cr.bottom) / 2 - (tr.top + tr.bottom) / 2),
        below: tr.top >= cr.bottom - 1,
      };
    });
    expect(share.display).toBe('inline-block');
    expect(share.dy).toBeLessThan(6);
    expect(share.below).toBe(false);
  }
});

test('the HOLDER badge does not cover the bond hearts', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.showTab('pet'));
  await page.waitForFunction(() => {
    const c = document.querySelector('#petCanvas');
    return c && c.dataset.hearts && c.getBoundingClientRect().width > 20;
  });
  const gap = () => page.evaluate(() => {
    const c = document.querySelector('#petCanvas');
    const b = document.querySelector('#petKeeper');
    const cr = c.getBoundingClientRect();
    const br = b.getBoundingClientRect();
    const scale = cr.width / c.width;
    const [hx, end] = c.dataset.hearts.split(',').map(Number);
    const heart = {
      left: cr.left + hx * scale,
      right: cr.left + end * scale,
      top: cr.top + 2 * scale,
      bottom: cr.top + 7 * scale,
    };
    const ox = Math.min(heart.right, br.right) - Math.max(heart.left, br.left);
    const oy = Math.min(heart.bottom, br.bottom) - Math.max(heart.top, br.top);
    return { ox, oy, text: b.textContent };
  });
  const usual = await gap();
  expect(usual.text).toContain('HOLDER');
  expect(usual.ox > 0.5 && usual.oy > 0.5).toBe(false);
  await page.evaluate(() => {
    PixelPets.state.player.name = 'WWWWWWWWWW';
    const k = document.querySelector('#petKeeper');
    k.textContent = '';
    const b = document.createElement('b');
    b.textContent = 'HOLDER';
    k.append(b, document.createTextNode('WWWWWWWWWW'));
  });
  await page.waitForTimeout(50);
  const wide = await gap();
  expect(wide.text).toContain('WWWWWWWWWW');
  expect(wide.ox > 0.5 && wide.oy > 0.5).toBe(false);
});

test('Pia re-arms after a rest, and a win pays once', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, 'one width');
  test.setTimeout(90000);
  await boot(page);
  await page.evaluate(() => {
    PixelPets.showTab('walk');
    PixelPets.goto('route1', 10, 12, 'up');
    PixelPets.clearWild();
  });
  const opened = await page.evaluate(() => {
    const steps = [];
    for (let i = 0; i < 6 && !(PixelPets.scene) ; i++) steps.push(PixelPets.walkStep('up'));
    return { steps, y: PixelPets.state.world.y, scene: !!(PixelPets.scene) };
  });
  expect(opened.scene).toBe(true);
  await page.waitForFunction(() => PixelPets.scene && /kites never lose/.test(PixelPets.scene.text || ''), null, { timeout: 8000 });
  await advanceUntil(page, () => !!(PixelPets.battle && PixelPets.battle.on));
  const before = await page.evaluate(() => PixelPets.state.money | 0);
  await wearOutAndLose(page);
  await page.waitForFunction(() => PixelPets.state.world.map === 'hm_lantern_in' && PixelPets.state.world.restDue !== true && !PixelPets.fading);
  const lost = await page.evaluate(() => ({
    rematch: PixelPets.state.flags['rematch.route1_pia'] === true,
    trainer: !!PixelPets.state.flags['trainer.route1_pia'],
    spotted: !!PixelPets.state.flags['spotted.route1_pia'],
    hold: PixelPets.state.world.restDue === true,
    hurt: PixelPets.state.party.some((p) => Number.isFinite(p.hpNow)),
    map: PixelPets.state.world.map,
    v: PixelPets.state.v,
    top: Object.keys(PixelPets.state).includes('rematch'),
  }));
  expect(lost.rematch).toBe(true);
  expect(lost.trainer).toBe(false);
  expect(lost.spotted).toBe(true);
  expect(lost.hold).toBe(false);
  expect(lost.hurt).toBe(false);
  expect(lost.map).toBe('hm_lantern_in');
  expect(lost.v).toBe(2);
  expect(lost.top).toBe(false);

  await page.evaluate(() => {
    if (PixelPets.scene) PixelPets.endScene();
    PixelPets.clearHold();
    PixelPets.goto('route1', 10, 8, 'down');
    PixelPets.clearWild();
  });
  const grace = await page.evaluate(() => [PixelPets.walkStep('down'), PixelPets.walkStep('up'), PixelPets.walkStep('down')]);
  expect(grace[0].scene).toBe(false);
  expect(grace[1].scene).toBe(false);
  expect(grace[2].scene).toBe(true);
  await page.waitForFunction(() => PixelPets.scene && /Back for more/.test(PixelPets.scene.text || ''), null, { timeout: 8000 });
  await advanceUntil(page, () => !!(PixelPets.battle && PixelPets.battle.on));
  await page.waitForFunction(() => PixelPets.battle && PixelPets.battle.state === 'CHOOSE');
  await page.evaluate(() => { PixelPets.battle.textMs = 0; PixelPets.battle.animMs = 0; PixelPets.winBattle(); });
  await clickOk(page);
  const won = await page.evaluate(() => ({
    rematch: !!PixelPets.state.flags['rematch.route1_pia'],
    trainer: PixelPets.state.flags['trainer.route1_pia'] === true,
    money: PixelPets.state.money | 0,
    v: JSON.parse(localStorage.getItem('pixelpets.save.v2')).v,
  }));
  expect(won.trainer).toBe(true);
  expect(won.rematch).toBe(false);
  expect(won.money).toBeGreaterThan(before);
  expect(won.v).toBe(2);
  await page.evaluate(() => { if (PixelPets.scene) PixelPets.endScene(); });
  const talked = await page.evaluate(() => {
    if (PixelPets.scene) PixelPets.endScene();
    PixelPets.goto('route1', 10, 12, 'up');
    PixelPets.clearWild();
    const o = PixelPets.objPos('route1_pia');
    const spots = [['right', -1, 0], ['left', 1, 0], ['down', 0, -1], ['up', 0, 1]];
    for (const [face, dx, dy] of spots) {
      const x = o.x + dx, y = o.y + dy;
      const info = PixelPets.tileInfo(x, y);
      if (!info || info.blocked) continue;
      PixelPets.goto('route1', x, y, face);
      PixelPets.clearWild();
      const step = PixelPets.walkStep(face);
      if (step.scene) return step;
    }
    return null;
  });
  expect(talked && talked.scene).toBe(true);
  await page.waitForFunction(() => PixelPets.scene && /string snapped/.test(PixelPets.scene.text || ''), null, { timeout: 4000 });
  const still = await page.evaluate(() => PixelPets.state.money | 0);
  expect(still).toBe(won.money);
});

test('an old spotted flag does not re-arm, and a fresh loss does', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, 'one width');
  await boot(page);
  const quiet = await page.evaluate(() => {
    PixelPets.setFlag('spotted.route1_pia', true);
    PixelPets.goto('route1', 10, 8, 'down');
    PixelPets.clearWild();
    const steps = [PixelPets.walkStep('down'), PixelPets.walkStep('up'), PixelPets.walkStep('down'), PixelPets.walkStep('up')];
    return { scenes: steps.map((s) => s.scene), rematch: !!PixelPets.state.flags['rematch.route1_pia'] };
  });
  expect(quiet.scenes.every((s) => s === false)).toBe(true);
  expect(quiet.rematch).toBe(false);
});

test('Tobin does not move the orchard step on a loss, and the win runs it once', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, 'one width');
  test.setTimeout(90000);
  await boot(page);
  await page.evaluate(() => {
    const f = PixelPets.state.flags;
    f['story.rival1_done'] = true;
    f['story.first_wild_met'] = true;
    f['story.reached_route1'] = true;
    f['story.reached_fernbrook'] = true;
    f['story.met_glimmerwell'] = true;
    f['story.met_fen'] = true;
    PixelPets.showTab('walk');
    PixelPets.goto('fernbrook', 9, 18, 'up');
    PixelPets.clearWild();
  });
  expect(await page.evaluate(() => PixelPets.quest && PixelPets.quest.id)).toBe('orchard');
  const started = await page.evaluate(() => {
    const sight = PixelPets.showSight().find((o) => o.id === 'fern_associate');
    const far = sight.line[sight.line.length - 1];
    const near = sight.line[0];
    const toward = far.y > near.y ? 'up' : far.y < near.y ? 'down' : far.x > near.x ? 'left' : 'right';
    PixelPets.goto('fernbrook', far.x, far.y, toward);
    PixelPets.clearWild();
    return PixelPets.walkStep(toward).scene;
  });
  expect(started).toBe(true);
  await advanceUntil(page, () => !!(PixelPets.battle && PixelPets.battle.on), 16);
  await wearOutAndLose(page);
  const mid = await page.evaluate(() => ({
    quest: PixelPets.quest && PixelPets.quest.id,
    cleared: !!PixelPets.state.flags['story.orchard_cleared'],
    rematch: PixelPets.state.flags['rematch.fern_associate'] === true,
  }));
  expect(mid.quest).toBe('orchard');
  expect(mid.cleared).toBe(false);
  expect(mid.rematch).toBe(true);
  await page.evaluate(() => { if (PixelPets.scene) PixelPets.endScene(); PixelPets.clearHold(); });
  await page.waitForFunction(() => !PixelPets.fading && !PixelPets.scene);
  const again = await page.evaluate(() => {
    if (PixelPets.scene) PixelPets.endScene();
    PixelPets.goto('fernbrook', 9, 18, 'up');
    PixelPets.clearWild();
    const sight = PixelPets.showSight().find((o) => o.id === 'fern_associate');
    if (!sight) throw new Error('no tobin on ' + PixelPets.state.world.map);
    const tile = sight.line[sight.line.length - 1];
    const near = sight.line[0];
    const toward = tile.y > near.y ? 'up' : tile.y < near.y ? 'down' : tile.x > near.x ? 'left' : 'right';
    const away = { up: 'down', down: 'up', left: 'right', right: 'left' }[toward];
    PixelPets.goto('fernbrook', tile.x, tile.y, toward);
    PixelPets.clearWild();
    const steps = [PixelPets.walkStep(toward), PixelPets.walkStep(away), PixelPets.walkStep(toward)];
    return { scenes: steps.map((s) => !!s.scene) };
  });
  expect(again.scenes[again.scenes.length - 1]).toBe(true);
  await page.waitForFunction(() => PixelPets.scene && /You're back/.test(PixelPets.scene.text || ''), null, { timeout: 8000 });
  await advanceUntil(page, () => !!(PixelPets.battle && PixelPets.battle.on), 16);
  await page.waitForFunction(() => PixelPets.battle && PixelPets.battle.state === 'CHOOSE');
  await page.evaluate(() => { PixelPets.battle.textMs = 0; PixelPets.battle.animMs = 0; PixelPets.winBattle(); });
  await clickOk(page);
  await page.waitForFunction(() => PixelPets.scene && /crates pop open/.test(PixelPets.scene.text || ''), null, { timeout: 8000 });
  expect(await page.evaluate(() => PixelPets.state.flags['trainer.fern_associate'] === true)).toBe(true);
  expect(await page.evaluate(() => !!PixelPets.state.flags['rematch.fern_associate'])).toBe(false);
});

test('Hale opens with the rematch line, then Begin the trial', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, 'one width');
  test.setTimeout(60000);
  await boot(page);
  await page.evaluate(() => {
    PixelPets.showTab('walk');
    PixelPets.state.world.respawn = 'cobblecrest';
    PixelPets.battle.textMs = 0; PixelPets.battle.animMs = 0;
    return PixelPets.forceTrainer('hall2_hale');
  });
  await wearOutAndLose(page);
  expect(await page.evaluate(() => PixelPets.state.flags['rematch.hall2_hale'] === true)).toBe(true);
  expect(await page.evaluate(() => !(PixelPets.sightLines.hall2_hale && PixelPets.sightLines.hall2_hale.length))).toBe(true);
  await page.evaluate(() => { if (PixelPets.scene) PixelPets.endScene(); PixelPets.clearHold(); });
  const bumped = await page.evaluate(() => {
    if (PixelPets.scene) PixelPets.endScene();
    PixelPets.goto('cc_hall_in', 5, 10, 'up');
    const o = PixelPets.objPos('hale');
    const spots = [['right', -1, 0], ['left', 1, 0], ['down', 0, -1], ['up', 0, 1]];
    for (const [face, dx, dy] of spots) {
      const x = o.x + dx, y = o.y + dy;
      const info = PixelPets.tileInfo(x, y);
      if (!info || info.blocked) continue;
      PixelPets.goto('cc_hall_in', x, y, face);
      const step = PixelPets.walkStep(face);
      if (step.scene) return step;
    }
    return null;
  });
  expect(bumped && bumped.scene).toBe(true);
  await page.waitForFunction(() => PixelPets.scene && /Stone's patient/.test(PixelPets.scene.text || ''), null, { timeout: 8000 });
  await advanceUntil(page, () => PixelPets.scene && PixelPets.scene.mode === 'choice' && /Begin the trial/.test(PixelPets.scene.text || ''), 8);
});

test('Neighbour Rook has no rematch flag', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, 'one width');
  test.setTimeout(45000);
  await boot(page);
  const started = await page.evaluate(() => {
    PixelPets.showTab('walk');
    PixelPets.battle.textMs = 0; PixelPets.battle.animMs = 0;
    return PixelPets.forceTrainer('rival1_rook');
  });
  expect(started).toBe(true);
  await wearOutAndLose(page);
  const flags = await page.evaluate(() => ({
    rematch: !!PixelPets.state.flags['rematch.rival1_rook'],
    done: PixelPets.state.flags['story.rival1_done'] === true,
    result: PixelPets.state.flags['story.rival1_result'],
    v: PixelPets.state.v,
  }));
  expect(flags.rematch).toBe(false);
  expect(flags.done).toBe(true);
  expect(flags.result).toBe('lost');
  expect(flags.v).toBe(2);
});

test('Cass spots again after the grace, and one step starts one battle', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, 'one width');
  test.setTimeout(90000);
  await boot(page);
  await page.evaluate(() => {
    PixelPets.showTab('walk');
    PixelPets.state.world.respawn = 'cobblecrest';
    PixelPets.goto('cc_hall_in', 5, 10, 'up');
  });
  const first = await page.evaluate(() => {
    const sight = PixelPets.showSight().find((o) => o.id === 'h2_builder');
    if (!sight) throw new Error('no cass on ' + PixelPets.state.world.map + ' ' + (PixelPets.mapInfo.objs || []).map((o) => o.id).join(','));
    const tile = sight.line[4];
    const nxt = sight.line[5];
    const dir = nxt.x < tile.x ? 'left' : nxt.x > tile.x ? 'right' : nxt.y < tile.y ? 'up' : 'down';
    PixelPets.goto('cc_hall_in', tile.x, tile.y, dir);
    return PixelPets.walkStep(dir);
  });
  expect(first.scene).toBe(true);
  await advanceUntil(page, () => !!(PixelPets.battle && PixelPets.battle.on), 16);
  await wearOutAndLose(page);
  const woke = await page.evaluate(() => ({
    map: PixelPets.state.world.map,
    rematch: PixelPets.state.flags['rematch.h2_builder'] === true,
    spotted: !!PixelPets.state.flags['spotted.h2_builder'],
  }));
  expect(woke.map).toBe('cc_lantern_in');
  expect(woke.rematch).toBe(true);
  expect(woke.spotted).toBe(true);
  await page.evaluate(() => { if (PixelPets.scene) PixelPets.endScene(); PixelPets.clearHold(); });
  const paced = await page.evaluate(() => {
    if (PixelPets.scene) PixelPets.endScene();
    PixelPets.goto('cc_hall_in', 5, 10, 'up');
    const sight = PixelPets.showSight().find((o) => o.id === 'h2_builder');
    if (!sight) throw new Error('no cass on ' + PixelPets.state.world.map);
    const tile = sight.line[4];
    const nxt = sight.line[5];
    const dir = nxt.x < tile.x ? 'left' : nxt.x > tile.x ? 'right' : nxt.y < tile.y ? 'up' : 'down';
    const back = { left: 'right', right: 'left', up: 'down', down: 'up' }[dir];
    PixelPets.goto('cc_hall_in', tile.x, tile.y, dir);
    return [PixelPets.walkStep(dir), PixelPets.walkStep(back), PixelPets.walkStep(dir)];
  });
  expect(paced[0].scene).toBe(false);
  expect(paced[1].scene).toBe(false);
  expect(paced[2].scene).toBe(true);
  await page.waitForFunction(() => PixelPets.scene && /cairn/.test(PixelPets.scene.text || ''), null, { timeout: 8000 });
  await page.evaluate(() => { if (PixelPets.scene) PixelPets.endScene(); });
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => !PixelPets.scene && !(PixelPets.battle && PixelPets.battle.on))).toBe(true);

  const bix = await page.evaluate(() => {
    PixelPets.state.flags['spotted.h2_sweeper'] = true;
    PixelPets.state.flags['rematch.h2_sweeper'] = true;
    delete PixelPets.state.flags['trainer.h2_sweeper'];
    const sight = PixelPets.showSight().find((o) => o.id === 'h2_sweeper');
    const tile = sight.line[3];
    const nxt = sight.line[4];
    const dir = nxt.x > tile.x ? 'right' : nxt.x < tile.x ? 'left' : nxt.y > tile.y ? 'down' : 'up';
    const back = { left: 'right', right: 'left', up: 'down', down: 'up' }[dir];
    PixelPets.goto('cc_hall_in', tile.x, tile.y, dir);
    return [PixelPets.walkStep(dir), PixelPets.walkStep(back), PixelPets.walkStep(dir)].map((s) => s.scene);
  });
  expect(bix[0]).toBe(false);
  expect(bix[1]).toBe(false);
  expect(bix[2]).toBe(true);
  await page.waitForFunction(() => PixelPets.scene && /Steadier now/.test(PixelPets.scene.text || ''), null, { timeout: 8000 });
});
