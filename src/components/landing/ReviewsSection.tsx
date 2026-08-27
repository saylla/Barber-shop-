import React from 'react';
import { useApp } from '../../context/AppContext';
import { Star, Quote, CheckCircle } from 'lucide-react';

export const ReviewsSection: React.FC = () => {
  const { reviews } = useApp();

  return (
    <section id="avaliacoes" className="py-16 sm:py-24 bg-zinc-950/80 border-t border-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
            Depoimentos Reais
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-white tracking-tight">
            A Experiência de Quem Já Cortou Conosco
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 mt-2">
            Mais de 500 cavalheiros atendidos com nota média de 4.9 estrelas no Google.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              id={`review-${rev.id}`}
              className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between relative"
            >
              <Quote className="w-8 h-8 text-amber-500/20 absolute top-5 right-5" />

              <div>
                {/* Rating stars */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="text-sm text-zinc-300 italic leading-relaxed mb-6">
                  "{rev.comment}"
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={rev.customerAvatar}
                    alt={rev.customerName}
                    className="w-10 h-10 rounded-full object-cover border border-zinc-700"
                  />
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1">
                      <span>{rev.customerName}</span>
                      <CheckCircle className="w-3.5 h-3.5 text-amber-400 inline" />
                    </div>
                    <span className="text-[11px] text-zinc-500">{rev.serviceName}</span>
                  </div>
                </div>

                <span className="text-[11px] text-zinc-500 font-medium">
                  {rev.date}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
