import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Receipt, Clock, CheckCircle2, TrendingUp, ChevronUp } from 'lucide-react';
import { restaurantService } from '@/services/restaurantService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { Order } from '@/types/restaurant';
import { TableGrid } from './TableGrid';
import { PaymentDialog } from './PaymentDialog';

interface CashierPanelProps {
  restaurantId: string;
}

export function CashierPanel({ restaurantId }: CashierPanelProps) {
  const [tables, setTables] = useState<any[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    loadData();

    // Real-time dinleme
    const unsubscribeOrders = restaurantService.subscribeToOrders(restaurantId, setOrders);
    const unsubscribeTables = restaurantService.subscribeToTables(restaurantId, setTables);

    // Scroll listener
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    
    window.addEventListener('scroll', handleScroll);

    return () => {
      unsubscribeOrders();
      unsubscribeTables();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [restaurantId]);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function loadData() {
    try {
      setLoading(true);
      const [ords, tbls] = await Promise.all([
        restaurantService.getOrders(restaurantId),
        restaurantService.getTables(restaurantId),
      ]);
      
      setOrders(ords);
      setTables(tbls);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }

  function handleOrderClick(order: Order) {
    setSelectedOrder(order);
    setIsPaymentDialogOpen(true);
  }

  function handleTableClick(table: any) {
    // Masa için aktif sipariş bul
    const tableOrders = orders.filter(o => 
      o.tableId === table.id && 
      ['delivered', 'ready', 'preparing', 'order_placed'].includes(o.status)
    );
    
    if (tableOrders.length === 0) {
      toast.info('Bu masada ödeme bekleyen sipariş yok');
      return;
    }

    // Eğer birden fazla sipariş varsa, birleştirilmiş bir sipariş oluştur
    if (tableOrders.length > 1) {
      // Tüm siparişleri birleştir
      const combinedOrder: Order = {
        ...tableOrders[0], // İlk siparişin yapısını kullan
        orderNumber: `Masa ${table.tableNumber} (${tableOrders.length} sipariş)`,
        items: tableOrders.flatMap(o => o.items), // Tüm ürünleri birleştir
        total: tableOrders.reduce((sum, o) => sum + o.total, 0), // Toplamları birleştir
      };
      setSelectedOrder(combinedOrder);
    } else {
      // Tek sipariş varsa direkt göster
      setSelectedOrder(tableOrders[0]);
    }

    setIsPaymentDialogOpen(true);
  }

  function handleClosePaymentDialog() {
    setIsPaymentDialogOpen(false);
    setSelectedOrder(null);
  }

  const activeOrders = orders.filter(o => 
    ['delivered', 'ready'].includes(o.status) || 
    (o.tableId && tables.find(t => t.id === o.tableId && t.status === 'bill_requested'))
  );

  // Masalar - sadece ücret varsa görünsün
  const tablesWithOrders = tables.filter(table => {
    const tableOrders = orders.filter(o => 
      o.tableId === table.id && 
      ['delivered', 'ready', 'preparing', 'order_placed'].includes(o.status)
    );
    return tableOrders.length > 0;
  });

  // Hesap isteyen masalar
  const billRequestedTables = tablesWithOrders.filter(t => t.status === 'bill_requested');
  const otherTables = tablesWithOrders.filter(t => t.status !== 'bill_requested');

  const completedToday = orders.filter(o => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return o.status === 'completed' && new Date(o.createdAt) >= today;
  });

  const todayRevenue = completedToday.reduce((sum, o) => sum + o.total, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5 sm:space-y-6">
        {/* Modern Stats - Proper Theme Support */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {[
            { icon: CheckCircle2, label: 'Tamamlanan', count: completedToday.length, gradient: 'from-green-500 to-emerald-500' },
            { icon: TrendingUp, label: 'Bugünkü Ciro', count: `${todayRevenue.toFixed(0)}₺`, gradient: 'from-blue-500 to-cyan-500' },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="relative group"
            >
              <div className="relative backdrop-blur-xl bg-white/95 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 rounded-3xl p-6 transition-all duration-300 shadow-lg shadow-black/5 dark:shadow-none">
                <div className="flex items-center gap-4">
                  <div className={cn("w-14 h-14 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg", stat.gradient)}>
                    <stat.icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{stat.count}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">{stat.label}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Masalar - Sadece dolu olanlar */}
        {tablesWithOrders.length > 0 && (
          <div>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xl font-bold mb-4 text-gray-900 dark:text-white"
            >
              Dolu Masalar
            </motion.h2>
            
            {/* Hesap İsteyen Masalar - En Üstte */}
            {billRequestedTables.length > 0 && (
              <div className="mb-4">
                <div className="text-sm font-bold mb-2 text-red-600 dark:text-red-400 flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  Hesap İsteyen Masalar
                </div>
                <TableGrid 
                  tables={billRequestedTables} 
                  orders={orders} 
                  onTableClick={handleTableClick}
                />
              </div>
            )}
            
            {/* Diğer Dolu Masalar */}
            {otherTables.length > 0 && (
              <TableGrid 
                tables={otherTables} 
                orders={orders} 
                onTableClick={handleTableClick}
              />
            )}
          </div>
        )}

        {/* Ödeme Bekleyen Siparişler - Alt Kısımda */}
        <div>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl font-bold mb-4 text-gray-900 dark:text-white"
          >
            Ödeme Bekleyen Siparişler
          </motion.h2>
          
          {activeOrders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="backdrop-blur-xl bg-white/95 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 rounded-3xl p-16 text-center shadow-lg shadow-black/5 dark:shadow-none"
            >
              <Receipt className="h-20 w-20 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <p className="text-lg text-gray-600 dark:text-gray-400">Ödeme bekleyen sipariş yok</p>
            </motion.div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {activeOrders.map((order, idx) => {
                const table = tables.find(t => t.id === order.tableId);
                const isRequestingBill = table?.status === 'bill_requested';
                
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handleOrderClick(order)}
                    whileHover={{ scale: 1.01, x: 4 }}
                    className={cn('relative cursor-pointer', isRequestingBill && 'animate-pulse')}
                  >
                    {isRequestingBill && (
                      <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-500 rounded-3xl blur-xl opacity-50" />
                    )}
                    
                    <div className={cn(
                      'relative backdrop-blur-xl border-2 rounded-3xl p-5 sm:p-6 transition-all duration-300 shadow-lg shadow-black/5 dark:shadow-none',
                      isRequestingBill
                        ? 'bg-red-50 dark:bg-red-500/10 border-red-300 dark:border-red-500/30 hover:border-red-400 dark:hover:border-red-500/50'
                        : 'bg-white/95 dark:bg-white/[0.03] border-gray-200/80 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                    )}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-lg text-gray-900 dark:text-white">{order.orderNumber}</span>
                            <span className="text-gray-400 dark:text-gray-500">•</span>
                            <span className="text-gray-600 dark:text-gray-400">Masa {order.tableName}</span>
                            {isRequestingBill && (
                              <Badge variant="destructive" className="rounded-full animate-pulse ml-2">
                                Hesap İstiyor
                              </Badge>
                            )}
                          </div>
                          
                          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <div>{order.items.length} ürün</div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(order.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{order.total?.toFixed(2) ?? '0.00'} ₺</div>
                          <Badge variant="secondary" className="rounded-full bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white border-gray-300 dark:border-white/20">
                            {order.status === 'delivered' ? 'Teslim Edildi' : 'Hazır'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Payment Dialog */}
      <PaymentDialog
        order={selectedOrder}
        isOpen={isPaymentDialogOpen}
        onClose={handleClosePaymentDialog}
      />

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
