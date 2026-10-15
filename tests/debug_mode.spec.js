/* Settings debug gate (password Larson) and the checkpoint / item / encounter / faction tools.
   See tests/README.md. The password is compared case-insensitively. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, shot } = require('./helpers');

trackErrors(test, expect);

async function boot(page, search) {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page, search);
  await page.waitForFunction(() => window.PixelPets && window.BUILD);
}

async function openDebugPanel(page) {
  await page.locator('#settingsBtn').click();
  await expect(page.locator('#ovSettings')).toBeVisible();
  await page.locator('#setDebug').click();
  await expect(page.locator('#ovDebug')).toBeVisible();
}

test('the password gate rejects a wrong word and accepts Larson', async ({ page }) => {
  await boot(page, '');
  expect(await page.evaluate(() => window.PixelPets.debug)).toBe(false);
  expect(await page.evaluate(() => window.PixelPets.giveItem('heal_snack', 1))).toBeUndefined();
  await page.locator('#settingsBtn').click();
  await page.locator('#setDebug').click();
  await expect(page.locator('#dbgGate')).toBeVisible();
  const unlock = await page.locator('#dbgUnlock').boundingBox();
  expect(unlock.height).toBeGreaterThanOrEqual(44);
  expect(unlock.width).toBeGreaterThanOrEqual(44);
  await page.locator('#dbgPass').fill('nope');
  await page.locator('#dbgUnlock').click();
  await expect(page.locator('#dbgMsg')).toHaveText('Wrong password.');
  expect(await page.evaluate(() => window.PixelPets.debug)).toBe(false);
  expect(await page.evaluate(() => localStorage.getItem('pixelpets.debug'))).toBe(null);
  await page.locator('#dbgPass').fill('Larson');
  await page.locator('#dbgUnlock').click();
  await expect(page.locator('#ovDebug')).toBeVisible();
  await expect(page.locator('#ovSettings')).toBeHidden();
  await expect(page.locator('#dbgTag')).toBeVisible();
  expect(await page.evaluate(() => window.PixelPets.debug)).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem('pixelpets.debug'))).toBe(null);      // debug lives for this tab session only
  expect(await page.evaluate(() => sessionStorage.getItem('pixelpets.debug'))).toBe('1');
  expect(await page.evaluate(() => window.PixelPets.giveItem('heal_snack', 2))).toBe(2);
  await page.locator('#dbgLock').click();
  await expect(page.locator('#ovDebug')).toBeHidden();
  await expect(page.locator('#dbgTag')).toBeHidden();
  expect(await page.evaluate(() => window.PixelPets.debug)).toBe(false);
  expect(await page.evaluate(() => window.PixelPets.checkpoint('hall1'))).toBeUndefined();
  expect(await page.evaluate(() => localStorage.getItem('pixelpets.debug'))).toBe(null);
  expect(await page.evaluate(() => sessionStorage.getItem('pixelpets.debug'))).toBe(null);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')).debugSave)).toBe(true);   // the debug session marked the save
});

test('checkpoint, item, faction and standing work from the panel', async ({ page }) => {
  await boot(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets.debug === true && typeof window.PixelPets.checkpoint === 'function');
  await openDebugPanel(page);
  const go = await page.locator('#dbgGoCheckpoint').boundingBox();
  expect(go.height).toBeGreaterThanOrEqual(44);
  const fits = await page.evaluate(() => {
    const el = document.querySelector('#ovDebug .dbg-inner');
    return el.scrollWidth <= el.clientWidth + 1;
  });
  expect(fits).toBe(true);
  if (page.viewportSize().width === 390) await shot(page, 'debug-panel');
  await page.locator('#dbgCheckpoint').selectOption('hall1');
  await page.locator('#dbgGoCheckpoint').click();
  await expect(page.locator('#ovDebug')).toBeHidden();
  const landed = await page.evaluate(() => {
    const s = window.PixelPets.state;
    return {
      quest: window.PixelPets.quest && window.PixelPets.quest.id,
      map: s.world.map,
      seal: s.flags['story.seal1'] || null,
      orchard: s.flags['story.orchard_cleared'] || null,
      picked: s.flags['story.side_pick_done'] || null,
      intro: s.flags['story.intro_seen'] || null,
      pets: s.party.length,
    };
  });
  expect(landed.quest).toBe('hall1');
  expect(landed.map).toBe('fernbrook');
  expect(landed.seal).toBe(null);
  expect(landed.orchard).toBe(true);
  expect(landed.picked).toBe(true);
  expect(landed.intro).toBe(true);
  expect(landed.pets).toBeGreaterThan(0);

  await page.locator('#dbgTag').click();
  await expect(page.locator('#ovDebug')).toBeVisible();
  await page.locator('#dbgItem').selectOption('heal_snack');
  await page.locator('#dbgItemN').fill('3');
  await page.locator('#dbgGiveItem').click();
  expect(await page.evaluate(() => window.PixelPets.state.bag.heal_snack)).toBe(3);

  await page.locator('#dbgSideGlimmer').click();
  expect(await page.evaluate(() => window.PixelPets.side)).toBe('glimmer');
  expect(await page.evaluate(() => window.PixelPets.state.flags['story.side_pick_done'])).toBe(true);

  await page.locator('#dbgKeepersPts').fill('40');
  await page.locator('#dbgSetKeepers').click();
  const standing = await page.evaluate(() => {
    const cfg = window.PixelPets.standingCfg();
    const pts = 40;
    const tier = cfg.thresholds.filter(t => pts >= t).length - 1;
    return { now: window.PixelPets.standing.keepers, tier, name: cfg.sides.keepers.tiers[tier].name };
  });
  expect(standing.now.points).toBe(40);
  expect(standing.now.tier).toBe(standing.tier);
  expect(standing.now.name).toBe(standing.name);
});

test('encounter preview stats match the battle that starts', async ({ page }) => {
  await boot(page, '?debug=1');
  await page.waitForFunction(() => typeof window.PixelPets.encounterPreview === 'function');
  await openDebugPanel(page);
  await page.locator('#dbgSpecies').selectOption('stone');
  await page.locator('#dbgStage').selectOption('0');
  await page.locator('#dbgLevel').fill('8');
  await page.locator('#dbgHp').selectOption('0.5');
  const preview = await page.evaluate(() => window.PixelPets.encounterPreview('stone', 8, 0, 0.5));
  await expect(page.locator('#dbgEncStats')).toContainText('HP ' + preview.hp + '/' + preview.maxHp);
  await expect(page.locator('#dbgEncStats')).toContainText('ATK ' + preview.atk);
  await expect(page.locator('#dbgEncStats')).toContainText('STONE');
  await page.locator('#dbgSpawnEnc').click();
  await page.waitForFunction(() => {
    const b = window.PixelPets.battle;
    return b && b.on && b.state === 'CHOOSE';
  }, null, { timeout: 15000 });
  const foe = await page.evaluate(() => window.PixelPets.debugSnapshot().battle.foe);
  expect(foe.form).toBe('stone/0');
  expect(foe.level).toBe(8);
  expect(foe.type).toBe('STONE');
  expect(foe.hp).toBe(preview.hp);
  expect(foe.maxHp).toBe(preview.maxHp);
  expect(foe.atk).toBe(preview.atk);
  expect(foe.def).toBe(preview.def);
  expect(foe.spd).toBe(preview.spd);
});

test('catalog, side checkpoint, kit and dev checks are there for later work', async ({ page }) => {
  await boot(page, '?debug=1');
  await page.waitForFunction(() => typeof window.PixelPets.debugCatalog === 'function');
  const catalog = await page.evaluate(() => window.PixelPets.debugCatalog());
  const ids = catalog.checkpoints.map(c => c.id);
  expect(ids).toContain('hall1');
  expect(ids).toContain('mom');
  expect(ids).toContain('hc_plaza');
  expect(catalog.items.map(i => i.id)).toContain('heal_snack');
  expect(catalog.species.map(s => s.id)).toContain('ember');
  expect(catalog.factions).toEqual(['keepers', 'glimmer']);

  const mom = await page.evaluate(() => window.PixelPets.checkpoint('mom'));
  expect(mom.ok).toBe(true);
  expect(mom.chain).toBe('side');
  expect(mom.sideQuest).toBe('mom');
  expect(mom.map).toBe('hm_home_up');
  expect(mom.quest).toBe('rival1');

  const kit = await page.evaluate(() => {
    const r = window.PixelPets.fillKit();
    const lv = window.PixelPets.setLevel(12);
    return { money: r.money, snack: r.bag.heal_snack, level: lv.level };
  });
  expect(kit.money).toBeGreaterThanOrEqual(999);
  expect(kit.snack).toBe(20);
  expect(kit.level).toBe(12);

  const checks = await page.evaluate(() => window.PixelPets.devChecks());
  for (const list of Object.values(checks)) expect(list).toEqual([]);
  const snap = await page.evaluate(() => window.PixelPets.debugSnapshot());
  expect(snap.map).toBe('hm_home_up');
  expect(snap.partner).toBeTruthy();
  expect(snap.debug).toBe(true);
});
