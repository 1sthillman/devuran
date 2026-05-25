import { useEffect, useState } from 'react';
import { Search, Zap, Tag, DollarSign, Clock, Eye, Edit, Trash2, Plus, X } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Service } from '@/types';

export function ServiceManagement() {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newService, setNewService] = useState<Partial<Service>>({
    name: '',
    description: '',
    category: '',
    price: 0,
    duration: 30,
    isActive: true,
    gender: 'all',
  });

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    filterServices();
  }, [searchTerm, filterCategory, services]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const servicesSnapshot = await getDocs(collection(db, 'services'));
      const servicesData = servicesSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Service[];
      
      setServices(servicesData);
    } catch (error) {
      console.error('Load services error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterServices = () => {
    let filtered = [...services];

    if (searchTerm) {
      filtered = filtered.filter(service =>
        service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(service => service.category === filterCategory);
    }

    setFilteredServices(filtered);
  };

  const categories = Array.from(new Set(services.map(s => s.category))).filter(Boolean);

  const handleAddService = async () => {
    if (!newService.name || !newService.category) {
      alert('Lütfen hizmet adı ve kategori girin!');
      return;
    }

    try {
      await addDoc(collection(db, 'services'), {
        ...newService,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await loadServices();
      setShowAddModal(false);
      setNewService({
        name: '',
        description: '',
        category: '',
        price: 0,
        duration: 30,
        isActive: true,
        gender: 'all',
      });
      alert('Hizmet eklendi!');
    } catch (error) {
      console.error('Add service error:', error);
      alert('Hata: ' + error);
    }
  };

  const handleUpdateService = async () => {
    if (!editingService) return;

    try {
      await updateDoc(doc(db, 'services', editingService.id), {
        name: editingService.name,
        description: editingService.description,
        category: editingService.category,
        price: editingService.price,
        duration: editingService.duration,
        isActive: editingService.isActive,
        gender: editingService.gender,
        updatedAt: new Date().toISOString(),
      });
      await loadServices();
      setShowEditModal(false);
      setEditingService(null);
      alert('Hizmet güncellendi!');
    } catch (error) {
      console.error('Update service error:', error);
      alert('Hata: ' + error);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Bu hizmeti silmek istediğinizden emin misiniz?')) return;

    try {
      await deleteDoc(doc(db, 'services', serviceId));
      await loadServices();
      alert('Hizmet silindi!');
    } catch (error) {
      console.error('Delete service error:', error);
      alert('Hata: ' + error);
    }
  };

  const handleToggleActive = async (service: Service) => {
    try {
      await updateDoc(doc(db, 'services', service.id), {
        isActive: !service.isActive,
        updatedAt: new Date().toISOString(),
      });
      await loadServices();
    } catch (error) {
      console.error('Toggle active error:', error);
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
          <h1 className="text-3xl font-bold text-white">Hizmet Yönetimi</h1>
          <p className="text-white/60 mt-1">Tüm hizmetleri görüntüle ve yönet</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Hizmet Ekle
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-white/60 text-sm">Toplam Hizmet</span>
          </div>
          <p className="text-2xl font-bold text-white">{services.length}</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Tag className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-white/60 text-sm">Aktif Hizmet</span>
          </div>
          <p className="text-2xl font-bold text-white">{services.filter(s => s.isActive).length}</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-white/60 text-sm">Ort. Fiyat</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {services.length > 0 ? Math.round(services.reduce((sum, s) => sum + s.price, 0) / services.length) : 0} ₺
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Hizmet adı veya kategori ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">Tüm Kategoriler</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="mt-4">
          <p className="text-white/60 text-sm">{filteredServices.length} hizmet bulundu</p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <div
            key={service.id}
            className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">{service.name}</h3>
                <p className="text-sm text-white/60 line-clamp-2">{service.description}</p>
              </div>
              <span className={`
                px-2 py-1 text-xs font-semibold rounded-full ml-2
                ${service.isActive ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}
              `}>
                {service.isActive ? 'Aktif' : 'Pasif'}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Tag className="w-4 h-4" />
                <span>{service.category}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Clock className="w-4 h-4" />
                <span>{service.duration} dakika</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="font-semibold text-green-400">{service.price} ₺</span>
              </div>
            </div>

            {service.gender && (
              <div className="mb-4">
                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-lg capitalize">
                  {service.gender === 'all' ? 'Herkes' : service.gender === 'male' ? 'Erkek' : 'Kadın'}
                </span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingService(service);
                  setShowEditModal(true);
                }}
                className="flex-1 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Düzenle
              </button>
              <button
                onClick={() => handleToggleActive(service)}
                className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  service.isActive
                    ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300'
                    : 'bg-green-500/20 hover:bg-green-500/30 text-green-300'
                }`}
              >
                {service.isActive ? 'Pasif Yap' : 'Aktif Yap'}
              </button>
              <button
                onClick={() => handleDeleteService(service.id)}
                className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Yeni Hizmet Ekle</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Hizmet Adı *</label>
                <input
                  type="text"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Açıklama</label>
                <textarea
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Kategori *</label>
                  <input
                    type="text"
                    value={newService.category}
                    onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Cinsiyet</label>
                  <select
                    value={newService.gender}
                    onChange={(e) => setNewService({ ...newService, gender: e.target.value as any })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="all">Herkes</option>
                    <option value="male">Erkek</option>
                    <option value="female">Kadın</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Fiyat (₺)</label>
                  <input
                    type="number"
                    value={newService.price}
                    onChange={(e) => setNewService({ ...newService, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Süre (dakika)</label>
                  <input
                    type="number"
                    value={newService.duration}
                    onChange={(e) => setNewService({ ...newService, duration: parseInt(e.target.value) || 30 })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={newService.isActive}
                  onChange={(e) => setNewService({ ...newService, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-sm text-white/80">Aktif</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddService}
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
      )}

      {/* Edit Modal */}
      {showEditModal && editingService && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Hizmet Düzenle</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingService(null);
                }}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Hizmet Adı</label>
                <input
                  type="text"
                  value={editingService.name}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Açıklama</label>
                <textarea
                  value={editingService.description}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Kategori</label>
                  <input
                    type="text"
                    value={editingService.category}
                    onChange={(e) => setEditingService({ ...editingService, category: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Cinsiyet</label>
                  <select
                    value={editingService.gender}
                    onChange={(e) => setEditingService({ ...editingService, gender: e.target.value as any })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="all">Herkes</option>
                    <option value="male">Erkek</option>
                    <option value="female">Kadın</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Fiyat (₺)</label>
                  <input
                    type="number"
                    value={editingService.price}
                    onChange={(e) => setEditingService({ ...editingService, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Süre (dakika)</label>
                  <input
                    type="number"
                    value={editingService.duration}
                    onChange={(e) => setEditingService({ ...editingService, duration: parseInt(e.target.value) || 30 })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={editingService.isActive}
                  onChange={(e) => setEditingService({ ...editingService, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-sm text-white/80">Aktif</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleUpdateService}
                  className="flex-1 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all"
                >
                  Kaydet
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingService(null);
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
