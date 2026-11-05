/* PHONE_FEED v0.1 (design specs/PHONE_FEED.md; D2170-D2189): the content pass on NEWS (Block News) and RIBBIT.
   Every new entry gates on its story flags, its side and, for town tone, the town's hold (`hold:<node>=<id>`, D2172).
   New entries are the ids not in data/news.json / data/ribbit_posts.json at the merge base with origin/main (never HEAD).
   Checks: per-act seeded saves show their own entries and none from later; nothing new reaches the Act 1 baseline paper;
   switcher and ad copy stays on the Glimmer side; holds flip the tone; both apps render at 320/375/390 with no sideways
   overflow, with reduced motion, zero console errors, and the save unchanged (v 2, no new key). Modern controls. */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const ROOT = path.resolve(__dirname, '..');
function baseIds() {
  const git = (args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 });
  const base = git(['merge-base', 'HEAD', 'origin/main']).trim();
  const news = JSON.parse(git(['show', base + ':data/news.json']));
  const posts = JSON.parse(git(['show', base + ':data/ribbit_posts.json']));
  const ids = [];
  for (const k of ['stories', 'voices', 'notices', 'polls', 'you']) (news[k] || []).forEach((x) => ids.push(x.id));
  (posts.posts || []).forEach((x) => ids.push(x.id));
  return ids;
}

const ACT1 = ['story.phone_got', 'story.reached_route1', 'story.reached_route2', 'story.reached_fernbrook', 'story.met_glimmerwell',
  'story.met_census', 'story.met_lead', 'story.side_pick_done', 'story.seal1', 'story.tour1_s1', 'story.reached_cobblecrest',
  'story.cobble_arrived', 'story.quarry_bought', 'story.seal2', 'story.rc_done', 'story.reached_route3', 'story.ans_open',
  'story.reached_glen', 'story.glen_cleared', 'story.know_us', 'story.heights_done', 'story.rx_enter', 'story.rx_done',
  'story.saw_arbiter', 'story.rx_bitlet', 'story.sm_done', 'story.brine_arrived', 'story.reached_brinewick'];
const CADET = ACT1.concat(['story.met_fen', 'story.crackdown', 'story.post_trial_done', 'story.hall1_shut', 'story.warden_called',
  'story.warden_met', 'story.hw_reached', 'story.chi_met', 'story.shift_ledger', 'story.shift_g', 'story.shift_k', 'story.chi_done', 'story.orchard_cleared',
  'story.keeper_cadet']);
const OPENER = CADET.concat(['story.hc_arrived', 'story.seal3', 'story.ep1_end', 'story.cover_done', 'story.a2_called', 'story.gov_posted', 'story.cv_mom',
  'story.reached_route4', 'story.r4_fork', 'story.r4_adder_met', 'story.r4_heron_met', 'story.reached_withy', 'story.r4_walked',
  'story.hc_gov_met', 'story.km_assigned']);
const WAITS = ['story.km_arrived', 'story.km_council', 'story.seal4', 'story.seal5', 'story.hc_parade_seen', 'story.fen_turned',
  'story.switched_a3', 'story.warden_cut'];
const flagsOf = (list, extra) => Object.assign(Object.fromEntries(list.map((f) => [f, true])), extra || {});

