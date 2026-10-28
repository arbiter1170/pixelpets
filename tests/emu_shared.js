/* One local Firebase emulator for coop_r2, play_together, aura_perf, art_pass_coop and moves_v2.
   The first file starts it and records the pid. Later files reuse the open ports.
   tests/emu_teardown.js stops that pid after the run. The lock still keeps the
   three files from sharing a room at the same time. Never the live project.
   Ports come from PP_EMU_DB_PORT, PP_EMU_AUTH_PORT, PP_EMU_FS_PORT, PP_EMU_FS_WS_PORT,
   PP_EMU_HUB_PORT and PP_EMU_LOGGING_PORT. tools/pp_test.js or the Playwright global setup
   (tests/emu_setup.js) fills any that are unset with free ones, so a plain run gets its own
   ports too. Outside Playwright they fall back to the old 9000, 9099, 8180, 9150, 4400 and 4500.
   The pid file carries PP_EMU_RUN, so a run's teardown only finds the emulator that run started.
   Pages reach the same ports through emuQuery() (cloud.js reads dbPort, authPort and fsPort with ?cloud=emu). */
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const net = require('net');
const os = require('os');
const path = require('path');
const { envPort, writeConfig, firebaseLaunch } = require('../tools/emu_ports');

const ROOT = path.join(__dirname, '..');
// Read when called: the teardown may run after a spec loaded this file in the same process.
function emuState() {
  const ports = {
    database: envPort('PP_EMU_DB_PORT') || 9000,
    auth: envPort('PP_EMU_AUTH_PORT') || 9099,
    firestore: envPort('PP_EMU_FS_PORT') || 8180,
    firestoreWs: envPort('PP_EMU_FS_WS_PORT') || 9150,
    hub: envPort('PP_EMU_HUB_PORT') || 4400,
    logging: envPort('PP_EMU_LOGGING_PORT') || 4500,
  };
  const run = String(process.env.PP_EMU_RUN || process.pid).replace(/[^\w-]/g, '');
  return {
    ports,
    dir: path.join(os.tmpdir(), 'pp-emu-' + ports.database),
    pid: path.join(ROOT, 'test-logs', 'rtdb-emu-' + ports.database + '-' + run + '.pid'),
  };
}
const { ports: EMU_PORTS, dir: EMU_DIR, pid: PID } = emuState();
const LOCK = path.join(ROOT, 'test-logs', 'rtdb-play-' + EMU_PORTS.database + '.lock');
// Append to a ?cloud=emu query so the page talks to this run's emulator.
const emuQuery = () => '&dbPort=' + EMU_PORTS.database + '&authPort=' + EMU_PORTS.auth + '&fsPort=' + EMU_PORTS.firestore;

function portOpen(port) {
  return new Promise(res => {
    const s = net.connect({ port, host: '127.0.0.1' }, () => { s.end(); res(true); });
    s.on('error', () => res(false));
  });
}
async function emuPorts(which) {
  const db = await portOpen(EMU_PORTS.database), auth = await portOpen(EMU_PORTS.auth), store = await portOpen(EMU_PORTS.firestore);
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
    const req = http.get({ host: '127.0.0.1', port: EMU_PORTS.database, path: '/.json?ns=demo-walklings', timeout: 1000 }, (r) => { r.resume(); res(true); });
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
function firebaseCmd(config) {
  return firebaseLaunch(['emulators:start', '--only', 'auth,firestore,database', '--project', 'demo-walklings', '--config', config], true);
}

async function ensureEmulator() {
  await lockEmu();
  if (!(await emuPorts('all')) && (await emuPorts('any'))) {
    await waitUntil(async () => !(await emuPorts('any')), 20000, 'previous emulator did not exit');
  }
  if (!(await emuPorts('all'))) {
    const { dir, config } = writeConfig(EMU_PORTS, EMU_DIR);
    const spec = firebaseCmd(config);
    const emu = spawn(spec.cmd, spec.args, { cwd: dir, detached: true, windowsHide: true, stdio: 'ignore', env: { ...process.env, TMPDIR: dir } });
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

module.exports = { ensureEmulator, releaseEmulator, emuState, EMU_PORTS, EMU_DIR, PID, emuQuery };
