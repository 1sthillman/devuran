İncelemeyi tamamladım. Repoyu klonlayıp (140 commit, 14 Mayıs–20 Temmuz 2026 arası), Firestore güvenlik kurallarını, rezervasyon/fiyatlandırma mantığını, mimariyi ve kod kalitesini satır satır kontrol ettim. Sonuç: proje **çalışıyor ve fikir olarak mantıklı**, ama şu an **production'da açık, kanıtlanabilir güvenlik açıkları** ve **kendi geliştiricinin de itiraf ettiği çözülmemiş mantık hataları** var. Aşağıda somut dosya/satır referanslarıyla.

## 1. Genel Sağlık Görünümü

- **414 adet .md dosyası**, kökte tek tek serpiştirilmiş (ABONELIK_SISTEMI_FINAL.md, ABONELIK_SISTEMI_FINAL_RAPOR.md, KRITIK_DUZELTMELER_FINAL.md, CRITICAL_FIXES_SUMMARY_v2.md gibi aynı konuda 5-10 kez tekrar eden "final/kritik/tamamlandı" raporları). Bu, sürekli "bul-yama-tekrar bul-tekrar yama" döngüsünde çalışıldığının açık kanıtı — kalıcı kök-neden çözümü yerine semptom kovalama düzeni.
- `package.json` → `"name": "my-app"` — Vite varsayılan adı hiç değiştirilmemiş.
- `src/` 89.446 satır TS/TSX koda karşılık **89.446 satırlık kodun testi yok** — `tests/` klasöründeki tüm testler (9 dosya, ~2100 satır) sadece muhtemelen kullanılmayan bir "Google Maps entegrasyonu" alt sistemine ait. Asıl iş mantığı olan rezervasyon, müsaitlik, abonelik, wizard kodlarının **hiçbirinin testi yok**.
- Kökte hem `package.json` hem de içi neredeyse boş, ayrı bir `frontend/package.json` ("google-maps-integration-frontend") var — yarım kalmış, entegre edilmemiş ikinci bir proje iskeleti repoda öylece duruyor.
- `src/pages/archive/NewHome.tsx` gibi ölü kod parçaları mevcut.
- `src` içinde **947 adet** `console.log/warn/error` — production build'e taşınan hata ayıklama gürültüsü.
- **230 adet** `: any` kullanımı — TypeScript'in tip güvenliği büyük ölçüde by-pass edilmiş.

## 2. KRİTİK Güvenlik Açıkları (`firestore.rules`)

**a) `reservations` koleksiyonunda kimlik doğrulamasız güncelleme** (satır ~118-122):
```
allow update: if request.resource.data.diff(resource.data).affectedKeys()
                 .hasOnly(['status', 'cancelledAt', ..., 'pricing', 'date', 'startTime', ...]);
```
Bu kuralda **`request.auth != null` kontrolü bile yok**. Firestore kuralları OR mantığıyla çalıştığı için, giriş yapmamış herhangi biri, sadece bu alanları değiştirerek **herhangi bir işletmenin herhangi bir rezervasyonunun durumunu, fiyatını, tarihini** değiştirebilir. Bu, mülkiyet kontrolü yapan diğer `allow update` kurallarını tamamen anlamsız kılıyor.

**b) `appointments` koleksiyonunda sahiplik kontrolsüz güncelleme:** Benzer kural `request.auth != null` istiyor ama hangi kullanıcı olduğuna bakmıyor — **giriş yapmış herhangi bir müşteri, başka bir işletmenin randevusunu iptal edebilir/durumunu değiştirebilir**.

**c) `subscriptions` koleksiyonu tamamen açık** (yorum satırının kendisi de itiraf ediyor: `// ✅ TEMPLİK AÇIK - TEST İÇİN`):
```
allow read, create, update: if request.auth != null;
```
Giriş yapmış **herhangi bir kullanıcı**, kendi veya başka bir işletmenin abonelik belgesini istediği plana/limite güncelleyebilir. Yani teorik olarak bir işletme sahibi, ücretsiz plandan premium'a kendi kendine "yükseltme" yapabilir — ödeme sistemini (PayTR) tamamen atlayarak.

