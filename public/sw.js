self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // A minimal fetch handler is required by Chrome for PWA installability.
  event.respondWith(
    fetch(event.request).catch(() => {
      // Fallback response for offline situations where the cache misses
      return new Response('You are completely offline. Please check your network connection.', { 
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({
          'Content-Type': 'text/plain'
        })
      });
    })
  );
});
