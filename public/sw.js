self.addEventListener('install', function(event) {
    event.waitUntil(caches.open('recipe_store').then(function(cache) {
        return cache.addAll([
            '/',
            'index.html',
            'assets/css/style.min.css',
            'assets/res/jquery.mobile-1.4.5/jquery.mobile-1.4.5.min.css',
            'assets/res/font-awesome-4.7.0/css/font-awesome.min.css',
            'assets/res/jquery/jquery.min.js',
            'assets/res/jquery.mobile-1.4.5/jquery.mobile-1.4.5.min.js',
            'assets/js/app.min.js',
            'assets/res/localforage.min.js'
        ]);
    }));
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
      caches.match(event.request).then(function(response) {
        return response || fetch(event.request);
    }));
});
