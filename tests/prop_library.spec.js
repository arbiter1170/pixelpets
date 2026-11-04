/* PROP_LIBRARY v0.1: the shared prop art (sprites.js PROP_LIBRARY_ART). Art only: no map places these props yet,
   so nothing a player sees changes. Widths are the Playwright projects (320, 375, 390); every boot is Modern controls.
   Save stays pixelpets.save.v2 with v 2 and no new field. */
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, withOverlay } = require('./helpers');

trackErrors(test, expect);

const ROOT = path.join(__dirname, '..');
const SPRITES = fs.readFileSync(path.join(ROOT, 'sprites.js'), 'utf8');
const START = SPRITES.indexOf('const PROP_LIBRARY_ART = {');
const END = SPRITES.indexOf('\n};', START) + 3;
// The library block, read as data (no game boot).
const LIB = new Function(SPRITES.slice(START, END) + '\nreturn PROP_LIBRARY_ART;')();
const IDS = Object.keys(LIB);
const SLICES = IDS.flatMap(id => { const [w, h] = LIB[id].cells; return w * h > 1 ? Array.from({ length: w * h }, (_, i) => id + '_' + i) : []; });
const PLACES = ['floor', 'wall', 'decal', 'tile', 'water', 'roof', 'facade'];

function save() {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.follower = false;
  return s;
}

