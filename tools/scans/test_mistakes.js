/* Test-mistake scan. Spec files and helpers under tests/.
   A hit is SCAN FAIL test_mistakes: <file:line> <reason>, plus one summary
   line SCAN FAIL test_mistakes (N). A missing tests/ directory fails closed.
   (a) a hardcoded /opt/cursor/artifacts path. Screenshots go through
   artifactsDir() in tests/helpers.js. That fallback line carries the marker.
   (b) a baseline taken from git show HEAD: (also HEAD~ and quoted HEAD:).
   Full-line // comments are skipped. A line with the marker
   "scan-ok: test-mistakes" is skipped. */
const fs = require('fs');
const path = require('path');

const MARKER = 'scan-ok: test-mistakes';
const ARTIFACTS = '/opt/cursor/artifacts';

function rel(root, file) {
  return path.relative(root, file).split(path.sep).join('/');
}

function skipLine(line, inBlock) {
  const t = line.trim();
  if (inBlock.v) {
    if (t.indexOf('*/') >= 0) inBlock.v = false;
    return true;
  }
  if (!t || t.startsWith('//') || t.startsWith('*')) return true;
  if (t.startsWith('/*')) {
    if (t.indexOf('*/') < 0) inBlock.v = true;
    return true;
  }
  if (line.indexOf(MARKER) >= 0) return true;
  return false;
}

function gitShowBaseline(line) {
  if (/git\s+show\s+['"]?HEAD[:~]/.test(line)) return true;
  if (/['"`]HEAD[:~]/.test(line)) return true;
  if (/\b(execSync|execFileSync|spawnSync|spawn|execFile|exec)\s*\(/.test(line) && /HEAD[:~]/.test(line)) return true;
  return false;
}

function jsFiles(dir, out) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch (e) { return; }
  for (const ent of entries) {
    if (ent.name === 'node_modules' || ent.name === '.git') continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) jsFiles(full, out);
    else if (ent.isFile() && ent.name.endsWith('.js')) out.push(full);
  }
}

function scanTestMistakes(root) {
  const testsDir = path.join(root, 'tests');
  if (!fs.existsSync(testsDir)) {
    return { ok: false, fails: [{ file: 'tests', line: 1, reason: 'missing tests directory' }] };
  }
  const files = [];
  jsFiles(testsDir, files);
  files.sort();
  const fails = [];
  for (const file of files) {
    let text;
    try { text = fs.readFileSync(file, 'utf8'); }
    catch (e) {
      fails.push({ file: rel(root, file), line: 1, reason: 'missing file' });
      continue;
    }
    const lines = text.split('\n');
    const inBlock = { v: false };
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (skipLine(line, inBlock)) continue;
      if (line.indexOf(ARTIFACTS) >= 0) {
        fails.push({ file: rel(root, file), line: i + 1, reason: 'hardcoded /opt/cursor/artifacts' });
      }
      if (gitShowBaseline(line)) {
        fails.push({ file: rel(root, file), line: i + 1, reason: 'git show HEAD baseline' });
      }
    }
  }
  return { ok: fails.length === 0, fails };
}

module.exports = { scanTestMistakes, MARKER };
