import { useState } from 'react';
import { useBookingStore } from '@/store/bookingStore';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, DollarSign, Package, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const eventTypes = [
  { id: 'wedding', label: 'Düğün', icon: '💍' },
  { id: 'engagement', label: 'Nişan', icon: '💐' },
  { id: 'proposal', label: 'Evlilik Teklifi', icon: '💝' },
  { id: 'other', label: 'Diğer', icon: '🎉' }
];

const packages = [
  {
    id: 'basic',
    name: 'Temel Paket',
    tier: 'basic' as const,
    price: 15000,
    includes: ['Organizasyon Danışmanlığı', 'Temel Dekorasyon', '2 Planlama Toplantısı']
  },
  {
    id: 'standard',
    name: 'Standart Paket',
    tier: 'standard' as const,
    price: 35000,
    includes: ['Tam Organizasyon', 'Özel Dekorasyon', '4 Planlama Toplantısı', 'Koordinatör Desteği']
  },
  {
    id: 'premium',
    name: 'Premium Paket',
    tier: 'premium' as const,
    price: 65000,
    includes: ['VIP Organizasyon', 'Lüks Dekorasyon', 'Sınırsız Toplantı', 'Özel Koordinatör', 'Fotoğraf & Video']
  },
  {
    id: 'luxury',
    name: 'Lüks Paket',
    tier: 'luxury' as const,
    price: 120000,
    includes: ['Tam Lüks Hizmet', 'Özel Tasarım', 'Kişisel Ekip', 'Tüm Hizmetler Dahil', 'Uluslararası Standart']
  }
];

