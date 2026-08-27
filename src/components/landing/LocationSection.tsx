import React from 'react';
import { useApp } from '../../context/AppContext';
import { MapPin, Phone, MessageSquare, Clock, Instagram, ExternalLink } from 'lucide-react';
import { WEEKDAY_FULL } from '../../utils/calendarUtils';

export const LocationSection: React.FC = () => {
  const { settings, businessHours, openBookingModal } = useApp();

  const handleWhatsAppDirect = () => {
    const text = encodeURIComponent(`Olá! Gostaria de tirar uma dúvida sobre a barbearia ${settings.name}.`);
    window.open(`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}?text=${text}`, '_blank');
  };

  return (
    <section id="localizacao" className="py-16 sm:py-24 bg-zinc-950 border-t border-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Address & Contact Details */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
                Onde Estamos & Horários
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-white tracking-tight">
                Venha nos Visitar no Jardins
              </h2>
              <p className="text-sm text-zinc-400 mt-2">
                Ambiente climatizado, café espresso cortesia, cerveja artesanal e estacionamento com manobrista conveniado.
              </p>
            </div>

            {/* Info Cards */}
            <div className="space-y-3">
              <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Endereço</h3>
                  <p className="text-xs text-zinc-300 mt-0.5">{settings.address} — {settings.city}</p>
                  <a
                    href={settings.mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-amber-400 hover:underline mt-1 font-semibold"
                  >
                    <span>Abrir no Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white">Contato & Reservas</h3>
                    <p className="text-xs text-zinc-300 mt-0.5">{settings.phone}</p>
                  </div>
                  <button
                    id="location-whatsapp-btn"
                    onClick={handleWhatsAppDirect}
                    className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp Direto</span>
                  </button>
                </div>
              </div>

              <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                  <Instagram className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Instagram Oficial</h3>
                  <a
                    href={`https://instagram.com/${settings.instagram}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-amber-400 hover:underline mt-0.5 block font-medium"
                  >
                    @{settings.instagram}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Weekly Schedule Table */}
          <div className="lg:col-span-6 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-800 mb-4">
              <Clock className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-white">Horário de Funcionamento</h3>
            </div>

            <div className="space-y-2.5">
              {[1, 2, 3, 4, 5, 6, 0].map((dayIdx) => {
                const dayConfig = businessHours[dayIdx];
                const dayName = WEEKDAY_FULL[dayIdx];
                const todayIdx = new Date().getDay();
                const isToday = todayIdx === dayIdx;

                return (
                  <div
                    key={dayIdx}
                    className={`flex items-center justify-between py-2 px-3 rounded-xl text-xs transition-colors ${
                      isToday
                        ? 'bg-amber-500/15 border border-amber-500/30 text-white font-bold'
                        : 'text-zinc-300 hover:bg-zinc-800/40'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {isToday && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                      <span>{dayName}</span>
                    </span>

                    {dayConfig?.isOpen ? (
                      <span className="text-zinc-200">
                        {dayConfig.open} às {dayConfig.close}
                      </span>
                    ) : (
                      <span className="text-red-400 font-semibold">Fechado</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800">
              <button
                id="location-book-now-btn"
                onClick={() => openBookingModal()}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold uppercase tracking-wider rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20"
              >
                Garantir Meu Horário Agora
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
