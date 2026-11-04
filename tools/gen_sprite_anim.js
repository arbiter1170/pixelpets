#!/usr/bin/env node
/* SPRITE_ANIM first pass (design specs/SPRITE_ANIM.md §4). Players never load this file.
     node tools/gen_sprite_anim.js            # rewrite the generated rows of sprite_anim.js
     node tools/gen_sprite_anim.js --tune     # also remake the by:'hand' rows from TUNE (loses hand edits)
     node tools/gen_sprite_anim.js --check    # exit 1 if a row is missing, off-size or uses a letter its stage does not
   Reads SPECIES from sprites.js. Rows marked by:'hand' in sprite_anim.js are kept byte for byte; every other form gets a
   generated row. The rules (16x16 letter grid L, built from half by mirroring, or the stage's own grid):
     breathe: drop one body row r (the row most like the row above it, in the lower half of the body, never the last
              two rows); every row above r moves down 1 px. The feet stay put.
     windup:  the rows above r move 1 px back (+x, away from the target); the eyes narrow (the top eye row closes into
              the face colour and the shine drops a row): a set look.
     strike:  the rows above r move 1 px forward (-x, toward the target); the eyes go all dark (i -> e). Not narrowed: the
              strike's stretch draws the sprite 17 px high and a one-row eye can fall in the dropped row.
     hit:     breathe's drop, then the rows above r move 1 px back; the eyes squeeze shut (the blink rule). A flinch only.
     happy:   eyes close upward (the top eye pixel of each column dark, the rest the face colour), a smile-eyes look.
   A pixel pushed past the 16 px edge stays on the edge pixel. A frame that is still mirror-symmetric is stored as half;
   a lean is stored as full (16 columns of the stage's own letters). Grid stages (PAL keys) keep grid frames, eyes untouched. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = process.env.GAME_DIR || path.join(__dirname, '..');
const OUT = path.join(ROOT, 'sprite_anim.js');
const FRAMES = ['breathe', 'windup', 'strike', 'hit', 'happy'];

function loadSpecies() {
  const src = fs.readFileSync(path.join(ROOT, 'sprites.js'), 'utf8') + '\n;globalThis.__S = { SPECIES, PAL };';
  const fake = () => new Proxy(function () {}, { get: (t, k) => (k === 'width' || k === 'height' ? 18 : fake()), apply: () => fake(), construct: () => fake() });
  const ctx = { console, document: fake(), window: {}, Image: function () {}, navigator: {} }; ctx.globalThis = ctx;
  vm.createContext(ctx); vm.runInContext(src, ctx);
  return ctx.__S;
}
function loadExisting() {
  if (!fs.existsSync(OUT)) return {};
  const ctx = { console, window: {} }; ctx.globalThis = ctx; vm.createContext(ctx);
  try { vm.runInContext(fs.readFileSync(OUT, 'utf8') + '\n;globalThis.__A = SPRITE_ANIM;', ctx); return ctx.__A || {}; } catch (e) { return {}; }
}

const EMPTY = () => '................'.split('');
const isEye = (ch) => ch === 'e' || ch === 'i';
function grid16(st) {
  if (st.grid) return st.grid.map((r) => (String(r) + '................').slice(0, 16).split(''));
  return st.half.map((h) => { h = (h + '........').slice(0, 8); return (h + h.split('').reverse().join('')).split(''); });
}
const clone = (G) => G.map((r) => r.slice());
const used = (row) => row.some((c) => c !== '.');
function bounds(G) {
  let top = 16, bot = -1, eyeTop = 16, eyeBot = -1;
  G.forEach((r, y) => { if (used(r)) { top = Math.min(top, y); bot = Math.max(bot, y); } if (r.some(isEye)) { eyeTop = Math.min(eyeTop, y); eyeBot = Math.max(eyeBot, y); } });
  return { top, bot, eyeTop, eyeBot };
}
const ham = (a, b) => a.reduce((n, c, i) => n + (c !== b[i] ? 1 : 0), 0);
// The row breathe drops: the body row most like the one above it, in the lower half of the body, above the last two rows.
function cutRow(G, grid) {
  const b = bounds(G), h = b.bot - b.top;
  let lo = Math.max(b.top + 1, b.top + Math.round(h * 0.45));
  if (!grid && b.eyeBot >= 0) lo = Math.max(lo, b.eyeBot + 2);
  let hi = b.bot - 2; if (hi < lo) lo = hi = Math.max(b.top + 1, b.bot - 1);
  const mid = (lo + hi) / 2;
  let best = lo, bs = 1e9;
  for (let r = lo; r <= hi; r++) { const s = ham(G[r], G[r - 1]) * 10 + Math.abs(r - mid); if (s < bs) { bs = s; best = r; } }
  return best;
}
function duck(G, r) { const N = clone(G); for (let y = r; y >= 1; y--) N[y] = G[y - 1].slice(); N[0] = EMPTY(); return N; }
function lean(G, r, dx) {
  const N = clone(G);
  for (let y = 0; y < r; y++) {
    const row = G[y], out = EMPTY();
    for (let x = 0; x < 16; x++) { const nx = x + dx; if (row[x] === '.') continue; if (nx >= 0 && nx < 16) out[nx] = row[x]; }
    if (dx > 0 && row[15] !== '.') out[15] = row[15];   // the edge pixel stays on the edge
    if (dx < 0 && row[0] !== '.') out[0] = row[0];
    N[y] = out;
  }
  return N;
}
// The face colour an eye closes into: the commonest letter touching the eye (not an eye, not empty); a if none.
function faceOf(G) {
  const n = {};
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (isEye(G[y][x]))
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const c = (G[y + dy] || [])[x + dx]; if (c && c !== '.' && !isEye(c)) n[c] = (n[c] || 0) + 1; }
  let best = 'a', bn = 0; for (const k in n) if (n[k] > bn) { bn = n[k]; best = k; }
  return best;
}
function eyes(G, how) {
  const N = clone(G), face = faceOf(G);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const ch = G[y][x]; if (!isEye(ch)) continue;
    const up = y > 0 && isEye(G[y - 1][x]), down = y < 15 && isEye(G[y + 1][x]);
    if (how === 'set') N[y][x] = 'e';                       // all dark, two rows: survives the strike's 18 -> 17 px squash
    else if (how === 'focus') {                                  // narrowed: the top eye row closes, the shine drops a row
      if (!up && down) { N[y][x] = face; if (ch === 'i') { let yy = y + 1; while (yy < 15 && isEye(G[yy + 1][x])) yy++; N[yy][x] = 'i'; } }
    }
    else if (how === 'shut') N[y][x] = down ? face : 'e';     // the blink rule: the lid comes down to the lowest eye row
    else if (how === 'happy') N[y][x] = up ? face : 'e';      // the lid line sits on the top eye row
  }
  return N;
}
// A curved lean (hand rows, TUNE.curve): the rows above the eyes move 2 px, the eyes and body 1 px. Falls back to 1 px
// if the 2 px rows would leave the 16 px box.
function bend(G, r, dx, curve) {
  const b = bounds(G);
  if (!curve || b.eyeTop >= 16) return lean(G, r, dx);
  const one = lean(G, r, dx), top = b.eyeTop;
  for (let y = 0; y < top; y++) for (let x = 0; x < 16; x++) if (G[y][x] !== '.' && (x + 2 * dx < 0 || x + 2 * dx > 15)) return one;
  return lean(one, top, dx);
}
function frames(st, tune) {
  tune = tune || {};
  const grid = !!st.grid, G = grid16(st), r = tune.cut || cutRow(G, grid);
  const E = (g, how) => (grid ? g : eyes(g, how));
  const D = duck(G, r);
  return {
    breathe: D,
    windup: E(bend(G, r, 1, tune.curve), 'focus'),
    strike: E(bend(G, r, -1, tune.curve), 'set'),
    hit: E(bend(D, Math.min(16, r + 1), 1, false), 'shut'),   // after the duck the upper body fills rows top+1..r
    happy: E(G, 'happy'),
  };
}
// Hand rows (by:'hand'): made once with --tune from these settings, then edited by hand in sprite_anim.js; the tool never
// overwrites them again. The three starter lines and the four commonest wild lines (spawn tables on main).
const TUNE = {
  'ember/0': { curve: true }, 'ember/1': { curve: true }, 'ember/2': { curve: true },
  'tide/0': { curve: true }, 'tide/1': { curve: true }, 'tide/2': { curve: true },
  'bloom/0': { curve: true }, 'bloom/1': { curve: true }, 'bloom/2': { curve: true },
  'stone/0': {}, 'stone/1': { curve: true }, 'stone/2': { curve: true },
  'dormouse/0': { curve: true }, 'dormouse/1': { curve: true }, 'dormouse/2': { curve: true },
  'beetle/0': {}, 'beetle/1': { curve: true }, 'beetle/2': { curve: true },
  'moth/0': { curve: true }, 'moth/1': { curve: true }, 'moth/2': { curve: true },
};
const sym = (G) => G.every((row) => row.every((c, x) => c === row[15 - x]));
function store(st, G) {
  const rows = G.map((r) => r.join(''));
  if (st.grid) return { grid: rows };
  if (sym(G)) return { half: rows.map((r) => r.slice(0, 8)) };
  return { full: rows };
}

function formRow(st, id, tuneIt) {
  const t = tuneIt && TUNE[id], F = frames(st, t), o = { by: t ? 'hand' : 'gen' };
  for (const k of FRAMES) o[k] = store(st, F[k]);
  return o;
}
function letters(st) {
  if (st.grid) return null;
  const s = new Set(['.', 'e', 'i']); Object.keys(st.col || {}).forEach((k) => s.add(k)); st.half.join('').split('').forEach((c) => s.add(c));
  return s;
}
function checkRow(id, st, row, PAL) {
  const bad = [];
  if (!row) return [id + ': no row'];
  const ok = letters(st);
  for (const k of FRAMES) {
    const f = row[k]; if (!f) { bad.push(id + ' ' + k + ': missing'); continue; }
    const g = f.half || f.full || f.grid, w = f.half ? 8 : 16;
    if (st.grid && !f.grid) bad.push(id + ' ' + k + ': a grid stage takes grid frames');
    if (!st.grid && f.grid) bad.push(id + ' ' + k + ': a half stage takes half or full frames');
    if (!g || g.length !== 16) { bad.push(id + ' ' + k + ': ' + (g ? g.length : 0) + ' rows'); continue; }
    g.forEach((r, y) => {
      if (r.length !== w) bad.push(id + ' ' + k + ' row ' + y + ': ' + r.length + ' cols, want ' + w);
      for (const c of r) {
        if (ok && !ok.has(c)) bad.push(id + ' ' + k + ' row ' + y + ': letter ' + c);
        if (!ok && c !== '.' && !PAL[c]) bad.push(id + ' ' + k + ' row ' + y + ': not a PAL key ' + c);
      }
    });
  }
  return bad;
}

function fmtFrame(f) {
  const key = f.half ? 'half' : f.full ? 'full' : 'grid', g = f[key];
  return '{' + key + ':[' + g.map((r) => "'" + r + "'").join(',') + ']}';
}
function fmtRow(id, row) {
  const parts = FRAMES.map((k) => '    ' + k + ':' + fmtFrame(row[k]));
  return "  '" + id + "': { by:'" + row.by + "'" + (row.note ? ", note:" + JSON.stringify(row.note) : '') + ',\n' + parts.join(',\n') + ' }';
}

function main() {
  const { SPECIES, PAL } = loadSpecies(), old = loadExisting(), check = process.argv.includes('--check');
  const rows = [], bad = [];
  let hand = 0, gen = 0;
  SPECIES.forEach((sp) => sp.stages.forEach((st, si) => {
    const id = sp.id + '/' + si;
    const tuneIt = process.argv.includes('--tune') && TUNE[id];
    const row = !tuneIt && old[id] && old[id].by === 'hand' ? old[id] : formRow(st, id, tuneIt);
    if (row.by === 'hand') hand++; else gen++;
    bad.push(...checkRow(id, st, row, PAL));
    rows.push([id, row]);
  }));
  if (check) {
    const now = loadExisting();
    SPECIES.forEach((sp) => sp.stages.forEach((st, si) => { const id = sp.id + '/' + si; if (!now[id]) bad.push(id + ': not in sprite_anim.js'); else bad.push(...checkRow(id, st, now[id], PAL)); }));
    const uniq = [...new Set(bad)];
    console.log('sprite_anim check: ' + rows.length + ' forms, ' + uniq.length + ' problems');
    uniq.slice(0, 40).forEach((b) => console.log('  ' + b));
    process.exit(uniq.length ? 1 : 0);
  }
  if (bad.length) { console.error(bad.join('\n')); process.exit(1); }
  const src = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  const A = '// <sprite_anim rows: tools/gen_sprite_anim.js keeps by:\'hand\' rows and regenerates the rest>', Z = '// </sprite_anim rows>';
  const body = A + '\nconst SPRITE_ANIM = {\n' + rows.map(([id, row]) => fmtRow(id, row)).join(',\n') + ',\n};\n' + Z;
  if (!src.includes(A)) { console.error('sprite_anim.js has no row markers'); process.exit(1); }
  const out = src.slice(0, src.indexOf(A)) + body + src.slice(src.indexOf(Z) + Z.length);
  fs.writeFileSync(OUT, out);
  console.log('sprite_anim.js: ' + rows.length + ' forms (' + hand + ' hand, ' + gen + ' generated)');
}
if (require.main === module) main();
module.exports = { frames, grid16, cutRow, loadSpecies };
