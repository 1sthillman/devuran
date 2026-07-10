Kodları inceledim — birden fazla dosyada gerçek sorunlar var. Kritiklik sırasına göre özetliyorum, sonra "nasıl olmalı" kısmını veriyorum.

## 🔴 Kritik Sorunlar

**1. Her keystroke'ta Firestore'a yazma (Settings sekmesi)**
`OwnerDashboard.tsx`'de `minOrderDays`, `advanceBookingDays`, `cancellationHours` gibi input'ların `onChange`'i doğrudan `salonsService.update()` + `loadData()` çağırıyor:

```tsx
onChange={async (e) => {
  const value = parseInt(e.target.value) || 0;
  await salonsService.update(salon.id, { settings: {...} });
  await loadData();
}}
```

Kullanıcı "24" yazarken 2 kere network isteği + tüm dashboard verisinin yeniden çekilmesi tetikleniyor. Hem quota israfı hem de yazarken ekranın "reload" hissi vermesi (loading flicker) ciddi bir UX problemi.

**2. `BusinessSetupWizard` üç kez render ediliyor**
Aynı modal, aynı `onSave` mantığıyla üç ayrı yerde tanımlı (early return, "salon yok" bloğu, ana return sonunda). Birini güncelleyip diğerini unutmak çok kolay — klasik kopyala-yapıştır bug kaynağı.

**3. Validasyon gerçekte hiçbir şeyi engellemiyor**
```tsx
const handleNext = () => {
  if (validateStep(currentStep) && !completedSteps.includes(currentStep)) {
    setCompletedSteps([...completedSteps, currentStep]);
  }
  // Her durumda ileri git (validation olmadan)
  if (currentStep < 6) setCurrentStep(currentStep + 1);
};
```
Kullanıcı tüm adımları boş geçebiliyor, hata ancak "Tamamla"ya basınca modal ile çıkıyor. Adım adım anlık geri bildirim yok → kötü UX, kullanıcı nerede hata yaptığını en sona kadar bilmiyor.

**4. Türkçe karakterlerle slug üretimi bozuk**
```tsx
slug: formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
```
"Güzellik Salonu" → ü, ğ gibi karakterler direkt silinir, "gzellik-salonu" gibi anlamsız/çakışan slug'lar oluşur. Ayrıca aynı isimde iki işletme olursa slug çakışması kontrolü yok.

**5. `ownerId` mantığı hatalı**
```tsx
if (!salon && !salonData.ownerId) {
  salonData.ownerId = salon?.ownerId || ''; // salon zaten yok, bu her zaman ''
}
```
Bu satır pratikte hep boş string atıyor; `ownerId` doğru şekilde `user.uid`'den gelmeli.

## 🟠 Orta Seviye Sorunlar

- **370'e yakın `motion.div`** ile yapılan konfeti animasyonu (200 + 60 + 60 + 50 parçacık) — mobilde ciddi performans yükü. `canvas-confetti` gibi tek canvas üzerinde çalışan bir kütüphane çok daha hafif olur.
- **`window.location.href` ile tam sayfa yenileme** birkaç yerde kullanılmış — SPA'nın avantajlarını (state korunması, hız) sıfırlıyor. `useNavigate()` (react-router) kullanılmalı.
- **`alert()` ve `console.log` üretim kodunda kalmış** — proje zaten `toast` (sonner) ve `addToast` kullanıyor ama tutarsız: bazı yerlerde `alert`, bazı yerlerde toast. İkisinden birine sabitlenmeli, console.log'lar temizlenmeli.
- **Restoran tablo→hizmet migration'ı `loadData()` içine gömülü** — her dashboard açılışında koşullu olarak yazma işlemi yapıyor. Bu tür tek seferlik migration'lar client-side'da her yüklemede değil, backend/cloud function'da bir kereye mahsus çalışmalı.
- **`appointments` state'i `reservations`'tan manuel map'leniyor** — iki paralel veri modeli (`reservations` + türetilmiş `appointments`) kod okunabilirliğini zorlaştırıyor; sadece `reservations` üzerinden gidilebilir.
- **z-index'ler her yerde magic number** (`z-[99999]`, `z-[100000]`, `z-[9998]`, `z-[999999]`) — merkezi bir z-index skalası (CSS custom property ya da Tailwind config'de) olmalı, yoksa modal üstüne modal açılınca öngörülemez sıralama sorunları çıkar.
- **`OwnerDashboard.tsx` tek dosyada her şeyi yapıyor** (overview, appointments, services, staff, settings, analytics...) — 1700+ satır. Wizard adımlarını ayrı dosyalara böldüğünüz gibi, dashboard sekmeleri de `OverviewTab.tsx`, `ServicesTab.tsx` vs. şeklinde ayrılmalı; hem okunabilirlik hem lazy-load ile performans kazanılır.

## 🟡 Küçük Sorunlar

- `AddressInfo.tsx`'de kullanılmayan `CITIES` dizisi tanımlı duruyor (gerçekte `TURKEY_CITIES` kullanılıyor) — dead code.
- `category: (salon?.category || 'kuafor') as CategoryId` — tip zorlaması güvensiz; geçersiz bir string gelirse sessizce yanlış davranır.
- `formData.description`'a karakter sınırı/sayaç yok.

---

## ✅ Daha modern/sağlam bir yaklaşım için öneriler

**1. Form state yönetimi:** Elle yazılan `validateStep` / `getDetailedValidation` yerine **react-hook-form + zod** kullanın. Şema tek yerde tanımlanır, her adımda `trigger()` ile o adımın alanları anlık doğrulanır, hatalar input altında kırmızı yazı olarak anında gösterilir — kullanıcı sona kadar beklemez.

**2. Ayarlar için "kaydet" akışı:** Input'larda direkt `onChange`→write yerine:
```tsx
const [localValue, setLocalValue] = useState(salon.settings.cancellationHours);
// debounce 600ms sonra kaydet, ya da açık "Kaydet" butonu koy
```
Debounce (`use-debounce` gibi bir hook) veya her ayar kartına net bir "Kaydet" butonu — ikisi de "her tuşta network" sorununu çözer.

**3. Wizard modalını tek yerden yönet:** `showSalonSetup` state'i ve `onSave` mantığını bir custom hook'a (`useSalonWizard()`) veya tek bir `<SalonSetupModal />` wrapper'ına taşıyın, sadece bir kez render edin, üç kopyayı silin.

**4. Türkçe slugify:** `slugify` kütüphanesi (Türkçe karakter desteğiyle) veya kendi map'inizi kullanın:
```ts
const trMap: Record<string,string> = {ç:'c',ğ:'g',ı:'i',ö:'o',ş:'s',ü:'u'};
```
ve slug çakışması varsa backend'de `-2`, `-3` gibi sonek ekleyin.

**5. Konfeti:** `canvas-confetti` paketine geçin — tek `<canvas>`, GPU dostu, yüzlerce DOM node'una gerek yok.

**6. Navigasyon:** `window.location.href = '/dashboard?tab=overview'` yerine `navigate('/dashboard?tab=overview')`.

**7. Dashboard'u böl:** Her sekme kendi dosyasında, `React.lazy` ile yüklensin — ilk yükleme daha hızlı olur, kod daha bakımı kolay hale gelir.

İsterseniz bunlardan birini (örneğin ayarlar için debounce'lu kaydetme, ya da wizard'ın react-hook-form + zod'a geçirilmesi) somut kod olarak yazabilirim — hangisiyle başlamak istersiniz?