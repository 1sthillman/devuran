# Sıra ve Randevu Yönetim Sistemi

## Genel Bakış

Kapsamlı bir sıra yönetimi ve randevu iptal sistemi oluşturuldu. Sistem, müşteri ve işletme tarafından randevu iptali, sıraya alma, otomatik randevuya geçiş, erken bitirme ve değerlendirme özelliklerini içerir.

## Özellikler

### 1. Randevu İptal Sistemi

#### Müşteri İptali
- ✅ Müşteri randevusunu iptal edebilir
- ✅ İptal nedeni seçimi (6 kategori)
- ✅ Özel iptal nedeni yazabilir
- ✅ İptal sonrası sıradaki kişi otomatik randevuya alınır
- ✅ İptal bilgisi kaydedilir (kim, ne zaman, neden)

#### İşletme İptali
- ✅ İşletme müşteri randevusunu iptal edebilir
- ✅ İptal nedeni seçimi (5 kategori)
- ✅ İptal sonrası sıradaki kişi otomatik randevuya alınır
- ✅ İptal bilgisi kaydedilir

**İptal Nedenleri:**

Müşteri:
- Başka bir işim çıktı
- Randevu saati uygun değil
- Farklı bir salon tercih ettim
- Hizmeti almaktan vazgeçtim
- Kişisel nedenler
- Diğer

İşletme:
- Personel müsait değil
- İşletme kapalı
- Müşteri ile iletişim kurulamadı
- Teknik sorun
- Diğer

### 2. Sıra Sistemi

#### Sıraya Alma
- ✅ Tüm saatler doluysa müşteri sıraya alınabilir
- ✅ Saat seçimi **opsiyonel** (tercih edilen saat belirtilebilir)
- ✅ Herhangi bir tarih/saat için sıraya alınabilir
- ✅ Sıra numarası otomatik atanır
- ✅ Bildirim sistemi hazır (TODO: Push notification entegrasyonu)

#### Otomatik Randevuya Geçiş
- ✅ Randevu iptal edildiğinde sıradaki ilk kişi otomatik randevuya alınır
- ✅ Sıra numaraları otomatik güncellenir
- ✅ Müşteriye bildirim gönderilir (konsol log - TODO: gerçek bildirim)

#### Sıra Yönetimi (İşletme)
- ✅ İşletme sıradaki tüm kişileri görebilir
- ✅ Müşteri bilgileri görüntülenebilir
- ✅ Sıradaki kişi manuel olarak randevuya atanabilir
- ✅ Sıradaki kişi çıkarılabilir
- ✅ Personel bazlı sıra görüntüleme

### 3. Erken Bitirme Sistemi

- ✅ İşletme randevuyu erken bitirebilir
- ✅ Gerçek bitiş saati kaydedilir
- ✅ Kalan süre tekrar kullanıma açılır (TODO: Slot yeniden hesaplama)
- ✅ Randevu otomatik 'completed' durumuna geçer

### 4. Otomatik Tamamlama

- ✅ Randevu bitiş saati geçtiğinde otomatik 'completed' olur
- ✅ Her 1 dakikada bir kontrol edilir
- ✅ Tamamlanan randevular değerlendirmeye açılır

### 5. Değerlendirme Sistemi

#### Müşteri Değerlendirmesi
- ✅ Sadece tamamlanmış randevular değerlendirilebilir
- ✅ İptal edilen randevular değerlendirilemez
- ✅ Hem işletme hem personel ayrı puanlanır
- ✅ Ortalama puan hesaplanır
- ✅ Yorum yapılabilir
- ✅ Personel yorumu ayrı görüntülenir

#### İşletme Müşteri Değerlendirmesi
- ✅ İşletme müşteriyi 1-5 arası puanlayabilir
- ✅ Müşteri hakkında not eklenebilir
- ✅ Sadece işletme tarafından görülebilir
- ✅ Müşteri geçmişi takip edilebilir

### 6. Ban Sistemi

#### Müşteri Engelleme
- ✅ İşletme müşteriyi engelleyebilir
- ✅ Engelleme nedeni belirtilir
- ✅ Engellenen müşteri sadece o işletmeyi göremez
- ✅ Diğer işletmeleri görebilir
- ✅ Engellenen müşteri listesi görüntülenebilir

