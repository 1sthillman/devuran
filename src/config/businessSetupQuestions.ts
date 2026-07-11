/**
 * ============================================================================
 * AKILLI İŞLETME SETUP SORU BANKASI
 * ============================================================================
 * 
 * HER İŞLETME TİPİ İÇİN DİNAMİK SORULAR - YOK OLAN KATEGORİLER DAHİL
 */

import type { BusinessSetupQuestion, BusinessSetupStep } from '@/types/businessSetup';
import type { BookingModel } from '@/types/businessCapabilities';

/**
 * ADIM 1: TEMEL BİLGİLER
 */
export const BASIC_INFO_QUESTIONS: BusinessSetupQuestion[] = [
  {
    id: 'business_name',
    text: 'İşletmenizin adı nedir?',
    type: 'text',
    validation: { required: true, min: 2, max: 100 }
  },
  {
    id: 'business_description',
    text: 'İşletmenizi kısaca tanıtır mısınız?',
    description: 'Bu açıklama müşterilerinize gösterilecek',
    type: 'text',
    validation: { required: true, min: 10, max: 500 }
  }
];

/**
 * ADIM 2: KATEGORİ SEÇİMİ
 */
export const CATEGORY_QUESTIONS: BusinessSetupQuestion[] = [
  {
    id: 'category_type',
    text: 'İşletmeniz hangi kategoriye uyuyor?',
    type: 'select',
    options: [
      { value: 'preset', label: 'Hazır kategorilerden seç', description: 'Hızlı kurulum için önerilen' },
      { value: 'custom', label: 'Kendi kategorimi oluştur', description: 'Özel iş modelleri için' }
    ],
    validation: { required: true }
  },
  {
    id: 'preset_category',
    text: 'Hangi hazır kategoriyi seçmek istersiniz?',
    type: 'select',
    dependency: { questionId: 'category_type', requiredValue: 'preset' },
    options: [
      { value: 'hairdresser', label: 'Kuaför', description: 'Saç kesimi, boyama, bakım hizmetleri' },
      { value: 'barber', label: 'Berber', description: 'Saç & sakal tıraşı, bakım' },
      { value: 'beauty', label: 'Güzellik Salonu', description: 'Cilt bakımı, makyaj, masaj' },
      { value: 'nails', label: 'Tırnak Salonu', description: 'Manikür, pedikür, protez tırnak' },
      { value: 'restaurant', label: 'Restoran', description: 'Yemek servisi & masa rezervasyonu' },
      { value: 'cafe', label: 'Kafe', description: 'İçecek & atıştırmalık servisi' },
      { value: 'hotel', label: 'Otel', description: 'Konaklama hizmeti' },
      { value: 'villa', label: 'Villa', description: 'Tatil evi kiralama' },
      { value: 'bungalow', label: 'Bungalov', description: 'Doğa içinde konaklama' },
      { value: 'wedding_hall', label: 'Düğün Salonu', description: 'Etkinlik alanı kiralama' },
      { value: 'event_venue', label: 'Etkinlik Mekanı', description: 'Toplantı, konser, fuar alanı' },
      { value: 'photographer', label: 'Fotoğrafçı', description: 'Fotoğraf çekimi hizmetleri' },
      { value: 'videographer', label: 'Video Prodüksiyon', description: 'Video çekim & kurgu' },
      { value: 'catering', label: 'Catering', description: 'Yemek ikram hizmeti' },
      { value: 'car_rental', label: 'Araç Kiralama', description: 'Günlük/saatlik araç kiralama' },
      { value: 'sport_facility', label: 'Spor Tesisi', description: 'Halı saha, kort, fitness' }
    ],
    validation: { required: true }
  },
  {
    id: 'custom_category_name',
    text: 'Kategori adını girin',
    description: 'Örn: Drone Pisti, Köpek Pansiyonu, Escape Room',
    type: 'text',
    dependency: { questionId: 'category_type', requiredValue: 'custom' },
    validation: { required: true, min: 3, max: 50 }
  }
];

/**
 * ADIM 3: REZERVASYON MODELİ
 */
