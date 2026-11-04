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

test('no look key is defined in two data files @w1', () => {
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

test('no palette key is defined in two data files @w1', () => {
  expect(paletteKeyClashes(dataFiles())).toEqual([]);
});

test('a palette key defined in two data files is reported @w1', () => {
  const files = [['a.json', { palette: { r: '#b13e53' } }], ['b.json', { palette: { r: '#b13e53' } }]];
  expect(paletteKeyClashes(files)).toEqual(['r: a.json and b.json']);
});

// walklings-key-collision-check: a `speakers` entry maps a raw speaker name to the dialog portrait's look. game.js merges
// every file's table into one LOOK_OF_NAME, so the same name mapped to two looks in two files gives one file's person the
// other's face. That is how the RegenX floor tech's "Cal" showed on the Mahopac dream's Cal (NAMES_PASS G8, D1766: the tech
// is Jory now, under his own key). The names below are one person each with a file-specific portrait, not two people
// sharing a key; they are pinned so a new clash still fails.
const ONE_PERSON_SPEAKERS = ['Associate Quinn', 'Captain Lumen', 'Field Lead Imogen'];
function speakerClashes(files) {
  const owner = {}, clashes = [];
  for (const [file, data] of files) {
    const sp = data && (data.speakers || (data.dialog && data.dialog.speakers));
    if (!sp || typeof sp !== 'object') continue;
    for (const [k, v] of Object.entries(sp)) {
      if (k.startsWith('_') || typeof v !== 'string') continue;
      if (owner[k] && owner[k].look !== v) clashes.push(`${k}: ${owner[k].file} (${owner[k].look}) and ${file} (${v})`);
      else if (!owner[k]) owner[k] = { file, look: v };
    }
  }
  return clashes;
}

test('no speaker name maps to two portraits in two data files, past the pinned one-person names @w1', () => {
  const clashes = speakerClashes(dataFiles()).filter(c => !ONE_PERSON_SPEAKERS.includes(c.split(':')[0]));
  expect(clashes).toEqual([]);
});

test('a speaker name mapped to two portraits is reported @w1', () => {
  const files = [['a.json', { speakers: { Cal: 'rx_cal', _note: 'x' } }], ['b.json', { speakers: { Cal: 'cal', Nia: 'nia' } }],
    ['c.json', { dialog: { speakers: { Nia: 'nia' } } }]];
  expect(speakerClashes(files)).toEqual(['Cal: a.json (rx_cal) and b.json (cal)']);
});

test('a look key defined in two data files is reported @w1', () => {
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

test('no data file defines the same object key twice @w1', () => {
  const hits = [];
  for (const file of fs.readdirSync(DATA).filter(f => f.endsWith('.json')).sort()) {
    const dups = duplicateObjectKeys(fs.readFileSync(path.join(DATA, file), 'utf8'));
    if (dups.length) hits.push(file + ': ' + dups.join(', '));
  }
  expect(hits).toEqual([]);
});

test('a repeated object key is reported @w1', () => {
  expect(duplicateObjectKeys('{ "a": 1, "b": { "a": 2 }, "a": 3 }')).toEqual(['a']);
});
