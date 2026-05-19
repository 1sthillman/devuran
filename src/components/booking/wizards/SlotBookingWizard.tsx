import { useState } from 'react';
import { useBookingStore } from '@/store/bookingStore';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarPicker } from '../CalendarPicker';
import { TimeSlotGrid } from '../TimeSlotGrid';

export function SlotBookingWizard() {
  const navigate = useNavigate();
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

  const [step, setStep] = useState(1);
  const [localName, setLocalName] = useState(customerName || '');
  const [localPhone, setLocalPhone] = useState(customerPhone || '');
  const [localEmail, setLocalEmail] = useState(customerEmail || '');
  const [localNotes, setLocalNotes] = useState(customerNotes || '');

  const handleNext = () => {
    if (step === 1 && selectedServices.length === 0) {
      alert('Lütfen en az bir hizmet seçin');
      return;
    }
    if (step === 2 && !selectedStaffId) {
      alert('Lütfen bir personel seçin');
      return;
    }
    if (step === 3 && (!selectedDate || !selectedTime)) {
      alert('Lütfen tarih ve saat seçin');
      return;
    }
    if (step === 4 && (!localName || !localPhone)) {
      alert('Lütfen iletişim bilgilerini doldurun');
      return;
    }

    if (step < 4) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setCustomerInfo({
      name: localName,
      phone: localPhone,
      email: localEmail,
      notes: localNotes
    });

    try {
      const reservationId = await submitReservation();
      navigate(`/booking-success/${reservationId}`);
    } catch (error) {
      console.error('Rezervasyon hatası:', error);
      alert('Rezervasyon oluşturulamadı. Lütfen tekrar deneyin.');
    }
  };

  if (!salon) return null;

  return (
    <div className="max-w-3xl mx-auto pb-24 px-4">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-[var(--chrome-white)] mb-2">
          Randevu Oluştur
        </h1>
        <p className="font-body text-[var(--muted-lead)]">{salon.name}</p>
      </div>

      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                s <= step
                  ? 'bg-[var(--liquid-chrome)] text-[var(--void)]'
                  : 'bg-white/5 text-[var(--muted-lead)]'
              }`}
            >
              {s}
            </div>
            {s < 4 && (
              <div
                className={`flex-1 h-1 mx-2 rounded transition-all ${
                  s < step ? 'bg-[var(--liquid-chrome)]' : 'bg-white/5'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {step === 1 && (
            <div className="space-y-3">
              <h3 className="font-heading font-semibold text-lg text-[var(--chrome-white)] mb-4">
                Hizmet Seçin
              </h3>
              {salon.services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => toggleService(service)}
                  className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                    selectedServices.some((s) => s.id === service.id)
                      ? 'border-[var(--liquid-chrome)] bg-[var(--liquid-chrome)]/10'
                      : 'border-[var(--obsidian-rim)] bg-[var(--slate-surface)] hover:border-white/20'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-heading font-semibold text-[var(--chrome-white)]">
                        {service.name}
                      </h4>
                      <p className="text-sm text-[var(--muted-lead)] mt-1">
                        {service.duration} dk
                      </p>
                    </div>
                    <p className="font-mono text-[var(--liquid-chrome)]">{service.price} TL</p>
                  </div>
                </button>
              ))}
              {selectedServices.length > 0 && (
                <div className="obsidian-card p-4 bg-[var(--liquid-chrome)]/5 border-2 border-[var(--liquid-chrome)]/30 mt-4">
                  <div className="flex justify-between">
                    <span className="font-heading font-semibold text-[var(--chrome-white)]">
                      Toplam
                    </span>
                    <span className="font-mono text-xl text-[var(--liquid-chrome)]">
                      {totalPrice} TL
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="font-heading font-semibold text-lg text-[var(--chrome-white)] mb-4">
                <User className="inline mr-2" size={20} />
                Personel Seçin
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {salon.staff.map((staff) => (
                  <button
                    key={staff.id}
                    onClick={() => selectStaff(staff.id)}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      selectedStaffId === staff.id
                        ? 'border-[var(--liquid-chrome)] bg-[var(--liquid-chrome)]/10'
                        : 'border-[var(--obsidian-rim)] bg-[var(--slate-surface)] hover:border-white/20'
                    }`}
                  >
                    <img
                      src={staff.photo}
                      alt={staff.name}
                      className="w-16 h-16 rounded-full mx-auto mb-2 object-cover"
                    />
                    <h4 className="font-heading font-semibold text-[var(--chrome-white)] text-center">
                      {staff.name}
                    </h4>
                    <p className="text-sm text-[var(--muted-lead)] text-center">{staff.title}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-heading font-semibold text-lg text-[var(--chrome-white)] mb-4">
                  <Calendar className="inline mr-2" size={20} />
                  Tarih Seçin
                </h3>
                <CalendarPicker
                  selectedDate={selectedDate}
                  onSelect={(date) => selectDateTime(date, selectedTime || '')}
                  workingHours={salon.workingHours}
                />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-lg text-[var(--chrome-white)] mb-4">
                  <Clock className="inline mr-2" size={20} />
                  Saat Seçin
                </h3>
                {selectedDate ? (
                  <TimeSlotGrid
                    slots={[]}
                    selectedTime={selectedTime}
                    onSelect={(time) => selectDateTime(selectedDate, time)}
                  />
                ) : (
                  <p className="text-[var(--muted-lead)]">Önce tarih seçin</p>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="obsidian-card p-6">
                <h3 className="font-heading font-bold text-xl text-[var(--chrome-white)] mb-4">
                  Rezervasyon Özeti
                </h3>
                <div className="space-y-3 text-[var(--silver-frost)]">
                  <p>
                    <span className="text-[var(--muted-lead)]">Hizmetler:</span>{' '}
                    {selectedServices.map((s) => s.name).join(', ')}
                  </p>
                  <p>
                    <span className="text-[var(--muted-lead)]">Personel:</span>{' '}
                    {salon.staff.find((s) => s.id === selectedStaffId)?.name}
                  </p>
                  <p>
                    <span className="text-[var(--muted-lead)]">Tarih:</span> {selectedDate}
                  </p>
                  <p>
                    <span className="text-[var(--muted-lead)]">Saat:</span> {selectedTime}
                  </p>
                  <div className="border-t border-[var(--obsidian-rim)] pt-3 mt-3">
                    <p className="font-mono text-2xl text-[var(--chrome-white)]">
                      {totalPrice} TL
                    </p>
                    <p className="text-sm text-[var(--muted-lead)] mt-1">{totalDuration} dakika</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-heading font-semibold text-lg text-[var(--chrome-white)] mb-4">
                  İletişim Bilgileri
                </h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={localName}
                    onChange={(e) => setLocalName(e.target.value)}
                    placeholder="Ad Soyad"
                    className="w-full h-12 px-4 rounded-2xl bg-[var(--slate-surface)] border-2 border-[var(--obsidian-rim)] text-[var(--chrome-white)] placeholder:text-[var(--ash)] font-body outline-none transition-all focus:border-[var(--liquid-chrome)]"
                  />
                  <input
                    type="tel"
                    value={localPhone}
                    onChange={(e) => setLocalPhone(e.target.value)}
                    placeholder="Telefon"
                    className="w-full h-12 px-4 rounded-2xl bg-[var(--slate-surface)] border-2 border-[var(--obsidian-rim)] text-[var(--chrome-white)] placeholder:text-[var(--ash)] font-body outline-none transition-all focus:border-[var(--liquid-chrome)]"
                  />
                  <input
                    type="email"
                    value={localEmail}
                    onChange={(e) => setLocalEmail(e.target.value)}
                    placeholder="E-posta (opsiyonel)"
                    className="w-full h-12 px-4 rounded-2xl bg-[var(--slate-surface)] border-2 border-[var(--obsidian-rim)] text-[var(--chrome-white)] placeholder:text-[var(--ash)] font-body outline-none transition-all focus:border-[var(--liquid-chrome)]"
                  />
                  <textarea
                    value={localNotes}
                    onChange={(e) => setLocalNotes(e.target.value)}
                    placeholder="Notlar (opsiyonel)"
                    rows={3}
                    className="w-full px-4 py-3 rounded-2xl bg-[var(--slate-surface)] border-2 border-[var(--obsidian-rim)] text-[var(--chrome-white)] placeholder:text-[var(--ash)] font-body outline-none transition-all focus:border-[var(--liquid-chrome)] resize-none"
                  />
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--void)]/80 backdrop-blur-lg border-t border-[var(--obsidian-rim)] z-50">
        <div className="max-w-3xl mx-auto flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 h-12 rounded-full bg-white/5 hover:bg-white/10 text-[var(--chrome-white)] font-heading font-semibold transition-all flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Geri
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className="flex-1 h-12 rounded-full bg-[var(--liquid-chrome)] hover:bg-[var(--liquid-chrome)]/90 text-[var(--void)] font-heading font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-[var(--void)]/30 border-t-[var(--void)] rounded-full animate-spin" />
            ) : (
              <>
                {step === 4 ? 'Randevu Oluştur' : 'Devam Et'}
                {step < 4 && <ArrowRight size={18} />}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
