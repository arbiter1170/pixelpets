/* NEWS (D1012 red, D1013 copy, D1014 Ribbit pool, D1015 flavour): the Block News paper on the phone. Three editions a
   real day, led by the newest story beat, in four tabs (FRONT, READ, TOWN, YOU); and the fuller Ribbit feed from
   data/ribbit_posts.json. Save stays v2; newsSeen, newsTab and newsPoll are additive. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, shot } = require('./helpers');

trackErrors(test, expect);

function readySave(extra, mutate) {
  const s = starterSave();
  s.settings.tips = false;
  s.player.name = 'Wayfarer';
  Object.assign(s.flags, { 'story.tutorial_done': true, 'story.phone_got': true, 'story.reached_route1': true }, extra || {});
  s.world = { map: 'hearthmoor', x: 8, y: 9, facing: 'down', respawn: 'hearthmoor' };
  if (mutate) mutate(s);
  return s;
}

async function boot(page, extra, mutate) {
  await installSave(page.context(), readySave(extra, mutate), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true && window.PPNews && window.PPRibbit);
  await page.evaluate(() => { PixelPets.clock.set('fri', 9, 0); PixelPets.showTab('walk'); });
}

async function openNews(page) {
  if (await page.locator('#ovPhone').isHidden()) await page.locator('#phoneBtn').click();
  else await page.locator('#phoneBack').click();
  await expect(page.locator('#phoneHome')).toBeVisible();
  await page.locator('.phone-app[data-app="news"]').click();
  await expect(page.locator('#phonePane')).toBeVisible();
}

async function tab(page, id) {
  await page.locator(`.news-tab[data-tab="${id}"]`).click();
  await expect(page.locator(`.news-panel-${id}`)).toBeVisible();
}

const EARLY = { 'story.phone_got': true, 'story.reached_route1': true };
const MID = Object.assign({}, EARLY, { 'story.reached_fernbrook': true, 'story.seal1': true, 'story.reached_cobblecrest': true, 'story.cobble_arrived': true, 'story.quarry_bought': true });
const LATER = /RegenX|went dark|was sold|Brinewick|High Charity|Mahopac|Route 3|Answerer/i;
const ME = { holder: 'Wayfarer', partner: 'Pipkit', partnerSpecies: 'ember', partnerStage: 0, seals: 0, steps: 1240, acorns: 34, seen: ['ember/0'] };
const BASE = { side: 'keepers', map: 'hearthmoor', uid: 'news-uid', day: '2026-11-02', hh: 9, phase: 'day', sky: 'clear', town: 'Hearthmoor', me: ME };

test('the paper checks itself, holds still within an edition, and turns over across days @w1', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(({ EARLY, BASE }) => {
    const base = Object.assign({ flags: EARLY }, BASE);
    const a = PPNews.edition(base), b = PPNews.edition(JSON.parse(JSON.stringify(base)));
    const week = [];
    for (let d = 2; d <= 8; d++) week.push(PPNews.edition(Object.assign({}, base, { day: '2026-11-0' + d })).features.map(s => s.id).join());
    const evening = PPNews.edition(Object.assign({}, base, { hh: 15 }));
    const night = PPNews.edition(Object.assign({}, base, { hh: 23, phase: 'night' }));
    const N = MAPDATA.news;
    return {
      news: PPNews.devCheck(), ribbit: PPRibbit.devCheck(),
      same: JSON.stringify(a) === JSON.stringify(b),
      lead: !!a.lead, features: a.features.length, briefs: a.briefs.length, voices: a.voices.length, notices: a.notices.length, poll: !!a.poll, you: !!a.you,
      editions: [a.edition, evening.edition, night.edition], sameKey: a.key === evening.key,
      distinct: new Set(week).size,
      counts: { stories: N.stories.length, voices: N.voices.length, notices: N.notices.length, polls: N.polls.length, you: N.you.length, posts: MAPDATA.ribbit_posts.posts.length },
      stamps: [N.lore_version, MAPDATA.ribbit_posts.lore_version],
    };
  }, { EARLY, BASE });
  expect(out.news, out.news.join('\n')).toEqual([]);
  expect(out.ribbit, out.ribbit.join('\n')).toEqual([]);
  expect(out.same).toBe(true);
  expect(out.lead).toBe(true);
  expect(out.features).toBeGreaterThanOrEqual(3);
  expect(out.briefs).toBeGreaterThanOrEqual(1);
  expect(out.voices).toBe(3);
  expect(out.notices).toBeGreaterThanOrEqual(2);
  expect(out.poll).toBe(true);
  expect(out.you).toBe(true);
  expect(out.editions).toEqual(['MORNING', 'EVENING', 'NIGHT']);
  expect(out.sameKey).toBe(true);   // a new edition time does not light the icon dot
  expect(out.distinct).toBeGreaterThanOrEqual(4);
  expect(out.counts.stories).toBeGreaterThanOrEqual(80);
  expect(out.counts.voices).toBeGreaterThanOrEqual(30);
  expect(out.counts.notices).toBeGreaterThanOrEqual(20);
  expect(out.counts.polls).toBeGreaterThanOrEqual(10);
  expect(out.counts.you).toBeGreaterThanOrEqual(10);
  expect(out.counts.posts).toBeGreaterThanOrEqual(80);
  expect(out.stamps[0]).toMatch(/^v\d/);
  expect(out.stamps[0]).toBe(out.stamps[1]);
});

test('story progress moves the lead, and nothing later leaks into an early paper or feed @w1', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(({ EARLY, MID, LATER, BASE }) => {
    const re = new RegExp(LATER, 'i');
    const text = e => [e.lead].concat(e.features, e.briefs).filter(Boolean).map(s => s.headline + ' ' + s.body.join(' ') + ' ' + s.replies.map(r => r.text).join(' ')).join('\n')
      + e.voices.map(v => v.text).join('\n') + e.notices.map(n => n.title + ' ' + n.text).join('\n') + (e.you ? e.you.headline + e.you.body.join(' ') : '') + (e.poll ? e.poll.q + e.poll.options.join(' ') : '');
    const leaks = [], feedLeaks = [];
    for (let d = 1; d <= 28; d++) {
      const day = '2026-02-' + String(d).padStart(2, '0');
      for (const map of ['hearthmoor', 'route1', 'hm_lantern_in']) for (const [hh, phase, sky] of [[8, 'day', 'clear'], [15, 'dusk', 'rain'], [23, 'night', 'snow']]) {
        const e = PPNews.edition(Object.assign({}, BASE, { flags: EARLY, map, uid: 'u' + d, day, hh, phase, sky }));
        if (re.test(text(e))) leaks.push(day + ' ' + map + ': ' + text(e).match(re)[0]);
      }
      for (const map of ['hearthmoor', 'route1']) {
        const f = PPRibbit.feed({ flags: EARLY, side: 'keepers', map, uid: 'u' + d, day });
        for (const p of f.posts) if (re.test(p.text)) feedLeaks.push(p.id);
      }
    }
    const early = PPNews.edition(Object.assign({}, BASE, { flags: EARLY })).lead;
    const mid = PPNews.edition(Object.assign({}, BASE, { flags: MID })).lead;
    return { leaks, feedLeaks, early: early && early.id, mid: mid && mid.id, midText: mid ? mid.headline + ' ' + mid.body.join(' ') : '' };
  }, { EARLY, MID, LATER: LATER.source, BASE });
  expect(out.leaks).toEqual([]);
  expect(out.feedLeaks).toEqual([]);
  expect(out.mid).not.toBe(out.early);
  expect(out.midText).toMatch(/quarry|seam|Cobblecrest/i);
});

test('the chipping stays off every Keeper-side paper and feed @w1', async ({ page }) => {
  await boot(page);
  const hits = await page.evaluate(({ BASE }) => {
    const secret = /\b(chips?|chipped|chipping|tuning|implants?)\b/i;
    const N = MAPDATA.news;
    const flags = {};
    for (const k of new Set([].concat(N.stories, N.voices, N.notices, N.polls, N.you, MAPDATA.ribbit_posts.posts).flatMap(s => s.when || []).filter(w => w[0] !== '!' && w.indexOf('=') === -1))) flags[k] = true;
    const out = [];
    for (let d = 1; d <= 20; d++) {
      for (const map of ['hearthmoor', 'fernbrook', 'cobblecrest', 'highcharity', 'brinewick', 'route3', 'mahopac']) {
        const st = Object.assign({}, BASE, { flags, map, uid: 's' + d, day: '2026-03-' + String(d).padStart(2, '0'), me: Object.assign({}, BASE.me, { seals: 3, steps: 9000, acorns: 500 }) });
        const e = PPNews.edition(st);
        const all = [e.lead].concat(e.features, e.briefs).filter(Boolean).map(s => [s.id, s.headline + ' ' + s.body.join(' ') + ' ' + s.replies.map(r => r.text).join(' ')])
          .concat(e.voices.map(v => [v.id, v.text]), e.notices.map(n => [n.id, n.title + ' ' + n.text]), e.you ? [[e.you.id, e.you.headline + ' ' + e.you.body.join(' ')]] : []);
        for (const [id, t] of all) if (secret.test(t)) out.push(id);
        if (e.notices.some(n => n.kind === 'ad')) out.push('ad on the Keeper side');
        for (const p of PPRibbit.feed(st).posts) if (secret.test(p.text)) out.push(p.id);
      }
    }
    return out;
  }, { BASE });
  expect(hits).toEqual([]);
});

test('weather, time of day and the holder shape the paper: gates, tokens and the Walkling of the day @w1', async ({ page }) => {
  await boot(page);
  const out = await page.evaluate(({ MID, BASE }) => {
    const N = MAPDATA.news, bad = [];
    const flags = Object.assign({}, MID);
    const runs = [];
    for (let d = 1; d <= 28; d++) for (const [sky, phase, hh] of [['clear', 'day', 9], ['rain', 'day', 14], ['snow', 'night', 23], ['cloud', 'dawn', 6]]) {
      const e = PPNews.edition(Object.assign({}, BASE, { flags, sky, phase, hh, uid: 'g' + d, day: '2026-01-' + String(d).padStart(2, '0') }));
      runs.push(e);
      const items = [e.lead].concat(e.features, e.briefs).filter(Boolean).map(s => N.stories.find(x => x.id === s.id))
        .concat(e.voices.map(v => N.voices.find(x => x.id === v.id)));
      for (const it of items) {
        if (it.sky && it.sky.indexOf(sky) === -1) bad.push(it.id + ' ran in ' + sky);
        if (it.phase && it.phase.indexOf(phase) === -1) bad.push(it.id + ' ran at ' + phase);
      }
      const txt = JSON.stringify([e.lead, e.features, e.briefs, e.voices, e.notices, e.poll, e.you]);
      if (/\{(holder|partner|town|seals|steps)\}/.test(txt)) bad.push('unfilled token on ' + e.day);
    }
    const gated = runs.flatMap(e => [e.lead].concat(e.features, e.briefs).filter(Boolean)).map(s => N.stories.find(x => x.id === s.id)).filter(s => s.sky || s.phase).length;
    const youText = runs.map(e => e.you ? e.you.headline + ' ' + e.you.body.join(' ') : '').join('\n');
    const noPartner = PPNews.edition(Object.assign({}, BASE, { flags, me: Object.assign({}, BASE.me, { partner: '', seen: [] }) }));
    const pickedYou = noPartner.you && N.you.find(y => y.id === noPartner.you.id);
    const spot = new Set(runs.map(e => e.spotlight && e.spotlight.species + '/' + e.spotlight.stage));
    const seenTwo = PPNews.edition(Object.assign({}, BASE, { flags, me: Object.assign({}, BASE.me, { seen: ['beetle/0', 'moth/0'] }) })).spotlight;
    return { bad, gated, named: /Wayfarer|Pipkit|Hearthmoor|1,240/.test(youText), meOk: !pickedYou || !(pickedYou.me || []).includes('partner'), spot: [...spot], seenTwo };
  }, { MID, BASE });
  expect(out.bad).toEqual([]);
  expect(out.gated).toBeGreaterThan(0);
  expect(out.named).toBe(true);
  expect(out.meOk).toBe(true);
  expect(out.spot).toEqual(['ember/0']);
  expect(['beetle/0', 'moth/0']).toContain(out.seenTwo.species + '/' + out.seenTwo.stage);
});

test('NEWS opens on FRONT from the grid with a dot; all four tabs fit the phone with 44 px taps', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await boot(page, null, s => { s.dex.seen['beetle/0'] = true; });
  await page.locator('#phoneBtn').click();
  const apps = await page.locator('#phoneHome .phone-app').evaluateAll(els => els.map(el => el.dataset.app));
  expect(apps).toHaveLength(10);
  expect(apps.indexOf('news')).toBe(apps.indexOf('ribbit') - 1);
  await expect(page.locator('#phoneNews')).toHaveClass(/unread/);
  await shot(page, 'news-home');
  await page.locator('.phone-app[data-app="news"]').click();
  const body = page.locator('#phoneBody');
  await expect(body.locator('.news-name')).toHaveText('BLOCK NEWS');
  await expect(body.locator('.news-date')).toHaveText(/^(SUN|MON|TUE|WED|THU|FRI|SAT) \d{1,2} [A-Z]{3} · MORNING EDITION$/);
  await expect(body.locator('.news-tab.news-on')).toHaveAttribute('data-tab', 'front');
  await expect(body.locator('.news-breaking')).toHaveCount(0);   // never on the very first read
  await expect(body.locator('.news-lead .news-headline')).toBeVisible();
  await expect(body.locator('.news-lead .news-more')).toBeHidden();
  await body.locator('.news-open').click();
  await expect(body.locator('.news-lead .news-more')).toBeVisible();
  await expect(body.locator('.news-lead .news-reply').first()).toBeVisible();
  const wire = await body.locator('.news-wire-text').textContent();
  await body.locator('.news-wire-next').click();
  expect(await body.locator('.news-wire-text').textContent()).not.toBe(wire);
  const fit = () => page.evaluate(() => {
    const el = document.querySelector('#phoneBody');
    const taps = [...el.querySelectorAll('button')].filter(b => b.offsetParent);
    return {
      x: el.scrollWidth <= el.clientWidth + 1,
      small: taps.filter(b => { const r = b.getBoundingClientRect(); return r.height < 44 || r.width < 44; }).map(b => b.className),
      raw: /\{(holder|partner|town|seals|steps)\}/.test(el.textContent),
    };
  });
  expect(await fit()).toEqual({ x: true, small: [], raw: false });
  await shot(page, 'news-front');
  await tab(page, 'read');
  const heads = body.locator('.news-acc');
  expect(await heads.count()).toBeGreaterThanOrEqual(2);
  await expect(body.locator('.news-acc-open')).toHaveCount(1);
  const item = body.locator('.news-item').first();
  await item.locator('.news-head').click();
  await expect(item.locator('.news-more')).toBeVisible();
  await heads.nth(1).click();
  await expect(body.locator('.news-acc-open')).toHaveCount(1);
  expect(await fit()).toEqual({ x: true, small: [], raw: false });
  await shot(page, 'news-read');
  await tab(page, 'town');
  await expect(body.locator('.news-voice')).toHaveCount(3);
  expect(await body.locator('.news-notice').count()).toBeGreaterThanOrEqual(2);
  await expect(body.locator('.news-ad')).toHaveCount(0);
  await expect(body.locator('.news-opt')).toHaveCount(3);
  expect(await fit()).toEqual({ x: true, small: [], raw: false });
  await shot(page, 'news-town');
  await tab(page, 'you');
  await expect(body.locator('.news-you .news-headline')).toBeVisible();
  await expect(body.locator('.news-stat')).toHaveCount(3);
  await expect(body.locator('.news-spotname')).toHaveText(/^(Pipkit|Pomlet)$/);
  expect(await fit()).toEqual({ x: true, small: [], raw: false });
  await shot(page, 'news-you');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  expect(saved.v).toBe(2);
  expect(saved.newsSeen).toMatch(/^\d{4}-\d{2}-\d{2}:[a-z0-9_-]+$/);
  expect(saved.newsTab).toBe('you');
  await page.locator('#phoneBack').click();
  await expect(page.locator('#phoneNews')).not.toHaveClass(/unread/);
});

test('the daily poll takes one tap, shows the results, and holds across a reload @w1', async ({ page }) => {
  await boot(page);
  await openNews(page);
  await tab(page, 'town');
  await expect(page.locator('.news-pct')).toHaveCount(0);
  await page.locator('.news-opt').nth(1).click();
  await expect(page.locator('.news-pct')).toHaveCount(3);
  await expect(page.locator('.news-opt').nth(1)).toHaveClass(/news-picked/);
  const pcts = (await page.locator('.news-pct').allTextContents()).map(t => parseInt(t, 10));
  expect(pcts.reduce((a, b) => a + b, 0)).toBe(100);
  await page.locator('.news-opt').nth(0).click();   // no take-backs
  await expect(page.locator('.news-opt').nth(1)).toHaveClass(/news-picked/);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  expect(saved.newsPoll.pick).toBe(1);
  await installSave(page.context(), Object.assign(saved, { flags: Object.assign(saved.flags, { 'daily.hello': '', 'daily.warm_bowl': '' }) }), { quietDay: true });
  await page.reload();
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => { PixelPets.clock.set('fri', 9, 0); PixelPets.showTab('walk'); });
  await openNews(page);
  await expect(page.locator('.news-panel-town')).toBeVisible();   // the paper reopens on the last tab
  await expect(page.locator('.news-opt').nth(1)).toHaveClass(/news-picked/);
});

test('a new lead brings the dot and a BREAKING bar back; the cracked handset reads it in its own voice @w1', async ({ page }) => {
  await boot(page);
  await openNews(page);
  await page.locator('#phoneClose').click();
  await page.evaluate(flags => { for (const k of Object.keys(flags)) PixelPets.setFlag(k, true); }, MID);
  await page.locator('#phoneBtn').click();
  await expect(page.locator('#phoneNews')).toHaveClass(/unread/);
  await page.locator('.phone-app[data-app="news"]').click();
  await expect(page.locator('.news-tab.news-on')).toHaveAttribute('data-tab', 'front');
  await expect(page.locator('.news-breaking')).toBeVisible();
  await expect(page.locator('.news-breaking')).toContainText(await page.locator('.news-lead .news-headline').textContent());
  await page.locator('#phoneClose').click();
  await openNews(page);
  await expect(page.locator('.news-breaking')).toHaveCount(0);   // read once, no longer breaking
  await page.locator('#phoneClose').click();
  await page.evaluate(() => { PixelPets.giveItem('cracked_phone', 1); PixelPets.setSide('glimmer'); PixelPets.showTab('walk'); });
  await openNews(page);
  await expect(page.locator('#ovPhone')).toHaveClass(/hack/);
  await expect(page.locator('.news-date')).toHaveText(/ \/\/ LIFTED COPY$/);
  await expect(page.locator('.news-tab').first()).toHaveText('[FRONT]');
  await shot(page, 'news-front-hack');
  await tab(page, 'town');
  await shot(page, 'news-town-hack');
});

test('Scrapbook: the first read clips the front page for 3 Acorns once; a new lead clips again; passed leads are back issues @w1', async ({ page }) => {
  await boot(page, null, s => { s.money = 10; });
  await openNews(page);
  await expect(page.locator('.news-stamp')).toHaveText('CLIPPED TO YOUR SCRAPBOOK · +3 ACORNS');
  let st = await page.evaluate(() => ({ money: PixelPets.state.money, clips: PixelPets.state.newsClips }));
  expect(st.money).toBe(13);
  expect(st.clips.filter(c => !c.back)).toHaveLength(1);   // the front page read now; earlier leads come in as back issues
  await page.locator('#phoneClose').click();
  await openNews(page);   // the same edition again: no second payment, no stamp
  await expect(page.locator('.news-stamp')).toHaveCount(0);
  expect(await page.evaluate(() => PixelPets.state.money)).toBe(13);
  await page.locator('#phoneClose').click();
  await page.evaluate(flags => { for (const k of Object.keys(flags)) PixelPets.setFlag(k, true); }, MID);
  await openNews(page);
  await expect(page.locator('.news-stamp')).toBeVisible();
  st = await page.evaluate(({ MID }) => {
    const S = PixelPets.state, N = MAPDATA.news;
    const leads = S.newsClips.map(c => N.stories.find(x => x.id === c.id));
    return { money: S.money, n: S.newsClips.length, paid: S.newsClips.filter(c => !c.back).length,
      allLeads: leads.every(x => x && typeof x.lead === 'number'),
      reached: leads.every(x => PPRibbit.passes(x.when, S.flags, 'keepers')) };
  }, { MID });
  expect(st.money).toBe(16);
  expect(st.paid).toBe(2);
  expect(st.n).toBeGreaterThan(2);
  expect(st.allLeads).toBe(true);
  expect(st.reached).toBe(true);
  await tab(page, 'you');
  const clips = page.locator('.news-clip');
  await expect(clips).toHaveCount(st.n);
  await expect(page.locator('.news-clip-back')).toHaveCount(st.n - 2);
  const order = await page.evaluate(() => [...document.querySelectorAll('.news-clip')].map(el => MAPDATA.news.stories.find(x => x.id === el.dataset.id).lead));
  expect(order).toEqual([...order].sort((a, b) => a - b));
  await clips.first().locator('.news-clip-head').click();
  await expect(clips.first().locator('.news-more')).toBeVisible();
  const small = await page.evaluate(() => [...document.querySelectorAll('.news-clip-head')].filter(b => b.getBoundingClientRect().height < 44).length);
  expect(small).toBe(0);
  await shot(page, 'news-scrapbook');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  await installSave(page.context(), Object.assign(saved, { flags: Object.assign(saved.flags, { 'daily.hello': '', 'daily.warm_bowl': '' }) }), { quietDay: true });
  await page.reload();
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => { PixelPets.clock.set('fri', 9, 0); PixelPets.showTab('walk'); });
  await openNews(page);
  expect(await page.evaluate(() => ({ n: PixelPets.state.newsClips.length, money: PixelPets.state.money }))).toEqual({ n: st.n, money: 16 });
});

test('one bar of signal thins the briefs @w1', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.goto('route2_glen'));
  await page.waitForFunction(() => PixelPets.mapInfo.id === 'route2_glen' && !PixelPets.fading);
  await openNews(page);
  await expect(page.locator('.news-foot')).toHaveText("Block News rides the Keeper wires. One bar: today's paper is thin here.");
  const n = await page.evaluate(({ EARLY, BASE }) => PPNews.edition(Object.assign({}, BASE, { flags: EARLY, signal: 1 })).briefs.length, { EARLY, BASE });
  expect(n).toBeLessThanOrEqual(1);
});

test('old saves load: no NEWS fields is fine, junk ones (incl. the scrapbook) are dropped, v stays 2 @w1', async ({ page }) => {
  await boot(page, null, s => {
    s.newsSeen = { bad: true }; s.newsTab = 'sports'; s.newsPoll = { day: 'x', id: 7, pick: 9 };
    s.newsClips = [{ id: 'nw-hearthmoor-morning', day: '2026-10-01' }, { id: 'nw-hearthmoor-morning', day: '2026-10-02' }, { id: 5 }, 'junk', { id: 'x', day: 'soon' }];
  });
  const st = await page.evaluate(() => ({ v: PixelPets.state.v, seen: PixelPets.state.newsSeen, tab: PixelPets.state.newsTab, poll: PixelPets.state.newsPoll, clips: PixelPets.state.newsClips }));
  expect(st).toEqual({ v: 2, seen: undefined, tab: undefined, poll: undefined, clips: [{ id: 'nw-hearthmoor-morning', day: '2026-10-01' }] });
  await openNews(page);
  await expect(page.locator('.news-tab.news-on')).toHaveAttribute('data-tab', 'front');
  expect(typeof (await page.evaluate(() => PixelPets.state.newsSeen))).toBe('string');
});
