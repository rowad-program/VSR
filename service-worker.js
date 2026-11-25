const CACHE = 'tanzeem-v2';
// الملفات الأساسية: لا يكتمل التثبيت بدونها.
const CORE = ['./', './index.html', './manifest.webmanifest'];
// الأيقونات: تُحفظ كل واحدة على حدة، فلا يتعطل التثبيت إن غاب أحدها.
const OPTIONAL = ['./icon-180.png', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(CORE).then(() => Promise.allSettled(OPTIONAL.map(u => c.add(u)))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// الشبكة أولاً (تصل التحديثات فوراً)، وعند انقطاع الاتصال تُستخدم النسخة المحفوظة.
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(
    fetch(r, { cache: 'no-cache' })
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); }
        return res;
      })
      .catch(() => caches.match(r).then(m => m || caches.match('./index.html')))
  );
});
