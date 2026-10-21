#!/usr/bin/env node
/* Synthetic proof for the three scans. Builds temp inputs and checks file:line.
   The toy brand is built from char codes, never written in this file. */
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { BRAND_CODES } = require('./wording');

const RUN = path.join(__dirname, 'run.js');
const brand = String.fromCharCode.apply(null, BRAND_CODES);
let failed = 0;

function check(cond, msg) {
  if (!cond) { console.error('SELFTEST FAIL: ' + msg); failed++; }
}

function run(dir, only) {
  return spawnSync(process.execPath, [RUN, '--root', dir, '--only', only], { encoding: 'utf8' });
}

function show(title, res) {
  console.log('--- ' + title + ' ---');
  process.stdout.write(res.stdout || '');
  if (res.stderr) process.stderr.write(res.stderr);
}

function writeTree(dir, files) {
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, body] of Object.entries(files)) {
    const abs = path.join(dir, name);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, body);
  }
}

const CLEAN_JS = [
  '// the keeper in a comment must not count',
  'function glimmerDevCheck(){',
  "  const bad = [];",
  "  bad.push('needs a keepers option and a trainer');",
  '  return bad;',
  '}',
  "console.log('pocket of coins');",
  "debugOut('Unknown trainer.');",
  "const side = 'keepers';",
  "const flag = 'trainer.r2_lead';",
  "const line = 'The Keeper waits by the gate.';",
  '',
].join('\n');

function wordingFixtures() {
  const bad = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-scan-wbad-'));
  const clean = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-scan-wclean-'));
  const broken = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-scan-wparse-'));
  const badJson = [
    '{',
    '  "side": "keepers",',
    '  "intro": "the keeper waits by the gate",',
    '  "pay": "a pocket of coins",',
    '  "toy": ' + JSON.stringify(brand),
    '}',
    '',
  ].join('\n');
  const cleanJson = [
    '{',
    '  "side": "keepers",',
    '  "intro": "The Keeper waits by the gate.",',
    '  "pay": "a pocket of Acorns",',
    '  "engineAsks": { "room_trainers": "Trainer objects inside rooms." }',
    '}',
    '',
  ].join('\n');
  writeTree(bad, { 'data/player.json': badJson, 'game.js': CLEAN_JS, 'ribbit.js': CLEAN_JS });
  writeTree(clean, { 'data/player.json': cleanJson, 'game.js': CLEAN_JS, 'ribbit.js': CLEAN_JS });
  writeTree(broken, { 'data/player.json': '{ "intro": \n', 'game.js': CLEAN_JS, 'ribbit.js': CLEAN_JS });
  return { bad, clean, broken };
}

function decisionFile(body) { return body.endsWith('\n') ? body : body + '\n'; }

