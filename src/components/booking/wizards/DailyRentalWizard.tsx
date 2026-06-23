import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookingStore } from '@/store/bookingStore';
import { useAuthStore } from '@/store/authStore';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useUIStore } from '@/store/uiStore';
import { Calendar, Users, Package, CheckCircle2, ChevronDown, Sparkles, MapPin, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ModernCalendar } from '../ModernCalendar';
import { ModernTimePicker } from '../ModernTimePicker';
import { servicesService } from '@/services/firebaseService';
import type { Service } from '@/types';
import { cn, formatDateToString } from '@/lib/utils';

export function DailyRentalWizard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    salon,
    setEventDetails,
    setCustomerInfo,
    submitReservation,
    isSubmitting,
    customerName,
    customerPhone,
    customerEmail,
  } = useBookingStore();

  const [activeStep, setActiveStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [eventStartTime, setEventStartTime] = useState<string>('18:00');
  const [selectedEventType, setSelectedEventType] = useState<string>('');
  const [guestCount, setGuestCount] = useState<number>(100);
  const [selectedPkg, setSelectedPkg] = useState<Service | null>(null);
  const [packages, setPackages] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [localName, setLocalName] = useState(customerName || '');
  const [localPhone, setLocalPhone] = useState(customerPhone || '');
  const [localEmail, setLocalEmail] = useState(customerEmail || '');
  const [eventNotes, setEventNotes] = useState('');
  const [localAddress, setLocalAddress] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
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
      loadPackages();
    }
  }, [salon?.id]);

  const loadPackages = async () => {
    try {
      const services = await servicesService.getBySalon(salon!.id);
      const pkgs = services.filter(s => 
        s.category.includes('Paket') || 
        s.category.includes('Alan') ||
        s.category.includes('Mekan')
      );
      setPackages(pkgs);
    } catch (error) {
      //
    }
    setLoading(false);
  };

  const handleStepComplete = (step: number) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps([...completedSteps, step]);
    }
    if (step < 3) {
      setActiveStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    const nameValid = validateName('name', localName);
    const phoneValid = validatePhone('phone', localPhone);
    const emailValid = localEmail ? validateEmail('email', localEmail) : true;

    if (!nameValid || !phoneValid || !emailValid) {
      addToast('Lütfen tüm bilgileri doğru girin', 'error');
      return;
    }

    if (!selectedPkg || selectedPkg.price <= 0) {
      addToast('Lütfen paket seçin', 'error');
      return;
    }

    setCustomerInfo({
      name: localName,
      phone: localPhone,
      email: localEmail,
      notes: eventNotes,
      address: localAddress
    });

    setEventDetails({
      eventDate: selectedDate ? formatDateToString(selectedDate) : undefined,
      eventStartTime,
      eventType: selectedEventType || 'other',
      capacity: guestCount,
      selectedPackage: selectedPkg,
      totalPrice: selectedPkg.price
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

  if (!salon || loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/10 border-t-[var(--liquid-chrome)] rounded-full animate-spin" />
    </div>
  );

  if (packages.length === 0) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h3 className="font-bold text-lg text-[var(--chrome-white)] mb-2">Henüz Paket Yok</h3>
        <p className="text-sm text-[var(--muted-lead)]">Bu işletme henüz mekan paketi eklememiş.</p>
      </div>
    </div>
  );

  const eventTypes = [
    { id: 'wedding', label: 'Düğün', gradient: 'from-pink-500/20 to-rose-500/20' },
    { id: 'engagement', label: 'Nişan', gradient: 'from-purple-500/20 to-violet-500/20' },
    { id: 'birthday', label: 'Doğum Günü', gradient: 'from-amber-500/20 to-orange-500/20' },
    { id: 'corporate', label: 'Kurumsal', gradient: 'from-blue-500/20 to-cyan-500/20' }
  ];

  const steps = [
    { id: 1, title: 'Tarih & Detaylar', icon: Calendar, gradient: 'from-indigo-500 via-purple-500 to-pink-500' },
    { id: 2, title: 'Paket Seçimi', icon: Package, gradient: 'from-rose-500 via-pink-500 to-fuchsia-500' },
    { id: 3, title: 'İletişim', icon: Users, gradient: 'from-emerald-500 via-teal-500 to-cyan-500' }
  ];

  return (
    <div className="max-w-lg md:max-w-xl lg:max-w-2xl mx-auto pb-24 px-4 md:px-6 py-6">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 mb-3">
          <Sparkles size={16} className="text-purple-400" />
          <span className="text-sm font-semibold text-purple-300">Mekan Kiralama</span>
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
                            {step.id === 1 && selectedDate && selectedDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                            {step.id === 2 && selectedPkg?.name}
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
                              <div>
                                <h4 className="text-sm font-semibold text-[var(--chrome-white)] mb-2">Etkinlik Tarihi</h4>
                                <ModernCalendar
                                  selectedDate={selectedDate}
                                  onSelect={setSelectedDate}
                                  minDate={new Date()}
                                />
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-[var(--chrome-white)] mb-2">Etkinlik Tipi</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                  {eventTypes.map((type) => (
                                    <button
                                      key={type.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedEventType(type.id);
                                      }}
                                      className={cn(
                                        "p-3 rounded-2xl border transition-all duration-200",
                                        selectedEventType === type.id
                                          ? `bg-gradient-to-br ${type.gradient} border-purple-500/30`
                                          : "border-white/[0.06] bg-white/[0.02] hover:border-white/10 active:scale-[0.98]"
                                      )}
                                    >
                                      <span className="text-sm font-semibold text-[var(--chrome-white)]">{type.label}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-[var(--chrome-white)] mb-2">Misafir Sayısı</h4>
                                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03]">
                                  <span className="text-sm text-[var(--chrome-white)]">Misafir</span>
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setGuestCount(Math.max(10, guestCount - 10));
                                      }}
                                      className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-[var(--chrome-white)] font-bold transition-all active:scale-95"
                                    >
                                      −
                                    </button>
                                    <span className="w-16 text-center font-bold text-[var(--chrome-white)]">{guestCount}</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setGuestCount(Math.min(1000, guestCount + 10));
                                      }}
                                      className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-[var(--chrome-white)] font-bold transition-all active:scale-95"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-[var(--chrome-white)] mb-2">Etkinlik Başlangıç Saati</h4>
                                <ModernTimePicker
                                  value={eventStartTime}
                                  onChange={setEventStartTime}
                                  workingHours={
                                    salon?.workingHours?.start ? {
                                      start: salon.workingHours.start.open,
                                      end: salon.workingHours.end.close
                                    } : undefined
                                  }
                                  intervalMinutes={30}
                                  label="Etkinlik başlangıç saati seçin"
                                />
                              </div>
                              {selectedDate && selectedEventType && (
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
                              {packages.map((pkg) => (
                                <button
                                  key={pkg.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPkg(pkg);
                                    handleStepComplete(2);
                                  }}
                                  className={cn(
                                    "w-full p-4 rounded-2xl border text-left transition-all duration-200",
                                    selectedPkg?.id === pkg.id
                                      ? "border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-pink-500/5 shadow-lg"
                                      : "border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] active:scale-[0.98]"
                                  )}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <h5 className="font-heading font-bold text-base text-[var(--chrome-white)] flex-1">{pkg.name}</h5>
                                    <span className="font-bold text-lg bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent ml-2">
                                      {pkg.price.toLocaleString('tr-TR')}₺
                                    </span>
                                  </div>
                                  {pkg.description && <p className="text-xs text-[var(--muted-lead)] mb-2">{pkg.description}</p>}
                                  {pkg.includes && pkg.includes.length > 0 && (
                                    <ul className="mt-2 space-y-1">
                                      {pkg.includes.slice(0, 3).map((item, i) => (
                                        <li key={i} className="text-xs text-[var(--silver-frost)] flex items-start gap-1">
                                          <CheckCircle2 size={12} className="text-purple-400 mt-0.5 flex-shrink-0" />
                                          <span>{item}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                  {selectedPkg?.id === pkg.id && (
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
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-[var(--chrome-white)] mb-2">Etkinlik Adresi (Opsiyonel)</h4>
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
                                    placeholder="Etkinlik yeri adresi..."
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all resize-none"
                                  />
                                </div>
                              </div>
                              <textarea
                                placeholder="Etkinlik notları (opsiyonel)"
                                value={eventNotes}
                                onChange={(e) => setEventNotes(e.target.value)}
                                rows={2}
                                className="w-full px-4 py-3 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all resize-none"
                              />
                              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-[var(--muted-lead)]">Toplam Tutar</span>
                                  <span className="font-bold text-2xl bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                                    {selectedPkg?.price.toLocaleString('tr-TR')}₺
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
