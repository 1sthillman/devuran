# 🚀 Firebase Deployment Rehberi

## Hızlı Başlangıç (15 Dakika)

### 1. Firebase CLI Kurulumu

```bash
# Firebase CLI'yi global olarak yükle
npm install -g firebase-tools

# Firebase'e giriş yap
firebase login

# Projenin kök dizininde init et
firebase init
```

**Init sırasında seçenekler:**
- ☑ Firestore (Database)
- ☑ Functions (Backend)
- ☑ Hosting (Frontend)

**Sorular:**
- Use existing project? → **EVET** (eğer varsa)
- TypeScript? → **EVET**
- ESLint? → **HAYIR** (zaten var)
- Install dependencies? → **EVET**
- Public directory? → **frontend/dist**
- Single-page app? → **EVET**
- GitHub deploys? → **HAYIR** (manuel deploy yapacağız)

---

## 2. Environment Variables Ayarları

### Production için Firebase Functions Config

```bash
# Google OAuth credentials
firebase functions:config:set \
  google.client_id="YOUR_CLIENT_ID.apps.googleusercontent.com" \
  google.client_secret="YOUR_CLIENT_SECRET" \
  google.redirect_uri="https://YOUR_PROJECT.web.app/api/v1/google/oauth/callback"

# Encryption key (32 byte base64)
firebase functions:config:set \
  encryption.key="YOUR_32_BYTE_BASE64_KEY"

# Redis (opsiyonel - Cloud Memorystore kullanıyorsan)
firebase functions:config:set \
  redis.host="10.x.x.x" \
  redis.port="6379" \
  redis.password="your-redis-password"

# Feature flags
firebase functions:config:set \
  google_integration.enabled="true" \
  redis.enabled="false"

# Ayarları görüntüle
firebase functions:config:get
```

### Encryption Key Oluşturma

```bash
# Node.js ile güvenli key oluştur
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 3. Google Cloud Console Ayarları

### OAuth 2.0 Credentials

1. **Google Cloud Console'a git:** https://console.cloud.google.com
2. **APIs & Services → Credentials**
3. **Create Credentials → OAuth 2.0 Client ID**
4. **Application Type:** Web application
5. **Authorized redirect URIs ekle:**
   ```
   https://YOUR_PROJECT.web.app/api/v1/google/oauth/callback
   https://YOUR_PROJECT.firebaseapp.com/api/v1/google/oauth/callback
   ```
6. **Client ID ve Secret'ı kaydet**

### Google Business Profile API

1. **APIs & Services → Library**
2. **"Google Business Profile API" ara**
3. **Enable** butonuna bas
4. **"Google My Business API" (eski versiyon) de enable et**

### Service Account Permissions

1. **IAM & Admin → Service Accounts**
2. Firebase Admin SDK service account'unu bul
3. **Permissions ekle:**
   - Firestore Data Editor
   - Cloud Functions Developer
   - Cloud Scheduler Admin (background jobs için)

---

## 4. Firestore Setup

### Database Oluştur

```bash
# Firestore rules ve indexes deploy et
firebase deploy --only firestore
```

**Manuel Adımlar (Firebase Console):**
1. https://console.firebase.google.com
2. Projenizi seçin
3. **Build → Firestore Database**
4. **Create database**
5. **Start in production mode**
6. **Region:** europe-west1 (Turkey'ye yakın)

### İlk Verileri Yükle (Opsiyonel)

```bash
# Sample data script'i çalıştır
node scripts/init-firestore.js
```

---

## 5. Frontend Build

```bash
cd frontend
npm install
npm run build

# frontend/dist/ klasörü oluşur
cd ..
```

---

## 6. Functions Build ve Test

```bash
cd functions
npm install
npm run build

# Local emulator ile test (opsiyonel)
cd ..
firebase emulators:start

# Emulator URLs:
# - Functions: http://localhost:5001/your-project/europe-west1/api
# - Firestore: http://localhost:8080
# - Hosting: http://localhost:5000
```

---

## 7. Deploy!

### İlk Deploy (Tümü)

```bash
# Herşeyi deploy et
firebase deploy

# Çıktı:
✔ Deploy complete!

Project Console: https://console.firebase.google.com/project/YOUR_PROJECT
Hosting URL: https://YOUR_PROJECT.web.app
Functions: https://europe-west1-YOUR_PROJECT.cloudfunctions.net/api
```

### Kısmi Deploy (Hızlı)

```bash
# Sadece frontend
firebase deploy --only hosting

# Sadece backend
firebase deploy --only functions

# Sadece database rules
firebase deploy --only firestore:rules

# Sadece indexes
firebase deploy --only firestore:indexes
```

---

## 8. Deployment Sonrası Kontroller

### Health Check

```bash
# API health check
curl https://YOUR_PROJECT.web.app/api/health

# Beklenen response:
{
  "status": "healthy",
  "timestamp": "2024-...",
  "uptime": 123.45,
  "environment": "production"
}
```

### Functions Logs

```bash
# Canlı log izle
firebase functions:log --only api

# Son 10 satır
firebase functions:log --only api --limit 10

