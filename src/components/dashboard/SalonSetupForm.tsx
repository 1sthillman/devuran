import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, MapPin, Navigation, Map } from 'lucide-react';
import { ChromaticButton } from '@/components/ui/ChromaticButton';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { MultiImageUploader } from '@/components/ui/MultiImageUploader';
import { getCoordinates } from '@/lib/geocoding';
import { useUIStore } from '@/store/uiStore';
import type { Salon } from '@/types';
import { categoryGroups, getAllCategories, type CategoryId } from '@/config/categories';

interface SalonSetupFormProps {
  salon?: Salon;
  onSave: (salonData: Omit<Salon, 'id' | 'stats' | 'isPremium' | 'isActive' | 'isAcceptingBookings'>) => Promise<void>;
  onClose: () => void;
}

const CITIES = [
  'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 
  'Mersin', 'Kayseri', 'Eskişehir', 'Diyarbakır', 'Samsun', 'Denizli', 'Şanlıurfa',
  'Adapazarı', 'Malatya', 'Kahramanmaraş', 'Erzurum', 'Van', 'Batman', 'Elazığ',
  'Sivas', 'Manisa', 'Tarsus', 'Kocaeli', 'Balıkesir', 'Kütahya', 'Trabzon', 'Çorum'
];

export function SalonSetupForm({ salon, onSave, onClose }: SalonSetupFormProps) {
  const { addToast } = useUIStore();
  const [formData, setFormData] = useState({
    name: salon?.name || '',
    category: (salon?.category || 'kuafor') as CategoryId,
    description: salon?.description || '',
    phone: salon?.phone || '',
    whatsappNumber: salon?.whatsappNumber || '',
    email: salon?.email || '',
    address: salon?.address || {
      full: '',
      district: '',
      city: 'İstanbul',
      coordinates: getCoordinates('İstanbul'),
    },
    coverImage: salon?.coverImage || '',
    logo: salon?.logo || '',
    galleryImages: salon?.galleryImages || [] as string[],
    socialMedia: salon?.socialMedia || {
      instagram: '',
      tiktok: '',
      youtube: '',
    },
    workingHours: salon?.workingHours || {
      monday: { open: '09:00', close: '18:00', isOpen: true },
      tuesday: { open: '09:00', close: '18:00', isOpen: true },
      wednesday: { open: '09:00', close: '18:00', isOpen: true },
      thursday: { open: '09:00', close: '18:00', isOpen: true },
      friday: { open: '09:00', close: '18:00', isOpen: true },
      saturday: { open: '09:00', close: '18:00', isOpen: true },
      sunday: { open: '10:00', close: '17:00', isOpen: false },
    },
    services: salon?.services || [],
    staff: salon?.staff || [],
    settings: salon?.settings || {
      advanceBookingDays: 30,
      autoConfirm: true,
      allowCancellation: true,
      cancellationHours: 24,
      allowQueue: true,
      autoConfirmQueue: true,
    },
  });
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [tempCoordinates, setTempCoordinates] = useState(formData.address.coordinates);

  // Scroll to top when modal opens
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Scroll to top when map picker opens
  useEffect(() => {
    if (showMapPicker) {
      // Scroll main window to top
      window.scrollTo({ top: 0, behavior: 'instant' });
      // Also scroll the modal container to top
      setTimeout(() => {
        const modalContainer = document.querySelector('[data-map-modal]');
        if (modalContainer) {
          modalContainer.scrollTop = 0;
        }
      }, 50);
    }
  }, [showMapPicker]);

  // Get current location using browser geolocation API
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      addToast('Tarayıcınız konum özelliğini desteklemiyor', 'error');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData((prev) => ({
          ...prev,
          address: {
            ...prev.address,
            coordinates: { lat: latitude, lng: longitude },
          },
        }));
        setTempCoordinates({ lat: latitude, lng: longitude });
        setGettingLocation(false);
        setShowMapPicker(true); // Haritayı göster
        addToast('Konum alındı. Haritada kontrol edin', 'success');
      },
      (error) => {
        console.error('Geolocation error:', error);
        setGettingLocation(false);
        addToast('Konum alınamadı. Lütfen konum iznini kontrol edin', 'error');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Update coordinates when city or district changes
  useEffect(() => {
    const coordinates = getCoordinates(formData.address.city);
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        coordinates,
      },
    }));
  }, [formData.address.city, formData.address.district]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Telefon validation
    const phoneRegex = /^5\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      addToast('Geçersiz telefon numarası. Lütfen 10 haneli numara girin (5XX XXX XX XX)', 'error');
      return;
    }
    
    // WhatsApp validation (opsiyonel ama girilmişse kontrol et)
    if (formData.whatsappNumber && !phoneRegex.test(formData.whatsappNumber)) {
      addToast('Geçersiz WhatsApp numarası. Lütfen 10 haneli numara girin (5XX XXX XX XX)', 'error');
      return;
    }
    
    setLoading(true);
    try {
      await onSave({
        ...formData,
        slug: formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      });
      onClose();
    } catch (error) {
      console.error('Error creating salon:', error);
    }
    setLoading(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 bg-black/80 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-3xl bg-[var(--slate-surface)] border border-[var(--obsidian-rim)] rounded-3xl p-6 my-4"
        >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-bold text-xl text-[var(--chrome-white)]">
            {salon ? 'İşletme Bilgilerini Düzenle' : 'İşletme Oluştur'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-3xl transition-colors"
          >
            <X size={20} className="text-[var(--muted-lead)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Info */}
          <div className="space-y-3">
            <h4 className="font-heading font-semibold text-[var(--silver-frost)]">Temel Bilgiler</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-1.5">
                  İşletme Adı *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Örnek: Güzellik Salonu, Bungalov Tesisi, Organizasyon Firması"
                  className="w-full h-12 px-4 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body outline-none focus:border-[var(--liquid-chrome)] transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-2">
                  Kategori *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {getAllCategories().map((cat) => {
                    const IconComponent = cat.icon;
                    const isSelected = formData.category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat.id })}
                        className={`h-[88px] rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-2.5 ${
                          isSelected
                            ? 'border-[var(--liquid-chrome)] bg-white/5 text-[var(--chrome-white)]'
                            : 'border-[var(--obsidian-rim)] text-[var(--muted-lead)] hover:border-[var(--silver-frost)] hover:text-[var(--silver-frost)]'
                        }`}
                      >
                        <IconComponent size={32} strokeWidth={isSelected ? 2.5 : 2} />
                        <span className="font-heading font-semibold text-sm">
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-1.5">
                  Telefon *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '');
                    setFormData({ ...formData, phone: cleaned.slice(0, 10) });
                  }}
                  required
                  placeholder="5XX XXX XX XX"
                  maxLength={10}
                  className="w-full h-12 px-4 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body outline-none focus:border-[var(--liquid-chrome)] transition-colors"
                />
                <p className="text-xs text-[var(--muted-lead)] mt-1">
                  10 haneli telefon numarası (5XX XXX XX XX)
                </p>
              </div>

              <div>
                <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-1.5">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  value={formData.whatsappNumber}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '');
                    setFormData({ ...formData, whatsappNumber: cleaned.slice(0, 10) });
                  }}
                  placeholder="5XX XXX XX XX"
                  maxLength={10}
                  className="w-full h-12 px-4 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body outline-none focus:border-[var(--liquid-chrome)] transition-colors"
                />
              </div>

              <div>
                <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-1.5">
                  E-posta
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="salon@example.com"
                  className="w-full h-12 px-4 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body outline-none focus:border-[var(--liquid-chrome)] transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-1.5">
                  Açıklama
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="İşletmeniz hakkında kısa bir açıklama..."
                  className="w-full px-4 py-3 rounded-3xl bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body outline-none focus:border-[var(--liquid-chrome)] transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Görseller */}
          <div className="space-y-3">
            <h4 className="font-heading font-semibold text-[var(--silver-frost)]">Görseller</h4>
            
            <ImageUploader
              label="Logo"
              value={formData.logo}
              onChange={(url) => setFormData({ ...formData, logo: url })}
              folder="logos"
            />

            <ImageUploader
              label="Kapak Görseli *"
              value={formData.coverImage}
              onChange={(url) => setFormData({ ...formData, coverImage: url })}
              folder="covers"
            />

            <MultiImageUploader
              label="Galeri Görselleri"
              value={formData.galleryImages}
              onChange={(urls) => setFormData({ ...formData, galleryImages: urls })}
              maxImages={10}
              folder="gallery"
            />
          </div>

          {/* Sosyal Medya */}
          <div className="space-y-3">
            <h4 className="font-heading font-semibold text-[var(--silver-frost)]">Sosyal Medya</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-1.5">
                  Instagram
                </label>
                <input
                  type="url"
                  value={formData.socialMedia.instagram}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    socialMedia: { ...formData.socialMedia, instagram: e.target.value }
                  })}
                  placeholder="https://instagram.com/..."
                  className="w-full h-12 px-4 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body outline-none focus:border-[var(--liquid-chrome)] transition-colors"
                />
              </div>

              <div>
                <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-1.5">
                  TikTok
                </label>
                <input
                  type="url"
                  value={formData.socialMedia.tiktok}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    socialMedia: { ...formData.socialMedia, tiktok: e.target.value }
                  })}
                  placeholder="https://tiktok.com/@..."
                  className="w-full h-12 px-4 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body outline-none focus:border-[var(--liquid-chrome)] transition-colors"
                />
              </div>

              <div>
                <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-1.5">
                  YouTube
                </label>
                <input
                  type="url"
                  value={formData.socialMedia.youtube}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    socialMedia: { ...formData.socialMedia, youtube: e.target.value }
                  })}
                  placeholder="https://youtube.com/@..."
                  className="w-full h-12 px-4 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body outline-none focus:border-[var(--liquid-chrome)] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-3">
            <h4 className="font-heading font-semibold text-[var(--silver-frost)] flex items-center gap-2">
              <MapPin size={18} />
              Adres Bilgileri
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-1.5">
                  Sehir *
                </label>
                <select
                  value={formData.address.city}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    address: { ...formData.address, city: e.target.value }
                  })}
                  required
                  className="w-full h-12 px-4 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body outline-none focus:border-[var(--liquid-chrome)] transition-colors"
                >
                  {CITIES.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-1.5">
                  Ilce *
                </label>
                <input
                  type="text"
                  value={formData.address.district}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    address: { ...formData.address, district: e.target.value }
                  })}
                  required
                  placeholder="Ornek: Kadikoy"
                  className="w-full h-12 px-4 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body outline-none focus:border-[var(--liquid-chrome)] transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-1.5">
                  Tam Adres *
                </label>
                <textarea
                  value={formData.address.full}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    address: { ...formData.address, full: e.target.value }
                  })}
                  required
                  rows={2}
                  placeholder="Sokak, mahalle, bina no, daire no..."
                  className="w-full px-4 py-3 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body outline-none focus:border-[var(--liquid-chrome)] transition-colors resize-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-1.5">
                  Konum Koordinatları
                </label>
                
                {/* Coordinate Display */}
                <div className="flex items-center gap-2 p-3 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)] mb-2">
                  <MapPin size={18} className="text-[var(--liquid-chrome)] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm text-[var(--chrome-white)]">
                      {formData.address.coordinates.lat.toFixed(6)}, {formData.address.coordinates.lng.toFixed(6)}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={gettingLocation}
                    className="h-12 px-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-heading font-bold text-sm hover:shadow-lg hover:shadow-purple-500/25 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {gettingLocation ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Konum Alınıyor...</span>
                      </>
                    ) : (
                      <>
                        <Navigation size={18} strokeWidth={2.5} />
                        <span>Konumumu Al ve Haritada Göster</span>
                      </>
                    )}
                  </button>
                </div>
                
                <p className="font-body text-xs text-[var(--muted-lead)] mt-2">
                  Butona tıklayın, konumunuz alınacak ve haritada gösterilecek. Haritada işaretleyerek düzeltebilirsiniz.
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-[var(--silver-frost)] font-heading font-semibold text-sm hover:bg-white/10 hover:border-white/20 hover:text-[var(--chrome-white)] transition-all active:scale-95"
            >
              İptal
            </button>
            <ChromaticButton type="submit" loading={loading} className="flex-1 flex items-center justify-center gap-2 px-8 py-3 shadow-lg shadow-purple-500/20">
              <Save size={18} strokeWidth={2.5} />
              <span>{salon ? 'Kaydet' : 'İşletme Oluştur'}</span>
            </ChromaticButton>
          </div>
        </form>
      </motion.div>
    </div>

    {/* Map Picker Modal */}
    {showMapPicker && (
      <div 
        data-map-modal
        className="fixed inset-0 z-[60] flex items-start justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto pt-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowMapPicker(false);
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl bg-[var(--slate-surface)] border border-[var(--obsidian-rim)] rounded-3xl p-5 my-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-lg text-[var(--chrome-white)]">
                Haritadan Konum İşaretle
              </h3>
              <p className="font-body text-sm text-[var(--muted-lead)] mt-0.5">
                Koordinatları girerek konumunuzu belirleyin
              </p>
            </div>
            <button
              onClick={() => setShowMapPicker(false)}
              className="p-2 hover:bg-white/5 rounded-full transition-colors flex-shrink-0"
            >
              <X size={20} className="text-[var(--muted-lead)]" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Map Container */}
            <div className="relative w-full h-[350px] sm:h-[450px] rounded-3xl overflow-hidden border-2 border-[var(--obsidian-rim)]">
              <iframe
                src={`https://www.google.com/maps?q=${tempCoordinates.lat},${tempCoordinates.lng}&z=15&output=embed`}
                className="w-full h-full"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            {/* Current Location Display */}
            <div className="flex items-center gap-2 p-3 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)]">
              <MapPin size={18} className="text-[var(--liquid-chrome)] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-heading font-medium text-sm text-[var(--chrome-white)]">
                  Seçili Konum
                </p>
                <p className="font-mono text-xs text-[var(--muted-lead)] truncate">
                  {tempCoordinates.lat.toFixed(6)}, {tempCoordinates.lng.toFixed(6)}
                </p>
              </div>
            </div>

            {/* Manual Coordinate Input */}
            <div className="bg-[var(--void)] border border-[var(--obsidian-rim)] rounded-3xl p-4">
              <p className="font-heading font-medium text-sm text-[var(--silver-frost)] mb-3">
                Koordinatları Manuel Gir
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-body text-xs text-[var(--muted-lead)] mb-1.5">
                    Enlem (Latitude)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={tempCoordinates.lat}
                    onChange={(e) => setTempCoordinates({ 
                      ...tempCoordinates, 
                      lat: parseFloat(e.target.value) || 0 
                    })}
                    className="w-full h-10 px-3 rounded-full bg-[var(--slate-surface)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-mono text-sm outline-none focus:border-[var(--liquid-chrome)] transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-body text-xs text-[var(--muted-lead)] mb-1.5">
                    Boylam (Longitude)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={tempCoordinates.lng}
                    onChange={(e) => setTempCoordinates({ 
                      ...tempCoordinates, 
                      lng: parseFloat(e.target.value) || 0 
                    })}
                    className="w-full h-10 px-3 rounded-full bg-[var(--slate-surface)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-mono text-sm outline-none focus:border-[var(--liquid-chrome)] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (!navigator.geolocation) {
                    addToast('Tarayıcınız konum özelliğini desteklemiyor', 'error');
                    return;
                  }
                  setGettingLocation(true);
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      const { latitude, longitude } = position.coords;
                      setTempCoordinates({ lat: latitude, lng: longitude });
                      setGettingLocation(false);
                      addToast('Konum başarıyla alındı', 'success');
                    },
                    (error) => {
                      console.error('Geolocation error:', error);
                      setGettingLocation(false);
                      addToast('Konum alınamadı. Lütfen konum iznini kontrol edin', 'error');
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                  );
                }}
                disabled={gettingLocation}
                className="h-12 px-5 rounded-full bg-[var(--liquid-chrome)]/10 border-2 border-[var(--liquid-chrome)]/30 text-[var(--chrome-white)] font-heading font-semibold text-sm hover:bg-[var(--liquid-chrome)]/20 hover:border-[var(--liquid-chrome)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Navigation size={18} strokeWidth={2.5} />
                {gettingLocation ? 'Alınıyor...' : 'Mevcut Konumumu Al'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    ...formData,
                    address: {
                      ...formData.address,
                      coordinates: tempCoordinates
                    }
                  });
                  setShowMapPicker(false);
                  addToast('Konum kaydedildi', 'success');
                }}
                className="h-12 px-6 rounded-full bg-gradient-to-r from-[var(--liquid-chrome)] to-[var(--liquid-chrome)]/80 text-[var(--void)] font-heading font-bold text-sm hover:shadow-lg hover:shadow-[var(--liquid-chrome)]/25 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Save size={18} strokeWidth={2.5} />
                Konumu Kaydet
              </button>
            </div>

            <p className="text-center font-body text-xs text-[var(--muted-lead)] px-4">
              Koordinatları manuel girin veya mevcut konumunuzu kullanın
            </p>
          </div>
        </motion.div>
      </div>
    )}
  </>
  );
}

