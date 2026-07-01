# Cloudflare R2 Kurulum Rehberi

## ⚠️ ÖNEMLİ: Token İzin Sorunu

Verdiğiniz token **R2 erişimi için yeterli izne sahip değil**. Authentication hatası alıyoruz.

## 🔧 Çözüm: Yeni R2 API Token Oluşturun

### Adım 1: Cloudflare Dashboard
1. https://dash.cloudflare.com/ adresine gidin
2. Sol menüden **R2** seçin
3. Sağ üstten **Manage R2 API Tokens** tıklayın

### Adım 2: Yeni Token Oluştur
1. **Create API Token** butonuna tıklayın
2. **Permissions** bölümünde:
   - ✅ **Object Read & Write** (zorunlu)
   - ✅ **Admin Read & Write** (önerilen)
3. **TTL**: Custom (365 days veya uzun süre)
4. **Create Token** tıklayın

### Adım 3: Token Bilgilerini Kaydet

Token oluşturulduktan sonra şu bilgileri kaydedin:

```bash
Account ID: c885d9b3bfb94036e6aa37d894548072
Access Key ID: [buraya gelecek]
Secret Access Key: [buraya gelecek]
```

## 📦 R2 Bucket Oluşturma

### Dashboard'dan:
1. R2 sayfasında **Create bucket** tıklayın
2. **Bucket name**: `randevu-images` (veya istediğiniz isim)
3. **Location**: Automatic (önerilen)
4. **Create bucket** tıklayın

### Bucket Ayarları:
1. Bucket'a tıklayın
2. **Settings** > **Public Access**
3. **Allow Access** yapın (resimlerin public olması için)
4. **Custom Domain** ekleyebilirsiniz (opsiyonel)

## 🔐 .env Dosyasına Eklenecek Bilgiler

```env
# Cloudflare R2
VITE_R2_ACCOUNT_ID=c885d9b3bfb94036e6aa37d894548072
VITE_R2_ACCESS_KEY_ID=<yukarıdan alacaksınız>
VITE_R2_SECRET_ACCESS_KEY=<yukarıdan alacaksınız>
VITE_R2_BUCKET_NAME=randevu-images
VITE_R2_PUBLIC_URL=https://<bucket-subdomain>.r2.cloudflarestorage.com
```

## 📝 Gerekli Bilgileri Aldıktan Sonra

Bilgileri aldığınızda bana verin, ben kodu entegre edeceğim:

```
Access Key ID: ?
Secret Access Key: ?
Bucket Name: ?
Public URL: ?
```

## 💰 Maliyet Tahmini

- **Storage**: $0.015/GB/ay
- **Indirme**: $0 (ÜCRETSIZ!)
- **Upload**: İlk 1 milyon istek ücretsiz

**Örnek:**
- 50 GB resim = $0.75/ay
- 100 GB indirme = $0
- **TOPLAM: ~$1/ay** 🎉

## 🚀 Alternatif: Firebase Storage (Hızlı Başlangıç)

Eğer hemen başlamak isterseniz, Firebase Storage zaten kurulu:

```typescript
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Kullanıma hazır!
const storage = getStorage();
```

**Firebase Storage Limitleri:**
- İlk 5 GB ücretsiz
- Sonra $0.026/GB storage
- $0.12/GB indirme

**Önerim:** Şimdilik Firebase kullanın, büyüdükçe R2'ye geçin.

---

## 📞 Yardım

Token'ı doğru izinlerle oluşturup bilgileri verirseniz, 5 dakikada entegrasyonu tamamlarım! 🚀
