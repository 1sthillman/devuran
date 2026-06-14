import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Star, MessageSquare, HelpCircle, Sparkles } from 'lucide-react';
import { supportService } from '@/services/supportService';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import type { SupportTicket, SupportMessage } from '@/types/support';

interface SupportMenuProps {
  isOpen: boolean;
  onClose: () => void;
  businessId?: string;
  businessName?: string;
  userType: 'owner' | 'customer';
}

type ViewMode = 'menu' | 'support' | 'feedback' | 'tickets' | 'chat';

export function SupportMenu({ isOpen, onClose, businessId, businessName, userType }: SupportMenuProps) {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const [viewMode, setViewMode] = useState<ViewMode>('menu');
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

  useEffect(() => {
    if (isOpen && viewMode === 'tickets' && user) {
      loadTickets();
    }
  }, [isOpen, viewMode, user]);

  useEffect(() => {
    if (selectedTicket) {
      loadMessages();
    }
  }, [selectedTicket]);

  const loadTickets = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await supportService.getUserTickets(user.uid);
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

      addToast('✅ Destek talebiniz alındı!', 'success');
      setSupportForm({ subject: '', message: '' });
      setViewMode('menu');
    } catch (error) {
      console.error('Destek talebi oluşturulamadı:', error);
      addToast('❌ Bir hata oluştu', 'error');
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
        subject: `Memnuniyet - ${feedbackForm.rating} ⭐`,
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
      addToast('❌ Bir hata oluştu', 'error');
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-gradient-to-br from-[var(--slate-surface)] to-[var(--slate-elevated)] rounded-3xl border border-white/10 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Menu View */}
          {viewMode === 'menu' && (
            <>
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-[var(--chrome-white)]">Yardım Merkezi</h3>
                  <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-3">
                <button
                  onClick={() => setViewMode('support')}
                  className="w-full p-4 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <HelpCircle size={24} className="text-[var(--chrome-white)]" />
                    </div>
                    <div>
                      <p className="font-bold text-[var(--chrome-white)] mb-0.5">Yardım İste</p>
                      <p className="text-xs text-[var(--muted-lead)]">Sorunuzu bize iletin</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setViewMode('tickets')}
                  className="w-full p-4 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <MessageSquare size={24} className="text-[var(--chrome-white)]" />
                    </div>
                    <div>
                      <p className="font-bold text-[var(--chrome-white)] mb-0.5">Taleplerim</p>
                      <p className="text-xs text-[var(--muted-lead)]">Destek taleplerinizi görün</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setViewMode('feedback')}
                  className="w-full p-4 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Sparkles size={24} className="text-[var(--chrome-white)]" />
                    </div>
                    <div>
                      <p className="font-bold text-[var(--chrome-white)] mb-0.5">Geri Bildirim</p>
                      <p className="text-xs text-[var(--muted-lead)]">Deneyiminizi paylaşın</p>
                    </div>
                  </div>
                </button>
              </div>
            </>
          )}

          {/* Support Form */}
          {viewMode === 'support' && (
            <form onSubmit={handleSupportSubmit} className="flex flex-col h-full">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-[var(--chrome-white)]">Yardım Talebi</h3>
                  <button type="button" onClick={() => setViewMode('menu')} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[var(--chrome-white)] mb-2">Konu</label>
                  <input
                    type="text"
                    value={supportForm.subject}
                    onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                    placeholder="Kısaca özetleyin..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[var(--chrome-white)] placeholder:text-white/30 focus:outline-none focus:border-blue-500/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--chrome-white)] mb-2">Mesajınız</label>
                  <textarea
                    value={supportForm.message}
                    onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                    placeholder="Detaylı açıklama..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[var(--chrome-white)] placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 min-h-[120px] resize-none"
                    required
                  />
                </div>
              </div>

              <div className="p-6 border-t border-white/10">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Send size={18} />Gönder</>}
                </button>
              </div>
            </form>
          )}

          {/* Feedback Form */}
          {viewMode === 'feedback' && (
            <form onSubmit={handleFeedbackSubmit} className="flex flex-col h-full">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-[var(--chrome-white)]">Geri Bildirim</h3>
                  <button type="button" onClick={() => setViewMode('menu')} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div>
                  <p className="text-sm font-semibold text-[var(--chrome-white)] mb-4 text-center">Deneyiminizi değerlendirin</p>
                  <div className="flex justify-center gap-3">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setFeedbackForm({ ...feedbackForm, rating })}
                      >
                        <Star
                          size={36}
                          className={`${rating <= feedbackForm.rating ? 'fill-amber-400 text-amber-400' : 'text-white/20'} transition-all`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--chrome-white)] mb-2">Yorumunuz</label>
                  <textarea
                    value={feedbackForm.comment}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
                    placeholder="Ne düşünüyorsunuz?"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[var(--chrome-white)] placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 min-h-[100px] resize-none"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-white/10">
                <button
                  type="submit"
                  disabled={loading || feedbackForm.rating === 0}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Sparkles size={18} />Gönder</>}
                </button>
              </div>
            </form>
          )}

          {/* Tickets List */}
          {viewMode === 'tickets' && (
            <>
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-[var(--chrome-white)]">Taleplerim</h3>
                  <button onClick={() => setViewMode('menu')} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-2">
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
                      className="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all"
                    >
                      <p className="font-bold text-[var(--chrome-white)] mb-1">{ticket.subject}</p>
                      <p className="text-xs text-[var(--muted-lead)]">
                        {ticket.status} • {new Date(ticket.createdAt).toLocaleDateString('tr-TR')}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </>
          )}

          {/* Chat View */}
          {viewMode === 'chat' && selectedTicket && (
            <>
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

              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '400px' }}>
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-xl ${
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
                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[var(--chrome-white)] placeholder:text-white/30 focus:outline-none focus:border-blue-500/50"
                    disabled={loading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={loading || !newMessage.trim()}
                    className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white flex items-center justify-center disabled:opacity-50 transition-all"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
