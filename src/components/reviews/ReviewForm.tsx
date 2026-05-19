import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, X, Send } from 'lucide-react';
import { ChromaticButton } from '@/components/ui/ChromaticButton';
import { reviewService } from '@/services/reviewService';
import { useAuthStore } from '@/store/authStore';
import type { Review } from '@/types';

interface ReviewFormProps {
  salonId: string;
  salonName: string;
  staffId?: string;
  staffName?: string;
  reservationId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReviewForm({
  salonId,
  salonName,
  staffId,
  staffName,
  reservationId,
  onClose,
  onSuccess,
}: ReviewFormProps) {
  const { user } = useAuthStore();
  const [salonRating, setSalonRating] = useState(0);
  const [staffRating, setStaffRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('Giriş yapmalısınız');
      return;
    }

    if (salonRating === 0) {
      setError('Lütfen salon puanı verin');
      return;
    }

    if (staffId && staffRating === 0) {
      setError('Lütfen personel puanı verin');
      return;
    }

    if (!comment.trim()) {
      setError('Lütfen yorum yazın');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await reviewService.createReview({
        salonId,
        staffId: staffId || '',
        userId: user.uid,
        customerName: user.displayName || 'Anonim',
        customerAvatar: user.photoURL || '',
        rating: salonRating,
        staffRating: staffRating || salonRating,
        comment: comment.trim(),
        serviceNames: [],
        staffName: staffName || '',
        date: new Date().toISOString().split('T')[0],
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Yorum gönderilemedi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ 
    rating, 
    onRate, 
    label 
  }: { 
    rating: number; 
    onRate: (rating: number) => void; 
    label: string;
  }) => (
    <div>
      <label className="block font-heading font-semibold text-[var(--chrome-white)] mb-2">
        {label}
      </label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRate(star)}
            className="transition-transform hover:scale-110 active:scale-95"
          >
            <Star
              size={32}
              className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-[var(--muted-lead)]'}
              strokeWidth={2}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="obsidian-card p-6 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-heading font-bold text-2xl text-[var(--chrome-white)]">
              Değerlendirme Yap
            </h2>
            <p className="font-body text-sm text-[var(--muted-lead)] mt-1">
              {salonName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/5 transition-colors"
          >
            <X size={24} className="text-[var(--muted-lead)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Salon Rating */}
          <StarRating
            rating={salonRating}
            onRate={setSalonRating}
            label="Salon Puanı"
          />

          {/* Staff Rating */}
          {staffId && staffName && (
            <StarRating
              rating={staffRating}
              onRate={setStaffRating}
              label={`${staffName} Puanı`}
            />
          )}

          {/* Comment */}
          <div>
            <label className="block font-heading font-semibold text-[var(--chrome-white)] mb-2">
              Yorumunuz
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Deneyiminizi paylaşın..."
              rows={5}
              className="w-full px-4 py-3 rounded-xl bg-[var(--slate-elevated)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body text-sm focus:outline-none focus:border-[var(--liquid-chrome)] resize-none"
              maxLength={500}
            />
            <p className="font-body text-xs text-[var(--muted-lead)] mt-1 text-right">
              {comment.length}/500
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="font-body text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-full bg-white/5 hover:bg-white/10 text-[var(--chrome-white)] font-heading font-semibold transition-all"
            >
              İptal
            </button>
            <ChromaticButton
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Gönderiliyor...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>Gönder</span>
                </>
              )}
            </ChromaticButton>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
