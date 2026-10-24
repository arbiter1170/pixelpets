/* Playwright global setup. Any PP_EMU_* port left unset gets a free one (tools/emu_ports.js),
   so a plain `npx playwright test` never shares 9000 with another run. Env-set ports win.
   PP_EMU_RUN tags this run's emulator pid file for tests/emu_teardown.js. Workers and the
   teardown inherit these env values, so every file and page uses the same ports. */
const { pickPorts } = require('../tools/emu_ports');

const NAMES = {
  database: 'PP_EMU_DB_PORT',
  auth: 'PP_EMU_AUTH_PORT',
  firestore: 'PP_EMU_FS_PORT',
  firestoreWs: 'PP_EMU_FS_WS_PORT',
  hub: 'PP_EMU_HUB_PORT',
  logging: 'PP_EMU_LOGGING_PORT',
};

module.exports = async function emuSetup() {
  const ports = await pickPorts(NAMES);
  for (const k of Object.keys(NAMES)) process.env[NAMES[k]] = String(ports[k]);
  if (!process.env.PP_EMU_RUN) process.env.PP_EMU_RUN = process.pid + '-' + Date.now();
};
