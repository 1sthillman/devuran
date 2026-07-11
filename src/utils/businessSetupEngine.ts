/**
 * ============================================================================
 * AKILLI İŞLETME SETUP ENGINE
 * ============================================================================
 * 
 * Soruları filtreler, cevaplardan BusinessCapabilities türetir, mantık hatalarını önler
 */

import type { 
  BusinessSetupQuestion, 
  BusinessSetupAnswer, 
  BusinessSetupState 
} from '@/types/businessSetup';
import type { BusinessCapabilities, CapacityUnit, BookingModel } from '@/types/businessCapabilities';
import { BUSINESS_SETUP_STEPS } from '@/config/businessSetupQuestions';
import { getPresetCapabilities } from '@/config/businessPresets';

/**
 * Dependency kontrolü - Bir soru gösterilmeli mi?
 */
export function shouldShowQuestion(
  question: BusinessSetupQuestion,
  answers: BusinessSetupAnswer[]
): boolean {
  if (!question.dependency) return true;

  const dependencyAnswer = answers.find(
    a => a.questionId === question.dependency!.questionId
  );

  if (!dependencyAnswer) return false;

  const { requiredValue } = question.dependency;

  // Function dependency (dinamik kontrol)
  if (typeof requiredValue === 'function') {
    return requiredValue(answers);
  }

  // Boolean dependency
  if (typeof requiredValue === 'boolean') {
    return dependencyAnswer.value === requiredValue;
  }

  // String/Array dependency
  if (Array.isArray(dependencyAnswer.value)) {
    return dependencyAnswer.value.includes(requiredValue);
  }

  return dependencyAnswer.value === requiredValue;
}

/**
 * Bir step'teki tüm aktif soruları getir (dependency kontrolü ile)
 */
export function getActiveQuestionsForStep(
  stepId: number,
  answers: BusinessSetupAnswer[]
): BusinessSetupQuestion[] {
  const step = BUSINESS_SETUP_STEPS.find(s => s.id === stepId);
  if (!step) return [];

  return step.questions.filter(q => shouldShowQuestion(q, answers));
}

/**
 * Step tamamlanma kontrolü
 */
export function isStepComplete(
  stepId: number,
  answers: BusinessSetupAnswer[]
): boolean {
  const activeQuestions = getActiveQuestionsForStep(stepId, answers);
  
  return activeQuestions.every(question => {
    const answer = answers.find(a => a.questionId === question.id);
    
    // Validasyon kontrolü
    if (question.validation?.required && !answer) {
      return false;
    }
    
    if (answer && question.validation) {
      const { min, max, pattern } = question.validation;
      
      if (typeof answer.value === 'string') {
        if (min && answer.value.length < min) return false;
        if (max && answer.value.length > max) return false;
        if (pattern && !pattern.test(answer.value)) return false;
      }
      
      if (typeof answer.value === 'number') {
        if (min && answer.value < min) return false;
        if (max && answer.value > max) return false;
      }
    }
    
    return true;
  });
}

/**
 * ✨ ANA MOTOR: Cevaplardan BusinessCapabilities türet
 */
export function deriveCapabilitiesFromAnswers(
  answers: BusinessSetupAnswer[]
): BusinessCapabilities {
  // ÖNCE: Preset seçildi mi? Öyleyse preset'ten başla
  const presetAnswer = answers.find(a => a.questionId === 'preset_category');
  const categoryTypeAnswer = answers.find(a => a.questionId === 'category_type');
  
  let capabilities: Partial<BusinessCapabilities> = {};
  
  if (categoryTypeAnswer?.value === 'preset' && presetAnswer?.value) {
    // Preset'ten başla
    const presetCapabilities = getPresetCapabilities(presetAnswer.value);
    if (presetCapabilities) {
      capabilities = { ...presetCapabilities };
    }
  }

  // Kullanıcının verdiği cevaplarla override et
  for (const answer of answers) {
    // İlgili soruyu bul
    const question = findQuestionById(answer.questionId);
    if (!question?.capabilityMapping) continue;

    const { field, trueValue, falseValue, customMapper } = question.capabilityMapping;

    // Custom mapper varsa kullan
    if (customMapper) {
      (capabilities as any)[field] = customMapper(answer.value);
      continue;
    }

    // Boolean mapping
    if (typeof answer.value === 'boolean') {
      (capabilities as any)[field] = answer.value ? trueValue : falseValue;
      continue;
    }

    // Direct mapping
    (capabilities as any)[field] = answer.value;
  }

  // ✅ AKILLI TÜRETİM: Eksik alanları otomatik doldur
  return fillMissingCapabilities(capabilities as BusinessCapabilities, answers);
}

