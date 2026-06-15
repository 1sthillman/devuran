import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Check, Sparkles, AlertCircle, Info } from 'lucide-react';
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
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showSuccessEffect, setShowSuccessEffect] = useState(false);
  const [missingFields, setMissingFields] = useState<Array<{ step: number; title: string; fields: string[] }>>([]);

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

  // Detaylı validasyon kontrolü - hangi alanlar eksik?
  const getDetailedValidation = () => {
    const missing: Array<{ step: number; title: string; fields: string[] }> = [];

    // Step 1: Kategori
    if (!formData.category) {
      missing.push({
        step: 1,
        title: 'Kategori',
        fields: ['İşletme kategorisi seçilmeli']
      });
    }

    // Step 2: Temel Bilgiler
    const step2Missing: string[] = [];
    if (!formData.name) step2Missing.push('İşletme adı');
    if (formData.phone.length !== 10) step2Missing.push('Geçerli telefon numarası');
    if (step2Missing.length > 0) {
      missing.push({
        step: 2,
        title: 'Temel Bilgiler',
        fields: step2Missing
      });
    }

    // Step 3: Adres
    const step3Missing: string[] = [];
    if (!formData.address.full) step3Missing.push('Tam adres');
    if (!formData.address.district) step3Missing.push('İlçe');
    if (!formData.address.city) step3Missing.push('Şehir');
    if (step3Missing.length > 0) {
      missing.push({
        step: 3,
        title: 'Adres',
        fields: step3Missing
      });
    }

    // Step 4: Görseller
    if (!formData.coverImage) {
      missing.push({
        step: 4,
        title: 'Görseller',
        fields: ['Kapak fotoğrafı']
      });
    }

    // Step 5: Çalışma Saatleri
    const hasOpenDay = Object.values(formData.workingHours).some(day => day.isOpen);
    if (!hasOpenDay) {
      missing.push({
        step: 5,
        title: 'Çalışma Saatleri',
        fields: ['En az bir gün açık olmalı']
      });
    }

    return missing;
  };

  const handleNext = () => {
    // Adım validasyonu geçerse completed olarak işaretle
    if (validateStep(currentStep) && !completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    // Her durumda ileri git (validation olmadan)
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    // Önce detaylı validasyon yap
    const validation = getDetailedValidation();
    
    if (validation.length > 0) {
      setMissingFields(validation);
      setShowValidationModal(true);
      return;
    }
    
    setLoading(true);
    
    try {
      // Salon data hazırla - ownerId'yi sadece yeni oluşturmada ekle
      const salonData: any = {
        ...formData,
        slug: formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      };
      
      // Sadece yeni salon oluşturuluyorsa ownerId ekle
      if (!salon && !(salonData as any).ownerId) {
        (salonData as any).ownerId = salon?.ownerId || '';
      }
      
      // Save the salon
      await onSave(salonData);
      
      setLoading(false);
      
      // Show confetti immediately after save
      setShowSuccessEffect(true);
      
      // Wait 5 seconds, then redirect (modal stays open during confetti)
      setTimeout(() => {
        // Redirect to overview page
        window.location.href = '/dashboard?tab=overview';
      }, 5000);
      
    } catch (error) {
      console.error('Error saving business:', error);
      setLoading(false);
    }
  };

  const isLastStep = currentStep === 6;

  return (
    <>
      {/* Success Celebration - Render directly, NOT portal */}
      <AnimatePresence>
        {showSuccessEffect && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[999999] pointer-events-none"
        >
          {/* Modern Confetti Explosion - From Top */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(200)].map((_, i) => {
              const colors = [
                '#FFD700', '#FF69B4', '#00CED1', '#FF1493', '#FFB6C1',
                '#87CEEB', '#FFA500', '#FF6347', '#7B68EE', '#20B2AA',
                '#FF00FF', '#00FF7F', '#FF4500', '#DA70D6', '#48D1CC',
                '#FFFF00', '#FF00CC', '#00FFFF', '#FF6B9D', '#C71585'
              ];
              const shapes = ['circle', 'square', 'triangle', 'rectangle', 'star'];
              const shape = shapes[Math.floor(Math.random() * shapes.length)];
              const color = colors[Math.floor(Math.random() * colors.length)];
              const startX = Math.random() * 100;
              const wobble = (Math.random() - 0.5) * 60;
              const duration = 3.5 + Math.random() * 2.5; // Longer duration
              const delay = Math.random() * 0.8;
              const size = 6 + Math.random() * 10;
              const rotation = Math.random() * 360;
              const spinSpeed = (Math.random() - 0.5) * 1440; // More rotation
              
              return (
                <motion.div
                  key={`top-${i}`}
                  initial={{ 
                    x: `${startX}vw`,
                    y: '-12%',
                    rotate: rotation,
                    scale: 1,
                    opacity: 1
                  }}
                  animate={{ 
                    x: [`${startX}vw`, `${startX + wobble}vw`, `${startX + wobble * 0.3}vw`],
                    y: '115%',
                    rotate: rotation + spinSpeed,
                    opacity: [1, 1, 1, 0.8, 0.5],
                    scale: [1, 1.1, 0.9, 0.8],
                  }}
                  transition={{
                    duration,
                    delay,
                    ease: [0.33, 1, 0.68, 1],
                  }}
                  className="absolute origin-center"
                  style={{ 
                    width: size,
                    height: shape === 'rectangle' ? size * 1.5 : size,
                    background: color,
                    boxShadow: `0 0 12px ${color}60, 0 0 24px ${color}30`,
                    filter: 'brightness(1.2)',
                    ...(shape === 'circle' && { borderRadius: '50%' }),
                    ...(shape === 'square' && { borderRadius: '2px' }),
                    ...(shape === 'triangle' && { 
                      width: 0,
                      height: 0,
                      background: 'transparent',
                      borderLeft: `${size/2}px solid transparent`,
                      borderRight: `${size/2}px solid transparent`,
                      borderBottom: `${size}px solid ${color}`,
                    }),
                    ...(shape === 'rectangle' && { borderRadius: '1px' }),
                    ...(shape === 'star' && { 
                      clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                    }),
                  }}
                />
              );
            })}
          </div>

          {/* Side Cannons - Left */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(60)].map((_, i) => {
              const colors = ['#FFD700', '#FF69B4', '#00CED1', '#FF1493', '#FFB6C1', '#87CEEB'];
              const color = colors[Math.floor(Math.random() * colors.length)];
              const startY = 20 + Math.random() * 60;
              const angle = -30 + Math.random() * 60; // Shoot to right
              const distance = 40 + Math.random() * 80;
              const duration = 2.5 + Math.random() * 2;
              const delay = Math.random() * 0.6;
              const size = 6 + Math.random() * 8;
              
              return (
                <motion.div
                  key={`left-${i}`}
                  initial={{ 
                    x: '-5%',
                    y: `${startY}%`,
                    rotate: 0,
                    scale: 1,
                    opacity: 1
                  }}
                  animate={{ 
                    x: `${distance}%`,
                    y: `${startY + (Math.random() - 0.5) * 40}%`,
                    rotate: Math.random() * 1080,
                    opacity: [1, 1, 0.6, 0],
                    scale: [1, 1.2, 0.8, 0.5],
                  }}
                  transition={{
                    duration,
                    delay,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  className="absolute rounded-full"
                  style={{ 
                    width: size,
                    height: size,
                    background: color,
                    boxShadow: `0 0 15px ${color}80`,
                  }}
                />
              );
            })}
          </div>

          {/* Side Cannons - Right */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(60)].map((_, i) => {
              const colors = ['#FFD700', '#FF69B4', '#00CED1', '#FF1493', '#FFB6C1', '#87CEEB'];
              const color = colors[Math.floor(Math.random() * colors.length)];
              const startY = 20 + Math.random() * 60;
              const distance = 40 + Math.random() * 80;
              const duration = 2.5 + Math.random() * 2;
              const delay = Math.random() * 0.6;
              const size = 6 + Math.random() * 8;
              
              return (
                <motion.div
                  key={`right-${i}`}
                  initial={{ 
                    x: '105%',
                    y: `${startY}%`,
                    rotate: 0,
                    scale: 1,
                    opacity: 1
                  }}
                  animate={{ 
                    x: `${100 - distance}%`,
                    y: `${startY + (Math.random() - 0.5) * 40}%`,
                    rotate: Math.random() * -1080,
                    opacity: [1, 1, 0.6, 0],
                    scale: [1, 1.2, 0.8, 0.5],
                  }}
                  transition={{
                    duration,
                    delay,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  className="absolute rounded-full"
                  style={{ 
                    width: size,
                    height: size,
                    background: color,
                    boxShadow: `0 0 15px ${color}80`,
                  }}
                />
              );
            })}
          </div>

          {/* Center Burst Explosion */}
          <div className="absolute inset-0 flex items-center justify-center">
            {[...Array(50)].map((_, i) => {
              const angle = (i / 50) * 360;
              const distance = 100 + Math.random() * 200;
              const colors = ['#FFD700', '#FF69B4', '#00CED1', '#FF1493', '#FFB6C1', '#87CEEB'];
              const color = colors[i % colors.length];
              const size = 8 + Math.random() * 6;
              
              return (
                <motion.div
                  key={`burst-${i}`}
                  initial={{ 
                    x: 0,
                    y: 0,
                    scale: 0,
                    opacity: 1
                  }}
                  animate={{ 
                    x: Math.cos(angle * Math.PI / 180) * distance,
                    y: Math.sin(angle * Math.PI / 180) * distance,
                    scale: [0, 1.8, 1.2, 0],
                    opacity: [1, 1, 0.8, 0],
                    rotate: [0, 360, 720],
                  }}
                  transition={{
                    duration: 2.5,
                    delay: Math.random() * 0.3,
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                  className="absolute rounded-full"
                  style={{ 
                    width: size,
                    height: size,
                    background: color,
                    boxShadow: `0 0 20px ${color}, 0 0 40px ${color}40`
                  }}
                />
              );
            })}
          </div>

          {/* Welcome Message Card */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0, rotate: -15, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ 
                type: "spring",
                damping: 12,
                stiffness: 180,
                delay: 0.4
              }}
              className="relative max-w-lg w-full z-10"
            >
              {/* Animated Glow - Stronger and slower */}
              <motion.div
                animate={{ 
                  scale: [1, 1.15, 1],
                  opacity: [0.6, 0.9, 0.6],
                  rotate: [0, 180, 360]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -inset-8 bg-gradient-to-r from-yellow-500/50 via-pink-500/50 via-purple-500/50 to-yellow-500/50 rounded-[56px] blur-3xl"
              />
              
              {/* Card - More prominent */}
              <div className="relative bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] rounded-[44px] border-2 border-white/30 p-12 text-center shadow-2xl backdrop-blur-xl">
                {/* Celebration Icon with Multiple Pulses */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ 
                    scale: 1, 
                    rotate: 0,
                  }}
                  transition={{ 
                    delay: 0.6, 
                    type: "spring", 
                    stiffness: 120,
                    damping: 10
                  }}
                  className="mx-auto w-28 h-28 rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-500 flex items-center justify-center mb-8 shadow-2xl relative"
                >
                  {/* Multiple pulse rings */}
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        scale: [1, 1.5, 1],
                        opacity: [0.6, 0, 0.6]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeOut",
                        delay: i * 0.4
                      }}
                      className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400 to-pink-500"
                    />
                  ))}
                  <Check size={56} className="text-white relative z-10" strokeWidth={4} />
                </motion.div>

                {/* Text with Stagger Animation - Larger text */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <motion.h2 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1, type: "spring", stiffness: 150 }}
                    className="text-5xl font-bold text-white mb-3 font-heading"
                  >
                    🎉 Hoşgeldiniz! 🎉
                  </motion.h2>
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    className="text-2xl text-white/90 font-body mb-8 font-semibold"
                  >
                    İşletmeniz başarıyla oluşturuldu
                  </motion.p>
                  
                  {/* Success Badge with animation */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: 1, 
                      scale: [1, 1.05, 1],
                    }}
                    transition={{ 
                      delay: 1.4,
                      scale: {
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }
                    }}
                    className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500/30 to-teal-500/30 border-2 border-emerald-400/50"
                  >
                    <Sparkles size={22} className="text-emerald-300" />
                    <span className="text-base font-bold text-emerald-200">
                      Panele yönlendiriliyorsunuz...
                    </span>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-emerald-300 border-t-transparent rounded-full"
                    />
                  </motion.div>
                </motion.div>

                {/* Decorative floating emojis - More prominent */}
                <motion.div
                  animate={{ 
                    y: [0, -15, 0],
                    rotate: [0, 15, -15, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute -top-6 -right-6 text-5xl drop-shadow-2xl"
                >
                  🎊
                </motion.div>
                <motion.div
                  animate={{ 
                    y: [0, -12, 0],
                    rotate: [0, -15, 15, 0],
                    scale: [1, 1.15, 1]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                  className="absolute -bottom-6 -left-6 text-5xl drop-shadow-2xl"
                >
                  ✨
                </motion.div>
                <motion.div
                  animate={{ 
                    scale: [1, 1.3, 1],
                    y: [0, -10, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute top-10 -right-10 text-4xl drop-shadow-2xl"
                >
                  🎈
                </motion.div>
                <motion.div
                  animate={{ 
                    rotate: [0, 20, -20, 0],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ 
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.3
                  }}
                  className="absolute bottom-10 -left-10 text-4xl drop-shadow-2xl"
                >
                  🌟
                </motion.div>
              </div>
            </motion.div>
          </div>
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

        {/* Content - Less padding, more compact */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-3 sm:py-4">
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

          {/* Navigation Bar - STICKY with aggressive safe area */}
          <div 
            className="sticky bottom-0 left-0 right-0 w-full bg-gradient-to-t from-[var(--void)] via-[var(--void)]/98 to-transparent pt-4 pb-8"
          >
            <div className="flex items-center justify-center px-4 pb-4">
              <div className="w-full max-w-lg">
                <div className="relative">
                  {/* Glow */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/30 via-pink-600/30 to-purple-600/30 rounded-3xl blur-xl" />
                  
                  {/* Main Container */}
                  <div className="relative flex items-center gap-2.5 px-5 py-3.5 rounded-3xl bg-black/98 backdrop-blur-3xl border-2 border-purple-500/30 shadow-2xl">
                    {/* Back Button */}
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBack();
                      }}
                      disabled={currentStep === 1}
                      whileHover={{ scale: currentStep === 1 ? 1 : 1.05 }}
                      whileTap={{ scale: currentStep === 1 ? 1 : 0.95 }}
                      className={cn(
                        "relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all shrink-0",
                        currentStep === 1
                          ? "opacity-20 cursor-not-allowed bg-white/5"
                          : "bg-white/10 hover:bg-white/15 hover:border hover:border-purple-400/50"
                      )}
                    >
                      <ChevronLeft size={22} className="text-white" strokeWidth={2.5} />
                    </motion.button>

                    {/* Step Indicator */}
                    <div className="flex-1 flex items-center justify-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white">
                          {currentStep}
                        </span>
                        <span className="text-sm text-white/50">
                          / {steps.length}
                        </span>
                      </div>
                      
                      <div className="w-px h-5 bg-white/20" />
                      
                      <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        {Math.round((completedSteps.length / steps.length) * 100)}%
                      </span>
                    </div>

                    {/* Next/Complete Button */}
                    {!isLastStep ? (
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNext();
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                      >
                        <motion.div
                          animate={{ 
                            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                          }}
                          transition={{ 
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear"
                          }}
                          className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-[length:200%_100%] rounded-2xl"
                        />
                        <ChevronRight size={22} className="relative z-10 text-white" strokeWidth={2.5} />
                      </motion.button>
                    ) : (
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSubmit();
                        }}
                        disabled={loading}
                        whileHover={{ scale: loading ? 1 : 1.05 }}
                        whileTap={{ scale: loading ? 1 : 0.95 }}
                        className="relative px-6 h-12 rounded-2xl flex items-center justify-center gap-2 overflow-hidden shrink-0 cursor-pointer z-50"
                        style={{ pointerEvents: 'auto' }}
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
                          className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 bg-[length:200%_100%]"
                        />
                        
                        <span className="relative z-10 flex items-center gap-2 text-white font-heading font-bold text-base whitespace-nowrap">
                          {loading ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                              />
                              <span>Kaydediliyor</span>
                            </>
                          ) : (
                            <>
                              <Check size={18} strokeWidth={2.5} />
                              <span>Tamamla</span>
                            </>
                          )}
                        </span>
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>

      {/* Validation Modal - Mobile Optimized */}
      <AnimatePresence>
        {showValidationModal && (
          <div className="fixed inset-0 z-[100000] flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowValidationModal(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            {/* Modal Content - Mobile Bottom Sheet Style */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              className="relative w-full sm:max-w-md bg-[var(--void)] sm:rounded-3xl rounded-t-3xl border-t sm:border border-yellow-500/30 shadow-2xl shadow-yellow-500/20 overflow-hidden max-h-[85vh] sm:max-h-[90vh] flex flex-col"
            >
              {/* Gradient Header */}
              <div className="relative px-6 py-5 bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10 border-b border-white/[0.08] flex-shrink-0">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center flex-shrink-0">
                    <AlertCircle size={20} className="text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-bold text-lg text-white">
                      Eksik Bilgiler Var
                    </h3>
                    <p className="text-sm text-[var(--muted-lead)] mt-0.5">
                      Zorunlu alanları doldurmanız gerekiyor
                    </p>
                  </div>
                  <button
                    onClick={() => setShowValidationModal(false)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0"
                  >
                    <X size={16} className="text-white" />
                  </button>
                </div>
              </div>

              {/* Missing Fields List - Scrollable */}
              <div className="px-6 py-4 overflow-y-auto flex-1">
                <div className="space-y-3">
                  {missingFields.map((item, index) => (
                    <motion.div
                      key={item.step}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => {
                        setCurrentStep(item.step);
                        setShowValidationModal(false);
                      }}
                      className="group p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] hover:border-yellow-500/30 transition-all cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        {/* Step Number Badge */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <span className="text-sm font-bold text-yellow-400">
                            {item.step}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white text-sm mb-1.5">
                            {item.title}
                          </h4>
                          <ul className="space-y-1">
                            {item.fields.map((field, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2 text-xs text-[var(--muted-lead)]"
                              >
                                <span className="text-yellow-400 flex-shrink-0 mt-0.5">*</span>
                                <span>{field} tamamlanmalı</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Arrow */}
                        <ChevronRight
                          size={16}
                          className="text-yellow-400/60 group-hover:text-yellow-400 group-hover:translate-x-1 transition-all flex-shrink-0"
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Info Note */}
                <div className="mt-4 p-3 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                  <div className="flex items-start gap-2">
                    <Info size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-300/80">
                      <span className="text-yellow-400 font-bold">*</span> ile işaretli alanlar zorunludur. 
                      Yukarıdaki adımlara tıklayarak eksikleri tamamlayabilirsiniz.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Sticky Bottom */}
              <div className="px-6 py-4 border-t border-white/[0.08] bg-[var(--void)] flex-shrink-0" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))' }}>
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={() => setShowValidationModal(false)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 h-11 rounded-full bg-white/[0.05] hover:bg-white/[0.08] text-white font-semibold text-sm transition-colors"
                  >
                    Kapat
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      setCurrentStep(missingFields[0].step);
                      setShowValidationModal(false);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 h-11 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-bold text-sm shadow-lg shadow-yellow-500/30 transition-all"
                  >
                    İlk Eksik Alana Git
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
