export type ServiceCategory = 'corte' | 'barba' | 'tratamento' | 'combo' | 'coloracao';

export interface Service {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  category: ServiceCategory;
  image: string;
  active: boolean;
  popular?: boolean;
  barberId?: string; // Optional: 'all' or specific professionalId
}

export type ProductCategory = 'pomadas' | 'barba' | 'shampoo' | 'acessorios' | 'finalizador';

export interface BarberProduct {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  description: string;
  price: number;
  promotionalPrice?: number;
  image: string;
  stock: number;
  active: boolean;
  barberId?: string; // 'all' or specific professionalId
  barberName?: string;
  featured?: boolean;
}

export interface MonthlyPackage {
  id: string;
  name: string;
  tagline?: string;
  description: string;
  price: number; // R$ per month
  benefits: string[];
  servicesIncludedText: string;
  cutsPerMonth: number | 'unlimited';
  beardsPerMonth: number | 'unlimited';
  image: string;
  active: boolean;
  popular?: boolean;
  barberId?: string; // 'all' or specific professionalId
  barberName?: string;
}

export interface BarberRegistrationData {
  accountType: 'individual' | 'salon';
  name: string;
  salonName?: string;
  cnpj?: string;
  cpf?: string;
  email: string;
  phone: string;
  zipCode: string;
  address: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  pixKey: string;
  pixKeyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  specialties: string[];
  avatar: string;
  bio?: string;
}

export interface WorkingDayConfig {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  enabled: boolean;
  startTime: string; // "09:00"
  endTime: string;   // "19:00"
  lunchStart?: string; // "12:00"
  lunchEnd?: string;   // "13:00"
}

export interface Professional {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviewsCount: number;
  avatar: string;
  bio: string;
  active: boolean;
  servicesOffered: string[]; // Service IDs
  workingDays: number[];     // [1, 2, 3, 4, 5, 6]
  startTime: string;        // "09:00"
  endTime: string;          // "19:00"
  lunchStart: string;        // "12:00"
  lunchEnd: string;          // "13:00"
  daysOff: string[];        // Array of "YYYY-MM-DD"
  // Extended fields for BarberFlow SaaS
  isSalon?: boolean;
  salonName?: string;
  cnpj?: string;
  cpf?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  pixKey?: string;
  pixKeyType?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  pixQrCodeUrl?: string;
}

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'declined'
  | 'rescheduled'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type AuthProvider = 'google' | 'direct' | 'manual';

export interface SentMessageLog {
  id: string;
  channel: 'whatsapp' | 'email' | 'sms';
  recipient: string;
  content: string;
  sentAt: string;
  status: 'sent' | 'opened' | 'delivered';
  templateType?: MessageTemplateType;
}

export interface AppointmentHistoryEntry {
  timestamp: string;
  action: 'created' | 'accepted' | 'declined' | 'rescheduled' | 'completed' | 'cancelled' | 'message_sent';
  description: string;
  performedBy: string;
}

export interface Appointment {
  id: string;
  code: string; // e.g. "BF-8492"
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceId: string;
  professionalId: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "15:30"
  durationMinutes: number;
  price: number;
  status: AppointmentStatus;
  createdAt: string; // ISO string
  notes?: string;
  authProvider: AuthProvider;
  rejectionReason?: string;
  emailNotificationSent?: boolean;
  whatsappNotificationSent?: boolean;
  googleCalendarEventId?: string;
  googleCalendarSynced?: boolean;
  googleCalendarHtmlLink?: string;
  lastMessageSent?: SentMessageLog;
  history?: AppointmentHistoryEntry[];
}

export type MessageTemplateType =
  | 'confirmation'
  | 'reschedule'
  | 'decline'
  | 'reminder'
  | 'thank_you'
  | 'custom';

export interface MessageTemplate {
  id: MessageTemplateType;
  name: string;
  description: string;
  iconName: string;
  template: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  totalAppointments: number;
  totalSpent: number;
  lastVisit?: string; // "YYYY-MM-DD"
  notes?: string;
  provider?: AuthProvider;
  joinedAt: string;
}

