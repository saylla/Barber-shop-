import {
  Appointment,
  BlockedTime,
  BusinessHours,
  Professional,
  ProfessionalLiveState,
  Service,
} from '../types';

export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const WEEKDAY_FULL = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sábado'
];

/**
 * Format price into Brazilian Reais
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Parses "HH:mm" into minutes from start of day
 */
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Formats minutes from start of day back to "HH:mm"
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Checks if two intervals [startA, endA) and [startB, endB) overlap
 */
export function intervalsOverlap(startA: number, endA: number, startB: number, endB: number): boolean {
  return Math.max(startA, startB) < Math.min(endA, endB);
}

/**
 * Format ISO date string "YYYY-MM-DD" into readable Brazilian format
 */
export function formatDateBR(dateStr: string, includeWeekday = false): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  
  const date = new Date(year, month - 1, day);
  const dayStr = String(day).padStart(2, '0');
  const monthName = MONTH_NAMES[month - 1];
  
  if (includeWeekday) {
    const weekday = WEEKDAY_FULL[date.getDay()];
    return `${weekday}, ${dayStr} de ${monthName} de ${year}`;
  }
  return `${dayStr} de ${monthName} de ${year}`;
}

/**
 * Get current date string in "YYYY-MM-DD"
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns whether a date "YYYY-MM-DD" is in the past compared to today
 */
export function isPastDate(dateStr: string): boolean {
  const today = getTodayDateString();
  return dateStr < today;
}

export interface DaySlotInfo {
  time: string; // "14:30"
  available: boolean;
  reason?: 'past' | 'lunch' | 'booked' | 'blocked' | 'outside_hours';
}

/**
 * Computes all available time slots for a specific professional, service, and date
 */
export function calculateAvailableSlots(params: {
  date: string; // "YYYY-MM-DD"
  service: Service;
  professional: Professional;
  allProfessionals: Professional[];
  businessHours: BusinessHours;
  appointments: Appointment[];
  blockedTimes: BlockedTime[];
  slotIntervalMinutes?: number;
}): DaySlotInfo[] {
  const {
    date,
    service,
    professional,
    businessHours,
    appointments,
    blockedTimes,
    slotIntervalMinutes = 30
  } = params;

  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay(); // 0 = Sun, 1 = Mon...

  // 1. Check shop business hours
  const shopDayHours = businessHours[dayOfWeek];
  if (!shopDayHours || !shopDayHours.isOpen) {
    return [];
  }

  // 2. Check professional working day
  if (!professional.workingDays.includes(dayOfWeek)) {
    return [];
  }

  // 3. Check professional days off
  if (professional.daysOff.includes(date)) {
    return [];
  }

  // Working window (intersection of shop hours and professional hours)
  const workStartMin = Math.max(
    timeToMinutes(shopDayHours.open),
    timeToMinutes(professional.startTime || '09:00')
  );
  const workEndMin = Math.min(
    timeToMinutes(shopDayHours.close),
    timeToMinutes(professional.endTime || '19:00')
  );

  const serviceDuration = service.durationMinutes || 30;
  const lunchStartMin = professional.lunchStart ? timeToMinutes(professional.lunchStart) : null;
  const lunchEndMin = professional.lunchEnd ? timeToMinutes(professional.lunchEnd) : null;

  // Active appointments for this professional on this date (not cancelled)
  const existingAppts = appointments.filter(
    (app) =>
      app.date === date &&
      app.professionalId === professional.id &&
      app.status !== 'cancelled'
  );

  // Blocked times for this professional or all on this date
  const existingBlocks = blockedTimes.filter(
    (block) =>
      block.date === date &&
      (block.professionalId === 'all' || block.professionalId === professional.id)
  );

  // Check if today to disable past slots
  const todayStr = getTodayDateString();
  const isToday = date === todayStr;
  const now = new Date();
  const currentMinutesFromMidnight = now.getHours() * 60 + now.getMinutes();

  const slots: DaySlotInfo[] = [];

  // Generate slots step by step
  for (let slotMin = workStartMin; slotMin + serviceDuration <= workEndMin; slotMin += slotIntervalMinutes) {
    const slotEndMin = slotMin + serviceDuration;
    const timeStr = minutesToTime(slotMin);

    // Rule: Past time today
    if (isToday && slotMin <= currentMinutesFromMidnight + 15) { // 15 min buffer
      slots.push({ time: timeStr, available: false, reason: 'past' });
      continue;
    }

    // Rule: Lunch break overlap
    if (
      lunchStartMin !== null &&
      lunchEndMin !== null &&
      intervalsOverlap(slotMin, slotEndMin, lunchStartMin, lunchEndMin)
    ) {
      slots.push({ time: timeStr, available: false, reason: 'lunch' });
      continue;
    }

    // Rule: Overlap with existing booked appointment
    const hasApptConflict = existingAppts.some((appt) => {
      const apptStart = timeToMinutes(appt.time);
      const apptEnd = apptStart + appt.durationMinutes;
      return intervalsOverlap(slotMin, slotEndMin, apptStart, apptEnd);
    });

    if (hasApptConflict) {
      slots.push({ time: timeStr, available: false, reason: 'booked' });
      continue;
    }

    // Rule: Overlap with blocked time
    const hasBlockConflict = existingBlocks.some((blk) => {
      const blkStart = timeToMinutes(blk.startTime);
      const blkEnd = timeToMinutes(blk.endTime);
      return intervalsOverlap(slotMin, slotEndMin, blkStart, blkEnd);
    });

    if (hasBlockConflict) {
      slots.push({ time: timeStr, available: false, reason: 'blocked' });
      continue;
    }

    // All clear!
    slots.push({ time: timeStr, available: true });
  }

  return slots;
}

