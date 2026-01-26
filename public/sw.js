const CACHE_NAME = 'pawdia-precache-v1';
const FALLBACK_URLS = [
  '/',
  '/index.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FALLBACK_URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      // Notify clients that a new service worker has taken control.
      try {
        const allClients = await self.clients.matchAll({ includeUncontrolled: true });
        for (const client of allClients) {
          client.postMessage({ type: 'SW_ACTIVATED' });
        }
      } catch (e) {
        // ignore
      }
    })()
  );
});

// Simple runtime caching: serve from cache, fetch and cache otherwise.
self.addEventListener('fetch', (event) => {
  const request = event.request;
  // only handle navigation and same-origin GET requests
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          // put a copy in cache for future visits (ignore opaque responses)
          if (response && response.status === 200 && response.type !== 'opaque') {
            const respClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, respClone));
          }
          return response;
        })
        .catch((err) => {
          // fallback to index.html for navigations when offline
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          throw err;
        });
    })
  );
});

// Allow pages to trigger skipWaiting via postMessage (safe update flow)
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data === 'SKIP_WAITING' || (event.data && event.data.type === 'SKIP_WAITING')) {
    self.skipWaiting();
  }
});