export const BOOKING_MODEL_QUESTIONS: BusinessSetupQuestion[] = [
  {
    id: 'booking_models',
    text: 'İşletmeniz müşterilerle nasıl çalışıyor?',
    description: 'Birden fazla seçenek işaretleyebilirsiniz',
    type: 'multi-select',
    options: [
      { 
        value: 'appointment', 
        label: 'Randevu Sistemi', 
        description: 'Saatlik/süre bazlı randevular (kuaför, doktor, özel ders)' 
      },
      { 
        value: 'reservation', 
        label: 'Rezervasyon Sistemi', 
        description: 'Masa/oda/alan rezervasyonu (restoran, otel, saha kiralama)' 
      },
      { 
        value: 'order', 
        label: 'Sipariş Sistemi', 
        description: 'Ürün/yemek siparişi (catering, e-ticaret, çiçekçi)' 
      },
      { 
        value: 'rental', 
        label: 'Kiralama Sistemi', 
        description: 'Günlük/haftalık kiralama (araç, ekipman, etkinlik alanı)' 
      },
      { 
        value: 'walk-in-queue', 
        label: 'Sıra Sistemi', 
        description: 'Randevusuz müşteri kuyruğu (banka, kuyumcu)' 
      },
      {
        value: 'none',
        label: 'Rezervasyon Almıyorum',
        description: 'Sadece tanıtım/bilgilendirme amaçlı'
      }
    ],
    validation: { required: true },
    capabilityMapping: {
      field: 'bookingModels',
      customMapper: (value: string[]) => value as BookingModel[]
    }
  }
];

/**
 * ADIM 4: SÜRE & TARİH YAPISI
 */
export const DURATION_QUESTIONS: BusinessSetupQuestion[] = [
  {
    id: 'is_duration_based',
    text: 'Hizmetleriniz süre bazlı mı?',
    description: 'Evet: "30 dk saç kesimi", Hayır: "Tüm gün etkinlik"',
    type: 'boolean',
    dependency: { 
      questionId: 'booking_models', 
      requiredValue: (answers: any[]) => {
        const bookingModels = answers.find(a => a.questionId === 'booking_models')?.value || [];
        return bookingModels.includes('appointment') || bookingModels.includes('reservation');
      }
    },
    capabilityMapping: {
      field: 'isDurationBased',
      trueValue: true,
      falseValue: false
    }
  },
  {
    id: 'is_date_range_based',
    text: 'Rezervasyonlar tarih aralığı bazlı mı?',
    description: 'Evet: "Check-in / Check-out" (otel), Hayır: "Tek tarih" (restoran)',
    type: 'boolean',
    dependency: { 
      questionId: 'booking_models', 
      requiredValue: (answers: any[]) => {
        const bookingModels = answers.find(a => a.questionId === 'booking_models')?.value || [];
        return bookingModels.includes('reservation') || bookingModels.includes('rental');
      }
    },
    capabilityMapping: {
      field: 'isDateRangeBased',
      trueValue: true,
      falseValue: false
    }
  }
];

/**
 * ADIM 5: PERSONEL & MASA YAPISI
 */
export const RESOURCE_QUESTIONS: BusinessSetupQuestion[] = [
  {
    id: 'has_staff',
    text: 'Personel kadronuz var mı?',
    description: 'Müşteriler randevu alırken personel seçecek mi?',
    type: 'boolean',
    capabilityMapping: {
      field: 'hasStaff',
      trueValue: true,
      falseValue: false
    }
  },
  {
    id: 'has_tables',
    text: 'Rezerve edilebilir birimlere sahip misiniz?',
    description: 'Örn: Masa, Oda, Araç, Saha, Masa Üstü',
    type: 'boolean',
    dependency: { 
      questionId: 'booking_models', 
      requiredValue: (answers: any[]) => {
        const bookingModels = answers.find(a => a.questionId === 'booking_models')?.value || [];
        return bookingModels.includes('reservation') || bookingModels.includes('rental');
      }
    },
    capabilityMapping: {
      field: 'hasTables',
      trueValue: true,
      falseValue: false
    }
  },
  {
    id: 'table_terminology',
    text: 'Bu birimleri ne olarak adlandırmak istersiniz?',
    description: 'Müşterilere gösterilecek isim',
    type: 'select',
    dependency: { questionId: 'has_tables', requiredValue: true },
    options: [
      { value: 'masa', label: 'Masa' },
      { value: 'oda', label: 'Oda' },
      { value: 'araç', label: 'Araç' },
      { value: 'saha', label: 'Saha' },
      { value: 'alan', label: 'Alan' },
      { value: 'studio', label: 'Stüdyo' },
      { value: 'salon', label: 'Salon' },
      { value: 'custom', label: 'Özel İsim' }
    ],
    capabilityMapping: {
      field: 'tableTerminology'
    }
  },
  {
    id: 'custom_table_terminology',
    text: 'Özel birim adını girin',
    description: 'Örn: Kabin, Tekne, Ekipman',
    type: 'text',
    dependency: { questionId: 'table_terminology', requiredValue: 'custom' },
    validation: { required: true, min: 2, max: 30 }
  }
];

/**
 * ADIM 6: KONUM & MOBİLİTE
 */
