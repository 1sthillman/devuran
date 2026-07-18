import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Check, Sparkles, AlertTriangle } from 'lucide-react';
import { CategorySelection, type CategorySelectionValue } from './BusinessSetupSteps/CategorySelection';
import { BasicInfo } from './BusinessSetupSteps/BasicInfo';
import { AddressInfo } from './BusinessSetupSteps/AddressInfo';
import { MediaUpload } from './BusinessSetupSteps/MediaUpload';
import { WorkingHours } from './BusinessSetupSteps/WorkingHours';
import { ReservationSettings } from './BusinessSetupSteps/ReservationSettings';
import { cn } from '@/lib/utils';
import { slugify } from '@/utils/slugify';
import { deriveTerminology, DEFAULT_CAPABILITIES, getPresetById } from '@/types/businessCapabilities';
import type { BusinessCapabilities } from '@/types/businessCapabilities';
import type { Salon } from '@/types';

interface BusinessSetupWizardProps {
  salon?: Salon;
  currentUserId: string;
  userBusinessCategory?: string;
  onSave: (salonData: Omit<Salon, 'id' | 'stats' | 'isPremium' | 'isActive' | 'isAcceptingBookings'>) => Promise<void>;
  onClose: () => void;
}

export interface BusinessFormData {
  categoryId: string;
  categoryLabel: string;
  capabilities: BusinessCapabilities;
  name: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  description: string;
  address: {
    full: string;
    district: string;
    city: string;
    coordinates: { lat: number; lng: number };
  };
  logo: string;
  coverImage: string;
  galleryImages: string[];
  socialMedia: {
    instagram: string;
    tiktok: string;
    youtube: string;
  };
  workingHours: {
    [key: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };
  settings: {
    advanceBookingDays: number;
    minOrderDays: number;
    autoConfirm: boolean;
    allowCancellation: boolean;
    cancellationHours: number;
    allowQueue: boolean;
    autoConfirmQueue: boolean;
    mobileService?: boolean;
  };
  // ❌ KALDIRILDI: staff ve services wizard'da düzenlenmiyor
  // Ayrı koleksiyonlarda yönetilir, wizard bunları silmemeli
  bankAccount?: {
    bankName: string;
    iban: string;
    accountHolder: string;
  };
  depositSettings?: {
    enabled: boolean;
    percentage: number;
    minAmount: number;
  };
}

function resolveInitialCategory(salon?: Salon, userBusinessCategory?: string): CategorySelectionValue {
  const anySalon = salon as any;

  if (anySalon?.categoryId && anySalon?.capabilities) {
    return {
      categoryId: anySalon.categoryId,
      categoryLabel: anySalon.categoryLabel || salon?.category || anySalon.categoryId,
      capabilities: anySalon.capabilities,
    };
  }

  if (userBusinessCategory && !salon) {
    const userPreset = getPresetById(userBusinessCategory);
    if (userPreset) {
      return {
        categoryId: userPreset.id,
        categoryLabel: userPreset.name,
        capabilities: userPreset.capabilities,
      };
    }
  }

  const legacyPreset = salon?.category ? getPresetById(salon.category) : undefined;
  if (legacyPreset) {
    return {
      categoryId: legacyPreset.id,
      categoryLabel: legacyPreset.name,
      capabilities: legacyPreset.capabilities,
    };
  }

  return {
    categoryId: '',
    categoryLabel: salon?.category || '',
    capabilities: DEFAULT_CAPABILITIES,
  };
}

const STEP_META = [
  { id: 1, title: 'Profil', subtitle: 'İşletmeniz nasıl çalışıyor?' },
  { id: 2, title: 'Bilgiler', subtitle: 'İletişim detayları' },
  { id: 3, title: 'Adres', subtitle: 'Konum bilgileri' },
  { id: 4, title: 'Görseller', subtitle: 'Logo & fotoğraflar' },
  { id: 5, title: 'Çalışma', subtitle: 'Açılış saatleri' },
];

export function BusinessSetupWizard({ salon, currentUserId, userBusinessCategory, onSave, onClose }: BusinessSetupWizardProps) {
  // ✅ Edit mode'da kategori adımını atla (1. adım), direkt 2. adımdan başla
  const initialStep = salon ? 2 : (!salon && userBusinessCategory ? 2 : 1);
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [completedSteps, setCompletedSteps] = useState<number[]>(
    salon ? [1] : (userBusinessCategory && !salon ? [1] : [])
  );
  const [loading, setLoading] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

  const initialCategory = useMemo(() => resolveInitialCategory(salon, userBusinessCategory), [salon, userBusinessCategory]);

  const [formData, setFormData] = useState<BusinessFormData>({
    categoryId: initialCategory.categoryId,
    categoryLabel: initialCategory.categoryLabel,
    capabilities: initialCategory.capabilities,
    name: salon?.name || '',
    phone: salon?.phone || '',
    whatsappNumber: salon?.whatsappNumber || '',
    email: salon?.email || '',
    description: salon?.description || '',
    address: salon?.address || {
      full: '',
      district: '',
      city: 'İstanbul',
      coordinates: { lat: 41.0082, lng: 28.9784 },
    },
    logo: salon?.logo || '',
    coverImage: salon?.coverImage || '',
    galleryImages: salon?.galleryImages || [],
    socialMedia: {
      instagram: salon?.socialMedia?.instagram || '',
      tiktok: salon?.socialMedia?.tiktok || '',
      youtube: salon?.socialMedia?.youtube || '',
    },
    workingHours: (salon?.workingHours as any) || {
      monday: { open: '09:00', close: '21:30', isOpen: true },
      tuesday: { open: '09:00', close: '21:30', isOpen: true },
      wednesday: { open: '09:00', close: '21:30', isOpen: true },
      thursday: { open: '09:00', close: '21:30', isOpen: true },
      friday: { open: '09:00', close: '21:30', isOpen: true },
      saturday: { open: '09:00', close: '21:30', isOpen: true },
      sunday: { open: '10:00', close: '21:30', isOpen: true },
    },
    settings: {
      advanceBookingDays: salon?.settings?.advanceBookingDays || 30,
      minOrderDays: salon?.settings?.minOrderDays || 0,
      autoConfirm: salon?.settings?.autoConfirm ?? true,
      allowCancellation: salon?.settings?.allowCancellation ?? true,
      cancellationHours: salon?.settings?.cancellationHours || 24,
      allowQueue: salon?.settings?.allowQueue ?? true,
      autoConfirmQueue: salon?.settings?.autoConfirmQueue ?? true,
      mobileService: salon?.settings?.mobileService ?? false,
    },
    // ❌ KALDIRILDI: staff ve services wizard'da düzenlenmiyor
    // Bunlar ayrı koleksiyonlarda (services/{id}, staff/{id}) tutulur
  });

  const terminology = useMemo(() => deriveTerminology(formData.capabilities), [formData.capabilities]);

  // ✅ Artık 5 adım var - terminoloji gerek yok
  const steps = STEP_META;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const updateFormData = (updates: Partial<BusinessFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    setStepError(null);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!formData.categoryId && !!formData.categoryLabel;
      case 2:
        // ✅ Telefon validasyonu: rakamları temizle ve 10 hane kontrolü
        const cleanPhone = formData.phone.replace(/\D/g, '');
        return !!(formData.name && cleanPhone.length === 10);
      case 3:
        return !!(formData.address.full && formData.address.district && formData.address.city);
      case 4:
        // ✅ Kapak görseli opsiyonel - logo varsa da geçerli
        return !!(formData.coverImage || formData.logo);
      case 5:
        return Object.values(formData.workingHours).some((day) => day.isOpen);
      default:
        return false;
    }
  };

