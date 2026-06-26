import { create } from 'zustand';
import type {
  MenuItem,
  MenuCategory,
  Table,
  Order,
  OrderItem,
  RestaurantNotification,
  RestaurantSettings,
  TableStatus,
} from '@/types/restaurant';

interface CartItem extends OrderItem {
  menuItem: MenuItem;
}

interface RestaurantStore {
  // Müşteri - Sepet
  cart: CartItem[];
  currentTable: Table | null;
  
  addToCart: (item: MenuItem, customization: { removedIngredients: string[]; addedExtras: any[]; notes?: string }) => void;
  removeFromCart: (itemId: string) => void;
  updateCartItemQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  
  setCurrentTable: (table: Table | null) => void;
  
  // İşletme - Menü
  categories: MenuCategory[];
  menuItems: MenuItem[];
  setCategories: (categories: MenuCategory[]) => void;
  setMenuItems: (items: MenuItem[]) => void;
  
  // İşletme - Masalar
  tables: Table[];
  setTables: (tables: Table[]) => void;
  updateTableStatus: (tableId: string, status: TableStatus) => void;
  
  // İşletme - Siparişler
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  updateOrderInStore: (orderId: string, updates: Partial<Order>) => void;
  
  // İşletme - Bildirimler
  notifications: RestaurantNotification[];
  setNotifications: (notifications: RestaurantNotification[]) => void;
  removeNotification: (notificationId: string) => void;
  
  // İşletme - Ayarlar
  settings: RestaurantSettings | null;
  setSettings: (settings: RestaurantSettings | null) => void;
  
  // UI State
  selectedPanel: 'kitchen' | 'waiter' | 'cashier';
  setSelectedPanel: (panel: 'kitchen' | 'waiter' | 'cashier') => void;
}

export const useRestaurantStore = create<RestaurantStore>((set, get) => ({
  // Initial State
  cart: [],
  currentTable: null,
  categories: [],
  menuItems: [],
  tables: [],
  orders: [],
  notifications: [],
  settings: null,
  selectedPanel: 'kitchen',
  
  // Cart Actions
  addToCart: (menuItem, customization) => {
    const { cart } = get();
    const { removedIngredients, addedExtras, notes } = customization;
    
    // Fiyat hesaplama
    let itemPrice = menuItem.price;
    addedExtras.forEach(extra => {
      itemPrice += extra.price;
    });
    
    const cartItem: CartItem = {
      id: `${menuItem.id}-${Date.now()}`,
      menuItemId: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: 1,
      removedIngredients,
      addedExtras,
      notes,
      totalPrice: itemPrice,
      preparationTime: menuItem.preparationTime, // Hazırlık süresini ekle
      menuItem,
    };
    
    set({ cart: [...cart, cartItem] });
  },
  
  removeFromCart: (itemId) => {
    set(state => ({
      cart: state.cart.filter(item => item.id !== itemId),
    }));
  },
  
  updateCartItemQuantity: (itemId, quantity) => {
    set(state => ({
      cart: state.cart.map(item => {
        if (item.id === itemId) {
          const basePrice = item.price + item.addedExtras.reduce((sum, e) => sum + e.price, 0);
          return {
            ...item,
            quantity,
            totalPrice: basePrice * quantity,
          };
        }
        return item;
      }),
    }));
  },
  
  clearCart: () => set({ cart: [] }),
  
  getCartTotal: () => {
    const { cart } = get();
    return cart.reduce((sum, item) => sum + item.totalPrice, 0);
  },
  
  setCurrentTable: (table) => set({ currentTable: table }),
  
  // Menu Actions
  setCategories: (categories) => set({ categories }),
  setMenuItems: (items) => set({ menuItems: items }),
  
  // Table Actions
  setTables: (tables) => set({ tables }),
  updateTableStatus: (tableId, status) => {
    set(state => ({
      tables: state.tables.map(table =>
        table.id === tableId ? { ...table, status } : table
      ),
    }));
  },
  
  // Order Actions
  setOrders: (orders) => set({ orders }),
  updateOrderInStore: (orderId, updates) => {
    set(state => ({
      orders: state.orders.map(order =>
        order.id === orderId ? { ...order, ...updates } : order
      ),
    }));
  },
  
  // Notification Actions
  setNotifications: (notifications) => set({ notifications }),
  removeNotification: (notificationId) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== notificationId),
    }));
  },
  
  // Settings Actions
  setSettings: (settings) => set({ settings }),
  
  // UI Actions
  setSelectedPanel: (panel) => set({ selectedPanel: panel }),
}));
