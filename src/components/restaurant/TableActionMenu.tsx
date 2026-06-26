import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, CheckCircle2, Receipt, ArrowRightLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TableActionMenuProps {
  open: boolean;
  onClose: () => void;
  onNewOrder: () => void;
  onMarkDelivered: () => void;
  onRequestBill: () => void;
  onTransferTable: () => void;
  tableNumber: string;
  hasActiveOrders: boolean;
}

export function TableActionMenu({
  open,
  onClose,
  onNewOrder,
  onMarkDelivered,
  onRequestBill,
  onTransferTable,
  tableNumber,
  hasActiveOrders
}: TableActionMenuProps) {
  const actions = [
    {
      icon: ShoppingCart,
      label: 'Yeni Sipariş',
      gradient: 'from-orange-500 to-red-500',
      onClick: onNewOrder,
      enabled: true
    },
    {
      icon: CheckCircle2,
      label: 'Teslim Edildi',
      gradient: 'from-green-500 to-emerald-500',
      onClick: onMarkDelivered,
      enabled: hasActiveOrders
    },
    {
      icon: Receipt,
      label: 'Hesap İste',
      gradient: 'from-blue-500 to-cyan-500',
      onClick: onRequestBill,
      enabled: hasActiveOrders
    },
    {
      icon: ArrowRightLeft,
      label: 'Masa Taşı',
      gradient: 'from-purple-500 to-pink-500',
      onClick: onTransferTable,
      enabled: hasActiveOrders
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000]"
            onClick={onClose}
            style={{ position: 'fixed' }}
          />
        )}
      </AnimatePresence>

      {/* Menu - Bottom Sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="fixed bottom-0 left-0 right-0 z-[10001] px-4 pb-4"
            style={{ 
              position: 'fixed',
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)'
            }}
          >
            <div className="max-w-2xl mx-auto">
              {/* Handle */}
              <div className="flex justify-center mb-3">
                <div className="w-12 h-1.5 bg-white/40 rounded-full" />
              </div>

              {/* Content */}
              <div className="bg-white/95 dark:bg-black/95 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-heading font-bold text-gray-900 dark:text-white">
                        Masa {tableNumber}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        İşlem seçin
                      </p>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={onClose}
                      className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center"
                    >
                      <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </motion.button>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 grid grid-cols-2 gap-3">
                  {actions.map((action, index) => {
                    const Icon = action.icon;
                    const isDisabled = !action.enabled;

                    return (
                      <motion.button
                        key={action.label}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileTap={{ scale: isDisabled ? 1 : 0.95 }}
                        onClick={() => {
                          if (!isDisabled) {
                            action.onClick();
                            onClose();
                          }
                        }}
                        disabled={isDisabled}
                        className={cn(
                          'relative overflow-hidden rounded-2xl p-5 transition-all',
                          'bg-white dark:bg-white/5 border-2',
                          isDisabled 
                            ? 'border-gray-200 dark:border-white/10 opacity-40 cursor-not-allowed'
                            : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 active:scale-95'
                        )}
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className={cn(
                            'w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg',
                            `bg-gradient-to-br ${action.gradient}`,
                            isDisabled && 'grayscale'
                          )}>
                            <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                          </div>
                          <span className="text-sm font-heading font-bold text-gray-900 dark:text-white text-center">
                            {action.label}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
