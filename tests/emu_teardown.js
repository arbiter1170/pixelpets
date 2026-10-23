/* Stop the shared emulator started by tests/emu_shared.js. A pid file is written
   only when this run started the process, so an emulator that was already up stays up. */
const fs = require('fs');
const path = require('path');

const PID = path.join(__dirname, '..', 'test-logs', 'rtdb-emu.pid');

module.exports = async function emuTeardown() {
  let pid = 0;
  try { pid = parseInt(fs.readFileSync(PID, 'utf8'), 10); } catch (e) { return; }
  if (!pid) return;
  try { process.kill(-pid, 'SIGTERM'); }
  catch (e) { try { process.kill(pid, 'SIGTERM'); } catch (e2) {} }
  try { fs.unlinkSync(PID); } catch (e) {}
};
