import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star } from 'lucide-react';
import { ChromaticButton } from '@/components/ui/ChromaticButton';
import { useUIStore } from '@/store/uiStore';
import type { Appointment } from '@/types';

interface ReviewModalProps {
  appointment: Appointment;
  onSubmit: (salonRating: number, staffRating: number, comment: string) => Promise<void>;
  onClose: () => void;
}

export function ReviewModal({ appointment, onSubmit, onClose }: ReviewModalProps) {
  const { addToast } = useUIStore();
  const [salonRating, setSalonRating] = useState(0);
  const [staffRating, setStaffRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [hoveredSalonStar, setHoveredSalonStar] = useState(0);
  const [hoveredStaffStar, setHoveredStaffStar] = useState(0);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Check if appointment can be reviewed
  // Geçmiş randevular (tarih+saat geçmiş) ve onaylanmış/tamamlanmış olanlar değerlendirilebilir
  const aptDateTime = new Date(`${appointment.date}T${appointment.time || '00:00'}`);
  const nowTime = new Date();
  const isPastAppointment = aptDateTime < nowTime;
  const isValidStatus = appointment.status === 'confirmed' || appointment.status === 'completed';
  const canReview = isPastAppointment && isValidStatus && !appointment.hasReview;
  
  // 🔥 DEBUG: Modal açıldığında kontrol et
  console.log('🔥 ReviewModal Opened:', {
    salonName: appointment.salonName,
    date: appointment.date,
    time: appointment.time,
    aptDateTime: aptDateTime.toISOString(),
    now: nowTime.toISOString(),
    isPastAppointment,
    status: appointment.status,
    isValidStatus,
    hasReview: appointment.hasReview,
    canReview,
  });
  
  // Always allow star interaction for UI feedback, just prevent submission
  const allowStarInteraction = true;
  
  // Check if appointment has staff (some businesses don't have staff)
  const hasStaff = appointment.staffId && appointment.staffName;

  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    
    if (modalContentRef.current) {
      modalContentRef.current.scrollTop = 0;
    }

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  const handleSubmit = async () => {
    console.log('🔵 ReviewModal - handleSubmit called');
    console.log('🔵 canReview:', canReview);
    console.log('🔵 salonRating:', salonRating);
    console.log('🔵 staffRating:', staffRating);
    console.log('🔵 hasStaff:', hasStaff);
    
    // Validate appointment can be reviewed
    if (!canReview) {
      console.warn('⚠️ Cannot review:', {
        hasReview: appointment.hasReview,
        status: appointment.status,
        isPast: isPastAppointment
      });
      
      if (appointment.hasReview) {
        addToast('Bu randevuyu zaten değerlendirdiniz', 'error');
      } else if (appointment.status !== 'completed') {
        addToast('Sadece tamamlanmış randevuları değerlendirebilirsiniz', 'error');
      }
      return;
    }

    // İşletme değerlendirmesi zorunlu
    if (salonRating === 0) {
      console.warn('⚠️ Salon rating is 0');
      addToast('Lütfen işletmeyi değerlendirin', 'warning');
      return;
    }

    // Personel varsa personel değerlendirmesi de zorunlu
    if (hasStaff && staffRating === 0) {
      console.warn('⚠️ Staff rating is 0 but staff exists');
      addToast('Lütfen personeli değerlendirin', 'warning');
      return;
    }

    console.log('✅ All validations passed, submitting review...');
    setLoading(true);
    try {
      await onSubmit(salonRating, hasStaff ? staffRating : 0, comment);
      console.log('✅ Review submitted, closing modal');
      onClose();
    } catch (error) {
      console.error('❌ Error in handleSubmit:', error);
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({ 
    rating, 
    setRating, 
    hovered, 
    setHovered 
  }: { 
    rating: number; 
    setRating: (r: number) => void;
    hovered: number;
    setHovered: (r: number) => void;
  }) => (
    <div className="flex gap-1.5 sm:gap-2 justify-center sm:justify-start">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setRating(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110 active:scale-95 p-1 rounded-full hover:bg-white/5"
        >
          <Star
            size={28}
            className={`transition-colors ${
              star <= (hovered || rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-[var(--muted-lead)]'
            }`}
          />
        </button>
      ))}
    </div>
  );

  const modalContent = (
    <div className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-sm" onClick={onClose}>
      <div className="fixed inset-x-0 bottom-0 sm:absolute sm:inset-4 sm:top-auto sm:bottom-auto sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md sm:my-auto h-[85vh] sm:h-auto sm:max-h-[90vh] overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="w-full bg-[var(--slate-surface)] border-2 border-purple-500/30 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl shadow-purple-500/20"
          onClick={(e) => e.stopPropagation()}
        >
        <div className="flex items-center justify-between mb-5 sm:mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 mb-2">
              <Star size={14} className="text-yellow-400" />
              <span className="text-xs font-semibold text-yellow-300">Değerlendirme</span>
            </div>
            <h3 className="font-display font-bold text-xl sm:text-2xl text-[var(--chrome-white)]">
              Deneyiminizi Paylaşın
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors flex-shrink-0"
          >
            <X size={20} className="text-[var(--muted-lead)]" />
          </button>
        </div>

        {/* Appointment Info */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent border border-purple-500/20 mb-5 sm:mb-6">
          <h4 className="font-heading font-semibold text-sm sm:text-base text-[var(--chrome-white)] mb-1">
            {appointment.salonName}
          </h4>
          <p className="font-body text-xs sm:text-sm text-[var(--muted-lead)]">
            {appointment.staffName} • {appointment.date} • {appointment.time}
          </p>
        </div>

        {/* Cannot Review Warning */}
        {!canReview && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 mb-4 sm:mb-6">
            <p className="font-body text-sm text-red-400 text-center">
              {appointment.hasReview 
                ? 'Bu randevuyu zaten değerlendirdiniz' 
                : !isPastAppointment
                ? `Randevu henüz gerçekleşmedi (${appointment.date} ${appointment.time})`
                : !isValidStatus
                ? `Geçersiz durum: ${appointment.status}`
                : 'Bilinmeyen hata'}
            </p>
            <p className="font-body text-xs text-red-300 text-center mt-2">
              DEBUG: isPast={isPastAppointment ? 'YES' : 'NO'}, 
              status={appointment.status}, 
              hasReview={appointment.hasReview ? 'YES' : 'NO'},
              canReview={canReview ? 'YES' : 'NO'}
            </p>
          </div>
        )}

        {/* Salon Rating */}
        <div className="mb-5 sm:mb-6">
          <label className="block font-heading font-semibold text-sm sm:text-base text-[var(--chrome-white)] mb-3">
            İşletmeyi Değerlendirin
          </label>
          <StarRating 
            rating={salonRating}
            setRating={setSalonRating}
            hovered={hoveredSalonStar}
            setHovered={setHoveredSalonStar}
          />
          <p className="font-body text-xs text-[var(--muted-lead)] mt-2">
            Genel deneyiminizi değerlendirin
          </p>
        </div>

        {/* Staff Rating - Sadece personel varsa göster */}
        {hasStaff && (
          <div className="mb-5 sm:mb-6">
            <label className="block font-heading font-semibold text-sm sm:text-base text-[var(--chrome-white)] mb-3">
              Personeli Değerlendirin
            </label>
            <div className="text-xs text-purple-400 mb-2">{appointment.staffName}</div>
            <StarRating 
              rating={staffRating}
              setRating={setStaffRating}
              hovered={hoveredStaffStar}
              setHovered={setHoveredStaffStar}
            />
            <p className="font-body text-xs text-[var(--muted-lead)] mt-2">
              Personelin hizmet kalitesini değerlendirin
            </p>
          </div>
        )}

        {/* Comment */}
        <div className="mb-5 sm:mb-6">
          <label className="block font-heading font-semibold text-sm text-[var(--chrome-white)] mb-2">
            Yorumunuz <span className="text-[var(--muted-lead)] font-normal">(İsteğe Bağlı)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={!canReview}
            placeholder="Deneyiminizi paylaşın..."
            rows={4}
            className="w-full px-4 py-3 rounded-2xl bg-white/[0.05] border-2 border-white/[0.08] text-[var(--chrome-white)] placeholder:text-[var(--ash)] font-body text-sm outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-shrink-0 px-6 h-12 rounded-2xl border-2 border-white/[0.08] font-heading font-semibold text-base text-[var(--silver-frost)] hover:border-white/20 hover:bg-white/[0.03] transition-all active:scale-95"
          >
            {canReview ? 'Daha Sonra' : 'Kapat'}
          </button>
          {canReview && (
            <ChromaticButton
              onClick={handleSubmit}
              loading={loading}
              className="flex-1 h-12 text-base font-semibold"
            >
              Gönder
            </ChromaticButton>
          )}
        </div>
      </motion.div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

