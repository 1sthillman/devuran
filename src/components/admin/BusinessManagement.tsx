import { useEffect, useState } from 'react';
import { Search, Building2, CheckCircle, XCircle, Eye, Edit, Trash2, MapPin, Star, Plus, X, Package, Calendar, DollarSign } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { storageService } from '@/services/storageService';
import { adminSubscriptionService, auditLogService } from '@/services/adminService';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { getAllCategories, categoryGroups } from '@/config/categories';
import type { Salon } from '@/types';
import type { BusinessSubscription } from '@/types/subscription';

export function BusinessManagement() {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const [businesses, setBusinesses] = useState<Salon[]>([]);
  const [subscriptions, setSubscriptions] = useState<Record<string, BusinessSubscription>>({});
  const [filteredBusinesses, setFilteredBusinesses] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [editingBusiness, setEditingBusiness] = useState<Salon | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedBusinessForSub, setSelectedBusinessForSub] = useState<Salon | null>(null);
  const [subscriptionData, setSubscriptionData] = useState({
    planType: 'professional',
    days: '30',
    withoutPlan: false,
  });
  const [newBusiness, setNewBusiness] = useState({
    name: '',
    phone: '',
    email: '',
    description: '',
    category: 'kuafor',
    city: '',
    district: '',
    fullAddress: '',
  });

  // Tüm kategorileri al
  const allCategories = getAllCategories();

  useEffect(() => {
    loadBusinesses();
  }, []);

  useEffect(() => {
    filterBusinesses();
  }, [searchTerm, filterStatus, businesses]);

  const loadBusinesses = async () => {
    try {
      setLoading(true);
      
      // İşletmeleri yükle
      const businessesSnapshot = await getDocs(collection(db, 'salons'));
      const businessesData = businessesSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Salon[];
      
      setBusinesses(businessesData);
      
      // Abonelikleri yükle
      const subscriptionsSnapshot = await getDocs(collection(db, 'subscriptions'));
      const subsMap: Record<string, BusinessSubscription> = {};
      subscriptionsSnapshot.docs.forEach(doc => {
        const data = doc.data() as BusinessSubscription;
        subsMap[data.businessId] = data;
      });
      setSubscriptions(subsMap);
      
    } catch (error) {
      console.error('Load businesses error:', error);
      addToast('İşletmeler yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterBusinesses = () => {
    let filtered = [...businesses];

    if (searchTerm) {
      filtered = filtered.filter(business =>
        business.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.address?.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus === 'active') {
      filtered = filtered.filter(business => business.isActive);
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(business => !business.isActive);
    }

    setFilteredBusinesses(filtered);
  };

  const handleToggleStatus = async (businessId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'salons', businessId), {
        isActive: !currentStatus,
      });
      await loadBusinesses();
      addToast(`✅ İşletme ${!currentStatus ? 'aktif' : 'pasif'} yapıldı`, 'success');
    } catch (error) {
      console.error('Toggle status error:', error);
      addToast('Durum değiştirilemedi', 'error');
    }
  };

  const handleDeleteBusiness = async (businessId: string) => {
    if (!confirm('Bu işletmeyi kalıcı olarak silmek istediğinizden emin misiniz?')) return;
    
    try {
      // 🗑️ R2'den işletme görsellerini sil
      const businessToDelete = businesses.find(b => b.id === businessId);
      if (businessToDelete) {
        const imagesToDelete: string[] = [];
        
        // Logo
        if (businessToDelete.logo && !businessToDelete.logo.startsWith('data:')) {
          imagesToDelete.push(businessToDelete.logo);
        }
        
        // Cover image
        if (businessToDelete.coverImage && !businessToDelete.coverImage.startsWith('data:')) {
          imagesToDelete.push(businessToDelete.coverImage);
        }
        
        // Gallery images
        if (businessToDelete.galleryImages && businessToDelete.galleryImages.length > 0) {
          imagesToDelete.push(...businessToDelete.galleryImages.filter(img => !img.startsWith('data:')));
        }
        
        // Media array
        if (businessToDelete.media && businessToDelete.media.length > 0) {
          imagesToDelete.push(...businessToDelete.media.map(m => m.url).filter(url => !url.startsWith('data:')));
        }
        
        // Delete all images from R2
        for (const imageUrl of imagesToDelete) {
          try {
            const urlObj = new URL(imageUrl);
            const r2Path = urlObj.pathname.substring(1);
            console.log(`🗑️ R2'den işletme görseli siliniyor: ${r2Path}`);
            await storageService.deleteFile(r2Path, 'r2');
          } catch (deleteError) {
            console.warn('⚠️ R2 görseli silinemedi:', deleteError);
          }
        }
      }
      
      await deleteDoc(doc(db, 'salons', businessId));
      
      // Abonelik varsa onu da sil
      if (subscriptions[businessId]) {
        await deleteDoc(doc(db, 'subscriptions', businessId));
      }
      
      await loadBusinesses();
      addToast('✅ İşletme başarıyla silindi!', 'success');
    } catch (error) {
      console.error('Delete business error:', error);
      addToast('Hata: ' + error, 'error');
    }
  };

  const handleSaveBusiness = async () => {
    if (!editingBusiness) return;
    
    try {
      await updateDoc(doc(db, 'salons', editingBusiness.id), {
        name: editingBusiness.name,
        phone: editingBusiness.phone,
        email: editingBusiness.email,
        description: editingBusiness.description,
        category: editingBusiness.category,
        'address.city': editingBusiness.address?.city,
        'address.district': editingBusiness.address?.district,
        'address.full': editingBusiness.address?.full,
        isActive: editingBusiness.isActive,
        isPremium: editingBusiness.isPremium,
        isAcceptingBookings: editingBusiness.isAcceptingBookings,
        updatedAt: new Date().toISOString(),
      });
      await loadBusinesses();
      setShowEditModal(false);
      setEditingBusiness(null);
      addToast('✅ İşletme başarıyla güncellendi!', 'success');
    } catch (error) {
      console.error('Update business error:', error);
      addToast('Hata: ' + error, 'error');
    }
  };

  const handleAddBusiness = async () => {
    if (!newBusiness.name || !newBusiness.phone) {
      addToast('Lütfen işletme adı ve telefon girin!', 'error');
      return;
    }

    try {
      await addDoc(collection(db, 'salons'), {
        name: newBusiness.name,
        phone: newBusiness.phone,
        email: newBusiness.email,
        description: newBusiness.description,
        category: newBusiness.category,
        address: {
          city: newBusiness.city,
          district: newBusiness.district,
          full: newBusiness.fullAddress,
        },
        isActive: true,
        isPremium: false,
        isAcceptingBookings: true,
        isApproved: true,
        stats: {
          averageRating: 0,
          reviewCount: 0,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await loadBusinesses();
      setShowAddModal(false);
      setNewBusiness({
        name: '',
        phone: '',
        email: '',
        description: '',
        category: 'kuafor',
        city: '',
        district: '',
        fullAddress: '',
      });
      addToast('✅ İşletme başarıyla eklendi!', 'success');
    } catch (error) {
      console.error('Add business error:', error);
      addToast('Hata: ' + error, 'error');
    }
  };

  const handleGrantSubscription = async () => {
    if (!selectedBusinessForSub) return;

    try {
      const now = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + parseInt(subscriptionData.days));

      if (subscriptionData.withoutPlan) {
        // ✅ PAKET OLMADAN: Sadece subscriptionActive = true yap
        await updateDoc(doc(db, 'salons', selectedBusinessForSub.id), {
          subscriptionActive: true,
          updatedAt: now.toISOString(),
        });

        await auditLogService.log({
          adminId: user?.uid || 'admin',
          adminName: user?.displayName || 'Admin',
          action: 'grant_subscription_without_plan',
          targetType: 'business',
          targetId: selectedBusinessForSub.id,
          targetName: selectedBusinessForSub.name,
          metadata: { days: subscriptionData.days },
        });

        addToast('✅ İşletmeye paket olmadan abonelik verildi!', 'success');
      } else {
        // ✅ PAKETLE: Normal abonelik oluştur
        await adminSubscriptionService.grantManualPremium(
          selectedBusinessForSub.id,
          subscriptionData.planType,
          parseInt(subscriptionData.days),
          user?.uid || 'admin',
          user?.displayName || 'Admin',
          selectedBusinessForSub.name
        );

        addToast(`✅ ${subscriptionData.planType} paketi ${subscriptionData.days} gün için verildi!`, 'success');
      }

      await loadBusinesses();
      setShowSubscriptionModal(false);
      setSelectedBusinessForSub(null);
      setSubscriptionData({
        planType: 'professional',
        days: '30',
        withoutPlan: false,
      });
    } catch (error) {
      console.error('Grant subscription error:', error);
      addToast('Hata: ' + error, 'error');
    }
  };

  const handleRemoveSubscription = async (businessId: string, businessName: string) => {
    if (!confirm(`${businessName} işletmesinin aboneliğini kaldırmak istediğinizden emin misiniz?`)) return;

    try {
      // Subscription sil
      await deleteDoc(doc(db, 'subscriptions', businessId));
      
      // Salon subscriptionActive güncelle
      await updateDoc(doc(db, 'salons', businessId), {
        subscriptionActive: false,
        updatedAt: new Date().toISOString(),
      });

      await auditLogService.log({
        adminId: user?.uid || 'admin',
        adminName: user?.displayName || 'Admin',
        action: 'remove_subscription',
        targetType: 'business',
        targetId: businessId,
        targetName: businessName,
      });

      await loadBusinesses();
      addToast('✅ Abonelik kaldırıldı!', 'success');
    } catch (error) {
      console.error('Remove subscription error:', error);
      addToast('Hata: ' + error, 'error');
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
          <h1 className="text-3xl font-bold text-white">İşletme Yönetimi</h1>
          <p className="text-white/60 mt-1">Tüm işletmeleri görüntüle ve yönet</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          İşletme Ekle
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-white/60 text-sm">Toplam</span>
          </div>
          <p className="text-2xl font-bold text-white">{businesses.length}</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-white/60 text-sm">Aktif</span>
          </div>
          <p className="text-2xl font-bold text-white">{businesses.filter(b => b.isActive).length}</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Package className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-white/60 text-sm">Abonelikli</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {Object.values(subscriptions).filter(s => s.status === 'active').length}
          </p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Star className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="text-white/60 text-sm">Premium</span>
          </div>
          <p className="text-2xl font-bold text-white">{businesses.filter(b => b.isPremium).length}</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-white/60 text-sm">Pasif</span>
          </div>
          <p className="text-2xl font-bold text-white">{businesses.filter(b => !b.isActive).length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="İşletme adı veya şehir ara..."
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
            <option value="active" className="bg-slate-700 text-white">Aktif</option>
            <option value="inactive" className="bg-slate-700 text-white">Pasif</option>
          </select>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-white/60 text-sm">{filteredBusinesses.length} işletme bulundu</p>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                const csv = [
                  ['ID', 'Ad', 'Kategori', 'Şehir', 'Telefon', 'Email', 'Durum', 'Premium', 'Puan'].join(','),
                  ...filteredBusinesses.map(b => [
                    b.id,
                    b.name,
                    b.category,
                    b.address?.city || '',
                    b.phone,
                    b.email,
                    b.isActive ? 'Aktif' : 'Pasif',
                    b.isPremium ? 'Evet' : 'Hayır',
                    b.stats?.averageRating?.toFixed(1) || '0'
                  ].join(','))
                ].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `isletmeler-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
              }}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-medium transition-colors"
            >
              CSV İndir
            </button>
            <button 
              onClick={async () => {
                if (confirm('Tüm pasif işletmeleri silmek istediğinizden emin misiniz?')) {
                  const inactiveBusinesses = businesses.filter(b => !b.isActive);
                  for (const business of inactiveBusinesses) {
                    await deleteDoc(doc(db, 'salons', business.id));
                  }
                  await loadBusinesses();
                  addToast(`✅ ${inactiveBusinesses.length} pasif işletme silindi.`, 'success');
                }
              }}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Pasif İşletmeleri Sil
            </button>
          </div>
        </div>
      </div>

      {/* Businesses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBusinesses.map((business) => {
          const subscription = subscriptions[business.id];
          const hasActiveSubscription = subscription && subscription.status === 'active';
          const isPending = subscription && subscription.status === 'pending';

          return (
            <div
              key={business.id}
              className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all group"
            >
              <div className="relative h-48">
                <img
                  src={business.coverImage || '/placeholder-business.jpg'}
                  alt={business.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23334155" width="400" height="300"/%3E%3Ctext fill="%23fff" font-family="sans-serif" font-size="24" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                <div className="absolute top-4 right-4 flex gap-2">
                  {business.isActive ? (
                    <span className="px-3 py-1 bg-green-500/20 text-green-300 text-xs font-semibold rounded-full backdrop-blur-xl">
                      Aktif
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-red-500/20 text-red-300 text-xs font-semibold rounded-full backdrop-blur-xl">
                      Pasif
                    </span>
                  )}
                  {hasActiveSubscription && (
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs font-semibold rounded-full backdrop-blur-xl">
                      ⭐ Abonelik
                    </span>
                  )}
                  {isPending && (
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-semibold rounded-full backdrop-blur-xl animate-pulse">
                      ⏳ Bekliyor
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-2">{business.name}</h3>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <MapPin className="w-4 h-4" />
                    <span>{business.address?.city || 'Belirtilmemiş'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <Building2 className="w-4 h-4" />
                    <span className="capitalize">{business.category || 'Genel'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span>{business.stats?.averageRating?.toFixed(1) || '0.0'}</span>
                    <span>({business.stats?.reviewCount || 0})</span>
                  </div>

                  {/* Abonelik Bilgileri */}
                  {subscription && (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="w-4 h-4 text-purple-400" />
                        <span className="text-white/60">Plan:</span>
                        <span className="text-purple-300 font-semibold capitalize">{subscription.planType}</span>
                      </div>
                      {hasActiveSubscription && (
                        <>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-blue-400" />
                            <span className="text-white/60">Bitiş:</span>
                            <span className="text-white font-medium">
                              {new Date(subscription.endDate).toLocaleDateString('tr-TR')}
                            </span>
                          </div>
                          {subscription.usage && (
                            <div className="flex items-center gap-3 text-xs text-white/50">
                              <span>Personel: {subscription.usage.staffCount || 0}</span>
                              <span>•</span>
                              <span>Hizmet: {subscription.usage.serviceCount || 0}</span>
                              <span>•</span>
                              <span>Randevu: {subscription.usage.monthlyBookings || 0}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingBusiness(business);
                        setShowEditModal(true);
                      }}
                      className="flex-1 px-4 py-2 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 rounded-xl text-sm font-medium transition-colors"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleToggleStatus(business.id, business.isActive)}
                      className={`
                        flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors
                        ${business.isActive
                          ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                          : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                        }
                      `}
                    >
                      {business.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await updateDoc(doc(db, 'salons', business.id), {
                            isPremium: !business.isPremium,
                          });
                          await loadBusinesses();
                          addToast(`✅ ${business.name} ${!business.isPremium ? 'premium yapıldı' : 'premium kaldırıldı'}`, 'success');
                        } catch (error) {
                          addToast('Premium durumu değiştirilemedi', 'error');
                        }
                      }}
                      className={`
                        p-2 rounded-xl transition-colors
                        ${business.isPremium
                          ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
                          : 'bg-gray-500/20 text-gray-300 hover:bg-gray-500/30'
                        }
                      `}
                      title={business.isPremium ? 'Premium Kaldır' : 'Premium Yap'}
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Abonelik Yönetimi Butonları */}
                  <div className="flex gap-2">
                    {hasActiveSubscription ? (
                      <button
                        onClick={() => handleRemoveSubscription(business.id, business.name)}
                        className="flex-1 px-4 py-2 bg-red-500/20 text-red-300 hover:bg-red-500/30 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Abonelik Kaldır
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedBusinessForSub(business);
                          setShowSubscriptionModal(true);
                        }}
                        className="flex-1 px-4 py-2 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Package className="w-4 h-4" />
                        Abonelik Ver
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDeleteBusiness(business.id)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Business Modal */}
      {showEditModal && editingBusiness && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-0 sm:p-4 overflow-y-auto">
          <div className="w-full h-full sm:h-auto sm:max-w-4xl sm:max-h-[90vh] bg-slate-800 sm:border border-white/10 sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl">
            {/* Header - Sticky */}
            <div className="flex-shrink-0 p-6 border-b border-white/10 bg-slate-800/95 backdrop-blur-xl sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white">İşletme Düzenle</h3>
                  <p className="text-sm text-white/60 mt-1">{editingBusiness.name}</p>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingBusiness(null);
                  }}
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">İşletme Adı</label>
                <input
                  type="text"
                  value={editingBusiness.name}
                  onChange={(e) => setEditingBusiness({ ...editingBusiness, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Telefon</label>
                  <input
                    type="tel"
                    value={editingBusiness.phone}
                    onChange={(e) => setEditingBusiness({ ...editingBusiness, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Email</label>
                  <input
                    type="email"
                    value={editingBusiness.email}
                    onChange={(e) => setEditingBusiness({ ...editingBusiness, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Kategori</label>
                <select
                  value={editingBusiness.category || 'kuafor'}
                  onChange={(e) => setEditingBusiness({ ...editingBusiness, category: e.target.value as any })}
                  className="w-full px-4 py-2.5 bg-slate-700 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                  style={{
                    colorScheme: 'dark'
                  }}
                >
                  {categoryGroups.map(group => (
                    <optgroup key={group.id} label={group.name} className="bg-slate-700 text-white font-semibold">
                      {allCategories
                        .filter(cat => cat.groupId === group.id)
                        .map(cat => (
                          <option key={cat.id} value={cat.id} className="bg-slate-700 text-white pl-4">
                            {cat.name}
                          </option>
                        ))
                      }
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Açıklama</label>
                <textarea
                  value={editingBusiness.description}
                  onChange={(e) => setEditingBusiness({ ...editingBusiness, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Şehir</label>
                  <input
                    type="text"
                    value={editingBusiness.address?.city || ''}
                    onChange={(e) => setEditingBusiness({ 
                      ...editingBusiness, 
                      address: { ...editingBusiness.address!, city: e.target.value }
                    })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">İlçe</label>
                  <input
                    type="text"
                    value={editingBusiness.address?.district || ''}
                    onChange={(e) => setEditingBusiness({ 
                      ...editingBusiness, 
                      address: { ...editingBusiness.address!, district: e.target.value }
                    })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Tam Adres</label>
                <textarea
                  value={editingBusiness.address?.full || ''}
                  onChange={(e) => setEditingBusiness({ 
                    ...editingBusiness, 
                    address: { ...editingBusiness.address!, full: e.target.value }
                  })}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingBusiness.isActive}
                    onChange={(e) => setEditingBusiness({ ...editingBusiness, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-white/80">Aktif</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingBusiness.isPremium}
                    onChange={(e) => setEditingBusiness({ ...editingBusiness, isPremium: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-white/80">Premium</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingBusiness.isAcceptingBookings}
                    onChange={(e) => setEditingBusiness({ ...editingBusiness, isAcceptingBookings: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-white/80">Rezervasyon Açık</span>
                </label>
              </div>
            </div>

            {/* Footer - Sticky */}
            <div className="flex-shrink-0 p-6 border-t border-white/10 bg-slate-800/95 backdrop-blur-xl sticky bottom-0 z-10">
              <div className="flex gap-3">
                <button
                  onClick={handleSaveBusiness}
                  className="flex-1 h-12 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-purple-500/20 active:scale-95"
                >
                  Değişiklikleri Kaydet
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingBusiness(null);
                  }}
                  className="px-6 h-12 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition-all active:scale-95"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Business Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-0 sm:p-4 overflow-y-auto">
          <div className="w-full h-full sm:h-auto sm:max-w-4xl sm:max-h-[90vh] bg-slate-800 sm:border border-white/10 sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl">
            {/* Header - Sticky */}
            <div className="flex-shrink-0 p-6 border-b border-white/10 bg-slate-800/95 backdrop-blur-xl sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white">Yeni İşletme Ekle</h3>
                  <p className="text-sm text-white/60 mt-1">İşletme bilgilerini girin</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">İşletme Adı *</label>
                <input
                  type="text"
                  value={newBusiness.name}
                  onChange={(e) => setNewBusiness({ ...newBusiness, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Telefon *</label>
                  <input
                    type="tel"
                    value={newBusiness.phone}
                    onChange={(e) => setNewBusiness({ ...newBusiness, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Email</label>
                  <input
                    type="email"
                    value={newBusiness.email}
                    onChange={(e) => setNewBusiness({ ...newBusiness, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Kategori</label>
                <select
                  value={newBusiness.category}
                  onChange={(e) => setNewBusiness({ ...newBusiness, category: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-700 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                  style={{
                    colorScheme: 'dark'
                  }}
                >
                  {categoryGroups.map(group => (
                    <optgroup key={group.id} label={group.name} className="bg-slate-700 text-white font-semibold">
                      {allCategories
                        .filter(cat => cat.groupId === group.id)
                        .map(cat => (
                          <option key={cat.id} value={cat.id} className="bg-slate-700 text-white pl-4">
                            {cat.name}
                          </option>
                        ))
                      }
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Açıklama</label>
                <textarea
                  value={newBusiness.description}
                  onChange={(e) => setNewBusiness({ ...newBusiness, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Şehir</label>
                  <input
                    type="text"
                    value={newBusiness.city}
                    onChange={(e) => setNewBusiness({ ...newBusiness, city: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">İlçe</label>
                  <input
                    type="text"
                    value={newBusiness.district}
                    onChange={(e) => setNewBusiness({ ...newBusiness, district: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Tam Adres</label>
                <textarea
                  value={newBusiness.fullAddress}
                  onChange={(e) => setNewBusiness({ ...newBusiness, fullAddress: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

            </div>

            {/* Footer - Sticky */}
            <div className="flex-shrink-0 p-6 border-t border-white/10 bg-slate-800/95 backdrop-blur-xl sticky bottom-0 z-10">
              <div className="flex gap-3">
                <button
                  onClick={handleAddBusiness}
                  className="flex-1 h-12 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-purple-500/20 active:scale-95"
                >
                  İşletme Ekle
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-6 h-12 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition-all active:scale-95"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      {showSubscriptionModal && selectedBusinessForSub && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-y-auto">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 max-w-md w-full my-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white">Abonelik Ver</h3>
                <p className="text-sm text-white/60 mt-1">{selectedBusinessForSub.name}</p>
              </div>
              <button
                onClick={() => {
                  setShowSubscriptionModal(false);
                  setSelectedBusinessForSub(null);
                }}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Paket Olmadan Seçeneği */}
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subscriptionData.withoutPlan}
                    onChange={(e) => setSubscriptionData({ 
                      ...subscriptionData, 
                      withoutPlan: e.target.checked 
                    })}
                    className="w-5 h-5 rounded border-2 border-purple-500 bg-transparent checked:bg-purple-500 checked:border-purple-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-white font-semibold">Paket olmadan abonelik ver</span>
                    <p className="text-xs text-white/60 mt-1">
                      Sadece işletmeyi aktif et, paket özellikleri olmadan
                    </p>
                  </div>
                </label>
              </div>

              {/* Plan Seçimi */}
              {!subscriptionData.withoutPlan && (
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Abonelik Paketi</label>
                  <select
                    value={subscriptionData.planType}
                    onChange={(e) => setSubscriptionData({ 
                      ...subscriptionData, 
                      planType: e.target.value 
                    })}
                    className="w-full px-4 py-2.5 bg-slate-700 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                    style={{
                      colorScheme: 'dark'
                    }}
                  >
                    <option value="starter" className="bg-slate-700 text-white">Starter</option>
                    <option value="professional" className="bg-slate-700 text-white">Professional</option>
                    <option value="business" className="bg-slate-700 text-white">Business</option>
                    <option value="enterprise" className="bg-slate-700 text-white">Enterprise</option>
                  </select>
                </div>
              )}

              {/* Süre Seçimi */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Süre (Gün)</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {['30', '90', '180', '365'].map(days => (
                    <button
                      key={days}
                      onClick={() => setSubscriptionData({ 
                        ...subscriptionData, 
                        days 
                      })}
                      className={`
                        px-3 py-2 rounded-xl text-sm font-medium transition-all
                        ${subscriptionData.days === days
                          ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                          : 'bg-white/5 text-white/60 hover:bg-white/10'
                        }
                      `}
                    >
                      {days}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={subscriptionData.days}
                  onChange={(e) => setSubscriptionData({ 
                    ...subscriptionData, 
                    days: e.target.value 
                  })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  placeholder="Özel gün sayısı"
                />
              </div>

              {/* Özet */}
              <div className="bg-slate-700/50 rounded-xl p-4 space-y-2">
                <h4 className="text-sm font-semibold text-white mb-2">Özet</h4>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">İşletme:</span>
                  <span className="text-white font-medium">{selectedBusinessForSub.name}</span>
                </div>
                {!subscriptionData.withoutPlan && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Paket:</span>
                    <span className="text-purple-300 font-semibold capitalize">{subscriptionData.planType}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Süre:</span>
                  <span className="text-white font-medium">{subscriptionData.days} gün</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Bitiş Tarihi:</span>
                  <span className="text-green-300 font-medium">
                    {new Date(Date.now() + parseInt(subscriptionData.days) * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR')}
                  </span>
                </div>
                {subscriptionData.withoutPlan && (
                  <div className="pt-2 border-t border-white/10">
                    <p className="text-xs text-amber-300">
                      ⚠️ Paket özellikleri olmadan sadece aktif durum verilecek
                    </p>
                  </div>
                )}
              </div>

              {/* Butonlar */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleGrantSubscription}
                  className="flex-1 h-12 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-purple-500/20 active:scale-95"
                >
                  Abonelik Ver
                </button>
                <button
                  onClick={() => {
                    setShowSubscriptionModal(false);
                    setSelectedBusinessForSub(null);
                  }}
                  className="px-6 h-12 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition-all active:scale-95"
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
