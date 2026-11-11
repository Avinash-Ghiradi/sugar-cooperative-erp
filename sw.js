// Service Worker for BSSKN Statutory Cooperative ERP Chrome App
const SW_VERSION = 'bsskn-sw-v4-clean';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          return caches.delete(key);
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Pass through all requests directly to the network
  // This satisfies Chrome PWA installability requirements while preventing any stale asset caching
});
