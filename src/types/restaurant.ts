// Restoran Sistemi Tip Tanımları

export type TableStatus = 
  | 'empty' 
  | 'reserved'
  | 'occupied' 
  | 'ordering'
  | 'order_placed'
  | 'preparing' 
  | 'ready' 
  | 'waiter_picking'
  | 'delivered'
  | 'bill_requested' 
  | 'waiter_called'
  | 'coal_requested'
  | 'moving';

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'preparing' 
  | 'ready' 
  | 'picked_up'
  | 'delivered' 
  | 'completed'
  | 'cancelled';

export type OrderType = 'dine_in' | 'delivery';

export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card';

export type NotificationType = 
  | 'waiter_call' 
  | 'coal_request' 
  | 'bill_request'
  | 'order_ready'
  | 'order_picked'
  | 'new_order';

// Ürün İçeriği
export interface ProductIngredient {
  id: string;
  name: string;
  removable: boolean; // Çıkarılabilir mi?
  extraCharge?: number; // Ekstra ücret varsa
}

// Ekstra Ürün
export interface ProductExtra {
  id: string;
  name: string;
  price: number;
}

// Menü Kategorisi
export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  image?: string;
}

// Menü Ürünü
export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  image?: string; // Sıkıştırılmış base64
  ingredients: ProductIngredient[]; // İçindekiler
  availableExtras: ProductExtra[]; // Eklenebilir ekstralar
  preparationTime: number; // Dakika cinsinden
  isActive: boolean;
  isAvailable: boolean; // Stokta var mı?
  displayOrder: number;
}

// Sipariş Ürünü (Özelleştirmelerle)
export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  removedIngredients: string[]; // Çıkarılan malzemeler
  addedExtras: { id: string; name: string; price: number }[]; // Eklenen ekstralar
  notes?: string; // Özel notlar
  totalPrice: number;
  preparationTime?: number; // Dakika cinsinden (opsiyonel geriye dönük uyumluluk için)
}

// Masa
export interface Table {
  id: string;
  restaurantId: string;
  tableNumber: string;
  qrCode: string;
  capacity: number;
  status: TableStatus;
  area?: string; // Bölge/Alan (Bahçe, İç Mekan, VIP, vb.)
  currentOrderId?: string;
  lastActivityAt?: string;
  position?: { x: number; y: number }; // Sürükle-bırak için konum
}

// Masa Rezervasyonu
export interface TableReservation {
  id: string;
  restaurantId: string;
  tableId: string;
  tableName: string;
  customerName: string;
  customerPhone: string;
  guestCount: number;
  reservationDate: string;
  reservationTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  createdAt: string;
  confirmedAt?: string;
}

// Sipariş
export interface Order {
  id: string;
  restaurantId: string;
  orderNumber: string;
  type: OrderType;
  tableId?: string; // Masa siparişi için
  tableName?: string;
  deliveryAddress?: string; // Paket servis için
  customerPhone?: string;
  customerName?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: OrderStatus;
  notes?: string;
  createdAt: string;
  confirmedAt?: string;
  preparingAt?: string;
  readyAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  paymentMethod?: PaymentMethod;
  paidAt?: string;
  paidAmount?: number;
  change?: number;
}

// Bildirim
export interface RestaurantNotification {
  id: string;
  restaurantId: string;
  type: NotificationType;
  tableId?: string;
  tableName?: string;
  orderId?: string;
  message: string;
  soundUrl?: string; // Bildirim sesi URL'i
  isRead: boolean;
  respondedAt?: string;
  createdAt: string;
}

// Restoran Ayarları
export interface RestaurantSettings {
  restaurantId: string;
  deliveryEnabled: boolean; // Eve servis açık mı?
  deliveryMinAmount?: number; // Minimum sipariş tutarı
  deliveryFee?: number; // Teslimat ücreti
  deliveryRadius?: number; // Teslimat yarıçapı (km)
  taxRate: number; // KDV oranı (örn: 0.10 = %10)
  preparationTime: number; // Ortalama hazırlık süresi (dakika)
  tableCount: number; // Masa sayısı (abonelik limiti)
  menuItemLimit: number; // Ürün limiti (abonelik limiti)
  autoConfirmOrders: boolean; // Siparişleri otomatik onayla
  soundEnabled: boolean; // Bildirim sesi açık mı?
  location?: {
    lat: number;
    lng: number;
    address: string;
  }; // İşletme konumu (zorunlu)
  businessHours?: {
    [key: string]: { open: string; close: string; closed?: boolean };
  }; // Çalışma saatleri
}

// Restoran İstatistikleri
export interface RestaurantStats {
  todayOrders: number;
  todayRevenue: number;
  activeOrders: number;
  activeTables: number;
  averageOrderTime: number; // Dakika
  popularItems: {
    itemId: string;
    name: string;
    orderCount: number;
  }[];
}

// Masa Taşıma İsteği
export interface TableTransfer {
  fromTableId: string;
  toTableId: string;
  orderId: string;
  requestedBy: string; // Garson ID
  requestedAt: string;
}

// Panel Rolleri
export type RestaurantRole = 'owner' | 'kitchen' | 'waiter' | 'cashier';

export interface RestaurantStaff {
  id: string;
  restaurantId: string;
  name: string;
  phone: string;
  role: RestaurantRole;
  pin?: string; // 4 haneli PIN kodu
  isActive: boolean;
  createdAt: string;
}
