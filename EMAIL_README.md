# 📧 Email Bildirim Sistemi

Firebase Cloud Functions + Resend ile otomatik email bildirimleri.

---

## 🎯 Özellikler

✅ **Otomatik Bildirimler**
- Yeni randevu oluşturulduğunda
- Müşteriye onay emaili
- Salon sahibine bildirim emaili

✅ **Modern Tasarım**
- Responsive HTML template'ler
- Gradient renkler
- Mobil uyumlu
- Profesyonel görünüm

✅ **Güvenli & Hızlı**
- Firebase Secret Manager
- Resend API entegrasyonu
- Hata yönetimi
- Logging & monitoring

---

## 📁 Dosyalar

### Kod
- `functions/src/email.ts` - Email Cloud Function
- `functions/src/index.ts` - Function exports
- `src/types/index.ts` - Type definitions (customerEmail, ownerEmail)
- `src/services/firebaseService.ts` - Otomatik email toplama

### Dokümantasyon
- `QUICK_EMAIL_SETUP.md` - ⚡ 5 dakikalık hızlı kurulum
- `RESEND_SETUP_GUIDE.md` - 📚 Detaylı adım adım rehber
- `EMAIL_NOTIFICATION_SETUP.md` - 🔧 Teknik detaylar
- `EMAIL_SYSTEM_COMPLETE.md` - ✅ Tam sistem özeti
- `EMAIL_README.md` - 📖 Bu dosya

### Deployment
- `deploy-email-functions.ps1` - Windows deployment script
- `deploy-email-functions.sh` - Mac/Linux deployment script

### Preview
- `email-preview-customer.html` - Müşteri email örneği
- `email-preview-owner.html` - Salon sahibi email örneği

---

## 🚀 Hızlı Başlangıç

### 1. Resend Hesabı
```
https://resend.com → Sign Up → API Key al
```

### 2. API Key Ekle
```bash
firebase functions:secrets:set RESEND_API_KEY
```

### 3. Deploy
```bash
# Windows
.\deploy-email-functions.ps1

# Mac/Linux
./deploy-email-functions.sh
```

### 4. Test
Uygulamada yeni randevu oluştur → Email'leri kontrol et

**Detaylı kurulum:** `QUICK_EMAIL_SETUP.md`

---

## 📧 Email Örnekleri

### Müşteri Emaili
![Customer Email](email-preview-customer.html)

**Özellikler:**
- Mor-pembe gradient header
- Randevu detayları (salon, personel, tarih, saat)
- Hizmet listesi ve fiyatlar
- "Randevularımı Görüntüle" butonu
- İptal politikası notu

### Salon Sahibi Emaili
![Owner Email](email-preview-owner.html)

**Özellikler:**
- Pembe-kırmızı gradient header
- Müşteri bilgileri (ad, telefon, email)
- Randevu detayları
- Hizmet listesi ve fiyatlar
- İstatistikler (haftalık, aylık, puan)
- "Randevuları Yönet" butonu

---

## 🔧 Özelleştirme

### Email Adresi Değiştir

**Test (şu an):**
```typescript
from: "Randevu Sistemi <onboarding@resend.dev>"
```

**Production:**
```typescript
from: "Randevu Sistemi <randevu@senindomain.com>"
```

Domain doğrulama: `RESEND_SETUP_GUIDE.md` → Production Modu

### Template Düzenle

**Dosya:** `functions/src/email.ts`

**Değiştirilebilir:**
- Renkler (gradient değerleri)
- Başlıklar ve metinler
- Buton linkleri
- Stil ve layout

### URL'leri Güncelle

```typescript
// Müşteri butonu
href="https://senindomain.com/appointments"

// Salon sahibi butonu
href="https://senindomain.com/owner/reservations"
```

---

## 🧪 Test & Debug

### Local Test
```bash
cd functions
npm run serve
# Emulator'da test randevusu oluştur
```

### Production Logs
```bash
# Function logs
firebase functions:log --only onAppointmentCreated

# Realtime logs
firebase functions:log --only onAppointmentCreated --follow
```

### Resend Dashboard
```
https://resend.com/emails
```
- Delivery status
- Error messages
- Email logs

---

## 📊 Maliyet

### Resend Free Plan
- 3,000 email/ay
- 100 email/gün
- **Maliyet:** $0/ay

### Firebase Functions
- 2M invocation/ay (free)
- Her randevu = 1 invocation
- **Maliyet:** Genelde $0/ay

**Toplam:** $0/ay (çoğu işletme için)

---

## 🎯 Sonraki Adımlar (Opsiyonel)

### 1. Hatırlatma Emaili
24 saat öncesi otomatik hatırlatma

### 2. İptal Bildirimi
Randevu iptal edildiğinde email

### 3. Review İsteği
Randevu tamamlandıktan sonra değerlendirme isteği

### 4. WhatsApp Entegrasyonu
Email yerine/yanında WhatsApp bildirimleri

**Detaylar:** `EMAIL_SYSTEM_COMPLETE.md` → Sonraki Özellikler

---

## 📞 Destek

**Dokümantasyon:**
- Resend: https://resend.com/docs
- Firebase: https://firebase.google.com/docs/functions

**Dashboard:**
- Firebase Console: https://console.firebase.google.com/project/ruloposs
- Resend Dashboard: https://resend.com/emails

**Support:**
- Resend: support@resend.com
- Firebase: https://firebase.google.com/support

---

## ✅ Durum

### Hazır ✅
- [x] Email Cloud Function
- [x] Type definitions
- [x] Otomatik email toplama
- [x] Modern HTML templates
- [x] Deployment scripts
- [x] Dokümantasyon
- [x] Email previews

### Yapılacak ⏳
- [ ] Resend hesabı aç
- [ ] API key al
- [ ] API key'i Firebase'e ekle
- [ ] Deploy et
- [ ] Test et

---

## 🎉 Başla!

Email sistemi **tamamen hazır**! Sadece 5 dakikada aktif edebilirsin:

```bash
# 1. Resend'e git
https://resend.com

# 2. API key ekle
firebase functions:secrets:set RESEND_API_KEY

# 3. Deploy et
.\deploy-email-functions.ps1

# 4. Test et
# Yeni randevu oluştur → Email'leri kontrol et
```

**Hızlı kurulum:** `QUICK_EMAIL_SETUP.md` 🚀
