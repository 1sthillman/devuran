import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Clock, 
  CreditCard, 
  ChevronDown, 
  ChevronUp,
  Store,
  Sparkles
} from 'lucide-react';
import { WorkingHoursEditor } from '@/components/dashboard/WorkingHoursEditor';
import { PaymentSettingsForm } from '@/components/dashboard/PaymentSettingsForm';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { MultiImageUploader } from '@/components/ui/MultiImageUploader';
import { salonsService } from '@/services/firebaseService';
import { storageService } from '@/services/storageService';
import { useUIStore } from '@/store/uiStore';
import type { Salon } from '@/types';

interface SettingsModuleProps {
  salon: Salon;
  onEdit: () => void;
  onRefresh: () => Promise<void>;
}

export function SettingsModule({ salon, onEdit, onRefresh }: SettingsModuleProps) {
  const { addToast } = useUIStore();
  const [expandedSettings, setExpandedSettings] = useState<Record<string, boolean>>({
    salonInfo: false,
    workingHours: false,
    payment: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSettings(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSaveWorkingHours = async (hours: any) => {
    try {
      await salonsService.update(salon.id, { workingHours: hours });
      await onRefresh();
      addToast('Çalışma saatleri güncellendi', 'success');
    } catch (error) {
      console.error('Working hours update error:', error);
      addToast('Çalışma saatleri güncellenemedi', 'error');
    }
  };

  const handleSavePaymentSettings = async (settings: any) => {
    try {
      await salonsService.update(salon.id, { paymentSettings: settings });
      await onRefresh();
      addToast('Ödeme ayarları güncellendi', 'success');
    } catch (error) {
      console.error('Payment settings update error:', error);
      addToast('Ödeme ayarları güncellenemedi', 'error');
    }
  };

  const handleCoverImageUpload = async (file: File) => {
    try {
      const folder = `salons/${salon.id}`;
      const result = await storageService.uploadFile(file, { folder, provider: 'r2' });
      const url = typeof result === 'string' ? result : result.url;
      
      // Delete old cover if exists
      if (salon.coverImage && !salon.coverImage.startsWith('data:')) {
        try {
          const oldUrl = new URL(salon.coverImage);
          await storageService.deleteFile(oldUrl.pathname.substring(1));
        } catch {}
      }

      await salonsService.update(salon.id, { coverImage: url });
      await onRefresh();
      addToast('Kapak görseli güncellendi', 'success');
    } catch (error) {
      console.error('Cover image upload error:', error);
      addToast('Görsel yüklenemedi', 'error');
      throw error;
    }
  };

  const handleGalleryUpdate = async (urls: string[]) => {
    try {
      // Delete removed images from R2
      const oldGallery = (salon as any).gallery || [];
      const removedImages = oldGallery.filter((img: string) => !urls.includes(img));
      
      for (const img of removedImages) {
        if (!img.startsWith('data:')) {
          try {
            const url = new URL(img);
            await storageService.deleteFile(url.pathname.substring(1));
          } catch {}
        }
      }

      await salonsService.update(salon.id, { gallery: urls } as any);
      await onRefresh();
      addToast('Galeri güncellendi', 'success');
    } catch (error) {
      console.error('Gallery update error:', error);
      addToast('Galeri güncellenemedi', 'error');
      throw error;
    }
  };

  return (
    <div className="space-y-3">
      {/* Business Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.02] to-transparent backdrop-blur-xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 pointer-events-none" />
        
        <div className="relative p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Settings size={22} className="text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-[var(--chrome-white)]">
                  İşletme Bilgileri
                </h3>
                <p className="text-xs text-[var(--muted-lead)]">
                  Temel bilgileriniz
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleSection('salonInfo')}
              className="w-10 h-10 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center transition-colors"
            >
              {expandedSettings.salonInfo ? (
                <ChevronUp size={20} className="text-[var(--muted-lead)]" />
              ) : (
                <ChevronDown size={20} className="text-[var(--muted-lead)]" />
              )}
            </button>
          </div>

          <AnimatePresence>
            {expandedSettings.salonInfo && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-white/[0.08] space-y-4">
                  {/* Basic Info Display */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--muted-lead)] mb-1">
                        İşletme Adı
                      </label>
                      <div className="text-sm text-[var(--chrome-white)] font-medium">
                        {salon.name}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--muted-lead)] mb-1">
                        Kategori
                      </label>
                      <div className="text-sm text-[var(--chrome-white)] font-medium capitalize">
                        {salon.category}
                      </div>
                    </div>
                  </div>

                  {/* Cover Image */}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--muted-lead)] mb-2">
                      Kapak Görseli
                    </label>
                    <ImageUploader
                      value={salon.coverImage}
                      onChange={async (url) => {
                        try {
                          await salonsService.update(salon.id, { coverImage: url });
                          await onRefresh();
                          addToast('Kapak görseli güncellendi', 'success');
                        } catch (error) {
                          console.error('Cover image update error:', error);
                          addToast('Görsel güncellenemedi', 'error');
                        }
                      }}
                    />
                  </div>

                  {/* Gallery */}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--muted-lead)] mb-2">
                      Galeri
                    </label>
                    <MultiImageUploader
                      value={(salon as any).gallery || []}
                      onChange={handleGalleryUpdate}
                      maxImages={6}
                      folder={`salons/${salon.id}/gallery`}
                    />
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={onEdit}
                    className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-heading font-semibold text-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Store size={18} />
                    Tüm Bilgileri Düzenle
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Working Hours */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.02] to-transparent backdrop-blur-xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 pointer-events-none" />
        
        <div className="relative p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Clock size={22} className="text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-[var(--chrome-white)]">
                  Çalışma Saatleri
                </h3>
                <p className="text-xs text-[var(--muted-lead)]">
                  Haftalık çalışma programı
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleSection('workingHours')}
              className="w-10 h-10 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center transition-colors"
            >
              {expandedSettings.workingHours ? (
                <ChevronUp size={20} className="text-[var(--muted-lead)]" />
              ) : (
                <ChevronDown size={20} className="text-[var(--muted-lead)]" />
              )}
            </button>
          </div>

          <AnimatePresence>
            {expandedSettings.workingHours && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-white/[0.08]">
                  <WorkingHoursEditor
                    initialHours={salon.workingHours as any || {}}
                    onSave={handleSaveWorkingHours}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Payment Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.02] to-transparent backdrop-blur-xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 pointer-events-none" />
        
        <div className="relative p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CreditCard size={22} className="text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-[var(--chrome-white)]">
                  Ödeme Ayarları
                </h3>
                <p className="text-xs text-[var(--muted-lead)]">
                  Banka hesapları ve ödeme bilgileri
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleSection('payment')}
              className="w-10 h-10 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center transition-colors"
            >
              {expandedSettings.payment ? (
                <ChevronUp size={20} className="text-[var(--muted-lead)]" />
              ) : (
                <ChevronDown size={20} className="text-[var(--muted-lead)]" />
              )}
            </button>
          </div>

          <AnimatePresence>
            {expandedSettings.payment && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-white/[0.08]">
                  <PaymentSettingsForm
                    settings={(salon as any).paymentSettings || { bankTransferEnabled: false, bankAccounts: [] }}
                    onSave={handleSavePaymentSettings}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
            <Sparkles size={14} className="text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-heading font-semibold text-purple-300 mb-1">
              Ayarlarınızı Güncel Tutun
            </p>
            <p className="text-xs text-purple-300/80 leading-relaxed">
              Çalışma saatleri ve ödeme bilgilerinizi güncel tutarak müşterilerinize daha iyi hizmet verebilirsiniz.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
