/* ==========================================
   Finder v3 - Service Worker
========================================== */

const CACHE_NAME = "finder-v3-cache-v1";

const STATIC_ASSETS = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./manifest.json",

    "./assets/icons/icon-72.png",
    "./assets/icons/icon-96.png",
    "./assets/icons/icon-128.png",
    "./assets/icons/icon-144.png",
    "./assets/icons/icon-152.png",
    "./assets/icons/icon-192.png",
    "./assets/icons/icon-384.png",
    "./assets/icons/icon-512.png",

    "./assets/weather/sunny.png"
];

/* ==========================================
   INSTALL
========================================== */

self.addEventListener("install", event => {

    event.waitUntil(

        caches.open(CACHE_NAME)

        .then(cache => {

            console.log("Caching App Files");

            return cache.addAll(STATIC_ASSETS);

        })

    );

    self.skipWaiting();

});

/* ==========================================
   ACTIVATE
========================================== */

self.addEventListener("activate", event => {

    event.waitUntil(

        caches.keys()

        .then(keys => {

            return Promise.all(

                keys.map(key => {

                    if (key !== CACHE_NAME) {

                        return caches.delete(key);

                    }

                })

            );

        })

    );

    self.clients.claim();

});

/* ==========================================
   FETCH
========================================== */

self.addEventListener("fetch", event => {

    if (event.request.method !== "GET") return;

    event.respondWith(

        caches.match(event.request)

        .then(cacheResponse => {

            if (cacheResponse) {

                return cacheResponse;

            }

            return fetch(event.request)

            .then(networkResponse => {

                if (

                    networkResponse &&
                    networkResponse.status === 200 &&
                    networkResponse.type === "basic"

                ) {

                    const responseClone = networkResponse.clone();

                    caches.open(CACHE_NAME)

                    .then(cache => {

                        cache.put(event.request, responseClone);

                    });

                }

                return networkResponse;

            })

            .catch(() => {

                if (event.request.mode === "navigate") {

                    return caches.match("./index.html");

                }

            });

        })

    );

});

/* ==========================================
   MESSAGE
========================================== */

self.addEventListener("message", event => {

    if (event.data === "skipWaiting") {

        self.skipWaiting();

    }

});

/* ==========================================
   PUSH (Future Ready)
========================================== */

self.addEventListener("push", event => {

    const data = event.data
        ? event.data.json()
        : {
            title: "Finder",
            body: "New Notification"
        };

    event.waitUntil(

        self.registration.showNotification(

            data.title,

            {
                body: data.body,
                icon: "./assets/icons/icon-192.png",
                badge: "./assets/icons/icon-192.png"
            }

        )

    );

});

/* ==========================================
   NOTIFICATION CLICK
========================================== */

self.addEventListener("notificationclick", event => {

    event.notification.close();

    event.waitUntil(

        clients.openWindow("./")

    );

});
