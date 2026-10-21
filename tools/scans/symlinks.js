/* Symlink scan. `git ls-files -s` must not list mode 120000.
   If git is missing or the directory is not a repository, that is a failure. */
const { spawnSync } = require('child_process');

function scanSymlinks(root) {
  const git = spawnSync('git', ['ls-files', '-s'], { cwd: root, encoding: 'utf8' });
  if (git.error || git.status !== 0) {
    const reason = git.error ? 'git unavailable' : 'not a git repository';
    return { ok: false, fails: [{ file: '.', line: 1, reason }] };
  }
  const fails = [];
  for (const line of String(git.stdout || '').split('\n')) {
    if (!line) continue;
    const tab = line.indexOf('\t');
    if (tab < 0) continue;
    const mode = line.slice(0, tab).split(/\s+/)[0];
    const file = line.slice(tab + 1);
    if (mode === '120000') fails.push({ file, line: 1, reason: 'symlink (mode 120000)' });
  }
  return { ok: fails.length === 0, fails };
}

module.exports = { scanSymlinks };
