import { useState, useEffect, useRef } from 'react';
import { Bell, BellRing, Volume2, VolumeX, X, Calendar, User, Phone, Clock, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { soundService } from '@/services/soundService';
import { onSnapshot, collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Reservation } from '@/types';

interface ReservationNotificationButtonProps {
  salonId: string;
}

export function ReservationNotificationButton({ salonId }: ReservationNotificationButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newReservations, setNewReservations] = useState<Reservation[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date>(new Date());
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Dinlemeyi başlat/durdur
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Real-time dinleme başlat
  const startListening = () => {
    console.log('🔔 Rezervasyon dinleme başlatıldı - Salon ID:', salonId);
    setIsListening(true);
    setLastCheckTime(new Date());
    setNewReservations([]); // Mevcut bildirimleri temizle

    // Firestore real-time listener
    const reservationsRef = collection(db, 'reservations');
    const q = query(
      reservationsRef,
      where('salonId', '==', salonId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const now = Date.now();
        const newDocs: Reservation[] = [];

        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data() as any;
            const reservation: Reservation = {
              id: change.doc.id,
              ...data
            };

            // Sadece dinleme başladıktan SONRA oluşturulan rezervasyonları göster
            const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
            const createdTimestamp = createdAt.getTime();

            // 2 saniye tolerans (listener başlatılırken oluşabilecek timing issues için)
            if (createdTimestamp >= lastCheckTime.getTime() - 2000) {
              newDocs.push(reservation);
              console.log('🆕 Yeni rezervasyon algılandı:', reservation.id);
            }
          }
        });

        if (newDocs.length > 0) {
          setNewReservations((prev) => [...newDocs, ...prev].slice(0, 10)); // Son 10 bildirim
          
          // Ses çal
          if (soundEnabled) {
            soundService.playNotification();
          }

          // Otomatik göster
          setShowNotifications(true);
        }
      },
      (error) => {
        console.error('❌ Rezervasyon dinleme hatası:', error);
      }
    );

    unsubscribeRef.current = unsubscribe;
  };

  // Dinlemeyi durdur
  const stopListening = () => {
    console.log('🔕 Rezervasyon dinleme durduruldu');
    setIsListening(false);
    
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  };

  // Component unmount - cleanup
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Bildirim işaretle okundu
  const markAsRead = (reservationId: string) => {
    setNewReservations((prev) => prev.filter((r) => r.id !== reservationId));
  };

  // Tüm bildirimleri temizle
  const clearAll = () => {
    setNewReservations([]);
    setShowNotifications(false);
  };

  // Rezervasyon detaylarını formatla
  const formatReservationDetails = (reservation: Reservation) => {
    const slotRes = reservation as any;
    
    return {
      customerName: reservation.userName || 'Bilinmiyor',
      phone: reservation.userPhone || '',
      date: slotRes.date || slotRes.eventDate || slotRes.checkInDate || '-',
      time: slotRes.time || slotRes.eventStartTime || slotRes.checkInTime || '-',
      type: getReservationTypeLabel(reservation.type)
    };
  };

  const getReservationTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      slot: 'Randevu',
      daily: 'Günlük Kiralama',
      nightly: 'Konaklama',
      project: 'Proje',
      order: 'Sipariş'
    };
    return labels[type] || type;
  };

  return (
    <>
      {/* Ana Buton */}
      <div className="relative">
        <motion.button
          onClick={toggleListening}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "relative flex items-center gap-2 px-4 py-2.5 rounded-full font-heading font-semibold text-sm transition-all duration-200",
            isListening
              ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30"
              : "bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10"
          )}
        >
          {isListening ? (
            <>
              <BellRing className="w-4 h-4 animate-pulse" />
              <span>Dinleniyor</span>
            </>
          ) : (
            <>
              <Bell className="w-4 h-4" />
              <span>Bildirimleri Dinle</span>
            </>
          )}
          
          {/* Bildirim sayısı badge */}
          {newReservations.length > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
            >
              {newReservations.length}
            </motion.span>
          )}
        </motion.button>

        {/* Ses kontrol butonu */}
        {isListening && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={(e) => {
              e.stopPropagation();
              setSoundEnabled(!soundEnabled);
            }}
            className="absolute -right-10 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
          </motion.button>
        )}

        {/* Bildirimler listesi buton */}
        {newReservations.length > 0 && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={() => setShowNotifications(true)}
            className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold transition-colors"
          >
            {newReservations.length} Yeni
          </motion.button>
        )}
      </div>

      {/* Bildirimler Modal */}
      <AnimatePresence>
        {showNotifications && newReservations.length > 0 && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotifications(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            >
              <div className="relative max-w-2xl w-full max-h-[80vh] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                      <BellRing className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-white">
                        Yeni Rezervasyonlar
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {newReservations.length} yeni bildirim
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={clearAll}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      Tümünü Temizle
                    </button>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Bildirimler Listesi */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {newReservations.map((reservation, index) => {
                    const details = formatReservationDetails(reservation);
                    
                    return (
                      <motion.div
                        key={reservation.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="relative p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-900/10 dark:to-emerald-900/10 hover:shadow-md transition-all"
                      >
                        {/* Yeni badge */}
                        <div className="absolute top-2 right-2">
                          <span className="px-2 py-1 rounded-full bg-green-500 text-white text-xs font-bold">
                            YENİ
                          </span>
                        </div>

                        <div className="space-y-2">
                          {/* Müşteri */}
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            <span className="font-heading font-bold text-gray-900 dark:text-white">
                              {details.customerName}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                              {details.type}
                            </span>
                          </div>

                          {/* Detaylar */}
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <Calendar className="w-4 h-4" />
                              {details.date}
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <Clock className="w-4 h-4" />
                              {details.time}
                            </div>
                            {details.phone && (
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 col-span-2">
                                <Phone className="w-4 h-4" />
                                {details.phone}
                              </div>
                            )}
                          </div>

                          {/* Aksiyon butonları */}
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => markAsRead(reservation.id)}
                              className="flex-1 h-9 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium text-sm transition-colors flex items-center justify-center gap-1.5"
                            >
                              <Check className="w-4 h-4" />
                              Gördüm
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
