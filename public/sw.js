// Cardlet minimal service worker — offline shell + runtime caching for static assets.
// Keep this file tiny. Bump CACHE_VERSION when you change anything cache-worthy.

const CACHE_VERSION = 'cardlet-v1'
const OFFLINE_URLS = ['/', '/login', '/offline', '/icon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      cache.addAll(OFFLINE_URLS).catch(() => {
        // Any missing URL shouldn't block install.
      })
    )
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)

  // Never cache API, auth, or cross-origin requests.
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return

  // HTML navigations: network-first, fall back to cache.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy))
          return res
        })
        .catch(() => caches.match(req).then((c) => c || caches.match('/')))
    )
    return
  }

  // Static assets: cache-first.
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            const copy = res.clone()
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy))
            return res
          })
      )
    )
  }
})
