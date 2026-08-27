import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ShopSettings, EmailDiagnostics } from '../../types';
import {
  sendTestSmtpEmail,
  fetchEmailDiagnostics,
  clearEmailLogs,
} from '../../utils/emailService';
import {
  Save,
  RotateCcw,
  Building2,
  Phone,
  Instagram,
  MapPin,
  Image as ImageIcon,
  Shield,
  Bell,
  Volume2,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Zap,
  Mail,
  Send,
  Loader2,
  RefreshCw,
  Trash2,
  Key,
  Server,
  FileText,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetToDemoData,
    showToast,
    pushPermissionStatus,
    isPushSupported,
    requestPushPermission,
    sendTestPushNotification,
  } = useApp();

  const [formData, setFormData] = useState<ShopSettings>(settings);
  const [selectedProvider, setSelectedProvider] = useState<'resend' | 'sendgrid' | 'gmail' | 'custom'>(
    (formData.smtpConfig?.provider as any) || 'resend'
  );
  const [isTestingPush, setIsTestingPush] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState(settings.shopEmail || 'MatheusBriza84@gmail.com');
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [emailTestStatus, setEmailTestStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  // Diagnostics & Logs State
  const [diagnostics, setDiagnostics] = useState<EmailDiagnostics | null>(null);
  const [isLoadingDiagnostics, setIsLoadingDiagnostics] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const loadDiagnostics = async () => {
    setIsLoadingDiagnostics(true);
    try {
      const data = await fetchEmailDiagnostics();
      setDiagnostics(data);
    } catch {
      // ignore
    } finally {
      setIsLoadingDiagnostics(false);
    }
  };

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const handleClearLogs = async () => {
    if (window.confirm('Deseja limpar todos os registros de envio de e-mail?')) {
      const ok = await clearEmailLogs();
      if (ok) {
        showToast('Logs de e-mail limpos com sucesso.', 'success');
        loadDiagnostics();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    showToast('Configurações salvas com sucesso!', 'success');
  };

  const handleTestEmail = async () => {
    if (!testEmailRecipient || !testEmailRecipient.includes('@')) {
      showToast('Digite um endereço de e-mail válido para o teste.', 'error');
      return;
    }

    setIsTestingEmail(true);
    setEmailTestStatus(null);
    try {
      const res = await sendTestSmtpEmail(
        testEmailRecipient,
        formData.smtpConfig,
        formData.name || 'BarberFlow'
      );

      if (res.success) {
        setEmailTestStatus({
          success: true,
          message: `E-mail de teste enviado com sucesso para ${testEmailRecipient}! Verifique sua caixa de entrada e spam.`,
        });
        showToast('E-mail de teste disparado com sucesso!', 'success');
      } else {
        setEmailTestStatus({
          success: false,
          message: res.message || 'Falha ao autenticar no servidor SMTP.',
        });
        showToast(`Erro ao testar envio: ${res.message}`, 'error');
      }
    } catch (err: any) {
      const errTxt = err?.message || 'Erro inesperado ao conectar ao SMTP.';
      setEmailTestStatus({
        success: false,
        message: errTxt,
      });
      showToast(`Erro: ${errTxt}`, 'error');
    } finally {
      setIsTestingEmail(false);
    }
  };

  const handleTestNotification = async () => {
    setIsTestingPush(true);
    try {
      await sendTestPushNotification();
    } finally {
      setIsTestingPush(false);
    }
  };

  const handleRequestPermission = async () => {
    await requestPushPermission();
  };

  return (
    <div id="admin-settings-view" className="space-y-8">
      {/* Top Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-amber-400 text-xs font-bold uppercase tracking-wider block mb-0.5">
            Identidade & Canais
          </span>
          <h1 className="text-2xl font-black font-display text-white">
            Configurações da Barbearia
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Altere os dados de contato, redes sociais, endereço e capa visual exibidos aos clientes.
          </p>
        </div>

        <button
          id="save-shop-settings-btn"
          onClick={handleSubmit}
          className="py-3 px-6 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-md self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>Salvar Alterações</span>
        </button>
      </div>

      {/* Push Notifications & Service Worker Section */}
      <div className="bg-zinc-900 border border-amber-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden space-y-6">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">
                  Notificações Push em Tempo Real (Service Worker)
                </h3>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                  Segundo Plano
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                Receba alertas nativos no navegador sobre novos agendamentos e alterações de status instantaneamente, mesmo com o painel fechado ou em outra aba.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status indicator & Actions */}
            {pushPermissionStatus === 'granted' ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Alertas & Push Ativos</span>
              </div>
            ) : pushPermissionStatus === 'denied' ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="revalidate-push-permission-btn"
                  onClick={handleRequestPermission}
                  className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Revalidar Permissão</span>
                </button>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 rounded-xl text-xs font-bold">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sons & Sistema Ativos</span>
                </div>
              </div>
            ) : (
              <button
                type="button"
                id="enable-push-notifications-btn"
                onClick={handleRequestPermission}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-md"
              >
                <Zap className="w-3.5 h-3.5 fill-black" />
                <span>Ativar Notificações</span>
              </button>
            )}

            <button
              type="button"
              id="test-push-notification-btn"
              disabled={isTestingPush}
              onClick={handleTestNotification}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl transition-colors border border-zinc-700 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{isTestingPush ? 'Disparando...' : 'Testar Alerta'}</span>
            </button>
          </div>
        </div>

        {/* Status description alert if blocked */}
        {pushPermissionStatus === 'denied' && (
          <div className="p-3.5 bg-zinc-950/80 border border-amber-500/30 rounded-2xl flex items-start gap-3 text-xs text-zinc-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-white flex items-center gap-2">
                <span>Alertas sonoros, vibração e notificações no sistema estão funcionando!</span>
              </p>
              <p className="text-zinc-400">
                Se as notificações nativas do sistema operacional estiverem restritas pela janela de visualização do navegador, você continuará recebendo o sino sonoro (chime), vibração e avisos flutuantes em tempo real. Clique em <strong>&quot;Revalidar Permissão&quot;</strong> ou <strong>&quot;Testar Alerta&quot;</strong> para confirmar o funcionamento.
              </p>
            </div>
          </div>
        )}

        {/* Toggles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <label className="flex items-center justify-between p-4 bg-zinc-950/70 border border-zinc-800/80 rounded-2xl cursor-pointer hover:border-zinc-700 transition-colors">
            <div className="space-y-0.5 pr-2">
              <span className="text-xs font-bold text-white block">
                Notificar Novos Agendamentos
              </span>
              <span className="text-[11px] text-zinc-400 block">
                Dispara alerta quando um cliente agenda online
              </span>
            </div>
            <input
              type="checkbox"
              checked={formData.notifyNewBookings !== false}
              onChange={(e) =>
                setFormData({ ...formData, notifyNewBookings: e.target.checked })
              }
              className="w-4 h-4 text-amber-500 rounded bg-zinc-900 border-zinc-700 focus:ring-amber-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-zinc-950/70 border border-zinc-800/80 rounded-2xl cursor-pointer hover:border-zinc-700 transition-colors">
            <div className="space-y-0.5 pr-2">
              <span className="text-xs font-bold text-white block">
                Alterações & Reagendamentos
              </span>
              <span className="text-[11px] text-zinc-400 block">
                Avisos de cortes cancelados ou horários alterados
              </span>
            </div>
            <input
              type="checkbox"
              checked={formData.notifyStatusChanges !== false}
              onChange={(e) =>
                setFormData({ ...formData, notifyStatusChanges: e.target.checked })
              }
              className="w-4 h-4 text-amber-500 rounded bg-zinc-900 border-zinc-700 focus:ring-amber-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-zinc-950/70 border border-zinc-800/80 rounded-2xl cursor-pointer hover:border-zinc-700 transition-colors">
            <div className="space-y-0.5 pr-2 flex items-start gap-2">
              <Volume2 className="w-4 h-4 text-amber-400 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-white block">
                  Alerta Sonoro (Chime)
                </span>
                <span className="text-[11px] text-zinc-400 block">
                  Tocar sino suave ao receber novos cortes
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.playNotificationSound !== false}
              onChange={(e) =>
                setFormData({ ...formData, playNotificationSound: e.target.checked })
              }
              className="w-4 h-4 text-amber-500 rounded bg-zinc-900 border-zinc-700 focus:ring-amber-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-zinc-950/70 border border-zinc-800/80 rounded-2xl cursor-pointer hover:border-zinc-700 transition-colors">
            <div className="space-y-0.5 pr-2 flex items-start gap-2">
              <Smartphone className="w-4 h-4 text-amber-400 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-white block">
                  Vibração em Dispositivos
                </span>
                <span className="text-[11px] text-zinc-400 block">
                  Vibrar celular ao receber novo cliente
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.vibrationEnabled !== false}
              onChange={(e) =>
                setFormData({ ...formData, vibrationEnabled: e.target.checked })
              }
              className="w-4 h-4 text-amber-500 rounded bg-zinc-900 border-zinc-700 focus:ring-amber-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-zinc-950/70 border border-zinc-800/80 rounded-2xl cursor-pointer hover:border-zinc-700 transition-colors">
            <div className="space-y-0.5 pr-2">
              <span className="text-xs font-bold text-white block">
                Envio de E-mail Automático
              </span>
              <span className="text-[11px] text-zinc-400 block">
                Enviar voucher e resumo ao e-mail do cliente
              </span>
            </div>
            <input
              type="checkbox"
              checked={formData.sendEmailOnBooking !== false}
              onChange={(e) =>
                setFormData({ ...formData, sendEmailOnBooking: e.target.checked })
              }
              className="w-4 h-4 text-amber-500 rounded bg-zinc-900 border-zinc-700 focus:ring-amber-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-zinc-950/70 border border-zinc-800/80 rounded-2xl cursor-pointer hover:border-zinc-700 transition-colors">
            <div className="space-y-0.5 pr-2">
              <span className="text-xs font-bold text-white block">
                Aprovação Instantânea
              </span>
              <span className="text-[11px] text-zinc-400 block">
                Confirmar agendamentos automaticamente
              </span>
            </div>
            <input
              type="checkbox"
              checked={formData.autoConfirm}
              onChange={(e) =>
                setFormData({ ...formData, autoConfirm: e.target.checked })
              }
              className="w-4 h-4 text-amber-500 rounded bg-zinc-900 border-zinc-700 focus:ring-amber-500"
            />
          </label>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Transactional Email & SMTP Configuration */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-md space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
                  <Mail className="w-4 h-4" />
                </div>
                <span>E-mail Transacional & Disparo de Vouchers</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Envio automático de confirmações, vouchers e reagendamentos diretamente para o e-mail do cliente.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadDiagnostics}
                disabled={isLoadingDiagnostics}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                title="Atualizar diagnóstico em tempo real"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDiagnostics ? 'animate-spin' : ''}`} />
                <span>Status da Conexão</span>
              </button>
            </div>
          </div>

          {/* Active Backend Status Banner */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${diagnostics?.hasConfiguredSmtp ? 'bg-emerald-500 shadow-lg shadow-emerald-500/40 animate-pulse' : 'bg-amber-500'}`} />
              <div>
                <div className="text-zinc-400 text-[11px]">Provedor Ativo no Servidor:</div>
                <div className="text-white font-bold text-sm flex items-center gap-2">
                  <span>{diagnostics?.configuredProvider || 'Carregando status...'}</span>
                  {diagnostics?.hasConfiguredSmtp && (
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[10px] font-bold">
                      Online & Pronto
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-zinc-400 text-xs">
              <div>
                <span>Total de Disparos: </span>
                <strong className="text-white font-mono">{diagnostics?.totalEmailsSent ?? 0}</strong>
              </div>
              <button
                type="button"
                onClick={() => setShowLogs(!showLogs)}
                className="text-amber-400 hover:text-amber-300 font-semibold underline flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{showLogs ? 'Ocultar Logs' : 'Ver Logs de Envio'}</span>
              </button>
            </div>
          </div>

          {/* Provider Selection Tabs */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-2">
              Selecione o Método de Envio:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedProvider('resend');
                  setFormData({
                    ...formData,
                    smtpConfig: {
                      ...formData.smtpConfig,
                      provider: 'resend',
                      host: '',
                    },
                  });
                }}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  selectedProvider === 'resend'
                    ? 'bg-amber-500/10 border-amber-500/60 text-white shadow-md'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-white">Resend API</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded font-bold">
                    Recomendado
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 leading-tight">
                  Via API HTTP. Entrega 100% garantida na caixa.
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedProvider('sendgrid');
                  setFormData({
                    ...formData,
                    smtpConfig: {
                      ...formData.smtpConfig,
                      provider: 'sendgrid',
                      host: '',
                    },
                  });
                }}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  selectedProvider === 'sendgrid'
                    ? 'bg-amber-500/10 border-amber-500/60 text-white shadow-md'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-white">SendGrid</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded">
                    API REST
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 leading-tight">
                  Chave SG.... com entrega transacional em massa.
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedProvider('gmail');
                  setFormData({
                    ...formData,
                    smtpConfig: {
                      ...formData.smtpConfig,
                      provider: 'gmail',
                      host: 'smtp.gmail.com',
                      port: 465,
                    },
                  });
                }}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  selectedProvider === 'gmail'
                    ? 'bg-amber-500/10 border-amber-500/60 text-white shadow-md'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-white">Gmail</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded">
                    SMTP 465 SSL
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 leading-tight">
                  Usa sua conta Google com Senha de Aplicativo.
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedProvider('custom');
                  setFormData({
                    ...formData,
                    smtpConfig: {
                      ...formData.smtpConfig,
                      provider: 'custom',
                    },
                  });
                }}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  selectedProvider === 'custom'
                    ? 'bg-amber-500/10 border-amber-500/60 text-white shadow-md'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-white">Outro SMTP</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded">
                    Personalizado
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 leading-tight">
                  Hostinger, Outlook, AWS SES, cPanel, Locaweb.
                </span>
              </button>
            </div>
          </div>

          {/* Provider Specific Configuration Box */}
          {selectedProvider === 'resend' && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Configuração Resend API</span>
                </span>
                <a
                  href="https://resend.com/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                >
                  <span>Criar chave grátis no Resend</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Chave de API do Resend (ex: <code className="text-amber-300">re_123456789...</code>)
                </label>
                <input
                  type="password"
                  placeholder="re_..."
                  value={formData.smtpConfig?.apiKey || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      smtpConfig: {
                        ...formData.smtpConfig,
                        provider: 'resend',
                        apiKey: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-zinc-900 border border-zinc-700/70 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Também pode ser configurada no arquivo <code className="text-zinc-400 font-mono">.env</code> como <code className="text-zinc-400 font-mono">RESEND_API_KEY</code>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  E-mail Remetente (Opcional)
                </label>
                <input
                  type="text"
                  placeholder='BarberFlow <onboarding@resend.dev> ou seu domínio verificado'
                  value={formData.smtpConfig?.from || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      smtpConfig: { ...formData.smtpConfig, from: e.target.value },
                    })
                  }
                  className="w-full bg-zinc-900 border border-zinc-700/70 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          {selectedProvider === 'sendgrid' && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Configuração SendGrid API</span>
                </span>
                <a
                  href="https://app.sendgrid.com/settings/api_keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                >
                  <span>Painel do SendGrid</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Chave de API SendGrid (ex: <code className="text-amber-300">SG.xxxxxxxx...</code>)
                </label>
                <input
                  type="password"
                  placeholder="SG...."
                  value={formData.smtpConfig?.apiKey || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      smtpConfig: {
                        ...formData.smtpConfig,
                        provider: 'sendgrid',
                        apiKey: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-zinc-900 border border-zinc-700/70 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>
          )}

          {selectedProvider === 'gmail' && (
            <div className="space-y-3">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-200/90 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <Sparkles className="w-4 h-4" />
                  <span>Como gerar a Senha de Aplicativo no Google:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-zinc-300 pl-1 leading-relaxed">
                  <li>Ative a <strong>Verificação em 2 Etapas</strong> na sua Conta Google.</li>
                  <li>Acesse <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-amber-300 underline font-mono">myaccount.google.com/apppasswords</a> e crie uma senha com o nome <strong>BarberFlow</strong>.</li>
                  <li>Copie a senha de 16 caracteres gerada e cole no campo <strong>Senha de App</strong> abaixo.</li>
                </ol>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Seu E-mail Gmail
                  </label>
                  <input
                    type="email"
                    placeholder="sua-barbearia@gmail.com"
                    value={formData.smtpConfig?.user || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        smtpConfig: {
                          ...formData.smtpConfig,
                          provider: 'gmail',
                          host: 'smtp.gmail.com',
                          port: 465,
                          user: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Senha de App Google (16 letras)
                  </label>
                  <input
                    type="password"
                    placeholder="xxxx xxxx xxxx xxxx"
                    value={formData.smtpConfig?.pass || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        smtpConfig: {
                          ...formData.smtpConfig,
                          provider: 'gmail',
                          host: 'smtp.gmail.com',
                          port: 465,
                          pass: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {selectedProvider === 'custom' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Servidor SMTP (Host)
                  </label>
                  <input
                    type="text"
                    placeholder="ex: smtp.hostinger.com / mail.seudominio.com"
                    value={formData.smtpConfig?.host || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        smtpConfig: {
                          ...formData.smtpConfig,
                          provider: 'custom',
                          host: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Porta SMTP
                  </label>
                  <input
                    type="number"
                    placeholder="587 ou 465"
                    value={formData.smtpConfig?.port || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        smtpConfig: {
                          ...formData.smtpConfig,
                          provider: 'custom',
                          port: Number(e.target.value) || undefined,
                        },
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Usuário SMTP
                  </label>
                  <input
                    type="text"
                    placeholder="contato@seudominio.com"
                    value={formData.smtpConfig?.user || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        smtpConfig: {
                          ...formData.smtpConfig,
                          provider: 'custom',
                          user: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Senha SMTP
                  </label>
                  <input
                    type="password"
                    placeholder="Sua senha do provedor..."
                    value={formData.smtpConfig?.pass || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        smtpConfig: {
                          ...formData.smtpConfig,
                          provider: 'custom',
                          pass: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Test Dispatch Bar */}
          <div className="pt-3 border-t border-zinc-800 space-y-3">
            <span className="text-xs text-zinc-400 font-medium block">
              Validar Entrega em Tempo Real:
            </span>

            <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="Seu e-mail para receber o teste..."
                  value={testEmailRecipient}
                  onChange={(e) => setTestEmailRecipient(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700/60 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>
              <button
                type="button"
                id="btn-test-smtp-email"
                disabled={isTestingEmail}
                onClick={async () => {
                  await handleTestEmail();
                  loadDiagnostics();
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isTestingEmail ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Disparando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Disparar E-mail de Teste</span>
                  </>
                )}
              </button>
            </div>

            {/* Test Feedback Status */}
            {emailTestStatus && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  emailTestStatus.success
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                    : 'bg-red-950/40 border-red-800/60 text-red-200'
                }`}
              >
                {emailTestStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">
                    {emailTestStatus.success ? 'E-mail Disparado com Sucesso!' : 'Atenção ao Diagnóstico:'}
                  </p>
                  <p className="opacity-90 mt-0.5">{emailTestStatus.message}</p>
                </div>
              </div>
            )}

            {/* Diagnostic Logs Viewer */}
            {showLogs && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 mt-3 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-xs text-white">Histórico de Disparos Recentes ({diagnostics?.logs.length || 0})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={loadDiagnostics}
                      className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Atualizar</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClearLogs}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 ml-2"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Limpar Logs</span>
                    </button>
                  </div>
                </div>

                {!diagnostics?.logs || diagnostics.logs.length === 0 ? (
                  <div className="text-center py-6 text-zinc-500 text-xs">
                    Nenhum e-mail foi disparado ainda. Faça um teste ou agendamento para ver os logs aqui.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {diagnostics.logs.map((log) => (
                      <div
                        key={log.id}
                        className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                          log.status === 'delivered' || log.status === 'sent'
                            ? 'bg-emerald-950/20 border-emerald-900/40'
                            : log.status === 'error'
                            ? 'bg-red-950/20 border-red-900/40'
                            : 'bg-zinc-900 border-zinc-800'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                log.status === 'delivered' || log.status === 'sent'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : log.status === 'error'
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}
                            >
                              {log.status === 'delivered'
                                ? 'Entregue'
                                : log.status === 'error'
                                ? 'Falha'
                                : 'Simulado'}
                            </span>
                            <span className="font-semibold text-white">{log.to}</span>
                          </div>
                          <span className="text-[11px] text-zinc-500 font-mono">
                            {new Date(log.sentAt).toLocaleString('pt-BR')}
                          </span>
                        </div>

                        <div className="text-[11px] text-zinc-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span><strong>Assunto:</strong> {log.subject}</span>
                          <span><strong>Provedor:</strong> {log.provider}</span>
                          {log.messageId && <span><strong>ID:</strong> <code className="font-mono text-zinc-300">{log.messageId}</code></span>}
                        </div>

                        {log.error && (
                          <div className="p-2 bg-red-950/40 border border-red-800/50 rounded-lg text-red-300 text-[11px] font-mono mt-1">
                            <strong>Erro:</strong> {log.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {/* Basic info */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-md space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-500" />
            <span>Informações Principais</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Nome do Estabelecimento *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Slogan / Frase de Destaque
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Imagem de Capa (Banner Hero)
              </label>
              <input
                type="url"
                value={formData.bannerImage}
                onChange={(e) => setFormData({ ...formData, bannerImage: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                URL da Logo
              </label>
              <input
                type="url"
                value={formData.logo}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Contact & Location */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-md space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Phone className="w-4 h-4 text-amber-500" />
            <span>Canais de Atendimento & Endereço</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Telefone Fixo / Comercial
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                WhatsApp Oficial (com DDD, ex: 5511999998888) *
              </label>
              <input
                type="text"
                required
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Instagram (@usuario)
              </label>
              <input
                type="text"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Endereço Completo
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Cidade / Estado
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      </form>

      {/* Danger zone: Reset Demo */}
      <div className="bg-red-950/20 border border-red-900/40 rounded-3xl p-6 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-red-300 flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-400" />
            <span>Restaurar Dados de Demonstração</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Restaura os barbeiros, serviços, horários e agendamentos de exemplo iniciais no seu navegador.
          </p>
        </div>

        <button
          id="reset-demo-data-btn"
          type="button"
          onClick={() => {
            if (window.confirm('Tem certeza que deseja restaurar os dados de demonstração originais?')) {
              resetToDemoData();
            }
          }}
          className="py-2.5 px-4 bg-red-900/40 hover:bg-red-900/80 border border-red-700/50 text-red-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 flex-shrink-0"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Resetar para Demo</span>
        </button>
      </div>
    </div>
  );
};
