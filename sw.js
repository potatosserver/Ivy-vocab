const CACHE_NAME = 'ivy-helper-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Noto+Sans+TC:wght@400;500;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0',
  'https://unpkg.com/html5-qrcode'
];

// 安裝 Service Worker 並快取靜態資源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// 攔截網路請求：優先使用快取，沒有才上網抓
self.addEventListener('fetch', (event) => {
  // 對於 API 請求 (如 codetabs 或 google script)，我們不使用快取，或使用 Network First
  if (event.request.url.includes('api.codetabs.com') || event.request.url.includes('script.google.com')) {
      return; // 直接回傳，走預設網路行為
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 如果快取有，就回傳快取；否則發送網路請求
        return response || fetch(event.request);
      })
  );
});

// 更新 Service Worker 時清除舊快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});