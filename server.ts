import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export interface EmailLogEntry {
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

const emailLogs: EmailLogEntry[] = [];

// Helper function to send email via Resend REST API (HTTP)
async function sendViaResend(options: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ messageId: string; provider: string }> {
  const { apiKey, from, to, subject, html, text } = options;
  
  // Resend requires a valid from address. If using default unverified test domain without custom domain,
  // onboarding@resend.dev is allowed to delivered-to address or verified test addresses.
  let validFrom = from;
  if (!validFrom || validFrom.includes('no-reply@barberflow.com') || validFrom.includes('localhost')) {
    validFrom = 'BarberFlow <onboarding@resend.dev>';
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: validFrom,
      to: [to.trim()],
      subject,
      html,
      text: text || undefined,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `HTTP ${response.status} ao conectar na API do Resend`;
    throw new Error(`[Resend API]: ${errorMsg}`);
  }

  return {
    messageId: data?.id || `resend-${Date.now()}`,
    provider: 'Resend (API REST)',
  };
}

// Helper function to send email via SendGrid REST API (HTTP)
async function sendViaSendGrid(options: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ messageId: string; provider: string }> {
  const { apiKey, from, to, subject, html, text } = options;

  let senderEmail = from;
  let senderName = 'BarberFlow';
  
  const fromMatch = from.match(/^(?:"?([^"]*)"?\s)?<?([^>]+)>?$/);
  if (fromMatch) {
    senderName = fromMatch[1] || 'BarberFlow';
    senderEmail = fromMatch[2] || from;
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: to.trim() }],
          subject,
        },
      ],
      from: {
        email: senderEmail.includes('@') ? senderEmail : 'agendamentos@barberflow.com',
        name: senderName,
      },
      content: [
        {
          type: 'text/html',
          value: html,
        },
        ...(text
          ? [
              {
                type: 'text/plain',
                value: text,
              },
            ]
          : []),
      ],
    }),
  });

  if (!response.ok && response.status !== 202) {
    const data = await response.json().catch(() => ({}));
    const errorDetails = data?.errors?.map((e: any) => e.message).join(', ') || `HTTP ${response.status}`;
    throw new Error(`[SendGrid API]: ${errorDetails}`);
  }

  const messageIdHeader = response.headers.get('x-message-id');
  return {
    messageId: messageIdHeader || `sendgrid-${Date.now()}`,
    provider: 'SendGrid (API REST)',
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '5mb' }));

  // --- API ROUTES ---

  // Detailed Diagnostics and Status
  app.get('/api/email/diagnostics', (req, res) => {
    const hasResend = Boolean(process.env.RESEND_API_KEY);
    const hasSendGrid = Boolean(process.env.SENDGRID_API_KEY);
    const hasSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

    let activeProvider = 'Simulação em Memória / Ethereal Sandbox';
    if (hasResend) {
      activeProvider = 'Resend API REST (.env)';
    } else if (hasSendGrid) {
      activeProvider = 'SendGrid API REST (.env)';
    } else if (hasSmtp) {
      activeProvider = `SMTP (${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 587})`;
    }

    res.json({
      status: 'active',
      hasConfiguredSmtp: hasResend || hasSendGrid || hasSmtp,
      configuredProvider: activeProvider,
      detectedEnvServices: {
        hasResend,
        hasSendGrid,
        hasSmtp,
        smtpHost: process.env.SMTP_HOST || undefined,
        smtpUser: process.env.SMTP_USER ? `${process.env.SMTP_USER.substring(0, 3)}***` : undefined,
      },
      totalEmailsSent: emailLogs.length,
      lastSentAt: emailLogs.length > 0 ? emailLogs[0].sentAt : null,
      logs: emailLogs.slice(0, 50),
    });
  });

  // Legacy status endpoint
  app.get('/api/email-status', (req, res) => {
    const hasSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);
    const hasResend = Boolean(process.env.RESEND_API_KEY);
    const hasSendGrid = Boolean(process.env.SENDGRID_API_KEY);

    res.json({
      status: 'active',
      hasConfiguredSmtp: hasSmtp || hasResend || hasSendGrid,
      configuredProvider: hasResend
        ? 'Resend API'
        : hasSendGrid
        ? 'SendGrid API'
        : hasSmtp
        ? process.env.SMTP_HOST
        : 'Ethereal / Direct Dispatch',
      totalEmailsSent: emailLogs.length,
      lastSentAt: emailLogs.length > 0 ? emailLogs[0].sentAt : null,
    });
  });

  // Get email dispatch logs
  app.get('/api/email-logs', (req, res) => {
    res.json({
      logs: emailLogs.slice(0, 50),
      total: emailLogs.length,
    });
  });

  // Clear email logs
  app.post('/api/email/clear-logs', (req, res) => {
    emailLogs.length = 0;
    res.json({ success: true, message: 'Logs de e-mail limpos com sucesso.' });
  });

  // Send Email Endpoint
  app.post('/api/send-email', async (req, res) => {
    try {
      const {
        to,
        subject,
        html,
        text,
        customerName,
        appointmentCode,
        shopName = 'BarberFlow',
        customSmtp,
      } = req.body;

      if (!to || !subject) {
        return res.status(400).json({
          success: false,
          error: 'Destinatário ("to") e Assunto ("subject") são obrigatórios.',
        });
      }

      const logId = `email-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const fallbackHtml = html || `<p>${text || 'Seu agendamento foi registrado com sucesso!'}</p>`;

      // 1. CHECK FOR RESEND (Custom or ENV)
      const resendKey = (customSmtp?.apiKey && customSmtp.provider === 'resend')
        ? customSmtp.apiKey
        : (customSmtp?.apiKey && customSmtp.apiKey.startsWith('re_'))
        ? customSmtp.apiKey
        : process.env.RESEND_API_KEY;

      if (resendKey && (customSmtp?.provider === 'resend' || !customSmtp?.host)) {
        try {
          const fromAddress = customSmtp?.from || process.env.SMTP_FROM || `"${shopName}" <onboarding@resend.dev>`;
          const result = await sendViaResend({
            apiKey: resendKey,
            from: fromAddress,
            to,
            subject,
            html: fallbackHtml,
            text,
          });

          const logEntry: EmailLogEntry = {
            id: logId,
            to,
            subject,
            customerName,
            appointmentCode,
            sentAt: new Date().toISOString(),
            status: 'delivered',
            provider: result.provider,
            messageId: result.messageId,
          };

          emailLogs.unshift(logEntry);
          if (emailLogs.length > 100) emailLogs.pop();

          return res.json({
            success: true,
            message: `E-mail entregue com sucesso via Resend para ${to}!`,
            log: logEntry,
            provider: result.provider,
            messageId: result.messageId,
          });
        } catch (resendErr: any) {
          console.error('Resend delivery failed:', resendErr?.message);
          const logEntry: EmailLogEntry = {
            id: logId,
            to,
            subject,
            customerName,
            appointmentCode,
            sentAt: new Date().toISOString(),
            status: 'error',
            provider: 'Resend API REST',
            error: resendErr?.message || 'Erro ao disparar via Resend API',
          };
          emailLogs.unshift(logEntry);
          if (emailLogs.length > 100) emailLogs.pop();

          return res.status(500).json({
            success: false,
            error: resendErr?.message || 'Falha ao enviar via Resend API.',
            log: logEntry,
            provider: 'Resend API REST',
          });
        }
      }

      // 2. CHECK FOR SENDGRID REST API (Custom or ENV)
      const sendgridKey = (customSmtp?.apiKey && customSmtp.provider === 'sendgrid')
        ? customSmtp.apiKey
        : (customSmtp?.apiKey && customSmtp.apiKey.startsWith('SG.'))
        ? customSmtp.apiKey
        : process.env.SENDGRID_API_KEY;

      if (sendgridKey && (customSmtp?.provider === 'sendgrid' || !customSmtp?.host)) {
        try {
          const fromAddress = customSmtp?.from || process.env.SMTP_FROM || `"${shopName}" <agendamentos@barberflow.com>`;
          const result = await sendViaSendGrid({
            apiKey: sendgridKey,
            from: fromAddress,
            to,
            subject,
            html: fallbackHtml,
            text,
          });

          const logEntry: EmailLogEntry = {
            id: logId,
            to,
            subject,
            customerName,
            appointmentCode,
            sentAt: new Date().toISOString(),
            status: 'delivered',
            provider: result.provider,
            messageId: result.messageId,
          };

          emailLogs.unshift(logEntry);
          if (emailLogs.length > 100) emailLogs.pop();

          return res.json({
            success: true,
            message: `E-mail entregue com sucesso via SendGrid para ${to}!`,
            log: logEntry,
            provider: result.provider,
            messageId: result.messageId,
          });
        } catch (sgErr: any) {
          console.error('SendGrid delivery failed:', sgErr?.message);
          const logEntry: EmailLogEntry = {
            id: logId,
            to,
            subject,
            customerName,
            appointmentCode,
            sentAt: new Date().toISOString(),
            status: 'error',
            provider: 'SendGrid API REST',
            error: sgErr?.message || 'Erro ao disparar via SendGrid API',
          };
          emailLogs.unshift(logEntry);
          if (emailLogs.length > 100) emailLogs.pop();

          return res.status(500).json({
            success: false,
            error: sgErr?.message || 'Falha ao enviar via SendGrid API.',
            log: logEntry,
            provider: 'SendGrid API REST',
          });
        }
      }

      // 3. CHECK FOR SMTP TRANSPORTER (Gmail, Outlook, Hostinger, AWS SES, Custom SMTP)
      const host = (customSmtp?.host || process.env.SMTP_HOST || '').trim();
      const port = Number(customSmtp?.port || process.env.SMTP_PORT) || 465;
      const user = (customSmtp?.user || process.env.SMTP_USER || '').trim();
      const pass = (customSmtp?.pass || process.env.SMTP_PASS || '').replace(/\s+/g, '').trim();

      if (host && user && pass) {
        const isGmail = host.toLowerCase().includes('gmail');
        const isSecure = port === 465;

        let transportConfig: any;
        if (isGmail) {
          transportConfig = {
            service: 'gmail',
            auth: { user, pass },
            tls: { rejectUnauthorized: false },
            connectionTimeout: 12000,
            greetingTimeout: 12000,
          };
        } else {
          transportConfig = {
            host,
            port,
            secure: isSecure,
            auth: { user, pass },
            tls: { rejectUnauthorized: false },
            connectionTimeout: 12000,
            greetingTimeout: 12000,
          };
        }

        const transporter = nodemailer.createTransport(transportConfig);

        try {
          const fromAddress = customSmtp?.from || process.env.SMTP_FROM || `"${shopName}" <${user}>`;
          const info = await transporter.sendMail({
            from: fromAddress,
            to,
            subject,
            text: text || 'Voucher e confirmação de agendamento.',
            html: fallbackHtml,
          });

          const logEntry: EmailLogEntry = {
            id: logId,
            to,
            subject,
            customerName,
            appointmentCode,
            sentAt: new Date().toISOString(),
            status: 'delivered',
            provider: isGmail ? 'Gmail SMTP (Autenticado)' : `${host}:${port}`,
            messageId: info.messageId || `smtp-${Date.now()}`,
          };

          emailLogs.unshift(logEntry);
          if (emailLogs.length > 100) emailLogs.pop();

          return res.json({
            success: true,
            message: `E-mail enviado e entregue com sucesso para ${to}!`,
            log: logEntry,
            provider: logEntry.provider,
            messageId: info.messageId,
          });
        } catch (smtpErr: any) {
          console.error('SMTP delivery failed:', smtpErr);
          const rawErr = smtpErr?.message || 'Falha de conexão SMTP';
          let userFriendlyErr = rawErr;

          if (rawErr.includes('535') || rawErr.includes('BadCredentials') || rawErr.includes('Username and Password not accepted')) {
            userFriendlyErr = `Erro de Autenticação (535): Usuário ou senha incorretos. Se usa Gmail, certifique-se de usar uma 'Senha de App' de 16 caracteres em vez da senha normal da conta.`;
          } else if (rawErr.includes('ETIMEDOUT') || rawErr.includes('ESOCKETTIMEDOUT')) {
            userFriendlyErr = `Tempo limite esgotado ao conectar no servidor ${host}:${port}. Verifique se o host e a porta estão corretos.`;
          } else if (rawErr.includes('ENOTFOUND')) {
            userFriendlyErr = `Servidor SMTP não encontrado (${host}). Verifique a digitação do host.`;
          }

          const logEntry: EmailLogEntry = {
            id: logId,
            to,
            subject,
            customerName,
            appointmentCode,
            sentAt: new Date().toISOString(),
            status: 'error',
            provider: isGmail ? 'Gmail SMTP' : `${host}:${port}`,
            error: userFriendlyErr,
          };

          emailLogs.unshift(logEntry);
          if (emailLogs.length > 100) emailLogs.pop();

          return res.status(500).json({
            success: false,
            error: userFriendlyErr,
            log: logEntry,
            provider: logEntry.provider,
          });
        }
      }

      // 4. FALLBACK ZERO-CONFIG TESTER (Ethereal / Simulated)
      try {
        const testAccount = await nodemailer.createTestAccount();
        const testTransporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });

        const info = await testTransporter.sendMail({
          from: `"${shopName}" <no-reply@barberflow.com>`,
          to,
          subject,
          text: text || 'Voucher e confirmação de agendamento.',
          html: fallbackHtml,
        });

        const previewUrl = nodemailer.getTestMessageUrl(info as any) || false;
        const logEntry: EmailLogEntry = {
          id: logId,
          to,
          subject,
          customerName,
          appointmentCode,
          sentAt: new Date().toISOString(),
          status: 'simulated',
          provider: 'Ethereal Test Sandbox (Sem Provedor Real Configurado)',
          messageId: info.messageId,
          previewUrl,
          error: 'Nenhum provedor real (Resend, SendGrid ou SMTP) foi configurado. O e-mail foi gerado no ambiente de testes.',
        };

        emailLogs.unshift(logEntry);
        if (emailLogs.length > 100) emailLogs.pop();

        return res.json({
          success: true,
          message: `E-mail processado em modo Sandbox/Simulação. Configure Resend, SendGrid ou SMTP para entrega na caixa real.`,
          log: logEntry,
          provider: logEntry.provider,
          previewUrl,
        });
      } catch (simErr: any) {
        const logEntry: EmailLogEntry = {
          id: logId,
          to,
          subject,
          customerName,
          appointmentCode,
          sentAt: new Date().toISOString(),
          status: 'simulated',
          provider: 'Simulação Direta',
          error: 'Modo de simulação em memória ativo.',
        };
        emailLogs.unshift(logEntry);

        return res.json({
          success: true,
          message: `E-mail simulado com sucesso no sistema.`,
          log: logEntry,
          provider: 'Simulação Direta',
        });
      }
    } catch (err: any) {
      console.error('Critical failure in send-email endpoint:', err);
      return res.status(500).json({
        success: false,
        error: err?.message || 'Falha inesperada ao processar envio de e-mail.',
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BarberFlow Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
