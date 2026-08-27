import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { Professional, Service } from '../../types';
import {
  calculateAvailableSlots,
  downloadIcsFile,
  formatCurrency,
  formatDateBR,
  generateBookingWhatsAppMessage,
  generateGoogleCalendarUrl,
  generateWhatsAppUrl,
  generateSmsUrl,
  generateGmailComposeUrl,
  generateOutlookComposeUrl,
  generateMailtoUrl,
  generateVoucherSmsMessage,
  generateVoucherFullText,
  getTodayDateString,
  MONTH_NAMES,
  WEEKDAY_SHORT,
} from '../../utils/calendarUtils';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Scissors,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  Share2,
  CalendarPlus,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Phone,
  Mail,
  RotateCcw,
  MessageSquare,
  ExternalLink,
  Copy,
  Check,
  Smartphone,
} from 'lucide-react';

export const BookingModal: React.FC = () => {
  const {
    isBookingModalOpen,
    closeBookingModal,
    services,
    professionals,
    businessHours,
    appointments,
    blockedTimes,
    settings,
    currentUser,
    selectedServiceForBooking,
    createAppointment,
    openSocialLoginModal,
    openEmailModal,
    showToast,
  } = useApp();

  // Wizard Steps: 1: Service, 2: Barber, 3: Date & Time, 4: Identification & Review, 5: Success
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Selected State
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [selectedTime, setSelectedTime] = useState<string>('');
  
  // Calendar month state
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  // Client Info Form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Result state
  const [confirmedAppointment, setConfirmedAppointment] = useState<any>(null);

  // Synchronize initial service selection if opened with one
  useEffect(() => {
    if (isBookingModalOpen) {
      if (selectedServiceForBooking) {
        setSelectedService(selectedServiceForBooking);
        setStep(2);
      } else {
        setStep(1);
      }
      setSelectedTime('');
    }
  }, [isBookingModalOpen, selectedServiceForBooking]);

  // Pre-fill user data if logged in
  useEffect(() => {
    if (currentUser) {
      if (!customerName) setCustomerName(currentUser.name);
      if (!customerEmail) setCustomerEmail(currentUser.email);
      if (!customerPhone && currentUser.phone) setCustomerPhone(currentUser.phone);
    }
  }, [currentUser]);

  if (!isBookingModalOpen) return null;

  // Active services & barbers
  const activeServices = services.filter((s) => s.active);
  const activeBarbers = professionals.filter((p) => p.active);

  // If "any barber" is needed or specific
  const barberForSlots = selectedProfessional || activeBarbers[0];

  // Calculated slots for the selected date & service
  const availableSlots = selectedService && barberForSlots
    ? calculateAvailableSlots({
        date: selectedDate,
        service: selectedService,
        professional: barberForSlots,
        allProfessionals: activeBarbers,
        businessHours,
        appointments,
        blockedTimes,
        slotIntervalMinutes: settings.slotIntervalMinutes || 30,
      })
    : [];

  // Month navigation
  const prevMonth = () => {
    const today = new Date();
    const newMonth = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1);
    // Don't allow viewing months before current month
    if (
      newMonth.getFullYear() < today.getFullYear() ||
      (newMonth.getFullYear() === today.getFullYear() && newMonth.getMonth() < today.getMonth())
    ) {
      return;
    }
    setCurrentMonthDate(newMonth);
  };

  const nextMonth = () => {
    const newMonth = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1);
    setCurrentMonthDate(newMonth);
  };

  // Generate Calendar Days Grid
  const generateCalendarDays = () => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = getTodayDateString();

    const days = [];

    // Empty padding slots for days before 1st of month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    // Actual month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOfWeek = new Date(year, month, d).getDay();
      
      const isPast = dateStr < todayStr;
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === selectedDate;
      
      // Check if shop open and barber works
      const shopOpen = businessHours[dayOfWeek]?.isOpen;
      const barberWorks = barberForSlots ? barberForSlots.workingDays.includes(dayOfWeek) : true;
      const isDayOff = barberForSlots ? barberForSlots.daysOff.includes(dateStr) : false;
      const isUnavailable = isPast || !shopOpen || !barberWorks || isDayOff;

      days.push({
        dayNumber: d,
        dateStr,
        isPast,
        isToday,
        isSelected,
        isUnavailable,
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  // Submission handler
  const handleConfirmBooking = async () => {
    if (!isNameValid || !isPhoneValid || !isEmailValid) {
      showToast('Por favor, preencha corretamente os dados de identificação.', 'error');
      return;
    }

    if (!selectedService || !barberForSlots || !selectedDate || !selectedTime) {
      showToast('Por favor, selecione todas as opções do agendamento.', 'error');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      showToast('Por favor, informe seu nome e telefone/WhatsApp.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = createAppointment({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        serviceId: selectedService.id,
        professionalId: barberForSlots.id,
        date: selectedDate,
        time: selectedTime,
        durationMinutes: selectedService.durationMinutes,
        price: selectedService.price,
        notes: notes.trim() || undefined,
      });

      if (res.success && res.appointment) {
        setConfirmedAppointment(res.appointment);
        setStep(5);

        // Trigger confetti celebration
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#f59e0b', '#fbbf24', '#ffffff', '#d97706'],
          });
        } catch (e) {
          // ignore if canvas blocked
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // WhatsApp Trigger
  const handleSendWhatsApp = () => {
    if (!confirmedAppointment || !selectedService || !barberForSlots) return;
    const msg = generateBookingWhatsAppMessage({
      customerName: confirmedAppointment.customerName,
      serviceName: selectedService.name,
      professionalName: barberForSlots.name,
      dateStr: confirmedAppointment.date,
      timeStr: confirmedAppointment.time,
      price: confirmedAppointment.price,
      shopName: settings.name,
      code: confirmedAppointment.code,
    });

    const phoneToUse = confirmedAppointment.customerPhone || settings.whatsapp;
    const cleanPhone = phoneToUse.replace(/\D/g, '');
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone.length >= 10 ? cleanPhone : settings.whatsapp}&text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleAddToGoogleCalendar = () => {
    if (!confirmedAppointment || !selectedService || !barberForSlots) return;
    const url = generateGoogleCalendarUrl({
      title: `${selectedService.name} — ${settings.name}`,
      description: `Agendamento na ${settings.name}\nProfissional: ${barberForSlots.name}\nCódigo: ${confirmedAppointment.code}\nEndereço: ${settings.address}`,
      location: `${settings.address}, ${settings.city}`,
      date: confirmedAppointment.date,
      time: confirmedAppointment.time,
      durationMinutes: confirmedAppointment.durationMinutes,
    });
    window.open(url, '_blank');
  };

  const handleDownloadIcs = () => {
    if (!confirmedAppointment || !selectedService || !barberForSlots) return;
    downloadIcsFile({
      code: confirmedAppointment.code,
      title: `${selectedService.name} — ${settings.name}`,
      description: `Agendamento na ${settings.name} com ${barberForSlots.name}. Código: ${confirmedAppointment.code}`,
      location: `${settings.address}, ${settings.city}`,
      date: confirmedAppointment.date,
      time: confirmedAppointment.time,
      durationMinutes: confirmedAppointment.durationMinutes,
    });
  };

  const resetFlow = () => {
    setStep(1);
    setSelectedService(null);
    setSelectedProfessional(null);
    setSelectedTime('');
    setConfirmedAppointment(null);
  };

  // Validation Logic
  const phoneDigits = customerPhone.replace(/\D/g, '');
  const isPhoneValid = phoneDigits.length >= 10 && phoneDigits.length <= 11;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = !customerEmail || emailRegex.test(customerEmail);
  const isNameValid = customerName.trim().length > 2;
  const isFormValid = isNameValid && isPhoneValid && isEmailValid;

  return (
    <div
      id="booking-modal-overlay"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={closeBookingModal}
    >
      <div
        id="booking-modal-card"
        className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-2xl w-full shadow-2xl relative text-zinc-100 overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="bg-zinc-900 border-b border-zinc-800/80 px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            {step > 1 && step < 5 && (
              <button
                id="booking-back-btn"
                onClick={() => setStep((prev) => (prev - 1) as any)}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                aria-label="Voltar etapa"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {step === 5 ? 'Sucesso' : `Etapa ${step} de 4`}
                </span>
                <span className="text-xs text-zinc-400 hidden sm:inline">
                  {step === 1 && 'Escolha o Serviço'}
                  {step === 2 && 'Escolha o Barbeiro'}
                  {step === 3 && 'Escolha Data & Horário'}
                  {step === 4 && 'Confirmação'}
                  {step === 5 && 'Concluído'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold font-display text-white">
                {step === 1 && 'Qual serviço você deseja agendar?'}
                {step === 2 && 'Com qual profissional prefere?'}
                {step === 3 && 'Selecione o melhor dia e horário'}
                {step === 4 && 'Revise e confirme seu agendamento'}
                {step === 5 && 'Agendamento Confirmado!'}
              </h2>
            </div>
          </div>

          <button
            id="close-booking-modal-btn"
            onClick={closeBookingModal}
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-full transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with smooth scrolling */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* ================= STEP 1: SERVICES ================= */}
          {step === 1 && (
            <div id="step-1-services" className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeServices.map((service) => {
                  const isSelected = selectedService?.id === service.id;
                  return (
                    <div
                      key={service.id}
                      id={`service-card-${service.id}`}
                      onClick={() => {
                        setSelectedService(service);
                        setStep(2);
                      }}
                      className={`group cursor-pointer rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between relative overflow-hidden ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/10'
                          : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900'
                      }`}
                    >
                      {service.popular && (
                        <div className="absolute top-3 right-3 bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                          Destaque
                        </div>
                      )}

                      <div className="flex gap-3.5 items-start">
                        <img
                          src={service.image}
                          alt={service.name}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80';
                          }}
                          className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-zinc-800"
                        />
                        <div className="flex-1 pr-6">
                          <h3 className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors">
                            {service.name}
                          </h3>
                          <p className="text-xs text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                            {service.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>{service.durationMinutes} min</span>
                        </div>
                        <div className="text-sm font-black text-amber-400">
                          {formatCurrency(service.price)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= STEP 2: PROFESSIONAL ================= */}
          {step === 2 && (
            <div id="step-2-professionals" className="space-y-4">
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <Scissors className="w-4 h-4 text-amber-400" />
                  <span>
                    Serviço: <strong className="text-white">{selectedService?.name}</strong> (
                    {selectedService?.durationMinutes} min - {formatCurrency(selectedService?.price || 0)})
                  </span>
                </div>
                <button
                  id="change-service-btn"
                  onClick={() => setStep(1)}
                  className="text-xs text-amber-400 hover:underline"
                >
                  Alterar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Any Barber Option */}
                <div
                  id="barber-card-any"
                  onClick={() => {
                    setSelectedProfessional(activeBarbers[0]);
                    setStep(3);
                  }}
                  className="cursor-pointer rounded-2xl p-4 border bg-zinc-900/90 border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-900 transition-all flex items-center gap-4"
                >
                  <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Primeiro Disponível</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Encontrar o horário mais rápido com qualquer profissional
                    </p>
                  </div>
                </div>

                {activeBarbers.map((barber) => {
                  const isSelected = selectedProfessional?.id === barber.id;
                  return (
                    <div
                      key={barber.id}
                      id={`barber-card-${barber.id}`}
                      onClick={() => {
                        setSelectedProfessional(barber);
                        setStep(3);
                      }}
                      className={`group cursor-pointer rounded-2xl p-4 border transition-all duration-200 flex items-center gap-3.5 ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 shadow-md'
                          : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900'
                      }`}
                    >
                      <img
                        src={barber.avatar}
                        alt={barber.name}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
                        }}
                        className="w-14 h-14 rounded-full object-cover border-2 border-zinc-700 group-hover:border-amber-500 transition-colors"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-sm text-white truncate">{barber.name}</h3>
                          <span className="text-xs text-amber-400 font-bold flex items-center gap-0.5">
                            ★ {barber.rating.toFixed(1)}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 truncate mt-0.5">{barber.specialty}</p>
                        <span className="inline-block text-[10px] text-emerald-400 mt-1 font-medium">
                          ● Disponível hoje
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= STEP 3: DATE & TIME ================= */}
          {step === 3 && (
            <div id="step-3-datetime" className="space-y-6">
              {/* Selected Recap Bar */}
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl flex items-center justify-between text-xs">
                <div className="text-zinc-300">
                  <span className="text-amber-400 font-bold">{selectedService?.name}</span> com{' '}
                  <span className="text-white font-medium">{selectedProfessional?.name}</span>
                </div>
                <button
                  id="change-barber-btn"
                  onClick={() => setStep(2)}
                  className="text-amber-400 hover:underline"
                >
                  Alterar profissional
                </button>
              </div>

              {/* Responsive Monthly Calendar */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5">
                {/* Month header & navigation */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-amber-500" />
                    <span>
                      {MONTH_NAMES[currentMonthDate.getMonth()]} {currentMonthDate.getFullYear()}
                    </span>
                  </h3>
                  <div className="flex gap-1">
                    <button
                      id="cal-prev-month-btn"
                      type="button"
                      onClick={prevMonth}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                      aria-label="Mês anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      id="cal-next-month-btn"
                      type="button"
                      onClick={nextMonth}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                      aria-label="Próximo mês"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-zinc-400 mb-2">
                  {WEEKDAY_SHORT.map((wd) => (
                    <div key={wd} className="py-1">
                      {wd}
                    </div>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                  {calendarDays.map((item, idx) => {
                    if (!item) {
                      return <div key={`empty-${idx}`} className="h-9 sm:h-10" />;
                    }

                    return (
                      <button
                        key={item.dateStr}
                        id={`cal-day-${item.dateStr}`}
                        type="button"
                        disabled={item.isUnavailable}
                        onClick={() => {
                          setSelectedDate(item.dateStr);
                          setSelectedTime(''); // Reset time when date changes
                        }}
                        className={`h-9 sm:h-10 rounded-xl text-xs sm:text-sm font-semibold flex flex-col items-center justify-center relative transition-all ${
                          item.isSelected
                            ? 'bg-amber-500 text-black font-extrabold shadow-md shadow-amber-500/20 scale-105 z-10'
                            : item.isUnavailable
                            ? 'text-zinc-600 bg-zinc-950/40 cursor-not-allowed'
                            : 'text-zinc-200 bg-zinc-800/60 hover:bg-zinc-700/80 hover:text-white'
                        } ${item.isToday && !item.isSelected ? 'border border-amber-500/50 text-amber-400' : ''}`}
                      >
                        <span>{item.dayNumber}</span>
                        {item.isToday && !item.isSelected && (
                          <span className="w-1 h-1 rounded-full bg-amber-400 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots Area */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>Horários Disponíveis ({formatDateBR(selectedDate)})</span>
                  </h4>
                  <span className="text-[11px] text-zinc-400">
                    {availableSlots.filter((s) => s.available).length} horários livres
                  </span>
                </div>

                {availableSlots.length === 0 ? (
                  <div className="p-6 text-center bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                    <p className="text-sm text-zinc-400">
                      Nenhum horário disponível para esta data ou o estabelecimento está fechado.
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Por favor, selecione outro dia no calendário acima.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {availableSlots.map((slot) => {
                      const isSelected = selectedTime === slot.time;
                      return (
                        <button
                          key={slot.time}
                          id={`time-slot-${slot.time.replace(':', '')}`}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setSelectedTime(slot.time)}
                          className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center ${
                            isSelected
                              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 scale-105'
                              : !slot.available
                              ? 'bg-zinc-950 text-zinc-600 border border-zinc-900 cursor-not-allowed line-through opacity-60'
                              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-amber-500/40'
                          }`}
                        >
                          <span>{slot.time}</span>
                          {!slot.available && (
                            <span className="text-[9px] no-underline font-normal">
                              {slot.reason === 'booked' ? 'Ocupado' : 'Indisponível'}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Continue to Confirmation Step */}
              {selectedTime && (
                <div className="pt-2">
                  <button
                    id="goto-step-4-btn"
                    onClick={() => setStep(4)}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <span>Avançar para Identificação</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 4: IDENTIFICATION & SUMMARY ================= */}
          {step === 4 && (
            <div id="step-4-confirmation" className="space-y-6">
              {/* Order Summary Card */}
              <div className="bg-zinc-900 border border-amber-500/30 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">
                  Resumo do Atendimento
                </h3>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-zinc-400 block">Serviço</span>
                    <strong className="text-white font-bold text-base">{selectedService?.name}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 block">Profissional</span>
                    <strong className="text-white font-bold text-base">{barberForSlots?.name}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 block">Data</span>
                    <span className="text-zinc-200 font-medium">{formatDateBR(selectedDate, true)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 block">Horário</span>
                    <span className="text-amber-400 font-black text-base">{selectedTime}</span>
                    <span className="text-zinc-500 text-xs ml-1">({selectedService?.durationMinutes} min)</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">
                  <span className="text-zinc-300 font-medium">Valor Total</span>
                  <span className="text-xl font-black text-amber-400">
                    {formatCurrency(selectedService?.price || 0)}
                  </span>
                </div>
              </div>

              {/* Social Login Quick Action */}
              {!currentUser ? (
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Preenchimento Rápido com Social Login</span>
                      </h4>
                      <p className="text-xs text-zinc-400">
                        Conecte seu Google ou Facebook para agendar em 1 clique
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      id="step4-google-login-btn"
                      type="button"
                      onClick={() => openSocialLoginModal()}
                      className="py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-medium text-white flex items-center justify-center gap-2 border border-zinc-700 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#EA4335"
                          d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.4 8.9 5 12 5z"
                        />
                        <path
                          fill="#4285F4"
                          d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.1-2 .4-2.7L1.6 6.4C.6 8.3 0 10.1 0 12s.6 3.7 1.6 5.6l3.7-2.9z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.4-6.7-5.3L1.6 16c1.9 3.8 5.8 7 10.4 7z"
                        />
                      </svg>
                      <span>Google</span>
                    </button>
                    <button
                      id="step4-fb-login-btn"
                      type="button"
                      onClick={() => openSocialLoginModal()}
                      className="py-2.5 px-3 bg-[#1877F2] hover:bg-[#166fe5] rounded-xl text-xs font-medium text-white flex items-center justify-center gap-2 transition-colors"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      <span>Facebook</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-10 h-10 rounded-full object-cover border border-amber-500"
                    />
                    <div>
                      <div className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                        Logado via {currentUser.provider}
                      </div>
                      <div className="text-sm font-bold text-white">{currentUser.name}</div>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-4 h-4" /> Pronto
                  </span>
                </div>
              )}

              {/* Form inputs */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Nome Completo *</span>
                  </label>
                  <input
                    id="client-name-input"
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ex: João Silva"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-zinc-400" />
                      <span>WhatsApp / Telefone *</span>
                    </label>
                    <input
                      id="client-phone-input"
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="(11) 98765-4321"
                      className={`w-full bg-zinc-900 border rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors ${
                        customerPhone && !isPhoneValid
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-zinc-800 focus:border-amber-500'
                      }`}
                    />
                    {customerPhone && !isPhoneValid && (
                      <p className="text-red-400 text-[10px] mt-1.5 font-medium ml-1">
                        Formato inválido. Insira DDD + Número.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-zinc-400" />
                      <span>E-mail (opcional)</span>
                    </label>
                    <input
                      id="client-email-input"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="joao@email.com"
                      className={`w-full bg-zinc-900 border rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors ${
                        customerEmail && !isEmailValid
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-zinc-800 focus:border-amber-500'
                      }`}
                    />
                    {customerEmail && !isEmailValid && (
                      <p className="text-red-400 text-[10px] mt-1.5 font-medium ml-1">
                        E-mail inválido. Verifique a formatação.
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Observações ou Preferências (opcional)
                  </label>
                  <input
                    id="client-notes-input"
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Cabelo fino, prefiro toalha morna..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Confirm Booking Button */}
              <div className="pt-2">
                <button
                  id="submit-confirm-booking-btn"
                  type="button"
                  disabled={isSubmitting || !isFormValid}
                  onClick={handleConfirmBooking}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wider rounded-xl text-sm transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500 disabled:shadow-none"
                >
                  {isSubmitting ? (
                    <span>Processando reserva...</span>
                  ) : !isFormValid ? (
                    <span>Preencha os dados</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      <span>Confirmar Agendamento</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 5: CONFIRMATION SUCCESS ================= */}
          {step === 5 && confirmedAppointment && (
            <div id="step-5-success" className="text-center space-y-6 py-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500 text-amber-400 flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                  Agendamento Confirmado
                </span>
                <h3 className="text-2xl font-black font-display text-white mt-1">
                  Te esperamos na BarberFlow!
                </h3>
                <p className="text-sm text-zinc-400 mt-1">
                  Seu horário foi bloqueado com sucesso na agenda do profissional.
                </p>
              </div>

              {/* Receipt / Voucher Card */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-left space-y-3 max-w-md mx-auto">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <span className="text-xs text-zinc-400">Código de Agendamento</span>
                  <span className="text-sm font-black font-mono px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    #{confirmedAppointment.code}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-500 block">Cliente</span>
                    <strong className="text-zinc-200 font-semibold">{confirmedAppointment.customerName}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Serviço</span>
                    <strong className="text-zinc-200 font-semibold">{selectedService?.name}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Profissional</span>
                    <strong className="text-zinc-200 font-semibold">{barberForSlots?.name}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Data e Horário</span>
                    <strong className="text-amber-400 font-bold">
                      {formatDateBR(confirmedAppointment.date)} às {confirmedAppointment.time}
                    </strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Valor</span>
                    <strong className="text-zinc-200 font-semibold">
                      {formatCurrency(confirmedAppointment.price)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Endereço</span>
                    <span className="text-zinc-300">{settings.address}</span>
                  </div>
                </div>
              </div>

              {/* Interactive Voucher Dispatch Options */}
              <div className="max-w-md mx-auto space-y-3 text-left">
                {/* WhatsApp & SMS Card */}
                <div className="p-4 bg-zinc-900 border border-emerald-500/20 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Enviar Voucher por WhatsApp ou SMS</span>
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[11px] text-zinc-400 block">
                      Número de Celular / WhatsApp:
                    </label>
                    <input
                      type="tel"
                      id="step5-phone-input"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-emerald-500"
                    />

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <a
                        id="success-whatsapp-btn"
                        href={generateWhatsAppUrl(
                          customerPhone,
                          generateBookingWhatsAppMessage({
                            customerName: confirmedAppointment.customerName,
                            serviceName: selectedService?.name || 'Serviço',
                            professionalName: barberForSlots?.name || 'Barbeiro',
                            dateStr: confirmedAppointment.date,
                            timeStr: confirmedAppointment.time,
                            price: confirmedAppointment.price,
                            shopName: settings.name,
                            code: confirmedAppointment.code,
                            address: `${settings.address}, ${settings.city}`,
                          })
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md text-center"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>No WhatsApp</span>
                      </a>

                      <a
                        id="success-sms-btn"
                        href={generateSmsUrl(
                          customerPhone,
                          generateVoucherSmsMessage({
                            customerName: confirmedAppointment.customerName,
                            serviceName: selectedService?.name || 'Serviço',
                            professionalName: barberForSlots?.name || 'Barbeiro',
                            dateStr: confirmedAppointment.date,
                            timeStr: confirmedAppointment.time,
                            price: confirmedAppointment.price,
                            shopName: settings.name,
                            code: confirmedAppointment.code,
                            address: `${settings.address}, ${settings.city}`,
                          })
                        )}
                        className="py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md text-center"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Por SMS</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* E-mail & Web Provider Card */}
                <div className="p-4 bg-zinc-900 border border-amber-500/20 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      <span>Enviar / Abrir no seu E-mail</span>
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] text-zinc-400 block">
                      Seu E-mail:
                    </label>
                    <input
                      type="email"
                      id="step5-email-input"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="seu.email@exemplo.com"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                    />

                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      <a
                        id="success-gmail-btn"
                        href={generateGmailComposeUrl(
                          customerEmail,
                          `✂️ Voucher do Agendamento #${confirmedAppointment.code} - ${settings.name}`,
                          generateVoucherFullText({
                            customerName: confirmedAppointment.customerName,
                            serviceName: selectedService?.name || 'Serviço',
                            professionalName: barberForSlots?.name || 'Barbeiro',
                            dateStr: confirmedAppointment.date,
                            timeStr: confirmedAppointment.time,
                            durationMinutes: confirmedAppointment.durationMinutes,
                            price: confirmedAppointment.price,
                            shopName: settings.name,
                            shopEmail: settings.shopEmail,
                            phone: settings.phone,
                            code: confirmedAppointment.code,
                            address: `${settings.address}, ${settings.city}`,
                          })
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 text-center"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Gmail</span>
                      </a>

                      <a
                        id="success-outlook-btn"
                        href={generateOutlookComposeUrl(
                          customerEmail,
                          `✂️ Voucher do Agendamento #${confirmedAppointment.code} - ${settings.name}`,
                          generateVoucherFullText({
                            customerName: confirmedAppointment.customerName,
                            serviceName: selectedService?.name || 'Serviço',
                            professionalName: barberForSlots?.name || 'Barbeiro',
                            dateStr: confirmedAppointment.date,
                            timeStr: confirmedAppointment.time,
                            durationMinutes: confirmedAppointment.durationMinutes,
                            price: confirmedAppointment.price,
                            shopName: settings.name,
                            shopEmail: settings.shopEmail,
                            phone: settings.phone,
                            code: confirmedAppointment.code,
                            address: `${settings.address}, ${settings.city}`,
                          })
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 text-center"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Outlook</span>
                      </a>

                      <a
                        id="success-mailto-btn"
                        href={generateMailtoUrl(
                          customerEmail,
                          `✂️ Voucher do Agendamento #${confirmedAppointment.code} - ${settings.name}`,
                          generateVoucherFullText({
                            customerName: confirmedAppointment.customerName,
                            serviceName: selectedService?.name || 'Serviço',
                            professionalName: barberForSlots?.name || 'Barbeiro',
                            dateStr: confirmedAppointment.date,
                            timeStr: confirmedAppointment.time,
                            durationMinutes: confirmedAppointment.durationMinutes,
                            price: confirmedAppointment.price,
                            shopName: settings.name,
                            shopEmail: settings.shopEmail,
                            phone: settings.phone,
                            code: confirmedAppointment.code,
                            address: `${settings.address}, ${settings.city}`,
                          })
                        )}
                        className="py-2 px-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 text-center"
                      >
                        <Mail className="w-3 h-3" />
                        <span>App E-mail</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Voucher Modal Button */}
                <button
                  id="success-email-voucher-btn"
                  onClick={() => openEmailModal(confirmedAppointment)}
                  className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-bold rounded-xl text-xs border border-zinc-700 transition-all flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4 text-amber-400" />
                  <span>Ver / Imprimir Voucher Completo</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-1 max-w-md mx-auto">
                <button
                  id="success-gcal-btn"
                  onClick={handleAddToGoogleCalendar}
                  className="text-xs text-zinc-400 hover:text-amber-400 font-semibold transition-colors flex items-center gap-1.5"
                >
                  <CalendarPlus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Adicionar ao Google Agenda</span>
                </button>

                <span className="text-zinc-600">•</span>

                <button
                  id="success-download-ics-btn"
                  onClick={handleDownloadIcs}
                  className="text-xs text-zinc-400 hover:text-amber-400 transition-colors"
                >
                  Baixar .ICS
                </button>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex gap-3 max-w-md mx-auto">
                <button
                  id="success-new-booking-btn"
                  onClick={resetFlow}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Novo Agendamento</span>
                </button>
                <button
                  id="success-close-modal-btn"
                  onClick={closeBookingModal}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs transition-colors"
                >
                  Voltar para o Início
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
