# 🧪 Test Senaryoları - Restoran Abonelik Sistemi

## 📋 Test Kontrol Listesi

### ✅ 1. Yeni Kullanıcı Kaydı ve Deneme Süresi

#### Test Adımları:
1. Yeni bir hesap oluştur (owner rolü ile)
2. Dashboard'a gir
3. Abonelik bölümünü kontrol et

#### Beklenen Sonuçlar:
- ✅ Otomatik 7 günlük deneme başlamalı
- ✅ Durum: "Deneme Süresi" (mavi badge)
- ✅ "X gün kaldı" mesajı görünmeli
- ✅ Profesyonel paket özellikleri aktif olmalı
- ✅ Tüm özellikler kullanılabilir olmalı

---

### ✅ 2. Restoran Plan Limitleri

#### A) Başlangıç Paketi
```
Test: Başlangıç paketini seç
Kontrol:
- ✅ 10 masa gösteriliyor mu?
- ✅ 20 menü ürünü gösteriliyor mu?
- ✅ 5 kategori gösteriliyor mu?
- ✅ 300 aylık sipariş gösteriliyor mu?
- ❌ Personel gösterilmiyor mu?
```

#### B) Profesyonel Paket
```
Test: Profesyonel paketi seç
Kontrol:
- ✅ 25 masa gösteriliyor mu?
- ✅ 50 menü ürünü gösteriliyor mu?
- ✅ 15 kategori gösteriliyor mu?
- ✅ 1000 aylık sipariş gösteriliyor mu?
- ❌ Personel gösterilmiyor mu?
```

#### C) İşletme Paketi
```
Test: İşletme paketini seç
Kontrol:
- ✅ 50 masa gösteriliyor mu?
- ✅ 100 menü ürünü gösteriliyor mu?
- ✅ 30 kategori gösteriliyor mu?
- ✅ 3000 aylık sipariş gösteriliyor mu?
- ❌ Personel gösterilmiyor mu?
```

---

### ✅ 3. Masa Ekleme Limit Kontrolü

#### Test Senaryosu 1: Başlangıç Paketi
```javascript
// 1. Başlangıç paketi seç (10 masa limiti)
// 2. 10 masa ekle
// 3. 11. masayı eklemeye çalış

Beklenen Sonuç:
- ❌ Hata mesajı: "Masa limiti aşıldı!"
- 💡 "STARTER paketinizde maksimum 10 masa ekleyebilirsiniz"
- 🔼 "Paketi Yükselt" butonu görünmeli
```

#### Test Senaryosu 2: Profesyonel Paket
```javascript
// 1. Profesyonel paketi seç (25 masa)
// 2. 25 masa ekle
// 3. 26. masayı eklemeye çalış

Beklenen Sonuç:
- ❌ Hata mesajı görünmeli
- 💡 Limit açıklaması doğru olmalı
```

---

### ✅ 4. Menü Ürünü Ekleme Limit Kontrolü

#### Test Senaryosu 1: Başlangıç Paketi
```javascript
// 1. Başlangıç paketi seç (20 ürün limiti)
// 2. 20 ürün ekle
// 3. 21. ürünü eklemeye çalış

Beklenen Sonuç:
- ❌ "Menü ürünü limiti aşıldı!"
- 💡 "STARTER paketinizde maksimum 20 ürün ekleyebilirsiniz"
- 🔼 "Paketi Yükselt" butonu
```

#### Test Senaryosu 2: Profesyonel Paket
```javascript
// 1. Profesyonel paketi seç (50 ürün)
// 2. 50 ürün ekle
// 3. 51. ürünü eklemeye çalış

Beklenen Sonuç:
- ❌ Limit hatası görünmeli
```

---

### ✅ 5. Deneme Süresi Güvenlik Testleri

#### Test 1: İkinci Kez Trial Alamama
```javascript
// 1. İlk kayıt → Trial başlar
// 2. Trial biter veya abonelik al
// 3. Aboneliği iptal et
// 4. Yeni trial almaya çalış

Beklenen Sonuç:
- ❌ "Bu işletme daha önce trial kullanmış"
- ✅ Trial tekrar başlamamalı
```

#### Test 2: Trial Bypass Denemesi
```javascript
// 1. Trial al
// 2. History kayıtlarını silmeye çalış
// 3. Tekrar trial almaya çalış

Beklenen Sonuç:
- ❌ trialUsed flag kontrol edilmeli
- ❌ Trial tekrar verilemez
```

---

### ✅ 6. UI/UX Testleri

#### A) Restoran Subscription Modal
```
Test: Restoran kategorisi → Abonelik aç
Kontrol:
- ✅ Restoran ikonu görünüyor mu?
- ✅ "Restoran Abonelik Planları" başlığı var mı?
- ✅ 5 plan kartı görünüyor mu?
- ✅ Personel satırı YOK mu?
- ✅ Masa, menü, kategori bilgileri doğru mu?
```

#### B) Plan Kartları
```
Her plan kartında olması gerekenler:
- ✅ Plan ikonu ve rengi
- ✅ Plan adı ve açıklama
- ✅ Fiyat bilgisi
- ✅ Masa sayısı (🍴 ikonu)
- ✅ Menü ürünü sayısı (👨‍🍳 ikonu)
- ❌ Personel satırı YOK
- ✅ QR Kod menü özelliği
- ✅ "Paketi Seç" butonu
```