/**
 * Checks if a specific day is generally available for booking with a professional
 */
export function isDayAvailable(
  dateStr: string,
  professional: Professional,
  businessHours: BusinessHours
): boolean {
  if (isPastDate(dateStr)) return false;
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay();

  const shopDayHours = businessHours[dayOfWeek];
  if (!shopDayHours || !shopDayHours.isOpen) return false;
  if (!professional.workingDays.includes(dayOfWeek)) return false;
  if (professional.daysOff.includes(dateStr)) return false;

  return true;
}

/**
 * Generates Google Calendar direct appointment link
 */
export function generateGoogleCalendarUrl(appointment: {
  title: string;
  description: string;
  location: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  durationMinutes: number;
}): string {
  const [year, month, day] = appointment.date.split('-');
  const [hour, min] = appointment.time.split(':');
  
  const startDate = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(min));
  const endDate = new Date(startDate.getTime() + appointment.durationMinutes * 60 * 1000);

  const formatGCalDate = (d: Date) => {
    return d.toISOString().replace(/-|:|\.\d+/g, '');
  };

  const datesParam = `${formatGCalDate(startDate)}/${formatGCalDate(endDate)}`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: appointment.title,
    details: appointment.description,
    location: appointment.location,
    dates: datesParam,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates and downloads an iCal (.ics) file
 */
export function downloadIcsFile(appointment: {
  code: string;
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  durationMinutes: number;
}): void {
  const [year, month, day] = appointment.date.split('-');
  const [hour, min] = appointment.time.split(':');
  const startDate = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(min));
  const endDate = new Date(startDate.getTime() + appointment.durationMinutes * 60 * 1000);

  const formatIcsDate = (d: Date) => {
    return d.toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15) + 'Z';
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BarberFlow//Agendamentos//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${appointment.code}-${Date.now()}@barberflow.com`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(startDate)}`,
    `DTEND:${formatIcsDate(endDate)}`,
    `SUMMARY:${appointment.title}`,
    `DESCRIPTION:${appointment.description.replace(/\n/g, '\\n')}`,
    `LOCATION:${appointment.location}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `BarberFlow-${appointment.code}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Builds WhatsApp formatted message and direct send link
 */
export function buildWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const encodedMsg = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
}

