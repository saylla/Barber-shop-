import {
  generateVoucherFullText,
  generateVoucherHtmlEmail,
} from './calendarUtils';
import { EmailDiagnostics, EmailLog } from '../types';

export interface SendEmailPayload {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  customerName?: string;
  appointmentCode?: string;
  shopName?: string;
  customSmtp?: {
    provider?: 'resend' | 'sendgrid' | 'gmail' | 'custom';
    apiKey?: string;
    host?: string;
    port?: number;
    user?: string;
    pass?: string;
    from?: string;
  };
}

export interface EmailSendResult {
  success: boolean;
  message: string;
  provider?: string;
  previewUrl?: string | false;
  error?: string;
  log?: EmailLog;
}

/**
 * Sends transactional email via the backend /api/send-email service
 */
export async function sendEmailService(payload: SendEmailPayload): Promise<EmailSendResult> {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      return {
        success: false,
        message: data.error || 'Falha ao enviar e-mail pelo servidor.',
        error: data.error,
        log: data.log,
        provider: data.provider,
      };
    }

    return {
      success: true,
      message: data.message || `E-mail enviado com sucesso para ${payload.to}`,
      provider: data.provider,
      previewUrl: data.previewUrl,
      log: data.log,
    };
  } catch (err: any) {
    console.warn('Network / API error when calling /api/send-email:', err);
    return {
      success: false,
      message: 'Não foi possível conectar ao servidor de e-mail local.',
      error: err?.message,
    };
  }
}

/**
 * Automated appointment confirmation email dispatcher
 */
export async function dispatchAppointmentEmail(params: {
  to: string;
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
  customSmtp?: {
    provider?: 'resend' | 'sendgrid' | 'gmail' | 'custom';
    apiKey?: string;
    host?: string;
    port?: number;
    user?: string;
    pass?: string;
    from?: string;
  };
}): Promise<EmailSendResult> {
  if (!params.to || !params.to.includes('@')) {
    return {
      success: false,
      message: 'Endereço de e-mail inválido.',
    };
  }

  const subject = `✂️ Voucher & Confirmação #${params.code} - ${params.shopName}`;
  const text = generateVoucherFullText(params);
  const html = generateVoucherHtmlEmail(params);

  return sendEmailService({
    to: params.to,
    subject,
    text,
    html,
    customerName: params.customerName,
    appointmentCode: params.code,
    shopName: params.shopName,
    customSmtp: params.customSmtp,
  });
}

/**
 * Send a test email using custom SMTP or API settings
 */
export async function sendTestSmtpEmail(
  to: string,
  customSmtp?: {
    provider?: 'resend' | 'sendgrid' | 'gmail' | 'custom';
    apiKey?: string;
    host?: string;
    port?: number;
    user?: string;
    pass?: string;
    from?: string;
  },
  shopName: string = 'BarberFlow'
): Promise<EmailSendResult> {
  const providerLabel = customSmtp?.provider === 'resend'
    ? 'Resend API REST'
    : customSmtp?.provider === 'sendgrid'
    ? 'SendGrid API'
    : customSmtp?.host || 'Servidor Padrão';

  const subject = `💈 Teste de Conexão Transacional - ${shopName}`;
  const now = new Date().toLocaleString('pt-BR');
  const text = `Parabéns! Sua configuração de envio de e-mails no BarberFlow está funcionando perfeitamente.\n\nData do teste: ${now}\nProvedor: ${providerLabel}\nDestinatário: ${to}`;
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #121216; color: #f4f4f5; padding: 32px; border-radius: 18px; border: 1px solid #27272a; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #f59e0b; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">💈 ${shopName}</h1>
        <p style="color: #a1a1aa; font-size: 13px; margin-top: 6px; text-transform: uppercase; letter-spacing: 1px;">Teste de Conexão de E-mail Transacional</p>
      </div>
      <div style="background: #18181b; border: 1px solid #10b981; border-radius: 14px; padding: 22px; margin-bottom: 20px;">
        <div style="color: #10b981; font-weight: 800; font-size: 16px; margin-bottom: 8px; display: flex; align-items: center;">
          ✅ Conexão Estabelecida com Sucesso!
        </div>
        <p style="color: #d4d4d8; font-size: 14px; line-height: 1.6; margin: 0;">
          Este e-mail confirma que o canal de envio do <strong>${shopName}</strong> está 100% ativo e pronto para entregar comprovantes e confirmações de agendamento em tempo real diretamente na caixa de entrada dos seus clientes.
        </p>
      </div>
      <div style="background: #09090b; border: 1px solid #27272a; border-radius: 12px; padding: 14px; margin-bottom: 20px; font-size: 13px; color: #a1a1aa;">
        <div style="margin-bottom: 4px;"><strong style="color: #e4e4e7;">Canal / Provedor:</strong> ${providerLabel}</div>
        <div style="margin-bottom: 4px;"><strong style="color: #e4e4e7;">Destino:</strong> ${to}</div>
        <div><strong style="color: #e4e4e7;">Horário do Disparo:</strong> ${now}</div>
      </div>
      <div style="font-size: 11px; color: #71717a; border-top: 1px solid #27272a; padding-top: 16px; text-align: center;">
        BarberFlow Platform • Gestão e Agendamento Premium para Barbearias
      </div>
    </div>
  `;

  return sendEmailService({
    to,
    subject,
    text,
    html,
    customerName: 'Administrador',
    appointmentCode: 'TEST',
    shopName,
    customSmtp,
  });
}

/**
 * Fetch detailed email diagnostics & error logs
 */
export async function fetchEmailDiagnostics(): Promise<EmailDiagnostics> {
  try {
    const res = await fetch('/api/email/diagnostics');
    if (!res.ok) throw new Error('Failed to load diagnostics');
    return await res.json();
  } catch (err) {
    return {
      status: 'offline',
      hasConfiguredSmtp: false,
      configuredProvider: 'Offline / Indisponível',
      detectedEnvServices: {
        hasResend: false,
        hasSendGrid: false,
        hasSmtp: false,
      },
      totalEmailsSent: 0,
      lastSentAt: null,
      logs: [],
    };
  }
}

/**
 * Checks email server health and configuration
 */
export async function checkEmailServerStatus() {
  try {
    const res = await fetch('/api/email-status');
    return await res.json();
  } catch {
    return {
      status: 'offline',
      hasConfiguredSmtp: false,
      totalEmailsSent: 0,
    };
  }
}

/**
 * Fetches server email delivery logs
 */
export async function fetchEmailLogs(): Promise<{ logs: EmailLog[]; total: number }> {
  try {
    const res = await fetch('/api/email-logs');
    return await res.json();
  } catch {
    return { logs: [], total: 0 };
  }
}

/**
 * Clears server email delivery logs
 */
export async function clearEmailLogs(): Promise<boolean> {
  try {
    const res = await fetch('/api/email/clear-logs', { method: 'POST' });
    return res.ok;
  } catch {
    return false;
  }
}

