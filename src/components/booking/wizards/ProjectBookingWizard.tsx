import { useState, useEffect } from 'react';
import { useBookingStore } from '@/store/bookingStore';
import { useNavigate } from 'react-router-dom';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useUIStore } from '@/store/uiStore';
import { ModernCalendar } from '../ModernCalendar';
import { Calendar, Users, DollarSign, Package, CheckCircle2, ChevronDown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { servicesService } from '@/services/firebaseService';
import type { Service } from '@/types';
import { cn } from '@/lib/utils';

const eventTypes = [
  { id: 'wedding', label: 'Düğün', gradient: 'from-pink-500/20 to-rose-500/20' },
  { id: 'engagement', label: 'Nişan', gradient: 'from-purple-500/20 to-violet-500/20' },
  { id: 'proposal', label: 'Evlilik Teklifi', gradient: 'from-amber-500/20 to-orange-500/20' },
  { id: 'other', label: 'Diğer', gradient: 'from-blue-500/20 to-cyan-500/20' }
];

export function ProjectBookingWizard() {
  const navigate = useNavigate();
  const {
    salon,
    customerName,
    customerPhone,
    customerEmail,
    customerNotes,
    setEventDetails,
    setCustomerInfo,
    submitReservation,
    isSubmitting
  } = useBookingStore();

  const [activeStep, setActiveStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [localEventType, setLocalEventType] = useState<string | null>(null);
  const [localEventDate, setLocalEventDate] = useState('');
  const [localGuestCount, setLocalGuestCount] = useState(100);
  const [localBudget, setLocalBudget] = useState({ min: 20000, max: 50000 });
  const [localPackage, setLocalPackage] = useState<Service | null>(null);
  const [localName, setLocalName] = useState(customerName || '');
  const [localPhone, setLocalPhone] = useState(customerPhone || '');
  const [localEmail, setLocalEmail] = useState(customerEmail || '');
  const [localNotes, setLocalNotes] = useState(customerNotes || '');
  const [packages, setPackages] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { errors, validatePhone, validateEmail, validateName } = useFormValidation();
  const { addToast } = useUIStore();

  useEffect(() => {
    if (salon?.id) {
      loadPackages();
    }
  }, [salon?.id]);

  const loadPackages = async () => {
    try {
      const services = await servicesService.getBySalon(salon!.id);
      const pkgs = services.filter(s => s.category.includes('Paket'));
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
    if (step < 4) {
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

    if (!localPackage || localPackage.price <= 0) {
      addToast('Lütfen paket seçin', 'error');
      return;
    }
    
    setEventDetails({
      eventDate: localEventDate,
      eventType: localEventType,
      guestCount: localGuestCount,
      budget: localBudget,
      selectedPackage: localPackage
    });

    setCustomerInfo({
      name: localName,
      phone: localPhone,
      email: localEmail,
      notes: localNotes
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

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 90);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/10 border-t-[var(--liquid-chrome)] rounded-full animate-spin" />
    </div>
  );

  if (packages.length === 0) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h3 className="font-bold text-lg text-[var(--chrome-white)] mb-2">Henüz Paket Yok</h3>
        <p className="text-sm text-[var(--muted-lead)]">Bu işletme henüz organizasyon paketi eklememiş.</p>
      </div>
    </div>
  );

  const steps = [
    { id: 1, title: 'Etkinlik & Tarih', icon: Calendar, gradient: 'from-indigo-500 via-purple-500 to-pink-500' },
    { id: 2, title: 'Misafir & Bütçe', icon: Users, gradient: 'from-amber-500 via-orange-500 to-red-500' },
    { id: 3, title: 'Paket Seçimi', icon: Package, gradient: 'from-rose-500 via-pink-500 to-fuchsia-500' },
    { id: 4, title: 'İletişim', icon: DollarSign, gradient: 'from-emerald-500 via-teal-500 to-cyan-500' }
  ];

  return (
    <div className="max-w-lg mx-auto pb-24 px-4 py-6">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 mb-3">
          <Sparkles size={16} className="text-purple-400" />
          <span className="text-sm font-semibold text-purple-300">Organizasyon</span>
        </div>
        <h1 className="font-display font-bold text-2xl bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent mb-1">
          {salon?.name}
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
                            {step.id === 1 && localEventDate && new Date(localEventDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                            {step.id === 2 && `${localGuestCount} kişi`}
                            {step.id === 3 && localPackage?.name}
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

                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-4">
                          {step.id === 1 && (
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-sm font-semibold text-[var(--chrome-white)] mb-2">Etkinlik Tipi</h4>
                                <div className="grid grid-cols-2 gap-2">
                                  {eventTypes.map((type) => (
                                    <button
                                      key={type.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setLocalEventType(type.id as any);
                                      }}
                                      className={cn(
                                        "p-3 rounded-2xl border transition-all duration-200",
                                        localEventType === type.id
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
                                <h4 className="text-sm font-semibold text-[var(--chrome-white)] mb-2">Etkinlik Tarihi</h4>
                                <ModernCalendar
                                  selectedDate={localEventDate ? new Date(localEventDate) : null}
                                  onSelect={(date) => setLocalEventDate(date.toISOString().split('T')[0])}
                                  minDate={minDate}
                                />
                                <p className="text-xs text-[var(--muted-lead)] mt-2 text-center flex items-center justify-center gap-1">
                                  <Calendar size={12} />
                                  Minimum 90 gün önceden rezervasyon gereklidir
                                </p>
                              </div>
                              {localEventType && localEventDate && (
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
                            </div>
                          )}

                          {step.id === 2 && (
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-sm font-semibold text-[var(--chrome-white)] mb-2">Misafir Sayısı</h4>
                                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03]">
                                  <span className="text-sm text-[var(--chrome-white)]">Misafir</span>
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setLocalGuestCount(Math.max(1, localGuestCount - 10));
                                      }}
                                      className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-[var(--chrome-white)] font-bold transition-all active:scale-95"
                                    >
                                      −
                                    </button>
                                    <span className="w-16 text-center font-bold text-[var(--chrome-white)]">{localGuestCount}</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setLocalGuestCount(Math.min(2000, localGuestCount + 10));
                                      }}
                                      className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-[var(--chrome-white)] font-bold transition-all active:scale-95"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-[var(--chrome-white)] mb-2">Bütçe Aralığı (₺)</h4>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs text-[var(--muted-lead)] mb-1">Minimum</label>
                                    <input
                                      type="number"
                                      value={localBudget.min}
                                      onChange={(e) => setLocalBudget({ ...localBudget, min: parseInt(e.target.value) || 0 })}
                                      className="w-full h-12 px-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] text-sm outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-[var(--muted-lead)] mb-1">Maksimum</label>
                                    <input
                                      type="number"
                                      value={localBudget.max}
                                      onChange={(e) => setLocalBudget({ ...localBudget, max: parseInt(e.target.value) || 0 })}
                                      className="w-full h-12 px-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] text-sm outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all"
                                    />
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStepComplete(2);
                                }}
                                className="w-full h-12 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:shadow-2xl hover:shadow-amber-500/40 text-[var(--chrome-white)] font-heading font-bold transition-all duration-200 active:scale-[0.98]"
                              >
                                Devam Et
                              </button>
                            </div>
                          )}

                          {step.id === 3 && (
                            <div className="space-y-3">
                              {packages.map((pkg) => (
                                <button
                                  key={pkg.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setLocalPackage(pkg);
                                    handleStepComplete(3);
                                  }}
                                  className={cn(
                                    "w-full p-4 rounded-2xl border text-left transition-all duration-200",
                                    localPackage?.id === pkg.id
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
                                    <ul className="space-y-1">
                                      {pkg.includes.slice(0, 3).map((item, i) => (
                                        <li key={i} className="text-xs text-[var(--silver-frost)] flex items-start gap-1">
                                          <CheckCircle2 size={12} className="text-purple-400 mt-0.5 flex-shrink-0" />
                                          <span>{item}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                  {localPackage?.id === pkg.id && (
                                    <div className="mt-3 flex items-center gap-2 text-emerald-400">
                                      <CheckCircle2 size={16} />
                                      <span className="text-sm font-semibold">Seçildi</span>
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}

                          {step.id === 4 && (
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
                              <textarea
                                value={localNotes}
                                onChange={(e) => setLocalNotes(e.target.value)}
                                placeholder="Özel istekleriniz..."
                                rows={2}
                                className="w-full px-4 py-3 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all resize-none"
                              />
                              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-[var(--muted-lead)]">Toplam Tutar</span>
                                  <span className="font-bold text-2xl bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                                    {localPackage?.price.toLocaleString('tr-TR')}₺
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
                                  'Rezervasyon Oluştur'
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
