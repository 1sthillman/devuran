# 🎯 Google API Başvuruları - Tam Rehber

## 📋 Özet

Google Maps entegrasyonu için 3 ana başvuru yapılacak:

1. **Google Cloud Project** (Ücretsiz)
2. **Google Business Profile API** (Ücretsiz)
3. **Firebase Blaze Plan** (Pay-as-you-go, ilk kullanımlar ücretsiz)

---

## 🚀 ADIM 1: Google Cloud Project

### 1.1 - Google Cloud Console

**URL:** https://console.cloud.google.com

**Adımlar:**
1. Google hesabınızla giriş yapın
2. Sol üst köşede proje seçici → "New Project"
3. Proje adı: `ruloposs-google-maps` (veya istediğiniz isim)
4. Organization: Yoksa boş bırakın
5. "CREATE" butonuna basın
6. **Proje ID'yi not edin** (örn: ruloposs-google-maps-12345)

**Süre:** 2 dakika  
**Maliyet:** Ücretsiz

---

## 🔐 ADIM 2: Google Business Profile API Aktif Et

### 2.1 - API Library

**URL:** https://console.cloud.google.com/apis/library

**Adımlar:**
1. Sol üstten doğru projeyi seçin (`ruloposs-google-maps`)
2. Arama kutusuna: "Google Business Profile API"
3. İlk sonuca tıklayın
4. "ENABLE" butonuna basın
5. **Aynı işlemi şunlar için de yapın:**
   - "Google My Business API" (eski versiyon)
   - "Google Maps Platform" (opsiyonel, ileride gerekebilir)

**Süre:** 2 dakika  
**Maliyet:** Ücretsiz (API kullanım limitleri mevcut)

---

## 🔑 ADIM 3: OAuth 2.0 Credentials

### 3.1 - OAuth Consent Screen

**URL:** https://console.cloud.google.com/apis/credentials/consent

**Adımlar:**
1. User Type: **External** seçin (Internal sadece Google Workspace için)
2. "CREATE" butonuna basın

**OAuth Consent Screen Bilgileri:**
- **App name:** ruloposs Google Maps Entegrasyonu
- **User support email:** sizin@email.com
- **App logo:** (opsiyonel, şimdilik atlayabilirsiniz)
- **App domain:**
  - Homepage: https://ruloposs.web.app
  - Privacy policy: https://ruloposs.web.app/privacy
  - Terms of service: https://ruloposs.web.app/terms
- **Authorized domains:** 
  - ruloposs.web.app
  - ruloposs.firebaseapp.com
- **Developer contact:** sizin@email.com

**"SAVE AND CONTINUE"**

**Scopes (İzinler):**
- Arama kutusuna: "business"
- Şunları seçin:
  - `https://www.googleapis.com/auth/business.manage`
  - `https://www.googleapis.com/auth/userinfo.email`
  - `https://www.googleapis.com/auth/userinfo.profile`

**"SAVE AND CONTINUE"**

**Test Users (Geliştirme Aşaması):**
- Kendi Google hesabınızı ekleyin
- Test etmek istediğiniz diğer hesapları ekleyin

**"SAVE AND CONTINUE"**

**Summary:**
- Kontrol edin
- "BACK TO DASHBOARD"

**Süre:** 5 dakika  
**Maliyet:** Ücretsiz

---

### 3.2 - OAuth 2.0 Client ID Oluştur

**URL:** https://console.cloud.google.com/apis/credentials

**Adımlar:**
1. "CREATE CREDENTIALS" → "OAuth 2.0 Client ID"
2. Application type: **Web application**
3. Name: `ruloposs-web-client`
4. **Authorized JavaScript origins:**
   ```
   https://ruloposs.web.app
   https://ruloposs.firebaseapp.com
   http://localhost:5173
   http://localhost:5001
   ```
5. **Authorized redirect URIs:**
   ```
   https://ruloposs.web.app/api/v1/google/oauth/callback
   https://ruloposs.firebaseapp.com/api/v1/google/oauth/callback
   http://localhost:5001/ruloposs/europe-west1/api/v1/google/oauth/callback
   ```
6. "CREATE" butonuna basın

