/* Static check: every NPC look key is defined in one data file only.
   game.js merges each file's `looks` into one NPC_LOOKS table, so a key defined twice silently
   redraws another file's characters (RegenX's nia/cal/ivo once replaced High Charity and Mahopac looks). */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data');

function lookKeyClashes(files) {
  const owner = {}, clashes = [];
  for (const [file, data] of files) {
    const looks = data && data.looks;
    if (!looks || typeof looks !== 'object') continue;
    for (const [k, v] of Object.entries(looks)) {
      if (k.startsWith('_') || !v || typeof v !== 'object') continue;
      if (owner[k] && owner[k] !== file) clashes.push(`${k}: ${owner[k]} and ${file}`);
      else owner[k] = file;
    }
  }
  return clashes;
}

function dataFiles() {
  return fs.readdirSync(DATA).filter(f => f.endsWith('.json')).sort()
    .map(f => [f, JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'))]);
}

test('no look key is defined in two data files', () => {
  expect(lookKeyClashes(dataFiles())).toEqual([]);
});

test('a look key defined in two data files is reported', () => {
  const files = [['a.json', { looks: { cal: { hair: 'buzz' }, _note: 'x' } }], ['b.json', { looks: { cal: { hair: 'short' } } }]];
  expect(lookKeyClashes(files)).toEqual(['cal: a.json and b.json']);
});
