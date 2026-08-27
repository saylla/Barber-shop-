import { Appointment, BlockedTime, BusinessHours, Customer, Professional, Review, Service, ShopSettings, UserAccount } from '../types';
import { getTodayDateString } from '../utils/calendarUtils';

export const INITIAL_SERVICES: Service[] = [
  {
    id: 'srv-1',
    name: 'Corte Masculino',
    description: 'Corte moderno ou clássico com tesoura e máquina, lavagem refrescante e finalização com pomada premium.',
    durationMinutes: 35,
    price: 45.0,
    category: 'corte',
    image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=600&q=80',
    active: true,
    popular: true,
  },
  {
    id: 'srv-2',
    name: 'Corte + Barba',
    description: 'O combo mais pedido! Corte completo com fade/tesoura + barba alinhada com toalha quente e óleo de tratamento.',
    durationMinutes: 60,
    price: 65.0,
    category: 'combo',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
    active: true,
    popular: true,
  },
  {
    id: 'srv-3',
    name: 'Barba Terapia Tradicional',
    description: 'Modelagem com navalhete descartável, toalha quente com óleos essenciais, massagem facial e pós-barba hidratante.',
    durationMinutes: 30,
    price: 35.0,
    category: 'barba',
    image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=600&q=80',
    active: true,
  },
  {
    id: 'srv-4',
    name: 'Sobrancelha Masculina',
    description: 'Limpeza e alinhamento sutil com navalha ou pinça, mantendo o aspecto natural e marcante.',
    durationMinutes: 15,
    price: 20.0,
    category: 'tratamento',
    image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=80',
    active: true,
  },
  {
    id: 'srv-5',
    name: 'Platinado / Nevou',
    description: 'Descoloração global de alto padrão com proteção capilar anti-quebra e matização no tom branco platinado perfeito.',
    durationMinutes: 90,
    price: 130.0,
    category: 'coloracao',
    image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80',
    active: true,
  },
  {
    id: 'srv-6',
    name: 'Acabamento e Pezinho',
    description: 'Alinhamento preciso do contorno do cabelo e nuca com navalhete descartável e loção calmante, ideal para manter o visual alinhado entre cortes.',
    durationMinutes: 20,
    price: 25.0,
    category: 'corte',
    image: 'https://images.unsplash.com/photo-1593702288056-7927b442d0fa?auto=format&fit=crop&w=600&q=80',
    active: true,
  },
  {
    id: 'srv-7',
    name: 'Combo Premium BarberFlow',
    description: 'Experiência VIP completa: Corte artesanal + Barboterapia completa + Sobrancelha + Hidratação profunda + Bebida cortesia.',
    durationMinutes: 75,
    price: 95.0,
    category: 'combo',
    image: 'https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=600&q=80',
    active: true,
    popular: true,
  },
];

export const INITIAL_PROFESSIONALS: Professional[] = [
  {
    id: 'prof-1',
    name: 'Carlos Eduardo',
    specialty: 'Especialista em Degradê (Fade) & Cortes Clássicos',
    rating: 4.9,
    reviewsCount: 148,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    bio: 'Mais de 8 anos de experiência em visagismo e cortes masculinos de alta precisão. Formado pela Barber Academy.',
    active: true,
    servicesOffered: ['srv-1', 'srv-2', 'srv-3', 'srv-4', 'srv-6', 'srv-7'],
    workingDays: [1, 2, 3, 4, 5, 6], // Mon - Sat
    startTime: '09:00',
    endTime: '19:30',
    lunchStart: '12:00',
    lunchEnd: '13:00',
    daysOff: [],
  },
  {
    id: 'prof-2',
    name: 'Mateus Silva',
    specialty: 'Mestre Barbeiro & Terapia de Barba Tradicional',
    rating: 5.0,
    reviewsCount: 192,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    bio: 'Referência em barba desenhada e alinhamento com toalha quente. Cuidado meticuloso e pontualidade exemplar.',
    active: true,
    servicesOffered: ['srv-1', 'srv-2', 'srv-3', 'srv-4', 'srv-6', 'srv-7'],
    workingDays: [1, 2, 3, 4, 5, 6],
    startTime: '09:30',
    endTime: '20:00',
    lunchStart: '13:00',
    lunchEnd: '14:00',
    daysOff: [],
  },
  {
    id: 'prof-3',
    name: 'Rafael Santos',
    specialty: 'Especialista em Visagismo, Platinados & Freestyle',
    rating: 4.8,
    reviewsCount: 116,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    bio: 'Focado em tendências modernas, químicas de clareamento sem danos capilares e cortes personalizados.',
    active: true,
    servicesOffered: ['srv-1', 'srv-2', 'srv-3', 'srv-4', 'srv-5', 'srv-6', 'srv-7'],
    workingDays: [2, 3, 4, 5, 6], // Tue - Sat
    startTime: '10:00',
    endTime: '20:00',
    lunchStart: '14:00',
    lunchEnd: '15:00',
    daysOff: [],
  },
];

