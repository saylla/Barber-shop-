import React, { useState } from 'react';
import { Appointment } from '../../types';
import { formatDateBR } from '../../utils/calendarUtils';
import {
  X,
  AlertTriangle,
  XCircle,
  Share2,
  CheckCircle2,
} from 'lucide-react';

interface DeclineAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onDecline: (apptId: string, reason: string, notifyClient: boolean) => void;
}

const COMMON_REASONS = [
  'Horário indisponível devido a atendimento presencial prévio',
  'Barbeiro precisará se ausentar por imprevisto de saúde',
  'Fora do horário de expediente do profissional',
  'Manutenção técnica e higienização dos equipamentos no horário',
  'Outro motivo específico...',
];

export const DeclineAppointmentModal: React.FC<DeclineAppointmentModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onDecline,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>(COMMON_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [notifyCustomer, setNotifyCustomer] = useState<boolean>(true);

  if (!isOpen || !appointment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason =
      selectedReason === 'Outro motivo específico...'
        ? customReason || 'Horário indisponível no momento'
        : selectedReason;

    onDecline(appointment.id, finalReason, notifyCustomer);
    onClose();
  };

  return (
    <div
      id="decline-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="decline-modal-container"
        className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-red-400 block">
                Recusar Agendamento
              </span>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{appointment.customerName}</span>
                <span className="text-xs font-mono text-zinc-400">#{appointment.code}</span>
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 bg-zinc-950/40">
          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300">
            <span>
              Você está prestes a recusar o agendamento de{' '}
              <strong className="text-white">{formatDateBR(appointment.date)} às {appointment.time}</strong>.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-2">
              Selecione o motivo da recusa:
            </label>
            <div className="space-y-2">
              {COMMON_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedReason === r
                      ? 'bg-red-500/10 border-red-500 text-white font-medium'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="decline-reason"
                    checked={selectedReason === r}
                    onChange={() => setSelectedReason(r)}
                    className="mt-0.5 text-red-500 focus:ring-red-400"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          {selectedReason === 'Outro motivo específico...' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Descreva o motivo:
              </label>
              <textarea
                required
                rows={3}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Ex: Tivemos um vazamento na barbearia e precisaremos fechar mais cedo..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 resize-none"
              />
            </div>
          )}

          {/* Notify customer toggle */}
          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                id="notify-decline-checkbox"
                type="checkbox"
                checked={notifyCustomer}
                onChange={(e) => setNotifyCustomer(e.target.checked)}
                className="w-4 h-4 rounded text-red-500 focus:ring-red-400 bg-zinc-950 border-zinc-700"
              />
              <label htmlFor="notify-decline-checkbox" className="text-xs text-zinc-200 cursor-pointer">
                Abrir mensagem explicativa para enviar no WhatsApp do cliente
              </label>
            </div>
            <Share2 className="w-4 h-4 text-emerald-400" />
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Voltar
            </button>

            <button
              type="submit"
              className="py-2.5 px-5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-red-600/20"
            >
              <XCircle className="w-4 h-4" />
              <span>Confirmar Recusa</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
