# 🚀 Hızlı Test Kılavuzu - Restoran Abonelik Sistemi

## ✅ SON DEĞİŞİKLİKLER (Az Önce)

1. ✅ Firestore Rules düzeltildi
2. ✅ subscriptionHistory create izni verildi
3. ✅ Deploy edildi

---

## 🔧 ŞİMDİ YAPMANIZ GEREKENLER

### 1. Browser Cache Temizle

**Chrome:**
```
1. F12 (Developer Tools)
2. Network sekmesi
3. "Disable cache" işaretle
4. Sağ tık "Reload" > "Empty Cache and Hard Reload"
```

**Manuel:**
```javascript
// Console'a yapıştır
localStorage.clear();
sessionStorage.clear();
location.reload(true);
```

### 2. Logout/Login

```
1. Logout yap
2. Login yap
3. Owner Dashboard'a git
```

---

## 🧪 TEST SENARYOSU

### Senaryo 1: Restoran Abonelik Satın Al

**Adımlar:**
```
1. Login ol (restoran sahibi olarak)
2. Owner Dashboard → Abonelik sekmesi
3. "Paketi Seç" veya "Plan Değiştir" butonuna tıkla
4. Başlangıç paketini (2.000₺) seç
5. "Paketi Seç" butonuna tıkla
```

**Beklenen Sonuç:**
```
✅ Modal kapanır
✅ Toast mesajı: "⏳ Abonelik talebi oluşturuldu! Admin onayı bekleniyor."
✅ Console'da hata yok
```

**Eğer Hata Alırsan:**
```javascript
// Console'da kontrol et
auth.currentUser
// {uid: "...", email: "..."}

user.salonId
// "xyz123..."
```

### Senaryo 2: Admin Onayı

**Adımlar:**
```
1. Super Admin olarak login (minifinise@gmail.com)
2. Admin Panel → Abonelikler
3. "⏳ Onay Bekleyen" bölümünü gör
4. Restoran aboneliğini bul
5. "✅ Onayla" butonuna tıkla
```

**Beklenen Sonuç:**
```
✅ Status: pending → active
✅ İşletme anasayfada görünür
✅ Limitler aktif
```

### Senaryo 3: Limit Testi

**Adımlar:**
```
1. Restoran sahibi olarak login
2. Restoran Dashboard → Masalar
3. 10 masa ekle (Başlangıç paketi limiti)
4. 11. masayı eklemeye çalış
```

**Beklenen Sonuç:**
```
✅ 10 masa eklenir
❌ 11. masa eklenemez
🔔 Toast: "Masa limiti aşıldı! BAŞLANGIÇ paketinizde maksimum 10 masa ekleyebilirsiniz."
📌 "Paketi Yükselt" butonu görünür
```

---

## 🐛 SORUN GİDERME

### Hata: "Missing or insufficient permissions"

**Çözüm 1: Cache Temizle**
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload(true);
```

**Çözüm 2: Logout/Login**
```
Logout → Login → Tekrar dene
```

**Çözüm 3: User Kontrolü**
```javascript
// Console'da çalıştır
const user = auth.currentUser;
console.log('User:', user);
console.log('SalonID:', user?.salonId);

// SalonID undefined ise sorun var!
```

### Hata: "Plan bulunamadı"

**Çözüm:**
```javascript
// Console'da kontrol et
import { RESTAURANT_SUBSCRIPTION_PLANS } from '@/config/restaurantSubscriptionPlans';
console.log(RESTAURANT_SUBSCRIPTION_PLANS);
// 5 plan görmeli (starter, professional, business, enterprise, custom)
```

### Hata: "Abonelik oluşturulamadı"

**Çözüm:**
```javascript
// Firebase Console'da kontrol et
1. Firebase Console → Firestore
2. subscriptions collection
3. Document var mı?
4. Status: "pending" mi?
```

---

## 📊 BAŞARILI TEST KRİTERLERİ

### ✅ Tüm Bunlar Çalışmalı:

- [x] Login/Logout
- [x] Owner Dashboard yüklenir
- [x] Abonelik sekmesi görünür
- [x] RestaurantSubscriptionModal açılır
- [x] Paket seçimi yapılır
- [x] "Paketi Seç" butonu çalışır
- [x] Pending subscription oluşturulur
- [x] Admin panelde görünür
- [x] Admin onaylayabilir
- [x] Status active olur
- [x] Limitler çalışır
- [x] Masa ekleme sınırı kontrol edilir
- [x] "Paketi Yükselt" butonu görünür

---

## 🎯 HIZLI TEST KOMUTU

**Console'da Çalıştır:**
```javascript
// 1. User kontrolü
console.log('User:', auth.currentUser);
console.log('SalonID:', auth.currentUser?.salonId);

// 2. Subscription kontrolü
const sub = await subscriptionService.getBusinessSubscription(auth.currentUser?.salonId);
console.log('Subscription:', sub);

// 3. Limit kontrolü
const plan = RESTAURANT_SUBSCRIPTION_PLANS.find(p => p.id === sub?.planType);
console.log('Plan:', plan);
console.log('Limits:', plan?.features);
```

**Beklenen Çıktı:**
```javascript
User: {uid: "...", email: "...", salonId: "xyz123"}
SalonID: "xyz123"
Subscription: {id: "xyz123", status: "active", planType: "starter", ...}
Plan: {id: "starter", name: "Başlangıç", ...}
Limits: {maxTables: 10, maxMenuItems: 50, maxStaff: 3, ...}
```

---

## 🚨 ACİL DURUM

### Eğer Hiçbir Şey Çalışmıyorsa:

**1. Firebase Rules Kontrolü:**
```bash
npx firebase deploy --only firestore:rules
```

**2. Hard Reload:**
```
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

**3. Incognito Mode:**
```
Yeni incognito pencere aç
Login yap
Test et
```

**4. Firebase Console:**
```
1. Firebase Console → Firestore
2. subscriptions koleksiyonuna bak
3. Document var mı?
4. permissions hataları var mı?
```

---

## ✅ BAŞARILI TEST ÖRNEĞİ

### Console Çıktısı (Başarılı):
```
✅ User authenticated
✅ SalonID: abc123
✅ Subscription loaded: {status: "active", planType: "starter"}
✅ Plan found: Başlangıç
✅ Limits: {maxTables: 10, maxMenuItems: 50, maxStaff: 3}
✅ Current usage: {staffCount: 2, serviceCount: 15, monthlyBookings: 45}
✅ Limits OK - Can add more
```

### Console Çıktısı (Başarısız):
```
❌ Error: Missing or insufficient permissions
❌ SalonID: undefined
❌ Subscription: null
```

**Bu durumda:**
1. Logout yap
2. Cache temizle
3. Login yap
4. Tekrar dene

---

## 📞 DESTEK

Eğer hala sorun yaşıyorsan:

1. **Console logları**: Tüm error mesajlarını kopyala
2. **Network tab**: Failed requests'leri bak
3. **Firebase Console**: Firestore'da ne var bak
4. **User object**: `auth.currentUser` çıktısını paylaş

**En yaygın sorun:** Cache! Her zaman ilk önce cache temizle.
