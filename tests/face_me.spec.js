/* FACE_ME (Vincent, Nov 3, 2026): Lizzy's reunion can start from Buddy, with Lizzy a few tiles off or facing away. Before
   the first line she walks back beside the holder and the two face each other. Reduced motion snaps the walk. Save v2. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, playScene } = require('./helpers');

trackErrors(test, expect);

function save() {
  const s = starterSave();
  s.flags['story.early_done'] = true;
  s.flags['story.intro_seen'] = true;
  s.world = { map: 'hearthmoor', x: 11, y: 20, facing: 'left', respawn: 'hearthmoor' };   // Buddy (10,20) beside, Lizzy (9,20) two off
  return s;
}
const opposite = { up: 'down', down: 'up', left: 'right', right: 'left' };

async function check(page) {
  await installSave(page.context(), save(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && typeof PixelPets.objPos === 'function');
  await page.evaluate(() => PixelPets.showTab('walk'));
  expect(await page.evaluate(() => PixelPets.talkTo('hm_buddy'))).toBe(true);
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.id === 'lizzy_intro' && PixelPets.scene.mode === 'say' && PixelPets.scene.full);
  const st = await page.evaluate(() => { const liz = PixelPets.objPos('hm_lizzy'); return { liz, face: liz.facing, w: PixelPets.state.world }; });
  const dx = st.w.x - st.liz.x, dy = st.w.y - st.liz.y;
  expect(Math.abs(dx) + Math.abs(dy), JSON.stringify(st)).toBe(1);   // beside the holder
  const toHolder = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';
  expect(st.face).toBe(toHolder);                                     // Lizzy faces the holder
  expect(st.w.facing).toBe(opposite[toHolder]);                       // and the holder faces her
  await playScene(page, ['Hug Buddy', 'Is Rook okay?']);
  expect(await page.evaluate(() => PixelPets.state.flags['story.lizzy_met'])).toBe(true);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')).v)).toBe(2);
}

test('talking to Buddy: Lizzy walks back beside the holder and faces them before the first line', async ({ page }) => { await check(page); });

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('the walk back snaps with reduced motion; she still ends beside the holder, facing them', async ({ page }) => { await check(page); });
});
