const CACHE_NAME = "khedmati-cache-v3";
const ASSETS = [
  "/",
  "/index.html",
  "/favico.png",
  "/logo.png",
  "/cursor.svg"
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  // Only cache-handle same-origin GET requests; API calls and writes go
  // straight to the network.
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  // Navigations: network-first so new deployments reach users immediately,
  // falling back to the cached shell when offline.
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("/index.html", copy));
          return res;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Hashed build assets are immutable: cache-first, populate on first fetch.
  if (url.pathname.startsWith("/assets/")) {
    e.respondWith(
      caches.match(e.request).then(
        (cached) =>
          cached ||
          fetch(e.request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
            return res;
          })
      )
    );
    return;
  }

  // Everything else (icons, manifest, ...): network-first with cache fallback.
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// ── Web Push ──
// Display an incoming push. The payload is JSON sent by the server
// (server/utils/notify.js) and includes bilingual title/body plus a link.
self.addEventListener("push", (e) => {
  let data = {};
  try {
    data = e.data ? e.data.json() : {};
  } catch (err) {
    data = {};
  }
  // The app's default language is Arabic, so prefer Arabic text in the push.
  const title = data.titleAr || data.title || "خدمتي";
  const body = data.bodyAr || data.body || "";
  const options = {
    body: body,
    icon: "/logo.png",
    badge: "/favico.png",
    dir: "rtl",
    lang: "ar",
    data: { link: data.link || "/" },
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

// Focus an existing tab (or open a new one) when a notification is clicked.
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const link =
    (e.notification.data && e.notification.data.link) || "/";
  e.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus();
            if ("navigate" in client) {
              client.navigate(link);
            }
            return;
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(link);
        }
      })
  );
});