export function generateBookingWhatsAppMessage(params: {
  customerName: string;
  serviceName: string;
  professionalName: string;
  dateStr: string;
  timeStr: string;
  price: number;
  shopName: string;
  code: string;
  address?: string;
}): string {
  return `✂️ *${params.shopName}*
Olá, *${params.customerName}*! Seu agendamento foi *CONFIRMADO* com sucesso.

📋 *Detalhes do Agendamento:*
• *Código:* #${params.code}
• *Serviço:* ${params.serviceName}
• *Profissional:* ${params.professionalName}
• *Data:* ${formatDateBR(params.dateStr, true)}
• *Horário:* ${params.timeStr}
• *Valor:* ${formatCurrency(params.price)}
${params.address ? `• *Endereço:* ${params.address}\n` : ''}
📍 Chegue com 5 minutos de antecedência.
Agradecemos a preferência! Te aguardamos na barbearia.`;
}

export function generateRescheduleWhatsAppMessage(params: {
  customerName: string;
  serviceName: string;
  professionalName: string;
  dateStr: string;
  timeStr: string;
  price: number;
  shopName: string;
  code: string;
  customNote?: string;
}): string {
  return `🗓️ *${params.shopName} - REAGENDAMENTO*
Olá, *${params.customerName}*!

Seu agendamento foi atualizado para uma nova data/horário:

📋 *Novo Horário Confirmado:*
• *Código:* #${params.code}
• *Serviço:* ${params.serviceName}
• *Profissional:* ${params.professionalName}
• *Nova Data:* ${formatDateBR(params.dateStr, true)}
• *Novo Horário:* ${params.timeStr}
• *Valor:* ${formatCurrency(params.price)}
${params.customNote ? `\n💬 *Mensagem do Barbeiro:* ${params.customNote}\n` : ''}
Caso precise de qualquer ajuste, responda esta mensagem!`;
}

export function generateDeclineWhatsAppMessage(params: {
  customerName: string;
  serviceName: string;
  professionalName: string;
  dateStr: string;
  timeStr: string;
  shopName: string;
  code: string;
  reason?: string;
}): string {
  return `⚠️ *${params.shopName}*
Olá, *${params.customerName}*.

Informamos que, infelizmente, não conseguimos confirmar seu agendamento para *${formatDateBR(params.dateStr)} às ${params.timeStr}* com *${params.professionalName}*.

${params.reason ? `📌 *Motivo:* ${params.reason}\n` : ''}
Gostaria de agendar para outro horário ou com outro profissional disponível? Estamos à disposição para encontrar o melhor horário para você!`;
}

export function generateReminderWhatsAppMessage(params: {
  customerName: string;
  serviceName: string;
  professionalName: string;
  dateStr: string;
  timeStr: string;
  shopName: string;
  code: string;
}): string {
  return `🔔 *LEMBRETE DE HORÁRIO - ${params.shopName}*
Fala, *${params.customerName}*! Passando para lembrar do seu horário hoje:

• *Serviço:* ${params.serviceName}
• *Barbeiro:* ${params.professionalName}
• *Horário:* hoje às *${params.timeStr}*
• *Código:* #${params.code}

Cerveja e café prontos te esperando! Até logo.`;
}

export function generateThankYouWhatsAppMessage(params: {
  customerName: string;
  serviceName: string;
  professionalName: string;
  shopName: string;
}): string {
  return `⭐ *Obrigado pela visita! - ${params.shopName}*
Fala, *${params.customerName}*! Esperamos que tenha curtido o seu *${params.serviceName}* com o barbeiro *${params.professionalName}*.

Foi um prazer te atender! Se puder deixar uma avaliação, nos ajuda muito.
Até o próximo corte! 💈`;
}

/**
 * Replaces tags like {cliente}, {data}, {horario}, {barbeiro}, {servico}, {valor}, {codigo}, {barbearia}, {motivo}
 */
