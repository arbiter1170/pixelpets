/* D798. Plaza side quests stay off the main chain: a lap, the plaza sign, and lantern night. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, playScene } = require('./helpers');

trackErrors(test, expect);

async function boot(page, flags) {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.textSpeed = 'fast';
  Object.assign(s.flags, flags || {});
  s.world = { map: 'hm_plaza', x: 21, y: 8, facing: 'up', respawn: 'hearthmoor' };
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
}

async function talk(page, id, choices) {
  expect(await page.evaluate((oid) => PixelPets.talkTo(oid), id), id).toBe(true);
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
  await playScene(page, choices || []);
}

test('the plaza lap, the sign, and lantern night leave the main quest where it was @w1', async ({ page }) => {
  test.setTimeout(120000);
  await boot(page);
  const main = await page.evaluate(() => PixelPets.quest.id);
  expect(main).not.toBe('plaza_ask');
  expect(await page.evaluate(() => PixelPets.sideActive.map((a) => a.chain))).toContain('plaza_ask');

  await talk(page, 'hmp_watch', ['Not right now']);
  expect(await page.evaluate(() => !!PixelPets.state.flags['story.plaza_yes'])).toBe(false);
  expect(await page.evaluate(() => PixelPets.sideActive.some((a) => a.id === 'plaza_ask'))).toBe(true);

  await talk(page, 'hmp_watch', ["I'll walk it"]);
  await talk(page, 'hmp_lamplighter');
  await talk(page, 'hmp_cadet');
  await talk(page, 'hmp_kid');
  await talk(page, 'hmp_watch');
  expect(await page.evaluate(() => PixelPets.state.flags['story.plaza_done'])).toBe(true);
  expect(await page.evaluate(() => PixelPets.quest.id)).toBe(main);

  await talk(page, 'hmp_watch', ["I'll read it"]);
  await talk(page, 'hmp_sign');
  await talk(page, 'hmp_watch');
  expect(await page.evaluate(() => PixelPets.state.flags['story.plaza_sign_done'])).toBe(true);
  expect(await page.evaluate(() => PixelPets.quest.id)).toBe(main);

  const beforeSnack = await page.evaluate(() => (PixelPets.state.bag && PixelPets.state.bag.heal_snack) || 0);
  await page.evaluate(() => PixelPets.setFlag('story.cobble_end', true));
  expect(await page.evaluate(() => PixelPets.sideActive.some((a) => a.chain === 'lantern_ask'))).toBe(true);
  await talk(page, 'hmp_watch', ["I'll stay"]);
  await talk(page, 'hmp_lamplighter');
  await talk(page, 'hmp_kid');
  const end = await page.evaluate(() => ({
    done: !!PixelPets.state.flags['story.lantern_done'],
    snack: (PixelPets.state.bag && PixelPets.state.bag.heal_snack) || 0,
    quest: PixelPets.quest.id,
    v: PixelPets.state.v,
    check: PixelPets.questCheck,
  }));
  expect(end.done).toBe(true);
  expect(end.snack).toBe(beforeSnack + 1);
  expect(end.quest).toBe('hc_council');
  expect(end.v).toBe(2);
  expect(end.check).toEqual([]);
});

test('Tansy names Rook before his gate battle, and Nella names the three baskets @w1', async ({ page }) => {
  await boot(page, { 'story.plaza_yes': true, 'story.plaza_done': true, 'story.plaza_sign_done': true });
  const line = async (id) => {
    const text = await page.evaluate((oid) => { PixelPets.talkTo(oid); return PixelPets.scene.text; }, id);
    await playScene(page, []);
    return text;
  };
  expect(await line('hmp_kid')).toBe('Rook bounced through at dawn. East gate.');
  expect(await line('hmp_weaver')).toBe("Ember, tide, and bloom. Ilse's three.");
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});
