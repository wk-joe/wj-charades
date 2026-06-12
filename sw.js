const CACHE = 'charades-v1';
const PRECACHE = ['/', '/index.html', '/manifest.json', '/sw.js'];

function makeIcon(size) {
  const r = Math.floor(size * 0.18);
  const fs = Math.floor(size * 0.52);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#1a1a2e"/>
  <text x="${size / 2}" y="${Math.floor(size * 0.63)}"
        font-size="${fs}" font-family="Apple Color Emoji,Segoe UI Emoji,sans-serif"
        text-anchor="middle" fill="white">🎭</text>
</svg>`;
}

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const { pathname } = new URL(e.request.url);

  if (pathname === '/icon-192.png' || pathname === '/icon-512.png') {
    const size = pathname.includes('192') ? 192 : 512;
    e.respondWith(new Response(makeIcon(size), {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'max-age=86400' }
    }));
    return;
  }

  e.respondWith(
    caches.match(e.request).then(hit => {
      if (hit) return hit;
      return fetch(e.request).then(res => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('/index.html'));
    })
  );
});
