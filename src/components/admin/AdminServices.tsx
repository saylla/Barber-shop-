import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Service, ServiceCategory } from '../../types';
import { formatCurrency } from '../../utils/calendarUtils';
import { Plus, Edit2, Trash2, Clock, Check, X, Scissors, Image as ImageIcon } from 'lucide-react';

export const AdminServices: React.FC = () => {
  const { services, createService, updateService, deleteService } = useApp();

  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [price, setPrice] = useState(45);
  const [category, setCategory] = useState<ServiceCategory>('corte');
  const [image, setImage] = useState('');
  const [active, setActive] = useState(true);

  const openCreateModal = () => {
    setName('');
    setDescription('');
    setDurationMinutes(35);
    setPrice(50);
    setCategory('corte');
    setImage('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80');
    setActive(true);
    setEditingService(null);
    setIsCreating(true);
  };

  const openEditModal = (s: Service) => {
    setEditingService(s);
    setName(s.name);
    setDescription(s.description);
    setDurationMinutes(s.durationMinutes);
    setPrice(s.price);
    setCategory(s.category);
    setImage(s.image);
    setActive(s.active);
    setIsCreating(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingService) {
      updateService({
        ...editingService,
        name: name.trim(),
        description: description.trim(),
        durationMinutes: Number(durationMinutes),
        price: Number(price),
        category,
        image: image.trim() || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
        active,
      });
      setEditingService(null);
    } else {
      createService({
        name: name.trim(),
        description: description.trim(),
        durationMinutes: Number(durationMinutes),
        price: Number(price),
        category,
        image: image.trim() || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
        active,
      });
      setIsCreating(false);
    }
  };

  return (
    <div id="admin-services-view" className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-amber-400 text-xs font-bold uppercase tracking-wider block mb-0.5">
            Catálogo & Preços
          </span>
          <h1 className="text-2xl font-black font-display text-white">
            Gerenciamento de Serviços
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Cadastre novos serviços, altere valores em R$ e ajuste o tempo de duração.
          </p>
        </div>

        <button
          id="admin-add-service-btn"
          onClick={openCreateModal}
          className="py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Serviço</span>
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {services.map((service) => (
          <div
            key={service.id}
            id={`admin-service-${service.id}`}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="relative h-40 rounded-xl overflow-hidden mb-3 border border-zinc-800">
                <img
                  src={service.image}
                  alt={service.name}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80';
                  }}
                  className="w-full h-full object-cover"
                />
                <span
                  className={`absolute top-2.5 right-2.5 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    service.active
                      ? 'bg-emerald-500/90 text-black'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}
                >
                  {service.active ? 'Ativo no App' : 'Desativado'}
                </span>
              </div>

              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-base text-white">{service.name}</h3>
                <span className="text-xs text-zinc-400 uppercase font-semibold">
                  {service.category}
                </span>
              </div>

              <p className="text-xs text-zinc-400 line-clamp-2 mt-1">
                {service.description}
              </p>

              <div className="flex items-center gap-2 text-xs text-zinc-300 mt-3 pt-3 border-t border-zinc-800">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Duração: <strong>{service.durationMinutes} minutos</strong></span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-lg font-black text-amber-400">
                {formatCurrency(service.price)}
              </span>

              <div className="flex items-center gap-2">
                <button
                  id={`edit-service-${service.id}`}
                  onClick={() => openEditModal(service)}
                  className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                  title="Editar Serviço"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {deletingServiceId === service.id ? (
                  <div className="flex items-center gap-1 bg-red-950/80 p-1 rounded-lg border border-red-800">
                    <button
                      type="button"
                      id={`confirm-delete-service-${service.id}`}
                      onClick={() => {
                        deleteService(service.id);
                        setDeletingServiceId(null);
                      }}
                      className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold"
                    >
                      Excluir
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingServiceId(null)}
                      className="px-1.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px]"
                    >
                      X
                    </button>
                  </div>
                ) : (
                  <button
                    id={`delete-service-${service.id}`}
                    onClick={() => setDeletingServiceId(service.id)}
                    className="p-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/30 transition-colors"
                    title="Excluir Serviço"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Create Modal */}
      {(isCreating || editingService) && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-zinc-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
              <h3 className="text-lg font-bold font-display text-white">
                {isCreating ? 'Novo Serviço' : `Editar: ${editingService?.name}`}
              </h3>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingService(null);
                }}
                className="p-1.5 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Nome do Serviço *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Corte Degradê Navalhado"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Descrição detalhada
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explique o que inclui o serviço..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Preço (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Duração (minutos) *
                  </label>
                  <input
                    type="number"
                    step="5"
                    min="5"
                    max="300"
                    required
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="corte">Corte</option>
                    <option value="barba">Barba</option>
                    <option value="combo">Combo</option>
                    <option value="coloracao">Coloração / Platinado</option>
                    <option value="tratamento">Tratamento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Status de Disponibilidade
                  </label>
                  <select
                    value={active ? 'true' : 'false'}
                    onChange={(e) => setActive(e.target.value === 'true')}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="true">Ativo (Disponível para agendar)</option>
                    <option value="false">Desativado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  URL da Imagem / Foto
                </label>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-4 border-t border-zinc-800 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingService(null);
                  }}
                  className="flex-1 py-3 bg-zinc-900 text-zinc-300 rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl text-xs uppercase tracking-wider"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
