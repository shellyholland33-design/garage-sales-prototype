// sw-reset, unregister and wipe caches, then reload pages
self.addEventListener("install", e => self.skipWaiting());
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll().then(clients => {
        for (const c of clients) c.navigate(c.url);
      }))
  );
});
self.addEventListener("fetch", e => fetch(e.request));
