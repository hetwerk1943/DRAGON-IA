const CACHE = 'ultrachat-v1';
const STATIC = ['/', '/index.html', '/styles.css', '/chat.js', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // API calls: network-first with offline fallback
  if (url.port === '3000' || url.pathname.startsWith('/chat')) {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response(JSON.stringify({ error: 'Brak połączenia – tryb offline.' }),
          { headers: { 'Content-Type': 'application/json' } })
      )
    );
    return;
  }
  // Static: cache-first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
