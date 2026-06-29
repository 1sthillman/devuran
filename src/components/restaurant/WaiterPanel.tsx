import { useEffect, useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle2, Phone, Flame, Receipt, Clock, Filter, ChevronUp, Check, X } from 'lucide-react';
import { restaurantService } from '@/services/restaurantService';
import { soundService } from '@/services/soundService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { Order, RestaurantNotification, Table } from '@/types/restaurant';
import { TableGrid } from './TableGrid';
import { TableActionMenu } from './TableActionMenu';
import { TableTransferDialog } from './TableTransferDialog';
import { WaiterOrderScreen } from './WaiterOrderScreen';
import { NotificationToast } from './NotificationToast';

interface WaiterPanelProps {
  restaurantId: string;
}

export function WaiterPanel({ restaurantId }: WaiterPanelProps) {
  const [notifications, setNotifications] = useState<RestaurantNotification[]>([]);
  const [readyOrders, setReadyOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Table action menu state
  const [actionMenuTable, setActionMenuTable] = useState<Table | null>(null);
  const [transferTable, setTransferTable] = useState<Table | null>(null);
  const [orderScreenTable, setOrderScreenTable] = useState<Table | null>(null);

  // Hold to confirm state
  const [holdingOrderId, setHoldingOrderId] = useState<string | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);

  useEffect(() => {
    console.log('🎯 WAITER PANEL BAŞLATILDI');
    console.log('📍 Dinlenen Restaurant ID:', restaurantId);
    console.log('🔔 Bu ID ile gelen bildirimler gösterilecek!');
    console.log('📝 NOT: Müşteri menüsündeki table.restaurantId bu ID ile aynı olmalı!');
    
    loadData();
    
    const unsubscribeNotifications = restaurantService.subscribeToNotifications(
      restaurantId,
      (newNotifications) => {
        if (newNotifications.length > notifications.length) {
          soundService.playNotification();
        }
        setNotifications(newNotifications);
      }
    );

    const unsubscribeOrders = restaurantService.subscribeToOrders(
      restaurantId,
      (newOrders) => {
        const ready = newOrders.filter(o => o.status === 'ready');
        if (ready.length > readyOrders.length) {
          soundService.playNotification();
        }
        setReadyOrders(ready);
        setOrders(newOrders);
      }
    );

    const unsubscribeTables = restaurantService.subscribeToTables(
      restaurantId,
      setTables
    );

    // Scroll listener for scroll to top button
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    
    window.addEventListener('scroll', handleScroll);

    return () => {
      unsubscribeNotifications();
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
      const [notifs, ords, tbls] = await Promise.all([
        restaurantService.getUnreadNotifications(restaurantId),
        restaurantService.getOrders(restaurantId),
        restaurantService.getTables(restaurantId),
      ]);
      
      setNotifications(notifs);
      setReadyOrders(ords.filter(o => o.status === 'ready'));
      setOrders(ords);
      setTables(tbls);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }

  // İşleme Al = Direkt Sil (Tek Buton Çözümü)
  async function handleRespond(notificationId: string, tableId?: string) {
    try {
      setResponding(notificationId);
      
      // Bildirimi Firebase'den SİL
      await restaurantService.deleteNotification(notificationId);
      
      // Local state'ten hemen kaldır
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Masa durumunu güncelle
      if (tableId) {
        await restaurantService.updateTable(tableId, { status: 'occupied' });
      }
      
      toast.success('✅ İşlem Tamamlandı', {
        description: 'Bildirim kapatıldı',
        duration: 2000
      });
    } catch (error) {
      console.error('İşleme alma hatası:', error);
      toast.error('İşlem başarısız');
    } finally {
      setResponding(null);
    }
  }

  // X butonu ile hızlı silme
  async function handleDismiss(notificationId: string, tableId?: string) {
    try {
      await restaurantService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (tableId) {
        await restaurantService.updateTable(tableId, { status: 'occupied' });
      }
      
      toast.success('Bildirim kapatıldı', { duration: 1500 });
    } catch (error) {
      console.error('Silme hatası:', error);
      toast.error('Silme başarısız');
    }
  }

  async function handlePickup(orderId: string) {
    try {
      await restaurantService.updateOrderStatus(orderId, 'picked_up');
      toast.success('Sipariş teslim alındı');
    } catch (error) {
      console.error('Teslim alma hatası:', error);
      toast.error('İşlem başarısız');
    }
  }

  async function handleDeliver(orderId: string) {
    try {
      await restaurantService.updateOrderStatus(orderId, 'delivered');
      toast.success('Sipariş teslim edildi');
    } catch (error) {
      console.error('Teslim etme hatası:', error);
      toast.error('İşlem başarısız');
    }
  }

  function handleTableLongPress(table: Table) {
    const hasOrders = orders.some(o => o.tableId === table.id && o.status !== 'completed' && o.status !== 'cancelled');
    setActionMenuTable(table);
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case 'waiter_call':
        return <Phone className="h-5 w-5" />;
      case 'coal_request':
        return <Flame className="h-5 w-5" />;
      case 'bill_request':
        return <Receipt className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  }

  function getNotificationGradient(type: string) {
    switch (type) {
      case 'waiter_call':
        return 'from-blue-500 to-cyan-500';
      case 'coal_request':
        return 'from-orange-500 to-red-500';
      case 'bill_request':
        return 'from-green-500 to-emerald-500';
      default:
        return 'from-gray-500 to-slate-500';
    }
  }

  // Get unique areas from tables
  const areas = ['all', ...new Set(tables.filter(t => t.area).map(t => t.area!))];
  
  // Filter tables by area
  const filteredTables = selectedArea === 'all' 
    ? tables 
    : tables.filter(t => t.area === selectedArea);
  
  // Separate coal requests from other notifications
  const coalRequests = notifications.filter(n => n.type === 'coal_request');
  const otherNotifications = notifications.filter(n => n.type !== 'coal_request');
  
  // Separate unread and read (processing) notifications
  const unreadCoalRequests = coalRequests.filter(n => !n.isRead);
  const processingCoalRequests = coalRequests.filter(n => n.isRead);
  
  const unreadOtherNotifications = otherNotifications.filter(n => !n.isRead);
  const processingOtherNotifications = otherNotifications.filter(n => n.isRead);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5 sm:space-y-6 relative">
        {/* Modern Stats - Minimal & Clean */}
        <div className="grid grid-cols-4 gap-3 sm:gap-4">
          {[
            { icon: Flame, label: 'Köz', count: unreadCoalRequests.length, gradient: 'from-orange-500 to-red-500' },
            { icon: Bell, label: 'Acil', count: unreadOtherNotifications.length, gradient: 'from-red-500 to-pink-500' },
            { icon: CheckCircle2, label: 'Hazır', count: readyOrders.length, gradient: 'from-green-500 to-emerald-500' },
            { icon: Receipt, label: 'Aktif', count: tables.filter(t => t.status !== 'empty').length, gradient: 'from-blue-500 to-cyan-500' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={{ scale: 1.02, y: -2 }}
              className="relative"
            >
              <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl p-4 sm:p-5 border transition-all duration-300 bg-white/95 dark:bg-white/[0.03] border-gray-200/80 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 shadow-lg shadow-black/5 dark:shadow-none">
                <div className="flex flex-col items-center gap-2">
                  <div className={cn(
                    "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-lg",
                    stat.count > 0 ? `bg-gradient-to-br ${stat.gradient}` : "bg-gray-100 dark:bg-white/5"
                  )}>
                    <stat.icon className={cn(
                      "w-6 h-6 sm:w-7 sm:h-7",
                      stat.count > 0 ? "text-white" : "text-gray-700 dark:text-white"
                    )} strokeWidth={2.5} />
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

        {/* KÖZ TALEPLERİ - YENİ */}
        {unreadCoalRequests.length > 0 && (
          <div>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white"
            >
              <Flame className="h-6 w-6 animate-pulse text-orange-500 dark:text-orange-400" />
              Yeni Köz Talepleri ({unreadCoalRequests.length})
            </motion.h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
              {unreadCoalRequests.map((notif, idx) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ scale: 1.01, y: -2 }}
                  className="relative group"
                >
                  {/* Subtle Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative backdrop-blur-xl backdrop-saturate-150 bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-3xl p-6 transition-all duration-300 shadow-2xl">
                    {/* X Button - Glassmorphism */}
                    <button
                      onClick={() => handleDismiss(notif.id, notif.tableId)}
                      className="absolute top-4 right-4 w-9 h-9 rounded-full bg-red-500/90 hover:bg-red-500 backdrop-blur-sm text-white flex items-center justify-center transition-all shadow-lg hover:scale-110 active:scale-95"
                    >
                      <X className="h-4 w-4" strokeWidth={3} />
                    </button>

                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-xl">
                        <Flame className="h-8 w-8 text-white animate-pulse" strokeWidth={2.5} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-4 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold text-lg shadow-lg">
                            Masa {notif.tableName}
                          </span>
                          <Badge variant="destructive" className="flex items-center gap-1 text-xs rounded-full animate-pulse">
                            <Clock className="h-3 w-3" />
                            {Math.floor((Date.now() - new Date(notif.createdAt).getTime()) / (1000 * 60))} dk
                          </Badge>
                        </div>
                        <div className="text-base text-white font-semibold flex items-center gap-2">
                          <Flame className="h-4 w-4 text-orange-400" />
                          Köz İstiyor
                        </div>
                      </div>
                    </div>

                    {/* Message */}
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 mb-4">
                      <p className="text-sm text-white/90 font-medium">
                        Köz yenilenmesi isteniyor
                      </p>
                    </div>

                    {/* Action Button */}
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      className="w-full h-12 text-base font-bold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl shadow-xl transition-all flex items-center justify-center gap-2"
                      onClick={() => handleRespond(notif.id, notif.tableId)}
                      disabled={responding === notif.id}
                    >
                      {responding === notif.id ? (
                        <>
                          <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                          İşleniyor...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-5 w-5" />
                          İşleme Al
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* DİĞER ACİL BİLDİRİMLER */}
        {otherNotifications.length > 0 && (
          <div>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white"
            >
              <Bell className="h-6 w-6 animate-pulse text-red-500 dark:text-red-400" />
              Diğer Bildirimler ({otherNotifications.length})
            </motion.h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
              {otherNotifications.map((notif, idx) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ scale: 1.01, y: -2 }}
                  className="relative group"
                >
                  {/* Subtle Hover Glow */}
                  <div className={cn(
                    "absolute inset-0 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                    notif.type === 'waiter_call' && "bg-gradient-to-br from-blue-500/20 to-cyan-500/20",
                    notif.type === 'coal_request' && "bg-gradient-to-br from-orange-500/20 to-red-500/20",
                    notif.type === 'bill_request' && "bg-gradient-to-br from-green-500/20 to-emerald-500/20"
                  )} />
                  
                  <div className="relative backdrop-blur-xl backdrop-saturate-150 bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-3xl p-6 transition-all duration-300 shadow-2xl">
                    {/* X Button - Glassmorphism */}
                    <button
                      onClick={() => handleDismiss(notif.id, notif.tableId)}
                      className="absolute top-4 right-4 w-9 h-9 rounded-full bg-red-500/90 hover:bg-red-500 backdrop-blur-sm text-white flex items-center justify-center transition-all shadow-lg hover:scale-110 active:scale-95"
                    >
                      <X className="h-4 w-4" strokeWidth={3} />
                    </button>

                    <div className="flex items-start gap-4 mb-4">
                      <div className={cn("w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-xl", getNotificationGradient(notif.type))}>
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn("px-4 py-1.5 text-white rounded-xl font-bold text-lg shadow-lg bg-gradient-to-r", getNotificationGradient(notif.type))}>
                            Masa {notif.tableName}
                          </span>
                          <Badge variant="destructive" className="flex items-center gap-1 text-xs rounded-full animate-pulse">
                            <Clock className="h-3 w-3" />
                            {Math.floor((Date.now() - new Date(notif.createdAt).getTime()) / (1000 * 60))} dk
                          </Badge>
                        </div>
                        <div className="text-base text-white font-semibold">
                          {notif.type === 'waiter_call' && '📞 Garson çağırıyor'}
                          {notif.type === 'coal_request' && '🔥 Köz istiyor'}
                          {notif.type === 'bill_request' && '💳 Hesap istiyor'}
                        </div>
                      </div>
                    </div>

                    {/* Message */}
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 mb-4">
                      <p className="text-sm text-white/90">{notif.message}</p>
                    </div>

                    {/* Action Button */}
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "w-full h-12 text-base font-bold bg-gradient-to-r text-white rounded-xl shadow-xl transition-all flex items-center justify-center gap-2",
                        getNotificationGradient(notif.type)
                      )}
                      onClick={() => handleRespond(notif.id, notif.tableId)}
                      disabled={responding === notif.id}
                    >
                      {responding === notif.id ? (
                        <>
                          <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                          İşleniyor...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-5 w-5" />
                          İşleme Al
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* HAZIR SİPARİŞLER - İKİNCİ SIRADA */}
        {readyOrders.length > 0 && (
          <div>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white"
            >
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              Hazır Siparişler ({readyOrders.length})
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
              {readyOrders.map((order, idx) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
                  
                  <div className="relative backdrop-blur-xl bg-white/95 dark:bg-white/[0.03] border-2 border-green-300 dark:border-green-500/30 hover:border-green-400 dark:hover:border-green-500/50 rounded-3xl p-6 transition-all duration-300 shadow-lg shadow-black/5 dark:shadow-none">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-bold text-lg text-gray-900 dark:text-white">{order.orderNumber}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Masa {order.tableName}</div>
                      </div>
                      <Badge variant="secondary" className="rounded-full bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white border-gray-300 dark:border-white/20 px-3 py-1">
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)} ürün
                      </Badge>
                    </div>

                    <div className="space-y-1.5 mb-4 max-h-32 overflow-y-auto custom-scrollbar">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-white/5 rounded-2xl p-2.5 border border-gray-200 dark:border-white/10">
                          {item.quantity}x {item.name}
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      {/* BASILI TUT - TESLİM AL - PROGRESS BAR İLE */}
                      <motion.button
                        onPointerDown={() => {
                          setHoldingOrderId(order.id);
                          const interval = setInterval(() => {
                            setHoldProgress(prev => {
                              if (prev >= 100) {
                                clearInterval(interval);
                                setHoldingOrderId(null);
                                setHoldProgress(0);
                                handlePickup(order.id);
                                return 0;
                              }
                              return prev + 5; // 2 saniyede 100% (20 * 5 = 100)
                            });
                          }, 100);
                          
                          // Store interval ID
                          (window as any).__holdInterval = interval;
                        }}
                        onPointerUp={() => {
                          if ((window as any).__holdInterval) {
                            clearInterval((window as any).__holdInterval);
                            (window as any).__holdInterval = null;
                          }
                          setHoldingOrderId(null);
                          setHoldProgress(0);
                        }}
                        onPointerLeave={() => {
                          if ((window as any).__holdInterval) {
                            clearInterval((window as any).__holdInterval);
                            (window as any).__holdInterval = null;
                          }
                          setHoldingOrderId(null);
                          setHoldProgress(0);
                        }}
                        disabled={responding === order.id}
                        className="w-full h-12 relative overflow-hidden rounded-full bg-white dark:bg-white/10 border-2 border-gray-300 dark:border-white/20 font-heading font-bold transition-all"
                      >
                        {/* Progress Bar */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500"
                          style={{
                            width: `${holdingOrderId === order.id ? holdProgress : 0}%`,
                            transition: 'width 0.1s linear'
                          }}
                        />
                        
                        <span className={cn(
                          "relative z-10 transition-colors",
                          holdingOrderId === order.id && holdProgress > 50 
                            ? "text-white" 
                            : "text-gray-700 dark:text-white"
                        )}>
                          Basılı Tut - Teslim Aldım
                        </span>
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="w-full h-11 text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-full shadow-lg transition-all"
                        onClick={() => handleDeliver(order.id)}
                      >
                        Masaya Teslim Ettim
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* MASALAR - ALAN FİLTRELEME İLE */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xl font-bold text-gray-900 dark:text-white"
            >
              Masalar
            </motion.h2>

            {/* Alan Filtreleme */}
            {areas.length > 1 && (
              <div className="flex items-center gap-2 overflow-hidden">
                <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {areas.map((area) => (
                    <motion.button
                      key={area}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedArea(area)}
                      className={cn(
                        'px-4 py-1.5 rounded-full text-sm font-heading font-bold whitespace-nowrap transition-all flex-shrink-0',
                        selectedArea === area
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                      )}
                    >
                      {area === 'all' ? 'Tümü' : area}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <TableGrid 
            tables={filteredTables} 
            orders={orders}
            onTableLongPress={handleTableLongPress}
          />
        </div>

        {/* Empty State */}
        {coalRequests.length === 0 && otherNotifications.length === 0 && readyOrders.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 backdrop-blur-xl bg-white/95 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 rounded-3xl shadow-lg shadow-black/5 dark:shadow-none"
          >
            <Bell className="h-20 w-20 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
            <p className="text-lg text-gray-600 dark:text-gray-400">Şu an bekleyen talep yok</p>
          </motion.div>
        )}
      </div>

      {/* Table Action Menu */}
      <TableActionMenu
        open={!!actionMenuTable}
        onClose={() => setActionMenuTable(null)}
        tableNumber={actionMenuTable?.tableNumber || ''}
        hasActiveOrders={!!actionMenuTable && orders.some(o => o.tableId === actionMenuTable.id && o.status !== 'completed' && o.status !== 'cancelled')}
        onNewOrder={() => {
          if (!actionMenuTable) return;
          setOrderScreenTable(actionMenuTable);
        }}
        onMarkDelivered={async () => {
          if (!actionMenuTable) return;
          const tableOrders = orders.filter(o => 
            o.tableId === actionMenuTable.id && 
            ['ready', 'picked_up'].includes(o.status)
          );
          
          if (tableOrders.length === 0) {
            toast.error('Teslim edilecek sipariş bulunamadı');
            return;
          }
          
          for (const order of tableOrders) {
            await handleDeliver(order.id);
          }
          
          await restaurantService.updateTable(actionMenuTable.id, { status: 'delivered' });
        }}
        onRequestBill={async () => {
          if (!actionMenuTable) return;
          await restaurantService.updateTable(actionMenuTable.id, { status: 'bill_requested' });
          toast.success('Hesap talebi oluşturuldu');
        }}
        onTransferTable={() => {
          setTransferTable(actionMenuTable);
        }}
      />

      {/* Table Transfer Dialog */}
      <TableTransferDialog
        open={!!transferTable}
        onClose={() => setTransferTable(null)}
        sourceTable={transferTable || tables[0]} // Fallback to prevent null
        availableTables={tables}
        onTransfer={async (targetTableId) => {
          if (!transferTable) return;
          
          const targetTable = tables.find(t => t.id === targetTableId);
          if (!targetTable) return;
          
          // Transfer all orders from source to target
          const tableOrders = orders.filter(o => 
            o.tableId === transferTable.id && 
            o.status !== 'completed' && 
            o.status !== 'cancelled'
          );

          // Update each order with new table info
          for (const order of tableOrders) {
            await restaurantService.updateOrder(order.id, {
              tableId: targetTableId,
              tableName: targetTable.tableNumber
            });
          }

          // Update table statuses
          await restaurantService.updateTable(transferTable.id, { status: 'empty' });
          
          // Set target table status based on transferred orders
          if (tableOrders.length > 0) {
            const hasDelivered = tableOrders.some(o => o.status === 'delivered');
            const hasReady = tableOrders.some(o => o.status === 'ready');
            const newStatus = hasDelivered ? 'delivered' : hasReady ? 'ready' : 'occupied';
            await restaurantService.updateTable(targetTableId, { status: newStatus });
          }

          toast.success(`Masa ${transferTable.tableNumber} → Masa ${targetTable.tableNumber} taşındı`);
          setTransferTable(null);
        }}
      />

      {/* Waiter Order Screen */}
      {orderScreenTable && (
        <WaiterOrderScreen
          open={!!orderScreenTable}
          onClose={() => setOrderScreenTable(null)}
          restaurantId={restaurantId}
          table={orderScreenTable}
        />
      )}

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

      {/* Floating Notification Toasts - Top Right */}
      <div className="fixed top-6 right-6 z-[9999] space-y-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {notifications.slice(0, 3).map((notif, index) => (
            <div key={notif.id} className="pointer-events-auto">
              <NotificationToast
                notification={notif}
                onDismiss={() => handleRespond(notif.id, notif.tableId)}
                onRespond={() => handleRespond(notif.id, notif.tableId)}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
