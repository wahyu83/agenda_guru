// Handler Web Push untuk PWA Agenda Guru.
// File ini diimpor oleh service worker yang digenerate vite-plugin-pwa
// melalui opsi workbox.importScripts.

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Jadwal Mengajar';
  const options = {
    body: data.body || '',
    icon: 'icon.png',
    badge: 'icon.png',
    tag: data.tag || 'jadwal-mengajar',
    renotify: true,
    data: { url: data.url || '/guru/jadwal' }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/guru/jadwal';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) client.navigate(targetUrl);
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
