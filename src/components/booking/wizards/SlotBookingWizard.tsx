import { useState, useEffect } from 'react';
import { useBookingStore } from '@/store/bookingStore';
import { useNavigate } from 'react-router-dom';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useUIStore } from '@/store/uiStore';
import { Calendar, Clock, User, CheckCircle2, ChevronDown, Sparkles, Scissors, ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ModernCalendar } from '../ModernCalendar';
import { TimeSlotGrid } from '../TimeSlotGrid';
import { AlternativeSuggestions } from '../AlternativeSuggestions';
import { WorkingHoursDisplay } from '../WorkingHoursDisplay';
import { QueueJoinButton } from '../QueueJoinButton';
import { availabilityService } from '@/services/availabilityService';
import { useAuthStore } from '@/store/authStore';
import type { TimeSlot } from '@/services/availabilityService';
import { cn, formatDateToString } from '@/lib/utils';

export function SlotBookingWizard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    salon,
    selectedServices,
    selectedStaffId,
    selectedDate,
    selectedTime,
    customerName,
    customerPhone,
    customerEmail,
    customerNotes,
    totalPrice,
    totalDuration,
    toggleService,
    selectStaff,
    selectDateTime,
    setCustomerInfo,
    submitReservation,
    isSubmitting
  } = useBookingStore();

  const [activeStep, setActiveStep] = useState(1);
  const [activeSubStep, setActiveSubStep] = useState<'date' | 'time' | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [localName, setLocalName] = useState(customerName || '');
  const [localPhone, setLocalPhone] = useState(customerPhone || '');
  const [localEmail, setLocalEmail] = useState(customerEmail || '');
  const [localNotes, setLocalNotes] = useState(customerNotes || '');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const { errors, validatePhone, validateEmail, validateName } = useFormValidation();
  const { addToast } = useUIStore();

  // Kullanıcı bilgilerini otomatik doldur
  useEffect(() => {
    if (user && activeStep === 4) {
      // Sadece boşsa doldur, kullanıcı değiştirmişse üzerine yazma
      if (!localName && user.displayName) {
        setLocalName(user.displayName);
      }
      if (!localPhone && user.phone) {
        // Telefon numarasını temizle (başındaki +90 veya 0'ı kaldır)
        const cleanPhone = user.phone.replace(/^\+90/, '').replace(/^0/, '');
        setLocalPhone(cleanPhone);
      }
      if (!localEmail && user.email) {
        setLocalEmail(user.email);
      }
    }
  }, [user, activeStep]);

  useEffect(() => {
    // Personel seçimi zorunlu - sadece personel seçiliyse slot yükle
    if (selectedDate && selectedStaffId && salon) {
      loadAvailableSlots();
    } else if (selectedDate && !selectedStaffId) {
      // Personel seçilmemişse slotları temizle
      setAvailableSlots([]);
    }
  }, [selectedDate, selectedStaffId, salon, totalDuration]);

  const loadAvailableSlots = async () => {
    if (!selectedDate || !salon || !selectedStaffId) {
      console.log('Slot yükleme için gerekli bilgiler eksik:', { selectedDate, selectedStaffId });
      return;
    }
    
    setLoadingSlots(true);
    try {
      const date = new Date(selectedDate);
      
      console.log('Slot yükleniyor:', {
        businessId: salon.id,
        date: selectedDate,
        staffId: selectedStaffId,
        duration: totalDuration
      });
      
      // Personel seçimi zorunlu - sadece seçili personelin slotlarını al
      const slots = await availabilityService.getAvailableSlots({
        businessId: salon.id,
        date,
        duration: totalDuration || 30,
        staffId: selectedStaffId, // Zorunlu
        workingHours: salon.workingHours,
        staff: undefined // Personel seçimi zorunlu olduğu için liste gerekmez
      });
      
      console.log(`${slots.length} müsait slot bulundu`);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Slot yükleme hatası:', error);
      setAvailableSlots([]);
    }
    setLoadingSlots(false);
  };

  const handleStepComplete = (step: number) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps([...completedSteps, step]);
    }
    setTimeout(() => {
      if (step < 4) {
        setActiveStep(step + 1);
        if (step === 3) setActiveSubStep(null);
      }
    }, 100);
  };

  const handleDateSelect = (date: Date) => {
    const dateStr = formatDateToString(date);
    selectDateTime(dateStr, selectedTime || '');
    // Tarih seçildiğinde saat seçim alanını otomatik aç
    setActiveSubStep('time');
  };

  const handleTimeSelect = (time: string) => {
    selectDateTime(selectedDate || '', time);
    setTimeout(() => setActiveSubStep(null), 100);
  };

  const handleSubmit = async () => {
    const nameValid = validateName('name', localName);
    const phoneValid = validatePhone('phone', localPhone);
    const emailValid = localEmail ? validateEmail('email', localEmail) : true;

    if (!nameValid || !phoneValid || !emailValid) {
      addToast('Lütfen tüm bilgileri doğru girin', 'error');
      return;
    }

    if (totalPrice <= 0) {
      addToast('Lütfen hizmet seçin ve fiyat bilgisini kontrol edin', 'error');
      return;
    }

    if (!selectedDate || !selectedTime) {
      addToast('Lütfen tarih ve saat seçin', 'error');
      return;
    }

    if (!selectedStaffId) {
      addToast('Lütfen personel seçin', 'error');
      return;
    }
    
    setCustomerInfo({
      name: localName,
      phone: localPhone,
      email: localEmail,
      notes: localNotes
    });

    try {
      const reservationId = await submitReservation();
      
      if (!reservationId) {
        throw new Error('Rezervasyon oluşturulamadı. Lütfen tekrar deneyin.');
      }
      
      addToast('Randevu başarıyla oluşturuldu!', 'success');
      navigate(`/booking-success/${reservationId}`);
    } catch (error: any) {
      console.error('Rezervasyon hatası:', error);
      const errorMessage = error.message || 'Randevu oluşturulamadı. Lütfen bilgilerinizi kontrol edip tekrar deneyin.';
      addToast(errorMessage, 'error');
    }
  };

  if (!salon) return null;

  // Hizmet kontrolü
  if (!salon.services || salon.services.length === 0) {
    return (
      <div className="max-w-lg mx-auto pb-24 px-4 py-6">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 mb-3">
            <Sparkles size={16} className="text-purple-400" />
            <span className="text-sm font-semibold text-purple-300">Randevu</span>
          </div>
          <h1 className="font-display font-bold text-2xl bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent mb-1">
            {salon.name}
          </h1>
        </div>
        <div className="text-center py-16">
          <Scissors size={48} className="mx-auto text-[var(--muted-lead)] mb-4" />
          <h3 className="font-heading font-bold text-lg text-[var(--chrome-white)] mb-2">
            Henüz Hizmet Eklenmemiş
          </h3>
          <p className="text-sm text-[var(--muted-lead)]">
            Bu işletme henüz hizmet eklememiş. Lütfen daha sonra tekrar deneyin.
          </p>
        </div>
      </div>
    );
  }

  const steps = [
    { id: 1, title: 'Hizmet Seçimi', icon: Scissors, gradient: 'from-purple-500 via-pink-500 to-fuchsia-500' },
    { id: 2, title: 'Personel', icon: User, gradient: 'from-amber-500 via-orange-500 to-red-500' },
    { id: 3, title: 'Tarih & Saat', icon: Calendar, gradient: 'from-cyan-500 via-blue-500 to-indigo-500' },
    { id: 4, title: 'İletişim', icon: Clock, gradient: 'from-emerald-500 via-teal-500 to-cyan-500' }
  ];

  return (
    <div className="max-w-lg mx-auto pb-24 px-4 py-6">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 mb-3">
          <Sparkles size={16} className="text-purple-400" />
          <span className="text-sm font-semibold text-purple-300">Randevu</span>
        </div>
        <h1 className="font-display font-bold text-2xl bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent mb-1">
          {salon.name}
        </h1>
        <p className="text-sm text-[var(--muted-lead)]">Premium rezervasyon deneyimi</p>
        <WorkingHoursDisplay workingHours={salon.workingHours} label="Bugün" colorClass="text-cyan-400" />
      </div>

      <div className="space-y-3">
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = activeStep === step.id;
          const isCompleted = completedSteps.includes(step.id);
          const canAccess = step.id === 1 || completedSteps.includes(step.id - 1);

          return (
            <div key={step.id}>
              <div className={cn(
                "relative overflow-hidden rounded-3xl border backdrop-blur-xl transition-all duration-300",
                isActive 
                  ? "border-purple-500/40 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent shadow-2xl shadow-purple-500/20"
                  : isCompleted 
                  ? "border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-transparent" 
                  : "border-white/[0.08] bg-white/[0.02]",
                !canAccess && "opacity-40 pointer-events-none"
              )}>
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                )}
                
                <button
                  onClick={() => canAccess && setActiveStep(step.id)}
                  disabled={!canAccess}
                  className="w-full text-left relative z-10"
                >
                  <div className="relative flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                        isCompleted 
                          ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30" 
                          : isActive
                          ? `bg-gradient-to-br ${step.gradient} shadow-lg shadow-purple-500/30`
                          : "bg-white/5"
                      )}>
                        {isCompleted ? (
                          <CheckCircle2 size={24} className="text-[var(--chrome-white)]" />
                        ) : (
                          <Icon size={24} className={isActive ? "text-white" : "text-white/40"} />
                        )}
                      </div>
                      <div>
                        <h3 className={cn(
                          "font-heading font-bold text-base transition-colors duration-200",
                          isActive ? "text-white" : isCompleted ? "text-emerald-300" : "text-[var(--muted-lead)]"
                        )}>
                          {step.title}
                        </h3>
                        {isCompleted && !isActive && (
                          <p className="text-xs text-emerald-400/80 mt-0.5 flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            {step.id === 1 && `${selectedServices.length} hizmet`}
                            {step.id === 2 && salon.staff.find(s => s.id === selectedStaffId)?.name}
                            {step.id === 3 && `${selectedDate} - ${selectedTime}`}
                            {step.id === 4 && 'Tamamlandı'}
                          </p>
                        )}
                      </div>
                    </div>
                    <ChevronDown 
                      size={20} 
                      className={cn(
                        "transition-all duration-300",
                        isActive ? "rotate-180 text-purple-300" : "text-[var(--muted-lead)]"
                      )} 
                    />
                  </div>
                </button>

                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="overflow-hidden relative z-20"
                      >
                        <div className="px-4 pb-4 space-y-3">
                          {step.id === 1 && (
                            <>
                              {salon.services.map((service) => (
                                <button
                                  key={service.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleService(service);
                                  }}
                                  className={cn(
                                    "w-full p-4 rounded-2xl border text-left transition-all duration-200",
                                    selectedServices.some(s => s.id === service.id)
                                      ? "border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-pink-500/5 shadow-lg"
                                      : "border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] active:scale-[0.98]"
                                  )}
                                >
                                  <div className="flex justify-between items-center">
                                    <div className="flex-1">
                                      <h4 className="font-heading font-bold text-base text-[var(--chrome-white)] mb-1">
                                        {service.name}
                                      </h4>
                                      <p className="text-xs text-[var(--muted-lead)]">{service.duration} dakika</p>
                                    </div>
                                    <div className="flex items-center gap-3 ml-3">
                                      <span className="font-bold text-lg bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                        {service.price}₺
                                      </span>
                                      {selectedServices.some(s => s.id === service.id) && (
                                        <CheckCircle2 size={20} className="text-emerald-400" />
                                      )}
                                    </div>
                                  </div>
                                </button>
                              ))}
                              {selectedServices.length > 0 && (
                                <>
                                  <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-[var(--muted-lead)]">Toplam</span>
                                      <span className="font-bold text-2xl bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                                        {totalPrice}₺
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStepComplete(1);
                                    }}
                                    className="w-full h-12 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-fuchsia-500 hover:shadow-2xl hover:shadow-purple-500/40 text-[var(--chrome-white)] font-heading font-bold transition-all duration-200 active:scale-[0.98]"
                                  >
                                    Devam Et
                                  </button>
                                </>
                              )}
                            </>
                          )}

                          {step.id === 2 && (
                            <>
                              {(!salon.staff || salon.staff.length === 0) ? (
                                <div className="text-center py-8">
                                  <User size={32} className="mx-auto text-[var(--muted-lead)] mb-3" />
                                  <p className="text-sm text-[var(--muted-lead)] mb-2">
                                    Bu işletmede henüz personel bulunmuyor.
                                  </p>
                                  <p className="text-xs text-red-400">
                                    Randevu alabilmek için personel seçimi gereklidir.
                                  </p>
                                </div>
                              ) : (
                                <>
                                  <div className="mb-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                    <p className="text-xs text-purple-300 text-center">
                                      ⚠️ Personel seçimi zorunludur. Seçtiğiniz personelin müsait saatlerini görebilirsiniz.
                                    </p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                              {salon.staff.map((staff) => (
                                <button
                                  key={staff.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    selectStaff(staff.id);
                                    handleStepComplete(2);
                                  }}
                                  className={cn(
                                    "p-4 rounded-2xl border text-center transition-all duration-200",
                                    selectedStaffId === staff.id
                                      ? "border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-pink-500/5 shadow-lg"
                                      : "border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] active:scale-[0.98]"
                                  )}
                                >
                                  <img
                                    src={staff.photo}
                                    alt={staff.name}
                                    className="w-16 h-16 rounded-2xl mx-auto mb-3 object-cover ring-2 ring-white/10"
                                  />
                                  <h4 className="font-heading font-bold text-sm text-[var(--chrome-white)] mb-1">
                                    {staff.name}
                                  </h4>
                                  <p className="text-xs text-[var(--muted-lead)]">{staff.title}</p>
                                  {selectedStaffId === staff.id && (
                                    <div className="mt-2 flex items-center justify-center gap-1 text-emerald-400">
                                      <CheckCircle2 size={14} />
                                      <span className="text-xs font-semibold">Seçildi</span>
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                                </>
                              )}
                            </>
                          )}

                          {step.id === 3 && (
                            <>
                              {!selectedStaffId && (
                                <div className="mb-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/30">
                                  <p className="text-sm text-red-300 text-center">
                                    ⚠️ Önce personel seçmelisiniz
                                  </p>
                                </div>
                              )}
                              <div className={cn(
                                "rounded-2xl border transition-all duration-200",
                                !selectedStaffId && "opacity-50 pointer-events-none",
                                activeSubStep === 'date' 
                                  ? "border-purple-500/40 bg-gradient-to-br from-purple-500/5 to-transparent" 
                                  : selectedDate 
                                  ? "border-emerald-500/30 bg-emerald-500/5"
                                  : "border-white/[0.06] bg-white/[0.02]"
                              )}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveSubStep(activeSubStep === 'date' ? null : 'date');
                                  }}
                                  className="w-full p-3 flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-2">
                                    <Calendar size={18} className={selectedDate ? "text-emerald-400" : "text-purple-400"} />
                                    <span className="font-semibold text-sm text-[var(--chrome-white)]">
                                      {selectedDate || 'Tarih Seçin'}
                                    </span>
                                  </div>
                                  {selectedDate && <CheckCircle2 size={18} className="text-emerald-400" />}
                                </button>
                                <AnimatePresence>
                                  {activeSubStep === 'date' && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <div className="px-3 pb-3">
                                        <ModernCalendar
                                          selectedDate={selectedDate ? new Date(selectedDate) : null}
                                          onSelect={handleDateSelect}
                                          minDate={new Date()}
                                          workingHours={salon.workingHours}
                                          businessId={salon.id}
                                          serviceDuration={totalDuration}
                                          staffId={selectedStaffId || undefined}
                                          staff={salon.staff}
                                        />
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>

                              {selectedDate && (
                                <div className={cn(
                                  "rounded-2xl border transition-all duration-200",
                                  activeSubStep === 'time' 
                                    ? "border-purple-500/40 bg-gradient-to-br from-purple-500/5 to-transparent" 
                                    : selectedTime 
                                    ? "border-emerald-500/30 bg-emerald-500/5"
                                    : "border-white/[0.06] bg-white/[0.02]"
                                )}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveSubStep(activeSubStep === 'time' ? null : 'time');
                                    }}
                                    className="w-full p-3 flex items-center justify-between"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Clock size={18} className={selectedTime ? "text-emerald-400" : "text-purple-400"} />
                                      <span className="font-semibold text-sm text-[var(--chrome-white)]">
                                        {selectedTime || 'Saat Seçin'}
                                      </span>
                                    </div>
                                    {selectedTime && <CheckCircle2 size={18} className="text-emerald-400" />}
                                  </button>
                                  <AnimatePresence>
                                    {activeSubStep === 'time' && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                      >
                                        <div className="px-3 pb-3">
                                          {loadingSlots ? (
                                            <div className="text-center py-8">
                                              <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-3" />
                                              <p className="text-sm font-semibold text-[var(--chrome-white)] mb-1">Müsait saatler yükleniyor...</p>
                                              <p className="text-xs text-[var(--muted-lead)]">Lütfen bekleyin</p>
                                            </div>
                                          ) : !selectedStaffId ? (
                                            <div className="text-center py-6 text-sm text-red-400">
                                              Önce personel seçmelisiniz
                                            </div>
                                          ) : availableSlots.length > 0 ? (
                                            <>
                                              <div className="mb-3 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                                <p className="text-xs text-emerald-300 text-center">
                                                  ✓ {availableSlots.length} müsait saat bulundu
                                                </p>
                                              </div>
                                              <TimeSlotGrid
                                                slots={availableSlots.map(slot => ({
                                                  time: slot.startTime,
                                                  available: slot.available
                                                }))}
                                                selectedTime={selectedTime}
                                                onSelect={handleTimeSelect}
                                              />
                                            </>
                                          ) : (
                                            <>
                                              <div className="text-center py-6">
                                                <Clock size={32} className="mx-auto text-[var(--muted-lead)] mb-3" />
                                                <p className="text-sm text-[var(--muted-lead)] mb-1">
                                                  Bu tarihte müsait saat yok
                                                </p>
                                                <p className="text-xs text-[var(--ash)]">
                                                  Seçili personelin bu gündeki tüm saatleri dolu
                                                </p>
                                              </div>
                                              
                                              {/* Sıraya Ekle Butonu - Her zaman göster */}
                                              {selectedServices.length > 0 && (
                                                <div className="mb-4">
                                                  <QueueJoinButton
                                                    salon={salon}
                                                    selectedServices={selectedServices}
                                                    selectedStaffId={selectedStaffId}
                                                    preferredDate={selectedDate}
                                                    preferredTime={selectedTime}
                                                    totalPrice={totalPrice}
                                                    totalDuration={totalDuration}
                                                    customerName={localName}
                                                    customerPhone={localPhone}
                                                    customerEmail={localEmail}
                                                    customerNotes={localNotes}
                                                    onSuccess={() => {
                                                      addToast('Sıraya eklendiniz! İşletme sizi arayacaktır.', 'success');
                                                      navigate('/appointments');
                                                    }}
                                                  />
                                                </div>
                                              )}
                                              
                                              {selectedStaffId && selectedDate && salon.staff && (
                                                <AlternativeSuggestions
                                                  type="staff"
                                                  selectedId={selectedStaffId}
                                                  selectedName={salon.staff.find(s => s.id === selectedStaffId)?.name || ''}
                                                  date={new Date(selectedDate)}
                                                  duration={totalDuration || 30}
                                                  workingHours={salon.workingHours}
                                                  allStaff={salon.staff}
                                                  onSelect={(id, name) => {
                                                    selectStaff(id);
                                                    setActiveSubStep('time');
                                                  }}
                                                />
                                              )}
                                            </>
                                          )}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              )}

                              {selectedDate && selectedTime && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStepComplete(3);
                                  }}
                                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 hover:shadow-2xl hover:shadow-cyan-500/40 text-[var(--chrome-white)] font-heading font-bold transition-all duration-200 active:scale-[0.98]"
                                >
                                  Devam Et
                                </button>
                              )}
                            </>
                          )}

                          {step.id === 4 && (
                            <>
                              <input
                                type="text"
                                value={localName}
                                onChange={(e) => setLocalName(e.target.value)}
                                placeholder="Ad Soyad"
                                className="w-full h-12 px-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all"
                              />
                              <input
                                type="tel"
                                value={localPhone}
                                onChange={(e) => {
                                  const cleaned = e.target.value.replace(/\D/g, '');
                                  setLocalPhone(cleaned.slice(0, 10));
                                }}
                                placeholder="5XX XXX XX XX"
                                maxLength={10}
                                className="w-full h-12 px-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all"
                              />
                              <input
                                type="email"
                                value={localEmail}
                                onChange={(e) => setLocalEmail(e.target.value)}
                                placeholder="E-posta (opsiyonel)"
                                className="w-full h-12 px-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all"
                              />
                              <textarea
                                value={localNotes}
                                onChange={(e) => setLocalNotes(e.target.value)}
                                placeholder="Notlar (opsiyonel)"
                                rows={2}
                                className="w-full px-4 py-3 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all resize-none"
                              />
                              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-[var(--muted-lead)]">Toplam Tutar</span>
                                  <span className="font-bold text-2xl bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                                    {totalPrice}₺
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSubmit();
                                }}
                                disabled={isSubmitting}
                                className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:shadow-2xl hover:shadow-emerald-500/40 text-[var(--chrome-white)] font-heading font-bold text-lg transition-all duration-200 disabled:opacity-50 active:scale-[0.98]"
                              >
                                {isSubmitting ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Oluşturuluyor...</span>
                                  </div>
                                ) : (
                                  'Randevu Oluştur'
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
