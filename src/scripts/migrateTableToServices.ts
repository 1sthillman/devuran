/**
 * 🍽️ MASA REZERVASYON SİSTEMİ - MİGRASYON SCRIPT
 * 
 * Bu script mevcut masaları alıp otomatik olarak hizmet olarak ekler.
 * Böylece müşteriler randevu alma ekranından masa rezervasyonu yapabilir.
 * 
 * KULLANIM:
 * 1. Tarayıcı konsolunda bu scripti çalıştırın
 * 2. Veya işletme sahibi panelinde "Masaları Hizmete Dönüştür" butonuna tıklayın
 */

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, updateDoc, query, where } from 'firebase/firestore';
import { nanoid } from 'nanoid';

interface Table {
  id: string;
  restaurantId: string;
  tableNumber: string;
  capacity: number;
  status: string;
  qrCode: string;
}

interface Service {
  id: string;
  salonId: string;
  tableId: string;
  name: string;
  description: string;
  category: string;
  duration: number;
  price: number;
  gender: 'male' | 'female' | 'all';
  staffIds: string[];
  isActive: boolean;
  pricingRules: {
    basePrice: number;
    minGuests: number;
    maxGuests: number;
  };
}

export async function migrateTableToServices(restaurantId: string): Promise<{
  success: boolean;
  message: string;
  tablesProcessed: number;
  servicesCreated: number;
}> {
  try {
    console.log(`🍽️ ========== MIGRATION START ==========`);
    console.log(`🍽️ Restaurant ID: ${restaurantId}`);
    
    // 1. Restoranın tüm masalarını al
    const tablesQuery = query(
      collection(db, 'tables'),
      where('restaurantId', '==', restaurantId)
    );
    const tablesSnapshot = await getDocs(tablesQuery);
    const tables: Table[] = tablesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Table));
    
    console.log(`📊 Bulunan masa sayısı: ${tables.length}`);
    
    if (tables.length === 0) {
      console.warn('⚠️ Hiç masa bulunamadı!');
      return {
        success: false,
        message: 'Hiç masa bulunamadı. Lütfen önce masa ekleyin.',
        tablesProcessed: 0,
        servicesCreated: 0
      };
    }
    
    // 2. Restaurant bilgisini al
    console.log('📖 Restoran bilgisi alınıyor...');
    const restaurantDoc = await getDoc(doc(db, 'salons', restaurantId));
    if (!restaurantDoc.exists()) {
      console.error('❌ Restoran bulunamadı!');
      return {
        success: false,
        message: 'Restoran bulunamadı',
        tablesProcessed: 0,
        servicesCreated: 0
      };
    }
    
    const restaurantData = restaurantDoc.data();
    const currentServices = Array.isArray(restaurantData.services) ? restaurantData.services : [];
    console.log(`📋 Mevcut hizmet sayısı: ${currentServices.length}`);
    
    // 3. Her masa için service oluştur
    let servicesCreated = 0;
    const newServices: Service[] = [];
    
    for (const table of tables) {
      console.log(`\n🔍 Masa ${table.tableNumber} kontrol ediliyor...`);
      
      // Bu masa için zaten service var mı kontrol et
      const existingService = currentServices.find(
        (s: any) => s.tableId === table.id
      );
      
      if (existingService) {
        console.log(`⏭️  Masa ${table.tableNumber} zaten hizmet olarak mevcut (Service ID: ${existingService.id})`);
        continue;
      }
      
      // Yeni service oluştur
      const newService: Service = {
        id: nanoid(12),
        salonId: restaurantId,
        tableId: table.id,
        name: `Masa ${table.tableNumber}`,
        description: `${table.capacity} kişilik masa rezervasyonu`,
        category: 'restaurant',
        duration: 120, // 2 saat varsayılan
        price: 0, // Ücretsiz (isteğe göre değiştirilebilir)
        gender: 'all',
        staffIds: [],
        isActive: true,
        pricingRules: {
          basePrice: 0,
          minGuests: 1,
          maxGuests: table.capacity
        }
      };
      
      newServices.push(newService);
      servicesCreated++;
      console.log(`✅ Masa ${table.tableNumber} için hizmet oluşturuldu (Service ID: ${newService.id})`);
    }
    
    console.log(`\n📊 Oluşturulacak yeni hizmet sayısı: ${newServices.length}`);
    
    // 4. Tüm servisleri restaurant'a ekle
    if (newServices.length > 0) {
      const updatedServices = [...currentServices, ...newServices];
      console.log(`💾 ${updatedServices.length} hizmet Firestore'a kaydediliyor...`);
      
      await updateDoc(doc(db, 'salons', restaurantId), {
        services: updatedServices,
        updatedAt: new Date()
      });
      
      console.log(`🎉 ${servicesCreated} masa başarıyla hizmete dönüştürüldü!`);
      console.log(`🍽️ ========== MIGRATION SUCCESS ==========`);
    } else {
      console.log('ℹ️  Eklenecek yeni hizmet yok');
      console.log(`🍽️ ========== MIGRATION COMPLETE (No Changes) ==========`);
    }
    
    return {
      success: true,
      message: newServices.length > 0 
        ? `${servicesCreated} masa başarıyla hizmete eklendi` 
        : 'Tüm masalar zaten hizmet olarak mevcut',
      tablesProcessed: tables.length,
      servicesCreated
    };
    
  } catch (error) {
    console.error('❌ ========== MIGRATION ERROR ==========');
    console.error('Migration hatası:', error);
    console.error('Hata detayları:', {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack
    });
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Bilinmeyen hata',
      tablesProcessed: 0,
      servicesCreated: 0
    };
  }
}

/**
 * TÜM RESTORANLARIN MASALARINI MİGRE ET
 */
export async function migrateAllRestaurantTables(): Promise<{
  success: boolean;
  message: string;
  restaurantsProcessed: number;
  totalServicesCreated: number;
}> {
  try {
    console.log('🌍 TÜM RESTORANLAR İÇİN MİGRASYON BAŞLIYOR...');
    
    // Tüm restaurant kategorili salonları bul
    const salonsSnapshot = await getDocs(collection(db, 'salons'));
    const restaurants = salonsSnapshot.docs
      .filter(doc => {
        const data = doc.data();
        return data.category === 'restaurant' || data.type === 'restaurant';
      })
      .map(doc => ({
        id: doc.id,
        name: doc.data().name
      }));
    
    console.log(`📍 ${restaurants.length} restoran bulundu`);
    
    let totalServicesCreated = 0;
    let restaurantsProcessed = 0;
    
    for (const restaurant of restaurants) {
      console.log(`\n🍽️  ${restaurant.name} işleniyor...`);
      const result = await migrateTableToServices(restaurant.id);
      
      if (result.success) {
        totalServicesCreated += result.servicesCreated;
        restaurantsProcessed++;
      }
    }
    
    return {
      success: true,
      message: `${restaurantsProcessed} restoran işlendi, ${totalServicesCreated} masa hizmete dönüştürüldü`,
      restaurantsProcessed,
      totalServicesCreated
    };
    
  } catch (error) {
    console.error('❌ Toplu migration hatası:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Bilinmeyen hata',
      restaurantsProcessed: 0,
      totalServicesCreated: 0
    };
  }
}

// Tarayıcı konsolu için global fonksiyon
if (typeof window !== 'undefined') {
  (window as any).migrateTableToServices = migrateTableToServices;
  (window as any).migrateAllRestaurantTables = migrateAllRestaurantTables;
}
