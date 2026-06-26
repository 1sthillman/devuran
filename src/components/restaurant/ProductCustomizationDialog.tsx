import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, X, Clock, Check, Sparkles, ChefHat } from 'lucide-react';
import { useRestaurantStore } from '@/store/restaurantStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { MenuItem } from '@/types/restaurant';

interface ProductCustomizationDialogProps {
  item: MenuItem;
  open: boolean;
  onClose: () => void;
}

export function ProductCustomizationDialog({ item, open, onClose }: ProductCustomizationDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [addedExtras, setAddedExtras] = useState<{ id: string; name: string; price: number }[]>([]);
  const [notes, setNotes] = useState('');
  
  const { addToCart } = useRestaurantStore();

  function toggleIngredient(ingredient: { id: string; name: string }) {
    setRemovedIngredients(prev =>
      prev.includes(ingredient.name)
        ? prev.filter(name => name !== ingredient.name)
        : [...prev, ingredient.name]
    );
  }

  function toggleExtra(extra: { id: string; name: string; price: number }) {
    setAddedExtras(prev => {
      const exists = prev.find(e => e.id === extra.id);
      if (exists) {
        return prev.filter(e => e.id !== extra.id);
      } else {
        return [...prev, extra];
      }
    });
  }

  function calculateTotal() {
    const basePrice = item.price;
    const extrasPrice = addedExtras.reduce((sum, extra) => sum + extra.price, 0);
    return (basePrice + extrasPrice) * quantity;
  }

  function handleAddToCart() {
    for (let i = 0; i < quantity; i++) {
      addToCart(item, { removedIngredients, addedExtras, notes });
    }
    toast.success('Sepete eklendi!', {
      description: `${quantity} x ${item.name}`,
      icon: <Check className="w-5 h-5" />,
    });
    onClose();
    resetForm();
  }

  function resetForm() {
    setQuantity(1);
    setRemovedIngredients([]);
    setAddedExtras([]);
    setNotes('');
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col',
              'bg-white dark:bg-[#0a0a0a]',
              'rounded-t-3xl sm:rounded-3xl',
              'border-t border-gray-200 dark:border-white/10 sm:border',
              'shadow-2xl'
            )}
          >
            {/* Header */}
            <div className="flex-shrink-0 relative">
              {/* Image */}
              {item.image ? (
                <div className="relative h-48 sm:h-64 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  
                  {/* Close Button */}
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-sm flex items-center justify-center hover:bg-white dark:hover:bg-black transition-colors shadow-lg"
                  >
                    <X className="w-5 h-5 text-gray-900 dark:text-white" strokeWidth={2.5} />
                  </button>

                  {/* Title Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white mb-2 drop-shadow-2xl">
                      {item.name}
                    </h2>
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-white" strokeWidth={2.5} />
                        <span className="text-sm font-bold text-white">{item.preparationTime} dk</span>
                      </div>
                      <span className="text-3xl font-heading font-bold text-white drop-shadow-2xl">
                        {item.price.toFixed(2)} ₺
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative h-48 bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <ChefHat className="w-20 h-20 text-white/30" strokeWidth={1.5} />
                  
                  {/* Close Button */}
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </button>

                  {/* Title */}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white mb-2">
                      {item.name}
                    </h2>
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-white" strokeWidth={2.5} />
                        <span className="text-sm font-bold text-white">{item.preparationTime} dk</span>
                      </div>
                      <span className="text-3xl font-heading font-bold text-white">
                        {item.price.toFixed(2)} ₺
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Description */}
              {item.description && (
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {item.description}
                </p>
              )}


              {/* İçindekiler */}
              {item.ingredients.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <ChefHat className="w-4 h-4 text-white" strokeWidth={2.5} />
                    </div>
                    <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-white">
                      İçindekiler
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {item.ingredients.map((ingredient) => {
                      const isRemoved = removedIngredients.includes(ingredient.name);
                      return (
                        <motion.button
                          key={ingredient.id}
                          whileTap={{ scale: ingredient.removable ? 0.98 : 1 }}
                          onClick={() => ingredient.removable && toggleIngredient(ingredient)}
                          disabled={!ingredient.removable}
                          className={cn(
                            'w-full p-3 rounded-2xl border-2 transition-all text-left',
                            ingredient.removable
                              ? isRemoved
                                ? 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 opacity-50'
                                : 'bg-green-50 dark:bg-green-500/10 border-green-500/30 hover:border-green-500'
                              : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 cursor-not-allowed'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                                isRemoved
                                  ? 'border-gray-300 dark:border-gray-600'
                                  : 'border-green-500 bg-green-500'
                              )}>
                                {!isRemoved && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                              </div>
                              <span className={cn(
                                'font-medium',
                                isRemoved
                                  ? 'text-gray-500 dark:text-gray-500 line-through'
                                  : 'text-gray-900 dark:text-white'
                              )}>
                                {ingredient.name}
                              </span>
                            </div>
                            {!ingredient.removable && (
                              <span className="text-xs font-bold text-gray-500 dark:text-gray-500">
                                Zorunlu
                              </span>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ekstralar */}
              {item.availableExtras.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" strokeWidth={2.5} />
                    </div>
                    <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-white">
                      Ekstra Ekle
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {item.availableExtras.map((extra) => {
                      const isAdded = addedExtras.some(e => e.id === extra.id);
                      return (
                        <motion.button
                          key={extra.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => toggleExtra(extra)}
                          className={cn(
                            'w-full p-3 rounded-2xl border-2 transition-all text-left',
                            isAdded
                              ? 'bg-purple-50 dark:bg-purple-500/10 border-purple-500 shadow-lg shadow-purple-500/20'
                              : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-purple-500'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                                isAdded
                                  ? 'border-purple-500 bg-purple-500'
                                  : 'border-gray-300 dark:border-gray-600'
                              )}>
                                {isAdded && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                              </div>
                              <span className={cn(
                                'font-medium',
                                isAdded ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                              )}>
                                {extra.name}
                              </span>
                            </div>
                            <span className={cn(
                              'font-bold',
                              isAdded ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'
                            )}>
                              +{extra.price.toFixed(2)} ₺
                            </span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notlar */}
              <div className="space-y-3">
                <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-white">
                  Özel Not
                </h3>
                <textarea
                  placeholder="Özel isteğinizi buraya yazın... (opsiyonel)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className={cn(
                    'w-full px-4 py-3 rounded-2xl font-medium transition-all resize-none',
                    'bg-gray-50 dark:bg-white/5',
                    'border-2 border-gray-200 dark:border-white/10',
                    'focus:border-orange-500 dark:focus:border-orange-500 focus:ring-0',
                    'text-gray-900 dark:text-white',
                    'placeholder-gray-500 dark:placeholder-gray-500'
                  )}
                />
              </div>
            </div>

            {/* Footer - Sticky */}
            <div className="flex-shrink-0 p-4 bg-gradient-to-t from-white to-white/95 dark:from-[#0a0a0a] dark:to-[#0a0a0a]/95 backdrop-blur-xl border-t border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-3">
                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/5 rounded-full p-1">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-full bg-white dark:bg-white/10 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/20 transition-colors"
                  >
                    <Minus className="w-4 h-4 text-gray-900 dark:text-white" strokeWidth={2.5} />
                  </motion.button>
                  <span className="w-8 text-center font-heading font-bold text-lg text-gray-900 dark:text-white">
                    {quantity}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-full bg-white dark:bg-white/10 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/20 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-gray-900 dark:text-white" strokeWidth={2.5} />
                  </motion.button>
                </div>

                {/* Add to Cart Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddToCart}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-full font-heading font-bold text-base transition-all shadow-lg shadow-orange-500/30"
                >
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2">
                      <span>Sepete Ekle</span>
                      <span className="text-white/80">•</span>
                      <span>{calculateTotal().toFixed(2)} ₺</span>
                    </div>
                    <span className="text-xs text-white/70 font-normal mt-0.5">KDV Dahil</span>
                  </div>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
