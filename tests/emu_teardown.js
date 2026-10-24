/* Stop the shared emulator started by tests/emu_shared.js. A pid file is written
   only when this run started the process, and its name carries this run's PP_EMU_RUN,
   so an emulator that was already up, or one another run started, stays up.
   Kills the detached process group, then any java child left in the emulator's temp
   folder or on its database port, and removes that folder. */
const fs = require('fs');
const { killEmulator, removeDir } = require('../tools/emu_ports');
const { emuState } = require('./emu_shared');

module.exports = async function emuTeardown() {
  const { ports: EMU_PORTS, dir: EMU_DIR, pid: PID } = emuState();
  let pid = 0;
  try { pid = parseInt(fs.readFileSync(PID, 'utf8'), 10); } catch (e) { return; }
  try { fs.unlinkSync(PID); } catch (e) {}
  if (!pid) return;
  await killEmulator(pid, EMU_DIR, EMU_PORTS.database, 8000);
  removeDir(EMU_DIR);
};
