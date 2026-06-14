import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, Sparkles, Plus, Scissors, Settings } from 'lucide-react';
import { ChromaticButton } from '@/components/ui/ChromaticButton';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { getServiceTemplates, type ServiceTemplate } from '@/config/serviceTemplates';
import { getCategoryById, type CategoryId } from '@/config/categories';
import { needsAdvancedPricing } from '@/utils/pricingHelpers';
import { AdvancedPricingSection } from './AdvancedPricingSection';
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formData, setFormData] = useState<Partial<Service>>({
    name: service?.name || '',
    description: service?.description || '',
    category: service?.category || (templates[0]?.category || 'Genel'),
    duration: service?.duration || 30,
    price: service?.price || 0,
    gender: service?.gender || 'all',
    image: service?.image || '',
    isActive: service?.isActive ?? true,
    requiresDeposit: service?.requiresDeposit ?? false, // 🆕 Kapora gerekli mi?
    pricingRules: service?.pricingRules,
    addOns: service?.addOns || [],
  });
  const [loading, setLoading] = useState(false);
  const modalContentRef = useRef<HTMLDivElement>(null);

  const hasAdvancedPricing = needsAdvancedPricing(category);
  
  // Kategori tipini belirle
  const getCategoryType = (): 'accommodation' | 'event' | 'catering' | 'other' => {
    if (['bungalov', 'otel', 'villa', 'kamp-alani'].includes(category)) return 'accommodation';
    if (['dugun-organizasyon', 'nisan-organizasyon', 'dogum-gunu', 'kurumsal-etkinlik', 'dugun-salonu', 'etkinlik-alani'].includes(category)) return 'event';
    if (category === 'catering') return 'catering';
    return 'other';
  };

  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    
    if (modalContentRef.current) {
      modalContentRef.current.scrollTop = 0;
    }

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
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
        name: formData.name!,
        description: formData.description || '',
        category: formData.category!,
        duration: formData.duration!,
        price: formData.price!,
        gender: formData.gender!,
        image: formData.image || '',
        isActive: formData.isActive!,
        requiresDeposit: formData.requiresDeposit, // 🆕 Kapora ayarı
        salonId,
        staffIds: service?.staffIds || [],
        pricingRules: formData.pricingRules,
        addOns: formData.addOns,
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

  return createPortal(
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-xl"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-x-0 bottom-0 sm:absolute sm:inset-4 sm:top-auto sm:bottom-auto sm:left-1/2 sm:-translate-x-1/2 sm:max-w-3xl sm:my-auto h-[90vh] sm:h-auto sm:max-h-[90vh] bg-[var(--slate-surface)] rounded-t-3xl sm:rounded-3xl border-t border-white/[0.08] sm:border shadow-2xl flex flex-col overflow-hidden will-change-transform"
        >
          {/* Sticky Header */}
          <div className="sticky top-0 bg-gradient-to-b from-[var(--slate-surface)] to-[var(--slate-surface)]/95 backdrop-blur-xl border-b border-white/[0.08] p-4 sm:p-6 z-10 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30 flex-shrink-0">
                  <Scissors size={24} className="text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-lg text-[var(--chrome-white)]">
                    {service ? 'Hizmet Düzenle' : 'Yeni Hizmet Ekle'}
                  </h3>
                  <p className="text-xs text-[var(--muted-lead)]">
                    {categoryInfo.labels.business} için {categoryInfo.labels.service.toLowerCase()}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-2xl bg-white/[0.05] hover:bg-white/[0.08] flex items-center justify-center transition-colors flex-shrink-0 ml-3"
              >
                <X size={20} className="text-[var(--muted-lead)]" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div ref={modalContentRef} className="flex-1 overflow-y-auto p-4 sm:p-6">
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

              <div className="space-y-4">
                {/* Hizmet Adı - Modern Card */}
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
                  <label className="block font-heading font-bold text-sm text-[var(--chrome-white)] mb-3">
                    {categoryInfo.labels.service} Adı *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder={`Örnek: ${templates[0]?.name || 'Hizmet adı'}`}
                    className="w-full h-12 px-4 rounded-2xl bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body outline-none focus:border-[var(--liquid-chrome)] transition-colors"
                  />
                </div>

                {/* Açıklama - Modern Card */}
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
                  <label className="block font-heading font-bold text-sm text-[var(--chrome-white)] mb-3">
                    Açıklama
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    placeholder="Hizmet hakkında kısa açıklama..."
                    className="w-full px-4 py-3 rounded-2xl bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body outline-none focus:border-[var(--liquid-chrome)] transition-colors resize-none"
                  />
                </div>

                {/* Kategori ve Cinsiyet - Modern Card */}
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-4">
                  <div>
                    <label className="block font-heading font-bold text-sm text-[var(--chrome-white)] mb-3">
                      Kategori *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                      className="w-full h-12 px-4 rounded-2xl bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body outline-none focus:border-[var(--liquid-chrome)] transition-colors"
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
                    <div>
                      <label className="block font-heading font-bold text-sm text-[var(--chrome-white)] mb-3">
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
                            className={`h-11 px-4 rounded-2xl border-2 transition-all font-heading font-bold text-sm ${
                              formData.gender === gender.value
                                ? 'border-[var(--liquid-chrome)] bg-[var(--liquid-chrome)]/10 text-[var(--chrome-white)]'
                                : 'border-[var(--obsidian-rim)] text-[var(--muted-lead)] hover:border-[var(--silver-frost)]'
                            }`}
                          >
                            {gender.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Süre ve Fiyat - Modern Card */}
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-heading font-bold text-sm text-[var(--chrome-white)] mb-3">
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
                        className="w-full h-12 px-4 rounded-2xl bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-mono outline-none focus:border-[var(--liquid-chrome)] transition-colors"
                      />
                      <p className="font-body text-xs text-[var(--muted-lead)] mt-2">
                        {categoryInfo.labels.duration === 'Dakika' && 'Hizmetin ne kadar süreceğini belirtin'}
                        {categoryInfo.labels.duration === 'Gece' && 'Konaklama süresi (gece sayısı)'}
                        {categoryInfo.labels.duration === 'Gün' && 'Etkinlik süresi (gün sayısı)'}
                        {categoryInfo.labels.duration === 'Saat' && 'Hizmet süresi (saat cinsinden)'}
                      </p>
                    </div>

                    <div>
                      <label className="block font-heading font-bold text-sm text-[var(--chrome-white)] mb-3">
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
                        className="w-full h-12 px-4 rounded-2xl bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-mono outline-none focus:border-[var(--liquid-chrome)] transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Aktif Durum - Modern Card */}
              <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    className={`relative w-12 h-7 rounded-full transition-colors ${
                      formData.isActive ? 'bg-emerald-500' : 'bg-[var(--slate-elevated)]'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                        formData.isActive ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                  <div>
                    <p className="font-heading font-bold text-emerald-400">
                      Hizmet Aktif
                    </p>
                    <p className="font-body text-xs text-emerald-300/80">
                      Müşteriler bu hizmeti görebilir ve rezervasyon yapabilir
                    </p>
                  </div>
                </div>
              </div>

              {/* Kapora Toggle - Modern Card */}
              <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, requiresDeposit: !formData.requiresDeposit })}
                    className={`relative w-12 h-7 rounded-full transition-colors ${
                      formData.requiresDeposit ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-[var(--slate-elevated)]'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                        formData.requiresDeposit ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                  <div className="flex-1">
                    <p className="font-heading font-bold text-purple-400">
                      Kapora Gerekli
                    </p>
                    <p className="font-body text-xs text-purple-300/80 mt-0.5">
                      {formData.requiresDeposit 
                        ? 'Bu hizmet için ön ödeme alınacak' 
                        : 'Kapora olmadan rezervasyon alınabilir'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Gelişmiş Ayarlar - Sadece belirli kategoriler için */}
              {hasAdvancedPricing && (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Settings size={20} className="text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-heading font-bold text-sm text-[var(--chrome-white)]">
                          Gelişmiş Ayarlar
                        </p>
                        <p className="text-xs text-[var(--muted-lead)]">
                          Fiyatlandırma ve ek hizmetler
                        </p>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: showAdvanced ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Plus size={20} className="text-purple-400" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {showAdvanced && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08]">
                          <AdvancedPricingSection
                            service={formData}
                            onChange={(updates) => setFormData({ ...formData, ...updates })}
                            categoryType={getCategoryType()}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Sticky Footer - Only show when NOT in templates view */}
      {!showTemplates && (
        <div className="sticky bottom-0 bg-gradient-to-t from-[var(--slate-surface)] to-[var(--slate-surface)]/95 backdrop-blur-xl border-t border-white/[0.08] p-4 sm:p-6 flex-shrink-0">
          <form onSubmit={handleSubmit}>
            {/* Tek satırda birleşik butonlar */}
            <div className="flex items-center gap-3">
              {/* Sol: Sil butonu (varsa) */}
              {service && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="group relative px-5 py-3.5 rounded-2xl bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/30 hover:border-red-500/50 transition-all active:scale-95 disabled:opacity-50 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 to-red-600/0 group-hover:from-red-500/20 group-hover:to-red-600/20 transition-all" />
                  <div className="relative flex items-center gap-2">
                    <Trash2 size={18} strokeWidth={2.5} className="text-red-400" />
                    <span className="font-heading font-bold text-sm text-red-400">Sil</span>
                  </div>
                </button>
              )}
              
              {/* Sağ: İptal ve Kaydet birleşik */}
              <div className="flex-1 flex items-center gap-0 rounded-2xl overflow-hidden border border-white/[0.08]">
                {/* İptal */}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3.5 bg-white/[0.02] hover:bg-white/[0.05] text-[var(--silver-frost)] hover:text-[var(--chrome-white)] font-heading font-bold text-sm transition-all border-r border-white/[0.08]"
                >
                  İptal
                </button>
                
                {/* Kaydet */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-heading font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save size={18} strokeWidth={2.5} />
                      <span>Kaydet</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </motion.div>
  </motion.div>
</AnimatePresence>,
document.body
);
}
