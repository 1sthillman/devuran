# 🧪 Analytics ve Veri İzolasyonu Test Adımları

## 🎯 Test Hedefi
Her işletmenin sadece kendi verilerini görebildiğini ve analitik verilerin doğru hesaplandığını doğrulamak.

## 📋 Ön Hazırlık

### 1. Tarayıcı Hazırlığı
```bash
# Cache'i temizle
Ctrl + Shift + Delete
# Veya
Tarayıcı Ayarları → Gizlilik → Tarama verilerini temizle
```

### 2. Test Kullanıcıları
- **İşletme A**: Kendi hesabınız
- **İşletme B**: Farklı bir test hesabı (opsiyonel)

## 🔍 Test Senaryoları

### Senaryo 1: Dashboard Genel Bakış
**Amaç:** Dashboard'daki istatistiklerin doğru olduğunu doğrulamak

1. İşletme paneline giriş yapın
2. "Genel Bakış" sekmesinde olduğunuzdan emin olun
3. Aşağıdaki kartları kontrol edin:

#### Bugünkü Randevu
- [ ] Sayı görünüyor mu?
- [ ] Bugünkü tarihli rezervasyonlarla eşleşiyor mu?
- [ ] Karta tıklayınca "Randevular" sekmesine gidiyor mu?

#### Bekleyen Sıra
- [ ] Sayı görünüyor mu?
- [ ] Sırada bekleyen müşteri sayısıyla eşleşiyor mu?

#### Bu Hafta
- [ ] Sayı görünüyor mu?
- [ ] Bu haftaki rezervasyon sayısıyla eşleşiyor mu?

#### Bu Ay Gelir
- [ ] Tutar görünüyor mu?
- [ ] TL sembolü var mı?
- [ ] Tamamlanan rezervasyonların toplamıyla eşleşiyor mu?

**Beklenen Sonuç:** ✅ Tüm kartlar doğru veri göstermeli

---

### Senaryo 2: Analitik Sayfası - Genel İstatistikler
**Amaç:** Analitik sayfasındaki temel metriklerin doğru olduğunu doğrulamak

1. "Analitik" sekmesine gidin
2. Periyot seçicisini test edin:
   - [ ] "Bugün" seçeneği çalışıyor mu?
   - [ ] "Bu Hafta" seçeneği çalışıyor mu?
   - [ ] "Bu Ay" seçeneği çalışıyor mu?
   - [ ] "Bu Yıl" seçeneği çalışıyor mu?

3. Ana istatistik kartlarını kontrol edin:

#### Gelir Kartı
- [ ] Tutar görünüyor mu?
- [ ] Trend yüzdesi var mı? (↑ veya ↓)
- [ ] Seçilen periyoda göre değişiyor mu?

#### Randevular Kartı
- [ ] Sayı görünüyor mu?
- [ ] Trend yüzdesi var mı?
- [ ] Dashboard'daki sayıyla tutarlı mı?

#### Müşteriler Kartı
- [ ] Toplam müşteri sayısı görünüyor mu?
- [ ] Trend yüzdesi var mı?

#### Ortalama Puan Kartı
- [ ] Puan görünüyor mu? (0.0 - 5.0 arası)
- [ ] Yıldız ikonu var mı?

**Beklenen Sonuç:** ✅ Tüm kartlar veri göstermeli ve periyot değişikliğine tepki vermeli

---

### Senaryo 3: Analitik Sayfası - Detaylı Analizler
**Amaç:** Detaylı analitik bileşenlerin doğru çalıştığını doğrulamak

#### Müşteri Analizi
- [ ] "Yeni Müşteri" sayısı görünüyor mu?
- [ ] "Geri Dönen" sayısı görünüyor mu?
- [ ] Toplamları mantıklı mı?

#### Değerlendirmeler
- [ ] "Toplam" yorum sayısı görünüyor mu?
- [ ] "Son 30 Gün" sayısı görünüyor mu?

#### Randevu Durumu
- [ ] "Onaylı" sayısı görünüyor mu?
- [ ] "Bekliyor" sayısı görünüyor mu?
- [ ] "Tamamlandı" sayısı görünüyor mu?

**Beklenen Sonuç:** ✅ Tüm detaylı analizler veri göstermeli

---

### Senaryo 4: En Popüler Hizmetler
**Amaç:** Hizmet istatistiklerinin doğru hesaplandığını doğrulamak

1. "En Popüler Hizmetler" bölümüne scroll edin
2. Kontrol edin:
   - [ ] En az 1 hizmet listeleniyor mu?
   - [ ] Hizmet adları görünüyor mu?
   - [ ] Randevu sayıları görünüyor mu?
   - [ ] Gelir tutarları görünüyor mu?
   - [ ] Sıralama mantıklı mı? (En çok randevu alan üstte)

**Beklenen Sonuç:** ✅ Hizmetler doğru sıralanmış ve istatistikler doğru

