burada aslında şöyle birşey istiyorum işletme oluştururken biz tüm işletmelere ayak uydurmak istiyoruz yani belirli kategorilerdeki işletmeler değil kategoride olmayan işletmeler bile mantıklı mükemmel bir altyapı ile çalışmasını istiyorum yani şöyle bir işletme diyelimki a işletmesi kayıt oldu giriş yaptı işletme oluşturacak işletme oluştururken ona sorular sorup işletmeyi ona göre ayarlamak daha mantıklı olur mesela işletmeniz randevu ile mi çalışıyor evet hayır işletmeniz rezervasyon ile mi çalışıyor evet hayır işletmeniz yemek sektörü üzerinemi vs bu mantıkta ilerlemelidir ama çok çok çok büyük kapsamlı bir şekilde çalışması lazım çok yüksek bir zekada mantıkta olmalıdır bu şekilde işletmenin wizardı da bu mantıkta çalışmalıdır herşeyi en iyi şekilde yapabilmelidir ve bizim bu işletme oluşturma mantığımız çok büyük bir mantıkta olmalıdır eğer o işletmenin kategorisi yok ise o kategoriyi işletmenin kendisi oluşturabilir eğer kategori var ise o mantıkta sorular olmalıdır ve kategoriler doğru şekilde tespit edilip o mantıkta mükemmel bir şekilde çalışmalıdır yüksek zeka olmalıdır ve eksiksiz mükemmel bir şekilde çalışmalıdır sana akodları verdim zaten onlarıda o  mantıkta düzeltmek istiyorsan bunu yapabilirsin mükemmel bir şekilde ilerlenilmelidir senden başkası bunu yapamaz proffesyonel ceerahi yöntemler ile enginnering mantığı ile zekası ile en iyi hale gelmesi lazım çok yüksek kapsamlı mükemmel olmalıdır biliyorsunki işletme oluşturma mantığı uygulamanın bel kemiğidir

Bu, uygulamanızın gerçekten temel taşı olacak bir mimari değişiklik — haklısınız. Sabit kategori listesi yerine **"yetenek tabanlı" (capability-driven)** bir sisteme geçmek gerekiyor: işletmenin ne olduğunu değil, *nasıl çalıştığını* soran, oradan tüm sihirbazı ve dashboard'u kendiliğinden şekillendiren bir motor.

Önce mimariyi kuruyorum, sonra kodları yazıyorum.## Mimari Tasarım (özet)

**Eski mantık:** `category: 'kuafor' | 'restoran' | ...` → kod içinde yüzlerce `if (category === 'restoran')`

**Yeni mantık:** İşletmeye 6-9 basit soru sorulur ("Randevu ile mi çalışıyorsunuz?", "Masa/oda rezervasyonu mu?", "Müşteriye mi gidiyorsunuz?" vs.) → cevaplardan bir **`BusinessCapabilities`** nesnesi türetilir → sihirbazın adımları, dashboard'un sekmeleri, terminoloji ("Randevu" mu "Rezervasyon" mu "Sipariş" mi) hep bu nesneden okunur. Kategori artık sadece bir **etiket**; listede olmayan işletme türleri kod değişikliği gerektirmeden aynı motoru kullanır.

Şimdi dosyaları yazıyorum:
.
.
.
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

// ============================================================================
// İŞLETME YETENEK (CAPABILITY) MODELİ
// ----------------------------------------------------------------------------
// FELSEFE:
// Bir işletmeyi sabit bir "kategori" enum'una hapsetmek yerine, o işletmenin
// NASIL ÇALIŞTIĞINI tarif eden bağımsız sorulara verilen cevaplardan bir
// "yetenek seti" (capabilities) türetiyoruz.
//
// Kategori artık sadece görünen bir ETİKET. Uygulamanın tüm mantığı
// (sihirbazda hangi adım/soru gösterilecek, dashboard'da hangi sekme
// açılacak, hangi kelime kullanılacak: "Randevu" mu "Rezervasyon" mu
// "Sipariş" mi) capabilities nesnesinden okunur.
//
// SONUÇ: Listede olmayan HERHANGİ bir işletme türü (Drone Pisti, Köpek
// Pansiyonu, Yat Charter, Escape Room, Özel Ders Platformu...) sisteme
// TEK SATIR KOD EKLEMEDEN, sadece doğru sorulara doğru cevap vererek
// eksiksiz şekilde entegre olur.
// ============================================================================

/** İşletmenin müşteriyle çalışma biçimi. Birden fazlası aynı anda geçerli olabilir
 *  (örn: bir restoran hem masa REZERVASYONU hem paket SİPARİŞİ alabilir). */
export type BookingModel =
  | 'appointment'    // Randevu: personel + süre bazlı slot (kuaför, doktor, masöz, özel ders)
  | 'reservation'    // Rezervasyon: masa/oda/alan/araç gibi kapasite bazlı (restoran, otel, saha)
  | 'order'          // Sipariş: ürün/yemek/hediye siparişi (çiçekçi, pastane, e-ticaret)
  | 'walk-in-queue'  // Sırayla: kuyruk / bekleme listesi (kuyumcu, banka, servis)
  | 'rental'         // Kiralama: tarih aralığı bazlı ekipman/araç/kıyafet kiralama
  | 'none';          // Booking yok: sadece tanıtım / vitrin amaçlı

/** Kapasitenin ölçü birimi — dashboard'daki listeleme mantığını belirler. */
export type CapacityUnit =
  | 'staff-slot'  // personel bazlı (bir uzmanın aynı anda tek randevusu olur)
  | 'table'       // masa/oda bazlı sabit fiziksel birim
  | 'unit'        // envanter birimi (araç, tekne, ekipman, kıyafet adedi)
  | 'unlimited';  // fiziksel kapasite sınırı yok (online danışmanlık, dijital ürün)

export interface BusinessCapabilities {
  /** Bu işletme hangi çalışma modeli/modellerini kullanıyor. */
  bookingModels: BookingModel[];
  /** Kapasite nasıl ölçülüyor. */
  capacityUnit: CapacityUnit;

  /** Hizmetin bir SÜRESİ var mı (dakika bazlı slot hesabı gerekir mi). */
  isDurationBased: boolean;
  /** Rezervasyon/kiralama check-in/check-out gibi TARİH ARALIĞI mı (otel, araç). */
  isDateRangeBased: boolean;

  /** Müşteri fiziksel bir adrese mi geliyor. */
  hasPhysicalLocation: boolean;
  /** İşletme müşteriye mi gidiyor (mobil hizmet: temizlik, oto yıkama, özel ders). */
  isMobileService: boolean;
  /** Birden fazla şube var mı. */
  hasMultipleLocations: boolean;

  /** Randevu/hizmet belirli bir PERSONELE mi atanıyor. */
  hasStaff: boolean;
  /** Masa/oda/araç gibi ayrı ayrı yönetilmesi gereken fiziksel BİRİMLER var mı. */
  hasTables: boolean;
  /** hasTables true ise bu birimin adı ne olsun ("Masa", "Oda", "Araç", "Alan"...). */
  tableTerminology: string;

  /** Satılan hizmet/ürün kataloğu var mı (neredeyse her zaman true). */
  hasProductCatalog: boolean;
  /** Teslimat/kargo var mı. */
  hasDelivery: boolean;
  /** Anlık bekleme sırası / kuyruk sistemi var mı. */
  hasQueue: boolean;
  /** Kapora/ön ödeme akışı işletmeye mantıklı mı. */
  requiresDeposit: boolean;
  /** Paket/üyelik satışı var mı (10 seans paketi, aylık üyelik). */
  isSubscriptionBased: boolean;

