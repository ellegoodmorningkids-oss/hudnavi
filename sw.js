// HUDナビ用 Service Worker: 地図タイルとアプリ本体を保存し、電波が弱い場所でも使えるようにする
const TILES = 'hud-tiles-v1';
const APP = 'hud-app-v1';
const SHELL = [
  './hudnavi.html',
  'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js',
  'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css'
];
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(APP).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))));
});
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.hostname === 'cyberjapandata.gsi.go.jp') {
    e.respondWith(caches.open(TILES).then(async c => {
      const hit = await c.match(req.url);
      if (hit) return hit;
      try {
        const r = await fetch(req);
        if (r.ok) c.put(req.url, r.clone());
        return r;
      } catch (err) { return Response.error(); }
    }));
  } else if (u.origin === self.location.origin || u.hostname === 'unpkg.com') {
    e.respondWith(fetch(req).then(r => {
      if (r.ok) { const cp = r.clone(); caches.open(APP).then(c => c.put(req, cp)); }
      return r;
    }).catch(() => caches.match(req)));
  }
});
