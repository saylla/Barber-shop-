import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Scissors,
  Calendar,
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  Minimize2,
  Maximize2,
  Trash2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { soundService } from '../../utils/soundService';
import { generateWhatsAppUrl } from '../../utils/calendarUtils';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  actionType?: 'booking' | 'whatsapp' | 'services' | 'location';
  actionData?: any;
}

const STORAGE_CHAT_KEY = 'barberflow_chat_history_v1';

export const FloatingChat: React.FC = () => {
  const {
    settings,
    services,
    professionals,
    openBookingModal,
    showToast,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initialWelcomeMessages: ChatMessage[] = [
    {
      id: 'welcome-1',
      sender: 'bot',
      text: `Olá! Bem-vindo à ${settings.businessName || 'BarberFlow'}. 💈 Como posso te ajudar hoje?`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    },
    {
      id: 'welcome-2',
      sender: 'bot',
      text: 'Você pode tirar dúvidas sobre serviços, preços, horários de funcionamento ou clicar abaixo para agendar seu horário online em segundos!',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      actionType: 'booking',
    },
  ];

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CHAT_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return initialWelcomeMessages;
  });

  // Save messages to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, isTyping]);

  // Listen to open chat events from Header or other buttons
  useEffect(() => {
    const handleOpenEvent = () => {
      setIsOpen(true);
      setIsMinimized(false);
      setUnreadCount(0);
    };
    window.addEventListener('open-barberflow-chat', handleOpenEvent);
    return () => window.removeEventListener('open-barberflow-chat', handleOpenEvent);
  }, []);

  const handleToggleOpen = () => {
    if (!isOpen) {
      setIsOpen(true);
      setIsMinimized(false);
      setUnreadCount(0);
    } else {
      setIsOpen(false);
    }
  };

  const handleClearChat = () => {
    setMessages(initialWelcomeMessages);
    localStorage.removeItem(STORAGE_CHAT_KEY);
    showToast('Histórico do chat reiniciado.', 'info');
  };

  // Bot response generator based on barbershop actual data
  const generateBotReply = (userQuery: string): { reply: string; actionType?: 'booking' | 'whatsapp' | 'services' | 'location'; actionData?: any } => {
    const q = userQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // 1. Preços e Valores
    if (q.includes('preco') || q.includes('valor') || q.includes('quanto custa') || q.includes('tabela')) {
      const activeServices = services.filter((s) => s.active);
      const list = activeServices
        .slice(0, 4)
        .map((s) => `• ${s.name}: R$ ${s.price.toFixed(2)} (${s.durationMinutes} min)`)
        .join('\n');
      return {
        reply: `Nossos principais serviços e valores:\n\n${list}\n\nQuer agendar algum desses agora?`,
        actionType: 'booking',
      };
    }

    // 2. Horário de Funcionamento
    if (q.includes('horario') || q.includes('funcionamento') || q.includes('abre') || q.includes('fecha') || q.includes('domingo') || q.includes('sabado')) {
      return {
        reply: `⏰ Nosso horário de atendimento é de Segunda a Sábado das 09:00 às 20:00.\n\nVocê pode escolher a data e o melhor horário diretamente pelo nosso sistema de agendamento online 24h!`,
        actionType: 'booking',
      };
    }

    // 3. Barbeiros / Profissionais
    if (q.includes('barbeiro') || q.includes('profissional') || q.includes('carlos') || q.includes('marcos') || q.includes('quem atende')) {
      const activeProfs = professionals.filter((p) => p.active);
      const profNames = activeProfs.map((p) => `✂️ ${p.name} - ${p.specialty}`).join('\n');
      return {
        reply: `Nossa equipe conta com profissionais de ponta:\n\n${profNames}\n\nTodos com avaliação 5.0 estrelas! Deseja agendar com algum deles?`,
        actionType: 'booking',
      };
    }

    // 4. Endereço / Onde fica
    if (q.includes('onde') || q.includes('endereco') || q.includes('local') || q.includes('fica') || q.includes('chegar') || q.includes('maps')) {
      return {
        reply: `📍 Estamos localizados em:\n${settings.address || 'Av. Paulista, 1578 - Bela Vista, São Paulo - SP'}\n\nTemos convênio com estacionamento e sala de espera climatizada com café e cerveja cortesia!`,
        actionType: 'location',
      };
    }

    // 5. WhatsApp / Falar com Atendente Humano
    if (q.includes('whatsapp') || q.includes('humano') || q.includes('telefone') || q.includes('falar com alguem') || q.includes('contato')) {
      return {
        reply: `Você pode conversar diretamente com nossa recepção pelo WhatsApp (${settings.phone || '(11) 98765-4321'}). Clique no botão abaixo para abrir a conversa!`,
        actionType: 'whatsapp',
      };
    }

    // 6. Agendamento / Marcar corte
    if (q.includes('agendar') || q.includes('marcar') || q.includes('reserva') || q.includes('corte') || q.includes('barba')) {
      return {
        reply: `Perfeito! O agendamento é super rápido: escolha o serviço, o barbeiro da sua preferência, data e horário disponível. Clique no botão abaixo para iniciar:`,
        actionType: 'booking',
      };
    }

    // 7. Produtos / Pomada / Barboterapia / Clube VIP
    if (q.includes('produto') || q.includes('pomada') || q.includes('oleo') || q.includes('clube') || q.includes('vip') || q.includes('plano')) {
      return {
        reply: `Temos nossa linha exclusiva de cosméticos masculinos e planos do Clube VIP (com cortes ilimitados e descontos). Role até a seção "Clube & Produtos" para conferir!`,
        actionType: 'services',
      };
    }

    // Default Fallback
    return {
      reply: `Entendi perfeitamente! Posso te ajudar a agendar um corte, consultar valores, verificar horários livres ou te conectar diretamente ao WhatsApp da nossa barbearia. O que você prefere?`,
      actionType: 'booking',
    };
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');

    // Trigger typing simulation
    setIsTyping(true);

    setTimeout(() => {
      const response = generateBotReply(text);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        actionType: response.actionType,
        actionData: response.actionData,
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);

      // Play sound
      soundService.playNotificationPop();

      if (!isOpen) {
        setUnreadCount((c) => c + 1);
      }
    }, 600);
  };

  const handleQuickQuestion = (question: string) => {
    handleSendMessage(question);
  };

  const handleActionClick = (msg: ChatMessage) => {
    if (msg.actionType === 'booking') {
      openBookingModal();
      setIsOpen(false);
    } else if (msg.actionType === 'whatsapp') {
      const url = generateWhatsAppUrl(
        settings.phone || '5511987654321',
        'Olá! Estou no site da BarberFlow e gostaria de falar com a recepção.'
      );
      window.open(url, '_blank');
    } else if (msg.actionType === 'location') {
      const el = document.getElementById('localizacao');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      setIsOpen(false);
    } else if (msg.actionType === 'services') {
      const el = document.getElementById('clube-e-produtos-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      setIsOpen(false);
    }
  };

  return (
    <div id="floating-chat-container" className="fixed bottom-6 right-6 z-50">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <div className="relative group">
          <button
            id="open-floating-chat-btn"
            onClick={handleToggleOpen}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 text-black p-0.5 shadow-2xl shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center relative cursor-pointer ring-4 ring-zinc-950/80"
            title="Abrir Chat de Atendimento"
          >
            <div className="w-full h-full rounded-full bg-amber-500 flex items-center justify-center text-black">
              <MessageSquare className="w-6 h-6 fill-current" />
            </div>

            {/* Online Pulse Indicator */}
            <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-zinc-950 flex">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            </span>

            {/* Unread Message Badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -left-1 bg-red-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-zinc-950 shadow-md animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Floating Tooltip / Teaser */}
          <div className="hidden sm:block absolute right-16 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-zinc-900/95 border border-zinc-800 text-white text-xs font-semibold py-1.5 px-3 rounded-xl shadow-xl whitespace-nowrap">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Atendimento BarberFlow Online</span>
            </div>
          </div>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          id="barberflow-chat-window"
          className={`bg-zinc-950 border-2 border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-200 ${
            isMinimized
              ? 'w-80 h-16'
              : 'w-[92vw] sm:w-[380px] md:w-[400px] h-[520px] max-h-[82vh]'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 p-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-black flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-zinc-900"></span>
              </div>
              <div>
                <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                  <span>Atendimento BarberFlow</span>
                </h4>
                <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                  <span>Online • Resposta imediata</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearChat}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors"
                title="Limpar histórico"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors"
                title={isMinimized ? 'Expandir' : 'Minimizar'}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition-colors"
                title="Fechar chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Quick Suggestion Chips */}
              <div className="px-3 py-2 bg-zinc-900/60 border-b border-zinc-800/80 flex gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
                <button
                  onClick={() => handleQuickQuestion('Quais são os serviços e valores?')}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-amber-500/20 text-zinc-300 hover:text-amber-300 border border-zinc-800 hover:border-amber-500/40 rounded-full whitespace-nowrap transition-all"
                >
                  💰 Serviços & Preços
                </button>
                <button
                  onClick={() => handleQuickQuestion('Quais os horários de funcionamento?')}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-amber-500/20 text-zinc-300 hover:text-amber-300 border border-zinc-800 hover:border-amber-500/40 rounded-full whitespace-nowrap transition-all"
                >
                  ⏰ Horários
                </button>
                <button
                  onClick={() => handleQuickQuestion('Onde fica a barbearia?')}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-amber-500/20 text-zinc-300 hover:text-amber-300 border border-zinc-800 hover:border-amber-500/40 rounded-full whitespace-nowrap transition-all"
                >
                  📍 Localização
                </button>
                <button
                  onClick={() => handleQuickQuestion('Quero falar no WhatsApp')}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-emerald-500/20 text-zinc-300 hover:text-emerald-300 border border-zinc-800 hover:border-emerald-500/40 rounded-full whitespace-nowrap transition-all"
                >
                  💬 WhatsApp
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-zinc-950/90 text-xs">
                {messages.map((msg) => {
                  const isBot = msg.sender === 'bot';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-3 shadow-md whitespace-pre-line leading-relaxed ${
                          isBot
                            ? 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-sm'
                            : 'bg-amber-500 text-black font-semibold rounded-tr-sm'
                        }`}
                      >
                        <p>{msg.text}</p>

                        {/* Embedded Action Button inside message */}
                        {msg.actionType && (
                          <div className="mt-2.5 pt-2 border-t border-zinc-800/80">
                            {msg.actionType === 'booking' && (
                              <button
                                onClick={() => handleActionClick(msg)}
                                className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
                              >
                                <Sparkles className="w-3.5 h-3.5 fill-current" />
                                <span>Agendar Horário Online</span>
                              </button>
                            )}

                            {msg.actionType === 'whatsapp' && (
                              <button
                                onClick={() => handleActionClick(msg)}
                                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                <span>Abrir WhatsApp da Barbearia</span>
                              </button>
                            )}

                            {msg.actionType === 'location' && (
                              <button
                                onClick={() => handleActionClick(msg)}
                                className="w-full py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                              >
                                <MapPin className="w-3.5 h-3.5" />
                                <span>Ver no Mapa & Endereço</span>
                              </button>
                            )}

                            {msg.actionType === 'services' && (
                              <button
                                onClick={() => handleActionClick(msg)}
                                className="w-full py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                              >
                                <Scissors className="w-3.5 h-3.5" />
                                <span>Ver Catálogo Completo</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] text-zinc-500 mt-1 px-1">{msg.timestamp}</span>
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-2xl px-3.5 py-2.5 w-fit">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce"></span>
                    <span
                      className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    ></span>
                    <span
                      className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.4s' }}
                    ></span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-3 bg-zinc-900 border-t border-zinc-800 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Escreva sua mensagem ou dúvida..."
                  className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-black rounded-xl transition-all font-bold"
                  title="Enviar mensagem"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
};
