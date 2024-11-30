self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('jj-cache-v1').then((cache) => {
            return cache.addAll([
                '/pwa/index.html',
                '/styles.css',
                '/script.js',
                '/android-chrome-192x192.png',
                '/android-chrome-512x512.png'
            ]);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
