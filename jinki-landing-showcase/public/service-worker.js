/**
 * TEAM FUSION: Service Worker for Offline Support
 * Enables critical content to be accessible even when offline
 *
 * Strategic caching:
 * - CRITICAL: Always cached (hero, key features, ROI calculator)
 * - DYNAMIC: Cached on first visit, updated on subsequent visits
 * - NETWORK: Try network first, fallback to cache
 */

const CACHE_VERSION = 'jinki-v1'
const CRITICAL_URLS = [
  '/',
  '/index.html',
  '/jinki-logo.svg',
]

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(CRITICAL_URLS).catch((error) => {
        console.warn('Failed to cache critical URLs:', error)
      })
    }).then(() => {
      self.skipWaiting() // Activate immediately
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_VERSION)
          .map((name) => {
            console.log('Deleting old cache:', name)
            return caches.delete(name)
          })
      )
    }).then(() => {
      self.clients.claim() // Take control of all clients
    })
  )
})

// Fetch event - intelligent caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip external domains (Google Fonts, Unsplash, etc.)
  // but they could be cached if needed
  if (url.origin !== self.location.origin) {
    return
  }

  // Network-first strategy: Try network, fallback to cache
  if (request.destination === 'document' || request.destination === 'empty') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const cache = caches.open(CACHE_VERSION)
            cache.then((c) => c.put(request, response.clone()))
          }
          return response
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse
            }

            // If cache misses and offline, return offline page
            if (url.pathname === '/' || url.pathname === '/index.html') {
              return caches.match('/')
            }

            // For API calls, return error response
            return new Response(
              JSON.stringify({
                error: 'Offline',
                message: 'You are currently offline. Some content may be unavailable.'
              }),
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' }
              }
            )
          })
        })
    )
    return
  }

  // Cache-first strategy for assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(request).then((response) => {
        // Cache successful responses
        if (response.ok) {
          const cache = caches.open(CACHE_VERSION)
          cache.then((c) => c.put(request, response.clone()))
        }

        return response
      }).catch(() => {
        // Network failed, no cache available
        console.warn('Failed to fetch resource:', request.url)
      })
    })
  )
})

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_VERSION).then(() => {
      event.ports[0].postMessage({ type: 'CACHE_CLEARED' })
    })
  }

  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    caches.keys().then((names) => {
      event.ports[0].postMessage({
        type: 'CACHE_STATUS',
        caches: names,
        activeCache: CACHE_VERSION
      })
    })
  }
})

// Periodic background sync (when back online)
// Could be used to sync notes, context, etc.
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-context') {
    event.waitUntil(
      // Sync stored context with server when back online
      new Promise((resolve) => {
        // Implement sync logic here
        console.log('Syncing context with server...')
        resolve()
      })
    )
  }
})
