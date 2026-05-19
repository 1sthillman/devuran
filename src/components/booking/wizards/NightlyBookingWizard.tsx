import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookingStore } from '@/store/bookingStore';
import { useAuthStore } from '@/store/authStore';
import { ChromaticButton } from '@/components/ui/ChromaticButton';
import { Calendar, Users, Bed, ArrowLeft, ArrowRight } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';

export function NightlyBookingWizard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    salon,
    step,
    isSubmitting,
    setAccommodationDetails,
    setCustomerInfo,
    submitReservation,
    nextStep,
    prevStep,
    customerName,
    customerPhone,
    customerEmail,
  } = useBookingStore();

  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [guests, setGuests] = useState({ adults: 2, children: 0, infants: 0 });
  const [mealPlan, setMealPlan] = useState<string>('breakfast');

  const roomTypes = [
    { id: 'standard', name: 'Standart Oda', capacity: 2, pricePerNight: 1500 },
    { id: 'deluxe', name: 'Deluxe Oda', capacity: 3, pricePerNight: 2500 },
    { id: 'suite', name: 'Suit', capacity: 4, pricePerNight: 4000 },
    { id: 'villa', name: 'Villa', capacity: 6, pricePerNight: 8000 },
  ];

  const mealPlans = [
    { id: 'none', name: 'Kahvaltı Dahil Değil', price: 0 },
    { id: 'breakfast', name: 'Kahvaltı Dahil', price: 200 },
    { id: 'half_board', name: 'Yarım Pansiyon', price: 400 },
    { id: 'full_board', name: 'Tam Pansiyon', price: 600 },
    { id: 'all_inclusive', name: 'Her Şey Dahil', price: 1000 },
  ];

  const nights = checkInDate && checkOutDate ? differenceInDays(checkOutDate, checkInDate) : 0;
  const selectedMealPlan = mealPlans.find(m => m.id === mealPlan);
  const totalPrice = selectedRoom && nights > 0
    ? (selectedRoom.pricePerNight + (selectedMealPlan?.price || 0)) * nights
    : 0;

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/booking/' + salon?.id);
    }
  }, [user, navigate, salon]);

  const handleNext = () => {
    if (step === 1 && (!checkInDate || !checkOutDate)) {
      alert('Lütfen giriş ve çıkış tarihlerini seçin');
      return;
    }
    if (step === 2 && !selectedRoom) {
      alert('Lütfen oda tipi seçin');
      return;
    }

    if (step === 1) {
      setAccommodationDetails({
        checkIn: checkInDate?.toISOString().split('T')[0],
        checkOut: checkOutDate?.toISOString().split('T')[0],
        guests
      });
    } else if (step === 2) {
      setAccommodationDetails({
        roomType: selectedRoom.id,
        mealPlan
      });
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
          <p className="text-[var(--muted-lead)]">Konaklama Rezervasyonu</p>
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
          {/* Step 1: Tarihler ve Misafirler */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                <h3 className="font-heading font-semibold text-lg text-[var(--chrome-white)] mb-4 flex items-center gap-2">
                  <Calendar size={20} />
                  Giriş - Çıkış Tarihleri
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[var(--muted-lead)] mb-2">Giriş</label>
                    <input
                      type="date"
                      value={checkInDate?.toISOString().split('T')[0] || ''}
                      onChange={(e) => setCheckInDate(new Date(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[var(--chrome-white)] outline-none focus:border-white/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--muted-lead)] mb-2">Çıkış</label>
                    <input
                      type="date"
                      value={checkOutDate?.toISOString().split('T')[0] || ''}
                      onChange={(e) => setCheckOutDate(new Date(e.target.value))}
                      min={checkInDate?.toISOString().split('T')[0]}
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[var(--chrome-white)] outline-none focus:border-white/20"
                    />
                  </div>
                </div>
                {nights > 0 && (
                  <p className="mt-3 text-sm text-[var(--muted-lead)]">
                    {nights} gece konaklama
                  </p>
                )}
              </div>

              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                <h3 className="font-heading font-semibold text-lg text-[var(--chrome-white)] mb-4 flex items-center gap-2">
                  <Users size={20} />
                  Misafir Sayısı
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--muted-lead)]">Yetişkin</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setGuests(g => ({ ...g, adults: Math.max(1, g.adults - 1) }))}
                        className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[var(--chrome-white)] hover:bg-white/[0.08]"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-[var(--chrome-white)]">{guests.adults}</span>
                      <button
                        onClick={() => setGuests(g => ({ ...g, adults: g.adults + 1 }))}
                        className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[var(--chrome-white)] hover:bg-white/[0.08]"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--muted-lead)]">Çocuk (2-12 yaş)</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setGuests(g => ({ ...g, children: Math.max(0, g.children - 1) }))}
                        className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[var(--chrome-white)] hover:bg-white/[0.08]"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-[var(--chrome-white)]">{guests.children}</span>
                      <button
                        onClick={() => setGuests(g => ({ ...g, children: g.children + 1 }))}
                        className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[var(--chrome-white)] hover:bg-white/[0.08]"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Oda ve Yemek Seçimi */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-heading font-semibold text-xl text-[var(--chrome-white)] mb-4 flex items-center gap-2">
                  <Bed size={24} />
                  Oda Tipi
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roomTypes.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => setSelectedRoom(room)}
                      className={`text-left p-4 rounded-xl border transition-all ${
                        selectedRoom?.id === room.id
                          ? 'bg-white/10 border-white/20'
                          : 'bg-white/[0.02] border-white/[0.06] hover:border-white/10'
                      }`}
                    >
                      <h4 className="font-heading font-semibold text-[var(--chrome-white)] mb-1">
                        {room.name}
                      </h4>
                      <p className="text-sm text-[var(--muted-lead)] mb-2">
                        {room.capacity} kişilik
                      </p>
                      <p className="font-bold text-[var(--chrome-white)]">
                        {room.pricePerNight.toLocaleString('tr-TR')} ₺ / gece
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-heading font-semibold text-lg text-[var(--chrome-white)] mb-4">
                  Yemek Planı
                </h3>
                <div className="space-y-2">
                  {mealPlans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => setMealPlan(plan.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between ${
                        mealPlan === plan.id
                          ? 'bg-white/10 border-white/20'
                          : 'bg-white/[0.02] border-white/[0.06] hover:border-white/10'
                      }`}
                    >
                      <span className="text-[var(--chrome-white)]">{plan.name}</span>
                      <span className="text-[var(--muted-lead)]">
                        {plan.price > 0 ? `+${plan.price} ₺/gece` : 'Dahil değil'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: İletişim ve Özet */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-heading font-semibold text-xl text-[var(--chrome-white)] mb-4">
                  İletişim Bilgileri
                </h3>
                <div className="space-y-3">
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
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                <h4 className="font-heading font-semibold text-lg text-[var(--chrome-white)] mb-4">
                  Rezervasyon Özeti
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-lead)]">Giriş:</span>
                    <span className="text-[var(--chrome-white)]">
                      {checkInDate && format(checkInDate, 'dd MMM yyyy', { locale: tr })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-lead)]">Çıkış:</span>
                    <span className="text-[var(--chrome-white)]">
                      {checkOutDate && format(checkOutDate, 'dd MMM yyyy', { locale: tr })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-lead)]">Gece:</span>
                    <span className="text-[var(--chrome-white)]">{nights} gece</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-lead)]">Oda:</span>
                    <span className="text-[var(--chrome-white)]">{selectedRoom?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-lead)]">Yemek:</span>
                    <span className="text-[var(--chrome-white)]">{selectedMealPlan?.name}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-white/10">
                    <span className="font-semibold text-[var(--chrome-white)]">Toplam:</span>
                    <span className="font-bold text-xl text-[var(--chrome-white)]">
                      {totalPrice.toLocaleString('tr-TR')} ₺
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

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
