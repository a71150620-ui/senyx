// ═══════════════════════════════════════════════
// SENYX Service Worker — PWA Offline Support
// مدينة الابتكار العالمية الذكية
// ═══════════════════════════════════════════════

const CACHE_NAME = ‘senyx-v3’;
const OFFLINE_URL = ‘/offline.html’;

const STATIC_ASSETS = [
‘/’,
‘/index.html’,
‘/ipccore.html’,
‘/market.html’,
‘/ai-platform.html’,
‘/dashboards.html’,
‘/governance.html’,
‘/community.html’,
‘/investor.html’,
‘/news.html’,
‘/offline.html’,
‘https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cairo:wght@300;400;600;700;900&family=Space+Mono:wght@400;700&display=swap’
];

// Install
self.addEventListener(‘install’, e => {
e.waitUntil(
caches.open(CACHE_NAME)
.then(cache => cache.addAll(STATIC_ASSETS))
.then(() => self.skipWaiting())
);
});

// Activate
self.addEventListener(‘activate’, e => {
e.waitUntil(
caches.keys().then(keys =>
Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
).then(() => self.clients.claim())
);
});

// Fetch
self.addEventListener(‘fetch’, e => {
if (e.request.method !== ‘GET’) return;

// API calls — always network
if (e.request.url.includes(‘anthropic.com’) ||
e.request.url.includes(‘elevenlabs.io’)) {
return;
}

e.respondWith(
caches.match(e.request).then(cached => {
if (cached) return cached;
return fetch(e.request).then(response => {
if (response.ok) {
const clone = response.clone();
caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
}
return response;
}).catch(() => {
if (e.request.destination === ‘document’) {
return caches.match(OFFLINE_URL);
}
});
})
);
});

// Push Notifications
self.addEventListener(‘push’, e => {
const data = e.data?.json() || {};
e.waitUntil(
self.registration.showNotification(data.title || ‘SENYX’, {
body: data.body || ‘إشعار جديد من SENYX’,
icon: ‘/icons/icon-192.png’,
badge: ‘/icons/icon-72.png’,
dir: ‘rtl’,
lang: ‘ar’,
data: { url: data.url || ‘/’ }
})
);
});

self.addEventListener(‘notificationclick’, e => {
e.notification.close();
e.waitUntil(clients.openWindow(e.notification.data.url));
});