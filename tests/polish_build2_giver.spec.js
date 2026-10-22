/* POLISH_BUILD2 P2 (D438). Mom offers to track her quest, and names what that would replace. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, playScene } = require('./helpers');

trackErrors(test, expect);

const PHONE = 'You\'re tracking "Explore Route 1". Track "Mom\'s trip" instead?';
const NONE = 'Track "Mom\'s trip"?';
const MAIN = 'You\'re tracking the main story. Track "Mom\'s trip" instead?';

function save(flags, tracked) {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.textSpeed = 'fast';
  Object.assign(s.flags, {
    'story.mom_met': true,
    'story.leak5b_seen': true,
  }, flags || {});
  s.ui = { sideTracked: tracked, sideSeen: ['phone', 'mom', 'leak_ask'] };
  s.world = { map: 'hm_home_up', x: 5, y: 4, facing: 'up', respawn: 'hearthmoor' };
  return s;
}

async function boot(page, s) {
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.evaluate(() => {
    PixelPets.showTab('walk');
    PixelPets.goto('hm_home_up', 5, 4, 'up');
  });
}

async function talk(page) {
  const ok = await page.evaluate(() => PixelPets.talkTo('mom'));
  expect(ok).toBe(true);
}

test('Mom names the tracked phone quest, and Track it saves mom', async ({ page }) => {
  await boot(page, save({}, 'phone'));
  await talk(page);
  const prompts = await playScene(page, ['Track it']);
  expect(prompts).toEqual([PHONE]);
  const boxes = await page.locator('#sbChoices button').count();
  expect(boxes).toBe(0);
  const st = await page.evaluate(() => {
    const row = JSON.parse(localStorage.getItem('pixelpets.save.v2'));
    return { t: row.ui.sideTracked, v: row.v, id: PixelPets.sideQuest.id };
  });
  expect(st.t).toBe('mom');
  expect(st.v).toBe(2);
  expect(st.id).toBe('mom_chore');
});

test('Not now keeps the phone, and the offer comes back', async ({ page }) => {
  await boot(page, save({}, 'phone'));
  await talk(page);
  const first = await playScene(page, ['Not now'], async () => {
    const buttons = page.locator('#sbChoices button');
    expect(await buttons.count()).toBe(2);
    for (const b of await buttons.all()) {
      const box = await b.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });
  expect(first).toEqual([PHONE]);
  expect(await page.evaluate(() => PixelPets.state.ui.sideTracked)).toBe('phone');
  await page.waitForFunction(() => !PixelPets.scene);
  await talk(page);
  expect(await playScene(page, ['Not now'])).toEqual([PHONE]);
  expect(await page.evaluate(() => PixelPets.state.ui.sideTracked)).toBe('phone');
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});

test('nothing tracked asks the short line, and the main story is named', async ({ page }) => {
  await boot(page, save({}, 'none'));
  await talk(page);
  expect(await playScene(page, ['Track it'])).toEqual([NONE]);
  expect(await page.evaluate(() => PixelPets.state.ui.sideTracked)).toBe('mom');
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);

  await boot(page, save({}, 'main'));
  await talk(page);
  expect(await playScene(page, ['Track it'])).toEqual([MAIN]);
  expect(await page.evaluate(() => PixelPets.state.ui.sideTracked)).toBe('mom');
});

test('Mom offers nothing when she is the only quest or already tracked', async ({ page }) => {
  await boot(page, save({ 'story.phone_got': true, 'story.leak5b_seen': false }, 'mom'));
  await talk(page);
  expect(await playScene(page, [])).toEqual([]);
  expect(await page.evaluate(() => PixelPets.state.ui.sideTracked)).toBe('mom');

  await boot(page, save({}, 'mom'));
  await talk(page);
  expect(await playScene(page, [])).toEqual([]);
  expect(await page.evaluate(() => PixelPets.state.ui.sideTracked)).toBe('mom');
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});
