const CACHE_NAME = 'ivy-vocab-v2'; // 更新版本號以強制刷新
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Noto+Sans+TC:wght@400;500;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0',
  'https://unpkg.com/html5-qrcode'
];
// 注意：圖示(icon-192.png, icon-512.png) 必須確定檔案存在再放入快取，
// 否則若 404 會導致 SW 安裝失敗。這裡先移除以確保核心功能運作。

self.addEventListener('install', (event) => {
  self.skipWaiting(); // 強制跳過等待，立即更新
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching essential assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // 立即取得控制權
});

self.addEventListener('fetch', (event) => {
  // 排除 API 請求，直接走網路
  if (
    event.request.url.includes('api.codetabs.com') || 
    event.request.url.includes('script.google.com') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // 優先回傳快取，沒有則發起網路請求
      return response || fetch(event.request).catch(() => {
        // 如果網路也失敗且是頁面請求，可以回傳快取中的 index.html
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
