# MASA VERİSİNİ KONTROL ET

## Adımlar:

1. Firebase Console'u aç
2. Firestore Database > Data
3. **`tables`** koleksiyonunu bul
4. **QR Code: `g5J5476WuS`** olan belgeyi bul
5. Bu belgenin **`restaurantId`** alanına bak

## Beklenen:
- `restaurantId` alanı olmalı
- Değeri: `nk5O1R45VhqxiB0FZTjr` VEYA başka bir ID

## Garson Paneli:
- Sol ekrandaki garson panelinde konsolu aç (F12)
- `🎯 WAITER PANEL BAŞLATILDI` logunu gör
- `📍 Dinlenen Restaurant ID: xxxxxx` değerini not al

## Karşılaştırma:
- Masa'daki `restaurantId` = Garson'un dinlediği `restaurantId` ise ✅ ÇALIŞIR
- Masa'daki `restaurantId` ≠ Garson'un dinlediği `restaurantId` ise ❌ ÇALIŞMAZ

## Eğer Farklıysa:
Masa'nın `restaurantId`'sini güncellemen gerekir:
1. Firebase Console > tables koleksiyonu
2. QR: `g5J5476WuS` olan belgeyi bul
3. `restaurantId` alanını garson panelinin dinlediği ID ile güncelle
4. Save
