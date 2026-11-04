/* A stubbed Firebase SDK for ?cloud=block pages (as battle_no_reload.spec.js and cloud_off.spec.js do): the real cloud.js
   runs, but no live host is reached and nobody signs in. The cloud has no copy yet, so the first compare uploads at once.
   window.__ppCloudHooks is the hooks object game.js passed to PPCloud.start.
   Every setDoc is recorded in window.__ppUploads as the parsed save it would have written ({ map, act, n }). */
async function stubCloudSdk(page) {
  const app = 'export function initializeApp(){ return { name: "walklings" }; }';
  const auth = [
    'export function getAuth(){ return {}; }',
    'export function onAuthStateChanged(_a, cb){ queueMicrotask(function(){ cb({ uid: "preview-uid" }); }); return function(){}; }',
    'export function signInAnonymously(){ return Promise.resolve({ user: { uid: "preview-uid" } }); }',
  ].join('\n');
  const fsMod = [
    'export function getFirestore(){ return {}; }',
    'export function doc(){ return { path: "saves/preview-uid" }; }',
    'export function getDocFromServer(){ return Promise.resolve({ exists: function(){ return false; }, data: function(){ return null; } }); }',
    'export function setDoc(_r, d){ const s = JSON.parse(d.data); (globalThis.__ppUploads = globalThis.__ppUploads || []).push({ map: s.world && s.world.map, act: s.flags && s.flags["story.act"], gov: !!(s.flags && s.flags["story.hc_gov_met"]) }); return Promise.resolve(); }',
    'export function deleteDoc(){ return Promise.reject(new Error("deleteDoc must not run in this test")); }',
  ].join('\n');
  const fulfill = (body) => (route) => route.fulfill({ status: 200, contentType: 'text/javascript', body });
  await page.route('**/firebase-app.js*', fulfill(app));
  await page.route('**/firebase-auth.js*', fulfill(auth));
  await page.route('**/firebase-firestore.js*', fulfill(fsMod));
  // The real cloud.js, with one line added so the test can read the hooks game.js hands it (getState, busy).
  await page.route('**/cloud.js*', async (route) => {
    const res = await route.fetch(), src = await res.text();
    if (src.indexOf('H = hooks;') < 0) throw new Error('cloud.js start() changed: update tests/cloud_stub.js');
    await route.fulfill({ status: 200, contentType: 'text/javascript', body: src.replace('H = hooks;', 'H = hooks; window.__ppCloudHooks = hooks;') });
  });
  await page.route(/googleapis\.com|firebaseio\.com|firebaseapp\.com|firebasestorage\.app/, (route) => route.abort('failed'));
}
// Wait until the cloud loop is signed in (stub) and has finished its first compare, so later uploads are only from play.
async function cloudReady(page) {
  await page.waitForFunction(() => typeof PPCloud !== 'undefined' && PPCloud.enabled && PPCloud.info().compared && !PPCloud.info().inflight, null, { timeout: 25000 });
}
module.exports = { stubCloudSdk, cloudReady };
