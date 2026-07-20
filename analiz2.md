FAZ 6 — İzlenebilirlik: Şu An Kör Uçuyorsunuz
Repoda hiçbir hata izleme aracı (Sentry, Bugsnag vb.) yok. 947 console.log'un tamamı sadece geliştiricinin kendi tarayıcısında görünür — production'da bir müşterinin karşılaştığı hata, siz fark etmeden kaybolur. Bu, "neden bu kadar çok kez aynı bug tekrar tekrar çıkıyor" sorusunun da bir parçası: geri bildirim döngünüz kullanıcı şikayetine bağlı, otomatik değil.
Yapılması gerekenler:

Sentry (ücretsiz plan yeterli başlangıç için) ekleyin — hem frontend hem Cloud Functions'a. ErrorBoundary.tsx zaten var, Sentry'yi oraya bağlamak yarım günlük iş.
Firebase Performance Monitoring açın — sayfa yükleme, network gecikmesi gibi metrikleri görün.
Kritik akışlara (rezervasyon oluşturma, ödeme onayı) uyarı (alert) kurun: örneğin bir saatte X'ten fazla başarısız rezervasyon denemesi olursa Slack/e-posta bildirimi.
console.log temizliğini yaparken (önceki mesajda değindiğim logger sarmalayıcı), hata seviyesindeki logları Sentry'ye, geri kalanını sessize alın.

FAZ 7 — Kötüye Kullanım Koruması: Cloud Functions Tarafında Sıfır
src/utils/rateLimiter.ts var ve 3 yerde kullanılıyor ama bu tamamen client-side — yani kötü niyetli biri rate limiter'ı içeren JS kodunu hiç çalıştırmadan, doğrudan Cloud Function endpoint'ine veya Firestore'a istek atabilir. functions/src/ içinde hiçbir rate limiting kodu yok. Bu şu anlama geliyor:

Biri saniyede yüzlerce sahte rezervasyon/randevu oluşturup sisteminizi (ve Firebase faturanızı) çökertebilir.
Bildirim sistemi (allow create: if true olan notifications, restaurantNotifications) spam bombardımanına açık.

Yapılması gerekenler:

Cloud Functions'ta App Check zorunlu kılın (enforceAppCheck: true seçeneği) — şu an src/lib/firebase.ts'de App Check sadece VITE_RECAPTCHA_SITE_KEY varsa ve production'daysa devreye giriyor, yani opsiyonel/best-effort. Bunu zorunlu hale getirip App Check token'ı olmayan istekleri Functions seviyesinde reddedin.
Firebase'in kendi App Check + Firestore rules entegrasyonunu kullanarak request.app != null kontrolünü kritik yazma kurallarına ekleyin.
Cloud Functions'a IP/kullanıcı bazlı basit bir rate limit katmanı ekleyin (Firestore'da rateLimits/{uid} gibi bir sayaç belgesiyle bile yapılabilir).

FAZ 8 — Yedekleme ve Felaket Kurtarma
Repoda hiçbir otomatik Firestore yedekleme yapılandırması görmedim (firebase.json'da export/backup ayarı yok). Şu anki durumda, biri (kazayla ya da kötü niyetle — özellikle Faz 0'da kapattığımız açık kurallar sayesinde) verinizi topluca silerse geri dönüş yolunuz yok.

Firestore'da günlük otomatik export ayarlayın (Cloud Scheduler + gcloud firestore export ile Cloud Storage'a, ücretsiz/çok ucuz).
En az 30 günlük yedek saklama politikası koyun.
audit_logs koleksiyonunuz zaten var (silinemez olarak işaretlenmiş, iyi) — bunu gerçekten her kritik işlemde (rezervasyon silme, abonelik değişikliği, admin işlemleri) dolduracak şekilde genişletin; şu an sadece bazı admin panel aksiyonlarında kullanılıyor gibi görünüyor.

