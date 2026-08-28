import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Lock,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Phone,
  Mail,
  User,
  Scissors,
  AlertCircle,
  Building2,
  QrCode,
  CreditCard,
  MapPin,
  Eye,
  EyeOff,
  Copy,
  CheckCircle2,
  ArrowRight,
  Shield,
  FileText,
  KeyRound,
  Layers,
} from 'lucide-react';
import { BarberRegistrationData } from '../../types';

const BARBER_PHOTO_PRESETS = [
  {
    name: 'Carlos Barbeiro',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Marcos Fade Master',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Lucas Visagista',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Salão Prime Logo',
    url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=400&q=80',
  },
];

type ModalTab = 'client' | 'barber' | 'ti';

export const SocialLoginModal: React.FC = () => {
  const {
    isSocialLoginModalOpen,
    closeSocialLoginModal,
    loginWithGoogle,
    loginWithDirect,
    loginAdminWithPassword,
    registerNewBarber,
    openChangePasswordModal,
    openQrCodeModal,
    systemUsers,
    showToast,
  } = useApp();

  const [tab, setTab] = useState<ModalTab>('client');
  const [isRegisteringBarber, setIsRegisteringBarber] = useState(false);
  const [createdTempPasswordInfo, setCreatedTempPasswordInfo] = useState<{
    tempPassword: string;
    email: string;
    name: string;
  } | null>(null);

  // Client Direct Login Form State
  const [directName, setDirectName] = useState('');
  const [directEmail, setDirectEmail] = useState('');
  const [directPhone, setDirectPhone] = useState('');
  const [showDirectForm, setShowDirectForm] = useState(false);

  // Barber / TI Login Form State
  const [loginEmailOrName, setLoginEmailOrName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Barber Self-Registration Form State
  const [regAccountType, setRegAccountType] = useState<'barber' | 'salon'>('barber');
  const [regName, setRegName] = useState('');
  const [regSalonName, setRegSalonName] = useState('');
  const [regCnpj, setRegCnpj] = useState('');
  const [regCpf, setRegCpf] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [regNeighborhood, setRegNeighborhood] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regState, setRegState] = useState('SP');
  const [regZipCode, setRegZipCode] = useState('');
  const [regPixKey, setRegPixKey] = useState('');
  const [regPixKeyType, setRegPixKeyType] = useState<'cpf' | 'cnpj' | 'email' | 'phone' | 'random'>('phone');
  const [regAvatar, setRegAvatar] = useState(BARBER_PHOTO_PRESETS[0].url);
  const [regSpecialties, setRegSpecialties] = useState('Degradê / Fade, Barboterapia, Visagismo');
  const [regBio, setRegBio] = useState('');

  if (!isSocialLoginModalOpen) return null;

  // Format helpers
  const handlePhoneMask = (val: string, setter: (v: string) => void) => {
    const numbers = val.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 2) {
      setter(numbers.length ? `(${numbers}` : '');
    } else if (numbers.length <= 6) {
      setter(`(${numbers.slice(0, 2)}) ${numbers.slice(2)}`);
    } else if (numbers.length <= 10) {
      setter(`(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`);
    } else {
      setter(`(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`);
    }
  };

  const handleCnpjMask = (val: string) => {
    const numbers = val.replace(/\D/g, '').slice(0, 14);
    if (numbers.length <= 2) {
      setRegCnpj(numbers);
    } else if (numbers.length <= 5) {
      setRegCnpj(`${numbers.slice(0, 2)}.${numbers.slice(2)}`);
    } else if (numbers.length <= 8) {
      setRegCnpj(`${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`);
    } else if (numbers.length <= 12) {
      setRegCnpj(`${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`);
    } else {
      setRegCnpj(
        `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`
      );
    }
  };

  const handleCpfMask = (val: string) => {
    const numbers = val.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 3) {
      setRegCpf(numbers);
    } else if (numbers.length <= 6) {
      setRegCpf(`${numbers.slice(0, 3)}.${numbers.slice(3)}`);
    } else if (numbers.length <= 9) {
      setRegCpf(`${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`);
    } else {
      setRegCpf(`${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`);
    }
  };

  const handleCepMask = (val: string) => {
    const numbers = val.replace(/\D/g, '').slice(0, 8);
    if (numbers.length <= 5) {
      setRegZipCode(numbers);
    } else {
      setRegZipCode(`${numbers.slice(0, 5)}-${numbers.slice(5)}`);
    }
  };

  // Client Direct Submit
  const handleDirectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!directName.trim()) {
      setLoginError('Por favor, informe seu Nome Completo.');
      return;
    }
    if (!directEmail.trim() || !directEmail.includes('@')) {
      setLoginError('Por favor, informe um E-mail válido.');
      return;
    }
    const cleanPhone = directPhone.replace(/\D/g, '');
    if (!directPhone.trim() || cleanPhone.length < 10) {
      setLoginError('Por favor, informe seu Telefone / WhatsApp com DDD.');
      return;
    }

    loginWithDirect(directName.trim(), directEmail.trim(), directPhone.trim());
  };

  // Barber / TI Login Submit
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginEmailOrName.trim()) {
      setLoginError('Por favor, informe seu E-mail ou Nome cadastrado.');
      return;
    }
    if (!loginPassword.trim()) {
      setLoginError('Por favor, digite sua Senha de Acesso.');
      return;
    }

    const success = loginAdminWithPassword(loginPassword, loginEmailOrName);
    if (!success) {
      setLoginError('Credenciais inválidas ou acesso não autorizado.');
    }
  };

  // Barber / Salon Registration Submit
  const handleBarberRegistrationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!regName.trim()) {
      setLoginError('Por favor, informe o Nome Completo do Barbeiro / Responsável.');
      return;
    }

    if (regAccountType === 'salon') {
      if (!regSalonName.trim()) {
        setLoginError('Para cadastro de Salão, o Nome da Barbearia / Salão é obrigatório.');
        return;
      }
      const cleanCnpj = regCnpj.replace(/\D/g, '');
      if (cleanCnpj.length < 14) {
        setLoginError('Para estabelecimentos (Salão), é OBRIGATÓRIO informar um CNPJ válido com 14 dígitos.');
        return;
      }
    }

    if (!regEmail.trim() || !regEmail.includes('@')) {
      setLoginError('Por favor, informe um E-mail profissional válido.');
      return;
    }

    const cleanPhone = regPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setLoginError('Por favor, informe o Celular / WhatsApp com DDD.');
      return;
    }

    if (!regAddress.trim() || !regCity.trim()) {
      setLoginError('Por favor, preencha o Endereço e Cidade de atendimento.');
      return;
    }

    if (!regPixKey.trim()) {
      setLoginError('Por favor, informe uma Chave Pix para recebimento de pagamentos antecipados.');
      return;
    }

    const specialtiesList = regSpecialties
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const regData: BarberRegistrationData = {
      accountType: regAccountType,
      name: regName.trim(),
      salonName: regAccountType === 'salon' ? regSalonName.trim() : undefined,
      cnpj: regAccountType === 'salon' ? regCnpj.trim() : undefined,
      cpf: regAccountType === 'barber' ? regCpf.trim() : undefined,
      email: regEmail.trim().toLowerCase(),
      phone: regPhone.trim(),
      address: regAddress.trim(),
      number: regNumber.trim() || 'S/N',
      neighborhood: regNeighborhood.trim() || 'Centro',
      city: regCity.trim(),
      state: regState.trim(),
      zipCode: regZipCode.trim() || '00000-000',
      pixKey: regPixKey.trim(),
      pixKeyType: regPixKeyType,
      avatar: regAvatar,
      specialties: specialtiesList,
      bio: regBio.trim(),
    };

    const result = registerNewBarber(regData);
    if (result.success) {
      setCreatedTempPasswordInfo({
        tempPassword: result.tempPassword,
        email: regData.email,
        name: regData.name,
      });
      setIsRegisteringBarber(false);
    }
  };

  const handleProceedAfterRegistration = () => {
    if (createdTempPasswordInfo) {
      setLoginEmailOrName(createdTempPasswordInfo.email);
      setLoginPassword(createdTempPasswordInfo.tempPassword);
      setTab('barber');
      setCreatedTempPasswordInfo(null);
      showToast('Insira a senha provisória gerada para entrar e criar sua senha definitiva!', 'info');
    }
  };

  return (
    <div
      id="social-login-modal-overlay"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={closeSocialLoginModal}
    >
      <div
        id="social-login-card"
        className={`bg-zinc-900 border border-zinc-800 rounded-3xl w-full ${
          isRegisteringBarber ? 'max-w-2xl' : 'max-w-md'
        } p-6 sm:p-8 shadow-2xl relative text-zinc-100 overflow-hidden my-6 transition-all`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 gold-gradient" />

        {/* Close Button */}
        <button
          id="close-social-login-btn"
          onClick={closeSocialLoginModal}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-full transition-colors z-20"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ========================================================================= */}
        {/* VIEW: TELA DE SUCESSO DO CADASTRO (SENHA PROVISÓRIA GERADA)              */}
        {/* ========================================================================= */}
        {createdTempPasswordInfo ? (
          <div className="text-center py-4 space-y-5">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 px-3 py-1 bg-emerald-950/60 border border-emerald-800/60 rounded-full">
                Cadastro Realizado com Sucesso
              </span>
              <h2 className="text-2xl font-black font-display text-white mt-2">
                Bem-vindo ao BarberFlow!
              </h2>
              <p className="text-xs text-zinc-300 mt-1 max-w-sm mx-auto">
                Olá, <strong>{createdTempPasswordInfo.name}</strong>! Geramos uma <strong>senha provisória</strong> segura para o seu primeiro acesso.
              </p>
            </div>

            {/* Senha Provisória Card */}
            <div className="bg-zinc-950 border-2 border-amber-500/40 rounded-2xl p-4 text-left relative overflow-hidden shadow-xl">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                <span>E-mail cadastrado:</span>
                <span className="font-bold text-white">{createdTempPasswordInfo.email}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
                <span>Sua Senha Provisória:</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">
                  Válida para 1º Acesso
                </span>
              </div>

              <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                <span className="font-mono text-lg sm:text-xl font-black tracking-widest text-amber-400">
                  {createdTempPasswordInfo.tempPassword}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(createdTempPasswordInfo.tempPassword);
                    showToast('Senha provisória copiada!', 'success');
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </button>
              </div>

              <div className="mt-3 flex items-start gap-2 text-[11px] text-zinc-400">
                <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>
                  No primeiro login, você será solicitado a <strong>criar sua nova senha pessoal definitiva</strong> para garantir total privacidade.
                </span>
              </div>
            </div>

            <button
              type="button"
              id="proceed-to-login-btn"
              onClick={handleProceedAfterRegistration}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <span>Ir para a Página de Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : isRegisteringBarber ? (
          /* ========================================================================= */
          /* VIEW: FORMULÁRIO DE CADASTRO DE BARBEIRO / SALÃO                         */
          /* ========================================================================= */
          <div>
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-2 shadow-inner">
                <Scissors className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold font-display text-white">
                Cadastrar Novo Barbeiro / Salão
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Crie seu perfil profissional ou de estabelecimento para gerenciar cortes, pacotes e receber pagamentos antecipados.
              </p>
            </div>

            {loginError && (
              <div className="mb-4 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleBarberRegistrationSubmit} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
              {/* Type selector: Barber Autônomo vs Salão */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Tipo de Cadastro *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegAccountType('barber')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                      regAccountType === 'barber'
                        ? 'bg-amber-500/15 border-amber-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <Scissors className={`w-5 h-5 ${regAccountType === 'barber' ? 'text-amber-400' : 'text-zinc-500'}`} />
                    <div>
                      <span className="font-bold text-xs block">Barbeiro Autônomo</span>
                      <span className="text-[10px] text-zinc-400">Profissional individual</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegAccountType('salon')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                      regAccountType === 'salon'
                        ? 'bg-amber-500/15 border-amber-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <Building2 className={`w-5 h-5 ${regAccountType === 'salon' ? 'text-amber-400' : 'text-zinc-500'}`} />
                    <div>
                      <span className="font-bold text-xs block">Salão / Barbearia</span>
                      <span className="text-[10px] text-amber-400 font-semibold">Exige CNPJ</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Se for Salão: Nome da Barbearia & CNPJ Obrigatório */}
              {regAccountType === 'salon' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                  <div>
                    <label className="block text-xs font-semibold text-amber-300 mb-1">
                      Nome Fantasia do Salão / Barbearia *
                    </label>
                    <input
                      type="text"
                      required
                      value={regSalonName}
                      onChange={(e) => setRegSalonName(e.target.value)}
                      placeholder="Ex: Barbearia Dom Corleone VIP"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-300 mb-1">
                      CNPJ do Estabelecimento (Obrigatório) *
                    </label>
                    <input
                      type="text"
                      required
                      value={regCnpj}
                      onChange={(e) => handleCnpjMask(e.target.value)}
                      placeholder="00.000.000/0001-00"
                      className="w-full bg-zinc-950 border border-amber-500/50 rounded-xl px-3.5 py-2 text-xs text-amber-300 font-mono placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              ) : null}

              {/* Nome do Responsável / Barbeiro */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Nome Completo do Profissional *
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ex: Carlos Silva"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {regAccountType === 'barber' && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      CPF do Barbeiro (Opcional)
                    </label>
                    <input
                      type="text"
                      value={regCpf}
                      onChange={(e) => handleCpfMask(e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 font-mono placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}
              </div>

              {/* E-mail e Celular / WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    E-mail Profissional (Login) *
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="barbeiro@exemplo.com.br"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Celular / WhatsApp com DDD *
                  </label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => handlePhoneMask(e.target.value, setRegPhone)}
                    placeholder="(11) 98765-4321"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Endereço Completo */}
              <div className="space-y-2.5 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
                  Endereço de Atendimento (Obrigatório)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <input
                      type="text"
                      required
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      placeholder="Rua / Avenida *"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value)}
                      placeholder="Número (ex: 120)"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <input
                      type="text"
                      value={regNeighborhood}
                      onChange={(e) => setRegNeighborhood(e.target.value)}
                      placeholder="Bairro"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      required
                      value={regCity}
                      onChange={(e) => setRegCity(e.target.value)}
                      placeholder="Cidade *"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={regZipCode}
                      onChange={(e) => handleCepMask(e.target.value)}
                      placeholder="CEP (00000-000)"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Chave Pix e QR Code para Pagamento Antecipado */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Chave Pix para Pagamento Antecipado *</span>
                  </span>
                  <span className="text-[10px] text-zinc-400">Gera QR Code Pix automático</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <select
                      value={regPixKeyType}
                      onChange={(e) => setRegPixKeyType(e.target.value as any)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="phone">Celular (Pix)</option>
                      <option value="email">E-mail (Pix)</option>
                      <option value="cnpj">CNPJ (Pix)</option>
                      <option value="cpf">CPF (Pix)</option>
                      <option value="random">Chave Aleatória</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      required
                      value={regPixKey}
                      onChange={(e) => setRegPixKey(e.target.value)}
                      placeholder="Informe sua chave Pix..."
                      className="w-full bg-zinc-950 border border-amber-500/50 rounded-xl px-3.5 py-2 text-xs text-amber-300 font-mono placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Foto / Avatar Presets */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                  <span>Foto de Perfil / Logo</span>
                  <span className="text-[10px] text-zinc-500">Escolha uma foto</span>
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {BARBER_PHOTO_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRegAvatar(preset.url)}
                      className={`relative h-14 rounded-xl overflow-hidden border-2 transition-all ${
                        regAvatar === preset.url
                          ? 'border-amber-500 scale-95 shadow-md'
                          : 'border-zinc-800 opacity-60 hover:opacity-100'
                      }`}
                      title={preset.name}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Especialidades */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Especialidades & Técnicas
                </label>
                <input
                  type="text"
                  value={regSpecialties}
                  onChange={(e) => setRegSpecialties(e.target.value)}
                  placeholder="Degradê, Barboterapia, Platinado, Visagismo..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisteringBarber(false);
                    setLoginError(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white text-xs font-bold"
                >
                  Voltar ao Login
                </button>
                <button
                  type="submit"
                  id="submit-barber-registration-btn"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20"
                >
                  Concluir Cadastro
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW: ABAS DE LOGIN (CLIENTE | BARBEIRO | T.I. INDIVIDUAL)                 */
          /* ========================================================================= */
          <div>
            {/* Header */}
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-2 shadow-inner">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold font-display text-white">
                {tab === 'client'
                  ? 'Acesse sua Conta'
                  : tab === 'barber'
                  ? 'Painel do Barbeiro & Salão'
                  : 'Acesso Restrito T.I. & Master'}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {tab === 'client'
                  ? 'Agendamento rápido com 1 clique ou cadastro direto com WhatsApp.'
                  : tab === 'barber'
                  ? 'Gerencie sua agenda pessoal, pacotes mensais e vendas de cosméticos.'
                  : 'Acesso de engenharia, infraestrutura e gestão central de acessos.'}
              </p>
            </div>

            {/* 3 INDIVIDUAL TABS: CLIENTE | BARBEIRO | T.I. */}
            <div className="flex bg-zinc-950 p-1 rounded-2xl border border-zinc-800 mb-5">
              <button
                id="tab-client-btn"
                type="button"
                onClick={() => {
                  setTab('client');
                  setLoginError(null);
                }}
                className={`flex-1 py-2 text-[11px] sm:text-xs font-bold rounded-xl transition-all ${
                  tab === 'client'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Cliente
              </button>

              <button
                id="tab-barber-btn"
                type="button"
                onClick={() => {
                  setTab('barber');
                  setLoginError(null);
                }}
                className={`flex-1 py-2 text-[11px] sm:text-xs font-bold rounded-xl transition-all ${
                  tab === 'barber'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Barbeiro / Salão
              </button>

              <button
                id="tab-ti-btn"
                type="button"
                onClick={() => {
                  setTab('ti');
                  setLoginError(null);
                }}
                className={`flex-1 py-2 text-[11px] sm:text-xs font-bold rounded-xl transition-all ${
                  tab === 'ti'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                T.I. / Admin
              </button>
            </div>

            {loginError && (
              <div className="mb-4 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* TAB 1: CLIENTE */}
            {tab === 'client' && (
              <div className="space-y-3.5">
                <button
                  id="google-login-btn"
                  onClick={() => loginWithGoogle('customer')}
                  className="w-full flex items-center justify-center gap-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-4 rounded-2xl transition-all hover:border-zinc-500 border border-zinc-700 shadow-md text-xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                  <span>Entrar com Conta Google</span>
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-zinc-800"></div>
                  <span className="flex-shrink mx-3 text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                    ou cadastro direto sem Google
                  </span>
                  <div className="flex-grow border-t border-zinc-800"></div>
                </div>

                {!showDirectForm ? (
                  <button
                    id="toggle-direct-form-btn"
                    type="button"
                    onClick={() => setShowDirectForm(true)}
                    className="w-full py-2.5 px-4 rounded-2xl border border-zinc-800 hover:border-amber-500/50 bg-zinc-950 text-zinc-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>Preencher Nome, E-mail e WhatsApp</span>
                  </button>
                ) : (
                  <form onSubmit={handleDirectSubmit} className="space-y-2.5 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        Nome Completo *
                      </label>
                      <input
                        id="direct-name-input"
                        type="text"
                        required
                        value={directName}
                        onChange={(e) => setDirectName(e.target.value)}
                        placeholder="Ex: Matheus Briza"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        E-mail *
                      </label>
                      <input
                        id="direct-email-input"
                        type="email"
                        required
                        value={directEmail}
                        onChange={(e) => setDirectEmail(e.target.value)}
                        placeholder="seu.email@gmail.com"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        WhatsApp / Telefone com DDD *
                      </label>
                      <input
                        id="direct-phone-input"
                        type="tel"
                        required
                        value={directPhone}
                        onChange={(e) => handlePhoneMask(e.target.value, setDirectPhone)}
                        placeholder="(11) 98765-4321"
                        className="w-full bg-zinc-950 border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <button
                      id="direct-submit-btn"
                      type="submit"
                      className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md mt-1"
                    >
                      Concluir Cadastro & Continuar
                    </button>
                  </form>
                )}

                {/* Skip Step & Continue without login */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={closeSocialLoginModal}
                    className="w-full py-2.5 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all"
                  >
                    Pular e explorar o site
                  </button>
                </div>

                {/* LGPD Compliance Badge */}
                <div className="pt-2 text-center border-t border-zinc-800/80">
                  <div className="inline-flex items-center gap-1.5 text-[10px] text-zinc-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Conformidade LGPD: Dados protegidos e criptografados.</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: BARBEIRO / SALÃO */}
            {tab === 'barber' && (
              <div className="space-y-4">
                {/* Botão de Destaque: Criar Novo Cadastro de Barbeiro */}
                <button
                  id="open-barber-registration-btn"
                  type="button"
                  onClick={() => {
                    setIsRegisteringBarber(true);
                    setLoginError(null);
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500 text-amber-300 hover:bg-amber-500/25 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
                >
                  <Scissors className="w-4 h-4 text-amber-400" />
                  <span>✂️ Criar Novo Cadastro de Barbeiro / Salão</span>
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-zinc-800"></div>
                  <span className="flex-shrink mx-3 text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                    ou entrar com credenciais existentes
                  </span>
                  <div className="flex-grow border-t border-zinc-800"></div>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      E-mail do Barbeiro ou Nome
                    </label>
                    <input
                      id="barber-email-input"
                      type="text"
                      required
                      value={loginEmailOrName}
                      onChange={(e) => setLoginEmailOrName(e.target.value)}
                      placeholder="Ex: carlos@barberflow.com.br ou Carlos"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Senha de Acesso
                    </label>
                    <div className="relative">
                      <input
                        id="barber-password-input"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Digite sua senha ou senha provisória"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-3.5 pr-10 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    id="barber-login-submit-btn"
                    type="submit"
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md mt-2"
                  >
                    Entrar no Painel do Barbeiro
                  </button>
                </form>
              </div>
            )}

            {/* TAB 3: T.I. / SUPER ADMIN */}
            {tab === 'ti' && (
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-300 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    Acesso restrito à equipe de Tecnologia da Informação (T.I.). Gestão de servidores, SMTP, permissões de usuários e conformidade LGPD.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    E-mail ou Usuário Master TI
                  </label>
                  <input
                    id="ti-email-input"
                    type="text"
                    required
                    value={loginEmailOrName}
                    onChange={(e) => setLoginEmailOrName(e.target.value)}
                    placeholder="Digite seu e-mail corporativo de T.I."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Chave de Acesso TI / Senha Master
                  </label>
                  <div className="relative">
                    <input
                      id="ti-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl flex items-center gap-2 text-[11px] text-zinc-400">
                  <Lock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>Autenticação criptografada com proteção contra invasões e logs de auditoria.</span>
                </div>

                <button
                  id="ti-login-submit-btn"
                  type="submit"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md"
                >
                  Entrar no Painel Master T.I.
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
