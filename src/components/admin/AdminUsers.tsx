import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserAccount, UserRole } from '../../types';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  KeyRound,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  Mail,
  UserCheck,
  Search,
  Lock,
  RefreshCw,
  AlertTriangle,
  Scissors,
  Check,
  X,
} from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const {
    systemUsers,
    professionals,
    createSystemUser,
    updateSystemUser,
    revokeSystemUserAccess,
    restoreSystemUserAccess,
    resetSystemUserPassword,
    deleteSystemUser,
    currentUser,
    showToast,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserAccount | null>(null);
  const [newTempPassword, setNewTempPassword] = useState('1234');
  const [revokeModalUser, setRevokeModalUser] = useState<UserAccount | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  // Form State for Create / Edit
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    professionalId: string;
    password: string;
    mustChangePassword: boolean;
  }>({
    name: '',
    email: '',
    phone: '',
    role: 'barber',
    professionalId: professionals[0]?.id || '',
    password: '1234',
    mustChangePassword: true,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'barber',
      professionalId: professionals[0]?.id || '',
      password: '1234',
      mustChangePassword: true,
    });
    setEditingUser(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (user: UserAccount) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      professionalId: user.professionalId || (professionals[0]?.id || ''),
      password: user.password || '1234',
      mustChangePassword: !!user.mustChangePassword,
    });
    setIsCreateModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      showToast('Preencha todos os campos obrigatórios (Nome, E-mail e Telefone).', 'error');
      return;
    }

    if (editingUser) {
      updateSystemUser({
        ...editingUser,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        professionalId: formData.role === 'barber' ? formData.professionalId : undefined,
        mustChangePassword: formData.mustChangePassword,
        password: formData.password || editingUser.password,
      });
      showToast(`Cadastro de ${formData.name} atualizado com sucesso!`, 'success');
    } else {
      createSystemUser({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        professionalId: formData.role === 'barber' ? formData.professionalId : undefined,
        password: formData.password || '1234',
        mustChangePassword: formData.mustChangePassword,
        avatar: formData.role === 'barber'
          ? (professionals.find((p) => p.id === formData.professionalId)?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80')
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        active: true,
        provider: 'direct',
      });
      showToast(`Novo acesso para ${formData.name} criado com sucesso!`, 'success');
    }

    setIsCreateModalOpen(false);
    resetForm();
  };

  const handleConfirmRevoke = () => {
    if (!revokeModalUser) return;
    revokeSystemUserAccess(revokeModalUser.id, revokeReason || 'Acesso revogado pelo Administrador de TI');
    setRevokeModalUser(null);
    setRevokeReason('');
  };

  const handleConfirmResetPassword = () => {
    if (!resetPasswordUser) return;
    resetSystemUserPassword(resetPasswordUser.id, newTempPassword);
    setResetPasswordUser(null);
    setNewTempPassword('1234');
  };

  const filteredUsers = systemUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone && user.phone.includes(searchTerm));

    const matchesRole =
      roleFilter === 'all'
        ? true
        : roleFilter === 'active'
        ? user.active
        : roleFilter === 'revoked'
        ? !user.active
        : user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div id="admin-users-page" className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 shadow-inner">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-white">
              Gestão de Acessos & Painéis Individuais (TI)
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-xl">
              Cadastre logins individuais para cada cabeleireiro, controle permissões, exija troca de senha no primeiro acesso e revogue acessos instantaneamente quando necessário.
            </p>
          </div>
        </div>

        <button
          id="add-new-user-btn"
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Novo Acesso</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800/80">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, e-mail ou telefone..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-500 w-full sm:w-auto"
          >
            <option value="all">Todos os Usuários ({systemUsers.length})</option>
            <option value="super_admin">Super Admins / TI</option>
            <option value="barber">Barbeiros / Profissionais</option>
            <option value="active">Somente Ativos</option>
            <option value="revoked">Acessos Revogados</option>
          </select>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => {
          const linkedProf = professionals.find((p) => p.id === user.professionalId);
          const isCurrentLoggedIn = currentUser?.id === user.id || currentUser?.email === user.email;

          return (
            <div
              key={user.id}
              className={`bg-zinc-900 border rounded-3xl p-5 shadow-lg transition-all flex flex-col justify-between ${
                !user.active
                  ? 'border-red-900/50 bg-red-950/10 opacity-80'
                  : user.role === 'super_admin'
                  ? 'border-amber-500/40 bg-gradient-to-b from-amber-500/5 to-zinc-900'
                  : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="space-y-4">
                {/* Top User Info */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                      alt={user.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-zinc-700 shadow-md"
                    />
                    <div>
                      <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                        <span>{user.name}</span>
                        {isCurrentLoggedIn && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded font-normal">
                            Você
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {user.role === 'super_admin' ? (
                          <span className="px-2 py-0.5 bg-amber-500 text-black text-[10px] font-black rounded-md flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            <span>SUPER ADMIN (TI)</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-zinc-800 text-amber-400 border border-zinc-700 text-[10px] font-bold rounded-md flex items-center gap-1">
                            <Scissors className="w-3 h-3" />
                            <span>BARBEIRO</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {user.active ? (
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Ativo</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-bold rounded-full flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        <span>Revogado</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Details List */}
                <div className="bg-zinc-950/80 p-3.5 rounded-2xl border border-zinc-800/80 space-y-2 text-xs text-zinc-300">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                    <span className="truncate text-zinc-200">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                    <span className="text-zinc-200">{user.phone || 'Telefone não informado'}</span>
                  </div>
                  {linkedProf && (
                    <div className="flex items-center gap-2 text-amber-300/90 text-[11px] pt-1 border-t border-zinc-800">
                      <Scissors className="w-3 h-3 flex-shrink-0 text-amber-400" />
                      <span>Vinculado à agenda de: <strong>{linkedProf.name}</strong></span>
                    </div>
                  )}

                  {/* Password Change Flag Notice */}
                  {user.mustChangePassword && (
                    <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
                      <span>Troca de senha obrigatória no 1º login</span>
                    </div>
                  )}

                  {/* Revoke reason if inactive */}
                  {!user.active && user.revokedReason && (
                    <div className="p-2 bg-red-950/40 border border-red-900/50 rounded-xl text-[11px] text-red-300">
                      <strong>Motivo do bloqueio:</strong> {user.revokedReason}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Toolbar */}
              <div className="pt-4 border-t border-zinc-800/80 mt-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(user)}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl border border-zinc-700 transition-colors"
                    title="Editar Cadastro"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setResetPasswordUser(user)}
                    className="p-2 bg-zinc-800 hover:bg-amber-500 hover:text-black text-zinc-300 rounded-xl border border-zinc-700 transition-colors"
                    title="Redefinir Senha Provisória"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                  </button>

                  {user.role !== 'super_admin' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Deseja excluir permanentemente o cadastro de ${user.name}?`)) {
                          deleteSystemUser(user.id);
                        }
                      }}
                      className="p-2 bg-zinc-800 hover:bg-red-950/70 hover:text-red-300 text-zinc-400 rounded-xl border border-zinc-700 transition-colors"
                      title="Excluir Usuário"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Revoke / Restore Button */}
                {user.role !== 'super_admin' && (
                  <div>
                    {user.active ? (
                      <button
                        type="button"
                        onClick={() => setRevokeModalUser(user)}
                        className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Revogar Acesso</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => restoreSystemUserAccess(user.id)}
                        className="px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/50 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Restaurar Acesso</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Create / Edit User */}
      {isCreateModalOpen && (
        <div
          id="user-form-modal-overlay"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            id="user-form-card"
            className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-zinc-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 gold-gradient" />

            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <h2 className="text-xl font-bold font-display text-white">
                {editingUser ? 'Atualizar Cadastro de Usuário' : 'Novo Acesso de Funcionário / TI'}
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Defina o perfil de acesso e credenciais de segurança.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Carlos Eduardo Barbeiro"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  E-mail de Login *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="carlos@barberflow.com.br"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Telefone / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 98765-4321"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Nível de Permissão (Cargo)
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="barber">Barbeiro / Cabeleireiro (Painel Individual)</option>
                  <option value="super_admin">Administrador TI / Dono (Acesso Completo)</option>
                </select>
              </div>

              {formData.role === 'barber' && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Vincular à Agenda do Profissional
                  </label>
                  <select
                    value={formData.professionalId}
                    onChange={(e) => setFormData({ ...formData, professionalId: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  >
                    {professionals.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.specialty})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  {editingUser ? 'Alterar Senha (opcional)' : 'Senha Provisória Inicial *'}
                </label>
                <input
                  type="text"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Ex: 1234"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              {/* Must Change Password Checkbox */}
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-start gap-2.5 text-xs">
                <input
                  id="must-change-password-cb"
                  type="checkbox"
                  checked={formData.mustChangePassword}
                  onChange={(e) => setFormData({ ...formData, mustChangePassword: e.target.checked })}
                  className="w-4 h-4 mt-0.5 rounded bg-zinc-900 border-zinc-700 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="must-change-password-cb" className="cursor-pointer text-zinc-300">
                  <strong className="text-white block">Exigir troca de senha no primeiro login</strong>
                  <span>O usuário será forçado a cadastrar uma nova senha pessoal antes de acessar a agenda.</span>
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl text-xs transition-all shadow-md"
                >
                  {editingUser ? 'Salvar Alterações' : 'Criar Acesso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reset Password */}
      {resetPasswordUser && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setResetPasswordUser(null)}
        >
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-zinc-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Redefinir Senha</h3>
                <p className="text-xs text-zinc-400">Usuário: {resetPasswordUser.name}</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Nova Senha Provisória:
                </label>
                <input
                  type="text"
                  value={newTempPassword}
                  onChange={(e) => setNewTempPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-[11px]">
                A flag de <strong>Troca Obrigatória de Senha</strong> será ativada automaticamente para este usuário.
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setResetPasswordUser(null)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmResetPassword}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl"
                >
                  Confirmar Redefinição
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Revoke Access */}
      {revokeModalUser && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setRevokeModalUser(null)}
        >
          <div
            className="bg-zinc-900 border border-red-900/60 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-zinc-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-red-500/10 text-red-400 rounded-xl">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Revogar Acesso do Funcionário</h3>
                <p className="text-xs text-zinc-400">Usuário: {revokeModalUser.name}</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-zinc-300">
                Ao revogar o acesso, o usuário será desconectado e não conseguirá mais efetuar login no painel até que o TI restaure a permissão.
              </p>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Motivo da revogação (opcional):
                </label>
                <input
                  type="text"
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="Ex: Desligamento da equipe / Férias"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRevokeModalUser(null)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRevoke}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl"
                >
                  Revogar Imediatamente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
