/**
 * Dynamic Wizard Engine - Type Definitions
 * Schema-driven multi-vertical wizard system
 */

export type BusinessType =
  | 'hairdresser'
  | 'barber'
  | 'beauty'
  | 'nails'
  | 'wedding_hall'
  | 'engagement_venue'
  | 'event_venue'
  | 'hotel'
  | 'bungalow'
  | 'villa'
  | 'video_production'
  | 'catering'
  | 'restaurant';

export type StepPrimitiveType =
  | 'ServiceSelection'
  | 'StaffSelection'
  | 'DateTimeSlot'
  | 'DateRange'
  | 'FullDayBlock'
  | 'Capacity'
  | 'PackageSelection'
  | 'AddOnSelection'
  | 'CustomForm'
  | 'Contract'
  | 'Payment'
  | 'ReviewConfirm';

export type FieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'number'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'time'
  | 'file';

export type ValidationRule =
  | 'required'
  | 'email'
  | 'phone'
  | 'min'
  | 'max'
  | 'pattern'
  | 'custom';

// ==================== STEP DEFINITIONS ====================

export interface BaseStepDefinition {
  id: string;
  type: StepPrimitiveType;
  title: string;
  description?: string;
  isOptional?: boolean;
  order: number;
  validation?: StepValidation;
}

export interface ServiceSelectionStep extends BaseStepDefinition {
  type: 'ServiceSelection';
  config: {
    allowMultiple: boolean;
    categoryFilter?: string[];
    showPricing: boolean;
    showDuration: boolean;
    groupByCategory?: boolean;
  };
}

export interface StaffSelectionStep extends BaseStepDefinition {
  type: 'StaffSelection';
  config: {
    isRequired: boolean; // false = "İlk müsait uzman"
    filterByService?: boolean; // Seçilen hizmete göre filtrele
    showAvailability?: boolean;
    allowAnyStaff?: boolean; // "Farketmez" seçeneği
  };
}

export interface DateTimeSlotStep extends BaseStepDefinition {
  type: 'DateTimeSlot';
  config: {
    slotDuration: number; // dakika
    slotInterval: number; // slot arası boşluk
    advanceBookingDays: number; // kaç gün önceden
    minAdvanceHours?: number; // minimum kaç saat önceden
    showStaffAvailability?: boolean;
    allowSmartSuggestion?: boolean; // "Bu saatte müsait değil ama 14:30'da müsait"
  };
}

export interface DateRangeStep extends BaseStepDefinition {
  type: 'DateRange';
  config: {
    minNights: number;
    maxNights?: number;
    advanceBookingDays: number;
    blockedDates?: string[]; // ISO date strings
    showPricing?: boolean;
  };
}

export interface FullDayBlockStep extends BaseStepDefinition {
  type: 'FullDayBlock';
  config: {
    viewType: 'monthly' | 'weekly';
    allowMultipleDays?: boolean;
    showAvailabilityColors?: boolean; // boş/dolu/opsiyonlu
    advanceBookingDays: number;
  };
}

export interface CapacityStep extends BaseStepDefinition {
  type: 'Capacity';
  config: {
    minGuests: number;
    maxGuests: number;
    defaultGuests: number;
    showGuestTypes?: boolean; // adults/children/infants
    guestTypeConfig?: {
      adults: { min: number; max: number };
      children: { min: number; max: number; ageRange?: string };
      infants: { min: number; max: number; ageRange?: string };
    };
  };
}

export interface PackageSelectionStep extends BaseStepDefinition {
  type: 'PackageSelection';
  config: {
    allowMultiple: boolean;
    showIncludes?: boolean;
    showComparison?: boolean;
    packageType: 'menu' | 'service_bundle' | 'accommodation';
  };
}

export interface AddOnSelectionStep extends BaseStepDefinition {
  type: 'AddOnSelection';
  config: {
    allowMultiple: boolean;
    showQuantity?: boolean;
    categoryGrouping?: boolean;
  };
}

export interface CustomFormStep extends BaseStepDefinition {
  type: 'CustomForm';
  config: {
    fields: CustomFieldDefinition[];
  };
}

export interface ContractStep extends BaseStepDefinition {
  type: 'Contract';
  config: {
    templateId: string;
    requireESignature: boolean;
    autoGeneratePDF?: boolean;
  };
}

