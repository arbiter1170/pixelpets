/* PROP_LIBRARY v0.2: the second prop pass (sprites.js PROP_LIBRARY_2_ART), 60 props, mostly interiors: clocks, desks,
   in-world machines, wall pieces and Walkling care, themed by faction. Art only: no map places these props, so nothing a
   player sees changes. Widths are the Playwright projects (320, 375, 390); every boot is Modern controls. A few pieces
   animate (2 frames, slow) and reduced motion holds frame 0. Save stays pixelpets.save.v2 with v 2 and no new field. */
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, withOverlay } = require('./helpers');

trackErrors(test, expect);

const ROOT = path.join(__dirname, '..');
const SPRITES = fs.readFileSync(path.join(ROOT, 'sprites.js'), 'utf8');
function blockRange(name) {
  const start = SPRITES.indexOf('const ' + name + ' = {');
  return [start, SPRITES.indexOf('\n};', start) + 3];
}
const [START, END] = blockRange('PROP_LIBRARY_2_ART');
const [START1, END1] = blockRange('PROP_LIBRARY_ART');
// The library block, read as data (no game boot).
const LIB = new Function(SPRITES.slice(START, END) + '\nreturn PROP_LIBRARY_2_ART;')();
const LIB1 = new Function(SPRITES.slice(START1, END1) + '\nreturn PROP_LIBRARY_ART;')();
const IDS = Object.keys(LIB);
const SLICES = IDS.flatMap(id => { const [w, h] = LIB[id].cells; return w * h > 1 ? Array.from({ length: w * h }, (_, i) => id + '_' + i) : []; });
const PHASES = IDS.flatMap(id => Object.keys(LIB[id].phases || {}).map(ph => id + '_' + ph));
const NAMES = IDS.concat(SLICES, PHASES);
const PLACES = ['floor', 'wall', 'decal', 'tile', 'water', 'roof', 'facade'];
const PREFIX = { clock: 'pt_', desk: 'pf_', machine: 'pm_', wall2: 'pu_', care: 'po_', home: 'ph_', kiln: 'pw_' };
const ANIMATED = IDS.filter(id => LIB[id].frames);

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

