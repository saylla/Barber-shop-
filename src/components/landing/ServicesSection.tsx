import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Service, ServiceCategory } from '../../types';
import { formatCurrency } from '../../utils/calendarUtils';
import { Clock, Sparkles, Check, ArrowRight } from 'lucide-react';

export const ServicesSection: React.FC = () => {
  const { services, openBookingModal } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'Todos os Serviços' },
    { id: 'corte', label: 'Cortes' },
    { id: 'barba', label: 'Barba' },
    { id: 'combo', label: 'Combos Especiais' },
    { id: 'coloracao', label: 'Platinado / Cor' },
    { id: 'tratamento', label: 'Tratamentos' },
  ];

  const filteredServices = services
    .filter((s) => s.active)
    .filter((s) => (selectedCategory === 'all' ? true : s.category === selectedCategory));

  return (
    <section id="servicos" className="py-16 sm:py-24 bg-zinc-950/60 border-t border-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
            Menu de Atendimentos
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-white tracking-tight">
            Nossos Serviços & Combos VIP
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 mt-2">
            Técnicas modernas de corte, navalhagem clássica e tratamentos capilares com produtos de linha mundial.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                id={`cat-filter-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-bold'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Services Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              id={`service-item-${service.id}`}
              className="group bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/5 relative overflow-hidden"
            >
              {service.popular && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-400 to-amber-600 text-black text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md z-10">
                  Mais Pedido
                </div>
              )}

              <div>
                {/* Service Image */}
                <div className="rounded-xl overflow-hidden mb-4 h-48 border border-zinc-800 relative">
                  <img
                    src={service.image}
                    alt={service.name}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />
                  
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-950/80 backdrop-blur-sm border border-zinc-800 text-xs font-medium text-zinc-300">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{service.durationMinutes} minutos</span>
                  </div>
                </div>

                {/* Info */}
                <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                  {service.name}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 line-clamp-3 leading-relaxed">
                  {service.description}
                </p>
              </div>

              {/* Price & Action */}
              <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-zinc-500 uppercase tracking-wider block font-semibold">
                    Investimento
                  </span>
                  <span className="text-xl font-black text-amber-400">
                    {formatCurrency(service.price)}
                  </span>
                </div>

                <button
                  id={`select-service-${service.id}`}
                  onClick={() => openBookingModal(service)}
                  className="px-4 py-2.5 bg-zinc-800 group-hover:bg-amber-500 text-zinc-200 group-hover:text-black font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <span>Selecionar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
