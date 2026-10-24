#!/usr/bin/env node
/* Synthetic proof for the scans. Builds temp inputs and checks file:line.
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
  const range = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-scan-drange-'));
  const closed = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-scan-dclosed-'));
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
  openFile(range, [
    '# Open decisions',
    '',
    NF + 'D10.',
    '',
    '## Open',
    '',
    head,
    row.replace('{id}', '8'),
  ].join('\n'));
  archFile(range, '- **D8\u2013D9 (range head).**\n');
  openFile(closed, [
    '# Open decisions',
    '',
    NF + 'D3.',
    '',
    '## Open',
    '',
    head,
    row.replace('{id}', '1'),
  ].join('\n'));
  archFile(closed, '- **D2 (note).** Closed by D1.\n');
  return { dup, wrong, missing, clean, split, bullet, restate, archHigh, range, closed };
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
  const loose = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-scan-sloose-'));
  const ignored = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-scan-signored-'));
  fs.writeFileSync(path.join(clean, 'a.txt'), 'hi\n');
  git(clean, ['init']);
  git(clean, ['add', 'a.txt']);
  git(clean, ['commit', '-m', 'a']);
  fs.mkdirSync(path.join(clean, 'node_modules'));
  fs.writeFileSync(path.join(clean, 'node_modules', 'keep.txt'), 'x\n');
  fs.symlinkSync('keep.txt', path.join(clean, 'node_modules', 'inside'));
  fs.writeFileSync(path.join(bad, 'a.txt'), 'hi\n');
  git(bad, ['init']);
  git(bad, ['add', 'a.txt']);
  git(bad, ['commit', '-m', 'a']);
  fs.symlinkSync('a.txt', path.join(bad, 'link.txt'));
  git(bad, ['add', 'link.txt']);
  git(bad, ['commit', '-m', 'link']);
  fs.writeFileSync(path.join(loose, 'a.txt'), 'hi\n');
  git(loose, ['init']);
  git(loose, ['add', 'a.txt']);
  git(loose, ['commit', '-m', 'a']);
  fs.symlinkSync('node_modules', path.join(loose, 'to_modules'));
  fs.writeFileSync(path.join(ignored, 'a.txt'), 'hi\n');
  fs.writeFileSync(path.join(ignored, '.gitignore'), 'skip-me\n');
  git(ignored, ['init']);
  git(ignored, ['add', 'a.txt', '.gitignore']);
  git(ignored, ['commit', '-m', 'a']);
  fs.symlinkSync('a.txt', path.join(ignored, 'skip-me'));
  return { bad, clean, notRepo, loose, ignored };
}

function mistakeFixtures() {
  const bad = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-scan-mbad-'));
  const clean = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-scan-mclean-'));
  const badBody = [
    "const shot = '/opt/cursor/artifacts/x.png';",
    "execSync('git show HEAD:keeper.js');",
    "spawnSync('git', ['show', 'HEAD~1:keeper.js']);",
    "execSync(\"git show 'HEAD:keeper.js'\");",
    '',
  ].join('\n');
  const cleanBody = [
    '// /opt/cursor/artifacts and git show HEAD: belong in this comment',
    "const dir = artifactsDir(); // scan-ok: test-mistakes",
    "const fallback = '/opt/cursor/artifacts'; // scan-ok: test-mistakes",
    'expect(1).toBe(1);',
    '',
  ].join('\n');
  writeTree(bad, { 'tests/bad.spec.js': badBody });
  writeTree(clean, { 'tests/ok.spec.js': cleanBody, 'tests/helpers.js': cleanBody });
  return { bad, clean };
}

function mapFixtures() {
  const js = 'function alpha(){\n  return 1;\n}\n';
  const stale = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-scan-mstale-'));
  writeTree(stale, {
    'game.js': js,
    'tools/GAMEJS_MAP.txt': 'stale\n',
  });
  const crash = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-scan-mcrash-'));
  writeTree(crash, {
    'game.js': js,
    'tools/GAMEJS_MAP.txt': 'ignored\n',
    'tools/gen_gamejs_map.py': 'import sys\nsys.stderr.write("map generator blew up\\n")\nsys.exit(2)\n',
  });
  const fresh = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-scan-mfresh-'));
  writeTree(fresh, { 'game.js': js });
  const gen = path.join(__dirname, '..', 'gen_gamejs_map.py');
  const wrote = spawnSync('python3', [gen, '--root', fresh], { encoding: 'utf8' });
  if (wrote.status !== 0) throw new Error('fresh map ' + (wrote.stderr || wrote.stdout));
  return { stale, crash, fresh };
}

function rm(dir) { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {} }

function main() {
  const w = wordingFixtures();
  const d = decisionsFixtures();
  const tm = mistakeFixtures();
  let s = null;
  let m = null;
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
    show('decisions duplicate archive bullet', bulletD);
    check(bulletD.status === 1, 'archive bullet exit ' + bulletD.status + '\n' + bulletD.stdout);
    check(bulletD.stdout.indexOf('SCAN FAIL decisions: archive/DECISIONS_SETTLED.md:1 duplicate D6') >= 0, 'archive bullet line\n' + bulletD.stdout);

    const restateD = run(d.restate, 'decisions');
    show('decisions restatement', restateD);
    check(restateD.status === 0, 'restatement exit ' + restateD.status + '\n' + restateD.stdout);
    check(restateD.stdout.trim() === 'SCAN PASS decisions', 'restatement output');

    const archD = run(d.archHigh, 'decisions');
    show('decisions archive highest', archD);
    check(archD.status === 0, 'archive highest exit ' + archD.status + '\n' + archD.stdout);
    check(archD.stdout.trim() === 'SCAN PASS decisions', 'archive highest output');

    const rangeD = run(d.range, 'decisions');
    show('decisions range head', rangeD);
    check(rangeD.status === 0, 'range exit ' + rangeD.status + '\n' + rangeD.stdout);
    check(rangeD.stdout.trim() === 'SCAN PASS decisions', 'range output');

    const closedD = run(d.closed, 'decisions');
    show('decisions closed-by reference', closedD);
    check(closedD.status === 0, 'closed-by exit ' + closedD.status + '\n' + closedD.stdout);
    check(closedD.stdout.trim() === 'SCAN PASS decisions', 'closed-by output');

    m = mapFixtures();
    const staleM = run(m.stale, 'gamejs_map');
    show('gamejs map stale', staleM);
    check(staleM.status === 1, 'stale map exit ' + staleM.status + '\n' + staleM.stdout + (staleM.stderr || ''));
    check(staleM.stdout.indexOf('GAMEJS_MAP stale: run python3 tools/gen_gamejs_map.py') >= 0, 'stale map message\n' + staleM.stdout);
    check(staleM.stdout.indexOf('crashed') < 0, 'stale map must not say crashed\n' + staleM.stdout);

    const crashM = run(m.crash, 'gamejs_map');
    show('gamejs map crash', crashM);
    check(crashM.status === 1, 'crash map exit ' + crashM.status + '\n' + crashM.stdout + (crashM.stderr || ''));
    check(crashM.stdout.indexOf('gen_gamejs_map.py crashed (exit 2)') >= 0, 'crash message\n' + crashM.stdout);
    check(crashM.stdout.indexOf('map generator blew up') >= 0, 'crash error text\n' + crashM.stdout);
    check(crashM.stdout.indexOf('run python3 tools/gen_gamejs_map.py') < 0, 'crash must not give the stale advice\n' + crashM.stdout);

    const freshM = run(m.fresh, 'gamejs_map');
    show('gamejs map fresh', freshM);
    check(freshM.status === 0, 'fresh map exit ' + freshM.status + '\n' + freshM.stdout + (freshM.stderr || ''));
    check(freshM.stdout.trim() === 'SCAN PASS gamejs_map', 'fresh map output\n' + freshM.stdout);

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

    const looseS = run(s.loose, 'symlinks');
    show('symlinks untracked', looseS);
    check(looseS.status === 1, 'untracked symlink exit ' + looseS.status);
    check(looseS.stdout.indexOf('SCAN FAIL symlinks: to_modules:1 symlink (mode 120000)') >= 0, 'untracked symlink line\n' + looseS.stdout);

    const badT = run(tm.bad, 'test_mistakes');
    show('test_mistakes bad', badT);
    check(badT.status === 1, 'test_mistakes bad exit ' + badT.status);
    check(badT.stdout.indexOf('SCAN FAIL test_mistakes: tests/bad.spec.js:1 hardcoded /opt/cursor/artifacts') >= 0, 'artifacts line\n' + badT.stdout);
    check(badT.stdout.indexOf('SCAN FAIL test_mistakes: tests/bad.spec.js:2 git show HEAD baseline') >= 0, 'git show HEAD: line\n' + badT.stdout);
    check(badT.stdout.indexOf('SCAN FAIL test_mistakes: tests/bad.spec.js:3 git show HEAD baseline') >= 0, 'git show HEAD~ line\n' + badT.stdout);
    check(badT.stdout.indexOf('SCAN FAIL test_mistakes: tests/bad.spec.js:4 git show HEAD baseline') >= 0, 'quoted HEAD: line\n' + badT.stdout);
    check(badT.stdout.indexOf('SCAN FAIL test_mistakes (4)') >= 0, 'test_mistakes count\n' + badT.stdout);
    check(badT.stdout.indexOf('SCAN PASS test_mistakes') < 0, 'test_mistakes bad must not pass');

    const cleanT = run(tm.clean, 'test_mistakes');
    show('test_mistakes clean', cleanT);
    check(cleanT.status === 0, 'test_mistakes clean exit ' + cleanT.status + '\n' + cleanT.stdout);
    check(cleanT.stdout.trim() === 'SCAN PASS test_mistakes', 'test_mistakes clean output');

    const ignS = run(s.ignored, 'symlinks');
    show('symlinks ignored', ignS);
    check(ignS.status === 1, 'ignored symlink exit ' + ignS.status);
    check(ignS.stdout.indexOf('SCAN FAIL symlinks: skip-me:1 symlink (mode 120000)') >= 0, 'ignored symlink line\n' + ignS.stdout);
  } finally {
    for (const dir of Object.values(w)) rm(dir);
    for (const dir of Object.values(d)) rm(dir);
    for (const dir of Object.values(tm)) rm(dir);
    if (s) for (const dir of Object.values(s)) rm(dir);
    if (m) for (const dir of Object.values(m)) rm(dir);
  }
  if (failed) {
    console.error('SELFTEST FAIL count=' + failed);
    process.exit(1);
  }
  console.log('SCAN SELFTEST PASS');
}

main();
