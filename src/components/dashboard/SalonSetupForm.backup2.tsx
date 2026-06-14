import { useState, useEffect, lazy, Suspense, memo } from 'react';
import { motion } from 'framer-motion';
import { X, Save, MapPin, Navigation, Map } from 'lucide-react';
import { ChromaticButton } from '@/components/ui/ChromaticButton';
import { getCoordinates } from '@/lib/geocoding';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import type { Salon } from '@/types';
import { categoryGroups, getAllCategories, type CategoryId } from '@/config/categories';

// Lazy load heavy components
const ImageUploader = lazy(() => import('@/components/ui/ImageUploader').then(m => ({ default: m.ImageUploader })));
const MultiImageUploader = lazy(() => import('@/components/ui/MultiImageUploader').then(m => ({ default: m.MultiImageUploader })));

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

// Memoized category button component
const CategoryButton = memo(({ 
  category, 
  isSelected, 
  onClick 
}: { 
  category: any; 
  isSelected: boolean; 
  onClick: () => void;
}) => {
  const IconComponent = category.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative overflow-hidden p-3 sm:p-4 rounded-2xl sm:rounded-3xl border-2 transition-all ${
        isSelected
          ? 'border-purple-400/60 bg-gradient-to-br from-purple-500/15 via-fuchsia-500/10 to-pink-500/15 shadow-lg shadow-purple-500/20'
          : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
      }`}
    >
      {/* Gradient Overlay */}
      {isSelected && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5" />
      )}
      
      {/* Content */}
      <div className="relative flex flex-col items-center gap-2 sm:gap-3">
        {/* Icon Container - Oval/Circle */}
        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all ${
          isSelected 
            ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30' 
            : 'bg-white/5'
        }`}>
          <IconComponent 
            size={20} 
            className="sm:size-6" 
            color={isSelected ? '#ffffff' : '#9ca3af'} 
            strokeWidth={isSelected ? 2.5 : 2} 
          />
        </div>
        
        {/* Label */}
        <span className={`font-heading font-semibold text-xs sm:text-sm text-center leading-tight line-clamp-2 ${
          isSelected ? 'text-[var(--chrome-white)]' : 'text-[var(--muted-lead)]'
        }`}>
          {category.name}
        </span>
      </div>
      
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-lg">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  );
});

