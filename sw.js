const CACHE_NAME = 'sewage-service-v1';
const urlsToCache = [
    '/sewage-service/',
    '/sewage-service/index.html',
    '/sewage-service/manifest.json',
    '/sewage-service/icon-192.png',
    '/sewage-service/icon-512.png'
];

self.addEventListener('install', function(event) {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('activate', function(event) {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request);
        })
    );
});
