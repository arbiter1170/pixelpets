/* Mahopac dream, seventh birthday (side step dream_party): the yellow balloon must read on the warm yellow party floor
   and pop on a Modern tap. It used to be drawn in the floor's own colour with no rim, so only the quest arrow showed. */
const path = require('path');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, playScene, artifactsDir } = require('./helpers');

trackErrors(test, expect);

async function bootAtParty(page) {
  const s = starterSave();
  s.settings.follower = true;
  s.settings.controls = 'modern';
  Object.assign(s.flags, {
    'story.mom_met': true, 'story.mom_chore': true, 'story.mom_sent': true, 'story.reached_mahopac': true,
    'story.dream_started': true, 'story.dream_toy': true, 'story.phone_got': true, 'story.unlock_phone': true,
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
  // Where dream_to_party lands the keeper: (5,6), facing the yellow balloon at (5,5).
  await page.evaluate(() => PixelPets.goto('dream_party', 5, 6, 'up'));
  await page.waitForTimeout(400);
}

// Canvas pixels of tile (x,y) that differ from tile (tx,ty). (3,5) and (5,5) are both a streamer cell on the same floor,
// so only what is drawn on top of (5,5) differs. Rows 0-11 only: the follower's head can reach the bottom rows.
const tileDiff = (page, a, b) => page.evaluate(([a, b]) => {
  const c = document.querySelector('#mapCanvas'), g = c.getContext('2d'), cam = PixelPets.walk.cam, TS = 16;
  const grab = ([x, y]) => g.getImageData(Math.round(x * TS - cam.x), Math.round(y * TS - cam.y), TS, 12).data;
  const p = grab(a), q = grab(b); let n = 0;
  for (let i = 0; i < p.length; i += 4) if (Math.abs(p[i] - q[i]) + Math.abs(p[i + 1] - q[i + 1]) + Math.abs(p[i + 2] - q[i + 2]) > 30) n++;
  return n;
}, [a, b]);

test('the yellow birthday balloon is drawn and pops on a tap', async ({ page }, info) => {
  test.setTimeout(60000);
  await bootAtParty(page);
  const before = await page.evaluate(() => ({
    map: PixelPets.mapInfo.id,
    quest: PixelPets.quest.id,
    side: PixelPets.sideQuest && PixelPets.sideQuest.id,
    point: PixelPets.sideQuest && PixelPets.sideQuest.point,
    prop: (PixelPets.exteriors('dream_party').props || []).find((o) => o.id === 'balloon_yellow'),
    twin: PixelPets.tileInfo(3, 5), cell: PixelPets.tileInfo(5, 5),
    v: PixelPets.state.v,
  }));
  expect(before.map).toBe('dream_party');
  expect(before.side).toBe('dream_party');
  expect(before.point).toMatchObject({ x: 5, y: 5, here: true });
  expect(before.prop).toMatchObject({ x: 5, y: 5, sprite: 'balloon_y', art: [16, 16] });
  expect(before.cell).toMatchObject({ tile: before.twin.tile, decal: before.twin.decal });
  expect(before.v).toBe(2);

  // Drawn, not blank: the balloon rim and body change most of its tile against the twin cell (a bare string and
  // highlight, the old look, changed about 15 pixels).
  const drawn = await tileDiff(page, [5, 5], [3, 5]);
  expect(drawn).toBeGreaterThan(40);
  if (info.project.name === '390') await page.screenshot({ path: path.join(artifactsDir('balloon'), 'flashback_balloon_drawn_390.png') });

  const p = await page.evaluate(() => {
    const o = PixelPets.mapInfo.objs.find((x) => x.id === 'balloon_yellow');
    const c = document.querySelector('#mapCanvas'), r = c.getBoundingClientRect(), k = r.width / c.width, cam = PixelPets.walk.cam, TS = 16;
    return { x: r.left + ((o.x + 0.5) * TS - cam.x) * k, y: r.top + ((o.y + 0.5) * TS - cam.y) * k };
  });
  await page.touchscreen.tap(p.x, p.y);
  await page.waitForFunction(() => PixelPets.scene && String(PixelPets.scene.text).indexOf('Yellow bits') >= 0);
  await playScene(page);
  const after = await page.evaluate(() => ({
    yellow: PixelPets.state.flags['story.dream_yellow'],
    left: PixelPets.mapInfo.objs.filter((o) => String(o.id).startsWith('balloon_')).map((o) => o.id).sort(),
    map: PixelPets.mapInfo.id,
    quest: PixelPets.quest.id,
    check: PixelPets.questCheck,
    v: PixelPets.state.v,
  }));
  expect(after.yellow).toBe(true);
  expect(after.left).toEqual(['balloon_blue', 'balloon_red']);
  expect(after.map).toBe('dream_party');
  expect(after.quest).toBe(before.quest);
  expect(after.check).toEqual([]);
  expect(after.v).toBe(2);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  expect(saved.v).toBe(2);
  expect(saved.flags['story.dream_yellow']).toBe(true);
});
