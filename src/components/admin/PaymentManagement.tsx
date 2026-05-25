import { useEffect, useState } from 'react';
import { Search, DollarSign, CreditCard, CheckCircle, XCircle, Clock, Calendar, TrendingUp, Filter, Edit, Trash2, RotateCcw, X } from 'lucide-react';
import { collection, getDocs, query, where, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { auditLogService } from '@/services/adminService';

interface Payment {
  id: string;
  businessId: string;
  businessName: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  method: 'bank_transfer' | 'credit_card' | 'cash' | 'online';
  type: 'subscription' | 'deposit' | 'full_payment';
  createdAt: string;
  completedAt?: string;
  refundedAt?: string;
  refundReason?: string;
}

export function PaymentManagement() {
  const { user } = useAuthStore();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'failed' | 'refunded'>('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    failed: 0,
    totalAmount: 0,
  });

  useEffect(() => {
    loadPayments();
  }, []);

  useEffect(() => {
    filterPayments();
    calculateStats();
  }, [searchTerm, filterStatus, payments]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      // Subscriptions'dan ödeme verilerini çek
      const subscriptionsSnapshot = await getDocs(collection(db, 'subscriptions'));
      const paymentsData: Payment[] = [];

      subscriptionsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.lastPaymentDate) {
          paymentsData.push({
            id: doc.id,
            businessId: data.businessId,
            businessName: data.businessName,
            amount: data.lastPaymentAmount || data.price || 0,
            currency: data.currency || 'TRY',
            status: 'completed',
            method: 'online',
            type: 'subscription',
            createdAt: data.lastPaymentDate,
            completedAt: data.lastPaymentDate,
          });
        }
      });

      setPayments(paymentsData);
    } catch (error) {
      console.error('Load payments error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPayments = () => {
    let filtered = [...payments];

    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.id?.includes(searchTerm)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(payment => payment.status === filterStatus);
    }

    setFilteredPayments(filtered);
  };

  const calculateStats = () => {
    const total = payments.length;
    const completed = payments.filter(p => p.status === 'completed').length;
    const pending = payments.filter(p => p.status === 'pending').length;
    const failed = payments.filter(p => p.status === 'failed').length;
    const totalAmount = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    setStats({ total, completed, pending, failed, totalAmount });
  };

  const handleUpdatePayment = async () => {
    if (!editingPayment || !user) return;

    try {
      await updateDoc(doc(db, 'paymentTransactions', editingPayment.id), {
        amount: editingPayment.amount,
        status: editingPayment.status,
        method: editingPayment.method,
        updatedAt: new Date().toISOString(),
      });

      await auditLogService.log({
        adminId: user.uid,
        adminName: user.displayName || 'Admin',
        action: 'update_payment',
        targetType: 'payment',
        targetId: editingPayment.id,
        targetName: editingPayment.businessName,
        metadata: { amount: editingPayment.amount, status: editingPayment.status },
      });

      await loadPayments();
      setShowEditModal(false);
      setEditingPayment(null);
      alert('Ödeme güncellendi!');
    } catch (error) {
      console.error('Update payment error:', error);
      alert('Hata: ' + error);
    }
  };

  const handleRefund = async (payment: Payment) => {
    if (!user) return;
    const reason = prompt('İade nedeni:');
    if (!reason) return;

    if (!confirm(`${payment.amount} ₺ iade edilecek. Emin misiniz?`)) return;

    try {
      await updateDoc(doc(db, 'paymentTransactions', payment.id), {
        status: 'refunded',
        refundedAt: new Date().toISOString(),
        refundReason: reason,
        updatedAt: new Date().toISOString(),
      });

      await auditLogService.log({
        adminId: user.uid,
        adminName: user.displayName || 'Admin',
        action: 'refund_payment',
        targetType: 'payment',
        targetId: payment.id,
        targetName: payment.businessName,
        metadata: { amount: payment.amount, reason },
      });

      await loadPayments();
      alert('Ödeme iade edildi!');
    } catch (error) {
      console.error('Refund error:', error);
      alert('Hata: ' + error);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!user) return;
    if (!confirm('Bu ödeme kaydını silmek istediğinizden emin misiniz?')) return;

    try {
      await deleteDoc(doc(db, 'paymentTransactions', paymentId));

      await auditLogService.log({
        adminId: user.uid,
        adminName: user.displayName || 'Admin',
        action: 'delete_payment',
        targetType: 'payment',
        targetId: paymentId,
        targetName: paymentId,
      });

      await loadPayments();
      alert('Ödeme kaydı silindi!');
    } catch (error) {
      console.error('Delete payment error:', error);
      alert('Hata: ' + error);
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
        <h1 className="text-3xl font-bold text-white">Ödeme Yönetimi</h1>
        <p className="text-white/60 mt-1">Tüm ödemeleri görüntüle ve yönet</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-white/60 text-sm">Toplam Ödeme</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-white/60 text-sm">Tamamlanan</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.completed}</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="text-white/60 text-sm">Bekleyen</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.pending}</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-white/60 text-sm">Toplam Tutar</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalAmount.toLocaleString()} ₺</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="İşletme adı ara..."
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
            <option value="completed">Tamamlandı</option>
            <option value="pending">Beklemede</option>
            <option value="failed">Başarısız</option>
            <option value="refunded">İade Edildi</option>
          </select>
        </div>

        <div className="mt-4">
          <p className="text-white/60 text-sm">{filteredPayments.length} ödeme bulundu</p>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase">İşletme</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase">Tutar</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase">Yöntem</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase">Tip</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase">Durum</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase">Tarih</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{payment.businessName}</div>
                    <div className="text-sm text-white/40">{payment.businessId.slice(0, 8)}...</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-white">{payment.amount.toLocaleString()} {payment.currency}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-white/40" />
                      <span className="text-sm text-white/80 capitalize">{payment.method.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-white/80 capitalize">{payment.type.replace('_', ' ')}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`
                      px-3 py-1 text-xs font-semibold rounded-full
                      ${payment.status === 'completed' ? 'bg-green-500/20 text-green-300' : ''}
                      ${payment.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' : ''}
                      ${payment.status === 'failed' ? 'bg-red-500/20 text-red-300' : ''}
                      ${payment.status === 'refunded' ? 'bg-gray-500/20 text-gray-300' : ''}
                    `}>
                      {payment.status === 'completed' && 'Tamamlandı'}
                      {payment.status === 'pending' && 'Beklemede'}
                      {payment.status === 'failed' && 'Başarısız'}
                      {payment.status === 'refunded' && 'İade'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                    {new Date(payment.createdAt).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingPayment(payment);
                          setShowEditModal(true);
                        }}
                        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {payment.status === 'completed' && (
                        <button
                          onClick={() => handleRefund(payment)}
                          className="p-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-lg transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeletePayment(payment.id)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Ödeme Düzenle</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingPayment(null);
                }}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">İşletme</label>
                <input
                  type="text"
                  value={editingPayment.businessName}
                  disabled
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white/60 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Tutar (₺)</label>
                  <input
                    type="number"
                    value={editingPayment.amount}
                    onChange={(e) => setEditingPayment({ ...editingPayment, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Para Birimi</label>
                  <input
                    type="text"
                    value={editingPayment.currency}
                    disabled
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white/60 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Durum</label>
                  <select
                    value={editingPayment.status}
                    onChange={(e) => setEditingPayment({ ...editingPayment, status: e.target.value as any })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="pending">Beklemede</option>
                    <option value="completed">Tamamlandı</option>
                    <option value="failed">Başarısız</option>
                    <option value="refunded">İade Edildi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Yöntem</label>
                  <select
                    value={editingPayment.method}
                    onChange={(e) => setEditingPayment({ ...editingPayment, method: e.target.value as any })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="bank_transfer">Banka Transferi</option>
                    <option value="credit_card">Kredi Kartı</option>
                    <option value="cash">Nakit</option>
                    <option value="online">Online</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleUpdatePayment}
                  className="flex-1 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all"
                >
                  Kaydet
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingPayment(null);
                  }}
                  className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
