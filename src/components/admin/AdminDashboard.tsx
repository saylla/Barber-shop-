import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  formatCurrency,
  formatDateBR,
  getTodayDateString,
  WEEKDAY_SHORT,
} from '../../utils/calendarUtils';
import {
  Calendar,
  DollarSign,
  Users,
  Clock,
  TrendingUp,
  Scissors,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  Mail,
  Share2,
  Check,
  UserCheck,
  Coffee,
  Activity,
  RotateCcw,
  MessageSquare,
  BadgeCheck,
} from 'lucide-react';
import { Appointment } from '../../types';

export const AdminDashboard: React.FC<{ onNavigateToSchedule: () => void }> = ({
  onNavigateToSchedule,
}) => {
  const {
    appointments,
    customers,
    services,
    professionals,
    settings,
    professionalLiveStates,
    refreshCountdown,
    refreshDashboardData,
    openEmailModal,
    openMessageModal,
    updateAppointmentStatus,
  } = useApp();

  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [recentlyCompletedId, setRecentlyCompletedId] = useState<string | null>(null);
  const todayStr = getTodayDateString();

  const handleManualRefresh = () => {
    setIsManualSyncing(true);
    refreshDashboardData();
    setTimeout(() => {
      setIsManualSyncing(false);
    }, 600);
  };

  const handleCompleteCut = (apptId: string) => {
    updateAppointmentStatus(apptId, 'completed');
    setRecentlyCompletedId(apptId);
    setTimeout(() => {
      setRecentlyCompletedId(null);
    }, 4000);
  };

  // 1. Appointments Today
  const todayAppointments = appointments.filter(
    (a) => a.date === todayStr && a.status !== 'cancelled'
  );

  // 2. Completed Appointments Today (Baixas Realizadas)
  const completedTodayAppointments = todayAppointments
    .filter((a) => a.status === 'completed')
    .sort((a, b) => b.time.localeCompare(a.time));

  // 3. Appointments this week
  const todayDate = new Date();
  const weekStart = new Date(todayDate);
  weekStart.setDate(todayDate.getDate() - todayDate.getDay());
  const weekEnd = new Date(todayDate);
  weekEnd.setDate(todayDate.getDate() + (6 - todayDate.getDay()));

  const thisWeekAppointments = appointments.filter((a) => {
    if (a.status === 'cancelled') return false;
    const [y, m, d] = a.date.split('-').map(Number);
    const apptDate = new Date(y, m - 1, d);
    return apptDate >= weekStart && apptDate <= weekEnd;
  });

  // 4. Revenue Stats
  const totalRevenue = appointments
    .filter((a) => a.status === 'confirmed' || a.status === 'completed')
    .reduce((sum, a) => sum + a.price, 0);

  const todayRevenue = todayAppointments
    .filter((a) => a.status === 'confirmed' || a.status === 'completed')
    .reduce((sum, a) => sum + a.price, 0);

  const todayCompletedRevenue = completedTodayAppointments.reduce(
    (sum, a) => sum + a.price,
    0
  );

  // 5. Total Registered Customers
  const totalCustomersCount = customers.length;

  // 6. Next scheduled appointment today (upcoming active)
  const currentMinutes = todayDate.getHours() * 60 + todayDate.getMinutes();
  const upcomingToday = todayAppointments
    .filter((a) => {
      const [h, m] = a.time.split(':').map(Number);
      return h * 60 + m >= currentMinutes && a.status !== 'completed' && a.status !== 'declined';
    })
    .sort((a, b) => a.time.localeCompare(b.time));

  const nextPendingOrConfirmed =
    upcomingToday[0] ||
    todayAppointments.find((a) => a.status === 'confirmed' || a.status === 'pending') ||
    null;

  const nextService = nextPendingOrConfirmed
    ? services.find((s) => s.id === nextPendingOrConfirmed.serviceId)
    : null;
  const nextBarber = nextPendingOrConfirmed
    ? professionals.find((p) => p.id === nextPendingOrConfirmed.professionalId)
    : null;

  // 7. Day by Day distribution for the weekly chart
  const weekDayCounts = [0, 0, 0, 0, 0, 0, 0];
  thisWeekAppointments.forEach((a) => {
    const [y, m, d] = a.date.split('-').map(Number);
    const day = new Date(y, m - 1, d).getDay();
    weekDayCounts[day] += 1;
  });
  const maxWeeklyCount = Math.max(...weekDayCounts, 1);

  // 8. Revenue per service category
  const categoryRevenue: { [key: string]: number } = {};
  appointments.forEach((a) => {
    if (a.status === 'cancelled') return;
    const s = services.find((srv) => srv.id === a.serviceId);
    const cat = s?.name || 'Outro';
    categoryRevenue[cat] = (categoryRevenue[cat] || 0) + a.price;
  });

  const topServices = Object.entries(categoryRevenue)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div id="admin-dashboard-view" className="space-y-6">
      {/* Real-time 30s Auto-Refresh Banner */}
      <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-md">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div className="flex items-center gap-2">
            <strong className="text-zinc-200">Visão Geral em Tempo Real:</strong>
            <span className="text-zinc-400">
              Atualização automática da agenda e status em{' '}
              <span className="font-mono font-bold text-amber-400">{refreshCountdown}s</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            id="manual-refresh-dashboard-btn"
            onClick={handleManualRefresh}
            disabled={isManualSyncing}
            className="py-1.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold flex items-center gap-1.5 transition-colors border border-zinc-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isManualSyncing ? 'Sincronizando...' : 'Atualizar Agora'}</span>
          </button>
        </div>
      </div>

      {/* Top Welcome & Summary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Painel Executivo</span>
          </div>
          <h1 className="text-2xl font-extrabold font-display text-white">
            Visão Geral da {settings.name.split(' ')[0]}
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Hoje é {formatDateBR(todayStr, true)}. Agenda, faturamento e status dos barbeiros.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="dash-open-schedule-btn"
            onClick={onNavigateToSchedule}
            className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 self-start sm:self-auto"
          >
            <Calendar className="w-4 h-4" />
            <span>Ver Agenda Completa</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-400 block">Agendamentos Hoje</span>
            <div className="text-2xl font-black text-white mt-1">
              {todayAppointments.length}
            </div>
            <span className="text-[11px] text-emerald-400 font-medium">
              {completedTodayAppointments.length} concluídos (baixados)
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-400 block">Atendimentos na Semana</span>
            <div className="text-2xl font-black text-white mt-1">
              {thisWeekAppointments.length}
            </div>
            <span className="text-[11px] text-zinc-400">
              Taxa de ocupação alta
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-400 block">Faturamento Estimado</span>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {formatCurrency(totalRevenue)}
            </div>
            <span className="text-[11px] text-emerald-400 font-medium">
              {formatCurrency(todayCompletedRevenue)} já recebidos hoje
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-400 block">Clientes Cadastrados</span>
            <div className="text-2xl font-black text-white mt-1">
              {totalCustomersCount}
            </div>
            <span className="text-[11px] text-zinc-400">Base fidelizada</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* SECTION: REAL-TIME BARBER STATUS BOARD */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Status dos Barbeiros em Tempo Real</h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Monitoramento ao vivo de atendimento, pausas e baixa direta de cortes
            </p>
          </div>
          <span className="text-[11px] text-zinc-400 font-medium bg-zinc-800 px-3 py-1 rounded-full border border-zinc-700 self-start sm:self-auto">
            {professionals.filter((p) => p.active).length} barbeiros ativos
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {professionals.map((prof) => {
            const liveState = professionalLiveStates[prof.id] || {
              professionalId: prof.id,
              professionalName: prof.name,
              status: 'available',
              statusLabel: 'Disponível',
              badgeColor: 'bg-zinc-800 text-zinc-300 border-zinc-700',
              completedTodayCount: 0,
              totalTodayCount: 0,
              todayRevenue: 0,
            };

            const currentAppt = liveState.currentAppointment;
            const currentService = currentAppt
              ? services.find((s) => s.id === currentAppt.serviceId)
              : null;

            return (
              <div
                key={prof.id}
                id={`barber-live-card-${prof.id}`}
                className="bg-zinc-950/70 border border-zinc-800 rounded-2xl p-4.5 space-y-3.5 shadow-inner flex flex-col justify-between hover:border-zinc-700 transition-colors"
              >
                <div>
                  {/* Barber Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={prof.avatar}
                          alt={prof.name}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80';
                          }}
                          className="w-12 h-12 rounded-xl object-cover border border-zinc-700"
                        />
                        {liveState.status === 'in_service' && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-zinc-950 animate-ping" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">{prof.name}</h4>
                        <p className="text-[11px] text-zinc-400">{prof.specialty}</p>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mt-3">
                    <div
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center justify-between ${liveState.badgeColor}`}
                    >
                      <div className="flex items-center gap-1.5">
                        {liveState.status === 'in_service' && <Scissors className="w-3.5 h-3.5 animate-spin" />}
                        {liveState.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {liveState.status === 'available' && <UserCheck className="w-3.5 h-3.5" />}
                        {liveState.status === 'lunch' && <Coffee className="w-3.5 h-3.5" />}
                        <span>{liveState.statusLabel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Active Client Details if in service with Quick "Dar Baixa" button */}
                  {currentAppt && (
                    <div className="mt-2.5 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Cliente Atual:</span>
                        <strong className="text-emerald-300 font-bold">{currentAppt.customerName}</strong>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">Serviço:</span>
                        <span className="text-zinc-300">{currentService?.name} ({formatCurrency(currentAppt.price)})</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">Horário:</span>
                        <span className="text-zinc-300">{currentAppt.time} ({currentAppt.durationMinutes} min)</span>
                      </div>

                      {/* Direct Baixa Button on Barber Card */}
                      <button
                        type="button"
                        id={`barber-complete-btn-${prof.id}`}
                        onClick={() => handleCompleteCut(currentAppt.id)}
                        className="w-full mt-2 py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Concluir Corte (Dar Baixa)</span>
                      </button>
                    </div>
                  )}

                  {/* Next appointment preview */}
                  {!currentAppt && liveState.nextAppointment && (
                    <div className="mt-2.5 p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Próximo Cliente:</span>
                        <strong className="text-zinc-200">{liveState.nextAppointment.customerName}</strong>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">Horário:</span>
                        <span className="text-amber-400 font-bold">{liveState.nextAppointment.time}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Barber Day Metrics */}
                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
                  <span>
                    Concluídos: <strong className="text-white">{liveState.completedTodayCount}/{liveState.totalTodayCount}</strong>
                  </span>
                  <span>
                    Produção: <strong className="text-amber-400">{formatCurrency(liveState.todayRevenue)}</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION: CORTES E ATENDIMENTOS BAIXADOS HOJE (Concluídos) */}
      <div className="bg-zinc-900 border border-emerald-500/30 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
              <BadgeCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Cortes Concluídos Hoje (Baixas Realizadas)</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/40">
                  {completedTodayAppointments.length} baixas
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Histórico em tempo real dos cortes finalizados hoje com envio de recibos e comprovantes
              </p>
            </div>
          </div>

          <div className="text-right self-start sm:self-auto bg-zinc-950 px-4 py-2 rounded-2xl border border-zinc-800">
            <span className="text-[10px] text-zinc-400 uppercase font-bold block">Faturado Hoje com Baixas</span>
            <strong className="text-base font-black text-emerald-400">{formatCurrency(todayCompletedRevenue)}</strong>
          </div>
        </div>

        {completedTodayAppointments.length === 0 ? (
          <div className="text-center py-8 bg-zinc-950/40 border border-dashed border-zinc-800 rounded-2xl">
            <Clock className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-zinc-300">
              Nenhum corte baixado como concluído hoje ainda.
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Assim que um corte for finalizado e baixado, ele subirá e ficará listado aqui com opções de recibo e WhatsApp.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {completedTodayAppointments.map((appt) => {
              const srv = services.find((s) => s.id === appt.serviceId);
              const prof = professionals.find((p) => p.id === appt.professionalId);
              const isRecent = recentlyCompletedId === appt.id;

              return (
                <div
                  key={appt.id}
                  id={`completed-card-${appt.id}`}
                  className={`bg-zinc-950 border rounded-2xl p-4 transition-all space-y-3 shadow-md flex flex-col justify-between ${
                    isRecent
                      ? 'border-emerald-400 ring-2 ring-emerald-500/40 bg-emerald-950/20'
                      : 'border-emerald-500/20 hover:border-emerald-500/40'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Baixa Concluída
                          </span>
                          <span className="text-xs font-mono text-zinc-400">#{appt.code}</span>
                        </div>
                        <h4 className="font-bold text-base text-white mt-1.5">{appt.customerName}</h4>
                        <p className="text-xs text-zinc-400">{appt.customerPhone}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-zinc-300 bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800 block">
                          {appt.time}
                        </span>
                        <strong className="text-sm font-black text-amber-400 mt-1 block">
                          {formatCurrency(appt.price)}
                        </strong>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-zinc-900 text-xs space-y-1">
                      <div className="flex items-center justify-between text-zinc-400">
                        <span>Serviço:</span>
                        <strong className="text-zinc-200">{srv?.name || 'Corte'}</strong>
                      </div>
                      <div className="flex items-center justify-between text-zinc-400">
                        <span>Barbeiro:</span>
                        <strong className="text-amber-400">{prof?.name}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Actions for completed cut: Receipt/Voucher, WhatsApp Thank you, Undo */}
                  <div className="pt-3 border-t border-zinc-900 flex items-center gap-2">
                    <button
                      type="button"
                      id={`completed-email-btn-${appt.id}`}
                      onClick={() => openEmailModal(appt)}
                      className="flex-1 py-1.5 px-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                      title="Enviar Recibo / Voucher por E-mail"
                    >
                      <Mail className="w-3.5 h-3.5 text-amber-400" />
                      <span>Recibo</span>
                    </button>

                    <button
                      type="button"
                      id={`completed-whatsapp-btn-${appt.id}`}
                      onClick={() => openMessageModal(appt, 'thank_you')}
                      className="flex-1 py-1.5 px-2.5 bg-emerald-600/15 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                      title="Enviar Agradecimento no WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Agradecer</span>
                    </button>

                    <button
                      type="button"
                      id={`completed-undo-btn-${appt.id}`}
                      onClick={() => updateAppointmentStatus(appt.id, 'confirmed')}
                      className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-amber-300 border border-zinc-800 rounded-xl text-xs transition-colors"
                      title="Desfazer Baixa (Reabrir Agendamento)"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Next Client Spotlight Card & Weekly Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Next Client Card */}
        <div className="lg:col-span-5 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-amber-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Próximo Atendimento</span>
              </span>
              {nextPendingOrConfirmed && (
                <span className="text-xs font-mono text-zinc-400">#{nextPendingOrConfirmed.code}</span>
              )}
            </div>

            {nextPendingOrConfirmed ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-black flex items-center justify-center font-black text-lg">
                    {nextPendingOrConfirmed.time}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {nextPendingOrConfirmed.customerName}
                    </h3>
                    <p className="text-xs text-zinc-400">{nextPendingOrConfirmed.customerPhone}</p>
                    {nextPendingOrConfirmed.customerEmail && (
                      <p className="text-[11px] text-amber-400/80">{nextPendingOrConfirmed.customerEmail}</p>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800 text-xs space-y-1.5 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Serviço:</span>
                    <strong className="text-zinc-200">{nextService?.name}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Barbeiro:</span>
                    <strong className="text-amber-400">{nextBarber?.name}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Duração / Valor:</span>
                    <span className="text-zinc-300 font-semibold">
                      {nextPendingOrConfirmed.durationMinutes} min — {formatCurrency(nextPendingOrConfirmed.price)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Status:</span>
                    <span className="text-emerald-400 font-bold capitalize">{nextPendingOrConfirmed.status}</span>
                  </div>
                </div>

                {/* Quick actions on this next appointment */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    id="next-send-voucher-btn"
                    onClick={() => openEmailModal(nextPendingOrConfirmed)}
                    className="flex-1 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Enviar Voucher</span>
                  </button>
                  <button
                    type="button"
                    id="next-complete-cut-btn"
                    onClick={() => handleCompleteCut(nextPendingOrConfirmed.id)}
                    className="py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-1 transition-colors shadow-md"
                    title="Concluir e dar baixa"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Concluir Corte</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-zinc-300">
                  Nenhum atendimento pendente para as próximas horas hoje.
                </p>
                {completedTodayAppointments.length > 0 && (
                  <p className="text-xs text-emerald-400 font-medium mt-1">
                    {completedTodayAppointments.length} atendimentos foram concluídos hoje!
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800/80">
            <button
              onClick={onNavigateToSchedule}
              className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span>Gerenciar na Agenda</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Weekly Chart */}
        <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white">Fluxo de Agendamentos da Semana</h3>
              <p className="text-xs text-zinc-400">Volume diário de atendimentos agendados</p>
            </div>
            <span className="text-xs text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              Total: {thisWeekAppointments.length} cortes
            </span>
          </div>

          {/* Simple D3/CSS Bar Visualizer */}
          <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 px-2">
            {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
              const count = weekDayCounts[dayIdx];
              const heightPercent = maxWeeklyCount > 0 ? (count / maxWeeklyCount) * 100 : 0;
              const isToday = todayDate.getDay() === dayIdx;

              return (
                <div key={dayIdx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[10px] font-bold text-zinc-400">{count}</span>
                  <div className="w-full bg-zinc-800 rounded-t-lg h-full max-h-28 flex items-end justify-center p-1">
                    <div
                      style={{ height: `${Math.max(heightPercent, 8)}%` }}
                      className={`w-full rounded-md transition-all duration-500 ${
                        isToday
                          ? 'bg-amber-500 shadow-md shadow-amber-500/30'
                          : 'bg-zinc-600 hover:bg-zinc-500'
                      }`}
                    />
                  </div>
                  <span
                    className={`text-[11px] font-bold ${
                      isToday ? 'text-amber-400' : 'text-zinc-500'
                    }`}
                  >
                    {WEEKDAY_SHORT[dayIdx]}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <span>Serviços mais rentáveis:</span>
            <div className="flex gap-2">
              {topServices.slice(0, 2).map(([name, val]) => (
                <span key={name} className="text-zinc-300 font-medium">
                  {name}: <strong className="text-amber-400">{formatCurrency(val)}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