  const getStepErrorMessage = (step: number): string => {
    switch (step) {
      case 1:
        return 'Devam etmeden önce işletme profilinizi seçmelisiniz.';
      case 2:
        return 'İşletme adı ve 10 haneli geçerli bir telefon numarası girmelisiniz.';
      case 3:
        return 'Şehir, ilçe ve tam adres alanlarını doldurmalısınız.';
      case 4:
        return 'Devam etmek için en az bir logo veya kapak görseli yüklemelisiniz.';
      case 5:
        return 'En az bir gün açık olarak işaretlenmelidir.';
      default:
        return 'Devam etmeden önce bu adımı tamamlayın.';
    }
  };

  const handleNext = () => {
    console.log('🔵 İLERİ butonu tıklandı - Step:', currentStep);
    console.log('🔵 Validasyon:', validateStep(currentStep));
    console.log('🔵 FormData:', formData);
    
    if (!validateStep(currentStep)) {
      setStepError(getStepErrorMessage(currentStep));
      return;
    }
    setStepError(null);
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
      console.log('✅ Yeni step:', currentStep + 1);
    }
  };

  const handleBack = () => {
    console.log('🔙 GERİ butonu tıklandı');
    setStepError(null);
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    // ✅ Sadece 5 adım var artık
    for (let step = 1; step <= 5; step++) {
      if (!validateStep(step)) {
        setStepError(`Lütfen ${steps[step - 1].title} adımını tamamlayın.`);
        setCurrentStep(step);
        return;
      }
    }

    setLoading(true);

    try {
      const salonData: any = {
        category: formData.categoryLabel,
        categoryId: formData.categoryId,
        categoryLabel: formData.categoryLabel,
        capabilities: formData.capabilities,
        name: formData.name,
        phone: formData.phone,
        whatsappNumber: formData.whatsappNumber,
        email: formData.email,
        description: formData.description,
        address: formData.address,
        logo: formData.logo,
        coverImage: formData.coverImage,
        galleryImages: formData.galleryImages,
        socialMedia: formData.socialMedia,
        workingHours: formData.workingHours,
        settings: formData.settings,
        // ❌ KALDIRILDI: staff ve services wizard'da düzenlenmiyor
        // Bunlar ayrı koleksiyonlarda tutulur, wizard onları silmemeli
        slug: slugify(formData.name),
      };

      // ✅ ownerId sadece yeni işletme oluştururken eklenir (edit mode'da korumalı alan)
      if (!salon) {
        salonData.ownerId = currentUserId;
      }

      if (formData.bankAccount?.iban) {
        salonData.bankAccount = formData.bankAccount;
      }
      if (formData.depositSettings?.enabled !== undefined) {
        salonData.depositSettings = formData.depositSettings;
      }

      await onSave(salonData);
    } catch (error) {
      console.error('İşletme kaydedilirken hata:', error);
      setStepError('İşletme kaydedilemedi: ' + (error as any).message);
      setLoading(false);
    }
  };

  const isLastStep = currentStep === 5; // ✅ Artık 5 adım var
  const isStepValid = validateStep(currentStep);

  return (
    <div className="fixed inset-0 z-[99999] bg-[var(--void)]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="relative w-full h-screen flex flex-col max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="px-4 sm:px-8 py-2.5 sm:py-3 border-b border-white/[0.08] flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                  <Sparkles size={12} className="text-purple-400" />
                  <span className="text-xs font-semibold text-purple-300">{salon ? 'Düzenle' : 'Yeni'}</span>
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg sm:text-xl text-[var(--chrome-white)]">
                    {steps[currentStep - 1].title}
                  </h3>
                  <p className="text-xs text-[var(--muted-lead)]">{steps[currentStep - 1].subtitle}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 ml-4">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-purple-300">
                  {Math.round((completedSteps.length / steps.length) * 100)}%
                </div>
                <div className="text-xs text-[var(--muted-lead)]">
                  {currentStep}/{steps.length}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/[0.05] hover:bg-white/[0.08] flex items-center justify-center transition-colors flex-shrink-0"
              >
                <X size={18} className="text-[var(--muted-lead)]" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 mt-2">
            {steps.map((step) => (
              <div
                key={step.id}
                className={cn(
                  'flex-1 h-1 rounded-full transition-all duration-300',
                  step.id < currentStep
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                    : step.id === currentStep
                    ? 'bg-gradient-to-r from-purple-400 to-pink-400'
                    : 'bg-white/10'
                )}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 pb-32">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Edit mode'da kategori adımı gösterilmez - değiştirilemez */}
              {currentStep === 1 && !salon && (
                <CategorySelection
                  value={{
                    categoryId: formData.categoryId,
                    categoryLabel: formData.categoryLabel,
                    capabilities: formData.capabilities,
                  }}
                  onChange={(value) => {
                    console.log('📝 CategorySelection onChange:', value);
                    updateFormData(value);
                  }}
                />
              )}
              {currentStep === 2 && (
                <BasicInfo
                  data={{
                    name: formData.name,
                    phone: formData.phone,
                    whatsappNumber: formData.whatsappNumber,
                    email: formData.email,
                    description: formData.description,
                  }}
                  onChange={(data) => updateFormData(data)}
                />
              )}
              {currentStep === 3 && (
                <AddressInfo data={formData.address} onChange={(data) => updateFormData({ address: data })} />
              )}
              {currentStep === 4 && (
                <MediaUpload
                  data={{
                    logo: formData.logo,
                    coverImage: formData.coverImage,
                    galleryImages: formData.galleryImages,
                    socialMedia: formData.socialMedia,
                  }}
                  onChange={(data) => updateFormData(data)}
                />
              )}
              {currentStep === 5 && (
                <WorkingHours data={formData.workingHours} onChange={(data) => updateFormData({ workingHours: data })} />
              )}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {stepError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-3 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5"
              >
                <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">{stepError}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer - STICKY BOTTOM - HER ZAMAN GÖRÜNÜR */}
        <div 
          className="sticky bottom-0 left-0 right-0 z-50 px-4 sm:px-8 py-4 sm:py-5 border-t border-white/[0.08] bg-[var(--void)] flex-shrink-0"
          style={{ 
            paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.3)'
          }}
        >
          <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex-shrink-0 px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-heading font-semibold text-sm text-white flex items-center gap-2 active:scale-95 min-w-[100px] justify-center"
            >
              <ChevronLeft size={18} />
              <span>Geri</span>
            </button>

            <div className="flex-1 text-center px-2">
              <div className="text-xs text-purple-300 font-bold mb-1">
                Adım {currentStep} / {steps.length}
              </div>
              {!isStepValid && (
                <div className="text-xs text-orange-400">
                  Devam etmek için formu doldurun
                </div>
              )}
            </div>

            {isLastStep ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-shrink-0 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-heading font-bold text-sm text-white flex items-center gap-2 shadow-lg shadow-emerald-500/30 active:scale-95 min-w-[120px] justify-center"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Kaydediliyor...</span>
                  </>
                ) : (
                  <>
                    <Check size={18} strokeWidth={2.5} />
                    <span className="font-bold">Tamamla</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="flex-shrink-0 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all font-heading font-bold text-sm text-white flex items-center gap-2 shadow-lg shadow-purple-500/30 active:scale-95 min-w-[120px] justify-center"
              >
                <span className="font-bold">İleri</span>
                <ChevronRight size={18} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
