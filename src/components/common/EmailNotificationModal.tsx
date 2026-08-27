import React, { useState, useEffect } from 'react';
import { Appointment, Professional, Service, ShopSettings } from '../../types';
import {
  formatCurrency,
  formatDateBR,
  generateGoogleCalendarUrl,
  generateWhatsAppUrl,
  generateSmsUrl,
  generateMailtoUrl,
  generateGmailComposeUrl,
  generateOutlookComposeUrl,
  generateVoucherSmsMessage,
  generateVoucherFullText,
  generateBookingWhatsAppMessage,
  cleanPhoneNumber,
} from '../../utils/calendarUtils';
import { dispatchAppointmentEmail } from '../../utils/emailService';
import {
  Mail,
  X,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Send,
  Copy,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Scissors,
  Share2,
  MessageSquare,
  Printer,
  Check,
  CalendarPlus,
  AlertCircle,
  QrCode,
  Loader2,
} from 'lucide-react';

interface EmailNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  service?: Service | null;
  professional?: Professional | null;
  settings: ShopSettings;
  onResend?: (email: string) => void;
}

type ActiveTab = 'whatsapp' | 'sms' | 'email' | 'voucher';

export const EmailNotificationModal: React.FC<EmailNotificationModalProps> = ({
  isOpen,
  onClose,
  appointment,
  service,
  professional,
  settings,
  onResend,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('whatsapp');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailDeliveryFeedback, setEmailDeliveryFeedback] = useState<{
    success: boolean;
    message: string;
    previewUrl?: string | false;
  } | null>(null);

  useEffect(() => {
    if (appointment) {
      setRecipientPhone(appointment.customerPhone || '');
      setRecipientEmail(appointment.customerEmail || '');
      setEmailDeliveryFeedback(null);
    }
  }, [appointment]);

  if (!isOpen || !appointment) return null;

  const targetService = service || {
    name: 'Serviço Personalizado',
    durationMinutes: appointment.durationMinutes,
    price: appointment.price,
  };

  const targetProfName = professional?.name || 'Barbeiro Designado';

  // Text generators
  const fullVoucherText = generateVoucherFullText({
    customerName: appointment.customerName,
    serviceName: targetService.name,
    professionalName: targetProfName,
    dateStr: appointment.date,
    timeStr: appointment.time,
    durationMinutes: appointment.durationMinutes,
    price: appointment.price,
    shopName: settings.name,
    shopEmail: settings.shopEmail,
    phone: settings.phone,
    code: appointment.code,
    address: `${settings.address}, ${settings.city}`,
  });

  const whatsappMessage = generateBookingWhatsAppMessage({
    customerName: appointment.customerName,
    serviceName: targetService.name,
    professionalName: targetProfName,
    dateStr: appointment.date,
    timeStr: appointment.time,
    price: appointment.price,
    shopName: settings.name,
    code: appointment.code,
    address: `${settings.address}, ${settings.city}`,
  });

  const smsMessage = generateVoucherSmsMessage({
    customerName: appointment.customerName,
    serviceName: targetService.name,
    professionalName: targetProfName,
    dateStr: appointment.date,
    timeStr: appointment.time,
    price: appointment.price,
    shopName: settings.name,
    code: appointment.code,
    address: `${settings.address}, ${settings.city}`,
  });

  const emailSubject = `✂️ Voucher do Agendamento #${appointment.code} - ${settings.name}`;

  // URLs
  const whatsappUrl = generateWhatsAppUrl(recipientPhone, whatsappMessage);
  const smsUrl = generateSmsUrl(recipientPhone, smsMessage);
  const mailtoUrl = generateMailtoUrl(recipientEmail, emailSubject, fullVoucherText);
  const gmailUrl = generateGmailComposeUrl(recipientEmail, emailSubject, fullVoucherText);
  const outlookUrl = generateOutlookComposeUrl(recipientEmail, emailSubject, fullVoucherText);

  const gcalUrl = generateGoogleCalendarUrl({
    title: `${targetService.name} - ${settings.name}`,
    description: `Agendamento confirmado #${appointment.code} com ${targetProfName}.\nEndereço: ${settings.address}, ${settings.city}`,
    location: `${settings.address}, ${settings.city}`,
    date: appointment.date,
    time: appointment.time,
    durationMinutes: appointment.durationMinutes,
  });

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 3000);
  };

  const handleRealEmailSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail) return;
    setIsSendingEmail(true);
    setEmailDeliveryFeedback(null);

    try {
      const res = await dispatchAppointmentEmail({
        to: recipientEmail,
        customerName: appointment.customerName,
        serviceName: targetService.name,
        professionalName: targetProfName,
        dateStr: appointment.date,
        timeStr: appointment.time,
        durationMinutes: appointment.durationMinutes,
        price: appointment.price,
        shopName: settings.name,
        shopEmail: settings.shopEmail,
        phone: settings.phone,
        code: appointment.code,
        address: `${settings.address}, ${settings.city}`,
      });

      setEmailDeliveryFeedback(res);
      if (res.success && onResend) {
        onResend(recipientEmail);
      }
    } catch (err: any) {
      setEmailDeliveryFeedback({
        success: false,
        message: err?.message || 'Falha ao enviar e-mail',
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="voucher-notification-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="voucher-notification-modal-container"
        className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
                Central de Voucher & Envio Direto
              </span>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Voucher de Agendamento #{appointment.code}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Confirmado
                </span>
              </h2>
            </div>
          </div>

          <button
            id="close-voucher-modal-btn"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/60 px-3 sm:px-5 pt-2 gap-1 overflow-x-auto scrollbar-none">
          <button
            id="tab-btn-whatsapp"
            onClick={() => setActiveTab('whatsapp')}
            className={`py-2.5 px-3 sm:px-4 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'whatsapp'
                ? 'bg-zinc-900 text-emerald-400 border-emerald-500'
                : 'text-zinc-400 hover:text-zinc-200 border-transparent'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Enviar no WhatsApp</span>
          </button>

          <button
            id="tab-btn-sms"
            onClick={() => setActiveTab('sms')}
            className={`py-2.5 px-3 sm:px-4 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'sms'
                ? 'bg-zinc-900 text-blue-400 border-blue-500'
                : 'text-zinc-400 hover:text-zinc-200 border-transparent'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Enviar por SMS</span>
          </button>

          <button
            id="tab-btn-email"
            onClick={() => setActiveTab('email')}
            className={`py-2.5 px-3 sm:px-4 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'email'
                ? 'bg-zinc-900 text-amber-400 border-amber-500'
                : 'text-zinc-400 hover:text-zinc-200 border-transparent'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Enviar por E-mail</span>
          </button>

          <button
            id="tab-btn-voucher"
            onClick={() => setActiveTab('voucher')}
            className={`py-2.5 px-3 sm:px-4 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'voucher'
                ? 'bg-zinc-900 text-white border-zinc-200'
                : 'text-zinc-400 hover:text-zinc-200 border-transparent'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Ver / Imprimir Recibo</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 bg-zinc-950/40">
          {/* TAB 1: WHATSAPP */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-zinc-900 border border-emerald-500/20 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <Smartphone className="w-4 h-4" />
                  <span>Disparo Direto para o WhatsApp</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Número do WhatsApp (com DDD):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      id="whatsapp-recipient-input"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                    <a
                      id="open-whatsapp-direct-btn"
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-2 shadow-lg shadow-emerald-900/30"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Abrir WhatsApp</span>
                    </a>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1.5">
                    Você pode alterar o número acima para enviar o voucher para qualquer contato ou para você mesmo.
                  </p>
                </div>

                {/* Preview Message Box */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-zinc-400 font-medium">Prévia da Mensagem Formatada:</span>
                    <button
                      type="button"
                      id="copy-whatsapp-text-btn"
                      onClick={() => copyToClipboard(whatsappMessage, 'whatsapp')}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors"
                    >
                      {copied === 'whatsapp' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied === 'whatsapp' ? 'Copiado!' : 'Copiar Texto'}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-[11px] text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                    {whatsappMessage}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SMS */}
          {activeTab === 'sms' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-zinc-900 border border-blue-500/20 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                  <MessageSquare className="w-4 h-4" />
                  <span>Envio via SMS (Mensagem de Texto)</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Número de Celular para SMS (com DDD):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      id="sms-recipient-input"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 font-mono"
                    />
                    <a
                      id="open-sms-direct-btn"
                      href={smsUrl}
                      className="py-2.5 px-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/30"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Abrir App de SMS</span>
                    </a>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1.5">
                    No celular, abre o aplicativo nativo de mensagens. Em computadores, você pode copiar o texto abaixo.
                  </p>
                </div>

                {/* SMS Text Box */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-zinc-400 font-medium">Conteúdo do SMS:</span>
                    <button
                      type="button"
                      id="copy-sms-text-btn"
                      onClick={() => copyToClipboard(smsMessage, 'sms')}
                      className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors"
                    >
                      {copied === 'sms' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied === 'sms' ? 'Copiado!' : 'Copiar SMS'}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-[11px] text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed">
                    {smsMessage}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: E-MAIL */}
          {activeTab === 'email' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-zinc-900 border border-amber-500/20 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <Mail className="w-4 h-4" />
                    <span>Envio Direto de E-mail & Voucher</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    E-mail do Destinatário:
                  </label>
                  <input
                    type="email"
                    id="email-recipient-input"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Para garantir que o e-mail chegue imediatamente sem filtros de spam, você pode disparar diretamente pelo seu provedor favorito:
                  </p>
                </div>

                {/* Direct Mail Client Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <a
                    id="open-gmail-compose-btn"
                    href={gmailUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors text-center"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir no Gmail</span>
                  </a>

                  <a
                    id="open-outlook-compose-btn"
                    href={outlookUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors text-center"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir no Outlook</span>
                  </a>

                  <a
                    id="open-mailto-btn"
                    href={mailtoUrl}
                    className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors text-center"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>App de E-mail Nativo</span>
                  </a>
                </div>

                {/* Feedback Box if sent */}
                {emailDeliveryFeedback && (
                  <div
                    id="email-delivery-feedback-box"
                    className={`p-3 rounded-xl text-xs border flex flex-col gap-1.5 ${
                      emailDeliveryFeedback.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-red-500/10 border-red-500/30 text-red-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold">
                      {emailDeliveryFeedback.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span>{emailDeliveryFeedback.message}</span>
                    </div>
                    {emailDeliveryFeedback.previewUrl && (
                      <div className="pt-1">
                        <a
                          id="open-ethereal-preview-link"
                          href={emailDeliveryFeedback.previewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Visualizar e-mail de teste entregue (Ethereal Preview)</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* System notification register */}
                <form
                  onSubmit={handleRealEmailSend}
                  className="pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3"
                >
                  <div className="text-left w-full sm:w-auto">
                    <span className="text-xs font-semibold text-zinc-300 block">Disparador de E-mail Automático:</span>
                    <span className="text-[11px] text-zinc-500">Envia via Servidor com layout HTML e arquivo de calendário</span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      id="copy-email-voucher-btn"
                      onClick={() => copyToClipboard(fullVoucherText, 'email')}
                      className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      {copied === 'email' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied === 'email' ? 'Copiado!' : 'Copiar Voucher'}</span>
                    </button>

                    <button
                      type="submit"
                      id="submit-system-email-btn"
                      disabled={isSendingEmail || !recipientEmail}
                      className="py-2 px-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-lg shadow-amber-500/20"
                    >
                      {isSendingEmail ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Enviando...</span>
                        </>
                      ) : emailDeliveryFeedback?.success ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Reenviar E-mail</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Disparar E-mail</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 4: VOUCHER & PRINT */}
          {activeTab === 'voucher' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Comprovante Digital Oficial:</span>
                <button
                  type="button"
                  id="print-voucher-btn"
                  onClick={handlePrint}
                  className="py-1.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-bold rounded-xl text-xs border border-zinc-700 transition-colors flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / Salvar em PDF</span>
                </button>
              </div>
            </div>
          )}

          {/* VISUAL VOUCHER CARD (Always shown below tabs for clear verification) */}
          <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-amber-500/20 rounded-3xl p-5 sm:p-7 space-y-5 text-zinc-200 shadow-xl relative overflow-hidden">
            {/* Top Brand Logo Banner */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-black flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black font-display text-white">{settings.name}</h3>
                  <p className="text-[11px] text-zinc-400">{settings.tagline}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs font-bold px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full block">
                  #{appointment.code}
                </span>
              </div>
            </div>

            {/* Voucher Body */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl flex items-start gap-3">
                <div className="p-2 rounded-lg bg-zinc-900 text-amber-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">Data do Atendimento</span>
                  <strong className="text-white text-sm">
                    {formatDateBR(appointment.date, true)}
                  </strong>
                </div>
              </div>

              <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl flex items-start gap-3">
                <div className="p-2 rounded-lg bg-zinc-900 text-amber-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">Horário Marcado</span>
                  <strong className="text-white text-sm">
                    {appointment.time} ({appointment.durationMinutes} min)
                  </strong>
                </div>
              </div>

              <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl flex items-start gap-3">
                <div className="p-2 rounded-lg bg-zinc-900 text-amber-400">
                  <Scissors className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">Serviço Selecionado</span>
                  <strong className="text-white text-sm">{targetService.name}</strong>
                </div>
              </div>

              <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl flex items-start gap-3">
                <div className="p-2 rounded-lg bg-zinc-900 text-amber-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">Profissional</span>
                  <strong className="text-white text-sm">{targetProfName}</strong>
                </div>
              </div>
            </div>

            {/* Price & Location info */}
            <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-zinc-400 text-[11px] block">Valor Total:</span>
                <span className="text-lg font-black text-amber-400">{formatCurrency(appointment.price)}</span>
                <span className="text-[10px] text-zinc-500 block">Pagamento realizado no local</span>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-zinc-400 text-[11px] block">Localização:</span>
                <strong className="text-zinc-200 text-xs block">{settings.address}</strong>
                <span className="text-zinc-500 text-[11px] block">{settings.city}</span>
              </div>
            </div>

            {/* Google Calendar Link */}
            <div className="pt-1 flex flex-wrap items-center justify-center gap-3">
              <a
                href={gcalUrl}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 border border-zinc-700"
              >
                <CalendarPlus className="w-4 h-4 text-amber-400" />
                <span>Salvar no Google Agenda</span>
              </a>

              <button
                type="button"
                id="copy-full-voucher-btn"
                onClick={() => copyToClipboard(fullVoucherText, 'voucher')}
                className="py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold transition-colors flex items-center justify-center gap-2 border border-zinc-800"
              >
                {copied === 'voucher' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied === 'voucher' ? 'Voucher Copiado!' : 'Copiar Texto Completo'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500">
            Dúvidas? Entre em contato pelo WhatsApp: {settings.phone}
          </span>
          <button
            id="close-voucher-modal-bottom-btn"
            onClick={onClose}
            className="py-2 px-5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
