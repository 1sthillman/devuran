/**
 * SYNC SCRIPT: salon.services array -> services collection
 * 
 * Sadece COLLECTION'DA OLMAYAN hizmetleri kopyalar
 * Mevcut collection verisine dokunmaz
 */

import { collection, getDocs, doc, setDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase.js';

async function syncServicesToCollection() {
  console.log('🔄 Syncing services to collection...\n');
  
  try {
    const salonsSnapshot = await getDocs(collection(db, 'salons'));
    console.log(`📊 ${salonsSnapshot.size} salon bulundu\n`);
    
    let totalSynced = 0;
    
    for (const salonDoc of salonsSnapshot.docs) {
      const salonId = salonDoc.id;
      const salonData = salonDoc.data();
      const salonName = salonData.name || 'Unknown';
      
      const arrayServices = salonData.services || [];
      if (!Array.isArray(arrayServices) || arrayServices.length === 0) {
        continue;
      }
      
      console.log(`🏢 ${salonName}: ${arrayServices.length} hizmet array'de`);
      
      // Collection'daki mevcut hizmetleri al
      const q = query(
        collection(db, 'services'),
        where('salonId', '==', salonId)
      );
      const collectionSnapshot = await getDocs(q);
      const existingIds = new Set(collectionSnapshot.docs.map(d => d.id));
      
      console.log(`   Collection'da: ${existingIds.size} hizmet`);
      
      // Sadece collection'da OLMAYANLARI ekle
      let synced = 0;
      for (const service of arrayServices) {
        if (!service.id) continue;
        
        if (!existingIds.has(service.id)) {
          try {
            await setDoc(doc(db, 'services', service.id), {
              ...service,
              salonId: salonId,
            });
            console.log(`   ✅ ${service.name} eklendi`);
            synced++;
            totalSynced++;
          } catch (e) {
            console.error(`   ❌ ${service.name} eklenemedi:`, e);
          }
        }
      }
      
      if (synced > 0) {
        console.log(`   📝 ${synced} yeni hizmet collection'a eklendi\n`);
      } else {
        console.log(`   ✓ Tüm hizmetler zaten collection'da\n`);
      }
    }
    
    console.log('='.repeat(60));
    console.log(`✅ Toplam ${totalSynced} hizmet senkronize edildi`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  }
}

syncServicesToCollection()
  .then(() => {
    console.log('\n✅ Sync completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Sync failed:', error);
    process.exit(1);
  });
