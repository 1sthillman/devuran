# 🚨 ACİL: Firestore Rules Deploy Edilmeli!

## Sorun
Abonelik sistemi **"Missing or insufficient permissions"** hatası veriyor çünkü Firestore rules henüz deploy edilmemiş.

## Çözüm (5 Dakika)

### Adım 1: Firebase Console'a Git
1. [https://console.firebase.google.com/](https://console.firebase.google.com/) aç
2. Projenizi seçin

### Adım 2: Firestore Rules Sayfasına Git
1. Sol menüden **Build** → **Firestore Database** tıkla
2. Üst menüden **Rules** sekmesine tıkla

### Adım 3: Rules'u Kopyala
1. Bu workspace'teki `firestore.rules` dosyasını aç
2. **TÜM İÇERİĞİ** kopyala (Ctrl+A, Ctrl+C)

### Adım 4: Console'a Yapıştır
1. Firebase Console'daki editor'e yapıştır (Ctrl+V)
2. Mevcut kuralların **ÜZERİNE YAZ**

### Adım 5: Publish Et
1. Sağ üstteki **Publish** butonuna tıkla
2. Onay ver

### Adım 6: Test Et
1. Tarayıcıyı yenile (F5)
2. İşletme paneline giriş yap
3. Genel Bakış sekmesinde abonelik kartını kontrol et
4. Eğer görünüyorsa ✅ BAŞARILI!

---

## Alternatif: Firebase CLI (Eğer kuruluysa)

```bash
# Firebase CLI kurulumu
npm install -g firebase-tools

# Login
firebase login

# Deploy
firebase deploy --only firestore:rules
```

---

## ⚠️ ÖNEMLİ NOTLAR

1. **Backup**: Mevcut rules'u deploy etmeden önce yedekleyin (Console'dan kopyalayın)
2. **Test**: Deploy sonrası mutlaka test edin
3. **Rollback**: Sorun olursa Console'dan eski rules'u geri yükleyebilirsiniz

---

## Deploy Sonrası Beklenen Sonuç

✅ Abonelik kartı görünecek
✅ Kalan gün sayısı gösterilecek
✅ Modal açılacak
✅ Planlar görünecek
✅ Plan satın alma çalışacak

---

## Hala Hata Alıyorsanız

1. Browser console'u açın (F12)
2. Hata mesajını kontrol edin
3. Firebase Console → Firestore Database → Rules → Son deployment zamanını kontrol edin
4. Rules içeriğinde `subscriptions` collection kurallarını arayın

---

**ŞİMDİ DEPLOY EDİN!** 🚀
