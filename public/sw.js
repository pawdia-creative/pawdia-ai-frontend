const CACHE_NAME = 'pawdia-precache-v3';
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
      // Remove every cache not matching the current version so old chunks cannot survive upgrades.
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => {
        if (k !== CACHE_NAME) {
          console.log('[SW] activate: deleting cache', k);
          return caches.delete(k);
        }
        return Promise.resolve(false);
      }));

      // Claim clients after cleanup so they fetch the latest assets immediately.
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
      const url = new URL(request.url);
      const pathname = url.pathname;
      const bypassCachePaths = new Set(['/sitemap.xml', '/image-sitemap.xml', '/robots.txt']);
      const isAssetRequest = pathname.startsWith('/assets/') || /\.(js|mjs|css|png|jpg|jpeg|webp|svg|ico|txt|xml)$/i.test(pathname);
      const shouldBypassCache = bypassCachePaths.has(pathname) || pathname.endsWith('.xml');

      if (request.mode === 'navigate') {
        const networkResponse = await fetch(request, { cache: 'no-store' });
        return networkResponse;
      }

      if (shouldBypassCache || isAssetRequest) {
        return fetch(request, { cache: 'no-store' });
      }

      const cached = await caches.match(request);
      if (cached) return cached;

      // Debug: log outgoing fetch to help diagnose network failures
      try {
        console.log('[SW] fetching', request.url);
      } catch (e) { /* ignore logging failures */ }

      const response = await fetch(request);
      // put a copy in cache for future visits (ignore opaque responses)
      try {
        const contentType = response.headers.get('content-type') || '';
        const isHtml = contentType.includes('text/html');
        if (response && response.status === 200 && response.type !== 'opaque' && !isHtml) {
          const respClone = response.clone();
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, respClone).catch(() => {});
        }
      } catch (e) {
        // ignore cache put failures
      }
      return response;
    } catch (err) {
      // Log detailed failure for debugging
      try {
        console.warn('[SW] fetch failed for', request.url, err);
        notifyClients({ type: 'SW_FETCH_FAILED', url: String(request.url), error: String(err) });
      } catch (e) { /* ignore */ }
      // For navigations, fallback to the cached index.html so SPA can still load.
      if (request.mode === 'navigate') {
        try {
          return await caches.match('/index.html');
        } catch (e) {
          // ignore
        }
      }
      // For non-navigation requests, return a safe 502-style response instead of throwing
      try {
        return new Response('Network error', {
          status: 502,
          statusText: 'Bad Gateway',
          headers: { 'Content-Type': 'text/plain' }
        });
      } catch (e) {
        // If constructing the response fails, rethrow original error
        throw err;
      }
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

