// Enhanced Atlan JD Builder Service Worker
// Provides advanced caching and offline capabilities with improved reliability

const CACHE_NAME = "atlan-jd-builder-cache-v1"
const RUNTIME_CACHE = "atlan-jd-builder-runtime"
const API_CACHE = "atlan-jd-builder-api"
const STATIC_CACHE = "atlan-jd-builder-static"

// Resources to cache on install
const PRECACHE_RESOURCES = ["/", "/offline", "/builder", "/standards", "/favicon.ico", "/manifest.json", "/logo.png"]

// Assets to cache
const ASSET_EXTENSIONS = [
  ".js",
  ".css",
  ".woff",
  ".woff2",
  ".ttf",
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
]

// API endpoints to cache with network-first strategy
const API_ENDPOINTS = ["/api/generate", "/api/analyze", "/api/enhance"]

// Install event - precache static assets
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing new service worker...")

  event.waitUntil(
    Promise.all([
      // Cache static resources
      caches
        .open(STATIC_CACHE)
        .then((cache) => {
          console.log("[Service Worker] Caching static files")
          return cache.addAll(PRECACHE_RESOURCES)
        }),

      // Create other caches
      caches.open(RUNTIME_CACHE),
      caches.open(API_CACHE),
    ])
      .then(() => self.skipWaiting())
      .catch((err) => console.error("[Service Worker] Install error:", err)),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating new service worker...")

  const currentCaches = [STATIC_CACHE, RUNTIME_CACHE, API_CACHE]

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!currentCaches.includes(cacheName)) {
              console.log("[Service Worker] Clearing old cache", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => {
        console.log("[Service Worker] Service worker activated")
        return self.clients.claim()
      })
      .catch((err) => console.error("[Service Worker] Activation error:", err)),
  )
})

// Helper function to determine if a request is for an asset
function isAssetRequest(url) {
  const requestUrl = new URL(url)
  return (
    ASSET_EXTENSIONS.some((ext) => requestUrl.pathname.endsWith(ext)) ||
    requestUrl.pathname.startsWith("/_next/static/") ||
    requestUrl.pathname.startsWith("/static/")
  )
}

// Helper function to determine if a request is for an API
function isApiRequest(url) {
  const requestUrl = new URL(url)
  return (
    requestUrl.pathname.startsWith("/api/") || API_ENDPOINTS.some((endpoint) => requestUrl.pathname.includes(endpoint))
  )
}

// Helper function to determine if a request is for a page
function isPageRequest(url) {
  const requestUrl = new URL(url)
  return (
    requestUrl.pathname === "/" ||
    requestUrl.pathname === "/builder" ||
    requestUrl.pathname === "/standards" ||
    requestUrl.pathname === "/offline" ||
    requestUrl.pathname.endsWith(".html")
  )
}

// Fetch event - handle requests
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return
  }

  // For API requests, use network first with timeout fallback
  if (isApiRequest(request.url)) {
    event.respondWith(networkFirstWithTimeout(request, 5000, API_CACHE))
    return
  }

  // For asset requests, use cache first strategy
  if (isAssetRequest(request.url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // For page requests, use network first strategy
  if (isPageRequest(request.url)) {
    event.respondWith(networkFirst(request, RUNTIME_CACHE))
    return
  }

  // For all other requests, use stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE))
})

// Cache first strategy - good for static assets
async function cacheFirst(request, cacheName = STATIC_CACHE) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)

  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      // Clone the response before putting it in the cache
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.error("[Service Worker] Cache first fetch failed:", error)

    // If fetch fails and we don't have a cached response, we can't do much
    throw error
  }
}

