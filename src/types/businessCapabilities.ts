/**
 * ============================================================================
 * İŞLETME YETENEK (CAPABILITY) MODEL SİSTEMİ
 * ============================================================================
 * 
 * FELSEFE:
 * Bir işletmeyi sabit bir "kategori" enum'una hapsetmek yerine, o işletmenin
 * NASIL ÇALIŞTIĞINI tarif eden bağımsız sorulara verilen cevaplardan bir
 * "yetenek seti" (capabilities) türetiyoruz.
 * 
 * Kategori artık sadece görünen bir ETİKET. Uygulamanın tüm mantığı
 * (sihirbazda hangi adım/soru gösterilecek, dashboard'da hangi sekme
 * açılacak, hangi kelime kullanılacak: "Randevu" mu "Rezervasyon" mu
 * "Sipariş" mi) capabilities nesnesinden okunur.
 * 
 * SONUÇ: Listede olmayan HERHANGİ bir işletme türü (Drone Pisti, Köpek
 * Pansiyonu, Yat Charter, Escape Room, Özel Ders Platformu...) sisteme
 * TEK SATIR KOD EKLEMEDEN, sadece doğru sorulara doğru cevap vererek
 * eksiksiz şekilde entegre olur.
 */

import type { LucideIcon } from 'lucide-react';
import {
  Scissors,
  Sparkles,
  Gem,
  Utensils,
  Coffee,
  Building2,
  Car,
  SprayCan,
  Camera,
  Flower2,
  Dumbbell,
  PartyPopper,
  Stethoscope,
  Wrench,
  GraduationCap,
  Dog,
  HelpCircle,
} from 'lucide-react';

/** İşletmenin müşteriyle çalışma biçimi. Birden fazlası aynı anda geçerli olabilir */
export type BookingModel =
  | 'appointment'    // Randevu: personel + süre bazlı slot (kuaför, doktor, masöz, özel ders)
  | 'reservation'    // Rezervasyon: masa/oda/alan/araç gibi kapasite bazlı (restoran, otel, saha)
  | 'order'          // Sipariş: ürün/yemek/hediye siparişi (çiçekçi, pastane, e-ticaret)
  | 'walk-in-queue'  // Sırayla: kuyruk / bekleme listesi (kuyumcu, banka, servis)
  | 'rental'         // Kiralama: tarih aralığı bazlı ekipman/araç/kıyafet kiralama
  | 'none';          // Booking yok: sadece tanıtım / vitrin amaçlı

/** Kapasitenin ölçü birimi — dashboard'daki listeleme mantığını belirler */
export type CapacityUnit =
  | 'staff-slot'  // personel bazlı (bir uzmanın aynı anda tek randevusu olur)
  | 'table'       // masa/oda bazlı sabit fiziksel birim
  | 'unit'        // envanter birimi (araç, tekne, ekipman, kıyafet adedi)
  | 'unlimited';  // fiziksel kapasite sınırı yok (online danışmanlık, dijital ürün)

export interface BusinessCapabilities {
  /** Bu işletme hangi çalışma modeli/modellerini kullanıyor */
  bookingModels: BookingModel[];
  
  /** Kapasite nasıl ölçülüyor */
  capacityUnit: CapacityUnit;

  /** Hizmetin bir SÜRESİ var mı (dakika bazlı slot hesabı gerekir mi) */
  isDurationBased: boolean;
  
  /** Rezervasyon/kiralama check-in/check-out gibi TARİH ARALIĞI mı (otel, araç) */
  isDateRangeBased: boolean;

  /** Müşteri fiziksel bir adrese mi geliyor */
  hasPhysicalLocation: boolean;
  
  /** İşletme müşteriye mi gidiyor (mobil hizmet: temizlik, oto yıkama, özel ders) */
  isMobileService: boolean;
  
  /** Birden fazla şube var mı */
  hasMultipleLocations: boolean;

  /** Randevu/hizmet belirli bir PERSONELE mi atanıyor */
  hasStaff: boolean;
  
