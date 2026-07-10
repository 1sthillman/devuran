# ⚡ 5 Dakikada Firebase Deploy

## Hızlı Setup (Deneyimli Kullanıcılar İçin)

```bash
# 1. Firebase CLI
npm install -g firebase-tools
firebase login

# 2. Environment Variables
firebase functions:config:set \
  google.client_id="YOUR_CLIENT_ID" \
  google.client_secret="YOUR_SECRET" \
  encryption.key="$(node -e 'console.log(require("crypto").randomBytes(32).toString("base64"))')"

# 3. Proje ID'yi güncelle
# .firebaserc dosyasında "your-project-id" yerine gerçek ID'yi yaz

# 4. Build
cd frontend && npm install && npm run build && cd ..
cd functions && npm install && npm run build && cd ..

# 5. Deploy
firebase deploy

# ✅ TAMAM! URL'in: https://your-project.web.app
```

---

## Test Et

```bash
# Health check
curl https://your-project.web.app/api/health

# OAuth flow başlat (tarayıcıda aç)
https://your-project.web.app/api/v1/google/oauth/initiate?userId=test-user
```

---

## Local Test (Opsiyonel)

```bash
# Emulator başlat
firebase emulators:start

# Terminal 2: Frontend
cd frontend && npm run dev

# Frontend: http://localhost:5173
# API: http://localhost:5001/your-project/europe-west1/api
```

---

## Logs

```bash
# Canlı logs
firebase functions:log --only api

# Errors only
firebase functions:log --level error
```

---

## Rollback

```bash
# Firebase Console → Functions → Select version → Rollback
# Veya:
firebase hosting:clone SOURCE:version TARGET:previous
```

---

## Maliyet

- **İlk 2M API call/month:** ÜCRETSİZ
- **Hosting:** ÜCRETSİZ
- **Firestore ilk 50K read/day:** ÜCRETSİZ

**Ücretsiz başla!** 🎉

---

## Daha Fazla Bilgi

- Detaylı rehber: `FIREBASE_DEPLOYMENT_GUIDE.md`
- Firebase vs Docker: `FIREBASE_VS_DOCKER.md`
- Basit açıklama: `SIMPLE_FIREBASE_SETUP.md`
