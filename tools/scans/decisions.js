/* Decision-id scan. Node built-ins.
   A defining row is a table head (| Dnnn | or | Qnnn | in the # column)
   in OPEN_DECISIONS.md or archive/DECISIONS_SETTLED.md.
   An archive bullet at the start of a line, "- **Dnnn" or "- **Qnnn",
   is also a definition, so a duplicate written as an archive bullet fails.
   Not definitions: a "Restatement of Dn" bullet, a range head such as
   "- **D220–D230", and a "Closed by Dn" reference later in the line.
   D37 may repeat. OPEN_DECISIONS.md header: "D37 is used twice. Do not renumber either row."
   The header's single next-free sentence must be one past the highest
   D id used or reserved in either file. A missing OPEN_DECISIONS.md is
   a failure, not a skip. A missing archive means no settled rows. */
const fs = require('fs');
const path = require('path');

const DUP_ALLOW = new Set(['D37']);
const NEXT_FREE = 'Next ' + 'free id is ';
const NEXT_FREE_LOWER = 'next ' + 'free id is ';

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

function reservedHigh(header) {
  let max = 0;
  const re = /D(\d+)\s*[-–—]\s*D(\d+)/g;
  let m;
  while ((m = re.exec(header))) {
    if (/\breserved\b/i.test(sentenceAt(header, m.index))) max = Math.max(max, +m[1], +m[2]);
  }
  return max;
}

function cutPhrase(text, phrase) {
  const re = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\d+', 'g');
  return text.replace(re, ' ');
}

function highestId(text, letter) {
  const lower = NEXT_FREE_LOWER + letter;
  let stripped = cutPhrase(text, NEXT_FREE + letter);
  stripped = cutPhrase(stripped, 'The ' + lower);
  stripped = cutPhrase(stripped, 'the ' + lower);
  let max = 0;
  const re = new RegExp('\\b' + letter + '(\\d+)\\b', 'g');
  let m;
  while ((m = re.exec(stripped))) max = Math.max(max, +m[1]);
  return max;
}

function definingRows(text) {
  const rows = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const table = /^\|\s*(D\d+|Q\d+)\s*\|/.exec(lines[i]);
    if (table) rows.push({ id: table[1], line: i + 1 });
  }
  return rows;
}

function isRestatement(line) {
  return /^-\s+(?:\*\*)?Restatement of\s+[DQ]\d+\b/i.test(line);
}

function isRangeHead(line) {
  return /^-\s+\*\*[DQ]\d+\s*[-\u2013\u2014]\s*[DQ]\d+\b/.test(line);
}

// Archive bullets only. A range head is not a definition of either id.
// "Closed by Dn" sits after the head id, so it is not a second definition.
function archiveBulletDefs(text) {
  const rows = [];
  const lines = text.split('\n');
  const head = /^-\s+\*\*([DQ]\d+)\b/;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isRestatement(line) || isRangeHead(line)) continue;
    const m = head.exec(line);
    if (m) rows.push({ id: m[1], line: i + 1 });
  }
  return rows;
}

function readFile(root, rel) {
  try { return fs.readFileSync(path.join(root, rel), 'utf8'); }
  catch (e) { return null; }
}

function nextFreeHits(header, letter) {
  const phrase = NEXT_FREE + letter;
  const found = [];
  let from = 0;
  while (from <= header.length) {
    const index = header.indexOf(phrase, from);
    if (index < 0) break;
    const num = /^(\d+)/.exec(header.slice(index + phrase.length));
    if (num) found.push({ id: +num[1], index });
    from = index + phrase.length;
  }
  return found;
}

function scanDecisions(root) {
  const file = 'OPEN_DECISIONS.md';
  const archRel = 'archive/DECISIONS_SETTLED.md';
  const text = readFile(root, file);
  if (text == null) return { ok: false, fails: [{ file, line: 1, reason: 'missing file' }] };
  const arch = readFile(root, archRel);
  const fails = [];
  const seen = new Map();
  const sources = [{ file, text }];
  if (arch != null) sources.push({ file: archRel, text: arch });
  for (const src of sources) {
    const defs = definingRows(src.text);
    if (src.file === archRel) defs.push.apply(defs, archiveBulletDefs(src.text));
    for (const row of defs) {
      const n = (seen.get(row.id) || 0) + 1;
      seen.set(row.id, n);
      if (n > 1 && !DUP_ALLOW.has(row.id)) {
        fails.push({ file: src.file, line: row.line, reason: 'duplicate ' + row.id });
      }
    }
  }
  const header = headerOf(text);
  const corpus = arch == null ? text : text + '\n' + arch;
  for (const letter of ['D', 'Q']) {
    const found = nextFreeHits(header, letter);
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
    const high = Math.max(highestId(corpus, letter), reserved);
    const want = high + 1;
    if (found[0].id !== want) {
      fails.push({
        file,
        line: lineAt(header, found[0].index),
        reason: 'next ' + 'free is ' + letter + found[0].id + ', highest used or reserved is ' + letter + high,
      });
    }
  }
  return { ok: fails.length === 0, fails };
}

module.exports = { scanDecisions, DUP_ALLOW, definingRows, archiveBulletDefs };
