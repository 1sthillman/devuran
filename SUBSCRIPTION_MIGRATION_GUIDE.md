# Subscription Migration Guide

## Sorun
Mevcut subscription dokümanlarının ID'si rastgele oluşturulmuş. Yeni sistemde ID = businessId olmalı.

## Neden Değiştirdik?
1. **Firestore Rules Basitleşti** - businessId'yi ID'den okuyabiliriz
2. **Query Gereksiz** - Direkt `getDoc(businessId)` kullanabiliriz
3. **Her Business 1 Subscription** - Daha temiz veri modeli

## Manuel Migration (Firebase Console)

### Adım 1: Mevcut Subscription'ı Bul
1. Firebase Console'a git: https://console.firebase.google.com/project/ruloposs/firestore
2. `subscriptions` collection'ına tıkla
3. Mevcut subscription dokümanını bul
4. `businessId` field'ını not et (örn: `DLbNzdU5yGTaA1xiSACC`)

### Adım 2: Yeni Doküman Oluştur
1. `subscriptions` collection'ında "Add document" butonuna tıkla
2. **Document ID** olarak `businessId`'yi gir (örn: `DLbNzdU5yGTaA1xiSACC`)
3. Eski dokümanın tüm field'larını kopyala-yapıştır
4. "Save" butonuna tıkla

### Adım 3: Eski Dokümanı Sil
1. Eski dokümanı (rastgele ID'li) seç
2. "Delete document" butonuna tıkla
3. Onayla

### Adım 4: Test Et
1. Tarayıcıyı yenile
2. OwnerDashboard'ın yüklendiğini kontrol et
3. Subscription bilgilerinin göründüğünü kontrol et
4. Console'da hata olmadığını kontrol et

## Otomatik Migration (İsteğe Bağlı)

Eğer çok sayıda subscription varsa, migration script'i kullanabilirsin:

```bash
# 1. Firebase Admin SDK'yı kur
npm install firebase-admin

# 2. Service account key indir
# Firebase Console > Project Settings > Service Accounts > Generate new private key

# 3. Key dosyasını kaydet
# serviceAccountKey.json olarak proje root'una kaydet

# 4. Script'i çalıştır
npx ts-node scripts/migrateSubscriptions.ts
```

## Doğrulama

Migration sonrası kontrol edilmesi gerekenler:

- [ ] Subscription ID = businessId
- [ ] Tüm field'lar korunmuş
- [ ] OwnerDashboard yükleniyor
- [ ] Usage stats güncellenebiliyor
- [ ] Subscription satın alma çalışıyor
- [ ] Subscription history okunabiliyor

## Rollback (Geri Alma)

Eğer bir sorun olursa:
1. Yeni dokümanı sil (ID = businessId)
2. Eski dokümanı geri yükle (backup'tan)
3. Firestore rules'ı eski haline döndür
4. Code'u eski commit'e döndür

## Notlar

- ⚠️ Migration sırasında subscription servisi kısa süre çalışmayabilir
- ✅ Migration sonrası yeni subscription'lar otomatik olarak doğru formatta oluşturulacak
- ✅ Her business'in sadece 1 aktif subscription'ı olacak
- ✅ Firestore rules çok daha basit ve performanslı olacak
