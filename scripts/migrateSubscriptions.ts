/**
 * Subscription Migration Script
 * 
 * Bu script mevcut subscription dokümanlarını yeni formata taşır:
 * - Eski: Rastgele ID, businessId field'ı var
 * - Yeni: ID = businessId (her business'in 1 subscription'ı)
 * 
 * Kullanım:
 * 1. Firebase Admin SDK kurulu olmalı
 * 2. Service account key dosyası gerekli
 * 3. npm run migrate-subscriptions
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Firebase Admin SDK'yı başlat
// NOT: Service account key dosyasını .gitignore'a ekle!
const serviceAccount = require('../serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function migrateSubscriptions() {
  console.log('🚀 Starting subscription migration...\n');

  try {
    // Tüm subscription dokümanlarını al
    const subscriptionsRef = db.collection('subscriptions');
    const snapshot = await subscriptionsRef.get();

    console.log(`📊 Found ${snapshot.size} subscription documents\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const oldId = doc.id;
      const businessId = data.businessId;

      console.log(`Processing: ${oldId}`);
      console.log(`  Business ID: ${businessId}`);

      // Eğer ID zaten businessId ise, skip
      if (oldId === businessId) {
        console.log(`  ✅ Already migrated, skipping\n`);
        skippedCount++;
        continue;
      }

      try {
        // Yeni doküman oluştur (ID = businessId)
        await subscriptionsRef.doc(businessId).set(data);
        console.log(`  ✅ Created new document with ID: ${businessId}`);

        // Eski dokümanı sil
        await doc.ref.delete();
        console.log(`  🗑️  Deleted old document: ${oldId}\n`);

        migratedCount++;
      } catch (error) {
        console.error(`  ❌ Error migrating ${oldId}:`, error);
        errorCount++;
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`  ✅ Migrated: ${migratedCount}`);
    console.log(`  ⏭️  Skipped: ${skippedCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    console.log(`  📊 Total: ${snapshot.size}`);

    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with errors. Please check the logs.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Script'i çalıştır
migrateSubscriptions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
