import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { useApp } from '../../context/AppContext';
import {
  X,
  QrCode as QrCodeIcon,
  Download,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Scissors,
  Share2,
  Printer,
} from 'lucide-react';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUrl?: string;
  customTitle?: string;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  initialUrl,
  customTitle,
}) => {
  const { settings, showToast } = useApp();
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrSize, setQrSize] = useState<number>(320);
  const [selectedStyle, setSelectedStyle] = useState<'gold' | 'dark' | 'clean'>('gold');
  const [deskDisplayMode, setDeskDisplayMode] = useState<boolean>(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Target URL configuration for QR Code
  const getTargetUrl = () => {
    if (initialUrl) return initialUrl;
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.origin);
      url.searchParams.set('app', 'true');
      return url.toString();
    }
    return 'https://barberflow.app/?app=true';
  };
  const targetUrl = getTargetUrl();

  useEffect(() => {
    if (!isOpen) return;

    // Generate high resolution QR Code
    const colorDark = selectedStyle === 'gold' ? '#f59e0b' : selectedStyle === 'dark' ? '#18181b' : '#000000';
    const colorLight = selectedStyle === 'dark' ? '#ffffff' : '#09090b';

    QRCode.toDataURL(
      targetUrl,
      {
        width: 800,
        margin: 2,
        color: {
          dark: colorDark,
          light: colorLight,
        },
        errorCorrectionLevel: 'H',
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [isOpen, targetUrl, selectedStyle]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    showToast('Link do BarberFlow copiado para a área de transferência!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPng = () => {
    if (!qrDataUrl) return;

    // Create a high resolution canvas with branding frame if deskDisplayMode is on
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (deskDisplayMode) {
      // Create high-res A5 / table tent display card
      canvas.width = 1200;
      canvas.height = 1600;

      // Background
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Gold border frame
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 16;
      ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

      // Inner accent frame
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 4;
      ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);

      // Title & Branding
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 56px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(settings.name.toUpperCase(), canvas.width / 2, 160);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 64px sans-serif';
      ctx.fillText('AGENDE SEU HORÁRIO', canvas.width / 2, 260);

      ctx.fillStyle = '#a1a1aa';
      ctx.font = '36px sans-serif';
      ctx.fillText('Aponte a câmera do seu celular no QR Code abaixo', canvas.width / 2, 330);

      // Draw QR Code in center
      const qrImg = new Image();
      qrImg.onload = () => {
        const qrSize = 720;
        const qrX = (canvas.width - qrSize) / 2;
        const qrY = 400;

        // White background box for QR
        ctx.fillStyle = '#18181b';
        ctx.roundRect ? ctx.roundRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40, 30) : ctx.fillRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40);
        ctx.fill();

        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

        // Footer instructions
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 44px sans-serif';
        ctx.fillText('SEM ESPERA • 100% ONLINE • 24H', canvas.width / 2, 1220);

        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText(settings.tagline || 'Seu estilo. Seu horário.', canvas.width / 2, 1290);

        ctx.fillStyle = '#71717a';
        ctx.font = '30px sans-serif';
        ctx.fillText(`WhatsApp: ${settings.phone} • ${settings.address}`, canvas.width / 2, 1420);

        // Trigger download
        const link = document.createElement('a');
        link.download = `BarberFlow_QRCode_Balcao_${settings.name.replace(/\s+/g, '_')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('Placa de Balcão em Alta Resolução baixada com sucesso!', 'success');
      };
      qrImg.src = qrDataUrl;
    } else {
      // Direct QR Code Download
      const link = document.createElement('a');
      link.download = `BarberFlow_QRCode_${settings.name.replace(/\s+/g, '_')}.png`;
      link.href = qrDataUrl;
      link.click();
      showToast('QR Code baixado com sucesso!', 'success');
    }
  };

  return (
    <div
      id="qrcode-modal-overlay"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="qrcode-modal-card"
        className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative text-zinc-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gold top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 gold-gradient" />

        {/* Close Button */}
        <button
          id="close-qrcode-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-full transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-3 shadow-inner">
            <QrCodeIcon className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold font-display text-white">
            {customTitle || 'QR Code de Agendamento'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            Disponibilize este QR Code no balcão, nas bancadas ou nas redes sociais para que os clientes agendem diretamente pelo celular.
          </p>
        </div>

        {/* Display Style Toggle */}
        <div className="flex items-center justify-center gap-2 mb-4 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800 text-xs">
          <button
            type="button"
            onClick={() => setSelectedStyle('gold')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              selectedStyle === 'gold'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Dourado BarberFlow
          </button>
          <button
            type="button"
            onClick={() => setSelectedStyle('dark')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              selectedStyle === 'dark'
                ? 'bg-zinc-800 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Preto & Branco
          </button>
        </div>

        {/* QR Code Preview Frame (Display de Balcão Style) */}
        <div className="p-6 bg-zinc-950 border-2 border-amber-500/30 rounded-3xl text-center space-y-4 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-center gap-2 text-amber-400 text-xs font-black uppercase tracking-wider">
            <Scissors className="w-3.5 h-3.5" />
            <span>{settings.name}</span>
          </div>

          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl inline-block shadow-inner mx-auto">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Code de Agendamento BarberFlow"
                className="w-56 h-56 mx-auto rounded-xl object-contain"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-zinc-500 text-xs">
                Gerando QR Code...
              </div>
            )}
          </div>

          <div>
            <span className="font-bold text-sm text-white block">
              Aponte a câmera para agendar
            </span>
            <span className="text-[11px] text-zinc-400">
              Sem espera • Escolha seu profissional e horário
            </span>
          </div>

          <div className="text-[10px] font-mono text-zinc-500 bg-zinc-900/80 py-1.5 px-3 rounded-lg border border-zinc-800 truncate">
            {targetUrl}
          </div>
        </div>

        {/* Checkbox for Desk Display Frame */}
        <div className="pt-4 flex items-center gap-2 text-xs text-zinc-300">
          <input
            id="desk-display-checkbox"
            type="checkbox"
            checked={deskDisplayMode}
            onChange={(e) => setDeskDisplayMode(e.target.checked)}
            className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-amber-500 focus:ring-amber-500"
          />
          <label htmlFor="desk-display-checkbox" className="cursor-pointer">
            Gerar no formato <strong>Display de Balcão / Mesa</strong> (com logotipo e moldura de impressão)
          </label>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-5">
          <button
            id="download-qrcode-btn"
            type="button"
            onClick={handleDownloadPng}
            className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <Download className="w-4 h-4" />
            <span>{deskDisplayMode ? 'Baixar Placa de Balcão (PNG)' : 'Baixar Imagem PNG'}</span>
          </button>

          <button
            id="copy-qrcode-link-btn"
            type="button"
            onClick={handleCopyLink}
            className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold rounded-xl text-xs border border-zinc-700 transition-all flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Link Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-zinc-400" />
                <span>Copiar Link do Site</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
