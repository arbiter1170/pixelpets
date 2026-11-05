/* LORE_COPY_WINE (B-7, B-8; Vincent, Nov 3, 2026). Player text only, plus one cast tag.
   D1434: Glimmerwell supporters wear wine vests, so no player line says "mint vest" (or mint coat / collar), and no
   Glimmerwell banner line names a colour. D1448: "Partner Day" is only the Keepers' starter day (Rook's Glimmerwell teaser
   names it as the day he was late to, STORY_LINES D2136; no other Glimmer line says it) and the Glimmer tag is a lanyard, never a "cord". D1437: Hall Masters are neutral:
   no Keepers tag on Fen, Hale or Marisol, and "Master" still shows first. Save stays pixelpets.save.v2, v 2, unchanged. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, shot } = require('./helpers');

trackErrors(test, expect);

const ROOK = 'Yeah, I\'m in too. Since spring. Late on Partner Day, the jingle, the wine sticker: that was all them.';   // D2136
const LANYARD = 'Quarter closed. Bright Tier 3 Lanyard. Three marks, one lanyard.';
const CALLOWAY = 'If you see Rook, tell him supper keeps. And that his friend in a wine vest called again.';

function save() {
  const s = starterSave();
  s.settings.tips = false;
  s.settings.follower = false;
  return s;
}

async function boot(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), save(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true && typeof window.PixelPets.runSteps === 'function');
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => PixelPets.showTab('walk'));
}

// The live save state (normalized at boot) plus the stored copy's version.
const stored = (page) => page.evaluate(() => {
  const raw = localStorage.getItem('pixelpets.save.v2');
  return JSON.stringify({ state: PixelPets.state, storedV: raw ? JSON.parse(raw).v : null });
});

// Save unchanged: still v 2, the same top-level keys and the same flags (bar the ones a step is allowed to write).
function sameSave(beforeRaw, afterRaw, allow = []) {
  const W = JSON.parse(beforeRaw), N = JSON.parse(afterRaw), was = W.state, now = N.state;
  expect(now.v).toBe(2);
  expect(N.storedV).toBe(2);
  expect(Object.keys(now).sort()).toEqual(Object.keys(was).sort());
  const f = (o) => { const c = Object.assign({}, o.flags); for (const k of allow) delete c[k]; return c; };
  expect(f(now)).toEqual(f(was));
  const ids = (p) => (p || []).map((w) => [w.id, w.species, w.stage, w.xp]);
  expect(ids(now.party)).toEqual(ids(was.party));   // care stats tick with time; the party itself is the same
}

// One say step at this width: the line fits the dialog box and the box is on screen.
async function sayFits(page, who, text, name) {
  expect(await page.evaluate(([w, t]) => PixelPets.runSteps([['say', w, t]]), [who, text])).toBe(true);
  await page.waitForFunction(() => !!(window.PixelPets.scene && window.PixelPets.scene.full));
  const r = await page.evaluate(() => {
    const el = document.querySelector('#sbText'), box = document.querySelector('#sbox').getBoundingClientRect();
    return {
      text: el.textContent, who: document.querySelector('#sbWho').textContent,
      fits: el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1,
      on: box.top >= -1 && box.bottom <= window.innerHeight + 1 && box.left >= -1 && box.right <= window.innerWidth + 1,
    };
  });
  if (name) await shot(page, name + '-' + page.viewportSize().width);
  await page.evaluate(() => PixelPets.endScene());
  expect(r.fits, text).toBe(true);
  expect(r.on, text).toBe(true);
  return r;
}

test('D1434: no player line in data or on the map says mint vest, mint coat or mint collar; banners name no colour', async ({ page }) => {
  await boot(page);
  const before = await stored(page);
  const r = await page.evaluate(() => {
    const hits = [];
    const walk = (node, path) => {
      if (typeof node === 'string') { if (/\bmint[- ](vests?|coats?|collar)\b/i.test(node)) hits.push(path + ': ' + node); return; }
      if (Array.isArray(node)) { node.forEach((n, i) => walk(n, path + '[' + i + ']')); return; }
      if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) if (k[0] !== '_') walk(v, path + '.' + k);
    };
    for (const [k, v] of Object.entries(MAPDATA)) walk(v, k);
    const live = [];
    for (const [id, m] of Object.entries(window.WORLD)) for (const o of (m && m.objs) || []) {
      for (const t of Object.values((o && o.lines) || {})) if (typeof t === 'string' && /\bmint[- ]?(vests?|coats?|collar)\b|\bin mint\b|\bthe mint\b/i.test(t)) live.push(id + ':' + o.id + ': ' + t);
    }
    const banners = [];
    const scan = (node) => {
      if (typeof node === 'string') { if (/Glimmerwell banner/i.test(node) && /\b(black|red|mint|wine|white|cyan|teal)\b/i.test(node)) banners.push(node); return; }
      if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) if (k[0] !== '_') scan(v);
    };
    for (const k of Object.keys(MAPDATA)) if (k !== 'cobblecrest' && k !== 'interiors' && k !== 'maps_slice' && k !== 'act1_route2') scan(MAPDATA[k]);
    let calloway = null;
    for (const m of Object.values(window.WORLD)) for (const o of (m && m.objs) || []) if (o && o.id === 'mrs_calloway') calloway = o.lines.else;
    return {
      hits, live, banners, calloway,
      wine: [MAPDATA.news, MAPDATA.ribbit_posts, MAPDATA.town_board, MAPDATA.civic].map((d) => /wine vest/i.test(JSON.stringify(d))),
    };
  });
  expect(r.hits).toEqual([]);
  expect(r.live).toEqual([]);
  expect(r.banners).toEqual([]);
  expect(r.calloway).toBe(CALLOWAY);
  expect(r.wine).toEqual([true, true, true, true]);
  // The re-voiced lines still fit one dialog page here.
  await sayFits(page, 'Mrs. Calloway', CALLOWAY, 'lore-wine-calloway');
  await sayFits(page, 'Captain Lumen', 'A wine vest is asked to leave. Rank is not a secret here.');
  await sayFits(page, 'Master Fen', 'You chose the wine vest. My trees still need a hand.');
  sameSave(before, await stored(page));
});

test('D1448, D2136: Rook was late on Partner Day on the Glimmerwell path too; the Tier 3 line says lanyard; no player cord for the tag', async ({ page }) => {
  await boot(page);
  const before = await stored(page);
  const r = await page.evaluate(() => {
    const says = [];
    const walk = (node) => {
      if (!Array.isArray(node)) { if (node && typeof node === 'object') Object.values(node).forEach(walk); return; }
      if (node[0] === 'say' && typeof node[2] === 'string') says.push(node[2]);
      node.forEach(walk);
    };
    walk(MAPDATA.glimmer_path.scenes);
    walk(MAPDATA.detail_zz_brinewick.scenes);
    walk(MAPDATA.rook_crossroads.scenes);
    const lines = [];
    const strings = (node) => {
      if (typeof node === 'string') lines.push(node);
      else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) if (k[0] !== '_' && k !== 'flags') strings(v);
    };
    strings(MAPDATA.glimmer_path); strings(MAPDATA.detail_zz_brinewick); strings(MAPDATA.rook_crossroads);
    return {
      teaser: MAPDATA.glimmer_path.scenes['teaser@glimmer'].filter((s) => s[0] === 'say').map((s) => s[2]),
      lanyard: says.includes('Quarter closed. Bright Tier 3 Lanyard. Three marks, one lanyard.'),
      cords: lines.filter((t) => /\bcords?\b/i.test(t)),
      partner: says.filter((t) => /partner day/i.test(t)),
    };
  });
  expect(r.teaser).toContain(ROOK);
  expect(r.partner).toEqual([ROOK]);   // D2136: only Rook's teaser, the Keepers' starter day he was late to
  expect(r.lanyard).toBe(true);
  expect(r.cords).toEqual([]);
  await page.evaluate(() => PixelPets.setSide('glimmer'));
  const rook = await sayFits(page, 'Rook', ROOK, 'lore-wine-rook');
  expect(rook.text).toBe(ROOK);
  await sayFits(page, 'Associate Hollis', LANYARD, 'lore-wine-lanyard');
  sameSave(before, await stored(page), ['story.side']);   // setSide writes story.side only
});

test('D1437: Hall Masters are neutral, not Keepers, and still show Master first', async ({ page }) => {
  await boot(page);
  const before = await stored(page);
  const r = await page.evaluate(() => {
    const cast = MAPDATA.reputation.cast;
    const row = (n) => { const e = cast.find((c) => c.name === n); return e ? [e.faction, e.rank, e.given] : null; };
    PixelPets.setSide('glimmer');
    const glim = ['Master Fen', 'Master Hale', 'Master Marisol'].map((n) => PixelPets.repEffective(n) - PixelPets.repGet(n));
    return {
      fen: row('Master Fen'), hale: row('Master Hale'), marisol: row('Master Marisol'), plainHale: row('Hale'),
      keeperMasters: cast.filter((e) => e.faction === 'keepers' && e.rank === 'Master').map((e) => e.name),
      shown: ['Fen', 'Hale', 'Marisol', 'Master Marisol'].map((n) => PixelPets.shownName(n)),
      glim,
      check: PixelPets.rankCheck(),
    };
  });
  expect(r.fen).toEqual(['none', 'Master', 'Fen']);
  expect(r.hale).toEqual(['none', 'Master', 'Hale']);
  expect(r.marisol).toEqual(['none', 'Master', 'Marisol']);
  expect(r.plainHale[0]).toBe('none');
  expect(r.keeperMasters).toEqual([]);
  expect(r.shown).toEqual(['Master Fen', 'Master Hale', 'Master Marisol', 'Master Marisol']);
  expect(r.glim).toEqual([0, 0, 0]);   // neutral: no +10 / -10 for either side
  expect(r.check.missing).toEqual([]);
  expect(r.check.bad).toEqual([]);
  expect(r.check.battle).toEqual([]);
  const tab = await sayFits(page, 'Marisol', "The tide's out. Sit a while.", 'lore-wine-marisol');
  expect(tab.who).toBe('Master Marisol');
  expect((await page.evaluate(() => PixelPets.holderLines('hall3_marisol'))).label).toBe('Master Marisol');
  sameSave(before, await stored(page), ['story.side']);
});
