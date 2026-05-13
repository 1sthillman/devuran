# Firebase Kurulum Rehberi

Bu proje Firebase ile entegre edilmiştir. Aşağıdaki adımları takip ederek Firebase'i projenize bağlayabilirsiniz.

## 1. Firebase Projesi Oluşturma

1. [Firebase Console](https://console.firebase.google.com/) adresine gidin
2. "Add project" butonuna tıklayın
3. Proje adını girin (örn: "randevu-app")
4. Google Analytics'i isteğe bağlı olarak etkinleştirin
5. Projeyi oluşturun

## 2. Web Uygulaması Ekleme

1. Firebase Console'da projenize gidin
2. "Web" ikonuna (</>)  tıklayın
3. Uygulama adını girin
4. Firebase Hosting'i şimdilik atlayabilirsiniz
5. Firebase yapılandırma bilgilerini kopyalayın

## 3. Environment Variables Ayarlama

1. Proje kök dizininde `.env` dosyası oluşturun
2. `.env.example` dosyasındaki değişkenleri kopyalayın
3. Firebase Console'dan aldığınız değerleri yapıştırın:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-ABC123XYZ
```

## 4. Firebase Authentication Kurulumu

1. Firebase Console'da "Authentication" bölümüne gidin
2. "Get started" butonuna tıklayın
3. Sign-in method sekmesinde şu yöntemleri etkinleştirin:
   - **Email/Password**: Enable
   - **Google**: Enable (OAuth client ID gerektirir)

### Google Sign-In Yapılandırması

1. Google Cloud Console'da OAuth 2.0 Client ID oluşturun
2. Authorized JavaScript origins ekleyin:
   - `http://localhost:3000` (development)
   - Production domain'iniz
3. Authorized redirect URIs ekleyin:
   - `https://your-project.firebaseapp.com/__/auth/handler`

## 5. Firestore Database Kurulumu

1. Firebase Console'da "Firestore Database" bölümüne gidin
2. "Create database" butonuna tıklayın
3. **Production mode** seçin (güvenlik kurallarını sonra ekleyeceğiz)
4. Lokasyon seçin (örn: europe-west1)
5. "Enable" butonuna tıklayın

### Firestore Security Rules

Firebase Console'da "Firestore Database" > "Rules" sekmesine gidin ve aşağıdaki kuralları yapıştırın:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isSalonOwner(salonId) {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.salonId == salonId &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['owner', 'admin'];
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isOwner(userId);
      allow delete: if false; // Users cannot be deleted
    }
    
    // Salons collection
    match /salons/{salonId} {
      allow read: if true; // Public read
      allow create: if isAuthenticated() && 
                       request.resource.data.ownerId == request.auth.uid;
      allow update: if isSalonOwner(salonId);
      allow delete: if isSalonOwner(salonId);
    }
    
    // Services collection
    match /services/{serviceId} {
      allow read: if true; // Public read
      allow create, update, delete: if isAuthenticated() && 
                                       isSalonOwner(request.resource.data.salonId);
    }
    
    // Staff collection
    match /staff/{staffId} {
      allow read: if true; // Public read
      allow create, update, delete: if isAuthenticated() && 
                                       isSalonOwner(request.resource.data.salonId);
    }
    
    // Appointments collection
    match /appointments/{appointmentId} {
      allow read: if isAuthenticated() && 
                     (request.auth.uid == resource.data.userId || 
                      isSalonOwner(resource.data.salonId));
      allow create: if isAuthenticated() && 
                       request.auth.uid == request.resource.data.userId;
      allow update: if isAuthenticated() && 
                       (request.auth.uid == resource.data.userId || 
                        isSalonOwner(resource.data.salonId));
      allow delete: if isAuthenticated() && 
                       (request.auth.uid == resource.data.userId || 
                        isSalonOwner(resource.data.salonId));
    }
    
    // Reviews collection
    match /reviews/{reviewId} {
      allow read: if true; // Public read
      allow create: if isAuthenticated() && 
                       request.auth.uid == request.resource.data.userId;
      allow update: if isOwner(resource.data.userId) || 
                       isSalonOwner(resource.data.salonId); // Owner can respond
      allow delete: if isOwner(resource.data.userId);
    }
    
    // Availability collection
    match /availability/{availabilityId} {
      allow read: if true; // Public read
      allow write: if isAuthenticated() && isSalonOwner(resource.data.salonId);
    }
  }
}
```

## 6. Firestore Indexes

Bazı sorgular için composite index gereklidir. Firebase Console'da "Firestore Database" > "Indexes" sekmesine gidin ve aşağıdaki indexleri oluşturun:

### Appointments Collection

1. **Index 1**: User appointments by date
   - Collection: `appointments`
   - Fields:
     - `userId` (Ascending)
     - `date` (Descending)

2. **Index 2**: Salon appointments by date
   - Collection: `appointments`
   - Fields:
     - `salonId` (Ascending)
     - `date` (Ascending)

3. **Index 3**: Staff availability check
   - Collection: `appointments`
   - Fields:
     - `staffId` (Ascending)
     - `date` (Ascending)
     - `status` (Ascending)

### Reviews Collection

1. **Index**: Salon reviews by date
   - Collection: `reviews`
   - Fields:
     - `salonId` (Ascending)
     - `createdAt` (Descending)

## 7. Firebase Storage Kurulumu (Opsiyonel)

Salon görselleri ve profil fotoğrafları için:

1. Firebase Console'da "Storage" bölümüne gidin
2. "Get started" butonuna tıklayın
3. Security rules'u ayarlayın:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /salons/{salonId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && 
                      firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.salonId == salonId;
    }
    
    match /users/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 8. Firebase CLI ile Deploy (Opsiyonel)

```bash
# Firebase CLI kurulumu
npm install -g firebase-tools

