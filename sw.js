/* Walklings shell. Same-origin files only. version.json stays on the network so a newer deploy can still announce itself.
   Location lookups are other origins and are not touched. */
const CACHE = 'walklings-shell';
const SHELL = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './sw.js',
  './sprites.js',
  './keeper.js',
  './stats.js',
  './moves.js',
  './data/mapdata.js',
  './quests.js',
  './standing.js',
  './save.js',
  './env.js',
  './sfx.js',
  './minigames.js',
  './ribbit.js',
  './cloud_config.js',
  './cloud.js',
  './debug_ui.js',
  './data/nav_art.js',
  './game.js',
  './fonts/Jersey15.woff2',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

function isVersion(url){
  return url.origin === self.location.origin && /(^|\/)version\.json$/.test(url.pathname);
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
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      // P0: pages (index.html) always revalidate, so an old cached page never pairs with newer scripts (Pages ignores ?v=).
      const page = req.mode === 'navigate' || /(^|\/)(index\.html)?$/.test(url.pathname);
      const res = await (page ? fetch(req.url, { cache: 'no-cache', credentials: 'same-origin', redirect: req.mode === 'navigate' ? 'manual' : 'follow' }) : fetch(req));
      if (res && res.ok) { try { await cache.put(req, res.clone()); } catch (e) { /* a full cache must not drop the live response */ } }
      return res;
    } catch (e) {
      const hit = (await cache.match(req)) || (await cache.match(req, { ignoreSearch: true })) || (await cache.match('./index.html'));
      return hit || new Response('', { status: 504 });
    }
  })());
});
