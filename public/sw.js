const CACHE_NAME = 'goldmine-shell-v4';
const APP_VERSION = '2026-07-02-3';
const SHELL_ASSETS = ['/', '/manifest.json', '/icons/icon.svg?v=6'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => null)
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(async (keys) => {
        const oldCaches = keys.filter((key) => key !== CACHE_NAME);
        await Promise.all(oldCaches.map((key) => caches.delete(key)));
        await self.clients.claim();

        if (oldCaches.length === 0) return;

        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        clients.forEach((client) => {
          client.postMessage({ type: 'APP_UPDATE_AVAILABLE', version: APP_VERSION });
        });

        await new Promise((resolve) => setTimeout(resolve, 1500));
        await Promise.all(clients.map((client) => {
          const clientUrl = new URL(client.url);
          if (clientUrl.origin !== self.location.origin || typeof client.navigate !== 'function') return null;
          return client.navigate(client.url).catch(() => null);
        }));
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_) {}

  const title = data.title || 'Gold Mine';
  const options = {
    body: data.body || '',
    icon: '/icons/icon.svg?v=6',
    badge: '/icons/icon.svg?v=6',
    data: { url: data.url || '/dashboard' },
    vibrate: [100, 50, 100]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.location.origin) && 'focus' in c);
      if (existing) {
        existing.focus();
        return existing.navigate(url).catch(() => null);
      }
      return self.clients.openWindow(url);
    })
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request, { cache: 'no-store' }));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match('/'))
    );
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cached) => cached || fetch(request))
  );
});
