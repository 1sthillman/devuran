import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const CONSTANTS = {
  itemSize: 48,
  containerSize: 200, // Mobil için daha küçük
  openStagger: 0.04,
  closeStagger: 0.06
};

const pointOnArc = (i: number, n: number, r: number) => {
  // Mobil için daha dar açı - ekrandan taşmayı önlemek için
  const startAngle = 0; // Sağ
  const endAngle = 90; // Üst
  const angleRange = endAngle - startAngle;
  const angle = startAngle + (angleRange * i) / (n - 1);
  const theta = (angle * Math.PI) / 180;
  
  const x = r * Math.cos(theta);
  const y = r * Math.sin(theta);
  return { x, y };
};

interface MenuItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
}

interface MenuItemProps {
  item: MenuItem;
  index: number;
  totalItems: number;
  isOpen: boolean;
  isActive: boolean;
  onClick: () => void;
}

const MenuItem = ({ item, index, totalItems, isOpen, isActive, onClick }: MenuItemProps) => {
  const { x, y } = pointOnArc(index, totalItems, CONSTANTS.containerSize / 2);
  const [hovering, setHovering] = useState(false);
  const Icon = item.icon;

  return (
    <motion.button
      animate={{
        x: isOpen ? x : 0,
        y: isOpen ? y : 0,
        scale: isOpen ? 1 : 0,
        opacity: isOpen ? 1 : 0
      }}
      whileHover={{
        scale: isOpen ? 1.1 : 0,
        transition: { duration: 0.15, delay: 0 }
      }}
      whileTap={{ scale: 0.9 }}
      transition={{
        delay: isOpen ? index * CONSTANTS.openStagger : (totalItems - index - 1) * CONSTANTS.closeStagger,
        type: 'spring',
        stiffness: 260,
        damping: 20
      }}
      style={{
        height: CONSTANTS.itemSize,
        width: CONSTANTS.itemSize,
        pointerEvents: isOpen ? 'auto' : 'none',
        zIndex: 100
      }}
      className={cn(
        'rounded-full flex items-center justify-center absolute cursor-pointer backdrop-blur-xl border transition-colors shadow-lg',
        isActive
          ? 'bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-purple-400/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
          : 'bg-[var(--slate-surface)]/90 border-white/10 hover:bg-[var(--slate-surface)]/95 hover:border-purple-400/30'
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <Icon
        size={20}
        strokeWidth={isActive ? 2.5 : 2}
        className={cn(
          'transition-colors',
          isActive ? 'text-purple-400' : 'text-[var(--muted-lead)]'
        )}
      />
      <AnimatePresence>
        {hovering && isOpen && (
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="text-[10px] font-heading font-semibold text-[var(--chrome-white)] absolute -top-10 whitespace-nowrap bg-[var(--slate-surface)]/95 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/10 shadow-lg pointer-events-none"
          >
            {item.label}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

interface MenuTriggerProps {
  setIsOpen: (isOpen: boolean) => void;
  isOpen: boolean;
  itemsLength: number;
}

const MenuTrigger = ({ setIsOpen, isOpen, itemsLength }: MenuTriggerProps) => {
  const rotateControls = useAnimationControls();

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isOpen) {
      await rotateControls.start({
        rotate: -360,
        scale: [1, 1.1, 1],
        transition: {
          duration: CONSTANTS.closeStagger * itemsLength,
          ease: 'easeInOut'
        }
      });
      rotateControls.set({ rotate: 0 });
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  };

  return (
    <motion.div animate={rotateControls} style={{ zIndex: 101 }}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          height: CONSTANTS.itemSize,
          width: CONSTANTS.itemSize
        }}
        className={cn(
          'rounded-full flex items-center justify-center cursor-pointer outline-none transition-all duration-300 backdrop-blur-xl border shadow-lg',
          isOpen
            ? 'bg-gradient-to-br from-purple-500 to-pink-500 border-purple-400/50 shadow-[0_0_30px_rgba(168,85,247,0.4)]'
            : 'bg-[var(--slate-surface)]/95 border-white/10 hover:border-purple-400/30 shadow-[0_8px_32px_rgba(0,0,0,0.3)]'
        )}
        onClick={handleClick}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.span
              key="menu-close"
              initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <X size={20} className="text-white" strokeWidth={2.5} />
            </motion.span>
          ) : (
            <motion.span
              key="menu-open"
              initial={{ opacity: 0, rotate: 90, scale: 0.8 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: -90, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Menu size={20} className="text-[var(--chrome-white)]" strokeWidth={2.5} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </motion.div>
  );
};

interface CircularMenuProps {
  items: MenuItem[];
  activeTab: string;
  setActiveTab: (key: string) => void;
}

export const CircularMenu = ({ items, activeTab, setActiveTab }: CircularMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      style={{
        width: CONSTANTS.containerSize,
        height: CONSTANTS.containerSize
      }}
      className="relative flex items-end justify-end"
    >
      <MenuTrigger setIsOpen={setIsOpen} isOpen={isOpen} itemsLength={items.length} />
      <div className="absolute inset-0 flex items-end justify-end pointer-events-none">
        {items.map((item, index) => (
          <MenuItem
            key={item.key}
            item={item}
            index={index}
            totalItems={items.length}
            isOpen={isOpen}
            isActive={activeTab === item.key}
            onClick={() => {
              setActiveTab(item.key);
              setIsOpen(false);
            }}
          />
        ))}
      </div>
    </div>
  );
};
