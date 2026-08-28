import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Scissors,
  User,
  Shield,
  Calendar,
  LogOut,
  Sparkles,
  Menu,
  X,
  QrCode,
  MessageSquare,
  ChevronRight,
  ShieldCheck,
  Crown,
  Clock,
} from 'lucide-react';

interface HeaderProps {
  onOpenMyBookings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMyBookings }) => {
  const {
    settings,
    currentUser,
    isAdminAuthenticated,
    openBookingModal,
    openSocialLoginModal,
    openQrCodeModal,
    setActiveView,
    logout,
    appointments,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Trigger floating chat from header
  const handleOpenChat = () => {
    window.dispatchEvent(new CustomEvent('open-barberflow-chat'));
  };

  // Count user's active bookings if logged in
  const userBookingsCount = currentUser
    ? appointments.filter(
        (a) =>
          (a.customerEmail === currentUser.email ||
            a.customerPhone === currentUser.phone ||
            a.customerId === currentUser.id) &&
          a.status !== 'cancelled'
      ).length
    : 0;

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isBarber = currentUser?.role === 'barber';

  return (
    <header
      id="main-header"
      className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800/90 shadow-2xl transition-all"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-2 sm:gap-4">
        {/* SECTION 1: Brand Identity & Logo */}
        <div
          id="header-brand-section"
          className="flex items-center gap-3 cursor-pointer group flex-shrink-0"
          onClick={() => setActiveView('client')}
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-[1.5px] shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
            <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center text-amber-400">
              <Scissors className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-xl font-black tracking-tight text-white flex items-center">
                Barber<span className="text-amber-400">Flow</span>
              </span>
              <span className="hidden xl:inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Aberto
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest block font-bold">
              {settings.businessName || 'Studio & Barbershop'}
            </span>
          </div>
        </div>

        {/* SECTION 2: Desktop Navigation Links (Pill Group) */}
        <nav
          id="header-navigation-pills"
          className="hidden lg:flex items-center gap-1 bg-zinc-900/80 border border-zinc-800/80 p-1.5 rounded-2xl text-xs font-semibold text-zinc-300 shadow-inner"
        >
          <a
            href="#servicos"
            className="px-3.5 py-2 rounded-xl hover:text-white hover:bg-zinc-800/80 transition-all"
          >
            Serviços
          </a>
          <a
            href="#barbeiros"
            className="px-3.5 py-2 rounded-xl hover:text-white hover:bg-zinc-800/80 transition-all"
          >
            Barbeiros
          </a>
          <a
            href="#clube-e-produtos-section"
            className="px-3.5 py-2 rounded-xl text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-all flex items-center gap-1.5 font-bold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Clube & Loja</span>
          </a>
          <a
            href="#avaliacoes"
            className="px-3.5 py-2 rounded-xl hover:text-white hover:bg-zinc-800/80 transition-all"
          >
            Avaliações
          </a>
          <a
            href="#localizacao"
            className="px-3.5 py-2 rounded-xl hover:text-white hover:bg-zinc-800/80 transition-all"
          >
            Horários & Local
          </a>
        </nav>

        {/* SECTION 3: Separated Action Modules */}
        <div id="header-actions-group" className="hidden sm:flex items-center gap-2 lg:gap-3">
          {/* Quick Utility Tools Group (Chat + QR Code) */}
          <div className="flex items-center gap-1.5 bg-zinc-900/70 border border-zinc-800/80 p-1 rounded-2xl">
            {/* Chat Assistant Button */}
            <button
              id="header-open-chat-btn"
              onClick={handleOpenChat}
              className="p-2.5 rounded-xl bg-zinc-950 hover:bg-amber-500/15 text-zinc-300 hover:text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all border border-zinc-800/80 hover:border-amber-500/40 relative"
              title="Abrir Chat de Atendimento Online"
            >
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span className="hidden xl:inline">Chat</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-1.5 right-1.5"></span>
            </button>

            {/* QR Code Quick Modal Trigger */}
            <button
              id="header-qrcode-btn"
              onClick={openQrCodeModal}
              className="p-2.5 rounded-xl bg-zinc-950 hover:bg-amber-500/15 text-zinc-300 hover:text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all border border-zinc-800/80 hover:border-amber-500/40"
              title="Abrir QR Code para Clientes e Balcão"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span className="hidden xl:inline font-bold">QR Code</span>
            </button>
          </div>

          {/* User Status / My Bookings */}
          <div className="flex items-center gap-1.5 bg-zinc-900/70 border border-zinc-800/80 p-1 rounded-2xl">
            <button
              id="header-my-bookings-btn"
              onClick={onOpenMyBookings}
              className="py-2 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-zinc-800"
              title="Ver meus agendamentos"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Minhas Reservas</span>
              {userBookingsCount > 0 && (
                <span className="bg-amber-500 text-black text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  {userBookingsCount}
                </span>
              )}
            </button>

            {/* Profile or Login Button */}
            {currentUser ? (
              <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 py-1 px-2.5 rounded-xl">
                <img
                  src={
                    currentUser.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
                  }
                  alt={currentUser.name}
                  className="w-6 h-6 rounded-full object-cover border border-amber-500"
                />
                <span className="text-xs font-bold text-white max-w-[90px] truncate">
                  {currentUser.name.split(' ')[0]}
                </span>
                <button
                  id="header-logout-btn"
                  onClick={logout}
                  className="text-zinc-500 hover:text-red-400 p-1 transition-colors"
                  title="Sair da Conta"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                id="header-login-btn"
                onClick={openSocialLoginModal}
                className="py-2 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-zinc-800"
              >
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Entrar</span>
              </button>
            )}
          </div>

          {/* Admin / TI / Barber Panel Access (Restricted) */}
          <div className="flex items-center">
            {isAdminAuthenticated && isBarber ? (
              <button
                id="header-barber-panel-btn"
                onClick={() => setActiveView('barber')}
                className="py-2.5 px-3.5 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 bg-amber-500/15 border-2 border-amber-500 text-amber-300 hover:bg-amber-500/25 shadow-lg shadow-amber-500/10"
              >
                <Scissors className="w-4 h-4 text-amber-400" />
                <span>Painel Barbeiro</span>
              </button>
            ) : isAdminAuthenticated && isSuperAdmin ? (
              <button
                id="header-ti-panel-btn"
                onClick={() => setActiveView('admin')}
                className="py-2.5 px-3.5 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 bg-amber-500/20 border-2 border-amber-500 text-amber-300 hover:bg-amber-500/30 shadow-lg shadow-amber-500/10"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Painel T.I. / Admin</span>
              </button>
            ) : (
              <button
                id="header-admin-login-btn"
                onClick={openSocialLoginModal}
                className="py-2 px-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
                title="Acesso restrito para Barbeiros e T.I."
              >
                <Shield className="w-3.5 h-3.5 text-zinc-400" />
                <span className="hidden xl:inline">Acesso T.I. / Barbeiros</span>
                <span className="xl:hidden">Equipe</span>
              </button>
            )}
          </div>

          {/* Main Booking CTA */}
          <button
            id="header-book-now-btn"
            onClick={() => openBookingModal()}
            className="py-2.5 px-5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-95 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 fill-current animate-pulse" />
            <span>AGENDAR AGORA</span>
          </button>
        </div>

        {/* Mobile Header Buttons */}
        <div className="flex items-center gap-2 sm:hidden">
          <button
            id="mobile-chat-quick-btn"
            onClick={handleOpenChat}
            className="p-2 bg-zinc-900 border border-zinc-800 text-amber-400 rounded-xl"
            title="Chat Online"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          <button
            id="mobile-book-cta-btn"
            onClick={() => openBookingModal()}
            className="py-2 px-3 bg-amber-500 text-black font-black text-xs rounded-xl uppercase tracking-wider shadow-md"
          >
            Agendar
          </button>

          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-zinc-300 hover:text-white bg-zinc-900 rounded-xl border border-zinc-800"
            aria-label="Abrir Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-zinc-950/98 border-b-2 border-zinc-800 px-4 py-5 space-y-4 shadow-2xl backdrop-blur-2xl max-h-[85vh] overflow-y-auto">
          {/* Main Action Banner */}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              openBookingModal();
            }}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-black font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>Agendar Atendimento Agora</span>
          </button>

          {/* Navigation Links Group */}
          <div className="p-3 bg-zinc-900/80 rounded-2xl border border-zinc-800/80 space-y-1">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block px-2 mb-1">
              Navegação
            </span>
            <a
              href="#servicos"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2 px-2 text-sm font-semibold text-zinc-200 hover:text-amber-400"
            >
              <span>Serviços & Preços</span>
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            </a>
            <a
              href="#barbeiros"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2 px-2 text-sm font-semibold text-zinc-200 hover:text-amber-400"
            >
              <span>Barbeiros Especialistas</span>
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            </a>
            <a
              href="#clube-e-produtos-section"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2 px-2 text-sm font-bold text-amber-300"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Clube VIP & Produtos</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            </a>
            <a
              href="#avaliacoes"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2 px-2 text-sm font-semibold text-zinc-200 hover:text-amber-400"
            >
              <span>Avaliações dos Clientes</span>
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            </a>
            <a
              href="#localizacao"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2 px-2 text-sm font-semibold text-zinc-200 hover:text-amber-400"
            >
              <span>Localização & Horários</span>
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            </a>
          </div>

          {/* Quick Tools Group */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleOpenChat();
              }}
              className="py-3 px-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-bold flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span>Chat Online</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                openQrCodeModal();
              }}
              className="py-3 px-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-bold flex items-center justify-center gap-2"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>QR Code</span>
            </button>
          </div>

          {/* Client Account Group */}
          <div className="p-3 bg-zinc-900/80 rounded-2xl border border-zinc-800/80 space-y-2">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block px-2 mb-1">
              Área do Cliente
            </span>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenMyBookings();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs font-bold flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Minhas Reservas</span>
              </div>
              {userBookingsCount > 0 && (
                <span className="bg-amber-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded-full">
                  {userBookingsCount}
                </span>
              )}
            </button>

            {currentUser ? (
              <div className="flex items-center justify-between pt-1 px-1">
                <div className="flex items-center gap-2">
                  <img
                    src={
                      currentUser.avatar ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
                    }
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover border border-amber-500"
                  />
                  <span className="text-xs font-bold text-white">{currentUser.name}</span>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="text-xs text-red-400 font-bold hover:text-red-300"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openSocialLoginModal();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs font-bold flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4 text-amber-400" />
                <span>Entrar / Cadastrar (Google / Direto)</span>
              </button>
            )}
          </div>

          {/* Team / Staff / T.I. Access */}
          <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800/80 space-y-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block px-2 mb-1">
              Acesso Restrito da Barbearia
            </span>

            {isAdminAuthenticated && isBarber ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setActiveView('barber');
                }}
                className="w-full py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black flex items-center justify-center gap-2"
              >
                <Scissors className="w-4 h-4 text-amber-400" />
                <span>Acessar Painel do Barbeiro</span>
              </button>
            ) : isAdminAuthenticated && isSuperAdmin ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setActiveView('admin');
                }}
                className="w-full py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Acessar Painel T.I. / Admin Master</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openSocialLoginModal();
                }}
                className="w-full py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-semibold flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                <span>Login T.I. / Barbeiros</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
