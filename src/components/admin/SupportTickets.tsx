import { useEffect, useState } from 'react';
import { Search, LifeBuoy, MessageSquare, Clock, CheckCircle, XCircle, AlertCircle, Send, X } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Ticket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'billing' | 'general' | 'complaint';
  createdAt: string;
  updatedAt: string;
  responses?: Array<{
    message: string;
    by: string;
    at: string;
  }>;
}

export function SupportTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [searchTerm, filterStatus, filterPriority, tickets]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const ticketsSnapshot = await getDocs(collection(db, 'support_tickets'));
      const ticketsData = ticketsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Ticket[];
      
      setTickets(ticketsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Load tickets error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTickets = () => {
    let filtered = [...tickets];

    if (searchTerm) {
      filtered = filtered.filter(ticket =>
        ticket.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === filterStatus);
    }

    if (filterPriority !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === filterPriority);
    }

    setFilteredTickets(filtered);
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: Ticket['status']) => {
    try {
      await updateDoc(doc(db, 'support_tickets', ticketId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      await loadTickets();
    } catch (error) {
      console.error('Update status error:', error);
      alert('Hata: ' + error);
    }
  };

  const handleSendResponse = async () => {
    if (!selectedTicket || !responseMessage.trim()) return;

    try {
      setSending(true);
      const responses = selectedTicket.responses || [];
      responses.push({
        message: responseMessage,
        by: 'admin',
        at: new Date().toISOString(),
      });

      await updateDoc(doc(db, 'support_tickets', selectedTicket.id), {
        responses,
        status: 'in_progress',
        updatedAt: new Date().toISOString(),
      });

      setResponseMessage('');
      await loadTickets();
      
      // Güncellenen ticket'ı seç
      const updatedTicket = tickets.find(t => t.id === selectedTicket.id);
      if (updatedTicket) {
        setSelectedTicket({ ...updatedTicket, responses });
      }
    } catch (error) {
      console.error('Send response error:', error);
      alert('Hata: ' + error);
    } finally {
      setSending(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-300';
      case 'high': return 'bg-orange-500/20 text-orange-300';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300';
      case 'low': return 'bg-blue-500/20 text-blue-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500/20 text-blue-300';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-300';
      case 'resolved': return 'bg-green-500/20 text-green-300';
      case 'closed': return 'bg-gray-500/20 text-gray-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Destek Talepleri</h1>
        <p className="text-white/60 mt-1">Kullanıcı destek taleplerini yönet</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <LifeBuoy className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-white/60 text-xs sm:text-sm">Açık</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white">{tickets.filter(t => t.status === 'open').length}</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="text-white/60 text-xs sm:text-sm">İşlemde</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white">{tickets.filter(t => t.status === 'in_progress').length}</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-white/60 text-xs sm:text-sm">Çözüldü</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white">{tickets.filter(t => t.status === 'resolved').length}</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-white/60 text-xs sm:text-sm">Acil</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white">{tickets.filter(t => t.priority === 'urgent').length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="İsim, konu veya email ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="open">Açık</option>
            <option value="in_progress">İşlemde</option>
            <option value="resolved">Çözüldü</option>
            <option value="closed">Kapalı</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as any)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">Tüm Öncelikler</option>
            <option value="urgent">Acil</option>
            <option value="high">Yüksek</option>
            <option value="medium">Orta</option>
            <option value="low">Düşük</option>
          </select>
        </div>

        <div className="mt-4">
          <p className="text-white/60 text-sm">{filteredTickets.length} talep bulundu</p>
        </div>
      </div>

      {/* Tickets List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredTickets.map((ticket) => (
          <div
            key={ticket.id}
            className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 hover:border-white/20 transition-all cursor-pointer"
            onClick={() => {
              setSelectedTicket(ticket);
              setShowDetailModal(true);
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-start gap-3 flex-wrap">
                  <h3 className="text-base sm:text-lg font-semibold text-white">{ticket.subject}</h3>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority === 'urgent' ? 'Acil' : ticket.priority === 'high' ? 'Yüksek' : ticket.priority === 'medium' ? 'Orta' : 'Düşük'}
                  </span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                    {ticket.status === 'open' ? 'Açık' : ticket.status === 'in_progress' ? 'İşlemde' : ticket.status === 'resolved' ? 'Çözüldü' : 'Kapalı'}
                  </span>
                </div>

                <p className="text-sm text-white/60 line-clamp-2">{ticket.message}</p>

                <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-white/40">
                  <span>{ticket.userName}</span>
                  <span>• {ticket.userEmail}</span>
                  <span>• {new Date(ticket.createdAt).toLocaleDateString('tr-TR')}</span>
                  {ticket.responses && ticket.responses.length > 0 && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {ticket.responses.length} yanıt
                    </span>
                  )}
                </div>
              </div>

              <div className="flex sm:flex-col gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateStatus(ticket.id, 'in_progress');
                  }}
                  className="px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-lg text-xs font-medium transition-colors"
                >
                  İşleme Al
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateStatus(ticket.id, 'resolved');
                  }}
                  className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg text-xs font-medium transition-colors"
                >
                  Çözüldü
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-4 sm:p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white">Talep Detayı</h3>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedTicket(null);
                  setResponseMessage('');
                }}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Ticket Info */}
              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-1">{selectedTicket.subject}</h4>
                    <p className="text-sm text-white/60">{selectedTicket.userName} • {selectedTicket.userEmail}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority}
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTicket.status)}`}>
                      {selectedTicket.status}
                    </span>
                  </div>
                </div>
                <p className="text-white/80">{selectedTicket.message}</p>
                <p className="text-xs text-white/40">{new Date(selectedTicket.createdAt).toLocaleString('tr-TR')}</p>
              </div>

              {/* Responses */}
              {selectedTicket.responses && selectedTicket.responses.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-white/80">Yanıtlar</h4>
                  {selectedTicket.responses.map((response, idx) => (
                    <div key={idx} className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">{response.by === 'admin' ? 'Admin' : 'Kullanıcı'}</span>
                        <span className="text-xs text-white/40">{new Date(response.at).toLocaleString('tr-TR')}</span>
                      </div>
                      <p className="text-sm text-white/80">{response.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Response Form */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-white/80">Yanıt Gönder</h4>
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Yanıtınızı yazın..."
                  rows={4}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500 resize-none"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleSendResponse}
                    disabled={sending || !responseMessage.trim()}
                    className="flex-1 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Gönder
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Status Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
                <button
                  onClick={() => handleUpdateStatus(selectedTicket.id, 'in_progress')}
                  className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-xl text-sm font-medium transition-colors"
                >
                  İşleme Al
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')}
                  className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-xl text-sm font-medium transition-colors"
                >
                  Çözüldü Olarak İşaretle
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedTicket.id, 'closed')}
                  className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 rounded-xl text-sm font-medium transition-colors"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
