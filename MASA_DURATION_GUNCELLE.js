// 🍽️ MASA DURATION GÜNCELLEME KOMUTU
// Chrome Console'a yapıştır (F12 → Console)
// Restoran owner panelindeyken çalıştır

console.clear();
console.log('🍽️ MASA DURATION GÜNCELLEME - BAŞLIYOR\n');

const db = window.firebase.firestore();

async function updateAllTableDurations() {
  try {
    const salonsSnapshot = await db.collection('salons').get();
    
    let totalUpdated = 0;
    const updatePromises = [];
    
    for (const salonDoc of salonsSnapshot.docs) {
      const salonData = salonDoc.data();
      
      // Sadece restoran/kafe kategorisi
      if (salonData.category !== 'restoran' && salonData.category !== 'kafe') {
        continue;
      }
      
      const services = salonData.services || [];
      let needsUpdate = false;
      
      const updatedServices = services.map(service => {
        // Masa servisleri (tableId var) ve duration 120 veya 90 olanları güncelle
        if (service.tableId && (service.duration === 120 || service.duration === 90)) {
          console.log(`✏️ ${salonData.name} - ${service.name}: ${service.duration}dk → 60dk`);
          needsUpdate = true;
          totalUpdated++;
          return { ...service, duration: 60 };
        }
        return service;
      });
      
      if (needsUpdate) {
        updatePromises.push(
          db.collection('salons').doc(salonDoc.id).update({
            services: updatedServices
          })
        );
        console.log(`✅ ${salonData.name} güncellendi\n`);
      }
    }
    
    await Promise.all(updatePromises);
    
    console.log(`\n🎉 TAMAMLANDI!`);
    console.log(`📊 Toplam ${totalUpdated} masa güncellendi`);
    console.log(`⏰ Yeni duration: 60 dakika (1 saat - standart)\n`);
    console.log('💡 Şimdi sayfayı yenileyin ve tekrar deneyin!');
    
  } catch (error) {
    console.error('❌ Güncelleme hatası:', error);
  }
}

// Otomatik çalıştır
updateAllTableDurations();
