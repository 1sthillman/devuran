# Abonelik Sistemi Test Kontrol Listesi

## 🧪 Test Senaryoları

### 1. Abonelik Görüntüleme ✅
**Test Adımları:**
1. Owner Dashboard'a giriş yap
2. Abonelik kartını kontrol et
3. Kalan gün sayısını doğrula
4. Plan bilgilerini kontrol et

**Beklenen Sonuç:**
- ✅ Abonelik bilgileri görünür
- ✅ Kalan gün sayısı doğru hesaplanır
- ✅ Plan adı ve fiyat gösterilir
- ✅ Kullanım istatistikleri görünür

**Hata Durumu:**
- ❌ "Missing or insufficient permissions" hatası OLMAMALI

---

### 2. Yeni Abonelik Oluşturma
**Test Adımları:**
1. "Paket Seç" butonuna tıkla
2. Bir plan seç (örn: Professional)
3. Dönem seç (Aylık/3 Aylık/6 Aylık/Yıllık)
4. "Onayla" butonuna tıkla

**Beklenen Sonuç:**
- ✅ Modal açılır
- ✅ Planlar listelenir
- ✅ Fiyatlar doğru gösterilir
- ✅ İndirimler uygulanır
- ✅ Abonelik başarıyla oluşturulur
- ✅ Toast mesajı gösterilir

**Kontrol Edilecekler:**
- Firestore'da `subscriptions` koleksiyonunda yeni kayıt
- `subscriptionHistory` koleksiyonunda geçmiş kaydı
- `status: 'active'` olmalı
- `endDate` doğru hesaplanmalı

---

### 3. Kalan Gün Hesaplama
**Test Adımları:**
1. Dashboard'da abonelik kartını aç
2. Kalan gün sayısını kontrol et
3. Bitiş tarihini kontrol et

**Beklenen Sonuç:**
- ✅ Kalan gün sayısı doğru
- ✅ Bitiş tarihi doğru formatta
- ✅ Renk kodlaması doğru:
  - 🔵 Trial: Mavi
  - 🟢 7+ gün: Yeşil
  - 🟠 1-7 gün: Turuncu
  - 🔴 0 gün: Kırmızı

**Hesaplama Formülü:**
```javascript
const endDate = new Date(subscription.endDate);
const now = new Date();
const diff = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
```

---

### 4. Plan Değiştirme
**Test Adımları:**
1. Mevcut abonelik varken "Yükselt" butonuna tıkla
2. Farklı bir plan seç
3. Değişikliği onayla

**Beklenen Sonuç:**
- ✅ Plan değişir
- ✅ Fiyat güncellenir
- ✅ Geçmiş kaydı oluşturulur
- ✅ `action: 'upgraded'` veya `'downgraded'`

---

### 5. Süre Dolumu Kontrolü
**Test Adımları:**
1. Firestore'da bir aboneliğin `endDate`'ini geçmiş tarihe ayarla
2. Dashboard'ı yenile
3. Abonelik durumunu kontrol et

**Beklenen Sonuç:**
- ✅ Status otomatik olarak `'expired'` olur
- ✅ Kırmızı uyarı mesajı gösterilir
- ✅ "Yenile" butonu görünür
- ✅ Özellikler kilitlenir

---

### 6. Özellik Erişim Kontrolü
**Test Adımları:**
1. `SubscriptionGuard` ile korunan bir özelliğe eriş
2. Farklı plan seviyelerinde test et

**Beklenen Sonuç:**
- ✅ Yetkili kullanıcı içeriği görür
- ✅ Yetkisiz kullanıcı kilit ekranı görür
- ✅ Yükseltme önerisi gösterilir
- ✅ Gerekli plan bilgisi doğru

**Test Özellikleri:**
- `advancedAnalytics`: Professional+
- `customBranding`: Business+
- `apiAccess`: Enterprise
- `prioritySupport`: Business+

---

### 7. Kullanım Limiti Kontrolü
**Test Adımları:**
1. Personel/Hizmet/Randevu ekle
2. Limit dolduğunda eklemeye çalış

**Beklenen Sonuç:**
- ✅ Limit dolmadan ekleme yapılır
- ✅ Limit dolduğunda uyarı gösterilir
- ✅ Yükseltme önerisi sunulur

**Limitler:**
- Starter: 3 personel, 10 hizmet, 100 randevu
- Professional: 10 personel, 50 hizmet, 500 randevu
- Business: 25 personel, 100 hizmet, 2000 randevu
- Enterprise: Sınırsız

---

