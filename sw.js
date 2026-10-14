/* Õpetaja Abiline – service worker: the app opens offline. Network first, cache as a fallback.
   API calls (other origins) are never cached. */
var CACHE = 'oa-v1';
var CORE = ['./', 'index.html', 'css/fonts.css', 'css/style.css', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/apple-touch-icon.png',
  'js/i18n.js', 'js/i18n-ui.js', 'js/i18n-more.js', 'js/music.js', 'js/ai.js', 'js/build.js', 'js/preview.js', 'js/demo.js', 'js/tour.js', 'js/app.js'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return Promise.all(CORE.map(function (u) { return c.add(u).catch(function () {}); })); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(fetch(req).then(function (res) {
    if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
    return res;
  }).catch(function () { return caches.match(req).then(function (m) { return m || caches.match('index.html'); }); }));
});
