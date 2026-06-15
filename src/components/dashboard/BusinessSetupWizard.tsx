import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react';
import { CategorySelection } from './BusinessSetupSteps/CategorySelection';
import { BasicInfo } from './BusinessSetupSteps/BasicInfo';
import { AddressInfo } from './BusinessSetupSteps/AddressInfo';
import { MediaUpload } from './BusinessSetupSteps/MediaUpload';
import { WorkingHours } from './BusinessSetupSteps/WorkingHours';
import { ReservationSettings } from './BusinessSetupSteps/ReservationSettings';
import { cn } from '@/lib/utils';
import type { Salon } from '@/types';
import type { CategoryId } from '@/config/categories';

interface BusinessSetupWizardProps {
  salon?: Salon;
  onSave: (salonData: Omit<Salon, 'id' | 'stats' | 'isPremium' | 'isActive' | 'isAcceptingBookings'>) => Promise<void>;
  onClose: () => void;
}

export interface BusinessFormData {
  // Step 1: Category
  category: CategoryId;
  
  // Step 2: Basic Info
  name: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  description: string;
  
  // Step 3: Address
  address: {
    full: string;
    district: string;
    city: string;
    coordinates: { lat: number; lng: number };
  };
  
  // Step 4: Media
  logo: string;
  coverImage: string;
  galleryImages: string[];
  socialMedia: {
    instagram: string;
    tiktok: string;
    youtube: string;
  };
  
