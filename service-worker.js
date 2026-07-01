/* ==========================================
   FINDER PWA
   service-worker.js
========================================== */

const CACHE_NAME = "finder-v1.0.0";

const STATIC_CACHE = [

    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./manifest.json",

    "./icons/icon-72.png",
    "./icons/icon-96.png",
    "./icons/icon-128.png",
    "./icons/icon-144.png",
    "./icons/icon-152.png",
    "./icons/icon-192.png",
    "./icons/icon-384.png",
    "./icons/icon-512.png"

];

/* INSTALL */

self.addEventListener("install", event => {

    console.log("Service Worker Installed");

    event.waitUntil(

        caches.open(CACHE_NAME)

        .then(cache => {

            return cache.addAll(STATIC_CACHE);

        })

    );

    self.skipWaiting();

});


/* ACTIVATE */

self.addEventListener("activate", event => {

    console.log("Service Worker Activated");

    event.waitUntil(

        caches.keys().then(keys => {

            return Promise.all(

                keys.map(key => {

                    if(key !== CACHE_NAME){

                        return caches.delete(key);

                    }

                })

            );

        })

    );

    self.clients.claim();

});


/* FETCH */

self.addEventListener("fetch", event => {

    event.respondWith(

        caches.match(event.request)

        .then(cacheResponse => {

            if(cacheResponse){

                return cacheResponse;

            }

            return fetch(event.request)

            .then(networkResponse => {

                return caches.open(CACHE_NAME)

                .then(cache => {

                    cache.put(

                        event.request,

                        networkResponse.clone()

                    );

                    return networkResponse;

                });

            })

            .catch(() => {

                return caches.match("./index.html");

            });

        })

    );

});


/* MESSAGE */

self.addEventListener("message", event => {

    if(event.data === "SKIP_WAITING"){

        self.skipWaiting();

    }

});


/* BACKGROUND SYNC */

self.addEventListener("sync", event => {

    console.log("Background Sync:",event.tag);

});


/* PUSH NOTIFICATION */

self.addEventListener("push", event => {

    let options = {

        body:"Finder Notification",

        icon:"icons/icon-192.png",

        badge:"icons/icon-192.png"

    };

    event.waitUntil(

        self.registration.showNotification(

            "Finder",

            options

        )

    );

});


/* NOTIFICATION CLICK */

self.addEventListener("notificationclick", event => {

    event.notification.close();

    event.waitUntil(

        clients.openWindow("./")

    );

});
