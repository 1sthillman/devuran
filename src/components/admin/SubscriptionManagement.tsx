// @ts-nocheck
import { useEffect, useState } from 'react';
import { Search, Package, Plus, Calendar, DollarSign, X } from 'lucide-react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { adminSubscriptionService, auditLogService } from '@/services/adminService';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { PromptModal } from '@/components/admin/PromptModal';
import type { BusinessSubscription } from '@/types/subscription';

export function SubscriptionManagement() {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const [subscriptions, setSubscriptions] = useState<BusinessSubscription[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<BusinessSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'trial' | 'expired' | 'cancelled' | 'frozen' | 'pending'>('all');
  const [selectedSubscription, setSelectedSubscription] = useState<BusinessSubscription | null>(null);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showManualPremiumModal, setShowManualPremiumModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [extendDays, setExtendDays] = useState('30');
  const [manualPremiumData, setManualPremiumData] = useState({
    businessId: '',
    planType: 'premium',
    days: '30',
  });

  // Modal states
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'success' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => {},
  });

  const [promptModal, setPromptModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    placeholder?: string;
    multiline?: boolean;
    onConfirm: (value: string) => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  useEffect(() => {
    filterSubscriptions();
  }, [searchTerm, filterStatus, subscriptions]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const subscriptionsSnapshot = await getDocs(collection(db, 'subscriptions'));
      const subscriptionsData = subscriptionsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as BusinessSubscription[];
      
      setSubscriptions(subscriptionsData);
    } catch (error) {
      console.error('Load subscriptions error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSubscriptions = () => {
    let filtered = [...subscriptions];

    if (searchTerm) {
      filtered = filtered.filter(sub =>
        sub.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.businessId?.includes(searchTerm)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(sub => sub.status === filterStatus);
    }

    setFilteredSubscriptions(filtered);
  };

  const handleExtendSubscription = async () => {
    if (!selectedSubscription) return;

    try {
      await adminSubscriptionService.extendSubscription(
        selectedSubscription.id,
        parseInt(extendDays),
        user?.uid || 'admin',
        user?.displayName || 'Admin'
      );
      await loadSubscriptions();
      setShowExtendModal(false);
      setSelectedSubscription(null);
      alert(`Abonelik ${extendDays} gün uzatıldı!`);
    } catch (error) {
      alert('Hata: ' + error);
    }
  };

  const handleGrantManualPremium = async () => {
    if (!manualPremiumData.businessId) {
      alert('Lütfen işletme ID girin!');
      return;
    }

    try {
      await adminSubscriptionService.grantManualPremium(
        manualPremiumData.businessId,
        manualPremiumData.planType,
        parseInt(manualPremiumData.days),
        user?.uid || 'admin',
        user?.displayName || 'Admin'
      );
      await loadSubscriptions();
      setShowManualPremiumModal(false);
      setManualPremiumData({ businessId: '', planType: 'premium', days: '30' });
      alert('Manuel premium başarıyla verildi!');
    } catch (error) {
      alert('Hata: ' + error);
    }
  };

  const handleFreezeSubscription = async (subscriptionId: string) => {
    if (!confirm('Bu aboneliği dondurmak istediğinizden emin misiniz?')) return;

    try {
      await adminSubscriptionService.freezeSubscription(
        subscriptionId,
        user?.uid || 'admin',
        user?.displayName || 'Admin'
      );
      await loadSubscriptions();
      alert('Abonelik donduruldu!');
    } catch (error) {
      alert('Hata: ' + error);
    }
  };

  const handleUnfreezeSubscription = async (subscriptionId: string) => {
    try {
      await adminSubscriptionService.unfreezeSubscription(
        subscriptionId,
        user?.uid || 'admin',
        user?.displayName || 'Admin'
      );
      await loadSubscriptions();
      alert('Abonelik aktif hale getirildi!');
    } catch (error) {
      alert('Hata: ' + error);
    }
  };

  const handleUpgradePlan = async (subscriptionId: string, newPlan: string) => {
    if (!confirm(`Planı "${newPlan}" olarak yükseltmek istediğinizden emin misiniz?`)) return;

    try {
      await adminSubscriptionService.upgradePlan(
        subscriptionId,
        newPlan,
        user?.uid || 'admin',
        user?.displayName || 'Admin'
      );
      await loadSubscriptions();
      alert('Plan yükseltildi!');
    } catch (error) {
      alert('Hata: ' + error);
    }
  };

  const handleApproveSubscription = async (subscriptionId: string) => {
    console.log('🎯 [1/5] Handle Approve Subscription called');
    console.log('📋 Parameters:', { 
      subscriptionId, 
      user: {
        uid: user?.uid,
        email: user?.email,
        displayName: user?.displayName
      }
    });
    
    setConfirmModal({
      isOpen: true,
      title: '✅ Aboneliği Onayla',
      message: 'Bu aboneliği onaylamak istediğinizden emin misiniz?\n\nOnaylandıktan sonra işletme anasayfada görünecek ve müşteriler randevu alabilecek.',
      type: 'success',
      onConfirm: async () => {
        console.log('🎯 [2/5] User confirmed approval in modal');
        setActionLoading(true);
        console.log('🎯 [3/5] Action loading set to true');
        
        try {
          console.log('🎯 [4/5] Calling adminSubscriptionService.approveSubscription...');
          console.log('📤 Service call parameters:', {
            subscriptionId,
            adminId: user?.uid || 'admin',
            adminName: user?.displayName || 'Admin'
          });
          
          const result = await adminSubscriptionService.approveSubscription(
            subscriptionId,
            user?.uid || 'admin',
            user?.displayName || 'Admin'
          );
          
          console.log('✅ [5/5] Service call returned:', result);
          console.log('🔄 Reloading subscriptions...');
          
          await loadSubscriptions();
          
          console.log('✅ Subscriptions reloaded successfully');
          addToast('✅ Abonelik başarıyla onaylandı! İşletme artık anasayfada görünüyor.', 'success');
          setConfirmModal({ ...confirmModal, isOpen: false });
        } catch (error: any) {
          console.error('❌ Approval error caught in component:', error);
          console.error('❌ Error type:', typeof error);
          console.error('❌ Error constructor:', error?.constructor?.name);
          console.error('❌ Error message:', error?.message);
          console.error('❌ Error code:', error?.code);
          console.error('❌ Error details:', JSON.stringify(error, null, 2));
          
          const errorMessage = error.message || error.toString() || 'Hata oluştu';
          addToast(`❌ Onaylama hatası: ${errorMessage}`, 'error');
        } finally {
          console.log('🔚 Finally block - setting action loading to false');
          setActionLoading(false);
        }
      },
    });
  };

  const handleRejectSubscription = async (subscriptionId: string) => {
    setPromptModal({
      isOpen: true,
      title: '❌ Aboneliği Reddet',
      message: 'Reddetme sebebini girin:',
      placeholder: 'Örn: Ödeme bilgileri eksik',
      multiline: true,
      onConfirm: async (reason: string) => {
        setActionLoading(true);
        try {
          await adminSubscriptionService.rejectSubscription(
            subscriptionId,
            reason,
            user?.uid || 'admin',
            user?.displayName || 'Admin'
          );
          await loadSubscriptions();
          addToast('❌ Abonelik reddedildi.', 'info');
          setPromptModal({ ...promptModal, isOpen: false });
        } catch (error: any) {
          addToast(error.message || 'Hata oluştu', 'error');
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    const reason = prompt('İptal nedeni:');
    if (!reason) return;

    try {
      await updateDoc(doc(db, 'subscriptions', subscriptionId), {
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        cancellationReason: reason,
      });

      await auditLogService.log({
        adminId: user?.uid || 'admin',
        adminName: user?.displayName || 'Admin',
        action: 'cancel_subscription',
        targetType: 'subscription',
        targetId: subscriptionId,
        targetName: subscriptionId,
        metadata: { reason },
      });

      await loadSubscriptions();
      alert('Abonelik iptal edildi!');
    } catch (error) {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Abonelik Yönetimi</h1>
          <p className="text-white/60 mt-1">Tüm abonelikleri görüntüle ve yönet</p>
        </div>
        <button
          onClick={() => setShowManualPremiumModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-medium transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Manuel Premium Ver
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Package className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-white/60 text-sm">⏳ Bekleyen</span>
          </div>
          <p className="text-2xl font-bold text-amber-400">{subscriptions.filter(s => s.status === 'pending').length}</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Package className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-white/60 text-sm">Aktif</span>
          </div>
          <p className="text-2xl font-bold text-white">{subscriptions.filter(s => s.status === 'active').length}</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Package className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-white/60 text-sm">Trial</span>
          </div>
          <p className="text-2xl font-bold text-white">{subscriptions.filter(s => s.status === 'trial').length}</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Package className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="text-white/60 text-sm">Dondurulmuş</span>
          </div>
          <p className="text-2xl font-bold text-white">{subscriptions.filter(s => s.status === 'frozen').length}</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <Package className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-white/60 text-sm">İptal</span>
          </div>
          <p className="text-2xl font-bold text-white">{subscriptions.filter(s => s.status === 'cancelled').length}</p>
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
            className="px-4 py-2.5 bg-slate-700 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 cursor-pointer"
            style={{
              colorScheme: 'dark'
            }}
          >
            <option value="all" className="bg-slate-700 text-white">Tüm Durumlar</option>
            <option value="pending" className="bg-slate-700 text-white">⏳ Onay Bekleyen</option>
            <option value="active" className="bg-slate-700 text-white">Aktif</option>
            <option value="trial" className="bg-slate-700 text-white">Deneme</option>
            <option value="frozen" className="bg-slate-700 text-white">Dondurulmuş</option>
            <option value="expired" className="bg-slate-700 text-white">Süresi Dolmuş</option>
            <option value="cancelled" className="bg-slate-700 text-white">İptal Edilmiş</option>
          </select>
        </div>

        <div className="mt-4">
          <p className="text-white/60 text-sm">{filteredSubscriptions.length} abonelik bulundu</p>
        </div>
      </div>

      {/* Pending Subscriptions - Priority Section */}
      {subscriptions.filter(s => s.status === 'pending').length > 0 && (
        <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-500/10 border-2 border-amber-500/30 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">⏳ Onay Bekleyen Abonelikler</h2>
              <p className="text-amber-300 text-sm">Bu işletmeler admin onayınızı bekliyor</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subscriptions.filter(s => s.status === 'pending').map((subscription) => (
              <div
                key={subscription.id}
                className="bg-slate-800/80 backdrop-blur-xl border-2 border-amber-500/30 rounded-2xl p-5 hover:border-amber-500/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{subscription.businessName}</h3>
                    <p className="text-sm text-white/40">{subscription.businessId.slice(0, 8)}...</p>
                  </div>
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 animate-pulse">
                    Bekliyor
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <Package className="w-4 h-4" />
                    <span className="capitalize font-semibold text-white">{subscription.planType}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-semibold text-white">{subscription.price} ₺</span>
                    <span>/ {subscription.interval}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <Calendar className="w-4 h-4" />
                    <span>Talep: {new Date(subscription.createdAt).toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveSubscription(subscription.id)}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-green-500/20"
                  >
                    ✅ Onayla
                  </button>
                  <button
                    onClick={() => handleRejectSubscription(subscription.id)}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-500/20"
                  >
                    ❌ Reddet
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subscriptions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubscriptions.filter(s => s.status !== 'pending').map((subscription) => (
          <div
            key={subscription.id}
            className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">{subscription.businessName}</h3>
                <p className="text-sm text-white/40">{subscription.businessId.slice(0, 8)}...</p>
              </div>
              <span className={`
                px-3 py-1 text-xs font-semibold rounded-full
                ${subscription.status === 'active' ? 'bg-green-500/20 text-green-300' : ''}
                ${subscription.status === 'trial' ? 'bg-blue-500/20 text-blue-300' : ''}
                ${subscription.status === 'frozen' ? 'bg-yellow-500/20 text-yellow-300' : ''}
                ${subscription.status === 'expired' ? 'bg-red-500/20 text-red-300' : ''}
                ${subscription.status === 'cancelled' ? 'bg-gray-500/20 text-gray-300' : ''}
                ${subscription.status === 'pending' ? 'bg-orange-500/20 text-orange-300' : ''}
              `}>
                {subscription.status === 'active' && 'Aktif'}
                {subscription.status === 'trial' && 'Deneme'}
                {subscription.status === 'frozen' && 'Dondurulmuş'}
                {subscription.status === 'expired' && 'Süresi Dolmuş'}
                {subscription.status === 'cancelled' && 'İptal'}
                {subscription.status === 'pending' && 'Beklemede'}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Package className="w-4 h-4" />
                <span className="capitalize font-semibold text-white">{subscription.planType}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/60">
                <DollarSign className="w-4 h-4" />
                <span className="font-bold text-green-400">{subscription.price} ₺</span>
                <span>/ {subscription.interval}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Calendar className="w-4 h-4" />
                <span>Bitiş: {new Date(subscription.endDate).toLocaleDateString('tr-TR')}</span>
              </div>
              
              {/* Kullanım İstatistikleri */}
              {subscription.usage && (
                <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/50">Personel:</span>
                    <span className="text-white font-semibold">{subscription.usage.staffCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/50">Hizmet:</span>
                    <span className="text-white font-semibold">{subscription.usage.serviceCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/50">Aylık Randevu:</span>
                    <span className="text-white font-semibold">{subscription.usage.monthlyBookings || 0}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedSubscription(subscription);
                    setShowExtendModal(true);
                  }}
                  className="flex-1 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-xl text-sm font-medium transition-colors"
                >
                  Uzat
                </button>
                <button
                  onClick={() => handleUpgradePlan(subscription.id, 'business')}
                  className="flex-1 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-xl text-sm font-medium transition-colors"
                >
                  Yükselt
                </button>
              </div>
              <div className="flex gap-2">
                {subscription.status === 'frozen' ? (
                  <button
                    onClick={() => handleUnfreezeSubscription(subscription.id)}
                    className="flex-1 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-xl text-sm font-medium transition-colors"
                  >
                    Aktif Yap
                  </button>
                ) : subscription.status === 'active' ? (
                  <button
                    onClick={() => handleFreezeSubscription(subscription.id)}
                    className="flex-1 px-3 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-xl text-sm font-medium transition-colors"
                  >
                    Dondur
                  </button>
                ) : null}
                {subscription.status !== 'cancelled' && (
                  <button
                    onClick={() => handleCancelSubscription(subscription.id)}
                    className="flex-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl text-sm font-medium transition-colors"
                  >
                    İptal Et
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Extend Modal */}
      {showExtendModal && selectedSubscription && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Abonelik Uzat</h3>
              <button
                onClick={() => {
                  setShowExtendModal(false);
                  setSelectedSubscription(null);
                }}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">İşletme</label>
                <p className="text-white">{selectedSubscription.businessName}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Mevcut Bitiş Tarihi</label>
                <p className="text-white">{new Date(selectedSubscription.endDate).toLocaleDateString('tr-TR')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Eklenecek Gün</label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {['30', '90', '365'].map(days => (
                    <button
                      key={days}
                      onClick={() => setExtendDays(days)}
                      className={`
                        px-4 py-2 rounded-xl text-sm font-medium transition-all
                        ${extendDays === days
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/5 text-white/60 hover:bg-white/10'
                        }
                      `}
                    >
                      +{days} gün
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={extendDays}
                  onChange={(e) => setExtendDays(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleExtendSubscription}
                  className="flex-1 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all"
                >
                  Uzat
                </button>
                <button
                  onClick={() => {
                    setShowExtendModal(false);
                    setSelectedSubscription(null);
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

      {/* Manual Premium Modal */}
      {showManualPremiumModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Manuel Premium Ver</h3>
              <button
                onClick={() => setShowManualPremiumModal(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">İşletme ID *</label>
                <input
                  type="text"
                  value={manualPremiumData.businessId}
                  onChange={(e) => setManualPremiumData({ ...manualPremiumData, businessId: e.target.value })}
                  placeholder="İşletme ID girin"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Plan Tipi</label>
                <select
                  value={manualPremiumData.planType}
                  onChange={(e) => setManualPremiumData({ ...manualPremiumData, planType: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="premium">Premium</option>
                  <option value="business">Business</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Süre (Gün)</label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {['30', '90', '365'].map(days => (
                    <button
                      key={days}
                      onClick={() => setManualPremiumData({ ...manualPremiumData, days })}
                      className={`
                        px-4 py-2 rounded-xl text-sm font-medium transition-all
                        ${manualPremiumData.days === days
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/5 text-white/60 hover:bg-white/10'
                        }
                      `}
                    >
                      {days} gün
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={manualPremiumData.days}
                  onChange={(e) => setManualPremiumData({ ...manualPremiumData, days: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleGrantManualPremium}
                  className="flex-1 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all"
                >
                  Premium Ver
                </button>
                <button
                  onClick={() => setShowManualPremiumModal(false)}
                  className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        loading={actionLoading}
      />

      {/* Prompt Modal */}
      <PromptModal
        isOpen={promptModal.isOpen}
        title={promptModal.title}
        message={promptModal.message}
        placeholder={promptModal.placeholder}
        defaultValue={promptModal.defaultValue}
        onConfirm={promptModal.onConfirm}
        onCancel={() => setPromptModal({ ...promptModal, isOpen: false })}
        loading={actionLoading}
      />
    </div>
  );
}