  /** Masa/oda/araç gibi ayrı ayrı yönetilmesi gereken fiziksel BİRİMLER var mı */
  hasTables: boolean;
  
  /** hasTables true ise bu birimin adı ne olsun ("Masa", "Oda", "Araç", "Alan"...) */
  tableTerminology: string;

  /** Satılan hizmet/ürün kataloğu var mı (neredeyse her zaman true) */
  hasProductCatalog: boolean;
  
  /** Teslimat/kargo var mı */
  hasDelivery: boolean;
  
  /** Anlık bekleme sırası / kuyruk sistemi var mı */
  hasQueue: boolean;
  
  /** Kapora/ön ödeme akışı işletmeye mantıklı mı */
  requiresDeposit: boolean;
  
  /** Paket/üyelik satışı var mı (10 seans paketi, aylık üyelik) */
  isSubscriptionBased: boolean;

  /** Yeni randevu/rezervasyon/sipariş varsayılan olarak otomatik onaylansın mı */
  autoConfirmDefault: boolean;
}

export const DEFAULT_CAPABILITIES: BusinessCapabilities = {
  bookingModels: ['appointment'],
  capacityUnit: 'staff-slot',
  isDurationBased: true,
  isDateRangeBased: false,
  hasPhysicalLocation: true,
  isMobileService: false,
  hasMultipleLocations: false,
  hasStaff: true,
  hasTables: false,
  tableTerminology: 'Masa',
  hasProductCatalog: true,
  hasDelivery: false,
  hasQueue: false,
  requiresDeposit: false,
  isSubscriptionBased: false,
  autoConfirmDefault: true,
};

/**
 * TERMİNOLOJİ TÜRETİMİ
 * capabilities'e bakarak arayüzde doğru kelimeleri otomatik seçer.
 * Böylece bir kuaförde "Randevu Al", bir otelde "Rezervasyon Yap", bir
 * çiçekçide "Sipariş Ver" yazar — kod tarafında TEK bir bileşen kullanılır.
 */
export interface BusinessTerminology {
  bookingUnit: string;        // "Randevu" | "Rezervasyon" | "Sipariş" | "Talep"
  bookingUnitPlural: string;  // "Randevular" | "Rezervasyonlar" | "Siparişler"
  actionVerb: string;         // "Randevu Al" | "Rezervasyon Yap" | "Sipariş Ver"
  capacityUnitLabel: string;  // "Personel" | "Masa" | "Oda" | "Araç"
  serviceUnitLabel: string;   // "Hizmet" | "Menü" | "Oda Tipi" | "Paket"
}

const BOOKING_MODEL_PRIORITY: BookingModel[] = [
  'appointment',
  'reservation',
  'rental',
  'order',
  'walk-in-queue',
  'none',
];

export function deriveTerminology(cap: BusinessCapabilities): BusinessTerminology {
  const primary =
    BOOKING_MODEL_PRIORITY.find((m) => cap.bookingModels.includes(m)) ?? 'none';

  const map: Record<BookingModel, BusinessTerminology> = {
    appointment: {
      bookingUnit: 'Randevu',
      bookingUnitPlural: 'Randevular',
      actionVerb: 'Randevu Al',
      capacityUnitLabel: 'Personel',
      serviceUnitLabel: 'Hizmet',
    },
    reservation: {
      bookingUnit: 'Rezervasyon',
      bookingUnitPlural: 'Rezervasyonlar',
      actionVerb: 'Rezervasyon Yap',
      capacityUnitLabel: cap.tableTerminology || 'Masa',
      serviceUnitLabel: 'Hizmet',
    },
    rental: {
      bookingUnit: 'Kiralama',
      bookingUnitPlural: 'Kiralamalar',
      actionVerb: 'Kiralama Talebi Gönder',
      capacityUnitLabel: cap.tableTerminology || 'Araç',
      serviceUnitLabel: 'Paket',
    },
    order: {
      bookingUnit: 'Sipariş',
      bookingUnitPlural: 'Siparişler',
      actionVerb: 'Sipariş Ver',
      capacityUnitLabel: 'Stok',
      serviceUnitLabel: 'Ürün',
    },
    'walk-in-queue': {
      bookingUnit: 'Sıra',
      bookingUnitPlural: 'Sıradakiler',
      actionVerb: 'Sıraya Gir',
      capacityUnitLabel: 'Gişe',
      serviceUnitLabel: 'Hizmet',
    },
    none: {
      bookingUnit: 'Talep',
      bookingUnitPlural: 'Talepler',
      actionVerb: 'İletişime Geç',
      capacityUnitLabel: 'Kaynak',
      serviceUnitLabel: 'Hizmet',
    },
  };

  return map[primary];
}

