const V = 'bolzham-v9';
const CORE = ['./', './index.html', './manifest.webmanifest',
              './icon-192.png', './icon-512.png', './icon-maskable.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ESPN сұраныстары кэштелмейді — әрқашан желіден
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (u.hostname.indexOf('espn.com') > -1) return;

  // network-first: жаңарту өзінен-өзі жетеді
  e.respondWith(
    fetch(e.request).then(r => {
      if (r && r.status === 200 && u.origin === location.origin) {
        const cp = r.clone();
        caches.open(V).then(c => c.put(e.request, cp));
      }
      return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});

self.addEventListener('message', e => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });
