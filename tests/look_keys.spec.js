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

function paletteKeyClashes(files) {
  const owner = {}, clashes = [];
  for (const [file, data] of files) {
    const pal = data && data.palette;
    if (!pal || typeof pal !== 'object') continue;
    for (const [k, v] of Object.entries(pal)) {
      if (k.startsWith('_') || v == null) continue;
      if (owner[k] && owner[k] !== file) clashes.push(`${k}: ${owner[k]} and ${file}`);
      else owner[k] = file;
    }
  }
  return clashes;
}

test('no palette key is defined in two data files', () => {
  expect(paletteKeyClashes(dataFiles())).toEqual([]);
});

test('a palette key defined in two data files is reported', () => {
  const files = [['a.json', { palette: { r: '#b13e53' } }], ['b.json', { palette: { r: '#b13e53' } }]];
  expect(paletteKeyClashes(files)).toEqual(['r: a.json and b.json']);
});

test('a look key defined in two data files is reported', () => {
  const files = [['a.json', { looks: { cal: { hair: 'buzz' }, _note: 'x' } }], ['b.json', { looks: { cal: { hair: 'short' } } }]];
  expect(lookKeyClashes(files)).toEqual(['cal: a.json and b.json']);
});

function duplicateObjectKeys(text) {
  const dups = [];
  let i = 0;
  const n = text.length;
  const frames = [];
  while (i < n) {
    const c = text[i];
    if (c === '"') {
      i++;
      let s = '';
      while (i < n) {
        if (text[i] === '\\') { i += 2; continue; }
        if (text[i] === '"') { i++; break; }
        s += text[i++];
      }
      let j = i;
      while (j < n && /\s/.test(text[j])) j++;
      const frame = frames[frames.length - 1];
      if (frame && frame.keys && frame.expect === 'key' && text[j] === ':') {
        if (frame.keys.has(s)) dups.push(s);
        else frame.keys.add(s);
        frame.expect = 'colon';
        i = j;
      }
      continue;
    }
    if (c === '{') { frames.push({ keys: new Set(), expect: 'key' }); i++; continue; }
    if (c === '}') { frames.pop(); i++; continue; }
    if (c === '[') { frames.push({ keys: null, expect: 'arr' }); i++; continue; }
    if (c === ']') { frames.pop(); i++; continue; }
    if (c === ':') {
      const frame = frames[frames.length - 1];
      if (frame && frame.expect === 'colon') frame.expect = 'value';
      i++; continue;
    }
    if (c === ',') {
      const frame = frames[frames.length - 1];
      if (frame && frame.keys) frame.expect = 'key';
      i++; continue;
    }
    i++;
  }
  return dups;
}

test('no data file defines the same object key twice', () => {
  const hits = [];
  for (const file of fs.readdirSync(DATA).filter(f => f.endsWith('.json')).sort()) {
    const dups = duplicateObjectKeys(fs.readFileSync(path.join(DATA, file), 'utf8'));
    if (dups.length) hits.push(file + ': ' + dups.join(', '));
  }
  expect(hits).toEqual([]);
});

test('a repeated object key is reported', () => {
  expect(duplicateObjectKeys('{ "a": 1, "b": { "a": 2 }, "a": 3 }')).toEqual(['a']);
});
