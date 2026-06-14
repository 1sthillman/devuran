# Duyuru Sistemi Test Rehberi

## ✅ Sistem Kontrolü Tamamlandı

### Yapı Analizi:
1. **Admin Panel** - Duyuru yönetimi mevcut ✅
2. **Firestore Rules** - Doğru yetkiler tanımlanmış ✅
3. **Service Layer** - announcementService çalışıyor ✅
4. **Popup Component** - Müşteri ve işletmeler için render ediliyor ✅

### Test Adımları:

#### 1. Admin Olarak Duyuru Oluştur
```
1. Super Admin hesabı ile giriş yap (adistow@gmail.com veya minifinise@gmail.com)
2. Admin Dashboard'a git
3. Sol menüden "Duyurular" sekmesini seç
4. "Yeni Duyuru" butonuna tıkla
5. Formu doldur:
   - Başlık: Test Duyurusu
   - Mesaj: Bu bir test mesajıdır
   - Hedef Kitle: "Tüm Kullanıcılar" veya "Tüm İşletmeler" veya "Tüm Müşteriler"
6. "Duyuru Yayınla" butonuna tıkla
```

#### 2. Müşteri Olarak Kontrol Et
```
1. Normal müşteri hesabı ile giriş yap
2. Dashboard'a git
3. Duyuru popup'ı otomatik olarak açılmalı
```

#### 3. İşletme Sahibi Olarak Kontrol Et
```
1. İşletme sahibi hesabı ile giriş yap
2. Owner Dashboard'a git
3. Duyuru popup'ı otomatik olarak açılmalı
```

### Hedef Kitle Seçenekleri:
- **Tüm Kullanıcılar**: Hem müşteriler hem işletmeler görür
- **Tüm İşletmeler**: Sadece işletme sahipleri görür
- **Tüm Müşteriler**: Sadece müşteriler görür
- **Belirli İşletmeler**: Seçilen işletmeler görür
- **Belirli Hizmet Alan Müşteriler**: İleride implement edilecek

### Özellikler:
✅ Görsel yükleme
✅ Son geçerlilik tarihi
✅ Aktif/Pasif durumu
✅ Okundu takibi
✅ Çoklu duyuru navigasyonu
✅ ESC tuşu ile kapatma
✅ Otomatik popup

### Kontrol Edilmesi Gerekenler:
1. Admin panelde duyuru oluşturma çalışıyor mu?
2. Müşteri dashboard'da popup açılıyor mu?
3. İşletme panelinde popup açılıyor mu?
4. Duyuru sadece hedef kitleye gösteriliyor mu?
5. Okundu olarak işaretlenince bir daha gösterilmiyor mu?

### Sorun Tespit Edilirse:
- Console'da hata var mı kontrol et
- Network tab'de Firebase istekleri başarılı mı?
- Firestore'da announcements koleksiyonu oluşturuldu mu?
- Duyuru isActive: true olarak işaretli mi?

## Console Test Komutu (Admin Panel'den)

Admin panel'de console'da şu komutu çalıştırarak test duyurusu oluşturabilirsiniz:

```javascript
// Test duyurusu oluştur (sadece geliştirme için)
async function testAnnouncement() {
  const { announcementService } = await import('./services/announcementService');
  const { useAuthStore } = await import('./store/authStore');
  const user = useAuthStore.getState().user;
  
  if (!user) {
    console.error('Lütfen önce giriş yapın');
    return;
  }
  
  try {
    const id = await announcementService.createAnnouncement({
      title: 'Test Duyurusu',
      message: 'Bu bir test mesajıdır. Duyuru sistemi çalışıyor!',
      targetType: 'all',
      createdBy: user.uid,
      createdByName: user.displayName || 'Admin',
      isActive: true,
    });
    console.log('✅ Test duyurusu oluşturuldu:', id);
  } catch (error) {
    console.error('❌ Hata:', error);
  }
}

testAnnouncement();
```