export interface BlockedTime {
  id: string;
  professionalId: string; // 'all' or specific ID
  date: string; // "YYYY-MM-DD"
  startTime: string; // "14:00"
  endTime: string;   // "16:00"
  reason: string;
}

export interface BusinessDayHours {
  isOpen: boolean;
  open: string;
  close: string;
  lunchStart?: string;
  lunchEnd?: string;
}

export interface BusinessHours {
  [dayOfWeek: number]: BusinessDayHours;
}

export interface ShopSettings {
  name: string;
  tagline: string;
  logo: string;
  bannerImage: string;
  address: string;
  city: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  mapsUrl: string;
  slotIntervalMinutes: number; // e.g. 30
  autoConfirm: boolean;
  minAdvanceBookingHours: number;
  sendEmailOnBooking: boolean;
  autoOpenWhatsAppOnBooking: boolean;
  shopEmail: string;
  // Push Notifications (Service Worker)
  pushNotificationsEnabled?: boolean;
  notifyNewBookings?: boolean;
  notifyStatusChanges?: boolean;
  playNotificationSound?: boolean;
  vibrationEnabled?: boolean;
  // Custom Transactional & SMTP configuration
  smtpConfig?: {
    provider?: 'resend' | 'sendgrid' | 'gmail' | 'custom';
    apiKey?: string; // For Resend or SendGrid API
    host?: string;
    port?: number;
    user?: string;
    pass?: string;
    from?: string;
  };
  // Pix and Online Advance Payment
  pixKey?: string;
  pixKeyType?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  pixReceiverName?: string;
  pixCity?: string;
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  customerName?: string;
  appointmentCode?: string;
  sentAt: string;
  status: 'delivered' | 'sent' | 'simulated' | 'error';
  provider: string;
  messageId?: string;
  previewUrl?: string | false;
  error?: string;
}

export interface EmailDiagnostics {
  status: string;
  hasConfiguredSmtp: boolean;
  configuredProvider: string;
  detectedEnvServices: {
    hasResend: boolean;
    hasSendGrid: boolean;
    hasSmtp: boolean;
    smtpHost?: string;
    smtpUser?: string;
  };
  totalEmailsSent: number;
  lastSentAt: string | null;
  logs: EmailLog[];
}

export type UserRole = 'super_admin' | 'admin' | 'staff' | 'barber' | 'customer';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: UserRole;
  provider: AuthProvider;
  professionalId?: string; // Links account to a specific barber/hairdresser
  active: boolean; // IT Admin can revoke or restore access
  mustChangePassword?: boolean; // Force change password on first login
  password?: string; // Stored demo password hash / credentials
  createdAt?: string;
  lastLogin?: string;
  revokedAt?: string;
  revokedReason?: string;
}

export interface Review {
  id: string;
  customerName: string;
  customerAvatar: string;
  rating: number;
  comment: string;
  date: string;
  serviceName: string;
}

export type ProfessionalLiveStatusType =
  | 'available'    // Disponível
  | 'in_service'   // Em Atendimento
  | 'completed'    // Concluído (finalizou atendimentos)
  | 'lunch'        // Pausa / Almoço
  | 'off_duty';    // Fora do Horário / Folga

export interface ProfessionalLiveState {
  professionalId: string;
  professionalName: string;
  status: ProfessionalLiveStatusType;
  statusLabel: string;
  badgeColor: string;
  currentAppointment?: Appointment;
  nextAppointment?: Appointment;
  completedTodayCount: number;
  totalTodayCount: number;
  todayRevenue: number;
  minutesRemainingInService?: number;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
  status?: string;
}

export interface GoogleCalendarSyncState {
  isConnected: boolean;
  userEmail: string | null;
  userName: string | null;
  userAvatar: string | null;
  lastSyncedAt: string | null;
  isSyncing: boolean;
  totalEventsSynced: number;
}

