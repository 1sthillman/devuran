# 📦 Universal Storage Sistemi - Kullanım Rehberi

## 🎯 Özellikler

✅ **3 Storage Provider**:
- Firebase Storage (default, 5GB ücretsiz)
- Cloudflare R2 (opsiyonel, çok ucuz)
- Base64 (inline, küçük resimler için)

✅ **Otomatik Sıkıştırma**: Her resim otomatik optimize edilir
✅ **Progress Bar**: Yükleme ilerlemesi görünür
✅ **Kolay Geçiş**: R2 kurulumunda otomatik geçiş
✅ **Backward Compatible**: Mevcut kodlar değişmeden çalışır

## 📝 Kullanım

### 1. ImageUploader Component (Önerilen)

```tsx
import { ImageUploader } from '@/components/ui/ImageUploader';

// Base64 kullan (mevcut davranış, değişiklik yok)
<ImageUploader
  value={imageUrl}
  onChange={setImageUrl}
  label="Profil Fotoğrafı"
  maxSizeMB={5}
/>

// Firebase/R2 kullan (yeni özellik)
<ImageUploader
  value={imageUrl}
  onChange={setImageUrl}
  label="Profil Fotoğrafı"
  maxSizeMB={5}
  folder="profile-photos"
  useCloudStorage={true}  // ← Firebase/R2 aktif
/>
```

### 2. Storage Service (Programmatik Kullanım)

```typescript
import { storageService } from '@/services/storageService';

// Tek dosya yükle
const result = await storageService.uploadFile(file, {
  folder: 'salon-covers',
  provider: 'firebase' // veya 'r2', 'base64'
});

console.log(result.url); // Public URL
console.log(result.provider); // 'firebase'
console.log(result.size); // Dosya boyutu

// Çoklu dosya yükle
const files = [file1, file2, file3];
const results = await storageService.uploadMultiple(files, {
  folder: 'gallery'
});

// Resim sıkıştır
const compressed = await storageService.compressImage(file, 1920, 1080, 0.8);

// Dosya sil
await storageService.deleteFile('salon-covers/image.jpg', 'firebase');
```

## 🔧 Konfigürasyon

### Şu An: Firebase Storage (Aktif ✅)

Herhangi bir ayar gerekmez, otomatik çalışır.

### Gelecek: Cloudflare R2 (Opsiyonel)

`.env.local` dosyasına ekleyin:

```env
VITE_R2_ACCOUNT_ID=c885d9b3bfb94036e6aa37d894548072
VITE_R2_ACCESS_KEY_ID=<your-access-key>
VITE_R2_SECRET_ACCESS_KEY=<your-secret-key>
VITE_R2_BUCKET_NAME=randevu-images
VITE_R2_PUBLIC_URL=https://randevu-images.r2.cloudflarestorage.com
```

Sistem otomatik olarak R2'ye geçer!

## 📊 Maliyet Karşılaştırması

### Firebase Storage (Şu an kullanılıyor)
- ✅ **İlk 5 GB ücretsiz**
- $0.026/GB/ay (storage)
- $0.12/GB (indirme)
- **Örnek**: 10 GB + 50 GB indirme = $6.13/ay

### Cloudflare R2 (Kurulum yapılınca)
- $0.015/GB/ay (storage)
- **$0 indirme ücreti!** 🎉
- **Örnek**: 10 GB + 50 GB indirme = $0.15/ay

**10 GB için:**
- Firebase: ~$6/ay
- R2: ~$0.15/ay
- **40x daha ucuz!** 💰

## 🚀 Migrasyon (İsteğe Bağlı)

R2 kurulumu yaptığınızda:

1. `.env.local`'a credentials ekleyin
2. Hiçbir kod değişikliği gerekmez
3. Yeni yüklemeler otomatik R2'ye gider
4. Eski resimler Firebase'de kalır (problem değil)

## 🔥 Firebase Storage Limitleri

**Ücretsiz Plan (Spark):**
- 5 GB storage
- 1 GB/gün indirme
- 20,000 yükleme/gün

**Ücretli Plan (Blaze):**
- Sınırsız (ödediğiniz kadar)
- Pay-as-you-go

**Şu anki durumunuz:**
- Firebase ücretsiz plan aktif
- Küçük-orta projeler için yeterli
- Büyüdükçe R2'ye geçiş önerilir

## 📱 Mobil Optimizasyonlar

✅ **Otomatik sıkıştırma**: 1920x1080 max
✅ **WebP format**: Daha küçük dosya boyutu
✅ **Progressive loading**: Önce blur, sonra tam
✅ **CDN**: Global hızlı erişim

## 🎨 Kullanım Senaryoları

### Profil Fotoğrafları
```tsx
<ImageUploader useCloudStorage={true} folder="profiles" maxSizeMB={2} />
```
*Firebase/R2 - Kalıcı, güvenli*

### Salon Galerisi
```tsx
<MultiImageUploader useCloudStorage={true} folder="galleries" maxFiles={20} />
```
*Firebase/R2 - Yüksek kalite*

### Hızlı Önizlemeler
```tsx
<ImageUploader useCloudStorage={false} />
```
*Base64 - Anında, küçük boyutlar*

## 🔒 Güvenlik

✅ **Firebase Security Rules**: Zaten aktif
✅ **CORS**: Configured
✅ **Public URLs**: CDN ile hızlı
✅ **No API key exposure**: Client-safe

## 📞 Destek

**R2 kurulumu için:**
1. `CLOUDFLARE_R2_KURULUM_REHBERI.md` dosyasını okuyun
2. R2 bucket + API credentials oluşturun
3. `.env.local`'a ekleyin
4. Otomatik geçiş!

**Sorun mu var?**
- Firebase çalışıyor: Hiçbir şey yapmayın, zaten aktif ✅
- R2 kurmak istiyorsanız: Rehberi takip edin

---

## ✨ Özet

- **Şu An**: Firebase Storage aktif, ücretsiz, çalışıyor ✅
- **İleride**: R2 ile 40x maliyet tasarrufu (opsiyonel)
- **Kod**: Hiç değişmeden her iki sistemle çalışır
- **Geçiş**: Sorunsuz, istediğiniz zaman

**Önerim**: Şimdilik Firebase kullanın, büyüdükçe R2'ye geçin! 🚀
