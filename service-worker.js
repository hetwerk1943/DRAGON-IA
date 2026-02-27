/* UltraChat AI Omega – Service Worker (PWA offline + caching) */

const CACHE_NAME = 'ultrachat-v1';
const CACHED_URLS = [
  '/',
  '/index.html',
  '/agent.html',
  '/styles.css',
  '/main.js',
  '/quiz.js',
  '/manifest.json',
  '/web/repo-agent/index.html',
  '/web/joke-generator/index.html',
  '/web/joke-generator/app.js',
  '/web/joke-generator/style.css'
];

/* Install: pre-cache all app shell assets */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHED_URLS))
  );
  self.skipWaiting();
});

/* Activate: remove stale caches */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

/* Fetch: network-first with cache fallback */
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
