import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Upload, Send, Trash2, Edit2, Eye, EyeOff } from 'lucide-react';
import { announcementService } from '@/services/announcementService';
import { salonsService, servicesService } from '@/services/firebaseService';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import type { Announcement, AnnouncementTargetType } from '@/types/announcement';
import type { Salon, Service } from '@/types';

export function AnnouncementManagement() {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [businesses, setBusinesses] = useState<Salon[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [form, setForm] = useState({
    title: '',
    message: '',
    imageFile: null as File | null,
    targetType: 'all' as AnnouncementTargetType,
    targetIds: [] as string[],
    expiresAt: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [announcementsData, businessesData] = await Promise.all([
        announcementService.getAllAnnouncements(),
        salonsService.getAll(),
      ]);
      setAnnouncements(announcementsData);
      setBusinesses(businessesData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const loadServices = async () => {
    try {
      // Tüm servisleri yükle (burada basit bir yaklaşım, optimize edilebilir)
      const allServices: Service[] = [];
      for (const business of businesses) {
        const businessServices = await servicesService.getBySalon(business.id);
        allServices.push(...businessServices);
      }
      setServices(allServices);
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  useEffect(() => {
    if (form.targetType === 'specific_services' && businesses.length > 0) {
      loadServices();
    }
  }, [form.targetType, businesses]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setForm({ ...form, imageFile: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      let imageUrl: string | undefined;

      // Görsel yükle
      if (form.imageFile) {
        imageUrl = await announcementService.uploadImage(form.imageFile);
      }

      // Duyuru oluştur
      await announcementService.createAnnouncement({
        title: form.title,
        message: form.message,
        imageUrl,
        targetType: form.targetType,
        targetIds: form.targetIds.length > 0 ? form.targetIds : undefined,
        createdBy: user.uid,
        createdByName: user.displayName || 'Admin',
        expiresAt: form.expiresAt || undefined,
        isActive: true,
      });

      addToast('✅ Duyuru başarıyla oluşturuldu!', 'success');
      setShowCreateModal(false);
      setForm({
        title: '',
        message: '',
        imageFile: null,
        targetType: 'all',
        targetIds: [],
        expiresAt: '',
      });
      await loadData();
    } catch (error) {
      console.error('Error creating announcement:', error);
      addToast('❌ Duyuru oluşturulamadı', 'error');
    }
    setLoading(false);
  };

  const handleToggleActive = async (announcement: Announcement) => {
    try {
      await announcementService.updateAnnouncement(announcement.id, {
        isActive: !announcement.isActive,
      });
      await loadData();
      addToast('✅ Duyuru güncellendi', 'success');
    } catch (error) {
      console.error('Error toggling announcement:', error);
      addToast('❌ Güncelleme başarısız', 'error');
    }
  };

  const handleDelete = async (announcementId: string) => {
    if (!confirm('Bu duyuruyu silmek istediğinize emin misiniz?')) return;

    try {
      await announcementService.deleteAnnouncement(announcementId);
      await loadData();
      addToast('✅ Duyuru silindi', 'success');
    } catch (error) {
      console.error('Error deleting announcement:', error);
      addToast('❌ Silme başarısız', 'error');
    }
  };

  const getTargetLabel = (announcement: Announcement) => {
    switch (announcement.targetType) {
      case 'all':
        return 'Tüm Kullanıcılar';
      case 'all_businesses':
        return 'Tüm İşletmeler';
      case 'all_customers':
        return 'Tüm Müşteriler';
      case 'specific_businesses':
        return `${announcement.targetIds?.length || 0} İşletme`;
      case 'specific_services':
        return `${announcement.targetIds?.length || 0} Hizmet`;
      default:
        return '-';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Duyuru Yönetimi</h2>
          <p className="text-white/60 mt-1">Kullanıcılara ve işletmelere duyuru gönderin</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold flex items-center gap-2 shadow-lg hover:shadow-blue-500/30 transition-all"
        >
          <Plus size={20} />
          Yeni Duyuru
        </motion.button>
      </div>

      {/* Announcements List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/60">Yükleniyor...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-white/60">Henüz duyuru yok</p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all"
            >
              <div className="flex items-start gap-6">
                {/* Image */}
                {announcement.imageUrl && (
                  <div className="w-32 h-32 rounded-xl overflow-hidden flex-shrink-0 bg-white/5">
                    <img
                      src={announcement.imageUrl}
                      alt={announcement.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">{announcement.title}</h3>
                      <p className="text-sm text-white/60 line-clamp-2">{announcement.message}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(announcement)}
                        className={`p-2 rounded-lg transition-all ${
                          announcement.isActive
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-white/5 text-white/40 hover:bg-white/10'
                        }`}
                        title={announcement.isActive ? 'Aktif' : 'Pasif'}
                      >
                        {announcement.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs">
                    <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 font-semibold">
                      {getTargetLabel(announcement)}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300">
                      {announcement.readBy.length} Okundu
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white/10 text-white/60">
                      {new Date(announcement.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                    {announcement.expiresAt && (
                      <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300">
                        Son: {new Date(announcement.expiresAt).toLocaleDateString('tr-TR')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-white/10 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              {/* Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white">Yeni Duyuru Oluştur</h3>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                  >
                    <X size={20} className="text-white/60" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Başlık</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Duyuru başlığı"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Mesaj</label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Duyuru mesajı"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 min-h-[150px] resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Görsel (Opsiyonel)</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      id="imageUpload"
                    />
                    <label
                      htmlFor="imageUpload"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/60 cursor-pointer hover:bg-white/10 transition-all flex items-center gap-3"
                    >
                      <Upload size={20} />
                      {form.imageFile ? form.imageFile.name : 'Görsel Seç'}
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Hedef Kitle</label>
                  <select
                    value={form.targetType}
                    onChange={(e) => setForm({ ...form, targetType: e.target.value as AnnouncementTargetType, targetIds: [] })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                  >
                    <option value="all">Tüm Kullanıcılar</option>
                    <option value="all_businesses">Tüm İşletmeler</option>
                    <option value="all_customers">Tüm Müşteriler</option>
                    <option value="specific_businesses">Belirli İşletmeler</option>
                    <option value="specific_services">Belirli Hizmet Alan Müşteriler</option>
                  </select>
                </div>

                {/* Target Selection */}
                {form.targetType === 'specific_businesses' && (
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">İşletmeler Seç</label>
                    <div className="max-h-48 overflow-y-auto space-y-2 bg-white/5 rounded-xl p-3 border border-white/10">
                      {businesses.map((business) => (
                        <label key={business.id} className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-all">
                          <input
                            type="checkbox"
                            checked={form.targetIds.includes(business.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setForm({ ...form, targetIds: [...form.targetIds, business.id] });
                              } else {
                                setForm({ ...form, targetIds: form.targetIds.filter(id => id !== business.id) });
                              }
                            }}
                            className="w-4 h-4 rounded"
                          />
                          <span className="text-white text-sm">{business.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {form.targetType === 'specific_services' && (
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Hizmetler Seç</label>
                    <div className="max-h-48 overflow-y-auto space-y-2 bg-white/5 rounded-xl p-3 border border-white/10">
                      {services.map((service) => (
                        <label key={service.id} className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-all">
                          <input
                            type="checkbox"
                            checked={form.targetIds.includes(service.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setForm({ ...form, targetIds: [...form.targetIds, service.id] });
                              } else {
                                setForm({ ...form, targetIds: form.targetIds.filter(id => id !== service.id) });
                              }
                            }}
                            className="w-4 h-4 rounded"
                          />
                          <span className="text-white text-sm">{service.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Son Geçerlilik Tarihi (Opsiyonel)</label>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-white/10">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Send size={20} />
                      Duyuru Yayınla
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
