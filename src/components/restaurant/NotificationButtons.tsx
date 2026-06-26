import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Flame, Receipt, Check, ChevronUp } from 'lucide-react';
import { restaurantService } from '@/services/restaurantService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface NotificationButtonsProps {
  restaurantId: string;
  tableId: string;
  tableName: string;
}

export function NotificationButtons({ restaurantId, tableId, tableName }: NotificationButtonsProps) {
  const [sending, setSending] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.log('🔔 ========== NotificationButtons BAŞLATILDI ==========');
    console.log('📊 Props:', {
      restaurantId,
      tableId,
      tableName,
      restaurantIdType: typeof restaurantId,
      tableIdType: typeof tableId,
      tableNameType: typeof tableName
    });
    console.log('✅ Component mount edildi, butonlar görünmeli!');
  }, [restaurantId, tableId, tableName]);

  const handleButtonClick = useCallback(async (type: 'waiter_call' | 'coal_request' | 'bill_request', message: string, label: string) => {
    console.log('🎯 ========== BUTTON CLICKED! ==========');
    console.log('📊 Click Details:', { 
      type, 
      label, 
      tableId,
      tableName,
      restaurantId,
      timestamp: new Date().toISOString()
    });
    
    if (tableId === 'loading') {
      console.warn('⚠️ TableId is still loading!');
      toast.error('Lütfen bekleyin...');
      return;
    }
    
    // Direkt sendNotification çağır
    try {
      setSending(type);
      console.log('🔔 Sending notification...');
      
      const notificationId = await restaurantService.createNotification(
        restaurantId, 
        type, 
        message, 
        tableId, 
        tableName
      );
      
      console.log('✅ Notification created:', notificationId);
      
      toast.success(
        type === 'coal_request' ? '🔥 Köz talebiniz iletildi!' :
        type === 'waiter_call' ? '📞 Garson çağrıldı!' :
        '💰 Hesap talebi alındı!',
        {
          description: '✅ Garsonumuz masanıza gelecek',
          duration: 3000
        }
      );
      
      setTimeout(() => setIsExpanded(false), 1500);
      
    } catch (error: any) {
      console.error('❌ NOTIFICATION ERROR:', error);
      toast.error('Bildirim gönderilemedi', {
        description: error?.message || 'Lütfen tekrar deneyin',
        duration: 5000
      });
    } finally {
      setSending(null);
    }
  }, [tableId, restaurantId, tableName]);

  const buttons = [
    {
      type: 'waiter_call' as const,
      icon: Phone,
      label: 'Garson',
      gradient: 'from-blue-500 to-cyan-500',
      message: `Masa ${tableName} - Garson çağırıyor`,
    },
    {
      type: 'coal_request' as const,
      icon: Flame,
      label: 'Köz',
      gradient: 'from-orange-500 to-red-500',
      message: `Masa ${tableName} - Köz istiyor`,
    },
    {
      type: 'bill_request' as const,
      icon: Receipt,
      label: 'Hesap',
      gradient: 'from-green-500 to-emerald-500',
      message: `Masa ${tableName} - Hesap istiyor`,
    },
  ];

  if (!mounted) {
    console.warn('⚠️ NotificationButtons henüz mount edilmedi!');
    return null;
  }

  const content = (
    <>
      {/* FAB Container - Always visible in viewport */}
      <div 
        className="fixed right-4 sm:right-6 z-[99999]" 
        style={{ 
          position: 'fixed',
          bottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))',
          pointerEvents: 'auto'
        }}
      >
        <div className="flex flex-col items-end gap-2">

        {/* Notification Buttons - Show when expanded */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ 
                type: "spring", 
                damping: 25,
                stiffness: 400
              }}
              className="flex flex-col gap-2 mb-1"
            >
              {buttons.map((button, index) => {
                const Icon = button.icon;
                const isLoading = sending === button.type;

                return (
                  <motion.div
                    key={button.type}
                    initial={{ opacity: 0, x: 50, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 50, scale: 0.8 }}
                    transition={{ 
                      delay: index * 0.06,
                      type: "spring",
                      damping: 25,
                      stiffness: 400
                    }}
                    className="relative"
                  >
                    <button
                      type="button"
                      disabled={sending === button.type}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🔴 BUTTON ONCLICK!', button.label);
                        handleButtonClick(button.type, button.message, button.label);
                      }}
                      className={cn(
                        'relative flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all w-full',
                        'bg-white/95 dark:bg-black/90 backdrop-blur-xl',
                        'border border-gray-200/50 dark:border-white/10',
                        'shadow-xl shadow-black/10',
                        'hover:scale-105 active:scale-95',
                        sending === button.type ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                      )}
                      style={{
                        boxShadow: sending === button.type ? undefined : `0 4px 16px -4px ${
                          button.type === 'waiter_call' ? 'rgba(59, 130, 246, 0.4)' :
                          button.type === 'coal_request' ? 'rgba(251, 146, 60, 0.4)' :
                          'rgba(34, 197, 94, 0.4)'
                        }`
                      }}
                    >
                      {sending === button.type ? (
                        <div className="w-9 h-9 border-3 rounded-full border-orange-500 border-t-transparent animate-spin" />
                      ) : (
                        <div className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center shadow-md",
                          `bg-gradient-to-br ${button.gradient}`
                        )}>
                          <Icon className="w-4 h-4 text-white drop-shadow-lg" strokeWidth={2.5} />
                        </div>
                      )}
                      <span className="text-sm font-heading font-bold text-gray-900 dark:text-white whitespace-nowrap">
                        {button.label}
                      </span>
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAB Toggle Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔵 FAB BUTON TIKLANDI!', { 
              currentState: isExpanded, 
              willBecome: !isExpanded 
            });
            setIsExpanded(!isExpanded);
          }}
          className={cn(
            'relative w-14 h-14 rounded-full transition-all cursor-pointer',
            'bg-gradient-to-br from-orange-500 to-red-500',
            'hover:from-orange-600 hover:to-red-600',
            'flex items-center justify-center',
            'shadow-xl shadow-orange-500/40',
            'hover:scale-110 active:scale-95',
            isExpanded && 'ring-4 ring-orange-500/20'
          )}
        >
          {/* Icon */}
          <div
            className="relative z-10 transition-transform"
            style={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
            }}
          >
            <ChevronUp className="w-6 h-6 text-white drop-shadow-lg" strokeWidth={3} />
          </div>

          {/* Badge - Show notification indicator when collapsed */}
          {!isExpanded && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-black flex items-center justify-center shadow-lg">
              <span className="text-xs font-bold text-white">3</span>
            </div>
          )}
        </button>
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}
