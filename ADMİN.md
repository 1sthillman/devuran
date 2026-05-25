Aşağıdaki metni doğrudan yapay zekâya / geliştirici asistana verebilirsin. Yazdığını daha teknik, eksiksiz ve “ne yapacağını çok net anlayacak” seviyeye çevirdim.

---

**PROJE TALİMATI – KAPSAMLI MOBİL UYUMLU ADMIN PANELİ (ÜRETİM KALİTESİNDE)**

Bu görevde amaç sıradan bir admin ekranı yapmak değil. Gerçek dünyada kullanılabilecek, üretim seviyesinde, modern, güvenli, tam yetkili, mobil uyumlu ve eksiksiz bir **Super Admin Yönetim Paneli** oluşturulacak.

ÖNEMLİ: Bu admin paneli uygulamanın merkezi yönetim sistemi olacak. Uygulama içinde bulunan tüm fonksiyonlar yönetilebilir olmalı. Sadece birkaç sayfa değil, tam kapsamlı ve gerçek sistem mantığında tasarlanmalı.

## 1. Genel Amaç

Uygulamadaki tüm sistemleri tek merkezden yönetebilen, mobil ekranlara tam uyumlu, profesyonel işletme paneli hissi veren, modern ve akıcı bir admin paneli oluştur.

Bu panel:

* Tam yetkili **Super Admin** paneli olacak
* Tüm kullanıcıları yönetebilecek
* Tüm işletmeleri/hizmetleri/personelleri yönetebilecek
* Abonelikleri onaylayabilecek / iptal edebilecek
* Randevuları yönetebilecek
* Banlama / onaylama / askıya alma yapabilecek
* Finansal işlemleri takip edebilecek
* Kayıt süreçlerini yönetebilecek
* Gerçek uygulama mantığında çalışacak
* Güvenlik katmanları olacak
* Mobil ekranlarda kusursuz çalışacak

Bu panel “demo admin panel” gibi görünmeyecek. Gerçek SaaS / işletme yönetim sistemi kalitesinde olacak.

---

# 2. En Kritik Tasarım Kuralları (ÇOK ÖNEMLİ)

UI/UX konusunda taviz yok.

### Mobil Uyum (En Kritik Şey)

Admin paneli mobil ekrana %100 uyumlu olacak.

Şunlar ASLA olmayacak:

* taşan içerik
* sıkışmış kartlar
* ekrandan çıkan butonlar
* overflow hataları
* bozuk responsive yapı
* küçük ekranda okunamayan tablolar
* üst üste binmeler
* navigation karmaşası

Mobil-first mantığı kullanılacak.

Tasarımlar:

* küçük telefonlarda düzgün
* büyük telefonlarda düzgün
* tabletlerde düzgün
* masaüstünde profesyonel

çalışmalı.

Responsive tasarım production kalitesinde olmalı.

---

### Tasarım Stili

Tasarım modern, premium, işletme paneli hissinde olmalı.

İstenilen stil:

* modern SaaS dashboard
* premium işletme paneli
* floating card tasarımı
* glass / soft shadow detayları
* temiz spacing
* düzgün typography
* smooth animasyonlar
* premium navigation

UI hissi:

“Bu gerçek şirket admin paneli” dedirtmeli.

Eski tip kaba admin panel görünümü istemiyorum.

---

### Navigation Sistemi

Navigation profesyonel olacak.

Mobilde:

* bottom navigation
  veya
* floating navigation
  veya
* collapsible drawer

kombinasyonu kullanılabilir.

Navigation karmaşık olmayacak.

Her sistem ayrı modül şeklinde organize edilmeli.

Örnek:

Dashboard
Kullanıcılar
İşletmeler
Personeller
Randevular
Abonelikler
Ödemeler
Hizmetler
Onay Süreçleri
Raporlar
Bildirimler
Şikayetler
Destek Talepleri
İçerik Yönetimi
Ayarlar
Güvenlik
Admin Yetkileri
Loglar

gibi.

Navigation premium işletme paneli mantığında olmalı.

---

# 3. Dashboard (Ana Yönetim Merkezi)

Ana ekran çok güçlü olacak.

Dashboard içinde:

### KPI kartları

* toplam kullanıcı
* aktif kullanıcı
* bugün kayıt olan
* premium kullanıcı
* aktif abonelik
* iptal edilen abonelik
* toplam işletme
* aktif işletme
* bekleyen onaylar
* bugünkü randevu
* iptal edilen randevu
* aylık gelir
* günlük gelir
* başarısız ödeme
* destek talebi sayısı

Kartlar:

* modern
* floating
* gradient destekli
* mobil uyumlu
* dokunmatik dostu

---

### Grafikler

* kullanıcı büyümesi
* gelir grafiği
* abonelik dönüşümü
* randevu yoğunluğu
* işletme performansı
* retention

Filtreler:

* bugün
* 7 gün
* 30 gün
* 90 gün
* özel tarih aralığı

---

### Hızlı İşlemler

Dashboard üzerinden:

* kullanıcı banla
* işletme onayla
* abonelik iptal et
* ödeme iade et
* personel ekle
* randevu iptal et
* sistem bildirisi gönder

gibi aksiyonlar yapılabilmeli.

---

# 4. Kullanıcı Yönetimi

Tam kapsamlı kullanıcı yönetimi sistemi.

Özellikler:

Listeleme:

* tüm kullanıcılar
* aktif kullanıcılar
* pasif kullanıcılar
* banlı kullanıcılar
* premium kullanıcılar
* şüpheli kullanıcılar

İşlemler:

* kullanıcı görüntüle
* düzenle
* banla
* ban kaldır
* geçici askıya al
* doğrulama onayı ver
* abonelik ver
* abonelik iptal et
* cihazları gör
* oturumları kapat
* şifre sıfırlama tetikle
* geçmiş hareketleri görüntüle

