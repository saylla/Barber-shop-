import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDateBR, formatCurrency, generateBookingWhatsAppMessage, generateGoogleCalendarUrl } from '../../utils/calendarUtils';
import { Calendar, Clock, Scissors, User, X, Search, AlertCircle, Share2, CalendarPlus, XCircle, Mail, RefreshCw } from 'lucide-react';

interface MyBookingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MyBookingsModal: React.FC<MyBookingsModalProps> = ({ isOpen, onClose }) => {
  const { appointments, services, professionals, settings, currentUser, cancelAppointment, openEmailModal, openRescheduleModal } = useApp();
  const [searchTerm, setSearchTerm] = useState(currentUser?.phone || currentUser?.email || '');

  if (!isOpen) return null;

  // Filter appointments
  const filteredAppointments = appointments.filter((app) => {
    if (currentUser) {
      const matchPhone = currentUser.phone && app.customerPhone.includes(currentUser.phone.replace(/\D/g, '').slice(-8));
      const matchEmail = currentUser.email && app.customerEmail?.toLowerCase() === currentUser.email.toLowerCase();
      const matchName = app.customerName.toLowerCase().includes(currentUser.name.toLowerCase());
      if (matchPhone || matchEmail || matchName) return true;
    }

    if (!searchTerm.trim()) return false;
    const cleanSearch = searchTerm.toLowerCase().replace(/\D/g, '');
    const cleanPhone = app.customerPhone.replace(/\D/g, '');

    return (
      app.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cleanSearch && cleanPhone.includes(cleanSearch))
    );
  });

  return (
    <div
      id="my-bookings-modal-overlay"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="my-bookings-card"
        className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl relative text-zinc-100 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              <span>Meus Agendamentos</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Consulte, compartilhe ou cancele seus horários marcados.
            </p>
          </div>
          <button
            id="close-my-bookings-btn"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input if not logged in or searching by code */}
        <div className="py-4">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
            <input
              id="search-bookings-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por telefone, código (ex: BF-7412) ou nome..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Appointments List */}
        <div className="overflow-y-auto flex-1 space-y-3 pr-1 custom-scrollbar">
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-10 px-4 bg-zinc-900/40 rounded-2xl border border-zinc-800">
              <AlertCircle className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
              <p className="text-sm text-zinc-300 font-medium">Nenhum agendamento encontrado</p>
              <p className="text-xs text-zinc-500 mt-1">
                Digite o número de telefone usado na reserva ou o código do comprovante.
              </p>
            </div>
          ) : (
            filteredAppointments.map((appt) => {
              const service = services.find((s) => s.id === appt.serviceId);
              const barber = professionals.find((p) => p.id === appt.professionalId);
              const isCancelled = appt.status === 'cancelled';
              const isCompleted = appt.status === 'completed';

              return (
                <div
                  key={appt.id}
                  id={`my-appt-${appt.id}`}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCancelled
                      ? 'bg-zinc-900/40 border-zinc-800/60 opacity-60'
                      : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {appt.code}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          appt.status === 'confirmed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : isCompleted
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {appt.status === 'confirmed' && 'Confirmado'}
                        {isCompleted && 'Concluído'}
                        {isCancelled && 'Cancelado'}
                        {appt.status === 'no_show' && 'Falta'}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-amber-400">
                      {formatCurrency(appt.price)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300 mb-3">
                    <div className="flex items-center gap-2">
                      <Scissors className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{service?.name || 'Serviço'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{barber?.name || 'Profissional'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{formatDateBR(appt.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <strong className="text-white">{appt.time}</strong>
                      <span className="text-zinc-500">({appt.durationMinutes} min)</span>
                    </div>
                  </div>

                  {/* Actions */}
                  {!isCancelled && !isCompleted && (
                    <div className="pt-3 border-t border-zinc-800 flex flex-wrap gap-2 justify-end">
                      <button
                        id={`email-voucher-appt-${appt.id}`}
                        onClick={() => openEmailModal(appt)}
                        className="py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                        title="Ver voucher e detalhes do e-mail"
                      >
                        <Mail className="w-3.5 h-3.5 text-amber-400" />
                        <span>Voucher / E-mail</span>
                      </button>

                      <button
                        id={`reschedule-client-appt-${appt.id}`}
                        onClick={() => openRescheduleModal(appt)}
                        className="py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                        title="Trocar data ou horário"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                        <span>Reagendar</span>
                      </button>

                      <button
                        id={`whatsapp-appt-${appt.id}`}
                        onClick={() => {
                          const msg = generateBookingWhatsAppMessage({
                            customerName: appt.customerName,
                            serviceName: service?.name || '',
                            professionalName: barber?.name || '',
                            dateStr: appt.date,
                            timeStr: appt.time,
                            price: appt.price,
                            shopName: settings.name,
                            code: appt.code,
                          });
                          window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                        }}
                        className="py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>WhatsApp</span>
                      </button>

                      <button
                        id={`gcal-appt-${appt.id}`}
                        onClick={() => {
                          const url = generateGoogleCalendarUrl({
                            title: `${service?.name} — ${settings.name}`,
                            description: `Agendamento na ${settings.name} com ${barber?.name}. Código: ${appt.code}`,
                            location: `${settings.address}, ${settings.city}`,
                            date: appt.date,
                            time: appt.time,
                            durationMinutes: appt.durationMinutes,
                          });
                          window.open(url, '_blank');
                        }}
                        className="py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <CalendarPlus className="w-3.5 h-3.5 text-amber-400" />
                        <span>Agenda</span>
                      </button>

                      <button
                        id={`cancel-appt-${appt.id}`}
                        onClick={() => {
                          if (window.confirm('Deseja realmente cancelar este agendamento?')) {
                            cancelAppointment(appt.id);
                          }
                        }}
                        className="py-1.5 px-3 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancelar</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
