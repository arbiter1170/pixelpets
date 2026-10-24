/* Stop the shared emulator started by tests/emu_shared.js. A pid file is written
   only when this run started the process, so an emulator that was already up stays up.
   Kills the detached process group, then any java child left in the emulator's temp
   folder or on its database port, and removes that folder. */
const fs = require('fs');
const { killEmulator, removeDir } = require('../tools/emu_ports');
const { EMU_PORTS, EMU_DIR, PID } = require('./emu_shared');

module.exports = async function emuTeardown() {
  let pid = 0;
  try { pid = parseInt(fs.readFileSync(PID, 'utf8'), 10); } catch (e) { return; }
  try { fs.unlinkSync(PID); } catch (e) {}
  if (!pid) return;
  await killEmulator(pid, EMU_DIR, EMU_PORTS.database, 8000);
  removeDir(EMU_DIR);
};
