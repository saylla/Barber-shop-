import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  ADMIN_USER,
  INITIAL_BLOCKED_TIMES,
  INITIAL_BUSINESS_HOURS,
  INITIAL_CUSTOMERS,
  INITIAL_PROFESSIONALS,
  INITIAL_REVIEWS,
  INITIAL_SERVICES,
  INITIAL_SETTINGS,
  getInitialAppointments
} from '../data/initialData';
import {
  Appointment,
  AppointmentHistoryEntry,
  AppointmentStatus,
  BlockedTime,
  BusinessHours,
  Customer,
  MessageTemplateType,
  Professional,
  ProfessionalLiveState,
  Review,
  SentMessageLog,
  Service,
  ShopSettings,
  UserAccount
} from '../types';
import {
  calculateProfessionalLiveState,
  getTodayDateString,
  intervalsOverlap,
  timeToMinutes
} from '../utils/calendarUtils';
import { dispatchAppointmentEmail } from '../utils/emailService';
import { pushNotificationService, PushPermissionStatus } from '../utils/pushNotificationService';

interface ToastInfo {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  services: Service[];
  professionals: Professional[];
  appointments: Appointment[];
  customers: Customer[];
  businessHours: BusinessHours;
  blockedTimes: BlockedTime[];
  settings: ShopSettings;
  reviews: Review[];
  currentUser: UserAccount | null;
  isAdminAuthenticated: boolean;
  activeView: 'client' | 'admin' | 'my_bookings';
  selectedServiceForBooking: Service | null;
  isBookingModalOpen: boolean;
  isSocialLoginModalOpen: boolean;
  toasts: ToastInfo[];

  // Push Notifications & Service Worker
  pushPermissionStatus: PushPermissionStatus;
  isPushSupported: boolean;
  requestPushPermission: () => Promise<PushPermissionStatus>;
  sendTestPushNotification: () => Promise<boolean>;

  // 30s Real-time Overview & Live Statuses
  professionalLiveStates: Record<string, ProfessionalLiveState>;
  lastSyncTimestamp: number;
  refreshCountdown: number;
  refreshDashboardData: () => void;
  dispatchEmailToCustomer: (appt: Appointment, customEmail?: string) => Promise<{ success: boolean; message: string; previewUrl?: string | false }>;

  // Modals for admin & notifications
  isMessageModalOpen: boolean;
  selectedApptForMessage: Appointment | null;
  messageModalInitialTemplate: MessageTemplateType;
  rejectionReasonForMessage?: string;
  isEmailModalOpen: boolean;
  selectedApptForEmail: Appointment | null;
  isRescheduleModalOpen: boolean;
  selectedApptForReschedule: Appointment | null;
  isDeclineModalOpen: boolean;
  selectedApptForDecline: Appointment | null;

  // Navigation & modals
  setActiveView: (view: 'client' | 'admin' | 'my_bookings') => void;
  openBookingModal: (service?: Service) => void;
  closeBookingModal: () => void;
  openSocialLoginModal: () => void;
  closeSocialLoginModal: () => void;
  openMessageModal: (appt: Appointment, template?: MessageTemplateType, rejectionReason?: string) => void;
  closeMessageModal: () => void;
  openEmailModal: (appt: Appointment) => void;
  closeEmailModal: () => void;
  openRescheduleModal: (appt: Appointment) => void;
  closeRescheduleModal: () => void;
  openDeclineModal: (appt: Appointment) => void;
  closeDeclineModal: () => void;

  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;

