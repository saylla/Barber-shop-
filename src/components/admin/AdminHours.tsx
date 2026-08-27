import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BusinessHours } from '../../types';
import { formatDateBR, getTodayDateString, WEEKDAY_FULL } from '../../utils/calendarUtils';
import { Clock, Ban, Plus, Trash2, Save, ShieldAlert } from 'lucide-react';

export const AdminHours: React.FC = () => {
  const {
    businessHours,
    updateBusinessHours,
    blockedTimes,
    addBlockedTime,
    removeBlockedTime,
    professionals,
    settings,
    updateSettings,
    showToast,
  } = useApp();

  const [hoursState, setHoursState] = useState<BusinessHours>(businessHours);
  const [slotInterval, setSlotInterval] = useState<number>(settings.slotIntervalMinutes || 30);

  // New Block Form
  const [blockProfId, setBlockProfId] = useState('all');
  const [blockDate, setBlockDate] = useState(getTodayDateString());
  const [blockStart, setBlockStart] = useState('14:00');
  const [blockEnd, setBlockEnd] = useState('16:00');
  const [blockReason, setBlockReason] = useState('Treinamento / Manutenção');

  const handleDayChange = (
    dayIndex: number,
    field: 'isOpen' | 'open' | 'close' | 'lunchStart' | 'lunchEnd',
    value: any
  ) => {
    setHoursState((prev) => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        [field]: value,
      },
    }));
  };

  const handleSaveHours = () => {
    updateBusinessHours(hoursState);
    updateSettings({ ...settings, slotIntervalMinutes: slotInterval });
    showToast('Horários e intervalos salvos com sucesso!', 'success');
  };

  const handleAddBlock = (e: React.FormEvent) => {
    e.preventDefault();
    addBlockedTime({
      professionalId: blockProfId,
      date: blockDate,
      startTime: blockStart,
      endTime: blockEnd,
      reason: blockReason,
    });
    setBlockReason('Bloqueio de horário');
  };

  return (
    <div id="admin-hours-view" className="space-y-8">
      {/* Top Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-amber-400 text-xs font-bold uppercase tracking-wider block mb-0.5">
            Agenda & Regras de Intervalo
          </span>
          <h1 className="text-2xl font-black font-display text-white">
            Horários de Funcionamento & Bloqueios
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configure o horário de abertura, fechamento e períodos bloqueados para cálculo automático de vagas.
          </p>
        </div>

        <button
          id="admin-save-hours-btn"
          onClick={handleSaveHours}
          className="py-3 px-6 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-md self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>Salvar Horários</span>
        </button>
      </div>

      {/* Interval Setting */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-md">
        <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <span>Intervalo entre Horários de Agendamento (Grade de Slots)</span>
        </h3>
        <p className="text-xs text-zinc-400 mb-4">
          Define de quantos em quantos minutos os horários disponíveis serão gerados na tela do cliente.
        </p>

        <div className="flex flex-wrap gap-2.5">
          {[15, 30, 45, 60].map((interval) => (
            <button
              key={interval}
              type="button"
              onClick={() => setSlotInterval(interval)}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${
                slotInterval === interval
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'bg-zinc-950 text-zinc-300 border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              A cada {interval} minutos
            </button>
          ))}
        </div>
      </div>

      {/* Operating Hours Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-md">
        <h3 className="text-base font-bold text-white mb-4">
          Horários por Dia da Semana
        </h3>

        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6, 0].map((dayIdx) => {
            const config = hoursState[dayIdx] || { isOpen: false, open: '09:00', close: '19:00' };
            const dayName = WEEKDAY_FULL[dayIdx];

            return (
              <div
                key={dayIdx}
                className={`p-4 rounded-2xl border transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  config.isOpen
                    ? 'bg-zinc-950/70 border-zinc-800'
                    : 'bg-zinc-950/30 border-zinc-900 opacity-60'
                }`}
              >
                {/* Day name & toggle */}
                <div className="flex items-center gap-3 min-w-[180px]">
                  <input
                    type="checkbox"
                    id={`open-toggle-${dayIdx}`}
                    checked={config.isOpen}
                    onChange={(e) => handleDayChange(dayIdx, 'isOpen', e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-0 focus:ring-offset-0 bg-zinc-900 border-zinc-700"
                  />
                  <label htmlFor={`open-toggle-${dayIdx}`} className="text-sm font-bold text-white cursor-pointer">
                    {dayName}
                  </label>
                </div>

                {config.isOpen ? (
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-400">Abre:</span>
                      <input
                        type="time"
                        value={config.open}
                        onChange={(e) => handleDayChange(dayIdx, 'open', e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-white text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-400">Fecha:</span>
                      <input
                        type="time"
                        value={config.close}
                        onChange={(e) => handleDayChange(dayIdx, 'close', e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-white text-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-red-400 font-semibold">
                    Estabelecimento Fechado
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Blocked Times Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-md space-y-6">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Ban className="w-4 h-4 text-red-400" />
            <span>Bloqueio de Horários Especiais (Feriados, Treinamentos ou Pausas)</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Horários bloqueados impedem automaticamente qualquer cliente de agendar no período selecionado.
          </p>
        </div>

        {/* Add block form */}
        <form onSubmit={handleAddBlock} className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Profissional Afetado
              </label>
              <select
                value={blockProfId}
                onChange={(e) => setBlockProfId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="all">Todos os Barbeiros (Salão Todo)</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Data do Bloqueio
              </label>
              <input
                type="date"
                required
                value={blockDate}
                onChange={(e) => setBlockDate(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Horário Início
              </label>
              <input
                type="time"
                required
                value={blockStart}
                onChange={(e) => setBlockStart(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Horário Fim
              </label>
              <input
                type="time"
                required
                value={blockEnd}
                onChange={(e) => setBlockEnd(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <input
              type="text"
              required
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Motivo do bloqueio (ex: Reunião de equipe / Feriado municipal)"
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white"
            />
            <button
              type="submit"
              className="py-2 px-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs uppercase flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Bloqueio</span>
            </button>
          </div>
        </form>

        {/* Existing Blocks List */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Bloqueios Ativos ({blockedTimes.length})
          </h4>

          {blockedTimes.length === 0 ? (
            <p className="text-xs text-zinc-500 italic">Nenhum horário bloqueado no momento.</p>
          ) : (
            blockedTimes.map((blk) => {
              const prof = professionals.find((p) => p.id === blk.professionalId);
              return (
                <div
                  key={blk.id}
                  className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-white">
                        {formatDateBR(blk.date)} — {blk.startTime} às {blk.endTime}
                      </strong>
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px]">
                        {blk.professionalId === 'all' ? 'Todos' : prof?.name || 'Barbeiro'}
                      </span>
                    </div>
                    <span className="text-zinc-400 text-[11px] block mt-0.5">
                      Motivo: {blk.reason}
                    </span>
                  </div>

                  <button
                    onClick={() => removeBlockedTime(blk.id)}
                    className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                    title="Remover bloqueio"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
