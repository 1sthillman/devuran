# 🔥 Google Maps Integration - Firebase Deployment

## Proje Hakkında

Google Maps ve Google Business Profile entegrasyonu için serverless backend ve frontend uygulaması.

**Teknoloji Stack:**
- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Firebase Functions (Express.js)
- **Database:** Cloud Firestore
- **Auth:** Firebase Authentication
- **Cache:** Cloud Memorystore (opsiyonel)

---

## ⚡ Hızlı Başlangıç

### Gereksinimler
- Node.js 18+
- npm 9+
- Firebase CLI
- Google Cloud Project
- Google OAuth credentials

### 5 Dakikada Deploy

```bash
# 1. Firebase CLI kur ve login
npm install -g firebase-tools
firebase login

# 2. Projeyi klonla ve bağımlılıkları yükle
git clone <repo-url>
cd google-maps-integration

# 3. .firebaserc'de proje ID'yi güncelle
# "your-project-id" → gerçek Firebase project ID

# 4. Environment variables
firebase functions:config:set \
  google.client_id="YOUR_CLIENT_ID" \
  google.client_secret="YOUR_SECRET" \
  encryption.key="$(node -e 'console.log(require("crypto").randomBytes(32).toString("base64"))')"

# 5. Build ve Deploy
cd frontend && npm install && npm run build && cd ..
cd functions && npm install && npm run build && cd ..
firebase deploy

# ✅ Canlı: https://your-project.web.app
```

**Detaylı rehber:** [`FIREBASE_DEPLOYMENT_GUIDE.md`](./FIREBASE_DEPLOYMENT_GUIDE.md)

---

## 📁 Proje Yapısı

```
.
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API clients
│   │   └── types/           # TypeScript types
│   └── dist/                # Build output (hosting)
│
├── functions/                # Firebase Functions
│   ├── src/
│   │   └── index.ts        # Functions entry point
│   ├── package.json
│   └── tsconfig.json
│
├── src/                      # Backend source
│   ├── app.ts              # Express app
│   ├── routes/             # API routes
│   │   ├── google/         # Google integration
│   │   ├── booking.routes.ts
│   │   └── analytics.routes.ts
│   ├── services/           # Business logic
│   │   ├── google/         # Google APIs
│   │   ├── availability-engine.service.ts
│   │   └── lock-manager.service.ts
│   ├── models/             # TypeScript types
│   ├── middleware/         # Express middleware
│   ├── jobs/               # Background jobs
│   ├── utils/              # Utilities
│   └── config/             # Configuration
│
├── firestore.rules          # Security rules
├── firestore.indexes.json   # Database indexes
├── firebase.json            # Firebase config
└── .firebaserc              # Project config
```

---

## 🚀 Özellikler

### 1. Google OAuth 2.0 Integration
- Automatic token refresh
- Secure token storage (encrypted)
- Offline access support
- Multi-user support

### 2. Google Business Profile (GBP) API
- Location management
- Appointment URL generation
- Automatic sync (every 6 hours)
- Rate limiting (10 QPS)

### 3. Appointment Booking System
- Public booking pages
- Real-time availability calculation
- Distributed locking (no double-bookings)
- UTM tracking & analytics

### 4. Admin Dashboard
- Integration overview
- Location management
- Statistics & analytics
- Audit logs
- Settings management

### 5. Background Jobs
- Token refresh (every 30 minutes)
- Location sync (every 6 hours)
- Lock cleanup (every 15 minutes)

---

## 🔧 Configuration

### Environment Variables (Firebase Functions)

```bash
# Google OAuth
firebase functions:config:set \
  google.client_id="YOUR_CLIENT_ID.apps.googleusercontent.com" \
  google.client_secret="YOUR_CLIENT_SECRET" \
  google.redirect_uri="https://your-project.web.app/api/v1/google/oauth/callback"

# Encryption
firebase functions:config:set \
  encryption.key="YOUR_32_BYTE_BASE64_KEY"

# Redis (optional)
firebase functions:config:set \
  redis.host="10.x.x.x" \
  redis.port="6379" \
  redis.password="your-password"

# Feature flags
firebase functions:config:set \
  google_integration.enabled="true" \
  redis.enabled="false"
```

### Google Cloud Console Setup

1. **OAuth 2.0 Client:**
   - Console: https://console.cloud.google.com/apis/credentials
   - Create OAuth 2.0 Client ID
   - Add redirect URI: `https://your-project.web.app/api/v1/google/oauth/callback`

2. **Enable APIs:**
   - Google Business Profile API
   - Google My Business API

3. **Firestore Database:**
   - Create database in `europe-west1`
   - Production mode

---

## 📊 API Endpoints

### Google Integration

