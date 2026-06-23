# DEĞERLENDİRME SİSTEMİ TEST REHBERİ

## 🔍 NEDEN LOG YOK SORUNU

### Problem:
Kullanıcı "Değerlendirme gönderilemedi" hatası alıyor ama **hiçbir log görünmüyor**.

### Muhtemel Nedenler:

1. **Browser Console Açık Değil** (%90 ihtimal)
   - Kullanıcı F12 tuşuna basmadı
   - Console sekmesi açık değil
   - Loglar var ama görünmüyor

2. **Console Filtreleri Yanlış** (%5 ihtimal)
   - "Errors only" seçili
   - "Warnings only" seçili
   - console.log'lar gizli

3. **Gerçek Bir Hata Var** (%5 ihtimal)
   - Firestore permission hatası
   - Network hatası
   - Document bulunamadı hatası

## 📋 TEST ADIMLARI

### Adım 1: Browser Console'u Aç
1. Windows: `F12` veya `Ctrl+Shift+I`
2. Mac: `Cmd+Option+I`
3. **Console** sekmesine tıkla
4. Console'un ALT kısmında **filtre seçeneklerini** kontrol et
5. **"All levels"** veya **"Verbose"** seçili olmalı
6. **"Hide network"** KAPALI olmalı

### Adım 2: Test Log Gönder
Browser Console'a şunu yapıştır ve Enter'a bas:
```javascript
console.log('%c ✅ CONSOLE ÇALIŞIYOR', 'background: green; color: white; font-size: 20px; padding: 10px;');
console.error('❌ ERROR TEST');
console.warn('⚠️ WARNING TEST');
console.info('ℹ️ INFO TEST');
```

**Beklenen Sonuç:** 4 farklı log görmeli siniz
- Yeşil kutuda "CONSOLE ÇALIŞIYOR"
- Kırmızı "ERROR TEST"
- Sarı "WARNING TEST"
- Mavi "INFO TEST"

❌ **Eğer göremiyorsanız:** Console ayarlarınızda sorun var

### Adım 3: Firebase Bağlantısını Test Et
Browser Console'a şunu yapıştır:
```javascript
// Firebase test
firebase.auth().currentUser
  ? console.log('✅ User logged in:', firebase.auth().currentUser.uid)
  : console.log('❌ No user logged in');
```

**Beklenen Sonuç:** "User logged in: xxxxx" görmelisiniz

### Adım 4: Değerlendirme Gönder ve Console'u İzle

Şimdi normal şekilde değerlendirme gönderin ve Console'da şu logları arayin:

**BAŞLANGIÇ LOGLARI:**
```
🔍 Starting review submission: { appointmentId: "...", salonId: "...", ... }
🔍 Staff check: { hasStaff: true/false, ... }
📤 Calling reviewsService.submitAppointmentReview...
```

**SERVİS LOGLARI:**
```
🔵 submitAppointmentReview called with: { ... }
🔵 Staff validation: { ... }
🔵 Review data to save: { ... }
🔵 Updating appointment: "..."
🔵 Updating salon rating: "..."
🔵 Committing batch...
✅ Review submitted successfully! ID: "..."
```

**BAŞARI DURUMU:**
```
✅ Review submitted successfully!
```

**HATA DURUMU:**
```
❌ Error submitting review: FirebaseError: ...
❌ Error details: { message: "...", code: "...", ... }
🔴 [Hata tipi açıklaması]
```

### Adım 5: Hata Kodunu Tespit Et

Eğer hata alıyorsanız, Console'da **error.code** değerini bulun:

| Hata Kodu | Açıklama | Çözüm |
|-----------|----------|-------|
| `permission-denied` | Firestore kuralları engelledi | Tekrar giriş yapın veya izin ayarlarını kontrol edin |
| `not-found` | Randevu/salon belgesi bulunamadı | Randevunuz silinmiş olabilir |
| `unauthenticated` | Oturum süresi dolmuş | Çıkış yapıp tekrar giriş yapın |
| `failed-precondition` | Firestore index eksik | Geliştirici index oluşturmalı |
| `unavailable` | Firestore'a erişilemiyor | İnternet bağlantınızı kontrol edin |

## 🛠️ GELİŞTİRİCİ İÇİN TESTLER

### Test 1: Firestore Rules Playground
1. Firebase Console > Firestore Database > Rules
2. **Rules Playground** sekmesine git
3. Test yap:

**Test CREATE Review:**
```
Operation: get
Path: /databases/(default)/documents/reviews/test-review-id
Authenticated: YES
User UID: [test-user-id]
```

**Beklenen:** ✅ Allow (simulated create allowed: true)