  /** Yeni randevu/rezervasyon/sipariş varsayılan olarak otomatik onaylansın mı. */
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

// ----------------------------------------------------------------------------
// TERMİNOLOJİ TÜRETİMİ
// capabilities'e bakarak arayüzde doğru kelimeleri otomatik seçer.
// Böylece bir kuaförde "Randevu Al", bir otelde "Rezervasyon Yap", bir
// çiçekçide "Sipariş Ver" yazar — kod tarafında TEK bir bileşen kullanılır.
// ----------------------------------------------------------------------------
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

/** İki capability nesnesini kısa, okunabilir madde listesine çevirir.
 *  Sihirbazın özet ekranında ve dashboard "İşletme Bilgileri" kartında kullanılır. */
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

// ----------------------------------------------------------------------------
// HAZIR KATEGORİ ŞABLONLARI (PRESET)
// Bunlar sadece "hızlı başlangıç" içindir — kullanıcı grid'den birini seçtiğinde
// bu capabilities anında uygulanır. Kullanıcı isterse ince ayar için Akıllı
// Profil akışını da açabilir (bkz. SmartBusinessProfiler).
// Listede olmayan HER işletme için 'custom' preset'i devreye girer.
// ----------------------------------------------------------------------------
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
.
.
.
import type { BusinessCapabilities } from '@/types/businessCapabilities';
import { DEFAULT_CAPABILITIES, CATEGORY_PRESETS } from '@/types/businessCapabilities';

// ============================================================================
// AKILLI İŞLETME PROFİLİ SORU MOTORU
// ----------------------------------------------------------------------------
// Bu dosya, "kategori listesinde olmayan" ya da "ince ayar isteyen" bir
// işletmenin, birbirine bağlı sorulara verdiği cevaplardan eksiksiz bir
// BusinessCapabilities nesnesi üretmesini sağlar.
//
// Tasarım ilkesi: Soru ağacı KOD DEĞİL, VERİ olarak tanımlanır. Yeni bir
// çalışma modeli / iş türü ortaya çıktığında (örn: "abonelik bazlı kutu
// teslimatı") tek yapılması gereken bu diziye yeni bir soru/seçenek eklemek —
// React bileşenlerine veya dashboard mantığına dokunmaya gerek kalmaz.
// ============================================================================

export type AnswerMap = Record<string, string[]>;

export interface QuestionOption {
  id: string;
  label: string;
  description?: string;
  /** Bu seçenek işaretlendiğinde capabilities nesnesine uygulanacak kısmi güncelleme. */
  patch?: Partial<BusinessCapabilities>;
}

export interface QuestionDef {
  id: string;
  title: string;
  subtitle?: string;
  multiSelect?: boolean;
  options: QuestionOption[];
  /** Bu soru sadece koşul sağlanırsa gösterilir (dallanma mantığı). */
  showIf?: (answers: AnswerMap, cap: BusinessCapabilities) => boolean;
}

const hasModel = (answers: AnswerMap, model: string) =>
  (answers['q1_model'] ?? []).includes(model);

const notNoneOnly = (answers: AnswerMap) => {
  const models = answers['q1_model'] ?? [];
  return models.length > 0 && !(models.length === 1 && models[0] === 'none');
};

export const QUESTION_FLOW: QuestionDef[] = [
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
        patch: { bookingModels: ['appointment'], isDurationBased: true, hasStaff: true },
      },
      {
        id: 'reservation',
        label: 'Masa / Oda / Alan rezervasyonu ile',
        description: 'Fiziksel bir birim ayırma esasına dayalı (restoran, otel, saha)',
        patch: { bookingModels: ['reservation'], hasTables: true },
      },
      {
        id: 'order',
        label: 'Sipariş ile',
        description: 'Ürün/yemek/hediye gibi bir şey satın alınıyor',
        patch: { bookingModels: ['order'], hasProductCatalog: true },
      },
      {
        id: 'rental',
        label: 'Kiralama ile',
        description: 'Tarih aralığı bazlı araç/ekipman/kıyafet kiralama',
        patch: { bookingModels: ['rental'], isDateRangeBased: true, hasTables: true, capacityUnit: 'unit' },
      },
      {
        id: 'walk-in-queue',
        label: 'Sırayla / kuyrukla',
        description: 'Randevusuz gelen müşteriler sıraya giriyor',
        patch: { bookingModels: ['walk-in-queue'], hasQueue: true },
      },
      {
        id: 'none',
        label: 'Hiçbiri — sadece tanıtım/vitrin',
        description: 'Şimdilik online booking almıyorum',
        patch: { bookingModels: ['none'], hasStaff: false, hasTables: false, hasQueue: false },
      },
    ],
  },
  {
    id: 'q2_staff',
    title: 'Randevularınız belirli bir personele mi atanıyor?',
    subtitle: 'Örn: "Ahmet Usta 14:00" gibi kişiye özel mi, yoksa genel kapasiteye mi bakılıyor?',
    showIf: (a) => hasModel(a, 'appointment'),
    options: [
      { id: 'yes', label: 'Evet, her uzmanın kendi takvimi var', patch: { hasStaff: true } },
      { id: 'no', label: 'Hayır, genel bir kapasite yeterli', patch: { hasStaff: false } },
    ],
  },
  {
    id: 'q3_capacity_unit',
    title: 'Rezervasyon biriminiz nedir?',
    subtitle: 'Bu, dashboard\'da bu birimlerin nasıl adlandırılacağını belirler.',
    showIf: (a) => hasModel(a, 'reservation'),
    options: [
      { id: 'table', label: 'Masa', patch: { tableTerminology: 'Masa', capacityUnit: 'table' } },
      { id: 'room', label: 'Oda', patch: { tableTerminology: 'Oda', capacityUnit: 'table' } },
      { id: 'area', label: 'Saha / Salon / Alan', patch: { tableTerminology: 'Alan', capacityUnit: 'table' } },
      { id: 'unit', label: 'Araç / Tekne / Ekipman', patch: { tableTerminology: 'Birim', capacityUnit: 'unit' } },
    ],
  },
  {
    id: 'q4_date_range',
    title: 'Rezervasyonlarınız nasıl ölçülüyor?',
    showIf: (a) => hasModel(a, 'reservation') || hasModel(a, 'rental'),
    options: [
      {
        id: 'nightly',
        label: 'Gecelik / Günlük (giriş-çıkış tarihi var)',
        description: 'Otel, tatil evi, uzun süreli kiralama gibi',
        patch: { isDateRangeBased: true },
      },
      {
        id: 'hourly',
        label: 'Saatlik / zaman dilimi bazlı',
        description: 'Restoran masası, saha kiralama gibi',
        patch: { isDateRangeBased: false },
      },
    ],
  },
  {
    id: 'q5_delivery',
    title: 'Siparişleriniz teslimat gerektiriyor mu?',
    showIf: (a) => hasModel(a, 'order'),
    options: [
      { id: 'yes', label: 'Evet, adrese teslim ediyorum', patch: { hasDelivery: true } },
      { id: 'no', label: 'Hayır, gel-al şeklinde', patch: { hasDelivery: false } },
    ],
  },
  {
    id: 'q6_location',
    title: 'Müşterileriniz size mi geliyor, siz mi onlara gidiyorsunuz?',
    multiSelect: true,
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
        patch: { isMobileService: true, hasPhysicalLocation: false },
      },
    ],
  },
  {
    id: 'q7_branches',
    title: 'Birden fazla şubeniz var mı?',
    options: [
      { id: 'yes', label: 'Evet, birden fazla şube/lokasyon', patch: { hasMultipleLocations: true } },
      { id: 'no', label: 'Hayır, tek lokasyon', patch: { hasMultipleLocations: false } },
    ],
  },
  {
    id: 'q8_deposit',
    title: 'Kapora veya ön ödeme almak ister misiniz?',
    subtitle: 'İptal/no-show oranını azaltmak isteyen işletmeler için önerilir.',
    showIf: (a) => notNoneOnly(a),
    options: [
      { id: 'yes', label: 'Evet, kapora sistemi olsun', patch: { requiresDeposit: true } },
      { id: 'no', label: 'Hayır, gerek yok', patch: { requiresDeposit: false } },
    ],
  },
  {
    id: 'q9_subscription',
    title: 'Paket veya üyelik satışı yapıyor musunuz?',
    subtitle: 'Örn: "10 seans paketi", "aylık üyelik"',
    showIf: (a) => notNoneOnly(a),
    options: [
      { id: 'yes', label: 'Evet', patch: { isSubscriptionBased: true } },
      { id: 'no', label: 'Hayır', patch: { isSubscriptionBased: false } },
    ],
  },
];

