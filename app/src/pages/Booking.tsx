import { useParams, Navigate, Link } from 'react-router-dom';
import { useBookingStore } from '@/store/bookingStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { ProgressBar } from '@/components/booking/ProgressBar';
import { ServiceCard } from '@/components/salon/ServiceCard';
import { StaffCard } from '@/components/salon/StaffCard';
import { CalendarPicker } from '@/components/booking/CalendarPicker';
import { TimeSlotGrid } from '@/components/booking/TimeSlotGrid';
import { BookingSuccess } from '@/components/booking/BookingSuccess';
import { ChromaticButton } from '@/components/ui/ChromaticButton';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { salonsService, servicesService, staffService, appointmentsService } from '@/services/firebaseService';
import { soundService } from '@/services/soundService';
import type { Salon, Service, Staff } from '@/types';

const steps = ['Hizmetler', 'Personel', 'Tarih', 'Onay'];

// Mock time slots - bugünkü tarih için geçmiş saatleri filtrele
const generateSlots = (bookedTimes: string[] = [], selectedDate: string | null = null) => {
  const slots = [];
  const now = new Date(); // GERÇEK TARİH
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Bugünün tarihi
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isToday = selectedDate === todayStr;
  
  for (let h = 9; h <= 20; h++) {
    const time1 = `${h}:00`;
    const time2 = `${h}:30`;
    
    // Bugünse ve saat geçmişse gösterme
    if (isToday) {
      if (h < currentHour || (h === currentHour && 0 <= currentMinute)) {
        // Geçmiş saat, atla
      } else {
        slots.push({ 
          time: time1, 
          available: !bookedTimes.includes(time1)
        });
      }
      
      if (h < 20) {
        if (h < currentHour || (h === currentHour && 30 <= currentMinute)) {
          // Geçmiş saat, atla
        } else {
          slots.push({ 
            time: time2, 
            available: !bookedTimes.includes(time2)
          });
        }
      }
    } else {
      // Gelecek tarih, tüm saatleri göster
      slots.push({ 
        time: time1, 
        available: !bookedTimes.includes(time1)
      });
      
      if (h < 20) {
        slots.push({ 
          time: time2, 
          available: !bookedTimes.includes(time2)
        });
      }
    }
  }
  
  return slots;
};

