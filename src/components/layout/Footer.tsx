import React from 'react';
import { useApp } from '../../context/AppContext';
import { Scissors, Shield, QrCode, UserCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  const { settings, setActiveView, openSocialLoginModal, openQrCodeModal, isAdminAuthenticated } = useApp();

  return (
    <footer id="main-footer" className="bg-zinc-950 border-t border-zinc-900 text-zinc-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-black flex items-center justify-center font-bold">
                <Scissors className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold font-display text-white">
                Barber<span className="text-amber-400">Flow</span>
              </span>
            </div>
            <p className="text-zinc-400 text-xs max-w-sm leading-relaxed">
              Plataforma de agendamento online desenvolvida para barbearias de alto padrão.
              Elimine filas, impulsione seu faturamento e encante seus clientes.
            </p>
            <div className="text-[11px] text-zinc-500">
              © {new Date().getFullYear()} {settings.name}. Todos os direitos reservados.
            </div>
          </div>

          {/* Links Col */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Navegação</h4>
            <ul className="space-y-2">
              <li>
                <a href="#servicos" className="hover:text-amber-400 transition-colors">
                  Tabela de Serviços
                </a>
              </li>
              <li>
                <a href="#barbeiros" className="hover:text-amber-400 transition-colors">
                  Nossa Equipe
                </a>
              </li>
              <li>
                <a href="#avaliacoes" className="hover:text-amber-400 transition-colors">
                  Avaliações de Clientes
                </a>
              </li>
              <li>
                <a href="#localizacao" className="hover:text-amber-400 transition-colors">
                  Onde Estamos
                </a>
              </li>
            </ul>
          </div>

          {/* Admin & Security */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Acesso do Salão</h4>
            <div className="space-y-2.5">
              <button
                id="footer-qrcode-btn"
                type="button"
                onClick={openQrCodeModal}
                className="w-full py-2 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <QrCode className="w-3.5 h-3.5 text-amber-400" />
                <span>Exibir QR Code de Balcão</span>
              </button>

              <button
                id="footer-admin-btn"
                onClick={() => {
                  if (isAdminAuthenticated) {
                    setActiveView('admin');
                  } else {
                    openSocialLoginModal();
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:underline"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Painel dos Barbeiros / Gestor T.I.</span>
              </button>
              <p className="text-[11px] text-zinc-500">
                Acesso individualizado com login por barbeiro e permissões de Super Admin T.I.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom line */}
        <div className="pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-zinc-500 text-[11px]">
          <div>
            Desenvolvido com excelência visual e código otimizado para celulares e computadores.
          </div>
          <div className="flex items-center gap-1">
            <span>BarberFlow Engine</span>
            <span className="text-amber-400">✦</span>
            <span>Versão 2.5 Multi-Barber Pro</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
