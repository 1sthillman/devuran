Bu projeyi derinlemesine inceleyeceğim - repoyu klonlayıp, mimariyi, iş mantığını ve özellikle "wizard" işletme oluşturma akışını satır satır analiz edeceğim. Başlıyorum.Repo indirildi, 1020 dosya var. Genel yapıyı görelim.Kök dizinde 300'den fazla "fix/analiz" .md dosyası olması başlı başına bir bulgu. Şimdi gerçek kaynak koduna, özellikle `src/` yapısına ve wizard mantığına inelim.İlk mantık hatasını buldum: `salonsService` import edilmiş ama hiç kullanılmıyor; "işletme var mı" kontrolü gerçek veritabanı sorgusu yapmadan sadece local `user.salonId` alanına bakıyor. Şimdi gerçek wizard motoruna bakalım.Kritik bir mimari sorun buldum: "Hazır kategoriden seç" (preset) seçilse bile wizard TÜM alt soruları (booking model, süre yapısı, personel, konum, ürün, gelişmiş ayarlar) yeniden soruyor. Bunun preset'i otomatik doldurup doldurmadığını doğrulayayım.Kritik bir bulgu: `salonsService.create` işletme oluşturuyor ama kullanıcının profiline `salonId` yazmıyor. "1 işletme limiti" gerçekten uygulanıyor mu, tüm zinciri takip edeyim.Çok önemli bir bulgu: Projede **iki farklı, birbiriyle çakışan "işletme oluşturma" mekanizması** var. `OwnerDashboard.tsx` içine gömülü ikinci bir akışı inceleyelim.İncelemeyi tamamladım. Kodun kalbine indim ve wizard mantığında ciddi, birbirini besleyen yapısal sorunlar buldum. Aşağıda kanıtlı, dosya/satır referanslı kapsamlı mühendislik raporu var.

---

# DEVURAN — İşletme Oluşturma Wizard'ı: Kapsamlı Mühendislik Analizi

## Genel İzlenim

Proje kök dizininde **300'den fazla** `*_FIX.md`, `*_TAMAMLANDI.md`, `*_ANALIZ.md` dosyası var. Bu tek başına önemli bir sinyal: geliştirme süreci "sorun çık → yama yap → belgele → bir sonraki soruna geç" döngüsüyle ilerlemiş, kök nedenler yerine semptomlar düzeltilmiş. Wizard tarafında bunun somut sonucunu buldum: **aynı işi yapan iki bağımsız, birbirinden habersiz sistem** kod tabanında yan yana yaşıyor. Bu, sorduğunuz "mantıklı mı, doğru çalışıyor mu" sorusunun cevabını büyük ölçüde belirliyor.

---

## 🔴 BULGU #1 — En Kritik: İşletme oluşturma akışı uçtan uca kırık (iki paralel wizard)

Projede işletme oluşturmak için **iki farklı `BusinessSetupWizard` bileşeni** var, farklı klasörlerde, aynı isimle:

| | `src/components/business/BusinessSetupWizard.tsx` | `src/components/dashboard/BusinessSetupWizard.tsx` |
|---|---|---|
| Nerede açılır | `/business/setup` route'u (ana nav'daki "İşletme Oluştur" butonu) | `OwnerDashboard` içinde, salon yoksa otomatik |
| Adım sayısı | 8 adım (soru-cevap motoru) | 5 adım (form tabanlı) |
| Kategori kaynağı | `BUSINESS_PRESETS` (16 preset, id: `hairdresser`, `restaurant`...) | `CATEGORY_PRESETS` (17 preset, id: `kuafor-berber`, `restoran-kafe`...) |
| Salon kaydı sonrası | **`user.salonId` YAZILMIYOR** | `authService.updateUserProfile(uid, {salonId})` çağrılıyor (doğru) |

Zinciri adım adım takip ettim:

