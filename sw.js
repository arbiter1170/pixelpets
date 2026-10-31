/* Walklings shell. Same-origin files only. version.json stays on the network so a newer deploy can still announce itself.
   Location lookups are other origins and are not touched.
   sw.js is not cached here: the browser's own update check must see the network copy.
   A new worker does not call skipWaiting. Taking over an open page makes iOS Safari reload it. */
const CACHE = 'walklings-shell';
const SHELL = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './sprites.js',
  './keeper.js',
  './stats.js',
  './moves.js',
  './data/mapdata.js',
  './quests.js',
  './standing.js',
  './rep.js',
  './save.js',
  './env.js',
  './sfx.js',
  './minigames.js',
  './ribbit.js',
  './news.js',
  './cloud_config.js',
  './cloud.js',
  './debug_ui.js',
  './data/nav_art.js',
  './clock.js',
  './mv_fx.js',
  './net.js',
  './game.js',
  './fonts/Jersey15.woff2',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', event => {
  // No skipWaiting. The first install still activates on its own (nothing else is active).
  // An update waits until this tab is closed, so a Pages deploy cannot reload a game in progress.
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
});

self.addEventListener('activate', event => {
  // claim() here only runs when this worker is actually taking over. On first install that
  // gives the open page a controller so the shell works offline. On an update it runs after
  // the old worker is gone, not under a game that is still playing.
  // Older workers stored every ?v=<build> copy of each script under its own key, so the cache grew by a full set of
  // scripts with every build a player loaded. Drop those; copies are now kept under the plain path (one per file).
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => caches.open(CACHE)).then(cache => cache.keys().then(reqs => Promise.all(reqs.filter(r => new URL(r.url).search).map(r => cache.delete(r)))))
    .then(() => self.clients.claim()));
});

function isVersion(url){
  return url.origin === self.location.origin && /(^|\/)version\.json$/.test(url.pathname);
}

function plainKey(url){ return url.origin + url.pathname; }

function isWorkerScript(url){
  return /(^|\/)sw\.js$/.test(url.pathname);
}

// Navigations and the HTML shell. A directory URL ends in "/". index.html is named.
function isPage(req, url){
  return req.mode === 'navigate' || /(^|\/)index\.html$/.test(url.pathname) || /\/$/.test(url.pathname);
}

// Safari rejects a navigation response whose fetch followed a redirect ("response served by
// service worker has redirections") and retries the load. Rebuild those as a plain 200.
async function stripRedirect(res){
  if (!res || res.type === 'opaqueredirect' || (res.status >= 300 && res.status < 400)) return null;
  if (!res.redirected) return res;
  try {
    const headers = new Headers(res.headers);
    headers.delete('content-encoding');
    headers.delete('content-length');
    return new Response(await res.arrayBuffer(), { status: res.status, statusText: res.statusText, headers });
  } catch (e) { return null; }
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // A missed version check must stay a normal response. A rejected fetch here becomes a console error and can hide the offline shell.
  if (isVersion(url)) {
    event.respondWith(fetch(req).catch(() => new Response('', { status: 404 })));
    return;
  }
  // Never cache the worker script. A cached copy can make an update check look new forever.
  if (isWorkerScript(url)) {
    event.respondWith(fetch(req).catch(() => new Response('', { status: 504 })));
    return;
  }
  const page = isPage(req, url);
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      // P0: pages always revalidate, so an old cached page never pairs with newer scripts (Pages ignores ?v=).
      const net = await (page ? fetch(req.url, { cache: 'no-cache', credentials: 'same-origin', redirect: 'follow' }) : fetch(req));
      const res = await stripRedirect(net);
      if (!res) throw new Error('redirect');
      // Keyed without the query: index.html asks for game.js?v=<build>, and each build would otherwise add a new copy.
      if (res.ok) { try { await cache.put(plainKey(url), res.clone()); } catch (e) { /* a full cache must not drop the live response */ } }
      return res;
    } catch (e) {
      const hit = (await cache.match(plainKey(url))) || (await cache.match(req, { ignoreSearch: true })) || (page ? await cache.match('./index.html') : null);
      return hit || new Response('', { status: 504 });
    }
  })());
});
