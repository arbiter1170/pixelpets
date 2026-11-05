/* NO_MINT (build card B-12; D1087 SETTLED by Vincent, Tue Nov 3, 2026: "no more mint color" for Glimmerwell, wine replaces it).
   1. No player line in data/*.json or in the JS player strings uses "mint" for Glimmerwell. The kept uses are allow-listed by
      file and id below, each with its reason (a person's name, a plant, a tea, an id, an asset note, or a verbatim design line
      that data/detail_zz_no_mint.json or detail_zz_day1.json re-voices at runtime, AGENTS rule 8).
   2. The re-voiced lines are what the game shows, and they fit one dialog page at 320, 375 and 390 (reduced motion).
   3. Glimmerwell art carries no mint pixel: the Comfort Lamp, the lantern stand, the quarry bunting and the fleet preview art.
   Zero console errors. Save stays pixelpets.save.v2, v 2, with the same keys and flags. */
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, shot } = require('./helpers');

trackErrors(test, expect);

const ROOT = path.resolve(__dirname, '..');
const MINT = /\bmint/i;
const KEPT = {
  'data/fernbrook_rooms.json': { fb_hall_t3_herbs: 'the herb (Sage, mint and something sharp)' },
  'data/heights.json': { rx4_display_a: 'a mint sprout, the plant', rx4_display_b: 'a mint sprout, the plant' },
  'data/ribbit_posts.json': { 'rp-cobblecrest-mintdesk': 'handle @mintdesk is Clerk Mint\'s desk (a name)' },
  'data/interiors.json': { mrs_calloway: 'verbatim; re-voiced by detail_zz_day1.json objPatch (D1434)' },
  'data/cobblecrest.json': {
    q_stage_l: 'verbatim; re-voiced by detail_zz_no_mint.json objPatch', quarry_buyout: 'verbatim; re-voiced by lineSwaps',
    stage_bunting: 'asset note, not player text', npc_dorian: 'asset note, not player text', rook_lanyard: 'asset note, not player text',
  },
  'data/act1_route2.json': { glimmer2: 'verbatim; re-voiced by lineSwaps', lead_intro: 'verbatim; re-voiced by lineSwaps', teaser: 'verbatim; re-voiced by lineSwaps' },
  'data/detail_zz_no_mint.json': { _swapText: 'the old verbatim line each lineSwap matches' },
  'data/look_lock.json': { fen: "Master Fen's own look note (her tunic's trim), not player text and not Glimmerwell" },
};
const JS_KEPT = { 'ribbit.js': ['mintcup'] };   // the Orchard hand's handle: a cup of mint tea, not the colour

// Every string in a data file, with the nearest id (or scene name) above it. Underscore keys are notes, not player text.
function strings(node, owner, key, out) {
  if (typeof node === 'string') { out.push({ owner, key, text: node }); return out; }
  if (Array.isArray(node)) { node.forEach((n) => strings(n, owner, key, out)); return out; }
  if (node && typeof node === 'object') {
    const own = typeof node.id === 'string' ? node.id : owner;
    for (const [k, v] of Object.entries(node)) {
      if (k[0] === '_') continue;
      const parentIsScenes = key === 'scenes';
      strings(v, parentIsScenes ? k : own, parentIsScenes ? 'scene' : k, out);
    }
  }
  return out;
}
const idLike = (t) => !/\s/.test(t);   // ids, flags and lore tags have no spaces; handles are checked on their own

