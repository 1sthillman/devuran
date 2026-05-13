# 📸 Medya Yönetimi Sistemi - Firestore Base64

## 🎯 Genel Bakış

Bu proje, Firebase Storage kullanmadan **tüm görselleri ve videoları Firestore'da base64 formatında** saklar. Medya dosyaları otomatik olarak sıkıştırılır ve optimize edilir.

## 📊 Teknik Limitler

### Firestore Limitleri
- **Document boyutu**: Max 1MB
- **Array boyutu**: Max 20,000 items
- **String boyutu**: Max 1MB

### Uygulama Limitleri
- **Görsel**: Max 100KB (sıkıştırılmış)
- **Video**: Max 500KB, Max 15 saniye
- **Salon medyası**: Max 20 item
- **Personel medyası**: Max 10 item
- **Yorum medyası**: Max 5 item

## 🔧 Kurulum

### Bağımlılıklar
```bash
npm install browser-image-compression compressorjs
```

### Dosyalar
- ✅ `src/services/mediaCompressionService.ts` - Sıkıştırma servisi
- ✅ `src/components/ui/MediaUploader.tsx` - Yükleme bileşeni
- ✅ `src/components/ui/MediaGallery.tsx` - Galeri bileşeni
- ✅ `firestore.rules` - Medya validasyonu ile güncellenmiş

## 📸 Görsel Sıkıştırma

### Ayarlar
```typescript
const MAX_IMAGE_SIZE_KB = 100;
const IMAGE_QUALITY = 0.7;
const IMAGE_MAX_WIDTH = 800;
const IMAGE_MAX_HEIGHT = 800;
```

### Kullanım
```typescript
import { compressImage } from '@/services/mediaCompressionService';

const result = await compressImage(file);
// result.base64 - Sıkıştırılmış base64
// result.size - Yeni boyut (bytes)
// result.compressionRatio - Sıkıştırma oranı (%)
```

### Desteklenen Formatlar
- JPEG
- PNG
- WebP

### Sıkıştırma Süreci
1. Dosya seçilir
2. Browser-image-compression ile sıkıştırılır
3. Max 800x800 boyutuna resize edilir
4. JPEG formatına çevrilir (quality: 0.7)
5. Base64'e encode edilir
6. Max 100KB kontrolü yapılır

## 🎥 Video Sıkıştırma

### Ayarlar
```typescript
const MAX_VIDEO_SIZE_KB = 500;
const MAX_VIDEO_DURATION = 15; // saniye
const VIDEO_MAX_WIDTH = 640;
const VIDEO_MAX_HEIGHT = 480;
const VIDEO_BITRATE = 250000; // 250kbps
```

### Kullanım
```typescript
import { compressVideo } from '@/services/mediaCompressionService';

const result = await compressVideo(file);
// result.base64 - Sıkıştırılmış video base64
// result.thumbnail - Video thumbnail base64
// result.duration - Video süresi (saniye)
// result.size - Yeni boyut (bytes)
```

### Desteklenen Formatlar
- MP4
- WebM
- QuickTime (MOV)

### Sıkıştırma Süreci
1. Video seçilir
2. Süre kontrolü (max 15 saniye)
3. Canvas ile frame-by-frame işlenir
4. Max 640x480 boyutuna resize edilir
5. MediaRecorder ile WebM formatına encode edilir (250kbps)
6. Thumbnail oluşturulur (ilk frame)
7. Base64'e encode edilir
8. Max 500KB kontrolü yapılır

## 🎨 MediaUploader Bileşeni

### Kullanım
```tsx
import { MediaUploader } from '@/components/ui/MediaUploader';

<MediaUploader
  maxImages={10}
  maxVideos={3}
  onMediaChange={(media) => {
    console.log('Uploaded media:', media);
  }}
  existingMedia={existingMedia}
/>
```

### Props
- `maxImages`: Max görsel sayısı (default: 10)
- `maxVideos`: Max video sayısı (default: 3)
- `onMediaChange`: Medya değiştiğinde callback
- `existingMedia`: Mevcut medya array
- `className`: CSS class

