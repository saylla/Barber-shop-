import React, { useState, useEffect } from 'react';
import { Appointment, MessageTemplateType, Professional, Service, ShopSettings } from '../../types';
import {
  buildWhatsAppLink,
  formatCurrency,
  formatDateBR,
  generateBookingWhatsAppMessage,
  generateDeclineWhatsAppMessage,
  generateReminderWhatsAppMessage,
  generateRescheduleWhatsAppMessage,
  generateThankYouWhatsAppMessage,
} from '../../utils/calendarUtils';
import {
  X,
  Share2,
  Mail,
  Copy,
  CheckCircle2,
  Edit3,
  Sparkles,
  MessageSquare,
  Send,
  Calendar,
  Clock,
  User,
  Scissors,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface CustomerMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  service?: Service | null;
  professional?: Professional | null;
  settings: ShopSettings;
  initialTemplateType?: MessageTemplateType;
  rejectionReason?: string;
  onMessageSent?: (channel: 'whatsapp' | 'email' | 'sms', content: string) => void;
}

export const CustomerMessageModal: React.FC<CustomerMessageModalProps> = ({
  isOpen,
  onClose,
  appointment,
  service,
  professional,
  settings,
  initialTemplateType = 'confirmation',
  rejectionReason,
  onMessageSent,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplateType>(initialTemplateType);
  const [messageText, setMessageText] = useState('');
  const [channel, setChannel] = useState<'whatsapp' | 'email' | 'sms'>('whatsapp');
  const [copied, setCopied] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);

  const targetService = service || {
    name: 'Serviço',
    durationMinutes: appointment?.durationMinutes || 30,
    price: appointment?.price || 0,
  };

  const targetProfName = professional?.name || 'Barbeiro';

  // Build message based on template
  const buildTemplateContent = (templateType: MessageTemplateType | string = 'confirmation'): string => {
    if (!appointment) return '';

    const baseParams = {
      customerName: appointment.customerName,
      serviceName: targetService.name,
      professionalName: targetProfName,
      dateStr: appointment.date,
      timeStr: appointment.time,
      price: appointment.price,
      shopName: settings.name,
      code: appointment.code,
      address: `${settings.address}, ${settings.city}`,
    };

    switch (templateType) {
      case 'confirmation':
        return generateBookingWhatsAppMessage(baseParams);

      case 'reschedule':
        return generateRescheduleWhatsAppMessage({
          ...baseParams,
          customNote: 'Ajustamos seu horário para melhor lhe atender com toda comodidade.',
        });

      case 'decline':
        return generateDeclineWhatsAppMessage({
          ...baseParams,
          reason: rejectionReason || appointment.rejectionReason || 'Horário indisponível na cadeira do profissional.',
        });

      case 'reminder':
        return generateReminderWhatsAppMessage(baseParams);

      case 'thank_you':
        return generateThankYouWhatsAppMessage({
          customerName: appointment.customerName,
          serviceName: targetService.name,
          professionalName: targetProfName,
          shopName: settings.name,
        });

      case 'custom':
      default:
        return `Olá, ${appointment.customerName}! Aqui é o ${targetProfName} da ${settings.name}.\n\nReferente ao seu agendamento de ${targetService.name} no dia ${formatDateBR(appointment.date)} às ${appointment.time}:\n\n`;
    }
  };

  // Sync initial message when opening or changing template
  useEffect(() => {
    if (isOpen && appointment) {
      setSelectedTemplate(initialTemplateType);
      setMessageText(buildTemplateContent(initialTemplateType));
      setEmailSentSuccess(false);
    }
  }, [isOpen, appointment, initialTemplateType, rejectionReason]);

  const handleTemplateChange = (type: MessageTemplateType) => {
    setSelectedTemplate(type);
    setMessageText(buildTemplateContent(type));
  };

  if (!isOpen || !appointment) return null;

  // Insert variable tag into current cursor or end of text
  const insertTag = (tag: string) => {
    setMessageText((prev) => `${prev} ${tag}`);
  };

  // Handle WhatsApp open
  const handleOpenWhatsApp = () => {
    const cleanPhone = appointment.customerPhone.replace(/\D/g, '');
    const url = buildWhatsAppLink(cleanPhone, messageText);
    window.open(url, '_blank');
    if (onMessageSent) {
      onMessageSent('whatsapp', messageText);
    }
    onClose();
  };

  // Handle simulated email send
  const handleSendEmail = () => {
    setIsSendingEmail(true);
    setTimeout(() => {
      setIsSendingEmail(false);
      setEmailSentSuccess(true);
      if (onMessageSent) {
        onMessageSent('email', messageText);
      }
      setTimeout(() => {
        setEmailSentSuccess(false);
        onClose();
      }, 1500);
    }, 800);
  };

  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div
      id="customer-message-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="customer-message-modal-container"
        className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">
                Editor de Mensagens para o Cliente
              </span>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Enviar para {appointment.customerName}</span>
                <span className="text-xs font-mono text-zinc-400">({appointment.customerPhone})</span>
              </h2>
            </div>
          </div>

          <button
            id="close-message-modal-btn"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 bg-zinc-950/40">
          {/* Quick Details Bar */}
          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-zinc-400">Serviço: <strong className="text-zinc-200">{targetService.name}</strong></span>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-400">Barbeiro: <strong className="text-amber-400">{targetProfName}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">{formatDateBR(appointment.date)} às <strong>{appointment.time}</strong></span>
              <span className="font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">#{appointment.code}</span>
            </div>
          </div>

          {/* Template Selector Chips */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Selecione um Modelo de Mensagem Automática:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                id="template-confirm-btn"
                onClick={() => handleTemplateChange('confirmation')}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all flex items-center gap-2 ${
                  selectedTemplate === 'confirmation'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-sm'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">✅ Confirmação</span>
              </button>

              <button
                type="button"
                id="template-reschedule-btn"
                onClick={() => handleTemplateChange('reschedule')}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all flex items-center gap-2 ${
                  selectedTemplate === 'reschedule'
                    ? 'bg-blue-500/10 border-blue-500 text-blue-400 shadow-sm'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                }`}
              >
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">🗓️ Reagendamento</span>
              </button>

              <button
                type="button"
                id="template-decline-btn"
                onClick={() => handleTemplateChange('decline')}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all flex items-center gap-2 ${
                  selectedTemplate === 'decline'
                    ? 'bg-red-500/10 border-red-500 text-red-400 shadow-sm'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                }`}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">⚠️ Recusa / Motivo</span>
              </button>

              <button
                type="button"
                id="template-reminder-btn"
                onClick={() => handleTemplateChange('reminder')}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all flex items-center gap-2 ${
                  selectedTemplate === 'reminder'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-sm'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                }`}
              >
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">🔔 Lembrete Hoje</span>
              </button>

              <button
                type="button"
                id="template-thankyou-btn"
                onClick={() => handleTemplateChange('thank_you')}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all flex items-center gap-2 ${
                  selectedTemplate === 'thank_you'
                    ? 'bg-purple-500/10 border-purple-500 text-purple-400 shadow-sm'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">⭐ Agradecimento</span>
              </button>

              <button
                type="button"
                id="template-custom-btn"
                onClick={() => handleTemplateChange('custom')}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all flex items-center gap-2 ${
                  selectedTemplate === 'custom'
                    ? 'bg-zinc-800 border-zinc-600 text-white shadow-sm'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                }`}
              >
                <Edit3 className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">✏️ Personalizada</span>
              </button>
            </div>
          </div>

          {/* Manual Editing Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Edição Manual do Cabeleireiro / Barbeiro:</span>
              </label>
              <span className="text-[11px] text-zinc-500">
                {messageText.length} caracteres
              </span>
            </div>

            <textarea
              id="customer-message-textarea"
              rows={7}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Escreva ou ajuste a mensagem que será enviada para o cliente..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-sans leading-relaxed transition-colors resize-none"
            />
          </div>

          {/* Quick Dynamic Insertion Tags */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-zinc-400 font-medium block">
              Inserir dados dinâmicos com 1 clique:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => insertTag(appointment.customerName)}
                className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-[11px] text-zinc-300 hover:text-amber-400 transition-colors"
              >
                + Nome do Cliente
              </button>
              <button
                type="button"
                onClick={() => insertTag(formatDateBR(appointment.date))}
                className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-[11px] text-zinc-300 hover:text-amber-400 transition-colors"
              >
                + Data
              </button>
              <button
                type="button"
                onClick={() => insertTag(appointment.time)}
                className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-[11px] text-zinc-300 hover:text-amber-400 transition-colors"
              >
                + Horário
              </button>
              <button
                type="button"
                onClick={() => insertTag(targetProfName)}
                className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-[11px] text-zinc-300 hover:text-amber-400 transition-colors"
              >
                + Barbeiro
              </button>
              <button
                type="button"
                onClick={() => insertTag(targetService.name)}
                className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-[11px] text-zinc-300 hover:text-amber-400 transition-colors"
              >
                + Serviço
              </button>
              <button
                type="button"
                onClick={() => insertTag(formatCurrency(appointment.price))}
                className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-[11px] text-zinc-300 hover:text-amber-400 transition-colors"
              >
                + Valor
              </button>
              <button
                type="button"
                onClick={() => insertTag(`#${appointment.code}`)}
                className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-[11px] text-zinc-300 hover:text-amber-400 transition-colors"
              >
                + Código
              </button>
            </div>
          </div>

          {/* WhatsApp Preview Bubble */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Share2 className="w-3.5 h-3.5" /> Prévia Visual no WhatsApp:
              </span>
              <span className="text-zinc-500">Destinatário: {appointment.customerPhone}</span>
            </div>

            <div className="bg-[#0b141a] p-3 rounded-2xl border border-emerald-950/60 max-w-lg shadow-inner">
              <div className="bg-[#005c4b] text-white p-3 rounded-xl rounded-tr-none text-xs whitespace-pre-wrap font-sans leading-relaxed shadow">
                {messageText}
                <div className="text-[10px] text-emerald-200/80 text-right mt-1.5 flex items-center justify-end gap-1">
                  <span>Agora</span>
                  <Check className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Bar */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold border border-zinc-800 transition-colors flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar Texto</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {appointment.customerEmail && (
              <button
                type="button"
                id="send-message-email-btn"
                disabled={isSendingEmail}
                onClick={handleSendEmail}
                className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-zinc-700"
              >
                {isSendingEmail ? (
                  <span>Enviando...</span>
                ) : emailSentSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>E-mail Enviado!</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 text-amber-400" />
                    <span>Enviar por E-mail</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              id="send-message-whatsapp-btn"
              onClick={handleOpenWhatsApp}
              className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              <Share2 className="w-4 h-4" />
              <span>Enviar no WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
