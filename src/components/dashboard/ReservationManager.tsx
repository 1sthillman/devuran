import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  X, 
  Clock, 
  User, 
  Phone, 
  Calendar,
  MapPin,
  DollarSign,
  Users,
  FileText,
  Eye,
  AlertCircle,
  Plus
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { reservationService } from '@/services/reservationService';
import { soundService } from '@/services/soundService';
import { useUIStore } from '@/store/uiStore';
import { CancelAppointmentDialog } from '@/components/booking/CancelAppointmentDialog';
import type { Reservation, SlotReservation } from '@/types';

interface ReservationManagerProps {
  reservations: Reservation[];
  onRefresh: () => void;
}

export function ReservationManager({ reservations, onRefresh }: ReservationManagerProps) {
  const [loading, setLoading] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const { addToast } = useUIStore();
  const modalContentRef = useRef<HTMLDivElement>(null);

  const pendingReservations = reservations.filter(r => r.status === 'pending');
  const confirmedReservations = reservations.filter(r => 
    r.status === 'confirmed' || r.status === 'deposit_paid' || r.status === 'fully_paid'
  );

  // Modal açıldığında scroll'u kilitle ve içeriği en üste al
  useEffect(() => {
    if (showDetailModal) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      // Modal içeriğini en üste scroll et
      if (modalContentRef.current) {
        modalContentRef.current.scrollTop = 0;
      }

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [showDetailModal]);

  const handleViewDetails = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowDetailModal(true);
  };

  const handleApprove = async (reservationId: string) => {
    setLoading(true);
    try {
      await reservationService.confirmReservation(reservationId);
      soundService.playAppointmentReceived();
      addToast('Rezervasyon onaylandı', 'success');
      setShowDetailModal(false);
      setSelectedReservation(null);
      onRefresh();
    } catch (error: any) {
      console.error('Error approving reservation:', error);
      addToast(error.message || 'Rezervasyon onaylanamadı', 'error');
    }
    setLoading(false);
  };

  const handleReject = async (reason: string) => {
    if (!selectedReservation) return;

    setLoading(true);
    try {
      await reservationService.cancelReservation(
        selectedReservation.id,
        'business',
        reason
      );
      soundService.playAppointmentCancelled();
      addToast('Rezervasyon reddedildi', 'success');
      setShowCancelDialog(false);
      setShowDetailModal(false);
      setSelectedReservation(null);
      onRefresh();
    } catch (error: any) {
      console.error('Error rejecting reservation:', error);
      addToast(error.message || 'Rezervasyon reddedilemedi', 'error');
    }
    setLoading(false);
  };

  const formatDate = (reservation: Reservation): string => {
    if ('date' in reservation) return reservation.date;
    if ('eventDate' in reservation) return reservation.eventDate;
    if ('checkIn' in reservation) return reservation.checkIn;
    if ('deliveryDate' in reservation) return reservation.deliveryDate;
    return '';
  };

  const formatDateRange = (reservation: Reservation): { start: string; end: string; nights?: number } | null => {
    if (reservation.type === 'nightly') {
      const nightly = reservation as any;
      return {
        start: nightly.checkIn,
        end: nightly.checkOut,
        nights: nightly.nights
      };
    }
    if (reservation.type === 'daily') {
      const daily = reservation as any;
      return {
        start: daily.eventDate,
        end: daily.eventDate // Günlük kiralama tek gün
      };
    }
    return null;
  };

  const formatTime = (reservation: Reservation): string => {
    if (reservation.type === 'slot') {
      const slot = reservation as SlotReservation;
      return `${slot.startTime} - ${slot.endTime}`;
    }
    if ('startTime' in reservation && 'endTime' in reservation) {
      return `${(reservation as any).startTime} - ${(reservation as any).endTime}`;
    }
    if ('deliveryTime' in reservation) {
      return (reservation as any).deliveryTime;
    }
    return '-';
  };

  const getReservationTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      slot: 'Randevu',
      daily: 'Günlük Kiralama',
      nightly: 'Konaklama',
      project: 'Proje/Organizasyon',
      order: 'Sipariş'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Pending Reservations */}
      {pendingReservations.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Clock size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-[var(--chrome-white)]">
                Onay Bekleyen Rezervasyonlar
              </h3>
              <p className="text-xs text-[var(--muted-lead)]">
                {pendingReservations.length} rezervasyon onay bekliyor
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pendingReservations.map((reservation, index) => (
              <motion.div
                key={reservation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 backdrop-blur-xl p-5 hover:border-amber-500/40 transition-all duration-300 group"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
                          <User size={18} className="text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-heading font-bold text-base text-[var(--chrome-white)] truncate">
                            {reservation.userName}
                          </h4>
                          <p className="font-mono text-xs text-[var(--silver-frost)]">
                            {reservation.userPhone}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
                          {getReservationTypeLabel(reservation.type)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={16} className="text-cyan-400 flex-shrink-0" />
                      {formatDateRange(reservation) ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[var(--chrome-white)]">
                            {formatDateRange(reservation)!.start}
                          </span>
                          <span className="text-[var(--muted-lead)]">→</span>
                          <span className="font-mono text-[var(--chrome-white)]">
                            {formatDateRange(reservation)!.end}
                          </span>
                          {formatDateRange(reservation)!.nights && (
                            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold">
                              {formatDateRange(reservation)!.nights} gece
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="font-mono text-[var(--chrome-white)]">
                          {formatDate(reservation)}
                        </span>
                      )}
                    </div>
                    {formatTime(reservation) !== '-' && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock size={16} className="text-cyan-400 flex-shrink-0" />
                        <span className="font-mono text-[var(--chrome-white)]">
                          {formatTime(reservation)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <DollarSign size={18} className="text-emerald-400" strokeWidth={2.5} />
                      <span className="font-mono font-bold text-xl text-emerald-400">
                        {reservation.pricing.totalAmount.toLocaleString('tr-TR')} ₺
                      </span>
                    </div>
                    {reservation.pricing.depositRequired && (
                      <span className="text-xs text-emerald-300/80">
                        Depozito: {reservation.pricing.depositAmount.toLocaleString('tr-TR')} ₺
                      </span>
                    )}
                  </div>

                  {/* Services/Items */}
                  {reservation.type === 'slot' && (
                    <div className="flex flex-wrap gap-2">
                      {(reservation as SlotReservation).services.map((service) => (
                        <span
                          key={service.id}
                          className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 font-heading font-semibold text-xs text-purple-300">
                          {service.name} • {service.price} ₺
                        </span>
                      ))}
                    </div>
                  )}

                  {reservation.notes && (
                    <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                      <p className="font-body text-sm text-blue-300 italic">
                        💬 "{reservation.notes}"
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleViewDetails(reservation)}
                      className="flex-1 h-12 rounded-2xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] hover:border-cyan-500/30 text-cyan-400 font-heading font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      <Eye size={18} strokeWidth={2.5} />
                      Detay
                    </button>
                    <button
                      onClick={() => handleApprove(reservation.id)}
                      disabled={loading}
                      className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg hover:shadow-emerald-500/30 text-white font-heading font-bold text-sm transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      <Check size={18} strokeWidth={2.5} />
                      Onayla
                    </button>
                    <button
                      onClick={() => {
                        setSelectedReservation(reservation);
                        setShowCancelDialog(true);
                      }}
                      disabled={loading}
                      className="h-12 px-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 font-heading font-bold text-sm transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      <X size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmed Reservations */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Check size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg text-[var(--chrome-white)]">
              Onaylanmış Rezervasyonlar
            </h3>
            <p className="text-xs text-[var(--muted-lead)]">
              {confirmedReservations.length} aktif rezervasyon
            </p>
          </div>
        </div>

        {confirmedReservations.length === 0 ? (
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-emerald-400" />
            </div>
            <p className="font-heading font-semibold text-[var(--chrome-white)] mb-1">
              Onaylanmış rezervasyon yok
            </p>
            <p className="font-body text-sm text-[var(--muted-lead)]">
              Bekleyen rezervasyonları onaylayın
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {confirmedReservations.map((reservation, index) => (
              <motion.div
                key={reservation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleViewDetails(reservation)}
                className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-5 hover:border-emerald-500/30 transition-all duration-300 cursor-pointer group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-heading font-bold text-base text-[var(--chrome-white)]">
                          {reservation.userName}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge status={reservation.status as any} />
                        <span className="px-2 py-0.5 rounded-full bg-white/5 text-[var(--muted-lead)] text-xs font-mono">
                          {getReservationTypeLabel(reservation.type)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReservation(reservation);
                          setShowCancelDialog(true);
                        }}
                        className="w-10 h-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 flex items-center justify-center transition-all duration-200"
                        title="İptal Et"
                      >
                        <X size={18} className="text-red-400" strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(reservation);
                        }}
                        className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                        title="Detay"
                      >
                        <Eye size={18} className="text-[var(--muted-lead)]" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-mono text-[var(--silver-frost)]">
                      {formatDateRange(reservation) ? (
                        <>
                          {formatDateRange(reservation)!.start} → {formatDateRange(reservation)!.end}
                          {formatDateRange(reservation)!.nights && (
                            <span className="ml-2 text-cyan-400">
                              ({formatDateRange(reservation)!.nights} gece)
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          {formatDate(reservation)}
                          {formatTime(reservation) !== '-' && ` • ${formatTime(reservation)}`}
                        </>
                      )}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-emerald-400" />
                    <span className="font-mono font-bold text-lg text-emerald-400">
                      {reservation.pricing.totalAmount.toLocaleString('tr-TR')} ₺
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal - Portal */}
      {showDetailModal && selectedReservation && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-xl"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowDetailModal(false);
                setSelectedReservation(null);
              }
            }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed inset-x-0 bottom-0 sm:absolute sm:inset-4 sm:top-auto sm:bottom-auto sm:left-1/2 sm:-translate-x-1/2 sm:max-w-2xl sm:my-auto max-h-[90vh] bg-[var(--slate-surface)] rounded-t-3xl sm:rounded-3xl border-t border-white/[0.08] sm:border shadow-2xl flex flex-col"
            >
              {/* Sticky Header */}
              <div className="sticky top-0 bg-gradient-to-b from-[var(--slate-surface)] to-[var(--slate-surface)]/95 backdrop-blur-xl border-b border-white/[0.08] p-4 sm:p-6 z-10 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading text-lg sm:text-xl font-bold text-[var(--chrome-white)] truncate">
                      {selectedReservation.userName}
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--muted-lead)] mt-0.5">
                      ID: {selectedReservation.id.slice(0, 8)}...
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedReservation(null);
                    }}
                    className="w-10 h-10 rounded-2xl bg-white/[0.05] hover:bg-white/[0.08] flex items-center justify-center transition-colors flex-shrink-0 ml-3"
                  >
                    <X size={20} className="text-[var(--muted-lead)]" />
                  </button>
                </div>
                
                {/* Status Badges */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <StatusBadge status={selectedReservation.status as any} />
                  <span className="px-3 py-1 rounded-full bg-[var(--liquid-chrome)]/10 text-[var(--liquid-chrome)] text-xs font-bold uppercase tracking-wider">
                    {getReservationTypeLabel(selectedReservation.type)}
                  </span>
                </div>
              </div>

              {/* Scrollable Content */}
              <div 
                ref={modalContentRef} 
                className="overflow-y-scroll p-4 sm:p-6 space-y-4"
                style={{ 
                  flex: '1 1 0%',
                  minHeight: 0,
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {/* Customer Info - Compact */}
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User size={16} className="text-purple-400" />
                    <h4 className="font-heading font-bold text-sm text-[var(--chrome-white)]">
                      Müşteri Bilgileri
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-[var(--muted-lead)] text-xs mb-1">Telefon</p>
                      <p className="font-mono text-[var(--chrome-white)]">{selectedReservation.userPhone}</p>
                    </div>
                    <div>
                      <p className="text-[var(--muted-lead)] text-xs mb-1">E-posta</p>
                      <p className="font-mono text-[var(--chrome-white)] text-xs truncate">{selectedReservation.userEmail}</p>
                    </div>
                  </div>
                </div>

                {/* Date & Time - Compact */}
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar size={16} className="text-cyan-400" />
                    <h4 className="font-heading font-bold text-sm text-[var(--chrome-white)]">
                      Tarih ve Saat
                    </h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    {formatDateRange(selectedReservation) ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-[var(--muted-lead)]">
                            {selectedReservation.type === 'nightly' ? 'Giriş' : 'Başlangıç'}
                          </span>
                          <span className="font-mono font-semibold text-[var(--chrome-white)]">
                            {formatDateRange(selectedReservation)!.start}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--muted-lead)]">
                            {selectedReservation.type === 'nightly' ? 'Çıkış' : 'Bitiş'}
                          </span>
                          <span className="font-mono font-semibold text-[var(--chrome-white)]">
                            {formatDateRange(selectedReservation)!.end}
                          </span>
                        </div>
                        {formatDateRange(selectedReservation)!.nights && (
                          <div className="pt-2 border-t border-white/[0.08]">
                            <span className="font-mono font-bold text-cyan-400">
                              {formatDateRange(selectedReservation)!.nights} Gece
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span className="text-[var(--muted-lead)]">Tarih</span>
                          <span className="font-mono font-semibold text-[var(--chrome-white)]">
                            {formatDate(selectedReservation)}
                          </span>
                        </div>
                        {formatTime(selectedReservation) !== '-' && (
                          <div className="flex justify-between">
                            <span className="text-[var(--muted-lead)]">Saat</span>
                            <span className="font-mono font-semibold text-[var(--chrome-white)]">
                              {formatTime(selectedReservation)}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  {/* Ek Bilgiler */}
                  {selectedReservation.type === 'nightly' && (
                    <div className="mt-3 pt-3 border-t border-white/[0.08] grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-[var(--muted-lead)]">Oda</p>
                        <p className="font-semibold text-[var(--chrome-white)]">
                          {(selectedReservation as any).roomType} ({(selectedReservation as any).roomCount})
                        </p>
                      </div>
                      <div>
                        <p className="text-[var(--muted-lead)]">Misafir</p>
                        <p className="font-semibold text-[var(--chrome-white)]">
                          {(selectedReservation as any).guests?.adults || 0}Y + {(selectedReservation as any).guests?.children || 0}Ç
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pricing - Compact */}
                <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign size={16} className="text-emerald-400" />
                    <h4 className="font-heading font-bold text-sm text-emerald-400">
                      Fiyat Bilgileri
                    </h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-emerald-300/80">Temel Fiyat</span>
                      <span className="font-mono text-emerald-300">
                        {selectedReservation.pricing.basePrice.toLocaleString('tr-TR')} ₺
                      </span>
                    </div>
                    {selectedReservation.pricing.extrasTotal > 0 && (
                      <div className="flex justify-between">
                        <span className="text-emerald-300/80">Ekstralar</span>
                        <span className="font-mono text-emerald-300">
                          {selectedReservation.pricing.extrasTotal.toLocaleString('tr-TR')} ₺
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-emerald-500/20">
                      <span className="font-bold text-white">Toplam</span>
                      <span className="font-mono font-bold text-xl text-white">
                        {selectedReservation.pricing.totalAmount.toLocaleString('tr-TR')} ₺
                      </span>
                    </div>
                    {selectedReservation.pricing.depositRequired && (
                      <div className="mt-2 p-2 rounded-xl bg-amber-500/20 border border-amber-500/30">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-amber-300 font-semibold">Depozito</span>
                          <span className="font-mono font-bold text-amber-300">
                            {selectedReservation.pricing.depositAmount.toLocaleString('tr-TR')} ₺
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Services - Compact */}
                {selectedReservation.type === 'slot' && (
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText size={16} className="text-purple-400" />
                      <h4 className="font-heading font-bold text-sm text-[var(--chrome-white)]">
                        Hizmetler
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {(selectedReservation as SlotReservation).services.map((service) => (
                        <div
                          key={service.id}
                          className="flex justify-between items-center p-2 rounded-xl bg-white/5 text-sm"
                        >
                          <span className="font-semibold text-[var(--chrome-white)]">{service.name}</span>
                          <span className="font-mono font-semibold text-[var(--chrome-white)]">
                            {service.price.toLocaleString('tr-TR')} ₺
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedReservation.notes && (
                  <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText size={16} className="text-blue-400" />
                      <h4 className="font-heading font-bold text-sm text-blue-400">
                        Müşteri Notu
                      </h4>
                    </div>
                    <p className="text-sm text-blue-300 italic">
                      "{selectedReservation.notes}"
                    </p>
                  </div>
                )}
              </div>

              {/* Sticky Footer Actions */}
              {selectedReservation.status === 'pending' && (
                <div className="sticky bottom-0 bg-gradient-to-t from-[var(--slate-surface)] to-[var(--slate-surface)]/95 backdrop-blur-xl border-t border-white/[0.08] p-4 sm:p-6 flex-shrink-0">
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        setShowCancelDialog(true);
                      }}
                      disabled={loading}
                      className="flex-1 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-heading font-bold hover:bg-red-500/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                      Reddet
                    </button>
                    <button
                      onClick={() => handleApprove(selectedReservation.id)}
                      disabled={loading}
                      className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-heading font-bold hover:shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {loading ? 'Onaylanıyor...' : 'Onayla'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Cancel Dialog */}
      {showCancelDialog && selectedReservation && (
        <CancelAppointmentDialog
          isOpen={true}
          onClose={() => {
            setShowCancelDialog(false);
            setSelectedReservation(null);
          }}
          onConfirm={handleReject}
          appointmentId={selectedReservation.id}
          cancelledBy="salon"
        />
      )}
    </div>
  );
}
