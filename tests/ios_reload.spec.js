/* iPhone Safari was reloading the open game every few minutes.
   A new service worker called skipWaiting and clients.claim, and iOS reloads a page when its
   controller changes (a Pages deploy, or a worker Safari installs again). The one-shot boot
   reload trusted sessionStorage, which iOS drops across location.replace. Music also left every
   finished WebAudio node connected, and Safari does not collect those, so the tab grew until
   iOS killed it. version.json must not reload by itself. Save v stays 2. */
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

const MAPS = ['hearthmoor', 'route1', 'fernbrook', 'route2', 'cobblecrest'];

test('the worker does not take over an open page and does not return a manual redirect', async ({ request }) => {
  const sw = await (await request.get('/sw.js')).text();
  expect(sw).not.toMatch(/\.skipWaiting\s*\(/);
  expect(sw).not.toMatch(/redirect:\s*['"]manual['"]/);
  expect(sw).toMatch(/version\.json/);
  expect(sw).toMatch(/stripRedirect/);
});

test('a boot failure reloads once even when sessionStorage is wiped', async ({ page }) => {
  await page.addInitScript(() => { try { sessionStorage.removeItem('pixelpets.bootRetry'); } catch (e) {} });
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8')
    .replace('id="envPick"', 'id="envPickGone"');
  expect(html).not.toMatch(/id="envPick"/);
  let docs = 0;
  await page.route(/\/(index\.html)?(\?.*)?$/, (route) => {
    if (route.request().resourceType() !== 'document') return route.continue();
    docs++;
    if (docs > 2) return route.fulfill({ status: 200, contentType: 'text/html', body: '<!DOCTYPE html><title>stop</title>' });
    return route.fulfill({ status: 200, contentType: 'text/html', body: html });
  });
  await page.goto('/', { waitUntil: 'commit' });
  await page.waitForURL(/[?&]b=boot\./, { timeout: 15000 });
  await page.waitForTimeout(1200);
  expect(docs).toBe(2);
  expect(new URL(page.url()).searchParams.get('b') || '').toMatch(/^boot\./);
});

test.describe('open game', () => {
  trackErrors(test, expect);

  test('a newer version.json and a controller change do not reload the open game', async ({ page }) => {
    const save = starterSave();
    await installSave(page.context(), save, { quietDay: true });
    let loads = 0;
    page.on('load', () => { loads++; });
    await gotoGame(page, '?debug=1');
    loads = 0;
    const here = page.url();
    await page.route('**/version.json*', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ build: '20990101-0000' }),
    }));
    const seen = await page.evaluate(() => PixelPets.checkBuild());
    expect(seen).toBe('20990101-0000');
    await expect(page.locator('#buildBar')).toBeVisible();
    await page.evaluate(() => {
      if (navigator.serviceWorker) navigator.serviceWorker.dispatchEvent(new Event('controllerchange'));
    });
    await page.waitForTimeout(600);
    expect(loads).toBe(0);
    expect(page.url()).toBe(here);
    expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
    await page.click('#buildX');
    expect(await page.locator('#buildBar').isHidden()).toBe(true);
    expect(loads).toBe(0);
  });

  test('music nodes stay flat, and map changes do not keep making canvases', async ({ page }) => {
    const save = starterSave();
    save.settings.music = true;
    save.settings.musicVol = 0.2;
    await installSave(page.context(), save, { quietDay: true });
    await page.addInitScript(() => {
      localStorage.setItem('pixelpets.mute', '0');
      let live = 0, made = 0;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        const track = (node) => {
          live++;
          const orig = node.disconnect;
          node.disconnect = function () {
            if (!node.__gone) { node.__gone = true; live--; }
            return orig.apply(this, arguments);
          };
          return node;
        };
        ['createOscillator', 'createGain', 'createBiquadFilter', 'createBufferSource'].forEach((name) => {
          const orig = AC.prototype[name];
          AC.prototype[name] = function () { return track(orig.apply(this, arguments)); };
        });
      }
      const origCreate = Document.prototype.createElement;
      Document.prototype.createElement = function (tag) {
        if (String(tag).toLowerCase() === 'canvas') made++;
        return origCreate.apply(this, arguments);
      };
      window.__audioLive = () => live;
      window.__canvasMakes = () => made;
    });
    await gotoGame(page, '?debug=1');
    await page.click('#app');
    await page.evaluate(() => {
      PPSound.setMuted(false);
      PPSound.setMusic(true, true);
      PPSound.music('town');
    });
    await page.waitForFunction(() => window.__audioLive() > 8, null, { timeout: 8000 });
    const a = await page.evaluate(() => window.__audioLive());
    await page.waitForTimeout(3000);
    const b = await page.evaluate(() => window.__audioLive());
    expect(b).toBeLessThan(a + 25);

    const before = await page.evaluate(() => window.__canvasMakes());
    const pass = async () => page.evaluate(async (maps) => {
      for (const id of maps) {
        PixelPets.goto(id, 4, 4);
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      }
      return window.__canvasMakes();
    }, MAPS);
    const mid = await pass();
    const after = await pass();
    const again = await pass();
    // Building paint is cached per map. Later passes must not keep allocating canvases.
    expect(after - mid).toBeLessThan(8);
    expect(again - after).toBeLessThan(8);
    expect(again - before).toBeLessThan(24);
    expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
  });
});
