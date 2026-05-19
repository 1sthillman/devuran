import { useState } from 'react';
import { useBookingStore } from '@/store/bookingStore';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, ShoppingCart, Plus, Minus, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const menuItems = {
  catering: [
    { id: 'c1', name: 'Kokteyl Menü', unit: 'person', price: 150, description: '10 çeşit sıcak-soğuk ikram' },
    { id: 'c2', name: 'Açık Büfe', unit: 'person', price: 250, description: 'Sınırsız yemek ve içecek' },
    { id: 'c3', name: 'Oturmalı Yemek', unit: 'person', price: 350, description: '3 çeşit ana yemek, salata, tatlı' },
    { id: 'c4', name: 'VIP Menü', unit: 'person', price: 500, description: 'Özel şef menüsü' }
  ],
  'pasta-tatli': [
    { id: 'p1', name: 'Doğum Günü Pastası', unit: 'kg', price: 400, description: 'Özel tasarım pasta' },
    { id: 'p2', name: 'Düğün Pastası', unit: 'kg', price: 600, description: 'Çok katlı özel pasta' },
    { id: 'p3', name: 'Cupcake Set', unit: 'piece', price: 25, description: '12li set' },
    { id: 'p4', name: 'Makaron', unit: 'piece', price: 15, description: 'Fransız makaron' },
    { id: 'p5', name: 'Tatlı Tabağı', unit: 'portion', price: 80, description: 'Karışık tatlı tabağı' }
  ],
  'kahve-ikram': [
    { id: 'k1', name: 'Kahve İkram Servisi', unit: 'person', price: 50, description: 'Türk kahvesi + kurabiye' },
    { id: 'k2', name: 'Çay-Kahve Servisi', unit: 'person', price: 35, description: 'Çay veya kahve' },
    { id: 'k3', name: 'Premium Kahve', unit: 'person', price: 75, description: 'Espresso bazlı içecekler' }
  ]
};