FAZ 9 — Bildirim Sisteminin Güvenilirliği
BILDIRIM_SISTEMI_* başlıklı 5-6 ayrı .md dosyası olması, bu sistemin de defalarca "düzeltildi" ilan edildiğini gösteriyor. Kontrol edilmesi gerekenler:

E-posta (Resend) ve push bildirimlerinin gönderim başarısı takip edilmiyor — notificationService.ts gönderimi "fire and forget" (try/catch ile hatayı yutup rezervasyonu düşürmüyor, bu doğru bir tasarım ama) başarısız gönderimler hiçbir yerde loglanıp tekrar denenmiyor. Bir retry kuyruğu (örn. Cloud Tasks) ekleyin.
scheduledNotifications koleksiyonu var — bunun gerçekten zamanında tetiklendiğini doğrulayan bir cron/Cloud Scheduler job'ı olduğundan emin olun, yoksa "hatırlatma" bildirimleri sessizce hiç gitmeyebilir.

FAZ 10 — Performans

Bundle boyutu: @radix-ui/* bileşenlerinin neredeyse tamamı package.json'da tek tek listelenmiş — bunların hepsi gerçekten kullanılıyor mu, yoksa şablon/AI tarafından toptan mı eklendi kontrol edin (npx depcheck ile kullanılmayan bağımlılıkları bulun). Kullanılmayanları kaldırmak build boyutunu ciddi azaltır.
Görsel optimizasyonu: asset/ ve public/asset/ altında birden fazla büyük .mp4/.gif dosyası var (bazıları hem asset/ hem public/asset/ altında tekrarlanmış — aynı dosyanın iki kopyası). Bunları CDN'e (Cloudflare R2 zaten entegre görünüyor) taşıyıp public/ içinden temizleyin; her deploy'da bu ağırlığı taşımayın.
lighthouse-report.json repoya commit edilmiş — bu tek seferlik bir çıktı, versiyon kontrolüne girmemeli; CI'da her PR'da otomatik Lighthouse çalıştırıp skorunu PR'a yorum olarak düşürmek daha faydalı.

FAZ 11 — Yasal/Uyumluluk Sayfalarının Doğruluğu
KVKKPolicy.tsx, PrivacyPolicy.tsx, TermsOfService.tsx, DistanceSalesAgreement.tsx var ve içerik dolu (~200 satır her biri) — bu iyi bir başlangıç, ama bunların bir hukuk danışmanı tarafından gözden geçirildiğinden emin olun, özellikle:

KVKK metninde, yukarıda bulduğumuz "herkes müşteri verisini okuyabiliyor" açığı kapatılmadan, metindeki veri güvenliği taahhütleriyle gerçek uygulama arasında uyumsuzluk var — bu hem itibar hem hukuki risk.
Mesafeli satış sözleşmesi, gerçek ödeme otomasyonuna geçtiğinizde (Faz 5) güncellenmesi gerekecek.

FAZ 12 — Süreç Disiplini (En Kritik, Uzun Vadeli Madde)
Teknik düzeltmelerin hepsini yapsanız bile, geliştirme şekliniz değişmezse aynı sorunlar birkaç ay içinde geri gelir. Repodaki 414 "FINAL/KRİTİK/TAMAMLANDI" dosyası, sorunların kök nedene inilmeden yama üstüne yama şeklinde kapatıldığının kanıtı. Öneriler:

Staging ortamı kurun — şu an her şey doğrudan production'a mı deploy ediliyor yoksa test ortamı var mı belirsiz; firebase.json'da tek proje (.firebaserc) görünüyor. Ayrı bir Firebase projesi (staging) açıp değişiklikleri önce orada test edin.
Her "kritik düzeltme"den sonra bir .md yazmak yerine, o düzeltmeyi doğrulayan bir test yazın. Test, dokümandan daha güvenilir bir "bu bir daha bozulmasın" garantisidir.
Feature flag disiplini: USE_BACKEND_VALIDATION gibi flag'ler koda gömülü sabitler yerine bir systemConfig Firestore belgesinden okunmalı ki acil durumda kod deploy etmeden kapatıp açabilesiniz.
Kod incelemesi (code review) için tek kişi bile olsanız, değişiklikleri bir gün bekletip "soğuk kafayla" tekrar okuma alışkanlığı edinin — özellikle güvenlik kurallarına dokunan değişikliklerde.
Devam ediyorum — kodda daha derine inip üç yeni kritik alan buldum: dosya depolama (Storage) güvenliği, admin bilgisinin sızma şekli, ve değerlendirme/yorum sisteminin sahteciliğe açık olması. Bunlar da tıpkı öncekiler gibi somut, doğrulanmış bulgular.

## FAZ 13 — KRİTİK: Firebase Storage Kuralları da Açık

`storage.rules` dosyasını tam okudum. Dosya tipini (`image/*`) ve boyutu (10MB) kontrol eden fonksiyonlar var, iyi bir başlangıç — ama sahiplik kontrolü **hiç yok**:

```
match /salons/{salonId}/{allPaths=**} {
  allow read: if true;
  allow write: if isAuthenticated() && isValidImageType() && isValidImageSize();
}
match /users/{userId}/{allPaths=**} {
  allow read: if true;
  allow write: if isAuthenticated() && isValidImageType() && isValidImageSize();
}
```

Burada `salonId` ya da `userId`'nin, işlemi yapan kullanıcıya ait olup olmadığına dair **hiçbir kontrol yok**. Yani giriş yapmış herhangi bir müşteri hesabı:
- Başka bir işletmenin `/salons/{başka-salonId}/` klasörüne dosya yükleyip mevcut logo/galeri görsellerinin üzerine yazabilir (aynı dosya adını kullanarak),
- Başka bir kullanıcının `/users/{başka-userId}/` profil klasörüne içerik yükleyebilir.

Düzeltme, Firestore rules'daki gibi sahiplik kontrolü eklemek:
```
match /salons/{salonId}/{allPaths=**} {
  allow read: if true;
  allow write: if isAuthenticated() && isValidImageType() && isValidImageSize() &&
    firestore.get(/databases/(default)/documents/salons/$(salonId)).data.ownerId == request.auth.uid;
}
match /users/{userId}/{allPaths=**} {
  allow read: if true;
  allow write: if isAuthenticated() && request.auth.uid == userId &&
    isValidImageType() && isValidImageSize();
}
```
(Storage rules'dan Firestore'a erişim `firestore.get()` fonksiyonuyla mümkün, güncel Firebase sürümünde destekleniyor — yoksa bu kontrolü Cloud Function tabanlı bir yükleme akışına taşıyın.)

## FAZ 14 — KRİTİK: Süper Admin E-postası Frontend Bundle'ında Açıkta

Önceki denetimde `firestore.rules`'daki hardcoded admin e-postalarını bulmuştum. Şimdi kodun kendisinde de aynı sorunu buldum — daha da vahim çünkü bu, **derlenmiş (compiled) JavaScript'in içinde, tarayıcıda çalışan koddadır**:

`src/pages/SuperAdminDashboard.tsx:50`
```ts
const SUPER_ADMIN_EMAIL = 'minifinise@gmail.com';
```

Bu satır, hem GitHub'daki public kaynak kodda hem de production'a deploy edilen JS bundle'ında **düz metin olarak** duruyor. Herhangi biri tarayıcı geliştirici araçlarından "Sources" sekmesine bakıp bu e-postayı görebilir. Bu, gerçek bir hedefli oltalama (phishing) / sosyal mühendislik riski taşıyor — kimse "hangi hesap admin" diye tahmin etmesine gerek yok, doğrudan biliyor.

**Yapılması gereken (aciliyet: bugün):**
1. Bu kontrolü client tarafında e-posta karşılaştırmasıyla değil, **Firebase Custom Claims** (`request.auth.token.admin === true`, zaten altyapı var) ile yapın — e-posta hiçbir yerde görünmemeli.
2. `minifinise@gmail.com` hesabına (ve rules'da geçen diğer admin e-postalarına) **şimdiden 2FA açın** ve mümkünse bu hesapların şifrelerini değiştirin — kod zaten public'te olduğu için, bu e-postaları artık "sızmış" kabul edip önlem almanız gerekiyor.
3. Bundan sonra hiçbir yetki/rol kontrolünü e-posta string karşılaştırmasıyla yapmayın; sadece custom claims veya Firestore'daki `role` alanı kullanın.

## FAZ 15 — KRİTİK: Değerlendirme (Review) Sistemi Tamamen Sahteciliğe Açık

`firestore.rules`:
```
match /reviews/{reviewId} {
  allow read: if true;
  allow create: if true;   // ← kimlik doğrulama bile yok
```

`src/services/reviewService.ts` içindeki `createReview()` fonksiyonu da yorum yıldızını (1-5 arası) doğruluyor ama **rezervasyonun gerçekten var olup olmadığını, tamamlanmış olup olmadığını, yorumu yazan kişiye ait olup olmadığını hiç kontrol etmiyor**.

Sonuç: Giriş yapmadan bile, herhangi biri herhangi bir işletmeye sahte 5 yıldız (kendi işletmesi için) ya da sahte 1 yıldız (rakip için) yorum bırakabilir. Bir randevu platformunda güven puanı en kritik varlıklardan biri — bu açık, iş modelinizin temelini zedeleyebilir.

**Düzeltme:**
```
match /reviews/{reviewId} {
  allow read: if true;
  allow create: if request.auth != null &&
    request.resource.data.userId == request.auth.uid &&
    exists(/databases/$(database)/documents/reservations/$(request.resource.data.reservationId)) &&
    get(/databases/$(database)/documents/reservations/$(request.resource.data.reservationId)).data.userId == request.auth.uid &&
    get(/databases/$(database)/documents/reservations/$(request.resource.data.reservationId)).data.status == 'completed';
  ...
}
```
Yani: yorum yazan kişi giriş yapmış olmalı, o rezervasyon gerçekten ona ait olmalı ve rezervasyon "tamamlandı" durumda olmalı. Ayrıca bir rezervasyon için ikinci kez yorum yazılmasını engellemek üzere (`hasReview` alanını kontrol ederek) mükerrer yorum kapatılmalı.

## FAZ 16 — E-posta Doğrulaması Hiç Yok

`src/services/authService.ts`'deki `register()` fonksiyonu `createUserWithEmailAndPassword` çağırıyor ama **hiçbir yerde `sendEmailVerification` çağrılmıyor**. Yani:
- Kullanıcılar sahibi olmadıkları bir e-posta ile kayıt olup platformu kullanabiliyor.
- Randevu onay/hatırlatma e-postaları hiç ulaşmayan hayali adreslere gidiyor olabilir.
- Sahte hesap açmak (ör. yukarıdaki review sahteciliğiyle birleşince) neredeyse maliyetsiz.

**Yapılması gereken:** Kayıt sonrası `sendEmailVerification(user)` çağırın, `users` koleksiyonuna `emailVerified: false` yazın, kritik işlemler (rezervasyon oluşturma, yorum yazma) için `auth.currentUser.emailVerified === true` şartı arayın veya en azından doğrulanmamış hesapları arayüzde uyarı ile işaretleyin.

---

Buraya kadar üç mesajda toplam **16 fazlık** bir düzeltme planı çıktı — güvenlik kurallarından (Firestore + şimdi Storage), fiyat/rezervasyon mantığından, ödeme otomasyonundan, izlenebilirlikten, sahte yorum korumasına kadar. Bu miktarda maddeyi sohbet içinde takip etmek zorlaşıyor.

