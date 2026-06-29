import { useState, useEffect } from 'react';
import { useBookingStore } from '@/store/bookingStore';
import { useNavigate } from 'react-router-dom';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useUIStore } from '@/store/uiStore';
import { Calendar, Clock, User, CheckCircle2, ChevronDown, Sparkles, Scissors, Loader2, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ModernCalendar } from '../ModernCalendar';
import { ModernTimePicker } from '../ModernTimePicker';
import { useAuthStore } from '@/store/authStore';
import { getStaffAvatarUrl } from '@/utils/avatarHelpers';
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
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [localName, setLocalName] = useState(customerName || '');
  const [localPhone, setLocalPhone] = useState(customerPhone || '');
  const [localEmail, setLocalEmail] = useState(customerEmail || '');
  const [localNotes, setLocalNotes] = useState(customerNotes || '');
  const [localAddress, setLocalAddress] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const { errors, validatePhone, validateEmail, validateName } = useFormValidation();
  const { addToast } = useUIStore();

  // Kullanıcı bilgilerini otomatik doldur
  useEffect(() => {
    const customerInfoStep = salon?.staff && salon.staff.length > 0 && salon.category !== 'restoran' ? 4 : 3;
    if (user && activeStep === customerInfoStep) {
      if (!localName && user.displayName) {
        setLocalName(user.displayName);
      }
      if (!localPhone && user.phone) {
        const cleanPhone = user.phone.replace(/^\+90/, '').replace(/^0/, '');
        setLocalPhone(cleanPhone);
      }
      if (!localEmail && user.email) {
        setLocalEmail(user.email);
      }
    }
  }, [user, activeStep, salon?.staff]);

  const handleStepComplete = (step: number) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps([...completedSteps, step]);
    }
    setTimeout(() => {
      const maxStep = salon?.staff && salon.staff.length > 0 && salon.category !== 'restoran' ? 4 : 3;
      if (step < maxStep) {
        setActiveStep(step + 1);
      }
    }, 100);
  };

  const handleDateTimeSelect = (date: Date, time: string) => {
    const dateStr = formatDateToString(date);
    selectDateTime(dateStr, time);
  };

  const handleSubmit = async () => {
    const nameValid = validateName('name', localName);
    const phoneValid = validatePhone('phone', localPhone);
    const emailValid = localEmail ? validateEmail('email', localEmail) : true;

    if (!nameValid || !phoneValid || !emailValid) {
      addToast('Lütfen tüm bilgileri doğru girin', 'error');
      return;
    }

    if (totalPrice <= 0 && salon.category !== 'restoran') {
      addToast('Lütfen hizmet seçin ve fiyat bilgisini kontrol edin', 'error');
      return;
    }

    if (!selectedDate || !selectedTime) {
      addToast('Lütfen tarih ve saat seçin', 'error');
      return;
    }

    const hasStaff = salon?.staff && salon.staff.length > 0 && salon.category !== 'restoran';
    
    if (hasStaff && !selectedStaffId) {
      addToast('Lütfen personel seçin', 'error');
      return;
    }
    
    setCustomerInfo({
      name: localName,
      phone: localPhone,
      email: localEmail,
      notes: localNotes,
      address: localAddress
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

  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      addToast('Tarayıcınız konum özelliğini desteklemiyor', 'error');
      return;
    }

    setGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=tr`
          );
          
          if (response.ok) {
            const data = await response.json();
            const address = data.display_name || `${latitude}, ${longitude}`;
            setLocalAddress(address);
            addToast('Konum alındı!', 'success');
          } else {
            setLocalAddress(`Konum: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
            addToast('Konum koordinatları alındı', 'success');
          }
        } catch (error) {
          const { latitude, longitude } = position.coords;
          setLocalAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          addToast('Konum koordinatları alındı', 'success');
        }
        setGettingLocation(false);
      },
      (error) => {
        setGettingLocation(false);
        let message = 'Konum alınamadı';
        if (error.code === error.PERMISSION_DENIED) {
          message = 'Konum izni reddedildi';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = 'Konum bilgisi kullanılamıyor';
        } else if (error.code === error.TIMEOUT) {
          message = 'Konum alma zaman aşımına uğradı';
        }
        addToast(message, 'error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  if (!salon) return null;

  if (!salon.services || salon.services.length === 0) {
    return (
      <div className="max-w-lg md:max-w-xl lg:max-w-2xl mx-auto pb-24 px-4 md:px-6 py-6">
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
    { 
      id: 1, 
      title: salon.category === 'restoran' ? 'Masa Seçimi' : 'Hizmet Seçimi', 
      icon: Scissors, 
      gradient: 'from-purple-500 via-pink-500 to-fuchsia-500' 
    },
    ...(salon.staff && salon.staff.length > 0 && salon.category !== 'restoran' ? [
      { id: 2, title: 'Personel', icon: User, gradient: 'from-amber-500 via-orange-500 to-red-500' }
    ] : []),
    { 
      id: (salon.staff && salon.staff.length > 0 && salon.category !== 'restoran') ? 3 : 2, 
      title: 'Tarih & Saat', 
      icon: Calendar, 
      gradient: 'from-cyan-500 via-blue-500 to-indigo-500' 
    },
    { 
      id: (salon.staff && salon.staff.length > 0 && salon.category !== 'restoran') ? 4 : 3, 
      title: 'İletişim', 
      icon: Clock, 
      gradient: 'from-emerald-500 via-teal-500 to-cyan-500' 
    }
  ];

  return (
    <div className="max-w-lg md:max-w-xl lg:max-w-2xl mx-auto pb-24 px-4 md:px-6 py-6">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 mb-3">
          <Sparkles size={16} className="text-purple-400" />
          <span className="text-sm font-semibold text-purple-300">
            {salon.category === 'restoran' ? 'Masa Rezervasyonu' : 'Randevu'}
          </span>
        </div>
        <h1 className="font-display font-bold text-2xl bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent mb-1">
          {salon.name}
        </h1>
        <p className="text-sm text-[var(--muted-lead)]">
          {salon.category === 'restoran' ? 'Masa rezervasyonu yapın' : 'Premium rezervasyon deneyimi'}
        </p>
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
                            {step.id === 1 && salon.category === 'restoran' && `${selectedServices.length} masa seçildi`}
                            {step.id === 1 && salon.category !== 'restoran' && `${selectedServices.length} hizmet`}
                            {step.id === 2 && salon.staff && salon.staff.length > 0 && salon.staff.find(s => s.id === selectedStaffId)?.name}
                            {step.id === (salon.staff && salon.staff.length > 0 && salon.category !== 'restoran' ? 3 : 2) && `${selectedDate} - ${selectedTime}`}
                            {step.id === (salon.staff && salon.staff.length > 0 && salon.category !== 'restoran' ? 4 : 3) && 'Tamamlandı'}
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
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="overflow-hidden relative z-20"
                      >
                        <div className="px-4 pb-4 space-y-3">
                          {step.id === 1 && (
                            <>
                              {salon.services.map((service) => {
                                const isTable = salon.category === 'restoran';
                                const capacity = isTable ? (service as any).pricingRules?.maxGuests || 4 : null;
                                
                                return (
                                  <button
                                    key={service.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Restoranda sadece 1 masa seçilebilir
                                      if (isTable && selectedServices.length > 0 && !selectedServices.some(s => s.id === service.id)) {
                                        return; // Zaten bir masa seçili, değiştirmek için önce seçili olanı kaldır
                                      }
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
                                        <p className="text-xs text-[var(--muted-lead)]">
                                          {isTable 
                                            ? `${capacity} kişilik masa` 
                                            : `${service.duration} dakika`}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-3 ml-3">
                                        {service.price > 0 && (
                                          <span className="font-bold text-lg bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                            {service.price}₺
                                          </span>
                                        )}
                                        {selectedServices.some(s => s.id === service.id) && (
                                          <CheckCircle2 size={20} className="text-emerald-400" />
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                              {selectedServices.length > 0 && (
                                <>
                                  {totalPrice > 0 && (
                                    <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-[var(--muted-lead)]">Toplam</span>
                                        <span className="font-bold text-2xl bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                                          {totalPrice}₺
                                        </span>
                                      </div>
                                    </div>
                                  )}
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

                          {step.id === 2 && salon.staff && salon.staff.length > 0 && salon.category !== 'restoran' && (
                            <>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {salon.staff.map((staff) => {
                                  const avatarUrl = getStaffAvatarUrl(staff.photo, staff.name);
                                  return (
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
                                        src={avatarUrl}
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
                                  );
                                })}
                              </div>
                            </>
                          )}

                          {step.id === (salon.staff && salon.staff.length > 0 && salon.category !== 'restoran' ? 3 : 2) && (
                            <>
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-[var(--chrome-white)] mb-2">Randevu Tarihi</h4>
                                <ModernCalendar
                                  selectedDate={selectedDate ? new Date(selectedDate) : null}
                                  onSelect={(date) => {
                                    const dateStr = formatDateToString(date);
                                    selectDateTime(dateStr, selectedTime || '');
                                  }}
                                  minDate={new Date()}
                                  workingHours={salon.workingHours}
                                />
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-[var(--chrome-white)] mb-2">Randevu Saati</h4>
                                <ModernTimePicker
                                  value={selectedTime || ''}
                                  onChange={(time) => selectDateTime(selectedDate || '', time)}
                                  workingHours={
                                    selectedDate && salon?.workingHours ? (() => {
                                      // Seçilen tarihin gününe göre çalışma saatlerini al
                                      const date = new Date(selectedDate);
                                      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                                      const dayName = dayNames[date.getDay()];
                                      const dayHours = salon.workingHours[dayName];
                                      
                                      if (dayHours && dayHours.open && dayHours.close) {
                                        return {
                                          start: dayHours.open,
                                          end: dayHours.close
                                        };
                                      }
                                      
                                      // Fallback: İlk açık günün saatlerini kullan
                                      const firstOpenDay = Object.values(salon.workingHours).find(h => h && h.open && h.close);
                                      return firstOpenDay ? {
                                        start: firstOpenDay.open,
                                        end: firstOpenDay.close
                                      } : undefined;
                                    })() : undefined
                                  }
                                  intervalMinutes={30}
                                  label="Randevu saati seçin"
                                />
                              </div>
                              {selectedDate && selectedTime && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStepComplete(salon.staff && salon.staff.length > 0 && salon.category !== 'restoran' ? 3 : 2);
                                  }}
                                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 hover:shadow-2xl hover:shadow-cyan-500/40 text-[var(--chrome-white)] font-heading font-bold transition-all duration-200 active:scale-[0.98]"
                                >
                                  Devam Et
                                </button>
                              )}
                            </>
                          )}

                          {step.id === (salon.staff && salon.staff.length > 0 && salon.category !== 'restoran' ? 4 : 3) && (
                            <div className="space-y-3">
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
                              
                              {/* Adres Alanı - Sadece Mobil Hizmet Varsa */}
                              {salon.settings?.mobileService && (
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 dark:text-[var(--chrome-white)] mb-2">
                                    Hizmet Adresi
                                    <span className="text-xs text-[var(--muted-lead)] ml-2">(Konuma hizmet için)</span>
                                  </h4>
                                  <div className="space-y-2">
                                    <button
                                      type="button"
                                      onClick={handleGetLocation}
                                      disabled={gettingLocation}
                                      className="w-full h-12 px-4 rounded-2xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 hover:border-blue-500/50 text-blue-300 font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                      {gettingLocation ? (
                                        <>
                                          <Loader2 size={18} className="animate-spin" />
                                          <span>Konum alınıyor...</span>
                                        </>
                                      ) : (
                                        <>
                                          <MapPin size={18} />
                                          <span>Konumumu Al</span>
                                        </>
                                      )}
                                    </button>
                                    <textarea
                                      value={localAddress}
                                      onChange={(e) => setLocalAddress(e.target.value)}
                                      placeholder="Hizmet alınacak adres..."
                                      rows={3}
                                      className="w-full px-4 py-3 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all resize-none"
                                    />
                                  </div>
                                </div>
                              )}
                              
                              <textarea
                                value={localNotes}
                                onChange={(e) => setLocalNotes(e.target.value)}
                                placeholder="Notlar (opsiyonel)"
                                rows={2}
                                className="w-full px-4 py-3 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all resize-none"
                              />
                              {totalPrice > 0 && (
                                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-[var(--muted-lead)]">Toplam Tutar</span>
                                    <span className="font-bold text-2xl bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                                      {totalPrice}₺
                                    </span>
                                  </div>
                                </div>
                              )}
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
                                  salon.category === 'restoran' ? 'Rezervasyon Oluştur' : 'Randevu Oluştur'
                                )}
                              </button>
                            </div>
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
