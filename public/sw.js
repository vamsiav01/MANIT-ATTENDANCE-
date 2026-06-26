// Service Worker for MANIT Attendance PWA
// Handles: caching, push notifications, notification click routing
const CACHE_NAME = 'manit-attendance-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
];

// ── Install: cache shell assets ──────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ───────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  event.waitUntil(clients.claim());
});

// ── Fetch: network-first with cache fallback ─────────────────
self.addEventListener('fetch', (event) => {
  if (
    event.request.url.includes('googleapis.com') ||
    event.request.url.includes('firestore') ||
    event.request.url.includes('firebase') ||
    event.request.url.includes('identitytoolkit')
  ) {
    return;
  }

  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
      })
  );
});

// ── Notification click: open the app and navigate ────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};
  let targetUrl = data.url || '/';

  // Override URL based on action button clicked
  if (action === 'view' || action === 'mark') targetUrl = '/today';
  if (action === 'calc') targetUrl = '/calculator';
  if (action === 'open') targetUrl = data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({ type: 'NAVIGATE', url: targetUrl });
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ── Push event (for future server-side push) ─────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'MANIT Attendance', body: event.data.text() };
  }

  const { title = 'MANIT Attendance', body = '', url = '/', tag = 'push', icon = '/icon-192.png' } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge: '/icon-192.png',
      tag,
      data: { url },
      vibrate: [200, 100, 200],
    })
  );
});

// ── Background sync (offline queue placeholder) ──────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-attendance') {
    // Future: sync attendance data when back online
    console.log('[SW] Background sync triggered');
  }
});
