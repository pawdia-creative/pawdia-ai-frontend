const CACHE_NAME = 'pawdia-precache-v1';
const CACHE_PREFIX = 'pawdia-precache-';
const FALLBACK_URLS = [
  '/',
  '/index.html',
];

// Utility: safe postMessage to all clients for lightweight diagnostics
async function notifyClients(message) {
  try {
    const allClients = await self.clients.matchAll({ includeUncontrolled: true });
    for (const client of allClients) {
      try {
        client.postMessage(message);
      } catch (e) {
        // ignore per-client failures
      }
    }
  } catch (e) {
    // ignore
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(FALLBACK_URLS);
      console.log('[SW] install: precached', FALLBACK_URLS);
    } catch (e) {
      console.warn('[SW] install: precache failed', e);
    }
  })());
  // Immediately take over only after activate cleans old caches
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      // Remove old caches that match our prefix but are not current
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => {
        if (k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME) {
          console.log('[SW] activate: deleting old cache', k);
          return caches.delete(k);
        }
        return Promise.resolve(false);
      }));

      // Claim clients after cleanup so they fetch the latest assets
      await self.clients.claim();
      await notifyClients({ type: 'SW_ACTIVATED', cacheName: CACHE_NAME });
      console.log('[SW] activate: completed, claimed clients');
    } catch (e) {
      console.warn('[SW] activate failed', e);
    }
  })());
});

// Simple runtime caching: serve from cache, fetch and cache otherwise.
self.addEventListener('fetch', (event) => {
  const request = event.request;
  // only handle navigation and same-origin GET requests
  try {
    if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
      return;
    }
  } catch (e) {
    // malformed URL or other error - skip SW handling
    return;
  }

  event.respondWith((async () => {
    try {
      const cached = await caches.match(request);
      if (cached) return cached;

      const response = await fetch(request);
      // put a copy in cache for future visits (ignore opaque responses)
      try {
        if (response && response.status === 200 && response.type !== 'opaque') {
          const respClone = response.clone();
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, respClone).catch(() => {});
        }
      } catch (e) {
        // ignore cache put failures
      }
      return response;
    } catch (err) {
      // fallback to index.html for navigations when offline
      if (request.mode === 'navigate') {
        try {
          return await caches.match('/index.html');
        } catch (e) {
          // ignore
        }
      }
      throw err;
    }
  })());
});

// Allow pages to trigger skipWaiting via postMessage (safe update flow)
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data === 'SKIP_WAITING' || (event.data && event.data.type === 'SKIP_WAITING')) {
    self.skipWaiting();
  }
});

