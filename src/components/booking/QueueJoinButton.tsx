import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Clock, Calendar, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { appointmentsService } from '@/services/firebaseService';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import type { Service, Salon } from '@/types';
import { cn } from '@/lib/utils';

interface QueueJoinButtonProps {
  salon: Salon;
  selectedServices: Service[];
  selectedStaffId?: string | null;
  preferredDate?: string;
  preferredTime?: string;
  totalPrice: number;
  totalDuration: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerNotes?: string;
  onSuccess?: () => void;
}

export function QueueJoinButton({
  salon,
  selectedServices,
  selectedStaffId,
  preferredDate,
  preferredTime,
  totalPrice,
  totalDuration,
  customerName,
  customerPhone,
  customerEmail,
  customerNotes,
  onSuccess
}: QueueJoinButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localName, setLocalName] = useState(customerName || '');
  const [localPhone, setLocalPhone] = useState(customerPhone || '');
  const [localEmail, setLocalEmail] = useState(customerEmail || '');
  const [localNotes, setLocalNotes] = useState(customerNotes || '');
  const { addToast } = useUIStore();
  const { user } = useAuthStore();

  const handleJoinQueue = async () => {
    if (!localName || !localPhone) {
      addToast('Lütfen ad ve telefon bilgilerinizi girin', 'warning');
      return;
    }

    if (selectedServices.length === 0) {
      addToast('Lütfen en az bir hizmet seçin', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await appointmentsService.addToQueue({
        salonId: salon.id,
        userId: user?.uid || 'guest',
        customerName: localName,
        customerPhone: localPhone,
        customerEmail: localEmail,
        services: selectedServices,
        staffId: selectedStaffId || undefined,
        preferredDate,
        preferredTime,
        totalPrice,
        totalDuration,
        notes: localNotes,
      });

      addToast('Sıraya başarıyla eklendiniz!', 'success');
      setShowModal(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Sıraya ekleme hatası:', error);
      addToast(error.message || 'Sıraya eklenemedi', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Sıraya Ekle Butonu */}
      <button
        onClick={() => setShowModal(true)}
        className="w-full h-12 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:shadow-2xl hover:shadow-amber-500/40 text-white font-heading font-bold transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
      >
        <Users size={18} />
        Sıraya Ekle
      </button>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => !isSubmitting && setShowModal(false)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[var(--void)] rounded-t-3xl sm:rounded-3xl border border-white/[0.08] overflow-hidden max-h-[85vh] flex flex-col"
            >
              {/* Header */}
              <div className="relative p-6 border-b border-white/[0.08]">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                      <Users size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-lg text-[var(--chrome-white)]">
                        Sıraya Ekle
                      </h3>
                      <p className="text-xs text-[var(--muted-lead)]">
                        Müsait saat bulunamadı
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    disabled={isSubmitting}
                    className="w-10 h-10 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] flex items-center justify-center transition-colors"
                  >
                    <X size={20} className="text-[var(--muted-lead)]" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Info Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10 border border-amber-500/20">
                  <div className="flex items-start gap-3">
                    <Sparkles size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-heading font-bold text-sm text-[var(--chrome-white)] mb-1">
                        Sıra Sistemi Nedir?
                      </h4>
                      <p className="text-xs text-amber-300/80 leading-relaxed">
                        Müsait saat olmadığında sıraya eklenebilirsiniz. İşletme uygun bir zaman bulduğunda size bildirim gönderecektir.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Selected Services */}
                <div className="space-y-2">
                  <h4 className="font-heading font-semibold text-sm text-[var(--chrome-white)]">
                    Seçili Hizmetler
                  </h4>
                  <div className="space-y-2">
                    {selectedServices.map((service) => (
                      <div
                        key={service.id}
                        className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <p className="font-heading font-semibold text-sm text-[var(--chrome-white)]">
                            {service.name}
                          </p>
                          <p className="text-xs text-[var(--muted-lead)]">
                            {service.duration} dakika
                          </p>
                        </div>
                        <span className="font-bold text-amber-400">
                          {service.price}₺
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preferred Date/Time */}
                {(preferredDate || preferredTime) && (
                  <div className="space-y-2">
                    <h4 className="font-heading font-semibold text-sm text-[var(--chrome-white)]">
                      Tercih Edilen Zaman
                    </h4>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                      <div className="flex items-center gap-2 text-sm text-[var(--chrome-white)]">
                        {preferredDate && (
                          <div className="flex items-center gap-1">
                            <Calendar size={14} className="text-cyan-400" />
                            <span>{preferredDate}</span>
                          </div>
                        )}
                        {preferredTime && (
                          <div className="flex items-center gap-1">
                            <Clock size={14} className="text-cyan-400" />
                            <span>{preferredTime}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-[var(--muted-lead)] mt-1">
                        * Bu sadece bir tercih, kesin randevu saati değildir
                      </p>
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[var(--muted-lead)]">Toplam Süre</span>
                    <span className="font-bold text-[var(--chrome-white)]">{totalDuration} dk</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--muted-lead)]">Toplam Tutar</span>
                    <span className="font-bold text-2xl bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                      {totalPrice}₺
                    </span>
                  </div>
                </div>

                {/* Contact Info */}
                {/* İletişim Bilgileri - Input Fields */}
                <div className="space-y-2">
                  <h4 className="font-heading font-semibold text-sm text-[var(--chrome-white)]">
                    İletişim Bilgileri
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-[var(--muted-lead)] mb-1.5">
                        Ad Soyad *
                      </label>
                      <input
                        type="text"
                        value={localName}
                        onChange={(e) => setLocalName(e.target.value)}
                        placeholder="Adınız ve soyadınız"
                        className="w-full h-12 px-4 rounded-xl bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-amber-500/50 focus:bg-white/[0.08] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--muted-lead)] mb-1.5">
                        Telefon *
                      </label>
                      <input
                        type="tel"
                        value={localPhone}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/\D/g, '');
                          setLocalPhone(cleaned.slice(0, 10));
                        }}
                        placeholder="5XX XXX XX XX"
                        maxLength={10}
                        className="w-full h-12 px-4 rounded-xl bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-amber-500/50 focus:bg-white/[0.08] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--muted-lead)] mb-1.5">
                        E-posta (Opsiyonel)
                      </label>
                      <input
                        type="email"
                        value={localEmail}
                        onChange={(e) => setLocalEmail(e.target.value)}
                        placeholder="ornek@email.com"
                        className="w-full h-12 px-4 rounded-xl bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-amber-500/50 focus:bg-white/[0.08] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--muted-lead)] mb-1.5">
                        Notlar (Opsiyonel)
                      </label>
                      <textarea
                        value={localNotes}
                        onChange={(e) => setLocalNotes(e.target.value)}
                        placeholder="Özel istekleriniz..."
                        rows={2}
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-amber-500/50 focus:bg-white/[0.08] transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-white/[0.08] space-y-3">
                <button
                  onClick={handleJoinQueue}
                  disabled={isSubmitting || !localName || !localPhone}
                  className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:shadow-2xl hover:shadow-amber-500/40 text-white font-heading font-bold text-lg transition-all duration-200 disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Ekleniyor...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={20} />
                      <span>Sıraya Ekle</span>
                    </>
                  )}
                </button>
                <p className="text-xs text-center text-[var(--muted-lead)]">
                  Sıraya eklendikten sonra işletme size bildirim gönderecektir
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
