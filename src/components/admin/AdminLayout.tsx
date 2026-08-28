import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  UserCheck,
  Clock,
  Settings as SettingsIcon,
  ExternalLink,
  LogOut,
  Shield,
  ShieldCheck,
  Menu,
  X,
  RefreshCw,
  Activity,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  QrCode,
  KeyRound,
  User,
  Package,
} from 'lucide-react';
import { AdminDashboard } from './AdminDashboard';
import { AdminSchedule } from './AdminSchedule';
import { AdminCustomers } from './AdminCustomers';
import { AdminServices } from './AdminServices';
import { AdminProfessionals } from './AdminProfessionals';
import { AdminHours } from './AdminHours';
import { AdminSettings } from './AdminSettings';
import { AdminUsers } from './AdminUsers';
import { AdminPackagesAndProducts } from './AdminPackagesAndProducts';
import { getTodayDateString } from '../../utils/calendarUtils';

type AdminTab =
  | 'dashboard'
  | 'schedule'
  | 'customers'
  | 'professionals'
  | 'services'
  | 'packages_products'
  | 'hours'
  | 'settings'
  | 'users';

export const AdminLayout: React.FC = () => {
  const {
    settings,
    setActiveView,
    logoutAdmin,
    appointments,
    refreshCountdown,
    lastSyncTimestamp,
    refreshDashboardData,
    currentUser,
    systemUsers,
    professionals,
    openQrCodeModal,
    openChangePasswordModal,
    showToast,
  } = useApp();

  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [lastAppointmentCount, setLastAppointmentCount] = useState(appointments.length);

  const isSuperAdmin = currentUser?.role === 'super_admin' || !currentUser?.role;
  const isBarber = currentUser?.role === 'barber';
  const linkedBarber = professionals.find((p) => p.id === currentUser?.professionalId);

  const todayStr = getTodayDateString();
  const todayAppointments = appointments.filter((a) => {
    const isToday = a.date === todayStr && a.status !== 'cancelled';
    if (isBarber && currentUser?.professionalId) {
      return isToday && a.professionalId === currentUser.professionalId;
    }
    return isToday;
  });

  const todayCompleted = todayAppointments.filter((a) => a.status === 'completed').length;
  const pendingCount = appointments.filter((a) => {
    const isPending = a.status === 'pending';
    if (isBarber && currentUser?.professionalId) {
      return isPending && a.professionalId === currentUser.professionalId;
    }
    return isPending;
  }).length;

  // Real-time polling detection for new bookings
  useEffect(() => {
    if (appointments.length > lastAppointmentCount) {
      const diff = appointments.length - lastAppointmentCount;
      showToast(
        `🔔 ${diff} novo${diff > 1 ? 's' : ''} agendamento${diff > 1 ? 's' : ''} detectado${diff > 1 ? 's' : ''} e sincronizado${diff > 1 ? 's' : ''}!`,
        'success'
      );
    }
    setLastAppointmentCount(appointments.length);
  }, [appointments.length]);

  const handleManualSync = () => {
    setIsManualSyncing(true);
    refreshDashboardData();
    setTimeout(() => {
      setIsManualSyncing(false);
      showToast('Dados do painel e agenda sincronizados com sucesso!', 'info');
    }, 600);
  };

  const navItems: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number; superAdminOnly?: boolean }[] = [
    { id: 'dashboard', label: 'Visão Geral', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'schedule', label: isBarber ? 'Minha Agenda' : 'Agenda & Cortes', icon: <Calendar className="w-4 h-4" />, badge: pendingCount },
    { id: 'customers', label: 'Clientes (CRM)', icon: <Users className="w-4 h-4" /> },
    { id: 'professionals', label: 'Profissionais', icon: <UserCheck className="w-4 h-4" /> },
    { id: 'services', label: 'Serviços & Preços', icon: <Scissors className="w-4 h-4" /> },
    { id: 'packages_products', label: 'Pacotes & Produtos', icon: <Package className="w-4 h-4" /> },
    { id: 'hours', label: 'Horários & Bloqueios', icon: <Clock className="w-4 h-4" /> },
    { id: 'users', label: 'Acessos & T.I.', icon: <ShieldCheck className="w-4 h-4" />, badge: systemUsers.filter(u => !u.active).length > 0 ? systemUsers.filter(u => !u.active).length : undefined },
    { id: 'settings', label: 'Configurações', icon: <SettingsIcon className="w-4 h-4" /> },
  ];

  return (
    <div id="admin-root-layout" className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-black flex items-center justify-center font-bold">
            <Scissors className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm text-white">BarberFlow Admin</span>
            <span className="text-[10px] text-amber-400 block font-semibold">
              {isBarber ? `Barbeiro: ${currentUser?.name}` : 'TI & Super Admin'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openQrCodeModal}
            className="p-2 text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg hover:bg-amber-500/20"
            title="Gerar QR Code de Balcão"
          >
            <QrCode className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleManualSync}
            disabled={isManualSyncing}
            className="p-2 text-zinc-300 hover:text-white rounded-lg bg-zinc-800 border border-zinc-700"
            title="Sincronizar dados agora"
          >
            <RefreshCw className={`w-4 h-4 ${isManualSyncing ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-2 text-zinc-300 hover:text-white rounded-lg bg-zinc-800"
          >
            {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside
        id="admin-sidebar"
        className={`${
          isMobileSidebarOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-zinc-900/95 border-r border-zinc-800 flex-shrink-0 p-5 flex flex-col justify-between z-20 md:sticky md:top-0 md:h-screen`}
      >
        <div className="space-y-5">
          {/* Brand header */}
          <div className="hidden md:flex items-center gap-3 pb-3 border-b border-zinc-800">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-black text-base text-white block">
                Barber<span className="text-amber-400">Flow</span>
              </span>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                {isBarber ? 'Painel Individual' : 'Painel Gestor & TI'}
              </span>
            </div>
          </div>

          {/* Current Logged Profile Badge */}
          <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1.5">
            <div className="flex items-center gap-2.5">
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                alt="Avatar"
                className="w-8 h-8 rounded-xl object-cover border border-amber-500/40"
              />
              <div className="min-w-0 flex-1">
                <span className="font-bold text-xs text-white block truncate">
                  {currentUser?.name || 'Administrador'}
                </span>
                <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                  {isBarber ? (
                    <>
                      <Scissors className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{linkedBarber?.specialty || 'Barbeiro'}</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-3 h-3 flex-shrink-0" />
                      <span>Super Admin (TI)</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* QR Code Action Button in Sidebar */}
          <button
            id="sidebar-qrcode-btn"
            type="button"
            onClick={openQrCodeModal}
            className="w-full py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-inner"
          >
            <QrCode className="w-4 h-4 text-amber-400" />
            <span>Gerar QR Code de Balcão</span>
          </button>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`admin-nav-${item.id}`}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-black'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                        isActive
                          ? 'bg-black text-amber-400'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-zinc-800 space-y-2 mt-6 md:mt-0">
          <button
            id="admin-to-client-btn"
            onClick={() => setActiveView('client')}
            className="w-full py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            <span>Ver Site do Cliente</span>
          </button>

          <button
            id="admin-logout-btn"
            onClick={logoutAdmin}
            className="w-full py-2 px-3 bg-red-950/30 hover:bg-red-900/50 border border-red-900/40 text-red-300 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair do Painel</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Persistent 30s Real-time Polling & Sync Status Bar */}
        <header className="bg-zinc-900/90 border-b border-zinc-800/80 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="flex items-center gap-2 text-zinc-300">
              <span className="font-bold text-white">Polling Ativo:</span>
              <span className="text-zinc-400 hidden sm:inline">
                Sincronizando a cada 30s (Próxima em{' '}
                <strong className="text-amber-400 font-mono">{refreshCountdown}s</strong>)
              </span>
              <span className="text-zinc-400 sm:hidden">
                <strong className="text-amber-400 font-mono">{refreshCountdown}s</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick QR Code Trigger */}
            <button
              id="topbar-qrcode-btn"
              type="button"
              onClick={openQrCodeModal}
              className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold rounded-lg border border-amber-500/30 transition-colors flex items-center gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">QR Code de Balcão</span>
            </button>

            {/* Live Today Badges */}
            <div className="hidden lg:flex items-center gap-2 text-[11px]">
              <span className="px-2.5 py-1 bg-zinc-800/80 text-zinc-300 border border-zinc-700/50 rounded-lg">
                Hoje: <strong className="text-white">{todayAppointments.length}</strong>
              </span>
              <span className="px-2.5 py-1 bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 rounded-lg">
                Concluídos: <strong className="text-white">{todayCompleted}</strong>
              </span>
              {pendingCount > 0 && (
                <span className="px-2.5 py-1 bg-amber-950/40 text-amber-300 border border-amber-800/40 rounded-lg animate-pulse">
                  Pendentes: <strong className="text-amber-200">{pendingCount}</strong>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-500 font-mono hidden md:inline">
                Última sync: {new Date(lastSyncTimestamp).toLocaleTimeString('pt-BR')}
              </span>
              <button
                type="button"
                id="admin-top-sync-btn"
                onClick={handleManualSync}
                disabled={isManualSyncing}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg border border-zinc-700/70 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                title="Forçar atualização de todos os gráficos e lista de agendamentos"
              >
                <RefreshCw className={`w-3 h-3 ${isManualSyncing ? 'animate-spin text-amber-400' : ''}`} />
                <span className="hidden sm:inline">{isManualSyncing ? 'Sincronizando...' : 'Atualizar'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Tab Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
          {currentTab === 'dashboard' && (
            <AdminDashboard onNavigateToSchedule={() => setCurrentTab('schedule')} />
          )}
          {currentTab === 'schedule' && <AdminSchedule />}
          {currentTab === 'customers' && <AdminCustomers />}
          {currentTab === 'professionals' && <AdminProfessionals />}
          {currentTab === 'services' && <AdminServices />}
          {currentTab === 'packages_products' && <AdminPackagesAndProducts />}
          {currentTab === 'hours' && <AdminHours />}
          {currentTab === 'users' && <AdminUsers />}
          {currentTab === 'settings' && <AdminSettings />}
        </main>
      </div>
    </div>
  );
};
