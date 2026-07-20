# Abonelik Sistemi - Kapsamlı Uygulama

## 📋 Genel Bakış

İşletmeler için kapsamlı, esnek ve ölçeklenebilir bir abonelik sistemi uygulandı. Sistem, farklı iş modellerine uygun paketler, özellik bazlı erişim kontrolü ve otomatik deneme süresi içermektedir.

## 🎯 Temel Özellikler

### 1. **Abonelik Paketleri**

#### Başlangıç Paketi (1.000 ₺/ay)
- 3 Personel
- 20 Hizmet
- 200 Randevu/Ay
- Temel müşteri yönetimi
- Temel analitik
- E-posta bildirimleri
- Sıra yönetimi
- Yorum yönetimi

#### Profesyonel Paketi (2.500 ₺/ay) ⭐ POPÜLER
- 10 Personel
- 50 Hizmet
- 500 Randevu/Ay
- Gelişmiş müşteri yönetimi (notlar, etiketler)
- Sadakat programı
- Gelişmiş analitik
- SMS + E-posta + WhatsApp
- Online ödeme
- Kapora sistemi
- Yorumlara yanıt

#### İşletme Paketi (5.000 ₺/ay)
- 25 Personel
- Sınırsız Hizmet
- Sınırsız Randevu
- Tüm Profesyonel özellikler
- Özel raporlar
- Veri dışa aktarma
- Özel marka görünümü
- Çoklu şube
- API erişimi
- Öncelikli destek

#### Kurumsal Paket (10.000 ₺/ay)
- Sınırsız her şey
- Özel alan adı
- Beyaz etiket
- Özel destek ekibi
- Tüm premium özellikler

#### Özel Çözüm
- İhtiyaçlara özel paket
- Özel fiyatlandırma
- Özel özellikler

### 2. **Dönemsel Fiyatlandırma ve İndirimler**

| Dönem | İndirim |
|-------|---------|
| Aylık | - |
| 3 Aylık | %10 |
| 6 Aylık | %15 |
| Yıllık | %20 |

**Örnek:** Profesyonel paket yıllık ödemede:
- Normal: 2.500 ₺ x 12 = 30.000 ₺
- İndirimli: 24.000 ₺ (6.000 ₺ tasarruf)

### 3. **7 Günlük Ücretsiz Deneme**

- Yeni kayıt olan tüm işletmeler otomatik olarak 7 günlük deneme alır
- Deneme süresinde Profesyonel paket özellikleri aktif
- Süre dolmadan önce bildirimler gönderilir
- Süre bitiminde paket seçimi zorunlu

## 🔧 Teknik Uygulama

### Dosya Yapısı

```
src/
├── types/
│   └── subscription.ts          # Abonelik tipleri
├── config/
│   └── subscriptionPlans.ts     # Plan tanımları ve fiyatlar
├── services/
│   ├── subscriptionService.ts   # Abonelik yönetim servisi
│   └── authService.ts           # Trial oluşturma entegrasyonu
├── components/
│   └── subscription/
│       ├── SubscriptionStatus.tsx    # Durum gösterimi
│       ├── SubscriptionPlans.tsx     # Plan seçimi
│       ├── SubscriptionGuard.tsx     # Özellik erişim kontrolü
│       └── SubscriptionModal.tsx     # Plan satın alma
└── pages/
    └── OwnerDashboard.tsx       # Dashboard entegrasyonu
```

### Veritabanı Koleksiyonları

#### `subscriptions`
```typescript
{
  id: string;
  businessId: string;
  businessName: string;
  planType: 'starter' | 'professional' | 'business' | 'enterprise' | 'custom';
  interval: 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
  status: 'trial' | 'active' | 'expired' | 'cancelled' | 'suspended';
  startDate: string;
  endDate: string;
  trialEndDate?: string;
  price: number;
  currency: 'TRY';
  customFeatures?: Partial<PlanFeatures>;
  customPrice?: number;
  usage: {
    staffCount: number;
    serviceCount: number;
    monthlyBookings: number;
    lastUpdated: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

#### `subscriptionHistory`
```typescript
{
  id: string;
  businessId: string;
  subscriptionId: string;
  action: 'created' | 'renewed' | 'upgraded' | 'downgraded' | 'cancelled' | 'expired';
  fromPlan?: string;
  toPlan?: string;
  amount: number;
  reason?: string;
  createdAt: string;
  createdBy: string;
}
```

### Özellik Erişim Kontrolü

#### Component Seviyesinde
```tsx
<SubscriptionGuard
  businessId={salon.id}
  feature="advancedAnalytics"
  onUpgrade={() => setShowSubscriptionModal(true)}
