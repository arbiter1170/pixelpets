/* Wording scan. Player-visible strings only. Node built-ins.
   A hit is SCAN FAIL wording: <file:line> <reason>. Bad parse or a missing
   source is a failure, not a skip. The classic toy brand is never spelled
   here: char codes, checked against a SHA-256 of the lowercased word. */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// SHA-256 of the lowercased brand. Codes are the same word.
const BRAND_SHA256 = '9a9f1552f710c67b32c6d0ce2fea2a3431e28171153b0b59325ccfec3d82af84';
const BRAND_CODES = [116, 97, 109, 97, 103, 111, 116, 99, 104, 105];

function brandWord() {
  return String.fromCharCode.apply(null, BRAND_CODES);
}
if (crypto.createHash('sha256').update(brandWord()).digest('hex') !== BRAND_SHA256) {
  throw new Error('brand encoding does not match its hash');
}

// Genuine player-visible hits on main, for the Supervisor to route.
// Do not put ids, flag keys, or author notes here. Tighten those rules instead.
// Each entry is { file, line, reason } and must match a hit exactly.
const ALLOW = [];

// id-like fields from the scan rules, plus implementer notes (engineAsks,
// artRequests) that are not shown to the player. A leading "_" is the same
// kind of author note (_note, _about, _lore).
const SKIP_KEYS = new Set(['id', 'look', 'kind', 'when', 'faction', 'note', 'decisions', 'flags', 'tiles', 'engineAsks', 'artRequests']);
const SELF_TEST_FN = /DevCheck$|^(devCheck|devChecks|repCastCheck|debugCheckpointList)$/;
const REGEX_KW = new Set(['return', 'throw', 'case', 'else', 'do', 'typeof', 'void', 'delete', 'in', 'of', 'yield', 'await', 'instanceof']);

function rel(root, file) {
  return path.relative(root, file).split(path.sep).join('/');
}

function allowed(file, line, reason) {
  return ALLOW.some(a => a.file === file && a.line === line && a.reason === reason);
}

function maskIds(text) {
  return String(text).replace(/\bisFainted\b/g, '').replace(/\bdexGrid\b/g, '');
}

// Prose has whitespace. Tokens, flag keys, conditions, selectors, CSS blobs
// and one-word ids do not, so they are not player lines. The brand is checked
// in every string, including a one-word value.
function reasonsFor(text) {
  const reasons = [];
  if (text.toLowerCase().indexOf(brandWord()) >= 0) reasons.push('brand');
  if (!/\s/.test(text)) return reasons;
  const s = maskIds(text);
  if (/\bkeepers?\b/.test(s)) reasons.push('lowercase keeper');
  if (/\btrainers?\b/i.test(s)) reasons.push('trainer');
  if (/\bfaint(ed)?\b/i.test(s)) reasons.push('fainted');
  if (/\bevolv/i.test(s)) reasons.push('evolve');
  if (/\bcoins?\b/i.test(s)) reasons.push('coins');
  if (/\bappeared\b/i.test(s)) reasons.push('appeared');
  if (/\bgo, [a-z]+!/i.test(s)) reasons.push('go-x');
  if (/\b[a-z]+dex\b/i.test(s)) reasons.push('dex');
  return reasons;
}

function pushHit(hits, file, line, text) {
  for (const reason of reasonsFor(text)) {
    if (!allowed(file, line, reason)) hits.push({ file, line, reason });
  }
}

