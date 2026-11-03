/* The Glimmer-side NEWS paper leans dark (Vincent, Nov 1, 2026; design NEWS_FEED "The Glimmer-side paper").
   On the Glimmer side the cracked handset's paper weights its dark wire items (Glimmer-only, not Bright Notice) up and
   the friendly Lantern Post down; INSIGN and the facility visits stay hints behind story.seal2. The Keeper-side paper
   must not change at all: its editions are compared with news.js and data/mapdata.js from the merge base with
   origin/main (never HEAD). */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, artifactsDir } = require('./helpers');

trackErrors(test, expect);

const ROOT = path.resolve(__dirname, '..');
const LATE = ['story.phone_got', 'story.reached_route1', 'story.reached_route2', 'story.reached_fernbrook', 'story.met_glimmerwell',
  'story.met_census', 'story.met_lead', 'story.side_pick_done', 'story.seal1', 'story.tour1_s1', 'story.reached_cobblecrest',
  'story.cobble_arrived', 'story.quarry_bought', 'story.seal2', 'story.rc_done', 'story.reached_route3', 'story.ans_open',
  'story.reached_glen', 'story.glen_cleared', 'story.know_us', 'story.heights_done', 'story.rx_enter', 'story.rx_done',
  'story.saw_arbiter', 'story.rx_bitlet', 'story.sm_done', 'story.brine_arrived', 'story.reached_brinewick'];
const ME = { holder: 'Wayfarer', partner: 'Pipkit', partnerSpecies: 'ember', partnerStage: 0, seals: 2, steps: 900, acorns: 30, seen: ['ember/0'] };
// Words that only the dark Glimmer-side batch uses; none may reach a Keeper-side paper.
const HINTS = /\bINS\.\.\.|'IN'|dosage|facility|medicine first|still made medicine|Transferred north|turns its head toward nothing/i;

function loadNews(newsSrc, mapSrc) {
  const ctx = { console };
  ctx.globalThis = ctx; ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(mapSrc + ';globalThis.MAPDATA=MAPDATA;', ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'ribbit.js'), 'utf8'), ctx);
  vm.runInContext(newsSrc, ctx);
  return ctx;
}
function current() {
  return loadNews(fs.readFileSync(path.join(ROOT, 'news.js'), 'utf8'), fs.readFileSync(path.join(ROOT, 'data', 'mapdata.js'), 'utf8'));
}
function baseline() {
  const git = (args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 });
  const mergeBase = git(['merge-base', 'HEAD', 'origin/main']).trim();
  return loadNews(git(['show', mergeBase + ':news.js']), git(['show', mergeBase + ':data/mapdata.js']));
}
function stateFor(side, d, map) {
  const flags = {};
  LATE.forEach((f) => { flags[f] = true; });
  if (side === 'glimmer') flags['story.side'] = 'glimmer';
  return { flags, side, map, uid: 'dark-' + d, day: '2026-12-' + String((d % 28) + 1).padStart(2, '0'), hh: d % 2 ? 9 : 15,
    phase: 'day', sky: 'clear', town: 'Cobblecrest', me: ME };
}
function isDark(x) {
  return (x.when || []).includes('story.side=glimmer') && x.desk !== 'bright' && x.kind !== 'ad';
}