>
  <AnalyticsDashboard salonId={salon.id} />
</SubscriptionGuard>
```

#### Programatik Kontrol
```typescript
const { access, loading } = useFeatureAccess(businessId, 'customerManagement');

if (!access?.hasAccess) {
  // Özellik kilitli
  // access.reason - Neden erişilemiyor
  // access.requiredPlan - Gerekli minimum plan
}
```

#### Limit Kontrolü
```typescript
const canAddStaff = await subscriptionService.checkLimit(
  businessId,
  'staff',
  currentStaffCount
);

if (!canAddStaff.hasAccess) {
  // Limit aşıldı, yükseltme gerekli
}
```

## 🎨 Kullanıcı Arayüzü

### 1. **Abonelik Durumu Kartı**
- Mevcut plan bilgisi
- Kalan süre göstergesi
- Kullanım istatistikleri (personel, hizmet, randevu)
- Yenileme/yükseltme butonları
- Trial uyarıları

### 2. **Plan Seçim Ekranı**
- 5 farklı plan kartı
- Dönemsel fiyatlandırma seçici
- İndirim göstergeleri
- Özellik karşılaştırması
- Popüler plan vurgusu
- Mobil uyumlu grid layout

### 3. **Özellik Kilidi Ekranı**
- Kilit ikonu ve açıklama
- Gerekli plan bilgisi
- Yükseltme butonu
- Gradient arka plan

### 4. **Abonelik Sekmesi**
- Dashboard'da ayrı sekme
- Durum kartı
- Plan değiştirme butonu
- Geçmiş görüntüleme (gelecek)

## 🔄 İş Akışları

### Yeni İşletme Kaydı
1. İşletme owner olarak kayıt olur
2. `authService` otomatik 7 günlük trial oluşturur
3. Trial süresince Profesyonel özellikler aktif
4. Dashboard'da trial uyarısı gösterilir
5. 7 gün sonunda plan seçimi zorunlu

### Plan Satın Alma
1. İşletme "Paketleri Görüntüle" tıklar
2. Modal açılır, tüm planlar gösterilir
3. Dönem seçimi yapılır (aylık/3ay/6ay/yıllık)
4. Plan seçilir
5. Onay verilir
6. `subscriptionService.purchaseSubscription()` çağrılır
7. Abonelik oluşturulur/güncellenir
8. Geçmiş kaydı eklenir
9. Dashboard yenilenir

### Plan Yükseltme/Düşürme
1. Mevcut abonelik kontrol edilir
2. Yeni plan seçilir
3. `subscriptionService.changePlan()` çağrılır
4. Fiyat farkı hesaplanır (gelecek: pro-rata)
5. Plan güncellenir
6. Geçmiş kaydı eklenir

### Özellik Erişimi
1. Component render edilir
2. `SubscriptionGuard` aboneliği kontrol eder
3. `subscriptionService.checkFeatureAccess()` çağrılır
4. Plan özellikleri kontrol edilir
5. Erişim varsa: içerik gösterilir
6. Erişim yoksa: kilit ekranı gösterilir

### Limit Kontrolü
1. İşletme personel/hizmet eklemek ister
2. `subscriptionService.checkLimit()` çağrılır
3. Mevcut kullanım vs plan limiti karşılaştırılır
4. Limit aşılmışsa: uyarı gösterilir
5. Limit uygunsa: ekleme yapılır
6. Kullanım istatistikleri güncellenir

## 📊 Kullanım İstatistikleri

Sistem otomatik olarak şu istatistikleri takip eder:

- **Personel Sayısı**: Her personel ekleme/silmede güncellenir
- **Hizmet Sayısı**: Her hizmet ekleme/silmede güncellenir
- **Aylık Randevu**: Her ay başında sıfırlanır, her randevuda artar

```typescript
await subscriptionService.updateUsageStats(businessId, {
  staffCount: 5,
  serviceCount: 25,
  monthlyBookings: 150,
});
```

## 🔐 Güvenlik

### Firestore Rules
```javascript
match /subscriptions/{subscriptionId} {
  // İşletme sahibi kendi aboneliğini okuyabilir
  allow read: if request.auth != null && 
                 resource.data.businessId == request.auth.uid;
  
  // Sadece admin yazabilir (Cloud Functions)
  allow write: if isSuperAdmin();
}
```

### Erişim Kontrolü
- Tüm özellik kontrolleri backend'de yapılır
- Frontend sadece UI gösterir
- Firestore rules ek güvenlik sağlar
- Custom features işletmeye özel olabilir

## 🚀 Gelecek Geliştirmeler

### Faz 2
- [ ] Ödeme entegrasyonu (Stripe/Iyzico)
- [ ] Otomatik fatura oluşturma
- [ ] E-posta bildirimleri (süre dolumu, yenileme)
- [ ] Pro-rata hesaplama (plan değişiminde)
- [ ] Kupon sistemi
- [ ] Referans programı

### Faz 3
- [ ] Kullanım bazlı fiyatlandırma
- [ ] Add-on paketler
- [ ] Çoklu para birimi
- [ ] Vergi hesaplama
- [ ] Fatura geçmişi
- [ ] Ödeme yöntemleri yönetimi

### Faz 4
- [ ] Self-service plan değişimi
- [ ] Otomatik yenileme
- [ ] Ödeme hatası yönetimi
- [ ] Dunning (ödeme hatırlatma)
- [ ] Churn analizi
- [ ] LTV hesaplama

## 📱 Mobil Uyumluluk

- Tüm bileşenler responsive tasarım
- Grid layout mobilde tek sütun
- Touch-friendly butonlar
- Modal tam ekran mobilde
- Swipe gesture desteği (gelecek)

## 🎯 Önemli Notlar

1. **Trial Otomasyonu**: Yeni işletmeler otomatik trial alır
2. **Özellik Kilitleri**: Tüm premium özellikler guard ile korunur
3. **Limit Kontrolleri**: Personel/hizmet ekleme öncesi kontrol edilir
4. **Kullanım Takibi**: İstatistikler otomatik güncellenir
5. **Esnek Fiyatlandırma**: Custom plan ve özellikler desteklenir
6. **Güvenlik**: Firestore rules + backend kontrolleri
7. **UX**: Modern, temiz, anlaşılır arayüz
8. **Performans**: Lazy loading, optimized queries

## 🔍 Test Senaryoları

### 1. Yeni İşletme Kaydı
- [ ] Trial otomatik oluşturulur
- [ ] 7 gün süre verilir
- [ ] Profesyonel özellikler aktif
- [ ] Dashboard'da uyarı gösterilir

### 2. Plan Satın Alma
- [ ] Tüm planlar gösterilir
- [ ] Dönem seçimi çalışır
- [ ] İndirimler doğru hesaplanır
- [ ] Satın alma başarılı
- [ ] Abonelik aktif olur

### 3. Özellik Erişimi
- [ ] Kilitli özellik gösterilmez
- [ ] Kilit ekranı görünür
- [ ] Yükseltme butonu çalışır
- [ ] Erişim sonrası içerik görünür

### 4. Limit Kontrolü
- [ ] Limit aşımı engellenir
- [ ] Uyarı mesajı gösterilir
- [ ] Yükseltme önerilir
- [ ] Limit içinde ekleme yapılır

### 5. Süre Dolumu
- [ ] Abonelik expired olur
- [ ] Özellikler kilitlenir
- [ ] Yenileme uyarısı gösterilir
- [ ] Yenileme sonrası aktif olur

## 📞 Destek

Abonelik sistemi ile ilgili sorular için:
- Teknik: Kod içi yorumlar ve bu dokümantasyon
- İş: Plan özellikleri ve fiyatlandırma tablosu
- Güvenlik: Firestore rules ve servis katmanı

---

**Sistem Durumu**: ✅ Aktif ve Çalışır Durumda
**Son Güncelleme**: 2024
**Versiyon**: 1.0.0
