import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { X, CreditCard, Wallet, Receipt, Utensils } from 'lucide-react';
import { restaurantService } from '@/services/restaurantService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { Order, PaymentMethod } from '@/types/restaurant';

interface PaymentDialogProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentDialog({ order, isOpen, onClose }: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [paidAmount, setPaidAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  // Dialog açıldığında kredi kartı seç ve input temizle
  useEffect(() => {
    if (isOpen) {
      setPaymentMethod('credit_card');
      setPaidAmount('');
    }
  }, [isOpen]);

  async function handlePayment() {
    if (!order) return;

    const total = order.total ?? 0;
    const paid = parseFloat(paidAmount) || 0;

    if (paymentMethod === 'cash' && paid < total) {
      toast.error('Ödenen tutar yetersiz');
      return;
    }

    try {
      setProcessing(true);
      const change = paymentMethod === 'cash' ? paid - total : 0;
      
      await restaurantService.completePayment(
        order.id,
        paymentMethod,
        paid || total,
        change
      );

      toast.success('Ödeme tamamlandı');
      
      if (change > 0) {
        toast.info(`Para üstü: ${change.toFixed(2)} ₺`, { duration: 5000 });
      }

      setPaidAmount('');
      setPaymentMethod('credit_card');
      onClose();
    } catch (error) {
      console.error('Ödeme hatası:', error);
      toast.error('Ödeme alınamadı');
    } finally {
      setProcessing(false);
    }
  }

  function calculateChange(): number {
    if (!order || paymentMethod !== 'cash') return 0;
    const paid = parseFloat(paidAmount) || 0;
    const total = order.total ?? 0;
    // Para üstü negatif olabilir (yetersiz tutar için)
    return paid - total;
  }

  if (!order) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[9999] max-h-[90vh] overflow-y-auto"
          >
            <div className="backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border-t-2 border-gray-200 dark:border-white/10 rounded-t-3xl shadow-2xl">
              {/* Header */}
              <div className="sticky top-0 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-white/10 px-6 py-4 flex items-center justify-between rounded-t-3xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                    <Receipt className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Ödeme Al</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {order.orderNumber} • Masa {order.tableName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 flex items-center justify-center transition-all"
                >
                  <X className="w-5 h-5 text-gray-700 dark:text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5">
                {/* Order Items */}
                <div>
                  <div className="text-sm font-bold mb-3 text-gray-900 dark:text-white">Ürünler</div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm bg-gray-50 dark:bg-white/5 rounded-xl p-3 border border-gray-200 dark:border-white/10">
                        <span className="text-gray-700 dark:text-gray-300">{item.quantity}x {item.name}</span>
                        <span className="text-gray-900 dark:text-white font-bold">{item.totalPrice.toFixed(2)} ₺</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price Summary */}
                <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 border border-gray-200 dark:border-white/10 space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Ara Toplam</span>
                    <span className="font-medium text-gray-900 dark:text-white">{order.subtotal?.toFixed(2) ?? '0.00'} ₺</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <div className="flex flex-col">
                      <span className="text-gray-600 dark:text-gray-400">KDV (%10)</span>
                      <span className="text-xs text-gray-500 dark:text-gray-500 italic">Ürün fiyatlarına dahil</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{order.tax?.toFixed(2) ?? '0.00'} ₺</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold pt-2.5 border-t border-gray-200 dark:border-white/10">
                    <span className="text-gray-900 dark:text-white">Toplam</span>
                    <span className="text-green-600 dark:text-green-400">{order.total?.toFixed(2) ?? '0.00'} ₺</span>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <Label className="text-sm font-bold mb-3 block text-gray-900 dark:text-white">Ödeme Yöntemi</Label>
                  <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3 p-4 border-2 rounded-2xl transition-all bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900 border-gray-700 dark:border-gray-800 hover:from-gray-800 hover:to-gray-700">
                        <RadioGroupItem value="credit_card" id="credit-dialog" className="border-white/30" />
                        <Label htmlFor="credit-dialog" className="flex items-center gap-3 flex-1 cursor-pointer text-white font-medium">
                          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                            <CreditCard className="w-5 h-5 text-blue-400" />
                          </div>
                          Kredi / Banka Kartı
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-4 border-2 rounded-2xl transition-all bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900 border-gray-700 dark:border-gray-800 hover:from-gray-800 hover:to-gray-700">
                        <RadioGroupItem value="debit_card" id="meal-dialog" className="border-white/30" />
                        <Label htmlFor="meal-dialog" className="flex items-center gap-3 flex-1 cursor-pointer text-white font-medium">
                          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                            <Utensils className="w-5 h-5 text-orange-400" />
                          </div>
                          Yemek Kartı
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-4 border-2 rounded-2xl transition-all bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900 border-gray-700 dark:border-gray-800 hover:from-gray-800 hover:to-gray-700">
                        <RadioGroupItem value="cash" id="cash-dialog" className="border-white/30" />
                        <Label htmlFor="cash-dialog" className="flex items-center gap-3 flex-1 cursor-pointer text-white font-medium">
                          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                            <Wallet className="w-5 h-5 text-green-400" />
                          </div>
                          Nakit
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Cash Payment Section - Only shown when cash is selected */}
                {paymentMethod === 'cash' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900 rounded-3xl p-5 border-2 border-gray-700 dark:border-gray-800"
                  >
                    <div>
                      <Label htmlFor="paidAmount-dialog" className="text-sm font-bold mb-2 block text-white">
                        Alınan Tutar
                      </Label>
                      <Input
                        id="paidAmount-dialog"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                        className="text-xl font-bold bg-gray-800 dark:bg-gray-900 border-2 border-gray-700 dark:border-gray-800 text-white rounded-2xl h-14 placeholder:text-gray-500"
                      />
                    </div>

                    {/* Change Display - Only show when amount is entered */}
                    {paidAmount && parseFloat(paidAmount) > 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn(
                          'p-4 rounded-2xl border-2',
                          calculateChange() >= 0 
                            ? 'bg-green-500/20 border-green-500/50' 
                            : 'bg-red-500/20 border-red-500/50'
                        )}
                      >
                        <div className="text-sm font-medium text-white/80 mb-1">Para Üstü</div>
                        <div className={cn(
                          'text-3xl font-bold',
                          calculateChange() >= 0 ? 'text-green-400' : 'text-red-400'
                        )}>
                          {calculateChange() >= 0 ? `${calculateChange().toFixed(2)} ₺` : 'Yetersiz Tutar'}
                        </div>
                      </motion.div>
                    )}

                    {/* Quick Amount Buttons */}
                    <div className="grid grid-cols-3 gap-2">
                      {[50, 100, 200].map((amount) => (
                        <Button
                          key={amount}
                          variant="outline"
                          onClick={() => setPaidAmount(amount.toString())}
                          className="bg-gray-800 dark:bg-gray-900 border-2 border-gray-700 dark:border-gray-800 text-white hover:bg-gray-700 dark:hover:bg-gray-800 rounded-2xl h-12 font-bold"
                        >
                          {amount} ₺
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        onClick={() => setPaidAmount(((order.total ?? 0) + 50).toString())}
                        className="bg-gray-800 dark:bg-gray-900 border-2 border-gray-700 dark:border-gray-800 text-white hover:bg-gray-700 dark:hover:bg-gray-800 rounded-2xl h-12 font-bold"
                      >
                        +50 ₺
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setPaidAmount(((order.total ?? 0) + 100).toString())}
                        className="col-span-2 bg-gray-800 dark:bg-gray-900 border-2 border-gray-700 dark:border-gray-800 text-white hover:bg-gray-700 dark:hover:bg-gray-800 rounded-2xl h-12 font-bold"
                      >
                        Tam + 100 ₺
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3 pt-2">
                  <Button
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-2xl py-6 text-lg font-bold shadow-xl"
                    onClick={handlePayment}
                    disabled={processing || (paymentMethod === 'cash' && calculateChange() < 0)}
                  >
                    {processing ? 'İşleniyor...' : `${(order.total ?? 0).toFixed(2)} ₺ Tahsil Et`}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full bg-gray-100 dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 rounded-2xl h-12 font-bold"
                    onClick={onClose}
                  >
                    İptal
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
