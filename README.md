# Devuran - Çok Amaçlı Rezervasyon Platformu

Modern, profesyonel ve kapsamlı rezervasyon yönetim platformu.

## 🔒 GÜVENLİK DÜZELTMELERİ (20 Temmuz 2026)

**KRİTİK GÜVENLIK AÇIKLARI KAPATILDI** - Detaylar için `KRITIK_GUVENLIK_DUZELTMELERI.md` dosyasına bakın.

### Yapılan Düzeltmeler
- ✅ Firestore Rules: Auth kontrolsüz rezervasyon güncelleme kapatıldı
- ✅ Fiyat Doğrulama: Backend validation aktif (price manipulation önlendi)
- ✅ Çifte Rezervasyon: Atomic slot lock mekanizması eklendi
- ✅ Veri Sızıntısı: Rakip müşteri/analytics verilerine erişim kapatıldı
- ✅ Abonelik Bypass: Sadece admin (webhook) subscription değiştirebilir
- ✅ Admin Güvenlik: Public email exposure kaldırıldı

### ⚠️ ACİL: Deploy Gerekli
```bash
# 1. Firestore Rules Deploy (EN ÖNEMLİ)
firebase deploy --only firestore:rules

# 2. Hosting Deploy
npm run build
vercel --prod
```

### 🔐 ACİL: 2FA Aktif Edin
Admin hesapları için Firebase Console'dan 2FA açın:
- adistow@gmail.com
- admin@restoqr.com
- minif@restoqr.com

## Özellikler

### Kategoriler

#### Güzellik & Bakım
- Kuaför
- Berber
- Güzellik Merkezi
- Tırnak Salonu

#### Etkinlik & Organizasyon
- Düğün Organizasyonu
- Nişan Organizasyonu
- Evlilik Teklifi
- Doğum Günü
- Kurumsal Etkinlik

#### Mekan & Salon
- Düğün Salonu
- Etkinlik Alanı

#### Konaklama
- Bungalov
- Otel
- Villa
- Kamp Alanı

#### Fotoğraf & Video
- Fotoğraf Çekimi
- Video Prodüksiyon
- Drone Çekim

#### Yemek & İkram
- Catering
- Pasta & Tatlı
- Kahve & İkram

### Sistem Özellikleri

- ✅ Otomatik Randevu Onayı
- ✅ Sıra Yönetim Sistemi
- ✅ İptal ve Yeniden Planlama
- ✅ Çift Değerlendirme (İşletme + Personel)
- ✅ Ban Sistemi
- ✅ Medya Galerisi
- ✅ Gerçek Zamanlı Bildirimler
- ✅ Konum Bazlı Arama
- ✅ Gelişmiş Filtreleme

## Teknolojiler

- React + TypeScript
- Firebase (Auth, Firestore, Storage)
- Tailwind CSS
- Framer Motion
- Zustand
- Vite

## Kurulum

```bash
npm install
npm run dev
```

### Firebase Functions (Backend Validation için)
```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

## Deployment

```bash
npm run build
vercel --prod
```

## Production URL

https://app-ruby-ten-20.vercel.app

## Lisans

MIT