export const LOCATION_QUESTIONS: BusinessSetupQuestion[] = [
  {
    id: 'has_physical_location',
    text: 'Fiziksel mekanınız var mı?',
    description: 'Müşteriler size gelerek mi hizmet alıyor?',
    type: 'boolean',
    capabilityMapping: {
      field: 'hasPhysicalLocation',
      trueValue: true,
      falseValue: false
    }
  },
  {
    id: 'is_mobile_service',
    text: 'Müşterilerin adresine gidiyor musunuz?',
    description: 'Mobil hizmet (ev temizliği, seyyar kuaför)',
    type: 'boolean',
    capabilityMapping: {
      field: 'isMobileService',
      trueValue: true,
      falseValue: false
    }
  },
  {
    id: 'has_multiple_locations',
    text: 'Birden fazla şubeniz var mı?',
    type: 'boolean',
    dependency: { questionId: 'has_physical_location', requiredValue: true },
    capabilityMapping: {
      field: 'hasMultipleLocations',
      trueValue: true,
      falseValue: false
    }
  }
];

/**
 * ADIM 7: ÜRÜN & TESLİMAT
 */
export const PRODUCT_QUESTIONS: BusinessSetupQuestion[] = [
  {
    id: 'has_product_catalog',
    text: 'Satılabilir ürün kataloğunuz var mı?',
    description: 'Fiziksel veya dijital ürünler',
    type: 'boolean',
    dependency: { 
      questionId: 'booking_models', 
      requiredValue: (answers: any[]) => {
        const bookingModels = answers.find(a => a.questionId === 'booking_models')?.value || [];
        return bookingModels.includes('order');
      }
    },
    capabilityMapping: {
      field: 'hasProductCatalog',
      trueValue: true,
      falseValue: false
    }
  },
  {
    id: 'has_delivery',
    text: 'Teslimat/kargo yapıyor musunuz?',
    type: 'boolean',
    dependency: { questionId: 'has_product_catalog', requiredValue: true },
    capabilityMapping: {
      field: 'hasDelivery',
      trueValue: true,
      falseValue: false
    }
  }
];

/**
 * ADIM 8: EK ÖZELLİKLER
 */
export const ADVANCED_QUESTIONS: BusinessSetupQuestion[] = [
  {
    id: 'has_queue',
    text: 'Randevusuz müşteri kuyruğu var mı?',
    description: 'Walk-in müşteriler için sıra yönetimi',
    type: 'boolean',
    capabilityMapping: {
      field: 'hasQueue',
      trueValue: true,
      falseValue: false
    }
  },
  {
    id: 'requires_deposit',
    text: 'Rezervasyonda kapora alıyor musunuz?',
    type: 'boolean',
    capabilityMapping: {
      field: 'requiresDeposit',
      trueValue: true,
      falseValue: false
    }
  },
  {
    id: 'auto_confirm_default',
    text: 'Rezervasyonlar otomatik onaylansın mı?',
    description: 'Hayır: Her rezervasyonu manuel onaylarsınız',
    type: 'boolean',
    capabilityMapping: {
      field: 'autoConfirmDefault',
      trueValue: true,
      falseValue: false
    }
  }
];

/**
 * TÜM SORULARI ADIM ADIM GRUPLA
 */
export const BUSINESS_SETUP_STEPS: BusinessSetupStep[] = [
  {
    id: 1,
    title: 'Temel Bilgiler',
    description: 'İşletmenizi tanıtalım',
    questions: BASIC_INFO_QUESTIONS
  },
  {
    id: 2,
    title: 'Kategori',
    description: 'İşletme türünüzü belirleyin',
    questions: CATEGORY_QUESTIONS
  },
  {
    id: 3,
    title: 'Çalışma Modeli',
    description: 'Müşterilerle nasıl çalışıyorsunuz?',
    questions: BOOKING_MODEL_QUESTIONS
  },
  {
    id: 4,
    title: 'Zaman Yapısı',
    description: 'Süre ve tarih ayarları',
    questions: DURATION_QUESTIONS
  },
  {
    id: 5,
    title: 'Kaynaklar',
    description: 'Personel ve ekipman yapısı',
    questions: RESOURCE_QUESTIONS
  },
  {
    id: 6,
    title: 'Konum',
    description: 'Fiziksel mekan ve mobilite',
    questions: LOCATION_QUESTIONS
  },
  {
    id: 7,
    title: 'Ürün & Teslimat',
    description: 'Ürün kataloğu ve kargo',
    questions: PRODUCT_QUESTIONS
  },
  {
    id: 8,
    title: 'Ek Özellikler',
    description: 'Kuyruk, kapora, onay sistemi',
    questions: ADVANCED_QUESTIONS
  }
];