**d) `orders` koleksiyonu herkese açık okunabilir** (`allow read: if true` — auth bile gerekmiyor): Tüm restoranların tüm siparişleri (muhtemelen müşteri bilgisiyle) internetteki herkes tarafından okunabilir.

**e) `customers` ve `analytics` koleksiyonları:** `allow read: if request.auth != null` — sadece "giriş yapmış olmak" yeterli, kendi işletmesi olması şartı yok. Yani platformdaki **herhangi bir işletme sahibi başka işletmelerin müşteri listesini ve analitik verilerini** okuyabilir (rakip verisi sızıntısı).

**f) Süper admin e-postaları public repoya hardcode edilmiş** (`adistow@gmail.com`, `admin@restoqr.com` vb.) — bu dosya GitHub'da herkese açık, yani admin hesap e-postaları ifşa olmuş durumda.

**g) `validateSubscriptionLimit()` fonksiyonu tanımlanmış ama kurallarda hiçbir yerde çağrılmıyor** — yazılmış ama devreye alınmamış "ölü güvenlik kodu", limit aşımı fiilen sadece Cloud Functions'a güveniyor (client SDK ile direkt yazımda hiç kontrol yok).

## 3. KRİTİK Mantık Hatası: Sahte Transaction / Çifte Rezervasyon Koruması Yok

`src/services/reservationService.ts:120-147` — kod kendi içinde şunu itiraf ediyor:
> *"Note: Firestore transactions don't support queries, so we do optimistic locking... Double check availability (race condition still possible but minimized)"*

Gerçekte olan: `runTransaction` içinde çakışma kontrolü `transaction.get()` değil, normal bir `getDocs()` sorgusu (`getStaffReservationsForDate`) ile yapılıyor. Firestore transaction'ları yalnızca `transaction.get(docRef)` ile okunan belgeler üzerinde atomiklik/kilit garantisi verir; bir sorgu (query) transaction dışında çalışır ve hiçbir çakışma tespit edilmez. Sonuç: **iki kullanıcı aynı saat dilimini aynı anda seçerse, ikisi de "boş" görüp farklı ID'li iki rezervasyon belgesi oluşturabilir** — transaction hiçbir çakışmayı engellemez, sadece "atomik yazma" hissi verir. Bu süslenmiş ama işe yaramayan bir kilit mekanizması.

## 4. KRİTİK Mantık Hatası: Fiyat Doğrulama Bilerek Kapatılmış

`src/store/bookingStore.ts:31`:
```ts
const USE_BACKEND_VALIDATION = false; // 🔴 TEMPORARILY DISABLED - SECURITY RISK
```
Bu flag `false` olduğu için:
- Fiyat, `reservationService.ts:566` içinde doğrudan **client'tan gelen** `services[].price` değerlerinden toplanıyor (`basePrice = slotData.services?.reduce((sum, s) => sum + s.price, 0)`), Firestore'daki gerçek hizmet fiyatına karşı **hiçbir sunucu tarafı kontrol yok**.
- Doğru çözüm zaten yazılmış: `functions/src/reservations.ts` gerçekten sunucu tarafında Firestore'dan gerçek fiyatı çekip doğruluyor (`validatedPrice = servicesSnapshot.docs.reduce(...)`) — yani ekip doğru mimariyi biliyor ve inşa etmiş, ama **anahtarı kapalı bırakmışlar**.
- `firestore.rules`'daki `reservations` create kuralı da fiyat alanlarını hiç kontrol etmiyor.

