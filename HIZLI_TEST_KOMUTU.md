# 🚀 HIZLI TEST - MÜŞTERİ BUTONLARI

## 1. Development Server'ı Başlat

```bash
npm run dev
```

## 2. Browser'da Aç

```
http://localhost:3000/restaurant/nk5O1R45VhqxiB0FZTjr/table/U_0RDjoXmh
```

## 3. F12 Bas → Console Sekmesi

## 4. Göreceksin Loglar

### ✅ BAŞARILI - Şu logları görürsen:
```
🪑 TABLE YÜKLENDİ: {
  tableId: "...",
  tableNumber: "...",
  tableRestaurantId: "nk5O1R45VhqxiB0FZTjr"
}

🔔 ========== NotificationButtons BAŞLATILDI ==========
📊 Props: {
  restaurantId: "nk5O1R45VhqxiB0FZTjr",
  tableId: "...",
  tableName: "..."
}
✅ Component mount edildi, butonlar görünmeli!
```

### ❌ BAŞARISIZ - Hiç log yoksa:
- NotificationButtons component render olmamış
- Muhtemelen `table` null veya `canOrder` false

---

## 5. Butonları Test Et

### A) FAB Butonunu Bul
- Sağ alt köşede **turuncu yuvarlak** buton
- Yukarı ok (ChevronUp) ikonu

### B) Tıkla
- 3 buton açılmalı:
  - 📞 Garson (mavi gradient)
  - 🔥 Köz (turuncu-kırmızı gradient)
  - 💰 Hesap (yeşil gradient)

### C) "Köz" Butonuna Bas

Console'da göreceksin:
```
🔔 BİLDİRİM GÖNDERİLİYOR! {
  restaurantId: "nk5O1R45VhqxiB0FZTjr",
  type: "coal_request",
  tableId: "abc123",
  tableName: "3"
}
```

Sonra:
```
✅ BİLDİRİM OLUŞTURULDU: xyz789
```

### D) Toast Mesajı Gör
- Loading: "🔥 Köz talebiniz gönderiliyor..."
- Success: "🔥 Köz talebiniz iletildi!"

---

## 6. Garson Panelini Kontrol Et

```
http://localhost:3000/dashboard?tab=restaurant
```

"Yeni Köz Talepleri" bölümünde **yeni bir kart** görmelisin:
- Masa numarası doğru
- "Köz İstiyor" mesajı
- "İşleme Al" butonu
- X butonu

---

## 🐛 Sorun Çözümleri

### Problem: FAB butonu görünmüyor
**Neden:** `mounted` state false veya `createPortal` çalışmamış
**Çözüm:** Console'da "Component mount edildi" logunu kontrol et

### Problem: Butonlara tıklayınca hiçbir şey olmuyor
**Neden:** `onClick` handler bağlanmamış veya `tableId === 'loading'`
**Çözüm:** Console'da "tableId: loading" görüyorsan biraz bekle

### Problem: Permission Denied hatası
**Neden:** Firestore rules deploy edilmemiş
**Çözüm:** 
```bash
npx firebase deploy --only firestore:rules
```

### Problem: Toast görünmüyor
**Neden:** Sonner provider eksik olabilir
**Çözüm:** Ana layout'ta `<Toaster />` component'i var mı kontrol et

---

## ✅ TEST BAŞARILI GÖSTERGELERİ

1. ✅ Console'da mount logu var
2. ✅ FAB butonu görünür
3. ✅ Tıklayınca 3 buton açılıyor
4. ✅ Console'da "GÖNDERİLİYOR" logu
5. ✅ Console'da "OLUŞTURULDU" logu  
6. ✅ Toast mesajları ekranda
7. ✅ Garson panelinde bildirim var

---

## 🎯 HIZLI TEST SCRIPT

Console'a yapıştır (eğer UI'dan çalışmazsa):

```javascript
// Manuel test - Console'a yapıştır
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

(async () => {
  try {
    const docRef = await addDoc(collection(db, 'restaurantNotifications'), {
      restaurantId: "nk5O1R45VhqxiB0FZTjr",
      type: "coal_request",
      message: "Masa KONSOL - Köz İstiyor",
      tableId: "test123",
      tableName: "KONSOL",
      isRead: false,
      createdAt: serverTimestamp()
    });
    console.log('✅ Manuel test başarılı:', docRef.id);
    alert('✅ Bildirim oluşturuldu! Garson panelini kontrol et.');
  } catch (error) {
    console.error('❌ Hata:', error);
    alert('❌ Hata: ' + error.message);
  }
})();
```

**NOT:** Bu script browser'da çalışmayabilir (import sorunu). Node.js scriptini kullan:
```bash
node create-notification.mjs
```
