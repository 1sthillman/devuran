/**
 * 🔧 UTILITY: Tüm Salonların Abonelik Durumunu Güncelle
 * 
 * Bu script tüm salonları tarayıp subscriptionActive alanını günceller
 * 
 * Kullanım:
 * 1. Admin olarak giriş yap
 * 2. Console'da syncAllSalonSubscriptions() çağır
 */

import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Hızlı Fix: Tüm salonları aktif yap (GEÇİCİ)
 */
export async function makeAllSalonsActive() {
  console.log('🔄 Making all salons active...');
  
  try {
    const salonsSnapshot = await getDocs(collection(db, 'salons'));
    console.log(`📊 Found ${salonsSnapshot.size} salons`);
    
    let updatedCount = 0;
    
    for (const salonDoc of salonsSnapshot.docs) {
      const salonId = salonDoc.id;
      const salonName = salonDoc.data().name;
      
      await updateDoc(doc(db, 'salons', salonId), {
        subscriptionActive: true,
        updatedAt: new Date().toISOString(),
      });
      
      updatedCount++;
      console.log(`✅ ${salonName}: Set to ACTIVE`);
    }
    
    console.log(`\n✅ ${updatedCount} salons set to active`);
    
    return {
      success: true,
      updated: updatedCount,
    };
    
  } catch (error) {
    console.error('❌ Failed:', error);
    throw error;
  }
}

/**
 * Tam Senkronizasyon: Abonelik durumuna göre güncelle
 */
export async function syncAllSalonSubscriptions() {
  console.log('🔄 Starting salon subscription sync...');
  
  try {
    // Tüm salonları al
    const salonsSnapshot = await getDocs(collection(db, 'salons'));
    console.log(`📊 Found ${salonsSnapshot.size} salons`);
    
    // Tüm abonelikleri al (sadece admin okuyabilir)
    let subscriptionsSnapshot;
    try {
      subscriptionsSnapshot = await getDocs(collection(db, 'subscriptions'));
      console.log(`📊 Found ${subscriptionsSnapshot.size} subscriptions`);
    } catch (error: any) {
      console.error('❌ Cannot read subscriptions (not admin?):', error.message);
      console.log('💡 Trying alternative method: checking each salon individually...');
      
      // Alternatif: Her salon için ayrı ayrı kontrol et
      let updatedCount = 0;
      
      for (const salonDoc of salonsSnapshot.docs) {
        const salonId = salonDoc.id;
        const salonName = salonDoc.data().name;
        
        // Her salon için subscription var mı kontrol et
        let hasActiveSubscription = false;
        try {
          const subDoc = await getDoc(doc(db, 'subscriptions', salonId));
          if (subDoc.exists()) {
            const subData = subDoc.data();
            const now = new Date();
            const endDate = new Date(subData.endDate);
            hasActiveSubscription = subData.status === 'active' && now <= endDate;
          }
        } catch (subError) {
          console.log(`⚠️ Cannot check subscription for ${salonName}`);
        }
        
        await updateDoc(doc(db, 'salons', salonId), {
          subscriptionActive: hasActiveSubscription,
          updatedAt: new Date().toISOString(),
        });
        
        updatedCount++;
        console.log(`${hasActiveSubscription ? '✅' : '❌'} ${salonName}: ${hasActiveSubscription ? 'ACTIVE' : 'INACTIVE'}`);
      }
      
      console.log(`\n✅ ${updatedCount} salons updated`);
      return { success: true, updated: updatedCount };
    }
    
    // Abonelikleri businessId'ye göre map'le
    const subscriptionMap = new Map<string, any>();
    subscriptionsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const existing = subscriptionMap.get(data.businessId);
      
      // En yeni aboneliği tut
      if (!existing || new Date(data.createdAt) > new Date(existing.createdAt)) {
        subscriptionMap.set(data.businessId, data);
      }
    });
    
    const now = new Date();
    let updatedCount = 0;
    let activeCount = 0;
    let inactiveCount = 0;
    
    // Her salon için kontrol et ve güncelle
    for (const salonDoc of salonsSnapshot.docs) {
      const salonId = salonDoc.id;
      const subscription = subscriptionMap.get(salonId);
      
      let subscriptionActive = false;
      
      if (subscription && subscription.status === 'active') {
        const endDate = new Date(subscription.endDate);
        subscriptionActive = now <= endDate;
      }
      
      // Güncelle
      await updateDoc(doc(db, 'salons', salonId), {
        subscriptionActive,
        updatedAt: new Date().toISOString(),
      });
      
      updatedCount++;
      if (subscriptionActive) {
        activeCount++;
        console.log(`✅ ${salonDoc.data().name}: ACTIVE`);
      } else {
        inactiveCount++;
        console.log(`❌ ${salonDoc.data().name}: INACTIVE`);
      }
    }
    
    console.log('\n📊 Sync Summary:');
    console.log(`✅ Total salons: ${salonsSnapshot.size}`);
    console.log(`✅ Updated: ${updatedCount}`);
    console.log(`✅ Active subscriptions: ${activeCount}`);
    console.log(`❌ Inactive/No subscription: ${inactiveCount}`);
    
    return {
      success: true,
      total: salonsSnapshot.size,
      updated: updatedCount,
      active: activeCount,
      inactive: inactiveCount,
    };
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  }
}

// Window'a ekle (console'dan çağrılabilsin)
if (typeof window !== 'undefined') {
  (window as any).syncAllSalonSubscriptions = syncAllSalonSubscriptions;
  (window as any).makeAllSalonsActive = makeAllSalonsActive;
}
