# 🚀 DEPLOYMENT GUIDE - KRİTİK GÜVENLİK DÜZELTMELERİ

**Tarih:** 20 Temmuz 2026  
**Öncelik:** ACİL - Production güvenlik açıkları  
**Kapsam:** FAZ 1 (9 açık) + FAZ 2 (7 açık) = 16 kritik düzeltme

## ⚠️ ÖNEMLİ UYARILAR

1. **BACKUP ALIN:** Tüm Firestore verisini export edin
2. **TEST EDİN:** Önce staging/preview ortamında test edin
3. **ZAMANLAYIN:** Düşük trafik saatinde deploy edin
4. **İZLEYİN:** Deploy sonrası hata loglarını yakından takip edin

## 📋 Deployment Checklist

### Hazırlık (Deploy Öncesi)

- [ ] **Firestore Backup**
  ```bash
  # Firebase Console → Firestore Database → Import/Export
  # veya gcloud CLI ile:
  gcloud firestore export gs://[BUCKET_NAME]/[BACKUP_FOLDER]
  ```

- [ ] **Git Commit**
  ```bash
  git add .
  git commit -m "🔒 Critical security fixes - 2026-07-20"
  git push origin main
  ```

- [ ] **Dependencies Güncellendi mi?**
  ```bash
  npm install
  cd functions && npm install && cd ..
  ```

### 1. Firestore Rules Deploy (EN KRİTİK - İLK ADIM)

```bash
# Önce rules'u kontrol edin
firebase firestore:rules

# Deploy edin
firebase deploy --only firestore:rules

# Başarılı olduğunu doğrulayın
firebase firestore:rules:list
```

**✅ Beklenen Çıktı:**
```
✔  firestore: rules file rules compiled successfully
✔  firestore: released rules ...
```

**Değişiklikler:**
- ✅ FAZ 1: 9 kritik açık kapatıldı
- ✅ FAZ 2: Reviews, rateLimits koleksiyonları eklendi

### 1b. Storage Rules Deploy (YENİ - KRİTİK)

```bash
# Storage rules'u deploy edin
firebase deploy --only storage

# Doğrulayın
firebase deploy --only storage --dry-run
```

**✅ Beklenen Çıktı:**
```
✔  storage: rules file storage.rules deployed successfully
```

### 2. Cloud Functions Deploy

```bash
cd functions

# Build edin
npm run build

# Deploy edin (sadece değiştirilenler)
firebase deploy --only functions:createReservationWithValidation

# Veya tüm functions:
firebase deploy --only functions

cd ..
```

**✅ Beklenen Çıktı:**
```
✔  functions[createReservationWithValidation(...)]: Successful update operation
```

**Deployment Süresi:** ~2-3 dakika

### 3. Frontend Hosting Deploy

#### Vercel (Primary)

```bash
# Production build
npm run build

# Test build locally
npm run preview

# Deploy to production
vercel --prod
```

**✅ Beklenen Çıktı:**
```
✔  Production: https://app-ruby-ten-20.vercel.app
```

#### Firebase Hosting (Backup)

```bash
npm run build
firebase deploy --only hosting
```

### 4. Post-Deploy Doğrulama

#### Test 1: Firestore Rules Çalışıyor mu?
```bash
# Browser console'da test edin (yetkisiz erişim denemesi):
await updateDoc(doc(db, 'reservations', 'ANY_ID'), { status: 'cancelled' });
# Beklenen: "Missing or insufficient permissions"
```

#### Test 2: Backend Validation Aktif mi?
```bash
# Browser console'da:
console.log(useBookingStore.getState());
# USE_BACKEND_VALIDATION: true olmalı
```

#### Test 3: Yeni Rezervasyon Oluşturma
```bash
# UI'dan normal bir rezervasyon oluşturun
# Console'da "Using backend validation..." mesajı görülmeli
# Network tab'da "createReservationWithValidation" isteği olmalı
```

#### Test 4: Çifte Rezervasyon Koruması
```bash
# İki tarayıcıdan aynı saati seçip eşzamanlı submit edin
# Sadece biri geçmeli, diğeri "artık müsait değil" hatası almalı
```

## 🔐 2FA Aktivasyonu (Deploy Sonrası)

### Admin Hesapları için 2FA Açma

1. **Firebase Console'a gidin:**
   ```
   https://console.firebase.google.com/project/[PROJECT_ID]/authentication/users
   ```

2. **Her admin kullanıcı için:**
   - Kullanıcıya tıklayın
   - "Multi-factor authentication" bölümüne gidin
   - "Enroll" butonuna tıklayın
   - Kullanıcının telefonuna SMS kod gönderilir
   - Kullanıcıdan kodu girmesini isteyin

3. **Zorunlu 2FA (İsteğe Bağlı):**
   ```
   Authentication → Settings → Multi-factor authentication
   → "Require multi-factor authentication for your project"
   ```

### Admin Kullanıcı Listesi
- adistow@gmail.com
- admin@restoqr.com
- minif@restoqr.com
- minifinise@gmail.com

## 📊 Monitoring (Deploy Sonrası İzleme)

### 1. Firebase Console Monitoring

```
https://console.firebase.google.com/project/[PROJECT_ID]/overview
```

**İzlenecekler:**
- Functions → createReservationWithValidation → Success rate
- Firestore → Usage → Read/Write counts
- Authentication → Users → Active users

### 2. Error Logging

```bash
# Cloud Functions logs
firebase functions:log --only createReservationWithValidation

# Son 100 log
firebase functions:log --limit 100

# Live tail
firebase functions:log --follow
```

### 3. Firestore Rules Debug

```bash
# Rules simulator
# Firebase Console → Firestore → Rules → Simulator
# Test senaryoları çalıştırın
```

## 🆘 Rollback Planı

### Eğer Bir Şeyler Ters Giderse

#### 1. Firestore Rules Rollback
```bash
# Eski rules'u geri yükleyin
firebase deploy --only firestore:rules
# veya Firebase Console'dan previous version'ı restore edin
```

#### 2. Functions Rollback
```bash
# Functions Console'dan previous version'a dön
# veya git'ten eski commiti deploy edin:
git checkout [PREVIOUS_COMMIT]
cd functions && firebase deploy --only functions && cd ..
git checkout main
```

#### 3. Frontend Rollback (Vercel)
```
Vercel Dashboard → Deployments → Previous deployment → "Promote to Production"
```

## ✅ Deployment Başarılı - Son Kontrol

- [ ] Firestore rules deploy edildi
- [ ] Cloud Functions çalışıyor
- [ ] Frontend güncel
- [ ] Yeni rezervasyon oluşturulabiliyor
- [ ] Fiyat validasyonu çalışıyor
- [ ] Çifte rezervasyon engelleniyor
- [ ] Yetkisiz erişim engelleniyor
- [ ] 2FA aktif (admin hesapları)
- [ ] Monitoring izleniyor
- [ ] Team bilgilendirildi

## 📞 Destek

Sorun yaşarsanız:
1. Firebase Console → Support
2. GitHub Issues: [REPO_URL]/issues
3. Team Lead ile iletişime geçin

---

**Not:** Bu deployment guide kritik güvenlik açıklarını kapatıyor. Mutlaka tamamlanmalıdır.
