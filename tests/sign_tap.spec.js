/* Signs open from TALK (or a tap), not from walking into the tile. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

test('walking into a sign does not open it; TALK does', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
  const bumped = await page.evaluate(() => {
    PixelPets.goto('hearthmoor', 8, 8, 'down');
    const sign = (PixelPets.mapObjs || []).find((o) => o && o.kind === 'sign');
    if (!sign) return { error: 'no sign', n: (PixelPets.mapObjs || []).length };
    const spots = [
      { x: sign.x, y: sign.y + 1, dir: 'up' },
      { x: sign.x, y: sign.y - 1, dir: 'down' },
      { x: sign.x + 1, y: sign.y, dir: 'left' },
      { x: sign.x - 1, y: sign.y, dir: 'right' },
    ];
    for (const spot of spots) {
      const at = PixelPets.goto('hearthmoor', spot.x, spot.y, spot.dir);
      if (!at || at.map !== 'hearthmoor' || at.x !== spot.x || at.y !== spot.y) continue;
      const step = PixelPets.walkStep(spot.dir);
      if (step.scene) return { error: 'opened on walk', id: sign.id, step };
      if (step.x === spot.x && step.y === spot.y && step.facing === spot.dir) {
        return { ok: true, id: sign.id, x: step.x, y: step.y };
      }
    }
    return { error: 'no spot', id: sign.id, x: sign.x, y: sign.y };
  });
  expect(bumped.ok, JSON.stringify(bumped)).toBe(true);
  await expect(page.locator('#ovScene')).toBeHidden();
  const talk = page.locator('#talkBtn');
  await expect(talk).toBeVisible();
  const talkBox = await talk.boundingBox();
  expect(talkBox.height).toBeGreaterThanOrEqual(44);
  expect(talkBox.width).toBeGreaterThanOrEqual(44);
  await talk.click();
  await page.waitForFunction(() => window.PixelPets.scene && window.PixelPets.scene.full);
  await expect(page.locator('#ovScene')).toBeVisible();
  const line = await page.evaluate(() => window.PixelPets.scene.text || '');
  expect(line.length).toBeGreaterThan(0);
  await expect(page.locator('#sbText')).toContainText(line.slice(0, 12));
  const sv = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  expect(sv.v).toBe(2);
});
