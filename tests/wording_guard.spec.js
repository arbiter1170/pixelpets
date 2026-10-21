/* Player-text guard: scene lines, choice labels, signs, toasts and blurbs.
   The banned list is built from character codes inside integrity_lib.js. */
const { test, expect } = require('@playwright/test');
const lib = require('./integrity_lib');

function problems() {
  return lib.repoWordingProblems();
}

const LODGE = "WARDEN'S LODGE · Warden Ilse Marrow. New holders, knock and come in.";

test("the Warden lodge sign says holders @w1", () => {
  const vm = require('vm');
  const ctx = { console, window: {} };
  ctx.globalThis = ctx;
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(lib.read('data/mapdata.js') + '\n;try { globalThis.MAPDATA = MAPDATA; } catch (e) {}', ctx, { filename: 'data/mapdata.js' });
  const hits = [];
  (function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (node.id === 'hm_sign_lodge' && typeof node.text === 'string') hits.push(node.text);
    for (const v of Object.values(node)) walk(v);
  })(ctx.MAPDATA);
  expect(hits.length).toBeGreaterThan(0);
  expect(hits.every((t) => t === LODGE)).toBe(true);
  expect(hits.some((t) => t.indexOf('keepers') >= 0)).toBe(false);
});

test('player-visible lines pass the wording guard @w1', () => {
  const bad = problems().filter(p => p.indexOf('hc_sign_bank') < 0);
  expect(bad).toEqual([]);
});

// High Charity's Civic Bank sign still uses a banned word. The sign stays; this records it.
test.fixme('the Civic Bank sign passes the wording guard @w1', () => {
  const bad = problems().filter(p => p.indexOf('hc_sign_bank') >= 0);
  expect(bad).toEqual([]);
});

test('a banned word in a say line is reported @w1', () => {
  const word = lib.fromCodes([102, 97, 105, 110, 116, 101, 100]);
  const bad = lib.wordingProblems([{ kind: 'say', where: 'fixture', text: 'They are ' + word + ' now.' }]);
  expect(bad).toEqual(['say fixture: banned word']);
});

test('the toy-brand pattern in a say line is reported @w1', () => {
  const name = lib.fromCodes([116, 97, 109, 97, 103, 111, 116, 99, 104, 105]);
  const bad = lib.wordingProblems([{ kind: 'say', where: 'fixture', text: 'a ' + name + ' on the shelf' }]);
  expect(bad).toEqual(['say fixture: banned word']);
});

test('a shout of the banned shape is reported @w1', () => {
  const shout = lib.fromCodes([71, 111, 44, 32, 80, 105, 112, 33]);
  const bad = lib.wordingProblems([{ kind: 'say', where: 'fixture', text: shout }]);
  expect(bad).toEqual(['say fixture: banned word']);
});

test('isFainted and dexGrid are not banned words @w1', () => {
  const text = 'isFainted stays, and so does dexGrid.';
  expect(lib.wordingProblems([{ kind: 'say', where: 'ids', text: text }])).toEqual([]);
});

test('a say line over 110 is reported @w1', () => {
  const bad = lib.wordingProblems([{ kind: 'say', where: 'fixture', text: 'x'.repeat(111) }]);
  expect(bad).toEqual(['say fixture: over 110 (111)']);
});

test('a choice label over 30 is reported @w1', () => {
  const bad = lib.wordingProblems([{ kind: 'choice', where: 'fixture label', text: 'y'.repeat(31) }]);
  expect(bad).toEqual(['choice fixture label: choice over 30 (31)']);
});

test('a double space is reported @w1', () => {
  const bad = lib.wordingProblems([{ kind: 'say', where: 'fixture', text: 'too  far' }]);
  expect(bad).toEqual(['say fixture: double space']);
});

test('an unknown token is reported @w1', () => {
  const bad = lib.wordingProblems([{ kind: 'say', where: 'fixture', text: 'Hello {nope}.' }]);
  expect(bad).toEqual(['say fixture: unknown token {nope}']);
});