/** İki capability nesnesini kısa, okunabilir madde listesine çevirir */
export function describeCapabilities(cap: BusinessCapabilities): string[] {
  const t = deriveTerminology(cap);
  const lines: string[] = [];

  lines.push(`${t.bookingUnit} sistemi ile çalışıyor`);
  if (cap.hasStaff) lines.push('Personele özel takvim yönetimi aktif');
  if (cap.hasTables) lines.push(`${cap.tableTerminology} bazlı kapasite takibi aktif`);
  if (cap.isDateRangeBased) lines.push('Tarih aralığı (giriş/çıkış) bazlı çalışıyor');
  if (cap.isMobileService) lines.push('Adrese hizmet (mobil) desteği açık');
  if (cap.hasMultipleLocations) lines.push('Çoklu şube desteği açık');
  if (cap.hasDelivery) lines.push('Teslimat/kargo akışı açık');
  if (cap.hasQueue) lines.push('Anlık sıra/kuyruk yönetimi açık');
  if (cap.requiresDeposit) lines.push('Kapora / ön ödeme adımı açık');
  if (cap.isSubscriptionBased) lines.push('Paket / üyelik satışı açık');

  return lines;
}

/**
 * HAZIR KATEGORİ ŞABLONLARI (PRESET)
 * Bunlar sadece "hızlı başlangıç" içindir — kullanıcı grid'den birini seçtiğinde
 * bu capabilities anında uygulanır. Kullanıcı isterse ince ayar için Akıllı
 * Profil akışını da açabilir.
 * Listede olmayan HER işletme için 'custom' preset'i devreye girer.
 */
export interface CategoryPreset {
  id: string;
  name: string;
  icon: LucideIcon;
  isCustom?: boolean;
  capabilities: BusinessCapabilities;
}

const base = DEFAULT_CAPABILITIES;

