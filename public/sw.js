/*
 * NBA Calculator service worker.
 *
 * What it caches: the anonymous /offline page and the static files it needs, plus fingerprinted build
 * assets, fonts and icons. What it never caches: page navigations, API routes, server actions, PDFs,
 * proof uploads, Supabase traffic and anything that is not a GET. Signed-in pages hold personal and
 * financial data and can go stale (a payment status changes), so they are fetched live or not at all;
 * offline, every navigation falls back to /offline, where the calculator works without a server.
 *
 * Bump VERSION to drop old caches on the next activation.
 */
const VERSION = "v1";
const CACHE = `nba-legal-fees-${VERSION}`;
const OFFLINE_URL = "/offline";
const PRECACHE = [
  OFFLINE_URL,
  "/nba-seal.png",
  "/fonts/material-icons.woff2",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/onboarding/onboarding-calculate.jpg",
  "/onboarding/onboarding-submit.jpg",
  "/onboarding/onboarding-certificate.jpg",
];

/** Same-origin static files that never change under the same URL. */
function isStaticAsset(url) {
  return url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/fonts/") || url.pathname.startsWith("/icons/") || url.pathname.startsWith("/onboarding/") || url.pathname === "/nba-seal.png";
}

/** The offline page's own scripts and styles, read from its HTML so they are cached with it. */
function assetsIn(html) {
  const found = new Set();
  for (const match of html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+)"/g)) found.add(match[1]);
  return [...found];
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(PRECACHE);
    const page = await cache.match(OFFLINE_URL);
    if (page) await cache.addAll(assetsIn(await page.text()));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith("nba-legal-fees-") && name !== CACHE).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    // Live or the offline page; a signed-in page is never stored.
    event.respondWith(fetch(request).catch(async () => (await caches.match(OFFLINE_URL)) ?? Response.error()));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) (await caches.open(CACHE)).put(request, response.clone());
      return response;
    })());
  }
  // Everything else (APIs, actions, PDFs, RSC payloads) goes to the network untouched.
});
