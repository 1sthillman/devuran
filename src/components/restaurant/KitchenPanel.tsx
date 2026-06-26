import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, ChefHat, CheckCircle2, AlertCircle, ChevronUp } from 'lucide-react';
import { restaurantService } from '@/services/restaurantService';
import { soundService } from '@/services/soundService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { Order, OrderStatus } from '@/types/restaurant';

interface KitchenPanelProps {
  restaurantId: string;
}

export function KitchenPanel({ restaurantId }: KitchenPanelProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    loadOrders();
    
    const unsubscribe = restaurantService.subscribeToActiveOrders(restaurantId, (newOrders) => {
      const kitchenOrders = newOrders.filter(o => 
        ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)
      );
      
      if (kitchenOrders.length > orders.length) {
        soundService.playNotification();
      }
      
      setOrders(kitchenOrders);
    });

    // Scroll listener
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    
    window.addEventListener('scroll', handleScroll);

    return () => {
      unsubscribe();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [restaurantId]);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function loadOrders() {
    try {
      setLoading(true);
      const allOrders = await restaurantService.getOrders(restaurantId);
      const kitchenOrders = allOrders.filter(o => 
        ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)
      );
      setOrders(kitchenOrders);
    } catch (error) {
      console.error('Sipariş yükleme hatası:', error);
      toast.error('Siparişler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(orderId: string, status: OrderStatus) {
    try {
      await restaurantService.updateOrderStatus(orderId, status);
      toast.success('Durum güncellendi');
    } catch (error) {
      console.error('Durum güncelleme hatası:', error);
      toast.error('Durum güncellenemedi');
    }
  }

  function getOrderPriority(order: Order): number {
    const createdAt = new Date(order.createdAt).getTime();
    const now = Date.now();
    const minutesAgo = (now - createdAt) / (1000 * 60);
    
    if (minutesAgo > 30) return 3;
    if (minutesAgo > 15) return 2;
    return 1;
  }

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'confirmed' || o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5 sm:space-y-6">
        {/* Modern Stats Cards - Minimal & Clean */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[
            { icon: AlertCircle, label: 'Bekleyen', count: pendingOrders.length },
            { icon: ChefHat, label: 'Hazırlanıyor', count: preparingOrders.length },
            { icon: CheckCircle2, label: 'Hazır', count: readyOrders.length },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={{ scale: 1.02, y: -2 }}
              className="relative"
            >
              <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl p-4 sm:p-5 border transition-all duration-300 bg-white/95 dark:bg-white/[0.03] border-gray-200/80 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 shadow-lg shadow-black/5 dark:shadow-none">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center bg-gray-100 dark:bg-white/5">
                    <stat.icon className="w-6 h-6 sm:w-7 sm:h-7 text-gray-700 dark:text-white" strokeWidth={2.5} />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{stat.count}</div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">{stat.label}</div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Orders - Proper Theme Support */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {orders.length === 0 ? (
          <div className="col-span-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 rounded-3xl bg-white/95 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 backdrop-blur-xl shadow-lg shadow-black/5 dark:shadow-none"
            >
              <ChefHat className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <p className="text-base text-gray-600 dark:text-gray-400">Aktif sipariş bulunmuyor</p>
            </motion.div>
          </div>
        ) : (
          orders.sort((a, b) => getOrderPriority(b) - getOrderPriority(a)).map((order, idx) => {
            const priority = getOrderPriority(order);
            const createdTime = new Date(order.createdAt);
            const minutesAgo = Math.floor((Date.now() - createdTime.getTime()) / (1000 * 60));

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.02, y: -4 }}
                className="relative group"
              >
                <div className={cn(
                  "absolute inset-0 rounded-3xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300",
                  order.status === 'pending' && "bg-red-500/30",
                  order.status === 'confirmed' && "bg-yellow-500/30",
                  order.status === 'preparing' && "bg-blue-500/30",
                  order.status === 'ready' && "bg-green-500/30"
                )} />

                <div className={cn(
                  "relative rounded-3xl border backdrop-blur-xl p-5 transition-all duration-300 shadow-lg shadow-black/5 dark:shadow-none",
                  "bg-white/95 dark:bg-white/[0.03]",
                  order.status === 'pending' && "border-red-300 dark:border-red-500/30 hover:border-red-400 dark:hover:border-red-500/50",
                  order.status === 'confirmed' && "border-yellow-300 dark:border-yellow-500/30 hover:border-yellow-400 dark:hover:border-yellow-500/50",
                  order.status === 'preparing' && "border-blue-300 dark:border-blue-500/30 hover:border-blue-400 dark:hover:border-blue-500/50",
                  order.status === 'ready' && "border-green-300 dark:border-green-500/30 hover:border-green-400 dark:hover:border-green-500/50",
                  priority === 3 && "ring-2 ring-red-500/40"
                )}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">{order.orderNumber}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {order.type === 'dine_in' ? `Masa ${order.tableName}` : 'Paket Servis'}
                      </div>
                    </div>
                    <Badge variant={priority === 3 ? 'destructive' : 'secondary'} className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-semibold bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white border-gray-300 dark:border-white/20">
                      <Clock className="h-3.5 w-3.5" />
                      {minutesAgo} dk
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4 max-h-40 overflow-y-auto custom-scrollbar">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-900 dark:text-white">{item.quantity}x {item.name}</span>
                          {item.preparationTime && (
                            <span className="text-xs px-2 py-0.5 bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 rounded-full font-bold flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {item.preparationTime}dk
                            </span>
                          )}
                        </div>
                        {item.removedIngredients.length > 0 && (
                          <div className="text-xs text-red-600 dark:text-red-400 mt-1">Çıkar: {item.removedIngredients.join(', ')}</div>
                        )}
                        {item.addedExtras.length > 0 && (
                          <div className="text-xs text-green-600 dark:text-green-400 mt-1">Ekstra: {item.addedExtras.map(e => e.name).join(', ')}</div>
                        )}
                        {item.notes && (
                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 italic">Not: {item.notes}</div>
                        )}
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-2xl text-sm">
                      <strong className="text-yellow-700 dark:text-yellow-400">Not:</strong>{' '}
                      <span className="text-gray-700 dark:text-gray-300">{order.notes}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    {order.status === 'pending' && (
                      <Button className="w-full h-11 text-sm font-semibold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-full shadow-lg" onClick={() => updateOrderStatus(order.id, 'confirmed')}>
                        Onayla ve Başla
                      </Button>
                    )}
                    {(order.status === 'confirmed' || order.status === 'preparing') && (
                      <Button className="w-full h-11 text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-full shadow-lg" onClick={() => updateOrderStatus(order.id, 'ready')}>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Hazır İşaretle
                      </Button>
                    )}
                    {order.status === 'ready' && (
                      <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-2xl p-4 text-center">
                        <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-600 dark:text-green-400" />
                        <div className="text-sm font-medium text-green-700 dark:text-green-300">Garson teslim alacak</div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>

    {/* Scroll to Top Button */}
    <AnimatePresence>
      {showScrollTop && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          onClick={scrollToTop}
          className="fixed bottom-24 right-6 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900 border-2 border-gray-700 dark:border-gray-800 hover:from-gray-800 hover:to-gray-700 text-white shadow-xl flex items-center justify-center transition-all hover:scale-110"
        >
          <ChevronUp className="w-6 h-6" strokeWidth={2.5} />
        </motion.button>
      )}
    </AnimatePresence>
  </>
  );
}