export const CATEGORY_PRESETS: CategoryPreset[] = [
  {
    id: 'kuafor-berber',
    name: 'Kuaför / Berber',
    icon: Scissors,
    capabilities: { ...base, bookingModels: ['appointment'], hasStaff: true, isDurationBased: true },
  },
  {
    id: 'guzellik-merkezi',
    name: 'Güzellik Merkezi',
    icon: Sparkles,
    capabilities: { ...base, bookingModels: ['appointment'], hasStaff: true, isSubscriptionBased: true },
  },
  {
    id: 'kuyumcu',
    name: 'Kuyumcu',
    icon: Gem,
    capabilities: {
      ...base,
      bookingModels: ['walk-in-queue'],
      hasStaff: false,
      isDurationBased: false,
      hasQueue: true,
      hasTables: false,
    },
  },
  {
    id: 'restoran-kafe',
    name: 'Restoran / Kafe',
    icon: Utensils,
    capabilities: {
      ...base,
      bookingModels: ['reservation', 'order'],
      hasStaff: false,
      hasTables: true,
      tableTerminology: 'Masa',
      isDurationBased: false,
      hasDelivery: true,
      requiresDeposit: false,
    },
  },
  {
    id: 'kafe-calisma-alani',
    name: 'Kafe / Çalışma Alanı',
    icon: Coffee,
    capabilities: {
      ...base,
      bookingModels: ['reservation'],
      hasStaff: false,
      hasTables: true,
      tableTerminology: 'Masa',
      isDurationBased: true,
    },
  },
  {
    id: 'otel-pansiyon',
    name: 'Otel / Pansiyon',
    icon: Building2,
    capabilities: {
      ...base,
      bookingModels: ['reservation'],
      hasStaff: false,
      hasTables: true,
      tableTerminology: 'Oda',
      isDateRangeBased: true,
      isDurationBased: false,
      requiresDeposit: true,
    },
  },
  {
    id: 'oto-kiralama',
    name: 'Araç Kiralama',
    icon: Car,
    capabilities: {
      ...base,
      bookingModels: ['rental'],
      hasStaff: false,
      hasTables: true,
      tableTerminology: 'Araç',
      capacityUnit: 'unit',
      isDateRangeBased: true,
      isDurationBased: false,
      requiresDeposit: true,
    },
  },
  {
    id: 'mobil-temizlik',
    name: 'Temizlik / Mobil Hizmet',
    icon: SprayCan,
    capabilities: {
      ...base,
      bookingModels: ['appointment'],
      hasStaff: true,
      hasPhysicalLocation: false,
      isMobileService: true,
    },
  },
  {
    id: 'fotograf-video',
    name: 'Fotoğraf / Video Prodüksiyon',
    icon: Camera,
    capabilities: {
      ...base,
      bookingModels: ['appointment'],
      hasStaff: true,
      isMobileService: true,
      hasPhysicalLocation: true,
      requiresDeposit: true,
    },
  },
  {
    id: 'cicekci-hediye',
    name: 'Çiçekçi / Hediye',
    icon: Flower2,
    capabilities: {
      ...base,
      bookingModels: ['order'],
      hasStaff: false,
      isDurationBased: false,
      hasDelivery: true,
      capacityUnit: 'unlimited',
    },
  },
  {
    id: 'spor-salonu',
    name: 'Spor Salonu / Stüdyo',
    icon: Dumbbell,
    capabilities: {
      ...base,
      bookingModels: ['appointment'],
      hasStaff: true,
      isSubscriptionBased: true,
    },
  },
  {
    id: 'etkinlik-mekan',
    name: 'Etkinlik Mekanı / Organizasyon',
    icon: PartyPopper,
    capabilities: {
      ...base,
      bookingModels: ['reservation'],
      hasStaff: false,
      hasTables: true,
      tableTerminology: 'Salon',
      isDateRangeBased: true,
      requiresDeposit: true,
    },
  },
  {
    id: 'saglik-klinik',
    name: 'Klinik / Sağlık Hizmeti',
    icon: Stethoscope,
    capabilities: {
      ...base,
      bookingModels: ['appointment'],
      hasStaff: true,
      isDurationBased: true,
    },
  },
  {
    id: 'teknik-servis',
    name: 'Teknik Servis / Usta',
    icon: Wrench,
    capabilities: {
      ...base,
      bookingModels: ['appointment', 'walk-in-queue'],
      hasStaff: true,
      isMobileService: true,
      hasPhysicalLocation: true,
    },
  },
  {
    id: 'egitim-kurs',
    name: 'Kurs / Özel Ders',
    icon: GraduationCap,
    capabilities: {
      ...base,
      bookingModels: ['appointment'],
      hasStaff: true,
      isSubscriptionBased: true,
    },
  },
  {
    id: 'evcil-hayvan',
    name: 'Evcil Hayvan Bakımı / Pansiyon',
    icon: Dog,
    capabilities: {
      ...base,
      bookingModels: ['reservation', 'appointment'],
      hasStaff: true,
      hasTables: true,
      tableTerminology: 'Kafes/Alan',
      isDateRangeBased: true,
    },
  },
  {
    id: 'custom',
    name: 'Listede Yok / Kendi İşletmem',
    icon: HelpCircle,
    isCustom: true,
    capabilities: { ...base },
  },
];

export function getPresetById(id: string): CategoryPreset | undefined {
  return CATEGORY_PRESETS.find((p) => p.id === id);
}