test('D1087: no player line uses mint for Glimmerwell; kept uses are listed by id', async () => {
  const hits = [];
  const used = new Set();
  for (const name of fs.readdirSync(path.join(ROOT, 'data')).filter((f) => f.endsWith('.json')).sort()) {
    const file = 'data/' + name;
    const data = JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
    let all = strings(data, null, null, []);
    if (name === 'detail_zz_no_mint.json') {   // each lineSwap quotes the old line it replaces
      const old = data.lineSwaps.map((sw) => sw.text);
      all = all.filter((s) => !(s.key === 'text' && old.includes(s.text)));
      used.add(file + ':_swapText');
    }
    for (const s of all) {
      const t = s.text.replace(/Clerk Mint/g, '');
      if (!MINT.test(t)) continue;
      if (idLike(t) && s.key !== 'handle') continue;
      const kept = KEPT[file] && KEPT[file][s.owner];
      if (kept) { used.add(file + ':' + s.owner); continue; }
      hits.push(file + ' ' + s.owner + ' ' + s.key + ': ' + s.text);
    }
  }
  expect(hits).toEqual([]);
  // Every allow-list row still names a real line, so the list cannot go stale.
  for (const [file, rows] of Object.entries(KEPT)) for (const id of Object.keys(rows)) expect(used.has(file + ':' + id), file + ' ' + id).toBe(true);

  // JS player strings (comments stripped): only the listed handle.
  const jsHits = [];
  for (const file of ['ribbit.js', 'quests.js', 'standing.js', 'glimmer_fleet.js', 'news.js', 'keeper.js', 'game.js']) {
    const src = fs.readFileSync(path.join(ROOT, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');
    for (const m of src.matchAll(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g)) {
      const t = m[0].slice(1, -1).replace(/Clerk Mint/g, '');
      if (!MINT.test(t)) continue;
      const handle = /handle:\s*$/.test(src.slice(Math.max(0, m.index - 12), m.index));
      if (idLike(t) && !handle) continue;   // ids such as 'fb-mint'
      if ((JS_KEPT[file] || []).includes(t)) continue;
      jsHits.push(file + ': ' + m[0]);
    }
  }
  expect(jsHits).toEqual([]);

  // The re-voiced lines keep the length rules: 110 per line.
  const ov = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/detail_zz_no_mint.json'), 'utf8'));
  for (const sw of ov.lineSwaps) for (const st of sw.to) expect(st[2].length, st[2]).toBeLessThanOrEqual(110);
  for (const p of Object.values(ov.objPatch)) for (const v of Object.values((p && p.linesSet) || {})) expect(v.length, v).toBeLessThanOrEqual(110);
});

function mkSave(flags, seals) {
  const s = starterSave();
  s.settings.tips = false;
  s.settings.follower = false;
  Object.assign(s.flags, flags || {});
  if (seals) s.seals = Object.assign({}, seals);
  return s;
}
async function boot(page, save) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true && typeof window.PixelPets.runScene === 'function');
  await page.evaluate(() => document.fonts.ready);
}
const stored = (page) => page.evaluate(() => {
  const raw = localStorage.getItem('pixelpets.save.v2');
  return JSON.stringify({ state: PixelPets.state, storedV: raw ? JSON.parse(raw).v : null });
});
function sameSave(beforeRaw, afterRaw) {
  const was = JSON.parse(beforeRaw), now = JSON.parse(afterRaw);
  expect(now.state.v).toBe(2);
  expect(now.storedV).toBe(2);
  expect(Object.keys(now.state).sort()).toEqual(Object.keys(was.state).sort());
  expect(now.state.flags).toEqual(was.state.flags);
}
// The first full dialog page of a scene (or the n-th), then the scene is ended without running the rest.
async function scenePage(page, id, n = 0) {
  expect(await page.evaluate((s) => PixelPets.runScene(s), id), id).toBe(true);
  let got = null;
  for (let i = 0; i <= n; i++) {
    await page.waitForFunction(() => !!(window.PixelPets.scene && window.PixelPets.scene.full));
    got = await page.evaluate(() => {
      const el = document.querySelector('#sbText'), box = document.querySelector('#sbox').getBoundingClientRect();
      return { text: el.textContent, fits: el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1,
        on: box.top >= -1 && box.bottom <= window.innerHeight + 1 && box.left >= -1 && box.right <= window.innerWidth + 1 };
    });
    if (i < n) {
      const prev = got.text;
      await page.keyboard.press('Space');
      await page.waitForFunction((t) => window.PixelPets.scene && window.PixelPets.scene.full && document.querySelector('#sbText').textContent !== t, prev);
    }
  }
  await page.evaluate(() => PixelPets.endScene());
  expect(got.fits, got.text).toBe(true);
  expect(got.on, got.text).toBe(true);
  return got.text;
}
async function sayFits(page, who, text, name) {
  expect(await page.evaluate(([w, t]) => PixelPets.runSteps([['say', w, t]]), [who, text])).toBe(true);
  await page.waitForFunction(() => !!(window.PixelPets.scene && window.PixelPets.scene.full));
  const r = await page.evaluate(() => {
    const el = document.querySelector('#sbText');
    return { text: el.textContent, fits: el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1 };
  });
  if (name) await shot(page, name + '-' + page.viewportSize().width);
  await page.evaluate(() => PixelPets.endScene());
  expect(r.fits, text).toBe(true);
  return r.text;
}