/**
 * Eksik capability alanlarını akıllıca doldur
 */
function fillMissingCapabilities(
  capabilities: BusinessCapabilities,
  answers: BusinessSetupAnswer[]
): BusinessCapabilities {
  // 1. bookingModels yoksa varsayılan ata
  if (!capabilities.bookingModels || capabilities.bookingModels.length === 0) {
    capabilities.bookingModels = ['appointment'];
  }

  // 2. capacityUnit türet
  if (!capabilities.capacityUnit) {
    if (capabilities.hasStaff && capabilities.isDurationBased) {
      capabilities.capacityUnit = 'staff-slot';
    } else if (capabilities.hasTables) {
      capabilities.capacityUnit = 'table';
    } else if (capabilities.hasProductCatalog) {
      capabilities.capacityUnit = 'unit';
    } else {
      capabilities.capacityUnit = 'unlimited';
    }
  }

  // 3. tableTerminology türet (custom ise)
  const tableTermAnswer = answers.find(a => a.questionId === 'table_terminology');
  const customTermAnswer = answers.find(a => a.questionId === 'custom_table_terminology');
  
  if (tableTermAnswer?.value === 'custom' && customTermAnswer) {
    capabilities.tableTerminology = customTermAnswer.value;
  } else if (tableTermAnswer) {
    capabilities.tableTerminology = tableTermAnswer.value;
  } else if (capabilities.hasTables && !capabilities.tableTerminology) {
    capabilities.tableTerminology = 'masa';
  }

  // 4. Mantık hataları düzelt
  // Masa varsa ama reservation yok → reservation ekle
  if (capabilities.hasTables && !capabilities.bookingModels.includes('reservation')) {
    capabilities.bookingModels.push('reservation');
  }

  // Reservation var ama tarih yapısı belirsiz → tek tarih yap
  if (capabilities.bookingModels.includes('reservation') && capabilities.isDateRangeBased === undefined) {
    capabilities.isDateRangeBased = false;
  }

  // Order var ama ürün kataloğu yok → ürün kataloğu ekle
  if (capabilities.bookingModels.includes('order') && !capabilities.hasProductCatalog) {
    capabilities.hasProductCatalog = true;
  }

  // 5. Konum mantığı
  if (capabilities.hasPhysicalLocation === undefined) {
    capabilities.hasPhysicalLocation = !capabilities.isMobileService;
  }

  // 6. Varsayılanlar
  if (capabilities.requiresDeposit === undefined) {
    capabilities.requiresDeposit = false;
  }

  if (capabilities.autoConfirmDefault === undefined) {
    // Slot bazlı işletmeler otomatik onay
    capabilities.autoConfirmDefault = capabilities.bookingModels.includes('appointment');
  }

  if (capabilities.isSubscriptionBased === undefined) {
    capabilities.isSubscriptionBased = false;
  }

  return capabilities;
}

/**
 * Soru ID'sinden soruyu bul
 */
function findQuestionById(questionId: string): BusinessSetupQuestion | null {
  for (const step of BUSINESS_SETUP_STEPS) {
    const question = step.questions.find(q => q.id === questionId);
    if (question) return question;
  }
  return null;
}

/**
 * Setup state'ten Salon objesi oluştur (Firebase'e kaydedilecek)
 */