export const INITIAL_BUSINESS_HOURS: BusinessHours = {
  0: { isOpen: false, open: '09:00', close: '14:00' }, // Domingo fechado
  1: { isOpen: true, open: '09:00', close: '20:00', lunchStart: '12:00', lunchEnd: '13:00' }, // Seg
  2: { isOpen: true, open: '09:00', close: '20:00', lunchStart: '12:00', lunchEnd: '13:00' }, // Ter
  3: { isOpen: true, open: '09:00', close: '20:00', lunchStart: '12:00', lunchEnd: '13:00' }, // Qua
  4: { isOpen: true, open: '09:00', close: '20:00', lunchStart: '12:00', lunchEnd: '13:00' }, // Qui
  5: { isOpen: true, open: '09:00', close: '20:30', lunchStart: '12:00', lunchEnd: '13:00' }, // Sex
  6: { isOpen: true, open: '08:30', close: '19:30', lunchStart: '12:00', lunchEnd: '13:00' }, // Sab
};

export const INITIAL_SETTINGS: ShopSettings = {
  name: 'BarberFlow Studio & Barbershop',
  tagline: 'Seu estilo. Seu horário. Sem espera.',
  logo: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=120&q=80',
  bannerImage: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1600&q=80',
  address: 'Rua Oscar Freire, 1420 - Jardins',
  city: 'São Paulo - SP',
  phone: '(11) 3254-8900',
  whatsapp: '5511987654321',
  instagram: 'barberflow.sp',
  mapsUrl: 'https://maps.google.com/?q=Rua+Oscar+Freire+1420+Sao+Paulo',
  slotIntervalMinutes: 30,
  autoConfirm: true,
  minAdvanceBookingHours: 1,
  sendEmailOnBooking: true,
  autoOpenWhatsAppOnBooking: true,
  shopEmail: 'contato@barberflow.com.br',
  pushNotificationsEnabled: true,
  notifyNewBookings: true,
  notifyStatusChanges: true,
  playNotificationSound: true,
  vibrationEnabled: true,
};

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'João Pedro Alcantara',
    phone: '(11) 98765-1122',
    email: 'joao.alcantara@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    totalAppointments: 14,
    totalSpent: 980.0,
    lastVisit: '2026-08-20',
    notes: 'Prefere degradê navalhado na zero e barba bem marcada com óleo amadeirado.',
    provider: 'google',
    joinedAt: '2025-11-10',
  },
  {
    id: 'cust-2',
    name: 'Lucas Brandão',
    phone: '(11) 97654-3344',
    email: 'lucas.brandao@outlook.com',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
    totalAppointments: 8,
    totalSpent: 520.0,
    lastVisit: '2026-08-15',
    notes: 'Corte tesoura clássico. Gosta de café espresso antes do atendimento.',
    provider: 'facebook',
    joinedAt: '2026-01-20',
  },
  {
    id: 'cust-3',
    name: 'Guilherme Rocha',
    phone: '(11) 99123-7788',
    email: 'gui.rocha@empresa.com.br',
    avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=200&q=80',
    totalAppointments: 5,
    totalSpent: 475.0,
    lastVisit: '2026-08-25',
    notes: 'Sempre pede Combo Premium.',
    provider: 'direct',
    joinedAt: '2026-03-05',
  },
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    customerName: 'Gabriel Mendonça',
    customerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
    rating: 5,
    comment: 'Ambiente sensacional, atendimento pontualíssimo. O Carlos é disparado o melhor barbeiro de São Paulo.',
    date: 'Há 2 dias',
    serviceName: 'Corte + Barba',
  },
  {
    id: 'rev-2',
    customerName: 'Felipe Antunes',
    customerAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80',
    rating: 5,
    comment: 'Agendei pelo celular em 1 minuto. Cheguei lá, cerveja gelada na mão e barba feita com toalha quente. Impecável!',
    date: 'Há 5 dias',
    serviceName: 'Combo Premium BarberFlow',
  },
  {
    id: 'rev-3',
    customerName: 'Rodrigo Vasconcelos',
    customerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
    rating: 5,
    comment: 'O platinado do Rafael ficou perfeito sem queimar o couro cabeludo. Vale cada centavo investido.',
    date: 'Há 1 semana',
    serviceName: 'Platinado / Nevou',
  },
];

