import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookingStore } from '@/store/bookingStore';
import { useAuthStore } from '@/store/authStore';
import { ChromaticButton } from '@/components/ui/ChromaticButton';
import { Calendar, Users, Package, ArrowLeft, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export function DailyRentalWizard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    salon,
    step,
    eventDate,
    eventType,
    capacity,
    selectedPackage,
    customerName,
    customerPhone,
    customerEmail,
    isSubmitting,
    setEventDetails,
    setCustomerInfo,
    submitReservation,
    nextStep,
    prevStep,
  } = useBookingStore();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<string>('');
  const [guestCount, setGuestCount] = useState<number>(100);
  const [selectedPkg, setSelectedPkg] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/booking/' + salon?.id);
    }
  }, [user, navigate, salon]);

  const packages = [
    {
      id: 'basic',
      name: 'Temel Paket',
      price: 15000,
      includes: ['Salon Kirası', 'Masa ve Sandalye', 'Temel Dekorasyon']
    },
    {
      id: 'standard',
      name: 'Standart Paket',
      price: 25000,
      includes: ['Salon Kirası', 'Masa ve Sandalye', 'Premium Dekorasyon', 'Ses Sistemi', 'Işıklandırma']
    },
    {
      id: 'premium',
      name: 'Premium Paket',
      price: 40000,
      includes: ['Salon Kirası', 'Masa ve Sandalye', 'Lüks Dekorasyon', 'Ses Sistemi', 'Işıklandırma', 'Çiçek Süsleme', 'Kırmızı Halı']
    }
  ];

  const handleNext = () => {
    if (step === 1 && !selectedDate) {
      alert('Lütfen tarih seçin');
      return;
    }
    if (step === 2 && !selectedPkg) {
      alert('Lütfen paket seçin');
      return;
    }
    
    if (step === 1) {
      setEventDetails({
        eventDate: selectedDate?.toISOString().split('T')[0],
        eventType: selectedEventType || 'other',
        capacity: guestCount
      });
    } else if (step === 2) {
      setEventDetails({ selectedPackage: selectedPkg });
    }
    
    nextStep();
  };

  const handleSubmit = async () => {
    if (!customerName || !customerPhone) {
      alert('Lütfen iletişim bilgilerinizi girin');
      return;
    }

    try {
      const reservationId = await submitReservation();
      navigate(`/booking-success/${reservationId}`);
    } catch (error: any) {
      console.error('Rezervasyon hatası:', error);
    }
  };

  if (!salon) return null;

  return (
    <div className="min-h-screen bg-[var(--void)] py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="font-display font-bold text-2xl text-[var(--chrome-white)] mb-2">
            {salon.name}
          </h1>
          <p className="text-[var(--muted-lead)]">Mekan Rezervasyonu</p>
        </div>

        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((s) => (
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
              {s < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 rounded transition-all ${
                    s < step ? 'bg-[var(--liquid-chrome)]' : 'bg-white/5'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-8">
          {/* Step 1: Tarih ve Detaylar */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                <h3 className="font-heading font-semibold text-lg text-[var(--chrome-white)] mb-4 flex items-center gap-2">
                  <Calendar size={20} />
                  Etkinlik Tarihi
                </h3>
                <input
                  type="date"
                  value={selectedDate?.toISOString().split('T')[0] || ''}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[var(--chrome-white)] outline-none focus:border-white/20"
                />
              </div>

              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                <h3 className="font-heading font-semibold text-lg text-[var(--chrome-white)] mb-4">
                  Etkinlik Tipi
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {['wedding', 'engagement', 'birthday', 'corporate'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedEventType(type)}
                      className={`px-4 py-3 rounded-xl border transition-all ${
                        selectedEventType === type
                          ? 'bg-white/10 border-white/20 text-[var(--chrome-white)]'
                          : 'bg-white/[0.02] border-white/[0.06] text-[var(--muted-lead)] hover:border-white/10'
                      }`}
                    >
                      {type === 'wedding' && 'Düğün'}
                      {type === 'engagement' && 'Nişan'}
                      {type === 'birthday' && 'Doğum Günü'}
                      {type === 'corporate' && 'Kurumsal'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                <h3 className="font-heading font-semibold text-lg text-[var(--chrome-white)] mb-4 flex items-center gap-2">
                  <Users size={20} />
                  Misafir Sayısı
                </h3>
                <input
                  type="number"
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  min="10"
                  max="1000"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[var(--chrome-white)] outline-none focus:border-white/20"
                />
              </div>
            </div>
          )}

          {/* Step 2: Paket Seçimi */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-heading font-semibold text-xl text-[var(--chrome-white)] mb-6 flex items-center gap-2">
                <Package size={24} />
                Paket Seçimi
              </h3>
              {packages.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => setSelectedPkg(pkg)}
                  className={`w-full text-left p-6 rounded-2xl border transition-all ${
                    selectedPkg?.id === pkg.id
                      ? 'bg-white/10 border-white/20'
                      : 'bg-white/[0.02] border-white/[0.06] hover:border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-heading font-bold text-lg text-[var(--chrome-white)]">
                      {pkg.name}
                    </h4>
                    <span className="font-display font-bold text-xl text-[var(--chrome-white)]">
                      {pkg.price.toLocaleString('tr-TR')} ₺
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {pkg.includes.map((item, i) => (
                      <li key={i} className="text-sm text-[var(--muted-lead)] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted-lead)]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          )}

          {/* Step 3: İletişim Bilgileri */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-heading font-semibold text-xl text-[var(--chrome-white)] mb-6">
                İletişim Bilgileri
              </h3>
              <input
                type="text"
                placeholder="Ad Soyad"
                value={customerName}
                onChange={(e) => setCustomerInfo({ name: e.target.value, phone: customerPhone, email: customerEmail, notes: '' })}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[var(--chrome-white)] placeholder:text-[var(--ash)] outline-none focus:border-white/20"
              />
              <input
                type="tel"
                placeholder="Telefon"
                value={customerPhone}
                onChange={(e) => setCustomerInfo({ name: customerName, phone: e.target.value, email: customerEmail, notes: '' })}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[var(--chrome-white)] placeholder:text-[var(--ash)] outline-none focus:border-white/20"
              />
              <input
                type="email"
                placeholder="E-posta"
                value={customerEmail}
                onChange={(e) => setCustomerInfo({ name: customerName, phone: customerPhone, email: e.target.value, notes: '' })}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[var(--chrome-white)] placeholder:text-[var(--ash)] outline-none focus:border-white/20"
              />

              {/* Özet */}
              <div className="mt-8 p-6 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                <h4 className="font-heading font-semibold text-lg text-[var(--chrome-white)] mb-4">
                  Rezervasyon Özeti
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-lead)]">Tarih:</span>
                    <span className="text-[var(--chrome-white)]">
                      {selectedDate && format(selectedDate, 'dd MMMM yyyy', { locale: tr })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-lead)]">Misafir:</span>
                    <span className="text-[var(--chrome-white)]">{guestCount} kişi</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-lead)]">Paket:</span>
                    <span className="text-[var(--chrome-white)]">{selectedPkg?.name}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-white/10">
                    <span className="font-semibold text-[var(--chrome-white)]">Toplam:</span>
                    <span className="font-bold text-xl text-[var(--chrome-white)]">
                      {selectedPkg?.price.toLocaleString('tr-TR')} ₺
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-[var(--muted-lead)] hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ArrowLeft size={18} />
            Geri
          </button>

          {step < 3 ? (
            <ChromaticButton onClick={handleNext}>
              İleri
              <ArrowRight size={18} />
            </ChromaticButton>
          ) : (
            <ChromaticButton onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Oluşturuluyor...' : 'Rezervasyonu Onayla'}
            </ChromaticButton>
          )}
        </div>
      </div>
    </div>
  );
}
