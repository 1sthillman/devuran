# Birleşik Kayıt Akışı - Müşteri ve İşletme Seçimi

## ✅ Tamamlanan Özellikler

### 🎯 **Tutarlı Kayıt Deneyimi**

Artık hem **Email/Password** hem de **Google Sign-In** ile kayıt olurken kullanıcılar rol seçebiliyor!

## 📋 Kayıt Akışları

### 1️⃣ **Email/Password Kayıt**

#### Adımlar:
1. **Ad Soyad** girişi
2. **Telefon Numarası** girişi
3. **Hesap Tipi Seçimi** ⭐ YENİ!
   - 🧑 Müşteri
   - 🏢 İşletme Sahibi
4. **Email** girişi
5. **Şifre** girişi
6. **Kullanım Koşulları** kabulü
7. ✅ Kayıt tamamlanır

#### Görsel Tasarım:
```
┌─────────────────────────────────┐
│  Hesap Tipi                     │
├─────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐    │
│  │ ✓ Müşteri│  │ İşletme  │    │
│  └──────────┘  └──────────┘    │
│                                 │
│  Randevu almak ve salonları     │
│  keşfetmek için                 │
└─────────────────────────────────┘
```

### 2️⃣ **Google Sign-In Kayıt**

#### Adımlar:
1. **Google ile giriş yap** tıklanır
2. Google OAuth popup açılır
3. Kullanıcı Google hesabını seçer
4. **Onboarding Modal** açılır (3 adım):
   
   **Adım 1: Rol Seçimi**
   - 🧑 Müşteri
   - 🏢 İşletme Sahibi
   
   **Adım 2: Telefon Numarası**
   - Telefon numarası girişi
   
   **Adım 3: Kullanım Koşulları**
   - Koşulları oku ve kabul et

5. ✅ Kayıt tamamlanır

## 🎨 Tasarım Özellikleri

### Hesap Tipi Seçimi (Email/Password)
- **2 Kolon Grid**: Yan yana butonlar
- **Aktif Durum**: 
  - Mavi border (`liquid-chrome`)
  - Beyaz arka plan efekti
  - Check işareti (✓)
- **Pasif Durum**:
  - Gri border
  - Hover efekti
- **Açıklama Metni**: Seçime göre dinamik açıklama

### Onboarding Modal (Google Sign-In)
- **3 Adımlı Wizard**
- **Progress Bar**: Hangi adımda olduğunu gösterir
- **Animasyonlu Geçişler**: Smooth slide animasyonları
- **Geri/İleri Butonları**: Adımlar arası geçiş
- **Responsive**: Mobil ve desktop uyumlu

## 🔄 Akış Karşılaştırması

### Önceki Durum ❌
```
Email/Password Kayıt:
- Ad, telefon, email, şifre
- Koşullar
- ❌ ROL SEÇİMİ YOK
- Otomatik "customer" olarak kaydediliyordu

Google Sign-In:
- Google OAuth
- ✅ Onboarding modal (rol seçimi var)
- Telefon, koşullar
```

### Şimdiki Durum ✅
```
Email/Password Kayıt:
- Ad, telefon
- ✅ ROL SEÇİMİ (Müşteri/İşletme)
- Email, şifre
- Koşullar
- Seçilen rolle kaydedilir

Google Sign-In:
- Google OAuth
- ✅ Onboarding modal (rol seçimi var)
- Telefon, koşullar
- Seçilen rolle kaydedilir
```

## 💾 Veri Yapısı

### Firestore `users` Collection
```typescript
{
  uid: "user123",
  email: "user@example.com",
  displayName: "Ahmet Yılmaz",
  phone: "5551234567",
  role: "customer" | "owner",  // ⭐ Kullanıcının seçtiği rol
  photoURL?: "https://...",
  salonId?: "salon123",        // Owner ise salon ID'si
  onboardingCompleted: true,
  createdAt: "2026-05-11T...",
  updatedAt: "2026-05-11T..."
}
```

## 🎯 Kullanıcı Deneyimi

### Müşteri Seçerse:
- ✅ Ana sayfaya yönlendirilir
- ✅ Salonları görebilir
- ✅ Randevu alabilir
- ✅ Randevularını yönetebilir
- ✅ `/appointments` sayfasına erişir

### İşletme Sahibi Seçerse:
- ✅ Owner dashboard'a yönlendirilir
- ✅ Salon yönetimi yapabilir
- ✅ Randevuları onaylayabilir
- ✅ Hizmet/personel ekleyebilir
- ✅ `/dashboard` sayfasına erişir

## 🔒 Güvenlik