function feedSave(list, extra) {
  const s = starterSave();
  s.settings.tips = false;
  s.settings.controls = 'modern';
  s.player.name = 'Wayfarer';
  Object.assign(s.flags, flagsOf(list), { 'story.tutorial_done': true }, extra || {});
  s.seals = { seal_fernbrook: true, seal_cobblecrest: true, seal_brinewick: true };
  s.world = { map: 'hearthmoor', x: 8, y: 9, facing: 'down', respawn: 'hearthmoor' };
  return s;
}
async function boot(page, list, extra) {
  await installSave(page.context(), feedSave(list, extra), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true && window.PPNews && window.PPRibbit);
  await page.evaluate(() => { PixelPets.clock.set('fri', 9, 0); PixelPets.showTab('walk'); });
}
// The new entries a state can show: every item whose gates pass (when, with holds; sky/phase/me left open).
async function eligible(page, NEW, flags, side, holds) {
  return page.evaluate(({ NEW, flags, side, holds }) => {
    const N = MAPDATA.news, keep = new Set(NEW);
    const all = [].concat(N.stories, N.voices, N.notices, N.polls, N.you, MAPDATA.ribbit_posts.posts).filter((x) => keep.has(x.id));
    return all.filter((x) => PPRibbit.passes(x.when, flags, side, holds)).map((x) => x.id).sort();
  }, { NEW, flags, side, holds });
}

test('new feed entries gate by act, side and hold, and none shows before its flag @w1', async ({ page }) => {
  const base = new Set(baseIds());
  await boot(page, OPENER, { 'story.cover': 'glimmer', 'story.sway_fernbrook': 2, 'story.side': 'keepers' });
  const NEW = await page.evaluate((base) => {
    const N = MAPDATA.news, b = new Set(base);
    return [].concat(N.stories, N.voices, N.notices, N.polls, N.you, MAPDATA.ribbit_posts.posts).map((x) => x.id).filter((id) => !b.has(id));
  }, [...base]);
  expect(NEW.length).toBeGreaterThanOrEqual(150);
  expect(await page.evaluate(() => [PPNews.devCheck(), PPRibbit.devCheck()])).toEqual([[], []]);

  // Act 1 baseline (the Keeper paper the dark-mode spec holds still): nothing new, on either side.
  expect(await eligible(page, NEW, flagsOf(ACT1), 'keepers', null)).toEqual([]);
  expect(await eligible(page, NEW, flagsOf(ACT1, { 'story.side': 'glimmer' }), 'glimmer', null)).toEqual([]);

  // A Keeper Cadet after the crackdown and Wickerglen: the crackdown, Chi and the shifts, not the undercover wire.
  const cadet = await eligible(page, NEW, flagsOf(CADET), 'keepers', null);
  for (const id of ['nw-fernbrook-curfewdawn', 'nw-wickerglen-dusk', 'nw-hushwater-weir', 'nw-hearthmoor-cadet', 'yo-cadet-pin']) expect(cadet).toContain(id);
  for (const id of ['nw-glimmer-cadetlanyard', 'yo-undercover', 'nw-hearthmoor-posting', 'nw-kilnmouth-arrive']) expect(cadet).not.toContain(id);

  // The same Cadet undercover reads the cracked handset's wire, and its ad.
  const under = await eligible(page, NEW, flagsOf(CADET, { 'story.cover': 'glimmer', 'story.side': 'glimmer' }), 'glimmer', null);
  for (const id of ['nw-glimmer-cadetlanyard', 'yo-undercover', 'no-glimmer-trialday']) expect(under).toContain(id);
  expect(under).not.toContain('yo-cadet-pin');

  // The Act 2 opener: the posting, supper, Route 4, the Governor; nothing that waits on an unbuilt beat.
  const opener = await eligible(page, NEW, flagsOf(OPENER, { 'story.cover': 'glimmer', 'story.cv_mom': 'told' }), 'keepers', null);
  for (const id of ['nw-hearthmoor-posting', 'nw-cover-cadet', 'rp-cover-mom', 'nw-route4-downs', 'nw-route4-herons', 'no-route4-picking',
    'nw-route4-walked', 'nw-highcharity-governor', 'yo-governor']) expect(opener).toContain(id);
  const items = await page.evaluate((ids) => {
    const N = MAPDATA.news, all = [].concat(N.stories, N.voices, N.notices, N.polls, N.you, MAPDATA.ribbit_posts.posts);
    return ids.map((id) => all.find((x) => x.id === id));
  }, opener);
  for (const x of items) for (const w of WAITS) expect(x.when, x.id).not.toContain(w);

  // Every new entry needs every positive flag it names: drop any one and it no longer shows.
  const solo = await page.evaluate((NEW) => {
    const N = MAPDATA.news, keep = new Set(NEW), bad = [];
    for (const x of [].concat(N.stories, N.voices, N.notices, N.polls, N.you, MAPDATA.ribbit_posts.posts).filter((y) => keep.has(y.id))) {
      const flags = {}, side = (x.when || []).includes('story.side=glimmer') ? 'glimmer' : 'keepers', holds = {};
      for (const w of x.when || []) {
        if (w[0] === '!') continue;
        const h = /^hold:([a-z0-9_]+)=(\w+)$/.exec(w);
        if (h) { holds[h[1]] = h[2]; continue; }
        const eq = w.indexOf('=');
        if (eq === -1) { if (!(w in flags)) flags[w] = true; } else if (w.slice(0, eq) !== 'story.side') flags[w.slice(0, eq)] = w.slice(eq + 1);
      }
      if (!PPRibbit.passes(x.when, flags, side, holds)) { bad.push('cannot show: ' + x.id); continue; }
      for (const k of Object.keys(flags)) {
        const less = Object.assign({}, flags); delete less[k];
        if (PPRibbit.passes(x.when, less, side, holds)) bad.push(x.id + ' shows without ' + k);
      }
    }
    return bad;
  }, NEW);
  expect(solo).toEqual([]);

  // Late beats wait for their own flags: Kilnmouth, Brightgate, the parade, Fen's turn, the switch.
  const later = await eligible(page, NEW, flagsOf(OPENER.concat(['story.km_arrived', 'story.seal4'])), 'keepers', null);
  for (const id of ['nw-kilnmouth-arrive', 'nw-kilnmouth-names', 'nw-brightgate-hall4', 'nw-kilnmouth-storm']) expect(later).toContain(id);
  for (const id of ['nw-kilnmouth-seventh', 'nw-highcharity-parade', 'nw-kilnmouth-hall5', 'nw-fernbrook-reopen-k']) expect(later).not.toContain(id);

  // Glimmer-wire copy and ads only ever on the Glimmer side; Fen's turn reads its own value.
  const keeperAll = await eligible(page, NEW, flagsOf(OPENER.concat(WAITS), { 'story.fen_turned': 'keepers', 'story.cover': 'glimmer' }), 'keepers', null);
  expect(keeperAll.filter((id) => /^(nw|vo|no|yo|rp)-glimmer-/.test(id))).toEqual([]);
  expect(keeperAll).toContain('nw-fernbrook-reopen-k');
  expect(keeperAll).not.toContain('nw-fernbrook-reopen-g');
  // The red rows (D2174 cabinet and Rook's offer, D2175 the switch) are held in the design packet, not shipped.
  for (const id of ['nw-highcharity-sitting', 'nw-kilnmouth-coachstop', 'nw-glimmer-hook', 'yo-switch', 'yo-loyalist']) expect(NEW).not.toContain(id);
});

