const CACHE_NAME = 'ivy-vocab-v3'; // 修改版本號強制刷新
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 安裝時強制跳過等待
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

// 激活時清除舊快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
        })
      );
    })
  );
  return self.clients.claim();
});

// 核心修復：網路優先策略
self.addEventListener('fetch', (event) => {
  // 排除外部 API (代理與 Google Script)
  if (event.request.url.includes('api.codetabs.com') || event.request.url.includes('script.google.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 如果網路正常，順便更新快取 (僅限 GET)
        if (response.ok && event.request.method === 'GET') {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, resClone);
          });
        }
        return response;
      })
      .catch(() => {
        // 網路斷線時，回傳快取的內容
        return caches.match(event.request).then((res) => {
          if (res) return res;
          // 如果連快取都沒有，至少回傳 index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
