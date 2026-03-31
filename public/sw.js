const CACHE_VERSION = 'axess-v3'; // ← שנה מ-v2 ל-v3

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // אל תיירט בקשות ל-API — תן להן לעבור ישירות:
  if (event.request.url.includes('api.axess.pro')) {
    return; // ← לא קורא ל-event.respondWith
  }
  event.respondWith(fetch(event.request));
});

// Badge התראות:
self.addEventListener('message', (event) => {
  if (event.data?.type === 'UPDATE_BADGE') {
    const count = event.data.count || 0;
    if ('setAppBadge' in navigator) {
      if (count > 0) {
        navigator.setAppBadge(count);
      } else {
        navigator.clearAppBadge();
      }
    }
  }
});
