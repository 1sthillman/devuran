# Firebase Authentication Setup

## Authorized Domains Ekleme

Firebase Console'da aşağıdaki adımları takip et:

1. Firebase Console'a git: https://console.firebase.google.com/
2. Projeyi seç: **ruloposs**
3. Sol menüden **Authentication** > **Settings** > **Authorized domains** sekmesine git
4. **Add domain** butonuna tıkla
5. Aşağıdaki domain'leri ekle:

```
app-ruby-ten-20.vercel.app
app-r3n6mkcr5-minifinise-gmailcoms-projects.vercel.app
app-geioy4ppx-minifinise-gmailcoms-projects.vercel.app
app-n3qfuun22-minifinise-gmailcoms-projects.vercel.app
```

6. Her Vercel deployment için yeni bir domain oluştuğundan, wildcard kullanmak için:
   - Vercel'de custom domain ayarla
   - Veya her yeni deployment sonrası domain'i Firebase'e ekle

## Google OAuth Ayarları

1. Firebase Console > **Authentication** > **Sign-in method**
2. **Google** provider'ı etkinleştir
3. **Authorized domains** listesinde Vercel domain'lerinin olduğundan emin ol

## Alternatif Çözüm: Custom Domain

Vercel'de custom domain kullanarak her deployment'ta domain değişimini önle:

1. Vercel Dashboard > Project Settings > Domains
2. Custom domain ekle (örn: randevu.yourdomain.com)
3. Bu domain'i Firebase Authorized Domains'e ekle

## Test

Domain eklendikten sonra:
1. Uygulamayı aç: https://app-ruby-ten-20.vercel.app
2. "Google ile giriş yap" butonuna tıkla
3. Google hesap seçimi yapıldıktan sonra uygulamaya geri dönmeli
4. Kullanıcı otomatik olarak giriş yapmalı

## Hata Durumunda

Eğer hala sorun varsa:
- Browser console'u kontrol et
- Firebase Console > Authentication > Users'da kullanıcının oluşup oluşmadığını kontrol et
- Network tab'da auth isteklerini kontrol et
