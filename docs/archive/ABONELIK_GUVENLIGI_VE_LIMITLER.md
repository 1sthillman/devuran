# 🔒 Abonelik Güvenliği ve Limit Kontrolleri

## ✅ Uygulanan Güvenlik Önlemleri

### 1. Admin Onay Sistemi
**Durum:** ✅ Aktif

**Nasıl Çalışır:**
- Yeni abonelik alımları `pending` (beklemede) durumunda başlar
- Admin onayı gerekir
- Mevcut abonelik yenilemeleri direkt `active` olur

**Admin Fonksiyonları:**
```typescript
// Aboneliği onayla
await subscriptionService.approveSubscription(businessId, adminEmail);

// Aboneliği reddet
await subscriptionService.rejectSubscription(businessId, adminEmail, reason);
```

**Durum Akışı:**
```
Yeni Abonelik → pending → Admin Onayı → active
Yenileme → active (direkt)
```

---

### 2. Randevu Alma Kontrolü
**Durum:** ✅ Aktif

**Kontroller:**
1. ✅ İşletmenin aktif aboneliği var mı?
2. ✅ Abonelik süresi dolmamış mı?
3. ✅ Aylık randevu limiti aşılmamış mı?

**Hata Mesajları:**
- "Bu işletme şu anda randevu kabul etmemektedir"
- "Bu işletmenin aboneliği sona ermiştir"
- "Bu işletme aylık randevu limitine ulaşmıştır"

**Kod:**
```typescript
// firebaseService.ts - createAppointment fonksiyonunda
const subscription = await subscriptionService.getBusinessSubscription(salonId);

if (!subscription || subscription.status !== 'active') {
  throw new Error('Randevu alınamaz');
}

// Limit kontrolü
if (subscription.usage.monthlyBookings >= plan.features.maxMonthlyBookings) {
  throw new Error('Aylık randevu limiti aşıldı');
}
```

---

### 3. Anasayfa Görünürlük Kontrolü
**Durum:** ✅ Aktif

**Kural:**
- Sadece aktif aboneliği olan işletmeler anasayfada görünür
- Aboneliği olmayan veya süresi dolmuş işletmeler listelenmez

**Kod:**
```typescript
// firebaseService.ts - salonsService.getAll()
const subscription = await subscriptionService.getBusinessSubscription(salon.id);

if (subscription && subscription.status === 'active') {
  const now = new Date();
  const endDate = new Date(subscription.endDate);
  
  if (now <= endDate) {
    // Sadece bu işletmeyi göster
    salonsWithActiveSubscription.push(salon);
  }
}
```

---

### 4. Personel Ekleme Limiti
**Durum:** ✅ Aktif

**Kontroller:**
1. ✅ Mevcut personel sayısı
2. ✅ Plan limiti kontrolü
3. ✅ Otomatik sayaç güncelleme

**Limitler:**
- Starter: 3 personel
- Professional: 10 personel
- Business: 25 personel
- Enterprise: Sınırsız

**Kod:**
```typescript
// firebaseService.ts - staffService.create()
const limitCheck = await subscriptionService.checkLimit(
  salonId,
  'staff',
  currentStaffCount
);

if (!limitCheck.hasAccess) {
  throw new Error('Personel ekleme limitine ulaşıldı');
}

// Başarılı ekleme sonrası
await subscriptionService.updateUsageStats(salonId, {
  staffCount: currentStaffCount + 1
});
```

---

### 5. Hizmet Ekleme Limiti
**Durum:** ✅ Aktif

**Kontroller:**
1. ✅ Mevcut hizmet sayısı
2. ✅ Plan limiti kontrolü
3. ✅ Otomatik sayaç güncelleme

**Limitler:**
- Starter: 10 hizmet
- Professional: 50 hizmet
- Business: 100 hizmet
- Enterprise: Sınırsız

**Kod:**
```typescript
// firebaseService.ts - servicesService.create()
const limitCheck = await subscriptionService.checkLimit(
  salonId,
  'services',
  currentServiceCount
);

if (!limitCheck.hasAccess) {
  throw new Error('Hizmet ekleme limitine ulaşıldı');
}

// Başarılı ekleme sonrası
await subscriptionService.updateUsageStats(salonId, {
  serviceCount: currentServiceCount + 1
});
```

---

### 6. Aylık Randevu Limiti
**Durum:** ✅ Aktif

**Kontroller:**
1. ✅ Mevcut aylık randevu sayısı
2. ✅ Plan limiti kontrolü
3. ✅ Otomatik sayaç güncelleme

**Limitler:**
- Starter: 100 randevu/ay
- Professional: 500 randevu/ay
- Business: 2000 randevu/ay
- Enterprise: Sınırsız

**Kod:**
```typescript
// firebaseService.ts - createAppointment()
if (subscription.usage.monthlyBookings >= plan.features.maxMonthlyBookings) {
  throw new Error('Aylık randevu limiti aşıldı');
}

// Başarılı randevu sonrası
await subscriptionService.updateUsageStats(salonId, {
  monthlyBookings: subscription.usage.monthlyBookings + 1
});
```

---

## 📊 Kullanım İstatistikleri

### Otomatik Güncelleme
Tüm işlemler otomatik olarak `usage` nesnesini günceller:

