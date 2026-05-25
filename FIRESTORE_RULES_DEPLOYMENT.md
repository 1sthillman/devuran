# Firestore Rules Deployment Guide

## 🚨 ÖNEMLİ: Bu adım tamamlanmadan abonelik sistemi çalışmayacaktır!

Firestore rules güncellendi ve deploy edilmesi gerekiyor. İşletme sahipleri kendi aboneliklerini görebilmek için bu kuralların aktif olması şart.

---

## Seçenek 1: Firebase Console (En Kolay - Önerilen)

### Adımlar:

1. **Firebase Console'u Açın**
   - [https://console.firebase.google.com/](https://console.firebase.google.com/) adresine gidin
   - Projenizi seçin

2. **Firestore Rules Sayfasına Gidin**
   - Sol menüden **Build** → **Firestore Database** seçin
   - Üst menüden **Rules** sekmesine tıklayın

3. **Rules'u Kopyalayın**
   - Workspace'teki `firestore.rules` dosyasını açın
   - Tüm içeriği kopyalayın (Ctrl+A, Ctrl+C)

4. **Console'a Yapıştırın**
   - Firebase Console'daki editor'e yapıştırın (Ctrl+V)
   - Mevcut kuralların üzerine yazın

5. **Publish Edin**
   - Sağ üstteki **Publish** butonuna tıklayın
   - Onay verin

6. **Test Edin**
   - İşletme paneline giriş yapın
   - Genel Bakış sekmesinde abonelik kartını kontrol edin
   - Eğer görünüyorsa başarılı! ✅

---

## Seçenek 2: Firebase CLI (Gelişmiş)

### Gereksinimler:
- Node.js kurulu olmalı
- Firebase CLI kurulu olmalı

### Adımlar:

1. **Firebase CLI Kurulumu** (eğer yoksa)
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase Login**
   ```bash
   firebase login
   ```
   - Browser açılacak, Google hesabınızla giriş yapın

3. **Proje Seçimi** (eğer gerekirse)
   ```bash
   firebase use --add
   ```
   - Listeden projenizi seçin

4. **Rules Deploy**
   ```bash
   firebase deploy --only firestore:rules
   ```

5. **Başarı Mesajı**
   ```
   ✔  Deploy complete!
   ```

---

## 🔍 Deployment Doğrulama

Deploy sonrası test etmek için:

### Test 1: Console'dan Kontrol
1. Firebase Console → Firestore Database → Rules
2. Son deployment zamanını kontrol edin
3. Rules içeriğinde `subscriptions` collection kurallarını arayın

### Test 2: Uygulama Testi
1. İşletme paneline giriş yapın
2. **Genel Bakış** sekmesine gidin
3. Abonelik kartı görünüyor mu?
4. Kalan gün sayısı gösteriliyor mu?
5. "Paket Seç" butonuna tıklayın
6. Modal açılıyor mu?
7. Planlar görünüyor mu?

### Test 3: Browser Console
1. F12 ile Developer Tools açın
2. Console sekmesine gidin
3. Herhangi bir "permission denied" hatası var mı?
4. Yoksa başarılı! ✅

---

## 🐛 Sorun Giderme

### Hata: "Permission Denied"
**Sebep**: Rules henüz deploy edilmemiş veya yanlış deploy edilmiş.

**Çözüm**:
1. Firebase Console'dan rules'u kontrol edin
2. `subscriptions` collection için kuralları arayın
3. Tekrar deploy edin

### Hata: "Firebase CLI not found"
**Sebep**: Firebase CLI kurulu değil.

**Çözüm**:
```bash
npm install -g firebase-tools
```

### Hata: "Not authorized"
**Sebep**: Firebase'e login olmamışsınız.

**Çözüm**:
```bash
firebase login
```

### Hata: "No project selected"
**Sebep**: Proje seçilmemiş.

**Çözüm**:
```bash
firebase use --add
```

---

## 📋 Deployment Checklist

- [ ] Firebase Console'a giriş yaptım
- [ ] Doğru projeyi seçtim
- [ ] Firestore Database → Rules sayfasına gittim
- [ ] `firestore.rules` dosyasını kopyaladım
- [ ] Console'a yapıştırdım
- [ ] Publish butonuna tıkladım
- [ ] Başarı mesajı aldım
- [ ] İşletme panelinde test ettim
- [ ] Abonelik kartı görünüyor ✅
- [ ] Modal açılıyor ✅
- [ ] Planlar görünüyor ✅

---

## 🎯 Önemli Notlar

1. **Backup**: Mevcut rules'u deploy etmeden önce yedekleyin (Console'dan kopyalayın)
2. **Test**: Deploy sonrası mutlaka test edin
3. **Rollback**: Sorun olursa Console'dan eski rules'u geri yükleyebilirsiniz
4. **Güvenlik**: Rules production'da çok önemli - dikkatli olun

---

## ✅ Deploy Sonrası

Rules başarıyla deploy edildikten sonra:

1. ✅ İşletme sahipleri kendi aboneliklerini görebilir
2. ✅ Genel bakış kartı çalışır
3. ✅ Modal açılır ve planlar görünür
4. ✅ Plan satın alma işlemi çalışır
5. ✅ Kullanım istatistikleri güncellenir

---

## 📞 Destek

Sorun yaşarsanız:
1. Browser console'u kontrol edin (F12)
2. Firebase Console'da rules'u kontrol edin
3. Bu dokümandaki sorun giderme bölümüne bakın
