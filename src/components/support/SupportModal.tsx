import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CheckCircle } from 'lucide-react';
import { supportService } from '@/services/supportService';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import type { SupportTicketType, SupportTicketPriority } from '@/types/support';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  businessName: string;
}

export function SupportModal({ isOpen, onClose, businessId, businessName }: SupportModalProps) {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    type: 'help' as SupportTicketType,
    priority: 'medium' as SupportTicketPriority,
    subject: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setLoading(true);
    try {
      await supportService.createTicket({
        ...formData,
        businessId,
        businessName,
        ownerId: user.uid,
        ownerName: user.displayName || 'Anonim',
        ownerEmail: user.email || '',
        message: formData.description,
        attachments: [],
      });
      
      setSubmitted(true);
      addToast('Destek talebiniz alındı. En kısa sürede size dönüş yapacağız.', 'success');
      
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setFormData({
          type: 'help',
          priority: 'medium',
          subject: '',
          description: '',
        });
      }, 2000);
    } catch (error) {
      console.error('Destek talebi oluşturulamadı:', error);
      addToast('Bir hata oluştu. Lütfen tekrar deneyin.', 'error');
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg bg-[var(--slate-surface)] rounded-3xl border border-white/10 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h2 className="text-xl font-heading font-bold text-[var(--chrome-white)]">
              Destek Talebi
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <X size={20} className="text-[var(--muted-lead)]" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {submitted ? (
              <div className="text-center py-8">
                <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
                <h3 className="text-xl font-bold text-[var(--chrome-white)] mb-2">
                  Talebiniz Alındı
                </h3>
                <p className="text-[var(--muted-lead)]">
                  En kısa sürede size dönüş yapacağız
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[var(--chrome-white)] mb-2">
                    Konu
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[var(--chrome-white)] focus:outline-none focus:border-white/20"
                    placeholder="Sorun veya isteğinizi kısaca özetleyin"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--chrome-white)] mb-2">
                    Açıklama
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[var(--chrome-white)] focus:outline-none focus:border-white/20 min-h-[120px] resize-none"
                    placeholder="Detaylı açıklama yazın..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--chrome-white)] mb-2">
                      Tür
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as SupportTicketType })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[var(--chrome-white)] focus:outline-none focus:border-white/20"
                    >
                      <option value="help">Yardım</option>
                      <option value="bug">Hata</option>
                      <option value="feature">Özellik İsteği</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[var(--chrome-white)] mb-2">
                      Öncelik
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as SupportTicketPriority })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[var(--chrome-white)] focus:outline-none focus:border-white/20"
                    >
                      <option value="low">Düşük</option>
                      <option value="medium">Orta</option>
                      <option value="high">Yüksek</option>
                      <option value="urgent">Acil</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    'Gönderiliyor...'
                  ) : (
                    <>
                      <Send size={18} />
                      Gönder
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