test('the v0.2 block is well formed: 50-60 props, set prefixes, sizes match in every frame, PAL keys only, no mint anywhere', () => {
  expect(IDS.length).toBeGreaterThanOrEqual(50);
  expect(IDS.length).toBeLessThanOrEqual(60);
  const PALKEYS = SPRITES.slice(SPRITES.indexOf('const PAL = {'), SPRITES.indexOf('const SPECIES')).match(/(?:^|[{,\s])'?([A-Za-z0-9])'?:'#/g)
    .map(m => m.replace(/[{,\s':#]/g, ''));
  const bad = [];
  for (const id of IDS) {
    const p = LIB[id];
    if (!/^[a-z][a-z0-9_]+$/.test(id) || /_\d+$/.test(id)) bad.push(id + ': id');
    if (!PREFIX[p.set] || !id.startsWith(PREFIX[p.set])) bad.push(id + ': prefix for set ' + p.set);
    if (!PLACES.includes(p.place)) bad.push(id + ': place ' + p.place);
    if (typeof p.walk !== 'boolean' || p.walk !== (p.place === 'decal' || p.place === 'tile')) bad.push(id + ': walk');
    const [w, h] = p.cells;
    const all = [p.rows].concat(p.frames || [], Object.values(p.phases || {}));
    const keys = new Set();
    for (const rows of all) {
      if (rows.length !== h * 16 || rows.some(r => r.length !== w * 16)) bad.push(id + ': size');
      for (const k of rows.join('').replace(/\./g, '')) keys.add(k);
      if (p.place === 'wall' && rows.slice(13, 16).some(r => /[^.]/.test(r))) bad.push(id + ': wall piece reaches the baseboard');
      if (p.place === 'floor' && !rows.slice(-3).some(r => /[^.]/.test(r))) bad.push(id + ': floats above the floor line');
    }
    for (const k of keys) if (!PALKEYS.includes(k) || /[1-6]/.test(k)) bad.push(id + ': key ' + k);
    if (!keys.size) bad.push(id + ': empty');
    // No mint anywhere in v0.2; Glimmerwell is wine and soot (D1087, D2000), and its keys stay on Glimmerwell pieces.
    if (keys.has('s') || keys.has('l')) bad.push(id + ': mint');
    const glim = p.theme === 'glimmer';
    if (glim && (keys.has('c') || !(keys.has('V') || keys.has('N')))) bad.push(id + ': Glimmerwell palette');
    if (!glim && ['V', 'N', 'Q'].some(k => keys.has(k))) bad.push(id + ': Glimmerwell keys off Glimmerwell');
    if (p.frames && (p.frames.length > 2 || !(p.ms >= 400))) bad.push(id + ': animation 2-3 frames, 400 ms or slower');
  }
  expect(bad).toEqual([]);
  expect(ANIMATED.length).toBeGreaterThan(0);
  expect(ANIMATED.length).toBeLessThanOrEqual(8);
});

test('no v0.2 name (id, slice or time-of-day face) collides with v0.1 or any other name in the repo', () => {
  const v1 = new Set(Object.keys(LIB1).flatMap(id => { const [w, h] = LIB1[id].cells; return [id].concat(w * h > 1 ? Array.from({ length: w * h }, (_, i) => id + '_' + i) : []); }));
  expect(NAMES.filter(n => v1.has(n))).toEqual([]);
  const files = ['game.js', 'keeper.js', 'glimmer_fleet.js', 'battle_bg.js', 'quests.js', 'data/mapdata.js', 'data/hc_city_v2.js', 'data/nav_art.js']
    .map(f => [f, fs.readFileSync(path.join(ROOT, f), 'utf8')]);
  files.push(['sprites.js (outside the v0.2 block)', SPRITES.slice(0, START) + SPRITES.slice(END)]);
  const hits = [];
  for (const id of NAMES) {
    const re = new RegExp('[\'"`.]' + id + '[\'"`:\\s,)\\]]');
    for (const [f, src] of files) if (re.test(src)) hits.push(id + ' in ' + f);
  }
  expect(hits).toEqual([]);
  expect(new Set(NAMES).size).toBe(NAMES.length);
});

test('every v0.2 prop, frame, slice and face renders from PAL colours only, at its size, and no earlier art owns its name', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    const A = buildWorldArt(), T = buildTiles();
    const before = new Set(Object.keys(A).concat(Object.keys(T)));
    addExteriorArt(T, A, true);
    const hex = new Set(Object.values(PAL).map(h => h.toLowerCase()));
    const out = { missing: [], size: [], colour: [], drift: [], taken: [], slices: [], frames: [], total: 0 };
    const px = c => c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    const compare = (id, c, rows) => {
      const d = px(c);
      for (let i = 0; i < d.length; i += 4) {
        const x = (i / 4) % c.width, y = Math.floor(i / 4 / c.width), ch = rows[y][x];
        if (d[i + 3] === 0) { if (ch !== '.') out.drift.push(id + ' ' + x + ',' + y); continue; }
        const hx = '#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('');
        if (d[i + 3] !== 255 || !hex.has(hx)) out.colour.push(id + ' ' + hx);
        else if (PAL[ch] && PAL[ch].toLowerCase() !== hx) out.drift.push(id + ' ' + x + ',' + y);
      }
      return d;
    };
    for (const [id, p] of Object.entries(PROP_LIBRARY_2_ART)) {
      if (before.has(id)) out.taken.push(id);
      const art = A[id];
      if (!art) { out.missing.push(id); continue; }
      const [w, h] = p.cells;
      const frames = p.frames ? art : [art];
      if (p.frames && (!Array.isArray(art) || art.length !== p.frames.length + 1 || art.ms !== p.ms)) out.frames.push(id);
      [p.rows].concat(p.frames || []).forEach((rows, f) => {
        const c = frames[f];
        if (!c || c.width !== w * 16 || c.height !== h * 16) { out.size.push(id + ' frame ' + f); return; }
        compare(id + ' f' + f, c, rows);
      });
      for (const [ph, rows] of Object.entries(p.phases || {})) {
        const c = A[id + '_' + ph];
        if (before.has(id + '_' + ph)) out.taken.push(id + '_' + ph);
        if (!c || c.width !== w * 16 || c.height !== h * 16) out.size.push(id + '_' + ph); else compare(id + '_' + ph, c, rows);
      }
      out.total++;
      const c0 = frames[0], d = c0 && px(c0);
      if (d && w * h > 1) for (let n = 0; n < w * h; n++) {
        const sid = id + '_' + n, s = A[sid];
        if (before.has(sid)) out.taken.push(sid);
        if (!s || s.width !== 16 || s.height !== 16) { out.slices.push(sid); continue; }
        const sd = px(s), cx = (n % w) * 16, cy = Math.floor(n / w) * 16;
        for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
          const a = (y * 16 + x) * 4, b = ((cy + y) * c0.width + cx + x) * 4;
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
  expect(r.frames).toEqual([]);
  expect(r.colour).toEqual([]);
  expect(r.drift).toEqual([]);
  expect(r.slices).toEqual([]);
  expect(r.total).toBe(IDS.length);
});

// A test-only room (an overlay, never shipped) places every v0.2 prop as a room build would (D2037): whole art for one
// cell or one-wide tall props on the base cell, slices for wider ones, wall pieces on the face row.
function showroom() {
  const W = 26;
  const objs = [];
  let wx = 1, x = 1, y = 3, rowH = 1;
  for (const id of IDS) {
    const p = LIB[id], [w, h] = p.cells, kind = p.place === 'decal' ? 'decal' : 'prop';
    if (p.place === 'wall' && wx + w <= W - 1) {   // the face row, while it has room
      for (let cx = 0; cx < w; cx++) objs.push({ kind, id: 'plt2_' + id + '_' + cx, x: wx + cx, y: 1, sprite: w > 1 ? id + '_' + cx : id });
      wx += w;
      continue;
    }
    if (x + w > W - 1) { x = 1; y += rowH + 1; rowH = 1; }
    if (w * h === 1) objs.push({ kind, id: 'plt2_' + id, x, y, sprite: id });
    else if (w === 1) objs.push({ kind, id: 'plt2_' + id, x, y: y + h - 1, sprite: id });
    else for (let cy = 0; cy < h; cy++) for (let cx = 0; cx < w; cx++) objs.push({ kind, id: 'plt2_' + id + '_' + (cy * w + cx), x: x + cx, y: y + cy, sprite: id + '_' + (cy * w + cx) });
    x += w + 1; rowH = Math.max(rowH, h);
  }
  const H = y + rowH + 3;
  const grid = ['#'.repeat(W), '#' + 'W'.repeat(W - 2) + '#'];
  for (let r = 2; r < H - 1; r++) grid.push('#' + '.'.repeat(W - 2) + '#');
  grid.push('#'.repeat(W >> 1) + 'm' + '#'.repeat(W - (W >> 1) - 1));
  return { maps: { zz_prop2_showroom: { name: 'Prop showroom v0.2 (test only)', kind: 'interior', outdoor: 'hearthmoor', skin: 'house_home', w: W, h: H,
    spawns: null, zones: [], safe: { x: W >> 1, y: H - 2 }, grid,
    objs: objs.concat([{ kind: 'warp', id: 'plt2_mat', x: W >> 1, y: H - 1, to: 'hearthmoor', tx: 3, ty: 5, facing: 'down' }]) } } };
}

test('a test room with every v0.2 prop draws in the walk view with no console errors, and the save stays v2', async ({ page }) => {
  await boot(page, showroom());
  await page.evaluate(() => PixelPets.showTab('walk'));
  const H = showroom().maps.zz_prop2_showroom.h;
  for (const yy of [H - 2, Math.floor(H / 2), 2]) {
    await page.evaluate(([y]) => PixelPets.goto('zz_prop2_showroom', 13, y, 'down'), [yy]);
    await page.waitForTimeout(250);
  }
  const info = await page.evaluate(() => PixelPets.mapInfo);
  expect(info.id).toBe('zz_prop2_showroom');
  const drawn = await page.evaluate(() => {
    const c = document.querySelector('#mapCanvas'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    const seen = new Set(); for (let i = 0; i < d.length; i += 16) seen.add(d[i] + ',' + d[i + 1] + ',' + d[i + 2]);
    return seen.size;
  });
  expect(drawn).toBeGreaterThan(12);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2') || 'null'));
  if (saved) expect(saved.v).toBe(2);
});

test('reduced motion holds frame 0 of every animated v0.2 prop', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await boot(page);
  const r = await page.evaluate((ids) => {
    const A = buildWorldArt(), T = buildTiles();
    addExteriorArt(T, A, true);
    return ids.map(id => [id, [0, 700, 1400, 2100, 5000].every(t => artFrame(A[id], t) === A[id][0])]);
  }, ANIMATED);
  expect(r.filter(([, held]) => !held).map(([id]) => id)).toEqual([]);
});

test('main maps place no v0.2 prop yet (art only; rooms adopt it in their own builds)', () => {
  const md = fs.readFileSync(path.join(ROOT, 'data/mapdata.js'), 'utf8') + fs.readFileSync(path.join(ROOT, 'data/hc_city_v2.js'), 'utf8');
  expect(NAMES.filter(id => md.includes('"' + id + '"'))).toEqual([]);
});