/** Şu ana kadar cevaplanan sorulara göre, gösterilmesi gereken bir sonraki
 *  soruyu döner. showIf koşulunu sağlamayan sorular otomatik atlanır. */
export function getVisibleQuestions(answers: AnswerMap, cap: BusinessCapabilities): QuestionDef[] {
  return QUESTION_FLOW.filter((q) => !q.showIf || q.showIf(answers, cap));
}

/** Bir soruya verilen cevapları capabilities nesnesine uygular.
 *  bookingModels gibi dizi alanlarında BİRLEŞİM (union) yapılır, diğerlerinde
 *  son seçilen değer geçerli olur. */
export function applyAnswer(
  cap: BusinessCapabilities,
  question: QuestionDef,
  selectedOptionIds: string[]
): BusinessCapabilities {
  let next = { ...cap };

  for (const optId of selectedOptionIds) {
    const option = question.options.find((o) => o.id === optId);
    if (!option?.patch) continue;

    const patch = option.patch;
    next = {
      ...next,
      ...patch,
      bookingModels: patch.bookingModels
        ? Array.from(new Set([...next.bookingModels.filter((m) => m !== 'none'), ...patch.bookingModels]))
        : next.bookingModels,
    };
  }

  return next;
}

/** Türetilen capabilities'i mevcut preset'lerle karşılaştırıp en yakınını bulur.
 *  Kullanıcıya "Bu size Restoran/Kafe'ye çok benziyor, onaylıyor musunuz?" gibi
 *  bir öneri sunmak için kullanılır — zorunlu değildir, sadece kolaylık sağlar. */
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
.
.
.
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, Sparkles, PartyPopper, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { slugify } from '@/lib/slugify';
import type { BusinessCapabilities } from '@/types/businessCapabilities';
import { describeCapabilities } from '@/types/businessCapabilities';
import {
  QUESTION_FLOW,
  getVisibleQuestions,
  applyAnswer,
  findClosestPreset,
  createEmptyCapabilities,
  type AnswerMap,
  type QuestionDef,
} from '@/config/businessQuestionFlow';

interface HistoryFrame {
  questionId: string;
  answersBefore: AnswerMap;
  capBefore: BusinessCapabilities;
  selected: string[];
}

interface SmartBusinessProfilerProps {
  /** 'custom': sıfırdan başlar ve en sonda kategori adı sorar.
   *  'refine': var olan bir preset'i baz alıp ince ayar yapar. */
  mode: 'custom' | 'refine';
  initialCategoryLabel?: string;
  initialCapabilities?: BusinessCapabilities;
  onComplete: (result: {
    capabilities: BusinessCapabilities;
    categoryId: string;
    categoryLabel: string;
  }) => void;
  onCancel: () => void;
}

