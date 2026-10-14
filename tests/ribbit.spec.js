/* Ribbit, the read-only phone feed. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, playScene, shot } = require('./helpers');

trackErrors(test, expect);

function readySave(extra) {
  const save = starterSave();
  Object.assign(save.flags, {
    'story.reached_route1': true,
    'story.starter_received': true,
  }, extra || {});
  save.world = { map: 'hearthmoor', x: 8, y: 9, facing: 'down', respawn: 'hearthmoor' };
  return save;
}

async function boot(page, save) {
  await installSave(page.context(), save || readySave(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets.debug === true && window.PPRibbit && typeof window.PPRibbit.feed === 'function');
}

test('feed is stable, and the quarry sale has its own line', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(() => {
    const base = {
      flags: { 'story.phone_got': true },
      side: 'keepers',
      map: 'hearthmoor',
      uid: 'ribbit-uid',
      day: '2026-10-14',
    };
    const a = PPRibbit.feed(base);
    const b = PPRibbit.feed(JSON.parse(JSON.stringify(base)));
    const bought = PPRibbit.feed({
      flags: { 'story.phone_got': true, 'story.quarry_bought': true },
      side: 'keepers',
      map: 'hearthmoor',
      uid: 'ribbit-uid',
      day: '2026-10-14',
    });
    return {
      idsA: a.posts.map((p) => p.id),
      idsB: b.posts.map((p) => p.id),
      bought: bought.posts.map((p) => p.text),
      plain: a.posts.map((p) => p.text),
      check: PPRibbit.devCheck(),
      trend: a.trending.length,
    };
  });
  expect(out.check, out.check.join('\n')).toEqual([]);
  expect(out.idsA).toEqual(out.idsB);
  expect(out.idsA.length).toBeGreaterThan(1);
  expect(out.trend).toBe(3);
  const mentions = out.bought.filter((t) => /quarry|seam/i.test(t));
  expect(mentions.length).toBeGreaterThan(0);
  const sold = mentions.filter((t) => /sold/i.test(t));
  expect(sold.length).toBeGreaterThan(0);
  for (const line of sold) expect(out.plain).not.toContain(line);
});

test('RIBBIT shows Block News and Chirp Worldwide', async ({ page }) => {
  await boot(page);
  expect(await page.evaluate(() => PixelPets.runScene('phone_grant'))).toBe(true);
  await playScene(page, []);
  await page.locator('#phoneBtn').click();
  await page.locator('.phone-app[data-app="ribbit"]').click();
  const body = page.locator('#phoneBody');
  await expect(body).toContainText('Block News');
  await expect(body).toContainText('Chirp Worldwide');
  await expect(body).toContainText('@blocknews');
  await expect(body).toContainText('@chirpworld');
  await expect(body.locator('.ribbit-trend')).toBeVisible();
  await expect(body.locator('.ribbit-post').first()).toBeVisible();
  const scroll = await page.evaluate(() => {
    const el = document.querySelector('#phoneBody');
    const cs = getComputedStyle(el);
    return { overflowY: cs.overflowY, taller: el.scrollHeight > el.clientHeight + 4 };
  });
  expect(scroll.overflowY).toBe('auto');
  expect(scroll.taller).toBe(true);
  await shot(page, 'ribbit-feed');
  await page.evaluate(() => document.querySelector('#ovPhone').classList.add('hack'));
  await shot(page, 'ribbit-feed-hack');
});
