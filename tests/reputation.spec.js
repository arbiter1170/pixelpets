/* LIZZY_REP v0.2 LR5 (D174, D175, D178). Defaults, the join penalty, fixed NPCs, and reptier conds.
   See tests/README.md. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

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
