/* Walklings smoke tests. Players never load this file.
   Serves the repo on localhost (or uses PP_URL, for example the live GitHub Pages site).
   Chromium only, three phone widths. No GitHub Actions workflow in this build. */
const { defineConfig } = require('@playwright/test');

const port = process.env.PP_PORT || '8080';
const external = process.env.PP_URL;
// The suite must never reach the live Firebase project. cloud.js also ignores the real config when
// navigator.webdriver is set. These hosts fail closed if a test opts in with ?cloud=block and forgets to stub.
const CLOUD_BLOCK = [
  // www.gstatic.com stays reachable: ?cloud=emu loads the pinned Firebase SDK from there.
  // Live project hosts below still fail closed.
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'firestore.googleapis.com',
  'firebase.googleapis.com',
  'firebaseinstallations.googleapis.com',
  'content-firebaseappcheck.googleapis.com',
  'www.googleapis.com',
  'walklings-4cc89.firebaseapp.com',
  'walklings-4cc89.firebasestorage.app',
  'walklings-4cc89-default-rtdb.firebaseio.com',
].map((host) => 'MAP ' + host + ' ~NOTFOUND').join(', ');

module.exports = defineConfig({
  testDir: 'tests',
  fullyParallel: false,
  workers: 2,
  retries: 1,
  timeout: 30000,
  expect: { timeout: 10000 },
  // Humans get 'list'. Agents run `npm run test:agent` (tools/pp_test.js), which passes
  // --reporter=line,json and writes everything to test-logs/.
  reporter: process.env.PP_REPORTER || 'list',
  globalSetup: require.resolve('./tests/emu_setup.js'),
  globalTeardown: require.resolve('./tests/emu_teardown.js'),
  use: {
    baseURL: external || ('http://127.0.0.1:' + port),
    browserName: 'chromium',
    launchOptions: { args: ['--host-resolver-rules=' + CLOUD_BLOCK] },
  },
  webServer: external ? undefined : {
    command: 'python3 -m http.server ' + port + ' --bind 127.0.0.1',
    url: 'http://127.0.0.1:' + port + '/version.json',
    reuseExistingServer: true,
    // python http.server logs every request to stderr (~3.6 KB per test, ~97% of output). Drop it.
    stdout: 'ignore',
    stderr: 'ignore',
    timeout: 20000,
  },
  // @w1 tests run on 320 only. @slow stays out of npm test and test:agent.
  // `npm run test:slow` sets PP_SLOW=1 and selects @slow on the 390 project.
  // A new test with no tag still runs at all three widths.
  projects: [
    { name: '320', ...(process.env.PP_SLOW === '1' ? {} : { grepInvert: /@slow/ }), use: { viewport: { width: 320, height: 568 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } },
    { name: '375', grepInvert: process.env.PP_SLOW === '1' ? /@w1/ : /@w1|@slow/, use: { viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } },
    { name: '390', grepInvert: process.env.PP_SLOW === '1' ? /@w1/ : /@w1|@slow/, use: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true } },
  ],
});
