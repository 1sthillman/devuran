// @ts-nocheck
import { useEffect, useState } from 'react';
import { Search, UserCog, Edit, Trash2, Plus, X, Calendar, Star, Building2, Phone, Mail } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Staff } from '@/types';

interface StaffWithBusiness extends Staff {
  businessName?: string;
}

export function StaffManagement() {
  const [staff, setStaff] = useState<StaffWithBusiness[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<StaffWithBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [editingStaff, setEditingStaff] = useState<StaffWithBusiness | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [newStaff, setNewStaff] = useState({
    name: '',
    salonId: '',
    specialties: '',
    phone: '',
    workingDays: [] as number[],
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterStaff();
  }, [searchTerm, filterStatus, staff]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const businessesSnapshot = await getDocs(collection(db, 'salons'));
      const businessesData = businessesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBusinesses(businessesData);

      const staffSnapshot = await getDocs(collection(db, 'staff'));
      const staffData = staffSnapshot.docs.map(doc => {
        const data = doc.data();
        const business = businessesData.find(b => b.id === data.salonId);
        return {
          ...data,
          id: doc.id,
          businessName: business?.name || 'Bilinmiyor'
        } as StaffWithBusiness;
      });
      
      setStaff(staffData);
    } catch (error) {
      console.error('Load staff error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterStaff = () => {
    let filtered = [...staff];

    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.businessName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus === 'active') {
      filtered = filtered.filter(s => s.isActive);
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(s => !s.isActive);
    }

    setFilteredStaff(filtered);
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('Bu personeli kalıcı olarak silmek istediğinizden emin misiniz?')) return;
    
    try {
      await deleteDoc(doc(db, 'staff', staffId));
      await loadData();
      alert('Personel başarıyla silindi!');
    } catch (error) {
      console.error('Delete staff error:', error);
      alert('Hata: ' + error);
    }
  };

  const handleSaveStaff = async () => {
    if (!editingStaff) return;
    
    try {
      await updateDoc(doc(db, 'staff', editingStaff.id), {
        name: editingStaff.name,
        specialties: editingStaff.specialties,
        workingDays: editingStaff.workingDays,
        phone: editingStaff.phone,
        isActive: editingStaff.isActive,
        updatedAt: new Date().toISOString(),
      });
      await loadData();
      setShowEditModal(false);
      setEditingStaff(null);
      alert('Personel başarıyla güncellendi!');
    } catch (error) {
      console.error('Update staff error:', error);
      alert('Hata: ' + error);
    }
  };

  const handleAddStaff = async () => {
    if (!newStaff.name || !newStaff.salonId) {
      alert('Lütfen tüm zorunlu alanları doldurun!');
      return;
    }

    try {
      await addDoc(collection(db, 'staff'), {
        name: newStaff.name,
        salonId: newStaff.salonId,
        specialties: newStaff.specialties.split(',').map(s => s.trim()).filter(s => s),
        phone: newStaff.phone,
        workingDays: newStaff.workingDays,
        isActive: true,
        rating: 0,
        reviewCount: 0,
        createdAt: new Date().toISOString(),
      });
      await loadData();
      setShowAddModal(false);
      setNewStaff({ name: '', salonId: '', specialties: '', phone: '', workingDays: [] });
      alert('Personel başarıyla eklendi!');
    } catch (error) {
      console.error('Add staff error:', error);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Personel Yönetimi</h1>
          <p className="text-white/60 mt-1">Tüm personelleri görüntüle ve yönet</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-medium transition-all flex items-center gap-2 justify-center"
        >
          <Plus className="w-5 h-5" />
          Personel Ekle
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Personel adı veya işletme ara..."
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

        <div className="mt-4">
          <p className="text-white/60 text-sm">{filteredStaff.length} personel bulundu</p>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredStaff.map((member) => (
          <div
            key={member.id}
            className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all"
          >
            <div className="p-4 sm:p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {member.photo ? (
                    <img src={member.photo} alt={member.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center flex-shrink-0">
                      <UserCog className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-white truncate">{member.name}</h3>
                    <p className="text-xs sm:text-sm text-white/60 truncate">{member.businessName}</p>
                  </div>
                </div>
                {member.isActive ? (
                  <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs font-semibold rounded-full flex-shrink-0">
                    Aktif
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-red-500/20 text-red-300 text-xs font-semibold rounded-full flex-shrink-0">
                    Pasif
                  </span>
                )}
              </div>

              <div className="space-y-2 mb-4">
                {member.specialties && member.specialties.length > 0 && (
                  <div className="flex items-start gap-2 text-xs sm:text-sm text-white/60">
                    <Star className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{member.specialties.join(', ')}</span>
                  </div>
                )}
                {member.phone && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-white/60">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{member.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs sm:text-sm text-white/60">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>{member.workingDays?.length || 0} gün çalışıyor</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => {
                    setEditingStaff(member);
                    setShowEditModal(true);
                  }}
                  className="flex-1 px-3 py-2 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 rounded-xl text-sm font-medium transition-colors"
                >
                  Düzenle
                </button>
                <button
                  onClick={async () => {
                    await updateDoc(doc(db, 'staff', member.id), {
                      isActive: !member.isActive,
                    });
                    await loadData();
                  }}
                  className={`
                    flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-colors
                    ${member.isActive
                      ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                      : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                    }
                  `}
                >
                  {member.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                </button>
                <button
                  onClick={() => handleDeleteStaff(member.id)}
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

      {/* Edit Modal */}
      {showEditModal && editingStaff && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white">Personel Düzenle</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingStaff(null);
                }}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Personel Adı</label>
                <input
                  type="text"
                  value={editingStaff.name}
                  onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Telefon</label>
                <input
                  type="tel"
                  value={editingStaff.phone || ''}
                  onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Uzmanlık Alanları (virgülle ayırın)</label>
                <input
                  type="text"
                  value={editingStaff.specialties?.join(', ')}
                  onChange={(e) => setEditingStaff({ ...editingStaff, specialties: e.target.value.split(',').map(s => s.trim()) })}
                  placeholder="Saç Kesimi, Sakal Tıraşı"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveStaff}
                  className="flex-1 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all"
                >
                  Kaydet
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingStaff(null);
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

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white">Yeni Personel Ekle</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewStaff({ name: '', salonId: '', specialties: '', phone: '', workingDays: [] });
                }}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Personel Adı *</label>
                <input
                  type="text"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">İşletme *</label>
                <select
                  value={newStaff.salonId}
                  onChange={(e) => setNewStaff({ ...newStaff, salonId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">İşletme Seçin</option>
                  {businesses.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Telefon</label>
                <input
                  type="tel"
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Uzmanlık Alanları (virgülle ayırın)</label>
                <input
                  type="text"
                  value={newStaff.specialties}
                  onChange={(e) => setNewStaff({ ...newStaff, specialties: e.target.value })}
                  placeholder="Saç Kesimi, Sakal Tıraşı"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddStaff}
                  className="flex-1 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all"
                >
                  Ekle
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewStaff({ name: '', salonId: '', specialties: '', phone: '', workingDays: [] });
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