// Network first strategy - good for pages
async function networkFirst(request, cacheName = RUNTIME_CACHE) {
  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.log("[Service Worker] Network first fetch failed, falling back to cache", error)

    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // If offline and no cache, try to return the offline page
    if (request.mode === "navigate") {
      return caches.match("/offline").catch(() => {
        // If no offline page, return a generated response
        return new Response(
          `<!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Offline - Atlan JD Builder</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; padding: 2rem 1rem; max-width: 40rem; margin: 0 auto; }
              h1 { color: #4f46e5; }
              .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1.5rem; margin: 2rem 0; }
            </style>
          </head>
          <body>
            <h1>You're Offline</h1>
            <div class="card">
              <p>You are currently offline and this page is not available in your cache.</p>
              <p>Please check your internet connection and try again.</p>
            </div>
          </body>
          </html>`,
          {
            headers: { "Content-Type": "text/html" },
          },
        )
      })
    }

    throw error
  }
}

// Network first with timeout fallback - good for API requests
async function networkFirstWithTimeout(request, timeoutMs, cacheName = API_CACHE) {
  return new Promise(async (resolve) => {
    let timeoutId
    let networkResponseReceived = false

    // Set a timeout for the network request
    const timeoutPromise = new Promise((resolveTimeout) => {
      timeoutId = setTimeout(() => {
        if (!networkResponseReceived) {
          resolveTimeout(null)
        }
      }, timeoutMs)
    })

    // Try network first
    fetch(request.clone())
      .then((networkResponse) => {
        networkResponseReceived = true
        clearTimeout(timeoutId)

        if (networkResponse.ok) {
          // Cache the response for future use
          const clonedResponse = networkResponse.clone()
          caches.open(cacheName).then((cache) => {
            cache.put(request, clonedResponse)
          })
        }

        resolve(networkResponse)
      })
      .catch((error) => {
        networkResponseReceived = true
        clearTimeout(timeoutId)
        console.error("[Service Worker] Network request failed with error", error)
        resolve(null)
      })

    // Fallback to cache if network times out
    timeoutPromise.then(async (timeoutResponse) => {
      if (timeoutResponse === null && !networkResponseReceived) {
        console.log("[Service Worker] Network request timed out, falling back to cache")
        const cachedResponse = await caches.match(request, { cacheName })

        if (cachedResponse) {
          resolve(cachedResponse)
        } else {
          // If no cached response, try to return a default response
          resolve(
            new Response(
              JSON.stringify({
                error: "Network request timed out and no cached data available",
                offline: true,
                timestamp: new Date().toISOString(),
              }),
              {
                headers: { "Content-Type": "application/json" },
                status: 503,
                statusText: "Service Unavailable",
              },
            ),
          )
        }
      }
    })
  })
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request, cacheName = RUNTIME_CACHE) {
  const cache = await caches.open(cacheName)

  // Try to get from cache
  const cachedResponse = await cache.match(request)

  // Fetch from network
  const networkResponsePromise = fetch(request)
    .then((response) => {
      // Update cache with new response
      if (response.ok) {
        cache.put(request, response.clone())
      }
      return response
    })
    .catch((error) => {
      console.error("[Service Worker] Fetch failed in stale-while-revalidate:", error)
      throw error
    })

  // Return cached response immediately if available, otherwise wait for network
  return cachedResponse || networkResponsePromise
}

// Listen for messages from clients
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }

  if (event.data && event.data.type === "CLEAR_CACHES") {
    event.waitUntil(
      caches
        .keys()
        .then((cacheNames) => {
          return Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
        })
        .then(() => {
          console.log("[Service Worker] All caches cleared")
          event.ports[0].postMessage({ result: "success" })
        }),
    )
  }
})

// Background sync for offline operations
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-jd-data") {
    event.waitUntil(syncJdData())
  }
})

// Function to sync data when back online
async function syncJdData() {
  try {
    // Get pending operations from IndexedDB
    // This would be implemented in a real app
    console.log("[Service Worker] Syncing JD data")

    // For now, just log that we're syncing
    return Promise.resolve()
  } catch (error) {
    console.error("[Service Worker] Sync failed:", error)
    return Promise.reject(error)
  }
}
