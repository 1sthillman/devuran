/**
 * ============================================================================
 * AKILLI İŞLETME OLUŞTURMA SİSTEMİ - TYPE DEFİNİTİONS
 * ============================================================================
 * 
 * TÜM İŞ MODELLERİNE UYUM SAĞLAYAN DİNAMİK SORU-CEVAP TABANLI SETUP
 */

export interface BusinessSetupQuestion {
  id: string;
  text: string;
  description?: string;
  type: 'boolean' | 'select' | 'multi-select' | 'text' | 'number';
  options?: { value: string; label: string; description?: string }[];
  dependency?: {
    questionId: string;
    requiredValue: any;
  };
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: RegExp;
  };
  capabilityMapping?: {
    field: keyof import('./businessCapabilities').BusinessCapabilities;
    trueValue?: any;
    falseValue?: any;
    customMapper?: (answer: any) => any;
  };
}

export interface BusinessSetupAnswer {
  questionId: string;
  value: any;
}

export interface BusinessSetupState {
  // Temel bilgiler
  businessName: string;
  businessDescription: string;
  
  // Kategori
  categoryType: 'preset' | 'custom';
  selectedPreset?: string;
  customCategory?: {
    name: string;
    icon: string;
  };
  
  // Soru-cevap
  answers: BusinessSetupAnswer[];
  
  // Türetilen capabilities
  derivedCapabilities?: import('./businessCapabilities').BusinessCapabilities;
  
  // Wizard progress
  currentStep: number;
  completedSteps: number[];
}

export interface BusinessSetupStep {
  id: number;
  title: string;
  description: string;
  questions: BusinessSetupQuestion[];
}