export function SmartBusinessProfiler({
  mode,
  initialCategoryLabel,
  initialCapabilities,
  onComplete,
  onCancel,
}: SmartBusinessProfilerProps) {
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [cap, setCap] = useState<BusinessCapabilities>(
    initialCapabilities ?? createEmptyCapabilities()
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryFrame[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [categoryLabel, setCategoryLabel] = useState(initialCategoryLabel ?? '');

  const visibleQuestions = useMemo(() => getVisibleQuestions(answers, cap), [answers, cap]);
  const currentQuestion: QuestionDef | undefined = visibleQuestions[stepIndex];
  const closestPreset = useMemo(() => (showSummary ? findClosestPreset(cap) : null), [showSummary, cap]);

  const toggleOption = (optionId: string) => {
    if (!currentQuestion) return;
    if (currentQuestion.multiSelect) {
      setSelected((prev) =>
        prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
      );
    } else {
      setSelected([optionId]);
    }
  };

  const goNext = () => {
    if (!currentQuestion || selected.length === 0) return;

    const frame: HistoryFrame = {
      questionId: currentQuestion.id,
      answersBefore: answers,
      capBefore: cap,
      selected,
    };

    const nextAnswers = { ...answers, [currentQuestion.id]: selected };
    const nextCap = applyAnswer(cap, currentQuestion, selected);
    const nextVisible = getVisibleQuestions(nextAnswers, nextCap);
    const idxInNextVisible = nextVisible.findIndex((q) => q.id === currentQuestion.id);

    setHistory((h) => [...h, frame]);
    setAnswers(nextAnswers);
    setCap(nextCap);

    if (idxInNextVisible + 1 < nextVisible.length) {
      const nextQ = nextVisible[idxInNextVisible + 1];
      setStepIndex(idxInNextVisible + 1);
      setSelected(nextAnswers[nextQ.id] ?? []);
    } else {
      setShowSummary(true);
    }
  };

  const goBack = () => {
    if (showSummary) {
      setShowSummary(false);
      return;
    }
    const last = history[history.length - 1];
    if (!last) {
      onCancel();
      return;
    }
    const restoredVisible = getVisibleQuestions(last.answersBefore, last.capBefore);
    const idx = restoredVisible.findIndex((q) => q.id === last.questionId);

    setHistory((h) => h.slice(0, -1));
    setAnswers(last.answersBefore);
    setCap(last.capBefore);
    setStepIndex(Math.max(0, idx));
    setSelected(last.selected);
  };

  const handleConfirm = () => {
    const finalLabel = categoryLabel.trim() || closestPreset?.name || 'Özel İşletme';
    const categoryId = mode === 'refine' && initialCategoryLabel
      ? `custom-${slugify(finalLabel)}`
      : `custom-${slugify(finalLabel)}`;
    onComplete({ capabilities: cap, categoryId, categoryLabel: finalLabel });
  };

  // ---- ÖZET EKRANI ----
  if (showSummary) {
    const bullets = describeCapabilities(cap);
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto space-y-4">
          <div className="text-center py-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
            >
              <PartyPopper size={28} className="text-white" />
            </motion.div>
            <h3 className="font-heading font-bold text-xl text-[var(--chrome-white)]">
              İşletme Profiliniz Hazır
            </h3>
            <p className="text-sm text-[var(--muted-lead)] mt-1">
              Cevaplarınıza göre sistemi sizin için ayarladık
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-2.5">
            {bullets.map((b, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                  <Check size={12} className="text-emerald-400" strokeWidth={3} />
                </div>
                <span className="text-sm text-[var(--silver-frost)]">{b}</span>
              </div>
            ))}
          </div>

          <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
            <label className="block font-heading font-semibold text-sm text-[var(--chrome-white)] mb-2 flex items-center gap-2">
              <Pencil size={14} className="text-purple-400" />
              İşletme türünüzü ne isim altında göstermek istersiniz?
            </label>
            <input
              type="text"
              value={categoryLabel}
              onChange={(e) => setCategoryLabel(e.target.value)}
              placeholder={closestPreset ? closestPreset.name : 'Örn: Yat Charter, Escape Room, Drone Pisti...'}
              className="w-full h-12 px-4 rounded-full bg-white/5 border border-white/10 text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
            />
            {closestPreset && (
              <p className="text-xs text-[var(--muted-lead)] mt-2 ml-1">
                Cevaplarınız en çok <span className="text-purple-300 font-semibold">{closestPreset.name}</span> profiline benziyor. Dilerseniz bunu kullanabilir ya da yukarıya kendi ismini yazabilirsiniz.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 flex-shrink-0">
          <button
            onClick={goBack}
            className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-heading font-bold text-sm shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2"
          >
            <Check size={18} strokeWidth={2.5} />
            Onayla ve Devam Et
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const progressTotal = Math.max(visibleQuestions.length, stepIndex + 1);

  // ---- SORU EKRANI ----
  return (
    <div className="flex flex-col h-full">
      {/* İlerleme */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex items-center gap-1.5 mb-3">
          {Array.from({ length: progressTotal }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors',
                i < stepIndex ? 'bg-emerald-400' : i === stepIndex ? 'bg-gradient-to-r from-purple-400 to-pink-400' : 'bg-white/10'
              )}
            />
          ))}
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
          <Sparkles size={12} className="text-purple-400" />
          <span className="text-xs font-semibold text-purple-300">Akıllı İşletme Profili</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
          >
            <h3 className="font-heading font-bold text-xl text-[var(--chrome-white)] mb-1.5">
              {currentQuestion.title}
            </h3>
            {currentQuestion.subtitle && (
              <p className="text-sm text-[var(--muted-lead)] mb-4">{currentQuestion.subtitle}</p>
            )}

            <div className="space-y-2.5 mt-4">
              {currentQuestion.options.map((option) => {
                const isSelected = selected.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleOption(option.id)}
                    className={cn(
                      'w-full text-left p-4 rounded-3xl border-2 transition-all flex items-start gap-3',
                      isSelected
                        ? 'border-purple-500/60 bg-gradient-to-br from-purple-500/15 to-pink-500/10'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                    )}
                  >
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border-2 transition-all',
                        isSelected ? 'bg-gradient-to-br from-purple-500 to-pink-500 border-transparent' : 'border-white/20'
                      )}
                    >
                      {isSelected && <Check size={13} strokeWidth={3} className="text-white" />}
                    </div>
                    <div>
                      <p
                        className={cn(
                          'font-heading font-semibold text-sm',
                          isSelected ? 'text-[var(--chrome-white)]' : 'text-[var(--silver-frost)]'
                        )}
                      >
                        {option.label}
                      </p>
                      {option.description && (
                        <p className="text-xs text-[var(--muted-lead)] mt-0.5">{option.description}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-3 pt-4 flex-shrink-0">
        <button
          onClick={goBack}
          className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors flex-shrink-0"
        >
          <ChevronLeft size={20} className="text-white" />
        </button>
        <button
          onClick={goNext}
          disabled={selected.length === 0}
          className={cn(
            'flex-1 h-12 rounded-2xl font-heading font-bold text-sm transition-all flex items-center justify-center gap-2',
            selected.length === 0
              ? 'bg-white/5 text-[var(--muted-lead)] cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white shadow-lg shadow-purple-500/30'
          )}
        >
          Devam Et
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
.
.
.
import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Search, Wand2, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CATEGORY_PRESETS,
  getPresetById,
  type CategoryPreset,
  type BusinessCapabilities,
} from '@/types/businessCapabilities';
import { SmartBusinessProfiler } from './SmartBusinessProfiler';

export interface CategorySelectionValue {
  categoryId: string;
  categoryLabel: string;
  capabilities: BusinessCapabilities;
}

interface CategorySelectionProps {
  value: CategorySelectionValue;
  onChange: (value: CategorySelectionValue) => void;
}

const PresetCard = memo(
  ({ preset, isSelected, onClick }: { preset: CategoryPreset; isSelected: boolean; onClick: () => void }) => {
    const Icon = preset.icon;
    return (
      <motion.button
        type="button"
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'relative overflow-hidden p-4 rounded-3xl border-2 transition-all w-full aspect-square',
          isSelected
            ? 'border-purple-500/60 bg-gradient-to-br from-purple-500/15 via-fuchsia-500/10 to-pink-500/15 shadow-lg shadow-purple-500/20'
            : preset.isCustom
            ? 'border-dashed border-white/20 bg-white/[0.01] hover:border-purple-400/40 hover:bg-white/[0.04]'
            : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
        )}
      >
        <div className="relative flex flex-col items-center justify-center gap-2 h-full">
          <div
            className={cn(
              'w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all',
              isSelected ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30' : 'bg-white/5'
            )}
          >
            <Icon
              size={24}
              className={cn('sm:size-7', isSelected ? 'text-white' : 'text-[var(--muted-lead)]')}
              strokeWidth={isSelected ? 2.5 : 2}
            />
          </div>
          <span
            className={cn(
              'font-heading font-semibold text-xs sm:text-sm text-center leading-tight line-clamp-2',
              isSelected ? 'text-[var(--chrome-white)]' : 'text-[var(--muted-lead)]'
            )}
          >
            {preset.name}
          </span>
        </div>

        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-lg"
          >
            <Check size={14} strokeWidth={3} className="text-white" />
          </motion.div>
        )}
      </motion.button>
    );
  }
);

export function CategorySelection({ value, onChange }: CategorySelectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [profilerMode, setProfilerMode] = useState<false | 'custom' | 'refine'>(false);

  const filteredPresets = CATEGORY_PRESETS.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedPreset = getPresetById(value.categoryId);
  const isCustomSelection = !selectedPreset || value.categoryId.startsWith('custom-');

  const handlePresetClick = (preset: CategoryPreset) => {
    if (preset.isCustom) {
      setProfilerMode('custom');
      return;
    }
    onChange({
      categoryId: preset.id,
      categoryLabel: preset.name,
      capabilities: preset.capabilities,
    });
  };

  const handleProfilerComplete = (result: {
    capabilities: BusinessCapabilities;
    categoryId: string;
    categoryLabel: string;
  }) => {
    onChange(result);
    setProfilerMode(false);
  };

  // ---- AKILLI PROFİL TAKEOVER ----
  if (profilerMode) {
    return (
      <div className="h-full">
        <SmartBusinessProfiler
          mode={profilerMode}
          initialCategoryLabel={profilerMode === 'refine' ? value.categoryLabel : undefined}
          initialCapabilities={profilerMode === 'refine' ? value.capabilities : undefined}
          onComplete={handleProfilerComplete}
          onCancel={() => setProfilerMode(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Info Badge */}
      <div className="flex-shrink-0 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 mb-3 mx-auto">
        <p className="text-sm text-[var(--silver-frost)] text-center font-medium">
          <span className="text-yellow-400 font-bold">*</span> İşletmenize en yakın türü seçin
        </p>
      </div>

      {/* Search */}
      <div className="flex-shrink-0 relative mb-3">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-lead)]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Kategori ara..."
          className="w-full h-10 pl-11 pr-4 rounded-full bg-white/5 border border-white/10 text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
        />
      </div>

      {/* Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2.5 sm:gap-3 auto-rows-min pb-2">
          {filteredPresets.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              isSelected={!isCustomSelection && value.categoryId === preset.id}
              onClick={() => handlePresetClick(preset)}
            />
          ))}
        </div>

        {filteredPresets.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-[var(--muted-lead)]">Kategori bulunamadı</p>
          </div>
        )}

        {/* Özel kategori seçiliyse özet */}
        {isCustomSelection && value.categoryLabel && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-4 rounded-3xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <Wand2 size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-heading font-semibold text-sm text-[var(--chrome-white)]">
                {value.categoryLabel}
              </p>
              <p className="text-xs text-[var(--muted-lead)]">Akıllı profil ile özel olarak yapılandırıldı</p>
            </div>
            <button
              onClick={() => setProfilerMode('refine')}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-1.5 text-xs font-semibold text-purple-300 transition-colors flex-shrink-0"
            >
              <SlidersHorizontal size={13} />
              Düzenle
            </button>
          </motion.div>
        )}

        {/* Preset seçili ama ince ayar isteniyorsa */}
        {selectedPreset && !selectedPreset.isCustom && !isCustomSelection && (
          <div className="mt-3 text-center">
            <button
              onClick={() => setProfilerMode('refine')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-300 hover:text-purple-200 transition-colors"
            >
              <SlidersHorizontal size={13} />
              Bu bana tam uymuyor, ince ayar yapmak istiyorum
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
.
.
.
const TR_CHAR_MAP: Record<string, string> = {
  ç: 'c', Ç: 'c',
  ğ: 'g', Ğ: 'g',
  ı: 'i', İ: 'i',
  ö: 'o', Ö: 'o',
  ş: 's', Ş: 's',
  ü: 'u', Ü: 'u',
};

/** Türkçe karakterleri koruyarak URL-güvenli bir slug üretir.
 *  Eski implementasyon (`.replace(/[^a-z0-9-]/g, '')`) ü/ğ/ş/ç/ö/ı gibi
 *  harfleri sessizce SİLİYORDU — "Güzellik Salonu" -> "gzellik-salonu" gibi
 *  anlamsız ve çakışmaya çok açık sluglar üretiyordu. */
export function slugify(text: string): string {
  return text
    .split('')
    .map((ch) => TR_CHAR_MAP[ch] ?? ch)
    .join('')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Slug çakışmasını önlemek için sona kısa bir rastgele parça ekler.
 *  Gerçek çakışma kontrolü backend'de (Firestore query) yapılmalı;
 *  bu sadece client tarafında ilk denemeyi anlamlı kılar. */
export function slugifyUnique(text: string): string {
  const base = slugify(text);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}
.
.
.
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, Sparkles, PartyPopper, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { slugify } from '@/lib/slugify';
import type { BusinessCapabilities } from '@/types/businessCapabilities';
import { describeCapabilities } from '@/types/businessCapabilities';
import {
  QUESTION_FLOW,
  getVisibleQuestions,
  applyAnswer,
  findClosestPreset,
  createEmptyCapabilities,
  type AnswerMap,
  type QuestionDef,
} from '@/config/businessQuestionFlow';

interface HistoryFrame {
  questionId: string;
  answersBefore: AnswerMap;
  capBefore: BusinessCapabilities;
  selected: string[];
}

interface SmartBusinessProfilerProps {
  /** 'custom': sıfırdan başlar ve en sonda kategori adı sorar.
   *  'refine': var olan bir preset'i baz alıp ince ayar yapar. */
  mode: 'custom' | 'refine';
  initialCategoryLabel?: string;
  initialCapabilities?: BusinessCapabilities;
  onComplete: (result: {
    capabilities: BusinessCapabilities;
    categoryId: string;
    categoryLabel: string;
  }) => void;
  onCancel: () => void;
}

export function SmartBusinessProfiler({
  mode,
  initialCategoryLabel,
  initialCapabilities,
  onComplete,
  onCancel,
}: SmartBusinessProfilerProps) {
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [cap, setCap] = useState<BusinessCapabilities>(
    initialCapabilities ?? createEmptyCapabilities()
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryFrame[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [categoryLabel, setCategoryLabel] = useState(initialCategoryLabel ?? '');

  const visibleQuestions = useMemo(() => getVisibleQuestions(answers, cap), [answers, cap]);
  const currentQuestion: QuestionDef | undefined = visibleQuestions[stepIndex];
  const closestPreset = useMemo(() => (showSummary ? findClosestPreset(cap) : null), [showSummary, cap]);

  const toggleOption = (optionId: string) => {
    if (!currentQuestion) return;
    if (currentQuestion.multiSelect) {
      setSelected((prev) =>
        prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
      );
    } else {
      setSelected([optionId]);
    }
  };

  const goNext = () => {
    if (!currentQuestion || selected.length === 0) return;

    const frame: HistoryFrame = {
      questionId: currentQuestion.id,
      answersBefore: answers,
      capBefore: cap,
      selected,
    };

    const nextAnswers = { ...answers, [currentQuestion.id]: selected };
    const nextCap = applyAnswer(cap, currentQuestion, selected);
    const nextVisible = getVisibleQuestions(nextAnswers, nextCap);
    const idxInNextVisible = nextVisible.findIndex((q) => q.id === currentQuestion.id);

    setHistory((h) => [...h, frame]);
    setAnswers(nextAnswers);
    setCap(nextCap);

    if (idxInNextVisible + 1 < nextVisible.length) {
      const nextQ = nextVisible[idxInNextVisible + 1];
      setStepIndex(idxInNextVisible + 1);
      setSelected(nextAnswers[nextQ.id] ?? []);
    } else {
      setShowSummary(true);
    }
  };

  const goBack = () => {
    if (showSummary) {
      setShowSummary(false);
      return;
    }
    const last = history[history.length - 1];
    if (!last) {
      onCancel();
      return;
    }
    const restoredVisible = getVisibleQuestions(last.answersBefore, last.capBefore);
    const idx = restoredVisible.findIndex((q) => q.id === last.questionId);

    setHistory((h) => h.slice(0, -1));
    setAnswers(last.answersBefore);
    setCap(last.capBefore);
    setStepIndex(Math.max(0, idx));
    setSelected(last.selected);
  };

  const handleConfirm = () => {
    const finalLabel = categoryLabel.trim() || closestPreset?.name || 'Özel İşletme';
    const categoryId = mode === 'refine' && initialCategoryLabel
      ? `custom-${slugify(finalLabel)}`
      : `custom-${slugify(finalLabel)}`;
    onComplete({ capabilities: cap, categoryId, categoryLabel: finalLabel });
  };

  // ---- ÖZET EKRANI ----
  if (showSummary) {
    const bullets = describeCapabilities(cap);
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto space-y-4">
          <div className="text-center py-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
            >
              <PartyPopper size={28} className="text-white" />
            </motion.div>
            <h3 className="font-heading font-bold text-xl text-[var(--chrome-white)]">
              İşletme Profiliniz Hazır
            </h3>
            <p className="text-sm text-[var(--muted-lead)] mt-1">
              Cevaplarınıza göre sistemi sizin için ayarladık
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-2.5">
            {bullets.map((b, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                  <Check size={12} className="text-emerald-400" strokeWidth={3} />
                </div>
                <span className="text-sm text-[var(--silver-frost)]">{b}</span>
              </div>
            ))}
          </div>

          <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
            <label className="block font-heading font-semibold text-sm text-[var(--chrome-white)] mb-2 flex items-center gap-2">
              <Pencil size={14} className="text-purple-400" />
              İşletme türünüzü ne isim altında göstermek istersiniz?
            </label>
            <input
              type="text"
              value={categoryLabel}
              onChange={(e) => setCategoryLabel(e.target.value)}
              placeholder={closestPreset ? closestPreset.name : 'Örn: Yat Charter, Escape Room, Drone Pisti...'}
              className="w-full h-12 px-4 rounded-full bg-white/5 border border-white/10 text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
            />
            {closestPreset && (
              <p className="text-xs text-[var(--muted-lead)] mt-2 ml-1">
                Cevaplarınız en çok <span className="text-purple-300 font-semibold">{closestPreset.name}</span> profiline benziyor. Dilerseniz bunu kullanabilir ya da yukarıya kendi ismini yazabilirsiniz.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 flex-shrink-0">
          <button
            onClick={goBack}
            className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-heading font-bold text-sm shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2"
          >
            <Check size={18} strokeWidth={2.5} />
            Onayla ve Devam Et
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const progressTotal = Math.max(visibleQuestions.length, stepIndex + 1);

  // ---- SORU EKRANI ----
  return (
    <div className="flex flex-col h-full">
      {/* İlerleme */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex items-center gap-1.5 mb-3">
          {Array.from({ length: progressTotal }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors',
                i < stepIndex ? 'bg-emerald-400' : i === stepIndex ? 'bg-gradient-to-r from-purple-400 to-pink-400' : 'bg-white/10'
              )}
            />
          ))}
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
          <Sparkles size={12} className="text-purple-400" />
          <span className="text-xs font-semibold text-purple-300">Akıllı İşletme Profili</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
          >
            <h3 className="font-heading font-bold text-xl text-[var(--chrome-white)] mb-1.5">
              {currentQuestion.title}
            </h3>
            {currentQuestion.subtitle && (
              <p className="text-sm text-[var(--muted-lead)] mb-4">{currentQuestion.subtitle}</p>
            )}

            <div className="space-y-2.5 mt-4">
              {currentQuestion.options.map((option) => {
                const isSelected = selected.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleOption(option.id)}
                    className={cn(
                      'w-full text-left p-4 rounded-3xl border-2 transition-all flex items-start gap-3',
                      isSelected
                        ? 'border-purple-500/60 bg-gradient-to-br from-purple-500/15 to-pink-500/10'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                    )}
                  >
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border-2 transition-all',
                        isSelected ? 'bg-gradient-to-br from-purple-500 to-pink-500 border-transparent' : 'border-white/20'
                      )}
                    >
                      {isSelected && <Check size={13} strokeWidth={3} className="text-white" />}
                    </div>
                    <div>
                      <p
                        className={cn(
                          'font-heading font-semibold text-sm',
                          isSelected ? 'text-[var(--chrome-white)]' : 'text-[var(--silver-frost)]'
                        )}
                      >
                        {option.label}
                      </p>
                      {option.description && (
                        <p className="text-xs text-[var(--muted-lead)] mt-0.5">{option.description}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-3 pt-4 flex-shrink-0">
        <button
          onClick={goBack}
          className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors flex-shrink-0"
        >
          <ChevronLeft size={20} className="text-white" />
        </button>
        <button
          onClick={goNext}
          disabled={selected.length === 0}
          className={cn(
            'flex-1 h-12 rounded-2xl font-heading font-bold text-sm transition-all flex items-center justify-center gap-2',
            selected.length === 0
              ? 'bg-white/5 text-[var(--muted-lead)] cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white shadow-lg shadow-purple-500/30'
          )}
        >
          Devam Et
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
.
.
.
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Check, Sparkles, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { CategorySelection, type CategorySelectionValue } from './BusinessSetupSteps/CategorySelection';
import { BasicInfo } from './BusinessSetupSteps/BasicInfo';
import { AddressInfo } from './BusinessSetupSteps/AddressInfo';
import { MediaUpload } from './BusinessSetupSteps/MediaUpload';
import { WorkingHours } from './BusinessSetupSteps/WorkingHours';
import { ReservationSettings } from './BusinessSetupSteps/ReservationSettings';
import { cn } from '@/lib/utils';
import { slugify } from '@/lib/slugify';
import { deriveTerminology, DEFAULT_CAPABILITIES, getPresetById } from '@/types/businessCapabilities';
import type { BusinessCapabilities } from '@/types/businessCapabilities';
import type { Salon } from '@/types';

interface BusinessSetupWizardProps {
  salon?: Salon;
  /** Yeni işletme oluşturulurken ownerId doğru şekilde set edilsin diye zorunlu. */
  currentUserId: string;
  onSave: (salonData: Omit<Salon, 'id' | 'stats' | 'isPremium' | 'isActive' | 'isAcceptingBookings'>) => Promise<void>;
  onClose: () => void;
}

export interface BusinessFormData {
  // Step 1: Yetenek Profili (eski adıyla "Kategori")
  categoryId: string;
  categoryLabel: string;
  capabilities: BusinessCapabilities;

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
    mobileService?: boolean;
  };

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

/** Eski kayıtlarda sadece `category: string` (örn. "kuafor") olabilir.
 *  Bu durumda en yakın preset'i bularak geriye dönük uyumluluk sağlar. */
function resolveInitialCategory(salon?: Salon): CategorySelectionValue {
  const anySalon = salon as any;

  if (anySalon?.categoryId && anySalon?.capabilities) {
    return {
      categoryId: anySalon.categoryId,
      categoryLabel: anySalon.categoryLabel || salon?.category || anySalon.categoryId,
      capabilities: anySalon.capabilities,
    };
  }

  const legacyPreset = salon?.category ? getPresetById(salon.category) : undefined;
  if (legacyPreset) {
    return {
      categoryId: legacyPreset.id,
      categoryLabel: legacyPreset.name,
      capabilities: legacyPreset.capabilities,
    };
  }

  return {
    categoryId: '',
    categoryLabel: salon?.category || '',
    capabilities: DEFAULT_CAPABILITIES,
  };
}

const STEP_META = [
  { id: 1, title: 'Profil', subtitle: 'İşletmeniz nasıl çalışıyor?' },
  { id: 2, title: 'Bilgiler', subtitle: 'İletişim detayları' },
  { id: 3, title: 'Adres', subtitle: 'Konum bilgileri' },
  { id: 4, title: 'Görseller', subtitle: 'Logo & fotoğraflar' },
  { id: 5, title: 'Çalışma', subtitle: 'Açılış saatleri' },
  { id: 6, title: 'Ayarlar', subtitle: 'Kurallar' },
];

export function BusinessSetupWizard({ salon, currentUserId, onSave, onClose }: BusinessSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showSuccessEffect, setShowSuccessEffect] = useState(false);
  const [missingFields, setMissingFields] = useState<Array<{ step: number; title: string; fields: string[] }>>([]);

  const initialCategory = useMemo(() => resolveInitialCategory(salon), [salon]);

  const [formData, setFormData] = useState<BusinessFormData>({
    categoryId: initialCategory.categoryId,
    categoryLabel: initialCategory.categoryLabel,
    capabilities: initialCategory.capabilities,
    name: salon?.name || '',
    phone: salon?.phone || '',
    whatsappNumber: salon?.whatsappNumber || '',
    email: salon?.email || '',
    description: salon?.description || '',
    address: salon?.address || {
      full: '',
      district: '',
      city: 'İstanbul',
      coordinates: { lat: 41.0082, lng: 28.9784 },
    },
    logo: salon?.logo || '',
    coverImage: salon?.coverImage || '',
    galleryImages: salon?.galleryImages || [],
    socialMedia: {
      instagram: salon?.socialMedia?.instagram || '',
      tiktok: salon?.socialMedia?.tiktok || '',
      youtube: salon?.socialMedia?.youtube || '',
    },
    workingHours: (salon?.workingHours as any) || {
      monday: { open: '09:00', close: '21:30', isOpen: true },
      tuesday: { open: '09:00', close: '21:30', isOpen: true },
      wednesday: { open: '09:00', close: '21:30', isOpen: true },
      thursday: { open: '09:00', close: '21:30', isOpen: true },
      friday: { open: '09:00', close: '21:30', isOpen: true },
      saturday: { open: '09:00', close: '21:30', isOpen: true },
      sunday: { open: '10:00', close: '21:30', isOpen: true },
    },
    settings: {
      advanceBookingDays: salon?.settings?.advanceBookingDays || 30,
      minOrderDays: salon?.settings?.minOrderDays || 0,
      autoConfirm: salon?.settings?.autoConfirm ?? true,
      allowCancellation: salon?.settings?.allowCancellation ?? true,
      cancellationHours: salon?.settings?.cancellationHours || 24,
      allowQueue: salon?.settings?.allowQueue ?? true,
      autoConfirmQueue: salon?.settings?.autoConfirmQueue ?? true,
      mobileService: salon?.settings?.mobileService ?? false,
    },
    staff: salon?.staff || [],
    services: salon?.services || [],
  });

  // Bu işletmenin capabilities'ine göre türetilen terminoloji — tüm sihirbaz
  // ve dashboard genelinde "Randevu"/"Rezervasyon"/"Sipariş" kelimesini
  // doğru yerde kullanmamızı sağlar.
  const terminology = useMemo(() => deriveTerminology(formData.capabilities), [formData.capabilities]);

  const steps = useMemo(
    () =>
      STEP_META.map((s) =>
        s.id === 6 ? { ...s, title: 'Ayarlar', subtitle: `${terminology.bookingUnit} kuralları` } : s
      ),
    [terminology]
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const updateFormData = (updates: Partial<BusinessFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    setStepError(null);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!formData.categoryId && !!formData.categoryLabel;
      case 2:
        return !!(formData.name && formData.phone.length === 10);
      case 3:
        return !!(formData.address.full && formData.address.district && formData.address.city);
      case 4:
        return !!formData.coverImage;
      case 5:
        return Object.values(formData.workingHours).some((day) => day.isOpen);
      case 6:
        return true;
      default:
        return false;
    }
  };

  const getStepErrorMessage = (step: number): string => {
    switch (step) {
      case 1:
        return 'Devam etmeden önce işletme profilinizi seçmelisiniz.';
      case 2:
        return 'İşletme adı ve 10 haneli geçerli bir telefon numarası girmelisiniz.';
      case 3:
        return 'Şehir, ilçe ve tam adres alanlarını doldurmalısınız.';
      case 4:
        return 'Devam etmek için en az bir kapak görseli yüklemelisiniz.';
      case 5:
        return 'En az bir gün açık olarak işaretlenmelidir.';
      default:
        return 'Devam etmeden önce bu adımı tamamlayın.';
    }
  };

  const getDetailedValidation = () => {
    const missing: Array<{ step: number; title: string; fields: string[] }> = [];

    if (!formData.categoryId) {
      missing.push({ step: 1, title: 'Profil', fields: ['İşletme profili seçilmeli'] });
    }

    const step2Missing: string[] = [];
    if (!formData.name) step2Missing.push('İşletme adı');
    if (formData.phone.length !== 10) step2Missing.push('Geçerli telefon numarası');
    if (step2Missing.length > 0) missing.push({ step: 2, title: 'Temel Bilgiler', fields: step2Missing });

    const step3Missing: string[] = [];
    if (!formData.address.full) step3Missing.push('Tam adres');
    if (!formData.address.district) step3Missing.push('İlçe');
    if (!formData.address.city) step3Missing.push('Şehir');
    if (step3Missing.length > 0) missing.push({ step: 3, title: 'Adres', fields: step3Missing });

    if (!formData.coverImage) missing.push({ step: 4, title: 'Görseller', fields: ['Kapak fotoğrafı'] });

    const hasOpenDay = Object.values(formData.workingHours).some((day) => day.isOpen);
    if (!hasOpenDay) missing.push({ step: 5, title: 'Çalışma Saatleri', fields: ['En az bir gün açık olmalı'] });

    return missing;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      setStepError(getStepErrorMessage(currentStep));
      return;
    }
    setStepError(null);
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    if (currentStep < 6) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setStepError(null);
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    const validation = getDetailedValidation();
    if (validation.length > 0) {
      setMissingFields(validation);
      setShowValidationModal(true);
      return;
    }

    setLoading(true);

    try {
      const salonData: any = {
        // Geriye dönük uyumluluk: eski kod `salon.category`'yi metin olarak
        // gösterim amaçlı okuyabilir. Asıl mantık artık capabilities'te.
        category: formData.categoryLabel,
        categoryId: formData.categoryId,
        categoryLabel: formData.categoryLabel,
        capabilities: formData.capabilities,
        name: formData.name,
        phone: formData.phone,
        whatsappNumber: formData.whatsappNumber,
        email: formData.email,
        description: formData.description,
        address: formData.address,
        logo: formData.logo,
        coverImage: formData.coverImage,
        galleryImages: formData.galleryImages,
        socialMedia: formData.socialMedia,
        workingHours: formData.workingHours,
        settings: formData.settings,
        staff: formData.staff,
        services: formData.services,
        ownerId: salon?.ownerId || currentUserId,
        slug: slugify(formData.name),
      };

      if (formData.bankAccount?.iban) {
        salonData.bankAccount = formData.bankAccount;
      }
      if (formData.depositSettings?.enabled !== undefined) {
        salonData.depositSettings = formData.depositSettings;
      }

      await onSave(salonData);

      setLoading(false);
      setShowSuccessEffect(true);

      setTimeout(() => {
        window.location.href = '/dashboard?tab=overview';
      }, 5000);
    } catch (error) {
      console.error('İşletme kaydedilirken hata:', error);
      setStepError('İşletme kaydedilemedi: ' + (error as any).message);
      setLoading(false);
    }
  };

  const isLastStep = currentStep === 6;

  return (
    <>
      <AnimatePresence>
        {showSuccessEffect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[999999] pointer-events-none"
          >
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0, rotate: -15, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 12, stiffness: 180, delay: 0.2 }}
                className="relative max-w-lg w-full z-10"
              >
                <div className="relative bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] rounded-[44px] border-2 border-white/30 p-12 text-center shadow-2xl backdrop-blur-xl">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 120, damping: 10 }}
                    className="mx-auto w-28 h-28 rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-500 flex items-center justify-center mb-8 shadow-2xl"
                  >
                    <Check size={56} className="text-white" strokeWidth={4} />
                  </motion.div>
                  <h2 className="text-4xl font-bold text-white mb-3 font-heading">🎉 Hoşgeldiniz! 🎉</h2>
                  <p className="text-xl text-white/90 font-body mb-6 font-semibold">
                    İşletmeniz başarıyla oluşturuldu
                  </p>
                  <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500/30 to-teal-500/30 border-2 border-emerald-400/50">
                    <Sparkles size={20} className="text-emerald-300" />
                    <span className="text-sm font-bold text-emerald-200">Panele yönlendiriliyorsunuz...</span>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-emerald-300 border-t-transparent rounded-full"
                    />
                  </div>
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
          {/* Header */}
          <div className="px-4 sm:px-8 py-2.5 sm:py-3 border-b border-white/[0.08] flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                    <Sparkles size={12} className="text-purple-400" />
                    <span className="text-xs font-semibold text-purple-300">{salon ? 'Düzenle' : 'Yeni'}</span>
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-lg sm:text-xl text-[var(--chrome-white)]">
                      {steps[currentStep - 1].title}
                    </h3>
                    <p className="text-xs text-[var(--muted-lead)]">{steps[currentStep - 1].subtitle}</p>
                  </div>
                </div>
              </div>

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

            <div className="flex items-center gap-1 mt-2">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="relative flex-1">
                    <div
                      className={cn(
                        'h-0.5 rounded-full transition-all duration-500',
                        completedSteps.includes(step.id)
                          ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                          : step.id === currentStep
                          ? 'bg-gradient-to-r from-purple-400 to-pink-400'
                          : 'bg-white/10'
                      )}
                    >
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

          {/* Content */}
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
                    value={{
                      categoryId: formData.categoryId,
                      categoryLabel: formData.categoryLabel,
                      capabilities: formData.capabilities,
                    }}
                    onChange={(value) => updateFormData(value)}
                  />
                )}
                {currentStep === 2 && (
                  <BasicInfo
                    data={{
                      name: formData.name,
                      phone: formData.phone,
                      whatsappNumber: formData.whatsappNumber,
                      email: formData.email,
                      description: formData.description,
                    }}
                    onChange={(data) => updateFormData(data)}
                  />
                )}
                {currentStep === 3 && (
                  <AddressInfo data={formData.address} onChange={(address) => updateFormData({ address })} />
                )}
                {currentStep === 4 && (
                  <MediaUpload
                    data={{
                      logo: formData.logo,
                      coverImage: formData.coverImage,
                      galleryImages: formData.galleryImages,
                      socialMedia: formData.socialMedia,
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
                      depositSettings: formData.depositSettings,
                    }}
                    onChange={(data) => updateFormData(data)}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Adım hatası — artık sessizce ilerlemek yerine kullanıcıyı gerçekten durduruyor */}
            <AnimatePresence>
              {stepError && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mt-3 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5"
                >
                  <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-300">{stepError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Bar */}
            <div className="sticky bottom-0 left-0 right-0 w-full bg-gradient-to-t from-[var(--void)] via-[var(--void)]/98 to-transparent pt-4 pb-8">
              <div className="flex items-center justify-center px-4 pb-4">
                <div className="w-full max-w-lg">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/30 via-pink-600/30 to-purple-600/30 rounded-3xl blur-xl" />

                    <div className="relative flex items-center gap-2.5 px-5 py-3.5 rounded-3xl bg-black/98 backdrop-blur-3xl border-2 border-purple-500/30 shadow-2xl">
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBack();
                        }}
                        disabled={currentStep === 1}
                        whileHover={{ scale: currentStep === 1 ? 1 : 1.05 }}
                        whileTap={{ scale: currentStep === 1 ? 1 : 0.95 }}
                        className={cn(
                          'relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all shrink-0',
                          currentStep === 1
                            ? 'opacity-20 cursor-not-allowed bg-white/5'
                            : 'bg-white/10 hover:bg-white/15 hover:border hover:border-purple-400/50'
                        )}
                      >
                        <ChevronLeft size={22} className="text-white" strokeWidth={2.5} />
                      </motion.button>

                      <div className="flex-1 flex items-center justify-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-white">{currentStep}</span>
                          <span className="text-sm text-white/50">/ {steps.length}</span>
                        </div>
                        <div className="w-px h-5 bg-white/20" />
                        <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                          {Math.round((completedSteps.length / steps.length) * 100)}%
                        </span>
                      </div>

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
                            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                            className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-[length:200%_100%] rounded-2xl"
                          />
                          <ChevronRight size={22} className="relative z-10 text-white" strokeWidth={2.5} />
                        </motion.button>
                      ) : (
                        <motion.button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!loading) handleSubmit();
                          }}
                          disabled={loading}
                          whileHover={{ scale: loading ? 1 : 1.05 }}
                          whileTap={{ scale: loading ? 1 : 0.95 }}
                          className="relative px-6 h-12 rounded-2xl flex items-center justify-center gap-2 overflow-hidden shrink-0 cursor-pointer z-50"
                          style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}
                        >
                          <motion.div
                            animate={!loading ? { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] } : {}}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                            className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 bg-[length:200%_100%]"
                          />
                          <span className="relative z-10 flex items-center gap-2 text-white font-heading font-bold text-base whitespace-nowrap">
                            {loading ? (
                              <>
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
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

      {/* Validation Modal — son güvenlik ağı */}
      <AnimatePresence>
        {showValidationModal && (
          <div className="fixed inset-0 z-[100000] flex items-end sm:items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowValidationModal(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              className="relative w-full sm:max-w-md bg-[var(--void)] sm:rounded-3xl rounded-t-3xl border-t sm:border border-yellow-500/30 shadow-2xl shadow-yellow-500/20 overflow-hidden max-h-[85vh] sm:max-h-[90vh] flex flex-col"
            >
              <div className="relative px-6 py-5 bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10 border-b border-white/[0.08] flex-shrink-0">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center flex-shrink-0">
                    <AlertCircle size={20} className="text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-bold text-lg text-white">Eksik Bilgiler Var</h3>
                    <p className="text-sm text-[var(--muted-lead)] mt-0.5">Zorunlu alanları doldurmanız gerekiyor</p>
                  </div>
                  <button
                    onClick={() => setShowValidationModal(false)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0"
                  >
                    <X size={16} className="text-white" />
                  </button>
                </div>
              </div>

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
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <span className="text-sm font-bold text-yellow-400">{item.step}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white text-sm mb-1.5">{item.title}</h4>
                          <ul className="space-y-1">
                            {item.fields.map((field, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-xs text-[var(--muted-lead)]">
                                <span className="text-yellow-400 flex-shrink-0 mt-0.5">*</span>
                                <span>{field} tamamlanmalı</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <ChevronRight
                          size={16}
                          className="text-yellow-400/60 group-hover:text-yellow-400 group-hover:translate-x-1 transition-all flex-shrink-0"
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-4 p-3 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                  <div className="flex items-start gap-2">
                    <Info size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-300/80">
                      <span className="text-yellow-400 font-bold">*</span> ile işaretli alanlar zorunludur. Yukarıdaki
                      adımlara tıklayarak eksikleri tamamlayabilirsiniz.
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="px-6 py-4 border-t border-white/[0.08] bg-[var(--void)] flex-shrink-0"
                style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))' }}
              >
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
.
.
.
