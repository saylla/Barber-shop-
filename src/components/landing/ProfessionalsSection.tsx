import React from 'react';
import { useApp } from '../../context/AppContext';
import { Star, Scissors, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export const ProfessionalsSection: React.FC = () => {
  const { professionals, openBookingModal } = useApp();
  const activeProfessionals = professionals.filter((p) => p.active);

  return (
    <section id="barbeiros" className="py-16 sm:py-24 bg-zinc-950 border-t border-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
            Corpo de Barbeiros
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-white tracking-tight">
            Mestres da Navalha & Visagistas
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 mt-2">
            Profissionais certificados internacionalmente, prontos para valorizar seus traços e elevar sua confiança.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {activeProfessionals.map((barber) => (
            <div
              key={barber.id}
              id={`barber-item-${barber.id}`}
              className="group bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Avatar with luxury ring */}
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
                  <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                    {barber.name}
                  </h3>
                  <p className="text-xs font-semibold text-amber-500 mt-1">
                    {barber.specialty}
                  </p>
                  <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
                    {barber.bio}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-zinc-800/80">
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-4">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{barber.reviewsCount} avaliações</span>
                  </span>
                  <span className="text-zinc-500">
                    Atende Seg - Sáb
                  </span>
                </div>

                <button
                  id={`book-with-barber-${barber.id}`}
                  onClick={() => openBookingModal()}
                  className="w-full py-3 bg-zinc-800 group-hover:bg-amber-500 text-zinc-200 group-hover:text-black font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Scissors className="w-4 h-4" />
                  <span>Agendar com {barber.name.split(' ')[0]}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