1. Kullanıcı nav menüsünden **"İşletme Oluştur"** butonuna basar → `/business/setup` → `business/BusinessSetupWizard.tsx` açılır.
2. 8 adımı tamamlar, "Oluştur" der. `handleSubmit`:
```tsx
const salonId = await salonsService.create(salonData);   // salon oluşuyor
sessionStorage.removeItem('businessSetup');
navigate('/dashboard');                                    // salonId değişkeni hiç kullanılmıyor!
```
`salonId` değişkeni set ediliyor ama **hiçbir yere yazılmıyor** — dead variable.

3. `/dashboard` → `OwnerDashboard` açılır. Orada:
```tsx
{!salon || !user?.salonId ? ( ... "işletmen yok" boş ekranı ... ) : ( ... )}
```
`user.salonId` hâlâ boş olduğu için (hiç yazılmadı) kullanıcı **"işletmeniz yok"** ekranını görür — az önce oluşturduğu işletme hiçbir yerde görünmez.

4. Buradan tekrar "İşletme Oluştur" derse bu sefer **ikinci, farklı** wizard (`dashboard/BusinessSetupWizard.tsx`) açılır. Kullanıcı isim, telefon, adres, görsel, çalışma saatleri gibi bilgileri **baştan** girer.

5. Bu ikinci wizard'ın `onSave`'i (`OwnerDashboard.tsx:970-985`) `salonsService.create()`'i **tekrar** çağırır — yani veritabanına **ikinci bir salon dokümanı** daha yazılır — ve bu sefer `salonId` doğru şekilde kullanıcı profiline yazılır, sayfa hard-reload olur, sistem artık çalışır.

