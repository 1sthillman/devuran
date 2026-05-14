# KAPALI GÜN TEST TALİMATI

## ÇOK ÖNEMLİ - ADIM ADIM TEST

### 1. Tarayıcıyı Aç ve Console'u Aç
- Chrome/Edge: F12 tuşuna bas
- Console sekmesine geç
- Console'u temizle (Clear console)

### 2. Salon Sahibi Olarak Giriş Yap
- Owner hesabıyla giriş yap
- Dashboard'a git

### 3. Çalışma Saatlerini Kontrol Et
- Settings (Ayarlar) sekmesine git
- "Çalışma Saatleri" bölümünü bul
- **PAZAR GÜNÜ** için switch'i **KAPALI** (kırmızı) yap
- "Değişiklikleri Kaydet" butonuna tıkla
- ✅ "Kaydedildi" mesajını gör

### 4. Console'da Kontrol Et
Console'da şunları göreceksin:
```
=== BOOKING PAGE DEBUG ===
Salon: [Salon Adı]
Salon Working Hours: {monday: {...}, tuesday: {...}, ...}
  sunday: {open: "10:00", close: "17:00", isOpen: false}  <-- İŞTE BU!
```

**ÖNEMLİ:** `sunday` için `isOpen: false` olmalı!

### 5. Müşteri Olarak Test Et
- Çıkış yap
- Müşteri hesabıyla giriş yap (veya yeni hesap aç)
- Bir salona git
- "Randevu Al" butonuna tıkla

### 6. Randevu Adımlarını Takip Et
- Hizmet seç
- Personel seç
- **Tarih seçme ekranına gel**

### 7. Console'u İncele
Console'da şunları göreceksin:
```
=== CALENDAR PICKER DEBUG ===
Working Hours Received: {monday: {...}, sunday: {...}}
Working Hours Keys: ["monday", "tuesday", ..., "sunday"]

Checking sunday (Sun May 18 2026): {open: "10:00", close: "17:00", isOpen: false}
  -> sunday isOpen: false Result: CLOSED
```

### 8. Takvimi Kontrol Et
- Pazar günleri **ÜZERİ ÇİZİLİ** görünmeli
- Pazar günleri **SOLUK** (opacity: 0.4) olmalı
- Pazar günlerine **TIKLAYAMAZSIN** (cursor: not-allowed)
- Pazar günlerine tıklamaya çalış → **HİÇBİR ŞEY OLMAMALI**

### 9. Eğer Hala Tıklanabiliyorsa
Console'da şunu ara:
```
Checking sunday
```

Eğer görmüyorsan:
- **SORUN:** `workingHours` prop'u gelmiyor
- Console'da "Working Hours Received: undefined" yazıyorsa
- Salon veritabanında `workingHours` field'ı eksik

Eğer görüyorsan ama `isOpen: true` yazıyorsa:
- **SORUN:** Ayarlar kaydedilmemiş
- Settings'e geri dön
- Pazar'ı tekrar kapat
- Kaydet

### 10. Veritabanı Kontrolü (Eğer Sorun Devam Ederse)
Firebase Console'a git:
1. Firestore Database
2. `salons` collection
3. Salon'u bul
4. `workingHours` field'ına bak
5. `sunday` için `isOpen: false` olmalı

Eğer `isOpen` field'ı yoksa:
- **SORUN:** Eski veri formatı
- Settings'ten çalışma saatlerini tekrar kaydet
- Tüm günleri aç/kapat yapıp kaydet

---

## BEKLENEN SONUÇ

✅ Pazar günleri üzeri çizili
✅ Pazar günleri soluk renk
✅ Pazar günlerine tıklanamıyor
✅ Console'da "CLOSED" yazıyor
✅ Randevu oluşturulamıyor

❌ Eğer tıklanabiliyorsa → Console loglarını gönder!

---

## DEBUG ÇIKTI ÖRNEĞİ

### DOĞRU ÇALIŞIYORSA:
```
=== BOOKING PAGE DEBUG ===
Salon: Test Salonu
Salon Working Hours: {
  monday: {open: "09:00", close: "18:00", isOpen: true},
  sunday: {open: "10:00", close: "17:00", isOpen: false}
}

=== CALENDAR PICKER DEBUG ===
Working Hours Received: {monday: {...}, sunday: {...}}

Checking sunday (Sun May 18 2026): {open: "10:00", close: "17:00", isOpen: false}
  -> sunday isOpen: false Result: CLOSED
```

### YANLIŞ ÇALIŞIYORSA:
```
=== BOOKING PAGE DEBUG ===
Salon Working Hours: undefined  <-- SORUN!

VEYA

Checking sunday (Sun May 18 2026): {open: "10:00", close: "17:00", isOpen: true}  <-- SORUN!
  -> sunday isOpen: true Result: OPEN  <-- YANLIŞ!
```

---

## SORUN GİDERME

### Sorun 1: "Working Hours Received: undefined"
**Çözüm:** Salon veritabanında workingHours yok
- Settings'e git
- Çalışma saatlerini kaydet

### Sorun 2: "isOpen: true" ama kapalı olmalı
**Çözüm:** Ayarlar kaydedilmemiş
- Settings'e git
- Pazar'ı kapat
- Kaydet butonuna tıkla
- Sayfayı yenile

### Sorun 3: Console'da log yok
**Çözüm:** Sayfa yenilenmemiş
- Ctrl+F5 ile hard refresh yap
- Cache'i temizle

---

## HIZLI TEST

1. F12 aç
2. Console'u temizle
3. Randevu sayfasına git
4. Console'da "CLOSED" kelimesini ara
5. Pazar için "CLOSED" görmelisin
6. Pazar'a tıkla
7. Hiçbir şey olmamalı

**BU KADAR!**
