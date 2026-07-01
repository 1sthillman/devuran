import { useEffect, useState } from 'react';
import { Search, Calendar, MapPin, Phone, Edit, Trash2, Bell, BellOff, Check, X, Plus, Clock, User, Mail } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { notificationService } from '@/services/notificationService';
import type { Reservation } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function ReservationManagement() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  useEffect(() => {
    loadReservations();
  }, []);

  useEffect(() => {
    filterReservations();
  }, [searchTerm, filterStatus, reservations]);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const reservationsSnapshot = await getDocs(collection(db, 'reservations'));
      const reservationsData = reservationsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Reservation[];
      
      setReservations(reservationsData);
    } catch (error) {
      console.error('Load reservations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterReservations = () => {
    let filtered = [...reservations];

    if (searchTerm) {
      filtered = filtered.filter(res =>
        res.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.userPhone?.includes(searchTerm)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(res => res.status === filterStatus);
    }

    setFilteredReservations(filtered);
  };

  const handleUpdateStatus = async (reservationId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'reservations', reservationId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      
      // Push notification gönder (status değişikliğinde)
      const reservation = reservations.find(r => r.id === reservationId);
      if (reservation && newStatus === 'confirmed') {
        await notificationService.sendReservationConfirmed({
          userId: reservation.userId,
          userName: reservation.userName,
          userEmail: reservation.userEmail,
          userPhone: reservation.userPhone,
          businessName: reservation.businessName,
          reservationId: reservation.id,
          date: (reservation as any).date || new Date().toISOString(),
          time: (reservation as any).startTime,
        });
      } else if (reservation && newStatus.includes('cancelled')) {
        await notificationService.sendReservationCancelled({
          userId: reservation.userId,
          userName: reservation.userName,
          userEmail: reservation.userEmail,
          userPhone: reservation.userPhone,
          businessName: reservation.businessName,
          reservationId: reservation.id,
          cancelledBy: 'business',
        });
      }
      
      await loadReservations();
    } catch (error) {
      console.error('Update status error:', error);
    }
  };

  const sendPushNotification = async (reservation: Reservation) => {
    try {
      await notificationService.sendReservationReminder({
        userId: reservation.userId,
        userName: reservation.userName,
        userEmail: reservation.userEmail,
        userPhone: reservation.userPhone,
        businessName: reservation.businessName,
        reservationId: reservation.id,
        date: (reservation as any).date || new Date().toISOString(),
        time: (reservation as any).startTime,
        address: reservation.businessName,
      });
      alert('✅ Bildirim gönderildi!');
    } catch (error) {
      console.error('Send notification error:', error);
      alert('❌ Bildirim gönderilemedi');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Bekliyor', className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
      confirmed: { label: 'Onaylandı', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
      completed: { label: 'Tamamlandı', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
      cancelled_by_user: { label: 'İptal (Kullanıcı)', className: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
      cancelled_by_business: { label: 'İptal (İşletme)', className: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <span className={cn(
        'px-3 py-1 text-xs font-semibold rounded-full border',
        config.className
      )}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-white/10 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-white">Rezervasyon Yönetimi</h1>
        <p className="text-white/50 mt-2">Tüm rezervasyonları görüntüle, yönet ve bildirim gönder</p>
      </div>

      {/* Search & Filter */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="İsim, işletme veya telefon ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/20 transition-colors appearance-none cursor-pointer"
          >
            <option value="all" className="bg-gray-900">Tüm Durumlar</option>
            <option value="pending" className="bg-gray-900">Beklemede</option>
            <option value="confirmed" className="bg-gray-900">Onaylandı</option>
            <option value="completed" className="bg-gray-900">Tamamlandı</option>
            <option value="cancelled" className="bg-gray-900">İptal</option>
          </select>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-white/40 text-sm">
            {filteredReservations.length} rezervasyon bulundu
          </p>
        </div>
      </div>

      {/* Reservations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredReservations.map((reservation, index) => (
            <motion.div
              key={reservation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedReservation(reservation)}
              className="group bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all cursor-pointer hover:bg-white/[0.07]"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-purple-300" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-white group-hover:text-purple-300 transition-colors">
                        {reservation.userName}
                      </h3>
                      <p className="text-xs text-white/40">{reservation.userPhone}</p>
                    </div>
                  </div>
                  {getStatusBadge(reservation.status)}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sendPushNotification(reservation);
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-colors"
                  title="Bildirim Gönder"
                >
                  <Bell className="w-4 h-4 text-white/60" />
                </button>
              </div>

              {/* Details */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 text-sm">
                  <MapPin className="w-4 h-4 text-white/40 flex-shrink-0" />
                  <span className="text-white/70">{reservation.businessName}</span>
                </div>

                {reservation.type === 'slot' && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <Calendar className="w-4 h-4 text-white/40 flex-shrink-0" />
                    <span className="text-white/70">
                      {reservation.date} • {reservation.startTime}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2.5 text-sm">
                  <Clock className="w-4 h-4 text-white/40 flex-shrink-0" />
                  <span className="text-white/40">
                    {new Date(reservation.createdAt).toLocaleString('tr-TR')}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                {reservation.status === 'pending' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateStatus(reservation.id, 'confirmed');
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 rounded-xl text-sm font-medium transition-colors border border-emerald-500/20"
                  >
                    <Check className="w-4 h-4" />
                    Onayla
                  </button>
                )}

                {reservation.status === 'confirmed' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateStatus(reservation.id, 'completed');
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 rounded-xl text-sm font-medium transition-colors border border-blue-500/20"
                  >
                    <Check className="w-4 h-4" />
                    Tamamla
                  </button>
                )}

                {!reservation.status.includes('cancelled') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateStatus(reservation.id, 'cancelled_by_business');
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-xl text-sm font-medium transition-colors border border-rose-500/20"
                  >
                    <X className="w-4 h-4" />
                    İptal
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingReservation(reservation);
                    setShowEditModal(true);
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl text-sm font-medium transition-colors border border-white/10"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedReservation && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReservation(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-50 p-4"
            >
              <div className="bg-gray-900 border border-white/20 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-heading font-bold text-white mb-2">
                      Rezervasyon Detayları
                    </h3>
                    <p className="text-white/50">#{selectedReservation.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <button
                    onClick={() => setSelectedReservation(null)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-white/60" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Customer Info */}
                  <div>
                    <h4 className="text-sm font-semibold text-white/40 mb-3">MÜŞTERİ BİLGİLERİ</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-white/40" />
                        <span className="text-white">{selectedReservation.userName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-white/40" />
                        <span className="text-white">{selectedReservation.userPhone}</span>
                      </div>
                      {selectedReservation.userEmail && (
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-white/40" />
                          <span className="text-white">{selectedReservation.userEmail}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reservation Info */}
                  <div>
                    <h4 className="text-sm font-semibold text-white/40 mb-3">REZERVASYON BİLGİLERİ</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-white/40" />
                        <span className="text-white">{selectedReservation.businessName}</span>
                      </div>
                      {selectedReservation.type === 'slot' && (
                        <>
                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-white/40" />
                            <span className="text-white">{selectedReservation.date}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-white/40" />
                            <span className="text-white">{selectedReservation.startTime}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <h4 className="text-sm font-semibold text-white/40 mb-3">DURUM</h4>
                    {getStatusBadge(selectedReservation.status)}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-6 border-t border-white/10">
                    <button
                      onClick={() => {
                        sendPushNotification(selectedReservation);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl font-semibold transition-all"
                    >
                      <Bell className="w-5 h-5" />
                      Bildirim Gönder
                    </button>
                    <button
                      onClick={() => setSelectedReservation(null)}
                      className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-colors border border-white/10"
                    >
                      Kapat
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
