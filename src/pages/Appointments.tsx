import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { motion } from 'framer-motion';
import { Calendar, Clock, Phone, MapPin, X, RotateCcw, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { appointmentsService, reviewsService } from '@/services/firebaseService';
import { reservationService } from '@/services/reservationService';
import { soundService } from '@/services/soundService';
import type { Appointment } from '@/types';
import { ReviewModal } from '@/components/review/ReviewModal';
import { CancelAppointmentDialog } from '@/components/booking/CancelAppointmentDialog';

export function Appointments() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuthStore();
  const { addToast } = useUIStore();
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewModalAppointment, setReviewModalAppointment] = useState<Appointment | null>(null);
  const [cancelDialogAppointment, setCancelDialogAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    if (user?.uid) {
      loadAppointments();
    }
  }, [user?.uid]);

  const loadAppointments = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      // Önce appointments'ı yükle
      const appointmentsData = await appointmentsService.getUserAppointments(user.uid);
      
      // Sonra reservations'ı yükle
      let reservationsData: any[] = [];
      try {
        reservationsData = await reservationService.getUserReservations(user.uid);
      } catch (resError) {
        console.error('Error loading reservations:', resError);
        // Reservations yüklenemezse sadece appointments'ı göster
      }
      
      // Reservations'ı appointments formatına çevir
      const convertedReservations = reservationsData.map((res: any) => ({
        id: res.id,
        userId: res.userId,
        salonId: res.businessId,
        salonName: res.businessName,
        staffId: res.staffId || '',
        customerName: res.userName,
        customerPhone: res.userPhone,
        services: res.services || [],
        date: res.date || res.eventDate || res.checkIn || res.deliveryDate || '',
        time: res.startTime || res.deliveryTime || '00:00',
        totalPrice: res.pricing?.totalAmount || res.totalPrice || 0,
        totalDuration: res.duration || res.totalDuration || 0,
        status: res.status === 'confirmed' || res.status === 'deposit_paid' || res.status === 'fully_paid' ? 'confirmed' : res.status,
        notes: res.notes || '',
        salonCover: '',
        salonAddress: res.salonAddress || res.address || res.businessAddress || '',
        staffName: '',
        staffPhoto: '',
        whatsappNumber: res.whatsappNumber || res.salonPhone || res.businessPhone || res.phone || '',
        endTime: res.endTime || '',
        createdAt: res.createdAt,
        hasReview: res.hasReview || false,
        _source: 'reservation' as const,
      }));
      
      // Birleştir ve tarihe göre sırala
      const allAppointments = [...appointmentsData, ...convertedReservations].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      
      setAppointments(allAppointments);
    } catch (error: any) {
      // Permission errors are expected - don't show error toast
      if (error?.code !== 'permission-denied') {
        console.error('Error loading appointments:', error);
        addToast(error?.message || 'Randevular yuklenemedi', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Show loading during auth check to prevent redirect
  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--liquid-chrome)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-body text-[var(--muted-lead)]">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const handleCancel = async (reason: string) => {
    if (!cancelDialogAppointment) return;
    
    try {
      // Rezervasyon mu yoksa appointment mı kontrol et
      const isReservation = cancelDialogAppointment._source === 'reservation';
      
      if (isReservation) {
        // Reservations collection'dan iptal et
        await reservationService.cancelReservation(
          cancelDialogAppointment.id,
          'user',
          reason
        );
      } else {
        // Appointments collection'dan iptal et
        await appointmentsService.cancel(cancelDialogAppointment.id, reason, 'customer');
      }
      
      // Play cancel sound
      soundService.playAppointmentCancelled();
      
      addToast('Randevu iptal edildi', 'success');
      setCancelDialogAppointment(null);
      loadAppointments(); // Reload appointments
    } catch (error: any) {
      console.error('Error cancelling appointment:', error);
      addToast(error?.message || 'Randevu iptal edilemedi', 'error');
    }
  };

  const handleWhatsApp = (phone: string) => {
    window.open(`https://wa.me/${phone}`, '_blank');
  };

  const handleReviewSubmit = async (salonRating: number, staffRating: number, comment: string) => {
    if (!reviewModalAppointment || !user) return;

    try {
      await reviewsService.submitAppointmentReview(
        reviewModalAppointment.id,
        user.uid,
        reviewModalAppointment.salonId,
        reviewModalAppointment.staffId,
        salonRating,
        staffRating,
        comment,
        user.displayName || 'Anonim',
        user.photoURL || '',
        reviewModalAppointment.services.map(s => s.name),
        reviewModalAppointment.staffName
      );

      addToast('Değerlendirmeniz kaydedildi', 'success');
      setReviewModalAppointment(null);
      loadAppointments(); // Reload to update hasReview flag
    } catch (error) {
      console.error('Error submitting review:', error);
      addToast('Değerlendirme gönderilemedi', 'error');
    }
  };

  const handleOpenReviewModal = (appointment: Appointment) => {
    // İptal edilen randevular için değerlendirme yapılamaz
    if (appointment.status === 'cancelled') {
      addToast('İptal edilen randevular için değerlendirme yapılamaz', 'warning');
      return;
    }
    
    // Sadece tamamlanmış randevular için değerlendirme yapılabilir
    if (appointment.status !== 'completed') {
      addToast('Sadece tamamlanmış randevular için değerlendirme yapılabilir', 'warning');
      return;
    }
    
    setReviewModalAppointment(appointment);
  };

  // Filter appointments
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const filteredAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.date);
    aptDate.setHours(0, 0, 0, 0);
    
    if (filter === 'upcoming') {
      return aptDate >= today && apt.status !== 'cancelled' && apt.status !== 'completed';
    } else {
      return aptDate < today || apt.status === 'cancelled' || apt.status === 'completed';
    }
  });

  return (
    <div className="max-w-2xl mx-auto pb-24 px-4">
      <h1 className="font-display font-bold text-3xl text-[var(--chrome-white)]">
        Randevularım
      </h1>
      <p className="font-body text-[var(--muted-lead)] mt-1">
        Geçmiş ve yaklaşan randevularınız
      </p>

      {/* Filter Tabs */}
      <div className="mt-6 inline-flex liquid-glass-pill p-1">
        <button
          onClick={() => setFilter('upcoming')}
          className={cn(
            'px-5 py-2 rounded-full font-heading font-medium text-sm transition-all',
            filter === 'upcoming'
              ? 'bg-[var(--chrome-white)] text-[var(--void)]'
              : 'text-[var(--muted-lead)] hover:text-[var(--silver-frost)]'
          )}
        >
          Yaklaşan
        </button>
        <button
          onClick={() => setFilter('past')}
          className={cn(
            'px-5 py-2 rounded-full font-heading font-medium text-sm transition-all',
            filter === 'past'
              ? 'bg-[var(--chrome-white)] text-[var(--void)]'
              : 'text-[var(--muted-lead)] hover:text-[var(--silver-frost)]'
          )}
        >
          Geçmiş
        </button>
      </div>

      {/* Appointments List */}
      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-[var(--liquid-chrome)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-body text-[var(--muted-lead)]">Yukleniyor...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-16">
            <Calendar size={48} className="mx-auto text-[var(--muted-lead)] mb-4" />
            <p className="font-heading font-medium text-lg text-[var(--chrome-white)]">
              Henüz randevunuz yok
            </p>
            <p className="font-body text-sm text-[var(--muted-lead)] mt-1">
              Premium salonlardan randevu almaya başlayın.
            </p>
            <Link
              to="/"
              className="inline-block mt-4 chromatic-btn px-6 h-11 text-sm"
            >
              <span>Salon Keşfet</span>
            </Link>
          </div>
        ) : (
          filteredAppointments.map((appointment, index) => (
            <motion.div
            key={appointment.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
            className="obsidian-card p-4 relative"
          >
            {/* Status Badge */}
            <div className="absolute top-4 right-4">
              <StatusBadge status={appointment.status} />
            </div>

            {/* Salon Info */}
            <div className="flex items-center gap-3">
              {appointment.salonCover ? (
                <img
                  src={appointment.salonCover}
                  loading="lazy"
                  alt={appointment.salonName}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[var(--chrome-white)] font-heading font-bold">
                    {appointment.salonName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-heading font-semibold text-[15px] text-[var(--chrome-white)] truncate">
                  {appointment.salonName}
                </h3>
                <div className="flex items-center gap-1">
                  <MapPin size={12} className="text-[var(--muted-lead)] flex-shrink-0" />
                  <span className="font-body text-xs text-[var(--muted-lead)] truncate">
                    {appointment.salonAddress}
                  </span>
                </div>
              </div>
            </div>

            {/* Service Tags */}
            <div className="flex flex-wrap gap-2 mt-3">
              {appointment.services.map((service) => (
                <span
                  key={service.id}
                  className="liquid-glass-pill px-2.5 py-1 font-body text-[11px] text-[var(--silver-frost)]"
                >
                  {service.name}
                </span>
              ))}
            </div>

            {/* Details Row */}
            <div className="flex items-center gap-4 mt-3 text-sm">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-[var(--muted-lead)]" />
                <span className="font-body text-[var(--silver-frost)]">{appointment.date}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-[var(--muted-lead)]" />
                <span className="font-mono text-[var(--silver-frost)]">{appointment.time}</span>
              </div>
              <span className="font-mono font-medium text-[var(--silver-frost)] ml-auto">
                {appointment.totalPrice} TL
              </span>
            </div>

            {/* Actions */}
            {appointment.status === 'pending' || appointment.status === 'confirmed' ? (
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-[var(--obsidian-rim)]">
                <button
                  onClick={() => setCancelDialogAppointment(appointment)}
                  className="flex items-center gap-1.5 font-heading font-medium text-[13px] text-[var(--error)] hover:underline"
                >
                  <X size={14} />
                  İptal Et
                </button>
                <button
                  onClick={() => handleWhatsApp(appointment.whatsappNumber)}
                  className="flex items-center gap-1.5 font-heading font-medium text-[13px] text-[var(--silver-frost)] hover:text-[var(--chrome-white)]"
                >
                  <Phone size={14} />
                  WhatsApp
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-[var(--obsidian-rim)]">
                <Link
                  to={`/salon/${appointment.salonId}`}
                  className="flex items-center gap-1.5 font-heading font-medium text-[13px] text-[var(--silver-frost)] hover:text-[var(--chrome-white)]"
                >
                  <RotateCcw size={14} />
                  Yeniden Planla
                </Link>
                {/* Show review button for past appointments without review */}
                {!appointment.hasReview && appointment.status === 'completed' && (
                  <button
                    onClick={() => handleOpenReviewModal(appointment)}
                    className="flex items-center gap-1.5 font-heading font-medium text-[13px] text-yellow-500 hover:text-yellow-400"
                  >
                    <Star size={14} />
                    Değerlendir
                  </button>
                )}
                {appointment.hasReview && (
                  <span className="flex items-center gap-1.5 font-heading font-medium text-[13px] text-[var(--muted-lead)]">
                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                    Değerlendirildi
                  </span>
                )}
                {appointment.status === 'cancelled' && (
                  <span className="flex items-center gap-1.5 font-heading font-medium text-[13px] text-[var(--error)]">
                    İptal Edildi
                    {appointment.cancellationReason && (
                      <span className="text-[var(--muted-lead)]">- {appointment.cancellationReason}</span>
                    )}
                  </span>
                )}
              </div>
            )}
          </motion.div>
        )))}
      </div>

      {/* Review Modal */}
      {reviewModalAppointment && (
        <ReviewModal
          appointment={reviewModalAppointment}
          onSubmit={handleReviewSubmit}
          onClose={() => setReviewModalAppointment(null)}
        />
      )}

      {/* Cancel Dialog */}
      {cancelDialogAppointment && (
        <CancelAppointmentDialog
          isOpen={true}
          onClose={() => setCancelDialogAppointment(null)}
          onConfirm={handleCancel}
          appointmentId={cancelDialogAppointment.id}
          cancelledBy="customer"
        />
      )}
    </div>
  );
}

