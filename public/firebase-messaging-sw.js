// Register custom notificationclick listener BEFORE importing Firebase Messaging scripts
// to ensure FCM does not overwrite custom click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const rawUrl = event.notification.data?.url || '/';
  const targetUrl = new URL(rawUrl, self.location.origin).href;
  const orderId = event.notification.data?.orderId;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          if (orderId && 'postMessage' in client) {
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              orderId,
              url: targetUrl,
            });
          }
          if (client.url !== targetUrl && 'navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// ---------------------------------------------------------------------------
// Offline support: app-shell + static-asset caching.
//
// This lives in the same worker as Firebase Messaging on purpose: the app
// removes any service worker whose script is not /firebase-messaging-sw.js,
// and a scope can only have one worker anyway.
//
// Strategy
//   - Page navigations: network first (4s budget), fall back to the cached
//     shell, then to a small offline page. Fresh deploys are picked up as soon
//     as the network answers.
//   - /assets/* (content-hashed by Vite): cache first, they never change.
//   - manifest and /icons/*: stale-while-revalidate.
//   - Fonts and the logo (allow-listed external hosts): stale-while-revalidate.
//   - Everything else is left alone: /api/*, Google Apps Script, Firebase,
//     non-GET requests, and the dev server's /src modules.
// Bump CACHE_VERSION to discard all caches on the next activation.
// ---------------------------------------------------------------------------
const CACHE_VERSION = 'v1';
const SHELL_CACHE = 'app-shell-' + CACHE_VERSION;
const ASSET_CACHE = 'app-assets-' + CACHE_VERSION;
const EXTERNAL_CACHE = 'app-external-' + CACHE_VERSION;
const CURRENT_CACHES = [SHELL_CACHE, ASSET_CACHE, EXTERNAL_CACHE];
const EXTERNAL_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'i.imgur.com'];
const NAVIGATION_TIMEOUT_MS = 4000;

const OFFLINE_HTML =
  '<!doctype html><html lang="ms"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<title>Offline</title><style>body{font-family:system-ui,sans-serif;display:flex;' +
  'min-height:100vh;margin:0;align-items:center;justify-content:center;text-align:center;' +
  'padding:24px;color:#1c1e21}button{margin-top:16px;padding:10px 20px;border:0;border-radius:12px;' +
  'background:#1877F2;color:#fff;font-size:16px}</style></head><body><div>' +
  '<h2>Tiada sambungan internet</h2><p>Sambung ke internet sekali untuk memuat turun aplikasi, ' +
  'kemudian ia boleh dibuka tanpa talian.</p><p style="opacity:.7">No connection. Connect once to ' +
  'download the app; after that it opens offline.</p>' +
  '<button onclick="location.reload()">Cuba lagi / Retry</button></div></body></html>';

function isCacheableSameOriginPath(pathname) {
  return (
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/icons/') ||
    pathname === '/manifest.json'
  );
}

function isCacheableUrl(url) {
  if (url.origin === self.location.origin) return isCacheableSameOriginPath(url.pathname);
  return url.protocol === 'https:' && EXTERNAL_HOSTS.indexOf(url.hostname) !== -1;
}

function isStorable(response) {
  // Opaque (no-cors) responses are fine for fonts and images.
  return response && (response.ok || response.type === 'opaque');
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });
}

async function handleNavigation(event) {
  const cache = await caches.open(SHELL_CACHE);
  const network = fetch(event.request).then((response) => {
    // Every navigation serves the same SPA shell, so store it under one key.
    if (response.ok && response.type === 'basic') cache.put('/', response.clone());
    return response;
  });
  event.waitUntil(network.catch(() => {}));
  try {
    return await withTimeout(network, NAVIGATION_TIMEOUT_MS);
  } catch (e) {
    const cached = await cache.match('/');
    if (cached) return cached;
    try {
      return await network; // slow, but nothing cached: keep waiting for the real response
    } catch (e2) {
      return new Response(OFFLINE_HTML, {
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (isStorable(response)) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(event, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(event.request);
  const refresh = fetch(event.request)
    .then((response) => {
      if (isStorable(response)) cache.put(event.request, response.clone());
      return response;
    })
    .catch(() => null);
  if (hit) {
    event.waitUntil(refresh);
    return hit;
  }
  const fresh = await refresh;
  return fresh || Response.error();
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || request.headers.has('range')) return;

  let url;
  try { url = new URL(request.url); } catch (e) { return; }

  if (request.mode === 'navigate' && url.origin === self.location.origin) {
    if (url.pathname.startsWith('/api/')) return;
    event.respondWith(handleNavigation(event));
    return;
  }

  if (!isCacheableUrl(url)) return;

  if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
  } else {
    event.respondWith(
      staleWhileRevalidate(event, url.origin === self.location.origin ? ASSET_CACHE : EXTERNAL_CACHE)
    );
  }
});

// Remove caches from older versions.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.indexOf('app-') === 0 && CURRENT_CACHES.indexOf(k) === -1)
          .map((k) => caches.delete(k))
      )
    )
  );
});

