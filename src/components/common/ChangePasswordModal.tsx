import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, KeyRound, ShieldAlert, CheckCircle2, Eye, EyeOff } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onSuccess: (newPassword: string) => void;
  userEmail?: string;
  userName?: string;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onSuccess,
  userEmail,
  userName,
}) => {
  const { showToast } = useApp();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('A confirmação de senha não coincide com a nova senha.');
      return;
    }

    onSuccess(newPassword);
    showToast('Senha alterada com sucesso! Acesso liberado.', 'success');
  };

  // Password strength checker
  const hasMinLength = newPassword.length >= 6;
  const hasNumber = /\d/.test(newPassword);
  const hasLetter = /[a-zA-Z]/.test(newPassword);

  return (
    <div
      id="change-password-modal-overlay"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div
        id="change-password-card"
        className="bg-zinc-900 border border-amber-500/40 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-zinc-100 overflow-hidden"
      >
        {/* Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 gold-gradient" />

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-3 shadow-inner">
            <KeyRound className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold font-display text-white">
            Primeiro Acesso — Crie sua Senha
          </h2>
          <p className="text-xs text-zinc-400 mt-2">
            Olá, <strong className="text-white">{userName || 'Profissional'}</strong>! Por exigência de segurança do Administrador de TI, você deve definir sua nova senha pessoal para prosseguir.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-200 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Nova Senha Pessoal *
            </label>
            <div className="relative">
              <input
                id="new-password-input"
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Confirme a Nova Senha *
            </label>
            <input
              id="confirm-password-input"
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Password requirements indicators */}
          <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1.5 text-[11px] text-zinc-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`w-3.5 h-3.5 ${hasMinLength ? 'text-emerald-400' : 'text-zinc-600'}`} />
              <span className={hasMinLength ? 'text-zinc-200' : ''}>Pelo menos 6 caracteres</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`w-3.5 h-3.5 ${hasLetter && hasNumber ? 'text-emerald-400' : 'text-zinc-600'}`} />
              <span className={hasLetter && hasNumber ? 'text-zinc-200' : ''}>Contém letras e números</span>
            </div>
          </div>

          <button
            id="submit-new-password-btn"
            type="submit"
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 mt-2"
          >
            Salvar Nova Senha & Acessar Painel
          </button>
        </form>
      </div>
    </div>
  );
};
