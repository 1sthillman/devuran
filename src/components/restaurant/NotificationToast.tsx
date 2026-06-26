import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Flame, Receipt, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RestaurantNotification } from '@/types/restaurant';

interface NotificationToastProps {
  notification: RestaurantNotification;
  onDismiss: () => void;
  onRespond: () => void;
}

export function NotificationToast({ notification, onDismiss, onRespond }: NotificationToastProps) {
  function getIcon() {
    switch (notification.type) {
      case 'waiter_call':
        return <Phone className="w-5 h-5" />;
      case 'coal_request':
        return <Flame className="w-5 h-5" />;
      case 'bill_request':
        return <Receipt className="w-5 h-5" />;
      default:
        return <Receipt className="w-5 h-5" />;
    }
  }

  function getLabel() {
    switch (notification.type) {
      case 'waiter_call':
        return 'Garson Çağrısı';
      case 'coal_request':
        return 'Köz Talebi';
      case 'bill_request':
        return 'Hesap Talebi';
      default:
        return 'Bildirim';
    }
  }

  function getColor() {
    switch (notification.type) {
      case 'waiter_call':
        return 'blue';
      case 'coal_request':
        return 'orange';
      case 'bill_request':
        return 'green';
      default:
        return 'gray';
    }
  }

  const color = getColor();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="relative"
    >
      {/* Bokeh Background Blur Effect */}
      <div className={cn(
        'absolute inset-0 rounded-2xl blur-2xl opacity-40 animate-pulse',
        color === 'blue' && 'bg-blue-500',
        color === 'orange' && 'bg-orange-500',
        color === 'green' && 'bg-green-500'
      )} />

      {/* Toast Card */}
      <div className="relative backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border-2 rounded-2xl shadow-2xl overflow-hidden">
        {/* Top Color Accent */}
        <div className={cn(
          'h-1.5',
          color === 'blue' && 'bg-gradient-to-r from-blue-500 to-cyan-500',
          color === 'orange' && 'bg-gradient-to-r from-orange-500 to-red-500',
          color === 'green' && 'bg-gradient-to-r from-green-500 to-emerald-500'
        )} />

        <div className="p-4 flex items-start gap-3">
          {/* Icon */}
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0',
            color === 'blue' && 'bg-gradient-to-br from-blue-500 to-cyan-500',
            color === 'orange' && 'bg-gradient-to-br from-orange-500 to-red-500',
            color === 'green' && 'bg-gradient-to-br from-green-500 to-emerald-500'
          )}>
            {getIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                  {getLabel()}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                  Masa {notification.tableName}
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={onDismiss}
                className="w-7 h-7 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Action Button */}
            <button
              onClick={onRespond}
              className={cn(
                'mt-3 w-full px-4 py-2 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md',
                color === 'blue' && 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600',
                color === 'orange' && 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600',
                color === 'green' && 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
              )}
            >
              İşleme Al
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