export interface PaymentStep extends BaseStepDefinition {
  type: 'Payment';
  config: {
    paymentType: 'deposit' | 'full' | 'optional';
    depositPercentage?: number; // kapora yüzdesi
    depositSchedule?: {
      percentage: number;
      daysBeforeEvent: number;
      label: string;
    }[];
    acceptedMethods: ('credit_card' | 'bank_transfer' | 'cash')[];
    providerConfig?: {
      paytr?: {
        merchantId: string;
      };
    };
  };
}

export interface ReviewConfirmStep extends BaseStepDefinition {
  type: 'ReviewConfirm';
  config: {
    showSummary: boolean;
    allowEdit: boolean;
    termsAndConditions?: string;
    confirmationMessage?: string;
  };
}

export type StepDefinition =
  | ServiceSelectionStep
  | StaffSelectionStep
  | DateTimeSlotStep
  | DateRangeStep
  | FullDayBlockStep
  | CapacityStep
  | PackageSelectionStep
  | AddOnSelectionStep
  | CustomFormStep
  | ContractStep
  | PaymentStep
  | ReviewConfirmStep;

// ==================== CUSTOM FORM FIELDS ====================

export interface CustomFieldDefinition {
  id: string;
  fieldType: FieldType;
  label: string;
  placeholder?: string;
  helperText?: string;
  defaultValue?: any;
  isRequired: boolean;
  validation?: FieldValidation;
  // Field-specific configs
  options?: { value: string; label: string }[]; // select/radio
  min?: number;
  max?: number;
  accept?: string; // file input
  rows?: number; // textarea
}

export interface FieldValidation {
  rules: {
    type: ValidationRule;
    value?: any;
    message: string;
  }[];
}

export interface StepValidation {
  errorMessage?: string;
  customValidator?: string; // Function name to call
}

// ==================== PRICING RULES ====================

export interface PricingRule {
  id: string;
  name: string;
  type: 'base' | 'per_person' | 'per_night' | 'seasonal' | 'dynamic';
  conditions?: PricingCondition[];
  calculation: PricingCalculation;
}

export interface PricingCondition {
  field: string; // capacity, dateRange, season, etc.
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'between' | 'in';
  value: any;
}

export interface PricingCalculation {
  formula: string; // 'basePrice + (guests * perPersonPrice)'
  variables: Record<string, number>;
}

// ==================== AVAILABILITY RULES ====================

export interface AvailabilityRule {
  id: string;
  name: string;
  type: 'time_based' | 'capacity_based' | 'staff_based' | 'seasonal';
  conditions: AvailabilityCondition[];
  action: 'block' | 'limit' | 'require_approval';
}

export interface AvailabilityCondition {
  field: string;
  operator: string;
  value: any;
}

// ==================== VERTICAL CONFIG ====================

export interface VerticalConfig {
  id: string;
  businessType: BusinessType;
  name: string;
  description: string;
  version: number; // Config versiyonlama
  steps: StepDefinition[];
  pricingRules: PricingRule[];
  availabilityRules: AvailabilityRule[];
  settings: VerticalSettings;
  metadata: {
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
  };
}

export interface VerticalSettings {
  autoConfirm?: boolean;
  requireDeposit?: boolean;
  allowCancellation?: boolean;
  cancellationHours?: number;
  reminderSchedule?: {
    hours: number;
    message: string;
  }[];
  contractTemplateId?: string;
  notificationSettings?: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
}

// ==================== WIZARD STATE ====================

export interface WizardState {
  configId: string;
  currentStepIndex: number;
  completedSteps: number[];
  stepData: Record<string, any>; // Her step'in çıktısı
  validationErrors: Record<string, string[]>;
  totalPrice: number;
  metadata: {
    startedAt: string;
    lastUpdatedAt: string;
    userId?: string;
    businessId: string;
  };
}

// ==================== CROSS-VERTICAL BUNDLING ====================

export interface EventBundle {
  id: string;
  parentBookingId: string; // Ana etkinlik rezervasyonu
  childBookings: {
    bookingId: string;
    businessId: string;
    businessType: BusinessType;
    status: 'pending' | 'confirmed' | 'cancelled';
    price: number;
  }[];
  eventDate: string;
  eventType: string;
  totalPrice: number;
  createdAt: string;
}

export interface CrossVerticalSuggestion {
  businessType: BusinessType;
  businessId: string;
  businessName: string;
  suggestedServices: string[];
  estimatedPrice: number;
  reason: string; // "Düğün tarihinize yakın"
}
