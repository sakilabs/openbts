import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";

declare let self: ServiceWorkerGlobalScope & typeof globalThis;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") void self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

type PushPayload = {
  title?: string;
  metadata?: { station_id?: string; reviewer_note?: string; submitter_name?: string; submission_type?: string };
  actionUrl?: string;
};

self.addEventListener("push", (event) => {
  let data: PushPayload = {};
  try {
    data = ((event as PushEvent).data?.json() as PushPayload) ?? {};
  } catch {
    data = { title: (event as PushEvent).data?.text() ?? "OpenBTS" };
  }

  const lines: string[] = [];
  if (data.metadata?.submitter_name) lines.push(`By ${data.metadata.submitter_name}`);
  if (data.metadata?.station_id) lines.push(`Station: ${data.metadata.station_id}`);
  if (data.metadata?.reviewer_note) lines.push(data.metadata.reviewer_note);

  (event as ExtendableEvent).waitUntil(
    self.registration.showNotification(data.title ?? "OpenBTS", {
      body: lines.join("\n") || undefined,
      icon: "/pwa-192x192.png",
      data: { actionUrl: data.actionUrl },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  const evt = event as NotificationEvent;
  evt.notification.close();
  const url: string = (evt.notification.data as { actionUrl?: string })?.actionUrl ?? "/";
  evt.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.location.origin));
      if (existing) return existing.focus().then(() => existing.navigate(url));
      return self.clients.openWindow(url);
    }),
  );
});
