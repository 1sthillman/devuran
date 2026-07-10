import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookingStore } from '@/store/bookingStore';
import { useAuthStore } from '@/store/authStore';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useUIStore } from '@/store/uiStore';
import { Calendar, Users, Bed, CheckCircle2, ChevronDown, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ModernCalendar } from '../ModernCalendar';
import { ModernTimePicker } from '../ModernTimePicker';
import { QueueJoinButton } from '../QueueJoinButton';
import { differenceInDays } from 'date-fns';
import { servicesService } from '@/services/firebaseService';
import { accommodationAvailabilityService, type RoomAvailability } from '@/services/accommodationAvailabilityService';
import type { Service } from '@/types';
import { cn, formatDateToString } from '@/lib/utils';
import { 
  getExtraPriceType, 
  calcExtraTotal, 
  getDefaultQuantity, 
  getPriceLabel,
  getPriceFormula 
} from '@/utils/extraServicePricing';

export function NightlyBookingWizard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    salon,
    setAccommodationDetails,
    setCustomerInfo,
    submitReservation,
    isSubmitting,
    customerName,
    customerPhone,
    customerEmail,
  } = useBookingStore();

  const [activeStep, setActiveStep] = useState(1);
  const [activeSubStep, setActiveSubStep] = useState<'checkIn' | 'checkOut' | 'guests' | null>('checkIn');
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [checkInTime, setCheckInTime] = useState('14:00'); // 🆕 Varsayılan check-in saati
  const [checkOutTime, setCheckOutTime] = useState('11:00'); // 🆕 Varsayılan check-out saati
  const [selectedRoom, setSelectedRoom] = useState<Service | null>(null);
  const [guests, setGuests] = useState({ adults: 2, children: 0 });
  const [roomTypes, setRoomTypes] = useState<Service[]>([]);
  const [extraServices, setExtraServices] = useState<Service[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [extraQuantities, setExtraQuantities] = useState<Record<string, number>>({}); // 🆕 Ek hizmet miktarları
  const [loading, setLoading] = useState(true);
  const [roomAvailabilities, setRoomAvailabilities] = useState<RoomAvailability[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [localName, setLocalName] = useState(customerName || '');
  const [localPhone, setLocalPhone] = useState(customerPhone || '');
  const [localEmail, setLocalEmail] = useState(customerEmail || '');
  const [specialRequests, setSpecialRequests] = useState('');
  const { errors, validatePhone, validateEmail, validateName } = useFormValidation();
  const { addToast } = useUIStore();

  // Kullanıcı bilgilerini otomatik doldur
  useEffect(() => {
    if (user && activeStep === 3) {
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
  }, [user, activeStep]);

  useEffect(() => {
    if (salon?.id) {
      loadServices();
    }
  }, [salon?.id]);

  useEffect(() => {
    if (checkInDate && checkOutDate && salon?.id && roomTypes.length > 0) {
      checkRoomAvailabilities();
    }
  }, [checkInDate, checkOutDate, salon?.id, roomTypes]);

  const checkRoomAvailabilities = async () => {
    if (!checkInDate || !checkOutDate || !salon?.id) return;
    
    setCheckingAvailability(true);
    try {
      const availabilities = await accommodationAvailabilityService.getAvailableRooms(
        salon.id,
        roomTypes,
        checkInDate,
        checkOutDate
      );
      setRoomAvailabilities(availabilities);
    } catch (error) {
      console.error('Müsaitlik kontrolü hatası:', error);
    }
    setCheckingAvailability(false);
  };

  const loadServices = async () => {
    try {
      const services = await servicesService.getBySalon(salon!.id);
      const rooms = services.filter(s => 
        s.category.includes('Oda') || 
        s.category.includes('Villa') || 
        s.category.includes('Bungalov') || 
        s.category.includes('Konaklama') ||
        s.category.includes('Alan')
      );
      const extras = services.filter(s => s.category.includes('Ek Hizmet'));
      setRoomTypes(rooms);
      setExtraServices(extras);
    } catch (error) {
      console.error('Hizmetler yüklenirken hata:', error);
      addToast('Hizmetler yüklenirken bir hata oluştu', 'error');
    }
    setLoading(false);
  };

  const nights = checkInDate && checkOutDate ? differenceInDays(checkOutDate, checkInDate) : 0;
  
  // 🆕 Gelişmiş ek hizmet fiyat hesaplama (tek kaynak - yardımcı fonksiyon)
  const extrasTotal = selectedExtras.reduce((sum, extraId) => {
    const extra = extraServices.find(e => e.id === extraId);
    if (!extra) return sum;
    
    const quantity = extraQuantities[extraId] || getDefaultQuantity(extra, nights);
    const totalGuests = guests.adults + guests.children;
    const extraPrice = calcExtraTotal(extra, quantity, totalGuests);
    
    console.log(`💰 ${extra.name}: ${getPriceFormula(extra, quantity, totalGuests, extraPrice)}`);
    
    return sum + extraPrice;
  }, 0);
  
  const totalPrice = selectedRoom && nights > 0 ? selectedRoom.price * nights + extrasTotal : 0;

  const handleCheckInSelect = (date: Date) => {
    setCheckInDate(date);
    if (checkOutDate && date >= checkOutDate) {
      setCheckOutDate(null);
    }
    // 🔥 Tarih değiştiğinde tüm ilgili state'leri temizle
    setRoomAvailabilities([]);
    setSelectedRoom(null);
    setSelectedExtras([]);
    setExtraQuantities({});
    // Adım 2 ve 3'ü "tamamlanmamış" yap (kullanıcı yeniden seçmeli)
    setCompletedSteps(prev => prev.filter(s => s < 2));
    // Tarih seçildiğinde otomatik collapse yap ve check-out aç
    setTimeout(() => setActiveSubStep('checkOut'), 200);
  };

  const handleCheckOutSelect = (date: Date) => {
    setCheckOutDate(date);
    // 🔥 Tarih değiştiğinde tüm ilgili state'leri temizle
    setRoomAvailabilities([]);
    setSelectedRoom(null);
    setSelectedExtras([]);
    setExtraQuantities({});
    // Adım 2 ve 3'ü "tamamlanmamış" yap (kullanıcı yeniden seçmeli)
    setCompletedSteps(prev => prev.filter(s => s < 2));
    // Check-out seçildiğinde otomatik collapse yap ve misafir aç
    setTimeout(() => setActiveSubStep('guests'), 200);
  };

  const handleGuestsConfirm = () => {
    // Misafir seçimi tamamlandığında otomatik collapse yap
    setTimeout(() => setActiveSubStep(null), 200);
  };

  const handleStepComplete = (step: number) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps([...completedSteps, step]);
    }
    setTimeout(() => {
      if (step < 3) {
        setActiveStep(step + 1);
        if (step === 1) setActiveSubStep(null);
      }
    }, 100);
  };

  const handleSubmit = async () => {
    const nameValid = validateName('name', localName);
    const phoneValid = validatePhone('phone', localPhone);
    const emailValid = localEmail ? validateEmail('email', localEmail) : true;

    if (!nameValid || !phoneValid || !emailValid) {
      addToast('Lütfen tüm bilgileri doğru girin', 'error');
      return;
    }

    if (!selectedRoom || nights <= 0 || totalPrice <= 0) {
      addToast('Lütfen tüm bilgileri eksiksiz doldurun', 'error');
      return;
    }

    setCustomerInfo({
      name: localName,
      phone: localPhone,
      email: localEmail,
      notes: specialRequests
    });

    setAccommodationDetails({
      checkIn: checkInDate ? formatDateToString(checkInDate) : undefined,
      checkInTime,
      checkOut: checkOutDate ? formatDateToString(checkOutDate) : undefined,
      checkOutTime,
      guests,
      roomType: selectedRoom?.id,
      selectedPackage: selectedRoom,
      extras: selectedExtras.map(id => {
        const extra = extraServices.find(e => e.id === id);
        if (!extra) return null;
        return {
          ...extra,
          quantity: extraQuantities[id] || nights, // 🆕 Miktar bilgisi
          priceType: extra.pricingRules?.priceType || 'fixed',
        };
      }).filter(Boolean),
      totalPrice,
      specialRequests
    });

    try {
      const reservationId = await submitReservation();
      if (!reservationId) throw new Error('Rezervasyon ID alınamadı');
      addToast('Rezervasyon başarıyla oluşturuldu!', 'success');
      navigate(`/booking-success/${reservationId}`);
    } catch (error: any) {
      addToast(error.message || 'Rezervasyon oluşturulamadı', 'error');
    }
  };

  if (!salon || loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/10 border-t-[var(--liquid-chrome)] rounded-full animate-spin" />
    </div>
  );

  if (roomTypes.length === 0) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h3 className="font-bold text-lg text-[var(--chrome-white)] mb-2">Henüz Konaklama Seçeneği Yok</h3>
        <p className="text-sm text-[var(--muted-lead)]">Bu işletme henüz konaklama hizmeti eklememiş.</p>
      </div>
    </div>
  );

  const steps = [
    { id: 1, title: 'Tarih & Misafir', icon: Calendar, gradient: 'from-indigo-500 via-purple-500 to-pink-500' },
    { id: 2, title: 'Oda Seçimi', icon: Bed, gradient: 'from-rose-500 via-pink-500 to-fuchsia-500' },
    { id: 3, title: 'İletişim', icon: Users, gradient: 'from-emerald-500 via-teal-500 to-cyan-500' }
  ];

  return (
    <div className="max-w-lg md:max-w-xl lg:max-w-2xl mx-auto pb-24 px-4 md:px-6 py-6">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 mb-3">
          <Sparkles size={16} className="text-purple-400" />
          <span className="text-sm font-semibold text-purple-300">Konaklama</span>
        </div>
        <h1 className="font-display font-bold text-2xl bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent mb-1">
          {salon.name}
        </h1>
        <p className="text-sm text-[var(--muted-lead)]">Premium rezervasyon deneyimi</p>
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
                            {step.id === 1 && `${nights} gece, ${guests.adults + guests.children} kişi`}
                            {step.id === 2 && selectedRoom?.name}
                            {step.id === 3 && 'Tamamlandı'}
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
                              {/* Giriş Tarihi */}
                              <div className={cn(
                                "rounded-2xl border transition-all duration-200",
                                activeSubStep === 'checkIn' 
                                  ? "border-purple-500/40 bg-gradient-to-br from-purple-500/5 to-transparent" 
                                  : checkInDate 
                                  ? "border-emerald-500/30 bg-emerald-500/5"
                                  : "border-white/[0.06] bg-white/[0.02]"
                              )}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveSubStep(activeSubStep === 'checkIn' ? null : 'checkIn');
                                  }}
                                  className="w-full p-3 flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-2">
                                    <Calendar size={18} className={checkInDate ? "text-emerald-400" : "text-purple-400"} />
                                    <span className="font-semibold text-sm text-[var(--chrome-white)]">
                                      {checkInDate 
                                        ? checkInDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
                                        : 'Giriş Tarihi'}
                                    </span>
                                  </div>
                                  {checkInDate && <CheckCircle2 size={18} className="text-emerald-400" />}
                                </button>
                                <AnimatePresence>
                                  {activeSubStep === 'checkIn' && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <div className="px-3 pb-3">
                                        <ModernCalendar
                                          selectedDate={checkInDate}
                                          onSelect={handleCheckInSelect}
                                          minDate={new Date()}
                                        />
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>

                              {/* Çıkış Tarihi */}
                              {checkInDate && (
                                <div className={cn(
                                  "rounded-2xl border transition-all duration-200",
                                  activeSubStep === 'checkOut' 
                                    ? "border-purple-500/40 bg-gradient-to-br from-purple-500/5 to-transparent" 
                                    : checkOutDate 
                                    ? "border-emerald-500/30 bg-emerald-500/5"
                                    : "border-white/[0.06] bg-white/[0.02]"
                                )}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveSubStep(activeSubStep === 'checkOut' ? null : 'checkOut');
                                    }}
                                    className="w-full p-3 flex items-center justify-between"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Calendar size={18} className={checkOutDate ? "text-emerald-400" : "text-purple-400"} />
                                      <span className="font-semibold text-sm text-[var(--chrome-white)]">
                                        {checkOutDate 
                                          ? checkOutDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
                                          : 'Çıkış Tarihi'}
                                      </span>
                                    </div>
                                    {checkOutDate && <CheckCircle2 size={18} className="text-emerald-400" />}
                                  </button>
                                  <AnimatePresence>
                                    {activeSubStep === 'checkOut' && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                      >
                                        <div className="px-3 pb-3">
                                          <ModernCalendar
                                            selectedDate={checkOutDate}
                                            onSelect={handleCheckOutSelect}
                                            minDate={new Date(checkInDate.getTime() + 86400000)}
                                          />
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              )}

                              {/* Gece Sayısı Badge */}
                              {nights > 0 && (
                                <motion.div
                                  initial={{ scale: 0.95, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ duration: 0.2 }}
                                  className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-fuchsia-500/10 border border-purple-500/20"
                                >
                                  <div className="flex items-center justify-center gap-2">
                                    <Sparkles size={16} className="text-purple-400" />
                                    <span className="font-bold text-lg bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                                      {nights} Gece Konaklama
                                    </span>
                                  </div>
                                </motion.div>
                              )}

                              {/* Check-in/out Saat Seçimi */}
                              {nights > 0 && (
                                <motion.div
                                  initial={{ scale: 0.95, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ duration: 0.2, delay: 0.1 }}
                                  className="space-y-3"
                                >
                                  <div>
                                    <h4 className="text-sm font-semibold text-[var(--chrome-white)] mb-2">
                                      Check-in Saati
                                    </h4>
                                    <ModernTimePicker
                                      value={checkInTime}
                                      onChange={setCheckInTime}
                                      minTime="06:00"
                                      maxTime="23:00"
                                      intervalMinutes={30}
                                      label="Check-in saati seçin"
                                    />
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-semibold text-[var(--chrome-white)] mb-2">
                                      Check-out Saati
                                    </h4>
                                    <ModernTimePicker
                                      value={checkOutTime}
                                      onChange={setCheckOutTime}
                                      minTime="06:00"
                                      maxTime="23:00"
                                      intervalMinutes={30}
                                      label="Check-out saati seçin"
                                    />
                                  </div>
                                  <p className="text-xs text-center text-[var(--muted-lead)] mt-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                    💡 Standart check-in: 14:00 / check-out: 11:00
                                  </p>
                                </motion.div>
                              )}

                              {/* Misafir Seçimi */}
                              {checkInDate && checkOutDate && (
                                <div className={cn(
                                  "rounded-2xl border transition-all duration-200",
                                  activeSubStep === 'guests' 
                                    ? "border-purple-500/40 bg-gradient-to-br from-purple-500/5 to-transparent" 
                                    : "border-emerald-500/30 bg-emerald-500/5"
                                )}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveSubStep(activeSubStep === 'guests' ? null : 'guests');
                                    }}
                                    className="w-full p-3 flex items-center justify-between"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Users size={18} className="text-emerald-400" />
                                      <span className="font-semibold text-sm text-[var(--chrome-white)]">
                                        {guests.adults + guests.children} Misafir
                                      </span>
                                    </div>
                                    <CheckCircle2 size={18} className="text-emerald-400" />
                                  </button>
                                  <AnimatePresence>
                                    {activeSubStep === 'guests' && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                      >
                                        <div className="px-3 pb-3 space-y-2">
                                          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03]">
                                            <span className="text-sm text-[var(--chrome-white)]">Yetişkin</span>
                                            <div className="flex items-center gap-3">
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setGuests(g => ({ ...g, adults: Math.max(1, g.adults - 1) }));
                                                }}
                                                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-[var(--chrome-white)] font-bold transition-all active:scale-95"
                                              >
                                                −
                                              </button>
                                              <span className="w-8 text-center font-bold text-[var(--chrome-white)]">{guests.adults}</span>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setGuests(g => ({ ...g, adults: g.adults + 1 }));
                                                }}
                                                className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-[var(--chrome-white)] font-bold transition-all active:scale-95"
                                              >
                                                +
                                              </button>
                                            </div>
                                          </div>
                                          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03]">
                                            <div>
                                              <span className="text-sm text-[var(--chrome-white)] block">Çocuk</span>
                                              <span className="text-xs text-[var(--muted-lead)]">2-12 yaş</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setGuests(g => ({ ...g, children: Math.max(0, g.children - 1) }));
                                                }}
                                                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-[var(--chrome-white)] font-bold transition-all active:scale-95"
                                              >
                                                −
                                              </button>
                                              <span className="w-8 text-center font-bold text-[var(--chrome-white)]">{guests.children}</span>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setGuests(g => ({ ...g, children: g.children + 1 }));
                                                }}
                                                className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-[var(--chrome-white)] font-bold transition-all active:scale-95"
                                              >
                                                +
                                              </button>
                                            </div>
                                          </div>
                                          {/* Misafir Onay Butonu */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleGuestsConfirm();
                                            }}
                                            className="w-full h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-[0.98]"
                                          >
                                            Tamam
                                          </button>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              )}

                              {checkInDate && checkOutDate && nights > 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStepComplete(1);
                                  }}
                                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-fuchsia-500 hover:shadow-2xl hover:shadow-purple-500/40 text-[var(--chrome-white)] font-heading font-bold transition-all duration-200 active:scale-[0.98]"
                                >
                                  Devam Et
                                </button>
                              )}
                            </>
                          )}

                          {step.id === 2 && (
                            <div className="space-y-3">
                              {checkingAvailability && (
                                <div className="text-center py-4">
                                  <div className="w-6 h-6 border-2 border-white/10 border-t-purple-500 rounded-full animate-spin mx-auto mb-2" />
                                  <p className="text-xs text-[var(--muted-lead)]">Oda müsaitlikleri kontrol ediliyor...</p>
                                </div>
                              )}
                              
                              {roomTypes.map((room) => {
                                const availability = roomAvailabilities.find(a => a.roomId === room.id);
                                const isAvailable = !availability || availability.isAvailable;
                                
                                return (
                                  <div key={room.id}>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (isAvailable) {
                                          setSelectedRoom(room);
                                          // 🔥 Ek hizmetler için varsayılan miktarları ayarla (akıllı algılama ile)
                                          const defaultQuantities: Record<string, number> = {};
                                          extraServices.forEach(extra => {
                                            defaultQuantities[extra.id] = getDefaultQuantity(extra, nights);
                                          });
                                          setExtraQuantities(defaultQuantities);
                                        }
                                      }}
                                      disabled={!isAvailable}
                                      className={cn(
                                        "w-full p-4 rounded-2xl border text-left transition-all duration-200",
                                        !isAvailable && "opacity-50 cursor-not-allowed",
                                        selectedRoom?.id === room.id
                                          ? "border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-pink-500/5 shadow-lg"
                                          : isAvailable
                                          ? "border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] active:scale-[0.98]"
                                          : "border-red-500/30 bg-red-500/5"
                                      )}
                                    >
                                      <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                          <h5 className="font-heading font-bold text-base text-[var(--chrome-white)] mb-1">
                                            {room.name}
                                          </h5>
                                          {!isAvailable && (
                                            <div className="flex items-center gap-1 text-red-400">
                                              <AlertCircle size={14} />
                                              <span className="text-xs font-semibold">Bu tarihler için dolu</span>
                                            </div>
                                          )}
                                        </div>
                                        <span className={cn(
                                          "font-bold text-lg bg-gradient-to-r bg-clip-text text-transparent ml-2",
                                          isAvailable 
                                            ? "from-purple-400 to-pink-400"
                                            : "from-gray-400 to-gray-500"
                                        )}>
                                          {room.price}₺<span className="text-sm">/gece</span>
                                        </span>
                                      </div>
                                      {room.description && (
                                        <p className="text-xs text-[var(--muted-lead)] mb-2">{room.description}</p>
                                      )}
                                      {selectedRoom?.id === room.id && isAvailable && (
                                        <div className="mt-3 flex items-center gap-2 text-emerald-400">
                                          <CheckCircle2 size={16} />
                                          <span className="text-sm font-semibold">Seçildi</span>
                                        </div>
                                      )}
                                    </button>
                                  </div>
                                );
                              })}
                              
                              {/* Alternatif Oda Önerileri */}
                              {roomAvailabilities.length > 0 && roomAvailabilities.some(a => !a.isAvailable) && (
                                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10 border border-amber-500/20">
                                  <div className="flex items-start gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                                      <Sparkles size={20} className="text-white" />
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-heading font-bold text-sm text-[var(--chrome-white)] mb-1">
                                        Müsait Odalar
                                      </h4>
                                      <p className="text-xs text-amber-300/80">
                                        Seçtiğiniz tarihler için müsait odalarımız:
                                      </p>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    {roomAvailabilities
                                      .filter(a => a.isAvailable)
                                      .map(availability => {
                                        const room = roomTypes.find(r => r.id === availability.roomId);
                                        if (!room) return null;
                                        
                                        return (
                                          <button
                                            key={room.id}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedRoom(room);
                                              handleStepComplete(2);
                                            }}
                                            className="w-full p-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] hover:border-emerald-500/30 transition-all duration-200 active:scale-[0.98]"
                                          >
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                                                  <Bed size={18} className="text-emerald-400" />
                                                </div>
                                                <div className="text-left">
                                                  <h5 className="font-heading font-bold text-sm text-[var(--chrome-white)]">
                                                    {room.name}
                                                  </h5>
                                                  <span className="text-xs text-emerald-400 font-semibold">✓ Müsait</span>
                                                </div>
                                              </div>
                                              <div className="text-right">
                                                <span className="font-bold text-base bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                                                  {room.price}₺
                                                </span>
                                                <span className="text-xs text-[var(--muted-lead)] block">/gece</span>
                                              </div>
                                            </div>
                                          </button>
                                        );
                                      })}
                                  </div>
                                </div>
                              )}
                              
                              {/* Ek Hizmetler Bölümü - Gelişmiş */}
                              {selectedRoom && extraServices.length > 0 && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/20"
                                >
                                  <div className="flex items-center gap-2 mb-3">
                                    <Sparkles size={18} className="text-blue-400" />
                                    <h4 className="font-heading font-bold text-sm text-[var(--chrome-white)]">
                                      Ek Hizmetler (Opsiyonel)
                                    </h4>
                                  </div>
                                  <p className="text-xs text-blue-300/80 mb-3">
                                    Konaklamanızı daha özel kılacak hizmetlerimizi seçebilirsiniz
                                  </p>
                                  <div className="space-y-3">
                                    {extraServices.map((extra) => {
                                      const isSelected = selectedExtras.includes(extra.id);
                                      const quantity = extraQuantities[extra.id] || getDefaultQuantity(extra, nights);
                                      const totalGuests = guests.adults + guests.children;
                                      
                                      // 🔥 TEK KAYNAK: Yardımcı fonksiyonları kullan
                                      const priceType = getExtraPriceType(extra);
                                      const priceLabel = getPriceLabel(priceType);
                                      const totalExtraPrice = calcExtraTotal(extra, quantity, totalGuests);
                                      
                                      return (
                                        <div
                                          key={extra.id}
                                          className={cn(
                                            "rounded-xl border transition-all duration-200",
                                            isSelected
                                              ? "border-blue-500/50 bg-gradient-to-br from-blue-500/10 to-indigo-500/5"
                                              : "border-white/[0.08] bg-white/[0.02]"
                                          )}
                                        >
                                          {/* Başlık ve Seçim */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedExtras(prev => 
                                                isSelected 
                                                  ? prev.filter(id => id !== extra.id)
                                                  : [...prev, extra.id]
                                              );
                                            }}
                                            className="w-full p-3 text-left"
                                          >
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-3 flex-1">
                                                <div className={cn(
                                                  "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200",
                                                  isSelected
                                                    ? "bg-gradient-to-br from-blue-500 to-indigo-500"
                                                    : "bg-white/[0.05]"
                                                )}>
                                                  {isSelected ? (
                                                    <CheckCircle2 size={18} className="text-white" />
                                                  ) : (
                                                    <Sparkles size={18} className="text-blue-400/40" />
                                                  )}
                                                </div>
                                                <div className="flex-1">
                                                  <h5 className="font-heading font-bold text-sm text-[var(--chrome-white)]">
                                                    {extra.name}
                                                  </h5>
                                                  {extra.description && (
                                                    <p className="text-xs text-[var(--muted-lead)] mt-0.5">
                                                      {extra.description}
                                                    </p>
                                                  )}
                                                  <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-blue-300 font-semibold">
                                                      {extra.price}₺{priceLabel}
                                                    </span>
                                                    {priceType === 'per-person' && (
                                                      <span className="text-xs text-blue-300/60">
                                                        • {totalGuests} kişi
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="text-right ml-3">
                                                <div className={cn(
                                                  "font-bold text-base",
                                                  isSelected 
                                                    ? "bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent"
                                                    : "text-[var(--muted-lead)]"
                                                )}>
                                                  {totalExtraPrice}₺
                                                </div>
                                                {priceType !== 'fixed' && (
                                                  <div className="text-xs text-blue-300/60 mt-0.5">
                                                    {isSelected ? 'toplam' : 'tahmini'}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </button>

                                          {/* Miktar Seçimi (per-night ve per-person-per-night için) */}
                                          {isSelected && (priceType === 'per-night' || priceType === 'per-person-per-night') && (
                                            <motion.div
                                              initial={{ opacity: 0, height: 0 }}
                                              animate={{ opacity: 1, height: "auto" }}
                                              exit={{ opacity: 0, height: 0 }}
                                              transition={{ duration: 0.2 }}
                                              className="px-3 pb-3"
                                            >
                                              <div className="p-3 rounded-lg bg-white/[0.03] border border-blue-500/20">
                                                <div className="flex items-center justify-between">
                                                  <div>
                                                    <h6 className="text-xs font-semibold text-[var(--chrome-white)] mb-0.5">
                                                      {priceType === 'per-person-per-night' ? 'Kaç gün için?' : 'Miktar'}
                                                    </h6>
                                                    <p className="text-xs text-[var(--muted-lead)]">
                                                      {priceType === 'per-person-per-night' 
                                                        ? `Örn: ${nights} gün kahvaltı` 
                                                        : 'Adet seçin'
                                                      }
                                                    </p>
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setExtraQuantities(prev => ({
                                                          ...prev,
                                                          [extra.id]: Math.max(1, (prev[extra.id] || nights) - 1)
                                                        }));
                                                      }}
                                                      className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[var(--chrome-white)] font-bold transition-all active:scale-95 flex items-center justify-center"
                                                    >
                                                      −
                                                    </button>
                                                    <span className="w-10 text-center font-bold text-lg text-[var(--chrome-white)]">
                                                      {quantity}
                                                    </span>
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setExtraQuantities(prev => ({
                                                          ...prev,
                                                          [extra.id]: Math.min(nights, (prev[extra.id] || nights) + 1)
                                                        }));
                                                      }}
                                                      disabled={quantity >= nights}
                                                      className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                                    >
                                                      +
                                                    </button>
                                                  </div>
                                                </div>
                                                {priceType === 'per-person-per-night' && (
                                                  <div className="mt-2 pt-2 border-t border-white/10 text-xs text-blue-300/80">
                                                    💡 {quantity} gün × {totalGuests} kişi × {extra.price}₺ = <span className="font-bold">{totalExtraPrice}₺</span>
                                                  </div>
                                                )}
                                                {priceType === 'per-night' && (
                                                  <div className="mt-2 pt-2 border-t border-white/10 text-xs text-blue-300/80">
                                                    💡 {quantity} gece × {extra.price}₺ = <span className="font-bold">{totalExtraPrice}₺</span>
                                                  </div>
                                                )}
                                              </div>
                                            </motion.div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                  {selectedExtras.length > 0 && (
                                    <div className="mt-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs text-blue-300 font-semibold">
                                          {selectedExtras.length} ek hizmet seçildi
                                        </span>
                                        <span className="text-sm font-bold bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent">
                                          +{extrasTotal}₺
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </motion.div>
                              )}
                              
                              {/* 🔥 DÜZELTME: Oda seçiliyken DAIMA devam butonu göster (ek hizmet olsun/olmasın) */}
                              {selectedRoom && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStepComplete(2);
                                  }}
                                  className="w-full mt-4 h-12 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-fuchsia-500 hover:shadow-2xl hover:shadow-purple-500/40 text-[var(--chrome-white)] font-heading font-bold transition-all duration-200 active:scale-[0.98]"
                                >
                                  İletişim Bilgilerine Geç
                                </button>
                              )}
                              
                              {/* Tüm Odalar Doluysa Sıraya Ekle */}
                              {roomAvailabilities.length > 0 && 
                               roomAvailabilities.every(a => !a.isAvailable) && 
                               (salon as any).bookingSettings?.allowQueue && 
                               checkInDate && 
                               checkOutDate && (
                                <div className="p-4 rounded-2xl bg-gradient-to-r from-red-500/10 via-orange-500/10 to-amber-500/10 border border-red-500/20">
                                  <div className="text-center mb-3">
                                    <AlertCircle size={32} className="mx-auto text-red-400 mb-2" />
                                    <h4 className="font-heading font-bold text-sm text-[var(--chrome-white)] mb-1">
                                      Tüm Odalar Dolu
                                    </h4>
                                    <p className="text-xs text-red-300/80">
                                      Seçtiğiniz tarihler için tüm odalarımız rezerve edilmiş
                                    </p>
                                  </div>
                                  <QueueJoinButton
                                    salon={salon}
                                    selectedServices={selectedRoom ? [selectedRoom] : []}
                                    preferredDate={formatDateToString(checkInDate)}
                                    totalPrice={totalPrice}
                                    totalDuration={nights * 24 * 60}
                                    customerName={customerName}
                                    customerPhone={customerPhone}
                                    customerEmail={customerEmail}
                                    onSuccess={() => {
                                      addToast('Sıraya eklendiniz! İşletme sizi arayacaktır.', 'success');
                                      navigate('/appointments');
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {step.id === 3 && (
                            <div className="space-y-3">
                              <input
                                type="text"
                                placeholder="Ad Soyad"
                                value={localName}
                                onChange={(e) => setLocalName(e.target.value)}
                                className="w-full h-12 px-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all"
                              />
                              <input
                                type="tel"
                                placeholder="5XX XXX XX XX"
                                value={localPhone}
                                onChange={(e) => {
                                  const cleaned = e.target.value.replace(/\D/g, '');
                                  setLocalPhone(cleaned.slice(0, 10));
                                }}
                                maxLength={10}
                                className="w-full h-12 px-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all"
                              />
                              <input
                                type="email"
                                placeholder="E-posta (opsiyonel)"
                                value={localEmail}
                                onChange={(e) => setLocalEmail(e.target.value)}
                                className="w-full h-12 px-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all"
                              />
                              <textarea
                                placeholder="Özel istekleriniz (opsiyonel)"
                                value={specialRequests}
                                onChange={(e) => setSpecialRequests(e.target.value)}
                                rows={2}
                                className="w-full px-4 py-3 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all resize-none"
                              />
                              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 space-y-2">
                                {/* Oda Ücreti */}
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-[var(--muted-lead)]">
                                    {selectedRoom?.name} × {nights} gece
                                  </span>
                                  <span className="font-semibold text-[var(--chrome-white)]">
                                    {selectedRoom && (selectedRoom.price * nights).toLocaleString('tr-TR')}₺
                                  </span>
                                </div>
                                
                                {/* Ek Hizmetler */}
                                {selectedExtras.length > 0 && (
                                  <>
                                    <div className="border-t border-white/10 pt-2">
                                      <div className="text-xs text-blue-300 font-semibold mb-1.5 flex items-center gap-1">
                                        <Sparkles size={12} />
                                        Ek Hizmetler
                                      </div>
                                      {selectedExtras.map(extraId => {
                                        const extra = extraServices.find(e => e.id === extraId);
                                        if (!extra) return null;
                                        
                                        const quantity = extraQuantities[extraId] || getDefaultQuantity(extra, nights);
                                        const totalGuests = guests.adults + guests.children;
                                        
                                        // 🔥 TEK KAYNAK: Yardımcı fonksiyonları kullan
                                        const priceType = getExtraPriceType(extra);
                                        const extraTotal = calcExtraTotal(extra, quantity, totalGuests);
                                        
                                        let detailText = '';
                                        switch (priceType) {
                                          case 'per-night':
                                            detailText = `${extra.price}₺ × ${quantity} gece`;
                                            break;
                                          case 'per-person':
                                            detailText = `${extra.price}₺ × ${totalGuests} kişi`;
                                            break;
                                          case 'per-person-per-night':
                                            detailText = `${extra.price}₺ × ${totalGuests} kişi × ${quantity} gece`;
                                            break;
                                          case 'fixed':
                                          default:
                                            detailText = `${extra.price}₺`;
                                            break;
                                        }
                                        
                                        return (
                                          <div key={extra.id} className="flex justify-between items-start text-xs mb-1">
                                            <div className="flex-1">
                                              <div className="text-blue-300/80">{extra.name}</div>
                                              <div className="text-blue-300/50 text-[10px] mt-0.5">{detailText}</div>
                                            </div>
                                            <span className="font-semibold text-blue-300 ml-2">+{extraTotal}₺</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </>
                                )}
                                
                                {/* Toplam */}
                                <div className="border-t border-white/20 pt-2 flex justify-between items-center">
                                  <span className="text-sm text-[var(--muted-lead)] font-semibold">Toplam Tutar</span>
                                  <span className="font-bold text-2xl bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                                    {totalPrice.toLocaleString('tr-TR')}₺
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
                                  'Rezervasyonu Onayla'
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
