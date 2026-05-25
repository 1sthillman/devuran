# ✅ PRODUCTION DEPLOYMENT CHECKLIST

## 🎯 Abonelik Sistemi - Production Hazırlık Listesi

**Tarih**: 24 Mayıs 2026  
**Durum**: ⚠️ DEPLOYMENT BEKLİYOR

---

## 📋 ÖN HAZIRLIK

### 1. Firebase Projesi
- [ ] Firebase Blaze Plan aktif
- [ ] Production projesi oluşturuldu
- [ ] Billing alerts ayarlandı ($100/ay limit)
- [ ] Team members eklendi

### 2. Geliştirme Ortamı
- [ ] Node.js 18+ kurulu
- [ ] Firebase CLI kurulu (`npm install -g firebase-tools`)
- [ ] Firebase login yapıldı (`firebase login`)
- [ ] Proje seçildi (`firebase use production`)

---

## 🔥 FIREBASE FUNCTIONS

### 3. Functions Kurulum
```bash
cd functions
npm install
npm run build
npm run lint
```

- [ ] Dependencies yüklendi
- [ ] TypeScript derlendi
- [ ] Lint hataları yok
- [ ] Test edildi (emulator)

### 4. Environment Variables
```bash
# Stripe API Key
firebase functions:config:set stripe.secret_key="sk_live_YOUR_KEY"

# Admin Emails (opsiyonel)
firebase functions:config:set admin.emails="admin@example.com"

# Kontrol et
firebase functions:config:get
```

- [ ] Stripe live key ayarlandı
- [ ] Admin emails ayarlandı
- [ ] Config doğrulandı

### 5. Functions Deploy
```bash
firebase deploy --only functions
```

- [ ] Deploy başarılı
- [ ] Tüm functions aktif
- [ ] Logs kontrol edildi
- [ ] Test edildi (production)

**Functions Listesi**:
- [ ] `createSubscription` - Callable
- [ ] `approveSubscription` - Callable
- [ ] `updateUsageOnStaffCreate` - Trigger
- [ ] `checkPendingSubscriptions` - Scheduled
- [ ] `sendSubscriptionReminders` - Scheduled

---

## 🔒 FIRESTORE RULES

### 6. Security Rules Deploy
```bash
firebase deploy --only firestore:rules
```

- [ ] Rules deploy edildi
- [ ] Test edildi (emulator)
- [ ] Production'da test edildi

### 7. Firestore Indexes
```bash
firebase deploy --only firestore:indexes
```

- [ ] Indexes deploy edildi
- [ ] Index building tamamlandı (10-30 dakika)
- [ ] Query'ler test edildi

**Gerekli Indexes**:
- [ ] `subscriptions` - `businessId` + `createdAt` (desc)
- [ ] `subscriptions` - `businessId` + `status`
- [ ] `subscriptions` - `status` + `endDate`
- [ ] `subscriptionHistory` - `businessId` + `createdAt` (desc)

---

## 👤 ADMIN KULLANICILAR

### 8. Admin Custom Claims
```javascript
// Firebase Console > Authentication > Users
// Veya script ile:
const admin = require('firebase-admin');
admin.initializeApp();

const userIds = [
  'USER_ID_1', // adistow@gmail.com
  'USER_ID_2', // admin@restoqr.com
  'USER_ID_3', // minif@restoqr.com
];

for (const userId of userIds) {
  await admin.auth().setCustomUserClaims(userId, { admin: true });
  console.log(`Admin claim set for ${userId}`);
}
```

- [ ] Admin kullanıcılar belirlendi
- [ ] Custom claims ayarlandı
- [ ] Admin paneli erişimi test edildi

---

## 💳 STRIPE ENTEGRASYONU

### 9. Stripe Hesap
- [ ] Stripe hesabı oluşturuldu
- [ ] Business bilgileri tamamlandı
- [ ] Banka hesabı eklendi
- [ ] Verification tamamlandı

### 10. Stripe Products
```bash
# Stripe Dashboard > Products
```

**Oluşturulacak Products**:
- [ ] Başlangıç Paketi (1,000₺/ay)
- [ ] Profesyonel Paket (2,500₺/ay)
- [ ] İşletme Paketi (5,000₺/ay)
- [ ] Kurumsal Paket (10,000₺/ay)

### 11. Stripe Webhooks
```bash
# Webhook URL: https://europe-west1-ruloposs.cloudfunctions.net/stripeWebhook
```

**Events**:
- [ ] `payment_intent.succeeded`
- [ ] `payment_intent.payment_failed`
- [ ] `customer.subscription.created`
- [ ] `customer.subscription.updated`
- [ ] `customer.subscription.deleted`