Pratik sonuç: Şu anki haliyle kötü niyetli bir kullanıcı, tarayıcı geliştirici araçlarından isteği değiştirerek (ya da doğrudan Firestore SDK ile) **herhangi bir hizmeti 0 TL veya istediği fiyata rezerve edebilir.**

## 5. Mimari Tutarsızlık: İki Paralel Rezervasyon Modeli

`reservations` ve `appointments` diye **iki ayrı koleksiyon** var; `firestore.rules` içinde bizzat "*APPOINTMENTS COLLECTION (same as reservations)*" yorumu bunu doğruluyor. `OwnerDashboard.tsx` ve `firebaseService.ts` hâlâ eski `appointments` modelini okuyor, yeni akış (`bookingStore` → `reservationService`) ise `reservations` yazıyor. Bu, göç (migration) tamamlanmadan iki sistemin bir arada tutulduğunu gösteriyor — veri bir tarafta güncellenip diğerinde görünmeme riski (repodaki `LEGACY_MIGRATION_COMPLETE.md`, `SERVICES_MIGRATION_FIX.md` gibi belgeler de bu geçişin defalarca "tamamlandı" ilan edilip tekrar bozulduğunu gösteriyor).

## 6. Diğer Bulgular

- `src/config/firebase-admin.ts` (Admin SDK, tam yetkili) `src/services/availability-engine.service.ts` içine import edilmiş — bu dosya şu an hiçbir yerden çağrılmadığı için (kontrol ettim) ölü kod, ama `src/` altında durması riskli bir örüntü: birisi ileride bu servisi bir component'e bağlarsa, Admin SDK istemci paketine (bundle) sızabilir.
- `restaurantNotifications` koleksiyonu: `allow update, delete: if true` — herkes herhangi bir bildirimi silebilir/değiştirebilir; kodun kendi yorumu bunu "TODO: production'da kısıtla" diye işaretlemiş ama hâlâ açık.

## Öncelik Sırasına Göre Yapılacaklar

1. **Acil:** `reservations`/`appointments` update kurallarına gerçek `auth` + sahiplik kontrolü ekleyin; şu anki hâliyle bu, herkesin herkesin randevusunu değiştirebildiği açık bir kapı.
2. **Acil:** `subscriptions` kuralındaki "test için açık" yorumunu kaldırıp gerçek sahiplik/süper-admin kısıtlaması koyun.
3. **Acil:** `USE_BACKEND_VALIDATION = true` yapıp Cloud Function tabanlı fiyat doğrulamasını devreye alın (kod zaten hazır, sadece kapatılmış).
4. **Yüksek:** Çakışma kontrolünü gerçek bir `transaction.get()` ile veya slot bazlı belge ID'si (`{staffId}_{date}_{startTime}` gibi) kullanarak Firestore'un doğal "aynı ID'ye ikinci create başarısız olur" garantisine dayandırın — şu anki optimistic check gerçek koruma sağlamıyor.
5. **Orta:** `customers`/`analytics`/`orders` okuma kurallarını "sadece kendi işletmesi" ile sınırlayın.
6. **Orta:** `appointments` → `reservations` göçünü fiilen bitirin, eski koleksiyonu ve ona bağlı ekranları kaldırın.
7. **Düşük ama önemli:** 400+ .md dosyasını arşivleyip tek bir CHANGELOG'a indirin, `console.log`'ları temizleyin, gerçek iş mantığı için birim testi ekleyin.

Özetle: proje fikri ve genel akışı (çok-dikeyli randevu platformu) mantıklı ve büyük ölçüde çalışır durumda görünüyor, ama şu anki repo hâli **canlıya alınmaya hazır değil** — yukarıdaki güvenlik açıkları gerçek para/veri kaybına yol açabilecek türden, hipotetik değil.
Aşağıda, önceki denetimde bulduğum her maddeyi ele alan, öncelik sırasına göre uygulanabilir bir yol haritası var. Aynı gün yapılması gerekenlerden başlayıp mimari ve süreç düzeyindeki iyileştirmelere doğru ilerliyorum.

