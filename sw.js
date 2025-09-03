const CACHE_NAME = "gsa_v2";
const PRECACHE = [
  "./","./index.html","./styles.css","./app.js","./data.js","./manifest.json",
  "./icons/icon_192.png","./icons/icon_512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(PRECACHE)));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});
// network first for HTML, cache first for assets
self.addEventListener("fetch", e => {
  const isHTML = e.request.headers.get("accept")?.includes("text/html");
  if (isHTML) {
    e.respondWith(
      fetch(e.request).then(r => {
        const copy = r.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
        return r;
      }).catch(() => caches.match(e.request).then(m => m || caches.match("./index.html")))
    );
    return;
  }
  e.respondWith(caches.match(e.request).then(m => m || fetch(e.request)));
});
