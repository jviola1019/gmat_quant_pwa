const CACHE = 'gmat-pwa-v1';
const PRECACHE = [
  './','./index.html','./styles.css','./app.js','./manifest.json','./offline.html',
  './data/content.json','./icons/icon-192.png','./icons/icon-512.png'
];
self.addEventListener('install', (event) => {
  event.waitUntil((async ()=>{
    const cache = await caches.open(CACHE);
    await cache.addAll(PRECACHE);
    self.skipWaiting();
  })());
});
self.addEventListener('activate', (event) => {
  event.waitUntil((async ()=>{
    const keys = await caches.keys();
    await Promise.all(keys.map(k => k!==CACHE ? caches.delete(k) : Promise.resolve()));
    self.clients.claim();
  })());
});
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith((async ()=>{
      try{
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put(req, fresh.clone());
        return fresh;
      }catch{
        const cached = await caches.match(req);
        return cached || caches.match('./offline.html');
      }
    })());
    return;
  }

  if (url.pathname.endsWith('.json')) {
    event.respondWith((async ()=>{
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      const fetchPromise = fetch(req).then(res=>{
        cache.put(req, res.clone());
        return res;
      }).catch(()=>cached);
      return cached || fetchPromise;
    })());
    return;
  }

  event.respondWith((async ()=>{
    const cached = await caches.match(req);
    if(cached) return cached;
    try{
      const res = await fetch(req);
      const cache = await caches.open(CACHE);
      cache.put(req, res.clone());
      return res;
    }catch{
      return caches.match('./offline.html');
    }
  })());
});
