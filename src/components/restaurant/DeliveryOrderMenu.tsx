import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Plus, Minus, X, MapPin, Phone, User, Home } from 'lucide-react';
import { useRestaurantStore } from '@/store/restaurantStore';
import { restaurantService } from '@/services/restaurantService';
import { soundService } from '@/services/soundService';
import type { MenuItem, MenuCategory, RestaurantSettings } from '@/types/restaurant';
import { cn } from '@/lib/utils';

interface Props {
  restaurantId: string;
}

export function DeliveryOrderMenu({ restaurantId }: Props) {
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [addedExtras, setAddedExtras] = useState<any[]>([]);
  const [itemNotes, setItemNotes] = useState('');
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);

  // Delivery form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  const {
    cart,
    categories,
    menuItems,
    setCategories,
    setMenuItems,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    getCartTotal,
  } = useRestaurantStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cats, items, sett] = await Promise.all([
        restaurantService.getCategories(restaurantId),
        restaurantService.getMenuItems(restaurantId),
        restaurantService.getSettings(restaurantId),
      ]);

      setCategories(cats.filter(c => c.isActive));
      setMenuItems(items.filter(i => i.isActive && i.isAvailable));
      setSettings(sett);
      
      if (cats.length > 0) {
        setSelectedCategory(cats[0].id);
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
    setRemovedIngredients([]);
    setAddedExtras([]);
    setItemNotes('');
  };

  const toggleIngredient = (ingredientId: string) => {
    setRemovedIngredients(prev =>
      prev.includes(ingredientId)
        ? prev.filter(id => id !== ingredientId)
        : [...prev, ingredientId]
    );
  };

  const toggleExtra = (extra: any) => {
    setAddedExtras(prev =>
      prev.find(e => e.id === extra.id)
        ? prev.filter(e => e.id !== extra.id)
        : [...prev, extra]
    );
  };

  const handleAddToCart = () => {
    if (!selectedItem) return;
    
    addToCart(selectedItem, {
      removedIngredients,
      addedExtras,
      notes: itemNotes,
    });
    
    soundService.play('success');
    setSelectedItem(null);
    setRemovedIngredients([]);
    setAddedExtras([]);
    setItemNotes('');
  };

  const handleProceedToCheckout = () => {
    if (cart.length === 0) return;
    setShowCart(false);
    setShowCheckout(true);
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    
    if (!customerName || !customerPhone || !deliveryAddress) {
      alert('Lütfen tüm bilgileri doldurun!');
      return;
    }

    // Minimum tutar kontrolü
    const subtotal = getCartTotal();
    if (settings?.deliveryMinAmount && subtotal < settings.deliveryMinAmount) {
      alert(`Minimum sipariş tutarı ${settings.deliveryMinAmount}₺`);
      return;
    }

    try {
      const deliveryFee = settings?.deliveryFee || 0;
      const tax = subtotal * (settings?.taxRate || 0.10);
      const total = subtotal + tax + deliveryFee;

      await restaurantService.createOrder(restaurantId, {
        type: 'delivery',
        customerName,
        customerPhone,
        deliveryAddress,
        items: cart,
        subtotal,
        tax,
        total,
        status: 'pending',
        notes: orderNotes,
      });

      soundService.play('success');
      clearCart();
      setShowCheckout(false);
      setCustomerName('');
      setCustomerPhone('');
      setDeliveryAddress('');
      setOrderNotes('');
      
      alert('Siparişiniz alındı! En kısa sürede hazırlanacak.');
    } catch (error) {
      console.error('Sipariş hatası:', error);
      alert('Sipariş gönderilemedi. Lütfen tekrar deneyin.');
    }
  };

  const filteredItems = selectedCategory
    ? menuItems.filter(item => item.categoryId === selectedCategory)
    : menuItems;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Menü yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!settings?.deliveryEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 p-4">
        <div className="text-center bg-white rounded-2xl p-8 shadow-xl max-w-md">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Eve Servis Kapalı</h2>
          <p className="text-gray-600">Şu anda eve servis hizmeti verilmemektedir.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 pb-24">
      {/* Header */}
      <div className="bg-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Home className="w-7 h-7 text-orange-500" />
                Eve Servis
              </h1>
              <p className="text-sm text-gray-600">
                Min. Sipariş: {settings.deliveryMinAmount}₺ | Teslimat: {settings.deliveryFee}₺
              </p>
            </div>
            <button
              onClick={() => setShowCart(true)}
              className="relative p-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white shadow-md sticky top-[88px] z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 overflow-x-auto">
          <div className="flex gap-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  'px-6 py-2 rounded-full font-medium whitespace-nowrap transition-all',
                  selectedCategory === category.id
                    ? 'bg-orange-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredItems.map(item => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => handleItemClick(item)}
              className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
            >
              {item.image && (
                <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
              )}
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                {item.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-2xl font-bold text-orange-600">{item.price}₺</span>
                  <button className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors">
                    Ekle
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Item Detail Modal - Same as CustomerMenu */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              {selectedItem.image && (
                <img src={selectedItem.image} alt={selectedItem.name} className="w-full h-64 object-cover" />
              )}
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedItem.name}</h2>
                    {selectedItem.description && (
                      <p className="text-gray-600 mt-1">{selectedItem.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="text-3xl font-bold text-orange-600 mb-6">{selectedItem.price}₺</div>

                {/* İçindekiler */}
                {selectedItem.ingredients.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">İçindekiler</h3>
                    <div className="space-y-2">
                      {selectedItem.ingredients.map(ingredient => (
                        <label
                          key={ingredient.id}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors',
                            ingredient.removable ? 'hover:bg-gray-50' : 'opacity-60 cursor-not-allowed'
                          )}
                        >
                          {ingredient.removable && (
                            <input
                              type="checkbox"
                              checked={!removedIngredients.includes(ingredient.id)}
                              onChange={() => toggleIngredient(ingredient.id)}
                              className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
                            />
                          )}
                          <span className="text-gray-700">{ingredient.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ekstralar */}
                {selectedItem.availableExtras.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Ekstralar</h3>
                    <div className="space-y-2">
                      {selectedItem.availableExtras.map(extra => (
                        <label
                          key={extra.id}
                          className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={addedExtras.some(e => e.id === extra.id)}
                              onChange={() => toggleExtra(extra)}
                              className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
                            />
                            <span className="text-gray-700">{extra.name}</span>
                          </div>
                          <span className="text-orange-600 font-semibold">+{extra.price}₺</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notlar */}
                <div className="mb-6">
                  <label className="block text-lg font-bold text-gray-900 mb-3">
                    Özel Notlarınız
                  </label>
                  <textarea
                    value={itemNotes}
                    onChange={(e) => setItemNotes(e.target.value)}
                    placeholder="Örn: Az baharatlı olsun"
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0 resize-none"
                  />
                </div>

                <button
                  onClick={handleAddToCart}
                  className="w-full py-4 bg-orange-500 text-white rounded-xl font-bold text-lg hover:bg-orange-600 transition-colors"
                >
                  Sepete Ekle
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Modal */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowCart(false)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Sepetim</h2>
                  <button
                    onClick={() => setShowCart(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Sepetiniz boş</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-6">
                      {cart.map(item => (
                        <div key={item.id} className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-900">{item.name}</h3>
                              {item.removedIngredients.length > 0 && (
                                <p className="text-sm text-red-600 mt-1">
                                  Çıkarılanlar: {item.removedIngredients.join(', ')}
                                </p>
                              )}
                              {item.addedExtras.length > 0 && (
                                <p className="text-sm text-green-600 mt-1">
                                  Ekstralar: {item.addedExtras.map(e => e.name).join(', ')}
                                </p>
                              )}
                              {item.notes && (
                                <p className="text-sm text-gray-600 mt-1">Not: {item.notes}</p>
                              )}
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="p-1 hover:bg-red-100 rounded-full transition-colors"
                            >
                              <X className="w-5 h-5 text-red-500" />
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => updateCartItemQuantity(item.id, Math.max(1, item.quantity - 1))}
                                className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-8 text-center font-bold">{item.quantity}</span>
                              <button
                                onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                                className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            <span className="text-lg font-bold text-orange-600">{item.totalPrice}₺</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 space-y-2 mb-6">
                      <div className="flex justify-between text-gray-600">
                        <span>Ara Toplam</span>
                        <span>{getCartTotal()}₺</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Teslimat</span>
                        <span>{settings?.deliveryFee || 0}₺</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>KDV</span>
                        <span>{((getCartTotal() + (settings?.deliveryFee || 0)) * (settings?.taxRate || 0.10)).toFixed(2)}₺</span>
                      </div>
                      <div className="flex justify-between text-xl font-bold text-gray-900">
                        <span>Toplam</span>
                        <span>{((getCartTotal() + (settings?.deliveryFee || 0)) * (1 + (settings?.taxRate || 0.10))).toFixed(2)}₺</span>
                      </div>
                      
                      {settings?.deliveryMinAmount && getCartTotal() < settings.deliveryMinAmount && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            Minimum sipariş tutarı: {settings.deliveryMinAmount}₺
                            <br />
                            Kalan: {(settings.deliveryMinAmount - getCartTotal()).toFixed(2)}₺
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleProceedToCheckout}
                      disabled={settings?.deliveryMinAmount ? getCartTotal() < settings.deliveryMinAmount : false}
                      className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siparişi Tamamla
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowCheckout(false)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Teslimat Bilgileri</h2>
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Adınız Soyadınız
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Adınız Soyadınız"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Telefon Numaranız
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="05XX XXX XX XX"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Teslimat Adresi
                    </label>
                    <textarea
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Tam adresinizi yazın..."
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Sipariş Notu (Opsiyonel)
                    </label>
                    <textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Sipariş ile ilgili notlarınız..."
                      rows={2}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0 resize-none"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <h3 className="font-bold text-gray-900 mb-2">Sipariş Özeti</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ürünler ({cart.length})</span>
                      <span className="font-semibold">{getCartTotal()}₺</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Teslimat</span>
                      <span className="font-semibold">{settings?.deliveryFee || 0}₺</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">KDV</span>
                      <span className="font-semibold">{((getCartTotal() + (settings?.deliveryFee || 0)) * (settings?.taxRate || 0.10)).toFixed(2)}₺</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                      <span>Toplam</span>
                      <span>{((getCartTotal() + (settings?.deliveryFee || 0)) * (1 + (settings?.taxRate || 0.10))).toFixed(2)}₺</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSubmitOrder}
                  disabled={!customerName || !customerPhone || !deliveryAddress}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siparişi Onayla
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
