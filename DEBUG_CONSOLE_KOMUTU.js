// CHROME CONSOLE'A YAPIŞTIRILACAK DEBUG KOMUTU
// F12 → Console sekmesi → Bu kodu yapıştır

// 1. Seçili tarihi ve masayı kontrol et
console.log('🎯 MEVCUT DURUM:', {
  selectedDate: window.localStorage.getItem('booking-progress'),
  currentTime: new Date().toISOString()
});

// 2. Firebase'den bugünkü rezervasyonları çek
const db = window.firebase.firestore();
const today = new Date().toISOString().split('T')[0]; // 2026-06-30

console.log('📅 Kontrol edilen tarih:', today);

// Tüm rezervasyonları çek
db.collection('reservations')
  .where('date', '==', today)
  .where('type', '==', 'slot')
  .get()
  .then(snapshot => {
    console.log(`\n📊 ${today} için TOPLAM ${snapshot.size} rezervasyon bulundu\n`);
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const services = data.services || [];
      
      console.log('─────────────────────────────────');
      console.log('📋 Rezervasyon ID:', doc.id);
      console.log('⏰ Saat:', `${data.startTime} - ${data.endTime}`);
      console.log('👤 Müşteri:', data.userName);
      console.log('📍 Status:', data.status);
      console.log('🍽️ Services Array:');
      services.forEach((s, idx) => {
        console.log(`   [${idx}] id: ${s.id}, name: ${s.name}`);
      });
      console.log('🏢 businessId:', data.salonId);
      console.log('─────────────────────────────────\n');
    });
    
    // 20:00-21:30 arasında rezervasyon var mı?
    const evening = snapshot.docs.filter(doc => {
      const data = doc.data();
      const startHour = parseInt(data.startTime.split(':')[0]);
      return startHour >= 20 && startHour <= 21;
    });
    
    console.log(`\n🔍 20:00-21:30 ARASI REZERVASYONLAR: ${evening.length} adet\n`);
    
    if (evening.length > 0) {
      console.log('🔥 İŞTE KIRMIZI SLOTLARIN NEDENİ:');
      evening.forEach(doc => {
        const data = doc.data();
        console.log(`   ${data.startTime}: ${data.services?.[0]?.name} - ${data.userName}`);
      });
    } else {
      console.log('⚠️ 20:00-21:30 arasında rezervasyon YOK ama kırmızı görünüyor!');
      console.log('Bu durumda sorun slot kontrolü mantığındadır.');
    }
  })
  .catch(error => {
    console.error('❌ Hata:', error);
  });

// 3. Salon çalışma saatlerini kontrol et
db.collection('salons')
  .doc('nk5O1R45Vhqxi8OFZTjr')
  .get()
  .then(doc => {
    const data = doc.data();
    const workingHours = data.workingHours;
    
    console.log('\n🏢 SALON ÇALIŞMA SAATLERİ:');
    console.log(JSON.stringify(workingHours, null, 2));
    
    // Bugün hangi gün?
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = new Date();
    const todayName = days[today.getDay()];
    
    console.log(`\n📅 Bugün: ${todayName}`);
    console.log(`⏰ Bugünün çalışma saatleri:`, workingHours[todayName]);
  });

// 4. Browser console'daki mevcut slot kontrolü log'larını göster
console.log('\n💡 NASIL KULLANILIR:');
console.log('1. Yukarıdaki çıktıları incele');
console.log('2. 20:00-21:30 için rezervasyon var mı kontrol et');
console.log('3. Eğer yoksa, slot kontrolü mantığında hata var demektir');
console.log('4. Sonuçları Kiro\'ya yapıştır\n');
