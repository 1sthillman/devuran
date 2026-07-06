import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, User } from 'lucide-react';
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
  const modalContentRef = useRef<HTMLDivElement>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // ✅ ABONELIK LİMİT KONTROLÜ - Yeni personel eklenirken
      if (!staff) { // Sadece yeni personel eklerken kontrol et
        const { subscriptionService } = await import('@/services/subscriptionService');
        const { salonsService } = await import('@/services/firebaseService');
        
        const subscription = await subscriptionService.getBusinessSubscription(salonId);
        
        if (!subscription || subscription.status !== 'active') {
          alert('Aktif aboneliğiniz yok. Personel eklemek için aktif bir aboneliğe ihtiyacınız var.');
          setLoading(false);
          return;
        }

        // Mevcut salon bilgisini al
        const salon = await salonsService.getById(salonId);
        if (!salon) {
          alert('Salon bilgisi bulunamadı');
          setLoading(false);
          return;
        }

        // Plan özelliklerini al (hem restoran hem normal planlar için)
        let plan;
        if (salon.category === 'restoran' || salon.category === 'kafe') {
          plan = subscription.customFeatures || 
            (await import('@/config/restaurantSubscriptionPlans')).RESTAURANT_SUBSCRIPTION_PLANS.find(p => p.id === subscription.planType)?.features;
        } else {
          plan = subscription.customFeatures || 
            (await import('@/config/subscriptionPlans')).SUBSCRIPTION_PLANS.find(p => p.id === subscription.planType)?.features;
        }
        
        if (!plan) {
          alert('Plan bilgisi bulunamadı');
          setLoading(false);
          return;
        }

        const maxStaff = plan.maxStaff;
        const currentStaffCount = salon.staff?.length || 0;

        // Limit kontrolü
        if (maxStaff !== 'unlimited' && currentStaffCount >= maxStaff) {
          alert(`Personel limiti aşıldı!\n\n${subscription.planType.toUpperCase()} paketinizde maksimum ${maxStaff} personel ekleyebilirsiniz.\n\nDaha fazla personel için paketinizi yükseltin.`);
          setLoading(false);
          return;
        }
      }

      await onSave({
        ...formData,
        salonId,
        rating: staff?.rating || 0,
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
          className="fixed inset-x-0 bottom-0 sm:absolute sm:inset-4 sm:top-auto sm:bottom-auto sm:left-1/2 sm:-translate-x-1/2 sm:max-w-2xl sm:my-auto h-[90vh] sm:h-auto sm:max-h-[90vh] bg-[var(--slate-surface)] rounded-t-3xl sm:rounded-3xl border-t border-white/[0.08] sm:border shadow-2xl flex flex-col overflow-hidden will-change-transform"
        >
          {/* Sticky Header */}
          <div className="sticky top-0 bg-gradient-to-b from-[var(--slate-surface)] to-[var(--slate-surface)]/95 backdrop-blur-xl border-b border-white/[0.08] p-4 sm:p-6 z-10 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
                  <User size={24} className="text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-lg text-[var(--chrome-white)]">
                    {staff ? 'Personel Düzenle' : 'Yeni Personel Ekle'}
                  </h3>
                  <p className="text-xs text-[var(--muted-lead)]">
                    Personel bilgilerini girin
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
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Ad Soyad ve Ünvan - Modern Card */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-4">
                <div>
                  <label className="block font-heading font-bold text-sm text-[var(--chrome-white)] mb-3">
                    Ad Soyad *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Örnek: Ahmet Yılmaz"
                    className="w-full h-12 px-4 rounded-2xl bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body outline-none focus:border-[var(--liquid-chrome)] transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-heading font-bold text-sm text-[var(--chrome-white)] mb-3">
                    Ünvan *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="Örnek: Usta Berber"
                    className="w-full h-12 px-4 rounded-2xl bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body outline-none focus:border-[var(--liquid-chrome)] transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-heading font-bold text-sm text-[var(--chrome-white)] mb-3">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="5XX XXX XX XX"
                    className="w-full h-12 px-4 rounded-2xl bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body outline-none focus:border-[var(--liquid-chrome)] transition-colors"
                  />
                </div>
              </div>

              {/* Fiyat Aralığı - Modern Card */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
                <h4 className="font-heading font-bold text-sm text-[var(--chrome-white)] mb-3">
                  Fiyat Aralığı
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-body text-xs text-[var(--muted-lead)] mb-2">
                      Min Fiyat (TL)
                    </label>
                    <input
                      type="number"
                      value={formData.priceRange.min}
                      onChange={(e) => setFormData({ ...formData, priceRange: { ...formData.priceRange, min: Number(e.target.value) }})}
                      placeholder="0"
                      min="0"
                      className="w-full h-12 px-4 rounded-2xl bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-mono outline-none focus:border-[var(--liquid-chrome)] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block font-body text-xs text-[var(--muted-lead)] mb-2">
                      Max Fiyat (TL)
                    </label>
                    <input
                      type="number"
                      value={formData.priceRange.max}
                      onChange={(e) => setFormData({ ...formData, priceRange: { ...formData.priceRange, max: Number(e.target.value) }})}
                      placeholder="0"
                      min="0"
                      className="w-full h-12 px-4 rounded-2xl bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-mono outline-none focus:border-[var(--liquid-chrome)] transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Fotoğraf */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
                <ImageUploader
                  label="Personel Fotoğrafı"
                  value={formData.photo}
                  onChange={(url) => setFormData({ ...formData, photo: url })}
                  folder="staff"
                  useCloudStorage={true}
                />
              </div>

              {/* Uzmanlık Alanları - Modern Card */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
                <label className="block font-heading font-bold text-sm text-[var(--chrome-white)] mb-3">
                  Uzmanlık Alanları
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={specialtyInput}
                    onChange={(e) => setSpecialtyInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                    placeholder="Örnek: Saç Kesimi"
                    className="flex-1 h-11 px-4 rounded-2xl bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body text-sm outline-none focus:border-[var(--liquid-chrome)] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={addSpecialty}
                    className="px-5 h-11 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-heading font-bold text-sm transition-all shadow-lg shadow-purple-500/20"
                  >
                    Ekle
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.specialties.map((specialty) => (
                    <span
                      key={specialty}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 text-purple-300 font-body text-sm"
                    >
                      {specialty}
                      <button
                        type="button"
                        onClick={() => removeSpecialty(specialty)}
                        className="text-purple-400 hover:text-red-400 transition-colors"
                      >
                        <X size={14} strokeWidth={2.5} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Çalışma Günleri - Modern Card */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
                <label className="block font-heading font-bold text-sm text-[var(--chrome-white)] mb-3">
                  Çalışma Günleri *
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`w-14 h-14 rounded-2xl border-2 transition-all font-heading font-bold ${
                        formData.workingDays.includes(day.value)
                          ? 'border-cyan-500 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400 shadow-lg shadow-cyan-500/20'
                          : 'border-[var(--obsidian-rim)] text-[var(--muted-lead)] hover:border-[var(--silver-frost)]'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Renk Seçimi - Modern Card */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
                <label className="block font-heading font-bold text-sm text-[var(--chrome-white)] mb-3">
                  Takvim Rengi *
                </label>
                <div className="flex flex-wrap gap-3">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-14 h-14 rounded-2xl border-2 transition-all shadow-lg ${
                        formData.color === color
                          ? 'border-[var(--chrome-white)] scale-110'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ 
                        backgroundColor: color,
                        boxShadow: formData.color === color ? `0 8px 20px ${color}40` : undefined
                      }}
                    />
                  ))}
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
                      Personel Aktif
                    </p>
                    <p className="font-body text-xs text-emerald-300/80">
                      Müşteriler bu personeli görebilir ve randevu alabilir
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 bg-gradient-to-t from-[var(--slate-surface)] to-[var(--slate-surface)]/95 backdrop-blur-xl border-t border-white/[0.08] p-4 sm:p-6 flex-shrink-0">
            <form onSubmit={handleSubmit}>
              {/* Tek satırda birleşik butonlar */}
              <div className="flex items-center gap-3">
                {/* Sol: Sil butonu (varsa) */}
                {staff && onDelete && (
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
                    className="flex-1 px-6 py-3.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-heading font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
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
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