function scanJsonFile(root, file, hits) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); }
  catch (e) { hits.push({ file: rel(root, file), line: 1, reason: 'missing file' }); return; }
  const name = rel(root, file);
  try { JSON.parse(text); }
  catch (e) {
    const pos = /position (\d+)/.exec(String(e && e.message)) ;
    let line = 1;
    if (pos) { for (let i = 0; i < +pos[1] && i < text.length; i++) if (text[i] === '\n') line++; }
    hits.push({ file: name, line, reason: 'bad parse' });
    return;
  }
  let i = 0, line = 1;
  function bump(n) {
    while (n-- > 0) { if (text[i] === '\n') line++; i++; }
  }
  function skipWs() { while (i < text.length && /\s/.test(text[i])) bump(1); }
  function fail(msg) { const err = new Error(msg); err.line = line; throw err; }
  function parseString() {
    const start = line;
    if (text[i] !== '"') fail('expected string');
    bump(1);
    let out = '';
    while (i < text.length) {
      const c = text[i];
      if (c === '"') { bump(1); return { value: out, line: start }; }
      if (c === '\\') {
        bump(1);
        const e = text[i];
        if (e === 'u') {
          const hex = text.slice(i + 1, i + 5);
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) fail('bad escape');
          out += String.fromCharCode(parseInt(hex, 16));
          bump(5);
        } else if (e === 'n') { out += '\n'; bump(1); }
        else if (e === 'r') { out += '\r'; bump(1); }
        else if (e === 't') { out += '\t'; bump(1); }
        else if (e === undefined) fail('bad escape');
        else { out += e; bump(1); }
        continue;
      }
      out += c;
      bump(1);
    }
    fail('unterminated string');
  }
  function skipKey(key) {
    return !key || key.charAt(0) === '_' || SKIP_KEYS.has(key);
  }
  function parseValue(skip) {
    skipWs();
    const c = text[i];
    if (c === '"') {
      const s = parseString();
      if (!skip) pushHit(hits, name, s.line, s.value);
      return;
    }
    if (c === '{') { parseObject(skip); return; }
    if (c === '[') { parseArray(skip); return; }
    if (text.startsWith('true', i) || text.startsWith('false', i) || text.startsWith('null', i) || c === '-' || (c >= '0' && c <= '9')) {
      while (i < text.length && !/[\s,\]\}]/.test(text[i])) bump(1);
      return;
    }
    fail('bad value');
  }
  function parseObject(skip) {
    bump(1);
    skipWs();
    if (text[i] === '}') { bump(1); return; }
    for (;;) {
      skipWs();
      const key = parseString();
      skipWs();
      if (text[i] !== ':') fail('expected colon');
      bump(1);
      parseValue(skip || skipKey(key.value));
      skipWs();
      if (text[i] === ',') { bump(1); continue; }
      if (text[i] === '}') { bump(1); return; }
      fail('expected comma or end');
    }
  }
  function parseArray(skip) {
    bump(1);
    skipWs();
    if (text[i] === ']') { bump(1); return; }
    for (;;) {
      parseValue(skip);
      skipWs();
      if (text[i] === ',') { bump(1); continue; }
      if (text[i] === ']') { bump(1); return; }
      fail('expected comma or end');
    }
  }
  try {
    skipWs();
    parseValue(false);
    skipWs();
    if (i !== text.length) fail('trailing junk');
  } catch (e) {
    hits.push({ file: name, line: e.line || 1, reason: 'bad parse' });
  }
}