**ÖNEMLİ:**
- **Client ID** görünecek (örn: `123456-abc.apps.googleusercontent.com`)
- **Client Secret** görünecek (örn: `GOCSPX-abc123...`)
- **İKİSİNİ DE KAYDET!** Güvenli bir yere not edin.

**Süre:** 3 dakika  
**Maliyet:** Ücretsiz

---

## 🔥 ADIM 4: Firebase Blaze Planına Geç

### 4.1 - Firebase Console

**URL:** https://console.firebase.google.com/project/ruloposs/usage/details

**Adımlar:**
1. "Upgrade to Blaze" butonuna basın
2. **Billing account** seçin veya oluşturun:
   - Kredi kartı bilgileriniz gerekli
   - İlk kullanımlar ücretsiz
   - Limitleri aşınca ücret kesilir
3. **Budget alerts** ayarlayın (ÖNERİLİR):
   - Budget: $50/month
   - Alert thresholds: 50%, 90%, 100%
   - Email notification: sizin@email.com
4. "Continue" → "Purchase"

**Maliyet Tahmini:**
- İlk aylar: $0-10/month
- 100 işletme: $50-100/month
- **İlk $300 ücretsiz credit** (yeni hesaplarda)

**Süre:** 5 dakika  
**Maliyet:** Pay-as-you-go

---

### 4.2 - Required APIs (Blaze Plan Sonrası)

Blaze plana geçtikten sonra otomatik aktif olacak:
- ✅ Cloud Functions API
- ✅ Cloud Build API
- ✅ Artifact Registry API

---

## ⚙️ ADIM 5: Firebase Functions Config

### 5.1 - Environment Variables Ayarla

Blaze plana geçtikten sonra:

```bash
# Terminal'de (projenizin root klasöründe)
npx firebase functions:config:set \
  google.client_id="YOUR_CLIENT_ID.apps.googleusercontent.com" \
  google.client_secret="YOUR_CLIENT_SECRET" \
  google.redirect_uri="https://ruloposs.web.app/api/v1/google/oauth/callback" \
  encryption.key="$(node -e 'console.log(require(\"crypto\").randomBytes(32).toString(\"base64\"))')" \
  google_integration.enabled="true" \
  redis.enabled="false"
```

**NOT:** `YOUR_CLIENT_ID` ve `YOUR_CLIENT_SECRET` yerine gerçek değerleri yazın!

**Doğrula:**
```bash
npx firebase functions:config:get
```

**Süre:** 2 dakika

---

## 🚀 ADIM 6: DEPLOYMENT

### 6.1 - Indexes Deploy (GÜVENLİ)

```bash
npx firebase deploy --only firestore:indexes
```

**Süre:** 1-2 dakika  
**Risk:** Çok düşük (sadece yeni indexler ekler)

---

### 6.2 - Functions Deploy

```bash
npx firebase deploy --only functions
```

**Süre:** 5-10 dakika  
**Risk:** Düşük (yeni functions, mevcut sisteme dokunmaz)

**Deploy edilen functions:**
- `api` - Ana API endpoint
- `health` - Health check

---

### 6.3 - Test

```bash
# Health check
curl https://europe-west1-ruloposs.cloudfunctions.net/health

# Beklenen sonuç:
{
  "status": "healthy",
  "timestamp": "2024-...",
  "message": "Firebase Functions working!",
  "project": "ruloposs"
}
```

---

## ✅ ADIM 7: OAuth Flow Test

### 7.1 - İlk OAuth Testi

**Tarayıcıda açın:**
```
https://europe-west1-ruloposs.cloudfunctions.net/api/v1/google/oauth/initiate?userId=test-user-1
```

**Ne olacak:**
1. Google login sayfası açılacak
2. Hesap seçeceksiniz
3. İzinleri onaylayacaksınız
4. Callback URL'e yönlendirileceksiniz
5. Token Firestore'a kaydedilecek

**Firestore Kontrol:**
- Firebase Console → Firestore Database
- `google_integrations` collection'ına bakın
- `test-user-1` dökümanı oluşmuş mu?

---

## 📊 ADIM 8: Production Verification

### 8.1 - Kontrol Listesi

