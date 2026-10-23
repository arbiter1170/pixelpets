/* P0 (Oct 19, 2026, Vincent's iPhone): "During battles, I've had safari refresh three times." A trainer fight is never
   saved mid-battle, so any reload restarts it. Two paths could reload the page under a battle:
   1. the "New build ready" bar stayed on screen for up to 500 ms after a battle opened (polled), over the foe card;
   2. a late cloud compare (the first one timed out) could adopt the cloud copy and reload with no battle check.
   Both now wait for a safe point. Every reload also leaves a breadcrumb (pp_reload -> pp_reload_last) shown in Settings.
   See tests/README.md. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const NEWER = '20991231-0000';
async function fakeNewerBuild(page) {
  await page.route(/version\.json/, (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ build: NEWER }) }));
}
async function bootWithBar(page) {
  await fakeNewerBuild(page);
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.checkBuild());
  await expect(page.locator('#buildBar')).toBeVisible();
}
// Win the open battle move by move (same drive as p0_trainer_win), then close the end card.
async function winBattle(page, beforeClose) {
  for (let turn = 0; turn < 20; turn++) {
    await page.waitForFunction(() => { const b = PixelPets.battle; return !b.on || b.panel === 'end' || (b.state === 'CHOOSE' && b.panel === 'acts'); }, null, { timeout: 15000 });
    const st = await page.evaluate(() => {
      const b = PixelPets.battle; if (!b.on || b.panel === 'end') return 'end';
      b.textMs = 1; b.animMs = 0; b.rng = () => 0.99; b.foePlan = { move: 'wobble' };
      PixelPets.setHp('foe', 1); PixelPets.setHp('me', 999);
      document.querySelector('[data-bact="fight"]').click();
      [...document.querySelectorAll('#btMoves button[data-move]')].find((el) => !el.disabled).click();
      return 'go';
    });
    if (st === 'end') break;
  }
  await page.waitForFunction(() => PixelPets.battle.panel === 'end', null, { timeout: 15000 });
  if (beforeClose) await beforeClose();
  await page.click('#btOk');
  await page.waitForFunction(() => !PixelPets.battle.on, null, { timeout: 15000 });
}

test('the new-build bar never shows over a trainer battle and its tap cannot reload one @w1', async ({ page }) => {
  await bootWithBar(page);
  let loads = 0; page.on('load', () => { loads++; });
  expect(await page.evaluate(() => { PixelPets.showTab('walk'); return PixelPets.forceTrainer('route1_pia'); })).toBe(true);
  const t0 = Date.now();
  for (const ms of [0, 100, 300, 1500]) {
    const wait = ms - (Date.now() - t0); if (wait > 0) await page.waitForTimeout(wait);
    const s = await page.evaluate(() => ({ bar: !document.querySelector('#buildBar').hidden, on: PixelPets.battle.on }));
    expect(s.on, 'battle open at ' + ms + ' ms').toBe(true);
    expect(s.bar, 'build bar hidden at ' + ms + ' ms').toBe(false);
  }
  // A tap that lands on the bar anyway (a stale frame, a script click) must not reload under the battle.
  await page.evaluate(() => document.querySelector('#buildGo').click());
  await page.waitForTimeout(600);
  expect(loads).toBe(0);
  expect(await page.evaluate(() => PixelPets.battle.on)).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem('pp_reload'))).toBeNull();
  await winBattle(page);
  // After the battle the bar comes back (scenes after a trainer win can hold it a moment longer).
  await expect(page.locator('#buildBar')).toBeVisible({ timeout: 8000 });
  expect(loads).toBe(0);
});

test('reloads leave a breadcrumb that Settings shows', async ({ page, context }, testInfo) => {
  await bootWithBar(page);
  // 1. The bar's own reload (safe point, no battle) names itself.
  await Promise.all([page.waitForEvent('load'), page.click('#buildGo')]);
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.state);
  let last = await page.evaluate(() => JSON.parse(localStorage.getItem('pp_reload_last')));
  expect(last[last.length - 1]).toMatchObject({ reason: 'build', battleOn: false, build: await page.evaluate(() => window.BUILD) });
  expect(await page.evaluate(() => localStorage.getItem('pp_reload'))).toBeNull();
  expect(await page.evaluate(() => !!localStorage.getItem('pp_alive'))).toBe(true);
  // 2. A reload nobody asked for (a Safari refresh) during a battle is 'unknown, in battle'.
  await page.evaluate(() => { PixelPets.showTab('walk'); return PixelPets.forceBattle('tide/0', 3); });
  await page.waitForFunction(() => PixelPets.battle.on);
  await page.reload({ waitUntil: 'commit' });
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.state);
  last = await page.evaluate(() => JSON.parse(localStorage.getItem('pp_reload_last')));
  expect(last[last.length - 1]).toMatchObject({ reason: 'unknown', battleOn: true });
  // Settings shows the newest entry, small, on one line that fits (320 included).
  await page.locator('#settingsBtn').click();
  const row = page.locator('#setReload');
  await expect(row).toBeVisible();
  await expect(row).toHaveText(/^Last reload: unknown, \d{1,2}:\d{2}\s?[AP]M, in battle$/);
  expect(await row.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await page.locator('#setClose').click();
  // 3. A page that dies on screen fires no pagehide: pp_alive is left behind and pp_reload is empty. The next boot reads
  //    that as a crash. (Playwright cannot crash a tab and keep its context, so the crash state is written by hand.)
  await page.evaluate(() => { PixelPets.showTab('walk'); return PixelPets.forceBattle('tide/0', 3); });
  await page.waitForFunction(() => PixelPets.battle.on && JSON.parse(localStorage.getItem('pp_alive') || 'null').battleOn === true);
  await page.evaluate(() => localStorage.removeItem('pp_reload'));
  const fresh = await context.newPage();
  fresh.ppErrors = [];
  fresh.on('pageerror', (err) => fresh.ppErrors.push(err.message));
  await fakeNewerBuild(fresh);
  await gotoGame(fresh, '?debug=1');
  last = await fresh.evaluate(() => JSON.parse(localStorage.getItem('pp_reload_last')));
  expect(last[last.length - 1]).toMatchObject({ reason: 'crash', battleOn: true });
  // 4. Only the last five are kept.
  await fresh.evaluate(() => { localStorage.setItem('pp_reload_last', JSON.stringify(Array.from({ length: 5 }, (_, i) => ({ reason: 'unknown', at: i, battleOn: false })))); });
  await fresh.reload({ waitUntil: 'commit' });
  await fresh.waitForFunction(() => window.PixelPets && window.PixelPets.state);
  last = await fresh.evaluate(() => JSON.parse(localStorage.getItem('pp_reload_last')));
  expect(last.length).toBe(5);
  expect(last[0].at).toBe(1);
  // The save itself is untouched by all this: still v2, no breadcrumb keys inside it.
  const sv = await fresh.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  expect(sv.v).toBe(2);
  expect(Object.keys(sv).some((k) => /reload|alive/i.test(k))).toBe(false);
  expect(fresh.ppErrors).toEqual([]);
});

// Cloud adopt guard, without the emulator: the Firebase modules are stubbed (as in cloud_off.spec.js) and no live host is
// reached. The first compare fails offline. A cloud copy appears, then a battle opens: the 10 s cloud tick must not compare
// (and so not adopt and reload) under the battle. Once the battle is over the next tick adopts and the breadcrumb says 'cloud'.
test('a late cloud compare never adopts (reloads) under a battle', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== '390', 'cloud timing check runs at one width (two 10 s cloud ticks)');
  test.setTimeout(90000);
  const cloudSave = starterSave(); cloudSave.party[0].xp = 99; cloudSave.playerName = 'Cloudy';
  const app = 'export function initializeApp(){ return { name: "walklings" }; }';
  const auth = [
    'export function getAuth(){ return {}; }',
    'export function onAuthStateChanged(_a, cb){ queueMicrotask(function(){ cb({ uid: "adopt-uid" }); }); return function(){}; }',
    'export function signInAnonymously(){ return Promise.resolve({ user: { uid: "adopt-uid" } }); }',
  ].join('\n');
  const fsMod = [
    'export function getFirestore(){ return {}; }',
    'export function doc(){ return { path: "saves/adopt-uid" }; }',
    'export function getDocFromServer(){ globalThis.__compares = (globalThis.__compares || 0) + 1;',
    '  if (!globalThis.__cloudDoc) { const e = new Error("offline"); e.code = "unavailable"; return Promise.reject(e); }',
    '  const d = globalThis.__cloudDoc; return Promise.resolve({ exists: function(){ return true; }, data: function(){ return d; } }); }',
    'export function setDoc(){ return Promise.reject(new Error("setDoc must not run in this test")); }',
    'export function deleteDoc(){ return Promise.reject(new Error("deleteDoc must not run in this test")); }',
  ].join('\n');
  const fulfill = (body) => (route) => route.fulfill({ status: 200, contentType: 'text/javascript', body });
  await page.route('**/firebase-app.js*', fulfill(app));
  await page.route('**/firebase-auth.js*', fulfill(auth));
  await page.route('**/firebase-firestore.js*', fulfill(fsMod));
  await page.route(/googleapis\.com|firebaseio\.com|firebaseapp\.com|firebasestorage\.app/, (route) => route.abort('failed'));
  await installSave(page.context(), starterSave(), { quietDay: true });
  await page.addInitScript(() => {
    const real = window.setInterval.bind(window);
    window.__ppCloudTicks = 0;
    window.setInterval = function(fn, ms) {
      if (ms === 10000 && String(fn).indexOf('busy') >= 0) {
        return real(function() {
          window.__ppCloudTicks++;
          return fn.apply(this, arguments);
        }, ms);
      }
      return real.apply(this, arguments);
    };
  });
  await gotoGame(page, '?cloud=block&debug=1');
  await page.waitForFunction(() => typeof PPCloud !== 'undefined' && PPCloud.info().status === 'offline' && window.__compares >= 1);
  // This device last synced rev 3 and has not changed since; the cloud now holds rev 5 from elsewhere -> quiet adopt.
  await page.evaluate((raw) => {
    const d = JSON.parse(localStorage.getItem('pixelpets.cloud'));
    d.syncedRev = 3; d.syncedHash = PPCloud.hashOf(PixelPets.state);
    localStorage.setItem('pixelpets.cloud', JSON.stringify(d));
    PixelPets.showTab('walk'); PixelPets.forceBattle('tide/0', 3);
    window.__cloudDoc = { data: raw, v: 2, rev: 5, updatedAt: Date.now() };
    window.__comparesAtBattle = window.__compares;
  }, JSON.stringify(cloudSave));
  let loads = 0; page.on('load', () => { loads++; });
  await expect.poll(async () => page.evaluate(() => window.__ppCloudTicks || 0), { timeout: 15000 }).toBeGreaterThanOrEqual(1);
  const mid = await page.evaluate(() => ({ on: PixelPets.battle.on, compares: window.__compares - window.__comparesAtBattle }));
  expect(mid.on).toBe(true);
  expect(mid.compares, 'no compare under the battle').toBe(0);
  expect(loads).toBe(0);
  // The win changes the game (battle XP), which would turn the adopt into the "which game to keep" prompt. Re-take the
  // fingerprint while the battle is still on (cloud ticks skip), so the first tick after it is a quiet adopt.
  const reloaded = page.waitForEvent('load', { timeout: 25000 });
  await winBattle(page, () => page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('pixelpets.cloud')); d.syncedHash = PPCloud.hashOf(PixelPets.state);
    localStorage.setItem('pixelpets.cloud', JSON.stringify(d));
  }));
  await reloaded;
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.state);
  const last = await page.evaluate(() => JSON.parse(localStorage.getItem('pp_reload_last')));
  expect(last[last.length - 1]).toMatchObject({ reason: 'cloud', battleOn: false });
  // stubbed hosts log a failed fetch or two; only page errors from the game count here
  page.ppErrors = page.ppErrors.filter((l) => !/firebasejs|gstatic|googleapis|firebaseio|firebaseapp|Failed to load|ERR_|net::/i.test(l));
});
