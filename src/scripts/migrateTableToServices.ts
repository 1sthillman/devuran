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
    console.log(`🍽️ Masa rezervasyon sistemi başlatılıyor: ${restaurantId}`);
    
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
    
    if (tables.length === 0) {
      return {
        success: false,
        message: 'Hiç masa bulunamadı',
        tablesProcessed: 0,
        servicesCreated: 0
      };
    }
    
    console.log(`📊 ${tables.length} masa bulundu`);
    
    // 2. Restaurant bilgisini al
    const restaurantDoc = await getDoc(doc(db, 'salons', restaurantId));
    if (!restaurantDoc.exists()) {
      return {
        success: false,
        message: 'Restoran bulunamadı',
        tablesProcessed: 0,
        servicesCreated: 0
      };
    }
    
    const restaurantData = restaurantDoc.data();
    const currentServices = restaurantData.services || [];
    
    // 3. Her masa için service oluştur
    let servicesCreated = 0;
    const newServices: Service[] = [];
    
    for (const table of tables) {
      // Bu masa için zaten service var mı kontrol et
      const existingService = currentServices.find(
        (s: any) => s.tableId === table.id
      );
      
      if (existingService) {
        console.log(`⏭️  Masa ${table.tableNumber} zaten hizmet olarak mevcut`);
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
        price: 0, // Ücretsiz (isteğe bağlı değiştirilebilir)
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
      console.log(`✅ Masa ${table.tableNumber} için hizmet oluşturuldu`);
    }
    
    // 4. Tüm servisleri restaurant'a ekle
    if (newServices.length > 0) {
      const updatedServices = [...currentServices, ...newServices];
      await updateDoc(doc(db, 'salons', restaurantId), {
        services: updatedServices,
        updatedAt: new Date()
      });
      
      console.log(`🎉 ${servicesCreated} masa hizmet olarak eklendi!`);
    }
    
    return {
      success: true,
      message: `${servicesCreated} masa başarıyla hizmet olarak eklendi`,
      tablesProcessed: tables.length,
      servicesCreated
    };
    
  } catch (error) {
    console.error('❌ Migration hatası:', error);
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