async function boot(page, overlay) {
  if (overlay) await withOverlay(page, overlay);
  await installSave(page.context(), save(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
}

test('the library block is well formed: 60+ props, sizes match cells, PAL keys only, known placements', () => {
  expect(IDS.length).toBeGreaterThanOrEqual(60);
  const PALKEYS = SPRITES.slice(SPRITES.indexOf('const PAL = {'), SPRITES.indexOf('const SPECIES')).match(/(?:^|[{,\s])'?([A-Za-z0-9])'?:'#/g)
    .map(m => m.replace(/[{,\s':#]/g, ''));
  const bad = [];
  for (const id of IDS) {
    const p = LIB[id];
    if (!/^[a-z][a-z0-9_]+$/.test(id)) bad.push(id + ': id');
    const [w, h] = p.cells;
    if (p.rows.length !== h * 16) bad.push(id + ': height ' + p.rows.length);
    if (p.rows.some(r => r.length !== w * 16)) bad.push(id + ': width');
    if (!PLACES.includes(p.place)) bad.push(id + ': place ' + p.place);
    if (typeof p.walk !== 'boolean') bad.push(id + ': walk');
    const keys = new Set(p.rows.join('').replace(/\./g, ''));
    for (const k of keys) if (!PALKEYS.includes(k)) bad.push(id + ': key ' + k);
    if (!keys.size) bad.push(id + ': empty');
    // D1087 / D2000: no mint on Glimmerwell pieces.
    if (/glimmer|brightgate/.test(id + ' ' + p.set) && (keys.has('s') || keys.has('l'))) bad.push(id + ': mint');
  }
  expect(bad).toEqual([]);
});

test('no library id or slice id collides with another name in the repo', () => {
  const files = ['game.js', 'keeper.js', 'glimmer_fleet.js', 'battle_bg.js', 'quests.js', 'data/mapdata.js', 'data/hc_city_v2.js', 'data/nav_art.js']
    .map(f => [f, fs.readFileSync(path.join(ROOT, f), 'utf8')]);
  files.push(['sprites.js (outside the library)', SPRITES.slice(0, START) + SPRITES.slice(END)]);
  const hits = [];
  for (const id of IDS.concat(SLICES)) {
    const re = new RegExp('[\'"`.]' + id + '[\'"`:\\s,)\\]]');
    for (const [f, src] of files) if (re.test(src)) hits.push(id + ' in ' + f);
  }
  expect(hits).toEqual([]);
  expect(new Set(IDS.concat(SLICES)).size).toBe(IDS.length + SLICES.length);
});

test('every prop and slice renders from PAL colours only, at its size, and no earlier art owns its name', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    const A = buildWorldArt(), T = buildTiles();
    const before = new Set(Object.keys(A).concat(Object.keys(T)));
    addExteriorArt(T, A, true);
    const hex = new Set(Object.values(PAL).map(h => h.toLowerCase()));
    const out = { missing: [], size: [], colour: [], drift: [], taken: [], slices: [], total: 0 };
    const px = c => c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    for (const [id, p] of Object.entries(PROP_LIBRARY_ART)) {
      if (before.has(id)) out.taken.push(id);
      const c = A[id];
      if (!c) { out.missing.push(id); continue; }
      const [w, h] = p.cells;
      if (c.width !== w * 16 || c.height !== h * 16) out.size.push(id + ' ' + c.width + 'x' + c.height);
      const d = px(c);
      for (let i = 0; i < d.length; i += 4) {
        const x = (i / 4) % c.width, y = Math.floor(i / 4 / c.width), ch = p.rows[y][x];
        if (d[i + 3] === 0) { if (ch !== '.') out.drift.push(id + ' ' + x + ',' + y); continue; }
        const hx = '#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('');
        if (d[i + 3] !== 255 || !hex.has(hx)) out.colour.push(id + ' ' + hx);
        else if (PAL[ch] && PAL[ch].toLowerCase() !== hx) out.drift.push(id + ' ' + x + ',' + y);
      }
      out.total++;
      if (w * h > 1) for (let n = 0; n < w * h; n++) {
        const sid = id + '_' + n, s = A[sid];
        if (before.has(sid)) out.taken.push(sid);
        if (!s || s.width !== 16 || s.height !== 16) { out.slices.push(sid); continue; }
        const sd = px(s), cx = (n % w) * 16, cy = Math.floor(n / w) * 16;
        for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
          const a = (y * 16 + x) * 4, b = ((cy + y) * c.width + cx + x) * 4;
          if (sd[a] !== d[b] || sd[a + 1] !== d[b + 1] || sd[a + 2] !== d[b + 2] || sd[a + 3] !== d[b + 3]) { out.slices.push(sid + ' ' + x + ',' + y); y = 16; break; }
        }
      }
    }
    out.colour = out.colour.slice(0, 10); out.drift = out.drift.slice(0, 10);
    return out;
  });
  expect(r.missing).toEqual([]);
  expect(r.taken).toEqual([]);
  expect(r.size).toEqual([]);
  expect(r.colour).toEqual([]);
  expect(r.drift).toEqual([]);
  expect(r.slices).toEqual([]);
  expect(r.total).toBe(IDS.length);
});

// A test-only room (an overlay, never shipped) places every prop as the game would: whole for one cell, sliced for more.
function showroom() {
  const W = 26;
  const objs = [];
  let x = 1, y = 3, rowH = 1;
  for (const id of IDS) {
    const [w, h] = LIB[id].cells;
    if (x + w > W - 1) { x = 1; y += rowH + 1; rowH = 1; }
    if (w * h === 1) objs.push({ kind: 'prop', id: 'plt_' + id, x, y, sprite: id });
    else for (let cy = 0; cy < h; cy++) for (let cx = 0; cx < w; cx++) objs.push({ kind: 'prop', id: 'plt_' + id + '_' + (cy * w + cx), x: x + cx, y: y + cy, sprite: id + '_' + (cy * w + cx) });
    x += w + 1; rowH = Math.max(rowH, h);
  }
  const H = y + rowH + 3;
  const grid = ['#'.repeat(W), '#' + 'W'.repeat(W - 2) + '#'];
  for (let r = 2; r < H - 1; r++) grid.push('#' + '.'.repeat(W - 2) + '#');
  grid.push('#'.repeat(W >> 1) + 'm' + '#'.repeat(W - (W >> 1) - 1));
  return { maps: { zz_prop_showroom: { name: 'Prop showroom (test only)', kind: 'interior', outdoor: 'hearthmoor', skin: 'house_home', w: W, h: H,
    spawns: null, zones: [], safe: { x: W >> 1, y: H - 2 }, grid,
    objs: objs.concat([{ kind: 'warp', id: 'plt_mat', x: W >> 1, y: H - 1, to: 'hearthmoor', tx: 3, ty: 5, facing: 'down' }]) } } };
}

test('a test room with every prop draws in the walk view with no console errors, and the save stays v2', async ({ page }) => {
  await boot(page, showroom());
  await page.evaluate(() => PixelPets.showTab('walk'));
  const H = showroom().maps.zz_prop_showroom.h;
  for (const yy of [H - 2, Math.floor(H / 2), 3]) {
    await page.evaluate(([y]) => PixelPets.goto('zz_prop_showroom', 13, y, 'down'), [yy]);
    await page.waitForTimeout(250);
  }
  const info = await page.evaluate(() => PixelPets.mapInfo);
  expect(info.id).toBe('zz_prop_showroom');
  const drawn = await page.evaluate(() => {
    const c = document.querySelector('#mapCanvas'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    const seen = new Set(); for (let i = 0; i < d.length; i += 16) seen.add(d[i] + ',' + d[i + 1] + ',' + d[i + 2]);
    return seen.size;
  });
  expect(drawn).toBeGreaterThan(12);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2') || 'null'));
  if (saved) expect(saved.v).toBe(2);
});

test('main maps place no library prop yet (art only; rooms adopt it in their own builds)', () => {
  const md = fs.readFileSync(path.join(ROOT, 'data/mapdata.js'), 'utf8') + fs.readFileSync(path.join(ROOT, 'data/hc_city_v2.js'), 'utf8');
  const used = IDS.concat(SLICES).filter(id => md.includes('"' + id + '"'));
  expect(used).toEqual([]);
});
