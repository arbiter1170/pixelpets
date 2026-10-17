/* LIZZY_REP v0.2. LR5 reputation (D174, D175, D178), LR6 compass and PEOPLE (D176), LR8 acorn chip (D179), LR10 letter lines (D174).
   See tests/README.md. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, playScene, shot } = require('./helpers');

trackErrors(test, expect);

async function boot(page, save, q = '?debug=1') {
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page, q);
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.repGet);
}

async function runSteps(page, steps) {
  const started = await page.evaluate((st) => window.PixelPets.runSteps(st), steps);
  expect(started).toBe(true);
  await page.waitForFunction(() => !window.PixelPets.scene);
}

test('installSave without rep gives defaults and v stays 2', async ({ page }) => {
  await boot(page, starterSave());
  const r = await page.evaluate(() => ({
    v: PixelPets.state.v,
    rep: PixelPets.state.rep,
    joins: PixelPets.state.repJoins,
    check: PixelPets.repCheck(),
    lizzy: PixelPets.repGet('Lizzy'),
    rook: PixelPets.repGet('Rook'),
    mom: PixelPets.repGet('Mom'),
    dad: PixelPets.repGet('Dad'),
    ilse: PixelPets.repGet('Warden Ilse'),
    wynn: PixelPets.repGet('Clerk Wynn'),
    hollis: PixelPets.repGet('Associate Hollis'),
    lumen: [PixelPets.repGet('Captain Lumen'), PixelPets.repTier('Captain Lumen'), PixelPets.repEffective('Captain Lumen')],
  }));
  expect(r.check).toEqual([]);
  expect(r.v).toBe(2);
  expect(r.rep).toEqual({});
  expect(r.joins).toBe(0);
  expect(r.lizzy).toBe(50);
  expect(r.rook).toBe(40);
  expect(r.mom).toBe(100);
  expect(r.dad).toBe(100);
  expect(r.ilse).toBe(50);
  expect(r.wynn).toBe(50);
  expect(r.hollis).toBe(50);
  // Captain Lumen at 55 is warm for the Keepers (65) and neutral for Glimmerwell (45).
  const lumen = await page.evaluate(() => {
    PixelPets.repAdd('Captain Lumen', 5, 'test');
    const keepers = { raw: PixelPets.repGet('Captain Lumen'), tier: PixelPets.repTier('Captain Lumen'), eff: PixelPets.repEffective('Captain Lumen') };
    PixelPets.setSide('glimmer');
    const glimmer = { tier: PixelPets.repTier('Captain Lumen'), eff: PixelPets.repEffective('Captain Lumen') };
    PixelPets.setSide('keepers');
    return { keepers, glimmer, v: PixelPets.state.v };
  });
  expect(lumen.keepers).toEqual({ raw: 55, tier: 'warm', eff: 65 });
  expect(lumen.glimmer).toEqual({ tier: 'neutral', eff: 45 });
  expect(lumen.v).toBe(2);
  expect(r.lumen[0]).toBe(50);
});

test('setting side_pick_done moves Associate Hollis to 40 and a reload keeps 40', async ({ page }) => {
  const save = starterSave();
  save.phoneBook = { met: { 'Associate Hollis': true }, fav: {} };
  await boot(page, save);
  expect(await page.evaluate(() => PixelPets.repGet('Associate Hollis'))).toBe(50);
  const once = await page.evaluate(() => {
    PixelPets.setFlag('story.side_pick_done', true);
    PixelPets.setFlag('story.side_pick_done', true);
    return { n: PixelPets.repGet('Associate Hollis'), stored: PixelPets.state.rep['Associate Hollis'], joins: PixelPets.state.repJoins, v: PixelPets.state.v };
  });
  expect(once.n).toBe(40);
  expect(once.stored).toBe(40);
  expect(once.joins).toBe(1);
  expect(once.v).toBe(2);
  const stored = await page.evaluate(() => localStorage.getItem('pixelpets.save.v2'));
  await page.context().addInitScript((v) => localStorage.setItem('pixelpets.save.v2', v), stored);
  await page.reload();
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.repGet);
  const again = await page.evaluate(() => ({ n: PixelPets.repGet('Associate Hollis'), joins: PixelPets.state.repJoins, v: PixelPets.state.v }));
  expect(again.n).toBe(40);
  expect(again.joins).toBe(1);
  expect(again.v).toBe(2);
});

test('["rep","Mom",-30] is a no-op', async ({ page }) => {
  await boot(page, starterSave());
  await runSteps(page, [['rep', 'Mom', -30]]);
  const r = await page.evaluate(() => ({
    n: PixelPets.repGet('Mom'),
    stored: PixelPets.state.rep.Mom,
    unlock: PixelPets.state.flags['unlock.rep'] || null,
    v: PixelPets.state.v,
  }));
  expect(r.n).toBe(100);
  expect(r.stored).toBeUndefined();
  expect(r.unlock).toBeNull();
  expect(r.v).toBe(2);
});

test('reptier: condition branches a test scene', async ({ page }) => {
  await boot(page, starterSave());
  await runSteps(page, [
    ['if', 'reptier:Lizzy=neutral', [['setFlag', 'test.reptier0', 'neutral']], [['setFlag', 'test.reptier0', 'miss']]],
    ['if', 'rep:Lizzy>=60', [['setFlag', 'test.repge', 'yes']], [['setFlag', 'test.repge', 'no']]],
    ['if', 'rep:Lizzy<20', [['setFlag', 'test.replt', 'yes']], [['setFlag', 'test.replt', 'no']]],
    ['rep', 'Lizzy', 20],
    ['if', 'reptier:Lizzy=warm', [['setFlag', 'test.reptier', 'warm']], [['setFlag', 'test.reptier', 'miss']]],
  ]);
  const r = await page.evaluate(() => ({
    f: PixelPets.state.flags,
    n: PixelPets.repGet('Lizzy'),
    tier: PixelPets.repTier('Lizzy'),
    v: PixelPets.state.v,
  }));
  expect(r.f['test.reptier0']).toBe('neutral');
  expect(r.f['test.repge']).toBe('no');
  expect(r.f['test.replt']).toBe('no');
  expect(r.f['test.reptier']).toBe('warm');
  expect(r.n).toBe(70);
  expect(r.tier).toBe('warm');
  expect(r.v).toBe(2);
});

test('a pre-PR save loads with no reputation changes and v stays 2', async ({ page }) => {
  const save = starterSave();
  save.flags['story.side_pick_done'] = true;
  save.phoneBook = { met: { 'Associate Hollis': true, 'Lizzy': true }, fav: {} };
  delete save.rep;
  delete save.repJoins;
  await boot(page, save);
  const r = await page.evaluate(() => ({
    v: PixelPets.state.v,
    hollis: PixelPets.repGet('Associate Hollis'),
    lizzy: PixelPets.repGet('Lizzy'),
    rep: PixelPets.state.rep,
    joins: PixelPets.state.repJoins,
    picked: PixelPets.state.flags['story.side_pick_done'],
    unlock: PixelPets.state.flags['unlock.rep'] || null,
    name: PixelPets.state.player.name,
  }));
  expect(r.v).toBe(2);
  expect(r.hollis).toBe(50);
  expect(r.lizzy).toBe(50);
  expect(r.rep).toEqual({});
  expect(r.joins).toBe(0);
  expect(r.picked).toBe(true);
  expect(r.unlock).toBeNull();
  expect(r.name).toBe('Tester');
});

function rect(page, sel) {
  return page.evaluate((s) => {
    const e = document.querySelector(s);
    if (!e || !e.offsetWidth) return null;
    const r = e.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
  }, sel);
}

test('modern compass sits at 6,6 and quest, bag and map move down one slot', async ({ page }) => {
  const save = starterSave();
  save.settings.controls = 'modern';
  save.settings.joystick = true;
  await boot(page, save);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForTimeout(200);
  const w = page.viewportSize().width;
  const r = {
    rep: await rect(page, '#repBtn'),
    quest: await rect(page, '#questBtn'),
    bag: await rect(page, '#walkBagBtn'),
    map: await rect(page, '#mapBtn'),
    env: await rect(page, '#envBadge'),
    joy: await rect(page, '#joyRing'),
    tip: await rect(page, '#walkTip'),
  };
  expect(Math.round(r.rep.x)).toBe(6);
  expect(Math.round(r.rep.y)).toBe(6);
  expect(Math.round(r.rep.width)).toBe(44);
  expect(Math.round(r.rep.height)).toBe(44);
  expect(Math.round(r.quest.x)).toBe(6);
  expect(Math.round(r.quest.y)).toBe(56);
  expect(Math.round(r.bag.y)).toBe(106);
  expect(Math.round(r.map.y)).toBe(156);
  expect(Math.round(r.map.bottom)).toBeLessThanOrEqual(210);
  expect(Math.round(r.env.y)).toBe(6);
  expect(Math.round(r.env.x)).toBeGreaterThanOrEqual(56);
  if (w === 320 || w === 390) {
    expect(r.joy.y).toBeGreaterThanOrEqual(370);
    expect(r.tip.y).toBeGreaterThanOrEqual(470);
    expect(r.map.bottom).toBeLessThan(r.joy.y);
    expect(r.map.bottom).toBeLessThan(r.tip.y);
  }
  if (w === 390) await shot(page, 'rep-compass-modern');
});

test('arcade compass is the first header button and is a 44 px target', async ({ page }) => {
  await boot(page, starterSave());
  await page.evaluate(() => PixelPets.showTab('pet'));
  const home = await page.evaluate(() => {
    const b = document.querySelector('#repBtn');
    return { parent: b.parentNode.className, first: b.parentNode.firstElementChild.id, w: b.getBoundingClientRect().width, h: b.getBoundingClientRect().height };
  });
  expect(home.parent).toContain('who');
  expect(home.first).toBe('repBtn');
  expect(home.w).toBeGreaterThanOrEqual(44);
  expect(home.h).toBeGreaterThanOrEqual(44);
  if (page.viewportSize().width === 390) await shot(page, 'rep-compass-arcade');
});

test('PEOPLE is empty until someone is met, then Lizzy opens a card', async ({ page }) => {
  // A save with pets and no starter flag is rewritten on load (starter_received comes back), so the empty list is a new game that already saw the opening.
  const bare = starterSave();
  bare.party = [];
  bare.box = [];
  bare.partnerId = null;
  delete bare.flags['story.starter_received'];
  delete bare.flags['story.starter_line'];
  await boot(page, bare);
  await page.locator('#repBtn').click();
  await expect(page.locator('#ovRep')).toBeVisible();
  await expect(page.locator('.rep-empty')).toHaveText('Nobody yet. Go say hi.');
  await page.locator('#repBack').click();
  await expect(page.locator('#ovRep')).toBeHidden();

  const save = starterSave();
  save.settings.controls = 'modern';
  await boot(page, save);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.evaluate(() => PixelPets.runScene('lizzy_intro'));
  await playScene(page, ['Hi, Lizzy!', 'Is Rook okay?']);
  await page.locator('#repBtn').click();
  const row = page.locator('.rep-row', { hasText: 'Lizzy' });
  await expect(row).toBeVisible();
  const face = await row.locator('.rep-face').boundingBox();
  expect(face.width).toBeGreaterThanOrEqual(36);
  expect(face.height).toBeGreaterThanOrEqual(36);
  const tap = await row.locator('.rep-face-btn').boundingBox();
  expect(tap.width).toBeGreaterThanOrEqual(44);
  expect(tap.height).toBeGreaterThanOrEqual(44);
  await row.locator('.rep-face-btn').click();
  await expect(page.locator('#repCard .rep-num')).toHaveText('50');
  await expect(page.locator('#repCard .rep-tier')).toHaveText('neutral');
  await page.evaluate(() => {
    MAPDATA.reputation.sources.push({
      who: 'Lizzy', flag: 'story.moral_leak5b', eq: 'court', delta: 10,
      line: 'You took the leak to the Keepers', open: 'Help with a leak?',
    });
  });
  await page.evaluate(() => { window.__repCard = true; });
  await page.locator('#repBack').click();
  await page.locator('.rep-row', { hasText: 'Lizzy' }).locator('.rep-face-btn').click();
  await expect(page.locator('#repCard .rep-src')).toHaveText('? Help with a leak?');
  await page.evaluate(() => PixelPets.setFlag('story.moral_leak5b', 'court'));
  await page.locator('#repBack').click();
  await page.locator('.rep-row', { hasText: 'Lizzy' }).locator('.rep-face-btn').click();
  await expect(page.locator('#repCard .rep-src')).toHaveText('+10 You took the leak to the Keepers');
  if (page.viewportSize().width === 390) await shot(page, 'rep-people-card');
  await page.keyboard.press('Escape');
  await expect(page.locator('#ovRep')).toBeHidden();
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});

test('the acorn chip is a 44 px plate and flashes only on a gain', async ({ page }) => {
  const save = starterSave();
  save.settings.controls = 'modern';
  save.money = 128;
  await boot(page, save);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForTimeout(250);
  const frame = () => page.evaluate(() => { const c = document.querySelector('#fcAcorns .frame-art'); return c ? c.dataset.frame : ''; });
  expect(await frame()).toBe('acorn');
  const box = await page.evaluate(() => {
    const chip = document.querySelector('#fcAcorns'), n = document.querySelector('#fcAcornN');
    const cr = chip.getBoundingClientRect(), nr = n.getBoundingClientRect();
    return { h: Math.round(cr.height), y: Math.round(cr.y), cells: Math.round(cr.width / 2), numLeft: Math.round(nr.left - cr.left), inside: nr.right <= cr.right + 1, icon: !!document.querySelector('#fcAcornIcon') };
  });
  expect(box.h).toBe(44);
  expect(box.y).toBe(6);
  expect(box.cells).toBeGreaterThanOrEqual(32);
  expect(box.cells).toBeLessThanOrEqual(48);
  expect(box.numLeft).toBe(38);
  expect(box.inside).toBe(true);
  expect(box.icon).toBe(false);
  if (page.viewportSize().width === 390) await shot(page, 'rep-acorn-chip');
  await page.evaluate(() => PixelPets.setMoney(129));
  await expect.poll(frame, { timeout: 800 }).toBe('acorn_gain');
  await expect.poll(frame, { timeout: 1000 }).toBe('acorn');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => PixelPets.setMoney(130));
  await page.waitForTimeout(250);
  expect(await frame()).toBe('acorn');
  const wide = await page.evaluate(() => { PixelPets.setMoney(99999); return new Promise(r => setTimeout(() => { const cr = document.querySelector('#fcAcorns').getBoundingClientRect(), nr = document.querySelector('#fcAcornN').getBoundingClientRect(); r({ cells: Math.round(cr.width / 2), inside: nr.right <= cr.right + 1 }); }, 250)); });
  expect(wide.inside).toBe(true);
  expect(wide.cells).toBeLessThanOrEqual(48);
});

test('letter lines follow the effective tier', async ({ page }) => {
  await boot(page, starterSave());
  const r = await page.evaluate(() => {
    const samples = MAPDATA.reputation.letter_quests.samples;
    const plain = {
      school: PixelPets.npcLine('school_lizzy'),
      lumen: null,
    };
    PixelPets.state.flags['story.met_lumen'] = true;
    plain.lumen = PixelPets.npcLine('hq_lumen');
    PixelPets.state.flags['story.hc_invite'] = true;
    const raw = { hostile: 10, cool: 30, neutral: 50, warm: 70, close: 90 };
    const lumenRaw = { hostile: 0, cool: 20, neutral: 40, warm: 55, close: 90 };
    const ids = { Lizzy: ['school_lizzy', 'f5_lizzy', 'hm_lizzy'], Rook: ['rook_home'], 'Captain Lumen': ['hq_lumen'] };
    const got = {};
    PixelPets.state.rep = {};
    PixelPets.state.flags['story.side'] = 'keepers';
    for (const [name, list] of Object.entries(ids)) {
      got[name] = {};
      for (const tier of Object.keys(raw)) {
        PixelPets.state.rep[name] = name === 'Captain Lumen' ? lumenRaw[tier] : raw[tier];
        const line = PixelPets.npcLine(list[0]);
        got[name][tier] = { line, same: list.every(id => PixelPets.npcLine(id) === line), len: (line || '').length, sample: samples[name][tier] };
      }
    }
    PixelPets.state.rep['Captain Lumen'] = 55;
    PixelPets.state.flags['story.side'] = 'keepers';
    const keepers = { tier: PixelPets.repTier('Captain Lumen'), line: PixelPets.npcLine('hq_lumen') };
    PixelPets.state.flags['story.side'] = 'glimmer';
    const glimmer = { tier: PixelPets.repTier('Captain Lumen'), line: PixelPets.npcLine('hq_lumen') };
    return { plain, got, keepers, glimmer, v: PixelPets.state.v };
  });
  expect(r.plain.school).toBe('Class is out! Want to help me wipe the board? Buddy already tried. Now it\'s muddy.');
  expect(r.plain.lumen).toBe('Citizen. Hats off. Then you may speak.');
  for (const name of ['Lizzy', 'Rook', 'Captain Lumen']) {
    for (const tier of ['hostile', 'cool', 'neutral', 'warm', 'close']) {
      expect(r.got[name][tier].same, name + ' ' + tier).toBe(true);
      expect(r.got[name][tier].line).toBe(r.got[name][tier].sample);
      expect(r.got[name][tier].len).toBeLessThanOrEqual(110);
    }
  }
  expect(r.keepers.tier).toBe('warm');
  expect(r.keepers.line).toBe(r.got['Captain Lumen'].warm.sample);
  expect(r.glimmer.tier).toBe('neutral');
  expect(r.glimmer.line).toBe(r.got['Captain Lumen'].neutral.sample);
  expect(r.v).toBe(2);
});
