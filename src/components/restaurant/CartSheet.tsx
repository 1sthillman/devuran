import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { motion } from 'framer-motion';
import { Minus, Plus, X, ShoppingBag, Trash2, Send, Check } from 'lucide-react';
import { useRestaurantStore } from '@/store/restaurantStore';
import { restaurantService } from '@/services/restaurantService';
import { toast } from 'sonner';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Table } from '@/types/restaurant';

interface CartSheetProps {
  open: boolean;
  onClose: () => void;
  restaurantId: string;
  table: Table;
}

export function CartSheet({ open, onClose, restaurantId, table }: CartSheetProps) {
  const { cart, removeFromCart, updateCartItemQuantity, clearCart, getCartTotal } = useRestaurantStore();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmitOrder() {
    if (cart.length === 0) {
      toast.error('Sepetiniz boş');
      return;
    }

    try {
      setSubmitting(true);

      const settings = await restaurantService.getSettings(restaurantId);
      const taxRate = settings?.taxRate || 0.10;
      
      // KDV fiyata dahil - tersine hesaplama
      const total = getCartTotal(); // Bu zaten KDV dahil fiyat
      const subtotal = total / (1 + taxRate); // KDV'siz fiyat
      const tax = total - subtotal; // KDV tutarı

      const orderItems = cart.map(item => ({
        id: item.id,
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        removedIngredients: item.removedIngredients,
        addedExtras: item.addedExtras,
        notes: item.notes,
        totalPrice: item.totalPrice,
      }));

      await restaurantService.createOrder(restaurantId, {
        type: 'dine_in',
        tableId: table.id,
        tableName: table.tableNumber,
        items: orderItems,
        subtotal,
        tax,
        total,
        status: 'pending',
      });

      // Update table status to order_placed
      await restaurantService.updateTable(table.id, { status: 'order_placed' });

      toast.success('Siparişiniz alındı', {
        description: 'Mutfağa iletildi',
        icon: <Check className="w-5 h-5" />,
      });
      clearCart();
      onClose();
    } catch (error) {
      console.error('Sipariş oluşturma hatası:', error);
      toast.error('Sipariş gönderilemedi');
    } finally {
      setSubmitting(false);
    }
  }

  const total = getCartTotal();
  const taxRate = 0.10;
  // KDV fiyata dahil - tersine hesaplama
  const subtotal = total / (1 + taxRate); // KDV'siz tutar
  const taxAmount = total - subtotal; // KDV tutarı

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="h-[90vh] rounded-t-3xl border-0 p-0 bg-gray-50 dark:bg-[#0a0a0a]"
      >
        {/* Header with Handle */}
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-b border-gray-200 dark:border-white/10">
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
          </div>
          <div className="px-6 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
                  Sepetim
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  {cart.length} ürün
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" strokeWidth={2.5} />
              </motion.button>
            </div>
          </div>
        </div>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-white/5 dark:to-white/10 flex items-center justify-center mb-6">
              <ShoppingBag className="w-12 h-12 text-gray-400 dark:text-gray-500" strokeWidth={2} />
            </div>
            <h3 className="text-xl font-heading font-bold text-gray-900 dark:text-white mb-2">
              Sepetiniz Boş
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Menüden ürün ekleyerek siparişinizi oluşturun
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-2xl font-heading font-bold transition-all shadow-lg shadow-orange-500/20"
            >
              Menüye Dön
            </motion.button>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {cart.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="relative rounded-2xl p-4 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 shadow-sm"
                >
                  <div className="flex gap-3">
                    {/* Item Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-heading font-bold text-gray-900 dark:text-white">
                          {item.name}
                        </h3>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeFromCart(item.id)}
                          className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 flex items-center justify-center transition-colors flex-shrink-0"
                        >
                          <X className="w-4 h-4 text-red-500 dark:text-red-400" strokeWidth={2.5} />
                        </motion.button>
                      </div>

                      {/* Price per item */}
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {item.price.toFixed(2)} ₺ / adet
                      </p>

                      {/* Removed Ingredients */}
                      {item.removedIngredients.length > 0 && (
                        <div className="text-xs mb-2 px-3 py-1.5 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-200 dark:border-red-500/20">
                          <span className="font-bold text-red-700 dark:text-red-400">Çıkarılanlar: </span>
                          <span className="text-red-600 dark:text-red-400">
                            {item.removedIngredients.join(', ')}
                          </span>
                        </div>
                      )}

                      {/* Added Extras */}
                      {item.addedExtras.length > 0 && (
                        <div className="text-xs mb-2 px-3 py-1.5 bg-green-50 dark:bg-green-500/10 rounded-xl border border-green-200 dark:border-green-500/20">
                          <span className="font-bold text-green-700 dark:text-green-400">Ekstralar: </span>
                          <span className="text-green-600 dark:text-green-400">
                            {item.addedExtras.map(e => `${e.name} (+${e.price.toFixed(2)}₺)`).join(', ')}
                          </span>
                        </div>
                      )}

                      {/* Notes */}
                      {item.notes && (
                        <div className="text-xs mb-2 px-3 py-1.5 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                          <span className="font-bold text-gray-700 dark:text-gray-400">Not: </span>
                          <span className="text-gray-600 dark:text-gray-400 italic">
                            {item.notes}
                          </span>
                        </div>
                      )}

                      {/* Quantity Controls and Total */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-white/10">
                        <div className="flex items-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => updateCartItemQuantity(item.id, Math.max(1, item.quantity - 1))}
                            className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
                          >
                            <Minus className="w-4 h-4 text-gray-700 dark:text-gray-300" strokeWidth={2.5} />
                          </motion.button>
                          <span className="w-10 text-center font-heading font-bold text-lg text-gray-900 dark:text-white">
                            {item.quantity}
                          </span>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                            className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 flex items-center justify-center transition-all shadow-lg shadow-orange-500/20"
                          >
                            <Plus className="w-4 h-4 text-white" strokeWidth={2.5} />
                          </motion.button>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-heading font-bold bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent">
                            {item.totalPrice.toFixed(2)} ₺
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Bottom Summary and Actions */}
            <div className="sticky bottom-0 bg-white dark:bg-black border-t border-gray-200 dark:border-white/10 px-6 py-4 space-y-4">
              {/* Price Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Ara Toplam (KDV Hariç)</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{subtotal.toFixed(2)} ₺</span>
                </div>
                <div className="flex justify-between text-sm items-start">
                  <div className="flex flex-col">
                    <span className="text-gray-600 dark:text-gray-400">KDV (%{(taxRate * 100).toFixed(0)})</span>
                    <span className="text-xs text-gray-500 dark:text-gray-500 italic">Ürün fiyatlarına dahil</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">{taxAmount.toFixed(2)} ₺</span>
                </div>
                <div className="flex justify-between text-lg pt-2 border-t border-gray-200 dark:border-white/10">
                  <span className="font-heading font-bold text-gray-900 dark:text-white">Toplam</span>
                  <span className="font-heading font-bold text-xl bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent">
                    {total.toFixed(2)} ₺
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={clearCart}
                  className="px-4 py-4 rounded-2xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 font-heading font-bold text-gray-700 dark:text-gray-300 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" strokeWidth={2.5} />
                  <span>Temizle</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: submitting ? 1 : 1.02 }}
                  whileTap={{ scale: submitting ? 1 : 0.98 }}
                  onClick={handleSubmitOrder}
                  disabled={submitting}
                  className={cn(
                    "px-4 py-4 rounded-2xl font-heading font-bold transition-all flex items-center justify-center gap-2 shadow-lg",
                    submitting
                      ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-orange-500/30"
                  )}
                >
                  {submitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      <span>Gönderiliyor...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" strokeWidth={2.5} />
                      <span>Sipariş Ver</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