---

### Senaryo 5: En İyi Performans (Personel)
**Amaç:** Personel performans verilerinin doğru olduğunu doğrulamak

1. "En İyi Performans" bölümüne scroll edin
2. Kontrol edin:
   - [ ] Personel listeleniyor mu?
   - [ ] Personel adları görünüyor mu?
   - [ ] Randevu sayıları görünüyor mu?
   - [ ] Yıldız puanları görünüyor mu?
   - [ ] Gelir tutarları görünüyor mu?

**Beklenen Sonuç:** ✅ Personel verileri doğru ve sıralı

---

### Senaryo 6: Haftalık Dağılım
**Amaç:** Günlük randevu dağılımının doğru gösterildiğini doğrulamak

1. "Haftalık Dağılım" bölümüne scroll edin
2. Kontrol edin:
   - [ ] 7 gün görünüyor mu? (Pazar - Cumartesi)
   - [ ] Her gün için randevu sayısı var mı?
   - [ ] Progress bar'lar görünüyor mu?
   - [ ] En yoğun gün en uzun bar'a sahip mi?

**Beklenen Sonuç:** ✅ Haftalık dağılım grafiği doğru

---

### Senaryo 7: Veri İzolasyonu Testi
**Amaç:** Başka işletmelerin verilerinin görünmediğini doğrulamak

#### Test A: Kendi Verileriniz
1. İşletme paneline giriş yapın
2. Bir rezervasyon oluşturun
3. Dashboard'a dönün
4. Kontrol edin:
   - [ ] Yeni rezervasyon sayılara yansıdı mı?
   - [ ] Gelir güncellendi mi?

#### Test B: Başka İşletme (Opsiyonel)
1. Farklı bir test hesabıyla giriş yapın
2. Dashboard'ı kontrol edin
3. Doğrulayın:
   - [ ] İlk işletmenin verileri görünmüyor mu?
   - [ ] Sadece bu işletmenin verileri görünüyor mu?

**Beklenen Sonuç:** ✅ Her işletme sadece kendi verilerini görüyor

---

### Senaryo 8: Console Hata Kontrolü
**Amaç:** JavaScript hatalarının olmadığını doğrulamak

1. Tarayıcıda F12 tuşuna basın
2. Console sekmesine gidin
3. Sayfayı yenileyin (F5)
4. Kontrol edin:
   - [ ] Kırmızı hata mesajı yok mu?
   - [ ] "businessId" ile ilgili hata yok mu?
   - [ ] Firestore permission hatası yok mu?

**Beklenen Sonuç:** ✅ Console temiz, hata yok

---

### Senaryo 9: Network İstekleri
**Amaç:** Firestore query'lerinin doğru çalıştığını doğrulamak

1. F12 → Network sekmesine gidin
2. "Fetch/XHR" filtresini seçin
3. Sayfayı yenileyin
4. Firestore isteklerini kontrol edin:
   - [ ] `reservations` collection'ına istek var mı?
   - [ ] `businessId` parametresi gönderiliyor mu?
   - [ ] 200 OK response alınıyor mu?

**Beklenen Sonuç:** ✅ Tüm istekler başarılı, doğru parametrelerle

---

## 🐛 Sorun Giderme

### Veri Görünmüyorsa
```
1. Cache'i temizle (Ctrl+Shift+Delete)
2. Sayfayı yenile (F5)
3. Console'da hata kontrol et
4. Firestore'da veri var mı kontrol et
```

### Yanlış Veri Görünüyorsa
```
1. Firestore Console'a git
2. reservations collection'ını aç
3. businessId alanını kontrol et
4. User'ın salonId'sini kontrol et
```

### Rules Hatası Alıyorsan
```
1. Firebase Console → Firestore → Rules
2. Rules'ın deploy edildiğini kontrol et
3. Tekrar deploy et: npx firebase deploy --only firestore:rules
```

## ✅ Test Sonuç Raporu

### Başarılı Testler
- [ ] Dashboard genel bakış
- [ ] Analitik genel istatistikler
- [ ] Detaylı analizler
- [ ] En popüler hizmetler
- [ ] Personel performansı
- [ ] Haftalık dağılım
- [ ] Veri izolasyonu
- [ ] Console temiz
- [ ] Network istekleri başarılı

### Başarısız Testler
- [ ] (Varsa buraya not alın)

### Notlar
```
(Test sırasında gözlemlediğiniz özel durumları buraya yazın)
```

## 🎉 Test Tamamlandı!

Tüm testler başarılıysa sistem production'a hazır! 🚀

**Son Kontrol:**
- ✅ Tüm veriler doğru
- ✅ Veri izolasyonu çalışıyor
- ✅ Hata yok
- ✅ Performans iyi

**Deployment:**
```bash
# Production'a deploy et
npm run build
firebase deploy
```