test('the Glimmer-side paper leans dark and the Keeper-side paper is unchanged @w1', async () => {
  const cur = current();
  expect(cur.PPNews.devCheck()).toEqual([]);
  const data = cur.MAPDATA.news;
  const by = (k) => Object.fromEntries(data[k].map((x) => [x.id, x]));
  const S = by('stories'), V = by('voices'), N = by('notices'), P = by('polls');

  const n = { feat: 0, featDark: 0, brief: 0, briefDark: 0, voice: 0, voiceDark: 0, lantern: 0, polls: 0, pollDark: 0 };
  for (let d = 1; d <= 30; d++) for (const map of ['cobblecrest', 'route3', 'hearthmoor']) {
    const e = cur.PPNews.edition(stateFor('glimmer', d, map));
    e.features.forEach((s) => { n.feat++; if (isDark(S[s.id])) n.featDark++; if (S[s.id].desk === 'lantern') n.lantern++; });
    e.briefs.forEach((s) => { n.brief++; if (isDark(S[s.id])) n.briefDark++; });
    e.voices.forEach((v) => { n.voice++; if (isDark(V[v.id])) n.voiceDark++; });
    if (e.poll) { n.polls++; if (isDark(P[e.poll.id])) n.pollDark++; }
  }
  expect(n.featDark / n.feat).toBeGreaterThan(0.75);
  expect(n.briefDark / n.brief).toBeGreaterThan(0.6);
  expect(n.voiceDark / n.voice).toBeGreaterThan(0.6);
  expect(n.lantern / n.feat).toBeLessThan(0.05);
  expect(n.pollDark).toBe(n.polls);

  // Keeper side: byte-for-byte the same editions as the merge base, and no dark hint anywhere.
  const old = baseline();
  for (let d = 1; d <= 20; d++) for (const map of ['cobblecrest', 'route3', 'hearthmoor', 'fernbrook']) {
    const st = stateFor('keepers', d, map);
    const e = cur.PPNews.edition(st);
    // D1192 (Vincent, Nov 2, 2026): "Fernbrook Trial Hall" everywhere; the base's old name is read as renamed, nothing else.
    const was = JSON.stringify(old.PPNews.edition(st)).replace(/Bloom Trial Hall/g, 'Fernbrook Trial Hall').replace(/BLOOM TRIAL HALL/g, 'FERNBROOK TRIAL HALL');
    expect(JSON.stringify(e), 'keepers ' + map + ' day ' + d).toBe(was);
    expect(JSON.stringify(e)).not.toMatch(HINTS);
  }

  // Every new dark item is Glimmer-only; INSIGN and facility hints also wait for the Tuning (story.seal2).
  for (const x of [...data.stories, ...data.voices, ...data.notices, ...data.polls]) {
    const text = JSON.stringify([x.headline, x.body, x.text, x.title, x.q, x.options]);
    if (!HINTS.test(text)) continue;
    expect(x.when, x.id).toContain('story.side=glimmer');
    expect(x.when, x.id).toContain('story.seal2');
  }
  // Before the Tuning, a Glimmer-side paper carries no INSIGN or facility hint.
  for (let d = 1; d <= 20; d++) {
    const st = stateFor('glimmer', d, 'cobblecrest');
    delete st.flags['story.seal2'];
    expect(JSON.stringify(cur.PPNews.edition(st)), 'pre-Tuning day ' + d).not.toMatch(HINTS);
  }
  expect(N['no-glimmer-before'].when).toContain('story.seal2');
});

test('the cracked handset prints the dark paper on FRONT and TOWN at phone widths', async ({ page }) => {
  const save = starterSave();
  save.settings.tips = false;
  save.player.name = 'Wayfarer';
  LATE.forEach((f) => { save.flags[f] = true; });
  save.flags['story.tutorial_done'] = true;
  save.world = { map: 'cobblecrest', x: 8, y: 9, facing: 'down', respawn: 'hearthmoor' };
  await installSave(page.context(), save, { quietDay: true });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true && window.PPNews);
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  await page.evaluate(() => { PixelPets.giveItem('keeper1', 1); PixelPets.giveItem('cracked_phone', 1); PixelPets.setSide('glimmer'); PixelPets.clock.set('fri', 9, 0); PixelPets.showTab('walk'); });
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));

  await page.locator('#phoneBtn').click();
  await expect(page.locator('#ovPhone')).toHaveClass(/hack/);
  await page.locator('.phone-app[data-app="news"]').click();
  await expect(page.locator('#phonePane')).toBeVisible();
  const darkHeads = await page.evaluate(() => MAPDATA.news.stories
    .filter((s) => (s.when || []).includes('story.side=glimmer') && s.desk !== 'bright').map((s) => s.headline));
  const front = await page.locator('#phoneBody').innerText();
  expect(darkHeads.some((h) => front.includes(h)), 'a dark story on FRONT').toBe(true);
  if (process.env.PP_ARTIFACTS) await page.screenshot({ path: path.join(artifactsDir('news_dark'), 'front-' + page.viewportSize().width + '.png') });

  await page.locator('.news-tab[data-tab="town"]').click();
  await expect(page.locator('.news-panel-town')).toBeVisible();
  if (process.env.PP_ARTIFACTS) await page.screenshot({ path: path.join(artifactsDir('news_dark'), 'town-' + page.viewportSize().width + '.png') });
  const tabs = await page.locator('.news-tab').evaluateAll((els) => els.map((el) => { const r = el.getBoundingClientRect(); return { w: r.width, h: r.height }; }));
  for (const t of tabs) expect(t.h).toBeGreaterThanOrEqual(44);

  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  expect(after.v).toBe(2);
  // Opening the phone and NEWS writes only fields main already has (phoneOpened; newsSeen, newsTab, newsClips from #237).
  const NEWS_FIELDS = ['newsClips', 'newsSeen', 'newsTab', 'phoneOpened'];
  expect(Object.keys(after).filter((k) => !NEWS_FIELDS.includes(k)).sort()).toEqual(Object.keys(before).filter((k) => !NEWS_FIELDS.includes(k)).sort());
});