### 8. Trial Abonelik
**Test Adımları:**
1. Yeni işletme oluştur
2. Otomatik trial abonelik kontrolü

**Beklenen Sonuç:**
- ✅ Trial abonelik otomatik oluşturulur
- ✅ `status: 'trial'`
- ✅ `planType: 'professional'`
- ✅ 14 gün süre verilir
- ✅ Mavi renk ve "Deneme" etiketi

---

### 9. Abonelik Geçmişi
**Test Adımları:**
1. Abonelik işlemleri yap (oluştur, yükselt, yenile)
2. Geçmiş kayıtlarını kontrol et

**Beklenen Sonuç:**
- ✅ Her işlem için kayıt oluşturulur
- ✅ Tarih sıralaması doğru
- ✅ Action türleri doğru:
  - `created`: Yeni abonelik
  - `renewed`: Yenileme
  - `upgraded`: Yükseltme
  - `downgraded`: Düşürme
  - `cancelled`: İptal
  - `expired`: Süre dolumu

---

### 10. Firestore Rules Testi
**Test Adımları:**
1. Farklı kullanıcılarla giriş yap
2. Başka işletmelerin aboneliklerini okumaya çalış

**Beklenen Sonuç:**
- ✅ Kendi aboneliğini okuyabilir
- ❌ Başkasının aboneliğini okuyamaz
- ✅ Super admin hepsini okuyabilir

**Test Kullanıcıları:**
- Normal owner: Sadece kendi salonu
- Super admin: Tüm salonlar
- Başka owner: Kendi salonu

---

## 🔍 Manuel Test Komutları

### Firestore Console'da Test
```javascript
// Abonelik oluştur
db.collection('subscriptions').add({
  businessId: 'SALON_ID',
  businessName: 'Test Salon',
  planType: 'professional',
  interval: 'monthly',
  status: 'active',
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
  price: 299,
  currency: 'TRY',
  usage: {
    staffCount: 0,
    serviceCount: 0,
    monthlyBookings: 0,
    lastUpdated: new Date().toISOString()
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});
```

### Browser Console'da Test
```javascript
// Abonelik bilgisini al
import { subscriptionService } from '@/services/subscriptionService';
const sub = await subscriptionService.getBusinessSubscription('SALON_ID');
console.log('Subscription:', sub);

// Kalan gün hesapla
const endDate = new Date(sub.endDate);
const now = new Date();
const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
console.log('Days remaining:', daysRemaining);

// Özellik erişimi kontrol et
const access = await subscriptionService.checkFeatureAccess('SALON_ID', 'advancedAnalytics');
console.log('Feature access:', access);
```

---

## 📊 Test Sonuçları

### ✅ Başarılı Testler
- [ ] Abonelik görüntüleme
- [ ] Yeni abonelik oluşturma
- [ ] Kalan gün hesaplama
- [ ] Plan değiştirme
- [ ] Süre dolumu kontrolü
- [ ] Özellik erişim kontrolü
- [ ] Kullanım limiti kontrolü
- [ ] Trial abonelik
- [ ] Abonelik geçmişi
- [ ] Firestore rules

### ❌ Başarısız Testler
(Burada sorunları listeleyin)

---

## 🐛 Bilinen Sorunlar

### Düzeltildi ✅
- ~~Firebase permission hatası~~ → Firestore rules güncellendi
- ~~Kalan gün gösterilmiyor~~ → SubscriptionOverviewCard güncellendi

### Açık Sorunlar
(Varsa buraya ekleyin)

---

## 📝 Notlar

### Önemli Kontroller
1. **Tarih Hesaplamaları**: Timezone farkları dikkat
2. **Firestore Rules**: Deploy sonrası test et
3. **Cache**: Browser cache temizle
4. **Auth State**: Kullanıcı giriş durumu kontrol et

### Performans
- Abonelik sorguları cache'lenebilir
- Kalan gün hesaplaması client-side yapılıyor
- Firestore rules'da 1-2 ek okuma var (normal)

### Güvenlik
- Tüm hassas işlemler server-side olmalı
- Client-side sadece görüntüleme
- Ödeme işlemleri Cloud Functions ile

---

## 🚀 Deployment Checklist

Canlıya almadan önce:
- [ ] Tüm testler başarılı
- [ ] Firestore rules deploy edildi
- [ ] Production environment test edildi
- [ ] Backup alındı
- [ ] Rollback planı hazır
- [ ] Monitoring aktif
- [ ] Error tracking aktif
- [ ] Kullanıcı bildirimi yapıldı (gerekirse)