- [ ] Webhook URL eklendi
- [ ] Webhook secret alındı
- [ ] Functions'a eklendi
- [ ] Test edildi

---

## 📧 BİLDİRİM SİSTEMİ

### 12. Email Service
**Seçenekler**:
- SendGrid
- AWS SES
- Mailgun
- Firebase Extensions (Trigger Email)

- [ ] Email service seçildi
- [ ] API key alındı
- [ ] Template'ler oluşturuldu
- [ ] Test edildi

**Email Templates**:
- [ ] Abonelik oluşturuldu
- [ ] Abonelik onaylandı
- [ ] Abonelik reddedildi
- [ ] Abonelik bitiyor (7 gün)
- [ ] Abonelik bitti
- [ ] Ödeme başarısız

### 13. SMS Service (Opsiyonel)
**Seçenekler**:
- Twilio
- Netgsm
- İleti Merkezi

- [ ] SMS service seçildi
- [ ] API key alındı
- [ ] Template'ler oluşturuldu
- [ ] Test edildi

---

## 📊 MONİTORİNG & LOGGING

### 14. Firebase Monitoring
- [ ] Firebase Console > Functions > Logs
- [ ] Error alerts ayarlandı
- [ ] Performance monitoring aktif

### 15. Sentry (Opsiyonel)
```bash
npm install @sentry/node
```

- [ ] Sentry hesabı oluşturuldu
- [ ] DSN alındı
- [ ] Functions'a entegre edildi
- [ ] Test edildi

### 16. LogRocket (Opsiyonel)
```bash
npm install logrocket
```

- [ ] LogRocket hesabı oluşturuldu
- [ ] App ID alındı
- [ ] Client'a entegre edildi
- [ ] Test edildi

---

## 🧪 TEST

### 17. Unit Tests
```bash
cd functions
npm run test
```

- [ ] Unit testler yazıldı
- [ ] Tüm testler geçti
- [ ] Coverage >80%

### 18. Integration Tests
- [ ] Abonelik oluşturma testi
- [ ] Ödeme testi (Stripe test mode)
- [ ] Admin onay testi
- [ ] Usage stats testi
- [ ] Scheduled functions testi

### 19. E2E Tests
- [ ] Kullanıcı akışı testi
- [ ] Admin akışı testi
- [ ] Error scenarios testi
- [ ] Edge cases testi

### 20. Load Testing
```bash
# Artillery veya k6 kullan
npm install -g artillery
artillery quick --count 100 --num 10 https://your-function-url
```

- [ ] 100 concurrent user testi
- [ ] 1000 request/minute testi
- [ ] Response time <500ms
- [ ] Error rate <%1

---

## 🔐 GÜVENLİK

### 21. Security Audit
- [ ] Firestore rules test edildi
- [ ] Functions auth kontrolü test edildi
- [ ] Rate limiting test edildi
- [ ] SQL injection test edildi (N/A)
- [ ] XSS test edildi
- [ ] CSRF test edildi

### 22. Penetration Testing (Opsiyonel)
- [ ] Professional pen test yapıldı
- [ ] Vulnerabilities düzeltildi
- [ ] Re-test yapıldı

---

## 📱 CLIENT ENTEGRASYONU

### 23. Client-Side Updates
```typescript
// src/services/subscriptionService.ts
// Admin fonksiyonları devre dışı bırakıldı ✅

// Yeni: Cloud Functions kullan
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const createSubscription = httpsCallable(functions, 'createSubscription');

const result = await createSubscription({
  businessId: salon.id,
  businessName: salon.name,
  planType: 'professional',
  interval: 'monthly',
  paymentMethodId: 'pm_xxx',
});
```

- [ ] Client-side kod güncellendi
- [ ] Cloud Functions entegre edildi
- [ ] Error handling eklendi
- [ ] Loading states eklendi
- [ ] Test edildi

### 24. Stripe Elements
```typescript
// Stripe payment form
import { Elements, CardElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_live_YOUR_KEY');
```

- [ ] Stripe Elements eklendi
- [ ] Payment form oluşturuldu
- [ ] 3D Secure desteklendi
- [ ] Test edildi

---

## 📄 DOKÜMANTASYON

### 25. API Documentation
- [ ] Functions API docs oluşturuldu
- [ ] Postman collection oluşturuldu
- [ ] Example requests eklendi
- [ ] Error codes dokümante edildi

### 26. User Documentation
- [ ] Kullanıcı rehberi oluşturuldu
- [ ] Admin rehberi oluşturuldu
- [ ] FAQ oluşturuldu
- [ ] Video tutorials (opsiyonel)

