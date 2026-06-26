// TEST: restaurantNotifications koleksiyonunu oluştur
// Firebase Console > Firestore > Run Query sekmesinde çalıştır

// VEYA: Manuel olarak Firestore Console'dan ekle:
// 1. "+ Start collection" butonuna tıkla
// 2. Collection ID: restaurantNotifications
// 3. Document ID: (auto-generate)
// 4. Fields ekle:

const testNotification = {
  restaurantId: "OWyKgBhCLGfZTMaGJ8E",  // user.salonId ile aynı olmalı
  type: "coal_request",
  message: "Masa 2 - Köz istiyor",
  tableId: "test123",
  tableName: "2",
  isRead: false,
  createdAt: new Date(),  // Firebase Console'da: Timestamp > now
};

// MANUEL ADIMLAR:
// 1. Firebase Console aç
// 2. Firestore Database > Data
// 3. "+ Start collection"
// 4. Collection ID: "restaurantNotifications"
// 5. Document ID: Auto-generate
// 6. Add fields (yukardaki alanları ekle):
//    - restaurantId: string: "OWyKgBhCLGfZTMaGJ8E"
//    - type: string: "coal_request"
//    - message: string: "Masa 2 - Köz istiyor"
//    - tableId: string: "test123"
//    - tableName: string: "2"
//    - isRead: boolean: false
//    - createdAt: timestamp: now
// 7. Save
// 8. Garson paneline git ve bildirimin görünüp görünmediğini kontrol et
