
// Service Worker is currently disabled to prevent environment-specific origin errors.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
});
