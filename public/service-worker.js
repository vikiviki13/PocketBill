const CACHE_NAME = 'pocketbill-react-v4';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

async function precacheApp() {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(APP_SHELL);

  // Vite fingerprints production JS/CSS. Discover those generated URLs from
  // the built index so the app works offline immediately after installation.
  const indexResponse = await fetch('/index.html', { cache: 'no-store' });
  const html = await indexResponse.text();
  const buildAssets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)]
    .map((match) => match[1]);
  await cache.addAll([...new Set(buildAssets)]);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    precacheApp().then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

async function fetchAndCache(request) {
  const response = await fetch(request);
  if (response.ok && response.type === 'basic') {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetchAndCache(event.request).catch(async () => (
        (await caches.match(event.request)) || caches.match('/index.html')
      )),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => (
      cached || fetchAndCache(event.request)
    )),
  );
});