## FAZ 0 — Bugün Yapılması Gerekenler (canlı istismar riski var)

Bunlar kod değişikliği gerektirmiyor, sadece `firestore.rules` dosyasını düzeltip `firebase deploy --only firestore:rules` çalıştırmak yeterli. Sıfır aşağı süre (downtime) ile yapılabilir:

**1) `subscriptions` koleksiyonunu kapatın.** Şu an herkes yazabiliyor. Şuna çevirin:
```
match /subscriptions/{subscriptionId} {
  allow read: if request.auth != null &&
    (subscriptionId == request.auth.uid ||
     get(/databases/$(database)/documents/salons/$(subscriptionId)).data.ownerId == request.auth.uid ||
     isSuperAdmin());
  allow write: if isSuperAdmin(); // planı sadece backend (Cloud Function/ödeme webhook'u) değiştirsin
}
```
Yani abonelik yükseltme/indirme işlemini **istemciden değil**, PayTR ödeme onayından sonra tetiklenen bir Cloud Function'dan yapın. Şu an client'a "yaz" yetkisi vermek, ödeme sistemini tamamen anlamsız kılıyor.

**2) `reservations` ve `appointments` update kurallarını birleştirip sahiplik zorunlu kılın.** Şu anki en tehlikeli satır (auth kontrolü hiç olmayan kural) tamamen silinmeli:
```
match /reservations/{reservationId} {
  allow read: if true;
  allow create: if request.auth != null &&
    (request.resource.data.userId == request.auth.uid ||
     (request.resource.data.userId == 'system-block' && isSalonOwner(request.resource.data.businessId)));
  allow update: if request.auth != null &&
    (resource.data.userId == request.auth.uid || isSalonOwner(resource.data.businessId)) &&
    request.resource.data.diff(resource.data).affectedKeys()
      .hasOnly(['status','cancelledAt','cancelledBy','cancellationReason','updatedAt','date','startTime','endTime']);
  allow delete: if request.auth != null && isSalonOwner(resource.data.businessId);
  allow read, write: if isSuperAdmin();
}
```
Dikkat: `pricing` alanını `affectedKeys` listesinden çıkardım — fiyatı client'ın update ile değiştirebilmesi zaten olmamalı, fiyat sadece create anında (ve orada da backend doğrulamasıyla) belirlenmeli. `appointments` için de aynı mantığı uygulayın.

**3) `orders`, `customers`, `analytics` okuma izinlerini daraltın:**
```
match /orders/{orderId} {
  allow read: if request.auth != null && isSalonOwner(resource.data.restaurantId);
  ...
}
match /customers/{customerId} {
  allow read: if request.auth != null &&
    (isSalonOwner(resource.data.salonId) ||
     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.salonId == resource.data.salonId);
}
match /analytics/{document=**} {
  allow read: if request.auth != null &&
    get(/databases/$(database)/documents/salons/$(request.resource.data.salonId)).data.ownerId == request.auth.uid;
}
```

**4) `restaurantNotifications` update/delete'i kısıtlayın** — en azından cihaz/oturum bazlı bir token kontrolü ekleyin; şu anki `if true` tamamen anonim sabotajı mümkün kılıyor.

**5) Süper admin e-posta listesini rules dosyasından çıkarın.** Bu dosya public repoda. E-postaları Firebase Custom Claims'e taşıyın (`request.auth.token.admin == true` zaten var, sadece bunu kullanın), fallback e-posta listesini silin. Ayrıca bu e-postalara sahip hesaplarda **2FA'yı hemen açın** çünkü artık hedef haline geldiler.

## FAZ 1 — Bu Hafta: Fiyat Doğrulama ve Çifte Rezervasyon

