const CACHE_NAME = 'kanjithai-cache-v9'; // v9: fixed light/dark region palette on the prefecture map

/**
 * Store a response in this version's cache, first evicting older entries for
 * the same path (e.g. a data file under its previous ?v= stamp) so the cache
 * never accumulates stale copies of multi-megabyte JSON.
 */
async function cacheReplace(request, response) {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  await Promise.all(
    keys
      .filter((req) => req.url !== request.url && new URL(req.url).pathname === new URL(request.url).pathname)
      .map((req) => cache.delete(req))
  );
  await cache.put(request, response);
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME)
                  .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Cache-First for vendored KanjiVG stroke SVGs (immutable files)
  if (url.pathname.includes('/data/kanjivg/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse.ok) {
            cacheReplace(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      })
    );
  }
  // Cache-First for versioned Data (JSON): data URLs carry a ?v= stamp that is
  // bumped whenever data is regenerated (see DATA_VERSION in assets/js/search.js),
  // so a cache hit is always the current build and visitors never re-download
  // multi-MB bundles on repeat visits.
  else if (url.pathname.includes('/data/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse.ok) {
            cacheReplace(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      })
    );
  }
  // Cache-First strategy for external Fonts only
  else if (url.hostname.includes('fonts.')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse.ok) {
            cacheReplace(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      })
    );
  } else {
    // Network-First for app code (HTML/JS/CSS) using the normal HTTP cache, so
    // unchanged files revalidate with cheap 304s instead of full re-downloads;
    // the SW cache serves them only when offline.
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            cacheReplace(event.request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
