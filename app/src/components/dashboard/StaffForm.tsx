import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Trash2 } from 'lucide-react';
import { ChromaticButton } from '@/components/ui/ChromaticButton';
import { ImageUploader } from '@/components/ui/ImageUploader';
import type { Staff } from '@/types';

interface StaffFormProps {
  staff?: Staff;
  salonId: string;
  onSave: (staff: Omit<Staff, 'id'>) => Promise<void>;
  onDelete?: (staffId: string) => Promise<void>;
  onClose: () => void;
}

const DAYS = [
  { value: 1, label: 'Pzt' },
  { value: 2, label: 'Sal' },
  { value: 3, label: 'Çar' },
  { value: 4, label: 'Per' },
  { value: 5, label: 'Cum' },
  { value: 6, label: 'Cmt' },
  { value: 0, label: 'Paz' },
];

const COLORS = [
  '#2DC24E', '#E5A522', '#60a5fa', '#c8c8d4', '#f472b6', '#a78bfa', '#fb923c', '#34d399'
];

export function StaffForm({ staff, salonId, onSave, onDelete, onClose }: StaffFormProps) {
  const [formData, setFormData] = useState({
    name: staff?.name || '',
    title: staff?.title || '',
    phone: staff?.phone || '',
    photo: staff?.photo || '',
    specialties: staff?.specialties || [],
    workingDays: staff?.workingDays || [1, 2, 3, 4, 5, 6],
    color: staff?.color || COLORS[0],
    isActive: staff?.isActive ?? true,
    priceRange: staff?.priceRange || { min: 0, max: 0 },
  });
  const [specialtyInput, setSpecialtyInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Scroll to top when modal opens
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        ...formData,
        salonId,
        rating: staff?.rating || 0, // Start at 0, not 5
        reviewCount: staff?.reviewCount || 0,
      });
      onClose();
    } catch (error) {
      console.error('Error saving staff:', error);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!staff || !onDelete) return;
    if (!confirm('Bu personeli silmek istediginizden emin misiniz?')) return;
    
    setLoading(true);
    try {
      await onDelete(staff.id);
      onClose();
    } catch (error) {
      console.error('Error deleting staff:', error);
    }
    setLoading(false);
  };

  const toggleDay = (day: number) => {
    setFormData({
      ...formData,
      workingDays: formData.workingDays.includes(day)
        ? formData.workingDays.filter((d) => d !== day)
        : [...formData.workingDays, day],
    });
  };

  const addSpecialty = () => {
    if (specialtyInput.trim() && !formData.specialties.includes(specialtyInput.trim())) {
      setFormData({
        ...formData,
        specialties: [...formData.specialties, specialtyInput.trim()],
      });
      setSpecialtyInput('');
    }
  };

  const removeSpecialty = (specialty: string) => {
    setFormData({
      ...formData,
      specialties: formData.specialties.filter((s) => s !== specialty),
    });
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
            {staff ? 'Personel Duzenle' : 'Yeni Personel Ekle'}
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
                Ad Soyad *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Ornek: Ahmet Yilmaz"
                className="w-full h-12 px-4 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body outline-none focus:border-[var(--liquid-chrome)] transition-colors"
              />
            </div>

            <div>
              <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-2">
                Unvan *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Ornek: Usta Berber"
                className="w-full h-12 px-4 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body outline-none focus:border-[var(--liquid-chrome)] transition-colors"
              />
            </div>

            <div>
              <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-2">
                Telefon
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="5XX XXX XX XX"
                className="w-full h-12 px-4 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body outline-none focus:border-[var(--liquid-chrome)] transition-colors"
              />
            </div>

            {/* Fiyat Aralığı */}
            <div>
              <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-2">
                Min Fiyat (TL)
              </label>
              <input
                type="number"
                value={formData.priceRange.min}
                onFocus={(e) => {
                  if (e.target.value === '0') {
                    setFormData({ 
                      ...formData, 
                      priceRange: { ...formData.priceRange, min: 0 }
                    });
                    e.target.select();
                  }
                }}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  priceRange: { ...formData.priceRange, min: Number(e.target.value) }
                })}
                placeholder="Minimum fiyat"
                min="0"
                className="w-full h-12 px-4 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body outline-none focus:border-[var(--liquid-chrome)] transition-colors"
              />
            </div>

            <div>
              <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-2">
                Max Fiyat (TL)
              </label>
              <input
                type="number"
                value={formData.priceRange.max}
                onFocus={(e) => {
                  if (e.target.value === '0') {
                    setFormData({ 
                      ...formData, 
                      priceRange: { ...formData.priceRange, max: 0 }
                    });
                    e.target.select();
                  }
                }}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  priceRange: { ...formData.priceRange, max: Number(e.target.value) }
                })}
                placeholder="Maximum fiyat"
                min="0"
                className="w-full h-12 px-4 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body outline-none focus:border-[var(--liquid-chrome)] transition-colors"
              />
            </div>

            <div className="md:col-span-2">
              <ImageUploader
                label="Personel Fotoğrafı"
                value={formData.photo}
                onChange={(url) => setFormData({ ...formData, photo: url })}
                folder="staff"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-2">
                Uzmanlik Alanlari
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={specialtyInput}
                  onChange={(e) => setSpecialtyInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                  placeholder="Ornek: Sac Kesimi"
                  className="flex-1 h-10 px-4 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body text-sm outline-none focus:border-[var(--liquid-chrome)] transition-colors"
                />
                <button
                  type="button"
                  onClick={addSpecialty}
                  className="px-4 h-10 rounded-full bg-[var(--liquid-chrome)]/10 border border-[var(--liquid-chrome)] text-[var(--liquid-chrome)] font-heading font-medium text-sm hover:bg-[var(--liquid-chrome)]/20 transition-colors"
                >
                  Ekle
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.specialties.map((specialty) => (
                  <span
                    key={specialty}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/5 border border-[var(--obsidian-rim)] text-[var(--silver-frost)] font-body text-sm"
                  >
                    {specialty}
                    <button
                      type="button"
                      onClick={() => removeSpecialty(specialty)}
                      className="text-[var(--muted-lead)] hover:text-[var(--error)] transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-3">
                Calisma Gunleri *
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`w-14 h-14 rounded-full border-2 transition-all font-heading font-medium ${
                      formData.workingDays.includes(day.value)
                        ? 'border-[var(--liquid-chrome)] bg-white/5 text-[var(--chrome-white)]'
                        : 'border-[var(--obsidian-rim)] text-[var(--muted-lead)] hover:border-[var(--silver-frost)]'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-3">
                Renk *
              </label>
              <div className="flex flex-wrap gap-3">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-12 h-12 rounded-full border-2 transition-all ${
                      formData.color === color
                        ? 'border-[var(--chrome-white)] scale-110'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
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
                Personel Aktif
              </p>
              <p className="font-body text-xs text-[var(--muted-lead)]">
                Musteriler bu personeli gorebilir ve randevu alabilir
              </p>
            </div>
          </div>

          <div className="flex gap-2.5 pt-4">
            {staff && onDelete && (
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

