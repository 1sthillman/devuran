// 🔥 TEST BİLDİRİMİ OLUŞTUR
// Bu kodu tarayıcı konsolunda çalıştır (müşteri menüsü veya garson paneli sayfasında)

(async function createTestNotification() {
  console.log('🔥 ========== TEST BİLDİRİMİ OLUŞTURULUYOR ==========');
  
  try {
    // Firebase'i import et
    const { db } = await import('./src/lib/firebase.ts');
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    
    // Bildirim verisi
    const notificationData = {
      restaurantId: "nk5O1R45VhqxiB0FZTjr",
      type: "coal_request",
      message: "Masa TEST - KÖZ İSTİYOR (Manuel Test)",
      tableId: "KOaUdLOdBopxBgejDN0O",
      tableName: "TEST",
      isRead: false,
      createdAt: serverTimestamp()
    };
    
    console.log('📝 Oluşturulacak veri:', notificationData);
    
    // Firebase'e yaz
    const docRef = await addDoc(collection(db, 'restaurantNotifications'), notificationData);
    
    console.log('✅ ========== BAŞARILI! ==========');
    console.log('🆔 Notification ID:', docRef.id);
    console.log('📍 Koleksiyon: restaurantNotifications');
    console.log('🎯 Garson paneline git ve bildirimi kontrol et!');
    
    alert('✅ Test bildirimi oluşturuldu!\nGarson panelini kontrol et.');
    
  } catch (error) {
    console.error('❌ HATA:', error);
    console.error('Kod:', error.code);
    console.error('Mesaj:', error.message);
    
    alert('❌ Hata: ' + error.message);
  }
})();
