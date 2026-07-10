# Devuran / Randevia — Çok Sektörlü Rezervasyon Sihirbazı & İşletme Paneli Mimarisi

**Kapsam:** Kuaför, Berber, Güzellik Salonu, Düğün Salonu, Nişan Organizasyonu, Etkinlik Organizasyonu, Bungalov, Otel/Konaklama, Video Prodüksiyon, Catering, Restoran
**Stack:** React 19 + TypeScript + Vite + Tailwind v3 + shadcn/ui + Zustand + Firebase (Firestore + Cloud Functions) + PayTr + Resend

---

## 1. Temel Karar: "11 Ayrı Sihirbaz" Değil, "Tek Motor + Sektör Konfigürasyonu"

En kritik mimari karar burada. Her işletme tipi için ayrı ayrı hardcoded sihirbaz kodlamak kısa vadede hızlı görünür ama şu sorunları doğurur:

- 11 tip × ayrı state management, ayrı validation, ayrı UI = bakım kâbusu
- Yeni bir işletme tipi (örneğin "yat kiralama" veya "masaj salonu") eklemek yeni kod yazmak demek
- Bug fix'ler tek yerde değil 11 yerde tekrarlanır
- "Yıllarca kafa rahatlığı" hedefiyle doğrudan çelişir

**Çözüm: Schema-Driven Dynamic Wizard Engine.** Sihirbazın kendisi sadece bir "yorumlayıcı" (interpreter). Her işletme tipi Firestore'da bir `verticalConfig` dokümanı olarak tanımlanır: hangi adımlar, hangi alanlar, hangi validasyon, hangi fiyatlandırma kuralı, hangi müsaitlik mantığı. Yeni işletme tipi eklemek = yeni kod değil, yeni config.

```
BusinessType (kuaför, düğün salonu, otel...)
      │
      ▼
verticalConfig  ──►  WizardEngine (tek, ortak component ağacı)
      │                     │
      ▼                     ▼
 stepDefinitions[]    render(stepDefinitions[currentStep])
```

Bunu prensipte "headless wizard + step primitive kütüphanesi" olarak kurguluyoruz: aşağıdaki 10 "step primitive" birleştirilerek 11 sektörün tamamı karşılanıyor, sektöre özel olan sadece parametreler ve custom form alanları.

### Ortak Step Primitive'leri