test('a town hold flips the tone: the game passes its holds to both feeds @w1', async ({ page }) => {
  const base = new Set(baseIds());
  for (const [sway, want, not] of [[2, 'nw-fernbrook-hold-k', 'nw-fernbrook-hold-g'], [-2, 'nw-fernbrook-hold-g', 'nw-fernbrook-hold-k'], [0, 'nw-fernbrook-hold-s', 'nw-fernbrook-hold-k']]) {
    await boot(page, CADET, { 'story.cover': 'glimmer', 'story.sway_fernbrook': sway, 'story.side': 'keepers' });
    const holds = await page.evaluate(() => PixelPets.feedHolds());
    expect(holds.fernbrook).toBe(sway === 2 ? 'keepers' : sway === -2 ? 'glimmer' : 'split');
    expect(holds.cobblecrest).toBe('glimmer');   // the built quarry vote flip, read through the same rules
    const NEW = await page.evaluate((base) => {
      const N = MAPDATA.news, b = new Set(base);
      return [].concat(N.stories, N.voices, N.notices, N.polls, N.you, MAPDATA.ribbit_posts.posts).map((x) => x.id).filter((id) => !b.has(id));
    }, [...base]);
    const flags = await page.evaluate(() => PixelPets.state.flags);
    const ids = await eligible(page, NEW, flags, 'keepers', holds);
    expect(ids, 'sway ' + sway).toContain(want);
    expect(ids, 'sway ' + sway).not.toContain(not);
    // With no holds passed (an older caller), a hold-gated line never shows.
    expect(await eligible(page, NEW, flags, 'keepers', null)).not.toContain(want);
  }
});

