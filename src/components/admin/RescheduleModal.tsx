import React, { useState } from 'react';
import { Appointment, BusinessHours, BlockedTime, Professional, Service, ShopSettings } from '../../types';
import {
  calculateAvailableSlots,
  formatCurrency,
  formatDateBR,
  getTodayDateString,
  MONTH_NAMES,
} from '../../utils/calendarUtils';
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  User,
  Scissors,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Share2,
} from 'lucide-react';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  services: Service[];
  professionals: Professional[];
  businessHours: BusinessHours;
  appointments: Appointment[];
  blockedTimes: BlockedTime[];
  settings: ShopSettings;
  onReschedule: (
    apptId: string,
    newDate: string,
    newTime: string,
    newProfId?: string,
    notifyClient?: boolean
  ) => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  appointment,
  services,
  professionals,
  businessHours,
  appointments,
  blockedTimes,
  settings,
  onReschedule,
}) => {
  if (!isOpen || !appointment) return null;

  const currentService = services.find((s) => s.id === appointment.serviceId) || {
    id: appointment.serviceId,
    name: 'Serviço',
    durationMinutes: appointment.durationMinutes,
    price: appointment.price,
    category: 'corte' as const,
    image: '',
    active: true,
    description: '',
  };

  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>(
    appointment.professionalId
  );
  const [selectedDate, setSelectedDate] = useState<string>(appointment.date);
  const [selectedTime, setSelectedTime] = useState<string>(appointment.time);
  const [notifyCustomer, setNotifyCustomer] = useState(true);

  // Month state for calendar navigation
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => {
    const [y, m] = appointment.date.split('-').map(Number);
    return new Date(y, m - 1, 1);
  });

  const selectedProfessional = professionals.find((p) => p.id === selectedProfessionalId) || professionals[0];

  // Calculate available slots
  const availableSlots = selectedProfessional
    ? calculateAvailableSlots({
        date: selectedDate,
        service: currentService,
        professional: selectedProfessional,
        allProfessionals: professionals,
        businessHours,
        appointments: appointments.filter((a) => a.id !== appointment.id), // exclude self for slot calculation
        blockedTimes,
        slotIntervalMinutes: settings.slotIntervalMinutes || 30,
      })
    : [];

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTime) return;

    onReschedule(
      appointment.id,
      selectedDate,
      selectedTime,
      selectedProfessionalId,
      notifyCustomer
    );
    onClose();
  };

  // Calendar helpers
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  return (
    <div
      id="reschedule-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="reschedule-modal-container"
        className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 block">
                Painel do Administrador / Barbeiro
              </span>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Reagendar Atendimento</span>
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
        <form onSubmit={handleConfirm} className="p-5 overflow-y-auto space-y-5 bg-zinc-950/40">
          {/* Current Booking Summary */}
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase font-bold">Cliente</span>
              <strong className="text-white text-sm">{appointment.customerName}</strong>
              <span className="text-zinc-400 block mt-0.5">{appointment.customerPhone}</span>
            </div>
            <div className="border-t sm:border-t-0 sm:border-l border-zinc-800 pt-2 sm:pt-0 sm:pl-4">
              <span className="text-zinc-500 block text-[10px] uppercase font-bold">Horário Atual</span>
              <span className="text-red-400 font-semibold line-through">
                {formatDateBR(appointment.date)} às {appointment.time}
              </span>
            </div>
          </div>

          {/* 1. Pick Professional */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-500" />
              <span>Selecione o Barbeiro:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {professionals.filter((p) => p.active).map((prof) => {
                const isSelected = prof.id === selectedProfessionalId;
                return (
                  <button
                    key={prof.id}
                    type="button"
                    onClick={() => {
                      setSelectedProfessionalId(prof.id);
                      setSelectedTime('');
                    }}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 text-white'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <img
                      src={prof.avatar}
                      alt={prof.name}
                      className="w-10 h-10 rounded-full object-cover border border-zinc-700"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white truncate">{prof.name}</h4>
                      <span className="text-[10px] text-amber-400 block">★ {prof.rating}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Pick New Date */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-blue-400" />
                <span>
                  {MONTH_NAMES[month]} {year}
                </span>
              </h3>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
                <div key={d} className="py-1 text-zinc-500 font-bold">
                  {d}
                </div>
              ))}

              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="py-1" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
                  dayNum
                ).padStart(2, '0')}`;
                const isSelected = selectedDate === dStr;
                const isPast = dStr < getTodayDateString();

                return (
                  <button
                    key={dStr}
                    type="button"
                    disabled={isPast}
                    onClick={() => {
                      setSelectedDate(dStr);
                      setSelectedTime('');
                    }}
                    className={`py-2 rounded-xl font-bold transition-all text-xs ${
                      isSelected
                        ? 'bg-blue-500 text-white font-black shadow-md'
                        : isPast
                        ? 'text-zinc-700 cursor-not-allowed'
                        : 'text-zinc-200 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Pick New Time Slot */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Horários Disponíveis em {formatDateBR(selectedDate)}:</span>
              </span>
              {selectedTime && (
                <span className="text-emerald-400 font-bold">Novo Horário: {selectedTime}</span>
              )}
            </label>

            {availableSlots.length === 0 ? (
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-center text-xs text-zinc-400">
                Nenhum horário livre nesta data para o profissional selecionado.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
                {availableSlots.map((slot) => {
                  const isSelected = selectedTime === slot.time;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setSelectedTime(slot.time)}
                      className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                        isSelected
                          ? 'bg-emerald-500 border-emerald-400 text-black font-black shadow-md'
                          : slot.available
                          ? 'bg-zinc-900 border-zinc-800 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800'
                          : 'bg-zinc-950 border-zinc-900 text-zinc-600 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      {slot.time}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notification Checkbox */}
          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                id="notify-client-checkbox"
                type="checkbox"
                checked={notifyCustomer}
                onChange={(e) => setNotifyCustomer(e.target.checked)}
                className="w-4 h-4 rounded text-blue-500 focus:ring-blue-400 bg-zinc-950 border-zinc-700"
              />
              <label htmlFor="notify-client-checkbox" className="text-xs text-zinc-200 cursor-pointer">
                Abrir editor de mensagem para avisar o cliente no WhatsApp
              </label>
            </div>
            <Share2 className="w-4 h-4 text-emerald-400" />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={!selectedTime}
              className="py-2.5 px-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-40 flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar Reagendamento</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
