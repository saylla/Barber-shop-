import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Phone, User, Mail, ShieldCheck, Sparkles, X } from 'lucide-react';

interface CompleteProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (name: string, email: string, phone: string) => void;
  initialName?: string;
  initialEmail?: string;
  initialPhone?: string;
}

export const CompleteProfileModal: React.FC<CompleteProfileModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialName = '',
  initialEmail = '',
  initialPhone = '',
}) => {
  const { showToast } = useApp();
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Por favor, informe seu Nome Completo.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Por favor, informe um E-mail válido para confirmações.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (!phone.trim() || cleanPhone.length < 10) {
      setError('Por favor, informe seu WhatsApp / Telefone completo com DDD.');
      return;
    }

    onSuccess(name.trim(), email.trim(), phone.trim());
    showToast('Cadastro completado com sucesso!', 'success');
  };

  const handlePhoneChange = (val: string) => {
    // Basic Brazilian phone mask
    const numbers = val.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 2) {
      setPhone(numbers.length ? `(${numbers}` : '');
    } else if (numbers.length <= 6) {
      setPhone(`(${numbers.slice(0, 2)}) ${numbers.slice(2)}`);
    } else if (numbers.length <= 10) {
      setPhone(`(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`);
    } else {
      setPhone(`(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`);
    }
  };

  return (
    <div
      id="complete-profile-modal-overlay"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="complete-profile-card"
        className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-zinc-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 gold-gradient" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-3 shadow-inner">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold font-display text-white">
            Complete seu Cadastro
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Precisamos do seu <strong>WhatsApp</strong> para enviar o comprovante e lembretes do seu corte.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-zinc-500" />
              <span>Nome Completo *</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Matheus Briza"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-zinc-500" />
              <span>E-mail *</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@gmail.com"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>WhatsApp / Telefone com DDD *</span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="(11) 98765-4321"
              className="w-full bg-zinc-950 border border-amber-500/50 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl text-xs transition-all shadow-md"
            >
              Confirmar & Continuar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
