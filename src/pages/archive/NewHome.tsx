import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { salonsService } from '@/services/firebaseService';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { categoryGroups, getCategoryById } from '@/config/categories';

// Kategori GIF'leri
const categoryGifs: Record<string, string> = {
  'beauty': '/categories/beauty.gif',
  'health': '/categories/beauty.gif',
  'food': '/categories/food.gif',
  'accommodation': '/categories/accommodation.gif',
  'events': '/categories/events.gif',
  'venues': '/categories/events.gif',
  'media': '/categories/media.gif',
  'catering': '/categories/catering.gif',
  'restaurant': '/categories/food.gif'
};

export function NewHome() {
  const [salons, setSalons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const { user } = useAuthStore();
  const { actualTheme } = useThemeStore();

  useEffect(() => {
    loadSalons();
  }, []);

  const loadSalons = async () => {
    try {
      const data = await salonsService.getAll();
      const activeSalons = data.filter((s: any) => s.isActive);
      console.log('Total salons:', data.length);
      console.log('Active salons:', activeSalons.length);
      console.log('Salon categories:', activeSalons.map(s => ({ name: s.name, category: s.category })));
      setSalons(activeSalons);
    } catch (error) {
      console.error('Error loading salons:', error);
    }
    setLoading(false);
  };

  const getGroupStats = (groupId: string) => {
    const group = categoryGroups.find(g => g.id === groupId);
    if (!group) return 0;
    
    const groupSalons = salons.filter(salon => {
      if (!salon.category) return false;
      
      try {
        const category = getCategoryById(salon.category);
        if (!category) return false;
        
        // Kategori bu gruba ait mi kontrol et
        return category.groupId === groupId || group.categories.includes(salon.category);
      } catch (error) {
        return false;
      }
    });
    
    console.log(`Group ${groupId}: ${groupSalons.length} salons`, groupSalons.map(s => s.name));
    return groupSalons.length;
  };

  // Anlık Arama
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      const results = salons.filter(salon => {
        // Salon adı
        const salonMatch = salon.name?.toLowerCase().includes(query);
        
        // Hizmetler
        const servicesMatch = salon.services?.some((service: any) => 
          service.name?.toLowerCase().includes(query) ||
          service.description?.toLowerCase().includes(query)
        );
        
        // Personeller
        const staffMatch = salon.staff?.some((member: any) => 
          member.name?.toLowerCase().includes(query) ||
          member.title?.toLowerCase().includes(query)
        );
        
        // Kategori
        const category = getCategoryById(salon.category);
        const categoryMatch = category?.name?.toLowerCase().includes(query);
        
        return salonMatch || servicesMatch || staffMatch || categoryMatch;
      });
      
      setSearchResults(results);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [searchQuery, salons]);

  const handleSearchSelect = (salonId: string) => {
    window.location.href = `/salon/${salonId}`;
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      window.location.href = `/all?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const isDark = actualTheme === 'dark';
  const firstName = user?.displayName?.split(' ')[0] || 'Kullanıcı';

  return (
    <div 
      className="h-screen w-full overflow-hidden relative transition-colors duration-500"
      style={{
        background: isDark 
          ? 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 50%, #0f1419 100%)'
          : 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 50%, #f8f9fa 100%)'
      }}
    >
      {/* Animated Bokeh Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            x: [0, 20, 0],
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 right-10 w-64 h-64 rounded-full blur-3xl"
          style={{
            background: isDark 
              ? 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)'
          }}
        />
        <motion.div
          animate={{ 
            x: [0, -20, 0],
            y: [0, 20, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-10 left-10 w-72 h-72 rounded-full blur-3xl"
          style={{
            background: isDark 
              ? 'radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(59, 130, 246, 0.06) 0%, transparent 70%)'
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 h-full flex flex-col max-w-7xl mx-auto">
        {/* Minimal Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-5 pt-3 pb-3 flex-shrink-0 flex items-center justify-end"
        >
          <Link to="/profile">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 rounded-full backdrop-blur-xl flex items-center justify-center"
              style={{
                background: isDark 
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.04)',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`
              }}
            >
              <span 
                className="text-xs font-medium"
                style={{ color: isDark ? '#ffffff' : '#1a1f2e' }}
              >
                {user?.displayName?.[0]?.toUpperCase() || '👤'}
              </span>
            </motion.div>
          </Link>
        </motion.header>

        {/* Glassmorphism Search with Live Results */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="px-5 pb-5 flex-shrink-0 relative"
        >
          <div 
            className="flex items-center gap-3 px-4 py-3 rounded-2xl backdrop-blur-2xl transition-all duration-300"
            style={{
              background: isDark 
                ? 'rgba(255, 255, 255, 0.06)'
                : 'rgba(255, 255, 255, 0.8)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
              boxShadow: isDark 
                ? '0 4px 24px rgba(0, 0, 0, 0.3)'
                : '0 4px 24px rgba(0, 0, 0, 0.06)'
            }}
          >
            <Search 
              size={18} 
              strokeWidth={2}
              style={{ color: isDark ? '#8b95a6' : '#9ca3af' }}
            />
            <input
              type="text"
              placeholder="Ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 bg-transparent border-none outline-none text-sm"
              style={{ 
                color: isDark ? '#ffffff' : '#1a1f2e',
                fontWeight: 500
              }}
            />
          </div>

          {/* Live Search Results */}
          {showResults && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute left-5 right-5 mt-2 rounded-2xl backdrop-blur-2xl overflow-hidden z-50"
              style={{
                background: isDark 
                  ? 'rgba(26, 26, 26, 0.95)'
                  : 'rgba(255, 255, 255, 0.95)',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
                boxShadow: isDark 
                  ? '0 8px 32px rgba(0, 0, 0, 0.5)'
                  : '0 8px 32px rgba(0, 0, 0, 0.12)',
                maxHeight: '300px',
                overflowY: 'auto'
              }}
            >
              {searchResults.slice(0, 5).map((salon, index) => (
                <motion.button
                  key={salon.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleSearchSelect(salon.id)}
                  className="w-full px-4 py-3 flex items-center gap-3 transition-colors duration-200"
                  style={{
                    borderBottom: index < searchResults.slice(0, 5).length - 1 
                      ? `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)'}`
                      : 'none',
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDark 
                      ? 'rgba(255, 255, 255, 0.04)' 
                      : 'rgba(0, 0, 0, 0.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {salon.logoUrl ? (
                    <img 
                      src={salon.logoUrl} 
                      alt={salon.name}
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                  ) : (
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: isDark 
                          ? 'rgba(255, 255, 255, 0.06)'
                          : 'rgba(0, 0, 0, 0.04)'
                      }}
                    >
                      <span className="text-xs">
                        {salon.name?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <p 
                      className="text-sm font-medium"
                      style={{ color: isDark ? '#ffffff' : '#1a1f2e' }}
                    >
                      {salon.name}
                    </p>
                    <p 
                      className="text-xs"
                      style={{ color: isDark ? '#8b95a6' : '#6b7280' }}
                    >
                      {getCategoryById(salon.category)?.name || 'Kategori'}
                    </p>
                  </div>
                </motion.button>
              ))}
              
              {searchResults.length > 5 && (
                <button
                  onClick={handleSearch}
                  className="w-full px-4 py-3 text-center text-xs font-medium transition-colors duration-200"
                  style={{
                    color: isDark ? '#8b95a6' : '#6b7280',
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDark 
                      ? 'rgba(255, 255, 255, 0.04)' 
                      : 'rgba(0, 0, 0, 0.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Tüm sonuçları gör ({searchResults.length})
                </button>
              )}
            </motion.div>
          )}

          {showResults && searchResults.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute left-5 right-5 mt-2 rounded-2xl backdrop-blur-2xl p-4 text-center"
              style={{
                background: isDark 
                  ? 'rgba(26, 26, 26, 0.95)'
                  : 'rgba(255, 255, 255, 0.95)',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
                boxShadow: isDark 
                  ? '0 8px 32px rgba(0, 0, 0, 0.5)'
                  : '0 8px 32px rgba(0, 0, 0, 0.12)'
              }}
            >
              <p 
                className="text-sm"
                style={{ color: isDark ? '#8b95a6' : '#6b7280' }}
              >
                Sonuç bulunamadı
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Premium Categories Grid - Scrollable & Responsive */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="aspect-square rounded-3xl animate-pulse backdrop-blur-xl"
                  style={{
                    background: isDark 
                      ? 'rgba(255, 255, 255, 0.04)'
                      : 'rgba(0, 0, 0, 0.02)',
                    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'}`
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {categoryGroups.filter(group => {
                // Sadece işletmesi olan kategorileri göster
                const count = getGroupStats(group.id);
                console.log(`Filter check - Group: ${group.id}, Count: ${count}`);
                return count > 0;
              }).map((group, index) => {
                const totalCount = getGroupStats(group.id);
                const gifUrl = categoryGifs[group.id];

                return (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ 
                      delay: 0.1 + index * 0.05,
                      type: "spring",
                      stiffness: 300,
                      damping: 25
                    }}
                  >
                    <Link to={`/all?group=${group.id}`}>
                      <motion.div
                        whileHover={{ scale: 0.98, y: -2 }}
                        whileTap={{ scale: 0.96 }}
                        className="group relative aspect-square rounded-3xl overflow-hidden backdrop-blur-2xl transition-all duration-300"
                        style={{
                          background: isDark 
                            ? 'rgba(255, 255, 255, 0.04)'
                            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(249, 250, 251, 0.95))',
                          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
                          boxShadow: isDark 
                            ? '0 8px 32px rgba(0, 0, 0, 0.4)'
                            : '0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)'
                        }}
                      >
                        {/* Background GIF - Maksimum görünürlük */}
                        <div className="absolute inset-0">
                          <img 
                            src={gifUrl}
                            alt={group.name}
                            className="w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-100"
                            style={{
                              opacity: isDark ? 0.85 : 0.9
                            }}
                          />
                          {/* Minimal Gradient Overlay - Sadece text okunabilirliği için */}
                          <div 
                            className="absolute inset-0 transition-opacity duration-500 group-hover:opacity-50"
                            style={{
                              background: isDark
                                ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.15) 100%)'
                                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(249, 250, 251, 0.1) 100%)'
                            }}
                          />
                        </div>

                        {/* Gradient Glow on Hover */}
                        <div 
                          className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-2xl"
                          style={{
                            background: isDark
                              ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2))'
                              : 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.15))'
                          }}
                        />

                        {/* Content - Better Layout */}
                        <div className="relative h-full flex flex-col">
                          {/* Badge - Sağ Üst */}
                          <div className="absolute top-3 right-3">
                            <div 
                              className="px-2.5 py-1 rounded-full backdrop-blur-xl transition-all duration-300"
                              style={{
                                background: isDark 
                                  ? 'rgba(255, 255, 255, 0.15)'
                                  : 'rgba(0, 0, 0, 0.1)',
                                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'}`,
                                boxShadow: isDark
                                  ? 'none'
                                  : '0 2px 8px rgba(0, 0, 0, 0.08)'
                              }}
                            >
                              <p 
                                className="text-xs font-bold"
                                style={{ 
                                  color: isDark ? '#ffffff' : '#1a1f2e'
                                }}
                              >
                                {totalCount}
                              </p>
                            </div>
                          </div>

                          {/* Title - Alt Kısım */}
                          <div className="absolute bottom-3 left-3 right-3">
                            <h3 
                              className="text-sm font-bold leading-tight transition-all duration-300"
                              style={{ 
                                color: isDark ? '#ffffff' : '#1a1f2e',
                                textShadow: isDark 
                                  ? '0 2px 12px rgba(0, 0, 0, 0.5)'
                                  : '0 2px 8px rgba(255, 255, 255, 0.8), 0 1px 2px rgba(0, 0, 0, 0.2)'
                              }}
                            >
                              {group.name}
                            </h3>
                          </div>
                        </div>

                        {/* Shine Effect */}
                        <div 
                          className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                          style={{
                            background: isDark
                              ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, transparent 50%)'
                              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, transparent 50%)'
                          }}
                        />
                      </motion.div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
