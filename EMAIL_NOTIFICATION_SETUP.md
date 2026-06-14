# 📧 Email Bildirim Sistemi - Firebase + Resend

Firebase Cloud Functions + Resend entegrasyonu ile otomatik email bildirimleri.

## ✅ Yapılanlar

### 1. **Resend Paketi Eklendi**
```bash
cd functions
npm install resend
```

### 2. **Email Cloud Function Oluşturuldu**
- `functions/src/email.ts` - Randevu email bildirimleri
- Müşteriye onay emaili
- Salon sahibine bildirim emaili
- Modern HTML tasarım

### 3. **Type Güncellemeleri**
- `Appointment` interface'ine `customerEmail` field'ı eklendi
- `Salon` interface'ine `ownerEmail` field'ı eklendi

### 4. **Otomatik Email Toplama**
- Randevu oluşturulurken user'ın email'i otomatik çekiliyor
- `firebaseService.ts` güncellendi

---

## 🚀 Kurulum Adımları

### 1. Resend Hesabı Oluştur

1. [resend.com](https://resend.com) → Ücretsiz kayıt ol
2. Dashboard → API Keys → Create API Key
3. API Key'i kopyala (örn: `re_123abc...`)

**Test için:** Başlangıçta `onboarding@resend.dev` kullanabilirsin (domain doğrulama gerekmez)

**Production için:** Kendi domain'ini doğrula:
- Dashboard → Domains → Add Domain
- DNS kayıtlarını ekle (SPF, DKIM, DMARC)
- Doğrulama tamamlanınca `randevu@senindomain.com` kullan

---

### 2. API Key'i Firebase'e Ekle

```bash
# Firebase CLI ile secret ekle
firebase functions:secrets:set RESEND_API_KEY
# Soracak: API key'i yapıştır ve Enter
```

**Alternatif (Google Cloud Console):**
1. [console.cloud.google.com](https://console.cloud.google.com)
2. Secret Manager → Create Secret
3. Name: `RESEND_API_KEY`
4. Value: Resend API key'ini yapıştır

---

### 3. Email Template'lerini Özelleştir

`functions/src/email.ts` dosyasında:

```typescript
// Gönderen adresi değiştir
from: "Devuran Randevu <randevu@senindomain.com>",

// URL'leri güncelle
href="https://senindomain.com/appointments"
href="https://senindomain.com/owner/reservations"
```

---

### 4. Deploy Et

```bash
# Sadece functions'ı deploy et
firebase deploy --only functions

# Veya tüm projeyi deploy et
firebase deploy
```

Deploy süresi: ~2-3 dakika

---

## 📨 Email Örnekleri

### Müşteriye Giden Email

**Konu:** ✓ Randevunuz Onaylandı

**İçerik:**
- 🎉 Başlık: "Randevunuz Onaylandı!"
- 📅 Randevu detayları (salon, personel, tarih, saat)
- 💇 Hizmet listesi ve fiyatlar
- 🔗 "Randevularımı Görüntüle" butonu
- Modern gradient tasarım (mor-pembe)

### Salon Sahibine Giden Email

**Konu:** 🔔 Yeni Randevu Geldi!

**İçerik:**
- 🎊 Başlık: "Yeni Randevu!"
- 👤 Müşteri bilgileri (ad, telefon, email)
- 📅 Randevu detayları
- 💇 Hizmet listesi ve fiyatlar
- 🔗 "Randevuları Yönet" butonu
- Modern gradient tasarım (pembe-kırmızı)

---

## 🧪 Test Etme

### 1. Local Test (Emulator)

```bash
cd functions
npm run serve
```

Emulator'da test randevusu oluştur ve console'da email loglarını gör.

### 2. Production Test

1. Uygulamada yeni randevu oluştur
2. Firebase Console → Functions → Logs
3. Email gönderim loglarını kontrol et
4. Resend Dashboard → Logs → Email durumunu gör

---

## 🔍 Troubleshooting

### Email Gitmiyor

**1. API Key Kontrolü:**
```bash
firebase functions:secrets:access RESEND_API_KEY
```

**2. Function Logları:**
```bash
firebase functions:log --only onAppointmentCreated
```

**3. Resend Dashboard:**
- Logs → Son gönderilen emailler
- Hata mesajları varsa gösterir

### Yaygın Hatalar

**"Invalid API key"**
- API key yanlış veya eksik
- Secret'ı tekrar set et: `firebase functions:secrets:set RESEND_API_KEY`

**"Domain not verified"**
- Production'da kendi domain'ini kullanıyorsan DNS kayıtlarını kontrol et
- Test için `onboarding@resend.dev` kullan

**"Email not sent"**
- User'ın email'i yok → Firestore'da `users` collection'ını kontrol et
- Salon owner email'i yok → `salons` collection'ında `ownerEmail` field'ını ekle

---

## 📊 Mevcut Durum

### ✅ Hazır Olanlar
- [x] Resend paketi kuruldu
- [x] Email Cloud Function yazıldı
- [x] Type definitions güncellendi
- [x] Otomatik email toplama eklendi
- [x] Build başarılı

### ⏳ Yapılacaklar
1. Resend hesabı oluştur
2. API key al
3. Firebase'e secret ekle
4. Email template'lerini özelleştir
5. Deploy et
6. Test et

---

## 🎯 Sonraki Adımlar (Opsiyonel)

### 1. Hatırlatma Emaili (24 saat öncesi)

Cloud Scheduler ile günlük kontrol:

```typescript
export const sendAppointmentReminders = functions.pubsub
  .schedule('every day 09:00')
  .timeZone('Europe/Istanbul')
  .onRun(async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Yarınki randevuları bul ve email gönder
  });
```

### 2. İptal Bildirimi

Randevu iptal edildiğinde:

```typescript
export const onAppointmentCancelled = functions.firestore
  .document("appointments/{appointmentId}")
  .onUpdate(async (change) => {
    const before = change.before.data();
    const after = change.after.data();
    
    if (before.status !== 'cancelled' && after.status === 'cancelled') {
      // İptal emaili gönder
    }
  });
```

### 3. Tamamlanma Bildirimi + Review İsteği

Randevu tamamlandığında:

```typescript
export const onAppointmentCompleted = functions.firestore
  .document("appointments/{appointmentId}")
  .onUpdate(async (change) => {
    const after = change.after.data();
    
    if (after.status === 'completed') {
      // Teşekkür emaili + review linki gönder
    }
  });
```

---

## 💰 Maliyet

**Resend Free Plan:**
- 3,000 email/ay
- 100 email/gün
- Tek domain

**Firebase Functions:**
- 2M invocation/ay ücretsiz
- Her randevu = 1 invocation
- Genelde ücretsiz limitler yeterli

---

## 📞 Destek

**Resend Docs:** https://resend.com/docs
**Firebase Functions:** https://firebase.google.com/docs/functions

---

## 🎉 Özet

Firebase + Resend entegrasyonu kuruldu! Şimdi:

1. **Resend hesabı aç** → API key al
2. **Firebase'e ekle:** `firebase functions:secrets:set RESEND_API_KEY`
3. **Deploy et:** `firebase deploy --only functions`
4. **Test et:** Yeni randevu oluştur

Her randevu oluşturulduğunda otomatik olarak müşteriye ve salon sahibine profesyonel email gidecek! 🚀
