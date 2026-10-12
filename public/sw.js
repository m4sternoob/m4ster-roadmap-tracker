// Service Worker for m4ster-tracker PWA
//
// Caching strategy (fixed 2026-10-12):
// - Navigations (/, /index.html): NETWORK FIRST. The HTML shell references
//   hashed asset URLs; serving a stale cached copy after a deploy points at
//   deleted files and leaves a permanent white screen. Always try the network
//   first, fall back to cache only when offline.
// - /assets/*: cache first. Vite content-hashes these filenames, so a cached
//   copy is always the right bytes for the HTML that referenced it.
// - Everything else: network only (no caching).
// Bumping CACHE_NAME purges the old broken cache on activate.

const CACHE_NAME = 'm4ster-tracker-v2';
const STATIC_ASSETS = ['/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch(() => {
        // Non-fatal: the worker still works without the precache.
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests
  if (request.method !== 'GET') return;
  if (url.origin !== location.origin) return;

  // Navigations: network first, cache only as an offline fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/index.html')))
    );
    return;
  }

  // Versioned build assets: cache first (immutable content hashes).
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((networkResponse) => {
            if (networkResponse.ok) {
              const copy = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return networkResponse;
          })
      )
    );
    return;
  }

  // Everything else: straight from the network.
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});

// Handle background sync for pending mutations
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-mutations') {
    event.waitUntil(syncMutations());
  }
});

async function syncMutations() {
  // This would be implemented with IndexedDB to process pending mutations
  console.log('Syncing pending mutations...');
}

// Push notification handling (future enhancement)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/',
      },
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.notification.data?.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});