// The page tells us which resources it actually loaded, so the very first visit
// is fully available offline (requests made before this worker took control
// were not seen by the fetch handler).
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.type !== 'CACHE_URLS' || !Array.isArray(data.urls)) return;

  event.waitUntil((async () => {
    // The HTML document itself was loaded before this worker controlled the page.
    try {
      const shellResponse = await fetch('/', { cache: 'reload' });
      if (shellResponse.ok && shellResponse.type === 'basic') {
        await (await caches.open(SHELL_CACHE)).put('/', shellResponse);
      }
    } catch (e) {}

    const urls = [];
    data.urls.forEach((u) => {
      try {
        const url = new URL(u);
        if (isCacheableUrl(url)) urls.push(url);
      } catch (e) {}
    });

    const assetCache = await caches.open(ASSET_CACHE);
    const externalCache = await caches.open(EXTERNAL_CACHE);
    await Promise.all(urls.map(async (url) => {
      const sameOrigin = url.origin === self.location.origin;
      const cache = sameOrigin ? assetCache : externalCache;
      if (await cache.match(url.href)) return;
      try {
        const response = await fetch(url.href, sameOrigin ? undefined : { mode: 'no-cors' });
        if (isStorable(response)) await cache.put(url.href, response);
      } catch (e) {}
    }));

    // Drop hashed assets from previous deploys (only when the list looks complete).
    const currentAssets = urls
      .filter((u) => u.origin === self.location.origin && u.pathname.startsWith('/assets/'))
      .map((u) => u.pathname);
    if (currentAssets.some((p) => /\.js$/.test(p))) {
      const keys = await assetCache.keys();
      await Promise.all(keys.map((req) => {
        const u = new URL(req.url);
        if (u.origin === self.location.origin && u.pathname.startsWith('/assets/') &&
            currentAssets.indexOf(u.pathname) === -1) {
          return assetCache.delete(req);
        }
      }));
    }
  })());
});

// Firebase Messaging is optional for offline support: if the CDN is unreachable
// the worker must keep serving the cache, so a failure here is logged, not thrown.
try {
  // Import Firebase 12.14.0 compat scripts aligned with package.json
  importScripts('https://www.gstatic.com/firebasejs/12.14.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/12.14.0/firebase-messaging-compat.js');

  firebase.initializeApp({
    apiKey: "AIzaSyDqF5o8uNqY50gTF-I_tcY4Q8Wy-z_2dCs",
    authDomain: "order-submission-501208.firebaseapp.com",
    projectId: "order-submission-501208",
    storageBucket: "order-submission-501208.firebasestorage.app",
    messagingSenderId: "440315185873",
    appId: "1:440315185873:web:10a310f20b28a0413853f0"
  });

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Background message received:', payload);
  
    // Prevent duplicate background notifications:
    // When payload contains a `notification` property, Firebase Messaging automatically displays it.
    // Only manually display a notification for data-only messages (when payload.notification is absent).
    if (!payload.notification && payload.data) {
      const title = payload.data.title || 'Pesanan & Notifikasi';
      const body = payload.data.body || '';
      const url = payload.data.url || '/';
      const orderId = payload.data.orderId;

      const notificationOptions = {
        body,
        icon: payload.data.icon || 'https://i.imgur.com/49kNDoe.png',
        badge: 'https://i.imgur.com/49kNDoe.png',
        data: { url, orderId },
        tag: payload.data.tag || undefined,
      };

      return self.registration.showNotification(title, notificationOptions);
    }
  });
} catch (firebaseInitError) {
  console.warn('[firebase-messaging-sw.js] Firebase Messaging unavailable:', firebaseInitError);
}
