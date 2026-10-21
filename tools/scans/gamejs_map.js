/* Line-map scan. Fail closed when tools/GAMEJS_MAP.txt is missing or stale.
   The fix is: run python3 tools/gen_gamejs_map.py */
const { spawnSync } = require('child_process');
const path = require('path');

const FIX = 'run python3 tools/gen_gamejs_map.py';

function scanGamejsMap(root) {
  const script = path.join(__dirname, '..', 'gen_gamejs_map.py');
  const res = spawnSync('python3', [script, '--check', '--root', root], { encoding: 'utf8' });
  if (res.status === 0) return { ok: true, fails: [] };
  return { ok: false, fails: [{ file: 'tools/GAMEJS_MAP.txt', line: 1, reason: FIX }] };
}

module.exports = { scanGamejsMap, FIX };
