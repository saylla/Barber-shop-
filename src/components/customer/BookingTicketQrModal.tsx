import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Appointment, Professional, Service, ShopSettings } from '../../types';
import { formatDateBR, formatCurrency, generateBookingWhatsAppMessage } from '../../utils/calendarUtils';
import {
  X,
  QrCode,
  Download,
  Copy,
  Check,
  Share2,
  Calendar,
  Clock,
  User,
  Scissors,
  MapPin,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Printer,
  Maximize2,
  Minimize2,
  CheckCircle2,
} from 'lucide-react';

interface BookingTicketQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  service?: Service | null;
  professional?: Professional | null;
  settings: ShopSettings;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const BookingTicketQrModal: React.FC<BookingTicketQrModalProps> = ({
  isOpen,
  onClose,
  appointment,
  service,
  professional,
  settings,
  showToast,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isFullScreenQr, setIsFullScreenQr] = useState(false);
  const [qrColorStyle, setQrColorStyle] = useState<'gold' | 'high_contrast'>('gold');
  const [isDownloading, setIsDownloading] = useState(false);

  // Generate QR Code data
  useEffect(() => {
    if (!isOpen || !appointment) return;

    // Rich verification ticket payload for instant reception scanning
    const ticketPayload = JSON.stringify({
      app: 'BarberFlow',
      code: appointment.code,
      id: appointment.id,
      customer: appointment.customerName,
      phone: appointment.customerPhone,
      service: service?.name || 'Serviço',
      barber: professional?.name || 'Barbeiro',
      date: appointment.date,
      time: appointment.time,
      price: appointment.price,
      status: appointment.status,
      timestamp: Date.now(),
      verifyUrl: typeof window !== 'undefined' ? `${window.location.origin}/?verify=${appointment.code}` : `https://barberflow.app/?verify=${appointment.code}`,
    });

    const darkColor = qrColorStyle === 'gold' ? '#f59e0b' : '#000000';
    const lightColor = qrColorStyle === 'gold' ? '#09090b' : '#ffffff';

    QRCode.toDataURL(
      ticketPayload,
      {
        width: 600,
        margin: 2,
        color: {
          dark: darkColor,
          light: lightColor,
        },
        errorCorrectionLevel: 'H',
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [isOpen, appointment, service, professional, qrColorStyle]);

  if (!isOpen || !appointment) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(appointment.code);
    setCopied(true);
    if (showToast) {
      showToast(`Código #${appointment.code} copiado para a área de transferência!`, 'success');
    }
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const msg = generateBookingWhatsAppMessage({
      customerName: appointment.customerName,
      serviceName: service?.name || 'Serviço',
      professionalName: professional?.name || 'Barbeiro',
      dateStr: appointment.date,
      timeStr: appointment.time,
      price: appointment.price,
      shopName: settings.name,
      code: appointment.code,
      address: `${settings.address}, ${settings.city}`,
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadTicketPng = () => {
    if (!qrDataUrl || isDownloading) return;
    setIsDownloading(true);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // High-resolution digital ticket canvas (1080x1920 portrait / mobile pass style)
      canvas.width = 1080;
      canvas.height = 1680;

      // Background Luxury Dark Gradient
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Gold Outer Border Frame
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 14;
      ctx.strokeRect(36, 36, canvas.width - 72, canvas.height - 72);

      // Inner Border
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 4;
      ctx.strokeRect(56, 56, canvas.width - 112, canvas.height - 112);

      // Header Barbershop Branding
      ctx.fillStyle = '#f59e0b';
      ctx.font = '900 52px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(settings.name.toUpperCase(), canvas.width / 2, 140);

      ctx.fillStyle = '#a1a1aa';
      ctx.font = '500 28px sans-serif';
      ctx.fillText('INGRESSO DIGITAL & COMPROVANTE DE CHECK-IN', canvas.width / 2, 195);

      // Perforated line effect top
      ctx.strokeStyle = '#3f3f46';
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 12]);
      ctx.beginPath();
      ctx.moveTo(80, 240);
      ctx.lineTo(canvas.width - 80, 240);
      ctx.stroke();
      ctx.setLineDash([]);

      // Booking Code Highlight Box
      ctx.fillStyle = '#18181b';
      ctx.fillRect(180, 280, canvas.width - 360, 110);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.strokeRect(180, 280, canvas.width - 360, 110);

      ctx.fillStyle = '#f59e0b';
      ctx.font = '900 56px monospace';
      ctx.fillText(`CÓDIGO: #${appointment.code}`, canvas.width / 2, 355);

      // QR Code Container
      const qrImg = new Image();
      qrImg.onload = () => {
        const qrBoxSize = 580;
        const qrBoxX = (canvas.width - qrBoxSize) / 2;
        const qrBoxY = 430;

        ctx.fillStyle = qrColorStyle === 'high_contrast' ? '#ffffff' : '#18181b';
        ctx.fillRect(qrBoxX - 20, qrBoxY - 20, qrBoxSize + 40, qrBoxSize + 40);
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 6;
        ctx.strokeRect(qrBoxX - 20, qrBoxY - 20, qrBoxSize + 40, qrBoxSize + 40);

        ctx.drawImage(qrImg, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);

        // Instruction
        ctx.fillStyle = '#e4e4e7';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText('Apresente este QR Code na recepção ao chegar', canvas.width / 2, 1080);

        // Perforated line effect middle
        ctx.strokeStyle = '#3f3f46';
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 12]);
        ctx.beginPath();
        ctx.moveTo(80, 1130);
        ctx.lineTo(canvas.width - 80, 1130);
        ctx.stroke();
        ctx.setLineDash([]);

        // Details Block
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 34px sans-serif';
        ctx.textAlign = 'left';
        const leftCol = 100;
        const rightCol = 580;

        // Line 1: Client & Phone
        ctx.fillStyle = '#71717a';
        ctx.font = '26px sans-serif';
        ctx.fillText('CLIENTE', leftCol, 1180);
        ctx.fillText('SERVIÇO', rightCol, 1180);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 34px sans-serif';
        ctx.fillText(appointment.customerName, leftCol, 1225);
        ctx.fillText(service?.name || 'Serviço', rightCol, 1225);

        // Line 2: Barber & Price
        ctx.fillStyle = '#71717a';
        ctx.font = '26px sans-serif';
        ctx.fillText('PROFISSIONAL / BARBEIRO', leftCol, 1285);
        ctx.fillText('VALOR DO ATENDIMENTO', rightCol, 1285);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 34px sans-serif';
        ctx.fillText(professional?.name || 'Barbeiro', leftCol, 1330);
        ctx.fillStyle = '#f59e0b';
        ctx.fillText(formatCurrency(appointment.price), rightCol, 1330);

        // Line 3: Date & Time
        ctx.fillStyle = '#71717a';
        ctx.font = '26px sans-serif';
        ctx.fillText('DATA AGENDADA', leftCol, 1390);
        ctx.fillText('HORÁRIO DE INÍCIO', rightCol, 1390);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 34px sans-serif';
        ctx.fillText(formatDateBR(appointment.date), leftCol, 1435);
        ctx.fillStyle = '#f59e0b';
        ctx.fillText(`${appointment.time} (${appointment.durationMinutes} min)`, rightCol, 1435);

        // Footer Barbershop Location
        ctx.fillStyle = '#52525b';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${settings.address}, ${settings.city} • Tel/WhatsApp: ${settings.phone}`, canvas.width / 2, 1540);

        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText('BarberFlow • Sistema de Agendamento Profissional', canvas.width / 2, 1585);

        // Download trigger
        const link = document.createElement('a');
        link.download = `Ticket_Digital_BarberFlow_${appointment.code}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        if (showToast) {
          showToast(`Ingresso Digital #${appointment.code} baixado em alta resolução!`, 'success');
        }
        setIsDownloading(false);
      };
      qrImg.src = qrDataUrl;
    } catch (err) {
      console.error('Erro ao gerar ticket:', err);
      setIsDownloading(false);
    }
  };

  return (
    <div
      id="booking-ticket-modal-overlay"
      className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="booking-ticket-card"
        className={`bg-zinc-950 border border-amber-500/40 rounded-3xl w-full shadow-2xl relative text-zinc-100 flex flex-col transition-all duration-300 ${
          isFullScreenQr ? 'max-w-md p-6' : 'max-w-lg p-5 sm:p-6'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title and Close Button */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black font-display text-white flex items-center gap-2">
                <span>Ingresso Digital & QR Code</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Check-in Rápido
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Apresente na recepção da barbearia ao chegar.
              </p>
            </div>
          </div>

          <button
            id="close-ticket-modal-btn"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Full-Screen QR Mode Toggle Alert */}
        <div className="pt-3">
          {/* Main Ticket Stub Body */}
          <div className="relative bg-gradient-to-b from-zinc-900 to-zinc-950 border-2 border-amber-500/40 rounded-2xl overflow-hidden shadow-inner p-4 sm:p-5 space-y-4">
            {/* Top Barbershop Brand Header */}
            <div className="flex items-center justify-between border-b border-dashed border-zinc-700/80 pb-3">
              <div>
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest block">
                  Estabelecimento
                </span>
                <strong className="text-base font-black text-amber-400 font-display">
                  {settings.name}
                </strong>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest block">
                  Código da Reserva
                </span>
                <button
                  type="button"
                  id="copy-booking-code-btn"
                  onClick={handleCopyCode}
                  className="font-mono text-sm font-black px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors flex items-center gap-1.5 ml-auto"
                  title="Clique para copiar o código"
                >
                  <span>#{appointment.code}</span>
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                </button>
              </div>
            </div>

            {/* QR Code Center Showcase */}
            <div className="flex flex-col items-center justify-center py-2 space-y-3">
              <div
                className={`relative group p-3 rounded-2xl transition-all duration-300 shadow-xl border-2 ${
                  qrColorStyle === 'high_contrast'
                    ? 'bg-white border-white'
                    : 'bg-zinc-950 border-amber-500/50 hover:border-amber-400'
                }`}
              >
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Code Agendamento ${appointment.code}`}
                    className={`rounded-xl object-contain transition-all ${
                      isFullScreenQr ? 'w-64 h-64 sm:w-72 sm:h-72' : 'w-48 h-48 sm:w-56 sm:h-56'
                    }`}
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-zinc-500">
                    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {/* Status Watermark */}
                <div className="absolute top-4 right-4">
                  <span className="bg-black/80 backdrop-blur-sm text-amber-400 border border-amber-500/40 text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Oficial</span>
                  </span>
                </div>
              </div>

              {/* QR Style Options & Scan Instruction */}
              <div className="flex items-center justify-between w-full text-xs text-zinc-400 px-1">
                <span className="flex items-center gap-1 text-[11px] text-zinc-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Check-in instantâneo</span>
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setQrColorStyle(qrColorStyle === 'gold' ? 'high_contrast' : 'gold')}
                    className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-[11px] font-medium border border-zinc-700 transition-colors"
                  >
                    {qrColorStyle === 'gold' ? 'Modo Alto Contraste (P/B)' : 'Estilo Dourado Premium'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFullScreenQr(!isFullScreenQr)}
                    className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-400 rounded-lg border border-zinc-700 transition-colors"
                    title={isFullScreenQr ? 'Reduzir QR Code' : 'Expandir QR Code'}
                  >
                    {isFullScreenQr ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Perforated ticket divider */}
            <div className="relative py-1">
              <div className="border-t-2 border-dashed border-zinc-800" />
              <div className="absolute -left-7 top-1/2 -translate-y-1/2 w-4 h-4 bg-zinc-950 rounded-full border-r border-amber-500/40" />
              <div className="absolute -right-7 top-1/2 -translate-y-1/2 w-4 h-4 bg-zinc-950 rounded-full border-l border-amber-500/40" />
            </div>

            {/* Appointment Details Grid */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 bg-zinc-950/70 rounded-xl border border-zinc-800/80">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block flex items-center gap-1">
                  <Scissors className="w-3 h-3 text-amber-500" /> Serviço
                </span>
                <strong className="text-zinc-100 font-bold text-xs truncate block mt-0.5">
                  {service?.name || 'Serviço'}
                </strong>
                <span className="text-[11px] text-amber-400 font-bold">
                  {formatCurrency(appointment.price)}
                </span>
              </div>

              <div className="p-2.5 bg-zinc-950/70 rounded-xl border border-zinc-800/80">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block flex items-center gap-1">
                  <User className="w-3 h-3 text-amber-500" /> Profissional
                </span>
                <strong className="text-zinc-100 font-bold text-xs truncate block mt-0.5">
                  {professional?.name || 'Barbeiro'}
                </strong>
                <span className="text-[11px] text-zinc-400">
                  {appointment.durationMinutes} minutos
                </span>
              </div>

              <div className="p-2.5 bg-zinc-950/70 rounded-xl border border-zinc-800/80">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-amber-500" /> Data
                </span>
                <strong className="text-zinc-100 font-bold text-xs block mt-0.5">
                  {formatDateBR(appointment.date)}
                </strong>
              </div>

              <div className="p-2.5 bg-zinc-950/70 rounded-xl border border-zinc-800/80">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-500" /> Horário
                </span>
                <strong className="text-amber-400 font-black text-xs block mt-0.5">
                  {appointment.time}
                </strong>
              </div>
            </div>

            {/* Address Footer */}
            <div className="flex items-center gap-2 text-[11px] text-zinc-400 pt-1">
              <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span className="truncate">{settings.address}, {settings.city}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="pt-4 flex flex-wrap gap-2 justify-between">
          <button
            type="button"
            id="download-ticket-png-btn"
            onClick={handleDownloadTicketPng}
            disabled={isDownloading}
            className="flex-1 py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloading ? 'Gerando Imagem...' : 'Salvar Ticket (PNG)'}</span>
          </button>

          <button
            type="button"
            id="share-ticket-whatsapp-btn"
            onClick={handleShareWhatsApp}
            className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-md"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>

          <button
            type="button"
            id="print-ticket-btn"
            onClick={handlePrint}
            className="py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs rounded-xl border border-zinc-700 transition-colors flex items-center justify-center gap-1.5"
            title="Imprimir comprovante"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>
        </div>
      </div>
    </div>
  );
};
