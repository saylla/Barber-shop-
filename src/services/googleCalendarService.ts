import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Appointment, GoogleCalendarEvent, Professional, Service, ShopSettings } from '../types';

export const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
];

// Initialize Firebase App safely (singleton)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
GOOGLE_CALENDAR_SCOPES.forEach((scope) => {
  provider.addScope(scope);
});
provider.setCustomParameters({
  prompt: 'select_account',
});

// Flag for active sign-in flow
let isSigningIn = false;
// Cache access token in memory only
let cachedAccessToken: string | null = null;
let cachedUser: User | null = null;

export const initGoogleCalendarAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      cachedUser = user;
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // User logged in on Firebase but access token might need fresh popup for scopes
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedUser = null;
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const signInWithGoogleCalendar = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error('Falha ao obter o token de acesso da conta Google.');
    }

    cachedAccessToken = credential.accessToken;
    cachedUser = result.user;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Erro na autenticação do Google Calendar:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCalendarAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const getCachedGoogleUser = (): User | null => {
  return cachedUser;
};

export const logoutGoogleCalendar = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  cachedUser = null;
};

/**
 * Format local ISO string for Google Calendar API
 */
function buildDateTimeISO(dateStr: string, timeStr: string): string {
  // Ensure "YYYY-MM-DD" and "HH:MM"
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  const dt = new Date(year, month - 1, day, hours, minutes, 0);
  return dt.toISOString();
}

/**
 * Calculate end time ISO
 */
function buildEndDateTimeISO(dateStr: string, timeStr: string, durationMinutes: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  const dt = new Date(year, month - 1, day, hours, minutes + durationMinutes, 0);
  return dt.toISOString();
}

/**
 * Create an event on Google Calendar using the Google Calendar REST API
 */
export async function createGoogleCalendarEvent(
  appointment: Appointment,
  service: Service,
  professional: Professional,
  settings: ShopSettings,
  explicitToken?: string
): Promise<{ success: boolean; eventId?: string; htmlLink?: string; error?: string }> {
  const token = explicitToken || cachedAccessToken;
  if (!token) {
    return {
      success: false,
      error: 'Não autenticado no Google Calendar. Conecte sua conta Google.',
    };
  }

  const startISO = buildDateTimeISO(appointment.date, appointment.time);
  const endISO = buildEndDateTimeISO(appointment.date, appointment.time, appointment.durationMinutes || service.durationMinutes);

  const eventPayload = {
    summary: `✂️ BarberFlow: ${service.name} com ${professional.name}`,
    description: `Agendamento na ${settings.name}\n\n` +
      `👤 Cliente: ${appointment.customerName}\n` +
      `📞 Contato: ${appointment.customerPhone}\n` +
      `💈 Serviço: ${service.name} (${service.durationMinutes} min)\n` +
      `✂️ Barbeiro: ${professional.name}\n` +
      `💰 Valor: R$ ${appointment.price.toFixed(2)}\n` +
      `🎫 Código da Reserva: #${appointment.code}\n` +
      `📍 Endereço: ${settings.address}, ${settings.city}\n\n` +
      (appointment.notes ? `Observações: ${appointment.notes}\n\n` : '') +
      `Gerado automaticamente pelo BarberFlow.`,
    location: `${settings.address}, ${settings.city}`,
    start: {
      dateTime: startISO,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo',
    },
    end: {
      dateTime: endISO,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 24 * 60 }, // 1 dia antes
        { method: 'popup', minutes: 60 },      // 1 hora antes
        { method: 'popup', minutes: 15 },      // 15 min antes
      ],
    },
    colorId: '5', // Yellow / Gold tone in Google Calendar
  };

  try {
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventPayload),
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('Google Calendar API Error:', errData);
      return {
        success: false,
        error: errData?.error?.message || `Erro ${response.status} ao criar evento no Google Calendar`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      eventId: data.id,
      htmlLink: data.htmlLink,
    };
  } catch (err: any) {
    console.error('Falha de rede ao conectar ao Google Calendar:', err);
    return {
      success: false,
      error: err.message || 'Falha de comunicação com o Google Calendar.',
    };
  }
}

/**
 * List events from primary calendar to check schedule or view upcoming synced items
 */
export async function listGoogleCalendarEvents(
  timeMin?: string,
  timeMax?: string,
  explicitToken?: string
): Promise<{ success: boolean; events: GoogleCalendarEvent[]; error?: string }> {
  const token = explicitToken || cachedAccessToken;
  if (!token) {
    return { success: false, events: [], error: 'Token não disponível' };
  }

  try {
    const params = new URLSearchParams({
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '50',
    });

    if (timeMin) params.set('timeMin', timeMin);
    if (timeMax) params.set('timeMax', timeMax);

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return {
        success: false,
        events: [],
        error: errData?.error?.message || `Erro ${response.status} ao consultar agenda`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      events: data.items || [],
    };
  } catch (err: any) {
    return {
      success: false,
      events: [],
      error: err.message || 'Erro ao buscar eventos do Google Calendar',
    };
  }
}

/**
 * Delete / Unlink an event from Google Calendar
 */
export async function deleteGoogleCalendarEvent(
  eventId: string,
  explicitToken?: string
): Promise<{ success: boolean; error?: string }> {
  const token = explicitToken || cachedAccessToken;
  if (!token) {
    return { success: false, error: 'Token não disponível' };
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok && response.status !== 404) {
      const errData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errData?.error?.message || `Erro ${response.status} ao remover evento`,
      };
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Erro ao remover evento do Google Calendar',
    };
  }
}
