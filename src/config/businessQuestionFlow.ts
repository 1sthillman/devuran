/**
 * ============================================================================
 * AKILLI İŞLETME PROFİLİ SORU MOTORU
 * ============================================================================
 * 
 * Bu dosya, "kategori listesinde olmayan" ya da "ince ayar isteyen" bir
 * işletmenin, birbirine bağlı sorulara verdiği cevaplardan eksiksiz bir
 * BusinessCapabilities nesnesi üretmesini sağlar.
 * 
 * Tasarım ilkesi: Soru ağacı KOD DEĞİL, VERİ olarak tanımlanır. Yeni bir
 * çalışma modeli / iş türü ortaya çıktığında (örn: "abonelik bazlı kutu
 * teslimatı") tek yapılması gereken bu diziye yeni bir soru/seçenek eklemek —
 * React bileşenlerine veya dashboard mantığına dokunmaya gerek kalmaz.
 */

import type { BusinessCapabilities } from '@/types/businessCapabilities';
import { DEFAULT_CAPABILITIES, CATEGORY_PRESETS } from '@/types/businessCapabilities';

export type AnswerMap = Record<string, string[]>;

export interface QuestionOption {
  id: string;
  label: string;
  description?: string;
  /** Bu seçenek işaretlendiğinde capabilities nesnesine uygulanacak kısmi güncelleme */
  patch?: Partial<BusinessCapabilities>;
}

export interface QuestionDef {
  id: string;
  title: string;
  subtitle?: string;
  multiSelect?: boolean;
  options: QuestionOption[];
  /** Bu soru sadece koşul sağlanırsa gösterilir (dallanma mantığı) */
  showIf?: (answers: AnswerMap, cap: BusinessCapabilities) => boolean;
}

const hasModel = (answers: AnswerMap, model: string) =>
  (answers['q1_model'] ?? []).includes(model);

const notNoneOnly = (answers: AnswerMap) => {
  const models = answers['q1_model'] ?? [];
  return models.length > 0 && !(models.length === 1 && models[0] === 'none');
};

const hasAnyModel = (answers: AnswerMap, ...models: string[]) =>
  models.some(m => hasModel(answers, m));

