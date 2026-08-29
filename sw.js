/* Path — service worker.

   Two jobs, in this order of importance:

   1. The app must open with no network. It is one HTML file with everything
      inline, so "offline" is entirely a caching question — and a home-screen
      icon that shows an error page in a parking garage is not an app you trust
      with your money.

   2. An update must never cost you a version that works. index.html is served
      stale-while-revalidate: the cached copy answers immediately, and a fresh
      copy is fetched in the background and cached for next launch. So a paste
      to GitHub Pages lands on the SECOND open after it deploys, never
      mid-session, and a failed fetch changes nothing.

   Bump CACHE when you deploy if you want the old entries cleared out. You do
   not have to — the revalidate path updates the file in place either way.
   The version below is a label, not a trigger. */

const CACHE = "path-v1";
const PRECACHE = ["./", "./index.html", "./manifest.webmanifest", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  /* addAll fails the whole install if any one URL 404s, and the icon is the
     kind of thing that goes missing in a repo. Cache what is there and do not
     let a missing icon stop the app from working offline. */
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(PRECACHE.map(u => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  /* Anything off this origin — nothing should be, but a stray reference must
     not end up in the app's cache. */
  if (new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const hit = await cache.match(req, { ignoreSearch: true });
      const net = fetch(req)
        .then(res => { if (res && res.ok) cache.put(req, res.clone()); return res; })
        .catch(() => null);
      /* Cache first so a cold launch on a bad connection is instant, network
         only when there is nothing cached to answer with. */
      return hit || (await net) || new Response("Offline", { status: 503 });
    })
  );
});

/* The page asks for this after it has told the user an update is waiting. */
self.addEventListener("message", e => {
  if (e.data === "skip-waiting") self.skipWaiting();
});
