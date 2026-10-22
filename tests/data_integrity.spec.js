/* Static checks for map data, battle numbers and the offline shell.
   Widths come from the Playwright projects. These tests do not boot the game. */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const lib = require('./integrity_lib');

const TILES = { p: { walk: true }, H: { walk: false } };

function yard(objs, safe) {
  return {
    yard: { w: 2, h: 2, grid: ['pH', 'pp'], safe: safe || { x: 0, y: 1 }, objs: objs },
  };
}

test('data/mapdata.js matches tools/gen_mapdata.py @w1', () => {
  const generated = lib.freshMapdata();
  expect(lib.mapdataProblems(generated, lib.read('data/mapdata.js'))).toEqual([]);
});

test('a drifted data file is reported as mapdata out of date @w1', () => {
  const generated = lib.freshMapdata(dir => {
    const file = path.join(dir, 'data', 'town_board.json');
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    data.drift = true;
    fs.writeFileSync(file, JSON.stringify(data));
  });
  expect(lib.mapdataProblems(generated, lib.read('data/mapdata.js'))).toEqual([
    'data/mapdata.js does not match tools/gen_mapdata.py',
  ]);
});

test('warps, doors, safe tiles and object ids hold on the composed world @w1', () => {
  expect(lib.repoMapProblems()).toEqual([]);
});

// hc_south arrives on the east-west path at hearthmoor (12, 8), facing up, north of the coach (D122).
test('hc_south lands on a walkable tile @w1', () => {
  const bad = lib.repoMapProblems().filter(p => p.indexOf('hc_south') >= 0);
  expect(bad).toEqual([]);
});

test('a missing warp target is reported @w1', () => {
  const bad = lib.mapProblems(yard([{ kind: 'warp', id: 'out', to: 'nowhere', tx: 0, ty: 0 }]), TILES, {});
  expect(bad).toEqual(['yard out: target map missing nowhere']);
});

test('an out-of-bounds door target is reported @w1', () => {
  const bad = lib.mapProblems(yard([{ kind: 'door', id: 'gate', to: 'yard', tx: 9, ty: 0 }]), TILES, {});
  expect(bad).toEqual(['yard gate: target out of bounds yard 9,0']);
});

test('a door onto a wall is reported @w1', () => {
  const bad = lib.mapProblems(yard([{ kind: 'door', id: 'gate', to: 'yard', tx: 1, ty: 0 }]), TILES, {});
  expect(bad).toEqual(['yard gate: tile yard 1,0 is not walkable (H)']);
});

test('a blocked safe tile is reported @w1', () => {
  const bad = lib.mapProblems(yard([], { x: 1, y: 0 }), TILES, {});
  expect(bad).toEqual(['yard: safe tile not walkable 1,0 (H)']);
});

test('a duplicate object id is reported @w1', () => {
  const bad = lib.mapProblems(yard([{ kind: 'prop', id: 'crate' }, { kind: 'prop', id: 'crate' }]), TILES, {});
  expect(bad).toEqual(['yard: duplicate object id crate']);
});

test('learnset and trainer move ids exist @w1', () => {
  expect(lib.repoLearnProblems()).toEqual([]);
});

test('an unknown learnset move is reported @w1', () => {
  const moves = { bump: {} };
  const sets = { 'spark/0': [[1, 'no_such']], 'spark/1': [], 'spark/2': [] };
  expect(lib.learnProblems(moves, sets, ['spark'])).toEqual(['spark/0: unknown move no_such']);
});

test('species stage totals follow 192, 256 and 320 @w1', () => {
  expect(lib.repoStageProblems()).toEqual([]);
});

