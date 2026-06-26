import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Clock, ChefHat, Sparkles, Plus } from 'lucide-react';
import { restaurantService } from '@/services/restaurantService';
import { useRestaurantStore } from '@/store/restaurantStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { MenuItem, MenuCategory, Table } from '@/types/restaurant';
import { ProductCustomizationDialog } from './ProductCustomizationDialog';

interface WaiterOrderScreenProps {
  open: boolean;
  onClose: () => void;
  restaurantId: string;
  table: Table;
}

export function WaiterOrderScreen({ open, onClose, restaurantId, table }: WaiterOrderScreenProps) {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [placing, setPlacing] = useState(false);
  
  const { cart, clearCart, setCurrentTable } = useRestaurantStore();

  useEffect(() => {
    if (open) {
      loadMenu();
      setCurrentTable(table);
    }
  }, [open, restaurantId, table]);

  async function loadMenu() {
    try {
      setLoading(true);
      const [cats, items] = await Promise.all([
        restaurantService.getCategories(restaurantId),
        restaurantService.getMenuItems(restaurantId),
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

  async function handlePlaceOrder() {
    if (cart.length === 0) {
      toast.error('Sepet boş');
      return;
    }

    try {
      setPlacing(true);
      
      const orderItems = cart.map(item => ({
        id: `${item.menuItemId}-${Date.now()}-${Math.random()}`,
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        removedIngredients: item.removedIngredients,
        addedExtras: item.addedExtras,
        notes: item.notes || '',
        totalPrice: item.totalPrice,
        preparationTime: item.preparationTime
      }));

      // KDV fiyata dahil - tersine hesaplama
      const total = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const taxRate = 0.1;
      const subtotal = total / (1 + taxRate); // KDV'siz tutar
      const tax = total - subtotal; // KDV tutarı

      await restaurantService.createOrder(restaurantId, {
        tableId: table.id,
        tableName: table.tableNumber,
        type: 'dine_in',
        items: orderItems,
        status: 'pending',
        subtotal,
        tax,
        total,
        notes: '',
      });

      // Update table status to order_placed
      await restaurantService.updateTable(table.id, { status: 'order_placed' });

      toast.success('Sipariş oluşturuldu');
      clearCart();
      onClose();
    } catch (error) {
      console.error('Sipariş oluşturma hatası:', error);
      toast.error('Sipariş oluşturulamadı');
    } finally {
      setPlacing(false);
    }
  }

  const filteredItems = selectedCategory === 'all'
    ? menuItems
    : menuItems.filter(item => item.categoryId === selectedCategory);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10004]"
            onClick={onClose}
            style={{ position: 'fixed' }}
          />
        )}
      </AnimatePresence>

      {/* Full Screen Order Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="fixed inset-0 z-[10005] bg-gray-50 dark:bg-[#0a0a0a]"
            style={{ position: 'fixed' }}
          >
            {/* Header */}
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10">
              <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <motion.h1
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-2xl font-heading font-bold bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent"
                    >
                      Sipariş Ver
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
                  
                  <div className="flex items-center gap-3">
                    {cartItemCount > 0 && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handlePlaceOrder}
                        disabled={placing}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-2xl shadow-lg font-heading font-bold transition-all flex items-center gap-2"
                      >
                        <ShoppingCart className="w-5 h-5" />
                        <span>Sipariş Ver ({cartItemCount})</span>
                      </motion.button>
                    )}
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={onClose}
                      className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
                    >
                      <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="sticky top-[89px] z-30 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10">
              <div className="max-w-7xl mx-auto px-4 py-3">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory('all')}
                    className={cn(
                      'px-5 py-2.5 rounded-full font-heading font-bold text-sm whitespace-nowrap transition-all',
                      selectedCategory === 'all'
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
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
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={cn(
                          'px-5 py-2.5 rounded-full font-heading font-bold text-sm whitespace-nowrap transition-all',
                          selectedCategory === cat.id
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
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

            {/* Products Grid */}
            <div className="max-w-7xl mx-auto px-4 py-6 pb-32">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {filteredItems.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      className="group relative"
                    >
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
                            
                            <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-sm flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                              <span className="text-xs font-bold text-gray-900 dark:text-white">{item.preparationTime}dk</span>
                            </div>
                          </div>
                        ) : (
                          <div className="aspect-square bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/10 dark:to-red-500/10 flex items-center justify-center relative overflow-hidden">
                            <ChefHat className="w-12 h-12 text-orange-400 dark:text-orange-500 relative z-10" />
                            
                            <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-sm flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                              <span className="text-xs font-bold text-gray-900 dark:text-white">{item.preparationTime}dk</span>
                            </div>
                          </div>
                        )}

                        {/* Content */}
                        <div className="p-3 sm:p-4">
                          <h3 className="font-heading font-bold text-sm sm:text-base text-gray-900 dark:text-white mb-1 line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem]">
                            {item.name}
                          </h3>

                          {item.description && (
                            <p className="hidden sm:block text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2 min-h-[2rem]">
                              {item.description}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-1 mb-3">
                            {item.ingredients.length > 0 && (
                              <div className="px-2 py-0.5 bg-green-100 dark:bg-green-500/10 rounded-full flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-green-600 dark:text-green-400" />
                                <span className="text-xs font-bold text-green-700 dark:text-green-400">{item.ingredients.length}</span>
                              </div>
                            )}
                            {item.availableExtras.length > 0 && (
                              <div className="px-2 py-0.5 bg-purple-100 dark:bg-purple-500/10 rounded-full flex items-center gap-1">
                                <Plus className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                                <span className="text-xs font-bold text-purple-700 dark:text-purple-400">Ekstra</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-baseline gap-1">
                              <span className="text-xl sm:text-2xl font-heading font-bold bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent">
                                {item.price.toFixed(2)}
                              </span>
                              <span className="text-sm font-bold text-gray-600 dark:text-gray-400">₺</span>
                            </div>
                            
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center shadow-lg"
                            >
                              <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={3} />
                            </motion.div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Customization Dialog */}
      {selectedItem && (
        <ProductCustomizationDialog
          item={selectedItem}
          open={!!selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </>
  );
}
