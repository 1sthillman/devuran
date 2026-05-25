import { useEffect, useState } from 'react';
import { Search, CheckCircle, XCircle, Clock, Eye, FileText, Building2, User } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ApprovalItem {
  id: string;
  type: 'business' | 'staff' | 'document' | 'premium_request';
  name: string;
  businessName?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  details: any;
}

export function ApprovalManagement() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [filteredApprovals, setFilteredApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'business' | 'staff' | 'document' | 'premium_request'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadApprovals();
  }, []);

  useEffect(() => {
    filterApprovals();
  }, [searchTerm, filterType, filterStatus, approvals]);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const items: ApprovalItem[] = [];

      // Bekleyen işletmeleri yükle
      const businessesSnapshot = await getDocs(collection(db, 'salons'));
      businessesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!data.isApproved || data.approvalStatus === 'pending') {
          items.push({
            id: doc.id,
            type: 'business',
            name: data.name,
            status: data.approvalStatus || 'pending',
            createdAt: data.createdAt || new Date().toISOString(),
            details: data,
          });
        }
      });

      // Bekleyen personelleri yükle
      const staffSnapshot = await getDocs(collection(db, 'staff'));
      staffSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.approvalStatus === 'pending') {
          items.push({
            id: doc.id,
            type: 'staff',
            name: data.name,
            businessName: data.salonName,
            status: 'pending',
            createdAt: data.createdAt || new Date().toISOString(),
            details: data,
          });
        }
      });

      setApprovals(items);
    } catch (error) {
      console.error('Load approvals error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterApprovals = () => {
    let filtered = [...approvals];

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.businessName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(item => item.status === filterStatus);
    }

    setFilteredApprovals(filtered);
  };

  const handleApprove = async (item: ApprovalItem) => {
    if (!confirm(`${item.name} onaylamak istediğinizden emin misiniz?`)) return;

    try {
      const collectionName = item.type === 'business' ? 'salons' : item.type === 'staff' ? 'staff' : 'documents';
      await updateDoc(doc(db, collectionName, item.id), {
        approvalStatus: 'approved',
        isApproved: true,
        approvedAt: new Date().toISOString(),
        approvedBy: 'admin',
      });

      if (item.type === 'business') {
        await updateDoc(doc(db, collectionName, item.id), {
          isActive: true,
        });
      }

      await loadApprovals();
      alert('Başarıyla onaylandı!');
    } catch (error) {
      console.error('Approve error:', error);
      alert('Hata: ' + error);
    }
  };

  const handleReject = async (item: ApprovalItem) => {
    const reason = prompt('Ret nedeni:');
    if (!reason) return;

    try {
      const collectionName = item.type === 'business' ? 'salons' : item.type === 'staff' ? 'staff' : 'documents';
      await updateDoc(doc(db, collectionName, item.id), {
        approvalStatus: 'rejected',
        isApproved: false,
        rejectedAt: new Date().toISOString(),
        rejectedBy: 'admin',
        rejectionReason: reason,
      });

      await loadApprovals();
      alert('Başarıyla reddedildi!');
    } catch (error) {
      console.error('Reject error:', error);
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
        <h1 className="text-3xl font-bold text-white">Onay Süreçleri</h1>
        <p className="text-white/60 mt-1">Bekleyen onayları görüntüle ve yönet</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="text-white/60 text-sm">Bekleyen</span>
          </div>
          <p className="text-2xl font-bold text-white">{approvals.filter(a => a.status === 'pending').length}</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-white/60 text-sm">Onaylanan</span>
          </div>
          <p className="text-2xl font-bold text-white">{approvals.filter(a => a.status === 'approved').length}</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-white/60 text-sm">Reddedilen</span>
          </div>
          <p className="text-2xl font-bold text-white">{approvals.filter(a => a.status === 'rejected').length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="İsim ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">Tüm Tipler</option>
            <option value="business">İşletme</option>
            <option value="staff">Personel</option>
            <option value="document">Belge</option>
            <option value="premium_request">Premium Talep</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="pending">Bekleyen</option>
            <option value="approved">Onaylanan</option>
            <option value="rejected">Reddedilen</option>
          </select>
        </div>

        <div className="mt-4">
          <p className="text-white/60 text-sm">{filteredApprovals.length} onay bulundu</p>
        </div>
      </div>

      {/* Approvals List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredApprovals.map((item) => (
          <div
            key={item.id}
            className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 hover:border-white/20 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  {item.type === 'business' && <Building2 className="w-5 h-5 text-purple-400" />}
                  {item.type === 'staff' && <User className="w-5 h-5 text-blue-400" />}
                  {item.type === 'document' && <FileText className="w-5 h-5 text-green-400" />}
                  <h3 className="text-base sm:text-lg font-semibold text-white">{item.name}</h3>
                  <span className={`
                    px-3 py-1 text-xs font-semibold rounded-full
                    ${item.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' : ''}
                    ${item.status === 'approved' ? 'bg-green-500/20 text-green-300' : ''}
                    ${item.status === 'rejected' ? 'bg-red-500/20 text-red-300' : ''}
                  `}>
                    {item.status === 'pending' && 'Beklemede'}
                    {item.status === 'approved' && 'Onaylandı'}
                    {item.status === 'rejected' && 'Reddedildi'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-white/60">
                  <span className="capitalize">{item.type === 'business' ? 'İşletme' : item.type === 'staff' ? 'Personel' : item.type === 'document' ? 'Belge' : 'Premium Talep'}</span>
                  {item.businessName && <span>• {item.businessName}</span>}
                  <span>• {new Date(item.createdAt).toLocaleDateString('tr-TR')}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedItem(item);
                    setShowDetailModal(true);
                  }}
                  className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-xl text-sm font-medium transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {item.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(item)}
                      className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-xl text-sm font-medium transition-colors"
                    >
                      Onayla
                    </button>
                    <button
                      onClick={() => handleReject(item)}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl text-sm font-medium transition-colors"
                    >
                      Reddet
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white">Detaylar</h3>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedItem(null);
                }}
                className="text-white/60 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">İsim</label>
                <p className="text-white">{selectedItem.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">Tip</label>
                <p className="text-white capitalize">{selectedItem.type}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">Durum</label>
                <p className="text-white capitalize">{selectedItem.status}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">Oluşturulma Tarihi</label>
                <p className="text-white">{new Date(selectedItem.createdAt).toLocaleString('tr-TR')}</p>
              </div>

              {selectedItem.details && (
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1">Detaylar</label>
                  <pre className="text-xs text-white/80 bg-white/5 p-4 rounded-xl overflow-auto max-h-64">
                    {JSON.stringify(selectedItem.details, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedItem(null);
                  }}
                  className="flex-1 px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
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
