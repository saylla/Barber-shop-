import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BarberProduct, MonthlyPackage, ProductCategory } from '../../types';
import { formatCurrency } from '../../utils/calendarUtils';
import {
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Package,
  ShoppingBag,
  Check,
  X,
  Image as ImageIcon,
  Tag,
  Scissors,
  DollarSign,
  Layers,
  AlertTriangle,
  Upload,
  Search,
  Filter,
  CheckCircle2,
} from 'lucide-react';

const PRODUCT_IMAGE_PRESETS = [
  {
    name: 'Pomada Matte Clay',
    url: 'https://images.unsplash.com/photo-1597854710119-a5a843967365?auto=format&fit=crop&w=600&q=80',
    category: 'pomadas' as ProductCategory,
  },
  {
    name: 'Óleo de Barba Nobre',
    url: 'https://images.unsplash.com/photo-1626015365107-275d3156cf38?auto=format&fit=crop&w=600&q=80',
    category: 'barba' as ProductCategory,
  },
  {
    name: 'Gel Cola / Pomada Black',
    url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
    category: 'finalizador' as ProductCategory,
  },
  {
    name: 'Balm Refrescante Pós-Barba',
    url: 'https://images.unsplash.com/photo-1608248597359-009761e389e6?auto=format&fit=crop&w=600&q=80',
    category: 'barba' as ProductCategory,
  },
  {
    name: 'Shampoo Antiqueda & Mentol',
    url: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80',
    category: 'shampoo' as ProductCategory,
  },
  {
    name: 'Pente de Madeira Anti-Estática',
    url: 'https://images.unsplash.com/photo-1590159763121-7c9ff3149e0a?auto=format&fit=crop&w=600&q=80',
    category: 'acessorios' as ProductCategory,
  },
];

const PACKAGE_IMAGE_PRESETS = [
  {
    name: 'Clube Cabelo Livre',
    url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Combo Cabelo + Barba VIP',
    url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Barboterapia & Toalha Quente',
    url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Executivo Prime & Tratamento',
    url: 'https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=600&q=80',
  },
];