### Özellikler
- ✅ Drag & drop desteği
- ✅ Çoklu dosya seçimi
- ✅ Otomatik sıkıştırma
- ✅ Progress göstergesi
- ✅ Hata yönetimi
- ✅ Preview
- ✅ Sıkıştırma oranı gösterimi
- ✅ Dosya boyutu gösterimi

## 🖼️ MediaGallery Bileşeni

### Kullanım
```tsx
import { MediaGallery } from '@/components/ui/MediaGallery';

<MediaGallery media={salon.media} />
```

### Özellikler
- ✅ Grid layout
- ✅ Lightbox görünümü
- ✅ Video oynatma
- ✅ Keyboard navigation (← →)
- ✅ Thumbnail navigation
- ✅ Zoom desteği
- ✅ Responsive design

## 💾 Firestore Yapısı

### Salon Document
```typescript
{
  id: "salon-1",
  name: "Elit Kuaför",
  // ... diğer alanlar
  media: [
    {
      id: "media-1",
      type: "image",
      base64: "data:image/jpeg;base64,/9j/4AAQ...",
      size: 95000,
      width: 800,
      height: 600,
      mimeType: "image/jpeg",
      uploadedAt: "2026-05-11T10:00:00Z"
    },
    {
      id: "media-2",
      type: "video",
      base64: "data:video/webm;base64,GkXfo...",
      thumbnail: "data:image/jpeg;base64,/9j/4AAQ...",
      size: 480000,
      width: 640,
      height: 480,
      duration: 12.5,
      mimeType: "video/webm",
      uploadedAt: "2026-05-11T10:05:00Z"
    }
  ]
}
```

### Staff Document
```typescript
{
  id: "staff-1",
  name: "Ahmet Yılmaz",
  // ... diğer alanlar
  media: [
    // Max 10 item
  ]
}
```

### Review Document
```typescript
{
  id: "review-1",
  salonId: "salon-1",
  userId: "user-1",
  // ... diğer alanlar
  media: [
    // Max 5 item
  ]
}
```

## 🔒 Güvenlik Kuralları

### Firestore Rules
```javascript
// Salon medya validasyonu
allow write: if (!request.resource.data.keys().hasAny(['media']) || 
               (request.resource.data.media is list && 
                request.resource.data.media.size() <= 20));

// Staff medya validasyonu
allow write: if (!request.resource.data.keys().hasAny(['media']) || 
               (request.resource.data.media is list && 
                request.resource.data.media.size() <= 10));

// Review medya validasyonu
allow write: if (!request.resource.data.keys().hasAny(['media']) || 
               (request.resource.data.media is list && 
                request.resource.data.media.size() <= 5));
```

## 📈 Performans Optimizasyonu

### Client-Side
1. **Lazy Loading**: Görseller viewport'a girdiğinde yüklenir
2. **Progressive Loading**: Önce thumbnail, sonra full size
3. **Caching**: Browser cache kullanımı
4. **Compression**: Otomatik sıkıştırma

### Firestore
1. **Pagination**: Medya sayfalama ile yüklenir
2. **Selective Loading**: Sadece gerekli alanlar çekilir
3. **Indexing**: Medya sorguları için index
4. **Batching**: Toplu okuma/yazma

### Best Practices
```typescript
// ❌ Kötü: Tüm medyayı çek
const salon = await getDoc(doc(db, 'salons', salonId));

// ✅ İyi: Sadece gerekli alanları çek
const salon = await getDoc(doc(db, 'salons', salonId));
const media = salon.data().media?.slice(0, 10); // İlk 10 medya
```

## 🎯 Kullanım Senaryoları

### 1. Salon Galerisi
```tsx
// Salon detay sayfasında
<MediaGallery media={salon.media || []} />
```

### 2. Personel Profili
```tsx
// Personel kartında
<MediaGallery media={staff.media || []} />
```

