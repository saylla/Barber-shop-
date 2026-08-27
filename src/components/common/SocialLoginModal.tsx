import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Lock, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';

export const SocialLoginModal: React.FC = () => {
  const {
    isSocialLoginModalOpen,
    closeSocialLoginModal,
    loginWithGoogle,
    loginWithFacebook,
    loginWithDirect,
    loginAdminWithPassword,
    currentUser,
  } = useApp();

  const [tab, setTab] = useState<'social' | 'admin'>('social');
  const [directName, setDirectName] = useState('');
  const [directEmail, setDirectEmail] = useState('');
  const [directPhone, setDirectPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showDirectForm, setShowDirectForm] = useState(false);

  if (!isSocialLoginModalOpen) return null;

  const handleDirectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directName || !directPhone) return;
    loginWithDirect(directName, directEmail, directPhone);
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginAdminWithPassword(adminPassword);
  };

  return (
    <div
      id="social-login-modal-overlay"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={closeSocialLoginModal}
    >
      <div
        id="social-login-card"
        className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-zinc-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle top gold decorative line */}
        <div className="absolute top-0 left-0 right-0 h-1 gold-gradient" />

        {/* Close Button */}
        <button
          id="close-social-login-btn"
          onClick={closeSocialLoginModal}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-full transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold font-display text-white">
            {tab === 'social' ? 'Acesse sua Conta' : 'Acesso Administrativo'}
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            {tab === 'social'
              ? 'Conecte-se para agendar com 1 clique e gerenciar seus horários.'
              : 'Painel exclusivo para proprietário e equipe.'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800/80 mb-6">
          <button
            id="tab-social-btn"
            type="button"
            onClick={() => setTab('social')}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              tab === 'social'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Cliente / Social Login
          </button>
          <button
            id="tab-admin-btn"
            type="button"
            onClick={() => setTab('admin')}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              tab === 'admin'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Proprietário / Admin
          </button>
        </div>

        {tab === 'social' ? (
          <div className="space-y-4">
            {/* Google Sign-in Button */}
            <button
              id="google-login-btn"
              onClick={() => loginWithGoogle('customer')}
              className="w-full flex items-center justify-center gap-3 bg-zinc-800/90 hover:bg-zinc-700/90 border border-zinc-700 text-white font-medium py-3 px-4 rounded-xl transition-all hover:border-zinc-500 shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.4 8.9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.1-2 .4-2.7L1.6 6.4C.6 8.3 0 10.1 0 12s.6 3.7 1.6 5.6l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.4-6.7-5.3L1.6 16c1.9 3.8 5.8 7 10.4 7z"
                />
              </svg>
              <span>Entrar com o Google</span>
            </button>

            {/* Facebook Sign-in Button */}
            <button
              id="facebook-login-btn"
              onClick={() => loginWithFacebook('customer')}
              className="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166fe5] text-white font-medium py-3 px-4 rounded-xl transition-all shadow-sm"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Entrar com o Facebook</span>
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-zinc-800"></div>
              <span className="flex-shrink mx-3 text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                ou preencher direto
              </span>
              <div className="flex-grow border-t border-zinc-800"></div>
            </div>

            {!showDirectForm ? (
              <button
                id="toggle-direct-form-btn"
                type="button"
                onClick={() => setShowDirectForm(true)}
                className="w-full py-2.5 px-4 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-950/50 text-zinc-300 hover:text-white text-sm font-medium transition-all"
              >
                Informar dados manualmente
              </button>
            ) : (
              <form onSubmit={handleDirectSubmit} className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    id="direct-name-input"
                    type="text"
                    required
                    value={directName}
                    onChange={(e) => setDirectName(e.target.value)}
                    placeholder="Ex: Matheus Briza"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    WhatsApp / Telefone *
                  </label>
                  <input
                    id="direct-phone-input"
                    type="tel"
                    required
                    value={directPhone}
                    onChange={(e) => setDirectPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    E-mail (opcional)
                  </label>
                  <input
                    id="direct-email-input"
                    type="email"
                    value={directEmail}
                    onChange={(e) => setDirectEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  id="direct-submit-btn"
                  type="submit"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-sm transition-all"
                >
                  Continuar
                </button>
              </form>
            )}

            <div className="pt-2 text-center">
              <p className="text-[11px] text-zinc-500">
                Seus dados são protegidos e usados apenas para lembretes do seu atendimento.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Área restrita aos administradores e barbeiros do salão. Dica de teste: use senha{' '}
                <strong className="text-white underline">1234</strong> ou{' '}
                <strong className="text-white underline">admin</strong>.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                <span>Senha de Acesso</span>
                <Lock className="w-3.5 h-3.5 text-zinc-500" />
              </label>
              <input
                id="admin-password-input"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Digite a senha (ex: 1234)"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-2 pt-1">
              <button
                id="admin-login-submit-btn"
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-sm transition-all shadow-md"
              >
                Entrar no Painel Admin
              </button>

              <button
                id="quick-demo-admin-btn"
                type="button"
                onClick={() => loginWithGoogle('admin')}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-xl border border-zinc-700 transition-all flex items-center justify-center gap-2"
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Entrar direto como Administrador Master (Demo)</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
