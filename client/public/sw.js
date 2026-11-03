// Service Worker for BSSKN Statutory Cooperative ERP Chrome App
const SW_VERSION = 'bsskn-sw-v3-purge-caches';

self.addEventListener('install', (event) => {
  // Activate immediately without waiting for existing tabs to close
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    // Delete any stale cache from earlier service workers
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          console.log('[SW] Purging old cache:', key);
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Pass through all requests directly to the network
  // This satisfies Chrome PWA installability requirements while preventing any stale asset caching
});
