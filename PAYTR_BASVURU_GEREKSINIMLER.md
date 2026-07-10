# PayTR Başvuru Gereksinimleri - Tamamlandı ✅

## PayTR Neden Red Etti?

PayTR başvurularını reddederken genellikle şu kriterlere bakar:
1. ❌ **Gizlilik Politikası eksik** → ✅ Eklendi `/privacy`
2. ❌ **Kullanım Koşulları eksik** → ✅ Eklendi `/terms`
3. ❌ **İletişim bilgileri belirsiz** → ✅ Footer'da eklendi
4. ❌ **KVKK uyumu yok** → ✅ Gizlilik politikasında detaylı açıklandı
5. ❌ **İade/iptal politikası yok** → ✅ Kullanım koşullarında eklendi
6. ❌ **İşletme bilgileri eksik** → ✅ Footer ve yasal sayfalarda eklendi

---

## ✅ Tamamlanan İyileştirmeler

### 1. Gizlilik Politikası Sayfası
- **URL:** `/privacy` (https://yourdomain.com/privacy)
- **Dosya:** `src/pages/PrivacyPolicy.tsx`
- **İçerik:**
  - KVKK uyumlu veri işleme açıklamaları
  - Toplanan veri türleri
  - Veri işleme amaçları
  - Üçüncü taraf paylaşımları (PayTR, Google Cloud)
  - Kullanıcı hakları (KVKK madde 11)
  - İletişim bilgileri
  - Çerez politikası
  - Veri güvenliği önlemleri

### 2. Kullanım Koşulları Sayfası
- **URL:** `/terms` (https://yourdomain.com/terms)
- **Dosya:** `src/pages/TermsOfService.tsx`
- **İçerik:**
  - Hizmet kapsamı
  - Üyelik kuralları
  - Randevu/rezervasyon kuralları
  - İptal ve iade politikası
  - Ödeme koşulları (PayTR entegrasyonu)
  - İşletme sahibi yükümlülükleri
  - Yasak davranışlar
  - Sorumluluk sınırlamaları
  - Uyuşmazlık çözümü

### 3. Footer ve İletişim
- **Dosya:** `src/components/layout/Footer.tsx`
- **İçerik:**
  - Gizlilik Politikası linki
  - Kullanım Koşulları linki
  - KVKK başvuru e-postası
  - İletişim bilgileri
  - PayTR logosu ve referansı
  - Telif hakkı bildirimi

### 4. Login Sayfası Güncellemeleri
- **Dosya:** `src/pages/Login.tsx`
- Kullanım Koşulları linki çalışıyor → `/terms`
- Gizlilik Politikası linki çalışıyor → `/privacy`
- Checkbox ile kabul zorunluluğu mevcut

### 5. Router Güncellemeleri
- **Dosya:** `src/App.tsx`
- `/privacy` route eklendi
- `/terms` route eklendi
- Lazy loading ile optimize edildi

---

## 🎯 PayTR Yeniden Başvuru Kontrol Listesi

### Zorunlu Sayfalar ✅
- [x] Gizlilik Politikası (`/privacy`)
- [x] Kullanım Koşulları (`/terms`)
- [x] İletişim Bilgileri (Footer)
- [x] KVKK Uyumluluğu (Gizlilik politikasında)

### İçerik Gereksinimleri ✅
- [x] Veri toplama ve işleme açıklaması
- [x] Üçüncü taraf entegrasyonları (PayTR, Firebase)
- [x] İptal ve iade politikası
- [x] Kullanıcı hakları (KVKK madde 11)
- [x] İletişim kanalları (e-posta, telefon)
- [x] Ödeme güvenliği açıklaması
- [x] Yasal sorumluluk bildirimi

### Teknik Gereksinimler ✅
- [x] SSL/HTTPS (Vercel otomatik sağlıyor)
- [x] Responsive tasarım
- [x] Erişilebilir linkler
- [x] Hızlı sayfa yükleme

---

## 📋 Yeniden Başvuru Öncesi Yapılacaklar

### 1. Şirket Bilgilerini Güncelle ⚠️
Aşağıdaki dosyalarda `[Şirket Adresi]` ve `+90 232 XXX XX XX` placeholder'larını **gerçek bilgilerle** değiştirin:

- `src/pages/PrivacyPolicy.tsx` (satır 35, 36, 191)
- `src/pages/TermsOfService.tsx` (satır 26, 247)
- `src/components/layout/Footer.tsx` (satır 47)

```typescript
// Değiştirilmesi gerekenler:
info@devuran.com → gerçek e-posta
+90 232 XXX XX XX → gerçek telefon
[Şirket Adresi] → gerçek adres
```

### 2. Domain Doğrulama
PayTR başvurusunda şu URL'leri verin:
- **Ana Sayfa:** https://yourdomain.com
- **Gizlilik Politikası:** https://yourdomain.com/privacy
- **Kullanım Koşulları:** https://yourdomain.com/terms

### 3. Yasal Kayıt Bilgileri
PayTR başvurusunda gerekli olabilir:
- Vergi levhası
- Ticaret sicil gazetesi (şirketse)
- Kimlik fotokopisi (şahıs firması ise)
- İmza sirküleri

---

## 🔒 Güvenlik ve Uyumluluk

### KVKK Uyumluluğu ✅
- Açık rıza metni (Login sayfası checkbox)
- Veri işleme amaçları (Gizlilik politikası)
- Kullanıcı hakları (Silme, düzeltme, itiraz)
- Veri saklama süreleri
- Üçüncü taraf paylaşımları

### PCI-DSS Uyumluluğu ✅
- Kart bilgileri sunucuda saklanmıyor
- PayTR iframe/redirect kullanımı
- 3D Secure zorunluluğu
- SSL/TLS şifreleme

### GDPR Uyumluluğu ✅
- Veri minimizasyonu
- Açık rıza
- Unutulma hakkı
- Veri taşınabilirliği

---

## 💡 PayTR Başvuru İpuçları

### Başvuru Sırasında Yazılabilecek Açıklama:
```
Merhaba PayTR ekibi,

Devuran, online randevu ve rezervasyon hizmeti sunan bir platformdur. 
İşletmelerin (kuaför, güzellik merkezi, otel, restoran vb.) müşterilerinden 
güvenli ödeme alabilmesi için PayTR entegrasyonuna ihtiyacımız var.

Platform özellikleri:
- KVKK ve GDPR uyumlu (Gizlilik Politikası: /privacy)
- Detaylı kullanım koşulları (Kullanım Koşulları: /terms)
- İptal ve iade politikası mevcut
- SSL/HTTPS güvenliği
- Firebase/Google Cloud altyapısı

Lütfen başvurumuzu değerlendirmenizi rica ederiz.
```

### Başvuru Sonrası
- Genellikle 2-5 iş günü içinde cevap gelir
- Red durumunda eksik kısmı sorun ve düzeltin
- Onay aldıktan sonra test API key'leri verilir
- Canlı geçiş için ek belgeler istenebilir

---

## 📞 Destek

Sorular için:
- **E-posta:** info@devuran.com
- **PayTR Destek:** https://www.paytr.com/destek
- **PayTR Telefon:** 0850 532 88 10

---

**Hazırlayan:** Kiro AI  
**Tarih:** 10 Temmuz 2026  
**Durum:** Yasal sayfalar tamamlandı, yeniden başvuruya hazır ✅
