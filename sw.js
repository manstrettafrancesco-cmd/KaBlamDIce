const CACHE = "kablam-d10-v1";
const CORE = ['./', './index.html', './style.css', './app.js', './manifest.webmanifest', './assets/icons/icon-192.png', './assets/icons/icon-512.png'];
const IMAGES = ['./assets/images/1/01.png', './assets/images/1/02.png', './assets/images/1/03.png', './assets/images/1/04.png', './assets/images/1/05.png', './assets/images/1/06.png', './assets/images/1/07.png', './assets/images/1/08.png', './assets/images/10/01.png', './assets/images/10/02.png', './assets/images/10/03.png', './assets/images/10/04.png', './assets/images/10/05.png', './assets/images/10/06.png', './assets/images/10/07.png', './assets/images/10/08.png', './assets/images/2/01.png', './assets/images/2/02.png', './assets/images/2/03.png', './assets/images/2/04.png', './assets/images/2/05.png', './assets/images/2/06.png', './assets/images/2/07.png', './assets/images/2/08.png', './assets/images/3/01.png', './assets/images/3/02.png', './assets/images/3/03.png', './assets/images/3/04.png', './assets/images/3/05.png', './assets/images/3/06.png', './assets/images/3/07.png', './assets/images/3/08.png', './assets/images/4/01.png', './assets/images/4/02.png', './assets/images/4/03.png', './assets/images/4/04.png', './assets/images/4/05.png', './assets/images/4/06.png', './assets/images/4/07.png', './assets/images/4/08.png', './assets/images/5/01.png', './assets/images/5/02.png', './assets/images/5/03.png', './assets/images/5/04.png', './assets/images/5/05.png', './assets/images/5/06.png', './assets/images/5/07.png', './assets/images/5/08.png', './assets/images/6/01.png', './assets/images/6/02.png', './assets/images/6/03.png', './assets/images/6/04.png', './assets/images/6/05.png', './assets/images/6/06.png', './assets/images/6/07.png', './assets/images/6/08.png', './assets/images/7/01.png', './assets/images/7/02.png', './assets/images/7/03.png', './assets/images/7/04.png', './assets/images/7/05.png', './assets/images/7/06.png', './assets/images/7/07.png', './assets/images/7/08.png', './assets/images/8/01.png', './assets/images/8/02.png', './assets/images/8/03.png', './assets/images/8/04.png', './assets/images/8/05.png', './assets/images/8/06.png', './assets/images/8/07.png', './assets/images/8/08.png', './assets/images/9/01.png', './assets/images/9/02.png', './assets/images/9/03.png', './assets/images/9/04.png', './assets/images/9/05.png', './assets/images/9/06.png', './assets/images/9/07.png', './assets/images/9/08.png'];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)));
  self.skipWaiting();
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match('./index.html'))));
});
// Scarica le immagini in background dopo l'installazione, senza bloccare l'avvio.
self.addEventListener("message", event => {
  if (event.data === "CACHE_ALL_IMAGES") event.waitUntil(caches.open(CACHE).then(cache => Promise.allSettled(IMAGES.map(url => cache.add(url)))));
});