Profil detayında:

* kullanıcı bilgileri
* abonelik geçmişi
* randevular
* ödeme geçmişi
* loglar
* cihaz geçmişi
* IP geçmişi
* destek kayıtları
* şikayetler

---

# 5. İşletme Yönetimi

Tam kapsamlı işletme yönetimi.

Admin:

* işletme ekleyebilsin
* düzenleyebilsin
* silebilsin
* askıya alabilsin
* onaylayabilsin
* reddedebilsin
* premium verebilsin

İşletme detayında:

* işletme bilgileri
* hizmetler
* personeller
* çalışma saatleri
* abonelik planı
* ödeme geçmişi
* değerlendirmeler
* randevu yoğunluğu
* kullanıcı şikayetleri
* performans istatistikleri

---

# 6. Personel Yönetimi

Admin şunları yapabilmeli:

* personel ekleme
* düzenleme
* silme
* görev değiştirme
* performans inceleme
* çalışma saati yönetimi
* izin yönetimi
* aktif/pasif yapma

---

# 7. Hizmet Yönetimi

Hizmetler yönetilebilir olmalı:

* ekle
* sil
* düzenle
* kategori yönetimi
* fiyat yönetimi
* kampanya ekleme
* görünürlük ayarı
* aktif/pasif

---

# 8. Randevu Yönetimi

Gerçek sistem gibi olmalı.

Admin:

* tüm randevuları görmeli
* filtrelemeli
* iptal etmeli
* yeniden planlamalı
* onaylamalı
* personel değiştirmeli
* müşteri değiştirmeli
* ücret düzenleyebilmeli

Filtreler:

* tarih
* işletme
* personel
* durum
* ödeme durumu

---

# 9. Abonelik Sistemi Yönetimi

Çok önemli.

Admin:

* abonelik planı oluştur
* düzenle
* sil
* fiyat değiştir
* ücretsiz deneme ver
* manuel premium ver
* iptal et
* yenile
* dondur
* geri aç

Plan örnekleri:

* ücretsiz
* premium
* business
* enterprise

Abonelik detayında:

* başlangıç tarihi
* bitiş tarihi
* ödeme geçmişi
* iptal nedeni
* kullanım istatistikleri

---

# 10. Ödeme Yönetimi

Admin:

* ödeme geçmişi
* başarısız ödeme
* iade
* manuel onay
* manuel ödeme ekleme
* makbuz inceleme

Destek:

* çoklu ödeme sistemi
* abonelik faturaları
* vergi bilgileri

---

# 11. Onay Süreçleri

Bekleyen:

* işletmeler
* personeller
* belgeler
* premium talepleri
* ödeme kanıtları

İşlemler:

* onayla
* reddet
* açıklama ekle

---

# 12. Bildirim Merkezi

Admin:

* toplu bildirim
* hedefli bildirim
* kampanya bildirisi
* bakım bildirisi
* push notification
* e-mail
* SMS

---

# 13. Destek ve Şikayet Sistemi

Admin:

* ticket sistemi
* cevap verme
* öncelik belirleme
* kullanıcı engelleme
* işletme inceleme
* şikayet çözümü

---

# 14. Log ve Güvenlik

ÇOK ÖNEMLİ.

Admin panelinde log sistemi olacak.

Kaydedilecek:

* girişler
* çıkışlar
* IP
* cihaz
* admin aksiyonları
* veri değişiklikleri
* silmeler
* ödeme işlemleri
* güvenlik olayları

Audit log zorunlu.

Örnek:

“Admin X kullanıcıyı banladı”

gibi.

---

# 15. Yetkilendirme Sistemi

Sadece tek admin değil.

Roller:

* Super Admin
* Admin
* Moderator
* Finance Admin
* Support Admin

Permission sistemi:

fine-grained olmalı.

Örnek:

Bir admin kullanıcı silemesin ama görebilsin.

---

# 16. Teknik Gereksinimler

Kod production seviyesinde olacak.

İstenilenler:

* clean architecture
* modüler yapı
* reusable component sistemi
* responsive design system
* state management düzgün
* loading state
* empty state
* error state
* skeleton loading
* optimistic UI
* pagination
* search
* filter
* sorting
* debounce
* caching

---

# 17. UI Gereksinimleri

Kullan:

* floating cards
* sticky top bar
* FAB butonlar
* bottom sheet
* swipe actions
* animated transitions
* modern dialogs
* mobile-friendly tables
* smart filters
* collapsible sections

---

# 18. Performans

Şunlara dikkat:

* hızlı açılış
* lazy loading
* pagination
* virtualized list
* düşük RAM kullanımı
* düşük network maliyeti

---

# 19. Hata Durumları

Her işlem için:

* loading
* success
* retry
* toast
* confirmation modal

zorunlu.

Örneğin:

“Kullanıcı silinsin mi?”

Onaysız işlem olmasın.

---

# 20. Son Beklenti

Bu admin panelini sıradan değil, gerçek hayatta kullanılacak premium SaaS işletme yönetim sistemi seviyesinde oluştur.

Mobil uyumluluk en yüksek öncelik.

Her modül profesyonel organize edilmeli.

Tüm sistemler birbirine bağlı çalışmalı.

Admin uygulama içindeki her şeye erişebilmeli:

* onaylama
* banlama
* silme
* düzenleme
* ekleme
* abonelik yönetimi
* ödeme yönetimi
* randevu yönetimi
* işletme yönetimi
* personel yönetimi
* kullanıcı yönetimi
* log görüntüleme
* sistem ayarları

Eksik modül bırakma.

Kod mimarisi ve UI production kalitesinde olsun.

“Gerçek şirket admin paneli” hissi versin.
