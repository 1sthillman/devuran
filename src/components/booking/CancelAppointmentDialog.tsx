import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface CancelAppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  appointmentId: string;
  cancelledBy: 'customer' | 'salon';
}

const CANCEL_REASONS = {
  customer: [
    'Başka bir işim çıktı',
    'Randevu saati uygun değil',
    'Farklı bir salon tercih ettim',
    'Hizmeti almaktan vazgeçtim',
    'Kişisel nedenler',
    'Diğer',
  ],
  salon: [
    'Personel müsait değil',
    'İşletme kapalı',
    'Müşteri ile iletişim kurulamadı',
    'Teknik sorun',
    'Diğer',
  ],
};

export function CancelAppointmentDialog({
  isOpen,
  onClose,
  onConfirm,
  cancelledBy,
}: CancelAppointmentDialogProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const { addToast } = useUIStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const reasons = CANCEL_REASONS[cancelledBy];

  const handleConfirm = async () => {
    const finalReason = selectedReason === 'Diğer' ? customReason : selectedReason;
    
    if (!finalReason.trim()) {
      addToast('Lütfen bir iptal nedeni seçin veya yazın', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(finalReason);
      onClose();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-xl"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-x-0 bottom-0 sm:absolute sm:inset-4 sm:top-auto sm:bottom-auto sm:left-1/2 sm:-translate-x-1/2 sm:max-w-lg sm:my-auto h-[75vh] sm:h-auto sm:max-h-[85vh] bg-[var(--slate-surface)] rounded-t-3xl sm:rounded-3xl border-t border-white/[0.08] sm:border shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Sticky Header */}
          <div className="sticky top-0 bg-gradient-to-b from-[var(--slate-surface)] to-[var(--slate-surface)]/95 backdrop-blur-xl border-b border-white/[0.08] p-5 z-10 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-lg shadow-red-500/30">
                  <X size={24} className="text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="font-heading text-lg font-bold text-[var(--chrome-white)]">
                    Randevuyu İptal Et
                  </h2>
                  <p className="text-xs text-[var(--muted-lead)]">
                    İptal nedeninizi seçin
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-2xl bg-white/[0.05] hover:bg-white/[0.08] flex items-center justify-center transition-colors"
              >
                <X size={20} className="text-[var(--muted-lead)]" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ WebkitOverflowScrolling: 'touch' }}>
            <p className="font-body text-sm text-[var(--silver-frost)]">
              Lütfen iptal nedeninizi seçin:
            </p>

            {/* Reason Options */}
            <div className="space-y-2">
              {reasons.map((reason) => (
                <label
                  key={reason}
                  className={cn(
                    "flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-200",
                    selectedReason === reason
                      ? "bg-gradient-to-r from-red-500/10 to-pink-500/10 border-red-500/30"
                      : "bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.05] hover:border-white/[0.15]"
                  )}
                >
                  <input
                    type="radio"
                    name="cancelReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="w-4 h-4 text-red-500 focus:ring-2 focus:ring-red-500/50 bg-white/5 border-white/20"
                  />
                  <span className={cn(
                    "font-body text-sm",
                    selectedReason === reason ? "text-[var(--chrome-white)] font-medium" : "text-[var(--silver-frost)]"
                  )}>
                    {reason}
                  </span>
                </label>
              ))}
            </div>

            {/* Custom Reason Input */}
            {selectedReason === 'Diğer' && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="İptal nedeninizi yazın..."
                className="w-full p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] text-[var(--chrome-white)] placeholder:text-[var(--muted-lead)] font-body text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/30 resize-none transition-all"
                rows={3}
              />
            )}
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 bg-gradient-to-t from-[var(--slate-surface)] to-[var(--slate-surface)]/95 backdrop-blur-xl border-t border-white/[0.08] p-5 flex-shrink-0">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-[var(--chrome-white)] font-heading font-bold transition-all active:scale-95 disabled:opacity-50"
              >
                Vazgeç
              </button>
              <button
                onClick={handleConfirm}
                disabled={isSubmitting || !selectedReason || (selectedReason === 'Diğer' && !customReason.trim())}
                className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-heading font-bold hover:shadow-lg hover:shadow-red-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>İptal Ediliyor...</span>
                  </div>
                ) : (
                  'Randevuyu İptal Et'
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