# Firebase'e giriş
firebase login

# Projeyi başlat
firebase init

# Seçenekler:
# - Firestore
# - Hosting
# - Storage

# Deploy
firebase deploy
```

## 9. Test Verisi Ekleme

Firestore Console'dan manuel olarak test verisi ekleyebilirsiniz:

### Örnek Salon Verisi

Collection: `salons`

```json
{
  "name": "Elit Kuaför",
  "slug": "elit-kuafor",
  "category": "kuafor",
  "description": "Profesyonel saç bakım hizmetleri",
  "phone": "+90 555 123 4567",
  "whatsappNumber": "+90 555 123 4567",
  "email": "info@elitkuafor.com",
  "address": {
    "full": "Atatürk Cad. No:123 Kadıköy/İstanbul",
    "district": "Kadıköy",
    "city": "İstanbul",
    "coordinates": {
      "lat": 40.9929,
      "lng": 29.0261
    }
  },
  "coverImage": "/images/salon1.jpg",
  "galleryImages": ["/images/salon1.jpg", "/images/salon2.jpg"],
  "workingHours": {
    "monday": { "open": "09:00", "close": "19:00" },
    "tuesday": { "open": "09:00", "close": "19:00" },
    "wednesday": { "open": "09:00", "close": "19:00" },
    "thursday": { "open": "09:00", "close": "19:00" },
    "friday": { "open": "09:00", "close": "19:00" },
    "saturday": { "open": "10:00", "close": "18:00" },
    "sunday": { "open": "Kapalı", "close": "Kapalı" }
  },
  "stats": {
    "averageRating": 4.8,
    "reviewCount": 156,
    "totalAppointments": 1250
  },
  "settings": {
    "advanceBookingDays": 30,
    "autoConfirm": true,
    "allowCancellation": true,
    "cancellationHours": 24
  },
  "isPremium": true,
  "isActive": true,
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

## 10. Geliştirme Ortamında Çalıştırma

```bash
# Bağımlılıkları yükle
npm install

# Development server'ı başlat
npm run dev
```

## Sorun Giderme

### Firebase bağlantı hatası
- `.env` dosyasının doğru yapılandırıldığından emin olun
- Environment variable'ların `VITE_` prefix'i ile başladığından emin olun
- Development server'ı yeniden başlatın

### Authentication hatası
- Firebase Console'da Email/Password ve Google sign-in'in etkinleştirildiğinden emin olun
- Authorized domains listesine `localhost` eklendiğinden emin olun

### Firestore permission denied
- Security rules'un doğru yapılandırıldığından emin olun
- Kullanıcının authenticate olduğundan emin olun

### Index hatası
- Firebase Console'da gerekli composite index'leri oluşturun
- Hata mesajındaki link'e tıklayarak otomatik index oluşturabilirsiniz

## Üretim Ortamına Geçiş

1. `.env.production` dosyası oluşturun
2. Production Firebase config'ini ekleyin
3. Firestore security rules'u production için sıkılaştırın
4. Rate limiting ekleyin
5. Firebase App Check'i etkinleştirin
6. Monitoring ve alerting ayarlayın

## Kaynaklar

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
