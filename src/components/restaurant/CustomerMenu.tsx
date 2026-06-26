import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { restaurantService } from '@/services/restaurantService';
import { useRestaurantStore } from '@/store/restaurantStore';
import { ShoppingCart, Phone, Receipt, Minus, Plus, X, MapPin, Check, Clock, ChefHat, Sparkles, Bell, DollarSign, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { MenuItem, MenuCategory, Table } from '@/types/restaurant';
import { ProductCustomizationDialog } from './ProductCustomizationDialog';
import { CartSheet } from './CartSheet';
import { NotificationButtons } from './NotificationButtons';

interface CustomerMenuProps {
  restaurantId: string;
  tableQR: string;
}

export function CustomerMenu({ restaurantId, tableQR }: CustomerMenuProps) {
  const [loading, setLoading] = useState(true);
  const [table, setTable] = useState<Table | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [isWithinRange, setIsWithinRange] = useState(true);
  const [canOrder, setCanOrder] = useState(true); // Default true - herkes sipariş verebilir
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const { cart, setCurrentTable } = useRestaurantStore();

  useEffect(() => {
    setMounted(true);
    loadData();
    
    // Scroll listener for scroll to top button
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [restaurantId, tableQR]);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function loadData() {
    try {
      setLoading(true);
      
      const tableData = await restaurantService.getTableByQR(tableQR);
      if (!tableData) {
        toast.error('Masa bulunamadı');
        return;
      }
      
      // CRITICAL: Table'dan gelen restaurantId'yi kullan, URL'dekini değil!
      const actualRestaurantId = tableData.restaurantId;
      
      console.log('🪑 TABLE YÜKLENDİ:', {
        tableId: tableData.id,
        tableNumber: tableData.tableNumber,
        tableRestaurantId: actualRestaurantId,
        urlRestaurantId: restaurantId,
        MATCH: actualRestaurantId === restaurantId ? '✅ AYNI' : '❌ FARKLI - TABLE ID KULLANILACAK!'
      });
      
      // Eğer ID'ler farklıysa kullanıcıya bilgi ver
      if (actualRestaurantId !== restaurantId) {
        toast.warning('Restoran ID uyuşmazlığı tespit edildi', {
          description: `URL: ${restaurantId.slice(0, 8)}...\nMasa: ${actualRestaurantId.slice(0, 8)}...\n\nMasa ID'si kullanılacak.`,
          duration: 5000
        });
      }
      
      setTable(tableData);
      setCurrentTable(tableData);
      
      const settings = await restaurantService.getSettings(actualRestaurantId);
      
      // Location kontrolü - Geçici olarak devre dışı, herkes sipariş verebilir
      setCanOrder(true);
      setIsWithinRange(true);
      
      /* Eski location kontrolü - ihtiyaç olursa aç
      if (settings?.location && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const distance = calculateDistance(
              position.coords.latitude,
              position.coords.longitude,
              settings.location!.lat,
              settings.location!.lng
            );
            
            const withinRange = distance <= 0.05;
            setIsWithinRange(withinRange);
            setCanOrder(withinRange);
            
            if (!withinRange && !settings.deliveryEnabled) {
              toast.error('Sipariş verebilmek için restoran içinde olmalısınız');
            }
          },
          () => {
            setCanOrder(true);
          }
        );
      } else {
        setCanOrder(true);
      }
      */
      
      // Kategorileri ve menü ürünlerini yükle
      const [cats, items] = await Promise.all([
        restaurantService.getCategories(actualRestaurantId),
        restaurantService.getMenuItems(actualRestaurantId),
      ]);
      
      setCategories(cats.filter(c => c.isActive));
      setMenuItems(items.filter(i => i.isActive && i.isAvailable));
    } catch (error) {
      console.error('Menü yükleme hatası:', error);
      toast.error('Menü yüklenemedi');
    } finally {
      setLoading(false);
    }
  }

  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  const filteredItems = (selectedCategory === 'all'
    ? menuItems
    : menuItems.filter(item => item.categoryId === selectedCategory))
    .filter(item => item.isAvailable && item.isActive); // Only show available and active items

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);


  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-orange-500 dark:border-orange-400 border-t-transparent rounded-full mb-4"
        />
        <p className="text-gray-600 dark:text-gray-400 font-medium">Menü yükleniyor...</p>
      </div>
    );
  }

  if (!table) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a] p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl p-8 text-center max-w-md bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 shadow-2xl"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/10 dark:to-red-500/10 flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-10 h-10 text-orange-500 dark:text-orange-400" strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-2">
              Masa Bulunamadı
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Lütfen masanızdaki QR kodu okutun.
            </p>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
        {/* Modern Header */}
        <div className="sticky top-0 z-40 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-2xl font-heading font-bold bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent"
                >
                  Menü
                </motion.h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="px-2.5 py-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full">
                    <p className="text-xs font-bold text-white">Masa {table.tableNumber}</p>
                  </div>
                  {table.area && (
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {table.area}
                    </span>
                  )}
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCartOpen(true)}
                className="relative px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-2xl shadow-lg shadow-orange-500/20 font-heading font-bold transition-all"
              >
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" strokeWidth={2.5} />
                  <span className="hidden sm:inline">Sepet</span>
                </div>
                {cartItemCount > 0 && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-white text-orange-600 rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                    {cartItemCount}
                  </div>
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Sepet Özeti - Eğer sepette ürün varsa */}
        {cartItemCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky top-[89px] z-30 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-500/10 dark:to-red-500/10 border-b border-orange-200 dark:border-orange-500/20"
          >
            <div className="max-w-7xl mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {cartItemCount} Ürün
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Toplam: {cartTotal.toFixed(2)} ₺
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCartOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-bold text-sm transition-all"
                >
                  Sepeti Gör
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}


        {/* Kategoriler - Modern Pills */}
        <div className="sticky top-[89px] z-30 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10" style={{ top: cartItemCount > 0 ? '145px' : '89px' }}>
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory('all')}
                className={cn(
                  'px-5 py-2.5 rounded-full font-heading font-bold text-sm whitespace-nowrap transition-all',
                  selectedCategory === 'all'
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                )}
              >
                Tümü ({menuItems.length})
              </motion.button>
              {categories.map((cat) => {
                const count = menuItems.filter(i => i.categoryId === cat.id).length;
                return (
                  <motion.button
                    key={cat.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      'px-5 py-2.5 rounded-full font-heading font-bold text-sm whitespace-nowrap transition-all',
                      selectedCategory === cat.id
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30'
                        : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                    )}
                  >
                    {cat.name} ({count})
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Ürünler - 2 Sütun Mobile Layout */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.03 }}
                  layout
                  className="group relative"
                >
                  {/* Hover Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 dark:from-orange-500/30 dark:to-red-500/30 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Card */}
                  <div
                    onClick={() => setSelectedItem(item)}
                    className={cn(
                      'relative rounded-3xl overflow-hidden transition-all duration-300 cursor-pointer',
                      'bg-white dark:bg-white/[0.03]',
                      'border border-gray-200/80 dark:border-white/10',
                      'hover:border-gray-300 dark:hover:border-white/20',
                      'shadow-lg shadow-black/5 dark:shadow-none',
                      'group-hover:scale-[1.02]',
                      'active:scale-[0.98]'
                    )}
                  >
                    {/* Image */}
                    {item.image ? (
                      <div className="relative aspect-square overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                        
                        {/* Preparation Time Badge */}
                        <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-sm flex items-center gap-1.5 shadow-lg">
                          <Clock className="w-3 h-3 text-orange-600 dark:text-orange-400" strokeWidth={2.5} />
                          <span className="text-xs font-bold text-gray-900 dark:text-white">
                            {item.preparationTime}dk
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-square bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/10 dark:to-red-500/10 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(251,146,60,0.1),transparent_50%)]" />
                        <ChefHat className="w-12 h-12 text-orange-400 dark:text-orange-500 relative z-10" strokeWidth={2} />
                        
                        {/* Preparation Time Badge */}
                        <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-sm flex items-center gap-1.5 shadow-lg">
                          <Clock className="w-3 h-3 text-orange-600 dark:text-orange-400" strokeWidth={2.5} />
                          <span className="text-xs font-bold text-gray-900 dark:text-white">
                            {item.preparationTime}dk
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-3 sm:p-4">
                      {/* Name */}
                      <h3 className="font-heading font-bold text-sm sm:text-base text-gray-900 dark:text-white mb-1 line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem]">
                        {item.name}
                      </h3>

                      {/* Description - Hidden on very small screens */}
                      {item.description && (
                        <p className="hidden sm:block text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2 min-h-[2rem]">
                          {item.description}
                        </p>
                      )}

                      {/* Features */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.ingredients.length > 0 && (
                          <div className="px-2 py-0.5 bg-green-100 dark:bg-green-500/10 rounded-full flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-green-600 dark:text-green-400" strokeWidth={2.5} />
                            <span className="text-xs font-bold text-green-700 dark:text-green-400">
                              {item.ingredients.length}
                            </span>
                          </div>
                        )}
                        {item.availableExtras.length > 0 && (
                          <div className="px-2 py-0.5 bg-purple-100 dark:bg-purple-500/10 rounded-full flex items-center gap-1">
                            <Plus className="w-3 h-3 text-purple-600 dark:text-purple-400" strokeWidth={2.5} />
                            <span className="text-xs font-bold text-purple-700 dark:text-purple-400">
                              Ekstra
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl sm:text-2xl font-heading font-bold bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent">
                            {item.price.toFixed(2)}
                          </span>
                          <span className="text-sm font-bold text-gray-600 dark:text-gray-400">₺</span>
                        </div>
                        
                        {/* Add to Cart Button */}
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/30"
                        >
                          <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={3} />
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Empty State */}
          {filteredItems.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 px-6 rounded-3xl bg-white dark:bg-white/[0.03] border-2 border-dashed border-gray-300 dark:border-white/10"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-white/5 dark:to-white/10 flex items-center justify-center mx-auto mb-4">
                <ChefHat className="w-10 h-10 text-gray-400 dark:text-gray-500" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-heading font-bold text-gray-900 dark:text-white mb-2">
                Bu kategoride ürün yok
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Başka bir kategori seçin
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Scroll to Top Button - Portal to body */}
      {mounted && showScrollTop && createPortal(
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          onClick={scrollToTop}
          className="fixed left-4 sm:left-6 z-30"
          style={{
            bottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))'
          }}
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-2xl shadow-orange-500/40 flex items-center justify-center transition-all hover:scale-110 border-2 border-white/20">
            <ChevronUp className="w-7 h-7 text-white drop-shadow-lg" strokeWidth={3} />
          </div>
        </motion.button>,
        document.body
      )}

      {/* Bildirim Butonları - HER ZAMAN GÖSTER */}
      <NotificationButtons 
        restaurantId={table?.restaurantId || restaurantId} 
        tableId={table?.id || 'loading'}
        tableName={table?.tableNumber || 'Loading'}
      />

      {/* Ürün Özelleştirme Dialog */}
      {selectedItem && (
        <ProductCustomizationDialog
          item={selectedItem}
          open={!!selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {/* Sepet Sheet - CRITICAL: Table'dan gelen restaurantId kullan */}
      <CartSheet
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        restaurantId={table?.restaurantId || restaurantId}
        table={table}
      />
    </>
  );
}