test('D1087: the re-voiced verbatim lines are the ones shown, and fit one page (Keepers path)', async ({ page }) => {
  await boot(page, mkSave());
  const before = await stored(page);
  expect(await scenePage(page, 'quarry_buyout')).toBe('A crowd fills the quarry floor. Wine-and-white bunting flaps over a little stage.');
  expect(await scenePage(page, 'glimmer2')).toBe('A soft wine-red glow pulses at the top of the side path.');
  expect(await scenePage(page, 'lead_intro')).toBe('Wine-red lamps hum on tall stands. Walklings doze under them, their colours washed out.');
  expect(await scenePage(page, 'teaser', 1)).toBe('So. Being late on partner day. The jingle. The wine sticker. That was all one thing.');
  const lines = await page.evaluate(() => ({
    bunting: PixelPets.npcLine('q_stage_l'), calloway: Object.values(window.WORLD).flatMap((m) => (m && m.objs) || []).find((o) => o && o.id === 'mrs_calloway').lines.else,
    scanner: PixelPets.npcLine('rx4_scanner_w'), tank: PixelPets.npcLine('rx4_tank_a'),
    lizzy: MAPDATA.detail_zz_partner_day && JSON.stringify(MAPDATA.detail_zz_partner_day).includes('Ask him about the wine sticker.'),
  }));
  expect(lines.bunting).toBe('Bunting in Glimmerwell wine and white. It smells like new paint.');
  expect(lines.calloway).toBe('If you see Rook, tell him supper keeps. And that his friend in a wine vest called again.');
  expect(lines.scanner).toBe('The scanner glows softly as you pass. It finds nothing.');
  expect(lines.tank).toBe('The tank hums. Calm, still, very clean.');
  expect(lines.lizzy).toBe(true);
  await sayFits(page, '', lines.bunting, 'no-mint-bunting');
  await sayFits(page, '', 'Rook stands by the BRINEWICK ROAD sign. His Glimmerwell lanyard is on. He won\'t meet your eye at first.');
  sameSave(before, await stored(page));
});

test('D1087, D1448: Glimmer path lines say wine or lanyard, never mint or cord', async ({ page }) => {
  await boot(page, mkSave({ 'story.side': 'glimmer', 'story.side_pick_done': true, 'story.seal2': true }, { seal_fernbrook: 1, seal_glim_1: 1, seal_glim_2: 1 }));
  const before = await stored(page);
  expect(await page.evaluate(() => PixelPets.sceneFor('lead_intro'))).toBe('lead_intro@glimmer');
  expect(await scenePage(page, 'lead_intro')).toBe('Wine-red lamps hum. Walklings doze under them, colours washed thin.');
  const l = await page.evaluate(() => ({ miner: PixelPets.npcLine('cc_miner'), tobin: PixelPets.npcLine('tobin_gate') }));
  expect(l.miner).toBe("Hale says your lanyard's from the company, not him. His floor's still open, patient as stone.");
  expect(l.tobin).not.toMatch(/\bcord\b|\bmint\b/i);
  await sayFits(page, 'Old Miner', l.miner, 'no-mint-miner');
  await sayFits(page, 'Associate Tobin', "A Tier 2 lanyard, huh? Doesn't open this gate, sorry. Nothing does. Have a bright day!");
  await sayFits(page, 'Associate Juniper', 'Wear it everywhere. People trust a lanyard. Brighter by nature!');
  sameSave(before, await stored(page));
});

test('D1087: Glimmerwell art has no mint pixel; wine takes its place', async ({ page }) => {
  await boot(page, mkSave());
  const before = await stored(page);
  const MINT_HEX = '#a7f070', WINE = '#960e16';
  const props = await page.evaluate(() => Object.fromEntries(['comfort_lamp', 'glimmer_stand', 'stage_bunting'].map((k) => [k, PixelPets.artTally(k)])));
  for (const [k, frames] of Object.entries(props)) for (const f of frames) {
    expect(f[MINT_HEX] || 0, k + ' mint').toBe(0);
    expect(f[WINE] || 0, k + ' wine').toBeGreaterThan(0);
  }
  expect(await page.evaluate(() => PixelPets.fleetPreview('glimmer'))).toBeTruthy();
  const fleet = await page.evaluate(() => Object.fromEntries(['gw_cruiser', 'gw_cruiser_move', 'gw_concierge', 'gw_concierge_fly', 'gw_relay_mast',
    'gw_swap_stall', 'gw_swap_stall_shut', 'gw_badge', 'gw_banner', 'gw_sign', 'door_gw_bay'].map((k) => [k, PixelPets.artTally(k)])));
  await shot(page, 'no-mint-fleet-' + page.viewportSize().width);
  await page.evaluate(() => PixelPets.fleetExit());
  for (const [k, frames] of Object.entries(fleet)) {
    expect(frames, k).toBeTruthy();
    for (const f of frames) expect(f[MINT_HEX] || 0, k + ' mint').toBe(0);
  }
  sameSave(before, await stored(page));
});