#### C) Dönem İndirim Badge'leri
```
Test: Dönem seçici
Kontrol:
- ✅ Aylık: İndirim yok
- ✅ 3 Aylık: %10 badge
- ✅ 6 Aylık: %15 badge
- ✅ Yıllık: %20 badge
```

---

### ✅ 7. Farklı İşletme Tipleri Testi

#### Test: Kuaför + Berber + Restoran
```javascript
// Kuaför kayıt ol
- ✅ Normal abonelik paketleri görünmeli
- ✅ 7 günlük trial başlamalı
- ✅ Personel limiti gösterilmeli

// Restoran kayıt ol
- ✅ Restoran paketleri görünmeli
- ✅ 7 günlük trial başlamalı
- ❌ Personel limiti gösterilmemeli

// Berber kayıt ol
- ✅ Normal paketler görünmeli
- ✅ 7 günlük trial başlamalı
- ✅ Personel limiti gösterilmeli
```

---

### ✅ 8. Trial Süre Dolumu Testi

#### Test Adımları:
```javascript
// 1. Yeni işletme kayıt ol
// 2. 7 gün bekle (veya tarihi manuel değiştir)
// 3. Dashboard'a gir

Beklenen Sonuçlar:
- ❌ "Aboneliğiniz sona erdi" mesajı
- 🔴 Kırmızı badge
- ❌ Özellikler kullanılamaz
- 💳 "Paket Seç" butonu zorunlu
```

---

### ✅ 9. Paket Yükseltme Testi

#### Test Senaryosu:
```javascript
// 1. Başlangıç paketi al (10 masa, 20 ürün)
// 2. 10 masa ekle
// 3. Limit doldu → "Paketi Yükselt" tıkla
// 4. Profesyonel paketi seç (25 masa, 50 ürün)
// 5. Admin onaylasın
// 6. Yeni limitlerle devam et

Beklenen Sonuçlar:
- ✅ Admin onay beklemeli
- ✅ Onaylandıktan sonra yeni limitler aktif
- ✅ 25 masaya kadar eklenebilmeli
- ✅ 50 ürüne kadar eklenebilmeli
```

---

### ✅ 10. Kategori Limit Testi

#### Test Senaryosu:
```javascript
// Başlangıç paketi: 5 kategori limiti
// 1. 5 kategori ekle
// 2. 6. kategoriyi eklemeye çalış

Beklenen Sonuç:
- ❌ "Kategori limiti aşıldı!"
- 💡 Paket yükseltme önerisi
```

---

## 🎯 Kritik Test Noktaları

### ZORUNLU Testler:
1. ✅ **7 günlük trial** - TÜM işletme tipleri
2. ✅ **Personel gösterimi YOK** - Restoran paketlerinde
3. ✅ **Menü limitleri:** 20, 50, 100 (kademeli)
4. ✅ **Masa limitleri:** 10, 25, 50
5. ✅ **Trial bypass engelleme** - Güvenlik
6. ✅ **Limit aşımı bildirimleri** - Toast mesajları
7. ✅ **Paket yükseltme akışı** - Admin onay sistemi

---

## 🐛 Bilinen Sorunlar ve Çözümler

### Sorun 1: Personel hala görünüyor
**Çözüm:** 
- RestaurantSubscriptionModal.tsx kontrol et
- RestaurantSubscriptionPlans.tsx kontrol et
- maxStaff satırlarını kaldır

### Sorun 2: Limit kontrolleri çalışmıyor
**Çözüm:**
- TableManagement.tsx → maxTables kontrolü
- MenuManagement.tsx → maxMenuItems kontrolü
- Plan features doğru import edilmiş mi?

### Sorun 3: Trial 2. kez alınabiliyor
**Çözüm:**
- trialUsed flag kontrol et
- History kayıtları kontrol et
- subscriptionService.ts güvenlik kontrolleri

---

## 📊 Test Sonuç Tablosu

| Test No | Test Adı | Durum | Notlar |
|---------|----------|-------|--------|
| 1 | Yeni kullanıcı trial | ⏳ | Test edilecek |
| 2 | Restoran plan limitleri | ⏳ | Test edilecek |
| 3 | Masa ekleme limiti | ⏳ | Test edilecek |
| 4 | Menü ekleme limiti | ⏳ | Test edilecek |
| 5 | Trial güvenlik | ⏳ | Test edilecek |
| 6 | UI görünüm | ⏳ | Test edilecek |
| 7 | Farklı işletmeler | ⏳ | Test edilecek |
| 8 | Trial süre dolumu | ⏳ | Test edilecek |
| 9 | Paket yükseltme | ⏳ | Test edilecek |
| 10 | Kategori limiti | ⏳ | Test edilecek |

**Durum Anahtarı:**
- ⏳ Test edilecek
- ✅ Başarılı
- ❌ Hata var
- 🔄 Düzeltildi

---

## 🚀 Hızlı Test Komutları

```bash
# TypeScript tip kontrolü
npx tsc --noEmit

# Lint kontrolü
npm run lint

# Build
npm run build

# Dev sunucu
npm run dev
```

**Test öncesi kontrol listesi:**
- ✅ TypeScript hataları yok
- ✅ Build başarılı
- ✅ Console'da hata yok
- ✅ Network istekleri başarılı