export function SalonSetupForm({ salon, onSave, onClose }: SalonSetupFormProps) {
  const { addToast } = useUIStore();
  const { user } = useAuthStore();
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
      monday: { open: '09:00', close: '21:30', isOpen: true },
      tuesday: { open: '09:00', close: '21:30', isOpen: true },
      wednesday: { open: '09:00', close: '21:30', isOpen: true },
      thursday: { open: '09:00', close: '21:30', isOpen: true },
      friday: { open: '09:00', close: '21:30', isOpen: true },
      saturday: { open: '09:00', close: '21:30', isOpen: true },
      sunday: { open: '10:00', close: '21:30', isOpen: false },
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
        ownerId: salon?.ownerId || user?.uid || '', // Use existing ownerId or current user's UID
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
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center p-3 sm:p-4 pt-8 sm:pt-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-3xl bg-[var(--slate-surface)] border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[88vh]"
        >
        {/* Header */}
        <div className="p-3 sm:p-5 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-xl sm:text-2xl text-[var(--chrome-white)]">
                {salon ? 'İşletme Bilgilerini Düzenle' : 'İşletme Oluştur'}
              </h3>
              <p className="text-sm text-[var(--muted-lead)] mt-1">
                {salon ? 'Bilgilerinizi güncelleyin' : 'Yeni işletmenizi oluşturun'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors flex-shrink-0"
            >
              <X size={18} className="sm:size-5 text-[var(--muted-lead)]" />
            </button>
          </div>
        </div>

        <form id="salon-form" onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* Basic Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs sm:text-sm">1</span>
              </div>
              <h4 className="font-heading font-bold text-base sm:text-lg text-[var(--chrome-white)]">Temel Bilgiler</h4>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-2">
                  İşletme Adı *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Örnek: Güzellik Salonu, Bungalov Tesisi"
                  className="w-full h-11 px-4 rounded-2xl bg-white/5 border border-white/10 text-[var(--chrome-white)] font-body outline-none focus:border-purple-500 focus:bg-white/10 transition-all text-base"
                />
              </div>

              <div>
                <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-2">
                  Kategori *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-2.5 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
                  {getAllCategories().map((cat) => (
                    <CategoryButton
                      key={cat.id}
                      category={cat}
                      isSelected={formData.category === cat.id}
                      onClick={() => setFormData({ ...formData, category: cat.id })}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className="w-full h-11 px-4 rounded-2xl bg-white/5 border border-white/10 text-[var(--chrome-white)] font-body outline-none focus:border-purple-500 focus:bg-white/10 transition-colors text-base"
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
                    className="w-full h-11 px-4 rounded-2xl bg-white/5 border border-white/10 text-[var(--chrome-white)] font-body outline-none focus:border-purple-500 focus:bg-white/10 transition-colors text-base"
                  />
                </div>
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
                  className="w-full h-11 px-4 rounded-2xl bg-white/5 border border-white/10 text-[var(--chrome-white)] font-body outline-none focus:border-purple-500 focus:bg-white/10 transition-colors text-base"
                />
              </div>

              <div>
                <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-1.5">
                  Açıklama
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="İşletmeniz hakkında kısa bir açıklama..."
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-[var(--chrome-white)] font-body outline-none focus:border-purple-500 focus:bg-white/10 transition-colors resize-none text-base"
                />
              </div>
            </div>
          </div>

          {/* Görseller */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs sm:text-sm">2</span>
              </div>
              <h4 className="font-heading font-bold text-base sm:text-lg text-[var(--chrome-white)]">Görseller</h4>
            </div>
            
            <Suspense fallback={
              <div className="h-32 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            }>
              <div className="space-y-3">
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
            </Suspense>
          </div>

          {/* Sosyal Medya */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs sm:text-sm">3</span>
              </div>
              <h4 className="font-heading font-bold text-base sm:text-lg text-[var(--chrome-white)]">Sosyal Medya</h4>
            </div>
            
            <div className="grid grid-cols-1 gap-2.5">
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
                  className="w-full h-11 px-4 rounded-2xl bg-white/5 border border-white/10 text-[var(--chrome-white)] font-body outline-none focus:border-purple-500 focus:bg-white/10 transition-colors text-base"
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
                  className="w-full h-11 px-4 rounded-2xl bg-white/5 border border-white/10 text-[var(--chrome-white)] font-body outline-none focus:border-purple-500 focus:bg-white/10 transition-colors text-base"
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
                  className="w-full h-11 px-4 rounded-2xl bg-white/5 border border-white/10 text-[var(--chrome-white)] font-body outline-none focus:border-purple-500 focus:bg-white/10 transition-colors text-base"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                <MapPin size={14} className="sm:size-4 text-white" strokeWidth={2.5} />
              </div>
              <h4 className="font-heading font-bold text-base sm:text-lg text-[var(--chrome-white)]">Adres Bilgileri</h4>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-1.5">
                  Şehir *
                </label>
                <select
                  value={formData.address.city}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    address: { ...formData.address, city: e.target.value }
                  })}
                  required
                  className="w-full h-11 px-4 rounded-2xl bg-white/5 border border-white/10 text-[var(--chrome-white)] font-body outline-none focus:border-purple-500 focus:bg-white/10 transition-colors text-base"
                >
                  {CITIES.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-1.5">
                  İlçe *
                </label>
                <input
                  type="text"
                  value={formData.address.district}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    address: { ...formData.address, district: e.target.value }
                  })}
                  required
                  placeholder="Örnek: Kadıköy"
                  className="w-full h-11 px-4 rounded-2xl bg-white/5 border border-white/10 text-[var(--chrome-white)] font-body outline-none focus:border-purple-500 focus:bg-white/10 transition-colors text-base"
                />
              </div>

              <div className="sm:col-span-2">
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
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-[var(--chrome-white)] font-body outline-none focus:border-purple-500 focus:bg-white/10 transition-colors resize-none text-base"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-1.5">
                  Konum Koordinatları
                </label>
                
                {/* Coordinate Display */}
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/10 mb-2">
                  <MapPin size={16} className="sm:size-[18px] text-[var(--liquid-chrome)] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm text-[var(--chrome-white)] break-all">
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
                    className="h-11 px-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-heading font-bold text-sm hover:shadow-lg hover:shadow-purple-500/25 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {gettingLocation ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Konum Alınıyor...</span>
                      </>
                    ) : (
                      <>
                        <Navigation size={16} className="sm:size-[18px]" strokeWidth={2.5} />
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
        </form>

        {/* Footer */}
        <div className="p-3 sm:p-5 border-t border-white/10 bg-[var(--slate-surface)] flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 px-6 rounded-2xl bg-white/5 border border-white/10 text-[var(--silver-frost)] font-heading font-semibold text-sm hover:bg-white/10 hover:border-white/20 transition-all active:scale-95"
            >
              İptal
            </button>
            <button
              type="submit"
              form="salon-form"
              disabled={loading}
              className="flex-1 h-12 px-6 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-heading font-bold text-sm hover:shadow-lg hover:shadow-purple-500/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <Save size={16} className="sm:size-[18px]" strokeWidth={2.5} />
                  <span>{salon ? 'Kaydet' : 'İşletme Oluştur'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>

    {/* Map Picker Modal */}
    {showMapPicker && (
      <div 
        data-map-modal
        className="fixed inset-0 z-[60] flex items-start justify-center p-4 bg-black/70 overflow-y-auto pt-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowMapPicker(false);
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
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
            <div className="relative w-full h-[300px] sm:h-[400px] rounded-3xl overflow-hidden border-2 border-[var(--obsidian-rim)]">
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
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/10">
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
                    className="w-full h-10 px-3 rounded-full bg-[var(--slate-surface)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-mono text-sm outline-none focus:border-purple-500 focus:bg-white/10 transition-colors"
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
                    className="w-full h-10 px-3 rounded-full bg-[var(--slate-surface)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-mono text-sm outline-none focus:border-purple-500 focus:bg-white/10 transition-colors"
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