  // Appointment operations
  createAppointment: (data: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    serviceId: string;
    professionalId: string;
    date: string;
    time: string;
    durationMinutes: number;
    price: number;
    notes?: string;
  }) => { success: boolean; appointment?: Appointment; error?: string };
  
  acceptAppointment: (id: string, notifyClient?: boolean) => void;
  declineAppointment: (id: string, reason: string, notifyClient?: boolean) => void;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  rescheduleAppointment: (
    id: string,
    newDate: string,
    newTime: string,
    newProfId?: string,
    notifyClient?: boolean
  ) => boolean;
  cancelAppointment: (id: string) => boolean;
  sendCustomerMessage: (appointmentId: string, channel: 'whatsapp' | 'email' | 'sms', content: string) => void;
  sendEmailNotification: (appointmentId: string, email: string) => void;

  // Services CRUD
  createService: (service: Omit<Service, 'id'>) => void;
  updateService: (service: Service) => void;
  deleteService: (id: string) => void;

  // Professionals CRUD
  createProfessional: (prof: Omit<Professional, 'id'>) => void;
  updateProfessional: (prof: Professional) => void;
  deleteProfessional: (id: string) => void;

  // Hours & Blocks
  updateBusinessHours: (hours: BusinessHours) => void;
  addBlockedTime: (block: Omit<BlockedTime, 'id'>) => void;
  removeBlockedTime: (id: string) => void;

  // Settings & Customer CRUD
  updateSettings: (settings: ShopSettings) => void;
  updateCustomerNotes: (id: string, notes: string) => void;

  // Auth & Session
  loginWithGoogle: (role?: 'customer' | 'admin') => UserAccount;
  loginWithFacebook: (role?: 'customer' | 'admin') => UserAccount;
  loginWithDirect: (name: string, email: string, phone: string) => UserAccount;
  loginAdminWithPassword: (password: string) => boolean;
  logout: () => void;
  resetToDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  SERVICES: 'barberflow_services_v1',
  PROFESSIONALS: 'barberflow_professionals_v1',
  APPOINTMENTS: 'barberflow_appointments_v1',
  CUSTOMERS: 'barberflow_customers_v1',
  BUSINESS_HOURS: 'barberflow_hours_v1',
  BLOCKED_TIMES: 'barberflow_blocked_v1',
  SETTINGS: 'barberflow_settings_v1',
  USER: 'barberflow_current_user_v1',
  IS_ADMIN: 'barberflow_is_admin_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial from localStorage or fallbacks
  const [services, setServices] = useState<Service[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SERVICES);
    if (!saved) return INITIAL_SERVICES;
    try {
      const parsed: Service[] = JSON.parse(saved);
      // Ensure typo/naming and image correction
      return parsed.map((s) => {
        if (s.id === 'srv-6' || s.name.toLowerCase().includes('pezinho') || s.name.toLowerCase().includes('acabanento')) {
          const isBrokenImage = !s.image || s.image.includes('photo-1517832606589-7629c3397143');
          return {
            ...s,
            name: 'Acabamento e Pezinho',
            image: isBrokenImage
              ? 'https://images.unsplash.com/photo-1593702288056-7927b442d0fa?auto=format&fit=crop&w=600&q=80'
              : s.image,
            description: s.description || 'Alinhamento preciso do contorno do cabelo e nuca com navalhete descartável e loção calmante, ideal para manter o visual alinhado entre cortes.',
          };
        }
        return s;
      });
    } catch {
      return INITIAL_SERVICES;
    }
  });

  const [professionals, setProfessionals] = useState<Professional[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFESSIONALS);
    return saved ? JSON.parse(saved) : INITIAL_PROFESSIONALS;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    return saved ? JSON.parse(saved) : getInitialAppointments();
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [businessHours, setBusinessHours] = useState<BusinessHours>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BUSINESS_HOURS);
    return saved ? JSON.parse(saved) : INITIAL_BUSINESS_HOURS;
  });

  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BLOCKED_TIMES);
    return saved ? JSON.parse(saved) : INITIAL_BLOCKED_TIMES;
  });

  const [settings, setSettings] = useState<ShopSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [reviews] = useState<Review[]>(INITIAL_REVIEWS);

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    return saved ? JSON.parse(saved) : null;
  });

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.IS_ADMIN);
    return saved === 'true';
  });

  const [activeView, setActiveView] = useState<'client' | 'admin' | 'my_bookings'>('client');
  const [selectedServiceForBooking, setSelectedServiceForBooking] = useState<Service | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isSocialLoginModalOpen, setIsSocialLoginModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  // Admin & Notification Modals
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [selectedApptForMessage, setSelectedApptForMessage] = useState<Appointment | null>(null);
  const [messageModalInitialTemplate, setMessageModalInitialTemplate] = useState<MessageTemplateType>('confirmation');
  const [rejectionReasonForMessage, setRejectionReasonForMessage] = useState<string | undefined>(undefined);

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedApptForEmail, setSelectedApptForEmail] = useState<Appointment | null>(null);

  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedApptForReschedule, setSelectedApptForReschedule] = useState<Appointment | null>(null);

  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const [selectedApptForDecline, setSelectedApptForDecline] = useState<Appointment | null>(null);

  // Push Notifications (Service Worker) State & Permissions
  const [pushPermissionStatus, setPushPermissionStatus] = useState<PushPermissionStatus>(() =>
    pushNotificationService.getPermissionStatus()
  );
  const isPushSupported = pushNotificationService.isSupported();

  // Initialize Service Worker & Push Notification Listeners
  useEffect(() => {
    // 1. Register Service Worker
    pushNotificationService.registerServiceWorker().then(() => {
      setPushPermissionStatus(pushNotificationService.getPermissionStatus());
    });

    // 2. Handle push notification clicks (when user clicks on desktop/mobile alert)
    const unsubClick = pushNotificationService.onNotificationClick((action, data) => {
      setActiveView('admin');
      if (data?.code) {
        showToast(`Notificação Push: Acessando agendamento #${data.code}`, 'info');
      }
    });

    // 3. Handle real-time broadcast events from other tabs / background workers
    const unsubBroadcast = pushNotificationService.onBroadcastEvent((event) => {
      if (event.type === 'NEW_BOOKING' && event.data?.appointment) {
        const newAppt = event.data.appointment;
        setAppointments((prev) => {
          if (prev.some((a) => a.id === newAppt.id)) return prev;
          return [newAppt, ...prev];
        });

        // Trigger local notification if in background or tab active
        if (settings.pushNotificationsEnabled !== false && settings.notifyNewBookings !== false) {
          pushNotificationService.notifyNewAppointment(
            newAppt,
            event.data.serviceName || 'Serviço',
            event.data.professionalName || 'Barbeiro',
            {
              playSound: settings.playNotificationSound !== false,
              vibration: settings.vibrationEnabled !== false,
            }
          );
        }
      } else if (event.type === 'STATUS_CHANGED' && event.data?.appointmentId) {
        const { appointmentId, status } = event.data;
        setAppointments((prev) =>
          prev.map((a) => (a.id === appointmentId ? { ...a, status } : a))
        );
      }
    });

    // 4. Fallback storage listener for cross-tab multi-window synchronicity
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.APPOINTMENTS && e.newValue) {
        try {
          const parsed: Appointment[] = JSON.parse(e.newValue);
          setAppointments(parsed);
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      unsubClick();
      unsubBroadcast();
      window.removeEventListener('storage', handleStorage);
    };
  }, [settings]);

  // Request browser push permission
  const requestPushPermission = async (): Promise<PushPermissionStatus> => {
    const status = await pushNotificationService.requestPermission();
    setPushPermissionStatus(status);
    if (status === 'granted') {
      showToast('Notificações Push ativadas com sucesso! Você receberá alertas em tempo real.', 'success');
    } else if (status === 'denied') {
      showToast('Notificações nativas limitadas pelo navegador. Alertas sonoros e visuais do sistema estão ativos!', 'info');
    } else {
      showToast('Permissão de notificações verificada.', 'info');
    }
    return status;
  };

  // Send a test push notification
  const sendTestPushNotification = async (): Promise<boolean> => {
    let current = pushNotificationService.getPermissionStatus();
    if (current !== 'granted') {
      try {
        const requested = await pushNotificationService.requestPermission();
        current = requested;
        setPushPermissionStatus(requested);
      } catch {}
    }
    const nativeSuccess = await pushNotificationService.sendTestNotification({
      sound: settings.playNotificationSound !== false,
      vibration: settings.vibrationEnabled !== false,
    });
    if (nativeSuccess) {
      showToast('Notificação Push nativa disparada com sucesso!', 'success');
    } else {
      showToast('🔔 Alerta sonoro (chime) e visual disparado com sucesso no sistema!', 'success');
    }
    return true;
  };

  // 30-Second Real-Time Auto-Refresh & Synchronization Engine
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number>(Date.now());
  const [refreshCountdown, setRefreshCountdown] = useState<number>(30);

  // Manual or programmatic refresh trigger
  const refreshDashboardData = () => {
    setLastSyncTimestamp(Date.now());
    setRefreshCountdown(30);

    const now = new Date();
    const todayStr = getTodayDateString();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Check if there are any updated appointments in localStorage (e.g. from client tabs or external bookings)
    let baseList = appointments;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          baseList = parsed;
        }
      }
    } catch {}

    // Check customers sync
    try {
      const savedCust = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      if (savedCust) {
        const parsedCust = JSON.parse(savedCust);
        if (Array.isArray(parsedCust) && parsedCust.length > 0) {
          setCustomers(parsedCust);
        }
      }
    } catch {}

    // Auto-progress appointments that have ended to "completed" status
    let autoCompletedCount = 0;
    const updated = baseList.map((appt) => {
      if (
        appt.date === todayStr &&
        (appt.status === 'confirmed' || appt.status === 'rescheduled')
      ) {
        const startMin = timeToMinutes(appt.time);
        const endMin = startMin + appt.durationMinutes;
        // When 5+ minutes past service duration, mark as completed
        if (currentMinutes >= endMin + 5) {
          autoCompletedCount++;
          const historyEntry: AppointmentHistoryEntry = {
            timestamp: new Date().toISOString(),
            action: 'completed',
            description: 'Atendimento concluído com sucesso (sincronização automática em tempo real)',
            performedBy: 'Sistema BarberFlow',
          };
          return {
            ...appt,
            status: 'completed' as const,
            history: [...(appt.history || []), historyEntry],
          };
        }
      }
      return appt;
    });

    setAppointments(updated);
  };

  // Cross-tab synchronization via Storage Event
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.APPOINTMENTS && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setAppointments(parsed);
            setLastSyncTimestamp(Date.now());
          }
        } catch {}
      }
      if (e.key === STORAGE_KEYS.CUSTOMERS && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setCustomers(parsed);
          }
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 1-second interval loop for live 30s countdown and auto-refresh execution
  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          refreshDashboardData();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Dynamic Real-time Professional States
  const professionalLiveStates = professionals.reduce<Record<string, ProfessionalLiveState>>((acc, prof) => {
    acc[prof.id] = calculateProfessionalLiveState({
      professional: prof,
      appointments,
    });
    return acc;
  }, {});

  // Sync state changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFESSIONALS, JSON.stringify(professionals));
  }, [professionals]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BUSINESS_HOURS, JSON.stringify(businessHours));
  }, [businessHours]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BLOCKED_TIMES, JSON.stringify(blockedTimes));
  }, [blockedTimes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.IS_ADMIN, isAdminAuthenticated ? 'true' : 'false');
  }, [isAdminAuthenticated]);

  // Toast helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const openBookingModal = (service?: Service) => {
    if (service) {
      setSelectedServiceForBooking(service);
    }
    setIsBookingModalOpen(true);
  };

  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
  };

  const openSocialLoginModal = () => setIsSocialLoginModalOpen(true);
  const closeSocialLoginModal = () => setIsSocialLoginModalOpen(false);

  // Modal open / close handlers
  const openMessageModal = (
    appt: Appointment,
    template: MessageTemplateType = 'confirmation',
    rejectionReason?: string
  ) => {
    setSelectedApptForMessage(appt);
    setMessageModalInitialTemplate(template);
    setRejectionReasonForMessage(rejectionReason);
    setIsMessageModalOpen(true);
  };

  const closeMessageModal = () => {
    setIsMessageModalOpen(false);
    setSelectedApptForMessage(null);
    setRejectionReasonForMessage(undefined);
  };

  const openEmailModal = (appt: Appointment) => {
    setSelectedApptForEmail(appt);
    setIsEmailModalOpen(true);
  };

  const closeEmailModal = () => {
    setIsEmailModalOpen(false);
    setSelectedApptForEmail(null);
  };

  const openRescheduleModal = (appt: Appointment) => {
    setSelectedApptForReschedule(appt);
    setIsRescheduleModalOpen(true);
  };

  const closeRescheduleModal = () => {
    setIsRescheduleModalOpen(false);
    setSelectedApptForReschedule(null);
  };

  const openDeclineModal = (appt: Appointment) => {
    setSelectedApptForDecline(appt);
    setIsDeclineModalOpen(true);
  };

  const closeDeclineModal = () => {
    setIsDeclineModalOpen(false);
    setSelectedApptForDecline(null);
  };

  /**
   * Safe server-grade conflict checking & creation
   */
  const createAppointment = (data: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    serviceId: string;
    professionalId: string;
    date: string;
    time: string;
    durationMinutes: number;
    price: number;
    notes?: string;
  }): { success: boolean; appointment?: Appointment; error?: string } => {
    const reqStart = timeToMinutes(data.time);
    const reqEnd = reqStart + data.durationMinutes;

    // 1. Conflict check against existing active appointments
    const hasConflict = appointments.some((existing) => {
      if (existing.date !== data.date) return false;
      if (existing.professionalId !== data.professionalId) return false;
      if (existing.status === 'cancelled' || existing.status === 'declined') return false;

      const existStart = timeToMinutes(existing.time);
      const existEnd = existStart + existing.durationMinutes;
      return intervalsOverlap(reqStart, reqEnd, existStart, existEnd);
    });

    if (hasConflict) {
      showToast('Desculpe, este horário acabou de ser reservado por outro cliente.', 'error');
      return { success: false, error: 'Horário indisponível ou já reservado.' };
    }

    // 2. Conflict check against blocked times
    const hasBlock = blockedTimes.some((blk) => {
      if (blk.date !== data.date) return false;
      if (blk.professionalId !== 'all' && blk.professionalId !== data.professionalId) return false;
      const blkStart = timeToMinutes(blk.startTime);
      const blkEnd = timeToMinutes(blk.endTime);
      return intervalsOverlap(reqStart, reqEnd, blkStart, blkEnd);
    });

    if (hasBlock) {
      showToast('O profissional está com este horário bloqueado.', 'error');
      return { success: false, error: 'Horário bloqueado no sistema.' };
    }

    // Generate unique code e.g. BF-4891
    const code = `BF-${Math.floor(1000 + Math.random() * 9000)}`;
    const initialStatus: AppointmentStatus = settings.autoConfirm ? 'confirmed' : 'pending';

    const historyEntry: AppointmentHistoryEntry = {
      timestamp: new Date().toISOString(),
      action: 'created',
      description: settings.autoConfirm
        ? 'Agendamento criado e confirmado automaticamente'
        : 'Agendamento criado online aguardando aprovação do barbeiro',
      performedBy: `Cliente (${currentUser?.name || data.customerName})`,
    };

    const newAppointment: Appointment = {
      id: `appt-${Date.now()}`,
      code,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail || '',
      serviceId: data.serviceId,
      professionalId: data.professionalId,
      date: data.date,
      time: data.time,
      durationMinutes: data.durationMinutes,
      price: data.price,
      status: initialStatus,
      createdAt: new Date().toISOString(),
      notes: data.notes || '',
      authProvider: currentUser?.provider || 'direct',
      emailNotificationSent: settings.sendEmailOnBooking !== false,
      whatsappNotificationSent: false,
      history: [historyEntry],
    };

    setAppointments((prev) => [newAppointment, ...prev]);

    // Upsert or update Customer CRM record
    setCustomers((prev) => {
      const cleanPhone = data.customerPhone.replace(/\D/g, '');
      const existingIdx = prev.findIndex((c) => c.phone.replace(/\D/g, '') === cleanPhone);

      if (existingIdx >= 0) {
        const updated = [...prev];
        const currentCust = updated[existingIdx];
        updated[existingIdx] = {
          ...currentCust,
          name: data.customerName,
          email: data.customerEmail || currentCust.email,
          totalAppointments: currentCust.totalAppointments + 1,
          totalSpent: currentCust.totalSpent + data.price,
          lastVisit: data.date,
        };
        return updated;
      } else {
        const newCustomer: Customer = {
          id: `cust-${Date.now()}`,
          name: data.customerName,
          phone: data.customerPhone,
          email: data.customerEmail || '',
          avatar: currentUser?.avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80`,
          totalAppointments: 1,
          totalSpent: data.price,
          lastVisit: data.date,
          joinedAt: data.date,
          provider: currentUser?.provider || 'direct',
        };
        return [newCustomer, ...prev];
      }
    });

    const svc = services.find((s) => s.id === data.serviceId);
    const prof = professionals.find((p) => p.id === data.professionalId);

    if (data.customerEmail) {
      showToast(`Agendamento #${code} criado! E-mail de confirmação enviado para ${data.customerEmail}`, 'success');
      // Automatic async email delivery
      if (settings.sendEmailOnBooking !== false) {
        dispatchAppointmentEmail({
          to: data.customerEmail,
          customerName: data.customerName,
          serviceName: svc?.name || 'Serviço Personalizado',
          professionalName: prof?.name || 'Barbeiro',
          dateStr: data.date,
          timeStr: data.time,
          durationMinutes: data.durationMinutes,
          price: data.price,
          shopName: settings.name,
          shopEmail: settings.shopEmail,
          phone: settings.phone,
          code,
          address: `${settings.address}, ${settings.city}`,
          customSmtp: settings.smtpConfig,
        }).catch((err) => console.warn('Auto email dispatch note:', err));
      }
    } else {
      showToast(`Agendamento #${code} registrado com sucesso!`, 'success');
    }

    // Send Push Notification for new booking (via Service Worker)
    if (settings.pushNotificationsEnabled !== false && settings.notifyNewBookings !== false) {
      pushNotificationService.notifyNewAppointment(
        newAppointment,
        svc?.name || 'Serviço',
        prof?.name || 'Barbeiro',
        {
          playSound: settings.playNotificationSound !== false,
          vibration: settings.vibrationEnabled !== false,
        }
      );
    }
    // Broadcast for multi-tab/background sync
    pushNotificationService.broadcastEvent('NEW_BOOKING', {
      appointment: newAppointment,
      serviceName: svc?.name,
      professionalName: prof?.name,
    });

    return { success: true, appointment: newAppointment };
  };

  /**
   * Admin accepts an appointment
   */
  const acceptAppointment = (id: string, notifyClient: boolean = true) => {
    const appt = appointments.find((a) => a.id === id);
    if (!appt) return;

    const historyEntry: AppointmentHistoryEntry = {
      timestamp: new Date().toISOString(),
      action: 'accepted',
      description: 'Agendamento aceito e confirmado pelo barbeiro/administrador',
      performedBy: currentUser?.name || 'Administrador',
    };

    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'confirmed',
              history: [...(a.history || []), historyEntry],
            }
          : a
      )
    );

    showToast(`Agendamento #${appt.code} aceito e confirmado!`, 'success');

    const svc = services.find((s) => s.id === appt.serviceId);
    if (settings.pushNotificationsEnabled !== false && settings.notifyStatusChanges !== false) {
      pushNotificationService.notifyStatusChange(
        { ...appt, status: 'confirmed' },
        'confirmed',
        svc?.name || 'Serviço',
        'Confirmado pelo barbeiro',
        { playSound: settings.playNotificationSound !== false }
      );
    }
    pushNotificationService.broadcastEvent('STATUS_CHANGED', {
      appointmentId: id,
      status: 'confirmed',
    });

    if (notifyClient) {
      const updatedAppt = { ...appt, status: 'confirmed' as const };
      openMessageModal(updatedAppt, 'confirmation');
    }
  };

  /**
   * Admin declines an appointment with a reason
   */
  const declineAppointment = (id: string, reason: string, notifyClient: boolean = true) => {
    const appt = appointments.find((a) => a.id === id);
    if (!appt) return;

    const historyEntry: AppointmentHistoryEntry = {
      timestamp: new Date().toISOString(),
      action: 'declined',
      description: `Agendamento recusado. Motivo: ${reason}`,
      performedBy: currentUser?.name || 'Administrador',
    };

    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'declined',
              rejectionReason: reason,
              history: [...(a.history || []), historyEntry],
            }
          : a
      )
    );

    showToast(`Agendamento #${appt.code} recusado.`, 'info');

    const svc = services.find((s) => s.id === appt.serviceId);
    if (settings.pushNotificationsEnabled !== false && settings.notifyStatusChanges !== false) {
      pushNotificationService.notifyStatusChange(
        { ...appt, status: 'declined' },
        'declined',
        svc?.name || 'Serviço',
        reason,
        { playSound: settings.playNotificationSound !== false }
      );
    }
    pushNotificationService.broadcastEvent('STATUS_CHANGED', {
      appointmentId: id,
      status: 'declined',
      notes: reason,
    });

    if (notifyClient) {
      const updatedAppt = { ...appt, status: 'declined' as const, rejectionReason: reason };
      openMessageModal(updatedAppt, 'decline', reason);
    }
  };

  const updateAppointmentStatus = (id: string, status: AppointmentStatus) => {
    const appt = appointments.find((a) => a.id === id);
    const historyEntry: AppointmentHistoryEntry = {
      timestamp: new Date().toISOString(),
      action: status as any,
      description: `Status alterado para "${status}"`,
      performedBy: currentUser?.name || 'Administrador',
    };

    setAppointments((prev) =>
      prev.map((app) =>
        app.id === id
          ? {
              ...app,
              status,
              history: [...(app.history || []), historyEntry],
            }
          : app
      )
    );
    showToast(`Status do agendamento #${appt?.code || id} atualizado para "${status}".`, 'info');

    if (appt) {
      const svc = services.find((s) => s.id === appt.serviceId);
      if (settings.pushNotificationsEnabled !== false && settings.notifyStatusChanges !== false) {
        pushNotificationService.notifyStatusChange(
          { ...appt, status },
          status,
          svc?.name || 'Serviço',
          undefined,
          { playSound: settings.playNotificationSound !== false }
        );
      }
      pushNotificationService.broadcastEvent('STATUS_CHANGED', {
        appointmentId: id,
        status,
      });
    }
  };

  const rescheduleAppointment = (
    id: string,
    newDate: string,
    newTime: string,
    newProfId?: string,
    notifyClient: boolean = true
  ): boolean => {
    const appt = appointments.find((a) => a.id === id);
    if (!appt) return false;

    const profId = newProfId || appt.professionalId;
    const reqStart = timeToMinutes(newTime);
    const reqEnd = reqStart + appt.durationMinutes;

    // Check conflict
    const hasConflict = appointments.some((existing) => {
      if (existing.id === id) return false;
      if (existing.date !== newDate) return false;
      if (existing.professionalId !== profId) return false;
      if (existing.status === 'cancelled' || existing.status === 'declined') return false;

      const existStart = timeToMinutes(existing.time);
      const existEnd = existStart + existing.durationMinutes;
      return intervalsOverlap(reqStart, reqEnd, existStart, existEnd);
    });

    if (hasConflict) {
      showToast('Horário indisponível para reagendamento.', 'error');
      return false;
    }

    const historyEntry: AppointmentHistoryEntry = {
      timestamp: new Date().toISOString(),
      action: 'rescheduled',
      description: `Horário reagendado para ${newDate} às ${newTime}`,
      performedBy: currentUser?.name || 'Administrador',
    };

    let updatedAppointment: Appointment | null = null;

    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const updated: Appointment = {
            ...a,
            date: newDate,
            time: newTime,
            professionalId: profId,
            status: 'rescheduled',
            history: [...(a.history || []), historyEntry],
          };
          updatedAppointment = updated;
          return updated;
        }
        return a;
      })
    );

    showToast(`Agendamento #${appt.code} reagendado para ${newDate} às ${newTime}!`, 'success');

    const svc = services.find((s) => s.id === appt.serviceId);
    if (settings.pushNotificationsEnabled !== false && settings.notifyStatusChanges !== false) {
      pushNotificationService.notifyStatusChange(
        { ...appt, date: newDate, time: newTime, status: 'rescheduled' },
        'rescheduled',
        svc?.name || 'Serviço',
        `Reagendado para ${newDate} às ${newTime}`,
        { playSound: settings.playNotificationSound !== false }
      );
    }
    pushNotificationService.broadcastEvent('STATUS_CHANGED', {
      appointmentId: id,
      status: 'rescheduled',
      notes: `Reagendado para ${newDate} às ${newTime}`,
    });

    if (notifyClient && updatedAppointment) {
      openMessageModal(updatedAppointment, 'reschedule');
    }

    return true;
  };

  const cancelAppointment = (id: string): boolean => {
    const appt = appointments.find((a) => a.id === id);
    const historyEntry: AppointmentHistoryEntry = {
      timestamp: new Date().toISOString(),
      action: 'cancelled',
      description: 'Agendamento cancelado',
      performedBy: currentUser?.name || 'Usuário',
    };

    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'cancelled',
              history: [...(a.history || []), historyEntry],
            }
          : a
      )
    );
    showToast(`Agendamento #${appt?.code || id} cancelado.`, 'info');

    if (appt) {
      const svc = services.find((s) => s.id === appt.serviceId);
      if (settings.pushNotificationsEnabled !== false && settings.notifyStatusChanges !== false) {
        pushNotificationService.notifyStatusChange(
          { ...appt, status: 'cancelled' },
          'cancelled',
          svc?.name || 'Serviço',
          'Cancelado',
          { playSound: settings.playNotificationSound !== false }
        );
      }
      pushNotificationService.broadcastEvent('STATUS_CHANGED', {
        appointmentId: id,
        status: 'cancelled',
      });
    }

    return true;
  };

  /**
   * Log sent messages to appointment history
   */
  const sendCustomerMessage = (
    appointmentId: string,
    channel: 'whatsapp' | 'email' | 'sms',
    content: string
  ) => {
    const appt = appointments.find((a) => a.id === appointmentId);
    if (!appt) return;

    const log: SentMessageLog = {
      id: `msg-${Date.now()}`,
      channel,
      recipient: channel === 'email' ? appt.customerEmail || '' : appt.customerPhone,
      content,
      sentAt: new Date().toISOString(),
      status: 'sent',
    };

    const historyEntry: AppointmentHistoryEntry = {
      timestamp: new Date().toISOString(),
      action: 'message_sent',
      description: `Mensagem enviada via ${channel.toUpperCase()}`,
      performedBy: currentUser?.name || 'Administrador',
    };

    setAppointments((prev) =>
      prev.map((a) =>
        a.id === appointmentId
          ? {
              ...a,
              whatsappNotificationSent: channel === 'whatsapp' ? true : a.whatsappNotificationSent,
              emailNotificationSent: channel === 'email' ? true : a.emailNotificationSent,
              lastMessageSent: log,
              history: [...(a.history || []), historyEntry],
            }
          : a
      )
    );

    showToast(`Mensagem enviada para ${appt.customerName} via ${channel.toUpperCase()}!`, 'success');
  };

  const sendEmailNotification = (appointmentId: string, email: string) => {
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === appointmentId
          ? {
              ...a,
              customerEmail: email,
              emailNotificationSent: true,
            }
          : a
      )
    );
    showToast(`E-mail com voucher e detalhes registrado para ${email}!`, 'success');
  };

  /**
   * Dispatch real email to customer with HTML voucher & calendar invite
   */
  const dispatchEmailToCustomer = async (
    appt: Appointment,
    customEmail?: string
  ): Promise<{ success: boolean; message: string; previewUrl?: string | false }> => {
    const targetEmail = customEmail || appt.customerEmail;
    if (!targetEmail) {
      showToast('Nenhum e-mail informado para este cliente.', 'error');
      return { success: false, message: 'E-mail não informado' };
    }

    const srv = services.find((s) => s.id === appt.serviceId);
    const prof = professionals.find((p) => p.id === appt.professionalId);

    try {
      const result = await dispatchAppointmentEmail({
        to: targetEmail,
        customerName: appt.customerName,
        serviceName: srv?.name || 'Serviço Personalizado',
        professionalName: prof?.name || 'Barbeiro Designado',
        dateStr: appt.date,
        timeStr: appt.time,
        durationMinutes: appt.durationMinutes,
        price: appt.price,
        shopName: settings.name,
        shopEmail: settings.shopEmail,
        phone: settings.phone,
        code: appt.code,
        address: `${settings.address}, ${settings.city}`,
        customSmtp: settings.smtpConfig,
      });

      if (result.success) {
        sendEmailNotification(appt.id, targetEmail);
        showToast(`E-mail com voucher enviado com sucesso para ${targetEmail}!`, 'success');
      } else {
        showToast(`Falha no envio do e-mail: ${result.message}`, 'error');
      }
      return result;
    } catch (err: any) {
      const msg = err?.message || 'Erro inesperado no servidor de e-mail';
      showToast(`Erro ao disparar e-mail: ${msg}`, 'error');
      return { success: false, message: msg };
    }
  };

  // Services CRUD
  const createService = (serviceData: Omit<Service, 'id'>) => {
    const newService: Service = {
      ...serviceData,
      id: `srv-${Date.now()}`,
    };
    setServices((prev) => [...prev, newService]);
    showToast(`Serviço "${newService.name}" criado com sucesso.`, 'success');
  };

  const updateService = (updated: Service) => {
    setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    showToast(`Serviço "${updated.name}" atualizado.`, 'success');
  };

  const deleteService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
    showToast('Serviço removido com sucesso.', 'info');
  };

  // Professionals CRUD
  const createProfessional = (profData: Omit<Professional, 'id'>) => {
    const newProf: Professional = {
      ...profData,
      id: `prof-${Date.now()}`,
    };
    setProfessionals((prev) => [...prev, newProf]);
    showToast(`Profissional "${newProf.name}" cadastrado.`, 'success');
  };

  const updateProfessional = (updated: Professional) => {
    setProfessionals((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    showToast(`Profissional "${updated.name}" atualizado.`, 'success');
  };

  const deleteProfessional = (id: string) => {
    setProfessionals((prev) => prev.filter((p) => p.id !== id));
    showToast('Profissional removido.', 'info');
  };

  // Hours & Blocks
  const updateBusinessHours = (hours: BusinessHours) => {
    setBusinessHours(hours);
    showToast('Horários de funcionamento salvos.', 'success');
  };

  const addBlockedTime = (block: Omit<BlockedTime, 'id'>) => {
    const newBlock: BlockedTime = {
      ...block,
      id: `blk-${Date.now()}`,
    };
    setBlockedTimes((prev) => [...prev, newBlock]);
    showToast('Bloqueio de horário registrado.', 'success');
  };

  const removeBlockedTime = (id: string) => {
    setBlockedTimes((prev) => prev.filter((b) => b.id !== id));
    showToast('Bloqueio removido.', 'info');
  };

  // Settings & Customer Notes
  const updateSettings = (newSettings: ShopSettings) => {
    setSettings(newSettings);
    showToast('Configurações da barbearia atualizadas.', 'success');
  };

  const updateCustomerNotes = (id: string, notes: string) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, notes } : c)));
    showToast('Observações do cliente atualizadas.', 'success');
  };

  // Social & Admin Authentication
  const loginWithGoogle = (role: 'customer' | 'admin' = 'customer'): UserAccount => {
    const user: UserAccount = {
      id: `usr-google-${Date.now()}`,
      name: role === 'admin' ? ADMIN_USER.name : 'Matheus Alcantara',
      email: role === 'admin' ? ADMIN_USER.email : 'MatheusBriza84@gmail.com',
      phone: '(11) 98877-6655',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      role: role,
      provider: 'google',
    };
    setCurrentUser(user);
    if (role === 'admin') {
      setIsAdminAuthenticated(true);
    }
    showToast(`Conectado com Google como ${user.name}!`, 'success');
    setIsSocialLoginModalOpen(false);
    return user;
  };

  const loginWithFacebook = (role: 'customer' | 'admin' = 'customer'): UserAccount => {
    const user: UserAccount = {
      id: `usr-fb-${Date.now()}`,
      name: 'Lucas Brandão',
      email: 'lucas.brandao@facebook.com',
      phone: '(11) 97654-3344',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
      role: role,
      provider: 'facebook',
    };
    setCurrentUser(user);
    if (role === 'admin') {
      setIsAdminAuthenticated(true);
    }
    showToast(`Conectado com Facebook como ${user.name}!`, 'success');
    setIsSocialLoginModalOpen(false);
    return user;
  };

  const loginWithDirect = (name: string, email: string, phone: string): UserAccount => {
    const user: UserAccount = {
      id: `usr-direct-${Date.now()}`,
      name,
      email,
      phone,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      role: 'customer',
      provider: 'direct',
    };
    setCurrentUser(user);
    showToast(`Bem-vindo, ${name}!`, 'success');
    setIsSocialLoginModalOpen(false);
    return user;
  };

  const loginAdminWithPassword = (password: string): boolean => {
    // Standard secure demo unlock or master pin '1234' or 'barberflow'
    if (password === '1234' || password === 'admin' || password === 'barberflow') {
      setCurrentUser(ADMIN_USER);
      setIsAdminAuthenticated(true);
      setActiveView('admin');
      showToast('Acesso de Administrador liberado!', 'success');
      return true;
    }
    showToast('Senha incorreta! Dica: use "1234" ou "admin"', 'error');
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAdminAuthenticated(false);
    setActiveView('client');
    showToast('Sessão encerrada com segurança.', 'info');
  };

  const resetToDemoData = () => {
    localStorage.clear();
    setServices(INITIAL_SERVICES);
    setProfessionals(INITIAL_PROFESSIONALS);
    setAppointments(getInitialAppointments());
    setCustomers(INITIAL_CUSTOMERS);
    setBusinessHours(INITIAL_BUSINESS_HOURS);
    setBlockedTimes(INITIAL_BLOCKED_TIMES);
    setSettings(INITIAL_SETTINGS);
    setCurrentUser(null);
    setIsAdminAuthenticated(false);
    setActiveView('client');
    showToast('Dados de demonstração restaurados com sucesso.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        services,
        professionals,
        appointments,
        customers,
        businessHours,
        blockedTimes,
        settings,
        reviews,
        currentUser,
        isAdminAuthenticated,
        activeView,
        selectedServiceForBooking,
        isBookingModalOpen,
        isSocialLoginModalOpen,
        toasts,
        pushPermissionStatus,
        isPushSupported,
        requestPushPermission,
        sendTestPushNotification,
        professionalLiveStates,
        lastSyncTimestamp,
        refreshCountdown,
        refreshDashboardData,
        dispatchEmailToCustomer,
        isMessageModalOpen,
        selectedApptForMessage,
        messageModalInitialTemplate,
        rejectionReasonForMessage,
        isEmailModalOpen,
        selectedApptForEmail,
        isRescheduleModalOpen,
        selectedApptForReschedule,
        isDeclineModalOpen,
        selectedApptForDecline,
        setActiveView,
        openBookingModal,
        closeBookingModal,
        openSocialLoginModal,
        closeSocialLoginModal,
        openMessageModal,
        closeMessageModal,
        openEmailModal,
        closeEmailModal,
        openRescheduleModal,
        closeRescheduleModal,
        openDeclineModal,
        closeDeclineModal,
        showToast,
        removeToast,
        createAppointment,
        acceptAppointment,
        declineAppointment,
        updateAppointmentStatus,
        rescheduleAppointment,
        cancelAppointment,
        sendCustomerMessage,
        sendEmailNotification,
        createService,
        updateService,
        deleteService,
        createProfessional,
        updateProfessional,
        deleteProfessional,
        updateBusinessHours,
        addBlockedTime,
        removeBlockedTime,
        updateSettings,
        updateCustomerNotes,
        loginWithGoogle,
        loginWithFacebook,
        loginWithDirect,
        loginAdminWithPassword,
        logout,
        logoutAdmin: logout,
        resetToDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
