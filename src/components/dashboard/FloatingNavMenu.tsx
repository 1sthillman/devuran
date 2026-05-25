import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Calendar,
  Scissors,
  Users,
  Settings,
  Star,
  BarChart3,
  UserCheck,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface FloatingNavMenuProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { key: 'overview', label: 'Genel', icon: LayoutDashboard, color: '#8B5CF6' },
  { key: 'appointments', label: 'Randevular', icon: Calendar, color: '#EC4899' },
  { key: 'analytics', label: 'Analitik', icon: BarChart3, color: '#3B82F6' },
  { key: 'customers', label: 'Müşteriler', icon: UserCheck, color: '#10B981' },
  { key: 'reviews', label: 'Yorumlar', icon: Star, color: '#F59E0B' },
  { key: 'services', label: 'Hizmetler', icon: Scissors, color: '#06B6D4' },
  { key: 'staff', label: 'Personel', icon: Users, color: '#8B5CF6' },
  { key: 'settings', label: 'Ayarlar', icon: Settings, color: '#6B7280' },
];

export function FloatingNavMenu({ activeTab, onTabChange }: FloatingNavMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleItemClick = (key: string) => {
    onTabChange(key);
    setIsOpen(false);
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            {/* Modal */}
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 500, mass: 0.8 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed inset-x-0 bottom-0 sm:absolute sm:bottom-20 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-xl bg-[var(--slate-surface)]/95 backdrop-blur-2xl rounded-t-3xl sm:rounded-3xl border-t border-white/10 sm:border shadow-2xl"
            >
              {/* Grid Content */}
              <div className="p-3">
                <div className="grid grid-cols-4 gap-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.key;
                    
                    return (
                      <button
                        key={item.key}
                        onClick={() => handleItemClick(item.key)}
                        className={cn(
                          'flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all relative',
                          isActive
                            ? 'bg-white/10'
                            : 'bg-white/[0.02] hover:bg-white/5 active:scale-95'
                        )}
                      >
                        {/* Icon */}
                        <div
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center transition-transform',
                            isActive && 'scale-110'
                          )}
                          style={{
                            backgroundColor: `${item.color}15`,
                          }}
                        >
                          <Icon
                            size={18}
                            style={{ color: item.color }}
                            strokeWidth={2.5}
                          />
                        </div>

                        {/* Label */}
                        <span
                          className={cn(
                            'font-heading font-medium text-[10px] text-center leading-tight',
                            isActive
                              ? 'text-[var(--chrome-white)]'
                              : 'text-[var(--muted-lead)]'
                          )}
                        >
                          {item.label}
                        </span>

                        {/* Active Indicator */}
                        {isActive && (
                          <div
                            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99998]">
        <button
          onClick={toggleMenu}
          className={cn(
            'relative w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl overflow-hidden',
            'border-2 border-white/10 bg-[var(--slate-surface)]/90 backdrop-blur-xl',
            'hover:scale-105 active:scale-95'
          )}
        >
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-purple-500/10" />
          
          {/* Icon */}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="relative z-10"
          >
            {isOpen ? (
              <ChevronDown size={24} className="text-[var(--chrome-white)]" strokeWidth={2.5} />
            ) : (
              <ChevronUp size={24} className="text-[var(--chrome-white)]" strokeWidth={2.5} />
            )}
          </motion.div>

          {/* Subtle Pulse */}
          {!isOpen && (
            <motion.div
              className="absolute inset-0 rounded-full bg-purple-500/20"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
        </button>
      </div>
    </>,
    document.body
  );
}
