// Caboodle's offline helper: keeps the app's pages and files so it opens with no signal.
// Your trips themselves live in the browser's storage, so they're there offline too.

const CACHE = "caboodle-v1";
const PAGES = ["/", "/new", "/trip", "/import"];
const FILES = ["/manifest.webmanifest", "/icon-192.png", "/icon-512.png", "/apple-icon.png"];

async function cachePageAndAssets(cache, path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) return;
  const html = await res.clone().text();
  await cache.put(path, res);
  const assets = new Set(html.match(/\/_next\/static\/[^"'\s)]+/g) || []);
  await Promise.all([...assets].map((url) => cache.add(url).catch(() => {})));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await Promise.all([...PAGES.map((p) => cachePageAndAssets(cache, p).catch(() => {})), cache.addAll(FILES).catch(() => {})]);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  // Pages: try the network first so you get updates, fall back to the saved copy.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        try {
          const res = await fetch(req);
          if (res.ok && PAGES.includes(url.pathname)) cache.put(url.pathname, res.clone());
          return res;
        } catch {
          return (await cache.match(url.pathname)) || (await cache.match("/")) || Response.error();
        }
      })(),
    );
    return;
  }

  // App code, fonts and icons: these never change under the same name, so the saved copy is fine.
  if (url.pathname.startsWith("/_next/static/") || FILES.includes(url.pathname)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      })(),
    );
  }
});