function decisionsFixtures() {
  const NF = 'Next ' + 'free id is ';
  const dup = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-scan-ddup-'));
  const wrong = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-scan-dwrong-'));
  const missing = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-scan-dmiss-'));
  const clean = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-scan-dclean-'));
  const split = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-scan-dsplit-'));
  const bullet = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-scan-dbullet-'));
  const restate = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-scan-drestate-'));
  const archHigh = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-scan-darch-'));
  const row = '| D{id} | a | b | c | d |';
  const head = '| # | Area | Decision needed | What the build does today | Where to change it |\n|---|---|---|---|---|';
  function openFile(dir, body) {
    fs.writeFileSync(path.join(dir, 'OPEN_DECISIONS.md'), decisionFile(body));
  }
  function archFile(dir, body) {
    const folder = path.join(dir, 'archive');
    fs.mkdirSync(folder, { recursive: true });
    fs.writeFileSync(path.join(folder, 'DECISIONS_SETTLED.md'), decisionFile(body));
  }
  openFile(dup, [
    '# Open decisions',
    '',
    NF + 'D3.',
    '',
    '## Open',
    '',
    head,
    row.replace('{id}', '1'),
    row.replace('{id}', '2'),
    row.replace('{id}', '1'),
  ].join('\n'));
  openFile(wrong, [
    '# Open decisions',
    '',
    NF + 'D9.',
    '',
    '## Open',
    '',
    head,
    row.replace('{id}', '1'),
    row.replace('{id}', '2'),
  ].join('\n'));
  openFile(missing, [
    '# Open decisions',
    '',
    'No next-free sentence here.',
    '',
    '## Open',
    '',
    head,
    row.replace('{id}', '1'),
  ].join('\n'));
  openFile(clean, [
    '# Open decisions',
    '',
    'D37 is used twice. Do not renumber either row. D4-D6 are reserved. ' + NF + 'D38.',
    '',
    '## Open',
    '',
    head,
    row.replace('{id}', '1'),
    row.replace('{id}', '37'),
    row.replace('{id}', '37'),
  ].join('\n'));
  openFile(split, [
    '# Open decisions',
    '',
    NF + 'D6.',
    '',
    '## Open',
    '',
    head,
    row.replace('{id}', '5'),
  ].join('\n'));
  archFile(split, [
    '# Settled',
    '',
    head,
    row.replace('{id}', '5'),
  ].join('\n'));
  openFile(bullet, [
    '# Open decisions',
    '',
    NF + 'D7.',
    '',
    '## Open',
    '',
    head,
    row.replace('{id}', '6'),
  ].join('\n'));
  archFile(bullet, '- **D6 kept call.**\n');
  openFile(restate, [
    '# Open decisions',
    '',
    NF + 'D2.',
    '',
    '## Open',
    '',
    head,
    row.replace('{id}', '1'),
  ].join('\n'));
  archFile(restate, '- Restatement of D1 (was in OPEN_DECISIONS Settled): - **D1 (old).** pipes kept | a | b |\n');
  openFile(archHigh, [
    '# Open decisions',
    '',
    NF + 'D9.',
    '',
    '## Open',
    '',
    head,
    row.replace('{id}', '1'),
  ].join('\n'));
  archFile(archHigh, [
    '# Settled',
    '',
    head,
    row.replace('{id}', '8'),
  ].join('\n'));
  return { dup, wrong, missing, clean, split, bullet, restate, archHigh };
}

function git(dir, args) {
  const res = spawnSync('git', ['-c', 'commit.gpgsign=false', '-c', 'user.email=scan@example.com', '-c', 'user.name=Scan', ...args], {
    cwd: dir,
    encoding: 'utf8',
    env: Object.assign({}, process.env, {
      GIT_AUTHOR_NAME: 'Scan',
      GIT_AUTHOR_EMAIL: 'scan@example.com',
      GIT_COMMITTER_NAME: 'Scan',
      GIT_COMMITTER_EMAIL: 'scan@example.com',
    }),
  });
  if (res.status !== 0) throw new Error('git ' + args.join(' ') + ' failed: ' + (res.stderr || res.stdout));
}

function symlinkFixtures() {
  const bad = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-scan-sbad-'));
  const clean = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-scan-sclean-'));
  const notRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-scan-snorepo-'));
  fs.writeFileSync(path.join(clean, 'a.txt'), 'hi\n');
  git(clean, ['init']);
  git(clean, ['add', 'a.txt']);
  git(clean, ['commit', '-m', 'a']);
  fs.writeFileSync(path.join(bad, 'a.txt'), 'hi\n');
  git(bad, ['init']);
  git(bad, ['add', 'a.txt']);
  git(bad, ['commit', '-m', 'a']);
  fs.symlinkSync('a.txt', path.join(bad, 'link.txt'));
  git(bad, ['add', 'link.txt']);
  git(bad, ['commit', '-m', 'link']);
  return { bad, clean, notRepo };
}

function rm(dir) { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {} }

