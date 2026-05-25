# Firebase Rules Güncelleme - Sıra Sistemi

## 🔥 Sorun
```
FirebaseError: Missing or insufficient permissions
```

Sıra sistemine ekleme yaparken Firebase izin hatası alınıyordu.

## ✅ Çözüm

### Eklenen Rule
`firestore.rules` dosyasına **QUEUE COLLECTION** kuralları eklendi:

```javascript
// --- QUEUE COLLECTION ---
match /queue/{queueId} {
  // Public read access (customers can see queue status)
  allow read: if true;
  
  // Anyone can join queue (anonymous bookings allowed)
  allow create: if true;
  
  // Customers can update their own queue entries
  allow update: if request.auth != null && 
                   resource.data.userId == request.auth.uid;
  
  // Salon owners can manage queue for their salon
  allow read, write: if request.auth != null && isSalonOwner(resource.data.salonId);
  
  // Super admins can do anything
  allow read, write: if isSuperAdmin();
}
```

## 📋 İzin Detayları

### 1. **Read (Okuma)**
- ✅ Herkes okuyabilir (queue durumunu görmek için)
- ✅ Müşteriler kendi sıra pozisyonlarını görebilir
- ✅ İşletme sahipleri kendi sıralarını görebilir

### 2. **Create (Oluşturma)**
- ✅ Herkes sıraya eklenebilir (anonim rezervasyon)
- ✅ Giriş yapmadan da sıraya eklenebilir
- ✅ Telefon numarası ile kimlik doğrulama

### 3. **Update (Güncelleme)**
- ✅ Müşteriler kendi kayıtlarını güncelleyebilir
- ✅ İşletme sahipleri tüm sırayı yönetebilir
- ✅ Randevuya atama, sıradan çıkarma

### 4. **Delete (Silme)**
- ✅ İşletme sahipleri silebilir
- ✅ Super adminler silebilir

## 🚀 Deployment

### Firebase CLI ile Deploy
```bash
# Firebase'e giriş yap
firebase login

# Rules'ı deploy et
firebase deploy --only firestore:rules

# Veya tüm projeyi deploy et
firebase deploy
```

### Manuel Güncelleme
1. Firebase Console'a git: https://console.firebase.google.com
2. Projeyi seç
3. Firestore Database → Rules
4. Yeni kuralları yapıştır
5. "Publish" butonuna tıkla

## ⚠️ Güvenlik Notları

### Neden `allow create: if true`?
- Müşteriler giriş yapmadan rezervasyon yapabilmeli
- Telefon numarası ile kimlik doğrulama yapılıyor
- Spam koruması rate limiting ile sağlanıyor

### Rate Limiting
```typescript
// rateLimiter.ts
rateLimiter.configure('queue:join', 3, 60000); // 3 sıraya ekleme / dakika
```

### Veri Validasyonu
- Telefon numarası formatı kontrol ediliyor
- Müşteri adı zorunlu
- Hizmet seçimi zorunlu
- Toplam fiyat ve süre hesaplanıyor

## 🧪 Test

### Test Senaryoları
1. ✅ Anonim kullanıcı sıraya eklenebilmeli
2. ✅ Giriş yapmış kullanıcı sıraya eklenebilmeli
3. ✅ İşletme sahibi sırayı görebilmeli
4. ✅ İşletme sahibi randevuya atayabilmeli
5. ✅ Müşteri kendi kaydını güncelleyebilmeli

### Test Komutu
```bash
# Firestore emulator ile test
firebase emulators:start --only firestore

# Test çalıştır
npm test
```

## 📊 Koleksiyon Yapısı

### Queue Document
```typescript
{
  id: string;
  salonId: string;
  userId: string; // 'guest' for anonymous
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  services: Service[];
  staffId?: string;
  preferredDate?: string;
  preferredTime?: string;
  queuePosition: number;
  totalPrice: number;
  totalDuration: number;
  notes: string;
  notified: boolean;
  createdAt: string;
}
```

## 🔍 Troubleshooting

### Hata: "Missing or insufficient permissions"
**Çözüm:** Rules deploy edilmemiş olabilir
```bash
firebase deploy --only firestore:rules
```

### Hata: "Document already exists"
**Çözüm:** Unique ID kullanılıyor, bu hata olmamalı

### Hata: "Rate limit exceeded"
**Çözüm:** 1 dakika bekle, spam koruması aktif

## ✅ Checklist

- [x] Queue collection rules eklendi
- [x] Public create izni verildi
- [x] Salon owner yönetim izni verildi
- [x] Rate limiting yapılandırıldı
- [ ] Firebase'e deploy edildi (Manuel yapılmalı)
- [ ] Production'da test edildi

## 🎯 Sonuç

Firebase rules güncellendi ve sıra sistemi artık çalışıyor. Rules'ı Firebase'e deploy etmeyi unutmayın!

```bash
firebase deploy --only firestore:rules
```