export const QUESTION_FLOW: QuestionDef[] = [
  // Q1: ANA ÇALIŞMA MODELİ (En kritik soru - her şey buradan başlar)
  {
    id: 'q1_model',
    title: 'İşletmeniz müşterilerle temelde nasıl çalışıyor?',
    subtitle: 'Birden fazlasını seçebilirsiniz — birçok işletme hibrit çalışır.',
    multiSelect: true,
    options: [
      {
        id: 'appointment',
        label: 'Randevu ile',
        description: 'Belirli süre + genelde bir uzmana/personele bağlı (kuaför, doktor, özel ders)',
        patch: { bookingModels: ['appointment'], isDurationBased: true, hasStaff: true, capacityUnit: 'staff-slot' },
      },
      {
        id: 'reservation',
        label: 'Masa / Oda / Alan rezervasyonu ile',
        description: 'Fiziksel bir birim ayırma esasına dayalı (restoran, otel, saha)',
        patch: { bookingModels: ['reservation'], hasTables: true, capacityUnit: 'table' },
      },
      {
        id: 'order',
        label: 'Sipariş ile',
        description: 'Ürün/yemek/hediye gibi bir şey satın alınıyor',
        patch: { bookingModels: ['order'], hasProductCatalog: true, isDurationBased: false, capacityUnit: 'unlimited' },
      },
      {
        id: 'rental',
        label: 'Kiralama ile',
        description: 'Tarih aralığı bazlı araç/ekipman/kıyafet kiralama',
        patch: { bookingModels: ['rental'], isDateRangeBased: true, hasTables: true, capacityUnit: 'unit', tableTerminology: 'Araç' },
      },
      {
        id: 'walk-in-queue',
        label: 'Sırayla / kuyrukla',
        description: 'Randevusuz gelen müşteriler sıraya giriyor',
        patch: { bookingModels: ['walk-in-queue'], hasQueue: true, isDurationBased: false },
      },
      {
        id: 'none',
        label: 'Hiçbiri — sadece tanıtım/vitrin',
        description: 'Şimdilik online booking almıyorum',
        patch: { bookingModels: ['none'], hasStaff: false, hasTables: false, hasQueue: false, hasProductCatalog: false },
      },
    ],
  },
  
  // Q2: PERSONEL ATAMASI (Sadece appointment seçildiyse)
  {
    id: 'q2_staff',
    title: 'Randevularınız belirli bir personele mi atanıyor?',
    subtitle: 'Örn: "Ahmet Usta 14:00" gibi kişiye özel mi, yoksa genel kapasiteye mi bakılıyor?',
    showIf: (a) => hasModel(a, 'appointment'),
    options: [
      { id: 'yes', label: 'Evet, her uzmanın kendi takvimi var', patch: { hasStaff: true, capacityUnit: 'staff-slot' } },
      { id: 'no', label: 'Hayır, genel bir kapasite yeterli', patch: { hasStaff: false, capacityUnit: 'unlimited' } },
    ],
  },
  
  // Q3: REZERVASYON BİRİMİ (Sadece reservation veya rental seçildiyse)
  {
    id: 'q3_capacity_unit',
    title: 'Rezervasyon biriminiz nedir?',
    subtitle: 'Bu, dashboard\'da bu birimlerin nasıl adlandırılacağını belirler.',
    showIf: (a) => hasAnyModel(a, 'reservation', 'rental'),
    options: [
      { id: 'table', label: 'Masa', patch: { tableTerminology: 'Masa', capacityUnit: 'table' } },
      { id: 'room', label: 'Oda', patch: { tableTerminology: 'Oda', capacityUnit: 'table' } },
      { id: 'area', label: 'Saha / Salon / Alan', patch: { tableTerminology: 'Alan', capacityUnit: 'table' } },
      { id: 'vehicle', label: 'Araç / Tekne', patch: { tableTerminology: 'Araç', capacityUnit: 'unit' } },
      { id: 'equipment', label: 'Ekipman / Kıyafet', patch: { tableTerminology: 'Ekipman', capacityUnit: 'unit' } },
    ],
  },
  
  // Q4: TARİH ARALIĞI (Sadece reservation veya rental seçildiyse)
  {
    id: 'q4_date_range',
    title: 'Rezervasyonlarınız/kiralamalarınız nasıl ölçülüyor?',
    subtitle: 'Bu, müşterilerin nasıl rezervasyon yapacağını belirler',
    showIf: (a) => hasAnyModel(a, 'reservation', 'rental'),
    options: [
      {
        id: 'nightly',
        label: 'Gecelik / Günlük (giriş-çıkış tarihi var)',
        description: 'Otel, tatil evi, uzun süreli kiralama gibi',
        patch: { isDateRangeBased: true, isDurationBased: false },
      },
      {
        id: 'hourly',
        label: 'Saatlik / zaman dilimi bazlı',
        description: 'Restoran masası, saha kiralama, günlük araç kiralama',
        patch: { isDateRangeBased: false, isDurationBased: true },
      },
    ],
  },
  
  // Q5: TESLİMAT (Sadece order seçildiyse)
  {
    id: 'q5_delivery',
    title: 'Siparişleriniz teslimat gerektiriyor mu?',
    subtitle: 'Müşterilere kargo/kurye ile mi gönderiliyor?',
    showIf: (a) => hasModel(a, 'order'),
    options: [
      { id: 'yes', label: 'Evet, adrese teslim ediyorum', patch: { hasDelivery: true } },
      { id: 'no', label: 'Hayır, gel-al şeklinde', patch: { hasDelivery: false } },
    ],
  },
  
  // Q6: LOKASYON TİPİ (none hariç herkes için)
  {
    id: 'q6_location',
    title: 'Müşterileriniz size mi geliyor, siz mi onlara gidiyorsunuz?',
    subtitle: 'Fiziksel mekan veya mobil hizmet',
    multiSelect: true,
    showIf: (a) => notNoneOnly(a),
    options: [
      {
        id: 'comes',
        label: 'Müşteri bana geliyor',
        description: 'Fiziksel bir adresim / mekanım var',
        patch: { hasPhysicalLocation: true },
      },
      {
        id: 'goes',
        label: 'Ben müşteriye gidiyorum',
        description: 'Mobil / adrese hizmet modeli',
        patch: { isMobileService: true },
      },
    ],
  },
  
  // Q7: ÇOK ŞUBE (none hariç herkes için)
  {
    id: 'q7_branches',
    title: 'Birden fazla şubeniz var mı?',
    subtitle: 'Farklı lokasyonlarda işletme noktalarınız var mı?',
    showIf: (a) => notNoneOnly(a) && (a['q6_location'] ?? []).includes('comes'),
    options: [
      { id: 'yes', label: 'Evet, birden fazla şube/lokasyon', patch: { hasMultipleLocations: true } },
      { id: 'no', label: 'Hayır, tek lokasyon', patch: { hasMultipleLocations: false } },
    ],
  },
  
  // Q8: KAPORA (none hariç herkes için - özellikle randevu/rezervasyon/kiralama için önemli)
  {
    id: 'q8_deposit',
    title: 'Kapora veya ön ödeme almak ister misiniz?',
    subtitle: 'İptal/no-show oranını azaltmak isteyen işletmeler için önerilir.',
    showIf: (a) => notNoneOnly(a) && hasAnyModel(a, 'appointment', 'reservation', 'rental'),
    options: [
      { id: 'yes', label: 'Evet, kapora sistemi olsun', patch: { requiresDeposit: true } },
      { id: 'no', label: 'Hayır, gerek yok', patch: { requiresDeposit: false } },
    ],
  },
  
  // Q9: PAKET/ÜYELİK (appointment ve reservation için mantıklı)
  {
    id: 'q9_subscription',
    title: 'Paket veya üyelik satışı yapıyor musunuz?',
    subtitle: 'Örn: "10 seans paketi", "aylık üyelik", "yıllık abonelik"',
    showIf: (a) => hasAnyModel(a, 'appointment', 'reservation'),
    options: [
      { id: 'yes', label: 'Evet, paket/üyelik satışı yapıyorum', patch: { isSubscriptionBased: true } },
      { id: 'no', label: 'Hayır', patch: { isSubscriptionBased: false } },
    ],
  },
  
  // Q10: OTOMATIK ONAY (tüm booking modelleri için)
  {
    id: 'q10_auto_confirm',
    title: 'Yeni rezervasyonlar/randevular otomatik onaylansın mı?',
    subtitle: 'Evet derseniz müşteriler hemen onay alır. Hayır derseniz siz manuel onaylarsınız.',
    showIf: (a) => notNoneOnly(a) && !hasModel(a, 'walk-in-queue'),
    options: [
      { id: 'yes', label: 'Evet, otomatik onaylansın', patch: { autoConfirmDefault: true } },
      { id: 'no', label: 'Hayır, ben manuel onaylayacağım', patch: { autoConfirmDefault: false } },
    ],
  },
];

