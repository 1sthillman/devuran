import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { nanoid } from 'nanoid';
import type {
  MenuItem,
  MenuCategory,
  Table,
  Order,
  OrderItem,
  RestaurantNotification,
  RestaurantSettings,
  RestaurantStats,
  TableStatus,
  OrderStatus,
  NotificationType,
  RestaurantStaff,
} from '@/types/restaurant';

// Koleksiyonlar
const MENU_CATEGORIES = 'menuCategories';
const MENU_ITEMS = 'menuItems';
const TABLES = 'tables';
const ORDERS = 'orders';
const NOTIFICATIONS = 'restaurantNotifications';
const SETTINGS = 'restaurantSettings';
const STAFF = 'restaurantStaff';

class RestaurantService {
  // ==================== MENU CATEGORY ====================
  
  async createCategory(restaurantId: string, category: Omit<MenuCategory, 'id' | 'restaurantId'>): Promise<string> {
    const docRef = await addDoc(collection(db, MENU_CATEGORIES), {
      ...category,
      restaurantId,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }

  async updateCategory(categoryId: string, updates: Partial<MenuCategory>): Promise<void> {
    await updateDoc(doc(db, MENU_CATEGORIES, categoryId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  async deleteCategory(categoryId: string): Promise<void> {
    await deleteDoc(doc(db, MENU_CATEGORIES, categoryId));
  }

  async getCategories(restaurantId: string): Promise<MenuCategory[]> {
    const q = query(
      collection(db, MENU_CATEGORIES),
      where('restaurantId', '==', restaurantId)
      // orderBy kaldırıldı - index building bitene kadar
    );
    const snapshot = await getDocs(q);
    const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuCategory));
    return categories.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  subscribeToCategories(restaurantId: string, callback: (categories: MenuCategory[]) => void) {
    const q = query(
      collection(db, MENU_CATEGORIES),
      where('restaurantId', '==', restaurantId)
      // orderBy kaldırıldı - index building bitene kadar
    );
    
    return onSnapshot(q, 
      snapshot => {
        const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuCategory));
        const sorted = categories.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        callback(sorted);
      },
      error => {
        console.error('Categories snapshot error:', error);
        // Fallback - empty array
        callback([]);
      }
    );
  }

  // ==================== MENU ITEMS ====================
  
  async createMenuItem(restaurantId: string, item: Omit<MenuItem, 'id' | 'restaurantId'>): Promise<string> {
    const docRef = await addDoc(collection(db, MENU_ITEMS), {
      ...item,
      restaurantId,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }

  async updateMenuItem(itemId: string, updates: Partial<MenuItem>): Promise<void> {
    await updateDoc(doc(db, MENU_ITEMS, itemId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  async deleteMenuItem(itemId: string): Promise<void> {
    await deleteDoc(doc(db, MENU_ITEMS, itemId));
  }

  async getMenuItems(restaurantId: string): Promise<MenuItem[]> {
    const q = query(
      collection(db, MENU_ITEMS),
      where('restaurantId', '==', restaurantId)
      // orderBy kaldırıldı - index building bitene kadar
    );
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
    return items.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  async getMenuItemsByCategory(restaurantId: string, categoryId: string): Promise<MenuItem[]> {
    const q = query(
      collection(db, MENU_ITEMS),
      where('restaurantId', '==', restaurantId),
      where('categoryId', '==', categoryId)
      // orderBy kaldırıldı - index building bitene kadar
    );
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
    return items.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  subscribeToMenuItems(restaurantId: string, callback: (items: MenuItem[]) => void) {
    const q = query(
      collection(db, MENU_ITEMS),
      where('restaurantId', '==', restaurantId)
      // orderBy kaldırıldı - index building bitene kadar
    );
    
    return onSnapshot(q,
      snapshot => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
        const sorted = items.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        callback(sorted);
      },
      error => {
        console.error('MenuItems snapshot error:', error);
        // Fallback - empty array
        callback([]);
      }
    );
  }

  // ==================== TABLES ====================
  
  async createTable(restaurantId: string, table: Omit<Table, 'id' | 'restaurantId' | 'qrCode'>, reservationPrice: number = 0, reservationDuration: number = 60): Promise<string> {
    const qrCode = nanoid(10);
    
    // Masa oluştur
    const docRef = await addDoc(collection(db, TABLES), {
      ...table,
      restaurantId,
      qrCode,
      status: 'empty' as TableStatus,
      createdAt: serverTimestamp(),
    });
    
    const tableId = docRef.id;
    
    // 🍽️ Otomatik olarak hizmet olarak da ekle (Rezervasyon için)
    try {
      const { salonsService } = await import('./firebaseService');
      
      // Restaurant bilgisini al
      const restaurantDoc = await getDoc(doc(db, 'salons', restaurantId));
      if (restaurantDoc.exists()) {
        const restaurant = restaurantDoc.data();
        const currentServices = restaurant.services || [];
        
        // Bu masa için zaten service var mı kontrol et
        const existingService = currentServices.find(
          (s: any) => s.tableId === tableId
        );
        
        if (!existingService) {
          // Yeni service oluştur
          const newService = {
            id: nanoid(12),
            salonId: restaurantId,
            tableId: tableId, // Masayla ilişkilendir
            name: `Masa ${table.tableNumber}`,
            description: `${table.capacity} kişilik masa rezervasyonu`,
            category: 'restaurant', // Restoran kategorisi
            duration: reservationDuration, // 🔥 Parametre olarak gelen duration
            price: reservationPrice, // 🔥 Parametre olarak gelen fiyat
            gender: 'all' as const,
            staffIds: [], // Masa için personel ataması yok
            isActive: true,
            pricingRules: {
              basePrice: reservationPrice, // 🔥 Fiyatı da güncelle
              minGuests: 1,
              maxGuests: table.capacity,
            }
          };
          
          // Service'i salon'a ekle
          await salonsService.update(restaurantId, {
            services: [...currentServices, newService]
          });
          
          console.log(`✅ Masa ${table.tableNumber} için hizmet oluşturuldu (${reservationDuration}dk, ${reservationPrice}₺)`);
        }
      }
    } catch (error) {
      console.warn('⚠️ Masa için hizmet oluşturulamadı:', error);
      // Hata olsa da masa oluşturuldu, devam et
    }
    
    return tableId;
  }

  async updateTable(tableId: string, updates: Partial<Table>): Promise<void> {
    await updateDoc(doc(db, TABLES, tableId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    
    // 🍽️ Eğer masa numarası veya kapasitesi değiştiyse, service'i de güncelle
    if (updates.tableNumber || updates.capacity) {
      try {
        // Önce tablonun restaurant ID'sini al
        const tableDoc = await getDoc(doc(db, TABLES, tableId));
        if (tableDoc.exists()) {
          const tableData = tableDoc.data();
          const restaurantId = tableData.restaurantId;
          
          const { salonsService } = await import('./firebaseService');
          const restaurantDoc = await getDoc(doc(db, 'salons', restaurantId));
          
          if (restaurantDoc.exists()) {
            const restaurant = restaurantDoc.data();
            const currentServices = restaurant.services || [];
            
            // Bu masa için olan service'i bul ve güncelle
            const updatedServices = currentServices.map((s: any) => {
              if (s.tableId === tableId) {
                return {
                  ...s,
                  name: updates.tableNumber ? `Masa ${updates.tableNumber}` : s.name,
                  description: updates.capacity 
                    ? `${updates.capacity} kişilik masa rezervasyonu` 
                    : s.description,
                  pricingRules: updates.capacity ? {
                    ...s.pricingRules,
                    maxGuests: updates.capacity
                  } : s.pricingRules
                };
              }
              return s;
            });
            
            await salonsService.update(restaurantId, {
              services: updatedServices
            });
            
            console.log(`✅ Masa ${tableId} için hizmet güncellendi`);
          }
        }
      } catch (error) {
        console.warn('⚠️ Masa için hizmet güncellenemedi:', error);
      }
    }
  }

  async deleteTable(tableId: string, restaurantId?: string): Promise<void> {
    // Masayı sil
    await deleteDoc(doc(db, TABLES, tableId));
    
    // 🍽️ İlgili service'i de sil
    if (restaurantId) {
      try {
        const { salonsService } = await import('./firebaseService');
        const restaurantDoc = await getDoc(doc(db, 'salons', restaurantId));
        
        if (restaurantDoc.exists()) {
          const restaurant = restaurantDoc.data();
          const currentServices = restaurant.services || [];
          
          // Bu masa için olan service'i filtrele
          const updatedServices = currentServices.filter(
            (s: any) => s.tableId !== tableId
          );
          
          if (updatedServices.length !== currentServices.length) {
            await salonsService.update(restaurantId, {
              services: updatedServices
            });
            console.log(`✅ Masa ${tableId} için hizmet silindi`);
          }
        }
      } catch (error) {
        console.warn('⚠️ Masa için hizmet silinemedi:', error);
      }
    }
  }

  async getTables(restaurantId: string): Promise<Table[]> {
    const q = query(
      collection(db, TABLES),
      where('restaurantId', '==', restaurantId),
      orderBy('tableNumber', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Table));
  }

  async getTableByQR(qrCode: string): Promise<Table | null> {
    const q = query(collection(db, TABLES), where('qrCode', '==', qrCode));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Table;
  }

  subscribeToTables(restaurantId: string, callback: (tables: Table[]) => void) {
    const q = query(
      collection(db, TABLES),
      where('restaurantId', '==', restaurantId),
      orderBy('tableNumber', 'asc')
    );
    return onSnapshot(q, snapshot => {
      const tables = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Table));
      callback(tables);
    });
  }

  async transferTable(fromTableId: string, toTableId: string, orderId: string): Promise<void> {
    const batch = writeBatch(db);
    
    // Eski masayı temizle
    batch.update(doc(db, TABLES, fromTableId), {
      status: 'empty',
      currentOrderId: null,
      lastActivityAt: serverTimestamp(),
    });
    
    // Yeni masaya taşı
    batch.update(doc(db, TABLES, toTableId), {
      status: 'occupied',
      currentOrderId: orderId,
      lastActivityAt: serverTimestamp(),
    });
    
    // Siparişi güncelle
    batch.update(doc(db, ORDERS, orderId), {
      tableId: toTableId,
      updatedAt: serverTimestamp(),
    });
    
    await batch.commit();
  }

  // ==================== ORDERS ====================
  
  async createOrder(restaurantId: string, order: Omit<Order, 'id' | 'restaurantId' | 'orderNumber' | 'createdAt'>): Promise<string> {
    const orderNumber = `#${Date.now().toString().slice(-6)}`;
    const docRef = await addDoc(collection(db, ORDERS), {
      ...order,
      restaurantId,
      orderNumber,
      status: 'pending' as OrderStatus,
      createdAt: serverTimestamp(),
    });
    
    // Masa durumunu güncelle
    if (order.tableId) {
      await this.updateTable(order.tableId, {
        status: 'ordering',
        currentOrderId: docRef.id,
        lastActivityAt: new Date().toISOString(),
      });
    }
    
    return docRef.id;
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    const updates: any = {
      status,
      updatedAt: serverTimestamp(),
    };
    
    if (status === 'confirmed') updates.confirmedAt = serverTimestamp();
    if (status === 'preparing') updates.preparingAt = serverTimestamp();
    if (status === 'ready') updates.readyAt = serverTimestamp();
    if (status === 'delivered') updates.deliveredAt = serverTimestamp();
    if (status === 'completed') updates.completedAt = serverTimestamp();
    
    await updateDoc(doc(db, ORDERS, orderId), updates);
  }

  async updateOrder(orderId: string, updates: Partial<Order>): Promise<void> {
    await updateDoc(doc(db, ORDERS, orderId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  async completePayment(orderId: string, paymentMethod: string, paidAmount: number, change: number): Promise<void> {
    // Siparişi completed yap
    await updateDoc(doc(db, ORDERS, orderId), {
      status: 'completed',
      paymentMethod,
      paidAmount,
      change,
      paidAt: serverTimestamp(),
      completedAt: serverTimestamp(),
    });
    
    // Masayı temizle - SADECE bu masanın başka aktif siparişi yoksa
    const orderDoc = await getDoc(doc(db, ORDERS, orderId));
    const order = orderDoc.data() as Order;
    
    if (order.tableId) {
      // Bu masanın diğer aktif siparişlerini kontrol et
      const q = query(
        collection(db, ORDERS),
        where('tableId', '==', order.tableId),
        where('status', 'in', ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'order_placed'])
      );
      const snapshot = await getDocs(q);
      
      // Başka aktif sipariş yoksa masayı temizle
      if (snapshot.empty) {
        console.log('✅ Masa temizleniyor - tüm siparişler tamamlandı:', order.tableId);
        await this.updateTable(order.tableId, {
          status: 'empty',
          currentOrderId: null,
        });
      } else {
        console.log('⚠️ Masada hala aktif sipariş var:', snapshot.size, 'sipariş');
      }
    }
  }

  async getOrders(restaurantId: string, filters?: { status?: OrderStatus; type?: string }): Promise<Order[]> {
    let q = query(
      collection(db, ORDERS),
      where('restaurantId', '==', restaurantId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    let orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    
    if (filters?.status) {
      orders = orders.filter(o => o.status === filters.status);
    }
    if (filters?.type) {
      orders = orders.filter(o => o.type === filters.type);
    }
    
    return orders;
  }

  subscribeToOrders(restaurantId: string, callback: (orders: Order[]) => void) {
    const q = query(
      collection(db, ORDERS),
      where('restaurantId', '==', restaurantId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, snapshot => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      callback(orders);
    });
  }

  subscribeToActiveOrders(restaurantId: string, callback: (orders: Order[]) => void) {
    const q = query(
      collection(db, ORDERS),
      where('restaurantId', '==', restaurantId),
      where('status', 'in', ['pending', 'confirmed', 'preparing', 'ready', 'delivered'])
    );
    return onSnapshot(q, snapshot => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      callback(orders);
    });
  }

  // ==================== NOTIFICATIONS ====================
  
  async createNotification(
    restaurantId: string,
    type: NotificationType,
    message: string,
    tableId?: string,
    tableName?: string,
    orderId?: string,
    soundUrl?: string
  ): Promise<string> {
    // ✅ FIX: Firebase undefined değerleri kabul etmez - sadece tanımlı alanları ekle
    const notificationData: any = {
      restaurantId,
      type,
      message,
      isRead: false,
      createdAt: serverTimestamp(),
    };
    
    // Optional alanları sadece tanımlıysa ekle
    if (tableId !== undefined) notificationData.tableId = tableId;
    if (tableName !== undefined) notificationData.tableName = tableName;
    if (orderId !== undefined) notificationData.orderId = orderId;
    if (soundUrl !== undefined) notificationData.soundUrl = soundUrl;
    
    const docRef = await addDoc(collection(db, NOTIFICATIONS), notificationData);
    
    // Masa durumunu güncelle
    if (tableId) {
      let status: TableStatus = 'occupied';
      if (type === 'waiter_call') status = 'waiter_called';
      if (type === 'coal_request') status = 'coal_requested';
      if (type === 'bill_request') status = 'bill_requested';
      
      await this.updateTable(tableId, { status });
    }
    
    return docRef.id;
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await updateDoc(doc(db, NOTIFICATIONS, notificationId), {
      isRead: true,
      respondedAt: serverTimestamp(),
    });
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await deleteDoc(doc(db, NOTIFICATIONS, notificationId));
  }

  async getUnreadNotifications(restaurantId: string): Promise<RestaurantNotification[]> {
    const q = query(
      collection(db, NOTIFICATIONS),
      where('restaurantId', '==', restaurantId),
      where('isRead', '==', false),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RestaurantNotification));
  }

  subscribeToNotifications(restaurantId: string, callback: (notifications: RestaurantNotification[]) => void) {
    const q = query(
      collection(db, NOTIFICATIONS),
      where('restaurantId', '==', restaurantId)
    );
    return onSnapshot(q, snapshot => {
      // Client-side sorting
      const notifications = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as RestaurantNotification))
        .sort((a, b) => {
          // @ts-ignore - Firestore Timestamp type check
          const aTime = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0;
          // @ts-ignore - Firestore Timestamp type check  
          const bTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0;
          return bTime - aTime;
        });
      callback(notifications);
    });
  }

  // ==================== SETTINGS ====================
  
  async getSettings(restaurantId: string): Promise<RestaurantSettings | null> {
    const docRef = doc(db, SETTINGS, restaurantId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { restaurantId, ...snapshot.data() } as RestaurantSettings;
  }

  async updateSettings(restaurantId: string, settings: Partial<RestaurantSettings>): Promise<void> {
    const docRef = doc(db, SETTINGS, restaurantId);
    await setDoc(docRef, {
      ...settings,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }

  async initializeSettings(restaurantId: string): Promise<void> {
    const settings: Omit<RestaurantSettings, 'restaurantId'> = {
      deliveryEnabled: false,
      taxRate: 0.10,
      preparationTime: 30,
      tableCount: 10,
      menuItemLimit: 50,
      autoConfirmOrders: false,
      soundEnabled: true,
    };
    const docRef = doc(db, SETTINGS, restaurantId);
    await setDoc(docRef, { ...settings, restaurantId }, { merge: true });
  }

  // ==================== STAFF ====================
  
  async createStaff(restaurantId: string, staff: Omit<RestaurantStaff, 'id' | 'restaurantId' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, STAFF), {
      ...staff,
      restaurantId,
      isActive: true,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }

  async getStaff(restaurantId: string): Promise<RestaurantStaff[]> {
    const q = query(
      collection(db, STAFF),
      where('restaurantId', '==', restaurantId),
      where('isActive', '==', true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RestaurantStaff));
  }

  // ==================== STATS ====================
  
  async getStats(restaurantId: string): Promise<RestaurantStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const orders = await this.getOrders(restaurantId);
    const todayOrders = orders.filter(o => new Date(o.createdAt) >= today);
    const activeOrders = orders.filter(o => 
      ['pending', 'confirmed', 'preparing', 'ready', 'delivered'].includes(o.status)
    );
    
    const tables = await this.getTables(restaurantId);
    const activeTables = tables.filter(t => t.status !== 'empty').length;
    
    const todayRevenue = todayOrders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + o.total, 0);
    
    // Popüler ürünler
    const itemCounts: Record<string, { name: string; count: number }> = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!itemCounts[item.menuItemId]) {
          itemCounts[item.menuItemId] = { name: item.name, count: 0 };
        }
        itemCounts[item.menuItemId].count += item.quantity;
      });
    });
    
    const popularItems = Object.entries(itemCounts)
      .map(([itemId, data]) => ({
        itemId,
        name: data.name,
        orderCount: data.count,
      }))
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 5);
    
    return {
      todayOrders: todayOrders.length,
      todayRevenue,
      activeOrders: activeOrders.length,
      activeTables,
      averageOrderTime: 25,
      popularItems,
    };
  }

  /**
   * Abonelik satın alındığında otomatik masa oluştur
   */
  async createTablesForSubscription(restaurantId: string, tableCount: number): Promise<void> {
    try {
      console.log(`🍽️ Creating ${tableCount} tables for restaurant ${restaurantId}`);
      
      // Mevcut masaları kontrol et
      const existingTables = await this.getTables(restaurantId);
      const existingCount = existingTables.length;
      
      if (existingCount >= tableCount) {
        console.log(`✅ Restaurant already has ${existingCount} tables (required: ${tableCount})`);
        return;
      }
      
      // Eksik masa sayısını hesapla
      const tablesToCreate = tableCount - existingCount;
      console.log(`📝 Creating ${tablesToCreate} additional tables...`);
      
      // Masaları toplu olarak oluştur
      const promises: Promise<string>[] = [];
      for (let i = 0; i < tablesToCreate; i++) {
        const tableNumber = (existingCount + i + 1).toString();
        promises.push(
          this.createTable(restaurantId, {
            tableNumber,
            capacity: 4, // Varsayılan kapasite
            status: 'empty',
          })
        );
      }
      
      await Promise.all(promises);
      console.log(`✅ Successfully created ${tablesToCreate} tables`);
    } catch (error) {
      console.error('❌ Error creating tables for subscription:', error);
      throw error;
    }
  }
}

export const restaurantService = new RestaurantService();
