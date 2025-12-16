
const CACHE = 'gmat-v3';
const ASSETS = [
  './', './index.html', './styles.css', './app.js', './bg.js',
  './data/content.json', 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
];

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))));
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));
