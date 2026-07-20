# Takvim Test Rehberi

## 🧪 Test Adımları

### Test 1: Padding Günleri Gizli Mi?
**Beklenen**: Diğer ayın günleri görünmemeli, sadece boş alan olmalı.

1. Takvimi aç
2. Mayıs 2026'ya git
3. İlk satıra bak (27, 28, 29, 30 - Nisan'ın günleri)
4. ✅ **Bu günler görünmemeli** - sadece boş alan
5. Son satıra bak (Haziran'ın 1-7 günleri)
6. ✅ **Bu günler de görünmemeli** - sadece boş alan

**Sonuç**: Sadece Mayıs'ın günleri (1-31) görünmeli.

---

### Test 2: Doğru Gün Seçiliyor Mu?
**Beklenen**: Tıkladığın gün seçilmeli, başka gün değil.

1. Console'u aç (F12)
2. Takvimde 7'ye tıkla
3. Console'da şunu gör:
   ```
   📅 Gün seçildi: {
     date: 7,
     fullDate: "2026-05-07",
     isDisabled: false,
     isClosed: false,
     isPast: false,
     isToday: false
   }
   ```
4. ✅ **date: 7** olmalı (6 değil!)
5. Takvimde 7 seçili görünmeli (mor-pembe gradient)

**Tekrar et**: 15'e tıkla → date: 15 olmalı

---

### Test 3: Bugün Seçilebiliyor Mu?
**Beklenen**: Bugün (24 Mayıs) seçilebilmeli.

1. Takvimde bugünü bul (cyan renkli ring)
2. Tıkla
3. Console'da:
   ```
   📅 Gün seçildi: {
     date: 24,
     fullDate: "2026-05-24",
     isDisabled: false,
     isClosed: false,
     isPast: false,
     isToday: true  ← ✅ true olmalı
   }
   ```
4. ✅ Bugün seçilmeli (mor-pembe gradient)

---

### Test 4: Geçmiş Günler Seçilemiyor Mu?
**Beklenen**: Geçmiş günler tıklanamaz olmalı.

1. Takvimde 23 Mayıs'a tıkla (dün)
2. ❌ **Hiçbir şey olmamalı** - seçilmemeli
3. Console'da log görünmemeli (çünkü disabled)
4. Gün soluk gri görünmeli

---

### Test 5: Kapalı Günler Seçilemiyor Mu?
**Beklenen**: İşletmenin kapalı olduğu günler tıklanamaz.

1. Kapalı günü bul (üstü çizili, gri)
2. Tıkla
3. ❌ **Hiçbir şey olmamalı** - seçilmemeli
4. Console'da log görünmemeli
5. Cursor `not-allowed` olmalı

---

### Test 6: Ay Değiştirme
**Beklenen**: Her ay kendi günlerini göstermeli, hiçbir gün kaybolmamalı.

#### Mayıs → Haziran
1. Mayıs 2026'da ol
2. Mayıs'ın tüm günlerini say (1-31) ✅
3. Sağ ok'a tıkla (Haziran'a geç)
4. Haziran'ın tüm günlerini say (1-30) ✅
5. ❌ **Hiçbir gün kaybolmamalı**

#### Haziran → Mayıs
1. Sol ok'a tıkla (Mayıs'a dön)
2. Mayıs'ın tüm günlerini say (1-31) ✅
3. ❌ **Hiçbir gün kaybolmamalı**

---

### Test 7: Dolu Günler
**Beklenen**: Müsait slot olmayan günler kırmızı çapraz çizgili ve tıklanamaz.

1. Dolu günü bul (kırmızı arka plan, çapraz çizgi)
2. Tıkla
3. ❌ **Seçilmemeli**
4. Tooltip: "Müsait saat yok"

---

### Test 8: Görsel Hiyerarşi
**Beklenen**: Her durum farklı görünmeli.

Takvimde şunları gör:
- ✅ **Bugün**: Cyan renkli ring
- ✅ **Seçili gün**: Mor-pembe gradient, gölge
- ✅ **Kapalı gün**: Gri, üstü çizili
- ✅ **Geçmiş gün**: Soluk gri, opacity düşük
- ✅ **Dolu gün**: Kırmızı arka plan, çapraz çizgi
- ✅ **Normal gün**: Beyaz kenarlık, hover efekti
- ✅ **Padding (diğer ay)**: Görünmez, boş alan

---

## 🐛 Sorun Giderme

### Sorun: Yanlış gün seçiliyor
**Kontrol**:
1. Console'da `date` değerine bak
2. Tıkladığın günle aynı mı?
3. Değilse, padding hesaplaması yanlış

**Çözüm**: `calendarDays` hesaplamasını kontrol et

---

### Sorun: Bugün seçilemiyor
**Kontrol**:
1. Console'da `isToday: true` görüyor musun?
2. `isDisabled: false` olmalı
3. `isPast: false` olmalı

**Çözüm**: `isPast` hesaplaması yanlış

---

### Sorun: Diğer ayın günleri görünüyor
**Kontrol**:
1. `isCurrentMonth: false` olan günler render ediliyor mu?
2. Render kısmında `if (!day.isCurrentMonth) return <div />` var mı?

**Çözüm**: Render mantığını kontrol et

---

### Sorun: Kapalı günler tıklanabiliyor
**Kontrol**:
1. Console'da `isClosed: true` görüyor musun?
2. `isDisabled: true` olmalı
3. Button `disabled` attribute'u var mı?

**Çözüm**: `isDisabled` hesaplamasını kontrol et

---

## ✅ Başarı Kriterleri

Tüm testler geçerse:
- ✅ Doğru gün seçiliyor
- ✅ Bugün seçilebiliyor
- ✅ Geçmiş günler seçilemiyor
- ✅ Kapalı günler seçilemiyor
- ✅ Diğer ayın günleri görünmüyor
- ✅ Ay değişince günler kaybolmuyor
- ✅ Görsel hiyerarşi net

**Sonuç**: Takvim %100 doğru çalışıyor! 🎉

---

## 📝 Console Log Örnekleri

### Başarılı Seçim
```javascript
📅 Gün seçildi: {
  date: 25,
  fullDate: "2026-05-25",
  isDisabled: false,
  isClosed: false,
  isPast: false,
  isToday: false
}
```

### Bugün Seçimi
```javascript
📅 Gün seçildi: {
  date: 24,
  fullDate: "2026-05-24",
  isDisabled: false,
  isClosed: false,
  isPast: false,
  isToday: true  ← ✅
}
```

### Disabled Gün (Log Yok)
Kapalı, geçmiş veya dolu günlere tıklayınca **hiçbir log görünmemeli**.

---

## 🚀 Hızlı Test

1. Tarayıcıyı yenile (F5)
2. Console'u aç (F12)
3. Randevu sayfasına git
4. Hizmet seç → Personel seç → Tarih & Saat'e tıkla
5. Takvimde 7'ye tıkla
6. Console'da `date: 7` gör ✅
7. Bugüne tıkla
8. Console'da `isToday: true` gör ✅
9. Haziran'a geç
10. Tüm günleri say (1-30) ✅

**Hepsi çalışıyorsa**: Takvim mükemmel! 🎉