**Sonuç:** Kullanıcı aynı bilgileri iki kez girmek zorunda kalıyor, ve veritabanında sahipsiz, hiçbir arayüzden erişilemeyen bir "yetim salon" kaydı birikiyor (adım 2'de oluşan). Bu, yeni kayıt olan her işletme sahibi için tekrarlayan bir üretim hatası olmalı — kritik bulgu.

**Kök neden:** `business/BusinessSetupWizard.tsx`'in `handleSubmit`'ine tek satır eksik:
```tsx
await authService.updateUserProfile(user.uid, { salonId });
```
Ama tek satırlık yama yeterli değil — asıl soru şu: **bu iki wizard neden var?** Muhtemelen biri ("akıllı" 8 adımlı, capability-türetme motoru) yeni nesil mimari olarak yazılmış, diğeri (dashboard içindeki) eski/legacy akış, ve geçiş hiç tamamlanmamış.

---

## 🔴 BULGU #2 — "Hazır kategori seç" özelliği kullanıcıya yanlış vaat veriyor, işlevsiz

`business/BusinessSetupWizard.tsx` akışında, Adım 2'de kullanıcı "Hazır kategorilerden seç" deyip örneğin **Restoran**'ı seçtiğinde ekranda şu mesaj çıkıyor (`SmartRecommendations.tsx:83-88`):

> **"Hızlı Kurulum — Seçtiğiniz kategori için otomatik ayarlar uygulanacak."**

Gerçekte olan: Adım 3'ten (Çalışma Modeli) itibaren **tüm 6 adım** (booking model, süre yapısı, personel/masa, konum, ürün/teslimat, ek özellikler) yeniden, **boştan** soruluyor. `BusinessSetupQuestion.tsx` hiçbir yerde preset değerine göre pre-fill yapmıyor; `updateAnswer` (useBusinessSetup.ts) sadece kullanıcının elle verdiği cevapları kaydediyor. Restoran seçen kullanıcı yine de "Randevu mu, Rezervasyon mu, Sipariş mi?" gibi soruları elle işaretlemek zorunda — preset'in tek gerçek etkisi, `deriveCapabilitiesFromAnswers`'da başlangıç objesini doldurup sonra **kullanıcı cevaplarıyla tamamen ezilmesi** (businessSetupEngine.ts:122-144). Yani "hazır kategori" pratikte kategori adı/ikonundan başka hiçbir şey belirlemiyor.

**Bu tasarım kendi iç mantığıyla çelişiyor.** "Hızlı kurulum" vaadi verip vermemek arasında seçim yapılmalı: ya preset seçilince ilgili sorular otomatik dolup sadece onay/düzenleme için gösterilmeli, ya da bu adımlar preset seçildiğinde tamamen atlanmalı.

---

## 🔴 BULGU #3 — Paylaşılan mutable state: preset kataloğu çalışma zamanında bozuluyor

`businessPresets.ts`:
```ts
export function getPresetCapabilities(presetId: string): BusinessCapabilities | null {
  return BUSINESS_PRESETS[presetId] || null;   // ← referans dönüyor, deep clone yok
}
```

`businessSetupEngine.ts`:
```ts
capabilities = { ...presetCapabilities };   // shallow copy — bookingModels array'i AYNI referans
...
if (capabilities.hasTables && !capabilities.bookingModels.includes('reservation')) {
  capabilities.bookingModels.push('reservation');   // ← modül-seviyesi sabiti mutasyona uğratıyor
}
```

`wedding_hall` preset'i tam bu senaryoya giriyor: `hasTables: true`, `bookingModels: ['rental']` (reservation yok). Herhangi bir kullanıcı "Düğün Salonu" preset'ini seçtiği an, `BUSINESS_PRESETS.wedding_hall.bookingModels` **kalıcı olarak** `['rental', 'reservation']`'a dönüşüyor — sayfa yenilenene kadar bellekte kalan, global, kullanıcılar arası paylaşılan bir yan etki. Klasik JavaScript referans/mutasyon hatası; ilk kullanımdan sonra preset kataloğunun davranışı öngörülemez hale geliyor.

**Çözüm basit:** `getPresetCapabilities` deep clone (`structuredClone` veya `JSON.parse(JSON.stringify(...))`) döndürmeli.

---

## 🔴 BULGU #4 — "1 kullanıcı 1 işletme" kuralı sadece kozmetik, backend'de yok

`BusinessSetup.tsx` başlığı "1 İŞLETME LİMİTİ" diyor ve kontrolü şöyle yapıyor:
```tsx
setHasSalon(!!user.salonId);   // sadece client-side, cache'lenmiş auth state'e bakıyor
```
`salonsService` import edilmiş ama gerçek bir veritabanı sorgusu (örn. "bu ownerId'ye ait salon var mı?") hiç yapılmıyor — import edilip kullanılmayan bir servis.

Daha önemlisi, `firestore.rules`:
```
allow create: if request.auth != null &&
                 request.resource.data.ownerId == request.auth.uid;
```
Bu kural sadece "yazan kişi kendini owner olarak işaretlemiş mi" diye bakıyor — **"bu kullanıcının zaten bir salonu var mı"** kontrolü Firestore Rules seviyesinde yok. Bulgu #1'de gösterdiğim gibi `salonId` senkronizasyonu zaten kırık olduğundan, bir kullanıcı pratikte sınırsız sayıda salon oluşturabilir. "1 işletme limiti" bir güvence değil, sadece bir UI mesajı.

---

## 🟠 BULGU #5 — İki paralel, birbiriyle uyumsuz kategori taksonomisi

`src/config/businessPresets.ts` → `BUSINESS_PRESETS`: `hairdresser`, `barber`, `restaurant`, `cafe`, `hotel`...
`src/types/businessCapabilities.ts` → `CATEGORY_PRESETS`: `kuafor-berber`, `restoran-kafe`, `otel-pansiyon`...

Aynı `BusinessCapabilities` tipini paylaşıyorlar ama **ID şemaları tamamen farklı**. `dashboard/BusinessSetupWizard.tsx` içindeki `resolveInitialCategory` fonksiyonu, düzenleme moduna girildiğinde `getPresetById(salon.category)` ile eşleştirme yapmaya çalışıyor:
```ts
const legacyPreset = salon?.category ? getPresetById(salon.category) : undefined;
```
Eğer salon `business/BusinessSetupWizard` (ilk sistem) ile `category: 'restaurant'` olarak oluşturulduysa, `getPresetById('restaurant')` **CATEGORY_PRESETS içinde bu ID'yi bulamaz** (orada `'restoran-kafe'` var), sessizce `DEFAULT_CAPABILITIES`'e düşer. Yani bir wizard'la oluşturulan işletmeyi diğer wizard'la düzenlemeye çalışmak, kategoriye özgü tüm ayarların sessizce sıfırlanmasına yol açabilir.

---

## 🟠 BULGU #6 — Submit'te validasyon hatası kullanıcıya gösterilmiyor

```tsx
const capValidation = validateCapabilities(derivedCapabilities!);
if (!capValidation.isValid) {
  addToast('Seçimlerinizde tutarsızlıklar var', 'error');
  console.error('Capability validation errors:', capValidation.errors);  // sadece console'a
  return;
}
```
Kullanıcı 8 adımı doldurup "Oluştur"a bastığında, örneğin hem "Fiziksel mekanım yok" hem "Müşteriye gitmiyorum" derse (`validateCapabilities` bunu hata sayıyor — businessSetupValidator.ts:75-77), gördüğü tek şey generic bir toast. Hangi adımda neyi düzeltmesi gerektiğine dair hiçbir yönlendirme yok; hatalar sadece geliştirici konsoluna yazılıyor. Kullanıcı kilitlenmiş hissedecek.

Ayrıca `businessSetupEngine.ts` içindeki `fillMissingCapabilities`, "masa var ama reservation yok" durumunu **otomatik düzeltiyor** (push ile ekliyor); ama `businessSetupValidator.ts` aynı durumu hâlâ bir **uyarı koşulu** olarak kontrol ediyor — engine zaten düzelttiği için bu uyarı asla tetiklenmeyecek. İki modül birbirinin ne yaptığından habersiz yazılmış.

---

## 🟡 BULGU #7 — Geri gidip cevap değiştirme, ileri adımların "tamamlandı" damgasını geçersiz kılmıyor

```ts
const goToStep = useCallback((stepId: number) => {
  if (state.completedSteps.includes(stepId - 1) || stepId === 1) {
    setState(prev => ({ ...prev, currentStep: stepId }));
  }
}, [state.completedSteps]);
```
Kullanıcı Adım 5'teyken Adım 2'ye dönüp kategoriyi değiştirirse, `cleanDependentAnswers` yalnızca **doğrudan** bağımlı soruların cevabını temizliyor (tek seviye — zincirleme/transitive bağımlılıkları temizlemiyor). Adım 3-4'ün `completedSteps` listesindeki "tamamlandı" işareti silinmiyor, dolayısıyla kullanıcı `goToStep` ile bu adımlara atlarsa artık geçersiz olabilecek eski cevaplarla karşılaşabilir, sistem bunları hâlâ "tamam" sayar.

---

## 🟡 BULGU #8 — Controlled input, harici state güncellemesini yansıtmıyor

```tsx
const [localValue, setLocalValue] = useState(value || '');
```
`BusinessSetupQuestion.tsx`'te text/number tipi sorularda `localValue` sadece mount anında `value` prop'undan alınıyor, sonraki prop değişikliklerini izleyen bir `useEffect` yok. sessionStorage'dan kurtarma (`useBusinessSetup.ts:195-206`) aynı adımdayken tetiklenirse (kullanıcı hiç ileri gitmeden sayfa yenilerse), kurtarılan metin state'e yazılır ama input görsel olarak **boş kalır** — kullanıcı verisinin kaybolduğunu sanıp yeniden yazabilir.

---

## 🟡 BULGU #9 — sessionStorage taslağı kullanıcıya özel değil

```ts
sessionStorage.setItem('businessSetup', JSON.stringify(state));
```
Anahtar sabit (`'businessSetup'`), kullanıcı ID'siyle namespace'lenmemiş. Aynı tarayıcı sekmesinde (paylaşılan bilgisayar, test senaryosu, hızlı hesap değişimi) farklı bir kullanıcı oturum açarsa, önceki kullanıcının yarım kalmış wizard taslağı yeni kullanıcının önüne otomatik yüklenir.

---

## 🟢 Küçük ama gerçek bulgular

- **Enter tuşu, textarea içinde de wizard'ı ileri götürüyor** — `handleKeyDown` yalnızca `Backspace` için `target.tagName` kontrolü yapıyor, `Enter` için yapmıyor. Açıklama metni giren kullanıcı yeni satır yerine yanlışlıkla sonraki adıma geçebilir.
- **Ölü kod / kafa karışıklığı riski:** Kök dizinde `WizardBuilder.tsx`, `DynamicWizardRunner.tsx`, `wizardSchemaService.ts`, `wizardSchema.ts` — `src/` içindeki isimdeş dosyalarla neredeyse birebir aynı (diff ~0-10 satır) ama **hiçbir yerden import edilmiyor**. Yeni bir geliştirici bunları "gerçek" sanıp üzerinde çalışma riski taşıyor.
- **Üçüncü bir wizard motoru daha var:** `src/components/wizard/WizardEngine.tsx` — sadece `WizardTestPage.tsx` tarafından kullanılıyor, üretim akışının hiçbir yerinde yok. Muhtemelen terk edilmiş bir prototip.
- **Güvenlik yan bulgusu (talep dışı ama önemli):** `salonsService.getAll()` **tüm salonları** Firestore'dan çekip filtrelemeyi (aktif abonelik, admin yetkisi) **client tarafında** yapıyor; süper admin e-postaları da client kodunda hardcoded. Sunucu zaten tüm veriyi gönderdiği için, `isAdmin` kontrolü sadece UI'yı gizliyor, veriyi korumuyor.

---

## Öncelik Sıralı Eylem Planı

| # | Sorun | Etki | Aciliyet |
|---|---|---|---|
| 1 | `business/BusinessSetupWizard` submit'inde `salonId` kullanıcı profiline yazılmıyor | Her yeni işletme kaydı için tekrarlayan hata, çift veri girişi, yetim kayıtlar | **Acil** |
| 2 | İki paralel wizard/preset sisteminden birine karar verip diğerini kaldırmak | Mimari tutarlılık, bakım yükü | **Acil** |
| 3 | `getPresetCapabilities` deep-clone yapmalı | Sessiz, kalıcı veri bozulması | **Acil** |
| 4 | Firestore Rules'a "kullanıcının zaten salonu var mı" kontrolü eklemek (örn. transaction ile) | Gerçek veri bütünlüğü garantisi | Yüksek |
| 5 | Preset seçilince ilgili soruları otomatik doldurmak ya da o adımları atlamak | Wizard'ın vaat ettiği "hızlı kurulum"u gerçek kılmak | Yüksek |
| 6 | Validasyon hatalarını ilgili adım/soru referansıyla kullanıcıya göstermek | UX, destek yükünü azaltma | Orta |
| 7 | `cleanDependentAnswers`'ı transitive hale getirmek, `completedSteps`'i cevap değişince geçersiz kılmak | Veri tutarlılığı | Orta |
| 8 | Kök dizindeki 300+ doküman ve ölü kod kopyalarını temizlemek/arşivlemek | Kod tabanı okunabilirliği, onboarding | Düşük ama etkisi kümülatif |

İstersen bir sonraki adımda bunlardan **1-3 numaralı acil maddeleri** ben doğrudan koda uygulayıp (salonId senkronizasyonunu düzeltme, deep-clone fix'i, ve iki wizard'dan hangisinin kalacağına karar verme) çalışır hale getirebilirim — hangisiyle başlamamı istersin?