// Keeps the app working offline. Bump the version when files change.
const CACHE = 'cozy-chores-v2';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// The page itself: get the newest copy when online, fall back to the saved one offline.
// Everything else: serve from the cache right away, then refresh the cache in the background.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  if (e.request.mode === 'navigate'){
    e.respondWith(caches.open(CACHE).then(cache => fetch(e.request)
      .then(r => { if (r.ok) cache.put(e.request, r.clone()); return r; })
      .catch(() => cache.match(e.request, {ignoreSearch: true}).then(hit => hit || cache.match('./index.html')))));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(e.request, {ignoreSearch: true});
    const fresh = fetch(e.request).then(r => { if (r.ok) cache.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || fresh;
  }));
});
