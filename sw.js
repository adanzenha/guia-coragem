// Service Worker — Escada da Coragem PWA
const CACHE_NAME = 'escada-coragem-v1';
const ASSETS = [
  '/guia-coragem/Index.html',
  '/guia-coragem/manifest.json',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Quicksand:wght@400;500;600;700&display=swap'
];

// Instalar e cachear assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Ativar e limpar caches antigos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Interceptar requisições — cache first para assets, network first para Firebase
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Firebase e APIs — sempre da rede
  if (url.hostname.includes('firebase') || url.hostname.includes('google')) {
    return;
  }

  // Assets locais — cache first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});

// Notificações push
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  const options = {
    body: data.body || 'Nova atualização no guia!',
    icon: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f31f.png',
    badge: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f31f.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/guia-coragem/Index.html' },
    actions: [
      { action: 'open', title: '🌟 Abrir guia' },
      { action: 'close', title: 'Fechar' }
    ]
  };
  e.waitUntil(
    self.registration.showNotification(data.title || '🌟 Escada da Coragem', options)
  );
});

// Clique na notificação
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'open' || !e.action) {
    e.waitUntil(clients.openWindow(e.notification.data.url || '/guia-coragem/Index.html'));
  }
});
