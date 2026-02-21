import { clientsClaim } from "workbox-core";
import { precacheAndRoute } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;

// Activate new SW immediately without waiting for old clients to close
self.skipWaiting();
clientsClaim();

// Precache static assets injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST);

// Push notification handler
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title ?? "Pickl", {
      body: data.body ?? "",
      icon: "/icons/icon-192.png",
      data: { url: data.url ?? "/" },
    }),
  );
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const client = clients.find((c) =>
          c.url.includes(self.location.origin),
        );
        if (client) {
          return client.focus();
        }
        return self.clients.openWindow(url);
      }),
  );
});
