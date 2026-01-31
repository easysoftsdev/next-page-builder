// Placeholder service worker to avoid 404s if Firebase Messaging is registered.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => self.clients.claim());
