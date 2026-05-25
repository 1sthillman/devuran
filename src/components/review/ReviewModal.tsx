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
  const canReview = appointment.status === 'completed' && !appointment.hasReview;

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
    // Validate appointment can be reviewed
    if (!canReview) {
      if (appointment.hasReview) {
        addToast('Bu randevuyu zaten değerlendirdiniz', 'error');
      } else if (appointment.status !== 'completed') {
        addToast('Sadece tamamlanmış randevuları değerlendirebilirsiniz', 'error');
      }
      return;
    }

    if (salonRating === 0 || staffRating === 0) {
      addToast('Lütfen hem işletmeyi hem de personeli değerlendirin', 'warning');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(salonRating, staffRating, comment);
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
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
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="w-full bg-[var(--slate-surface)] border border-[var(--obsidian-rim)] rounded-t-3xl sm:rounded-3xl p-4 sm:p-6"
          onClick={(e) => e.stopPropagation()}
        >
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="font-display font-bold text-lg sm:text-xl text-[var(--chrome-white)]">
            Deneyiminizi Değerlendirin
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors flex-shrink-0"
          >
            <X size={18} className="text-[var(--muted-lead)]" />
          </button>
        </div>

        {/* Appointment Info */}
        <div className="obsidian-card p-3 sm:p-4 mb-4 sm:mb-6">
          <h4 className="font-heading font-semibold text-sm sm:text-base text-[var(--chrome-white)] mb-1">
            {appointment.salonName}
          </h4>
          <p className="font-body text-xs sm:text-sm text-[var(--muted-lead)]">
            {appointment.staffName} • {appointment.date} • {appointment.time}
          </p>
        </div>

        {/* Cannot Review Warning */}
        {!canReview && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 mb-4 sm:mb-6">
            <p className="font-body text-sm text-red-400 text-center">
              {appointment.hasReview 
                ? 'Bu randevuyu zaten değerlendirdiniz' 
                : 'Sadece tamamlanmış randevuları değerlendirebilirsiniz'}
            </p>
          </div>
        )}

        {/* Salon Rating */}
        <div className="mb-4 sm:mb-6">
          <label className="block font-heading font-semibold text-sm sm:text-base text-[var(--chrome-white)] mb-2 sm:mb-3">
            İşletmeyi Değerlendirin
          </label>
          <StarRating 
            rating={salonRating}
            setRating={canReview ? setSalonRating : () => {}}
            hovered={hoveredSalonStar}
            setHovered={canReview ? setHoveredSalonStar : () => {}}
          />
          <p className="font-body text-xs text-[var(--muted-lead)] mt-2">
            Genel deneyiminizi değerlendirin
          </p>
        </div>

        {/* Staff Rating */}
        <div className="mb-4 sm:mb-6">
          <label className="block font-heading font-semibold text-sm sm:text-base text-[var(--chrome-white)] mb-2 sm:mb-3">
            Personeli Değerlendirin ({appointment.staffName})
          </label>
          <StarRating 
            rating={staffRating}
            setRating={canReview ? setStaffRating : () => {}}
            hovered={hoveredStaffStar}
            setHovered={canReview ? setHoveredStaffStar : () => {}}
          />
          <p className="font-body text-xs text-[var(--muted-lead)] mt-2">
            Personelin hizmet kalitesini değerlendirin
          </p>
        </div>

        {/* Comment */}
        <div className="mb-4 sm:mb-6">
          <label className="block font-heading font-medium text-xs sm:text-sm text-[var(--silver-frost)] mb-2">
            Yorumunuz (İsteğe Bağlı)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={!canReview}
            placeholder="Deneyiminizi paylaşın..."
            rows={3}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-3xl bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] placeholder:text-[var(--ash)] font-body text-sm outline-none focus:border-[var(--liquid-chrome)] transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 sm:gap-3">
          <ChromaticButton
            variant="ghost"
            onClick={onClose}
            className="flex-shrink-0 px-4 sm:px-6"
          >
            {canReview ? 'Daha Sonra' : 'Kapat'}
          </ChromaticButton>
          {canReview && (
            <ChromaticButton
              onClick={handleSubmit}
              loading={loading}
              className="flex-1"
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