const servingStyles = [
  { id: 'buffet', label: 'Açık Büfe', icon: '🍽️' },
  { id: 'plated', label: 'Servis', icon: '🍴' },
  { id: 'cocktail', label: 'Kokteyl', icon: '🥂' },
  { id: 'family_style', label: 'Aile Usulü', icon: '👨‍👩‍👧‍👦' }
];

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

  const [step, setStep] = useState(1);
  const [localItems, setLocalItems] = useState<any[]>(orderItems || []);
  const [localDeliveryDate, setLocalDeliveryDate] = useState(deliveryDate || '');
  const [localDeliveryTime, setLocalDeliveryTime] = useState(deliveryTime || '');
  const [localDeliveryAddress, setLocalDeliveryAddress] = useState(deliveryAddress || '');
  const [localServingStyle, setLocalServingStyle] = useState<string>('buffet');
  const [localName, setLocalName] = useState(customerName || '');
  const [localPhone, setLocalPhone] = useState(customerPhone || '');
  const [localEmail, setLocalEmail] = useState(customerEmail || '');
  const [localNotes, setLocalNotes] = useState(customerNotes || '');

  const category = salon?.category || 'catering';
  const items = menuItems[category as keyof typeof menuItems] || menuItems.catering;

  const addItem = (item: any) => {
    const existing = localItems.find((i) => i.id === item.id);
    if (existing) {
      setLocalItems(
        localItems.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setLocalItems([...localItems, { ...item, quantity: 1 }]);
    }
  };

  const removeItem = (itemId: string) => {
    const existing = localItems.find((i) => i.id === itemId);
    if (existing && existing.quantity > 1) {
      setLocalItems(
        localItems.map((i) =>
          i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
        )
      );
    } else {
      setLocalItems(localItems.filter((i) => i.id !== itemId));
    }
  };

  const totalPrice = localItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleNext = () => {
    if (step === 1 && localItems.length === 0) {
      alert('Lütfen en az bir ürün seçin');
      return;
    }
    if (step === 2 && (!localDeliveryDate || !localDeliveryTime || !localDeliveryAddress)) {
      alert('Lütfen teslimat bilgilerini doldurun');
      return;
    }
    if (step === 3 && (!localName || !localPhone || !localEmail)) {
      alert('Lütfen iletişim bilgilerini doldurun');
      return;
    }

    if (step < 3) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setOrderDetails({
      deliveryDate: localDeliveryDate,
      deliveryTime: localDeliveryTime,
      deliveryAddress: localDeliveryAddress,
      orderItems: localItems,
      servingStyle: localServingStyle
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
      console.error('Sipariş hatası:', error);
      alert('Sipariş oluşturulamadı. Lütfen tekrar deneyin.');
    }
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 3);

  return (
    <div className="max-w-3xl mx-auto pb-24 px-4">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-[var(--chrome-white)] mb-2">
          Sipariş Oluştur
        </h1>
        <p className="font-body text-[var(--muted-lead)]">{salon?.name}</p>
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
                  <ShoppingCart className="inline mr-2" size={20} />
                  Menü Seçimi
                </label>
                <div className="space-y-3">
                  {items.map((item) => {
                    const inCart = localItems.find((i) => i.id === item.id);
                    return (
                      <div
                        key={item.id}
                        className="obsidian-card p-4 flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <h4 className="font-heading font-semibold text-[var(--chrome-white)]">
                            {item.name}
                          </h4>
                          <p className="text-sm text-[var(--muted-lead)] mb-1">
                            {item.description}
                          </p>
                          <p className="font-mono text-[var(--liquid-chrome)]">
                            {item.price} TL / {item.unit === 'person' ? 'kişi' : item.unit === 'kg' ? 'kg' : item.unit === 'piece' ? 'adet' : 'porsiyon'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {inCart ? (
                            <>
                              <button
                                onClick={() => removeItem(item.id)}
                                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
                              >
                                <Minus size={16} className="text-[var(--chrome-white)]" />
                              </button>
                              <span className="font-mono text-lg text-[var(--chrome-white)] w-8 text-center">
                                {inCart.quantity}
                              </span>
                              <button
                                onClick={() => addItem(item)}
                                className="w-8 h-8 rounded-full bg-[var(--liquid-chrome)] hover:bg-[var(--liquid-chrome)]/90 flex items-center justify-center transition-all"
                              >
                                <Plus size={16} className="text-[var(--void)]" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => addItem(item)}
                              className="px-4 h-9 rounded-full bg-[var(--liquid-chrome)] hover:bg-[var(--liquid-chrome)]/90 text-[var(--void)] font-heading font-semibold transition-all"
                            >
                              Ekle
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {category === 'catering' && (
                <div>
                  <label className="block font-heading font-semibold text-lg text-[var(--chrome-white)] mb-4">
                    Servis Şekli
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {servingStyles.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setLocalServingStyle(style.id)}
                        className={`p-4 rounded-2xl border-2 transition-all ${
                          localServingStyle === style.id
                            ? 'border-[var(--liquid-chrome)] bg-[var(--liquid-chrome)]/10'
                            : 'border-[var(--obsidian-rim)] bg-[var(--slate-surface)] hover:border-white/20'
                        }`}
                      >
                        <div className="text-3xl mb-2">{style.icon}</div>
                        <div className="font-heading font-semibold text-[var(--chrome-white)]">
                          {style.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {localItems.length > 0 && (
                <div className="obsidian-card p-4 bg-[var(--liquid-chrome)]/5 border-2 border-[var(--liquid-chrome)]/30">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-semibold text-[var(--chrome-white)]">
                      Toplam
                    </span>
                    <span className="font-mono text-2xl text-[var(--liquid-chrome)]">
                      {totalPrice.toLocaleString('tr-TR')} TL
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block font-heading font-semibold text-lg text-[var(--chrome-white)] mb-3">
                  <Calendar className="inline mr-2" size={20} />
                  Teslimat Tarihi
                </label>
                <input
                  type="date"
                  value={localDeliveryDate}
                  onChange={(e) => setLocalDeliveryDate(e.target.value)}
                  min={minDate.toISOString().split('T')[0]}
                  className="w-full h-14 px-4 rounded-2xl bg-[var(--slate-surface)] border-2 border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body outline-none transition-all focus:border-[var(--liquid-chrome)]"
                />
                <p className="text-sm text-[var(--muted-lead)] mt-2">
                  Minimum 3 gün önceden sipariş gereklidir
                </p>
              </div>

              <div>
                <label className="block font-heading font-semibold text-lg text-[var(--chrome-white)] mb-3">
                  <Clock className="inline mr-2" size={20} />
                  Teslimat Saati
                </label>
                <input
                  type="time"
                  value={localDeliveryTime}
                  onChange={(e) => setLocalDeliveryTime(e.target.value)}
                  className="w-full h-14 px-4 rounded-2xl bg-[var(--slate-surface)] border-2 border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body outline-none transition-all focus:border-[var(--liquid-chrome)]"
                />
              </div>

              <div>
                <label className="block font-heading font-semibold text-lg text-[var(--chrome-white)] mb-3">
                  <MapPin className="inline mr-2" size={20} />
                  Teslimat Adresi
                </label>
                <textarea
                  value={localDeliveryAddress}
                  onChange={(e) => setLocalDeliveryAddress(e.target.value)}
                  placeholder="Tam adres..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-2xl bg-[var(--slate-surface)] border-2 border-[var(--obsidian-rim)] text-[var(--chrome-white)] placeholder:text-[var(--ash)] font-body outline-none transition-all focus:border-[var(--liquid-chrome)] resize-none"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="obsidian-card p-6 mb-6">
                <h3 className="font-heading font-bold text-xl text-[var(--chrome-white)] mb-4">
                  Sipariş Özeti
                </h3>
                <div className="space-y-3 mb-4">
                  {localItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-[var(--silver-frost)]">
                      <span>
                        {item.name} x{item.quantity}
                      </span>
                      <span className="font-mono">
                        {(item.price * item.quantity).toLocaleString('tr-TR')} TL
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[var(--obsidian-rim)] pt-3 space-y-2">
                  <p className="text-[var(--silver-frost)]">
                    <span className="text-[var(--muted-lead)]">Teslimat:</span>{' '}
                    {localDeliveryDate} - {localDeliveryTime}
                  </p>
                  <p className="text-[var(--silver-frost)]">
                    <span className="text-[var(--muted-lead)]">Adres:</span>{' '}
                    {localDeliveryAddress}
                  </p>
                  <div className="border-t border-[var(--obsidian-rim)] pt-3 mt-3">
                    <p className="font-mono text-2xl text-[var(--chrome-white)]">
                      {totalPrice.toLocaleString('tr-TR')} TL
                    </p>
                    <p className="text-sm text-[var(--muted-lead)] mt-1">
                      %30 depozito: {(totalPrice * 0.3).toLocaleString('tr-TR')} TL
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
                    placeholder="Özel notlar..."
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
                {step === 3 ? 'Sipariş Oluştur' : 'Devam Et'}
                {step < 3 && <ArrowRight size={18} />}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
