import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminServices } from '../admin/AdminServices';
import { AdminPackagesAndProducts } from '../admin/AdminPackagesAndProducts';
import {
  Scissors,
  Package,
  Calendar,
  LogOut,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react';
import { AdminSchedule } from '../admin/AdminSchedule';

type BarberTab = 'schedule' | 'services' | 'packages_products';

export const BarberLayout: React.FC = () => {
  const {
    currentUser,
    professionals,
    logoutAdmin,
    setActiveView,
  } = useApp();

  const [currentTab, setCurrentTab] = useState<BarberTab>('schedule');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const linkedBarber = professionals.find((p) => p.id === currentUser?.professionalId);

  const navItems: { id: BarberTab; label: string; icon: React.ReactNode }[] = [
    { id: 'schedule', label: 'Minha Agenda', icon: <Calendar className="w-4 h-4" /> },
    { id: 'services', label: 'Meus Serviços', icon: <Scissors className="w-4 h-4" /> },
    { id: 'packages_products', label: 'Meus Produtos & Pacotes', icon: <Package className="w-4 h-4" /> },
  ];

  return (
    <div id="barber-root-layout" className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-black flex items-center justify-center font-bold">
            <Scissors className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm text-white">Área do Barbeiro</span>
            <span className="text-[10px] text-amber-400 block font-semibold">
              {currentUser?.name}
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="p-2 text-zinc-300 hover:text-white rounded-lg bg-zinc-800"
        >
          {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        id="barber-sidebar"
        className={`${
          isMobileSidebarOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-zinc-900/95 border-r border-zinc-800 flex-shrink-0 p-5 flex flex-col justify-between z-20 md:sticky md:top-0 md:h-screen`}
      >
        <div className="space-y-5">
          <div className="hidden md:flex items-center gap-3 pb-3 border-b border-zinc-800">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-black text-base text-white block">
                Área do <span className="text-amber-400">Barbeiro</span>
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
                  {currentUser?.name}
                </span>
                <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1 truncate">
                  {linkedBarber?.specialty || 'Barbeiro'}
                </span>
              </div>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
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
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-zinc-800 space-y-2 mt-6 md:mt-0">
          <button
            onClick={() => setActiveView('client')}
            className="w-full py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            <span>Ver Site do Cliente</span>
          </button>

          <button
            onClick={logoutAdmin}
            className="w-full py-2 px-3 bg-red-950/30 hover:bg-red-900/50 border border-red-900/40 text-red-300 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair do Painel</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
        <div className="max-w-7xl mx-auto pb-24 md:pb-12">
          {currentTab === 'schedule' && <AdminSchedule />}
          {currentTab === 'services' && <AdminServices />}
          {currentTab === 'packages_products' && <AdminPackagesAndProducts />}
        </div>
      </main>
    </div>
  );
};
