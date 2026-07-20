# 🔥 ACİL: Firebase Blaze Planına Yükseltme Gerekli

## ⚠️ KRİTİK SORUN

Müşteriler şu anda rezervasyon yapabiliyor ama **güvenlik riski var**:
- Backend fiyat doğrulaması çalışmıyor
- Cloud Functions deploy edilemiyor (Blaze plan gerekli)
- Client-side fiyat manipülasyonu mümkün

## ✅ ÇÖZÜM - 3 ADIM

### 1️⃣ Firebase Projesini Blaze Planına Yükseltin

🔗 **Direkt Link:** https://console.firebase.google.com/project/ruloposs/usage/details

**Adımlar:**
1. Yukarıdaki linke tıklayın
2. "Upgrade to Blaze" butonuna tıklayın
3. Kredi kartı bilgilerini girin
4. **Maliyet:** Genelde $0-5/ay (düşük trafikte)

**Blaze Plan Avantajları:**
- Cloud Functions kullanımı
- Daha yüksek Firestore limitleri
- Daha hızlı performans

---

### 2️⃣ Cloud Function'ı Deploy Edin

Blaze plan aktif olduktan sonra:

```bash
# Terminal'de:
npx firebase deploy --only functions:createReservationWithValidation
```

**Beklenen Çıktı:**
```
✔  functions[createReservationWithValidation]: Successful create operation.
Function URL: https://europe-west1-ruloposs.cloudfunctions.net/createReservationWithValidation
```

---

### 3️⃣ Backend Validation'ı Aktif Edin

**Dosya:** `src/store/bookingStore.ts`

**Değişiklik:**
```typescript
// Satır 18 civarı:
const USE_BACKEND_VALIDATION = false; // ❌ Şu an false

// Bunu true yapın:
const USE_BACKEND_VALIDATION = true; // ✅ true yapın
```

**Sonra:**
```bash
# Değişiklikleri commit edin
git add .
git commit -m "feat: backend validation aktif"
git push
```

---

## 📊 ŞU ANKİ DURUM

| Özellik | Durum | Risk |
|---------|-------|------|
| Müşteri Rezervasyonu | ✅ Çalışıyor | - |
| Fiyat Doğrulama | ❌ Devre Dışı | ⚠️ Yüksek |
| Backend Validation | ❌ Deploy Edilemedi | ⚠️ Kritik |
| Firebase Plan | 🔴 Spark (Ücretsiz) | ⚠️ Cloud Functions yok |

---

## 💰 MALİYET TAHMİNİ

**Blaze Plan (Pay-as-you-go):**
- İlk 2M Cloud Function çağrısı: **Ücretsiz**
- Sonraki çağrılar: ~$0.40 / milyon
- Aylık tahmini: **$0-5** (düşük/orta trafikte)

**Örnek:**
- 1000 rezervasyon/ay = **$0**
- 10,000 rezervasyon/ay = **$0-2**
- 100,000 rezervasyon/ay = **$3-5**

---

## 🛡️ GÜVENLİK RİSKİ

**Şu an:**
```typescript
// Client-side fiyat hesaplama
const totalPrice = roomPrice + extrasTotal; // ❌ Manipüle edilebilir
await firestore.collection('reservations').add({ totalPrice });
```

**Backend validation ile:**
```typescript
// Backend fiyatı yeniden hesaplıyor
const result = await backend.createReservation({ services });
// Backend: validatedPrice = 1500₺ (client 100₺ gönderse bile)
```

---

## ❓ SORULAR

**S: Blaze plan otomatik ücretlendirme yapıyor mu?**
C: Evet, ama ilk 2M çağrı ücretsiz. Limitleri Firebase Console'dan ayarlayabilirsiniz.

**S: Geri dönebilir miyiz?**
C: Evet, istediğiniz zaman Spark plana dönebilirsiniz (ama Cloud Functions silinir).

**S: Şu anki sistem güvenli mi?**
C: Müşteriler rezervasyon yapabiliyor ama fiyat manipülasyonu riski var. **Acil değil ama önemli.**

---

## 📞 DESTEK

Sorun yaşarsanız:
1. Firebase Console'a girin
2. Support > Contact Support
3. Veya: https://firebase.google.com/support

---

## ✅ YAPILACAKLAR LİSTESİ

- [ ] Firebase Blaze planına yükselt
- [ ] Cloud Function deploy et
- [ ] `USE_BACKEND_VALIDATION = true` yap
- [ ] Test rezervasyonu yap
- [ ] Bu dosyayı sil (artık gerek yok)

---

**Son Güncelleme:** 2026-07-09  
**Durum:** ⚠️ Blaze plan upgrade bekleniyor
