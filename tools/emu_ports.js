/* tools/emu_ports.js
   Ports and cleanup for the local Firebase emulators used by tests. Never the live project.
   - envPort / freePorts: an explicit env port wins; otherwise the OS hands out a free one
     (bind 127.0.0.1:0), so runs that share this machine never fight over 9000 / 4400.
   - writeConfig: a throwaway firebase.json with those ports, the UI off, and a copy of
     database.rules.json, in its own temp folder. The emulator runs with that folder as cwd
     and TMPDIR, so its hub locator file and debug logs stay private to the run.
   - killEmulator: SIGTERM the detached process group, wait, then SIGKILL it. The CLI starts
     java in a group of its own, so anything still running with its cwd in the temp folder
     (or the jar on our database port) is killed too. */
'use strict';
const fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function envPort(name) {
  const v = parseInt(process.env[name] || '', 10);
  return v > 0 && v < 65536 ? v : 0;
}

// Hold every server open until all are bound, so one call never returns the same port twice.
function freePorts(n) {
  const servers = [];
  const one = () => new Promise((resolve, reject) => {
    const s = net.createServer();
    s.unref();
    s.on('error', reject);
    s.listen({ host: '127.0.0.1', port: 0, exclusive: true }, () => { servers.push(s); resolve(s.address().port); });
  });
  return (async () => {
    const out = [];
    try { for (let i = 0; i < n; i++) out.push(await one()); }
    finally { await Promise.all(servers.map(s => new Promise(r => s.close(() => r())))); }
    return out;
  })();
}

// names: { key: ENV_NAME }. Returns { key: port } with env overrides kept and the rest free.
async function pickPorts(names) {
  const keys = Object.keys(names);
  const want = keys.filter(k => !envPort(names[k]));
  const free = await freePorts(want.length);
  const out = {};
  for (const k of keys) out[k] = envPort(names[k]) || free[want.indexOf(k)];
  return out;
}

function portOpen(port) {
  return new Promise(res => {
    const s = net.connect({ port, host: '127.0.0.1' }, () => { s.end(); res(true); });
    s.on('error', () => res(false));
  });
}

/* ports: { database, hub, logging, auth?, firestore?, firestoreWs? }. dir: an existing folder,
   or null for a fresh mkdtemp folder. Returns { dir, config }. */
function writeConfig(ports, dir) {
  const d = dir || fs.mkdtempSync(path.join(os.tmpdir(), 'pp-emu-'));
  fs.mkdirSync(d, { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'database.rules.json'), path.join(d, 'database.rules.json'));
  const emulators = {
    database: { host: '127.0.0.1', port: ports.database },
    hub: { host: '127.0.0.1', port: ports.hub },
    logging: { host: '127.0.0.1', port: ports.logging },
    ui: { enabled: false },
    singleProjectMode: true,
  };
  const cfg = { database: { rules: 'database.rules.json' }, emulators };
  if (ports.auth) emulators.auth = { host: '127.0.0.1', port: ports.auth };
  if (ports.firestore) {
    fs.copyFileSync(path.join(ROOT, 'firestore.rules'), path.join(d, 'firestore.rules'));
    cfg.firestore = { rules: 'firestore.rules' };
    emulators.firestore = { host: '127.0.0.1', port: ports.firestore, websocketPort: ports.firestoreWs };
  }
  const config = path.join(d, 'firebase.json');
  fs.writeFileSync(config, JSON.stringify(cfg, null, 2) + '\n');
  return { dir: d, config };
}

// Processes left behind by one emulator run: cwd inside dir, or the database jar on dbPort.
function strays(dir, dbPort) {
  const out = [];
  let ids = [];
  try { ids = fs.readdirSync('/proc').filter(x => /^\d+$/.test(x)); } catch (e) { return out; }
  const real = (() => { try { return fs.realpathSync(dir); } catch (e) { return dir; } })();
  for (const id of ids) {
    const pid = +id;
    if (pid === process.pid) continue;
    let cwd = '', cmd = '';
    try { cwd = fs.readlinkSync('/proc/' + id + '/cwd'); } catch (e) {}
    try { cmd = fs.readFileSync('/proc/' + id + '/cmdline', 'utf8').split('\0').join(' '); } catch (e) {}
    const inDir = dir && cwd && (cwd === real || cwd.startsWith(real + path.sep));
    const onPort = dbPort && /firebase-database-emulator/.test(cmd) && new RegExp('--port ' + dbPort + '(\\s|$)').test(cmd);
    if (inDir || onPort) out.push(pid);
  }
  return out;
}
function signal(pgid, pids, sig) {
  if (pgid) { try { process.kill(-pgid, sig); } catch (e) { try { process.kill(pgid, sig); } catch (e2) {} } }
  for (const p of pids) { try { process.kill(p, sig); } catch (e) {} }
}
const alive = pid => { try { process.kill(pid, 0); return true; } catch (e) { return false; } };
function groupAlive(pgid) { try { process.kill(-pgid, 0); return true; } catch (e) { return false; } }

async function killEmulator(pgid, dir, dbPort, waitMs) {
  signal(pgid, strays(dir, dbPort), 'SIGTERM');
  const t0 = Date.now();
  while (Date.now() - t0 < (waitMs || 8000)) {
    if (!(pgid && groupAlive(pgid)) && !strays(dir, dbPort).some(alive)) break;
    await new Promise(r => setTimeout(r, 200));
  }
  killEmulatorSync(pgid, dir, dbPort);
}
// Last resort for process.on('exit'), where nothing async runs.
function killEmulatorSync(pgid, dir, dbPort) {
  signal(pgid, strays(dir, dbPort), 'SIGKILL');
}
function removeDir(dir) {
  if (dir) { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {} }
}

module.exports = { envPort, freePorts, pickPorts, portOpen, writeConfig, strays, killEmulator, killEmulatorSync, removeDir };
