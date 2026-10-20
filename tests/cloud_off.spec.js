/* Online saves must not touch the live project from this suite.
   Default pages (and ?cloud=off) keep PPCloud off even though cloud_config.js holds the real web config.
   ?cloud=block is the only opt-in, and those tests stub or abort the SDK before any Google host can answer.
   Playwright also maps the Firebase hosts to ~NOTFOUND. Players never load this file. */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

const LIVE_HOST = /googleapis\.com|firebaseio\.com|firebaseapp\.com|firebasestorage\.app|gstatic\.com\/firebasejs/;

function watchLive(page) {
  const hits = [];
  page.on('request', (req) => {
    const url = req.url();
    if (LIVE_HOST.test(url)) hits.push(url);
  });
  return hits;
}

function liveWrites(hits) {
  return hits.filter((url) => /googleapis\.com|firebaseio\.com|firebaseapp\.com|firebasestorage\.app/.test(url));
}

test('realtime database root stays locked', async () => {
  const rules = JSON.parse(fs.readFileSync('database.rules.json', 'utf8'));
  expect(rules.rules['.read']).toBe(false);
  expect(rules.rules['.write']).toBe(false);
  expect(rules.rules.rooms).toBeTruthy();
  expect(rules.rules.hidden.$target['.read']).toBe(false);
  const fb = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
  expect(fb.database.rules).toBe('database.rules.json');
  expect(fb.firestore.rules).toBe('firestore.rules');
  const cfg = fs.readFileSync('cloud_config.js', 'utf8');
  expect(cfg).toContain('projectId: "walklings-4cc89"');
  expect(cfg).not.toMatch(/PP_CLOUD_CONFIG\s*=\s*null/);
});

test.describe('null config', () => {
  trackErrors(test, expect);

  async function bootOff(page, search) {
    const hits = watchLive(page);
    await installSave(page.context(), starterSave(), { quietDay: true });
    await gotoGame(page, search);
    await page.waitForFunction(() => window.PixelPets && window.PixelPets.state && window.PixelPets.state.v === 2);
    const info = await page.evaluate(() => ({
      webdriver: navigator.webdriver === true,
      projectId: window.PP_CLOUD_CONFIG && window.PP_CLOUD_CONFIG.projectId,
      enabled: PPCloud.enabled,
      blocked: PPCloud.info().blocked,
      row: !!document.querySelector('#setCloud'),
      v: window.PixelPets.state.v,
      uid: window.PixelPets.state.uid,
    }));
    expect(info.webdriver).toBe(true);
    expect(info.projectId).toBe('walklings-4cc89');
    expect(info.enabled).toBe(false);
    expect(info.blocked).toBe(true);
    expect(info.row).toBe(false);
    expect(info.v).toBe(2);
    expect(info.uid).toBe('smoketest0001');
    expect(hits).toEqual([]);
  }

  test('an automated boot ignores the live config', async ({ page }) => {
    await bootOff(page, '');
  });

  test('?cloud=off forces the null config', async ({ page }) => {
    await bootOff(page, '?cloud=off');
  });
});

test('a blocked SDK leaves the game on this device', async ({ page }) => {
  const hits = watchLive(page);
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (err) => errors.push(err.message));
  await page.route(/firebasejs\/|googleapis\.com|firebaseio\.com|firebaseapp\.com|firebasestorage\.app/, (route) => route.abort('failed'));
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page, '?cloud=block');
  await page.waitForFunction(() => typeof PPCloud !== 'undefined' && PPCloud.enabled && PPCloud.info().status === 'unavailable', null, { timeout: 25000 });
  await page.locator('#settingsBtn').click();
  const row = page.locator('#setCloud');
  await expect(row).toBeVisible();
  await expect(row.locator('.set-sub')).toHaveText('Offline, will back up later');
  const box = await row.boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(44);
  const state = await page.evaluate(() => ({ v: window.PixelPets.state.v, uid: window.PixelPets.state.uid, err: PPCloud.info().lastErr }));
  expect(state.v).toBe(2);
  expect(state.uid).toBe('smoketest0001');
  expect(state.err).toBeTruthy();
  expect(liveWrites(hits)).toEqual([]);
  const stray = errors.filter((line) => !/firebasejs|gstatic|googleapis|firebaseio|firebaseapp|Failed to load|ERR_|net::|blocked/i.test(line));
  expect(stray, errors.join('\n')).toEqual([]);
});

test('an offline cloud read keeps the local save', async ({ page }) => {
  const hits = watchLive(page);
  trackPage(page);
  const app = [
    'export function initializeApp(){ return { name: "walklings" }; }',
  ].join('\n');
  const auth = [
    'export function getAuth(){ return {}; }',
    'export function onAuthStateChanged(_auth, cb){ queueMicrotask(function(){ cb(null); }); return function(){}; }',
    'export function signInAnonymously(){ return Promise.resolve({ user: { uid: "offline-uid" } }); }',
  ].join('\n');
  const fsMod = [
    'export function getFirestore(){ return {}; }',
    'export function doc(){ return { path: "saves/offline-uid" }; }',
    'export function getDocFromServer(){ const e = new Error("offline"); e.code = "unavailable"; return Promise.reject(e); }',
    'export function setDoc(){ return Promise.reject(new Error("setDoc must not run offline")); }',
    'export function deleteDoc(){ return Promise.reject(new Error("deleteDoc must not run offline")); }',
  ].join('\n');
  const fulfill = (body) => (route) => route.fulfill({ status: 200, contentType: 'text/javascript', body });
  await page.route('**/firebase-app.js*', fulfill(app));
  await page.route('**/firebase-auth.js*', fulfill(auth));
  await page.route('**/firebase-firestore.js*', fulfill(fsMod));
  await page.route(/googleapis\.com|firebaseio\.com|firebaseapp\.com|firebasestorage\.app/, (route) => {
    throw new Error('live host contacted: ' + route.request().url());
  });
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page, '?cloud=block');
  await page.waitForFunction(() => typeof PPCloud !== 'undefined' && PPCloud.info().status === 'offline');
  await page.locator('#settingsBtn').click();
  const row = page.locator('#setCloud');
  await expect(row.locator('.set-sub')).toHaveText('Offline, will back up later');
  const box = await row.boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(44);
  const state = await page.evaluate(() => {
    const s = window.PixelPets.state;
    return { v: s.v, uid: s.uid, fbUid: PPCloud.info().fbUid, enabled: PPCloud.enabled };
  });
  expect(state.v).toBe(2);
  expect(state.uid).toBe('smoketest0001');
  expect(state.enabled).toBe(true);
  expect(state.fbUid).toBe('offline-uid');
  expect(liveWrites(hits)).toEqual([]);
  expect(page.ppErrors, (page.ppErrors || []).join('\n')).toEqual([]);
});

function trackPage(page) {
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (err) => errors.push(err.message));
  page.ppErrors = errors;
}
