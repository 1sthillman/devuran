// 🍽️ MASA DURATION GÜNCELLEME SCRIPT
// Mevcut masaların duration'ını 120/90'dan 60'a düşürür

import { db } from '../lib/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

async function updateTableDuration() {
  console.log('🍽️ Masa Duration Güncelleme Başlıyor...\n');
  
  try {
    const salonsRef = collection(db, 'salons');
    const salonsSnapshot = await getDocs(salonsRef);
    
    let totalUpdated = 0;
    
    for (const salonDoc of salonsSnapshot.docs) {
      const salonData = salonDoc.data();
      
      // Sadece restoran kategorisini kontrol et
      if (salonData.category !== 'restoran' && salonData.category !== 'kafe') {
        continue;
      }
      
      const services = salonData.services || [];
      let updated = false;
      
      const updatedServices = services.map((service: any) => {
        // Masa servisleri (tableId var) ve duration 120 veya 90 olanları güncelle
        if (service.tableId && (service.duration === 120 || service.duration === 90)) {
          console.log(`✏️ ${salonData.name} - ${service.name}: ${service.duration}dk → 60dk`);
          updated = true;
          totalUpdated++;
          return { ...service, duration: 60 };
        }
        return service;
      });
      
      if (updated) {
        await updateDoc(doc(db, 'salons', salonDoc.id), {
          services: updatedServices
        });
        console.log(`✅ ${salonData.name} güncellendi\n`);
      }
    }
    
    console.log(`\n🎉 Toplam ${totalUpdated} masa duration'ı güncellendi!`);
    console.log('⏰ Yeni duration: 60 dakika (1 saat - standart)\n');
    
  } catch (error) {
    console.error('❌ Güncelleme hatası:', error);
  }
}

// Export for use in console or as module
if (typeof window !== 'undefined') {
  (window as any).updateTableDuration = updateTableDuration;
  console.log('✅ updateTableDuration() fonksiyonu hazır!');
  console.log('📝 Kullanım: await updateTableDuration()');
}

export { updateTableDuration };