### Rol Bazlı Erişim
```typescript
// authStore.ts
isOwner: user.role === 'owner' || user.role === 'admin'

// Firestore Rules
function isOwner(userId) {
  return get(/databases/$(database)/documents/users/$(userId)).data.role in ['owner', 'admin'];
}
```

### Route Koruması
```typescript
// OwnerDashboard.tsx
if (!isOwner) {
  return <Navigate to="/appointments" replace />;
}

// Dashboard.tsx (Customer)
if (isOwner) {
  return <Navigate to="/dashboard" replace />;
}
```

## 📱 Responsive Tasarım

### Desktop
```
┌─────────────────────────────────────┐
│  Hesap Tipi                         │
│  ┌──────────────┐ ┌──────────────┐ │
│  │   Müşteri    │ │   İşletme    │ │
│  └──────────────┘ └──────────────┘ │
└─────────────────────────────────────┘
```

### Mobile
```
┌───────────────────┐
│  Hesap Tipi       │
│  ┌──────────────┐ │
│  │   Müşteri    │ │
│  └──────────────┘ │
│  ┌──────────────┐ │
│  │   İşletme    │ │
│  └──────────────┘ │
└───────────────────┘
```

## 🎨 CSS Sınıfları

### Aktif Buton
```css
border-[var(--liquid-chrome)]
bg-white/5
text-[var(--chrome-white)]
```

### Pasif Buton
```css
border-[var(--obsidian-rim)]
text-[var(--muted-lead)]
hover:border-[var(--silver-frost)]
```

## 🚀 Kullanım Örnekleri

### Müşteri Kaydı
```typescript
// Kullanıcı formu doldurur:
name: "Ayşe Demir"
phone: "5559876543"
role: "customer"  // ⭐ Müşteri seçer
email: "ayse@example.com"
password: "******"
acceptedTerms: true

// Kayıt işlemi:
await register(name, email, password, phone, role);
// role = "customer" olarak kaydedilir
```

### İşletme Kaydı
```typescript
// Kullanıcı formu doldurur:
name: "Mehmet Salon"
phone: "5551112233"
role: "owner"  // ⭐ İşletme seçer
email: "mehmet@salon.com"
password: "******"
acceptedTerms: true

// Kayıt işlemi:
await register(name, email, password, phone, role);
// role = "owner" olarak kaydedilir
```

## ✅ Test Senaryoları

### Senaryo 1: Email ile Müşteri Kaydı
1. ✅ "Kayıt Ol" tıkla
2. ✅ Ad, telefon gir
3. ✅ "Müşteri" seç
4. ✅ Email, şifre gir
5. ✅ Koşulları kabul et
6. ✅ Kayıt ol
7. ✅ Ana sayfaya yönlendir

### Senaryo 2: Email ile İşletme Kaydı
1. ✅ "Kayıt Ol" tıkla
2. ✅ Ad, telefon gir
3. ✅ "İşletme" seç
4. ✅ Email, şifre gir
5. ✅ Koşulları kabul et
6. ✅ Kayıt ol
7. ✅ Owner dashboard'a yönlendir

### Senaryo 3: Google ile Müşteri Kaydı
1. ✅ "Google ile giriş yap" tıkla
2. ✅ Google hesabı seç
3. ✅ Onboarding modal açılır
4. ✅ "Müşteri" seç
5. ✅ Telefon gir
6. ✅ Koşulları kabul et
7. ✅ Ana sayfaya yönlendir

### Senaryo 4: Google ile İşletme Kaydı
1. ✅ "Google ile giriş yap" tıkla
2. ✅ Google hesabı seç
3. ✅ Onboarding modal açılır
4. ✅ "İşletme" seç
5. ✅ Telefon gir
6. ✅ Koşulları kabul et
7. ✅ Owner dashboard'a yönlendir

## 🎉 Sonuç

### ✅ Tamamlanan:
1. ✅ Email/Password kayıtta rol seçimi eklendi
2. ✅ Google Sign-In'de zaten rol seçimi vardı
3. ✅ Her iki akış da tutarlı hale getirildi
4. ✅ Güzel buton tasarımı
5. ✅ Dinamik açıklama metinleri
6. ✅ Responsive tasarım
7. ✅ Check işareti göstergesi
8. ✅ Rol bazlı yönlendirme

### 🎯 Kullanıcı Deneyimi:
- **Tutarlı**: Her iki yöntemde de aynı seçenekler
- **Açık**: Hangi rolün ne işe yaradığı açıklanıyor
- **Kolay**: Tek tıkla rol seçimi
- **Görsel**: Check işareti ile seçim belirgin
- **Responsive**: Mobil ve desktop'ta mükemmel

Sistem artık **mükemmel bir kayıt deneyimi** sunuyor! 🚀
