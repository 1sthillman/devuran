# Firebase Index Hataları Çözümü

## Sorun
Firestore sorguları için gerekli indexler oluşturulmamış. Bu hatalar uygulamayı kullanırken veri yüklenememesine neden olur.

## Çözüm
Aşağıdaki linklere tıklayarak Firebase Console'da otomatik olarak index'ler oluşturulacak:

### 1. Restaurant Notifications Index
```
isRead + restaurantId + createdAt
```
**Link:** https://console.firebase.google.com/v1/r/project/ruloposs/firestore/indexes?create_composite=Clhwcm9qZWN0cy9ydWxvcG9zcy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvcmVzdGF1cmFudE5vdGlmaWNhdGlvbnMvaW5kZXhlcy9fEAEaCgoGaXNSZWFkEAEaEAoMcmVzdGF1cmFudElkEAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg

### 2. Orders Index
```
restaurantId + createdAt
```
**Link:** https://console.firebase.google.com/v1/r/project/ruloposs/firestore/indexes?create_composite=Ckdwcm9qZWN0cy9ydWxvcG9zcy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvb3JkZXJzL2luZGV4ZXMvXxABGhAKDHJlc3RhdXJhbnRJZBABGg0KCWNyZWF0ZWRBdBACGgwKCF9fbmFtZV9fEAI

### 3. Tables Index
```
restaurantId + tableNumber
```
**Link:** https://console.firebase.google.com/v1/r/project/ruloposs/firestore/indexes?create_composite=Ckdwcm9qZWN0cy9ydWxvcG9zcy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvdGFibGVzL2luZGV4ZXMvXxABGhAKDHJlc3RhdXJhbnRJZBABGg8KC3RhYmxlTnVtYmVyEAEaDAoIX19uYW1lX18QAQ

## Adımlar
1. Her linke sırayla tıklayın
2. Firebase Console'da "Create Index" butonuna tıklayın
3. Index'in oluşturulmasını bekleyin (birkaç dakika sürebilir)
4. Tüm index'ler oluşturulduktan sonra uygulamayı yeniden yükleyin

## Sonuç
Tüm index'ler oluşturulduktan sonra:
- Restoran bildirimleri düzgün çalışacak
- Siparişler doğru sırayla listelenecek
- Masa listesi hızlı yüklenecek
- Hatalar kaybolacak
