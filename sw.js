const CACHE = 'familia-v5';
const ASSETS = ['./', 'index.html', 'styles.css', 'app.js', 'config.js', 'supabase-adapter.js', 'vendor/supabase.js', 'manifest.webmanifest', 'icons/icon.svg', 'icons/apple-icon-v2-180.png', 'icons/app-icon-v2-192.png', 'icons/app-icon-v2-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Red primero (para recibir cambios), caché como respaldo sin conexión.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => {
    const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r;
  }).catch(() => caches.match(e.request)));
});
