import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  ADMIN_USER,
  INITIAL_BLOCKED_TIMES,
  INITIAL_BUSINESS_HOURS,
  INITIAL_CUSTOMERS,
  INITIAL_PACKAGES,
  INITIAL_PRODUCTS,
  INITIAL_PROFESSIONALS,
  INITIAL_REVIEWS,
  INITIAL_SERVICES,
  INITIAL_SETTINGS,
  INITIAL_SYSTEM_USERS,
  getInitialAppointments
} from '../data/initialData';
import {
  Appointment,
  AppointmentHistoryEntry,
  AppointmentStatus,
  BarberProduct,
  BarberRegistrationData,
  BlockedTime,
  BusinessHours,
  Customer,
  GoogleCalendarEvent,
  GoogleCalendarSyncState,
  MessageTemplateType,
  MonthlyPackage,
  Professional,
  ProfessionalLiveState,
  Review,
  SentMessageLog,
  Service,
  ShopSettings,
  UserAccount,
  UserRole
} from '../types';
import {
  calculateProfessionalLiveState,
  getTodayDateString,
  intervalsOverlap,
  timeToMinutes
} from '../utils/calendarUtils';
import { dispatchAppointmentEmail } from '../utils/emailService';
import { pushNotificationService, PushPermissionStatus } from '../utils/pushNotificationService';
import {
  initGoogleCalendarAuth,
  signInWithGoogleCalendar,
  logoutGoogleCalendar,
  getCalendarAccessToken,
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  listGoogleCalendarEvents,
} from '../services/googleCalendarService';
import { db, auth, googleProvider, testFirestoreConnection, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  saveAppointmentToFirestore,
  updateAppointmentInFirestore,
  deleteAppointmentFromFirestore,
  saveCustomerToFirestore,
  saveServiceToFirestore,
  deleteServiceFromFirestore,
  saveProfessionalToFirestore,
  saveSettingsToFirestore,
  saveBusinessHoursToFirestore,
  saveBlockedTimeToFirestore,
  deleteBlockedTimeFromFirestore,
  savePackageToFirestore,
  saveProductToFirestore,
  seedFirestoreIfEmpty,
  firebaseGoogleSignIn,
  firebaseSignOut,
  COLLECTIONS,
} from '../services/firebaseSyncService';
import { collection, onSnapshot, doc } from 'firebase/firestore';

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
  activeView: 'client' | 'admin' | 'barber' | 'my_bookings';
  selectedServiceForBooking: Service | null;
  isBookingModalOpen: boolean;
  isSocialLoginModalOpen: boolean;
  toasts: ToastInfo[];

  // Firebase Firestore Integration
  firebaseConnected: boolean;
  firebaseProjectId: string;

  // Push Notifications & Service Worker
  pushPermissionStatus: PushPermissionStatus;
  isPushSupported: boolean;
  requestPushPermission: () => Promise<PushPermissionStatus>;
  sendTestPushNotification: () => Promise<boolean>;
  sendClientHaircutReminder: (
    appointmentId: string,
    reminderType?: '1_hour_before' | 'today' | 'tomorrow' | 'maintenance_15d' | 'maintenance_30d',
    customMessage?: string
  ) => Promise<boolean>;
  notifyClientBookingConfirmed: (appointmentId: string) => Promise<boolean>;

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

  // New Modals (QR Code, Change Password, Complete Profile)
  isQrCodeModalOpen: boolean;
  openQrCodeModal: () => void;
  closeQrCodeModal: () => void;
  isChangePasswordModalOpen: boolean;
  openChangePasswordModal: () => void;
  closeChangePasswordModal: () => void;
  isCompleteProfileModalOpen: boolean;
  openCompleteProfileModal: () => void;
  closeCompleteProfileModal: () => void;
  completeUserProfile: (name: string, email: string, phone: string) => void;

  // System Users Management (TI & Individual Barber Panels)
  systemUsers: UserAccount[];
  createSystemUser: (user: Omit<UserAccount, 'id' | 'createdAt'>) => UserAccount;
  updateSystemUser: (user: UserAccount) => void;
  revokeSystemUserAccess: (id: string, reason?: string) => void;
  restoreSystemUserAccess: (id: string) => void;
  resetSystemUserPassword: (id: string, tempPassword?: string) => void;
  deleteSystemUser: (id: string) => void;
  changeCurrentUserPassword: (newPassword: string) => void;

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

  // Google Calendar Integration
  googleCalendarSyncState: GoogleCalendarSyncState;
  connectGoogleCalendar: () => Promise<boolean>;
  disconnectGoogleCalendar: () => Promise<void>;
  syncAppointmentToGoogleCalendar: (appointmentId: string) => Promise<{ success: boolean; message: string; htmlLink?: string }>;
  syncAllAppointmentsToGoogleCalendar: () => Promise<{ success: boolean; syncedCount: number; message: string }>;
  deleteGoogleCalendarEventForAppt: (appointmentId: string, confirmed?: boolean) => Promise<{ success: boolean; message: string }>;
  fetchUpcomingGoogleCalendarEvents: () => Promise<GoogleCalendarEvent[]>;

  // Services CRUD
  createService: (service: Omit<Service, 'id'>) => void;
  updateService: (service: Service) => void;
  deleteService: (id: string) => void;

  // Monthly Packages (Clube VIP & Assinaturas)
  packages: MonthlyPackage[];
  createPackage: (pkg: Omit<MonthlyPackage, 'id'>) => void;
  updatePackage: (pkg: MonthlyPackage) => void;
  deletePackage: (id: string) => void;

  // Grooming Products (Pomadas, Barba, Gel, Shampoos)
  products: BarberProduct[];
  createProduct: (prod: Omit<BarberProduct, 'id'>) => void;
  updateProduct: (prod: BarberProduct) => void;
  deleteProduct: (id: string) => void;

  // Barber / Salon Self-Registration (Auto-onboarding with provisional password)
  registerNewBarber: (data: BarberRegistrationData) => {
    success: boolean;
    tempPassword: string;
    user: UserAccount;
    professional: Professional;
  };

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
  loginWithGoogle: (role?: 'customer' | 'admin') => Promise<UserAccount> | UserAccount;
  loginWithDirect: (name: string, email: string, phone: string) => UserAccount;
  loginAdminWithPassword: (password: string, userIdentifier?: string) => boolean;
  logout: () => void;
  logoutAdmin: () => void;
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
  SYSTEM_USERS: 'barberflow_system_users_v1',
  PACKAGES: 'barberflow_packages_v1',
  PRODUCTS: 'barberflow_products_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial from localStorage or fallbacks
  const [services, setServices] = useState<Service[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SERVICES);
    if (!saved) return INITIAL_SERVICES;
    try {
      const parsed: Service[] = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_SERVICES;
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
    if (!saved) return INITIAL_PROFESSIONALS;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p: any) => ({
          ...p,
          workingDays: Array.isArray(p.workingDays) ? p.workingDays : [1, 2, 3, 4, 5, 6],
          servicesOffered: Array.isArray(p.servicesOffered) ? p.servicesOffered : ['srv-1', 'srv-2', 'srv-3'],
          daysOff: Array.isArray(p.daysOff) ? p.daysOff : [],
        }));
      }
      return INITIAL_PROFESSIONALS;
    } catch {
      return INITIAL_PROFESSIONALS;
    }
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    if (!saved) return getInitialAppointments();
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : getInitialAppointments();
    } catch {
      return getInitialAppointments();
    }
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (!saved) return INITIAL_CUSTOMERS;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : INITIAL_CUSTOMERS;
    } catch {
      return INITIAL_CUSTOMERS;
    }
  });

  const [businessHours, setBusinessHours] = useState<BusinessHours>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BUSINESS_HOURS);
    return saved ? JSON.parse(saved) : INITIAL_BUSINESS_HOURS;
  });

  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BLOCKED_TIMES);
    if (!saved) return INITIAL_BLOCKED_TIMES;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : INITIAL_BLOCKED_TIMES;
    } catch {
      return INITIAL_BLOCKED_TIMES;
    }
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

  const [systemUsers, setSystemUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SYSTEM_USERS);
    if (!saved) return INITIAL_SYSTEM_USERS;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_SYSTEM_USERS;
    } catch {
      return INITIAL_SYSTEM_USERS;
    }
  });

  // Monthly Subscription Packages
  const [packages, setPackages] = useState<MonthlyPackage[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PACKAGES);
    if (!saved) return INITIAL_PACKAGES;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p: any) => ({
          ...p,
          benefits: Array.isArray(p.benefits) ? p.benefits : [],
        }));
      }
      return INITIAL_PACKAGES;
    } catch {
      return INITIAL_PACKAGES;
    }
  });

  // Grooming Products (Pomadas, Barba, Gel, Shampoos)
  const [products, setProducts] = useState<BarberProduct[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!saved) return INITIAL_PRODUCTS;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [activeView, setActiveView] = useState<'client' | 'admin' | 'barber' | 'my_bookings'>('client');
  const [selectedServiceForBooking, setSelectedServiceForBooking] = useState<Service | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isSocialLoginModalOpen, setIsSocialLoginModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  // QR Code & Password Management Modals
  const [isQrCodeModalOpen, setIsQrCodeModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isCompleteProfileModalOpen, setIsCompleteProfileModalOpen] = useState(false);

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

  // Google Calendar Integration State (Token kept in memory only)
  const [googleCalendarSyncState, setGoogleCalendarSyncState] = useState<GoogleCalendarSyncState>({
    isConnected: false,
    userEmail: null,
    userName: null,
    userAvatar: null,
    lastSyncedAt: null,
    isSyncing: false,
    totalEventsSynced: 0,
  });

  // Push Notifications (Service Worker) State & Permissions
  const [pushPermissionStatus, setPushPermissionStatus] = useState<PushPermissionStatus>(() =>
    pushNotificationService.getPermissionStatus()
  );
  const isPushSupported = pushNotificationService.isSupported();

  // Firebase State
  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(true);
  const firebaseProjectId = 'gen-lang-client-0210112768';

  // Firebase Firestore Realtime Sync Initialization
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const initFirebase = async () => {
      try {
        const isOk = await testFirestoreConnection();
        setFirebaseConnected(isOk);

        // Seed initial data if Firestore is fresh
        await seedFirestoreIfEmpty();

        // 1. Appointments Real-time Listener
        const unsubAppts = onSnapshot(
          collection(db, COLLECTIONS.APPOINTMENTS),
          (snapshot) => {
            if (!snapshot.empty) {
              const loaded: Appointment[] = [];
              snapshot.forEach((docSnap) => {
                loaded.push(docSnap.data() as Appointment);
              });
              loaded.sort(
                (a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime()
              );
              setAppointments(loaded);
            }
          },
          (err) => handleFirestoreError(err, OperationType.GET, COLLECTIONS.APPOINTMENTS)
        );
        unsubs.push(unsubAppts);

        // 2. Services Real-time Listener
        const unsubServices = onSnapshot(
          collection(db, COLLECTIONS.SERVICES),
          (snapshot) => {
            if (!snapshot.empty) {
              const loaded: Service[] = [];
              snapshot.forEach((docSnap) => loaded.push(docSnap.data() as Service));
              setServices(loaded);
            }
          },
          (err) => handleFirestoreError(err, OperationType.GET, COLLECTIONS.SERVICES)
        );
        unsubs.push(unsubServices);

        // 3. Professionals Real-time Listener
        const unsubProfs = onSnapshot(
          collection(db, COLLECTIONS.PROFESSIONALS),
          (snapshot) => {
            if (!snapshot.empty) {
              const loaded: Professional[] = [];
              snapshot.forEach((docSnap) => loaded.push(docSnap.data() as Professional));
              setProfessionals(loaded);
            }
          },
          (err) => handleFirestoreError(err, OperationType.GET, COLLECTIONS.PROFESSIONALS)
        );
        unsubs.push(unsubProfs);

        // 4. Customers Real-time Listener
        const unsubCusts = onSnapshot(
          collection(db, COLLECTIONS.CUSTOMERS),
          (snapshot) => {
            if (!snapshot.empty) {
              const loaded: Customer[] = [];
              snapshot.forEach((docSnap) => loaded.push(docSnap.data() as Customer));
              setCustomers(loaded);
            }
          },
          (err) => handleFirestoreError(err, OperationType.GET, COLLECTIONS.CUSTOMERS)
        );
        unsubs.push(unsubCusts);

        // 5. Packages Real-time Listener
        const unsubPkgs = onSnapshot(
          collection(db, COLLECTIONS.PACKAGES),
          (snapshot) => {
            if (!snapshot.empty) {
              const loaded: MonthlyPackage[] = [];
              snapshot.forEach((docSnap) => loaded.push(docSnap.data() as MonthlyPackage));
              setPackages(loaded);
            }
          },
          (err) => handleFirestoreError(err, OperationType.GET, COLLECTIONS.PACKAGES)
        );
        unsubs.push(unsubPkgs);

        // 6. Products Real-time Listener
        const unsubProds = onSnapshot(
          collection(db, COLLECTIONS.PRODUCTS),
          (snapshot) => {
            if (!snapshot.empty) {
              const loaded: BarberProduct[] = [];
              snapshot.forEach((docSnap) => loaded.push(docSnap.data() as BarberProduct));
              setProducts(loaded);
            }
          },
          (err) => handleFirestoreError(err, OperationType.GET, COLLECTIONS.PRODUCTS)
        );
        unsubs.push(unsubProds);

        // 7. Settings Listener
        const unsubSettings = onSnapshot(
          doc(db, COLLECTIONS.SETTINGS, 'main_settings'),
          (docSnap) => {
            if (docSnap.exists()) {
              setSettings(docSnap.data() as ShopSettings);
            }
          },
          (err) => handleFirestoreError(err, OperationType.GET, 'settings/main_settings')
        );
        unsubs.push(unsubSettings);

        // 8. Business Hours Listener
        const unsubHours = onSnapshot(
          doc(db, COLLECTIONS.BUSINESS_HOURS, 'weekly_schedule'),
          (docSnap) => {
            if (docSnap.exists()) {
              setBusinessHours(docSnap.data() as BusinessHours);
            }
          },
          (err) => handleFirestoreError(err, OperationType.GET, 'business_hours/weekly_schedule')
        );
        unsubs.push(unsubHours);

        // 9. Blocked Times Listener
        const unsubBlocked = onSnapshot(
          collection(db, COLLECTIONS.BLOCKED_TIMES),
          (snapshot) => {
            if (!snapshot.empty) {
              const loaded: BlockedTime[] = [];
              snapshot.forEach((docSnap) => loaded.push(docSnap.data() as BlockedTime));
              setBlockedTimes(loaded);
            }
          },
          (err) => handleFirestoreError(err, OperationType.GET, COLLECTIONS.BLOCKED_TIMES)
        );
        unsubs.push(unsubBlocked);

        setFirebaseConnected(true);
      } catch (err) {
        console.warn('Firebase sync initialized in local/offline mode:', err);
      }
    };

    initFirebase();

    return () => {
      unsubs.forEach((unsub) => {
        try {
          unsub();
        } catch {}
      });
    };
  }, []);

  // Initialize Google Calendar Auth Listener
  useEffect(() => {
    const unsub = initGoogleCalendarAuth(
      (user) => {
        setGoogleCalendarSyncState((prev) => ({
          ...prev,
          isConnected: true,
          userEmail: user.email,
          userName: user.displayName || user.email?.split('@')[0] || 'Usuário Google',
          userAvatar: user.photoURL,
        }));
      },
      () => {
        setGoogleCalendarSyncState((prev) => ({
          ...prev,
          isConnected: false,
          userEmail: null,
          userName: null,
          userAvatar: null,
        }));
      }
    );
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

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

  // Trigger Client-Facing Push Notification for Booking Confirmation
  const notifyClientBookingConfirmed = async (appointmentId: string): Promise<boolean> => {
    const appt = appointments.find((a) => a.id === appointmentId);
    if (!appt) return false;

    const svc = services.find((s) => s.id === appt.serviceId);
    const barber = professionals.find((p) => p.id === appt.professionalId);

    const success = await pushNotificationService.notifyClientBookingConfirmed(
      appt,
      svc?.name || 'Serviço',
      barber?.name || 'Barbeiro',
      {
        playSound: settings.playNotificationSound !== false,
        vibration: settings.vibrationEnabled !== false,
      }
    );

    if (success) {
      showToast(`🔔 Notificação Push de confirmação enviada para ${appt.customerName}!`, 'success');
    }
    return success;
  };

  // Trigger Client-Facing Haircut Reminder Push Notification (Lembrete de Corte)
  const sendClientHaircutReminder = async (
    appointmentId: string,
    reminderType: '1_hour_before' | 'today' | 'tomorrow' | 'maintenance_15d' | 'maintenance_30d' = '1_hour_before',
    customMessage?: string
  ): Promise<boolean> => {
    const appt = appointments.find((a) => a.id === appointmentId);
    if (!appt) return false;

    // Check / prompt permission if not yet granted
    if (pushNotificationService.getPermissionStatus() !== 'granted') {
      try {
        const requested = await pushNotificationService.requestPermission();
        setPushPermissionStatus(requested);
      } catch {}
    }

    const svc = services.find((s) => s.id === appt.serviceId);
    const barber = professionals.find((p) => p.id === appt.professionalId);

    const success = await pushNotificationService.notifyClientHaircutReminder(
      appt,
      svc?.name || 'Serviço',
      barber?.name || 'Barbeiro',
      reminderType,
      customMessage,
      {
        playSound: settings.playNotificationSound !== false,
        vibration: settings.vibrationEnabled !== false,
      }
    );

    const typeLabels = {
      '1_hour_before': 'Lembrete de 1 hora antes',
      'today': 'Lembrete do dia do corte',
      'tomorrow': 'Lembrete de véspera (amanhã)',
      'maintenance_15d': 'Lembrete de retorno (15 dias)',
      'maintenance_30d': 'Lembrete de retorno (30 dias)',
      'custom': 'Lembrete personalizado',
    };

    showToast(`✂️ ${typeLabels[reminderType] || 'Lembrete de Corte'} disparado com sucesso via Push Notification!`, 'success');
    return success;
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

    // 2. Check and trigger scheduled native push notifications and haircut reminders for today
    pushNotificationService.checkAndTriggerScheduledReminders(
      baseList,
      services,
      professionals,
      { playSound: settings.playNotificationSound !== false }
    );

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

    // Persist to Cloud Firestore
    saveAppointmentToFirestore(newAppointment);

    // Upsert or update Customer CRM record
    setCustomers((prev) => {
      const cleanPhone = data.customerPhone.replace(/\D/g, '');
      const existingIdx = prev.findIndex((c) => c.phone.replace(/\D/g, '') === cleanPhone);

      if (existingIdx >= 0) {
        const updated = [...prev];
        const currentCust = updated[existingIdx];
        const updatedCust = {
          ...currentCust,
          name: data.customerName,
          email: data.customerEmail || currentCust.email,
          totalAppointments: currentCust.totalAppointments + 1,
          totalSpent: currentCust.totalSpent + data.price,
          lastVisit: data.date,
        };
        updated[existingIdx] = updatedCust;
        saveCustomerToFirestore(updatedCust);
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
        saveCustomerToFirestore(newCustomer);
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

    // Persist to Cloud Firestore
    updateAppointmentInFirestore(id, {
      status: 'confirmed',
      history: [...(appt.history || []), historyEntry],
    });

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

    // Persist to Cloud Firestore
    updateAppointmentInFirestore(id, {
      status: 'declined',
      rejectionReason: reason,
      history: [...(appt.history || []), historyEntry],
    });

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

    if (appt) {
      updateAppointmentInFirestore(id, {
        status,
        history: [...(appt.history || []), historyEntry],
      });
    }

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

    if (updatedAppointment) {
      saveAppointmentToFirestore(updatedAppointment);
    }

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

    if (appt) {
      updateAppointmentInFirestore(id, {
        status: 'cancelled',
        history: [...(appt.history || []), historyEntry],
      });
    }

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
    saveServiceToFirestore(newService);
    showToast(`Serviço "${newService.name}" criado com sucesso.`, 'success');
  };

  const updateService = (updated: Service) => {
    setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    saveServiceToFirestore(updated);
    showToast(`Serviço "${updated.name}" atualizado.`, 'success');
  };

  const deleteService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
    deleteServiceFromFirestore(id);
    showToast('Serviço removido com sucesso.', 'info');
  };

  // Professionals CRUD
  const createProfessional = (profData: Omit<Professional, 'id'>) => {
    const newProf: Professional = {
      ...profData,
      id: `prof-${Date.now()}`,
    };
    setProfessionals((prev) => [...prev, newProf]);
    saveProfessionalToFirestore(newProf);
    showToast(`Profissional "${newProf.name}" cadastrado.`, 'success');
  };

  const updateProfessional = (updated: Professional) => {
    setProfessionals((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    saveProfessionalToFirestore(updated);
    showToast(`Profissional "${updated.name}" atualizado.`, 'success');
  };

  const deleteProfessional = (id: string) => {
    setProfessionals((prev) => prev.filter((p) => p.id !== id));
    showToast('Profissional removido.', 'info');
  };

  // Hours & Blocks
  const updateBusinessHours = (hours: BusinessHours) => {
    setBusinessHours(hours);
    saveBusinessHoursToFirestore(hours);
    showToast('Horários de funcionamento salvos.', 'success');
  };

  const addBlockedTime = (block: Omit<BlockedTime, 'id'>) => {
    const newBlock: BlockedTime = {
      ...block,
      id: `blk-${Date.now()}`,
    };
    setBlockedTimes((prev) => [...prev, newBlock]);
    saveBlockedTimeToFirestore(newBlock);
    showToast('Bloqueio de horário registrado.', 'success');
  };

  const removeBlockedTime = (id: string) => {
    setBlockedTimes((prev) => prev.filter((b) => b.id !== id));
    deleteBlockedTimeFromFirestore(id);
    showToast('Bloqueio removido.', 'info');
  };

  // Settings & Customer Notes
  const updateSettings = (newSettings: ShopSettings) => {
    setSettings(newSettings);
    saveSettingsToFirestore(newSettings);
    showToast('Configurações da barbearia atualizadas.', 'success');
  };

  const updateCustomerNotes = (id: string, notes: string) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, notes } : c)));
    showToast('Observações do cliente atualizadas.', 'success');
  };

  // Monthly Packages (Clube VIP) CRUD
  const createPackage = (pkgData: Omit<MonthlyPackage, 'id'>) => {
    const newPkg: MonthlyPackage = {
      ...pkgData,
      id: `pkg-${Date.now()}`,
    };
    setPackages((prev) => [newPkg, ...prev]);
    savePackageToFirestore(newPkg);
    showToast(`Pacote "${newPkg.name}" criado com sucesso!`, 'success');
  };

  const updatePackage = (updated: MonthlyPackage) => {
    setPackages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    savePackageToFirestore(updated);
    showToast(`Pacote "${updated.name}" atualizado.`, 'success');
  };

  const deletePackage = (id: string) => {
    setPackages((prev) => prev.filter((p) => p.id !== id));
    showToast('Pacote removido com sucesso.', 'info');
  };

  // Grooming Products CRUD
  const createProduct = (prodData: Omit<BarberProduct, 'id'>) => {
    const newProd: BarberProduct = {
      ...prodData,
      id: `prod-${Date.now()}`,
    };
    setProducts((prev) => [newProd, ...prev]);
    saveProductToFirestore(newProd);
    showToast(`Produto "${newProd.name}" cadastrado no estoque!`, 'success');
  };

  const updateProduct = (updated: BarberProduct) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    saveProductToFirestore(updated);
    showToast(`Produto "${updated.name}" atualizado.`, 'success');
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast('Produto removido do catálogo.', 'info');
  };

  // Barber / Salon Self-Registration (Auto-onboarding with provisional password)
  const registerNewBarber = (data: BarberRegistrationData) => {
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    const tempPassword = `BARBER-${randomCode}`;
    const profId = `prof-${Date.now().toString(36)}`;
    const userId = `usr-barber-${Date.now().toString(36)}`;

    const displayName = data.accountType === 'salon' && data.salonName ? data.salonName : data.name;

    const newProfessional: Professional = {
      id: profId,
      name: displayName,
      specialty:
        data.specialties.length > 0
          ? data.specialties.join(', ')
          : data.accountType === 'salon'
          ? 'Salão & Barbearia Completa'
          : 'Barbeiro Profissional & Visagista',
      rating: 5.0,
      reviewsCount: 0,
      avatar:
        data.avatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      bio:
        data.bio ||
        (data.accountType === 'salon'
          ? `Estabelecimento ${displayName} - Atendimento de alto padrão com agendamento online e equipe qualificada.`
          : `Barbeiro profissional ${data.name} especializado em visagismo masculino e cortes de alta precisão.`),
      active: true,
      servicesOffered: services.map((s) => s.id),
      workingDays: [1, 2, 3, 4, 5, 6],
      startTime: '09:00',
      endTime: '20:00',
      lunchStart: '12:00',
      lunchEnd: '13:00',
      daysOff: [],
      isSalon: data.accountType === 'salon',
      salonName: data.salonName,
      cnpj: data.cnpj,
      cpf: data.cpf,
      phone: data.phone,
      email: data.email,
      address: `${data.address}, ${data.number} - ${data.neighborhood}`,
      city: `${data.city} - ${data.state}`,
      zipCode: data.zipCode,
      pixKey: data.pixKey,
      pixKeyType: data.pixKeyType,
    };

    const newUser: UserAccount = {
      id: userId,
      name: displayName,
      email: data.email.trim().toLowerCase(),
      phone: data.phone,
      avatar: newProfessional.avatar,
      role: 'barber',
      professionalId: profId,
      provider: 'direct',
      active: true,
      mustChangePassword: true, // Forces first-time password reset on first login!
      password: tempPassword,
      createdAt: new Date().toISOString(),
    };

    setProfessionals((prev) => [...prev, newProfessional]);
    setSystemUsers((prev) => [...prev, newUser]);

    showToast(`Cadastro de ${displayName} realizado com sucesso!`, 'success');

    return {
      success: true,
      tempPassword,
      user: newUser,
      professional: newProfessional,
    };
  };

  // Persist packages, products, and system users to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(packages));
  }, [packages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SYSTEM_USERS, JSON.stringify(systemUsers));
  }, [systemUsers]);

  // Modal helpers
  const openQrCodeModal = () => setIsQrCodeModalOpen(true);
  const closeQrCodeModal = () => setIsQrCodeModalOpen(false);

  const openChangePasswordModal = () => setIsChangePasswordModalOpen(true);
  const closeChangePasswordModal = () => setIsChangePasswordModalOpen(false);

  const openCompleteProfileModal = () => setIsCompleteProfileModalOpen(true);
  const closeCompleteProfileModal = () => setIsCompleteProfileModalOpen(false);

  // System Users Management (TI & Individual Barber Panels)
  const createSystemUser = (userData: Omit<UserAccount, 'id' | 'createdAt'>): UserAccount => {
    const newUser: UserAccount = {
      ...userData,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString(),
      active: true,
    };
    setSystemUsers((prev) => [newUser, ...prev]);
    return newUser;
  };

  const updateSystemUser = (updatedUser: UserAccount) => {
    setSystemUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  const revokeSystemUserAccess = (id: string, reason?: string) => {
    setSystemUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
              ...u,
              active: false,
              revokedAt: new Date().toISOString(),
              revokedReason: reason || 'Acesso revogado pelo Administrador de TI',
            }
          : u
      )
    );

    // If current logged-in user is the revoked one, kick out immediately
    if (currentUser?.id === id) {
      setCurrentUser(null);
      setIsAdminAuthenticated(false);
      setActiveView('client');
      showToast('Seu acesso ao sistema foi revogado pelo Administrador de TI.', 'error');
    } else {
      showToast('Acesso do funcionário revogado com sucesso!', 'info');
    }
  };

  const restoreSystemUserAccess = (id: string) => {
    setSystemUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
              ...u,
              active: true,
              revokedAt: undefined,
              revokedReason: undefined,
            }
          : u
      )
    );
    showToast('Acesso do funcionário restaurado com sucesso!', 'success');
  };

  const resetSystemUserPassword = (id: string, tempPassword = '1234') => {
    setSystemUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
              ...u,
              password: tempPassword,
              mustChangePassword: true, // Requires mandatory password change on first login!
            }
          : u
      )
    );
    showToast(`Senha redefinida para "${tempPassword}". Troca obrigatória ativada no próximo login.`, 'success');
  };

  const deleteSystemUser = (id: string) => {
    setSystemUsers((prev) => prev.filter((u) => u.id !== id));
    showToast('Cadastro de usuário removido com sucesso.', 'info');
  };

  const changeCurrentUserPassword = (newPassword: string) => {
    if (!currentUser) return;
    const updated: UserAccount = {
      ...currentUser,
      password: newPassword,
      mustChangePassword: false,
    };
    setCurrentUser(updated);
    setSystemUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    setIsChangePasswordModalOpen(false);
    showToast('Senha pessoal salva com sucesso! Acesso concedido.', 'success');
  };

  const completeUserProfile = (name: string, email: string, phone: string) => {
    if (currentUser) {
      const updated: UserAccount = {
        ...currentUser,
        name,
        email,
        phone,
      };
      setCurrentUser(updated);
    } else {
      const newUser: UserAccount = {
        id: `usr-direct-${Date.now()}`,
        name,
        email,
        phone,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        role: 'customer',
        provider: 'direct',
        active: true,
        mustChangePassword: false,
      };
      setCurrentUser(newUser);
    }
    setIsCompleteProfileModalOpen(false);
    showToast('Perfil de cliente confirmado com sucesso!', 'success');
  };

  // Social & Admin Authentication
  const loginWithGoogle = async (role: 'customer' | 'admin' = 'customer'): Promise<UserAccount> => {
    try {
      const fbResult = await firebaseGoogleSignIn();
      const fbUser = fbResult.user;
      
      const user: UserAccount = {
        id: fbUser?.uid || `usr-google-${Date.now()}`,
        name: fbUser?.displayName || (role === 'admin' ? ADMIN_USER.name : 'Matheus Briza'),
        email: fbUser?.email || (role === 'admin' ? ADMIN_USER.email : 'MatheusBriza84@gmail.com'),
        phone: fbUser?.phoneNumber || '(11) 98877-6655',
        avatar: fbUser?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        role: role === 'admin' ? 'super_admin' : 'customer',
        provider: 'google',
        active: true,
        mustChangePassword: false,
      };

      setCurrentUser(user);
      if (role === 'admin') {
        setIsAdminAuthenticated(true);
        setActiveView('admin');
      }
      showToast(`Conectado com Firebase & Google como ${user.name}!`, 'success');
      setIsSocialLoginModalOpen(false);
      return user;
    } catch (err) {
      console.warn('Google sign-in fallback:', err);
      const user: UserAccount = {
        id: `usr-google-${Date.now()}`,
        name: role === 'admin' ? ADMIN_USER.name : 'Matheus Briza',
        email: role === 'admin' ? ADMIN_USER.email : 'MatheusBriza84@gmail.com',
        phone: '(11) 98877-6655',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        role: role === 'admin' ? 'super_admin' : 'customer',
        provider: 'google',
        active: true,
        mustChangePassword: false,
      };
      setCurrentUser(user);
      if (role === 'admin') {
        setIsAdminAuthenticated(true);
        setActiveView('admin');
      }
      showToast(`Conectado com Google como ${user.name}!`, 'success');
      setIsSocialLoginModalOpen(false);
      return user;
    }
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
      active: true,
      mustChangePassword: false,
    };
    setCurrentUser(user);
    showToast(`Bem-vindo, ${name}! Cadastro efetuado com sucesso.`, 'success');
    setIsSocialLoginModalOpen(false);
    return user;
  };

  const loginAdminWithPassword = (password: string, userIdentifier?: string): boolean => {
    let matchedUser: UserAccount | undefined;

    if (userIdentifier && userIdentifier.trim()) {
      const q = userIdentifier.trim().toLowerCase();
      matchedUser = systemUsers.find(
        (u) =>
          u.email.toLowerCase() === q ||
          u.name.toLowerCase() === q ||
          u.id.toLowerCase() === q
      );

      // Check for default TI admin alias
      if (!matchedUser && (q === 'admin' || q === 'admin@barberflow.com.br' || q === 'ti')) {
        matchedUser = systemUsers.find((u) => u.role === 'super_admin') || ADMIN_USER;
      }
    } else {
      // If no identifier, try super admin
      matchedUser = systemUsers.find((u) => u.role === 'super_admin') || ADMIN_USER;
    }

    if (!matchedUser) {
      showToast('Credenciais não encontradas. Verifique o e-mail ou usuário informado.', 'error');
      return false;
    }

    // Check if account is revoked / deactivated
    if (matchedUser.active === false) {
      showToast(
        `Acesso Revogado! O Administrador de TI bloqueou este login. Motivo: ${matchedUser.revokedReason || 'Acesso suspenso'}`,
        'error'
      );
      return false;
    }

    // Validate password: exact user password (or master PIN for TI accounts)
    const validPassword = matchedUser.password || '1234';
    const isMasterPin = (matchedUser.role === 'super_admin') && (password === '1234' || password === 'admin' || password === 'barberflow');

    if (password !== validPassword && !isMasterPin) {
      showToast('Senha de acesso incorreta. Tente novamente.', 'error');
      return false;
    }

    // Authenticate
    const authedUser: UserAccount = {
      ...matchedUser,
      lastLogin: new Date().toISOString(),
    };
    setCurrentUser(authedUser);
    setIsAdminAuthenticated(true);

    // Route according to role: Barbers to Barber Panel, TI/Admins to Admin Panel
    if (authedUser.role === 'barber') {
      setActiveView('barber');
    } else {
      setActiveView('admin');
    }

    setIsSocialLoginModalOpen(false);

    // If must change password on first login
    if (authedUser.mustChangePassword) {
      setIsChangePasswordModalOpen(true);
    } else {
      showToast(
        `Bem-vindo, ${authedUser.name}! Painel ${authedUser.role === 'super_admin' ? 'T.I. / Administrador Master' : 'do Barbeiro'} acessado com sucesso.`,
        'success'
      );
    }

    return true;
  };

  const connectGoogleCalendar = async (): Promise<boolean> => {
    try {
      setGoogleCalendarSyncState((prev) => ({ ...prev, isSyncing: true }));
      const result = await signInWithGoogleCalendar();
      if (result) {
        setGoogleCalendarSyncState({
          isConnected: true,
          userEmail: result.user.email,
          userName: result.user.displayName || result.user.email?.split('@')[0] || 'Usuário Google',
          userAvatar: result.user.photoURL,
          lastSyncedAt: new Date().toISOString(),
          isSyncing: false,
          totalEventsSynced: appointments.filter((a) => a.googleCalendarSynced).length,
        });
        showToast(`Google Calendar conectado com sucesso (${result.user.email})!`, 'success');
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Erro ao conectar Google Calendar:', err);
      showToast(err.message || 'Falha ao conectar com Google Calendar.', 'error');
      setGoogleCalendarSyncState((prev) => ({ ...prev, isSyncing: false }));
      return false;
    }
  };

  const disconnectGoogleCalendar = async () => {
    await logoutGoogleCalendar();
    setGoogleCalendarSyncState({
      isConnected: false,
      userEmail: null,
      userName: null,
      userAvatar: null,
      lastSyncedAt: null,
      isSyncing: false,
      totalEventsSynced: 0,
    });
    showToast('Conta Google desconectada.', 'info');
  };

  const syncAppointmentToGoogleCalendar = async (
    appointmentId: string
  ): Promise<{ success: boolean; message: string; htmlLink?: string }> => {
    const appt = appointments.find((a) => a.id === appointmentId);
    if (!appt) return { success: false, message: 'Agendamento não encontrado' };
    const svc = services.find((s) => s.id === appt.serviceId) || services[0];
    const prof = professionals.find((p) => p.id === appt.professionalId) || professionals[0];

    let token = getCalendarAccessToken();
    if (!token) {
      const connected = await connectGoogleCalendar();
      if (!connected) {
        return { success: false, message: 'Conecte sua conta Google Calendar para sincronizar.' };
      }
      token = getCalendarAccessToken();
    }

    setGoogleCalendarSyncState((prev) => ({ ...prev, isSyncing: true }));
    const res = await createGoogleCalendarEvent(appt, svc, prof, settings, token || undefined);
    setGoogleCalendarSyncState((prev) => ({ ...prev, isSyncing: false }));

    if (res.success && res.eventId) {
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId
            ? {
                ...a,
                googleCalendarEventId: res.eventId,
                googleCalendarSynced: true,
                googleCalendarHtmlLink: res.htmlLink,
              }
            : a
        )
      );
      setGoogleCalendarSyncState((prev) => ({
        ...prev,
        lastSyncedAt: new Date().toISOString(),
        totalEventsSynced: prev.totalEventsSynced + 1,
      }));
      showToast(`Agendamento #${appt.code} sincronizado com seu Google Agenda!`, 'success');
      return { success: true, message: 'Sincronizado com sucesso!', htmlLink: res.htmlLink };
    } else {
      showToast(res.error || 'Erro ao sincronizar com Google Calendar', 'error');
      return { success: false, message: res.error || 'Erro ao sincronizar' };
    }
  };

  const syncAllAppointmentsToGoogleCalendar = async (): Promise<{
    success: boolean;
    syncedCount: number;
    message: string;
  }> => {
    let token = getCalendarAccessToken();
    if (!token) {
      const connected = await connectGoogleCalendar();
      if (!connected) {
        return { success: false, syncedCount: 0, message: 'Conexão cancelada.' };
      }
      token = getCalendarAccessToken();
    }

    setGoogleCalendarSyncState((prev) => ({ ...prev, isSyncing: true }));
    let count = 0;
    const activeAppts = appointments.filter((a) => a.status !== 'cancelled' && a.status !== 'declined');

    for (const appt of activeAppts) {
      if (appt.googleCalendarSynced && appt.googleCalendarEventId) continue;
      const svc = services.find((s) => s.id === appt.serviceId) || services[0];
      const prof = professionals.find((p) => p.id === appt.professionalId) || professionals[0];

      const res = await createGoogleCalendarEvent(appt, svc, prof, settings, token || undefined);
      if (res.success && res.eventId) {
        count++;
        setAppointments((prev) =>
          prev.map((a) =>
            a.id === appt.id
              ? {
                  ...a,
                  googleCalendarEventId: res.eventId,
                  googleCalendarSynced: true,
                  googleCalendarHtmlLink: res.htmlLink,
                }
              : a
          )
        );
      }
    }

    setGoogleCalendarSyncState((prev) => ({
      ...prev,
      isSyncing: false,
      lastSyncedAt: new Date().toISOString(),
      totalEventsSynced: prev.totalEventsSynced + count,
    }));

    showToast(`${count} agendamento(s) sincronizados com o Google Agenda!`, 'success');
    return { success: true, syncedCount: count, message: `${count} sincronizados` };
  };

  const deleteGoogleCalendarEventForAppt = async (
    appointmentId: string,
    confirmed: boolean = true
  ): Promise<{ success: boolean; message: string }> => {
    const appt = appointments.find((a) => a.id === appointmentId);
    if (!appt || !appt.googleCalendarEventId) {
      return { success: false, message: 'Evento não vinculado no Google Calendar.' };
    }

    if (!confirmed) {
      return { success: false, message: 'Operação cancelada.' };
    }

    const res = await deleteGoogleCalendarEvent(appt.googleCalendarEventId);
    if (res.success) {
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId
            ? {
                ...a,
                googleCalendarEventId: undefined,
                googleCalendarSynced: false,
                googleCalendarHtmlLink: undefined,
              }
            : a
        )
      );
      showToast(`Evento removido do Google Agenda (#${appt.code})`, 'info');
      return { success: true, message: 'Evento removido com sucesso.' };
    } else {
      showToast(res.error || 'Erro ao remover evento do Google Calendar', 'error');
      return { success: false, message: res.error || 'Erro' };
    }
  };

  const fetchUpcomingGoogleCalendarEvents = async (): Promise<GoogleCalendarEvent[]> => {
    const now = new Date().toISOString();
    const res = await listGoogleCalendarEvents(now);
    return res.events || [];
  };

  const logout = () => {
    firebaseSignOut();
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
        firebaseConnected,
        firebaseProjectId,
        pushPermissionStatus,
        isPushSupported,
        requestPushPermission,
        sendTestPushNotification,
        sendClientHaircutReminder,
        notifyClientBookingConfirmed,
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
        isQrCodeModalOpen,
        openQrCodeModal,
        closeQrCodeModal,
        isChangePasswordModalOpen,
        openChangePasswordModal,
        closeChangePasswordModal,
        isCompleteProfileModalOpen,
        openCompleteProfileModal,
        closeCompleteProfileModal,
        completeUserProfile,
        systemUsers,
        createSystemUser,
        updateSystemUser,
        revokeSystemUserAccess,
        restoreSystemUserAccess,
        resetSystemUserPassword,
        deleteSystemUser,
        changeCurrentUserPassword,
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
        googleCalendarSyncState,
        connectGoogleCalendar,
        disconnectGoogleCalendar,
        syncAppointmentToGoogleCalendar,
        syncAllAppointmentsToGoogleCalendar,
        deleteGoogleCalendarEventForAppt,
        fetchUpcomingGoogleCalendarEvents,
        createService,
        updateService,
        deleteService,
        packages,
        createPackage,
        updatePackage,
        deletePackage,
        products,
        createProduct,
        updateProduct,
        deleteProduct,
        registerNewBarber,
        createProfessional,
        updateProfessional,
        deleteProfessional,
        updateBusinessHours,
        addBlockedTime,
        removeBlockedTime,
        updateSettings,
        updateCustomerNotes,
        loginWithGoogle,
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
