const CACHE_VERSION = "v1.0.1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_VERSION).then(c => c.addAll(APP_SHELL)));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(networkRes => {
        const copy = networkRes.clone();
        caches.open(CACHE_VERSION).then(c => c.put(event.request, copy)).catch(() => {});
        return networkRes;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