export function buildSalonFromSetup(
  state: BusinessSetupState,
  userId: string,
  ownerId: string
): any {
  const capabilities = deriveCapabilitiesFromAnswers(state.answers);
  
  // Kategori belirle
  let category = 'custom';
  let categoryDisplayName = state.businessName;
  
  if (state.categoryType === 'preset' && state.selectedPreset) {
    category = state.selectedPreset;
    categoryDisplayName = getCategoryDisplayName(state.selectedPreset);
  } else if (state.customCategory) {
    categoryDisplayName = state.customCategory.name;
  }

  return {
    name: state.businessName,
    description: state.businessDescription,
    category,
    categoryDisplayName,
    capabilities,
    ownerId,
    createdBy: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
    isVerified: false,
    
    // Boş başlangıç verileri
    staff: [],
    services: [],
    workingHours: generateDefaultWorkingHours(),
    images: [],
    location: null,
    contact: {
      phone: '',
      email: '',
      website: ''
    },
    settings: {
      bookingSettings: {
        minAdvanceBooking: 1,
        maxAdvanceBooking: 30,
        bufferTime: 0,
        cancellationDeadline: capabilities.bookingModels.includes('appointment') ? 2 : 24
      },
      paymentSettings: {
        acceptCash: true,
        acceptCard: false,
        acceptOnlinePayment: false
      },
      notificationSettings: {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true
      }
    }
  };
}

/**
 * Kategori görünen ismini getir
 */
function getCategoryDisplayName(preset: string): string {
  const map: Record<string, string> = {
    hairdresser: 'Kuaför',
    barber: 'Berber',
    beauty: 'Güzellik Salonu',
    nails: 'Tırnak Salonu',
    restaurant: 'Restoran',
    cafe: 'Kafe',
    hotel: 'Otel',
    villa: 'Villa',
    bungalow: 'Bungalov',
    wedding_hall: 'Düğün Salonu',
    event_venue: 'Etkinlik Mekanı',
    photographer: 'Fotoğrafçı',
    videographer: 'Video Prodüksiyon',
    catering: 'Catering',
    car_rental: 'Araç Kiralama',
    sport_facility: 'Spor Tesisi'
  };
  return map[preset] || preset;
}

/**
 * Varsayılan çalışma saatleri
 */
function generateDefaultWorkingHours() {
  return [
    { day: 'monday', isOpen: true, openTime: '09:00', closeTime: '18:00', breaks: [] },
    { day: 'tuesday', isOpen: true, openTime: '09:00', closeTime: '18:00', breaks: [] },
    { day: 'wednesday', isOpen: true, openTime: '09:00', closeTime: '18:00', breaks: [] },
    { day: 'thursday', isOpen: true, openTime: '09:00', closeTime: '18:00', breaks: [] },
    { day: 'friday', isOpen: true, openTime: '09:00', closeTime: '18:00', breaks: [] },
    { day: 'saturday', isOpen: true, openTime: '09:00', closeTime: '14:00', breaks: [] },
    { day: 'sunday', isOpen: false, openTime: '09:00', closeTime: '18:00', breaks: [] }
  ];
}

/**
 * Validasyon: Setup tamamlandı mı?
 */
export function validateSetupComplete(state: BusinessSetupState): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Temel kontroller
  if (!state.businessName || state.businessName.trim().length < 2) {
    errors.push('İşletme adı en az 2 karakter olmalı');
  }

  if (!state.businessDescription || state.businessDescription.trim().length < 10) {
    errors.push('İşletme açıklaması en az 10 karakter olmalı');
  }

  if (!state.categoryType) {
    errors.push('Kategori türü seçilmeli');
  }

  // Tüm step'lerin tamamlanma kontrolü
  for (let i = 1; i <= BUSINESS_SETUP_STEPS.length; i++) {
    if (!isStepComplete(i, state.answers)) {
      const step = BUSINESS_SETUP_STEPS.find(s => s.id === i);
      errors.push(`"${step?.title}" adımı tamamlanmadı`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
