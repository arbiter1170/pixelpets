/* NEWS (D1012 red, D1013 copy, D1014 Ribbit pool): the Block News paper on the phone, one edition per real day, led by
   the newest story beat; and the fuller Ribbit feed from data/ribbit_posts.json. Save stays v2; newsSeen is additive. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, shot } = require('./helpers');

trackErrors(test, expect);

function readySave(extra, mutate) {
  const s = starterSave();
  s.settings.tips = false;
  Object.assign(s.flags, { 'story.tutorial_done': true, 'story.phone_got': true, 'story.reached_route1': true }, extra || {});
  s.world = { map: 'hearthmoor', x: 8, y: 9, facing: 'down', respawn: 'hearthmoor' };
  if (mutate) mutate(s);
  return s;
}

async function boot(page, extra, mutate) {
  await installSave(page.context(), readySave(extra, mutate), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true && window.PPNews && window.PPRibbit);
  await page.evaluate(() => PixelPets.showTab('walk'));
}

async function openNews(page) {
  if (await page.locator('#ovPhone').isHidden()) await page.locator('#phoneBtn').click();
  else await page.locator('#phoneBack').click();
  await expect(page.locator('#phoneHome')).toBeVisible();
  await page.locator('.phone-app[data-app="news"]').click();
  await expect(page.locator('#phonePane')).toBeVisible();
}

const EARLY = { 'story.phone_got': true, 'story.reached_route1': true };
const LATER = /RegenX|went dark|was sold|Brinewick|High Charity|Mahopac|Route 3|Answerer/i;

test('the paper checks itself, holds still within a day, and turns over across days @w1', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(({ EARLY }) => {
    const base = { flags: EARLY, side: 'keepers', map: 'hearthmoor', uid: 'news-uid', day: '2026-11-02' };
    const a = PPNews.edition(base), b = PPNews.edition(JSON.parse(JSON.stringify(base)));
    const week = [];
    for (let d = 2; d <= 8; d++) week.push(PPNews.edition(Object.assign({}, base, { day: '2026-11-0' + d })).features.map(s => s.id).join());
    return {
      news: PPNews.devCheck(), ribbit: PPRibbit.devCheck(),
      same: JSON.stringify(a) === JSON.stringify(b),
      lead: !!a.lead, features: a.features.length, briefs: a.briefs.length,
      distinct: new Set(week).size,
      pool: MAPDATA.news.stories.length, posts: MAPDATA.ribbit_posts.posts.length,
      stamps: [MAPDATA.news.lore_version, MAPDATA.ribbit_posts.lore_version],
    };
  }, { EARLY });
  expect(out.news, out.news.join('\n')).toEqual([]);
  expect(out.ribbit, out.ribbit.join('\n')).toEqual([]);
  expect(out.same).toBe(true);
  expect(out.lead).toBe(true);
  expect(out.features).toBeGreaterThanOrEqual(3);
  expect(out.briefs).toBeGreaterThanOrEqual(1);
  expect(out.distinct).toBeGreaterThanOrEqual(4);
  expect(out.pool).toBeGreaterThanOrEqual(50);
  expect(out.posts).toBeGreaterThanOrEqual(80);
  expect(out.stamps[0]).toMatch(/^v\d/);
  expect(out.stamps[0]).toBe(out.stamps[1]);
});

test('story progress moves the lead, and nothing later leaks into an early paper or feed @w1', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(({ EARLY, LATER }) => {
    const re = new RegExp(LATER, 'i');
    const text = e => [e.lead].concat(e.features, e.briefs).filter(Boolean).map(s => s.headline + ' ' + s.body.join(' ')).join('\n');
    const leaks = [], feedLeaks = [];
    for (let d = 1; d <= 28; d++) {
      const day = '2026-02-' + String(d).padStart(2, '0');
      for (const map of ['hearthmoor', 'route1', 'hm_lantern_in']) {
        const e = PPNews.edition({ flags: EARLY, side: 'keepers', map, uid: 'u' + d, day });
        if (re.test(text(e))) leaks.push(day + ' ' + map + ': ' + text(e).match(re)[0]);
        const f = PPRibbit.feed({ flags: EARLY, side: 'keepers', map, uid: 'u' + d, day });
        for (const p of f.posts) if (re.test(p.text)) feedLeaks.push(p.id);
      }
    }
    const day = { side: 'keepers', map: 'hearthmoor', uid: 'lead', day: '2026-11-02' };
    const early = PPNews.edition(Object.assign({ flags: EARLY }, day)).lead;
    const mid = PPNews.edition(Object.assign({ flags: Object.assign({}, EARLY, { 'story.reached_fernbrook': true, 'story.seal1': true, 'story.reached_cobblecrest': true, 'story.cobble_arrived': true, 'story.quarry_bought': true }) }, day)).lead;
    return { leaks, feedLeaks, early: early && early.id, mid: mid && mid.id, midText: mid ? mid.headline + ' ' + mid.body.join(' ') : '' };
  }, { EARLY, LATER: LATER.source });
  expect(out.leaks).toEqual([]);
  expect(out.feedLeaks).toEqual([]);
  expect(out.mid).not.toBe(out.early);
  expect(out.midText).toMatch(/quarry|seam|Cobblecrest/i);
});

test('the chipping stays off every Keeper-side paper and feed @w1', async ({ page }) => {
  await boot(page);
  const hits = await page.evaluate(() => {
    const secret = /\b(chips?|chipped|chipping|tuning|implants?)\b/i;
    const all = {};
    const flags = {};
    for (const k of new Set(MAPDATA.news.stories.concat(MAPDATA.ribbit_posts.posts).flatMap(s => s.when || []).filter(w => w[0] !== '!' && w.indexOf('=') === -1))) flags[k] = true;
    const out = [];
    for (let d = 1; d <= 20; d++) {
      for (const map of ['hearthmoor', 'fernbrook', 'cobblecrest', 'highcharity', 'brinewick', 'route3', 'mahopac']) {
        const st = { flags, side: 'keepers', map, uid: 's' + d, day: '2026-03-' + String(d).padStart(2, '0') };
        const e = PPNews.edition(st);
        for (const s of [e.lead].concat(e.features, e.briefs).filter(Boolean)) if (secret.test(s.headline + ' ' + s.body.join(' '))) out.push(s.id);
        for (const p of PPRibbit.feed(st).posts) if (secret.test(p.text)) out.push(p.id);
      }
    }
    return out;
  });
  expect(hits).toEqual([]);
});

test('NEWS opens from the grid with a dot, reads as a paper, expands a story, and fits the phone', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await boot(page);
  await page.locator('#phoneBtn').click();
  const apps = await page.locator('#phoneHome .phone-app').evaluateAll(els => els.map(el => el.dataset.app));
  expect(apps).toHaveLength(10);
  expect(apps.indexOf('news')).toBe(apps.indexOf('ribbit') - 1);
  expect(apps.slice(-2)).toEqual(['sky', 'glow']);
  await expect(page.locator('#phoneNews')).toHaveClass(/unread/);
  const painted = await page.evaluate(() => document.querySelector('#phoneNews canvas').getContext('2d').getImageData(0, 0, 8, 8).data.some((v, i) => i % 4 === 3 && v > 0));
  expect(painted).toBe(true);
  await shot(page, 'news-home');
  await page.locator('.phone-app[data-app="news"]').click();
  const body = page.locator('#phoneBody');
  await expect(body.locator('.news-name')).toHaveText('BLOCK NEWS');
  await expect(body.locator('.news-date')).toHaveText(/^(Sun|Mon|Tues|Wednes|Thurs|Fri|Satur)day, [A-Z][a-z]{2} \d{1,2}\. Today's edition\.$/);
  await expect(body.locator('.news-lead .news-body')).toBeVisible();
  const first = body.locator('.news-story:not(.news-lead)').first();
  await expect(first.locator('.news-body')).toBeHidden();
  await first.locator('.news-head').click();
  await expect(first.locator('.news-body')).toBeVisible();
  await expect(first.locator('.news-head')).toHaveAttribute('aria-expanded', 'true');
  await expect(body.locator('.news-foot')).toHaveText(/^Block News rides the Keeper wires\./);
  const fit = await page.evaluate(() => {
    const el = document.querySelector('#phoneBody');
    const heads = [...el.querySelectorAll('.news-head')];
    return {
      x: el.scrollWidth <= el.clientWidth + 1,
      small: heads.filter(b => { const r = b.getBoundingClientRect(); return r.height < 44 || r.width < 44; }).length,
      heads: heads.length,
      overflowY: getComputedStyle(el).overflowY,
    };
  });
  expect(fit.x).toBe(true);
  expect(fit.small).toBe(0);
  expect(fit.heads).toBeGreaterThanOrEqual(5);
  expect(fit.overflowY).toBe('auto');
  await shot(page, 'news-paper');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  expect(saved.v).toBe(2);
  expect(saved.newsSeen).toMatch(/^\d{4}-\d{2}-\d{2}:[a-z0-9_-]+$/);
  await page.locator('#phoneBack').click();
  await expect(page.locator('#phoneNews')).not.toHaveClass(/unread/);
});

test('a new lead brings the dot back; the cracked handset reads the same paper in its own voice @w1', async ({ page }) => {
  await boot(page);
  await openNews(page);
  await page.locator('#phoneClose').click();
  await page.evaluate(() => { PixelPets.setFlag('story.reached_fernbrook', true); PixelPets.setFlag('story.seal1', true); PixelPets.setFlag('story.reached_cobblecrest', true); PixelPets.setFlag('story.cobble_arrived', true); PixelPets.setFlag('story.quarry_bought', true); });
  await page.locator('#phoneBtn').click();
  await expect(page.locator('#phoneNews')).toHaveClass(/unread/);
  await page.locator('#phoneClose').click();
  await page.evaluate(() => { PixelPets.giveItem('cracked_phone', 1); PixelPets.setSide('glimmer'); PixelPets.showTab('walk'); });
  await openNews(page);
  await expect(page.locator('#ovPhone')).toHaveClass(/hack/);
  await expect(page.locator('.news-date')).toHaveText(/\. Copy lifted off the wires\.$/);
  await expect(page.locator('.news-lead')).toBeVisible();
  await shot(page, 'news-paper-hack');
});

test('one bar of signal thins the briefs @w1', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.goto('route2_glen'));
  await page.waitForFunction(() => PixelPets.mapInfo.id === 'route2_glen' && !PixelPets.fading);
  await openNews(page);
  await expect(page.locator('.news-foot')).toHaveText("Block News rides the Keeper wires. One bar: today's paper is thin here.");
  const briefs = await page.evaluate(() => {
    const labs = [...document.querySelectorAll('#phoneBody .phone-sec')];
    const at = labs.findIndex(l => l.textContent === 'BRIEFS');
    if (at === -1) return 0;
    let n = 0, el = labs[at].nextElementSibling;
    while (el && el.classList.contains('news-story')) { n++; el = el.nextElementSibling; }
    return n;
  });
  expect(briefs).toBeLessThanOrEqual(1);
});

test('old saves load: no newsSeen is fine, junk newsSeen is dropped, v stays 2 @w1', async ({ page }) => {
  await boot(page, null, s => { s.newsSeen = { bad: true }; });
  const st = await page.evaluate(() => ({ v: PixelPets.state.v, seen: PixelPets.state.newsSeen }));
  expect(st).toEqual({ v: 2, seen: undefined });
  await openNews(page);
  const after = await page.evaluate(() => PixelPets.state.newsSeen);
  expect(typeof after).toBe('string');
});
