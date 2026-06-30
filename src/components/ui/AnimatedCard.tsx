import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useThemeStore } from '@/store/themeStore';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
}

export function AnimatedCard({ children, className = '', hover = true, delay = 0 }: AnimatedCardProps) {
  const { actualTheme } = useThemeStore();

  // Choose GIF based on theme - HER ZAMAN KARANLIK (SİYAH) GIF KULLAN
  const backgroundGif = '/asset/Kaliteyi_bozmadan_loop_olmasn_istiyorum_kar.gif';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`relative overflow-hidden rounded-2xl ${className}`}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-[0.25] pointer-events-none">
        <img
          src={backgroundGif}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
          style={{
            imageRendering: 'auto',
            willChange: 'auto',
          }}
        />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--slate-surface)]/95 via-[var(--slate-surface)]/90 to-[var(--slate-surface)]/95 pointer-events-none" />

      {/* Content */}
      <div className={`relative ${hover ? 'transition-transform duration-300 hover:scale-[1.02]' : ''}`}>
        {children}
      </div>
    </motion.div>
  );
}
