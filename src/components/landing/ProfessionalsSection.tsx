import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Star,
  Scissors,
  Sparkles,
  CheckCircle2,
  UserPlus,
  Shield,
  Lock,
  LayoutDashboard,
  Clock,
  Check,
  X,
  Phone,
  Mail,
} from 'lucide-react';
import { WEEKDAY_SHORT } from '../../utils/calendarUtils';

export const ProfessionalsSection: React.FC = () => {
  const {
    professionals,
    services,
    openBookingModal,
    isAdminAuthenticated,
    currentUser,
    setActiveView,
    openSocialLoginModal,
    professionalLiveStates,
    createProfessional,
    createSystemUser,
    showToast,
  } = useApp();

  const [isAdminNoticeOpen, setIsAdminNoticeOpen] = useState(false);
  const [isAddBarberModalOpen, setIsAddBarberModalOpen] = useState(false);

  // Admin New Barber Form State
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('Especialista em Degradê & Barba');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('1234');
  const [bio, setBio] = useState('Profissional qualificado com experiência em cortes modernos e clássicos.');
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('19:30');
  const [lunchStart, setLunchStart] = useState('12:00');
  const [lunchEnd, setLunchEnd] = useState('13:00');
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);

  const activeProfessionals = professionals.filter((p) => p.active);

  const handleAddBarberClick = () => {
    if (isAdminAuthenticated && currentUser?.role === 'admin') {
      setIsAddBarberModalOpen(true);
    } else {
      setIsAdminNoticeOpen(true);
    }
  };

  const handleBarberPanelAccess = (barberId: string) => {
    if (isAdminAuthenticated) {
      if (currentUser?.role === 'barber' && currentUser?.professionalId === barberId) {
        setActiveView('barber');
      } else if (currentUser?.role === 'admin') {
        setActiveView('admin');
      } else {
        setActiveView('barber');
      }
    } else {
      openSocialLoginModal();
    }
  };

  const toggleDay = (dayIndex: number) => {
    if (workingDays.includes(dayIndex)) {
      setWorkingDays(workingDays.filter((d) => d !== dayIndex));
    } else {
      setWorkingDays([...workingDays, dayIndex].sort());
    }
  };

  const handleSaveBarberByAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Informe o nome do barbeiro.', 'error');
      return;
    }

    const newProfId = `prof-${Date.now()}`;
    const barberName = name.trim();

    // 1. Create Professional Profile
    createProfessional({
      name: barberName,
      specialty: specialty.trim(),
      bio: bio.trim(),
      avatar: avatar.trim() || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      rating: 5.0,
      reviewsCount: 1,
      active: true,
      servicesOffered: services.map((s) => s.id),
      workingDays,
      startTime,
      endTime,
      lunchStart,
      lunchEnd,
      daysOff: [],
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
    });

    // 2. Create User Account for Login
    const barberEmail = email.trim() || `${barberName.toLowerCase().replace(/\s+/g, '')}@barberflow.com.br`;
    createSystemUser({
      name: barberName,
      email: barberEmail,
      phone: phone.trim() || '(11) 99999-9999',
      role: 'barber',
      professionalId: newProfId,
      password: password.trim() || '1234',
      avatar: avatar.trim() || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      active: true,
      provider: 'direct',
      mustChangePassword: false,
    });

    showToast(`Barbeiro ${barberName} cadastrado com sucesso! Acesso liberado com e-mail ${barberEmail}.`, 'success');
    setIsAddBarberModalOpen(false);

    // Reset Form
    setName('');
    setEmail('');
    setPhone('');
    setPassword('1234');
  };

  return (
    <section id="barbeiros" className="py-16 sm:py-24 bg-zinc-950 border-t border-zinc-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Title and Add Barber Action */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="text-center md:text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Corpo de Barbeiros</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-white tracking-tight">
              Mestres da Navalha & Visagistas
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 mt-2">
              Profissionais certificados internacionalmente, prontos para valorizar seus traços e elevar sua confiança.
            </p>
          </div>

          <div className="flex items-center justify-center md:justify-end gap-3 flex-shrink-0">
            <button
              id="add-barber-main-btn"
              onClick={handleAddBarberClick}
              className="py-3 px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 border border-amber-400/40"
            >
              <UserPlus className="w-4 h-4 text-black" />
              <span>Adicionar Novo Barbeiro</span>
            </button>
          </div>
        </div>

        {/* Barbers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {activeProfessionals.map((barber) => {
            const liveState = professionalLiveStates[barber.id];

            return (
              <div
                key={barber.id}
                id={`barber-item-${barber.id}`}
                className="group bg-zinc-900/90 hover:bg-zinc-900 border-2 border-zinc-800 hover:border-amber-500/50 rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between shadow-xl relative"
              >
                <div>
                  {/* Avatar with luxury ring and live status */}
                  <div className="relative w-28 h-28 mx-auto mb-5">
                    <img
                      src={barber.avatar}
                      alt={barber.name}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
                      }}
                      className="w-full h-full rounded-2xl object-cover border-2 border-zinc-700 group-hover:border-amber-500 transition-colors shadow-xl"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-zinc-950 border border-amber-500/40 px-2 py-0.5 rounded-lg text-xs font-bold text-amber-400 flex items-center gap-1 shadow-md">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{barber.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
                      {barber.name}
                    </h3>
                    <p className="text-xs font-semibold text-amber-500 mt-1">
                      {barber.specialty}
                    </p>

                    {/* Live State Badge */}
                    {liveState && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-zinc-950 border-zinc-800 shadow-inner">
                        <span className={`w-2 h-2 rounded-full ${liveState.status === 'in_service' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                        <span className="text-zinc-200">{liveState.statusLabel}</span>
                      </div>
                    )}

                    <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
                      {barber.bio}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-zinc-800/80 space-y-3">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{barber.reviewsCount} avaliações</span>
                    </span>
                    <span className="text-zinc-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>{barber.startTime || '09:00'} - {barber.endTime || '19:30'}</span>
                    </span>
                  </div>

                  {/* Actions for this specific barber */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      id={`book-with-barber-${barber.id}`}
                      onClick={() => openBookingModal()}
                      className="py-3 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Scissors className="w-3.5 h-3.5" />
                      <span>Agendar Horário</span>
                    </button>

                    <button
                      id={`panel-barber-${barber.id}`}
                      onClick={() => handleBarberPanelAccess(barber.id)}
                      className="py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 border border-zinc-700 hover:border-amber-500/50"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
                      <span>Painel do Barbeiro</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ADMIN RESTRICTION MODAL / NOTICE */}
      {isAdminNoticeOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border-2 border-amber-500/40 rounded-3xl max-w-md w-full p-6 sm:p-8 text-center space-y-5 shadow-2xl relative">
            <button
              onClick={() => setIsAdminNoticeOpen(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-xl bg-zinc-900 border border-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center shadow-inner">
              <Shield className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                Controle de Acesso Restrito
              </span>
              <h3 className="text-xl font-bold font-display text-white">
                Cadastro Exclusivo do Administrador
              </h3>
              <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                A inclusão e homologação de novos barbeiros é uma função restrita à administração e gerência do estabelecimento.
              </p>
            </div>

            <div className="p-3.5 bg-zinc-900 rounded-2xl border border-zinc-800 text-left text-xs space-y-1.5 text-zinc-400">
              <div className="flex items-center gap-2 text-zinc-200 font-semibold">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Credenciais Necessárias</span>
              </div>
              <p className="text-[11px]">
                Faça login como Administrador para cadastrar novos membros da equipe, definir horários de jornada e gerar senhas de acesso.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                id="login-as-admin-btn"
                onClick={() => {
                  setIsAdminNoticeOpen(false);
                  openSocialLoginModal();
                }}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20"
              >
                Fazer Login como Administrador
              </button>

              <button
                onClick={() => setIsAdminNoticeOpen(false)}
                className="w-full py-2.5 text-zinc-400 hover:text-white text-xs font-semibold"
              >
                Voltar à Página Principal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN ADD BARBER MODAL (HIGH VISIBILITY FORM) */}
      {isAddBarberModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-950 border-2 border-amber-500/60 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative text-zinc-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-5">
              <div>
                <span className="text-amber-400 text-[11px] font-bold uppercase tracking-wider block">
                  Painel de Administração
                </span>
                <h3 className="text-xl font-bold font-display text-white">
                  Cadastrar Novo Barbeiro na Equipe
                </h3>
              </div>
              <button
                onClick={() => setIsAddBarberModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-white rounded-xl bg-zinc-900 border border-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBarberByAdmin} className="space-y-4">
              {/* Nome e Especialidade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-100 mb-1.5 uppercase tracking-wide">
                    Nome Completo do Barbeiro *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Matheus Briza"
                    className="w-full bg-zinc-900 border-2 border-zinc-700 focus:border-amber-400 focus:bg-zinc-950 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-400 font-medium focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-100 mb-1.5 uppercase tracking-wide">
                    Especialidade Principal *
                  </label>
                  <input
                    type="text"
                    required
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="Ex: Degradê & Barboterapia"
                    className="w-full bg-zinc-900 border-2 border-zinc-700 focus:border-amber-400 focus:bg-zinc-950 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-400 font-medium focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* E-mail e WhatsApp para Login */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-100 mb-1.5 uppercase tracking-wide flex items-center justify-between">
                    <span>E-mail para Login *</span>
                    <span className="text-[10px] text-amber-400">Ativa e-mail</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="barbeiro@barberflow.com.br"
                    className="w-full bg-zinc-900 border-2 border-zinc-700 focus:border-amber-400 focus:bg-zinc-950 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-400 font-medium focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-100 mb-1.5 uppercase tracking-wide">
                    WhatsApp / Telefone com DDD *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full bg-zinc-900 border-2 border-zinc-700 focus:border-amber-400 focus:bg-zinc-950 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-400 font-medium focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Senha de Acesso */}
              <div className="p-3.5 bg-zinc-900/90 rounded-2xl border-2 border-zinc-800 space-y-2">
                <label className="block text-xs font-bold text-zinc-100 uppercase tracking-wide">
                  Senha Inicial de Acesso do Barbeiro *
                </label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ex: 1234"
                  className="w-full bg-zinc-950 border-2 border-amber-500/50 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-amber-300 font-mono font-bold focus:outline-none"
                />
                <p className="text-[11px] text-zinc-400">
                  O barbeiro usará este e-mail e senha para entrar na sua 'Área do Barbeiro' e gerenciar serviços e produtos.
                </p>
              </div>

              {/* Foto de Perfil */}
              <div>
                <label className="block text-xs font-bold text-zinc-100 mb-1.5 uppercase tracking-wide">
                  URL da Foto de Perfil
                </label>
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-zinc-900 border-2 border-zinc-700 focus:border-amber-400 focus:bg-zinc-950 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-400 focus:outline-none"
                />
              </div>

              {/* Horários de Atendimento */}
              <div className="p-3.5 bg-zinc-900 rounded-2xl border-2 border-zinc-800 space-y-3">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wide block">
                  Jornada de Trabalho & Intervalos
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-300 font-semibold mb-1">Entrada</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-300 font-semibold mb-1">Saída</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-300 font-semibold mb-1">Início Almoço</label>
                    <input
                      type="time"
                      value={lunchStart}
                      onChange={(e) => setLunchStart(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-300 font-semibold mb-1">Fim Almoço</label>
                    <input
                      type="time"
                      value={lunchEnd}
                      onChange={(e) => setLunchEnd(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <span className="block text-[11px] text-zinc-300 font-semibold mb-1.5">Dias de Atendimento</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                      const isSelected = workingDays.includes(dayIdx);
                      return (
                        <button
                          key={dayIdx}
                          type="button"
                          onClick={() => toggleDay(dayIdx)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-amber-500 text-black shadow-md'
                              : 'bg-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {WEEKDAY_SHORT[dayIdx]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddBarberModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="confirm-admin-add-barber-btn"
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Cadastrar Barbeiro</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

