# Vercel Deploy Talimatları

## Otomatik Deploy (Önerilen)

### 1. Vercel Dashboard'dan Deploy

1. **Vercel'e Git:** https://vercel.com
2. **Login Ol** (GitHub hesabınla)
3. **"Add New Project"** butonuna tıkla
4. **Import Git Repository:**
   - GitHub repo'nuzu seç
   - Veya "Import Third-Party Git Repository" ile manuel ekle

5. **Configure Project:**
   ```
   Framework Preset: Vite
   Root Directory: app
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

6. **Environment Variables (Önemli!):**
   Firebase config'i ekle:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

7. **Deploy** butonuna tıkla!

---

## Manuel Deploy (CLI)

### 1. Vercel CLI Kur
```bash
npm install -g vercel
```

### 2. Login Ol
```bash
vercel login
```
Email adresinle login ol (tarayıcıda açılacak)

### 3. Deploy Et
```bash
cd app
vercel --prod
```

İlk deploy'da sorular:
- **Set up and deploy?** → Yes
- **Which scope?** → Kendi hesabını seç
- **Link to existing project?** → No
- **Project name?** → randevu (veya istediğin isim)
- **Directory?** → ./
- **Override settings?** → No

### 4. Sonraki Deploy'lar
```bash
cd app
vercel --prod
```

---

## Token ile Deploy (CI/CD)

### 1. Token Al
1. Vercel Dashboard → Settings → Tokens
2. "Create Token" → İsim ver → Create
3. Token'ı kopyala (bir daha gösterilmeyecek!)

### 2. Deploy Et
```bash
cd app
vercel --prod --token YOUR_TOKEN_HERE
```

---

## Vercel.json Ayarları

Proje `app/vercel.json` dosyasında yapılandırıldı:
- ✅ SPA routing (tüm route'lar index.html'e yönlendiriliyor)
- ✅ Asset caching (1 yıl)
- ✅ Vite framework preset

---

## Deploy Sonrası

### 1. Domain Ayarları
- Vercel otomatik domain verir: `your-project.vercel.app`
- Custom domain eklemek için: Project Settings → Domains

### 2. Environment Variables
- Project Settings → Environment Variables
- Firebase config'i ekle
- Redeploy gerekebilir

### 3. Analytics
- Project Settings → Analytics
- Ücretsiz analytics aktif et

---

## Sorun Giderme

### Build Hatası
```bash
# Local'de test et
cd app
npm run build
```

### Environment Variables Eksik
- Vercel Dashboard → Project → Settings → Environment Variables
- Tüm VITE_ prefix'li değişkenleri ekle
- Redeploy

### 404 Hatası
- `vercel.json` dosyası doğru mu kontrol et
- Rewrites ayarları var mı?

### Firebase Bağlantı Hatası
- Environment variables doğru mu?
- Firebase config production için mi?
- CORS ayarları yapıldı mı?

---

## Hızlı Deploy Komutu

```bash
cd app
npm run build
vercel --prod
```

---

## GitHub Actions ile Otomatik Deploy

`.github/workflows/deploy.yml` oluştur:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install Vercel CLI
        run: npm install -g vercel
      - name: Deploy to Vercel
        run: |
          cd app
          vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

GitHub Secrets'e `VERCEL_TOKEN` ekle!

---

## Önerilen Workflow

1. **Development:** Local'de geliştir
2. **Test:** `npm run build` ile test et
3. **Commit:** Git'e commit at
4. **Push:** GitHub'a push et
5. **Auto Deploy:** Vercel otomatik deploy eder!

---

## Faydalı Linkler

- Vercel Dashboard: https://vercel.com/dashboard
- Vercel Docs: https://vercel.com/docs
- Vite on Vercel: https://vercel.com/docs/frameworks/vite
- CLI Docs: https://vercel.com/docs/cli

---

## Notlar

- ✅ Build başarılı (1.03 MB)
- ✅ Vercel.json hazır
- ✅ SPA routing yapılandırıldı
- ✅ Asset caching aktif
- ⚠️ Firebase env variables eklemeyi unutma!
- ⚠️ Production Firebase config kullan!

**İyi deploylar! 🚀**
