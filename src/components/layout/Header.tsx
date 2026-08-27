import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Scissors, User, Shield, Calendar, LogOut, Sparkles, Menu, X } from 'lucide-react';

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
    setActiveView,
    logout,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header id="main-header" className="sticky top-0 z-40 bg-zinc-950/85 backdrop-blur-md border-b border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveView('client')}>
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center text-amber-400">
              <Scissors className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="font-display text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
              Barber<span className="text-amber-400">Flow</span>
            </span>
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest block font-medium">
              Studio & Barbershop
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-300">
          <a href="#servicos" className="hover:text-amber-400 transition-colors">
            Serviços
          </a>
          <a href="#barbeiros" className="hover:text-amber-400 transition-colors">
            Barbeiros
          </a>
          <a href="#avaliacoes" className="hover:text-amber-400 transition-colors">
            Avaliações
          </a>
          <a href="#localizacao" className="hover:text-amber-400 transition-colors">
            Localização & Horários
          </a>
        </nav>

        {/* Right Actions */}
        <div className="hidden sm:flex items-center gap-3">
          {/* My bookings button */}
          <button
            id="header-my-bookings-btn"
            onClick={onOpenMyBookings}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Ver meus agendamentos"
          >
            <Calendar className="w-4 h-4 text-amber-400" />
            <span className="hidden lg:inline">Minhas Reservas</span>
          </button>

          {/* Social login / User Profile */}
          {currentUser ? (
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 py-1.5 px-3 rounded-xl">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover border border-amber-500"
              />
              <span className="text-xs font-medium text-white max-w-[100px] truncate">
                {currentUser.name.split(' ')[0]}
              </span>
              <button
                id="header-logout-btn"
                onClick={logout}
                className="text-zinc-500 hover:text-red-400 p-1 transition-colors"
                title="Sair"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              id="header-login-btn"
              onClick={openSocialLoginModal}
              className="py-2 px-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>Entrar / Social</span>
            </button>
          )}

          {/* Admin Switch */}
          <button
            id="header-admin-btn"
            onClick={() => {
              if (isAdminAuthenticated) {
                setActiveView('admin');
              } else {
                openSocialLoginModal();
              }
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              isAdminAuthenticated
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 hover:bg-amber-500/30'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>

          {/* Main Booking CTA */}
          <button
            id="header-book-now-btn"
            onClick={() => openBookingModal()}
            className="py-2.5 px-5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Agendar Agora</span>
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex items-center gap-2 sm:hidden">
          <button
            id="mobile-book-cta-btn"
            onClick={() => openBookingModal()}
            className="py-2 px-3 bg-amber-500 text-black font-black text-xs rounded-lg uppercase"
          >
            Agendar
          </button>
          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-zinc-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-zinc-950 border-b border-zinc-800 px-4 py-5 space-y-4">
          <nav className="flex flex-col space-y-3 text-sm font-medium text-zinc-300">
            <a
              href="#servicos"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-amber-400 py-1"
            >
              Serviços
            </a>
            <a
              href="#barbeiros"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-amber-400 py-1"
            >
              Barbeiros
            </a>
            <a
              href="#avaliacoes"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-amber-400 py-1"
            >
              Avaliações
            </a>
            <a
              href="#localizacao"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-amber-400 py-1"
            >
              Localização & Horários
            </a>
          </nav>

          <div className="pt-3 border-t border-zinc-800 flex flex-col gap-2.5">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenMyBookings();
              }}
              className="w-full py-2.5 rounded-xl bg-zinc-900 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Minhas Reservas</span>
            </button>

            {currentUser ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full py-2.5 rounded-xl bg-zinc-900 text-red-400 text-xs font-semibold flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair ({currentUser.name.split(' ')[0]})</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openSocialLoginModal();
                }}
                className="w-full py-2.5 rounded-xl bg-zinc-900 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4 text-amber-400" />
                <span>Entrar com Google / Facebook</span>
              </button>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (isAdminAuthenticated) {
                  setActiveView('admin');
                } else {
                  openSocialLoginModal();
                }
              }}
              className="w-full py-2.5 rounded-xl border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              <span>Acessar Painel Admin</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
