/* Symlink scan. Tracked links (git mode 120000) fail, and so does any other
   symlink under the same tree: untracked, git-ignored, or a link to node_modules.
   node_modules directories are not walked. A symlink named node_modules still fails.
   If git is missing, the directory is not a repository, or a walk errors, that is a failure. */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function scanSymlinks(root) {
  const git = spawnSync('git', ['ls-files', '-s'], { cwd: root, encoding: 'utf8' });
  if (git.error || git.status !== 0) {
    const reason = git.error ? 'git unavailable' : 'not a git repository';
    return { ok: false, fails: [{ file: '.', line: 1, reason }] };
  }
  const fails = [];
  const seen = new Set();
  function add(file, reason) {
    if (seen.has(file)) return;
    seen.add(file);
    fails.push({ file, line: 1, reason });
  }
  for (const line of String(git.stdout || '').split('\n')) {
    if (!line) continue;
    const tab = line.indexOf('\t');
    if (tab < 0) continue;
    const mode = line.slice(0, tab).split(/\s+/)[0];
    const file = line.slice(tab + 1);
    if (mode === '120000') add(file, 'symlink (mode 120000)');
  }
  let walkError = null;
  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) {
      const rel = path.relative(root, dir).split(path.sep).join('/');
      walkError = { file: rel || '.', line: 1, reason: 'walk error' };
      return;
    }
    for (const ent of entries) {
      if (walkError) return;
      if (ent.name === '.git') continue;
      const full = path.join(dir, ent.name);
      const rel = path.relative(root, full).split(path.sep).join('/');
      if (ent.isSymbolicLink()) {
        add(rel, 'symlink (mode 120000)');
        continue;
      }
      if (ent.name === 'node_modules') continue;
      if (ent.isDirectory()) walk(full);
    }
  }
  walk(root);
  if (walkError) return { ok: false, fails: [walkError] };
  return { ok: fails.length === 0, fails };
}

module.exports = { scanSymlinks };