### 3. Yorum Medyası
```tsx
// Yorum kartında
<MediaGallery media={review.media || []} />
```

### 4. Medya Yükleme
```tsx
// Dashboard'da
<MediaUploader
  maxImages={20}
  maxVideos={5}
  onMediaChange={(media) => {
    updateSalon({ media });
  }}
  existingMedia={salon.media}
/>
```

## 🔧 Yardımcı Fonksiyonlar

### Dosya Boyutu Formatla
```typescript
import { formatFileSize } from '@/services/mediaCompressionService';

formatFileSize(95000); // "92.77 KB"
```

### Video Süresi Formatla
```typescript
import { formatDuration } from '@/services/mediaCompressionService';

formatDuration(125); // "2:05"
```

### Base64 Boyutu Hesapla
```typescript
import { getBase64Size } from '@/services/mediaCompressionService';

const size = getBase64Size(base64String); // bytes
```

### Dosya Tipi Kontrolü
```typescript
import { isValidImageType, isValidVideoType } from '@/services/mediaCompressionService';

if (isValidImageType(file)) {
  // Görsel işle
}

if (isValidVideoType(file)) {
  // Video işle
}
```

## 📊 Boyut Hesaplamaları

### Base64 Overhead
Base64 encoding %33 boyut artışı yapar:
- 100KB dosya → ~133KB base64
- 500KB dosya → ~666KB base64

### Document Boyutu
Firestore document max 1MB:
- Salon: ~800KB medya + ~200KB diğer alanlar
- Staff: ~400KB medya + ~100KB diğer alanlar
- Review: ~200KB medya + ~50KB diğer alanlar

### Örnek Hesaplama
```
Salon Document:
- 10 görsel × 100KB = 1000KB (base64: ~1330KB) ❌ Limit aşımı!
- 8 görsel × 100KB = 800KB (base64: ~1064KB) ❌ Limit aşımı!
- 6 görsel × 100KB = 600KB (base64: ~798KB) ✅ OK
- 5 görsel × 100KB + 1 video × 500KB = 1000KB (base64: ~1330KB) ❌ Limit aşımı!
- 4 görsel × 100KB + 1 video × 400KB = 800KB (base64: ~1064KB) ❌ Limit aşımı!
- 3 görsel × 100KB + 1 video × 300KB = 600KB (base64: ~798KB) ✅ OK
```

## ⚠️ Önemli Notlar

1. **Firestore Limitleri**: Document boyutu 1MB'ı geçemez
2. **Video Süresi**: Max 15 saniye (daha uzun videolar reddedilir)
3. **Sıkıştırma**: Otomatik ve zorunlu
4. **Format**: Görseller JPEG, videolar WebM'e çevrilir
5. **Thumbnail**: Her video için otomatik oluşturulur
6. **Validation**: Client ve server-side validasyon
7. **Error Handling**: Tüm hatalar kullanıcıya gösterilir
8. **Progress**: Yükleme ilerlemesi gösterilir

## 🚀 Deployment

### Rules Deploy
```bash
npx firebase-tools deploy --only firestore:rules --project ruloposs
```

### Test
```bash
# Development
npm run dev

# Build
npm run build
```

## 📚 Kaynaklar

- [Browser Image Compression](https://www.npmjs.com/package/browser-image-compression)
- [Firestore Limits](https://firebase.google.com/docs/firestore/quotas)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

## ✅ Checklist

- [x] Görsel sıkıştırma servisi
- [x] Video sıkıştırma servisi
- [x] MediaUploader bileşeni
- [x] MediaGallery bileşeni
- [x] Firestore rules güncellendi
- [x] Types güncellendi
- [x] Validation eklendi
- [x] Error handling
- [x] Progress indicators
- [x] Thumbnail generation
- [x] Responsive design
- [x] Keyboard navigation
- [x] Drag & drop
- [x] Multi-file upload

---

**Made with ❤️ - Optimized for Firestore**