export function Booking() {
  const { salonId } = useParams<{ salonId: string }>();
  const { isAuthenticated, user } = useAuthStore();
  const { addToast } = useUIStore();

  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isSelectedSlotAvailable, setIsSelectedSlotAvailable] = useState(true);
  const [timeSlots, setTimeSlots] = useState(generateSlots([], null));

  const {
    step,
    selectedServices,
    selectedStaffId,
    selectedDate,
    selectedTime,
    customerName,
    customerPhone,
    customerNotes,
    totalPrice,
    totalDuration,
    toggleService,
    selectStaff,
    selectDateTime,
    setCustomerInfo,
    nextStep,
    prevStep,
    reset,
  } = useBookingStore();

  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (salonId) {
      loadSalonData();
    }
  }, [salonId]);

  useEffect(() => {
    // Load booked slots when date and staff are selected
    if (selectedDate && selectedStaffId && salon) {
      loadBookedSlots();
    } else if (selectedDate && salon && !selectedStaffId) {
      // Eğer personel seçilmemişse tüm personellerin dolu slotlarını göster
      loadAllStaffBookedSlots();
    }
  }, [selectedDate, selectedStaffId, salon]);

  useEffect(() => {
    // Update time slots when booked slots change
    setTimeSlots(generateSlots(bookedSlots, selectedDate));
  }, [bookedSlots, selectedDate]);

  useEffect(() => {
    // Check if selected time is available
    if (selectedTime) {
      const isAvailable = !bookedSlots.includes(selectedTime);
      setIsSelectedSlotAvailable(isAvailable);
    } else {
      setIsSelectedSlotAvailable(true);
    }
  }, [selectedTime, bookedSlots]);

  const loadBookedSlots = async () => {
    if (!salon || !selectedStaffId || !selectedDate) return;
    
    try {
      const slots = await appointmentsService.getBookedSlots(salon.id, selectedStaffId, selectedDate);
      setBookedSlots(slots);
    } catch (error) {
      console.error('Error loading booked slots:', error);
    }
  };

  const loadAllStaffBookedSlots = async () => {
    if (!salon || !selectedDate) return;
    
    try {
      // Tüm personellerin dolu slotlarını al
      const allSlots: string[] = [];
      for (const staffMember of staff) {
        const slots = await appointmentsService.getBookedSlots(salon.id, staffMember.id, selectedDate);
        allSlots.push(...slots);
      }
      // Tekrar edenleri kaldır
      setBookedSlots([...new Set(allSlots)]);
    } catch (error) {
      console.error('Error loading all staff booked slots:', error);
    }
  };

  const loadSalonData = async () => {
    if (!salonId) return;
    
    setLoading(true);
    try {
      const [salonData, servicesData, staffData] = await Promise.all([
        salonsService.getById(salonId),
        servicesService.getBySalon(salonId),
        staffService.getBySalon(salonId),
      ]);
      
      setSalon(salonData);
      setServices(servicesData.filter(s => s.isActive));
      setStaff(staffData.filter(s => s.isActive));
    } catch (error) {
      console.error('Error loading salon data:', error);
      addToast('Salon bilgileri yüklenemedi', 'error');
    }
    setLoading(false);
  };

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: `/booking/${salonId}` }} replace />;
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="w-12 h-12 border-4 border-[var(--liquid-chrome)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-body text-[var(--muted-lead)]">Yukleniyor...</p>
      </div>
    );
  }

  if (!salon) {
    return <Navigate to="/" replace />;
  }

  // Salon randevu kabul etmiyorsa uyarı göster
  if (salon.isAcceptingBookings === false) {
    return (
      <div className="max-w-2xl mx-auto pb-8">
        <div className="obsidian-card p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-[var(--error)]/10 flex items-center justify-center mx-auto mb-4">
            <X size={40} className="text-[var(--error)]" />
          </div>
          <h2 className="font-display font-bold text-2xl text-[var(--chrome-white)] mb-3">
            Randevu Sistemi Kapalı
          </h2>
          <p className="font-body text-[var(--muted-lead)] mb-6">
            {salon.name} şu anda randevu kabul etmiyor. Lütfen daha sonra tekrar deneyin.
          </p>
          <Link to="/" className="chromatic-btn inline-flex items-center gap-2">
            <span>Anasayfaya Dön</span>
          </Link>
        </div>
      </div>
    );
  }

  const handleNext = () => {
    if (step === 1 && selectedServices.length === 0) {
      addToast('Lutfen en az bir hizmet secin', 'warning');
      return;
    }
    if (step === 2 && !selectedStaffId) {
      addToast('Lutfen bir personel secin', 'warning');
      return;
    }
    if (step === 3 && (!selectedDate || !selectedTime)) {
      addToast('Lutfen tarih ve saat secin', 'warning');
      return;
    }
    nextStep();
  };

  const handleConfirm = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      addToast('Lutfen ad ve telefon bilgilerini doldurun', 'error');
      return;
    }

    if (!user?.uid || !salon || !selectedStaffId || !selectedDate || !selectedTime) {
      addToast('Oturum hatasi. Lutfen tekrar giris yapin.', 'error');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const selectedStaff = staff.find((s) => s.id === selectedStaffId);

      const appointmentData = {
        userId: user.uid,
        salonId: salon.id,
        salonName: salon.name,
        salonCover: salon.coverImage || '',
        salonAddress: `${salon.address.district}, ${salon.address.city}`,
        customerName,
        customerPhone,
        staffId: selectedStaffId,
        staffName: selectedStaff?.name || '',
        staffPhoto: selectedStaff?.photo || '',
        services: selectedServices.map((s) => ({
          id: s.id,
          name: s.name,
          price: s.price,
          duration: s.duration,
        })),
        date: selectedDate,
        time: selectedTime,
        endTime: '', // Calculate based on duration
        totalDuration,
        totalPrice,
        status: 'pending' as const,
        notes: customerNotes,
        whatsappNumber: salon.whatsappNumber,
      };

      // Normal randevu oluştur (sıraya alma kaldırıldı, sadece müsait slotlar için)
      await appointmentsService.create(appointmentData);
      
      // Play success sound
      soundService.playAppointmentCreated();
      
      addToast('Randevu başarıyla oluşturuldu!', 'success');
      setShowSuccess(true);
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      const errorMessage = error?.message || 'Randevu oluşturulamadı. Lütfen tekrar deneyin.';
      addToast(errorMessage, 'error');
      
      // If slot became unavailable, user needs to select a new time
      if (errorMessage.includes('müsait değil')) {
        addToast('Lütfen başka bir saat seçin', 'warning');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    reset();
    setShowSuccess(false);
  };

  // Group services by category
  const servicesByCategory = services.reduce((acc, service) => {
    if (!acc[service.category]) acc[service.category] = [];
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <h1 className="font-display font-bold text-3xl text-[var(--chrome-white)] mb-2">
        Randevu Al
      </h1>
      <p className="font-body text-[var(--muted-lead)] mb-6">{salon.name}</p>

      <ProgressBar currentStep={step} steps={steps} />

      <AnimatePresence mode="wait">
        {showSuccess ? (
          <BookingSuccess key="success" onNavigate={handleReset} />
        ) : (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* STEP 1: Service Selection */}
            {step === 1 && (
              <div>
                {Object.entries(servicesByCategory).map(([category, services]) => (
                  <div key={category} className="mb-6">
                    <h3 className="font-heading font-semibold text-lg text-[var(--chrome-white)] mb-3">
                      {category}
                    </h3>
                    <div className="space-y-1">
                      {services.map((service) => (
                        <ServiceCard
                          key={service.id}
                          service={service}
                          selected={selectedServices.some((s) => s.id === service.id)}
                          onToggle={toggleService}
                        />
                      ))}
                    </div>
                  </div>
                ))}

                {/* Selected Summary */}
                {selectedServices.length > 0 && (
                  <div className="sticky bottom-0 mt-4 p-4 bg-white/[0.04] rounded-3xl border border-[var(--obsidian-rim)] backdrop-blur-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-body text-sm text-[var(--silver-frost)]">
                        {selectedServices.length} hizmet secildi
                      </span>
                      <span className="font-mono font-medium text-[var(--chrome-white)]">
                        Toplam: {totalPrice} TL
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Staff Selection */}
            {step === 2 && (
              <div>
                <h3 className="font-heading font-semibold text-lg text-[var(--chrome-white)] mb-2">
                  Personel Secin *
                </h3>
                <p className="font-body text-sm text-[var(--muted-lead)] mb-4">
                  Hizmet almak istediginiz personeli secin
                </p>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
                  {staff.map((member) => (
                    <StaffCard
                      key={member.id}
                      staff={member}
                      selected={selectedStaffId === member.id}
                      onSelect={(id) => selectStaff(id)}
                      variant="compact"
                    />
                  ))}
                </div>
                {!selectedStaffId && (
                  <p className="font-body text-sm text-[var(--error)] mt-2">
                    Lutfen bir personel secin
                  </p>
                )}
              </div>
            )}

            {/* STEP 3: Date & Time */}
            {step === 3 && (
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <CalendarPicker
                    selectedDate={selectedDate}
                    onSelect={(date) => selectDateTime(date, selectedTime || '')}
                    workingHours={salon.workingHours}
                  />
                </div>
                <div>
                  <TimeSlotGrid
                    slots={timeSlots}
                    selectedTime={selectedTime}
                    onSelect={(time) => selectDateTime(selectedDate || '', time)}
                  />
                  
                  {/* Tüm slotlar doluysa sıraya alma mesajı */}
                  {selectedDate && selectedStaffId && timeSlots.length > 0 && timeSlots.every(s => !s.available) && (
                    <div className="mt-4 p-4 rounded-full bg-[var(--warning)]/10 border border-[var(--warning)]/30">
                      <p className="font-body text-sm text-[var(--warning)] mb-2">
                        Bu tarihte tüm saatler dolu. Sıraya alınmak ister misiniz?
                      </p>
                      <p className="font-body text-xs text-[var(--muted-lead)]">
                        Bir randevu iptal olursa size haber verilecek.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: Confirmation */}
            {step === 4 && (
              <div className="space-y-6">
                {/* Summary Card */}
                <div className="obsidian-card p-5">
                  <div className="flex items-center gap-4">
                    {salon.coverImage ? (
                      <img
                        src={salon.coverImage}
                        loading="lazy"
                        alt={salon.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <span className="text-[var(--chrome-white)] font-heading font-bold text-xl">
                          {salon.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-heading font-bold text-[var(--chrome-white)]">{salon.name}</h3>
                      <p className="font-body text-sm text-[var(--muted-lead)]">{salon.address.district}</p>
                    </div>
                  </div>

                  <div className="border-t border-[var(--obsidian-rim)] my-4" />

                  {/* Selected Services */}
                  <div className="space-y-2">
                    {selectedServices.map((service) => (
                      <div key={service.id} className="flex justify-between">
                        <span className="font-body text-sm text-[var(--silver-frost)]">{service.name}</span>
                        <span className="font-mono text-sm text-[var(--silver-frost)]">{service.price} TL</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-[var(--obsidian-rim)] my-4 pt-3">
                    <div className="flex justify-between">
                      <span className="font-heading font-semibold text-[var(--chrome-white)]">Toplam</span>
                      <span className="font-mono font-bold text-xl text-[var(--chrome-white)]">{totalPrice} TL</span>
                    </div>
                    <p className="font-body text-xs text-[var(--muted-lead)] mt-1">
                      {totalDuration} dk
                    </p>
                  </div>

                  <div className="border-t border-[var(--obsidian-rim)] my-4" />

                  {/* Staff & Date */}
                  <div className="space-y-2">
                    <p className="font-body text-sm text-[var(--silver-frost)]">
                      <span className="text-[var(--muted-lead)]">Personel:</span>{' '}
                      {staff.find((s) => s.id === selectedStaffId)?.name || ''}
                    </p>
                    <p className="font-body text-sm text-[var(--silver-frost)]">
                      <span className="text-[var(--muted-lead)]">Tarih:</span>{' '}
                      {selectedDate}
                    </p>
                    <p className="font-body text-sm text-[var(--chrome-white)] font-medium">
                      <span className="text-[var(--muted-lead)]">Saat:</span>{' '}
                      {selectedTime}
                    </p>
                  </div>
                </div>

                {/* Personal Info Form */}
                <div>
                  <h3 className="font-heading font-semibold text-lg text-[var(--chrome-white)] mb-4">
                    Iletisim Bilgileri
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-2">
                        Ad Soyad
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerInfo({ name: e.target.value, phone: customerPhone, notes: customerNotes })}
                        placeholder="Adinizi girin"
                        className="w-full h-[52px] px-4 rounded-3xl bg-[var(--slate-surface)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] placeholder:text-[var(--ash)] font-body text-[15px] outline-none transition-all focus:border-[var(--liquid-chrome)] focus:shadow-[0_0_0_3px_rgba(255,255,255,0.06)]"
                      />
                    </div>
                    <div>
                      <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-2">
                        Telefon
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerInfo({ name: customerName, phone: e.target.value, notes: customerNotes })}
                        placeholder="05XX XXX XX XX"
                        className="w-full h-[52px] px-4 rounded-3xl bg-[var(--slate-surface)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] placeholder:text-[var(--ash)] font-body text-[15px] outline-none transition-all focus:border-[var(--liquid-chrome)] focus:shadow-[0_0_0_3px_rgba(255,255,255,0.06)]"
                      />
                    </div>
                    <div>
                      <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-2">
                        Not (Istege Bagli)
                      </label>
                      <textarea
                        value={customerNotes}
                        onChange={(e) => setCustomerInfo({ name: customerName, phone: customerPhone, notes: e.target.value })}
                        placeholder="Ozel bir isteginiz var mi?"
                        rows={3}
                        className="w-full px-4 py-3 rounded-3xl bg-[var(--slate-surface)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] placeholder:text-[var(--ash)] font-body text-[15px] outline-none transition-all focus:border-[var(--liquid-chrome)] focus:shadow-[0_0_0_3px_rgba(255,255,255,0.06)] resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      {!showSuccess && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--void)]/80 backdrop-blur-lg border-t border-[var(--obsidian-rim)] z-50">
          <div className="max-w-2xl mx-auto flex gap-3">
            {step > 1 && (
              <ChromaticButton variant="ghost" onClick={prevStep} className="flex-shrink-0">
                Geri
              </ChromaticButton>
            )}
            {step < 4 ? (
              <>
                {/* Step 3'te tüm slotlar doluysa Sıraya Al butonu göster */}
                {step === 3 && selectedDate && selectedStaffId && timeSlots.length > 0 && timeSlots.every(s => !s.available) ? (
                  <ChromaticButton 
                    fullWidth 
                    onClick={async () => {
                      // Sıraya alma işlemi - saat seçimi opsiyonel
                      if (!user?.uid || !salon || !selectedStaffId) return;
                      
                      setIsSubmitting(true);
                      try {
                        const selectedStaff = staff.find((s) => s.id === selectedStaffId);
                        
                        const queueData = {
                          userId: user.uid,
                          salonId: salon.id,
                          staffId: selectedStaffId,
                          customerName: user.displayName || '',
                          customerPhone: user.phone || '',
                          customerAvatar: user.photoURL,
                          services: selectedServices.map((s) => ({
                            id: s.id,
                            name: s.name,
                            price: s.price,
                            duration: s.duration,
                          })),
                          preferredDate: selectedDate, // Opsiyonel tercih
                          preferredTime: selectedTime, // Opsiyonel tercih
                          totalDuration,
                          totalPrice,
                          notes: customerNotes,
                        };

                        await appointmentsService.addToQueue(queueData);
                        
                        // Play success sound
                        soundService.playAppointmentCreated();
                        
                        addToast('Sıraya alındınız! Randevu iptal olduğunda bildirim alacaksınız.', 'success');
                        setShowSuccess(true);
                      } catch (error) {
                        console.error('Error adding to queue:', error);
                        addToast('Sıraya eklenemedi. Lütfen tekrar deneyin.', 'error');
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    loading={isSubmitting}
                  >
                    Sıraya Al
                  </ChromaticButton>
                ) : (
                  <ChromaticButton fullWidth onClick={handleNext}>
                    Devam Et
                  </ChromaticButton>
                )}
              </>
            ) : (
              <ChromaticButton fullWidth onClick={handleConfirm} loading={isSubmitting}>
                {isSelectedSlotAvailable ? 'Randevu Olustur' : 'Siraya Al'}
              </ChromaticButton>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

