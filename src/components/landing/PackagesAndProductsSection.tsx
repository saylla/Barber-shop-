import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MonthlyPackage, BarberProduct } from '../../types';
import { formatCurrency } from '../../utils/calendarUtils';
import {
  Package,
  ShoppingBag,
  Check,
  Sparkles,
  Scissors,
  QrCode,
  ArrowRight,
  MessageCircle,
  ShieldCheck,
  Star,
  Zap,
} from 'lucide-react';

export const PackagesAndProductsSection: React.FC = () => {
  const { packages, products, professionals, settings, openBookingModal, openQrCodeModal, showToast } =
    useApp();

  const [activeTab, setActiveTab] = useState<'packages' | 'products'>('packages');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const activePackages = (packages || []).filter((p) => p?.active);
  const activeProducts = (products || []).filter((p) => p?.active);

  const filteredProducts = activeProducts.filter((p) => {
    if (selectedCategory === 'all') return true;
    return p?.category === selectedCategory;
  });

  const handleWhatsAppInquiry = (item: MonthlyPackage | BarberProduct, type: 'package' | 'product') => {
    const cleanPhone = (settings.whatsapp || settings.phone).replace(/\D/g, '');
    const phoneToUse = cleanPhone.length >= 10 ? (cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`) : '5511999999999';

    let message = '';
    if (type === 'package') {
      const pkg = item as MonthlyPackage;
      message = `Olá! Gostaria de assinar o plano mensal *${pkg.name}* (${formatCurrency(pkg.price)}/mês) no ${settings.name}. Como faço para ativar minha assinatura?`;
    } else {
      const prod = item as BarberProduct;
      const priceStr = formatCurrency(prod.promotionalPrice || prod.price);
      message = `Olá! Gostaria de reservar o produto *${prod.name}* (${priceStr}) para retirar no meu próximo atendimento no ${settings.name}.`;
    }

    const url = `https://wa.me/${phoneToUse}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <section id="clube-e-produtos-section" className="py-20 bg-zinc-950 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-widest mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Clube VIP & Loja Oficial</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display text-white">
            Planos Mensais & Cosméticos Premium
          </h2>

          <p className="text-sm sm:text-base text-zinc-400 mt-3 leading-relaxed">
            Economize com nossos <strong>Clubes Mensais de Assinatura</strong> de cortes e barbas ilimitados, ou leve para casa as melhores <strong>pomadas, óleos e tônicos</strong> usados pelos nossos mestres da navalha.
          </p>

          {/* Toggle Switch */}
          <div className="inline-flex bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 mt-8 shadow-xl">
            <button
              id="switch-to-packages-btn"
              type="button"
              onClick={() => setActiveTab('packages')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'packages'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Assinaturas Mensais ({activePackages.length})</span>
            </button>

            <button
              id="switch-to-products-btn"
              type="button"
              onClick={() => setActiveTab('products')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'products'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Produtos & Pomadas ({activeProducts.length})</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: PACOTES MENSAIS (CLUBE VIP)                                       */}
        {/* ========================================================================= */}
        {activeTab === 'packages' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            {activePackages.map((pkg) => {
              const barber = professionals.find((p) => p.id === pkg.barberId);
              return (
                <div
                  key={pkg.id}
                  id={`public-package-${pkg.id}`}
                  className={`bg-zinc-900 border rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all relative overflow-hidden group hover:shadow-2xl ${
                    pkg.popular
                      ? 'border-amber-500/80 shadow-xl shadow-amber-500/10'
                      : 'border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-bl-2xl shadow-md flex items-center gap-1">
                      <Star className="w-3 h-3 fill-black" />
                      <span>Mais Escolhido</span>
                    </div>
                  )}

                  <div>
                    {/* Package Image */}
                    <div className="relative h-48 rounded-2xl overflow-hidden mb-5 border border-zinc-800">
                      <img
                        src={pkg.image}
                        alt={pkg.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
                      <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold text-amber-400 border border-zinc-700/50">
                        {pkg.servicesIncludedText}
                      </div>
                    </div>

                    <h3 className="text-2xl font-black font-display text-white mb-1">
                      {pkg.name}
                    </h3>
                    {pkg.tagline && (
                      <p className="text-xs font-bold text-amber-400 mb-3">
                        {pkg.tagline}
                      </p>
                    )}
                    <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                      {pkg.description}
                    </p>

                    {/* Benefits List */}
                    <div className="space-y-2.5 mb-6 bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800/80">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">
                        O que está incluso:
                      </span>
                      {(pkg.benefits || []).map((benefit, bIdx) => (
                        <div key={bIdx} className="flex items-start gap-2.5 text-xs text-zinc-300">
                          <div className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3" />
                          </div>
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-400 py-2 border-t border-zinc-800 mb-4">
                      <span>Válido com:</span>
                      <span className="font-bold text-zinc-200">
                        {pkg.barberId === 'all' || !pkg.barberId
                          ? 'Qualquer Barbeiro do Salão'
                          : barber?.name || 'Barbeiro Designado'}
                      </span>
                    </div>
                  </div>

                  {/* Price and CTAs */}
                  <div className="pt-4 border-t border-zinc-800">
                    <div className="mb-4">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">
                        Assinatura Mensal
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-amber-400">
                          {formatCurrency(pkg.price)}
                        </span>
                        <span className="text-xs text-zinc-400">/mês</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => openBookingModal()}
                        className="py-3 px-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5 fill-black" />
                        <span>Agendar Corte</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleWhatsAppInquiry(pkg, 'package')}
                        className="py-3 px-3 bg-zinc-800 hover:bg-emerald-600 hover:text-white text-zinc-200 font-bold text-xs rounded-xl transition-all border border-zinc-700 flex items-center justify-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Assinar no WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PRODUTOS & POMADAS AVULSAS                                        */}
        {/* ========================================================================= */}
        {activeTab === 'products' && (
          <div>
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
              {[
                { id: 'all', label: 'Todos os Cosméticos' },
                { id: 'pomadas', label: 'Pomadas & Ceras' },
                { id: 'barba', label: 'Óleos & Balm' },
                { id: 'finalizador', label: 'Gel & Finalizador' },
                { id: 'shampoo', label: 'Shampoos' },
                { id: 'acessorios', label: 'Acessórios' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-amber-500 text-black font-black shadow-md'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((prod) => {
                const barber = professionals.find((p) => p.id === prod.barberId);
                return (
                  <div
                    key={prod.id}
                    id={`public-prod-${prod.id}`}
                    className="bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 rounded-3xl p-5 flex flex-col justify-between transition-all group hover:shadow-xl"
                  >
                    <div>
                      {/* Product Photo */}
                      <div className="relative h-48 rounded-2xl overflow-hidden mb-4 border border-zinc-800 bg-zinc-950">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <span className="absolute top-2.5 right-2.5 bg-black/80 backdrop-blur-md text-[10px] font-bold text-amber-400 px-2.5 py-1 rounded-lg border border-zinc-700/60">
                          {prod.brand}
                        </span>
                        <span className="absolute bottom-2.5 left-2.5 bg-emerald-500/90 text-black text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                          Em Estoque ({prod.stock})
                        </span>
                      </div>

                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold block mb-0.5">
                        {prod.category}
                      </span>
                      <h3 className="font-bold text-base text-white line-clamp-1 mb-1">
                        {prod.name}
                      </h3>
                      <p className="text-xs text-zinc-400 line-clamp-2 mb-3 leading-relaxed">
                        {prod.description}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-zinc-400 py-1.5 border-t border-zinc-800/80 mb-3">
                        <span>Recomendado por:</span>
                        <span className="font-semibold text-zinc-200">
                          {prod.barberId === 'all' || !prod.barberId
                            ? 'Barbearia Oficial'
                            : barber?.name || 'Barbeiro'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-zinc-800">
                      <div className="flex items-baseline justify-between mb-3">
                        <div>
                          <span className="text-[10px] text-zinc-500 uppercase block font-semibold">
                            Preço Unitário
                          </span>
                          {prod.promotionalPrice ? (
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-lg font-black text-amber-400">
                                {formatCurrency(prod.promotionalPrice)}
                              </span>
                              <span className="text-xs text-zinc-500 line-through">
                                {formatCurrency(prod.price)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-lg font-black text-amber-400">
                              {formatCurrency(prod.price)}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleWhatsAppInquiry(prod, 'product')}
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Comprar / Reservar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* QR Code Quick Booking Guarantee Banner */}
        <div className="mt-14 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
              <QrCode className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">
                Agendamento Direto via QR Code & Pix
              </h4>
              <p className="text-xs text-zinc-400 max-w-xl mt-0.5">
                Não precisa de conta Google para agendar. Escaneie o QR Code do seu barbeiro ou pague antecipado via Pix com total segurança e confirmação instantânea no WhatsApp.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={openQrCodeModal}
              className="w-full md:w-auto py-3 px-5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl border border-zinc-700 flex items-center justify-center gap-2 transition-all"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>Ver QR Code da Barbearia</span>
            </button>
            <button
              type="button"
              onClick={() => openBookingModal()}
              className="w-full md:w-auto py-3 px-6 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <span>Agendar Agora</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
