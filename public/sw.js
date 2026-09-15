const CACHE = "twiswua-arcade-v1";
const PAGES = ["/", "/survival", "/runner", "/flappy", "/eggswiper"];
const OFFLINE = "/offline.html";

async function cachePage(cache, path, response) {
  response ??= await fetch(path, { cache: "reload" });
  if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) {
    throw new Error("Page unavailable");
  }
  const html = await response.clone().text();
  const assets = [...new Set([...html.matchAll(/(?:src|href)="([^" ]+)"/g)]
    .map((match) => new URL(match[1].replaceAll("&amp;", "&"), self.location.origin))
    .filter((url) => url.origin === self.location.origin && url.pathname.startsWith("/_next/static/"))
    .map((url) => url.href))];
  await Promise.all(assets.map(async (url) => {
    if (!(await cache.match(url))) await cache.add(url);
  }));
  await cache.put(path, response);
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll([OFFLINE, "/manifest.webmanifest", "/pwa-icons/192", "/pwa-icons/512", "/pwa-icons/maskable", "/apple-icon"]);
    await Promise.all(PAGES.map((path) => cachePage(cache, path)));
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("twiswua-arcade-") && key !== CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch(request);
        if (response.ok && PAGES.includes(url.pathname)) {
          event.waitUntil(cachePage(cache, url.pathname, response.clone()).catch(() => {}));
        }
        if (response.status >= 500) throw new Error("Page unavailable");
        return response;
      } catch {
        return await cache.match(url.pathname) || await cache.match(OFFLINE) || Response.error();
      }
    })());
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/pwa-icons/") || url.pathname === "/apple-icon") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) event.waitUntil(cache.put(request, response.clone()).catch(() => {}));
      return response;
    })());
  }
});
