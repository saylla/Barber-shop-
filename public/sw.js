// Service Worker for BarberFlow - Native Push Notifications & Background Alerts
const CACHE_NAME = 'barberflow-sw-v2';
const ICON_URL = 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=192&q=80';
const BADGE_URL = 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=96&q=80';

// Service Worker Installation
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Service Worker Activation & Client Claim
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clear older caches if needed
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
      // Claim all clients immediately so push notifications work on the initial session
      await self.clients.claim();
    })()
  );
});

// Handle incoming Web Push Events (Native Push API)
self.addEventListener('push', (event) => {
  let data = {
    title: '💈 BarberFlow Alerta',
    body: 'Você tem uma nova notificação de agendamento.',
    tag: 'barberflow-alert',
    icon: ICON_URL,
    badge: BADGE_URL,
    data: { url: '/' },
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch {
      data.body = event.data.text() || data.body;
    }
  }

  const defaultActions = [
    { action: 'open_my_bookings', title: '📋 Meus Agendamentos' },
    { action: 'dismiss', title: 'Fechar' },
  ];

  const notificationOptions = {
    body: data.body,
    icon: data.icon || ICON_URL,
    badge: data.badge || BADGE_URL,
    tag: data.tag || `bf-push-${Date.now()}`,
    renotify: true,
    requireInteraction: data.requireInteraction !== false,
    vibrate: data.vibrate || [200, 100, 200, 100, 250],
    data: data.data || { url: '/' },
    actions: data.actions || defaultActions,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, notificationOptions)
  );
});

// Handle Messages from Client Window / React Context / Background Timers
self.addEventListener('message', (event) => {
  if (!event.data) return;

  const { type, payload } = event.data;

  if (type === 'SHOW_NOTIFICATION' || type === 'TRIGGER_PUSH') {
    const title = payload.title || '💈 BarberFlow Notificação';
    const options = {
      body: payload.body || 'Atualização no seu agendamento de corte.',
      icon: payload.icon || ICON_URL,
      badge: payload.badge || BADGE_URL,
      tag: payload.tag || `bf-${Date.now()}`,
      renotify: true,
      requireInteraction: payload.requireInteraction !== false,
      vibrate: payload.vibrate || [200, 100, 200, 100, 300],
      data: payload.data || { url: '/' },
      actions: payload.actions || [
        { action: 'open_my_bookings', title: '📋 Meus Agendamentos' },
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

// Handle user clicking or interacting with the Push notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  if (action === 'dismiss') {
    return;
  }

  const notificationData = event.notification.data || {};
  let targetUrl = notificationData.url || '/';

  if (action === 'open_my_bookings') {
    targetUrl = '/?view=my-bookings';
  } else if (action === 'book_again') {
    targetUrl = '/?view=booking';
  } else if (action === 'open_schedule') {
    targetUrl = '/?view=admin&tab=schedule';
  }

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      // Find an existing client window to focus
      for (const client of clientList) {
        if ('focus' in client) {
          // Tell the client window to trigger the corresponding UI modal or view
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            action: action || 'open_notification_data',
            data: notificationData,
          });
          return client.focus();
        }
      }

      // If no window is open, open a new window with the destination URL
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })()
  );
});

// Handle notification close event
self.addEventListener('notificationclose', (event) => {
  // Notification dismissed by user
});

