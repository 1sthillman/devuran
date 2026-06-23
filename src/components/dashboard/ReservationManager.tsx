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
  Plus,
  Search,
  Mail,
  MessageCircle,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CopyButton } from '@/components/ui/CopyButton';
import { reservationService } from '@/services/reservationService';
import { soundService } from '@/services/soundService';
import { useUIStore } from '@/store/uiStore';
import { CancelAppointmentDialog } from '@/components/booking/CancelAppointmentDialog';
import { reservationToCalendarEvent, getDefaultCalendarAction } from '@/utils/calendarUtils';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'confirmed' | 'pending'>('all');
  const [showOperationsPanel, setShowOperationsPanel] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [editingReservation, setEditingReservation] = useState<string | null>(null);
  const [newTime, setNewTime] = useState<string>('');
  const [newDate, setNewDate] = useState<string>('');
  const [showCreateBlockModal, setShowCreateBlockModal] = useState(false);
  const [blockStartTime, setBlockStartTime] = useState<string>('09:00');
  const [blockEndTime, setBlockEndTime] = useState<string>('10:00');
  const [blockReason, setBlockReason] = useState<string>('');
  const [queueEntries, setQueueEntries] = useState<any[]>([]);
  const [selectedQueueEntry, setSelectedQueueEntry] = useState<any | null>(null);
  const [showQueueToAppointmentModal, setShowQueueToAppointmentModal] = useState(false);
  const [queueAppointmentTime, setQueueAppointmentTime] = useState<string>('09:00');
  const { addToast } = useUIStore();
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Modern Reservation Management Component - v2.0

  // Kopyalama fonksiyonu
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      addToast(`${label} kopyalandı`, 'success');
    }).catch(() => {
      addToast('Kopyalanamadı', 'error');
    });
  };

  // WhatsApp linki
  const getWhatsAppLink = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/90${cleanPhone}`;
  };

  // Google Maps linki
  const getGoogleMapsLink = (address: string, location?: { lat: number; lng: number }) => {
    if (location) {
      return `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  };

  // Rezervasyon tipi label fonksiyonu (arama için gerekli - önce tanımlanmalı)
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

  const formatDate = (reservation: Reservation): string => {
    if ('date' in reservation) return reservation.date;
    if ('eventDate' in reservation) return reservation.eventDate;
    if ('checkIn' in reservation) return reservation.checkIn;
    if ('deliveryDate' in reservation) return reservation.deliveryDate;
    return '';
  };

  // Arama ve filtreleme fonksiyonu
  const filteredReservations = reservations.filter(reservation => {
    // Önce search query kontrolü
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const searchableText = [
        reservation.id,
        reservation.userName,
        reservation.userPhone,
        reservation.userEmail,
        getReservationTypeLabel(reservation.type),
        formatDate(reservation),
        reservation.notes
      ].filter(Boolean).join(' ').toLowerCase();
      
      if (!searchableText.includes(query)) return false;
    }
    
    // Sonra filter kontrolü
    if (activeFilter === 'pending') {
      return reservation.status === 'pending';
    } else if (activeFilter === 'confirmed') {
      return reservation.status === 'confirmed' || reservation.status === 'deposit_paid' || reservation.status === 'fully_paid';
    }
    
    return true; // 'all' için tümünü göster
  });

  const pendingReservations = filteredReservations.filter(r => r.status === 'pending');
  const confirmedReservations = filteredReservations.filter(r => 
    r.status === 'confirmed' || r.status === 'deposit_paid' || r.status === 'fully_paid'
  );
  
  // Toplam sayıları hesapla (tüm rezervasyonlardan)
  const totalPending = reservations.filter(r => r.status === 'pending').length;
  const totalConfirmed = reservations.filter(r => 
    r.status === 'confirmed' || r.status === 'deposit_paid' || r.status === 'fully_paid'
  ).length;

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

  // Operasyon modalı açıldığında sıra verilerini yükle
  useEffect(() => {
    if (showOperationsPanel && reservations.length > 0) {
      loadQueueData();
    }
  }, [showOperationsPanel]);

  const loadQueueData = async () => {
    try {
      const businessId = reservations[0]?.businessId;
      if (!businessId) return;

      // appointmentsService'i import et ve queue'yu çek
      const { appointmentsService } = await import('@/services/firebaseService');
      const queue = await appointmentsService.getQueue(businessId);
      setQueueEntries(queue);
    } catch (error) {
      console.error('Queue loading error:', error);
    }
  };

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
      
      // ✅ EKRAN YENİLENMESİN - Operasyon modalını koru
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
      
      // ✅ EKRAN YENİLENMESİN - Operasyon modalını koru
      onRefresh();
    } catch (error: any) {
      console.error('Error rejecting reservation:', error);
      addToast(error.message || 'Rezervasyon reddedilemedi', 'error');
    }
    setLoading(false);
  };

  // Randevu tarih/saat güncelleme - EKRAN YENİLENMESİN!
  const handleUpdateDateTime = async (reservationId: string, newDate: string, newTime: string) => {
    setLoading(true);
    try {
      const reservation = reservations.find(r => r.id === reservationId);
      if (!reservation) {
        throw new Error('Rezervasyon bulunamadı');
      }

      // Güncelleme objesi hazırla
      const updates: any = {};
      
      // Tarih güncelleme (tüm tipler için)
      if (reservation.type === 'slot') {
        updates.date = newDate;
        if (newTime) {
          updates.startTime = newTime;
          // Duration'a göre endTime hesapla
          const duration = (reservation as SlotReservation).duration;
          const [hours, minutes] = newTime.split(':').map(Number);
          const totalMinutes = hours * 60 + minutes + duration;
          const endHours = Math.floor(totalMinutes / 60);
          const endMinutes = totalMinutes % 60;
          updates.endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
        }
      } else if (reservation.type === 'daily') {
        updates.eventDate = newDate;
        if (newTime && (reservation as any).startTime) {
          updates.startTime = newTime;
          // endTime varsa onu da güncelle (aynı duration ile)
          if ((reservation as any).endTime) {
            const currentStart = (reservation as any).startTime;
            const currentEnd = (reservation as any).endTime;
            const [startH, startM] = currentStart.split(':').map(Number);
            const [endH, endM] = currentEnd.split(':').map(Number);
            const duration = (endH * 60 + endM) - (startH * 60 + startM);
            
            const [newH, newM] = newTime.split(':').map(Number);
            const newEndMinutes = newH * 60 + newM + duration;
            const newEndH = Math.floor(newEndMinutes / 60);
            const newEndM = newEndMinutes % 60;
            updates.endTime = `${newEndH.toString().padStart(2, '0')}:${newEndM.toString().padStart(2, '0')}`;
          }
        }
      } else if (reservation.type === 'nightly') {
        updates.checkIn = newDate;
      } else if (reservation.type === 'project') {
        updates.eventDate = newDate;
      } else if (reservation.type === 'order') {
        updates.deliveryDate = newDate;
        if (newTime) {
          updates.deliveryTime = newTime;
        }
      }
      
      await reservationService.updateReservation(reservationId, updates);
      
      addToast('Randevu tarihi/saati güncellendi ✅', 'success');
      setEditingReservation(null);
      setNewTime('');
      setNewDate('');
      
      // ✅ EKRAN YENİLENMESİN - Sadece state'i güncelle
      onRefresh();
    } catch (error: any) {
      console.error('Error updating reservation:', error);
      addToast(error.message || 'Güncelleme başarısız ❌', 'error');
    }
    setLoading(false);
  };

  // Manuel saat bloklama (randevu oluşturma) - EKRAN YENİLENMESİN!
  const handleCreateBlock = async () => {
    setLoading(true);
    try {
      // Manuel "bloke" rezervasyon oluştur
      const blockReservation = {
        businessId: reservations[0]?.businessId,
        businessName: reservations[0]?.businessName,
        businessCategory: reservations[0]?.businessCategory,
        type: 'slot' as const,
        date: selectedDate,
        startTime: blockStartTime,
        endTime: blockEndTime,
        duration: calculateDuration(blockStartTime, blockEndTime),
        userId: 'system-block',
        userName: 'Blokeli Saat',
        userPhone: '-',
        userEmail: '-',
        status: 'confirmed' as const,
        notes: blockReason || 'İşletme tarafından bloke edildi',
        services: [{
          id: 'block',
          name: 'Blokeli Zaman',
          duration: calculateDuration(blockStartTime, blockEndTime),
          price: 0
        }],
        totalPrice: 0,
        pricing: {
          basePrice: 0,
          extrasTotal: 0,
          discountAmount: 0,
          taxAmount: 0,
          totalAmount: 0,
          depositRequired: false,
          depositAmount: 0,
          depositPercentage: 0,
          finalAmount: 0,
          currency: 'TRY' as const
        }
      };

      await reservationService.createReservation(blockReservation);
      
      addToast('Saat bloklandı - Müşteriler bu saati dolu görecek', 'success');
      setShowCreateBlockModal(false);
      setBlockStartTime('09:00');
      setBlockEndTime('10:00');
      setBlockReason('');
      
      // ✅ EKRAN YENİLENMESİN - Operasyon modalında kal
      onRefresh();
    } catch (error: any) {
      console.error('Error creating block:', error);
      addToast(error.message || 'Blok oluşturulamadı', 'error');
    }
    setLoading(false);
  };

  const calculateDuration = (start: string, end: string): number => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    return (endH * 60 + endM) - (startH * 60 + startM);
  };

  // Randevu silme (iptal etme)
  const handleDeleteReservation = async (reservationId: string) => {
    if (!confirm('Bu randevuyu tamamen silmek istediğinizden emin misiniz?')) {
      return;
    }

    setLoading(true);
    try {
      await reservationService.cancelReservation(
        reservationId,
        'business',
        'İşletme tarafından operasyondan silindi'
      );
      
      addToast('Randevu silindi', 'success');
      setEditingReservation(null);
      
      // ✅ EKRAN YENİLENMESİN
      onRefresh();
    } catch (error: any) {
      console.error('Error deleting reservation:', error);
      addToast(error.message || 'Silme başarısız', 'error');
    }
    setLoading(false);
  };

  // Sıradan randevuya dönüştürme
  const handleConvertQueueToAppointment = async () => {
    if (!selectedQueueEntry) return;

    setLoading(true);
    try {
      const { appointmentsService } = await import('@/services/firebaseService');
      
      // Sıradan randevuya dönüştür
      await appointmentsService.assignQueueToSlot(
        selectedQueueEntry.id,
        selectedDate,
        queueAppointmentTime,
        selectedQueueEntry.staffId || (reservations[0]?.type === 'slot' ? (reservations[0] as SlotReservation).staffId : undefined)
      );

      addToast('Müşteri randevuya eklendi', 'success');
      setShowQueueToAppointmentModal(false);
      setSelectedQueueEntry(null);
      setQueueAppointmentTime('09:00');
      
      // Queue ve rezervasyonları yenile
      await loadQueueData();
      onRefresh();
    } catch (error: any) {
      console.error('Queue to appointment error:', error);
      addToast(error.message || 'Randevuya dönüştürülemedi', 'error');
    }
    setLoading(false);
  };

  // Saat listesi oluştur
  const generateTimeSlots = (start = '00:00', end = '23:30', interval = 30) => {
    const slots: string[] = [];
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    
    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    
    while (currentMinutes <= endMinutes) {
      const hours = Math.floor(currentMinutes / 60);
      const minutes = currentMinutes % 60;
      slots.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
      currentMinutes += interval;
    }
    
    return slots;
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

  return (
    <div className="space-y-5">
      {/* Modern Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Calendar size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="font-heading font-bold text-xl text-[var(--chrome-white)]">
              Rezervasyon Yönetimi
            </h2>
            <p className="text-xs text-[var(--muted-lead)] mt-0.5">
              Tüm rezervasyonlarınızı buradan yönetin
            </p>
          </div>
        </div>
      </div>

      {/* Filtre Butonları - Modern Oval Cards - 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Tümü Card */}
        <button
          onClick={() => {
            setActiveFilter('all');
            setSearchQuery('');
          }}
          className={cn(
            "relative overflow-hidden rounded-3xl p-5 transition-all duration-200 text-left group",
            activeFilter === 'all'
              ? "bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50 shadow-xl shadow-purple-500/20"
              : "bg-white/[0.03] border-2 border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.05]"
          )}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className={cn(
                "text-xs font-bold uppercase tracking-wider",
                activeFilter === 'all' ? "text-purple-300" : "text-[var(--muted-lead)]"
              )}>
                TÜMÜ
              </span>
              {activeFilter === 'all' && (
                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 animate-pulse shadow-lg shadow-purple-400/50" />
              )}
            </div>
            <div className={cn(
              "text-4xl font-bold font-heading mb-2",
              activeFilter === 'all' 
                ? "bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent" 
                : "text-[var(--chrome-white)]"
            )}>
              {reservations.length}
            </div>
            <p className="text-xs text-[var(--muted-lead)]">
              Toplam rezervasyon
            </p>
          </div>
        </button>

        {/* Günlük Operasyonlar Card */}
        <button
          onClick={() => setShowOperationsPanel(true)}
          className="relative overflow-hidden rounded-3xl p-5 transition-all duration-200 text-left group bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-2 border-cyan-500/30 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/20"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                <Calendar size={16} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                OPERASYON
              </span>
            </div>
            <div className="text-2xl font-bold font-heading text-cyan-400 mb-2">
              Günlük
            </div>
            <p className="text-xs text-cyan-300/80">
              Tarih seç ve randevuları yönet
            </p>
          </div>
        </button>

        {/* Onaylanmış Card */}
        <button
          onClick={() => {
            setActiveFilter('confirmed');
            setSearchQuery('');
          }}
          className={cn(
            "relative overflow-hidden rounded-3xl p-5 transition-all duration-200 text-left group",
            activeFilter === 'confirmed'
              ? "bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/50 shadow-xl shadow-emerald-500/20"
              : "bg-white/[0.03] border-2 border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.05]"
          )}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className={cn(
                "text-xs font-bold uppercase tracking-wider",
                activeFilter === 'confirmed' ? "text-emerald-300" : "text-[var(--muted-lead)]"
              )}>
                ONAYLANMIŞ
              </span>
              {activeFilter === 'confirmed' && (
                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 animate-pulse shadow-lg shadow-emerald-400/50" />
              )}
            </div>
            <div className={cn(
              "text-4xl font-bold font-heading mb-2",
              activeFilter === 'confirmed' 
                ? "bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent" 
                : "text-[var(--chrome-white)]"
            )}>
              {totalConfirmed}
            </div>
            <p className="text-xs text-[var(--muted-lead)]">
              Aktif rezervasyon
            </p>
          </div>
        </button>

        {/* Bekleyen Card */}
        <button
          onClick={() => {
            setActiveFilter('pending');
            setSearchQuery('');
          }}
          className={cn(
            "relative overflow-hidden rounded-3xl p-5 transition-all duration-200 text-left group",
            activeFilter === 'pending'
              ? "bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-2 border-amber-500/50 shadow-xl shadow-amber-500/20"
              : "bg-white/[0.03] border-2 border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.05]"
          )}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className={cn(
                "text-xs font-bold uppercase tracking-wider",
                activeFilter === 'pending' ? "text-amber-300" : "text-[var(--muted-lead)]"
              )}>
                BEKLEYEN
              </span>
              {activeFilter === 'pending' && (
                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 animate-pulse shadow-lg shadow-amber-400/50" />
              )}
            </div>
            <div className={cn(
              "text-4xl font-bold font-heading mb-2",
              activeFilter === 'pending' 
                ? "bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent" 
                : "text-[var(--chrome-white)]"
            )}>
              {totalPending}
            </div>
            <p className="text-xs text-[var(--muted-lead)]">
              Onay bekliyor
            </p>
          </div>
        </button>
      </div>

      {/* Operasyon Modal - Full Featured */}
      {showOperationsPanel && createPortal(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={() => setShowOperationsPanel(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl max-h-[90vh] bg-[var(--slate-surface)] rounded-3xl border border-white/[0.08] overflow-hidden flex flex-col"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-white/[0.08] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <Calendar size={20} className="text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-[var(--chrome-white)]">
                    Günlük Operasyonlar
                  </h3>
                  <p className="text-xs text-[var(--muted-lead)]">
                    Randevuları düzenle • Saatleri değiştir • Tarihleri taşı
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowOperationsPanel(false)}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X size={20} className="text-[var(--muted-lead)]" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Modern Takvim Seçici - Wizard Style */}
              <div className="rounded-3xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-2 border-cyan-500/20 p-6 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                    <Calendar size={18} className="text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-base text-cyan-300 uppercase tracking-wider">
                      📅 Tarih Seçin
                    </h4>
                    <p className="text-xs text-cyan-400/80">Randevuları görmek için tarih seçin</p>
                  </div>
                </div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full h-16 px-6 rounded-2xl bg-white/10 border-2 border-cyan-500/30 text-[var(--chrome-white)] font-mono text-lg font-bold outline-none focus:border-cyan-400 focus:bg-white/15 transition-all shadow-lg hover:border-cyan-500/50"
                />
                <div className="mt-4 flex items-center justify-between px-2">
                  <span className="text-xs text-cyan-300/80 font-semibold uppercase tracking-wider">Seçili Tarih</span>
                  <span className="font-mono font-bold text-lg text-cyan-400">{new Date(selectedDate).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>

              {/* O Günün Randevuları - Editable */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                      <Users size={18} className="text-purple-400" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-base text-[var(--chrome-white)]">
                        {new Date(selectedDate).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long' })} Randevuları
                      </h4>
                      <p className="text-xs text-[var(--muted-lead)]">
                        Düzenlemek için kart üzerine tıklayın
                      </p>
                    </div>
                  </div>
                  <span className="px-4 py-2 rounded-full bg-cyan-500/20 text-cyan-400 text-sm font-bold shadow-lg shadow-cyan-500/20">
                    {reservations.filter(r => formatDate(r) === selectedDate).length} Randevu
                  </span>
                </div>
                
                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
                  {reservations.filter(r => formatDate(r) === selectedDate).length === 0 ? (
                    <div className="text-center py-16 rounded-3xl bg-white/[0.02] border-2 border-dashed border-white/[0.08]">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/10 to-blue-500/10 flex items-center justify-center mx-auto mb-4">
                        <Calendar size={32} className="text-cyan-400" />
                      </div>
                      <p className="font-heading font-bold text-[var(--chrome-white)] mb-1">Bu tarihte randevu yok</p>
                      <p className="text-sm text-[var(--muted-lead)]">Başka bir tarih seçin veya sıradan randevu ekleyin</p>
                    </div>
                  ) : (
                    reservations.filter(r => formatDate(r) === selectedDate).map((reservation) => (
                      <div
                        key={reservation.id}
                        className="p-5 rounded-3xl bg-gradient-to-br from-white/[0.05] via-white/[0.03] to-white/[0.01] border border-white/[0.08] hover:border-purple-500/30 transition-all group"
                      >
                        {/* Header Row */}
                        <div className="flex items-center justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30 flex-shrink-0">
                              <User size={20} className="text-white" strokeWidth={2.5} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-heading font-bold text-base text-[var(--chrome-white)] truncate">
                                {reservation.userName}
                              </h5>
                              <p className="text-xs text-[var(--muted-lead)] font-mono">
                                {reservation.userPhone}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                              {reservation.pricing.totalAmount.toLocaleString('tr-TR')} ₺
                            </span>
                            <StatusBadge status={reservation.status as any} />
                          </div>
                        </div>

                        {/* Edit Mode */}
                        {editingReservation === reservation.id ? (
                          <div className="space-y-3">
                            {/* Time Editor - Modern Dropdown - HER ZAMAN GÖSTER */}
                            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                              <label className="block text-xs font-bold text-cyan-300 mb-2 uppercase tracking-wider">
                                🕐 Yeni Saat
                              </label>
                              <select
                                value={newTime}
                                onChange={(e) => setNewTime(e.target.value)}
                                className="w-full h-12 px-4 rounded-xl bg-white/10 border border-cyan-500/30 text-[var(--chrome-white)] font-mono font-bold text-base outline-none focus:border-cyan-400 focus:bg-white/15 transition-all"
                              >
                                {generateTimeSlots('06:00', '22:00', 15).map(time => (
                                  <option key={time} value={time} className="bg-[var(--void)] text-[var(--chrome-white)]">
                                    {time}
                                  </option>
                                ))}
                              </select>
                              {formatTime(reservation) !== '-' && (
                                <p className="text-xs text-cyan-300/80 mt-2">
                                  Mevcut: <span className="font-mono font-bold">{formatTime(reservation)}</span>
                                </p>
                              )}
                            </div>

                            {/* Date Editor - Modern Grid Calendar */}
                            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                              <label className="block text-xs font-bold text-purple-300 mb-2 uppercase tracking-wider">
                                📅 Yeni Tarih
                              </label>
                              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                                {Array.from({ length: 30 }, (_, i) => {
                                  const date = new Date();
                                  date.setDate(date.getDate() + i);
                                  const dateStr = date.toISOString().split('T')[0];
                                  const isSelected = newDate === dateStr;
                                  const isToday = i === 0;
                                  
                                  return (
                                    <button
                                      key={dateStr}
                                      type="button"
                                      onClick={() => setNewDate(dateStr)}
                                      className={cn(
                                        "p-2 rounded-xl text-center transition-all hover:scale-105",
                                        isSelected 
                                          ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30" 
                                          : "bg-white/5 border border-white/[0.08] hover:bg-white/10 text-[var(--chrome-white)]"
                                      )}
                                    >
                                      {isToday && (
                                        <span className="text-[10px] font-bold text-emerald-400 block mb-0.5">Bugün</span>
                                      )}
                                      <div className="text-xs font-bold">{date.getDate()}</div>
                                      <div className="text-[10px] opacity-70">
                                        {date.toLocaleDateString('tr-TR', { month: 'short' })}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingReservation(null);
                                  setNewTime('');
                                  setNewDate('');
                                }}
                                className="flex-1 h-11 rounded-full bg-white/5 hover:bg-white/10 border border-white/[0.08] text-[var(--muted-lead)] hover:text-[var(--chrome-white)] font-heading font-semibold text-sm transition-all"
                              >
                                İptal
                              </button>
                              <button
                                onClick={() => handleDeleteReservation(reservation.id)}
                                disabled={loading}
                                className="w-11 h-11 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 font-heading font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center"
                                title="Randevuyu Sil"
                              >
                                <X size={16} strokeWidth={2.5} />
                              </button>
                              <button
                                onClick={() => handleUpdateDateTime(
                                  reservation.id,
                                  newDate,
                                  newTime
                                )}
                                disabled={loading}
                                className="flex-1 h-11 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg hover:shadow-emerald-500/30 text-white font-heading font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                <Check size={16} strokeWidth={2.5} />
                                Kaydet
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* Current Info */}
                            <div className="grid grid-cols-2 gap-2">
                              {formatTime(reservation) !== '-' && (
                                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                                  <div className="flex items-center gap-2">
                                    <Clock size={14} className="text-cyan-400" strokeWidth={2.5} />
                                    <div>
                                      <p className="text-xs text-[var(--muted-lead)]">Saat</p>
                                      <p className="font-mono font-bold text-sm text-[var(--chrome-white)]">
                                        {formatTime(reservation)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                                <div className="flex items-center gap-2">
                                  <Calendar size={14} className="text-purple-400" strokeWidth={2.5} />
                                  <div>
                                    <p className="text-xs text-[var(--muted-lead)]">Tarih</p>
                                    <p className="font-mono font-bold text-sm text-[var(--chrome-white)]">
                                      {formatDate(reservation)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Services */}
                            {reservation.type === 'slot' && (reservation as SlotReservation).services.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {(reservation as SlotReservation).services.map((service) => (
                                  <span
                                    key={service.id}
                                    className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 font-heading font-semibold text-xs text-purple-300">
                                    {service.name}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => {
                                  setEditingReservation(reservation.id);
                                  // Mevcut değerleri set et
                                  setNewDate(formatDate(reservation));
                                  if (reservation.type === 'slot') {
                                    setNewTime((reservation as SlotReservation).startTime);
                                  } else if (reservation.type === 'daily' && (reservation as any).startTime) {
                                    setNewTime((reservation as any).startTime);
                                  } else if (reservation.type === 'order' && (reservation as any).deliveryTime) {
                                    setNewTime((reservation as any).deliveryTime);
                                  } else {
                                    setNewTime('09:00');
                                  }
                                }}
                                className="flex-1 h-10 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-heading font-semibold text-sm transition-all flex items-center justify-center gap-2"
                              >
                                <Clock size={14} strokeWidth={2.5} />
                                Düzenle
                              </button>
                              <button
                                onClick={() => handleDeleteReservation(reservation.id)}
                                disabled={loading}
                                className="w-10 h-10 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-heading font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center"
                                title="Sil"
                              >
                                <X size={14} strokeWidth={2.5} />
                              </button>
                              <button 
                                onClick={() => handleViewDetails(reservation)}
                                className="flex-1 h-10 rounded-full bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 font-heading font-semibold text-sm transition-all flex items-center justify-center gap-2"
                              >
                                <Eye size={14} strokeWidth={2.5} />
                                Detay
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Manuel Saat Bloklama */}
              <div className="rounded-3xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border-2 border-orange-500/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                      <Plus size={18} className="text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-base text-orange-400">
                        Saat Blokla
                      </h4>
                      <p className="text-xs text-orange-300/80">Müşterilerin göremeyeceği zaman dilimi oluştur</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCreateBlockModal(!showCreateBlockModal)}
                    className="px-4 py-2 rounded-full bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-400 font-heading font-semibold text-sm transition-all"
                  >
                    {showCreateBlockModal ? 'İptal' : '+ Blok Oluştur'}
                  </button>
                </div>

                {showCreateBlockModal && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 pt-4 border-t border-orange-500/20"
                  >
                    {/* Modern Time Picker - Start */}
                    <div>
                      <label className="block text-xs font-bold text-orange-300 mb-2 uppercase tracking-wider">
                        🕐 Başlangıç Saati
                      </label>
                      <select
                        value={blockStartTime}
                        onChange={(e) => setBlockStartTime(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl bg-white/10 border border-orange-500/30 text-[var(--chrome-white)] font-mono font-bold text-base outline-none focus:border-orange-400 focus:bg-white/15 transition-all"
                      >
                        {generateTimeSlots('06:00', '22:00', 15).map(time => (
                          <option key={time} value={time} className="bg-[var(--void)] text-[var(--chrome-white)]">
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Modern Time Picker - End */}
                    <div>
                      <label className="block text-xs font-bold text-orange-300 mb-2 uppercase tracking-wider">
                        🕐 Bitiş Saati
                      </label>
                      <select
                        value={blockEndTime}
                        onChange={(e) => setBlockEndTime(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl bg-white/10 border border-orange-500/30 text-[var(--chrome-white)] font-mono font-bold text-base outline-none focus:border-orange-400 focus:bg-white/15 transition-all"
                      >
                        {generateTimeSlots('06:00', '23:00', 15).map(time => (
                          <option key={time} value={time} className="bg-[var(--void)] text-[var(--chrome-white)]">
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Reason */}
                    <div>
                      <label className="block text-xs font-bold text-orange-300 mb-2 uppercase tracking-wider">
                        📝 Neden? (Opsiyonel)
                      </label>
                      <input
                        type="text"
                        value={blockReason}
                        onChange={(e) => setBlockReason(e.target.value)}
                        placeholder="Örn: Mola, Toplantı, Özel işlem..."
                        className="w-full h-12 px-4 rounded-xl bg-white/10 border border-orange-500/30 text-[var(--chrome-white)] placeholder:text-[var(--muted-lead)] text-sm outline-none focus:border-orange-400 focus:bg-white/15 transition-all"
                      />
                    </div>

                    {/* Duration Display */}
                    <div className="p-3 rounded-xl bg-orange-500/20 border border-orange-500/30">
                      <p className="text-sm text-orange-300 font-semibold">
                        ⏱️ Süre: <span className="font-mono font-bold">{calculateDuration(blockStartTime, blockEndTime)} dakika</span>
                      </p>
                    </div>

                    {/* Create Button */}
                    <button
                      onClick={handleCreateBlock}
                      disabled={loading || calculateDuration(blockStartTime, blockEndTime) <= 0}
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:shadow-lg hover:shadow-orange-500/30 text-white font-heading font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Oluşturuluyor...</span>
                        </>
                      ) : (
                        <>
                          <Plus size={18} strokeWidth={2.5} />
                          <span>Saati Blokla</span>
                        </>
                      )}
                    </button>

                    <p className="text-xs text-orange-300/80 leading-relaxed">
                      💡 Bu saat aralığı müşterilere "dolu" olarak görünecek ve rezervasyon alamayacaklar.
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Sıradan Randevuya Ekle */}
              <div className="rounded-3xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-2 border-emerald-500/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <ArrowRight size={18} className="text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-base text-emerald-400">
                        Sıradaki Müşteriler
                      </h4>
                      <p className="text-xs text-emerald-300/80">Sırayı randevuya dönüştür</p>
                    </div>
                  </div>
                  <span className="px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-bold shadow-lg shadow-emerald-500/20">
                    {queueEntries.length} Sırada
                  </span>
                </div>

                {queueEntries.length === 0 ? (
                  <div className="text-center py-8 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center mx-auto mb-3">
                      <Users size={24} className="text-emerald-400" />
                    </div>
                    <p className="text-sm text-[var(--muted-lead)]">Sırada bekleyen yok</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {queueEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-4 rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] hover:border-emerald-500/30 transition-all group"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 flex-shrink-0">
                              <span className="font-bold text-white text-sm">
                                {entry.queuePosition}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-heading font-bold text-sm text-[var(--chrome-white)] truncate">
                                {entry.customerName}
                              </h5>
                              <p className="text-xs text-[var(--muted-lead)] font-mono">
                                {entry.customerPhone}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="text-right">
                              <p className="text-xs text-[var(--muted-lead)]">
                                {entry.totalDuration} dk
                              </p>
                              <p className="font-mono font-bold text-sm text-emerald-400">
                                {entry.totalPrice}₺
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedQueueEntry(entry);
                                setShowQueueToAppointmentModal(true);
                              }}
                              className="w-10 h-10 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 hover:border-emerald-500/50 flex items-center justify-center transition-all"
                              title="Randevuya Dönüştür"
                            >
                              <ArrowRight size={16} className="text-emerald-400" strokeWidth={2.5} />
                            </button>
                          </div>
                        </div>
                        
                        {/* Services */}
                        {entry.services?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {entry.services.map((service: any) => (
                              <span
                                key={service.id}
                                className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
                                {service.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>,
        document.body
      )}

      {/* Queue to Appointment Modal */}
      {showQueueToAppointmentModal && selectedQueueEntry && createPortal(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={() => setShowQueueToAppointmentModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-[var(--slate-surface)] rounded-3xl border border-white/[0.08] overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <ArrowRight size={20} className="text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-[var(--chrome-white)]">
                    Randevuya Dönüştür
                  </h3>
                  <p className="text-xs text-[var(--muted-lead)]">
                    {selectedQueueEntry.customerName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowQueueToAppointmentModal(false)}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X size={20} className="text-[var(--muted-lead)]" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Customer Info */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[var(--muted-lead)] mb-1">Müşteri</p>
                    <p className="font-heading font-bold text-sm text-[var(--chrome-white)]">
                      {selectedQueueEntry.customerName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--muted-lead)] mb-1">Telefon</p>
                    <p className="font-mono text-sm text-[var(--chrome-white)]">
                      {selectedQueueEntry.customerPhone}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--muted-lead)] mb-1">Süre</p>
                    <p className="font-mono text-sm text-[var(--chrome-white)]">
                      {selectedQueueEntry.totalDuration} dk
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--muted-lead)] mb-1">Ücret</p>
                    <p className="font-mono font-bold text-sm text-emerald-400">
                      {selectedQueueEntry.totalPrice}₺
                    </p>
                  </div>
                </div>
              </div>

              {/* Time Selection */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <label className="block text-xs font-bold text-emerald-300 mb-2 uppercase tracking-wider">
                  🕐 Randevu Saati Seç
                </label>
                <select
                  value={queueAppointmentTime}
                  onChange={(e) => setQueueAppointmentTime(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-white/10 border border-emerald-500/30 text-[var(--chrome-white)] font-mono font-bold text-base outline-none focus:border-emerald-400 focus:bg-white/15 transition-all"
                >
                  {generateTimeSlots('06:00', '22:00', 15).map(time => (
                    <option key={time} value={time} className="bg-[var(--void)] text-[var(--chrome-white)]">
                      {time}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-emerald-300/80 mt-2">
                  Tarih: <span className="font-mono font-bold">{new Date(selectedDate).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                </p>
              </div>

              {/* Services */}
              {selectedQueueEntry.services?.length > 0 && (
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                  <p className="text-xs font-bold text-[var(--muted-lead)] mb-2 uppercase tracking-wider">
                    Hizmetler
                  </p>
                  <div className="space-y-2">
                    {selectedQueueEntry.services.map((service: any) => (
                      <div key={service.id} className="flex justify-between items-center text-sm">
                        <span className="text-[var(--chrome-white)]">{service.name}</span>
                        <span className="font-mono text-[var(--muted-lead)]">
                          {service.duration} dk • {service.price}₺
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowQueueToAppointmentModal(false)}
                  className="flex-1 h-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/[0.08] text-[var(--muted-lead)] hover:text-[var(--chrome-white)] font-heading font-semibold text-sm transition-all"
                >
                  İptal
                </button>
                <button
                  onClick={handleConvertQueueToAppointment}
                  disabled={loading}
                  className="flex-1 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg hover:shadow-emerald-500/30 text-white font-heading font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Oluşturuluyor...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} strokeWidth={2.5} />
                      <span>Randevuya Dönüştür</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>,
        document.body
      )}
      
      {/* Arama Kutusu - Modern */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
          <Search size={16} className="text-purple-400" strokeWidth={2.5} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Müşteri adı, telefon, rezervasyon ID..."
          className="w-full h-14 pl-16 pr-14 rounded-full bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] text-[var(--chrome-white)] placeholder:text-[var(--muted-lead)] text-sm outline-none focus:border-purple-500/40 focus:bg-white/[0.05] focus:shadow-lg focus:shadow-purple-500/10 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all active:scale-95"
          >
            <X size={14} className="text-[var(--muted-lead)]" strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Sonuç sayısı */}
      {searchQuery && (
        <div className="text-center py-2">
          <p className="text-sm text-[var(--muted-lead)]">
            <span className="font-bold text-[var(--chrome-white)]">{filteredReservations.length}</span> rezervasyon bulundu
          </p>
        </div>
      )}

      {/* Pending Reservations */}
      {(activeFilter === 'all' || activeFilter === 'pending') && pendingReservations.length > 0 && (
        <div className="space-y-4">
          {/* Header - Kompakt */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Clock size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[var(--chrome-white)]">
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
                className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-white/[0.02] to-orange-500/5 p-5 hover:border-amber-500/30 transition-all duration-300 group"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative space-y-3.5">
                  {/* Header - Müşteri Bilgisi */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/30">
                      <User size={20} className="text-white" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-heading font-bold text-base text-[var(--chrome-white)] truncate">
                        {reservation.userName}
                      </h4>
                      <p className="font-mono text-xs text-[var(--muted-lead)]">
                        {reservation.userPhone}
                      </p>
                    </div>
                    <span className="px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wide">
                      {getReservationTypeLabel(reservation.type)}
                    </span>
                  </div>

                  {/* Date & Time - Kompakt */}
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                    <div className="flex items-center gap-2.5 text-sm">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                        <Calendar size={16} className="text-cyan-400" strokeWidth={2.5} />
                      </div>
                      <div className="flex-1">
                        {formatDateRange(reservation) ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[var(--chrome-white)] font-semibold">
                              {formatDateRange(reservation)!.start}
                            </span>
                            <span className="text-[var(--muted-lead)]">→</span>
                            <span className="font-mono text-[var(--chrome-white)] font-semibold">
                              {formatDateRange(reservation)!.end}
                            </span>
                            {formatDateRange(reservation)!.nights && (
                              <span className="ml-1 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold">
                                {formatDateRange(reservation)!.nights} gece
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="font-mono text-[var(--chrome-white)] font-semibold">
                            {formatDate(reservation)}
                          </span>
                        )}
                      </div>
                    </div>
                    {formatTime(reservation) !== '-' && (
                      <div className="flex items-center gap-2.5 text-sm mt-2 pt-2 border-t border-white/[0.05]">
                        <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                          <Clock size={16} className="text-cyan-400" strokeWidth={2.5} />
                        </div>
                        <span className="font-mono text-[var(--chrome-white)] font-semibold">
                          {formatTime(reservation)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Price - Modern Gradient */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <DollarSign size={16} className="text-emerald-400" strokeWidth={2.5} />
                        </div>
                        <span className="font-mono font-bold text-xl text-emerald-400">
                          {reservation.pricing.totalAmount.toLocaleString('tr-TR')} ₺
                        </span>
                      </div>
                      {reservation.pricing.depositRequired && (
                        <span className="text-xs text-emerald-300 font-semibold">
                          Depozito: {reservation.pricing.depositAmount.toLocaleString('tr-TR')} ₺
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Services - Eğer varsa */}
                  {reservation.type === 'slot' && (reservation as SlotReservation).services.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {(reservation as SlotReservation).services.slice(0, 3).map((service) => (
                        <span
                          key={service.id}
                          className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 font-heading font-semibold text-xs text-purple-300">
                          {service.name}
                        </span>
                      ))}
                      {(reservation as SlotReservation).services.length > 3 && (
                        <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 font-heading font-semibold text-xs text-[var(--muted-lead)]">
                          +{(reservation as SlotReservation).services.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Notes - Eğer varsa */}
                  {reservation.notes && (
                    <div className="p-3 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                      <p className="font-body text-xs text-blue-300 italic line-clamp-2">
                        💬 {reservation.notes}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons - Modern */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleViewDetails(reservation)}
                      className="flex-1 h-11 rounded-full bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] hover:border-cyan-500/30 text-cyan-400 font-heading font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      <Eye size={16} strokeWidth={2.5} />
                      Detay
                    </button>
                    <button
                      onClick={() => handleApprove(reservation.id)}
                      disabled={loading}
                      className="flex-1 h-11 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg hover:shadow-emerald-500/30 text-white font-heading font-semibold text-sm transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      <Check size={16} strokeWidth={2.5} />
                      Onayla
                    </button>
                    <button
                      onClick={() => {
                        setSelectedReservation(reservation);
                        setShowCancelDialog(true);
                      }}
                      disabled={loading}
                      className="w-11 h-11 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 font-heading font-semibold text-sm transition-all duration-200 disabled:opacity-50 flex items-center justify-center active:scale-[0.98]"
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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Check size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[var(--chrome-white)]">
                Onaylanmış Rezervasyonlar
              </h3>
              <p className="text-xs text-[var(--muted-lead)]">
                {confirmedReservations.length} aktif rezervasyon
              </p>
            </div>
          </div>
          
          {/* Tümünü Takvime Ekle Butonu - Oval */}
          {confirmedReservations.length > 0 && (
            <button
              onClick={() => {
                // Tüm onaylı randevuları takvime ekle
                const events = confirmedReservations.map(res => reservationToCalendarEvent(res));
                const icsContent = events.map(event => {
                  const lines = [
                    'BEGIN:VEVENT',
                    `DTSTART:${event.startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
                    `DTEND:${event.endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
                    `SUMMARY:${event.title}`,
                    `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
                    event.location ? `LOCATION:${event.location}` : '',
                    `UID:${Date.now()}-${Math.random().toString(36).substring(2)}@randevu-sistemi.com`,
                    'END:VEVENT'
                  ].filter(Boolean);
                  return lines.join('\r\n');
                }).join('\r\n');

                const fullICS = [
                  'BEGIN:VCALENDAR',
                  'VERSION:2.0',
                  'PRODID:-//Randevu Sistemi//TR',
                  icsContent,
                  'END:VCALENDAR'
                ].join('\r\n');

                const blob = new Blob([fullICS], { type: 'text/calendar;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `onaylanmis-randevular-${new Date().toISOString().split('T')[0]}.ics`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                setTimeout(() => {
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }, 100);

                addToast(`${confirmedReservations.length} randevu takvime eklendi`, 'success');
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 border border-cyan-500/20 hover:border-cyan-500/40 text-cyan-400 font-heading font-semibold text-sm transition-all duration-200"
            >
              <Calendar size={16} strokeWidth={2.5} />
              Tümünü Takvime Ekle
            </button>
          )}
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
                className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-white/[0.02] to-teal-500/5 p-5 hover:border-emerald-500/30 transition-all duration-300 cursor-pointer group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative space-y-3.5">
                  {/* Header - Müşteri ve Actions */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30">
                        <Check size={20} className="text-white" strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-heading font-bold text-base text-[var(--chrome-white)] truncate">
                          {reservation.userName}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <StatusBadge status={reservation.status as any} />
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons - Kompakt */}
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          try {
                            const event = reservationToCalendarEvent(reservation);
                            const calendarAction = getDefaultCalendarAction(event);
                            calendarAction();
                          } catch (error) {
                            console.error('Takvime ekleme hatası:', error);
                          }
                        }}
                        className="w-9 h-9 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 hover:border-cyan-500/40 flex items-center justify-center transition-all duration-200"
                        title="Takvime Ekle"
                      >
                        <Calendar size={16} className="text-cyan-400" strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReservation(reservation);
                          setShowCancelDialog(true);
                        }}
                        className="w-9 h-9 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 flex items-center justify-center transition-all duration-200"
                        title="İptal Et"
                      >
                        <X size={16} className="text-red-400" strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(reservation);
                        }}
                        className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/[0.08] flex items-center justify-center transition-colors"
                        title="Detay"
                      >
                        <Eye size={16} className="text-[var(--muted-lead)]" strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>

                  {/* Info Grid - Kompakt */}
                  <div className="grid grid-cols-1 gap-2.5">
                    {/* Date & Time */}
                    <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                      <div className="flex items-center gap-2.5 text-sm">
                        <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                          <Calendar size={16} className="text-cyan-400" strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 font-mono text-[var(--chrome-white)] font-semibold">
                          {formatDateRange(reservation) ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span>{formatDateRange(reservation)!.start}</span>
                              <span className="text-[var(--muted-lead)]">→</span>
                              <span>{formatDateRange(reservation)!.end}</span>
                              {formatDateRange(reservation)!.nights && (
                                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold">
                                  {formatDateRange(reservation)!.nights} gece
                                </span>
                              )}
                            </div>
                          ) : (
                            <>
                              {formatDate(reservation)}
                              {formatTime(reservation) !== '-' && (
                                <span className="text-[var(--muted-lead)] ml-1.5">• {formatTime(reservation)}</span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                          <DollarSign size={16} className="text-emerald-400" strokeWidth={2.5} />
                        </div>
                        <span className="font-mono font-bold text-xl text-emerald-400">
                          {reservation.pricing.totalAmount.toLocaleString('tr-TR')} ₺
                        </span>
                        <span className="ml-auto px-2.5 py-1 rounded-full bg-white/10 text-[var(--muted-lead)] text-xs font-semibold">
                          {getReservationTypeLabel(reservation.type)}
                        </span>
                      </div>
                    </div>
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
                {/* Customer Info - Modern Oval */}
                <div className="rounded-[2rem] border border-white/[0.08] bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                      <User size={14} className="text-purple-400" />
                    </div>
                    <h4 className="font-heading font-bold text-sm text-[var(--chrome-white)]">
                      Müşteri Bilgileri
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {/* Telefon */}
                    <div>
                      <p className="text-[var(--muted-lead)] text-xs mb-2">Telefon</p>
                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${selectedReservation.userPhone}`}
                          className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
                        >
                          <Phone size={14} className="text-purple-400 group-hover:text-purple-300" />
                          <span className="font-mono text-sm text-[var(--chrome-white)]">
                            {selectedReservation.userPhone}
                          </span>
                        </a>
                        <CopyButton 
                          text={selectedReservation.userPhone} 
                          onCopy={() => addToast('Telefon kopyalandı', 'success')}
                        />
                        <a
                          href={getWhatsAppLink(selectedReservation.userPhone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center transition-all"
                          title="WhatsApp'ta Aç"
                        >
                          <MessageCircle size={14} className="text-emerald-400" />
                        </a>
                      </div>
                    </div>
                    
                    {/* E-posta */}
                    {selectedReservation.userEmail && (
                      <div>
                        <p className="text-[var(--muted-lead)] text-xs mb-2">E-posta</p>
                        <div className="flex items-center gap-2">
                          <a
                            href={`mailto:${selectedReservation.userEmail}`}
                            className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all group min-w-0"
                          >
                            <Mail size={14} className="text-cyan-400 group-hover:text-cyan-300 flex-shrink-0" />
                            <span className="font-mono text-sm text-[var(--chrome-white)] truncate">
                              {selectedReservation.userEmail}
                            </span>
                          </a>
                          <CopyButton 
                            text={selectedReservation.userEmail} 
                            onCopy={() => addToast('E-posta kopyalandı', 'success')}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Rezervasyon ID */}
                    <div>
                      <p className="text-[var(--muted-lead)] text-xs mb-2">Rezervasyon ID</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10">
                          <span className="font-mono text-xs text-[var(--chrome-white)]">
                            {selectedReservation.id}
                          </span>
                        </div>
                        <CopyButton 
                          text={selectedReservation.id} 
                          onCopy={() => addToast('Rezervasyon ID kopyalandı', 'success')}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Date & Time - Modern Oval */}
                <div className="rounded-[2rem] border border-white/[0.08] bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-5">
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

                {/* Pricing - Modern Oval */}
                <div className="rounded-[2rem] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-5">
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

                {/* Services - Modern Oval */}
                {selectedReservation.type === 'slot' && (
                  <div className="rounded-[2rem] border border-white/[0.08] bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-5">
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

                {/* Address - For Slot Reservations */}
                {selectedReservation.type === 'slot' && (selectedReservation as any).address && (
                  <div className="rounded-[2rem] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                        <MapPin size={14} className="text-cyan-400" />
                      </div>
                      <h4 className="font-heading font-bold text-sm text-cyan-400">
                        Müşteri Adresi
                      </h4>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-cyan-300 leading-relaxed">
                        {(selectedReservation as any).address}
                      </p>
                      <div className="flex items-center gap-2 pt-2">
                        <CopyButton 
                          text={(selectedReservation as any).address}
                          onCopy={() => addToast('Adres kopyalandı', 'success')}
                          variant="button"
                          label="Kopyala"
                        />
                        {(selectedReservation as any).gpsLocation ? (
                          <a
                            href={getGoogleMapsLink('', (selectedReservation as any).gpsLocation)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 h-10 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 flex items-center justify-center gap-2 transition-all group"
                            title="Yol Tarifi Al"
                          >
                            <MapPin size={14} className="text-emerald-400 group-hover:text-emerald-300" />
                            <span className="text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">Yol Tarifi</span>
                          </a>
                        ) : (
                          <a
                            href={getGoogleMapsLink((selectedReservation as any).address)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 h-10 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 flex items-center justify-center gap-2 transition-all group"
                            title="Haritada Aç"
                          >
                            <MapPin size={14} className="text-emerald-400 group-hover:text-emerald-300" />
                            <span className="text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">Haritada Aç</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Items - For Catering/Orders */}
                {selectedReservation.type === 'order' && (
                  <>
                    <div className="rounded-[2rem] border border-white/[0.08] bg-white/[0.02] p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText size={16} className="text-orange-400" />
                        <h4 className="font-heading font-bold text-sm text-[var(--chrome-white)]">
                          Sipariş Ürünleri
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {(selectedReservation as any).items?.map((item: any, index: number) => (
                          <div
                            key={index}
                            className="p-3 rounded-xl bg-white/5 text-sm"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-semibold text-[var(--chrome-white)]">{item.name}</span>
                              <span className="font-mono font-semibold text-[var(--chrome-white)]">
                                {item.price.toLocaleString('tr-TR')} ₺
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-[var(--muted-lead)]">
                              <span>Miktar: {item.quantity} {item.unit}</span>
                              {item.customization && (
                                <span className="text-cyan-400">Özelleştirme var</span>
                              )}
                            </div>
                            {item.customization && (
                              <p className="mt-2 text-xs text-[var(--muted-lead)] italic">
                                {item.customization}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Delivery Address with Location */}
                    {((selectedReservation as any).deliveryAddress || (selectedReservation as any).address) && (
                      <div className="rounded-[2rem] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                            <MapPin size={14} className="text-cyan-400" />
                          </div>
                          <h4 className="font-heading font-bold text-sm text-cyan-400">
                            {(selectedReservation as any).deliveryAddress ? 'Teslimat Adresi' : 'Adres'}
                          </h4>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-cyan-300 leading-relaxed">
                            {(selectedReservation as any).deliveryAddress || (selectedReservation as any).address}
                          </p>
                          <div className="flex items-center gap-2 pt-2">
                            <CopyButton 
                              text={(selectedReservation as any).deliveryAddress || (selectedReservation as any).address}
                              onCopy={() => addToast('Adres kopyalandı', 'success')}
                              variant="button"
                              label="Kopyala"
                            />
                            {(selectedReservation as any).gpsLocation ? (
                              <a
                                href={getGoogleMapsLink('', (selectedReservation as any).gpsLocation)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 h-10 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 flex items-center justify-center gap-2 transition-all group"
                                title="Yol Tarifi Al"
                              >
                                <MapPin size={14} className="text-emerald-400 group-hover:text-emerald-300" />
                                <span className="text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">Yol Tarifi</span>
                              </a>
                            ) : (
                              <a
                                href={getGoogleMapsLink((selectedReservation as any).deliveryAddress || (selectedReservation as any).address)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 h-10 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 flex items-center justify-center gap-2 transition-all group"
                                title="Haritada Aç"
                              >
                                <MapPin size={14} className="text-emerald-400 group-hover:text-emerald-300" />
                                <span className="text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">Haritada Aç</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Project Details - For Organization */}
                {selectedReservation.type === 'project' && (
                  <>
                    <div className="rounded-[2rem] border border-white/[0.08] bg-white/[0.02] p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText size={16} className="text-purple-400" />
                        <h4 className="font-heading font-bold text-sm text-[var(--chrome-white)]">
                          Etkinlik Detayları
                        </h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        {(selectedReservation as any).venue && (
                          <div className="flex justify-between">
                            <span className="text-[var(--muted-lead)]">Mekan</span>
                            <span className="font-semibold text-[var(--chrome-white)]">
                              {(selectedReservation as any).venue}
                            </span>
                          </div>
                        )}
                        {(selectedReservation as any).guestCount && (
                          <div className="flex justify-between">
                            <span className="text-[var(--muted-lead)]">Misafir Sayısı</span>
                            <span className="font-semibold text-[var(--chrome-white)]">
                              {(selectedReservation as any).guestCount} kişi
                            </span>
                          </div>
                        )}
                        {(selectedReservation as any).package && (
                          <div className="mt-3 pt-3 border-t border-white/[0.08]">
                            <p className="text-[var(--muted-lead)] text-xs mb-2">Paket</p>
                            <div className="p-2 rounded-xl bg-white/5">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold text-[var(--chrome-white)]">
                                  {(selectedReservation as any).package.name}
                                </span>
                                <span className="font-mono text-xs text-purple-400 uppercase">
                                  {(selectedReservation as any).package.tier}
                                </span>
                              </div>
                              {(selectedReservation as any).package.includes?.length > 0 && (
                                <ul className="mt-2 space-y-1">
                                  {(selectedReservation as any).package.includes.slice(0, 3).map((item: string, i: number) => (
                                    <li key={i} className="text-xs text-[var(--muted-lead)]">
                                      • {item}
                                    </li>
                                  ))}
                                  {(selectedReservation as any).package.includes.length > 3 && (
                                    <li className="text-xs text-purple-400">
                                      +{(selectedReservation as any).package.includes.length - 3} daha fazla
                                    </li>
                                  )}
                                </ul>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Daily Rental Details - For Venues */}
                {selectedReservation.type === 'daily' && (
                  <div className="rounded-[2rem] border border-white/[0.08] bg-white/[0.02] p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText size={16} className="text-amber-400" />
                      <h4 className="font-heading font-bold text-sm text-[var(--chrome-white)]">
                        Salon Detayları
                      </h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      {(selectedReservation as any).eventType && (
                        <div className="flex justify-between">
                          <span className="text-[var(--muted-lead)]">Etkinlik Türü</span>
                          <span className="font-semibold text-[var(--chrome-white)] capitalize">
                            {(selectedReservation as any).eventType}
                          </span>
                        </div>
                      )}
                      {(selectedReservation as any).capacity && (
                        <div className="flex justify-between">
                          <span className="text-[var(--muted-lead)]">Kapasite</span>
                          <span className="font-semibold text-[var(--chrome-white)]">
                            {(selectedReservation as any).capacity} kişi
                          </span>
                        </div>
                      )}
                      {(selectedReservation as any).package && (
                        <div className="mt-3 pt-3 border-t border-white/[0.08]">
                          <p className="text-[var(--muted-lead)] text-xs mb-2">Paket</p>
                          <div className="p-2 rounded-xl bg-white/5">
                            <p className="font-semibold text-[var(--chrome-white)]">
                              {(selectedReservation as any).package.name}
                            </p>
                          </div>
                        </div>
                      )}
                      {(selectedReservation as any).extras?.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/[0.08]">
                          <p className="text-[var(--muted-lead)] text-xs mb-2">Ekstralar</p>
                          <div className="space-y-1">
                            {(selectedReservation as any).extras.map((extra: any, i: number) => (
                              <div key={i} className="flex justify-between text-xs">
                                <span className="text-[var(--muted-lead)]">
                                  {extra.name} x{extra.quantity}
                                </span>
                                <span className="font-mono text-[var(--chrome-white)]">
                                  {extra.price.toLocaleString('tr-TR')} ₺
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Nightly Booking Details */}
                {selectedReservation.type === 'nightly' && (
                  <div className="rounded-[2rem] border border-white/[0.08] bg-white/[0.02] p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText size={16} className="text-blue-400" />
                      <h4 className="font-heading font-bold text-sm text-[var(--chrome-white)]">
                        Konaklama Detayları
                      </h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      {(selectedReservation as any).mealPlan && (
                        <div className="flex justify-between">
                          <span className="text-[var(--muted-lead)]">Pansiyon Türü</span>
                          <span className="font-semibold text-[var(--chrome-white)] capitalize">
                            {(selectedReservation as any).mealPlan}
                          </span>
                        </div>
                      )}
                      {(selectedReservation as any).specialRequests && (
                        <div className="mt-3 pt-3 border-t border-white/[0.08]">
                          <p className="text-[var(--muted-lead)] text-xs mb-2">Özel İstekler</p>
                          <p className="text-xs text-[var(--chrome-white)]">
                            {(selectedReservation as any).specialRequests}
                          </p>
                        </div>
                      )}
                      {(selectedReservation as any).extras?.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/[0.08]">
                          <p className="text-[var(--muted-lead)] text-xs mb-2">Ekstra Hizmetler</p>
                          <div className="space-y-1">
                            {(selectedReservation as any).extras.map((extra: any, i: number) => (
                              <div key={i} className="flex justify-between text-xs">
                                <span className="text-[var(--muted-lead)]">{extra.name}</span>
                                <span className="font-mono text-[var(--chrome-white)]">
                                  {extra.price.toLocaleString('tr-TR')} ₺
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedReservation.notes && (
                  <div className="rounded-[2rem] border border-blue-500/20 bg-blue-500/10 p-5">
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
 