**Firebase Functions:**
- [ ] `api` function deploy edildi mi?
- [ ] `health` endpoint çalışıyor mu?
- [ ] Logs temiz mi? (errors yok)

**Firestore:**
- [ ] Yeni indexes oluştu mu? (35 total)
- [ ] Mevcut collections etkilenmedi mi?
- [ ] `google_integrations` collection var mı?

**OAuth:**
- [ ] OAuth flow test edildi mi?
- [ ] Token Firestore'a kaydedildi mi?
- [ ] Token encrypted mi?

---

## 🎯 ÖZET: Başvuru Yerleri

| Başvuru | URL | Süre | Maliyet |
|---------|-----|------|---------|
| **Google Cloud Project** | https://console.cloud.google.com | 2 dk | Ücretsiz |
| **GBP API Enable** | https://console.cloud.google.com/apis/library | 2 dk | Ücretsiz |
| **OAuth Consent** | https://console.cloud.google.com/apis/credentials/consent | 5 dk | Ücretsiz |
| **OAuth Client** | https://console.cloud.google.com/apis/credentials | 3 dk | Ücretsiz |
| **Firebase Blaze** | https://console.firebase.google.com/project/ruloposs/usage/details | 5 dk | Pay-as-you-go |

**Toplam Süre:** ~20 dakika  
**İlk Maliyet:** $0 (ücretsiz limitler dahilinde)

---

## 💰 Maliyet Detayları

### Ücretsiz Limitler

**Google Business Profile API:**
- İlk 500 request/day: Ücretsiz
- Sonrası: $0.04/request

**Firebase Functions:**
- İlk 2M invocation/month: Ücretsiz
- Sonrası: $0.40/million

**Firebase Firestore:**
- İlk 50K read/day: Ücretsiz
- İlk 20K write/day: Ücretsiz
- İlk 1GB storage: Ücretsiz

### Tahmini Maliyet (100 İşletme)

**Aylık:**
- Functions: $10-20
- Firestore: $20-40
- GBP API: $0-10
- **Toplam: $30-70/month**

**NOT:** İlk 3 ay ücretsiz olması muhtemel (limitler dahilinde)

---

## 📞 Destek ve İletişim

### Google Cloud Support

**Dokümantasyon:**
- https://cloud.google.com/docs
- https://developers.google.com/my-business

**Community:**
- Stack Overflow: `google-business-profile` tag
- Google Cloud Community: https://www.googlecloudcommunity.com

### Firebase Support

**Dokümantasyon:**
- https://firebase.google.com/docs
- https://firebase.google.com/docs/functions

**Community:**
- Stack Overflow: `firebase` tag
- Firebase Discord

---

## ⚠️ ÖNEMLİ NOTLAR

### 1. OAuth Consent Screen - Verification

**Testing Modu:**
- İlk 100 kullanıcı için test modunda çalışır
- Kendi test kullanıcılarınızı ekleyin

**Production Modu:**
- Google verification gerekli (7-10 gün)
- Domain ownership kanıtı
- Privacy policy ve terms of service gerekli
- Şimdilik test modunda yeterli!

### 2. Kredi Kartı Güvenliği

**Firebase Blaze:**
- Budget alerts mutlaka kurun
- İlk aylarda maliyeti yakından takip edin
- Unexpected spikes için alarm ayarlayın

### 3. API Quotas

**GBP API Limitleri:**
- 10 QPS (queries per second)
- Code'da rate limiting var (merak etme)

---

## 🎉 TEBRİKLER!

Tüm başvurular tamamlandığında:

✅ Google Cloud Project hazır  
✅ OAuth credentials alındı  
✅ Firebase Blaze plan aktif  
✅ Functions config ayarlandı  
✅ Deploy edildi  
✅ Test edildi  

**Artık Google Maps entegrasyonu CANLI! 🚀**

---

## 📋 Sonraki Adımlar

1. ✅ **Kullanıcıları ekle** (OAuth test users)
2. ✅ **İlk lokasyon entegrasyonu** yap
3. ✅ **Appointment URL** oluştur
4. ✅ **Dashboard'dan izle**
5. ⏭️ **Production verification** için başvur (ileride)

---

**Sorular için:** Bu dosyayı okuduktan sonra bana yazın! 😊