export const INITIAL_BLOCKED_TIMES: BlockedTime[] = [
  {
    id: 'blk-1',
    professionalId: 'prof-1',
    date: '2026-08-28',
    startTime: '16:00',
    endTime: '17:00',
    reason: 'Compromisso externo / Treinamento',
  },
];

// Helper to seed appointments around current date
export function getInitialAppointments(): Appointment[] {
  const today = getTodayDateString();
  const [y, m, d] = today.split('-').map(Number);
  
  // Tomorrow & Day after
  const tomorrowObj = new Date(y, m - 1, d + 1);
  const tomorrowStr = `${tomorrowObj.getFullYear()}-${String(tomorrowObj.getMonth() + 1).padStart(2, '0')}-${String(tomorrowObj.getDate()).padStart(2, '0')}`;
  
  const nextWeekObj = new Date(y, m - 1, d + 2);
  const nextWeekStr = `${nextWeekObj.getFullYear()}-${String(nextWeekObj.getMonth() + 1).padStart(2, '0')}-${String(nextWeekObj.getDate()).padStart(2, '0')}`;

  return [
    {
      id: 'appt-101',
      code: 'BF-7412',
      customerName: 'João Pedro Alcantara',
      customerPhone: '(11) 98765-1122',
      customerEmail: 'joao.alcantara@gmail.com',
      serviceId: 'srv-2',
      professionalId: 'prof-1',
      date: today,
      time: '14:00',
      durationMinutes: 60,
      price: 65.0,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      authProvider: 'google',
      emailNotificationSent: true,
      whatsappNotificationSent: true,
      history: [
        {
          timestamp: new Date().toISOString(),
          action: 'created',
          description: 'Agendamento criado online pelo cliente',
          performedBy: 'Cliente (Google)',
        },
        {
          timestamp: new Date().toISOString(),
          action: 'accepted',
          description: 'Agendamento aceito e confirmado pelo barbeiro',
          performedBy: 'Carlos Eduardo',
        }
      ]
    },
    {
      id: 'appt-102',
      code: 'BF-8823',
      customerName: 'Lucas Brandão',
      customerPhone: '(11) 97654-3344',
      customerEmail: 'lucas.brandao@outlook.com',
      serviceId: 'srv-1',
      professionalId: 'prof-2',
      date: today,
      time: '15:30',
      durationMinutes: 35,
      price: 45.0,
      status: 'pending',
      createdAt: new Date().toISOString(),
      authProvider: 'facebook',
      emailNotificationSent: true,
      whatsappNotificationSent: false,
      history: [
        {
          timestamp: new Date().toISOString(),
          action: 'created',
          description: 'Novo agendamento recebido aguardando aprovação',
          performedBy: 'Cliente (Facebook)',
        }
      ]
    },
    {
      id: 'appt-103',
      code: 'BF-9104',
      customerName: 'Guilherme Rocha',
      customerPhone: '(11) 99123-7788',
      customerEmail: 'gui.rocha@empresa.com.br',
      serviceId: 'srv-7',
      professionalId: 'prof-1',
      date: tomorrowStr,
      time: '11:00',
      durationMinutes: 75,
      price: 95.0,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      authProvider: 'direct',
      emailNotificationSent: true,
      whatsappNotificationSent: true,
    },
    {
      id: 'appt-104',
      code: 'BF-6241',
      customerName: 'Alexandre Pires',
      customerPhone: '(11) 98111-2233',
      customerEmail: 'ale.pires@gmail.com',
      serviceId: 'srv-3',
      professionalId: 'prof-2',
      date: nextWeekStr,
      time: '16:00',
      durationMinutes: 30,
      price: 35.0,
      status: 'rescheduled',
      createdAt: new Date().toISOString(),
      authProvider: 'google',
      emailNotificationSent: true,
      whatsappNotificationSent: true,
      history: [
        {
          timestamp: new Date().toISOString(),
          action: 'rescheduled',
          description: 'Horário reagendado a pedido do cliente',
          performedBy: 'Mateus Silva',
        }
      ]
    },
  ];
}

export const ADMIN_USER: UserAccount = {
  id: 'usr-admin-1',
  name: 'Matheus Briza (Proprietário)',
  email: 'MatheusBriza84@gmail.com',
  phone: '(11) 98765-4321',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  role: 'admin',
  provider: 'google',
};
