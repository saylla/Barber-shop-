import { soundService } from './soundService';
import { Appointment, AppointmentStatus } from '../types';
import { formatCurrency, formatDateBR } from './calendarUtils';

export type PushPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export interface PushNotificationPayload {
  title: string;
  body: string;
  tag?: string;
  icon?: string;
  badge?: string;
  data?: any;
  actions?: { action: string; title: string }[];
  playSound?: boolean;
  soundType?: 'booking' | 'status';
  vibrate?: number[];
  requireInteraction?: boolean;
}

class PushNotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private isInitialized = false;
  private broadcastChannel: BroadcastChannel | null = null;
  private clickListeners: Array<(action: string, data: any) => void> = [];

  constructor() {
    this.initBroadcastChannel();
  }

  private initBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('barberflow_realtime_events');
      } catch {
        this.broadcastChannel = null;
      }
    }
  }

  // Register the Service Worker
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      this.swRegistration = registration;
      this.isInitialized = true;

      // Listen for messages from the service worker (e.g. notification clicks)
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
          this.notifyClickListeners(event.data.action, event.data.data);
        }
      });

      return registration;
    } catch (err) {
      console.warn('Service Worker registration skipped or restricted in environment:', err);
      return null;
    }
  }

  // Check current permission state with real-time detection
  getPermissionStatus(): PushPermissionStatus {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    try {
      return Notification.permission as PushPermissionStatus;
    } catch {
      return 'default';
    }
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  // Request user permission for notifications
  async requestPermission(): Promise<PushPermissionStatus> {
    if (!this.isSupported()) {
      return 'unsupported';
    }

    try {
      if (typeof Notification.requestPermission === 'function') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          await this.registerServiceWorker();
        }
        return permission as PushPermissionStatus;
      }
      return this.getPermissionStatus();
    } catch (err) {
      console.warn('Notification permission request notice:', err);
      return this.getPermissionStatus();
    }
  }

  // Broadcast an event to other tabs/windows
  broadcastEvent(type: 'NEW_BOOKING' | 'STATUS_CHANGED' | 'SYNC_REQUEST', data: any) {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type, data, timestamp: Date.now() });
    }

    // Also trigger localStorage event fallback for cross-tab sync
    try {
      localStorage.setItem('barberflow_last_event', JSON.stringify({ type, data, timestamp: Date.now() }));
    } catch {}
  }

  // Listen to broadcasted events
  onBroadcastEvent(handler: (event: { type: string; data: any }) => void): () => void {
    if (this.broadcastChannel) {
      const listener = (event: MessageEvent) => {
        if (event.data && event.data.type) {
          handler(event.data);
        }
      };
      this.broadcastChannel.addEventListener('message', listener);

      return () => {
        this.broadcastChannel?.removeEventListener('message', listener);
      };
    }
    return () => {};
  }

  // Register listener for when user clicks on a notification
  onNotificationClick(callback: (action: string, data: any) => void): () => void {
    this.clickListeners.push(callback);
    return () => {
      this.clickListeners = this.clickListeners.filter((cb) => cb !== callback);
    };
  }

  private notifyClickListeners(action: string, data: any) {
    this.clickListeners.forEach((cb) => {
      try {
        cb(action, data);
      } catch (err) {
        console.error('Error in notification click callback:', err);
      }
    });
  }

  // Dispatch push notification
  async dispatchPushNotification(payload: PushNotificationPayload): Promise<boolean> {
    // 1. Always play sound chime if requested
    if (payload.playSound !== false) {
      if (payload.soundType === 'status') {
        soundService.playStatusChangeChime();
      } else {
        soundService.playNewBookingChime();
      }
    }

    // 2. Always vibrate mobile devices if supported and requested
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator && payload.vibrate) {
      try {
        navigator.vibrate(payload.vibrate);
      } catch {}
    }

    if (!this.isSupported()) {
      return false;
    }

    const permission = this.getPermissionStatus();
    if (permission !== 'granted') {
      return false;
    }

    const defaultIcon = 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=192&q=80';
    const defaultBadge = 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=96&q=80';

    const notificationOptions: NotificationOptions & Record<string, any> = {
      body: payload.body,
      icon: payload.icon || defaultIcon,
      badge: payload.badge || defaultBadge,
      tag: payload.tag || `bf-${Date.now()}`,
      renotify: true,
      requireInteraction: payload.requireInteraction !== false,
      data: payload.data || { url: '/?view=admin' },
      actions: payload.actions || [
        { action: 'open_schedule', title: '📅 Ver na Agenda' },
        { action: 'dismiss', title: 'Fechar' },
      ],
    };

    // 3. Try sending through Service Worker
    try {
      if (!this.swRegistration && 'serviceWorker' in navigator) {
        this.swRegistration = await navigator.serviceWorker.ready.catch(() => null);
      }

      if (this.swRegistration && 'showNotification' in this.swRegistration) {
        await this.swRegistration.showNotification(payload.title, notificationOptions);
        return true;
      }
    } catch (swErr) {
      console.warn('Service Worker notification show failed, falling back to window Notification:', swErr);
    }

    // 4. Fallback to standard Window Notification if SW is not ready
    try {
      const n = new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || defaultIcon,
        badge: payload.badge || defaultBadge,
        tag: payload.tag,
        data: payload.data,
      });

      n.onclick = () => {
        window.focus();
        this.notifyClickListeners('open_schedule', payload.data);
        n.close();
      };

      return true;
    } catch (winErr) {
      console.warn('Window notification fallback error:', winErr);
      return false;
    }
  }

  // Trigger alert for a new appointment
  async notifyNewAppointment(
    appointment: Appointment,
    serviceName: string,
    professionalName: string,
    options?: { playSound?: boolean; vibration?: boolean }
  ) {
    const formattedDate = formatDateBR(appointment.date);
    const title = `💈 Novo Agendamento: ${appointment.customerName}`;
    const body = `${serviceName} com ${professionalName}\n📅 ${formattedDate} às ${appointment.time} • ${formatCurrency(appointment.price)} • #${appointment.code}`;

    await this.dispatchPushNotification({
      title,
      body,
      tag: `new-booking-${appointment.id}`,
      soundType: 'booking',
      playSound: options?.playSound !== false,
      vibrate: options?.vibration !== false ? [200, 100, 200, 100, 300] : undefined,
      requireInteraction: true,
      data: {
        type: 'new_booking',
        appointmentId: appointment.id,
        code: appointment.code,
        url: '/?view=admin&tab=schedule',
      },
      actions: [
        { action: 'open_schedule', title: '📅 Ver Agenda' },
        { action: 'dismiss', title: 'Dispensar' },
      ],
    });
  }

  // Trigger alert for an appointment status change
  async notifyStatusChange(
    appointment: Appointment,
    status: AppointmentStatus,
    serviceName: string,
    notes?: string,
    options?: { playSound?: boolean }
  ) {
    const statusLabels: Record<AppointmentStatus, string> = {
      pending: 'Aguardando Aprovação',
      confirmed: 'Confirmado pelo Barbeiro',
      completed: 'Concluído (Baixa Realizada)',
      rescheduled: 'Reagendado',
      declined: 'Recusado',
      cancelled: 'Cancelado',
      no_show: 'Falta Registrada',
    };

    const statusIcons: Record<AppointmentStatus, string> = {
      pending: '⏳',
      confirmed: '✅',
      completed: '⭐',
      rescheduled: '🗓️',
      declined: '❌',
      cancelled: '🚫',
      no_show: '⚠️',
    };

    const label = statusLabels[status] || status;
    const icon = statusIcons[status] || '💈';

    const title = `${icon} Status: #${appointment.code} ${label}`;
    const body = `Cliente: ${appointment.customerName} • ${serviceName} às ${appointment.time}${
      notes ? `\nMotivo: ${notes}` : ''
    }`;

    await this.dispatchPushNotification({
      title,
      body,
      tag: `status-${appointment.id}-${status}`,
      soundType: 'status',
      playSound: options?.playSound !== false,
      vibrate: [150, 80, 150],
      requireInteraction: false,
      data: {
        type: 'status_change',
        appointmentId: appointment.id,
        status,
        code: appointment.code,
        url: '/?view=admin&tab=schedule',
      },
      actions: [
        { action: 'open_schedule', title: 'Abrir Agenda' },
        { action: 'dismiss', title: 'Fechar' },
      ],
    });
  }

  // Send a test notification
  async sendTestNotification(options?: { sound?: boolean; vibration?: boolean }): Promise<boolean> {
    return this.dispatchPushNotification({
      title: '💈 BarberFlow: Push Notification Ativo!',
      body: 'O Service Worker está operando em tempo real. Você receberá alertas mesmo com o painel em segundo plano.',
      tag: `test-${Date.now()}`,
      soundType: 'booking',
      playSound: options?.sound !== false,
      vibrate: options?.vibration !== false ? [200, 100, 200] : undefined,
      data: {
        type: 'test',
        url: '/?view=admin',
      },
      actions: [
        { action: 'open_schedule', title: 'Abrir Painel' },
        { action: 'dismiss', title: 'Fechar' },
      ],
    });
  }
}

export const pushNotificationService = new PushNotificationService();
