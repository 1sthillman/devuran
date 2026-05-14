import { useState } from 'react';
import { motion } from 'framer-motion';
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

  const handleSubmit = async () => {
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

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-sm overflow-y-auto pt-16 sm:pt-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[var(--slate-surface)] border border-[var(--obsidian-rim)] rounded-3xl p-4 sm:p-6 my-4"
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

        {/* Salon Rating */}
        <div className="mb-4 sm:mb-6">
          <label className="block font-heading font-semibold text-sm sm:text-base text-[var(--chrome-white)] mb-2 sm:mb-3">
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

        {/* Staff Rating */}
        <div className="mb-4 sm:mb-6">
          <label className="block font-heading font-semibold text-sm sm:text-base text-[var(--chrome-white)] mb-2 sm:mb-3">
            Personeli Değerlendirin ({appointment.staffName})
          </label>
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

        {/* Comment */}
        <div className="mb-4 sm:mb-6">
          <label className="block font-heading font-medium text-xs sm:text-sm text-[var(--silver-frost)] mb-2">
            Yorumunuz (İsteğe Bağlı)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Deneyiminizi paylaşın..."
            rows={3}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-3xl bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] placeholder:text-[var(--ash)] font-body text-sm outline-none focus:border-[var(--liquid-chrome)] transition-colors resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 sm:gap-3">
          <ChromaticButton
            variant="ghost"
            onClick={onClose}
            className="flex-shrink-0 px-4 sm:px-6"
          >
            Daha Sonra
          </ChromaticButton>
          <ChromaticButton
            onClick={handleSubmit}
            loading={loading}
            className="flex-1"
          >
            Gönder
          </ChromaticButton>
        </div>
      </motion.div>
    </div>
  );
}