**6) `USE_BACKEND_VALIDATION`'ı açın.** `src/store/bookingStore.ts:31` → `true` yapın. Bu tek satır, tüm fiyat manipülasyonu riskini kapatıyor çünkü `functions/src/reservations.ts` zaten doğru şekilde sunucu tarafında gerçek fiyatı hesaplıyor. Açmadan önce:
- Cloud Function'ın deploy edildiğinden emin olun (`firebase deploy --only functions`).
- `reservationService.createReservation` (client-side, doğrulamasız) fonksiyonunu **tamamen silin** veya en azından sadece dev/test ortamında çalışacak şekilde kilitleyin — "geriye dönük uyumluluk" gerekçesiyle production'da bırakmayın, çünkü bu fonksiyon her zaman bir kaçış yolu (bypass) olarak kalır.
- `firestore.rules`'da `reservations` create kuralına, fiyatın sadece Cloud Function'ın kullandığı servis hesabı (admin SDK, rules'u by-pass eder) tarafından yazılabildiğini garanti altına almak için ayrıca client'ın `pricing` alanını doğrudan set edememesi gerekir — bunu pratikte "create sırasında pricing alanı yoksa/backend tarafından ekleniyorsa" şeklinde tasarlayın; en temiz çözüm rezervasyon oluşturmayı **sadece** `createReservationWithValidation` Cloud Function üzerinden yapmak ve client'ın Firestore'a doğrudan `reservations` create yetkisini tamamen kaldırmaktır (rules'da create'i sadece Cloud Function'ın kullandığı servis hesabına bırakın). Bu, "istemci hiç yazamaz, her şey backend'den geçer" modeline geçmek demek — en sağlam çözüm budur.

**7) Çifte rezervasyon (double-booking) korumasını gerçek hale getirin.** Şu anki `getDocs` + `transaction.set` kombinasyonu koruma sağlamıyor. İki seçenek:
- **Basit ve sağlam çözüm:** Slot için deterministik bir doküman ID'si kullanın, örn. `{staffId}_{date}_{startTime}` gibi bir "kilit" belgesi `locks` koleksiyonunda oluşturun ve `transaction.get()` ile bu belgeyi kontrol edip `transaction.set()` ile (belge yoksa) oluşturun. Firestore aynı ID'ye eşzamanlı iki `create` işleminden sadece birini kabul eder — bu, gerçek atomik kilit sağlar.
- Cloud Function tarafında da aynı mantığı uygulayın (zaten backend validasyonuna geçtiğinizde bu doğal olarak oraya taşınacak).
- Test edin: iki tarayıcı sekmesinden aynı anda aynı saate rezervasyon denemesi yapıp sadece birinin geçtiğini doğrulayın.

## FAZ 2 — Bu Ay: Veri Modeli Temizliği

**8) `reservations` / `appointments` ikili yapısını birleştirin.** Önce hangi ekranların hangi koleksiyonu okuduğunu çıkarın (`OwnerDashboard.tsx`, `firebaseService.ts` → `appointments`; `bookingStore` → `reservations`). Sonra:
- Tek kaynak olarak `reservations`'ı seçin (daha yeni, daha kapsamlı tip tanımına sahip).
- `appointments` okuyan ekranları `reservations`'a yönlendirin.
- Geçiş bitene kadar bir Cloud Function ile iki koleksiyonu senkron tutabilirsiniz, ama bunu kalıcı çözüm yapmayın — geçiş tamamlanınca `appointments`'ı arşivleyip silin.

**9) `firebase-admin`'i frontend'den tamamen ayırın.** `src/config/firebase-admin.ts` ve onu import eden `src/services/availability-engine.service.ts` şu an kullanılmıyor (ölü kod) ama `src/` altında durması riskli. Bunları `functions/` klasörüne taşıyın ki hiçbir yanlışlıkla bir component tarafından import edilip Vite bundle'ına sızma ihtimali olmasın. Vite config'e de `firebase-admin`'i explicit olarak `external`/exclude edin, build zamanında yanlışlıkla bundle'a girerse hata versin.

