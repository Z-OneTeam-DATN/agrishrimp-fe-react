self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "AgriShrimp", body: event.data.text(), url: "/" };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "AgriShrimp", {
      body: data.body || "",
      icon: "/images/logo_arishrimp.jpg",
      badge: "/images/logo_arishrimp.jpg",
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        return clients.openWindow(url);
      })
  );
});
