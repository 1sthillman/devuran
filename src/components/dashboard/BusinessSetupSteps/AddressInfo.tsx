import { useState } from 'react';
import { MapPin, Navigation, Map, X, Search, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/store/uiStore';
import { TURKEY_CITIES, CITY_COORDINATES } from '@/data/turkeyLocations';
import { cn } from '@/lib/utils';

interface AddressInfoProps {
  data: {
    full: string;
    district: string;
    city: string;
    coordinates: { lat: number; lng: number };
  };
  onChange: (data: any) => void;
}

const CITIES = [
  'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 
  'Mersin', 'Kayseri', 'Eskişehir', 'Diyarbakır', 'Samsun', 'Denizli', 'Şanlıurfa',
  'Adapazarı', 'Malatya', 'Kahramanmaraş', 'Erzurum', 'Van', 'Batman', 'Elazığ',
  'Sivas', 'Manisa', 'Tarsus', 'Kocaeli', 'Balıkesir', 'Kütahya', 'Trabzon', 'Çorum'
];

export function AddressInfo({ data, onChange }: AddressInfoProps) {
  const { addToast } = useUIStore();
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [citySearch, setCitySearch] = useState('');

  const filteredCities = TURKEY_CITIES.filter(city =>
    city.toLowerCase().includes(citySearch.toLowerCase())
  );

  const handleCitySelect = (city: string) => {
    const coordinates = CITY_COORDINATES[city] || { lat: 39.9334, lng: 32.8597 };
    onChange({
      ...data,
      city,
      coordinates
    });
    setShowCitySelector(false);
    setCitySearch('');
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      addToast('Tarayıcınız konum özelliğini desteklemiyor', 'error');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onChange({
          ...data,
          coordinates: { lat: latitude, lng: longitude }
        });
        setGettingLocation(false);
        setShowMapPicker(true);
        addToast('Konum alındı! Haritada kontrol edin', 'success');
      },
      (error) => {
        console.error('Geolocation error:', error);
        setGettingLocation(false);
        addToast('Konum alınamadı. Lütfen konum iznini kontrol edin', 'error');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <>
      <div className="space-y-3 sm:space-y-4">
        {/* Info Badge */}
        <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
          <p className="text-sm text-[var(--silver-frost)] text-center">
            İşletmenizin konumunu belirtin. GPS ile otomatik konum alabilirsiniz.
          </p>
        </div>

        <div className="space-y-3">
          {/* City & District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-heading font-semibold text-sm text-[var(--chrome-white)] mb-2">
                Şehir *
              </label>
              <button
                type="button"
                onClick={() => setShowCitySelector(true)}
                className="w-full h-12 px-4 rounded-full bg-white/5 border border-white/10 text-[var(--chrome-white)] text-sm outline-none hover:border-purple-500/50 hover:bg-white/10 transition-all flex items-center justify-between"
              >
                <span>{data.city}</span>
                <ChevronDown size={18} className="text-[var(--muted-lead)]" />
              </button>
            </div>

            <div>
              <label className="block font-heading font-semibold text-sm text-[var(--chrome-white)] mb-2">
                İlçe *
              </label>
              <input
                type="text"
                value={data.district}
                onChange={(e) => onChange({ ...data, district: e.target.value })}
                placeholder="Örn: Kadıköy, Çankaya..."
                className="w-full h-12 px-4 rounded-full bg-white/5 border border-white/10 text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
              />
            </div>
          </div>

          {/* Full Address */}
          <div>
            <label className="block font-heading font-semibold text-sm text-[var(--chrome-white)] mb-2 flex items-center gap-2">
              <MapPin size={16} className="text-emerald-400" />
              Tam Adres *
            </label>
            <textarea
              value={data.full}
              onChange={(e) => onChange({ ...data, full: e.target.value })}
              placeholder="Mahalle, sokak, bina no, kat, daire..."
              rows={3}
              className="w-full px-4 py-3 rounded-3xl bg-white/5 border border-white/10 text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all resize-none"
            />
          </div>

          {/* GPS Location */}
          <div>
            <label className="block font-heading font-semibold text-sm text-[var(--chrome-white)] mb-2">
              Konum Koordinatları
            </label>
            
            {/* Coordinate Display */}
            <div className="flex items-center gap-2 p-4 rounded-3xl bg-white/5 border border-white/10 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                <MapPin size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm text-[var(--chrome-white)] break-all">
                  {data.coordinates.lat.toFixed(6)}, {data.coordinates.lng.toFixed(6)}
                </p>
                <p className="text-xs text-[var(--muted-lead)] mt-0.5">
                  Latitude, Longitude
                </p>
              </div>
            </div>

            {/* GPS Button */}
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={gettingLocation}
              className="w-full h-12 px-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-heading font-bold text-sm hover:shadow-lg hover:shadow-emerald-500/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {gettingLocation ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Konum Alınıyor...</span>
                </>
              ) : (
                <>
                  <Navigation size={18} strokeWidth={2.5} />
                  <span>GPS ile Konum Al</span>
                </>
              )}
            </button>

            <p className="text-xs text-[var(--muted-lead)] mt-2 text-center">
              Tarayıcınızın konum iznini onaylayın
            </p>
          </div>
        </div>
      </div>

      {/* Modern City Selector Modal */}
      {showCitySelector && (
        <div 
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
          onClick={() => setShowCitySelector(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-0" />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 w-full max-w-md bg-[var(--slate-surface)] border border-white/10 rounded-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-lg text-[var(--chrome-white)]">
                  Şehir Seçin
                </h3>
                <button
                  onClick={() => setShowCitySelector(false)}
                  className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
                >
                  <X size={18} className="text-[var(--muted-lead)]" />
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-lead)]" />
                <input
                  type="text"
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  placeholder="Şehir ara..."
                  autoFocus
                  className="w-full h-12 pl-11 pr-4 rounded-full bg-white/5 border border-white/10 text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
                />
              </div>
            </div>

            {/* Cities List */}
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {filteredCities.map((city) => (
                <button
                  key={city}
                  onClick={() => handleCitySelect(city)}
                  className={cn(
                    "w-full px-5 py-3 text-left transition-all border-b border-white/5 hover:bg-white/5",
                    data.city === city && "bg-purple-500/10 border-purple-500/20"
                  )}
                >
                  <span className={cn(
                    "font-heading font-semibold text-sm",
                    data.city === city ? "text-purple-300" : "text-[var(--chrome-white)]"
                  )}>
                    {city}
                  </span>
                </button>
              ))}
              {filteredCities.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-sm text-[var(--muted-lead)]">Şehir bulunamadı</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Map Preview Modal */}
      {showMapPicker && (
        <div 
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
          onClick={() => setShowMapPicker(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-0" />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 w-full max-w-3xl bg-[var(--slate-surface)] border border-white/10 rounded-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-lg text-[var(--chrome-white)]">
                  Konum Önizlemesi
                </h3>
                <p className="text-sm text-[var(--muted-lead)] mt-0.5">
                  İşletmenizin konumu doğru görünüyor mu?
                </p>
              </div>
              <button
                onClick={() => setShowMapPicker(false)}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
              >
                <X size={20} className="text-[var(--muted-lead)]" />
              </button>
            </div>

            <div className="p-5">
              <div className="relative w-full h-[400px] rounded-3xl overflow-hidden border border-white/10">
                <iframe
                  src={`https://www.google.com/maps?q=${data.coordinates.lat},${data.coordinates.lng}&z=15&output=embed`}
                  className="w-full h-full"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => setShowMapPicker(false)}
                  className="flex-1 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-heading font-bold text-sm hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
                >
                  Konumu Onayla
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
