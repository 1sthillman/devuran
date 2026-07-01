import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, MoveHorizontal, Users, Clock, Flame, Phone, Receipt, CheckCircle2, X, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { restaurantService } from '@/services/restaurantService';
import { toast } from 'sonner';
import type { Table, Order, RestaurantNotification } from '@/types/restaurant';
import type { Reservation } from '@/types';
import { TableTransferDialog } from './TableTransferDialog';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface TableGridProps {
  tables: Table[];
  orders: Order[];
  notifications?: RestaurantNotification[]; // Yeni: Bildirimler
  restaurantId: string; // 🆕 Rezervasyonları dinlemek için
  onTableClick?: (table: Table) => void;
  onTableLongPress?: (table: Table) => void;
}

export function TableGrid({ tables, orders, notifications = [], restaurantId, onTableClick, onTableLongPress }: TableGridProps) {
  const [transferDialog, setTransferDialog] = useState<{ table: Table; order: Order } | null>(null);
  const [notificationDialog, setNotificationDialog] = useState<{ table: Table; notification: RestaurantNotification } | null>(null);
  const [responding, setResponding] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<number | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]); // 🆕 Rezervasyonlar

  // 🆕 Rezervasyonları dinle
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'reservations'),
        where('salonId', '==', restaurantId),
        where('type', '==', 'slot')
      ),
      (snapshot) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const reservationsList = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Reservation))
          .filter(res => {
            const slotRes = res as any;
            const resDate = new Date(slotRes.date);
            resDate.setHours(0, 0, 0, 0);
            
            // Sadece bugünkü ve aktif rezervasyonlar
            return resDate.getTime() === today.getTime() && 
                   ['confirmed', 'deposit_paid', 'fully_paid', 'in_progress'].includes(slotRes.status);
          });
        
        setReservations(reservationsList);
      },
      (error) => {
        console.error('❌ Rezervasyon dinleme hatası:', error);
        setReservations([]);
      }
    );

    return () => unsubscribe();
  }, [restaurantId]);

  // 🆕 Masanın bugünkü rezervasyonunu bul
  function getTableReservation(tableName: string): { reservation: Reservation; minutesUntil: number; isNear: boolean } | null {
    const now = new Date();
    
    for (const res of reservations) {
      const slotRes = res as any;
      const tableService = slotRes.services?.[0];
      const resTableName = tableService?.name?.replace('Masa ', '');
      
      if (resTableName === tableName) {
        // Rezervasyon saatini parse et
        const [hours, minutes] = slotRes.time.split(':').map(Number);
        const reservationTime = new Date();
        reservationTime.setHours(hours, minutes, 0, 0);
        
        const minutesUntil = Math.floor((reservationTime.getTime() - now.getTime()) / 60000);
        
        // 1 saat = 60 dakika
        const isNear = minutesUntil > 0 && minutesUntil <= 60;
        
        return { reservation: res, minutesUntil, isNear };
      }
    }
    
    return null;
  }

  function getTableStatusColor(status: string): string {
    switch (status) {
      case 'empty':
        return 'bg-gray-100 border-gray-300 hover:bg-gray-200 dark:bg-white/[0.03] dark:border-white/10 dark:hover:bg-white/[0.05]';
      case 'reserved':
        return 'bg-blue-100 border-blue-400 hover:bg-blue-200 dark:bg-blue-500/10 dark:border-blue-500/30 dark:hover:bg-blue-500/20';
      case 'occupied':
      case 'ordering':
        return 'bg-yellow-100 border-yellow-400 hover:bg-yellow-200 dark:bg-yellow-500/10 dark:border-yellow-500/30 dark:hover:bg-yellow-500/20';
      case 'order_placed':
        return 'bg-orange-100 border-orange-400 hover:bg-orange-200 dark:bg-orange-500/10 dark:border-orange-500/30 dark:hover:bg-orange-500/20';
      case 'preparing':
        return 'bg-purple-100 border-purple-400 hover:bg-purple-200 dark:bg-purple-500/10 dark:border-purple-500/30 dark:hover:bg-purple-500/20';
      case 'ready':
        return 'bg-green-100 border-green-400 hover:bg-green-200 dark:bg-green-500/10 dark:border-green-500/30 dark:hover:bg-green-500/20';
      case 'waiter_picking':
        return 'bg-indigo-100 border-indigo-400 hover:bg-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:hover:bg-indigo-500/20';
      case 'delivered':
        return 'bg-teal-100 border-teal-400 hover:bg-teal-200 dark:bg-teal-500/10 dark:border-teal-500/30 dark:hover:bg-teal-500/20';
      case 'bill_requested':
        return 'bg-red-100 border-red-400 hover:bg-red-200 animate-pulse dark:bg-red-500/10 dark:border-red-500/30 dark:hover:bg-red-500/20';
      case 'waiter_called':
        return 'bg-blue-100 border-blue-400 hover:bg-blue-200 animate-pulse dark:bg-blue-500/10 dark:border-blue-500/30 dark:hover:bg-blue-500/20';
      case 'coal_requested':
        return 'bg-orange-100 border-orange-500 hover:bg-orange-200 animate-pulse shadow-lg shadow-orange-500/50 dark:bg-orange-500/20 dark:border-orange-400 dark:hover:bg-orange-500/30';
      case 'moving':
        return 'bg-gray-200 border-gray-400 dark:bg-white/[0.05] dark:border-white/20';
      default:
        return 'bg-gray-100 border-gray-300 dark:bg-white/[0.03] dark:border-white/10';
    }
  }

  function getTableStatusText(status: string): string {
    switch (status) {
      case 'empty':
        return 'Boş';
      case 'reserved':
        return 'Rezerve';
      case 'occupied':
        return 'Dolu';
      case 'ordering':
        return 'Menüye Bakıyor';
      case 'order_placed':
        return 'Sipariş Verildi';
      case 'preparing':
        return 'Hazırlanıyor';
      case 'ready':
        return 'Hazır';
      case 'waiter_picking':
        return 'Teslim Alınıyor';
      case 'delivered':
        return 'Teslim Edildi';
      case 'bill_requested':
        return 'Hesap İstiyor';
      case 'waiter_called':
        return 'Garson Çağırıyor';
      case 'coal_requested':
        return 'Köz İstiyor';
      case 'moving':
        return 'Taşınıyor';
      default:
        return status;
    }
  }

  function getTableOrder(tableId: string): Order | undefined {
    return orders.find(order => order.tableId === tableId && order.status !== 'completed' && order.status !== 'cancelled');
  }

  // Masa için toplam tutarı hesapla (tüm aktif siparişlerin toplamı)
  function getTableTotal(tableId: string): number {
    const tableOrders = orders.filter(order => 
      order.tableId === tableId && 
      ['delivered', 'ready', 'preparing', 'order_placed'].includes(order.status)
    );
    return tableOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  }

  // Masa için toplam ürün sayısını hesapla
  function getTableItemCount(tableId: string): number {
    const tableOrders = orders.filter(order => 
      order.tableId === tableId && 
      ['delivered', 'ready', 'preparing', 'order_placed'].includes(order.status)
    );
    return tableOrders.reduce((sum, order) => sum + order.items.length, 0);
  }

  function handleTableLongPress(table: Table) {
    if (onTableLongPress) {
      onTableLongPress(table);
    } else {
      const order = getTableOrder(table.id);
      if (order && table.status !== 'empty') {
        setTransferDialog({ table, order });
      }
    }
  }

  function handlePointerDown(table: Table) {
    const timer = setTimeout(() => {
      handleTableLongPress(table);
    }, 500); // 500ms basılı tutma
    setLongPressTimer(timer);
  }

  function handlePointerUp() {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }

  // Masa bildirimlerini kontrol et ve dialog aç
  function handleTableClickWithNotification(table: Table) {
    // Bildirimleri kontrol et (coal_requested, waiter_called, bill_requested)
    const tableNotification = notifications.find(n => n.tableId === table.id && !n.isRead);
    
    if (tableNotification) {
      // Bildirim varsa dialog aç
      setNotificationDialog({ table, notification: tableNotification });
    } else {
      // Bildirim yoksa normal tıklama
      if (!table.status || table.status === 'empty') return;
      onTableClick?.(table);
    }
  }

  // Bildirime yanıt ver
  async function handleRespondToNotification() {
    if (!notificationDialog) return;
    
    try {
      setResponding(true);
      
      // Bildirimi sil
      await restaurantService.deleteNotification(notificationDialog.notification.id);
      
      // Masa durumunu güncelle
      if (notificationDialog.table.id) {
        await restaurantService.updateTable(notificationDialog.table.id, {
          status: 'occupied' // Normale dön
        });
      }
      
      toast.success('Müşteriye bildiriliyor', {
        description: `Masa ${notificationDialog.table.tableNumber} - Yola çıkıldı`
      });
      
      setNotificationDialog(null);
    } catch (error) {
      console.error('Yanıt hatası:', error);
      toast.error('İşlem başarısız');
    } finally {
      setResponding(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {tables.map((table) => {
          const order = getTableOrder(table.id);
          const isEmpty = table.status === 'empty';
          const reservationInfo = getTableReservation(table.tableNumber); // 🆕 Rezervasyon kontrolü

          return (
            <Card
              key={table.id}
              className={cn(
                'relative p-4 border-2 cursor-pointer transition-all select-none',
                getTableStatusColor(table.status),
                reservationInfo?.isNear && 'border-purple-500 dark:border-purple-400'
              )}
              onClick={() => handleTableClickWithNotification(table)}
              onPointerDown={() => handlePointerDown(table)}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              {/* Rezervasyon Badge - En Üstte */}
              {reservationInfo?.isNear && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-purple-600 dark:bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                    <Calendar className="w-3 h-3 mr-1 inline" />
                    {reservationInfo.minutesUntil} dk
                  </Badge>
                </div>
              )}

              {/* Masa Numarası */}
              <div className="text-center mb-3">
                <div className="flex items-center justify-center gap-2">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">{table.tableNumber}</div>
                  {table.status === 'coal_requested' && (
                    <Flame className="h-6 w-6 text-orange-500 animate-pulse" strokeWidth={2.5} />
                  )}
                </div>
                <Badge variant="secondary" className="mt-1 bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                  <Users className="h-3 w-3 mr-1" />
                  {table.capacity}
                </Badge>
              </div>

              {/* Durum */}
              <div className="text-center">
                <Badge
                  className={cn(
                    'text-xs font-medium',
                    table.status === 'coal_requested' 
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white animate-pulse shadow-lg'
                      : 'bg-gray-700 dark:bg-white text-white dark:text-gray-900',
                    table.status.includes('call') || table.status.includes('request') 
                      ? 'animate-pulse' 
                      : ''
                  )}
                >
                  {table.status === 'coal_requested' && <Flame className="h-3 w-3 mr-1 inline" />}
                  {getTableStatusText(table.status)}
                </Badge>
              </div>

              {/* Rezervasyon Bilgisi - Masa boşsa ve rezervasyon yakınsa göster */}
              {isEmpty && reservationInfo?.isNear && (() => {
                const slotRes = reservationInfo.reservation as any;
                return (
                  <div className="mt-3 pt-3 border-t border-purple-500/30 bg-purple-50 dark:bg-purple-500/10 rounded p-2">
                    <div className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center justify-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Rezervasyon
                    </div>
                    <div className="text-center mt-1">
                      <div className="text-xs font-semibold text-gray-900 dark:text-white">
                        {slotRes.userName}
                      </div>
                      <div className="text-xs text-purple-600 dark:text-purple-400">
                        {slotRes.time}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Sipariş Bilgisi - TÜM SİPARİŞLERİN TOPLAMI */}
              {!isEmpty && (
                <div className="mt-3 pt-3 border-t border-current/20">
                  <div className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-300">
                    <span className="font-medium">
                      {order ? order.orderNumber : 'Sipariş'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {getTableItemCount(table.id)} ürün
                    </span>
                  </div>
                  <div className="text-xs font-bold mt-1 text-gray-900 dark:text-white">
                    {getTableTotal(table.id).toFixed(2)} ₺
                  </div>
                </div>
              )}

              {/* Menü */}
              {!isEmpty && order && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <DropdownMenuItem onClick={() => setTransferDialog({ table, order })} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                      <MoveHorizontal className="h-4 w-4 mr-2" />
                      Masa Taşı
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </Card>
          );
        })}
      </div>

      {/* Masa Taşıma Dialog */}
      {transferDialog && (
        <TableTransferDialog
          sourceTable={transferDialog.table}
          availableTables={tables}
          open={!!transferDialog}
          onClose={() => setTransferDialog(null)}
          onTransfer={async (targetTableId) => {
            // TODO: Implement table transfer logic in restaurantService
            console.log('Transfer from', transferDialog.table.id, 'to', targetTableId);
          }}
        />
      )}

      {/* Bildirim Dialog - Glassmorphism */}
      <AnimatePresence>
        {notificationDialog && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNotificationDialog(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            />

            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            >
              <div className="relative max-w-md w-full backdrop-blur-2xl backdrop-saturate-150 bg-white/10 dark:bg-white/5 border border-white/20 rounded-3xl p-6 shadow-2xl">
                {/* X Button */}
                <button
                  onClick={() => setNotificationDialog(null)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all"
                >
                  <X className="w-5 h-5 text-white" strokeWidth={2.5} />
                </button>

                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <div className={cn(
                    "w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl",
                    notificationDialog.notification.type === 'coal_request' && "bg-gradient-to-br from-orange-500 to-red-500",
                    notificationDialog.notification.type === 'waiter_call' && "bg-gradient-to-br from-blue-500 to-cyan-500",
                    notificationDialog.notification.type === 'bill_request' && "bg-gradient-to-br from-green-500 to-emerald-500"
                  )}>
                    {notificationDialog.notification.type === 'coal_request' && <Flame className="w-10 h-10 text-white" strokeWidth={2.5} />}
                    {notificationDialog.notification.type === 'waiter_call' && <Phone className="w-10 h-10 text-white" strokeWidth={2.5} />}
                    {notificationDialog.notification.type === 'bill_request' && <Receipt className="w-10 h-10 text-white" strokeWidth={2.5} />}
                  </div>
                </div>

                {/* Content */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Masa {notificationDialog.table.tableNumber}
                  </h3>
                  <p className="text-lg text-white/90 font-semibold">
                    {notificationDialog.notification.type === 'coal_request' && '🔥 Köz İstiyor'}
                    {notificationDialog.notification.type === 'waiter_call' && '📞 Garson Çağırıyor'}
                    {notificationDialog.notification.type === 'bill_request' && '💳 Hesap İstiyor'}
                  </p>
                  <div className="mt-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3">
                    <p className="text-sm text-white/80">
                      {notificationDialog.notification.message}
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRespondToNotification}
                  disabled={responding}
                  className={cn(
                    "w-full h-14 text-lg font-bold rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 text-white",
                    notificationDialog.notification.type === 'coal_request' && "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600",
                    notificationDialog.notification.type === 'waiter_call' && "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600",
                    notificationDialog.notification.type === 'bill_request' && "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  )}
                >
                  {responding ? (
                    <>
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                      İşleniyor...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-6 h-6" />
                      Geliyorum
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
