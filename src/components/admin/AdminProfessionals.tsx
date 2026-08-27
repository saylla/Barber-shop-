import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Professional } from '../../types';
import { WEEKDAY_SHORT } from '../../utils/calendarUtils';
import { Plus, Edit2, Trash2, Star, Clock, Calendar, Check, X, User } from 'lucide-react';

export const AdminProfessionals: React.FC = () => {
  const {
    professionals,
    services,
    professionalLiveStates,
    createProfessional,
    updateProfessional,
    deleteProfessional,
  } = useApp();

  const [editingProf, setEditingProf] = useState<Professional | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingProfId, setDeletingProfId] = useState<string | null>(null);

  // Form
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
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
    setBio('Profissional com anos de experiência.');
    setAvatar('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80');
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
    if (!name.trim()) return;

    if (editingProf) {
      updateProfessional({
        ...editingProf,
        name: name.trim(),
        specialty: specialty.trim(),
        bio: bio.trim(),
        avatar: avatar.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        startTime,
        endTime,
        lunchStart,
        lunchEnd,
        workingDays,
        active,
      });
      setEditingProf(null);
    } else {
      createProfessional({
        name: name.trim(),
        specialty: specialty.trim(),
        bio: bio.trim(),
        avatar: avatar.trim() || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
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
      });
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
            Cadastro de Profissionais
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configure horários de entrada, saída, intervalo de almoço e dias de trabalho de cada barbeiro.
          </p>
        </div>

        <button
          id="admin-add-prof-btn"
          onClick={openCreateModal}
          className="py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Barbeiro</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {professionals.map((prof) => {
          const liveState = professionalLiveStates[prof.id];

          return (
            <div
              key={prof.id}
              id={`admin-prof-${prof.id}`}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-md flex flex-col justify-between"
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

      {/* Edit / Create Modal */}
      {(isCreating || editingProf) && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-zinc-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
              <h3 className="text-lg font-bold font-display text-white">
                {isCreating ? 'Novo Profissional' : `Editar: ${editingProf?.name}`}
              </h3>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingProf(null);
                }}
                className="p-1.5 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Carlos Eduardo"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Especialidade Principal *
                </label>
                <input
                  type="text"
                  required
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Ex: Especialista em Degradê & Barba Terapia"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Biografia / Descrição Curta
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Anos de experiência, formação..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  URL da Foto de Perfil
                </label>
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Working Hours */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Início do Turno
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Fim do Turno
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Lunch break */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Início Almoço
                  </label>
                  <input
                    type="time"
                    value={lunchStart}
                    onChange={(e) => setLunchStart(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Fim Almoço
                  </label>
                  <input
                    type="time"
                    value={lunchEnd}
                    onChange={(e) => setLunchEnd(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Working Days selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Dias da Semana de Atendimento
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                    const isSelected = workingDays.includes(dayIdx);
                    return (
                      <button
                        key={dayIdx}
                        type="button"
                        onClick={() => toggleDay(dayIdx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-black'
                            : 'bg-zinc-900 text-zinc-500 hover:text-white border border-zinc-800'
                        }`}
                      >
                        {WEEKDAY_SHORT[dayIdx]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Status
                </label>
                <select
                  value={active ? 'true' : 'false'}
                  onChange={(e) => setActive(e.target.value === 'true')}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="true">Ativo (Aceitando agendamentos)</option>
                  <option value="false">Inativo / Férias</option>
                </select>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingProf(null);
                  }}
                  className="flex-1 py-3 bg-zinc-900 text-zinc-300 rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl text-xs uppercase tracking-wider"
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
