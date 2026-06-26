# 🔥 FIREBASE MANUEL KONTROL

## 1️⃣ MASANIN RESTAURANT ID'SİNİ KONTROL ET

### Firebase Console'da:
1. Firestore Database > Data
2. **`tables`** koleksiyonunu aç
3. **CTRL+F** ile ara: `g5J5476WuS` (QR code)
4. Bu belgeyi aç
5. **`restaurantId`** alanının değerini kopyala
6. Buraya yaz: `restaurantId = ______________`

## 2️⃣ KULLANICININ SALON ID'SİNİ KONTROL ET

### Firebase Console'da:
1. Firestore Database > Data  
2. **`users`** koleksiyonunu aç
3. Restoran sahibi kullanıcısını bul (email veya UID ile)
4. **`salonId`** alanının değerini kopyala
5. Buraya yaz: `salonId = ______________`

## 3️⃣ KARŞILAŞTIR

- Masa restaurantId: `______________`
- User salonId: `______________`

### ✅ EĞER AYNI İSE:
- Sistem çalışmalı
- `restaurantNotifications` koleksiyonu oluşmalı
- Garson panelinde bildirimler görünmeli

### ❌ EĞER FARKLI İSE:
**ÇÖZÜM**: Masanın `restaurantId`'sini güncelle:

1. Firebase Console > `tables` koleksiyonu
2. QR: `g5J5476WuS` olan belgeyi aç
3. `restaurantId` alanını düzenle
4. Değeri user'ın `salonId`'si ile değiştir
5. **Save**

## 4️⃣ TEST ET

Güncelleme sonrası:
1. Müşteri menüsünü yenile (F5)
2. Köz butonuna tıkla
3. Firebase Console'u yenile
4. **`restaurantNotifications`** koleksiyonu oluştu mu kontrol et

---

# 🆘 ALTERNATIF: DOĞRUDAN BİLDİRİM OLUŞTUR

Eğer hala çalışmıyorsa, Firebase Console'dan manuel bildirim oluştur:

1. Firebase Console > Firestore Database
2. **Start collection** butonuna tıkla
3. Collection ID: **`restaurantNotifications`**
4. Document ID: **Auto-generate**
5. Alanları ekle:
   - `restaurantId` (string): [USER'IN SALON ID'Sİ]
   - `type` (string): `coal_request`
   - `message` (string): `Masa 2 - Köz istiyor`
   - `tableId` (string): `g5J5476WuS`
   - `tableName` (string): `2`
   - `isRead` (boolean): `false`
   - `createdAt` (timestamp): **now** seç
6. **Save**
7. Garson paneline git - bildirim görünmeli!

---

# 📝 BANA GÖNDER:

Lütfen şu bilgileri ver:
1. ✅ Masa restaurantId: `______________`
2. ✅ User salonId: `______________`
3. ✅ Aynı mı farklı mı?: ___________
4. ✅ Manuel bildirim oluşturdun mu?: ___________
5. ✅ Garson panelinde göründü mü?: ___________