export const AdminPackagesAndProducts: React.FC = () => {
  const {
    packages,
    createPackage,
    updatePackage,
    deletePackage,
    products,
    createProduct,
    updateProduct,
    deleteProduct,
    professionals,
    currentUser,
    showToast,
  } = useApp();

  const isBarber = currentUser?.role === 'barber';
  const myProfId = currentUser?.professionalId;

  const [activeTab, setActiveTab] = useState<'packages' | 'products'>('packages');
  const [selectedBarberFilter, setSelectedBarberFilter] = useState<string>(
    isBarber && myProfId ? myProfId : 'all'
  );
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<MonthlyPackage | null>(null);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<BarberProduct | null>(null);

  // Package Form State
  const [pkgName, setPkgName] = useState('');
  const [pkgTagline, setPkgTagline] = useState('');
  const [pkgDescription, setPkgDescription] = useState('');
  const [pkgPrice, setPkgPrice] = useState(119.9);
  const [pkgCuts, setPkgCuts] = useState<string>('unlimited');
  const [pkgBeards, setPkgBeards] = useState<string>('0');
  const [pkgBenefitsText, setPkgBenefitsText] = useState('');
  const [pkgImage, setPkgImage] = useState(PACKAGE_IMAGE_PRESETS[0].url);
  const [pkgBarberId, setPkgBarberId] = useState<string>('all');
  const [pkgActive, setPkgActive] = useState(true);
  const [pkgPopular, setPkgPopular] = useState(false);

  // Product Form State
  const [prodName, setProdName] = useState('');
  const [prodBrand, setProdBrand] = useState('BarberFlow Pro');
  const [prodCategory, setProdCategory] = useState<ProductCategory>('pomadas');
  const [prodDescription, setProdDescription] = useState('');
  const [prodPrice, setProdPrice] = useState(45.0);
  const [prodPromoPrice, setProdPromoPrice] = useState<number | undefined>(undefined);
  const [prodStock, setProdStock] = useState(20);
  const [prodImage, setProdImage] = useState(PRODUCT_IMAGE_PRESETS[0].url);
  const [prodBarberId, setProdBarberId] = useState<string>('all');
  const [prodActive, setProdActive] = useState(true);
  const [prodFeatured, setProdFeatured] = useState(false);

  const handlePkgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPkgImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProdImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProdImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Open Create Package
  const handleOpenCreatePackage = () => {
    setEditingPackage(null);
    setPkgName('');
    setPkgTagline('Corte e estilo impecável o mês inteiro');
    setPkgDescription('Assinatura mensal para manter seu visual sempre alinhado.');
    setPkgPrice(119.9);
    setPkgCuts('unlimited');
    setPkgBeards('0');
    setPkgBenefitsText(
      'Cortes de cabelo ilimitados no mês\nAcabamento e pezinho semanais\n10% de desconto em pomadas e cosméticos\nCafé e cerveja cortesia'
    );
    setPkgImage(PACKAGE_IMAGE_PRESETS[0].url);
    setPkgBarberId(isBarber && myProfId ? myProfId : 'all');
    setPkgActive(true);
    setPkgPopular(false);
    setIsPackageModalOpen(true);
  };

  // Open Edit Package
  const handleOpenEditPackage = (pkg: MonthlyPackage) => {
    setEditingPackage(pkg);
    setPkgName(pkg.name);
    setPkgTagline(pkg.tagline || '');
    setPkgDescription(pkg.description);
    setPkgPrice(pkg.price);
    setPkgCuts(pkg.cutsPerMonth === 'unlimited' ? 'unlimited' : String(pkg.cutsPerMonth));
    setPkgBeards(pkg.beardsPerMonth === 'unlimited' ? 'unlimited' : String(pkg.beardsPerMonth));
    setPkgBenefitsText((pkg.benefits || []).join('\n'));
    setPkgImage(pkg.image);
    setPkgBarberId(pkg.barberId || 'all');
    setPkgActive(pkg.active);
    setPkgPopular(Boolean(pkg.popular));
    setIsPackageModalOpen(true);
  };

  // Save Package
  const handleSavePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgName.trim()) {
      showToast('Por favor, informe o nome do pacote.', 'error');
      return;
    }

    const benefits = pkgBenefitsText
      .split('\n')
      .map((b) => b.trim())
      .filter(Boolean);

    const barber = professionals.find((p) => p.id === pkgBarberId);

    const cuts = pkgCuts === 'unlimited' ? 'unlimited' : Number(pkgCuts) || 0;
    const beards = pkgBeards === 'unlimited' ? 'unlimited' : Number(pkgBeards) || 0;

    let servicesIncludedText = '';
    if (cuts === 'unlimited' && beards === 'unlimited') {
      servicesIncludedText = 'Cabelo e Barba Ilimitados';
    } else if (cuts === 'unlimited') {
      servicesIncludedText = `Cortes ilimitados${beards ? ` + ${beards} Barbas` : ''}`;
    } else if (beards === 'unlimited') {
      servicesIncludedText = `${cuts ? `${cuts} Cortes + ` : ''}Barba ilimitada`;
    } else {
      servicesIncludedText = `${cuts} Cortes + ${beards} Barbas/mês`;
    }

    if (editingPackage) {
      updatePackage({
        ...editingPackage,
        name: pkgName.trim(),
        tagline: pkgTagline.trim(),
        description: pkgDescription.trim(),
        price: Number(pkgPrice),
        benefits,
        servicesIncludedText,
        cutsPerMonth: cuts,
        beardsPerMonth: beards,
        image: pkgImage,
        active: pkgActive,
        popular: pkgPopular,
        barberId: pkgBarberId,
        barberName: barber ? barber.name : undefined,
      });
    } else {
      createPackage({
        name: pkgName.trim(),
        tagline: pkgTagline.trim(),
        description: pkgDescription.trim(),
        price: Number(pkgPrice),
        benefits,
        servicesIncludedText,
        cutsPerMonth: cuts,
        beardsPerMonth: beards,
        image: pkgImage,
        active: pkgActive,
        popular: pkgPopular,
        barberId: pkgBarberId,
        barberName: barber ? barber.name : undefined,
      });
    }

    setIsPackageModalOpen(false);
  };

  // Open Create Product
  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setProdName('');
    setProdBrand('BarberFlow Pro');
    setProdCategory('pomadas');
    setProdDescription('Fixação forte com acabamento profissional e perfume marcante.');
    setProdPrice(45.0);
    setProdPromoPrice(undefined);
    setProdStock(20);
    setProdImage(PRODUCT_IMAGE_PRESETS[0].url);
    setProdBarberId(isBarber && myProfId ? myProfId : 'all');
    setProdActive(true);
    setProdFeatured(false);
    setIsProductModalOpen(true);
  };

  // Open Edit Product
  const handleOpenEditProduct = (prod: BarberProduct) => {
    setEditingProduct(prod);
    setProdName(prod.name);
    setProdBrand(prod.brand);
    setProdCategory(prod.category);
    setProdDescription(prod.description);
    setProdPrice(prod.price);
    setProdPromoPrice(prod.promotionalPrice);
    setProdStock(prod.stock);
    setProdImage(prod.image);
    setProdBarberId(prod.barberId || 'all');
    setProdActive(prod.active);
    setProdFeatured(Boolean(prod.featured));
    setIsProductModalOpen(true);
  };

  // Save Product
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      showToast('Por favor, informe o nome do produto.', 'error');
      return;
    }

    const barber = professionals.find((p) => p.id === prodBarberId);

    if (editingProduct) {
      updateProduct({
        ...editingProduct,
        name: prodName.trim(),
        brand: prodBrand.trim(),
        category: prodCategory,
        description: prodDescription.trim(),
        price: Number(prodPrice),
        promotionalPrice: prodPromoPrice ? Number(prodPromoPrice) : undefined,
        stock: Number(prodStock),
        image: prodImage,
        active: prodActive,
        featured: prodFeatured,
        barberId: prodBarberId,
        barberName: barber ? barber.name : undefined,
      });
    } else {
      createProduct({
        name: prodName.trim(),
        brand: prodBrand.trim(),
        category: prodCategory,
        description: prodDescription.trim(),
        price: Number(prodPrice),
        promotionalPrice: prodPromoPrice ? Number(prodPromoPrice) : undefined,
        stock: Number(prodStock),
        image: prodImage,
        active: prodActive,
        featured: prodFeatured,
        barberId: prodBarberId,
        barberName: barber ? barber.name : undefined,
      });
    }

    setIsProductModalOpen(false);
  };

  // Filtered packages
  const filteredPackages = (packages || []).filter((pkg) => {
    if (!pkg) return false;
    const matchesSearch =
      (pkg.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pkg.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBarber =
      selectedBarberFilter === 'all' ||
      pkg.barberId === 'all' ||
      pkg.barberId === selectedBarberFilter;
    return matchesSearch && matchesBarber;
  });

  // Filtered products
  const filteredProducts = (products || []).filter((prod) => {
    if (!prod) return false;
    const matchesSearch =
      (prod.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prod.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prod.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBarber =
      selectedBarberFilter === 'all' ||
      prod.barberId === 'all' ||
      prod.barberId === selectedBarberFilter;
    return matchesSearch && matchesBarber;
  });

  return (
    <div id="admin-packages-products-view" className="space-y-6">
      {/* Top Banner & Title */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Monetização & Recorrência</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-white">
            Pacotes Mensais & Produtos Avulsos
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Cada barbeiro pode montar seus próprios planos de assinatura recorrente e vender produtos de grooming (pomadas, géis, óleos) com controle de estoque e fotos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {activeTab === 'packages' ? (
            <button
              id="create-package-btn"
              onClick={handleOpenCreatePackage}
              className="py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Pacote Mensal</span>
            </button>
          ) : (
            <button
              id="create-product-btn"
              onClick={handleOpenCreateProduct}
              className="py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Produto / Cosmético</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-1">
            <span>Planos Mensais</span>
            <Package className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-2xl font-black text-white">{packages.length}</span>
          <span className="block text-[11px] text-zinc-500 mt-0.5">
            {packages.filter((p) => p.active).length} ativos no catálogo
          </span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-1">
            <span>Produtos em Estoque</span>
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-black text-white">{products.length}</span>
          <span className="block text-[11px] text-zinc-500 mt-0.5">
            {products.reduce((acc, p) => acc + p.stock, 0)} unidades totais
          </span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-1">
            <span>Ticket Médio Pacotes</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-2xl font-black text-amber-400">
            {formatCurrency(
              packages.length > 0
                ? packages.reduce((acc, p) => acc + p.price, 0) / packages.length
                : 0
            )}
          </span>
          <span className="block text-[11px] text-zinc-500 mt-0.5">por assinante/mês</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-1">
            <span>Seu Perfil / Barbeiro</span>
            <Scissors className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-sm font-bold text-white truncate block">
            {currentUser?.name}
          </span>
          <span className="block text-[11px] text-amber-400/90 font-semibold mt-0.5">
            {isBarber ? 'Barbeiro Credenciado' : 'Gestor Master & TI'}
          </span>
        </div>
      </div>

      {/* Filter and Tab Navigation Bar */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Tab switch */}
        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          <button
            id="tab-packages-view"
            type="button"
            onClick={() => setActiveTab('packages')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'packages'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Pacotes Mensais ({packages.length})</span>
          </button>
          <button
            id="tab-products-view"
            type="button"
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'products'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Produtos Avulsos ({products.length})</span>
          </button>
        </div>

        {/* Search & Barber Filter */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {!isBarber && (
            <select
              value={selectedBarberFilter}
              onChange={(e) => setSelectedBarberFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">Todos os Barbeiros</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Content View */}
      {activeTab === 'packages' ? (
        /* PACKAGES GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPackages.map((pkg) => {
            const barber = professionals.find((p) => p.id === pkg.barberId);
            return (
              <div
                key={pkg.id}
                id={`admin-pkg-${pkg.id}`}
                className="bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all relative overflow-hidden"
              >
                {pkg.popular && (
                  <div className="absolute top-3 right-3 bg-amber-500 text-black text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full z-10 shadow-sm">
                    Mais Vendido
                  </div>
                )}

                <div>
                  <div className="relative h-44 rounded-xl overflow-hidden mb-3.5 border border-zinc-800">
                    <img
                      src={pkg.image}
                      alt={pkg.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          PACKAGE_IMAGE_PRESETS[0].url;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-semibold text-zinc-300">
                      <span className="px-2 py-0.5 bg-black/70 backdrop-blur-md rounded-md text-amber-400">
                        {pkg.servicesIncludedText}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md ${
                          pkg.active
                            ? 'bg-emerald-500/90 text-black font-bold'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {pkg.active ? 'Ativo' : 'Pausado'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-lg text-white">{pkg.name}</h3>
                  </div>
                  {pkg.tagline && (
                    <p className="text-xs text-amber-400 font-medium mb-2">
                      {pkg.tagline}
                    </p>
                  )}
                  <p className="text-xs text-zinc-400 line-clamp-2 mb-3">
                    {pkg.description}
                  </p>

                  {/* Benefits Checklist */}
                  <div className="space-y-1.5 mb-4 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold block mb-1">
                      Benefícios Inclusos:
                    </span>
                    {(pkg.benefits || []).slice(0, 4).map((b, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-1.5 text-xs text-zinc-300"
                      >
                        <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{b}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800/80 mb-4">
                    <span>Barbeiro Responsável:</span>
                    <span className="font-bold text-zinc-200">
                      {pkg.barberId === 'all' || !pkg.barberId
                        ? 'Todos os Barbeiros da Barbearia'
                        : barber?.name || 'Barbeiro Designado'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block font-semibold">
                      Valor Mensal
                    </span>
                    <span className="text-xl font-black text-amber-400">
                      {formatCurrency(pkg.price)}
                      <span className="text-xs font-normal text-zinc-400">/mês</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditPackage(pkg)}
                      className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl transition-colors"
                      title="Editar Pacote"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            `Deseja realmente remover o pacote "${pkg.name}"?`
                          )
                        ) {
                          deletePackage(pkg.id);
                        }
                      }}
                      className="p-2 bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-xl transition-colors"
                      title="Excluir Pacote"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredPackages.length === 0 && (
            <div className="col-span-full bg-zinc-900 border border-zinc-800 rounded-3xl p-10 text-center">
              <Package className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white">Nenhum pacote encontrado</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                Crie um clube mensal de cortes ou barbas recorrentes para fidelizar seus clientes e garantir receita previsível.
              </p>
              <button
                onClick={handleOpenCreatePackage}
                className="mt-4 px-4 py-2 bg-amber-500 text-black font-bold rounded-xl text-xs uppercase"
              >
                Criar Primeiro Pacote
              </button>
            </div>
          )}
        </div>
      ) : (
        /* PRODUCTS GRID */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map((prod) => {
            const barber = professionals.find((p) => p.id === prod.barberId);
            return (
              <div
                key={prod.id}
                id={`admin-prod-${prod.id}`}
                className="bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 rounded-2xl p-4 shadow-lg flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="relative h-44 rounded-xl overflow-hidden mb-3 border border-zinc-800 bg-zinc-950">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          PRODUCT_IMAGE_PRESETS[0].url;
                      }}
                    />
                    <span
                      className={`absolute top-2.5 right-2.5 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        prod.stock > 5
                          ? 'bg-emerald-500/90 text-black'
                          : prod.stock > 0
                          ? 'bg-amber-500 text-black'
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {prod.stock > 0 ? `${prod.stock} em estoque` : 'Esgotado'}
                    </span>

                    <span className="absolute bottom-2.5 left-2.5 text-[10px] font-semibold bg-black/70 text-zinc-300 px-2 py-0.5 rounded-md backdrop-blur-md">
                      {prod.category}
                    </span>
                  </div>

                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">
                    {prod.brand}
                  </span>
                  <h3 className="font-bold text-sm text-white line-clamp-1 mb-1">
                    {prod.name}
                  </h3>
                  <p className="text-xs text-zinc-400 line-clamp-2 mb-3">
                    {prod.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-zinc-800/80 mb-2">
                    <span>Responsável:</span>
                    <span className="font-semibold text-zinc-200 truncate max-w-[120px]">
                      {prod.barberId === 'all' || !prod.barberId
                        ? 'Salão Geral'
                        : barber?.name || 'Barbeiro'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                  <div>
                    {prod.promotionalPrice ? (
                      <div>
                        <span className="text-[10px] text-zinc-500 line-through mr-1">
                          {formatCurrency(prod.price)}
                        </span>
                        <span className="text-base font-black text-amber-400 block">
                          {formatCurrency(prod.promotionalPrice)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-base font-black text-amber-400 block">
                        {formatCurrency(prod.price)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditProduct(prod)}
                      className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl transition-colors"
                      title="Editar Produto e Estoque"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            `Deseja excluir o produto "${prod.name}" do estoque?`
                          )
                        ) {
                          deleteProduct(prod.id);
                        }
                      }}
                      className="p-2 bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-xl transition-colors"
                      title="Excluir Produto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="col-span-full bg-zinc-900 border border-zinc-800 rounded-3xl p-10 text-center">
              <ShoppingBag className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white">Nenhum produto cadastrado</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                Adicione pomadas modeladoras, óleos para barba, shampoos e géis com fotos para aumentar o faturamento do salão e comissões dos barbeiros.
              </p>
              <button
                onClick={handleOpenCreateProduct}
                className="mt-4 px-4 py-2 bg-amber-500 text-black font-bold rounded-xl text-xs uppercase"
              >
                Cadastrar Primeiro Produto
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CRIAR / EDITAR PACOTE MENSAL                                      */}
      {/* ========================================================================= */}
      {isPackageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative text-zinc-100 my-8">
            <button
              onClick={() => setIsPackageModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white font-display">
                  {editingPackage ? 'Editar Pacote Mensal' : 'Criar Novo Pacote Mensal'}
                </h2>
                <p className="text-xs text-zinc-400">
                  Configure os cortes inclusos, valor mensal e benefícios para o cliente.
                </p>
              </div>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Nome do Pacote / Clube VIP *
                </label>
                <input
                  type="text"
                  required
                  value={pkgName}
                  onChange={(e) => setPkgName(e.target.value)}
                  placeholder="Ex: Clube VIP Cabelo Livre"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Frase de Destaque / Slogan
                </label>
                <input
                  type="text"
                  value={pkgTagline}
                  onChange={(e) => setPkgTagline(e.target.value)}
                  placeholder="Ex: Cortes ilimitados com estilo impecável o mês todo"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Preço Mensal (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={pkgPrice}
                    onChange={(e) => setPkgPrice(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Cortes / Mês
                  </label>
                  <select
                    value={pkgCuts}
                    onChange={(e) => setPkgCuts(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="unlimited">Ilimitado</option>
                    <option value="1">1 corte/mês</option>
                    <option value="2">2 cortes/mês</option>
                    <option value="3">3 cortes/mês</option>
                    <option value="4">4 cortes/mês</option>
                    <option value="0">Nenhum</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Barbas / Mês
                  </label>
                  <select
                    value={pkgBeards}
                    onChange={(e) => setPkgBeards(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="0">Nenhuma</option>
                    <option value="2">2 barbas/mês</option>
                    <option value="4">4 barbas/mês</option>
                    <option value="unlimited">Ilimitada</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Benefícios Inclusos (1 por linha)
                </label>
                <textarea
                  rows={3}
                  value={pkgBenefitsText}
                  onChange={(e) => setPkgBenefitsText(e.target.value)}
                  placeholder="Cortes de cabelo ilimitados no mês&#10;Acabamentos e pezinho semanais inclusos&#10;10% de desconto em pomadas"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Presets de Imagem */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                  <span>Foto do Pacote</span>
                  <span className="text-[10px] text-zinc-500">Selecione uma imagem</span>
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {PACKAGE_IMAGE_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPkgImage(preset.url)}
                      className={`relative h-16 rounded-xl overflow-hidden border-2 transition-all ${
                        pkgImage === preset.url
                          ? 'border-amber-500 scale-95 shadow-md'
                          : 'border-zinc-800 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 items-center mt-2">
                  <input
                    type="url"
                    value={pkgImage}
                    onChange={(e) => setPkgImage(e.target.value)}
                    placeholder="Ou cole a URL da imagem..."
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                  <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap">
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePkgImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Barbeiro Vinculado */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Barbeiro Responsável
                  </label>
                  <select
                    value={pkgBarberId}
                    onChange={(e) => setPkgBarberId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="all">Todos os Barbeiros (Salão)</option>
                    {professionals.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-4 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-300">
                    <input
                      type="checkbox"
                      checked={pkgActive}
                      onChange={(e) => setPkgActive(e.target.checked)}
                      className="rounded border-zinc-700 text-amber-500 focus:ring-amber-500"
                    />
                    <span>Ativo no App</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-300">
                    <input
                      type="checkbox"
                      checked={pkgPopular}
                      onChange={(e) => setPkgPopular(e.target.checked)}
                      className="rounded border-zinc-700 text-amber-500 focus:ring-amber-500"
                    />
                    <span>Mais Vendido</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPackageModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider"
                >
                  {editingPackage ? 'Salvar Alterações' : 'Criar Pacote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CRIAR / EDITAR PRODUTO AVULSO                                      */}
      {/* ========================================================================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative text-zinc-100 my-8">
            <button
              onClick={() => setIsProductModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white font-display">
                  {editingProduct ? 'Editar Produto' : 'Cadastrar Produto no Estoque'}
                </h2>
                <p className="text-xs text-zinc-400">
                  Adicione foto, categoria, preço e controle de estoque de cosméticos.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="Ex: Pomada Matte Clay 120g"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Marca / Linha
                  </label>
                  <input
                    type="text"
                    value={prodBrand}
                    onChange={(e) => setProdBrand(e.target.value)}
                    placeholder="Ex: BarberFlow Pro"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value as ProductCategory)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="pomadas">Pomadas & Ceras</option>
                    <option value="barba">Óleos & Balm</option>
                    <option value="finalizador">Gel & Finalizador</option>
                    <option value="shampoo">Shampoos & Cabelo</option>
                    <option value="acessorios">Pentes & Acessórios</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Preço (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Estoque (unidades)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={prodStock}
                    onChange={(e) => setProdStock(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Descrição & Instruções de Uso
                </label>
                <textarea
                  rows={2}
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                  placeholder="Fixação forte, acabamento fosco seco, fácil remoção com água..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Presets de Imagem de Produtos */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                  <span>Foto do Produto (Alta Qualidade)</span>
                  <span className="text-[10px] text-zinc-500">Selecione uma imagem</span>
                </label>
                <div className="grid grid-cols-6 gap-2 mb-2">
                  {PRODUCT_IMAGE_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setProdImage(preset.url)}
                      className={`relative h-14 rounded-xl overflow-hidden border-2 transition-all ${
                        prodImage === preset.url
                          ? 'border-amber-500 scale-95 shadow-md'
                          : 'border-zinc-800 opacity-70 hover:opacity-100'
                      }`}
                      title={preset.name}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 items-center mt-2">
                  <input
                    type="url"
                    value={prodImage}
                    onChange={(e) => setProdImage(e.target.value)}
                    placeholder="Ou cole a URL da imagem do produto..."
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                  <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap">
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProdImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Barbeiro Vinculado */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Barbeiro Fornecedor / Dono
                  </label>
                  <select
                    value={prodBarberId}
                    onChange={(e) => setProdBarberId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="all">Estoque Geral da Barbearia</option>
                    {professionals.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-4 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-300">
                    <input
                      type="checkbox"
                      checked={prodActive}
                      onChange={(e) => setProdActive(e.target.checked)}
                      className="rounded border-zinc-700 text-amber-500 focus:ring-amber-500"
                    />
                    <span>Disponível para Venda</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-300">
                    <input
                      type="checkbox"
                      checked={prodFeatured}
                      onChange={(e) => setProdFeatured(e.target.checked)}
                      className="rounded border-zinc-700 text-amber-500 focus:ring-amber-500"
                    />
                    <span>Destaque</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider"
                >
                  {editingProduct ? 'Salvar Alterações' : 'Salvar no Estoque'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