/** Şu ana kadar cevaplanan sorulara göre, gösterilmesi gereken soruları döner */
export function getVisibleQuestions(answers: AnswerMap, cap: BusinessCapabilities): QuestionDef[] {
  return QUESTION_FLOW.filter((q) => !q.showIf || q.showIf(answers, cap));
}

/** Bir soruya verilen cevapları capabilities nesnesine uygular */
export function applyAnswer(
  cap: BusinessCapabilities,
  question: QuestionDef,
  selectedOptionIds: string[]
): BusinessCapabilities {
  let next = { ...cap };

  // Özel durum: Q1 (model selection) için akıllı merge
  if (question.id === 'q1_model') {
    // "none" seçildiyse, diğer tüm modelleri temizle
    if (selectedOptionIds.includes('none')) {
      const noneOption = question.options.find(o => o.id === 'none');
      return {
        ...next,
        ...noneOption?.patch,
        bookingModels: ['none'],
      };
    }
    
    // "none" harici modeller seçiliyse, bookingModels'i merge et
    const selectedModels: any[] = [];
    for (const optId of selectedOptionIds) {
      const option = question.options.find((o) => o.id === optId);
      if (!option?.patch) continue;
      
      // Diğer field'ları uygula
      next = { ...next, ...option.patch };
      
      // bookingModels'i topla
      if (option.patch.bookingModels) {
        selectedModels.push(...option.patch.bookingModels);
      }
    }
    
    // Unique models
    next.bookingModels = Array.from(new Set(selectedModels));
    return next;
  }
  
  // Özel durum: Q6 (location) için her iki seçenek de işaretlenebilir
  if (question.id === 'q6_location') {
    const hasComes = selectedOptionIds.includes('comes');
    const hasGoes = selectedOptionIds.includes('goes');
    
    next.hasPhysicalLocation = hasComes;
    next.isMobileService = hasGoes;
    
    return next;
  }

  // Normal durumlar: tek seçim veya diğer multi-select'ler
  for (const optId of selectedOptionIds) {
    const option = question.options.find((o) => o.id === optId);
    if (!option?.patch) continue;
    
    next = {
      ...next,
      ...option.patch,
    };
  }

  return next;
}

/** Türetilen capabilities'i mevcut preset'lerle karşılaştırıp en yakınını bulur */
export function findClosestPreset(cap: BusinessCapabilities) {
  let best: { id: string; name: string; score: number } | null = null;

  for (const preset of CATEGORY_PRESETS) {
    if (preset.isCustom) continue;
    let score = 0;
    const p = preset.capabilities;

    const overlap = p.bookingModels.filter((m) => cap.bookingModels.includes(m)).length;
    score += overlap * 3;
    if (p.hasStaff === cap.hasStaff) score += 1;
    if (p.hasTables === cap.hasTables) score += 1;
    if (p.isDateRangeBased === cap.isDateRangeBased) score += 1;
    if (p.isMobileService === cap.isMobileService) score += 1;
    if (p.hasDelivery === cap.hasDelivery) score += 1;
    if (p.hasQueue === cap.hasQueue) score += 1;

    if (!best || score > best.score) {
      best = { id: preset.id, name: preset.name, score };
    }
  }

  return best;
}

export function createEmptyCapabilities(): BusinessCapabilities {
  return { ...DEFAULT_CAPABILITIES, bookingModels: [] };
}
