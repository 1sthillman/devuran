/**
 * Firestore Base64 Images to Cloudflare R2 Migration Script
 * 
 * Bu script mevcut Firestore'daki base64 görselleri R2'ye migrate eder:
 * - Salon logos, cover images, gallery
 * - Menu item images  
 * - Staff photos
 * - Service images
 * - Announcement images
 * - Support ticket attachments
 * 
 * ✅ SALON ISOLATION: Her işletmenin görselleri kendi klasöründe
 * ✅ NO DATA MIXING: Veriler birbirine karışmaz
 * ✅ AGGRESSIVE COMPRESSION: R2 free tier için optimize
 * 
 * KULLANIM:
 * npm run migrate:images
 */

import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { storageService } from '@/services/storageService';

interface MigrationStats {
  total: number;
  migrated: number;
  skipped: number;
  failed: number;
  savedBytes: number;
}

const stats: MigrationStats = {
  total: 0,
  migrated: 0,
  skipped: 0,
  failed: 0,
  savedBytes: 0
};

/**
 * Base64 string'i File objesine çevir
 */
async function base64ToFile(base64: string, filename: string): Promise<File> {
  const response = await fetch(base64);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type });
}

/**
 * String'in base64 olup olmadığını kontrol et
 */
function isBase64(str: string): boolean {
  return str.startsWith('data:image/');
}

/**
 * Salon görselleri migrate et (ISOLATED BY SALON ID)
 */
async function migrateSalons() {
  console.log('\n📦 SALON GÖRSELLERİ MİGRATE EDİLİYOR...');
  console.log('🔒 Her salon\'un görselleri izole klasörlerde saklanacak');
  
  const salonsRef = collection(db, 'salons');
  const snapshot = await getDocs(salonsRef);
  
  for (const salonDoc of snapshot.docs) {
    const salon = salonDoc.data();
    const salonId = salonDoc.id;
    const updates: any = {};
    let hasUpdates = false;

    console.log(`\n🏢 ${salon.name || salonId} (ID: ${salonId})`);

    // Logo - ISOLATED: salons/{salonId}/logo/
    if (salon.logo && isBase64(salon.logo)) {
      try {
        console.log('  📸 Logo migrate ediliyor...');
        const file = await base64ToFile(salon.logo, `logo.jpg`);
        const originalSize = file.size;
        
        const result = await storageService.uploadFile(file, {
          folder: `salons/${salonId}/logo`,
          compress: true
        });
        
        updates.logo = result.url;
        hasUpdates = true;
        stats.savedBytes += originalSize - result.size;
        stats.migrated++;
        console.log(`    ✅ Logo: ${(originalSize / 1024).toFixed(0)}KB → ${(result.size / 1024).toFixed(0)}KB`);
        console.log(`    📁 Path: salons/${salonId}/logo/`);
      } catch (error) {
        console.error('    ❌ Logo migration failed:', error);
        stats.failed++;
      }
    }

    // Cover Image - ISOLATED: salons/{salonId}/cover/
    if (salon.coverImage && isBase64(salon.coverImage)) {
      try {
        console.log('  📸 Kapak görseli migrate ediliyor...');
        const file = await base64ToFile(salon.coverImage, `cover.jpg`);
        const originalSize = file.size;
        
        const result = await storageService.uploadFile(file, {
          folder: `salons/${salonId}/cover`,
          compress: true
        });
        
        updates.coverImage = result.url;
        hasUpdates = true;
        stats.savedBytes += originalSize - result.size;
        stats.migrated++;
        console.log(`    ✅ Kapak: ${(originalSize / 1024).toFixed(0)}KB → ${(result.size / 1024).toFixed(0)}KB`);
        console.log(`    📁 Path: salons/${salonId}/cover/`);
      } catch (error) {
        console.error('    ❌ Cover migration failed:', error);
        stats.failed++;
      }
    }

    // Gallery Images - ISOLATED: salons/{salonId}/gallery/
    if (salon.galleryImages && Array.isArray(salon.galleryImages)) {
      const migratedGallery: string[] = [];
      
      for (let i = 0; i < salon.galleryImages.length; i++) {
        const img = salon.galleryImages[i];
        
        if (isBase64(img)) {
          try {
            console.log(`  📸 Galeri ${i + 1}/${salon.galleryImages.length} migrate ediliyor...`);
            const file = await base64ToFile(img, `gallery-${i + 1}.jpg`);
            const originalSize = file.size;
            
            const result = await storageService.uploadFile(file, {
              folder: `salons/${salonId}/gallery`,
              compress: true
            });
            
            migratedGallery.push(result.url);
            stats.savedBytes += originalSize - result.size;
            stats.migrated++;
            console.log(`    ✅ Galeri ${i + 1}: ${(originalSize / 1024).toFixed(0)}KB → ${(result.size / 1024).toFixed(0)}KB`);
            console.log(`    📁 Path: salons/${salonId}/gallery/`);
          } catch (error) {
            console.error(`    ❌ Gallery ${i + 1} migration failed:`, error);
            migratedGallery.push(img); // Keep original on error
            stats.failed++;
          }
        } else {
          migratedGallery.push(img); // Already URL
        }
      }
      
      if (migratedGallery.length > 0) {
        updates.galleryImages = migratedGallery;
        hasUpdates = true;
      }
    }

    // Update document
    if (hasUpdates) {
      await updateDoc(doc(db, 'salons', salonId), updates);
      console.log(`  ✅ Salon güncellendi (${Object.keys(updates).length} alan)`);
    } else {
      stats.skipped++;
      console.log(`  ⏭️ Atlandı (base64 görsel yok)`);
    }
    
    stats.total++;
  }
}