```
POST   /api/v1/google/oauth/initiate      # Start OAuth flow
GET    /api/v1/google/oauth/callback      # OAuth callback
POST   /api/v1/google/oauth/revoke        # Revoke access
GET    /api/v1/google/oauth/status        # Check status

GET    /api/v1/google/gbp/locations       # List locations
POST   /api/v1/google/gbp/sync            # Sync locations
POST   /api/v1/google/gbp/activate        # Activate location
POST   /api/v1/google/gbp/deactivate      # Deactivate location

GET    /api/v1/google/dashboard/status    # Dashboard status
GET    /api/v1/google/dashboard/stats     # Statistics
GET    /api/v1/google/dashboard/logs      # Audit logs
```

### Booking (Public)

```
GET    /api/v1/booking/:urlSlug/business  # Business info
GET    /api/v1/booking/:urlSlug/services  # Services list
POST   /api/v1/booking/:urlSlug/availability  # Available slots
POST   /api/v1/booking/:urlSlug/book      # Create booking
```

---

## 🧪 Testing

### Local Development

```bash
# Terminal 1: Firebase emulator
firebase emulators:start

# Terminal 2: Frontend dev server
cd frontend
npm run dev

# Frontend: http://localhost:5173
# API: http://localhost:5001/your-project/europe-west1/api
```

### Unit Tests

```bash
# Backend tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## 📦 Deployment

### Full Deploy

```bash
firebase deploy
```

### Partial Deploy

```bash
# Frontend only
firebase deploy --only hosting

# Backend only
firebase deploy --only functions

# Database rules
firebase deploy --only firestore:rules

# Indexes
firebase deploy --only firestore:indexes
```

---

## 📈 Monitoring

### Firebase Console

- **Functions:** https://console.firebase.google.com/project/YOUR_PROJECT/functions
- **Firestore:** https://console.firebase.google.com/project/YOUR_PROJECT/firestore
- **Hosting:** https://console.firebase.google.com/project/YOUR_PROJECT/hosting

### Logs

```bash
# Real-time logs
firebase functions:log

# Specific function
firebase functions:log --only api

# Error only
firebase functions:log --level error
```

### Google Cloud Console

- **Monitoring:** https://console.cloud.google.com/monitoring
- **Logging:** https://console.cloud.google.com/logs
- **Error Reporting:** https://console.cloud.google.com/errors

---

## 💰 Maliyet

### Ücretsiz Tier (Başlangıç)

- Firebase Hosting: 10 GB/month
- Cloud Functions: 2M invocations/month
- Firestore: 1 GB storage, 50K reads/day
- **Toplam: $0/month**

### Ücretli (100 işletme tahmini)

- Functions: ~$20-40/month
- Firestore: ~$30-60/month
- Hosting: Ücretsiz
- **Toplam: ~$50-100/month**

**Detaylar:** [`FIREBASE_VS_DOCKER.md`](./FIREBASE_VS_DOCKER.md)

---

## 🔒 Security

### Firestore Security Rules

- User data isolation
- Role-based access (business_owner, admin)
- Rate limiting on public endpoints
- XSS/CSRF protection

### Best Practices

- Encrypted tokens (AES-256-GCM)
- HTTPS only
- CORS configured
- Input validation
- SQL injection prevention (N/A - NoSQL)

---

## 🐛 Troubleshooting

### Function Deploy Error

```bash
# Check IAM permissions
# Service account needs: Cloud Functions Developer

# Debug mode
firebase deploy --only functions --debug
```

### CORS Error

```javascript
// src/app.ts
app.use(cors({
  origin: ['https://your-project.web.app'],
  credentials: true,
}));
```

### OAuth Redirect Error

```
# Check Google Cloud Console
# Redirect URI must exactly match:
https://your-project.web.app/api/v1/google/oauth/callback
```

---

## 📚 Documentation

- **Quick Start:** [`QUICK_FIREBASE_START.md`](./QUICK_FIREBASE_START.md)
- **Deployment Guide:** [`FIREBASE_DEPLOYMENT_GUIDE.md`](./FIREBASE_DEPLOYMENT_GUIDE.md)
- **Firebase vs Docker:** [`FIREBASE_VS_DOCKER.md`](./FIREBASE_VS_DOCKER.md)
- **Simple Setup:** [`SIMPLE_FIREBASE_SETUP.md`](./SIMPLE_FIREBASE_SETUP.md)
- **Architecture:** [`RECOMMENDED_SETUP.md`](./RECOMMENDED_SETUP.md)

---

## 🤝 Contributing

1. Fork the repo
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file

---

## 🆘 Support

**Issues:** GitHub Issues
**Docs:** Firebase Documentation - https://firebase.google.com/docs
**Email:** support@yourcompany.com

---

## ✅ Production Checklist

- [ ] Firebase project created
- [ ] OAuth credentials configured
- [ ] Environment variables set
- [ ] Custom domain added (optional)
- [ ] SSL certificate active
- [ ] Monitoring alerts configured
- [ ] Backup schedule enabled
- [ ] Budget alerts set
- [ ] Security rules reviewed
- [ ] Rate limiting tested
- [ ] Error tracking active
- [ ] Documentation updated

---

**Built with ❤️ for Turkish market 🇹🇷**

**Firebase > Docker** 🔥
