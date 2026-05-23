import { useState } from 'react';
import { X } from 'lucide-react';
import { ChromaticButton } from '@/components/ui/ChromaticButton';
import { useUIStore } from '@/store/uiStore';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-[var(--card)] rounded-2xl shadow-2xl border border-[var(--border)]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <h2 className="font-heading text-xl font-bold text-[var(--foreground)]">
            Randevuyu İptal Et
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--muted)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="font-body text-sm text-[var(--muted-lead)]">
            Lütfen iptal nedeninizi seçin:
          </p>

          {/* Reason Options */}
          <div className="space-y-2">
            {reasons.map((reason) => (
              <label
                key={reason}
                className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] cursor-pointer transition-colors"
              >
                <input
                  type="radio"
                  name="cancelReason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-4 h-4 text-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]"
                />
                <span className="font-body text-sm text-[var(--foreground)]">
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
              className="w-full p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] font-body text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
              rows={3}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 rounded-full border border-[var(--border)] font-body text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
          >
            Vazgeç
          </button>
          <ChromaticButton
            onClick={handleConfirm}
            loading={isSubmitting}
            disabled={!selectedReason || (selectedReason === 'Diğer' && !customReason.trim())}
            className="flex-1"
          >
            İptal Et
          </ChromaticButton>
        </div>
      </div>
    </div>
  );
}