test('the save form table and the journal count the Hushwater lines @w1', () => {
  const spr = lib.read('sprites.js');
  const block = spr.slice(spr.indexOf('const SPECIES'), spr.indexOf('const GLYPH'));
  const ids = [...block.matchAll(/\bid:'([a-z0-9_]+)'/g)].map(m => m[1]);
  const npc = (block.match(/npcOnly:true/g) || []).length;
  expect(ids.slice(-5)).toEqual(['fetch', 'skink', 'otter', 'owl', 'snail']);
  expect(ids).toHaveLength(20);
  expect(npc).toBe(1);
  expect((ids.length - npc) * 3).toBe(57);
  expect(ids.length * 3).toBe(60);
  const save = lib.read('save.js');
  const row = save.match(/const SPECIES_IDS = Object\.freeze\(\[\.\.\.V1_SPECIES, ([^\]]+)\]\)/);
  expect(row).toBeTruthy();
  const saved = row[1].split(',').map(s => s.trim().replace(/'/g, ''));
  expect(saved).toEqual(ids.slice(8));
  expect(save).toContain('pixelpets.save.v2');
});

test('a stage total that breaks the rule is reported @w1', () => {
  const line = { hp: 1, atk: 1, def: 1, spd: 1 };
  const bad = lib.stageProblems({ 'spark/0': line, 'spark/1': line, 'spark/2': line }, ['spark']);
  expect(bad[0]).toBe('spark/0: total 4, want 192');
});

test('every service-worker shell file exists @w1', () => {
  expect(lib.shellList(lib.read('sw.js')).length).toBeGreaterThan(0);
  expect(lib.repoShellProblems()).toEqual([]);
});

test('a missing shell file is reported @w1', () => {
  expect(lib.shellProblems(['./missing.js'], () => false)).toEqual(['shell file missing ./missing.js']);
});

// A look key loaded later silently replaces an earlier one. Same bytes may repeat. Different bytes must name both files.
function literalAfter(src, marker) {
  const at = src.indexOf(marker);
  if (at < 0) return null;
  const brace = src.indexOf('{', at);
  let depth = 0, quote = '', esc = false;
  for (let i = brace; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === quote) quote = '';
      continue;
    }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); if (i < 0) break; continue; }
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return src.slice(brace, i + 1);
    }
  }
  return null;
}
function canon(v) {
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === 'object') {
    const o = {};
    Object.keys(v).sort().forEach(k => { o[k] = canon(v[k]); });
    return o;
  }
  return v;
}
function sameLook(a, b) { return JSON.stringify(canon(a)) === JSON.stringify(canon(b)); }
function walkLooks(node, file, out) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { node.forEach(v => walkLooks(v, file, out)); return; }
  if (node.looks && typeof node.looks === 'object' && !Array.isArray(node.looks)) {
    Object.entries(node.looks).forEach(([k, v]) => {
      if (k.startsWith('_') || !v || typeof v !== 'object' || Array.isArray(v)) return;
      out.push({ file, key: k, value: v });
    });
  }
  Object.entries(node).forEach(([k, v]) => { if (k !== 'looks') walkLooks(v, file, out); });
}

test('a look key is defined once when the bytes differ, and holder is the route look @w1', () => {
  const hits = [];
  const swaps = literalAfter(lib.read('keeper.js'), 'const KEEPER_SWAPS = ');
  expect(swaps).toBeTruthy();
  Object.entries(eval('(' + swaps + ')')).forEach(([k, v]) => hits.push({ file: 'keeper.js', key: k, value: v }));
  fs.readdirSync(path.join(process.cwd(), 'data')).filter(n => n.endsWith('.json')).sort().forEach(n => {
    walkLooks(JSON.parse(lib.read(path.join('data', n))), 'data/' + n, hits);
  });
  const game = lib.read('game.js');
  const overlay = /NPC_LOOKS\.([A-Za-z0-9_]+)\s*=\s*(\{[^;]*\});/g;
  let m;
  while ((m = overlay.exec(game))) hits.push({ file: 'game.js', key: m[1], value: eval('(' + m[2] + ')') });
  const byKey = {};
  hits.forEach(h => { (byKey[h.key] = byKey[h.key] || []).push(h); });
  const clashes = [];
  Object.entries(byKey).forEach(([key, rows]) => {
    for (let i = 1; i < rows.length; i++) {
      if (!sameLook(rows[0].value, rows[i].value)) clashes.push(key + ': ' + rows[0].file + ' and ' + rows[i].file);
    }
  });
  expect(clashes).toEqual([]);
  expect((byKey.holder || []).map(h => h.file)).toEqual(['keeper.js']);
  expect(byKey.trainer || []).toEqual([]);
  const pal = literalAfter(lib.read('sprites.js'), 'const PAL = ');
  const skin = literalAfter(lib.read('keeper.js'), 'const KEEPER_SKIN_PAL = ');
  const palKeys = Object.keys(eval('(' + pal + ')'));
  const skinKeys = Object.keys(eval('(' + skin + ')'));
  expect(palKeys).not.toContain('holder');
  expect(palKeys).not.toContain('trainer');
  expect(skinKeys).not.toContain('holder');
  expect(skinKeys).not.toContain('trainer');
});
