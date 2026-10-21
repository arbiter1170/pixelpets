#!/usr/bin/env node
/* Run the fail-closed scans. Exit 0 only when every requested scan passes.
   Usage: node tools/scans/run.js [--root DIR] [--only wording|decisions|symlinks|gamejs_map] */
const { scanWording } = require('./wording');
const { scanDecisions } = require('./decisions');
const { scanSymlinks } = require('./symlinks');
const { scanGamejsMap } = require('./gamejs_map');

const ALL = [
  ['wording', scanWording],
  ['decisions', scanDecisions],
  ['symlinks', scanSymlinks],
  ['gamejs_map', scanGamejsMap],
];

function parseArgs(argv) {
  let root = process.cwd();
  let only = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--root') root = argv[++i];
    else if (argv[i] === '--only') only = argv[++i];
    else {
      console.error('Unknown argument: ' + argv[i]);
      process.exit(2);
    }
  }
  return { root, only };
}

function linesFor(name, result) {
  if (!result || result.ok !== true) {
    const fails = (result && result.fails) || [{ file: '.', line: 1, reason: 'scan error' }];
    if (!fails.length) return ['SCAN FAIL ' + name + ': .:1 scan error'];
    return fails.map(f => 'SCAN FAIL ' + name + ': ' + f.file + ':' + f.line + ' ' + f.reason);
  }
  return ['SCAN PASS ' + name];
}

function main() {
  const { root, only } = parseArgs(process.argv.slice(2));
  const chosen = only ? ALL.filter(s => s[0] === only) : ALL;
  if (!chosen.length) {
    console.error('Unknown scan: ' + only);
    process.exit(2);
  }
  let failed = false;
  for (const [name, fn] of chosen) {
    let result;
    try { result = fn(root); }
    catch (e) {
      result = { ok: false, fails: [{ file: '.', line: 1, reason: 'scan error ' + (e && e.message ? e.message : e) }] };
    }
    const lines = linesFor(name, result);
    for (const line of lines) console.log(line);
    if (!result || result.ok !== true) failed = true;
  }
  process.exit(failed ? 1 : 0);
}

if (require.main === module) main();

module.exports = { linesFor, main };
