// Offline fallback for the PWA shell only: these URLs are fetched from the network first and
// served from the cache when offline. Every other request is left to the browser.
const CACHE = 'jj-cache-v2';
const PRECACHE = [
    '/pwa',
    '/script.js',
    '/android-chrome-192x192.png',
    '/android-chrome-512x512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE)
            .then((cache) => cache.addAll(PRECACHE))
            .then(() => self.skipWaiting())
    );
});

// Drop older caches (v1 served everything cache-first and never refreshed)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    if (event.request.method !== 'GET' || url.origin !== self.location.origin || !PRECACHE.includes(url.pathname)) {
        return;
    }
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response.ok) {
                    const copy = response.clone();
                    event.waitUntil(caches.open(CACHE).then((cache) => cache.put(url.pathname, copy)));
                }
                return response;
            })
            .catch(() => caches.match(url.pathname).then((cached) => cached || Response.error()))
    );
});
