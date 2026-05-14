import { useState, useMemo, useEffect } from 'react';
import { SalonCard } from '@/components/salon/SalonCard';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { Search, Navigation, ChevronDown, Grid3x3, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { salonsService, servicesService } from '@/services/firebaseService';
import { useAuthStore } from '@/store/authStore';
import type { Salon, Service } from '@/types';
import { categoryGroups, getCategoryById, getAllCategories, type CategoryId } from '@/config/categories';
import { cn } from '@/lib/utils';

export function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryId | 'all'>('all');
  const [activeGroup, setActiveGroup] = useState<string | 'all'>('all');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sortByDistance, setSortByDistance] = useState(false);
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

  const featuredSalons = salons.filter((s) => s.isPremium && s.isActive);

  const currentGroup = activeGroup !== 'all' ? categoryGroups.find(g => g.id === activeGroup) : null;
  const groupCategories = currentGroup 
    ? getAllCategories().filter(cat => cat.groupId === activeGroup)
    : [];

  return (
    <div className="pb-8">
      {/* Hero Section */}
      <section className="py-8 md:py-12 relative">
        <div
          className="absolute inset-x-0 top-0 h-[40vh] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 20%, rgba(255,255,255,0.04) 0%, transparent 50%)',
          }}
        />

        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h1 className="font-display font-black text-3xl md:text-5xl text-[var(--chrome-white)] leading-tight mb-3">
              Her Anınız İçin{' '}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Mükemmel Hizmet
              </span>
            </h1>
            <p className="font-body text-base text-[var(--muted-lead)] max-w-xl mx-auto">
              Güzellikten organizasyona, tüm ihtiyaçlarınız için profesyonel hizmet
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="max-w-3xl mx-auto mb-6"
          >
            <div className="relative">
              <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--muted-lead)]" />
              <input
                type="text"
                placeholder="Hizmet, işletme veya konum ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-14 pl-14 pr-5 rounded-2xl bg-white/[0.04] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] placeholder:text-[var(--ash)] font-body text-sm outline-none transition-all focus:border-[var(--liquid-chrome)] focus:bg-white/[0.06]"
              />
            </div>
          </motion.div>

          {/* Compact Category Pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex items-center gap-2 mb-4"
          >
            <button
              onClick={requestLocation}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-full border font-heading font-medium text-xs transition-all shrink-0",
                sortByDistance
                  ? "bg-white/10 border-white/20 text-[var(--chrome-white)]"
                  : "bg-white/[0.02] border-white/5 text-[var(--muted-lead)] hover:border-white/10"
              )}
            >
              <Navigation size={14} />
              <span className="hidden sm:inline">{sortByDistance ? 'Yakınıma Göre' : 'Yakınımda'}</span>
            </button>

            <div className="flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setActiveGroup('all');
                    setActiveCategory('all');
                  }}
                  className={cn(
                    "px-4 py-2 rounded-full border font-heading font-medium text-xs transition-all whitespace-nowrap",
                    activeGroup === 'all'
                      ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 text-[var(--chrome-white)]"
                      : "bg-white/[0.02] border-white/5 text-[var(--muted-lead)] hover:border-white/10"
                  )}
                >
                  Tümü
                </button>

                {categoryGroups.map((group) => {
                  const Icon = group.icon;
                  return (
                    <button
                      key={group.id}
                      onClick={() => {
                        setActiveGroup(group.id);
                        setActiveCategory('all');
                      }}
                      className={cn(
                        "flex items-center gap-1.5 px-4 py-2 rounded-full border font-heading font-medium text-xs transition-all whitespace-nowrap",
                        activeGroup === group.id
                          ? "bg-white/10 border-white/20 text-[var(--chrome-white)]"
                          : "bg-white/[0.02] border-white/5 text-[var(--muted-lead)] hover:border-white/10"
                      )}
                    >
                      <Icon size={14} />
                      {group.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Sub-categories - Compact Pills */}
          <AnimatePresence mode="wait">
            {activeGroup !== 'all' && groupCategories.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden mb-4"
              >
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                  {groupCategories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all whitespace-nowrap text-xs",
                          activeCategory === cat.id
                            ? "bg-white/8 border-white/15 text-[var(--chrome-white)]"
                            : "bg-white/[0.01] border-white/[0.03] text-[var(--ash)] hover:border-white/8 hover:text-[var(--muted-lead)]"
                        )}
                      >
                        <Icon size={12} />
                        <span className="font-heading font-medium">{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Results */}
      <section className="max-w-7xl mx-auto px-4">
        {/* Stats */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-heading font-bold text-2xl text-[var(--chrome-white)]">
              {activeCategory !== 'all' 
                ? getCategoryById(activeCategory as CategoryId).name
                : activeGroup !== 'all'
                ? currentGroup?.name
                : 'Tüm Hizmetler'}
            </h2>
            <p className="font-body text-sm text-[var(--muted-lead)] mt-1">
              {filteredSalons.length} işletme bulundu
            </p>
          </div>
        </div>

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
