import { useState, useMemo, useEffect } from 'react';
import { SalonCard } from '@/components/salon/SalonCard';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { Search, Navigation, SlidersHorizontal, MapPin, Calendar, Home as HomeIcon, CalendarDays, LayoutGrid, User, X, DollarSign, Coins, Banknote, Gem } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { salonsService, servicesService } from '@/services/firebaseService';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useUIStore } from '@/store/uiStore';
import type { Salon, Service } from '@/types';
import { categoryGroups, getCategoryById, getAllCategories, type CategoryId } from '@/config/categories';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';

export function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryId | 'all'>('all');
  const [activeGroup, setActiveGroup] = useState<string | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sortByDistance, setSortByDistance] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const { addToast } = useUIStore();
  const [selectedPriceRange, setSelectedPriceRange] = useState<'all' | 'budget' | 'mid' | 'premium'>('all');
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const { user, isOwner } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [salonsData, servicesData] = await Promise.all([
        salonsService.getAll(),
        servicesService.getAll(),
      ]);
      setSalons(salonsData);
      setServices(servicesData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const requestLocation = () => {
    if (sortByDistance) {
      // Zaten aktifse kapat
      setSortByDistance(false);
      setUserLocation(null);
      return;
    }

    if ('geolocation' in navigator) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setSortByDistance(true);
          setLocationLoading(false);
        },
        (error) => {
          // Konum izni verilmedi - sessizce devam et
          addToast('Konum izni gerekli. Lütfen tarayıcı ayarlarınızdan konum iznini açın.', 'warning');
          setLocationLoading(false);
        }
      );
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const filteredSalons = useMemo(() => {
    let filtered = salons.filter((salon) => {
      const matchesCategory = activeCategory === 'all' || salon.category === activeCategory;
      const matchesGroup = activeGroup === 'all' || getCategoryById(salon.category).groupId === activeGroup;
      const query = searchQuery.toLowerCase();
      
      const isAvailable = salon.isActive && salon.isAcceptingBookings !== false;
      
      const matchesSearch =
        !query ||
        salon.name.toLowerCase().includes(query) ||
        salon.address.district.toLowerCase().includes(query) ||
        salon.address.city.toLowerCase().includes(query) ||
        salon.description.toLowerCase().includes(query);

      const salonServices = services.filter(s => s.salonId === salon.id);
      const matchesService = salonServices.some(s => 
        s.name.toLowerCase().includes(query) ||
        (s.description && s.description.toLowerCase().includes(query)) ||
        s.category.toLowerCase().includes(query)
      );

      // Fiyat filtresi
      let matchesPrice = true;
      if (selectedPriceRange !== 'all' && salonServices.length > 0) {
        const avgPrice = salonServices.reduce((sum, s) => sum + s.price, 0) / salonServices.length;
        if (selectedPriceRange === 'budget') matchesPrice = avgPrice < 100;
        else if (selectedPriceRange === 'mid') matchesPrice = avgPrice >= 100 && avgPrice < 300;
        else if (selectedPriceRange === 'premium') matchesPrice = avgPrice >= 300;
      }

      // Puan filtresi
      const matchesRating = selectedRating === 0 || (salon.stats?.averageRating || 0) >= selectedRating;

      return isAvailable && matchesCategory && matchesGroup && (matchesSearch || matchesService) && matchesPrice && matchesRating;
    });

    if (sortByDistance && userLocation) {
      filtered = filtered.map(salon => ({
        ...salon,
        distance: calculateDistance(
          userLocation.lat,
          userLocation.lng,
          salon.address.coordinates.lat,
          salon.address.coordinates.lng
        )
      })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    return filtered;
  }, [searchQuery, activeCategory, activeGroup, salons, services, sortByDistance, userLocation, selectedPriceRange, selectedRating]);

  const currentGroup = activeGroup !== 'all' ? categoryGroups.find(g => g.id === activeGroup) : null;
  const groupCategories = currentGroup 
    ? getAllCategories().filter(cat => cat.groupId === activeGroup)
    : [];

  return (
    <div className="pb-8">
      {/* Hero Section - Refined Design */}
      <section className="py-6 md:py-8 relative overflow-hidden">
        {/* Ambient Glow Effects */}
        <div
          className="absolute top-[-60px] left-[-40px] w-[280px] h-[280px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(120, 80, 255, 0.18) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute top-[20px] right-[-60px] w-[200px] h-[200px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(220, 80, 180, 0.1) 0%, transparent 70%)',
          }}
        />

        <div className="max-w-[1400px] mx-auto px-4 relative z-10">
          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <div className="mb-1">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs md:text-sm text-[var(--muted-lead)]">
                  Merhaba{user?.displayName ? `, ${user.displayName}` : ''}
                </p>
                {userLocation && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                    <MapPin size={11} className="text-purple-400" />
                    <span className="text-[10px] font-medium text-purple-300">{filteredSalons.length} işletme yakında</span>
                  </div>
                )}
              </div>
              <h1 className="font-display font-black text-3xl md:text-5xl text-[var(--chrome-white)] leading-tight tracking-tight">
                Her anınız için{' '}
                <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                  mükemmel
                </span>
                <br />hizmet
              </h1>
            </div>
          </motion.div>

          {/* Enhanced Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-5"
          >
            <div className="relative">
              {/* Outer border with gradient */}
              <div className="rounded-full bg-gradient-to-r from-white/[0.08] to-white/[0.04] p-[1px]">
                {/* Inner container */}
                <div className="rounded-full bg-[var(--slate-surface)]/80 backdrop-blur-xl">
                  <div className="flex items-center gap-3 px-4 py-3 md:py-3.5">
                    {/* Search Icon */}
                    <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                      <Search size={16} className="text-[var(--muted-lead)]" />
                    </div>
                    
                    {/* Input */}
                    <input
                      type="text"
                      placeholder="Hizmet, işletme veya konum ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--chrome-white)] placeholder:text-[var(--ash)] font-body"
                    />
                    
                    {/* Filter Button */}
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold whitespace-nowrap hover:shadow-lg hover:shadow-purple-500/25 transition-all active:scale-95"
                    >
                      <SlidersHorizontal size={14} />
                      <span className="hidden sm:inline">Filtre</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Location & Results Count */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex items-center gap-3 mb-4"
          >
            <button
              onClick={requestLocation}
              disabled={locationLoading}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-heading font-medium text-xs transition-all shrink-0 active:scale-95",
                sortByDistance
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 border-transparent text-white shadow-lg shadow-purple-500/25"
                  : "bg-white/[0.02] border-white/5 text-[var(--muted-lead)] hover:border-white/10 hover:bg-white/5",
                locationLoading && "opacity-50 cursor-not-allowed"
              )}
            >
              {locationLoading ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Alınıyor...</span>
                </>
              ) : (
                <>
                  <Navigation size={12} className={sortByDistance ? "animate-pulse" : ""} />
                  <span>{sortByDistance ? 'Yakınıma Göre ✓' : 'Yakınımda'}</span>
                </>
              )}
            </button>
            
            {!sortByDistance && (
              <>
                <div className="h-4 w-px bg-white/5" />
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--muted-lead)] font-body">Sonuçlar</span>
                  <span className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold">
                    {filteredSalons.length}
                  </span>
                </div>
              </>
            )}
          </motion.div>

          {/* Categories Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="mb-4"
          >
            {/* Category Pills - Horizontal Scroll */}
            <div className="relative">
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex gap-2 pb-2 px-1">
                  {/* All Button */}
                  <button
                    onClick={() => {
                      setActiveGroup('all');
                      setActiveCategory('all');
                    }}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all whitespace-nowrap shrink-0",
                      activeGroup === 'all'
                        ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/40 text-[var(--chrome-white)] shadow-lg shadow-purple-500/10"
                        : "bg-white/[0.02] border-white/[0.06] text-[var(--muted-lead)] hover:border-white/10 hover:bg-white/[0.04]"
                    )}
                  >
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 2h3v3H2V2zm5 0h3v3H7V2zM2 7h3v3H2V7zm5 0h3v3H7V7z" fill="currentColor" className="text-white"/>
                      </svg>
                    </div>
                    <span className="font-heading font-semibold text-sm">Tümü</span>
                  </button>

                  {/* Category Groups */}
                  {categoryGroups.map((group) => {
                    const Icon = group.icon;
                    const isActive = activeGroup === group.id;
                    
                    return (
                      <button
                        key={group.id}
                        onClick={() => {
                          setActiveGroup(group.id);
                          setActiveCategory('all');
                        }}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all whitespace-nowrap shrink-0 group",
                          isActive
                            ? "bg-white/10 border-white/20 text-[var(--chrome-white)] shadow-lg"
                            : "bg-white/[0.02] border-white/[0.06] text-[var(--muted-lead)] hover:border-white/10 hover:bg-white/[0.04]"
                        )}
                      >
                        <div className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center transition-all",
                          isActive 
                            ? `bg-gradient-to-br ${group.color}` 
                            : "bg-white/5 group-hover:bg-white/10"
                        )}>
                          <Icon size={12} className={isActive ? "text-white" : "text-[var(--muted-lead)]"} />
                        </div>
                        <span className="font-heading font-semibold text-sm">{group.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sub-categories - Compact Pills */}
            <AnimatePresence mode="wait">
              {activeGroup !== 'all' && groupCategories.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden mt-2"
                >
                  <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-2 px-1">
                    {groupCategories.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setActiveCategory(cat.id)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all whitespace-nowrap text-xs shrink-0",
                            activeCategory === cat.id
                              ? "bg-white/8 border-white/15 text-[var(--chrome-white)]"
                              : "bg-white/[0.01] border-white/[0.04] text-[var(--ash)] hover:border-white/8 hover:text-[var(--muted-lead)]"
                          )}
                        >
                          <Icon size={11} />
                          <span className="font-heading font-medium">{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowFilters(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 bg-[var(--void)] rounded-t-3xl border-t border-white/10 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display font-bold text-xl text-[var(--chrome-white)]">
                    Filtrele
                  </h3>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
                  >
                    <X size={20} className="text-[var(--muted-lead)]" />
                  </button>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <label className="block font-heading font-semibold text-sm text-[var(--chrome-white)] mb-3">
                    Fiyat Aralığı
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'all', label: 'Tümü', IconComponent: DollarSign },
                      { id: 'budget', label: 'Ekonomik', IconComponent: Coins, desc: '< 100₺' },
                      { id: 'mid', label: 'Orta', IconComponent: Banknote, desc: '100-300₺' },
                      { id: 'premium', label: 'Premium', IconComponent: Gem, desc: '> 300₺' },
                    ].map((range) => {
                      const Icon = range.IconComponent;
                      return (
                      <button
                        key={range.id}
                        onClick={() => setSelectedPriceRange(range.id as any)}
                        className={cn(
                          "p-3 rounded-2xl border-2 transition-all text-left",
                          selectedPriceRange === range.id
                            ? "border-purple-500 bg-purple-500/10"
                            : "border-white/5 bg-white/[0.02] hover:border-white/10"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon size={18} className="text-[var(--liquid-chrome)]" strokeWidth={2} />
                          <span className="font-heading font-semibold text-sm text-[var(--chrome-white)]">
                            {range.label}
                          </span>
                        </div>
                        {range.desc && (
                          <p className="text-xs text-[var(--muted-lead)] ml-7">{range.desc}</p>
                        )}
                      </button>
                    );
                    })}
                  </div>
                </div>

                {/* Rating */}
                <div className="mb-6">
                  <label className="block font-heading font-semibold text-sm text-[var(--chrome-white)] mb-3">
                    Minimum Puan
                  </label>
                  <div className="flex gap-2">
                    {[0, 3, 4, 4.5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setSelectedRating(rating)}
                        className={cn(
                          "flex-1 px-4 py-3 rounded-2xl border-2 transition-all",
                          selectedRating === rating
                            ? "border-purple-500 bg-purple-500/10"
                            : "border-white/5 bg-white/[0.02] hover:border-white/10"
                        )}
                      >
                        <div className="text-center">
                          <div className="text-lg mb-1">
                            {rating === 0 ? '⭐' : '⭐'.repeat(Math.floor(rating))}
                          </div>
                          <span className="text-xs font-heading font-semibold text-[var(--chrome-white)]">
                            {rating === 0 ? 'Tümü' : `${rating}+`}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedPriceRange('all');
                      setSelectedRating(0);
                    }}
                    className="flex-1 h-12 rounded-full bg-white/5 hover:bg-white/10 text-[var(--chrome-white)] font-heading font-semibold transition-all"
                  >
                    Temizle
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="flex-1 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-heading font-bold transition-all hover:shadow-lg hover:shadow-purple-500/25"
                  >
                    Uygula
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <section className="max-w-[1400px] mx-auto px-4 mt-6">
        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredSalons.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
              <Search size={32} className="text-[var(--muted-lead)]" />
            </div>
            <h3 className="font-heading font-bold text-xl text-[var(--chrome-white)] mb-2">
              Sonuç Bulunamadı
            </h3>
            <p className="font-body text-[var(--muted-lead)] max-w-md mx-auto">
              Arama kriterlerinize uygun işletme bulunamadı. Farklı bir kategori veya arama terimi deneyin.
            </p>
          </div>
        )}

        {/* Salons Grid */}
        {!loading && filteredSalons.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
          >
            {filteredSalons.map((salon, index) => (
              <motion.div
                key={salon.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <SalonCard salon={salon} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

    </div>
  );
}
