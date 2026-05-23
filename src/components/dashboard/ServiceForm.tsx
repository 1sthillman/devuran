import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, Sparkles, Plus } from 'lucide-react';
import { ChromaticButton } from '@/components/ui/ChromaticButton';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { getServiceTemplates, type ServiceTemplate } from '@/config/serviceTemplates';
import { getCategoryById, type CategoryId } from '@/config/categories';
import type { Service } from '@/types';

interface ServiceFormProps {
  service?: Service;
  salonId: string;
  category: CategoryId;
  onSave: (service: Omit<Service, 'id'>) => Promise<void>;
  onDelete?: (serviceId: string) => Promise<void>;
  onClose: () => void;
}

export function ServiceForm({ service, salonId, category, onSave, onDelete, onClose }: ServiceFormProps) {
  const categoryInfo = getCategoryById(category);
  const templates = getServiceTemplates(category);
  
  const [showTemplates, setShowTemplates] = useState(!service && templates.length > 0);
  const [formData, setFormData] = useState({
    name: service?.name || '',
    description: service?.description || '',
    category: service?.category || (templates[0]?.category || 'Genel'),
    duration: service?.duration || 30,
    price: service?.price || 0,
    gender: service?.gender || 'all' as 'male' | 'female' | 'all',
    image: service?.image || '',
    isActive: service?.isActive ?? true,
  });
  const [loading, setLoading] = useState(false);

  // Scroll to top when modal opens
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Get unique categories from templates
  const serviceCategories = Array.from(new Set(templates.map(t => t.category)));

  const handleTemplateSelect = (template: ServiceTemplate) => {
    setFormData({
      ...formData,
      name: template.name,
      description: template.description || '',
      category: template.category,
      duration: template.duration,
      price: template.price,
      gender: template.gender || 'all',
    });
    setShowTemplates(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        ...formData,
        salonId,
        staffIds: service?.staffIds || [],
      });
      onClose();
    } catch (error) {
      console.error('Error saving service:', error);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!service || !onDelete) return;
    if (!confirm('Bu hizmeti silmek istediğinizden emin misiniz?')) return;
    
    setLoading(true);
    try {
      await onDelete(service.id);
      onClose();
    } catch (error) {
      console.error('Error deleting service:', error);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl bg-[var(--slate-surface)] border border-[var(--obsidian-rim)] rounded-3xl p-5 md:p-6 my-4"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display font-bold text-xl text-[var(--chrome-white)]">
              {service ? 'Hizmet Düzenle' : 'Yeni Hizmet Ekle'}
            </h3>
            <p className="font-body text-sm text-[var(--muted-lead)] mt-0.5">
              {categoryInfo.labels.business} için {categoryInfo.labels.service.toLowerCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors flex-shrink-0"
          >
            <X size={20} className="text-[var(--muted-lead)]" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {showTemplates ? (
            <motion.div
              key="templates"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={20} className="text-[var(--liquid-chrome)]" />
                  <h4 className="font-heading font-semibold text-[var(--chrome-white)]">
                    Hazır Şablonlar
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTemplates(false)}
                  className="px-4 py-2 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--silver-frost)] font-heading font-medium text-sm hover:border-[var(--liquid-chrome)] hover:text-[var(--chrome-white)] transition-all flex items-center gap-2"
                >
                  <Plus size={16} />
                  <span>Manuel Ekle</span>
                </button>
              </div>

              <div className="max-h-[calc(100vh-280px)] overflow-y-auto pr-2 space-y-3">
                {serviceCategories.map((cat) => {
                  const categoryTemplates = templates.filter(t => t.category === cat);
                  return (
                    <div key={cat} className="space-y-2">
                      <h5 className="font-heading font-semibold text-sm text-[var(--silver-frost)] px-2">
                        {cat}
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {categoryTemplates.map((template, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleTemplateSelect(template)}
                            className="p-3 rounded-2xl bg-[var(--void)] border border-[var(--obsidian-rim)] hover:border-[var(--liquid-chrome)] hover:bg-white/5 transition-all text-left group"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-heading font-medium text-sm text-[var(--chrome-white)] group-hover:text-[var(--liquid-chrome)] transition-colors truncate">
                                  {template.name}
                                </p>
                                {template.description && (
                                  <p className="font-body text-xs text-[var(--muted-lead)] mt-0.5 line-clamp-1">
                                    {template.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="font-mono text-xs text-[var(--silver-frost)]">
                                    {template.duration} {categoryInfo.labels.duration}
                                  </span>
                                  <span className="font-mono text-sm font-semibold text-[var(--liquid-chrome)]">
                                    {template.price} TL
                                  </span>
                                </div>
                              </div>
                              <Plus size={18} className="text-[var(--muted-lead)] group-hover:text-[var(--liquid-chrome)] transition-colors flex-shrink-0" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {templates.length > 0 && !service && (
                <button
                  type="button"
                  onClick={() => setShowTemplates(true)}
                  className="w-full p-3 rounded-2xl bg-gradient-to-r from-[var(--liquid-chrome)]/10 to-[var(--liquid-chrome)]/5 border border-[var(--liquid-chrome)]/30 hover:border-[var(--liquid-chrome)] transition-all flex items-center justify-center gap-2 text-[var(--chrome-white)] font-heading font-medium text-sm"
                >
                  <Sparkles size={16} />
                  <span>Hazır Şablonlardan Seç</span>
                </button>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-1.5">
                    {categoryInfo.labels.service} Adı *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder={`Örnek: ${templates[0]?.name || 'Hizmet adı'}`}
                    className="w-full h-12 px-4 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body outline-none focus:border-[var(--liquid-chrome)] transition-colors"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-1.5">
                    Açıklama
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    placeholder="Hizmet hakkında kısa açıklama..."
                    className="w-full px-4 py-3 rounded-3xl bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body outline-none focus:border-[var(--liquid-chrome)] transition-colors resize-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-1.5">
                    Kategori *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    className="w-full h-12 px-4 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body outline-none focus:border-[var(--liquid-chrome)] transition-colors"
                  >
                    {serviceCategories.length > 0 ? (
                      serviceCategories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))
                    ) : (
                      <option value="Genel">Genel</option>
                    )}
                  </select>
                </div>

                {['kuafor', 'berber', 'guzellik', 'tirnak'].includes(category) && (
                  <div className="md:col-span-2">
                    <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-2">
                      Cinsiyet
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'all', label: 'Hepsi' },
                        { value: 'male', label: 'Erkek' },
                        { value: 'female', label: 'Kadın' },
                      ].map((gender) => (
                        <button
                          key={gender.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, gender: gender.value as any })}
                          className={`h-11 px-4 rounded-full border-2 transition-all font-heading font-medium text-sm ${
                            formData.gender === gender.value
                              ? 'border-[var(--liquid-chrome)] bg-white/5 text-[var(--chrome-white)]'
                              : 'border-[var(--obsidian-rim)] text-[var(--muted-lead)] hover:border-[var(--silver-frost)]'
                          }`}
                        >
                          {gender.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-1.5">
                    {categoryInfo.labels.duration} *
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                    required
                    min="1"
                    step="1"
                    placeholder="30"
                    className="w-full h-12 px-4 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-mono outline-none focus:border-[var(--liquid-chrome)] transition-colors"
                  />
                  <p className="font-body text-xs text-[var(--muted-lead)] mt-1.5">
                    {categoryInfo.labels.duration === 'Dakika' && 'Hizmetin ne kadar süreceğini belirtin'}
                    {categoryInfo.labels.duration === 'Gece' && 'Konaklama süresi (gece sayısı)'}
                    {categoryInfo.labels.duration === 'Gün' && 'Etkinlik süresi (gün sayısı)'}
                    {categoryInfo.labels.duration === 'Saat' && 'Hizmet süresi (saat cinsinden)'}
                  </p>
                </div>

                <div>
                  <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-1.5">
                    Fiyat (TL) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    required
                    min="0"
                    step="0.01"
                    placeholder="100"
                    className="w-full h-12 px-4 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-mono outline-none focus:border-[var(--liquid-chrome)] transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)]">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    formData.isActive ? 'bg-[var(--success)]' : 'bg-[var(--slate-elevated)]'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                      formData.isActive ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
                <div>
                  <p className="font-heading font-medium text-[var(--chrome-white)]">
                    Hizmet Aktif
                  </p>
                  <p className="font-body text-xs text-[var(--muted-lead)]">
                    Müşteriler bu hizmeti görebilir ve rezervasyon yapabilir
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/5">
                {service && onDelete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className="px-6 py-3 rounded-xl bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/30 text-red-400 font-heading font-semibold text-sm hover:from-red-500/20 hover:to-red-600/20 hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Trash2 size={18} strokeWidth={2.5} />
                    <span>Sil</span>
                  </button>
                )}
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={onClose}
                  className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-[var(--silver-frost)] font-heading font-semibold text-sm hover:bg-white/10 hover:border-white/20 hover:text-[var(--chrome-white)] transition-all active:scale-95"
                >
                  İptal
                </button>
                <ChromaticButton type="submit" loading={loading} className="flex items-center gap-2 px-8 py-3 shadow-lg shadow-purple-500/20">
                  <Save size={18} strokeWidth={2.5} />
                  <span>Kaydet</span>
                </ChromaticButton>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
