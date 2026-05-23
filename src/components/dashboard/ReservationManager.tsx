import { useState } from 'react';
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
import type { Reservation, SlotReservation } from '@/types';

interface ReservationManagerProps {
  reservations: Reservation[];
  onRefresh: () => void;
}

export function ReservationManager({ reservations, onRefresh }: ReservationManagerProps) {
  const [loading, setLoading] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const { addToast } = useUIStore();

  const pendingReservations = reservations.filter(r => r.status === 'pending');
  const confirmedReservations = reservations.filter(r => 
    r.status === 'confirmed' || r.status === 'deposit_paid' || r.status === 'fully_paid'
  );

  const handleViewDetails = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowDetailModal(true);
    document.body.style.overflow = 'hidden';
  };

  const handleApprove = async (reservationId: string) => {
    setLoading(true);
    try {
      await reservationService.confirmReservation(reservationId);
      soundService.playAppointmentReceived();
      addToast('Rezervasyon onaylandı', 'success');
      setShowDetailModal(false);
      setSelectedReservation(null);
      document.body.style.overflow = '';
      onRefresh();
    } catch (error: any) {
      console.error('Error approving reservation:', error);
      addToast(error.message || 'Rezervasyon onaylanamadı', 'error');
    }
    setLoading(false);
  };

  const handleReject = async () => {
    if (!selectedReservation || !rejectReason.trim()) {
      addToast('Lütfen iptal nedeni girin', 'warning');
      return;
    }

    setLoading(true);
    try {
      await reservationService.cancelReservation(
        selectedReservation.id,
        'business',
        rejectReason
      );
      soundService.playAppointmentCancelled();
      addToast('Rezervasyon reddedildi', 'success');
      setShowRejectDialog(false);
      setShowDetailModal(false);
      setSelectedReservation(null);
      setRejectReason('');
      document.body.style.overflow = '';
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-lg text-[var(--chrome-white)]">
              Onay Bekleyen Rezervasyonlar
              <span className="ml-2 px-2 py-0.5 rounded-full bg-[var(--warning)]/20 text-[var(--warning)] text-xs font-mono">
                {pendingReservations.length}
              </span>
            </h3>
          </div>

          <div className="space-y-3">
            {pendingReservations.map((reservation) => (
              <motion.div
                key={reservation.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="obsidian-card p-3 sm:p-4"
              >
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                  <div className="flex-1 w-full min-w-0">
                    {/* Customer Info */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <User size={14} className="text-[var(--muted-lead)] flex-shrink-0" />
                      <span className="font-heading font-semibold text-sm sm:text-base text-[var(--chrome-white)] truncate">
                        {reservation.userName}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[var(--liquid-chrome)]/10 text-[var(--liquid-chrome)] text-[10px] sm:text-xs font-mono whitespace-nowrap">
                        {getReservationTypeLabel(reservation.type)}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Phone size={14} className="text-[var(--muted-lead)] flex-shrink-0" />
                      <span className="font-body text-xs sm:text-sm text-[var(--silver-frost)]">
                        {reservation.userPhone}
                      </span>
                    </div>

                    {/* Date & Time */}
                    <div className="flex flex-wrap items-center gap-2 mb-2 text-xs sm:text-sm">
                      <Calendar size={14} className="text-[var(--muted-lead)] flex-shrink-0" />
                      {formatDateRange(reservation) ? (
                        <>
                          <span className="font-mono text-[var(--silver-frost)]">
                            {formatDateRange(reservation)!.start}
                          </span>
                          <span className="text-[var(--muted-lead)]">→</span>
                          <span className="font-mono text-[var(--silver-frost)]">
                            {formatDateRange(reservation)!.end}
                          </span>
                          {formatDateRange(reservation)!.nights && (
                            <span className="px-2 py-0.5 rounded-full bg-[var(--liquid-chrome)]/10 text-[var(--liquid-chrome)] text-[10px] whitespace-nowrap">
                              {formatDateRange(reservation)!.nights} gece
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="font-mono text-[var(--silver-frost)]">
                          {formatDate(reservation)}
                        </span>
                      )}
                      {formatTime(reservation) !== '-' && (
                        <>
                          <Clock size={14} className="text-[var(--muted-lead)] flex-shrink-0" />
                          <span className="font-mono text-[var(--silver-frost)]">
                            {formatTime(reservation)}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Price */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <DollarSign size={14} className="text-[var(--success)] flex-shrink-0" />
                      <span className="font-mono font-bold text-base sm:text-lg text-[var(--success)]">
                        {reservation.pricing.totalAmount.toLocaleString('tr-TR')} TL
                      </span>
                      {reservation.pricing.depositRequired && (
                        <span className="text-[10px] sm:text-xs text-[var(--muted-lead)]">
                          (Depozito: {reservation.pricing.depositAmount.toLocaleString('tr-TR')} TL)
                        </span>
                      )}
                    </div>

                    {/* Services/Items */}
                    {reservation.type === 'slot' && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(reservation as SlotReservation).services.map((service) => (
                          <span
                            key={service.id}
                            className="px-2 py-0.5 rounded-full bg-white/5 font-body text-[10px] sm:text-xs text-[var(--silver-frost)] whitespace-nowrap">
                            {service.name} - {service.price} TL
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Konaklama Bilgileri */}
                    {reservation.type === 'nightly' && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="px-2 py-0.5 rounded-full bg-white/5 font-body text-[10px] sm:text-xs text-[var(--silver-frost)] whitespace-nowrap">
                          {(reservation as any).roomType} - {(reservation as any).roomCount} oda
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-white/5 font-body text-[10px] sm:text-xs text-[var(--silver-frost)] whitespace-nowrap">
                          {(reservation as any).guests?.adults || 0} yetişkin, {(reservation as any).guests?.children || 0} çocuk
                        </span>
                      </div>
                    )}

                    {/* Günlük Kiralama Bilgileri */}
                    {reservation.type === 'daily' && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="px-2 py-0.5 rounded-full bg-white/5 font-body text-[10px] sm:text-xs text-[var(--silver-frost)] whitespace-nowrap">
                          {(reservation as any).capacity} kişi
                        </span>
                        {(reservation as any).package && (
                          <span className="px-2 py-0.5 rounded-full bg-white/5 font-body text-[10px] sm:text-xs text-[var(--silver-frost)] whitespace-nowrap">
                            {(reservation as any).package.name}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Proje Bilgileri */}
                    {reservation.type === 'project' && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="px-2 py-0.5 rounded-full bg-white/5 font-body text-[10px] sm:text-xs text-[var(--silver-frost)] whitespace-nowrap">
                          {(reservation as any).guestCount} misafir
                        </span>
                        {(reservation as any).package && (
                          <span className="px-2 py-0.5 rounded-full bg-white/5 font-body text-[10px] sm:text-xs text-[var(--silver-frost)] whitespace-nowrap">
                            {(reservation as any).package.name}
                          </span>
                        )}
                      </div>
                    )}

                    {reservation.notes && (
                      <p className="mt-2 font-body text-xs sm:text-sm text-[var(--muted-lead)] italic line-clamp-2">
                        Not: "{reservation.notes}"
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleViewDetails(reservation)}
                      className="flex-1 sm:flex-none p-2 rounded-full bg-[var(--liquid-chrome)]/10 border-2 border-[var(--liquid-chrome)]/30 text-[var(--liquid-chrome)] hover:bg-[var(--liquid-chrome)]/20 hover:border-[var(--liquid-chrome)] transition-all active:scale-95"
                      title="Detayları Gör"
                    >
                      <Eye size={16} strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => handleApprove(reservation.id)}
                      disabled={loading}
                      className="flex-1 sm:flex-none p-2 rounded-full bg-[var(--success)]/10 border-2 border-[var(--success)]/30 text-[var(--success)] hover:bg-[var(--success)]/20 hover:border-[var(--success)] transition-all active:scale-95 disabled:opacity-50"
                      title="Onayla"
                    >
                      <Check size={16} strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedReservation(reservation);
                        setShowRejectDialog(true);
                      }}
                      disabled={loading}
                      className="flex-1 sm:flex-none p-2 rounded-full bg-[var(--error)]/10 border-2 border-[var(--error)]/30 text-[var(--error)] hover:bg-[var(--error)]/20 hover:border-[var(--error)] transition-all active:scale-95 disabled:opacity-50"
                      title="Reddet"
                    >
                      <X size={16} strokeWidth={2.5} />
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-lg text-[var(--chrome-white)]">
            Onaylanmış Rezervasyonlar
          </h3>
        </div>

        {confirmedReservations.length === 0 ? (
          <div className="obsidian-card p-6 text-center">
            <p className="font-body text-[var(--muted-lead)]">Onaylanmış rezervasyon yok</p>
          </div>
        ) : (
          <div className="space-y-3">
            {confirmedReservations.map((reservation) => (
              <div
                key={reservation.id}
                className="obsidian-card p-4 hover:border-[var(--liquid-chrome)] transition-colors cursor-pointer"
                onClick={() => handleViewDetails(reservation)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-heading font-semibold text-[var(--chrome-white)]">
                        {reservation.userName}
                      </span>
                      <StatusBadge status={reservation.status as any} />
                      <span className="px-2 py-0.5 rounded-full bg-white/5 text-[var(--muted-lead)] text-xs font-mono">
                        {getReservationTypeLabel(reservation.type)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-mono text-[var(--silver-frost)]">
                        {formatDateRange(reservation) ? (
                          <>
                            {formatDateRange(reservation)!.start} → {formatDateRange(reservation)!.end}
                            {formatDateRange(reservation)!.nights && (
                              <span className="ml-2 text-[var(--liquid-chrome)]">
                                ({formatDateRange(reservation)!.nights} gece)
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            {formatDate(reservation)}
                            {formatTime(reservation) !== '-' && ` - ${formatTime(reservation)}`}
                          </>
                        )}
                      </span>
                      <span className="font-mono font-semibold text-[var(--success)]">
                        {reservation.pricing.totalAmount.toLocaleString('tr-TR')} TL
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(reservation);
                    }}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <Eye size={16} className="text-[var(--muted-lead)]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedReservation && (
          <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black backdrop-blur-xl"
            onClick={(e) => {
              // Sadece backdrop'a tıklandığında kapat
              if (e.target === e.currentTarget) {
                setShowDetailModal(false);
                setSelectedReservation(null);
                document.body.style.overflow = '';
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[var(--slate-surface)] rounded-2xl border border-[var(--obsidian-rim)] shadow-2xl"
            >
              {/* Header */}
              <div className="sticky top-0 bg-[var(--slate-surface)]/95 backdrop-blur-xl border-b border-[var(--obsidian-rim)] p-6 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading text-xl font-bold text-[var(--chrome-white)]">
                      Rezervasyon Detayları
                    </h3>
                    <p className="text-sm text-[var(--muted-lead)] mt-1">
                      ID: {selectedReservation.id.slice(0, 8)}...
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedReservation(null);
                      document.body.style.overflow = '';
                    }}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <X size={20} className="text-[var(--muted-lead)]" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Status */}
                <div className="flex items-center gap-3">
                  <StatusBadge status={selectedReservation.status as any} />
                  <span className="px-3 py-1 rounded-full bg-[var(--liquid-chrome)]/10 text-[var(--liquid-chrome)] text-sm font-mono">
                    {getReservationTypeLabel(selectedReservation.type)}
                  </span>
                </div>

                {/* Customer Info */}
                <div className="obsidian-card p-4 space-y-3">
                  <h4 className="font-heading font-semibold text-[var(--chrome-white)] flex items-center gap-2">
                    <User size={18} />
                    Müşteri Bilgileri
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-[var(--muted-lead)]">Ad Soyad</p>
                      <p className="font-semibold text-[var(--chrome-white)]">{selectedReservation.userName}</p>
                    </div>
                    <div>
                      <p className="text-[var(--muted-lead)]">Telefon</p>
                      <p className="font-mono text-[var(--chrome-white)]">{selectedReservation.userPhone}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-[var(--muted-lead)]">E-posta</p>
                      <p className="font-mono text-[var(--chrome-white)]">{selectedReservation.userEmail}</p>
                    </div>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="obsidian-card p-4 space-y-3">
                  <h4 className="font-heading font-semibold text-[var(--chrome-white)] flex items-center gap-2">
                    <Calendar size={18} />
                    Tarih ve Saat
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {formatDateRange(selectedReservation) ? (
                      <>
                        <div>
                          <p className="text-[var(--muted-lead)]">
                            {selectedReservation.type === 'nightly' ? 'Giriş Tarihi' : 'Başlangıç'}
                          </p>
                          <p className="font-mono font-semibold text-[var(--chrome-white)]">
                            {formatDateRange(selectedReservation)!.start}
                          </p>
                        </div>
                        <div>
                          <p className="text-[var(--muted-lead)]">
                            {selectedReservation.type === 'nightly' ? 'Çıkış Tarihi' : 'Bitiş'}
                          </p>
                          <p className="font-mono font-semibold text-[var(--chrome-white)]">
                            {formatDateRange(selectedReservation)!.end}
                          </p>
                        </div>
                        {formatDateRange(selectedReservation)!.nights && (
                          <div className="sm:col-span-2">
                            <p className="text-[var(--muted-lead)]">Konaklama Süresi</p>
                            <p className="font-mono font-semibold text-[var(--liquid-chrome)]">
                              {formatDateRange(selectedReservation)!.nights} Gece
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div>
                        <p className="text-[var(--muted-lead)]">Tarih</p>
                        <p className="font-mono font-semibold text-[var(--chrome-white)]">
                          {formatDate(selectedReservation)}
                        </p>
                      </div>
                    )}
                    {formatTime(selectedReservation) !== '-' && (
                      <div>
                        <p className="text-[var(--muted-lead)]">Saat</p>
                        <p className="font-mono font-semibold text-[var(--chrome-white)]">
                          {formatTime(selectedReservation)}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Ek Bilgiler - Misafir Sayısı, Oda Tipi vb. */}
                  {selectedReservation.type === 'nightly' && (
                    <div className="mt-4 pt-4 border-t border-[var(--obsidian-rim)] space-y-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[var(--muted-lead)] text-xs">Oda Tipi</p>
                          <p className="font-semibold text-[var(--chrome-white)]">
                            {(selectedReservation as any).roomType}
                          </p>
                        </div>
                        <div>
                          <p className="text-[var(--muted-lead)] text-xs">Oda Sayısı</p>
                          <p className="font-semibold text-[var(--chrome-white)]">
                            {(selectedReservation as any).roomCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-[var(--muted-lead)] text-xs">Yetişkin</p>
                          <p className="font-semibold text-[var(--chrome-white)]">
                            {(selectedReservation as any).guests?.adults || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-[var(--muted-lead)] text-xs">Çocuk</p>
                          <p className="font-semibold text-[var(--chrome-white)]">
                            {(selectedReservation as any).guests?.children || 0}
                          </p>
                        </div>
                      </div>
                      {(selectedReservation as any).mealPlan && (
                        <div className="mt-2">
                          <p className="text-[var(--muted-lead)] text-xs">Yemek Planı</p>
                          <p className="font-semibold text-[var(--chrome-white)] capitalize">
                            {(selectedReservation as any).mealPlan.replace('_', ' ')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {selectedReservation.type === 'daily' && (
                    <div className="mt-4 pt-4 border-t border-[var(--obsidian-rim)] space-y-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[var(--muted-lead)] text-xs">Etkinlik Tipi</p>
                          <p className="font-semibold text-[var(--chrome-white)] capitalize">
                            {(selectedReservation as any).eventType?.replace('_', ' ') || '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[var(--muted-lead)] text-xs">Kapasite</p>
                          <p className="font-semibold text-[var(--chrome-white)]">
                            {(selectedReservation as any).capacity} kişi
                          </p>
                        </div>
                      </div>
                      {(selectedReservation as any).package && (
                        <div className="mt-2">
                          <p className="text-[var(--muted-lead)] text-xs">Paket</p>
                          <p className="font-semibold text-[var(--chrome-white)]">
                            {(selectedReservation as any).package.name}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {selectedReservation.type === 'project' && (
                    <div className="mt-4 pt-4 border-t border-[var(--obsidian-rim)] space-y-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[var(--muted-lead)] text-xs">Etkinlik Tipi</p>
                          <p className="font-semibold text-[var(--chrome-white)] capitalize">
                            {(selectedReservation as any).eventType?.replace('_', ' ') || '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[var(--muted-lead)] text-xs">Misafir Sayısı</p>
                          <p className="font-semibold text-[var(--chrome-white)]">
                            {(selectedReservation as any).guestCount} kişi
                          </p>
                        </div>
                      </div>
                      {(selectedReservation as any).venue && (
                        <div className="mt-2">
                          <p className="text-[var(--muted-lead)] text-xs">Mekan</p>
                          <p className="font-semibold text-[var(--chrome-white)]">
                            {(selectedReservation as any).venue}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Pricing */}
                <div className="obsidian-card p-4 space-y-3">
                  <h4 className="font-heading font-semibold text-[var(--chrome-white)] flex items-center gap-2">
                    <DollarSign size={18} />
                    Fiyat Bilgileri
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--muted-lead)]">Temel Fiyat</span>
                      <span className="font-mono text-[var(--chrome-white)]">
                        {selectedReservation.pricing.basePrice.toLocaleString('tr-TR')} TL
                      </span>
                    </div>
                    {selectedReservation.pricing.extrasTotal > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[var(--muted-lead)]">Ekstralar</span>
                        <span className="font-mono text-[var(--chrome-white)]">
                          {selectedReservation.pricing.extrasTotal.toLocaleString('tr-TR')} TL
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-[var(--obsidian-rim)]">
                      <span className="font-semibold text-[var(--chrome-white)]">Toplam</span>
                      <span className="font-mono font-bold text-lg text-[var(--success)]">
                        {selectedReservation.pricing.totalAmount.toLocaleString('tr-TR')} TL
                      </span>
                    </div>
                    {selectedReservation.pricing.depositRequired && (
                      <div className="mt-3 p-3 rounded-xl bg-[var(--warning)]/10 border border-[var(--warning)]/30">
                        <div className="flex justify-between items-center">
                          <span className="text-[var(--warning)] font-semibold">Depozito Gerekli</span>
                          <span className="font-mono font-bold text-[var(--warning)]">
                            {selectedReservation.pricing.depositAmount.toLocaleString('tr-TR')} TL
                            <span className="text-xs ml-1">(%{selectedReservation.pricing.depositPercentage})</span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Services/Items */}
                {selectedReservation.type === 'slot' && (
                  <div className="obsidian-card p-4 space-y-3">
                    <h4 className="font-heading font-semibold text-[var(--chrome-white)] flex items-center gap-2">
                      <FileText size={18} />
                      Hizmetler
                    </h4>
                    <div className="space-y-2">
                      {(selectedReservation as SlotReservation).services.map((service) => (
                        <div
                          key={service.id}
                          className="flex justify-between items-center p-3 rounded-xl bg-white/5"
                        >
                          <div>
                            <p className="font-semibold text-[var(--chrome-white)]">{service.name}</p>
                          </div>
                          <span className="font-mono font-semibold text-[var(--chrome-white)]">
                            {service.price.toLocaleString('tr-TR')} TL
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ekstralar - Konaklama & Günlük Kiralama */}
                {(selectedReservation.type === 'nightly' || selectedReservation.type === 'daily') && 
                 (selectedReservation as any).extras?.length > 0 && (
                  <div className="obsidian-card p-4 space-y-3">
                    <h4 className="font-heading font-semibold text-[var(--chrome-white)] flex items-center gap-2">
                      <Plus size={18} />
                      Ekstra Hizmetler
                    </h4>
                    <div className="space-y-2">
                      {(selectedReservation as any).extras.map((extra: any, index: number) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-3 rounded-xl bg-white/5"
                        >
                          <div>
                            <p className="font-semibold text-[var(--chrome-white)]">{extra.name}</p>
                            {extra.quantity && (
                              <p className="text-xs text-[var(--muted-lead)]">Miktar: {extra.quantity}</p>
                            )}
                            {extra.date && (
                              <p className="text-xs text-[var(--muted-lead)]">Tarih: {extra.date}</p>
                            )}
                          </div>
                          <span className="font-mono font-semibold text-[var(--chrome-white)]">
                            {extra.price.toLocaleString('tr-TR')} TL
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sipariş İçeriği */}
                {selectedReservation.type === 'order' && (selectedReservation as any).items?.length > 0 && (
                  <div className="obsidian-card p-4 space-y-3">
                    <h4 className="font-heading font-semibold text-[var(--chrome-white)] flex items-center gap-2">
                      <FileText size={18} />
                      Sipariş İçeriği
                    </h4>
                    <div className="space-y-2">
                      {(selectedReservation as any).items.map((item: any, index: number) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-3 rounded-xl bg-white/5"
                        >
                          <div>
                            <p className="font-semibold text-[var(--chrome-white)]">{item.name}</p>
                            <p className="text-xs text-[var(--muted-lead)]">
                              {item.quantity} {item.unit}
                            </p>
                            {item.customization && (
                              <p className="text-xs text-[var(--muted-lead)] italic mt-1">
                                {item.customization}
                              </p>
                            )}
                          </div>
                          <span className="font-mono font-semibold text-[var(--chrome-white)]">
                            {item.price.toLocaleString('tr-TR')} TL
                          </span>
                        </div>
                      ))}
                    </div>
                    {(selectedReservation as any).servingStyle && (
                      <div className="mt-3 p-3 rounded-xl bg-white/5">
                        <p className="text-xs text-[var(--muted-lead)]">Servis Şekli</p>
                        <p className="font-semibold text-[var(--chrome-white)] capitalize">
                          {(selectedReservation as any).servingStyle.replace('_', ' ')}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Özel İstekler - Konaklama */}
                {selectedReservation.type === 'nightly' && (selectedReservation as any).specialRequests && (
                  <div className="obsidian-card p-4 space-y-2">
                    <h4 className="font-heading font-semibold text-[var(--chrome-white)] flex items-center gap-2">
                      <FileText size={18} />
                      Özel İstekler
                    </h4>
                    <p className="text-sm text-[var(--silver-frost)] italic">
                      "{(selectedReservation as any).specialRequests}"
                    </p>
                  </div>
                )}

                {/* Notes */}
                {selectedReservation.notes && (
                  <div className="obsidian-card p-4 space-y-2">
                    <h4 className="font-heading font-semibold text-[var(--chrome-white)] flex items-center gap-2">
                      <FileText size={18} />
                      Müşteri Notu
                    </h4>
                    <p className="text-sm text-[var(--silver-frost)] italic">
                      "{selectedReservation.notes}"
                    </p>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              {selectedReservation.status === 'pending' && (
                <div className="sticky bottom-0 bg-[var(--slate-surface)]/95 backdrop-blur-xl border-t border-[var(--obsidian-rim)] p-6">
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        setShowRejectDialog(true);
                      }}
                      disabled={loading}
                      className="flex-1 px-6 py-3 rounded-full bg-[var(--error)]/10 border-2 border-[var(--error)]/30 text-[var(--error)] font-heading font-semibold hover:bg-[var(--error)]/20 hover:border-[var(--error)] transition-all active:scale-95 disabled:opacity-50"
                    >
                      Reddet
                    </button>
                    <button
                      onClick={() => handleApprove(selectedReservation.id)}
                      disabled={loading}
                      className="flex-1 px-6 py-3 rounded-full bg-[var(--success)] text-white font-heading font-semibold hover:bg-[var(--success)]/90 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-[var(--success)]/30"
                    >
                      {loading ? 'Onaylanıyor...' : 'Onayla'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reject Dialog */}
      <AnimatePresence>
        {showRejectDialog && selectedReservation && (
          <div 
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
            onClick={(e) => {
              // Sadece backdrop'a tıklandığında kapat
              if (e.target === e.currentTarget) {
                setShowRejectDialog(false);
                setRejectReason('');
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[var(--slate-surface)] rounded-2xl border border-[var(--obsidian-rim)] shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[var(--error)]/10 flex items-center justify-center">
                  <AlertCircle size={24} className="text-[var(--error)]" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-[var(--chrome-white)]">
                    Rezervasyonu Reddet
                  </h3>
                  <p className="text-sm text-[var(--muted-lead)]">
                    {selectedReservation.userName}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--chrome-white)] mb-2">
                  İptal Nedeni *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Lütfen iptal nedenini açıklayın..."
                  className="w-full px-4 py-3 rounded-xl bg-[var(--slate-elevated)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] placeholder:text-[var(--muted-lead)] focus:outline-none focus:border-[var(--liquid-chrome)] transition-colors resize-none"
                  rows={4}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectDialog(false);
                    setRejectReason('');
                  }}
                  className="flex-1 px-4 py-2 rounded-full border border-[var(--border)] text-[var(--chrome-white)] hover:bg-white/5 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleReject}
                  disabled={loading || !rejectReason.trim()}
                  className="flex-1 px-4 py-2 rounded-full bg-[var(--error)] text-white font-semibold hover:bg-[var(--error)]/90 transition-all disabled:opacity-50"
                >
                  {loading ? 'Reddediliyor...' : 'Reddet'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
