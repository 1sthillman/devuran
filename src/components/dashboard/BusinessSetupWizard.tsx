import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Check, Sparkles, AlertCircle } from 'lucide-react';
import { CategorySelection } from './BusinessSetupSteps/CategorySelection';
import { BasicInfo } from './BusinessSetupSteps/BasicInfo';
import { AddressInfo } from './BusinessSetupSteps/AddressInfo';
import { MediaUpload } from './BusinessSetupSteps/MediaUpload';
import { WorkingHours } from './BusinessSetupSteps/WorkingHours';
import { ReservationSettings } from './BusinessSetupSteps/ReservationSettings';
import { cn } from '@/lib/utils';
import { slugify } from '@/utils/slugify';
import { useAuthStore } from '@/store/authStore';
import type { Salon } from '@/types';
import type { CategoryId } from '@/config/categories';

interface BusinessSetupWizardProps {
  salon?: Salon;
  onSave: (salonData: Omit<Salon, 'id' | 'stats' | 'isPremium' | 'isActive' | 'isAcceptingBookings'>) => Promise<void>;
  onClose: () => void;
}

export interface BusinessFormData {
  category: CategoryId;
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
  staff: any[];
  services: any[];
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

const steps = [
  { id: 1, title: 'Kategori', subtitle: 'İşletme tipi seçin' },
  { id: 2, title: 'Bilgiler', subtitle: 'İletişim detayları' },
  { id: 3, title: 'Adres', subtitle: 'Konum bilgileri' },
  { id: 4, title: 'Görseller', subtitle: 'Logo & fotoğraflar' },
  { id: 5, title: 'Çalışma', subtitle: 'Açılış saatleri' },
  { id: 6, title: 'Ayarlar', subtitle: 'Rezervasyon kuralları' }
];

export function BusinessSetupWizard({ salon, onSave, onClose }: BusinessSetupWizardProps) {
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const [formData, setFormData] = useState<BusinessFormData>({
    category: (salon?.category || 'kuafor') as CategoryId,
    name: salon?.name || '',
    phone: salon?.phone || '',
    whatsappNumber: salon?.whatsappNumber || '',
    email: salon?.email || '',
    description: salon?.description || '',
    address: salon?.address || {
      full: '',
      district: '',
      city: 'İstanbul',
      coordinates: { lat: 41.0082, lng: 28.9784 }
    },
    logo: salon?.logo || '',
    coverImage: salon?.coverImage || '',
    galleryImages: salon?.galleryImages || [],
    socialMedia: {
      instagram: salon?.socialMedia?.instagram || '',
      tiktok: salon?.socialMedia?.tiktok || '',
      youtube: salon?.socialMedia?.youtube || ''
    },
    workingHours: (salon?.workingHours as any) || {
      monday: { open: '09:00', close: '21:30', isOpen: true },
      tuesday: { open: '09:00', close: '21:30', isOpen: true },
      wednesday: { open: '09:00', close: '21:30', isOpen: true },
      thursday: { open: '09:00', close: '21:30', isOpen: true },
      friday: { open: '09:00', close: '21:30', isOpen: true },
      saturday: { open: '09:00', close: '21:30', isOpen: true },
      sunday: { open: '10:00', close: '21:30', isOpen: true }
    },
    settings: {
      advanceBookingDays: salon?.settings?.advanceBookingDays || 30,
      minOrderDays: salon?.settings?.minOrderDays || 0,
      autoConfirm: salon?.settings?.autoConfirm ?? true,
      allowCancellation: salon?.settings?.allowCancellation ?? true,
      cancellationHours: salon?.settings?.cancellationHours || 24,
      allowQueue: salon?.settings?.allowQueue ?? true,
      autoConfirmQueue: salon?.settings?.autoConfirmQueue ?? true,
      mobileService: salon?.settings?.mobileService ?? false
    },
    staff: salon?.staff || [],
    services: salon?.services || []
  });

  // Scroll to top and disable body scroll
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const updateFormData = (updates: Partial<BusinessFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  /**
   * Validate current step
   */
  const validateStep = (step: number): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    switch (step) {
      case 1:
        if (!formData.category) errors.push('Kategori seçilmeli');
        break;
      case 2:
        if (!formData.name.trim()) errors.push('İşletme adı gerekli');
        if (formData.phone.length !== 10) errors.push('Geçerli 10 haneli telefon numarası gerekli');
        break;
      case 3:
        if (!formData.address.full.trim()) errors.push('Tam adres gerekli');
        if (!formData.address.district.trim()) errors.push('İlçe seçilmeli');
        if (!formData.address.city.trim()) errors.push('Şehir seçilmeli');
        break;
      case 4:
        if (!formData.coverImage) errors.push('Kapak fotoğrafı gerekli');
        break;
      case 5:
        const hasOpenDay = Object.values(formData.workingHours).some(day => day.isOpen);
        if (!hasOpenDay) errors.push('En az bir gün açık olmalı');
        break;
      case 6:
        // Settings optional
        break;
    }

    return { valid: errors.length === 0, errors };
  };

  /**
   * Handle next button - WITH VALIDATION
   */
  const handleNext = () => {
    const { valid, errors } = validateStep(currentStep);
    
    if (!valid) {
      setValidationErrors(errors);
      setShowValidationModal(true);
      return;
    }

    // Mark step as completed
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }

    // Move to next step
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  /**
   * Handle submit - FINAL VALIDATION
   */
  const handleSubmit = async () => {
    // Validate all steps
    const allErrors: string[] = [];
    for (let step = 1; step <= 6; step++) {
      const { errors } = validateStep(step);
      allErrors.push(...errors);
    }

    if (allErrors.length > 0) {
      setValidationErrors(allErrors);
      setShowValidationModal(true);
      return;
    }

    setLoading(true);

    try {
      // Generate slug with Turkish character support
      const slug = slugify(formData.name);

      // Prepare salon data
      const salonData: any = {
        category: formData.category,
        name: formData.name.trim(),
        phone: formData.phone,
        whatsappNumber: formData.whatsappNumber,
        email: formData.email,
        description: formData.description.trim(),
        address: formData.address,
        logo: formData.logo,
        coverImage: formData.coverImage,
        galleryImages: formData.galleryImages,
        socialMedia: formData.socialMedia,
        workingHours: formData.workingHours,
        settings: formData.settings,
        staff: formData.staff,
        services: formData.services,
        slug,
      };

      // Add ownerId only for NEW salons (not editing)
      if (!salon && user?.uid) {
        salonData.ownerId = user.uid;
      }

      // Add optional fields if defined
      if (formData.bankAccount?.iban) {
        salonData.bankAccount = formData.bankAccount;
      }

      if (formData.depositSettings?.enabled !== undefined) {
        salonData.depositSettings = formData.depositSettings;
      }

      await onSave(salonData);
    } catch (error) {
      console.error('Error saving business:', error);
      setValidationErrors(['İşletme kaydedilemedi: ' + (error as any).message]);
      setShowValidationModal(true);
      setLoading(false);
    }
  };

  const isLastStep = currentStep === 6;

  return (
    <>
      {/* Validation Error Modal */}
      <AnimatePresence>
        {showValidationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowValidationModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-3xl border-2 border-red-500/30 p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={24} className="text-red-400" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-xl text-white mb-2">
                    Eksik Bilgiler
                  </h3>
                  <p className="text-sm text-gray-300">
                    Devam etmek için aşağıdaki alanları doldurun:
                  </p>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                {validationErrors.map((error, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-red-300 bg-red-500/10 rounded-xl p-3">
                    <span className="text-red-400">•</span>
                    <span>{error}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowValidationModal(false)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-heading font-semibold transition-all"
              >
                Anladım
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                    <span className="text-xs font-semibold text-purple-300">
                      {salon ? 'Düzenle' : 'Yeni'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-lg sm:text-xl text-[var(--chrome-white)]">
                      {steps[currentStep - 1].title}
                    </h3>
                    <p className="text-xs text-[var(--muted-lead)]">
                      {steps[currentStep - 1].subtitle}
                    </p>
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

            {/* Progress Bar */}
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
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {currentStep === 1 && (
                  <CategorySelection
                    value={formData.category}
                    onChange={(category) => updateFormData({ category })}
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
                  <AddressInfo
                    data={formData.address}
                    onChange={(data) => updateFormData({ address: data })}
                  />
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
                  <WorkingHours
                    data={formData.workingHours}
                    onChange={(data) => updateFormData({ workingHours: data })}
                  />
                )}
                {currentStep === 6 && (
                  <ReservationSettings
                    data={{
                      settings: formData.settings,
                      bankAccount: formData.bankAccount,
                      depositSettings: formData.depositSettings,
                    }}
                    onChange={(data) => updateFormData(data)}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-8 py-4 border-t border-white/[0.08] flex-shrink-0">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handleBack}
                disabled={currentStep === 1}
                className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-heading font-semibold text-sm text-white flex items-center gap-2"
              >
                <ChevronLeft size={18} />
                Geri
              </button>

              {isLastStep ? (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-heading font-bold text-sm text-white flex items-center gap-2 shadow-lg shadow-emerald-500/30"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Check size={18} strokeWidth={2.5} />
                      Tamamla
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all font-heading font-bold text-sm text-white flex items-center gap-2 shadow-lg shadow-purple-500/30"
                >
                  İleri
                  <ChevronRight size={18} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
