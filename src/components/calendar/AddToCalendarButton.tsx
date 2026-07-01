import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Reservation } from '@/types';
import { calendarService } from '@/services/calendarService';

interface AddToCalendarButtonProps {
  reservation: Reservation;
  variant?: 'default' | 'compact';
  className?: string;
}

export function AddToCalendarButton({ 
  reservation, 
  variant = 'default',
  className 
}: AddToCalendarButtonProps) {
  const [isAdded, setIsAdded] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  
  const calendarOptions = calendarService.getCalendarOptions(reservation);
  const isMobile = /iphone|ipad|ipod|android|mobile/i.test(navigator.userAgent);

  const handleQuickAdd = async () => {
    setShowOptions(true);
  };

  const handleOptionClick = async (option: any) => {
    await option.action();
    setShowOptions(false);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 3000);
  };

  return (
    <>
      <div className="relative">
        <motion.button
          onClick={handleQuickAdd}
          disabled={isAdded}
          whileHover={{ scale: isAdded ? 1 : 1.01 }}
          whileTap={{ scale: isAdded ? 1 : 0.99 }}
          className={cn(
            "relative overflow-hidden rounded-2xl font-heading font-semibold transition-all duration-200",
            "flex items-center justify-center gap-2.5",
            "text-white",
            variant === 'default' && "h-12 px-6 w-full",
            variant === 'compact' && "h-10 px-4 text-sm",
            isAdded 
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 cursor-default"
              : "bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 hover:shadow-lg hover:shadow-purple-500/25",
            className
          )}
        >
          {isAdded ? (
            <>
              <Check size={variant === 'default' ? 18 : 16} className="animate-scale-in" />
              <span>Takvime Eklendi</span>
            </>
          ) : (
            <>
              <Calendar size={variant === 'default' ? 18 : 16} />
              <span>Takvime Ekle</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Modal / Bottom Sheet - Portal ile render */}
      {showOptions && createPortal(
        <AnimatePresence>
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOptions(false)}
              className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Container */}
            <motion.div
              initial={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.95, x: '-50%', y: '-50%' }}
              animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
              exit={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.95, x: '-50%', y: '-50%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={cn(
                "z-[10000] bg-white shadow-2xl overflow-hidden",
                isMobile 
                  ? "fixed bottom-0 left-0 right-0 rounded-t-3xl max-h-[80vh]"
                  : "fixed left-1/2 top-1/2 rounded-3xl w-full max-w-md"
              )}
            >
              {/* Handle bar (sadece mobil) */}
              {isMobile && (
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                </div>
              )}

              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-heading font-bold text-gray-900">
                    Takvime Ekle
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Randevunuzu kaydetmek için bir yöntem seçin
                  </p>
                </div>
                <button
                  onClick={() => setShowOptions(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              {/* Options */}
              <div className={cn(
                "overflow-y-auto",
                isMobile ? "max-h-[calc(80vh-140px)]" : "max-h-[500px]"
              )}>
                <div className="p-4 space-y-2">
                  {calendarOptions.map((option, index) => (
                    <motion.button
                      key={option.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleOptionClick(option)}
                      className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-gradient-to-br from-gray-50 to-white hover:from-purple-50 hover:to-blue-50 border border-gray-100 hover:border-purple-200 transition-all text-left group active:scale-[0.98] shadow-sm hover:shadow-md"
                    >
                      <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 group-hover:from-purple-200 group-hover:to-blue-200 transition-colors shadow-sm">
                        <span className="text-3xl">{option.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-heading font-bold text-gray-900 group-hover:text-purple-600 transition-colors text-base">
                          {option.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                          {option.id === 'share' && 'Tüm takvim uygulamalarını göster'}
                          {option.id === 'google' && 'Google hesabınızla senkronize edin'}
                          {option.id === 'apple' && 'iPhone, iPad ve Mac için'}
                          {option.id === 'outlook' && 'Microsoft hesabınızla senkronize'}
                          {option.id === 'ics' && 'Herhangi bir takvimde açın'}
                        </div>
                      </div>
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white group-hover:bg-purple-100 transition-colors shadow-sm">
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Safe area (mobil) */}
              {isMobile && <div className="h-8" />}
            </motion.div>
          </>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
