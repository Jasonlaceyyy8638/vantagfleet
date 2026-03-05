/* VantagFleet PWA service worker - enables Add to Home Screen */
const CACHE_NAME = 'vantagfleet-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network-first; no offline cache required for Add to Home Screen
  event.respondWith(fetch(event.request));
});
