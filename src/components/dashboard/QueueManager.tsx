import { useState, useEffect } from 'react';
import { Users, Clock, Phone, Calendar, ArrowRight, Ban, Star } from 'lucide-react';
import { appointmentsService } from '@/services/firebaseService';
import { banService, salonCustomerRatingService } from '@/services/banService';
import { ChromaticButton } from '@/components/ui/ChromaticButton';
import { useUIStore } from '@/store/uiStore';
import type { QueueEntry } from '@/types';

interface QueueManagerProps {
  salonId: string;
  staffId?: string;
  onRefresh?: () => void;
}

export function QueueManager({ salonId, staffId, onRefresh }: QueueManagerProps) {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<QueueEntry | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const { addToast } = useUIStore();

  useEffect(() => {
    loadQueue();
  }, [salonId, staffId]);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const data = await appointmentsService.getQueue(salonId, staffId);
      setQueue(data);
    } catch (error) {
      console.error('Error loading queue:', error);
      addToast('Sıra yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromQueue = async (queueId: string) => {
    if (!confirm('Bu kişiyi sıradan çıkarmak istediğinize emin misiniz?')) return;

    try {
      await appointmentsService.removeFromQueue(queueId);
      addToast('Sıradan çıkarıldı', 'success');
      loadQueue();
      onRefresh?.();
    } catch (error) {
      console.error('Error removing from queue:', error);
      addToast('Sıradan çıkarılamadı', 'error');
    }
  };

  const handleBanCustomer = async (entry: QueueEntry, reason: string) => {
    try {
      await banService.banCustomer({
        userId: entry.userId,
        salonId: entry.salonId,
        bannedBy: 'salon-owner-id', // TODO: Get from auth
        reason,
        customerName: entry.customerName,
        customerPhone: entry.customerPhone,
      });
      
      // Remove from queue
      await appointmentsService.removeFromQueue(entry.id);
      
      addToast('Müşteri engellendi', 'success');
      setShowBanDialog(false);
      loadQueue();
      onRefresh?.();
    } catch (error) {
      console.error('Error banning customer:', error);
      addToast('Müşteri engellenemedi', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="text-center p-8">
        <Users size={48} className="mx-auto mb-4 text-[var(--muted-lead)]" />
        <p className="font-body text-[var(--muted-lead)]">Sırada kimse yok</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
          <Users size={20} />
          Sıra Listesi ({queue.length})
        </h3>
      </div>

      <div className="space-y-3">
        {queue.map((entry) => (
          <div
            key={entry.id}
            className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                {/* Customer Info */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-bold">
                    {entry.queuePosition}
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-[var(--foreground)]">
                      {entry.customerName}
                    </h4>
                    <p className="font-body text-xs text-[var(--muted-lead)] flex items-center gap-1">
                      <Phone size={12} />
                      {entry.customerPhone}
                    </p>
                  </div>
                </div>

                {/* Services */}
                <div className="flex flex-wrap gap-2">
                  {entry.services.map((service) => (
                    <span
                      key={service.id}
                      className="px-2 py-1 rounded-full bg-[var(--muted)] text-xs font-body text-[var(--foreground)]"
                    >
                      {service.name}
                    </span>
                  ))}
                </div>

                {/* Preferred Time */}
                {entry.preferredDate && entry.preferredTime && (
                  <p className="font-body text-xs text-[var(--muted-lead)] flex items-center gap-1">
                    <Calendar size={12} />
                    Tercih: {entry.preferredDate} - {entry.preferredTime}
                  </p>
                )}

                {/* Duration & Price */}
                <div className="flex items-center gap-4 text-xs font-body text-[var(--muted-lead)]">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {entry.totalDuration} dk
                  </span>
                  <span className="font-bold text-[var(--primary)]">
                    {entry.totalPrice} TL
                  </span>
                </div>

                {/* Notes */}
                {entry.notes && (
                  <p className="font-body text-xs text-[var(--muted-lead)] italic">
                    Not: {entry.notes}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setSelectedEntry(entry);
                    setShowAssignDialog(true);
                  }}
                  className="p-2 rounded-lg bg-[var(--primary)] text-white hover:opacity-90 transition-opacity"
                  title="Randevuya Ata"
                >
                  <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => {
                    setSelectedEntry(entry);
                    setShowRatingDialog(true);
                  }}
                  className="p-2 rounded-lg bg-[var(--warning)] text-white hover:opacity-90 transition-opacity"
                  title="Müşteriyi Değerlendir"
                >
                  <Star size={16} />
                </button>
                <button
                  onClick={() => {
                    setSelectedEntry(entry);
                    setShowBanDialog(true);
                  }}
                  className="p-2 rounded-lg bg-[var(--error)] text-white hover:opacity-90 transition-opacity"
                  title="Müşteriyi Engelle"
                >
                  <Ban size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Assign Dialog */}
      {showAssignDialog && selectedEntry && (
        <AssignToSlotDialog
          entry={selectedEntry}
          onClose={() => {
            setShowAssignDialog(false);
            setSelectedEntry(null);
          }}
          onSuccess={() => {
            loadQueue();
            onRefresh?.();
          }}
        />
      )}

      {/* Ban Dialog */}
      {showBanDialog && selectedEntry && (
        <BanCustomerDialog
          entry={selectedEntry}
          onClose={() => {
            setShowBanDialog(false);
            setSelectedEntry(null);
          }}
          onConfirm={(reason) => handleBanCustomer(selectedEntry, reason)}
        />
      )}

      {/* Rating Dialog */}
      {showRatingDialog && selectedEntry && (
        <RateCustomerDialog
          entry={selectedEntry}
          salonId={salonId}
          onClose={() => {
            setShowRatingDialog(false);
            setSelectedEntry(null);
          }}
        />
      )}
    </div>
  );
}

// Assign to Slot Dialog
function AssignToSlotDialog({
  entry,
  onClose,
  onSuccess,
}: {
  entry: QueueEntry;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useUIStore();

  const handleAssign = async () => {
    if (!selectedDate || !selectedTime) {
      addToast('Lütfen tarih ve saat seçin', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await appointmentsService.assignQueueToSlot(entry.id, selectedDate, selectedTime);
      addToast('Randevuya atandı', 'success');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error assigning to slot:', error);
      addToast('Randevuya atanamadı', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[var(--card)] rounded-2xl p-6 space-y-4">
        <h3 className="font-heading text-lg font-bold">Randevuya Ata</h3>
        
        <div className="space-y-3">
          <div>
            <label className="block font-body text-sm mb-2">Tarih</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-3 rounded-lg border border-[var(--border)] bg-[var(--background)]"
            />
          </div>
          
          <div>
            <label className="block font-body text-sm mb-2">Saat</label>
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full p-3 rounded-lg border border-[var(--border)] bg-[var(--background)]"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-full border">
            İptal
          </button>
          <ChromaticButton onClick={handleAssign} loading={isSubmitting} className="flex-1">
            Ata
          </ChromaticButton>
        </div>
      </div>
    </div>
  );
}

// Ban Customer Dialog
function BanCustomerDialog({
  entry,
  onClose,
  onConfirm,
}: {
  entry: QueueEntry;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[var(--card)] rounded-2xl p-6 space-y-4">
        <h3 className="font-heading text-lg font-bold text-[var(--error)]">Müşteriyi Engelle</h3>
        
        <p className="font-body text-sm text-[var(--muted-lead)]">
          {entry.customerName} isimli müşteriyi engellemek istediğinize emin misiniz?
        </p>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Engelleme nedeni..."
          className="w-full p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] resize-none"
          rows={3}
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-full border">
            İptal
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim()}
            className="flex-1 px-4 py-2 rounded-full bg-[var(--error)] text-white disabled:opacity-50"
          >
            Engelle
          </button>
        </div>
      </div>
    </div>
  );
}

// Rate Customer Dialog
function RateCustomerDialog({
  entry,
  salonId,
  onClose,
}: {
  entry: QueueEntry;
  salonId: string;
  onClose: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useUIStore();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await salonCustomerRatingService.rateCustomer({
        salonId,
        customerId: entry.userId,
        customerName: entry.customerName,
        rating,
        comment,
        ratedBy: 'salon-owner-id', // TODO: Get from auth
      });
      addToast('Müşteri değerlendirildi', 'success');
      onClose();
    } catch (error: any) {
      addToast(error.message || 'Değerlendirme yapılamadı', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[var(--card)] rounded-2xl p-6 space-y-4">
        <h3 className="font-heading text-lg font-bold">Müşteriyi Değerlendir</h3>
        
        <div className="space-y-3">
          <div>
            <label className="block font-body text-sm mb-2">Puan</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={32}
                    className={star <= rating ? 'fill-[var(--warning)] text-[var(--warning)]' : 'text-[var(--muted-lead)]'}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-body text-sm mb-2">Yorum (Opsiyonel)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Müşteri hakkında notlarınız..."
              className="w-full p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-full border">
            İptal
          </button>
          <ChromaticButton onClick={handleSubmit} loading={isSubmitting} className="flex-1">
            Değerlendir
          </ChromaticButton>
        </div>
      </div>
    </div>
  );
}