| Primitive | Ne yapar | Kullanan sektörler |
|---|---|---|
| `ServiceSelectionStep` | Hizmet/kategori seçimi | Kuaför, berber, güzellik salonu |
| `StaffSelectionStep` | Uzman/personel seçimi (opsiyonel/zorunlu) | Kuaför, berber, güzellik salonu |
| `DateTimeSlotStep` | Tekil slot (süre bazlı) | Kuaför, berber, restoran, video prodüksiyon (keşif) |
| `DateRangeStep` | Check-in/check-out aralığı | Otel, bungalov |
| `FullDayBlockStep` | Tüm gün/gece blok rezervasyonu, aylık takvim görünümü | Düğün salonu, nişan, etkinlik |
| `CapacityStep` | Kişi sayısı | Düğün, otel, catering, restoran |
| `PackageSelectionStep` | Paket/menü seçimi | Düğün, otel, catering, video prodüksiyon |
| `AddOnSelectionStep` | Ek hizmet / upsell | Hepsi |
| `CustomFormStep` | Sektöre özel dinamik alanlar (JSON şemadan üretilir) | Hepsi |
| `ContractStep` | Sözleşme + e-imza onayı | Düğün, nişan, etkinlik, video prodüksiyon |
| `PaymentStep` | Kapora/tam ödeme (PayTr) | Hepsi (config'e göre zorunlu/opsiyonel) |
| `ReviewConfirmStep` | Özet + onay | Hepsi |

---

## 2. Sektör Bazlı Sihirbaz Akışları

### 2.1 Kuaför / Berber / Güzellik Salonu
```
ServiceSelection → StaffSelection(opsiyonel) → DateTimeSlot → AddOnSelection → PaymentStep(opsiyonel kapora) → Confirm
```
- Slot süresi, seçilen hizmetlerin toplam süresine göre **otomatik hesaplanır** (2 hizmet seçildiyse 45+30 dk gibi).
- Personel seçilmezse "ilk müsait uzman" otomatik atanır — bu, doluluk oranını yükseltmek için önemli bir akıllı özellik.
- Akıllı öneri: "Bu saatte X uzmanı müsait değil ama 14:30'da müsait, ister misiniz?"

### 2.2 Düğün Salonu / Nişan Organizasyonu / Etkinlik Organizasyonu
```
EventTypeSelection → FullDayBlockStep → CapacityStep → PackageSelection(menü) → AddOnSelection → CustomForm(tema/özel istek) → ContractStep → PaymentStep(kapora %) → Confirm
```
- Takvim görünümü ay bazlı olmalı, dolu/boş/opsiyonlu (tercih bekleyen) tarihler renk kodlu gösterilmeli.
- Kapora yüzdesi ve ödeme takvimi (örn. %20 rezervasyonda, %30 3 ay kala, kalan gün önce) **config'den** yönetilmeli, koda gömülmemeli.
- Sözleşme PDF otomatik üretilip e-imza ile onaylanmalı (PDF üretimi Cloud Function'da).

### 2.3 Bungalov / Otel / Konaklama
```
UnitTypeSelection → DateRangeStep → CapacityStep → AddOnSelection(kahvaltı, transfer) → PaymentStep(gece bazlı + sezon çarpanı) → Confirm
```
- Gece hesaplaması ve sezonluk fiyat çarpanı (yüksek sezon/düşük sezon/hafta sonu) motoru gerekli.
- Minimum konaklama gecesi kuralı (örn. yaz aylarında min 2 gece) config'den tanımlanabilir olmalı.
- İptal politikası (esnek/orta/katı) her ünite için ayrı tanımlanabilmeli.

### 2.4 Video Prodüksiyon
Bu sektör diğerlerinden yapısal olarak farklı: doğrudan "randevu" değil, **iki fazlı bir satış hunisi**.
```
Faz 1: ProjectTypeSelection → DateTimeSlot(keşif görüşmesi) → CustomForm(proje detayı, referans görsel) → Confirm
Faz 2 (görüşme sonrası, panelden tetiklenir): Teklif oluşturma → PackageSelection → ContractStep → PaymentStep(avans)
```
- Faz 2, işletme panelinden manuel tetiklenen bir "teklif gönder" akışı olarak modellenmeli; tamamen otomatik bir sihirbaza sıkıştırılmaya çalışılırsa video prodüksiyon gibi özelleştirmeye dayalı bir hizmet için yapay ve kullanışsız olur.

### 2.5 Catering
```
EventLinkStep(opsiyonel: mevcut düğün/etkinlik rezervasyonuna bağla) → PackageSelection(menü) → CapacityStep → CustomForm(alerji/özel istek) → DateTimeSlot(teslimat/servis saati) → PaymentStep → Confirm
```
- `EventLinkStep` platformun en önemli farklılaştırıcı özelliklerinden biri — aşağıda ayrı başlık.

### 2.6 Restoran
```
PartySize → DateTimeSlot(masa, süre bazlı turnover) → TablePreference(opsiyonel) → CustomForm(özel gün) → Confirm
```
- Genelde ödeme yok; özel gün/grup masalarında opsiyonel kapora.
- No-show oranı en yüksek sektör olduğundan SMS/WhatsApp onay teyidi ve otomatik hatırlatma burada kritik.

---

## 3. Rakiplerden Ayıran Asıl Fark: Cross-Vertical Bundling ("Etkinlik Orkestrasyon Motoru")

Türkiye'de ve dünyada randevu/rezervasyon platformlarının neredeyse tamamı **tek sektöre** odaklıdır (sadece kuaför, sadece otel, sadece restoran). Devuran'ın mimari olarak öngörülen en güçlü farkı şu olabilir:

> Bir kullanıcı düğün salonu rezervasyonu yaparken, aynı ekosistemden **catering**, **video prodüksiyon** ve **organizasyon** hizmetlerini tek akış içinde ekleyebilsin.

Teknik olarak bu, `EventLinkStep` ve `bundleId` alanı ile mümkün: bir `bookings` dokümanı, isteğe bağlı olarak bir `parentBookingId` (ana etkinlik rezervasyonu) ile ilişkilendirilir. Panelde işletme sahipleri "bu tarihte bir düğün var, catering teklifi gönder" gibi bildirimler alabilir. Bu, platformu sadece bir "randevu alma aracı" olmaktan çıkarıp bir **etkinlik ekosistemi**ne dönüştürür — bu tarz bir konumlandırma gerçekten nadir.

---

## 4. Firestore Veri Modeli (Öneri)

```typescript
// businesses/{businessId}
interface Business {
  id: string;
  ownerId: string;
  type: BusinessType; // 'hairdresser' | 'weddingHall' | 'hotel' | 'catering' | ...
  name: string;
  configId: string;          // → verticalConfigs/{configId}
  staff: string[];           // staff doküman referansları
  status: 'active' | 'paused' | 'onboarding';
  paymentSettings: {
    paytrMerchantId?: string;
    depositPolicy?: DepositPolicy;
  };
  createdAt: Timestamp;
}

// verticalConfigs/{configId}  — sihirbazı besleyen konfigürasyon
interface VerticalConfig {
  businessType: BusinessType;
  steps: StepDefinition[];       // sıralı adım listesi
  customFields: CustomFieldSchema[]; // CustomFormStep içeriği
  pricingRules: PricingRule[];
  availabilityRules: AvailabilityRule[];
  contractTemplateId?: string;
  version: number;                // config versiyonlama — geriye dönük uyumluluk için şart
}

// bookings/{bookingId}
interface Booking {
  id: string;
  businessId: string;
  customerId: string;
  parentBookingId?: string;   // cross-vertical bundling için
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'noShow';
  slot: { start: Timestamp; end: Timestamp } | { checkIn: Timestamp; checkOut: Timestamp };
  selections: Record<string, unknown>; // her step'in çıktısı (service, package, addOns...)
  payment: {
    status: 'unpaid' | 'depositPaid' | 'paidInFull';
    amount: number;
    depositAmount?: number;
    paytrTransactionId?: string;
    idempotencyKey: string;    // çift ödeme/çift rezervasyon önleme
  };
  createdAt: Timestamp;
  auditLog: AuditEntry[];       // her durum değişikliği loglanır
}

// availabilitySlots/{businessId}/{date} — gerçek zamanlı kilitleme için
interface AvailabilitySlotDoc {
  date: string;             // YYYY-MM-DD
  slots: {
    start: string;
    end: string;
    capacity: number;
    booked: number;
    lockedBy?: string;      // transaction sırasında geçici kilit
    lockExpiresAt?: Timestamp;
  }[];
}
```

**Neden `availabilitySlots` ayrı bir koleksiyon:** Çifte rezervasyon (double booking) en kritik risk. Firestore transaction ile `availabilitySlots` dokümanı okunup, `booked < capacity` kontrolü yapılıp aynı transaction içinde hem slot güncelleniyor hem `booking` dokümanı oluşturuluyor. Bu iki yazma **atomik** olmalı — yoksa yoğun saatlerde iki kullanıcı aynı slotu alabilir.

```typescript
// Cloud Function - transactional booking creation (özet mantık)
await db.runTransaction(async (tx) => {
  const slotRef = db.doc(`availabilitySlots/${businessId}/dates/${date}`);
  const slotDoc = await tx.get(slotRef);
  const slot = slotDoc.data().slots.find(s => s.start === requestedStart);

  if (!slot || slot.booked >= slot.capacity) {
    throw new HttpsError('failed-precondition', 'Slot artık müsait değil');
  }

  tx.update(slotRef, { /* booked +1 */ });
  tx.set(db.doc(`bookings/${newBookingId}`), bookingPayload);
});
```

---

## 5. İşletme Paneli Mimarisi (Multi-Tenant)

Her işletme kendi "workspace"ine sahip olur ama kod tabanı tektir — panel de vertical config'e göre hangi modülleri göstereceğine karar verir.

**Ortak modüller (her sektörde var):**
- Takvim & müsaitlik yönetimi
- Rezervasyon listesi (durum filtreleri: bekleyen/onaylı/iptal/tamamlandı)
- Fiyatlandırma & kapora kuralları
- Bildirim ayarları (Resend e-posta şablonları, SMS/WhatsApp entegrasyonu)
- Raporlama (doluluk oranı, gelir, iptal oranı, no-show oranı)
- Ödeme ayarları (PayTr)
- Sözleşme şablon yönetimi

**Sektöre özel modüller (config'e göre gösterilir/gizlenir):**
- Personel/uzman yönetimi → kuaför, berber, güzellik salonu
- Oda/ünite yönetimi + sezon fiyatlandırma → otel, bungalov
- Menü/paket yönetimi → düğün, catering
- Masa düzeni yönetimi → restoran
- Teklif/proje yönetimi → video prodüksiyon

**Rol bazlı erişim:** `owner` (tam yetki), `manager` (rezervasyon + raporlama), `staff` (sadece kendi takvimi). Firestore güvenlik kuralları `business.staff` alanındaki custom claim'lere göre yazılmalı.

---

## 6. Akıllı (Smart) Katman — Yıllarca Rekabet Avantajı Sağlayacak Özellikler

| Özellik | Ne işe yarar |
|---|---|
| **Akıllı slot doldurma** | İptal olan bir slotu bekleme listesindeki en uygun müşteriye otomatik önerir |
| **No-show risk skoru** | Geçmiş verilere göre (iptal geçmişi, rezervasyon zamanlaması) müşteri bazlı risk skoru; yüksek riskli rezervasyonlarda ekstra teyit/ön ödeme istenir |
| **Dinamik fiyatlandırma** | Sezon, gün, doluluk oranına göre otomatik fiyat ayarı (özellikle otel/bungalov) |
| **Otomatik hatırlatma zinciri** | 24 saat önce, 2 saat önce kademeli hatırlatma (e-posta + SMS/WhatsApp) |
| **Cross-sell öneri motoru** | Düğün salonu rezervasyonunda catering/video prodüksiyon önerisi (bkz. Bölüm 3) |
| **Bekleme listesi otomasyonu** | İptal → otomatik sıradaki adaya bildirim → onaylamazsa sıradakine geç |

Bu katmanın hepsinin "AI" diye pazarlanan kara kutular olması gerekmiyor — çoğu kural bazlı (rule-based) motorlarla, bazıları basit istatistiksel skorlamayla yapılabilir. Gerçek makine öğrenmesi (örn. talep tahmini) ileride ayrı bir faz olarak eklenebilir; başlangıçta kural motoru yeterli ve çok daha az risklidir.

---

## 7. Güvenilirlik ve Hata Yönetimi

- **Çifte rezervasyon:** Firestore transaction + slot kilitleme (Bölüm 4).
- **Ödeme idempotency:** Her ödeme isteğinde `idempotencyKey` üretilir; PayTr webhook'u aynı key ile iki kez gelirse ikinci işlem yok sayılır.
- **Cloud Functions retry stratejisi:** Kritik fonksiyonlar (ödeme onayı, e-posta gönderimi) başarısız olursa Cloud Tasks ile retry + dead-letter queue'ya düşürme.
- **Audit log:** Her booking durum değişikliği (`pending → confirmed → cancelled`) kim tarafından, ne zaman yapıldığı bilgisiyle loglanmalı — anlaşmazlık durumunda kanıt.
- **Yedekleme:** Firestore günlük export (Cloud Scheduler + Firestore export API) + kritik koleksiyonlar için ayrı arşiv.
- **Rate limiting:** Rezervasyon oluşturma endpoint'i App Check + Cloud Functions rate limiting ile bot/kötüye kullanım korumalı olmalı.

---

## 8. Uzun Vadeli Sürdürülebilirlik

- **Config versiyonlama:** `verticalConfig.version` alanı sayesinde, aktif rezervasyonlar eski config versiyonuyla, yeni rezervasyonlar yeni versiyonla çalışabilir — geriye dönük kırılma olmaz.
- **Yeni sektör ekleme süreci:** Yeni bir işletme tipi (örn. "yat kiralama") eklemek, kod değişikliği değil, yeni bir `verticalConfig` dokümanı + gerekirse 1-2 yeni custom field tipi demek.
- **Test stratejisi:** Her vertical config için otomatik "config validation" testi (zorunlu alanlar eksik mi, adım sırası mantıklı mı) + kritik akışlar için e2e test.

---

## 9. Önerilen Faz Planı

1. **Faz 1 (temel motor):** Wizard Engine + 3 pilot sektör (kuaför, düğün salonu, otel) — bu üçü zaten birbirinden en uzak akışlara sahip, motor bunları karşılarsa geri kalan 8 sektör büyük ölçüde konfigürasyon işi olur.
2. **Faz 2:** Kalan sektörler (berber, güzellik salonu, nişan, etkinlik, bungalov, catering, restoran, video prodüksiyon) config olarak eklenir.
3. **Faz 3:** Cross-vertical bundling (Etkinlik Orkestrasyon Motoru) + akıllı katman (no-show skoru, dinamik fiyatlandırma, bekleme listesi otomasyonu).
4. **Faz 4:** Raporlama/analytics derinleştirme, ileri düzey talep tahmini.

---

## Notlar

Bu doküman bir **mimari öneri** niteliğindedir; mevcut kod tabanınızdaki (React 19/TS/Vite/Zustand/Firebase) yapıya oturacak şekilde tasarlandı. Herhangi bir bölümü (örneğin belirli bir sektörün sihirbaz akışını, Firestore güvenlik kurallarını, veya PayTr entegrasyon detaylarını) kod seviyesinde derinleştirmemi ister misiniz?