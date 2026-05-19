import { useState, useMemo, useEffect } from 'react';
import { SalonCard } from '@/components/salon/SalonCard';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { Search, Navigation, SlidersHorizontal, MapPin, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { salonsService, servicesService } from '@/services/firebaseService';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import type { Salon, Service } from '@/types';
import { categoryGroups, getCategoryById, getAllCategories, type CategoryId } from '@/config/categories';
import { cn } from '@/lib/utils';

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
  const { user, isOwner } = useAuthStore();

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
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setSortByDistance(true);
        },
        (error) => {
          console.log('Konum izni verilmedi', error);
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

      return isAvailable && matchesCategory && matchesGroup && (matchesSearch || matchesService);
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
  }, [searchQuery, activeCategory, activeGroup, salons, services, sortByDistance, userLocation]);

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

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          {/* Modern Logo & Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            {/* Logo */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-600 flex items-center justify-center relative overflow-hidden">
                <div className="absolute top-[-40%] left-[-40%] w-[80%] h-[80%] rounded-full bg-white/15" />
                <Calendar size={20} className="text-white relative z-10" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-0.5">
                  <span className="font-display font-bold text-lg md:text-xl text-[var(--chrome-white)] tracking-tight">ran</span>
                  <span className="font-display font-bold text-lg md:text-xl bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent tracking-tight">devu</span>
                </div>
                <span className="text-[9px] md:text-[10px] font-medium text-[var(--muted-lead)] uppercase tracking-wider">Hizmet Platformu</span>
              </div>
            </div>

            {/* Greeting */}
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
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-heading font-medium text-xs transition-all shrink-0",
                sortByDistance
                  ? "bg-white/10 border-white/20 text-[var(--chrome-white)]"
                  : "bg-white/[0.02] border-white/5 text-[var(--muted-lead)] hover:border-white/10"
              )}
            >
              <Navigation size={12} />
              <span>{sortByDistance ? 'Yakınıma Göre' : 'Yakınımda'}</span>
            </button>
            
            <div className="h-4 w-px bg-white/5" />
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--muted-lead)] font-body">Sonuçlar</span>
              <span className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold">
                {filteredSalons.length}
              </span>
            </div>
          </motion.div>

          {/* Categories Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="mb-4"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-[var(--chrome-white)] tracking-tight">Kategoriler</span>
              <button 
                onClick={() => {
                  setActiveGroup('all');
                  setActiveCategory('all');
                }}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
              >
                Tümü
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

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

      {/* Results */}
      <section className="max-w-7xl mx-auto px-4 mt-6">
        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
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
