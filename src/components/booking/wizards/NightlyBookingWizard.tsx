import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookingStore } from '@/store/bookingStore';
import { useAuthStore } from '@/store/authStore';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useUIStore } from '@/store/uiStore';
import { Calendar, Users, Bed, CheckCircle2, ChevronDown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ModernCalendar } from '../ModernCalendar';
import { differenceInDays } from 'date-fns';
import { servicesService } from '@/services/firebaseService';
import type { Service } from '@/types';
import { cn } from '@/lib/utils';

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
  const [selectedRoom, setSelectedRoom] = useState<Service | null>(null);
  const [guests, setGuests] = useState({ adults: 2, children: 0 });
  const [roomTypes, setRoomTypes] = useState<Service[]>([]);
  const [extraServices, setExtraServices] = useState<Service[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { errors, validatePhone, validateEmail, validateName } = useFormValidation();
  const { addToast } = useUIStore();

  useEffect(() => {
    if (salon?.id) {
      loadServices();
    }
  }, [salon?.id]);

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
      //
    }
    setLoading(false);
  };

  const nights = checkInDate && checkOutDate ? differenceInDays(checkOutDate, checkInDate) : 0;
  const extrasTotal = selectedExtras.reduce((sum, extraId) => {
    const extra = extraServices.find(e => e.id === extraId);
    return sum + (extra?.price || 0);
  }, 0);
  const totalPrice = selectedRoom && nights > 0 ? selectedRoom.price * nights + extrasTotal : 0;

  const handleCheckInSelect = (date: Date) => {
    setCheckInDate(date);
    if (checkOutDate && date >= checkOutDate) setCheckOutDate(null);
    setTimeout(() => setActiveSubStep('checkOut'), 100);
  };

  const handleCheckOutSelect = (date: Date) => {
    setCheckOutDate(date);
    setTimeout(() => setActiveSubStep('guests'), 100);
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
    const nameValid = validateName('name', customerName);
    const phoneValid = validatePhone('phone', customerPhone);
    const emailValid = customerEmail ? validateEmail('email', customerEmail) : true;

    if (!nameValid || !phoneValid || !emailValid) {
      addToast('Lütfen tüm bilgileri doğru girin', 'error');
      return;
    }

    if (!selectedRoom || nights <= 0 || totalPrice <= 0) {
      addToast('Lütfen tüm bilgileri eksiksiz doldurun', 'error');
      return;
    }

    setAccommodationDetails({
      checkIn: checkInDate?.toISOString().split('T')[0],
      checkOut: checkOutDate?.toISOString().split('T')[0],
      guests,
      roomType: selectedRoom?.id,
      selectedPackage: selectedRoom,
      extras: selectedExtras.map(id => extraServices.find(e => e.id === id)).filter(Boolean),
      totalPrice
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
    <div className="max-w-lg mx-auto pb-24 px-4 py-6">
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
              <button
                onClick={() => canAccess && setActiveStep(step.id)}
                disabled={!canAccess}
                className={cn("w-full text-left transition-all duration-200", !canAccess && "opacity-40 cursor-not-allowed")}
              >
                <div className={cn(
                  "relative overflow-hidden rounded-3xl border backdrop-blur-xl transition-all duration-300",
                  isActive 
                    ? "border-purple-500/40 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent shadow-2xl shadow-purple-500/20"
                    : isCompleted 
                    ? "border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-transparent" 
                    : "border-white/[0.08] bg-white/[0.02]"
                )}>
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                  )}
                  
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

                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-4">
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
                              {roomTypes.map((room) => (
                                <button
                                  key={room.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedRoom(room);
                                    handleStepComplete(2);
                                  }}
                                  className={cn(
                                    "w-full p-4 rounded-2xl border text-left transition-all duration-200",
                                    selectedRoom?.id === room.id
                                      ? "border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-pink-500/5 shadow-lg"
                                      : "border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] active:scale-[0.98]"
                                  )}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <h5 className="font-heading font-bold text-base text-[var(--chrome-white)] flex-1">{room.name}</h5>
                                    <span className="font-bold text-lg bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent ml-2">
                                      {room.price}₺<span className="text-sm">/gece</span>
                                    </span>
                                  </div>
                                  {room.description && <p className="text-xs text-[var(--muted-lead)] mb-2">{room.description}</p>}
                                  {selectedRoom?.id === room.id && (
                                    <div className="mt-3 flex items-center gap-2 text-emerald-400">
                                      <CheckCircle2 size={16} />
                                      <span className="text-sm font-semibold">Seçildi</span>
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}

                          {step.id === 3 && (
                            <div className="space-y-3">
                              <input
                                type="text"
                                placeholder="Ad Soyad"
                                value={customerName}
                                onChange={(e) => setCustomerInfo({ name: e.target.value, phone: customerPhone, email: customerEmail, notes: '' })}
                                className="w-full h-12 px-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all"
                              />
                              <input
                                type="tel"
                                placeholder="Telefon"
                                value={customerPhone}
                                onChange={(e) => setCustomerInfo({ name: customerName, phone: e.target.value, email: customerEmail, notes: '' })}
                                className="w-full h-12 px-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all"
                              />
                              <input
                                type="email"
                                placeholder="E-posta (opsiyonel)"
                                value={customerEmail}
                                onChange={(e) => setCustomerInfo({ name: customerName, phone: customerPhone, email: e.target.value, notes: '' })}
                                className="w-full h-12 px-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all"
                              />
                              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-[var(--muted-lead)]">Toplam Tutar</span>
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
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
