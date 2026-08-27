import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { HeroSection } from './components/landing/HeroSection';
import { ServicesSection } from './components/landing/ServicesSection';
import { ProfessionalsSection } from './components/landing/ProfessionalsSection';
import { ReviewsSection } from './components/landing/ReviewsSection';
import { LocationSection } from './components/landing/LocationSection';
import { Footer } from './components/layout/Footer';
import { MyBookingsModal } from './components/customer/MyBookingsModal';
import { AdminLayout } from './components/admin/AdminLayout';
import { ToastContainer } from './components/common/Toast';
import { GlobalModals } from './components/common/GlobalModals';
import { Shield, Sparkles, UserCheck } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const {
    activeView,
    isAdminAuthenticated,
    openSocialLoginModal,
    setActiveView,
  } = useApp();

  const [isMyBookingsOpen, setIsMyBookingsOpen] = useState(false);

  // If in Admin View and Authenticated, render the Admin Layout
  if (activeView === 'admin') {
    if (isAdminAuthenticated) {
      return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-amber-500 selection:text-black">
          <AdminLayout />
          <GlobalModals />
          <ToastContainer />
        </div>
      );
    } else {
      // Prompt to login as Admin or return to public site
      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full text-center space-y-5 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-white">
                Acesso Restrito ao Painel
              </h2>
              <p className="text-xs text-zinc-400 mt-1.5">
                Faça login com a conta de administrador para gerenciar a barbearia.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                id="admin-unlock-btn"
                onClick={openSocialLoginModal}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>Entrar no Painel Admin</span>
              </button>

              <button
                id="return-to-site-btn"
                onClick={() => setActiveView('client')}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl transition-colors"
              >
                Voltar para o Site Público
              </button>
            </div>
          </div>

          <GlobalModals />
          <ToastContainer />
        </div>
      );
    }
  }

  // Otherwise, render Public Client Web Application
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-amber-500 selection:text-black relative overflow-x-hidden">
      {/* Ambient background light gradients */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-amber-500/10 via-amber-600/5 to-transparent rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Top Header */}
      <Header onOpenMyBookings={() => setIsMyBookingsOpen(true)} />

      {/* Main Landing Sections */}
      <main className="relative z-10">
        <HeroSection />
        <ServicesSection />
        <ProfessionalsSection />
        <ReviewsSection />
        <LocationSection />
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals & Portals */}
      <GlobalModals />
      <MyBookingsModal
        isOpen={isMyBookingsOpen}
        onClose={() => setIsMyBookingsOpen(false)}
      />

      {/* Global Toast Feedback */}
      <ToastContainer />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}

export default App;
