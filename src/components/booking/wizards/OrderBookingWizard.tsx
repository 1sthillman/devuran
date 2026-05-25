import { useState, useEffect } from 'react';
import { useBookingStore } from '@/store/bookingStore';
import { useNavigate } from 'react-router-dom';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { ModernCalendar } from '../ModernCalendar';
import { Calendar, MapPin, ShoppingCart, Plus, Minus, CheckCircle2, ChevronDown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { servicesService } from '@/services/firebaseService';
import type { Service } from '@/types';
import { cn, formatDateToString } from '@/lib/utils';

export function OrderBookingWizard() {
  const navigate = useNavigate();
  const {
    salon,
    deliveryDate,
    deliveryTime,
    deliveryAddress,
    orderItems,
    customerName,
    customerPhone,
    customerEmail,
    customerNotes,
    setOrderDetails,
    setCustomerInfo,
    submitReservation,
    isSubmitting
  } = useBookingStore();

  const [activeStep, setActiveStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [localItems, setLocalItems] = useState<any[]>(orderItems || []);
  const [localDeliveryDate, setLocalDeliveryDate] = useState(deliveryDate || '');
  const [localDeliveryTime, setLocalDeliveryTime] = useState(deliveryTime || '');
  const [localDeliveryAddress, setLocalDeliveryAddress] = useState(deliveryAddress || '');
  const [localName, setLocalName] = useState(customerName || '');
  const [localPhone, setLocalPhone] = useState(customerPhone || '');
  const [localEmail, setLocalEmail] = useState(customerEmail || '');
  const [localNotes, setLocalNotes] = useState(customerNotes || '');
  const [menuItems, setMenuItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { errors, validatePhone, validateEmail, validateName } = useFormValidation();
  const { addToast } = useUIStore();
  const { user } = useAuthStore();

  // Kullanıcı bilgilerini otomatik doldur
  useEffect(() => {
    if (user && activeStep === 4) {
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
      loadMenuItems();
    }
  }, [salon?.id]);

  const loadMenuItems = async () => {
    try {
      const services = await servicesService.getBySalon(salon!.id);
      setMenuItems(services);
    } catch (error) {
      //
    }
    setLoading(false);
  };

  const addItem = (item: any) => {
    const existing = localItems.find((i) => i.id === item.id);
    if (existing) {
      setLocalItems(localItems.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setLocalItems([...localItems, { ...item, quantity: 1 }]);
    }
  };

  const removeItem = (itemId: string) => {
    const existing = localItems.find((i) => i.id === itemId);
    if (existing && existing.quantity > 1) {
      setLocalItems(localItems.map((i) => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i));
    } else {
      setLocalItems(localItems.filter((i) => i.id !== itemId));
    }
  };

  const totalPrice = localItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

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

    if (localItems.length === 0 || totalPrice <= 0) {
      addToast('Lütfen en az bir ürün seçin', 'error');
      return;
    }
    
    setOrderDetails({
      deliveryDate: localDeliveryDate,
      deliveryTime: localDeliveryTime,
      deliveryAddress: localDeliveryAddress,
      orderItems: localItems
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
      addToast('Sipariş başarıyla oluşturuldu!', 'success');
      navigate(`/booking-success/${reservationId}`);
    } catch (error: any) {
      addToast(error.message || 'Sipariş oluşturulamadı', 'error');
    }
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 3);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/10 border-t-[var(--liquid-chrome)] rounded-full animate-spin" />
    </div>
  );

  if (menuItems.length === 0) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h3 className="font-bold text-lg text-[var(--chrome-white)] mb-2">Henüz Ürün Yok</h3>
        <p className="text-sm text-[var(--muted-lead)]">Bu işletme henüz sipariş edilebilir ürün eklememiş.</p>
      </div>
    </div>
  );

  const steps = [
    { id: 1, title: 'Ürün Seçimi', icon: ShoppingCart, gradient: 'from-purple-500 via-pink-500 to-fuchsia-500' },
    { id: 2, title: 'Teslimat', icon: MapPin, gradient: 'from-cyan-500 via-blue-500 to-indigo-500' },
    { id: 3, title: 'İletişim', icon: Calendar, gradient: 'from-emerald-500 via-teal-500 to-cyan-500' }
  ];

  return (
    <div className="max-w-lg mx-auto pb-24 px-4 py-6">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 mb-3">
          <Sparkles size={16} className="text-purple-400" />
          <span className="text-sm font-semibold text-purple-300">Sipariş</span>
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
                            {step.id === 1 && `${localItems.length} ürün`}
                            {step.id === 2 && localDeliveryDate}
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
                              {menuItems.map((item) => {
                                const inCart = localItems.find((i) => i.id === item.id);
                                return (
                                  <div key={item.id} className="p-4 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                                    <div className="flex justify-between items-center">
                                      <div className="flex-1">
                                        <h4 className="font-heading font-bold text-base text-[var(--chrome-white)]">{item.name}</h4>
                                        {item.description && <p className="text-xs text-[var(--muted-lead)] mt-0.5">{item.description}</p>}
                                        <p className="text-sm font-bold text-purple-400 mt-1">{item.price}₺</p>
                                      </div>
                                      <div className="flex items-center gap-2 ml-3">
                                        {inCart ? (
                                          <>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                removeItem(item.id);
                                              }}
                                              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all active:scale-95"
                                            >
                                              <Minus size={16} className="text-[var(--chrome-white)]" />
                                            </button>
                                            <span className="w-8 text-center font-bold text-[var(--chrome-white)]">{inCart.quantity}</span>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                addItem(item);
                                              }}
                                              className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center transition-all active:scale-95"
                                            >
                                              <Plus size={16} className="text-[var(--chrome-white)]" />
                                            </button>
                                          </>
                                        ) : (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              addItem(item);
                                            }}
                                            className="px-4 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-[var(--chrome-white)] text-sm font-semibold transition-all active:scale-95"
                                          >
                                            Ekle
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                              {localItems.length > 0 && (
                                <>
                                  <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-[var(--muted-lead)]">Toplam</span>
                                      <span className="font-bold text-2xl bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                                        {totalPrice.toLocaleString('tr-TR')}₺
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
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-sm font-semibold text-[var(--chrome-white)] mb-2">Teslimat Tarihi</h4>
                                <ModernCalendar
                                  selectedDate={localDeliveryDate ? new Date(localDeliveryDate) : null}
                                  onSelect={(date) => setLocalDeliveryDate(formatDateToString(date))}
                                  minDate={minDate}
                                />
                                <p className="text-xs text-[var(--muted-lead)] mt-2 text-center flex items-center justify-center gap-1">
                                  <Calendar size={12} />
                                  Minimum 3 gün önceden sipariş gereklidir
                                </p>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-[var(--chrome-white)] mb-2">Teslimat Saati</h4>
                                <input
                                  type="time"
                                  value={localDeliveryTime}
                                  onChange={(e) => setLocalDeliveryTime(e.target.value)}
                                  className="w-full h-12 px-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] text-sm outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all"
                                />
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-[var(--chrome-white)] mb-2">Teslimat Adresi</h4>
                                <textarea
                                  value={localDeliveryAddress}
                                  onChange={(e) => setLocalDeliveryAddress(e.target.value)}
                                  placeholder="Tam adres (en az 10 karakter)..."
                                  rows={3}
                                  className="w-full px-4 py-3 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all resize-none"
                                />
                              </div>
                              {localDeliveryDate && localDeliveryTime && localDeliveryAddress.length >= 10 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStepComplete(2);
                                  }}
                                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 hover:shadow-2xl hover:shadow-cyan-500/40 text-[var(--chrome-white)] font-heading font-bold transition-all duration-200 active:scale-[0.98]"
                                >
                                  Devam Et
                                </button>
                              )}
                            </div>
                          )}

                          {step.id === 3 && (
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
                                placeholder="Özel notlar..."
                                rows={2}
                                className="w-full px-4 py-3 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all resize-none"
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
                                  'Sipariş Oluştur'
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
