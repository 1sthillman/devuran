/**
 * DİNAMİK WIZARD MOTORU — Tip Tanımları
 * ---------------------------------------
 * Bu dosya, hem "İşletme Setup Sihirbazı'na eklenen özel adımlar" (kind: 'setup_extra')
 * hem de "Müşteriye gösterilen rezervasyon/randevu formu" (kind: 'booking') için
 * TEK ve ORTAK bir şema tanımı sağlar. İki farklı motor yazmıyoruz — aynı Runner
 * ve aynı Builder, farklı "kind" ile her iki senaryoyu da çalıştırır.
 */

// ---- Alan (Field) Tipleri ----
export type WizardFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'phone'
  | 'email'
  | 'select'
  | 'multiselect'
  | 'toggle'
  | 'date'
  | 'time'
  | 'rating'
  | 'address_short'
  | 'image'
  | 'divider'
  | 'info';

export interface WizardFieldOption {
  id: string;
  label: string;
  /** Opsiyonel: seçilirse ekstra ücret göstermek için (örn. "Ekstra kişi +50₺") */
  priceHint?: string;
}

export type ConditionOperator = 'equals' | 'notEquals' | 'includes' | 'truthy' | 'falsy';

export interface WizardCondition {
  /** Koşulun bağlı olduğu alanın id'si */
  fieldId: string;
  operator: ConditionOperator;
  /** equals/notEquals/includes için karşılaştırma değeri */
  value?: string | number | boolean;
}

export interface WizardField {
  id: string;
  type: WizardFieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  /** select / multiselect için seçenekler */
  options?: WizardFieldOption[];
  /** number için sınırlar */
  min?: number;
  max?: number;
  /** textarea için satır sayısı önerisi */
  rows?: number;
  /** info tipi için gösterilecek metin (soru değil, bilgilendirme kutusu) */
  infoText?: string;
  /**
   * Bu alan, SADECE aşağıdaki koşulların TÜMÜ sağlandığında gösterilir.
   * Boş/undefined ise her zaman gösterilir.
   * Örnek: "Masa rezervasyonu mu?" toggle'ı açıksa "Kaç kişi?" alanını göster.
   */
  visibleIf?: WizardCondition[];
  defaultValue?: string | number | boolean | string[];
}

export interface WizardStep {
  id: string;
  title: string;
  subtitle?: string;
  /** lucide-react ikon adı (ICON_MAP içinde çözümlenir), örn: "Users", "Calendar" */
  icon?: string;
  fields: WizardField[];
}

export type WizardKind = 'setup_extra' | 'booking';

export interface WizardSchema {
  id: string;
  businessId: string;
  kind: WizardKind;
  /** Yönetim panelinde görünen isim, örn: "Doğum Günü Rezervasyon Formu" */
  name: string;
  /** kind: 'booking' için, hangi hizmet kategorisinde gösterileceği (boşsa hepsinde) */
  appliesToServiceIds?: string[];
  steps: WizardStep[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

/** Bir kullanıcının wizard'ı doldurduğunda üretilen cevap seti */
export interface WizardResponse {
  id: string;
  schemaId: string;
  businessId: string;
  kind: WizardKind;
  customerId?: string;
  answers: Record<string, string | number | boolean | string[]>;
  submittedAt: number;
}

// ---- Yardımcı: Koşul değerlendirme ----
export function evaluateCondition(
  condition: WizardCondition,
  answers: Record<string, unknown>
): boolean {
  const current = answers[condition.fieldId];
  switch (condition.operator) {
    case 'truthy':
      return !!current;
    case 'falsy':
      return !current;
    case 'equals':
      return current === condition.value;
    case 'notEquals':
      return current !== condition.value;
    case 'includes':
      return Array.isArray(current) && current.includes(condition.value as string);
    default:
      return true;
  }
}

export function isFieldVisible(
  field: WizardField,
  answers: Record<string, unknown>
): boolean {
  if (!field.visibleIf || field.visibleIf.length === 0) return true;
  return field.visibleIf.every((c) => evaluateCondition(c, answers));
}

/** Bir adımdaki tüm görünür + zorunlu alanların dolu olup olmadığını kontrol eder */
export function validateStepAnswers(
  step: WizardStep,
  answers: Record<string, unknown>
): { valid: boolean; missingLabels: string[] } {
  const missing: string[] = [];
  for (const field of step.fields) {
    if (field.type === 'divider' || field.type === 'info') continue;
    if (!isFieldVisible(field, answers)) continue;
    if (!field.required) continue;

    const value = answers[field.id];
    const empty =
      value === undefined ||
      value === null ||
      value === '' ||
      (Array.isArray(value) && value.length === 0);

    if (empty) missing.push(field.label);
  }
  return { valid: missing.length === 0, missingLabels: missing };
}

export function createEmptyField(type: WizardFieldType): WizardField {
  return {
    id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    label: '',
    required: false,
    options: type === 'select' || type === 'multiselect' ? [] : undefined,
  };
}

export function createEmptyStep(): WizardStep {
  return {
    id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: 'Yeni Adım',
    fields: [],
  };
}

export function createEmptySchema(businessId: string, kind: WizardKind): WizardSchema {
  const now = Date.now();
  return {
    id: `w_${now}_${Math.random().toString(36).slice(2, 7)}`,
    businessId,
    kind,
    name: kind === 'booking' ? 'Yeni Rezervasyon Formu' : 'Yeni Ek Adım Grubu',
    steps: [createEmptyStep()],
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
}
