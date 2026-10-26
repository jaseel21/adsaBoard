/**
 * ADSA T-Board Service Worker
 * Version: 2.0.0
 * Provides offline caching, background resilience, app shell caching, and push notification handling.
 */

const CACHE_VERSION = 'v2.0.0';
const STATIC_CACHE = `adsa-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `adsa-runtime-${CACHE_VERSION}`;
const ASSET_CACHE = `adsa-assets-${CACHE_VERSION}`;

// Pre-cached core app shell assets
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/site.webmanifest',
  '/favicon.svg',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/apple-touch-icon.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
];

// 1. Install Event: Precache static core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch((err) => {
        console.warn('[SW] Precache failed during install:', err);
      })
  );
});

// 2. Activate Event: Clean up outdated caches and claim clients immediately
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, RUNTIME_CACHE, ASSET_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!currentCaches.includes(cacheName)) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// 3. Fetch Event: Multi-tiered caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests, reachability ping checks, or Firebase / Firestore API calls (Firestore has internal IndexedDB persistence)
  if (
    request.method !== 'GET' ||
    url.pathname === '/ping.json' ||
    url.searchParams.has('_ping') ||
    url.origin.includes('firestore.googleapis.com') ||
    url.origin.includes('identitytoolkit.googleapis.com') ||
    url.origin.includes('securetoken.googleapis.com') ||
    url.origin.includes('firebaseio.com')
  ) {
    return;
  }

  // Strategy A: Page Navigations (HTML) -> Network First with Cache Fallback to '/' or offline.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallback to cached route, then root index.html, then offline sanctuary page
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return caches.match('/').then((rootResponse) => {
              if (rootResponse) return rootResponse;
              return caches.match('/offline.html');
            });
          });
        })
    );
    return;
  }

  // Strategy B: Web Fonts & Static Media -> Cache-First
  const isFont =
    url.origin.includes('fonts.googleapis.com') ||
    url.origin.includes('fonts.gstatic.com') ||
    request.destination === 'font';

  const isImage =
    request.destination === 'image' ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|gif)$/i);

  if (isFont || isImage) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(ASSET_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // If image fails and not in cache, fallback gracefully
            return caches.match('/favicon.svg');
          });
      })
    );
    return;
  }

  // Strategy C: Bundled Scripts & Stylesheets (/assets/*) -> Stale-While-Revalidate
  const isStaticChunk =
    url.pathname.startsWith('/assets/') ||
    request.destination === 'script' ||
    request.destination === 'style';

  if (isStaticChunk) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => null);

        // Return cached response immediately for zero-latency 60fps load, or wait for network
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Strategy D: Default Network with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// 4. Message Event: Support immediate skipWaiting on update trigger
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 5. Push Notification Handler: Support background web push
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_) {
    data = { title: 'ADSA T-Board Notice', body: event.data ? event.data.text() : 'Campus meal update.' };
  }

  const title = data.title || 'ADSA T-Board • Alathurpadi Dars';
  const options = {
    body: data.body || 'New campus dining announcement or cutoff reminder.',
    icon: data.icon || '/android-chrome-192x192.png',
    badge: data.badge || '/favicon-32x32.png',
    vibrate: data.vibrate || [25, 40, 25],
    tag: data.tag || 'adsa-general-notification',
    renotify: true,
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 6. Notification Click Handler: Deep-link to app routes
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing tab if open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
