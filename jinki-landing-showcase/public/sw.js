/**
 * SERVICE WORKER - NETWORKPRO OFFLINE-FIRST STRATEGY
 *
 * Caching Strategy: "COMPETE TO WIN" Multi-Tier Approach
 * 1. Network-First (for HTML - always latest)
 * 2. Cache-First (for assets - fastest possible)
 * 3. Stale-While-Revalidate (for fonts - best of both worlds)
 *
 * This strategy ensures:
 * - Instant repeat visits (cache hits)
 * - Fresh content when online
 * - Graceful offline fallback
 */

const CACHE_VERSION = 'jinki-v1';
const RUNTIME_CACHE = 'jinki-runtime-v1';
const FONT_CACHE = 'jinki-fonts-v1';

// Critical assets that MUST be cached for offline support
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/assets/index-H6anRomC.js',
  '/assets/index-eII8Ij-Y.css',
  '/vite.svg',
  '/jinki-logo.svg'
];

// External resources with specific cache strategies
const EXTERNAL_RESOURCES = {
  fonts: [
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Space+Grotesk:wght@600;700&display=swap',
    'https://fonts.gstatic.com/s/inter/v13/UcCO_p8CyjoYL_58Ig4jVFQf4EBstn.woff2',
    'https://fonts.gstatic.com/s/spacegrotesk/v16/V0xR4EsONYYWNVH3T-R6AeFf7Wtayhc.woff2'
  ]
};

// ═══════════════════════════════════════════════════════════════
// INSTALLATION PHASE: Precache critical assets
// ═══════════════════════════════════════════════════════════════
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => {
        console.log('SW: Precaching critical assets...');
        return cache.addAll(CRITICAL_ASSETS);
      })
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// ═══════════════════════════════════════════════════════════════
// ACTIVATION PHASE: Clean up old cache versions
// ═══════════════════════════════════════════════════════════════
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_VERSION &&
                cacheName !== RUNTIME_CACHE &&
                cacheName !== FONT_CACHE) {
              console.log('SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim()) // Claim all clients immediately
  );
});

// ═══════════════════════════════════════════════════════════════
// FETCH PHASE: Intelligent routing based on resource type
// ═══════════════════════════════════════════════════════════════
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests (security)
  if (url.origin !== self.location.origin) {
    return handleExternalRequest(event);
  }

  // Route based on request type
  if (request.method !== 'GET') {
    // Don't cache POST/PUT/DELETE
    return;
  }

  if (url.pathname === '/' || url.pathname === '/index.html') {
    // HTML: Network-First (always get latest, fallback to cache)
    event.respondWith(networkFirstStrategy(request));
  } else if (url.pathname.startsWith('/assets/')) {
    // Built assets: Cache-First (immutable hashes)
    event.respondWith(cacheFirstStrategy(request, CACHE_VERSION));
  } else if (url.pathname.match(/\.(svg|woff2|ttf)$/)) {
    // Static assets: Cache-First with long validity
    event.respondWith(cacheFirstStrategy(request, CACHE_VERSION));
  } else {
    // Everything else: Cache-First with network fallback
    event.respondWith(cacheFirstStrategy(request, RUNTIME_CACHE));
  }
});

/**
 * NETWORK-FIRST STRATEGY (HTML pages)
 * Tries network first, falls back to cache if offline
 * Best for: pages that update frequently
 */
function networkFirstStrategy(request) {
  return fetch(request)
    .then(response => {
      // Only cache successful responses
      if (!response || response.status !== 200 || response.type === 'error') {
        return response;
      }

      const responseToCache = response.clone();
      caches.open(RUNTIME_CACHE)
        .then(cache => cache.put(request, responseToCache));

      return response;
    })
    .catch(() => {
      // Network failed, try cache
      return caches.match(request)
        .then(response => response || offlineResponse());
    });
}

/**
 * CACHE-FIRST STRATEGY (Assets)
 * Checks cache first, falls back to network if not found
 * Best for: immutable assets with content hashes
 */
function cacheFirstStrategy(request, cacheName) {
  return caches.match(request)
    .then(response => {
      // Hit: Return cached response
      if (response) {
        return response;
      }

      // Miss: Fetch from network
      return fetch(request)
        .then(response => {
          // Validate response
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Cache for future use
          const responseToCache = response.clone();
          caches.open(cacheName)
            .then(cache => cache.put(request, responseToCache));

          return response;
        })
        .catch(() => offlineResponse());
    });
}

/**
 * EXTERNAL REQUESTS (Google Fonts, CDNs)
 * Stale-While-Revalidate for fonts
 * Network-First for dynamic content
 */
function handleExternalRequest(event) {
  const { request } = event;
  const url = new URL(request.url);

  // Google Fonts: Stale-While-Revalidate (serve cache, update in background)
  if (url.hostname === 'fonts.googleapis.com' ||
      url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(request)
        .then(response => {
          const fetchPromise = fetch(request)
            .then(response => {
              if (response && response.status === 200) {
                const responseToCache = response.clone();
                caches.open(FONT_CACHE)
                  .then(cache => cache.put(request, responseToCache));
              }
              return response;
            });

          return response || fetchPromise;
        })
    );
  } else {
    // Other external: Network-First
    event.respondWith(
      fetch(request)
        .catch(() => caches.match(request))
    );
  }
}

/**
 * OFFLINE FALLBACK
 * Graceful degradation when offline
 */
function offlineResponse() {
  return caches.match('/index.html');
}

// ═══════════════════════════════════════════════════════════════
// MESSAGE HANDLING: Communication with client
// ═══════════════════════════════════════════════════════════════
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ═══════════════════════════════════════════════════════════════
// BACKGROUND SYNC (for future enhancements)
// ═══════════════════════════════════════════════════════════════
self.addEventListener('sync', event => {
  if (event.tag === 'sync-analytics') {
    // Sync pending analytics when back online
    event.waitUntil(
      // Add analytics sync logic here
      Promise.resolve()
    );
  }
});
