import { useState, useMemo, useEffect } from 'react';
import { SalonCard } from '@/components/salon/SalonCard';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { Search, Navigation, SlidersHorizontal, MapPin, Calendar, Home as HomeIcon, CalendarDays, LayoutGrid, User, X, DollarSign, Coins, Banknote, Gem, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { salonsService, servicesService } from '@/services/firebaseService';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useUIStore } from '@/store/uiStore';
import type { Salon, Service } from '@/types';
import { categoryGroups, getCategoryById, getAllCategories, type CategoryId } from '@/config/categories';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';
import { syncAllSalonSubscriptions, makeAllSalonsActive } from '@/utils/syncSalonSubscriptions';

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

  // Filter panel body scroll lock
  useEffect(() => {
    if (showFilters) {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
    } else {
      document.body.style.overflow = '';
      document.body.style.height = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.height = '';
    };
  }, [showFilters]);

  // ESC key to close filters
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showFilters) {
        setShowFilters(false);
      }
    };
    if (showFilters) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [showFilters]);

  useEffect(() => {
    loadData();
    
    // Make sync function available in console for admin
    if (typeof window !== 'undefined') {
      (window as any).syncSalons = syncAllSalonSubscriptions;
      (window as any).makeAllActive = makeAllSalonsActive;
    }
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
    <div className="pb-8 pt-6">
      {/* Hero Section - Wide Layout for Desktop */}
      <section className="py-6 md:py-12 lg:py-16 relative overflow-hidden">
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

        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 relative z-10">
          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 md:mb-8"
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
              <h1 className="font-display font-black text-3xl md:text-5xl lg:text-6xl xl:text-7xl text-[var(--chrome-white)] leading-tight tracking-tight">
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
                    
                    {/* Modern Filter Button */}
                    <motion.button
                      onClick={() => setShowFilters(!showFilters)}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white text-xs font-bold whitespace-nowrap hover:shadow-xl hover:shadow-purple-500/40 transition-all hover:scale-105"
                    >
                      <SlidersHorizontal size={16} strokeWidth={2.5} />
                      <span className="hidden sm:inline">Filtrele</span>
                    </motion.button>
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

      {/* Modern Filter Panel - Always Centered */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-0 left-0 right-0 bottom-0 z-[99999] bg-black/80 backdrop-blur-2xl"
            style={{
              position: 'fixed',
              width: '100vw',
              height: '100vh',
              overflow: 'hidden',
              overscrollBehavior: 'contain'
            }}
            onClick={() => setShowFilters(false)}
          >
            <div 
              className="absolute inset-0 flex items-center justify-center p-3 sm:p-4"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-xl"
                style={{ maxHeight: 'calc(100vh - 2rem)', display: 'flex', flexDirection: 'column' }}
              >
                {/* Header - Kompakt */}
                <div className="mb-3 flex items-center justify-between flex-shrink-0">
                  <div>
                    <h2 className="font-heading font-bold text-xl sm:text-2xl text-white">Filtreler</h2>
                    <p className="text-xs sm:text-sm text-white/50 mt-0.5">{filteredSalons.length} sonuç</p>
                  </div>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Content Card - Scrollable */}
                <div className="rounded-[28px] sm:rounded-[32px] bg-gradient-to-r from-white/[0.08] to-white/[0.04] p-[1px] flex-1 min-h-0 overflow-hidden">
                  <div className="h-full rounded-[28px] sm:rounded-[32px] bg-[var(--slate-surface)]/95 backdrop-blur-xl overflow-y-auto">
                    <div className="p-4 sm:p-6 space-y-5">
                      {/* Fiyat Aralığı */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-[var(--chrome-white)] mb-2.5">
                          Fiyat Aralığı
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'all', label: 'Tümü' },
                            { id: 'budget', label: '<100₺' },
                            { id: 'mid', label: '100-300₺' },
                            { id: 'premium', label: '>300₺' },
                          ].map((range) => {
                            const isSelected = selectedPriceRange === range.id;
                            return (
                              <button
                                key={range.id}
                                onClick={() => setSelectedPriceRange(range.id as any)}
                                className={cn(
                                  "py-3 sm:py-3.5 rounded-[18px] sm:rounded-[20px] text-xs sm:text-sm font-semibold transition-all duration-200",
                                  isSelected
                                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30"
                                    : "bg-white/[0.06] border border-white/[0.08] text-[var(--silver-frost)] hover:bg-white/[0.1] hover:border-white/[0.12]"
                                )}
                              >
                                {range.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Minimum Puan */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-[var(--chrome-white)] mb-2.5">
                          Minimum Puan
                        </label>
                        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                          {[
                            { rating: 0, label: 'Tümü' },
                            { rating: 3, label: '3+' },
                            { rating: 4, label: '4+' },
                            { rating: 4.5, label: '4.5+' }
                          ].map((item) => {
                            const isSelected = selectedRating === item.rating;
                            return (
                              <button
                                key={item.rating}
                                onClick={() => setSelectedRating(item.rating)}
                                className={cn(
                                  "py-3 sm:py-3.5 rounded-[18px] sm:rounded-[20px] text-xs sm:text-sm font-semibold transition-all duration-200",
                                  isSelected
                                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30"
                                    : "bg-white/[0.06] border border-white/[0.08] text-[var(--silver-frost)] hover:bg-white/[0.1] hover:border-white/[0.12]"
                                )}
                              >
                                {item.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Kategori */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-[var(--chrome-white)] mb-2.5">
                          Kategori
                        </label>
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                          <button
                            onClick={() => {
                              setActiveGroup('all');
                              setActiveCategory('all');
                            }}
                            className={cn(
                              "aspect-square rounded-[20px] sm:rounded-[24px] transition-all duration-200 flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-2 sm:p-3",
                              activeGroup === 'all'
                                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30"
                                : "bg-white/[0.06] border border-white/[0.08] text-[var(--silver-frost)] hover:bg-white/[0.1] hover:border-white/[0.12]"
                            )}
                          >
                            <Sparkles size={20} strokeWidth={2} className="sm:w-6 sm:h-6" />
                            <span className="text-[9px] sm:text-[10px] font-bold">Tümü</span>
                          </button>
                          
                          {categoryGroups.map((group) => {
                            const isActive = activeGroup === group.id;
                            const IconComponent = group.icon;
                            return (
                              <button
                                key={group.id}
                                onClick={() => {
                                  setActiveGroup(group.id);
                                  setActiveCategory('all');
                                }}
                                className={cn(
                                  "aspect-square rounded-[20px] sm:rounded-[24px] transition-all duration-200 flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-2 sm:p-3",
                                  isActive
                                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30"
                                    : "bg-white/[0.06] border border-white/[0.08] text-[var(--silver-frost)] hover:bg-white/[0.1] hover:border-white/[0.12]"
                                )}
                              >
                                <IconComponent size={20} strokeWidth={2} className="sm:w-6 sm:h-6" />
                                <span className="text-[9px] sm:text-[10px] font-bold text-center leading-tight">
                                  {group.name.includes('&') ? group.name.split('&')[0].trim() : group.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons - Kompakt */}
                <div className="mt-3 flex gap-2 sm:gap-3 flex-shrink-0">
                  <button
                    onClick={() => {
                      setSelectedPriceRange('all');
                      setSelectedRating(0);
                      setActiveGroup('all');
                      setActiveCategory('all');
                    }}
                    className="flex-1 h-12 sm:h-14 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold text-sm transition-all"
                  >
                    Temizle
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="flex-[2] h-12 sm:h-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-xl hover:shadow-purple-500/40 text-white font-bold text-sm transition-all"
                  >
                    {filteredSalons.length} Sonuç Göster
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <section className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 mt-6">
        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
            {[...Array(10)].map((_, i) => (
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
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6"
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
