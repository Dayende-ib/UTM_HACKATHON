// Service worker minimal — installabilité + fallback hors-ligne.
// Volontairement PAS de cache des routes /api/* : les données (commerces,
// avis, catégories...) doivent toujours venir du réseau pour rester à jour.
// Seul l'app-shell (page d'accueil, page hors-ligne, assets statiques
// content-hashés de Next.js) est mis en cache.

const CACHE_VERSION = 'artisanbf-shell-v1';
const OFFLINE_URL = '/offline';
const SHELL_ASSETS = ['/', OFFLINE_URL, '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Jamais d'interception : API (données doivent rester fraîches),
  // et tout ce qui n'est pas même origine (Supabase, Pexels, tuiles carto...).
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) {
    return;
  }

  // Navigation (chargement de page) : réseau d'abord, mis en cache au passage
  // pour permettre de rouvrir une page déjà visitée hors ligne ; sinon page
  // hors-ligne en secours.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match(OFFLINE_URL).then((res) => res || caches.match('/')))
        )
    );
    return;
  }

  // Assets statiques Next.js (content-hashés, donc sûrs en cache-first).
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
  }
});