function scanJsFile(root, file, hits) {
  let src;
  try { src = fs.readFileSync(file, 'utf8'); }
  catch (e) { hits.push({ file: rel(root, file), line: 1, reason: 'missing file' }); return; }
  const name = rel(root, file);
  let i = 0, line = 1, brace = 0, paren = 0;
  let prev = 'sof';
  const skipFns = [];
  let fnWait = null;
  let consoleAt = 0;
  let consoleState = 0;
  function bump() { if (src[i] === '\n') line++; i++; }
  function at(n) { return src[i + (n || 0)] || ''; }
  function fail(msg) { const err = new Error(msg); err.line = line; throw err; }
  function skipSpace() {
    for (;;) {
      if (at() === ' ' || at() === '\t' || at() === '\r') { i++; continue; }
      if (at() === '\n') { bump(); continue; }
      if (at() === '/' && at(1) === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
      if (at() === '/' && at(1) === '*') {
        i += 2;
        while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) bump();
        if (i >= src.length) fail('unterminated comment');
        i += 2;
        continue;
      }
      return;
    }
  }
  function reporting() { return skipFns.length === 0 && !consoleAt; }
  function readString(quote) {
    const start = line;
    const parts = [];
    let cur = '';
    bump();
    if (quote !== '`') {
      while (i < src.length) {
        const c = src[i];
        if (c === '\\') {
          bump();
          const e = src[i];
          if (e === undefined) fail('bad escape');
          if (e === 'n') cur += '\n';
          else if (e === 'r') cur += '\r';
          else if (e === 't') cur += '\t';
          else if (e === 'u') {
            const hex = src.slice(i + 1, i + 5);
            cur += /^[0-9a-fA-F]{4}$/.test(hex) ? String.fromCharCode(parseInt(hex, 16)) : '\\u' + hex;
            i += 4;
          } else cur += e;
          bump();
          continue;
        }
        if (c === quote) { bump(); parts.push(cur); return { line: start, parts }; }
        if (c === '\n') line++;
        cur += c;
        i++;
      }
      fail('unterminated string');
    }
    while (i < src.length) {
      if (src[i] === '\\') { bump(); if (i < src.length) { cur += src[i]; bump(); } continue; }
      if (src[i] === '`') { bump(); parts.push(cur); return { line: start, parts }; }
      if (src[i] === '$' && src[i + 1] === '{') {
        parts.push(cur);
        cur = '';
        bump(); bump();
        readTemplateExpr();
        continue;
      }
      if (src[i] === '\n') line++;
      cur += src[i];
      i++;
    }
    fail('unterminated template');
  }
  function readTemplateExpr() {
    let depth = 1;
    while (i < src.length && depth > 0) {
      skipSpace();
      if (i >= src.length) fail('unterminated template expression');
      const c = at();
      if (c === "'" || c === '"' || c === '`') { takeString(c); continue; }
      if (c === '/' && at(1) !== '/' && at(1) !== '*') { readRegex(); continue; }
      if (c === '{') { depth++; bump(); continue; }
      if (c === '}') { depth--; bump(); continue; }
      bump();
    }
  }
  function readRegex() {
    bump();
    let cls = false;
    while (i < src.length) {
      if (src[i] === '\\') { i += src[i + 1] ? 2 : 1; continue; }
      if (src[i] === '\n') break;
      if (!cls && src[i] === '[') { cls = true; bump(); continue; }
      if (cls && src[i] === ']') { cls = false; bump(); continue; }
      if (!cls && src[i] === '/') { bump(); break; }
      bump();
    }
    while (/[a-z]/i.test(at())) i++;
  }
  function takeString(quote) {
    const s = readString(quote);
    skipSpace();
    const key = at() === ':';
    if (reporting() && !key) {
      const joined = s.parts.join(' ');
      for (const part of s.parts) if (part) pushHit(hits, name, s.line, part);
      if (s.parts.length > 1 && joined.trim()) pushHit(hits, name, s.line, joined);
    }
    prev = 'val';
    consoleState = 0;
  }
  function word() {
    const start = i;
    while (/[A-Za-z0-9_$]/.test(at())) i++;
    return src.slice(start, i);
  }
  try {
    while (i < src.length) {
      const before = i;
      skipSpace();
      if (i >= src.length) break;
      const c = at();
      if (c === "'" || c === '"' || c === '`') { takeString(c); }
      else if (c === '/' && at(1) === '=') {
        if (prev === 'val') { i += 2; prev = 'op'; }
        else { readRegex(); prev = 'val'; }
      } else if (c === '/') {
        if (prev !== 'val') { readRegex(); prev = 'val'; }
        else { bump(); prev = 'op'; }
      } else if (/[A-Za-z_$]/.test(c)) {
        const w = word();
        if (w === 'function') {
          skipSpace();
          const nm = /[A-Za-z_$]/.test(at()) ? word() : '';
          fnWait = { name: nm, parens: 0, seen: false };
          prev = 'kw';
        } else         if (w === 'console') {
          consoleState = 1;
          prev = 'val';
        } else if (w === 'debugOut' || w === 'debugWhy') {
          // Debug log text. Inert without ?debug=1. Same exclusion as console.
          consoleState = 3;
          prev = 'val';
        } else if (consoleState === 2) {
          consoleState = 3;
          prev = 'val';
        } else {
          consoleState = 0;
          prev = REGEX_KW.has(w) ? 'op' : 'val';
        }
      } else if (c === '{') {
        brace++;
        if (fnWait && fnWait.seen && fnWait.parens === 0) {
          if (SELF_TEST_FN.test(fnWait.name)) skipFns.push(brace);
          fnWait = null;
        }
        bump();
        prev = 'op';
        consoleState = 0;
      } else if (c === '}') {
        if (skipFns.length && skipFns[skipFns.length - 1] === brace) skipFns.pop();
        brace--;
        bump();
        prev = 'val';
        consoleState = 0;
      } else if (c === '(') {
        paren++;
        if (fnWait) { fnWait.parens++; fnWait.seen = true; }
        if (consoleState === 3) { consoleAt = paren; consoleState = 0; }
        bump();
        prev = 'op';
      } else if (c === ')') {
        paren--;
        if (fnWait) fnWait.parens--;
        if (consoleAt && paren < consoleAt) consoleAt = 0;
        bump();
        prev = 'val';
        consoleState = 0;
      } else if (c === '.') {
        consoleState = consoleState === 1 ? 2 : 0;
        bump();
        prev = 'op';
      } else if ((c === '+' || c === '-') && at(1) === c) {
        i += 2; prev = 'val'; consoleState = 0;
      } else if ('=+-*%&|^~!?:;,<>[]'.indexOf(c) >= 0) {
        consoleState = 0;
        bump();
        prev = 'op';
      } else if (c >= '0' && c <= '9') {
        while (/[0-9a-fxA-F._]/.test(at())) i++;
        prev = 'val';
        consoleState = 0;
      } else {
        bump();
        prev = 'op';
        consoleState = 0;
      }
      if (i === before) fail('lexer stuck');
    }
  } catch (e) {
    hits.push({ file: name, line: e.line || line || 1, reason: 'bad parse' });
  }
}