export function replaceMessagePlaceholders(
  template: string,
  variables: {
    cliente?: string;
    barbeiro?: string;
    servico?: string;
    data?: string;
    horario?: string;
    valor?: string;
    codigo?: string;
    barbearia?: string;
    endereco?: string;
    motivo?: string;
  }
): string {
  let result = template;
  if (variables.cliente) result = result.replace(/{cliente}/gi, variables.cliente);
  if (variables.barbeiro) result = result.replace(/{barbeiro}/gi, variables.barbeiro);
  if (variables.servico) result = result.replace(/{servico}/gi, variables.servico);
  if (variables.data) result = result.replace(/{data}/gi, variables.data);
  if (variables.horario) result = result.replace(/{horario}/gi, variables.horario);
  if (variables.valor) result = result.replace(/{valor}/gi, variables.valor);
  if (variables.codigo) result = result.replace(/{codigo}/gi, variables.codigo);
  if (variables.barbearia) result = result.replace(/{barbearia}/gi, variables.barbearia);
  if (variables.endereco) result = result.replace(/{endereco}/gi, variables.endereco);
  if (variables.motivo) result = result.replace(/{motivo}/gi, variables.motivo);
  return result;
}

/**
 * Normalizes a Brazilian phone number to standard international format (e.g. 5511999999999)
 */
export function cleanPhoneNumber(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  // If already starts with 55 and has 12 or 13 digits, return as is
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }
  // If 10 or 11 digits (e.g. 11988887777), prepend Brazil country code 55
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
}

/**
 * Builds direct WhatsApp Click to Chat URL
 */
