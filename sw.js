// Service Worker for BSSKN Statutory Cooperative ERP Chrome App
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass through all requests directly to network for 100% reliability
  // This satisfies Chrome PWA installability requirements without blocking assets
});