function scanPyFile(root, file, hits) {
  let src;
  try { src = fs.readFileSync(file, 'utf8'); }
  catch (e) { hits.push({ file: rel(root, file), line: 1, reason: 'missing file' }); return; }
  const name = rel(root, file);
  let i = 0, line = 1;
  function bump() { if (src[i] === '\n') line++; i++; }
  function at(n) { return src[i + (n || 0)] || ''; }
  try {
    while (i < src.length) {
      const before = i;
      if (at() === '#') { while (i < src.length && src[i] !== '\n') i++; continue; }
      if (at() === ' ' || at() === '\t' || at() === '\r' || at() === '\n') { bump(); continue; }
      if (/[rRuUbBfF]/.test(at())) {
        const start = i;
        while (/[rRuUbBfF]/.test(at())) i++;
        if (at() !== "'" && at() !== '"') i = start;
      }
      if (at() === "'" || at() === '"') {
        const q = at();
        const triple = at(1) === q && at(2) === q;
        const startLine = line;
        i += triple ? 3 : 1;
        let out = '';
        while (i < src.length) {
          if (src[i] === '\\') { i++; if (i < src.length) { out += src[i]; if (src[i] === '\n') line++; i++; } continue; }
          if (triple && src[i] === q && src[i + 1] === q && src[i + 2] === q) { i += 3; break; }
          if (!triple && src[i] === q) { i++; break; }
          if (src[i] === '\n') line++;
          out += src[i];
          i++;
        }
        if (!triple) pushHit(hits, name, startLine, out);
        if (i === before) throw Object.assign(new Error('stuck'), { line });
        continue;
      }
      bump();
      if (i === before) throw Object.assign(new Error('stuck'), { line });
    }
  } catch (e) {
    hits.push({ file: name, line: e.line || 1, reason: 'bad parse' });
  }
}

function scanWording(root) {
  const hits = [];
  const dataDir = path.join(root, 'data');
  if (!fs.existsSync(dataDir)) hits.push({ file: 'data', line: 1, reason: 'missing file' });
  else {
    let names;
    try { names = fs.readdirSync(dataDir).filter(n => n.endsWith('.json')).sort(); }
    catch (e) { hits.push({ file: 'data', line: 1, reason: 'missing file' }); names = []; }
    for (const n of names) scanJsonFile(root, path.join(dataDir, n), hits);
  }
  scanJsFile(root, path.join(root, 'game.js'), hits);
  scanJsFile(root, path.join(root, 'ribbit.js'), hits);
  const tools = path.join(root, 'tools');
  if (fs.existsSync(tools)) {
    let names = [];
    try { names = fs.readdirSync(tools).filter(n => /^build_.*\.py$/.test(n)).sort(); }
    catch (e) { hits.push({ file: 'tools', line: 1, reason: 'missing file' }); }
    for (const n of names) scanPyFile(root, path.join(tools, n), hits);
  }
  hits.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.reason.localeCompare(b.reason));
  const seen = new Set();
  const fails = [];
  for (const h of hits) {
    const k = h.file + ':' + h.line + ':' + h.reason;
    if (seen.has(k)) continue;
    seen.add(k);
    fails.push(h);
  }
  return { ok: fails.length === 0, fails };
}

module.exports = { scanWording, BRAND_CODES, ALLOW };
