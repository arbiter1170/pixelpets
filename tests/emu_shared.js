/* One local Firebase emulator for coop_r2, play_together, aura_perf and art_pass_coop.
   The first file starts it and records the pid. Later files reuse the open ports.
   tests/emu_teardown.js stops that pid after the run. The lock still keeps the
   three files from sharing a room at the same time. Never the live project. */
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const net = require('net');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LOCK = path.join(ROOT, 'test-logs', 'rtdb-play.lock');
const PID = path.join(ROOT, 'test-logs', 'rtdb-emu.pid');

function portOpen(port) {
  return new Promise(res => {
    const s = net.connect({ port, host: '127.0.0.1' }, () => { s.end(); res(true); });
    s.on('error', () => res(false));
  });
}
async function emuPorts(which) {
  const db = await portOpen(9000), auth = await portOpen(9099), store = await portOpen(8180);
  return which === 'all' ? db && auth && store : db || auth || store;
}
async function waitUntil(pred, ms, err) {
  const t0 = Date.now();
  while (!(await pred())) {
    if (Date.now() - t0 > ms) throw new Error(err);
    await new Promise(r => setTimeout(r, 200));
  }
}
function dbAnswers() {
  return new Promise(res => {
    const req = http.get({ host: '127.0.0.1', port: 9000, path: '/.json?ns=demo-walklings', timeout: 1000 }, (r) => { r.resume(); res(true); });
    req.on('error', () => res(false));
    req.on('timeout', () => { req.destroy(); res(false); });
  });
}
async function lockEmu() {
  fs.mkdirSync(path.dirname(LOCK), { recursive: true });
  for (let i = 0; i < 1200; i++) {
    try { fs.writeFileSync(LOCK, String(process.pid), { flag: 'wx' }); return; }
    catch (e) {
      let owner = 0;
      try { owner = parseInt(fs.readFileSync(LOCK, 'utf8'), 10); } catch (e2) {}
      let alive = false;
      if (owner) { try { process.kill(owner, 0); alive = true; } catch (e3) {} }
      if (!alive) { try { fs.unlinkSync(LOCK); } catch (e4) {} continue; }
      await new Promise(r => setTimeout(r, 500));
    }
  }
  throw new Error('emulator lock');
}
function unlockEmu() {
  try {
    if (fs.existsSync(LOCK) && fs.readFileSync(LOCK, 'utf8') === String(process.pid)) fs.unlinkSync(LOCK);
  } catch (e) {}
}
function firebaseCmd() {
  const bin = path.join(ROOT, 'node_modules', '.bin', 'firebase');
  if (fs.existsSync(bin)) return { cmd: bin, args: ['emulators:start', '--only', 'auth,firestore,database', '--project', 'demo-walklings'] };
  return { cmd: 'npx', args: ['firebase', 'emulators:start', '--only', 'auth,firestore,database', '--project', 'demo-walklings'] };
}

async function ensureEmulator() {
  await lockEmu();
  if (!(await emuPorts('all')) && (await emuPorts('any'))) {
    await waitUntil(async () => !(await emuPorts('any')), 20000, 'previous emulator did not exit');
  }
  if (!(await emuPorts('all'))) {
    const spec = firebaseCmd();
    const emu = spawn(spec.cmd, spec.args, { cwd: ROOT, detached: true, stdio: 'ignore' });
    fs.mkdirSync(path.dirname(PID), { recursive: true });
    fs.writeFileSync(PID, String(emu.pid));
    emu.unref();
    await waitUntil(() => emuPorts('all'), 40000, 'database emulator did not start');
  }
  await waitUntil(dbAnswers, 10000, 'database emulator did not answer');
}

function releaseEmulator() {
  unlockEmu();
}

module.exports = { ensureEmulator, releaseEmulator };
