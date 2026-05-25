import { useEffect, useState } from 'react';
import { Search, Building2, CheckCircle, XCircle, Eye, Edit, Trash2, MapPin, Star, Plus, X } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Salon } from '@/types';

export function BusinessManagement() {
  const [businesses, setBusinesses] = useState<Salon[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [editingBusiness, setEditingBusiness] = useState<Salon | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
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

  useEffect(() => {
    loadBusinesses();
  }, []);

  useEffect(() => {
    filterBusinesses();
  }, [searchTerm, filterStatus, businesses]);

  const loadBusinesses = async () => {
    try {
      setLoading(true);
      const businessesSnapshot = await getDocs(collection(db, 'salons'));
      const businessesData = businessesSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Salon[];
      
      setBusinesses(businessesData);
    } catch (error) {
      console.error('Load businesses error:', error);
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
    } catch (error) {
      console.error('Toggle status error:', error);
    }
  };

  const handleDeleteBusiness = async (businessId: string) => {
    if (!confirm('Bu işletmeyi kalıcı olarak silmek istediğinizden emin misiniz?')) return;
    
    try {
      await deleteDoc(doc(db, 'salons', businessId));
      await loadBusinesses();
      alert('İşletme başarıyla silindi!');
    } catch (error) {
      console.error('Delete business error:', error);
      alert('Hata: ' + error);
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
      alert('İşletme başarıyla güncellendi!');
    } catch (error) {
      console.error('Update business error:', error);
      alert('Hata: ' + error);
    }
  };

  const handleAddBusiness = async () => {
    if (!newBusiness.name || !newBusiness.phone) {
      alert('Lütfen işletme adı ve telefon girin!');
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
      alert('İşletme başarıyla eklendi!');
    } catch (error) {
      console.error('Add business error:', error);
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
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="active">Aktif</option>
            <option value="inactive">Pasif</option>
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
                  alert(`${inactiveBusinesses.length} pasif işletme silindi.`);
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
        {filteredBusinesses.map((business) => (
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
              <div className="absolute top-4 right-4">
                {business.isActive ? (
                  <span className="px-3 py-1 bg-green-500/20 text-green-300 text-xs font-semibold rounded-full backdrop-blur-xl">
                    Aktif
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-red-500/20 text-red-300 text-xs font-semibold rounded-full backdrop-blur-xl">
                    Pasif
                  </span>
                )}
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-2">{business.name}</h3>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <MapPin className="w-4 h-4" />
                  <span>{business.address?.city}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span>{business.stats?.averageRating?.toFixed(1) || '0.0'}</span>
                  <span>({business.stats?.reviewCount || 0} değerlendirme)</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
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
                    await updateDoc(doc(db, 'salons', business.id), {
                      isPremium: !business.isPremium,
                    });
                    await loadBusinesses();
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
        ))}
      </div>

      {/* Edit Business Modal */}
      {showEditModal && editingBusiness && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-4 sm:p-6 w-full sm:max-w-2xl max-h-[calc(100vh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-2rem)] sm:max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">İşletme Düzenle</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingBusiness(null);
                }}
                className="text-white/60 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
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

              {/* Sticky Footer with Buttons */}
              <div className="sticky bottom-0 bg-slate-800 pt-4 border-t border-white/10 -mx-4 sm:-mx-6 px-4 sm:px-6 pb-4">
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveBusiness}
                    className="flex-1 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all"
                  >
                    Kaydet
                  </button>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingBusiness(null);
                    }}
                    className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
                  >
                    İptal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Business Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-4 sm:p-6 w-full sm:max-w-2xl max-h-[calc(100vh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-2rem)] sm:max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Yeni İşletme Ekle</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
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
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="kuafor">Kuaför</option>
                  <option value="berber">Berber</option>
                  <option value="guzellik">Güzellik Salonu</option>
                  <option value="spa">SPA</option>
                  <option value="masaj">Masaj</option>
                  <option value="nail">Nail Art</option>
                  <option value="tattoo">Dövme</option>
                  <option value="piercing">Piercing</option>
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

              {/* Sticky Footer with Buttons */}
              <div className="sticky bottom-0 bg-slate-800 pt-4 border-t border-white/10 -mx-4 sm:-mx-6 px-4 sm:px-6 pb-4">
                <div className="flex gap-3">
                  <button
                    onClick={handleAddBusiness}
                    className="flex-1 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all"
                  >
                    Ekle
                  </button>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
                  >
                    İptal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
