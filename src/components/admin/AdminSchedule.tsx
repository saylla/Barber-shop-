import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Appointment, AppointmentStatus } from '../../types';
import {
  formatCurrency,
  formatDateBR,
  getTodayDateString,
  MONTH_NAMES,
} from '../../utils/calendarUtils';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  UserX,
  Phone,
  Scissors,
  Share2,
  Mail,
  RefreshCw,
  MessageSquare,
  AlertTriangle,
  Send,
  Eye,
  History,
  Check,
  Sparkles,
  RotateCcw,
  BadgeCheck,
  CalendarPlus,
  ExternalLink,
  Bell,
} from 'lucide-react';
import { ManualAppointmentModal } from './ManualAppointmentModal';

export const AdminSchedule: React.FC = () => {
  const {
    appointments,
    services,
    professionals,
    updateAppointmentStatus,
    acceptAppointment,
    cancelAppointment,
    openMessageModal,
    openEmailModal,
    openRescheduleModal,
    openDeclineModal,
    settings,
    googleCalendarSyncState,
    connectGoogleCalendar,
    syncAppointmentToGoogleCalendar,
    syncAllAppointmentsToGoogleCalendar,
    deleteGoogleCalendarEventForAppt,
    sendClientHaircutReminder,
  } = useApp();

  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'all'>('day');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [selectedProfessionalFilter, setSelectedProfessionalFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [syncingApptId, setSyncingApptId] = useState<string | null>(null);
  const [deleteGCalConfirmId, setDeleteGCalConfirmId] = useState<string | null>(null);
  const [activeReminderApptId, setActiveReminderApptId] = useState<string | null>(null);

  // Date Navigation Helpers
  const shiftDate = (days: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d + days);
    const newStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate()
    ).padStart(2, '0')}`;
    setSelectedDate(newStr);
  };

  const setToday = () => {
    setSelectedDate(getTodayDateString());
  };

  // Pending count for quick banner notification
  const pendingAppointments = appointments.filter((a) => a.status === 'pending');

  // Filtered Appointments
  const filteredAppointments = appointments.filter((app) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = app.customerName.toLowerCase().includes(q);
      const matchCode = app.code.toLowerCase().includes(q);
      const matchPhone = app.customerPhone.includes(q);
      if (!matchName && !matchCode && !matchPhone) return false;
    }

    // Professional filter
    if (
      selectedProfessionalFilter !== 'all' &&
      app.professionalId !== selectedProfessionalFilter
    ) {
      return false;
    }

    // Status filter
    if (selectedStatusFilter !== 'all' && app.status !== selectedStatusFilter) {
      return false;
    }

    // Date range filter based on view mode
    if (viewMode === 'day') {
      return app.date === selectedDate;
    } else if (viewMode === 'week') {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const curr = new Date(y, m - 1, d);
      const startOfWeek = new Date(curr);
      startOfWeek.setDate(curr.getDate() - curr.getDay());
      const endOfWeek = new Date(curr);
      endOfWeek.setDate(curr.getDate() + (6 - curr.getDay()));

      const [ay, am, ad] = app.date.split('-').map(Number);
      const apptDate = new Date(ay, am - 1, ad);
      return apptDate >= startOfWeek && apptDate <= endOfWeek;
    } else if (viewMode === 'month') {
      const [y, m] = selectedDate.split('-').map(Number);
      const [ay, am] = app.date.split('-').map(Number);
      return y === ay && m === am;
    }

    return true;
  });

  // Calculate counts for status pills based on current date/professional filter
  const baseForCounts = appointments.filter((app) => {
    if (selectedProfessionalFilter !== 'all' && app.professionalId !== selectedProfessionalFilter) {
      return false;
    }
    if (viewMode === 'day') {
      return app.date === selectedDate;
    } else if (viewMode === 'week') {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const curr = new Date(y, m - 1, d);
      const startOfWeek = new Date(curr);
      startOfWeek.setDate(curr.getDate() - curr.getDay());
      const endOfWeek = new Date(curr);
      endOfWeek.setDate(curr.getDate() + (6 - curr.getDay()));
      const [ay, am, ad] = app.date.split('-').map(Number);
      const apptDate = new Date(ay, am - 1, ad);
      return apptDate >= startOfWeek && apptDate <= endOfWeek;
    } else if (viewMode === 'month') {
      const [y, m] = selectedDate.split('-').map(Number);
      const [ay, am] = app.date.split('-').map(Number);
      return y === ay && m === am;
    }
    return true;
  });

  const countPending = baseForCounts.filter((a) => a.status === 'pending').length;
  const countConfirmed = baseForCounts.filter((a) => a.status === 'confirmed').length;
  const countCompleted = baseForCounts.filter((a) => a.status === 'completed').length;
  const countRescheduled = baseForCounts.filter((a) => a.status === 'rescheduled').length;
  const countCancelled = baseForCounts.filter((a) => a.status === 'cancelled').length;

  // Sort by date and time
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });

  return (
    <div id="admin-schedule-view" className="space-y-6">
      {/* Pending Appointments Banner (If any) */}
      {pendingAppointments.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-black flex items-center justify-center font-black animate-pulse">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                <span>{pendingAppointments.length} Agendamento(s) Aguardando Aprovação</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-black font-black uppercase">
                  Ação Necessária
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Clientes reservaram online e aguardam sua confirmação ou mensagem do barbeiro.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="view-pending-banner-btn"
            onClick={() => {
              setSelectedStatusFilter('pending');
              setViewMode('all');
            }}
            className="py-2 px-4 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex-shrink-0"
          >
            Ver Pendentes ({pendingAppointments.length})
          </button>
        </div>
      )}

      {/* Top Header & Controls */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-amber-400 text-xs font-bold uppercase tracking-wider block mb-0.5">
              Gestão de Atendimentos & Comunicação
            </span>
            <h1 className="text-2xl font-black font-display text-white">
              Agenda da Barbearia
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="admin-create-manual-btn"
              onClick={() => setIsManualModalOpen(true)}
              className="py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Agendamento</span>
            </button>
          </div>
        </div>

        {/* Google Calendar Sync Bar */}
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                googleCalendarSyncState.isConnected
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                  : 'bg-zinc-850 border-zinc-750 text-zinc-400'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-white">Google Agenda (Google Calendar)</span>
                {googleCalendarSyncState.isConnected ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Conectado: {googleCalendarSyncState.userEmail}
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                    Não conectado
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Sincronize agendamentos automaticamente com sua conta Google Calendar para receber lembretes e alertas em tempo real.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {googleCalendarSyncState.isConnected ? (
              <button
                type="button"
                id="schedule-sync-all-gcal-btn"
                onClick={() => syncAllAppointmentsToGoogleCalendar()}
                disabled={googleCalendarSyncState.isSyncing}
                className="py-2 px-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${googleCalendarSyncState.isSyncing ? 'animate-spin' : ''}`} />
                <span>{googleCalendarSyncState.isSyncing ? 'Sincronizando...' : 'Sincronizar Todos'}</span>
              </button>
            ) : (
              <button
                type="button"
                id="schedule-connect-gcal-btn"
                onClick={() => connectGoogleCalendar()}
                className="py-2 px-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5"
              >
                <CalendarIcon className="w-3.5 h-3.5 text-blue-400" />
                <span>Conectar Google Calendar</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation & View switcher bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800">
          {/* Date Picker Controls */}
          <div className="flex items-center gap-2">
            <button
              id="schedule-prev-date-btn"
              onClick={() => shiftDate(viewMode === 'month' ? -30 : viewMode === 'week' ? -7 : -1)}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              title="Data Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              id="schedule-today-btn"
              onClick={setToday}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-amber-400 border border-zinc-700 transition-colors"
            >
              Hoje
            </button>

            <button
              id="schedule-next-date-btn"
              onClick={() => shiftDate(viewMode === 'month' ? 30 : viewMode === 'week' ? 7 : 1)}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              title="Próxima Data"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="text-sm font-bold text-white ml-2">
              {formatDateBR(selectedDate, true)}
            </span>
          </div>

          {/* View mode toggle (Dia, Semana, Mês, Todos) */}
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              id="viewmode-day-btn"
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'day' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Dia
            </button>
            <button
              id="viewmode-week-btn"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'week' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Semana
            </button>
            <button
              id="viewmode-month-btn"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'month' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Mês
            </button>
            <button
              id="viewmode-all-btn"
              onClick={() => setViewMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'all' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todos
            </button>
          </div>
        </div>

        {/* Filter Dropdowns & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-xs text-zinc-400">Barbeiro:</span>
              <select
                id="filter-professional-select"
                value={selectedProfessionalFilter}
                onChange={(e) => setSelectedProfessionalFilter(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              >
                <option value="all">Todos os Barbeiros</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">Status:</span>
              <select
                id="filter-status-select"
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              >
                <option value="all">Todos os Status</option>
                <option value="pending">⏳ Aguardando Aprovação (Pendentes)</option>
                <option value="confirmed">✅ Confirmados</option>
                <option value="completed">⭐ Concluídos (Baixas)</option>
                <option value="rescheduled">🗓️ Reagendados</option>
                <option value="declined">❌ Recusados</option>
                <option value="cancelled">🚫 Cancelados</option>
                <option value="no_show">⚠️ Faltas</option>
              </select>
            </div>
          </div>

          <div className="w-full sm:w-64">
            <input
              id="schedule-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cliente, código ou fone..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Quick Status Filter Tabs Bar */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={() => setSelectedStatusFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              selectedStatusFilter === 'all'
                ? 'bg-amber-500 text-black font-bold'
                : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            Todos ({baseForCounts.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusFilter('confirmed')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
              selectedStatusFilter === 'confirmed'
                ? 'bg-emerald-500 text-black font-bold'
                : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Confirmados ({countConfirmed})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusFilter('completed')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
              selectedStatusFilter === 'completed'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <BadgeCheck className="w-3 h-3 text-emerald-400" />
            <span>Concluídos / Baixas ({countCompleted})</span>
          </button>

          {countPending > 0 && (
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('pending')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                selectedStatusFilter === 'pending'
                  ? 'bg-amber-500 text-black font-bold'
                  : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
              }`}
            >
              <Clock className="w-3 h-3 animate-pulse" />
              <span>Pendentes ({countPending})</span>
            </button>
          )}

          {countRescheduled > 0 && (
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('rescheduled')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                selectedStatusFilter === 'rescheduled'
                  ? 'bg-blue-500 text-black font-bold'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              Reagendados ({countRescheduled})
            </button>
          )}

          {countCancelled > 0 && (
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('cancelled')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                selectedStatusFilter === 'cancelled'
                  ? 'bg-zinc-700 text-white font-bold'
                  : 'bg-zinc-950 text-zinc-500 hover:text-zinc-300 border border-zinc-800'
              }`}
            >
              Cancelados ({countCancelled})
            </button>
          )}
        </div>
      </div>

      {/* Appointments List / Cards */}
      <div className="space-y-3.5">
        {sortedAppointments.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center">
            <CalendarIcon className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-zinc-300">
              Nenhum agendamento encontrado para este filtro
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Clique em "+ Novo Agendamento" para adicionar manualmente ou altere o status ou data selecionada.
            </p>
          </div>
        ) : (
          sortedAppointments.map((appt) => {
            const service = services.find((s) => s.id === appt.serviceId);
            const barber = professionals.find((p) => p.id === appt.professionalId);
            const isPending = appt.status === 'pending';
            const isCompleted = appt.status === 'completed';
            const isConfirmingCancel = cancelConfirmId === appt.id;

            return (
              <div
                key={appt.id}
                id={`admin-appt-${appt.id}`}
                className={`border rounded-3xl p-5 transition-all shadow-md flex flex-col xl:flex-row xl:items-center justify-between gap-5 ${
                  isPending
                    ? 'border-amber-500/60 bg-amber-500/[0.03] ring-1 ring-amber-500/20'
                    : isCompleted
                    ? 'border-emerald-500/40 bg-zinc-900/90 hover:border-emerald-500/60'
                    : appt.status === 'confirmed'
                    ? 'border-zinc-800 bg-zinc-900 hover:border-amber-500/40'
                    : appt.status === 'rescheduled'
                    ? 'border-blue-500/40 bg-blue-500/[0.02]'
                    : appt.status === 'declined'
                    ? 'border-red-500/30 bg-red-950/20'
                    : appt.status === 'cancelled'
                    ? 'border-zinc-800/80 bg-zinc-950/60 opacity-60'
                    : 'border-zinc-800 bg-zinc-950/60'
                }`}
              >
                {/* Left Section: Time, Client Info, Details */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 flex-1">
                  {/* Time Badge */}
                  <div
                    className={`text-center p-3 rounded-2xl border min-w-[85px] flex-shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-950/30 border-emerald-500/30'
                        : 'bg-zinc-950 border-zinc-800'
                    }`}
                  >
                    <span className="text-xs text-zinc-400 block font-semibold">{formatDateBR(appt.date)}</span>
                    <span
                      className={`text-xl font-black block ${
                        isCompleted ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {appt.time}
                    </span>
                    <span className="text-[10px] text-zinc-500">{appt.durationMinutes} min</span>
                  </div>

                  {/* Client and Service info */}
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-white truncate">{appt.customerName}</h3>
                      <span className="text-xs font-mono text-zinc-400 px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">
                        #{appt.code}
                      </span>

                      {/* Status Badges */}
                      {appt.status === 'pending' && (
                        <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                          <Clock className="w-3 h-3 animate-spin" /> Aguardando Aprovação
                        </span>
                      )}
                      {appt.status === 'confirmed' && (
                        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Confirmado
                        </span>
                      )}
                      {appt.status === 'completed' && (
                        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" /> Baixa Concluída
                        </span>
                      )}
                      {appt.status === 'rescheduled' && (
                        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" /> Reagendado
                        </span>
                      )}
                      {appt.status === 'declined' && (
                        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Recusado
                        </span>
                      )}
                      {appt.status === 'cancelled' && (
                        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-zinc-900 text-zinc-500 border border-zinc-800">
                          Cancelado
                        </span>
                      )}
                      {appt.status === 'no_show' && (
                        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30">
                          Não Compareceu
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-300">
                      <span className="flex items-center gap-1.5">
                        <Scissors className="w-3.5 h-3.5 text-amber-500" />
                        <strong className="text-white">{service?.name || 'Serviço Personalizado'}</strong>
                      </span>
                      <span className="text-zinc-600">•</span>
                      <span className="flex items-center gap-1">
                        <span className="text-zinc-400">Barbeiro:</span>
                        <strong className="text-amber-400">{barber?.name || 'Não atribuído'}</strong>
                      </span>
                      <span className="text-zinc-600">•</span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{appt.customerPhone}</span>
                      </span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-amber-400 font-black text-sm">{formatCurrency(appt.price)}</span>
                    </div>

                    {/* Notes or decline reasons */}
                    {appt.notes && (
                      <p className="text-[11px] text-zinc-400 bg-zinc-950/60 p-2 rounded-xl border border-zinc-800/80">
                        <strong className="text-zinc-300">Obs do cliente:</strong> {appt.notes}
                      </p>
                    )}

                    {appt.rejectionReason && (
                      <p className="text-[11px] text-red-300 bg-red-950/30 p-2 rounded-xl border border-red-900/40 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                        <span><strong>Motivo da recusa:</strong> {appt.rejectionReason}</span>
                      </p>
                    )}

                    {/* Notifications & Sync Status Indicators */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {/* Google Calendar sync status badge */}
                      {appt.googleCalendarSynced ? (
                        <div className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md text-[10px] text-blue-300 font-semibold">
                          <CalendarIcon className="w-3 h-3 text-blue-400" />
                          <span>Google Agenda</span>
                          {appt.googleCalendarHtmlLink && (
                            <a
                              href={appt.googleCalendarHtmlLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-400 hover:text-white ml-0.5"
                              title="Abrir no Google Agenda"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                          {deleteGCalConfirmId === appt.id ? (
                            <span className="flex items-center gap-1 ml-1 text-red-300 bg-red-950/80 px-1.5 py-0.2 rounded border border-red-800">
                              Remover?
                              <button
                                type="button"
                                onClick={() => {
                                  deleteGoogleCalendarEventForAppt(appt.id);
                                  setDeleteGCalConfirmId(null);
                                }}
                                className="text-red-400 hover:text-white font-bold underline ml-0.5"
                              >
                                Sim
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteGCalConfirmId(null)}
                                className="text-zinc-400 hover:text-white ml-0.5"
                              >
                                Não
                              </button>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeleteGCalConfirmId(appt.id)}
                              className="text-zinc-500 hover:text-red-400 ml-1 transition-colors text-xs font-bold"
                              title="Remover evento do Google Calendar"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={async () => {
                            setSyncingApptId(appt.id);
                            try {
                              await syncAppointmentToGoogleCalendar(appt.id);
                            } finally {
                              setSyncingApptId(null);
                            }
                          }}
                          disabled={syncingApptId === appt.id}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-400 hover:text-blue-300 bg-zinc-950 px-2 py-0.5 rounded-md border border-zinc-800 hover:border-blue-500/40 transition-colors"
                          title="Sincronizar este agendamento no Google Calendar"
                        >
                          <CalendarPlus className="w-3 h-3 text-blue-400" />
                          <span>{syncingApptId === appt.id ? 'Sincronizando...' : 'Salvar no Google Agenda'}</span>
                        </button>
                      )}

                      {appt.emailNotificationSent && (
                        <button
                          type="button"
                          onClick={() => openEmailModal(appt)}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-400 hover:text-white bg-zinc-950 px-2 py-0.5 rounded-md border border-zinc-800 hover:border-zinc-700 transition-colors"
                          title="Clique para ver o E-mail disparado"
                        >
                          <Mail className="w-3 h-3 text-amber-400" />
                          <span>E-mail Notificado</span>
                          <Eye className="w-2.5 h-2.5 ml-0.5 text-zinc-500" />
                        </button>
                      )}

                      {appt.whatsappNotificationSent && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          <Share2 className="w-3 h-3" />
                          <span>WhatsApp Enviado</span>
                        </span>
                      )}

                      {appt.history && appt.history.length > 0 && (
                        <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                          <History className="w-3 h-3" />
                          <span>Última ação: {appt.history[appt.history.length - 1].description}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Section: Action Controls */}
                <div className="flex flex-col sm:flex-row xl:flex-col items-stretch sm:items-center xl:items-end gap-2 border-t xl:border-t-0 pt-3 xl:pt-0">
                  {/* Primary Pending Actions: Accept, Refuse, Reschedule */}
                  {isPending ? (
                    <div className="flex flex-wrap items-center gap-2 w-full justify-end">
                      <button
                        type="button"
                        id={`accept-appt-${appt.id}`}
                        onClick={() => acceptAppointment(appt.id, true)}
                        className="flex-1 sm:flex-none py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20"
                      >
                        <Check className="w-4 h-4" />
                        <span>Aceitar</span>
                      </button>

                      <button
                        type="button"
                        id={`reschedule-pending-appt-${appt.id}`}
                        onClick={() => openRescheduleModal(appt)}
                        className="flex-1 sm:flex-none py-2 px-3.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/40 font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reagendar</span>
                      </button>

                      <button
                        type="button"
                        id={`decline-appt-${appt.id}`}
                        onClick={() => openDeclineModal(appt)}
                        className="flex-1 sm:flex-none py-2 px-3.5 bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/40 font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Recusar</span>
                      </button>
                    </div>
                  ) : isCompleted ? (
                    /* COMPLETED / BAIXA REALIZADA ACTIONS */
                    <div className="flex flex-wrap items-center gap-2 w-full justify-end">
                      <button
                        type="button"
                        id={`completed-receipt-${appt.id}`}
                        onClick={() => openEmailModal(appt)}
                        className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                        title="Ver / Enviar Recibo de Confirmação"
                      >
                        <Mail className="w-3.5 h-3.5 text-amber-400" />
                        <span>Enviar Recibo</span>
                      </button>

                      <button
                        type="button"
                        id={`completed-thanks-${appt.id}`}
                        onClick={() => openMessageModal(appt, 'thank_you')}
                        className="py-2 px-3.5 bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                        title="Enviar Agradecimento via WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Agradecimento WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        id={`completed-reopen-${appt.id}`}
                        onClick={() => updateAppointmentStatus(appt.id, 'confirmed')}
                        className="py-2 px-3 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-amber-300 border border-zinc-800 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                        title="Desfazer Baixa (Reabrir atendimento)"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reabrir</span>
                      </button>
                    </div>
                  ) : (
                    /* Confirmed & Active Actions */
                    <div className="flex flex-wrap items-center gap-2 w-full justify-end">
                      {/* Haircut Push Reminder Trigger */}
                      <div className="relative">
                        <button
                          type="button"
                          id={`push-reminder-btn-${appt.id}`}
                          onClick={() => setActiveReminderApptId(activeReminderApptId === appt.id ? null : appt.id)}
                          className="py-2 px-3 bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                          title="Disparar Lembrete Push nativo para o cliente"
                        >
                          <Bell className="w-3.5 h-3.5 text-amber-400" />
                          <span>Lembrete Push</span>
                        </button>

                        {activeReminderApptId === appt.id && (
                          <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-950 border border-amber-500/40 rounded-2xl p-2 shadow-2xl z-30 space-y-1">
                            <div className="px-2 py-1 border-b border-zinc-800 text-[10px] uppercase font-bold tracking-wider text-amber-400">
                              Enviar Notificação Push:
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                sendClientHaircutReminder(appt.id, '1_hour_before');
                                setActiveReminderApptId(null);
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-xs text-zinc-200 hover:text-white flex items-center gap-2"
                            >
                              <span>⏰</span>
                              <span>Faltam 60 Minutos</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                sendClientHaircutReminder(appt.id, 'today');
                                setActiveReminderApptId(null);
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-xs text-zinc-200 hover:text-white flex items-center gap-2"
                            >
                              <span>💈</span>
                              <span>Seu corte é hoje!</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                sendClientHaircutReminder(appt.id, 'tomorrow');
                                setActiveReminderApptId(null);
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-xs text-zinc-200 hover:text-white flex items-center gap-2"
                            >
                              <span>🗓️</span>
                              <span>Lembrete de Véspera</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                sendClientHaircutReminder(appt.id, 'maintenance_15d');
                                setActiveReminderApptId(null);
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-xs text-zinc-200 hover:text-white flex items-center gap-2"
                            >
                              <span>✂️</span>
                              <span>Retorno (15 dias)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                sendClientHaircutReminder(appt.id, 'maintenance_30d');
                                setActiveReminderApptId(null);
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-xs text-zinc-200 hover:text-white flex items-center gap-2"
                            >
                              <span>💈</span>
                              <span>Renovar Estilo (30 dias)</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Barber manual message editor */}
                      <button
                        type="button"
                        id={`message-client-${appt.id}`}
                        onClick={() => openMessageModal(appt, 'confirmation')}
                        className="py-2 px-3 bg-emerald-600/15 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                        title="Abrir editor de mensagem manual e WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Mensagem ao Cliente</span>
                      </button>

                      {/* Reschedule Button */}
                      <button
                        type="button"
                        id={`reschedule-appt-${appt.id}`}
                        onClick={() => openRescheduleModal(appt)}
                        className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                        title="Mudar data ou horário deste atendimento"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                        <span>Reagendar</span>
                      </button>

                      {/* View Email Voucher Modal */}
                      <button
                        type="button"
                        id={`view-email-${appt.id}`}
                        onClick={() => openEmailModal(appt)}
                        className="py-2 px-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-xl text-xs transition-colors"
                        title="Ver e-mail de confirmação"
                      >
                        <Mail className="w-3.5 h-3.5 text-amber-400" />
                      </button>

                      {/* Primary "Dar Baixa / Concluir" button */}
                      {appt.status !== 'declined' && appt.status !== 'cancelled' && (
                        <button
                          type="button"
                          id={`complete-appt-${appt.id}`}
                          onClick={() => updateAppointmentStatus(appt.id, 'completed')}
                          className="py-2 px-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md"
                          title="Dar Baixa e Marcar como Concluído"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Concluir Corte</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Secondary Status Handlers (No-show, Cancel) */}
                  {!isPending && !isCompleted && (
                    <div className="flex items-center gap-2 self-end text-xs pt-1">
                      {appt.status === 'confirmed' && (
                        <button
                          id={`noshow-appt-${appt.id}`}
                          onClick={() => updateAppointmentStatus(appt.id, 'no_show')}
                          className="py-1 px-2.5 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-orange-300 border border-zinc-800 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1"
                          title="Registrar Falta do cliente"
                        >
                          <UserX className="w-3 h-3 text-orange-400" />
                          <span>Registrar Falta</span>
                        </button>
                      )}

                      {appt.status !== 'cancelled' && appt.status !== 'declined' && (
                        <>
                          {isConfirmingCancel ? (
                            <div className="flex items-center gap-1 bg-red-950/80 p-1 rounded-lg border border-red-800">
                              <span className="text-[10px] text-red-200 px-1">Confirmar?</span>
                              <button
                                type="button"
                                id={`confirm-cancel-appt-${appt.id}`}
                                onClick={() => {
                                  cancelAppointment(appt.id);
                                  setCancelConfirmId(null);
                                }}
                                className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold hover:bg-red-500"
                              >
                                Sim
                              </button>
                              <button
                                type="button"
                                onClick={() => setCancelConfirmId(null)}
                                className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded text-[10px] hover:bg-zinc-700"
                              >
                                Não
                              </button>
                            </div>
                          ) : (
                            <button
                              id={`cancel-admin-appt-${appt.id}`}
                              onClick={() => setCancelConfirmId(appt.id)}
                              className="py-1 px-2.5 bg-zinc-950 hover:bg-red-950/50 text-zinc-400 hover:text-red-300 border border-zinc-800 hover:border-red-900 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1"
                              title="Cancelar agendamento"
                            >
                              <XCircle className="w-3 h-3 text-red-400" />
                              <span>Cancelar</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Manual Appointment Modal */}
      <ManualAppointmentModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        initialDate={selectedDate}
      />
    </div>
  );
};
