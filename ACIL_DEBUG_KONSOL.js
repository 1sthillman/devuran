// CHROME CONSOLE'A YAPIŞTIR - F12 → Console
// Rezervasyon sayfasındayken çalıştır

console.clear();
console.log('🔍 SLOT KONTROLÜ DEBUG - BAŞLIYOR\n');

// 1. localStorage'daki booking state'i kontrol et
const bookingState = localStorage.getItem('booking-progress');
if (bookingState) {
  const parsed = JSON.parse(bookingState);
  console.log('📦 BOOKING STATE:', {
    salonId: parsed.state?.salonId,
    selectedServices: parsed.state?.selectedServices?.map(s => ({
      id: s.id,
      tableId: s.tableId,
      name: s.name
    })),
    selectedDate: parsed.state?.selectedDate,
    selectedTime: parsed.state?.selectedTime
  });
}

// 2. Firebase'den bugünkü rezervasyonları çek
const db = window.firebase.firestore();
const today = '2026-06-30';

db.collection('reservations')
  .where('date', '==', today)
  .where('type', '==', 'slot')
  .where('salonId', '==', 'nk5O1R45Vhqxi8OFZTjr')
  .get()
  .then(snapshot => {
    console.log(`\n📅 ${today} için ${snapshot.size} rezervasyon:\n`);
    
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log('─────────────────────');
      console.log('🆔 ID:', doc.id);
      console.log('⏰ Saat:', `${data.startTime} - ${data.endTime}`);
      console.log('📋 Status:', data.status);
      console.log('🍽️ Services Array:');
      (data.services || []).forEach((s, idx) => {
        console.log(`   [${idx}] { id: "${s.id}", name: "${s.name}" }`);
      });
      console.log('🔑 tableId:', data.tableId);
      console.log('─────────────────────\n');
    });
    
    // 17:00 rezervasyonu var mı?
    const res17 = snapshot.docs.find(doc => doc.data().startTime === '17:00');
    if (res17) {
      const data = res17.data();
      console.log('🎯 17:00 REZERVASYONU BULUNDU!');
      console.log('   services[0].id:', data.services?.[0]?.id);
      console.log('   tableId:', data.tableId);
      console.log('   Bu ID slot kontrolünde kullanılmalı!\n');
    } else {
      console.log('⚠️ 17:00 rezervasyonu BULUNAMADI!\n');
    }
  });

// 3. Salon services array'ini kontrol et
db.collection('salons')
  .doc('nk5O1R45Vhqxi8OFZTjr')
  .get()
  .then(doc => {
    const data = doc.data();
    const services = data.services || [];
    
    console.log('🏢 SALON SERVİSLERİ (MASALAR):\n');
    services.forEach((s, idx) => {
      if (s.tableId) {
        console.log(`[${idx}] Masa: ${s.name}`);
        console.log(`     service.id: ${s.id}`);
        console.log(`     tableId: ${s.tableId}`);
        console.log('');
      }
    });
  });

console.log('\n💡 NASIL YORUMLANIR:');
console.log('1. Rezervasyondaki services[0].id ile tableId AYNI mi?');
console.log('2. Slot kontrolünde hangi ID kullanılıyor?');
console.log('3. Her iki ID de eşleşiyor mu?\n');
