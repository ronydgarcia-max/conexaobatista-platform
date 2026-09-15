const CACHE_NAME = 'conexaobatista-pwa-v1'
const urlsToCache = ['/', '/index.html', '/manifest.json']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  )
})

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'Nova solicitacao'
  const options = {
    body: data.body || 'Voce tem uma nova pendencia',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: data.url || '/pendencias',
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data))
})