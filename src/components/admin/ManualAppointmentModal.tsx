import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getTodayDateString } from '../../utils/calendarUtils';
import { X, CalendarPlus, User, Phone, Scissors, Clock, DollarSign } from 'lucide-react';

interface ManualAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
}

export const ManualAppointmentModal: React.FC<ManualAppointmentModalProps> = ({
  isOpen,
  onClose,
  initialDate,
}) => {
  const { services, professionals, createAppointment, showToast } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [serviceId, setServiceId] = useState(services[0]?.id || '');
  const [professionalId, setProfessionalId] = useState(professionals[0]?.id || '');
  const [date, setDate] = useState(initialDate || getTodayDateString());
  const [time, setTime] = useState('14:00');
  const [notes, setNotes] = useState('Agendamento manual via painel.');

  if (!isOpen) return null;

  const selectedService = services.find((s) => s.id === serviceId) || services[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !serviceId || !professionalId || !date || !time) {
      showToast('Preencha todos os campos obrigatórios.', 'error');
      return;
    }

    const res = createAppointment({
      customerName: name.trim(),
      customerPhone: phone.trim(),
      customerEmail: email.trim() || undefined,
      serviceId,
      professionalId,
      date,
      time,
      durationMinutes: selectedService.durationMinutes,
      price: selectedService.price,
      notes,
    });

    if (res.success) {
      onClose();
    }
  };

  return (
    <div
      id="manual-appt-modal-overlay"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="manual-appt-card"
        className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-zinc-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <CalendarPlus className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold font-display text-white">
              Novo Agendamento Manual
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Nome do Cliente *
              </label>
              <input
                id="manual-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Carlos Alberto"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                WhatsApp / Telefone *
              </label>
              <input
                id="manual-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 98765-4321"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Serviço *
              </label>
              <select
                id="manual-service"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.durationMinutes}m - R$ {s.price})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Profissional *
              </label>
              <select
                id="manual-prof"
                value={professionalId}
                onChange={(e) => setProfessionalId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
              >
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Data *
              </label>
              <input
                id="manual-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Horário *
              </label>
              <input
                id="manual-time"
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Observações internas
            </label>
            <input
              id="manual-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Cliente presencial / encaixe rápido"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-3 border-t border-zinc-800 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              id="manual-submit-btn"
              type="submit"
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md"
            >
              Salvar Agendamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