# Hata logları
firebase functions:log --only api --level error
```

### Firestore Kontrol

Firebase Console'dan:
1. **Firestore Database**
2. Collections'ları kontrol et:
   - `google_integrations` (boş olacak - henüz kullanıcı yok)
   - `google_locations` (boş)
   - `bookings` (boş)

---

## 9. İlk OAuth Testi

### Manuel Test

1. **OAuth başlat:**
   ```
   https://YOUR_PROJECT.web.app/api/v1/google/oauth/initiate?userId=test-user-1
   ```

2. **Google login sayfası açılacak**

3. **İzin ver → Callback URL'e yönlendirileceksin**

4. **Token kontrol et:**
   ```bash
   curl https://YOUR_PROJECT.web.app/api/v1/google/oauth/status?userId=test-user-1
   ```

---

## 10. Custom Domain (Opsiyonel)

### Domain Bağlama

```bash
# Firebase Console → Hosting → Add custom domain
# Örnek: randevu.example.com
```

**Adımlar:**
1. Domain adını gir
2. DNS kayıtlarını kopyala
3. Domain sağlayıcınızda (GoDaddy, Namecheap, vs.) ekle:
   ```
   Type: A
   Name: randevu
   Value: (Firebase IP)
   
   Type: TXT
   Name: randevu
   Value: (verification code)
   ```
4. Verify butonuna bas
5. SSL sertifikası otomatik oluşur (~15 dakika)

---

## 11. Monitoring & Alerts

### Firebase Console

**Performance Monitoring:**
- https://console.firebase.google.com/project/YOUR_PROJECT/performance

**Crashlytics:**
- https://console.firebase.google.com/project/YOUR_PROJECT/crashlytics

**Google Cloud Monitoring:**
- https://console.cloud.google.com/monitoring

### Alerts Ayarla

```bash
# Cloud Monitoring → Alerting → Create Policy

# Örnek alert: Function error rate > 5%
# Notification: Email/SMS
```

---

## 12. Rollback (Geri Alma)

### Son Deploy'u Geri Al

```bash
# Hosting rollback
firebase hosting:clone YOUR_PROJECT:source-id YOUR_PROJECT:previous-version-id

# Functions rollback (manual)
# Firebase Console → Functions → Select version → Rollback
```

---

## 13. Maliyet Optimizasyonu

### Ücretsiz Tier Limitleri

- Hosting: 10 GB/month
- Functions: 2M invocations/month
- Firestore: 1 GB storage, 50K reads/day
- **Toplam: $0/month** (başlangıç için yeterli!)

### Ücretli Tier Geçiş

```bash
# Blaze plan'a geç (pay as you go)
# Firebase Console → Upgrade
```

**Tahmini maliyet (100 işletme):**
- Functions: ~$20/month
- Firestore: ~$30/month
- Hosting: Ücretsiz
- **Toplam: ~$50/month**

---

## 14. Backup Strategy

### Firestore Otomatik Backup

```bash
# Cloud Console → Firestore → Schedule Backup

# Ayarlar:
# - Frequency: Daily
# - Time: 03:00 UTC
# - Retention: 7 days
# - Location: europe-west1
```

---

## 15. Troubleshooting

### Function Deploy Hatası

```bash
# Error: Permission denied
# Fix: IAM rollerini kontrol et

# Error: Timeout
# Fix: functions/tsconfig.json kontrol et
```

### CORS Hatası

```javascript
// src/app.ts içinde CORS ayarını kontrol et
app.use(cors({
  origin: ['https://YOUR_PROJECT.web.app'],
  credentials: true,
}));
```

### OAuth Redirect Hatası

```bash
# Google Cloud Console'da redirect URI kontrol et
# Tam URL olmalı:
https://YOUR_PROJECT.web.app/api/v1/google/oauth/callback
```

---

## 16. Checklist (Deploy Öncesi)

- [ ] Firebase CLI yüklü (`firebase --version`)
- [ ] Firebase login yapıldı (`firebase login`)
- [ ] `.firebaserc` dosyası var ve doğru proje ID'si içeriyor
- [ ] `firebase.json` dosyası var
- [ ] Google OAuth credentials alındı
- [ ] Encryption key oluşturuldu
- [ ] `firebase functions:config:set` ile env variables set edildi
- [ ] Frontend build edildi (`frontend/dist/` var)
- [ ] Functions build edildi (`functions/lib/` oluşuyor)
- [ ] Firestore rules ve indexes hazır

---

## 17. Deployment Komutları (Özet)

```bash
# 1. Login
firebase login

# 2. Proje seç
firebase use YOUR_PROJECT_ID

# 3. Environment variables
firebase functions:config:set google.client_id="..." google.client_secret="..." encryption.key="..."

# 4. Frontend build
cd frontend && npm install && npm run build && cd ..

# 5. Functions build
cd functions && npm install && npm run build && cd ..

# 6. Deploy
firebase deploy

# 7. Test
curl https://YOUR_PROJECT.web.app/api/health
```

---

## 18. Production Checklist

- [ ] Custom domain bağlandı
- [ ] SSL sertifikası aktif
- [ ] Monitoring alerts ayarlandı
- [ ] Backup schedule aktif
- [ ] Error tracking aktif (Cloud Logging)
- [ ] Budget alerts ayarlandı (Cloud Billing)
- [ ] CORS doğru domain'leri içeriyor
- [ ] OAuth redirect URIs production URL'leri içeriyor
- [ ] Rate limiting aktif (functions)
- [ ] Security rules production'a uygun

---

## 🎉 Tamamlandı!

**Live URL'in:** https://YOUR_PROJECT.web.app

**API Endpoint:** https://YOUR_PROJECT.web.app/api/v1

**Dashboard:** https://YOUR_PROJECT.web.app/dashboard/google-integration

**OAuth Flow:** https://YOUR_PROJECT.web.app/api/v1/google/oauth/initiate?userId=YOUR_USER_ID

---

## 📞 Yardım

**Firebase Docs:** https://firebase.google.com/docs  
**Functions Docs:** https://firebase.google.com/docs/functions  
**Support:** https://firebase.google.com/support

**Sorun mu var?**
```bash
# Functions logs
firebase functions:log

# Debug mode deploy
firebase deploy --only functions --debug
```
