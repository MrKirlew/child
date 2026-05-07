// Minimal service worker for Ollie PWA. Cache-first for static app shell,
// network-first for /api/* (so the kid always gets fresh AI responses).
// Bump CACHE_NAME on each release to invalidate stale shells.

const CACHE_NAME = 'ollie-shell-v2';
const SHELL = [
  '/',
  '/index.html',
  '/css/main.css',
  '/js/countdown.js',
  '/js/spell-tools.js',
  '/js/speech.js',
  '/js/ai.js',
  '/js/exercises.js',
  '/js/progress.js',
  '/js/ui.js',
  '/js/observability.js',
  '/js/logger.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)).catch(() => { /* a fetch failure here shouldn't block install */ })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Bypass the service worker entirely for API calls. Without calling
  // respondWith() the request goes to the network normally — same effect
  // as network-first with no cache fallback. Catches a v1 bug where
  // fetch().catch(() => caches.match()) returned undefined for uncached
  // /api/* paths, which corrupted the response with "Failed to convert
  // value to 'Response'" and leaked into the caller as a cryptic error.
  if (url.pathname.startsWith('/api/')) return;

  // Cache-first for everything else; fall through to network on miss.
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
