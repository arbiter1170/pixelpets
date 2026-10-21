#!/usr/bin/env node
/* tools/pp_test.js
   Agent-friendly wrapper for the Walklings Playwright suite.
   - Runs the fail-closed scans, the build check, then `playwright test` with the line + json reporters.
   - All raw output goes to a log file; stdout gets a short summary only.
   - Exits with Playwright's real exit code (no pipe masking).
   Usage: node tools/pp_test.js [any playwright args, e.g. tests/smoke.spec.js --project=390]
   Env: PP_TEST_DIR (default test-logs; NOT under test-results/, which Playwright wipes at start), PP_TEST_MAX_FAILS (10), PP_TEST_ERR_LINES (12). */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const outDir = process.env.PP_TEST_DIR || 'test-logs';
const maxFails = +(process.env.PP_TEST_MAX_FAILS || 10);
const errLines = +(process.env.PP_TEST_ERR_LINES || 12);
fs.mkdirSync(outDir, { recursive: true });
const logPath = path.join(outDir, 'run.log');
const jsonPath = path.join(outDir, 'results.json');
const sumPath = path.join(outDir, 'summary.txt');
for (const p of [jsonPath, sumPath]) { try { fs.unlinkSync(p); } catch (e) {} }
const log = fs.openSync(logPath, 'w');
const strip = s => String(s || '').replace(/\x1b\[[0-9;]*[A-Za-z]/g, '');
const t0 = Date.now();

// 0. Fail-closed scans, then their synthetic proof. Playwright does not start
// if either step fails.
function stopForScan(child, stage) {
  const out = strip((child.stdout || '') + (child.stderr || ''));
  const names = [...out.matchAll(/^SCAN FAIL ([^:\s]+):/gm)].map(m => m[1]);
  const uniq = [...new Set(names)];
  const code = child.status === null ? 2 : (child.status || 1);
  const named = stage === 'scans' ? (' scan=' + (uniq.join(',') || 'unknown')) : '';
  const msg = [
    out.trimEnd(),
    `PP_TEST RESULT: FAIL exit=${code} stage=${stage}${named}`,
    `LOG: ${logPath}`,
    '',
  ].join('\n');
  fs.writeFileSync(sumPath, msg);
  process.stdout.write(msg);
  process.exit(code);
}
const scans = spawnSync(process.execPath, ['tools/scans/run.js'], { encoding: 'utf8' });
try { fs.writeSync(log, scans.stdout || ''); fs.writeSync(log, scans.stderr || ''); } catch (e) {}
if (scans.status !== 0) stopForScan(scans, 'scans');
const selftest = spawnSync(process.execPath, ['tools/scans/selftest.js'], { encoding: 'utf8' });
try { fs.writeSync(log, selftest.stdout || ''); fs.writeSync(log, selftest.stderr || ''); } catch (e) {}
if (selftest.status !== 0) stopForScan(selftest, 'scan-selftest');

// 1. build stamp check (same as `npm test` step 1)
const chk = spawnSync('python3', ['tools/bump_build.py', '--check'], { stdio: ['ignore', log, log] });
if (chk.status !== 0) {
  const msg = `PP_TEST RESULT: FAIL exit=${chk.status} stage=check:build (bump_build.py --check failed)\nLOG: ${logPath}\n`;
  fs.writeFileSync(sumPath, msg); process.stdout.write(msg); process.exit(chk.status || 1);
}

// 1b. RTDB rules against the local database emulator (never the live project).
const rules = spawnSync(process.execPath, ['tools/rtdb_rules_test.js'], { stdio: ['ignore', log, log] });
const rulesText = strip(fs.readFileSync(logPath, 'utf8'));
const rulesLine = (rulesText.split('\n').filter(l => l.startsWith('RTDB_RULES RESULT')).pop()) || `RTDB_RULES RESULT: FAIL exit=${rules.status}`;
if (rules.status !== 0) {
  const tail = rulesText.split('\n').filter(l => l.trim() && !l.startsWith('[WebServer]')).slice(-errLines);
  const msg = [
    `PP_TEST RESULT: FAIL exit=${rules.status || 1} stage=rtdb-rules`,
    rulesLine,
    'LAST LOG LINES:',
    ...tail.map(l => '  ' + l),
    `LOG: ${logPath}`,
    '',
  ].join('\n');
  fs.writeFileSync(sumPath, msg); process.stdout.write(msg); process.exit(rules.status || 1);
}

// 2. playwright, everything to the log; json report to file
const pw = spawnSync('npx', ['playwright', 'test', '--reporter=line,json', ...process.argv.slice(2)], {
  stdio: ['ignore', log, log],
  env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: jsonPath, FORCE_COLOR: '0' },
});
const code = pw.status === null ? 2 : pw.status;
const secs = Math.round((Date.now() - t0) / 1000);