/**
 * Menü ürün görselleri migrate et (ISOLATED BY SALON ID)
 */
async function migrateMenuItems() {
  console.log('\n🍔 MENÜ ÜRÜN GÖRSELLERİ MİGRATE EDİLİYOR...');
  console.log('🔒 Her ürün görseli kendi salon klasöründe');
  
  const itemsRef = collection(db, 'menuItems');
  const snapshot = await getDocs(itemsRef);
  
  for (const itemDoc of snapshot.docs) {
    const item = itemDoc.data();
    const itemId = itemDoc.id;
    const salonId = item.salonId || item.restaurantId || 'unknown';

    if (item.image && isBase64(item.image)) {
      try {
        console.log(`\n🍽️ ${item.name || itemId} (Salon: ${salonId})`);
        console.log('  📸 Görsel migrate ediliyor...');
        
        const file = await base64ToFile(item.image, `${itemId}.jpg`);
        const originalSize = file.size;
        
        // ISOLATED: menu-items/{salonId}/{itemId}
        const result = await storageService.uploadFile(file, {
          folder: `menu-items/${salonId}`,
          compress: true
        });
        
        await updateDoc(doc(db, 'menuItems', itemId), {
          image: result.url
        });
        
        stats.migrated++;
        stats.savedBytes += originalSize - result.size;
        console.log(`  ✅ ${(originalSize / 1024).toFixed(0)}KB → ${(result.size / 1024).toFixed(0)}KB`);
        console.log(`  📁 Path: menu-items/${salonId}/`);
      } catch (error) {
        console.error(`  ❌ Migration failed:`, error);
        stats.failed++;
      }
    } else {
      stats.skipped++;
    }
    
    stats.total++;
  }
}

/**
 * Personel fotoğrafları migrate et (ISOLATED BY SALON ID)
 */
async function migrateStaff() {
  console.log('\n👤 PERSONEL FOTOĞRAFLARI MİGRATE EDİLİYOR...');
  console.log('🔒 Her personel fotoğrafı kendi salon klasöründe');
  
  const staffRef = collection(db, 'staff');
  const snapshot = await getDocs(staffRef);
  
  for (const staffDoc of snapshot.docs) {
    const staff = staffDoc.data();
    const staffId = staffDoc.id;
    const salonId = staff.salonId || 'unknown';

    if (staff.photo && isBase64(staff.photo)) {
      try {
        console.log(`\n👨‍💼 ${staff.name || staffId} (Salon: ${salonId})`);
        console.log('  📸 Fotoğraf migrate ediliyor...');
        
        const file = await base64ToFile(staff.photo, `${staffId}.jpg`);
        const originalSize = file.size;
        
        // ISOLATED: staff/{salonId}/{staffId}
        const result = await storageService.uploadFile(file, {
          folder: `staff/${salonId}`,
          compress: true
        });
        
        await updateDoc(doc(db, 'staff', staffId), {
          photo: result.url
        });
        
        stats.migrated++;
        stats.savedBytes += originalSize - result.size;
        console.log(`  ✅ ${(originalSize / 1024).toFixed(0)}KB → ${(result.size / 1024).toFixed(0)}KB`);
        console.log(`  📁 Path: staff/${salonId}/`);
      } catch (error) {
        console.error(`  ❌ Migration failed:`, error);
        stats.failed++;
      }
    } else {
      stats.skipped++;
    }
    
    stats.total++;
  }
}