### Test 2: Manuel Review Oluşturma
Browser Console'da:
```javascript
// Firebase import'larını kullan
const { db } = await import('/src/lib/firebase.ts');
const { collection, doc, setDoc, Timestamp } = await import('firebase/firestore');

// Test review oluştur
const reviewRef = doc(collection(db, 'reviews'));
const reviewData = {
  salonId: 'VAROLAN_SALON_ID', // <-- Gerçek salon ID koyun
  userId: firebase.auth().currentUser.uid,
  rating: 5,
  comment: 'Test review from console',
  customerName: firebase.auth().currentUser.displayName || 'Test',
  customerAvatar: '',
  serviceNames: ['Test Service'],
  date: new Date().toISOString().split('T')[0],
  createdAt: Timestamp.now()
};

setDoc(reviewRef, reviewData)
  .then(() => console.log('✅ Manuel review başarılı! ID:', reviewRef.id))
  .catch(err => {
    console.error('❌ Manuel review başarısız:', err);
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
  });
```

**Beklenen Sonuç:**
- ✅ "Manuel review başarılı! ID: xxx"
- Firestore Console'da reviews koleksiyonunda yeni belge görmelisiniz

❌ **Eğer başarısız olursa:**
- Error code'u kontrol edin
- Firestore rules'u gözden geçirin
- Auth durumunu kontrol edin

### Test 3: Appointment Güncelleme Test
```javascript
const { db } = await import('/src/lib/firebase.ts');
const { doc, updateDoc, Timestamp } = await import('firebase/firestore');

const appointmentId = 'VAROLAN_RANDEVU_ID'; // <-- Gerçek randevu ID
const appointmentRef = doc(db, 'appointments', appointmentId);

updateDoc(appointmentRef, {
  hasReview: true,
  reviewId: 'test-review-id',
  updatedAt: Timestamp.now()
})
  .then(() => console.log('✅ Appointment güncelleme başarılı'))
  .catch(err => {
    console.error('❌ Appointment güncelleme başarısız:', err);
    console.error('Error code:', err.code);
  });
```

### Test 4: Network Tab Kontrolü
1. F12 > **Network** sekmesi
2. **Filter:** `firestore` veya `googleapis`
3. Değerlendirme gönder
4. **:commit** isteğini bul
5. Status code kontrol et:
   - ✅ 200 OK: Başarılı
   - ❌ 403 Forbidden: Permission denied
   - ❌ 404 Not Found: Belge bulunamadı
   - ❌ 500 Internal Error: Sunucu hatası

## 🎯 SONUÇ VE ÇÖZÜM

### Senaryo 1: Console Kapalıydı
✅ **Çözüm:** Console'u açın ve tekrar deneyin

### Senaryo 2: Permission Denied
❌ **Sorun:** Firestore rules veya auth problemi
✅ **Çözüm:**
1. Çıkış yapın ve tekrar giriş yapın
2. Token'ı yenileyin
3. Firestore rules'u kontrol edin

### Senaryo 3: Document Not Found
❌ **Sorun:** Salon veya appointment belgesi yok
✅ **Çözüm:**
1. Salon ID'sini kontrol edin
2. Appointment ID'sini kontrol edin
3. Belge silinmiş olabilir

### Senaryo 4: Network Hatası
❌ **Sorun:** İnternet bağlantısı kesildi
✅ **Çözüm:** Bağlantıyı kontrol edin ve tekrar deneyin

## 📞 DESTEK İÇİN

Eğer yukarıdaki testler sonuç vermezse:
1. **Browser Console'dan** tüm hata loglarını kopyalayın
2. **Network Tab'den** :commit isteğini kopyalayın (Copy as cURL)
3. **Firestore Console'dan** reviews koleksiyonunu kontrol edin
4. Bu bilgileri geliştirici ekiple paylaşın

---

## ✨ YENİ ÖZELLİKLER (Bu Güncellemede)

### 1. Detaylı Hata Mesajları
Artık hata mesajları daha açıklayıcı:
- ✅ "Yetki hatası: Bu işlemi yapmaya yetkiniz yok. Lütfen tekrar giriş yapın."
- ✅ "Randevu veya işletme bulunamadı"
- ✅ "Oturum süreniz dolmuş. Lütfen tekrar giriş yapın."

### 2. Gelişmiş Console Logları
Firestore hata kodlarına göre detaylı açıklamalar:
```
🔴 FIRESTORE PERMISSION DENIED
🔴 Possible reasons:
  1. User not authenticated
  2. Firestore rules blocking write
  3. Token expired
```

### 3. Development Mode Debug
Geliştirme ortamında ek bilgiler:
```
🔴 DEV MODE - Showing error details in console
🔴 Appointment ID: xxx
🔴 User ID: xxx
🔴 Salon ID: xxx
🔴 Full error object: {...}
```