let report = null;
try { report = JSON.parse(fs.readFileSync(jsonPath, 'utf8')); } catch (e) {}
const out = [];
if (!report) {
  out.push(`PP_TEST RESULT: ERROR exit=${code} time=${secs}s (no JSON report; Playwright did not finish${pw.signal ? '; killed by ' + pw.signal : ''})`);
  const tail = strip(fs.readFileSync(logPath, 'utf8')).split('\n').filter(l => !l.startsWith('[WebServer]')).slice(-errLines);
  out.push('LAST LOG LINES:', ...tail.map(l => '  ' + l));
} else {
  const fails = [], flaky = [];
  const walk = (suite, file) => {
    for (const s of suite.suites || []) walk(s, s.file || file);
    for (const spec of suite.specs || []) for (const t of spec.tests || []) {
      const item = { where: `[${t.projectName}] ${spec.file || file}:${spec.line}`, title: spec.title, results: t.results || [] };
      if (t.status === 'unexpected') fails.push(item);
      else if (t.status === 'flaky') flaky.push(item);
    }
  };
  for (const s of report.suites || []) walk(s, s.file);
  const st = report.stats || {};
  const verdict = code === 0 ? 'PASS' : 'FAIL';
  out.push(`PP_TEST RESULT: ${verdict} exit=${code} passed=${st.expected || 0} failed=${st.unexpected || 0} flaky=${st.flaky || 0} skipped=${st.skipped || 0} time=${secs}s`);
  if (code !== 0 && !fails.length) out.push('NOTE: non-zero exit with no failed test (config/webServer/global error); see LOG and report.errors');
  for (const e of (report.errors || []).slice(0, 3)) out.push('GLOBAL ERROR:', ...strip(e.message).split('\n').slice(0, errLines).map(l => '  ' + l));
  // group the same test failing the same way at several widths into one entry
  const groups = new Map();
  for (const f of fails) {
    const last = f.results[f.results.length - 1] || {};
    const msg = strip((last.error && (last.error.message || last.error.value)) || (last.errors && last.errors[0] && last.errors[0].message) || '(no message)');
    const proj = f.where.match(/^\[(.*?)\] (.*)$/);
    const key = proj[2] + '|' + f.title + '|' + msg;
    if (!groups.has(key)) groups.set(key, { projects: [], loc: proj[2], title: f.title, msg });
    groups.get(key).projects.push(proj[1]);
  }
  const g = [...groups.values()];
  g.slice(0, maxFails).forEach(x => {
    out.push(`FAIL [${x.projects.join(',')}] ${x.loc} :: ${x.title}`);
    out.push(...x.msg.split('\n').filter(l => l.trim()).slice(0, errLines).map(l => '  ' + l));
  });
  if (g.length > maxFails) out.push(`... ${g.length - maxFails} more distinct failures: grep -nE "^\\s+[0-9]+\\) \\[" ${logPath}`);
  // A test that only passed on a retry is flaky: a warning, not a failure (Playwright exits 0 for it).
  if (flaky.length) out.push(`WARN: ${flaky.length} flaky test(s) passed only on retry; not a failure, but report them`);
  flaky.slice(0, maxFails).forEach(f => out.push(`FLAKY ${f.where} :: ${f.title} (passed on retry ${f.results.length - 1})`));
}
out.push(rulesLine);
out.push(`LOG: ${logPath}  JSON: ${jsonPath}`);
const text = out.join('\n') + '\n';
fs.writeFileSync(sumPath, text);
process.stdout.write(text);
process.exit(code);
