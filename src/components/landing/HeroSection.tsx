import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, ArrowRight, ShieldCheck, Clock, Award, Star } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const { openBookingModal, settings } = useApp();

  return (
    <section id="hero-section" className="relative overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headlines & CTA */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-amber-500/30 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-semibold text-amber-300">
                Experiência Premium & Sem Espera
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-white leading-[1.1]">
              Seu estilo.{' '}
              <span className="gold-gradient-text block sm:inline">
                Seu horário.
              </span>{' '}
              <br className="hidden sm:inline" />
              Sem espera.
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-zinc-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Agende seu corte, barba ou combo com os melhores mestres barbeiros em segundos.
              Escolha o profissional, consulte a agenda em tempo real e garanta seu horário VIP.
            </p>

            {/* Main CTA & Secondary */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                id="hero-agendar-agora-btn"
                onClick={() => openBookingModal()}
                className="w-full sm:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm uppercase tracking-wider rounded-2xl transition-all shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3"
              >
                <span>AGENDAR AGORA</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#servicos"
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-white text-sm font-semibold transition-all text-center"
              >
                Ver Tabela de Serviços
              </a>
            </div>

            {/* Badges strip */}
            <div className="pt-6 border-t border-zinc-900 grid grid-cols-3 gap-3 text-left">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400 flex-shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-xs text-white font-bold">Sem Fila</strong>
                  <span className="text-[11px] text-zinc-500">Horário garantido</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400 flex-shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-xs text-white font-bold">Mestres</strong>
                  <span className="text-[11px] text-zinc-500">Profissionais top</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400 flex-shrink-0">
                  <Star className="w-4 h-4 fill-amber-400" />
                </div>
                <div>
                  <strong className="block text-xs text-white font-bold">4.9 / 5.0</strong>
                  <span className="text-[11px] text-zinc-500">+500 clientes VIP</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Premium Frame */}
              <div className="rounded-3xl p-2 bg-gradient-to-b from-zinc-700/40 via-zinc-800/20 to-amber-500/20 border border-zinc-800 shadow-2xl overflow-hidden">
                <img
                  src={settings.bannerImage}
                  alt="Barbearia Premium"
                  className="rounded-2xl w-full h-[420px] object-cover filter brightness-90 hover:brightness-100 transition-all duration-500"
                />
              </div>

              {/* Floating Quick Card */}
              <div className="absolute -bottom-6 -left-4 sm:-left-6 bg-zinc-900/95 border border-zinc-700/80 p-4 rounded-2xl shadow-2xl backdrop-blur-md max-w-[240px] flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Toalha Quente & Café</div>
                  <div className="text-[11px] text-zinc-400">Cortesia em todos os combos</div>
                </div>
              </div>

              {/* Floating Live Slots Badge */}
              <div className="absolute top-6 -right-3 sm:-right-4 bg-zinc-950/90 border border-amber-500/40 py-2 px-3.5 rounded-xl shadow-xl flex items-center gap-2 backdrop-blur-md">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-bold text-zinc-200">Agenda aberta hoje</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
