/* Q19: the Lantern Council in Sky-Dock Command, after Cobblecrest, Keepers only. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

function ready(flags) {
  const save = starterSave();
  Object.assign(save.flags, {
    'story.side_pick_done': true,
    'story.side': 'keepers',
    'story.cobble_end': true,
    'story.seal1': true,
    'story.heights_done': true,
  }, flags || {});
  save.standing = { keepers: 20, glimmer: 0 };
  return save;
}

async function boot(page, save) {
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true && window.PixelPets.standing);
}

async function readScene(page) {
  const lines = [];
  for (let i = 0; i < 30; i++) {
    const sc = await page.evaluate(() => {
      const s = window.PixelPets.scene;
      return s && { mode: s.mode, waiting: s.waiting, text: s.text };
    });
    if (!sc) return lines;
    if (sc.mode === 'say' && sc.waiting) {
      lines.push(sc.text);
      await page.keyboard.press('Space');
      await page.waitForTimeout(30);
      continue;
    }
    await page.waitForTimeout(30);
  }
  throw new Error('scene did not end: ' + lines.join(' | '));
}

test('a Keepers save at the end of Act 1 is pointed at Sky-Dock Command', async ({ page }) => {
  await boot(page, ready());
  const q = await page.evaluate(() => {
    const pets = PixelPets.state.party.length;
    const side = PPQuests.sideCurrent({ flags: PixelPets.state.flags, seals: PixelPets.state.seals, pets });
    PixelPets.setFlag('story.phone_got', true);
    PixelPets.setFlag('story.mom_met', true);
    PixelPets.setFlag('story.mom_chore', true);
    PixelPets.setFlag('story.mom_sent', true);
    const side2 = PPQuests.sideCurrent({ flags: PixelPets.state.flags, seals: PixelPets.state.seals, pets });
    return {
      id: PixelPets.quest.id,
      text: PixelPets.quest.text,
      place: PixelPets.quest.place,
      map: PixelPets.quest.target && PixelPets.quest.target.map,
      check: PixelPets.questCheck,
      side: side2 && side2.id,
      main: PixelPets.quest.id,
      v: PixelPets.state.v,
      mom: side && side.id,
    };
  });
  expect(q.check).toEqual([]);
  expect(q.id).toBe('hc_council');
  expect(q.text).toBe('High Charity called a Lantern Council. Bring both Seals to Sky-Dock Command.');
  expect(q.place).toBe('High Charity, sky-dock');
  expect(q.map).toBe('hc_command_in');
  expect(q.text.length).toBeLessThanOrEqual(110);
  expect(q.place.length).toBeLessThanOrEqual(24);
  expect(q.side).toBe('mahopac');
  expect(q.main).toBe('hc_council');
  expect(q.v).toBe(2);
  expect(q.mom).toBe('phone');
});

test('Glimmerwell does not get the council row, and the games pointer waits', async ({ page }) => {
  await boot(page, ready({ 'story.side': 'glimmer' }));
  const glim = await page.evaluate(() => PixelPets.quest.id);
  expect(glim).toBe('end');
  await boot(page, ready({ 'story.hc_invite': true }));
  const waiting = await page.evaluate(() => PixelPets.quest.id);
  expect(waiting).toBe('hc_council');
  await boot(page, ready({ 'story.hc_invite': true, 'story.hc_council_done': true }));
  const games = await page.evaluate(() => PixelPets.quest.id);
  expect(games).toBe('hc_games');
});

test('the council names both Seals, grants once, and the road stays closed', async ({ page }) => {
  await boot(page, ready({ 'story.hc_invite': true }));
  const before = await page.evaluate(() => ({
    line: PixelPets.npcLine('hc_lumen'),
    points: PixelPets.standing.keepers.points,
    grant: PixelPets.standingCfg().grants.hc_council_k,
    trig: PixelPets.goto('hc_command_in', 4, 5, 'up') && PixelPets.mapObjs.some((o) => o.id === 'hc_council_trig'),
  }));
  expect(before.line).toBe('@hc_council');
  expect(before.grant).toBe(10);
  expect(before.trig).toBe(true);
  const started = await page.evaluate(() => PixelPets.runScene('hc_council'));
  expect(started).toBe(true);
  const lines = await readScene(page);
  expect(lines.some((s) => /Fernbrook/.test(s) && /Cobblecrest/.test(s))).toBe(true);
  expect(lines.some((s) => /Ilse's letter/.test(s))).toBe(true);
  expect(lines.some((s) => /Brinewick/.test(s) && /not opening/.test(s))).toBe(true);
  expect(lines.some((s) => /stays dark/.test(s))).toBe(true);
  const after = await page.evaluate(() => ({
    flag: PixelPets.state.flags['story.hc_council_done'],
    got: PixelPets.state.flags['standing.got.hc_council_k'],
    points: PixelPets.standing.keepers.points,
    line: PixelPets.npcLine('hc_lumen'),
    board: PixelPets.npcLine('hc_console'),
    quest: PixelPets.quest.id,
    v: PixelPets.state.v,
    trig: (() => { PixelPets.goto('hc_command_in', 2, 4, 'up'); return PixelPets.mapObjs.some((o) => o.id === 'hc_council_trig'); })(),
  }));
  expect(after.flag).toBe(true);
  expect(after.got).toBe(true);
  expect(after.points).toBe(before.points + 10);
  expect(after.line).toBe('That road stays dark. Ships still fly.');
  expect(after.board).toBe('Brinewick is marked. Its light is dark.');
  expect(after.quest).toBe('hc_games');
  expect(after.v).toBe(2);
  expect(after.trig).toBe(false);
  const again = await page.evaluate(() => PixelPets.runScene('hc_council'));
  expect(again).toBe(true);
  await readScene(page);
  const points = await page.evaluate(() => PixelPets.standing.keepers.points);
  expect(points).toBe(before.points + 10);
});