#### Raporlama
- ✅ İşletme müşteriyi rapor edebilir (TODO: Admin paneli)
- ✅ Kötü amaçlı kullanıcılar için sistem geneli ban

## Teknik Detaylar

### Yeni Collections

1. **queue** - Sıra sistemi
   - userId, salonId, staffId
   - customerName, customerPhone, customerAvatar
   - services, totalPrice, totalDuration
   - preferredDate, preferredTime (opsiyonel)
   - queuePosition, notified
   - createdAt

2. **bannedUsers** - Engellenen kullanıcılar
   - userId, salonId
   - bannedBy, reason
   - customerName, customerPhone
   - bannedAt

3. **salonCustomerRatings** - İşletme müşteri değerlendirmeleri
   - salonId, customerId
   - customerName, rating (1-5)
   - comment, ratedBy
   - ratedAt

### Güncellenmiş Types

**Appointment:**
- cancellationReason?: string
- cancelledBy?: 'customer' | 'salon'
- cancelledAt?: string
- completedAt?: string
- actualEndTime?: string

**Salon Settings:**
- allowQueue: boolean
- autoConfirmQueue: boolean

### Yeni Servisler

1. **banService.ts** - Ban ve rating işlemleri
2. **appointmentAutoCompleteService.ts** - Otomatik tamamlama
3. **CancelAppointmentDialog.tsx** - İptal dialog bileşeni
4. **QueueManager.tsx** - Sıra yönetim bileşeni

### Firestore Rules

- Queue collection için okuma/yazma kuralları
- BannedUsers collection için kurallar
- SalonCustomerRatings collection için kurallar

## Kullanım

### Müşteri Tarafı

1. **Randevu İptal:**
   - Randevular sayfasında "İptal Et" butonuna tıkla
   - İptal nedenini seç
   - Onayla

2. **Sıraya Alma:**
   - Tüm saatler doluysa "Sıraya Al" butonu görünür
   - Tercih edilen tarih/saat seçilebilir (opsiyonel)
   - Sıraya alındığında bildirim gelir

3. **Değerlendirme:**
   - Tamamlanan randevular için "Değerlendir" butonu görünür
   - İşletme ve personel ayrı puanlanır
   - Yorum yazılabilir

### İşletme Tarafı

1. **Randevu İptal:**
   - Randevu yönetiminde "İptal Et" butonuna tıkla
   - İptal nedenini seç
   - Onayla

2. **Erken Bitirme:**
   - Onaylanmış randevularda "Erken Tamamla" butonuna tıkla
   - Onayla
   - Kalan süre tekrar kullanıma açılır

3. **Sıra Yönetimi:**
   - "Sıra Yönetimi" sekmesinde tüm sıra görüntülenir
   - Müşteri bilgileri görülebilir
   - Manuel randevuya atama yapılabilir
   - Müşteri değerlendirilebilir
   - Müşteri engellenebilir

4. **Müşteri Engelleme:**
   - Sıra yönetiminde müşteriye tıkla
   - "Engelle" butonuna tıkla
   - Engelleme nedenini yaz
   - Onayla

## TODO

- [ ] Push notification entegrasyonu
- [ ] Email bildirimleri
- [ ] SMS bildirimleri
- [ ] Erken bitirme sonrası slot yeniden hesaplama
- [ ] Admin paneli (raporlama sistemi)
- [ ] Müşteri geçmişi detaylı görüntüleme
- [ ] İstatistikler (iptal oranları, sıra kullanımı vb.)
- [ ] Otomatik sıra temizleme (eski kayıtlar)
- [ ] Sıra öncelik sistemi (premium müşteriler)

## Notlar

- Tüm randevular otomatik onaylanır (autoConfirm: true)
- Sıraya alma sistemi tamamen opsiyonel saat seçimi ile çalışır
- İptal edilen randevular değerlendirilemez
- Otomatik tamamlama servisi uygulama başladığında çalışır
- Ban sistemi sadece işletme bazlıdır (sistem geneli değil)
