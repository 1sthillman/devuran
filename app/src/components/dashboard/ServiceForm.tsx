import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Trash2 } from 'lucide-react';
import { ChromaticButton } from '@/components/ui/ChromaticButton';
import { ImageUploader } from '@/components/ui/ImageUploader';
import type { Service } from '@/types';

interface ServiceFormProps {
  service?: Service;
  salonId: string;
  onSave: (service: Omit<Service, 'id'>) => Promise<void>;
  onDelete?: (serviceId: string) => Promise<void>;
  onClose: () => void;
}

const CATEGORIES = [
  { value: 'Sac Kesimi', label: 'Saç Kesimi' },
  { value: 'Sac Boyama', label: 'Saç Boyama' },
  { value: 'Sac Bakimi', label: 'Saç Bakımı' },
  { value: 'Manikur', label: 'Manikür' },
  { value: 'Pedikur', label: 'Pedikür' },
  { value: 'Cilt Bakimi', label: 'Cilt Bakımı' },
  { value: 'Makyaj', label: 'Makyaj' },
  { value: 'Kirpik', label: 'Kirpik' },
  { value: 'Kas', label: 'Kaş' },
  { value: 'Epilasyon', label: 'Epilasyon' },
  { value: 'Masaj', label: 'Masaj' },
  { value: 'Diger', label: 'Diğer' },
];

export function ServiceForm({ service, salonId, onSave, onDelete, onClose }: ServiceFormProps) {
  const [formData, setFormData] = useState({
    name: service?.name || '',
    description: service?.description || '',
    category: service?.category || CATEGORIES[0].value,
    duration: service?.duration || 30,
    price: service?.price || 0,
    gender: service?.gender || 'all' as 'male' | 'female' | 'all',
    image: service?.image || '',
    isActive: service?.isActive ?? true,
  });
  const [customCategory, setCustomCategory] = useState('');
  const [loading, setLoading] = useState(false);

  // Scroll to top when modal opens
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const categoryToSave = formData.category === 'Diger' && customCategory 
        ? customCategory 
        : formData.category;
      
      await onSave({
        ...formData,
        category: categoryToSave,
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
    if (!confirm('Bu hizmeti silmek istediginizden emin misiniz?')) return;
    
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
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-[var(--slate-surface)] border border-[var(--obsidian-rim)] rounded-3xl p-6 my-4"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-bold text-xl text-[var(--chrome-white)]">
            {service ? 'Hizmet Duzenle' : 'Yeni Hizmet Ekle'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
          >
            <X size={20} className="text-[var(--muted-lead)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-2">
                Hizmet Adi *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full h-12 px-4 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body outline-none focus:border-[var(--liquid-chrome)] transition-colors"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-2">
                Aciklama
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body outline-none focus:border-[var(--liquid-chrome)] transition-colors resize-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-2">
                Kategori *
              </label>
              <select
                value={formData.category}
                onChange={(e) => {
                  setFormData({ ...formData, category: e.target.value });
                  if (e.target.value !== 'Diger') setCustomCategory('');
                }}
                required
                className="w-full h-12 px-4 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body outline-none focus:border-[var(--liquid-chrome)] transition-colors"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Category Input - Shows when "Diğer" is selected */}
            {formData.category === 'Diger' && (
              <div className="md:col-span-2">
                <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-2">
                  Özel Kategori Adı *
                </label>
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  required
                  placeholder="Kategori adını yazın..."
                  className="w-full h-12 px-4 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body outline-none focus:border-[var(--liquid-chrome)] transition-colors"
                />
              </div>
            )}

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

            <div className="md:col-span-2">
              <ImageUploader
                label="Hizmet Görseli (İsteğe Bağlı)"
                value={formData.image}
                onChange={(url) => setFormData({ ...formData, image: url })}
                folder="services"
              />
            </div>

            <div>
              <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-2">
                Sure (dakika) *
              </label>
              <input
                type="number"
                value={formData.duration}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                required
                min="5"
                step="5"
                placeholder="30"
                className="w-full h-12 px-4 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-mono outline-none focus:border-[var(--liquid-chrome)] transition-colors"
              />
            </div>

            <div>
              <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-2">
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
                Musteriler bu hizmeti gorebilir ve randevu alabilir
              </p>
            </div>
          </div>

          <div className="flex gap-2.5 pt-4">
            {service && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-5 py-3 rounded-full bg-[var(--error)]/10 border-2 border-[var(--error)]/30 text-[var(--error)] font-heading font-semibold text-sm hover:bg-[var(--error)]/20 hover:border-[var(--error)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Trash2 size={16} strokeWidth={2.5} />
                <span>Sil</span>
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-full bg-[var(--void)] border-2 border-[var(--obsidian-rim)] text-[var(--silver-frost)] font-heading font-semibold text-sm hover:border-[var(--liquid-chrome)] hover:text-[var(--chrome-white)] transition-all active:scale-95"
            >
              İptal
            </button>
            <ChromaticButton type="submit" loading={loading} className="flex items-center gap-2 px-6 py-3">
              <Save size={16} strokeWidth={2.5} />
              <span>Kaydet</span>
            </ChromaticButton>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

