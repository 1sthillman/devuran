// 🔥 FIREBASE DEBUG SCRIPT
// Bu scripti tarayıcı konsolunda çalıştır (müşteri menüsü sayfasında)

(async function debugRestaurantNotifications() {
  console.log('🔍 ========== DEBUG BAŞLIYOR ==========');
  
  // Firebase ve servisleri kontrol et
  if (typeof restaurantService === 'undefined') {
    console.error('❌ restaurantService bulunamadı!');
    console.log('💡 Script müşteri menüsü sayfasında çalıştırılmalı');
    return;
  }
  
  // URL'den parametreleri al
  const url = window.location.pathname;
  const matches = url.match(/restaurant\/([^\/]+)\/table\/([^\/]+)/);
  
  if (!matches) {
    console.error('❌ URL formatı hatalı!');
    return;
  }
  
  const [, restaurantId, tableQR] = matches;
  
  console.log('📋 URL Parametreleri:');
  console.log('  Restaurant ID:', restaurantId);
  console.log('  Table QR:', tableQR);
  
  // Masa verisini çek
  console.log('\n📦 Masa verisi çekiliyor...');
  try {
    const { restaurantService } = await import('./src/services/restaurantService');
    const table = await restaurantService.getTableByQR(tableQR);
    
    if (!table) {
      console.error('❌ Masa bulunamadı!');
      return;
    }
    
    console.log('✅ Masa bulundu:');
    console.log('  ID:', table.id);
    console.log('  Numara:', table.tableNumber);
    console.log('  Restaurant ID:', table.restaurantId);
    
    // ID karşılaştırması
    console.log('\n🔍 ID Karşılaştırması:');
    console.log('  URL restaurantId:', restaurantId);
    console.log('  Table restaurantId:', table.restaurantId);
    
    if (restaurantId === table.restaurantId) {
      console.log('  ✅ ID\'LER AYNI - Sistem çalışmalı!');
    } else {
      console.log('  ❌ ID\'LER FARKLI - Bu sorunun kaynağı!');
      console.log('\n🔧 ÇÖZÜM:');
      console.log('  1. Firebase Console\'u aç');
      console.log('  2. tables koleksiyonunda bu masayı bul:', table.id);
      console.log('  3. restaurantId alanını güncelle:', restaurantId);
      console.log('     Şu anki değer:', table.restaurantId);
      console.log('     Olması gereken:', restaurantId);
    }
    
    // Test bildirimi gönder
    console.log('\n🔔 Test bildirimi gönderiliyor...');
    const notificationId = await restaurantService.createNotification(
      table.restaurantId,
      'coal_request',
      `DEBUG TEST - Masa ${table.tableNumber}`,
      table.id,
      table.tableNumber
    );
    
    console.log('✅ Bildirim oluşturuldu!');
    console.log('  Notification ID:', notificationId);
    console.log('  Koleksiyon: restaurantNotifications');
    console.log('  Restaurant ID:', table.restaurantId);
    
    console.log('\n🎯 Firebase Console\'da kontrol et:');
    console.log('  1. restaurantNotifications koleksiyonu');
    console.log('  2. Belge ID:', notificationId);
    console.log('  3. restaurantId alanı:', table.restaurantId);
    
    console.log('\n✅ ========== DEBUG TAMAMLANDI ==========');
    
  } catch (error) {
    console.error('❌ HATA:', error);
    console.error('  Kod:', error.code);
    console.error('  Mesaj:', error.message);
  }
})();

// KULLANIM:
// 1. Müşteri menüsü sayfasını aç (http://localhost:3000/restaurant/.../table/...)
// 2. F12 ile konsolu aç
// 3. Bu script'i kopyala-yapıştır
// 4. Enter'a bas
// 5. Logları oku