function main() {
  const w = wordingFixtures();
  const d = decisionsFixtures();
  let s = null;
  try {
    const badW = run(w.bad, 'wording');
    show('wording bad', badW);
    check(badW.status === 1, 'wording bad exit ' + badW.status);
    check(badW.stdout.indexOf('SCAN FAIL wording: data/player.json:3 lowercase keeper') >= 0, 'keeper line');
    check(badW.stdout.indexOf('SCAN FAIL wording: data/player.json:4 coins') >= 0, 'coins line');
    check(badW.stdout.indexOf('SCAN FAIL wording: data/player.json:5 brand') >= 0, 'brand line');
    check(badW.stdout.indexOf('SCAN PASS wording') < 0, 'wording bad must not pass');
    check((badW.stdout.match(/SCAN FAIL wording:/g) || []).length === 3, 'wording bad hit count ' + badW.stdout);

    const cleanW = run(w.clean, 'wording');
    show('wording clean', cleanW);
    check(cleanW.status === 0, 'wording clean exit ' + cleanW.status);
    check(cleanW.stdout.trim() === 'SCAN PASS wording', 'wording clean output');

    const parseW = run(w.broken, 'wording');
    show('wording bad parse', parseW);
    check(parseW.status === 1, 'bad parse exit');
    check(/SCAN FAIL wording: data\/player\.json:\d+ bad parse/.test(parseW.stdout), 'bad parse line');

    const dup = run(d.dup, 'decisions');
    show('decisions duplicate', dup);
    check(dup.status === 1, 'duplicate exit');
    check(dup.stdout.indexOf('SCAN FAIL decisions: OPEN_DECISIONS.md:11 duplicate D1') >= 0, 'duplicate line\n' + dup.stdout);

    const wrong = run(d.wrong, 'decisions');
    show('decisions wrong next-free', wrong);
    check(wrong.status === 1, 'wrong exit');
    const missing = run(d.missing, 'decisions');
    show('decisions missing next-free', missing);
    check(missing.status === 1, 'missing exit');
    check(missing.stdout.indexOf('SCAN FAIL decisions: OPEN_DECISIONS.md:1 missing next-free id') >= 0, 'missing line\n' + missing.stdout);

    const cleanD = run(d.clean, 'decisions');
    show('decisions clean', cleanD);
    check(cleanD.status === 0, 'decisions clean exit ' + cleanD.status + '\n' + cleanD.stdout);
    check(cleanD.stdout.trim() === 'SCAN PASS decisions', 'decisions clean output');

    const stated = 'next ' + 'free is ';
    check(wrong.stdout.indexOf('SCAN FAIL decisions: OPEN_DECISIONS.md:3 ' + stated + 'D9, highest used or reserved is D2') >= 0, 'wrong line\n' + wrong.stdout);

    const splitD = run(d.split, 'decisions');
    show('decisions split-file duplicate', splitD);
    check(splitD.status === 1, 'split exit');
    check(splitD.stdout.indexOf('SCAN FAIL decisions: archive/DECISIONS_SETTLED.md:5 duplicate D5') >= 0, 'split line\n' + splitD.stdout);

    const bulletD = run(d.bullet, 'decisions');
    show('decisions bullet is not a definition', bulletD);
    check(bulletD.status === 0, 'bullet exit ' + bulletD.status + '\n' + bulletD.stdout);
    check(bulletD.stdout.trim() === 'SCAN PASS decisions', 'bullet output');

    const restateD = run(d.restate, 'decisions');
    show('decisions restatement', restateD);
    check(restateD.status === 0, 'restatement exit ' + restateD.status + '\n' + restateD.stdout);
    check(restateD.stdout.trim() === 'SCAN PASS decisions', 'restatement output');

    const archD = run(d.archHigh, 'decisions');
    show('decisions archive highest', archD);
    check(archD.status === 0, 'archive highest exit ' + archD.status + '\n' + archD.stdout);
    check(archD.stdout.trim() === 'SCAN PASS decisions', 'archive highest output');

    s = symlinkFixtures();
    const badS = run(s.bad, 'symlinks');
    show('symlinks bad', badS);
    check(badS.status === 1, 'symlink exit');
    check(badS.stdout.indexOf('SCAN FAIL symlinks: link.txt:1 symlink (mode 120000)') >= 0, 'symlink line\n' + badS.stdout);

    const cleanS = run(s.clean, 'symlinks');
    show('symlinks clean', cleanS);
    check(cleanS.status === 0, 'symlink clean exit');
    check(cleanS.stdout.trim() === 'SCAN PASS symlinks', 'symlink clean output');

    const none = run(s.notRepo, 'symlinks');
    show('symlinks not a repo', none);
    check(none.status === 1, 'not a repo exit');
    check(none.stdout.indexOf('SCAN FAIL symlinks: .:1 not a git repository') >= 0, 'not a repo line');
  } finally {
    for (const dir of Object.values(w)) rm(dir);
    for (const dir of Object.values(d)) rm(dir);
    if (s) for (const dir of Object.values(s)) rm(dir);
  }
  if (failed) {
    console.error('SELFTEST FAIL count=' + failed);
    process.exit(1);
  }
  console.log('SCAN SELFTEST PASS');
}

main();
