import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateBR } from '../../utils/calendarUtils';
import { Users, Search, Phone, Mail, Calendar, DollarSign, MessageSquare, Edit3, Check } from 'lucide-react';

export const AdminCustomers: React.FC = () => {
  const { customers, appointments, services, updateCustomerNotes } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.phone.toLowerCase().includes(term) ||
      (c.email && c.email.toLowerCase().includes(term))
    );
  });

  const handleSaveNotes = (id: string) => {
    updateCustomerNotes(id, notesValue);
    setEditingNotesId(null);
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || null;
  const customerHistory = selectedCustomer
    ? appointments.filter(
        (a) =>
          a.customerPhone.replace(/\D/g, '') === selectedCustomer.phone.replace(/\D/g, '') ||
          a.customerName.toLowerCase() === selectedCustomer.name.toLowerCase()
      )
    : [];

  return (
    <div id="admin-customers-view" className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-amber-400 text-xs font-bold uppercase tracking-wider block mb-0.5">
            Base de Clientes & CRM
          </span>
          <h1 className="text-2xl font-black font-display text-white">
            Cadastro de Clientes
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Histórico completo de visitas, preferências e total gasto por cliente.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
          <input
            id="admin-search-customers"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou telefone..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Customers Table / Cards */}
        <div className={`${selectedCustomer ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-3`}>
          {filteredCustomers.map((cust) => {
            const isSelected = selectedCustomerId === cust.id;
            return (
              <div
                key={cust.id}
                id={`customer-row-${cust.id}`}
                onClick={() => setSelectedCustomerId(cust.id)}
                className={`cursor-pointer bg-zinc-900 border rounded-2xl p-4 sm:p-5 transition-all shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/5'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <img
                    src={cust.avatar}
                    alt={cust.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-zinc-700"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <span>{cust.name}</span>
                      {cust.totalAppointments >= 5 && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Cliente VIP
                        </span>
                      )}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 text-xs text-zinc-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-zinc-500" />
                        <span>{cust.phone}</span>
                      </span>
                      {cust.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-zinc-500" />
                          <span>{cust.email}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 uppercase block font-semibold">
                      Total Gasto
                    </span>
                    <strong className="text-sm font-black text-amber-400">
                      {formatCurrency(cust.totalSpent)}
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 uppercase block font-semibold">
                      Visitas
                    </span>
                    <span className="text-xs font-bold text-zinc-200">
                      {cust.totalAppointments} atendimentos
                    </span>
                  </div>

                  <a
                    href={`https://wa.me/${cust.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 transition-colors"
                    title="WhatsApp direto"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Customer Detail Drawer */}
        {selectedCustomer && (
          <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-5 shadow-xl h-fit">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <img
                  src={selectedCustomer.avatar}
                  alt={selectedCustomer.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-amber-500"
                />
                <div>
                  <h3 className="font-bold text-base text-white">{selectedCustomer.name}</h3>
                  <span className="text-xs text-zinc-400">
                    Cliente desde {selectedCustomer.joinedAt}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Fechar
              </button>
            </div>

            {/* Notes Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Preferências & Observações
                </span>
                {editingNotesId !== selectedCustomer.id && (
                  <button
                    onClick={() => {
                      setEditingNotesId(selectedCustomer.id);
                      setNotesValue(selectedCustomer.notes || '');
                    }}
                    className="text-xs text-zinc-400 hover:text-amber-400 flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Editar</span>
                  </button>
                )}
              </div>

              {editingNotesId === selectedCustomer.id ? (
                <div className="space-y-2">
                  <textarea
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    rows={3}
                    placeholder="Adicione preferências do cliente..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingNotesId(null)}
                      className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded-lg text-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleSaveNotes(selectedCustomer.id)}
                      className="px-3 py-1 bg-amber-500 text-black font-bold rounded-lg text-xs flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>Salvar</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80 text-xs text-zinc-300">
                  {selectedCustomer.notes || 'Nenhuma observação registrada ainda.'}
                </div>
              )}
            </div>

            {/* History List */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Histórico de Atendimentos ({customerHistory.length})
              </h4>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                {customerHistory.map((appt) => {
                  const s = services.find((srv) => srv.id === appt.serviceId);
                  return (
                    <div
                      key={appt.id}
                      className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl text-xs flex items-center justify-between"
                    >
                      <div>
                        <strong className="text-zinc-200 block">{s?.name || 'Serviço'}</strong>
                        <span className="text-zinc-500">
                          {formatDateBR(appt.date)} às {appt.time}
                        </span>
                      </div>
                      <span className="text-amber-400 font-bold">
                        {formatCurrency(appt.price)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
