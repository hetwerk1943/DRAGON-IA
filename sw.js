/**
 * DRAGON-IA Service Worker
 * Offline caching for PWA support with background sync.
 */
const CACHE_NAME = "dragon-ia-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/agent.html",
  "/manifest.json",
  "/public/css/style.css",
  "/public/js/app.js",
  "/public/js/dashboard.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  // API requests: network-first
  if (event.request.url.includes("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(event.request).then(r => r || new Response("{\"error\":\"offline\"}", {
          headers: { "Content-Type": "application/json" }
        }))
      )
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(event.request).then(cached =>
      cached || fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
    )
  );
});

self.addEventListener("sync", event => {
  if (event.tag === "sync-chat") {
    event.waitUntil(syncPendingMessages());
  }
});

async function syncPendingMessages() {
  const pending = await getPendingMessages();
  for (const msg of pending) {
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(msg)
      });
    } catch (_) { /* retry next sync */ }
  }
}

// TODO: implement IndexedDB persistence for offline queued messages
async function getPendingMessages() {
  return [];
}
