# ⚡ ACİL AKSİYONLAR - KRİTİK GÜVENLİK

**Durum:** 🔴 ACİL - Hemen yapılmalı  
**Tarih:** 20 Temmuz 2026

## 🚨 İLK 30 DAKİKA

### 1. Firestore Rules Deploy (5 dakika)
```bash
firebase deploy --only firestore:rules
```
**Etki:** Yetkisiz rezervasyon değiştirme, veri sızıntısı, abonelik bypass kapatılır

### 2. Frontend Deploy (10 dakika)
```bash
npm run build
vercel --prod
```
**Etki:** Backend fiyat validasyonu aktif olur, çifte rezervasyon koruması devreye girer

### 3. Quick Test (5 dakika)
- [ ] Yeni rezervasyon oluştur (başarılı olmalı)
- [ ] Console'da "Using backend validation" mesajı gör
- [ ] Başkasının rezervasyonunu değiştirmeyi dene (hata almalısın)

## 📋 BUGÜN YAPILACAKLAR

### Güvenlik (2 saat)

- [ ] **2FA Aktif Et** (30 dk)
  - Firebase Console → Authentication → Users
  - Admin hesapları için 2FA aç
  - Test et

- [ ] **Admin Email Kontrolü** (15 dk)
  - Firebase Console → Authentication
  - Custom claims kontrol et (`admin: true`)
  - Email fallback kaldırıldığından emin ol

- [ ] **Monitoring Kur** (30 dk)
  - Firebase Console → Functions → Logs
  - Hata bildirimleri aktif et
  - Slack/email entegre et

- [ ] **Güvenlik Testi** (45 dk)
  - `TEST_SECURITY_FIXES.md` dosyasındaki testleri çalıştır
  - Sonuçları kaydet

### Deployment (1 saat)

- [ ] **Cloud Functions Deploy** (30 dk)
  ```bash
  cd functions
  npm run build
  firebase deploy --only functions
  ```

- [ ] **Post-Deploy Doğrulama** (30 dk)
  - Tüm critical paths test et
  - Error rate izle
  - User feedback topla

## 🗓️ BU HAFTA YAPILACAKLAR

### Veri Göçü (3-4 saat)

- [ ] **Appointments → Reservations Migration** (2 saat)
  ```bash
  npm run migrate:appointments
  ```
  - Firestore backup al
  - Migration script çalıştır
  - Veri doğrula
  - OwnerDashboard'u güncelle

- [ ] **Eski Koleksiyon Arşivleme** (1 saat)
  - Appointments koleksiyonunu arşivle
  - 1 hafta sonra sil (eğer sorun yoksa)

### Kod Temizliği (4-5 saat)

- [ ] **Console.log Temizliği** (2 saat)
  - Logger utility import et: `import { logger } from '@/utils/logger'`
  - Critical dosyalarda console.log → logger.log değiştir
  - ESLint kuralı devrede olduğundan emin ol

- [ ] **TypeScript Any Azaltma** (2 saat)
  - Para hesaplama kodlarından başla
  - `reservationService.ts`
  - `bookingStore.ts`
  - `subscriptionService.ts`

### Testing (4-6 saat)

- [ ] **Birim Testleri Yaz** (4 saat)
  - Fiyat hesaplama testleri
  - Double-booking test senaryoları
  - Firestore rules testleri (@firebase/rules-unit-testing)

- [ ] **CI/CD Pipeline** (2 saat)
  - GitHub Actions veya Cloud Build
  - ESLint + tsc otomatik
  - Rules testleri otomatik

## 📅 BU AY YAPILACAKLAR

### Mimari İyileştirme

- [ ] **firebase-admin Taşıma**
  - `src/config/firebase-admin.ts` → `functions/` klasörüne
  - Vite exclude config ekle

- [ ] **Frontend Klasörü Temizliği**
  - Yarım kalmış `frontend/` klasörünü sil
  - Veya ayrı repo'ya taşı

### Dokümantasyon

- [ ] **API Dokümantasyonu**
  - Cloud Functions endpoint'leri
  - Request/response formatları
  - Hata kodları

- [ ] **Güvenlik Politikası**
  - SECURITY.md oluştur
  - Vulnerability reporting süreci
  - Responsible disclosure

### Performance

- [ ] **Bundle Size Optimizasyonu**
  - Lighthouse audit çalıştır
  - Lazy loading ekle
  - Code splitting

- [ ] **Firestore Query Optimizasyonu**
  - Composite index'ler kontrol et
  - N+1 query problemlerini çöz

## 📊 İlerleme Takibi

| Kategori | Tamamlanan | Toplam | Yüzde |
|----------|-----------|--------|-------|
| Bugün (Güvenlik) | 0 | 7 | 0% |
| Bu Hafta | 0 | 6 | 0% |
| Bu Ay | 0 | 5 | 0% |
| **TOPLAM** | **0** | **18** | **0%** |

## 🎯 Başarı Kriterleri

### Güvenlik
- ✅ Tüm security testleri geçiyor
- ✅ 2FA aktif (admin hesapları)
- ✅ Yetkisiz erişim engelleniyor
- ✅ Fiyat manipülasyonu imkansız
- ✅ Çifte rezervasyon engelleniyor

### Kod Kalitesi
- ✅ 0 adet production console.log
- ✅ <50 adet `: any` kullanımı
- ✅ ESLint 0 error
- ✅ TypeScript 0 error
- ✅ Test coverage >70%

### Performance
- ✅ Lighthouse Performance >90
- ✅ First Contentful Paint <1.5s
- ✅ Time to Interactive <3s

## 🆘 Acil Durumda

Sorun yaşarsanız:
1. `DEPLOYMENT_GUIDE.md` → Rollback Planı
2. Firebase Console → Logs
3. GitHub Issues
4. Team Lead

---

**Not:** İlk 30 dakika kritik, geri kalanı öncelik sırasına göre planlayın.
