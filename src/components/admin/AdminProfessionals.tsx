import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Professional } from '../../types';
import { WEEKDAY_SHORT } from '../../utils/calendarUtils';
import {
  Plus,
  Edit2,
  Trash2,
  Star,
  Clock,
  Calendar,
  Check,
  X,
  User,
  Mail,
  Phone,
  Lock,
  Scissors,
  LayoutDashboard,
  Shield,
  CheckCircle2,
} from 'lucide-react';

const PRESET_AVATARS = [
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
    name: 'Rafael Barber',
    url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
  },
];

export const AdminProfessionals: React.FC = () => {
  const {
    professionals,
    services,
    professionalLiveStates,
    createProfessional,
    updateProfessional,
    deleteProfessional,
    createSystemUser,
    systemUsers,
    setActiveView,
    showToast,
  } = useApp();

  const [editingProf, setEditingProf] = useState<Professional | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingProfId, setDeletingProfId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('1234');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('19:30');
  const [lunchStart, setLunchStart] = useState('12:00');
  const [lunchEnd, setLunchEnd] = useState('13:00');
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [active, setActive] = useState(true);

  const openCreateModal = () => {
    setName('');
    setSpecialty('Especialista em Degradê & Barba');
    setEmail('');
    setPhone('');
    setPassword('1234');
    setBio('Profissional com anos de experiência em cortes clássicos e modernos.');
    setAvatar(PRESET_AVATARS[0].url);
    setStartTime('09:00');
    setEndTime('19:30');
    setLunchStart('12:00');
    setLunchEnd('13:00');
    setWorkingDays([1, 2, 3, 4, 5, 6]);
    setActive(true);
    setEditingProf(null);
    setIsCreating(true);
  };

  const openEditModal = (p: Professional) => {
    setEditingProf(p);
    setName(p.name);
    setSpecialty(p.specialty);
    setEmail(p.email || '');
    setPhone(p.phone || '');
    setPassword('1234');
    setBio(p.bio);
    setAvatar(p.avatar);
    setStartTime(p.startTime || '09:00');
    setEndTime(p.endTime || '19:30');
    setLunchStart(p.lunchStart || '12:00');
    setLunchEnd(p.lunchEnd || '13:00');
    setWorkingDays(p.workingDays || [1, 2, 3, 4, 5, 6]);
    setActive(p.active);
    setIsCreating(false);
  };

  const toggleDay = (dayIndex: number) => {
    if (workingDays.includes(dayIndex)) {
      setWorkingDays(workingDays.filter((d) => d !== dayIndex));
    } else {
      setWorkingDays([...workingDays, dayIndex].sort());
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Preencha o nome do profissional.', 'error');
      return;
    }

    const barberName = name.trim();
    const barberAvatar = avatar.trim() || PRESET_AVATARS[0].url;

    if (editingProf) {
      updateProfessional({
        ...editingProf,
        name: barberName,
        specialty: specialty.trim(),
        bio: bio.trim(),
        avatar: barberAvatar,
        startTime,
        endTime,
        lunchStart,
        lunchEnd,
        workingDays,
        active,
        email: email.trim() || editingProf.email,
        phone: phone.trim() || editingProf.phone,
      });
      setEditingProf(null);
      showToast(`Cadastro de ${barberName} atualizado com sucesso!`, 'success');
    } else {
      const newProfId = `prof-${Date.now()}`;

      // 1. Create Professional
      createProfessional({
        name: barberName,
        specialty: specialty.trim(),
        bio: bio.trim(),
        avatar: barberAvatar,
        rating: 5.0,
        reviewsCount: 1,
        active,
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

      // 2. Create User Account for Login into Barber Area
      const barberEmail = email.trim() || `${barberName.toLowerCase().replace(/\s+/g, '')}@barberflow.com.br`;
      createSystemUser({
        name: barberName,
        email: barberEmail,
        phone: phone.trim() || '(11) 99999-9999',
        role: 'barber',
        professionalId: newProfId,
        password: password.trim() || '1234',
        avatar: barberAvatar,
        active: true,
        provider: 'direct',
        mustChangePassword: false,
      });

      showToast(`Barbeiro ${barberName} cadastrado! Login: ${barberEmail}`, 'success');
      setIsCreating(false);
    }
  };

  return (
    <div id="admin-professionals-view" className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-amber-400 text-xs font-bold uppercase tracking-wider block mb-0.5">
            Equipe & Barbeiros
          </span>
          <h1 className="text-2xl font-black font-display text-white">
            Gestão de Barbeiros & Credenciais
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Cadastre novos barbeiros, defina horários de trabalho, gere acessos ao Painel do Barbeiro e controle disponibilidades.
          </p>
        </div>

        <button
          id="admin-add-prof-btn"
          onClick={openCreateModal}
          className="py-3 px-5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-black" />
          <span>Cadastrar Novo Barbeiro</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {professionals.map((prof) => {
          const liveState = professionalLiveStates[prof.id];
          const userAcc = systemUsers.find((u) => u.professionalId === prof.id || u.email === prof.email);

          return (
            <div
              key={prof.id}
              id={`admin-prof-${prof.id}`}
              className="bg-zinc-900 border-2 border-zinc-800 hover:border-amber-500/40 rounded-3xl p-6 shadow-md flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <img
                    src={prof.avatar}
                    alt={prof.name}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80';
                    }}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-zinc-700"
                  />
                  <div>
                    <h3 className="font-bold text-base text-white">{prof.name}</h3>
                    <p className="text-xs text-amber-500 font-semibold">{prof.specialty}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span
                        className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          prof.active
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        {prof.active ? 'Ativo' : 'Inativo'}
                      </span>
                      {liveState && (
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${liveState.badgeColor}`}
                        >
                          {liveState.statusLabel}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Credentials & Access Info */}
                <div className="p-2.5 bg-zinc-950/80 rounded-xl border border-zinc-800 mb-3 text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-amber-400" />
                      <span>E-mail:</span>
                    </span>
                    <strong className="text-zinc-200">{prof.email || userAcc?.email || 'Cadastrado'}</strong>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-400" />
                      <span>Painel Barbeiro:</span>
                    </span>
                    <span className="text-emerald-400 font-semibold">Liberado</span>
                  </div>
                </div>

                {/* Working schedule details */}
                <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Jornada de Trabalho:</span>
                    <strong className="text-zinc-200">
                      {prof.startTime} às {prof.endTime}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Intervalo de Almoço:</span>
                    <span className="text-amber-400 font-medium">
                      {prof.lunchStart} às {prof.lunchEnd}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block mb-1">Dias de Trabalho:</span>
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                        const works = prof.workingDays.includes(dayIdx);
                        return (
                          <span
                            key={dayIdx}
                            className={`text-[10px] px-1.5 py-0.5 rounded ${
                              works
                                ? 'bg-amber-500/20 text-amber-300 font-bold'
                                : 'bg-zinc-900 text-zinc-600'
                            }`}
                          >
                            {WEEKDAY_SHORT[dayIdx]}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-xs text-zinc-400">★ {prof.rating.toFixed(1)} ({prof.reviewsCount} cortes)</span>
                <div className="flex items-center gap-2">
                  <button
                    id={`edit-prof-${prof.id}`}
                    onClick={() => openEditModal(prof)}
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {deletingProfId === prof.id ? (
                    <div className="flex items-center gap-1 bg-red-950/80 p-1 rounded-lg border border-red-800">
                      <button
                        type="button"
                        id={`confirm-delete-prof-${prof.id}`}
                        onClick={() => {
                          deleteProfessional(prof.id);
                          setDeletingProfId(null);
                        }}
                        className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold"
                      >
                        Excluir
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingProfId(null)}
                        className="px-1.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px]"
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <button
                      id={`delete-prof-${prof.id}`}
                      onClick={() => setDeletingProfId(prof.id)}
                      className="p-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/30 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit / Create Modal with HIGH VISIBILITY FIELDS */}
      {(isCreating || editingProf) && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-950 border-2 border-amber-500/60 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative text-zinc-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-5">
              <div>
                <span className="text-amber-400 text-[11px] font-bold uppercase tracking-wider block">
                  {isCreating ? 'Novo Cadastro' : 'Edição'}
                </span>
                <h3 className="text-xl font-bold font-display text-white">
                  {isCreating ? 'Cadastrar Novo Barbeiro' : `Editar Barbeiro: ${editingProf?.name}`}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingProf(null);
                }}
                className="p-2 text-zinc-400 hover:text-white rounded-xl bg-zinc-900 border border-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Nome e Especialidade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-100 mb-1.5 uppercase tracking-wide">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Carlos Eduardo"
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

              {/* E-mail e Telefone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-100 mb-1.5 uppercase tracking-wide">
                    E-mail (Login no Painel) *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="carlos@barberflow.com.br"
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

              {/* Senha para login inicial */}
              {isCreating && (
                <div className="p-3.5 bg-zinc-900 rounded-2xl border-2 border-zinc-800 space-y-2">
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
                </div>
              )}

              {/* Biografia */}
              <div>
                <label className="block text-xs font-bold text-zinc-100 mb-1.5 uppercase tracking-wide">
                  Biografia / Apresentação
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Experiência, técnicas dominadas..."
                  className="w-full bg-zinc-900 border-2 border-zinc-700 focus:border-amber-400 focus:bg-zinc-950 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-zinc-400 font-medium focus:outline-none"
                />
              </div>

              {/* Foto Preset e Custom URL */}
              <div>
                <label className="block text-xs font-bold text-zinc-100 mb-1.5 uppercase tracking-wide flex items-center justify-between">
                  <span>Foto de Perfil</span>
                  <span className="text-[10px] text-zinc-400">Escolha uma foto ou informe URL</span>
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {PRESET_AVATARS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(preset.url)}
                      className={`relative h-14 rounded-xl overflow-hidden border-2 transition-all ${
                        avatar === preset.url
                          ? 'border-amber-500 scale-95 shadow-md ring-2 ring-amber-500/30'
                          : 'border-zinc-700 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-zinc-900 border-2 border-zinc-700 focus:border-amber-400 focus:bg-zinc-950 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-400 focus:outline-none"
                />
              </div>

              {/* Working Hours */}
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

              <div>
                <label className="block text-xs font-bold text-zinc-100 mb-1.5 uppercase tracking-wide">
                  Status de Atendimento
                </label>
                <select
                  value={active ? 'true' : 'false'}
                  onChange={(e) => setActive(e.target.value === 'true')}
                  className="w-full bg-zinc-900 border-2 border-zinc-700 focus:border-amber-400 focus:bg-zinc-950 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                >
                  <option value="true">Ativo (Recebendo agendamentos normalmente)</option>
                  <option value="false">Inativo / Férias / Indisponível</option>
                </select>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingProf(null);
                  }}
                  className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20"
                >
                  Salvar Barbeiro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
