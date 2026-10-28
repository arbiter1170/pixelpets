/* Walklings tests on WebKit with iPhone profiles. Opt-in: `npm test` and `npm run test:agent` still use the root playwright.config.js
   (Chromium at 320, 375 and 390). Players never load this file.

     npm run test:iphone                                   every spec, every phone below
     npm run test:iphone -- tests/shop_dock.spec.js        one spec
     npm run test:iphone -- --project=iphone-14-safari     one phone

   Setup once: npx playwright install webkit   (Linux also: npx playwright install-deps webkit)

   Read the results with care. This is Playwright's WebKit, not iOS Safari, and it differs from the Chromium runs in ways
   that fail specs without a bug in the game (tests/README.md, "iPhone emulation"). Compare against a run of the same specs
   on the base commit before treating a failure as new. Same safety as the main config: the suite never signs in to or
   writes to the live Firebase project (cloud.js ignores the live config while navigator.webdriver is set). */
const path = require('path');
const { defineConfig, devices } = require('@playwright/test');

const ROOT = path.join(__dirname, '..');

const port = process.env.PP_PORT || '8080';
const external = process.env.PP_URL;
const phone = (w, h, dpr, base) => ({ ...devices[base], browserName: 'webkit', viewport: { width: w, height: h }, screen: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: true, hasTouch: true });

module.exports = defineConfig({
  testDir: path.join(ROOT, 'tests'),
  outputDir: path.join(ROOT, 'test-results'),
  fullyParallel: false,
  workers: 2,
  retries: 1,
  timeout: 45000,
  expect: { timeout: 10000 },
  reporter: process.env.PP_REPORTER || 'list',
  globalSetup: require.resolve('../tests/emu_setup.js'),
  globalTeardown: require.resolve('../tests/emu_teardown.js'),
  use: { baseURL: external || ('http://127.0.0.1:' + port) },
  webServer: external ? undefined : {
    command: 'node tools/static_server.js --port ' + port,
    cwd: ROOT,
    url: 'http://127.0.0.1:' + port + '/version.json',
    reuseExistingServer: true,
    stdout: 'ignore',
    stderr: 'ignore',
    timeout: 20000,
  },
  projects: [
    // The repo's three widths on WebKit, so a result compares one to one with the Chromium run of the same spec.
    { name: 'wk-320', grepInvert: /@slow/, use: phone(320, 568, 2, 'iPhone SE') },
    { name: 'wk-375', grepInvert: /@w1|@slow/, use: phone(375, 667, 2, 'iPhone SE (3rd gen)') },
    { name: 'wk-390', grepInvert: /@w1|@slow/, use: phone(390, 844, 3, 'iPhone 14') },
    // Real iPhone sizes. iphone-14-safari is the page area with Safari's toolbars up, which is what a player sees in the browser.
    { name: 'iphone-14-safari', grepInvert: /@w1|@slow/, use: phone(390, 664, 3, 'iPhone 14') },
    { name: 'iphone-15', grepInvert: /@w1|@slow/, use: phone(393, 852, 3, 'iPhone 15') },
    { name: 'iphone-16-pro', grepInvert: /@w1|@slow/, use: phone(402, 874, 3, 'iPhone 16 Pro') },
    { name: 'iphone-pro-max', grepInvert: /@w1|@slow/, use: phone(430, 932, 3, 'iPhone 15 Pro Max') },
    { name: 'iphone-16-pro-max', grepInvert: /@w1|@slow/, use: phone(440, 956, 3, 'iPhone 16 Pro Max') },
  ],
});
