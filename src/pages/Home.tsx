import { useState, useMemo, useEffect } from 'react';
import { SalonCard } from '@/components/salon/SalonCard';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { Search, Navigation } from 'lucide-react';
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

  const currentGroup = activeGroup !== 'all' ? categoryGroups.find(g => g.id === activeGroup) : null;
  const groupCategories = currentGroup 
    ? getAllCategories().filter(cat => cat.groupId === activeGroup)
    : [];

  return (
    <div className="pb-8">
      {/* Hero Section */}
      <section className="py-6 md:py-8 relative">
        <div
          className="absolute inset-x-0 top-0 h-[30vh] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 20%, rgba(255,255,255,0.03) 0%, transparent 50%)',
          }}
        />

        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-6"
          >
            <h1 className="font-display font-black text-2xl md:text-4xl text-[var(--chrome-white)] leading-tight mb-2">
              Her Anınız İçin{' '}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Mükemmel Hizmet
              </span>
            </h1>
            <p className="font-body text-sm text-[var(--muted-lead)] max-w-xl mx-auto">
              Güzellikten organizasyona, tüm ihtiyaçlarınız için profesyonel hizmet
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="max-w-2xl mx-auto mb-5"
          >
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-lead)]" />
              <input
                type="text"
                placeholder="Hizmet, işletme veya konum ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 rounded-xl bg-white/[0.04] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] placeholder:text-[var(--ash)] font-body text-sm outline-none transition-all focus:border-[var(--liquid-chrome)] focus:bg-white/[0.06]"
              />
            </div>
          </motion.div>

          {/* Modern Horizontal Category Scroll */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="relative"
          >
            {/* Location Button */}
            <div className="flex items-center gap-3 mb-3">
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
              
              <p className="text-xs text-[var(--ash)] font-body">
                {filteredSalons.length} işletme
              </p>
            </div>

            {/* Category Pills - Horizontal Scroll */}
            <div className="relative">
              <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
                <div className="flex gap-2 pb-2">
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

              {/* Fade edges */}
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[var(--void)] to-transparent pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[var(--void)] to-transparent pointer-events-none" />
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
                  <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
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
