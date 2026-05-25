import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Star,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Tag,
  Ban,
  Edit,
  Save,
  AlertTriangle,
  Crown,
  ChevronDown,
} from 'lucide-react';
import { customerService, type Customer } from '@/services/customerService';
import { useUIStore } from '@/store/uiStore';

interface CustomerDetailModalProps {
  customer: Customer;
  salonId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export function CustomerDetailModal({
  customer,
  salonId,
  onClose,
  onUpdate,
}: CustomerDetailModalProps) {
  const { addToast } = useUIStore();
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(customer.notes || '');
  const [tags, setTags] = useState<string[]>(customer.tags || []);
  const [newTag, setNewTag] = useState('');
  const [rating, setRating] = useState(customer.rating || 0);
  const [showBanConfirm, setShowBanConfirm] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        customerService.updateCustomerNotes(customer.id, salonId, notes),
        customerService.updateCustomerTags(customer.id, salonId, tags),
      ]);
      addToast('Müşteri bilgileri güncellendi', 'success');
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error saving customer:', error);
      addToast('Kaydetme başarısız', 'error');
    }
    setSaving(false);
  };

  const handleBan = async () => {
    if (!banReason.trim()) {
      addToast('Lütfen bir sebep girin', 'error');
      return;
    }

    setSaving(true);
    try {
      await customerService.banCustomer(customer.id, salonId, banReason, 'owner');
      addToast('Müşteri engellendi', 'success');
      setShowBanConfirm(false);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error banning customer:', error);
      addToast('Engelleme başarısız', 'error');
    }
    setSaving(false);
  };

  const handleUnban = async () => {
    setSaving(true);
    try {
      await customerService.unbanCustomer(customer.id, salonId);
      addToast('Müşteri engeli kaldırıldı', 'success');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error unbanning customer:', error);
      addToast('İşlem başarısız', 'error');
    }
    setSaving(false);
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: '100%', scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: '100%', scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative bg-slate-900/95 backdrop-blur-xl border border-white/10 w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-2xl sm:rounded-3xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-[var(--slate-surface)]/95 backdrop-blur-xl border-b border-white/5 px-4 sm:px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <span className="font-heading font-bold text-2xl text-white">
                    {customer.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="font-display font-bold text-xl sm:text-2xl text-[var(--chrome-white)]">
                    {customer.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    {customer.status === 'vip' && (
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                        <Crown size={12} className="text-yellow-400" />
                        <span className="font-heading font-semibold text-xs text-yellow-400">VIP</span>
                      </div>
                    )}
                    {customer.isBanned && (
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30">
                        <Ban size={12} className="text-red-400" />
                        <span className="font-heading font-semibold text-xs text-red-400">Engelli</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 rounded-full hover:bg-white/10 transition-all active:scale-90"
              >
                <X size={24} className="text-[var(--muted-lead)]" />
              </button>
            </div>

            {/* Drag indicator for mobile */}
            <div className="sm:hidden flex justify-center -mt-2">
              <div className="w-12 h-1 rounded-full bg-white/20" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 pb-safe">
            {/* Ban Warning */}
            {customer.isBanned && (
              <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-red-500/10 to-pink-500/10 border border-red-500/20">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={20} className="sm:size-6 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-heading font-bold text-sm sm:text-base text-red-400 mb-2">
                      Bu müşteri engellenmiş
                    </p>
                    <p className="font-body text-xs sm:text-sm text-red-300 mb-2">
                      Sebep: {customer.bannedReason}
                    </p>
                    <p className="font-body text-xs text-red-300/70 mb-4">
                      {formatDate(customer.bannedAt!)} tarihinde engellendi
                    </p>
                    <button
                      onClick={handleUnban}
                      disabled={saving}
                      className="px-6 py-2.5 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 font-heading font-semibold text-sm transition-all active:scale-95 disabled:opacity-50"
                    >
                      {saving ? 'İşleniyor...' : 'Engeli Kaldır'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 rounded-3xl bg-white/[0.03] border border-white/5">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Phone size={18} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-xs text-[var(--muted-lead)] mb-1">Telefon</p>
                  <p className="font-mono text-sm text-[var(--chrome-white)] truncate">{customer.phone}</p>
                </div>
              </div>
              {customer.email && (
                <div className="flex items-center gap-3 p-4 rounded-3xl bg-white/[0.03] border border-white/5">
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <Mail size={18} className="text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-xs text-[var(--muted-lead)] mb-1">E-posta</p>
                    <p className="font-body text-sm text-[var(--chrome-white)] truncate">{customer.email}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-3xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mb-3 mx-auto">
                  <Calendar size={20} className="text-blue-400" />
                </div>
                <p className="font-mono font-bold text-2xl text-[var(--chrome-white)] text-center mb-1">
                  {customer.totalAppointments}
                </p>
                <p className="font-body text-xs text-[var(--muted-lead)] text-center">Randevu</p>
              </div>
              <div className="p-4 rounded-3xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mb-3 mx-auto">
                  <DollarSign size={20} className="text-green-400" />
                </div>
                <p className="font-mono font-bold text-xl text-[var(--chrome-white)] text-center mb-1">
                  ₺{customer.totalSpent.toLocaleString('tr-TR')}
                </p>
                <p className="font-body text-xs text-[var(--muted-lead)] text-center">Harcama</p>
              </div>
              <div className="p-4 rounded-3xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center mb-3 mx-auto">
                  <Star size={20} className="text-yellow-400" />
                </div>
                <p className="font-mono font-bold text-2xl text-[var(--chrome-white)] text-center mb-1">
                  {customer.rating || 0}
                </p>
                <p className="font-body text-xs text-[var(--muted-lead)] text-center">Değerlendirme</p>
              </div>
            </div>

            {/* Visit Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/5">
                <p className="font-body text-xs text-[var(--muted-lead)] mb-2">İlk Ziyaret</p>
                <p className="font-mono text-sm text-[var(--chrome-white)]">
                  {formatDate(customer.firstVisit)}
                </p>
              </div>
              <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/5">
                <p className="font-body text-xs text-[var(--muted-lead)] mb-2">Son Ziyaret</p>
                <p className="font-mono text-sm text-[var(--chrome-white)]">
                  {formatDate(customer.lastVisit)}
                </p>
              </div>
            </div>

            {/* Rating */}
            <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-base text-[var(--chrome-white)]">
                  Müşteri Değerlendirmesi
                </h3>
                {rating > 0 && !isEditing && (
                  <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold">
                    Kaydedildi ✓
                  </span>
                )}
              </div>
              <p className="font-body text-xs text-[var(--muted-lead)] mb-4">
                Bu müşteriyi 1-5 yıldız arasında değerlendirin
              </p>
              <div className="flex items-center justify-center gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      // Yeni rating'i ayarla
                      setRating(star);
                      
                      // Hemen kaydet
                      try {
                        await customerService.rateCustomer(customer.id, salonId, star);
                        addToast(`${star} yıldız olarak değerlendirildi`, 'success');
                        onUpdate();
                      } catch (error) {
                        console.error('Rating error:', error);
                        addToast('Değerlendirme kaydedilemedi', 'error');
                        // Hata durumunda eski değere geri dön
                        setRating(customer.rating || 0);
                      }
                    }}
                    className="transition-all hover:scale-125 active:scale-110 cursor-pointer"
                  >
                    <Star
                      size={40}
                      strokeWidth={2}
                      className={`${
                        star <= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-transparent text-gray-600'
                      } transition-all duration-200`}
                    />
                  </button>
                ))}
              </div>
              {rating === 0 && (
                <p className="text-center text-sm text-[var(--muted-lead)] mt-3">
                  Henüz değerlendirilmemiş - Yıldızlara tıklayarak değerlendirin
                </p>
              )}
              {rating > 0 && (
                <p className="text-center text-sm text-yellow-400 mt-3 font-semibold">
                  {rating} / 5 Yıldız
                </p>
              )}
            </div>

            {/* Tags */}
            <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5">
              <h3 className="font-heading font-bold text-base text-[var(--chrome-white)] mb-4">
                Etiketler
              </h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {tags.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center gap-2 px-3 py-2 rounded-full bg-blue-500/10 border border-blue-500/20"
                  >
                    <Tag size={14} className="text-blue-400" />
                    <span className="font-body text-sm text-blue-400">{tag}</span>
                    {isEditing && (
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-red-400 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                {tags.length === 0 && (
                  <p className="text-sm text-[var(--muted-lead)]">Henüz etiket eklenmemiş</p>
                )}
              </div>
              {isEditing && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    placeholder="Yeni etiket..."
                    className="flex-1 px-4 py-3 rounded-full bg-[var(--slate-elevated)] border border-white/10 text-[var(--chrome-white)] font-body text-sm focus:outline-none focus:border-[var(--liquid-chrome)]"
                  />
                  <button
                    onClick={addTag}
                    className="px-6 py-3 rounded-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-heading font-semibold text-sm transition-all active:scale-95"
                  >
                    Ekle
                  </button>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5">
              <h3 className="font-heading font-bold text-base text-[var(--chrome-white)] mb-4">
                Notlar
              </h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={!isEditing}
                placeholder="Müşteri hakkında notlar..."
                rows={4}
                className="w-full px-4 py-3 rounded-3xl bg-[var(--slate-elevated)] border border-white/10 text-[var(--chrome-white)] font-body text-sm focus:outline-none focus:border-[var(--liquid-chrome)] disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              />
            </div>

            {/* Favorite Services & Staff */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5">
                <h3 className="font-heading font-bold text-sm text-[var(--chrome-white)] mb-3">
                  Favori Hizmetler
                </h3>
                <div className="space-y-2">
                  {customer.favoriteServices.slice(0, 3).map((service) => (
                    <div
                      key={service}
                      className="px-3 py-2 rounded-full bg-purple-500/10 text-purple-400 font-body text-xs text-center"
                    >
                      {service}
                    </div>
                  ))}
                  {customer.favoriteServices.length === 0 && (
                    <p className="text-xs text-[var(--muted-lead)] text-center">Henüz yok</p>
                  )}
                </div>
              </div>
              <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5">
                <h3 className="font-heading font-bold text-sm text-[var(--chrome-white)] mb-3">
                  Favori Personel
                </h3>
                <div className="space-y-2">
                  {customer.favoriteStaff.slice(0, 3).map((staff) => (
                    <div
                      key={staff}
                      className="px-3 py-2 rounded-full bg-pink-500/10 text-pink-400 font-body text-xs text-center"
                    >
                      {staff}
                    </div>
                  ))}
                  {customer.favoriteStaff.length === 0 && (
                    <p className="text-xs text-[var(--muted-lead)] text-center">Henüz yok</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="sticky bottom-0 bg-[var(--slate-surface)]/95 backdrop-blur-xl border-t border-white/5 px-4 sm:px-6 py-4 pb-safe">
            {!isEditing ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-500/30 text-blue-400 font-heading font-bold transition-all active:scale-95"
                >
                  <Edit size={20} />
                  <span>Düzenle</span>
                </button>
                {!customer.isBanned && (
                  <button
                    onClick={() => setShowBanConfirm(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 border border-red-500/30 text-red-400 font-heading font-bold transition-all active:scale-95"
                  >
                    <Ban size={20} />
                    <span>Engelle</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setNotes(customer.notes || '');
                    setTags(customer.tags || []);
                  }}
                  className="flex-1 px-6 py-4 rounded-full bg-white/5 hover:bg-white/10 text-[var(--muted-lead)] font-heading font-bold transition-all active:scale-95"
                >
                  İptal
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 border border-green-500/30 text-green-400 font-heading font-bold transition-all active:scale-95 disabled:opacity-50"
                >
                  <Save size={20} />
                  <span>{saving ? 'Kaydediliyor...' : 'Kaydet'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Ban Confirmation Modal */}
          <AnimatePresence>
            {showBanConfirm && (
              <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm z-10">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="w-full max-w-md bg-[var(--slate-surface)] p-6 sm:p-8 rounded-[2rem] border border-white/10 shadow-2xl"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
                      <Ban size={28} className="text-red-400" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-xl text-[var(--chrome-white)]">
                        Müşteriyi Engelle
                      </h3>
                      <p className="font-body text-sm text-[var(--muted-lead)]">
                        Bu işlem geri alınabilir
                      </p>
                    </div>
                  </div>

                  <p className="font-body text-sm text-[var(--muted-lead)] mb-5">
                    {customer.name} engellendiğinde işletmenizi göremeyecek ve randevu alamayacak.
                  </p>

                  <textarea
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="Engelleme sebebi (zorunlu)"
                    rows={3}
                    className="w-full px-5 py-4 rounded-3xl bg-[var(--slate-elevated)] border border-white/10 text-[var(--chrome-white)] font-body text-sm focus:outline-none focus:border-red-500/50 resize-none mb-5"
                  />

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowBanConfirm(false);
                        setBanReason('');
                      }}
                      className="flex-1 px-6 py-3.5 rounded-full bg-white/5 hover:bg-white/10 text-[var(--muted-lead)] font-heading font-bold transition-all active:scale-95"
                    >
                      İptal
                    </button>
                    <button
                      onClick={handleBan}
                      disabled={saving || !banReason.trim()}
                      className="flex-1 px-6 py-3.5 rounded-full bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 border border-red-500/30 text-red-400 font-heading font-bold transition-all active:scale-95 disabled:opacity-50"
                    >
                      {saving ? 'Engelleniyor...' : 'Engelle'}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
