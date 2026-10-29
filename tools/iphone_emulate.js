#!/usr/bin/env node
/* Open the game in a WebKit window that looks like an iPhone, on your own desktop.

     npm run iphone                              iPhone 14 as Safari shows it (toolbars on), debug on, input log on
     npm run iphone -- --device "iPhone 16 Pro"  another phone (see --list)
     npm run iphone -- --full                    the whole screen (a home-screen web app), not the Safari-with-toolbars size
     npm run iphone -- --url https://arbiter1170.github.io/pixelpets/   the live site instead of this folder
     npm run iphone -- --lan                     also serve to a real iPhone on the same Wi-Fi and print the address
     npm run iphone -- --engine chromium         same phone, Chromium, to compare against WebKit
     npm run iphone -- --headless --shot a.png   no window: load, print the build, take a picture, exit (for checks and CI)
     npm run iphone -- --headless --selftap      also send one tap to the middle of the screen and print the events the page got
     npm run iphone -- --trace t.zip             record a Playwright trace (npx playwright show-trace t.zip)

   What this is: Playwright's WebKit with an iPhone profile (viewport, pixel ratio, touch, user agent). What it is not:
   Apple's iOS Safari. iOS-only behaviour (the Safari toolbars growing and shrinking, safe-area insets, touch ids, audio
   unlock, rubber-banding) needs the iOS Simulator on a Mac or a real iPhone. tests/README.md ("iPhone emulation") says how.
   One known difference: WebKit's synthetic tap sends pointer and touch events but no click, and every tap reuses the same
   touch id. --log-input (on by default here) prints each event so you can see exactly what the page was given. */
'use strict';
const path = require('path');
const { webkit, chromium, devices } = require('@playwright/test');
const { start } = require('./static_server');

const argv = process.argv.slice(2);
const has = n => argv.includes('--' + n);
const val = (n, d) => { const i = argv.indexOf('--' + n); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };

const PHONES = Object.keys(devices).filter(n => /^iPhone /.test(n) && !/landscape/.test(n));
const screenOf = d => d.screen || d.viewport;   // the oldest profiles have no separate screen size
if (has('list')) {
  for (const n of PHONES) { const d = devices[n]; console.log(n.padEnd(22), (d.viewport.width + 'x' + d.viewport.height + ' in Safari').padEnd(24), (screenOf(d).width + 'x' + screenOf(d).height + ' full').padEnd(16), '@' + d.deviceScaleFactor); }
  process.exit(0);
}
if (has('help') || has('h')) { console.log(require('fs').readFileSync(__filename, 'utf8').split('*/')[0].replace(/^#!.*\n\/\*\s?/, '')); process.exit(0); }

const deviceName = val('device', 'iPhone 14');
const base = devices[deviceName];
if (!PHONES.includes(deviceName)) { console.error('Unknown iPhone "' + deviceName + '". Try --list.'); process.exit(1); }

// The descriptor's viewport is what Safari leaves for the page with its toolbars up; its screen is the whole display.
let viewport = has('full') ? { ...screenOf(base) } : { ...base.viewport };
const size = val('size', '');
if (/^\d+x\d+$/.test(size)) { const [w, h] = size.split('x').map(Number); viewport = { width: w, height: h }; }

const engine = val('engine', 'webkit');
const headless = has('headless');
const quiet = has('quiet');
const wantLog = has('input-log') || has('selftap') || (!has('no-input-log') && !headless);

async function main() {
  let url = val('url', '');
  let server = null;
  if (!url) {
    const asked = val('port', '');
    try {
      // No --port: try 8080 and take any free port if something else already has it. An explicit --port is kept or refused.
      server = await start({ port: +(asked || 8080), host: has('lan') ? '0.0.0.0' : '127.0.0.1', fallback: !asked });
    } catch (e) {
      if (e && (e.code === 'EADDRINUSE' || e.code === 'EACCES')) { console.error('Port ' + asked + (e.code === 'EACCES' ? ' is not allowed on this computer (Windows reserves some ranges).' : ' is already in use.') + ' Leave out --port to take a free one, or pick another number.'); process.exit(1); }
      throw e;
    }
    if (server.moved) console.log('Port ' + server.moved + ' is in use or not allowed here, using ' + server.port + ' instead.');
    url = 'http://127.0.0.1:' + server.port + '/' + (has('no-debug') ? '' : '?debug=1');
    console.log('Serving this folder:');
    for (const u of server.urls) console.log('  ' + u + (has('lan') && !u.includes('127.0.0.1') ? '   <- type this into Safari on your iPhone (same Wi-Fi)' : ''));
  }

  const browser = await (engine === 'chromium' ? chromium : webkit).launch({ headless });
  const context = await browser.newContext({
    ...base, viewport, screen: { width: viewport.width, height: viewport.height },
    serviceWorkers: has('sw') ? 'allow' : 'block',          // a service worker would hand back an older build on a reload
    reducedMotion: has('reduced-motion') ? 'reduce' : 'no-preference',
  });
  const traceOut = val('trace', '');
  if (traceOut) await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  page.on('pageerror', e => console.log('[page error]', e.message));
  page.on('console', m => {
    const t = m.text();
    if (t.startsWith('[input] ')) { if (wantLog) console.log(t.slice(8)); return; }
    if (!quiet && (m.type() === 'error' || m.type() === 'warning')) console.log('[' + m.type() + ']', t);
  });
  if (wantLog) {
    await page.addInitScript(() => {
      const t0 = performance.now();
      const short = e => { const el = e.target; return el && el.tagName ? el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/)[0] : '') : '?'; };
      for (const type of ['pointerdown', 'pointerup', 'pointercancel', 'touchstart', 'touchend', 'touchcancel', 'mousedown', 'mouseup', 'click']) {
        document.addEventListener(type, e => {
          const id = e.pointerId != null ? ' id=' + e.pointerId : (e.changedTouches && e.changedTouches[0] ? ' touch=' + e.changedTouches[0].identifier : '');
          console.log('[input] +' + String(Math.round(performance.now() - t0)).padStart(6) + ' ms  ' + type.padEnd(13) + (e.pointerType ? e.pointerType.padEnd(6) : '      ') + id.padEnd(10) + ' ts=' + Math.round(e.timeStamp) + '  ' + short(e) + (e.defaultPrevented ? '  (default prevented)' : ''));
        }, true);
      }
    });
  }

  await page.goto(url, { waitUntil: 'commit' });
  await page.waitForFunction(() => window.PixelPets && window.BUILD, null, { timeout: 30000 });
  const info = await page.evaluate(() => ({ build: window.BUILD, ua: navigator.userAgent, w: innerWidth, h: innerHeight, dpr: devicePixelRatio }));
  console.log('\n' + (engine === 'chromium' ? 'Chromium' : 'WebKit') + ' as ' + deviceName + ': ' + info.w + 'x' + info.h + ' @' + info.dpr + 'x, build ' + info.build);
  console.log(info.ua);
  console.log('(Playwright ' + (engine === 'chromium' ? 'Chromium' : 'WebKit') + ' with an iPhone profile, not Apple iOS Safari. See tests/README.md "iPhone emulation".)');

  if (has('selftap')) {
    await page.touchscreen.tap(Math.round(viewport.width / 2), Math.round(viewport.height / 2));
    await page.waitForTimeout(600);
  }
  const shot = val('shot', '');
  if (shot) { await page.screenshot({ path: path.resolve(shot) }); console.log('Picture: ' + path.resolve(shot)); }

  const finish = async () => {
    if (traceOut) { await context.tracing.stop({ path: path.resolve(traceOut) }); console.log('Trace: ' + path.resolve(traceOut) + '   open it with: npx playwright show-trace ' + traceOut); }
    await browser.close().catch(() => {});
    if (server) server.server.close();
  };
  if (headless) { await finish(); return; }

  console.log('\nThe window is the phone. Close it (or press Ctrl+C here) to stop.' + (wantLog ? ' Input events print below.' : ''));
  process.on('SIGINT', async () => { await finish(); process.exit(0); });
  browser.on('disconnected', async () => { if (traceOut) console.log('(window closed before the trace could be saved)'); if (server) server.server.close(); process.exit(0); });
  await new Promise(() => {});
}

main().catch(e => {
  console.error('\n' + (e && e.message ? e.message : e));
  if (/Executable doesn't exist|install/.test(String(e))) console.error('\nInstall the browser first:  npx playwright install webkit' + (process.platform === 'linux' ? '   (Linux also needs: npx playwright install-deps webkit)' : ''));
  process.exit(1);
});
