# MÜŞTERİ BUTONLARI TEST ADIMLARI

## 1. Müşteri Menüsünü Aç
```
http://localhost:3000/restaurant/nk5O1R45VhqxiB0FZTjr/table/U_0RDjoXmh
```

## 2. Browser Console'u Aç (F12)

## 3. FAB Butonuna Tıkla
- Sağ alt köşede turuncu yuvarlak buton
- Açıldığında 3 buton görmeli:
  - 📞 Garson
  - 🔥 Köz  
  - 💰 Hesap

## 4. "Köz" Butonuna Tıkla

## 5. Console'da Görmemiz Gerekenler

### ✅ Başarılı Çalıştığında:
```
🔔 BİLDİRİM GÖNDERİLİYOR! {
  restaurantId: "nk5O1R45VhqxiB0FZTjr",
  type: "coal_request",
  tableId: "...",
  tableName: "..."
}

✅ BİLDİRİM OLUŞTURULDU: [notificationId]
```

### ❌ Hata Varsa:
```
❌ BİLDİRİM HATASI: [error mesajı]
```

## 6. Toast Mesajları
- Loading: "🔥 Köz talebiniz gönderiliyor..."
- Success: "🔥 Köz talebiniz iletildi!"

## 7. Garson Panelini Kontrol Et
```
http://localhost:3000/dashboard?tab=restaurant
```
- "Yeni Köz Talepleri" bölümünde yeni kart görünmeli
- Masa numarası doğru görünmeli
- "İşleme Al" ve "Tamamlandı" butonları çalışmalı
- X butonu ile kapatılabilmeli

---

## Olası Sorunlar ve Çözümler

### Sorun 1: "restaurantId is undefined"
**Çözüm:** CustomerMenu'de `table.restaurantId` doğru geçiliyor mu kontrol et

### Sorun 2: "Permission Denied"
**Çözüm:** Firestore rules'da `allow create: if true` var mı kontrol et

### Sorun 3: Butonlar render olmuyor
**Çözüm:** NotificationButtons component'i CustomerMenu'de import edilmiş mi?

### Sorun 4: tableId "loading" geliyor
**Çözüm:** Table verisi tam yüklenmeden buton tıklanmış, bekle ve tekrar dene

---

## Debug için Console Logları

NotificationButtons mount olduğunda:
```
🔔 ========== NotificationButtons BAŞLATILDI ==========
📊 Props: {
  restaurantId: "...",
  tableId: "...",
  tableName: "..."
}
✅ Component mount edildi, butonlar görünmeli!
```

Eğer bu loglar görünmüyorsa component render olmamış demektir.