test('NEWS and RIBBIT render the Act 2 feed with no sideways overflow, reduced motion on, save unchanged', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await boot(page, OPENER, { 'story.cover': 'glimmer', 'story.cv_mom': 'told', 'story.sway_fernbrook': 2, 'story.side': 'keepers' });
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  const snap = () => page.evaluate(() => {
    const st = PixelPets.state, f = st.flags || {};
    return { v: st.v, keys: Object.keys(st).sort(), story: Object.fromEntries(Object.keys(f).filter((k) => k.indexOf('story.') === 0).sort().map((k) => [k, f[k]])) };
  });
  const before = await snap();
  const fit = () => page.evaluate(() => {
    const body = document.querySelector('#phoneBody');
    const small = [...body.querySelectorAll('button')].filter((b) => b.offsetParent).filter((b) => {
      const r = b.getBoundingClientRect(); return r.height < 44 || r.width < 44;
    }).length;
    const raw = /\{(holder|partner|town|seals|steps)\}/.test(body.textContent);
    return { x: body.scrollWidth <= body.clientWidth + 1 && document.documentElement.scrollWidth <= innerWidth + 1, small: small + (raw ? 100 : 0) };
  });
  await page.locator('#phoneBtn').click();
  await expect(page.locator('#phoneHome')).toBeVisible();
  await page.locator('.phone-app[data-app="news"]').click();
  await expect(page.locator('.news-panel-front')).toBeVisible();
  // The lead is the newest Act 2 beat the save has reached, not Episode 1's tower.
  const lead = await page.evaluate(() => {
    const e = PPNews.edition(Object.assign({}, { flags: PixelPets.state.flags, side: 'keepers', holds: PixelPets.feedHolds(), uid: 'x', day: '2026-11-04', hh: 9, phase: 'day', sky: '', me: {} }));
    return e.lead && e.lead.id;
  });
  expect(lead).toBe('nw-highcharity-governor');
  expect(await fit()).toEqual({ x: true, small: 0 });
  for (const tab of ['read', 'town', 'you']) {
    await page.locator(`.news-tab[data-tab="${tab}"]`).click();
    await expect(page.locator(`.news-panel-${tab}`)).toBeVisible();
    expect(await fit(), tab).toEqual({ x: true, small: 0 });
  }
  await page.locator('#phoneBack').click();
  await page.locator('.phone-app[data-app="ribbit"]').click();
  await expect(page.locator('.ribbit-post').first()).toBeVisible();
  expect((await fit()).x).toBe(true);
  const after = await snap();
  expect(after.v).toBe(2);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')).v)).toBe(2);
  // Opening the phone and reading may add only the phone's and NEWS app's existing additive keys; this pass adds no key
  // and writes no story flag.
  const allowed = new Set(['newsSeen', 'newsTab', 'newsPoll', 'newsClips', 'chirps', 'phoneOpened']);
  expect(after.keys.filter((k) => !before.keys.includes(k) && !allowed.has(k))).toEqual([]);
  expect(after.story).toEqual(before.story);
});
