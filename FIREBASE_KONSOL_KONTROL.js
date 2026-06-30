// FIREBASE KONSOLU İÇİN YAPIŞTIRILACAK KOD
// Chrome DevTools Console'a yapıştır

// 1. Bugünkü tüm rezervasyonları göster
const db = window.firebase.firestore();
const today = '2026-06-30';

db.collection('reservations')
  .where('date', '==', today)
  .where('type', '==', 'slot')
  .get()
  .then(snapshot => {
    console.log(`📅 ${today} için toplam ${snapshot.size} rezervasyon:`);
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log({
        id: doc.id,
        saat: `${data.startTime} - ${data.endTime}`,
        masa: data.services?.[0]?.name,
        masaId: data.services?.[0]?.id,
        tableId: data.tableId,
        status: data.status,
        musteri: data.userName
      });
    });
  });

// 2. services collection'ını kontrol et
db.collection('services')
  .where('salonId', '==', 'nk5O1R45Vhqxi8OFZTjr')
  .get()
  .then(snapshot => {
    console.log(`🍽️ Toplam ${snapshot.size} service/hizmet:`);
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log({
        id: doc.id,
        name: data.name,
        tableId: data.tableId,
        type: data.tableId ? 'MASA' : 'HİZMET'
      });
    });
  });

// 3. Salon bilgisini kontrol et
db.collection('salons')
  .doc('nk5O1R45Vhqxi8OFZTjr')
  .get()
  .then(doc => {
    const data = doc.data();
    console.log('🏢 Salon Bilgisi:');
    console.log({
      name: data.name,
      category: data.category,
      masaSayisi: data.services?.filter(s => s.tableId).length,
      workingHours: data.workingHours
    });
    
    console.log('📋 Masalar (services array):');
    data.services?.forEach(s => {
      if (s.tableId) {
        console.log({
          serviceId: s.id,
          tableId: s.tableId,
          name: s.name,
          price: s.price
        });
      }
    });
  });
