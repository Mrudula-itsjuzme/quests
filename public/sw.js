const CACHE_NAME = 'wild-realm-v1.0.0';

// Only offline-fallback assets are precached. index.html is deliberately excluded:
// it references content-hashed JS/CSS filenames that change on every deploy, so a
// cached copy would go stale and point at files the server no longer serves.
const PRECACHE_ASSETS = [
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/auth-celestial-aperture.png',
  '/dashboard-castle-panorama.png',
  '/quest-scholar-hero.png',
  '/rewards-season-chest.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache asset fetch warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests or browser extension/external origins
  if (event.request.method !== 'GET') return;

  // Never aggressively cache API requests - always network-first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({ error: { code: 'offline', message: 'You are currently offline.' } }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Navigation requests: always network-first. Only fall back to a cached shell
  // when the network truly fails (offline) - never prefer a stale cached HTML
  // response, since it can reference hashed asset filenames from a prior deploy.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          }
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Static assets (js, css, png, svg, fonts): Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse.ok && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
