/* Decision-id scan for OPEN_DECISIONS.md. Node built-ins.
   Duplicate D/Q ids in the # column of a table fail, except D37.
   The header's single "Next free id is Dnnn" must be one past the highest
   D id used or reserved. A missing file is a failure, not a skip. */
const fs = require('fs');
const path = require('path');

// OPEN_DECISIONS.md header: "D37 is used twice ... Do not renumber either row".
const DUP_ALLOW = new Set(['D37']);

function lineAt(text, index) {
  let n = 1;
  for (let i = 0; i < index && i < text.length; i++) if (text[i] === '\n') n++;
  return n;
}

function headerOf(text) {
  const m = /^## /m.exec(text);
  return m ? text.slice(0, m.index) : text;
}

function sentenceAt(text, index) {
  const start = text.lastIndexOf('.', index);
  let end = text.indexOf('.', index);
  if (end < 0) end = text.length;
  return text.slice(start + 1, end);
}

// Reserved ranges in the header, written "Dxxx-Dyyy" or "Dxxx–Dyyy ... reserved".
function reservedHigh(header) {
  let max = 0;
  const re = /D(\d+)\s*[-–—]\s*D(\d+)/g;
  let m;
  while ((m = re.exec(header))) {
    if (/\breserved\b/i.test(sentenceAt(header, m.index))) max = Math.max(max, +m[1], +m[2]);
  }
  return max;
}

function highestId(text, letter) {
  const stripped = text
    .replace(new RegExp('Next free id is ' + letter + '\\d+', 'g'), ' ')
    .replace(new RegExp('[Tt]he next free id is ' + letter + '\\d+', 'g'), ' ');
  let max = 0;
  const re = new RegExp('\\b' + letter + '(\\d+)\\b', 'g');
  let m;
  while ((m = re.exec(stripped))) max = Math.max(max, +m[1]);
  return max;
}

function tableRows(text) {
  const rows = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = /^\|\s*(D\d+|Q\d+)\s*\|/.exec(lines[i]);
    if (m) rows.push({ id: m[1], line: i + 1 });
  }
  return rows;
}

function scanDecisions(root) {
  const file = 'OPEN_DECISIONS.md';
  const abs = path.join(root, file);
  let text;
  try { text = fs.readFileSync(abs, 'utf8'); }
  catch (e) { return { ok: false, fails: [{ file, line: 1, reason: 'missing file' }] }; }
  const fails = [];
  const seen = new Map();
  for (const row of tableRows(text)) {
    const n = (seen.get(row.id) || 0) + 1;
    seen.set(row.id, n);
    if (n > 1 && !DUP_ALLOW.has(row.id)) {
      fails.push({ file, line: row.line, reason: 'duplicate ' + row.id });
    }
  }
  const header = headerOf(text);
  for (const letter of ['D', 'Q']) {
    const re = new RegExp('Next free id is ' + letter + '(\\d+)', 'g');
    const found = [];
    let m;
    while ((m = re.exec(header))) found.push({ id: +m[1], index: m.index, raw: m[0] });
    if (letter === 'Q' && found.length === 0) continue;
    if (found.length === 0) {
      fails.push({ file, line: 1, reason: 'missing next-free id' });
      continue;
    }
    if (found.length > 1) {
      fails.push({ file, line: lineAt(header, found[1].index), reason: 'more than one next-free id' });
      continue;
    }
    const reserved = letter === 'D' ? reservedHigh(header) : 0;
    const high = Math.max(highestId(text, letter), reserved);
    const want = high + 1;
    if (found[0].id !== want) {
      fails.push({
        file,
        line: lineAt(header, found[0].index),
        reason: 'next free is ' + letter + found[0].id + ', highest used or reserved is ' + letter + high,
      });
    }
  }
  return { ok: fails.length === 0, fails };
}

module.exports = { scanDecisions, DUP_ALLOW };
