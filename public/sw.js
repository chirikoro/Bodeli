// Bodeli Service Worker v1
// Basic SW for PWA installability. Offline data sync is v2.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Pass through all requests - no caching in v1
  return;
});
