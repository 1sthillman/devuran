/**
 * ============================================================================
 * İŞLETME SETUP HOOK - MERKEZI İŞ MANTIK YÖNETİMİ
 * ============================================================================
 * 
 * Setup wizard için state management, validasyon, ve iş mantığı
 */

import { useState, useCallback, useEffect } from 'react';
import type { 
  BusinessSetupState, 
  BusinessSetupAnswer,
  BusinessSetupStep 
} from '@/types/businessSetup';
import { BUSINESS_SETUP_STEPS } from '@/config/businessSetupQuestions';
import {
  getActiveQuestionsForStep,
  isStepComplete,
  deriveCapabilitiesFromAnswers,
  buildSalonFromSetup,
  validateSetupComplete,
  shouldShowQuestion
} from '@/utils/businessSetupEngine';

export function useBusinessSetup() {
  const [state, setState] = useState<BusinessSetupState>({
    businessName: '',
    businessDescription: '',
    categoryType: 'preset',
    answers: [],
    currentStep: 1,
    completedSteps: []
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  // Aktif sorular (dependency kontrolü ile)
  const activeQuestions = getActiveQuestionsForStep(state.currentStep, state.answers);
  const currentStepInfo = BUSINESS_SETUP_STEPS.find(s => s.id === state.currentStep);

  // Step tamamlanma durumu
  const isCurrentStepComplete = isStepComplete(state.currentStep, state.answers);
  
  // Toplam ilerleme yüzdesi
  const progress = (state.completedSteps.length / BUSINESS_SETUP_STEPS.length) * 100;

  /**
   * Cevap güncelle - Merkezi update fonksiyonu
   */
  const updateAnswer = useCallback((questionId: string, value: any) => {
    setState(prev => {
      const existingIndex = prev.answers.findIndex(a => a.questionId === questionId);
      const newAnswers = [...prev.answers];

      if (existingIndex >= 0) {
        newAnswers[existingIndex] = { questionId, value };
      } else {
        newAnswers.push({ questionId, value });
      }

      // Bağımlı soruların cevaplarını temizle
      const updatedAnswers = cleanDependentAnswers(newAnswers, questionId);

      // Temel bilgiler state'e de kaydet
      const updates: Partial<BusinessSetupState> = { answers: updatedAnswers };
      
      if (questionId === 'business_name') updates.businessName = value;
      if (questionId === 'business_description') updates.businessDescription = value;
      if (questionId === 'category_type') updates.categoryType = value;
      if (questionId === 'preset_category') updates.selectedPreset = value;
      if (questionId === 'custom_category_name') {
        updates.customCategory = { name: value, icon: 'HelpCircle' };
      }

      return { ...prev, ...updates };
    });

    setIsDirty(true);
    setValidationErrors([]);
  }, []);

  /**
   * Bağımlı soruların cevaplarını temizle
   */
  const cleanDependentAnswers = useCallback((
    answers: BusinessSetupAnswer[], 
    changedQuestionId: string
  ): BusinessSetupAnswer[] => {
    // Tüm sorularda bu soruya bağımlı olanları bul ve temizle
    const dependentQuestionIds: string[] = [];
    
    BUSINESS_SETUP_STEPS.forEach(step => {
      step.questions.forEach(q => {
        if (q.dependency?.questionId === changedQuestionId) {
          dependentQuestionIds.push(q.id);
        }
      });
    });

    // Bağımlı soruların cevaplarını kaldır
    return answers.filter(a => !dependentQuestionIds.includes(a.questionId));
  }, []);

  /**
   * Sonraki adım
   */
  const goToNextStep = useCallback(() => {
    if (!isCurrentStepComplete) {
      setValidationErrors(['Lütfen tüm zorunlu alanları doldurun']);
      return false;
    }

    setState(prev => ({
      ...prev,
      completedSteps: [...new Set([...prev.completedSteps, prev.currentStep])],
      currentStep: Math.min(prev.currentStep + 1, BUSINESS_SETUP_STEPS.length)
    }));

    setValidationErrors([]);
    return true;
  }, [isCurrentStepComplete]);

  /**
   * Önceki adım
   */
  const goToPrevStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 1)
    }));
    setValidationErrors([]);
  }, []);

  /**
   * Belirli bir step'e atla
   */
  const goToStep = useCallback((stepId: number) => {
    // Sadece tamamlanmış step'lere atlayabilir
    if (state.completedSteps.includes(stepId - 1) || stepId === 1) {
      setState(prev => ({ ...prev, currentStep: stepId }));
      setValidationErrors([]);
    }
  }, [state.completedSteps]);

  /**
   * State'i sıfırla
   */
  const reset = useCallback(() => {
    setState({
      businessName: '',
      businessDescription: '',
      categoryType: 'preset',
      answers: [],
      currentStep: 1,
      completedSteps: []
    });
    setValidationErrors([]);
    setIsDirty(false);
  }, []);

  /**
   * Capabilities'i hesapla (live preview için)
   */
  const derivedCapabilities = deriveCapabilitiesFromAnswers(state.answers);

  /**
   * Final validasyon
   */
  const validate = useCallback(() => {
    const validation = validateSetupComplete(state);
    setValidationErrors(validation.errors);
    return validation.isValid;
  }, [state]);

  /**
   * Salon objesi oluştur (submit için)
   */
  const buildSalon = useCallback((userId: string, ownerId: string) => {
    return buildSalonFromSetup(state, userId, ownerId);
  }, [state]);

  /**
   * Otomatik kaydetme (tarayıcı kapanırsa)
   */
  useEffect(() => {
    if (isDirty) {
      sessionStorage.setItem('businessSetup', JSON.stringify(state));
    }
  }, [state, isDirty]);

  /**
   * Kurtarma (sayfa yenilenirse)
   */
  useEffect(() => {
    const saved = sessionStorage.getItem('businessSetup');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(parsed);
        setIsDirty(true);
      } catch (error) {
        console.error('Setup kurtarma hatası:', error);
      }
    }
  }, []);

  return {
    // State
    state,
    activeQuestions,
    currentStepInfo,
    isCurrentStepComplete,
    progress,
    validationErrors,
    isDirty,
    derivedCapabilities,

    // Actions
    updateAnswer,
    goToNextStep,
    goToPrevStep,
    goToStep,
    reset,
    validate,
    buildSalon,

    // Utilities
    totalSteps: BUSINESS_SETUP_STEPS.length,
    canGoBack: state.currentStep > 1,
    canGoForward: isCurrentStepComplete && state.currentStep < BUSINESS_SETUP_STEPS.length,
    isLastStep: state.currentStep === BUSINESS_SETUP_STEPS.length
  };
}
