import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Star, HelpCircle, Sparkles, MessageSquare } from 'lucide-react';
import { supportService } from '@/services/supportService';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import type { SupportTicket, SupportMessage } from '@/types/support';

interface FloatingSupportProps {
  businessId?: string;
  businessName?: string;
  userType: 'owner' | 'customer';
}

type ViewMode = 'closed' | 'menu' | 'support' | 'feedback' | 'tickets' | 'chat';

export function FloatingSupport({ businessId, businessName, userType }: FloatingSupportProps) {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const [viewMode, setViewMode] = useState<ViewMode>('closed');
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const [supportForm, setSupportForm] = useState({
    subject: '',
    message: '',
  });

  const [feedbackForm, setFeedbackForm] = useState({
    rating: 0,
    comment: '',
  });

  // Destek taleplerini yükle
  useEffect(() => {
    if (viewMode === 'tickets' && businessId) {
      loadTickets();
    }
  }, [viewMode, businessId]);

  // Mesajları yükle
  useEffect(() => {
    if (selectedTicket) {
      loadMessages();
    }
  }, [selectedTicket]);

  const loadTickets = async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const data = await supportService.getBusinessTickets(businessId);
      setTickets(data);
    } catch (error) {
      console.error('Taleplar yüklenemedi:', error);
    }
    setLoading(false);
  };

  const loadMessages = async () => {
    if (!selectedTicket) return;
    setLoading(true);
    try {
      const data = await supportService.getTicketMessages(selectedTicket.id);
      setMessages(data);
    } catch (error) {
      console.error('Mesajlar yüklenemedi:', error);
    }
    setLoading(false);
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await supportService.createTicket({
        type: 'help',
        priority: 'medium',
        subject: supportForm.subject,
        message: supportForm.message,
        businessId: businessId || 'general',
        businessName: businessName || 'Genel',
        ownerId: user.uid,
        ownerName: user.displayName || 'Anonim',
        ownerEmail: user.email || '',
        attachments: [],
      });

      addToast('✅ Destek talebiniz alındı! Size en kısa sürede dönüş yapacağız.', 'success');
      setSupportForm({ subject: '', message: '' });
      setViewMode('menu');
    } catch (error) {
      console.error('Destek talebi oluşturulamadı:', error);
      addToast('❌ Bir hata oluştu. Lütfen tekrar deneyin.', 'error');
    }
    setLoading(false);
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || feedbackForm.rating === 0) {
      addToast('⭐ Lütfen puan verin', 'warning');
      return;
    }

    setLoading(true);
    try {
      await supportService.createTicket({
        type: 'help',
        priority: 'low',
        subject: `${userType === 'owner' ? 'İşletme' : 'Müşteri'} Memnuniyeti - ${feedbackForm.rating} ⭐`,
        message: feedbackForm.comment || 'Yorum yok',
        businessId: businessId || 'feedback',
        businessName: businessName || 'Geri Bildirim',
        ownerId: user.uid,
        ownerName: user.displayName || 'Anonim',
        ownerEmail: user.email || '',
        attachments: [],
      });

      addToast('🙏 Geri bildiriminiz için teşekkürler!', 'success');
      setFeedbackForm({ rating: 0, comment: '' });
      setViewMode('menu');
    } catch (error) {
      console.error('Feedback oluşturulamadı:', error);
      addToast('❌ Bir hata oluştu. Lütfen tekrar deneyin.', 'error');
    }
    setLoading(false);
  };

  const handleSendMessage = async () => {
    if (!selectedTicket || !user || !newMessage.trim()) return;

    setLoading(true);
    try {
      await supportService.addMessage(
        selectedTicket.id,
        user.uid,
        user.displayName || 'Anonim',
        userType === 'owner' ? 'owner' : 'customer',
        newMessage,
        []
      );
      setNewMessage('');
      await loadMessages();
    } catch (error) {
      console.error('Mesaj gönderilemedi:', error);
      addToast('❌ Mesaj gönderilemedi', 'error');
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setViewMode(viewMode === 'closed' ? 'menu' : 'closed')}
        className="fixed bottom-6 right-6 z-[9998] w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white shadow-2xl hover:shadow-blue-500/50 transition-all flex items-center justify-center"
      >
        <AnimatePresence mode="wait">
          {viewMode === 'closed' ? (
            <motion.div
              key="message"
              initial={{ rotate: -180, opacity: 0, scale: 0 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 180, opacity: 0, scale: 0 }}
            >
              <MessageCircle size={28} className="drop-shadow-lg" />
            </motion.div>
          ) : (
            <motion.div
              key="close"
              initial={{ rotate: -180, opacity: 0, scale: 0 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 180, opacity: 0, scale: 0 }}
            >
              <X size={28} className="drop-shadow-lg" />
            </motion.div>
          )}
        </AnimatePresence>
        <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20"></span>
      </motion.button>

      {/* Popup Panel */}
      <AnimatePresence>
        {viewMode !== 'closed' && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-28 right-6 z-[9998] w-[400px] max-w-[calc(100vw-48px)] max-h-[600px]"
          >
            {/* Menu View */}
            {viewMode === 'menu' && (
              <div className="bg-gradient-to-b from-[var(--slate-surface)] to-[var(--slate-elevated)] rounded-3xl border border-white/10 shadow-2xl p-6 backdrop-blur-xl">
                <h3 className="text-xl font-bold text-[var(--chrome-white)] mb-1 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Nasıl yardımcı olabiliriz?
                </h3>
                <p className="text-sm text-[var(--muted-lead)] mb-6">
                  Size en iyi deneyimi sunmak için buradayız ✨
                </p>
                
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setViewMode('support')}
                    className="w-full p-5 rounded-[24px] bg-gradient-to-br from-blue-500/20 to-blue-600/10 hover:from-blue-500/30 hover:to-blue-600/20 border border-blue-500/30 text-left transition-all group relative overflow-hidden"
                  >
                    <div className="relative flex items-center gap-4">
                      <div className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-all shadow-lg">
                        <HelpCircle size={26} className="text-white drop-shadow-lg" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-[var(--chrome-white)] mb-1 text-lg">Yardım İste</p>
                        <p className="text-xs text-[var(--muted-lead)]">Sorunuzu bize iletin</p>
                      </div>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setViewMode('tickets')}
                    className="w-full p-5 rounded-[24px] bg-gradient-to-br from-purple-500/20 to-purple-600/10 hover:from-purple-500/30 hover:to-purple-600/20 border border-purple-500/30 text-left transition-all group relative overflow-hidden"
                  >
                    <div className="relative flex items-center gap-4">
                      <div className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-all shadow-lg">
                        <MessageSquare size={26} className="text-white drop-shadow-lg" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-[var(--chrome-white)] mb-1 text-lg">Taleplerim</p>
                        <p className="text-xs text-[var(--muted-lead)]">Destek taleplerini görüntüle</p>
                      </div>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setViewMode('feedback')}
                    className="w-full p-5 rounded-[24px] bg-gradient-to-br from-amber-500/20 to-orange-600/10 hover:from-amber-500/30 hover:to-orange-600/20 border border-amber-500/30 text-left transition-all group relative overflow-hidden"
                  >
                    <div className="relative flex items-center gap-4">
                      <div className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center group-hover:scale-110 transition-all shadow-lg">
                        <Sparkles size={26} className="text-white drop-shadow-lg" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-[var(--chrome-white)] mb-1 text-lg">Geri Bildirim</p>
                        <p className="text-xs text-[var(--muted-lead)]">Deneyiminizi paylaşın</p>
                      </div>
                    </div>
                  </motion.button>
                </div>
              </div>
            )}

            {/* Support Form */}
            {viewMode === 'support' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-gradient-to-b from-[var(--slate-surface)] to-[var(--slate-elevated)] rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden"
              >
                <form onSubmit={handleSupportSubmit} className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-[var(--chrome-white)] bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Yardım Talebi
                      </h3>
                      <p className="text-xs text-[var(--muted-lead)] mt-1">Size yardımcı olmaktan mutluluk duyarız</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewMode('menu')}
                      className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                    >
                      <X size={18} className="text-[var(--muted-lead)]" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-[var(--chrome-white)] mb-2">
                        Konu
                      </label>
                      <input
                        type="text"
                        value={supportForm.subject}
                        onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                        placeholder="Kısaca özetleyin..."
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-[var(--chrome-white)] placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[var(--chrome-white)] mb-2">
                        Mesajınız
                      </label>
                      <textarea
                        value={supportForm.message}
                        onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                        placeholder="Detaylı açıklama yazın..."
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-[var(--chrome-white)] placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all min-h-[120px] resize-none"
                        required
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Send size={18} />
                          Gönder
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Feedback Form */}
            {viewMode === 'feedback' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-gradient-to-b from-[var(--slate-surface)] to-[var(--slate-elevated)] rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden"
              >
                <form onSubmit={handleFeedbackSubmit} className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-[var(--chrome-white)] bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                        Geri Bildirim
                      </h3>
                      <p className="text-xs text-[var(--muted-lead)] mt-1">Görüşleriniz bizim için çok değerli</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewMode('menu')}
                      className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                    >
                      <X size={18} className="text-[var(--muted-lead)]" />
                    </button>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <p className="text-sm font-semibold text-[var(--chrome-white)] mb-4 text-center">
                        Deneyiminizi nasıl değerlendirirsiniz?
                      </p>
                      <div className="flex justify-center gap-3">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <motion.button
                            key={rating}
                            type="button"
                            whileHover={{ scale: 1.15, rotate: 10 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setFeedbackForm({ ...feedbackForm, rating })}
                            className="transition-all"
                          >
                            <Star
                              size={36}
                              className={`${
                                rating <= feedbackForm.rating
                                  ? 'fill-amber-400 text-amber-400 drop-shadow-lg'
                                  : 'text-white/20 hover:text-white/40'
                              } transition-all`}
                            />
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[var(--chrome-white)] mb-2">
                        Yorumunuz (Opsiyonel)
                      </label>
                      <textarea
                        value={feedbackForm.comment}
                        onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
                        placeholder="Ne düşünüyorsunuz?"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-[var(--chrome-white)] placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 focus:bg-white/10 transition-all min-h-[100px] resize-none"
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={loading || feedbackForm.rating === 0}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Sparkles size={18} />
                          Gönder
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Tickets List */}
            {viewMode === 'tickets' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-gradient-to-b from-[var(--slate-surface)] to-[var(--slate-elevated)] rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-[var(--chrome-white)] bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Destek Taleplerim
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewMode('menu')}
                      className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                    >
                      <X size={18} className="text-[var(--muted-lead)]" />
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {loading ? (
                      <div className="text-center py-8">
                        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      </div>
                    ) : tickets.length === 0 ? (
                      <p className="text-center text-[var(--muted-lead)] py-8">Henüz talep yok</p>
                    ) : (
                      tickets.map(ticket => (
                        <button
                          key={ticket.id}
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setViewMode('chat');
                          }}
                          className="w-full p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all"
                        >
                          <p className="font-bold text-[var(--chrome-white)] mb-1">{ticket.subject}</p>
                          <p className="text-xs text-[var(--muted-lead)]">
                            {ticket.status} • {new Date(ticket.createdAt).toLocaleDateString('tr-TR')}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Chat View */}
            {viewMode === 'chat' && selectedTicket && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-gradient-to-b from-[var(--slate-surface)] to-[var(--slate-elevated)] rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col"
                style={{ height: '500px' }}
              >
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[var(--chrome-white)] truncate">{selectedTicket.subject}</h3>
                      <p className="text-xs text-[var(--muted-lead)]">{selectedTicket.status}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedTicket(null);
                        setViewMode('tickets');
                      }}
                      className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors flex-shrink-0"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-2xl ${
                          msg.senderId === user?.uid
                            ? 'bg-blue-500 text-white'
                            : 'bg-white/10 text-[var(--chrome-white)]'
                        }`}
                      >
                        <p className="text-xs font-semibold mb-1 opacity-70">{msg.senderName}</p>
                        <p className="text-sm">{msg.message}</p>
                        <p className="text-xs opacity-60 mt-1">
                          {new Date(msg.createdAt).toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t border-white/10">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !loading && handleSendMessage()}
                      placeholder="Mesaj yazın..."
                      className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl text-[var(--chrome-white)] placeholder:text-white/30 focus:outline-none focus:border-blue-500/50"
                      disabled={loading}
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSendMessage}
                      disabled={loading || !newMessage.trim()}
                      className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white flex items-center justify-center disabled:opacity-50 transition-all"
                    >
                      <Send size={18} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
