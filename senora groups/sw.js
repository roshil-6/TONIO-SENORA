// Tonio & Senora Migration Law Firm - Service Worker
// Version: 1.0.0
// Purpose: Enable offline functionality and caching

const CACHE_NAME = 'tonio-senora-v1.0.0';
const STATIC_CACHE_NAME = 'tonio-senora-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'tonio-senora-dynamic-v1.0.0';

// Files to cache for offline functionality
const STATIC_FILES = [
  './',
  './index.html',
  './client-dashboard.html',
  './admin-dashboard.html',
  './styles.css',
  './script.js',
  './client-dashboard.js',
  './admin-dashboard.js',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('[SW] Static files cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Error caching static files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          console.log('[SW] Serving from cache:', request.url);
          return cachedResponse;
        }
        
        // Otherwise, fetch from network
        return fetch(request)
          .then((networkResponse) => {
            // Check if response is valid
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // Clone the response
            const responseToCache = networkResponse.clone();
            
            // Cache dynamic content
            if (shouldCache(request.url)) {
              caches.open(DYNAMIC_CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseToCache);
                  console.log('[SW] Cached dynamic content:', request.url);
                });
            }
            
            return networkResponse;
          })
          .catch((error) => {
            console.log('[SW] Network request failed:', request.url, error);
            
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('./index.html');
            }
            
            // Return cached version if available
            return caches.match(request);
          });
      })
  );
});

// Determine if a URL should be cached
function shouldCache(url) {
  const urlObj = new URL(url);
  
  // Cache same-origin requests
  if (urlObj.origin === location.origin) {
    return true;
  }
  
  // Cache CDN resources
  if (url.includes('cdnjs.cloudflare.com') || 
      url.includes('fonts.googleapis.com') || 
      url.includes('fonts.gstatic.com')) {
    return true;
  }
  
  return false;
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle offline actions when connection is restored
      handleBackgroundSync()
    );
  }
});

// Handle background sync
async function handleBackgroundSync() {
  try {
    // Get offline actions from IndexedDB or localStorage
    const offlineActions = await getOfflineActions();
    
    for (const action of offlineActions) {
      await processOfflineAction(action);
    }
    
    console.log('[SW] Background sync completed');
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Get offline actions from storage
async function getOfflineActions() {
  // This would typically use IndexedDB for more robust storage
  // For now, we'll use a simple approach
  return [];
}

// Process individual offline action
async function processOfflineAction(action) {
  try {
    // Process the action based on type
    switch (action.type) {
      case 'document-upload':
        // Handle document upload
        break;
      case 'form-submission':
        // Handle form submission
        break;
      default:
        console.log('[SW] Unknown action type:', action.type);
    }
  } catch (error) {
    console.error('[SW] Failed to process action:', action, error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from Tonio & Senora',
    icon: './icons/icon-192x192.png',
    badge: './icons/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: './icons/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: './icons/icon-192x192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Tonio & Senora Migration', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('./')
    );
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('[SW] Service worker error:', event.error);
});

// Unhandled promise rejection
self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
});

console.log('[SW] Service worker script loaded');