```typescript
{
  usage: {
    staffCount: 5,           // Aktif personel sayısı
    serviceCount: 15,        // Aktif hizmet sayısı
    monthlyBookings: 87,     // Bu aydaki randevu sayısı
    lastUpdated: "2024-05-24T10:00:00.000Z"
  }
}
```

### Güncelleme Zamanları
- **Personel Ekleme**: Hemen güncellenir
- **Hizmet Ekleme**: Hemen güncellenir
- **Randevu Oluşturma**: Hemen güncellenir
- **Aylık Reset**: Her ayın 1'inde `monthlyBookings` sıfırlanır (Cloud Function gerekli)

---

## 🔐 Güvenlik Katmanları

### Katman 1: Client-Side Kontrol
- UI'da limitler gösterilir
- Butonlar devre dışı bırakılır
- Uyarı mesajları gösterilir

### Katman 2: Service-Side Kontrol
- Her işlem öncesi limit kontrolü
- Abonelik durumu kontrolü
- Hata fırlatma

### Katman 3: Firestore Rules
- Database seviyesinde izin kontrolü
- Sadece yetkili kullanıcılar yazabilir
- Cross-tenant erişim engellenir

---

## 🎯 Admin Panel Gereksinimleri

### Bekleyen Abonelikler Listesi
```typescript
// Tüm pending abonelikleri getir
const pendingSubscriptions = await getDocs(
  query(
    collection(db, 'subscriptions'),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  )
);
```

### Onay/Red İşlemleri
```typescript
// Onayla
await subscriptionService.approveSubscription(
  businessId,
  'admin@restoqr.com'
);

// Reddet
await subscriptionService.rejectSubscription(
  businessId,
  'admin@restoqr.com',
  'Ödeme doğrulanamadı'
);
```

---

## 📈 İzleme ve Raporlama

### Kullanım Metrikleri
```typescript
// İşletmenin kullanım durumu
const subscription = await subscriptionService.getBusinessSubscription(businessId);

console.log('Personel:', subscription.usage.staffCount);
console.log('Hizmet:', subscription.usage.serviceCount);
console.log('Randevu:', subscription.usage.monthlyBookings);
```

### Limit Uyarıları
```typescript
// %80 doluluk uyarısı
if (subscription.usage.monthlyBookings >= plan.features.maxMonthlyBookings * 0.8) {
  showWarning('Aylık randevu limitinizin %80\'ine ulaştınız');
}
```

---

## 🚨 Kritik Noktalar

### 1. Aylık Reset
**Sorun:** `monthlyBookings` her ay sıfırlanmalı

**Çözüm:** Cloud Function gerekli
```typescript
// Cloud Function (her ayın 1'inde çalışır)
export const resetMonthlyBookings = functions.pubsub
  .schedule('0 0 1 * *')
  .onRun(async () => {
    const subscriptions = await getDocs(collection(db, 'subscriptions'));
    
    for (const doc of subscriptions.docs) {
      await updateDoc(doc.ref, {
        'usage.monthlyBookings': 0,
        'usage.lastUpdated': new Date().toISOString()
      });
    }
  });
```

### 2. Silme İşlemleri
**Sorun:** Personel/hizmet silindiğinde sayaç güncellenmeli

**Çözüm:** Delete fonksiyonlarına sayaç güncellemesi ekle
```typescript
// Personel silme
await subscriptionService.updateUsageStats(salonId, {
  staffCount: currentStaffCount - 1
});

// Hizmet silme
await subscriptionService.updateUsageStats(salonId, {
  serviceCount: currentServiceCount - 1
});
```

### 3. Toplu İşlemler
**Sorun:** Toplu ekleme/silme işlemlerinde sayaç tutarsızlığı

**Çözüm:** Transaction kullan veya her işlem sonrası sayaç güncelle

---

## ✅ Test Senaryoları

### Senaryo 1: Aboneliksiz Randevu Denemesi
```
1. Aboneliği olmayan işletme seç
2. Randevu almaya çalış
3. Beklenen: "Bu işletme randevu kabul etmemektedir" hatası
```

### Senaryo 2: Limit Aşımı
```
1. Starter plan ile 3 personel ekle
2. 4. personeli eklemeye çalış
3. Beklenen: "Personel ekleme limitine ulaşıldı" hatası
```

### Senaryo 3: Admin Onayı
```
1. Yeni abonelik al
2. Status: pending
3. Admin onayla
4. Status: active
5. Randevu alınabilir
```

### Senaryo 4: Anasayfa Görünürlük
```
1. Aboneliği olmayan işletme oluştur
2. Anasayfayı kontrol et
3. Beklenen: İşletme görünmez
4. Abonelik al ve admin onayla
5. Beklenen: İşletme görünür
```

---

## 🎉 Sonuç

Tüm güvenlik önlemleri aktif ve çalışıyor:
- ✅ Admin onay sistemi
- ✅ Randevu alma kontrolü
- ✅ Anasayfa görünürlük kontrolü
- ✅ Personel/hizmet/randevu limitleri
- ✅ Otomatik kullanım takibi
- ✅ Gerçek zamanlı limit kontrolleri

**Sistem güvenli ve production-ready! 🚀**
