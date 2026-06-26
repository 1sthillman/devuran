# Firebase Index Oluşturma Linkleri

Aşağıdaki linklere tıklayarak tüm index'leri tek tek oluşturabilirsiniz:

## Tables Collection
1. [restaurantId + area](https://console.firebase.google.com/v1/r/project/ruloposs/firestore/indexes?create_composite=Ckdwcm9qZWN0cy9ydWxvcG9zcy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvdGFibGVzL2luZGV4ZXMvXxABGhAKDHJlc3RhdXJhbnRJZBABGggKBGFyZWEQAQ)

## Orders Collection
2. [restaurantId + status + createdAt](https://console.firebase.google.com/v1/r/project/ruloposs/firestore/indexes?create_composite=Ckdwcm9qZWN0cy9ydWxvcG9zcy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvb3JkZXJzL2luZGV4ZXMvXxABGhAKDHJlc3RhdXJhbnRJZBABGgwKCHN0YXR1cxABGg0KCWNyZWF0ZWRBdBAC)
3. [restaurantId + tableId + createdAt](https://console.firebase.google.com/v1/r/project/ruloposs/firestore/indexes?create_composite=Ckdwcm9qZWN0cy9ydWxvcG9zcy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvb3JkZXJzL2luZGV4ZXMvXxABGhAKDHJlc3RhdXJhbnRJZBABGg0KCXRhYmxlSWQQARoNCgljcmVhdGVkQXQQAg)

## Services Collection
4. [salonId + isActive](https://console.firebase.google.com/v1/r/project/ruloposs/firestore/indexes?create_composite=Ckdwcm9qZWN0cy9ydWxvcG9zcy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvc2VydmljZXMvaW5kZXhlcy9fEAEaDQoJc2Fsb25JZBABGgwKCGlzQWN0aXZlEAE)

## Appointments Collection
5. [salonId + date](https://console.firebase.google.com/v1/r/project/ruloposs/firestore/indexes?create_composite=Ckdwcm9qZWN0cy9ydWxvcG9zcy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvYXBwb2ludG1lbnRzL2luZGV4ZXMvXxABGg0KCXNhbG9uSWQQARoICgRkYXRlEAE)
6. [salonId + staffId + date + time + status](https://console.firebase.google.com/v1/r/project/ruloposs/firestore/indexes?create_composite=Ckdwcm9qZWN0cy9ydWxvcG9zcy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvYXBwb2ludG1lbnRzL2luZGV4ZXMvXxABGg0KCXNhbG9uSWQQARoNCglzdGFmZklkEAEaCAoEZGF0ZRABGggKBHRpbWUQARoMCghzdGF0dXMQAQ)
7. [staffId + date + time](https://console.firebase.google.com/v1/r/project/ruloposs/firestore/indexes?create_composite=Ckdwcm9qZWN0cy9ydWxvcG9zcy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvYXBwb2ludG1lbnRzL2luZGV4ZXMvXxABGg0KCXN0YWZmSWQQARoICgRkYXRlEAEaCAoEdGltZRAB)
8. [staffId + date + status](https://console.firebase.google.com/v1/r/project/ruloposs/firestore/indexes?create_composite=Ckdwcm9qZWN0cy9ydWxvcG9zcy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvYXBwb2ludG1lbnRzL2luZGV4ZXMvXxABGg0KCXN0YWZmSWQQARoICgRkYXRlEAEaDAoIc3RhdHVzEAE)
9. [date + status](https://console.firebase.google.com/v1/r/project/ruloposs/firestore/indexes?create_composite=Ckdwcm9qZWN0cy9ydWxvcG9zcy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvYXBwb2ludG1lbnRzL2luZGV4ZXMvXxABGggKBGRhdGUQARoMCghzdGF0dXMQAQ)
10. [userId + date](https://console.firebase.google.com/v1/r/project/ruloposs/firestore/indexes?create_composite=Ckdwcm9qZWN0cy9ydWxvcG9zcy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvYXBwb2ludG1lbnRzL2luZGV4ZXMvXxABGgwKCHVzZXJJZBABGggKBGRhdGUQAg)

## Queue Collection
11. [salonId + staffId + queuePosition](https://console.firebase.google.com/v1/r/project/ruloposs/firestore/indexes?create_composite=Ckdwcm9qZWN0cy9ydWxvcG9zcy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvcXVldWUvaW5kZXhlcy9fEAEaDQoJc2Fsb25JZBABGg0KCXN0YWZmSWQQARoRCg1xdWV1ZVBvc2l0aW9uEAE)
12. [salonId + queuePosition](https://console.firebase.google.com/v1/r/project/ruloposs/firestore/indexes?create_composite=Ckdwcm9qZWN0cy9ydWxvcG9zcy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvcXVldWUvaW5kZXhlcy9fEAEaDQoJc2Fsb25JZBABGhEKDXF1ZXVlUG9zaXRpb24QAQ)

## Reviews Collection
13. [salonId + createdAt](https://console.firebase.google.com/v1/r/project/ruloposs/firestore/indexes?create_composite=Ckdwcm9qZWN0cy9ydWxvcG9zcy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvcmV2aWV3cy9pbmRleGVzL18QARoNCglzYWxvbklkEAEaDQoJY3JlYXRlZEF0EAI)

## Staff Collection
14. [salonId + isActive](https://console.firebase.google.com/v1/r/project/ruloposs/firestore/indexes?create_composite=Ckdwcm9qZWN0cy9ydWxvcG9zcy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvc3RhZmYvaW5kZXhlcy9fEAEaDQoJc2Fsb25JZBABGgwKCGlzQWN0aXZlEAE)

## Menu Items Collection
15. [restaurantId + categoryId](https://console.firebase.google.com/v1/r/project/ruloposs/firestore/indexes?create_composite=Ckdwcm9qZWN0cy9ydWxvcG9zcy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvbWVudUl0ZW1zL2luZGV4ZXMvXxABGhAKDHJlc3RhdXJhbnRJZBABGg4KCmNhdGVnb3J5SWQQAQ)
16. [restaurantId + displayOrder](https://console.firebase.google.com/v1/r/project/ruloposs/firestore/indexes?create_composite=Ckdwcm9qZWN0cy9ydWxvcG9zcy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvbWVudUl0ZW1zL2luZGV4ZXMvXxABGhAKDHJlc3RhdXJhbnRJZBABGhAKDGRpc3BsYXlPcmRlchAB)
17. [restaurantId + isActive](https://console.firebase.google.com/v1/r/project/ruloposs/firestore/indexes?create_composite=Ckdwcm9qZWN0cy9ydWxvcG9zcy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvbWVudUl0ZW1zL2luZGV4ZXMvXxABGhAKDHJlc3RhdXJhbnRJZBABGgwKCGlzQWN0aXZlEAE)

## Menu Categories Collection
18. [restaurantId + displayOrder](https://console.firebase.google.com/v1/r/project/ruloposs/firestore/indexes?create_composite=Ckdwcm9qZWN0cy9ydWxvcG9zcy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvbWVudUNhdGVnb3JpZXMvaW5kZXhlcy9fEAEaEAoMcmVzdGF1cmFudElkEAEaEAoMZGlzcGxheU9yZGVyEAE)

## Restaurant Notifications Collection
19. [restaurantId + isRead + createdAt](https://console.firebase.google.com/v1/r/project/ruloposs/firestore/indexes?create_composite=Ckdwcm9qZWN0cy9ydWxvcG9zcy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvcmVzdGF1cmFudE5vdGlmaWNhdGlvbnMvaW5kZXhlcy9fEAEaEAoMcmVzdGF1cmFudElkEAEaCgoGaXNSZWFkEAEaDQoJY3JlYXRlZEF0EAI)

## Subscriptions Collection
20. [businessId + createdAt](https://console.firebase.google.com/v1/r/project/ruloposs/firestore/indexes?create_composite=Ckdwcm9qZWN0cy9ydWxvcG9zcy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvc3Vic2NyaXB0aW9ucy9pbmRleGVzL18QARoOCgpidXNpbmVzc0lkEAEaDQoJY3JlYXRlZEF0EAI)

## Subscription History Collection
21. [businessId + createdAt](https://console.firebase.google.com/v1/r/project/ruloposs/firestore/indexes?create_composite=Ckdwcm9qZWN0cy9ydWxvcG9zcy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvc3Vic2NyaXB0aW9uSGlzdG9yeS9pbmRleGVzL18QARoOCgpidXNpbmVzc0lkEAEaDQoJY3JlYXRlZEF0EAI)

---

## Otomatik Oluşturma (Önerilen)

Ya da aşağıdaki komutu çalıştırın:
```bash
npx firebase deploy --only firestore:indexes
```

Sorulduğunda "No" deyin ki mevcut index'ler silinmesin!