---

## 💰 FİYATLANDIRMA & FATURALAMA

### 27. Pricing Strategy
- [ ] Fiyatlar belirlendi
- [ ] Discount stratejisi belirlendi
- [ ] Trial süresi belirlendi (7 gün)
- [ ] Refund policy belirlendi

### 28. Invoicing
- [ ] Fatura template'i oluşturuldu
- [ ] E-Fatura entegrasyonu (opsiyonel)
- [ ] Vergi hesaplama eklendi
- [ ] PDF generation eklendi

---

## 🚀 DEPLOYMENT

### 29. Pre-Deployment
- [ ] Tüm testler geçti
- [ ] Code review yapıldı
- [ ] Staging'de test edildi
- [ ] Backup alındı

### 30. Deployment
```bash
# 1. Functions
firebase deploy --only functions --project production

# 2. Firestore Rules
firebase deploy --only firestore:rules --project production

# 3. Firestore Indexes
firebase deploy --only firestore:indexes --project production

# 4. Client
npm run build
firebase deploy --only hosting --project production
```

- [ ] Functions deploy edildi
- [ ] Rules deploy edildi
- [ ] Indexes deploy edildi
- [ ] Client deploy edildi

### 31. Post-Deployment
- [ ] Smoke tests yapıldı
- [ ] Monitoring kontrol edildi
- [ ] Logs kontrol edildi
- [ ] Performance kontrol edildi

---

## 📊 MONITORING (İlk 24 Saat)

### 32. Metrics to Watch
- [ ] Function invocations
- [ ] Error rate <%1
- [ ] Response time <500ms
- [ ] Firestore reads/writes
- [ ] Stripe payments
- [ ] User signups

### 33. Alerts
- [ ] Error rate >1% alert
- [ ] Response time >1s alert
- [ ] Cost >$10/day alert
- [ ] Failed payments alert

---

## 🎉 LAUNCH

### 34. Soft Launch
- [ ] Beta kullanıcılara açıldı (10-50 kişi)
- [ ] Feedback toplandı
- [ ] Issues düzeltildi
- [ ] Performance optimize edildi

### 35. Public Launch
- [ ] Tüm kullanıcılara açıldı
- [ ] Marketing kampanyası başlatıldı
- [ ] Social media duyurusu yapıldı
- [ ] Press release gönderildi

---

## 📞 DESTEK

### 36. Support Channels
- [ ] Support email oluşturuldu
- [ ] Discord/Slack channel oluşturuldu
- [ ] Ticketing system kuruldu
- [ ] Response time SLA belirlendi (<24 saat)

---

## ✅ FINAL CHECKLIST

### Kritik Kontroller
- [ ] ✅ Tüm functions çalışıyor
- [ ] ✅ Firestore rules aktif
- [ ] ✅ Stripe live mode
- [ ] ✅ Admin claims ayarlı
- [ ] ✅ Monitoring aktif
- [ ] ✅ Backup stratejisi var
- [ ] ✅ Support hazır

### Opsiyonel
- [ ] 📧 Email notifications
- [ ] 📱 SMS notifications
- [ ] 📊 Analytics dashboard
- [ ] 🔔 Push notifications
- [ ] 💳 E-Fatura
- [ ] 🌍 Multi-language

---

## 🎯 BAŞARI KRİTERLERİ

### İlk Hafta
- [ ] 0 critical errors
- [ ] >99% uptime
- [ ] <500ms avg response time
- [ ] >10 successful subscriptions

### İlk Ay
- [ ] >100 active subscriptions
- [ ] <1% churn rate
- [ ] >4.5/5 user satisfaction
- [ ] <$500 infrastructure cost

---

## 📝 NOTLAR

### Önemli Linkler
- Firebase Console: https://console.firebase.google.com/project/ruloposs
- Stripe Dashboard: https://dashboard.stripe.com
- Sentry: https://sentry.io
- Documentation: [Link]

### Acil Durum Kontakları
- Tech Lead: [Email/Phone]
- DevOps: [Email/Phone]
- Support: [Email/Phone]

---

**Son Güncelleme**: 24 Mayıs 2026  
**Durum**: ⚠️ DEPLOYMENT BEKLİYOR  
**Hazırlayan**: Kiro AI

---

## 🚀 DEPLOYMENT KOMUTU

Tüm checklist tamamlandığında:

```bash
# Full deployment
firebase deploy --project production

# Veya ayrı ayrı
firebase deploy --only functions --project production
firebase deploy --only firestore:rules --project production
firebase deploy --only firestore:indexes --project production
firebase deploy --only hosting --project production
```

**Başarılar! 🎉**