**10) Yarım kalmış `frontend/` klasörünü kaldırın veya bitirin.** Şu an "google-maps-integration-frontend" adıyla neredeyse boş bir ikinci proje iskeleti kafa karıştırıyor. Ya tamamen silin ya da ayrı bir repoya taşıyın.

## FAZ 3 — Kod Kalitesi ve Sürdürülebilirlik

**11) 947 `console.log` çağrısını temizleyin.** Basit bir yaklaşım: kendi logger sarmalayıcınızı yazıp (`src/utils/logger.ts`) sadece `import.meta.env.DEV` iken konsola yazsın, production'da sessiz kalsın. Sonra tüm `console.*` çağrılarını bulup bu logger ile değiştirin (bir ESLint kuralı ekleyip `no-console` ile yenilerini engelleyebilirsiniz).

**12) 230 adet `: any` kullanımını azaltın.** Öncelik: `reservationService.ts`, `subscriptionService.ts`, `bookingStore.ts` gibi para ve iş mantığı içeren dosyalardan başlayın — bunlar tip hatası yüzünden en çok zarar verebilecek yerler.

**13) 414 markdown dosyasını arşivleyin.** Hepsini `docs/archive/` altına taşıyıp kökü temizleyin, ileriye dönük olarak tek bir `CHANGELOG.md` kullanın. Bu dosyalar geliştirme sürecinin "neden bu kadar çok kez aynı sorunun tekrar tekrar 'çözüldüğü'" sorusunu da gösteriyor — kök nedene inmeden yama üstüne yama yapma alışkanlığının izleri. Bundan sonraki her "fix" için ayrı bir .md yerine PR açıklaması + tek CHANGELOG satırı yeterli.

## FAZ 4 — Test ve Süreç

**14) Gerçek iş mantığına test yazın.** Şu an testlerin tamamı muhtemelen kullanılmayan Google entegrasyonuna ait. Önceliğiniz:
- `reservationService.calculatePricing` ve Cloud Function'daki `validatedPrice` hesaplaması için birim testleri (fiyat manipülasyonunu tekrar sokmamak için regresyon testi).
- Çifte rezervasyon senaryosu için eşzamanlılık testi (yukarıdaki kilit mekanizmasını doğrulayan).
- Firestore rules için `@firebase/rules-unit-testing` ile kural testleri — özellikle "yetkisiz kullanıcı X'i yapabiliyor mu" senaryoları. Bu, bu denetimde bulduğum türden açıkların bir daha sessizce geri gelmesini engeller.

**15) CI'a en azından şunu ekleyin:** `tsc -b` (tip kontrolü), `eslint .`, ve rules testleri her PR'da otomatik çalışsın. Şu anki commit geçmişi (aynı "kritik düzeltme"nin defalarca tekrarlanması) CI olmadan regresyonların fark edilmediğini gösteriyor.

## Önerilen Uygulama Sırası (özet)

| Sıra | Ne | Süre | Risk azaltımı |
|---|---|---|---|
| 1 | Firestore rules (Faz 0, madde 1-5) | 1 gün | Kritik veri/para sızıntısı ve manipülasyonu kapanır |
| 2 | `USE_BACKEND_VALIDATION=true` + client create yolunu kapatma | 2-3 gün | Fiyat manipülasyonu kapanır |
| 3 | Gerçek slot kilidi (double-booking) | 2-3 gün | Çifte rezervasyon riski kapanır |
| 4 | reservations/appointments birleştirme | 1-2 hafta | Veri tutarsızlığı azalır |
| 5 | Kod temizliği + testler + CI | sürekli | Gelecekteki regresyonlar önlenir |

İlk üç madde (1-3), gerçek para ve müşteri verisi riski taşıdığı için önceliğinizi oraya vermenizi öneririm — geri kalanı proje büyüdükçe rahatça yapılabilir.