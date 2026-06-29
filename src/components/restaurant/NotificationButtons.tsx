import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Flame, Receipt, Check, ChevronUp, CheckCircle2 } from 'lucide-react';
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
  const [showSuccess, setShowSuccess] = useState(false);
  const [successType, setSuccessType] = useState<'waiter_call' | 'coal_request' | 'bill_request' | null>(null);
  const [lastClickTimes, setLastClickTimes] = useState<Record<string, number>>({});
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});

  // CRITICAL DEBUG: Component mount testi
  console.log('🚨 ========== NotificationButtons COMPONENT LOADED ==========');
  console.log('🚨 Component file executed at:', new Date().toISOString());

  useEffect(() => {
    console.log('🔔 ========== NotificationButtons useEffect ÇALIŞTI ==========');
    console.log('📊 Props:', {
      restaurantId,
      tableId,
      tableName,
      restaurantIdType: typeof restaurantId,
      tableIdType: typeof tableId,
      tableNameType: typeof tableName
    });
    
    setMounted(true);
    console.log('✅ mounted = true yapıldı');
    
    // Cooldown timer
    const interval = setInterval(() => {
      const now = Date.now();
      setCooldowns(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          const remaining = updated[key] - now;
          if (remaining <= 0) {
            delete updated[key];
          }
        });
        return updated;
      });
    }, 1000);
    
    return () => {
      console.log('🔴 NotificationButtons unmounting');
      clearInterval(interval);
    };
  }, [restaurantId, tableId, tableName]);

  // Bildirim sesi çal
  function playNotificationSound(type: 'waiter_call' | 'coal_request' | 'bill_request') {
    try {
      // Farklı frekanslarda beep sesleri
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Buton tipine göre frekans
      const frequency = {
        waiter_call: 800,   // Yüksek ton
        coal_request: 600,  // Orta ton
        bill_request: 700   // Orta-yüksek ton
      }[type];
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Ses çalınamadı:', error);
    }
  }

  const handleButtonClick = useCallback(async (type: 'waiter_call' | 'coal_request' | 'bill_request', message: string, label: string) => {
    console.log('🎯 ========== BUTTON CLICKED! ==========');
    
    if (tableId === 'loading') {
      console.warn('⚠️ TableId is still loading!');
      toast.error('Lütfen bekleyin...');
      return;
    }
    
    // Cooldown kontrolü
    const now = Date.now();
    const lastClick = lastClickTimes[type] || 0;
    const timeSinceLastClick = now - lastClick;
    const cooldownPeriod = 60000; // 60 saniye
    
    if (timeSinceLastClick < cooldownPeriod) {
      const remainingSeconds = Math.ceil((cooldownPeriod - timeSinceLastClick) / 1000);
      toast.error('Çok sık istek gönderiyorsunuz', {
        description: `${remainingSeconds} saniye sonra tekrar deneyebilirsiniz`
      });
      return;
    }
    
    try {
      setSending(type);
      
      // Bildirim sesi çal
      playNotificationSound(type);
      
      const notificationId = await restaurantService.createNotification(
        restaurantId, 
        type, 
        message, 
        tableId, 
        tableName
      );
      
      console.log('✅ Notification created:', notificationId);
      
      // Cooldown başlat
      setLastClickTimes(prev => ({ ...prev, [type]: now }));
      setCooldowns(prev => ({ ...prev, [type]: now + cooldownPeriod }));
      
      // Success animation
      setSuccessType(type);
      setShowSuccess(true);
      
      // Success mesajı
      const successMessages = {
        waiter_call: {
          title: 'Garson Çağrıldı!',
          description: 'Garsonumuz hemen geliyor'
        },
        coal_request: {
          title: 'Köz Talebiniz Alındı!',
          description: 'Sıcak közleriniz yolda'
        },
        bill_request: {
          title: 'Hesap İstendi!',
          description: 'Hesabınızı getiriyoruz'
        }
      }[type];
      
      toast.success(successMessages.title, {
        description: successMessages.description,
        duration: 3000,
      });
      
      // Animasyonları temizle
      setTimeout(() => {
        setShowSuccess(false);
        setSuccessType(null);
        setIsExpanded(false);
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ NOTIFICATION ERROR:', error);
      toast.error('Bildirim gönderilemedi', {
        description: error?.message || 'Lütfen tekrar deneyin'
      });
    } finally {
      setSending(null);
    }
  }, [tableId, restaurantId, tableName, lastClickTimes]);

  const buttons = [
    {
      type: 'waiter_call' as const,
      icon: Phone,
      label: 'Garson',
      gradient: 'from-blue-500 to-cyan-500',
      message: `Masa ${tableName} - Garson çağırıyor`,
      gifUrl: '/asset/Modern_digital_waiter_robot_holding_a_sleek_d.gif',
    },
    {
      type: 'coal_request' as const,
      icon: Flame,
      label: 'Köz',
      gradient: 'from-orange-500 to-red-500',
      message: `Masa ${tableName} - Köz istiyor`,
      gifUrl: '/asset/Transform_the_scene_the_same_modern_digital.gif',
    },
    {
      type: 'bill_request' as const,
      icon: Receipt,
      label: 'Hesap',
      gradient: 'from-green-500 to-emerald-500',
      message: `Masa ${tableName} - Hesap istiyor`,
      gifUrl: '/asset/Modern_digital_waiter_character_sleek_and_st.gif',
    },
  ];

  if (!mounted) {
    console.warn('⚠️ NotificationButtons henüz mount edilmedi! Rendering skipped.');
    return null;
  }

  console.log('🎨 NotificationButtons RENDER EDİLİYOR - mounted=true');

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
                
                // Cooldown hesaplama
                const now = Date.now();
                const lastClick = lastClickTimes[button.type] || 0;
                const timeSinceLastClick = now - lastClick;
                const cooldownPeriod = 60000; // 60 saniye
                const remainingMs = cooldownPeriod - timeSinceLastClick;
                const isInCooldown = remainingMs > 0;
                const remainingSeconds = Math.ceil(remainingMs / 1000);

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
                      disabled={sending === button.type || isInCooldown}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🔴 BUTTON ONCLICK!', button.label);
                        handleButtonClick(button.type, button.message, button.label);
                      }}
                      className={cn(
                        'relative group flex items-center gap-3 px-5 py-4 rounded-2xl transition-all w-full overflow-hidden',
                        // Glassmorphism effect
                        'bg-white/10 dark:bg-white/5',
                        'backdrop-blur-2xl backdrop-saturate-150',
                        'border border-white/20 dark:border-white/10',
                        'shadow-2xl shadow-black/10',
                        'active:scale-[0.98]',
                        sending === button.type 
                          ? 'opacity-80 cursor-wait' 
                          : isInCooldown
                          ? 'opacity-50 cursor-not-allowed'
                          : 'cursor-pointer hover:bg-white/15 dark:hover:bg-white/10 hover:scale-[1.02]'
                      )}
                    >
                      {/* GIF Background - 9:16 aspect ratio, centered */}
                      <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-2xl">
                        <img 
                          src={button.gifUrl}
                          alt=""
                          className="h-full w-auto object-cover opacity-30"
                          style={{ aspectRatio: '9/16' }}
                        />
                        {/* Dark overlay for better text contrast */}
                        <div className="absolute inset-0 bg-black/40" />
                      </div>

                      {/* Gradient Glow on Hover */}
                      <div className={cn(
                        'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                        'bg-gradient-to-r',
                        button.type === 'waiter_call' ? 'from-blue-500/10 to-cyan-500/10' :
                        button.type === 'coal_request' ? 'from-orange-500/10 to-red-500/10' :
                        'from-green-500/10 to-emerald-500/10'
                      )} />
                      
                      {/* Ripple Effect Background */}
                      {sending === button.type && (
                        <motion.div
                          className={cn(
                            'absolute inset-0 rounded-2xl',
                            button.type === 'waiter_call' ? 'bg-blue-500/20' :
                            button.type === 'coal_request' ? 'bg-orange-500/20' :
                            'bg-green-500/20'
                          )}
                          initial={{ scale: 0, opacity: 1 }}
                          animate={{ 
                            scale: [0, 1.5, 1.5, 1.5],
                            opacity: [1, 0.8, 0.4, 0]
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeOut"
                          }}
                        />
                      )}
                      
                      {/* Icon Section */}
                      {sending === button.type ? (
                        <div className="relative z-10 w-12 h-12 flex items-center justify-center">
                          <motion.div
                            className={cn(
                              "w-8 h-8 rounded-full border-[3px]",
                              button.type === 'waiter_call' ? 'border-blue-400' :
                              button.type === 'coal_request' ? 'border-orange-400' :
                              'border-green-400',
                              'border-t-transparent'
                            )}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                          />
                        </div>
                      ) : (
                        <div className={cn(
                          "relative z-10 w-12 h-12 rounded-xl flex items-center justify-center",
                          "bg-gradient-to-br shadow-lg transition-transform group-hover:scale-110",
                          `${button.gradient}`
                        )}>
                          <Icon className="w-6 h-6 text-white drop-shadow-lg" strokeWidth={2.5} />
                        </div>
                      )}
                      
                      {/* Text Section */}
                      <div className="relative z-10 flex flex-col items-start flex-1">
                        <span className="text-base font-heading font-bold text-white whitespace-nowrap">
                          {button.label}
                        </span>
                        {isInCooldown && (
                          <motion.span 
                            key={remainingSeconds}
                            initial={{ scale: 1.2, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-xs font-medium text-orange-300 mt-0.5"
                          >
                            {remainingSeconds} saniye sonra
                          </motion.span>
                        )}
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAB Toggle Button - Glassmorphism */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔵 ========== FAB BUTON TIKLANDI! ==========');
            console.log('📊 State:', { 
              currentState: isExpanded, 
              willBecome: !isExpanded,
              timestamp: new Date().toISOString()
            });
            setIsExpanded(!isExpanded);
          }}
          className={cn(
            'relative w-16 h-16 rounded-full transition-all cursor-pointer overflow-hidden group',
            // Glassmorphism base
            'bg-gradient-to-br from-orange-500/90 to-red-500/90',
            'backdrop-blur-xl backdrop-saturate-150',
            'flex items-center justify-center',
            'shadow-2xl shadow-orange-500/30',
            'hover:shadow-orange-500/50',
            'border border-white/20',
            'hover:scale-110 active:scale-95',
            isExpanded && 'ring-4 ring-orange-500/20 scale-105'
          )}
        >
          {/* Ambient glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Success Ripple Effect */}
          <AnimatePresence>
            {showSuccess && (
              <>
                <motion.div
                  className="absolute inset-0 bg-green-400 rounded-full"
                  initial={{ scale: 1, opacity: 1 }}
                  animate={{ scale: 2, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
                <motion.div
                  className="absolute inset-0 bg-green-300 rounded-full"
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                />
              </>
            )}
          </AnimatePresence>

          {/* Icon with smooth transition */}
          <AnimatePresence mode="wait">
            {showSuccess ? (
              <motion.div
                key="success"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: "spring", duration: 0.5, bounce: 0.4 }}
                className="relative z-10"
              >
                <CheckCircle2 className="w-8 h-8 text-white drop-shadow-2xl" strokeWidth={2.5} />
              </motion.div>
            ) : (
              <motion.div
                key="default"
                initial={{ scale: 0, rotate: 180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: -180 }}
                transition={{ type: "spring", duration: 0.5, bounce: 0.4 }}
                className="relative z-10 transition-transform duration-300"
                style={{
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
              >
                <ChevronUp className="w-7 h-7 text-white drop-shadow-2xl" strokeWidth={3} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Badge - Glassmorphism style */}
          {!isExpanded && !showSuccess && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br from-green-400 to-emerald-500 border-2 border-white/30 backdrop-blur-sm"
            >
              <span className="text-xs font-bold text-white">3</span>
            </motion.div>
          )}
        </button>
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}
