/* Walklings smoke tests. Players never load this file.
   Serves the repo on localhost (or uses PP_URL, for example the live GitHub Pages site).
   Chromium only, three phone widths. No GitHub Actions workflow in this build. */
const { defineConfig } = require('@playwright/test');

const port = process.env.PP_PORT || '8080';
const external = process.env.PP_URL;

module.exports = defineConfig({
  testDir: 'tests',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  expect: { timeout: 10000 },
  reporter: 'list',
  use: {
    baseURL: external || ('http://127.0.0.1:' + port),
    browserName: 'chromium',
  },
  webServer: external ? undefined : {
    command: 'python3 -m http.server ' + port + ' --bind 127.0.0.1',
    url: 'http://127.0.0.1:' + port + '/version.json',
    reuseExistingServer: true,
    timeout: 20000,
  },
  projects: [
    { name: '320', use: { viewport: { width: 320, height: 568 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } },
    { name: '375', use: { viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } },
    { name: '390', use: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true } },
  ],
});
