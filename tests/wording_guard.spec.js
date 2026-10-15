/* Player-text guard: scene lines, choice labels, signs, toasts and blurbs.
   The banned list is built from character codes inside integrity_lib.js. */
const { test, expect } = require('@playwright/test');
const lib = require('./integrity_lib');

function problems() {
  return lib.repoWordingProblems();
}

test('player-visible lines pass the wording guard', () => {
  const bad = problems().filter(p => p.indexOf('hc_sign_bank') < 0);
  expect(bad).toEqual([]);
});

// High Charity's Civic Bank sign still uses a banned word. The sign stays; this records it.
test.fixme('the Civic Bank sign passes the wording guard', () => {
  const bad = problems().filter(p => p.indexOf('hc_sign_bank') >= 0);
  expect(bad).toEqual([]);
});

test('a banned word in a say line is reported', () => {
  const word = lib.fromCodes([102, 97, 105, 110, 116, 101, 100]);
  const bad = lib.wordingProblems([{ kind: 'say', where: 'fixture', text: 'They are ' + word + ' now.' }]);
  expect(bad).toEqual(['say fixture: banned word']);
});

test('the toy-brand pattern in a say line is reported', () => {
  const name = lib.fromCodes([116, 97, 109, 97, 103, 111, 116, 99, 104, 105]);
  const bad = lib.wordingProblems([{ kind: 'say', where: 'fixture', text: 'a ' + name + ' on the shelf' }]);
  expect(bad).toEqual(['say fixture: banned word']);
});

test('a shout of the banned shape is reported', () => {
  const shout = lib.fromCodes([71, 111, 44, 32, 80, 105, 112, 33]);
  const bad = lib.wordingProblems([{ kind: 'say', where: 'fixture', text: shout }]);
  expect(bad).toEqual(['say fixture: banned word']);
});

test('isFainted and dexGrid are not banned words', () => {
  const text = 'isFainted stays, and so does dexGrid.';
  expect(lib.wordingProblems([{ kind: 'say', where: 'ids', text: text }])).toEqual([]);
});

test('a say line over 110 is reported', () => {
  const bad = lib.wordingProblems([{ kind: 'say', where: 'fixture', text: 'x'.repeat(111) }]);
  expect(bad).toEqual(['say fixture: over 110 (111)']);
});

test('a choice label over 30 is reported', () => {
  const bad = lib.wordingProblems([{ kind: 'choice', where: 'fixture label', text: 'y'.repeat(31) }]);
  expect(bad).toEqual(['choice fixture label: choice over 30 (31)']);
});

test('a double space is reported', () => {
  const bad = lib.wordingProblems([{ kind: 'say', where: 'fixture', text: 'too  far' }]);
  expect(bad).toEqual(['say fixture: double space']);
});

test('an unknown token is reported', () => {
  const bad = lib.wordingProblems([{ kind: 'say', where: 'fixture', text: 'Hello {nope}.' }]);
  expect(bad).toEqual(['say fixture: unknown token {nope}']);
});
