// Service Worker for BarberFlow - Push & Background Real-time Notifications
const CACHE_NAME = 'barberflow-sw-v1';
const ICON_URL = 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=192&q=80';
const BADGE_URL = 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=96&q=80';

// Service Worker Installation
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Service Worker Activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Claim all clients immediately so notifications work on initial visit
      await self.clients.claim();
    })()
  );
});

// Handle incoming Push Events (from Web Push servers or simulated triggers)
self.addEventListener('push', (event) => {
  let data = {
    title: 'BarberFlow Alerta',
    body: 'Você tem uma nova atualização na barbearia.',
    tag: 'barberflow-alert',
    data: { url: '/?view=admin' },
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text() || data.body;
    }
  }

  const notificationOptions = {
    body: data.body,
    icon: data.icon || ICON_URL,
    badge: data.badge || BADGE_URL,
    tag: data.tag || 'barberflow-notification',
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    data: data.data || { url: '/?view=admin' },
    actions: data.actions || [
      { action: 'open_schedule', title: '📅 Ver na Agenda' },
      { action: 'dismiss', title: 'Fechar' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, notificationOptions)
  );
});

// Handle Message from Client Window / Foreground / Background Tabs
self.addEventListener('message', (event) => {
  if (!event.data) return;

  const { type, payload } = event.data;

  if (type === 'SHOW_NOTIFICATION' || type === 'TRIGGER_PUSH') {
    const title = payload.title || 'BarberFlow Notificação';
    const options = {
      body: payload.body || 'Atualização na agenda.',
      icon: payload.icon || ICON_URL,
      badge: payload.badge || BADGE_URL,
      tag: payload.tag || `bf-${Date.now()}`,
      renotify: true,
      requireInteraction: payload.requireInteraction !== false,
      vibrate: payload.vibrate || [200, 100, 200],
      data: payload.data || { url: '/?view=admin' },
      actions: payload.actions || [
        { action: 'open_schedule', title: '📅 Ver na Agenda' },
        { action: 'dismiss', title: 'Fechar' },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }

  if (type === 'PING') {
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ status: 'PONG', version: CACHE_NAME });
    }
  }
});

// Handle user clicking on the notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  if (action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      // Find an existing client window to focus
      for (const client of clientList) {
        if ('focus' in client) {
          // Tell the client window to switch to the admin tab or open the specific appointment
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            action: action || 'open_schedule',
            data: event.notification.data,
          });
          return client.focus();
        }
      }

      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })()
  );
});

// Handle notification close event
self.addEventListener('notificationclose', (event) => {
  // Optional analytics or cleanup
});