  // Step 5: Working Hours
  workingHours: {
    [key: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };
  
  // Step 6: Settings
  settings: {
    advanceBookingDays: number;
    minOrderDays: number;
    autoConfirm: boolean;
    allowCancellation: boolean;
    cancellationHours: number;
    allowQueue: boolean;
    autoConfirmQueue: boolean;
  };
  
  // Required for Salon type
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
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

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
      autoConfirmQueue: salon?.settings?.autoConfirmQueue ?? true
    },
    staff: salon?.staff || [],
    services: salon?.services || []
  });

  // Scroll to top on mount and disable body scroll
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Disable body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const updateFormData = (updates: Partial<BusinessFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!formData.category;
      case 2:
        return !!(formData.name && formData.phone.length === 10);
      case 3:
        return !!(formData.address.full && formData.address.district && formData.address.city);
      case 4:
        return !!formData.coverImage; // At least cover image required
      case 5:
        return Object.values(formData.workingHours).some(day => day.isOpen);
      case 6:
        return true; // Settings are optional
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      if (currentStep < 6) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSave({
        ...formData,
        ownerId: salon?.ownerId || '',
        slug: formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      });
      onClose();
    } catch (error) {
      console.error('Error saving business:', error);
    }
    setLoading(false);
  };

  const canProceed = validateStep(currentStep);
  const isLastStep = currentStep === 6;

  return (
    <div className="fixed inset-0 z-[99999] bg-[var(--void)]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="relative w-full h-screen flex flex-col max-w-7xl mx-auto"
      >
        {/* Header - Clean & Minimal */}
        <div className="px-4 sm:px-8 py-2.5 sm:py-3 border-b border-white/[0.08] flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              {/* Title Section */}
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
            
            {/* Progress Info + Close */}
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

          {/* Thin Progress Bar */}
          <div className="flex items-center gap-1 mt-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="relative flex-1">
                  <div className={cn(
                    "h-0.5 rounded-full transition-all duration-500",
                    completedSteps.includes(step.id)
                      ? "bg-gradient-to-r from-emerald-400 to-teal-400"
                      : step.id === currentStep
                      ? "bg-gradient-to-r from-purple-400 to-pink-400"
                      : "bg-white/10"
                  )}>
                    {step.id === currentStep && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-purple-300 to-pink-300 rounded-full"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 0.8 }}
                      />
                    )}
                  </div>
                </div>
                {index < steps.length - 1 && <div className="w-1" />}
              </div>
            ))}
          </div>
        </div>

        {/* Content - Proper Bottom Padding */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6 pb-28 sm:pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full"
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
                    description: formData.description
                  }}
                  onChange={(data) => updateFormData(data)}
                />
              )}
              {currentStep === 3 && (
                <AddressInfo
                  data={formData.address}
                  onChange={(address) => updateFormData({ address })}
                />
              )}
              {currentStep === 4 && (
                <MediaUpload
                  data={{
                    logo: formData.logo,
                    coverImage: formData.coverImage,
                    galleryImages: formData.galleryImages,
                    socialMedia: formData.socialMedia
                  }}
                  onChange={(data) => updateFormData(data)}
                />
              )}
              {currentStep === 5 && (
                <WorkingHours
                  data={formData.workingHours}
                  onChange={(workingHours) => updateFormData({ workingHours })}
                />
              )}
              {currentStep === 6 && (
                <ReservationSettings
                  data={{
                    settings: formData.settings,
                    bankAccount: formData.bankAccount,
                    depositSettings: formData.depositSettings
                  }}
                  onChange={(data) => updateFormData(data)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Floating Navigation Bar - Bottom Fixed */}
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 pointer-events-none">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-black/70 backdrop-blur-xl border border-white/10 shadow-2xl pointer-events-auto">
              {/* Back Button */}
              <motion.button
                onClick={handleBack}
                disabled={currentStep === 1}
                whileHover={{ scale: currentStep === 1 ? 1 : 1.05 }}
                whileTap={{ scale: currentStep === 1 ? 1 : 0.95 }}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all border backdrop-blur-sm",
                  currentStep === 1
                    ? "bg-white/[0.05] border-white/[0.08] opacity-30 cursor-not-allowed"
                    : "bg-white/10 border-white/20 hover:bg-white/20 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20"
                )}
              >
                <ChevronLeft size={18} className="text-white" strokeWidth={2.5} />
              </motion.button>

              {/* Step Indicator */}
              <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white">
                    {currentStep}/{steps.length}
                  </span>
                  <div className="w-px h-3 bg-white/30" />
                  <span className="text-xs font-bold text-purple-300">
                    {Math.round((completedSteps.length / steps.length) * 100)}%
                  </span>
                </div>
              </div>

              {/* Next/Submit Button */}
              {!isLastStep ? (
                <motion.button
                  onClick={handleNext}
                  disabled={!canProceed}
                  whileHover={{ scale: canProceed ? 1.05 : 1 }}
                  whileTap={{ scale: canProceed ? 0.95 : 1 }}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all border backdrop-blur-sm relative overflow-hidden",
                    !canProceed
                      ? "bg-white/[0.05] border-white/[0.08] opacity-30 cursor-not-allowed"
                      : "border-purple-500/50 shadow-lg shadow-purple-500/30"
                  )}
                >
                  {canProceed && (
                    <motion.div
                      animate={{ 
                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                      }}
                      transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                      className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 via-purple-500 to-pink-500 bg-[length:200%_100%]"
                    />
                  )}
                  <ChevronRight size={18} className="text-white relative z-10" strokeWidth={2.5} />
                </motion.button>
              ) : (
                <motion.button
                  onClick={handleSubmit}
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.05 }}
                  whileTap={{ scale: loading ? 1 : 0.95 }}
                  className="relative px-5 h-10 rounded-full flex items-center justify-center gap-1.5 overflow-hidden border border-emerald-500/50 shadow-lg shadow-emerald-500/30"
                >
                  <motion.div
                    animate={!loading ? { 
                      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                    } : {}}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 via-emerald-500 to-teal-500 bg-[length:200%_100%]"
                  />
                  <span className="relative z-10 flex items-center gap-1.5 text-white font-heading font-bold text-xs">
                    {loading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Kaydediliyor</span>
                      </>
                    ) : (
                      <>
                        <Check size={14} strokeWidth={2.5} />
                        <span>Tamamla</span>
                      </>
                    )}
                  </span>
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