export function generateWhatsAppUrl(phone: string, text: string): string {
  const clean = cleanPhoneNumber(phone);
  const encodedText = encodeURIComponent(text);
  if (clean) {
    return `https://wa.me/${clean}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}

/**
 * Builds direct SMS URI
 */
export function generateSmsUrl(phone: string, text: string): string {
  const clean = cleanPhoneNumber(phone);
  const encodedText = encodeURIComponent(text);
  if (clean) {
    return `sms:${clean}?body=${encodedText}`;
  }
  return `sms:?body=${encodedText}`;
}

/**
 * Builds mailto: URL with subject and body
 */
export function generateMailtoUrl(to: string, subject: string, body: string): string {
  const encodedTo = encodeURIComponent(to || '');
  const encodedSub = encodeURIComponent(subject || '');
  const encodedBody = encodeURIComponent(body || '');
  return `mailto:${encodedTo}?subject=${encodedSub}&body=${encodedBody}`;
}

/**
 * Builds direct Gmail web compose URL
 */
export function generateGmailComposeUrl(to: string, subject: string, body: string): string {
  const encodedTo = encodeURIComponent(to || '');
  const encodedSub = encodeURIComponent(subject || '');
  const encodedBody = encodeURIComponent(body || '');
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodedTo}&su=${encodedSub}&body=${encodedBody}`;
}

/**
 * Builds direct Outlook web compose URL
 */
export function generateOutlookComposeUrl(to: string, subject: string, body: string): string {
  const encodedTo = encodeURIComponent(to || '');
  const encodedSub = encodeURIComponent(subject || '');
  const encodedBody = encodeURIComponent(body || '');
  return `https://outlook.live.com/mail/0/deeplink/compose?to=${encodedTo}&subject=${encodedSub}&body=${encodedBody}`;
}

/**
 * Generates compact SMS text for voucher
 */
export function generateVoucherSmsMessage(params: {
  customerName: string;
  serviceName: string;
  professionalName: string;
  dateStr: string;
  timeStr: string;
  price: number;
  shopName: string;
  code: string;
  address?: string;
}): string {
  return `${params.shopName}: Reserva #${params.code} confirmada para ${params.customerName}! ${params.serviceName} com ${params.professionalName} em ${formatDateBR(params.dateStr)} as ${params.timeStr}. Valor: ${formatCurrency(params.price)}. Local: ${params.address || 'Barbearia'}`;
}

/**
 * Generates full plain text voucher for emails and clipboard
 */
export function generateVoucherFullText(params: {
  customerName: string;
  serviceName: string;
  professionalName: string;
  dateStr: string;
  timeStr: string;
  durationMinutes: number;
  price: number;
  shopName: string;
  shopEmail?: string;
  phone?: string;
  code: string;
  address?: string;
}): string {
  return `========================================
💈 ${params.shopName.toUpperCase()} - VOUCHER DE AGENDAMENTO
========================================
Código da Reserva: #${params.code}
Status: CONFIRMADO & HORÁRIO GARANTIDO

DADOS DO CLIENTE:
• Nome: ${params.customerName}

DETALHES DO ATENDIMENTO:
• Serviço: ${params.serviceName}
• Profissional: ${params.professionalName}
• Data: ${formatDateBR(params.dateStr, true)}
• Horário: ${params.timeStr} (${params.durationMinutes} min)
• Valor: ${formatCurrency(params.price)} (Pagamento no local)

LOCAL DO ATENDIMENTO:
• Barbearia: ${params.shopName}
• Endereço: ${params.address || 'Consulte o estabelecimento'}
• Contato / WhatsApp: ${params.phone || ''}

ORIENTAÇÕES:
- Por favor, chegue com 5 minutos de antecedência.
- Para reagendar ou cancelar com antecedência, entre em contato pelo nosso WhatsApp.

Agradecemos a sua preferência!
========================================`;
}

/**
 * Generates modern, responsive HTML email template for confirmation and vouchers
 */
export function generateVoucherHtmlEmail(params: {
  customerName: string;
  serviceName: string;
  professionalName: string;
  dateStr: string;
  timeStr: string;
  durationMinutes: number;
  price: number;
  shopName: string;
  shopEmail?: string;
  phone?: string;
  code: string;
  address?: string;
  statusText?: string;
}): string {
  const gcalUrl = generateGoogleCalendarUrl({
    title: `${params.serviceName} - ${params.shopName}`,
    description: `Agendamento #${params.code} com ${params.professionalName}.\nEndereço: ${params.address || ''}`,
    location: params.address || params.shopName,
    date: params.dateStr,
    time: params.timeStr,
    durationMinutes: params.durationMinutes,
  });

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Voucher #${params.code} - ${params.shopName}</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
    <!-- Header Banner -->
    <tr>
      <td style="padding: 28px 24px; background: linear-gradient(180deg, #27272a 0%, #18181b 100%); border-bottom: 2px solid #f59e0b; text-align: center;">
        <span style="display: inline-block; background-color: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px;">
          ✂️ ${params.statusText || 'Agendamento Confirmado'}
        </span>
        <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">${params.shopName}</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #a1a1aa;">Comprovante e Voucher de Atendimento</p>
      </td>
    </tr>

    <!-- Voucher Code Spotlight -->
    <tr>
      <td style="padding: 24px; text-align: center; background-color: #121215; border-bottom: 1px solid #27272a;">
        <span style="font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; display: block; margin-bottom: 4px;">Código da sua Reserva</span>
        <div style="display: inline-block; padding: 8px 20px; background-color: rgba(245, 158, 11, 0.1); border: 1px dashed #f59e0b; border-radius: 12px; font-size: 20px; font-weight: 900; font-family: monospace; color: #fbbf24; letter-spacing: 2px;">
          #${params.code}
        </div>
      </td>
    </tr>

    <!-- Body Details -->
    <tr>
      <td style="padding: 24px;">
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #e4e4e7;">
          Olá, <strong style="color: #ffffff;">${params.customerName}</strong>! Seu horário está confirmado com sucesso.
        </p>

        <!-- Grid Cards -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px;">
          <tr>
            <td width="48%" style="padding: 14px; background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; vertical-align: top;">
              <span style="font-size: 10px; text-transform: uppercase; color: #71717a; font-weight: bold; display: block; margin-bottom: 4px;">📅 Data</span>
              <strong style="font-size: 13px; color: #ffffff;">${formatDateBR(params.dateStr, true)}</strong>
            </td>
            <td width="4%"></td>
            <td width="48%" style="padding: 14px; background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; vertical-align: top;">
              <span style="font-size: 10px; text-transform: uppercase; color: #71717a; font-weight: bold; display: block; margin-bottom: 4px;">⏰ Horário</span>
              <strong style="font-size: 13px; color: #fbbf24;">${params.timeStr} (${params.durationMinutes} min)</strong>
            </td>
          </tr>
          <tr><td height="10" colspan="3"></td></tr>
          <tr>
            <td width="48%" style="padding: 14px; background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; vertical-align: top;">
              <span style="font-size: 10px; text-transform: uppercase; color: #71717a; font-weight: bold; display: block; margin-bottom: 4px;">✂️ Serviço</span>
              <strong style="font-size: 13px; color: #ffffff;">${params.serviceName}</strong>
            </td>
            <td width="4%"></td>
            <td width="48%" style="padding: 14px; background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; vertical-align: top;">
              <span style="font-size: 10px; text-transform: uppercase; color: #71717a; font-weight: bold; display: block; margin-bottom: 4px;">💈 Barbeiro</span>
              <strong style="font-size: 13px; color: #ffffff;">${params.professionalName}</strong>
            </td>
          </tr>
        </table>

        <!-- Price & Address Box -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
          <tr>
            <td style="vertical-align: middle;">
              <span style="font-size: 11px; color: #71717a; display: block;">Valor Total:</span>
              <span style="font-size: 18px; font-weight: 900; color: #fbbf24;">${formatCurrency(params.price)}</span>
              <span style="font-size: 10px; color: #52525b; display: block;">(Pagamento direto no estabelecimento)</span>
            </td>
            <td style="text-align: right; vertical-align: middle;">
              <span style="font-size: 11px; color: #71717a; display: block;">Localização:</span>
              <strong style="font-size: 12px; color: #e4e4e7; display: block;">${params.address || params.shopName}</strong>
              <span style="font-size: 11px; color: #a1a1aa; display: block;">Tel/WhatsApp: ${params.phone || ''}</span>
            </td>
          </tr>
        </table>

        <!-- Action Button (Save to Google Calendar) -->
        <div style="text-align: center; margin-bottom: 12px;">
          <a href="${gcalUrl}" target="_blank" style="display: inline-block; background-color: #f59e0b; color: #000000; font-weight: 800; font-size: 13px; text-decoration: none; padding: 12px 24px; border-radius: 12px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
            📅 Salvar no Google Agenda
          </a>
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 20px; background-color: #09090b; border-top: 1px solid #27272a; text-align: center; font-size: 11px; color: #71717a;">
        <p style="margin: 0 0 6px 0;">Por favor, chegue com 5 minutos de antecedência.</p>
        <p style="margin: 0;">${params.shopName} • Atendimento Exclusivo</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Computes real-time dynamic status for a professional on a given date and time:
 * - "in_service" (Em Atendimento)
 * - "completed" (Concluído / Atendimentos do dia finalizados)
 * - "available" (Disponível)
 * - "lunch" (Pausa / Almoço)
 * - "off_duty" (Fora de Turno / Folga)
 */
export function calculateProfessionalLiveState(params: {
  professional: Professional;
  appointments: Appointment[];
  dateStr?: string;
  nowMinutes?: number;
}): ProfessionalLiveState {
  const { professional, appointments } = params;
  const today = getTodayDateString();
  const dateStr = params.dateStr || today;

  const now = new Date();
  const nowMinutes =
    params.nowMinutes !== undefined
      ? params.nowMinutes
      : now.getHours() * 60 + now.getMinutes();

  const [y, m, d] = dateStr.split('-').map(Number);
  const dayOfWeek = new Date(y, m - 1, d).getDay();

  // Active appointments for this professional today
  const profApptsToday = appointments.filter(
    (a) =>
      a.professionalId === professional.id &&
      a.date === dateStr &&
      a.status !== 'cancelled' &&
      a.status !== 'declined'
  );

  const completedTodayCount = profApptsToday.filter((a) => a.status === 'completed').length;
  const totalTodayCount = profApptsToday.length;
  const todayRevenue = profApptsToday
    .filter((a) => a.status === 'completed' || a.status === 'confirmed')
    .reduce((sum, a) => sum + a.price, 0);

  // Check if off duty (not working today or day off)
  const isWorkingDay = professional.workingDays.includes(dayOfWeek);
  const isDayOff = professional.daysOff?.includes(dateStr);
  const profStart = timeToMinutes(professional.startTime || '09:00');
  const profEnd = timeToMinutes(professional.endTime || '19:30');

  if (!isWorkingDay || isDayOff || !professional.active) {
    return {
      professionalId: professional.id,
      professionalName: professional.name,
      status: 'off_duty',
      statusLabel: 'Folga / Indisponível',
      badgeColor: 'bg-zinc-800 text-zinc-400 border-zinc-700',
      completedTodayCount,
      totalTodayCount,
      todayRevenue,
    };
  }

  // Check if currently on lunch
  const lunchStart = professional.lunchStart ? timeToMinutes(professional.lunchStart) : 0;
  const lunchEnd = professional.lunchEnd ? timeToMinutes(professional.lunchEnd) : 0;
  if (lunchStart > 0 && lunchEnd > 0 && nowMinutes >= lunchStart && nowMinutes < lunchEnd) {
    return {
      professionalId: professional.id,
      professionalName: professional.name,
      status: 'lunch',
      statusLabel: `Pausa / Almoço (retorna às ${professional.lunchEnd})`,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      completedTodayCount,
      totalTodayCount,
      todayRevenue,
    };
  }

  // Check if currently in an active service
  const currentAppt = profApptsToday.find((a) => {
    if (a.status === 'cancelled' || a.status === 'declined') return false;
    const start = timeToMinutes(a.time);
    const end = start + a.durationMinutes;
    return nowMinutes >= start && nowMinutes < end;
  });

  if (currentAppt) {
    const start = timeToMinutes(currentAppt.time);
    const end = start + currentAppt.durationMinutes;
    const minutesRemaining = Math.max(0, end - nowMinutes);

    return {
      professionalId: professional.id,
      professionalName: professional.name,
      status: 'in_service',
      statusLabel: `Em Atendimento (${minutesRemaining} min rest.)`,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse',
      currentAppointment: currentAppt,
      completedTodayCount,
      totalTodayCount,
      todayRevenue,
      minutesRemainingInService: minutesRemaining,
    };
  }

  // Upcoming appointments today sorted by time
  const upcomingToday = profApptsToday
    .filter((a) => a.status !== 'cancelled' && a.status !== 'declined')
    .filter((a) => timeToMinutes(a.time) >= nowMinutes)
    .sort((a, b) => a.time.localeCompare(b.time));

  const nextAppt = upcomingToday[0];

  // Check if all today's appointments are completed
  const pendingOrConfirmedFuture = profApptsToday.filter((a) => {
    if (a.status === 'completed' || a.status === 'cancelled' || a.status === 'declined') return false;
    const end = timeToMinutes(a.time) + a.durationMinutes;
    return end > nowMinutes;
  });

  if (totalTodayCount > 0 && pendingOrConfirmedFuture.length === 0 && (nowMinutes >= profEnd || completedTodayCount === totalTodayCount)) {
    return {
      professionalId: professional.id,
      professionalName: professional.name,
      status: 'completed',
      statusLabel: 'Concluído (Dia Finalizado)',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      nextAppointment: undefined,
      completedTodayCount,
      totalTodayCount,
      todayRevenue,
    };
  }

  // Check if before work start or after work end
  if (nowMinutes < profStart) {
    return {
      professionalId: professional.id,
      professionalName: professional.name,
      status: 'available',
      statusLabel: `Abre às ${professional.startTime}`,
      badgeColor: 'bg-zinc-800 text-zinc-300 border-zinc-700',
      nextAppointment: nextAppt,
      completedTodayCount,
      totalTodayCount,
      todayRevenue,
    };
  }

  if (nowMinutes >= profEnd) {
    return {
      professionalId: professional.id,
      professionalName: professional.name,
      status: 'completed',
      statusLabel: 'Turno Encerrado',
      badgeColor: 'bg-zinc-800 text-zinc-400 border-zinc-700',
      completedTodayCount,
      totalTodayCount,
      todayRevenue,
    };
  }

  // In working hours, no active client right now => Available
  return {
    professionalId: professional.id,
    professionalName: professional.name,
    status: 'available',
    statusLabel: nextAppt ? `Disponível (Próximo: ${nextAppt.time})` : 'Disponível / Livre',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    nextAppointment: nextAppt,
    completedTodayCount,
    totalTodayCount,
    todayRevenue,
  };
}


