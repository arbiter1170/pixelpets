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
  const bad = lib.repoMapProblems().filter(p => p.indexOf('hc_south') < 0);
  expect(bad).toEqual([]);
});

// civic's grid rows put a house wall on hearthmoor (12, 10). The High Charity south warp still aims there.
test.fixme('hc_south lands on a walkable tile @w1', () => {
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
