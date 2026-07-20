/**
 * ============================================================================
 * AKILLI İŞLETME OLUŞTURMA WIZARD - V2 (MOBİL OPTİMİZE)
 * ============================================================================
 * 
 * TÜM İŞLETME TÜRLERİ İÇİN DİNAMİK, KULLANICI DOSTU, MÜKEMMELİYETÇİ SETUP AKIŞI
 * 
 * ÖZELLİKLER:
 * - Akıllı form validasyonu
 * - Real-time öneriler
 * - Otomatik kaydetme
 * - Smooth animasyonlar (mobil optimize)
 * - Hata yönetimi
 * - Accessibility uyumlu
 * 
 * 🔧 MOBİL OPTİMİZASYON:
 * - GPU acceleration
 * - Will-change optimizasyonu
 * - Transform-only animasyonlar
 * - Reduced motion support
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  AlertCircle,
  Loader2,
  Save,
  Eye
} from 'lucide-react';
import { BUSINESS_SETUP_STEPS } from '@/config/businessSetupQuestions';
import { useBusinessSetup } from '@/hooks/useBusinessSetup';
import { BusinessSetupQuestion } from './BusinessSetupQuestion';
import { BusinessSetupProgress } from './BusinessSetupProgress';
import { SmartRecommendations } from './SmartRecommendations';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { salonsService } from '@/services/firebaseService';
import { validateCapabilities } from '@/utils/businessSetupValidator';
import { cn } from '@/lib/utils';

export function BusinessSetupWizard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const shouldReduceMotion = useReducedMotion();

  const {
    state,
    activeQuestions,
    currentStepInfo,
    isCurrentStepComplete,
    progress,
    validationErrors,
    derivedCapabilities,
    updateAnswer,
    goToNextStep,
    goToPrevStep,
    goToStep,
    reset,
    validate,
    buildSalon,
    totalSteps,
    canGoBack,
    isLastStep
  } = useBusinessSetup();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // 🔧 MOBİL OPTİMİZE: Animasyon varyantları
  const pageVariants = shouldReduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 }
      }
    : {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 }
      };

  const pageTransition = {
    duration: shouldReduceMotion ? 0.2 : 0.3,
    ease: [0.4, 0, 0.2, 1] as const // easeOut cubic-bezier
  };

  /**
   * Klavye navigasyonu
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Enter: İleri
      if (e.key === 'Enter' && !e.shiftKey && isCurrentStepComplete) {
        e.preventDefault();
        if (isLastStep) {
          handleSubmit();
        } else {
          goToNextStep();
        }
      }
      
      // Backspace (step başında): Geri
      if (e.key === 'Backspace' && canGoBack) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          goToPrevStep();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCurrentStepComplete, isLastStep, canGoBack, goToNextStep, goToPrevStep]);

  /**
   * Sayfa kapanma uyarısı (değişiklikler varsa)
   */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.answers.length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.answers]);

  /**
   * İşletmeyi kaydet
   */
  const handleSubmit = async () => {
    if (!user) {
      addToast('Lütfen giriş yapın', 'error');
      navigate('/login');
      return;
    }

    // Final validasyon
    if (!validate()) {
      addToast('Lütfen tüm zorunlu alanları doldurun', 'error');
      return;
    }

    // Capabilities validasyonu
    const capValidation = validateCapabilities(derivedCapabilities!);
    if (!capValidation.isValid) {
      addToast('Seçimlerinizde tutarsızlıklar var', 'error');
      console.error('Capability validation errors:', capValidation.errors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Salon objesi oluştur
      const salonData = buildSalon(user.uid, user.uid);
      
      // Firebase'e kaydet
      const result = await salonsService.create(salonData);
      const salonId = result.id;

      // ✅ KRİTİK FIX: salonId'yi user profile'a yaz
      // Date: 2026-07-20
      // Issue: analiz4.md BULGU #1 - User profile'da salonId eksikti, dashboard "işletme yok" gösteriyordu
      const { authService } = await import('@/services/authService');
      await authService.updateUserProfile(user.uid, { salonId });

      // Session storage'ı temizle
      sessionStorage.removeItem('businessSetup');

      addToast('🎉 İşletmeniz başarıyla oluşturuldu!', 'success');
      
      // İşletme paneline yönlendir
      setTimeout(() => {
        navigate(`/dashboard`);
      }, 500);
    } catch (error: any) {
      console.error('Business creation error:', error);
      addToast(error.message || 'İşletme oluşturulamadı', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--primary)] via-[var(--accent)] to-[var(--primary)] p-4 pb-24 flex items-center justify-center">
      <div className="w-full max-w-4xl mb-20">
        {/* Progress */}
        <BusinessSetupProgress
          steps={BUSINESS_SETUP_STEPS}
          currentStep={state.currentStep}
          completedSteps={state.completedSteps}
          onStepClick={goToStep}
        />

        {/* Main Card - GPU Accelerated */}
        <motion.div
          layout
          className="bg-white rounded-2xl shadow-2xl overflow-visible"
          style={{
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            transform: 'translateZ(0)'
          }}
        >
          {/* Question Section */}
          <div className="p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={state.currentStep}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
                style={{
                  willChange: shouldReduceMotion ? 'opacity' : 'opacity, transform'
                }}
              >
                <div className="space-y-6">
                  {activeQuestions.map(question => (
                    <BusinessSetupQuestion
                      key={question.id}
                      question={question}
                      value={state.answers.find(a => a.questionId === question.id)?.value}
                      onChange={(value) => updateAnswer(question.id, value)}
                    />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Smart Recommendations */}
            <div className="mt-6">
              <SmartRecommendations
                answers={state.answers}
                capabilities={derivedCapabilities}
                currentStep={state.currentStep}
              />
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-900 mb-2">Eksik Bilgiler</p>
                    <ul className="text-sm text-red-700 space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Navigation Footer - MOBİL OPTİMİZE: FIXED bottom - HER ZAMAN GÖRÜNÜR */}
          <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-gray-50/95 backdrop-blur-xl border-t border-gray-200 p-3 sm:p-4 lg:p-6 flex items-center justify-between gap-2 sm:gap-3 lg:gap-4 shadow-[0_-4px_24px_rgba(0,0,0,0.15)]"
               style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
            <button
              onClick={goToPrevStep}
              disabled={!canGoBack}
              className="flex-shrink-0 px-3 sm:px-4 lg:px-5 py-2.5 sm:py-3 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 rounded-xl font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 sm:gap-2 shadow-sm text-sm lg:text-base"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">Geri</span>
            </button>

            <div className="flex-1 text-center min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 mb-1 font-semibold">
                <span className="font-bold text-purple-600">{state.currentStep}</span> / {totalSteps}
              </p>
              <div className="w-full max-w-[180px] sm:max-w-xs mx-auto h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>

            {!isLastStep ? (
              <button
                onClick={goToNextStep}
                disabled={isSubmitting}
                className={cn(
                  "flex-shrink-0 px-4 sm:px-5 lg:px-6 py-2.5 sm:py-3 rounded-xl font-bold transition-all flex items-center gap-1.5 sm:gap-2 shadow-lg text-sm lg:text-base active:scale-95",
                  isCurrentStepComplete
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    : "bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-pointer hover:from-gray-500 hover:to-gray-600"
                )}
              >
                <span className="hidden xs:inline font-bold">{isCurrentStepComplete ? 'İleri' : 'Devam'}</span>
                <span className="xs:hidden text-lg">→</span>
                <ChevronRight className="hidden xs:block w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={cn(
                  "flex-shrink-0 px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 rounded-xl font-bold transition-all flex items-center gap-1.5 sm:gap-2 shadow-lg text-sm lg:text-base active:scale-95",
                  isCurrentStepComplete
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                    : "bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-pointer hover:from-gray-500 hover:to-gray-600",
                  isSubmitting && "opacity-50 cursor-not-allowed"
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    <span className="hidden xs:inline">Oluşturuluyor...</span>
                    <span className="xs:hidden">...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="font-bold">Oluştur</span>
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>

        {/* Helper Text - Sadece desktop */}
        <p className="hidden lg:block text-center text-white/80 text-sm mt-4">
          ⌨️ <span className="font-semibold">Enter</span> ile ilerle • <span className="font-semibold">Backspace</span> ile geri dön
        </p>
      </div>
    </div>
  );
}
