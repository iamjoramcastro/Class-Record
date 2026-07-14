/* Three-Term E-Class Record — service worker
   AUTO-UPDATE CONTRACT
   --------------------
   Bump APP_VERSION on every deploy. Everything else is automatic:
     • the cache name is derived from it, so old caches are purged on activate
     • clients are told to reload as soon as the new worker takes control
     • version.json + index.html are always fetched from the network
*/
const APP_VERSION = "2026.07.15-1";
const CACHE = "ecr-shell-" + APP_VERSION;

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/eClassRecord192.png",
  "./icons/eClassRecord512.png",
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js",
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-database-compat.js",
  "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"
];

// Install: pre-cache the shell, then take over immediately.
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(ASSETS.map(a => c.add(a).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

// Activate: drop every cache that isn't the current version, claim all tabs,
// then tell each one a new version is live so it can reload itself.
self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    clients.forEach(c => c.postMessage({ type: "VERSION_ACTIVE", version: APP_VERSION }));
  })());
});

self.addEventListener("message", e => {
  const d = e.data || {};
  if (d.type === "SKIP_WAITING") self.skipWaiting();
  if (d.type === "GET_VERSION" && e.source) {
    e.source.postMessage({ type: "VERSION", version: APP_VERSION });
  }
  // Nuke every cache on demand (used by the in-app "Force update" action).
  if (d.type === "PURGE") {
    e.waitUntil(
      caches.keys()
        .then(ks => Promise.all(ks.map(k => caches.delete(k))))
        .then(() => e.source && e.source.postMessage({ type: "PURGED" }))
    );
  }
});

function isHTML(req, u) {
  return req.mode === "navigate" || req.destination === "document" ||
         u.pathname.endsWith("/") || u.pathname.endsWith(".html");
}
// Files that must never be served stale, or the app can't discover updates.
function isVersionCritical(u) {
  return u.pathname.endsWith("version.json") || u.pathname.endsWith("sw.js");
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const u = new URL(req.url);

  // Never touch live backend / auth traffic.
  if (u.hostname.endsWith("firebaseio.com") || u.hostname.endsWith("firebasedatabase.app") ||
      u.hostname.endsWith("googleapis.com") || u.pathname.includes("__/auth")) return;

  // Always network for the update heartbeat and the worker itself.
  if (isVersionCritical(u)) {
    e.respondWith(fetch(req, { cache: "no-store" }).catch(() => caches.match(req)));
    return;
  }

  // HTML: network-first so a new build is picked up the moment it's online.
  if (isHTML(req, u)) {
    e.respondWith((async () => {
      try {
        const res = await fetch(req, { cache: "no-store" });
        if (res && res.ok) {
          const cp = res.clone();
          caches.open(CACHE).then(c => c.put(req, cp));
        }
        return res;
      } catch (_) {
        return (await caches.match(req)) ||
               (await caches.match("./index.html")) ||
               (await caches.match("./"));
      }
    })());
    return;
  }

  // Everything else: serve cached copy fast, refresh it in the background.
  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if (res && res.ok) {
          const cp = res.clone();
          caches.open(CACHE).then(c => c.put(req, cp));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
