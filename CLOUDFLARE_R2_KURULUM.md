# 🚀 Cloudflare R2 Entegrasyonu - Kurulum Kılavuzu

Bu döküman Cloudflare R2 Storage entegrasyonunun nasıl kurulacağını anlatır.

## 📋 Özellikler

- ✅ **Otomatik Sıkıştırma**: Görseller otomatik olarak sıkıştırılır
- ✅ **Hızlı Yükleme**: Cloudflare'in global CDN ağı
- ✅ **Düşük Maliyet**: S3 API uyumlu, sınırsız egress
- ✅ **Güvenli**: CORS ve access control
- ✅ **Kolay Yönetim**: Workers ile serverless upload

## 🔧 Adım 1: Cloudflare R2 Bucket Oluşturma

1. [Cloudflare Dashboard](https://dash.cloudflare.com)'a gidin
2. **R2** bölümüne tıklayın
3. **Create bucket** butonuna tıklayın
4. Bucket adı: `devuran-images`
5. Location: **Automatic** (en yakın bölge)
6. **Create bucket** ile oluşturun

## 🔑 Adım 2: API Token Oluşturma

1. R2 sayfasında **Manage R2 API Tokens** tıklayın
2. **Create API token** butonuna tıklayın
3. Token adı: `devuran-upload-token`
4. Permissions:
   - ✅ **Object Read & Write**
5. **Create API Token**
6. **Access Key ID** ve **Secret Access Key**'i kaydedin

### Credential'larınız:
```
Account ID: c885d9b3bfb94036e6aa37d894548072
Access Key ID: [KAYDEDİN]
Secret Access Key: [KAYDEDİN]
```

## 🌐 Adım 3: Public Access Ayarlama

### Seçenek A: Custom Domain (Önerilen)

1. R2 bucket'a gidin
2. **Settings** > **Public Access** tıklayın
3. **Connect Domain** butonuna tıklayın
4. Domain: `images.devuran.com`
5. DNS kayıtları otomatik eklenir
6. **Connect Domain**

### Seçenek B: R2.dev Domain

1. **Settings** > **Public Access**
2. **Allow Access** butonuna tıklayın
3. Otomatik URL: `https://pub-xxxxx.r2.dev`

## ⚙️ Adım 4: Cloudflare Workers Kurulumu

### 4.1 Workers Yükleme

```bash
cd workers
npm install -g wrangler
wrangler login
```

### 4.2 Workers Deploy

```bash
wrangler deploy
```

### 4.3 Domain Bağlama

1. Workers dashboard'da `devuran-r2-upload` worker'ına gidin
2. **Settings** > **Triggers** > **Routes**
3. **Add route**:
   - Route: `api.devuran.com/r2/*`
   - Zone: `devuran.com`
4. **Save**

## 🔐 Adım 5: Environment Variables

`.env` dosyanıza ekleyin:

```env
# Cloudflare R2 Storage
VITE_R2_ACCESS_KEY_ID=your_access_key_id_here
VITE_R2_SECRET_ACCESS_KEY=your_secret_access_key_here
VITE_R2_BUCKET_NAME=devuran-images
VITE_R2_PUBLIC_URL=https://images.devuran.com
VITE_R2_UPLOAD_ENDPOINT=https://api.devuran.com/r2/upload
VITE_R2_DELETE_ENDPOINT=https://api.devuran.com/r2/delete
```

## 🧪 Adım 6: Test Etme

### 6.1 Token Doğrulama

```bash
curl -X GET "https://api.cloudflare.com/client/v4/accounts/c885d9b3bfb94036e6aa37d894548072/tokens/verify" \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

### 6.2 Upload Test

Uygulamada herhangi bir görsel yükleme alanını kullanın:
- Profil fotoğrafı
- İşletme kapak görseli
- Duyuru görseli

### 6.3 Console Kontrolü

Browser console'da şu mesajları görmelisiniz:
```
✅ Görsel başarıyla yüklendi
URL: https://images.devuran.com/images/1234567890_abc.jpg
```

## 📁 Klasör Yapısı

R2'de şu klasörler oluşturulur:

```
devuran-images/
├── images/              # Genel görseller
├── announcements/       # Duyuru görselleri
├── support/            # Destek ekleri
│   └── {ticketId}/     # Ticket bazlı
└── avatars/            # Kullanıcı profil fotoğrafları
```

## 🔄 Migration: Firebase Storage'dan R2'ye

Mevcut Firebase Storage'daki görselleri migrate etmek için:

### Script ile Otomatik Migration

```typescript
// migrate-to-r2.ts
import { storage } from './firebase';
import { r2Service } from './cloudflareR2Service';
import { listAll, getDownloadURL, ref } from 'firebase/storage';

async function migrateToR2() {
  const storageRef = ref(storage);
  const result = await listAll(storageRef);
  
  for (const itemRef of result.items) {
    const url = await getDownloadURL(itemRef);
    const response = await fetch(url);
    const blob = await response.blob();
    const file = new File([blob], itemRef.name);
    
    await r2Service.uploadImage(file, {
      folder: itemRef.parent?.fullPath || 'migrated'
    });
    
    console.log(`✅ Migrated: ${itemRef.fullPath}`);
  }
}
```

## 🛡️ Güvenlik Ayarları

### CORS Konfigürasyonu

Workers'da CORS zaten ayarlandı:
```typescript
'Access-Control-Allow-Origin': '*'
'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS'
'Access-Control-Allow-Headers': 'Content-Type'
```

Production için domain kısıtlaması:
```typescript
'Access-Control-Allow-Origin': 'https://devuran.com'
```

### Rate Limiting

Cloudflare Workers'a rate limit ekleyin:

```typescript
// wrangler.toml
[rate_limiting]
enabled = true
requests_per_second = 10
```

## 💰 Maliyet Tahmini

Cloudflare R2 Fiyatlandırması:

- **Storage**: $0.015/GB/ay
- **Class A Operations** (PUT, POST): $4.50/milyon
- **Class B Operations** (GET): $0.36/milyon
- **Egress**: ÜCRETSİZ ✨

### Örnek Hesaplama:
- 10 GB storage: $0.15/ay
- 100K upload: $0.45/ay
- 1M view: $0.36/ay
- **TOPLAM: ~$1/ay** 🎉

Firebase Storage ile karşılaştırma:
- Firebase: ~$50/ay (1M indirme için)
- R2: ~$1/ay
- **%98 tasarruf!**

## 🐛 Troubleshooting

### Problem: CORS Hatası

**Çözüm**: Workers'ın deploy edildiğinden emin olun
```bash
wrangler tail devuran-r2-upload
```

### Problem: 403 Forbidden

**Çözüm**: API token permissions kontrol edin
- Object Read & Write aktif mi?
- Bucket adı doğru mu?

### Problem: Upload Çalışmıyor

**Çözüm**: Environment variables kontrol
```bash
echo $VITE_R2_UPLOAD_ENDPOINT
```

## 📊 Monitoring

### Cloudflare Analytics

1. Workers dashboard > `devuran-r2-upload`
2. **Metrics** sekmesi
3. Request count, errors, latency

### R2 Usage

1. R2 dashboard
2. Bucket seçin
3. **Metrics** tab
   - Storage used
   - Operations count
   - Bandwidth

## 🔄 Otomatik Yedekleme

R2'den düzenli yedek almak için:

```bash
# wrangler ile export
wrangler r2 object get devuran-images/backup.zip --file=backup.zip

# rclone ile sync
rclone sync cloudflare:devuran-images /backup/r2
```

## ✅ Checklist

- [ ] R2 Bucket oluşturuldu
- [ ] API Token alındı
- [ ] Workers deploy edildi
- [ ] Custom domain bağlandı
- [ ] Environment variables eklendi
- [ ] Upload test edildi
- [ ] Firebase Storage migration yapıldı (opsiyonel)
- [ ] Monitoring ayarlandı

## 🎉 Tamamlandı!

Artık tüm görseller Cloudflare R2'ye yükleniyor!

- ⚡ Daha hızlı
- 💰 Daha ucuz  
- 🌍 Global CDN
- 🔒 Güvenli

**Support**: Sorun yaşarsanız Cloudflare docs: https://developers.cloudflare.com/r2/