export function ProjectBookingWizard() {
  const navigate = useNavigate();
  const {
    salon,
    eventDate,
    eventType,
    guestCount,
    budget,
    selectedPackage,
    customerName,
    customerPhone,
    customerEmail,
    customerNotes,
    setEventDetails,
    setCustomerInfo,
    submitReservation,
    isSubmitting
  } = useBookingStore();

  const [step, setStep] = useState(1);
  const [localEventType, setLocalEventType] = useState(eventType || null);
  const [localEventDate, setLocalEventDate] = useState(eventDate || '');
  const [localGuestCount, setLocalGuestCount] = useState(guestCount || 100);
  const [localBudget, setLocalBudget] = useState(budget || { min: 20000, max: 50000 });
  const [localPackage, setLocalPackage] = useState(selectedPackage || null);
  const [localName, setLocalName] = useState(customerName || '');
  const [localPhone, setLocalPhone] = useState(customerPhone || '');
  const [localEmail, setLocalEmail] = useState(customerEmail || '');
  const [localNotes, setLocalNotes] = useState(customerNotes || '');

  const handleNext = () => {
    if (step === 1 && (!localEventType || !localEventDate)) {
      alert('Lütfen etkinlik tipi ve tarih seçin');
      return;
    }
    if (step === 2 && localGuestCount < 1) {
      alert('Lütfen misafir sayısı girin');
      return;
    }
    if (step === 3 && !localPackage) {
      alert('Lütfen bir paket seçin');
      return;
    }
    if (step === 4 && (!localName || !localPhone || !localEmail)) {
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
      navigate(`/booking-success/${reservationId}`);
    } catch (error) {
      console.error('Rezervasyon hatası:', error);
      alert('Rezervasyon oluşturulamadı. Lütfen tekrar deneyin.');
    }
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 90);

  return (
    <div className="max-w-3xl mx-auto pb-24 px-4">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-[var(--chrome-white)] mb-2">
          Organizasyon Rezervasyonu
        </h1>
        <p className="font-body text-[var(--muted-lead)]">{salon?.name}</p>
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
            <div className="space-y-6">
              <div>
                <label className="block font-heading font-semibold text-lg text-[var(--chrome-white)] mb-4">
                  <Calendar className="inline mr-2" size={20} />
                  Etkinlik Tipi
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {eventTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setLocalEventType(type.id as any)}
                      className={`p-4 rounded-2xl border-2 transition-all text-left ${
                        localEventType === type.id
                          ? 'border-[var(--liquid-chrome)] bg-[var(--liquid-chrome)]/10'
                          : 'border-[var(--obsidian-rim)] bg-[var(--slate-surface)] hover:border-white/20'
                      }`}
                    >
                      <div className="text-3xl mb-2">{type.icon}</div>
                      <div className="font-heading font-semibold text-[var(--chrome-white)]">
                        {type.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-heading font-semibold text-lg text-[var(--chrome-white)] mb-3">
                  Etkinlik Tarihi
                </label>
                <input
                  type="date"
                  value={localEventDate}
                  onChange={(e) => setLocalEventDate(e.target.value)}
                  min={minDate.toISOString().split('T')[0]}
                  className="w-full h-14 px-4 rounded-2xl bg-[var(--slate-surface)] border-2 border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body outline-none transition-all focus:border-[var(--liquid-chrome)]"
                />
                <p className="text-sm text-[var(--muted-lead)] mt-2">
                  Minimum 90 gün önceden rezervasyon gereklidir
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block font-heading font-semibold text-lg text-[var(--chrome-white)] mb-3">
                  <Users className="inline mr-2" size={20} />
                  Misafir Sayısı
                </label>
                <input
                  type="number"
                  value={localGuestCount}
                  onChange={(e) => setLocalGuestCount(parseInt(e.target.value) || 0)}
                  min="1"
                  max="2000"
                  className="w-full h-14 px-4 rounded-2xl bg-[var(--slate-surface)] border-2 border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body text-lg outline-none transition-all focus:border-[var(--liquid-chrome)]"
                />
              </div>

              <div>
                <label className="block font-heading font-semibold text-lg text-[var(--chrome-white)] mb-3">
                  <DollarSign className="inline mr-2" size={20} />
                  Bütçe Aralığı (TL)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[var(--muted-lead)] mb-2">Minimum</label>
                    <input
                      type="number"
                      value={localBudget.min}
                      onChange={(e) =>
                        setLocalBudget({ ...localBudget, min: parseInt(e.target.value) || 0 })
                      }
                      className="w-full h-12 px-4 rounded-2xl bg-[var(--slate-surface)] border-2 border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-mono outline-none transition-all focus:border-[var(--liquid-chrome)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--muted-lead)] mb-2">Maksimum</label>
                    <input
                      type="number"
                      value={localBudget.max}
                      onChange={(e) =>
                        setLocalBudget({ ...localBudget, max: parseInt(e.target.value) || 0 })
                      }
                      className="w-full h-12 px-4 rounded-2xl bg-[var(--slate-surface)] border-2 border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-mono outline-none transition-all focus:border-[var(--liquid-chrome)]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <label className="block font-heading font-semibold text-lg text-[var(--chrome-white)] mb-4">
                <Package className="inline mr-2" size={20} />
                Paket Seçimi
              </label>
              <div className="grid md:grid-cols-2 gap-4">
                {packages.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => setLocalPackage(pkg)}
                    className={`p-6 rounded-2xl border-2 transition-all text-left ${
                      localPackage?.id === pkg.id
                        ? 'border-[var(--liquid-chrome)] bg-[var(--liquid-chrome)]/10'
                        : 'border-[var(--obsidian-rim)] bg-[var(--slate-surface)] hover:border-white/20'
                    }`}
                  >
                    <h3 className="font-heading font-bold text-xl text-[var(--chrome-white)] mb-2">
                      {pkg.name}
                    </h3>
                    <p className="font-mono text-2xl text-[var(--liquid-chrome)] mb-4">
                      {pkg.price.toLocaleString('tr-TR')} TL
                    </p>
                    <ul className="space-y-2">
                      {pkg.includes.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[var(--silver-frost)]">
                          <CheckCircle2 size={16} className="text-[var(--liquid-chrome)] mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="obsidian-card p-6 mb-6">
                <h3 className="font-heading font-bold text-xl text-[var(--chrome-white)] mb-4">
                  Rezervasyon Özeti
                </h3>
                <div className="space-y-3 text-[var(--silver-frost)]">
                  <p>
                    <span className="text-[var(--muted-lead)]">Etkinlik:</span>{' '}
                    {eventTypes.find((t) => t.id === localEventType)?.label}
                  </p>
                  <p>
                    <span className="text-[var(--muted-lead)]">Tarih:</span> {localEventDate}
                  </p>
                  <p>
                    <span className="text-[var(--muted-lead)]">Misafir:</span> {localGuestCount} kişi
                  </p>
                  <p>
                    <span className="text-[var(--muted-lead)]">Paket:</span> {localPackage?.name}
                  </p>
                  <div className="border-t border-[var(--obsidian-rim)] pt-3 mt-3">
                    <p className="font-mono text-2xl text-[var(--chrome-white)]">
                      {localPackage?.price.toLocaleString('tr-TR')} TL
                    </p>
                    <p className="text-sm text-[var(--muted-lead)] mt-1">
                      %40 depozito: {((localPackage?.price || 0) * 0.4).toLocaleString('tr-TR')} TL
                    </p>
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
                    placeholder="E-posta"
                    className="w-full h-12 px-4 rounded-2xl bg-[var(--slate-surface)] border-2 border-[var(--obsidian-rim)] text-[var(--chrome-white)] placeholder:text-[var(--ash)] font-body outline-none transition-all focus:border-[var(--liquid-chrome)]"
                  />
                  <textarea
                    value={localNotes}
                    onChange={(e) => setLocalNotes(e.target.value)}
                    placeholder="Özel istekleriniz..."
                    rows={4}
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
                {step === 4 ? 'Rezervasyon Oluştur' : 'Devam Et'}
                {step < 4 && <ArrowRight size={18} />}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
