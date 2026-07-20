# 🚀 HEMEN DEPLOY ET!

## En Kolay Yöntem: Vercel Dashboard

### 1. Vercel'e Git
https://vercel.com

### 2. Login Ol
- GitHub hesabınla giriş yap
- Veya email ile kayıt ol

### 3. "Add New Project" Tıkla
Sol üstteki "Add New..." → "Project"

### 4. Import Repository
**Seçenek A: GitHub'dan**
- GitHub repo'nuzu bağlayın
- Repo'yu seçin

**Seçenek B: Manuel**
- "Import Third-Party Git Repository"
- Repo URL'sini girin

### 5. Configure Project

```
Framework Preset: Vite
Root Directory: app          ← ÖNEMLİ!
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### 6. Environment Variables Ekle

**ÇOK ÖNEMLİ:** Firebase config'inizi ekleyin!

`app/.env` dosyanızdaki değerleri kopyalayın:

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 7. Deploy!
"Deploy" butonuna tıklayın!

⏱️ 2-3 dakika bekleyin...

### 8. Tamamlandı! 🎉
- URL'niz: `https://your-project.vercel.app`
- Otomatik HTTPS
- Global CDN
- Otomatik yeniden deploy (her push'ta)

---

## Alternatif: CLI ile Deploy

### Terminal'de:

```bash
# 1. Vercel CLI kur (bir kez)
npm install -g vercel

# 2. Login ol
vercel login

# 3. Deploy et
cd app
vercel --prod
```

İlk deploy'da soruları cevapla:
- Set up and deploy? → **Yes**
- Which scope? → **Kendi hesabını seç**
- Link to existing project? → **No**
- Project name? → **randevu** (veya istediğin isim)
- Directory? → **./**
- Override settings? → **No**

---

## Token Sorunu mu Var?

Token geçersizse:

1. **Vercel Dashboard'a git:** https://vercel.com/account/tokens
2. **"Create Token"** tıkla
3. İsim ver: "Deploy Token"
4. **Create** tıkla
5. Token'ı kopyala
6. Kullan:

```bash
vercel --prod --token YOUR_NEW_TOKEN
```

---

## Firebase Ayarları

### Production için:

1. **Firebase Console:** https://console.firebase.google.com
2. Project Settings → General
3. "Add app" → Web
4. Config'i kopyala
5. Vercel'e environment variables olarak ekle

### Firestore Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Production rules buraya
  }
}
```

---

## Sorun mu Yaşıyorsun?

### Build Hatası:
```bash
cd app
npm run build
```
Local'de çalışıyor mu kontrol et!

### 404 Hatası:
- Root Directory: **app** olmalı
- Output Directory: **dist** olmalı
- `vercel.json` var mı kontrol et

### Firebase Bağlanamıyor:
- Environment variables ekledin mi?
- Production Firebase config mi kullanıyorsun?

---

## Hızlı Komutlar

```bash
# Preview deploy (test için)
npm run deploy:preview

# Production deploy
npm run deploy

# Build test
npm run build

# Local preview
npm run preview
```

---

## Sonraki Adımlar

1. ✅ Deploy tamamlandı
2. 🌐 Custom domain ekle (opsiyonel)
3. 📊 Analytics aktif et
4. 🔔 Deployment notifications ayarla
5. 🚀 Her push otomatik deploy olacak!

---

**Şimdi deploy et ve canlıya al! 🎉**

Sorularınız için: https://vercel.com/docs
