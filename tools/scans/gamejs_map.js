/* Line-map scan. Fail closed.
   The generator's exit codes (tools/gen_gamejs_map.py):
     0  map is current
     1  map is missing or stale
     2  usage error, or the generator crashed
   Exit 1 is the stale case. Any other failure is a crash: spawn error,
   signal, or an exit code other than 0 or 1. */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const STALE = 'GAMEJS_MAP stale: run python3 tools/gen_gamejs_map.py';
const STALE_CODE = 1;

function generatorFor(root) {
  const local = path.join(root, 'tools', 'gen_gamejs_map.py');
  if (fs.existsSync(local)) return local;
  return path.join(__dirname, '..', 'gen_gamejs_map.py');
}

function clip(text) {
  const lines = String(text || '').replace(/\s+$/, '').split('\n');
  const kept = lines.length > 40 ? lines.slice(-40) : lines;
  return kept.join('\n');
}

function crashReason(res) {
  let n;
  if (res.signal) n = 'signal ' + res.signal;
  else if (res.status === null || res.status === undefined) n = 'spawn';
  else n = String(res.status);
  const bits = [];
  if (res.stderr) bits.push(res.stderr);
  if (res.stdout) bits.push(res.stdout);
  if (res.error && res.error.message) bits.push(res.error.message);
  const out = clip(bits.join('\n'));
  let reason = 'gen_gamejs_map.py crashed (exit ' + n + ')';
  if (out) reason += '\n' + out;
  return reason;
}

function scanGamejsMap(root) {
  const script = generatorFor(root);
  let res;
  try {
    res = spawnSync('python3', [script, '--check', '--root', root], { encoding: 'utf8' });
  } catch (e) {
    res = { status: null, signal: null, stdout: '', stderr: '', error: e };
  }
  if (!res) res = { status: null, signal: null, stdout: '', stderr: '', error: new Error('spawn failed') };
  if (res.status === 0 && !res.signal && !res.error) return { ok: true, fails: [] };
  if (res.status === STALE_CODE && !res.signal && !res.error) {
    return { ok: false, fails: [{ file: 'tools/GAMEJS_MAP.txt', line: 1, reason: STALE }] };
  }
  return { ok: false, fails: [{ file: 'tools/GAMEJS_MAP.txt', line: 1, reason: crashReason(res) }] };
}

module.exports = { scanGamejsMap, STALE };
