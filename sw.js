// Service Worker - APP Análisis NV Programadas
// Solo cachea el "cascarón" de la app (HTML/manifest/iconos) para que abra
// instalada aunque no haya internet. Los datos del Excel viven en localStorage,
// no aquí, así que no hay riesgo de mostrar información desactualizada del negocio.

const CACHE_NAME = 'nv-programadas-v2';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // La librería SheetJS (CDN) y cualquier otro request externo: red primero, sin interceptar.
  if (url.origin !== self.location.origin) return;

  // App shell propio: RED primero (para que las actualizaciones se vean de inmediato),
  // y solo si no hay internet, recién ahí usa la copia guardada en caché.
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
