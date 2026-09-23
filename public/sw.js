const CACHE = 'mingleke-v2.2.0';
const CORE = ['/', '/home', '/welcome', '/manifest.webmanifest', '/icon.svg', '/icon-192.png', '/icon-512.png'];
const SEED_HINT = '/seed/';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(CORE).catch(() => undefined))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith(SEED_HINT) ||
    /\.(?:js|css|jpg|jpeg|png|svg|webp|woff2?)$/i.test(url.pathname)
  );
}

async function cachePut(req, res) {
  try {
    const cache = await caches.open(CACHE);
    await cache.put(req, res);
  } catch {
    // quota
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Photos + hashed assets: cache-first so flaky networks still paint the deck
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res && res.ok) cachePut(req, res.clone());
          return res;
        });
      })
    );
    return;
  }

  // App shell: network-first with cache fallback (stale-while-revalidate)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) cachePut(req, res.clone());
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          return cached || (await caches.match('/')) || (await caches.match('/home')) || Response.error();
        })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) cachePut(req, res.clone());
          return res;
        })
        .catch(() => cached || Response.error());
      return cached || network;
    })
  );
});
