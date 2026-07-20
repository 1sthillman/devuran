# ⚡ Hızlı Email Kurulumu

5 dakikada email bildirimleri aktif et!

---

## 🎯 Hızlı Başlangıç

### 1️⃣ Resend Hesabı Aç (2 dk)

```
1. https://resend.com → Sign Up
2. Email'ini doğrula
3. Dashboard → API Keys → Create API Key
4. Key'i kopyala (re_123abc...)
```

### 2️⃣ API Key'i Ekle (1 dk)

```bash
firebase functions:secrets:set RESEND_API_KEY
# API key'i yapıştır ve Enter
```

### 3️⃣ Deploy Et (2 dk)

**Windows:**
```powershell
.\deploy-email-functions.ps1
```

**Mac/Linux:**
```bash
chmod +x deploy-email-functions.sh
./deploy-email-functions.sh
```

### 4️⃣ Test Et (30 sn)

1. Uygulamada yeni randevu oluştur
2. Email'ini kontrol et
3. ✅ Onay emaili geldi mi?

---

## 🎉 Tamamlandı!

Artık her randevuda otomatik email gidiyor:
- ✅ Müşteriye onay emaili
- ✅ Salon sahibine bildirim emaili
- ✅ Modern HTML tasarım
- ✅ Otomatik tetikleme

---

## 📚 Detaylı Bilgi

- **Tam kurulum:** `RESEND_SETUP_GUIDE.md`
- **Teknik detaylar:** `EMAIL_NOTIFICATION_SETUP.md`
- **Troubleshooting:** `RESEND_SETUP_GUIDE.md` → Troubleshooting bölümü

---

## 🔧 Özelleştirme

Email template'lerini düzenle:
```bash
functions/src/email.ts
```

Domain değiştir:
```typescript
from: "Randevu Sistemi <randevu@senindomain.com>"
```

---

## 💡 İpuçları

**Test için:** `onboarding@resend.dev` kullan (domain doğrulama gerekmez)

**Production için:** Kendi domain'ini doğrula (DNS kayıtları gerekli)

**Ücretsiz limit:** 3,000 email/ay, 100 email/gün

---

## 🚀 Sonraki Adımlar (Opsiyonel)

1. **Hatırlatma emaili** - 24 saat öncesi
2. **İptal bildirimi** - Randevu iptal edildiğinde
3. **Review isteği** - Randevu tamamlandığında

Detaylar: `EMAIL_NOTIFICATION_SETUP.md` → Sonraki Adımlar