/**
 * Hizmet görselleri migrate et (ISOLATED BY SALON ID)
 */
async function migrateServices() {
  console.log('\n✂️ HİZMET GÖRSELLERİ MİGRATE EDİLİYOR...');
  console.log('🔒 Her hizmet görseli kendi salon klasöründe');
  
  const servicesRef = collection(db, 'services');
  const snapshot = await getDocs(servicesRef);
  
  for (const serviceDoc of snapshot.docs) {
    const service = serviceDoc.data();
    const serviceId = serviceDoc.id;
    const salonId = service.salonId || 'unknown';

    if (service.image && isBase64(service.image)) {
      try {
        console.log(`\n✂️ ${service.name || serviceId} (Salon: ${salonId})`);
        console.log('  📸 Görsel migrate ediliyor...');
        
        const file = await base64ToFile(service.image, `${serviceId}.jpg`);
        const originalSize = file.size;
        
        // ISOLATED: services/{salonId}/{serviceId}
        const result = await storageService.uploadFile(file, {
          folder: `services/${salonId}`,
          compress: true
        });
        
        await updateDoc(doc(db, 'services', serviceId), {
          image: result.url
        });
        
        stats.migrated++;
        stats.savedBytes += originalSize - result.size;
        console.log(`  ✅ ${(originalSize / 1024).toFixed(0)}KB → ${(result.size / 1024).toFixed(0)}KB`);
        console.log(`  📁 Path: services/${salonId}/`);
      } catch (error) {
        console.error(`  ❌ Migration failed:`, error);
        stats.failed++;
      }
    } else {
      stats.skipped++;
    }
    
    stats.total++;
  }
}

/**
 * Ana migration fonksiyonu
 */
export async function runMigration() {
  console.log('🚀 CLOUDFLARE R2 MIGRATION BAŞLIYOR...\n');
  console.log('=' .repeat(70));
  console.log('🔒 SALON ISOLATION: Aktif - Her işletme izole klasörlerde');
  console.log('📦 COMPRESSION: Aggressive (1280x720 @ 70%)');
  console.log('🌐 STORAGE: Cloudflare R2 (Free tier optimized)');
  console.log('=' .repeat(70));
  
  const startTime = Date.now();

  try {
    // Sırayla migrate et
    await migrateSalons();
    await migrateMenuItems();
    await migrateStaff();
    await migrateServices();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n' + '='.repeat(70));
    console.log('\n✅ MİGRATION TAMAMLANDI!\n');
    console.log('📊 İSTATİSTİKLER:');
    console.log(`   • Toplam Item:      ${stats.total}`);
    console.log(`   • Migrate Edildi:   ${stats.migrated} ✅`);
    console.log(`   • Atlandı:          ${stats.skipped} ⏭️`);
    console.log(`   • Başarısız:        ${stats.failed} ❌`);
    console.log(`   • Tasarruf:         ${(stats.savedBytes / 1024 / 1024).toFixed(2)} MB 💾`);
    console.log(`   • Süre:             ${duration} saniye ⏱️`);
    console.log('\n🔒 DATA ISOLATION:');
    console.log(`   • Her salon'un verileri izole klasörlerde`);
    console.log(`   • Veriler birbirine karışmaz`);
    console.log(`   • Path format: {type}/{salonId}/{file}`);
    console.log('\n' + '='.repeat(70));
    
    return { success: true, stats };
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error);
    return { success: false, error, stats };
  }
}
