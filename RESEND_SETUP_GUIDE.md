# 🚀 Resend Kurulum Rehberi

Adım adım Resend hesabı açma ve API key alma.

---

## 📝 Adım 1: Resend Hesabı Oluştur

1. **Resend'e git:** https://resend.com
2. **Sign Up** butonuna tıkla
3. Email adresini gir ve hesap oluştur
4. Email'ini doğrula

---

## 🔑 Adım 2: API Key Al

1. Resend Dashboard'a giriş yap
2. Sol menüden **API Keys** sekmesine tıkla
3. **Create API Key** butonuna tıkla
4. Key'e isim ver (örn: "Randevu Sistemi")
5. **Permission:** "Full Access" seç
6. **Create** butonuna tıkla
7. **API Key'i kopyala** (örn: `re_123abc...`)

⚠️ **ÖNEMLİ:** API key'i sadece bir kez gösterilir! Güvenli bir yere kaydet.

---

## 🔐 Adım 3: API Key'i Firebase'e Ekle

### Yöntem 1: Firebase CLI (Önerilen)

```bash
# Terminal'de çalıştır
firebase functions:secrets:set RESEND_API_KEY
```

Soracak: API key'i yapıştır ve Enter'a bas.

### Yöntem 2: Google Cloud Console

1. https://console.cloud.google.com
2. Projeyi seç: **ruloposs**
3. Sol menü → **Secret Manager**
4. **Create Secret** butonuna tıkla
5. **Name:** `RESEND_API_KEY`
6. **Secret value:** Resend API key'ini yapıştır
7. **Create Secret** butonuna tıkla

---

## 📧 Adım 4: Test Email Gönderimi

### Test Modu (Domain Doğrulama Gerekmez)

Başlangıçta `onboarding@resend.dev` adresi kullanılıyor. Bu adres:
- ✅ Domain doğrulama gerektirmez
- ✅ Hemen kullanılabilir
- ✅ Günde 100 email gönderebilir
- ⚠️ Sadece test için

### Production Modu (Kendi Domain'in)

Kendi domain'inden email göndermek için:

1. **Resend Dashboard → Domains**
2. **Add Domain** butonuna tıkla
3. Domain'ini gir (örn: `devuran.com`)
4. DNS kayıtlarını ekle:

```
TXT  @  "v=spf1 include:resend.com ~all"
CNAME resend._domainkey  resend._domainkey.resend.com
CNAME resend2._domainkey resend2._domainkey.resend.com
```

5. **Verify** butonuna tıkla (DNS yayılması 5-30 dk sürebilir)
6. Doğrulama tamamlanınca `functions/src/email.ts` dosyasında:

```typescript
from: "Randevu Sistemi <randevu@senindomain.com>"
```

---

## 🚀 Adım 5: Deploy

### Windows (PowerShell):
```powershell
.\deploy-email-functions.ps1
```

### Mac/Linux (Bash):
```bash
chmod +x deploy-email-functions.sh
./deploy-email-functions.sh
```

### Manuel Deploy:
```bash
cd functions
npm run build
cd ..
firebase deploy --only functions
```

---

## 🧪 Adım 6: Test Et

### 1. Yeni Randevu Oluştur

Uygulamada normal bir randevu oluştur.

### 2. Firebase Logs Kontrol

```bash
firebase functions:log --only onAppointmentCreated
```

Veya Firebase Console:
- https://console.firebase.google.com
- Functions → Logs
- `onAppointmentCreated` fonksiyonunu bul

### 3. Resend Dashboard Kontrol

- https://resend.com/emails
- Son gönderilen emailleri gör
- Delivery status kontrol et

---

## 📊 Resend Free Plan Limitleri

| Özellik | Limit |
|---------|-------|
| Aylık Email | 3,000 |
| Günlük Email | 100 |
| Domain Sayısı | 1 |
| API Key Sayısı | Sınırsız |
| Email Boyutu | 40 MB |

**Not:** Çoğu küçük-orta işletme için ücretsiz plan yeterli.

---

## 🔍 Troubleshooting

### "Invalid API key" Hatası

**Çözüm:**
```bash
# API key'i kontrol et
firebase functions:secrets:access RESEND_API_KEY

# Yanlışsa tekrar ekle
firebase functions:secrets:delete RESEND_API_KEY
firebase functions:secrets:set RESEND_API_KEY
```

### "Domain not verified" Hatası

**Çözüm:**
- Test için `onboarding@resend.dev` kullan
- Production için DNS kayıtlarını kontrol et
- DNS yayılması için 30 dk bekle

### Email Gitmiyor

**Kontrol Listesi:**
- [ ] API key doğru mu?
- [ ] Function deploy edildi mi?
- [ ] User'ın email'i var mı? (Firestore → users)
- [ ] Salon owner email'i var mı? (Firestore → salons)
- [ ] Resend Dashboard'da hata var mı?

---

## 📞 Destek

**Resend Docs:** https://resend.com/docs
**Resend Support:** support@resend.com
**Firebase Functions:** https://firebase.google.com/docs/functions

---

## ✅ Checklist

Kurulum tamamlandı mı?

- [ ] Resend hesabı oluşturuldu
- [ ] API key alındı
- [ ] API key Firebase'e eklendi
- [ ] Functions build edildi
- [ ] Functions deploy edildi
- [ ] Test randevusu oluşturuldu
- [ ] Email gönderimi doğrulandı

Hepsi tamamsa: **🎉 Email sistemi aktif!**
